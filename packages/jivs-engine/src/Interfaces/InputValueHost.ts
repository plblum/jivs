/**
 * @module ValueHosts/Types/InputValueHost
 */
import { IValidatableValueHostBase, toIValidatableValueHostCallbacks } from "./ValidatableValueHostBase";
import { SetValueOptions } from "./ValueHost";
import { IValidatorsValueHostBase, IValidatorsValueHostBaseCallbacks, ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState, toIValidatorsValueHostBase } from "./ValidatorsValueHostBase";


/**
* A ValueHost that supports input validation, meaning the value from
* the user's input, such as from a textbox or <input> tag.
* 
* There are two types of values associated with an InputValueHost:
* - input value - the value supplied by the input field/element.
*   It is often a string representation of the native data
*   and may contain errors preventing its conversion into that native data.
*   Only a few conditions evaluate the input value, but they are important:
*   RequiredCondition and ValidNativeCondition.
* - native value - the value that will be stored in the Model.
*   Date object, number, boolean, and your own object are examples.
*   When the native type is a string, it is often similar in both input and native values.
*   The string in the native value may be cleaned up, trimmed, reformatted, etc.
*   Most Conditions evaluate the native value.
* 
* Its up to the system consumer to manage both.
* - When an input has its value set or changed, also assign it here with setInputValue().
* - RequiredConditions and DataTypeCondition look at the InputValue via getInputValue().
* - The initial native value is assigned with setValue.
*   The consumer handles converting the input field/element value into its native value
*   and supplies it with SetNativeValue or NativeValueUndetermined.
* - Most Conditions look at the NativeValue via getValue.
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
     * Its used with RequiredCondition and DataTypeCondition.
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
     */
    setInputValue(value: any, options?: SetValueOptions): void;

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
    * appear in the Required validator within the {ConversionError} token.
     */
    setValues(nativeValue: any, inputValue: any, options?: SetValueOptions): void;


    /**
     *Returns true if a Required condition is setup. UI can use it to 
     * display a "requires a value" indicator.
     */
     requiresInput: boolean;


     /**
      * Returns the ConversionErrorTokenValue supplied by the latest call
      * to setValue() or setValues(). Its null when not supplied or has been cleared.
      * Associated with the {ConversionError} token of the DataTypeCheckCondition.
      */
     getConversionErrorMessage(): string | null;
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

/**
 * Provides callback hooks for the consuming system to supply to IInputValueHosts.
 */
export interface IInputValueHostCallbacks extends IValidatorsValueHostBaseCallbacks {

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
 * Determines if the object implements IInputValueHostCallbacks.
 * @param source 
 * @returns source typecasted to IInputValueHostCallbacks if appropriate or null if not.
 */
export function toIInputValueHostCallbacks(source: any): IInputValueHostCallbacks | null
{
    if (toIValidatableValueHostCallbacks(source))
    {
        let test = source as IInputValueHostCallbacks;
        if (test.onInputValueChanged !== undefined)
            return test;
    }
    return null;
}
