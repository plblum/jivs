import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { FieldValueHostConfig } from '../../src/Interfaces/FieldValueHost';
import { FluentBuilderBase, FluentValidatorBuilder, FluentValidatorConfig, ValidationManagerStartFluent } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import {
    AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, EqualToValueConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig, IntegerConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig, MaxDecimalsConditionConfig, NotEqualToConditionConfig, NotEqualToValueConditionConfig, NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig,
    RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig
} from '../../src/Conditions/ConcreteConditions';
import {
    NotConditionConfig
} from '../../src/Conditions/NotCondition';
import { ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { MockValidationServices } from '../TestSupport/mocks';
import { WhenConditionConfig } from '../../src/Conditions/WhenCondition';
import { ValidationSeverity } from '../../src/Interfaces/Validation';

function createFluent(): ValidationManagerStartFluent {
    return new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
}
function TestFluentValidatorBuilder(testItem: FluentBuilderBase,
    expectedValConfig: ValidatorConfig) {

    expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
    let typedTextItem = testItem as FluentValidatorBuilder;
    let config = typedTextItem.parentConfig as FieldValueHostConfig;
    expect(config.validatorConfigs).not.toBeNull();
    expect(config.validatorConfigs!.length).toBe(1);
    let valConfig = config.validatorConfigs![0];
    expect(valConfig).toEqual(expectedValConfig);
}

function createValidatorParamsAllProperties(): FluentValidatorConfig {
    return <FluentValidatorConfig>
        {
            errorMessage: 'Error',
            summaryMessage: 'Summary',
            severity: ValidationSeverity.Error,
            errorCode: 'E001', enabled: true,
            errorMessagel10n: 'ErrorKey',
            summaryMessagel10n: 'SummaryKey',
            validatorType: 'Validator'
        };
}

describe('dataTypeCheck as a validator of a field()', () => {
    test('With no parameters creates ValidatorConfig with DataTypeCheckCondition with only type assigned', () => {

        let testItem = createFluent().field('Field1').dataTypeCheck();
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').dataTypeCheck('Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error'
        });
    });
    // both errormessage and summarymessage parameters
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createFluent().field('Field1').dataTypeCheck('Error', 'Summary' );
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // with null for errorMessage, 'summary'
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createFluent().field('Field1').dataTypeCheck(null, 'Summary' );
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            summaryMessage: 'Summary'
        });
    });
    // with only null, which should be treated as no parameters, so no errorMessage or summaryMessage
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {
        let testItem = createFluent().field('Field1').dataTypeCheck(null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            }
        });
    });
    // now focusing on the overload that takes one parameter, which is a FluentValidatorConfig
    // It has many parameters, and we need to be sure all pass through
    test('With FluentValidatorConfig with errorMessage and summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createFluent().field('Field1').dataTypeCheck({ errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // all properties assigned in FluentValidatorConfig
    test('With FluentValidatorConfig with all of its properties assigned', () => {
        let sourceProperties = createValidatorParamsAllProperties();

        let testItem = createFluent().field('Field1').dataTypeCheck(sourceProperties);

        // destProperties is a ValidatorConfig with conditionConfig of type DataTypeCheckConditionConfig, and all other properties from sourceProperties
        // clone sourceProperties to destProperties, but add conditionConfig with type DataTypeCheckConditionConfig
        let destProperties: ValidatorConfig = {
            ...sourceProperties, conditionConfig:
            {
                conditionType: ConditionType.DataTypeCheck
            }
        };        
        TestFluentValidatorBuilder(testItem, destProperties);

    });
    // empty object
    test('With FluentValidatorConfig with no properties assigned', () => {
        let testItem = createFluent().field('Field1').dataTypeCheck({});
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            }
        });
    });
});

