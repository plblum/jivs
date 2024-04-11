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
 * - Provide access to all ValueHosts with its getValueHost() function.
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
 * @module ValidationManager/Types
 */


import { ValueHostName } from '../DataTypes/BasicTypes';
import { IValueHostsManager } from './ValueHostResolver';
import { ValidateOptions, ValidateResult, BusinessLogicError, IssueFound } from './Validation';
import { IValidationServices } from './ValidationServices';
import { ValueHostDescriptor, ValueHostState } from './ValueHost';
import { IInputValueHostCallbacks, toIInputValueHostCallbacks } from './ValidatableValueHostBase';
import { IInputValueHostDescriptorResolver } from './InputValueHost';

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
     * Important to set options.BeforeSubmit to true if invoking validate() prior to submitting.
     * @returns Array of ValidateResult with empty array if all are valid
     */
    validate(options?: ValidateOptions): Array<ValidateResult>;
    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    clearValidation(): void;

    /**
     * Value is setup by calling validate(). It does not run validate() itself.
     * Returns false only when any InputValueHost has a ValidationResult of Invalid. 
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using doNotSaveNativeValue for more clarity.
     */
    isValid: boolean;

    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to validate(). (It does not run validate().)
     * True when ValidationResult is Invalid, AsyncProcessing, or ValueChangedButUnvalidated
     * on individual validators.
     */
    doNotSaveNativeValue(): boolean;

    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (getIssuesFound) and optionally for an individual ValueHostName,
     * by specifying that valueHostName in AssociatedValueHostName.
     * Each time its called, all previous business logic errors are abandoned.
     * @param errors - A list of business logic errors to show or null to indicate no errors.
     */
    setBusinessLogicErrors(errors: Array<BusinessLogicError> | null): void;

    /**
     * Lists all issues found (error messages and supporting info) for a single InputValueHost
     * so the input field/element can show error messages and adjust its appearance.
     * @returns An array of 0 or more details of issues found. 
     * When 0, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - name - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - conditionType - Identifies the condition supplying the issue.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied
     * - summaryMessage - The message suited for a Validation Summary widget.
     */
    getIssuesForInput(valueHostName: ValueHostName): Array<IssueFound>;

    /**
     * A list of all issues from all InputValueHosts optionally for a given group.
     * Use with a Validation Summary widget and when validating the Model itself.
     * @param group - Omit or null to ignore groups. Otherwise this will match to InputValueHosts with 
     * the same group (case insensitive match).
     * @returns An array of 0 or more details of issues found. 
     * When 0, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - name - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - conditionType - Identifies the condition supplying the issue.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied. 
     * - summaryMessage - The message suited for a Validation Summary widget.
     */
    getIssuesFound(group?: string): Array<IssueFound>;
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
export interface ValidationManagerState {
    /**
     * Mostly here to provide a way to detect a change in the state quickly.
     * This value starts at 0 and is incremented each time ValidationManager
     * stores a changed state.
     */
    stateChangeCounter?: number;
}


/**
 * Provides the configuration for the ValidationManager constructor
 */
export interface ValidationManagerConfig extends IValidationManagerCallbacks
{
    /**
     * Provides services into the system. Dependency Injection and factories.
     */
    services: IValidationServices;
    /**
     * Initial list of ValueHostDescriptors. Here's where all of the action is!
     * Each ValueHostDescriptor describes one ValueHost (which is info about one value in your app),
     * plus its validation rules.
     * If rules need to be changed later, either create a new instance of ValidationManager
     * or use its addValueHost, updateValueHost, discardValueHost methods.
     */
    valueHostDescriptors: ConfigValueHostDescriptors;
    /**
     * The state for the ValidationManager itself.
     * Its up to you to retain stateful information so that the service works statelessly.
     * It will supply you with the changes to states through the OnStateChanged property.
     * Whatever it gives you, you supply here to rehydrate the ValidationManager with 
     * the correct state.
     * If you don't have any state, leave this null or undefined and ValidationManager will
     * initialize its state.
     */
    savedState?: ValidationManagerState | null;
    /**
     * The state for each ValueHost. The array may not have the same states for all the ValueHostDescriptors
     * you are supplying. It will create defaults for those missing and discard those no longer in use.
     * 
     * Its up to you to retain stateful information so that the service works statelessly.
     * It will supply you with the changes to states through the OnValueHostStateChanged property.
     * Whatever it gives you, you supply here to rehydrate the ValidationManager with 
     * the correct state. You can also supply the state of an individual ValueHost when using
     * the addValueHost or updateValueHost methods.
     * If you don't have any state, leave this null or undefined and ValidationManager will
     * initialize its state.
     */
    savedValueHostStates?: Array<ValueHostState> | null;
}
/**
 * Type for the ValidationManagerConfig.valueHostDescriptors that permits
 * several types, so long as they result in a ValueHostDescriptor.
 */
export type ConfigValueHostDescriptors = Array<ValueHostDescriptor | IInputValueHostDescriptorResolver>;

export type ValidationManagerStateChangedHandler = (validationManager: IValidationManager, stateToRetain: ValidationManagerState) => void;
export type ValidationManagerValidatedHandler = (validationManager: IValidationManager, validateResults: Array<ValidateResult>) => void;


/**
 * Provides callback hooks for the consuming system to supply to ValidationManager.
 * This instance is supplied in the constructor of ValidationManager.
 */
export interface IValidationManagerCallbacks extends IInputValueHostCallbacks {
    /**
     * Called when the ValidationManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setState function with the stateToRetain
     */
    onStateChanged?: ValidationManagerStateChangedHandler | null;
    /**
     * Called when ValidationManager's validate() function has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the Validation Summary widget(s) to refresh.
     * Use to change the disabled state of the submit button based on validity.
     */
    onValidated?: ValidationManagerValidatedHandler | null;
}

/**
 * Determines if the object implements IValidationManagerCallbacks.
 * @param source 
 * @returns source typecasted to IValidationManagerCallbacks if appropriate or null if not.
 */
export function toIValidationManagerCallbacks(source: any): IValidationManagerCallbacks | null
{
    if (toIInputValueHostCallbacks(source))
    {
        let test = source as IValidationManagerCallbacks;     
        if (test.onStateChanged !== undefined &&
            test.onValidated !== undefined)
            return test;
    }
    return null;
}
