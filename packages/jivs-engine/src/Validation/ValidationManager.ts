/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your fields and their validation rules.
 * Its methods provide validation and the results of validation.
 * @module ValidationManager/ConcreteClasses
 */
import { ModelValidatorsValueHostType, ModelValidatorsValueHostName } from '../ValueHosts/ModelValidatorsValueHost';
import { ValueHostName } from '../DataTypes/BasicTypes';
import type { IValidatableValueHostBase, ValueHostValidationStateChangedHandler } from '../Interfaces/ValidatableValueHostBase';
import { type ValidateOptions, type IssueFound, ValidationState } from '../Interfaces/Validation';
import { type ValidationManagerInstanceState, type IValidationManager, type ValidationManagerConfig, type IValidationManagerCallbacks, type ValidationStateChangedHandler, defaultNotifyValidationStateChangedDelay, ValidationManagerConfigChangedHandler, ValidationManagerInstanceStateChangedHandler } from '../Interfaces/ValidationManager';
import { ValidatableValueHostBase } from '../ValueHosts/ValidatableValueHostBase';
import { Debouncer } from '../Utilities/Debounce';
import { IFieldValueHost, TextValueChangedHandler } from '../Interfaces/FieldValueHost';
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { toIFieldValueHost } from '../ValueHosts/FieldValueHost';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { LoggerFacade } from '../Utilities/LoggerFacade';
import { IValueHost, ValueChangedHandler, ValueHostConfig, ValueHostInstanceState, ValueHostInstanceStateChangedHandler } from '../Interfaces/ValueHost';
import { ICalcValueHost } from '../Interfaces/CalcValueHost';
import { toIDisposable } from '../Interfaces/General_Purpose';
import { IStaticValueHost } from '../Interfaces/StaticValueHost';
import { IValueHostAccessor } from '../Interfaces/ValueHostAccessor';
import { assertNotNull, CodingError } from '../Utilities/ErrorHandling';
import { deepClone, deepEquals } from '../Utilities/Utilities';
import { toICalcValueHost } from '../ValueHosts/CalcValueHost';
import { toIStaticValueHost } from '../ValueHosts/StaticValueHost';
import { ValueHostAccessor } from '../ValueHosts/ValueHostAccessor';


/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your fields and their validation rules.
 * Once setup, it keeps a list of ValueHost objects that represent the elements of your model
 * or form, even if they don't need validation.
 * 
 * Configs are interfaces you use with plain objects to fashion them into 
 * ValidationManager's configuration. ValueHostConfig describes a ValueHost.
 * FieldValueHostConfig describes an FieldValueHost (which supports validation).
 * An FieldValueHost takes ValidatorConfigs to fashion its list of Validators.
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
 *   through all eligible FieldValueHosts.
 * - Report a list of Issues Found for an individual UI element.
 * - Report a list of Issues Found for the entire system for a UI 
 *   element often known as "Validation Summary".
 * 
 * Notice that this class does not know anything about consuming system.
 * As a result depends on the consuming system to transfer values between
 * the UI and the ValueHosts. Auxillary Jivs libraries may handle this.
 */

