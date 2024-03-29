/**
 * Exposes values from the consuming system to the validation engine.
 * Each instance represents a single value from the consuming system.
 * Each also has an Id, used to lookup the ValueHost,
 * and a Label, which is a UI friendly way to tell the user the source of a validation error.
 * There are several types of ValueHosts:
 * - InputValueHosts - reflects values from user input. 
 *   These have validation capability.
 * - NonInputValueHosts - reflects values that are needed by validation
 *   but are not editable by the user. Often these are properties from the same
 *   Model being edited.
 * - HTMLElementValueHost - Its value is an HTML Element in the DOM which it gets
 *   by a queryselector.
 *   Conditions are expected to use its data in a read-only fashion. 
 *   Example info from HTML elements are:
 *   visible, enabled, readonly, classname, attribute name (exists), and attribute value.
 *   These are mostly used by a validator's Enabler condition
 *   to determine if something in the UI might block validation, like
 *   a disabled field.
 * 
 * There are two types of values associated with an input:
 * - input - the value supplied by the input field/element.
 *   It is often a string representation of the native data
 *   and may contain errors preventing its conversion into that native data.
 *   Only a few conditions evaluate the input value, but they are important:
 *   RequiredCondition and ValidNativeCondition.
 * - native - the value that will be stored in the Model.
 *   Date object, number, boolean, and your own object are examples.
 *   When the native type is a string, it is often similar in both input and native values.
 *   The string in the native value may be cleaned up, trimmed, reformatted, etc.
 *   Most Conditions evaluate the native value.
 * Its up to the system consumer to manage both.
 * - When an input has its value set or changed, also assign it here with setInputValue().
 * - RequiredConditions and DataTypeCondition look at the InputValue via getInputValue().
 * - The initial native value is assigned with SetNativeValue.
 *   The consumer handles converting the input field/element value into its native value
 *   and supplies it with SetNativeValue or NativeValueUndetermined.
 * - Most Conditions look at the NativeValue via GetNativeValue.
 * @module ValueHosts/Interfaces/ValueHost
 */


import { ValueHostId } from '../DataTypes/BasicTypes';
import { IValueHostResolver, IValueHostsManager } from './ValueHostResolver';

/**
 * Interface for creating ValueHosts.
 */
export interface IValueHost {
    /**
     * Provides a unique identity for this ValueHost.
     * Consuming systems use this ID to locate the ValueHost
     * for which they will transfer a value, via ValueHostsManager.getValueHost(this id)
     */
    getId(): ValueHostId;

    /**
     * The UI-ready label for this value, to be shown in error messages
     * that have the {Label} token.
     */
    getLabel(): string;

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
    * appear in the Required validator within the {ConversionError} token.
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
    * appear in the Required validator within the {ConversionError} token.
     */
    setValueToUndefined(options?: SetValueOptions): void;

    /**
     * A name of a data type used to lookup supporting services specific to the data type.
     * See the DataTypeServices. Some examples: "String", "Number", "Date", "DateTime", "MonthYear"
     */
    getDataType(): string | null;

    /**
     * Adds a custom entry into the ValueHost's state
     * or removes it when value = undefined.
     * @param key 
     * @param value 
     */
    saveIntoState(key: string, value: any): void;
    /**
     * Use to retrieve a value from the state that was stored
     * with SaveIntoState().
     * @param key 
     */
    getFromState(key: string): any | undefined;

    /**
     * Determines how the validation system sees the Value in terms of editing.
     * When true, it was changed. When false, it was not.
     * The setValue()/setInputValue()/setValues() functions are the only ones to change this flag.
     * They all set it to true automatically except set it to false when the option.Reset is true.
     * The ValueHost.validate() function may skip validation of an InputValueHost when IsChanged is false,
     * depending on the options for validate(). For example, calling validate immediately after loading
     * up the form, you want to avoid showing Required validators. Those should appear only
     * if the user edits, or when the user attempts to submit.
     */
    isChanged: boolean;
}

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
     * Reset the field's changed and validation states as if the field has never been edited.
     * It effectively sets ValueHost.IsChanged to false and calls InputValueHost.clearValidation().
     */
    reset?: boolean;

    /**
     * When converting the input field/element value to native and there is an error
     * it should be supplied here. Only meaningful when State.Value is undefined.
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
export interface ValueHostState {

    /**
     * The ValueHostId for the associated ValueHost.
     * Despite being in State, this property is not allowed to be changed.
     */
    id: ValueHostId;

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
     * Counts the number of changes made to the Value thru setValue()/setValues()/setInputValue().
     * Increments with each call or sets it back to 0 when their option.Reset is true.
     * When 0 or undefined, it means no changes have been made. 
     */
    changeCounter?: number;

    /**
     * Storage associated with ValueHost.SaveIntoState/GetFromState
     */
    items?: CustomItems;
}