describe('regExp as a validator of a field()', () => {
    describe('regExp(string) use cases', () => {
        // regExp(string)
        test('regExp(string), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {

            let testItem = createFluent().field('Field1').regExp('\\d');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d'
                }
            });
        });
        // regExp(string, true)
        test('regExp(string, true), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', true);
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                }
            });
        });
        // regExp(string, false)
        test('regExp(string, false), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', false);
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{

                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: false
                }
            });
        });
        // regExp(string, true, errorMessage)
        test('regExp(string, true, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and errorMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', true, 'Error');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                },
                errorMessage: 'Error'
            });
        });
        // regExp(string, false, errorMessage)
        test('regExp(string, false, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false and errorMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', false, 'Error');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{

                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: false
                },
                errorMessage: 'Error'
            });
        });
        // regExp(string, true, errorMessage, summaryMessage)
        test('regExp(string, true, errorMessage, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and errorMessage + summaryMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', true, 'Error', 'Summary');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        // regExp(string, true, null, summaryMessage)
        test('regExp(string, true, null, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and summaryMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', true, null, 'Summary');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                },
                summaryMessage: 'Summary'
            });
        });
        // regExp(string, undefined, string)
        test('regExp(string, undefined, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', undefined, 'Error');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d'
                },
                errorMessage: 'Error'
            });
        });
        // regExp(string, true, null)
        test('regExp(string, true, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', true, null);
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                }
            });
        });
        // regExp(string, false, null, null)
        test('regExp(string, false, null, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', false, null, null);
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: false
                }
            });
        });
        // regExp(string, true, validatorParameters)
        test('regExp(string, true, { errorMessage, summaryMessage }), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and errorMessage + summaryMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', true, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        // regExp(string, false, validatorParameters)
        test('regExp(string, false, { errorMessage, summaryMessage }), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false and errorMessage + summaryMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', false, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: false
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        // regExp(string, true, {})
        test('regExp(string, true, {}), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true', () => {
            let testItem = createFluent().field('Field1').regExp('\\d', true, {});
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                }
            });
        });
    });
    describe('regExp(RegExp) use cases', () => {
        // basically the same test cases as regExp(string), but with RegExp instead of string, and ignoreCase is not a parameter, because it is part of the RegExp object
        // regExp(RegExp)
        test('regExp(RegExp), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/);
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                }
            });
        });
        // regExp(RegExp, errorMessage)
        test('regExp(RegExp, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/, 'Error');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                },
                errorMessage: 'Error'

            });
        });
        // regExp(RegExp, errorMessage, summaryMessage)
        test('regExp(RegExp, errorMessage, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/, 'Error', 'Summary');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        // regExp(RegExp, null, summaryMessage)
        test('regExp(RegExp, null, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and summaryMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/, null, 'Summary');
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                },
                summaryMessage: 'Summary'
            });
        });
        // regExp(RegExp, null, null)
        test('regExp(RegExp, null, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/, null, null);
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                }
            });
        });
        // regExp(RegExp, null)
        test('regExp(RegExp, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/, null);
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                }
            });
        });
        // regExp(RegExp, validatorParameters) with both condition and validator parameters.
        // for condition parameters, use multiline: true
        test('regExp(RegExp, validatorParameters) with both condition and validator parameters, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/,
                {
                    errorMessage: 'Error',
                    summaryMessage: 'Summary',
                    multiline: true
                });
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/,
                    multiline: true
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        // regExp(RegExp, validatorParameters) with only condition parameters, no validator parameters.
        test('regExp(RegExp, validatorParameters) with only condition parameters, no validator parameters, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/,
                {
                    multiline: true
                });
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/,
                    multiline: true
                }
            });
        });
        // regExp(RegExp, validatorParameters) with only validator parameters, no condition parameters.
        test('regExp(RegExp, validatorParameters) with only validator parameters, no condition parameters, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
            let testItem = createFluent().field('Field1').regExp(/\d/,
                {
                    errorMessage: 'Error',
                    summaryMessage: 'Summary'
                });
            TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });

    });
});

