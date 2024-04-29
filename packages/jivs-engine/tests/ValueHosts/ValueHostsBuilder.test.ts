import { RequireTextConditionConfig, RegExpConditionConfig, RequireTextCondition } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { EvaluateChildConditionResultsBaseConfig } from "../../src/Conditions/EvaluateChildConditionResultsBase";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ICalcValueHost, CalculationHandlerResult } from "../../src/Interfaces/CalcValueHost";
import { ConditionConfig } from "../../src/Interfaces/Conditions";
import { ValidationSeverity } from "../../src/Interfaces/Validation";
import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";
import {
    FluentValidatorCollector, FluentConditionCollector, FluentValidatorConfig,
    finishFluentValidatorCollector, finishFluentConditionCollector, customRule
} from "../../src/ValueHosts/Fluent";
import { ValueHostsBuilder, build } from "../../src/ValueHosts/ValueHostsBuilder";
import { MockValidationServices } from "../TestSupport/mocks";

function createVMConfig(): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}

describe('ValueHostsBuilder constructor', () => {
    test('vmConfig with valueHostConfigs = null gets reassigned to []', () => {
        let testItem = createVMConfig();
        testItem.valueHostConfigs = null as any;
        build(testItem);
        expect(testItem.valueHostConfigs).toEqual([]);
    });
    test('vmConfig with valueHostConfigs that contains 1 InputValueHost retains that value', () => {
        let testItem = createVMConfig();
        let valueHostsConfigs: Array<ValueHostConfig> = [
            {
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }
        ];
        testItem.valueHostConfigs.push(valueHostsConfigs[0]);
        build(testItem);
        expect(testItem.valueHostConfigs).toEqual(valueHostsConfigs);
    });
});

describe('build(vmConfig).static()', () => {
    test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = build(vmConfig).static('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(ValueHostsBuilder);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1'
        }]);
    });

    test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = build(vmConfig).static('Field1', 'Test');
        expect(testItem).toBeInstanceOf(ValueHostsBuilder);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test'
        }]);
    });

    test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = build(vmConfig).static('Field1');
        expect(testItem).toBeInstanceOf(ValueHostsBuilder);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
        }]);
    });

    test('Pass in a StaticValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = build(vmConfig).static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(ValueHostsBuilder);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        }]);
    });

    test('Add two differently named StaticValueHostConfigs creates two entries in vmConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = build(vmConfig).static('Field1').static('Field2');
        expect(testItem).toBeInstanceOf(ValueHostsBuilder);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
        },
        {
            valueHostType: ValueHostType.Static,
            name: 'Field2',
        }]);
    });

    test('Valid name but added twice throws', () => {
        let vmConfig = createVMConfig();
        let testItem = build(vmConfig).static('Field1');
        expect(() => testItem.static('Field1')).toThrow(/already defined/);
    });


    test('Null name throws', () => {
        let vmConfig = createVMConfig();
        expect(() => build(vmConfig).static(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vmConfig = createVMConfig();
        expect(() => build(vmConfig).static(100 as any)).toThrow('pass');
    });
});
describe('build(vmConfig).input()', () => {
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);

        expect(vmConfig.valueHostConfigs).toEqual([expected]);
    });
    test('Name supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        expect(vmConfig.valueHostConfigs).toEqual([expected]);
    });
    test('Pass in a InputValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = build(vmConfig).input({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        expect(vmConfig.valueHostConfigs).toEqual([expected]);
    });
    test('Add same name twice throws', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1');
        expect(() => build(vmConfig).input('Field1')).toThrow(/already defined/)
    });
    test('Add 2 inputs, 1 non-input. All valid and generates 3 ValueHostConfigs in vmConfig', () => {
        let vmConfig = createVMConfig();

        let testItem1 = build(vmConfig).input('Field1');
        expect(testItem1).toBeInstanceOf(FluentValidatorCollector);
        let expected1 = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem1.parentConfig).toEqual(expected1);
        let testItem2 = build(vmConfig).input('Field2');
        expect(testItem2).toBeInstanceOf(FluentValidatorCollector);
        let expected2 = {
            valueHostType: ValueHostType.Input,
            name: 'Field2',
            validatorConfigs: []
        };
        expect(testItem2.parentConfig).toEqual(expected2);

        let testItem3 = build(vmConfig).static('Field3');
        let expected3 = {
            valueHostType: ValueHostType.Static,
            name: 'Field3'
        };
        expect(vmConfig.valueHostConfigs).toEqual([expected1, expected2, expected3]);
    });
    test('Null name throws', () => {
        expect(() => build(createVMConfig()).input(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => build(createVMConfig()).input(100 as any)).toThrow('pass');
    });
});
describe('build(vmConfig).conditions', () => {
    test('Undefined parameter creates a FluentConditionCollector with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).conditions();
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });
    test('null parameter creates a FluentConditionCollector with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).conditions(null!);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });
    test('Supplied parameter creates a FluentConditionCollector with the same vhConfig', () => {
        let vmConfig = createVMConfig();

        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let testItem = build(vmConfig).conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });
    test('Supplied parameter with conditionConfig=null creates a FluentValidatorCollector with the same vhConfig and conditionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }
        let testItem = build(vmConfig).conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });
});

