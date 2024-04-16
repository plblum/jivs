import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { FluentConditionCollector, config } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import {
    AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, NotEqualToConditionConfig, NotNullConditionConfig, RangeConditionConfig,
    RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig
} from '../../src/Conditions/ConcreteConditions';
import { ConditionConfig, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { EvaluateChildConditionResultsConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';

function TestFluentConditionCollector(testItem: FluentConditionCollector,
    expectedCondConfig: ConditionConfig) {

    expect(testItem).toBeInstanceOf(FluentConditionCollector);
    let typedTextItem = testItem as FluentConditionCollector;
    let parentConfig = typedTextItem.parentConfig as EvaluateChildConditionResultsConfig;
    expect(parentConfig.conditionConfigs).not.toBeNull();
    expect(parentConfig.conditionConfigs!.length).toBe(1);
    let condConfig = parentConfig.conditionConfigs![0];
    expect(condConfig).toEqual(expectedCondConfig);
}

describe('dataTypeCheck on conditions', () => {
    test('With no parameters creates InputValidatorConfig with DataTypeCheckCondition with only type assigned', () => {

        let testItem = config().conditions().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionConfig>{
            type: ConditionType.DataTypeCheck
        });
    });
    test('With only errorMessage creates InputValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().conditions().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionConfig>{
            type: ConditionType.DataTypeCheck
        });
    });

});

describe('regExp on conditions', () => {
    test('With expression assigned to a string, creates InputValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {

        let testItem = config().conditions().regExp( '\\d');
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With expression assigned to a string and condDesc={}, creates InputValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {

        let testItem = config().conditions().regExp('\\d', null, {});
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With ValueHostName assigned and expression assigned to a string, creates InputValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {

        let testItem = config().conditions().regExp('\\d', null, null, 'Field2');
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            valueHostName: 'Field2'
        });
    });
    test('With expression assigned to a RegExp, creates InputValidatorConfig with RegExpCondition with type=RegExp and expression assigned', () => {

        let testItem = config().conditions().regExp(/\d/i);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expression: /\d/i
        });
    });
    test('With expression and ignoreCase=true creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {

        let testItem = config().conditions().regExp('\\d', true);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: true
        });
    });
    test('With expression and ignoreCase=false creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {

        let testItem = config().conditions().regExp('\\d', false);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: false
        });
    });
    test('With expression as text, ignoreCase=null, and ivParam with not=true, creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and not=true assigned', () => {

        let testItem = config().conditions().regExp('\\d', null, { not: true });
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            type: ConditionType.RegExp,
            expressionAsString: '\\d',
            not: true
        });
    });
});

describe('range on conditions', () => {
    test('With minimum and maximum assigned, creates InputValidatorConfig with RangeCondition with type=Range, minimum and maximum assigned', () => {

        let testItem = config().conditions().range(1, 4);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            type: ConditionType.Range,
            minimum: 1,
            maximum: 4
        });
    });
    test('With ValueHostName, minimum and maximum assigned, creates InputValidatorConfig with RangeCondition with type=Range, minimum, maximum, and valueHostName assigned', () => {

        let testItem = config().conditions().range(1, 4, 'Field2');
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            type: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1,
            maximum: 4
        });
    });


    test('With minimum assigned and maximum=null, creates InputValidatorConfig with RangeCondition with type=Range, minimum assigned', () => {

        let testItem = config().conditions().range(1, null);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            type: ConditionType.Range,
            minimum: 1
        });
    });
    test('With maximum assigned and minimum=null, creates InputValidatorConfig with RangeCondition with type=Range, maximum assigned', () => {

        let testItem = config().conditions().range(null, 4);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            type: ConditionType.Range,
            maximum: 4
        });
    });

});

