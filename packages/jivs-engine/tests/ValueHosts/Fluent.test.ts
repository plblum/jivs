import { RegExpConditionConfig, RequireTextCondition, RequireTextConditionConfig } from '../../src/Conditions/ConcreteConditions';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { EvaluateChildConditionResultsConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { InputValidatorConfig } from '../../src/Interfaces/InputValidator';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import {
    FluentInputValidatorConfig, FluentValidatorCollector, FluentFactory, config, customRule,
    IFluentValidatorCollector, FluentConditionCollector, IFluentConditionCollector, 
    finishFluentValidatorCollector, finishFluentConditionCollector
} from './../../src/ValueHosts/Fluent';
describe('FluentValidatorCollector', () => {
    test('constructor with config sets up config property', () => {
        let config: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(config);
        expect(testItem.parentConfig).toBe(config);
    });
    test('constructor with config that has validatorConfig=null sets up config property with empty validatorConfig array', () => {
        let config: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: null
        }
        let testItem = new FluentValidatorCollector(config);
        expect(testItem.parentConfig).toBeDefined();
        expect(testItem.parentConfig.validatorConfigs).toEqual([]);
    });
    test('constructor with null throws', () => {
        expect(() => new FluentValidatorCollector(null!)).toThrow('config');

    });
    test('add() with all parameters correctly defined', () => {
        let config: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(config);
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
        let config: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(config);
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
        let config: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorConfigs: []
        }
        let testItem = new FluentValidatorCollector(config);
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
    test('constructor with config sets up config property', () => {
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(config);
        expect(testItem.parentConfig).toBe(config);
    });
    test('constructor with null parameter creates a Config with conditionConfigs=[] and type="TBD"', () => {
        let testItem = new FluentConditionCollector(null);
        expect(testItem.parentConfig).toEqual({
            type: 'TBD',
            conditionConfigs: []
        });
    });    
    test('constructor with config that has conditionConfigs=null sets up config property with empty conditionConfigs array', () => {
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }

        let testItem = new FluentConditionCollector(config);
        expect(testItem.parentConfig).toBeDefined();
        expect(testItem.parentConfig.conditionConfigs).toEqual([]);
    });
    test('add() with all parameters correctly defined', () => {
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(config);

        expect(() => testItem.add(ConditionType.RequireText, {})).not.toThrow();
        expect(testItem.parentConfig.conditionConfigs!.length).toBe(1);
        expect(testItem.parentConfig.conditionConfigs![0]).toEqual({
            type: ConditionType.RequireText
        });
    });
    test('add() with null for conditionType, and other parameters correctly defined', () => {
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(config);
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

describe('FluentFactory', () => {
    test('Constructor followed by create will return an instance of FluentValidatorCollector with correct config', () => {
        let testItem = new FluentFactory();
        let config: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        let result: IFluentValidatorCollector | null = null;
        expect(() => result = testItem.createValidatorCollector(config)).not.toThrow();
        expect(result).toBeInstanceOf(FluentValidatorCollector);
        expect(result!.parentConfig).toEqual(config);
    });
    test('Register followed by create returns an instance of the test class with correct config', () => {
        class TestFluentValidatorCollector implements IFluentValidatorCollector {
            constructor(config: InputValueHostConfig) {
                this.parentConfig = { ...config, dataType: 'test' };
            }
            parentConfig: InputValueHostConfig;
            add(conditionType: string, conditionConfig: ConditionConfig | null,
                errorMessage: string | null, inputValidatorConfig: InputValidatorConfig): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerValidatorCollector((config) => new TestFluentValidatorCollector(config));

        let config: InputValueHostConfig = {
            type: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        let result: IFluentValidatorCollector | null = null;
        expect(() => result = testItem.createValidatorCollector(config)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentValidatorCollector);
        expect(result!.parentConfig.dataType).toBe('test');
    });
    test('Constructor followed by create will return an instance of FluentConditionCollector with correct config', () => {
        let testItem = new FluentFactory();
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let result: IFluentConditionCollector | null = null;
        expect(() => result = testItem.createConditionCollector(config)).not.toThrow();
        expect(result).toBeInstanceOf(FluentConditionCollector);
        expect(result!.parentConfig).toEqual(config);
    });
    test('Register followed by create returns an instance of the test class with correct config', () => {
        class TestFluentConditionCollector implements IFluentConditionCollector {
            constructor(config: EvaluateChildConditionResultsConfig) {
                this.parentConfig = { ...config, type: 'Test' };
            }
            parentConfig: EvaluateChildConditionResultsConfig;

            add(conditionType: string, conditionConfig: Partial<ConditionConfig> | null): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerConditionCollector((config) => new TestFluentConditionCollector(config));

        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let result: IFluentConditionCollector | null = null;
        expect(() => result = testItem.createConditionCollector(config)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentConditionCollector);
        expect(result!.parentConfig.type).toBe('Test');
    })    
});

describe('configNonInput', () => {
    test('Valid name, null data type and defined config returned as new object with addition of type', () => {
        let testItem = config().nonInput('Field1', null, { label: 'Field 1' });
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            label: 'Field 1'
        });
    });
    test('Valid name, valid data type and undefined config returned as new object with addition of type', () => {
        let testItem = config().nonInput('Field1', 'Test');
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            dataType: 'Test'
        });
    });
    test('Valid name only returned as new object with addition of type', () => {
        let testItem = config().nonInput('Field1');
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
        });
    });
    test('First parameter is a config returned as new object with addition of type', () => {
        let testItem = config().nonInput({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        });
    });
    test('Null name throws', () => {
        expect(() => config().nonInput(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => config().nonInput(100 as any)).toThrow('pass');
    });
});
describe('configInput', () => {
    test('Valid name, null data type and defined config returned as new object with addition of type', () => {
        let testItem = config().input('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Valid name, valid data type and undefined config returned as new object with addition of type', () => {
        let testItem = config().input('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        });
    });
    test('Valid name only returned as new object with addition of type', () => {
        let testItem = config().input('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        });
    });
    test('First parameter is a config returned as new object with addition of type', () => {
        let testItem = config().input({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Null name throws', () => {
        expect(() => config().input(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => config().input(100 as any)).toThrow('pass');
    });
});
describe('configChildren', () => {
    test('Undefined parameter creates a FluentConditionCollector with config containing type=TBD and collectionConfig=[]', () => {
        let testItem = config().conditions();
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            type: 'TBD',
            conditionConfigs: []
        });
    });
    test('null parameter creates a FluentConditionCollector with config containing type=TBD and collectionConfig=[]', () => {
        let testItem = config().conditions(null!);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            type: 'TBD',
            conditionConfigs: []
        });
    });    
    test('Supplied parameter creates a FluentConditionCollector with the same config', () => {
        let parentConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = config().conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            type: ConditionType.All,
            conditionConfigs: []
        });
    });    
    test('Supplied parameter with conditionConfig=null creates a FluentValidatorCollector with the same config and conditionConfig=[]', () => {
        let parentConfig: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }
        let testItem = config().conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            type: ConditionType.All,
            conditionConfigs: []
        });
    });        
});
// Test cases for creating fluent functions...
function testChainRequireText_Val(conditionConfig: Omit<RequireTextConditionConfig, 'type' | 'valueHostName'>,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig
): FluentValidatorCollector {
        return finishFluentValidatorCollector(this, ConditionType.RequireText, conditionConfig, errorMessage, inputValidatorParameters);
}
function testChainRequireText_Cond(conditionConfig: Omit<RequireTextConditionConfig, 'type' | 'valueHostName'>
): FluentConditionCollector {
    return finishFluentConditionCollector(this, ConditionType.RequireText, conditionConfig, 'valueHostName');

}

