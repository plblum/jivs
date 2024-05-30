import {
    IntegerDataTypeCheckGenerator
} from './../../src/DataTypes/DataTypeCheckGenerators';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { MockValidationManager, MockValidationServices } from '../TestSupport/mocks';
import { ICondition } from '../../src/Interfaces/Conditions';
import { DataTypeCheckCondition, IntegerCondition } from '../../src/Conditions/ConcreteConditions';


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
            let services = new MockValidationServices(true, true);
            let vm = new MockValidationManager(services);
            let vh = vm.addMockInputValueHost('Field1', LookupKey.Integer, 'Field 1');
            let testItem = new IntegerDataTypeCheckGenerator();
            let results: Array<ICondition> = [];

            expect(() => results = testItem.createConditions(vh, LookupKey.Integer, services.conditionFactory)).not.toThrow();
            expect(results.length).toBe(2);
            expect(results[0]).toBeInstanceOf(DataTypeCheckCondition);
            expect(results[1]).toBeInstanceOf(IntegerCondition);
            let dtc = results[0] as DataTypeCheckCondition;
            let names = new Set<string>();
            dtc.gatherValueHostNames(names, vm);
            expect(names.has('Field1')).toBe(true);
            let ic = results[0] as IntegerCondition;
            let names2 = new Set<string>();
            ic.gatherValueHostNames(names2, vm);
            expect(names2.has('Field1')).toBe(true);            
        });
    });
});