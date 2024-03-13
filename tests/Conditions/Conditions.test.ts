import { ValueHostId } from "../../src/DataTypes/BasicTypes";
import {
    type IRequiredTextConditionDescriptor, type IRequiredIndexConditionDescriptor, type IRangeConditionDescriptor, type ICompareToConditionDescriptor,
    RequiredTextConditionType, RequiredTextCondition,
    RequiredIndexConditionType, RequiredIndexCondition,
    RangeConditionType, RangeCondition, ValuesEqualConditionType, ValuesEqualCondition, ValuesNotEqualConditionType,
    ValuesNotEqualCondition, ValueGTSecondValueConditionType, ValueGTSecondValueCondition, ValueGTESecondValueConditionType,
    ValueGTESecondValueCondition, ValueLTSecondValueConditionType, ValueLTSecondValueCondition, ValueLTESecondValueConditionType,
    ValueLTESecondValueCondition, IStringLengthConditionDescriptor, StringLengthConditionType, StringLengthCondition,
    IRegExpConditionDescriptor, RegExpCondition, RegExpConditionType,
    AndConditionsType, AndConditions, DataTypeCheckConditionType, IDataTypeCheckConditionDescriptor, DataTypeCheckCondition,
    OrConditions, OrConditionsType, CountMatchingConditions, CountMatchingConditionsType, ICountMatchingConditionsDescriptor
} from "../../src/Conditions/ConcreteConditions";

import { ConfigurationCategory, LoggingLevel } from "../../src/Interfaces/Logger";
import { StringLookupKey, NumberLookupKey, DateLookupKey, BooleanLookupKey, IntegerLookupKey } from "../../src/DataTypes/LookupKeys";

import {
    MockValidationServices, MockValidationManager, MockCapturingLogger,
    AlwaysMatchesConditionType, NeverMatchesConditionType, IsUndeterminedCondition, IsUndeterminedConditionType
} from "../Mocks";
import { ConditionEvaluateResult, ConditionCategory } from "../../src/Interfaces/Conditions";
import { IEvaluateChildConditionResultsDescriptor } from "../../src/Conditions/EvaluateChildConditionResultsBase";


describe('ConditionBase class additional cases', () => {
    test('Descriptor.ValueHostID with unknown ID logs and throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let logger = services.LoggerService as MockCapturingLogger;
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'PropertyNotRegistered',
            Trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(() => testItem.Evaluate(vh, vm)).toThrow(/ValueHostId/);
        expect(logger.EntryCount()).toBe(1);
        expect(logger.GetLatest()?.Message).toMatch(/ValueHostId/);
    });
    test('Descriptor.ValueHostID with null and Evaluate value is null logs and throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let logger = services.LoggerService as MockCapturingLogger;
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'PropertyNotRegistered',
            Trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(() => testItem.Evaluate(null, vm)).toThrow(/ValueHostId/);
        expect(logger.EntryCount()).toBe(1);
        expect(logger.GetLatest()?.Message).toMatch(/ValueHostId/);
    });
    test('EnsurePrimaryValueHost will ValueHostId = null and parameter = null throws exception', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: null,
            Trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        //     expect(() => testItem.Evaluate(vh, vm)).toThrow(/ValueHostId/);
        expect(() => testItem.Evaluate(null, vm)).toThrow(/ValueHostId/);
    });
    test('EnsurePrimaryValueHost will ValueHostId = null and parameter = assigned works normally', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: null,
            Trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue('');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
});

