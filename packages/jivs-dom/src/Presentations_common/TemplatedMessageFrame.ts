import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { MessageFrameBaseOptions, jivsMessageContentClass } from './MessageFrameBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { MessageFrameBase } from './MessageFrameBase';

/**
 * A templated approach to building the content of the Message Frame, 
 * by supplying an HTML string template containing tokens for dynamic content.
 * It supports optional header and footer sections.
 * For the header, it replaces the token {Header} with the provided headerHtml and headerHtmll10n properties.
 * headerHtmll10n defaults to 'messageframe-header'.    
 * For the footer, it replaces the token {Footer} with the provided footerHtml and footerHtmll10n properties.
 * footerHtmll10n defaults to 'messageframe-footer'.
 * 
 * For the error messages, it replaces {IssuesFound} with the formatted error message content
 * adapted from the getErrorMessageContent method of the MessageFrameBase class.
 * 
 * Header and footer tokens are optional but if you supply them in the template, 
 * you should provide the corresponding text and localization properties.
 * 
 * You can use static text instead of tokens if you prefer in header and footer, but you will not
 * get the benefits of localization or support of dynamic values like issue count or field labels.
 */
export class TemplatedMessageFrame extends MessageFrameBase
{

    /**
     * Initializes a new instance of the TemplatedMessageFrame class.
     * 
     * ## Options
     * headerHtml - The text that replaces the {Header} token. It can contain HTML. 
     *      Be sure to HTML encode where necessary.
     * headerHtmll10n - The localization key for the header text.
     *      Defaults to 'messageframe-header'.
     * footerHtml - The text that replaces the {Footer} token. 
     *      It can contain HTML. Be sure to HTML encode where necessary.
     * footerHtmll10n - The localization key for the footer text.
     *      Defaults to 'messageframe-footer'.
     * useSummaryMessages - Whether to use summary messages instead of detailed messages.
     * messagesLimit - The maximum number of messages to display, if any.
     * 
     * @param template - Template containing HTML and tokens of {Header}, {Footer}, and {IssuesFound}.
     * Subclasses that generate their own templates should pass the empty string.
     * @param options - The options for configuring the templated Message Frame.
     */
    constructor(template: string, options?: TemplatedMessageFrameOptions) //yes, required where most options are optional
    {
        super(options);
        this.template = template;   // will update properties dependent on the template, like header and footer tokens
        // if template= '', a subclass must provide the template.
        this._headerHtml = options?.headerHtml ?? '';
        this._headerHtmll10n = options?.headerHtmll10n ?? 'messageframe-header';
        this._footerHtml = options?.footerHtml ?? '';
        this._footerHtmll10n = options?.footerHtmll10n ?? 'messageframe-footer';

    }
    /**
     * Gets the current template string.
     */
    protected get template(): string
    {
        return this._template;
    }
    protected set template(value: string)
    {
        this._template = value;
        const hasTemplate = value?.length > 0;
        this._hasHeaderToken = hasTemplate && this._template!.includes('{Header}');
        this._hasFooterToken = hasTemplate && this._template!.includes('{Footer}');
        if (hasTemplate && !this.template!.includes('{IssuesFound}'))
        {
            throw new Error('The template must include the {IssuesFound} token.');
        }        
    }
    private _template: string = '';

    protected get headerHtml(): string
    {
        return this._headerHtml;
    }
    protected set headerHtml(value: string)
    {
        this._headerHtml = value ?? '';
    }
    protected get headerHtmll10n(): string
    {
        return this._headerHtmll10n;
    }
    protected set headerHtmll10n(value: string)
    {
        this._headerHtmll10n = value ?? '';
    }
    protected get footerHtml(): string
    {
        return this._footerHtml;
    }
    protected set footerHtml(value: string)
    {
        this._footerHtml = value ?? '';
    }
    protected get footerHtmll10n(): string
    {
        return this._footerHtmll10n;
    }
    protected set footerHtmll10n(value: string)
    {
        this._footerHtmll10n = value ?? '';
    }

    protected get hasHeaderText(): boolean
    {
        return this._headerHtml || this._headerHtmll10n ? true : false;
    }

    protected get hasFooterText(): boolean
    {
        return this._footerHtml || this._footerHtmll10n ? true : false;
    }

    private _hasHeaderToken: boolean = false;
    private _hasFooterToken: boolean = false;

    /**
     * When true, the Field Presentation needs to update its container element to
     * include class 'jivs-messagecontent'.
     * Determined by searching the template for the 'jivs-messagecontent' string.
     */
    public needsContainerUpdate(): boolean
    {
        return this.template?.length > 0 && !this.template.includes(jivsMessageContentClass);
    }

    /**
     * The header text to be displayed. It can contain HTML and expects the source Header text 
     * to already be HTML encoded where needed.
     * @param issuesFound 
     * @param valueHostsManager 
     * @param fieldValueHost 
     * @returns 
     */
    protected getHeaderContent(issuesFound: IssueFound[], valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): string
    {
        return this.resolveText(this._headerHtmll10n, this._headerHtml, issuesFound, valueHostsManager, fieldValueHost);
    }
    private _headerHtml: string = '';
    private _headerHtmll10n: string = '';
    
    /**
     * The footer text to be displayed. It can contain HTML and expects the source Footer text 
     * to already be HTML encoded where needed.
     * @param issuesFound 
     * @param valueHostsManager 
     * @param fieldValueHost 
     * @returns 
     */
    protected getFooterContent(issuesFound: IssueFound[], valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): string
    {
        return this.resolveText(this._footerHtmll10n, this._footerHtml, issuesFound, valueHostsManager, fieldValueHost);
    }
    private _footerHtml: string = '';
    private _footerHtmll10n: string = '';

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
        if (template === '') {
            template = this.template = this.generateTemplate();
        }
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

    protected generateTemplate(): string
    {
        throw new Error('Subclasses must implement generateTemplate() to provide the HTML template.');
    }
}

export interface TemplatedMessageFrameOptions extends MessageFrameBaseOptions
{

    /**
     * The text to be displayed in the header section. It will replace the {Header} token in the template.
     * It can contain HTML and expects the source text to already be HTML encoded where needed.
     */
    headerHtml?: string | null;
    /**
     * The localized text to be displayed in the header section. It will replace the {Header} token in the template.
     * It can contain HTML and expects the source text to already be HTML encoded where needed.
     * The mapping is setup in the ErrorMessagesService. If not found there for the active culture,
     * it will fall back to headerHtml.
     */
    headerHtmll10n?: string | null;
    /**
     * The text to be displayed in the footer section. It will replace the {Footer} token in the template.
     * It can contain HTML and expects the source text to already be HTML encoded where needed.
     */
    footerHtml?: string | null;
    /**
     * The localized text to be displayed in the footer section. It will replace the {Footer} token in the template.
     * It can contain HTML and expects the source text to already be HTML encoded where needed.
     * The mapping is setup in the ErrorMessagesService. If not found there for the active culture,
     * it will fall back to footerHtml.
     */
    footerHtmll10n?: string | null;
}