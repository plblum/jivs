// import { LookupKey } from '../../src/DataTypes/LookupKeys';
// import { FieldValueHostConfig } from '../../src/Interfaces/FieldValueHost';
// import {
//     FluentBuilderBase, FluentValidatorBuilder,
//     FluentValidatorConfig, ValidationManagerStartFluent,
//     FluentConditionBuilder, FluentOneConditionBuilder
// } from "../../src/Builder/Fluent";
// import { ConditionType } from '../../src/Conditions/ConditionTypes';
// import { ValidatorConfig } from '../../src/Interfaces/Validator';
// import {
//     AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
//     EqualToConditionConfig, EqualToValueConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig, IntegerConditionConfig, LessThanConditionConfig,
//     LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig, MaxDecimalsConditionConfig, NotEqualToConditionConfig, NotEqualToValueConditionConfig, NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig,
//     RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig
// } from '../../src/Conditions/ConcreteConditions';
// import {
//     NotConditionConfig
// } from '../../src/Conditions/NotCondition';
// import { ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
// import { MockValidationServices } from '../TestSupport/mocks';
// import { WhenConditionConfig } from '../../src/Conditions/WhenCondition';
// import { ValidationSeverity } from '../../src/Interfaces/Validation';

// function createFluent(): ValidationManagerStartFluent {
//     return new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
// }
// function TestFluentValidatorBuilder(testItem: FluentBuilderBase,
//     expectedValConfig: ValidatorConfig) {

//     expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
//     let typedTextItem = testItem as FluentValidatorBuilder;
//     let config = typedTextItem.parentConfig as FieldValueHostConfig;
//     expect(config.validatorConfigs).not.toBeNull();
//     expect(config.validatorConfigs!.length).toBe(1);
//     let valConfig = config.validatorConfigs![0];
//     expect(valConfig).toEqual(expectedValConfig);
// }

// function createValidatorParamsAllProperties(): FluentValidatorConfig {
//     return <FluentValidatorConfig>
//         {
//             errorMessage: 'Error',
//             summaryMessage: 'Summary',
//             severity: ValidationSeverity.Error,
//             errorCode: 'E001', enabled: true,
//             errorMessagel10n: 'ErrorKey',
//             summaryMessagel10n: 'SummaryKey',
//             validatorType: 'Validator'
//         };
// }

// describe('dataTypeCheck as a validator of a field()', () => {
//     test('With no parameters creates ValidatorConfig with DataTypeCheckCondition with only type assigned', () => {