describe('class DataTypeCheckCondition', () => {
    test('Evaluate returns Match when InputValue is not undefined and native Value is not undefined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        vh.SetValues('A', 'A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValues(10, '10');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValues(null, '');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValues(false, 'NO');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate returns NoMatch when InputValue is not undefined but native Value is undefined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        vh.SetInputValue('A');    // at this moment, setValue is undefined
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValues(undefined, '10');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate returns Undetermined when InputValue is undefined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        // at this moment, setValue is undefined
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(10);    // doesn't change InputValue...
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('GetTokenValues where ConversionErrorTokenValue is setup shows that token', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: 'Property1',
        };
        vh.SetValueToUndefined({ ConversionErrorTokenValue: 'ERROR' });
        let testItem = new DataTypeCheckCondition(descriptor);

        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'ConversionError',
                AssociatedValue: 'ERROR',
                Purpose: 'message'
            }
        ]);
    });
    test('GetTokenValues where ConversionErrorTokenValue is null', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);

        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'ConversionError',
                AssociatedValue: null,
                Purpose: 'message'
            }
        ]);
    });    
    test('Category is DataTypeCheck', () => {
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('Category is overridden', () => {
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: 'Property1',
            Category: ConditionCategory.Contents
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: 'Property1',
        };
        let condition = new DataTypeCheckCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor: IDataTypeCheckConditionDescriptor = {
            Type: DataTypeCheckConditionType,
            ValueHostId: null,
        };
        let condition = new DataTypeCheckCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
});
describe('class RequiredTextCondition', () => {
    test('Evaluate returns Match', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
            Trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.SetInputValue('A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue(' A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate returns NoMatch', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
            Trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.SetInputValue('');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetInputValue(' ');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate influenced by Descriptor.EmptyString value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
            Trim: true,
            EmptyValue: 'EMPTY'
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.SetInputValue('A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue(' A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue('');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetInputValue(' ');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetInputValue('EMPTY');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetInputValue(' EMPTY');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate influenced by Descriptor.Trim=false', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
            Trim: false,
            EmptyValue: 'EMPTY'
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.SetInputValue('A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue(' A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue('');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetInputValue(' ');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue('EMPTY');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetInputValue(' EMPTY');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Descriptor.Trim undefined works like Trim=true', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.SetInputValue('A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue(' A');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate returns Undetermined for null, undefined, and non-string types', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
            Trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.SetInputValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue(10);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });

    test('Evaluate with wrong ValueHost (not InputValueHost) logs and throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
            Trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.SetValue('');
        expect(() => testItem.Evaluate(null, vm)).toThrow(/InputValueHost/);
        let logger = services.LoggerService as MockCapturingLogger;
        expect(logger.EntryCount()).toBe(1);
        expect(logger.GetLatest()!.Category).toBe(ConfigurationCategory);
        expect(logger.GetLatest()!.Level).toBe(LoggingLevel.Error);
    });
    test('Category is Required', () => {
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Required);
    });
    test('Category is overridden', () => {
        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
            Category: ConditionCategory.Contents
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: 'Property1',
        };
        let condition = new RequiredTextCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IRequiredTextConditionDescriptor = {
            Type: RequiredTextConditionType,
            ValueHostId: null,
        };
        let condition = new RequiredTextCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
});

describe('class RequiredIndexCondition', () => {
    test('Evaluate returns Match', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: IRequiredIndexConditionDescriptor = {
            Type: RequiredIndexConditionType,
            ValueHostId: 'Property1'
        };
        let testItem = new RequiredIndexCondition(descriptor);
        vh.SetInputValue(1);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue(2);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate returns NoMatch', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: IRequiredIndexConditionDescriptor = {
            Type: RequiredIndexConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new RequiredIndexCondition(descriptor);
        vh.SetInputValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate influenced by Descriptor.UnselectedIndexValue value', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: IRequiredIndexConditionDescriptor = {
            Type: RequiredIndexConditionType,
            ValueHostId: 'Property1',
            UnselectedIndexValue: -1
        };
        let testItem = new RequiredIndexCondition(descriptor);
        vh.SetInputValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetInputValue(-1);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: IRequiredIndexConditionDescriptor = {
            Type: RequiredIndexConditionType,
            ValueHostId: 'Property1'
        };
        let testItem = new RequiredIndexCondition(descriptor);
        vh.SetInputValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue('string');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Category is Required', () => {
        let descriptor: IRequiredIndexConditionDescriptor = {
            Type: RequiredIndexConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new RequiredIndexCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Required);
    });
    test('Category is overridden', () => {
        let descriptor: IRequiredIndexConditionDescriptor = {
            Type: RequiredIndexConditionType,
            ValueHostId: 'Property1',
            Category: ConditionCategory.Contents
        };
        let testItem = new RequiredIndexCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IRequiredIndexConditionDescriptor = {
            Type: RequiredIndexConditionType,
            ValueHostId: 'Property1',
        };
        let condition = new RequiredIndexCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor: IRequiredIndexConditionDescriptor = {
            Type: RequiredIndexConditionType,
            ValueHostId: null,
        };
        let condition = new RequiredIndexCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
});

describe('class RegExpCondition', () => {
    test('Text contains "ABC" somewhere (case sensitive). Evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
            ExpressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(descriptor);
        vh.SetValue('ABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('ABCDEF');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('zABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(' ABC ');   // trim
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('abc'); // case sensitive failure
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('AB\nC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" somewhere (case insensitive). Evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
            ExpressionAsString: 'ABC',
            IgnoreCase: true
        };
        let testItem = new RegExpCondition(descriptor);
        vh.SetValue('ABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('abc');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('zabc');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(' AbC ');   // trim
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('ab');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('AB\nC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" as the complete text (case sensitive). Evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
            ExpressionAsString: '^ABC$',
            Multiline: false
        };
        let testItem = new RegExpCondition(descriptor);
        vh.SetValue('ABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('ABCDEF');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('zABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(' ABC ');   // trim
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('FirstLine\nABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('FirstLine\nABC\nLastLine');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" somewhere in multiline text (case sensitive). Evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
            ExpressionAsString: '^ABC$',
            Multiline: true
        };
        let testItem = new RegExpCondition(descriptor);
        vh.SetValue('ABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('ABCDEF');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('zABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(' ABC ');   // trim
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('FirstLine\nABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('FirstLine\nABC\nLastLine');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Uses RegExp instance with case insensitive. Text contains "ABC" somewhere in multiline text (case sensitive). Evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
            Expression: /^ABC$/im
        };
        let testItem = new RegExpCondition(descriptor);
        vh.SetValue('ABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('ABCDEF');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('zABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(' ABC ');   // trim
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('FirstLine\nABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('FirstLine\nABC\nLastLine');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });

    test('Evaluate influenced by Descriptor.Trim=false', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');

        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
            ExpressionAsString: '^ABC$',
            Trim: false
        };
        let testItem = new RegExpCondition(descriptor);
        vh.SetValue('ABC');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(' ABC ');   // trim
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('Evaluate returns Undetermined for null, undefined, and non-string types', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
            ExpressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(descriptor);
        vh.SetInputValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue(10);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetInputValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Descriptor lacks both Expression and ExpressionAsString. Throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new RegExpCondition(descriptor);
        vh.SetValue('ABC');
        expect(() => testItem.Evaluate(vh, vm)).toThrow(/regular expression/);
    });
    test('Category is DataTypeCheck', () => {
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new RegExpCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('Category is overridden', () => {
        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
            Category: ConditionCategory.Contents
        };
        let testItem = new RegExpCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: 'Property1',
        };
        let condition = new RegExpCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IRegExpConditionDescriptor = {
            Type: RegExpConditionType,
            ValueHostId: null,
        };
        let condition = new RegExpCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
});

describe('class RangeCondition', () => {
    test('Evaluate when Min/Max assigned to string returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: 'C',
            Maximum: 'G'
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue('B');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('C');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('D');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('F');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('G');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('H');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('c');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('g');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('Evaluate when Min/Max assigned to number returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: -8,
            Maximum: 25
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(-9);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(-8);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(-7);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(24);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(25);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(26);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('Evaluate when Min/Max assigned to date returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', DateLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: new Date(Date.UTC(2000, 5, 1)),
            Maximum: new Date(Date.UTC(2000, 5, 30))
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(new Date(Date.UTC(2000, 4, 31)));
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(new Date(Date.UTC(2000, 5, 1)));
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(new Date(Date.UTC(2000, 5, 2)));
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(new Date(Date.UTC(2000, 5, 29)));
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(new Date(Date.UTC(2000, 5, 30)));
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(new Date(Date.UTC(2000, 6, 1)));
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate when Min is unassigned and Max assigned to string returns Match less than or equal to Max; NoMatch otherwise', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: undefined,
            Maximum: 'G'
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue('.');   // some ascii before A
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('B');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('F');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('G');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('H');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('c');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('g');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate when Min is assigned and Max unassigned to string returns Match greater than or equal to Min; NoMatch otherwise', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: 'C',
            Maximum: null   // should work like undefined
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue('.');   // some ascii before A
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('B');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('C');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('D');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('F');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('G');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('H');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('c');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });


    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: 'C',
            Maximum: 'G'
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Evaluate when Minimum is different data type from Value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: 'G',    // this is a mismatch
            Maximum: 10  // this is OK
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.LoggerService as MockCapturingLogger;
        expect(logger.EntryCount()).toBe(1);
        expect(logger.GetLatest()!.Message).toMatch(/mismatch.*Minimum/);
        expect(logger.GetLatest()!.Level).toBe(LoggingLevel.Warn);
    });
    test('Evaluate when Maximum is different data type from Value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: 10, // this is OK
            Maximum: 'G'    // this is a mismatch
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.LoggerService as MockCapturingLogger;
        expect(logger.EntryCount()).toBe(1);
        expect(logger.GetLatest()!.Message).toMatch(/mismatch.*Maximum/);
        expect(logger.GetLatest()!.Level).toBe(LoggingLevel.Warn);
    });
    test('Using RoundToWholeConverter, evaluate to show that ConversionLookupKey is applied correctly.', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: 1.6,
            Maximum: 6.1,
            ConversionLookupKey: IntegerLookupKey
        };
        let testItem = new RangeCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(1.51);  // this will round up to 2, above the minimum
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(1.49);  // will round down to 1, below the minimum
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(6.1);   // will round down to 6, below the maximum
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(6.2);   // will round down to 6, below the maximum
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(6.6);   // will round up to 7, above the maximum
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });    
    test('GetTokenValues with non-null values for parameters', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: 'C',
            Maximum: 'G'
        };
        let testItem = new RangeCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'Minimum',
                AssociatedValue: 'C',
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Maximum',
                AssociatedValue: 'G',
                Purpose: 'parameter'
            }
        ]);
    });
    test('GetTokenValues with null values for parameters', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: undefined,
            Maximum: null
        };
        let testItem = new RangeCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'Minimum',
                AssociatedValue: null,
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Maximum',
                AssociatedValue: null,
                Purpose: 'parameter'
            }
        ]);
    });    
    test('Category is Comparison', () => {
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Minimum: 2,
            Maximum: null
        };
        let testItem = new RangeCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Comparison);
    });
    test('Category is overridden', () => {
        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            ValueHostId: 'Property1',
            Category: ConditionCategory.Contents,
            Minimum: 2,
            Maximum: null
        };
        let testItem = new RangeCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            Minimum: 2,
            Maximum: undefined,
            ValueHostId: 'Property1',
        };
        let condition = new RangeCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IRangeConditionDescriptor = {
            Type: RangeConditionType,
            Minimum: 2,
            Maximum: undefined,
            ValueHostId: null,
        };
        let condition = new RangeCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
});

