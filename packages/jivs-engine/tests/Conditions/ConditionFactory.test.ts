import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import {
    type RequireTextConditionConfig,
    RequireTextCondition
} from "../../src/Conditions/ConcreteConditions";
import { IConditionCore, ConditionConfig, ConditionCategory, ConditionEvaluateResult } from "../../src/Interfaces/Conditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { FluentConditionBuilder } from "../../src/ValueHosts/Fluent";
import { enableFluentConditions } from "../../src/Conditions/FluentConditionBuilderExtensions";
import { IValueHost } from "../../src/Interfaces/ValueHost";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";

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
        expect(FluentConditionBuilder.prototype.dataTypeCheck).toBeUndefined();
        enableFluentConditions();
        expect(FluentConditionBuilder.prototype.dataTypeCheck).toBeDefined();
        expect(() => enableFluentConditions()).not.toThrow();
        expect(FluentConditionBuilder.prototype.dataTypeCheck).toBeDefined();
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


describe('lazyLoad', () => {
    class NormalCondition implements IConditionCore<ConditionConfig>
    {
        config: ConditionConfig = { conditionType: 'Normal'};
        conditionType: string = 'Normal';
        evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
            throw new Error("Method not implemented.");
        }
        category: ConditionCategory = ConditionCategory.Undetermined;
    }
    class LazyLoadCondition implements IConditionCore<ConditionConfig>
    {
        config: ConditionConfig = { conditionType: 'LazyLoad'};
        conditionType: string = 'LazyLoad';
        evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
            throw new Error("Method not implemented.");
        }
        category: ConditionCategory = ConditionCategory.Undetermined;
    }    
    test('Call to register does not lazy load', () => {
        let testItem = new ConditionFactory();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register<ConditionConfig>('LazyLoad', (config)=> new LazyLoadCondition());
            loaded = true;
        };
        testItem.register<ConditionConfig>('Normal', (config)=> new NormalCondition());
        expect(loaded).toBe(false);
    });
    test('Call to create for already registered does not lazy load', () => {
        let testItem = new ConditionFactory();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register<ConditionConfig>('LazyLoad', (config)=> new LazyLoadCondition());
            loaded = true;
        };
        testItem.register<ConditionConfig>('Normal', (config)=> new NormalCondition());
        expect(loaded).toBe(false);
        expect(testItem.create({ conditionType: 'Normal' })).toBeInstanceOf(NormalCondition);
        expect(loaded).toBe(false);
 
    });
    test('Call to find for unregistered does load but later find does not load for unregistered', () => {
        let testItem = new ConditionFactory();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register<ConditionConfig>('LazyLoad', (config)=> new LazyLoadCondition());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.create({ conditionType: 'LazyLoad' })).toBeInstanceOf(LazyLoadCondition);
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(()=> testItem.create({ conditionType: 'Normal' })).toThrow();   //  not registered
        expect(loaded).toBe(false);
    });
    test('Call to find for unregistered does load but fails to load what it needs but has loaded one we use later', () => {
        let testItem = new ConditionFactory();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register<ConditionConfig>('LazyLoad', (config)=> new LazyLoadCondition());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(()=> testItem.create({ conditionType: 'Normal' })).toThrow();     // not registered
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.create({ conditionType: 'LazyLoad' })).toBeInstanceOf(LazyLoadCondition);

        expect(loaded).toBe(false);
    });    
});
describe('findRealName', () => {
    test('findRealName', () => {
        let testItem = new ConditionFactory();
        testItem.register<RequireTextConditionConfig>('RequireText', (config)=> new RequireTextCondition(config));
        expect(testItem.findRealName('')).toBeNull();
        expect(testItem.findRealName(' ')).toBeNull();
        expect(testItem.findRealName('RequireText')).toBe('RequireText');
        expect(testItem.findRealName(' RequireText ')).toBe('RequireText');
        expect(testItem.findRealName('requiretext')).toBe('RequireText');
        expect(testItem.findRealName(' requiretext ')).toBe('RequireText');

    });
});
 
