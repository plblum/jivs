/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IEditorAdapterDefinition } from '../../src/Interfaces/EditorAdapterDefinitions';
import type {
    IErrorMessageDisplayController,
    IErrorMessageDisplayTriggerContext
} from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type {
    TargetErrorMessageDisplayPresentationOptions,
    TargetMessageClearDetail,
    TargetMessageShowDetail
} from '../../src/FieldPresentations/TargetErrorMessageDisplayPresentation';
import {
    defaultTargetErrorMessageDisplayPresentationName,
    jivsMessageClearEventName,
    jivsMessageShowEventName,
    TargetErrorMessageDisplayPresentation
} from '../../src/FieldPresentations/TargetErrorMessageDisplayPresentation';
import { RecordingErrorMessageDisplayTrigger } from '../TestSupport/RecordingErrorMessageDisplayTrigger';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { RecordingMessageFrame } from '../TestSupport/RecordingMessageFrame';
import { PopupService } from '../../src/Services/PopupService';

class Publicify_TargetErrorMessageDisplayPresentation extends TargetErrorMessageDisplayPresentation
{
    public get publicify_triggerContext(): IErrorMessageDisplayTriggerContext | undefined
    {
        return this.triggerContext;
    }
}

interface IEventCapture
{
    showEvents: CustomEvent<TargetMessageShowDetail>[];
    clearEvents: CustomEvent<TargetMessageClearDetail>[];
}

interface ISetup
{
    presentation: Publicify_TargetErrorMessageDisplayPresentation;
    element: IJivsElement;
    editor: IJivsElement;
    target: HTMLElement;
    form: HTMLElement;
    messageFrame: RecordingMessageFrame;
    domServices: IJivsDomServices;
    valueHostsManager: IValueHostsManager;
    valueHost: IFieldValueHost;
    popupService: PopupService;
    events: IEventCapture;
}

function captureEvents(element: HTMLElement): IEventCapture
{
    let events: IEventCapture = { showEvents: [], clearEvents: [] };
    element.addEventListener(jivsMessageShowEventName, event => {
        events.showEvents.push(event as CustomEvent<TargetMessageShowDetail>);
    });
    element.addEventListener(jivsMessageClearEventName, event => {
        events.clearEvents.push(event as CustomEvent<TargetMessageClearDetail>);
    });
    return events;
}

function setup(
    options: TargetErrorMessageDisplayPresentationOptions = {},
    globalOptions: TargetErrorMessageDisplayPresentationOptions = {},
    fieldName: string = 'email',
    shared?: { form: HTMLElement, target: HTMLElement, popupService: PopupService }
): ISetup
{
    if (!shared)
        document.body.innerHTML = '';
    let form = shared?.form ?? document.createElement('form');
    let element = document.createElement('span') as IJivsElement;
    let editor = document.createElement('input') as IJivsElement;
    let target = shared?.target ?? document.createElement('div');
    target.dataset.target = fieldName;
    target.textContent = 'Usage message';
    form.append(element, editor);
    if (!shared)
        form.append(target);
    if (!form.isConnected)
        document.body.append(form);

    let popupService = shared?.popupService ?? new PopupService();
    let editorAdapterDefinition = {
        attachEventHandler: (
            jivsElement: IJivsElement,
            _valueHost: IFieldValueHost,
            eventName: string,
            handler: EventListener
        ): void => jivsElement.addEventListener(eventName, handler)
    } as unknown as IEditorAdapterDefinition;
    editor.jivsEditorAdapterDefinition = editorAdapterDefinition;

    let services = { loggingService: null } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({
        services: services,
        getPopupService: () => popupService,
        resolveContainerElement: () => form,
        resolveFieldElement: () => [editor]
    });
    domServices.options.targetErrorMessageDisplay = globalOptions;
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    let valueHost = {
        valueHostsManager: valueHostsManager,
        getElementIdentifier: () => fieldName
    } as unknown as IFieldValueHost;
    let messageFrame = new RecordingMessageFrame(true);
    let presentation = new Publicify_TargetErrorMessageDisplayPresentation(
        element,
        messageFrame,
        { targetSelector: '[data-target={FieldName}]', ...options }
    );
    presentation.init(valueHostsManager);

    return {
        presentation: presentation,
        element: element,
        editor: editor,
        target: target,
        form: form,
        messageFrame: messageFrame,
        domServices: domServices,
        valueHostsManager: valueHostsManager,
        valueHost: valueHost,
        popupService: popupService,
        events: captureEvents(target)
    };
}

