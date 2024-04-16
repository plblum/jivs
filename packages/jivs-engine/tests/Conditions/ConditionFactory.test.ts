import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import {
    type RequiredTextConditionConfig,
    RequiredTextCondition
} from "../../src/Conditions/ConcreteConditions";
import type { IConditionCore, ConditionConfig } from "../../src/Interfaces/Conditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";

describe('ConditionFactory.create', () => {
    test('create with registered Condition creates the correct instance', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register<RequiredTextConditionConfig>(
            ConditionType.RequiredText, (config) => new RequiredTextCondition(config))).not.toThrow();
        let condition: IConditionCore<RequiredTextConditionConfig> | null = null;
        expect(() => condition = factory.create<RequiredTextConditionConfig>({
            type: ConditionType.RequiredText,
            valueHostName: null
        })).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequiredTextCondition);
        expect(condition!.config.type).toBe(ConditionType.RequiredText);
        expect(condition!.config.valueHostName).toBeNull();

    });
    test('create with unregistered Condition throws', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register<RequiredTextConditionConfig>(
            ConditionType.RequiredText, (config) => new RequiredTextCondition(config))).not.toThrow();
        let condition: IConditionCore<ConditionConfig> | null = null;
        expect(() => condition = factory.create(<ConditionConfig>{
            type: 'UnknownType',
            ValueHostName: null
        })).toThrow(/not supported/);

    });
});
