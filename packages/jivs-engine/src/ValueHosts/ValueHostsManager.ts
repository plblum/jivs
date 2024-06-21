/**
 * Provides a container for ValueHosts that can be used
 * when working with a model or form. It works together with IValueHostsServices.
 * Since IValueHostsServices doesn't deal with validation services,
 * ValueHostsManager doesn't support ValueHosts inheriting from
 * ValidatableValueHostBase, including Input and Property,
 * as those are built for validation.
 * IValueHostsServices does handle conditions, so it can be shared with Conditions
 * that need services.
 * @module ValueHosts/ConcreteClasses/ValueHostsManager
 */
import { deepClone, deepEquals } from '../Utilities/Utilities';
import type { IValueHost, ValueChangedHandler, ValueHostConfig, ValueHostInstanceState, ValueHostInstanceStateChangedHandler } from '../Interfaces/ValueHost';
import { ValueHostName } from '../DataTypes/BasicTypes';
import type { IValidatableValueHostBase } from '../Interfaces/ValidatableValueHostBase';
import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';
import type { ValueHostsManagerInstanceState, IValueHostsManager, ValueHostsManagerConfig, IValueHostsManagerCallbacks, ValueHostsManagerInstanceStateChangedHandler, ValueHostsManagerConfigChangedHandler } from '../Interfaces/ValueHostsManager';
import { InputValueChangedHandler } from '../Interfaces/InputValueHost';
import { ValidatableValueHostBase } from './ValidatableValueHostBase';
import { ValueHostAccessor } from './ValueHostAccessor';
import { IValueHostAccessor } from '../Interfaces/ValueHostAccessor';
import { ICalcValueHost } from '../Interfaces/CalcValueHost';
import { IStaticValueHost } from '../Interfaces/StaticValueHost';
import { toICalcValueHost } from './CalcValueHost';
import { toIStaticValueHost } from './StaticValueHost';
import { toIDisposable } from '../Interfaces/General_Purpose';
import { ValueHostsManagerConfigModifier } from './ValueHostsManagerConfigModifier';
import { ValueHostsManagerConfigBuilder } from './ValueHostsManagerConfigBuilder';
import { ManagerConfigBuilderBase } from './ManagerConfigBuilderBase';
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';


/**
 * Provides a container for ValueHosts that can be used
 * when working with a model or form. It works together with IValueHostsServices.
 * Since IValueHostsServices doesn't deal with validation services,
 * ValueHostsManager doesn't support ValueHosts inheriting from
 * ValidatableValueHostBase, including Input and Property,
 * as those are built for validation.
 * IValueHostsServices does handle conditions, so it can be shared with Conditions
 * that need services.
 * 
 * Ultimately in Jivs, it supports the ValidationManager, but can work stand-alone.
 * Conditions are passed the ValueHostsManager meaning they
 * can be used independently of validation. 
 */

