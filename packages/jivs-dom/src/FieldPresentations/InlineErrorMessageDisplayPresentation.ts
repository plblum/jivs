import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IIssuesFoundDisplay } from '../Interfaces/IIssuesFoundDisplay';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ErrorMessageDisplayPresentationBase, ErrorMessageDisplayPresentationBaseOptions } from './ErrorMessageDisplayPresentationBase';
import { jivsErrorMessagesContainerClass } from '../Presentations_common/IssuesFoundDisplayBase';

/**
 * A Field Presentation class for displaying inline error messages, which means
 * the container itself contains the error message content.
 * 
 * ## Style Classes
 * - persistent classes: 'jivs-inline-error-message-display', 'jivs-error-message-display', 'jivs-error-messages-container'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - stateful classes: 'jivs-has-issues'
 * 
 * 'jivs-error-messages-container' targets the container immediately wrapping the content of the error messages,
 * which is usually generated as a span element for 1 message and ul/li elements for multiple messages.
 * ```html
 * <div class="jivs-error-messages-container">
 *     <span>Error message here</span>
 * </div>
 * <div class="jivs-error-messages-container">
 *     <ul>
 *         <li>Error message here</li>
 *     </ul>
 * </div>
 * ```
 */
export class InlineErrorMessageDisplayPresentation extends ErrorMessageDisplayPresentationBase
{
    constructor(element: HTMLElement,
        issuesFoundDisplay: IIssuesFoundDisplay,
        options?: ErrorMessageDisplayPresentationBaseOptions,
        anchor?: IJivsDomElement | null)
    {
        super(element, issuesFoundDisplay, options, anchor);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-inline-error-message-display');
        if (this.issuesFoundDisplay.needsContainerUpdate()) {
            list.push(jivsErrorMessagesContainerClass); // jivs-error-messages-container
        }
    }
    /**
     * Expands the base class implementation to apply the issues found using the issuesFoundDisplay.
     * @param valueHost The host of the field value.
     * @param issuesFound The list of issues found for the field value.
     */
    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        super.applyIssuesFound(valueHost, issuesFound); // add hasIssuesClass if needed
        this.issuesFoundDisplay.apply(this.presentationElement, issuesFound,
            valueHost.valueHostsManager, valueHost);
    }

    protected override removeIssuesFound(): void
    {
        super.removeIssuesFound();
        this.presentationElement.textContent = '';
    }
}