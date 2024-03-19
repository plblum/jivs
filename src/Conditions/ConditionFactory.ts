/**
 * For creating Conditions given an ConditionDescriptor.
 * Setup its instance on ValidationServices.ConditionFactory.
 * @module Conditions/ConditionFactory
 */
import { NameToFunctionMapper } from "../Utilities/NameToFunctionMap";
import type { ConditionDescriptor, ICondition, IConditionCore, IConditionFactory } from "../Interfaces/Conditions";
import { ConditionType } from "./ConditionTypes";

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
    public Create<TDescriptor extends ConditionDescriptor>
        (descriptor: TDescriptor): IConditionCore<TDescriptor> {
        let fn = this._map.Get(descriptor.Type);
        if (fn)
            return fn(descriptor) as IConditionCore<TDescriptor>;
        throw new Error(`Condition Type not supported: ${descriptor.Type}`);
    }
    // user supplies JSON string or object implementing ConditionDescriptor
    // and it returns an instance of IValidator.

    private _map = new NameToFunctionMapper<ConditionDescriptor, ICondition>();

    /**
     * Add or replace a function to create an instance of the Condition
     * given a ConditionDescriptor.
     * @param type - Unique way to select the function. Uses ConditionDescriptor.Type.
     * @param fn - Expected to create an instance of a Condition.
     */
    public Register<TDescriptor extends ConditionDescriptor>(type: ConditionType | string,
        fn: (descriptor: TDescriptor) => IConditionCore<TDescriptor>): void {
        this._map.Register(type, fn as any);
    }

    /**
     * Utility to determine if a ConditionType has been registered.
     * @param conditionType 
     * @returns 
     */
    public IsRegistered(conditionType: ConditionType | string): boolean {
        return this._map.Get(conditionType) !== undefined;
    }
}

//#endregion ConditionFactory