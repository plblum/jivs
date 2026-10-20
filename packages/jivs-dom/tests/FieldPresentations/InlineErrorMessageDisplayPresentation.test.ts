/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import {
    defaultInlineErrorMessageDisplayPresentationName,
    InlineErrorMessageDisplayPresentation,
    InlineErrorMessageDisplayPresentationOptions
} from '../../src/FieldPresentations/InlineErrorMessageDisplayPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IMessageFrame } from '../../src/Interfaces/IMessageFrame';
import { HeaderFooterMessageFrame } from '../../src/Presentations_common/HeaderFooterMessageFrame';
import { IconMessageFrame } from '../../src/Presentations_common/IconMessageFrame';
import { TemplatedMessageFrame } from '../../src/Presentations_common/TemplatedMessageFrame';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { RecordingMessageFrame } from '../TestSupport/RecordingMessageFrame';

class Publicify_InlineErrorMessageDisplayPresentation extends InlineErrorMessageDisplayPresentation
{
    public get publicify_messageFrame(): IMessageFrame
    {
        return this.messageFrame;
    }
}

interface ISetup
{
    presentation: Publicify_InlineErrorMessageDisplayPresentation;
    element: HTMLElement;
    messageFrame: RecordingMessageFrame;
    domServices: IJivsDomServices;
    valueHostsManager: IValueHostsManager;
    valueHost: IFieldValueHost;
}

function setup(
    messageFrameUpdatesContainer: boolean = true,
    options?: InlineErrorMessageDisplayPresentationOptions,
    globalOptions?: InlineErrorMessageDisplayPresentationOptions
): ISetup
{
    let element = document.createElement('div');
    let domServices = createMockJivsDomServices();
    domServices.options.inlineErrorMessageDisplay = globalOptions ?? {};
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    let valueHost = {
        valueHostsManager: valueHostsManager
    } as unknown as IFieldValueHost;
    let messageFrame = new RecordingMessageFrame(messageFrameUpdatesContainer);
    let presentation = new Publicify_InlineErrorMessageDisplayPresentation(
        element,
        messageFrame,
        options
    );

    return {
        presentation: presentation,
        element: element,
        messageFrame: messageFrame,
        domServices: domServices,
        valueHostsManager: valueHostsManager,
        valueHost: valueHost
    };
}

interface IIntegrationSetup
{
    presentation: InlineErrorMessageDisplayPresentation;
    element: HTMLElement;
    valueHost: IFieldValueHost;
}

function setupIntegration(
    messageFrame: IMessageFrame,
    options?: InlineErrorMessageDisplayPresentationOptions
): IIntegrationSetup
{
    let element = document.createElement('div');
    let errorMessagesService = new ErrorMessagesService();
    let services = { errorMessagesService: errorMessagesService } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({ services: services });
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);
    let valueHostsManager = {
        services: { domServices: domServices },
        behaviors: { activeCultureId: 'en-US' }
    } as unknown as IValueHostsManager;
    let valueHost = {
        valueHostsManager: valueHostsManager,
        getLabel: () => 'Email'
    } as unknown as IFieldValueHost;
    let presentation = new InlineErrorMessageDisplayPresentation(element, messageFrame, options);
    presentation.init(valueHostsManager);

    return {
        presentation: presentation,
        element: element,
        valueHost: valueHost
    };
}

function initialize(setupData: ISetup): void
{
    setupData.presentation.init(setupData.valueHostsManager);
}

function applyValidationState(
    presentation: InlineErrorMessageDisplayPresentation,
    valueHost: IFieldValueHost,
    issuesFound: IssueFound[] | null
): void
{
    presentation.apply(valueHost, {
        isValid: !issuesFound || issuesFound.length === 0,
        issuesFound: issuesFound
    } as ValueHostValidationState);
}

function applyIssues(setupData: ISetup, issuesFound: IssueFound[] | null): void
{
    applyValidationState(setupData.presentation, setupData.valueHost, issuesFound);
}

