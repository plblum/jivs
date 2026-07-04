import { MockValidationServices } from '../TestSupport/mocks';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { EvaluateChildConditionResultsBaseConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionConfig, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import { FieldValueHostConfig } from '../../src/Interfaces/FieldValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import {
    FluentValidatorConfig, FluentValidatorBuilder, FluentFactory, IFluentValidatorBuilder, FluentConditionBuilder, IFluentConditionBuilder,
    finishFluentValidatorBuilder, finishFluentConditionBuilder,
    ValidationManagerStartFluent,
    ValueHostsManagerStartFluent,
    resolveValidatorOverloadArgs
} from './../../src/Builder/Fluent';
import { ValidationManagerConfig } from '../../src/Interfaces/ValidationManager';
import { ICalcValueHost } from '../../src/Interfaces/CalcValueHost';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { SimpleValueType } from '../../src/Interfaces/DataTypeConverterService';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { ValidationSeverity } from '../../src/Interfaces/Validation';
import { DataTypeCheckConditionConfig, RequireTextConditionConfig } from '../../src/Conditions/ConcreteConditions';

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

function createVMConfig(): ValidationManagerConfig
{
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}

function createFluent(): ValidationManagerStartFluent {
    return new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
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
});

describe('FluentValidatorBuilder', () => {
    test('constructor with vhConfig sets up vhConfig property', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        expect(testItem.parentConfig).toBe(vhConfig);
    });
    test('constructor with vhConfig that has validatorConfig=null sets up vhConfig property with empty validatorConfig array', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: null
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        expect(testItem.parentConfig).toBeDefined();
        expect(testItem.parentConfig.validatorConfigs).toEqual([]);
    });
    test('constructor with null in first parameter throws', () => {
        expect(() => new FluentValidatorBuilder(null!)).toThrow('parentConfig');

    });

    test('add() with error message and summary message stand-alone, empty validatorConfig', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let validatorConfig: FluentValidatorConfig = {};
        expect(() => testItem.add(ConditionType.RequireText, {}, 'Error', 'Summary', validatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() with error message stand-alone, summary parameter null, empty validatorConfig', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let validatorConfig: FluentValidatorConfig = {};
        expect(() => testItem.add(ConditionType.RequireText, {}, 'Error', null, validatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
        });
    });    
    test('add() with error message and summary message null, empty validatorConfig', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let validatorConfig: FluentValidatorConfig = {};
        expect(() => testItem.add(ConditionType.RequireText, {}, null, null, validatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
    });    
    // Error and summary are in the validator config alone
    test('add() with error message and summary message in validatorConfig, and other parameters correctly defined', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let validatorConfig: FluentValidatorConfig = {
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(ConditionType.RequireText, {}, null, null, validatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() with null for conditionType, and other parameters correctly defined', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let conditionConfig: ConditionConfig = {
            conditionType: ConditionType.RequireText
        };
        let validatorConfig: FluentValidatorConfig = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(null, conditionConfig, 'Error', 'Summary', validatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() with null for error message and summary parameters, but rich content in validatorConfig', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let validatorConfig: FluentValidatorConfig = {
            enabled: false,
            severity: ValidationSeverity.Warning,
            errorMessagel10n: 'Key'
        };
        expect(() => testItem.add(ConditionType.RequireText, {}, null, null, validatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                conditionType: ConditionType.RequireText
            },
            enabled: false,
            severity: ValidationSeverity.Warning,
            errorMessagel10n: 'Key'
        });
    });
    test('add() that defines same errorCode twice throws on the second definition', () => {
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let validatorConfig: FluentValidatorConfig = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(ConditionType.RequireText, {}, 'Error', 'Summary', validatorConfig)).not.toThrow();
        expect(() => testItem.add(ConditionType.RequireText, {}, 'Error', 'Summary', validatorConfig)).toThrow('ValueHost name "Field1" with errorCode RequireText already defined.');     
        
    });    
});