export class ValueHostsManager<TState extends ValueHostsManagerInstanceState>
    implements IValueHostsManager, IValueHostsManagerCallbacks {
    /**
     * Constructor
     * @param config - Provides ValueHostsManager with numerous configuration settings.
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
     *   onInstanceStateChanged: (ValueHostsManager, state)=> { },
     *   onValueHostInstanceStateChanged: (valueHost, state) => { },
     *   onValueChanged: (valueHost, oldValue) => { },
     *   onInputValueChanged: (valueHost, oldValue) => { }
     *   onConfigChanged: (valueHost, valueHostConfig) => { }
     * }
     * ```
     */
    constructor(config: ValueHostsManagerConfig)
    constructor(builder: ValueHostsManagerConfigBuilder)
    constructor(arg1: ValueHostsManagerConfig | ManagerConfigBuilderBase<any>){
        assertNotNull(arg1, 'arg1');
        let config: ValueHostsManagerConfig;
        if (arg1 instanceof ManagerConfigBuilderBase)
            config = arg1.complete();
        else
            config = arg1 as ValueHostsManagerConfig;
        assertNotNull(config.services, 'services');
        // NOTE: We don't keep the original instance of Config to avoid letting the caller edit it while in use.
        let savedServices = config.services;
        config.services = null as any; // to ignore during DeepClone
        let internalConfig = deepClone(config) as ValueHostsManagerConfig;
        config.services = savedServices;
        internalConfig.services = savedServices;

        this._config = internalConfig;

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
    /**
     * If the user needs to abandon this instance, they should use this to 
     * clean up active resources (like timers) and to release memory that
     * would stall the garbage collector from disposing this object.
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
    }    
    protected get config(): ValueHostsManagerConfig
    {
        return this._config;
    }
    private readonly _config: ValueHostsManagerConfig;

    /**
     * Access to the ValidationServices.
     */
    public get services(): IValueHostsServices {
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
     * by the caller to support recreating the ValueHostsManager in a stateless situation.
     */
    protected get instanceState(): ValueHostsManagerInstanceState {
        return this._instanceState;
    }
    private _instanceState: ValueHostsManagerInstanceState;

    /**
     * Value retained from the constructor to share with calls to addValueHost,
     * giving new ValueHost instances their last state.
     * Updated by onValueHostInstanceStateChanged so that calls to updateValueHost
     * and mergeValueHost will start with the last state, because both
     * calls discard the value host info for that name before creating it fresh.
     */
    private readonly _lastValueHostInstanceStates: Map<string, ValueHostInstanceState> = new Map<string, ValueHostInstanceState>();

    /**
     * Use to change anything in ValueHostsManagerInstanceState without impacting the immutability 
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
     * It overrides any state supplied by the ValueHostsManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * When null, the state supplied in the ValueHostsManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    public addValueHost(config: ValueHostConfig,
        initialState: ValueHostInstanceState | null): IValueHost {
        assertNotNull(config, 'config');

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
     * It overrides any state supplied by the ValueHostsManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    public addOrUpdateValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
        assertNotNull(config, 'config');

        if (this.valueHostConfigs.has(config.name))
            return this.applyConfig(config, initialState);

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
     * It overrides any state supplied by the ValueHostsManager constructor.
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
     * ValueHostsManager has correct and corresponding instances of ValueHost,
     * ValueHostConfig and ValueHostInstanceState.
     * Any previous ValueHost and its config will be disposed.
     * @param config - a clone of this instance will be retained
     * @param initialState - When not null, this ValueHost state object is used instead of an initial state.
     * It overrides any state supplied by the ValueHostsManager constructor.
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
     * Easier way to add or modify a ValueHostConfig than using
     * addValueHost(), addOrUpdateValueHost(), or addOrMergeValueHost().
     * It returns an object whose methods allow adding ValueHosts
     * and their validators. Upon calling its apply() method,
     * your changes will be applied through the addOrMergeValueHost() function.
     * ```ts
     * let vm = new ValueHostManager(config);
     * // later when you need to modify vm:
     * let modifier = vm.startModifying();
     * // supply changes to the ValueHostConfigs
     * modifier.input('Field3').regExp(null, { enabled: false });   // let's disable the existing validator
     * // merge those changes into the ValueHostManager
     * modifier.apply(); // consider modifier disposed at this point 
     * ```
     * Any ValueHost that gets updated will have its original instance disposed.
     * Be sure to discard any reference to the ValueHost instance that you have.
     */
    public startModifying(): ValueHostsManagerConfigModifier<ValueHostsManagerConfig>
    {
        return this.services.managerConfigModifierFactory.create(this, this.valueHostConfigs) as ValueHostsManagerConfigModifier<ValueHostsManagerConfig>;
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
     * Returns the instance or null if not found or found a non-input valuehost.
     */
    public getStaticValueHost(valueHostName: ValueHostName): IStaticValueHost | null {
        return toIStaticValueHost(this.getValueHost(valueHostName));
    }
    /**
     * Retrieves the CalcValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the ICalcValueHost.name property
     * Returns the instance or null if not found or found a non-input valuehost.
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

    //#region IValueHostsManagerCallbacks

    /**
     * Use this when caching the configuration for a later creation of ValueHostsManager.
     * 
     * Called when the configuration of ValueHosts has been changed, usually
     * through the ValueHostsManagerConfigModifier.apply, or these members
     * of ValueHostsManager: addValueHost, addOrUpdateValueHost, addOrMergeValueHost,
     * discardValueHost.
     * The supplied object is a clone so modifications will not impact the ValueHostsManager.
     */    
    public get onConfigChanged(): ValueHostsManagerConfigChangedHandler | null {
        return this.config.onConfigChanged ?? null;
    }

    /**
     * Called when the ValueHostsManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call its setState function with the stateToRetain
     */
    public get onInstanceStateChanged(): ValueHostsManagerInstanceStateChangedHandler | null {
        return this.config.onInstanceStateChanged ?? null;
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
    //#endregion IValueHostsManagerCallbacks
}