//         let testItem = createFluent().field('Field1').dataTypeCheck();
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <DataTypeCheckConditionConfig>{
//                 conditionType: ConditionType.DataTypeCheck
//             }
//         });
//     });
//     test('With only errorMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1').dataTypeCheck('Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <DataTypeCheckConditionConfig>{
//                 conditionType: ConditionType.DataTypeCheck
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // both errormessage and summarymessage parameters
//     test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').dataTypeCheck('Error', 'Summary' );
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <DataTypeCheckConditionConfig>{
//                 conditionType: ConditionType.DataTypeCheck
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // with null for errorMessage, 'summary'
//     test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').dataTypeCheck(null, 'Summary' );
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <DataTypeCheckConditionConfig>{
//                 conditionType: ConditionType.DataTypeCheck
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // with only null, which should be treated as no parameters, so no errorMessage or summaryMessage
//     test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {
//         let testItem = createFluent().field('Field1').dataTypeCheck(null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <DataTypeCheckConditionConfig>{
//                 conditionType: ConditionType.DataTypeCheck
//             }
//         });
//     });
//     // now focusing on the overload that takes one parameter, which is a FluentValidatorConfig
//     // It has many parameters, and we need to be sure all pass through
//     test('With FluentValidatorConfig with errorMessage and summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').dataTypeCheck({ errorMessage: 'Error', summaryMessage: 'Summary' });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <DataTypeCheckConditionConfig>{
//                 conditionType: ConditionType.DataTypeCheck
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // all properties assigned in FluentValidatorConfig
//     test('With FluentValidatorConfig with all of its properties assigned', () => {
//         let sourceProperties = createValidatorParamsAllProperties();

//         let testItem = createFluent().field('Field1').dataTypeCheck(sourceProperties);

//         // destProperties is a ValidatorConfig with conditionConfig of type DataTypeCheckConditionConfig, and all other properties from sourceProperties
//         // clone sourceProperties to destProperties, but add conditionConfig with type DataTypeCheckConditionConfig
//         let destProperties: ValidatorConfig = {
//             ...sourceProperties, conditionConfig:
//             {
//                 conditionType: ConditionType.DataTypeCheck
//             }
//         };        
//         TestFluentValidatorBuilder(testItem, destProperties);

//     });
//     // empty object
//     test('With FluentValidatorConfig with no properties assigned', () => {
//         let testItem = createFluent().field('Field1').dataTypeCheck({});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <DataTypeCheckConditionConfig>{
//                 conditionType: ConditionType.DataTypeCheck
//             }
//         });
//     });
// });

// describe('regExp as a validator of a field()', () => {
//     describe('regExp(string) use cases', () => {
//         // regExp(string)
//         test('regExp(string), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {

//             let testItem = createFluent().field('Field1').regExp('\\d');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d'
//                 }
//             });
//         });
//         // regExp(string, true)
//         test('regExp(string, true), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', true);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: true
//                 }
//             });
//         });
//         // regExp(string, false)
//         test('regExp(string, false), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', false);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{

//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: false
//                 }
//             });
//         });
//         // regExp(string, true, errorMessage)
//         test('regExp(string, true, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and errorMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', true, 'Error');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: true
//                 },
//                 errorMessage: 'Error'
//             });
//         });
//         // regExp(string, false, errorMessage)
//         test('regExp(string, false, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false and errorMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', false, 'Error');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{

//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: false
//                 },
//                 errorMessage: 'Error'
//             });
//         });
//         // regExp(string, true, errorMessage, summaryMessage)
//         test('regExp(string, true, errorMessage, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and errorMessage + summaryMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', true, 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: true
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         // regExp(string, true, null, summaryMessage)
//         test('regExp(string, true, null, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and summaryMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', true, null, 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: true
//                 },
//                 summaryMessage: 'Summary'
//             });
//         });
//         // regExp(string, undefined, string)
//         test('regExp(string, undefined, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', undefined, 'Error');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d'
//                 },
//                 errorMessage: 'Error'
//             });
//         });
//         // regExp(string, true, null)
//         test('regExp(string, true, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', true, null);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: true
//                 }
//             });
//         });
//         // regExp(string, false, null, null)
//         test('regExp(string, false, null, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', false, null, null);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: false
//                 }
//             });
//         });
//         // regExp(string, true, validatorParameters)
//         test('regExp(string, true, { errorMessage, summaryMessage }), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and errorMessage + summaryMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', true, { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: true
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         // regExp(string, false, validatorParameters)
//         test('regExp(string, false, { errorMessage, summaryMessage }), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false and errorMessage + summaryMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', false, { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: false
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         // regExp(string, true, {})
//         test('regExp(string, true, {}), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true', () => {
//             let testItem = createFluent().field('Field1').regExp('\\d', true, {});
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expressionAsString: '\\d',
//                     ignoreCase: true
//                 }
//             });
//         });
//     });
//     describe('regExp(RegExp) use cases', () => {
//         // basically the same test cases as regExp(string), but with RegExp instead of string, and ignoreCase is not a parameter, because it is part of the RegExp object
//         // regExp(RegExp)
//         test('regExp(RegExp), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/
//                 }
//             });
//         });
//         // regExp(RegExp, errorMessage)
//         test('regExp(RegExp, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/, 'Error');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/
//                 },
//                 errorMessage: 'Error'

//             });
//         });
//         // regExp(RegExp, errorMessage, summaryMessage)
//         test('regExp(RegExp, errorMessage, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/, 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         // regExp(RegExp, null, summaryMessage)
//         test('regExp(RegExp, null, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and summaryMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/, null, 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/
//                 },
//                 summaryMessage: 'Summary'
//             });
//         });
//         // regExp(RegExp, null, null)
//         test('regExp(RegExp, null, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/, null, null);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/
//                 }
//             });
//         });
//         // regExp(RegExp, null)
//         test('regExp(RegExp, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/, null);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/
//                 }
//             });
//         });
//         // regExp(RegExp, validatorParameters) with both condition and validator parameters.
//         // for condition parameters, use multiline: true
//         test('regExp(RegExp, validatorParameters) with both condition and validator parameters, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/,
//                 {
//                     errorMessage: 'Error',
//                     summaryMessage: 'Summary',
//                     multiline: true
//                 });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/,
//                     multiline: true
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         // regExp(RegExp, validatorParameters) with only condition parameters, no validator parameters.
//         test('regExp(RegExp, validatorParameters) with only condition parameters, no validator parameters, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/,
//                 {
//                     multiline: true
//                 });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/,
//                     multiline: true
//                 }
//             });
//         });
//         // regExp(RegExp, validatorParameters) with only validator parameters, no condition parameters.
//         test('regExp(RegExp, validatorParameters) with only validator parameters, no condition parameters, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
//             let testItem = createFluent().field('Field1').regExp(/\d/,
//                 {
//                     errorMessage: 'Error',
//                     summaryMessage: 'Summary'
//                 });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <RegExpConditionConfig>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /\d/
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });

//     });
// });

// describe('range as a validator of a field()', () => {
//     // range(1, 4)
//     test('range(1, 4), creates ValidatorConfig with RangeCondition with type=Range and minimum assigned', () => {

//         let testItem = createFluent().field('Field1', LookupKey.Integer).range(1, 4);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 minimum: 1,
//                 maximum: 4
//             }
//         });
//     });

//     test('range(1, null), creates ValidatorConfig with RangeCondition with type=Range, minimum assigned', () => {

//         let testItem = createFluent().field('Field1').range(1, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 minimum: 1
//             }
//         });
//     });
//     test('range(null, 4), creates ValidatorConfig with RangeCondition with type=Range, maximum assigned', () => {

//         let testItem = createFluent().field('Field1').range(null, 4);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 maximum: 4
//             }
//         });
//     });

//     test('range(null, null, "Error"), creates ValidatorConfig with RangeCondition with only type assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1').range(null, null, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range
//             },
//             errorMessage: 'Error'
//         });
//     });
//     test('range(1, 4, "Error"), creates ValidatorConfig with RangeCondition with only type assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1').range(1, 4, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 minimum: 1,
//                 maximum: 4
//             },
//             errorMessage: 'Error'
//         });
//     });    
//     test('range(1, 4, "Error", "Summary"), creates ValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').range(1, 4, 'Error',  'Summary' );
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 minimum: 1,
//                 maximum: 4
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('range(1, 4, null, "Summary"), creates ValidatorConfig with RangeCondition with only type assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').range(1, 4, null,  'Summary' );
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 minimum: 1,
//                 maximum: 4
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // range(1, 4, validatorParameters) 
//     // note that RangeCondition does not have any available parameters, so the validatorParameters will only be used for the ValidatorConfig, not the RangeConditionConfig
//     test('range(1, 4, validatorParameters), creates ValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').range(1, 4, {
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 minimum: 1,
//                 maximum: 4
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // range(1, 4, {})
//     test('range(1, 4, {}), creates ValidatorConfig with RangeCondition with only type assigned and no errorMessage or summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').range(1, 4, {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 minimum: 1,
//                 maximum: 4
//             }
//         });
//     });
//     // range(1, 4, null)
//     test('range(1, 4, null), creates ValidatorConfig with RangeCondition with only type assigned and no errorMessage or summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').range(1, 4, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range,
//                 minimum: 1,
//                 maximum: 4
//             }
//         });
//     });
//     // range(null, null, null)
//     test('range(null, null, null), creates ValidatorConfig with RangeCondition with only type assigned and no errorMessage or summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').range(null, null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RangeConditionConfig>{
//                 conditionType: ConditionType.Range
//             }
//         });
//     });

// });

// describe('equalToValue as a validator of a field()', () => {
//     test('equalToValue(1), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // equalToValue(1, null)
//     test('equalToValue(1, null), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // equalToValue(1, null, null)
//     test('equalToValue(1, null, null), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1, null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // equalToValue(null)
//     test('equalToValue(null), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue unassigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue
//             }
//         });
//     });
//     // equalToValue(undefined)
//     test('equalToValue(undefined), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(undefined);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue
//             }
//         });
//     });
//     // equalToValue(1, 'Error')
//     test('equalToValue(1, "Error"), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // equalToValue(1, 'Error', 'Summary')
//     test('equalToValue(1, "Error", "Summary"), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1, 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,  
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // equalToValue(1, null, 'Summary')
//     test('equalToValue(1, null, "Summary"), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1, null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // equalToValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('equalToValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1,
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary' 
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });

//     // equalToValue(1, { errorMessage: 'Error', summaryMessage: 'Summary', secondConversionLookupKey: 'key' })
//     test('equalToValue(1, { errorMessage: "Error", summaryMessage: "Summary", secondConversionLookupKey: "key" }), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and errorMessage + summaryMessage + secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1,
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary',
//                 secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1,
//                 secondConversionLookupKey: LookupKey.Integer
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // equalToValue(1, { secondConversionLookupKey: 'key' })
//     test('equalToValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1,
//             {
//                 secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1,
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // equalToValue(1, {})
//     test('equalToValue(1, {}), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).equalToValue(1, {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToValueConditionConfig>{
//                 conditionType: ConditionType.EqualToValue,
//                 secondValue: 1
//             }
//         });
//     });

//     describe('eqValue alias of equalToValue  Confirm overloaded interfaces', () => {
//         test('eqValue(1), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer).eqValue(1);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <EqualToValueConditionConfig>{
//                     conditionType: ConditionType.EqualToValue,
//                     secondValue: 1
//                 }
//             });
//         });
//         test('eqValue(1, errormessage, summarymessage), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .eqValue(1, 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <EqualToValueConditionConfig>{
//                     conditionType: ConditionType.EqualToValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('eqValue(1, { errormessage, summarymessage}), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .eqValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <EqualToValueConditionConfig>{
//                     conditionType: ConditionType.EqualToValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//     });
// });
// describe('equalTo as a validator of a field()', () => {
//     test('equalTo("Field2"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // equalTo("Field2", null)
//     test('equalTo("Field2", null), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2', null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // equalTo("Field2", null, null)
//     test('equalTo("Field2", null, null), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2', null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // equalTo("Field2", "Error")
//     test('equalTo("Field2", "Error"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2', 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // equalTo("Field2", "Error", "Summary")
//     test('equalTo("Field2", "Error", "Summary"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2', 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // equalTo("Field2", null, "Summary")
//     test('equalTo("Field2", null, "Summary"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2', null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2'
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // equalTo("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('equalTo("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2',
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // equalTo("Field2", { secondConversionLookupKey: 'key' })  
//     test('equalTo("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2',
//             {
//                 secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2',
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // equalTo("Field2", {})
//     test('equalTo("Field2", {}), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('Field2', {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // equalTo("")
//     test('equalTo(""), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').equalTo('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <EqualToConditionConfig>{
//                 conditionType: ConditionType.EqualTo,
//                 secondValueHostName: ''
//             }
//         });
//     });
//     describe('eq alias of equalTo  Confirm overloaded interfaces', () => {
//         test('eq("Field2"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer).eq('Field2');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <EqualToConditionConfig>{
//                     conditionType: ConditionType.EqualTo,
//                     secondValueHostName: 'Field2'
//                 }
//             });
//         });
//         test('eq("Field2", errormessage, summarymessage), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .eq("Field2", 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <EqualToConditionConfig>{
//                     conditionType: ConditionType.EqualTo,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('eq("Field2", { errormessage, summarymessage}), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .eq("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <EqualToConditionConfig>{
//                     conditionType: ConditionType.EqualTo,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//     });
// });

