import { MockValidationServices } from './../TestSupport/mocks';
import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { FluentConditionBuilder, ValidationManagerStartFluent } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import {
    AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, EqualToValueConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig, IntegerConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig, MaxDecimalsConditionConfig, NotEqualToConditionConfig, NotEqualToValueConditionConfig, NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig,
    RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig
} from '../../src/Conditions/ConcreteConditions';
import { NotConditionConfig } from '../../src/Conditions/NotCondition';
import { WhenConditionConfig } from '../../src/Conditions/WhenCondition';
import { ConditionConfig, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { ConditionWithChildrenBaseConfig } from '../../src/Conditions/ConditionWithChildrenBase';

function TestFluentConditionBuilder(testItem: FluentConditionBuilder,
    expectedCondConfig: ConditionConfig) {

    expect(testItem).toBeInstanceOf(FluentConditionBuilder);
    let typedTextItem = testItem as FluentConditionBuilder;
    let parentConfig = typedTextItem.parentConfig as ConditionWithChildrenBaseConfig;
    expect(parentConfig.conditionConfigs).not.toBeNull();
    expect(parentConfig.conditionConfigs!.length).toBe(1);
    let condConfig = parentConfig.conditionConfigs![0];
    expect(condConfig).toEqual(expectedCondConfig);
}

function createFluent(): ValidationManagerStartFluent {
    return new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
}
describe('conditionConfig', () => {
    test('With no parameters creates DataTypeCheckConditionConfig with only type assigned', () => {
        const conditionConfig: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            expression: /\d/i,
            valueHostName: null
        };
        let fluent = createFluent();
        let testItem = fluent.conditions().conditionConfig(conditionConfig);
        TestFluentConditionBuilder(testItem, conditionConfig);
    });
    test('With no parameters creates DataTypeCheckConditionConfig with only type assigned', () => {
        const conditionConfig: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 1
                },
                <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 2
                }
            ]
        };
        let fluent = createFluent();
        let testItem = fluent.conditions().conditionConfig(conditionConfig);
        TestFluentConditionBuilder(testItem, conditionConfig);
    });    
    test('With null parameter, throws error', () => {
        let fluent = createFluent();
        expect(() => fluent.conditions().conditionConfig(null!)).toThrow(/conditionConfig/);
    });
    test('With object missing conditionType property, throws error', () => {
        let fluent = createFluent();
        expect(() => fluent.conditions().conditionConfig({} as any)).toThrow(/conditionConfig.conditionType/);
    });    
});

describe('dataTypeCheck on conditions', () => {
    test('With no parameters creates DataTypeCheckConditionConfig with only type assigned', () => {
        let fluent = createFluent();
        let testItem = fluent.conditions().dataTypeCheck();
        TestFluentConditionBuilder(testItem, <DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck
        });
    });
});

describe('regExp on conditions', () => {
    test('With expression assigned to a string, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().regExp( '\\d');
        TestFluentConditionBuilder(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With expression assigned to a string and condDesc={}, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().regExp('\\d', null, {});
        TestFluentConditionBuilder(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d'
        });
    });
    test('With ValueHostName assigned and expression assigned to a string, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().regExp('\\d', null, null, 'Field2');
        TestFluentConditionBuilder(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            valueHostName: 'Field2'
        });
    });
    test('With expression assigned to a RegExp, creates RegExpConditionConfig with type=RegExp and expression assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().regExp(/\d/i);
        TestFluentConditionBuilder(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expression: /\d/i
        });
    });
    test('With expression and ignoreCase=true creates RegExpConditionConfig with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().regExp('\\d', true);
        TestFluentConditionBuilder(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: true
        });
    });
    test('With expression and ignoreCase=false creates RegExpConditionConfig with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().regExp('\\d', false);
        TestFluentConditionBuilder(testItem, <RegExpConditionConfig>{
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: false
        });
    });
});

describe('range on conditions', () => {
    test('With minimum and maximum assigned, creates RangeConditionConfig with type=Range, minimum and maximum assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().range(1, 4);
        TestFluentConditionBuilder(testItem, <RangeConditionConfig>{
            conditionType: ConditionType.Range,
            minimum: 1,
            maximum: 4
        });
    });
    test('With ValueHostName, minimum and maximum assigned, creates RangeConditionConfig with type=Range, minimum, maximum, and valueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().range(1, 4, 'Field2');
        TestFluentConditionBuilder(testItem, <RangeConditionConfig>{
            conditionType: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1,
            maximum: 4
        });
    });


    test('With minimum assigned and maximum=null, creates RangeConditionConfig with type=Range, minimum assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().range(1, null);
        TestFluentConditionBuilder(testItem, <RangeConditionConfig>{
            conditionType: ConditionType.Range,
            minimum: 1
        });
    });
    test('With maximum assigned and minimum=null, creates RangeConditionConfig with type=Range, maximum assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().range(null, 4);
        TestFluentConditionBuilder(testItem, <RangeConditionConfig>{
            conditionType: ConditionType.Range,
            maximum: 4
        });
    });

});

