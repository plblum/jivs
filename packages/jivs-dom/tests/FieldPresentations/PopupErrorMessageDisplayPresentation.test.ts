/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type {
    IErrorMessageDisplayTriggerContext
} from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IPopupContext } from '../../src/Interfaces/PopupErrorMessageDisplays';
import type { IAriaStaticUpdater } from '../../src/Interfaces/AriaUpdaters';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { defaultAriaPopupShowsValidationErrors } from '../../src/Aria/PopupErrorMessageDisplayStaticUpdater';
import {
    defaultFocusInDelay,
    defaultFocusOutDelay,
    defaultMouseoutDelay,
    defaultMouseoverDelay,
    PopupErrorMessageDisplayPresentation,
    PopupErrorMessageDisplayPresentationOptions
} from '../../src/FieldPresentations/PopupErrorMessageDisplayPresentation';
import { ColumnarErrorIndicatorContent } from '../../src/FieldPresentations/ErrorIndicatorContent/ColumnarErrorIndicatorContent';
import { MessageFrame } from '../../src/Presentations_common/MessageFrame';
import { ElementRole } from '../../src/Interfaces/Types';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { PopupService } from '../../src/Services/PopupService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { RecordingLoggingService } from '../TestSupport/mocks';
import {
    RecordingPopupContext,
    RecordingPopupMechanism
} from '../TestSupport/RecordingPopupMechanism';

interface IElementRegistryCall
{
    role: ElementRole | string;
    elementIdentifier: string | null;
}

class RecordingElementRegistry implements IElementRegistry
{
    public calls: IElementRegistryCall[] = [];
    public editors: IJivsElement[] = [];

    public getElementsByRole(
        role: ElementRole | string,
        elementIdentifier: string | null
    ): IJivsElement[]
    {
        this.calls.push({ role: role, elementIdentifier: elementIdentifier });
        return role === ElementRole.editor ? this.editors : [];
    }

    public addEditor(): void { throw new Error('Not used by this test.'); }
    public addField(): void { throw new Error('Not used by this test.'); }
    public addForm(): void { throw new Error('Not used by this test.'); }
    public setEditorJivsElement(): void { throw new Error('Not used by this test.'); }
    public getTextValueAdapterElements(): IJivsElement[] { throw new Error('Not used by this test.'); }
    public getValueAdapterElements(): IJivsElement[] { throw new Error('Not used by this test.'); }
    public getFieldPresentationElements(): IJivsElement[] { throw new Error('Not used by this test.'); }
    public getFormPresentationElements(): IJivsElement[] { throw new Error('Not used by this test.'); }
    public getFieldAriaElementInfo(): never { throw new Error('Not used by this test.'); }
    public getResolvedElementIdentifiers(): never[] { throw new Error('Not used by this test.'); }
    public getRecordForElement(): never { throw new Error('Not used by this test.'); }
    public clear(): void { throw new Error('Not used by this test.'); }
    public dispose(): void { throw new Error('Not used by this test.'); }
    public [Symbol.iterator](): Iterator<never> { throw new Error('Not used by this test.'); }
}

class Publicify_PopupErrorMessageDisplayPresentation extends PopupErrorMessageDisplayPresentation<
    { placement: string },
    PopupErrorMessageDisplayPresentationOptions
>
{
    public get publicify_element(): IJivsElement
    {
        return this.element;
    }
    public get publicify_popupContext(): IPopupContext | undefined
    {
        return this.popupContext;
    }

    public get publicify_options(): PopupErrorMessageDisplayPresentationOptions
    {
        return this.options;
    }

    public get publicify_popupOptions(): object | undefined
    {
        return this.popupOptions;
    }

    public publicify_openCore(context: IErrorMessageDisplayTriggerContext): boolean
    {
        return this.openCore(context);
    }

    public publicify_closeCore(context: IErrorMessageDisplayTriggerContext): boolean
    {
        return this.closeCore(context);
    }
    public get publicify_triggerContext(): IErrorMessageDisplayTriggerContext | undefined
    {
        return this.triggerContext;
    }

}

