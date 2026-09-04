/**
 * @inheritDoc jivs-engine/ValueHosts/AbstractClasses/ValidatableValueHostBase!
 * @module jivs-engine/ValueHosts/Types/ValidatableValueHostBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import {
    StatefulValueHostValidateResult,
    ValidationState,
    ValidationStatus,
    type IssueFound,
    type ValidateOptions, type ValueHostValidateResult
} from './Validation';

import {
    IGatherValueHostNames, IValueHostCallbacks, SetValueOptions, toIValueHost,
    toIValueHostCallbacks,
    type IValueHost, type ValueHostConfig, type ValueHostInstanceState
} from './ValueHost';

/**
* Manages a value that may use field validation.
*/
export interface IValidatableValueHost<TOptions extends ValidatableValueHostBaseSetValueOptions = ValidatableValueHostBaseSetValueOptions>
    extends IValueHost<TOptions>, IGatherValueHostNames
{

    /**
     * When the value changes,
     * all other Validatable ValueHosts get notified here so they can rerun validation
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
     * it returns ValidationStatus.Undetermined.
     * Updates this ValueHost's InstanceState and notifies parent if changes were made.
     * @param options - Provides guidance on behavior.
     * @returns Non-null when there is something to report. null if there was nothing to evaluate
     * which includes all existing validators reporting "Undetermined"
     */
    validate(options?: ValidateOptions): ValueHostValidateResult | null;

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     * @returns true when there was something cleared
     * @param options - Only supports the skipCallback and Group options.
     */
    clearValidation(options?: ValidateOptions): boolean;

    /**
     * Determines if the ValueHost is matches to a specific group, or if no group is supplied,
     * it is always matches.
     * Allows loops through valueHosts to take options.group into account.
     */
    groupCheck(options?: ValidateOptions): boolean;


    /**
     * Value is setup by calling validate(). It does not run validate() itself.
     * Returns false when instanceState.status is Invalid. Any other instanceState.status
     * return true.
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using doNotSave for more clarity.
     */
    isValid: boolean;

    /**
     * Status from the latest validation, or an indication
     * that validation has yet to occur.
     * It is changed internally and can influence how
     * validation behaves the next time.
     * Prior to calling validate() (or setValue()'s validate option),
     * it is NotAttempted.
     * After setValue it is NeedsValidation.
     * After validate, it may be Valid, Invalid or Undetermined.
     */
    validationStatus: ValidationStatus;
    
    /**
     * When true, an async Validator is running
     */
    asyncProcessing: boolean;

    /**
     * Exposes the current validation state for the ValueHost.
     * It combines other properties and all issuesFound from both validators and external sources.
     * The same value is delivered to the onValueHostValidationStateChanged callback.
     */
    currentValidationState: ValueHostValidationState;


    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save.
     * True when ValidationStatus is Invalid or NeedsValidation.
     */
    doNotSave: boolean;

    /**
     * Set to true when the user has fixed all invalid validators.
     * Undefined or false otherwise, including if the status changes after this point.
     */
    corrected: boolean;    

    /**
     * The results of validation specific to one error code or condition type.
     * Searches both IssuesFound and externalIssuesFound.
     * @param errorCode  - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The issue or null if none.
     */    
    getIssueFound(errorCode: string): IssueFound | null;

    /**
     * Lists all issues found (error messages and supporting info) for a single Validatable ValueHost
     * so the input field/element can show error messages and adjust its appearance.
     * Includes both the issues found from validation (IssuesFound) and any external issues found (externalIssuesFound).
     * @param group - a filter on the validator issuesFound matching to validation group.
     * Has no impact on externalIssuesFound since they are not generated by validators.
     * @returns An array of issues found. 
     * When null, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - valueHostName - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each Validator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    getIssuesFound(group?: string): Array<IssueFound> | null;

    /**
     * For a list of external issuesfound, meaning the developer's own code
     * determines there is an error and supplies a list of them here.
     * These will survive through clearValidation() and validate() since they are not generated by validators, 
     * but they will be cleared by clearExternalIssuesFound().
     * 
     * Invokes the onValueHostValidationStateChanged callback unless skipCallback is true.
     * @param issuesFound 
     * @param determinedLocally - when true, your app's code figured out this issue and the error will be
     * revised by the next local validation. When false, for everything else. 
     * Only used when issueFound.doNotSave is not already set, as it takes precedence. 
     * If IssueFound.severity is Warning and issueFound.doNotSave is not set, it defaults doNotSave to false regardless of this value.
     * Allows post validation errors
     * generated by a server to avoid blocking the next attempt to save. Internally sets IssueFound.doNotSave to 
     * this value.
     * @param options - Only considers the skipCallback option.
     */
    addExternalIssuesFound(issuesFound: Array<IssueFound>, determinedLocally: boolean, options?: ValidateOptions): boolean;

    /**
     * For a single external issuefound, meaning the developer's own code
     * determines there is an error and supplies it here.
     * Invokes the onValueHostValidationStateChanged callback unless skipCallback is true.
     * @param issueFound 
     * @param determinedLocally - when true, your app's code figured out this issue and the error will be
     * revised by the next local validation. When false, for everything else. 
     * Only used when issueFound.doNotSave is not already set, as it takes precedence. 
     * If IssueFound.severity is Warning and issueFound.doNotSave is not set, it defaults doNotSave to false regardless of this value.
     * Allows post validation errors
     * generated by a server to avoid blocking the next attempt to save. Internally sets IssueFound.doNotSave to 
     * this value.
     * @param options - Only considers the skipCallback option.
     */
    addExternalIssueFound(issueFound: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean;    
    /**
     * Removes existing external issues found.
     * Has no impact on issues found from validators, which are only cleared by clearValidation() or validate().
     * @param options - Only supports the skipCallback option.
     * @returns true when a change was made to the known validation state.
     */
    clearExternalIssuesFound(options?: ValidateOptions): boolean;    
}

/**
 * Just the data that is used to describe this ValueHost.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to ValidatableValueHostConfig.
 * This provides the backing data for each ValidatableValueHost.
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
     * Validatable ValueHosts can be part of one or more named groups.
     * Groups are part of validating the complete Model.
     * All Validatable ValueHosts on the page may be asked to validate.
     * Often fields are used for different aspects of the page, like 
     * a login or search field in the header is a different feature
     * from the form where data is being gathered.
     * Submit buttons usually call validate() and supply their group name.
     * When they do, Validatable ValueHosts associated with that button must have the same
     * group name.
     * Values:
     * * undefined, null or '*' all mean the group feature is ignored.
     * * string - a single group name. If it does not match the requested group
     *   in the validate() function, the validator is treated as disabled.
     *   Case insensitive matching.
     * * string[] - a list of group names. If none match the requested group
     *   in the validate() function, the validator is treated as disabled.
     */
    group?: undefined | null | string | Array<string>;
}


