/**
 * Adapter for HTML input elements using its InputHtmlElement.value property
 * to get and set the text value of the input element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/InputTextValueAdapter
 */

import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { TextValueAdapterBase } from './TextValueAdapterBase';

/**
 * Adapter for HTML input elements using its InputHtmlElement.value property
 * to get and set the text value of the input element.
 * 
 * Exposed by the InputEditorAdapterDefinition.
 */
export class InputTextValueAdapter
    extends TextValueAdapterBase<HTMLInputElement> {
    /**
     * Constructor
     * @param element - the element where the value is found
     * @param anchor - the element that retains the IJivsDomElement structure.
     * It is usually the same as element. Pass null to declare element as its value.
     */
    public constructor(element: HTMLInputElement, anchor: IJivsDomElement | null = null)
    {
        super(element, anchor);
    }

    public readTextValue(): string {
        return this.element.value;
    }

    public writeTextValue(textValue: string | undefined): void {
        this.element.value = textValue ?? "";
    }
}