/**
 * Factory for generating classes that implement IValueHost that use ValueHostConfig.
 * ValueHostConfig identifies the desired ValueHost class.
 * Most apps will use the standard InputValueHost class.
 * @module ValueHosts/Types/ValueHostFactory
 */

import { ValueHostConfig, ValueHostState, IValueHost } from './ValueHost';
import { IValueHostsManager } from './ValueHostResolver';

/**
 * Interface for creating ValueHostFactory classes.
 */
export interface IValueHostFactory {
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param config - determines the class. All classes supported here must ValueHostConfig to get their setup.
     * @param state - Allows restoring the state of the new ValueHost instance. Use Factory.createState() to create an initial value.
     */
    create(valueHostsManager: IValueHostsManager, config: ValueHostConfig, state: ValueHostState): IValueHost;
    /**
     * Adjusts the state from a previous time to conform to the Config.
     * For example, if the Config had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param config 
     */
    cleanupState(state: ValueHostState, config: ValueHostConfig): void;
    /**
     * Creates an initialized State object
     * @param config 
     */
    createState(config: ValueHostConfig): ValueHostState;
}

/**
 * Used by the ValueHostFactory to recognize a specific ValueHost class from the ValueHostConfig
 * and create it, plus create its state.
 */
export interface IValueHostGenerator {
    /**
     * Determines if it can by used to create the ValueHost instance based on the Config.
     * @param config 
     * @returns Can create when true.
     */
    canCreate(config: ValueHostConfig): boolean;
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param config 
     * @param state 
     */
    create(valueHostsManager: IValueHostsManager, config: ValueHostConfig, state: ValueHostState): IValueHost;
    /**
     * Adjusts the state from a previous time to conform to the Config.
     * For example, if the Config had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param config 
     */
    cleanupState(state: ValueHostState, config: ValueHostConfig): void;
    /**
     * Creates an initialized State object
     * @param config 
     */
    createState(config: ValueHostConfig): ValueHostState;
}

/**
 * Provides the values supported by the ValueHostFactory and its Generators
 * that map to each ValueHost class.
 */
export enum ValueHostType
{
/**
 * Associated with NonInputValueHost
 */    
    NonInput = 'NonInput',
/**
 * Associated with InputValueHost
 */    
    Input = 'Input'
}