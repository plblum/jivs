import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import {
    type IRequiredTextConditionDescriptor,
    RequiredTextConditionType, RequiredTextCondition
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
