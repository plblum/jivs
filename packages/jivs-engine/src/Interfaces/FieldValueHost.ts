/**
 * @module jivs-engine/ValueHosts/Types/FieldValueHost
 */
import { ValueAdapterRule } from './ValueAdapterService';
import { IValidatableValueHost, toIValidatableValueHostCallbacks } from './ValidatableValueHostBase';
import
    {
        IValidatorsValueHost, IValidatorsValueHostCallbacks,
        ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState,
        ValidatorsValueHostSetValueOptions
    } from './ValidatorsValueHostBase';
import { ValueHostName } from '../DataTypes/BasicTypes';


/**
 * A ValueHost for validation of a single field-like value. It is the most common ValueHost 
 * you will use because it works both with user input and with model properties to provide validation.
 *
 * On the client side, it supports editing widgets whose values are handled in text form.
 * On the server side, it supports model properties whose incoming values may also arrive
 * in text form before being resolved to their typed form.
 *
 * Because validation may need to evaluate either representation, an IFieldValueHost tracks:
 * - text value - the value exactly as supplied in text form
 * - typed value - the value in its native application form
 *
 * The text value may fail to resolve to the typed value. Conditions that inspect text,
 * such as RequireTextCondition, DataTypeCheckCondition, and RegExpCondition, evaluate
 * the text value. Most other Conditions evaluate the typed value.
 *
 * When configuring the ValueHostsManager for a FieldValueHost, use the builder's field() method.
 * ```ts
 * builder.field("firstName", LookupKey.String);
 * builder.field("birthDate", LookupKey.Date, { label: 'Birth Date' });
 * builder.field("Badge number", LookupKey.String)
 *      .requireText()
 *      .regExp(/^\d{3}\-\d{2}-[A-D]{4}$/);
 * ```
 * If configuring directly from a Config object, use the ValueHostType.Field type and provide a list of ValidatorConfigs.
 * ```ts
 * const config: FieldValueHostConfig = <FieldValueHostConfig>{
 *    valueHostType: ValueHostType.Field,
 *    name: "firstName",
 *    dataType: LookupKey.String,
 * ...and more...
 * };
 * ```
 * 
 * ## Calculated Values
 * The FieldValueHost can become a conduit to calculated values derived from a CalcValueHost.
 * Just supply FieldValueHostConfig.calculation.sourceValueHostName with the name
 * of the CalcValueHost.
 * 
 * Benefits include:
 * - validation of the calculation, which can be reported to the UI
 * - conversion to a text value through a DataTypeFormatter
 * - reporting that text value through the ValueHostsManager.onTextValueChanged callback
 *   so the UI can present the calculated data.
 * - reporting the native value through the ValueHostsManager.onValueChanged callback
 * 
 * Only "active" when calculation itself is defined and its sourceValueHostName property is assigned.
 * Once active, FieldValueHost.readOnly becomes true.
 * It uses the same DataTypeFormatter as other FieldValueHosts for converting the typed value to text.
 */
