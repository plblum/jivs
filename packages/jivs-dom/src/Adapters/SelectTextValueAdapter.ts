/**
 * Adapter for HTML select elements using its HTMLSelectElement.value property
 * to get and set the text value of the select element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/SelectTextValueAdapter
 */

import { DomTextValueAdapterBase } from './DomTextValueAdapterBase';

/**
 * Adapter for HTML select elements using its HTMLSelectElement.value property
 * to get and set the text value of the select element.
 * 
 * There are actually 3 values related to each select Option element:
 * 1. The text content of the option (option.text)
 * 2. The value attribute of the option (option.value)
 * 3. The index of the option within the select element (option.index)
 * 
 * This adapter specifically deals with the value attribute of the selected option.
 * 
 * Exposed by the SelectEditorAdapterDefinition.
 */
export class SelectTextValueAdapter
    extends DomTextValueAdapterBase<HTMLSelectElement>
{

    public readTextValue(): string
    {
        return this.element.value;
    }

    public writeTextValue(textValue: string | undefined): void
    {
        this.element.value = textValue ?? "";
    }
}