interface ISetup
{
    presentation: Publicify_PopupErrorMessageDisplayPresentation;
    element: IJivsElement;
    domServices: IJivsDomServices;
    popupService: PopupService;
    popupMechanism: RecordingPopupMechanism;
    elementRegistry: RecordingElementRegistry;
    valueHostsManager: IValueHostsManager;
    valueHost: IFieldValueHost;
    loggingService: RecordingLoggingService;
}

function setup(
    options?: PopupErrorMessageDisplayPresentationOptions,
    globalOptions?: PopupErrorMessageDisplayPresentationOptions,
    loggingEnabled: boolean = true
): ISetup
{
    let element = document.createElement('button') as IJivsElement;
    let popupService = new PopupService();
    let popupMechanism = new RecordingPopupMechanism();
    let elementRegistry = new RecordingElementRegistry();
    let loggingService = new RecordingLoggingService();
    let errorMessagesService = new ErrorMessagesService();
    let services = {
        errorMessagesService: errorMessagesService,
        loggingService: loggingEnabled ? loggingService : null
    } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({
        services: services,
        popupMechanism: popupMechanism,
        getPopupService: () => popupService,
        getElementRegistry: () => elementRegistry
    });
    domServices.options.popupErrorMessageDisplay = globalOptions ?? {};
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);
    let valueHostsManager = {
        services: {
            domServices: domServices,
            errorMessagesService: errorMessagesService
        },
        behaviors: { activeCultureId: 'en-US' }
    } as unknown as IValueHostsManager;
    let valueHost = {
        valueHostsManager: valueHostsManager,
        getLabel: () => 'Email',
        getElementIdentifier: () => 'email',
        getName: () => 'Email'
    } as unknown as IFieldValueHost;
    let presentation = new Publicify_PopupErrorMessageDisplayPresentation(
        element,
        new ColumnarErrorIndicatorContent({
            column2Html: '{Count} issue(s) found for {Label}'
        }),
        new MessageFrame(),
        { placement: 'bottom' },
        options
    );
    presentation.init(valueHostsManager);

    return {
        presentation: presentation,
        element: element,
        domServices: domServices,
        popupService: popupService,
        popupMechanism: popupMechanism,
        elementRegistry: elementRegistry,
        valueHostsManager: valueHostsManager,
        valueHost: valueHost,
        loggingService: loggingService
    };
}

function applyIssues(testData: ISetup, issuesFound: IssueFound[] | null): void
{
    testData.presentation.apply(testData.valueHost, {
        isValid: !issuesFound || issuesFound.length === 0,
        issuesFound: issuesFound
    } as ValueHostValidationState);
}

function addIssues(testData: ISetup, messages: string[] = ['Email is required']): IssueFound[]
{
    let issuesFound = messages.map(message => ({
        errorCode: 'Validation',
        errorMessage: message
    })) as IssueFound[];
    applyIssues(testData, issuesFound);
    return issuesFound;
}

function openPopup(testData: ISetup): RecordingPopupContext
{
    addIssues(testData);
    testData.element.click();
    return testData.popupMechanism.contexts[0];
}

