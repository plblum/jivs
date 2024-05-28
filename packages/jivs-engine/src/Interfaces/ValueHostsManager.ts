/**
 * Provides a container for ValueHosts that can be used
 * when working with a model or form. Ultimately in Jivs,
 * it serves the ValidationManager, but can work stand-alone.
 * Conditions are passed the ValueHostsManager meaning they
 * can be used independently of validation. 
 * @module ValueHosts/Types/ValueHostsManager
 */

import { ValueHostsInstanceBuilder } from '../ValueHosts/ValueHostsInstanceBuilder';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { IInputValueHostChangedCallback } from './InputValueHost';
import { IValidationServices } from './ValidationServices';
import { IValueHost, IValueHostCallbacks, IValueHostFactory, ValueHostConfig, ValueHostInstanceState, toIValueHostCallbacks } from './ValueHost';
import { IValueHostResolver, toIValueHostResolver } from './ValueHostResolver';
import { IServices } from './Services';
import { ILoggerService } from './LoggerService';
import { ICultureService } from './CultureService';
import { ITextLocalizerService } from './TextLocalizerService';
import { ILookupKeyFallbackService } from './LookupKeyFallbackService';
import { IDataTypeConverterService } from './DataTypeConverterService';
import { IDataTypeIdentifierService } from './DataTypeIdentifierService';
import { IDataTypeComparerService } from './DataTypeComparerService';
import { IConditionFactory } from './Conditions';
import { IDisposable } from './General_Purpose';

export interface IValueHostsServices extends IServices
{

    /**
     * Service to get the ILogger instance that replaces
     * tokens in messages.
     * Defaults to using the global defaultLoggerService
     */
    loggerService: ILoggerService;    


    /**
     * Factory for generating classes that implement IValueHost that use ValueHostConfig.
     */
    valueHostFactory: IValueHostFactory;    

    /**
     * Service for identifying cultures that you will use in the app,
     * by their CultureID  ('en', 'en-US', 'en-GB', etc), and provides
     * fallbacks for when a requested CultureID is not found.
     */
    cultureService: ICultureService;


    /**
     * Factory to create Condition objects.
     */
    conditionFactory: IConditionFactory;

    /**
     * Service for identifing the Data Type Lookup Key associated with a data type
     * using {@link DataTypes/Types/IDataTypeIdentifier!IDataTypeIdentifier | IDataTypeIdentifier} instances.
     */
    dataTypeIdentifierService: IDataTypeIdentifierService;
    
    /**
     * Service for changing the original value into 
     * something that you want a condition to evaluate
     * using {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter} instances.
     */
    dataTypeConverterService: IDataTypeConverterService;
    
    /**
     * Service for changing the comparing two values
     * using {@link DataTypes/Types/IDataTypeComparer!IDataTypeComparer | IDataTypeComparer} instances.
     */
    dataTypeComparerService: IDataTypeComparerService;
    
    /**
     * Service to text localization specific, effectively mapping
     * a text key to a language specific version of that text.
     * Error messages and IDataTypeFormatters use this.
     */
    textLocalizerService: ITextLocalizerService;

    /**
     * Service for creating a relationship between a lookup key and another
     * that is the base data type it is built around.
     * For example, LookupKey.Integer uses a number as the base data type.
     * So it has a relationship with LookupKey.Number.
     * This service keeps these relationships. The DataTypeFormatterService and DataTypeParserService
     * consume this as they try to find the best fitting Formatter or Parser.
     * So go ahead and assign your ValueHost.datatype to LookupKey.Integer.
     * If there is no IntegerParser (there isn't), expect to be using the NumberParser.
     */
    lookupKeyFallbackService: ILookupKeyFallbackService;

}

/**
 * Provides a container for ValueHosts that can be used
 * when working with a model or form. Ultimately in Jivs,
 * it serves the ValueHostsManager, but can work stand-alone.
 * Conditions are passed the ValueHostsManager meaning they
 * can be used independently of validation. 
 */
export interface IValueHostsManager extends IValueHostResolver, IDisposable
{
    /**
     * Typecast from IServices
     */
    services: IValueHostsServices;

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
    addValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;    
    
    /**
     * Replaces a ValueHostConfig for an already added ValueHost. 
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * @param config 
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValueHostsManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    updateValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;

    /**
     * Discards a ValueHost. 
     * Does not trigger any notifications.
     * @param valueHostName 
     */
    discardValueHost(valueHostName: ValueHostName): void;    

    /**
     * Provide fluent syntax to add or replace a ValueHost.
     * Alternative to using addValueHost() and updateValueHost().
     */
    build(): ValueHostsInstanceBuilder;
    
    /**
     * Upon changing the value of a ValueHost, other ValueHosts need to know. 
     * They may have Conditions that take the changed ValueHost into account and
     * will want to revalidate or set up a state to force revalidation.
     * This goes through those ValueHosts and notifies them.
     */
    notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostName, revalidate: boolean): void;
    
}

