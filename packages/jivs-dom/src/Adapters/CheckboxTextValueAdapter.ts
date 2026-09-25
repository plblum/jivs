/**
 * Adapter for HTML checkbox input elements using its InputHtmlElement.checked property
 * to determine the text value of the checkbox element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/CheckboxTextValueAdapter
 */


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