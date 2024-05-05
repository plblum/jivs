/**
 * Factory for generating classes that implement IValueHost that use ValueHostConfig.
 * ValueHostConfig identifies the desired implementation.
 * Most apps will use the ValueHost and InputValueHost class implementations.
 * When adding a new ValueHost class, implement an IValueHostGenerator and register it
 * with the ValueHostFactory.
 * @module ValueHosts/ConcreteClasses/ValueHostFactory
 */

import { BusinessLogicErrorsValueHostGenerator } from './BusinessLogicErrorsValueHost';
import { InputValueHostGenerator } from './InputValueHost';
import { assertNotNull } from '../Utilities/ErrorHandling';
import type { ValueHostInstanceState, IValueHost, ValueHostConfig } from '../Interfaces/ValueHost';
import type { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { StaticValueHostGenerator } from './StaticValueHost';
import type { IValueHostFactory, IValueHostGenerator } from '../Interfaces/ValueHostFactory';
import { CalcValueHostGenerator } from './CalcValueHost';
import { PropertyValueHostGenerator } from './PropertyValueHost';

/**
 * Supports creating and working with various ValueHost implementations.
 */
export class ValueHostFactory implements IValueHostFactory {
    /**
     * Creates the instance.
     * @param valueHostsManager 
     * @param config 
     * @param state 
     */
    public create(valueHostsManager: IValueHostsManager, config: ValueHostConfig, state: ValueHostInstanceState): IValueHost {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(config, 'config');
        assertNotNull(state, 'state');
        let generator = this.resolveConfig(config);
        // // we are going to modify the state without notifying the parent.
        // // This is intentional --- removed. Leave it to caller
        // if (!state && config.InitialValue !== undefined) {
        //     state = generator.createInstanceState(config);
        // }        
        return generator.create(valueHostsManager, config, state);
    }
    /**
     * Always returns a Generator or throws an exception if it fails.
     * @param config 
     * @returns 
     */
    private resolveConfig(config: ValueHostConfig): IValueHostGenerator {
        if (!config.valueHostType)
            throw new Error('ValueHostConfig.valueHostType field required');
        for (const generator of this._configResolvers) {
            if (generator.canCreate(config))
                return generator;
        }
        throw new Error(`Unsupported ValueHostConfig ${config.valueHostType}`);
    }

    /**
     * Adjusts the state from a previous time to conform to the Config.
     * For example, if the Config had a rule change, some data in the state may
     * be obsolete and can be discarded.
     * @param state 
     * @param config 
     */
    public cleanupInstanceState(state: ValueHostInstanceState, config: ValueHostConfig): void {
        assertNotNull(config, 'config');
        this.resolveConfig(config).cleanupInstanceState(state, config);
    }
    /**
     * Creates an initialized InstanceState object
     * @param config 
     */
    public createInstanceState(config: ValueHostConfig): ValueHostInstanceState {
        assertNotNull(config, 'config');
        return this.resolveConfig(config).createInstanceState(config);
    }

    private readonly _configResolvers: Array<IValueHostGenerator> = [];

    /**
     * Add an ValueHostGenerator. The built-in generators are already registered.
     * @param generator 
     */
    public register(generator: IValueHostGenerator): void {
        this._configResolvers.push(generator);
    }

    /**
     * Utility to check for a registration
     * @param config 
     * @returns 
     */
    public isRegistered(config: ValueHostConfig): boolean
    {
        for (const generator of this._configResolvers) {
            if (generator.canCreate(config))
                return true;
        }
        return false;
    }
}


export function registerStandardValueHostGenerators(factory: ValueHostFactory): void {
    factory.register(new InputValueHostGenerator());
    factory.register(new PropertyValueHostGenerator());
    factory.register(new StaticValueHostGenerator());
    factory.register(new CalcValueHostGenerator());
    factory.register(new BusinessLogicErrorsValueHostGenerator());    
}