describe('range as a validator of a field()', () => {
    test('With minimum and maximum, creates ValidatorConfig with RangeCondition with type=Range and minimum assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).range(1, 4);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            }
        });
    });

    test('With minimum assigned and maximum=null, creates ValidatorConfig with RangeCondition with type=Range, minimum assigned', () => {

        let testItem = createFluent().field('Field1').range(1, null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1
            }
        });
    });
    test('With maximum assigned and minimum=null, creates ValidatorConfig with RangeCondition with type=Range, maximum assigned', () => {

        let testItem = createFluent().field('Field1').range(null, 4);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                maximum: 4
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with RangeCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').range(null, null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').range(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').range(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with RangeCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').range(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('equalToValue as a validator of a field()', () => {
    test('With secondValue, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1, null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with EqualToValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').equalToValue(null, null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').equalToValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').equalToValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').equalToValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('equalTo as a validator of a field()', () => {
    test('With secondValueHostName, creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').equalTo('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).equalTo('Field2', null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with EqualToCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').equalTo('Field2', null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').equalTo('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').equalTo('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').equalTo('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('notEqualToValue as a validator of a field()', () => {
    test('With secondValue, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1, null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with NotEqualToValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').notEqualToValue(null, null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').notEqualToValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').notEqualToValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').notEqualToValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('notEqualTo as a validator of a field()', () => {
    test('With secondValueHostName, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').notEqualTo('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualTo('Field2', null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with NotEqualToCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').notEqualTo('Field2', null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').notEqualTo('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').notEqualTo('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').notEqualTo('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanValue as a validator of a field()', () => {
    test('With secondValue, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).ltValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });

    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1, null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with LessThanValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanValue(null, null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').lessThanValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThan as a validator of a field()', () => {
    test('With secondValueHostName, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').lessThan('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('SShorthand version "lt" With secondValueHostName, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').lt('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThan('Field2', null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with LessThanCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThan('Field2', null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThan('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThan('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').lessThan('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanOrEqualValue as a validator of a field()', () => {
    test('With secondValue, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('Shorthand version, "lteValue", With secondValue, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lteValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with LessThanOrEqualValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqualValue(null, null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqualValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqualValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqualValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanOrEqual as a validator of a field()', () => {
    test('With secondValueHostName, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqual('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "lte" With secondValueHostName, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').lte('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });


    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqual('Field2', null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});


describe('greaterThanValue as a validator of a field()', () => {
    test('With secondValue, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "gtValue" With secondValue, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).gtValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });

    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1, null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with GreaterThanValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanValue(null, null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThan as a validator of a field()', () => {
    test('With secondValueHostName, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').greaterThan('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "gt" with secondValueHostName, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').gt('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThan('Field2', null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with GreaterThanCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThan('Field2', null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThan('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThan('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').greaterThan('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThanOrEqualValue as a validator of a field()', () => {
    test('With secondValue, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "gteValue" With secondValue, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).gteValue(1);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with GreaterThanOrEqualValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqualValue(null, null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqualValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqualValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqualValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThanOrEqual as a validator of a field()', () => {
    test('With secondValueHostName, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "gte" with secondValueHostName, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqual('Field2', null);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('stringLength as a validator of a field()', () => {
    test('With maximum, creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {

        let testItem = createFluent().field('Field1').stringLength(4);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4
            }
        });
    });

    test('With minimum and maximum assigned, creates ValidatorConfig with StringLengthCondition with type=StringLength, minimum assigned', () => {

        let testItem = createFluent().field('Field1').stringLength(4, { minimum: 1 });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4,
                minimum: 1
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with StringLengthCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').stringLength(null, null, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with StringLengthCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').stringLength(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with StringLengthCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').stringLength(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with StringLengthCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').stringLength(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('requireText as a validator of a field()', () => {
    test('With no parameters, creates ValidatorConfig with RequireTextCondition with type=RequireText', () => {

        let testItem = createFluent().field('Field1').requireText();
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        });
    });

    test('With nullValueResult=NoMatch assigned, creates ValidatorConfig with RequireTextCondition with type=RequireText, nullValueResult=NoMatch', () => {

        let testItem = createFluent().field('Field1').requireText({
            nullValueResult: ConditionEvaluateResult.NoMatch,
            errorMessage: 'Error',
        });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                nullValueResult: ConditionEvaluateResult.NoMatch
            },
            errorMessage: 'Error'
        });
    });

    test('With only errorMessage creates ValidatorConfig with RequireTextCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').requireText('Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error'
        });
    });

});
describe('notNull as a validator of a field()', () => {
    test('With no parameters, creates ValidatorConfig with NotNullCondition with type=NotNull', () => {

        let testItem = createFluent().field('Field1').notNull();
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').notNull('Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'Error'
        });
    });
    // same also with summary message
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createFluent().field('Field1').notNull('Error', 'Summary' );
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });

    test('Within validatorParameters, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').notNull({ errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
});

describe('all as a validator of a field()', () => {
    test('With empty conditions, creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs=[]', () => {

        let testItem = createFluent().field('Field1').all((children) => children);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            }
        });
    });
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs populated with both conditions', () => {

        let testItem = createFluent().field('Field1')
            .all((children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            }
        });
    });

    test('With conditions setup with requireText and regExp, and errorMessage assigned creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1')
            .all((children) => children.requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1')
            .all((children) => children.requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').all((children) => children, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with AllMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').all((children) => children, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
    test('Null as the function parameter throws', () => {
        let fluent = createFluent();
        expect(()=> fluent.field('Field1').all(null!, 'Error')).toThrow(/conditions/);
    });
    test('Non-function as the function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.field('Field1').all({} as any, 'Error')).toThrow(/Function expected/);
    });    
});
describe('any as a validator of a field()', () => {
    test('With empty conditions, creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs=[]', () => {

        let testItem = createFluent().field('Field1').any((children) => children);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            }
        });
    });
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs populated with both conditions', () => {

        let testItem = createFluent().field('Field1').any((children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            }
        });
    });

    test('With conditions setup with requireText and regExp, and errorMessage assigned creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').any((children) => children.requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').any((children) => children.requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').any((children) => children, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with AnyMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').any((children) => children, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
    test('Null as the function parameter throws', () => {
        let fluent = createFluent();
        expect(()=> fluent.field('Field1').any(null!, 'Error')).toThrow(/conditions/);
    });
    test('Non-function as the function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.field('Field1').any({} as any, 'Error')).toThrow(/Function expected/);
    });        
});

describe('countMatches as a validator of a field()', () => {
    test('With minimum and maximum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {

        let testItem = createFluent().field('Field1').countMatches(1, 2, (children) => children);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: []
            }
        });
    });
    test('With minimum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {

        let testItem = createFluent().field('Field1').countMatches(1, null, (children) => children);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                conditionConfigs: []
            }
        });
    });
    test('With maximum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {

        let testItem = createFluent().field('Field1').countMatches(null, 2, (children) => children);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                maximum: 2,
                conditionConfigs: []
            }
        });
    });    
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {

        let testItem = createFluent().field('Field1').countMatches(0, 2, (children) => children.requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
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
            }
        });
    });

    test('With conditions setup with requireText and regExp, and errorMessage assigned creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').countMatches(1, 4, (children) => children.requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
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
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').countMatches(1, 2, (children) => children.requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: [<any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').countMatches(null, null, (children) => children, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with CountMatchesMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').countMatches(null, null, (children) => children, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
    test('Null as the function parameter throws', () => {
        let fluent = createFluent();
        expect(()=> fluent.field('Field1').countMatches(0, 1, null!, 'Error')).toThrow(/conditions/);
    });
    test('Non-function as the function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.field('Field1').countMatches(0, 1, {} as any, 'Error')).toThrow(/Function expected/);
    });        
});

