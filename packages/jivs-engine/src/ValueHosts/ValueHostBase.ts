/**
 * {@inheritDoc ValueHosts/Types/ValueHost }
 * @module ValueHosts/AbstractClasses/ValueHostBase
 */
import { ValueHostName as valueHostName } from '../DataTypes/BasicTypes';
import { assertNotNull, assertWeakRefExists } from '../Utilities/ErrorHandling';
import { deepEquals, deepClone } from '../Utilities/Utilities';
import { type IValueHost, type SetValueOptions, type ValueHostInstanceState, type ValueHostConfig, toIValueHostCallbacks, ValidTypesForInstanceStateStorage } from '../Interfaces/ValueHost';
import type { IValueHostsManager, IValueHostsManagerAccessor } from '../Interfaces/ValueHostsManager';
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';
import { IValueHostGenerator } from '../Interfaces/ValueHostFactory';
import { toIDisposable } from '../Interfaces/General_Purpose';
import { LoggingLevel, LoggingCategory } from '../Interfaces/LoggerService';

/**
 * Standard implementation of IValueHost
 */
export abstract class ValueHostBase<TConfig extends ValueHostConfig, TState extends ValueHostInstanceState>
    implements IValueHost {
    constructor(valueHostsManager: IValueHostsManager, config: TConfig, state: TState) {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(config, 'config');
        assertNotNull(state, 'state');
        this._valueHostsManager = new WeakRef<IValueHostsManager>(valueHostsManager);
        this._config = config;
        this._instanceState = state;
    }
//#region IValueHostsManagerAccessor
    public get valueHostsManager(): IValueHostsManager {
        assertWeakRefExists(this._valueHostsManager, 'ValueHostManager disposed');
        return this._valueHostsManager.deref()!;
    }
    private readonly _valueHostsManager: WeakRef<IValueHostsManager>;

    //#endregion IValueHostsManagerAccessor
    
    protected get services(): IValueHostsServices
    {
        return this.valueHostsManager.services;
    }
    /**
     * Always supplied by constructor. Treat it as immutable.
     * Expected to be changed only by the caller (business logic)
     * and at that time, it must replace this instance with 
     * a new one and a new Config instance.
     */
    protected get config(): TConfig {
        return this._config;
    }
    private readonly _config: TConfig;

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        toIDisposable(this._config)?.dispose();
        (this._config as any) = undefined;
        this._instanceState = undefined!;
        (this._valueHostsManager as any) = undefined!;
    }

    //#region IValueHost
    /**
     * Provides a unique name for this ValueHost.
     * Consuming systems use this name to locate the ValueHost
     * for which they will transfer a value, via ValueHostsManager.getValueHost(this name)
     */
    public getName(): valueHostName {
        return this.config.name;
    }

    /**
     * A user friendly name for this ValueHost, to be shown in tooltips, error messages,
     * etc found in this ValueHostConfig that have the {Label} token.
     * Localization should occur when setting up the ValueHostConfig.
     */
    public getLabel(): string {
        let label = (this.config.label ?? '') as string;
        let labell10n: string | null = (this.config.labell10n ?? null) as string | null;
        if (labell10n)
            return this.services.textLocalizerService.localize(this.services.cultureService.activeCultureId, labell10n, label) ?? '';
        return label;
    }

    /**
     * Gets the native value, which is what can be written to the Model.
     * Returns undefined if the native value could not be resolved
     * from the input field/element.
     */
    public getValue(): any {
        return this.instanceState.value;
    }

    /**
     * System consumer assigns the native value to make it available
     * to most Conditions during validation.
    * @param value - Can be undefined to indicate the value could not be resolved
    * from the input field/element's value, such as inability to convert a string to a date.
    * All other values, including null and the empty string, are considered real data.
    * When undefined, IsChanged will still be changed to true unless options.Reset = true.
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
    * SkipValueChangedCallback - Skips the automatic callback setup with the 
    * OnValueChanged property.
    */
    public setValue(value: any, options?: SetValueOptions): void {
        if (!options)
            options = {};
        let oldValue: any = this.instanceState.value;   // even undefined is supported
        let changed = !deepEquals(value, oldValue);
        this.updateInstanceState((stateToUpdate) => {
            if (changed) {
                stateToUpdate.value = value;
            }
            this.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, changed, options!);
            return stateToUpdate;
        }, this);
        this.useOnValueChanged(changed, oldValue, options);
    }
    

    /**
     * Consuming system calls this when it attempts to resolve
     * the input field/element value but cannot. It identifies that the native value
     * is undefined.
     * Note this does not reset IsChanged to false without explicitly 
     * specifying options.Reset = true;
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
     */
    public setValueToUndefined(options?: SetValueOptions): void {
        this.setValue(undefined, options);
    }

    protected additionalInstanceStateUpdatesOnSetValue(stateToUpdate: TState, valueChanged: boolean, options: SetValueOptions): void
    {
        if (options.reset)
            stateToUpdate.changeCounter = 0;
        else if (valueChanged)
            stateToUpdate.changeCounter = (stateToUpdate.changeCounter ?? 0) + 1;        
    }

    protected useOnValueChanged(changed: boolean, oldValue: any, options: SetValueOptions): void
    {
        if (changed && (!options || !options.skipValueChangedCallback))
            toIValueHostCallbacks(this.valueHostsManager)?.onValueChanged?.(this, oldValue);        
    }
