import { ConditionFactory, RegisterStandardConditions } from "../../src/Conditions/ConditionFactory";
import {
    type IRequiredTextConditionDescriptor,
    RequiredTextConditionType, RequiredTextCondition,
    RequiredIndexConditionType, RangeConditionType, ValuesEqualConditionType, ValuesNotEqualConditionType,
    ValueGTSecondValueConditionType, ValueGTESecondValueConditionType, ValueLTSecondValueConditionType,
    ValueLTESecondValueConditionType, StringLengthConditionType, DataTypeCheckConditionType,
    AndConditions, OrConditions, EveryConditionType, AnyConditionsType, CountMatchingConditionsType,
    RegExpConditionType, AndConditionsType, OrConditionsType
} from "../../src/Conditions/ConcreteConditions";
import type { IConditionCore, IConditionDescriptor } from "../../src/Interfaces/Conditions";

describe('ConditionFactory.Create', () => {
    test('Create with registered Condition creates the correct instance', () => {
        let factory = new ConditionFactory();
        expect(() => factory.Register<IRequiredTextConditionDescriptor>(
            RequiredTextConditionType, (descriptor) => new RequiredTextCondition(descriptor))).not.toThrow();
        let condition: IConditionCore<IRequiredTextConditionDescriptor> | null = null;
        expect(() => condition = factory.Create<IRequiredTextConditionDescriptor>({
            Type: RequiredTextConditionType,
            ValueHostId: null
        })).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequiredTextCondition);
        expect(condition!.Descriptor.Type).toBe(RequiredTextConditionType);
        expect(condition!.Descriptor.ValueHostId).toBeNull();

    });
    test('Create with unregistered Condition throws', () => {
        let factory = new ConditionFactory();
        expect(() => factory.Register<IRequiredTextConditionDescriptor>(
            RequiredTextConditionType, (descriptor) => new RequiredTextCondition(descriptor))).not.toThrow();
        let condition: IConditionCore<IConditionDescriptor> | null = null;
        expect(() => condition = factory.Create({
            Type: 'UnknownType',
            ValueHostId: null
        })).toThrow(/not supported/);

    });
});

describe('RegisterStandardConditions', () => {
    test('Check all are registered', () => {
        function CheckForConditionType(conditionType: string): void
        {
            expect(testItem.IsRegistered(conditionType)).toBe(true);
            let condition: IConditionCore<IConditionDescriptor> | null = null;
            expect(() => condition = testItem.Create({
                Type: conditionType,
                ValueHostId: null
            })).not.toThrow();
            expect(condition).not.toBeNull();
            expect(condition!.Descriptor.Type).toBe(conditionType);
        }
        let testItem = new ConditionFactory();
        RegisterStandardConditions(testItem);
        CheckForConditionType(RequiredTextConditionType);
        CheckForConditionType(RequiredIndexConditionType);
        CheckForConditionType(RangeConditionType);
        CheckForConditionType(ValuesEqualConditionType);
        CheckForConditionType(ValuesNotEqualConditionType);
        CheckForConditionType(ValueGTSecondValueConditionType);
        CheckForConditionType(ValueGTESecondValueConditionType);
        CheckForConditionType(ValueLTSecondValueConditionType);
        CheckForConditionType(ValueLTESecondValueConditionType);
        CheckForConditionType(StringLengthConditionType);
        CheckForConditionType(DataTypeCheckConditionType);
        CheckForConditionType(AndConditionsType);
        CheckForConditionType(OrConditionsType);
        CheckForConditionType(EveryConditionType);
        CheckForConditionType(AnyConditionsType);
        CheckForConditionType(CountMatchingConditionsType);
        CheckForConditionType(RegExpConditionType);
   
    });
})