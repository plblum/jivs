/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your inputs and their validation rules.
 * Its methods provide validation and the results of validation.
 * @module ValidationManager/ConcreteClasses
 */
import { ModelValidatorsValueHostType, ModelValidatorsValueHostName } from '../ValueHosts/ModelValidatorsValueHost';
import { ValueHostName } from '../DataTypes/BasicTypes';
import type { ValueHostValidationStateChangedHandler } from '../Interfaces/ValidatableValueHostBase';
import { type ValidateOptions, type ExternalIssueFound, type IssueFound, ValidationState, SetIssuesFoundErrorCodeMissingBehavior } from '../Interfaces/Validation';
import { type ValidationManagerInstanceState, type IValidationManager, type ValidationManagerConfig, type IValidationManagerCallbacks, type ValidationStateChangedHandler, defaultNotifyValidationStateChangedDelay } from '../Interfaces/ValidationManager';
import { ValidatableValueHostBase } from '../ValueHosts/ValidatableValueHostBase';
import { ValueHostsManager } from '../ValueHosts/ValueHostsManager';
import { Debouncer } from '../Utilities/Debounce';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { IPropertyValueHost } from '../Interfaces/PropertyValueHost';
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { toIInputValueHost } from '../ValueHosts/InputValueHost';
import { toIPropertyValueHost } from '../ValueHosts/PropertyValueHost';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { ManagerConfigBuilderBase } from '../ValueHosts/ManagerConfigBuilderBase';
import { ValidationManagerConfigModifier } from './ValidationManagerConfigModifier';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { LoggingLevel } from '../Interfaces/LoggerService';


/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your inputs and their validation rules.
 * Once setup, it keeps a list of ValueHost objects that represent the elements of your model
 * or form, even if they don't need validation.
 * 
 * Configs are interfaces you use with plain objects to fashion them into 
 * ValidationManager's configuration. ValueHostConfig describes a ValueHost.
 * InputValueHostConfig describes an InputValueHost (which supports validation).
 * An InputValueHost takes ValidatorConfigs to fashion its list of Validators.
 * An Validator takes various ConditionConfigs to fashion the specific 
 * validation rule.
 * 
 * ValidationManager's constructor takes a single parameter, but its a potent one:
 * it's Configuration object (type=ValidationManagerConfig). By the time you 
 * create the ValidationManager, you have provided all of those configs to
 * the Configuration object. It also supplies the ValidationServices object,
 * state data, and callbacks. See the constructor's documentation for a sample of 
 * the Configuration object.
 * 
 * We recommend using your business logic to host the validation rules.
 * For that, you will need code that translates those rules into ValidatorConfigs.
 * Try to keep validation rules separate from your UI's code.
 * 
 * All Configs are considered immutable. If you need to make a change, you can
 * create a new instance of ValidationManager, or call its addValueHost, addOrUpdateValueHost,
 * or discardValueHost methods to keep the existing instance.
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
 *   through all eligible InputValueHosts.
 * - Report a list of Issues Found for an individual UI element.
 * - Report a list of Issues Found for the entire system for a UI 
 *   element often known as "Validation Summary".
 * 
 * Notice that this class does not know anything about consuming system.
 * As a result depends on the consuming system to transfer values between
 * the UI and the ValueHosts. Auxillary Jivs libraries may handle this.
 */

