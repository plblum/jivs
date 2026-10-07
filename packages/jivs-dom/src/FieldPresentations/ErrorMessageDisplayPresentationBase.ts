import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IIssuesFoundDisplay } from '../Interfaces/IIssuesFoundDisplay';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { FieldPresentationBase } from './FieldPresentationBase';

/**
 * Base class for error message display Field presentations.
 * At this level, its apply() function determines if there are issues
 * by checking validationstate.issuesFound?.count > 0.
 * It updates the style class with 'jivs-has-issues' when issues are found
 * and removes it when no issues are found.
 * It provides these methods that are expected to be inherited by subclasses.
 * - applyIssuesFound()
 * - removeIssuesFound()
 * 
 * The CSS classes used by this presentation are:
 * - One or more fixed presentation classes.
 * - Using the variationClass property, an additional presentation class that offers a variation, such as 'jivs-inline-error-messages'
 * - A style class applied when issues are found: 'jivs-has-issues'
 * 
 * This class always adds 'jivs-error-message-display' to the presentation element.
 * InlineErrorMessageDisplayPresentation also adds 'jivs-inline-error-message-display'.
 * TriggeredErrorMessageDisplayPresentationBase also adds 'jivs-triggered-error-message-display'.
 * 
 * Suppose you are setting up CSS for InlineErrorMessageDisplayPresentation, you would target the 'jivs-inline-error-message-display' class.
 * ```css
 * .jivs-inline-error-message-display 
 * {
 * }
 * ```
 * The you want some additional styling for various use cases:
 * You create this, where '.jivs-awesome-error-messages' is the additional class you want to apply.
 * Set that in variationClass when constructing the presentation.
 * ```css
 * .jivs-inline-error-message-display.jivs-awesome-error-messages 
 * {
 * }
 * ``` 
 * Examples:
 * ```html
 * <!-- valid has no content but has the presentation classes applied -->
 * <div class="jivs-error-message-display jivs-inline-error-message-display">
 * </div>
 * 
 * <!-- adding variationClass='jivs-awesome-error-messages' -->
 * <div class="jivs-error-message-display jivs-inline-error-message-display jivs-awesome-error-messages">
 * </div>
 * 
 * <!-- invalid has content, all presentation classes, and 'jivs-has-issues' applied -->
 * <div class="jivs-error-message-display jivs-inline-error-message-display jivs-awesome-error-messages jivs-has-issues">
 *     <!-- Error messages will be displayed here -->
 * </div>
 * ```
 */
export abstract class ErrorMessageDisplayPresentationBase extends FieldPresentationBase
{
    /**
     * Initializes a new instance of the error message display presentation.
     * @param element The DOM element that this presentation is associated with.
     * @param anchor The element containing the IJivsDomElement wrapper.
     * It is often the same as the element itself.
     * @param issuesFoundDisplay The display component for issues found.
     * @param variationClass The CSS class for the presentation element.
     * @param hasIssuesClass The CSS class applied when issues are found.
     */
    constructor(element: HTMLElement, anchor: IJivsDomElement,
        issuesFoundDisplay: IIssuesFoundDisplay, variationClass?: string, hasIssuesClass?: string)
    {
        super(element, anchor);
        assertNotNull(issuesFoundDisplay, 'issuesFoundDisplay');
        this._issuesFoundDisplay = issuesFoundDisplay;
        this._variationClass = variationClass ?? this.defaultVariationClass();
        this._hasIssuesClass = hasIssuesClass ?? this.defaultHasIssuesClass();
    }

    /**
     * Presentation specific for displaying the Issues Found.
     * Required parameter of the constructor.
     */
    protected get issuesFoundDisplay(): IIssuesFoundDisplay
    {
        return this._issuesFoundDisplay;
    }
    private _issuesFoundDisplay: IIssuesFoundDisplay;

    /**
     * Each presentation class adds "presentation class names" to the presentation element
     * that are always present. Those names are fixed. You can add new presentation classes
     * to provide variations of the presentation using this property.
     * Defaults to null.
     */
    public get variationClass(): string | null
    {
        return this._variationClass;
    }
    private _variationClass: string | null;
    protected defaultVariationClass(): string | null
    {
        return null;
    }
    
    /**
     * A style class name that is applied when issues are found.
     * Defaults to 'jivs-has-issues' if not provided in the constructor.
     */
    public get hasIssuesClass(): string | null
    {
        return this._hasIssuesClass;
    }
    private _hasIssuesClass: string | null;
    protected defaultHasIssuesClass(): string | null
    {
        return 'jivs-has-issues';
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
        let presentationClasses: string[] = [];
        this.gatherPersistentClasses(presentationClasses);
        for (let cls of presentationClasses)
        {
            this.presentationElement.classList.add(cls);
        }
        this.issuesFoundDisplay.setDomServices(valueHostsManager.services.domServices);        
    }

    /**
     * Gathers all persistent classes that should be applied to the presentation element.
     * Override this method to add more persistent classes as needed but
     * be sure to call the base implementation to include the default persistent classes.
     * @param list 
     */
    protected gatherPersistentClasses(list: string[]): void
    {
        list.push('jivs-error-message-display');
        if (this.variationClass)
        {
            list.push(this.variationClass);
        }
    }

    /**
     * Applies the issues found to the presentation, typically by updating the visual state.
     * Subclasses will use IssueFoundDisplay to populate the content of the error message display
     * because the target element may be a different element than presentationElement, such as
     * a new element intended to be the host of a popup.
     * @param valueHost The host of the field value.
     * @param issuesFound The list of issues found for the field value.
     */
    protected applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        if (this.hasIssuesClass)
        {
            this.presentationElement.classList.add(this.hasIssuesClass);
        }
    }
    /**
     * Removes the issues found from the presentation, typically by clearing the visual state.
     */
    protected removeIssuesFound(): void
    {
        if (this.hasIssuesClass)
        {
            this.presentationElement.classList.remove(this.hasIssuesClass);
        }
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

}