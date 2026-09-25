/**
 * Adapter for HTML textarea elements using its TextAreaHtmlElement.value property
 * to get and set the text value of the textarea element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/TextAreaTextValueAdapter
 */

import { TextValueAdapterBase } from './TextValueAdapterBase';

/**
 * Adapter for HTML textarea elements using its HTMLTextAreaElement.value property
 * to get and set the text value of the textarea element.
 * 
 * Exposed by the TextAreaEditorAdapterDefinition.
 */
export class TextAreaTextValueAdapter
    extends TextValueAdapterBase<HTMLTextAreaElement> {

    public readTextValue(): string {
        return this.element.value;
    }

    public writeTextValue(textValue: string | undefined): void {
        this.element.value = textValue ?? "";
    }
}