import { BusinessLogicInputValueHostGenerator } from "./BusinessLogicInputValueHost";
import { InputValueHostGenerator } from "./InputValueHost";
import { AssertNotNull } from "../Utilities/ErrorHandling";
import type { IValueHostState, IValueHost, IValueHostDescriptor } from "../Interfaces/ValueHost";
import { IValueHostsManager } from "../Interfaces/ValueHostResolver";

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
 * Supports creating and working with various ValueHost implementations.
 */
export class ValueHostFactory implements IValueHostFactory {
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param descriptor 
     * @param state 
     */
    public Create(valueHostsManager: IValueHostsManager, descriptor: IValueHostDescriptor, state: IValueHostState): IValueHost {
        AssertNotNull(valueHostsManager, 'valueHostsManager');
        AssertNotNull(descriptor, 'descriptor');
        AssertNotNull(state, 'state');
        let generator = this.ResolveDescriptor(descriptor);
        // // we are going to modify the state without notifying the parent.
        // // This is intentional --- removed. Leave it to caller
        // if (!state && descriptor.InitialValue !== undefined) {
        //     state = generator.CreateState(descriptor);
        // }        
        return generator.Create(valueHostsManager, descriptor, state);
    }
    /**
     * Always returns a Generator or throws an exception if it fails.
     * @param descriptor 
     * @returns 
     */
    private ResolveDescriptor(descriptor: IValueHostDescriptor): IValueHostGenerator {
        if (!descriptor.Type)
            throw new Error('ValueHostDescriptor.Type field required');
        for (const generator of this._descriptorResolvers) {
            if (generator.CanCreate(descriptor))
                return generator;
        }
        throw new Error(`Unsupported ValueHostDescriptor ${descriptor.Type}`);
    }

    /**
     * Adjusts the state from a previous time to conform to the Descriptor.
     * For example, if the Descriptor had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param descriptor 
     */
    public CleanupState(state: IValueHostState, descriptor: IValueHostDescriptor): void {
        AssertNotNull(descriptor, 'descriptor');
        this.ResolveDescriptor(descriptor).CleanupState(state, descriptor);
    }
    /**
     * Creates an initialized State object
     * @param descriptor 
     */
    public CreateState(descriptor: IValueHostDescriptor): IValueHostState {
        AssertNotNull(descriptor, 'descriptor');
        return this.ResolveDescriptor(descriptor).CreateState(descriptor);
    }

    private _descriptorResolvers: Array<IValueHostGenerator> = [];

    /**
     * Add an ValueHostGenerator. The built-in generators are already registered.
     * @param generator 
     */
    public Register(generator: IValueHostGenerator): void {
        this._descriptorResolvers.push(generator);
    }

    /**
     * Utility to check for a registration
     * @param descriptor 
     * @returns 
     */
    public IsRegistered(descriptor: IValueHostDescriptor): boolean
    {
        for (const generator of this._descriptorResolvers) {
            if (generator.CanCreate(descriptor))
                return true;
        }
        return false;
    }
}

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

export function RegisterDefaultValueHostGenerators(factory: ValueHostFactory): void {
    factory.Register(new InputValueHostGenerator());
    factory.Register(new BusinessLogicInputValueHostGenerator());
}
