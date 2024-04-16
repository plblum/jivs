import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { FluentConditionCollector, configChildren } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { AllMatchConditionDescriptor, AnyMatchConditionDescriptor, CountMatchesConditionDescriptor, DataTypeCheckConditionDescriptor, EqualToConditionDescriptor, GreaterThanConditionDescriptor, GreaterThanOrEqualConditionDescriptor, LessThanConditionDescriptor, LessThanOrEqualConditionDescriptor, NotEqualToConditionDescriptor, NotNullConditionDescriptor, RangeConditionDescriptor, RegExpConditionDescriptor, RequiredTextConditionDescriptor, StringLengthConditionDescriptor, StringNotEmptyConditionDescriptor } from '../../src/Conditions/ConcreteConditions';
import { ConditionDescriptor, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { enableFluentConditions } from '../../src/Conditions/FluentConditionCollectorExtensions';
import { EvaluateChildConditionResultsDescriptor } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { InputValidatorDescriptor } from '../../src/Interfaces/InputValidator';

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
        enableFluentConditions();
        let testItem = configChildren().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionDescriptor>{
            type: ConditionType.DataTypeCheck
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionDescriptor>{
            type: ConditionType.DataTypeCheck
        });
    });

});

describe('regExp on configChildren', () => {
    test('With expression assigned to a string, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp( '\\d');
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With expression assigned to a string and condDesc={}, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', null, {});
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With ValueHostName assigned and expression assigned to a string, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', null, null, 'Field2');
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            valueHostName: 'Field2'
        });
    });
    test('With expression assigned to a RegExp, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expression assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp(/\d/i);
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expression: /\d/i
        });
    });
    test('With expression and ignoreCase=true creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', true);
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: true
        });
    });
    test('With expression and ignoreCase=false creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', false);
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: false
        });
    });
    test('With expression as text, ignoreCase=null, and ivParam with not=true, creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and not=true assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', null, { not: true });
        TestFluentConditionCollector(testItem, <RegExpConditionDescriptor>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            not: true
        });
    });
});

describe('range on configChildren', () => {
    test('With minimum and maximum assigned, creates InputValidatorDescriptor with RangeCondition with type=Range, minimum and maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().range(1, 4);
        TestFluentConditionCollector(testItem, <RangeConditionDescriptor>{
            type: ConditionType.Range,
            minimum: 1,
            maximum: 4
        });
    });
    test('With ValueHostName, minimum and maximum assigned, creates InputValidatorDescriptor with RangeCondition with type=Range, minimum, maximum, and valueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().range(1, 4, 'Field2');
        TestFluentConditionCollector(testItem, <RangeConditionDescriptor>{
            type: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1,
            maximum: 4
        });
    });


    test('With minimum assigned and maximum=null, creates InputValidatorDescriptor with RangeCondition with type=Range, minimum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().range(1, null);
        TestFluentConditionCollector(testItem, <RangeConditionDescriptor>{
            type: ConditionType.Range,
            minimum: 1
        });
    });
    test('With maximum assigned and minimum=null, creates InputValidatorDescriptor with RangeCondition with type=Range, maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().range(null, 4);
        TestFluentConditionCollector(testItem, <RangeConditionDescriptor>{
            type: ConditionType.Range,
            maximum: 4
        });
    });

});

