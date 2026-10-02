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
import { FieldPresentationBase } from './FieldPresentationBase';

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
 *
 * Each configured property must contain one CSS class name without a leading
 * period. Assign properties in a derived class to enable the corresponding
 * presentation behavior.
 */
export abstract class IsValidFieldPresentationBase<TElement extends HTMLElement = HTMLElement>
    extends FieldPresentationBase<TElement>
{
    constructor(element: TElement,
        invalidClass?: string | null,
        validatedClass?: string | null,
        correctedClass?: string | null,
        requiredClass?: string | null,
        presentationClass?: string | null,
    )
    {
        super(element);
        this._presentationClass = this.defaultPresentationClass();
        this._invalidClass = (invalidClass !== undefined) ? invalidClass : this.defaultInvalidClass();
        this._validatedClass = (validatedClass !== undefined) ? validatedClass : this.defaultValidatedClass();
        this._correctedClass = (correctedClass !== undefined) ? correctedClass : this.defaultCorrectedClass();
        this._requiredClass = (requiredClass !== undefined) ? requiredClass : this.defaultRequiredClass();
        this._presentationClass = (presentationClass !== undefined) ? presentationClass : this.defaultPresentationClass();
    }
    /**
     * A stable CSS class added every time apply() runs, regardless of the
     * field's required or validation state.
     *
     * Use it to identify the presentation element, establish neutral layout,
     * integrate with an application's design system, or provide a stable
     * selector for rules using :has().
     *
     * Leave null when the presentation does not need a stable class.
     * 
     * Override defaultPresentationClass in a derived class to provide a default
     * CSS class for the presentation element. This class has a default of null.
     */
    
    public get presentationClass(): string | null
    {
        if (this._presentationClass === undefined) {
            this._presentationClass = this.defaultPresentationClass();
        }
        return this._presentationClass;
    }
    public set presentationClass(value: string | null) {
            this._presentationClass = value;
    }
    protected defaultPresentationClass(): string | null {
        return null;
    }
    private _presentationClass: string | null | undefined;

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
     * CSS class for invalid fields. This class has a default of null.
     */
    public get invalidClass(): string | null
    {
        return this._invalidClass;
    }
    public set invalidClass(value: string | null) {
            this._invalidClass = value;
    }
    protected defaultInvalidClass(): string | null {
        return null;
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

        if (this.requiredClass !== null)
            element.classList.remove(this.requiredClass);
        if (this.invalidClass !== null)
            element.classList.remove(this.invalidClass);
        if (this.validatedClass !== null)
            element.classList.remove(this.validatedClass);
        if (this.correctedClass !== null)
            element.classList.remove(this.correctedClass);

        if (this.presentationClass !== null)
            element.classList.add(this.presentationClass);

        // ordering of these 3 is intentional: invalid, corrected, validated
        let corrected = false;
        if (!state.isValid)
        {
            if (this.invalidClass !== null)
                element.classList.add(this.invalidClass);
        }
        else if (state.corrected)
        {
            if (this.correctedClass !== null)
            {
                element.classList.add(this.correctedClass);
                corrected = true;
            }
        }
        if (!corrected && state.status === ValidationStatus.Valid)
        {
            if (this.validatedClass !== null)
                element.classList.add(this.validatedClass);
        }

        if (valueHost.required && this.requiredClass !== null)
            element.classList.add(this.requiredClass);

    }
}