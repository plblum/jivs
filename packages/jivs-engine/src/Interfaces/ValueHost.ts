import { IDisposable } from './General_Purpose';
/**
 * Exposes values from the consuming system to the validation engine.
 * Each instance represents a single value from the consuming system.
 * Each also has an name, used to lookup the ValueHost,
 * and a Label, which is a UI friendly way to tell the user the source of a validation error.
 * There are several types of ValueHosts:
 * - InputValueHost - reflects values from user input. 
 *   These have validation capability.
 * - PropertyValueHost - reflects values from a Model.
 *   These have validation capability.
 * - StaticValueHost - reflects values that are needed by validation
 *   but are not editable by the user. Often these are properties from the same
 *   Model being edited.
 * - CalcValueHost - Its value is calculated when its getValue() method is called. 
 *   You supply a function callback in its CalcValueHostConfig to set it up.
 * 
 * Base class Validators:
 * - ValidatableValueHostBase - introduces the framework for validation but does not
 *   get the Validators objects involved.
 * - ValidatorsValueHostBase - introduces Validators and completes the overall validation feature.
 *   InputValueHosts inherit from this 
 * @module ValueHosts/Types/ValueHost
 */


import { ValueHostName } from '../DataTypes/BasicTypes';
import { IValueHostResolver } from './ValueHostResolver';
import { IValueHostsManager } from './ValueHostsManager';
/**
 * Interface for creating ValueHosts.
 */
export interface IValueHost extends IDisposable {
    /**
     * Provides a unique name for this ValueHost.
     * Consuming systems use this name to locate the ValueHost
     * for which they will transfer a value, via ValueHostsManager.getValueHost(this name)
     */
    getName(): ValueHostName;

    /**
     * The UI-ready label for this value, to be shown in error messages
     * that have the {Label} token.
     */
    getLabel(): string;

    /**
     * Use to change the label and/or labell10n values. 
     * It overrides the values from ValueHostConfig.label and labell10n.
     * Use case: Business logic supplies a default values for label and labell10n which the UI needs to change.
     * @param label - If undefined, reverts to ValueHostConfig.label.
     * If null, does not make any changes.
     * @param labell10n - If undefined, reverts to ValueHostConfig.labell10n.
     * If null, does not make any changes.
     */
    setLabel(label: string, labell10n?: string): void;

    /**
     * Gets the value. It is expected to be in its native data type,
     * capable of being stored or used without conversion by the caller.
     * For example, a Date object or Number type.
     * Returns undefined if the native value could not be resolved
     * from the input value.
     */
    getValue(): any;

    /**
     * Replaces the value and optionally validates.
     * Call when the value was changed in the system consumer.
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
    */
    setValue(value: any, options?: SetValueOptions): void;

    /**
     * Identifies that the value is undetermined. For example,
     * the user's input cannot be converted into its native data type
     * or the input is empty.
     * Note this does not reset IsChanged to false without explicitly 
     * specifying options.Reset = true;
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
     */
    setValueToUndefined(options?: SetValueOptions): void;

    /**
     * A name of a data type used to lookup supporting services specific to the data type.
     * See the {@link DataTypes/Types/LookupKey | LookupKey}. Some examples: "String", "Number", "Date", "DateTime", "MonthYear"
     */
    getDataType(): string | null;

    /**
     * Adds a custom entry into the ValueHost's InstanceState
     * or removes it when value = undefined.
     * @param key 
     * @param value - When undefined, it removes this entry in the state.
     */
    saveIntoInstanceState(key: string, value: ValidTypesForInstanceStateStorage | undefined): void;
    /**
     * Use to retrieve a value from the state that was stored
     * with SaveIntoInstanceState().
     * @param key 
     */
    getFromInstanceState(key: string): ValidTypesForInstanceStateStorage | undefined;

    /**
     * Determines how the validation system sees the Value in terms of editing.
     * When true, it was changed. When false, it was not.
     * The setValue() and related functions are the only ones to change this flag.
     * They all set it to true automatically except set it to false when the option.Reset is true.
     * The ValidatableValueHost.validate() function may skip validation of a ValueHost when isChanged is false,
     * depending on the options for validate(). For example, calling validate immediately after loading
     * up the form, you want to avoid showing Category=Require validators. Those should appear only
     * if the user edits, or when the user attempts to submit.
     */
    isChanged: boolean;
}

/**
 * Limits the values that can be stored in ValueHostInstanceState.Items
 */
