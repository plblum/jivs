
import { IDataTypeIdentifier } from './../../src/Interfaces/DataTypeIdentifier';
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import {
    type RequireTextConditionConfig, type RangeConditionConfig,
    RequireTextCondition,
    RangeCondition, EqualToCondition,
    NotEqualToCondition, GreaterThanCondition,
    GreaterThanOrEqualCondition, LessThanCondition,
    LessThanOrEqualCondition, StringLengthConditionConfig, StringLengthCondition,
    RegExpConditionConfig, RegExpCondition,
    AllMatchCondition, DataTypeCheckConditionConfig, DataTypeCheckCondition,
    AnyMatchCondition, CountMatchesCondition,
    CountMatchesConditionConfig, AllMatchConditionConfig, AnyMatchConditionConfig, NotNullCondition, NotNullConditionConfig,
    EqualToConditionConfig,
    NotEqualToConditionConfig,
    GreaterThanConditionConfig,
    GreaterThanOrEqualConditionConfig,
    LessThanConditionConfig,
    LessThanOrEqualConditionConfig,
    EqualToValueCondition,
    EqualToValueConditionConfig,
    GreaterThanOrEqualValueCondition,
    GreaterThanOrEqualValueConditionConfig,
    GreaterThanValueCondition,
    GreaterThanValueConditionConfig,
    LessThanOrEqualValueCondition,
    LessThanOrEqualValueConditionConfig,
    LessThanValueCondition,
    LessThanValueConditionConfig,
    NotEqualToValueCondition,
    NotEqualToValueConditionConfig,
    PositiveCondition,
    PositiveConditionConfig,
    IntegerCondition,
    IntegerConditionConfig,
    MaxDecimalsCondition,
    MaxDecimalsConditionConfig
} from "../../src/Conditions/ConcreteConditions";
import { NotCondition, NotConditionConfig } from "../../src/Conditions/NotCondition";
import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggerService";

import {
    MockValidationServices, MockValidationManager,
} from "../TestSupport/mocks";
import { ConditionEvaluateResult, ConditionCategory } from "../../src/Interfaces/Conditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { IntegerConverter } from "../../src/DataTypes/DataTypeConverters";
import { AlwaysMatchesConditionType, NeverMatchesConditionType, IsUndeterminedConditionType, registerTestingOnlyConditions, EvaluatesAsPromiseConditionType, makeDisposable, DisposableConditionType } from "../TestSupport/conditionsForTesting";
import { CompareToSecondValueHostConditionBaseConfig } from "../../src/Conditions/CompareToSecondValueHostConditionBase";
import { CompareToValueConditionBaseConfig } from "../../src/Conditions/CompareToValueConditionBase";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { RegExpConditionBase, RegExpConditionBaseConfig } from "../../src/Conditions/RegExpConditionBase";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { NumberConditionBaseConfig, NumberConditionBase } from "../../src/Conditions/NumberConditionBase";
import { IValueHost } from "../../src/Interfaces/ValueHost";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { DataTypeIdentifierService } from '../../src/Services/DataTypeIdentifierService';
import { IDataTypeConverter } from '../../src/Interfaces/DataTypeConverters';
import { SimpleValueType } from '../../src/Interfaces/DataTypeConverterService';
import { ConditionFactory } from '../../src/Conditions/ConditionFactory';
import { ConsoleLoggerService } from '../../src/Services/ConsoleLoggerService';


describe('ConditionBase class additional cases', () => {
    test('Config.valueHostName with unknown name logs and throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let logger = services.loggerService as CapturingLogger;
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'PropertyNotRegistered',
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        expect(() => testItem.evaluate(vh, vm)).toThrow(/valueHostName/);
        expect(logger.findMessage('valueHostName: is unknown', LoggingLevel.Error, LoggingCategory.Configuration)).toBeTruthy();
    });
    test('Config.valueHostName with null and evaluate value is null logs and throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let logger = services.loggerService as CapturingLogger;
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'PropertyNotRegistered',
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        expect(() => testItem.evaluate(null, vm)).toThrow(/valueHostName/);
        expect(logger.findMessage('valueHostName: is unknown', LoggingLevel.Error, LoggingCategory.Configuration)).toBeTruthy();
    });
    test('ensurePrimaryValueHost with ValueHostName = null and parameter = null throws exception', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null,
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        expect(() => testItem.evaluate(null, vm)).toThrow(/Missing value for valueHostName/);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('Missing value for valueHostName', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();

    });
    test('ensurePrimaryValueHost will ValueHostName = null and parameter = assigned works normally', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null,
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('dispose', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null,
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        testItem.dispose();
        expect(()=> testItem.evaluate(null, vm)).toThrow(TypeError);
    });    
    test('dispose with IDisposable on config ', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = makeDisposable({
            conditionType: ConditionType.RequireText,
            valueHostName: null,
            trim: true
        });
        let testItem = new RequireTextCondition(config);
        testItem.dispose();
        expect(()=> testItem.evaluate(null, vm)).toThrow(TypeError);
    });          
});

