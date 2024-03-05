
import type {
    IRequiredTextConditionDescriptor,
    IRequiredIndexConditionDescriptor, IRangeConditionDescriptor, ICompareToConditionDescriptor,
    IStringLengthConditionDescriptor,
    IRegExpConditionDescriptor,
    IDataTypeCheckConditionDescriptor,
    IAndConditionsDescriptor,
    IOrConditionsDescriptor,
    ICountMatchingConditionsDescriptor,
} from "./ConcreteConditions";
import {
    RequiredTextConditionType, RequiredTextCondition,
    RequiredIndexConditionType, RequiredIndexCondition, RangeConditionType,
    RangeCondition, ValuesEqualConditionType, ValuesEqualCondition, ValuesNotEqualConditionType,
    ValuesNotEqualCondition, ValueGTSecondValueConditionType, ValueGTSecondValueCondition, ValueLTSecondValueConditionType, ValueLTSecondValueCondition,
    ValueGTESecondValueConditionType, ValueGTESecondValueCondition, ValueLTESecondValueConditionType, ValueLTESecondValueCondition,
    StringLengthConditionType, StringLengthCondition, RegExpConditionType, RegExpCondition, AndConditions, AndConditionsType,
    CountMatchingConditions, OrConditions, OrConditionsType, CountMatchingConditionsType, EveryConditionType, AnyConditionsType,
    DataTypeCheckCondition, DataTypeCheckConditionType
} from "./ConcreteConditions";
import { NameToFunctionMapper } from "../Utilities/NameToFunctionMap";
import { IConditionDescriptor, ICondition, IConditionCore } from "../Interfaces/Conditions";

//#region ConditionFactory

/**
 * Creates instances of Conditions given an IConditionDescriptor.
 * IConditionDescriptor.Type is used to determine the Condition class to create.
 */
export interface IConditionFactory {
    /**
     * Create an instance of a Condition from the IConditionDescriptor.
     * @param descriptor 
     * @returns 
     */
    Create(descriptor: IConditionDescriptor): ICondition;
}

/**
 * Creates instances of Conditions given an IConditionDescriptor.
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
    public Register<TDescriptor extends IConditionDescriptor>(type: string,
        fn: (descriptor: TDescriptor) => IConditionCore<TDescriptor>): void {
        this._map.Register(type, fn as any);
    }

    /**
     * Utility to determine if a ConditionType has been registered.
     * @param conditionType 
     * @returns 
     */
    public IsRegistered(conditionType: string): boolean {
        return this._map.Get(conditionType) !== undefined;
    }
}

export function RegisterStandardConditions(factory: ConditionFactory): void {
    factory.Register<IDataTypeCheckConditionDescriptor>(
        DataTypeCheckConditionType, (descriptor) => new DataTypeCheckCondition(descriptor));
    factory.Register<IRequiredTextConditionDescriptor>(
        RequiredTextConditionType, (descriptor) => new RequiredTextCondition(descriptor));
    factory.Register<IRequiredIndexConditionDescriptor>(
        RequiredIndexConditionType, (descriptor) => new RequiredIndexCondition(descriptor));
    factory.Register<IRegExpConditionDescriptor>(
        RegExpConditionType, (descriptor) => new RegExpCondition(descriptor));
    factory.Register<IRangeConditionDescriptor>(
        RangeConditionType, (descriptor) => new RangeCondition(descriptor));
    factory.Register<ICompareToConditionDescriptor>(
        ValuesEqualConditionType, (descriptor) => new ValuesEqualCondition(descriptor));
    factory.Register<ICompareToConditionDescriptor>
        (ValuesNotEqualConditionType, (descriptor) => new ValuesNotEqualCondition(descriptor));
    factory.Register<ICompareToConditionDescriptor>
        (ValueGTSecondValueConditionType, (descriptor) => new ValueGTSecondValueCondition(descriptor));
    factory.Register<ICompareToConditionDescriptor>
        (ValueLTSecondValueConditionType, (descriptor) => new ValueLTSecondValueCondition(descriptor));
    factory.Register<ICompareToConditionDescriptor>
        (ValueGTESecondValueConditionType, (descriptor) => new ValueGTESecondValueCondition(descriptor));
    factory.Register<ICompareToConditionDescriptor>
        (ValueLTESecondValueConditionType, (descriptor) => new ValueLTESecondValueCondition(descriptor));
    factory.Register<IStringLengthConditionDescriptor>
        (StringLengthConditionType, (descriptor) => new StringLengthCondition(descriptor));
    factory.Register<IAndConditionsDescriptor>
        (AndConditionsType, (descriptor) => new AndConditions(descriptor));
    factory.Register<IOrConditionsDescriptor>
        (OrConditionsType, (descriptor) => new OrConditions(descriptor));
    factory.Register<ICountMatchingConditionsDescriptor>
        (CountMatchingConditionsType, (descriptor) => new CountMatchingConditions(descriptor));
    // aliases for users who don't deal well with boolean logic can relate
    factory.Register<IAndConditionsDescriptor>
        (EveryConditionType, (descriptor) => new AndConditions(descriptor));
    factory.Register<IOrConditionsDescriptor>
        (AnyConditionsType, (descriptor) => new OrConditions(descriptor));    
}
//#endregion ConditionFactory