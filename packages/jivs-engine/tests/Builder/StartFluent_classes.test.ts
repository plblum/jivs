import { FluentValidatorBuilder } from './../../src/Builder/FluentValidatorBuilder';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { MockValidationServices } from '../TestSupport/mocks';
import { ValidationManagerStartFluent, ValueHostsManagerStartFluent } from './../../src/Builder/StartFluent_classes';
import { ICalcValueHost } from '../../src/Interfaces/CalcValueHost';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { SimpleValueType } from '../../src/Interfaces/DataTypeConverterService';

class Publicify_ValueHostsManagerStartFluent extends ValueHostsManagerStartFluent { 
    public get publicify_existingValueHostConfigs() {
        return this.existingValueHostConfigs;
    }
}
class Publicify_ValidationManagerStartFluent extends ValidationManagerStartFluent { 
    public get publicify_existingValueHostConfigs() {
        return this.existingValueHostConfigs;
    }
}

function createVMFluent(): Publicify_ValidationManagerStartFluent {
    return new Publicify_ValidationManagerStartFluent(null, new MockValidationServices(true, true));
}
function createVHFluent(): Publicify_ValueHostsManagerStartFluent {
    return new Publicify_ValueHostsManagerStartFluent(null, new MockValidationServices(true, true));
}