describe('class DataTypeCheckCondition', () => {
    test('DefaultConditionType', () => {
        expect(DataTypeCheckCondition.DefaultConditionType).toBe(ConditionType.DataTypeCheck);
    });
    test('evaluate returns Match when InputValue is not undefined and native Value is not undefined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);
        vh.setValues('A', 'A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValues(10, '10');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValues(null, '');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValues(false, 'NO');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate returns NoMatch when InputValue is not undefined but native Value is undefined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);
        vh.setInputValue('A');    // at this moment, setValue is undefined
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValues(undefined, '10');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate returns Undetermined when InputValue is undefined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);
        // at this moment, setValue is undefined
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(10);    // doesn't change InputValue...
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Using StaticValueHost for property throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);
        expect(() => testItem.evaluate(vh, vm)).toThrow(/Invalid ValueHost/);
        let logger = vm.services.loggerService as CapturingLogger;
        expect(logger.findMessage('Invalid ValueHost', LoggingLevel.Error)).toBeTruthy();

    });    
    test('getValuesForTokens where ConversionErrorTokenValue is setup shows that token', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        vh.setValueToUndefined({ conversionErrorTokenValue: 'ERROR' });
        let testItem = new DataTypeCheckCondition(config);

        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'ConversionError',
                associatedValue: 'ERROR',
                purpose: 'message'
            }
        ]);
    });
    test('getValuesForTokens where ConversionErrorTokenValue is null', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);

        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'ConversionError',
                associatedValue: null,
                purpose: 'message'
            }
        ]);
    });    
    test('category is DataTypeCheck', () => {
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new DataTypeCheckCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let condition = new DataTypeCheckCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: null,
        };
        let condition = new DataTypeCheckCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class RequireTextCondition', () => {
    test('DefaultConditionType', () => {
        expect(RequireTextCondition.DefaultConditionType).toBe(ConditionType.RequireText);
    });
    test('evaluate returns Match', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1'
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' ');   // no trimming built in for evaluate
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });

    test('evaluate returns NoMatch', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1'
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate with value of null and config.nullValueResult is undefined, returns NoMatch', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1'
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate not influenced by Config.trim=true because trim is for evaluateDuringEdit', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            trim: true,
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);

    });
    function testNullValueResult(nullValueResult: ConditionEvaluateResult) : void
    {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            nullValueResult: nullValueResult
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(nullValueResult);

    }
    test('evaluate returns Match for null when Config.nullValueResult = Match', () => {
        testNullValueResult(ConditionEvaluateResult.Match);
    });
    test('evaluate returns NoMatch for null when Config.nullValueResult = NoMatch', () => {
        testNullValueResult(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate returns Undetermined for null when Config.nullValueResult = Undefined', () => {
        testNullValueResult(ConditionEvaluateResult.Undetermined);
    });    
    test('evaluate returns Undetermined for undefined, and non-string types', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(10);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });

    test('evaluateDuringEdits returns Match', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.evaluateDuringEdits('A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' A', vh, services)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluateDuringEdits returns NoMatch', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('Config.trim undefined works like Trim=true', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.evaluateDuringEdits('A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' A', vh, services)).toBe(ConditionEvaluateResult.Match);
    });

    test('category is Require', () => {
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Require);
    });
    test('category is overridden', () => {
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
        };
        let condition = new RequireTextCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null,
        };
        let condition = new RequireTextCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});

describe('class RegExpConditionBase', () => {
    class TestRegExpConditionBase extends RegExpConditionBase<RegExpConditionBaseConfig> 
    {
        protected getRegExp(services: IValidationServices): RegExp {
            return /^\d*$/;
        }
        
    }
    test('Text contains "ABC" somewhere (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1'
        };
        let testItem = new TestRegExpConditionBase(config);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
});

