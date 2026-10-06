import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IIssuesFoundDisplay } from '../Interfaces/IIssuesFoundDisplay';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { FieldPresentationBase } from './FieldPresentationBase';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * Base class for error message display Field presentations.
 * At this level, its apply() function determines if there are issues
 * by checking validationstate.issuesFound?.count > 0.
 * It updates the style class with 'jivs-has-issues' when issues are found
 * and removes it when no issues are found.
 * It provides these methods that are expected to be inherited by subclasses.
 * - applyIssuesFound()
 * - removeIssuesFound()
 */
export abstract class ErrorMessageDisplayPresentationBase extends FieldPresentationBase
{
    /**
     * Initializes a new instance of the error message display presentation.
     * @param element The DOM element that this presentation is associated with.
     * @param anchor The element containing the IJivsDomElement wrapper.
     * It is often the same as the element itself.
     * @param issuesFoundDisplay The display component for issues found.
     * @param presentationClass The CSS class for the presentation element.
     * @param hasIssuesClass The CSS class applied when issues are found.
     */
    constructor(element: HTMLElement, anchor: IJivsDomElement,
        issuesFoundDisplay: IIssuesFoundDisplay, presentationClass?: string, hasIssuesClass?: string)
    {
        super(element, anchor);
        assertNotNull(issuesFoundDisplay, 'issuesFoundDisplay');
        this._issuesFoundDisplay = issuesFoundDisplay;
        this._presentationClass = presentationClass ?? this.defaultPresentationClass();
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
     * A style class name that identifies the presentation as an error message display.
     * Defaults to 'jivs-error-message-display' if not provided in the constructor.
     */
    public get presentationClass(): string | null
    {
        return this._presentationClass;
    }
    private _presentationClass: string | null;
    protected abstract defaultPresentationClass(): string | null;
    
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
        this.ensureInitialized(valueHost);
        if (this.presentationClass)
        {
            this.presentationElement.classList.add(this.presentationClass);
        }
        this.removeIssuesFound();   // clear earlier state
        if (state.issuesFound && state.issuesFound.length > 0)
        {
            this.applyIssuesFound(valueHost, state.issuesFound);
        }
    }
    protected ensureInitialized(valueHost: IFieldValueHost): void
    {
        if (!this._initialized)
        {
            this.presentationElement.classList.add('jivs-error-message-display');
            this.issuesFoundDisplay.setDomServices(valueHost.valueHostsManager.services.domServices);
            this._initialized = true;
        }
    }
    private _initialized: boolean = false;
}