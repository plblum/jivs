/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IssueFound, ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { IssueClickedEvent, ValidationSummaryPresentation } from '../../src/FormPresentations/ValidationSummaryPresentation';
import type { ValidationSummaryPresentationOptions } from '../../src/FormPresentations/ValidationSummaryPresentation';
import type { IMessageFrame } from '../../src/Interfaces/IMessageFrame';
import { ElementRole } from '../../src/Interfaces/Types';
import { HeaderFooterMessageFrame } from '../../src/Presentations_common/HeaderFooterMessageFrame';
import { IconMessageFrame } from '../../src/Presentations_common/IconMessageFrame';
import { MessageFrame } from '../../src/Presentations_common/MessageFrame';
import { TemplatedMessageFrame } from '../../src/Presentations_common/TemplatedMessageFrame';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { RecordingMessageFrame } from '../TestSupport/RecordingMessageFrame';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ISetup
{
    domServices: IJivsDomServices;
    element: HTMLElement;
    messageFrame: RecordingMessageFrame;
    presentation: ValidationSummaryPresentation<ValidationSummaryPresentationOptions>;
    valueHostsManager: IValueHostsManager;
}

function createIssue(errorMessage: string, elementIdentifier?: string): IssueFound
{
    return {
        errorCode: 'TestIssue',
        errorMessage: errorMessage,
        valueHostName: elementIdentifier
    } as IssueFound;
}

function createValidationState(issuesFound: IssueFound[] | null): ValidationState
{
    return {
        isValid: !issuesFound || issuesFound.length === 0,
        doNotSave: false,
        issuesFound: issuesFound,
        asyncProcessing: false
    };
}

function setup(
    updatesContainer: boolean = false,
    options?: ValidationSummaryPresentationOptions
): ISetup
{
    let domServices = createMockJivsDomServices();
    let valueHostsManager = {
        services: { domServices: domServices }
    } as IValueHostsManager;
    let element = document.createElement('section');
    let messageFrame = new RecordingMessageFrame(updatesContainer);
    let presentation = new ValidationSummaryPresentation(element, messageFrame, options ?? {});
    presentation.init(valueHostsManager);
    return {
        domServices: domServices,
        element: element,
        messageFrame: messageFrame,
        presentation: presentation,
        valueHostsManager: valueHostsManager
    };
}

interface IIntegrationSetup
{
    domServices: IJivsDomServices;
    element: HTMLElement;
    presentation: ValidationSummaryPresentation;
    valueHostsManager: IValueHostsManager;
}

function setupIntegration(messageFrame: IMessageFrame): IIntegrationSetup
{
    let errorMessagesService = new ErrorMessagesService();
    let services = { errorMessagesService: errorMessagesService } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({ services: services });
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);
    let valueHostsManager = {
        services: { domServices: domServices },
        behaviors: { activeCultureId: 'en-US' },
        getFieldValueHost: (name: string) => ({
            getElementIdentifier: () => `${name}Element`
        })
    } as unknown as IValueHostsManager;
    let element = document.createElement('section');
    let presentation = new ValidationSummaryPresentation(element, messageFrame, {});
    presentation.init(valueHostsManager);
    return {
        domServices: domServices,
        element: element,
        presentation: presentation,
        valueHostsManager: valueHostsManager
    };
}

// A validation summary requires a message frame because it delegates issue rendering to that collaborator.
describe('ValidationSummaryPresentation construction', () => {
    test('Rejects a missing message frame', () => {
        expect(() => new ValidationSummaryPresentation(
            document.createElement('div'),
            null as unknown as RecordingMessageFrame,
            {}
        )).toThrow('messageFrame required');
    });
});

// Initialization connects the frame to DOM services and installs the summary's persistent classes and click handler.
describe('ValidationSummaryPresentation.init', () => {
    test('Sets DOM services on the message frame and adds summary and message-content classes as required', () => {
        let withoutContainerUpdate = setup(false);
        let withContainerUpdate = setup(true);

        expect(withoutContainerUpdate.messageFrame.setDomServicesCalls).toEqual([{
            domServices: withoutContainerUpdate.domServices
        }]);
        expect(withoutContainerUpdate.element.classList.contains('jivs-validationsummary')).toBe(true);
        expect(withoutContainerUpdate.element.classList.contains('jivs-messagecontent')).toBe(false);
        expect(withContainerUpdate.element.classList.contains('jivs-validationsummary')).toBe(true);
        expect(withContainerUpdate.element.classList.contains('jivs-messagecontent')).toBe(true);
    });

    test('Adds variation classes after the summary classes', () => {
        let testData = setup(false, { variationClasses: 'compact highlighted' });

        expect(testData.element.className).toBe('jivs-validationsummary compact highlighted');
    });

    test('Exposes the expected issue class', () => {
        let testData = setup();

        expect(testData.presentation.hasIssuesClass).toEqual(['jivs-has-issues']);
    });
});

