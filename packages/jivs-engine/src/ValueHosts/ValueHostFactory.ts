/**
 * Factory for generating classes that implement IValueHost that use ValueHostDescriptor.
 * ValueHostDescriptor identifies the desired implementation.
 * Most apps will use the ValueHost and InputValueHost class implementations.
 * When adding a new ValueHost class, implement an IValueHostGenerator and register it
 * with the ValueHostFactory.
 * @module ValueHosts/ConcreteClasses/ValueHostFactory
 */

import { BusinessLogicInputValueHostGenerator } from './BusinessLogicInputValueHost';
import { InputValueHostGenerator } from './InputValueHost';
import { assertNotNull } from '../Utilities/ErrorHandling';
import type { ValueHostState, IValueHost, ValueHostDescriptor } from '../Interfaces/ValueHost';
import type { IValueHostsManager } from '../Interfaces/ValueHostResolver';
import { NonInputValueHostGenerator } from './NonInputValueHost';
import type { IValueHostFactory, IValueHostGenerator } from '../Interfaces/ValueHostFactory';

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
    public create(valueHostsManager: IValueHostsManager, descriptor: ValueHostDescriptor, state: ValueHostState): IValueHost {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(descriptor, 'descriptor');
        assertNotNull(state, 'state');
        let generator = this.resolveDescriptor(descriptor);
        // // we are going to modify the state without notifying the parent.
        // // This is intentional --- removed. Leave it to caller
        // if (!state && descriptor.InitialValue !== undefined) {
        //     state = generator.createState(descriptor);
        // }        
        return generator.create(valueHostsManager, descriptor, state);
    }
    /**
     * Always returns a Generator or throws an exception if it fails.
     * @param descriptor 
     * @returns 
     */
    private resolveDescriptor(descriptor: ValueHostDescriptor): IValueHostGenerator {
        if (!descriptor.type)
            throw new Error('ValueHostDescriptor.Type field required');
        for (const generator of this._descriptorResolvers) {
            if (generator.canCreate(descriptor))
                return generator;
        }
        throw new Error(`Unsupported ValueHostDescriptor ${descriptor.type}`);
    }

    /**
     * Adjusts the state from a previous time to conform to the Descriptor.
     * For example, if the Descriptor had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param descriptor 
     */
    public cleanupState(state: ValueHostState, descriptor: ValueHostDescriptor): void {
        assertNotNull(descriptor, 'descriptor');
        this.resolveDescriptor(descriptor).cleanupState(state, descriptor);
    }
    /**
     * Creates an initialized State object
     * @param descriptor 
     */
    public createState(descriptor: ValueHostDescriptor): ValueHostState {
        assertNotNull(descriptor, 'descriptor');
        return this.resolveDescriptor(descriptor).createState(descriptor);
    }

    private readonly _descriptorResolvers: Array<IValueHostGenerator> = [];

    /**
     * Add an ValueHostGenerator. The built-in generators are already registered.
     * @param generator 
     */
    public register(generator: IValueHostGenerator): void {
        this._descriptorResolvers.push(generator);
    }

    /**
     * Utility to check for a registration
     * @param descriptor 
     * @returns 
     */
    public isRegistered(descriptor: ValueHostDescriptor): boolean
    {
        for (const generator of this._descriptorResolvers) {
            if (generator.canCreate(descriptor))
                return true;
        }
        return false;
    }
}


export function registerStandardValueHostGenerators(factory: ValueHostFactory): void {
    factory.register(new InputValueHostGenerator());
    factory.register(new NonInputValueHostGenerator());
    factory.register(new BusinessLogicInputValueHostGenerator());
}