/**
 * Elements of ValidatableValueHost that are stateful based on user interaction
 */
export interface ValidatableValueHostBaseInstanceState extends ValueHostInstanceState, StatefulValueHostValidateResult {

    /**
     * Group used when validate() was last called. It is associated
     * with the current IssuesFound.
     */
    group?: string;
    /**
     * If there are any external errors, they are kept here.
     * If not, this is undefined.
     */
    externalIssuesFound?: Array<IssueFound>;

    /**
     * When true, an async Validator is running
     */
    asyncProcessing?: boolean;
}

export interface ValidatableValueHostBaseSetValueOptions extends SetValueOptions
{
}


export type ValueHostValidationStateChangedHandler = (valueHost: IValidatableValueHost, validationState: ValueHostValidationState) => void;


/**
 * The value returned by onValueHostValidationStateChanged.
 * It includes all issuesfound and externalIssuesFound
 * as compared to validate() which is limited to just the issuesfound.
 */
export interface ValueHostValidationState extends ValidationState
{
/**
 * Reports the current ValidationStatus
 */    
    status: ValidationStatus;

    /**
     * Set to true when the user has fixed all invalid validators.
     * Undefined or false otherwise, including if the status changes after this point.
     */
    corrected: boolean;    
}


/**
 * Determines if the object implements IValidatorsValueHost.
 * @param source 
 * @returns source typecasted to IValidatorsValueHost if appropriate or null if not.
 */
export function toIValidatableValueHost(source: any): IValidatableValueHost | null
{
    if (toIValueHost(source))
    {
        const test = source as IValidatableValueHost;    
        // some select members of IValidatorsValueHost
        if (test.otherValueHostChangedNotification !== undefined &&
            test.validate !== undefined &&
            test.clearValidation !== undefined &&
            'doNotSave' in test &&
            'isValid' in test &&
            test.getIssuesFound !== undefined)
            return test;
    }
    return null;
}


/**
 * Provides callback hooks for the consuming system to supply to IValidatableValueHostCallbacks.
 */
export interface IValidatableValueHostCallbacks extends IValueHostCallbacks {
    /**
     * Called when the state of validation has changed on a ValidatableValueHost.
     * That includes validate(), clearValidation(), addExternalIssuesFound(), 
     * clearExternalIssuesFound() and a few edge cases.
     * Supplies the current ValidationState to the callback.
     * Examples: Use to notify the validation related aspects of the component to refresh, 
     * such as showing error messages and changing style sheets.
     * Use to change the disabled state of the submit button based on validity.
     * See also onValidationStateChanged for a similar callback from
     * the ValueHostsManager.
     */
    onValueHostValidationStateChanged?: ValueHostValidationStateChangedHandler | null;
}
/**
 * Determines if the object implements IValidatableValueHostCallbacks.
 * @param source 
 * @returns source typecasted to IValidatableValueHostCallbacks if appropriate or null if not.
 */
export function toIValidatableValueHostCallbacks(source: any): IValidatableValueHostCallbacks | null
{
    if (toIValueHostCallbacks(source))
    {
        const test = source as IValidatableValueHostCallbacks;
        if (test.onValueHostValidationStateChanged !== undefined)
            return test;
    }
    return null;
}
