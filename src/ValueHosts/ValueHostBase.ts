import { ValueHostId } from "../DataTypes/BasicTypes";
import { AssertNotNull } from "../Utilities/ErrorHandling";
import { DeepEquals, DeepClone } from "../Utilities/Utilities";
import type { IValidationServices } from "../Interfaces/ValidationServices";
import type { IValueHost, ISetValueOptions, IValueHostState, IValueHostDescriptor } from "../Interfaces/ValueHost";
import type { IValueHostsManager, IValueHostsManagerAccessor } from "../Interfaces/ValueHostResolver";
import { IValueHostGenerator } from "../Interfaces/ValueHostFactory";


/**
 * Exposes values to the validation engine.
 * Please see ../Interfaces/ValueHost for an overview of ValueHosts
 */

/**
 * Standard implementation of IValueHost
 */
export abstract class ValueHostBase<TDescriptor extends IValueHostDescriptor, TState extends IValueHostState>
    implements IValueHost, IValueHostsManagerAccessor {
    constructor(valueHostsManager: IValueHostsManager, descriptor: TDescriptor, state: TState) {
        AssertNotNull(valueHostsManager, 'valueHostsManager');
        AssertNotNull(descriptor, 'descriptor');
        AssertNotNull(state, 'state');
        this._valueHostsManager = valueHostsManager;
        this._descriptor = descriptor;
        this._state = state;
    }
//#region IValueHostsManagerAccessor
    public get ValueHostsManager(): IValueHostsManager {
        return this._valueHostsManager;
    }
    private _valueHostsManager: IValueHostsManager;

    //#endregion IValueHostsManagerAccessor
    
    protected get Services(): IValidationServices
    {
        return this.ValueHostsManager.Services;
    }
    /**
     * Everything the programmer can change between invocations.
     * Designed to be stored in a React state.
     * When used in React, change its members with UpdateDescriptor
     */
    protected get Descriptor(): TDescriptor {
        return this._descriptor;
    }
    private _descriptor: TDescriptor;

    //#region IValueHost
    /**
     * Provides a unique identity for this ValueHost.
     * Consuming systems use this ID to locate the ValueHost
     * for which they will transfer a value, via ValueHostsManager.GetValueHost(this id)
     */
    public GetId(): ValueHostId {
        return this._descriptor.Id;
    }

    /**
     * A user friendly name for this ValueHost, to be shown in tooltips, error messages,
     * etc found in this ValueHostDescriptor that have the {Label} token.
     * Localization should occur when setting up the ValueHostDescriptor.
     */
    public GetLabel(): string {
        return this._descriptor.Label;
    }

    /**
     * Gets the native value, which is what can be written to the Model.
     * Returns undefined if the native value could not be resolved
     * from the input field/element.
     */
    public GetValue(): any {
        return this.State.Value;
    }

    /**
     * System consumer assigns the native value to make it available
     * to most Conditions during validation.
    * @param value - Can be undefined to indicate the value could not be resolved
    * from the input field/element's value, such as inability to convert a string to a date.
    * All other values, including null and the empty string, are considered real data.
    * When undefined, IsChanged will still be changed to true unless options.Reset = true.
    * @param options - 
    * Validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when Validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
    * SkipValueChangedCallback - Skips the automatic callback setup with the 
    * OnValueChanged property.
    */
    public SetValue(value: any, options?: ISetValueOptions): void {
        if (!options)
            options = {};
        let oldValue: any = this.State.Value;   // even undefined is supported
        let changed = !DeepEquals(value, oldValue);
        this.UpdateState((stateToUpdate) => {
            if (changed) {
                stateToUpdate.Value = value;
            }
            this.UpdateChangeCounterInState(stateToUpdate, changed, options!);
            return stateToUpdate;
        }, this);
        this.UseOnValueChanged(changed, oldValue, options);
    }
    

    /**
     * Consuming system calls this when it attempts to resolve
     * the input field/element value but cannot. It identifies that the native value
     * is undefined.
     * Note this does not reset IsChanged to false without explicitly 
     * specifying options.Reset = true;
    * @param options - 
    * Validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when Validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
     */
    public SetValueToUndefined(options?: ISetValueOptions): void {
        this.SetValue(undefined, options);
    }

    protected UpdateChangeCounterInState(stateToUpdate: TState, valueChanged: boolean, options: ISetValueOptions): void
    {
        if (options.Reset)
            stateToUpdate.ChangeCounter = 0;
        else if (valueChanged)
            stateToUpdate.ChangeCounter = (stateToUpdate.ChangeCounter ?? 0) + 1;        
    }

    protected UseOnValueChanged(changed: boolean, oldValue: any, options: ISetValueOptions): void
    {
        if (changed && (!options || !options.SkipValueChangedCallback))
            ToIValueHostCallbacks(this.ValueHostsManager)?.OnValueChanged?.(this, oldValue);        
    }
/**
 * A name of a data type used to lookup supporting services specific to the data type.
 * See the DataTypeResolver. Some examples: "String", "Number", "Date", "DateTime", "MonthYear"
 */    
    public GetDataType(): string | null
    {
        return this.Descriptor.DataType ?? null;
    }

    /**
     * Determines how the validation system sees the Value in terms of editing.
     * When true, it was changed. When false, it was not.
     * The SetValue/SetInputValue/SetValues functions are the only ones to change this flag.
     * They all set it to true automatically except set it to false when the option.Reset is true.
     * The ValueHost.Validate function may skip validation of an InputValueHost when IsChanged is false,
     * depending on the options for Validate. For example, calling validate immediately after loading
     * up the form, you want to avoid showing Required validators. Those should appear only
     * if the user edits, or when the user attempts to submit.
     */
    public get IsChanged(): boolean
    {
        return (this.State.ChangeCounter ?? 0) > 0;
    }
    
    //#endregion IValueHost

    //#region State
    /* 
        Current state for the associated ValueHost.
        Only ValidationManager owns the state. This instance is a reference
        to the value in ValidationManager.
        State is considered immutable. If it needs to change,
        the ValidationManager must discard the current ValueHost instance
        and create a new one. The State contained in the validationManager
        must be supplied to the new ValueHost instance to restore the state.
    */
    protected get State(): TState {
        return this._state;
    }
    private _state: TState;

    /**
     * Use to change anything in IValueHostState without impacting the immutability 
     * of the current instance.
     * Your callback will be passed a cloned instance. Change any desired properties
     * and return that instance. It will become the new immutable value of
     * the State property.
     * @param updater 
     * @returns the state option that resulted from the work.
     * If there were changes, it is a new instance.
     */
    public UpdateState(updater: (stateToUpdate: TState) => TState,
        source: IValueHost): TState {
        AssertNotNull(updater, 'updater');
        let toUpdate = DeepClone(this.State);
        let updated = updater(toUpdate);
        if (!DeepEquals(this.State, updated)) {
            this._state = updated;
            ToIValueHostCallbacks(this.ValueHostsManager)?.OnValueHostStateChanged?.(source, updated);
        }
        return updated;
    }

/**
 * Adds a custom entry into the ValueHost's state
 * or removes it when value = undefined.
 * @param key 
 * @param value 
 */    
    public SaveIntoState(key: string, value: any): void
    {
        this.UpdateState((stateToUpdate) => {
            if (!stateToUpdate.Items)
                stateToUpdate.Items = {};
            if (value !== undefined)
                stateToUpdate.Items[key] = value;
            else
                delete stateToUpdate.Items[key];      
            return stateToUpdate;
        }, this);

    }
/**
 * Use to retrieve a value from the state that was stored
 * with SaveIntoState().
 * @param key 
 */
    public GetFromState(key: string): any | undefined
    {
        return this.State.Items ? this.State.Items[key] : undefined;
    }
}