describe('build(vmConfig).calc', () => {
    function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): CalculationHandlerResult {
        return 1;
    }
    test('Valid name, null data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).calc('Field1', null, calcFnForTests);
        expect(testItem).toBeInstanceOf(ValueHostsBuilder);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            calcFn: calcFnForTests
        }]);
    });
    test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).calc('Field1', 'Test', calcFnForTests);
        expect(testItem).toBeInstanceOf(ValueHostsBuilder);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            calcFn: calcFnForTests
        }]);
    });
    test('Null function throws', () => {
        let vmConfig = createVMConfig();

        expect(() => build(vmConfig).calc('Field1', 'Test', null!)).toThrow();

    });
    test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = build(vmConfig).calc({ name: 'Field1', dataType: 'Test', label: 'Field 1', calcFn: calcFnForTests });
        expect(testItem).toBeInstanceOf(ValueHostsBuilder);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            calcFn: calcFnForTests
        }]);
    });
    test('Null name throws', () => {
        expect(() => build(createVMConfig()).calc(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => build(createVMConfig()).calc(100 as any)).toThrow('pass');
    });
});


// Test cases for creating fluent functions...
function testChainRequireText_Val(conditionConfig: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig
): FluentValidatorCollector {
    return finishFluentValidatorCollector(this, ConditionType.RequireText, conditionConfig, errorMessage, validatorParameters);
}
function testChainRequireText_Cond(conditionConfig: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>
): FluentConditionCollector {
    return finishFluentConditionCollector(this, ConditionType.RequireText, conditionConfig, 'valueHostName');

}

function testChainRegExp_Val(conditionConfig: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig
): FluentValidatorCollector {

    return finishFluentValidatorCollector(this, ConditionType.RegExp, conditionConfig,
        errorMessage, validatorParameters);
}
function testChainRegExp_Cond(conditionConfig: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>): FluentConditionCollector {

    return finishFluentConditionCollector(this, ConditionType.RegExp, conditionConfig, 'valueHostName');
}
// interface that extends the class FluentValidatorCollector
declare module './../../src/ValueHosts/Fluent'
{
    export interface FluentValidatorCollector {
        testChainRequireText(conditionConfig: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig
        ): FluentValidatorCollector;
        testChainRegExp(conditionConfig: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig
        ): FluentValidatorCollector;
    }
    export interface FluentConditionCollector {
        testChainRequireText(conditionConfig:
            Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>
        ): FluentConditionCollector;
        testChainRegExp(conditionConfig:
            Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>
        ): FluentConditionCollector;
    }
}
//  Make JavaScript associate the function with the class.
FluentValidatorCollector.prototype.testChainRequireText = testChainRequireText_Val;
FluentValidatorCollector.prototype.testChainRegExp = testChainRegExp_Val;
FluentConditionCollector.prototype.testChainRequireText = testChainRequireText_Cond;
FluentConditionCollector.prototype.testChainRegExp = testChainRegExp_Cond;

describe('Fluent chaining on build(vmConfig).input', () => {
    test('build(vmConfig).input: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1').testChainRequireText({}, 'Error', {});
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let parentConfig = (testItem as FluentValidatorCollector).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
    });
    test('build(vmConfig).input: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1')
            .testChainRequireText({}, 'Error', {})
            .testChainRegExp({ expressionAsString: '\\d' }, 'Error2');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let parentConfig = (testItem as FluentValidatorCollector).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(2);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.validatorConfigs![1].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![1].conditionConfig!.conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.validatorConfigs![1].conditionConfig! as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
});
describe('customRule', () => {
    test('Provide a valid function and get back a FluentValidatorCollector with validatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
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
    test('Provide a valid function without errorMessage or validatorParameters and get back a FluentValidatorCollector with validatorConfig.conditionCreator setup, and conditionConfig null', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
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
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        },
            'Error',
            {
                summaryMessage: 'Summary'
            })).toThrow();
    });
});
describe('Fluent chaining on build(vmConfig).conditions', () => {
    test('build(vmConfig).conditions: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).conditions().testChainRequireText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig.conditionConfigs!.length).toBe(1);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
    });
    test('build(vmConfig).conditions: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).conditions()
            .testChainRequireText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig.conditionConfigs!.length).toBe(2);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.conditionConfigs![1]).not.toBeNull();
        expect(parentConfig.conditionConfigs![1].conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
    test('build(vmConfig).conditions with EvaluateChildConditionResultsBaseConfig parameter: Add RequiredTest condition to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let eccrConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: 'All',
            conditionConfigs: []
        };
        let testItem = build(vmConfig).conditions(eccrConfig).testChainRequireText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig).toBe(eccrConfig);
        expect(parentConfig.conditionConfigs!.length).toBe(1);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
    });
    test('build(vmConfig).conditions with EvaluateChildConditionResultsBaseConfig parameter: Add RequiredTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let eccrConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: 'All',
            conditionConfigs: []
        };
        let testItem = build(vmConfig).conditions(eccrConfig)
            .testChainRequireText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig).toBe(eccrConfig);
        expect(parentConfig.conditionConfigs!.length).toBe(2);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.conditionConfigs![1]).not.toBeNull();
        expect(parentConfig.conditionConfigs![1].conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
});

