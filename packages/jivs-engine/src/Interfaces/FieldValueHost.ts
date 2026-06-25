/**
 * @module ValueHosts/Types/FieldValueHost
 */
import { IValidatableValueHostBase, toIValidatableValueHostBaseCallbacks } from "./ValidatableValueHostBase";
import { SetValueOptions } from "./ValueHost";
import { IValidatorsValueHostBase, IValidatorsValueHostBaseCallbacks, ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState, toIValidatorsValueHostBase } from "./ValidatorsValueHostBase";
import { IDataTypeParser } from "./DataTypeParsers";


/**
* A ValueHost that supports input validation, meaning the value from
* the user's input, such as from a textbox or <input> tag.
* 
* There are two types of values associated with an FieldValueHost:
* - text value - the value supplied by the input field/element.
*   It is often a string representation of the native data
*   and may contain errors preventing its conversion into that native data.
*   Only a few conditions evaluate the input value, but they are important:
*   RequireTextCondition, DataTypeCheckCondition and RegExpCondition.
* - native value - the value that will be stored in the Model.
*   Date object, number, boolean, and your own object are examples.
*   When the native type is a string, it is often similar in both input and native values.
*   The string in the native value may be cleaned up, trimmed, reformatted, etc.
*   Most Conditions evaluate the native value.
* 
* Its up to the system consumer to manage both.
* - When an input has its value set or changed, also assign it here with setTextValue().
* - RequireTextCondition, DataTypeCheckCondition and RegExpCondition look at the text value via getTextValue().
* - The initial native value is assigned with setValue.
*   The consumer handles converting the input field/element value into its native value
*   and supplies it with setValue or setValueUndetermined.
* - Most Conditions look at the native value through getValue.
*/
export interface IFieldValueHost extends IValidatorsValueHostBase {
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
     * conversionErrorTokenValue - When the typed value is undefined because it could not be
     *   resolved from the text value, provide a user-friendly error message here. It will appear
     *   in the Category=Require validator within the {ConversionError} token. A DataTypeParser
     *   may also set conversionErrorTokenValue when it reports an error.
     * skipValueChangedCallback - Skip the automatic callback setup through the OnValueChanged property.
     */
    setTextValue(textValue: string | undefined, options?: SetTextValueOptions): void;

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
     *    * conversionErrorTokenValue - When the typed value is undefined because it could not be
     *    *    resolved from the text value, provide a user-friendly error message here. It will
     *    *    appear in the Category=Require validator within the {ConversionError} token.
     *    * skipValueChangedCallback - Skip the automatic callback setup through the OnValueChanged property.
     */
    setValues(nativeValue: any, textValue: string | undefined, options?: SetValueOptions): void;


    /**
     *Returns true for a condition with Category=Require. UI can use it to 
     * display a "requires a value" indicator.
     */
    required: boolean;


     /**
      * Returns the ConversionErrorTokenValue supplied by the latest call
      * to setValue() or setValues(). Its null when not supplied or has been cleared.
      * Associated with the {ConversionError} token of the DataTypeCheckCondition.
      */
    getConversionErrorMessage(): string | null;
    
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
     * 
     * Alternatively, you can leave this undefined and use parserCreator to create the DataTypeParser
     * instance you want.
     */
    parserLookupKey?: string | null;

    /**
     * Alternative to parserLookupKey that establishes a parser used when calling setTextValue()
     * to convert the input value into the native value. It results in calling setValue() with the native value,
     * or if the parser had an error, calling setValueToUndefined() and retaining
     * the error information to show in the error message.
     * 
     * It provides a callback function that is expected to create an object that implements IDataTypeParser
     * or return null if no parser is appropriate.
     * 
     * While parserLookupKey knows how to fallback to another data type using LookupKeyFallbackService,
     * this parser function completely ignores DataTypeParserService.parse where that happens.
     * Instead, its up to you to handle any fallbacks. You should also expect that the parse()
     * functions lookupKey parameter may be null if parserLookupKey and dataType properties were not setup.
     * 
     * Your parser object's supports() method will be called. If it returns false, your
     * object won't be used, and it will fallback to the parserLookupKey.
     * @param valueHost
     * @returns Object that implements IDataTypeParser
     * or return null if no parser is appropriate
     */
    parserCreator?: (valueHost: IFieldValueHost) => IDataTypeParser<any> | null;

    /**
     * The actual property name on the model. If its the same as Config.name,
     * this can be undefined.
     * Helps mapping between model and valuehost.
     */
    propertyName?: string;    
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
     * When converting the input field/element value to native and there is an error
     * it should be saved here. It can be displayed as part of the DataTypeCheckCondition's
     * error message token {ConversionError}.
     * Cleared when setting the value without an error.
     */
    conversionErrorTokenValue?: string;

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
export interface SetTextValueOptions extends SetValueOptions
{
    /**
     * When true, do not use the DataTypeParser to convert the input value into its native value.
     */
    disableParser?: boolean;
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
        let test = source as IFieldValueHostCallbacks;
        if (test.onTextValueChanged !== undefined)
            return test;
    }
    return null;
}
