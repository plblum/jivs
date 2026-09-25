/**
 * Adapter for HTML input elements using its InputHtmlElement.value property
 * to get and set the text value of the input element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/InputTextValueAdapter
 */

import { TextValueAdapterBase } from './TextValueAdapterBase';

/**
 * Adapter for HTML input elements using its InputHtmlElement.value property
 * to get and set the text value of the input element.
 * 
 * Exposed by the InputEditorAdapterDefinition.
 */
export class InputTextValueAdapter
    extends TextValueAdapterBase<HTMLInputElement> {

    public readTextValue(): string {
        return this.element.value;
    }

    public writeTextValue(textValue: string | undefined): void {
        this.element.value = textValue ?? "";
    }
}