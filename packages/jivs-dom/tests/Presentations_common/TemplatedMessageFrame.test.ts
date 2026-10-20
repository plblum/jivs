import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import {
    TemplatedMessageFrame,
    TemplatedMessageFrameGlobalOptions,
    TemplatedMessageFrameOptions
} from '../../src/Presentations_common/TemplatedMessageFrame';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

class Publicify_TemplatedMessageFrame extends TemplatedMessageFrame
{
    public publicify_hasHeaderText(): boolean
    {
        return this.hasHeaderText;
    }

    public publicify_hasFooterText(): boolean
    {
        return this.hasFooterText;
    }
}

class GeneratedTemplateMessageFrame extends TemplatedMessageFrame
{
    public constructor()
    {
        super('', {});
    }

    protected override generateTemplate(): string
    {
        return '<section>{IssuesFound}</section>';
    }
}

/**
 * Creates a frame with the real issue formatter and error-messages service.
 * @param template - HTML template containing the required IssuesFound token.
 * @param globalOptions - Optional settings supplied through DOM services.
 * @param instanceOptions - Optional settings supplied directly to the frame.
 * @param localizedTexts - French-Canadian translations keyed by their localization keys.
 */
function setup(
    template: string,
    globalOptions: TemplatedMessageFrameGlobalOptions = {},
    instanceOptions: TemplatedMessageFrameOptions = {},
    localizedTexts: Record<string, string> = {}
): {
    testItem: TemplatedMessageFrame,
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
    domServices.options.templatedMessageFrame = globalOptions;
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);

    return {
        testItem: new TemplatedMessageFrame(template, instanceOptions),
        domServices: domServices
    };
}

/**
 * Supplies the active culture consumed by localized header and footer text.
 */
function createValueHostsManager(activeCultureId: string = 'en-US'): IValueHostsManager
{
    return {
        behaviors: { activeCultureId: activeCultureId }
    } as unknown as IValueHostsManager;
}

// Construction requires a template with the required issue-content insertion point unless a subclass supplies one.
describe('TemplatedMessageFrame constructor', () => {
    test('Rejects a nonempty template without the IssuesFound token', () => {
        expect(() => new TemplatedMessageFrame('<section>{Header}</section>', {}))
            .toThrow('The template must include the {IssuesFound} token.');
    });

    test('Accepts an empty template for a subclass to generate when applied', () => {
        let { testItem } = setup('', {});

        expect(testItem).toBeInstanceOf(TemplatedMessageFrame);
    });

    test('Uses the subclass template generator when an empty template is applied', () => {
        let testItem = new GeneratedTemplateMessageFrame();
        let domServices = createMockJivsDomServices();
        domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [{ errorMessage: 'Invalid' }] as IssueFound[],
            createValueHostsManager(),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<section><span data-errorcode="" data-severity="error">Invalid</span></section>'
        );
    });

    test('Reports that the base class cannot generate an empty template itself', () => {
        let { testItem, domServices } = setup('', {});
        testItem.setDomServices(domServices);

        expect(() => testItem.apply(
            document.createElement('div'),
            [],
            createValueHostsManager(),
            null
        )).toThrow('Subclasses must implement generateTemplate() to provide the HTML template.');
    });
});

// Header and footer presence lets layout subclasses decide whether those optional sections should be generated.
describe('TemplatedMessageFrame header and footer options', () => {
    test('Reports absent text when defaults are empty and configured text or localization keys as present', () => {
        let defaultFrame = new Publicify_TemplatedMessageFrame('{IssuesFound}', {});
        let headerFrame = new Publicify_TemplatedMessageFrame('{IssuesFound}', {
            headerHtml: 'Header'
        });
        let headerLocalizationFrame = new Publicify_TemplatedMessageFrame('{IssuesFound}', {
            headerHtmll10n: 'header-key'
        });
        let footerFrame = new Publicify_TemplatedMessageFrame('{IssuesFound}', {
            footerHtml: 'Footer'
        });
        let footerLocalizationFrame = new Publicify_TemplatedMessageFrame('{IssuesFound}', {
            footerHtmll10n: 'footer-key'
        });

        expect(defaultFrame.publicify_hasHeaderText()).toBe(false);
        expect(defaultFrame.publicify_hasFooterText()).toBe(false);
        expect(headerFrame.publicify_hasHeaderText()).toBe(true);
        expect(headerLocalizationFrame.publicify_hasHeaderText()).toBe(true);
        expect(footerFrame.publicify_hasFooterText()).toBe(true);
        expect(footerLocalizationFrame.publicify_hasFooterText()).toBe(true);
    });
});