export interface IFieldValueHost<TOptions extends FieldValueHostSetValueOptions = FieldValueHostSetValueOptions>
    extends IValidatorsValueHost<TOptions>
{

    /**
     * Gets the current text value exactly as last provided.
     * This is the string representation before parsing into the typed value.
     * For example, a date field or posted form value is exposed as text, not as a Date.
     * The text is returned unchanged, with no trimming or other normalization applied.
     * The result will be undefined if the value has never been set or was cleared.
     */
    getTextValue(): string | undefined;

    /**
     * Replaces the text value.
     *
     * Call when application code updates the text representation of the value.
     * On the client side, this is typically called from an onchange handler.
     * On the server side, this is used when incoming data provides text values
     * rather than native typed values.
     *
     * Common server-side examples include:
     * - posted form values
     * - query string values
     * - route values
     * - API or JSON payloads whose values are represented as strings
     *
     * When setting the text value, it is usually important to also set the typed value so that
     * DataTypeCheckCondition can evaluate correctly. DataTypeCheckCondition itself reports
     * an error when the typed value is undefined.
     *
     * The typed value may be set manually. Alternatively, configure a DataTypeParser through
     * TextValueOptionConfig.parserLookupKey to resolve it automatically. When configured,
     * setTextValue() will run the parser and set the typed value for you, including when
     * parsing fails.
     *
     * @param textValue - The text value to store exactly as supplied.
     * @param options - See @see {FieldValueHostSetValueOptions}
     */
    setTextValue(textValue: string | undefined, options?: TOptions): void;

    /**
     * Replaces both the typed value and the text value at the same time,
     * and optionally invokes validation.
     * Use when application code resolves both values together so there is
     * a single state change and validation pass.
     *
     * Note: This function does not use the DataTypeParser feature because
     * the typed value has already been resolved by the caller.
     *
     * @param nativeValue - The typed value to store. Use undefined to indicate that the
     * typed value could not be resolved from the text value, such as when parsing
     * a date from text fails. All other values, including null and the empty string,
     * are treated as real data.
     * @param textValue - The text value to store exactly as supplied.
     * @param options - See @see {FieldValueHostSetValueOptions}
     */
    setValues(nativeValue: any, textValue: string | undefined, options?: TOptions): void;

    /**
     *Returns true for a condition with Category=Require. UI can use it to 
     * display a "requires a value" indicator.
     */
    required: boolean;
    
    /**
     * Returns the value from FieldValueHostConfig.parserLookupKey.
     */
    getParserLookupKey(): string | null | undefined;

    /**
     * The actual property name on the model. If its the same as Config.name,
     * this can be undefined.
     * Helps mapping between model and valuehost.
     */
    getPropertyName(): string;      
    
    /**
     * Supports external data Readers to get the rule for how to handle unassigned values in the external source.
     * Supported by ModelReader, DictionaryReader, FormReader and other subclasses of ValueRulesReaderBase
     * See {@link jivs-engine/ReaderWriter/Types} for details.
     */
    getReaderRule(): ValueAdapterRule | undefined;

    /**
     * Supports external data Writers to get the rule for how to handle the native value when writing to the external source.
     * Supported by ModelWriter and other subclasses of WriterBase
     * See {@link jivs-engine/ReaderWriter/Types} for details.
     */
    getWriterRule(): ValueAdapterRule | undefined;

    /**
     * Identifies the input element in the UI that is associated with this FieldValueHost by either
     * the FieldValueHostConfig.elementIdentifier property or the ValueHost name.
     * This is useful for UI frameworks that need to bind the FieldValueHost to a specific input element.
     * @param template - Optional template to format the element identifier. If provided, the elementIdentifier will be inserted into the template.
     * The string must contain "{0}" as a placeholder for the elementIdentifier. 
     * 
     * The template strategy allows for dynamic generation of element identifiers based on the FieldValueHost's configuration or other context.
     * For example, if the template is "container_{0}_input" and the elementIdentifier is "firstName", 
     * the resulting identifier will be "container_firstName_input".
     * 
     * If no template is provided, the raw elementIdentifier will be returned as-is.
     * 
     * @returns The identifier of the input element associated with this FieldValueHost, 
     * formatted according to the provided template if applicable. 
     * It always returns a value, whether its based on the elementIdentifier or the ValueHost name.
     */
    getElementIdentifier(template?: string): string;
    /**
     * Returns true if the FieldValueHostConfig.elementIdentifier is set or setElementIdentifier set it.
     * Use it to determine you need to use setElementIdentifier() when your plan is to assign it based on
     * the state of the HTML after configuration.
     */
    hasElementIdentifier(): boolean;

    /**
     * Sometimes the element identifier is not known at configuration time and is only known at runtime.
     * This method allows you to set it later, so that the FieldValueHost can be associated with the correct input element in the UI.
     * 
     * @param elementIdentifier - The identifier of the input element associated with this FieldValueHost. Can be null or undefined if no association is needed.
     */
    setElementIdentifier(elementIdentifier: string | null | undefined): void;

    /**
     * Indicates whether the value of this FieldValueHost is calculated based on other values.
     * If true, the value is derived rather than directly set by the user or external source.
     */
    readonly isCalculated: boolean;

    /**
     * Will attempt to calculate the value of the FieldValueHost based on its calculation configuration.
     * @param options 
     * @param valueHostIdThatChanged - The identifier of the value host that triggered this calculation, 
     * if applicable. When supplied, it must be in this calculation's dependency chain.
     * When not supplied, the calculation will proceed regardless of which value host changed.
     * @returns True if the calculation handled this FieldValueHost value, false otherwise.
     * Not impacted on whether the calculation actually ran.
     */
    calculate(options: TOptions, valueHostIdThatChanged?: ValueHostName): boolean;

    /**
     * Provides the text to display when the value of this FieldValueHost is undefined due to a calculation.
     * This can be used to show a placeholder or informative message in the UI.
     * @returns The text to display when the value is undefined due to a calculation. 
     * Values come from FieldValueHostConfig.calculation.textForUndefined and 
     * FieldValueHostConfig.calculation.textForUndefinedl10n.
     * If no text is configured, returns an empty string.
     */
    textForUndefinedCalculationValue(): string;
}
/**
 * Just the data that is used to describe this input value.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to FieldValueHostConfig.
 * This provides the backing data for each FieldValueHost.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this, except values are converted to their native forms
 * like a JSON date is a Date object.
 * However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 */
