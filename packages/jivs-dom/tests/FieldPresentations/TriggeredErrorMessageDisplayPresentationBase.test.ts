/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import {
    IErrorMessageDisplayTrigger,
    IErrorMessageDisplayTriggerContext,
    TriggerState
} from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IPopupContext } from '../../src/Interfaces/PopupErrorMessageDisplays';
import { ColumnarErrorIndicatorContent } from '../../src/FieldPresentations/ErrorIndicatorContent/ColumnarErrorIndicatorContent';
import { PopupContext } from '../../src/FieldPresentations/PopupContext';
import { PopupErrorMessageDisplayPresentation } from '../../src/FieldPresentations/PopupErrorMessageDisplayPresentation';
import { MessageFrame } from '../../src/Presentations_common/MessageFrame';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { PopupService } from '../../src/Services/PopupService';
import {
    TriggeredErrorMessageDisplayPresentationBase,
    TriggeredErrorMessageDisplayPresentationBaseOptions
} from '../../src/FieldPresentations/TriggeredErrorMessageDisplayPresentationBase';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { RecordingErrorMessageDisplayTrigger } from '../TestSupport/RecordingErrorMessageDisplayTrigger';
import { RecordingPopupService } from '../TestSupport/RecordingPopupService';
import { RecordingPopupMechanism } from '../TestSupport/RecordingPopupMechanism';

afterEach(() => {
    jest.useRealTimers();
});

interface ICoreCall
{
    context: IErrorMessageDisplayTriggerContext;
}

class TestTriggeredErrorMessageDisplayPresentation extends
    TriggeredErrorMessageDisplayPresentationBase<TriggeredErrorMessageDisplayPresentationBaseOptions>
{
    public openCalls: ICoreCall[] = [];
    public closeCalls: ICoreCall[] = [];
    public openResult: boolean = true;
    public closeResult: boolean = true;
    public openAction?: () => void;
    public closeAction?: () => void;

    public constructor(element: HTMLElement, options?: TriggeredErrorMessageDisplayPresentationBaseOptions)
    {
        super(element, options);
    }

    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.popupErrorMessageDisplay;
    }

    public get publicify_triggerContext(): IErrorMessageDisplayTriggerContext | undefined
    {
        return this.triggerContext;
    }

    public get publicify_triggerState(): TriggerState
    {
        return this.triggerState;
    }

    public publicify_setTriggerState(value: TriggerState): void
    {
        this.triggerState = value;
    }

    protected override openCore(context: IErrorMessageDisplayTriggerContext): boolean
    {
        this.openCalls.push({ context: context });
        this.openAction?.();
        return this.openResult;
    }

    protected override closeCore(context: IErrorMessageDisplayTriggerContext): boolean
    {
        this.closeCalls.push({ context: context });
        this.closeAction?.();
        return this.closeResult;
    }
}

interface ISetup
{
    presentation: TestTriggeredErrorMessageDisplayPresentation;
    element: HTMLElement;
    domServices: IJivsDomServices;
    popupService: RecordingPopupService;
    valueHostsManager: IValueHostsManager;
    valueHost: IFieldValueHost;
}

function setup(
    instanceOptions?: TriggeredErrorMessageDisplayPresentationBaseOptions,
    globalOptions?: TriggeredErrorMessageDisplayPresentationBaseOptions
): ISetup
{
    let element = document.createElement('div');
    let popupService = new RecordingPopupService();
    let domServices = createMockJivsDomServices({
        getPopupService: () => popupService
    });
    domServices.options.popupErrorMessageDisplay = globalOptions ?? {};
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    let valueHost = {
        valueHostsManager: valueHostsManager
    } as unknown as IFieldValueHost;
    let presentation = new TestTriggeredErrorMessageDisplayPresentation(
        element,
        instanceOptions
    );

    presentation.init(valueHostsManager);

    return {
        presentation: presentation,
        element: element,
        domServices: domServices,
        popupService: popupService,
        valueHostsManager: valueHostsManager,
        valueHost: valueHost
    };
}

