import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { FluentCollectorBase, FluentValidatorCollector, config } from "../../src/ValueHosts/Fluent";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { InputValidatorConfig } from '../../src/Interfaces/InputValidator';
import {
    AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, NotEqualToConditionConfig, NotNullConditionConfig, RangeConditionConfig,
    RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig
} from '../../src/Conditions/ConcreteConditions';
import { ConditionEvaluateResult } from '../../src/Interfaces/Conditions';

function TestFluentValidatorCollector(testItem: FluentCollectorBase,
    expectedValConfig: InputValidatorConfig) {

    expect(testItem).toBeInstanceOf(FluentValidatorCollector);
    let typedTextItem = testItem as FluentValidatorCollector;
    let config = typedTextItem.parentConfig as InputValueHostConfig;
    expect(config.validatorConfigs).not.toBeNull();
    expect(config.validatorConfigs!.length).toBe(1);
    let valConfig = config.validatorConfigs![0];
    expect(valConfig).toEqual(expectedValConfig);
}

describe('dataTypeCheck on configInput', () => {
    test('With no parameters creates InputValidatorConfig with DataTypeCheckCondition with only type assigned', () => {

        let testItem = config().input('Field1').dataTypeCheck();
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                type: ConditionType.DataTypeCheck
            }
        });
    });
    test('With only errorMessage creates InputValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').dataTypeCheck('Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                type: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').dataTypeCheck('Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                type: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').dataTypeCheck(null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                type: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with DataTypeCheckCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').dataTypeCheck('FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                type: ConditionType.DataTypeCheck
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('regExp on configInput', () => {
    test('With expression assigned to a string, creates InputValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {

        let testItem = config().input('Field1').regExp('\\d');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp,
                expressionAsString: '\\d'
            }
        });
    });
    test('With expression assigned to a RegExp, creates InputValidatorConfig with RegExpCondition with type=RegExp and expression assigned', () => {

        let testItem = config().input('Field1').regExp(/\d/i);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp,
                expression: /\d/i
            }
        });
    });
    test('With expression and ignoreCase=true creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {

        let testItem = config().input('Field1').regExp('\\d', true);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp,
                expressionAsString: '\\d',
                ignoreCase: true
            }
        });
    });
    test('With expression and ignoreCase=false creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {

        let testItem = config().input('Field1').regExp('\\d', false);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp,
                expressionAsString: '\\d',
                ignoreCase: false
            }
        });
    });
    test('With expression as text, ignoreCase=null, and ivParam with not=true, creates InputValidatorConfig with RegExpCondition with type=RegExp, expressionAsString, and not=true assigned', () => {

        let testItem = config().input('Field1').regExp('\\d', null, { not: true });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp,
                expressionAsString: '\\d',
                not: true
            }
        });
    });
    test('With only errorMessage creates InputValidatorConfig with RegExpCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').regExp(null, null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with RegExpCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').regExp(null, null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with RegExpCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').regExp(null, null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with RegExpCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').regExp(null, null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RegExpConditionConfig>{
                type: ConditionType.RegExp
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('range on configInput', () => {
    test('With minimum and maximum, creates InputValidatorConfig with RangeCondition with type=Range and minimum assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).range(1, 4);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                type: ConditionType.Range,
                minimum: 1,
                maximum: 4
            }
        });
    });

    test('With minimum assigned and maximum=null, creates InputValidatorConfig with RangeCondition with type=Range, minimum assigned', () => {

        let testItem = config().input('Field1').range(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                type: ConditionType.Range,
                minimum: 1
            }
        });
    });
    test('With maximum assigned and minimum=null, creates InputValidatorConfig with RangeCondition with type=Range, maximum assigned', () => {

        let testItem = config().input('Field1').range(null, 4);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                type: ConditionType.Range,
                maximum: 4
            }
        });
    });

    test('With only errorMessage creates InputValidatorConfig with RangeCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').range(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                type: ConditionType.Range
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').range(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                type: ConditionType.Range
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').range(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                type: ConditionType.Range
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with RangeCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').range(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                type: ConditionType.Range
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('equalToValue on configInput', () => {
    test('With secondValue, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).equalToValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).equalToValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorConfig with EqualToCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').equalToValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').equalToValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').equalToValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with EqualToCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').equalToValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('equalTo on configInput', () => {
    test('With secondValueHostName, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').equalTo('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).equalTo('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorConfig with EqualToCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').equalTo('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').equalTo('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').equalTo('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with EqualToCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').equalTo('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('notEqualToValue on configInput', () => {
    test('With secondValue, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).notEqualToValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).notEqualToValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorConfig with NotEqualToCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').notEqualToValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').notEqualToValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').notEqualToValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotEqualToCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').notEqualToValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('notEqualTo on configInput', () => {
    test('With secondValueHostName, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').notEqualTo('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).notEqualTo('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorConfig with NotEqualToCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').notEqualTo('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').notEqualTo('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').notEqualTo('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotEqualToCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').notEqualTo('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanValue on configInput', () => {
    test('With secondValue, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThanValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).ltValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValue: 1
            }
        });
    });

    test('With secondValue assigned and condDesc=null, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThanValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorConfig with LessThanCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').lessThanValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').lessThanValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').lessThanValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').lessThanValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThan on configInput', () => {
    test('With secondValueHostName, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').lessThan('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('SShorthand version "lt" With secondValueHostName, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').lt('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorConfig with LessThanCondition with type=LessThan and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThan('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorConfig with LessThanCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').lessThan('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').lessThan('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').lessThan('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').lessThan('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanOrEqualValue on configInput', () => {
    test('With secondValue, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThanOrEqualValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('Shorthand version, "lteValue", With secondValue, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lteValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqualValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqualValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqualValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqualValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanOrEqual on configInput', () => {
    test('With secondValueHostName, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "lte" With secondValueHostName, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').lte('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });


    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThanOrEqual('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqual('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqual('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqual('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with LessThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').lessThanOrEqual('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});


describe('greaterThanValue on configInput', () => {
    test('With secondValue, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThanValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "gtValue" With secondValue, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).gtValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValue: 1
            }
        });
    });

    test('With secondValue assigned and condDesc=null, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThanValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorConfig with GreaterThanCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').greaterThanValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThan on configInput', () => {
    test('With secondValueHostName, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').greaterThan('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "gt" with secondValueHostName, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').gt('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThan('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorConfig with GreaterThanCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').greaterThan('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').greaterThan('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').greaterThan('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').greaterThan('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThanOrEqualValue on configInput', () => {
    test('With secondValue, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThanOrEqualValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "gteValue" With secondValue, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).gteValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqualValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqualValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqualValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqualValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThanOrEqual on configInput', () => {
    test('With secondValueHostName, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "gte" with secondValueHostName, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThanOrEqual('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {

        let testItem = config().input('Field1', LookupKey.Integer).greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqual('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqual('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqual('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with GreaterThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').greaterThanOrEqual('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('stringLength on configInput', () => {
    test('With maximum, creates InputValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {

        let testItem = config().input('Field1').stringLength(4);
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                type: ConditionType.StringLength,
                maximum: 4
            }
        });
    });

    test('With minimum and maximum assigned, creates InputValidatorConfig with StringLengthCondition with type=StringLength, minimum assigned', () => {

        let testItem = config().input('Field1').stringLength(4, { minimum: 1 });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                type: ConditionType.StringLength,
                maximum: 4,
                minimum: 1
            }
        });
    });

    test('With only errorMessage creates InputValidatorConfig with StringLengthCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').stringLength(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                type: ConditionType.StringLength
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with StringLengthCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').stringLength(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                type: ConditionType.StringLength
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with StringLengthCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').stringLength(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                type: ConditionType.StringLength
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with StringLengthCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').stringLength(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                type: ConditionType.StringLength
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('requireText on configInput', () => {
    test('With no parameters, creates InputValidatorConfig with RequireTextCondition with type=RequireText', () => {

        let testItem = config().input('Field1').requireText();
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText
            }
        });
    });

    test('With nullValueResult=NoMatch assigned, creates InputValidatorConfig with RequireTextCondition with type=RequireText, nullValueResult=NoMatch', () => {

        let testItem = config().input('Field1').requireText({ nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText,
                nullValueResult: ConditionEvaluateResult.NoMatch
            }
        });
    });

    test('With only errorMessage creates InputValidatorConfig with RequireTextCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').requireText(null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with RequireTextCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').requireText(null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with RequireTextCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').requireText(null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with RequireTextCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').requireText(null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('notNull on configInput', () => {
    test('With no parameters, creates InputValidatorConfig with NotNullCondition with type=NotNull', () => {

        let testItem = config().input('Field1').notNull();
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                type: ConditionType.NotNull
            }
        });
    });

    test('With only errorMessage creates InputValidatorConfig with NotNullCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').notNull('Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                type: ConditionType.NotNull
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').notNull('Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                type: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').notNull(null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                type: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with NotNullCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').notNull('FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                type: ConditionType.NotNull
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('all on configInput', () => {
    test('With empty conditions, creates InputValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs=[]', () => {

        let testItem = config().input('Field1').all(config().conditions());
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: []
            }
        });
    });
    test('With conditions setup with requireText and regExp, creates InputValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs populated with both conditions', () => {

        let testItem = config().input('Field1').all(config().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            }
        });
    });

    test('With conditions setup with requireText and regExp, and errorMessage assigned creates InputValidatorConfig with AllMatchCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').all(config().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').all(config().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').all(config().conditions(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with AllMatchCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').all(config().conditions(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                type: ConditionType.All,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('any on configInput', () => {
    test('With empty conditions, creates InputValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs=[]', () => {

        let testItem = config().input('Field1').any(config().conditions());
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: []
            }
        });
    });
    test('With conditions setup with requireText and regExp, creates InputValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs populated with both conditions', () => {

        let testItem = config().input('Field1').any(config().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            }
        });
    });

    test('With conditions setup with requireText and regExp, and errorMessage assigned creates InputValidatorConfig with AnyMatchCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').any(config().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').any(config().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').any(config().conditions(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with AnyMatchCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').any(config().conditions(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                type: ConditionType.Any,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('countMatches on configInput', () => {
    test('With minimum and maximum assigned and empty conditions, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {

        let testItem = config().input('Field1').countMatches(1, 2, config().conditions());
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: []
            }
        });
    });
    test('With minimum assigned and empty conditions, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {

        let testItem = config().input('Field1').countMatches(1, null, config().conditions());
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 1,
                conditionConfigs: []
            }
        });
    });
    test('With maximum assigned and empty conditions, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {

        let testItem = config().input('Field1').countMatches(null, 2, config().conditions());
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                maximum: 2,
                conditionConfigs: []
            }
        });
    });    
    test('With conditions setup with requireText and regExp, creates InputValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {

        let testItem = config().input('Field1').countMatches(0, 2, config().conditions().requireText(null, 'F1').requireText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
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
            }
        });
    });

    test('With conditions setup with requireText and regExp, and errorMessage assigned creates InputValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage assigned', () => {

        let testItem = config().input('Field1').countMatches(1, 4, config().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 4,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').countMatches(1, 2, config().conditions().requireText(null, 'F1').requireText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: [<any>{
                    type: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequireText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = config().input('Field1').countMatches(null, null, config().conditions(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorConfig with CountMatchesMatchCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorConfig assigned', () => {

        let testItem = config().input('Field1').countMatches(null, null, config().conditions(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                type: ConditionType.CountMatches,
                conditionConfigs: []
            },
            errorMessage: 'FirstError'
        });
    });
});