// Popup presentations require both content collaborators and use resolved presentation options.
describe('PopupErrorMessageDisplayPresentation construction and options', () => {
    test('Rejects missing indicator content or popup content', () => {
        let element = document.createElement('button');
        let indicatorContent = new ColumnarErrorIndicatorContent();
        let popupContent = new MessageFrame();

        expect(() => new PopupErrorMessageDisplayPresentation(
            element,
            null as unknown as ColumnarErrorIndicatorContent,
            popupContent
        )).toThrow('errorIndicator required');

        expect(() => new PopupErrorMessageDisplayPresentation(
            element,
            indicatorContent,
            null as unknown as MessageFrame
        )).toThrow('popupContent required');
    });

    test('Uses empty popup-mechanism options when none are supplied', () => {
        let presentation = new Publicify_PopupErrorMessageDisplayPresentation(
            document.createElement('button'),
            new ColumnarErrorIndicatorContent(),
            new MessageFrame()
        );

        expect(presentation.publicify_popupOptions).toEqual({});
    });

    test('Adds popup classes, defaults keyboard access, and uses default popup behavior options', () => {
        let testData = setup();

        expect(testData.element.className).toBe(
            'jivs-errormessagedisplay jivs-triggerederrormessagedisplay jivs-popuperrormessagedisplay'
        );
        expect(testData.element.getAttribute('tabindex')).toBe('0');
        expect(testData.presentation.publicify_options.popupOnMouseOver).toBe(false);
        expect(testData.presentation.publicify_options.popupOnFocus).toBe(false);
        expect(testData.presentation.publicify_options.keyboardPopupEnabled).toBe(true);
        expect(testData.presentation.publicify_options.mouseoverDelay).toBe(defaultMouseoverDelay);
        expect(testData.presentation.publicify_options.mouseoutDelay).toBe(defaultMouseoutDelay);
        expect(testData.presentation.publicify_options.focusInDelay).toBe(defaultFocusInDelay);
        expect(testData.presentation.publicify_options.focusOutDelay).toBe(defaultFocusOutDelay);
        expect(testData.presentation.publicify_options.ariaPopupMessage)
            .toBe(defaultAriaPopupShowsValidationErrors);
    });

    test('Preserves an authored tabindex and applies variation classes', () => {
        let setupData = setup({
            variationClasses: 'compact callout',
            keyboardPopupEnabled: false,
            tabIndex: 2
        });
        setupData.element.setAttribute('tabindex', '4');
        setupData.presentation.init(setupData.valueHostsManager);

        expect(setupData.element.getAttribute('tabindex')).toBe('4');
        expect(setupData.element.classList.contains('compact')).toBe(true);
        expect(setupData.element.classList.contains('callout')).toBe(true);
    });

    test('Resolves instance behavior options ahead of global options', () => {
        let testData = setup({
            popupOnMouseOver: false,
            popupOnFocus: true,
            focusInDelay: 15,
            keyboardPopupEnabled: false
        }, {
            popupOnMouseOver: true,
            popupOnFocus: false,
            focusInDelay: 90,
            keyboardPopupEnabled: true
        });

        expect(testData.presentation.publicify_options.popupOnMouseOver).toBe(false);
        expect(testData.presentation.publicify_options.popupOnFocus).toBe(true);
        expect(testData.presentation.publicify_options.focusInDelay).toBe(15);
        expect(testData.presentation.publicify_options.keyboardPopupEnabled).toBe(false);
        expect(testData.element.hasAttribute('tabindex')).toBe(true);
    });

    test('Uses global popup options when there are no instance overrides', () => {
        let testData = setup(undefined, {
            popupOnMouseOver: true,
            mouseoverDelay: 35,
            keyboardPopupEnabled: false
        });

        expect(testData.presentation.publicify_options.popupOnMouseOver).toBe(true);
        expect(testData.presentation.publicify_options.mouseoverDelay).toBe(35);
        expect(testData.presentation.publicify_options.keyboardPopupEnabled).toBe(false);
        expect(testData.element.hasAttribute('tabindex')).toBe(false);
    });
});

// Initialization wires real content services and requires a configured popup mechanism.
describe('PopupErrorMessageDisplayPresentation.init', () => {
    test('Throws if DOM services have no popup mechanism', () => {
        let testData = setup();
        testData.domServices.popupMechanism = null;

        expect(() => testData.presentation.init(testData.valueHostsManager))
            .toThrow('Popup mechanism not available in DOM services.');
    });

    test('Does not overwrite existing role or tabindex attributes', () => {
        let testData = setup({ popupOnFocus: true, keyboardPopupEnabled: true, tabIndex: 5 });
        testData.element.setAttribute('tabindex', '7');
        testData.element.setAttribute('role', 'link');

        testData.presentation.init(testData.valueHostsManager);

        expect(testData.element.getAttribute('tabindex')).toBe('7');
        expect(testData.element.getAttribute('role')).toBe('link');
    });
});

// Validation updates the indicator before exposing issue state and clears both when issues disappear.
describe('PopupErrorMessageDisplayPresentation.apply', () => {
    test('Renders issue count and field label in the indicator content', () => {
        let testData = setup();
        addIssues(testData, ['Required', 'Must be valid']);

        expect(testData.element.querySelector('.jivs-column2')?.textContent)
            .toBe('2 issue(s) found for Email');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(true);
    });

    test('Clears indicator content and issue styling for empty, null, or undefined issues', () => {
        let testData = setup();
        addIssues(testData);

        applyIssues(testData, []);
        expect(testData.element.textContent).toBe('');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);

        addIssues(testData);
        applyIssues(testData, null);
        expect(testData.element.textContent).toBe('');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);

        addIssues(testData);
        applyIssues(testData, undefined as unknown as IssueFound[] | null);
        expect(testData.element.textContent).toBe('');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);
    });
});

