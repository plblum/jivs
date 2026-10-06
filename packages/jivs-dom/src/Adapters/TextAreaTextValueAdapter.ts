/**
 * Adapter for HTML textarea elements using its HTMLTextAreaElement.value property
 * to get and set the text value of the textarea element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/TextAreaTextValueAdapter
 */

import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { TextValueAdapterBase } from './TextValueAdapterBase';

/**
 * Adapter for HTML textarea elements using its HTMLTextAreaElement.value property
 * to get and set the text value of the textarea element.
 * 
 * Exposed by the TextAreaEditorAdapterDefinition.
 */
export class TextAreaTextValueAdapter
    extends TextValueAdapterBase<HTMLTextAreaElement> {
    /**
     * Constructor
     * @param element - the element where the value is found
     * @param anchor - the element that retains the IJivsDomElement structure.
     * It is usually the same as element. Pass null to declare element as its value.
     */
    public constructor(element: HTMLTextAreaElement, anchor: IJivsDomElement | null = null)
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