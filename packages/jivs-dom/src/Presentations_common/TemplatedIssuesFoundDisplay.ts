import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { jivsErrorMessagesContainerClass } from './IssuesFoundDisplayBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IssuesFoundDisplayBase } from './IssuesFoundDisplayBase';

/**
 * A templated approach to displaying issues found, allowing customization of the presentation using templates.
 * It supports optional header and footer sections.
 * It takes a single string containing HTML and tokens. It replaces the tokens with values from the provided context.
 * For the header, it replaces the token {Header} with the provided headerText and headerTextl10n properties.
 * For the footer, it replaces the token {Footer} with the provided footerText and footerTextl10n properties.
 * For the error messages, it replaces {IssuesFound} with the formatted error message content
 * adapted from the getErrorMessageContent method of the IssuesFoundDisplayBase class.
 * 
 * Header and footer tokens are optional but if you supply them in the template, 
 * you should provide the corresponding text and localization properties.
 * 
 * You can use static text instead of tokens if you prefer in header and footer, but you will not
 * get the benefits of localization or support of dynamic values like issue count or field labels.
 * 
 * It supplies the following as the HTML for the default template:
 * ```html
 * <header>{Header}</header>
 * <div class="jivs-error-messages-container">{IssuesFound}</div>
 * <footer>{Footer}</footer>
 * ```
 * When the template is not provided, a default template will be generated based on the presence of header and footer text.
 * It only adds the header and footer sections if the corresponding text is provided.
 */
export class TemplatedIssuesFoundDisplay extends IssuesFoundDisplayBase
{

    /**
     * Initializes a new instance of the TemplatedIssuesFoundDisplay class.
     * @param template - Template containing HTML and tokens of {Header}, {Footer}, and {IssuesFound}.
     * Use null to use a default template.
     * @param headerText - The text to use for the header section. It can contain HTML. Be sure to HTML encode where necessary.
     * @param headerTextl10n - The localization key for the header text.
     * @param footerText - The text to use for the footer section. It can contain HTML. Be sure to HTML encode where necessary.
     * @param footerTextl10n - The localization key for the footer text.
     * @param useSummaryMessages - Whether to use summary messages instead of detailed messages.
     * @param messagesLimit - The maximum number of messages to display, if any.
     */
    constructor(template: string | null,
        headerText: string | null,
        headerTextl10n: string | null,
        footerText: string | null,
        footerTextl10n: string | null,
        useSummaryMessages: boolean, messagesLimit: number | undefined = undefined)
    {
        super(useSummaryMessages, messagesLimit);
        this._headerText = headerText ?? '';
        this._headerTextl10n = headerTextl10n ?? '';
        this._footerText = footerText ?? '';
        this._footerTextl10n = footerTextl10n ?? '';

        this._template = template ?? this.defaultTemplate(headerText || headerTextl10n ? true : false, footerText || footerTextl10n ? true : false);
        this._hasHeaderToken = this._template.includes('{Header}');
        this._hasFooterToken = this._template.includes('{Footer}');
        if (!this.template.includes('{IssuesFound}')) {
            throw new Error('The template must include the {IssuesFound} token.');
        }
    }
    /**
     * Gets the current template string.
     */
    protected get template(): string
    {
        return this._template;
    }
    private _template!: string;

    protected defaultTemplate(hasHeaderText: boolean, hasFooterText: boolean): string
    {
        // uses the parameters to determine if a part is needed, but does not resolve their text until apply time

        let template = '';
        if (hasHeaderText) {
            template += '<header>{Header}</header>';
        }
        template += TemplatedIssuesFoundDisplay.defaultIssuesFoundHtml(); 
        if (hasFooterText) {
            template += '<footer>{Footer}</footer>';
        }
        return template;
    }
    private _hasHeaderToken: boolean = false;
    private _hasFooterToken: boolean = false;

    public static defaultIssuesFoundHtml(): string
    {
        return `<div class="${jivsErrorMessagesContainerClass}">{IssuesFound}</div>`;
    }

    /**
     * When true, the Field Presentation needs to update its container element to
     * include class 'jivs-error-messages-container'.
     * Determined by searching the template for the 'jivs-error-messages-container' string.
     */
    public needsContainerUpdate(): boolean
    {
        return !this.template.includes(jivsErrorMessagesContainerClass);
    }

    /**
     * The header text to be displayed. It can contain HTML and expects the source Header text to already be HTML encoded where needed.
     * @param issuesFound 
     * @param valueHostsManager 
     * @param fieldValueHost 
     * @returns 
     */
    protected getHeaderContent(issuesFound: IssueFound[], valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): string
    {
        return this.resolveText(this._headerTextl10n, this._headerText, issuesFound, valueHostsManager, fieldValueHost);
    }
    private _headerText: string = '';
    private _headerTextl10n: string = '';
    
    /**
     * The footer text to be displayed. It can contain HTML and expects the source Footer text to already be HTML encoded where needed.
     * @param issuesFound 
     * @param valueHostsManager 
     * @param fieldValueHost 
     * @returns 
     */
    protected getFooterContent(issuesFound: IssueFound[], valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): string
    {
        return this.resolveText(this._footerTextl10n, this._footerText, issuesFound, valueHostsManager, fieldValueHost);
    }
    private _footerText: string = '';
    private _footerTextl10n: string = '';

    /**
     * Applies the template to the specified container element, replacing tokens with the appropriate content.
     * @param containerElement - The HTML element where the template will be applied.
     * @param issuesFound - The list of issues found to be displayed.
     * @param valueHostsManager - The manager for value hosts.
     * @param fieldValueHost - The field value host, if any.
     */
    public override apply(containerElement: HTMLElement, issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): void
    {
        assertNotNull(containerElement, 'containerElement');
        let template = this.template;
        if (this._hasHeaderToken) {
            template = template.replace('{Header}', this.getHeaderContent(issuesFound, valueHostsManager, fieldValueHost));
        }
        if (this._hasFooterToken) {
            template = template.replace('{Footer}', this.getFooterContent(issuesFound,  valueHostsManager, fieldValueHost));
        }
        template = template.replace('{IssuesFound}', this.getErrorMessageContent(issuesFound, valueHostsManager, fieldValueHost));
        containerElement.innerHTML = template;
    }    
}