/**
 * PlaceholderTextValueAdapter provides a read-only text value adapter for 
 * HTML tags with textContent support (span, div, etc).
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/PlaceholderTextValueAdapter
 */

import { IJivsElement } from '../Interfaces/IJivsElement';
import { TextValueAdapterBase } from './TextValueAdapterBase';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';

/**
 * An HTML tag with textContent support (span, div, etc) can act in the role of an editor, albeit
 * a read-only editor, meaning it can display text but cannot be directly edited by the user.
 * We target this for showing the text values of FieldValueHosts that
 * aren't intended to be directly edited by the user.
 * It benefits from FieldValueHosts having so many tools
 * for managing and formatting the text values, plus the ability to
 * report changes through the TextValueDispatcher.
 * 
 * This supports the PlaceholderAdapterDefinition.
 */
export class PlaceholderTextValueAdapter extends TextValueAdapterBase
{
    constructor(valueHost: IFieldValueHost, element: HTMLElement, jivsElement: IJivsElement | null)
    {
        super(element, jivsElement);
        this._textForUndefined = valueHost.textForUndefinedCalculationValue();
    }
    private _textForUndefined: string;
    public override writeTextValue(textValue: string | undefined): void
    {
        if (textValue === undefined) {
            textValue = this._textForUndefined;
        }
        this.element.textContent = textValue;
    }
    public readTextValue(): string
    {
        return this.element.textContent || '';
    }
}