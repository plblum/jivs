import { MockValidationServices } from './../TestSupport/mocks';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { EvaluateChildConditionResultsBaseConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import {
    FluentValidatorConfig, FluentValidatorBuilder, FluentFactory, IFluentValidatorBuilder, FluentConditionBuilder, IFluentConditionBuilder,
    finishFluentValidatorBuilder, finishFluentConditionBuilder,
    ValidationManagerStartFluent,
    ValueHostsManagerStartFluent
} from './../../src/ValueHosts/Fluent';
import { ValidationManagerConfig } from '../../src/Interfaces/ValidationManager';
import { ICalcValueHost } from '../../src/Interfaces/CalcValueHost';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { SimpleValueType } from '../../src/Interfaces/DataTypeConverterService';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';

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
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        expect(testItem.parentConfig).toBe(vhConfig);
    });
    test('constructor with vhConfig that has validatorConfig=null sets up vhConfig property with empty validatorConfig array', () => {
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
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

    test('add() with all parameters correctly defined', () => {
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let validatorConfig: FluentValidatorConfig = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(ConditionType.RequireText, {}, 'Error', validatorConfig)).not.toThrow();
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
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
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
        expect(() => testItem.add(null, conditionConfig, 'Error', validatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() with null for error message and error message already assigned', () => {
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
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
        expect(() => testItem.add(ConditionType.RequireText, {}, null, validatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() that defines same errorCode twice throws on the second definition', () => {
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorBuilder(vhConfig);
        let validatorConfig: FluentValidatorConfig = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(ConditionType.RequireText, {}, 'Error', validatorConfig)).not.toThrow();
        expect(() => testItem.add(ConditionType.RequireText, {}, 'Error', validatorConfig)).toThrow('ValueHost name "Field1" with errorCode RequireText already defined.');     
        
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
describe('input()', () => {
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().input('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().input('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        
    });
    test('Name supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().input('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Pass in a InputValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().input({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Null name throws', () => {
        expect(() => createFluent().input(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => createFluent().input(100 as any)).toThrow('pass');
        expect(() => createFluent().input(false as any)).toThrow('pass');
        expect(() => createFluent().input([] as any)).toThrow('argument is not a supported object');
        expect(() => createFluent().input(new Date() as any)).toThrow('argument is not a supported object');
    });
    test('Second arg is not compatible with overload throws', () => {
        expect(() => createFluent().input('Field1', 100 as any)).toThrow('Second parameter invalid type');
        expect(() => createFluent().input('Field1', false as any)).toThrow('Second parameter invalid type');        
        expect(() => createFluent().input('Field1', [] as any)).toThrow('argument is not a supported object');        
        expect(() => createFluent().input('Field1', new Date() as any)).toThrow('argument is not a supported object');        
    });      
});

describe('property()', () => {
    test('Valid name, null data type and defined vhConfig. Adds PropertyValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().property('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().property('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        
    });
    test('Name supplied. Adds ValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().property('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Pass in a PropertyValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().property({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Null name throws', () => {
        expect(() => createFluent().property(null!)).toThrow('arg1');

    });
    test('Pass in a ValueHostConfig with null name throws', () => {
        expect(()=> createFluent().property({ name: null!, dataType: 'Test', label: 'Field 1' })).toThrow('config.name required');

    });        
    test('First parameter is not compatible with overload throws', () => {
        expect(() => createFluent().property(100 as any)).toThrow('pass');
        expect(() => createFluent().property(false as any)).toThrow('pass');
        expect(() => createFluent().property([] as any)).toThrow('argument is not a supported object');
        expect(() => createFluent().property(new Date() as any)).toThrow('argument is not a supported object');
    });
    test('Second arg is not compatible with overload throws', () => {
        expect(() => createFluent().property('Field1', 100 as any)).toThrow('Second parameter invalid type');
        expect(() => createFluent().property('Field1', false as any)).toThrow('Second parameter invalid type');        
        expect(() => createFluent().property('Field1', [] as any)).toThrow('argument is not a supported object');        
        expect(() => createFluent().property('Field1', new Date() as any)).toThrow('argument is not a supported object');        
    });      
});
describe('withValidators()', () => {
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withValidators(ValueHostType.Input, 'Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withValidators(ValueHostType.Input, 'Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        
    });
    test('Name supplied. Adds ValueHostConfig with all parameters plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withValidators(ValueHostType.Input, 'Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Pass in a InputValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = createFluent().withValidators(ValueHostType.Input, { name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Null name throws', () => {
        expect(() => createFluent().withValidators(ValueHostType.Input, null!)).toThrow('arg1');

    });
    test('Arg1 is not compatible with overload throws', () => {
        expect(() => createFluent().withValidators(ValueHostType.Input, 100 as any)).toThrow('pass');
        expect(() => createFluent().withValidators(ValueHostType.Input, false as any)).toThrow('pass');
        expect(() => createFluent().withValidators(ValueHostType.Input, [] as any)).toThrow('argument is not a supported object');
        expect(() => createFluent().withValidators(ValueHostType.Input, new Date() as any)).toThrow('argument is not a supported object');
    });
    test('Second arg is not compatible with overload throws', () => {
        expect(() => createFluent().withValidators(ValueHostType.Input, 'Field1', 100 as any)).toThrow('Second parameter invalid type');
        expect(() => createFluent().withValidators(ValueHostType.Input, 'Field1', false as any)).toThrow('Second parameter invalid type');        
        expect(() => createFluent().withValidators(ValueHostType.Input, 'Field1', [] as any)).toThrow('argument is not a supported object');        
        expect(() => createFluent().withValidators(ValueHostType.Input, 'Field1', new Date() as any)).toThrow('argument is not a supported object');        
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
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
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
            constructor(vhConfig: InputValueHostConfig) {
                this.parentConfig = { ...vhConfig, dataType: 'test' };
            }
            parentConfig: InputValueHostConfig;
            add(conditionType: string, conditionConfig: ConditionConfig | null,
                errorMessage: string | null, validatorConfig: ValidatorConfig): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerValidatorBuilder((vhConfig) => new TestFluentValidatorBuilder(vhConfig));

        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
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
            '', {}, null, null)
        ).not.toThrow();
        let testItem2 = new FluentConditionBuilder({ conditionType: '', conditionConfigs: [] });
        expect(()=>finishFluentValidatorBuilder(
            testItem2,
            '', {}, null, null)
        ).toThrow();
        expect(()=>finishFluentValidatorBuilder(
            100,
            '', {}, null, null)
        ).toThrow();       
        expect(()=>finishFluentValidatorBuilder(
            null,
            '', {}, null, null)
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