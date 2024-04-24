/**
 * {@inheritDoc ValueHosts/Types/ValueHost }
 * @module ValueHosts/AbstractClasses/ValueHostBase
 */
import { ValueHostName as valueHostName } from '../DataTypes/BasicTypes';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { deepEquals, deepClone } from '../Utilities/Utilities';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import { type IValueHost, type SetValueOptions, type ValueHostState, type ValueHostConfig, toIValueHostCallbacks, ValidTypesForStateStorage } from '../Interfaces/ValueHost';
import type { IValueHostsManager, IValueHostsManagerAccessor } from '../Interfaces/ValueHostResolver';
import { IValueHostGenerator } from '../Interfaces/ValueHostFactory';

/**
 * Standard implementation of IValueHost
 */
export abstract class ValueHostBase<TConfig extends ValueHostConfig, TState extends ValueHostState>
    implements IValueHost, IValueHostsManagerAccessor {
    constructor(valueHostsManager: IValueHostsManager, config: TConfig, state: TState) {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(config, 'config');
        assertNotNull(state, 'state');
        this._valueHostsManager = valueHostsManager;
        this._config = config;
        this._state = state;
    }
//#region IValueHostsManagerAccessor
    public get valueHostsManager(): IValueHostsManager {
        return this._valueHostsManager;
    }
    private readonly _valueHostsManager: IValueHostsManager;

    //#endregion IValueHostsManagerAccessor
    
    protected get services(): IValidationServices
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
     * Use setLabel to override the ValueHostConfig value.
     */
    public getLabel(): string {
        let label = (this.getFromState('_label') ?? (this.config.label ?? '')) as string;
        let labell10n: string | null = (this.getFromState('_labell10n') ?? this.config.labell10n ?? null) as string | null;
        if (labell10n)
            return this.services.textLocalizerService.localize(this.services.activeCultureId, labell10n, label) ?? '';
        return label;
    }
    /**
     * Use to change the label and/or labell10n values. 
     * It overrides the values from ValueHostConfig.label and labell10n.
     * Use case: Business logic supplies a default values for label and labell10n which the UI needs to change.
     * The value is stored with the state.
     * @param label - If undefined, reverts to ValueHostConfig.label.
     * If null, does not make any changes.
     * @param labell10n - If undefined, reverts to ValueHostConfig.labell10n.
     * If null, does not make any changes.
     */
    public setLabel(label: string | null | undefined, labell10n?: string | null | undefined): void
    {
        if (label !== null)
            this.saveIntoState('_label', label);
        if (labell10n !== null)
            this.saveIntoState('_labell10n', labell10n);
    }

    /**
     * Gets the native value, which is what can be written to the Model.
     * Returns undefined if the native value could not be resolved
     * from the input field/element.
     */
    public getValue(): any {
        return this.state.value;
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
    * appear in the Required validator within the {ConversionError} token.
    * SkipValueChangedCallback - Skips the automatic callback setup with the 
    * OnValueChanged property.
    */
    public setValue(value: any, options?: SetValueOptions): void {
        if (!options)
            options = {};
        let oldValue: any = this.state.value;   // even undefined is supported
        let changed = !deepEquals(value, oldValue);
        this.updateState((stateToUpdate) => {
            if (changed) {
                stateToUpdate.value = value;
            }
            this.updateChangeCounterInState(stateToUpdate, changed, options!);
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
    * appear in the Required validator within the {ConversionError} token.
     */
    public setValueToUndefined(options?: SetValueOptions): void {
        this.setValue(undefined, options);
    }

    protected updateChangeCounterInState(stateToUpdate: TState, valueChanged: boolean, options: SetValueOptions): void
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
     * Determines how the validation system sees the Value in terms of editing.
     * When true, it was changed. When false, it was not.
     * The setValue()/setInputValue()/setValues() functions are the only ones to change this flag.
     * They all set it to true automatically except set it to false when the option.Reset is true.
     * The ValueHost.validate() function may skip validation of an InputValueHost when IsChanged is false,
     * depending on the options for validate. For example, calling validate immediately after loading
     * up the form, you want to avoid showing Required validators. Those should appear only
     * if the user edits, or when the user attempts to submit.
     */
    public get isChanged(): boolean
    {
        return (this.state.changeCounter ?? 0) > 0;
    }
    
    //#endregion IValueHost

    //#region State
    /* 
     * Current state for the associated ValueHost.
     * Only ValidationManager owns the state. This instance is a reference
     * to the value in ValidationManager.
     * State is considered immutable. If it needs to change,
     * the ValidationManager must discard the current ValueHost instance
     * and create a new one. The State contained in the validationManager
     * must be supplied to the new ValueHost instance to restore the state.
    */
    protected get state(): TState {
        return this._state;
    }
    private _state: TState;

    /**
     * Use to change anything in ValueHostState without impacting the immutability 
     * of the current instance.
     * Your callback will be passed a cloned instance. Change any desired properties
     * and return that instance. It will become the new immutable value of
     * the State property.
     * If changes were made, the OnValueHostStateChanged event is fire.
     * @param updater 
     * @returns true when the state did change. false when it did not.
     */
    public updateState(updater: (stateToUpdate: TState) => TState,
        source: IValueHost): boolean {
        assertNotNull(updater, 'updater');
        let toUpdate = deepClone(this.state);
        let updated = updater(toUpdate);
        if (!deepEquals(this.state, updated)) {
            this._state = updated;
            toIValueHostCallbacks(this.valueHostsManager)?.onValueHostStateChanged?.(source, updated);
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
    public saveIntoState(key: string, value: ValidTypesForStateStorage | undefined): void
    {
        this.updateState((stateToUpdate) => {
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
 * with SaveIntoState().
 * @param key 
 * @returns the stored value or undefined if nothing is stored.
 */
    public getFromState(key: string): ValidTypesForStateStorage | undefined
    {
        return this.state.items ? this.state.items[key] : undefined;
    }
}


export abstract class ValueHostBaseGenerator implements IValueHostGenerator {
    public abstract canCreate(config: ValueHostConfig): boolean;

    public abstract create(valueHostsManager: IValueHostsManager, config: ValueHostConfig, state: ValueHostState): IValueHost;

    /**
     * Looking for changes to the ValidationConfigs to impact IssuesFound.
     * If IssuesFound did change, fix ValidationStatusCode for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationStatusCode Valid.
     * @param state 
     * @param config 
     */
    public abstract cleanupState(state: ValueHostState, config: ValueHostConfig): void;
    public createState(config: ValueHostConfig): ValueHostState {
        return {
            name: config.name,
            value: config.initialValue
        };
    }

}