describe('CompareToConditionBase class additional cases', () => {
    test('Descriptor.SecondValueHostID with unknown ID logs and throws', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let logger = services.LoggerService as MockCapturingLogger;
        vh.SetValue('');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            SecondValueHostId: 'PropertyNotRegistered',
            ValueHostId: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        expect(() => testItem.Evaluate(vh, vm)).toThrow(/SecondValueHostId/);
        expect(logger.EntryCount()).toBe(1);
        expect(logger.GetLatest()?.Message).toMatch(/SecondValueHostId/);
    });
    
    test('Descriptor.SecondValueHostID and SecondValue both with null logs and throws', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let logger = services.LoggerService as MockCapturingLogger;
        vh.SetValue('');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: null,
            SecondValueHostId: null,
            SecondValue: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        expect(() => testItem.Evaluate(vh, vm)).toThrow(/SecondValue/);
        expect(logger.EntryCount()).toBe(1);
        expect(logger.GetLatest()?.Message).toMatch(/SecondValue/);
    });
});



describe('class ValuesEqualCondition', () => {
    test('Evaluate using SecondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate using SecondValue property with boolean for Match or NoMatch', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', BooleanLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: false,
            SecondValueHostId: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(true);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate using SecondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let vh2 = vm.AddInputValueHost(
            'Property2', NumberLookupKey, 'Label2');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let testItem = new ValuesEqualCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh2.SetInputValue('---- Second does not matter ---');
        vh2.SetValue(100);  // property value to match to the rest

        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });


    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        vh.SetValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue('string');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    
    test('Using ConversionLookupKey = Integer, show ValueHost(but not Second) is impacted by conversion', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            ConversionLookupKey: IntegerLookupKey,
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(99.1);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(99.9);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(100.1);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(100.6);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Using SecondConversionLookupKey = RoundToWhole, show SecondValueHost(but not ValueHost) is impacted by conversion', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh1 = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let vh2 = vm.AddInputValueHost(
            'Property2', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            ConversionLookupKey: IntegerLookupKey,
            SecondValueHostId: 'Property2',
            SecondConversionLookupKey: IntegerLookupKey
        };
        let testItem = new ValuesEqualCondition(descriptor);
        vh1.SetInputValue('---- does not matter ----');
        vh1.SetValue(100);
        
        vh2.SetValue(99.1);
        expect(testItem.Evaluate(vh1, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh2.SetValue(99.9);
        expect(testItem.Evaluate(vh1, vm)).toBe(ConditionEvaluateResult.Match);
        vh2.SetValue(100.1);
        expect(testItem.Evaluate(vh1, vm)).toBe(ConditionEvaluateResult.Match);
        vh2.SetValue(100.6);
        expect(testItem.Evaluate(vh1, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });    

    test('GetTokenValues with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: 100,
                Purpose: 'value'
            }
        ]);
    });
    test('GetTokenValues with null value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: undefined,
            SecondValueHostId: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: null,
                Purpose: 'value'
            }
        ]);
    });    
    test('Category is Comparison', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null
        };
        let testItem = new ValuesEqualCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Comparison);
    });
    test('Category is overridden', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null,
            Category: ConditionCategory.Contents
        };
        let testItem = new ValuesEqualCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let condition = new ValuesEqualCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesEqualConditionType,
            ValueHostId: null,
            SecondValueHostId: null
        };
        let condition = new ValuesEqualCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
});
describe('class ValuesNotEqualCondition', () => {
    test('Evaluate using SecondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate using SecondValue property with boolean for Match or NoMatch', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', BooleanLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: false,
            SecondValueHostId: null
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(true);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate using SecondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let vh2 = vm.AddInputValueHost(
            'Property2', NumberLookupKey, 'Label2');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh2.SetInputValue('---- Second does not matter ---');
        vh2.SetValue(100);  // property value to match to the rest

        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });


    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        vh.SetValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue('string');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('GetTokenValues using SecondValue', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: 100,
                Purpose: 'value'
            }
        ]);
    });
    test('GetTokenValues using SecondValueHostId', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let vh2 = vm.AddValueHost(
            'Property2', NumberLookupKey, 'Label2');
        vh2.SetValue(100);
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: null,
            SecondValueHostId: 'Property2'
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: 100,
                Purpose: 'value'
            }
        ]);
    });
    test('GetTokenValues using null', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: null,
            SecondValueHostId: null
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: null,
                Purpose: 'value'
            }
        ]);
    });    
    test('Category is Comparison', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Comparison);
    });
    test('Category is overridden', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null,
            Category: ConditionCategory.Contents
        };
        let testItem = new ValuesNotEqualCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let condition = new ValuesNotEqualCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValuesNotEqualConditionType,
            ValueHostId: null,
            SecondValueHostId: null
        };
        let condition = new ValuesNotEqualCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
});
describe('class ValueGTSecondValueCondition', () => {
    test('Evaluate using SecondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueGTSecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate using boolean results in Undetermined because no support for GT operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', BooleanLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: false,
            SecondValueHostId: null
        };
        let testItem = new ValueGTSecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(true);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false); // SecondValue == this value. So NoMatch because operator is GT
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate using SecondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let vh2 = vm.AddInputValueHost(
            'Property2', NumberLookupKey, 'Label2');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let testItem = new ValueGTSecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh2.SetInputValue('---- Second does not matter ---');
        vh2.SetValue(100);  // property value to match to the rest

        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });


    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueGTSecondValueCondition(descriptor);
        vh.SetValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue('string');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('GetTokenValues with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueGTSecondValueCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: 100,
                Purpose: 'value'
            }
        ]);
    });
    test('GetTokenValues with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: null,
            SecondValueHostId: null
        };
        let testItem = new ValueGTSecondValueCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: null,
                Purpose: 'value'
            }
        ]);
    });    
    test('Category is Comparison', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null
        };
        let testItem = new ValueGTSecondValueCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Comparison);
    });
    test('Category is overridden', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null,
            Category: ConditionCategory.Contents
        };
        let testItem = new ValueGTSecondValueCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let condition = new ValueGTSecondValueCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTSecondValueConditionType,
            ValueHostId: null,
            SecondValueHostId: null
        };
        let condition = new ValueGTSecondValueCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });        
});
describe('class ValueGTESecondValueCondition', () => {
    test('Evaluate using SecondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueGTESecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate using boolean results in Undetermined because no support for GTE operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', BooleanLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: false,
            SecondValueHostId: null
        };
        let testItem = new ValueGTESecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(true);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false); // SecondValue == this value. So Match because operator is GTE
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate using SecondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let vh2 = vm.AddInputValueHost(
            'Property2', NumberLookupKey, 'Label2');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let testItem = new ValueGTESecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh2.SetInputValue('---- Second does not matter ---');
        vh2.SetValue(100);  // property value to match to the rest

        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(0);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });


    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueGTESecondValueCondition(descriptor);
        vh.SetValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue('string');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('GetTokenValues with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueGTESecondValueCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: 100,
                Purpose: 'value'
            }
        ]);
    });
    test('GetTokenValues with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: null,
            SecondValueHostId: null
        };
        let testItem = new ValueGTESecondValueCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: null,
                Purpose: 'value'
            }
        ]);
    });    
    test('Category is Comparison', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null
        };
        let testItem = new ValueGTESecondValueCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Comparison);
    });
    test('Category is overridden', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null,
            Category: ConditionCategory.Contents
        };
        let testItem = new ValueGTESecondValueCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let condition = new ValueGTESecondValueCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueGTESecondValueConditionType,
            ValueHostId: null,
            SecondValueHostId: null
        };
        let condition = new ValueGTESecondValueCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });            
});

