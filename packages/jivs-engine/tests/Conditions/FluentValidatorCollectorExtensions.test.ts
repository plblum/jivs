import { LookupKey } from './../../src/DataTypes/LookupKeys';
import { InputValueHostDescriptor } from '../../src/Interfaces/InputValueHost';
import { FluentCollectorBase, FluentValidatorCollector, configChildren, configInput } from "../../src/ValueHosts/Fluent";
import { initFluent } from "../../src/Conditions/FluentValidatorCollectorExtensions";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { InputValidatorDescriptor } from '../../src/Interfaces/InputValidator';
import { AllMatchConditionDescriptor, AnyMatchConditionDescriptor, CountMatchesConditionDescriptor, DataTypeCheckConditionDescriptor, EqualToConditionDescriptor, GreaterThanConditionDescriptor, GreaterThanOrEqualConditionDescriptor, LessThanConditionDescriptor, LessThanOrEqualConditionDescriptor, NotEqualToConditionDescriptor, NotNullConditionDescriptor, RangeConditionDescriptor, RegExpConditionDescriptor, RequiredTextConditionDescriptor, StringLengthConditionDescriptor, StringNotEmptyConditionDescriptor } from '../../src/Conditions/ConcreteConditions';
import { ConditionEvaluateResult } from '../../src/Interfaces/Conditions';

function TestFluentValidatorCollector(testItem: FluentCollectorBase,
    expectedValDescriptor: InputValidatorDescriptor) {

    expect(testItem).toBeInstanceOf(FluentValidatorCollector);
    let typedTextItem = testItem as FluentValidatorCollector;
    let descriptor = typedTextItem.descriptor as InputValueHostDescriptor;
    expect(descriptor.validatorDescriptors).not.toBeNull();
    expect(descriptor.validatorDescriptors!.length).toBe(1);
    let valDescriptor = descriptor.validatorDescriptors![0];
    expect(valDescriptor).toEqual(expectedValDescriptor);
}

