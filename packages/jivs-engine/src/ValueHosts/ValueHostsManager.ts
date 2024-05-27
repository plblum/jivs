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
import type { IValidationServices } from '../Interfaces/ValidationServices';
import type { IValueHost, ValueChangedHandler, ValueHostConfig, ValueHostInstanceState, ValueHostInstanceStateChangedHandler } from '../Interfaces/ValueHost';
import { ValueHostName } from '../DataTypes/BasicTypes';
import type { IValidatableValueHostBase } from '../Interfaces/ValidatableValueHostBase';
import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';
import type { ValueHostsManagerInstanceState, IValueHostsManager, ValueHostsManagerConfig, IValueHostsManagerCallbacks, ValueHostsManagerInstanceStateChangedHandler } from '../Interfaces/ValueHostsManager';
import { InputValueChangedHandler } from '../Interfaces/InputValueHost';
import { ValidatableValueHostBase } from './ValidatableValueHostBase';
import { ValueHostsInstanceBuilder } from './ValueHostsInstanceBuilder';
import { ValueHostAccessor } from './ValueHostAccessor';
import { IValueHostAccessor } from '../Interfaces/ValueHostAccessor';
import { ICalcValueHost } from '../Interfaces/CalcValueHost';
import { IStaticValueHost } from '../Interfaces/StaticValueHost';
import { toICalcValueHost } from './CalcValueHost';
import { toIStaticValueHost } from './StaticValueHost';


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
     * }
     * ```
     */
    constructor(config: ValueHostsManagerConfig) {
        assertNotNull(config, 'config');
        assertNotNull(config.services, 'services');
        // NOTE: We don't keep the original instance of Config to avoid letting the caller edit it while in use.
        let savedServices = config.services;
        config.services = null as any; // to ignore during DeepClone
        let internalConfig = deepClone(config) as ValueHostsManagerConfig;
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
    /**
     * If the user needs to abandon this instance, they should use this to 
     * clean up active resources (like timers)
     */
    public dispose(): void
    {
    }    
    protected get config(): ValueHostsManagerConfig
    {
        return this._config;
    }
    private readonly _config: ValueHostsManagerConfig;

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
    protected get valueHosts(): IValueHostsMap {
        return this._valueHosts;
    }

    private readonly _valueHosts: IValueHostsMap = {};

    /**
     * Provides a way to enumerate through existing ValueHosts.
     * @returns A generator that yields a tuple of [valueHostName, IValueHost]
     */
    public *enumerateValueHosts(filter?: (valueHost: IValueHost) => boolean): Generator<IValueHost> {
        for (let key in this.valueHosts) {
            let vh = this.valueHosts[key];
            if (filter && !filter(vh))
                continue;
            yield vh;
        }
    }

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
     * by the caller to support recreating the ValueHostsManager in a stateless situation.
     */
    protected get instanceState(): ValueHostsManagerInstanceState {
        return this._instanceState;
    }
    private _instanceState: ValueHostsManagerInstanceState;

    /**
     * Value retained from the constructor to share with calls to addValueHost,
     * giving new ValueHost instances their last state.
     */
    private readonly _lastValueHostInstanceStates: Array<ValueHostInstanceState>;

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
     * @param config 
     * Can use fluent().static() or any ValueConfigHost.
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValueHostsManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * When null, the state supplied in the ValueHostsManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    public addValueHost(config: ValueHostConfig,
        initialState: ValueHostInstanceState | null): IValueHost {
        assertNotNull(config, 'config');

        if (!this._valueHostConfigs[config.name])
            return this.applyConfig(config, initialState);

        throw new CodingError(`Property ${config.name} already assigned.`);
    }
    /**
     * Replaces a ValueHostConfig for an already added ValueHost. 
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * @param config 
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValueHostsManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    public updateValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
        assertNotNull(config, 'config');

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
     * ValueHostsManager has correct and corresponding instances of ValueHost,
     * ValueHostConfig and ValueHostInstanceState.
     * @param config 
     * @param initialState - When not null, this ValueHost state object is used instead of an initial state.
     * It overrides any state supplied by the ValueHostsManager constructor.
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
     * Provide fluent syntax to add or replace a ValueHost.
     * Alternative to using addValueHost() and updateValueHost().
     */
    public build(): ValueHostsInstanceBuilder
    {
        return new ValueHostsInstanceBuilder(this);
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

    //#region IValueHostsManagerCallbacks
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

/**
 * All ValueHostConfigs for this ValueHostsManager.
 * Caller may pass this in via the ValueHostsManager constructor
 * or build it out via ValueHostsManager.addValueHost.
 * Each entry must have a companion in ValueHost and ValueHostInstanceState in
 * this ValueHostsManager.
 */
interface IValueHostConfigsMap {
    [valueHostName: ValueHostName]: ValueHostConfig;
}

/**
 * All InputValueHosts for the Model.
 * Each entry must have a companion in InputValueConfigs and ValueHostInstanceState
 * in this ValueHostsManager.
 */
interface IValueHostsMap {
    [valueHostName: ValueHostName]: IValueHost;
}

