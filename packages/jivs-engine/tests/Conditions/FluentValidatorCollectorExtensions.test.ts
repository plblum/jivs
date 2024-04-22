import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { FluentCollectorBase, FluentValidatorCollector, fluent } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import {
    AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, EqualToValueConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig, NotEqualToConditionConfig, NotEqualToValueConditionConfig, NotNullConditionConfig, RangeConditionConfig,
    RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig
} from '../../src/Conditions/ConcreteConditions';
import { ConditionEvaluateResult } from '../../src/Interfaces/Conditions';

function TestFluentValidatorCollector(testItem: FluentCollectorBase,
    expectedValConfig: ValidatorConfig) {

    expect(testItem).toBeInstanceOf(FluentValidatorCollector);
    let typedTextItem = testItem as FluentValidatorCollector;
    let config = typedTextItem.parentConfig as InputValueHostConfig;
    expect(config.validatorConfigs).not.toBeNull();
    expect(config.validatorConfigs!.length).toBe(1);
    let valConfig = config.validatorConfigs![0];
    expect(valConfig).toEqual(expectedValConfig);
}

describe('dataTypeCheck on fluent().input', () => {
    test('With no parameters creates ValidatorConfig with DataTypeCheckCondition with only type assigned', () => {

        let testItem = fluent().input('Field1').dataTypeCheck();
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').dataTypeCheck('Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').dataTypeCheck('Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').dataTypeCheck(null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').dataTypeCheck('FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('regExp on fluent().input', () => {
    test('With expression assigned to a string, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {

        let testItem = fluent().input('Field1').regExp('\\d');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expressionAsString: '\\d'
            }
        });
    });
    test('With expression assigned to a RegExp, creates ValidatorConfig with RegExpCondition with type=RegExp and expression assigned', () => {

        let testItem = fluent().input('Field1').regExp(/\d/i);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /\d/i
            }
        });
    });
    test('With expression and ignoreCase=true creates ValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {

        let testItem = fluent().input('Field1').regExp('\\d', true);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expressionAsString: '\\d',
                ignoreCase: true
            }
        });
    });
    test('With expression and ignoreCase=false creates ValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {

        let testItem = fluent().input('Field1').regExp('\\d', false);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expressionAsString: '\\d',
                ignoreCase: false
            }
        });
    });
    test('With expression as text, ignoreCase=null, and ivParam with not=true, creates ValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and not=true assigned', () => {

        let testItem = fluent().input('Field1').regExp('\\d', null, { not: true });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expressionAsString: '\\d',
                not: true
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with RegExpCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').regExp(null, null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with RegExpCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').regExp(null, null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with RegExpCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').regExp(null, null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with RegExpCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').regExp(null, null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('range on fluent().input', () => {
    test('With minimum and maximum, creates ValidatorConfig with RangeCondition with type=Range and minimum assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).range(1, 4);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            }
        });
    });

    test('With minimum assigned and maximum=null, creates ValidatorConfig with RangeCondition with type=Range, minimum assigned', () => {

        let testItem = fluent().input('Field1').range(1, null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1
            }
        });
    });
    test('With maximum assigned and minimum=null, creates ValidatorConfig with RangeCondition with type=Range, maximum assigned', () => {

        let testItem = fluent().input('Field1').range(null, 4);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                maximum: 4
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with RangeCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').range(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').range(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').range(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with RangeCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').range(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('equalToValue on fluent().input', () => {
    test('With secondValue, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).equalToValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).equalToValue(1, null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with EqualToValueCondition with type=EqualToValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with EqualToValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').equalToValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').equalToValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').equalToValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').equalToValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('equalTo on fluent().input', () => {
    test('With secondValueHostName, creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').equalTo('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).equalTo('Field2', null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with EqualToCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').equalTo('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').equalTo('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').equalTo('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with EqualToCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').equalTo('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('notEqualToValue on fluent().input', () => {
    test('With secondValue, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).notEqualToValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).notEqualToValue(1, null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with NotEqualToValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').notEqualToValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').notEqualToValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').notEqualToValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').notEqualToValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('notEqualTo on fluent().input', () => {
    test('With secondValueHostName, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').notEqualTo('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).notEqualTo('Field2', null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with NotEqualToCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').notEqualTo('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').notEqualTo('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').notEqualTo('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotEqualToCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').notEqualTo('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanValue on fluent().input', () => {
    test('With secondValue, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThanValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).ltValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });

    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThanValue(1, null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanValueCondition with type=LessThanValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with LessThanValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').lessThanValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThan on fluent().input', () => {
    test('With secondValueHostName, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').lessThan('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('SShorthand version "lt" With secondValueHostName, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').lt('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThan('Field2', null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with LessThanCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThan('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThan('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThan('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').lessThan('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanOrEqualValue on fluent().input', () => {
    test('With secondValue, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThanOrEqualValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('Shorthand version, "lteValue", With secondValue, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lteValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with LessThanOrEqualValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqualValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqualValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqualValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqualValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanOrEqual on fluent().input', () => {
    test('With secondValueHostName, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "lte" With secondValueHostName, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').lte('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });


    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThanOrEqual('Field2', null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqual('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqual('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqual('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with LessThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').lessThanOrEqual('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});


describe('greaterThanValue on fluent().input', () => {
    test('With secondValue, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThanValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "gtValue" With secondValue, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).gtValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });

    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThanValue(1, null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with GreaterThanValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').greaterThanValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThan on fluent().input', () => {
    test('With secondValueHostName, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').greaterThan('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "gt" with secondValueHostName, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').gt('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThan('Field2', null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with GreaterThanCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThan('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThan('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThan('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').greaterThan('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThanOrEqualValue on fluent().input', () => {
    test('With secondValue, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThanOrEqualValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "gteValue" With secondValue, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).gteValue(1);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with GreaterThanOrEqualValueCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqualValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualValueCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqualValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqualValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualValueCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqualValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThanOrEqual on fluent().input', () => {
    test('With secondValueHostName, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "gte" with secondValueHostName, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThanOrEqual('Field2', null);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = fluent().input('Field1', LookupKey.Integer).greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqual('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqual('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqual('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with GreaterThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').greaterThanOrEqual('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('stringLength on fluent().input', () => {
    test('With maximum, creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {

        let testItem = fluent().input('Field1').stringLength(4);
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4
            }
        });
    });

    test('With minimum and maximum assigned, creates ValidatorConfig with StringLengthCondition with type=StringLength, minimum assigned', () => {

        let testItem = fluent().input('Field1').stringLength(4, { minimum: 1 });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4,
                minimum: 1
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with StringLengthCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').stringLength(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with StringLengthCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').stringLength(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with StringLengthCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').stringLength(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with StringLengthCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').stringLength(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('requireText on fluent().input', () => {
    test('With no parameters, creates ValidatorConfig with RequireTextCondition with type=RequireText', () => {

        let testItem = fluent().input('Field1').requireText();
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        });
    });

    test('With nullValueResult=NoMatch assigned, creates ValidatorConfig with RequireTextCondition with type=RequireText, nullValueResult=NoMatch', () => {

        let testItem = fluent().input('Field1').requireText({ nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                nullValueResult: ConditionEvaluateResult.NoMatch
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with RequireTextCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').requireText(null, 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with RequireTextCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').requireText(null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with RequireTextCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').requireText(null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with RequireTextCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').requireText(null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('notNull on fluent().input', () => {
    test('With no parameters, creates ValidatorConfig with NotNullCondition with type=NotNull', () => {

        let testItem = fluent().input('Field1').notNull();
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            }
        });
    });

    test('With only errorMessage creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage assigned', () => {

        let testItem = fluent().input('Field1').notNull('Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').notNull('Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = fluent().input('Field1').notNull(null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with NotNullCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').notNull('FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('all on fluent().input', () => {
    test('With empty conditions, creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs=[]', () => {

        let testItem = fluent().input('Field1').all(fluent().conditions());
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            }
        });
    });
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs populated with both conditions', () => {

        let testItem = fluent().input('Field1').all(fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').all(fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').all(fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').all(fluent().conditions(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with AllMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').all(fluent().conditions(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('any on fluent().input', () => {
    test('With empty conditions, creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs=[]', () => {

        let testItem = fluent().input('Field1').any(fluent().conditions());
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            }
        });
    });
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs populated with both conditions', () => {

        let testItem = fluent().input('Field1').any(fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').any(fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').any(fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').any(fluent().conditions(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with AnyMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').any(fluent().conditions(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('countMatches on fluent().input', () => {
    test('With minimum and maximum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {

        let testItem = fluent().input('Field1').countMatches(1, 2, fluent().conditions());
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: []
            }
        });
    });
    test('With minimum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {

        let testItem = fluent().input('Field1').countMatches(1, null, fluent().conditions());
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                conditionConfigs: []
            }
        });
    });
    test('With maximum assigned and empty conditions, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {

        let testItem = fluent().input('Field1').countMatches(null, 2, fluent().conditions());
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                maximum: 2,
                conditionConfigs: []
            }
        });
    });    
    test('With conditions setup with requireText and regExp, creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {

        let testItem = fluent().input('Field1').countMatches(0, 2, fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').countMatches(1, 4, fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').countMatches(1, 2, fluent().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
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

        let testItem = fluent().input('Field1').countMatches(null, null, fluent().conditions(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with CountMatchesMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = fluent().input('Field1').countMatches(null, null, fluent().conditions(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
});