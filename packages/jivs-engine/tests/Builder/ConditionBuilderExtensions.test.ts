import { MockValidationServices } from '../TestSupport/mocks';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { FluentConditionBuilder, ValidationManagerStartFluent, IBuilderUsingConditions }
    from "../../src/Builder/Fluent";
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
import { StartConditionBuilder } from '../../src/Builder/ConditionBuilder_classes';
import { enableFluentConditions } from '../../src/Builder/ConditionBuilderExtensions';

class TestParentBuilder implements IBuilderUsingConditions {
    public childConfig: object | undefined;
    
    attachChildConfig(childConfig: object): void {
        this.childConfig = childConfig;
    }
    getConfig(): object | undefined {
        return this.childConfig;
    }
}


// function TestFluentConditionBuilder(testItem: FluentConditionBuilder,
//     expectedCondConfig: ConditionConfig) {

//     expect(testItem).toBeInstanceOf(FluentConditionBuilder);
//     let typedTextItem = testItem as FluentConditionBuilder;
//     let parentConfig = typedTextItem.parentConfig as ConditionWithChildrenBaseConfig;
//     expect(parentConfig.conditionConfigs).not.toBeNull();
//     expect(parentConfig.conditionConfigs!.length).toBe(1);
//     let condConfig = parentConfig.conditionConfigs![0];
//     expect(condConfig).toEqual(expectedCondConfig);
// }

// function createFluent(): ValidationManagerStartFluent {
//     return new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
// }

// create pre test code with this: enableFluentConditions()
beforeAll(() => {
    enableFluentConditions();
});
// describe('conditionConfig', () => {
//     test('With no parameters creates DataTypeCheckConditionConfig with only type assigned', () => {
//         const conditionConfig: RegExpConditionConfig = {
//             conditionType: ConditionType.RegExp,
//             expression: /\d/i,
//             valueHostName: null
//         };
//         let parentBuilder = new TestParentBuilder();
//         let starterBuilder = new StartConditionBuilder(parentBuilder);
//         starterBuilder.conditionConfig(conditionConfig);
//         TestFluentConditionBuilder(testItem, conditionConfig);
//     });
//     test('With no parameters creates DataTypeCheckConditionConfig with only type assigned', () => {
//         const conditionConfig: AllMatchConditionConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: [
//                 <EqualToValueConditionConfig>{
//                     conditionType: ConditionType.EqualToValue,
//                     secondValue: 1
//                 },
//                 <EqualToValueConditionConfig>{
//                     conditionType: ConditionType.EqualToValue,
//                     secondValue: 2
//                 }
//             ]
//         };
//         let parentBuilder = new TestParentBuilder();
//         starterBuilder.conditionConfig(conditionConfig);
//         TestFluentConditionBuilder(testItem, conditionConfig);
//     });    
//     test('With null parameter, throws error', () => {
//         let parentBuilder = new TestParentBuilder();
//         expect(() => fluent.conditions().conditionConfig(null!)).toThrow(/conditionConfig/);
//     });
//     test('With object missing conditionType property, throws error', () => {
//         let parentBuilder = new TestParentBuilder();
//         expect(() => fluent.conditions().conditionConfig({} as any)).toThrow(/conditionConfig.conditionType/);
//     });    
// });

