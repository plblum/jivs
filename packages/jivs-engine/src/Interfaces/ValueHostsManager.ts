/**
 * Provides a container for ValueHosts that can be used
 * when working with a model or form. Ultimately in Jivs,
 * it serves the ValidationManager, but can work stand-alone.
 * Conditions are passed the ValueHostsManager meaning they
 * can be used independently of validation. 
 * @module ValueHosts/Types/ValueHostsManager
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { IInputValueHostChangedCallback } from './InputValueHost';
import { IValueHost, IValueHostCallbacks, ValueHostConfig, ValueHostInstanceState, toIValueHostCallbacks } from './ValueHost';
import { IValueHostResolver, toIValueHostResolver } from './ValueHostResolver';
import { IDisposable } from './General_Purpose';
import { ValueHostsManagerConfigModifier } from '../ValueHosts/ValueHostsManagerConfigModifier';
import { IValueHostsServices } from './ValueHostsServices';

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
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValueHostsManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     * When null, the state supplied in the ValueHostsManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    addValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;    
    
    /**
     * Replaces a ValueHostConfig for an already added ValueHost. It does not merge.
     * If merging is required, use addOrMergeValueHost().
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * Any previous ValueHost and its config will be disposed.
     * Be sure to discard any reference to the ValueHost instance that you have.
     * @param config 
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValueHostsManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    addOrUpdateValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;

    /**
     * Replaces a ValueHostConfig for an already added ValueHost.
     * It merges the new config with the existing one using the ValueHostConfigMergeService.
     * The goal is to protect important business logic settings while allowing the UI
     * to inject new property values where appropriate.
     * Does not trigger any notifications.
     * If the name isn't found, it will be added.
     * Any previous ValueHost and its config will be disposed.
     * Be sure to discard any reference to the ValueHost instance that you have.
     * @param config 
     * Can use builder.static(), builder.calc() or any ValueConfigHost. 
     * (builder is the Builder API)
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValueHostsManager constructor.
     * It will be run through ValueHostFactory.cleanupInstanceState() first.
     */
    addOrMergeValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost;    

    /**
     * Discards a ValueHost. 
     * Does not trigger any notifications.
     * @param valueHostName 
     */
    discardValueHost(valueHostName: ValueHostName): void;    

    /**
     * Easier way to add or modify a ValueHostConfig than using
     * addValueHost(), addOrUpdateValueHost(), or addOrMergeValueHost().
     * It returns an object whose methods allow adding ValueHosts
     * and their validators. Upon calling its apply() method,
     * your changes will be applied through the addOrMergeValueHost() function.
     * Any ValueHost that gets updated will have its original instance disposed.
     * Be sure to discard any reference to the ValueHost instance that you have.
     */
    startModifying(): ValueHostsManagerConfigModifier<ValueHostsManagerConfig>;
    
    /**
     * Upon changing the value of a ValueHost, other ValueHosts need to know. 
     * They may have Conditions that take the changed ValueHost into account and
     * will want to revalidate or set up a state to force revalidation.
     * This goes through those ValueHosts and notifies them.
     */
    notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostName, revalidate: boolean): void;
    
    /**
     * Report that a ValueHost had its instance state changed.
     * Invokes onValueHostInstanceStateChanged if setup.
     * @param valueHost 
     * @param instanceState 
     */
    notifyValueHostInstanceStateChanged(valueHost: IValueHost, instanceState: ValueHostInstanceState): void;

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
    services: IValueHostsServices;
    /**
     * Initial list of ValueHostConfigs. Here's where all of the action is!
     * Each ValueHostConfig describes one ValueHost (which is info about one value in your app),
     * plus its validation rules.
     * If rules need to be changed later, either create a new instance of ValueHostsManager
     * or use its addValueHost, addOrUpdateValueHost, discardValueHost methods.
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
     * the addValueHost or addOrUpdateValueHost methods.
     * If you don't have any state, leave this null or undefined and ValueHostsManager will
     * initialize its state.
     */
    savedValueHostInstanceStates?: Array<ValueHostInstanceState> | null;
}

export type ValueHostsManagerInstanceStateChangedHandler
 = (ValueHostsManager: IValueHostsManager, stateToRetain: ValueHostsManagerInstanceState) => void;

export type ValueHostsManagerConfigChangedHandler
 = (ValueHostsManager: IValueHostsManager, valueHostConfigs: Array<ValueHostConfig>) => void;

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

    /**
     * Use this when caching the configuration for a later creation of ValueHostsManager.
     * 
     * Called when the configuration of ValueHosts has been changed, usually
     * through the ValueHostsManagerConfigModifier.apply, or these members
     * of ValueHostsManager: addValueHost, addOrUpdateValueHost, addOrMergeValueHost,
     * discardValueHost.
     * The supplied object is a clone so modifications will not impact the ValueHostsManager.
     * 
     * Note that where a ValueHostConfig has a property that references a function,
     * you will have to retain that reference in some way to reuse it.
     * In particular, ValidatorConfig.conditionCreator.
     */
    onConfigChanged?: ValueHostsManagerConfigChangedHandler | null;

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
            test.addOrUpdateValueHost !== undefined &&
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