// Inline error displays use stable persistent classes and expose the expected factory registration name.
describe('InlineErrorMessageDisplayPresentation identity', () => {
    test('Adds display classes and message-content class when the frame updates its container', () => {
        let testData = setup(true);

        initialize(testData);

        expect(testData.element.className).toBe(
            'jivs-errormessagedisplay jivs-inlineerrormessagedisplay jivs-messagecontent'
        );
    });

    test('Omits message-content class when the frame does not update its container', () => {
        let testData = setup(false);

        initialize(testData);

        expect(testData.element.className).toBe(
            'jivs-errormessagedisplay jivs-inlineerrormessagedisplay'
        );
    });

    test('Uses the inlineErrorMessageDisplay factory name', () => {
        expect(defaultInlineErrorMessageDisplayPresentationName).toBe('inlineErrorMessageDisplay');
    });
});

// Initialization supplies DOM services to both the presentation and its message frame.
describe('InlineErrorMessageDisplayPresentation.init', () => {
    test('Passes the manager DOM services to the message frame', () => {
        let testData = setup();

        initialize(testData);

        expect(testData.messageFrame.setDomServicesCalls).toEqual([
            { domServices: testData.domServices }
        ]);
    });

    test('Applies variation classes after persistent classes', () => {
        let testData = setup(true, { variationClasses: 'below compact' });

        initialize(testData);

        expect(testData.element.className).toBe(
            'jivs-errormessagedisplay jivs-inlineerrormessagedisplay jivs-messagecontent below compact'
        );
    });

    test('Uses global variation classes unless instance options override them', () => {
        let testData = setup(
            true,
            { variationClasses: 'instance-style' },
            { variationClasses: 'global-style' }
        );

        initialize(testData);

        expect(testData.element.className).toBe(
            'jivs-errormessagedisplay jivs-inlineerrormessagedisplay jivs-messagecontent instance-style'
        );
    });
});

// Issues are rendered into the inline element and passed with their original field context to the message frame.
describe('InlineErrorMessageDisplayPresentation.apply', () => {
    test('Passes issues and field context to the message frame and marks the display as having issues', () => {
        let testData = setup();
        initialize(testData);
        let issuesFound = [
            { errorMessage: 'First issue' },
            { errorMessage: 'Second issue' }
        ] as IssueFound[];

        applyIssues(testData, issuesFound);

        expect(testData.element.classList.contains('jivs-has-issues')).toBe(true);
        expect(testData.element.textContent).toBe('First issue|Second issue');
        expect(testData.messageFrame.applyCalls).toEqual([{
            containerElement: testData.element,
            issuesFound: issuesFound,
            valueHostsManager: testData.valueHostsManager,
            fieldValueHost: testData.valueHost
        }]);
    });

    test('Clears rendered content and issue state for empty, null, and undefined issue lists', () => {
        let testData = setup();
        initialize(testData);
        applyIssues(testData, [{ errorMessage: 'Existing issue' }] as IssueFound[]);
        expect(testData.element.textContent).toBe('Existing issue');

        applyIssues(testData, []);
        expect(testData.element.textContent).toBe('');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);

        applyIssues(testData, [{ errorMessage: 'Another issue' }] as IssueFound[]);
        applyIssues(testData, null);
        expect(testData.element.textContent).toBe('');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);

        applyIssues(testData, [{ errorMessage: 'Yet another issue' }] as IssueFound[]);
        applyIssues(testData, undefined as unknown as IssueFound[] | null);
        expect(testData.element.textContent).toBe('');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);
    });
});

// The required message frame dependency is rejected early when omitted.
describe('InlineErrorMessageDisplayPresentation constructor', () => {
    test('Throws when no message frame is supplied', () => {
        let element = document.createElement('div');

        expect(() => new InlineErrorMessageDisplayPresentation(
            element,
            null as unknown as IMessageFrame
        )).toThrow('messageFrame required');
    });
});

