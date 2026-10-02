/**
 * Presentation for a group of radio buttons within a form.
 * NOTE: This is designed around passing in one input from a group into the constructor.
 * The rest of the buttons are found as siblings with the same name attribute.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/RadioButtonsPresentation
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IsValidFieldPresentationBase } from './IsValidFieldPresentationBase';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Presentation for HTML input tags that feature a radio button.
 * NOTE: This is designed around passing in one input from a group into the constructor.
 * The rest of the buttons are found as siblings with the same name attribute.
 * 
 * It only applies the invalidClass across the group's input elements.
 * The validatedClass, correctedClass, and requiredClass 
 * are not applied across the group's input elements because they provide an awkward visual experience.
 * 
 * We recommend enclosing a radio button group in a wrapper tag and using
 * RadioGroupPresentation instead, along with its companion RadioGroupAdapterDefinition.
 * It provides a better presentation.
 * 
 * That includes these type= attribute values: radio
 * Its default css classes are:
 * - invalidClass: jivs-invalid-editor-radiobuttons
 * - validatedClass: do not use
 * - correctedClass: do not use
 * - requiredClass: do not use
 * - presentationClass: null
 * 
 * Registered with FieldPresentationFactory as presentation name 'radiobuttonsEditor'.
 * RadioButtonsAdapterDefinition should use this presentation name: 'radiobuttonsEditor'.
 */
export class RadioButtonsPresentation extends IsValidFieldPresentationBase
{
    /**
     * 
     * @param radioButton 
     * @param invalidClass - note that this parameter does not allow null, unlike its ancestor
     * because the RadioPresentation class always expects a valid CSS class for invalid state and does not support a null value.
     */
    constructor(radioButton: HTMLElement,
        invalidClass?: string, // does not support null - must always provide a valid CSS class for invalid state
        jivsElement?: IJivsDomElement | null
    )
    {
        super(radioButton, invalidClass ?? undefined, undefined, undefined, undefined, undefined, jivsElement);
        // discard values from the remaining parameters as they are not used for radio buttons presentation
        this.correctedClass = null;
        this.requiredClass = null;
        this.validatedClass = null;
        // presentation remains a valid CSS class if it was set
    }

    protected override defaultInvalidClass(): string | null
    {
        return 'jivs-invalid-editor-radiobuttons';
    }

    /**
     * Adds or removes the invalidClass on all radio buttons in the same group.
     * Adds presentationClass to all radio buttons in the same group if supplied.
     *
     * @param valueHost The field value host supplying required state.
     * @param state The field's current validation state.
     */
    public override apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        const radioButton = this.presentationElement as HTMLInputElement;
        if (!radioButton.name) return;

        const parent = radioButton.parentElement;
        if (!parent)
        {
            return;
        }

        let radioButtons = parent.querySelectorAll<HTMLInputElement>(
                `input[type="radio"][name="${ radioButton.name }"]`
            );
        for (const rb of radioButtons)
        {
            this.applyToElement(rb, valueHost, state);
        }

    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for RadioButtonsAdapterDefinition.
 */
export const defaultRadioButtonsPresentationName = 'radiobuttonsEditor';