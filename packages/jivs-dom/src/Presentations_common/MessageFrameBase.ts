import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IMessageFrame } from '../Interfaces/IMessageFrame';
import { PresentationContentBase } from './PresentationContentBase';

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
export abstract class MessageFrameBase<TOptions extends MessageFrameBaseOptions>
    extends PresentationContentBase<TOptions>
    implements IMessageFrame
{
    constructor(options?: TOptions)
    {
        super(options);
    }

    override getOptionDefaults(): Partial<TOptions> {
        return {
            ...super.getOptionDefaults(),
            useSummaryMessages: false,
            messagesLimit: 0
        } as Partial<TOptions>;
    }

    /**
     * When true, the Field Presentation needs to update its container element to
     * include class 'jivs-messagecontent'.
     */
    public abstract needsContainerUpdate(): boolean;    

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
            valueHostsManager, issuesFound, this.options.useSummaryMessages, this.options.messagesLimit);
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