/**
 * @internal
 */
interface CustomItems {
    [key: string]: any;
}

/**
 * Just the data that is used to describe this ValueHost.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to this or a
 * child implementation.
 * This provides the business rules and other non-state values for each ValueHost.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this, except values are converted to their native forms
 * like a JSON date is a Date object.
 */
export interface ValueHostDescriptor {
    /**
     * Identifies the type of ValueHost that will be created to 
     * support the Descriptor.
     * InputValueHost - 'Input'
     * NonInputValueHost - 'Noninput'
     * HTMLElementValueHost - 'HTMLElement'
     * If left null, the ValueHostFactory will determine between ValueHost and InputValueHost
     * by checking for inclusion of the InputValueHostDescriptor.ValidationDescriptors property.
     */
    type?: string;
    /**
     * Provides a unique "name" for this ValueHost, within the scope of one
     * ValueHostsManager instance.
     * Consuming systems use this ID to locate the ValueHost
     * for which they will access a Value.
     * Its up to the consuming system to define unique IDs.
     * A good form is path notation through the module's properties, such as:
     * AddressInfo/StreetName
     * When a property is part of a collection/list, consider:
     * - index into the list, a simple number starting at 0. Property1/0, Property1/1
     * - Primary key when the children are data elements themselves. Property1/Key=abc123
     */
    id: ValueHostId;

    /**
     * The UI-ready label for this value, to be shown in error messages
     * that have the {Label} token.
     */
    label?: string;

    /**
     * Localization key for Label. Its value will be matched to an entry
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
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
     * See the DataTypeServices. Some examples: "String", "Number", "Date", "DateTime", "MonthYear".
     * If null, the current value's type (ValueHostState.Value) is used and must be string, number, boolean, or date.
     */
    dataType?: string;
}



/**
 * Provides a service to ValueHosts, their InputValidators, and Conditions that gathers
 * all of the ValueHostIds being referenced amongst them. Generally Conditions provide all of them,
 * both from InputValidator.Condition and InputValidator.Enabler.
 */
export interface IGatherValueHostIds {
    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void;
}

/**
 * Determines if the source implements IGatherValueHosts, and returns it typecasted.
 * If not, it returns null.
 * @param source 
 */
export function toIGatherValueHostIds(source: any): IGatherValueHostIds | null {
    if (source && typeof source === 'object') {
        let test = source as IGatherValueHostIds;       
        if (test.gatherValueHostIds !== undefined)
            return test;
    }
    return null;
}

/**
 * Factory for generating classes that implement IValueHost that use ValueHostDescriptor.
 * ValueHostDescriptor identifies the desired ValueHost class.
 * Most apps will use the standard InputValueHost class.
 * This interface targets unit testing with mocks.
 */
export interface IValueHostFactory {
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param descriptor - determines the class. All classes supported here must ValueHostDescriptor to get their setup.
     * @param state - Allows restoring the state of the new ValueHost instance. Use Factory.createState() to create an initial value.
     */
    create(valueHostsManager: IValueHostsManager, descriptor: ValueHostDescriptor, state: ValueHostState): IValueHost;
    /**
     * Adjusts the state from a previous time to conform to the Descriptor.
     * For example, if the Descriptor had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param descriptor 
     */
    cleanupState(state: ValueHostState, descriptor: ValueHostDescriptor): void;
    /**
     * Creates an initialized State object
     * @param descriptor 
     */
    createState(descriptor: ValueHostDescriptor): ValueHostState;
}