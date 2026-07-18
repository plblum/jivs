import { ValidatorBuilder } from '../../src/Builder/ValidatorBuilder';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { MockValidationServices } from '../TestSupport/mocks';
import { ValidatableValueHostConfigBuilder, ValueHostConfigBuilder } from '../../src/Builder/ValueHostConfigBuilder';
import { ICalcValueHost } from '../../src/Interfaces/CalcValueHost';
import { IValidationManager } from '../../src/Interfaces/ValidationManager';
import { SimpleValueType } from '../../src/Interfaces/DataTypeConverterService';

class Publicify_ValueHostConfigBuilder extends ValueHostConfigBuilder { 
    public get publicify_existingValueHostConfigs() {
        return this.existingValueHostConfigs;
    }
}
class Publicify_ValidatableValueHostConfigBuilder extends ValidatableValueHostConfigBuilder { 
    public get publicify_existingValueHostConfigs() {
        return this.existingValueHostConfigs;
    }
}

function createVMBuilder(): Publicify_ValidatableValueHostConfigBuilder {
    return new Publicify_ValidatableValueHostConfigBuilder(null, new MockValidationServices(true, true));
}
function createVHBuilder(): Publicify_ValueHostConfigBuilder {
    return new Publicify_ValueHostConfigBuilder(null, new MockValidationServices(true, true));
}

