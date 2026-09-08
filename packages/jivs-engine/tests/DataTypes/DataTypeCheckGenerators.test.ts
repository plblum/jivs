import {
    IntegerDataTypeCheckGenerator,
    RegExpDataTypeCheckGenerator
} from './../../src/DataTypes/DataTypeCheckGenerators';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { MockValueHostsManager, MockJivsServices } from '../TestSupport/mocks';
import { ConditionEvaluateResult, ICondition } from '../../src/Interfaces/Conditions';
import { DataTypeCheckCondition, IntegerCondition, RegExpCondition } from '../../src/Conditions/ConcreteConditions';


describe('DataTypeCheckGenerator concrete classes', () => {
    describe('IntegerDataTypeCheckGenerator', () => {
        test('supportsValue is true for LookupKey.Integer only', () => {
            let testItem = new IntegerDataTypeCheckGenerator();
            expect(testItem.supportsValue(LookupKey.Integer)).toBe(true);
            expect(testItem.supportsValue(LookupKey.Number)).toBe(false);
        });
        test('created with alternative lookupkey, supportsValue is true for supplied lookup key only', () => {
            let testItem = new IntegerDataTypeCheckGenerator('TEST');
            expect(testItem.supportsValue('TEST')).toBe(true);
            expect(testItem.supportsValue(LookupKey.Integer)).toBe(false);
            expect(testItem.supportsValue(LookupKey.Number)).toBe(false);
        });        
        test('createConditions', () => {
            let services = new MockJivsServices(true, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost('Field1', LookupKey.Integer, 'Field 1');
            let testItem = new IntegerDataTypeCheckGenerator();
            let results: Array<ICondition> = [];

            expect(() => results = testItem.createConditions(vh, LookupKey.Integer, services.conditionFactory)).not.toThrow();
            expect(results.length).toBe(2);
            expect(results[0]).toBeInstanceOf(DataTypeCheckCondition);
            expect(results[1]).toBeInstanceOf(IntegerCondition);
            let dtc = results[0] as DataTypeCheckCondition;
            let names = new Set<string>();
            dtc.gatherValueHostNames(names, vhm);
            expect(names.has('Field1')).toBe(true);
            let ic = results[0] as IntegerCondition;
            let names2 = new Set<string>();
            ic.gatherValueHostNames(names2, vhm);
            expect(names2.has('Field1')).toBe(true);            
        });
    });
    describe('RegExpDataTypeCheckGenerator', () =>
    {
        
        class Publicify_RegExpDataTypeCheckGenerator extends RegExpDataTypeCheckGenerator {
            public getPublicDataTypeLookupKey(): string {
                return this.dataTypeLookupKey;
            }
            public getPublicRegExp(): RegExp {
                return this.RegExp;
            }
        }
        // constructor tests for Publicify_RegExpDataTypeCheckGenerator
        test('public getters return correct values', () => {
            let testItem = new Publicify_RegExpDataTypeCheckGenerator('TEST', /abc/);
            expect(testItem.getPublicDataTypeLookupKey()).toBe('TEST');
            expect(testItem.getPublicRegExp().source).toBe('abc');
        });
        // array of strings converts correctly
        test('array of strings converts correctly', () => {
            let testItem = new Publicify_RegExpDataTypeCheckGenerator('TEST', ['abc', 'def']);
            expect(testItem.getPublicDataTypeLookupKey()).toBe('TEST');
            expect(testItem.getPublicRegExp().source).toBe('^abc|def$');
            expect(testItem.getPublicRegExp().flags).toBe('');
        });
        test('constructor throws when data is null', () =>
        {
            expect(() => new RegExpDataTypeCheckGenerator('TEST', null as any)).toThrow();
        });        
        // Tests for RegExpDataTypeCheckGenerator would go here
        test('supportsValue is true for the supplied lookup key only', () => {
            let testItem = new RegExpDataTypeCheckGenerator('TEST', /abc/);
            expect(testItem.supportsValue('TEST')).toBe(true);
            expect(testItem.supportsValue(LookupKey.Integer)).toBe(false);
            expect(testItem.supportsValue(LookupKey.Number)).toBe(false);
        });
        // array of strings
        test('supportsValue is true for the supplied lookup key only with array of strings', () => {
            let testItem = new RegExpDataTypeCheckGenerator('TEST', ['abc', 'def']);
            expect(testItem.supportsValue('TEST')).toBe(true);
            expect(testItem.supportsValue(LookupKey.Integer)).toBe(false);
            expect(testItem.supportsValue(LookupKey.Number)).toBe(false);
        });
        // null throws

        test('createConditions from regexp data', () => {
            let services = new MockJivsServices(true, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost('Field1', 'TEST', 'Field 1');
            let testItem = new RegExpDataTypeCheckGenerator('TEST', /abc/);
            let results: Array<ICondition> = [];

            expect(() => results = testItem.createConditions(vh, 'TEST', services.conditionFactory)).not.toThrow();
            expect(results.length).toBe(2);
            expect(results[0].constructor.name).toBe('DataTypeCheckCondition');
            expect(results[1].constructor.name).toBe('RegExpCondition');

            // test with data in evaluate() function
            let condition = results[1] as RegExpCondition;
            vh.setValue('abc');
            expect(condition.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue('def');
            expect(condition.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue('ABC');
            expect(condition.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);

        });
        test('createConditions from array of strings', () => {
            let services = new MockJivsServices(true, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost('Field1', 'TEST', 'Field 1');
            let testItem = new RegExpDataTypeCheckGenerator('TEST', ['abc', 'def']);
            let results: Array<ICondition> = [];

            expect(() => results = testItem.createConditions(vh, 'TEST', services.conditionFactory)).not.toThrow();
            expect(results.length).toBe(2);
            expect(results[0].constructor.name).toBe('DataTypeCheckCondition');
            expect(results[1].constructor.name).toBe('RegExpCondition');

            // test with data in evaluate() function
            let condition = results[1] as RegExpCondition;
            vh.setValue('abc');
            expect(condition.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue('def');
            expect(condition.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue('ghi');
            expect(condition.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue('a');
            expect(condition.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue('ABC');
            expect(condition.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
    });
});