describe('class ValueLTSecondValueCondition', () => {
    test('Evaluate using SecondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueLTSecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(99);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate using boolean results in Undetermined because no support for LT operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', BooleanLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: false,
            SecondValueHostId: null
        };
        let testItem = new ValueLTSecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(true);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false); // SecondValue == this value. So NoMatch because operator is LT
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate using SecondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let vh2 = vm.AddInputValueHost(
            'Property2', NumberLookupKey, 'Label2');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let testItem = new ValueLTSecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh2.SetInputValue('---- Second does not matter ---');
        vh2.SetValue(100);  // property value to match to the rest

        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(99);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });


    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueLTSecondValueCondition(descriptor);
        vh.SetValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue('string');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('GetTokenValues with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueLTSecondValueCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: 100,
                Purpose: 'value'
            }
        ]);
    });
    test('GetTokenValues with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: null,
            SecondValueHostId: null
        };
        let testItem = new ValueLTSecondValueCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: null,
                Purpose: 'value'
            }
        ]);
    });    
    test('Category is Comparison', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null
        };
        let testItem = new ValueLTSecondValueCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Comparison);
    });
    test('Category is overridden', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null,
            Category: ConditionCategory.Contents
        };
        let testItem = new ValueLTSecondValueCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let condition = new ValueLTSecondValueCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTSecondValueConditionType,
            ValueHostId: null,
            SecondValueHostId: null
        };
        let condition = new ValueLTSecondValueCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });            
});
describe('class ValueLTESecondValueCondition', () => {
    test('Evaluate using SecondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueLTESecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(99);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate using boolean results in Undetermined because no support for LTE operator', () => {
        // boolean chosen because Comparers don't support GreaterThan/LessThan
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', BooleanLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: false,
            SecondValueHostId: null
        };
        let testItem = new ValueLTESecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(true);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false); // SecondValue == this value. So Match because operator is LTE
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate using SecondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let vh2 = vm.AddInputValueHost(
            'Property2', NumberLookupKey, 'Label2');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let testItem = new ValueLTESecondValueCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh2.SetInputValue('---- Second does not matter ---');
        vh2.SetValue(100);  // property value to match to the rest

        vh.SetValue(101);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(99);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });


    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueLTESecondValueCondition(descriptor);
        vh.SetValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue('string');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('GetTokenValues with non-null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 100,
            SecondValueHostId: null
        };
        let testItem = new ValueLTESecondValueCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: 100,
                Purpose: 'value'
            }
        ]);
    });
    test('GetTokenValues with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', NumberLookupKey, 'Label');
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: null,
            SecondValueHostId: null
        };
        let testItem = new ValueLTESecondValueCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'CompareTo',
                AssociatedValue: null,
                Purpose: 'value'
            }
        ]);
    });    
    test('Category is Comparison', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null
        };
        let testItem = new ValueLTESecondValueCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Comparison);
    });
    test('Category is overridden', () => {
        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValue: 10,
            SecondValueHostId: null,
            Category: ConditionCategory.Contents
        };
        let testItem = new ValueLTESecondValueCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: 'Property1',
            SecondValueHostId: 'Property2'
        };
        let condition = new ValueLTESecondValueCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: ICompareToConditionDescriptor = {
            Type: ValueLTESecondValueConditionType,
            ValueHostId: null,
            SecondValueHostId: null
        };
        let condition = new ValueLTESecondValueCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });            
});


