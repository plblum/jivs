/**
 * Factory for generating classes that implement IValueHost that use ValueHostDescriptor.
 * ValueHostDescriptor identifies the desired ValueHost class.
 * Most apps will use the standard InputValueHost class.
 * @module ValueHosts/Types/ValueHostFactory
 */

import { ValueHostDescriptor, ValueHostState, IValueHost } from './ValueHost';
import { IValueHostsManager } from './ValueHostResolver';

/**
 * Interface for creating ValueHostFactory classes.
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

/**
 * Used by the ValueHostFactory to recognize a specific ValueHost class from the ValueHostDescriptor
 * and create it, plus create its state.
 */
export interface IValueHostGenerator {
    /**
     * Determines if it can by used to create the ValueHost instance based on the Descriptor.
     * @param descriptor 
     * @returns Can create when true.
     */
    canCreate(descriptor: ValueHostDescriptor): boolean;
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param descriptor 
     * @param state 
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