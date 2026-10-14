import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';
import type { IMessageFrame } from '../Interfaces/IMessageFrame';
import type { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * Implements the IMessageFrame interface and provides a common structure for derived classes.
 * 
 * Both FieldPresentation and FormPresentation classes need a common approach to 
 * formatting the issues found in the field or form.
 * - The Message Content, which contains the actual error message HTML.
 * - The Message Frame, which wraps around the Message Content and may include
 *   more HTML like headers, footers, and icons.
 *   It also gets the Message Content content and injects it into the appropriate location 
 *   within the Message Frame.
 * 
 * This class supplies a few general utilities and structure that can be leveraged 
 * by derived classes to display issues consistently.
 * 
 * The content is injected into a containing element that is used to show and hide it.
 * 
 * The content is typically shaped around these parts:
 * 1. Header: Optional section for a title or summary of the issues.
 * 2. Message Content: Main section where the list of issues is displayed.
 *      - Usually a span or ul, depending on the structure of the issues list. 
 *        This class uses domServices.issuesFoundFormatterService to generate it.
 * 3. Footer: Optional section for additional information or actions related to the issues.
 * ```html
 * <!-- DEVELOPER CONTROLS THIS OUTER WRAPPER (e.g., they might make this a <section>) -->
 * <div class="developer-outer-container" role="status" aria-atomic="true">
 *   <div class='jivs-header'>Form Submission Errors</div>
 * 
 *   <!-- Message Content injected here -->
 * 
 *   <div class='jivs-footer'>Please fix these issues and try again.</div>
 * </div>
 * ```
 * 
 * ## Options
 * - useSummaryMessages - Whether to use summary messages instead of detailed messages.
 * - messagesLimit - The maximum number of messages to display, if any.
 */
export abstract class MessageFrameBase implements IMessageFrame
{
    constructor(options?: MessageFrameBaseOptions)
    {
        this._useSummaryMessages = options?.useSummaryMessages ?? false;
        this._messagesLimit = options?.messagesLimit;
    }
    protected get useSummaryMessages(): boolean
    {
        return this._useSummaryMessages;
    }
    private _useSummaryMessages: boolean = false;
    
    protected get messagesLimit(): number | undefined
    {
        return this._messagesLimit;
    }
    private _messagesLimit: number | undefined = undefined;

    /**
     * Sets the DOM services instance to be used for rendering and formatting issues.
     * Expected to be established before using apply().
     */
    setDomServices(domServices: IJivsDomServices): void
    {
        this._domServices = domServices;
    }
    /**
     * Gets the DOM services instance that was previously set.
     * This is used internally by derived classes to access rendering and formatting utilities.
     */
    protected get domServices(): IJivsDomServices
    {
        return this._domServices;
    }
    private _domServices!: IJivsDomServices;

    /**
     * When true, the Field Presentation needs to update its container element to
     * include class 'jivs-messagecontent'.
     */
    public abstract needsContainerUpdate(): boolean;    

    /**
     * Utility to resolve the appropriate text for a given key, falling back to the default text if no specific text is found.
     * It uses the jivsServices.errorMessagesService to localize based on the key, if available, or falls back to the default text.
     * It supports token replacement as follows:
     * - {Count} - replaced by the number of issues found.
     * - {Label} - replaced by the label of the field associated with the issue. Requires the fieldValueHost to be provided.
     * @param key - The key used to look up the localized text.
     * @param defaultText - The default text to use if no specific text is resolved for the given key.
     * @param issuesFound - The list of issues found.
     * @param valueHostsManager - The manager for value hosts, used for resolving dynamic values in the text.
     * @param fieldValueHost The host object for the field value, if applicable.
     */
    protected resolveText(key: string, defaultText: string, 
        issuesFound: IssueFound[], valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): string
    {
        const cultureId = valueHostsManager.behaviors.activeCultureId!;
        let resolvedText = this.domServices.services.errorMessagesService.localize(cultureId, key, defaultText);
        if (resolvedText)
        {
            resolvedText = resolvedText.replace('{Count}', issuesFound.length.toString());
            if (fieldValueHost)
            {
                resolvedText = resolvedText.replace('{Label}', encodeHtml(fieldValueHost.getLabel()));
            }
        }
        return resolvedText ?? '';
    }

    /**
     * Retrieves the formatted error message content as HTML for the given issues found.
     * 
     * This class uses the IJivsDomServices.issuesFoundFormatterService to build the HTML content for the issues found.
     * @param issuesFound - The list of issues found.
     * @param valueHostsManager - The manager for value hosts.
     * @param fieldValueHost - The host object for the field value, if applicable.
     * @returns The formatted error message content as HTML.
     */
    protected getErrorMessageContent(issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): string
    {
        return this.domServices.issuesFoundFormatterService.buildAsHtml(
            valueHostsManager, issuesFound, this.useSummaryMessages, this.messagesLimit);
    }

    public abstract apply(containerElement: HTMLElement, issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null): void;
}

/**
 * The CSS class used for the Messages Content section,
 * applied to outer element.
 */
export const jivsMessageContentClass = 'jivs-messagecontent';

export interface MessageFrameBaseOptions
{
    /**
     * Whether to use summary messages for the issues found.
     * When not defined, it defaults to false.
     */
    useSummaryMessages?: boolean;
    
    /**
     * The limit for the number of messages to display.
     * When not defined or 0, there is no limit.
     */
    messagesLimit?: number;

}