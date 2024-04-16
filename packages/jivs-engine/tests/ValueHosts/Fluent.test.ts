import { RegExpConditionConfig, RequiredTextCondition, RequiredTextConditionConfig } from '../../src/Conditions/ConcreteConditions';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { EvaluateChildConditionResultsConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { InputValidatorConfig } from '../../src/Interfaces/InputValidator';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { FluentInputValidatorConfig, FluentSyntaxRequiredError, FluentValidatorCollector, FluentFactory, configInput, configNonInput, customRule, IFluentValidatorCollector, FluentConditionCollector, IFluentConditionCollector, configChildren, FluentCollectorBase, finishFluentValidatorCollector, finishFluentConditionCollector } from './../../src/ValueHosts/Fluent';
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
        expect(testItem.config).toBe(config);
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
        expect(testItem.config).toBeDefined();
        expect(testItem.config.validatorConfigs).toEqual([]);
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
        expect(() => testItem.add(ConditionType.RequiredText, {}, 'Error', inputValidatorConfig)).not.toThrow();
        expect(testItem.config.validatorConfigs!.length).toBe(1);
        expect(testItem.config.validatorConfigs![0]).toEqual({
            conditionConfig: {
                type: ConditionType.RequiredText
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
            type: ConditionType.RequiredText
        };
        let inputValidatorConfig: FluentInputValidatorConfig = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(null, conditionConfig, 'Error', inputValidatorConfig)).not.toThrow();
        expect(testItem.config.validatorConfigs!.length).toBe(1);
        expect(testItem.config.validatorConfigs![0]).toEqual({
            conditionConfig: {
                type: ConditionType.RequiredText
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
        expect(() => testItem.add(ConditionType.RequiredText, {}, null, inputValidatorConfig)).not.toThrow();
        expect(testItem.config.validatorConfigs!.length).toBe(1);
        expect(testItem.config.validatorConfigs![0]).toEqual({
            conditionConfig: {
                type: ConditionType.RequiredText
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
        expect(testItem.config).toBe(config);
    });
    test('constructor with null parameter creates a Config with conditionConfigs=[] and type="TBD"', () => {
        let testItem = new FluentConditionCollector(null);
        expect(testItem.config).toEqual({
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
        expect(testItem.config).toBeDefined();
        expect(testItem.config.conditionConfigs).toEqual([]);
    });
    test('add() with all parameters correctly defined', () => {
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(config);

        expect(() => testItem.add(ConditionType.RequiredText, {})).not.toThrow();
        expect(testItem.config.conditionConfigs!.length).toBe(1);
        expect(testItem.config.conditionConfigs![0]).toEqual({
            type: ConditionType.RequiredText
        });
    });
    test('add() with null for conditionType, and other parameters correctly defined', () => {
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = new FluentConditionCollector(config);
        let conditionConfig: ConditionConfig = {
            type: ConditionType.RequiredText
        };

        expect(() => testItem.add(null, conditionConfig)).not.toThrow();
        expect(testItem.config.conditionConfigs!.length).toBe(1);
        expect(testItem.config.conditionConfigs![0]).toEqual({
            type: ConditionType.RequiredText
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
        expect(result!.config).toEqual(config);
    });
    test('Register followed by create returns an instance of the test class with correct config', () => {
        class TestFluentValidatorCollector implements IFluentValidatorCollector {
            constructor(config: InputValueHostConfig) {
                this.config = { ...config, dataType: 'test' };
            }
            config: InputValueHostConfig;
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
        expect(result!.config.dataType).toBe('test');
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
        expect(result!.config).toEqual(config);
    });
    test('Register followed by create returns an instance of the test class with correct config', () => {
        class TestFluentConditionCollector implements IFluentConditionCollector {
            constructor(config: EvaluateChildConditionResultsConfig) {
                this.config = { ...config, type: 'Test' };
            }
            config: EvaluateChildConditionResultsConfig;

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
        expect(result!.config.type).toBe('Test');
    })    
});

describe('configNonInput', () => {
    test('Valid name, null data type and defined config returned as new object with addition of type', () => {
        let testItem = configNonInput('Field1', null, { label: 'Field 1' });
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            label: 'Field 1'
        });
    });
    test('Valid name, valid data type and undefined config returned as new object with addition of type', () => {
        let testItem = configNonInput('Field1', 'Test');
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            dataType: 'Test'
        });
    });
    test('Valid name only returned as new object with addition of type', () => {
        let testItem = configNonInput('Field1');
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
        });
    });
    test('First parameter is a config returned as new object with addition of type', () => {
        let testItem = configNonInput({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        });
    });
    test('Null name throws', () => {
        expect(() => configNonInput(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => configNonInput(100 as any)).toThrow('pass');
    });
});
describe('configInput', () => {
    test('Valid name, null data type and defined config returned as new object with addition of type', () => {
        let testItem = configInput('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.config).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Valid name, valid data type and undefined config returned as new object with addition of type', () => {
        let testItem = configInput('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.config).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        });
    });
    test('Valid name only returned as new object with addition of type', () => {
        let testItem = configInput('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.config).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        });
    });
    test('First parameter is a config returned as new object with addition of type', () => {
        let testItem = configInput({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.config).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Null name throws', () => {
        expect(() => configInput(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => configInput(100 as any)).toThrow('pass');
    });
});
describe('configChildren', () => {
    test('Undefined parameter creates a FluentConditionCollector with config containing type=TBD and collectionConfig=[]', () => {
        let testItem = configChildren();
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.config).toEqual({
            type: 'TBD',
            conditionConfigs: []
        });
    });
    test('null parameter creates a FluentConditionCollector with config containing type=TBD and collectionConfig=[]', () => {
        let testItem = configChildren(null!);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.config).toEqual({
            type: 'TBD',
            conditionConfigs: []
        });
    });    
    test('Supplied parameter creates a FluentConditionCollector with the same config', () => {
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = configChildren(config);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.config).toEqual({
            type: ConditionType.All,
            conditionConfigs: []
        });
    });    
    test('Supplied parameter with conditionConfig=null creates a FluentValidatorCollector with the same config and conditionConfig=[]', () => {
        let config: EvaluateChildConditionResultsConfig = {
            type: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }
        let testItem = configChildren(config);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.config).toEqual({
            type: ConditionType.All,
            conditionConfigs: []
        });
    });        
});
// Test cases for creating fluent functions...
function testChainRequiredText_Val(conditionConfig: Omit<RequiredTextConditionConfig, 'type' | 'valueHostName'>,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig
): FluentValidatorCollector {
        return finishFluentValidatorCollector(this, ConditionType.RequiredText, conditionConfig, errorMessage, inputValidatorParameters);
}
function testChainRequiredText_Cond(conditionConfig: Omit<RequiredTextConditionConfig, 'type' | 'valueHostName'>
): FluentConditionCollector {
    return finishFluentConditionCollector(this, ConditionType.RequiredText, conditionConfig, 'valueHostName');

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
        testChainRequiredText(conditionConfig: Omit<RequiredTextConditionConfig, 'type' | 'valueHostName'>,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig
        ): FluentValidatorCollector;
        testChainRegExp(conditionConfig: Omit<RegExpConditionConfig, 'type' | 'valueHostName'>,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig
        ): FluentValidatorCollector;
    }
    export interface FluentConditionCollector {
        testChainRequiredText(conditionConfig:
            Omit<RequiredTextConditionConfig, 'type' | 'valueHostName'>
        ): FluentConditionCollector;
        testChainRegExp(conditionConfig:
            Omit<RegExpConditionConfig, 'type' | 'valueHostName'>
        ): FluentConditionCollector;
    }    
}
//  Make JavaScript associate the function with the class.
FluentValidatorCollector.prototype.testChainRequiredText = testChainRequiredText_Val;
FluentValidatorCollector.prototype.testChainRegExp = testChainRegExp_Val;
FluentConditionCollector.prototype.testChainRequiredText = testChainRequiredText_Cond;
FluentConditionCollector.prototype.testChainRegExp = testChainRegExp_Cond;

describe('Fluent chaining on configInput', () => {
    test('configInput: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let testItem = configInput('Field1').testChainRequiredText({}, 'Error', {});
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let config = (testItem as FluentValidatorCollector).config;
        expect(config.validatorConfigs!.length).toBe(1);
        expect(config.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(config.validatorConfigs![0].conditionConfig!.type).toBe(ConditionType.RequiredText);
    });
    test('configInput: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let testItem = configInput('Field1')
            .testChainRequiredText({}, 'Error', {})
            .testChainRegExp({ expressionAsString: '\\d' }, 'Error2');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let config = (testItem as FluentValidatorCollector).config;
        expect(config.validatorConfigs!.length).toBe(2);
        expect(config.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(config.validatorConfigs![0].conditionConfig!.type).toBe(ConditionType.RequiredText);
        expect(config.validatorConfigs![1].conditionConfig).not.toBeNull();
        expect(config.validatorConfigs![1].conditionConfig!.type).toBe(ConditionType.RegExp);
        expect((config.validatorConfigs![1].conditionConfig! as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
});
describe('customRule', () => {
    test('Provide a valid function and get back a FluentValidatorCollector with inputValidatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let testItem = configInput('Field1').customRule((requester) =>
            {
                return new RequiredTextCondition({ type: ConditionType.RequiredText, valueHostName: null });
            },
            'Error',
            {
                summaryMessage: 'Summary'
            });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let config = (testItem as FluentValidatorCollector).config;
        expect(config.validatorConfigs!.length).toBe(1);
        expect(config.validatorConfigs![0].conditionConfig).toBeNull();
        expect(config.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(config.validatorConfigs![0].errorMessage).toBe('Error');
        expect(config.validatorConfigs![0].summaryMessage).toBe('Summary');        
    });
    test('Provide a valid function without errorMessage or inputValidatorParameters and get back a FluentValidatorCollector with inputValidatorConfig.conditionCreator setup, and conditionConfig null', () => {
        let testItem = configInput('Field1').customRule((requester) =>
            {
                return new RequiredTextCondition({ type: ConditionType.RequiredText, valueHostName: null });
            });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let config = (testItem as FluentValidatorCollector).config;
        expect(config.validatorConfigs!.length).toBe(1);
        expect(config.validatorConfigs![0].conditionConfig).toBeNull();
        expect(config.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(config.validatorConfigs![0].errorMessage).toBeUndefined();
        expect(config.validatorConfigs![0].summaryMessage).toBeUndefined();    
    });    

    test('Stand-alone call throws', () => {
        expect(() => customRule((requester) => {
            return new RequiredTextCondition({ type: ConditionType.RequiredText, valueHostName: null });
        },
            'Error',
            {
                summaryMessage: 'Summary'
            })).toThrow();
    });
});
describe('Fluent chaining on configChildren', () => {
    test('configChildren: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let testItem = configChildren().testChainRequiredText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let config = (testItem as FluentConditionCollector).config;
        expect(config.conditionConfigs!.length).toBe(1);
        expect(config.conditionConfigs![0]).not.toBeNull();
        expect(config.conditionConfigs![0].type).toBe(ConditionType.RequiredText);
    });
    test('configChildren: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let testItem = configChildren()
            .testChainRequiredText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let config = (testItem as FluentConditionCollector).config;
        expect(config.conditionConfigs!.length).toBe(2);
        expect(config.conditionConfigs![0]).not.toBeNull();
        expect(config.conditionConfigs![0].type).toBe(ConditionType.RequiredText);
        expect(config.conditionConfigs![1]).not.toBeNull();
        expect(config.conditionConfigs![1].type).toBe(ConditionType.RegExp);
        expect((config.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
    test('configChildren with EvaluateChildConditionResultsConfig parameter: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let eccrConfig: EvaluateChildConditionResultsConfig = {
            type: 'All',
            conditionConfigs: [] 
        };
        let testItem = configChildren(eccrConfig).testChainRequiredText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let config = (testItem as FluentConditionCollector).config;
        expect(config).toBe(eccrConfig);
        expect(config.conditionConfigs!.length).toBe(1);
        expect(config.conditionConfigs![0]).not.toBeNull();
        expect(config.conditionConfigs![0].type).toBe(ConditionType.RequiredText);
    });
    test('configChildren with EvaluateChildConditionResultsConfig parameter: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let eccrConfig: EvaluateChildConditionResultsConfig = {
            type: 'All',
            conditionConfigs: [] 
        };        
        let testItem = configChildren(eccrConfig)
            .testChainRequiredText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let config = (testItem as FluentConditionCollector).config;
        expect(config).toBe(eccrConfig);        
        expect(config.conditionConfigs!.length).toBe(2);
        expect(config.conditionConfigs![0]).not.toBeNull();
        expect(config.conditionConfigs![0].type).toBe(ConditionType.RequiredText);
        expect(config.conditionConfigs![1]).not.toBeNull();
        expect(config.conditionConfigs![1].type).toBe(ConditionType.RegExp);
        expect((config.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
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