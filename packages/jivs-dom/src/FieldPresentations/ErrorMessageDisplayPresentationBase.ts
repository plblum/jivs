import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IMessageFrame } from '../Interfaces/IMessageFrame';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { FieldPresentationBase, FieldPresentationBaseOptions } from './FieldPresentationBase';

/**
 * Base class for error message display Field presentations.
 * At this level, its apply() function determines if there are issues
 * by checking validationstate.issuesFound?.count > 0.
 * It updates the CSS classes with 'jivs-has-issues' when issues are found
 * and removes it when no issues are found.
 * 
 * It provides these methods that are expected to be inherited by subclasses.
 * - applyIssuesFound()
 * - removeIssuesFound()
 * 
 * ## CSS Classes
 * - persistent classes: 'jivs-errormessagedisplay'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - stateful classes: 'jivs-has-issues'
 * 
 */
export abstract class ErrorMessageDisplayPresentationBase extends FieldPresentationBase
{
    /**
     * Initializes a new instance of the error message display presentation.
     * @param element The DOM element that this presentation is associated with.
     * @param anchor The element containing the IJivsDomElement wrapper.
     * It is often the same as the element itself.
     * @param messageFrame The display component for issues found.
     * @param variationClass The CSS class for the presentation element.
     * @param hasIssuesClass The CSS class applied when issues are found.
     */
    constructor(element: HTMLElement, 
        messageFrame: IMessageFrame,
        options?: ErrorMessageDisplayPresentationBaseOptions,
        anchor?: IJivsDomElement | null)
    {
        super(element, options, anchor);
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
    
    /**
     * A CSS class that is applied when issues are found.
     * Defaults to 'jivs-has-issues' if not provided in the constructor.
     */
    public get hasIssuesClass(): string[]
    {
        return ['jivs-has-issues'];
    }


    protected override get presentationElement(): HTMLElement
    {
        return this.element;
    }

    /**
     * Gathers all presentation classes and adds them to the presentation element.
     * Override gatherPresentationClasses() to add more.
     */
    public override init(valueHostsManager: IValueHostsManager): void
    {
        super.init(valueHostsManager);
        this.messageFrame.setDomServices(valueHostsManager.services.domServices);        
    }

    /**
     * @param list - adds 'jivs-errormessagedisplay' to the list of persistent classes.
     */
    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-errormessagedisplay');
    }

    /**
     * Applies the issues found to the presentation, typically by updating the visual state.
     * Subclasses will use MessageFrame to populate the content of the error message display
     * because the target element may be a different element than presentationElement, such as
     * a new element intended to be the host of a popup.
     * @param valueHost The host of the field value.
     * @param issuesFound The list of issues found for the field value.
     */
    protected applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        this.addClasses(this.hasIssuesClass);
    }
    /**
     * Removes the issues found from the presentation, typically by clearing the visual state.
     */
    protected removeIssuesFound(): void
    {
        this.removeClasses(this.hasIssuesClass);
    }

    /**
     * Routes the validation state to the appropriate handler methods,
     * applyIssuesFound or removeIssuesFound based on the validation state.
     * @param valueHost The host of the field value.
     * @param state The validation state of the value host.
     */
    public apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        this.ensureValueHostInitialized(valueHost);

        this.removeIssuesFound();   // clear earlier state
        if (state.issuesFound && state.issuesFound.length > 0)
        {
            this.applyIssuesFound(valueHost, state.issuesFound);
        }
    }
    
    /**
     * Only apply() has access to stateful data like valueHost and its
     * ValueHostsManager. So it calls this but expects a one-time initialization.
     * @param valueHost 
     */
    protected ensureValueHostInitialized(valueHost: IFieldValueHost): void
    {
        if (!this._valueHostInitialized)
        {
            this.ensureValueHostInitializedWorker(valueHost);
            this._valueHostInitialized = true;
        }
    }
    private _valueHostInitialized: boolean = false;    

    /**
     * Performs the one-time initialization logic for the error message display presentation.
     * @param valueHost 
     */
    protected ensureValueHostInitializedWorker(valueHost: IFieldValueHost): void
    {
    }
    public override dispose(): void
    {
        super.dispose();
        this._messageFrame = undefined as any;
    }
}

export interface ErrorMessageDisplayPresentationBaseOptions extends FieldPresentationBaseOptions
{
}