describe('class RegExpCondition', () => {
    test('DefaultConditionType', () => {
        expect(RegExpCondition.DefaultConditionType).toBe(ConditionType.RegExp);
    });    
    test('Text contains "ABC" somewhere (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' ABC ');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('abc'); // case sensitive failure
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('AB\nC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" somewhere (case insensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: 'ABC',
            ignoreCase: true
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('abc');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('zabc');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' AbC ');   
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ab');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('AB\nC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" as the complete text (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            multiline: false
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC ');  // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" somewhere in multiline text (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            multiline: true
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC ');  // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Uses RegExp instance with case insensitive. Text contains "ABC" somewhere in multiline text (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expression: /^ABC$/im
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC ');   // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate not influenced by Config.trim=true', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            trim: true
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' ABC ');  // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate returns Undetermined for null, undefined, and non-string types', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(config);
        vh.setInputValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(10);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });

    test('Config lacks both expression and expressionAsString. Throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(() => testItem.evaluate(vh, vm)).toThrow(/regular expression/);
    });

    test('With duringEdit = true and supportsDuringEdit=true, text must exactly match ABC case insensitively for match', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: true
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.evaluateDuringEdits('ABC', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('ABCDEF', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('zABC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
         // trimming defaults to true
        expect(testItem.evaluateDuringEdits(' ABC ', vh, services)).toBe(ConditionEvaluateResult.Match);
        // case sensitive 
        expect(testItem.evaluateDuringEdits('abc', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('AB\nC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With duringEdit = true and supportsDuringEdit=false, always return Undetermined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: false
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.evaluateDuringEdits('ABC', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('ABCDEF', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('zABC', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
         // trimming defaults to true
        expect(testItem.evaluateDuringEdits(' ABC ', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        // case sensitive 
        expect(testItem.evaluateDuringEdits('abc', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('AB\nC', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With duringEdit = true and supportsDuringEdit=true and trim=false, text must exactly match trimmed ABC case insensitively for match', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: true,
            trim: false
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.evaluateDuringEdits('ABC', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('ABCDEF', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('zABC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' ABC ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        // case sensitive 
        expect(testItem.evaluateDuringEdits('abc', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('AB\nC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('category is DataTypeCheck', () => {
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
        };
        let condition = new RegExpCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: null,
        };
        let condition = new RegExpCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('dispose', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        testItem.evaluate(vh, vm);  // creates the regex
        testItem.dispose();
        expect(()=> testItem.evaluate(vh, vm)).toThrow(TypeError);
    });
});

describe('class RangeCondition', () => {
    test('DefaultConditionType', () => {
        expect(RangeCondition.DefaultConditionType).toBe(ConditionType.Range);
    });    
    test('evaluate when Min/Max assigned to string returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let testItem = new RangeCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('B');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('C');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('D');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('F');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('G');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('H');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('c');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('g');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate when Min/Max assigned to number returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: -8,
            maximum: 25
        };
        let testItem = new RangeCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-9);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(-8);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-7);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(24);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(25);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(26);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate when Min/Max assigned to date returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Date, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: new Date(Date.UTC(2000, 5, 1)),
            maximum: new Date(Date.UTC(2000, 5, 30))
        };
        let testItem = new RangeCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(new Date(Date.UTC(2000, 4, 31)));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(new Date(Date.UTC(2000, 5, 1)));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new Date(Date.UTC(2000, 5, 2)));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new Date(Date.UTC(2000, 5, 29)));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new Date(Date.UTC(2000, 5, 30)));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new Date(Date.UTC(2000, 6, 1)));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate when Min is unassigned and Max assigned to string returns Match less than or equal to Max; NoMatch otherwise', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: undefined,
            maximum: 'G'
        };
        let testItem = new RangeCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('.');   // some ascii before A
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('B');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('F');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('G');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('H');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('c');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('g');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate when Min is assigned and Max unassigned to string returns Match greater than or equal to Min; NoMatch otherwise', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'C',
            maximum: null   // should work like undefined
        };
        let testItem = new RangeCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('.');   // some ascii before A
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('B');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('C');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('D');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('F');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('G');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('H');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('c');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });


    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let testItem = new RangeCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('evaluate when Minimum is different data type from Value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'G',    // this is a mismatch
            maximum: 10  // this is OK
        };
        let testItem = new RangeCondition(config);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('Type mismatch. Value cannot be compared to Minimum', LoggingLevel.Warn, LoggingCategory.TypeMismatch)).toBeTruthy();

    });
    test('evaluate when Maximum is different data type from Value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 10, // this is OK
            maximum: 'G'    // this is a mismatch
        };
        let testItem = new RangeCondition(config);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('Type mismatch. Value cannot be compared to Maximum', LoggingLevel.Warn, LoggingCategory.TypeMismatch)).toBeTruthy();

    });
    test('Using IntegerConverter, evaluate to show that ConversionLookupKey is applied correctly.', () => {
        let services = new MockValidationServices(false, true);
        (services.dataTypeConverterService as DataTypeConverterService).register(new IntegerConverter());
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 1.6,
            maximum: 6.1,
            conversionLookupKey: LookupKey.Integer
        };
        let testItem = new RangeCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(1.51);  // this will round up to 2, above the minimum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(1.49);  // will round down to 1, below the minimum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(6.1);   // will round down to 6, below the maximum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(6.2);   // will round down to 6, below the maximum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(6.6);   // will round up to 7, above the maximum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });    
    test('getValuesForTokens with non-null values for parameters', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let testItem = new RangeCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Minimum',
                associatedValue: 'C',
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: 'G',
                purpose: 'parameter'
            }
        ]);
    });
    test('getValuesForTokens with null values for parameters', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: undefined,
            maximum: null
        };
        let testItem = new RangeCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Minimum',
                associatedValue: null,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: null,
                purpose: 'parameter'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: null
        };
        let testItem = new RangeCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents,
            minimum: 2,
            maximum: null
        };
        let testItem = new RangeCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            minimum: 2,
            maximum: undefined,
            valueHostName: 'Property1',
        };
        let condition = new RangeCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            minimum: 2,
            maximum: undefined,
            valueHostName: null,
        };
        let condition = new RangeCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});

describe('CompareToConditionBase class additional cases', () => {
    test('getValuesForTokens with secondValueHostName assigned supports {SecondLabel} token', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost('Property2', LookupKey.Number, 'Second label');

        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new EqualToCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: 'Second label',
                purpose: 'label'
            },
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    

    test('Config.secondValueHostName with unknown name logs and returns Undetermined', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let logger = services.loggerService as CapturingLogger;
        vh.setValue('');
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'PropertyNotRegistered',
            valueHostName: null
        };
        let testItem = new EqualToCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        expect(logger.findMessage('secondValueHostName: is unknown', LoggingLevel.Error, LoggingCategory.Configuration)).toBeTruthy(); 
    });
    
    test('Config.secondValueHostName with null logs and returns undefined', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let logger = services.loggerService as CapturingLogger;
        vh.setValue('');
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: null,
            secondValueHostName: null
        };
        let testItem = new EqualToCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        expect(logger.findMessage('secondValue: lacks value to evaluate', LoggingLevel.Error, LoggingCategory.Configuration)).toBeTruthy(); 

    });
});

