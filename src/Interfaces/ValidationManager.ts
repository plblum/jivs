/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your inputs and their validation
 * through the Descriptor classes.
 * Once setup, it has a list of ValueHost objects, one for each
 * descriptor that was supplied. Those that are InputValueHosts
 * contain validators.
 * 
 * ValidationManager's job is:
 * - Create and retain all ValueHosts.
 * - Provide access to all ValueHosts with its GetValueHost function.
 * - Retain State objects that reflects the states of all ValueHost instances.
 *   This system can operate in a stateless way, so long as you keep
 *   these objects and pass them back via the Configuration object.
 *   Its OnStateChanged and OnValueHostStateChanged properties are callbacks
 *   provide the latest State objects to you.
 * - Execute validation on demand to the consuming system, going
 *   through all eligible InputValueHosts.
 * - Report a list of Issues Found for an individual UI element.
 * - Report a list of Issues Found for the entire system for a UI 
 *   element often known as "Validation Summary".
 * 
 * @module ValidationManager/Interfaces
 */


import { ValueHostId } from "../DataTypes/BasicTypes";
import { IValueHostsManager } from "./ValueHostResolver";
import { IValidateOptions, IValidateResult, IBusinessLogicError, IIssueSnapshot } from "./Validation";

/**
 * Interface from which to implement a ValidationManager.
 */
export interface IValidationManager extends IValueHostsManager {

    /**
     * Runs validation against some of all validators.
     * All InputValueHosts will return their current state,
     * even if they are considered Valid.
     * Updates this ValueHost's State and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * Important to set options.BeforeSubmit to true if invoking Validate prior to submitting.
     * @returns Array of IValidateResult with empty array if all are valid
     */
    Validate(options?: IValidateOptions): Array<IValidateResult>;
    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    ClearValidation(): void;

    /**
     * Value is setup by calling Validate(). It does not run Validate itself.
     * Returns false only when any InputValueHost has a ValidationResult of Invalid. 
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using DoNotSaveNativeValue for more clarity.
     */
    IsValid: boolean;

    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to Validate(). (It does not run Validate().)
     * True when ValidationResult is Invalid, AsyncProcessing, or ValueChangedButUnvalidated
     * on individual validators.
     */
    DoNotSaveNativeValue(): boolean;

    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (GetIssuesForSummary) and optionally for an individual ValueHostId,
     * by specifying that ValueHostID in AssociatedValueHostId.
     * Each time its called, all previous business logic errors are abandoned.
     * @param errors - A list of business logic errors to show or null to indicate no errors.
     */
    SetBusinessLogicErrors(errors: Array<IBusinessLogicError> | null): void;

    /**
     * Lists all issues found (error messages and supporting info) for a single InputValueHost
     * so the input field/element can show error messages and adjust its appearance.
     * @returns An array of 0 or more details of issues found. Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - Severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - ErrorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each InputValidator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    GetIssuesForInput(valueHostId: ValueHostId): Array<IIssueSnapshot>;

    /**
     * A list of all issues to show in a Validation Summary widget optionally for a given group.
     * @param group - Omit or null to ignore groups. Otherwise this will match to InputValueHosts with 
     * the same group (case insensitive match).
     * @returns An array of 0 or more details of issues found. Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - Severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - ErrorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each InputValidator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    GetIssuesForSummary(group?: string): Array<IIssueSnapshot>;
}

/**
 * State of all ValueHostStates, including the validators of InputValueHosts.
 * This is expected to be retained by the creator of ValidationManager
 * so the hosting HTML can be regenerated and a new ValidationManager
 * is created with the retained state.
 * In a SPA, it may not be necessary to handle states like that.
 * The SPA may keep an instance of ValidationManager for the duration needed.
 * Each entry in ValueHostStates must have a companion in ValueHosts and ValueHostDescriptors.
 */
export interface IValidationManagerState {
    StateChangeCounter?: number;
}