export interface FieldValueHostConfig extends ValidatorsValueHostBaseConfig {

    /**
     * A DataTypeParser object is used when calling setTextValue() to convert
     * the input value into the native value. It results in calling setValue() with the native value,
     * or if the parser had an error, calling setValueToUndefined() and retaining
     * the error information to show in the error message.
     * 
     * The value here is a lookup key, and is usually one of the Data Type lookup keys, 
     * like LookupKey.Integer for an integer-specific parser. However, individual
     * DataTypeParser classes may have a unique lookup key to assign here.
     * - Assign to the lookup key to use a parser that supports the lookup key.
     * - Leave it undefined to use the dataType configuration property (for a Data Type Lookup Key)
     *   on the ValueHost, but remember to assign that property.
     * - Assign to null to prevent any parser from being setup.
     * 
     * Note that the options object for setTextValue has a property called disableParser
     * which if set to true will prevent parsing too.
     */
    parserLookupKey?: string | null;

    /**
     * A DataTypeFormatter object is used when calling setValue() to convert
     * the native value into the text value when supplied.
     * Effectively if setup, setValue() will call the formatter and then
     * call setValues() with both native and text values instead of setValue() alone.
     * 
     * The value here is a lookup key, and is usually one of the Data Type lookup keys, 
     * like LookupKey.Integer for an integer-specific formatter. However, individual
     * DataTypeFormatter classes may have a unique lookup key to assign here.
     * - Assign to the lookup key to use a formatter that supports the lookup key.
     * - Leave it undefined to use the dataType configuration property (for a Data Type Lookup Key)
     *   on the ValueHost, but remember to assign that property.
     * - Assign to null to prevent any formatter from being setup.
     * 
     * Note that the options object for setValue has a property called disableFormatter
     * which if set to true will prevent formatting too.
     */
    formatterLookupKey?: string | null;