// Opening creates a popup context, renders the message frame, and marks every participating element as open.
describe('PopupErrorMessageDisplayPresentation.open', () => {
    test('Passes popup options, content, and presentation context to the popup mechanism', () => {
        let testData = setup();
        let issuesFound = addIssues(testData);

        testData.element.click();

        let popupContext = testData.popupMechanism.contexts[0];
        expect(testData.popupMechanism.createCalls).toEqual([{ options: { placement: 'bottom' } }]);
        expect(testData.popupMechanism.openCalls).toEqual([popupContext]);
        expect(popupContext.controller).toBe(testData.presentation);
        expect(popupContext.domServices).toBe(testData.domServices);
        expect(popupContext.anchorElement).toBe(testData.element);
        expect(popupContext.messageFrameContent?.textContent).toBe('Email is required');
        expect(testData.presentation.publicify_popupContext).toBe(popupContext);
        expect(issuesFound).toEqual([{ errorCode: 'Validation', errorMessage: 'Email is required' }]);
    });

    test('Uses a matching anchor selector and falls back to the presentation element when not found', () => {
        let anchor = document.createElement('section');
        anchor.id = 'popup-anchor';
        document.body.appendChild(anchor);
        let testData = setup({ anchorSelector: '#popup-anchor', keyboardPopupEnabled: false });
        openPopup(testData);

        expect(testData.popupMechanism.contexts[0].anchorElement).toBe(anchor);

        let fallback = setup({ anchorSelector: '#missing-anchor', keyboardPopupEnabled: false });
        openPopup(fallback);

        expect(fallback.popupMechanism.contexts[0].anchorElement).toBe(fallback.element);
        anchor.remove();
    });

    test('Falls back to the presentation element when the selector matches a non-HTML element', () => {
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'svg-anchor';
        document.body.appendChild(svg);
        let testData = setup({ anchorSelector: '#svg-anchor', keyboardPopupEnabled: false });
        openPopup(testData);

        expect(testData.popupMechanism.contexts[0].anchorElement).toBe(testData.element);
        svg.remove();
    });

    test('Disposes the popup context and leaves presentation closed when the mechanism rejects opening', () => {
        let testData = setup();
        addIssues(testData);
        testData.popupMechanism.openResult = false;

        testData.element.click();

        let popupContext = testData.popupMechanism.contexts[0];
        expect(popupContext.disposeCalls).toBe(1);
        expect(popupContext.messageFrameContent).toBeNull();
        expect(testData.presentation.publicify_popupContext).toBeUndefined();
        expect(testData.element.classList.contains('jivs-open')).toBe(false);
        expect(testData.element.classList.contains('jivs-popup-open')).toBe(false);
    });

    test('Sets popup-open styling on the associated editor when one is registered', () => {
        let testData = setup();
        let editor = document.createElement('input') as IJivsElement;
        testData.elementRegistry.editors = [editor];

        openPopup(testData);

        expect(editor.classList.contains('jivs-popup-open')).toBe(true);
        expect(testData.elementRegistry.calls).toEqual([
            { role: ElementRole.editor, elementIdentifier: 'email' }
        ]);

        testData.presentation.close(testData.presentation.publicify_triggerContext!, 0);

        expect(editor.classList.contains('jivs-popup-open')).toBe(false);
        expect(testData.elementRegistry.calls).toHaveLength(2);
    });

    test('Opens on keyboard activation and prevents the key default action', () => {
        let testData = setup();
        addIssues(testData);
        let event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });

        testData.element.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(testData.popupMechanism.openCalls).toHaveLength(1);
    });

    test('Opens on Space activation and prevents the key default action', () => {
        let testData = setup();
        addIssues(testData);
        let event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

        testData.element.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(testData.popupMechanism.openCalls).toHaveLength(1);
    });
});