/**
 * A name of a data type used to lookup supporting services specific to the data type.
 * See the {@link DataTypes/Types/LookupKey | LookupKey}. Some examples: "String", "Number", "Date", "DateTime", "MonthYear"
 */    
    public getDataType(): string | null
    {
        return this.config.dataType ?? null;
    }
    /**
     * Provides a localized name for the data type when it needs to be shown to the user.
     * Since the ValueHostConfig.dataType is optional, this will end up returning the empty string,
     * unless the native value has been assigned and the DataTypeIdentifierService can figure out its lookupKey.
     */
    public getDataTypeLabel(): string
    {
        let dt = this.getDataType();
        if (!dt) {
            let value = this.getValue();
            if (value != null)  { // null or undefined
                dt = this.services.dataTypeIdentifierService.identify(value);
            }
        }
        return dt ? (this.services.textLocalizerService.getDataTypeLabel(this.services.cultureService.activeCultureId, dt) ?? '') : '';
    }

    /**
     * Determines how the validation system sees the Value in terms of editing.
     * When true, it was changed. When false, it was not.
     * The setValue()/setInputValue()/setValues() functions are the only ones to change this flag.
     * They all set it to true automatically except set it to false when the option.Reset is true.
     * The ValueHost.validate() function may skip validation of an InputValueHost when IsChanged is false,
     * depending on the options for validate. For example, calling validate immediately after loading
     * up the form, you want to avoid showing Category=Require validators. Those should appear only
     * if the user edits, or when the user attempts to submit.
     */
    public get isChanged(): boolean
    {
        return (this.instanceState.changeCounter ?? 0) > 0;
    }
    
    //#endregion IValueHost

    //#region State
    /* 
     * Current state for the associated ValueHost.
     * Only ValidationManager owns the state. This instance is a reference
     * to the value in ValidationManager.
     * InstanceState is considered immutable. If it needs to change,
     * the ValidationManager must discard the current ValueHost instance
     * and create a new one. The InstanceState contained in the ValidationManager
     * must be supplied to the new ValueHost instance to restore the state.
    */
    protected get instanceState(): TState {
        return this._instanceState;
    }
    private _instanceState: TState;

    /**
     * Use to change anything in ValueHostInstanceState without impacting the immutability 
     * of the current instance.
     * Your callback will be passed a cloned instance. Change any desired properties
     * and return that instance. It will become the new immutable value of
     * the InstanceState property.
     * If changes were made, the OnValueHostInstanceStateChanged event is fire.
     * @param updater 
     * @returns true when the state did change. false when it did not.
     */
    public updateInstanceState(updater: (stateToUpdate: TState) => TState,
        source: IValueHost): boolean {
        assertNotNull(updater, 'updater');
        let toUpdate = deepClone(this.instanceState);
        let updated = updater(toUpdate);
        if (!deepEquals(this.instanceState, updated)) {
            this._instanceState = updated;
            this.valueHostsManager.notifyValueHostInstanceStateChanged(source, updated);
            return true;
        }
        return false;
    }

/**
 * Adds a custom entry into the ValueHost's state
 * or removes it when value = undefined.
 * @param key 
 * @param value - when undefined, it removes the value from the state
 */    
    public saveIntoInstanceState(key: string, value: ValidTypesForInstanceStateStorage | undefined): void
    {
        this.updateInstanceState((stateToUpdate) => {
            if (!stateToUpdate.items)
                stateToUpdate.items = {};
            if (value !== undefined)
                stateToUpdate.items[key] = value;
            else
                delete stateToUpdate.items[key];      
            return stateToUpdate;
        }, this);

    }
/**
 * Use to retrieve a value from the state that was stored
 * with saveIntoInstanceState().
 * @param key 
 * @returns the stored value or undefined if nothing is stored.
 */
    public getFromInstanceState(key: string): ValidTypesForInstanceStateStorage | undefined
    {
        return this.instanceState.items ? this.instanceState.items[key] : undefined;
    }

    protected log(message: (()=>string) | string, logLevel: LoggingLevel, logCategory?: LoggingCategory): void
    {
        let logger = this.services.loggerService;
        if (logger.minLevel <= logLevel) {
            logger.log((typeof message === 'function') ? message() : message,
                logLevel, logCategory ?? LoggingCategory.Configuration, `${this.constructor.name} "${this.getName()}"`);
        }
        
    }

}


export abstract class ValueHostBaseGenerator implements IValueHostGenerator {
    public abstract canCreate(config: ValueHostConfig): boolean;

    public abstract create(valueHostsManager: IValueHostsManager, config: ValueHostConfig, state: ValueHostInstanceState): IValueHost;

    /**
     * Looking for changes to the ValidationConfigs to impact IssuesFound.
     * If IssuesFound did change, fix ValidationStatus for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationStatus Valid.
     * @param state 
     * @param config 
     */
    public abstract cleanupInstanceState(state: ValueHostInstanceState, config: ValueHostConfig): void;
    public createInstanceState(config: ValueHostConfig): ValueHostInstanceState {
        return {
            name: config.name,
            value: config.initialValue
        };
    }

}