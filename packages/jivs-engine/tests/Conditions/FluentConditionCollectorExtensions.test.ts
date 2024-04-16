import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { FluentConditionCollector, configChildren } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig, EqualToConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, LessThanConditionConfig, LessThanOrEqualConditionConfig, NotEqualToConditionConfig, NotNullConditionConfig, RangeConditionConfig, RegExpConditionConfig, RequiredTextConditionConfig, StringLengthConditionConfig, StringNotEmptyConditionConfig } from '../../src/Conditions/ConcreteConditions';
import { ConditionConfig, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { enableFluentConditions } from '../../src/Conditions/FluentConditionCollectorExtensions';
import { EvaluateChildConditionResultsConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { InputValidatorConfig } from '../../src/Interfaces/InputValidator';

function TestFluentConditionCollector(testItem: FluentConditionCollector,
    expectedCondConfig: ConditionConfig) {

    expect(testItem).toBeInstanceOf(FluentConditionCollector);
    let typedTextItem = testItem as FluentConditionCollector;
    let config = typedTextItem.config as EvaluateChildConditionResultsConfig;
    expect(config.conditionConfigs).not.toBeNull();
    expect(config.conditionConfigs!.length).toBe(1);
    let condConfig = config.conditionConfigs![0];
    expect(condConfig).toEqual(expectedCondConfig);
}

describe('dataTypeCheck on configChildren', () => {
    test('With no parameters creates InputValidatorConfig with DataTypeCheckCondition with only type assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionConfig>{
            type: ConditionType.DataTypeCheck
        });
    });
    test('With only errorMessage creates InputValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionConfig>{
            type: ConditionType.DataTypeCheck
        });
    });

});

describe('regExp on configChildren', () => {
    test('With expression assigned to a string, creates InputValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp( '\\d');
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With expression assigned to a string and condDesc={}, creates InputValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', null, {});
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With ValueHostName assigned and expression assigned to a string, creates InputValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', null, null, 'Field2');
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            valueHostName: 'Field2'
        });
    });
    test('With expression assigned to a RegExp, creates InputValidatorConfig with RegExpCondition with type=RegExp and expression assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp(/\d/i);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expression: /\d/i
        });
    });
    test('With expression and ignoreCase=true creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', true);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: true
        });
    });
    test('With expression and ignoreCase=false creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', false);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: false
        });
    });
    test('With expression as text, ignoreCase=null, and ivParam with not=true, creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and not=true assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().regExp('\\d', null, { not: true });
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            not: true
        });
    });
});

describe('range on configChildren', () => {
    test('With minimum and maximum assigned, creates InputValidatorConfig with RangeCondition with type=Range, minimum and maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().range(1, 4);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            type: ConditionType.Range,
            minimum: 1,
            maximum: 4
        });
    });
    test('With ValueHostName, minimum and maximum assigned, creates InputValidatorConfig with RangeCondition with type=Range, minimum, maximum, and valueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().range(1, 4, 'Field2');
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            type: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1,
            maximum: 4
        });
    });


    test('With minimum assigned and maximum=null, creates InputValidatorConfig with RangeCondition with type=Range, minimum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().range(1, null);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            type: ConditionType.Range,
            minimum: 1
        });
    });
    test('With maximum assigned and minimum=null, creates InputValidatorConfig with RangeCondition with type=Range, maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().range(null, 4);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            type: ConditionType.Range,
            maximum: 4
        });
    });

});