// Configured mouse and focus triggers use the resolved delay values and remain disabled by default.
describe('PopupErrorMessageDisplayPresentation optional triggers', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    test('Opens on mouseover and closes on mouseout using configured delays', () => {
        jest.useFakeTimers();
        let testData = setup({
            popupOnMouseOver: true,
            mouseoverDelay: 20,
            mouseoutDelay: 30,
            keyboardPopupEnabled: false
        });
        addIssues(testData);

        testData.element.dispatchEvent(new MouseEvent('mouseover'));
        jest.advanceTimersByTime(19);
        expect(testData.popupMechanism.openCalls).toHaveLength(0);
        jest.advanceTimersByTime(1);
        expect(testData.popupMechanism.openCalls).toHaveLength(1);

        testData.element.dispatchEvent(new MouseEvent('mouseout'));
        jest.advanceTimersByTime(29);
        expect(testData.popupMechanism.closeCalls).toHaveLength(0);
        jest.advanceTimersByTime(1);
        expect(testData.popupMechanism.closeCalls).toHaveLength(1);
    });

    test('Opens on focus-in and closes on focus-out using configured delays', () => {
        jest.useFakeTimers();
        let testData = setup({
            popupOnFocus: true,
            focusInDelay: 10,
            focusOutDelay: 15,
            keyboardPopupEnabled: false
        });
        addIssues(testData);

        testData.element.dispatchEvent(new FocusEvent('focusin'));
        jest.advanceTimersByTime(10);
        expect(testData.popupMechanism.openCalls).toHaveLength(1);

        testData.element.dispatchEvent(new FocusEvent('focusout'));
        jest.advanceTimersByTime(15);
        expect(testData.popupMechanism.closeCalls).toHaveLength(1);
    });

    test('Uses default delays when enabled triggers receive null delay options', () => {
        jest.useFakeTimers();
        let testData = setup({
            popupOnMouseOver: true,
            mouseoverDelay: null as unknown as number,
            mouseoutDelay: null as unknown as number,
            popupOnFocus: true,
            focusInDelay: null as unknown as number,
            focusOutDelay: null as unknown as number,
            keyboardPopupEnabled: false
        });
        addIssues(testData);

        testData.element.dispatchEvent(new MouseEvent('mouseover'));
        jest.advanceTimersByTime(defaultMouseoverDelay);
        expect(testData.popupMechanism.openCalls).toHaveLength(1);
        testData.element.dispatchEvent(new MouseEvent('mouseout'));
        jest.advanceTimersByTime(defaultMouseoutDelay);
        expect(testData.popupMechanism.closeCalls).toHaveLength(1);

        testData.element.dispatchEvent(new FocusEvent('focusin'));
        jest.advanceTimersByTime(defaultFocusInDelay);
        expect(testData.popupMechanism.openCalls).toHaveLength(2);
        testData.element.dispatchEvent(new FocusEvent('focusout'));
        jest.advanceTimersByTime(defaultFocusOutDelay);
        expect(testData.popupMechanism.closeCalls).toHaveLength(2);
    });

    test('Does not add tabindex if keyboard and focus activation are both disabled', () => {
        let testData = setup({ popupOnFocus: false, keyboardPopupEnabled: false });

        expect(testData.element.hasAttribute('tabindex')).toBe(false);
    });
});

