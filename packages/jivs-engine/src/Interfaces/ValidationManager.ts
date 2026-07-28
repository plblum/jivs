/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your fields and their validation
 * through the Config classes.
 * Once setup, it has a list of ValueHost objects, one for each
 * config that was supplied. Those that are ValidatorsValueHostBases
 * contain validators.
 * 
 * ValidationManager's job is:
 * - Create and retain all ValueHosts.
 * - Provide access to all ValueHosts with its getValueHost() function.
 * - Retain InstanceState objects that reflects the states of all ValueHost instances.
 *   This system can operate in a stateless way, so long as you keep
 *   these objects and pass them back via the Configuration object.
 *   Its OnInstanceStateChanged and OnValueHostInstanceStateChanged properties are callbacks
 *   provide the latest InstanceState objects to you.
 * - Execute validation on demand to the consuming system, going
 *   through all eligible ValidatorsValueHostBases.
 * - Report a list of Issues Found for an individual UI element.
 * - Report a list of Issues Found for the entire system for a UI 
 *   element often known as "Validation Summary".
 * 
 * @module ValidationManager/Types
 */


import { ValueHostName } from '../DataTypes/BasicTypes';
import { ValidateOptions, IssueFound, ValidationState } from './Validation';
import { IValueHost, IValueHostCallbacks, ValueHostConfig, ValueHostInstanceState } from './ValueHost';

import {
    IValidatorsValueHostBase, IValidatorsValueHostBaseCallbacks,
    toIValidatorsValueHostBaseCallbacks
} from './ValidatorsValueHostBase';
import { IValidationServices } from './ValidationServices';
import { IFieldValueHost, IFieldValueHostChangedCallback } from './FieldValueHost';
import { IValueHostResolver } from './ValueHostResolver';


/**
 * Interface from which to implement a ValidationManager.
 */
export interface IValidationManager extends IValueHostResolver {
    /**
     * Provides access to ValidationServices (override IServices).
     */
    readonly services: IValidationServices; 
    /**
     * Adds a ValueHostConfig for a ValueHost not previously added. 
     * Does not trigger any notifications.
     * Exception when the same ValueHostConfig.name already exists.
     * @param config 
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * When null, the state supplied in the ValidationManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    addValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;    
    
    /**
     * Replaces a ValueHostConfig for an already added ValueHost. It does not merge.
     * If merging is required, use addOrMergeValueHost().
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * Any previous ValueHost and its config will be disposed.
     * Be sure to discard any reference to the ValueHost instance that you have.
     * @param config 
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    addOrUpdateValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;

    /**
     * Replaces a ValueHostConfig for an already added ValueHost.
     * It merges the new config with the existing one using the ValueHostConfigMergeService.
     * The goal is to protect important business logic settings while allowing the UI
     * to inject new property values where appropriate.
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * Any previous ValueHost and its config will be disposed.
     * Be sure to discard any reference to the ValueHost instance that you have.
     * @param config 
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    addOrMergeValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;    

    /**
     * Discards a ValueHost. 
     * Does not trigger any notifications.
     * @param valueHostName 
     */
    discardValueHost(valueHostName: ValueHostName): void;    


    /**
     * Retrieves the IValidatorsValueHostBase of the identified by valueHostName
     * @param valueHostName - Matches to the ValidatorsValueHostBaseConfig.name property
     * Returns the instance or null if not found or found a different type of value host.
     */
    getValidatorsValueHost(valueHostName: ValueHostName): IValidatorsValueHostBase | null;    

    /**
     * Retrieves the FieldValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the FieldValueHostConfig.name property
     * Returns the instance or null if not found or found a different type of value host.
     */
    getFieldValueHost(valueHostName: ValueHostName): IFieldValueHost | null;

    /**
     * Runs validation against all validatable ValueHosts, except those that do not
     * match the validation group supplied in options.
     * Updates this ValueHost's InstanceState and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * Important to set options.BeforeSubmit to true if invoking validate() prior to submitting.
     * @returns The ValidationState object, which packages several key
     * pieces of information: isValid, doNotSave, and issues found.
     */
    validate(options?: ValidateOptions): ValidationState;
    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     * @returns true when there was something cleared
     */
    clearValidation(options?: ValidateOptions): boolean;

