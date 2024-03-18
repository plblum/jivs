/**
 * Interfaces built around the concept of data validation.
 * @module ValueHosts/Interfaces
 */
import { ValueHostId } from "../DataTypes/BasicTypes";
import { IInputValidateResult } from "./InputValidator";

/**
 * Parameter for the Validate method on InputValueHost and ValidationManager.
 * It provides additional guidance on how to get the validators involved.
 */
export interface IValidateOptions
{
    /**
     * Group validation name, a tool to group validators with a specific submit command.
     * Use when there is more than one list of ValueHosts to be validated together.
     * For example, the ValidationManager handles two forms at once. Give
     * the InputValidatorDescriptor.Group a name for each form. Then make their submit command
     * pass in the same group name.
     * When Group is undefined or "*", validate does not check group names. All Validators 
     * within the ValidationManager get involved.
     * When assigned, only validators with a matching group name (case insensitive) will be involved.
     */
    Group?: string;

    /**
     * Set to true when running a validation prior to a submit activity.
     * Typically set to true just after loading the form to report any errors already present.
     * During this phase, the Required validator is not checked as the user doesn't need
     * the noise complaining about missing input when they haven't had a chance to address it.
     * When undefined, it is the same as false.
     */
    Preliminary?: boolean;
    /**
     * Set to true when handling an intermediate change activity, such as a keystroke
     * changed a textbox but the user remains in the textbox. For example, on the 
     * HTMLInputElement.oninput event.
     * This will involve only validators that make sense during such an edit.
     * Usually that is just a Condition whose Category is Required.
     * When undefined, it is the same as false.
     */
    DuringEdit?: boolean;
    /**
     * If you have setup a callback, whether on the ValidationManager or ValueHost,
     * you may not want it to fire when you expressly call Validate.
     * In that case, set this to true.
     */
    OmitCallback?: boolean;
}

/**
 * Result of the Validate function that will be saved in InputValueHostState
 */
export interface IStatefulValidateResult {
    /**
     * The state of validation for this ValueHost.
     */
    ValidationResult: ValidationResult;

    /**
     * The issues that were found.
     */
    IssuesFound: Array<IIssueFound> | null;
}
/**
 * Result of the Validate function.
 */
export interface IValidateResult extends IStatefulValidateResult {
    /**
     * Any promises returned by InputValidator.Validate
     * These still need to finish before supplying their evaluation results.
     * When either null or undefined, nothing is pending.
     * There should never be an empty array as the presence of an array
     * will make the system think there are promises pending.
     */
    Pending?: Array<Promise<IInputValidateResult>> | null;
}



/**
 * The state of validation for this ValueHost.
 */
export enum ValidationResult {
    /**
     * Indicates that Validate has yet to be attempted
     * Once attempted, it will always be one of the other results
     */
    NotAttempted,
    /**
     * Indicates that either Value or InputValue was changed
     * but has yet to be validated.
     */
    ValueChangedButUnvalidated,
    /**
     * Validation was not run, including when the InputValidator.Severity is Off.
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
export const ValidationResultString = [
    "NotAttempted",
    "ValueChangedButUnvalidated",
    "Undetermined",
    "AsyncProcessing",
    "Valid",
    "Invalid"
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
     * in the InputValueHost.Validators list.
     */
    Error,
    /**
     * The result will block saving.
     * Validation process will stop, leaving remaining validators set to 'ValidationResult.Undetermined'.
     * Its best to put these early in the list of InputValueHost.Validators.
     * Consider this for RequiredConditions and DataTypeCondition.
     * RequiredCondition - If you don't have any data to evaluate, none of the remaining validators serve a purpose.
     * CanConvertToNativeDataTypeCondition - If you cannot convert a string to the native data type,
     * none of the remaining validators have native data to evaluate.
     */
    Severe
}

/**
 * Snapshot of the results of Validate when there are errors/warnings ("Issues")
 */
export interface IIssueFound {
    /**
     * Containing ValueHostId
     */
    ValueHostId: ValueHostId;
    /**
     * Type of Condition that resulted in an error message
     */
    ConditionType: string;

    /**
     * Determines how a Validator will behave when a Condition evaluates as NoMatch.
     * It may show error messages, prevent further evaluation of conditions
     * on the same ValueHost, and block saving.
    */
    Severity: ValidationSeverity;

    /**
     * The error message nearby the input field/element, ready to display in the UI.
     * With all of the processing for tokens and added formatting 
     * (for example, HTML tags around some tokens if the platform supports HTML).
     */
    ErrorMessage: string;
    /**
     * The error message shown in a validation summary. It often contains a
     * user friendly name of the ValueHost due to being a distance from the input field/element.
     * With all of the processing for tokens and added formatting 
     * (for example, HTML tags around some tokens if the platform supports HTML).
     * If null/undefined, summary viewer should use ErrorMessage.
     */
    SummaryMessage?: string;
}


/**
 * Results for function that reveal error messages.
 */
export interface IIssueSnapshot {
    Id: ValueHostId;
    Severity: ValidationSeverity;
    ErrorMessage: string;
}

/**
 * When Business Logic gathers data from the UI, it runs its own final validation.
 * If its own business rule has been violated, it should be recorded with this interface
 * and passed to ValidationManager.SetBusinessLogicErrors where it becomes exposed to 
 * the Validation Summary (GetIssuesForSummary) and optionally for an individual ValueHostId,
 * by specifying that ValueHostID in AssociatedValueHostId.
 */
export interface IBusinessLogicError {
    /**
     * The error message to show to the user. It should be fully realized, no tokens
     * or language conversion expected to be handled by the ValidationManager.
     * The same message will be shown in the ValidationSummary and a ValueHost's validation.
     */
    ErrorMessage: string;
    /**
     * If the message is associated with a ValueHost, assign the ValueHostId.
     * That makes the message available to the ValueHost's validation.
     * The Summary can take advantage of it to establish a hyperlink on the message
     * that jumps to the ValueHost's input field/element.
     */
    AssociatedValueHostId?: string;

    /**
     * Provides the severity. When unassigned, it uses ValidationSeverity.Error.
     * Values of Error and Severe will change the ValidationReport to Invalid.
     */
    Severity?: ValidationSeverity;
    /**
     * Optional information about the error to pass along to the ValidationSummary.
     * It should be a short error code as a string. It will be used in the IIssueFound
     * returned from Validate and GetIssuesFound in IIssueFound.ConditionType.
     * ConditionType is used to uniquely identify each IIssueFound, and your value
     * here will serve the same role. As a result, its value cannot match any
     * ConditionType.
     * If not supplied, the IIssueFound.ConditionType will be assigned a generated value.
     */
    ErrorCode?: string;
}
