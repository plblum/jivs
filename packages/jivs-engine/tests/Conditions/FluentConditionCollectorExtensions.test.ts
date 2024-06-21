import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { FluentConditionCollector, ValidationManagerStartFluent } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import {
    AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, EqualToValueConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig, IntegerConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig, MaxDecimalsConditionConfig, NotEqualToConditionConfig, NotEqualToValueConditionConfig, NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig,
    RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig
} from '../../src/Conditions/ConcreteConditions';
import { ConditionConfig, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { ConditionWithChildrenBaseConfig } from '../../src/Conditions/ConditionWithChildrenBase';

function TestFluentConditionCollector(testItem: FluentConditionCollector,
    expectedCondConfig: ConditionConfig) {

    expect(testItem).toBeInstanceOf(FluentConditionCollector);
    let typedTextItem = testItem as FluentConditionCollector;
    let parentConfig = typedTextItem.parentConfig as ConditionWithChildrenBaseConfig;
    expect(parentConfig.conditionConfigs).not.toBeNull();
    expect(parentConfig.conditionConfigs!.length).toBe(1);
    let condConfig = parentConfig.conditionConfigs![0];
    expect(condConfig).toEqual(expectedCondConfig);
}

describe('dataTypeCheck on conditions', () => {
    test('With no parameters creates ValidatorConfig with DataTypeCheckCondition with only type assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)
        let testItem = fluent.conditions().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck
        });
    });
    test('With only errorMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)
        let testItem = fluent.conditions().dataTypeCheck();
        TestFluentConditionCollector(testItem, <DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck
        });
    });

});

describe('regExp on conditions', () => {
    test('With expression assigned to a string, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().regExp( '\\d');
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With expression assigned to a string and condDesc={}, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().regExp('\\d', null, {});
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With ValueHostName assigned and expression assigned to a string, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().regExp('\\d', null, null, 'Field2');
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            valueHostName: 'Field2'
        });
    });
    test('With expression assigned to a RegExp, creates ValidatorConfig with RegExpCondition with type=RegExp and expression assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().regExp(/\d/i);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expression: /\d/i
        });
    });
    test('With expression and ignoreCase=true creates ValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().regExp('\\d', true);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: true
        });
    });
    test('With expression and ignoreCase=false creates ValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().regExp('\\d', false);
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: false
        });
    });
    test('With expression as text, ignoreCase=null, and ivParam with not=true, creates ValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and not=true assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().regExp('\\d', null, { not: true });
        TestFluentConditionCollector(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            not: true
        });
    });
});

describe('range on conditions', () => {
    test('With minimum and maximum assigned, creates ValidatorConfig with RangeCondition with type=Range, minimum and maximum assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().range(1, 4);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            conditionType: ConditionType.Range,
            minimum: 1,
            maximum: 4
        });
    });
    test('With ValueHostName, minimum and maximum assigned, creates ValidatorConfig with RangeCondition with type=Range, minimum, maximum, and valueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().range(1, 4, 'Field2');
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            conditionType: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1,
            maximum: 4
        });
    });


    test('With minimum assigned and maximum=null, creates ValidatorConfig with RangeCondition with type=Range, minimum assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().range(1, null);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            conditionType: ConditionType.Range,
            minimum: 1
        });
    });
    test('With maximum assigned and minimum=null, creates ValidatorConfig with RangeCondition with type=Range, maximum assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().range(null, 4);
        TestFluentConditionCollector(testItem, <RangeConditionConfig>{
            conditionType: ConditionType.Range,
            maximum: 4
        });
    });

});

