/**
 * Interfaces built around the concept of data validation.
 * @module Validation/Types
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ValidatorValidateResult } from './Validator';

/**
 * Parameter for the validate() function on Validatable ValueHosts and ValidationManager.
 * It provides additional guidance on how to get the validators involved.
 */
export interface ValidateOptions
{
    /**
     * Group validation name, a tool to group Validatable ValueHosts with a specific submit command when validating.
     * Use when there is more than one group of Validatable ValueHosts to be validated together.
     * For example, the ValidationManager handles two forms at once. Give
     * the ValidatableValueHostConfig.group a name for each form. Then make their submit command
     * pass in the same group name.
     * When Group is undefined or "*", validate() does not check group names. All Validatable ValueHosts 
     * within the ValidationManager are validated.
     * When assigned, only Validatable ValueHosts with a matching group name (case insensitive) will be involved.
     */
    group?: string;

    /**
     * Set to true when running a validation prior to a submit activity.
     * Typically set to true just after loading the form to report any errors already present.
     * During this phase, the Category=Require validator is not checked as the user doesn't need
     * the noise complaining about missing input when they haven't had a chance to address it.
     * When undefined, it is the same as false.
     */
    preliminary?: boolean;
    /**
     * Set to true when handling an intermediate change activity, such as a keystroke
     * changed a textbox but the user remains in the textbox. For example, on the 
     * HTMLInputElement.oninput event.
     * This will involve only validators that make sense during such an edit.
     * Specifically their Condition implements IEvaluateConditionDuringEdits.
     * The IEvaluateConditionDuringEdits.evaluateDuringEdit() function is used
     * instead of ICondition.evaluate().
     * When undefined, it is the same as false.
     */
    duringEdit?: boolean;
    /**
     * If you have setup a OnValidated or OnValueHostValidated callback,
     * you may not want it to fire when you expressly call validate().
     * In that case, set this to true.
     */
    skipCallback?: boolean;
}

/**
 * Result of the validate() function that will be saved in ValidatableValueHostInstanceState
 */
export interface StatefulValueHostValidateResult {
    /**
     * The state of validation for this ValueHost.
     */
    status: ValidationStatus;

    /**
     * The issues that were found.
     */
    issuesFound: Array<IssueFound> | null;
}
/**
 * Result of the validate() function.
 */
export interface ValueHostValidateResult extends StatefulValueHostValidateResult {
    /**
     * Any promises returned by Validator.validate()
     * These still need to finish before supplying their evaluation results.
     * When either null or undefined, nothing is pending.
     * There should never be an empty array as the presence of an array
     * will make the system think there are promises pending.
     */
    pending?: Array<Promise<ValidatorValidateResult>> | null;
}



/**
 * The state of validation for this ValidatableValueHost.
 * It combines what has happened to the ValueHost's values
 * with the result from validation and influences the behavior
 * of the next attempt to validate.
 */
export enum ValidationStatus { // ValueHostValidationStatus, ValueHostStatusCode
    /**
     * Indicates that validate() has yet to be attempted
     * Once attempted, it will always be one of the other results
     */
    NotAttempted,
    /**
     * Indicates that either Value or InputValue was changed
     * but has yet to be validated.
     */
    ValueChangedButUnvalidated,
    /**
     * Validation was not run, including when the Validator.severity is Off.
     */
    Undetermined,

    /**
     * Validation completed with all Conditions evaluating as Match
     */
    Valid,
    /**
     * Validation completed with at least one Condition evaluating as NoMatch
     */
    Invalid
}
export const ValidationStatusString = [
    'NotAttempted',
    'ValueChangedButUnvalidated',
    'Undetermined',
    'Valid',
    'Invalid'
];

/**
 * Determines how a Validator will behave when a Condition evaluates as NoMatch.
 * It may show error messages, prevent further evaluation of conditions
 * on the same ValueHost, and block saving.
 */