describe('class EqualToCondition', () => {
    test('DefaultConditionType', () => {
        expect(EqualToCondition.DefaultConditionType).toBe(ConditionType.EqualTo);
    });

    test('evaluate using boolean for Match or NoMatch', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh1 = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Boolean, 'Label2');
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new EqualToCondition(config);
        vh1.setInputValue('---- does not matter ----');
        vh1.setValue(false);
        vh2.setValue(false);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.Match);
        vh1.setValue(true);
        vh2.setValue(true);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.Match);        
        vh1.setValue(true);
        vh2.setValue(false);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('evaluate using secondValueHostName property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new EqualToCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100);  // property value to match to the rest

        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label');
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new EqualToCondition(config);
        vh.setValue(null);
        vh2.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        // vh is a number, vh2 is not
        vh.setValue(100);
        vh2.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);        
    });
    
    test('Using ConversionLookupKey = Integer, show ValueHost(but not Second) is impacted by conversion', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let dsc = services.dataTypeConverterService as DataTypeConverterService;
        dsc.register(new IntegerConverter());        
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label');
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            conversionLookupKey: LookupKey.Integer,
            secondValueHostName: 'Property2'
        };
        let testItem = new EqualToCondition(config);
        vh2.setValue(100);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(99.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(99.9);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100.6);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Using SecondConversionLookupKey = Integer, show SecondValueHost(but not ValueHost) is impacted by conversion', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let dsc = services.dataTypeConverterService as DataTypeConverterService;
        dsc.register(new IntegerConverter());

        let vh1 = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label');
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            conversionLookupKey: null,
            secondValueHostName: 'Property2',
            secondConversionLookupKey: LookupKey.Integer
        };
        let testItem = new EqualToCondition(config);
        vh1.setInputValue('---- does not matter ----');
        vh1.setValue(100);
        
        vh2.setValue(99.1);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh2.setValue(99.9);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.Match);
        vh2.setValue(100.1);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.Match);
        vh2.setValue(100.6);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });    

    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new EqualToCondition(config);
        vh2.setValue(100);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: 'Label2',
                purpose: 'label'
            },        
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new EqualToCondition(config);
        vh2.setValue(null);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: '',
                purpose: 'label'
            },
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new EqualToCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: null,
            category: ConditionCategory.Contents
        };
        let testItem = new EqualToCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let condition = new EqualToCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: null,
            secondValueHostName: null
        };
        let condition = new EqualToCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class NotEqualToCondition', () => {
    test('DefaultConditionType', () => {
        expect(NotEqualToCondition.DefaultConditionType).toBe(ConditionType.NotEqualTo);
    });

    test('evaluate with boolean for Match or NoMatch', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Boolean, 'Label2');
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new NotEqualToCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(true);
        vh2.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(false);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate using secondValueHostName property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new NotEqualToCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100);  // property value to match to the rest

        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });


    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new NotEqualToCondition(config);
        vh2.setValue(100);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        // now swap them
        vh.setValue(100);
        vh2.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });

    test('getValuesForTokens using secondValueHostName', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockValueHost(
            'Property2', LookupKey.Number, 'Label2');
        vh2.setValue(100);
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new NotEqualToCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: 'Label2',
                purpose: 'label'
            },
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens using null', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new NotEqualToCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: '',
                purpose: 'label'
            },
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new NotEqualToCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValueHostName: null,
            category: ConditionCategory.Contents
        };
        let testItem = new NotEqualToCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let condition = new NotEqualToCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: null,
            secondValueHostName: null
        };
        let condition = new NotEqualToCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class GreaterThanCondition', () => {
    test('DefaultConditionType', () => {
        expect(GreaterThanCondition.DefaultConditionType).toBe(ConditionType.GreaterThan);
    });

    test('evaluate using boolean results in Undetermined because no support for GT operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Boolean, 'Label2');
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new GreaterThanCondition(config);
        vh.setValue(true);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So NoMatch because operator is GT
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate using secondValueHostName property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new GreaterThanCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100);  // property value to match to the rest

        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });


    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        vh2.setValue(100);
        let testItem = new GreaterThanCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        vh2.setValue(100);
        let testItem = new GreaterThanCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: 'Label2',
                purpose: 'label'
            },                
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new GreaterThanCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: '',
                purpose: 'label'
            },
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new GreaterThanCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValueHostName: null,
            category: ConditionCategory.Contents
        };
        let testItem = new GreaterThanCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let condition = new GreaterThanCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: null,
            secondValueHostName: null
        };
        let condition = new GreaterThanCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });        
});
describe('class GreaterThanOrEqualCondition', () => {
    test('DefaultConditionType', () => {
        expect(GreaterThanOrEqualCondition.DefaultConditionType).toBe(ConditionType.GreaterThanOrEqual);
    });
    test('evaluate using boolean results in Undetermined because no support for GTE operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Boolean, 'Label2');
        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new GreaterThanOrEqualCondition(config);
        vh.setValue(true);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So Match because operator is GTE
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(true); // secondValue == this value. So Match because operator is GTE
        vh2.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using secondValueHostName property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new GreaterThanOrEqualCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100);  // property value to match to the rest

        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');

        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new GreaterThanOrEqualCondition(config);
        vh2.setValue(100);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        // now swap them
        vh.setValue(100);
        vh2.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        vh2.setValue(100);
        let testItem = new GreaterThanOrEqualCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: 'Label2',
                purpose: 'label'
            },
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new GreaterThanOrEqualCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: '',
                purpose: 'label'
            },                
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new GreaterThanOrEqualCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: null,
            category: ConditionCategory.Contents
        };
        let testItem = new GreaterThanOrEqualCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let condition = new GreaterThanOrEqualCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: null,
            secondValueHostName: null
        };
        let condition = new GreaterThanOrEqualCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });            
});

describe('class LessThanCondition', () => {
    test('DefaultConditionType', () => {
        expect(LessThanCondition.DefaultConditionType).toBe(ConditionType.LessThan);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new LessThanCondition(config);
        vh2.setValue(100);
        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(99);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using boolean results in Undetermined because no support for LT operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Boolean, 'Label2');
        
        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new LessThanCondition(config);
        vh.setValue(true);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(true); // secondValue == this value. So NoMatch because operator is LT
        vh2.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(false); // secondValue == this value. So NoMatch because operator is LT
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);

    });
    test('evaluate using secondValueHostName property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new LessThanCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100);  // property value to match to the rest

        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(99);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new LessThanCondition(config);
        vh2.setValue(100);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        // swap them
        vh.setValue(100);
        vh2.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);        
    });
    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new LessThanCondition(config);
        vh2.setValue(100);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: 'Label2',
                purpose: 'label'
            },                
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new LessThanCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: '',
                purpose: 'label'
            },                
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new LessThanCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: null,
            category: ConditionCategory.Contents
        };
        let testItem = new LessThanCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let condition = new LessThanCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: LessThanConditionConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: null,
            secondValueHostName: null
        };
        let condition = new LessThanCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });            
});
describe('class LessThanOrEqualCondition', () => {
    test('DefaultConditionType', () => {
        expect(LessThanOrEqualCondition.DefaultConditionType).toBe(ConditionType.LessThanOrEqual);
    });

    test('evaluate using boolean results in Undetermined because no support for LTE operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Boolean, 'Label2');
        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new LessThanOrEqualCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So Match because operator is LTE
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(true); // secondValue == this value. So Match because operator is LTE
        vh2.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using secondValueHostName property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new LessThanOrEqualCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100);  // property value to match to the rest

        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(99);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');
        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new LessThanOrEqualCondition(config);
        vh2.setValue(100);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        // swap them
        vh.setValue(100);
        vh2.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh2.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        
    });
    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost(
            'Property2', LookupKey.Number, 'Label2');        
        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let testItem = new LessThanOrEqualCondition(config);
        vh2.setValue(100);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: 'Label2',
                purpose: 'label'
            },                
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new LessThanOrEqualCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'SecondLabel',
                associatedValue: '',
                purpose: 'label'
            },                
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: null
        };
        let testItem = new LessThanOrEqualCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: null,
            category: ConditionCategory.Contents
        };
        let testItem = new LessThanOrEqualCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Property1',
            secondValueHostName: 'Property2'
        };
        let condition = new LessThanOrEqualCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: LessThanOrEqualConditionConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: null,
            secondValueHostName: null
        };
        let condition = new LessThanOrEqualCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });            
});


