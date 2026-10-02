/**
 * Adapter for HTML checkbox input elements using its InputHtmlElement.checked property
 * to determine the text value of the checkbox element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/CheckboxTextValueAdapter
 */


import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { TextValueAdapterBase } from './TextValueAdapterBase';

/**
 * Adapter for HTML checkbox input elements using its InputHtmlElement.checked property
 * to determine the text value of the checkbox element.
 * 
 * Exposed by CheckboxEditorAdapterDefinition.
 */
export class CheckboxTextValueAdapter
    extends TextValueAdapterBase<HTMLInputElement>
{
    /**
     * Constructor
     * @param element - the element where the value is found
     * @param jivsElement - the element that retains the IJivsDomElement structure.
     * It is usually the same as element. Pass null to declare element as its value.
     */
    public constructor(element: HTMLInputElement, jivsElement: IJivsDomElement | null = null)
    {
        super(element, jivsElement);
    }
    public readTextValue(): string
    {
        return this.element.checked
            ? this.element.value
            : "";
    }

    public writeTextValue(textValue: string | undefined): void
    {
        this.element.checked = textValue === this.element.value;
    }
}