// Closing disposes popup resources; exceptional close failures are logged and cleaned up safely.
describe('PopupErrorMessageDisplayPresentation.close', () => {
    test('Returns success when there is no popup context to close', () => {
        let testData = setup();

        expect(testData.presentation.publicify_closeCore(
            {} as IErrorMessageDisplayTriggerContext
        )).toBe(true);
        expect(testData.popupMechanism.closeCalls).toHaveLength(0);
    });

    test('Disposes popup context and removes popup classes after a successful close', () => {
        let testData = setup();
        let popupContext = openPopup(testData);

        testData.presentation.close(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.popupMechanism.closeCalls).toEqual([popupContext]);
        expect(popupContext.disposeCalls).toBe(1);
        expect(testData.presentation.publicify_popupContext).toBeUndefined();
        expect(testData.element.classList.contains('jivs-open')).toBe(false);
        expect(testData.element.classList.contains('jivs-popup-open')).toBe(false);
    });

    test('Retains popup state when the mechanism reports a close failure', () => {
        let testData = setup();
        let popupContext = openPopup(testData);
        testData.popupMechanism.closeResult = false;
        testData.popupMechanism.closeControllerOnSuccess = false;

        testData.presentation.close(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.presentation.publicify_popupContext).toBe(popupContext);
        expect(popupContext.disposeCalls).toBe(0);
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
    });

    test('Logs and cleans up when the popup mechanism throws during close', () => {
        let testData = setup();
        testData.element.id = 'email-popup';
        let popupContext = openPopup(testData);
        testData.popupMechanism.closeError = new Error('close failed');

        testData.presentation.close(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.loggingService.calls).toHaveLength(1);
        expect(testData.loggingService.calls[0]).toEqual({
            level: LoggingLevel.Error,
            details: {
                message: 'Error closing popup: close failed',
                feature: 'Dom',
                data: { idAttribute: 'email-popup' }
            }
        });
        expect(popupContext.disposeCalls).toBe(1);
        expect(testData.presentation.publicify_popupContext).toBeUndefined();
        expect(testData.element.classList.contains('jivs-open')).toBe(false);
    });

    test('Logs a string thrown by the popup mechanism and cleans up the context', () => {
        let testData = setup();
        let popupContext = openPopup(testData);
        testData.popupMechanism.closeError = 'close failed';

        testData.presentation.close(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.loggingService.calls[0].details?.message)
            .toBe('Error closing popup: close failed');
        expect(popupContext.disposeCalls).toBe(1);
        expect(testData.presentation.publicify_popupContext).toBeUndefined();
    });

    test('Completes cleanup if the logger is unavailable', () => {
        let testData = setup(undefined, undefined, false);
        let popupContext = openPopup(testData);
        testData.popupMechanism.closeError = new Error('close failed');

        expect(() => testData.presentation.close(
            testData.presentation.publicify_triggerContext!,
            0
        )).not.toThrow();

        expect(popupContext.disposeCalls).toBe(1);
        expect(testData.presentation.publicify_popupContext).toBeUndefined();
    });

    test('Runs completion callbacks safely before DOM services have been initialized', () => {
        let presentation = new Publicify_PopupErrorMessageDisplayPresentation(
            document.createElement('button'),
            new ColumnarErrorIndicatorContent(),
            new MessageFrame()
        );

        presentation.opened();
        expect(presentation.publicify_element.classList.contains('jivs-popup-open')).toBe(true);
        presentation.closed();
        expect(presentation.publicify_element.classList.contains('jivs-popup-open')).toBe(false);
    });

    test('Does not recreate popup context when openCore is called without trigger initialization', () => {
        let testData = setup();

        expect(() => testData.presentation.publicify_openCore(
            {} as IErrorMessageDisplayTriggerContext
        )).toThrow('Trigger context not set before opening popup.');
    });

    test('Rejects direct opening when trigger context has no current issues', () => {
        let testData = setup();
        applyIssues(testData, []);

        expect(() => testData.presentation.publicify_openCore(
            testData.presentation.publicify_triggerContext!
        )).toThrow('No issues found before opening popup.');
    });
});

// Static ARIA setup honors configured accessible names, and disposal releases an active popup context.
describe('PopupErrorMessageDisplayPresentation ARIA and disposal', () => {
    test('Returns a static updater configured with the resolved accessible name', () => {
        let testData = setup({ ariaPopupMessage: 'Review email errors' });
        let updater = testData.presentation.getStaticAriaUpdater() as IAriaStaticUpdater;

        updater.applyStaticAttributes(testData.element, ElementRole.error, testData.valueHost);

        expect(testData.element.getAttribute('role')).toBe('button');
        expect(testData.element.getAttribute('aria-label')).toBe('Review email errors');
    });

    test('Disposes the active popup context without asking the mechanism to close', () => {
        let testData = setup();
        let popupContext = openPopup(testData);

        testData.presentation.dispose();

        expect(popupContext.disposeCalls).toBe(1);
        expect(popupContext.messageFrameContent).toBeNull();
        expect(testData.popupMechanism.closeCalls).toHaveLength(0);
        expect(testData.presentation.publicify_popupContext).toBeUndefined();
    });
});
