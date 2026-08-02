/**
 * Exposes values from the consuming system to the validation engine.
 * Each instance represents a single value from the consuming system.
 * Each also has an name, used to lookup the ValueHost,
 * and a Label, which is a UI friendly way to tell the user the source of a validation error.
 * There are several types of ValueHosts:
 * - FieldValueHost - reflects values from user input and model properties. 
 *   These have validation capability.
 * - StaticValueHost - reflects values that are needed by validation
 *   but are not editable by the user.
 * - CalcValueHost - Its value is calculated when its getValue() method is called. 
 *   You supply a function callback for the calculation.
 * 
 * Base class Validators:
 * - ValidatableValueHostBase - introduces the framework for validation but does not
 *   get the Validators objects involved.
 * - ValidatorsValueHostBase - introduces Validators and completes the overall validation feature.
 *   FieldValueHosts inherit from this 
 * @module jivs-engine/ValueHosts/Types/ValueHost
 */


import { ValueHostName } from '../DataTypes/BasicTypes';
import { IValueHostResolver } from './ValueHostResolver';
import { IValueHostsManagerAccessor } from './ValueHostsManager';
import { IDisposable } from './General_Purpose';
import { ConditionConfig } from './Conditions';
/**
 * Interface for creating ValueHosts.
 */
export interface IValueHost extends IValueHostsManagerAccessor, IDisposable {
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
     * Gets the typed value in its native form,
     * ready for use by the caller without string conversion.
     * For example, a Date object or a number.
     * Returns undefined when the typed value could not be resolved
     * from the text value.
     */
    getValue(): any;

    /**
    * Replaces the typed value and optionally validates in subclasses
    * that implement IValidatableValueHostBase. 
    * Call when the typed value was changed directly by consuming code.
    * @param value - The typed value to store. Use undefined to indicate that the
    * typed value could not be resolved from the text value, such as when parsing fails.
    * All other values, including null and the empty string, are treated as real data.
    * When undefined, IsChanged is still set to true unless options.Reset = true.
    * @param options -
    *    * validate - Invoke validation after setting the value.
    *    * Reset - Clear validation state, unless validate = true, and set IsChanged to false.
    *   * injectedError - If you handle parsing before calling setValue(), your parser may have returned
    *        an error. Assign this object to contain the error message and other info.
    *        Internally Jivs will provide a Validator with the error message to report the error.
    *        If setup, you can give it an errorCode. If not supplied, know that TextLocalizerService will
    *        use the errorCode value of 'InjectedError' to localize the error message. 
    *        You can also provide a summaryMessage for use in a summary of validation errors.
    *    * SkipValueChangedCallback - Skips the automatic callback setup with the 
    *      OnValueChanged property.
    */
    setValue(value: any, options?: SetValueOptions): void;

    /**
     * Identifies that the value is undetermined. For example,
     * the user's input cannot be converted into its native data type
     * or the textbox is empty.
     * Note this does not reset IsChanged to false without explicitly 
     * specifying options.Reset = true;
     * @param options - 
     *  * validate - Invoke validation after setting the value.
     *  * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
     *  * injectedError - If you handle parsing before calling setValueToUndefined(), your parser may have returned
     *       an error. Assign this object to contain the error message and other info.
     *       Internally Jivs will provide a Validator with the error message to report the error.
     *       If setup, you can give it an errorCode. If not supplied, know that TextLocalizerService will
     *       use the errorCode value of 'InjectedError' to localize the error message. 
     *       You can also provide a summaryMessage for use in a summary of validation errors.
     */
    setValueToUndefined(options?: SetValueOptions): void;

    /**
     * A name of a data type used to lookup supporting services specific to the data type.
     * See the {@link jivs-engine/DataTypes/Types/LookupKey | LookupKey}. Some examples: "String", "Number", "Date", "DateTime", "MonthYear"
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

    /**
     * Provides a localized label for the data type when it needs to be shown to the user.
     * Since the ValueHostConfig.dataType is optional, this will end up returning the empty string,
     * unless the native value has been assigned and the DataTypeIdentifierService can figure out its lookupKey.
     */
    getDataTypeLabel(): string;

