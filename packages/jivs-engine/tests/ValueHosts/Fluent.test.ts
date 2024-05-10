import { MockValidationServices } from './../TestSupport/mocks';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { EvaluateChildConditionResultsBaseConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import {
    FluentValidatorConfig, FluentValidatorCollector, FluentFactory, IFluentValidatorCollector, FluentConditionCollector, IFluentConditionCollector,
    finishFluentValidatorCollector, finishFluentConditionCollector,
    fluent
} from './../../src/ValueHosts/Fluent';
import { ValidationManagerConfig } from '../../src/Interfaces/ValidationManager';
import { ICalcValueHost } from '../../src/Interfaces/CalcValueHost';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { SimpleValueType } from '../../src/Interfaces/DataTypeConverterService';

function createVMConfig(): ValidationManagerConfig
{
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}

describe('FluentValidatorCollector', () => {
    test('constructor with vhConfig sets up vhConfig property', () => {
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(vhConfig);
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
        let testItem = new FluentValidatorCollector(vhConfig);
        expect(testItem.parentConfig).toBeDefined();
        expect(testItem.parentConfig.validatorConfigs).toEqual([]);
    });
    test('constructor with null in first parameter throws', () => {
        expect(() => new FluentValidatorCollector(null!)).toThrow('parentConfig');

    });

    test('add() with all parameters correctly defined', () => {
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(vhConfig);
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
        let testItem = new FluentValidatorCollector(vhConfig);
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
        let testItem = new FluentValidatorCollector(vhConfig);
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
});

describe('FluentConditionCollector', () => {
    test('constructor with vhConfig sets up vhConfig property', () => {
        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(vhConfig);
        expect(testItem.parentConfig).toBe(vhConfig);
    });
    test('constructor with null parameter creates a Config with conditionConfigs=[] and type="TBD"', () => {
        let testItem = new FluentConditionCollector(null);
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

        let testItem = new FluentConditionCollector(vhConfig);
        expect(testItem.parentConfig).toBeDefined();
        expect(testItem.parentConfig.conditionConfigs).toEqual([]);
    });
    test('add() with all parameters correctly defined', () => {
        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(vhConfig);

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
        let testItem = new FluentConditionCollector(vhConfig);
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

describe('fluent(vmConfig).static()', () => {
    test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().static('Field1', null, { label: 'Field 1' });
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1'
        });
    });
    test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().static('Field1', 'Test');
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test'
        });
    });

    test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().static('Field1');
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
        });
    });

    test('Pass in a StaticValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = fluent().static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        });        
    });
    test('Null name throws', () => {
        expect(() => fluent().static(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => fluent().static(100 as any)).toThrow('pass');
    });
});
describe('fluent().input()', () => {
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().input('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().input('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        
    });
    test('Name supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().input('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Pass in a InputValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = fluent().input({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
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
        expect(() => fluent().input(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => fluent().input(100 as any)).toThrow('pass');
    });
});

describe('fluent().property()', () => {
    test('Valid name, null data type and defined vhConfig. Adds PropertyValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let testItem = fluent().property('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let testItem = fluent().property('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        
    });
    test('Name supplied. Adds ValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let testItem = fluent().property('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Pass in a PropertyValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = fluent().property({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
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
        expect(() => fluent().property(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => fluent().property(100 as any)).toThrow('pass');
    });
});

describe('fluent(vmConfig).conditions', () => {
    test('Undefined parameter creates a FluentConditionCollector with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let testItem = fluent().conditions();
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });
    test('null parameter creates a FluentConditionCollector with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let testItem = fluent().conditions(null!);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });    
    test('Supplied parameter creates a FluentConditionCollector with the same vhConfig', () => {
        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = fluent().conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });    
    test('Supplied parameter with conditionConfig=null creates a FluentValidatorCollector with the same vhConfig and conditionConfig=[]', () => {
        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }
        let testItem = fluent().conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
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
        let testItem = fluent().calc('Field1', null, calcFnForTests);
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            calcFn: calcFnForTests
        });
    });
    test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().calc('Field1', 'Test', calcFnForTests);
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            calcFn: calcFnForTests
        });
    });

    test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = fluent().calc({ name: 'Field1', dataType: 'Test', label: 'Field 1', calcFn: calcFnForTests });
        expect(testItem).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            calcFn: calcFnForTests
        });
    });
    test('calcFn is null throws', () => {
        expect(() => fluent().calc('Field1', null, null!)).toThrow(/function/);
    });    
    test('calcFn is not a function throws', () => {
        expect(() => fluent().calc('Field1', null, 100 as any)).toThrow(/function/);
    });    

    test('Null name throws', () => {
        expect(() => fluent().calc(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => fluent().calc(100 as any)).toThrow('pass');
    });
});


