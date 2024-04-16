import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import {
    type RequireTextConditionConfig,
    RequireTextCondition
} from "../../src/Conditions/ConcreteConditions";
import type { IConditionCore, ConditionConfig } from "../../src/Interfaces/Conditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";

describe('ConditionFactory.create', () => {
    test('create with registered Condition creates the correct instance', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register<RequireTextConditionConfig>(
            ConditionType.RequireText, (config) => new RequireTextCondition(config))).not.toThrow();
        let condition: IConditionCore<RequireTextConditionConfig> | null = null;
        expect(() => condition = factory.create<RequireTextConditionConfig>({
            type: ConditionType.RequireText,
            valueHostName: null
        })).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequireTextCondition);
        expect(condition!.config.type).toBe(ConditionType.RequireText);
        expect(condition!.config.valueHostName).toBeNull();

    });
    test('create with unregistered Condition throws', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register<RequireTextConditionConfig>(
            ConditionType.RequireText, (config) => new RequireTextCondition(config))).not.toThrow();
        let condition: IConditionCore<ConditionConfig> | null = null;
        expect(() => condition = factory.create(<ConditionConfig>{
            type: 'UnknownType',
            ValueHostName: null
        })).toThrow(/not supported/);

    });
});
