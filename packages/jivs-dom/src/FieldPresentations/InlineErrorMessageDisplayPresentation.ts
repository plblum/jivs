/**
 * InlineErrorMessageDisplayPresentation provides a field presentation for displaying inline error messages.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/InlineErrorMessageDisplayPresentation
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IMessageFrame } from '../Interfaces/IMessageFrame';
import { jivsMessageContentClass } from '../Presentations_common/MessageFrameBase';
import { ErrorMessageDisplayPresentationBase, ErrorMessageDisplayPresentationBaseGlobalOptions, ErrorMessageDisplayPresentationBaseOptions } from './ErrorMessageDisplayPresentationBase';

/**
 * A Field Presentation class for displaying inline error messages, which means
 * the container itself contains the error message content.
 * 
 * ## CSS Classes
 * - persistent classes: 'jivs-inlineerrormessagedisplay', 'jivs-errormessagedisplay', 'jivs-messagecontent'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - stateful classes: 'jivs-has-issues'
 * 
 * 'jivs-messagecontent' targets the container immediately wrapping the content of the error messages,
 * which is usually generated as a span element for 1 message and ul/li elements for multiple messages.
 * ```html
 * <div class="jivs-messagecontent">
 *     <span>Error message here</span>
 * </div>
 * <div class="jivs-messagecontent">
 *     <ul>
 *         <li>Error message here</li>
 *     </ul>
 * </div>
 * ```
 */
export class InlineErrorMessageDisplayPresentation<TOptions extends InlineErrorMessageDisplayPresentationOptions = InlineErrorMessageDisplayPresentationOptions>
    extends ErrorMessageDisplayPresentationBase<TOptions>
{
    constructor(element: HTMLElement,
        messageFrame: IMessageFrame,
        options?: TOptions)
    {
        super(element, options);
        assertNotNull(messageFrame, 'messageFrame');
        this._messageFrame = messageFrame;        
    }
    /**
     * Presentation specific for displaying the Issues Found.
     * Required parameter of the constructor.
     */
    protected get messageFrame(): IMessageFrame
    {
        return this._messageFrame;
    }
    private _messageFrame: IMessageFrame;

    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.inlineErrorMessageDisplay;
    }

    override setDomServices(valueHostsManager: IValueHostsManager): void
    {
        super.setDomServices(valueHostsManager);
        this.messageFrame.setDomServices(this.domServices);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-inlineerrormessagedisplay');
        if (this.messageFrame.needsContainerUpdate()) {
            list.push(jivsMessageContentClass); // jivs-messagecontent
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
    public override dispose(): void
    {
        super.dispose();
        this._messageFrame = undefined as any;
    }    
}

/**
 * Global options for the inline error message display presentation.
 * These options can be set globally and provide default values for all instances of this presentation.
 */
export interface InlineErrorMessageDisplayPresentationGlobalOptions
    extends ErrorMessageDisplayPresentationBaseGlobalOptions
{
}

/**
 * Options for configuring the inline error message display presentation on a per-instance basis.
 * These options override the global options for this specific instance of the presentation.
 * Only add here options that are used situationally.
 */
export interface InlineErrorMessageDisplayPresentationOptions
    extends ErrorMessageDisplayPresentationBaseOptions,
    InlineErrorMessageDisplayPresentationGlobalOptions
{
}

export const defaultInlineErrorMessageDisplayPresentationName = 'inlineErrorMessageDisplay';