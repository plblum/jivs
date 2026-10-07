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
 * for error messages. It resolves CSS classes based on:
 * - ValueHostValidationState.isValid = false - invalidClass is applied.
 * - ValueHostValidationState.isValid = true, ValueHostValidationState.status = ValidationStatus.Valid and ValueHostValidationState.corrected = false - validatedClass is applied.
 * - ValueHostValidationState.isValid = true, ValueHostValidationState.status = ValidationStatus.Valid and ValueHostValidationState.corrected = true - correctedClass is applied.
 * - valueHost.required = true - requiredClass is applied.
 * - presentationClass is always applied when apply() runs, regardless of state.
 * 
 * Its Css properties use a value of null to indicate that the class isn't used.
 * It assigns InvalidClass to 'jivs-invalid' as a default.
 * Subclasses are expected to supply the presentation class name to build a combined CSS class for the field presentation.
 * Example valid: 
 * ```html
 * <input type="text" class="jivs-editor-input" />
 * ```
 * Example invalid: 
 * ```html
 * <input type="text" class="jivs-invalid jivs-editor-input" />
 * ```
 * Each configured property must contain one CSS class name without a leading
 * period. Assign properties in a derived class to enable the corresponding
 * presentation behavior.
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
        this._invalidClass = (options?.invalidClass != null) ? options.invalidClass : this.defaultInvalidClass(); // options.invalidClass treats null differently: use the default, not disable
        this._validatedClass = (options?.validatedClass !== undefined) ? options.validatedClass : this.defaultValidatedClass();
        this._correctedClass = (options?.correctedClass !== undefined) ? options.correctedClass : this.defaultCorrectedClass();
        this._requiredClass = (options?.requiredClass !== undefined) ? options.requiredClass : this.defaultRequiredClass();
    }
    
    /**
     * CSS class added when state.isValid is false.
     *
     * This class represents validation errors rather than the mere presence of
     * issues. Warning issues may be present while isValid remains true and
     * therefore do not cause this class to be added.
     *
     * Invalid state takes precedence over corrected and validated states.
     * Leave null when this presentation does not visually identify invalid
     * fields.
     * 
     * Override defaultInvalidClass in a derived class to provide a default
     * CSS class for invalid fields. This class has a default of 'jivs-invalid'.
     */
    public get invalidClass(): string | null
    {
        return this._invalidClass;
    }
    public set invalidClass(value: string | null) {
            this._invalidClass = value;
    }
    protected defaultInvalidClass(): string | null {
        return 'jivs-invalid';
    }
    private _invalidClass: string | null;

    /**
     * CSS class added when validation completed with
     * ValueHostValidationState.status === ValidationStatus.Valid.
     *
     * It is added only when the field is valid and state.corrected is false.
     * Leave null when successful validation should not produce a visual
     * treatment.
     * 
     * Override defaultValidatedClass to provide a different default CSS class for validated fields.
     * This class has a default of null.
     */
    public get validatedClass(): string | null
    {
        return this._validatedClass;
    }
    public set validatedClass(value: string | null) {
        this._validatedClass = value;
    }
    protected defaultValidatedClass(): string | null {
        return null;
    }
    private _validatedClass: string | null;

    /**
     * CSS class added when the field is valid and state.corrected is true.
     *
     * Corrected state indicates that previously invalid validation results have
     * been fixed. It takes precedence over validatedClass so the two classes
     * are not added together.
     *
     * Leave null when corrected fields should use the ordinary valid
     * presentation.
     * 
     * Override defaultCorrectedClass to provide a different default CSS class for corrected fields.
     * This class has a default of null.
     */
    public get correctedClass(): string | null
    {
        return this._correctedClass;
    }
    public set correctedClass(value: string | null) {
        this._correctedClass = value;
    }
    protected defaultCorrectedClass(): string | null {
        return null;
    }
    private _correctedClass: string | null; 

    /**
     * CSS class added when valueHost.required is true.
     *
     * Required state is independent of validation state, so this class may
     * coexist with invalidClass, validatedClass, or correctedClass.
     *
     * Leave null when this presentation does not visually identify required
     * fields.
     * 
     * Override defaultRequiredClass to provide a different default CSS class for required fields.
     * This class has a default of null.
     */
    public get requiredClass(): string | null
    {
        return this._requiredClass;
    }
    public set requiredClass(value: string | null)
    {
        this._requiredClass = value;
    }
    protected defaultRequiredClass(): string | null
    {
        return null;
    }
    private _requiredClass: string | null;

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
        if (this.invalidClass !== null)
            element.classList.remove(this.invalidClass);
        if (this.validatedClass !== null)
            element.classList.remove(this.validatedClass);
        if (this.correctedClass !== null)
            element.classList.remove(this.correctedClass);


        // ordering of these 3 is intentional: invalid, corrected, validated
        if (!state.isValid)
        {
            if (this.invalidClass !== null)
                element.classList.add(this.invalidClass);
        }
        else if (state.corrected && this.correctedClass)
        {
            element.classList.add(this.correctedClass);
        }
        else if (state.status === ValidationStatus.Valid)   // fallback for when corrected is setup but without css name
        {
            if (this.validatedClass !== null)
                element.classList.add(this.validatedClass);
        }

        if (this.variationClass !== null)
            element.classList.add(this.variationClass);
        if (valueHost.required && this.requiredClass !== null)
            element.classList.add(this.requiredClass);

    }    
}

export interface IsValidFieldPresentationOptions extends FieldPresentationBaseOptions
{

    /**
     * CSS class added when state.isValid is false.
     *
     * This class represents validation errors rather than the mere presence of
     * issues. Warning issues may be present while isValid remains true and
     * therefore do not cause this class to be added.
     *
     * Invalid state takes precedence over corrected and validated states.
     * Leave null when this presentation does not visually identify invalid
     * fields.
     * 
     * Cannot be null.
     */
    invalidClass?: string;
    /**
     * CSS class added when validation completed with
     * ValueHostValidationState.status === ValidationStatus.Valid.
     *
     * It is added only when the field is valid and state.corrected is false.
     * Leave null when successful validation should not produce a visual
     * treatment.
     * 
     * When null, no CSS class will be added for the validated state.
     */
    validatedClass?: string | null;
    /**
     * CSS class added when the field is valid and state.corrected is true.
     *
     * Corrected state indicates that previously invalid validation results have
     * been fixed. It takes precedence over validatedClass so the two classes
     * are not added together.
     *
     * Leave null when corrected fields should use the ordinary valid
     * presentation.
     */
    correctedClass?: string | null;

    /**
     * CSS class added when valueHost.required is true.
     *
     * Required state is independent of validation state, so this class may
     * coexist with invalidClass, validatedClass, or correctedClass.
     *
     * Leave null when this presentation does not visually identify required
     * fields.
     */
    requiredClass?: string | null;    
}