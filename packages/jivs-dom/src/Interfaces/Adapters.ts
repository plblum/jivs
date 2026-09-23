/**
 * Provides interfaces for DOM editor adapters, including text and native value adapters.
 * 
 * An Adapter connects a general ValueHostsManager callback request like textvaluechanged 
 * or validationstatechanged to the specific DOM element or widget instance.
 * 
 * The callback first communicates with a Dispatcher which identifies the destination DOM element or widget.
 * 
 * IEditorAdapterDefinitions coordinate the creation and management of editor adapters for specific widget models.
 * 
 * The host element must have already installed the necessary editor adapters in its 
 * IJivsDomElement interface properties.
 * 
 * - onTextValueChanged -> ITextValueDispatcher -> IDomTextValueAdapters
 * - onValueChanged -> IValueDispatcher -> IDomValueAdapters
 * 
 * @module jivs-dom/Types/Adapters
 * 
 */


/**
 * Provides text value read/write capabilities for a specific editor widget.
 * Determined by IEditorAdapterDefinition, which only creates this if
 * the editor supports text value read/write operations.
 */
export interface IDomTextValueAdapter
{
    /**
     * Reads the current text value from the widget. Returns undefined if no value is present.
     * Used by change event handlers from the editor to determine the current value of the widget
     * before passing it along to IFieldValueHost.setTextValue().
     */
    readTextValue(): string | undefined;

    /**
     * Writes the specified text value to the widget in an editor specific way.
     * Used as part of the onTextValueChanged callback process.
     * @param textValue The text value to be written to the widget. 
     * Can be undefined to indicate there is no value available.
     * The Adapter determines what to do with undefined values.
     */
    writeTextValue(textValue: string | undefined): void;
}

/**
 * Provides native value read/write capabilities for a specific widget.
 * Determined by IEditorAdapterDefinition, which only creates this if
 * the editor supports native value read/write operations.
 * It is less used than IDomTextValueAdapter because most widgets primarily deal with text values 
 * rather than native values. As a result, only create it if the widget truly requires native value handling.
 */
export interface IDomValueAdapter
{
    /**
     * Reads the current native value from the widget. Returns undefined if no value is present.
     * Used by change event handlers from the editor to determine the current value of the widget
     * before passing it along to IFieldValueHost.setValue().
     */
    readValue(): unknown;

    /**
     * Writes the specified native value to the widget in an editor specific way.
     * @param value The native value to be written to the widget. 
     * Can be undefined to indicate there is no value available.
     * The Adapter determines what to do with undefined values.
     */
    writeValue(value: unknown): void;
}