function applyIssues(testData: ISetup, issuesFound: IssueFound[] | null): void
{
    testData.presentation.apply(testData.valueHost, {
        isValid: !issuesFound || issuesFound.length === 0,
        issuesFound: issuesFound
    } as ValueHostValidationState);
}

function oneIssue(message: string): IssueFound[]
{
    return [{ errorMessage: message } as IssueFound];
}

// Target displays add their own identity while leaving message markup and ARIA behavior to the caller.
describe('TargetErrorMessageDisplayPresentation identity', () => {
    test('Adds persistent classes, supplies DOM services to the frame, and exposes its factory name', () => {
        let testData = setup({}, { variationClasses: 'status compact' });

        expect(testData.element.className).toBe(
            'jivs-errormessagedisplay jivs-triggerederrormessagedisplay jivs-targeterrormessagedisplay status compact'
        );
        expect(testData.messageFrame.setDomServicesCalls).toEqual([
            { domServices: testData.domServices }
        ]);
        expect(defaultTargetErrorMessageDisplayPresentationName).toBe('targetErrorMessageDisplay');
    });

    test('Requires a message frame', () => {
        expect(() => new TargetErrorMessageDisplayPresentation(
            document.createElement('div'),
            null as unknown as RecordingMessageFrame
        )).toThrow('messageFrame required');
    });
});

// The display events carry the message frame's content without editing the shared target.
describe('TargetErrorMessageDisplayPresentation events', () => {
    test('Dispatches a bubbling show event with framed content and clears on close', () => {
        let testData = setup();
        let issuesFound = oneIssue('Invalid email');
        let bubbledEvents: string[] = [];
        document.body.addEventListener(jivsMessageShowEventName, () => bubbledEvents.push('show'));
        document.body.addEventListener(jivsMessageClearEventName, () => bubbledEvents.push('clear'));
        applyIssues(testData, issuesFound);

        testData.editor.focus();

        expect(testData.events.showEvents).toHaveLength(1);
        expect(testData.events.showEvents[0].bubbles).toBe(true);
        expect(testData.events.showEvents[0].detail.valueHost).toBe(testData.valueHost);        
        expect(testData.events.showEvents[0].detail.issuesFound).toBe(issuesFound);
        expect(testData.events.showEvents[0].detail.content.classList.contains('jivs-messagecontent')).toBe(true);
        expect(testData.events.showEvents[0].detail.content.textContent).toBe('Invalid email');
        expect(testData.messageFrame.applyCalls[0]).toEqual({
            containerElement: testData.events.showEvents[0].detail.content,
            issuesFound: issuesFound,
            valueHostsManager: testData.valueHostsManager,
            fieldValueHost: testData.valueHost
        });
        expect(testData.target.textContent).toBe('Usage message');

        testData.editor.blur();

        expect(testData.events.clearEvents).toHaveLength(1);
        expect(testData.events.clearEvents[0].detail).toEqual({ valueHost: testData.valueHost });
        expect(bubbledEvents).toEqual(['show', 'clear']);
        expect(testData.target.textContent).toBe('Usage message');
    });

    test('Uses the bound presentation element when no target selector is configured', () => {
        let testData = setup({ targetSelector: '' });
        let events = captureEvents(testData.element);
        applyIssues(testData, oneIssue('Required'));

        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        expect(events.showEvents).toHaveLength(1);
        expect(events.showEvents[0].target).toBe(testData.element);
    });

    test('Falls back to the presentation element when the target selector has no match', () => {
        let testData = setup({ targetSelector: '#missing-target' });
        let events = captureEvents(testData.element);
        applyIssues(testData, oneIssue('Required'));

        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        expect(events.showEvents).toHaveLength(1);
        expect(events.showEvents[0].target).toBe(testData.element);
    });
});