describe('dataTypeCheck on conditions', () => {
    test('with fieldValue assigned, creates DataTypeCheckConditionConfig with type=DataTypeCheck and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.fieldValue('Field1').dataTypeCheck();
        let expectedCondConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('with parentValue() used, creates DataTypeCheckConditionConfig with type=DataTypeCheck and valueHostName unassigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().dataTypeCheck();
        let expectedCondConfig = {
            conditionType: ConditionType.DataTypeCheck
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});

describe('regExp on conditions', () => {
    test('With expression assigned to a string, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().regExp('\\d');
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With expression assigned to a string and condDesc={}, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').regExp('\\d', true, {});
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Field1',
            expressionAsString: '\\d',
            ignoreCase: true
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With ValueHostName assigned and expression assigned to a string, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field2').regExp('\\d');
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            valueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With expression assigned to a RegExp, creates RegExpConditionConfig with type=RegExp and expression assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().regExp(/\d/i);
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expression: /\d/i
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With expression and ignoreCase=true creates RegExpConditionConfig with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {
        let parentBuilder = new TestParentBuilder();

        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().regExp('\\d', true);
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: true
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With expression and ignoreCase=false creates RegExpConditionConfig with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().regExp('\\d', false);
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: false
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});

describe('range on conditions', () => {
    test('With minimum and maximum assigned, creates RangeConditionConfig with type=Range, minimum and maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().range(1, 4);
        let expectedCondConfig = {
            conditionType: ConditionType.Range,
            minimum: 1,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With ValueHostName, minimum and maximum assigned, creates RangeConditionConfig with type=Range, minimum, maximum, and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field2').range(1, 4);
        let expectedCondConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });


    test('With minimum assigned and maximum=null, creates RangeConditionConfig with type=Range, minimum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().range(1, null);
        let expectedCondConfig = {
            conditionType: ConditionType.Range,
            minimum: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With maximum assigned and minimum=null, creates RangeConditionConfig with type=Range, maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().range(null, 4);
        let expectedCondConfig = {
            conditionType: ConditionType.Range,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

});

describe('equalToValue on conditions', () => {
    test('With secondValue assigned, creates EqualToValueConditionConfig with type=EqualToValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().equalToValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.EqualToValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValue assigned and condDesc={}, creates EqualToValueConditionConfig with type=EqualToValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().equalToValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.EqualToValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With ValueHostName and secondValue assigned, creates EqualToValueConditionConfig with type=EqualToValue, secondValue and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field2').equalToValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Field2',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });


    test('With secondValue and secondConversionLookupKey assigned, creates EqualToValueConditionConfig with type=EqualToValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().equalToValue(1,
            {
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            });
        let expectedCondConfig = {
            conditionType: ConditionType.EqualToValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});
describe('equalTo on conditions', () => {
    test('With secondValueHostName assigned, creates EqualToConditionConfig with type=EqualTo and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().equalTo('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValueHostName assigned and condDesc={}, creates EqualToConditionConfig with type=EqualTo and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().equalTo('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });    
    test('With valueHostName and secondValueHostName, creates EqualToConditionConfig with type=EqualTo, valueHostName and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').equalTo('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates EqualToConditionConfig with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().equalTo('Field2',
            {
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer 
            }
        );
        let expectedCondConfig = {
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});

describe('notEqualToValue on conditions', () => {
    test('With secondValue assigned, creates NotEqualToValueConditionConfig with type=NotEqualToValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().notEqualToValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValue assigned and condDesc={}, creates NotEqualToValueConditionConfig with type=NotEqualToValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().notEqualToValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName and secondValue assigned, creates NotEqualToConditionConfig with type=NotEqualTo, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').notEqualToValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValue and secondConversionLookupKey assigned, creates NotEqualToValueConditionConfig with type=NotEqualToValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().notEqualToValue(1, {
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});
describe('notEqualTo on conditions', () => {
    test('With secondValueHostName assigned, creates NotEqualToConditionConfig with type=NotEqualTo and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().notEqualTo('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValueHostName assigned and condDesc={}, creates NotEqualToConditionConfig with type=NotEqualTo and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().notEqualTo('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName and secondValueHostName assigned, creates NotEqualToConditionConfig with type=NotEqualTo, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').notEqualTo('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates NotEqualToConditionConfig with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().notEqualTo('Field2', {
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);       
    });
});

describe('lessThanValue on conditions', () => {
    test('With secondValue assigned, creates LessThanValueConditionConfig with type=LessThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().lessThanValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    
    test('With valueHostName and secondValue assigned, creates LessThanValueConditionConfig with type=LessThanValue, valueHostName and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').lessThanValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "ltValue" With secondValue, creates LessThanValueConditionConfig with type=LessThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().ltValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValue and secondConversionLookupKey assigned, creates LessThanValueConditionConfig with type=LessThanValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThanValue(1, {
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});
describe('lessThan on conditions', () => {
    test('With secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThan('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValueHostName assigned and condDesc={}, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThan('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName and secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').lessThan('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('Shorthand version "lt" with secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lt('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "lt" with valueHostName and secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').lt('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });


    test('With secondValueHostName and secondConversionLookupKey assigned, creates LessThanConditionConfig with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThan('Field2', {
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);   
    });
});
describe('lessThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().lessThanOrEqualValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValue assigned and condDesc={}, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThanOrEqualValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });    

    test('With valueHostName and secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').lessThanOrEqualValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('Shorthand version "lteValue" with secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lteValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('Shorthand version "lteValue" with secondValue assigned and condDesc={}, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lteValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "lteValue" with valueHostName and secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').lteValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValue and secondConversionLookupKey assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThanOrEqualValue(1, {
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});
describe('lessThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThanOrEqual('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValueHostName assigned and condDesc={}, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThanOrEqual('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName and secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').lessThanOrEqual('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('Shorthand version "lte" with secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lte('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "lte" with valueHostName and secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').lte('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValueHostName, and secondConversionLookupKey assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().lessThanOrEqual('Field2',
            {
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            });
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});


describe('greaterThanValue on conditions', () => {
    test('With secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThanValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValue assigned and condDesc={}, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThanValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName and secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').greaterThanValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('Shorthand version "gtValue" with secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().gtValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gtValue" with secondValue assigned and condDesc={}, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().gtValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gtValue" with valueHostName and secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').gtValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValue and secondConversionLookupKey assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThanValue(1,
            {
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            });
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});

describe('greaterThan on conditions', () => {
    test('With secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThan('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValueHostName assigned and condDesc={}, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThan('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
   test('With valueHostName and secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').greaterThan('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gt" with secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().gt('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gt" with secondValueHostName assigned and condDesc={}, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().gt('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gt" with valueHostName and secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').gt('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates GreaterThanConditionConfig with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThan('Field2', {
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});
describe('greaterThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().greaterThanOrEqualValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValue assigned and condDesc={}, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThanOrEqualValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName and secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').greaterThanOrEqualValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gteValue" with secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().gteValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gteValue" with secondValue assigned and condDesc={}, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().gteValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gteValue" with valueHostName and secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').gteValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValue and secondConversionLookupKey assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThanOrEqualValue(1, {
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
        let expectedCondConfig = {  
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1,
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});
describe('greaterThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().greaterThanOrEqual('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With secondValueHostName assigned and condDesc={}, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThanOrEqual('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With valueHostName and secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName,  and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').greaterThanOrEqual('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('Shorthand version "gte" with secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().gte('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gte" with secondValueHostName assigned and condDesc={}, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().gte('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('Shorthand version "gte" with valueHostName and secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').gte('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().greaterThanOrEqual('Field2', {
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        });
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2',
            conversionLookupKey: LookupKey.Integer,
            secondConversionLookupKey: LookupKey.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});

describe('stringLength on conditions', () => {
    test('With maximum assigned, creates StringLengthConditionConfig with type=StringLength and maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().stringLength(4);
        let expectedCondConfig = {
            conditionType: ConditionType.StringLength,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With maximum assigned and condDesc={}, creates StringLengthConditionConfig with type=StringLength and maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().stringLength(4, {});
        let expectedCondConfig = {
            conditionType: ConditionType.StringLength,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName and maximum assigned, creates StringLengthConditionConfig with type=StringLength, valueHostName, and maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').stringLength(4);
        let expectedCondConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With minimum and maximum assigned, creates StringLengthConditionConfig with type=StringLength, minimum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().stringLength(4, { minimum: 1 });
        let expectedCondConfig = {
            conditionType: ConditionType.StringLength,
            maximum: 4,
            minimum: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});

describe('requireText on conditions', () => {
    test('With no parameters, creates RequireTextConditionConfig with type=RequireText', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().requireText();
        let expectedCondConfig = {
            conditionType: ConditionType.RequireText
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With condDesc={}, creates RequireTextConditionConfig with type=RequireText', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().requireText({});
        let expectedCondConfig = {
            conditionType: ConditionType.RequireText
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName assigned, creates RequireTextConditionConfig with type=RequireText and valueHostName', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').requireText();
        let expectedCondConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

    test('With nullValueResult=NoMatch assigned, creates RequireTextConditionConfig with type=RequireText, nullValueResult=NoMatch assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().requireText({
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
        let expectedCondConfig = {
            conditionType: ConditionType.RequireText,
            nullValueResult: ConditionEvaluateResult.NoMatch
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
});
describe('notNull on conditions', () => {
    test('With no parameters, creates NotNullConditionConfig with type=NotNull assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().notNull();
        let expectedCondConfig = {
            conditionType: ConditionType.NotNull
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName assigned, creates NotNullConditionConfig with type=NotNull and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').notNull();
        let expectedCondConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

});

describe('positive on conditions', () => {
    test('With no parameters, creates PositiveConditionConfig with type=Positive assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);
        starterBuilder.parentValue().positive();
        let expectedCondConfig = {
            conditionType: ConditionType.Positive
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName assigned, creates PositiveConditionConfig with type=Positive and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').positive();
        let expectedCondConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

});
describe('integer on conditions', () => {
    test('With no parameters, creates IntegerConditionConfig with type=Integer assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().integer();
        let expectedCondConfig = {
            conditionType: ConditionType.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName assigned, creates IntegerConditionConfig with type=Integer and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').integer();
        let expectedCondConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

});
describe('maxDecimals on conditions', () => {
    test('With no parameters, creates MaxDecimalsConditionConfig with type=MaxDecimals assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.parentValue().maxDecimals(2);
        let expectedCondConfig = {
            conditionType: ConditionType.MaxDecimals,
            maxDecimals: 2
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });
    test('With valueHostName assigned, creates MaxDecimalsConditionConfig with type=MaxDecimals and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(parentBuilder);

        starterBuilder.fieldValue('Field1').maxDecimals(1);
        let expectedCondConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Field1',
            maxDecimals: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        let parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedCondConfig);
    });

});


// describe('all on conditions', () => {
//     test('With empty conditions, creates AllMatchConditionConfig with type=AllMatch and conditionConfigs=[]', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().all(
//             (children) => []);
//         TestFluentConditionBuilder(testItem, <AllMatchConditionConfig>{
//                 conditionType: ConditionType.All,
//                 conditionConfigs: []
//            });
//     });
//     test('With conditions setup with requireText and regExp, creates AllMatchConditionConfig with type=AllMatch and conditionConfigs populated with both conditions', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().all(
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ]);
//         TestFluentConditionBuilder(testItem, <AllMatchConditionConfig>{
//                 conditionType: ConditionType.All,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             });
//     });
// });
// describe('any on conditions', () => {
//     test('With empty conditions, creates AnyMatchConditionConfig with type=AnyMatch and conditionConfigs=[]', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().any(
//             (children) => []);
//         TestFluentConditionBuilder(testItem, <AnyMatchConditionConfig>{
//                 conditionType: ConditionType.Any,
//                 conditionConfigs: []
//             });
//     });
//     test('With conditions setup with requireText and regExp, creates AnyMatchConditionConfig with type=AnyMatch and conditionConfigs populated with both conditions', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().any(
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ]);
//         TestFluentConditionBuilder(testItem, <AnyMatchConditionConfig>{
//                 conditionType: ConditionType.Any,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             });
//     });
// });

// describe('countMatches on conditions', () => {
//     test('With minimum and maximum assigned and empty conditions, creates CountMatchesMatchConditionConfig with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().countMatches(1, 2,
//             (children) => []);
//         TestFluentConditionBuilder(testItem, <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 minimum: 1,
//                 maximum: 2,
//                 conditionConfigs: []
//             });
//     });
//     test('With minimum assigned and empty conditions, creates CountMatchesMatchConditionConfig with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().countMatches(1, null,
//             (children) => []);
//         TestFluentConditionBuilder(testItem, <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 minimum: 1,
//                 conditionConfigs: []
//             });
//     });
//     test('With maximum assigned and empty conditions, creates CountMatchesMatchConditionConfig with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().countMatches(null, 2,
//             (children) => []);
//         TestFluentConditionBuilder(testItem, <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 maximum: 2,
//                 conditionConfigs: []
//             });
//     });    
//     test('With conditions setup with requireText and regExp, creates CountMatchesMatchConditionConfig with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().countMatches(0, 2,
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ]);
//         TestFluentConditionBuilder(testItem, <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 minimum: 0,
//                 maximum: 2,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             });
//     });
// });

// describe('not on conditions', () => {
//     test('With empty condition, creates NotConditionConfig with type=Not and childConditionConfig={}', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().not((childBuilder) => new FluentConditionBuilder(null));
//         TestFluentConditionBuilder(testItem, <NotConditionConfig>{
//                 conditionType: ConditionType.Not,
//             childConditionConfig: {}
//            });
//     });
//     test('With condition setup with requireText, creates NotConditionConfig with type=Not and conditionConfigs populatedn', () => {

//         let testItem = createFluent().conditions().parentValue()
//             .not((childBuilder) => childBuilder.fieldValue('F1').requireText());
//             TestFluentConditionBuilder(testItem, <NotConditionConfig>{
//                 conditionType: ConditionType.Not,
//                 childConditionConfig: <any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 }
//         });
//     });    
//     test('When there are 2 child conditions, throws', () => {
//         expect(() => createFluent().conditions().parentValue()
//             .not((childBuilder) => childBuilder.fieldValue('F1')
//                 .requireText()
//                 .requireText())).toThrow();
//     });    
//     test('Null as the function parameter throws', () => {
//         let parentBuilder = new TestParentBuilder();;
//         expect(()=> fluent.conditions().parentValue().not(null!)).toThrow(/childBuilder/);
//     });
//     test('Non-function as the function parameter throws', () => {
//         let parentBuilder = new TestParentBuilder();
//         expect(() => fluent.conditions().parentValue().not({} as any)).toThrow(/Function expected/);
//     });    
// });


// describe('when on conditions', () => {
//     test('With empty enabler and child conditions, creates WhenConditionConfig with type=When, whenToEnableConfig={} and thenConfig={}', () => {
//         let parentBuilder = new TestParentBuilder();

//         starterBuilder.parentValue().when(
//             (whenBuilder) => new FluentConditionBuilder(null),
//             (thenBuilder) => new FluentConditionBuilder(null));
//         TestFluentConditionBuilder(testItem, <WhenConditionConfig>{
//             conditionType: ConditionType.When,
//             whenToEnableConfig: {},
//             thenConfig: {}
//            });
//     });
//     test('With child condition setup with requireText and enabler with regexp, creates WhenConditionConfig with type=When and conditionConfigs populated', () => {

//         let testItem = createFluent().conditions().parentValue()
//             .when((whenBuilder)=> whenBuilder.fieldValue('F2').regExp(/abc/),
//                 (thenBuilder) => thenBuilder.parentValue().requireText(null, 'F1'));
//             TestFluentConditionBuilder(testItem, <WhenConditionConfig>{
//                 conditionType: ConditionType.When,
//                 whenToEnableConfig: <any>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /abc/,
//                     valueHostName: 'F2'
//                 },
//                 thenConfig: <any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 }
//         });
//     });    
//     test('When there are 2 child conditions, throws', () => {
//         expect(() => createFluent().conditions().parentValue()
//             .when((whenBuilder)=>new FluentConditionBuilder(null),
//                 (thenBuilder) => thenBuilder.fieldValue('F1')
//                     .requireText()
//                     .requireText())).toThrow();
//     });    
//     test('When there are 2 enabler conditions, throws', () => {
//         expect(() => createFluent().conditions().parentValue()
//             .when((whenBuilder) => whenBuilder.fieldValue('F1')
//                 .requireText()
//                 .requireText(),
//                 (thenBuilder) => new FluentConditionBuilder(null))).toThrow();
//     });        
//     test('Null as the thenCondition function parameter throws', () => {
//         let parentBuilder = new TestParentBuilder();
//         expect(() => fluent.conditions().parentValue().when(
//             (whenBuilder) => new FluentConditionBuilder(null), null!)).toThrow(/thenBuilder/);
//     });
//     test('Null as the enabler condition function parameter throws', () => {
//         let parentBuilder = new TestParentBuilder();
//         expect(() => fluent.conditions().parentValue().when(null!,
//             (thenBuilder) => new FluentConditionBuilder(null))).toThrow(/whenBuilder/);
//     });    
//     test('Non-function as the child function parameter throws', () => {
//         let parentBuilder = new TestParentBuilder();
//         expect(() => fluent.conditions().parentValue().when(
//             (whenBuilder) => new FluentConditionBuilder(null), {} as any)).toThrow(/Function expected/);
//     });    
//     test('Non-function as the enabler function parameter throws', () => {
//         let parentBuilder = new TestParentBuilder();
//         expect(() => fluent.conditions().parentValue().when({} as any,
//             (thenBuilder) => new FluentConditionBuilder(null))).toThrow(/Function expected/);
//     });        
// });
