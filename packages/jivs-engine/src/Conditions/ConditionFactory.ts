/**
 * For creating Conditions given an ConditionConfig.
 * Setup its instance on ValidationServices.ConditionFactory.
 * @module Conditions/ConcreteClasses/ConditionFactory
 */
import { NameToFunctionMapper } from '../Utilities/NameToFunctionMap';
import type { ConditionConfig, ICondition, IConditionCore, IConditionFactory } from '../Interfaces/Conditions';

//#region ConditionFactory


/**
 * Creates instances of Conditions given an ConditionConfig.
 * Setup its instance on ValidationServices.ConditionFactory.
 * ConditionConfig.type is used to determine the Condition class to create.
 * Supports IConditionCore implementations of ICondition.
 */
export class ConditionFactory implements IConditionFactory {
    /**
     * Create an instance of a Condition from the ConditionConfig.
     * @param config 
     * @returns 
     */
    public create<TConfig extends ConditionConfig>
        (config: TConfig): IConditionCore<TConfig> {
        let fn = this._map.get(config.type);
        if (fn)
            return fn(config) as IConditionCore<TConfig>;
        throw new Error(`ConditionType not supported: ${config.type}`);
    }
    // user supplies JSON string or object implementing ConditionConfig
    // and it returns an instance of IValidator.

    private readonly _map = new NameToFunctionMapper<ConditionConfig, ICondition>();

    /**
     * Add or replace a function to create an instance of the Condition
     * given a ConditionConfig.
     * @param type - Unique way to select the function. Uses ConditionConfig.type.
     * @param fn - Expected to create an instance of a Condition.
     */
    public register<TConfig extends ConditionConfig>(type: string,
        fn: (config: TConfig) => IConditionCore<TConfig>): void {
        this._map.register(type, fn as any);
    }

    /**
     * Utility to determine if a ConditionType has been registered.
     * @param conditionType 
     * @returns 
     */
    public isRegistered(conditionType: string): boolean {
        return this._map.get(conditionType) !== undefined;
    }
}

//#endregion ConditionFactory