// Applying validation state clears stale issues before rendering any current issues.
describe('ValidationSummaryPresentation.apply', () => {
    test('Renders current issues and applies the has-issues class', () => {
        let testData = setup();
        let issues = [createIssue('Name is required'), createIssue('Email is invalid')];
        let state = createValidationState(issues);

        testData.presentation.apply(testData.valueHostsManager, state);

        expect(testData.element.classList.contains('jivs-has-issues')).toBe(true);
        expect(testData.element.textContent).toBe('Name is required|Email is invalid');
        expect(testData.messageFrame.applyCalls).toEqual([{
            containerElement: testData.element,
            issuesFound: issues,
            valueHostsManager: testData.valueHostsManager,
            fieldValueHost: null
        }]);
    });

    test('Removes previously rendered issues when the next state has an empty, null, or absent issue list', () => {
        let states: Array<IssueFound[] | null> = [[], null];

        for (let issues of states)
        {
            let testData = setup();
            testData.presentation.apply(
                testData.valueHostsManager,
                createValidationState([createIssue('Stale issue')])
            );

            testData.presentation.apply(
                testData.valueHostsManager,
                createValidationState(issues)
            );

            expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);
            expect(testData.element.textContent).toBe('');
            expect(testData.messageFrame.applyCalls).toHaveLength(1);
        }

        let absentIssues = setup();
        absentIssues.presentation.apply(
            absentIssues.valueHostsManager,
            { ...createValidationState(null), issuesFound: undefined } as unknown as ValidationState
        );

        expect(absentIssues.element.classList.contains('jivs-has-issues')).toBe(false);
        expect(absentIssues.element.textContent).toBe('');
    });
});

// Clicking a rendered issue raises an IssueClickedEvent for the closest identified issue element.
describe('ValidationSummaryPresentation issue clicks', () => {
    test('Raises an event containing the nearest data-identifier value for a nested click target', () => {
        let testData = setup();
        let issueElement = document.createElement('span');
        issueElement.setAttribute('data-identifier', 'billingAddress');
        let nestedTarget = document.createElement('strong');
        issueElement.appendChild(nestedTarget);
        testData.element.appendChild(issueElement);
        let capturedEvents: Event[] = [];
        testData.element.addEventListener('IssueClicked', event => capturedEvents.push(event));

        nestedTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(capturedEvents).toHaveLength(1);
        expect(capturedEvents[0]).toBeInstanceOf(IssueClickedEvent);
        expect((capturedEvents[0] as IssueClickedEvent).elementIdentifier).toBe('billingAddress');
    });

    test('Does not raise an event when the click has no identified ancestor or its identifier is empty', () => {
        let testData = setup();
        let capturedEvents: Event[] = [];
        testData.element.addEventListener('IssueClicked', event => capturedEvents.push(event));
        let unmarkedTarget = document.createElement('span');
        testData.element.appendChild(unmarkedTarget);
        unmarkedTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        let emptyIdentifierTarget = document.createElement('span');
        emptyIdentifierTarget.setAttribute('data-identifier', '');
        testData.element.appendChild(emptyIdentifierTarget);
        emptyIdentifierTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(capturedEvents).toHaveLength(0);
    });

    test('Removes the delegated click listener when disposed', () => {
        let testData = setup();
        let issueElement = document.createElement('span');
        issueElement.setAttribute('data-identifier', 'billingAddress');
        testData.element.appendChild(issueElement);
        let capturedEvents: Event[] = [];
        testData.element.addEventListener('IssueClicked', event => capturedEvents.push(event));

        testData.presentation.dispose();
        issueElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(capturedEvents).toHaveLength(0);
    });

    test('Can be disposed before initialization when no click listener was installed', () => {
        let presentation = new ValidationSummaryPresentation(
            document.createElement('section'),
            new RecordingMessageFrame(false),
            {}
        );

        expect(() => presentation.dispose()).not.toThrow();
    });
});