describe('positive as a validator of a field()', () => {
    test('With no parameters, creates ValidatorConfig with PositiveCondition with type=Positive', () => {

        let testItem = createFluent().field('Field1').positive();
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').positive('Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').positive('Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').positive(null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with PositiveCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').positive('FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('integer as a validator of a field()', () => {
    test('With no parameters, creates ValidatorConfig with IntegerCondition with type=Integer', () => {

        let testItem = createFluent().field('Field1').integer();
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').integer('Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').integer('Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').integer(null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with IntegerCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').integer('FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('maxDecimals as a validator of a field()', () => {
    test('With no parameters, creates ValidatorConfig with MaxDecimalsCondition with type=MaxDecimals', () => {

        let testItem = createFluent().field('Field1').maxDecimals(2);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createFluent().field('Field1').maxDecimals(1, 'Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 1
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').maxDecimals(2, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1').maxDecimals(2, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with MaxDecimalsCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').maxDecimals(2, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('not as a validator of a field()', () => {
    test('With empty condition, creates ValidatorConfig with NotCondition with type=Not and childConditionConfig={}', () => {

        let testItem = createFluent().field('Field1').not((children) => children);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: {}
            }
        });
    });
    test('With condition setup with requireText, creates ValidatorConfig with NotCondition with type=Not and conditionConfigs populated', () => {

        let testItem = createFluent().field('Field1')
            .not((children) => children.requireText(null, 'F1'));
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            }
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with NotCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1')
            .not((children) => children.requireText(null, 'F1'), 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent()
            .field('Field1').not((children) => children, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: {}
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').not((children) => children, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: {}
            },
            errorMessage: 'FirstError'
        });
    });
    test('When there are 2 child conditions, throws', () => {
        expect(() => createFluent().field('Field1')
            .not((children) => children.requireText(null, 'F1').requireText(null, 'F2'))).toThrow();
    });    
    test('Null as the function parameter throws', () => {
        let fluent = createFluent();
        expect(()=> fluent.field('Field1').not(null!, 'Error')).toThrow(/childBuilder/);
    });
    test('Non-function as the function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.field('Field1').not({} as any, 'Error')).toThrow(/Function expected/);
    });    
});

describe('when as a validator of a field()', () => {
    test('With empty condition in both enabler and childCondition, creates ValidatorConfig with WhenCondition with type=When, enablerConfig={} and childConditionConfig={}', () => {

        let testItem = createFluent().field('Field1').when(
            (enablerBuilder) => enablerBuilder,
            (childBuilder) => childBuilder);
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                enablerConfig: {},
                childConditionConfig: {}
            }
        });
    });
    test('With child condition setup with requireText and enabler condition with regexp, creates ValidatorConfig with WhenCondition with type=When and both enablerConfig and childConditionConfigs populated', () => {

        let testItem = createFluent().field('Field1')
            .when((enabler)=> enabler.regExp(/abc/),
                (childBuilder) => childBuilder.requireText(null, 'F1'));
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                enablerConfig: <any>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                },
                childConditionConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            }
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with WhenCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent().field('Field1')
            .when(
                (enabler)=> enabler.regExp(/abc/, null, null, 'F2'),
                (childBuilder) => childBuilder.requireText(null, 'F1'),
                
                'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
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
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with WhenCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createFluent()
            .field('Field1').when(
                (enablerBuilder)=> enablerBuilder,    
                (childBuilder) => childBuilder, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                enablerConfig: {},
                childConditionConfig: {}
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with WhenCondition with only type assigned. ErrorMessage is from first parameter, when validatorConfig assigned', () => {

        let testItem = createFluent().field('Field1').when(
            (enablerBuilder) => enablerBuilder,
            (childBuilder) => childBuilder,
            'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                enablerConfig: {},  
                childConditionConfig: {}
            },
            errorMessage: 'FirstError'
        });
    });
    test('When there are 2 child conditions, throws', () => {
        expect(() => createFluent().field('Field1')
            .when((enablerBuilder)=> enablerBuilder,
                (childBuilder) => childBuilder.requireText(null, 'F1').requireText(null, 'F2'))).toThrow();
    });    
    test('When there are 2 enabler conditions, throws', () => {
        expect(() => createFluent().field('Field1')
            .when((enablerBuilder)=> enablerBuilder.requireText(null, 'F1').requireText(null, 'F2'),
                (childBuilder) => childBuilder)).toThrow();
    });        
    test('Null as the enabler function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.field('Field1').when(null!, (childBuilder) => childBuilder,
            'Error')).toThrow(/enablerBuilder/);
    });
    test('Null as the child condition function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.field('Field1').when((enabler)=> enabler, null!,
            'Error')).toThrow(/childBuilder/);
    });    
    test('Non-function as the child function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.field('Field1').when((enablerBuilder)=> enablerBuilder, {} as any, 'Error')).toThrow(/Function expected/);
    });    
    test('Non-function as the enabler function parameter throws', () => {
        let fluent = createFluent();
        expect(() => fluent.field('Field1').when({} as any, (childBuilder) => childBuilder, 'Error')).toThrow(/Function expected/);
    });        
});