describe('class StringLengthCondition', () => {
    test('Evaluate when both Min/Max are assigned returns Match inside of stringlength; NoMatch outside of stringlength', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Minimum: 2,
            Maximum: 5
        };
        let testItem = new StringLengthCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue('');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('1');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('12');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('1234');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('12345');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('123456');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Evaluate when Min is assigned, Max is null. Match when >= Min', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Minimum: 2,
            Maximum: null
        };
        let testItem = new StringLengthCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue('');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('1');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('12');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('123');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('1234567890');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Evaluate when Max is assigned, Min is null. Match when <= Max', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Minimum: null,
            Maximum: 5
        };
        let testItem = new StringLengthCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue('');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('1');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('12');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('1234');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('12345');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue('123456');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue('1234567890');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('Evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Minimum: undefined,
            Maximum: undefined
        };
        let testItem = new StringLengthCondition(descriptor);
        vh.SetValue(null);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(undefined);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(100);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.SetValue(false);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Evaluate when Trim is false', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Minimum: 2,
            Maximum: 5,
            Trim: false
        };
        let testItem = new StringLengthCondition(descriptor);
        vh.SetInputValue('---- does not matter ----');
        vh.SetValue(' ');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.SetValue(' 1');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(' 12 ');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.SetValue(' 1234 ');
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('GetTokenValues without calling evaluate and establishing length', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Minimum: 2,
            Maximum: 5
        };
        let testItem = new StringLengthCondition(descriptor);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'Length',
                AssociatedValue: 0,
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Minimum',
                AssociatedValue: 2,
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Maximum',
                AssociatedValue: 5,
                Purpose: 'parameter'
            }
        ]);
    });
    test('GetTokenValues with evaluating a string length of 5', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Minimum: 2,
            Maximum: 5
        };
        vh.SetValue("ABCDE");
        let testItem = new StringLengthCondition(descriptor);
        testItem.Evaluate(vh, vm);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'Length',
                AssociatedValue: 5,
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Minimum',
                AssociatedValue: 2,
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Maximum',
                AssociatedValue: 5,
                Purpose: 'parameter'
            }
        ]);
    });
    test('GetTokenValues with null values', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Minimum: null,
            Maximum: null
        };
        vh.SetValue("ABCDE");
        let testItem = new StringLengthCondition(descriptor);
        testItem.Evaluate(vh, vm);
        let list = testItem.GetValuesForTokens(vh, vm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                TokenLabel: 'Length',
                AssociatedValue: 5,
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Minimum',
                AssociatedValue: null,
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Maximum',
                AssociatedValue: null,
                Purpose: 'parameter'
            }
        ]);
    });    
    test('Category is Comparison', () => {
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
        };
        let testItem = new StringLengthCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Comparison);
    });
    test('Category is overridden', () => {
        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1',
            Category: ConditionCategory.Contents
        };
        let testItem = new StringLengthCondition(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: 'Property1'
        };
        let condition = new StringLengthCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('GatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);

        let descriptor: IStringLengthConditionDescriptor = {
            Type: StringLengthConditionType,
            ValueHostId: null
        };
        let condition = new StringLengthCondition(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });            
});