// describe('notEqualToValue as a validator of a field()', () => {
//     test('notEqualToValue(1), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // notEqualToValue(1, null)
//     test('notEqualToValue(1, null), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // notEqualToValue(1, null, null)
//     test('notEqualToValue(1, null, null), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1, null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1
//             }
//         });
//     }); 
//     // notEqualToValue(1, 'Error')
//     test('notEqualToValue(1, "Error"), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // notEqualToValue(1, 'Error', 'Summary')
//     test('notEqualToValue(1, "Error", "Summary"), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1, 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // notEqualToValue(1, null, 'Summary')
//     test('notEqualToValue(1, null, "Summary"), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1, null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // notEqualToValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('notEqualToValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1,
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // notEqualToValue(1, { secondConversionLookupKey: 'key' })
//     test('notEqualToValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1,
//             {
//                 secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1,
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // notEqualToValue(1, {})
//     test('notEqualToValue(1, {}), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(1, {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // notEqualToValue("")
//     test('notEqualToValue(""), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue,
//                 secondValue: ''
//             }
//         });
//     });
//     // notEqualToValue(null)
//     test('notEqualToValue(null), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue unassigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).notEqualToValue(null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToValueConditionConfig>{
//                 conditionType: ConditionType.NotEqualToValue
//             }
//         });
//     });
//     describe('neqValue alias of notEqualToValue  Confirm overloaded interfaces', () => {
//         test('neqValue(1), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer).neqValue(1);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <NotEqualToValueConditionConfig>{
//                     conditionType: ConditionType.NotEqualToValue,
//                     secondValue: 1
//                 }
//             });
//         });
//         test('neqValue(1, errormessage, summarymessage), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .neqValue(1, 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <NotEqualToValueConditionConfig>{
//                     conditionType: ConditionType.NotEqualToValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('neqValue(1, { errormessage, summarymessage}), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .neqValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <NotEqualToValueConditionConfig>{
//                     conditionType: ConditionType.NotEqualToValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//     });
// });
// describe('notEqualTo as a validator of a field()', () => {
//     test('notEqualTo("Field2"), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {

//         let testItem = createFluent().field('Field1').notEqualTo('Field2');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // notEqualTo("Field2", null)
//     test('notEqualTo("Field2", null), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').notEqualTo('Field2', null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // notEqualTo("Field2", null, null)
//     test('notEqualTo("Field2", null, null), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').notEqualTo('Field2', null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // notEqualTo("Field2", "Error")
//     test('notEqualTo("Field2", "Error"), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').notEqualTo('Field2', 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // notEqualTo("Field2", "Error", "Summary")
//     test('notEqualTo("Field2", "Error", "Summary"), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').notEqualTo('Field2', 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,    
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // notEqualTo("Field2", null, "Summary")
//     test('notEqualTo("Field2", null, "Summary"), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').notEqualTo('Field2', null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: 'Field2'
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // notEqualTo("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('notEqualTo("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {   
//         let testItem = createFluent().field('Field1').notEqualTo('Field2',
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // notEqualTo("Field2", { secondConversionLookupKey: 'key' })
//     test('notEqualTo("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1').notEqualTo('Field2',
//             {   
//             secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: 'Field2',
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // notEqualTo("Field2", {})
//     test('notEqualTo("Field2", {}), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').notEqualTo('Field2', {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // notEqualTo("")
//     test('notEqualTo(""), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').notEqualTo('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotEqualToConditionConfig>{
//                 conditionType: ConditionType.NotEqualTo,
//                 secondValueHostName: ''
//             }
//         });
//     });

// });
// describe('lessThanValue as a validator of a field()', () => {
//     test('lessThanValue(1), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // lessThanValue(1, null)
//     test('lessThanValue(1, null), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // lessThanValue(1, null, null)
//     test('lessThanValue(1, null, null), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1, null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // lessThanValue(1, 'Error')
//     test('lessThanValue(1, "Error"), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // lessThanValue(1, 'Error', 'Summary')
//     test('lessThanValue(1, "Error", "Summary"), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1, 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanValue(1, null, 'Summary')
//     test('lessThanValue(1, null, "Summary"), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1, null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('lessThanValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1,
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanValue(1, { secondConversionLookupKey: 'key' })
//     test('lessThanValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1,
//             {
//                 secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1,
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // lessThanValue(1, {})
//     test('lessThanValue(1, {}), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue(1, {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // lessThanValue("")
//     test('lessThanValue(""), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanValue('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanValueConditionConfig>{
//                 conditionType: ConditionType.LessThanValue,
//                 secondValue: ''
//             }
//         });
//     });
//     describe('ltValue alias of lessThanValue  Confirm overloaded interfaces', () => {
//         test('ltValue(1), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer).ltValue(1);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanValueConditionConfig>{
//                     conditionType: ConditionType.LessThanValue,
//                     secondValue: 1
//                 }
//             });
//         });
//         test('ltValue(1, errormessage, summarymessage), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .ltValue(1, 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanValueConditionConfig>{
//                     conditionType: ConditionType.LessThanValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('ltValue(1, { errormessage, summarymessage}), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .ltValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanValueConditionConfig>{
//                     conditionType: ConditionType.LessThanValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//     });

// });
// describe('lessThan as a validator of a field()', () => {
//     test('lessThan("Field2"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