describe('equalToValue on conditions', () => {
    test('With secondValue assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

        let testItem = config().conditions().equalToValue(1);
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

        let testItem = config().conditions().equalToValue(1, {});
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValue: 1
        });
    });
    test('With ValueHostName and secondValue assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo, secondValue and valueHostName assigned', () => {

        let testItem = config().conditions().equalToValue(1, null, 'Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field2',
            secondValue: 1
        });
    });


    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('equalTo on conditions', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {

        let testItem = config().conditions().equalTo('Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {

        let testItem = config().conditions().equalTo('Field2', {});
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });    
    test('With valueHostName and secondValueHostName, creates InputValidatorConfig with EqualToCondition with type=EqualTo, valueHostName and secondValueHostName assigned', () => {

        let testItem = config().conditions().equalTo('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            type: ConditionType.EqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('notEqualToValue on conditions', () => {
    test('With secondValue assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {

        let testItem = config().conditions().notEqualToValue(1);
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {

        let testItem = config().conditions().notEqualToValue(1, {});
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValue assigned', () => {

        let testItem = config().conditions().notEqualToValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('notEqualTo on conditions', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {

        let testItem = config().conditions().notEqualTo('Field2');
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {

        let testItem = config().conditions().notEqualTo('Field2', {});
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().notEqualTo('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            type: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('lessThanValue on conditions', () => {
    test('With secondValue assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {

        let testItem = config().conditions().lessThanValue(1);
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValue: 1
        });
    });
    
    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, valueHostName and secondValue assigned', () => {

        let testItem = config().conditions().lessThanValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {

        let testItem = config().conditions().ltValue(1);
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThan on conditions', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = config().conditions().lessThan('Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'

        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = config().conditions().lessThan('Field2', {});
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().lessThan('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lt" with secondValueHostName assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = config().conditions().lt('Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lt" with valueHostName and secondValueHostName assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().lt('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });


    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().lessThan( 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            type: ConditionType.LessThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('lessThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = config().conditions().lessThanOrEqualValue(1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = config().conditions().lessThanOrEqualValue(1, {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });    

    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValue assigned', () => {

        let testItem = config().conditions().lessThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = config().conditions().lteValue(1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned and condDesc={}, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = config().conditions().lteValue(1, {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "lteValue" with valueHostName and secondValue assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValue assigned', () => {

        let testItem = config().conditions().lteValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().conditions().lessThanOrEqual('Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().conditions().lessThanOrEqual('Field2', {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().lessThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lte" with secondValueHostName assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().conditions().lte('Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lte" with valueHostName and secondValueHostName assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().lte('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName, and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            type: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});


describe('greaterThanValue on conditions', () => {
    test('With secondValue assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = config().conditions().greaterThanValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = config().conditions().greaterThanValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValue assigned', () => {

        let testItem = config().conditions().greaterThanValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "gtValue" with secondValue assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = config().conditions().gtValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with secondValue assigned and condDesc={}, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = config().conditions().gtValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with valueHostName and secondValue assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValue assigned', () => {

        let testItem = config().conditions().gtValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('greaterThan on conditions', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = config().conditions().greaterThan('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = config().conditions().greaterThan('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
   test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().greaterThan('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = config().conditions().gt('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = config().conditions().gt('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with valueHostName and secondValueHostName assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().gt('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            type: ConditionType.GreaterThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('greaterThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = config().conditions().greaterThanOrEqualValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = config().conditions().greaterThanOrEqualValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValue assigned', () => {

        let testItem = config().conditions().greaterThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = config().conditions().gteValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned and condDesc={}, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = config().conditions().gteValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with valueHostName and secondValue assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValue assigned', () => {

        let testItem = config().conditions().gteValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('greaterThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().conditions().greaterThanOrEqual('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().conditions().greaterThanOrEqual('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName and secondValueHostName assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName,  and secondValueHostName assigned', () => {

        let testItem = config().conditions().greaterThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "gte" with secondValueHostName assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().gte('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with secondValueHostName assigned and condDesc={}, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().gte('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with valueHostName and secondValueHostName assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {

        let testItem = config().conditions().gte('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().conditions().greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            type: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('stringLength on conditions', () => {
    test('With maximum assigned, creates InputValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {

        let testItem = config().conditions().stringLength(4);
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            type: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With maximum assigned and condDesc={}, creates InputValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {

        let testItem = config().conditions().stringLength(4, {});
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            type: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With valueHostName and maximum assigned, creates InputValidatorConfig with StringLengthCondition with type=StringLength, valueHostName, and maximum assigned', () => {

        let testItem = config().conditions().stringLength(4, null, 'Field1');
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            type: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4
        });
    });

    test('With minimum and maximum assigned, creates InputValidatorConfig with StringLengthCondition with type=StringLength, minimum assigned', () => {

        let testItem = config().conditions().stringLength(4, { minimum: 1 });
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            type: ConditionType.StringLength,
            maximum: 4,
            minimum: 1
        });
    });
});

describe('requireText on conditions', () => {
    test('With no parameters, creates InputValidatorConfig with RequireTextCondition with type=RequireText', () => {

        let testItem = config().conditions().requireText();
        TestFluentConditionCollector(testItem, <RequireTextConditionConfig>{
            type: ConditionType.RequireText
        });
    });

    test('With condDesc={}, creates InputValidatorConfig with RequireTextCondition with type=RequireText', () => {

        let testItem = config().conditions().requireText({});
        TestFluentConditionCollector(testItem, <RequireTextConditionConfig>{
            type: ConditionType.RequireText
        });
    });
    test('With valueHostName assigned, creates InputValidatorConfig with RequireTextCondition with type=RequireText and valueHostName', () => {

        let testItem = config().conditions().requireText(null, 'Field1');
        TestFluentConditionCollector(testItem, <RequireTextConditionConfig>{
            type: ConditionType.RequireText,
            valueHostName: 'Field1'
        });
    });

    test('With nullValueResult=NoMatch assigned, creates InputValidatorConfig with RequireTextCondition with type=RequireText, nullValueResult=NoMatch assigned', () => {

        let testItem = config().conditions().requireText({ nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionCollector(testItem, <RequireTextConditionConfig>{
            type: ConditionType.RequireText,
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});
describe('notNull on conditions', () => {
    test('With no parameters, creates InputValidatorConfig with NotNullCondition with type=NotNull assigned', () => {

        let testItem = config().conditions().notNull();
        TestFluentConditionCollector(testItem, <NotNullConditionConfig>{
            type: ConditionType.NotNull
        });
    });
    test('With valueHostName assigned, creates InputValidatorConfig with NotNullCondition with type=NotNull and valueHostName assigned', () => {

        let testItem = config().conditions().notNull('Field1');
        TestFluentConditionCollector(testItem, <NotNullConditionConfig>{
            type: ConditionType.NotNull,
            valueHostName: 'Field1'
        });
    });

});

describe('all on conditions', () => {
    test('With empty conditions, creates InputValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs=[]', () => {

        let testItem = config().conditions().all(config().conditions());
        TestFluentConditionCollector(testItem, <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: []
           });
    });
    test('With conditions setup with requireText and regExp, creates InputValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs populated with both conditions', () => {

        let testItem = config().conditions().all(config().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionCollector(testItem, <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            });
    });
});
describe('any on conditions', () => {
    test('With empty conditions, creates InputValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs=[]', () => {

        let testItem = config().conditions().any(config().conditions());
        TestFluentConditionCollector(testItem, <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: []
            });
    });
    test('With conditions setup with requireText and regExp, creates InputValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs populated with both conditions', () => {

        let testItem = config().conditions().any(config().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionCollector(testItem, <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            });
    });
});

describe('countMatches on conditions', () => {
    test('With minimum and maximum assigned and empty conditions, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {

        let testItem = config().conditions().countMatches(1, 2, config().conditions());
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: []
            });
    });
    test('With minimum assigned and empty conditions, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {

        let testItem = config().conditions().countMatches(1, null, config().conditions());
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 1,
                conditionConfigs: []
            });
    });
    test('With maximum assigned and empty conditions, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {

        let testItem = config().conditions().countMatches(null, 2, config().conditions());
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                maximum: 2,
                conditionConfigs: []
            });
    });    
    test('With conditions setup with requireText and regExp, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {

        let testItem = config().conditions().countMatches(0, 2, config().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 0,
                maximum: 2,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            });
    });
});