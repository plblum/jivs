import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import {
    type RequiredTextConditionDescriptor,
    RequiredTextCondition
} from "../../src/Conditions/ConcreteConditions";
import type { IConditionCore, ConditionDescriptor } from "../../src/Interfaces/Conditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";

describe('ConditionFactory.Create', () => {
    test('Create with registered Condition creates the correct instance', () => {
        let factory = new ConditionFactory();
        expect(() => factory.Register<RequiredTextConditionDescriptor>(
            ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor))).not.toThrow();
        let condition: IConditionCore<RequiredTextConditionDescriptor> | null = null;
        expect(() => condition = factory.Create<RequiredTextConditionDescriptor>({
            Type: ConditionType.RequiredText,
            ValueHostId: null
        })).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequiredTextCondition);
        expect(condition!.Descriptor.Type).toBe(ConditionType.RequiredText);
        expect(condition!.Descriptor.ValueHostId).toBeNull();

    });
    test('Create with unregistered Condition throws', () => {
        let factory = new ConditionFactory();
        expect(() => factory.Register<RequiredTextConditionDescriptor>(
            ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor))).not.toThrow();
        let condition: IConditionCore<ConditionDescriptor> | null = null;
        expect(() => condition = factory.Create({
            Type: 'UnknownType',
            ValueHostId: null
        })).toThrow(/not supported/);

    });
});
