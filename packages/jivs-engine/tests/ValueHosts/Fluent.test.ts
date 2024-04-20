import { MockValidationServices } from './../TestSupport/mocks';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { EvaluateChildConditionResultsConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { InputValidatorConfig } from '../../src/Interfaces/InputValidator';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import {
    FluentInputValidatorConfig, FluentValidatorCollector, FluentFactory, IFluentValidatorCollector, FluentConditionCollector, IFluentConditionCollector,
    finishFluentValidatorCollector, finishFluentConditionCollector,
    fluent
} from './../../src/ValueHosts/Fluent';
import { ValidationManagerConfig } from '../../src/Interfaces/ValidationManager';
import { ICalcValueHost, CalculationHandlerResult } from '../../src/Interfaces/CalcValueHost';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostResolver';

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
            type: ValueHostType.Input,
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
            type: ValueHostType.Input,
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
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(vhConfig);
        let inputValidatorConfig: FluentInputValidatorConfig = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(ConditionType.RequireText, {}, 'Error', inputValidatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                type: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() with null for conditionType, and other parameters correctly defined', () => {
        let vhConfig: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(vhConfig);
        let conditionConfig: ConditionConfig = {
            type: ConditionType.RequireText
        };
        let inputValidatorConfig: FluentInputValidatorConfig = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(null, conditionConfig, 'Error', inputValidatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                type: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() with null for error message and error message already assigned', () => {
        let vhConfig: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(vhConfig);
        let inputValidatorConfig: FluentInputValidatorConfig = {
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(ConditionType.RequireText, {}, null, inputValidatorConfig)).not.toThrow();
        expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
        expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
            conditionConfig: {
                type: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
});

describe('FluentConditionCollector', () => {
    test('constructor with vhConfig sets up vhConfig property', () => {
        let vhConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(vhConfig);
        expect(testItem.parentConfig).toBe(vhConfig);
    });
    test('constructor with null parameter creates a Config with conditionConfigs=[] and type="TBD"', () => {
        let testItem = new FluentConditionCollector(null);
        expect(testItem.parentConfig).toEqual({
            type: 'TBD',
            conditionConfigs: []
        });
    });    

    test('constructor with vhConfig that has conditionConfigs=null sets up vhConfig property with empty conditionConfigs array', () => {
        let vhConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }

        let testItem = new FluentConditionCollector(vhConfig);
        expect(testItem.parentConfig).toBeDefined();
        expect(testItem.parentConfig.conditionConfigs).toEqual([]);
    });
    test('add() with all parameters correctly defined', () => {
        let vhConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(vhConfig);

        expect(() => testItem.add(ConditionType.RequireText, {})).not.toThrow();
        expect(testItem.parentConfig.conditionConfigs!.length).toBe(1);
        expect(testItem.parentConfig.conditionConfigs![0]).toEqual({
            type: ConditionType.RequireText
        });
    });
    test('add() with null for conditionType, and other parameters correctly defined', () => {
        let vhConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(vhConfig);
        let conditionConfig: ConditionConfig = {
            type: ConditionType.RequireText
        };

        expect(() => testItem.add(null, conditionConfig)).not.toThrow();
        expect(testItem.parentConfig.conditionConfigs!.length).toBe(1);
        expect(testItem.parentConfig.conditionConfigs![0]).toEqual({
            type: ConditionType.RequireText
        });
    });
});

describe('fluent(vmConfig).nonInput()', () => {
    test('Valid name, null data type and defined vhConfig. Adds NonInputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().nonInput('Field1', null, { label: 'Field 1' });
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            label: 'Field 1'
        });
    });
    test('Valid name, data type assigned. Adds NonInputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().nonInput('Field1', 'Test');
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            dataType: 'Test'
        });
    });

    test('Valid name. Adds NonInputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().nonInput('Field1');
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
        });
    });

    test('Pass in a NonInputValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = fluent().nonInput({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        });        
    });
    test('Null name throws', () => {
        expect(() => fluent().nonInput(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => fluent().nonInput(100 as any)).toThrow('pass');
    });
});
describe('fluent().input()', () => {
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().input('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().input('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            type: ValueHostType.Input,
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
            type: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
    });
    test('Pass in a InputValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = fluent().input({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            type: ValueHostType.Input,
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

describe('fluent(vmConfig).conditions', () => {
    test('Undefined parameter creates a FluentConditionCollector with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let testItem = fluent().conditions();
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            type: 'TBD',
            conditionConfigs: []
        });
    });
    test('null parameter creates a FluentConditionCollector with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let testItem = fluent().conditions(null!);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            type: 'TBD',
            conditionConfigs: []
        });
    });    
    test('Supplied parameter creates a FluentConditionCollector with the same vhConfig', () => {
        let parentConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = fluent().conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            type: ConditionType.All,
            conditionConfigs: []
        });
    });    
    test('Supplied parameter with conditionConfig=null creates a FluentValidatorCollector with the same vhConfig and conditionConfig=[]', () => {
        let parentConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }
        let testItem = fluent().conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            type: ConditionType.All,
            conditionConfigs: []
        });
    });        
});
describe('configCalc', () => {
    function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): CalculationHandlerResult
    {
        return 1;
    }
    test('Valid name, null data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().calc('Field1', null, calcFnForTests);
        expect(testItem).toEqual({
            type: ValueHostType.Calc,
            name: 'Field1',
            calcFn: calcFnForTests
        });
    });
    test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let testItem = fluent().calc('Field1', 'Test', calcFnForTests);
        expect(testItem).toEqual({
            type: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            calcFn: calcFnForTests
        });
    });

    test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let testItem = fluent().calc({ name: 'Field1', dataType: 'Test', label: 'Field 1', calcFn: calcFnForTests });
        expect(testItem).toEqual({
            type: ValueHostType.Calc,
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
            type: ValueHostType.Input,
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
                errorMessage: string | null, inputValidatorConfig: InputValidatorConfig): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerValidatorCollector((vhConfig) => new TestFluentValidatorCollector(vhConfig));

        let vhConfig: InputValueHostConfig = {
            type: ValueHostType.Input,
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
        let vhConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let result: IFluentConditionCollector | null = null;
        expect(() => result = testItem.createConditionCollector(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(FluentConditionCollector);
        expect(result!.parentConfig).toEqual(vhConfig);
    });
    test('Register followed by create returns an instance of the test class with correct vhConfig', () => {
        class TestFluentConditionCollector implements IFluentConditionCollector {
            constructor(vhConfig: EvaluateChildConditionResultsConfig) {
                this.parentConfig = { ...vhConfig, type: 'Test' };
            }
            parentConfig: EvaluateChildConditionResultsConfig;

            add(conditionType: string, conditionConfig: Partial<ConditionConfig> | null): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerConditionCollector((vhConfig) => new TestFluentConditionCollector(vhConfig));

        let vhConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let result: IFluentConditionCollector | null = null;
        expect(() => result = testItem.createConditionCollector(vhConfig)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentConditionCollector);
        expect(result!.parentConfig.type).toBe('Test');
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
        let testItem2 = new FluentConditionCollector({ type: '', conditionConfigs: [] });
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
        let testItem1 = new FluentConditionCollector({type: '', conditionConfigs: [] }); 
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