describe('CompareToValueConditionBase class additional cases', () => {
    test('getValuesForTokens supports {CompareTo} token', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addMockInputValueHost('Property2', LookupKey.Number, 'Second label');

        let config: CompareToValueConditionBaseConfig= {
            conditionType: ConditionType.Unknown,
            valueHostName: 'Property1',
        };
        let testItem = new EqualToValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    
    test('Config secondValue with null logs and returns Undetermined', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let chainedLogger = logger.chainedLogger = new ConsoleLoggerService(undefined, undefined, true);
        vh.setValue('');
        let config: CompareToValueConditionBaseConfig= {
            conditionType: ConditionType.EqualTo,
            valueHostName: null,
            secondValue: null
        };
        let testItem = new EqualToValueCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        expect(logger.findMessage('secondValue: lacks value to evaluate', LoggingLevel.Error, 
            LoggingCategory.Configuration)).toBeTruthy();
    });
});

describe('class EqualToValueCondition', () => {
    test('DefaultConditionType', () => {
        expect(EqualToValueCondition.DefaultConditionType).toBe(ConditionType.EqualToValue);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new EqualToValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate using secondValue property with boolean for Match or NoMatch', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            secondValue: false,
        };
        let testItem = new EqualToValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
 
    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            secondValue: 100,
        };
        let testItem = new EqualToValueCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    
    test('Using ConversionLookupKey = Integer, show ValueHost(but not Second) is impacted by conversion', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let dsc = services.dataTypeConverterService as DataTypeConverterService;
        dsc.register(new IntegerConverter());        
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            conversionLookupKey: LookupKey.Integer,
            secondValue: 100,
        };
        let testItem = new EqualToValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(99.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(99.9);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100.6);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Using SecondConversionLookupKey = Integer, show secondvalue (but not ValueHost) is impacted by conversion', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let dsc = services.dataTypeConverterService as DataTypeConverterService;
        dsc.register(new IntegerConverter());

        let vh1 = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');

        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            conversionLookupKey: null,
            secondValue: 100.2,
            secondConversionLookupKey: LookupKey.Integer
        };
        let testItem = new EqualToValueCondition(config);
        vh1.setInputValue('---- does not matter ----');
        vh1.setValue(100);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.Match);
        vh1.setValue(100.2);
        expect(testItem.evaluate(vh1, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });    

    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            secondValue: 100,
        };
        let testItem = new EqualToValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            secondValue: undefined,
        };
        let testItem = new EqualToValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            secondValue: 10,
        };
        let testItem = new EqualToValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: EqualToValueConditionConfig= {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new EqualToValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});
