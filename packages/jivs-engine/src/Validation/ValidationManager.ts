/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your inputs and their validation rules.
 * Its methods provide validation and the results of validation.
 * @module ValidationManager/ConcreteClasses
 */
import { BusinessLogicInputValueHostType, BusinessLogicValueHostName } from '../ValueHosts/BusinessLogicInputValueHost';
import { deepClone, deepEquals } from '../Utilities/Utilities';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import type { IValueHost, ValueChangedHandler, ValueHostConfig, ValueHostInstanceState, ValueHostInstanceStateChangedHandler } from '../Interfaces/ValueHost';
import { ValueHostName } from '../DataTypes/BasicTypes';
import type { IValidatableValueHostBase, InputValueChangedHandler, ValueHostValidatedHandler } from '../Interfaces/ValidatableValueHostBase';
import { type ValidateOptions, type BusinessLogicError, type IssueFound, ValidationSnapshot } from '../Interfaces/Validation';
import { assertNotNull } from '../Utilities/ErrorHandling';
import type { ValidationManagerInstanceState, IValidationManager, ValidationManagerConfig, IValidationManagerCallbacks, ValidationManagerInstanceStateChangedHandler, ValidationManagerValidatedHandler } from '../Interfaces/ValidationManager';
import { toIInputValueHost } from '../ValueHosts/InputValueHost';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { ValidatableValueHostBase } from '../ValueHosts/ValidatableValueHostBase';
import { FluentValidatorCollector } from '../ValueHosts/Fluent';


/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your inputs and their validation rules.
 * Once setup, it has a list of ValueHost objects. Those that are InputValueHosts
 * contain validators.
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
 * create a new instance of ValidationManager, or call its addValueHost, updateValueHost,
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

