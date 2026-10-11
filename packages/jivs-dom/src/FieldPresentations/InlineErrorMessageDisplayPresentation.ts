import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IMessageFrame } from '../Interfaces/IMessageFrame';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ErrorMessageDisplayPresentationBase, ErrorMessageDisplayPresentationBaseOptions } from './ErrorMessageDisplayPresentationBase';
import { jivsErrorMessagesContainerClass } from '../Presentations_common/MessageFrameBase';

/**
 * A Field Presentation class for displaying inline error messages, which means
 * the container itself contains the error message content.
 * 
 * ## Style Classes
 * - persistent classes: 'jivs-inlineerrormessagedisplay', 'jivs-errormessagedisplay', 'jivs-error-messages-container'
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
        messageFrame: IMessageFrame,
        options?: ErrorMessageDisplayPresentationBaseOptions,
        anchor?: IJivsDomElement | null)
    {
        super(element, messageFrame, options, anchor);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-inlineerrormessagedisplay');
        if (this.messageFrame.needsContainerUpdate()) {
            list.push(jivsErrorMessagesContainerClass); // jivs-error-messages-container
        }
    }
    /**
     * Expands the base class implementation to apply the issues found using the messageFrame.
     * @param valueHost The host of the field value.
     * @param issuesFound The list of issues found for the field value.
     */
    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        super.applyIssuesFound(valueHost, issuesFound); // add hasIssuesClass if needed
        this.messageFrame.apply(this.presentationElement, issuesFound,
            valueHost.valueHostsManager, valueHost);
    }

    protected override removeIssuesFound(): void
    {
        super.removeIssuesFound();
        this.presentationElement.textContent = '';
    }
}