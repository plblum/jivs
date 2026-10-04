/**
 * Adapter for a group of HTML radio input elements, using their checked property
 * to determine and set the text value of the selected radio element.
 * This adapter expects the constructor is passed one of the radio input elements within the group.
 * It resolves the rest by matching sibling radio input elements with the same name attribute.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/RadioButtonsTextValueAdapter
 */


import { ITextValueAdapter } from '../Interfaces/Adapters';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { RadioButtonsTextValueAdapterBase } from './RadioButtonsTextValueAdapterBase';

/**
 * Adapter for a group of HTML radio input elements, using their checked property
 * to determine and set the text value of the selected radio element.
 * 
 * This implementation REQUIRES that all input type='radio' tags are siblings with the same name attribute
 * and the constructor is passed one of these radio input elements.
 * 
 * It resolves the input element to read or write by querying for all sibling radio input elements with the same name attribute.
 * 
 * Only supply a single radio button from the group into the Element Registry,
 * as all of them are really just one value.
 * 
 * Exposed by RadioButtonsAdapterDefinition.
 */
export class RadioButtonsTextValueAdapter extends RadioButtonsTextValueAdapterBase
    implements ITextValueAdapter
{

    /**
     * Constructor
     * @param radiobutton - one of the radio buttons from the group.
     * @param jivsElement - the element that retains the IJivsDomElement structure.
     * It is usually the same as radiobutton. Pass null to declare radiobutton as its value.
     */
    public constructor(radiobutton: HTMLInputElement, jivsElement: IJivsDomElement | null = null)
    {
        super(radiobutton, jivsElement);
    }

    protected getRadios(): HTMLInputElement[]
    {
        const radioButton = this.element as HTMLInputElement;
        return RadioButtonsTextValueAdapter.getAllSiblingRadioButtons(radioButton);
    }

    /**
     * Gets all sibling radio buttons in the same group as the provided radio button.
     * @param radiobutton - one of the radio buttons from the group.
     * @returns an array of all radio buttons in the same group (same name attribute and parent element).
     */
    public static getAllSiblingRadioButtons(radiobutton: HTMLInputElement): HTMLInputElement[]
    {
        if (radiobutton.type !== 'radio')
        {
            throw new Error("Provided element is not a radio button.");
        }
        if (!radiobutton.name)
        {
            return [radiobutton];
        }

        const parent = radiobutton.parentElement;
        if (!parent)
        {
            return [radiobutton];
        }

        return Array.from(
            parent.querySelectorAll<HTMLInputElement>(
                `input[type="radio"][name="${radiobutton.name}"]`
            )
        );
    }
}