export type ValidTypesForInstanceStateStorage = null | number | boolean | string;

/**
 * Optional options for IValueHost Set functions.
 */
export interface SetValueOptions {

    /**
     * Perform validation if ValueHost supports it.
     * That may result in a state change passed up.
     */
    validate?: boolean;

    /**
     * Only applies when validate option is true
     * Set to true when handling an intermediate change activity, such as a keystroke
     * changed a textbox but the user remains in the textbox. For example, on the 
     * HTMLInputElement.oninput event.
     * This will involve only validators that make sense during such an edit.
     * Specifically their Condition implements IEvaluateConditionDuringEdits.
     * The IEvaluateConditionDuringEdits.evaluateDuringEdit() function is used
     * instead of ICondition.evaluate().
     * When undefined, it is the same as false.
     */
    duringEdit?: boolean;    

    /**
     * Reset the field's changed and validation states as if the field has never been edited.
     * It effectively sets ValueHost.IsChanged to false and calls ValidatableValueHost.clearValidation().
     */
    reset?: boolean;

    /**
     * When converting the input field/element value to native and there is an error
     * it should be supplied here. Only meaningful when instanceState.Value is undefined.
     * It can be displayed as part of the DataTypeCheckCondition's
     * error message token {ConversionError}.
     * Cleared when setting the value without an error.
     */
    conversionErrorTokenValue?: string;

    /**
     * If you have setup the OnValueChanged callback, it automatically is run
     * when a value is changed. Use this to skip that callback.
     * Callback is skipped when true.
     * When null, it is the same as false.
     */
    skipValueChangedCallback?: boolean;
}

/**
 * Elements of ValueHost that are stateful based on user interaction
 */
export interface ValueHostInstanceState {

    /**
     * The ValueHostName for the associated ValueHost.
     * Despite being in instanceState, this property is not allowed to be changed.
     */
    name: ValueHostName;

    /**
     * The value available to be evaluated by Conditions.
     * It is expected to be in its native data type,
     * capable of being stored or used without conversion by the caller.
     * For example, a Date object or Number type.
     * Value of undefined is valid. Use undefined if the native value could not be resolved
     * from the input field/element or is otherwise unknown.
     */
    value: any;

    /**
     * Counts the number of changes made to the Value thru setValue() and related functions.
     * Increments with each call or sets it back to 0 when their option.Reset is true.
     * When 0 or undefined, it means no changes have been made. 
     */
    changeCounter?: number;

    /**
     * Storage associated with ValueHost.saveIntoInstanceState/getFromInstanceState
     */
    items?: CustomItems;
}

interface CustomItems {
    [key: string]: ValidTypesForInstanceStateStorage;
}

/**
 * Just the data that is used to describe this ValueHost.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to this or a
 * child implementation.
 * 
 * This provides the business rules and other non-state values for each ValueHost.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this, except values are converted to their native forms
 * like a JSON date is a Date object.
 * 
 * NOTE: extensions of this interface can implement IDisposable knowing
 * that the ValueHost will call dispose() if supplied, during its own disposal.
 */
export interface ValueHostConfig {
    /**
     * Identifies the type of ValueHost that will be created to 
     * support the Config. Can use the enumeration ValueHostType to get these strings.
     * InputValueHost - 'Input'
     * PropertyValueHost - 'Property'
     * StaticValueHost - 'Static'
     * CalcValueHost - 'Calc'
     * If left null, the ValueHostFactory will determine between StaticValueHost and InputValueHost
     * by checking for inclusion of the InputValueHostConfig.validationConfigs property.
     */
    valueHostType?: string;
    
    /**
     * Provides a unique name for this ValueHost, within the scope of one
     * ValueHostsManager instance.
     * Consuming systems use this name to locate the ValueHost
     * for which they will access a Value.
     * Its up to the consuming system to define unique names.
     * A good form is path notation through the module's properties, such as:
     * AddressInfo/StreetName
     * When a property is part of a collection/list, consider:
     * - index into the list, a simple number starting at 0. Property1/0, Property1/1
     * - Primary key when the children are data elements themselves. Property1/Key=abc123
     */
    name: ValueHostName;

    /**
     * The UI-ready label for this value, to be shown in error messages
     * that have the {Label} token.
     * This value can be overriden via ValueHost.setLabel, so the UI can apply
     * a better label.
     */
    label?: string;