function testChainRegExp_Val(conditionConfig: Omit<RegExpConditionConfig, 'type' | 'valueHostName'>,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig
): FluentValidatorCollector {

    return finishFluentValidatorCollector(this, ConditionType.RegExp, conditionConfig,
        errorMessage, inputValidatorParameters);
}
function testChainRegExp_Cond(conditionConfig: Omit<RegExpConditionConfig, 'type' | 'valueHostName'>): FluentConditionCollector {

    return finishFluentConditionCollector(this, ConditionType.RegExp, conditionConfig, 'valueHostName');
}
// interface that extends the class FluentValidatorCollector
declare module './../../src/ValueHosts/Fluent'
{
    export interface FluentValidatorCollector {
        testChainRequireText(conditionConfig: Omit<RequireTextConditionConfig, 'type' | 'valueHostName'>,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig
        ): FluentValidatorCollector;
        testChainRegExp(conditionConfig: Omit<RegExpConditionConfig, 'type' | 'valueHostName'>,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig
        ): FluentValidatorCollector;
    }
    export interface FluentConditionCollector {
        testChainRequireText(conditionConfig:
            Omit<RequireTextConditionConfig, 'type' | 'valueHostName'>
        ): FluentConditionCollector;
        testChainRegExp(conditionConfig:
            Omit<RegExpConditionConfig, 'type' | 'valueHostName'>
        ): FluentConditionCollector;
    }    
}
//  Make JavaScript associate the function with the class.
FluentValidatorCollector.prototype.testChainRequireText = testChainRequireText_Val;
FluentValidatorCollector.prototype.testChainRegExp = testChainRegExp_Val;
FluentConditionCollector.prototype.testChainRequireText = testChainRequireText_Cond;
FluentConditionCollector.prototype.testChainRegExp = testChainRegExp_Cond;

