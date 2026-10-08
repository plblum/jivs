/**
 * Applies configurable CSS classes representing validation and required states.
 *
 * Derived classes configure the class-name properties appropriate to their
 * presentation. A null property disables that presentation state.
 *
 * Validation-result classes are mutually exclusive. Invalid takes precedence,
 * followed by corrected and then successfully validated. The required class is
 * independent and may coexist with any validation-result class.
 *
 * @module jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { FieldPresentationBase, FieldPresentationBaseOptions } from './FieldPresentationBase';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Base class for field presentations that communicate validity and required
 * state by adding and removing CSS classes.
 * 
 * It targets roles of editor, label, container, and required. Its not suitable
 * for error messages.
 * 
 * ## CSS Class Resolution
 * - permenant classes: 'jivs-isvalidpresentation' + subclass supplied permanent classes
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - ValueHostValidationState.isValid = false: 
 *   'jivs-invalid'
 * - ValueHostValidationState.isValid = true, ValueHostValidationState.status = ValidationStatus.Valid and ValueHostValidationState.corrected = false:
 *   'jivs-validated' class is applied.
 * - ValueHostValidationState.isValid = true, ValueHostValidationState.status = ValidationStatus.Valid and ValueHostValidationState.corrected = true:
 *   'jivs-corrected' class is applied.
 * - valueHost.required = true: 
 *   'jivs-required' class is applied.
 */
export abstract class IsValidFieldPresentationBase<TElement extends HTMLElement = HTMLElement>
    extends FieldPresentationBase<TElement>
{
    /**
     * Constructor for IsValidFieldPresentationBase class.
     * @param element The HTML element associated with this field presentation.
     * @param options Configuration options for the field presentation.
     * Passing null explicitly disables the corresponding class - except InvalidClass, while omitting the option uses 
     * the default supplied by this class or a derived class.
     * @param anchor The Jivs DOM element associated with this field presentation, if any.
     * When null, it indicates that element itself is used as the Jivs DOM element.
     */
    constructor(element: TElement,
        options? : IsValidFieldPresentationOptions,
        // intentionally last as its usually called from internal code
        anchor: IJivsDomElement | null = null
    )
    {
        super(element, options, anchor);
        this._validatedClassEnabled = options?.validatedClassEnabled ?? this.defaultValidatedClassEnabled();
        this._correctedClassEnabled = options?.correctedClassEnabled ?? this.defaultCorrectedClassEnabled();
        this._requiredClassEnabled = options?.requiredClassEnabled ?? this.defaultRequiredClassEnabled();
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-isvalidpresentation');
    }
    
    /**
     * CSS class added when state.isValid is false.
     * It has fixed value of 'jivs-invalid'.
     */
    protected get invalidClass(): string[]
    {
        return ['jivs-invalid'];
    }


    /**
     * CSS class added when validation completed with
     * ValueHostValidationState.status === ValidationStatus.Valid.
     * It has a fixed value of 'jivs-validated'.
     */
    protected get validatedClass(): string[] 
    {
        return ['jivs-validated'];
    }

    /**
     * Indicates whether the validated CSS class should be applied.
     * Validated CSS Class is an optional feature.
     * Its value can be set by options.validatedClassEnabled.
     * If not set there, it uses a default supplied by this class or a derived class.
     */
    protected get validatedClassEnabled(): boolean
    {
        return this._validatedClassEnabled;
    }
    private _validatedClassEnabled: boolean;

    protected defaultValidatedClassEnabled(): boolean
    {
        return false;
    }

    /**
     * CSS class added when the field is valid and state.corrected is true.
     *
     * Corrected state indicates that previously invalid validation results have
     * been fixed. It takes precedence over validatedClass so the two classes
     * are not added together.
     * 
     * It has a fixed value of 'jivs-corrected'.
     */
    protected get correctedClass(): string[] 
    {
        return ['jivs-corrected'];
    }
    /**
     * Indicates whether the corrected CSS class should be applied.
     * Corrected CSS Class is an optional feature.
     * Its value can be set by options.correctedClassEnabled.
     * If not set there, it uses a default supplied by this class or a derived class.
     */
    protected get correctedClassEnabled(): boolean
    {
        return this._correctedClassEnabled;
    }
    private _correctedClassEnabled: boolean;

    protected defaultCorrectedClassEnabled(): boolean
    {
        return false;
    }

    /**
     * CSS class added when valueHost.required is true.
     *
     * Required state is independent of validation state, so this class may
     * coexist with invalidClass, validatedClass, or correctedClass.
     * 
     * It has a fixed value of 'jivs-required'.
     */
    protected get requiredClass(): string[]
    {
        return ['jivs-required'];
    }

    /**
     * Indicates whether the required CSS class should be applied.
     * Required CSS Class is an optional feature.
     * Its value can be set by options.requiredClassEnabled.
     * If not set there, it uses a default supplied by this class or a derived class.
     */
    protected get requiredClassEnabled(): boolean
    {
        return this._requiredClassEnabled;
    }
    private _requiredClassEnabled: boolean;

    protected defaultRequiredClassEnabled(): boolean
    {
        return false;
    }


    /**
     * Synchronizes the configured CSS classes with the current required and
     * validation state.
     *
     * Every configured state class is removed before the current classes are
     * added. This avoids relying on retained presentation state or assuming
     * that no other code has changed the element's class list.
     *
     * @param valueHost The field value host supplying required state.
     * @param state The field's current validation state.
     */
    public apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        const element = this.presentationElement;

        this.applyToElement(element, valueHost, state);

    }

    /**
     * Helper method for applying the configured CSS classes to a specific element based on the current required and validation state.
     * @param element 
     * @param valueHost 
     * @param state 
     */
    protected applyToElement(element: HTMLElement, valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {

        this.removeClasses(this.invalidClass);
        this.removeClasses(this.validatedClass);
        this.removeClasses(this.correctedClass);

        // ordering of these 3 is intentional: invalid, corrected, validated
        if (!state.isValid)
        {
            this.addClasses(this.invalidClass);
        }
        else if (state.corrected && this.correctedClassEnabled)
        {
            this.addClasses(this.correctedClass);
        }
        else if (state.status === ValidationStatus.Valid)   // fallback for when corrected is setup but without css name
        {
            if (this.validatedClassEnabled)
                this.addClasses(this.validatedClass);
        }

        if (valueHost.required && this.requiredClassEnabled)
            this.addClasses(this.requiredClass);

    }    
}

export interface IsValidFieldPresentationOptions extends FieldPresentationBaseOptions
{
    
    /**
     * Indicates whether the validated CSS class should be applied.
     * Validated CSS Class is an optional feature.
     * Its value can be set by options.validatedClassEnabled.
     * It defaults to false on most subclasses of IsValidFieldPresentation.
     */
    validatedClassEnabled?: boolean;

    /**
     * Indicates whether the corrected CSS class should be applied.
     * Corrected CSS Class is an optional feature.
     * Its value can be set by options.correctedClassEnabled.
     * It defaults to false on most subclasses of IsValidFieldPresentation.
     */
    correctedClassEnabled?: boolean;    

    /**
     * Indicates whether the required CSS class should be applied.
     * Required CSS Class is an optional feature.
     * Its value can be set by options.requiredClassEnabled.
     * It defaults to false on most subclasses of IsValidFieldPresentation.
     * On RequiredIndicatorPresentation it defaults to true.
     */
    requiredClassEnabled?: boolean;
}