describe('FluentConditionBuilder', () => {
    test('constructor with vhConfig sets up vhConfig property', () => {
        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionBuilder(vhConfig);
        expect(testItem.parentConfig).toBe(vhConfig);
    });
    test('constructor with null parameter creates a Config with conditionConfigs=[] and type="TBD"', () => {
        let testItem = new FluentConditionBuilder(null);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });    

    test('constructor with vhConfig that has conditionConfigs=null sets up vhConfig property with empty conditionConfigs array', () => {
        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }

        let testItem = new FluentConditionBuilder(vhConfig);
        expect(testItem.parentConfig).toBeDefined();
        expect(testItem.parentConfig.conditionConfigs).toEqual([]);
    });
    test('add() with all parameters correctly defined', () => {
        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionBuilder(vhConfig);

        expect(() => testItem.add(ConditionType.RequireText, {})).not.toThrow();
        expect(testItem.parentConfig.conditionConfigs!.length).toBe(1);
        expect(testItem.parentConfig.conditionConfigs![0]).toEqual({
            conditionType: ConditionType.RequireText
        });
    });
    test('add() with null for conditionType, and other parameters correctly defined', () => {
        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionBuilder(vhConfig);
        let conditionConfig: ConditionConfig = {
            conditionType: ConditionType.RequireText
        };

        expect(() => testItem.add(null, conditionConfig)).not.toThrow();
        expect(testItem.parentConfig.conditionConfigs!.length).toBe(1);
        expect(testItem.parentConfig.conditionConfigs![0]).toEqual({
            conditionType: ConditionType.RequireText
        });
    });
});