function applyIssues(testData: ISetup, issuesFound?: IssueFound[] | null): void
{
    testData.presentation.apply(testData.valueHost, {
        isValid: !issuesFound || issuesFound.length === 0,
        issuesFound: issuesFound
    } as ValueHostValidationState);
}

function initializeWithIssues(testData: ISetup, issuesFound?: IssueFound[]): void
{
    applyIssues(testData, issuesFound ?? [{ errorMessage: 'Invalid' }] as IssueFound[]);
}

// Triggered displays add their stable CSS contract and default to an empty trigger list.
describe('TriggeredErrorMessageDisplayPresentationBase identity and options', () => {
    test('Adds its persistent classes and inherits the issue-state class', () => {
        let testData = setup();

        expect(testData.element.className).toBe(
            'jivs-errormessagedisplay jivs-triggerederrormessagedisplay'
        );
        expect(testData.presentation.hasIssuesClass).toEqual(['jivs-has-issues']);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
    });

    test('Copies the instance trigger list so later caller mutations do not change the configured list', () => {
        let trigger = new RecordingErrorMessageDisplayTrigger();
        let triggers = [trigger];
        let testData = setup({ triggers: triggers });
        triggers.length = 0;

        initializeWithIssues(testData);

        expect(trigger.installCalls).toHaveLength(1);
    });

    test('Treats a null trigger list as empty', () => {
        let testData = setup({
            triggers: null as unknown as IErrorMessageDisplayTrigger[]
        });

        expect(() => initializeWithIssues(testData)).not.toThrow();
        expect(testData.popupService.registerCalls).toHaveLength(1);
    });

    test('Uses global triggers by default and lets instance triggers override them', () => {
        let globalTrigger = new RecordingErrorMessageDisplayTrigger();
        let instanceTrigger = new RecordingErrorMessageDisplayTrigger();
        let fromGlobal = setup(undefined, { triggers: [globalTrigger] });
        let fromInstance = setup(
            { triggers: [instanceTrigger] },
            { triggers: [globalTrigger] }
        );

        initializeWithIssues(fromGlobal);
        initializeWithIssues(fromInstance);

        expect(globalTrigger.installCalls).toHaveLength(1);
        expect(instanceTrigger.installCalls).toHaveLength(1);
    });
});

// The first validation update creates one trigger context, installs each trigger, and registers with popup management.
describe('TriggeredErrorMessageDisplayPresentationBase trigger initialization', () => {
    test('Installs triggers once and registers a context factory with the popup service', () => {
        let trigger = new RecordingErrorMessageDisplayTrigger();
        let testData = setup({ triggers: [trigger] });

        applyIssues(testData, [{ errorMessage: 'First' }] as IssueFound[]);
        applyIssues(testData, [{ errorMessage: 'Second' }] as IssueFound[]);

        let context = testData.presentation.publicify_triggerContext!;
        expect(trigger.installCalls).toEqual([context]);
        expect(testData.popupService.registerCalls).toHaveLength(1);
        expect(testData.popupService.registerCalls[0].controller).toBe(testData.presentation);
        expect(testData.popupService.registerCalls[0].contextFactory()).toBe(context);
        expect(context.jivsElement).toBe(testData.element);
        expect(context.domServices).toBe(testData.domServices);
        expect(context.valueHost).toBe(testData.valueHost);
        expect(context.controller).toBe(testData.presentation);
        expect(context.issuesFound).toEqual([{ errorMessage: 'Second' }]);
    });

    test('Clears context issues when validation contains no issues', () => {
        let testData = setup();
        initializeWithIssues(testData);

        applyIssues(testData, []);

        expect(testData.presentation.publicify_triggerContext?.issuesFound).toBeNull();
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);
    });
});

