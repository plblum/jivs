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
import { EditorFieldPresentationBase } from './EditorFieldPresentationBase';

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
 * 
 * ## Style Classes
 * - persistent classes: 'jivs-editor-radiobuttons', 'jivs-editor', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'radiobuttonsEditor'.
 * RadioButtonsAdapterDefinition should use this presentation name: 'radiobuttonsEditor'.
 */
export class RadioButtonsPresentation extends EditorFieldPresentationBase
{
    /**
     * Creates an instance of the RadioButtonsPresentation class.
     * @param radioButton The HTML input element of type radio associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.
     * @param anchor The Jivs DOM element associated with this field presentation, if any.
     */
    constructor(radioButton: HTMLElement,
        options?: RadioButtonsFieldPresentationOptions,
        anchor?: IJivsDomElement | null
    )
    {
        super(
            radioButton,
            {
                variationClasses: options?.presentationClass,

        // not used for radio buttons presentation:
                correctedClassEnabled: false,
                requiredClassEnabled: false,
                validatedClassEnabled: false
            },
            anchor
        );

    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-editor-radiobuttons');
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

export interface RadioButtonsFieldPresentationOptions
{
    invalidClass?: string; // does not support null - must always provide a valid CSS class for invalid state
    presentationClass?: string | null;
}