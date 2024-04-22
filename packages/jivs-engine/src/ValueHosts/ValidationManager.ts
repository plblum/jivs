/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your inputs and their validation rules.
 * Its methods provide validation and the results of validation.
 * @module ValidationManager/ConcreteClasses
 */
import { BusinessLogicInputValueHostType, BusinessLogicValueHostName } from './BusinessLogicInputValueHost';
import { deepClone, deepEquals } from '../Utilities/Utilities';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import type { IValueHost, ValueChangedHandler, ValueHostConfig, ValueHostState, ValueHostStateChangedHandler } from '../Interfaces/ValueHost';
import { ValueHostName } from '../DataTypes/BasicTypes';
import type { IValidatableValueHostBase, InputValueChangedHandler, ValueHostValidatedHandler } from '../Interfaces/ValidatableValueHostBase';
import { type ValidateOptions, type ValueHostValidateResult, type BusinessLogicError, type IssueFound, ValidationResult } from '../Interfaces/Validation';
import { assertNotNull } from '../Utilities/ErrorHandling';
import type { ValidationManagerState, IValidationManager, ValidationManagerConfig, IValidationManagerCallbacks, ValidationManagerStateChangedHandler, ValidationManagerValidatedHandler } from '../Interfaces/ValidationManager';
import { toIInputValueHost } from './InputValueHost';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { ValidatableValueHostBase } from './ValidatableValueHostBase';
import { FluentValidatorCollector } from './Fluent';


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
 * Notice that this class does not know anything about consuming system.
 * As a result depends on the consuming system to transfer values between
 * the UI and the ValueHosts. Auxillary Jivs libraries may handle this.
 */

export class ValidationManager<TState extends ValidationManagerState> implements IValidationManager, IValidationManagerCallbacks {
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
     *   savedState: null, // or the state object previously returned with OnStateChanged
     *   savedValueHostStates: null, // or an array of the state objects previously returned with OnValueHostStateChanged
     *   onStateChanged: (validationManager, state)=> { },
     *   onValueHostStateChanged: (valueHost, state) => { },
     *   onValidated: (validationManager, validationResults)=> { },
     *   onValueHostValidated: (valueHost, validationResult) => { },
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
        this._state = internalConfig.savedState ?? {};
        if (typeof this._state.stateChangeCounter !== 'number')
            this._state.stateChangeCounter = 0;
        this._lastValueHostStates = internalConfig.savedValueHostStates ?? [];
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
     * Always replace a ValueHost when the associated Config or State are changed.
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
     * ValueHostStates and more.
     * A copy of this is expected to be retained (redux/localstorage/etc)
     * by the caller to support recreating the ValidationManager in a stateless situation.
     */
    protected get state(): ValidationManagerState {
        return this._state;
    }
    private _state: ValidationManagerState;

    /**
     * Value retained from the constructor to share with calls to addValueHost,
     * giving new ValueHost instances their last state.
     */
    private readonly _lastValueHostStates: Array<ValueHostState>;

