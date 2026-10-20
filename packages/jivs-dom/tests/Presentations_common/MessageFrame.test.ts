/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import {
    MessageFrame,
    MessageFrameGlobalOptions,
    MessageFrameOptions
} from '../../src/Presentations_common/MessageFrame';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Creates a Message Frame backed by the real issue formatter.
 * @param globalOptions - Optional Message Frame settings supplied by DOM services.
 * @param instanceOptions - Optional settings supplied directly to the frame.
 */
function setup(
    globalOptions: MessageFrameGlobalOptions = {},
    instanceOptions?: MessageFrameOptions
): {
    testItem: MessageFrame,
    domServices: IJivsDomServices
}
{
    let options = createMockJivsDomServices().options;
    options.messageFrame = globalOptions;
    let domServices = createMockJivsDomServices({ options: options });
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);

    return {
        testItem: new MessageFrame(instanceOptions),
        domServices: domServices
    };
}

// This minimal frame requires its target to serve as the Message Content container.
describe('MessageFrame.needsContainerUpdate', () => {
    test('Returns true because the frame has no separate content wrapper', () => {
        let { testItem } = setup();

        expect(testItem.needsContainerUpdate()).toBe(true);
    });
});

// Applying the frame formats messages into the given element and adds its identifying class.
describe('MessageFrame.apply', () => {
    test('Adds its class and replaces existing content with formatted issue markup', () => {
        let { testItem, domServices } = setup();
        let containerElement = document.createElement('div');
        containerElement.classList.add('authored-class');
        containerElement.innerHTML = '<p>old content</p>';
        let issues = [{ errorCode: 'Required', errorMessage: 'invalid value' }] as IssueFound[];
        let valueHostsManager = {} as IValueHostsManager;
        let fieldValueHost = {} as IFieldValueHost;

        testItem.setDomServices(domServices);
        testItem.apply(containerElement, issues, valueHostsManager, fieldValueHost);

        expect(containerElement.classList.contains('jivs-messageframe')).toBe(true);
        expect(containerElement.classList.contains('authored-class')).toBe(true);
        expect(containerElement.innerHTML).toBe(
            '<span data-errorcode="Required" data-severity="error">invalid value</span>'
        );
    });

    test('Formats a summary message and applies the resolved global issue limit', () => {
        let { testItem, domServices } = setup(<MessageFrameGlobalOptions>{
            useSummaryMessages: true,
            messagesLimit: 1
        });
        let containerElement = document.createElement('div');
        let issues = [
            { errorCode: 'First', errorMessage: 'first detail', summaryMessage: 'first summary' },
            { errorCode: 'Second', errorMessage: 'second detail', summaryMessage: 'second summary' }
        ] as IssueFound[];
        let valueHostsManager = {} as IValueHostsManager;

        testItem.setDomServices(domServices);
        testItem.apply(containerElement, issues, valueHostsManager, null);

        expect(containerElement.innerHTML).toBe(
            '<span data-errorcode="First" data-severity="error">first summary</span>'
        );
    });

    test('Instance options override global summary selection and limit', () => {
        let { testItem, domServices } = setup(
            <MessageFrameGlobalOptions>{ useSummaryMessages: true, messagesLimit: 2 },
            <MessageFrameGlobalOptions>{ useSummaryMessages: false, messagesLimit: 1 }
        );
        let containerElement = document.createElement('div');
        let issues = [
            { errorCode: 'First', errorMessage: 'first detail', summaryMessage: 'first summary' },
            { errorCode: 'Second', errorMessage: 'second detail', summaryMessage: 'second summary' }
        ] as IssueFound[];

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            issues,
            {} as IValueHostsManager,
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<span data-errorcode="First" data-severity="error">first detail</span>'
        );
    });

    test('Throws before DOM services are initialized', () => {
        let { testItem } = setup();

        expect(() => testItem.apply(
            document.createElement('div'),
            [],
            {} as IValueHostsManager,
            null
        )).toThrow('DOM services not initialized.');
    });
});