describe('class AndConditions', () => {
    test('With 0 child conditions, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: []
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: NeverMatchesConditionType
            }]
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the last evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: NeverMatchesConditionType
            }]
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the first evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: NeverMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undefined and TreatUndefinedAs not supplied, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType
            }]
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Undefined and TreatUndefinedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType,

            }],
            TreatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undefined and TreatUndefinedAs=NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType,

            }],
            TreatUndeterminedAs: ConditionEvaluateResult.NoMatch
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undefined and TreatUndefinedAs=Undetermined, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType,
            }],
            TreatUndeterminedAs: ConditionEvaluateResult.Undetermined
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions where the first evaluates as Undetermined but TreatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            }],
            TreatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Category is Children', () => {
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: []
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Children);
    });
    test('Category is overridden', () => {
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [],
            Category: ConditionCategory.Contents
        };
        let testItem = new AndConditions(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: []
        };
        let condition = new AndConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
    test('GatherValueHostIds where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field2'
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field3'
                },                
            ]
        };
        let condition = new AndConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('GatherValueHostIds where two child have the same ValueHostId, while another is different. Expect 2 ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field2'
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },                
            ]
        };
        let condition = new AndConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('GatherValueHostIds where each child two have different ValueHosts, another is Null. Expect two ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: AndConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: null
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field3'
                },                
            ]
        };
        let condition = new AndConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });        
});
describe('class OrConditions', () => {
    test('With 0 child conditions, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: []
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: AlwaysMatchesConditionType
            }]
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            }]
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: NeverMatchesConditionType
            }]
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the last evaluates as NoMatch, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: NeverMatchesConditionType
            }]
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where the first evaluates as Match and the rest NoMatch, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: AlwaysMatchesConditionType
            },
            {
                Type: NeverMatchesConditionType
            },
            {
                Type: NeverMatchesConditionType
            },
            {
                Type: NeverMatchesConditionType
            }]
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });

    test('With 4 child conditions where all evaluate as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: NeverMatchesConditionType
            },
            {
                Type: NeverMatchesConditionType
            },
            {
                Type: NeverMatchesConditionType
            },
            {
                Type: NeverMatchesConditionType
            }]
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undefined Or TreatUndefinedAs not supplied, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType
            }]
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Undefined Or TreatUndefinedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType,

            }],
            TreatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undefined Or TreatUndefinedAs=NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType,

            }],
            TreatUndeterminedAs: ConditionEvaluateResult.NoMatch
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undefined Or TreatUndefinedAs=Undetermined, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType,
            }],
            TreatUndeterminedAs: ConditionEvaluateResult.Undetermined
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions where the first evaluates as Undetermined but TreatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [{
                Type: IsUndeterminedConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            },
            {
                Type: AlwaysMatchesConditionType
            }],
            TreatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Category is Children', () => {
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: []
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Children);
    });
    test('Category is overridden', () => {
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [],
            Category: ConditionCategory.Contents
        };
        let testItem = new OrConditions(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: []
        };
        let condition = new OrConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
    test('GatherValueHostIds where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field2'
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field3'
                },                
            ]
        };
        let condition = new OrConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('GatherValueHostIds where two child have the same ValueHostId, while another is different. Expect 2 ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field2'
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },                
            ]
        };
        let condition = new OrConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('GatherValueHostIds where each child two have different ValueHosts, another is Null. Expect two ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: OrConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: null
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field3'
                },                
            ]
        };
        let condition = new OrConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });            
});