describe('ValueHostConfigBuilder', () => {
    describe('constructor', () => {
        test('null first parameter sets up', () => {
            let services = new MockValidationServices(true, true);
            let testItem = new Publicify_ValueHostConfigBuilder(null, services);
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
            
            let testItem = new Publicify_ValueHostConfigBuilder(valueHostConfigs, services);
            expect(testItem.services).toBe(services);
            expect(testItem.publicify_existingValueHostConfigs).toEqual(valueHostConfigs);
        });        
        test('null second parameter throws', () => {
            expect(() => new ValueHostConfigBuilder(null, null!)).toThrow('services');
        });

        describe('static()', () => {
            test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHBuilder().static('Field1', null, { label: 'Field 1' });
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    label: 'Field 1'
                });
            });
            test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHBuilder().static('Field1', 'Test');
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: 'Test'
                });
            });

            test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHBuilder().static('Field1');
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                });
            });

            test('Pass in a StaticValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
                let testItem = createVHBuilder().static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: 'Test',
                    label: 'Field 1'
                });        
            });
            test('Null name throws', () => {
                expect(() => createVHBuilder().static(null!)).toThrow('arg1');

            });
            test('Pass in a StaticValueHostConfig with null name throws', () => {
                expect(()=> createVHBuilder().static({ name: null!, dataType: 'Test', label: 'Field 1' })).toThrow('config.name required');

            });    
            test('First parameter is not compatible with overload throws', () => {
                expect(() => createVHBuilder().static(100 as any)).toThrow('pass');
                expect(() => createVHBuilder().static(false as any)).toThrow('pass');
                expect(() => createVHBuilder().static([] as any)).toThrow('argument is not a supported object');
                expect(() => createVHBuilder().static(new Date() as any)).toThrow('argument is not a supported object');
            });
            test('Second arg is not compatible with overload throws', () => {
                expect(() => createVHBuilder().static('Field1', 100 as any)).toThrow('Second parameter invalid type');
                expect(() => createVHBuilder().static('Field1', false as any)).toThrow('Second parameter invalid type');        
                expect(() => createVHBuilder().static('Field1', [] as any)).toThrow('argument is not a supported object');        
                expect(() => createVHBuilder().static('Field1', new Date() as any)).toThrow('argument is not a supported object');        
            });        
        });        
        describe('calc()', () => {
            function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValidationManager): SimpleValueType {
                return 1;
            }
            test('Valid name, null data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHBuilder().calc('Field1', null, calcFnForTests);
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Calc,
                    name: 'Field1',
                    calcFn: calcFnForTests
                });
            });
            test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
                let testItem = createVHBuilder().calc('Field1', 'Test', calcFnForTests);
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Calc,
                    name: 'Field1',
                    dataType: 'Test',
                    calcFn: calcFnForTests
                });
            });

            test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
                let testItem = createVHBuilder().calc({ name: 'Field1', dataType: 'Test', calcFn: calcFnForTests });
                expect(testItem).toEqual({
                    valueHostType: ValueHostType.Calc,
                    name: 'Field1',
                    dataType: 'Test',
                    calcFn: calcFnForTests
                });
            });
            test('calcFn is null throws', () => {
                expect(() => createVHBuilder().calc('Field1', null, null!)).toThrow(/function/);
            });
            test('calcFn is not a function throws', () => {
                expect(() => createVHBuilder().calc('Field1', null, 100 as any)).toThrow(/function/);
            });

            test('Null name throws', () => {
                expect(() => createVHBuilder().calc(null!)).toThrow('arg1');

            });
            test('Pass in a ValueHostConfig with null name throws', () => {
                expect(() => createVHBuilder().calc({ name: null!, dataType: 'Test', calcFn: () => 0 })).toThrow('config.name required');

            });
            test('First parameter is not compatible with overload throws', () => {
                expect(() => createVHBuilder().calc(100 as any)).toThrow('pass');
            });
        });

    });
    describe('dispose', () => {
        test('dispose sets services to undefined and later calls throw', () => {
            let testItem = new Publicify_ValueHostConfigBuilder(null, new MockValidationServices(true, true));
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

            let testItem = new Publicify_ValueHostConfigBuilder(valueHostConfigs, new MockValidationServices(true, true));
            testItem.dispose();
            expect(() => testItem.services).toThrow();
            expect(testItem.publicify_existingValueHostConfigs).toBeNull();
        });        
    });
});
describe('ValidatableValueHostConfigBuilder', () => {
    describe('constructor', () => {
        test('null first parameter sets up without overrides', () => {
            let services = new MockValidationServices(true, true);
            let testItem = new Publicify_ValidatableValueHostConfigBuilder(null, services);
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
            
            let testItem = new Publicify_ValidatableValueHostConfigBuilder(valueHostConfigs, services);
            expect(testItem.services).toBe(services);
            expect(testItem.publicify_existingValueHostConfigs).toEqual(valueHostConfigs);
        });                
        test('null second parameter throws', () => {
            expect(() => new ValidatableValueHostConfigBuilder(null, null!)).toThrow('services');
        });
    });

    describe('withoutValidators()', () => {
        test('Valid name, null data type and defined vhConfig. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().withoutValidators('TestType', 'Field1', null, { label: 'Field 1' });
            expect(testItem).toEqual({
                valueHostType: 'TestType', 
                name: 'Field1',
                label: 'Field 1'
            });
        });
        test('Valid name, data type assigned. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().withoutValidators('TestType', 'Field1', 'Test');
            expect(testItem).toEqual({
                valueHostType: 'TestType', 
                name: 'Field1',
                dataType: 'Test'
            });
        });

        test('Valid name. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().withoutValidators('TestType', 'Field1');
            expect(testItem).toEqual({
                valueHostType: 'TestType', 
                name: 'Field1',
            });
        });

        test('Pass in a ValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().withoutValidators('TestType', { name: 'Field1', dataType: 'Test', label: 'Field 1' });
            expect(testItem).toEqual({
                valueHostType: 'TestType', 
                name: 'Field1',
                dataType: 'Test',
                label: 'Field 1'
            });        
        });
        test('Null name throws', () => {
            expect(() => createVMBuilder().withoutValidators('TestType', null!)).toThrow('arg1');

        });
        test('Pass in a ValueHostConfig with null name throws', () => {
            expect(()=> createVMBuilder().withoutValidators('TestType', { name: null!, dataType: 'Test', label: 'Field 1' })).toThrow('config.name required');

        });    
        test('First arg is not compatible with overload throws', () => {
            expect(() => createVMBuilder().withoutValidators('TestType', 100 as any)).toThrow('pass');
            expect(() => createVMBuilder().withoutValidators('TestType', false as any)).toThrow('pass');
            expect(() => createVMBuilder().withoutValidators('TestType', [] as any)).toThrow('argument is not a supported object');
            expect(() => createVMBuilder().withoutValidators('TestType', new Date() as any)).toThrow('argument is not a supported object');
        });

        test('Second arg is not compatible with overload throws', () => {
            expect(() => createVMBuilder().withoutValidators('TestType', 'Field1', 100 as any)).toThrow('Second parameter invalid type');
            expect(() => createVMBuilder().withoutValidators('TestType', 'Field1', false as any)).toThrow('Second parameter invalid type');       
            expect(() => createVMBuilder().withoutValidators('TestType', 'Field1', [] as any)).toThrow('argument is not a supported object');             
            expect(() => createVMBuilder().withoutValidators('TestType', 'Field1', new Date() as any)).toThrow('argument is not a supported object');             
        });    
    });
    describe('field()', () => {
        test('Valid name, null data type and defined vhConfig. Adds FieldValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().field('Field1', null, { label: 'Field 1' });
            expect(testItem).toEqual({
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                label: 'Field 1',
                validatorConfigs: []
            });
        });
        test('Name, data type supplied. Adds ValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().field('Field1', 'Test');
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: 'Test',
                validatorConfigs: []
            };
            expect(testItem).toEqual(expected);
            
        });
        test('Name supplied. Adds ValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().field('Field1');
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: []
            };
            expect(testItem).toEqual(expected);
        });
        test('Pass in a FieldValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().field({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: 'Test',
                label: 'Field 1',
                validatorConfigs: []
            };
            expect(testItem).toEqual(expected);
        });
        test('Null name throws', () => {
            expect(() => createVMBuilder().field(null!)).toThrow('arg1');

        });
        test('First parameter is not compatible with overload throws', () => {
            expect(() => createVMBuilder().field(100 as any)).toThrow('pass');
            expect(() => createVMBuilder().field(false as any)).toThrow('pass');
            expect(() => createVMBuilder().field([] as any)).toThrow('argument is not a supported object');
            expect(() => createVMBuilder().field(new Date() as any)).toThrow('argument is not a supported object');
        });
        test('Second arg is not compatible with overload throws', () => {
            expect(() => createVMBuilder().field('Field1', 100 as any)).toThrow('Second parameter invalid type');
            expect(() => createVMBuilder().field('Field1', false as any)).toThrow('Second parameter invalid type');        
            expect(() => createVMBuilder().field('Field1', [] as any)).toThrow('argument is not a supported object');        
            expect(() => createVMBuilder().field('Field1', new Date() as any)).toThrow('argument is not a supported object');        
        });      
    });

    describe('withValidators()', () => {
        test('Valid name, null data type and defined vhConfig. Adds FieldValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().withValidators(ValueHostType.Field, 'Field1', null, { label: 'Field 1' });
            expect(testItem).toEqual({
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                label: 'Field 1',
                validatorConfigs: []
            });
        });
        test('Name, data type supplied. Adds ValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().withValidators(ValueHostType.Field, 'Field1', 'Test');
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: 'Test',
                validatorConfigs: []
            };
            expect(testItem).toEqual(expected);
        
        });
        test('Name supplied. Adds ValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().withValidators(ValueHostType.Field, 'Field1');
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: []
            };
            expect(testItem).toEqual(expected);
        });
        test('Pass in a FieldValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
            let testItem = createVMBuilder().withValidators(ValueHostType.Field, { name: 'Field1', dataType: 'Test', label: 'Field 1' });
            let expected = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: 'Test',
                label: 'Field 1',
                validatorConfigs: []
            };
            expect(testItem).toEqual(expected);
        });
        test('Null name throws', () => {
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, null!)).toThrow('arg1');

        });
        test('Arg1 is not compatible with overload throws', () => {
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, 100 as any)).toThrow('pass');
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, false as any)).toThrow('pass');
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, [] as any)).toThrow('argument is not a supported object');
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, new Date() as any)).toThrow('argument is not a supported object');
        });
        test('Second arg is not compatible with overload throws', () => {
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, 'Field1', 100 as any)).toThrow('Second parameter invalid type');
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, 'Field1', false as any)).toThrow('Second parameter invalid type');
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, 'Field1', [] as any)).toThrow('argument is not a supported object');
            expect(() => createVMBuilder().withValidators(ValueHostType.Field, 'Field1', new Date() as any)).toThrow('argument is not a supported object');
        });
    });


});