    /**
     * When true and both formatters and parsers are setup, the text value will be reformatted when the typed value is set
     * with setTextValue(). If the reformatted value differs from the original text value, the ValueHostsManager.onTextValueChanged callback 
     * will be invoked to notify the application of the change.
     * 
     * Use this when you want to ensure that the text value is always in a consistent format, such as when a user inputs a date in a different format than expected.
     * For example, if the expected format is "MM/DD/YYYY" and the user inputs "1/2/2023", it will be reformatted to "01/02/2023".
     * 
     * If not assigned, it will default to the Behaviors.reformatTextValue property of the ValueHostsManager. If both are not assigned, it will default to false
     * as you have to opt-in.
     * 
     * ```ts
     * build.field("birthDate", LookupKey.Date, { 
     *  reformatTextValue: true,
     *  parserLookupKey: LookupKey.Date,
     *  formatterLookupKey: LookupKey.Date});
     * ```
     * setTextValue("1/2/2023") -> 
     *      parsed to native value = Date(2023, 0, 2) -> 
     *          formatted to text value = "01/02/2023" -> 
     *              onTextValueChanged callback invoked with new text value = "01/02/2023"
     * This option has no impact if the formatting is disabled through the Behaviors.disableFormattingOnValueChange property 
     * of the ValueHostsManager or the options.disableFormatter property of setTextValue().
     */
    reformatTextValue?: boolean;

    /**
     * The actual property name on the model. If its the same as Config.name,
     * this can be undefined.
     * Helps mapping between model and valuehost.
     * 
     * When using ModelReader or ModelWriter, it gets this value and allows for a syntax
     * that refers to child objects and arrays. Here are some examples:
     * - "name" - resolves to a property called 'name' on the model object
     * - "name1.name2" - property name1 in the model contains a child with property name2.
     * - "name1[0].name2" - property name1 in the model contains a child that is an array, 
     *    and the first element of that array contains a property name2.
     * - "name1.name2.name3" - property name1 in the model contains a child with property name2, which contains a child with property name3.
     */
    propertyName?: string;    

    /**
     * Supports external data Readers to determine how to handle unassigned values in the external source.
     * Supported by ModelReader, DictionaryReader, FormReader and other subclasses of ValueRulesReaderBase
     * See {@link jivs-engine/ReaderWriter/Types} for details.
     */
    readerRule?: ValueAdapterRule;
    /**
     * Supports the external data Writers to determine how to handle the native value when writing to the model. 
     * Supported by ModelWriter and other WriterBase subclasses.
     * See {@link jivs-engine/ReaderWriter/Types} for details.
     */
    writerRule?: ValueAdapterRule;    

    /**
     * When provided, this is used to identify the input element in the UI that is associated with this FieldValueHost.
     * This is useful for UI frameworks that need to bind the FieldValueHost to a specific input element.
     * If not provided, the user may want to use the ValueHost name of the FieldValueHost to identify the specific input element.
     * 
     * Some usages:
     * - Match to the id= attribute of an HTML input element.
     * - Match to the name= attribute of an HTML input element.
     * - Match to a data-* attribute of an HTML input element.
     * - Selector syntax for document.querySelector() or jQuery to find the element.
     * 
     * When you retrieve it, the FieldValueHost.getElementIdentifier() method allows you to supply a template
     * for which this value is inserted. So this could be the local part of the element, with the prefix covering the container for example.
     * The template could be something like "container_{0}_input" where {0} is replaced with the elementIdentifier.
     * 
     * Sometimes this value is unknown at the time of configuration, and is only known at runtime. In that case, you can set it to null or undefined in the config, 
     * and then set it later using the FieldValueHost.setElementIdentifier() method.
     * 
     * Note: This property is optional and may be null if no specific element is associated with this FieldValueHost.
     */
    elementIdentifier?: string | null;

    /**
     * Provides configuration for field-level calculations associated with this FieldValueHost.
     * The feature changes some of the behaviors of FieldValueHost:
     * - The native value is determined based on a calculation from a CalcValueHost.
     * - The FieldValueHost becomes readOnly (can be overridden if necessary)
     * The impact is that a fieldValueHost with this is not used for data storage directly, 
     * but rather its value is derived from the calculation defined in the CalcValueHost.
     * Within a FieldValueHost, it supports:
     * - validation of the calculation
     * - conversion to a text value through formatters
     * - reporting that text value through the ValueHostsManager.onTextValueChanged callback
     *   so the UI can present the calculated data.
     * - reporting the native value through the ValueHostsManager.onValueChanged callback
     * 
     * Only "active" when calculation itself is defined and its sourceValueHostName property is assigned.
     * Once active, FieldValueHost.readOnly becomes true.
     */
    calculation?: FieldCalculationConfig | null;
}

