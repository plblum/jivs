import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import {
    MessageFrameBase,
    MessageFrameBaseOptions
} from '../../src/Presentations_common/MessageFrameBase';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

class Publicify_MessageFrameBase extends MessageFrameBase<MessageFrameBaseOptions>
{
    public get publicify_options(): MessageFrameBaseOptions
    {
        return this.options;
    }

    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.messageFrame;
    }

    public publicify_getErrorMessageContent(
        issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null
    ): string
    {
        return this.getErrorMessageContent(issuesFound, valueHostsManager, fieldValueHost);
    }

    public needsContainerUpdate(): boolean
    {
        return false;
    }

    public apply(
        _containerElement: HTMLElement,
        _issuesFound: IssueFound[],
        _valueHostsManager: IValueHostsManager,
        _fieldValueHost: IFieldValueHost | null
    ): void
    {
    }
}

/**
 * Creates DOM services with the real issue formatter and configurable global message limits.
 * @param globalMessagesLimit - Optional limit supplied through the global Message Frame options.
 */
function setup(globalMessagesLimit?: number, instanceOptions?: MessageFrameBaseOptions): {
    testItem: Publicify_MessageFrameBase,
    domServices: IJivsDomServices
}
{
    let domServices = createMockJivsDomServices();
    domServices.options.messageFrame = globalMessagesLimit === undefined
        ? {}
        : { messagesLimit: globalMessagesLimit };
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);

    return {
        testItem: new Publicify_MessageFrameBase(instanceOptions),
        domServices: domServices
    };
}

// Message Frame options default to detailed messages without a limit, then use global and instance overrides.
describe('MessageFrameBase options', () => {
    test('Uses detailed messages and no limit by default', () => {
        let { testItem, domServices } = setup();

        testItem.setDomServices(domServices);

        expect(testItem.publicify_options.useSummaryMessages).toBe(false);
        expect(testItem.publicify_options.messagesLimit).toBe(0);
    });

    test('Applies a global limit and lets instance options override it', () => {
        let testItem = new Publicify_MessageFrameBase({
            useSummaryMessages: true,
            messagesLimit: 2
        });
        let { domServices } = setup(5);

        testItem.setDomServices(domServices);

        expect(testItem.publicify_options).toEqual({
            useSummaryMessages: true,
            messagesLimit: 2
        });
    });
});

// Formatted content uses the real formatter so message selection and limits are verified end to end.
describe('MessageFrameBase.getErrorMessageContent', () => {
    test('Formats detailed messages by default', () => {
        let { testItem, domServices } = setup();
        testItem.setDomServices(domServices);
        let issues = [
            { errorCode: 'First', errorMessage: 'first' },
            { errorCode: 'Second', errorMessage: 'second' }
        ] as IssueFound[];
        let valueHostsManager = {} as IValueHostsManager;
        let fieldValueHost = {} as IFieldValueHost;

        let result = testItem.publicify_getErrorMessageContent(issues, valueHostsManager, fieldValueHost);

        expect(result).toBe(
            '<ul><li data-errorcode="First" data-severity="error" >first</li>' +
            '<li data-errorcode="Second" data-severity="error" >second</li></ul>'
        );
    });

    test('Uses summary messages and applies the global issue limit', () => {
        let { testItem, domServices } = setup(1, { useSummaryMessages: true });
        testItem.setDomServices(domServices);
        let issues = [
            { errorCode: 'First', errorMessage: 'first detail', summaryMessage: 'first summary' },
            { errorCode: 'Second', errorMessage: 'second detail', summaryMessage: 'second summary' }
        ] as IssueFound[];
        let valueHostsManager = {} as IValueHostsManager;

        let result = testItem.publicify_getErrorMessageContent(issues, valueHostsManager, null);

        expect(result).toBe(
            '<span data-errorcode="First" data-severity="error" >first summary</span>'
        );
    });

    test('Throws before DOM services are initialized', () => {
        let { testItem } = setup();

        expect(() => testItem.publicify_getErrorMessageContent(
            [],
            {} as IValueHostsManager,
            null
        )).toThrow('DOM services not initialized.');
    });
});
