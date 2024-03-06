import { IValueHostDescriptor, IValueHostState, IValueHost } from "./ValueHost";
import { IValueHostsManager } from "./ValueHostResolver";

/**
 * Factory for generating classes that implement IValueHost that use IValueHostDescriptor.
 * IValueHostDescriptor identifies the desired ValueHost class.
 * Most apps will use the standard InputValueHost class.
 * This interface targets unit testing with mocks.
 */
export interface IValueHostFactory {
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param descriptor - determines the class. All classes supported here must IValueHostDescriptor to get their setup.
     * @param state - Allows restoring the state of the new ValueHost instance. Use Factory.CreateState() to create an initial value.
     */
    Create(valueHostsManager: IValueHostsManager, descriptor: IValueHostDescriptor, state: IValueHostState): IValueHost;
    /**
     * Adjusts the state from a previous time to conform to the Descriptor.
     * For example, if the Descriptor had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param descriptor 
     */
    CleanupState(state: IValueHostState, descriptor: IValueHostDescriptor): void;
    /**
     * Creates an initialized State object
     * @param descriptor 
     */
    CreateState(descriptor: IValueHostDescriptor): IValueHostState;
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
    CanCreate(descriptor: IValueHostDescriptor): boolean;
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param descriptor 
     * @param state 
     */
    Create(valueHostsManager: IValueHostsManager, descriptor: IValueHostDescriptor, state: IValueHostState): IValueHost;
    /**
     * Adjusts the state from a previous time to conform to the Descriptor.
     * For example, if the Descriptor had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param descriptor 
     */
    CleanupState(state: IValueHostState, descriptor: IValueHostDescriptor): void;
    /**
     * Creates an initialized State object
     * @param descriptor 
     */
    CreateState(descriptor: IValueHostDescriptor): IValueHostState;
}