// Opening requires issues, prepares popup coordination, and reflects successful or failed core transitions.
describe('TriggeredErrorMessageDisplayPresentationBase.open', () => {
    test('Does not open or prepare popup coordination when there are no issues', () => {
        let testData = setup();
        applyIssues(testData, []);
        let context = testData.presentation.publicify_triggerContext!;

        testData.presentation.open(context, 0);

        expect(testData.presentation.openCalls).toHaveLength(0);
        expect(testData.popupService.prepareToOpenCalls).toHaveLength(0);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
    });

    test('Prepares popup management and adds open state after a successful immediate open', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;

        testData.presentation.open(context, 0);

        expect(testData.popupService.prepareToOpenCalls).toEqual([testData.presentation]);
        expect(testData.presentation.openCalls).toEqual([{ context: context }]);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
    });

    test('Leaves a failed open closed and does not apply open styling', () => {
        let testData = setup();
        initializeWithIssues(testData);
        testData.presentation.openResult = false;

        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
        expect(testData.element.classList.contains('jivs-open')).toBe(false);
    });

    test('Stops opening if popup preparation changes the transition state', () => {
        let testData = setup();
        initializeWithIssues(testData);
        testData.popupService.prepareToOpenAction = controller => controller.closed();

        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.popupService.prepareToOpenCalls).toEqual([testData.presentation]);
        expect(testData.presentation.openCalls).toHaveLength(0);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
    });

    test('Keeps a state change made by openCore instead of applying a stale open result', () => {
        let testData = setup();
        initializeWithIssues(testData);
        testData.presentation.openAction = () => testData.presentation.opened();

        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.presentation.openCalls).toHaveLength(1);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
    });

    test('Does not run the open core again when already open or opening', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;

        testData.presentation.open(context, 0);
        testData.presentation.open(context, 0);
        testData.presentation.openResult = false;

        testData.presentation.open(context, 0);

        expect(testData.presentation.openCalls).toHaveLength(1);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
    });
});

// Closing, external completion callbacks, and cancellation keep visual state aligned with transition state.
describe('TriggeredErrorMessageDisplayPresentationBase.close and completion', () => {
    test('Closes an open display and removes its open class', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);

        testData.presentation.close(context, 0);

        expect(testData.presentation.closeCalls).toEqual([{ context: context }]);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
        expect(testData.element.classList.contains('jivs-open')).toBe(false);
    });

    test('Keeps a failed close open and retains its open class', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.closeResult = false;

        testData.presentation.close(context, 0);

        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
    });

    test('Keeps a state change made by closeCore instead of applying a stale close result', () => {
        let testData = setup();
        initializeWithIssues(testData);
        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);
        testData.presentation.closeAction = () => testData.presentation.opened();

        testData.presentation.close(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.presentation.closeCalls).toHaveLength(1);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
    });

    test('Closed completion is safe to repeat and removes open styling after an external close', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);

        testData.presentation.closed();
        testData.presentation.closed();

        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
        expect(testData.element.classList.contains('jivs-open')).toBe(false);
    });

    test('Opening during a closing transition cancels the close and restores open state', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.close(context, 100);

        testData.presentation.open(context, 0);

        expect(testData.presentation.closeCalls).toHaveLength(0);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
    });

    test('Closing during an opening transition cancels the pending open', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 100);

        testData.presentation.close(context, 0);
        jest.runOnlyPendingTimers();

        expect(testData.presentation.openCalls).toHaveLength(0);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
    });

    test('Forces completion when close is called with no delay during a closing transition', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.close(context, 100);

        testData.presentation.close(context, 0);

        expect(testData.presentation.closeCalls).toEqual([{ context: context }]);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
    });
});