export enum ValidationSeverity {
    /**
     * The result isn't enough to block saving. For example,
     * "Person is under age 18. Please confirm with Parent."
     */
    Warning,
    /**
     * The result will block saving.
     * Validation process will continue to the next validator
     * in the ValidatableValueHost.Validators list.
     */
    Error,
    /**
     * The result will block saving.
     * Validation process will stop, leaving remaining validators set to 'ValidationStatus.Undetermined'.
     * Its best to put these early in the list of ValidatableValueHost.Validators.
     * It is the default for validators with Category = Require and DataTypeCheck 
     * (RequireTextCondition and DataTypeCheckCondition).
     * - RequireTextCondition - If you don't have any data to evaluate, none of the remaining validators serve a purpose.
     * - DataTypeCheckCondition - If you cannot convert a string to the native data type,
     * none of the remaining validators have native data to evaluate.
     */
    Severe
}

/**
 * Snapshot of the results of validate() when there are errors/warnings ("Issues")
 */
export interface IssueFound {
    /**
     * Containing ValueHostName
     */
    valueHostName: ValueHostName;
    /**
     * Error code is either what was supplied on ValidatorConfig.errorCode
     * or Condition.ConditionType.
     */
    errorCode: string;

    /**
     * Determines how a Validator will behave when a Condition evaluates as NoMatch.
     * It may show error messages, prevent further evaluation of conditions
     * on the same ValueHost, and block saving.
    */
    severity: ValidationSeverity;

    /**
     * The error message nearby the input field/element, ready to display in the UI.
     * With all of the processing for tokens and added formatting 
     * (for example, HTML tags around some tokens if the platform supports HTML).
     */
    errorMessage: string;
    /**
     * The error message shown in a validation summary. It often contains a
     * user friendly name of the ValueHost due to being a distance from the input field/element.
     * With all of the processing for tokens and added formatting 
     * (for example, HTML tags around some tokens if the platform supports HTML).
     * If null/undefined, summary viewer should use errorMessage.
     */
    summaryMessage?: string;
}


/**
 * When Business Logic gathers data from the UI, it runs its own final validation.
 * If its own business rule has been violated, it should be recorded with this interface
 * and passed to ValidationManager.setBusinessLogicErrors where it becomes exposed to 
 * the Validation Summary (getIssuesFound) and optionally for an individual ValueHostName,
 * by specifying that valueHostName in AssociatedValueHostName.
 */
export interface BusinessLogicError {
    /**
     * The error message to show to the user. It should be fully realized, no tokens
     * or language conversion expected to be handled by the ValidationManager.
     * The same message will be shown in the ValidationSummary and a ValueHost's validation.
     */
    errorMessage: string;
    /**
     * If the message is associated with a ValueHost, assign the ValueHostName.
     * That makes the message available to the ValueHost's validation.
     * The Summary can take advantage of it to establish a hyperlink on the message
     * that jumps to the ValueHost's input field/element.
     */
    associatedValueHostName?: string;

    /**
     * Provides the severity. When unassigned, it uses ValidationSeverity.Error.
     * Values of Error and Severe will change the ValidationReport to Invalid.
     */
    severity?: ValidationSeverity;
    /**
     * Optional information about the error to pass along to the ValidationSummary.
     * It should be a short error code as a string. It will be used in the IssueFound instance
     * returned from validate() and getIssuesFound().
     * Same as ConditionType unless you set the ValidatorConfig.errorCode property.
     * If not supplied, the IssueFound.ConditionType will be assigned a generated value.
     */
    errorCode?: string;
}


/**
 * Packages key values of the state of validation to be returned
 * by validate() and in the onValidationStateChanged callback.
 * The same values are also available directly on ValidationManager.
 */
export interface ValidationState
{
    /**
     * When true, there is nothing known to block validation. However, there are other factors
     * to consider: there may be warning issues found or an async validator is still running. 
     * So check doNotSaveValueHosts as the ultimate guide to saving.
     * When false, there is at least one validation error.
     */
    isValid: boolean;
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to validate(). (It does not run validate().)
     * True when ValidationStatus is Invalid or ValueChangedButUnvalidated
     * on individual validators.
     */
    doNotSave: boolean;

    /**
     * All issues current found (except ValueHosts not matching the validation group which are excluded.)
     * Includes issues found by setBusinessLogicErrors too.
     * If none, it is null
     */
    issuesFound: Array<IssueFound> | null;

    /**
     * When true, an async Validator is running
     */
    asyncProcessing: boolean;    
}