describe('static()', () => {
    test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().static('Field1', null, { label: 'Field 1' });
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1'
        });
    });
    test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().static('Field1', 'Test');
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test'
        });
    });

    test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().static('Field1');
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
        });
    });

    test('Pass in a StaticValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        });        
    });
    test('Null name throws', () => {
        expect(() => createFluent().static(null!)).toThrow('arg1');

    });
    test('Pass in a StaticValueHostConfig with null name throws', () => {
        expect(()=> createFluent().static({ name: null!, dataType: 'Test', label: 'Field 1' })).toThrow('config.name required');

    });    
    test('First parameter is not compatible with overload throws', () => {
        expect(() => createFluent().static(100 as any)).toThrow('pass');
        expect(() => createFluent().static(false as any)).toThrow('pass');
        expect(() => createFluent().static([] as any)).toThrow('argument is not a supported object');
        expect(() => createFluent().static(new Date() as any)).toThrow('argument is not a supported object');
    });
    test('Second arg is not compatible with overload throws', () => {
        expect(() => createFluent().static('Field1', 100 as any)).toThrow('Second parameter invalid type');
        expect(() => createFluent().static('Field1', false as any)).toThrow('Second parameter invalid type');        
        expect(() => createFluent().static('Field1', [] as any)).toThrow('argument is not a supported object');        
        expect(() => createFluent().static('Field1', new Date() as any)).toThrow('argument is not a supported object');        
    });        
});
describe('withoutValidators()', () => {
    test('Valid name, null data type and defined vhConfig. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withoutValidators('TestType', 'Field1', null, { label: 'Field 1' });
        expect(testItem).toEqual({
            valueHostType: 'TestType', 
            name: 'Field1',
            label: 'Field 1'
        });
    });
    test('Valid name, data type assigned. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withoutValidators('TestType', 'Field1', 'Test');
        expect(testItem).toEqual({
            valueHostType: 'TestType', 
            name: 'Field1',
            dataType: 'Test'
        });
    });

    test('Valid name. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withoutValidators('TestType', 'Field1');
        expect(testItem).toEqual({
            valueHostType: 'TestType', 
            name: 'Field1',
        });
    });

    test('Pass in a ValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withoutValidators('TestType', { name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toEqual({
            valueHostType: 'TestType', 
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        });        
    });
    test('Null name throws', () => {
        expect(() => createFluent().withoutValidators('TestType', null!)).toThrow('arg1');

    });
    test('Pass in a ValueHostConfig with null name throws', () => {
        expect(()=> createFluent().withoutValidators('TestType', { name: null!, dataType: 'Test', label: 'Field 1' })).toThrow('config.name required');

    });    
    test('First arg is not compatible with overload throws', () => {
        expect(() => createFluent().withoutValidators('TestType', 100 as any)).toThrow('pass');
        expect(() => createFluent().withoutValidators('TestType', false as any)).toThrow('pass');
        expect(() => createFluent().withoutValidators('TestType', [] as any)).toThrow('argument is not a supported object');
        expect(() => createFluent().withoutValidators('TestType', new Date() as any)).toThrow('argument is not a supported object');
    });

    test('Second arg is not compatible with overload throws', () => {
        expect(() => createFluent().withoutValidators('TestType', 'Field1', 100 as any)).toThrow('Second parameter invalid type');
        expect(() => createFluent().withoutValidators('TestType', 'Field1', false as any)).toThrow('Second parameter invalid type');       
        expect(() => createFluent().withoutValidators('TestType', 'Field1', [] as any)).toThrow('argument is not a supported object');             
        expect(() => createFluent().withoutValidators('TestType', 'Field1', new Date() as any)).toThrow('argument is not a supported object');             
    });    
});
describe('field()', () => {
    test('Valid name, null data type and defined vhConfig. Adds FieldValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().field('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().field('Field1', 'Test');
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
        let testItem = createFluent().field('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Pass in a FieldValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().field({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
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
        expect(() => createFluent().field(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => createFluent().field(100 as any)).toThrow('pass');
        expect(() => createFluent().field(false as any)).toThrow('pass');
        expect(() => createFluent().field([] as any)).toThrow('argument is not a supported object');
        expect(() => createFluent().field(new Date() as any)).toThrow('argument is not a supported object');
    });
    test('Second arg is not compatible with overload throws', () => {
        expect(() => createFluent().field('Field1', 100 as any)).toThrow('Second parameter invalid type');
        expect(() => createFluent().field('Field1', false as any)).toThrow('Second parameter invalid type');        
        expect(() => createFluent().field('Field1', [] as any)).toThrow('argument is not a supported object');        
        expect(() => createFluent().field('Field1', new Date() as any)).toThrow('argument is not a supported object');        
    });      
});

describe('withValidators()', () => {
    test('Valid name, null data type and defined vhConfig. Adds FieldValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withValidators(ValueHostType.Field, 'Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withValidators(ValueHostType.Field, 'Field1', 'Test');
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
        let testItem = createFluent().withValidators(ValueHostType.Field, 'Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Pass in a FieldValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withValidators(ValueHostType.Field, { name: 'Field1', dataType: 'Test', label: 'Field 1' });
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
        expect(() => createFluent().withValidators(ValueHostType.Field, null!)).toThrow('arg1');

    });
    test('Arg1 is not compatible with overload throws', () => {
        expect(() => createFluent().withValidators(ValueHostType.Field, 100 as any)).toThrow('pass');
        expect(() => createFluent().withValidators(ValueHostType.Field, false as any)).toThrow('pass');
        expect(() => createFluent().withValidators(ValueHostType.Field, [] as any)).toThrow('argument is not a supported object');
        expect(() => createFluent().withValidators(ValueHostType.Field, new Date() as any)).toThrow('argument is not a supported object');
    });
    test('Second arg is not compatible with overload throws', () => {
        expect(() => createFluent().withValidators(ValueHostType.Field, 'Field1', 100 as any)).toThrow('Second parameter invalid type');
        expect(() => createFluent().withValidators(ValueHostType.Field, 'Field1', false as any)).toThrow('Second parameter invalid type');        
        expect(() => createFluent().withValidators(ValueHostType.Field, 'Field1', [] as any)).toThrow('argument is not a supported object');        
        expect(() => createFluent().withValidators(ValueHostType.Field, 'Field1', new Date() as any)).toThrow('argument is not a supported object');        
    });      
});


describe('conditions', () => {
    test('Undefined parameter creates a FluentConditionBuilder with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let testItem = createFluent().conditions();
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });
    test('null parameter creates a FluentConditionBuilder with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let testItem = createFluent().conditions(null!);
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });    
    test('Supplied parameter creates a FluentConditionBuilder with the same vhConfig', () => {
        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = createFluent().conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });    
    test('Supplied parameter with conditionConfig=null creates a FluentValidatorBuilder with the same vhConfig and conditionConfig=[]', () => {
        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }
        let testItem = createFluent().conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });        
});
describe('configCalc', () => {
    function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType
    {
        return 1;
    }
    test('Valid name, null data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().calc('Field1', null, calcFnForTests);
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            calcFn: calcFnForTests
        });
    });
    test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().calc('Field1', 'Test', calcFnForTests);
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            calcFn: calcFnForTests
        });
    });

    test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().calc({ name: 'Field1', dataType: 'Test', calcFn: calcFnForTests });
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            calcFn: calcFnForTests
        });
    });
    test('calcFn is null throws', () => {
        expect(() => createFluent().calc('Field1', null, null!)).toThrow(/function/);
    });    
    test('calcFn is not a function throws', () => {
        expect(() => createFluent().calc('Field1', null, 100 as any)).toThrow(/function/);
    });    

    test('Null name throws', () => {
        expect(() => createFluent().calc(null!)).toThrow('arg1');

    });
    test('Pass in a ValueHostConfig with null name throws', () => {
        expect(()=> createFluent().calc({ name: null!, dataType: 'Test', calcFn: ()=>0 })).toThrow('config.name required');

    });            
    test('First parameter is not compatible with overload throws', () => {
        expect(() => createFluent().calc(100 as any)).toThrow('pass');
    });
});