// toggle() chooses the opposite transition for each stable or in-progress state.
describe('TriggeredErrorMessageDisplayPresentationBase.toggle', () => {
    test('Opens when closed and closes when open', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;

        testData.presentation.toggle(context, 0, 0);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
        testData.presentation.toggle(context, 0, 0);

        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
        expect(testData.presentation.openCalls).toHaveLength(1);
        expect(testData.presentation.closeCalls).toHaveLength(1);
    });

    test('Reopens when closing and closes when opening', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.close(context, 100);

        testData.presentation.toggle(context, 0, 0);

        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);

        testData.presentation.close(context, 100);
        testData.presentation.toggle(context, 0, 0);

        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
    });

    test('Closes immediately when toggled during a delayed opening', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 100);

        testData.presentation.toggle(context, 0, 0);
        jest.runOnlyPendingTimers();

        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
        expect(testData.presentation.openCalls).toHaveLength(0);
    });
});

// Validation refreshes trigger context and reopens only if the display was open and issues remain.
describe('TriggeredErrorMessageDisplayPresentationBase.apply refresh', () => {
    test('Closes and reopens a previously open display with the latest issues', () => {
        let testData = setup();
        initializeWithIssues(testData, [{ errorMessage: 'Old issue' }] as IssueFound[]);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);

        applyIssues(testData, [{ errorMessage: 'Updated issue' }] as IssueFound[]);

        expect(testData.presentation.closeCalls).toEqual([{ context: context }]);
        expect(testData.presentation.openCalls).toEqual([
            { context: context },
            { context: context }
        ]);
        expect(context.issuesFound).toEqual([{ errorMessage: 'Updated issue' }]);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
    });

    test('Closes a previously open display without reopening when the issues clear', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);

        applyIssues(testData, []);

        expect(testData.presentation.closeCalls).toEqual([{ context: context }]);
        expect(testData.presentation.openCalls).toHaveLength(1);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
        expect(context.issuesFound).toBeNull();
    });

    test('Reopens after validation refresh when the display was in a closing transition', () => {
        let testData = setup();
        initializeWithIssues(testData, [{ errorMessage: 'Old issue' }] as IssueFound[]);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.close(context, 100);

        applyIssues(testData, [{ errorMessage: 'Updated issue' }] as IssueFound[]);

        expect(testData.presentation.closeCalls).toEqual([{ context: context }]);
        expect(testData.presentation.openCalls).toEqual([
            { context: context },
            { context: context }
        ]);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
    });
});

// Delayed actions can be superseded or canceled without running stale transition callbacks.
describe('TriggeredErrorMessageDisplayPresentationBase delayed transitions', () => {
    test('Runs open core only after the configured open delay', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;

        testData.presentation.open(context, 50);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.opening);
        expect(testData.presentation.openCalls).toHaveLength(0);

        jest.advanceTimersByTime(49);
        expect(testData.presentation.openCalls).toHaveLength(0);
        jest.advanceTimersByTime(1);

        expect(testData.presentation.openCalls).toEqual([{ context: context }]);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
    });

    test('Does not schedule a second open while an open transition is already pending', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;

        testData.presentation.open(context, 50);
        testData.presentation.open(context, 10);
        jest.advanceTimersByTime(10);

        expect(testData.presentation.openCalls).toHaveLength(0);
        jest.advanceTimersByTime(40);
        expect(testData.presentation.openCalls).toEqual([{ context: context }]);
    });

    test('Leaves an existing delayed close unchanged when another delayed close is requested', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.close(context, 25);

        testData.presentation.close(context, 50);
        jest.advanceTimersByTime(25);

        expect(testData.presentation.closeCalls).toEqual([{ context: context }]);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
    });

    test('Cancels a pending open when close is requested during opening', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;

        testData.presentation.open(context, 50);
        testData.presentation.close(context, 0);
        jest.runOnlyPendingTimers();

        expect(testData.presentation.openCalls).toHaveLength(0);
        expect(testData.presentation.closeCalls).toHaveLength(0);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
    });

    test('Ignores an expired delayed open if another action already changed its state', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 50);
        testData.presentation.publicify_setTriggerState(TriggerState.closed);

        jest.advanceTimersByTime(50);

        expect(testData.presentation.openCalls).toHaveLength(0);
        expect(testData.popupService.prepareToOpenCalls).toHaveLength(0);
    });

    test('Ignores an expired delayed close if another action already changed its state', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.close(context, 50);
        testData.presentation.publicify_setTriggerState(TriggerState.open);

        jest.advanceTimersByTime(50);

        expect(testData.presentation.closeCalls).toHaveLength(0);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
    });

    test('Cancels a delayed close when asked to keep the display open', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.close(context, 50);

        testData.presentation.cancelDelayedClose();
        jest.runOnlyPendingTimers();

        expect(testData.presentation.closeCalls).toHaveLength(0);
        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.open);
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
    });

    test('Does not alter state when cancelDelayedClose is called outside closing state', () => {
        let testData = setup();

        testData.presentation.cancelDelayedClose();

        expect(testData.presentation.publicify_triggerState).toBe(TriggerState.closed);
    });
});

