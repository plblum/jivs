/**
 * For creating Conditions given an IConditionDescriptor.
 * Setup its instance on ValidationServices.ConditionFactory.
 * @module Conditions/ConditionFactory
 */
import { NameToFunctionMapper } from "../Utilities/NameToFunctionMap";
import type { IConditionDescriptor, ICondition, IConditionCore, IConditionFactory } from "../Interfaces/Conditions";
import { ConditionType } from "./ConditionTypes";

//#region ConditionFactory


/**
 * Creates instances of Conditions given an IConditionDescriptor.
 * Setup its instance on ValidationServices.ConditionFactory.
 * IConditionDescriptor.Type is used to determine the Condition class to create.
 * Supports IConditionCore implementations of ICondition.
 */
export class ConditionFactory implements IConditionFactory {
    /**
     * Create an instance of a Condition from the IConditionDescriptor.
     * @param descriptor 
     * @returns 
     */
    public Create<TDescriptor extends IConditionDescriptor>
        (descriptor: TDescriptor): IConditionCore<TDescriptor> {
        let fn = this._map.Get(descriptor.Type);
        if (fn)
            return fn(descriptor) as IConditionCore<TDescriptor>;
        throw new Error(`Condition Type not supported: ${descriptor.Type}`);
    }
    // user supplies JSON string or object implementing IConditionDescriptor
    // and it returns an instance of IValidator.

    private _map = new NameToFunctionMapper<IConditionDescriptor, ICondition>();

    /**
     * Add or replace a function to create an instance of the Condition
     * given a ConditionDescriptor.
     * @param type - Unique way to select the function. Uses IConditionDescriptor.Type.
     * @param fn - Expected to create an instance of a Condition.
     */
    public Register<TDescriptor extends IConditionDescriptor>(type: ConditionType | string,
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