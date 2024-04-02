/**
 * For creating Conditions given an ConditionDescriptor.
 * Setup its instance on ValidationServices.ConditionFactory.
 * @module Conditions/ConcreteClasses/ConditionFactory
 */
import { NameToFunctionMapper } from '../Utilities/NameToFunctionMap';
import type { ConditionDescriptor, ICondition, IConditionCore, IConditionFactory } from '../Interfaces/Conditions';
import { ConditionType } from './ConditionTypes';

//#region ConditionFactory


/**
 * Creates instances of Conditions given an ConditionDescriptor.
 * Setup its instance on ValidationServices.ConditionFactory.
 * ConditionDescriptor.Type is used to determine the Condition class to create.
 * Supports IConditionCore implementations of ICondition.
 */
export class ConditionFactory implements IConditionFactory {
    /**
     * Create an instance of a Condition from the ConditionDescriptor.
     * @param descriptor 
     * @returns 
     */
    public create<TDescriptor extends ConditionDescriptor>
        (descriptor: TDescriptor): IConditionCore<TDescriptor> {
        let fn = this._map.get(descriptor.type);
        if (fn)
            return fn(descriptor) as IConditionCore<TDescriptor>;
        throw new Error(`Condition Type not supported: ${descriptor.type}`);
    }
    // user supplies JSON string or object implementing ConditionDescriptor
    // and it returns an instance of IValidator.

    private readonly _map = new NameToFunctionMapper<ConditionDescriptor, ICondition>();

    /**
     * Add or replace a function to create an instance of the Condition
     * given a ConditionDescriptor.
     * @param type - Unique way to select the function. Uses ConditionDescriptor.Type.
     * @param fn - Expected to create an instance of a Condition.
     */
    public register<TDescriptor extends ConditionDescriptor>(type: string,
        fn: (descriptor: TDescriptor) => IConditionCore<TDescriptor>): void {
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