export type ValueChangedHandler = (valueHost: IValueHost, oldValue: any) => void;
export type ValueHostStateChangedHandler = (valueHost: IValueHost, stateToRetain: IValueHostState) => void;
/**
 * Provides callback hooks for the consuming system to get feedback from ValueHosts.
 */
export interface IValueHostCallbacks {
    /**
     * Called when any ValueHost had its IValueHostState changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setValueHostState() with the stateToRetain.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    OnValueHostStateChanged?: ValueHostStateChangedHandler | null;

    /**
     * Called when the ValueHost's Value property has changed.
     * If setup, you can prevent it from being fired with the options parameter of SetValue
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    OnValueChanged?: ValueChangedHandler | null;
}
/**
 * Determines if the object implements IValueHostCallbacks.
 * @param source 
 * @returns source typecasted to IValueHostCallbacks if appropriate or null if not.
 */
export function ToIValueHostCallbacks(source: any): IValueHostCallbacks | null
{
    if (source && typeof source === 'object')
    {
        let test = source as IValueHostCallbacks;     
        if (test.OnValueHostStateChanged !== undefined && 
            test.OnValueChanged !== undefined)
            return test;
    }
    return null;
}

export abstract class ValueHostBaseGenerator implements IValueHostGenerator {
    public abstract CanCreate(descriptor: IValueHostDescriptor): boolean;

    public abstract Create(valueHostsManager: IValueHostsManager, descriptor: IValueHostDescriptor, state: IValueHostState): IValueHost;

    /**
     * Looking for changes to the ValidationDescriptors to impact IssuesFound.
     * If IssuesFound did change, fix ValidationResult for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationResult Valid.
     * @param state 
     * @param descriptor 
     */
    public abstract CleanupState(state: IValueHostState, descriptor: IValueHostDescriptor): void;
    public CreateState(descriptor: IValueHostDescriptor): IValueHostState {
        return {
            Id: descriptor.Id,
            Value: descriptor.InitialValue
        };
    }

}