describe('equalToValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalToValue(1);
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalToValue(1, {});
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValue: 1
        });
    });
    test('With ValueHostName and secondValue assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo, secondValue and valueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalToValue(1, null, 'Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field2',
            secondValue: 1
        });
    });


    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('equalTo on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalTo('Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalTo('Field2', {});
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });    
    test('With valueHostName and secondValueHostName, creates InputValidatorConfig with EqualToCondition with type=EqualTo, valueHostName and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalTo('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('notEqualToValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualToValue(1);
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualToValue(1, {});
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualToValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('notEqualTo on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualTo('Field2');
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualTo('Field2', {});
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualTo('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('lessThanValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanValue(1);
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValue: 1
        });
    });
    
    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, valueHostName and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().ltValue(1);
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThan on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThan('Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'

        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThan('Field2', {});
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThan('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lt" with secondValueHostName assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lt('Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lt" with valueHostName and secondValueHostName assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lt('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });


    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThan( 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('lessThanOrEqualValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(1, {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });    

    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lteValue(1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned and condDesc={}, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lteValue(1, {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "lteValue" with valueHostName and secondValue assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lteValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThanOrEqual on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field2', {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lte" with secondValueHostName assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lte('Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lte" with valueHostName and secondValueHostName assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lte('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName, and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});


describe('greaterThanValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "gtValue" with secondValue assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gtValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with secondValue assigned and condDesc={}, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gtValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with valueHostName and secondValue assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gtValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('greaterThan on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThan('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThan('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
   test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThan('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gt('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gt('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with valueHostName and secondValueHostName assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gt('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('greaterThanOrEqualValue on configChildren', () => {
    test('With secondValue assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gteValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned and condDesc={}, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gteValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with valueHostName and secondValue assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValue assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gteValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('greaterThanOrEqual on configChildren', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName,  and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "gte" with secondValueHostName assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gte('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gte('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with valueHostName and secondValueHostName assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().gte('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('stringLength on configChildren', () => {
    test('With maximum assigned, creates InputValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringLength(4);
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            type: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With maximum assigned and condDesc={}, creates InputValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringLength(4, {});
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            type: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With valueHostName and maximum assigned, creates InputValidatorConfig with StringLengthCondition with type=StringLength, valueHostName, and maximum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringLength(4, null, 'Field1');
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            type: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4
        });
    });

    test('With minimum and maximum assigned, creates InputValidatorConfig with StringLengthCondition with type=StringLength, minimum assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringLength(4, { minimum: 1 });
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            type: ConditionType.StringLength,
            maximum: 4,
            minimum: 1
        });
    });
});

describe('stringNotEmpty on configChildren', () => {
    test('With no parameters, creates InputValidatorConfig with StringNotEmptyCondition with type=StringNotEmpty assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringNotEmpty();
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionConfig>{
            type: ConditionType.StringNotEmpty,
        });
    });
    test('With condDesc={}, creates InputValidatorConfig with StringNotEmptyCondition with type=StringNotEmpty assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringNotEmpty({});
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionConfig>{
            type: ConditionType.StringNotEmpty,
        });
    });    
    test('With valueHostName assigned, creates InputValidatorConfig with StringNotEmptyCondition with type=StringNotEmpty and valueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringNotEmpty(null, 'Field1');
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionConfig>{
            type: ConditionType.StringNotEmpty,
            valueHostName: 'Field1',
        });
    });

    test('With nullValueResult assigned, creates InputValidatorConfig with StringNotEmptyCondition with type=StringNotEmpty, nullValueResult assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().stringNotEmpty({ nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionCollector(testItem, <StringNotEmptyConditionConfig>{
            type: ConditionType.StringNotEmpty,
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});

describe('requiredText on configChildren', () => {
    test('With no parameters, creates InputValidatorConfig with RequiredTextCondition with type=RequiredText', () => {
        enableFluentConditions();
        let testItem = configChildren().requiredText();
        TestFluentConditionCollector(testItem, <RequiredTextConditionConfig>{
            type: ConditionType.RequiredText
        });
    });

    test('With condDesc={}, creates InputValidatorConfig with RequiredTextCondition with type=RequiredText', () => {
        enableFluentConditions();
        let testItem = configChildren().requiredText({});
        TestFluentConditionCollector(testItem, <RequiredTextConditionConfig>{
            type: ConditionType.RequiredText
        });
    });
    test('With valueHostName assigned, creates InputValidatorConfig with RequiredTextCondition with type=RequiredText and valueHostName', () => {
        enableFluentConditions();
        let testItem = configChildren().requiredText(null, 'Field1');
        TestFluentConditionCollector(testItem, <RequiredTextConditionConfig>{
            type: ConditionType.RequiredText,
            valueHostName: 'Field1'
        });
    });

    test('With emptyValue and nullValueResult assigned, creates InputValidatorConfig with RequiredTextCondition with type=RequiredText, emptyValue, nullValueResult assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().requiredText({ emptyValue: 'X', nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionCollector(testItem, <RequiredTextConditionConfig>{
            type: ConditionType.RequiredText,
            emptyValue: 'X',
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});
describe('notNull on configChildren', () => {
    test('With no parameters, creates InputValidatorConfig with NotNullCondition with type=NotNull assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notNull();
        TestFluentConditionCollector(testItem, <NotNullConditionConfig>{
            type: ConditionType.NotNull
        });
    });
    test('With valueHostName assigned, creates InputValidatorConfig with NotNullCondition with type=NotNull and valueHostName assigned', () => {
        enableFluentConditions();
        let testItem = configChildren().notNull('Field1');
        TestFluentConditionCollector(testItem, <NotNullConditionConfig>{
            type: ConditionType.NotNull,
            valueHostName: 'Field1'
        });
    });

});

describe('all on configChildren', () => {
    test('With empty configChildren, creates InputValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().all(configChildren());
        TestFluentConditionCollector(testItem, <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: []
           });
    });
    test('With configChildren setup with requiredText and regExp, creates InputValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs populated with both conditions', () => {
        enableFluentConditions();
        let testItem = configChildren().all(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentConditionCollector(testItem, <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: [<any>{
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
    test('With empty configChildren, creates InputValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().any(configChildren());
        TestFluentConditionCollector(testItem, <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: []
            });
    });
    test('With configChildren setup with requiredText and regExp, creates InputValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs populated with both conditions', () => {
        enableFluentConditions();
        let testItem = configChildren().any(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentConditionCollector(testItem, <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: [<any>{
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
    test('With minimum and maximum assigned and empty configChildren, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().countMatches(1, 2, configChildren());
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: []
            });
    });
    test('With minimum assigned and empty configChildren, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().countMatches(1, null, configChildren());
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 1,
                conditionConfigs: []
            });
    });
    test('With maximum assigned and empty configChildren, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {
        enableFluentConditions();
        let testItem = configChildren().countMatches(null, 2, configChildren());
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                maximum: 2,
                conditionConfigs: []
            });
    });    
    test('With configChildren setup with requiredText and regExp, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {
        enableFluentConditions();
        let testItem = configChildren().countMatches(0, 2, configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 0,
                maximum: 2,
                conditionConfigs: [<any>{
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