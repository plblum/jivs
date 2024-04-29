/**
 * Provides a container for ValueHosts that can be used
 * when working with a model or form. Ultimately in Jivs,
 * it serves the ValidationManager, but can work stand-alone.
 * Conditions are passed the ValueHostsManager meaning they
 * can be used independently of validation. 
 * @module Validation/Types/ValueHostsManager
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { IInputValueHostChangedCallback } from './InputValueHost';
import { IValidationServices } from './ValidationServices';
import { IValueHostCallbacks, ValueHostConfig, ValueHostInstanceState, toIValueHostCallbacks } from './ValueHost';
import { IValueHostResolver, toIValueHostResolver } from './ValueHostResolver';

/**
 * Provides a container for ValueHosts that can be used
 * when working with a model or form. Ultimately in Jivs,
 * it serves the ValueHostsManager, but can work stand-alone.
 * Conditions are passed the ValueHostsManager meaning they
 * can be used independently of validation. 
 */
export interface IValueHostsManager extends IValueHostResolver
{
    /**
     * If the user needs to abandon this instance, they should use this to 
     * clean up active resources (like timers)
     */
    dispose(): void;    
    
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
 * Provides the configuration for the ValueHostsManager constructor
 */
export interface ValueHostsManagerConfig extends IValueHostsManagerCallbacks
{
    /**
     * Provides services into the system. Dependency Injection and factories.
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
        if (test.notifyOtherValueHostsOfValueChange !== undefined)
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