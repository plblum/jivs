/**
 * Base class for Text Value Adapter.
 * 
 * A Text Value Adapter connects ValueHostsManager.onTextValueChanged callback 
 * an editor widget, allowing it to receive a new string value.
 * 
 * - onTextValueChanged -> ITextValueDispatcher -> ITextValueAdapters -> edited text value
 * 
 * @module jivs-dom/Adapters/AbstractClasses/TextValueAdapterBase
 */

import { AdapterBase } from './AdapterBase';

/**
 * Base class for ITextValueAdapter.
 */
export abstract class TextValueAdapterBase<TElement extends HTMLElement = HTMLElement>
    extends AdapterBase<TElement>
{

    public constructor(element: TElement)
    {
        super(element);
    }

    /**
     * Reads the current text value from the widget. Returns undefined if no value is present.
     * Used by change event handlers from the editor to determine the current value of the widget
     * before passing it along to IFieldValueHost.setTextValue().
     */
    public abstract readTextValue(): string | undefined;

    /**
     * Writes the specified text value to the widget in an editor specific way.
     * Used as part of the onTextValueChanged callback process.
     * @param textValue The text value to be written to the widget. 
     * Can be undefined to indicate there is no value available.
     * The Adapter determines what to do with undefined values.
     */
    public abstract writeTextValue(textValue: string | undefined): void;
}