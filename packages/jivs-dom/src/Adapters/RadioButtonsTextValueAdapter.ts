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

    constructor(radioButton: IJivsDomElement)
    {
        super(radioButton);
    }

    protected getRadios(): HTMLInputElement[]
    {
        const radioButton = this.element as HTMLInputElement;
        if (!radioButton.name)
        {
            return [radioButton];
        }

        const parent = radioButton.parentElement;
        if (!parent)
        {
            return [radioButton];
        }

        return Array.from(
            parent.querySelectorAll<HTMLInputElement>(
                `input[type="radio"][name="${radioButton.name}"]`
            )
        );
    }
}