describe('equalToValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalToValue(1);
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalToValue(1, {});
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            secondValue: 1
        });
    });
    test('With ValueHostName and secondValue assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, secondValue and valueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalToValue(1, null, 'Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field2',
            secondValue: 1
        });
    });


    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('equalTo on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalTo('Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalTo('Field2', {});
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });    
    test('With valueHostName and secondValueHostName, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, valueHostName and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalTo('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionDescriptor>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('notEqualToValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualToValue(1);
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualToValue(1, {});
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualToValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('notEqualTo on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualTo('Field2');
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualTo('Field2', {});
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualTo('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionDescriptor>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('lessThanValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanValue(1);
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValue: 1
        });
    });
    
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, valueHostName and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().ltValue(1);
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThan on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThan('Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'

        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThan('Field2', {});
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThan('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lt" with secondValueHostName assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lt('Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lt" with valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lt('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });


    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThan( 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionDescriptor>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('lessThanOrEqualValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(1, {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });    

    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lteValue(1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned and condDesc={}, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lteValue(1, {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "lteValue" with valueHostName and secondValue assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lteValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThanOrEqual on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field2', {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lte" with secondValueHostName assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lte('Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lte" with valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lte('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName, and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionDescriptor>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});


describe('greaterThanValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "gtValue" with secondValue assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gtValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with secondValue assigned and condDesc={}, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gtValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with valueHostName and secondValue assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gtValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('greaterThan on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThan('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThan('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
   test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThan('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gt('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned and condDesc={}, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gt('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gt('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionDescriptor>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('greaterThanOrEqualValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gteValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned and condDesc={}, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gteValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with valueHostName and secondValue assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gteValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('greaterThanOrEqual on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName,  and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "gte" with secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gte('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with secondValueHostName assigned and condDesc={}, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gte('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with valueHostName and secondValueHostName assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gte('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionDescriptor>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('stringLength on configChildren', () => {
    test('With maximum assigned, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength and maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringLength(4);
        TestFluentConditionCollector(testItem, <StringLengthConditionDescriptor>{
            type: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With maximum assigned and condDesc={}, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength and maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringLength(4, {});
        TestFluentConditionCollector(testItem, <StringLengthConditionDescriptor>{
            type: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With valueHostName and maximum assigned, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength, valueHostName, and maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringLength(4, null, 'Field1');
        TestFluentConditionCollector(testItem, <StringLengthConditionDescriptor>{
            type: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4
        });
    });

    test('With minimum and maximum assigned, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength, minimum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringLength(4, { minimum: 1 });
        TestFluentConditionCollector(testItem, <StringLengthConditionDescriptor>{
            type: ConditionType.StringLength,
            maximum: 4,
            minimum: 1
        });
    });
});

describe('stringNotEmpty on configChildren', () => {
    test('With no parameters, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringNotEmpty();
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionDescriptor>{
            type: ConditionType.StringNotEmpty,
        });
    });
    test('With condDesc={}, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringNotEmpty({});
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionDescriptor>{
            type: ConditionType.StringNotEmpty,
        });
    });    
    test('With valueHostName assigned, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty and valueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringNotEmpty(null, 'Field1');
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionDescriptor>{
            type: ConditionType.StringNotEmpty,
            valueHostName: 'Field1',
        });
    });

    test('With nullValueResult assigned, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty, nullValueResult assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringNotEmpty({ nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionDescriptor>{
            type: ConditionType.StringNotEmpty,
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});

describe('requiredText on configChildren', () => {
    test('With no parameters, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText', () => {
        enableFluentConditions();
        let testItem = configChildren().requiredText();
        TestFluentConditionCollector(testItem, <RequiredTextConditionDescriptor>{
            type: ConditionType.RequiredText
        });
    });

    test('With condDesc={}, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText', () => {
        enableFluentConditions();
        let testItem = configChildren().requiredText({});
        TestFluentConditionCollector(testItem, <RequiredTextConditionDescriptor>{
            type: ConditionType.RequiredText
        });
    });
    test('With valueHostName assigned, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText and valueHostName', () => {
        enableFluentConditions();
        let testItem = configChildren().requiredText(null, 'Field1');
        TestFluentConditionCollector(testItem, <RequiredTextConditionDescriptor>{
            type: ConditionType.RequiredText,
            valueHostName: 'Field1'
        });
    });

    test('With emptyValue and nullValueResult assigned, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText, emptyValue, nullValueResult assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().requiredText({ emptyValue: 'X', nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionCollector(testItem, <RequiredTextConditionDescriptor>{
            type: ConditionType.RequiredText,
            emptyValue: 'X',
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});
describe('notNull on configChildren', () => {
    test('With no parameters, creates InputValidatorDescriptor with NotNullCondition with type=NotNull assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notNull();
        TestFluentConditionCollector(testItem, <NotNullConditionDescriptor>{
            type: ConditionType.NotNull
        });
    });
    test('With valueHostName assigned, creates InputValidatorDescriptor with NotNullCondition with type=NotNull and valueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notNull('Field1');
        TestFluentConditionCollector(testItem, <NotNullConditionDescriptor>{
            type: ConditionType.NotNull,
            valueHostName: 'Field1'
        });
    });

});

describe('all on configChildren', () => {
    test('With empty configChildren, creates InputValidatorDescriptor with AllMatchCondition with type=AllMatch and conditionDescriptors=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().all(configChildren());
        TestFluentConditionCollector(testItem, <AllMatchConditionDescriptor>{
                type: ConditionType.All,
                conditionDescriptors: []
           });
    });
    test('With configChildren setup with requiredText and regExp, creates InputValidatorDescriptor with AllMatchCondition with type=AllMatch and conditionDescriptors populated with both conditions', () => {
        enableFluentConditions();
        let testItem = configChildren().all(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentConditionCollector(testItem, <AllMatchConditionDescriptor>{
                type: ConditionType.All,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            });
    });
});
describe('any on configChildren', () => {
    test('With empty configChildren, creates InputValidatorDescriptor with AnyMatchCondition with type=AnyMatch and conditionDescriptors=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().any(configChildren());
        TestFluentConditionCollector(testItem, <AnyMatchConditionDescriptor>{
                type: ConditionType.Any,
                conditionDescriptors: []
            });
    });
    test('With configChildren setup with requiredText and regExp, creates InputValidatorDescriptor with AnyMatchCondition with type=AnyMatch and conditionDescriptors populated with both conditions', () => {
        enableFluentConditions();
        let testItem = configChildren().any(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentConditionCollector(testItem, <AnyMatchConditionDescriptor>{
                type: ConditionType.Any,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            });
    });
});

describe('countMatches on configChildren', () => {
    test('With minimum and maximum assigned and empty configChildren, creates InputValidatorDescriptor with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionDescriptors=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().countMatches(1, 2, configChildren());
        TestFluentConditionCollector(testItem, <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionDescriptors: []
            });
    });
    test('With minimum assigned and empty configChildren, creates InputValidatorDescriptor with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionDescriptors=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().countMatches(1, null, configChildren());
        TestFluentConditionCollector(testItem, <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                minimum: 1,
                conditionDescriptors: []
            });
    });
    test('With maximum assigned and empty configChildren, creates InputValidatorDescriptor with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionDescriptors=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().countMatches(null, 2, configChildren());
        TestFluentConditionCollector(testItem, <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                maximum: 2,
                conditionDescriptors: []
            });
    });    
    test('With configChildren setup with requiredText and regExp, creates InputValidatorDescriptor with CountMatchesMatchCondition with type=CountMatchesMatch and conditionDescriptors populated with both conditions', () => {
        enableFluentConditions();
        let testItem = configChildren().countMatches(0, 2, configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentConditionCollector(testItem, <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                minimum: 0,
                maximum: 2,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            });
    });
});