describe('class CountMatchingConditions', () => {
    function TestCount(conditionTypes: Array<string>, minimum: number | undefined,
        maximum: number | undefined, expectedResult: ConditionEvaluateResult,
        treatUndeterminedAs?: ConditionEvaluateResult): void {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost(
            'Property1', StringLookupKey, 'Label');
        let descriptor: ICountMatchingConditionsDescriptor = {
            Type: CountMatchingConditionsType,
            Minimum: minimum,
            Maximum: maximum,
            ConditionDescriptors: []
        };
        if (treatUndeterminedAs != null)
            descriptor.TreatUndeterminedAs = treatUndeterminedAs;
        for (let conType of conditionTypes)
            descriptor.ConditionDescriptors.push({
                Type: conType
            })
        let testItem = new CountMatchingConditions(descriptor);
        expect(testItem.Evaluate(vh, vm)).toBe(expectedResult);
    }
    test('With 0 child conditions, evaluates as Undetermined', () => {
        TestCount([], undefined, undefined, ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, Minimum=0, Maximum=1, evaluates as Match', () => {
        TestCount([AlwaysMatchesConditionType], 0, 1, ConditionEvaluateResult.Match);

    });
    test('With 1 child condition that evaluates as Match, Minimum=2, Maximum=undefined, evaluates as NoMatch', () => {
        TestCount([AlwaysMatchesConditionType], 2, undefined, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Match, Minimum=undefined, Maximum=1, evaluates as Match', () => {
        TestCount([AlwaysMatchesConditionType], undefined, 1, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match and Maximum=3, evaluates as NoMatch', () => {
        TestCount([AlwaysMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            undefined, 3, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as NoMatch and minimum=1, evaluates as NoMatch', () => {
        TestCount([NeverMatchesConditionType], 1, undefined, ConditionEvaluateResult.NoMatch);

    });
    test('With 4 child conditions where one evaluates as NoMatch and Minimum=2, evaluates as Match', () => {
        TestCount([AlwaysMatchesConditionType, NeverMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            2, undefined, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where one evaluates as NoMatch and Minimum=2 and Maximum=2, evaluates as NoMatch', () => {
        TestCount([AlwaysMatchesConditionType, NeverMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            2, 2, ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the first evaluates as NoMatch and Minimum=0, evaluates as Match', () => {
        TestCount([NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            0, undefined, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where the first evaluates as NoMatch and Minimum=1, evaluates as NoMatch', () => {
        TestCount([NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            1, undefined, ConditionEvaluateResult.NoMatch);
    });

    test('With 1 child condition that evaluates as Undetermined and TreatUndefinedAs=Match, evaluates as Match', () => {
        TestCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.Match,
            ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined and TreatUndefinedAs=NoMatch, evaluates as NoMatch', () => {
        TestCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.NoMatch,
            ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and TreatUndefinedAs=Undetermined, evaluates as Undetermined', () => {
        TestCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.Undetermined,
            ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions with Match, Undetermined, NoMatch, NoMatch and TreatUndeterminedAs=Match and Minimum=2, evaluates as Match', () => {
        TestCount([AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            2, undefined, ConditionEvaluateResult.Match,
            ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions with Match, Undetermined, NoMatch, NoMatch and TreatUndeterminedAs=NoMatch and Minimum=2, evaluates as NoMatch', () => {
        TestCount([AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            2, undefined, ConditionEvaluateResult.NoMatch,
            ConditionEvaluateResult.NoMatch);
    });
    test('Category is Children', () => {
        let descriptor: ICountMatchingConditionsDescriptor = {
            Type: CountMatchingConditionsType,
            ConditionDescriptors: []
        };
        let testItem = new CountMatchingConditions(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Children);
    });
    test('Category is overridden', () => {
        let descriptor: ICountMatchingConditionsDescriptor = {
            Type: CountMatchingConditionsType,
            ConditionDescriptors: [],
            Category: ConditionCategory.Contents
        };
        let testItem = new CountMatchingConditions(descriptor);
        expect(testItem.Category).toBe(ConditionCategory.Contents);
    });
    test('GatherValueHostIds with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: CountMatchingConditionsType,
            ConditionDescriptors: []
        };
        let condition = new CountMatchingConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(0);
    });
    test('GatherValueHostIds where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
  
        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: CountMatchingConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field2'
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field3'
                },                
            ]
        };
        let condition = new CountMatchingConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('GatherValueHostIds where two child have the same ValueHostId, while another is different. Expect 2 ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: CountMatchingConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field2'
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },                
            ]
        };
        let condition = new CountMatchingConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('GatherValueHostIds where each child two have different ValueHosts, another is Null. Expect two ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let descriptor: IEvaluateChildConditionResultsDescriptor = {
            Type: CountMatchingConditionsType,
            ConditionDescriptors: [
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field1'
                },
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: null
                },             
                <IRequiredTextConditionDescriptor>{
                    Type: RequiredTextConditionType,
                    ValueHostId: 'Field3'
                },                
            ]
        };
        let condition = new CountMatchingConditions(descriptor);
        let testItem = new Set<ValueHostId>();
        expect(() => condition.GatherValueHostIds(testItem, vm)).not.toThrow()
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });            
});