import { ValidationManagerStartFluent } from './../../src/Builder/StartFluent_classes';
import { StartConditionBuilder } from '../../src/Builder/ConditionBuilder_classes';
import { CompleteConfigBuilderHandler, IBuilderConfigHost } from "../../src/Builder/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { MockValidationServices } from '../TestSupport/mocks';
import { FieldValueHostConfig } from '../../src/Interfaces/FieldValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { WhenConditionConfig } from '../../src/Conditions/WhenCondition';

class TestParentBuilder implements IBuilderConfigHost<object> {
    constructor() {
        this.completed = (config: object, source: IBuilderConfigHost<object>) => {
            this.completedConfig = config;
        };
    }
    public childConfig: object | undefined;
    public completedConfig?: object | undefined;

    setConfig(childConfig: object): void {
        this.childConfig = childConfig;
    }
    getConfig(): object | undefined {
        return this.childConfig;
    }

    completed?: CompleteConfigBuilderHandler<object>;
}

let services: MockValidationServices;

beforeAll(() => {
    services = new MockValidationServices(true, false);
});


describe('dataTypeCheck on conditions', () => {
    test('with fieldValue assigned, creates DataTypeCheckConditionConfig with type=DataTypeCheck and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.fieldValue('Field1').dataTypeCheck();
        let expectedCondConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('with parentValue() used, creates DataTypeCheckConditionConfig with type=DataTypeCheck and valueHostName unassigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().dataTypeCheck();
        let expectedCondConfig = {
            conditionType: ConditionType.DataTypeCheck
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    // checking from the validator starting point, using when with this condition type in the thenBuilder
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().dataTypeCheck()
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.DataTypeCheck
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });
});

describe('regExp on conditions', () => {
    test('With expression assigned to a string, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().regExp('\\d');
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With expression assigned to a string and condDesc={}, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').regExp('\\d', true, {});
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Field1',
            expressionAsString: '\\d',
            ignoreCase: true
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With ValueHostName assigned and expression assigned to a string, creates RegExpConditionConfig with type=RegExp and expressionAsString assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field2').regExp('\\d');
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            valueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With expression assigned to a RegExp, creates RegExpConditionConfig with type=RegExp and expression assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().regExp(/\d/i);
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expression: /\d/i
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With expression and ignoreCase=true creates RegExpConditionConfig with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {
        let parentBuilder = new TestParentBuilder();

        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().regExp('\\d', true);
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: true
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With expression and ignoreCase=false creates RegExpConditionConfig with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().regExp('\\d', false);
        let expectedCondConfig = {
            conditionType: ConditionType.RegExp,
            expressionAsString: '\\d',
            ignoreCase: false
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().regExp('\\d', true)
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.RegExp,
                            expressionAsString: '\\d',
                            ignoreCase: true
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});

describe('range on conditions', () => {
    test('With minimum and maximum assigned, creates RangeConditionConfig with type=Range, minimum and maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().range(1, 4);
        let expectedCondConfig = {
            conditionType: ConditionType.Range,
            minimum: 1,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With ValueHostName, minimum and maximum assigned, creates RangeConditionConfig with type=Range, minimum, maximum, and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field2').range(1, 4);
        let expectedCondConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Field2',
            minimum: 1,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });


    test('With minimum assigned and maximum=null, creates RangeConditionConfig with type=Range, minimum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().range(1, null);
        let expectedCondConfig = {
            conditionType: ConditionType.Range,
            minimum: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With maximum assigned and minimum=null, creates RangeConditionConfig with type=Range, maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().range(null, 4);
        let expectedCondConfig = {
            conditionType: ConditionType.Range,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().range(1, 4)
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.Range,
                            minimum: 1,
                            maximum: 4
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });
});

describe('equalToValue on conditions', () => {
    test('With secondValue assigned, creates EqualToValueConditionConfig with type=EqualToValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().equalToValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.EqualToValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValue assigned and condDesc={}, creates EqualToValueConditionConfig with type=EqualToValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().equalToValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.EqualToValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With ValueHostName and secondValue assigned, creates EqualToValueConditionConfig with type=EqualToValue, secondValue and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field2').equalToValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.EqualToValue,
            valueHostName: 'Field2',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });


    test('With secondValue and secondConversionLookupKey assigned, creates EqualToValueConditionConfig with type=EqualToValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().equalToValue(3)
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 3
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});
describe('equalTo on conditions', () => {
    test('With secondValueHostName assigned, creates EqualToConditionConfig with type=EqualTo and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().equalTo('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValueHostName assigned and condDesc={}, creates EqualToConditionConfig with type=EqualTo and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().equalTo('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.EqualTo,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and secondValueHostName, creates EqualToConditionConfig with type=EqualTo, valueHostName and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').equalTo('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates EqualToConditionConfig with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().equalTo('F3')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.EqualTo,
                            secondValueHostName: 'F3'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});

describe('notEqualToValue on conditions', () => {
    test('With secondValue assigned, creates NotEqualToValueConditionConfig with type=NotEqualToValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().notEqualToValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValue assigned and condDesc={}, creates NotEqualToValueConditionConfig with type=NotEqualToValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().notEqualToValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualToValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and secondValue assigned, creates NotEqualToConditionConfig with type=NotEqualTo, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').notEqualToValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualToValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValue and secondConversionLookupKey assigned, creates NotEqualToValueConditionConfig with type=NotEqualToValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().notEqualToValue(1)
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.NotEqualToValue,
                            secondValue: 1
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});
describe('notEqualTo on conditions', () => {
    test('With secondValueHostName assigned, creates NotEqualToConditionConfig with type=NotEqualTo and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().notEqualTo('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValueHostName assigned and condDesc={}, creates NotEqualToConditionConfig with type=NotEqualTo and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().notEqualTo('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualTo,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and secondValueHostName assigned, creates NotEqualToConditionConfig with type=NotEqualTo, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').notEqualTo('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates NotEqualToConditionConfig with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().notEqualTo('F3')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.NotEqualTo,
                            secondValueHostName: 'F3'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});

describe('lessThanValue on conditions', () => {
    test('With secondValue assigned, creates LessThanValueConditionConfig with type=LessThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().lessThanValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With valueHostName and secondValue assigned, creates LessThanValueConditionConfig with type=LessThanValue, valueHostName and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').lessThanValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "ltValue" With secondValue, creates LessThanValueConditionConfig with type=LessThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().ltValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValue and secondConversionLookupKey assigned, creates LessThanValueConditionConfig with type=LessThanValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().lessThanValue('A')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.LessThanValue,
                            secondValue: 'A'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});
describe('lessThan on conditions', () => {
    test('With secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lessThan('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValueHostName assigned and condDesc={}, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lessThan('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').lessThan('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Shorthand version "lt" with secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lt('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "lt" with valueHostName and secondValueHostName assigned, creates LessThanConditionConfig with type=LessThan, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').lt('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });


    test('With secondValueHostName and secondConversionLookupKey assigned, creates LessThanConditionConfig with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().lessThan('F3')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.LessThan,
                            secondValueHostName: 'F3'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});
describe('lessThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().lessThanOrEqualValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValue assigned and condDesc={}, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lessThanOrEqualValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With valueHostName and secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').lessThanOrEqualValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Shorthand version "lteValue" with secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lteValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Shorthand version "lteValue" with secondValue assigned and condDesc={}, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lteValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "lteValue" with valueHostName and secondValue assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').lteValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValue and secondConversionLookupKey assigned, creates LessThanOrEqualValueConditionConfig with type=LessThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().lessThanOrEqualValue('B')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.LessThanOrEqualValue,
                            secondValue: 'B'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});
describe('lessThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lessThanOrEqual('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValueHostName assigned and condDesc={}, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lessThanOrEqual('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').lessThanOrEqual('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Shorthand version "lte" with secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().lte('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "lte" with valueHostName and secondValueHostName assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').lte('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.LessThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValueHostName, and secondConversionLookupKey assigned, creates LessThanOrEqualConditionConfig with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().lessThanOrEqual('F3')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.LessThanOrEqual,
                            secondValueHostName: 'F3'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});


describe('greaterThanValue on conditions', () => {
    test('With secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().greaterThanValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValue assigned and condDesc={}, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().greaterThanValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').greaterThanValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Shorthand version "gtValue" with secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().gtValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gtValue" with secondValue assigned and condDesc={}, creates GreaterThanValueConditionConfig with type=GreaterThanValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().gtValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gtValue" with valueHostName and secondValue assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').gtValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValue and secondConversionLookupKey assigned, creates GreaterThanValueConditionConfig with type=GreaterThanValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().greaterThanValue('C')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.GreaterThanValue,
                            secondValue: 'C'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});

describe('greaterThan on conditions', () => {
    test('With secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().greaterThan('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValueHostName assigned and condDesc={}, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().greaterThan('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').greaterThan('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gt" with secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().gt('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gt" with secondValueHostName assigned and condDesc={}, creates GreaterThanConditionConfig with type=GreaterThan and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().gt('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gt" with valueHostName and secondValueHostName assigned, creates GreaterThanConditionConfig with type=GreaterThan, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').gt('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates GreaterThanConditionConfig with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().greaterThan('F3')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.GreaterThan,
                            secondValueHostName: 'F3'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});
describe('greaterThanOrEqualValue on conditions', () => {
    test('With secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().greaterThanOrEqualValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValue assigned and condDesc={}, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().greaterThanOrEqualValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').greaterThanOrEqualValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gteValue" with secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().gteValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gteValue" with secondValue assigned and condDesc={}, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().gteValue(1, {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gteValue" with valueHostName and secondValue assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, valueHostName, and secondValue assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').gteValue(1);
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqualValue,
            valueHostName: 'Field1',
            secondValue: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValue and secondConversionLookupKey assigned, creates GreaterThanOrEqualValueConditionConfig with type=GreaterThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().greaterThanOrEqualValue('D')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.GreaterThanOrEqualValue,
                            secondValue: 'D'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});
describe('greaterThanOrEqual on conditions', () => {
    test('With secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().greaterThanOrEqual('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With secondValueHostName assigned and condDesc={}, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().greaterThanOrEqual('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With valueHostName and secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName,  and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').greaterThanOrEqual('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Shorthand version "gte" with secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().gte('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gte" with secondValueHostName assigned and condDesc={}, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().gte('Field2', {});
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('Shorthand version "gte" with valueHostName and secondValueHostName assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, valueHostName, and secondValueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').gte('Field2');
        let expectedCondConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Field1',
            secondValueHostName: 'Field2'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With secondValueHostName and secondConversionLookupKey assigned, creates GreaterThanOrEqualConditionConfig with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

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
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().greaterThanOrEqual('F3')
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.GreaterThanOrEqual,
                            secondValueHostName: 'F3'
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});

describe('stringLength on conditions', () => {
    test('With maximum assigned, creates StringLengthConditionConfig with type=StringLength and maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().stringLength(4);
        let expectedCondConfig = {
            conditionType: ConditionType.StringLength,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With maximum assigned and condDesc={}, creates StringLengthConditionConfig with type=StringLength and maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().stringLength(4, {});
        let expectedCondConfig = {
            conditionType: ConditionType.StringLength,
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName and maximum assigned, creates StringLengthConditionConfig with type=StringLength, valueHostName, and maximum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').stringLength(4);
        let expectedCondConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Field1',
            maximum: 4
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With minimum and maximum assigned, creates StringLengthConditionConfig with type=StringLength, minimum assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().stringLength(4, { minimum: 1 });
        let expectedCondConfig = {
            conditionType: ConditionType.StringLength,
            maximum: 4,
            minimum: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().stringLength(4)
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.StringLength,
                            maximum: 4
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});

describe('requireText on conditions', () => {
    test('With no parameters, creates RequireTextConditionConfig with type=RequireText', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().requireText();
        let expectedCondConfig = {
            conditionType: ConditionType.RequireText
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With condDesc={}, creates RequireTextConditionConfig with type=RequireText', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().requireText({});
        let expectedCondConfig = {
            conditionType: ConditionType.RequireText
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName assigned, creates RequireTextConditionConfig with type=RequireText and valueHostName', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').requireText();
        let expectedCondConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With nullValueResult=NoMatch assigned, creates RequireTextConditionConfig with type=RequireText, nullValueResult=NoMatch assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().requireText({
            nullValueResult: ConditionEvaluateResult.NoMatch
        });
        let expectedCondConfig = {
            conditionType: ConditionType.RequireText,
            nullValueResult: ConditionEvaluateResult.NoMatch
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().requireText()
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.RequireText
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });    
});
describe('notNull on conditions', () => {
    test('With no parameters, creates NotNullConditionConfig with type=NotNull assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().notNull();
        let expectedCondConfig = {
            conditionType: ConditionType.NotNull
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName assigned, creates NotNullConditionConfig with type=NotNull and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').notNull();
        let expectedCondConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().notNull()
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.NotNull
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });
});

describe('positive on conditions', () => {
    test('With no parameters, creates PositiveConditionConfig with type=Positive assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().positive();
        let expectedCondConfig = {
            conditionType: ConditionType.Positive
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName assigned, creates PositiveConditionConfig with type=Positive and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').positive();
        let expectedCondConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().positive()
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.Positive
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });
});
describe('integer on conditions', () => {
    test('With no parameters, creates IntegerConditionConfig with type=Integer assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().integer();
        let expectedCondConfig = {
            conditionType: ConditionType.Integer
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName assigned, creates IntegerConditionConfig with type=Integer and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').integer();
        let expectedCondConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Field1'
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().integer()
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.Integer
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });
});
describe('maxDecimals on conditions', () => {
    test('With no parameters, creates MaxDecimalsConditionConfig with type=MaxDecimals assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.parentValue().maxDecimals(2);
        let expectedCondConfig = {
            conditionType: ConditionType.MaxDecimals,
            maxDecimals: 2
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With valueHostName assigned, creates MaxDecimalsConditionConfig with type=MaxDecimals and valueHostName assigned', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('Field1').maxDecimals(1);
        let expectedCondConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Field1',
            maxDecimals: 1
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('using when with this condition type in the thenBuilder', () => {
        let startFluent = new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
        let fieldFluent =  startFluent.field('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F2').equalToValue(1),
            (thenBuilder) => thenBuilder.parentValue().maxDecimals(2)
        );

        let expectedConfig = <FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: 'myField',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualToValue,
                            secondValue: 1,
                            valueHostName: 'F2'
                        },
                        thenConfig: {
                            conditionType: ConditionType.MaxDecimals,
                            maxDecimals: 2
                        }
                    }
                }
            ]
        };
        expect(fieldFluent.parentConfig).toEqual(expectedConfig);
    });
});


describe('all on conditions', () => {
    test('With empty conditions, creates AllMatchConditionConfig with type=AllMatch and conditionConfigs=[]', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.all(
            (children) => { });
        let expectedCondConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
    });
    test('With conditions setup with requireText and regExp, creates AllMatchConditionConfig with type=AllMatch and conditionConfigs populated with both conditions', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.all(
            (children) => {
                children.fieldValue('F1').requireText();
                children.fieldValue('F2').requireText()
            });
        let expectedCondConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [<any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            },
            {
                conditionType: ConditionType.RequireText,
                valueHostName: 'F2'
            }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('all() nests child all()', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.all(
            (children) => {
                children.all((grandChildren) => {
                    grandChildren.fieldValue('F3').requireText();
                });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.All,
                    conditionConfigs: [<any>{
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F3'
                    }]
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With starterBuilder.fieldValue("myField").all, 1 child without its own valueHostName inherits the valueHostName from the starterBuilder', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').all(
            (children) => {
                children.conditionConfig({
                    conditionType: ConditionType.RequireText
                    // no valueHostName - expect it to be assigned.
                });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.All,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myField'
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With starterBuilder.fieldValue("myField").all, 1 child with its own valueHostName does not inherit valueHostName', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').all(
            (children) => {
                children.fieldValue('myChildField').requireText();
            });
        let expectedCondConfig = {
            conditionType: ConditionType.All,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myChildField'
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With starterBuilder.fieldValue("myField").all, 1 child using parentValue will lack valueHostName in config', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').all(
            (children) => {
                children.parentValue().requireText();
            });
        let expectedCondConfig = {
            conditionType: ConditionType.All,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Complex nested alls', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.all(
            (children) => {
                children.fieldValue('F1').requireText();

                children.all((grandChildren) => { // this gets myfield even though its not a real property
                    grandChildren.fieldValue('F2').requireText();
                    grandChildren.parentValue().requireText();
                });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [<any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            },
            <any>{
                conditionType: ConditionType.All,

                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                },
                <any>{
                    conditionType: ConditionType.RequireText
                    // did not get valueHostName because it used the parent value host
                }]
            }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

});

describe('any on conditions', () => {
    test('With empty conditions, creates AnyMatchConditionConfig with type=AnyMatch and conditionConfigs=[]', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.any(
            (children) => { });
        let expectedCondConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: []
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
    });
    test('With conditions setup with requireText and regExp, creates AnyMatchConditionConfig with type=AnyMatch and conditionConfigs populated with both conditions', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.any(
            (children) => {
                children.fieldValue('F1').requireText();
                children.fieldValue('F2').requireText()
            });
        let expectedCondConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [<any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            },
            {
                conditionType: ConditionType.RequireText,
                valueHostName: 'F2'
            }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('any() nests child any()', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.any(
            (children) => {
                children.any((grandChildren) => {
                    grandChildren.fieldValue('F3').requireText();
                });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.Any,
                    conditionConfigs: [<any>{
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F3'
                    }]
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With starterBuilder.fieldValue("myField").any, 1 child without its own valueHostName inherits the valueHostName from the starterBuilder', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').any(
            (children) => {
                children.conditionConfig({
                    conditionType: ConditionType.RequireText
                    // no valueHostName - expect it to be assigned.
                });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.Any,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myField'
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With starterBuilder.fieldValue("myField").any, 1 child with its own valueHostName does not inherit valueHostName', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').any(
            (children) => {
                children.fieldValue('myChildField').requireText();
            });
        let expectedCondConfig = {
            conditionType: ConditionType.Any,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myChildField'
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With starterBuilder.fieldValue("myField").any, 1 child using parentValue will lack valueHostName in config', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').any(
            (children) => {
                children.parentValue().requireText();
            });
        let expectedCondConfig = {
            conditionType: ConditionType.Any,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Complex nested anys', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.any(
            (children) => {
                children.fieldValue('F1').requireText();

                children.any((grandChildren) => { // this gets myfield even though its not a real property
                    grandChildren.fieldValue('F2').requireText();
                    grandChildren.parentValue().requireText();
                });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [<any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            },
            <any>{
                conditionType: ConditionType.Any,

                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                },
                <any>{
                    conditionType: ConditionType.RequireText
                    // did not get valueHostName because it used the parent value host
                }]
            }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
});

describe('countMatches on conditions', () => {
    test('With empty conditions, creates AllMatchConditionConfig with type=AllMatch and conditionConfigs=[]', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.countMatches(
            1, 4,
            (children) => { });
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 4,
            conditionConfigs: []
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
    });
    test('With conditions setup with requireText and regExp, creates AllMatchConditionConfig with type=AllMatch and conditionConfigs populated with both conditions', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.countMatches(
            1, 4,
            (children) => {
                children.fieldValue('F1').requireText();
                children.fieldValue('F2').requireText()
            });
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 4,
            conditionConfigs: [<any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            },
            {
                conditionType: ConditionType.RequireText,
                valueHostName: 'F2'
            }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('countMatches() nests child countMatches()', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.countMatches(
            1, 4,
            (children) => {
                children.countMatches(2, 3, (grandChildren) => {
                    grandChildren.fieldValue('F3').requireText();
                });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 4,
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.CountMatches,
                    minimum: 2,
                    maximum: 3,
                    conditionConfigs: [<any>{
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F3'
                    }]
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('With starterBuilder.fieldValue("myField").countMatches, 1 child without its own valueHostName inherits the valueHostName from the starterBuilder', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').countMatches(
            1, 4,
            (children) => {
                children.conditionConfig({
                    conditionType: ConditionType.RequireText
                    // no valueHostName - expect it to be assigned.
                });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 4,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myField'
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With starterBuilder.fieldValue("myField").countMatches, 1 child with its own valueHostName does not inherit valueHostName', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').countMatches(
            1, 4,
            (children) => {
                children.fieldValue('myChildField').requireText();
            });
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 4,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myChildField'
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('With starterBuilder.fieldValue("myField").countMatches, 1 child using parentValue will lack valueHostName in config', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.fieldValue('myField').countMatches(
            1, 4,
            (children) => {
                children.parentValue().requireText();
            });
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 4,
            valueHostName: 'myField',
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('Complex nested countMatches', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.countMatches(
            1, 4,
            (children) => {
                children.fieldValue('F1').requireText();

                children.countMatches(2, 3,
                    (grandChildren) => { // this gets myfield even though its not a real property
                        grandChildren.fieldValue('F2').requireText();
                        grandChildren.parentValue().requireText();
                    });
            });
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 4,
            conditionConfigs: [<any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            },
            <any>{
                conditionType: ConditionType.CountMatches,
                minimum: 2,
                maximum: 3,

                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                },
                <any>{
                    conditionType: ConditionType.RequireText
                    // did not get valueHostName because it used the parent value host
                }]
            }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    // min=null, max=4, 1 child, minimum not in generated config
    test('min=null, max=4, 1 child, minimum not in generated config', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.countMatches(
            null, 4,
            (children) => children.fieldValue('myField').requireText()
        );
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            maximum: 4,
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myField'
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('min=1, max=null, 1 child, maximum not in generated config', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.countMatches(
            1, null,
            (children) => children.fieldValue('myField').requireText()
        );
        let expectedCondConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            conditionConfigs: [
                <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myField'
                }]
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
});


describe('not on conditions', () => {

    test('With condition setup with requireText, creates NotConditionConfig with type=Not and conditionConfigs populatedn', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.not((childBuilder) => childBuilder.fieldValue('F1').requireText());

        let expectedCondConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: {
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            }
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('When there are 2 child conditions, throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.not((childBuilder) => {
            childBuilder.fieldValue('F1').requireText();
            childBuilder.parentValue().requireText();
        })).toThrow(/Only one child/);

    });
    test('Null as the function parameter throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.not(null!)).toThrow(/notCallback/);
    });
    test('Non-function as the function parameter throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.not({} as any)).toThrow(/Function expected/);
    });
    test('Null returned by the notCallback throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.not((childBuilder) => null!)).toThrow(/childConditionConfig/);
    });    
    // starterBuilder.fieldValue('myField').not impacts child
    test('starterBuilder.fieldValue("myField").not applies the field value to the child condition', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.fieldValue('myField').not((childBuilder) =>
            childBuilder.conditionConfig({
                conditionType: ConditionType.RequireText
                // gets myField here, but Not itself does not
            }));

        let expectedCondConfig = {
            conditionType: ConditionType.Not,
            valueHostName: 'myField',   // not ideal here, because Not does not have valueHostName
            childConditionConfig: {
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField'
            }
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
});


describe('when on conditions', () => {
    test('Simple case with whenBuilder and thenBuilder contributing', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.when(
            (whenBuilder) => whenBuilder.fieldValue('F2').regExp(/abc/),
            (thenBuilder) => thenBuilder.parentValue().requireText());

        let expectedCondConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: <any>{
                conditionType: ConditionType.RegExp,
                expression: /abc/,
                valueHostName: 'F2'
            },
            thenConfig: <any>{
                conditionType: ConditionType.RequireText
            }
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    // both have childBuilder.fieldValue()
    test('whenBuilder.fieldValue(F2), thenBuilder.fieldValue(F1)', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);

        starterBuilder.when(
            (whenBuilder) => whenBuilder.fieldValue('F2').regExp(/abc/),
            (thenBuilder) => thenBuilder.fieldValue('F1').requireText());

        let expectedCondConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: <any>{
                conditionType: ConditionType.RegExp,
                expression: /abc/,
                valueHostName: 'F2'
            },
            thenConfig: <any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            }
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    test('When there are 2 child conditions on thenBuilder, throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.when(
            (whenBuilder) => whenBuilder.fieldValue('F2').regExp(/abc/),
            (thenBuilder) => {
                thenBuilder.fieldValue('F1').requireText();
                thenBuilder.fieldValue('F1').requireText();
            }
        )).toThrow();
    });
    test('When there are 2 child conditions on whenBuilder, throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.when(
            (whenBuilder) => {
                whenBuilder.fieldValue('F2').regExp(/abc/);
                whenBuilder.fieldValue('F2').regExp(/abc/);
            },
            (thenBuilder) => thenBuilder.fieldValue('F1').requireText()
        )).toThrow();
    });
    test('Null as the whenCallback parameter throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.when(
            null!,
            (thenBuilder) => thenBuilder.fieldValue('F1').requireText()
        )).toThrow(/whenToEnableCallback/);;
    });
    test('Null as the thenCallback parameter throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.when(
            (whenBuilder) => whenBuilder.fieldValue('F1').requireText(),
            null!
        )).toThrow(/thenCallback/);;
    });
    test('Null as the whenCallback parameter throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.when(
            (whenBuilder)=> null!,
            (thenBuilder) => thenBuilder.fieldValue('F1').requireText()
        )).toThrow(/whenToEnableConfig/);;
    });
    test('Null returned by thenCallback throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.when(
            (whenBuilder) => whenBuilder.fieldValue('F1').requireText(),
            (thenBuilder) => null!
        )).toThrow(/thenConfig/);;
    });
    test('Non-function as the whenCallback parameter throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.when(
            {} as any,
            (thenBuilder) => thenBuilder.fieldValue('F1').requireText()
        )).toThrow(/Function expected/);
    });
    test('Non-function as the thenCallback parameter throws', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.when(
            (whenBuilder) => whenBuilder.fieldValue('F1').requireText(),
            {} as any
        )).toThrow(/Function expected/);
    });

    test('starterBuilder.fieldValue("myField").when inherited by child that lacks valueHostName', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.fieldValue('myField').when(
            (whenBuilder) => whenBuilder.conditionConfig({
                conditionType: ConditionType.RequireText
            }),
            (thenBuilder) => thenBuilder.fieldValue('F2').requireText()
        );
        let expectedCondConfig = {
            conditionType: ConditionType.When,
            valueHostName: 'myField',   // not a real field, but we'll allow it
            whenToEnableConfig: <any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField'
            },
            thenConfig: <any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F2'
            }
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    test('starterBuilder.fieldValue("myField").when not inherited by child that has valueHostName', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.fieldValue('myField').when(
            (whenBuilder) => whenBuilder.fieldValue('F1').requireText(),
            (thenBuilder) => thenBuilder.fieldValue('F2').requireText()
        );
        let expectedCondConfig = {
            conditionType: ConditionType.When,
            valueHostName: 'myField',   // not a real field, but we'll allow it
            whenToEnableConfig: <any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F1'
            },
            thenConfig: <any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F2'
            }
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
    // starter.parentValue().when, no inheritance
    test('starterBuilder.parentValue().when provides no valueHostName to child that lacks valueHostName', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.parentValue().when(
            (whenBuilder) => whenBuilder.conditionConfig({
                conditionType: ConditionType.RequireText
            }),
            (thenBuilder) => thenBuilder.fieldValue('F2').requireText()
        );
        let expectedCondConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: <any>{
                conditionType: ConditionType.RequireText
            },
            thenConfig: <any>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'F2'
            }
        };
        let starterConfig = starterBuilder.getConfig();
        expect(starterConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

});

describe('conditionConfig', () => {
    test('With no parameters creates DataTypeCheckConditionConfig with only type assigned', () => {
        const conditionConfig = {
            conditionType: ConditionType.RegExp,
            expression: /\d/i,
            valueHostName: null
        };
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        starterBuilder.conditionConfig(conditionConfig);

        let expectedCondConfig = conditionConfig;
        expect(starterBuilder.getConfig()).toEqual(expectedCondConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedCondConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
 
    test('With null parameter, throws error', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.conditionConfig(null!)).toThrow(/config/);
    });
    test('With object missing conditionType property, throws error', () => {
        let parentBuilder = new TestParentBuilder();
        let starterBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => starterBuilder.conditionConfig({} as any)).toThrow(/config.conditionType/);
    });    
});