export class ValidationManager<TState extends ValidationManagerInstanceState> implements IValidationManager, IValidationManagerCallbacks {
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
     *   onValidated: (validationManager, validationSnapshot)=> { },
     *   onValueHostValidated: (valueHost, valueHostValidationSnapshot) => { },
     *   onValueChanged: (valueHost, oldValue) => { },
     *   onInputValueChanged: (valueHost, oldValue) => { }
     * }
     * ```
     */
    constructor(config: ValidationManagerConfig) {
        assertNotNull(config, 'config');
        assertNotNull(config.services, 'services');
        // NOTE: We don't keep the original instance of Config to avoid letting the caller edit it while in use.
        let savedServices = config.services ?? null;
        config.services = null as any; // to ignore during DeepClone
        let internalConfig = deepClone(config) as ValidationManagerConfig;
        config.services = savedServices;
        internalConfig.services = savedServices;

        this._config = internalConfig;
        this._valueHostConfigs = {};
        this._valueHosts = {};
        this._instanceState = internalConfig.savedInstanceState ?? {};
        if (typeof this._instanceState.stateChangeCounter !== 'number')
            this._instanceState.stateChangeCounter = 0;
        this._lastValueHostInstanceStates = internalConfig.savedValueHostInstanceStates ?? [];
        let configs = internalConfig.valueHostConfigs ?? [];
        for (let item of configs) {
            this.addValueHost(item as ValueHostConfig, null);
        }
    }
    protected get config(): ValidationManagerConfig
    {
        return this._config;
    }
    private readonly _config: ValidationManagerConfig;

    /**
     * Access to the ValidationServices.
     * @internal
     * The ValidationManager and IValidationServices are crosslinked.
     * A instance of ValidationManager is passed to the IValidationServices's constructor
     * and that constructor sets this property.
     */
    public get services(): IValidationServices {
        return this._config.services!;
    }


    /**
     * ValueHosts for all ValueHostConfigs.
     * Always replace a ValueHost when the associated Config or InstanceState are changed.
     */
    protected get valueHosts(): IValueHostsMap {
        return this._valueHosts;
    }

    private readonly _valueHosts: IValueHostsMap = {};
    /**
     * ValueHostConfigs supplied by the caller (business logic).
     * Always replace a ValueHost when its Config changes.
     */
    protected get valueHostConfigs(): IValueHostConfigsMap {
        return this._valueHostConfigs;
    }
    private readonly _valueHostConfigs: IValueHostConfigsMap = {};

    /**
     * ValueHostInstanceStates and more.
     * A copy of this is expected to be retained (redux/localstorage/etc)
     * by the caller to support recreating the ValidationManager in a stateless situation.
     */
    protected get instanceState(): ValidationManagerInstanceState {
        return this._instanceState;
    }
    private _instanceState: ValidationManagerInstanceState;

    /**
     * Value retained from the constructor to share with calls to addValueHost,
     * giving new ValueHost instances their last state.
     */
    private readonly _lastValueHostInstanceStates: Array<ValueHostInstanceState>;

    /**
     * Use to change anything in ValidationManagerInstanceState without impacting the immutability 
     * of the current instance.
     * Your callback will be passed a cloned instance. Change any desired properties
     * and return that instance. It will become the new immutable value of
     * the instanceState property.
     * @param updater - Your function to change and return a state instance.
     * @returns true when the state did change. false when it did not.
     */
    public updateInstanceState(updater: (stateToUpdate: TState) => TState): boolean {
        assertNotNull(updater, 'updater');
        let toUpdate = deepClone(this.instanceState);
        let updated = updater(toUpdate);
        if (!deepEquals(this.instanceState, updated)) {
            updated.stateChangeCounter = typeof updated.stateChangeCounter === 'number' ? updated.stateChangeCounter + 1 : 0;
            this._instanceState = updated;
            this.onInstanceStateChanged?.(this, updated);
            return true;
        }
        return false;
    }

    /**
     * Adds a ValueHostConfig for a ValueHost not previously added. 
     * Does not trigger any notifications.
     * Exception when the same ValueHostConfig.name already exists.
     * @param config 
     * Can use fluent().static() or any ValueConfigHost.
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * When null, the state supplied in the ValidationManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    public addValueHost(config: ValueHostConfig,
        initialState: ValueHostInstanceState | null): IValueHost;
    /**
     * Adds a ValueHostConfig for an InputValueHost not previously added. 
     * Expects fluent syntax where the first parameter starts with
     * fluent().input() followed by chained validation rules.
     * Does not trigger any notifications.
     * Exception when the same ValueHostConfig.name already exists.
     * @param fluentCollector
     * Pass in `fluent().input("valueHostName"[, parameters]).validator().validator()`. 
     * @param initialState
     * When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * When null, the state supplied in the ValidationManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    public addValueHost(fluentCollector: FluentValidatorCollector,
        initialState: ValueHostInstanceState | null): IValueHost;
    public addValueHost(arg1: ValueHostConfig | FluentValidatorCollector,
        initialState: ValueHostInstanceState | null): IValueHost {
        assertNotNull(arg1, 'arg1');
        let config: ValueHostConfig = arg1 instanceof FluentValidatorCollector ?
            arg1.parentConfig : arg1;
        if (!this._valueHostConfigs[config.name])
            return this.applyConfig(config, initialState);

        throw new Error(`Property ${config.name} already assigned.`);
    }
    /**
     * Replaces a ValueHostConfig for an already added ValueHost. 
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * @param config 
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    public updateValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;
    /**
     * Replaces a ValueHostConfig for an already added ValueHost. 
     * Does not trigger any notifications.
     * Expects fluent syntax where the first parameter starts with
     * fluent().input() followed by chained validation rules.
     * If the name isn't found, it will be added.
     * @param collector 
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    public updateValueHost(collector: FluentValidatorCollector, initialState: ValueHostInstanceState | null): IValueHost;
    public updateValueHost(arg1: ValueHostConfig | FluentValidatorCollector, initialState: ValueHostInstanceState | null): IValueHost {
        assertNotNull(arg1, 'arg');
        let config: ValueHostConfig = arg1 instanceof FluentValidatorCollector ?
            arg1.parentConfig : arg1;

        if (this._valueHostConfigs[config.name])
            return this.applyConfig(config, initialState);

        return this.addValueHost(config, initialState);
    }
    /**
     * Discards a ValueHost. 
     * Does not trigger any notifications.
     * @param valueHostName 
     */
    public discardValueHost(valueHostName: ValueHostName): void {
        assertNotNull(valueHostName, 'valueHostName');
        if (this._valueHostConfigs[valueHostName]) {
            delete this._valueHosts[valueHostName];
            delete this._valueHostConfigs[valueHostName];
            if (this._lastValueHostInstanceStates)
            {
                let pos = this._lastValueHostInstanceStates.findIndex((state) => state.name === valueHostName);
                if (pos > -1)
                    this._lastValueHostInstanceStates.splice(pos, 1);
            }
        }
    }
    /**
     * Creates the IValueHost based on the config and ensures
     * ValidationManager has correct and corresponding instances of ValueHost,
     * ValueHostConfig and ValueHostInstanceState.
     * @param config 
     * @param initialState - When not null, this ValueHost state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * @returns 
     */
    protected applyConfig(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
        let factory = this.services.valueHostFactory; // functions in here throw exceptions if config is unsupported
        let state: ValueHostInstanceState | undefined = undefined;
        let existingState = initialState;
        let defaultState = factory.createInstanceState(config);

        if (!existingState && this._lastValueHostInstanceStates)
            existingState = this._lastValueHostInstanceStates.find((state) => state.name === config.name) ?? null;
        if (existingState) {
            let cleanedState = deepClone(existingState) as ValueHostInstanceState;  // clone to allow changes during Cleanup
            factory.cleanupInstanceState(cleanedState, config);
            // User may have supplied the state without
            // all of the properties we normally use.
            // Ensure all properties defined by createInstanceState() exist, even if their value is undefined
            // so that we have consistency. 
            state = { ...defaultState, ...cleanedState };
        }
        else
            state = defaultState;
        let vh = factory.create(this, config, state);

        this._valueHosts[config.name] = vh;
        this._valueHostConfigs[config.name] = config;
        return vh;
    }

    /**
     * Retrieves the ValueHost associated with valueHostName
     * @param valueHostName - Matches to the IValueHost.name property
     * Returns the instance or null if not found.
     */
    public getValueHost(valueHostName: ValueHostName): IValueHost | null {
        return this._valueHosts[valueHostName] ?? null;
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
     * Upon changing the value of a ValueHost, other ValueHosts need to know. 
     * They may have Conditions that take the changed ValueHost into account and
     * will want to revalidate or set up a state to force revalidation.
     * This goes through those ValueHosts and notifies them.
     */
    public notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostName, revalidate: boolean): void {
        for (let ivh of this.inputValueHost())
            if (ivh.getName() !== valueHostIdThatChanged)
                ivh.otherValueHostChangedNotification(valueHostIdThatChanged, revalidate);
    }

    protected * inputValueHost(): Generator<IValidatableValueHostBase> {
        for (let key in this._valueHosts) {
            let vh = this._valueHosts[key];
            if (vh instanceof ValidatableValueHostBase)
                yield vh;
        }
    }

    /**
     * Runs validation against all validatable ValueHosts, except those that do not
     * match the validation group supplied in options.
     * Updates this ValueHost's InstanceState and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * @returns The ValidationSnapshot object, which packages several key
     * pieces of information: isValid, doNotSaveNativeValues, and issues found.
     */
    public validate(options?: ValidateOptions): ValidationSnapshot
    {
        if (!options)
            options = {};

        for (let vh of this.inputValueHost()) {
            vh.validate(options);   // the result is also registered in the vh and retrieved when building ValidationSnapshot
        }
        let snapshot = this.createValidationSnapshot(options);
        this.invokeOnValidated(options, snapshot);
        return snapshot;
    }

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    public clearValidation(options?: ValidateOptions): boolean {
        let changed = false;
        for (let vh of this.inputValueHost()) {
            if (vh.clearValidation(options))
                changed = true;
        }
        if (changed)
            this.invokeOnValidated(options);
        return changed;
    }

    protected createValidationSnapshot(options?: ValidateOptions): ValidationSnapshot
    {
        return {
            isValid: this.isValid,
            doNotSaveNativeValues: this.doNotSaveNativeValues(),
            issuesFound: this.getIssuesFound(options ? options.group : undefined),
            asyncProcessing: this.asyncProcessing
        };
    }
    /**
     * Helper to call onValueHostValidated due to a change in the state of any validators
     * or BusinessLogicErrors.
     */
    protected invokeOnValidated(options?: ValidateOptions, validationSnapshot? : ValidationSnapshot): void
    {
        if (!options || !options.omitCallback)
            this.onValidated?.(this, validationSnapshot ?? this.createValidationSnapshot(options));
    }


    /**
     * When true, the current state of validation does not know of any errors. 
     * However, there are other factors to consider: 
     * there may be warning issues found (in IssuesFound),
     * an async validator is still running,
     * validator evaluated as Undetermined.
     * So check @link doNotSaveNativeValues|doNotSaveNativeValues()  as the ultimate guide to saving.
     * When false, there is at least one validation error.
     */
    public get isValid(): boolean {
        for (let vh of this.inputValueHost())
            if (!vh.isValid)
                return false;
        return true;
    }
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to validate(). (It does not run validate().)
     * True when at least one ValueHost's ValidationStatusCode is 
     * Invalid or ValueChangedButUnvalidated
     */
    public doNotSaveNativeValues(): boolean {
        for (let vh of this.inputValueHost()) {
            if (vh.doNotSaveNativeValue())
                return true;
        }
        return false;
    }
    /**
     * When true, an async Validator is running in any ValueHost
     */
    public get asyncProcessing(): boolean
    {
        for (let vh of this.inputValueHost()) {
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
     * Internally, a BusinessLogicInputValueHost is added to the list of ValueHosts to hold any
     * error that lacks an associatedValueHostName.
     * @param errors - A list of business logic errors to show or null to indicate no errors.
     * @param options - Only considers the omitCallback option.
     * @returns When true, the validation snapshot has changed.
     */
    public setBusinessLogicErrors(errors: Array<BusinessLogicError> | null, options?: ValidateOptions): boolean {
        let changed = false;
        for (let vh of this.inputValueHost()) {
            if (vh.clearBusinessLogicErrors())
                changed = true;
        }
        if (errors)
            for (let error of errors) {
                let vh = this.getValueHost(error.associatedValueHostName ?? BusinessLogicValueHostName);
                if (!vh && !error.associatedValueHostName) {
                    vh = this.addValueHost({
                        valueHostType: BusinessLogicInputValueHostType,
                        label: '*',
                        name: BusinessLogicValueHostName
                    }, null);
                }
                if (vh instanceof ValidatableValueHostBase)
                    if (vh.setBusinessLogicError(error, options))
                        changed = true;
            }
        if (changed)
            this.invokeOnValidated(options);
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
        for (let vh of this.inputValueHost()) {
            let vhIssues = vh.getIssuesFound(group);
            if (vhIssues)
                list = list.concat(vhIssues);
        }
        return list.length ? list : null;
    }
    
    //#region IValidationManagerCallbacks
    /**
     * Called when the ValidationManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call its setState function with the stateToRetain
     */
    public get onInstanceStateChanged(): ValidationManagerInstanceStateChangedHandler | null {
        return this.config.onInstanceStateChanged ?? null;
    }
    /**
     * Called when ValidationManager's validate() function has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the Validation Summary widget(s) to refresh.
     * Use to change the disabled state of the submit button based on validity.
     */
    public get onValidated(): ValidationManagerValidatedHandler | null {
        return this.config.onValidated ?? null;
    }
    /**
     * Called when any ValueHost had its ValueHostInstanceState changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setValueHostInstanceState() with the stateToRetain.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueHostInstanceStateChanged(): ValueHostInstanceStateChangedHandler | null {
        return this.config.onValueHostInstanceStateChanged ?? null;
    }
    /**
     * Called when ValueHost's validate() function has returned.
     * Also when validation is cleared or BusinessLogicErrors are added or removed.
     * Supplies the result to the callback.
     * Examples: Use to notify the validation related aspects of the component to refresh, 
     * such as showing error messages and changing style sheets.
     * Use to change the disabled state of the submit button based on validity.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueHostValidated(): ValueHostValidatedHandler | null {
        return this.config.onValueHostValidated ?? null;
    }
    /**
     * Called when the ValueHost's Value property has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueChanged(): ValueChangedHandler | null {
        return this.config.onValueChanged ?? null;
    }
    /**
     * Called when the InputValueHost's InputValue property has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual InputValueHosts.
     * Here, it aggregates all InputValueHost notifications.
     */
    public get onInputValueChanged(): InputValueChangedHandler | null {
        return this.config.onInputValueChanged ?? null;
    }
    //#endregion IValidationManagerCallbacks
}

/**
 * All ValueHostConfigs for this ValidationManager.
 * Caller may pass this in via the ValidationManager constructor
 * or build it out via ValidationManager.addValueHost.
 * Each entry must have a companion in ValueHost and ValueHostInstanceState in
 * this ValidationManager.
 */
interface IValueHostConfigsMap {
    [valueHostName: ValueHostName]: ValueHostConfig;
}

/**
 * All InputValueHosts for the Model.
 * Each entry must have a companion in InputValueConfigs and ValueHostInstanceState
 * in this ValidationManager.
 */
interface IValueHostsMap {
    [valueHostName: ValueHostName]: IValueHost;
}