export class ValidationManager<TState extends ValidationManagerInstanceState = ValidationManagerInstanceState>
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
     *   onTextValueChanged: (valueHost, oldValue) => { }
     *   onConfigChanged: (valueHost, valueHostConfig) => { }
     * }
     * ```
     */
    constructor(config: ValidationManagerConfig){
        assertNotNull(config, 'config');
        assertNotNull(config.services, 'services');
        // NOTE: We don't keep the original instance of Config to avoid letting the caller edit it while in use.
        // let savedServices = config.services;
        // config.services = null as any; // to ignore during DeepClone
        // let internalConfig = deepClone(config) as ValidationManagerConfig;
        // config.services = savedServices;
        // internalConfig.services = savedServices;

        // this._config = internalConfig;
        let internalConfig = this._config = ValidationManager.safeConfigClone(config);

        this._instanceState = internalConfig.savedInstanceState ?? {};
        if (typeof this._instanceState.stateChangeCounter !== 'number')
            this._instanceState.stateChangeCounter = 0;
        // There may be valuehostinstancesstates that do not have an associated ValueHostConfig.
        // This allows for calling addValueHost manually later and the new ValueHost will
        // get attached to its instance state.
        if (internalConfig.savedValueHostInstanceStates)
            internalConfig.savedValueHostInstanceStates.forEach((instanceState) =>
                this._lastValueHostInstanceStates.set(instanceState.name, instanceState));

        let configs = internalConfig.valueHostConfigs ?? [];
        
        let saveOnChangeConfig = this.onConfigChanged;
        this._config.onConfigChanged = null;
        for (let item of configs) {
            this.addValueHost(item as ValueHostConfig, null);   // will get its instance state from _lastValueHostInstanceStates
        }
        this._config.onConfigChanged = saveOnChangeConfig;
    }

    public static safeConfigClone(config: ValidationManagerConfig): ValidationManagerConfig {
        // NOTE: We don't keep the original instance of Config to avoid letting the caller edit it while in use.
        let savedServices = config.services;
        config.services = null as any; // to ignore during DeepClone
        let internalConfig = deepClone(config) as ValidationManagerConfig;
        config.services = savedServices;
        internalConfig.services = savedServices;
        return internalConfig;
    }

    /**
     * If the user needs to abandon this instance, they should use this to 
     * clean up active resources (like timers)
     */
    public dispose(): void
    {
        this.valueHosts.forEach((vh) => vh.dispose());
        this.valueHosts.clear();
        (this._valueHosts as any) = undefined;

        this.valueHostConfigs.forEach((vhConfig) => toIDisposable(vhConfig)?.dispose());
        this.valueHostConfigs.clear();
        (this._valueHostConfigs as any) = undefined;

        toIDisposable(this._config)?.dispose();        
        (this._config as any) = undefined;

        this._instanceState = undefined!;
        (this._lastValueHostInstanceStates as any) = undefined;

        this._vh?.dispose();
        this._vh = undefined;
        (this._logger as any) = undefined!;
        if (this._debounceVHValidated)
            this._debounceVHValidated.dispose();
        this._debounceVHValidated = null;
    }
    /**
     * Provides an API for logging, sending entries to the loggerService.
     */
    protected get logger(): LoggerFacade
    {
        if (!this._logger)
            this._logger = new LoggerFacade(this.services.loggerService,
                'Manager', this, null, false);
        return this._logger;
    }
    private _logger: LoggerFacade | null = null;    

    protected get config(): ValidationManagerConfig
    {
        return this._config;
    }
    private readonly _config: ValidationManagerConfig;

    /**
     * Access to the ValidationServices.
     */
    public get services(): IValidationServices {
        return this._config.services!;
    }
    /**
     * ValueHosts for all ValueHostConfigs.
     * Always replace a ValueHost when the associated Config or InstanceState are changed.
     */
    protected get valueHosts(): Map<string, IValueHost> {
        return this._valueHosts;
    }
    /**
     * This is the only place we expect to find strong references to ValueHosts
     * within a Manager. Use WeakRef elsewhere to point to the same instances.
     */
    private readonly _valueHosts: Map<string, IValueHost> = new Map<string, IValueHost>();

    /**
     * Provides a way to enumerate through existing ValueHosts.
     * @returns A generator that yields a tuple of [valueHostName, IValueHost]
     */
    public *enumerateValueHosts(filter?: (valueHost: IValueHost) => boolean): Generator<IValueHost> {
        for (let [name, vh] of this.valueHosts) {
            if (filter && !filter(vh))
                continue;
            yield vh;
        }
    }

    /**
     * ValueHostConfigs supplied by the caller (business logic).
     * Always replace a ValueHost when its Config changes.
     */
    protected get valueHostConfigs(): Map<string, ValueHostConfig> {
        return this._valueHostConfigs;
    }
    private readonly _valueHostConfigs: Map<string, ValueHostConfig> = new Map<string, ValueHostConfig>();

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
     * Updated by onValueHostInstanceStateChanged so that calls to updateValueHost
     * and mergeValueHost will start with the last state, because both
     * calls discard the value host info for that name before creating it fresh.
     */
    private readonly _lastValueHostInstanceStates: Map<string, ValueHostInstanceState> = new Map<string, ValueHostInstanceState>();

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
     * @param config - a clone of this instance will be retained.
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * When null, the state supplied in the ValidationManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    public addValueHost(config: ValueHostConfig,
        initialState: ValueHostInstanceState | null): IValueHost {
        assertNotNull(config, 'config');
        this.logger.message(LoggingLevel.Debug, ()=> `addValueHost(${config.name})`);

        if (!this.valueHostConfigs.has(config.name)) {
            if (initialState) // need to lock in the initial state for a later update
                this._lastValueHostInstanceStates.set(initialState.name, initialState);
            return this.applyConfig(config, initialState);
        }

        throw new CodingError(`Property ${config.name} already assigned.`);
    }
    /**
     * Replaces a ValueHostConfig for an already added ValueHost. It does not merge.
     * If merging is required, use the ValueHostConfigMergeService first.
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * Any previous ValueHost and its config will be disposed.
     * Be sure to discard any reference to the ValueHost instance that you have.
     * @param config - a clone of this instance will be retained.
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    public addOrUpdateValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
        assertNotNull(config, 'config');

        if (this.valueHostConfigs.has(config.name)) {
            this.logger.message(LoggingLevel.Debug, ()=> `addOrUpdateValueHost(${config.name})`);
            return this.applyConfig(config, initialState);
        }
        return this.addValueHost(config, initialState);
    }
    /**
     * Replaces a ValueHostConfig for an already added ValueHost.
     * It merges the new config with the existing one using the ValueHostConfigMergeService.
     * The goal is to protect important business logic settings while allowing the UI
     * to inject new property values where appropriate.
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * Any previous ValueHost and its config will be disposed.
     * Be sure to discard any reference to the ValueHost instance that you have.
     * @param config - a clone of this instance will be retained.
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    public addOrMergeValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost
    {
        assertNotNull(config, 'config');

        if (this.valueHostConfigs.has(config.name)) {
            let destinations: Array<ValueHostConfig> = [];
            this.valueHostConfigs.forEach((vhConfig) => destinations.push(vhConfig));
            let vhcms = this.services.valueHostConfigMergeService;
            let destinationToMerge = vhcms.identifyValueHostConflict(config, destinations);
            if (destinationToMerge)
            {
                destinationToMerge = deepClone(destinationToMerge) as ValueHostConfig; // don't want to let merge change the config already in use.
                vhcms.merge(config, destinationToMerge);
                return this.applyConfig(destinationToMerge, initialState);
            }
            else // defensive. Should always find destinationToMerge if it was in _valueHostConfigs
                /* istanbul ignore next */
                return this.applyConfig(config, initialState);
        }
        return this.addValueHost(config, initialState);
    }
    /**
     * Discards a ValueHost. 
     * Does not trigger any notifications.
     * @param valueHostName 
     */
    public discardValueHost(valueHostName: ValueHostName): void {
        assertNotNull(valueHostName, 'valueHostName');
        if (this.valueHostConfigs.has(valueHostName)) {
            this.valueHosts.get(valueHostName)!.dispose();  // this also calls valueHostConfigs.dispose if setup
            this.valueHosts.delete(valueHostName);

            toIDisposable(this.valueHostConfigs.get(valueHostName))?.dispose();
            this.valueHostConfigs.delete(valueHostName);

            this._lastValueHostInstanceStates.delete(valueHostName);

            this.invokeOnConfigChanged();
        }
    }
    /**
     * Creates the IValueHost based on the config and ensures
     * ValidationManager has correct and corresponding instances of ValueHost,
     * ValueHostConfig and ValueHostInstanceState.
     * Any previous ValueHost and its config will be disposed.
     * @param config - a clone of this instance will be retained
     * @param initialState - When not null, this ValueHost state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * @returns 
     */
    protected applyConfig(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
        config = deepClone(config); // our own private copy
        let factory = this.services.valueHostFactory; // functions in here throw exceptions if config is unsupported
        let state: ValueHostInstanceState | undefined = undefined;
        let existingState = initialState;
        let defaultState = factory.createInstanceState(config);

        if (!existingState)
            existingState = this._lastValueHostInstanceStates.get(config.name) ?? null;
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
        this.discardValueHost(config.name);
        
        let vh = factory.create(this, config, state);

        this.valueHosts.set(config.name, vh);
        this.valueHostConfigs.set(config.name, config);
        this.invokeOnConfigChanged();
        return vh;
    }
/**
 * Executes the onConfigChanged callback if it is setup.
 * Sends cloned copies of all ValueHostConfigs.
 */
    protected invokeOnConfigChanged(): void
    {
        if (this.onConfigChanged)
        {
            let valueHostConfigs: Array<ValueHostConfig> = [];
            this.valueHostConfigs.forEach((vhConfig) => valueHostConfigs.push(deepClone(vhConfig)));

            this.onConfigChanged(this, valueHostConfigs);
        }
    }
    /**
     * Retrieves the ValueHost associated with valueHostName
     * @param valueHostName - Matches to the IValueHost.name property
     * Returns the instance or null if not found.
     */
    public getValueHost(valueHostName: ValueHostName): IValueHost | null {
        return this.valueHosts.get(valueHostName) ?? null;
    }

    /**
     * Retrieves the StaticValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the IStaticValueHost.name property
     * Returns the instance or null if not found or found a non-field valuehost.
     */
    public getStaticValueHost(valueHostName: ValueHostName): IStaticValueHost | null {
        return toIStaticValueHost(this.getValueHost(valueHostName));
    }
    /**
     * Retrieves the CalcValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the ICalcValueHost.name property
     * Returns the instance or null if not found or found a non-field valuehost.
     */
    public getCalcValueHost(valueHostName: ValueHostName): ICalcValueHost | null {
        return toICalcValueHost(this.getValueHost(valueHostName));
    }
    //FYI: other getValueHosts are built around validation and declared in IValidationManager

    /**
     * Alternative to getValueHost that returns strongly typed valuehosts 
     * in a shortened syntax. Always throws exceptions if the value host requested
     * is unknown or not the expected type.
     */
    public get vh(): IValueHostAccessor
    {
        if (!this._vh)
            this._vh = new ValueHostAccessor(this);
        return this._vh;
    }
    private _vh: IValueHostAccessor | undefined;
    
    /**
     * Upon changing the value of a ValueHost, other ValueHosts need to know. 
     * They may have Conditions that take the changed ValueHost into account and
     * will want to revalidate or set up a state to force revalidation.
     * This goes through those ValueHosts and notifies them.
     */
    public notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostName, revalidate: boolean): void {
        this.logger.message(LoggingLevel.Debug, ()=> `notifyOtherValueHostsOfValueChange on ${valueHostIdThatChanged}`);        
        for (let ivh of this.validatableValueHost())
            if (ivh.getName() !== valueHostIdThatChanged)
                ivh.otherValueHostChangedNotification(valueHostIdThatChanged, revalidate);
    }

    /**
     * Report that a ValueHost had its instance state changed.
     * Invokes onValueHostInstanceStateChanged if setup.
     * @param valueHost 
     * @param instanceState 
     */
    public notifyValueHostInstanceStateChanged(valueHost: IValueHost, instanceState: ValueHostInstanceState): void
    {
        this._lastValueHostInstanceStates.set(instanceState.name, instanceState);
        this.onValueHostInstanceStateChanged?.(valueHost, instanceState);
    }

    protected * validatableValueHost(): Generator<IValidatableValueHostBase> {
        for (let [name, vh] of this.valueHosts) {
            if (vh instanceof ValidatableValueHostBase)
                yield vh;
        }
    }

    //#region IValidationManagerCallbacks
    protected resolveCallback<T>(callback: T | null | undefined, name: string): T | null {
        if (callback) {
            this.logger.message(LoggingLevel.Info, ()=> name);            
            return callback;
        }
        return null;
    }
    /**
     * Use this when caching the configuration for a later creation of ValidationManager.
     * 
     * Called when the configuration of ValueHosts has been changed by these members
     * of ValidationManager: addValueHost, addOrUpdateValueHost, addOrMergeValueHost,
     * discardValueHost.
     * The supplied object is a clone so modifications will not impact the ValidationManager.
     */    
    public get onConfigChanged(): ValidationManagerConfigChangedHandler | null {

        return this.resolveCallback<ValidationManagerConfigChangedHandler>(this.config.onConfigChanged, 'onConfigChanged');
    }

    /**
     * Called when the ValidationManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call its setState function with the stateToRetain
     */
    public get onInstanceStateChanged(): ValidationManagerInstanceStateChangedHandler | null {
        return this.resolveCallback<ValidationManagerInstanceStateChangedHandler>(this.config.onInstanceStateChanged, 'onInstanceStateChanged');
    }

    /**
     * Called when any ValueHost had its ValueHostInstanceState changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setValueHostInstanceState() with the stateToRetain.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueHostInstanceStateChanged(): ValueHostInstanceStateChangedHandler | null {
        return this.resolveCallback<ValueHostInstanceStateChangedHandler>(this.config.onValueHostInstanceStateChanged, 'onValueHostInstanceStateChanged');
    }

    /**
     * Called when the ValueHost's Value property has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueChanged(): ValueChangedHandler | null {
        return this.resolveCallback<ValueChangedHandler>(this.config.onValueChanged, 'onValueChanged');
    }
    /**
     * Called when the FieldValueHost's text value has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual FieldValueHosts.
     * Here, it aggregates all FieldValueHost notifications.
     */
    public get onTextValueChanged(): TextValueChangedHandler | null {
        return this.resolveCallback<TextValueChangedHandler>(this.config.onTextValueChanged, 'onTextValueChanged');
    }
    //#endregion IValidationManagerCallbacks
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
     * Retrieves the FieldValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the IFieldValueHost.name property
     * Returns the instance or null if not found or found a non-field valuehost.
     */
    public getFieldValueHost(valueHostName: ValueHostName): IFieldValueHost | null {
        return toIFieldValueHost(this.getValueHost(valueHostName));
    }
    // /**
    //  * Retrieves the PropertyValueHost of the identified by valueHostName
    //  * @param valueHostName - Matches to the IPropertyValueHost.name property
    //  * Returns the instance or null if not found or found a non-Property valuehost.
    //  */
    // public getPropertyValueHost(valueHostName: ValueHostName): IPropertyValueHost | null {
    //     return toIPropertyValueHost(this.getValueHost(valueHostName));
    // }    
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
            isValid: this.calculateIsValid(options),
            doNotSave: this.calculateDoNotSave(options),
            issuesFound: this.getIssuesFound(options ? options.group : undefined),
            asyncProcessing: this.calculateAsyncProcessing(options)
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
        return this.calculateIsValid();
    }

    protected calculateIsValid(options?: ValidateOptions): boolean {
        for (let vh of this.validatableValueHost())
            if (vh.groupCheck(options) && !vh.isValid)
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
        return this.calculateDoNotSave();
    }

    public calculateDoNotSave(options?: ValidateOptions): boolean {
        for (let vh of this.validatableValueHost())
            if (vh.groupCheck(options) && vh.doNotSave)
                return true;
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

    protected calculateAsyncProcessing(options?: ValidateOptions): boolean {
        for (let vh of this.validatableValueHost())
            if (vh.groupCheck(options) && vh.asyncProcessing)
                return true;
        return false;
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
     * @param determinedLocally - when true, your app's code figured out this issue and the error will be
     * revised by the next local validation. When false, for everything else. Allows post validation errors
     * generated by a server to avoid blocking the next attempt to save. Internally sets IssueFound.doNotSave to 
     * this value.
     * @param options - Only considers the skipCallback option.
     * @returns when true, the validation snapshot has changed.
     */
    public addExternalIssuesFound(errors: Array<IssueFound> | null, determinedLocally: boolean, options?: ValidateOptions): boolean
    {
        let changed = false;
        for (let vh of this.validatableValueHost()) {
            if (vh.clearExternalIssuesFound()) // no options here because changed = true results in notifyValidationStateChanged later
                changed = true;
        }
        if (errors)
            for (let error of errors) {
                if (this.addExternalIssueFound(error, determinedLocally, options))
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
     * @param determinedLocally - when true, your app's code figured out this issue and the error will be
     * revised by the next local validation. When false, for everything else. Allows post validation errors
     * generated by a server to avoid blocking the next attempt to save. Internally sets IssueFound.doNotSave to 
     * this value.
     * @returns when true, the validation snapshot has changed.
     */
    public addExternalIssueFound(error: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean {
        let changed = false;
        if (!error.valueHostName)
            error.valueHostName = ModelValidatorsValueHostName;
        let vh = this.getValueHost(error.valueHostName);
        // disabled reroutes to ModelValidatorsValueHost so we can still show it somewhere
        if (vh && !vh.isEnabled()) {
            vh = null;
            this.logger.message(LoggingLevel.Warn, () => `ValueHost ${error.valueHostName} is disabled. Rerouting error to ${ModelValidatorsValueHostName} ValueHost.`);
            error.valueHostName = ModelValidatorsValueHostName;
        }
        if (!vh) {
            vh = this.createModelValidatorsValueHost();
            if (error.valueHostName !== ModelValidatorsValueHostName) {
                this.logger.message(LoggingLevel.Warn, () => `Could not find ValueHost with name ${error.valueHostName}`);
                error.valueHostName = ModelValidatorsValueHostName;
            }
        }
            
        if (vh instanceof ValidatableValueHostBase)
            if (vh.addExternalIssueFound(error, determinedLocally, options))
                changed = true;
        return changed;
    }

    /**
     * Lists all issues found (error messages and supporting info) for a single FieldValueHost
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
    public getIssuesForField(valueHostName: ValueHostName): Array<IssueFound> | null {
        let vh = this.getValueHost(valueHostName);
        if (vh && vh instanceof ValidatableValueHostBase)
            return vh.getIssuesFound();
        return null;
    }
    /**
     * A list of all issues from all FieldValueHosts optionally for a given group.
     * Use with a Validation Summary widget and when validating the Model itself.
     * @param group - Omit or null to ignore groups. Otherwise this will match to FieldValueHosts with 
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
     * Server-side: package validation results for transfer to the client as a string.
     * The client can pass that string to fromValidationPayload to restore issue state.
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
            this.addExternalIssuesFound(externalIssues, true, { skipCallback: true }); // will clear prior external issues
        let payload = this.getIssuesFound(); // combines validator-generated IssuesFound with user-supplied External IssuesFound
        return JSON.stringify(payload);
    }

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
    public fromValidationPayload(payload: string, encode?: null | ((text: string) => string)): boolean
    {
        this.clearExternalIssuesFound({ skipCallback: true }); // clear prior validation results because we are about to set new ones, and we don't want to trigger callbacks until the end.
        let parsed: Array<IssueFound> = JSON.parse(payload);
        if (!parsed) {
            this.logger.message(LoggingLevel.Warn, () => 'No issues found in payload');
            return false;
        }
        parsed.forEach(i => {
            i.doNotSave = false; // force the consumer to make a round trip to clear these externally generated issues. We don't want them to be able to clear them on the client side without going through the server, because they may be errors that came from server-side validation that the client can't validate for itself, and we want to make sure those errors are not lost until the user has a chance to fix them and resubmit.
            if (!i.valueHostName) {
                i.valueHostName = ModelValidatorsValueHostName;
            }
            if (encode)
                i.errorMessage = encode(i.errorMessage);
        });
        if (this.addExternalIssuesFound(parsed, false))
            return true;

        return false; 
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