/**
 * Stateful values from the instance of ValueHostsManager.
 * This is expected to be retained by the creator of ValueHostsManager
 * so the hosting HTML can be regenerated and a new ValueHostsManager
 * is created with the retained state.
 * In a SPA, it may not be necessary to handle states like that.
 * The SPA may keep an instance of ValueHostsManager for the duration needed.
 * Each entry in ValueHostInstanceStates must have a companion in ValueHosts and ValueHostConfigs.
 */
export interface ValueHostsManagerInstanceState {
    /**
     * Mostly here to provide a way to detect a change in the state quickly.
     * This value starts at 0 and is incremented each time ValueHostsManager
     * stores a changed state.
     */
    stateChangeCounter?: number;
}


/**
 * Provides the configuration for the ValueHostsManager constructor.
 * 
 * NOTE: extensions of this interface can implement IDisposable knowing
 * that the ValueHostManager will call dispose() if supplied, during its own disposal.
 */
export interface ValueHostsManagerConfig extends IValueHostsManagerCallbacks
{
    /**
     * Provides services into the system. Dependency Injection and factories.
     * @remarks
     * While most objects have a WeakRef to services, we keep an active reference here
     * because we invite the user to create the service, pass it into this Config
     * and let the ValueHostsManager/ValidationManager's reference be the one to access.
     * If this is set to another object created within the scope of ValueHostsManager,
     * that other object should keep a WeakRef to it.
     */
    services: IValidationServices;
    /**
     * Initial list of ValueHostConfigs. Here's where all of the action is!
     * Each ValueHostConfig describes one ValueHost (which is info about one value in your app),
     * plus its validation rules.
     * If rules need to be changed later, either create a new instance of ValueHostsManager
     * or use its addValueHost, updateValueHost, discardValueHost methods.
     */
    valueHostConfigs: Array<ValueHostConfig>;

    /**
     * The InstanceState for the ValueHostsManager itself.
     * Its up to you to retain stateful information so that the service works statelessly.
     * It will supply you with the changes to states through the OnInstanceStateChanged property.
     * Whatever it gives you, you supply here to rehydrate the ValueHostsManager with 
     * the correct state.
     * If you don't have any state, leave this null or undefined and ValueHostsManager will
     * initialize its state.
     */
    savedInstanceState?: ValueHostsManagerInstanceState | null;
    /**
     * The state for each ValueHost. The array may not have the same states for all the ValueHostConfigs
     * you are supplying. It will create defaults for those missing and discard those no longer in use.
     * 
     * Its up to you to retain stateful information so that the service works statelessly.
     * It will supply you with the changes to states through the OnValueHostInstanceStateChanged property.
     * Whatever it gives you, you supply here to rehydrate the ValueHostsManager with 
     * the correct state. You can also supply the state of an individual ValueHost when using
     * the addValueHost or updateValueHost methods.
     * If you don't have any state, leave this null or undefined and ValueHostsManager will
     * initialize its state.
     */
    savedValueHostInstanceStates?: Array<ValueHostInstanceState> | null;
}

export type ValueHostsManagerInstanceStateChangedHandler
 = (ValueHostsManager: IValueHostsManager, stateToRetain: ValueHostsManagerInstanceState) => void;


/**
 * Provides callback hooks for the consuming system to supply to ValueHostsManager.
 * This instance is supplied in the constructor of ValueHostsManager.
 */
export interface IValueHostsManagerCallbacks extends IValueHostCallbacks, IInputValueHostChangedCallback {
    /**
     * Called when the ValueHostsManager's InstanceState has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setState function with the stateToRetain
     */
    onInstanceStateChanged?: ValueHostsManagerInstanceStateChangedHandler | null;

}

/**
 * Determines if the object implements IValueHostsManagerCallbacks.
 * @param source 
 * @returns source typecasted to IValueHostsManagerCallbacks if appropriate or null if not.
 */
export function toIValueHostsManagerCallbacks(source: any): IValueHostsManagerCallbacks | null
{
    if (toIValueHostCallbacks(source))
    {
        let test = source as IValueHostsManagerCallbacks;     
        if (test.onInstanceStateChanged !== undefined)
            return test;
    }
    return null;
}


/**
 * Determines if the object implements IValueHostsManager.
 * @param source 
 * @returns source typecasted to IValueHostsManager if appropriate or null if not.
 */
export function toIValueHostsManager(source: any): IValueHostsManager | null
{
    if (toIValueHostResolver(source)) {
        let test = source as IValueHostsManager;    
        if (test.notifyOtherValueHostsOfValueChange !== undefined &&
            test.addValueHost !== undefined &&
            test.updateValueHost !== undefined &&
            test.discardValueHost !== undefined
        )
            return test;
    }
    return null;
}

/**
 * Allows classes to expose their reference to an IValueHostManager
 * (which is usually the ValueHostsManager).
 */
export interface IValueHostsManagerAccessor
{
    valueHostsManager: IValueHostsManager;
}

/**
 * Determines if the object implements IValueHostsManagerAccessor.
 * @param source 
 * @returns source typecasted to IValueHostsManagerAccessor if appropriate or null if not.
 */
export function toIValueHostsManagerAccessor(source: any): IValueHostsManagerAccessor | null
{
    if (source && typeof source === 'object') {
        let test = source as IValueHostsManagerAccessor;     
        if (test.valueHostsManager !== undefined)
            return test;
    }
    return null;
}