/**
 * Extends FieldValueHostConfig in its calculation property to encapsulate 
 * additional configuration for field-level calculations.
 */
export interface FieldCalculationConfig
{
    /**
     * The name of the value host that this field calculation depends on. 
     * This should match the name of a ValueHost within the same context.
     */
    sourceValueHostName: string;

    /**
     * Provides text to display when the value from the source value host is undefined.
     * This is intended for the UI, and is assigned on individual FieldValueHosts
     * because its text can wildly vary.
     * jivs-engine does not use it. jivs-dom uses it in EditorAdapterDefinitions creating
     * TextValueAdapter instances.
     */
    textForUndefined?: string;
    /**
     * Localization key for the undefined text. 
     * This allows the UI to display a localized message when the value from the source value host is undefined.
     */
    textForUndefinedl10n?: string;
}

/**
 * Elements of FieldValueHost that are stateful based on user interaction
 */
export interface FieldValueHostInstanceState extends ValidatorsValueHostBaseInstanceState {

    /**
     * The value from the input field/element, even if invalid.
     * The value as represented by a string.
     * For example, it could be a string from an <input>
     * whose dataType=Date, meaning the Value property must be a Date object.
     * Will be 'undefined' if the value has not been retrieved.
     */
    textValue?: string | undefined;

    /**
     * If the FieldValueHostConfig.elementIdentifier is set after configuration, it is part of state
     * and stored here.
     */
    elementIdentifier?: string | null;

}

/**
 * Represents the signature of a callback function that is invoked when the text value of a FieldValueHost changes.
 * @param oldValue - The receiver is expecting a string. We provide 3 states:
 * - string - The previous text value as a string.
 * - null which means we have no value assigned
 * - undefined which means we don't have any previous value available
 */
export type TextValueChangedHandler = (valueHost: IValidatableValueHost, oldValue?: string | null) => void;

export interface IFieldValueHostChangedCallback
{
    /**
     * Called when the FieldValueHost's TextValue has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual FieldValueHosts.
     * Here, it aggregates all FieldValueHost notifications.
     */
    onTextValueChanged?: TextValueChangedHandler | null;    
}
/**
 * Provides callback hooks for the consuming system to supply to IFieldValueHosts.
 */
export interface IFieldValueHostCallbacks extends IFieldValueHostChangedCallback, IValidatorsValueHostCallbacks {

}

/**
 * Additional options for setTextValue().
 */
export interface FieldValueHostSetValueOptions extends ValidatorsValueHostSetValueOptions
{
   
    /**
     * When true, do not use the DataTypeParser to convert 
     * the input value into its native value with setTextValue().
     */
    disableParser?: boolean;

    /**
     * When true, do not use the DataTypeFormatter to convert 
     * the native value into its text value with setValue().
     */
    disableFormatter?: boolean;

    /**
    * Only available with setTextValue().
    * When true, the value supplied is compared to the existing value and no further action is taken
    * when they match.
    *
    * Use case: page generated on the server after a round trip. The server may have changed
    * elements. As we scrape the HTML for values, we want to retain the validation state of those unchanged.
     */
    skipIfUnchanged?: boolean;
}

/**
 * Determines if the object implements IFieldValueHostCallbacks.
 * @param source 
 * @returns source typecasted to IFieldValueHostCallbacks if appropriate or null if not.
 */
export function toIFieldValueHostCallbacks(source: any): IFieldValueHostCallbacks | null
{
    if (toIValidatableValueHostCallbacks(source))
    {
        const test = source as IFieldValueHostCallbacks;
        if (test.onTextValueChanged !== undefined)
            return test;
    }
    return null;
}