// Selector resolution supports escaped field names and prefers elements inside the form.
describe('TargetErrorMessageDisplayPresentation target resolution', () => {
    test('Expands every field token with an escaped identifier inside the form first', () => {
        let fieldName = 'email.address';
        let testData = setup({}, {}, fieldName);
        let matchingOutsideTarget = document.createElement('div');
        matchingOutsideTarget.dataset.target = fieldName;
        document.body.append(matchingOutsideTarget);
        let outsideEvents = captureEvents(matchingOutsideTarget);
        applyIssues(testData, oneIssue('Invalid email'));

        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        expect(testData.events.showEvents).toHaveLength(1);
        expect(outsideEvents.showEvents).toHaveLength(0);
    });

    test('Falls back to a matching target elsewhere in the document', () => {
        let testData = setup();
        let outsideTarget = document.createElement('div');
        outsideTarget.dataset.target = 'email';
        document.body.append(outsideTarget);
        let outsideEvents = captureEvents(outsideTarget);
        testData.target.remove();
        applyIssues(testData, oneIssue('Invalid email'));

        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        expect(outsideEvents.showEvents).toHaveLength(1);
        expect(testData.events.showEvents).toHaveLength(0);
    });
});

// Default editor triggers are immediate; optional hover and custom triggers remain configurable.
describe('TargetErrorMessageDisplayPresentation triggers', () => {
    test('Shows on focus by default and does not show on hover by default', () => {
        let testData = setup();
        applyIssues(testData, oneIssue('Invalid email'));

        testData.editor.dispatchEvent(new MouseEvent('mouseenter'));
        expect(testData.events.showEvents).toHaveLength(0);

        testData.editor.focus();
        expect(testData.events.showEvents).toHaveLength(1);
        testData.editor.blur();
        expect(testData.events.clearEvents).toHaveLength(1);
    });

    test('Shows and clears on hover when enabled', () => {
        let testData = setup({ showOnFocus: false, showOnHover: true });
        applyIssues(testData, oneIssue('Invalid email'));

        testData.editor.dispatchEvent(new MouseEvent('mouseenter'));
        expect(testData.events.showEvents).toHaveLength(1);
        testData.editor.dispatchEvent(new MouseEvent('mouseleave'));
        expect(testData.events.clearEvents).toHaveLength(1);
    });

    test('Installs caller-supplied triggers in addition to the configured defaults', () => {
        let customTrigger = new RecordingErrorMessageDisplayTrigger();
        let testData = setup({ triggers: [customTrigger] });

        applyIssues(testData, oneIssue('Invalid email'));

        expect(customTrigger.installCalls).toHaveLength(1);
        expect(customTrigger.installCalls[0]).toBe(testData.presentation.publicify_triggerContext);
    });

    test('Does not coordinate with or register itself in PopupService', () => {
        let testData = setup({ showOnFocus: false });
        applyIssues(testData, oneIssue('Invalid email'));
        let context = testData.presentation.publicify_triggerContext!;
        let popupCloseCalls: IErrorMessageDisplayTriggerContext[] = [];
        let popupController: IErrorMessageDisplayController = {
            open: () => undefined,
            opened: () => undefined,
            close: popupContext => popupCloseCalls.push(popupContext),
            closed: () => undefined,
            toggle: () => undefined,
            cancelDelayedClose: () => undefined
        };
        testData.popupService.register(popupController, () => context);

        testData.presentation.open(context, 0);

        expect(popupCloseCalls).toHaveLength(0);

        testData.popupService.closePopups();

        expect(popupCloseCalls).toEqual([context]);
        expect(testData.events.clearEvents).toHaveLength(0);
        expect(testData.element.classList.contains('jivs-open')).toBe(true);
    });

    test('Opens after apply when an editor already has focus', () => {
        let testData = setup();
        testData.editor.focus();

        applyIssues(testData, oneIssue('Invalid email'));

        expect(testData.events.showEvents).toHaveLength(1);
    });
});

