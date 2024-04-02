import { RequiredTextCondition, RangeCondition, EqualToCondition, NotEqualToCondition, GreaterThanCondition, GreaterThanOrEqualToCondition, LessThanCondition, LessThanOrEqualToCondition, StringLengthCondition, RegExpCondition, AllMatchCondition, DataTypeCheckCondition, AnyMatchCondition, CountMatchesCondition, StringNotEmptyCondition, NotNullCondition } from "../../src/Conditions/ConcreteConditions";
import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { MockValidationServices, MockValidationManager, AlwaysMatchesConditionType, NeverMatchesConditionType, IsUndeterminedConditionType } from "../Mocks";
import { ConditionEvaluateResult, ConditionCategory } from "../../src/Interfaces/Conditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
describe('ConditionBase class additional cases', () => {
    test('Descriptor.valueHostId with unknown ID logs and throws', () => {
        var _a;
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let logger = services.loggerService;
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'PropertyNotRegistered',
            trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(() => testItem.evaluate(vh, vm)).toThrow(/valueHostId/);
        expect(logger.entryCount()).toBe(1);
        expect((_a = logger.getLatest()) === null || _a === void 0 ? void 0 : _a.message).toMatch(/valueHostId/);
    });
    test('Descriptor.valueHostId with null and evaluate value is null logs and throws', () => {
        var _a;
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let logger = services.loggerService;
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'PropertyNotRegistered',
            trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(() => testItem.evaluate(null, vm)).toThrow(/valueHostId/);
        expect(logger.entryCount()).toBe(1);
        expect((_a = logger.getLatest()) === null || _a === void 0 ? void 0 : _a.message).toMatch(/valueHostId/);
    });
    test('ensurePrimaryValueHost will ValueHostId = null and parameter = null throws exception', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: null,
            trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        //     expect(() => testItem.evaluate(vh, vm)).toThrow(/valueHostId/);
        expect(() => testItem.evaluate(null, vm)).toThrow(/valueHostId/);
    });
    test('ensurePrimaryValueHost will ValueHostId = null and parameter = assigned works normally', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: null,
            trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
});
describe('class DataTypeCheckCondition', () => {
    test('DefaultConditionType', () => {
        expect(DataTypeCheckCondition.DefaultConditionType).toBe(ConditionType.DataTypeCheck);
    });
    test('evaluate returns Match when InputValue is not undefined and native Value is not undefined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        vh.setInputValue('A'); // at this moment, setValue is undefined
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValues(undefined, '10');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate returns Undetermined when InputValue is undefined', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        // at this moment, setValue is undefined
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(10); // doesn't change InputValue...
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('getValuesForTokens where ConversionErrorTokenValue is setup shows that token', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: 'Property1',
        };
        vh.setValueToUndefined({ conversionErrorTokenValue: 'ERROR' });
        let testItem = new DataTypeCheckCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new DataTypeCheckCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: 'Property1',
        };
        let condition = new DataTypeCheckCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: null,
        };
        let condition = new DataTypeCheckCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class RequiredTextCondition', () => {
    test('DefaultConditionType', () => {
        expect(RequiredTextCondition.DefaultConditionType).toBe(ConditionType.RequiredText);
    });
    test('evaluate returns Match', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1'
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' '); // no trimming built in for evaluate
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate returns NoMatch', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1'
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate not influenced by Descriptor.emptyString value because that is only used by evaluateDuringEdit', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            emptyValue: 'EMPTY'
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('EMPTY');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' EMPTY');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate not influenced by Descriptor.Trim=true because trim is for evaluateDuringEdit', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            trim: true,
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' A');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    function testNullValueResult(nullValueResult) {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            nullValueResult: nullValueResult
        };
        let testItem = new RequiredTextCondition(descriptor);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(nullValueResult);
    }
    test('evaluate returns Match for null when Descriptor.nullValueResult = Match', () => {
        testNullValueResult(ConditionEvaluateResult.Match);
    });
    test('evaluate returns NoMatch for null when Descriptor.nullValueResult = NoMatch', () => {
        testNullValueResult(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate returns Undetermined for null when Descriptor.nullValueResult = Undefined', () => {
        testNullValueResult(ConditionEvaluateResult.Undetermined);
    });
    test('evaluate returns Undetermined for undefined, and non-string types', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.evaluateDuringEdits('A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' A', vh, services)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluateDuringEdits returns NoMatch', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            trim: true
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluateDuringEdits influenced by Descriptor.EmptyString value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            trim: true,
            emptyValue: 'EMPTY'
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.evaluateDuringEdits('A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('EMPTY', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' EMPTY', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluateDuringEdits influenced by Descriptor.Trim=false', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            trim: false,
            emptyValue: 'EMPTY'
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.evaluateDuringEdits('A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' ', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('EMPTY', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' EMPTY', vh, services)).toBe(ConditionEvaluateResult.Match);
    });
    test('Descriptor.Trim undefined works like Trim=true', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.evaluateDuringEdits('A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' A', vh, services)).toBe(ConditionEvaluateResult.Match);
    });
    test('category is Required', () => {
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Required);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new RequiredTextCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: 'Property1',
        };
        let condition = new RequiredTextCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.RequiredText,
            valueHostId: null,
        };
        let condition = new RequiredTextCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class RegExpCondition', () => {
    test('DefaultConditionType', () => {
        expect(RegExpCondition.DefaultConditionType).toBe(ConditionType.RegExp);
    });
    test('Text contains "ABC" somewhere (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: 'ABC',
            ignoreCase: true
        };
        let testItem = new RegExpCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: '^ABC$',
            multiline: false
        };
        let testItem = new RegExpCondition(descriptor);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC '); // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" somewhere in multiline text (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: '^ABC$',
            multiline: true
        };
        let testItem = new RegExpCondition(descriptor);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC '); // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Uses RegExp instance with case insensitive. Text contains "ABC" somewhere in multiline text (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expression: /^ABC$/im
        };
        let testItem = new RegExpCondition(descriptor);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC '); // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Set Descriptor.not = true. evaluate returns Match if no match and NoMatch if matching', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: 'ABC',
            not: true
        };
        let testItem = new RegExpCondition(descriptor);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC '); // trim
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('abc'); // case sensitive failure
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('AB\nC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate not influenced by Descriptor.Trim=true', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: '^ABC$',
            trim: true
        };
        let testItem = new RegExpCondition(descriptor);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' ABC '); // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate returns Undetermined for null, undefined, and non-string types', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(descriptor);
        vh.setInputValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(10);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With not=true, evaluate returns Undetermined for null, undefined, and non-string types', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: 'ABC',
            not: true
        };
        let testItem = new RegExpCondition(descriptor);
        vh.setInputValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(10);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setInputValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Descriptor lacks both expression and expressionAsString. Throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
        };
        let testItem = new RegExpCondition(descriptor);
        vh.setValue('ABC');
        expect(() => testItem.evaluate(vh, vm)).toThrow(/regular expression/);
    });
    test('With duringEdit = true and supportsDuringEdit=true, text must exactly match ABC case insensitively for match', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: true
        };
        let testItem = new RegExpCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: false
        };
        let testItem = new RegExpCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: true,
            trim: false
        };
        let testItem = new RegExpCondition(descriptor);
        expect(testItem.evaluateDuringEdits('ABC', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('ABCDEF', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('zABC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' ABC ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        // case sensitive 
        expect(testItem.evaluateDuringEdits('abc', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('AB\nC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('category is DataTypeCheck', () => {
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
        };
        let testItem = new RegExpCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new RegExpCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: 'Property1',
        };
        let condition = new RegExpCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.RegExp,
            valueHostId: null,
        };
        let condition = new RegExpCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class RangeCondition', () => {
    test('DefaultConditionType', () => {
        expect(RangeCondition.DefaultConditionType).toBe(ConditionType.Range);
    });
    test('evaluate when Min/Max assigned to string returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let testItem = new RangeCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: -8,
            maximum: 25
        };
        let testItem = new RangeCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Date, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: new Date(Date.UTC(2000, 5, 1)),
            maximum: new Date(Date.UTC(2000, 5, 30))
        };
        let testItem = new RangeCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: undefined,
            maximum: 'G'
        };
        let testItem = new RangeCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('.'); // some ascii before A
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: 'C',
            maximum: null // should work like undefined
        };
        let testItem = new RangeCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('.'); // some ascii before A
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let testItem = new RangeCondition(descriptor);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('evaluate when Minimum is different data type from Value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: 'G', // this is a mismatch
            maximum: 10 // this is OK
        };
        let testItem = new RangeCondition(descriptor);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService;
        expect(logger.entryCount()).toBe(1);
        expect(logger.getLatest().message).toMatch(/mismatch.*Minimum/);
        expect(logger.getLatest().level).toBe(LoggingLevel.Warn);
    });
    test('evaluate when Maximum is different data type from Value', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: 10, // this is OK
            maximum: 'G' // this is a mismatch
        };
        let testItem = new RangeCondition(descriptor);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService;
        expect(logger.entryCount()).toBe(1);
        expect(logger.getLatest().message).toMatch(/mismatch.*Maximum/);
        expect(logger.getLatest().level).toBe(LoggingLevel.Warn);
    });
    test('Using IntegerConverter, evaluate to show that ConversionLookupKey is applied correctly.', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: 1.6,
            maximum: 6.1,
            conversionLookupKey: LookupKey.Integer
        };
        let testItem = new RangeCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(1.51); // this will round up to 2, above the minimum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(1.49); // will round down to 1, below the minimum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(6.1); // will round down to 6, below the maximum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(6.2); // will round down to 6, below the maximum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(6.6); // will round up to 7, above the maximum
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('getValuesForTokens with non-null values for parameters', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let testItem = new RangeCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: undefined,
            maximum: null
        };
        let testItem = new RangeCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: null
        };
        let testItem = new RangeCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.Range,
            valueHostId: 'Property1',
            category: ConditionCategory.Contents,
            minimum: 2,
            maximum: null
        };
        let testItem = new RangeCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.Range,
            minimum: 2,
            maximum: undefined,
            valueHostId: 'Property1',
        };
        let condition = new RangeCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.Range,
            minimum: 2,
            maximum: undefined,
            valueHostId: null,
        };
        let condition = new RangeCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('CompareToConditionBase class additional cases', () => {
    test('Descriptor.secondValueHostId with unknown ID logs and throws', () => {
        var _a;
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let logger = services.loggerService;
        vh.setValue('');
        let descriptor = {
            type: ConditionType.EqualTo,
            secondValueHostId: 'PropertyNotRegistered',
            valueHostId: null
        };
        let testItem = new EqualToCondition(descriptor);
        expect(() => testItem.evaluate(vh, vm)).toThrow(/secondValueHostId/);
        expect(logger.entryCount()).toBe(1);
        expect((_a = logger.getLatest()) === null || _a === void 0 ? void 0 : _a.message).toMatch(/secondValueHostId/);
    });
    test('Descriptor.secondValueHostId and secondValue both with null logs and throws', () => {
        var _a;
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let logger = services.loggerService;
        vh.setValue('');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: null,
            secondValueHostId: null,
            secondValue: null
        };
        let testItem = new EqualToCondition(descriptor);
        expect(() => testItem.evaluate(vh, vm)).toThrow(/secondValue/);
        expect(logger.entryCount()).toBe(1);
        expect((_a = logger.getLatest()) === null || _a === void 0 ? void 0 : _a.message).toMatch(/secondValue/);
    });
});
describe('class EqualToCondition', () => {
    test('DefaultConditionType', () => {
        expect(EqualToCondition.DefaultConditionType).toBe(ConditionType.EqualTo);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new EqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Boolean, 'Label');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValue: false,
            secondValueHostId: null
        };
        let testItem = new EqualToCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using secondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addInputValueHost('Property2', LookupKey.Number, 'Label2');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let testItem = new EqualToCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100); // property value to match to the rest
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new EqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            conversionLookupKey: LookupKey.Integer,
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new EqualToCondition(descriptor);
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
    test('Using SecondConversionLookupKey = RoundToWhole, show SecondValueHost(but not ValueHost) is impacted by conversion', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh1 = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addInputValueHost('Property2', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            conversionLookupKey: LookupKey.Integer,
            secondValueHostId: 'Property2',
            secondConversionLookupKey: LookupKey.Integer
        };
        let testItem = new EqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new EqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValue: undefined,
            secondValueHostId: null
        };
        let testItem = new EqualToCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null
        };
        let testItem = new EqualToCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null,
            category: ConditionCategory.Contents
        };
        let testItem = new EqualToCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let condition = new EqualToCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.EqualTo,
            valueHostId: null,
            secondValueHostId: null
        };
        let condition = new EqualToCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class NotEqualToCondition', () => {
    test('DefaultConditionType', () => {
        expect(NotEqualToCondition.DefaultConditionType).toBe(ConditionType.NotEqualTo);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new NotEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Boolean, 'Label');
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValue: false,
            secondValueHostId: null
        };
        let testItem = new NotEqualToCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate using secondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addInputValueHost('Property2', LookupKey.Number, 'Label2');
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let testItem = new NotEqualToCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100); // property value to match to the rest
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new NotEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new NotEqualToCondition(descriptor);
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
    test('getValuesForTokens using secondValueHostId', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addValueHost('Property2', LookupKey.Number, 'Label2');
        vh2.setValue(100);
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValue: null,
            secondValueHostId: 'Property2'
        };
        let testItem = new NotEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValue: null,
            secondValueHostId: null
        };
        let testItem = new NotEqualToCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null
        };
        let testItem = new NotEqualToCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null,
            category: ConditionCategory.Contents
        };
        let testItem = new NotEqualToCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let condition = new NotEqualToCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.NotEqualTo,
            valueHostId: null,
            secondValueHostId: null
        };
        let condition = new NotEqualToCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class GreaterThanCondition', () => {
    test('DefaultConditionType', () => {
        expect(GreaterThanCondition.DefaultConditionType).toBe(ConditionType.GreaterThan);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new GreaterThanCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Boolean, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValue: false,
            secondValueHostId: null
        };
        let testItem = new GreaterThanCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So NoMatch because operator is GT
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate using secondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addInputValueHost('Property2', LookupKey.Number, 'Label2');
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let testItem = new GreaterThanCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100); // property value to match to the rest
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new GreaterThanCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new GreaterThanCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValue: null,
            secondValueHostId: null
        };
        let testItem = new GreaterThanCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null
        };
        let testItem = new GreaterThanCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null,
            category: ConditionCategory.Contents
        };
        let testItem = new GreaterThanCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let condition = new GreaterThanCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.GreaterThan,
            valueHostId: null,
            secondValueHostId: null
        };
        let condition = new GreaterThanCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class GreaterThanOrEqualToCondition', () => {
    test('DefaultConditionType', () => {
        expect(GreaterThanOrEqualToCondition.DefaultConditionType).toBe(ConditionType.GreaterThanOrEqualTo);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new GreaterThanOrEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Boolean, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: false,
            secondValueHostId: null
        };
        let testItem = new GreaterThanOrEqualToCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So Match because operator is GTE
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using secondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addInputValueHost('Property2', LookupKey.Number, 'Label2');
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let testItem = new GreaterThanOrEqualToCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100); // property value to match to the rest
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new GreaterThanOrEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new GreaterThanOrEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: null,
            secondValueHostId: null
        };
        let testItem = new GreaterThanOrEqualToCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null
        };
        let testItem = new GreaterThanOrEqualToCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null,
            category: ConditionCategory.Contents
        };
        let testItem = new GreaterThanOrEqualToCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let condition = new GreaterThanOrEqualToCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.GreaterThanOrEqualTo,
            valueHostId: null,
            secondValueHostId: null
        };
        let condition = new GreaterThanOrEqualToCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new LessThanCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Boolean, 'Label');
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValue: false,
            secondValueHostId: null
        };
        let testItem = new LessThanCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So NoMatch because operator is LT
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate using secondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addInputValueHost('Property2', LookupKey.Number, 'Label2');
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let testItem = new LessThanCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100); // property value to match to the rest
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new LessThanCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new LessThanCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValue: null,
            secondValueHostId: null
        };
        let testItem = new LessThanCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null
        };
        let testItem = new LessThanCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null,
            category: ConditionCategory.Contents
        };
        let testItem = new LessThanCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let condition = new LessThanCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.LessThan,
            valueHostId: null,
            secondValueHostId: null
        };
        let condition = new LessThanCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class LessThanOrEqualToCondition', () => {
    test('DefaultConditionType', () => {
        expect(LessThanOrEqualToCondition.DefaultConditionType).toBe(ConditionType.LessThanOrEqualTo);
    });
    test('evaluate using secondValue property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new LessThanOrEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Boolean, 'Label');
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: false,
            secondValueHostId: null
        };
        let testItem = new LessThanOrEqualToCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue(true);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false); // secondValue == this value. So Match because operator is LTE
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate using secondValueHostId property with number for Match or NoMatch', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let vh2 = vm.addInputValueHost('Property2', LookupKey.Number, 'Label2');
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let testItem = new LessThanOrEqualToCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh2.setInputValue('---- Second does not matter ---');
        vh2.setValue(100); // property value to match to the rest
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new LessThanOrEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 100,
            secondValueHostId: null
        };
        let testItem = new LessThanOrEqualToCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.Number, 'Label');
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: null,
            secondValueHostId: null
        };
        let testItem = new LessThanOrEqualToCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null
        };
        let testItem = new LessThanOrEqualToCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValue: 10,
            secondValueHostId: null,
            category: ConditionCategory.Contents
        };
        let testItem = new LessThanOrEqualToCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: 'Property1',
            secondValueHostId: 'Property2'
        };
        let condition = new LessThanOrEqualToCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Property1')).toBe(true);
        expect(testItem.has('Property2')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.LessThanOrEqualTo,
            valueHostId: null,
            secondValueHostId: null
        };
        let condition = new LessThanOrEqualToCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class StringLengthCondition', () => {
    test('DefaultConditionType', () => {
        expect(StringLengthCondition.DefaultConditionType).toBe(ConditionType.StringLength);
    });
    test('evaluate when both Min/Max are assigned returns Match inside of stringlength; NoMatch outside of stringlength', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: 5
        };
        let testItem = new StringLengthCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        vh.setValue('');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' 1'); // trim option does not matter
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('12');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1234');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' 1234 '); // trim option does not mattern
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('12345');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('123456');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('12345 '); // trim option doesn't matter
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate when Min is assigned, Max is null. Match when >= Min', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: null
        };
        let testItem = new StringLengthCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: null,
            maximum: 5
        };
        let testItem = new StringLengthCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: undefined,
            maximum: undefined
        };
        let testItem = new StringLengthCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: 5,
            trim: false
        };
        let testItem = new StringLengthCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: true
            // trim: undefined means enabled
        };
        let testItem = new StringLengthCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: true,
            trim: false
        };
        let testItem = new StringLengthCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: false
        };
        let testItem = new StringLengthCondition(descriptor);
        vh.setInputValue('---- does not matter ----');
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('12', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('123456', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('getValuesForTokens without calling evaluate and establishing length', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: 5
        };
        let testItem = new StringLengthCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: 2,
            maximum: 5
        };
        vh.setValue("ABCDE");
        let testItem = new StringLengthCondition(descriptor);
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            minimum: null,
            maximum: null
        };
        vh.setValue("ABCDE");
        let testItem = new StringLengthCondition(descriptor);
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
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
        };
        let testItem = new StringLengthCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new StringLengthCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: 'Property1'
        };
        let condition = new StringLengthCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.StringLength,
            valueHostId: null
        };
        let condition = new StringLengthCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
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
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: []
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: AlwaysMatchesConditionType
                }]
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                }]
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: NeverMatchesConditionType
                }]
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the last evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: NeverMatchesConditionType
                }]
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the first evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: NeverMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                }]
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs not supplied, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType
                }]
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType,
                }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType,
                }],
            treatUndeterminedAs: ConditionEvaluateResult.NoMatch
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType,
                }],
            treatUndeterminedAs: ConditionEvaluateResult.Undetermined
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions where the first evaluates as Undetermined but treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Parent ValueHost used by child RequiredTextCondition', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [{
                    type: ConditionType.RequiredText,
                    // valueHostId omitted meaning it must use parent ValueHost
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: ConditionType.RegExp,
                    // valueHostId omitted meaning it must use parent ValueHost
                    expressionAsString: 'ABC'
                }],
        };
        vh.setValue('ABC'); // for RequiredTextCondition and RegExpCondition to match
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('category is Children', () => {
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: []
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [],
            category: ConditionCategory.Contents
        };
        let testItem = new AllMatchCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: []
        };
        let condition = new AllMatchCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostIds where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field2'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field3'
                },
            ]
        };
        let condition = new AllMatchCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });
    test('gatherValueHostIds where two child have the same ValueHostId, while another is different. Expect 2 ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field2'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
            ]
        };
        let condition = new AllMatchCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });
    test('gatherValueHostIds where each child two have different ValueHosts, another is Null. Expect two ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.And,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: null
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field3'
                },
            ]
        };
        let condition = new AllMatchCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });
});
describe('class AnyMatchCondition', () => {
    test('DefaultConditionType', () => {
        expect(AnyMatchCondition.DefaultConditionType).toBe(ConditionType.Or);
    });
    test('With 0 child conditions, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: []
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: AlwaysMatchesConditionType
                }]
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                }]
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: NeverMatchesConditionType
                }]
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the last evaluates as NoMatch, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: NeverMatchesConditionType
                }]
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where the first evaluates as Match and the rest NoMatch, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: AlwaysMatchesConditionType
                },
                {
                    type: NeverMatchesConditionType
                },
                {
                    type: NeverMatchesConditionType
                },
                {
                    type: NeverMatchesConditionType
                }]
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where all evaluate as NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: NeverMatchesConditionType
                },
                {
                    type: NeverMatchesConditionType
                },
                {
                    type: NeverMatchesConditionType
                },
                {
                    type: NeverMatchesConditionType
                }]
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs not supplied, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType
                }]
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType,
                }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType,
                }],
            treatUndeterminedAs: ConditionEvaluateResult.NoMatch
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType,
                }],
            treatUndeterminedAs: ConditionEvaluateResult.Undetermined
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions where the first evaluates as Undetermined but treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [{
                    type: IsUndeterminedConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                },
                {
                    type: AlwaysMatchesConditionType
                }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('category is Children', () => {
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: []
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [],
            category: ConditionCategory.Contents
        };
        let testItem = new AnyMatchCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: []
        };
        let condition = new AnyMatchCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostIds where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field2'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field3'
                },
            ]
        };
        let condition = new AnyMatchCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });
    test('gatherValueHostIds where two child have the same ValueHostId, while another is different. Expect 2 ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field2'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
            ]
        };
        let condition = new AnyMatchCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });
    test('gatherValueHostIds where each child two have different ValueHosts, another is Null. Expect two ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.Or,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: null
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field3'
                },
            ]
        };
        let condition = new AnyMatchCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });
});
describe('class CountMatchesCondition', () => {
    test('DefaultConditionType', () => {
        expect(CountMatchesCondition.DefaultConditionType).toBe(ConditionType.CountMatches);
    });
    function testCount(conditionTypes, minimum, maximum, expectedResult, treatUndeterminedAs) {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.CountMatches,
            minimum: minimum,
            maximum: maximum,
            conditionDescriptors: []
        };
        if (treatUndeterminedAs != null)
            descriptor.treatUndeterminedAs = treatUndeterminedAs;
        for (let conType of conditionTypes)
            descriptor.conditionDescriptors.push({
                type: conType
            });
        let testItem = new CountMatchesCondition(descriptor);
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
        testCount([AlwaysMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType], undefined, 3, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as NoMatch and minimum=1, evaluates as NoMatch', () => {
        testCount([NeverMatchesConditionType], 1, undefined, ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where one evaluates as NoMatch and Minimum=2, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType, NeverMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType], 2, undefined, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where one evaluates as NoMatch and Minimum=2 and Maximum=2, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType, NeverMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType], 2, 2, ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the first evaluates as NoMatch and Minimum=0, evaluates as Match', () => {
        testCount([NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType], 0, undefined, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where the first evaluates as NoMatch and Minimum=1, evaluates as NoMatch', () => {
        testCount([NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType], 1, undefined, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Match, evaluates as Match', () => {
        testCount([IsUndeterminedConditionType], undefined, undefined, ConditionEvaluateResult.Match, ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        testCount([IsUndeterminedConditionType], undefined, undefined, ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        testCount([IsUndeterminedConditionType], undefined, undefined, ConditionEvaluateResult.Undetermined, ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions with Match, Undetermined, NoMatch, NoMatch and treatUndeterminedAs=Match and Minimum=2, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, NeverMatchesConditionType], 2, undefined, ConditionEvaluateResult.Match, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions with Match, Undetermined, NoMatch, NoMatch and treatUndeterminedAs=NoMatch and Minimum=2, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, NeverMatchesConditionType], 2, undefined, ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.NoMatch);
    });
    test('category is Children', () => {
        let descriptor = {
            type: ConditionType.CountMatches,
            conditionDescriptors: []
        };
        let testItem = new CountMatchesCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.CountMatches,
            conditionDescriptors: [],
            category: ConditionCategory.Contents
        };
        let testItem = new CountMatchesCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds with no children has none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.CountMatches,
            conditionDescriptors: []
        };
        let condition = new CountMatchesCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostIds where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.CountMatches,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field2'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field3'
                },
            ]
        };
        let condition = new CountMatchesCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });
    test('gatherValueHostIds where two child have the same ValueHostId, while another is different. Expect 2 ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.CountMatches,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field2'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
            ]
        };
        let condition = new CountMatchesCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });
    test('gatherValueHostIds where each child two have different ValueHosts, another is Null. Expect two ValueHostIds', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.CountMatches,
            conditionDescriptors: [
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: null
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostId: 'Field3'
                },
            ]
        };
        let condition = new CountMatchesCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });
});
describe('class StringNotEmptyCondition', () => {
    test('DefaultConditionType', () => {
        expect(StringNotEmptyCondition.DefaultConditionType).toBe(ConditionType.StringNotEmpty);
    });
    function testValue(valueToTest, nullValueResult, expectedConditionEvaluateResult) {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringNotEmpty,
            valueHostId: 'Property1',
        };
        if (nullValueResult !== undefined)
            descriptor.nullValueResult = nullValueResult;
        let testItem = new StringNotEmptyCondition(descriptor);
        vh.setValue(valueToTest);
        expect(testItem.evaluate(vh, vm)).toBe(expectedConditionEvaluateResult);
    }
    test('evaluate with strings', () => {
        testValue('A', undefined, ConditionEvaluateResult.Match);
        testValue(' A ', undefined, ConditionEvaluateResult.Match);
        testValue(' ', undefined, ConditionEvaluateResult.Match); // not empty!
        testValue('', undefined, ConditionEvaluateResult.NoMatch);
    });
    test('evaluate with null', () => {
        testValue(null, undefined, ConditionEvaluateResult.NoMatch);
        testValue(null, ConditionEvaluateResult.Match, ConditionEvaluateResult.Match);
        testValue(null, ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.NoMatch);
        testValue(null, ConditionEvaluateResult.Undetermined, ConditionEvaluateResult.Undetermined);
    });
    test('evaluate with non-string data types are always undetermined', () => {
        testValue(undefined, undefined, ConditionEvaluateResult.Undetermined);
        testValue(0, undefined, ConditionEvaluateResult.Undetermined);
        testValue({}, undefined, ConditionEvaluateResult.Undetermined);
        testValue([], undefined, ConditionEvaluateResult.Undetermined);
        testValue(false, undefined, ConditionEvaluateResult.Undetermined);
        testValue(new Date(), undefined, ConditionEvaluateResult.Undetermined);
    });
    test('evaluate with wrong ValueHost logs and throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.StringNotEmpty,
            valueHostId: 'UnknownProperty'
        };
        let testItem = new StringNotEmptyCondition(descriptor);
        vh.setValue('');
        expect(() => testItem.evaluate(null, vm)).toThrow(/Missing value/);
        let logger = services.loggerService;
        expect(logger.entryCount()).toBe(1);
        expect(logger.getLatest().category).toBe(LoggingCategory.Configuration);
        expect(logger.getLatest().level).toBe(LoggingLevel.Error);
    });
    test('category is Required', () => {
        let descriptor = {
            type: ConditionType.StringNotEmpty,
            valueHostId: 'Property1',
        };
        let testItem = new StringNotEmptyCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Required);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.StringNotEmpty,
            valueHostId: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new StringNotEmptyCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.StringNotEmpty,
            valueHostId: 'Property1',
        };
        let condition = new StringNotEmptyCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.StringNotEmpty,
            valueHostId: null,
        };
        let condition = new StringNotEmptyCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class NotNullCondition', () => {
    test('DefaultConditionType', () => {
        expect(NotNullCondition.DefaultConditionType).toBe(ConditionType.NotNull);
    });
    function testValue(valueToTest, expectedConditionEvaluateResult) {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.NotNull,
            valueHostId: 'Property1',
        };
        let testItem = new NotNullCondition(descriptor);
        vh.setValue(valueToTest);
        expect(testItem.evaluate(vh, vm)).toBe(expectedConditionEvaluateResult);
    }
    test('evaluate with null results in NoMatch', () => {
        testValue(null, ConditionEvaluateResult.NoMatch);
    });
    test('evaluate with undefined results in Undetermined', () => {
        testValue(undefined, ConditionEvaluateResult.Undetermined);
    });
    test('evaluate without null or undefined results in Match', () => {
        testValue(0, ConditionEvaluateResult.Match);
        testValue({}, ConditionEvaluateResult.Match);
        testValue([], ConditionEvaluateResult.Match);
        testValue(false, ConditionEvaluateResult.Match);
        testValue('', ConditionEvaluateResult.Match);
        testValue('', ConditionEvaluateResult.Match);
        testValue(new Date(), ConditionEvaluateResult.Match);
    });
    test('evaluate with wrong ValueHost logs and throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addValueHost('Property1', LookupKey.String, 'Label');
        let descriptor = {
            type: ConditionType.NotNull,
            valueHostId: 'UnknownProperty'
        };
        let testItem = new NotNullCondition(descriptor);
        vh.setValue('');
        expect(() => testItem.evaluate(null, vm)).toThrow(/Missing value/);
        let logger = services.loggerService;
        expect(logger.entryCount()).toBe(1);
        expect(logger.getLatest().category).toBe(LoggingCategory.Configuration);
        expect(logger.getLatest().level).toBe(LoggingLevel.Error);
    });
    test('category is Required', () => {
        let descriptor = {
            type: ConditionType.NotNull,
            valueHostId: 'Property1',
        };
        let testItem = new NotNullCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Required);
    });
    test('category is overridden', () => {
        let descriptor = {
            type: ConditionType.NotNull,
            valueHostId: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new NotNullCondition(descriptor);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostIds when all are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.NotNull,
            valueHostId: 'Property1',
        };
        let condition = new NotNullCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostIds when none are assigned', () => {
        let services = new MockValidationServices(false, true);
        let vm = new MockValidationManager(services);
        let descriptor = {
            type: ConditionType.NotNull,
            valueHostId: null,
        };
        let condition = new NotNullCondition(descriptor);
        let testItem = new Set();
        expect(() => condition.gatherValueHostIds(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
//# sourceMappingURL=Conditions.test.js.map