    /**
     * Localization key for Label. Its value will be matched to an entry
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the errorMessage property is used.
     * This value can be overriden via ValueHost.setLabel, so the UI can apply
     * a better label.
     */
    labell10n?: string | null | undefined;

    /**
     * Provides an initial value when constructing the instance.
     * Changes to the value should come from setValue(), as they
     * report state changes.
     * Can be undefined/omitted. 
     * Note that a value of null or empty string are both considered
     * real values to store. Only undefined means nothing to store.
     */
    initialValue?: any;

    /**
     * A name of a data type used to lookup supporting services specific to the data type.
     * See {@link DataTypes/Types/LookupKey | LookupKey}. Some examples: "String", "Number", "Date", "DateTime", "MonthYear".
     * If null, the current value's type (ValueHostInstanceState.Value) is used and must be string, number, boolean, or date.
     */
    dataType?: string;

    //!! Interferes with intellisense support for building with known properties
    // /**
    //  * Handy way to allow users to enter known properties without getting ts errors.
    //  * However, they can improve things if they typecast to the appropriate
    //  * valueHost's Config.
    //  */
    // [propName: string]: any;    
}



/**
 * Provides a service to ValueHosts, their Validators, and Conditions that gathers
 * all of the ValueHostNames being referenced amongst them. Generally Conditions provide all of them,
 * both from Validator.Condition and Validator.Enabler.
 */
export interface IGatherValueHostNames {
    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void;
}

/**
 * Determines if the source implements IGatherValueHosts, and returns it typecasted.
 * If not, it returns null.
 * @param source 
 */
export function toIGatherValueHostNames(source: any): IGatherValueHostNames | null {
    if (source && typeof source === 'object') {
        let test = source as IGatherValueHostNames;       
        if (test.gatherValueHostNames !== undefined)
            return test;
    }
    return null;
}

export type ValueChangedHandler = (valueHost: IValueHost, oldValue: any) => void;
export type ValueHostInstanceStateChangedHandler = (valueHost: IValueHost, stateToRetain: ValueHostInstanceState) => void;

/**
 * Determines if the object implements IValueHost.
 * @param source 
 * @returns source typecasted to IValueHost if appropriate or null if not.
 */
export function toIValueHost(source: any): IValueHost | null
{
    if (source && typeof source === 'object')
    {
        let test = source as IValueHost;    
        // some select members of IValueHost
        if (test.getDataType !== undefined &&
            test.getFromInstanceState !== undefined &&
            test.getLabel !== undefined &&
            test.getName !== undefined &&
            test.getValue !== undefined)
            return test;
    }
    return null;
}



/**
 * Provides callback hooks for the consuming system to get feedback from ValueHosts.
 */
export interface IValueHostCallbacks {
    /**
     * Called when any ValueHost had its ValueHostInstanceState changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setValueHostInstanceState() with the stateToRetain.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    onValueHostInstanceStateChanged?: ValueHostInstanceStateChangedHandler | null;

    /**
     * Called when the ValueHost's Value property has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    onValueChanged?: ValueChangedHandler | null;
}
/**
 * Determines if the object implements IValueHostCallbacks.
 * @param source 
 * @returns source typecasted to IValueHostCallbacks if appropriate or null if not.
 */
export function toIValueHostCallbacks(source: any): IValueHostCallbacks | null
{
    if (source && typeof source === 'object')
    {
        let test = source as IValueHostCallbacks;     
        if (test.onValueHostInstanceStateChanged !== undefined && 
            test.onValueChanged !== undefined)
            return test;
    }
    return null;
}

/**
 * Factory for generating classes that implement IValueHost that use ValueHostConfig.
 * ValueHostConfig identifies the desired ValueHost class.
 * Most apps will use the standard InputValueHost class.
 * This interface targets unit testing with mocks.
 */
export interface IValueHostFactory {
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param config - determines the class. All classes supported here must ValueHostConfig to get their setup.
     * @param state - Allows restoring the state of the new ValueHost instance. Use Factory.createInstanceState() to create an initial value.
     */
    create(valueHostsManager: IValueHostsManager, config: ValueHostConfig, state: ValueHostInstanceState): IValueHost;
    /**
     * Adjusts the state from a previous time to conform to the Config.
     * For example, if the Config had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param config 
     */
    cleanupInstanceState(state: ValueHostInstanceState, config: ValueHostConfig): void;
    /**
     * Creates an initialized InstanceState object
     * @param config 
     */
    createInstanceState(config: ValueHostConfig): ValueHostInstanceState;
}