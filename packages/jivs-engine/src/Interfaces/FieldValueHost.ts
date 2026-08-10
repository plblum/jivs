/**
 * @module jivs-engine/ValueHosts/Types/FieldValueHost
 */
import { ValueAdapterRule } from './ValueAdapterService';
import { IValidatableValueHostBase, toIValidatableValueHostBaseCallbacks } from './ValidatableValueHostBase';
import
    {
        IValidatorsValueHostBase, IValidatorsValueHostBaseCallbacks,
        ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState,
        ValidatorsValueHostSetValueOptions
    } from './ValidatorsValueHostBase';


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
*/
export interface IFieldValueHost<TOptions extends FieldValueHostSetValueOptions = FieldValueHostSetValueOptions>
    extends IValidatorsValueHostBase<TOptions>
{

    /**
     * Gets the current text value exactly as last provided.
     * This is the string representation before parsing into the typed value.
     * For example, a date field or posted form value is exposed as text, not as a Date.
     * The text is returned unchanged, with no trimming or other normalization applied.
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
     * @param options -
     * duringEdit - Set to true for an intermediate edit activity rather than a completed change.
     *   For example, on the client side this may be used for an HTMLInputElement.oninput event,
     *   where the user is still editing. In this mode, only validators intended for in-progress
     *   edits are used. Specifically, their Condition implements IEvaluateConditionDuringEdits,
     *   and IEvaluateConditionDuringEdits.evaluateDuringEdit() is used instead of
     *   ICondition.evaluate().
     * validate - Invoke validation after setting the text value.
     * reset - Clear validation state, unless validate = true, and set IsChanged to false.
     * disableParser - When true, do not use the DataTypeParser to resolve the typed value
     *   from the text value.
     * injectedError - If you handle parsing before calling setTextValue(), your parser may have returned
     *      an error. Assign this object to contain the error message and other info.
     *      Internally Jivs will provide a Validator with the error message to report the error.
     *      If setup, you can give it an errorCode. If not supplied, know that TextLocalizerService will
     *      use the errorCode value of 'InjectedError' to localize the error message. 
     *      You can also provide a summaryMessage for use in a summary of validation errors.
     * skipValueChangedCallback - Skip the automatic callback setup through the OnValueChanged property.
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
     * @param options -
     *    * validate - Invoke validation after setting the values.
     *    * reset - Clear validation state, unless validate = true, and set IsChanged to false.
     *    *  injectedError - If you handle parsing before calling setTextValue(), your parser may have returned
     *          an error. Assign this object to contain the error message and other info.
     *          Internally Jivs will provide a Validator with the error message to report the error.
     *          If setup, you can give it an errorCode. If not supplied, know that TextLocalizerService will
     *          use the errorCode value of 'InjectedError' to localize the error message. 
     *          You can also provide a summaryMessage for use in a summary of validation errors.
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
     * Used with the ModelReader feature to determine how to handle unassigned values in the model source.
     * See {@link jivs-engine/ModelReaderWriter/Types} for details.
     */
    getModelReaderRule(): ValueAdapterRule | undefined;
    /**
     * Used with the ModelWriter feature to determine how to handle the native value when writing to the model.
     * See {@link jivs-engine/ModelReaderWriter/Types} for details.
     */
    getModelWriterRule(): ValueAdapterRule | undefined;

    /**
     * When provided, this is used to identify the input element in the UI that is associated with this FieldValueHost.
     * This is useful for UI frameworks that need to bind the FieldValueHost to a specific input element.
     * If not provided, the FieldValueHost will not have a direct association with any specific input element.
     * @param template - Optional template to format the element identifier. If provided, the elementIdentifier will be inserted into the template.
     * The string must contain "{0}" as a placeholder for the elementIdentifier. 
     * 
     * The template strategy allows for dynamic generation of element identifiers based on the FieldValueHost's configuration or other context.
     * For example, if the template is "container_{0}_input" and the elementIdentifier is "firstName", the resulting identifier will be "container_firstName_input".
     * 
     * If no template is provided, the raw elementIdentifier will be returned as-is.
     * 
     * Note: This method may return null or undefined if no elementIdentifier has been set for this FieldValueHost.
     */
    getElementIdentifier(template?: string): string | null | undefined;

    /**
     * Sometimes the element identifier is not known at configuration time and is only known at runtime.
     * This method allows you to set it later, so that the FieldValueHost can be associated with the correct input element in the UI.
     * 
     * @param elementIdentifier - The identifier of the input element associated with this FieldValueHost. Can be null or undefined if no association is needed.
     */
    setElementIdentifier(elementIdentifier: string | null | undefined): void;
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
     * Supports the ModelReader to determine how to handle unassigned values in the model source.
     * See {@link jivs-engine/ModelReaderWriter/Types} for details.
     */
    modelReaderRule?: ValueAdapterRule;
    /**
     * Supports the ModelWriter to determine how to handle the native value when writing to the model. 
     * See {@link jivs-engine/ModelReaderWriter/Types} for details.
     */
    modelWriterRule?: ValueAdapterRule;    

    /**
     * When provided, this is used to identify the input element in the UI that is associated with this FieldValueHost.
     * This is useful for UI frameworks that need to bind the FieldValueHost to a specific input element.
     * If not provided, the FieldValueHost will not have a direct association with any specific input element.
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

export type TextValueChangedHandler = (valueHost: IValidatableValueHostBase, oldValue: any) => void;

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
export interface IFieldValueHostCallbacks extends IFieldValueHostChangedCallback, IValidatorsValueHostBaseCallbacks {

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
}

/**
 * Determines if the object implements IFieldValueHostCallbacks.
 * @param source 
 * @returns source typecasted to IFieldValueHostCallbacks if appropriate or null if not.
 */
export function toIFieldValueHostCallbacks(source: any): IFieldValueHostCallbacks | null
{
    if (toIValidatableValueHostBaseCallbacks(source))
    {
        const test = source as IFieldValueHostCallbacks;
        if (test.onTextValueChanged !== undefined)
            return test;
    }
    return null;
}
