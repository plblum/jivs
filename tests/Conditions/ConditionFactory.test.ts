import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import {
    type RequiredTextConditionDescriptor,
    RequiredTextCondition
} from "../../src/Conditions/ConcreteConditions";
import type { IConditionCore, ConditionDescriptor } from "../../src/Interfaces/Conditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";

describe('ConditionFactory.create', () => {
    test('create with registered Condition creates the correct instance', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register<RequiredTextConditionDescriptor>(
            ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor))).not.toThrow();
        let condition: IConditionCore<RequiredTextConditionDescriptor> | null = null;
        expect(() => condition = factory.create<RequiredTextConditionDescriptor>({
            type: ConditionType.RequiredText,
            valueHostId: null
        })).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequiredTextCondition);
        expect(condition!.descriptor.type).toBe(ConditionType.RequiredText);
        expect(condition!.descriptor.valueHostId).toBeNull();

    });
    test('create with unregistered Condition throws', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register<RequiredTextConditionDescriptor>(
            ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor))).not.toThrow();
        let condition: IConditionCore<ConditionDescriptor> | null = null;
        expect(() => condition = factory.create(<ConditionDescriptor>{
            type: 'UnknownType',
            ValueHostId: null
        })).toThrow(/not supported/);

    });
});
