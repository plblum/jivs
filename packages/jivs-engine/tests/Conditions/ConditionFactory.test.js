import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { RequiredTextCondition } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
describe('ConditionFactory.create', () => {
    test('create with registered Condition creates the correct instance', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register(ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor))).not.toThrow();
        let condition = null;
        expect(() => condition = factory.create({
            type: ConditionType.RequiredText,
            valueHostId: null
        })).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequiredTextCondition);
        expect(condition.descriptor.type).toBe(ConditionType.RequiredText);
        expect(condition.descriptor.valueHostId).toBeNull();
    });
    test('create with unregistered Condition throws', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register(ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor))).not.toThrow();
        let condition = null;
        expect(() => condition = factory.create({
            type: 'UnknownType',
            ValueHostId: null
        })).toThrow(/not supported/);
    });
});
//# sourceMappingURL=ConditionFactory.test.js.map