// Disposal unregisters popup coordination, releases the trigger context, and cancels pending timers.
describe('TriggeredErrorMessageDisplayPresentationBase.dispose', () => {
    test('Unregisters and disposes its trigger context', () => {
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;

        testData.presentation.dispose();

        expect(testData.popupService.unregisterCalls).toEqual([testData.presentation]);
        expect(testData.presentation.publicify_triggerContext).toBeUndefined();
        expect(context.issuesFound).toBeNull();
        expect(context.valueHost).toBeUndefined();
        expect(context.jivsElement).toBeUndefined();
    });

    test('Cancels a pending delayed open', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 50);

        testData.presentation.dispose();
        jest.runOnlyPendingTimers();

        expect(testData.presentation.openCalls).toHaveLength(0);
    });

    test('Cancels a pending delayed close', () => {
        jest.useFakeTimers();
        let testData = setup();
        initializeWithIssues(testData);
        let context = testData.presentation.publicify_triggerContext!;
        testData.presentation.open(context, 0);
        testData.presentation.close(context, 50);

        testData.presentation.dispose();
        jest.runOnlyPendingTimers();

        expect(testData.presentation.closeCalls).toHaveLength(0);
        expect(testData.popupService.unregisterCalls).toEqual([testData.presentation]);
    });
});

interface IConcretePopupSetup
{
    presentation: PopupErrorMessageDisplayPresentation;
    element: HTMLElement;
    valueHost: IFieldValueHost;
}

function setupConcretePopup(
    identifier: string,
    popupService: PopupService,
    popupMechanism: RecordingPopupMechanism
): IConcretePopupSetup
{
    let element = document.createElement('button');
    let errorMessagesService = new ErrorMessagesService();
    let services = { errorMessagesService: errorMessagesService } as unknown as IJivsServices;
    let elementRegistry = {
        getElementsByRole: () => []
    } as unknown as IElementRegistry;
    let domServices = createMockJivsDomServices({
        services: services,
        popupMechanism: popupMechanism,
        getPopupService: () => popupService,
        getElementRegistry: () => elementRegistry
    });
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);
    let valueHostsManager = {
        services: { domServices: domServices },
        behaviors: { activeCultureId: 'en-US' }
    } as unknown as IValueHostsManager;
    let valueHost = {
        valueHostsManager: valueHostsManager,
        getLabel: () => identifier,
        getElementIdentifier: () => identifier
    } as unknown as IFieldValueHost;
    let presentation = new PopupErrorMessageDisplayPresentation(
        element,
        new ColumnarErrorIndicatorContent({ column2Html: '{Count} issue(s) for {Label}' }),
        new MessageFrame(),
        undefined,
        { keyboardPopupEnabled: false }
    );
    presentation.init(valueHostsManager);

    return {
        presentation: presentation,
        element: element,
        valueHost: valueHost
    };
}

