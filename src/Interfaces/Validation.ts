/**
 * Interfaces built around the concept of data validation.
 * @module Validation/Interfaces
 */
import { ValueHostId } from '../DataTypes/BasicTypes';
import { InputValidateResult } from './InputValidator';

/**
 * Parameter for the validate() function on InputValueHost and ValidationManager.
 * It provides additional guidance on how to get the validators involved.
 */
export interface ValidateOptions
{
    /**
     * Group validation name, a tool to group InputValueHosts with a specific submit command when validating.
     * Use when there is more than one group of InputValueHosts to be validated together.
     * For example, the ValidationManager handles two forms at once. Give
     * the InputValueHostDescriptor.Group a name for each form. Then make their submit command
     * pass in the same group name.
     * When Group is undefined or "*", validate() does not check group names. All InputValueHosts 
     * within the ValidationManager are validated.
     * When assigned, only InputValueHosts with a matching group name (case insensitive) will be involved.
     */
    group?: string;

    /**
     * Set to true when running a validation prior to a submit activity.
     * Typically set to true just after loading the form to report any errors already present.
     * During this phase, the Required validator is not checked as the user doesn't need
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
     * If you have setup a callback, whether on the ValidationManager or ValueHost,
     * you may not want it to fire when you expressly call validate().
     * In that case, set this to true.
     */
    omitCallback?: boolean;
}

/**
 * Result of the validate() function that will be saved in InputValueHostState
 */
export interface StatefulValidateResult {
    /**
     * The state of validation for this ValueHost.
     */
    validationResult: ValidationResult;

    /**
     * The issues that were found.
     */
    issuesFound: Array<IssueFound> | null;
}
/**
 * Result of the validate() function.
 */
export interface ValidateResult extends StatefulValidateResult {
    /**
     * Any promises returned by InputValidator.validate()
     * These still need to finish before supplying their evaluation results.
     * When either null or undefined, nothing is pending.
     * There should never be an empty array as the presence of an array
     * will make the system think there are promises pending.
     */
    pending?: Array<Promise<InputValidateResult>> | null;
}



/**
 * The state of validation for this ValueHost.
 */
export enum ValidationResult {
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
    'NotAttempted',
    'ValueChangedButUnvalidated',
    'Undetermined',
    'AsyncProcessing',
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
 * Snapshot of the results of validate() when there are errors/warnings ("Issues")
 */
export interface IssueFound {
    /**
     * Containing ValueHostId
     */
    valueHostId: ValueHostId;
    /**
     * Type of Condition that resulted in an error message
     */
    conditionType: string;

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
 * Results for function that reveal error messages.
 */
export interface IssueSnapshot {
    id: ValueHostId;
    severity: ValidationSeverity;
    errorMessage: string;
}

/**
 * When Business Logic gathers data from the UI, it runs its own final validation.
 * If its own business rule has been violated, it should be recorded with this interface
 * and passed to ValidationManager.SetBusinessLogicErrors where it becomes exposed to 
 * the Validation Summary (getIssuesForSummary) and optionally for an individual ValueHostId,
 * by specifying that valueHostId in AssociatedValueHostId.
 */
export interface BusinessLogicError {
    /**
     * The error message to show to the user. It should be fully realized, no tokens
     * or language conversion expected to be handled by the ValidationManager.
     * The same message will be shown in the ValidationSummary and a ValueHost's validation.
     */
    errorMessage: string;
    /**
     * If the message is associated with a ValueHost, assign the ValueHostId.
     * That makes the message available to the ValueHost's validation.
     * The Summary can take advantage of it to establish a hyperlink on the message
     * that jumps to the ValueHost's input field/element.
     */
    associatedValueHostId?: string;

    /**
     * Provides the severity. When unassigned, it uses ValidationSeverity.Error.
     * Values of Error and Severe will change the ValidationReport to Invalid.
     */
    severity?: ValidationSeverity;
    /**
     * Optional information about the error to pass along to the ValidationSummary.
     * It should be a short error code as a string. It will be used in the IssueFound
     * returned from validate() and getIssuesFound() in IssueFound.conditionType.
     * ConditionType is used to uniquely identify each IssueFound, and your value
     * here will serve the same role. As a result, its value cannot match any
     * ConditionType.
     * If not supplied, the IssueFound.ConditionType will be assigned a generated value.
     */
    errorCode?: string;
}