// dispose() releases the retained message-frame reference along with inherited presentation state.
describe('InlineErrorMessageDisplayPresentation.dispose', () => {
    test('Clears the message-frame reference', () => {
        let testData = setup();

        expect(testData.presentation.publicify_messageFrame).toBe(testData.messageFrame);

        testData.presentation.dispose();

        expect(testData.presentation.publicify_messageFrame).toBeUndefined();
    });
});

// Real message frames and formatting services verify the complete inline rendering and clearing workflow.
describe('InlineErrorMessageDisplayPresentation integration with message frames', () => {
    test('Renders field issues between a real header and footer frame', () => {
        let testData = setupIntegration(new HeaderFooterMessageFrame({
            headerHtml: 'Validation issues',
            footerHtml: 'Correct the field and try again.'
        }));

        applyValidationState(
            testData.presentation,
            testData.valueHost,
            [{ errorCode: 'Required', errorMessage: 'Email is required' }] as IssueFound[]
        );

        expect(testData.element.classList.contains('jivs-has-issues')).toBe(true);
        expect(testData.element.querySelector('.jivs-header')?.textContent).toBe('Validation issues');
        expect(testData.element.querySelector('.jivs-messagecontent')?.textContent).toBe('Email is required');
        expect(testData.element.querySelector('.jivs-footer')?.textContent).toBe(
            'Correct the field and try again.'
        );
    });

    test('Renders field issues with the real icon and header layout', () => {
        let testData = setupIntegration(new IconMessageFrame({
            iconContent: '<strong>!</strong>',
            headerHtml: 'Found {Count} issue'
        }));

        applyValidationState(
            testData.presentation,
            testData.valueHost,
            [{ errorCode: 'Invalid', errorMessage: 'Enter a valid email' }] as IssueFound[]
        );

        expect(testData.element.querySelector('.jivs-icon')?.innerHTML).toBe('<strong>!</strong>');
        expect(testData.element.querySelector('.jivs-header')?.textContent).toBe('Found 1 issue');
        expect(testData.element.querySelector('.jivs-messagecontent')?.textContent).toBe(
            'Enter a valid email'
        );
    });

    test('Adds the message-content class to the presentation container for a real custom template', () => {
        let testData = setupIntegration(new TemplatedMessageFrame(
            '<section><header>{Header}</header><main>{IssuesFound}</main>' +
            '<footer>{Footer}</footer></section>',
            {
                headerHtml: 'Issues for {Label}',
                footerHtml: 'Please correct this value.'
            }
        ));

        applyValidationState(
            testData.presentation,
            testData.valueHost,
            [{ errorCode: 'Required', errorMessage: 'Email is required' }] as IssueFound[]
        );

        expect(testData.element.classList.contains('jivs-messagecontent')).toBe(true);
        expect(testData.element.querySelector('section')).not.toBeNull();
        expect(testData.element.querySelector('header')?.textContent).toBe('Issues for Email');
        expect(testData.element.querySelector('main')?.textContent).toBe('Email is required');
        expect(testData.element.querySelector('footer')?.textContent).toBe(
            'Please correct this value.'
        );
    });

    test('Removes the real frame content and issue state when the field becomes valid', () => {
        let testData = setupIntegration(new HeaderFooterMessageFrame({
            headerHtml: 'Validation issues',
            footerHtml: 'Correct the field and try again.'
        }));
        let issuesFound = [{ errorCode: 'Required', errorMessage: 'Email is required' }] as IssueFound[];

        applyValidationState(testData.presentation, testData.valueHost, issuesFound);
        expect(testData.element.querySelector('.jivs-messagecontent')?.textContent).toBe(
            'Email is required'
        );

        applyValidationState(testData.presentation, testData.valueHost, []);

        expect(testData.element.innerHTML).toBe('');
        expect(testData.element.classList.contains('jivs-has-issues')).toBe(false);
    });
});