describe('FluentFactory', () => {
    test('Constructor followed by create will return an instance of FluentValidatorCollector with correct vhConfig', () => {
        let testItem = new FluentFactory();
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        let result: IFluentValidatorCollector | null = null;
        expect(() => result = testItem.createValidatorCollector(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(FluentValidatorCollector);
        expect(result!.parentConfig).toEqual(vhConfig);
    });
    test('Register followed by create returns an instance of the test class with correct vhConfig', () => {
        class TestFluentValidatorCollector implements IFluentValidatorCollector {
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
        testItem.registerValidatorCollector((vhConfig) => new TestFluentValidatorCollector(vhConfig));

        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        let result: IFluentValidatorCollector | null = null;
        expect(() => result = testItem.createValidatorCollector(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentValidatorCollector);
        expect(result!.parentConfig.dataType).toBe('test');
    });
    test('Constructor followed by create will return an instance of FluentConditionCollector with correct vhConfig', () => {
        let testItem = new FluentFactory();
        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let result: IFluentConditionCollector | null = null;
        expect(() => result = testItem.createConditionCollector(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(FluentConditionCollector);
        expect(result!.parentConfig).toEqual(vhConfig);
    });
    test('Register followed by create returns an instance of the test class with correct vhConfig', () => {
        class TestFluentConditionCollector implements IFluentConditionCollector {
            constructor(vhConfig: EvaluateChildConditionResultsBaseConfig) {
                this.parentConfig = { ...vhConfig, conditionType: 'Test' };
            }
            parentConfig: EvaluateChildConditionResultsBaseConfig;

            add(conditionType: string, conditionConfig: Partial<ConditionConfig> | null): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerConditionCollector((vhConfig) => new TestFluentConditionCollector(vhConfig));

        let vhConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let result: IFluentConditionCollector | null = null;
        expect(() => result = testItem.createConditionCollector(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentConditionCollector);
        expect(result!.parentConfig.conditionType).toBe('Test');
    })    
});

describe('finishFluentValidatorCollector ', () => {
    test('Only FluentValidatorCollector legal for first parameter. Unexpect type throws', () => {
        let vmConfig = createVMConfig();

        let testItem1 = new FluentValidatorCollector({ name: '', validatorConfigs: [] }); 
        expect(()=>finishFluentValidatorCollector(
            testItem1,
            '', {}, null, null)
        ).not.toThrow();
        let testItem2 = new FluentConditionCollector({ conditionType: '', conditionConfigs: [] });
        expect(()=>finishFluentValidatorCollector(
            testItem2,
            '', {}, null, null)
        ).toThrow();
        expect(()=>finishFluentValidatorCollector(
            100,
            '', {}, null, null)
        ).toThrow();       
        expect(()=>finishFluentValidatorCollector(
            null,
            '', {}, null, null)
        ).toThrow();               
    });
});
describe('finishFluentConditionCollector ', () => {
    test('Only FluentConditionCollector legal for first parameter. Unexpect type throws', () => {
        let vmConfig = createVMConfig();
        let testItem1 = new FluentConditionCollector({conditionType: '', conditionConfigs: [] }); 
        expect(()=>finishFluentConditionCollector(
            testItem1,
            '', {})
        ).not.toThrow();
        let testItem2 = new FluentValidatorCollector({ name: '', validatorConfigs: [] });
        expect(()=>finishFluentConditionCollector(
            testItem2,
            '', {})
        ).toThrow();
        expect(()=>finishFluentConditionCollector(
            100,
            '', {})
        ).toThrow();       
        expect(()=>finishFluentConditionCollector(
            null,
            '', {})
        ).toThrow();               
    });
});