describe('equalToValue on conditions', () => {
    test('With secondValue assigned, creates EqualToValueConditionConfig with type=EqualToValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().equalToValue(1);
        TestFluentConditionBuilder(testItem, <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates EqualToValueConditionConfig with type=EqualToValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().equalToValue(1, {});
        TestFluentConditionBuilder(testItem, <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 1
        });
    });
    test('With ValueHostName and secondValue assigned, creates EqualToValueConditionConfig with type=EqualToValue, secondValue and valueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().equalToValue(1, null, 'Field2');
        TestFluentConditionBuilder(testItem, <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Field2',
            secondValue: 1
        });
    });


    test('With secondValue and secondConversionLookupKey assigned, creates EqualToValueConditionConfig with type=EqualToValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('equalTo on conditions', () => {
    test('With secondValueHostName assigned, creates EqualToConditionConfig with type=EqualTo and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().equalTo('Field2');
        TestFluentConditionBuilder(testItem, <EqualToConditionConfig>{
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates EqualToConditionConfig with type=EqualTo and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().equalTo('Field2', {});
        TestFluentConditionBuilder(testItem, <EqualToConditionConfig>{
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        });
    });    
    test('With valueHostName and secondValueHostName, creates EqualToConditionConfig with type=EqualTo, valueHostName and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().equalTo('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <EqualToConditionConfig>{
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates EqualToConditionConfig with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <EqualToConditionConfig>{
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('notEqualToValue on conditions', () => {
    test('With secondValue assigned, creates NotEqualToValueConditionConfig with type=NotEqualToValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notEqualToValue(1);
        TestFluentConditionBuilder(testItem, <NotEqualToValueConditionConfig>{
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates NotEqualToValueConditionConfig with type=NotEqualToValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notEqualToValue(1, {});
        TestFluentConditionBuilder(testItem, <NotEqualToValueConditionConfig>{
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates NotEqualToConditionConfig with type=NotEqualTo, valueHostName, and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notEqualToValue(1, null, 'Field1');
        TestFluentConditionBuilder(testItem, <NotEqualToValueConditionConfig>{
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates NotEqualToValueConditionConfig with type=NotEqualToValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <NotEqualToValueConditionConfig>{
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('notEqualTo on conditions', () => {
    test('With secondValueHostName assigned, creates NotEqualToConditionConfig with type=NotEqualTo and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notEqualTo('Field2');
        TestFluentConditionBuilder(testItem, <NotEqualToConditionConfig>{
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates NotEqualToConditionConfig with type=NotEqualTo and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notEqualTo('Field2', {});
        TestFluentConditionBuilder(testItem, <NotEqualToConditionConfig>{
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates NotEqualToConditionConfig with type=NotEqualTo, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notEqualTo('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <NotEqualToConditionConfig>{
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates NotEqualToConditionConfig with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <NotEqualToConditionConfig>{
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('lessThanValue on conditions', () => {
    test('With secondValue assigned, creates LessThanValueConditionConfig with type=LessThanValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanValue(1);
        TestFluentConditionBuilder(testItem, <LessThanValueConditionConfig>{
            conditionType: ConditionType.LessThanValue,
            secondValue: 1
        });
    });
    
    test('With valueHostName and secondValue assigned, creates LessThanValueConditionConfig with type=LessThanValue, valueHostName and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanValue(1, null, 'Field1');
        TestFluentConditionBuilder(testItem, <LessThanValueConditionConfig>{
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates LessThanValueConditionConfig with type=LessThanValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().ltValue(1);
        TestFluentConditionBuilder(testItem, <LessThanValueConditionConfig>{
            conditionType: ConditionType.LessThanValue,
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates LessThanValueConditionConfig with type=LessThanValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <LessThanValueConditionConfig>{
            conditionType: ConditionType.LessThanValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThan on conditions', () => {
    test('With secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThan('Field2');
        TestFluentConditionBuilder(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'

        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThan('Field2', {});
        TestFluentConditionBuilder(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThan('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lt" with secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lt('Field2');
        TestFluentConditionBuilder(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lt" with valueHostName and secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lt('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });


    test('With secondValueHostName and secondConversionLookupKey assigned, creates LessThanConditionConfig with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThan( 'Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <LessThanConditionConfig>{
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('lessThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanOrEqualValue(1);
        TestFluentConditionBuilder(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanOrEqualValue(1, {});
        TestFluentConditionBuilder(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        });
    });    

    test('With valueHostName and secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionBuilder(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lteValue(1);
        TestFluentConditionBuilder(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        });
    });

    test('Shorthand version "lteValue" with secondValue assigned and condDesc={}, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lteValue(1, {});
        TestFluentConditionBuilder(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        });
    });
    test('Shorthand version "lteValue" with valueHostName and secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lteValue(1, null, 'Field1');
        TestFluentConditionBuilder(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <LessThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('lessThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanOrEqual('Field2');
        TestFluentConditionBuilder(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanOrEqual('Field2', {});
        TestFluentConditionBuilder(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With valueHostName and secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "lte" with secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lte('Field2');
        TestFluentConditionBuilder(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "lte" with valueHostName and secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lte('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName, and secondConversionLookupKey assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <LessThanOrEqualConditionConfig>{
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});


describe('greaterThanValue on conditions', () => {
    test('With secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanValue(1);
        TestFluentConditionBuilder(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanValue(1, {});
        TestFluentConditionBuilder(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, valueHostName, and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanValue(1, null, 'Field1');
        TestFluentConditionBuilder(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('Shorthand version "gtValue" with secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gtValue(1);
        TestFluentConditionBuilder(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with secondValue assigned and condDesc={}, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gtValue(1, {});
        TestFluentConditionBuilder(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        });
    });
    test('Shorthand version "gtValue" with valueHostName and secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, valueHostName, and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gtValue(1, null, 'Field1');
        TestFluentConditionBuilder(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <GreaterThanValueConditionConfig>{
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('greaterThan on conditions', () => {
    test('With secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThan('Field2');
        TestFluentConditionBuilder(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThan('Field2', {});
        TestFluentConditionBuilder(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
   test('With valueHostName and secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThan('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gt('Field2');
        TestFluentConditionBuilder(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with secondValueHostName assigned and condDesc={}, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gt('Field2', {});
        TestFluentConditionBuilder(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gt" with valueHostName and secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gt('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates GreaterThanConditionConfig with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <GreaterThanConditionConfig>{
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        })
    });
});
describe('greaterThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanOrEqualValue(1);
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        });
    });
    test('With secondValue assigned and condDesc={}, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanOrEqualValue(1, {});
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        });
    });
    test('With valueHostName and secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanOrEqualValue(1, null, 'Field1');
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gteValue(1);
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with secondValue assigned and condDesc={}, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gteValue(1, {});
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        });
    });
    test('Shorthand version "gteValue" with valueHostName and secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gteValue(1, null, 'Field1');
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        });
    });

    test('With secondValue and secondConversionLookupKey assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualValueConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});
describe('greaterThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanOrEqual('Field2');
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('With secondValueHostName assigned and condDesc={}, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanOrEqual('Field2', {});
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });

    test('With valueHostName and secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName,  and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanOrEqual('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('Shorthand version "gte" with secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gte('Field2');
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with secondValueHostName assigned and condDesc={}, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gte('Field2', {});
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        });
    });
    test('Shorthand version "gte" with valueHostName and secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().gte('Field2', null, 'Field1');
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        });
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentConditionBuilder(testItem, <GreaterThanOrEqualConditionConfig>{
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
    });
});

describe('stringLength on conditions', () => {
    test('With maximum assigned, creates StringLengthConditionConfig with type=StringLength and maximum assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().stringLength(4);
        TestFluentConditionBuilder(testItem, <StringLengthConditionConfig>{
            conditionType: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With maximum assigned and condDesc={}, creates StringLengthConditionConfig with type=StringLength and maximum assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().stringLength(4, {});
        TestFluentConditionBuilder(testItem, <StringLengthConditionConfig>{
            conditionType: ConditionType.StringLength,
            maximum: 4
        });
    });
    test('With valueHostName and maximum assigned, creates StringLengthConditionConfig with type=StringLength, valueHostName, and maximum assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().stringLength(4, null, 'Field1');
        TestFluentConditionBuilder(testItem, <StringLengthConditionConfig>{
            conditionType: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4
        });
    });

    test('With minimum and maximum assigned, creates StringLengthConditionConfig with type=StringLength, minimum assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().stringLength(4, { minimum: 1 });
        TestFluentConditionBuilder(testItem, <StringLengthConditionConfig>{
            conditionType: ConditionType.StringLength,
            maximum: 4,
            minimum: 1
        });
    });
});

describe('requireText on conditions', () => {
    test('With no parameters, creates RequireTextConditionConfig with type=RequireText', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().requireText();
        TestFluentConditionBuilder(testItem, <RequireTextConditionConfig>{
            conditionType: ConditionType.RequireText
        });
    });

    test('With condDesc={}, creates RequireTextConditionConfig with type=RequireText', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().requireText({});
        TestFluentConditionBuilder(testItem, <RequireTextConditionConfig>{
            conditionType: ConditionType.RequireText
        });
    });
    test('With valueHostName assigned, creates RequireTextConditionConfig with type=RequireText and valueHostName', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().requireText(null, 'Field1');
        TestFluentConditionBuilder(testItem, <RequireTextConditionConfig>{
            conditionType: ConditionType.RequireText,
            valueHostName: 'Field1'
        });
    });

    test('With nullValueResult=NoMatch assigned, creates RequireTextConditionConfig with type=RequireText, nullValueResult=NoMatch assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().requireText({ nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentConditionBuilder(testItem, <RequireTextConditionConfig>{
            conditionType: ConditionType.RequireText,
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
    });
});
describe('notNull on conditions', () => {
    test('With no parameters, creates NotNullConditionConfig with type=NotNull assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notNull();
        TestFluentConditionBuilder(testItem, <NotNullConditionConfig>{
            conditionType: ConditionType.NotNull
        });
    });
    test('With valueHostName assigned, creates NotNullConditionConfig with type=NotNull and valueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().notNull('Field1');
        TestFluentConditionBuilder(testItem, <NotNullConditionConfig>{
            conditionType: ConditionType.NotNull,
            valueHostName: 'Field1'
        });
    });

});

describe('all on conditions', () => {
    test('With empty conditions, creates AllMatchConditionConfig with type=AllMatch and conditionConfigs=[]', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().all((children) => children);
        TestFluentConditionBuilder(testItem, <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
           });
    });
    test('With conditions setup with requireText and regExp, creates AllMatchConditionConfig with type=AllMatch and conditionConfigs populated with both conditions', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().all((children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionBuilder(testItem, <AllMatchConditionConfig>{
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
    test('With empty conditions, creates AnyMatchConditionConfig with type=AnyMatch and conditionConfigs=[]', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().any((children) => children);
        TestFluentConditionBuilder(testItem, <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            });
    });
    test('With conditions setup with requireText and regExp, creates AnyMatchConditionConfig with type=AnyMatch and conditionConfigs populated with both conditions', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().any((children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionBuilder(testItem, <AnyMatchConditionConfig>{
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
    test('With minimum and maximum assigned and empty conditions, creates CountMatchesMatchConditionConfig with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().countMatches(1, 2, (children) => children);
        TestFluentConditionBuilder(testItem, <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: []
            });
    });
    test('With minimum assigned and empty conditions, creates CountMatchesMatchConditionConfig with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().countMatches(1, null, (children) => children);
        TestFluentConditionBuilder(testItem, <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                conditionConfigs: []
            });
    });
    test('With maximum assigned and empty conditions, creates CountMatchesMatchConditionConfig with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().countMatches(null, 2, (children) => children);
        TestFluentConditionBuilder(testItem, <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                maximum: 2,
                conditionConfigs: []
            });
    });    
    test('With conditions setup with requireText and regExp, creates CountMatchesMatchConditionConfig with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().countMatches(0, 2, (children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentConditionBuilder(testItem, <CountMatchesConditionConfig>{
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
    test('With no parameters, creates PositiveConditionConfig with type=Positive assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().positive();
        TestFluentConditionBuilder(testItem, <PositiveConditionConfig>{
            conditionType: ConditionType.Positive
        });
    });
    test('With valueHostName assigned, creates PositiveConditionConfig with type=Positive and valueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().positive('Field1');
        TestFluentConditionBuilder(testItem, <PositiveConditionConfig>{
            conditionType: ConditionType.Positive,
            valueHostName: 'Field1'
        });
    });

});
describe('integer on conditions', () => {
    test('With no parameters, creates IntegerConditionConfig with type=Integer assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().integer();
        TestFluentConditionBuilder(testItem, <IntegerConditionConfig>{
            conditionType: ConditionType.Integer
        });
    });
    test('With valueHostName assigned, creates IntegerConditionConfig with type=Integer and valueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().integer('Field1');
        TestFluentConditionBuilder(testItem, <IntegerConditionConfig>{
            conditionType: ConditionType.Integer,
            valueHostName: 'Field1'
        });
    });

});
describe('maxDecimals on conditions', () => {
    test('With no parameters, creates MaxDecimalsConditionConfig with type=MaxDecimals assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().maxDecimals(2);
        TestFluentConditionBuilder(testItem, <MaxDecimalsConditionConfig>{
            conditionType: ConditionType.MaxDecimals,
            maxDecimals: 2
        });
    });
    test('With valueHostName assigned, creates MaxDecimalsConditionConfig with type=MaxDecimals and valueHostName assigned', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().maxDecimals(1, 'Field1');
        TestFluentConditionBuilder(testItem, <MaxDecimalsConditionConfig>{
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Field1',
            maxDecimals: 1
        });
    });

});

describe('not on conditions', () => {
    test('With empty condition, creates NotConditionConfig with type=Not and childConditionConfig={}', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().not((childBuilder) => childBuilder);
        TestFluentConditionBuilder(testItem, <NotConditionConfig>{
                conditionType: ConditionType.Not,
            childConditionConfig: {}
           });
    });
    test('With condition setup with requireText, creates NotConditionConfig with type=Not and conditionConfigs populatedn', () => {

        let testItem = createFluent().conditions()
            .not((childBuilder) => childBuilder.requireText(null, 'F1'));
            TestFluentConditionBuilder(testItem, <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
        });
    });    
    test('When there are 2 child conditions, throws', () => {
        expect(() => createFluent().conditions()
            .not((childBuilder) => childBuilder.requireText(null, 'F1').requireText(null, 'F2'))).toThrow();
    });    
    test('Null as the function parameter throws', () => {
        let fluent = createFluent();;
        expect(()=> fluent.conditions().not(null!)).toThrow(/childBuilder/);
    });
    test('Non-function as the function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.conditions().not({} as any)).toThrow(/Function expected/);
    });    
});


describe('when on conditions', () => {
    test('With empty enabler and child conditions, creates WhenConditionConfig with type=When, enablerConfig={} and childConditionConfig={}', () => {
        let fluent = createFluent();

        let testItem = fluent.conditions().when(
            (enablerBuilder) => enablerBuilder,
            (childBuilder) => childBuilder);
        TestFluentConditionBuilder(testItem, <WhenConditionConfig>{
            conditionType: ConditionType.When,
            enablerConfig: {},
            childConditionConfig: {}
           });
    });
    test('With child condition setup with requireText and enabler with regexp, creates WhenConditionConfig with type=When and conditionConfigs populated', () => {

        let testItem = createFluent().conditions()
            .when((enablerBuilder)=> enablerBuilder.regExp(/abc/, null, null, 'F2'),
                (childBuilder) => childBuilder.requireText(null, 'F1'));
            TestFluentConditionBuilder(testItem, <WhenConditionConfig>{
                conditionType: ConditionType.When,
                enablerConfig: <any>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/,
                    valueHostName: 'F2'
                },
                childConditionConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
        });
    });    
    test('When there are 2 child conditions, throws', () => {
        expect(() => createFluent().conditions()
            .when((enablerBuilder)=>enablerBuilder,
                (childBuilder) => childBuilder.requireText(null, 'F1').requireText(null, 'F2'))).toThrow();
    });    
    test('When there are 2 enabler conditions, throws', () => {
        expect(() => createFluent().conditions()
            .when((enablerBuilder)=>enablerBuilder.requireText(null, 'F1').requireText(null, 'F2'),
                (childBuilder) => childBuilder)).toThrow();
    });        
    test('Null as the child condition function parameter throws', () => {
        let fluent = createFluent();
        expect(()=> fluent.conditions().when((enablerBuilder)=>enablerBuilder, null!)).toThrow(/childBuilder/);
    });
    test('Null as the enabler condition function parameter throws', () => {
        let fluent = createFluent();
        expect(()=> fluent.conditions().when(null!, (childBuilder) => childBuilder)).toThrow(/enablerBuilder/);
    });    
    test('Non-function as the child function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.conditions().when((enablerBuilder) => enablerBuilder, {} as any)).toThrow(/Function expected/);
    });    
    test('Non-function as the enabler function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.conditions().when({} as any, (childBuilder) => childBuilder)).toThrow(/Function expected/);
    });        
});