// IssueClickedEvent retains the element identifier for callers that route focus to the invalid field.
describe('IssueClickedEvent', () => {
    test('Uses the documented event type and retains the element identifier', () => {
        let event = new IssueClickedEvent('email');

        expect(event.type).toBe('IssueClicked');
        expect(event.elementIdentifier).toBe('email');
        expect(event.bubbles).toBe(false);
    });
});

// Real frames and the real formatter verify complete summary rendering and issue-click routing.
describe('ValidationSummaryPresentation integration with real message frames', () => {
    test('Renders real message-list markup between a header and footer', () => {
        let testData = setupIntegration(new HeaderFooterMessageFrame({
            headerHtml: 'Found {Count} issues',
            footerHtml: 'Review all fields.'
        }));

        testData.presentation.apply(testData.valueHostsManager, createValidationState([
            createIssue('First issue'),
            createIssue('Second issue')
        ]));

        expect(testData.element.classList.contains('jivs-validationsummary')).toBe(true);
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(true);
        expect(testData.element.querySelector('.jivs-header')?.textContent).toBe('Found 2 issues');
        expect(testData.element.querySelector('.jivs-messagecontent ul')?.children).toHaveLength(2);
        expect(testData.element.querySelector('.jivs-messagecontent')?.textContent)
            .toContain('First issue');
        expect(testData.element.querySelector('.jivs-footer')?.textContent).toBe('Review all fields.');
    });

    test('Renders a real icon and summary messages in the icon frame', () => {
        let testData = setupIntegration(new IconMessageFrame({
            iconContent: '<strong>!</strong>',
            headerHtml: 'Found {Count} issue',
            useSummaryMessages: true
        }));

        testData.presentation.apply(testData.valueHostsManager, createValidationState([
            {
                errorCode: 'Required',
                errorMessage: 'The email field is empty',
                summaryMessage: 'Email is required'
            } as IssueFound
        ]));

        expect(testData.element.querySelector('.jivs-icon')?.innerHTML).toBe('<strong>!</strong>');
        expect(testData.element.querySelector('.jivs-header')?.textContent).toBe('Found 1 issue');
        expect(testData.element.querySelector('.jivs-messagecontent')?.textContent).toBe('Email is required');
        expect(testData.element.querySelector('[data-errorcode="Required"]')?.getAttribute('data-severity'))
            .toBe('error');
    });

    test('Renders a custom real template and adds the container content class', () => {
        let testData = setupIntegration(new TemplatedMessageFrame(
            '<section><header>{Header}</header><main>{IssuesFound}</main><footer>{Footer}</footer></section>',
            {
                headerHtml: 'Validation summary',
                footerHtml: 'Please fix the listed items.'
            }
        ));

        testData.presentation.apply(testData.valueHostsManager, createValidationState([
            createIssue('Name is required')
        ]));

        expect(testData.element.classList.contains('jivs-messagecontent')).toBe(true);
        expect(testData.element.querySelector('header')?.textContent).toBe('Validation summary');
        expect(testData.element.querySelector('main')?.textContent).toBe('Name is required');
        expect(testData.element.querySelector('footer')?.textContent).toBe('Please fix the listed items.');
    });

    test('Uses the real basic frame and removes its rendered content when validation clears', () => {
        let testData = setupIntegration(new MessageFrame());

        testData.presentation.apply(testData.valueHostsManager, createValidationState([
            createIssue('A field requires attention')
        ]));

        expect(testData.element.classList.contains('jivs-messageframe')).toBe(true);
        expect(testData.element.querySelector('span')?.textContent).toBe('A field requires attention');

        testData.presentation.apply(testData.valueHostsManager, createValidationState([]));

        expect(testData.element.textContent).toBe('');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);
    });

    test('Routes a click on a real formatted issue using its value-host identifier', () => {
        let testData = setupIntegration(new MessageFrame());
        let capturedEvents: Event[] = [];
        testData.element.addEventListener('IssueClicked', event => capturedEvents.push(event));
        testData.presentation.apply(testData.valueHostsManager, createValidationState([
            createIssue('Invalid email', 'email')
        ]));
        let issueElement = testData.element.querySelector('[data-identifier="emailElement"]');
        let nestedTarget = document.createElement('strong');
        issueElement?.appendChild(nestedTarget);

        nestedTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(capturedEvents).toHaveLength(1);
        expect(capturedEvents[0]).toBeInstanceOf(IssueClickedEvent);
        expect((capturedEvents[0] as IssueClickedEvent).elementIdentifier).toBe('emailElement');
    });
});
