/**
 * @module ValueHosts/Types/InputValueHost
 */
import { IValidatableValueHostBase, toIValidatableValueHostBaseCallbacks } from "./ValidatableValueHostBase";
import { SetValueOptions } from "./ValueHost";
import { IValidatorsValueHostBase, IValidatorsValueHostBaseCallbacks, ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState, toIValidatorsValueHostBase } from "./ValidatorsValueHostBase";
import { IDataTypeParser } from "./DataTypeParsers";


/**
* A ValueHost that supports input validation, meaning the value from
* the user's input, such as from a textbox or <input> tag.
* 
* There are two types of values associated with an InputValueHost:
* - input value - the value supplied by the input field/element.
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
* - When an input has its value set or changed, also assign it here with setInputValue().
* - RequireTextCondition, DataTypeCheckCondition and RegExpCondition look at the InputValue via getInputValue().
* - The initial native value is assigned with setValue.
*   The consumer handles converting the input field/element value into its native value
*   and supplies it with setValue or setValueUndetermined.
* - Most Conditions look at the native value through getValue.
*/
export interface IInputValueHost extends IValidatorsValueHostBase {
    /**
     * Exposes the latest value retrieved from the input field/element
     * exactly as supplied by the input. For example,
     * an <input type="date"> returns a string, not a date.
     * Strings are not cleaned up, no trimming applied.
     */
    getInputValue(): any;

    /**
     * System consumer assigns the value it also assigns to the input field/element.
     * Its used with RequireTextCondition, DataTypeCheckCondition and RegExpCondition.
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets isChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
     */
    setInputValue(value: any, options?: SetInputValueOptions): void;

    /**
     * Sets both (native data type) Value and Input Value at the same time
     * and optionally invokes validation.
     * Use when the consuming system resolves both input field/element and native values
     * at the same time so there is one state change and attempt to validate.
     * @param nativeValue - Can be undefined to indicate the value could not be resolved
     * from the inputs's value, such as inability to convert a string to a date.
     * All other values, including null and the empty string, are considered real data.
     * @param inputValue - Can be undefined to indicate there is no value.
     * All other values, including null and the empty string, are considered real data.
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
     */
    setValues(nativeValue: any, inputValue: any, options?: SetValueOptions): void;


    /**
     *Returns true for a condition with Category=Require. UI can use it to 
     * display a "requires a value" indicator.
     */
    requiresInput: boolean;


     /**
      * Returns the ConversionErrorTokenValue supplied by the latest call
      * to setValue() or setValues(). Its null when not supplied or has been cleared.
      * Associated with the {ConversionError} token of the DataTypeCheckCondition.
      */
    getConversionErrorMessage(): string | null;
    
    /**
     * Returns the value from InputValueHostConfig.parserLookupKey.
     */
    getParserLookupKey(): string | null | undefined;
}
/**
 * Just the data that is used to describe this input value.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to InputValueHostConfig.
 * This provides the backing data for each InputValueHost.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this, except values are converted to their native forms
 * like a JSON date is a Date object.
 * However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 */
export interface InputValueHostConfig extends ValidatorsValueHostBaseConfig {

    /**
     * A DataTypeParser object is used when calling setInputValue() to convert
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
     * Note that the options object for setInputValue has a property called disableParser
     * which if set to true will prevent parsing too.
     * 
     * Alternatively, you can leave this undefined and use parserCreator to create the DataTypeParser
     * instance you want.
     */
    parserLookupKey?: string | null;

    /**
     * Alternative to parserLookupKey that establishes a parser used when calling setInputValue()
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
    parserCreator?: (valueHost: IInputValueHost) => IDataTypeParser<any> | null;
}

/**
 * Elements of InputValueHost that are stateful based on user interaction
 */
export interface InputValueHostInstanceState extends ValidatorsValueHostBaseInstanceState {

    /**
     * The value from the input field/element, even if invalid.
     * The value may not be the native data type.
     * For example, it could be a string from an <input>
     * whose dataType=Date, meaning the Value property must be a Date object.
     * Will be 'undefined' if the value has not been retrieved.
     */
    inputValue?: any;


    /**
     * When converting the input field/element value to native and there is an error
     * it should be saved here. It can be displayed as part of the DataTypeCheckCondition's
     * error message token {ConversionError}.
     * Cleared when setting the value without an error.
     */
    conversionErrorTokenValue?: string;

}

export type InputValueChangedHandler = (valueHost: IValidatableValueHostBase, oldValue: any) => void;

export interface IInputValueHostChangedCallback
{
    /**
     * Called when the InputValueHost's InputValue property has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual InputValueHosts.
     * Here, it aggregates all InputValueHost notifications.
     */
    onInputValueChanged?: InputValueChangedHandler | null;    
}
/**
 * Provides callback hooks for the consuming system to supply to IInputValueHosts.
 */
export interface IInputValueHostCallbacks extends IInputValueHostChangedCallback, IValidatorsValueHostBaseCallbacks {

}

/**
 * Additional options for setInputValue().
 */
export interface SetInputValueOptions extends SetValueOptions
{
    /**
     * When true, do not use the DataTypeParser to convert the input value into its native value.
     */
    disableParser?: boolean;
}

/**
 * Determines if the object implements IInputValueHostCallbacks.
 * @param source 
 * @returns source typecasted to IInputValueHostCallbacks if appropriate or null if not.
 */
export function toIInputValueHostCallbacks(source: any): IInputValueHostCallbacks | null
{
    if (toIValidatableValueHostBaseCallbacks(source))
    {
        let test = source as IInputValueHostCallbacks;
        if (test.onInputValueChanged !== undefined)
            return test;
    }
    return null;
}