describe('class NotEqualToValueCondition', () => {
    test('DefaultConditionType', () => {
        expect(NotEqualToValueCondition.DefaultConditionType).toBe(ConditionType.NotEqualToValue);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: NotEqualToValueConditionConfig= {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new NotEqualToValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using secondValue property with boolean for Match or NoMatch', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let config: NotEqualToValueConditionConfig= {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Property1',
            secondValue: false
        };
        let testItem = new NotEqualToValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: NotEqualToValueConditionConfig= {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new NotEqualToValueCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('getValuesForTokens using secondValue', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: NotEqualToValueConditionConfig= {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new NotEqualToValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });

    test('getValuesForTokens using null', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: NotEqualToValueConditionConfig= {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Property1',
            secondValue: null
        };
        let testItem = new NotEqualToValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: NotEqualToValueConditionConfig= {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new NotEqualToValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: NotEqualToValueConditionConfig= {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new NotEqualToValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });

});
describe('class GreaterThanValueCondition', () => {
    test('DefaultConditionType', () => {
        expect(GreaterThanValueCondition.DefaultConditionType).toBe(ConditionType.GreaterThanValue);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanValueConditionConfig= {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new GreaterThanValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate using boolean results in Undetermined because no support for GT operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let config: GreaterThanValueConditionConfig= {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Property1',
            secondValue: false
        };
        let testItem = new GreaterThanValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So NoMatch because operator is GT
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanValueConditionConfig= {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new GreaterThanValueCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanValueConditionConfig= {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new GreaterThanValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanValueConditionConfig= {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Property1',
            secondValue: null
        };
        let testItem = new GreaterThanValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: GreaterThanValueConditionConfig= {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new GreaterThanValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: GreaterThanValueConditionConfig= {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new GreaterThanValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});
describe('class GreaterThanOrEqualValueCondition', () => {
    test('DefaultConditionType', () => {
        expect(GreaterThanOrEqualValueCondition.DefaultConditionType).toBe(ConditionType.GreaterThanOrEqualValue);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new GreaterThanOrEqualValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate using boolean results in Undetermined because no support for GTE operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let config: GreaterThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: false
        };
        let testItem = new GreaterThanOrEqualValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So Match because operator is GTE
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new GreaterThanOrEqualValueCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new GreaterThanOrEqualValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: GreaterThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: null
        };
        let testItem = new GreaterThanOrEqualValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: GreaterThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new GreaterThanOrEqualValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: GreaterThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new GreaterThanOrEqualValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});

describe('class LessThanValueCondition', () => {
    test('DefaultConditionType', () => {
        expect(LessThanValueCondition.DefaultConditionType).toBe(ConditionType.LessThanValue);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: LessThanValueConditionConfig= {
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new LessThanValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(99);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using boolean results in Undetermined because no support for LT operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let config: LessThanValueConditionConfig= {
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Property1',
            secondValue: false
        };
        let testItem = new LessThanValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So NoMatch because operator is LT
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: LessThanValueConditionConfig= {
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new LessThanValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });

    test('category is overridden', () => {
        let config: LessThanValueConditionConfig= {
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new LessThanValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});
describe('class LessThanOrEqualValueCondition', () => {
    test('DefaultConditionType', () => {
        expect(LessThanOrEqualValueCondition.DefaultConditionType).toBe(ConditionType.LessThanOrEqualValue);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: LessThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(101);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(99);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using boolean results in Undetermined because no support for LTE operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Boolean, 'Label');
        let config: LessThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: false
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So Match because operator is LTE
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: LessThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('string');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('getValuesForTokens with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: LessThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 100
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: 100,
                purpose: 'value'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: LessThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: null
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'CompareTo',
                associatedValue: null,
                purpose: 'value'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: LessThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: LessThanOrEqualValueConditionConfig= {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});



describe('class StringLengthCondition', () => {
    test('DefaultConditionType', () => {
        expect(StringLengthCondition.DefaultConditionType).toBe(ConditionType.StringLength);
    });
    test('evaluate when both Min/Max are assigned returns Match inside of stringlength; NoMatch outside of stringlength', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5
        };
        let testItem = new StringLengthCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' 1');  // trim option does not matter
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('12');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1234');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' 1234 ');  // trim option does not mattern
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('12345');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('123456');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('12345 ');  // trim option doesn't matter
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('evaluate when Min is assigned, Max is null. Match when >= Min', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: null
        };
        let testItem = new StringLengthCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('12');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('123');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1234567890');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate when Max is assigned, Min is null. Match when <= Max', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: null,
            maximum: 5
        };
        let testItem = new StringLengthCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('12');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1234');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('12345');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('123456');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('1234567890');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: undefined,
            maximum: undefined
        };
        let testItem = new StringLengthCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('evaluate when Trim is false', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5,
            trim: false
        };
        let testItem = new StringLengthCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(' ');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' 1');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' 12 ');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' 1234 ');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With duringEdit = true and supportsDuringEdit=true and trim undefined (means true) match according to the rules, ', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: true
            // trim: undefined means enabled
        };
        let testItem = new StringLengthCondition(config);
        vh.setInputValue('---- does not matter ----');
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('1', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' 1', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('12', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('1234', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' 1234 ', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('12345', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('123456', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('12345 ', vh, services)).toBe(ConditionEvaluateResult.Match);                
    });

    test('With duringEdit = true and supportsDuringEdit=true and trim = false, match according to the rules, ', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: true,
            trim: false
        };
        let testItem = new StringLengthCondition(config);
        vh.setInputValue('---- does not matter ----');
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('1', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' 1', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('12', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('1234', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' 1234 ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('12345', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('123456', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('12345 ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);                
    });

    test('With duringEdit = true and supportsDuringEdit=false, always return Undetermined, ', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: false
        };
        let testItem = new StringLengthCondition(config);
        vh.setInputValue('---- does not matter ----');
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('12', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('123456', vh, services)).toBe(ConditionEvaluateResult.Undetermined);              
    });

    test('getValuesForTokens without calling evaluate and establishing length', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5
        };
        let testItem = new StringLengthCondition(config);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Length',
                associatedValue: 0,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Minimum',
                associatedValue: 2,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: 5,
                purpose: 'parameter'
            }
        ]);
    });
    test('getValuesForTokens with evaluating a string length of 5', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5
        };
        vh.setValue("ABCDE");
        let testItem = new StringLengthCondition(config);
        testItem.evaluate(vh, vm);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Length',
                associatedValue: 5,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Minimum',
                associatedValue: 2,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: 5,
                purpose: 'parameter'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: null,
            maximum: null
        };
        vh.setValue("ABCDE");
        let testItem = new StringLengthCondition(config);
        testItem.evaluate(vh, vm);
        let list = testItem.getValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Length',
                associatedValue: 5,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Minimum',
                associatedValue: null,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: null,
                purpose: 'parameter'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
        };
        let testItem = new StringLengthCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new StringLengthCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1'
        };
        let condition = new StringLengthCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: null
        };
        let condition = new StringLengthCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });            
});

describe('class AllMatchCondition', () => {
    test('DefaultConditionType', () => {
        expect(AllMatchCondition.DefaultConditionType).toBe(ConditionType.And);
    });
    test('With 0 child conditions, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: []
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the last evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the first evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs not supplied, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,

            }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,

            }],
            treatUndeterminedAs: ConditionEvaluateResult.NoMatch
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,
            }],
            treatUndeterminedAs: ConditionEvaluateResult.Undetermined
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions where the first evaluates as Undetermined but treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Parent ValueHost used by child RequireTextCondition', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: ConditionType.RequireText,
                // valueHostName omitted meaning it must use parent ValueHost
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                // valueHostName omitted meaning it must use parent ValueHost
                expressionAsString: 'ABC'
            }            ],
        };
        vh.setValue('ABC');    // for RequireTextCondition and RegExpCondition to match
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });    
    test('With 1 child that has invalid conditionConfig that evaluates as Undetermined and logs an error', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: 'Unknown'
            }]
        };
        let testItem = new AllMatchCondition(config);

        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('ConditionType not registered', LoggingLevel.Error, null)).toBeTruthy();
    });
    test('With 1 child whose evaluate() function returns a Promise throws', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: EvaluatesAsPromiseConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);

        expect(() => testItem.evaluate(vh, vm)).toThrow();
    });
    test('category is Children', () => {
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: []
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [],
            category: ConditionCategory.Contents
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: []
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostNames where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('gatherValueHostNames where two child have the same ValueHostName, while another is different. Expect 2 ValueHostNames', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },                
            ]
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('gatherValueHostNames where each child two have different ValueHosts, another is Null. Expect two ValueHostNames', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: null
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });        
    test('gatherValueHostNames where each child does not support gatherValueHostNames. No names returned', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [
                { conditionType: AlwaysMatchesConditionType },
                { conditionType: NeverMatchesConditionType }
            ]
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });        
    test('dispose followed by calls throws TypeErrors', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        testItem.dispose();
        expect(() => testItem.evaluate(vh, vm)).toThrow(TypeError);
    });    
    test('dispose with IDisposable on childConfigs', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.And,
            conditionConfigs: [{
                conditionType: DisposableConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        testItem.dispose();
        expect(() => testItem.evaluate(vh, vm)).toThrow(TypeError);
    });

});
describe('class AnyMatchCondition', () => {
    test('DefaultConditionType', () => {
        expect(AnyMatchCondition.DefaultConditionType).toBe(ConditionType.Or);
    });
    test('With 0 child conditions, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: []
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the last evaluates as NoMatch, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where the first evaluates as Match and the rest NoMatch, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });

    test('With 4 child conditions where all evaluate as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs not supplied, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,

            }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,

            }],
            treatUndeterminedAs: ConditionEvaluateResult.NoMatch
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,
            }],
            treatUndeterminedAs: ConditionEvaluateResult.Undetermined
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions where the first evaluates as Undetermined but treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child that has invalid conditionConfig that evaluates as Undetermined and logs an error', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: 'Unknown'
            }]
        };
        let testItem = new AnyMatchCondition(config);

        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('ConditionType not registered', LoggingLevel.Error, null)).toBeTruthy();
    });
    test('category is Children', () => {
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: []
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [],
            category: ConditionCategory.Contents
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: []
        };
        let condition = new AnyMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostNames where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new AnyMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('gatherValueHostNames where two child have the same ValueHostName, while another is different. Expect 2 ValueHostNames', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },                
            ]
        };
        let condition = new AnyMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('gatherValueHostNames where each child two have different ValueHosts, another is Null. Expect two ValueHostNames', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Or,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: null
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new AnyMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });            
});

