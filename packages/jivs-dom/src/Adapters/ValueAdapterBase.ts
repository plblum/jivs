/**
 * Base class for Value Adapters.
 * 
 * A Value Adapter connects ValueHostsManager.onValueChanged callback 
 * an editor widget, allowing it to receive a new native value.
 * 
 * - onValueChanged -> IValueDispatcher -> IValueAdapters -> edited native value
 * 
 * @module jivs-dom/Adapters/AbstractClasses/ValueAdapterBase
 */

import { AdapterBase } from './AdapterBase';

/**
 * Base class for IValueAdapter.
 * 
 * This class ensures that the element is exposed to the derived adapter classes and can be safely accessed.
 */
export abstract class ValueAdapterBase<TElement extends HTMLElement = HTMLElement>
    extends AdapterBase<TElement>
{

    public constructor(element: TElement)
    {
        super(element);
    }

    /**
     * Reads the current value from the widget. Returns undefined if no value is present.
     * Used by change event handlers from the editor to determine the current value of the widget
     * before passing it along to IFieldValueHost.setValue().
     */
    public abstract readValue(): unknown;

    /**
     * Writes the specified native value to the widget in an editor specific way.
     * Used as part of the onValueChanged callback process.
     * @param value - The native value to be written to the widget. 
     * Can be undefined to indicate there is no value available.
     * The Adapter determines what to do with undefined values.
     */
    public abstract writeValue(value: unknown): void;
}