describe('FluentFactory', () => {
    test('Constructor followed by create will return an instance of FluentValidatorBuilder with correct vhConfig', () => {
        let testItem = new FluentFactory();
        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        let result: IFluentValidatorBuilder | null = null;
        expect(() => result = testItem.createValidatorBuilder(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(FluentValidatorBuilder);
        expect(result!.parentConfig).toEqual(vhConfig);
    });
    test('Register followed by create returns an instance of the test class with correct vhConfig', () => {
        class TestFluentValidatorBuilder implements IFluentValidatorBuilder {
            constructor(vhConfig: FieldValueHostConfig) {
                this.parentConfig = { ...vhConfig, dataType: 'test' };
            }
            parentConfig: FieldValueHostConfig;
            add(conditionType: string, conditionConfig: ConditionConfig | null,
                errorMessage: string | null, summaryMessage: string | null, validatorConfig: ValidatorConfig): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerValidatorBuilder((vhConfig) => new TestFluentValidatorBuilder(vhConfig));

        let vhConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        let result: IFluentValidatorBuilder | null = null;
        expect(() => result = testItem.createValidatorBuilder(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentValidatorBuilder);
        expect(result!.parentConfig.dataType).toBe('test');
    });
    test('Constructor followed by create will return an instance of FluentConditionBuilder with correct vhConfig', () => {
        let testItem = new FluentFactory();
        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let result: IFluentConditionBuilder | null = null;
        expect(() => result = testItem.createConditionBuilder(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(FluentConditionBuilder);
        expect(result!.parentConfig).toEqual(vhConfig);
    });
    test('Register followed by create returns an instance of the test class with correct vhConfig', () => {
        class TestFluentConditionBuilder implements IFluentConditionBuilder {
            constructor(vhConfig: EvaluateChildConditionResultsBaseConfig) {
                this.parentConfig = { ...vhConfig, conditionType: 'Test' };
            }
            parentConfig: EvaluateChildConditionResultsBaseConfig;

            add(conditionType: string, conditionConfig: Partial<ConditionConfig> | null): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerConditionBuilder((vhConfig) => new TestFluentConditionBuilder(vhConfig));

        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let result: IFluentConditionBuilder | null = null;
        expect(() => result = testItem.createConditionBuilder(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentConditionBuilder);
        expect(result!.parentConfig.conditionType).toBe('Test');
    })    
});

describe('finishFluentValidatorBuilder ', () => {
    test('Only FluentValidatorBuilder legal for first parameter. Unexpect type throws', () => {
        let vmConfig = createVMConfig();

        let testItem1 = new FluentValidatorBuilder({ name: '', validatorConfigs: [] }); 
        expect(()=>finishFluentValidatorBuilder(
            testItem1,
            '', {}, null, null, null)
        ).not.toThrow();
        let testItem2 = new FluentConditionBuilder({ conditionType: '', conditionConfigs: [] });
        expect(()=>finishFluentValidatorBuilder(
            testItem2,
            '', {}, null, null, null)
        ).toThrow();
        expect(()=>finishFluentValidatorBuilder(
            100,
            '', {}, null, null, null)
        ).toThrow();       
        expect(()=>finishFluentValidatorBuilder(
            null,
            '', {}, null, null, null)
        ).toThrow();               
    });
});
describe('finishFluentConditionBuilder ', () => {
    test('Only FluentConditionBuilder legal for first parameter. Unexpect type throws', () => {
        let vmConfig = createVMConfig();
        let testItem1 = new FluentConditionBuilder({conditionType: '', conditionConfigs: [] }); 
        expect(()=>finishFluentConditionBuilder(
            testItem1,
            '', {})
        ).not.toThrow();
        let testItem2 = new FluentValidatorBuilder({ name: '', validatorConfigs: [] });
        expect(()=>finishFluentConditionBuilder(
            testItem2,
            '', {})
        ).toThrow();
        expect(()=>finishFluentConditionBuilder(
            100,
            '', {})
        ).toThrow();       
        expect(()=>finishFluentConditionBuilder(
            null,
            '', {})
        ).toThrow();               
    });
});

describe('resolveValidatorOverloadArgs', () => {
    test('All parameters null, returns correct object', () => {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<DataTypeCheckConditionConfig>(
                null, null);
        expect(errorMessage).toBeNull();
        expect(summaryMessage).toBeNull();
        expect(conditionConfig).toBeUndefined();
        expect(validatorParameters).toBeUndefined();

    });
    // with error and summary messages, no conditionConfig or validatorParameters
    test('error and summary messages, no conditionConfig or validatorParameters, returns correct object', () => {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<DataTypeCheckConditionConfig>(
                'Error', 'Summary');
        expect(errorMessage).toBe('Error');
        expect(summaryMessage).toBe('Summary');
        expect(conditionConfig).toBeUndefined();
        expect(validatorParameters).toBeUndefined();
    });
    // with error message only, as a single parameter
    test('error message only, as a single parameter, returns correct object', () => {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<DataTypeCheckConditionConfig>(
                'Error');
        expect(errorMessage).toBe('Error');
        expect(summaryMessage).toBeNull();
        expect(conditionConfig).toBeUndefined();
        expect(validatorParameters).toBeUndefined();
    });
    // with error message, summary = null
    test('error message, summary = null, returns correct object', () => {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<DataTypeCheckConditionConfig>(
                'Error', null);
        expect(errorMessage).toBe('Error');
        expect(summaryMessage).toBeNull();
        expect(conditionConfig).toBeUndefined();
        expect(validatorParameters).toBeUndefined();
    });
    // with error message = null, summary assigned
    test('error message = null, summary assigned, returns correct object', () => {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<DataTypeCheckConditionConfig>(
                null, 'Summary');
        expect(errorMessage).toBeNull();
        expect(summaryMessage).toBe('Summary');
        expect(conditionConfig).toBeUndefined();
        expect(validatorParameters).toBeUndefined();
    });
    // using object in first parameter
    test('using object with just validatorParameter values, returns correct validatorParameter and empty conditionconfig', () => {
        let validatorParameters: Partial<FluentValidatorConfig & DataTypeCheckConditionConfig> = {
            enabled: false,
            severity: ValidationSeverity.Warning,
            errorMessagel10n: 'Key'
        };
        let { errorMessage, summaryMessage, conditionConfig: returnedConditionConfig, validatorParameters: returnedValidatorParameters } =  
            resolveValidatorOverloadArgs<DataTypeCheckConditionConfig>(
                validatorParameters);
        expect(errorMessage).toBeUndefined();
        expect(summaryMessage).toBeUndefined();
        expect(returnedConditionConfig).toEqual({});
        expect(returnedValidatorParameters).toEqual(validatorParameters);
    });
    // same with condition config properties on RequireTextConditionConfig: trim: true
    test('using object with just conditionConfig values, returns correct conditionConfig and empty validatorParameter', () => {
        let validatorParameters: Partial<FluentValidatorConfig & RequireTextConditionConfig> = {
            trim: true
        };
        let { errorMessage, summaryMessage, conditionConfig: returnedConditionConfig, validatorParameters: returnedValidatorParameters } =
            resolveValidatorOverloadArgs<RequireTextConditionConfig>(
                validatorParameters);
        expect(errorMessage).toBeUndefined();
        expect(summaryMessage).toBeUndefined();
        expect(returnedConditionConfig).toEqual(validatorParameters);
        expect(returnedValidatorParameters).toEqual({});
    });

    // mixture of both validatorParameters having errorMessage and conditionConfig properties on RequireTextConditionConfig: trim: true, enabled: false
    test('using object with mixture of validatorParameters and conditionConfig values, returns correct conditionConfig and validatorParameter', () => {
        let mixture: Partial<FluentValidatorConfig & RequireTextConditionConfig> = {
            trim: true,
            enabled: false,
            severity: ValidationSeverity.Warning,
            errorMessagel10n: 'Key'
        };
        let { errorMessage, summaryMessage, conditionConfig: returnedConditionConfig, validatorParameters: returnedValidatorParameters } =
            resolveValidatorOverloadArgs<RequireTextConditionConfig>(
                mixture);
        expect(errorMessage).toBeUndefined();
        expect(summaryMessage).toBeUndefined();
        expect(returnedConditionConfig).toEqual({
            trim: true
        });
        expect(returnedValidatorParameters).toEqual({
            enabled: false,
            severity: ValidationSeverity.Warning,
            errorMessagel10n: 'Key'
        });
    });
    // any other test ideas?
    test('using object with mixture of validatorParameters and conditionConfig values, plus errorMessage and summaryMessage, returns correct conditionConfig and validatorParameter', () => {
        let mixture: Partial<FluentValidatorConfig & RequireTextConditionConfig> = {
            trim: true,
            nullValueResult: ConditionEvaluateResult.Match,
            errorMessage: 'Error',
        };
        let { errorMessage, summaryMessage, conditionConfig: returnedConditionConfig, validatorParameters: returnedValidatorParameters } =
            resolveValidatorOverloadArgs<RequireTextConditionConfig>(
                mixture);
        expect(errorMessage).toBeUndefined();
        expect(summaryMessage).toBeUndefined();
        expect(returnedConditionConfig).toEqual({
            trim: true,
            nullValueResult: ConditionEvaluateResult.Match
        });
        expect(returnedValidatorParameters).toEqual({
            errorMessage: 'Error'
        });
    });
    // object as first parameter, second parameter is string, second is ignored
    test('using object with mixture of validatorParameters and conditionConfig values, plus errorMessage and summaryMessage, returns correct conditionConfig and validatorParameter', () => {
        let mixture: Partial<FluentValidatorConfig & RequireTextConditionConfig> = {
            trim: true,
            nullValueResult: ConditionEvaluateResult.Match,
            errorMessage: 'Error',
        };
        let { errorMessage, summaryMessage, conditionConfig: returnedConditionConfig, validatorParameters: returnedValidatorParameters } =
            resolveValidatorOverloadArgs<RequireTextConditionConfig>(
                mixture, 'Summary');
        expect(errorMessage).toBeUndefined();
        expect(summaryMessage).toBeUndefined();
        expect(returnedConditionConfig).toEqual({
            trim: true,
            nullValueResult: ConditionEvaluateResult.Match
        });
        expect(returnedValidatorParameters).toEqual({
            errorMessage: 'Error'
        });
    });
});