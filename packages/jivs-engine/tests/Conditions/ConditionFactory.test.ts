import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import {
    type RequireTextConditionConfig,
    RequireTextCondition
} from "../../src/Conditions/ConcreteConditions";
import type { IConditionCore, ConditionConfig } from "../../src/Interfaces/Conditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { FluentConditionCollector } from "../../src/ValueHosts/Fluent";
import { enableFluentConditions } from "../../src/Conditions/FluentConditionCollectorExtensions";

describe('ConditionFactory.create', () => {
    test('create with registered Condition creates the correct instance', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register<RequireTextConditionConfig>(
            ConditionType.RequireText, (config) => new RequireTextCondition(config))).not.toThrow();
        let condition: IConditionCore<RequireTextConditionConfig> | null = null;
        expect(() => condition = factory.create<RequireTextConditionConfig>({
            conditionType: ConditionType.RequireText,
            valueHostName: null
        })).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequireTextCondition);
        expect(condition!.config.conditionType).toBe(ConditionType.RequireText);
        expect(condition!.config.valueHostName).toBeNull();

    });
    test('create with unregistered Condition throws', () => {
        let factory = new ConditionFactory();
        expect(() => factory.register<RequireTextConditionConfig>(
            ConditionType.RequireText, (config) => new RequireTextCondition(config))).not.toThrow();
        let condition: IConditionCore<ConditionConfig> | null = null;
        expect(() => condition = factory.create(<ConditionConfig>{
            conditionType: 'UnknownType',
            ValueHostName: null
        })).toThrow(/not registered/);
    });
    test('create with conditionType = undefined throws', () => {
        let factory = new ConditionFactory();
        let condition: IConditionCore<ConditionConfig> | null = null;
        expect(() => condition = factory.create(<any>{  })).toThrow(/not assigned/);
    });    
    test('create with conditionType = null throws', () => {
        let factory = new ConditionFactory();
        let condition: IConditionCore<ConditionConfig> | null = null;
        expect(() => condition = factory.create(<any>{ conditionType: null  })).toThrow(/not assigned/);
    });        
    test('isRegistered', () => {
        let factory = new ConditionFactory();
        expect(factory.isRegistered(ConditionType.RequireText)).toBe(false);
        expect(() => factory.register<RequireTextConditionConfig>(
            ConditionType.RequireText, (config) => new RequireTextCondition(config))).not.toThrow();
        expect(factory.isRegistered(ConditionType.RequireText)).toBe(true);

    });    
});
describe('enableFluentConditions', () => {
    test('First call works and second call does not throw', () => {
        expect(FluentConditionCollector.prototype.dataTypeCheck).toBeUndefined();
        enableFluentConditions();
        expect(FluentConditionCollector.prototype.dataTypeCheck).toBeDefined();
        expect(() => enableFluentConditions()).not.toThrow();
        expect(FluentConditionCollector.prototype.dataTypeCheck).toBeDefined();
    });
});
describe('dispose()', () => {
    test('using functions after dispose throw TypeError', () => {
        let factory = new ConditionFactory();
        factory.dispose();
        expect(() => factory.create({ conditionType: ConditionType.RequireText })).toThrow(TypeError);
        expect(() => factory.isRegistered(ConditionType.RequireText)).toThrow(TypeError);
        expect(() => factory.register<RequireTextConditionConfig>(ConditionType.RequireText, (config) => new RequireTextCondition(config))).toThrow(TypeError);
    });
});