    /**
     * When true, the current state of validation does not know of any errors. 
     * However, there are other factors to consider: 
     * there may be warning issues found (in IssuesFound),
     * an async validator is still running,
     * validator evaluated as Undetermined.
     * So check doNotSaveValueHosts as the ultimate guide to saving.
     * When false, there is at least one validation error.
     */
    isValid: boolean;

    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to validate(). (It does not run validate().)
     * True when at least one ValueHost's ValidationStatus is 
     * Invalid or NeedsValidation
     */
    doNotSave: boolean;
    
    /**
     * When true, an async Validator is running
     */
    asyncProcessing?: boolean;
    
    /**
     * For a list of external errors, meaning the developer's own code
     * determines there is an error and supplies a list of them here.
     * These will survive through clearValidation() and validate() since they are not generated by validators, 
     * but they will be cleared by clearExternalIssuesFound().
     * 
     * Invokes the onValueHostValidationStateChanged callback unless skipCallback is true.
    
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated or there is another issue, 
     * it should be passed here where it becomes exposed to 
     * the Validation Summary (getIssuesFound) and optionally for an individual ValueHostName,
     * by specifying that valueHostName in ValueHostName.
     * Each time its called, all previous external errors are abandoned.
     * @param errors - A list of external errors to show or null to indicate no errors.
     * @param options - Only considers the skipCallback option.
     * @param determinedLocally - when true, your app's code figured out this issue and the error will be
     * revised by the next local validation. When false, for everything else. Allows post validation errors
     * generated by a server to avoid blocking the next attempt to save. Internally sets IssueFound.doNotSave to 
     * this value.
     * @returns when true, the validation snapshot has changed.
     */
    addExternalIssuesFound(errors: Array<IssueFound> | null, determinedLocally: boolean, options?: ValidateOptions): boolean;
    /**
     * For a single external issuefound, meaning the developer's own code
     * determines there is an error and supplies it here.
     * These will survive through clearValidation() and validate() since they are not generated by validators, 
     * but they will be cleared by clearExternalIssuesFound().
     * Invokes the onValueHostValidationStateChanged callback unless skipCallback is true.

     * @param error - The IssueFound to add to the list of external IssuesFound.
     * @param options - Only considers the skipCallback option.
     * @param determinedLocally - when true, your app's code figured out this issue and the error will be
     * revised by the next local validation. When false, for everything else. Allows post validation errors
     * generated by a server to avoid blocking the next attempt to save. Internally sets IssueFound.doNotSave to 
     * this value.
     * @returns when true, the validation snapshot has changed.
     */
    addExternalIssueFound(error: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean;

    /**
     * Lists all issues found (error messages and supporting info) for a single FieldValueHost.
     * @returns An array of issues found. 
     * When null, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - name - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - errorCode - Identifies the validator supplying the issue.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied
     * - summaryMessage - The message suited for a Validation Summary widget.
     */
    getIssuesForField(valueHostName: ValueHostName): Array<IssueFound> | null;

    /**
     * A list of all issues from all ValidatorsValueHostBases optionally for a given group.
     * Use with a Validation Summary widget and when validating the Model itself.
     * @param group - Omit or null to ignore groups. Otherwise this will match to ValidatorsValueHostBases with 
     * the same group (case insensitive match).
     * @returns An array of details of issues found. 
     * When null, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - name - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - errorCode - Identifies the validator supplying the issue.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied. 
     * - summaryMessage - The message suited for a Validation Summary widget.
     */
    getIssuesFound(group?: string): Array<IssueFound> | null;

    /**
     * Server-side: package validation results for transfer to the client as a string.
     * The client can pass that string to fromValidationPayload to restore issue state.
     * The consumer can then transfer this string to the client and use fromValidationPayload to restore the state of validation.
     * The internals are not intended for use by the consumer.
     * Combines validator-generated IssuesFound with user-supplied external IssueFound.
     * @param externalIssues - Errors from business logic, external validators, etc.
     * @returns Package ready for HTTP/API response
     */
    toValidationPayload(externalIssues: Array<IssueFound> | null): string;

    /**
     * Client-side: restore transferred IssueFound state from toValidationPayload().
     * Imported issues are routed through addExternalIssueFound().
     * Issues may align to validator-owned state by errorCode during import.
     * If they align, the validator's IssueFound shape is used instead of the imported one, 
     * allowing the UI to use the validator's errorMessage with tokens replaced.
     * If they do not align, the imported IssueFound is used as-is, but with doNotSave=false 
     * to allow the next validation attempt to clear it.
     * Optionally applies an encoding function to the error messages, such as HTML encoding for safe display on the client.
     * @param payload - Validation data from server
     * @param encode - Targets HTML encoding. When supplied, the function takes the 
     original errorMessage and returns a revised one. We will supply a function
     called htmlEncoder(string): string so the user just drops that name in as the parameter.
    * @returns true if state changed
    */
    fromValidationPayload(payload: string, encode?: null|((text: string)=>string)): boolean;    

    /**
     * ValueHosts that validate should try to fire onValidationStateChanged, even though they also 
     * fire onValueHostValidationStateChanged. This allows systems that observe validation changes 
     * at the validationManager level to know.
     * This function is optionally debounced with a delay in ms coming from
     * ValidationManagerConfig.notifyValidationStateChangedDelay
     * @param validationState
     * @param options
     * @param force - when true, override the debouncer and execute immediately.
     */
    notifyValidationStateChanged(validationState: ValidationState | null, options?: ValidateOptions, force?: boolean): void;   
    
    
    /**
     * Upon changing the value of a ValueHost, other ValueHosts need to know. 
     * They may have Conditions that take the changed ValueHost into account and
     * will want to revalidate or set up a state to force revalidation.
     * This goes through those ValueHosts and notifies them.
     */
    notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostName, revalidate: boolean): void;
    