describe('updateInput', () => {
    test('With existing InputValueHost, all values supplied are updated', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1', LookupKey.Integer, { label: 'Field 1' });
        build(vmConfig).updateInput('Field1', { dataType: 'TEST', group: 'GROUP', initialValue: '1', label: 'UpdatedLabel', labell10n: 'ULl10n' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'TEST',
            group: 'GROUP',
            initialValue: '1',
            label: 'UpdatedLabel',
            labell10n: 'ULl10n',
            validatorConfigs: []
        });
    });
    test('With existing InputValueHost, supply unwanted properties. They are not applied, but valid ones are.', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1', LookupKey.Integer, { label: 'Field 1' });
        build(vmConfig).updateInput('Field1', <any>{
            name: 'ToIgnore', valueHostType: 'IgnoreType',
            validatorConfigs: [{}], label: 'UpdatedLabel'
        });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: LookupKey.Integer,
            label: 'UpdatedLabel',
            validatorConfigs: []
        });
    });
    test('With name assigned to another type of valueHost, throws.', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).static('Field1', LookupKey.Integer, { label: 'Field 1' });
        expect(() => build(vmConfig).updateInput('Field1', { label: 'UpdatedLabel' })).toThrow(/not type/);
    });
    test('With no matching ValueHostName, throws', () => {
        let vmConfig = createVMConfig();
        expect(() => build(vmConfig).updateInput('Field1', { label: 'UpdatedLabel' })).toThrow(/not defined/);
    });
});
describe('updateStatic', () => {
    test('With existing StaticValueHost, all values supplied are updated', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).static('Field1', LookupKey.Integer, { label: 'Field 1' });
        build(vmConfig).updateStatic('Field1', { dataType: 'TEST', initialValue: '1', label: 'UpdatedLabel', labell10n: 'ULl10n' });
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'TEST',
            initialValue: '1',
            label: 'UpdatedLabel',
            labell10n: 'ULl10n'
        }]);
    });
    test('With existing StaticValueHost, supply unwanted properties. They are not applied, but valid ones are.', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).static('Field1', LookupKey.Integer, { label: 'Field 1' });
        build(vmConfig).updateStatic('Field1', <any>{
            name: 'ToIgnore', valueHostType: 'IgnoreType',
            label: 'UpdatedLabel'
        });

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: LookupKey.Integer,
            label: 'UpdatedLabel'
        }]);
    });
    test('With name assigned to another type of valueHost, throws.', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1', LookupKey.Integer, { label: 'Field 1' });
        expect(() => build(vmConfig).updateStatic('Field1', { label: 'UpdatedLabel' })).toThrow(/not type/);
    });
    test('With no matching ValueHostName, throws', () => {
        let vmConfig = createVMConfig();
        expect(() => build(vmConfig).updateStatic('Field1', { label: 'UpdatedLabel' })).toThrow(/not defined/);
    });
});

