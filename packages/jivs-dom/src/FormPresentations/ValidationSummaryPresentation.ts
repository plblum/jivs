/**
 * Provides a concrete implementation of a form presentation that displays a validation summary widget.
 * 
 * @module jivs-dom/FormPresentations/ConcreteClasses/ValidationSummaryPresentation
 */

import { IssueFound, ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IMessageFrame } from '../Interfaces/IMessageFrame';
import { jivsMessageContentClass } from '../Presentations_common/MessageFrameBase';
import { FormPresentationBase, FormPresentationBaseGlobalOptions, FormPresentationBaseOptions } from './FormPresentationBase';
/**
 * A form presentation that displays the Validation Summary widget.
 * 
 * This presentation has 3 components:
 * 1. The container element for the validation summary messages.
 *    Its the element the user adds to the page.
 *    It gets fixed and variant CSS classes applied to it.
 * 2. Message Frame object, which wraps the Message Content component together
 *    with optional elements like icon, header, and footer.
 *    These are the same IMessageFrame objects used in other parts of the validation system.
 * 3. Message Content component, which contains the actual validation message text.
 *    This is the same content from IssuesFoundFormatterService used elsewhere in the validation system.
 * 
 * ## CSS Class Resolution
 * - permenant classes: 'jivs-validationsummary'
 *   Add your own permanent classes within the options.variationClasses property.
 * - ValidationState.issuesFound.length > 0 
 *   'jivs-has-issues'
 * 
 * ## Handy tricks
 * - Change the MessageFrame parameter to reshape the content layout and appearance.
 * - The HeaderFooterMessageFrame supports the {Count} token in the header and footer
 * to show the total count. IconMessageFrame also supports a header with {Count} token.
 * - Bubbles up the IssueClicked event when the user clicks on any validation issue within the summary.
 *   It contains the field name which you can use to direct focus to that field.
 * 
 */
export class ValidationSummaryPresentation
    <TOptions extends ValidationSummaryPresentationOptions = ValidationSummaryPresentationOptions>
    extends FormPresentationBase<TOptions>
{
    constructor(element: HTMLElement, messageFrame: IMessageFrame, options: TOptions)
    {
        super(element, options);
        assertNotNull(messageFrame, 'messageFrame');        
        this._messageFrame = messageFrame;
    }
    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.validationSummary;
    }
    /**
     * Provides the content of the message frame component.
     */
    protected get messageFrame(): IMessageFrame
    {
        return this._messageFrame;
    }
    private _messageFrame: IMessageFrame;


    public override setDomServices(valueHostsManager: IValueHostsManager): void
    {
        super.setDomServices(valueHostsManager);
        this.messageFrame.setDomServices(this.domServices);
    }
    /**
     * A CSS class that is applied when issues are found.
     * Defaults to 'jivs-has-issues' if not provided in the constructor.
     */
    public get hasIssuesClass(): string[]
    {
        return ['jivs-has-issues'];
    }
    /**
     * @param list - adds 'jivs-errormessagedisplay' to the list of persistent classes.
     */
    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-validationsummary');
        if (this.messageFrame.needsContainerUpdate())
        {
            list.push(jivsMessageContentClass); // jivs-messagecontent
        }
    }    

    public override init(valueHostsManager: IValueHostsManager): void
    {
        super.init(valueHostsManager);
        // attach the click event listener to the container element
        this._clickListenerHandler = this.fireIssueClicked.bind(this);
        this.element.addEventListener('click', this._clickListenerHandler);
    }
    private _clickListenerHandler: null | ((event: Event) => void) = null;

    protected fireIssueClicked(event: Event): void
    {
        const target = event.target as HTMLElement;
        const closest = target.closest('[data-identifier]') as HTMLElement;
        const identifier = closest?.getAttribute('data-identifier');
        if (identifier) {
            this.element.dispatchEvent(new IssueClickedEvent(identifier));
        }
    }

    /**
     * Applies the issues found to the presentation, typically by updating the visual state.
     * Subclasses will use MessageFrame to populate the content of the error message display
     * because the target element may be a different element than presentationElement, such as
     * a new element intended to be the host of a popup.
     * @param valueHost The host of the field value.
     * @param issuesFound The list of issues found for the field value.
     */
    protected applyIssuesFound(valueHostsManager: IValueHostsManager, issuesFound: IssueFound[]): void
    {
        this.addClasses(this.presentationElement, this.hasIssuesClass);
        this.messageFrame.apply(this.presentationElement, issuesFound,
            valueHostsManager, null);        
    }
    /**
     * Removes the issues found from the presentation, typically by clearing the visual state.
     */
    protected removeIssuesFound(): void
    {
        this.removeClasses(this.presentationElement, this.hasIssuesClass);
        this.presentationElement.textContent = '';        
    }

    protected override applyCore(valueHostsManager: IValueHostsManager, state: ValidationState): void
    {
        this.removeIssuesFound();   // clear earlier state
        if (state.issuesFound && state.issuesFound.length > 0)
        {
            this.applyIssuesFound(valueHostsManager, state.issuesFound);
        }
    }

    public override dispose(): void
    {
        if (this._clickListenerHandler) {
            this.element.removeEventListener('click', this._clickListenerHandler);
            this._clickListenerHandler = null;
        }
        super.dispose();
        this._messageFrame = null as any;
    }
}

export interface ValidationSummaryPresentationGlobalOptions extends FormPresentationBaseGlobalOptions
{
}

export interface ValidationSummaryPresentationOptions
    extends FormPresentationBaseOptions,
        ValidationSummaryPresentationGlobalOptions
{
}

/**
 * Event fired when a validation issue is clicked on an issue found, so long as it
 * has been tagged with that issue found in the data-identifier attribute.
 * 
 * <span data-errorcode="RequireText" data-identifier="username" data-severity="error">
 *      Username is required.
 * </span>
 */
export class IssueClickedEvent extends Event
{
    /**
     * The field name is the same value as FieldValueHost.getElementIdentifier
     * @param elementIdentifier 
     */
    constructor(elementIdentifier: string)
    {
        super('IssueClicked');
        this._elementIdentifier = elementIdentifier;
    }

    public get elementIdentifier(): string
    {
        return this._elementIdentifier;
    }

    private _elementIdentifier: string;
}