    /**
     * Report that a ValueHost had its instance state changed.
     * Invokes onValueHostInstanceStateChanged if setup.
     * @param valueHost 
     * @param instanceState 
     */
    notifyValueHostInstanceStateChanged(valueHost: IValueHost, instanceState: ValueHostInstanceState): void;    
}

/**
 * Stateful values from the instance of ValidationManager.
 * This is expected to be retained by the creator of ValidationManager
 * so the hosting HTML can be regenerated and a new ValidationManager
 * is created with the retained state.
 * In a SPA, it may not be necessary to handle states like that.
 * The SPA may keep an instance of ValidationManager for the duration needed.
 * Each entry in ValueHostInstanceStates must have a companion in ValueHosts and ValueHostConfigs.
 */
export interface ValidationManagerInstanceState {
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
     * Services that are needed by ValidationManager
     */
    services: IValidationServices;

    /**
     * Initial list of ValueHostConfigs. Here's where all of the action is!
     * Each ValueHostConfig describes one ValueHost (which is info about one value in your app),
     * plus its validation rules.
     * If rules need to be changed later, either create a new instance of ValidationManager
     * or use its addValueHost, addOrUpdateValueHost, discardValueHost methods.
     */
    valueHostConfigs: Array<ValueHostConfig>;    

    /**
     * The InstanceState for the ValidationManager itself.
     * Its up to you to retain stateful information so that the service works statelessly.
     * It will supply you with the changes to states through the OnInstanceStateChanged property.
     * Whatever it gives you, you supply here to rehydrate the ValidationManager with 
     * the correct state.
     * If you don't have any state, leave this null or undefined and ValidationManager will
     * initialize its state.
     */
    savedInstanceState?: ValidationManagerInstanceState | null;
    /**
     * The state for each ValueHost. The array may not have the same states for all the ValueHostConfigs
     * you are supplying. It will create defaults for those missing and discard those no longer in use.
     * 
     * Its up to you to retain stateful information so that the service works statelessly.
     * It will supply you with the changes to states through the OnValueHostInstanceStateChanged property.
     * Whatever it gives you, you supply here to rehydrate the ValidationManager with 
     * the correct state. You can also supply the state of an individual ValueHost when using
     * the addValueHost or addOrUpdateValueHost methods.
     * If you don't have any state, leave this null or undefined and ValidationManager will
     * initialize its state.
     */
    savedValueHostInstanceStates?: Array<ValueHostInstanceState> | null;
}

export type ValidationStateChangedHandler
    = (validationManager: IValidationManager, validationState: ValidationState) => void;

export type ValidationManagerInstanceStateChangedHandler
    = (ValidationManager: IValidationManager, stateToRetain: ValidationManagerInstanceState) => void;

export type ValidationManagerConfigChangedHandler
    = (validationManager: IValidationManager, valueHostConfigs: Array<ValueHostConfig>) => void;
 
/**
 * Provides callback hooks for the consuming system to supply to ValidationManager.
 * This instance is supplied in the constructor of ValidationManager.
 */
