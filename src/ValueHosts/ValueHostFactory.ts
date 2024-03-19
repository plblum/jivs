/**
 * Factory for generating classes that implement IValueHost that use ValueHostDescriptor.
 * ValueHostDescriptor identifies the desired implementation.
 * Most apps will use the ValueHost and InputValueHost class implementations.
 * When adding a new ValueHost class, implement an IValueHostGenerator and register it
 * with the ValueHostFactory.
 * @module ValueHosts/ConcreteClasses/ValueHostFactory
 */

import { BusinessLogicInputValueHostGenerator } from "./BusinessLogicInputValueHost";
import { InputValueHostGenerator } from "./InputValueHost";
import { AssertNotNull } from "../Utilities/ErrorHandling";
import type { ValueHostState, IValueHost, ValueHostDescriptor } from "../Interfaces/ValueHost";
import type { IValueHostsManager } from "../Interfaces/ValueHostResolver";
import { NonInputValueHostGenerator } from "./NonInputValueHost";
import type { IValueHostFactory, IValueHostGenerator } from "../Interfaces/ValueHostFactory";

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
    public Create(valueHostsManager: IValueHostsManager, descriptor: ValueHostDescriptor, state: ValueHostState): IValueHost {
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
    private ResolveDescriptor(descriptor: ValueHostDescriptor): IValueHostGenerator {
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
    public CleanupState(state: ValueHostState, descriptor: ValueHostDescriptor): void {
        AssertNotNull(descriptor, 'descriptor');
        this.ResolveDescriptor(descriptor).CleanupState(state, descriptor);
    }
    /**
     * Creates an initialized State object
     * @param descriptor 
     */
    public CreateState(descriptor: ValueHostDescriptor): ValueHostState {
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
    public IsRegistered(descriptor: ValueHostDescriptor): boolean
    {
        for (const generator of this._descriptorResolvers) {
            if (generator.CanCreate(descriptor))
                return true;
        }
        return false;
    }
}


export function RegisterStandardValueHostGenerators(factory: ValueHostFactory): void {
    factory.Register(new InputValueHostGenerator());
    factory.Register(new NonInputValueHostGenerator());
    factory.Register(new BusinessLogicInputValueHostGenerator());
}