// The frame signals whether its template already contains a message-content container.
describe('TemplatedMessageFrame.needsContainerUpdate', () => {
    test('Requests a container class when the nonempty template lacks it', () => {
        let { testItem } = setup('<section>{IssuesFound}</section>');

        expect(testItem.needsContainerUpdate()).toBe(true);
    });

    test('Does not request a container class when the template already includes it or is empty', () => {
        let withContainer = setup('<section class="jivs-messagecontent">{IssuesFound}</section>');
        let emptyTemplate = setup('', {});

        expect(withContainer.testItem.needsContainerUpdate()).toBe(false);
        expect(emptyTemplate.testItem.needsContainerUpdate()).toBe(false);
    });
});

// Applying a template resolves optional header/footer text and inserts formatted issues as prepared HTML.
describe('TemplatedMessageFrame.apply', () => {
    test('Replaces header, issue, and footer tokens with localized text and formatted issue HTML', () => {
        let { testItem, domServices } = setup(
            '<section><header>{Header}</header><main>{IssuesFound}</main><footer>{Footer}</footer></section>',
            {},
            {
                headerHtml: 'Fallback header {Count} for {Label}',
                headerHtmll10n: 'header-key',
                footerHtml: 'Fallback footer {Count}',
                footerHtmll10n: 'footer-key'
            },
            {
                'header-key': '<strong>Issues ({Count}) for {Label}</strong>',
                'footer-key': 'Please correct {Count} items'
            }
        );
        let containerElement = document.createElement('div');
        let issues = [{ errorCode: 'Required', errorMessage: '<em>Missing</em>' }] as IssueFound[];
        let fieldValueHost = {
            getLabel: () => 'A <B>'
        } as unknown as IFieldValueHost;

        testItem.setDomServices(domServices);
        testItem.apply(containerElement, issues, createValueHostsManager('fr-CA'), fieldValueHost);

        expect(containerElement.innerHTML).toBe(
            '<section><header><strong>Issues (1) for A &lt;B&gt;</strong></header>' +
            '<main><span data-errorcode="Required" data-severity="error"><em>Missing</em></span></main>' +
            '<footer>Please correct 1 items</footer></section>'
        );
    });

    test('Removes optional header and footer tokens when their text is not configured', () => {
        let { testItem, domServices } = setup(
            '<section>{Header}<main>{IssuesFound}</main>{Footer}</section>'
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
            '<section><main><span data-errorcode="" data-severity="error">Invalid</span></main></section>'
        );
    });

    test('Uses instance header and footer options instead of global options', () => {
        let { testItem, domServices } = setup(
            '<section>{Header}|{IssuesFound}|{Footer}</section>',
            {
                headerHtml: 'Global header',
                footerHtml: 'Global footer'
            },
            {
                headerHtml: 'Instance header',
                footerHtml: 'Instance footer'
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
            '<section>Instance header|<span data-errorcode="" data-severity="error">Invalid</span>|Instance footer</section>'
        );
    });

    test('Uses global header and footer options when instance options are omitted', () => {
        let { testItem, domServices } = setup(
            '<section>{Header}|{IssuesFound}|{Footer}</section>',
            {
                headerHtml: 'Global header',
                footerHtml: 'Global footer'
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
            '<section>Global header|<span data-errorcode="" data-severity="error">Invalid</span>|Global footer</section>'
        );
    });

    test('Uses fallback text for an unmatched culture and substitutes the count of all supplied issues', () => {
        let { testItem, domServices } = setup(
            '<section>{Header}|{IssuesFound}|{Footer}</section>',
            {},
            {
                headerHtml: 'Fallback header for {Count} issues',
                headerHtmll10n: 'header-key',
                footerHtml: 'Fallback footer for {Count} issues',
                footerHtmll10n: 'footer-key'
            },
            {
                'header-key': 'Localized header',
                'footer-key': 'Localized footer'
            }
        );
        let containerElement = document.createElement('div');
        let issues = [
            { errorCode: 'First', errorMessage: 'First issue' },
            { errorCode: 'Second', errorMessage: 'Second issue' }
        ] as IssueFound[];

        testItem.setDomServices(domServices);
        testItem.apply(containerElement, issues, createValueHostsManager('en-US'), null);

        expect(containerElement.innerHTML).toBe(
            '<section>Fallback header for 2 issues|' +
            '<ul><li data-errorcode="First" data-severity="error">First issue</li>' +
            '<li data-errorcode="Second" data-severity="error">Second issue</li></ul>' +
            '|Fallback footer for 2 issues</section>'
        );
    });

    test('Throws when the container is null or services are not initialized', () => {
        let { testItem } = setup('<section>{IssuesFound}</section>');

        expect(() => testItem.apply(
            null as unknown as HTMLElement,
            [],
            createValueHostsManager(),
            null
        )).toThrow(/containerElement/);
        expect(() => testItem.apply(
            document.createElement('div'),
            [],
            createValueHostsManager(),
            null
        )).toThrow('DOM services not initialized.');
    });
});
