import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { FluentConditionCollector, configChildren } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { DataTypeCheckConditionDescriptor, EqualToConditionDescriptor, GreaterThanConditionDescriptor, GreaterThanOrEqualConditionDescriptor, LessThanConditionDescriptor, LessThanOrEqualConditionDescriptor, NotEqualToConditionDescriptor, NotNullConditionDescriptor, RangeConditionDescriptor, RegExpConditionDescriptor, RequiredTextConditionDescriptor, StringLengthConditionDescriptor, StringNotEmptyConditionDescriptor } from '../../src/Conditions/ConcreteConditions';
import { ConditionDescriptor, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { initFluentConditions } from '../../src/Conditions/FluentConditionCollectorExtensions';
import { EvaluateChildConditionResultsDescriptor } from '../../src/Conditions/EvaluateChildConditionResultsBase';

function TestFluentConditionCollector(testItem: FluentConditionCollector,
    expectedCondDescriptor: ConditionDescriptor) {

    expect(testItem).toBeInstanceOf(FluentConditionCollector);
    let typedTextItem = testItem as FluentConditionCollector;
    let descriptor = typedTextItem.descriptor as EvaluateChildConditionResultsDescriptor;
    expect(descriptor.conditionDescriptors).not.toBeNull();
    expect(descriptor.conditionDescriptors!.length).toBe(1);
    let condDescriptor = descriptor.conditionDescriptors![0];
    expect(condDescriptor).toEqual(expectedCondDescriptor);
}

describe('dataTypeCheck on configChildren', () => {
    test('With no parameters creates InputValidatorDescriptor with DataTypeCheckCondition with only type assigned', () => {
        initFluentConditions();
        let testItem = configChildren().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionDescriptor>{
            type: ConditionType.DataTypeCheck
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {
        initFluentConditions();
        let testItem = configChildren().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionDescriptor>{
            type: ConditionType.DataTypeCheck
        });
    });

});

describe('regExp on configChildren', () => {
    test('With ValueHostName and expression assigned to a string, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        initFluentConditions();
        let testItem = configChildren().regExp('Field2', '\\d');
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            valueHostName: 'Field2'
        });
    });
    test('With ValueHostName=null and expression assigned to a string, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        initFluentConditions();
        let testItem = configChildren().regExp(null, '\\d');
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With expression assigned to a RegExp, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expression assigned', () => {
        initFluentConditions();
        let testItem = configChildren().regExp('Field2', /\d/i);
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expression: /\d/i,
            valueHostName: 'Field2'
        });
    });
    test('With expression and ignoreCase=true creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {
        initFluentConditions();
        let testItem = configChildren().regExp('Field2', '\\d', true);
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            valueHostName: 'Field2',
            expressionAsString: '\\d',
            ignoreCase: true
        });
    });
    test('With expression and ignoreCase=false creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {
        initFluentConditions();
        let testItem = configChildren().regExp('Field2', '\\d', false);
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            valueHostName: 'Field2',
            expressionAsString: '\\d',
            ignoreCase: false
        });
    });
    test('With expression as text, ignoreCase=null, and ivParam with not=true, creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and not=true assigned', () => {
        initFluentConditions();
        let testItem = configChildren().regExp('Field2', '\\d', null, { not: true });
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            valueHostName: 'Field2',
            expressionAsString: '\\d',
            not: true
        });
    });
});

describe('range on configChildren', () => {
    test('With ValueHostName, minimum and maximum, creates InputValidatorDescriptor with RangeCondition with type=Range, minimum, maximum, and valueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().range('Field2', 1, 4);
        TestFluentConditionCollector(testItem, <RangeConditionDescriptor>{
            type: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1,
            maximum: 4
        });
    });
    test('With ValueHostName=ull, minimum and maximum, creates InputValidatorDescriptor with RangeCondition with type=Range, minimum and maximum assigned', () => {
        initFluentConditions();
        let testItem = configChildren().range(null, 1, 4);
        TestFluentConditionCollector(testItem, <RangeConditionDescriptor>{
            type: ConditionType.Range,
            minimum: 1,
            maximum: 4
        });
    });

    test('With minimum assigned and maximum=null, creates InputValidatorDescriptor with RangeCondition with type=Range, minimum assigned', () => {
        initFluentConditions();
        let testItem = configChildren().range('Field2', 1, null);
        TestFluentConditionCollector(testItem, <RangeConditionDescriptor>{
            type: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1
        });
    });
    test('With maximum assigned and minimum=null, creates InputValidatorDescriptor with RangeCondition with type=Range, maximum assigned', () => {
        initFluentConditions();
        let testItem = configChildren().range('Field2', null, 4);
        TestFluentConditionCollector(testItem, <RangeConditionDescriptor>{
            type: ConditionType.Range,
            valueHostName: 'Field2',
            maximum: 4
        });
    });

});

