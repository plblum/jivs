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

        this.template = template;   // will update properties dependent on the template, like header and footer tokens
    }
    /**
     * Gets the current template string.
     */
    protected get template(): string | null
    {
        return this._template ?? null;
    }
    protected set template(value: string | null)
    {
        this._template = value;
        const hasTemplate = this._template !== null && this._template !== undefined;
        this._hasHeaderToken = hasTemplate && this._template!.includes('{Header}');
        this._hasFooterToken = hasTemplate && this._template!.includes('{Footer}');
        if (hasTemplate && !this.template!.includes('{IssuesFound}'))
        {
            throw new Error('The template must include the {IssuesFound} token.');
        }        
    }
    private _template?: string | null;

    protected get headerText(): string
    {
        return this._headerText;
    }
    protected set headerText(value: string)
    {
        this._headerText = value ?? '';
    }
    protected get headerTextl10n(): string
    {
        return this._headerTextl10n;
    }
    protected set headerTextl10n(value: string)
    {
        this._headerTextl10n = value ?? '';
    }
    protected get footerText(): string
    {
        return this._footerText;
    }
    protected set footerText(value: string)
    {
        this._footerText = value ?? '';
    }
    protected get footerTextl10n(): string
    {
        return this._footerTextl10n;
    }
    protected set footerTextl10n(value: string)
    {
        this._footerTextl10n = value ?? '';
    }

    protected get hasHeaderText(): boolean
    {
        return this._headerText || this._headerTextl10n ? true : false;
    }

    protected get hasFooterText(): boolean
    {
        return this._footerText || this._footerTextl10n ? true : false;
    }

    private _hasHeaderToken: boolean = false;
    private _hasFooterToken: boolean = false;

    /**
     * When true, the Field Presentation needs to update its container element to
     * include class 'jivs-error-messages-container'.
     * Determined by searching the template for the 'jivs-error-messages-container' string.
     */
    public needsContainerUpdate(): boolean
    {
        return this.template != null && this.template.includes(jivsErrorMessagesContainerClass);
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
        let template = this.template!;
        assertNotNull(template, 'template');
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