export interface IValidationManagerCallbacks
    extends IValueHostCallbacks,
    IValidatorsValueHostBaseCallbacks,
    IFieldValueHostChangedCallback
{

    /**
     * Called when the ValidationManager's InstanceState has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setState function with the stateToRetain
     */
    onInstanceStateChanged?: ValidationManagerInstanceStateChangedHandler | null;

    /**
     * Use this when caching the configuration for a later creation of ValidationManager.
     * 
     * Called when the configuration of ValueHosts has been changed, by these members
     * of ValidationManager: addValueHost, addOrUpdateValueHost, addOrMergeValueHost,
     * discardValueHost.
     * The supplied object is a clone so modifications will not impact the ValidationManager.
     * 
     * Note that where a ValueHostConfig has a property that references a function,
     * you will have to retain that reference in some way to reuse it.
     * In particular, ValidatorConfig.conditionCreator.
     */
    onConfigChanged?: ValidationManagerConfigChangedHandler | null;

    /**
     * Called when the state of validation has changed on a ValidatableValueHost.
     * That includes validate(), clearValidation(), addExternalIssuesFound(), 
     * clearExternalIssuesFound() and a few edge cases.
     * Supplies the current ValidationState to the callback.
     * Examples: Use to notify the Validation Summary widget(s) to refresh.
     * Use to change the disabled state of the submit button based on validity.
     * See also onValueHostValidationStateChanged for a similar callback from
     * individual ValueHosts.
     */
    onValidationStateChanged?: ValidationStateChangedHandler | null;


    /**
     * Provides a debounce delay for onValidationStateChanged notifications. The delay is in milliseconds.
     * 
     * onValidationStateChanged runs after each valueHost.validate() call, even though onValueHostValidationStateChanged also runs.
     * Some features need to know about the general change to the validation state, not just
     * on the individual field. So they expect onValidationStateChanged to run after valueHost.validate() runs.
     * A call by ValidationManager.validate() will validate a list of valueHosts, and
     * all of them will try to invoke onValidationStateChanged. That's too many in a short period.
     * This debounces them so ValidationManager.validated() generally has one call.
     * 
     * Leave undefined to use the default of defaultNotifyValidationStateChangedDelay.
     * Set to 0 to disable the debounce.
     */
    notifyValidationStateChangedDelay?: number;        
}

export const DefaultNotifyValidationStateChangedDelay = 100;
/**
 * Determines if the object implements IValidationManager.
 * @param source 
 * @returns source typecasted to IValidationManager if appropriate or null if not.
 */
export function toIValidationManager(source: any): IValidationManager | null
{
    if (source && typeof source === 'object') {
        const test = source as IValidationManager;
        if (
            test.getValueHost !== undefined &&
            test.services !== undefined &&
            test.addValueHost !== undefined &&
            test.addOrUpdateValueHost !== undefined &&
            test.getFieldValueHost !== undefined &&
            test.validate !== undefined &&
            test.clearValidation !== undefined &&
            test.isValid !== undefined &&
            test.doNotSave !== undefined &&
            test.getIssuesFound !== undefined
        )
            return test;
    }
    return null;
}


/**
 * Determines if the object implements IValidationManagerCallbacks.
 * @param source 
 * @returns source typecasted to IValidationManagerCallbacks if appropriate or null if not.
 */
export function toIValidationManagerCallbacks(source: any): IValidationManagerCallbacks | null
{
    if (toIValidatorsValueHostBaseCallbacks(source))
    {
        const test = source as IValidationManagerCallbacks;     
        if (test.onInstanceStateChanged !== undefined &&
            test.onValidationStateChanged !== undefined &&
            test.onConfigChanged !== undefined)
            return test;
    }
    return null;
}

/**
 * Allows classes to expose their reference to an IValidationManager
 * (which is usually the ValidationManager).
 */
export interface IValidationManagerAccessor
{
    readonly validationManager: IValidationManager;
}

/**
 * Determines if the object implements IValidationManagerAccessor.
 * @param source 
 * @returns source typecasted to IValidationManagerAccessor if appropriate or null if not.
 */
export function toIValidationManagerAccessor(source: any): IValidationManagerAccessor | null
{
    if (source && typeof source === 'object') {
        const test = source as IValidationManagerAccessor;     
        if (test.validationManager !== undefined)
            return test;
    }
    return null;
}