describe('equalToValue on configChildren', () => {
    test('With ValueHostName and secondValue assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, secondValue and valueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().equalToValue('Field2', 1);
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field2',
            secondValue: 1
        });
    });
    test('With ValueHostName=null and secondValue assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().equalToValue(null, 1);
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().equalToValue('Field2', 1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field2',
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('equalTo on configChildren', () => {
    test('With valueHostName and secondValueHostName, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, valueHostName and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().equalTo('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().equalTo(null, 'Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().equalTo('Field1', 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('notEqualToValue on configChildren', () => {
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().notEqualToValue('Field1', 1);
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('With valueHostName=null and secondValue assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().notEqualToValue(null, 1);
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            secondValue: 1
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().notEqualToValue('Field1', 1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('notEqualTo on configChildren', () => {
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().notEqualTo('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().notEqualTo(null, 'Field2');
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().notEqualTo('Field1', 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThanValue on configChildren', () => {
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, valueHostName and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThanValue('Field1', 1);
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().ltValue('Field1', 1);
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With valueHostName, secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, valueHostName, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThanValue('Field1', 1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThan on configChildren', () => {
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThan('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'

        });
    });
    test('With valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThan(null, 'Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'

        });
    });
    test('Shorthand version "lt" with valueHostName, secondValueHostName, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lt('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lt" with valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lt(null, 'Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThan('Field1', 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('lessThanOrEqualValue on configChildren', () => {
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue('Field1', 1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('With valueHostName=null and secondValue assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(null, 1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "lteValue" with valueHostName and secondValue assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lteValue('Field1', 1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "lteValue" with valueHostName=null and secondValue assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lteValue(null, 1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });
    test('With valueHostName, secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue('Field1', 1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThanOrEqual on configChildren', () => {
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThanOrEqual(null, 'Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lte" with valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lte('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lte" with valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lte(null, 'Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName, secondValueHostName, and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field1', 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});


describe('greaterThanValue on configChildren', () => {
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanValue('Field1', 1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('With valueHostName=null and secondValue assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanValue(null, 1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with valueHostName and secondValue assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().gtValue('Field1', 1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "gtValue" with valueHostName=null and secondValue assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().gtValue(null, 1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });

    test('With valueHostName, secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanValue('Field1', 1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('greaterThan on configChildren', () => {
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThan('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThan(null, 'Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().gt('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().gt(null, 'Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName, secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThan('Field1', 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('greaterThanOrEqualValue on configChildren', () => {
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue('Field1', 1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('With valueHostName=null and secondValue assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(null, 1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with valueHostName and secondValue assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().gteValue('Field1', 1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "gteValue" with valueHostName=null and secondValue assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        initFluentConditions();
        let testItem = configChildren().gteValue(null, 1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });

    test('With valueHostName, secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue('Field1', 1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('greaterThanOrEqual on configChildren', () => {
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName,  and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName=null and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanOrEqual(null, 'Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "gte" with valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field1', 'Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName, secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, secondValue, and secondConversionLookupKey assigned', () => {
        initFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field1', 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('stringLength on configChildren', () => {
    test('With valueHostName and maximum assigned, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength, valueHostName, and maximum assigned', () => {
        initFluentConditions();
        let testItem = configChildren().stringLength('Field1', 4);
        TestFluentConditionCollector(testItem, <StringLengthConditionDescriptor>{
            type: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4
        });
    });
    test('With valueHostName=null and maximum assigned, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength and maximum assigned', () => {
        initFluentConditions();
        let testItem = configChildren().stringLength(null, 4);
        TestFluentConditionCollector(testItem, <StringLengthConditionDescriptor>{
            type: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With minimum and maximum assigned, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength, minimum assigned', () => {
        initFluentConditions();
        let testItem = configChildren().stringLength('Field1', 4, { minimum: 1 });
        TestFluentConditionCollector(testItem, <StringLengthConditionDescriptor>{
            type: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4,
            minimum: 1
        });
    });
});

describe('stringNotEmpty on configChildren', () => {
    test('With valueHostName assigned, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty and valueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().stringNotEmpty('Field1');
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionDescriptor>{
            type: ConditionType.StringNotEmpty,
            valueHostName: 'Field1',
        });
    });
    test('With valueHostName=null, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty assigned', () => {
        initFluentConditions();
        let testItem = configChildren().stringNotEmpty(null);
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionDescriptor>{
            type: ConditionType.StringNotEmpty,
        });
    });
    test('With nullValueResult assigned, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty, nullValueResult assigned', () => {
        initFluentConditions();
        let testItem = configChildren().stringNotEmpty('Field1', { nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionDescriptor>{
            type: ConditionType.StringNotEmpty,
            valueHostName: 'Field1',
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});

describe('requiredText on configChildren', () => {
    test('With valueHostName assigned, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText and valueHostName', () => {
        initFluentConditions();
        let testItem = configChildren().requiredText('Field1');
        TestFluentConditionCollector(testItem, <RequiredTextConditionDescriptor>{
            type: ConditionType.RequiredText,
            valueHostName: 'Field1'
        });
    });

    test('With valueHostName=null, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText', () => {
        initFluentConditions();
        let testItem = configChildren().requiredText(null);
        TestFluentConditionCollector(testItem, <RequiredTextConditionDescriptor>{
            type: ConditionType.RequiredText
        });
    });
    test('With emptyValue and nullValueResult assigned, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText, emptyValue, nullValueResult assigned', () => {
        initFluentConditions();
        let testItem = configChildren().requiredText('Field1', { emptyValue: 'X', nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionCollector(testItem, <RequiredTextConditionDescriptor>{
            type: ConditionType.RequiredText,
            valueHostName: 'Field1',
            emptyValue: 'X',
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});
describe('notNull on configChildren', () => {
    test('With valueHostName assigned, creates InputValidatorDescriptor with NotNullCondition with type=NotNull and valueHostName assigned', () => {
        initFluentConditions();
        let testItem = configChildren().notNull('Field1');
        TestFluentConditionCollector(testItem, <NotNullConditionDescriptor>{
            type: ConditionType.NotNull,
            valueHostName: 'Field1'
        });
    });
    test('With valueHostName=null, creates InputValidatorDescriptor with NotNullCondition with type=NotNull assigned', () => {
        initFluentConditions();
        let testItem = configChildren().notNull(null);
        TestFluentConditionCollector(testItem, <NotNullConditionDescriptor>{
            type: ConditionType.NotNull
        });
    });
});