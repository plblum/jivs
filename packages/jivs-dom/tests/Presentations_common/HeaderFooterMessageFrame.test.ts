/** @jest-environment jsdom */
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import {
    HeaderFooterMessageFrame,
    HeaderFooterMessageFrameGlobalOptions,
    HeaderFooterMessageFrameOptions
} from '../../src/Presentations_common/HeaderFooterMessageFrame';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Creates the frame with real issue formatting and text localization services.
 * @param globalOptions - Optional header/footer frame settings from DOM services.
 * @param instanceOptions - Optional header/footer frame instance settings.
 * @param localizedTexts - French-Canadian translations keyed by localization key.
 */
function setup(
    globalOptions: HeaderFooterMessageFrameGlobalOptions = {},
    instanceOptions?: HeaderFooterMessageFrameOptions,
    localizedTexts: Record<string, string> = {}
): {
    testItem: HeaderFooterMessageFrame,
    domServices: IJivsDomServices
}
{
    let errorMessagesService = new ErrorMessagesService();
    for (let key of Object.keys(localizedTexts))
        errorMessagesService.register(key, { 'fr-CA': localizedTexts[key] });
    let services = {
        errorMessagesService: errorMessagesService
    } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({ services: services });
    domServices.options.headerFooterMessageFrame = globalOptions;
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);

    return {
        testItem: new HeaderFooterMessageFrame(instanceOptions),
        domServices: domServices
    };
}

/**
 * Supplies an active culture for resolving the optional header and footer.
 */
function createValueHostsManager(activeCultureId: string = 'en-US'): IValueHostsManager
{
    return {
        behaviors: { activeCultureId: activeCultureId }
    } as unknown as IValueHostsManager;
}

// Header and footer sections are independently included only when their text or localization key is configured.
describe('HeaderFooterMessageFrame.apply optional sections', () => {
    test('Omits both optional sections by default while always rendering message content', () => {
        let { testItem, domServices } = setup();
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [{ errorMessage: 'Invalid' }] as IssueFound[],
            createValueHostsManager(),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<div class="jivs-layoutmessageframe jivs-headerfootermessageframe">' +
            '<div class="jivs-messagecontent">' +
            '<span data-errorcode="" data-severity="error">Invalid</span>' +
            '</div></div>'
        );
    });

    test('Includes only the header when header text is configured', () => {
        let { testItem, domServices } = setup({}, { headerHtml: 'Header text' });
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [],
            createValueHostsManager(),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<div class="jivs-layoutmessageframe jivs-headerfootermessageframe">' +
            '<div class="jivs-header">Header text</div>' +
            '<div class="jivs-messagecontent"></div>' +
            '</div>'
        );
    });

    test('Includes only the footer when a footer localization key is configured', () => {
        let { testItem, domServices } = setup(
            {},
            { footerHtmll10n: 'footer-key' },
            { 'footer-key': 'Localized footer' }
        );
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [],
            createValueHostsManager('fr-CA'),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<div class="jivs-layoutmessageframe jivs-headerfootermessageframe">' +
            '<div class="jivs-messagecontent"></div>' +
            '<div class="jivs-footer">Localized footer</div>' +
            '</div>'
        );
    });
});

// The concrete frame adds its own persistent class, merges custom classes, and inherits message formatting options.
describe('HeaderFooterMessageFrame layout and options', () => {
    test('Includes both configured sections and preserves custom outer classes', () => {
        let { testItem, domServices } = setup(
            {},
            {
                outerClasses: 'custom-frame highlighted',
                headerHtml: '<strong>Header</strong>',
                footerHtml: 'Footer'
            }
        );
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [{ errorMessage: 'Invalid' }] as IssueFound[],
            createValueHostsManager(),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<div class="custom-frame highlighted jivs-layoutmessageframe jivs-headerfootermessageframe">' +
            '<div class="jivs-header"><strong>Header</strong></div>' +
            '<div class="jivs-messagecontent">' +
            '<span data-errorcode="" data-severity="error">Invalid</span>' +
            '</div>' +
            '<div class="jivs-footer">Footer</div>' +
            '</div>'
        );
    });

    test('Uses global section and message-formatting options when instance options are absent', () => {
        let { testItem, domServices } = setup(<HeaderFooterMessageFrameOptions>{
            headerHtml: 'Global header',
            footerHtml: 'Global footer',
            useSummaryMessages: true,
            messagesLimit: 1
        });
        let containerElement = document.createElement('div');
        let issues = [
            { errorMessage: 'First detail', summaryMessage: 'First summary' },
            { errorMessage: 'Second detail', summaryMessage: 'Second summary' }
        ] as IssueFound[];

        testItem.setDomServices(domServices);
        testItem.apply(containerElement, issues, createValueHostsManager(), null);

        expect(containerElement.innerHTML).toBe(
            '<div class="jivs-layoutmessageframe jivs-headerfootermessageframe">' +
            '<div class="jivs-header">Global header</div>' +
            '<div class="jivs-messagecontent">' +
            '<span data-errorcode="" data-severity="error">First summary</span>' +
            '</div>' +
            '<div class="jivs-footer">Global footer</div>' +
            '</div>'
        );
    });

    test('Does not request another container update because the generated frame contains its own content container', () => {
        let { testItem, domServices } = setup();
        testItem.setDomServices(domServices);

        expect(testItem.needsContainerUpdate()).toBe(false);
    });

    test('Throws when the container is null', () => {
        let { testItem } = setup();

        expect(() => testItem.apply(
            null as unknown as HTMLElement,
            [],
            createValueHostsManager(),
            null
        )).toThrow(/containerElement/);
    });
});
