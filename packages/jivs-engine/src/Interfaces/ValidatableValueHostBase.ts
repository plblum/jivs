/**
 * @inheritDoc ValueHosts/AbstractClasses/ValidatableValueHostBase!
 * @module ValueHosts/Types/ValidatableValueHostBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import {
    type ValidateOptions, type ValueHostValidateResult, ValidationResult,
    type BusinessLogicError, type IssueFound, StatefulValueHostValidateResult
} from './Validation';
import { IValueHostCallbacks, toIValueHostCallbacks, type IValueHost, type SetValueOptions, type ValueHostConfig, type ValueHostState } from './ValueHost';

/**
* Manages a value that may use input validation.
* This level is associated with the input field/element itself.
*/
export interface IValidatableValueHostBase extends IValueHost {
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
     * When setValue(), setValues(), setInputValue(), or SetToUndefined occurs,
     * all other InputValueHosts get notified here so they can rerun validation
     * when any of their Conditions specify the valueHostName that changed.
     * @param valueHostIdThatChanged 
     * @param revalidate 
     */
    otherValueHostChangedNotification(valueHostIdThatChanged: ValueHostName, revalidate: boolean): void;

    /**
     * Runs validation against some of all validators.
     * If at least one validator was NoMatch, it returns ValueHostValidateResult
     * with all of the NoMatches in issuesFound.
     * If all were Matched, it returns ValueHostValidateResult.Value and issuesFound=null.
     * If there are no validators, or all validators were skipped (disabled),
     * it returns ValidationResult.Undetermined.
     * Updates this ValueHost's State and notifies parent if changes were made.
     * @param options - Provides guidance on behavior.
     * @returns Non-null when there is something to report. null if there was nothing to evaluate
     * which includes all existing validators reporting "Undetermined"
     */
    validate(options?: ValidateOptions): ValueHostValidateResult | null;

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     * @returns true when there was something cleared
     * @param options - Only supports the omitCallback and Group options.
     */
    clearValidation(options?: ValidateOptions): boolean;

    /**
     * Value is setup by calling validate(). It does not run validate() itself.
     * Returns false when State.ValidationResult is Invalid. Any other ValidationResult
     * return true.
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using ValidationResult property for more clarity.
     */
    isValid: boolean;

    /**
     * ValidationResult from latest validation, or an indication
     * that validation has yet to occur.
     */
    validationResult: ValidationResult;

    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (getIssuesFound) and optionally for an individual ValueHostName,
     * by specifying that valueHostName in AssociatedValueHostName.
     * Each time called, it adds to the existing list. Use clearBusinessLogicErrors() first if starting a fresh list.
     * @param error - A business logic error to show. If it has an errorCode assigned and the same
     * errorCode is already recorded here, the new entry replaces the old one.
     * @param options - Only supports the omitCallback option.
     * @returns true when a change was made to the known validation state.
     */
    setBusinessLogicError(error: BusinessLogicError, options?: ValidateOptions): boolean;

    /**
     * Removes any business logic errors. Generally called automatically by
     * ValidationManager as calls are made to SetBusinessLogicErrors and clearValidation().
     * @param options - Only supports the omitCallback option.
     * @returns true when a change was made to the known validation state.
     */
    clearBusinessLogicErrors(options?: ValidateOptions): boolean;

    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save.
     * True when ValidationResult is Invalid, AsyncProcessing, or ValueChangedButUnvalidated.
     */
    doNotSaveNativeValue(): boolean;

    /**
     * The results of validation specific to one condiiton Type.
     * @param errorCode - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The issue or null if none.
     */
    getIssueFound(errorCode: string): IssueFound | null;

    /**
     * A list of all issues found.
     * @param group - Omit or null to ignore groups. Otherwise this will match to InputValueHosts with 
     * the same group (case insensitive match).
     * @returns An array of issues found. 
     * When null, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - name - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each Validator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    getIssuesFound(group?: string): Array<IssueFound> | null;

    /**
     * Returns the ConversionErrorTokenValue supplied by the latest call
     * to setValue() or setValues(). Its null when not supplied or has been cleared.
     * Associated with the {ConversionError} token of the DataTypeCheckCondition.
     */
    getConversionErrorMessage(): string | null;

    /**
     *Returns true if a Required condition is setup. UI can use it to 
     * display a "requires a value" indicator.
     */
    requiresInput: boolean;

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
export interface ValidatableValueHostBaseConfig extends ValueHostConfig {

    /**
     * InputValueHosts can be part of one or more named groups.
     * Groups are part of validating the complete Model.
     * All InputValueHosts on the page may be asked to validate.
     * Often fields are used for different aspects of the page, like 
     * a login or search field in the header is a different feature
     * from the form where data is being gathered.
     * Submit buttons usually call validate() and supply their group name.
     * When they do, InputValueHosts associated with that button must have the same
     * group name.
     * Values:
     * * undefined, null or '*' all mean the group feature is ignored.
     * * string - a single group name. If it does not match the requested group
     *   in the validate() function, the validator is treated as disabled.
     *   Case insensitive matching.
     * * string[] - a list of group names. If none match the requested group
     *   in the validate() function, the validator is treated as disabled.
     * This value can be overriden via InputValueHost.setGroup, so the UI can assign
     * a better group.
     */
    group?: undefined | null | string | Array<string>;
}


/**
 * Elements of InputValueHost that are stateful based on user interaction
 */
export interface ValidatableValueHostBaseState extends ValueHostState, StatefulValueHostValidateResult {

    /**
     * The value from the input field/element, even if invalid.
     * The value may not be the native data type.
     * For example, it could be a string from an <input>
     * whose dataType=Date, meaning the Value property must be a Date object.
     * Will be 'undefined' if the value has not been retrieved.
     */
    inputValue?: any;

    /**
     * Group used when validate() was last called. It is associated
     * with the current IssuesFound.
     */
    group?: string;

    /**
     * When converting the input field/element value to native and there is an error
     * it should be saved here. It can be displayed as part of the DataTypeCheckCondition's
     * error message token {ConversionError}.
     * Cleared when setting the value without an error.
     */
    conversionErrorTokenValue?: string;

    /**
     * If there are any business logic errors, they are kept here.
     * If not, this is undefined.
     */
    businessLogicErrors?: Array<BusinessLogicError>;

    /**
     * When true, an async Validator is running
     */
    asyncProcessing?: boolean;
}


export type ValueHostValidatedHandler = (valueHost: IValidatableValueHostBase, validateResult: ValueHostValidateResult) => void;
export type InputValueChangedHandler = (valueHost: IValidatableValueHostBase, oldValue: any) => void;

/**
 * Provides callback hooks for the consuming system to supply to IInputValueHosts.
 */
export interface IInputValueHostCallbacks extends IValueHostCallbacks {
    /**
     * Called when ValueHost's validate() function has finished, and made
     * changes to the state. (No point in notifying code intended to update the UI
     * if nothing changed.) 
     * Also when validation is cleared or BusinessLogicErrors are added or removed.
     * Supplies the result to the callback.
     * Examples: Use to notify the validation related aspects of the component to refresh, 
     * such as showing error messages and changing style sheets.
     * Use to change the disabled state of the submit button based on validity.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    onValueHostValidated?: ValueHostValidatedHandler | null;
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
    if (toIValueHostCallbacks(source))
    {
        let test = source as IInputValueHostCallbacks;
        if (test.onInputValueChanged !== undefined &&
            test.onValueHostValidated !== undefined)
            return test;
    }
    return null;
}