export class ValidationManager<TState extends ValidationManagerInstanceState = ValidationManagerInstanceState> extends ValueHostsManager<TState>
    implements IValidationManager, IValidationManagerCallbacks {
    /**
     * Constructor
     * @param config - Provides ValidationManager with numerous configuration settings.
     * It is just a simple object that you may initialize like this:
     * @example
     * ```ts
     * {
     *   services: createValidationServices(); <-- see and customize your create_services.ts file
     *   valueHostConfigs: [
     *     // see elsewhere for details on ValueHostConfigs as they are the heavy lifting in this system.
     *     // Just know that you need one object for each value that you want to connect
     *     // to the Validation Manager
     *      ],
     *   savedInstanceState: null, // or the state object previously returned with OnInstanceStateChanged
     *   savedValueHostInstanceStates: null, // or an array of the state objects previously returned with OnValueHostInstanceStateChanged
     *   onInstanceStateChanged: (validationManager, state)=> { },
     *   onValueHostInstanceStateChanged: (valueHost, state) => { },
     *   onValidationStateChanged: (validationManager, validationState)=> { },
     *   onValueHostValidationStateChanged: (valueHost, valueHostValidationState) => { },
     *   onValueChanged: (valueHost, oldValue) => { },
     *   onInputValueChanged: (valueHost, oldValue) => { }
     *   onConfigChanged: (valueHost, valueHostConfig) => { }
     * }
     * ```
     */
    constructor(config: ValidationManagerConfig)
    constructor(builder: ManagerConfigBuilderBase<any>)
    constructor(arg1: ValidationManagerConfig | ManagerConfigBuilderBase<any>){
        super(arg1 as any);
    }
    /**
     * If the user needs to abandon this instance, they should use this to 
     * clean up active resources (like timers)
     */
    public dispose(): void
    {
        super.dispose();
        if (this._debounceVHValidated)
            this._debounceVHValidated.dispose();
        this._debounceVHValidated = null;
    }
    
    protected get config(): ValidationManagerConfig // just strongly typing
    {
        return super.config as ValidationManagerConfig;
    }

    public get services(): IValidationServices {// just strongly typing
        return super.services as IValidationServices;
    }

    /**
     * Easier way to add or modify a ValueHostConfig than using
     * addValueHost(), addOrUpdateValueHost(), or addOrMergeValueHost().
     * It returns an object whose methods allow adding ValueHosts
     * and their validators. Upon calling its apply() method,
     * your changes will be applied through the addOrMergeValueHost() function.
     * ```ts
     * let vm = new ValidationManager(builder);
     * // later when you need to modify vm:
     * let modifier = vm.startModifying();
     * // supply changes to the ValueHostConfigs
     * modifier.input('Field3').regExp(null, { enabled: false });   // let's disable the existing validator
     * // merge those changes into the ValidationManager
     * modifier.apply(); // consider modifier disposed at this point 
     * ```
     */
    public startModifying(): ValidationManagerConfigModifier
    {
        return super.startModifying() as ValidationManagerConfigModifier;
    }
    
    /**
     * Retrieves the ValidatorsValueHostBase of the identified by valueHostName
     * @param valueHostName - Matches to the ValidatorsValueHostBaseConfig.name property
     * Returns the instance or null if not found or found a different type of value host.
     */
    public getValidatorsValueHost(valueHostName: ValueHostName): IValidatorsValueHostBase | null
    {
        return toIValidatorsValueHostBase(this.getValueHost(valueHostName));
    }
    /**
     * Retrieves the InputValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the IInputValueHost.name property
     * Returns the instance or null if not found or found a non-input valuehost.
     */
    public getInputValueHost(valueHostName: ValueHostName): IInputValueHost | null {
        return toIInputValueHost(this.getValueHost(valueHostName));
    }
    /**
     * Retrieves the PropertyValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the IPropertyValueHost.name property
     * Returns the instance or null if not found or found a non-Property valuehost.
     */
    public getPropertyValueHost(valueHostName: ValueHostName): IPropertyValueHost | null {
        return toIPropertyValueHost(this.getValueHost(valueHostName));
    }    
    /**
     * Runs validation against all validatable ValueHosts, except those that do not
     * match the validation group supplied in options.
     * Updates this ValueHost's InstanceState and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * @returns The ValidationState object, which packages several key
     * pieces of information: isValid, doNotSave, and issues found.
     * The same object is provided through the OnValidated function
     */
    public validate(options?: ValidateOptions): ValidationState
    {
        if (!options)
            options = {};

        for (let vh of this.validatableValueHost()) {
            vh.validate(options);   // the result is also registered in the vh and retrieved when building ValidationState
        }
        let snapshot = this.createValidationState(options);
        this.notifyValidationStateChanged(snapshot, options, true);
        return snapshot;
    }

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    public clearValidation(options?: ValidateOptions): boolean {
        let changed = false;
        for (let vh of this.validatableValueHost()) {
            if (vh.clearValidation(options))
                changed = true;
        }
        if (changed)
            this.notifyValidationStateChanged(null, options);
        return changed;
    }

    protected createValidationState(options?: ValidateOptions): ValidationState
    {
        return {
            isValid: this.isValid,
            doNotSave: this.doNotSave,
            issuesFound: this.getIssuesFound(options ? options.group : undefined),
            asyncProcessing: this.asyncProcessing
        };
    }

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
    public notifyValidationStateChanged(validationState : ValidationState | null, options?: ValidateOptions, force?: boolean): void {
        if (options && options.skipCallback)
            return;

        if (!this._debounceVHValidated) {
            let delay =  this.config.notifyValidationStateChangedDelay ?? defaultNotifyValidationStateChangedDelay;
            if (delay && !force)
                this._debounceVHValidated = new Debouncer<notifyValidationStateChangedWorkerHandler>(
                    this.notifyValidationStateChangedWorker.bind(this),
                    delay);
            else {
                this.notifyValidationStateChangedWorker(validationState, options);
                return;
            }
        }
        force ? this._debounceVHValidated!.forceRun(validationState, options) : this._debounceVHValidated!.run(validationState, options);
    }

    protected notifyValidationStateChangedWorker(validationState : ValidationState | null, options?: ValidateOptions): void {
        this.onValidationStateChanged?.(this, validationState ?? this.createValidationState(options));        
    }

    private _debounceVHValidated: Debouncer<notifyValidationStateChangedWorkerHandler> | null = null;

    /**
     * When true, the current state of validation does not know of any errors. 
     * However, there are other factors to consider: 
     * there may be warning issues found (in IssuesFound),
     * an async validator is still running,
     * validator evaluated as Undetermined.
     * So check @link doNotSave|doNotSave  as the ultimate guide to saving.
     * When false, there is at least one validation error.
     */
    public get isValid(): boolean {
        for (let vh of this.validatableValueHost())
            if (!vh.isValid)
                return false;
        return true;
    }
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to validate(). (It does not run validate().)
     * True when at least one ValueHost's ValidationStatus is 
     * Invalid or NeedsValidation
     */
    public get doNotSave(): boolean {
        for (let vh of this.validatableValueHost()) {
            if (vh.doNotSave)
                return true;
        }
        return false;
    }
    /**
     * When true, an async Validator is running in any ValueHost
     */
    public get asyncProcessing(): boolean
    {
        for (let vh of this.validatableValueHost()) {
            if (vh.asyncProcessing)
                return true;
        }
        return false;        
    }
    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (getIssuesFound) and optionally for an individual ValueHostName,
     * by specifying that valueHostName in associatedValueHostName.
     * Each time its called, all previous business logic errors are abandoned.
     * Internally, a ModelValidatorsValueHost is added to the list of ValueHosts to hold any
     * error that lacks an associatedValueHostName.
     * @param errors - A list of business logic errors to show or null to indicate no errors.
     * @param options - Only considers the skipCallback option.
     * @returns When true, the validation snapshot has changed.
     */
    public setExternalIssuesFound(errors: Array<ExternalIssueFound> | null, options?: ValidateOptions): boolean {
        let changed = false;
        for (let vh of this.validatableValueHost()) {
            if (vh.clearExternalIssuesFound())
                changed = true;
        }
        if (errors)
            for (let error of errors) {
                let vh = this.getValueHost(error.associatedValueHostName ?? ModelValidatorsValueHostName);
                if (!vh && !error.associatedValueHostName) {
                    vh = this.createModelValidatorsValueHost();
                }
                if (vh instanceof ValidatableValueHostBase)
                    if (vh.setExternalIssueFound(error, options))
                        changed = true;
            }
        if (changed)
            this.notifyValidationStateChanged(null, options, true);
        return changed;
    }

    /**
     * For a list of external errors, meaning the developer's own code
     * determines there is an error and supplies a list of them here.
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
     * @returns when true, the validation snapshot has changed.
     */
    public addExternalIssuesFound(errors: Array<IssueFound> | null, options?: ValidateOptions): boolean
    {
        let changed = false;
        for (let vh of this.validatableValueHost()) {
            if (vh.clearExternalIssuesFound()) // no options here because changed = true results in notifyValidationStateChanged later
                changed = true;
        }
        if (errors)
            for (let error of errors) {
                if (this.addExternalIssueFound(error, options))
                    changed = true;
            }
        if (changed)
            this.notifyValidationStateChanged(null, options, true);
        return changed;
    }
    /**
     * Discards all external errors previously set with addExternalIssuesFound.
     * @param options - Only considers the skipCallback option.
     * @returns when true, the validation snapshot has changed.
     */
    public clearExternalIssuesFound(options?: ValidateOptions): boolean
    {
        let changed = false;
        for (let vh of this.validatableValueHost()) {
            if (vh.clearExternalIssuesFound()) // no options here because changed = true results in notifyValidationStateChanged later
                changed = true;
        }

        if (changed)
            this.notifyValidationStateChanged(null, options, true);
        return changed;
    }    
    /**
     * For a single external issuefound, meaning the developer's own code
     * determines there is an error and supplies it here.
     * Invokes the onValueHostValidationStateChanged callback unless skipCallback is true.
     * Any with empty valueHostName are directed to the ModelValidatorsValueHost, which is the ValueHost that holds errors not associated with any particular ValueHost. If there is no ModelValidatorsValueHost, one will be created.
     * ModelValidatorsValueHost is created if not already available.

     * @param error - The IssueFound to add to the list of external IssuesFound.
     * @param options - Only considers the skipCallback option.
     * @returns when true, the validation snapshot has changed.
     */
    public addExternalIssueFound(error: IssueFound, options?: ValidateOptions): boolean
    {
        let changed = false;
        if (!error.valueHostName) 
            error.valueHostName = ModelValidatorsValueHostName;
        let vh = this.getValueHost(error.valueHostName);
        if (!vh)
            if (error.valueHostName === ModelValidatorsValueHostName) {
                vh = this.createModelValidatorsValueHost();
            }
            else {
                this.logger.message(LoggingLevel.Warn, () => `Could not find ValueHost with name ${error.valueHostName}`);
                return false;
            }
        if (vh instanceof ValidatableValueHostBase)
            if (vh.setExternalIssueFound(error, options))
                changed = true;
        return changed;
    }

    /**
     * Lists all issues found (error messages and supporting info) for a single InputValueHost
     * so the input field/element can show error messages and adjust its appearance.
     * @returns An array of 0 or more details of issues found. 
     * When 0, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - name - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - errorCode - Identifies the validator supplying the issue.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied
     * - summaryMessage - The message suited for a Validation Summary widget.
     */
    public getIssuesForInput(valueHostName: ValueHostName): Array<IssueFound> | null {
        let vh = this.getValueHost(valueHostName);
        if (vh && vh instanceof ValidatableValueHostBase)
            return vh.getIssuesFound();
        return null;
    }
    /**
     * A list of all issues from all InputValueHosts optionally for a given group.
     * Use with a Validation Summary widget and when validating the Model itself.
     * @param group - Omit or null to ignore groups. Otherwise this will match to InputValueHosts with 
     * the same group (case insensitive match).
     * @returns An array of issues found. 
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
    public getIssuesFound(group?: string): Array<IssueFound> | null {
        let list: Array<IssueFound> = [];
        for (let vh of this.validatableValueHost()) {
            let vhIssues = vh.getIssuesFound(group);
            if (vhIssues)
                list = list.concat(vhIssues);
        }
        return list.length ? list : null;
    }
    
    /**
     * Adds or replaces all IssueFound items to the appropriate ValueHosts.
     * Each ValueHost will invoke the onValueHostValidationStateChanged callback if needed.
     * 
     * Use case: client-side getting server-side Jivs-generated IssuesFound,
     * so the UI can incorporate it.
     * @param issuesFound 
     * @param behavior - keep or omit an issueFound that does not have a matching validator
     * based on the errorCode. Defaults to Keep
     */
    /// !!!OBSOLETE
    public setIssuesFound(issuesFound: Array<IssueFound>, behavior: SetIssuesFoundErrorCodeMissingBehavior = SetIssuesFoundErrorCodeMissingBehavior.Keep): boolean
    {
        assertNotNull(issuesFound, 'issuesFound');
        let changed = false;
        for (let vh of this.validatableValueHost()) {
            if (vh.setIssuesFound(issuesFound, behavior))
                changed = true;
        }
        return changed;
    }

    protected createModelValidatorsValueHost(): IValidatorsValueHostBase {
        // find existing by ModelValidatorsValueHostName
        // If found, return it. If not, create a new one and add it to the ValueHosts.
        // Log when creating
        let vh = this.getValueHost(ModelValidatorsValueHostName);
        if (vh)
            return vh as IValidatorsValueHostBase;
        this.logger.message(LoggingLevel.Info, ()=> 'Creating ModelValidatorsValueHost');
        return this.addValueHost({
            valueHostType: ModelValidatorsValueHostType,
            label: '*',
            name: ModelValidatorsValueHostName
        }, null) as IValidatorsValueHostBase;
    }

    //#region Payload
    /**
     * Server-side: Package validation results for transfer to client in the form of a string.
     * The consumer can then transfer this string to the client and use fromValidationPayload to restore the state of validation.
     * The internals are not intended for use by the consumer.
     * Combines validator-generated IssuesFound with user-supplied External IssuesFound.
     * User can supply external issues prior to this, using addExternalIssueFound, 
     * or can supply them as a parameter to this function. 
     * If supplied as a parameter, it will override any prior external issues.
     * @param externalIssues - Errors from business logic, external validators, etc.
     * @returns Package ready for HTTP/API response
     */
    public toValidationPayload(externalIssues: Array<IssueFound> | null): string
    {
        if (externalIssues && externalIssues.length > 0)
            this.setExternalIssuesFound(externalIssues, { skipCallback: true }); // will clear prior external issues
        let payload = this.getIssuesFound(); // combines validator-generated IssuesFound with user-supplied External IssuesFound
        return JSON.stringify(payload);
    }

    /**
     * Client-side: Restore validation state from server payload that came from toValidationPayload. 
     * The payload contains both validator-generated and user-supplied IssuesFound,
     * and does not distinguish between them. 
     * Sets displayOnly=true on all to prevent blocking later client side validation
     * because we got this from the server, and need to call the server to determine
     * these values.
     * Attempts validator swap for better error messages.
     * Optionally applies an encoding function to the error messages, such as HTML encoding for safe display on the client.
     * @param payload - Validation data from server
     * @param encode - Targets HTML encoding. When supplied, the function takes the 
     original errorMessage and returns a revised one. We will supply a function
     called htmlEncoder(string): string so the user just drops that name in as the parameter.
    * @returns true if state changed
    */
    public fromValidationPayload(payload: string, encode?: null | ((text: string) => string)): boolean
    {
        this.clearExternalIssuesFound({ skipCallback: true }); // clear prior validation results because we are about to set new ones, and we don't want to trigger callbacks until the end. Also, this ensures that any error from the payload that doesn't match a validator will be added based on the behavior of setIssuesFound.
        let parsed: Array<IssueFound> = JSON.parse(payload);
        if (!parsed) {
            this.logger.message(LoggingLevel.Warn, () => 'No issues found in payload');
            return false;
        }
        parsed.forEach(i => {
            if (!i.valueHostName) {
                i.valueHostName = ModelValidatorsValueHostName;
            }
            i.displayOnly = true; // we got this from the server, and need to call the server to determine these values, so prevent client side validation from blocking based on these values.
            if (encode)
                i.errorMessage = encode(i.errorMessage);
        });
        if (this.addExternalIssuesFound(parsed))
            return true;

        return false; // Placeholder, implement actual state change logic
    }
    //#endregion Payload

    //#region IValidationManagerCallbacks

    /**
     * Called when ValidationManager's validate() function has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the Validation Summary widget(s) to refresh.
     * Use to change the disabled state of the submit button based on validity.
     */
    public get onValidationStateChanged(): ValidationStateChangedHandler | null {
        return this.resolveCallback<ValidationStateChangedHandler>(this.config.onValidationStateChanged, 'onValidationStateChanged');
    }

    /**
     * Called when ValueHost's validate() function has returned.
     * Also when validation is cleared or ExternalIssuesFound are added or removed.
     * Supplies the result to the callback.
     * Examples: Use to notify the validation related aspects of the component to refresh, 
     * such as showing error messages and changing style sheets.
     * Use to change the disabled state of the submit button based on validity.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueHostValidationStateChanged(): ValueHostValidationStateChangedHandler | null {
        return this.resolveCallback<ValueHostValidationStateChangedHandler>(this.config.onValueHostValidationStateChanged, 'onValueHostValidationStateChanged');
    }

    //#endregion IValidationManagerCallbacks
}

type notifyValidationStateChangedWorkerHandler = (validationState : ValidationState | null, options?: ValidateOptions) => void;