describe('class CountMatchesCondition', () => {
    test('DefaultConditionType', () => {
        expect(CountMatchesCondition.DefaultConditionType).toBe(ConditionType.CountMatches);
    });
    function testCount(conditionTypes: Array<string>, minimum: number | undefined,
        maximum: number | undefined, expectedResult: ConditionEvaluateResult,
        treatUndeterminedAs?: ConditionEvaluateResult): void {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: minimum,
            maximum: maximum,
            conditionConfigs: []
        };
        if (treatUndeterminedAs != null)
            config.treatUndeterminedAs = treatUndeterminedAs;
        for (let conType of conditionTypes)
            config.conditionConfigs.push({
                conditionType: conType
            });
        let testItem = new CountMatchesCondition(config);
        expect(testItem.evaluate(vh, vm)).toBe(expectedResult);
    }
    test('With 0 child conditions, evaluates as Undetermined', () => {
        testCount([], undefined, undefined, ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, Minimum=0, Maximum=1, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType], 0, 1, ConditionEvaluateResult.Match);

    });
    test('With 1 child condition that evaluates as Match, Minimum=2, Maximum=undefined, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType], 2, undefined, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Match, Minimum=undefined, Maximum=1, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType], undefined, 1, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match and Maximum=3, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            undefined, 3, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as NoMatch and minimum=1, evaluates as NoMatch', () => {
        testCount([NeverMatchesConditionType], 1, undefined, ConditionEvaluateResult.NoMatch);

    });
    test('With 4 child conditions where one evaluates as NoMatch and Minimum=2, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType, NeverMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            2, undefined, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where one evaluates as NoMatch and Minimum=2 and Maximum=2, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType, NeverMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            2, 2, ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the first evaluates as NoMatch and Minimum=0, evaluates as Match', () => {
        testCount([NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            0, undefined, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where the first evaluates as NoMatch and Minimum=1, evaluates as NoMatch', () => {
        testCount([NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            1, undefined, ConditionEvaluateResult.NoMatch);
    });

    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Match, evaluates as Match', () => {
        testCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.Match,
            ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        testCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.NoMatch,
            ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        testCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.Undetermined,
            ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions with Match, Undetermined, NoMatch, NoMatch and treatUndeterminedAs=Match and Minimum=2, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            2, undefined, ConditionEvaluateResult.Match,
            ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions with Match, Undetermined, NoMatch, NoMatch and treatUndeterminedAs=NoMatch and Minimum=2, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            2, undefined, ConditionEvaluateResult.NoMatch,
            ConditionEvaluateResult.NoMatch);
    });
    test('category is Children', () => {
        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: []
        };
        let testItem = new CountMatchesCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: [],
            category: ConditionCategory.Contents
        };
        let testItem = new CountMatchesCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: []
        };
        let condition = new CountMatchesCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostNames where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
  
        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new CountMatchesCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('gatherValueHostNames where two child have the same ValueHostName, while another is different. Expect 2 ValueHostNames', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },                
            ]
        };
        let condition = new CountMatchesCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('gatherValueHostNames where each child two have different ValueHosts, another is Null. Expect two ValueHostNames', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: null
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new CountMatchesCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });            
});