describe('equalToValue on conditions', () => {
    test('With secondValue assigned, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().equalToValue(1);
        TestFluentConditionCollector(testItem, <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().equalToValue(1, {});
        TestFluentConditionCollector(testItem, <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 1
        });
    });
    test('With ValueHostName and secondValue assigned, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue, secondValue and valueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().equalToValue(1, null, 'Field2');
        TestFluentConditionCollector(testItem, <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Field2',
            secondValue: 1
        });
    });


    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('equalTo on conditions', () => {
    test('With secondValueHostName assigned, creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().equalTo('Field2');
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().equalTo('Field2', {});
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });    
    test('With valueHostName and secondValueHostName, creates ValidatorConfig with EqualToCondition with type=EqualTo, valueHostName and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().equalTo('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <EqualToConditionConfig>{
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('notEqualToValue on conditions', () => {
    test('With secondValue assigned, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notEqualToValue(1);
        TestFluentConditionCollector(testItem, <NotEqualToValueConditionConfig>{
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notEqualToValue(1, {});
        TestFluentConditionCollector(testItem, <NotEqualToValueConditionConfig>{
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notEqualToValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <NotEqualToValueConditionConfig>{
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToValueConditionConfig>{
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('notEqualTo on conditions', () => {
    test('With secondValueHostName assigned, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notEqualTo('Field2');
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notEqualTo('Field2', {});
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notEqualTo('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <NotEqualToConditionConfig>{
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('lessThanValue on conditions', () => {
    test('With secondValue assigned, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanValue(1);
        TestFluentConditionCollector(testItem, <LessThanValueConditionConfig>{
            conditionType: ConditionType.LessThanValue,
            secondValue: 1
        });
    });
    
    test('With valueHostName and secondValue assigned, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue, valueHostName and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanValueConditionConfig>{
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().ltValue(1);
        TestFluentConditionCollector(testItem, <LessThanValueConditionConfig>{
            conditionType: ConditionType.LessThanValue,
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanValueConditionConfig>{
            conditionType: ConditionType.LessThanValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThan on conditions', () => {
    test('With secondValueHostName assigned, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThan('Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'

        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThan('Field2', {});
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates ValidatorConfig with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThan('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lt" with secondValueHostName assigned, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lt('Field2');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lt" with valueHostName and secondValueHostName assigned, creates ValidatorConfig with LessThanCondition with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lt('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });


    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThan( 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('lessThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanOrEqualValue(1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanOrEqualValue(1, {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        });
    });    

    test('With valueHostName and secondValue assigned, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lteValue(1);
        TestFluentConditionCollector(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned and condDesc={}, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lteValue(1, {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        });
    });
    test('Shorthand version "lteValue" with valueHostName and secondValue assigned, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lteValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanOrEqual('Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanOrEqual('Field2', {});
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lte" with secondValueHostName assigned, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lte('Field2');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lte" with valueHostName and secondValueHostName assigned, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lte('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName, and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});


describe('greaterThanValue on conditions', () => {
    test('With secondValue assigned, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue, valueHostName, and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "gtValue" with secondValue assigned, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gtValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with secondValue assigned and condDesc={}, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gtValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with valueHostName and secondValue assigned, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue, valueHostName, and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gtValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('greaterThan on conditions', () => {
    test('With secondValueHostName assigned, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThan('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThan('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
   test('With valueHostName and secondValueHostName assigned, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThan('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gt('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned and condDesc={}, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gt('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with valueHostName and secondValueHostName assigned, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gt('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('greaterThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanOrEqualValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanOrEqualValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gteValue(1);
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned and condDesc={}, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gteValue(1, {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with valueHostName and secondValue assigned, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gteValue(1, null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('greaterThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanOrEqual('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanOrEqual('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName and secondValueHostName assigned, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName,  and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "gte" with secondValueHostName assigned, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gte('Field2');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with secondValueHostName assigned and condDesc={}, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gte('Field2', {});
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with valueHostName and secondValueHostName assigned, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().gte('Field2', null, 'Field1');
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionCollector(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('stringLength on conditions', () => {
    test('With maximum assigned, creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().stringLength(4);
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            conditionType: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With maximum assigned and condDesc={}, creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().stringLength(4, {});
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            conditionType: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With valueHostName and maximum assigned, creates ValidatorConfig with StringLengthCondition with type=StringLength, valueHostName, and maximum assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().stringLength(4, null, 'Field1');
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            conditionType: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4
        });
    });

    test('With minimum and maximum assigned, creates ValidatorConfig with StringLengthCondition with type=StringLength, minimum assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().stringLength(4, { minimum: 1 });
        TestFluentConditionCollector(testItem, <StringLengthConditionConfig>{
            conditionType: ConditionType.StringLength,
            maximum: 4,
            minimum: 1
        });
    });
});

describe('requireText on conditions', () => {
    test('With no parameters, creates ValidatorConfig with RequireTextCondition with type=RequireText', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().requireText();
        TestFluentConditionCollector(testItem, <RequireTextConditionConfig>{
            conditionType: ConditionType.RequireText
        });
    });

    test('With condDesc={}, creates ValidatorConfig with RequireTextCondition with type=RequireText', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().requireText({});
        TestFluentConditionCollector(testItem, <RequireTextConditionConfig>{
            conditionType: ConditionType.RequireText
        });
    });
    test('With valueHostName assigned, creates ValidatorConfig with RequireTextCondition with type=RequireText and valueHostName', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().requireText(null, 'Field1');
        TestFluentConditionCollector(testItem, <RequireTextConditionConfig>{
            conditionType: ConditionType.RequireText,
            valueHostName: 'Field1'
        });
    });

    test('With nullValueResult=NoMatch assigned, creates ValidatorConfig with RequireTextCondition with type=RequireText, nullValueResult=NoMatch assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().requireText({ nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionCollector(testItem, <RequireTextConditionConfig>{
            conditionType: ConditionType.RequireText,
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});
describe('notNull on conditions', () => {
    test('With no parameters, creates ValidatorConfig with NotNullCondition with type=NotNull assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notNull();
        TestFluentConditionCollector(testItem, <NotNullConditionConfig>{
            conditionType: ConditionType.NotNull
        });
    });
    test('With valueHostName assigned, creates ValidatorConfig with NotNullCondition with type=NotNull and valueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().notNull('Field1');
        TestFluentConditionCollector(testItem, <NotNullConditionConfig>{
            conditionType: ConditionType.NotNull,
            valueHostName: 'Field1'
        });
    });

});

describe('all on conditions', () => {
    test('With empty conditions, creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs=[]', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().all((children) => children);
        TestFluentConditionCollector(testItem, <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
           });
    });
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs populated with both conditions', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().all((children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionCollector(testItem, <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            });
    });
});
describe('any on conditions', () => {
    test('With empty conditions, creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs=[]', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().any((children) => children);
        TestFluentConditionCollector(testItem, <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            });
    });
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs populated with both conditions', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().any((children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionCollector(testItem, <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            });
    });
});

describe('countMatches on conditions', () => {
    test('With minimum and maximum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().countMatches(1, 2, (children) => children);
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: []
            });
    });
    test('With minimum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().countMatches(1, null, (children) => children);
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                conditionConfigs: []
            });
    });
    test('With maximum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().countMatches(null, 2, (children) => children);
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                maximum: 2,
                conditionConfigs: []
            });
    });    
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().countMatches(0, 2, (children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionCollector(testItem, <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 0,
                maximum: 2,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            });
    });
});

describe('positive on conditions', () => {
    test('With no parameters, creates ValidatorConfig with PositiveCondition with type=Positive assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().positive();
        TestFluentConditionCollector(testItem, <PositiveConditionConfig>{
            conditionType: ConditionType.Positive
        });
    });
    test('With valueHostName assigned, creates ValidatorConfig with PositiveCondition with type=Positive and valueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().positive('Field1');
        TestFluentConditionCollector(testItem, <PositiveConditionConfig>{
            conditionType: ConditionType.Positive,
            valueHostName: 'Field1'
        });
    });

});
describe('integer on conditions', () => {
    test('With no parameters, creates ValidatorConfig with IntegerCondition with type=Integer assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().integer();
        TestFluentConditionCollector(testItem, <IntegerConditionConfig>{
            conditionType: ConditionType.Integer
        });
    });
    test('With valueHostName assigned, creates ValidatorConfig with IntegerCondition with type=Integer and valueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().integer('Field1');
        TestFluentConditionCollector(testItem, <IntegerConditionConfig>{
            conditionType: ConditionType.Integer,
            valueHostName: 'Field1'
        });
    });

});
describe('maxDecimals on conditions', () => {
    test('With no parameters, creates ValidatorConfig with MaxDecimalsCondition with type=MaxDecimals assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().maxDecimals(2);
        TestFluentConditionCollector(testItem, <MaxDecimalsConditionConfig>{
            conditionType: ConditionType.MaxDecimals,
            maxDecimals: 2
        });
    });
    test('With valueHostName assigned, creates ValidatorConfig with MaxDecimalsCondition with type=MaxDecimals and valueHostName assigned', () => {
        let fluent = new ValidationManagerStartFluent(null)

        let testItem = fluent.conditions().maxDecimals(1, 'Field1');
        TestFluentConditionCollector(testItem, <MaxDecimalsConditionConfig>{
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Field1',
            maxDecimals: 1
        });
    });

});