    /**
     * Determines if the ValueHost is enabled for user interaction.
     * It is enabled unless you explicilty set it to false using
     * ValueHostConfig.initialEnabled : false, 
     * setup the EnablerCondition which determines when it is enabled,
     * or the ValueHost's own setEnabled() function.
     * 
     * When disabled, the data values of the ValueHost do not get changed
     * by setValue() and related functions. However, those functions offer the 
     * overrideDisabled option to force the change.
     * 
     * When disabled and the ValueHost have validators, all validation is 
     * disabled and its ValidationStatus reports ValidationState.Disabled.
     */
    isEnabled(): boolean;

    /**
     * Sets the enabled state of the ValueHost.
     * When false, the ValueHost is disabled and setValue() and related functions
     * will not change the value. However, they offer the overrideDisabled option
     * to force the change.
     * When disabled and the ValueHost has validators, all validation is disabled
     * and its ValidationStatus reports ValidationState.Disabled.
     * 
     * This value is part of the ValueHost's InstanceState, not the Config,
     * although the ValueHostConfig.initialEnabled is used when it is not set in the state.
     * @param enabled 
     */
    setEnabled(enabled: boolean): void;
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
     * If you have setup the OnValueChanged callback, it automatically is run
     * when a value is changed. Use this to skip that callback.
     * Callback is skipped when true.
     * When null, it is the same as false.
     */
    skipValueChangedCallback?: boolean;

    /**
     * When true, it forces the change to the value even when the ValueHost is disabled.
     * ValueHost is disabled when ValueHost.isEnabled() returns false.
     * Use case: You may want to initialize a ValueHost with a value that is disabled.
     */
    overrideDisabled?: boolean;
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
     * The latest value of setEnabled. When undefined, it uses the ValueHostConfig.initialEnabled
     * and if that is undefined, it is enabled.
     * Note that this value overrides any EnablerCondition that may be setup.
     */
    enabled?: boolean;

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

export interface CustomItems {
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
     * FieldValueHost - 'Field'
     * StaticValueHost - 'Static'
     * CalcValueHost - 'Calc'
     * If left null, the ValueHostFactory will determine between StaticValueHost and FieldValueHost
     * by checking for inclusion of the FieldValueHostConfig.validationConfigs property.
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
     */
    label?: string;

    /**
     * Localization key for Label. Its value will be matched to an entry
     * made to JivsServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the errorMessage property is used.
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
     * See {@link jivs-engine/DataTypes/Types/LookupKey | LookupKey}. Some examples: "String", "Number", "Date", "DateTime", "MonthYear".
     * If null, the current value's type (ValueHostInstanceState.Value) is used and must be string, number, boolean, or date.
     */
    dataType?: string;

    /**
     * When defined, it is the initial value for isEnabled(). Its value overridden
     * by calling setEnabled() or using an Enabler condition.
     * It is not used when enablerConfig is defined.
     */
    initialEnabled?: boolean;

    /**
     * Provides an automated way to change the value of isEnabled() on the ValueHost.
     * To use, provide a Condition through its ConditionConfig object. 
     * When using, the initialEnabled property is ignored.
     * The setEnabled() function will override this when setting it to false,
     * while setting it to true will restore this condition.
     * 
     * Using the Builder API, use builder.enabler('valueHostName', (builder)=> builder.condition(parameters)).
     */
    enablerConfig?: ConditionConfig;

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
        const test = source as IGatherValueHostNames;       
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
        const test = source as IValueHost;    
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
        const test = source as IValueHostCallbacks;     
        if (test.onValueHostInstanceStateChanged !== undefined && 
            test.onValueChanged !== undefined)
            return test;
    }
    return null;
}