    /**
     * Use to change anything in ValidationManagerState without impacting the immutability 
     * of the current instance.
     * Your callback will be passed a cloned instance. Change any desired properties
     * and return that instance. It will become the new immutable value of
     * the State property.
     * @param updater - Your function to change and return a state instance.
     * @returns true when the state did change. false when it did not.
     */
    public updateState(updater: (stateToUpdate: TState) => TState): boolean {
        assertNotNull(updater, 'updater');
        let toUpdate = deepClone(this.state);
        let updated = updater(toUpdate);
        if (!deepEquals(this.state, updated)) {
            updated.stateChangeCounter = typeof updated.stateChangeCounter === 'number' ? updated.stateChangeCounter + 1 : 0;
            this._state = updated;
            this.onStateChanged?.(this, updated);
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
     * It will be run through ValueHostFactory.cleanupState() first.
     * When null, the state supplied in the ValidationManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    public addValueHost(config: ValueHostConfig,
        initialState: ValueHostState | null): IValueHost;
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
     * It will be run through ValueHostFactory.cleanupState() first.
     * When null, the state supplied in the ValidationManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    public addValueHost(fluentCollector: FluentValidatorCollector,
        initialState: ValueHostState | null): IValueHost;
    public addValueHost(arg1: ValueHostConfig | FluentValidatorCollector,
        initialState: ValueHostState | null): IValueHost {
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
     * It will be run through ValueHostFactory.cleanupState() first.
     */
    public updateValueHost(config: ValueHostConfig, initialState: ValueHostState | null): IValueHost;
    /**
     * Replaces a ValueHostConfig for an already added ValueHost. 
     * Does not trigger any notifications.
     * Expects fluent syntax where the first parameter starts with
     * fluent().input() followed by chained validation rules.
     * If the name isn't found, it will be added.
     * @param collector 
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupState() first.
     */
    public updateValueHost(collector: FluentValidatorCollector, initialState: ValueHostState | null): IValueHost;
    public updateValueHost(arg1: ValueHostConfig | FluentValidatorCollector, initialState: ValueHostState | null): IValueHost {
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
            if (this._lastValueHostStates)
            {
                let pos = this._lastValueHostStates.findIndex((state) => state.name === valueHostName);
                if (pos > -1)
                    this._lastValueHostStates.splice(pos, 1);
            }
        }
    }
    /**
     * Creates the IValueHost based on the config and ensures
     * ValidationManager has correct and corresponding instances of ValueHost,
     * ValueHostConfig and ValueHostState.
     * @param config 
     * @param initialState - When not null, this ValueHost state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupState() first.
     * @returns 
     */
    protected applyConfig(config: ValueHostConfig, initialState: ValueHostState | null): IValueHost {
        let factory = this.services.valueHostFactory; // functions in here throw exceptions if config is unsupported
        let state: ValueHostState | undefined = undefined;
        let existingState = initialState;
        let defaultState = factory.createState(config);

        if (!existingState && this._lastValueHostStates)
            existingState = this._lastValueHostStates.find((state) => state.name === config.name) ?? null;
        if (existingState) {
            let cleanedState = deepClone(existingState) as ValueHostState;  // clone to allow changes during Cleanup
            factory.cleanupState(cleanedState, config);
            // User may have supplied the state without
            // all of the properties we normally use.
            // Ensure all properties defined by createState() exist, even if their value is undefined
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
     * Runs validation against some of all validators.
     * All InputValueHosts will return their current state,
     * even if they are considered Valid.
     * Updates this ValueHost's State and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * @returns Array of ValueHostValidateResult with empty array if all are valid
     */
    public validate(options?: ValidateOptions): Array<ValueHostValidateResult> 
    {
        if (!options)
            options = {};
        let list: Array<ValueHostValidateResult> = [];

        for (let vh of this.inputValueHost()) {
            let valResult = vh.validate(options);
            if (valResult.validationResult !== ValidationResult.Undetermined ||
                valResult.issuesFound !== null)
                list.push(valResult);
        }
        if (!options || !options.omitCallback)
            this.onValidated?.(this, list);
        return list;
    }

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    public clearValidation(): void {
        for (let vh of this.inputValueHost()) {
            vh.clearValidation();
        }
    }

    /**
     * Value is setup by calling validate(). It does not run validate() itself.
     * Returns false only when any InputValueHost has a ValidationResult of Invalid. 
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using @link doNotSaveNativeValue|doNotSaveNativeValue() for more clarity.
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
     * True when ValidationResult is Invalid, AsyncProcessing, or ValueChangedButUnvalidated
     * on individual validators.
     */
    public doNotSaveNativeValue(): boolean {
        for (let vh of this.inputValueHost()) {
            if (vh.doNotSaveNativeValue())
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
     */
    public setBusinessLogicErrors(errors: Array<BusinessLogicError> | null): void {

        for (let vh of this.inputValueHost()) {
            vh.clearBusinessLogicErrors();
        }
        if (errors)
            for (let error of errors) {
                let vh = this.getValueHost(error.associatedValueHostName ?? BusinessLogicValueHostName);
                if (!vh && !error.associatedValueHostName) {
                    vh = this.addValueHost({
                        type: BusinessLogicInputValueHostType,
                        label: '*',
                        name: BusinessLogicValueHostName
                    }, null);
                }
                if (vh instanceof ValidatableValueHostBase)
                    vh.setBusinessLogicError(error);
            }
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
    public getIssuesForInput(valueHostName: ValueHostName): Array<IssueFound> {
        let vh = this.getValueHost(valueHostName);
        if (vh && vh instanceof ValidatableValueHostBase)
            return vh.getIssuesFound();
        return [];
    }
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
     * - errorCode - Identifies the validator supplying the issue.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied. 
     * - summaryMessage - The message suited for a Validation Summary widget.
     */
    public getIssuesFound(group?: string): Array<IssueFound> {
        let list: Array<IssueFound> = [];
        for (let vh of this.inputValueHost()) {
            list = list.concat(vh.getIssuesFound(group));
        }
        return list;
    }
    
    //#region IValidationManagerCallbacks
    /**
     * Called when the ValidationManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call its setState function with the stateToRetain
     */
    public get onStateChanged(): ValidationManagerStateChangedHandler | null {
        return this.config.onStateChanged ?? null;
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
     * Called when any ValueHost had its ValueHostState changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setValueHostState() with the stateToRetain.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueHostStateChanged(): ValueHostStateChangedHandler | null {
        return this.config.onValueHostStateChanged ?? null;
    }
    /**
     * Called when ValueHost's validate() function has returned.
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
 * Each entry must have a companion in ValueHost and ValueHostState in
 * this ValidationManager.
 */
interface IValueHostConfigsMap {
    [valueHostName: ValueHostName]: ValueHostConfig;
}

/**
 * All InputValueHosts for the Model.
 * Each entry must have a companion in InputValueConfigs and ValueHostState
 * in this ValidationManager.
 */
interface IValueHostsMap {
    [valueHostName: ValueHostName]: IValueHost;
}