function applyConcretePopupIssues(
    testData: IConcretePopupSetup,
    issuesFound: IssueFound[] | null
): void
{
    testData.presentation.apply(testData.valueHost, {
        isValid: !issuesFound || issuesFound.length === 0,
        issuesFound: issuesFound
    } as ValueHostValidationState);
}

// The concrete popup presentation integrates the triggered base with real popup services, contexts, triggers, and content.
describe('TriggeredErrorMessageDisplayPresentationBase integration with popup implementations', () => {
    test('Opens and closes through a real PopupService and real PopupContext', () => {
        let popupService = new PopupService();
        let popupMechanism = new RecordingPopupMechanism();
        let testData = setupConcretePopup('email', popupService, popupMechanism);
        let issuesFound = [{ errorCode: 'Required', errorMessage: 'Email is required' }] as IssueFound[];

        applyConcretePopupIssues(testData, issuesFound);
        testData.element.click();

        let popupContext = popupMechanism.createdContexts[0];
        expect(popupService).toBeInstanceOf(PopupService);
        expect(popupContext).toBeInstanceOf(PopupContext);
        expect(popupMechanism.openCalls).toEqual([popupContext]);
        expect(popupContext.controller).toBe(testData.presentation);
        expect(popupContext.anchorElement).toBe(testData.element);
        expect(popupContext.messageFrameContent?.textContent).toBe('Email is required');
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
        expect(testData.element.classList.contains('jivs-popup-open')).toBe(true);

        popupService.closePopups();

        expect(popupMechanism.closeCalls).toEqual([popupContext]);
        expect(popupContext.messageFrameContent).toBeNull();
        expect(popupContext.controller).toBeNull();
        expect(testData.element.classList.contains('jivs-open')).toBe(false);
        expect(testData.element.classList.contains('jivs-popup-open')).toBe(false);
    });

    test('Closes an existing popup before opening another registered presentation', () => {
        let popupService = new PopupService();
        let popupMechanism = new RecordingPopupMechanism();
        let first = setupConcretePopup('email', popupService, popupMechanism);
        let second = setupConcretePopup('phone', popupService, popupMechanism);

        applyConcretePopupIssues(first, [
            { errorMessage: 'Email is invalid' }
        ] as IssueFound[]);
        applyConcretePopupIssues(second, [
            { errorMessage: 'Phone is invalid' }
        ] as IssueFound[]);
        first.element.click();
        let firstPopupContext = popupMechanism.createdContexts[0];

        second.element.click();

        let secondPopupContext = popupMechanism.createdContexts[1];
        expect(popupMechanism.closeCalls).toEqual([firstPopupContext]);
        expect(firstPopupContext.messageFrameContent).toBeNull();
        expect(first.element.classList.contains('jivs-open')).toBe(false);
        expect(secondPopupContext.messageFrameContent?.textContent).toBe('Phone is invalid');
        expect(second.element.classList.contains('jivs-open')).toBe(true);
        expect(popupMechanism.openCalls).toEqual([firstPopupContext, secondPopupContext]);
    });

    test('Refreshes the open popup content when validation changes', () => {
        let popupService = new PopupService();
        let popupMechanism = new RecordingPopupMechanism();
        let testData = setupConcretePopup('email', popupService, popupMechanism);

        applyConcretePopupIssues(testData, [
            { errorMessage: 'Old message' }
        ] as IssueFound[]);
        testData.element.click();
        let firstPopupContext = popupMechanism.createdContexts[0];

        applyConcretePopupIssues(testData, [
            { errorMessage: 'Updated message' }
        ] as IssueFound[]);

        let refreshedPopupContext = popupMechanism.createdContexts[1];
        expect(popupMechanism.closeCalls).toEqual([firstPopupContext]);
        expect(firstPopupContext.messageFrameContent).toBeNull();
        expect(refreshedPopupContext.messageFrameContent?.textContent).toBe('Updated message');
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
    });
});