describe('ValueHostsManagerStartFluent', () => {
    describe('constructor', () => {
        test('null first parameter sets up', () => {
            let services = new MockValidationServices(true, true);
            let testItem = new Publicify_ValueHostsManagerStartFluent(null, services);
            expect(testItem.services).toBe(services);
            expect(testItem.publicify_existingValueHostConfigs).toBeNull();
        });
        test('valueHostConfig array in first parameter sets up', () => {
            let services = new MockValidationServices(true, true);
            const valueHostConfigs: Array<ValueHostConfig> = [{
                valueHostType: ValueHostType.Static,
                name: 'Field1',
                label: 'Field 1',
                dataType: LookupKey.Currency
            }];
            
            let testItem = new Publicify_ValueHostsManagerStartFluent(valueHostConfigs, services);
            expect(testItem.services).toBe(services);
            expect(testItem.publicify_existingValueHostConfigs).toEqual(valueHostConfigs);
        });        
        test('null second parameter throws', () => {
            expect(() => new ValueHostsManagerStartFluent(null, null!)).toThrow('services');
        });

        describe('static()', () => {
            test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHFluent().static('Field1', null, { label: 'Field 1' });
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    label: 'Field 1'
                });
            });
            test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHFluent().static('Field1', 'Test');
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: 'Test'
                });
            });

            test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHFluent().static('Field1');
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                });
            });

            test('Pass in a StaticValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
                let testItem = createVHFluent().static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: 'Test',
                    label: 'Field 1'
                });        
            });
            test('Null name throws', () => {
                expect(() => createVHFluent().static(null!)).toThrow('arg1');

            });
            test('Pass in a StaticValueHostConfig with null name throws', () => {
                expect(()=> createVHFluent().static({ name: null!, dataType: 'Test', label: 'Field 1' })).toThrow('config.name required');

            });    
            test('First parameter is not compatible with overload throws', () => {
                expect(() => createVHFluent().static(100 as any)).toThrow('pass');
                expect(() => createVHFluent().static(false as any)).toThrow('pass');
                expect(() => createVHFluent().static([] as any)).toThrow('argument is not a supported object');
                expect(() => createVHFluent().static(new Date() as any)).toThrow('argument is not a supported object');
            });
            test('Second arg is not compatible with overload throws', () => {
                expect(() => createVHFluent().static('Field1', 100 as any)).toThrow('Second parameter invalid type');
                expect(() => createVHFluent().static('Field1', false as any)).toThrow('Second parameter invalid type');        
                expect(() => createVHFluent().static('Field1', [] as any)).toThrow('argument is not a supported object');        
                expect(() => createVHFluent().static('Field1', new Date() as any)).toThrow('argument is not a supported object');        
            });        
        });        
        describe('calc()', () => {
            function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
                return 1;
            }
            test('Valid name, null data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHFluent().calc('Field1', null, calcFnForTests);
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Calc,
                    name: 'Field1',
                    calcFn: calcFnForTests
                });
            });
            test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHFluent().calc('Field1', 'Test', calcFnForTests);
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Calc,
                    name: 'Field1',
                    dataType: 'Test',
                    calcFn: calcFnForTests
                });
            });

            test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
                let testItem = createVHFluent().calc({ name: 'Field1', dataType: 'Test', calcFn: calcFnForTests });
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Calc,
                    name: 'Field1',
                    dataType: 'Test',
                    calcFn: calcFnForTests
                });
            });
            test('calcFn is null throws', () => {
                expect(() => createVHFluent().calc('Field1', null, null!)).toThrow(/function/);
            });
            test('calcFn is not a function throws', () => {
                expect(() => createVHFluent().calc('Field1', null, 100 as any)).toThrow(/function/);
            });

            test('Null name throws', () => {
                expect(() => createVHFluent().calc(null!)).toThrow('arg1');

            });
            test('Pass in a ValueHostConfig with null name throws', () => {
                expect(() => createVHFluent().calc({ name: null!, dataType: 'Test', calcFn: () => 0 })).toThrow('config.name required');

            });
            test('First parameter is not compatible with overload throws', () => {
                expect(() => createVHFluent().calc(100 as any)).toThrow('pass');
            });
        });

    });
    describe('dispose', () => {
        test('dispose sets services to undefined and later calls throw', () => {
            let testItem = new Publicify_ValueHostsManagerStartFluent(null, new MockValidationServices(true, true));
            testItem.dispose();
            expect(() => testItem.services).toThrow();
            expect(testItem.publicify_existingValueHostConfigs).toBeNull();
        });
        test('dispose sets services and existingValueHostConfig to undefined and later calls throw', () => {
            const valueHostConfigs: Array<ValueHostConfig> = [{
                valueHostType: ValueHostType.Static,
                name: 'Field1',
                label: 'Field 1',
                dataType: LookupKey.Currency
            }];

            let testItem = new Publicify_ValueHostsManagerStartFluent(valueHostConfigs, new MockValidationServices(true, true));
            testItem.dispose();
            expect(() => testItem.services).toThrow();
            expect(testItem.publicify_existingValueHostConfigs).toBeNull();
        });        
    });
});
describe('ValidationManagerStartFluent', () => {
    describe('constructor', () => {
        test('null first parameter sets up without overrides', () => {
            let services = new MockValidationServices(true, true);
            let testItem = new Publicify_ValidationManagerStartFluent(null, services);
            expect(testItem.services).toBe(services);
            expect(testItem.publicify_existingValueHostConfigs).toBeNull();
        });
        test('valueHostConfig array in first parameter sets up', () => {
            let services = new MockValidationServices(true, true);
            const valueHostConfigs: Array<ValueHostConfig> = [{
                valueHostType: ValueHostType.Static,
                name: 'Field1',
                label: 'Field 1',
                dataType: LookupKey.Currency
            }];
            
            let testItem = new Publicify_ValidationManagerStartFluent(valueHostConfigs, services);
            expect(testItem.services).toBe(services);
            expect(testItem.publicify_existingValueHostConfigs).toEqual(valueHostConfigs);
        });                
        test('null second parameter throws', () => {
            expect(() => new ValidationManagerStartFluent(null, null!)).toThrow('services');
        });
    });

    describe('withoutValidators()', () => {
        test('Valid name, null data type and defined vhConfig. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().withoutValidators('TestType', 'Field1', null, { label: 'Field 1' });
            expect(testItem).toEqual({
                valueHostType: 'TestType', 
                name: 'Field1',
                label: 'Field 1'
            });
        });
        test('Valid name, data type assigned. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().withoutValidators('TestType', 'Field1', 'Test');
            expect(testItem).toEqual({
                valueHostType: 'TestType', 
                name: 'Field1',
                dataType: 'Test'
            });
        });

        test('Valid name. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().withoutValidators('TestType', 'Field1');
            expect(testItem).toEqual({
                valueHostType: 'TestType', 
                name: 'Field1',
            });
        });

        test('Pass in a ValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().withoutValidators('TestType', { name: 'Field1', dataType: 'Test', label: 'Field 1' });
            expect(testItem).toEqual({
                valueHostType: 'TestType', 
                name: 'Field1',
                dataType: 'Test',
                label: 'Field 1'
            });        
        });
        test('Null name throws', () => {
            expect(() => createVMFluent().withoutValidators('TestType', null!)).toThrow('arg1');

        });
        test('Pass in a ValueHostConfig with null name throws', () => {
            expect(()=> createVMFluent().withoutValidators('TestType', { name: null!, dataType: 'Test', label: 'Field 1' })).toThrow('config.name required');

        });    
        test('First arg is not compatible with overload throws', () => {
            expect(() => createVMFluent().withoutValidators('TestType', 100 as any)).toThrow('pass');
            expect(() => createVMFluent().withoutValidators('TestType', false as any)).toThrow('pass');
            expect(() => createVMFluent().withoutValidators('TestType', [] as any)).toThrow('argument is not a supported object');
            expect(() => createVMFluent().withoutValidators('TestType', new Date() as any)).toThrow('argument is not a supported object');
        });

        test('Second arg is not compatible with overload throws', () => {
            expect(() => createVMFluent().withoutValidators('TestType', 'Field1', 100 as any)).toThrow('Second parameter invalid type');
            expect(() => createVMFluent().withoutValidators('TestType', 'Field1', false as any)).toThrow('Second parameter invalid type');       
            expect(() => createVMFluent().withoutValidators('TestType', 'Field1', [] as any)).toThrow('argument is not a supported object');             
            expect(() => createVMFluent().withoutValidators('TestType', 'Field1', new Date() as any)).toThrow('argument is not a supported object');             
        });    
    });
    describe('field()', () => {
        test('Valid name, null data type and defined vhConfig. Adds FieldValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().field('Field1', null, { label: 'Field 1' });
            expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
            expect(testItem.parentConfig).toEqual({
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                label: 'Field 1',
                validatorConfigs: []
            });
        });
        test('Name, data type supplied. Adds ValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().field('Field1', 'Test');
            expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: 'Test',
                validatorConfigs: []
            };
            expect(testItem.parentConfig).toEqual(expected);
            
        });
        test('Name supplied. Adds ValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().field('Field1');
            expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: []
            };
            expect(testItem.parentConfig).toEqual(expected);
        });
        test('Pass in a FieldValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().field({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
            expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: 'Test',
                label: 'Field 1',
                validatorConfigs: []
            };
            expect(testItem.parentConfig).toEqual(expected);
        });
        test('Null name throws', () => {
            expect(() => createVMFluent().field(null!)).toThrow('arg1');

        });
        test('First parameter is not compatible with overload throws', () => {
            expect(() => createVMFluent().field(100 as any)).toThrow('pass');
            expect(() => createVMFluent().field(false as any)).toThrow('pass');
            expect(() => createVMFluent().field([] as any)).toThrow('argument is not a supported object');
            expect(() => createVMFluent().field(new Date() as any)).toThrow('argument is not a supported object');
        });
        test('Second arg is not compatible with overload throws', () => {
            expect(() => createVMFluent().field('Field1', 100 as any)).toThrow('Second parameter invalid type');
            expect(() => createVMFluent().field('Field1', false as any)).toThrow('Second parameter invalid type');        
            expect(() => createVMFluent().field('Field1', [] as any)).toThrow('argument is not a supported object');        
            expect(() => createVMFluent().field('Field1', new Date() as any)).toThrow('argument is not a supported object');        
        });      
    });

    describe('withValidators()', () => {
        test('Valid name, null data type and defined vhConfig. Adds FieldValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().withValidators(ValueHostType.Field, 'Field1', null, { label: 'Field 1' });
            expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
            expect(testItem.parentConfig).toEqual({
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                label: 'Field 1',
                validatorConfigs: []
            });
        });
        test('Name, data type supplied. Adds ValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().withValidators(ValueHostType.Field, 'Field1', 'Test');
            expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: 'Test',
                validatorConfigs: []
            };
            expect(testItem.parentConfig).toEqual(expected);
        
        });
        test('Name supplied. Adds ValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().withValidators(ValueHostType.Field, 'Field1');
            expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: []
            };
            expect(testItem.parentConfig).toEqual(expected);
        });
        test('Pass in a FieldValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
            let testItem = createVMFluent().withValidators(ValueHostType.Field, { name: 'Field1', dataType: 'Test', label: 'Field 1' });
            expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: 'Test',
                label: 'Field 1',
                validatorConfigs: []
            };
            expect(testItem.parentConfig).toEqual(expected);
        });
        test('Null name throws', () => {
            expect(() => createVMFluent().withValidators(ValueHostType.Field, null!)).toThrow('arg1');

        });
        test('Arg1 is not compatible with overload throws', () => {
            expect(() => createVMFluent().withValidators(ValueHostType.Field, 100 as any)).toThrow('pass');
            expect(() => createVMFluent().withValidators(ValueHostType.Field, false as any)).toThrow('pass');
            expect(() => createVMFluent().withValidators(ValueHostType.Field, [] as any)).toThrow('argument is not a supported object');
            expect(() => createVMFluent().withValidators(ValueHostType.Field, new Date() as any)).toThrow('argument is not a supported object');
        });
        test('Second arg is not compatible with overload throws', () => {
            expect(() => createVMFluent().withValidators(ValueHostType.Field, 'Field1', 100 as any)).toThrow('Second parameter invalid type');
            expect(() => createVMFluent().withValidators(ValueHostType.Field, 'Field1', false as any)).toThrow('Second parameter invalid type');
            expect(() => createVMFluent().withValidators(ValueHostType.Field, 'Field1', [] as any)).toThrow('argument is not a supported object');
            expect(() => createVMFluent().withValidators(ValueHostType.Field, 'Field1', new Date() as any)).toThrow('argument is not a supported object');
        });
    });


});