//         let testItem = createFluent().field('Field1').lessThan('Field2');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // lessThan("Field2", null)
//     test('lessThan("Field2", null), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('Field2', null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // lessThan("Field2", null, null)
//     test('lessThan("Field2", null, null), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('Field2', null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // lessThan("Field2", "Error")
//     test('lessThan("Field2", "Error"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('Field2', 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // lessThan("Field2", "Error", "Summary")
//     test('lessThan("Field2", "Error", "Summary"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('Field2', 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThan("Field2", null, "Summary")
//     test('lessThan("Field2", null, "Summary"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('Field2', null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2'
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThan("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('lessThan("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('Field2',
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThan("Field2", { secondConversionLookupKey: 'key' })
//     test('lessThan("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('Field2',
//             {
//                 secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2',
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // lessThan("Field2", {})
//     test('lessThan("Field2", {}), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('Field2', {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // lessThan("")
//     test('lessThan(""), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').lessThan('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanConditionConfig>{
//                 conditionType: ConditionType.LessThan,
//                 secondValueHostName: ''
//             }
//         });
//     });
//     describe('lt alias of lessThan. Confirm overloaded interfaces', () => {
//         test('lt("Field2"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

//             let testItem = createFluent().field('Field1').lt('Field2');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanConditionConfig>{
//                     conditionType: ConditionType.LessThan,
//                     secondValueHostName: 'Field2'
//                 }
//             });
//         });
//         test('lt("Field2", errormessage, summarymessage), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

//             let testItem = createFluent().field('Field1').lt('Field2', 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanConditionConfig>{
//                     conditionType: ConditionType.LessThan,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('lt("Field2", { errormessage, summarymessage}), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

//             let testItem = createFluent().field('Field1').lt('Field2', { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanConditionConfig>{
//                     conditionType: ConditionType.LessThan,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });

//     });
// });
// describe('lessThanOrEqualValue as a validator of a field()', () => {
//     test('lessThanOrEqualValue(1), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {

//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // lessThanOrEqualValue(1, null)
//     test('lessThanOrEqualValue(1, null), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // lessThanOrEqualValue(1, null, null)
//     test('lessThanOrEqualValue(1, null, null), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // lessThanOrEqualValue(1, 'Error')
//     test('lessThanOrEqualValue(1, "Error"), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // lessThanOrEqualValue(1, 'Error', 'Summary')
//     test('lessThanOrEqualValue(1, "Error", "Summary"), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanOrEqualValue(1, null, 'Summary')
//     test('lessThanOrEqualValue(1, null, "Summary"), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanOrEqualValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('lessThanOrEqualValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1,
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanOrEqualValue(1, { secondConversionLookupKey: 'key' })
//     test('lessThanOrEqualValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1,
//             {
//                 secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1,
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // lessThanOrEqualValue(1, {})
//     test('lessThanOrEqualValue(1, {}), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // lessThanOrEqualValue("")
//     test('lessThanOrEqualValue(""), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).lessThanOrEqualValue('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqualValue,
//                 secondValue: ''
//             }
//         });
//     });
//     describe('lteValue alias of lessThanOrEqualValue. Confirm overloaded interfaces', () => {
//         test('lteValue(1), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer).lteValue(1);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                     conditionType: ConditionType.LessThanOrEqualValue,
//                     secondValue: 1
//                 }
//             });
//         });
//         test('lteValue(1, errormessage, summarymessage), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .lteValue(1, 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                     conditionType: ConditionType.LessThanOrEqualValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('lteValue(1, { errormessage, summarymessage}), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .lteValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanOrEqualValueConditionConfig>{
//                     conditionType: ConditionType.LessThanOrEqualValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });

//     });

// });
// describe('lessThanOrEqual as a validator of a field()', () => {
//     test('lessThanOrEqual("Field2"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // lessThanOrEqual("Field2", null)
//     test('lessThanOrEqual("Field2", null), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // lessThanOrEqual("Field2", null, null)
//     test('lessThanOrEqual("Field2", null, null), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // lessThanOrEqual("Field2", "Error")
//     test('lessThanOrEqual("Field2", "Error"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // lessThanOrEqual("Field2", "Error", "Summary")
//     test('lessThanOrEqual("Field2", "Error", "Summary"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanOrEqual("Field2", null, "Summary")
//     test('lessThanOrEqual("Field2", null, "Summary"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2'
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanOrEqual("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('lessThanOrEqual("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', {
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // lessThanOrEqual("Field2", { secondConversionLookupKey: 'key' })
//     test('lessThanOrEqual("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', {
//             secondConversionLookupKey: LookupKey.Integer
//         });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2',
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // lessThanOrEqual("Field2", {})
//     test('lessThanOrEqual("Field2", {}), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('Field2', {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // lessThanOrEqual("")
//     test('lessThanOrEqual(""), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').lessThanOrEqual('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <LessThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.LessThanOrEqual,
//                 secondValueHostName: ''
//             }
//         });
//     });
//     describe('lte alias of lessThanOrEqual. Confirm overloaded interfaces', () => {
//         test('lte("Field2"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').lte('Field2');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanOrEqualConditionConfig>{
//                     conditionType: ConditionType.LessThanOrEqual,
//                     secondValueHostName: 'Field2'
//                 }
//             });
//         });
//         test('lte("Field2", errormessage, summarymessage), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').lte('Field2', 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanOrEqualConditionConfig>{
//                     conditionType: ConditionType.LessThanOrEqual,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('lte("Field2", { errormessage, summarymessage}), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').lte('Field2', { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <LessThanOrEqualConditionConfig>{
//                     conditionType: ConditionType.LessThanOrEqual,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });

//     });

// });


// describe('greaterThanValue as a validator of a field()', () => {
//     test('greaterThanValue(1), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {

//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // greaterThanValue(1, null)
//     test('greaterThanValue(1, null), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // greaterThanValue(1, null, null)
//     test('greaterThanValue(1, null, null), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1, null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // greaterThanValue(1, 'Error')
//     test('greaterThanValue(1, "Error"), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // greaterThanValue(1, 'Error', 'Summary')
//     test('greaterThanValue(1, "Error", "Summary"), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1, 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanValue(1, null, 'Summary')
//     test('greaterThanValue(1, null, "Summary"), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1, null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('greaterThanValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1,
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanValue(1, { secondConversionLookupKey: 'key' })
//     test('greaterThanValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1,
//             {
//                 secondConversionLookupKey: LookupKey.Integer
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1,
//                 secondConversionLookupKey: LookupKey.Integer
//             }
//         });
//     });
//     // greaterThanValue(1, {})
//     test('greaterThanValue(1, {}), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(1, {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // greaterThanValue(null)
//     test('greaterThanValue(null), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue unassigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanValue(null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanValue
//             }
//         });
//     });
//     describe('gtValue alias of greaterThanValue. Confirm overloaded interfaces', () => {
//         test('gtValue(1), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer).gtValue(1);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanValueConditionConfig>{
//                     conditionType: ConditionType.GreaterThanValue,
//                     secondValue: 1
//                 }
//             });
//         });
//         test('gtValue(1, errormessage, summarymessage), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .gtValue(1, 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanValueConditionConfig>{
//                     conditionType: ConditionType.GreaterThanValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('gtValue(1, { errormessage, summarymessage}), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .gtValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanValueConditionConfig>{
//                     conditionType: ConditionType.GreaterThanValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });

//     });

// });

// describe('greaterThan as a validator of a field()', () => {
//     test('greaterThan("Field2"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

//         let testItem = createFluent().field('Field1').greaterThan('Field2');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // greaterThan("Field2", null)
//     test('greaterThan("Field2", null), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('Field2', null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // greaterThan("Field2", null, null)
//     test('greaterThan("Field2", null, null), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('Field2', null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // greaterThan("Field2", "Error")
//     test('greaterThan("Field2", "Error"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('Field2', 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // greaterThan("Field2", "Error", "Summary")
//     test('greaterThan("Field2", "Error", "Summary"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('Field2', 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThan("Field2", null, "Summary")
//     test('greaterThan("Field2", null, "Summary"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('Field2', null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2'
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThan("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('greaterThan("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('Field2', {
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThan("Field2", { secondConversionLookupKey: 'key' })
//     test('greaterThan("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('Field2', {
//             secondConversionLookupKey: 'key'
//         });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2',
//                 secondConversionLookupKey: 'key'
//             }
//         });
//     });
//     // greaterThan("Field2", {})
//     test('greaterThan("Field2", {}), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('Field2', {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // greaterThan("")
//     test('greaterThan(""), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThan('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanConditionConfig>{
//                 conditionType: ConditionType.GreaterThan,
//                 secondValueHostName: ''
//             }
//         });
//     });
//     describe('gt alias of greaterThan. Confirm overloaded interfaces', () => {
//         test('gt("Field2"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').gt('Field2');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanConditionConfig>{
//                     conditionType: ConditionType.GreaterThan,
//                     secondValueHostName: 'Field2'
//                 }
//             });
//         });
//         test('gt("Field2", errormessage, summarymessage), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').gt('Field2', 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanConditionConfig>{
//                     conditionType: ConditionType.GreaterThan,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('gt("Field2", { errormessage, summarymessage}), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').gt('Field2', { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanConditionConfig>{
//                     conditionType: ConditionType.GreaterThan,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//     });

// });
// describe('greaterThanOrEqualValue as a validator of a field()', () => {
//     test('greaterThanOrEqualValue(1), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {

//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // greaterThanOrEqualValue(1, null)
//     test('greaterThanOrEqualValue(1, null), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // greaterThanOrEqualValue(1, null, null)
//     test('greaterThanOrEqualValue(1, null, null), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // greaterThanOrEqualValue(1, 'Error')
//     test('greaterThanOrEqualValue(1, "Error"), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // greaterThanOrEqualValue(1, 'Error', 'Summary')
//     test('greaterThanOrEqualValue(1, "Error", "Summary"), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanOrEqualValue(1, null, 'Summary')
//     test('greaterThanOrEqualValue(1, null, "Summary"), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanOrEqualValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('greaterThanOrEqualValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1,
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanOrEqualValue(1, { secondConversionLookupKey: 'key' })
//     test('greaterThanOrEqualValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1,
//             {
//                 secondConversionLookupKey: 'key'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1,
//                 secondConversionLookupKey: 'key'
//             }
//         });
//     });
//     // greaterThanOrEqualValue(1, {})
//     test('greaterThanOrEqualValue(1, {}), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue,
//                 secondValue: 1
//             }
//         });
//     });
//     // greaterThanOrEqualValue(null)
//     test('greaterThanOrEqualValue(null), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue unassigned', () => {
//         let testItem = createFluent().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqualValue
//             }
//         });
//     });
//     describe('gteValue alias of greaterThanOrEqualValue. Confirm overloaded interfaces', () => {
//         test('gteValue(1), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer).gteValue(1);
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                     conditionType: ConditionType.GreaterThanOrEqualValue,
//                     secondValue: 1
//                 }
//             });
//         });
//         test('gteValue(1, errormessage, summarymessage), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .gteValue(1, 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                     conditionType: ConditionType.GreaterThanOrEqualValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('gteValue(1, { errormessage, summarymessage}), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
//             let testItem = createFluent().field('Field1', LookupKey.Integer)
//                 .gteValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
//                     conditionType: ConditionType.GreaterThanOrEqualValue,
//                     secondValue: 1
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });

//     });

// });
// describe('greaterThanOrEqual as a validator of a field()', () => {
//     test('greaterThanOrEqual("Field2"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });

//     // greaterThanOrEqual("Field2", null)
//     test('greaterThanOrEqual("Field2", null), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // greaterThanOrEqual("Field2", null, null)
//     test('greaterThanOrEqual("Field2", null, null), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // greaterThanOrEqual("Field2", "Error")
//     test('greaterThanOrEqual("Field2", "Error"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // greaterThanOrEqual("Field2", "Error", "Summary")
//     test('greaterThanOrEqual("Field2", "Error", "Summary"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanOrEqual("Field2", null, "Summary")
//     test('greaterThanOrEqual("Field2", null, "Summary"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2'
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanOrEqual("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
//     test('greaterThanOrEqual("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', {
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2'
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // greaterThanOrEqual("Field2", { secondConversionLookupKey: 'key' })
//     test('greaterThanOrEqual("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', {
//             secondConversionLookupKey: 'key'
//         });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2',
//                 secondConversionLookupKey: 'key'
//             }
//         });
//     });
//     // greaterThanOrEqual("Field2", {})
//     test('greaterThanOrEqual("Field2", {}), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2', {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: 'Field2'
//             }
//         });
//     });
//     // greaterThanOrEqual("")
//     test('greaterThanOrEqual(""), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
//         let testItem = createFluent().field('Field1').greaterThanOrEqual('');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                 conditionType: ConditionType.GreaterThanOrEqual,
//                 secondValueHostName: ''
//             }
//         });
//     });
//     describe('gte alias of greaterThanOrEqual. Confirm overloaded interfaces', () => {
//         test('gte("Field2"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').greaterThanOrEqual('Field2');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                     conditionType: ConditionType.GreaterThanOrEqual,
//                     secondValueHostName: 'Field2'
//                 }
//             });
//         });
//         test('gte("Field2", errormessage, summarymessage), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').gte('Field2', 'Error', 'Summary');
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                     conditionType: ConditionType.GreaterThanOrEqual,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });
//         test('gte("Field2", { errormessage, summarymessage}), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
//             let testItem = createFluent().field('Field1').gte('Field2', { errorMessage: 'Error', summaryMessage: 'Summary' });
//             TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//                 conditionConfig: <GreaterThanOrEqualConditionConfig>{
//                     conditionType: ConditionType.GreaterThanOrEqual,
//                     secondValueHostName: 'Field2'
//                 },
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         });

//     });

// });

// describe('stringLength as a validator of a field()', () => {
//     test('stringLength(4), creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(4);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength,
//                 maximum: 4
//             }
//         });
//     });

//     test('stringLength(4, { minimum: 1 }), creates ValidatorConfig with StringLengthCondition with type=StringLength, minimum assigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(4, { minimum: 1 });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength,
//                 maximum: 4,
//                 minimum: 1
//             }
//         });
//     });

//     // stringLength(4, 'Error')
//     test('stringLength(4, "Error"), creates ValidatorConfig with StringLengthCondition with type=StringLength, maximum assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(4, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength,
//                 maximum: 4
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // stringLength(4, 'Error', 'Summary')
//     test('stringLength(4, "Error", "Summary"), creates ValidatorConfig with StringLengthCondition with type=StringLength, maximum assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(4, 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength,
//                 maximum: 4
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // stringLength(4, null, 'Summary')
//     test('stringLength(4, null, "Summary"), creates ValidatorConfig with StringLengthCondition with type=StringLength, maximum assigned and summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(4, null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength,
//                 maximum: 4
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // stringLength(4, { errorMessage: 'Error', summaryMessage: 'Summary', minimum: 1 })
//     test('stringLength(4, { errorMessage: "Error", summaryMessage: "Summary", minimum: 1 }), creates ValidatorConfig with StringLengthCondition with type=StringLength, maximum assigned and errorMessage + summaryMessage + minimum assigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(4, { errorMessage: 'Error', summaryMessage: 'Summary', minimum: 1 });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength,
//                 maximum: 4,
//                 minimum: 1
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // stringLength(null)
//     test('stringLength(null), creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum unassigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength
//             }
//         });
//     });
//     // stringLength(null, null)
//     test('stringLength(null, null), creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum unassigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength
//             }
//         });
//     });
//     // stringLength(null, null, null)
//     test('stringLength(null, null, null), creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum unassigned', () => {

//         let testItem = createFluent().field('Field1').stringLength(null, null, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <StringLengthConditionConfig>{
//                 conditionType: ConditionType.StringLength
//             }
//         });
//     });
// });

// describe('requireText as a validator of a field()', () => {
//     test('requireText(), creates ValidatorConfig with RequireTextCondition with type=RequireText', () => {

//         let testItem = createFluent().field('Field1').requireText();
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText
//             }
//         });
//     });

//     test('requireText({ nullValueResult, errorMessage }), creates ValidatorConfig with RequireTextCondition with type=RequireText, nullValueResult=NoMatch', () => {

//         let testItem = createFluent().field('Field1').requireText({
//             nullValueResult: ConditionEvaluateResult.NoMatch,
//             errorMessage: 'Error',
//         });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText,
//                 nullValueResult: ConditionEvaluateResult.NoMatch
//             },
//             errorMessage: 'Error'
//         });
//     });

//     test('requireText(errorMessage), creates ValidatorConfig with RequireTextCondition with only type assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1').requireText('Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // requireText(errorMessage, summaryMessage)
//     test('requireText(errorMessage, summaryMessage), creates ValidatorConfig with RequireTextCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').requireText('Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // requireText(null, summaryMessage )
//     test('requireText(null, summaryMessage), creates ValidatorConfig with RequireTextCondition with only type assigned and summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').requireText(null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText
//             },
//             summaryMessage: 'Summary'
//         });
//     });

// });
// describe('notNull as a validator of a field()', () => {
//     test('notNull(), creates ValidatorConfig with NotNullCondition with type=NotNull', () => {

//         let testItem = createFluent().field('Field1').notNull();
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotNullConditionConfig>{
//                 conditionType: ConditionType.NotNull
//             }
//         });
//     });

//     test('notNull(errorMessage), creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1').notNull('Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotNullConditionConfig>{
//                 conditionType: ConditionType.NotNull
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // same also with summary message
//     test('notNull(errorMessage, summaryMessage), creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').notNull('Error', 'Summary' );
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotNullConditionConfig>{
//                 conditionType: ConditionType.NotNull
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });

//     test('notNull({ errorMessage, summaryMessage }), creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').notNull({ errorMessage: 'Error', summaryMessage: 'Summary' });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotNullConditionConfig>{
//                 conditionType: ConditionType.NotNull
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
// });

// describe('all as a validator of a field()', () => {
//     test('With empty conditions, creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs=[]', () => {

//         let testItem = createFluent().field('Field1').all(
//             (children) => []);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AllMatchConditionConfig>{
//                 conditionType: ConditionType.All,
//                 conditionConfigs: []
//             }
//         });
//     });
//     test('all((2 children), creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs populated with both conditions', () => {

//         let testItem = createFluent().field('Field1')
//             .all(
//                 (children) => [
//                     children.fieldValue('F1').requireText(),
//                     children.fieldValue('F2').requireText()
//                 ]);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AllMatchConditionConfig>{
//                 conditionType: ConditionType.All,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             }
//         });
//     });

//     test('all((2 children), "Error"), and errorMessage assigned creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1')
//             .all(
//                  (children) => [
//                     children.fieldValue('F1').requireText(),
//                     children.fieldValue('F2').requireText()
//                 ],
//                 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AllMatchConditionConfig>{
//                 conditionType: ConditionType.All,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             },
//             errorMessage: 'Error'
//         });
//     });
//     test('all((2 children), "Error", "Summary" ), creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1')
//             .all(
//                 (children) => [
//                     children.fieldValue('F1').requireText(),
//                     children.fieldValue('F2').requireText()
//                 ],
//                 'Error',
//                 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AllMatchConditionConfig>{
//                 conditionType: ConditionType.All,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('all((2 children), null, summary), creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').all(
//             (children) => [],
//             null,
//             'Summary' );
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AllMatchConditionConfig>{
//                 conditionType: ConditionType.All,
//                 conditionConfigs: []
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     test('all((0 children), { errorMessage, summaryMessage }), creates ValidatorConfig with AllMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

//         let testItem = createFluent().field('Field1').all(
//             (children) => [],
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AllMatchConditionConfig>{
//                 conditionType: ConditionType.All,
//                 conditionConfigs: []
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('Null as the function parameter throws', () => {
//         let fluent = createFluent();
//         expect(()=> fluent.field('Field1').all(null!, 'Error')).toThrow(/conditions/);
//     });
//     test('Non-function as the function parameter throws', () => {
//         let fluent = createFluent();
//         expect(() => fluent.field('Field1').all({} as any, 'Error')).toThrow(/Function expected/);
//     });    
// });
// describe('any as a validator of a field()', () => {
//     test('With empty conditions, creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs=[]', () => {

//         let testItem = createFluent().field('Field1').any(
//             (children) => []);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AnyMatchConditionConfig>{
//                 conditionType: ConditionType.Any,
//                 conditionConfigs: []
//             }
//         });
//     });
//     test('any((2 children)), creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs populated with both conditions', () => {

//         let testItem = createFluent().field('Field1').any(
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ]);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AnyMatchConditionConfig>{
//                 conditionType: ConditionType.Any,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             }
//         });
//     });

//     test('any((2 children), errormessage), and errorMessage assigned creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1').any(
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ],
//             'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AnyMatchConditionConfig>{
//                 conditionType: ConditionType.Any,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             },
//             errorMessage: 'Error'
//         });
//     });
//     test('any((2 children), error message, summary message) creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').any(
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ],
//             'Error',
//             'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AnyMatchConditionConfig>{
//                 conditionType: ConditionType.Any,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('any((0 children), null, summary message), parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').any(
//             (children) => [],
//             null,
//             'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AnyMatchConditionConfig>{
//                 conditionType: ConditionType.Any,
//                 conditionConfigs: []
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     test('any((0 children), { error message, summary message }), creates ValidatorConfig with AnyMatchCondition with only type assigned.', () => {

//         let testItem = createFluent().field('Field1').any(
//             (children) => [],
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <AnyMatchConditionConfig>{
//                 conditionType: ConditionType.Any,
//                 conditionConfigs: []
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('Null as the function parameter throws', () => {
//         let fluent = createFluent();
//         expect(()=> fluent.field('Field1').any(null!, 'Error')).toThrow(/conditions/);
//     });
//     test('Non-function as the function parameter throws', () => {
//         let fluent = createFluent();
//         expect(() => fluent.field('Field1').any({} as any, 'Error')).toThrow(/Function expected/);
//     });        
// });

// describe('countMatches as a validator of a field()', () => {
//     test('countMatches(1, 2, (0 children)), creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {

//         let testItem = createFluent().field('Field1').countMatches(1, 2,
//             (children) => []);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 minimum: 1,
//                 maximum: 2,
//                 conditionConfigs: []
//             }
//         });
//     });
//     test('countMatches(1, null, (0 children)), creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {
//         let testItem = createFluent().field('Field1').countMatches(1, null,
//             (children) => []);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 minimum: 1,
//                 conditionConfigs: []
//             }
//         });
//     });
//     test('countMatches(null, 2, (0 children)), creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {

//         let testItem = createFluent().field('Field1').countMatches(null, 2,
//             (children) => []);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 maximum: 2,
//                 conditionConfigs: []
//             }
//         });
//     });    
//     test('countMatches(0, 2, (2 children)), creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {

//         let testItem = createFluent().field('Field1').countMatches(0, 2,
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ]);

//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <CountMatchesConditionConfig>{
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
//             }
//         });
//     });

//     test('countMatches(1, 4, (2 children), error message), creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').countMatches(1, 4,
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ],
//             'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 minimum: 1,
//                 maximum: 4,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             },
//             errorMessage: 'Error'
//         });
//     });
//     test('countMatches(1, 2, (2 children), error message, summary message) creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').countMatches(1, 2,
//             (children) => [
//                 children.fieldValue('F1').requireText(),
//                 children.fieldValue('F2').requireText()
//             ],
//             'Error',
//             'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 minimum: 1,
//                 maximum: 2,
//                 conditionConfigs: [<any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 },
//                 {
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F2'
//                 }]
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('countMatches(1, 4, (0 children), { error message, summary error }), creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').countMatches(1, 2,
//             (children) => [],
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 conditionConfigs: [],
//                 minimum: 1,
//                 maximum: 2
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('countMatches(1, 2, (0 children), {}), creates ValidatorConfig with CountMatchesMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {
//         let testItem = createFluent().field('Field1').countMatches(1, 2,
//             (children) => [], 
//             {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <CountMatchesConditionConfig>{
//                 conditionType: ConditionType.CountMatches,
//                 conditionConfigs: [],
//                 minimum: 1,
//                 maximum: 2
//             },
//         });
//     });
//     test('Null as the function parameter throws', () => {
//         let fluent = createFluent();
//         expect(()=> fluent.field('Field1').countMatches(0, 1, null!, 'Error')).toThrow(/conditions/);
//     });
//     test('Non-function as the function parameter throws', () => {
//         let fluent = createFluent();
//         expect(() => fluent.field('Field1').countMatches(0, 1, {} as any, 'Error')).toThrow(/Function expected/);
//     });        
// });

// describe('positive as a validator of a field()', () => {
//     test('positive(), creates ValidatorConfig with PositiveCondition with type=Positive', () => {

//         let testItem = createFluent().field('Field1').positive();
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <PositiveConditionConfig>{
//                 conditionType: ConditionType.Positive
//             }
//         });
//     });
//     // positive(errorMessage)
//     test('positive(errorMessage), creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage assigned', () => {

//         let testItem = createFluent().field('Field1').positive('Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <PositiveConditionConfig>{
//                 conditionType: ConditionType.Positive
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // positive(errorMessage, summaryMessage)
//     test('positive(errorMessage, summaryMessage), creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1').positive('Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <PositiveConditionConfig>{
//                 conditionType: ConditionType.Positive
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // positive(null, summaryMessage)
//     test('positive(null, summaryMessage), creates ValidatorConfig with PositiveCondition with only type assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').positive(null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <PositiveConditionConfig>{
//                 conditionType: ConditionType.Positive
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // positive({ errorMessage, summaryMessage })
//     test('positive({ errorMessage, summaryMessage }), creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').positive(
//             {
//                 errorMessage: 'Error', summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <PositiveConditionConfig>{
//                 conditionType: ConditionType.Positive
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // positive({})
//     test('positive({}), creates ValidatorConfig with PositiveCondition with only type assigned', () => {
//         let testItem = createFluent().field('Field1').positive({});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <PositiveConditionConfig>{
//                 conditionType: ConditionType.Positive
//             }
//         });
//     });
//     // positive(null)
//     test('positive(null), creates ValidatorConfig with PositiveCondition with only type assigned', () => {
//         let testItem = createFluent().field('Field1').positive(null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <PositiveConditionConfig>{
//                 conditionType: ConditionType.Positive
//             }
//         });
//     });

// });
// describe('integer as a validator of a field()', () => {
//     test('integer(), creates ValidatorConfig with IntegerCondition with type=Integer', () => {

//         let testItem = createFluent().field('Field1').integer();
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <IntegerConditionConfig>{
//                 conditionType: ConditionType.Integer
//             }
//         });
//     });
//     // integer(errorMessage)
//     test('integer(errorMessage), creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').integer('Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <IntegerConditionConfig>{
//                 conditionType: ConditionType.Integer
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // integer(errorMessage, summaryMessage)
//     test('integer(errorMessage, summaryMessage), creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').integer('Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <IntegerConditionConfig>{
//                 conditionType: ConditionType.Integer
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // integer(null, summaryMessage)
//     test('integer(null, summaryMessage), creates ValidatorConfig with IntegerCondition with only type assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').integer(null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <IntegerConditionConfig>{
//                 conditionType: ConditionType.Integer
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // integer({ errorMessage, summaryMessage })
//     test('integer({ errorMessage, summaryMessage }), creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').integer(
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <IntegerConditionConfig>{
//                 conditionType: ConditionType.Integer
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // integer({})
//     test('integer({}), creates ValidatorConfig with IntegerCondition with only type assigned', () => {
//         let testItem = createFluent().field('Field1').integer({});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <IntegerConditionConfig>{
//                 conditionType: ConditionType.Integer
//             }
//         });
//     });
//     // integer(null)
//     test('integer(null), creates ValidatorConfig with IntegerCondition with only type assigned', () => {
//         let testItem = createFluent().field('Field1').integer(null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <IntegerConditionConfig>{
//                 conditionType: ConditionType.Integer
//             }
//         });
//     });

// });

// describe('maxDecimals as a validator of a field()', () => {
//     test('maxDecimals(2), creates ValidatorConfig with MaxDecimalsCondition with type=MaxDecimals', () => {

//         let testItem = createFluent().field('Field1').maxDecimals(2);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <MaxDecimalsConditionConfig>{
//                 conditionType: ConditionType.MaxDecimals,
//                 maxDecimals: 2
//             }
//         });
//     });
//     // maxDecimals(2, errorMessage)
//     test('maxDecimals(2, errorMessage), creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1').maxDecimals(2, 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <MaxDecimalsConditionConfig>{
//                 conditionType: ConditionType.MaxDecimals,
//                 maxDecimals: 2
//             },
//             errorMessage: 'Error'
//         });
//     });
//     // maxDecimals(2, errorMessage, summaryMessage)
//     test('maxDecimals(2, errorMessage, summaryMessage), creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').maxDecimals(2, 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <MaxDecimalsConditionConfig>{
//                 conditionType: ConditionType.MaxDecimals,
//                 maxDecimals: 2
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // maxDecimals(2, null, summaryMessage)
//     test('maxDecimals(2, null, summaryMessage), creates ValidatorConfig with MaxDecimalsCondition with only type assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').maxDecimals(2, null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <MaxDecimalsConditionConfig>{
//                 conditionType: ConditionType.MaxDecimals,
//                 maxDecimals: 2
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     // maxDecimals(2, { errorMessage, summaryMessage })
//     test('maxDecimals(2, { errorMessage, summaryMessage }), creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1').maxDecimals(2,
//             {
//                 errorMessage: 'Error',
//                 summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <MaxDecimalsConditionConfig>{
//                 conditionType: ConditionType.MaxDecimals,
//                 maxDecimals: 2
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // maxDecimals(2, {})
//     test('maxDecimals(2, {}), creates ValidatorConfig with MaxDecimalsCondition with only type assigned', () => {
//         let testItem = createFluent().field('Field1').maxDecimals(2, {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <MaxDecimalsConditionConfig>{
//                 conditionType: ConditionType.MaxDecimals,
//                 maxDecimals: 2
//             }
//         });
//     });
//     // maxDecimals(2, null)
//     test('maxDecimals(2, null), creates ValidatorConfig with MaxDecimalsCondition with only type assigned', () => {
//         let testItem = createFluent().field('Field1').maxDecimals(2, null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <MaxDecimalsConditionConfig>{
//                 conditionType: ConditionType.MaxDecimals,
//                 maxDecimals: 2
//             }
//         });
//     });


// });

// describe('not as a validator of a field()', () => {
//     test('not((0 children)), creates ValidatorConfig with NotCondition with type=Not and childConditionConfig={}', () => {
//         let testItem = createFluent().field('Field1').not(
//             (children) => new FluentOneConditionBuilder(null));
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotConditionConfig>{
//                 conditionType: ConditionType.Not,
//                 childConditionConfig: {}
//             }
//         });
//     });
//     test('not((1 child)), creates ValidatorConfig with NotCondition with type=Not and conditionConfigs populated', () => {
//         let testItem = createFluent().field('Field1')
//             .not((children) => children.fieldValue('F1').requireText());
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotConditionConfig>{
//                 conditionType: ConditionType.Not,
//                 childConditionConfig: <any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 }
//             }
//         });
//     });
//     test('not((1 child), error message) creates ValidatorConfig with NotCondition with only type assigned and errorMessage assigned', () => {
//         let testItem = createFluent().field('Field1')
//             .not(
//                 (children) => children.fieldValue('F1').requireText(),
//                 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotConditionConfig>{
//                 conditionType: ConditionType.Not,
//                 childConditionConfig: <any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 }
//             },
//             errorMessage: 'Error'
//         });
//     });
//     test('not((1 child), error message, summary message) creates ValidatorConfig with NotCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1')
//             .not(
//                 (children) => children.fieldValue('F1').requireText(),
//                 'Error',
//                 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotConditionConfig>{
//                 conditionType: ConditionType.Not,
//                 childConditionConfig: <any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 }
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('not((1 child), null, summary message) creates ValidatorConfig with NotCondition with only type assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1')
//             .not((children) => children.fieldValue('F1').requireText(),
//                 null,
//                 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotConditionConfig>{
//                 conditionType: ConditionType.Not,
//                 childConditionConfig: <any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 }
//             },

//             summaryMessage: 'Summary'
//         });
//     });    
//     test('not((0 children), { errormessage, summarymessage }) creates ValidatorConfig with NotCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent()
//             .field('Field1').not(
//                 (children) => new FluentOneConditionBuilder(null),
//                 { errorMessage: 'Error', summaryMessage: 'Summary' });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <NotConditionConfig>{
//                 conditionType: ConditionType.Not,
//                 childConditionConfig: {}
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });

//     test('When there are 2 child conditions, throws', () => {
//         expect(() => createFluent().field('Field1')
//             .not((children) => children.fieldValue('F1')
//                 .requireText()
//                 .requireText())).toThrow();
//     });    
//     test('Null as the function parameter throws', () => {
//         let fluent = createFluent();
//         expect(()=> fluent.field('Field1').not(null!, 'Error')).toThrow(/childBuilder/);
//     });
//     test('Non-function as the function parameter throws', () => {
//         let fluent = createFluent();
//         expect(() => fluent.field('Field1').not({} as any, 'Error')).toThrow(/Function expected/);
//     });    
// });

// describe('when as a validator of a field()', () => {
//     test('when((no when), (no then)), creates ValidatorConfig with WhenCondition with type=When, whenToEnableConfig={} and childConditionConfig={}', () => {

//         let testItem = createFluent().field('Field1').when(
//             (whenBuilder) => new FluentOneConditionBuilder(null),
//             (thenBuilder) => new FluentOneConditionBuilder(null));
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <WhenConditionConfig>{
//                 conditionType: ConditionType.When,
//                 whenToEnableConfig: {},
//                 thenConfig: {}
//             }
//         });
//     });
//     test('when((cond), (cond)), creates ValidatorConfig with WhenCondition with type=When and both whenToEnableConfig and childConditionConfigs populated', () => {

//         let testItem = createFluent().field('Field1')
//             .when(
//                 (whenBuilder) => whenBuilder.parentValue().regExp(/abc/),
//                 (thenBuilder) => thenBuilder.fieldValue('F1').requireText());
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <WhenConditionConfig>{
//                 conditionType: ConditionType.When,
//                 whenToEnableConfig: <any>{
//                     conditionType: ConditionType.RegExp,
//                     expression: /abc/
//                 },
//                 thenConfig: <any>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'F1'
//                 }
//             }
//         });
//     });
//     test('when((cond), (cond), error message) creates ValidatorConfig with WhenCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1')
//             .when(
//                 (whenBuilder)=> whenBuilder.fieldValue('F2').regExp(/abc/),
//                 (thenBuilder) => thenBuilder.fieldValue('F1').requireText(),
//                 'Error');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <WhenConditionConfig>{
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
//             },
//             errorMessage: 'Error'
//         });
//     });

//     // when((cond), (cond), error message, summary message)
//     test('when((cond), (cond), error message, summary message) creates ValidatorConfig with WhenCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

//         let testItem = createFluent().field('Field1')
//             .when(
//                 (whenBuilder)=> whenBuilder.fieldValue('F2').regExp(/abc/),
//                 (thenBuilder) => thenBuilder.fieldValue('F1').requireText(),   
//                 'Error', 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <WhenConditionConfig>{
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
//             },
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     test('when((cond), (cond), null, summary message) creates ValidatorConfig with WhenCondition with only type assigned and summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1')
//             .when(
//                 (whenBuilder)=> whenBuilder.fieldValue('F2').regExp(/abc/),
//                 (thenBuilder) => thenBuilder.fieldValue('F1').requireText(),   
//                 null, 'Summary');
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <WhenConditionConfig>{
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
//             },
//             summaryMessage: 'Summary'
//         });
//     });
//     test('when((0 children), (0 children), { error message, summary message }) creates ValidatorConfig with WhenCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
//         let testItem = createFluent().field('Field1')
//             .when((whenBuilder)=> new FluentConditionBuilder(null),
//                 (thenBuilder) => new FluentConditionBuilder(null),
//             {
//                     errorMessage: 'Error',
//                     summaryMessage: 'Summary'
//             });
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <WhenConditionConfig>{
//                 conditionType: ConditionType.When, 
//                 whenToEnableConfig: {},
//                 thenConfig: {}
//             },  
//             errorMessage: 'Error',
//             summaryMessage: 'Summary'
//         });
//     });
//     // when((0 children), (0 children), {}) creates ValidatorConfig with WhenCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned
//     test('when((0 children), (0 children), {}) creates ValidatorConfig with WhenCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {
//         let testItem = createFluent().field('Field1')
//             .when((whenBuilder)=> new FluentConditionBuilder(null),
//                 (thenBuilder) => new FluentConditionBuilder(null),
//                 {});
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
//             conditionConfig: <WhenConditionConfig>{
//                 conditionType: ConditionType.When, 
//                 whenToEnableConfig: {},
//                 thenConfig: {}
//             }
//         });
//     });
//     // when((0 children), (0 children), null) creates ValidatorConfig with WhenCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned
//     test('when((0 children), (0 children), null) creates ValidatorConfig with WhenCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {
//         let testItem = createFluent().field('Field1')
//             .when((whenBuilder)=> new FluentConditionBuilder(null),
//                 (thenBuilder) => new FluentConditionBuilder(null),
//                 null);
//         TestFluentValidatorBuilder(testItem, <ValidatorConfig>{ 
//             conditionConfig: <WhenConditionConfig>{
//                 conditionType: ConditionType.When, 
//                 whenToEnableConfig: {},
//                 thenConfig: {}
//             }
//         });
//     });

//     test('When there are 2 child conditions, throws', () => {
//         expect(() => createFluent().field('Field1')
//             .when((whenBuilder)=> new FluentConditionBuilder(null),
//                 (thenBuilder) => thenBuilder.fieldValue('F1')
//                     .requireText()
//                     .requireText()
//             )).toThrow();
//     });    
//     test('When there are 2 enabler conditions, throws', () => {
//         expect(() => createFluent().field('Field1')
//             .when(
//                 (whenBuilder) => whenBuilder.parentValue()
//                     .requireText()
//                     .requireText(),
//                 (thenBuilder) => new FluentConditionBuilder(null))).toThrow();
//     });        
//     test('Null as the whenToEnable function parameter throws', () => {
//         let fluent = createFluent();
//         expect(() => fluent.field('Field1').when(null!, (thenBuilder) => new FluentConditionBuilder(null),
//             'Error')).toThrow(/whenBuilder/);
//     });
//     test('Null as the then condition function parameter throws', () => {
//         let fluent = createFluent();
//         expect(() => fluent.field('Field1').when(
//             (whenBuilder) => new FluentConditionBuilder(null),
//             null!,  // then
//             'Error')).toThrow(/thenBuilder/);
//     });    
//     test('Non-function as the child function parameter throws', () => {
//         let fluent = createFluent();
//         expect(() => fluent.field('Field1').when(
//             (whenBuilder) => new FluentConditionBuilder(null),
//             {} as any,
//             'Error')).toThrow(/Function expected/);
//     });    
//     test('Non-function as the enabler function parameter throws', () => {
//         let fluent = createFluent();
//         expect(() => fluent.field('Field1').when(
//             {} as any,  // when
//             (thenBuilder) => new FluentConditionBuilder(null),
//             'Error')).toThrow(/Function expected/);
//     });        
// });
