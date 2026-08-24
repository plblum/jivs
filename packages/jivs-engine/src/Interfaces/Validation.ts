/**
 * Interfaces built around the concept of data validation.
 * @module jivs-engine/Validation/Types
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ValidatorValidateResult } from './Validator';

/**
 * Parameter for the validate() function on Validatable ValueHosts and ValueHostsManager.
 * It provides additional guidance on how to get the validators involved.
 */
export interface ValidateOptions
{
    /**
     * Group validation name, a tool to group Validatable ValueHosts with a specific submit command when validating.
     * Use when there is more than one group of Validatable ValueHosts to be validated together.
     * For example, the ValueHostsManager handles two forms at once. Give
     * the ValidatableValueHostConfig.group a name for each form. Then make their submit command
     * pass in the same group name.
     * When Group is undefined or "*", validate() does not check group names. All Validatable ValueHosts 
     * within the ValueHostsManager are validated.
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
     * If you have setup a onValidationStateChanged or onValueHostValidationStateChanged callback,
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

    /**
     * Set to true when the user has fixed all invalid validators.
     * Undefined or false otherwise, including if the status changes after this point.
     */
    corrected?: boolean;
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
export enum ValidationStatus {
    /**
     * Indicates that validate() has yet to be attempted
     * Once attempted, it will always be one of the other results
     */
    NotAttempted,
    /**
     * Indicates that either native value or text value was changed
     * but has yet to be validated.
     */
    NeedsValidation,
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
    Invalid,

    /**
     * ValueHost is disabled, thus so is validation.
     */
    Disabled
}


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
     * Containing ValueHostName.
     * If used internally, it should be the same as the ValueHostName of the ValueHost that generated it.
     * If the developer is supplying it externally, it should be the ValueHostName of the ValueHost they want to associate the error with
     * or left null or empty to associated with the ModelValidatorsValueHost
     */
    valueHostName?: ValueHostName;
    /**
     * Identifies the issue type.
     * Error code is either what was supplied on ValidatorConfig.errorCode
     * or Condition.ConditionType.
     * Used to align an external or imported IssueFound with a validator's IssueFound shape.
     * Internally generated IssueFounds must always supply it based on ValidatorConfig.errorCode
     * or Condition.ConditionType.
     * If the developer is supplying it externally, it can be null/undefined and the system will generate one.
     * In doing so, the developer opts out of validator alignment.
     */
    errorCode?: string;

    /**
     * Determines how a Validator will behave when a Condition evaluates as NoMatch.
     * It may show error messages, prevent further evaluation of conditions
     * on the same ValueHost, and block saving.
     * When unassigned, it uses ValidationSeverity.Error.
    */
    severity?: ValidationSeverity;

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

    /**
     * Determines if this IssueFound contributes to ValidationState.doNotSave.
     * ValidationState.doNotSave becomes true for at least one IssueFound with doNotSave true.
     * (It becomes true for other reasons too.)
     * Internal validation should always set this to true unless the Severity is warning.
     * External validation should set this to true if the error was determined by the client app's code and 
     * thus likely to be revised by the next local validation.
     * Set to false when the error was determined by other factors such as the server, which allows the error message to be shown to the user
     * without blocking the next attempt to save, which is important when the user can only clear the error after the next call to the server.
     * Defaults to true when undefined.
     */
    doNotSave?: boolean;
}




/**
 * Packages key values of the state of validation to be returned
 * by validate() and in the onValidationStateChanged callback.
 * The same values are also available directly on ValueHostsManager.
 */
export interface ValidationState
{
    /**
     * When true, there is nothing known to block validation. However, there are other factors
     * to consider: there may be warning issues found or an async validator is still running. 
     * So check doNotSave as the ultimate guide to saving.
     * When false, there is at least one validation error.
     */
    isValid: boolean;
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to validate(). (It does not run validate().)
     * True when ValidationStatus is Invalid or NeedsValidation
     * on individual validators.
     */
    doNotSave: boolean;

    /**
     * All issues current found (except ValueHosts not matching the validation group which are excluded.)
     * Includes issues found by addExternalIssuesFound too.
     * If none, it is null
     */
    issuesFound: Array<IssueFound> | null;

    /**
     * When true, an async Validator is running
     */
    asyncProcessing: boolean;    
}

