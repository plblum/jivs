import { ValueHostId } from "../DataTypes/BasicTypes";
import { IValueHostsManager } from "./ValueHostResolver";
import { IValidateOptions, IValidateResult, IBusinessLogicError, IIssueSnapshot } from "./Validation";

/**
 * The central object for using this system.
 * It is where you describe the shape of your inputs and their validation
 * through the Descriptor classes.
 * Once setup, it has a list of ValueHost objects, one for each
 * descriptor that was supplied. Those that are InputValueHosts
 * contain validators.
 * 
 * Business logic is intended to manipulate the Descriptors found here.
 * Each time a InputValueHostDescriptor is created or replaced,
 * a corresponding entry is added or replaced in a dictionary of InputValueHost instances.
 * The InputValueHostDescriptors are considered immutable, only 
 * to be updated by business logic.
 * ValidationManager's job is:
 * - Maintain the ValueHostDescriptors
 * - Create and replace their associated ValueHost instances
 * - Provide access to all ValueHost instances so validators (specifically Conditions)
 *   can look up the data needed for evaluation.
 * - Retain a State object that reflects the states of all ValueHost instances.
 * - Provide a way to transfer values between the consuming system
 *   and the state.
 *   Notice that this class does not know anything about consuming system.
 *   It depends on the consuming system to transfer values.
 * - Execute validation on demand to the consuming system, going
 *   through all InputValueHosts, although individual ValueHosts may be configured
 *   to opt out, or will be ignored when a validation group requested
 *   isn't a match to that InputValueHost.
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
     * Lists all error messages and supporting info about each validator
     * for use by a widget that shows the local error messages (IInputValueHostState.ErrorMessage)
     * @returns An array of 0 or more details of issues found. Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated widget into view and sets focus.
     * - Severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - ErrorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each InputValidator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    GetIssuesForWidget(valueHostId: ValueHostId): Array<IIssueSnapshot>;
    /**
     * A list of all issues to show in a Validation Summary widget for a giving validation group.
     * @param group 
     * @returns An array of 0 or more details of issues found. Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated widget into view and sets focus.
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
export interface IModelState {
    StateChangeCounter?: number;
}