describe('updateValidator', () => {
    test('With existing Validator, all values supplied are updated', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1')
            .requireText(null, 'OriginalError');
        build(vmConfig).updateValidator('Field1', ConditionType.RequireText,
            {
                enabled: true, errorMessage: 'UpdatedMessage', errorMessagel10n: 'l10n',
                summaryMessage: 'Summary', summaryMessagel10n: 'Summl10n',
                severity: ValidationSeverity.Severe
            });

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                enabled: true,
                errorMessage: 'UpdatedMessage',
                errorMessagel10n: 'l10n',
                summaryMessage: 'Summary',
                summaryMessagel10n: 'Summl10n',
                severity: ValidationSeverity.Severe
            }]
        }]);
    });
    test('With existing Validator, supply unwanted properties. They are not applied, but valid ones are.', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1').requireText(null, 'OriginalError');
        build(vmConfig).updateValidator('Field1', ConditionType.RequireText,
            <any>{
                errorMessage: 'Wanted',
                validatorType: 'Unwanted',
                conditionConfig: { conditionType: 'TEST' },
                conditionCreator: (x: unknown) => null
            });

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'Wanted',
            }]
        }]);
    });
    test('With name assigned to another type of valueHost, throws.', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).static('Field1', LookupKey.Integer, { label: 'Field 1' });
        expect(() => build(vmConfig).updateInput('Field1', { label: 'UpdatedLabel' })).toThrow(/not type/);
    });
    test('With no matching ValueHostName, throws', () => {
        let vmConfig = createVMConfig();
        expect(() => build(vmConfig).updateValidator('Field1', 'ERRORCODE',
            { errorMessage: 'UpdatedMessage' })).toThrow(/not defined/);
    });
    test('With no matching errorCode, throws', () => {
        let vmConfig = createVMConfig();
        build(vmConfig).input('Field1');
        expect(() => build(vmConfig).updateValidator('Field1', 'ERRORCODE',
            { errorMessage: 'UpdatedMessage' })).toThrow(/not defined/);
    });
});

describe('addValidatorsTo', () => {
    test('Without any matching validator, adds the new one', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1');
        build(vmConfig).addValidatorsTo('Field1').requireText(null, 'RequiredMessage');

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'RequiredMessage',
            }]
        }]);
    });
    test('Add 2 validators using chaining works', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1');
        build(vmConfig).addValidatorsTo('Field1').requireText().regExp('\\d');

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
            },
            {
                conditionConfig: {
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d'
                },
            }]
        }]);
    });
    test('With name assigned to another type of valueHost, throws.', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).static('Field1', LookupKey.Integer, { label: 'Field 1' });
        expect(() => build(vmConfig).addValidatorsTo('Field1')).toThrow(/not type/);
    });
    test('With no matching ValueHostName, throws', () => {
        let vmConfig = createVMConfig();
        expect(() => build(vmConfig).addValidatorsTo('Field1')).toThrow(/not defined/);
    });
    test('With matching errorCode on conditionType, throws', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1').requireText();
        expect(() => build(vmConfig).addValidatorsTo('Field1').requireText()).toThrow(/already defined/);
    });
    test('With matching errorCode on Validator.errorCode, throws', () => {
        let vmConfig = createVMConfig();

        let testItem = build(vmConfig).input('Field1').requireText({}, null, { errorCode: 'ERRORCODE' });
        expect(() => build(vmConfig).addValidatorsTo('Field1').notNull(null, { errorCode: 'ERRORCODE' })).toThrow(/already defined/);
    });
});

describe('favorUIMessages', () => {
    test('TextLocalizerService has no matches. Keep existing error messages', () => {
        let vmConfig = createVMConfig();
        let tls = new TextLocalizerService();
        vmConfig.services.textLocalizerService = tls;   // start fresh

        build(vmConfig).input('Field1').requireText(null, 'RequiredMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequiredMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        build(vmConfig).input('Field2').regExp('\\d', null, null, 'RegExpMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRegExpMessage',
                summaryMessagel10n: 'sml10n'
            }
        ).requireText(null, 'Field2Required');
        build(vmConfig).favorUIMessages();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'RequiredMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequiredMessage',
                summaryMessagel10n: 'sml10n'
            }]
        },
        {
            valueHostType: ValueHostType.Input,
            name: 'Field2',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RegExp,
                        expressionAsString: '\\d'
                    },
                    errorMessage: 'RegExpMessage',
                    errorMessagel10n: 'eml10n',
                    summaryMessage: 'SummaryRegExpMessage',
                    summaryMessagel10n: 'sml10n'
                },
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },
                    errorMessage: 'Field2Required',
                }]
        }
        ]);
    });
    test('TextLocalizerService has matches. Null all 4 message properties on all matches', () => {
        let vmConfig = createVMConfig();
        let tls = new TextLocalizerService();
        vmConfig.services.textLocalizerService = tls;   // start fresh
        tls.registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'tls-required'
        });
        tls.registerErrorMessage(ConditionType.RegExp, null, {
            '*': 'tls-regexp'
        });

        build(vmConfig).input('Field1').requireText(null, 'RequiredMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequiredMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        build(vmConfig).input('Field2').regExp('\\d', null, null, 'RegExpMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRegExpMessage',
                summaryMessagel10n: 'sml10n'
            }).requireText(null, 'Field2Required');
        build(vmConfig).favorUIMessages();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        },
        {
            valueHostType: ValueHostType.Input,
            name: 'Field2',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RegExp,
                        expressionAsString: '\\d'
                    }
                },
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },

                }]
        }
        ]);
    });

});