describe('Fluent chaining on configInput', () => {
    test('configInput: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let testItem = config().input('Field1').testChainRequireText({}, 'Error', {});
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let parentConfig = (testItem as FluentValidatorCollector).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.type).toBe(ConditionType.RequireText);
    });
    test('configInput: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let testItem = config().input('Field1')
            .testChainRequireText({}, 'Error', {})
            .testChainRegExp({ expressionAsString: '\\d' }, 'Error2');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let parentConfig = (testItem as FluentValidatorCollector).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(2);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.type).toBe(ConditionType.RequireText);
        expect(parentConfig.validatorConfigs![1].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![1].conditionConfig!.type).toBe(ConditionType.RegExp);
        expect((parentConfig.validatorConfigs![1].conditionConfig! as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
});
describe('customRule', () => {
    test('Provide a valid function and get back a FluentValidatorCollector with inputValidatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let testItem = config().input('Field1').customRule((requester) =>
            {
                return new RequireTextCondition({ type: ConditionType.RequireText, valueHostName: null });
            },
            'Error',
            {
                summaryMessage: 'Summary'
            });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let parentConfig = (testItem as FluentValidatorCollector).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBe('Error');
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBe('Summary');        
    });
    test('Provide a valid function without errorMessage or inputValidatorParameters and get back a FluentValidatorCollector with inputValidatorConfig.conditionCreator setup, and conditionConfig null', () => {
        let testItem = config().input('Field1').customRule((requester) =>
            {
                return new RequireTextCondition({ type: ConditionType.RequireText, valueHostName: null });
            });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let parentConfig = (testItem as FluentValidatorCollector).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBeUndefined();
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBeUndefined();    
    });    

    test('Stand-alone call throws', () => {
        expect(() => customRule((requester) => {
            return new RequireTextCondition({ type: ConditionType.RequireText, valueHostName: null });
        },
            'Error',
            {
                summaryMessage: 'Summary'
            })).toThrow();
    });
});
describe('Fluent chaining on configChildren', () => {
    test('configChildren: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let testItem = config().conditions().testChainRequireText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig.conditionConfigs!.length).toBe(1);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].type).toBe(ConditionType.RequireText);
    });
    test('configChildren: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let testItem = config().conditions()
            .testChainRequireText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig.conditionConfigs!.length).toBe(2);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].type).toBe(ConditionType.RequireText);
        expect(parentConfig.conditionConfigs![1]).not.toBeNull();
        expect(parentConfig.conditionConfigs![1].type).toBe(ConditionType.RegExp);
        expect((parentConfig.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
    test('configChildren with EvaluateChildConditionResultsConfig parameter: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let eccrConfig: EvaluateChildConditionResultsConfig = {
            type: 'All',
            conditionConfigs: [] 
        };
        let testItem = config().conditions(eccrConfig).testChainRequireText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig).toBe(eccrConfig);
        expect(parentConfig.conditionConfigs!.length).toBe(1);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].type).toBe(ConditionType.RequireText);
    });
    test('configChildren with EvaluateChildConditionResultsConfig parameter: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let eccrConfig: EvaluateChildConditionResultsConfig = {
            type: 'All',
            conditionConfigs: [] 
        };        
        let testItem = config().conditions(eccrConfig)
            .testChainRequireText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig).toBe(eccrConfig);        
        expect(parentConfig.conditionConfigs!.length).toBe(2);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].type).toBe(ConditionType.RequireText);
        expect(parentConfig.conditionConfigs![1]).not.toBeNull();
        expect(parentConfig.conditionConfigs![1].type).toBe(ConditionType.RegExp);
        expect((parentConfig.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });    
});
describe('finishFluentValidatorCollector ', () => {
    test('Only FluentValidatorCollector legal for first parameter. Unexpect type throws', () => {
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