// Validation refreshes update an open message, while a late close cannot clear another field's message.
describe('TargetErrorMessageDisplayPresentation.apply', () => {
    test('Refreshes an open message and clears it when validation succeeds', () => {
        let testData = setup({ showOnFocus: false });
        applyIssues(testData, oneIssue('First issue'));
        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        applyIssues(testData, oneIssue('Updated issue'));

        expect(testData.events.clearEvents).toHaveLength(1);
        expect(testData.events.showEvents).toHaveLength(2);
        expect(testData.events.showEvents[1].detail.content.textContent).toBe('Updated issue');

        applyIssues(testData, []);

        expect(testData.events.clearEvents).toHaveLength(2);
    });

    test('Clears only when this presentation is still the last one shown on the target', () => {
        document.body.innerHTML = '';
        let first = setup({ showOnFocus: false, targetSelector: '#shared-target' });
        first.target.id = 'shared-target';
        let second = setup(
            { showOnFocus: false, targetSelector: '#shared-target' },
            {},
            'phone',
            { form: first.form, target: first.target, popupService: first.popupService }
        );
        let events = captureEvents(first.target);
        applyIssues(first, oneIssue('Email issue'));
        first.presentation.open(first.presentation.publicify_triggerContext!, 0);
        applyIssues(second, oneIssue('Phone issue'));
        second.presentation.open(second.presentation.publicify_triggerContext!, 0);

        first.presentation.close(first.presentation.publicify_triggerContext!, 0);

        expect(events.showEvents.map(event => event.detail.valueHost.getElementIdentifier())).toEqual(['email', 'phone']);
        expect(events.clearEvents).toHaveLength(0);

        second.presentation.close(second.presentation.publicify_triggerContext!, 0);

        expect(events.clearEvents.map(event => event.detail.valueHost.getElementIdentifier())).toEqual(['phone']);
    });

    test('Does not clear a target after a presentation from another manager replaces its message', () => {
        document.body.innerHTML = '';
        let first = setup({ showOnFocus: false, targetSelector: '#shared-target' });
        first.target.id = 'shared-target';
        let second = setup(
            { showOnFocus: false, targetSelector: '#shared-target' },
            {},
            'phone',
            { form: first.form, target: first.target, popupService: new PopupService() }
        );
        let events = captureEvents(first.target);
        applyIssues(first, oneIssue('Email issue'));
        first.presentation.open(first.presentation.publicify_triggerContext!, 0);
        applyIssues(second, oneIssue('Phone issue'));
        second.presentation.open(second.presentation.publicify_triggerContext!, 0);

        first.presentation.close(first.presentation.publicify_triggerContext!, 0);

        expect(events.showEvents.map(event => event.detail.valueHost.getElementIdentifier())).toEqual(['email', 'phone']);
        expect(events.clearEvents).toHaveLength(0);

        second.presentation.close(second.presentation.publicify_triggerContext!, 0);

        expect(events.clearEvents.map(event => event.detail.valueHost.getElementIdentifier())).toEqual(['phone']);
    });

    test('Clears its active target when disposed', () => {
        let testData = setup({ showOnFocus: false });
        applyIssues(testData, oneIssue('Invalid email'));
        testData.presentation.open(testData.presentation.publicify_triggerContext!, 0);

        testData.presentation.dispose();

        expect(testData.events.clearEvents).toHaveLength(1);
        expect(testData.events.clearEvents[0].detail).toEqual({ valueHost: testData.valueHost });
    });
});