describe('dataTypeCheck on configInput', () => {
    test('With no parameters creates InputValidatorDescriptor with DataTypeCheckCondition with only type assigned', () => {
        initFluent();
        let testItem = configInput('Field1').dataTypeCheck();
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <DataTypeCheckConditionDescriptor>{
                type: ConditionType.DataTypeCheck
            }
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').dataTypeCheck('Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <DataTypeCheckConditionDescriptor>{
                type: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').dataTypeCheck('Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <DataTypeCheckConditionDescriptor>{
                type: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').dataTypeCheck(null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <DataTypeCheckConditionDescriptor>{
                type: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with DataTypeCheckCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').dataTypeCheck('FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <DataTypeCheckConditionDescriptor>{
                type: ConditionType.DataTypeCheck
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('regExp on configInput', () => {
    test('With expression assigned to a string, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp('\\d');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp,
                expressionAsString: '\\d'
            }
        });
    });
    test('With expression assigned to a RegExp, creates InputValidatorDescriptor with RegExpCondition with type=RegExp and expression assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp(/\d/i);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp,
                expression: /\d/i
            }
        });
    });
    test('With expression and ignoreCase=true creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=true assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp('\\d', true);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp,
                expressionAsString: '\\d',
                ignoreCase: true
            }
        });
    });
    test('With expression and ignoreCase=false creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and ignoreCase=false assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp('\\d', false);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp,
                expressionAsString: '\\d',
                ignoreCase: false
            }
        });
    });
    test('With expression as text, ignoreCase=null, and ivParam with not=true, creates InputValidatorDescriptor with RegExpCondition with type=RegExp, expressionAsString, and not=true assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp('\\d', null, { not: true });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp,
                expressionAsString: '\\d',
                not: true
            }
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with RegExpCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp(null, null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RegExpCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp(null, null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RegExpCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp(null, null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RegExpCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').regExp(null, null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RegExpConditionDescriptor>{
                type: ConditionType.RegExp
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('range on configInput', () => {
    test('With minimum and maximum, creates InputValidatorDescriptor with RangeCondition with type=Range and minimum assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).range(1, 4);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RangeConditionDescriptor>{
                type: ConditionType.Range,
                minimum: 1,
                maximum: 4
            }
        });
    });

    test('With minimum assigned and maximum=null, creates InputValidatorDescriptor with RangeCondition with type=Range, minimum assigned', () => {
        initFluent();
        let testItem = configInput('Field1').range(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RangeConditionDescriptor>{
                type: ConditionType.Range,
                minimum: 1
            }
        });
    });
    test('With maximum assigned and minimum=null, creates InputValidatorDescriptor with RangeCondition with type=Range, maximum assigned', () => {
        initFluent();
        let testItem = configInput('Field1').range(null, 4);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RangeConditionDescriptor>{
                type: ConditionType.Range,
                maximum: 4
            }
        });
    });

    test('With only errorMessage creates InputValidatorDescriptor with RangeCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').range(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RangeConditionDescriptor>{
                type: ConditionType.Range
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').range(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RangeConditionDescriptor>{
                type: ConditionType.Range
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').range(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RangeConditionDescriptor>{
                type: ConditionType.Range
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RangeCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').range(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RangeConditionDescriptor>{
                type: ConditionType.Range
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('equalToValue on configInput', () => {
    test('With secondValue, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).equalToValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).equalToValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).equalToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with EqualToCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalToValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalToValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalToValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with EqualToCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalToValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('equalTo on configInput', () => {
    test('With secondValueHostName, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalTo('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).equalTo('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with EqualToCondition with type=EqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).equalTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorDescriptor with EqualToCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalTo('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalTo('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with EqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalTo('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with EqualToCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').equalTo('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <EqualToConditionDescriptor>{
                type: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('notEqualToValue on configInput', () => {
    test('With secondValue, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).notEqualToValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).notEqualToValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).notEqualToValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with NotEqualToCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualToValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualToValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualToValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotEqualToCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualToValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('notEqualTo on configInput', () => {
    test('With secondValueHostName, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualTo('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).notEqualTo('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with NotEqualToCondition with type=NotEqualTo, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).notEqualTo('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorDescriptor with NotEqualToCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualTo('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualTo('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotEqualToCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualTo('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotEqualToCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notEqualTo('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotEqualToConditionDescriptor>{
                type: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanValue on configInput', () => {
    test('With secondValue, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThanValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "ltValue" With secondValue, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).ltValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValue: 1
            }
        });
    });

    test('With secondValue assigned and condDesc=null, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThanValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with LessThanCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThan on configInput', () => {
    test('With secondValueHostName, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThan('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('SShorthand version "lt" With secondValueHostName, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lt('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorDescriptor with LessThanCondition with type=LessThan and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThan('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanCondition with type=LessThan, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorDescriptor with LessThanCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThan('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThan('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThan('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThan('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanConditionDescriptor>{
                type: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanOrEqualValue on configInput', () => {
    test('With secondValue, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThanOrEqualValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('Shorthand version, "lteValue", With secondValue, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lteValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with LessThanOrEqualCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqualValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqualValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqualValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqualValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('lessThanOrEqual on configInput', () => {
    test('With secondValueHostName, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "lte" With secondValueHostName, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lte('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });


    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThanOrEqual('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with LessThanOrEqualCondition with type=LessThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).lessThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorDescriptor with LessThanOrEqualCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqual('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqual('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqual('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with LessThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').lessThanOrEqual('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <LessThanOrEqualConditionDescriptor>{
                type: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});


describe('greaterThanValue on configInput', () => {
    test('With secondValue, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThanValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "gtValue" With secondValue, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).gtValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValue: 1
            }
        });
    });

    test('With secondValue assigned and condDesc=null, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThanValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThanValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with GreaterThanCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThan on configInput', () => {
    test('With secondValueHostName, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThan('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "gt" with secondValueHostName, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').gt('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThan('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanCondition with type=GreaterThan, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThan('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorDescriptor with GreaterThanCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThan('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThan('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThan('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThan('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanConditionDescriptor>{
                type: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThanOrEqualValue on configInput', () => {
    test('With secondValue, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThanOrEqualValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('Shorthand version "gteValue" With secondValue, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).gteValue(1);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('With secondValue assigned and condDesc=null, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValue: 1
            }
        });
    });
    test('With secondValue and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValue: 1,
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    test('With only errorMessage creates InputValidatorDescriptor with GreaterThanOrEqualCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqualValue(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqualValue(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqualValue(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqualValue(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('greaterThanOrEqual on configInput', () => {
    test('With secondValueHostName, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('Shorthand version "gte" with secondValueHostName, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqual('Field2');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });

    test('With secondValueHostName assigned and condDesc=null, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValue assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThanOrEqual('Field2', null);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    test('With secondValueHostName and secondConversionLookupKey assigned, creates InputValidatorDescriptor with GreaterThanOrEqualCondition with type=GreaterThanOrEqual, secondValue, and secondConversionLookupKey assigned', () => {
        initFluent();
        let testItem = configInput('Field1', LookupKey.Integer).greaterThanOrEqual('Field2', { conversionLookupKey: LookupKey.Integer, secondConversionLookupKey: LookupKey.Integer });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2',
                conversionLookupKey: LookupKey.Integer,
                secondConversionLookupKey: LookupKey.Integer
            }
        })
    });
    test('With only errorMessage creates InputValidatorDescriptor with GreaterThanOrEqualCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqual('Field2', null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqual('Field2', null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanOrEqualCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqual('Field2', null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with GreaterThanOrEqualCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').greaterThanOrEqual('Field2', null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <GreaterThanOrEqualConditionDescriptor>{
                type: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('stringLength on configInput', () => {
    test('With maximum, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength and maximum assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringLength(4);
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringLengthConditionDescriptor>{
                type: ConditionType.StringLength,
                maximum: 4
            }
        });
    });

    test('With minimum and maximum assigned, creates InputValidatorDescriptor with StringLengthCondition with type=StringLength, minimum assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringLength(4, { minimum: 1 });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringLengthConditionDescriptor>{
                type: ConditionType.StringLength,
                maximum: 4,
                minimum: 1
            }
        });
    });

    test('With only errorMessage creates InputValidatorDescriptor with StringLengthCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringLength(null, null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringLengthConditionDescriptor>{
                type: ConditionType.StringLength
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with StringLengthCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringLength(null, null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringLengthConditionDescriptor>{
                type: ConditionType.StringLength
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with StringLengthCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringLength(null, null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringLengthConditionDescriptor>{
                type: ConditionType.StringLength
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with StringLengthCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringLength(null, null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringLengthConditionDescriptor>{
                type: ConditionType.StringLength
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('stringNotEmpty on configInput', () => {
    test('With no parameters, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty', () => {
        initFluent();
        let testItem = configInput('Field1').stringNotEmpty();
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringNotEmptyConditionDescriptor>{
                type: ConditionType.StringNotEmpty
            }
        });
    });

    test('With nullValueResult assigned, creates InputValidatorDescriptor with StringNotEmptyCondition with type=StringNotEmpty, nullValueResult assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringNotEmpty({ nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringNotEmptyConditionDescriptor>{
                type: ConditionType.StringNotEmpty,
                nullValueResult: ConditionEvaluateResult.NoMatch
            }
        });
    });

    test('With only errorMessage creates InputValidatorDescriptor with StringNotEmptyCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringNotEmpty(null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringNotEmptyConditionDescriptor>{
                type: ConditionType.StringNotEmpty
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with StringNotEmptyCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringNotEmpty(null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringNotEmptyConditionDescriptor>{
                type: ConditionType.StringNotEmpty
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with StringNotEmptyCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringNotEmpty(null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringNotEmptyConditionDescriptor>{
                type: ConditionType.StringNotEmpty
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with StringNotEmptyCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').stringNotEmpty(null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <StringNotEmptyConditionDescriptor>{
                type: ConditionType.StringNotEmpty
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('requiredText on configInput', () => {
    test('With no parameters, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText', () => {
        initFluent();
        let testItem = configInput('Field1').requiredText();
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText
            }
        });
    });

    test('With emptyValue and nullValueResult assigned, creates InputValidatorDescriptor with RequiredTextCondition with type=RequiredText, emptyValue, nullValueResult assigned', () => {
        initFluent();
        let testItem = configInput('Field1').requiredText({ emptyValue: 'X', nullValueResult: ConditionEvaluateResult.NoMatch });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText,
                emptyValue: 'X',
                nullValueResult: ConditionEvaluateResult.NoMatch
            }
        });
    });

    test('With only errorMessage creates InputValidatorDescriptor with RequiredTextCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').requiredText(null, 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RequiredTextCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').requiredText(null, 'Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RequiredTextCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').requiredText(null, null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with RequiredTextCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').requiredText(null, 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('notNull on configInput', () => {
    test('With no parameters, creates InputValidatorDescriptor with NotNullCondition with type=NotNull', () => {
        initFluent();
        let testItem = configInput('Field1').notNull();
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotNullConditionDescriptor>{
                type: ConditionType.NotNull
            }
        });
    });

    test('With only errorMessage creates InputValidatorDescriptor with NotNullCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notNull('Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotNullConditionDescriptor>{
                type: ConditionType.NotNull
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notNull('Error', { summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotNullConditionDescriptor>{
                type: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notNull(null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotNullConditionDescriptor>{
                type: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with NotNullCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').notNull('FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <NotNullConditionDescriptor>{
                type: ConditionType.NotNull
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('all on configInput', () => {
    test('With empty configChildren, creates InputValidatorDescriptor with AllMatchCondition with type=AllMatch and conditionDescriptors=[]', () => {
        initFluent();
        let testItem = configInput('Field1').all(configChildren());
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AllMatchConditionDescriptor>{
                type: ConditionType.All,
                conditionDescriptors: []
            }
        });
    });
    test('With configChildren setup with requiredText and regExp, creates InputValidatorDescriptor with AllMatchCondition with type=AllMatch and conditionDescriptors populated with both conditions', () => {
        initFluent();
        let testItem = configInput('Field1').all(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AllMatchConditionDescriptor>{
                type: ConditionType.All,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            }
        });
    });

    test('With configChildren setup with requiredText and regExp, and errorMessage assigned creates InputValidatorDescriptor with AllMatchCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').all(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AllMatchConditionDescriptor>{
                type: ConditionType.All,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').all(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AllMatchConditionDescriptor>{
                type: ConditionType.All,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').all(configChildren(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AllMatchConditionDescriptor>{
                type: ConditionType.All,
                conditionDescriptors: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with AllMatchCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').all(configChildren(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AllMatchConditionDescriptor>{
                type: ConditionType.All,
                conditionDescriptors: []
            },
            errorMessage: 'FirstError'
        });
    });
});
describe('any on configInput', () => {
    test('With empty configChildren, creates InputValidatorDescriptor with AnyMatchCondition with type=AnyMatch and conditionDescriptors=[]', () => {
        initFluent();
        let testItem = configInput('Field1').any(configChildren());
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AnyMatchConditionDescriptor>{
                type: ConditionType.Any,
                conditionDescriptors: []
            }
        });
    });
    test('With configChildren setup with requiredText and regExp, creates InputValidatorDescriptor with AnyMatchCondition with type=AnyMatch and conditionDescriptors populated with both conditions', () => {
        initFluent();
        let testItem = configInput('Field1').any(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AnyMatchConditionDescriptor>{
                type: ConditionType.Any,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            }
        });
    });

    test('With configChildren setup with requiredText and regExp, and errorMessage assigned creates InputValidatorDescriptor with AnyMatchCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').any(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AnyMatchConditionDescriptor>{
                type: ConditionType.Any,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').any(configChildren().requiredText(null, 'F1').requiredText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AnyMatchConditionDescriptor>{
                type: ConditionType.Any,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').any(configChildren(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AnyMatchConditionDescriptor>{
                type: ConditionType.Any,
                conditionDescriptors: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with AnyMatchCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').any(configChildren(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <AnyMatchConditionDescriptor>{
                type: ConditionType.Any,
                conditionDescriptors: []
            },
            errorMessage: 'FirstError'
        });
    });
});

describe('countMatches on configInput', () => {
    test('With minimum and maximum assigned and empty configChildren, creates InputValidatorDescriptor with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionDescriptors=[]', () => {
        initFluent();
        let testItem = configInput('Field1').countMatches(1, 2, configChildren());
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionDescriptors: []
            }
        });
    });
    test('With minimum assigned and empty configChildren, creates InputValidatorDescriptor with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionDescriptors=[]', () => {
        initFluent();
        let testItem = configInput('Field1').countMatches(1, null, configChildren());
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                minimum: 1,
                conditionDescriptors: []
            }
        });
    });
    test('With maximum assigned and empty configChildren, creates InputValidatorDescriptor with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionDescriptors=[]', () => {
        initFluent();
        let testItem = configInput('Field1').countMatches(null, 2, configChildren());
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                maximum: 2,
                conditionDescriptors: []
            }
        });
    });    
    test('With configChildren setup with requiredText and regExp, creates InputValidatorDescriptor with CountMatchesMatchCondition with type=CountMatchesMatch and conditionDescriptors populated with both conditions', () => {
        initFluent();
        let testItem = configInput('Field1').countMatches(0, 2, configChildren().requiredText(null, 'F1').requiredText(null, 'F2'));
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <CountMatchesConditionDescriptor>{
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
            }
        });
    });

    test('With configChildren setup with requiredText and regExp, and errorMessage assigned creates InputValidatorDescriptor with CountMatchesMatchCondition with only type assigned and errorMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').countMatches(1, 4, configChildren().requiredText(null, 'F1').requiredText(null, 'F2'), 'Error');
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 4,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error'
        });
    });
    test('With errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').countMatches(1, 2, configChildren().requiredText(null, 'F1').requiredText(null, 'F2'), 'Error', { summaryMessage: 'Summary'});
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionDescriptors: [<any>{
                    type: ConditionType.RequiredText,
                    valueHostName: 'F1'
                },
                {
                    type: ConditionType.RequiredText,
                    valueHostName: 'F2'
                }]
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        initFluent();
        let testItem = configInput('Field1').countMatches(null, null, configChildren(), null, { errorMessage: 'Error', summaryMessage: 'Summary' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                conditionDescriptors: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates InputValidatorDescriptor with CountMatchesMatchCondition with only type assigned. ErrorMessage is from first parameter, not inputValidatorDescriptor assigned', () => {
        initFluent();
        let testItem = configInput('Field1').countMatches(null, null, configChildren(), 'FirstError', { errorMessage: 'SecondError' });
        TestFluentValidatorCollector(testItem, <InputValidatorDescriptor>{
            conditionDescriptor: <CountMatchesConditionDescriptor>{
                type: ConditionType.CountMatches,
                conditionDescriptors: []
            },
            errorMessage: 'FirstError'
        });
    });
});