describe('class NotNullCondition', () => {
    test('DefaultConditionType', () => {
        expect(NotNullCondition.DefaultConditionType).toBe(ConditionType.NotNull);
    });
    function testValue(valueToTest: any, expectedConditionEvaluateResult: ConditionEvaluateResult)
    {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Property1',
        };

        let testItem = new NotNullCondition(config);
        vh.setValue(valueToTest);
        expect(testItem.evaluate(vh, vm)).toBe(expectedConditionEvaluateResult);
    }

    test('evaluate with null results in NoMatch', () => {
        testValue(null,  ConditionEvaluateResult.NoMatch);    
    });    
    test('evaluate with undefined results in Undetermined', () => {
        testValue(undefined,  ConditionEvaluateResult.Undetermined);    
    });        
    test('evaluate without null or undefined results in Match', () => {
        testValue(0, ConditionEvaluateResult.Match);    
        testValue({}, ConditionEvaluateResult.Match);    
        testValue([],  ConditionEvaluateResult.Match);    
        testValue(false, ConditionEvaluateResult.Match);    
        testValue('', ConditionEvaluateResult.Match);
        testValue('', ConditionEvaluateResult.Match);            
        testValue(new Date(), ConditionEvaluateResult.Match);    
    });    

    test('evaluate with wrong ValueHost logs and throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'UnknownProperty'
        };
        let testItem = new NotNullCondition(config);
        vh.setValue('');
        expect(() => testItem.evaluate(null, vm)).toThrow(/Missing value/);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('Missing value', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy(); 
    });
    test('category is Require', () => {
        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Property1',
        };
        let testItem = new NotNullCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Require);
    });
    test('category is overridden', () => {
        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new NotNullCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Property1',
        };
        let condition = new NotNullCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: null,
        };
        let condition = new NotNullCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});

describe('NumberConditionBase', () => {
    class TestNumberConditionBase extends NumberConditionBase<NumberConditionBaseConfig>
    {
        protected evaluateNumber(value: number, valueHost: IValueHost, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
            return value >= 0 ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
        }
        protected get defaultCategory(): ConditionCategory {
            return ConditionCategory.Undetermined
        }
        
    }
    test('Evaluate numbers that are positive are a match and less than 0 are not a match', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: null,
        };
        let testItem = new TestNumberConditionBase(config);
        vh.setValue(1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);   
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('Evaluate non-number types are undetermined', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: null,
        };
        let testItem = new TestNumberConditionBase(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);   
        vh.setValue(new Date());
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);     
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);                
    });    
    test('Evaluate objects that can be converted to a number use that number to evaluate. Positive are a match and less than 0 are not a match', () => {
        class NumberHolder
        {
            constructor(value: number)
            {
                this.value = value;
            }   
            public value: number;
        }
        class NumberHolderIdentifier implements IDataTypeIdentifier
        {
            dataTypeLookupKey: string = 'test';
            supportsValue(value: any): boolean {
                return value instanceof NumberHolder;
            }
        }
        class NumberHolderConverter implements IDataTypeConverter
        {
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof NumberHolder;
            }
            convert(source: NumberHolder, dataTypeLookupKey: string): SimpleValueType {
                return source.value;
            }
            
        }
        let services = new MockValidationServices(false, true);
        (services.dataTypeIdentifierService as DataTypeIdentifierService).register(new NumberHolderIdentifier());
        (services.dataTypeConverterService as DataTypeConverterService).register(new NumberHolderConverter());        
        let vm = new MockValidationManager(services);
        let vh = vm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: null,
        };
        let testItem = new TestNumberConditionBase(config);
        vh.setValue(new NumberHolder(1));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new NumberHolder(0));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);   
        vh.setValue(new NumberHolder(-1));
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
    });    
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: 'Property1',
        };
        let condition = new TestNumberConditionBase(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: null,
        };
        let condition = new TestNumberConditionBase(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });    
});

describe('PositiveCondition', () => {
    test('DefaultConditionType', () => {
        expect(PositiveCondition.DefaultConditionType).toBe(ConditionType.Positive);
    });    
    test('evaluate numbers; when 0 or higher, Match. When negative, NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1'
        };
        let testItem = new PositiveCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-0.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate non-numbers; all return Undetermined', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1'
        };
        let testItem = new PositiveCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(new Date());
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);                
    });
    test('category is DataTypeCheck', () => {
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1'
        };
        let testItem = new PositiveCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new PositiveCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});


describe('IntegerCondition', () => {
    test('DefaultConditionType', () => {
        expect(IntegerCondition.DefaultConditionType).toBe(ConditionType.Integer);
    });    
    test('evaluate numbers; when an integer, Match. When with decimals, noMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1'
        };
        let testItem = new IntegerCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(1.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(0.5);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(-1.9);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('evaluate non-numbers; all return Undetermined', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1'
        };
        let testItem = new IntegerCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(new Date());
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);                
    });
    test('category is DataTypeCheck', () => {
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1'
        };
        let testItem = new IntegerCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new IntegerCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });

});

describe('MaxDecimalsCondition', () => {
    test('DefaultConditionType', () => {
        expect(MaxDecimalsCondition.DefaultConditionType).toBe(ConditionType.MaxDecimals);
    });    
    test('constructor with maxDecimals null throws', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: null!
        };
        expect(() => new MaxDecimalsCondition(config)).toThrow(/maxDecimals/);
    });
    test('constructor with maxDecimals undefined throws', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: undefined!
        };
        expect(() => new MaxDecimalsCondition(config)).toThrow(/maxDecimals/);
    });    
    test('constructor with maxDecimals 0 throws', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 0
        };
        expect(() => new MaxDecimalsCondition(config)).toThrow(/must be 1/);
    });    
    test('evaluate numbers using maxDecimals=1; when integer or 1 decimal, match. All others NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 1
        };
        let testItem = new MaxDecimalsCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(1.5);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-1.6);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue(1.51);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(0.66);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(-1.63);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('evaluate non-numbers; all return Undetermined', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 1
        };
        let testItem = new MaxDecimalsCondition(config);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(new Date());
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);                
    });
    test('category is DataTypeCheck', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 1
        };
        let testItem = new MaxDecimalsCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents,
            maxDecimals : 1
        };
        let testItem = new MaxDecimalsCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});
