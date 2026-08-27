import
    {
        EqualToConditionConfig, EqualToValueConditionConfig,
        GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, GreaterThanOrEqualValueConditionConfig,
        GreaterThanValueConditionConfig, LessThanConditionConfig,
        LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig,
        NotEqualToConditionConfig, NotEqualToValueConditionConfig,
    } from '@plblum/jivs-engine/build/Conditions/ComparisonCondition_classes';
import
    {
        AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig,
        DataTypeCheckConditionConfig, IntegerConditionConfig,
        MaxDecimalsConditionConfig,
        NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig, RegExpConditionConfig,
        RequireTextCondition, RequireTextConditionConfig, StringLengthConditionConfig
    } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { NotConditionConfig } from '@plblum/jivs-engine/build/Conditions/NotCondition';
import { WhenConditionConfig } from '@plblum/jivs-engine/build/Conditions/WhenCondition';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionConfig, ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ValidatorConfig } from '@plblum/jivs-engine/build/Interfaces/Validator';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { CapturingLogger } from '@plblum/jivs-engine/build/Support/CapturingLogger';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ConditionBuilder } from '../../src/Builder/ConditionBuilder';
import { ValueHostsManagerConfigBuilder } from '../../src/Builder/ValueHostsManagerConfigBuilder';
import { FluentDataTypeCheckValidatorConfig, IBuilderConfigHost, IValidatorBuilder } from '../../src/Interfaces/ChildBuilders';
import { FluentValidatorConfig } from '../../src/Interfaces/ValueHostConfigBuilders';
import { FluentOverloadArgs, ValidatorBuilder } from './../../src/Builder/ValidatorBuilder';
import { BuildersFactoryInstaller } from './../../src/Services/BuildersFactoryInstaller';


class Publicify_ValidatorBuilder extends ValidatorBuilder
{
    public publicify_finish(conditionBuilder: ConditionBuilder | null,
        errorMessage: string | null | undefined,
        summaryMessage: string | null | undefined,
        validatorConfig: FluentValidatorConfig | undefined | null): IValidatorBuilder
    {
        return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorConfig as any);
    }

    public publicify_resolveOverloadArgs<TConditionConfig extends ConditionConfig>(
        arg2?: string | null | object,
        arg3?: string | null
    ): FluentOverloadArgs<TConditionConfig> {
        return this.resolveOverloadArgs(arg2, arg3);
    }
}

function createVMConfig(): FieldValueHostConfig
{
    return {
        valueHostType: ValueHostType.Field,
        name: 'Field1',
        label: 'Field 1',
        dataType: LookupKey.Currency,
        validatorConfigs: []
    };
}

let services: IJivsServices;
beforeAll(() => {
    new BuildersFactoryInstaller();  // this will install buildersFactory on JivsServices.prototype
    services = createJivsServicesForTesting();
    services.loggerService = new CapturingLogger(LoggingLevel.Debug, services.loggerService);
});

describe('ValidatorBuilder', () => {
    describe('constructor', () => {
        test('constructor with vhConfig sets up vhConfig property', () => {
            let vhConfig = createVMConfig();
            let testItem = new ValidatorBuilder(services, vhConfig);
            expect(testItem.parentConfig).toBe(vhConfig);
        });
        test('constructor with vhConfig that has validatorConfig=null sets up vhConfig property with empty validatorConfig array', () => {
            let vhConfig = createVMConfig();
            vhConfig.validatorConfigs = null;

            let testItem = new ValidatorBuilder(services, vhConfig);
            expect(testItem.parentConfig).toBeDefined();
            expect(testItem.parentConfig.validatorConfigs).toEqual([]);
        });
        test('constructor with services=null throws', () => {
            let vhConfig = createVMConfig();
            expect(() => new ValidatorBuilder(null!, vhConfig)).toThrow('services');
        });
        test('constructor with config= null throws', () => {
            expect(() => new ValidatorBuilder(services, null!)).toThrow('parentConfig');
        });
    });
    describe('finish()', () => {
        test('with error message and summary message stand-alone, empty validatorConfig', () => {
            let vhConfig = createVMConfig();

            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);
            let conditionBuilder = new ConditionBuilder(services, testItem);
            conditionBuilder.requireText();
            let validatorConfig: FluentValidatorConfig = {};
            expect(() => testItem.publicify_finish(conditionBuilder, 'Error', 'Summary', validatorConfig)).not.toThrow();
            expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
            expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('with error message stand-alone, summary parameter null, empty validatorConfig', () => {
            let vhConfig = createVMConfig();

            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);
            let conditionBuilder = new ConditionBuilder(services, testItem);
            conditionBuilder.requireText();
            let validatorConfig: FluentValidatorConfig = {};
            expect(() => testItem.publicify_finish(conditionBuilder, 'Error', null, validatorConfig)).not.toThrow();
            expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
            expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'Error',
            });
        });
        test('with error message and summary message null, empty validatorConfig', () => {
            let vhConfig = createVMConfig();

            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);
            let conditionBuilder = new ConditionBuilder(services, testItem);
            conditionBuilder.requireText();
            let validatorConfig: FluentValidatorConfig = {};
            expect(() => testItem.publicify_finish(conditionBuilder, null, null, validatorConfig)).not.toThrow();
            expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
            expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // Error and summary are in the validator config alone
        test('with error message and summary message in validatorConfig, and other parameters correctly defined', () => {
            let vhConfig = createVMConfig();

            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);
            let conditionBuilder = new ConditionBuilder(services, testItem);
            conditionBuilder.requireText();
            let validatorConfig: FluentValidatorConfig = {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            };
            expect(() => testItem.publicify_finish(conditionBuilder, null, null, validatorConfig)).not.toThrow();
            expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
            expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('with validatorConfig.conditionCreator assigned', () => {
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let validatorConfig: ValidatorConfig = {
                errorMessage: 'Error',
                summaryMessage: 'Summary',
                conditionConfig: null,
                conditionCreator: () => new RequireTextCondition({
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                })
            };
            expect(() => testItem.publicify_finish(null, 'Error', 'Summary', validatorConfig as FluentValidatorConfig)).not.toThrow();
            expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
            expect(testItem.parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
            expect(testItem.parentConfig.validatorConfigs![0].conditionCreator).toBeTruthy
        });
        test('with null for error message and summary parameters, but rich content in validatorConfig', () => {
            let vhConfig = createVMConfig();

            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);
            let conditionBuilder = new ConditionBuilder(services, testItem);
            conditionBuilder.requireText();
            let validatorConfig: FluentValidatorConfig = {
                enabled: false,
                severity: ValidationSeverity.Warning,
                errorMessagel10n: 'Key'
            };
            expect(() => testItem.publicify_finish(conditionBuilder, null, null, validatorConfig)).not.toThrow();
            expect(testItem.parentConfig.validatorConfigs!.length).toBe(1);
            expect(testItem.parentConfig.validatorConfigs![0]).toEqual({
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                enabled: false,
                severity: ValidationSeverity.Warning,
                errorMessagel10n: 'Key'
            });
        });
        test('defines same errorCode twice throws on the second definition', () => {
            let vhConfig = createVMConfig();

            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);
            let conditionBuilder = new ConditionBuilder(services, testItem);
            conditionBuilder.requireText();
            let validatorConfig: FluentValidatorConfig = {
                summaryMessage: 'Summary'
            };
            expect(() => testItem.publicify_finish(conditionBuilder, 'Error', 'Summary', validatorConfig)).not.toThrow();
            expect(() => testItem.publicify_finish(conditionBuilder, 'Error', 'Summary', validatorConfig)).toThrow('ValueHost name "Field1" with errorCode RequireText already defined.');
            // check logs for the same error
            let logService = services.loggerService as CapturingLogger;
            expect(logService.findMessage('ValueHost name "Field1" with errorCode RequireText already defined.')).toBeTruthy();
        
        });

        test('validatorConfig.conditionCreator = null and conditionBuilder = null throws', () => {
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let validatorConfig: ValidatorConfig = {
                errorMessage: 'Error',
                summaryMessage: 'Summary',
                conditionConfig: null
            };
            expect(() => testItem.publicify_finish(null, 'Error', 'Summary',
                validatorConfig as FluentValidatorConfig)).toThrow(/conditionConfig or a conditionCreator/);
            let logService = services.loggerService as CapturingLogger;
            expect(logService.findMessage('conditionConfig or a conditionCreator')).toBeTruthy();
            
        });
    });
    describe('resolveOverloadArgs()', ()=> {

        test('All parameters null, returns correct object', () => {
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    null, null);
            expect(errorMessage).toBeNull();
            expect(summaryMessage).toBeNull();
            expect(conditionConfig).toBeUndefined();
            expect(validatorParameters).toBeUndefined();

        });
        // with error and summary messages, no conditionConfig or validatorParameters
        test('error and summary messages, no conditionConfig or validatorParameters, returns correct object', () => {
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    'Error', 'Summary');
            expect(errorMessage).toBe('Error');
            expect(summaryMessage).toBe('Summary');
            expect(conditionConfig).toBeUndefined();
            expect(validatorParameters).toBeUndefined();
        });
        // with error message only, as a single parameter
        test('error message only, as a single parameter, returns correct object', () => {
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    'Error');
            expect(errorMessage).toBe('Error');
            expect(summaryMessage).toBeNull();
            expect(conditionConfig).toBeUndefined();
            expect(validatorParameters).toBeUndefined();
        });
        // with error message, summary = null
        test('error message, summary = null, returns correct object', () => {
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    'Error', null);
            expect(errorMessage).toBe('Error');
            expect(summaryMessage).toBeNull();
            expect(conditionConfig).toBeUndefined();
            expect(validatorParameters).toBeUndefined();
        });
        // with error message = null, summary assigned
        test('error message = null, summary assigned, returns correct object', () => {
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    null, 'Summary');
            expect(errorMessage).toBeNull();
            expect(summaryMessage).toBe('Summary');
            expect(conditionConfig).toBeUndefined();
            expect(validatorParameters).toBeUndefined();
        });
        // using object in first parameter
        test('using object with just validatorParameter values, returns correct validatorParameter and empty conditionconfig', () => {
            let sourceParameters: Partial<FluentValidatorConfig & DataTypeCheckConditionConfig> = {
                enabled: false,
                severity: ValidationSeverity.Warning,
                errorMessagel10n: 'Key'
            };
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    sourceParameters);
            expect(errorMessage).toBeUndefined();
            expect(summaryMessage).toBeUndefined();
            expect(conditionConfig).toEqual({});
            expect(validatorParameters).toEqual(validatorParameters);
        });
        // same with condition config properties on RequireTextConditionConfig: trim: true
        test('using object with just conditionConfig values, returns correct conditionConfig and empty validatorParameter', () => {
            let validatorSource: Partial<FluentValidatorConfig & RequireTextConditionConfig> = {
                trim: true
            };
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    validatorSource);
            expect(errorMessage).toBeUndefined();
            expect(summaryMessage).toBeUndefined();
            expect(conditionConfig).toEqual(validatorSource);
            expect(validatorParameters).toEqual({});
        });

        // mixture of both validatorParameters having errorMessage and conditionConfig properties on RequireTextConditionConfig: trim: true, enabled: false
        test('using object with mixture of validatorParameters and conditionConfig values, returns correct conditionConfig and validatorParameter', () => {
            let mixture: Partial<FluentValidatorConfig & RequireTextConditionConfig> = {
                trim: true,
                enabled: false,
                severity: ValidationSeverity.Warning,
                errorMessagel10n: 'Key'
            };
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    mixture);
            expect(errorMessage).toBeUndefined();
            expect(summaryMessage).toBeUndefined();
            expect(conditionConfig).toEqual({
                trim: true
            });
            expect(validatorParameters).toEqual({
                enabled: false,
                severity: ValidationSeverity.Warning,
                errorMessagel10n: 'Key'
            });
        });
        // any other test ideas?
        test('using object with mixture of validatorParameters and conditionConfig values, plus errorMessage and summaryMessage, returns correct conditionConfig and validatorParameter', () => {
            let mixture: Partial<FluentValidatorConfig & RequireTextConditionConfig> = {
                trim: true,
                nullValueResult: ConditionEvaluateResult.Match,
                errorMessage: 'Error',
            };
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    mixture);
            expect(errorMessage).toBeUndefined();
            expect(summaryMessage).toBeUndefined();
            expect(conditionConfig).toEqual({
                trim: true,
                nullValueResult: ConditionEvaluateResult.Match
            });
            expect(validatorParameters).toEqual({
                errorMessage: 'Error'
            });
        });
        // object as first parameter, second parameter is string, second is ignored
        test('using object with mixture of validatorParameters and conditionConfig values, plus errorMessage and summaryMessage, returns correct conditionConfig and validatorParameter', () => {
            let mixture: Partial<FluentValidatorConfig & RequireTextConditionConfig> = {
                trim: true,
                nullValueResult: ConditionEvaluateResult.Match,
                errorMessage: 'Error',
            };
            let vhConfig = createVMConfig();
            let testItem = new Publicify_ValidatorBuilder(services, vhConfig);

            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                testItem.publicify_resolveOverloadArgs<DataTypeCheckConditionConfig>(
                    mixture, 'Summary');
            expect(errorMessage).toBeUndefined();
            expect(summaryMessage).toBeUndefined();
            expect(conditionConfig).toEqual({
                trim: true,
                nullValueResult: ConditionEvaluateResult.Match
            });
            expect(validatorParameters).toEqual({
                errorMessage: 'Error'
            });
        });
    });
});

function createVMBuilder(): ValueHostsManagerConfigBuilder {
    return new ValueHostsManagerConfigBuilder(createJivsServicesForTesting());
}
function TestValidatorBuilder(testItem: IBuilderConfigHost<any>,
    expectedValConfig: ValidatorConfig) {

    expect(testItem).toBeInstanceOf(ValidatorBuilder);
    let typedTextItem = testItem as ValidatorBuilder;
    let config = typedTextItem.parentConfig as FieldValueHostConfig;
    expect(config.validatorConfigs).not.toBeNull();
    expect(config.validatorConfigs!.length).toBe(1);
    let valConfig = config.validatorConfigs![0];
    expect(valConfig).toEqual(expectedValConfig);
}

function createValidatorParamsAllProperties<T extends FluentValidatorConfig>(): T {
    return <T>
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

        let testItem = createVMBuilder().field('Field1').dataTypeCheck();
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            }
        });
    });
    test('With only errorMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').dataTypeCheck('Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error'
        });
    });
    // both errormessage and summarymessage parameters
    test('With errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').dataTypeCheck('Error', 'Summary' );
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // with null for errorMessage, 'summary'
    test('With errorMessage = null, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').dataTypeCheck(null, 'Summary' );
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            summaryMessage: 'Summary'
        });
    });
    // with only null, which should be treated as no parameters, so no errorMessage or summaryMessage
    test('With errorMessage assigned, parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {
        let testItem = createVMBuilder().field('Field1').dataTypeCheck(null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            }
        });
    });
    // now focusing on the overload that takes one parameter, which is a FluentValidatorConfig
    // It has many parameters, and we need to be sure all pass through
    test('With FluentValidatorConfig with errorMessage and summaryMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').dataTypeCheck({ errorMessage: 'Error', summaryMessage: 'Summary' });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // all properties assigned in FluentValidatorConfig
    test('With FluentValidatorConfig with all of its properties assigned', () => {
        let sourceProperties = createValidatorParamsAllProperties<FluentDataTypeCheckValidatorConfig>();

        let testItem = createVMBuilder().field('Field1').dataTypeCheck(sourceProperties as any);

        // destProperties is a ValidatorConfig with conditionConfig of type DataTypeCheckConditionConfig, and all other properties from sourceProperties
        // clone sourceProperties to destProperties, but add conditionConfig with type DataTypeCheckConditionConfig
        let destProperties = {
            ...sourceProperties,
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
            }
        };        
        TestValidatorBuilder(testItem, destProperties as any);

    });
    // empty object
    test('With FluentValidatorConfig with no properties assigned', () => {
        let testItem = createVMBuilder().field('Field1').dataTypeCheck({});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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

            let testItem = createVMBuilder().field('Field1').regExp('\\d');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d'
                }
            });
        });
        // regExp(string, true)
        test('regExp(string, true), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true', () => {
            let testItem = createVMBuilder().field('Field1').regExp('\\d', true);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                }
            });
        });
        // regExp(string, false)
        test('regExp(string, false), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false', () => {
            let testItem = createVMBuilder().field('Field1').regExp('\\d', false);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{

                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: false
                }
            });
        });
        // regExp(string, true, errorMessage)
        test('regExp(string, true, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and errorMessage assigned', () => {
            let testItem = createVMBuilder().field('Field1').regExp('\\d', true, 'Error');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp('\\d', false, 'Error');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp('\\d', true, 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp('\\d', true, null, 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp('\\d', undefined, 'Error');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d'
                },
                errorMessage: 'Error'
            });
        });
        // regExp(string, true, null)
        test('regExp(string, true, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true', () => {
            let testItem = createVMBuilder().field('Field1').regExp('\\d', true, null);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: true
                }
            });
        });
        // regExp(string, false, null, null)
        test('regExp(string, false, null, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = false', () => {
            let testItem = createVMBuilder().field('Field1').regExp('\\d', false, null, null);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d',
                    ignoreCase: false
                }
            });
        });
        // regExp(string, true, validatorParameters)
        test('regExp(string, true, { errorMessage, summaryMessage }), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and ignoreCase = true and errorMessage + summaryMessage assigned', () => {
            let testItem = createVMBuilder().field('Field1').regExp('\\d', true, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp('\\d', false, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp('\\d', true, {});
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp(/\d/);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                }
            });
        });
        // regExp(RegExp, errorMessage)
        test('regExp(RegExp, errorMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage assigned', () => {
            let testItem = createVMBuilder().field('Field1').regExp(/\d/, 'Error');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                },
                errorMessage: 'Error'

            });
        });
        // regExp(RegExp, errorMessage, summaryMessage)
        test('regExp(RegExp, errorMessage, summaryMessage), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
            let testItem = createVMBuilder().field('Field1').regExp(/\d/, 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp(/\d/, null, 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                },
                summaryMessage: 'Summary'
            });
        });
        // regExp(RegExp, null, null)
        test('regExp(RegExp, null, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
            let testItem = createVMBuilder().field('Field1').regExp(/\d/, null, null);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                }
            });
        });
        // regExp(RegExp, null)
        test('regExp(RegExp, null), creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned', () => {
            let testItem = createVMBuilder().field('Field1').regExp(/\d/, null);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/
                }
            });
        });
        // regExp(RegExp, validatorParameters) with both condition and validator parameters.
        // for condition parameters, use multiline: true
        test('regExp(RegExp, validatorParameters) with both condition and validator parameters, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
            let testItem = createVMBuilder().field('Field1').regExp(/\d/,
                {
                    errorMessage: 'Error',
                    summaryMessage: 'Summary',
                    multiline: true
                });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
            let testItem = createVMBuilder().field('Field1').regExp(/\d/,
                {
                    multiline: true
                });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /\d/,
                    multiline: true
                }
            });
        });
        // regExp(RegExp, validatorParameters) with only validator parameters, no condition parameters.
        test('regExp(RegExp, validatorParameters) with only validator parameters, no condition parameters, creates ValidatorConfig with RegExpCondition with type=RegExp and expressionAsString assigned and errorMessage + summaryMessage assigned', () => {
            let testItem = createVMBuilder().field('Field1').regExp(/\d/,
                {
                    errorMessage: 'Error',
                    summaryMessage: 'Summary'
                });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
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
    // range(1, 4)
    test('range(1, 4), creates ValidatorConfig with RangeCondition with type=Range and minimum assigned', () => {

        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).range(1, 4);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            }
        });
    });

    test('range(1, null), creates ValidatorConfig with RangeCondition with type=Range, minimum assigned', () => {

        let testItem = createVMBuilder().field('Field1').range(1, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1
            }
        });
    });
    test('range(null, 4), creates ValidatorConfig with RangeCondition with type=Range, maximum assigned', () => {

        let testItem = createVMBuilder().field('Field1').range(null, 4);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                maximum: 4
            }
        });
    });

    test('range(null, null, "Error"), creates ValidatorConfig with RangeCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').range(null, null, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            },
            errorMessage: 'Error'
        });
    });
    test('range(1, 4, "Error"), creates ValidatorConfig with RangeCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').range(1, 4, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            },
            errorMessage: 'Error'
        });
    });    
    test('range(1, 4, "Error", "Summary"), creates ValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').range(1, 4, 'Error',  'Summary' );
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('range(1, 4, null, "Summary"), creates ValidatorConfig with RangeCondition with only type assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').range(1, 4, null,  'Summary' );
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            },
            summaryMessage: 'Summary'
        });
    });
    // range(1, 4, validatorParameters) 
    // note that RangeCondition does not have any available parameters, so the validatorParameters will only be used for the ValidatorConfig, not the RangeConditionConfig
    test('range(1, 4, validatorParameters), creates ValidatorConfig with RangeCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').range(1, 4, {
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // range(1, 4, {})
    test('range(1, 4, {}), creates ValidatorConfig with RangeCondition with only type assigned and no errorMessage or summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').range(1, 4, {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            }
        });
    });
    // range(1, 4, null)
    test('range(1, 4, null), creates ValidatorConfig with RangeCondition with only type assigned and no errorMessage or summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').range(1, 4, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range,
                minimum: 1,
                maximum: 4
            }
        });
    });
    // range(null, null, null)
    test('range(null, null, null), creates ValidatorConfig with RangeCondition with only type assigned and no errorMessage or summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').range(null, null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range
            }
        });
    });

});

describe('equalToValue as a validator of a field()', () => {
    test('equalToValue(1), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            }
        });
    });
    // equalToValue(1, null)
    test('equalToValue(1, null), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            }
        });
    });
    // equalToValue(1, null, null)
    test('equalToValue(1, null, null), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1, null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            }
        });
    });
    // equalToValue(null)
    test('equalToValue(null), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue unassigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            }
        });
    });
    // equalToValue(undefined)
    test('equalToValue(undefined), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(undefined);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue
            }
        });
    });
    // equalToValue(1, 'Error')
    test('equalToValue(1, "Error"), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            },
            errorMessage: 'Error'
        });
    });
    // equalToValue(1, 'Error', 'Summary')
    test('equalToValue(1, "Error", "Summary"), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1, 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,  
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // equalToValue(1, null, 'Summary')
    test('equalToValue(1, null, "Summary"), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1, null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            },
            summaryMessage: 'Summary'
        });
    });
    // equalToValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('equalToValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1,
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary' 
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });

    // equalToValue(1, { errorMessage: 'Error', summaryMessage: 'Summary', secondConversionLookupKey: 'key' })
    test('equalToValue(1, { errorMessage: "Error", summaryMessage: "Summary", secondConversionLookupKey: "key" }), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and errorMessage + summaryMessage + secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1,
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary',
                secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1,
                secondConversionLookupKey: LookupKey.Integer
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // equalToValue(1, { secondConversionLookupKey: 'key' })
    test('equalToValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1,
            {
                secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // equalToValue(1, {})
    test('equalToValue(1, {}), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).equalToValue(1, {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 1
            }
        });
    });

    describe('eqValue alias of equalToValue  Confirm overloaded interfaces', () => {
        test('eqValue(1), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer).eqValue(1);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 1
                }
            });
        });
        test('eqValue(1, errormessage, summarymessage), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .eqValue(1, 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('eqValue(1, { errormessage, summarymessage}), creates ValidatorConfig with EqualToValueCondition with type=EqualToValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .eqValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
    });
});
describe('equalTo as a validator of a field()', () => {
    test('equalTo("Field2"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    // equalTo("Field2", null)
    test('equalTo("Field2", null), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2', null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    // equalTo("Field2", null, null)
    test('equalTo("Field2", null, null), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2', null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    // equalTo("Field2", "Error")
    test('equalTo("Field2", "Error"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2', 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    // equalTo("Field2", "Error", "Summary")
    test('equalTo("Field2", "Error", "Summary"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2', 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // equalTo("Field2", null, "Summary")
    test('equalTo("Field2", null, "Summary"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2', null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            summaryMessage: 'Summary'
        });
    });
    // equalTo("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('equalTo("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2',
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // equalTo("Field2", { secondConversionLookupKey: 'key' })  
    test('equalTo("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2',
            {
                secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2',
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // equalTo("Field2", {})
    test('equalTo("Field2", {}), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('Field2', {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    // equalTo("")
    test('equalTo(""), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').equalTo('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                secondValueHostName: ''
            }
        });
    });
    describe('eq alias of equalTo  Confirm overloaded interfaces', () => {
        test('eq("Field2"), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer).eq('Field2');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <EqualToConditionConfig>{
                    conditionType: ConditionType.EqualTo,
                    secondValueHostName: 'Field2'
                }
            });
        });
        test('eq("Field2", errormessage, summarymessage), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .eq("Field2", 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <EqualToConditionConfig>{
                    conditionType: ConditionType.EqualTo,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('eq("Field2", { errormessage, summarymessage}), creates ValidatorConfig with EqualToCondition with type=EqualTo and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .eq("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <EqualToConditionConfig>{
                    conditionType: ConditionType.EqualTo,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
    });
});

describe('notEqualToValue as a validator of a field()', () => {
    test('notEqualToValue(1), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            }
        });
    });
    // notEqualToValue(1, null)
    test('notEqualToValue(1, null), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            }
        });
    });
    // notEqualToValue(1, null, null)
    test('notEqualToValue(1, null, null), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1, null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            }
        });
    }); 
    // notEqualToValue(1, 'Error')
    test('notEqualToValue(1, "Error"), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            },
            errorMessage: 'Error'
        });
    });
    // notEqualToValue(1, 'Error', 'Summary')
    test('notEqualToValue(1, "Error", "Summary"), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1, 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // notEqualToValue(1, null, 'Summary')
    test('notEqualToValue(1, null, "Summary"), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1, null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            },
            summaryMessage: 'Summary'
        });
    });
    // notEqualToValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('notEqualToValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1,
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // notEqualToValue(1, { secondConversionLookupKey: 'key' })
    test('notEqualToValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1,
            {
                secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // notEqualToValue(1, {})
    test('notEqualToValue(1, {}), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(1, {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: 1
            }
        });
    });
    // notEqualToValue("")
    test('notEqualToValue(""), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue,
                secondValue: ''
            }
        });
    });
    // notEqualToValue(null)
    test('notEqualToValue(null), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue unassigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).notEqualToValue(null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToValueConditionConfig>{
                conditionType: ConditionType.NotEqualToValue
            }
        });
    });
    describe('neqValue alias of notEqualToValue  Confirm overloaded interfaces', () => {
        test('neqValue(1), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer).neqValue(1);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <NotEqualToValueConditionConfig>{
                    conditionType: ConditionType.NotEqualToValue,
                    secondValue: 1
                }
            });
        });
        test('neqValue(1, errormessage, summarymessage), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .neqValue(1, 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <NotEqualToValueConditionConfig>{
                    conditionType: ConditionType.NotEqualToValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('neqValue(1, { errormessage, summarymessage}), creates ValidatorConfig with NotEqualToValueCondition with type=NotEqualToValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .neqValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <NotEqualToValueConditionConfig>{
                    conditionType: ConditionType.NotEqualToValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
    });
});
describe('notEqualTo as a validator of a field()', () => {
    test('notEqualTo("Field2"), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {

        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    // notEqualTo("Field2", null)
    test('notEqualTo("Field2", null), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2', null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    // notEqualTo("Field2", null, null)
    test('notEqualTo("Field2", null, null), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2', null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    // notEqualTo("Field2", "Error")
    test('notEqualTo("Field2", "Error"), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2', 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    // notEqualTo("Field2", "Error", "Summary")
    test('notEqualTo("Field2", "Error", "Summary"), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2', 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,    
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // notEqualTo("Field2", null, "Summary")
    test('notEqualTo("Field2", null, "Summary"), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2', null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            summaryMessage: 'Summary'
        });
    });
    // notEqualTo("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('notEqualTo("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {   
        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2',
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // notEqualTo("Field2", { secondConversionLookupKey: 'key' })
    test('notEqualTo("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2',
            {   
            secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2',
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // notEqualTo("Field2", {})
    test('notEqualTo("Field2", {}), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').notEqualTo('Field2', {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: 'Field2'
            }
        });
    });
    // notEqualTo("")
    test('notEqualTo(""), creates ValidatorConfig with NotEqualToCondition with type=NotEqualTo and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').notEqualTo('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotEqualToConditionConfig>{
                conditionType: ConditionType.NotEqualTo,
                secondValueHostName: ''
            }
        });
    });

});
describe('lessThanValue as a validator of a field()', () => {
    test('lessThanValue(1), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });
    // lessThanValue(1, null)
    test('lessThanValue(1, null), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });
    // lessThanValue(1, null, null)
    test('lessThanValue(1, null, null), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1, null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });
    // lessThanValue(1, 'Error')
    test('lessThanValue(1, "Error"), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            },
            errorMessage: 'Error'
        });
    });
    // lessThanValue(1, 'Error', 'Summary')
    test('lessThanValue(1, "Error", "Summary"), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1, 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // lessThanValue(1, null, 'Summary')
    test('lessThanValue(1, null, "Summary"), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1, null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            },
            summaryMessage: 'Summary'
        });
    });
    // lessThanValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('lessThanValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1,
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // lessThanValue(1, { secondConversionLookupKey: 'key' })
    test('lessThanValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1,
            {
                secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // lessThanValue(1, {})
    test('lessThanValue(1, {}), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue(1, {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: 1
            }
        });
    });
    // lessThanValue("")
    test('lessThanValue(""), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanValue('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanValueConditionConfig>{
                conditionType: ConditionType.LessThanValue,
                secondValue: ''
            }
        });
    });
    describe('ltValue alias of lessThanValue  Confirm overloaded interfaces', () => {
        test('ltValue(1), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer).ltValue(1);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanValueConditionConfig>{
                    conditionType: ConditionType.LessThanValue,
                    secondValue: 1
                }
            });
        });
        test('ltValue(1, errormessage, summarymessage), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .ltValue(1, 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanValueConditionConfig>{
                    conditionType: ConditionType.LessThanValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('ltValue(1, { errormessage, summarymessage}), creates ValidatorConfig with LessThanValueCondition with type=LessThanValue and secondValue assigned', () => {

            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .ltValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanValueConditionConfig>{
                    conditionType: ConditionType.LessThanValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
    });

});
describe('lessThan as a validator of a field()', () => {
    test('lessThan("Field2"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

        let testItem = createVMBuilder().field('Field1').lessThan('Field2');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    // lessThan("Field2", null)
    test('lessThan("Field2", null), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('Field2', null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    // lessThan("Field2", null, null)
    test('lessThan("Field2", null, null), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('Field2', null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    // lessThan("Field2", "Error")
    test('lessThan("Field2", "Error"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('Field2', 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    // lessThan("Field2", "Error", "Summary")
    test('lessThan("Field2", "Error", "Summary"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('Field2', 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // lessThan("Field2", null, "Summary")
    test('lessThan("Field2", null, "Summary"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('Field2', null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            summaryMessage: 'Summary'
        });
    });
    // lessThan("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('lessThan("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('Field2',
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // lessThan("Field2", { secondConversionLookupKey: 'key' })
    test('lessThan("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('Field2',
            {
                secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2',
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // lessThan("Field2", {})
    test('lessThan("Field2", {}), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('Field2', {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    // lessThan("")
    test('lessThan(""), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThan('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanConditionConfig>{
                conditionType: ConditionType.LessThan,
                secondValueHostName: ''
            }
        });
    });
    describe('lt alias of lessThan. Confirm overloaded interfaces', () => {
        test('lt("Field2"), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

            let testItem = createVMBuilder().field('Field1').lt('Field2');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanConditionConfig>{
                    conditionType: ConditionType.LessThan,
                    secondValueHostName: 'Field2'
                }
            });
        });
        test('lt("Field2", errormessage, summarymessage), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

            let testItem = createVMBuilder().field('Field1').lt('Field2', 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanConditionConfig>{
                    conditionType: ConditionType.LessThan,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('lt("Field2", { errormessage, summarymessage}), creates ValidatorConfig with LessThanCondition with type=LessThan and secondValueHostName assigned', () => {

            let testItem = createVMBuilder().field('Field1').lt('Field2', { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanConditionConfig>{
                    conditionType: ConditionType.LessThan,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });

    });
});
describe('lessThanOrEqualValue as a validator of a field()', () => {
    test('lessThanOrEqualValue(1), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {

        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    // lessThanOrEqualValue(1, null)
    test('lessThanOrEqualValue(1, null), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    // lessThanOrEqualValue(1, null, null)
    test('lessThanOrEqualValue(1, null, null), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    // lessThanOrEqualValue(1, 'Error')
    test('lessThanOrEqualValue(1, "Error"), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            },
            errorMessage: 'Error'
        });
    });
    // lessThanOrEqualValue(1, 'Error', 'Summary')
    test('lessThanOrEqualValue(1, "Error", "Summary"), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // lessThanOrEqualValue(1, null, 'Summary')
    test('lessThanOrEqualValue(1, null, "Summary"), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            },
            summaryMessage: 'Summary'
        });
    });
    // lessThanOrEqualValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('lessThanOrEqualValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1,
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // lessThanOrEqualValue(1, { secondConversionLookupKey: 'key' })
    test('lessThanOrEqualValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1,
            {
                secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // lessThanOrEqualValue(1, {})
    test('lessThanOrEqualValue(1, {}), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue(1, {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    // lessThanOrEqualValue("")
    test('lessThanOrEqualValue(""), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lessThanOrEqualValue('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.LessThanOrEqualValue,
                secondValue: ''
            }
        });
    });
    describe('lteValue alias of lessThanOrEqualValue. Confirm overloaded interfaces', () => {
        test('lteValue(1), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer).lteValue(1);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanOrEqualValueConditionConfig>{
                    conditionType: ConditionType.LessThanOrEqualValue,
                    secondValue: 1
                }
            });
        });
        test('lteValue(1, errormessage, summarymessage), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .lteValue(1, 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanOrEqualValueConditionConfig>{
                    conditionType: ConditionType.LessThanOrEqualValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('lteValue(1, { errormessage, summarymessage}), creates ValidatorConfig with LessThanOrEqualValueCondition with type=LessThanOrEqualValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .lteValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanOrEqualValueConditionConfig>{
                    conditionType: ConditionType.LessThanOrEqualValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });

    });

});
describe('lessThanOrEqual as a validator of a field()', () => {
    test('lessThanOrEqual("Field2"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {

        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    // lessThanOrEqual("Field2", null)
    test('lessThanOrEqual("Field2", null), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2', null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    // lessThanOrEqual("Field2", null, null)
    test('lessThanOrEqual("Field2", null, null), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2', null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    // lessThanOrEqual("Field2", "Error")
    test('lessThanOrEqual("Field2", "Error"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2', 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    // lessThanOrEqual("Field2", "Error", "Summary")
    test('lessThanOrEqual("Field2", "Error", "Summary"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2', 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // lessThanOrEqual("Field2", null, "Summary")
    test('lessThanOrEqual("Field2", null, "Summary"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2', null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            summaryMessage: 'Summary'
        });
    });
    // lessThanOrEqual("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('lessThanOrEqual("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2', {
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // lessThanOrEqual("Field2", { secondConversionLookupKey: 'key' })
    test('lessThanOrEqual("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2', {
            secondConversionLookupKey: LookupKey.Integer
        });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2',
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // lessThanOrEqual("Field2", {})
    test('lessThanOrEqual("Field2", {}), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('Field2', {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    // lessThanOrEqual("")
    test('lessThanOrEqual(""), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').lessThanOrEqual('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <LessThanOrEqualConditionConfig>{
                conditionType: ConditionType.LessThanOrEqual,
                secondValueHostName: ''
            }
        });
    });
    describe('lte alias of lessThanOrEqual. Confirm overloaded interfaces', () => {
        test('lte("Field2"), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').lte('Field2');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanOrEqualConditionConfig>{
                    conditionType: ConditionType.LessThanOrEqual,
                    secondValueHostName: 'Field2'
                }
            });
        });
        test('lte("Field2", errormessage, summarymessage), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').lte('Field2', 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanOrEqualConditionConfig>{
                    conditionType: ConditionType.LessThanOrEqual,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('lte("Field2", { errormessage, summarymessage}), creates ValidatorConfig with LessThanOrEqualCondition with type=LessThanOrEqual and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').lte('Field2', { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <LessThanOrEqualConditionConfig>{
                    conditionType: ConditionType.LessThanOrEqual,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });

    });

});


describe('greaterThanValue as a validator of a field()', () => {
    test('greaterThanValue(1), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {

        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });
    // greaterThanValue(1, null)
    test('greaterThanValue(1, null), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });
    // greaterThanValue(1, null, null)
    test('greaterThanValue(1, null, null), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1, null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });
    // greaterThanValue(1, 'Error')
    test('greaterThanValue(1, "Error"), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            },
            errorMessage: 'Error'
        });
    });
    // greaterThanValue(1, 'Error', 'Summary')
    test('greaterThanValue(1, "Error", "Summary"), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1, 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // greaterThanValue(1, null, 'Summary')
    test('greaterThanValue(1, null, "Summary"), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1, null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            },
            summaryMessage: 'Summary'
        });
    });
    // greaterThanValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('greaterThanValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1,
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // greaterThanValue(1, { secondConversionLookupKey: 'key' })
    test('greaterThanValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1,
            {
                secondConversionLookupKey: LookupKey.Integer
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1,
                secondConversionLookupKey: LookupKey.Integer
            }
        });
    });
    // greaterThanValue(1, {})
    test('greaterThanValue(1, {}), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(1, {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue,
                secondValue: 1
            }
        });
    });
    // greaterThanValue(null)
    test('greaterThanValue(null), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue unassigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanValue(null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanValueConditionConfig>{
                conditionType: ConditionType.GreaterThanValue
            }
        });
    });
    describe('gtValue alias of greaterThanValue. Confirm overloaded interfaces', () => {
        test('gtValue(1), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer).gtValue(1);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanValueConditionConfig>{
                    conditionType: ConditionType.GreaterThanValue,
                    secondValue: 1
                }
            });
        });
        test('gtValue(1, errormessage, summarymessage), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .gtValue(1, 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanValueConditionConfig>{
                    conditionType: ConditionType.GreaterThanValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('gtValue(1, { errormessage, summarymessage}), creates ValidatorConfig with GreaterThanValueCondition with type=GreaterThanValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .gtValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanValueConditionConfig>{
                    conditionType: ConditionType.GreaterThanValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });

    });

});

describe('greaterThan as a validator of a field()', () => {
    test('greaterThan("Field2"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {

        let testItem = createVMBuilder().field('Field1').greaterThan('Field2');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    // greaterThan("Field2", null)
    test('greaterThan("Field2", null), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('Field2', null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    // greaterThan("Field2", null, null)
    test('greaterThan("Field2", null, null), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('Field2', null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    // greaterThan("Field2", "Error")
    test('greaterThan("Field2", "Error"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('Field2', 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    // greaterThan("Field2", "Error", "Summary")
    test('greaterThan("Field2", "Error", "Summary"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('Field2', 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // greaterThan("Field2", null, "Summary")
    test('greaterThan("Field2", null, "Summary"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('Field2', null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            summaryMessage: 'Summary'
        });
    });
    // greaterThan("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('greaterThan("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('Field2', {
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // greaterThan("Field2", { secondConversionLookupKey: 'key' })
    test('greaterThan("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('Field2', {
            secondConversionLookupKey: 'key'
        });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2',
                secondConversionLookupKey: 'key'
            }
        });
    });
    // greaterThan("Field2", {})
    test('greaterThan("Field2", {}), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('Field2', {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: 'Field2'
            }
        });
    });
    // greaterThan("")
    test('greaterThan(""), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThan('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanConditionConfig>{
                conditionType: ConditionType.GreaterThan,
                secondValueHostName: ''
            }
        });
    });
    describe('gt alias of greaterThan. Confirm overloaded interfaces', () => {
        test('gt("Field2"), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').gt('Field2');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanConditionConfig>{
                    conditionType: ConditionType.GreaterThan,
                    secondValueHostName: 'Field2'
                }
            });
        });
        test('gt("Field2", errormessage, summarymessage), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').gt('Field2', 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanConditionConfig>{
                    conditionType: ConditionType.GreaterThan,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('gt("Field2", { errormessage, summarymessage}), creates ValidatorConfig with GreaterThanCondition with type=GreaterThan and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').gt('Field2', { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanConditionConfig>{
                    conditionType: ConditionType.GreaterThan,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
    });

});
describe('greaterThanOrEqualValue as a validator of a field()', () => {
    test('greaterThanOrEqualValue(1), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {

        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    // greaterThanOrEqualValue(1, null)
    test('greaterThanOrEqualValue(1, null), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    // greaterThanOrEqualValue(1, null, null)
    test('greaterThanOrEqualValue(1, null, null), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    // greaterThanOrEqualValue(1, 'Error')
    test('greaterThanOrEqualValue(1, "Error"), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            },
            errorMessage: 'Error'
        });
    });
    // greaterThanOrEqualValue(1, 'Error', 'Summary')
    test('greaterThanOrEqualValue(1, "Error", "Summary"), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // greaterThanOrEqualValue(1, null, 'Summary')
    test('greaterThanOrEqualValue(1, null, "Summary"), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            },
            summaryMessage: 'Summary'
        });
    });
    // greaterThanOrEqualValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('greaterThanOrEqualValue(1, { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1,
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // greaterThanOrEqualValue(1, { secondConversionLookupKey: 'key' })
    test('greaterThanOrEqualValue(1, { secondConversionLookupKey: "key" }), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1,
            {
                secondConversionLookupKey: 'key'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1,
                secondConversionLookupKey: 'key'
            }
        });
    });
    // greaterThanOrEqualValue(1, {})
    test('greaterThanOrEqualValue(1, {}), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(1, {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue,
                secondValue: 1
            }
        });
    });
    // greaterThanOrEqualValue(null)
    test('greaterThanOrEqualValue(null), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue unassigned', () => {
        let testItem = createVMBuilder().field('Field1', LookupKey.Integer).greaterThanOrEqualValue(null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqualValue
            }
        });
    });
    describe('gteValue alias of greaterThanOrEqualValue. Confirm overloaded interfaces', () => {
        test('gteValue(1), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer).gteValue(1);
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                    conditionType: ConditionType.GreaterThanOrEqualValue,
                    secondValue: 1
                }
            });
        });
        test('gteValue(1, errormessage, summarymessage), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .gteValue(1, 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                    conditionType: ConditionType.GreaterThanOrEqualValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('gteValue(1, { errormessage, summarymessage}), creates ValidatorConfig with GreaterThanOrEqualValueCondition with type=GreaterThanOrEqualValue and secondValue assigned', () => {
            let testItem = createVMBuilder().field('Field1', LookupKey.Integer)
                .gteValue(1, { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanOrEqualValueConditionConfig>{
                    conditionType: ConditionType.GreaterThanOrEqualValue,
                    secondValue: 1
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });

    });

});
describe('greaterThanOrEqual as a validator of a field()', () => {
    test('greaterThanOrEqual("Field2"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {

        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });

    // greaterThanOrEqual("Field2", null)
    test('greaterThanOrEqual("Field2", null), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2', null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    // greaterThanOrEqual("Field2", null, null)
    test('greaterThanOrEqual("Field2", null, null), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2', null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    // greaterThanOrEqual("Field2", "Error")
    test('greaterThanOrEqual("Field2", "Error"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2', 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error'
        });
    });
    // greaterThanOrEqual("Field2", "Error", "Summary")
    test('greaterThanOrEqual("Field2", "Error", "Summary"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2', 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // greaterThanOrEqual("Field2", null, "Summary")
    test('greaterThanOrEqual("Field2", null, "Summary"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2', null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            summaryMessage: 'Summary'
        });
    });
    // greaterThanOrEqual("Field2", { errorMessage: 'Error', summaryMessage: 'Summary' })
    test('greaterThanOrEqual("Field2", { errorMessage: "Error", summaryMessage: "Summary" }), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2', {
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // greaterThanOrEqual("Field2", { secondConversionLookupKey: 'key' })
    test('greaterThanOrEqual("Field2", { secondConversionLookupKey: "key" }), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned and secondConversionLookupKey assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2', {
            secondConversionLookupKey: 'key'
        });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2',
                secondConversionLookupKey: 'key'
            }
        });
    });
    // greaterThanOrEqual("Field2", {})
    test('greaterThanOrEqual("Field2", {}), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2', {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: 'Field2'
            }
        });
    });
    // greaterThanOrEqual("")
    test('greaterThanOrEqual(""), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
        let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <GreaterThanOrEqualConditionConfig>{
                conditionType: ConditionType.GreaterThanOrEqual,
                secondValueHostName: ''
            }
        });
    });
    describe('gte alias of greaterThanOrEqual. Confirm overloaded interfaces', () => {
        test('gte("Field2"), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').greaterThanOrEqual('Field2');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanOrEqualConditionConfig>{
                    conditionType: ConditionType.GreaterThanOrEqual,
                    secondValueHostName: 'Field2'
                }
            });
        });
        test('gte("Field2", errormessage, summarymessage), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').gte('Field2', 'Error', 'Summary');
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanOrEqualConditionConfig>{
                    conditionType: ConditionType.GreaterThanOrEqual,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });
        test('gte("Field2", { errormessage, summarymessage}), creates ValidatorConfig with GreaterThanOrEqualCondition with type=GreaterThanOrEqual and secondValueHostName assigned', () => {
            let testItem = createVMBuilder().field('Field1').gte('Field2', { errorMessage: 'Error', summaryMessage: 'Summary' });
            TestValidatorBuilder(testItem, <ValidatorConfig>{
                conditionConfig: <GreaterThanOrEqualConditionConfig>{
                    conditionType: ConditionType.GreaterThanOrEqual,
                    secondValueHostName: 'Field2'
                },
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        });

    });

});

describe('stringLength as a validator of a field()', () => {
    test('stringLength(4), creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum assigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(4);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4
            }
        });
    });

    test('stringLength(4, { minimum: 1 }), creates ValidatorConfig with StringLengthCondition with type=StringLength, minimum assigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(4, { minimum: 1 });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4,
                minimum: 1
            }
        });
    });

    // stringLength(4, 'Error')
    test('stringLength(4, "Error"), creates ValidatorConfig with StringLengthCondition with type=StringLength, maximum assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(4, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4
            },
            errorMessage: 'Error'
        });
    });
    // stringLength(4, 'Error', 'Summary')
    test('stringLength(4, "Error", "Summary"), creates ValidatorConfig with StringLengthCondition with type=StringLength, maximum assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(4, 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // stringLength(4, null, 'Summary')
    test('stringLength(4, null, "Summary"), creates ValidatorConfig with StringLengthCondition with type=StringLength, maximum assigned and summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(4, null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4
            },
            summaryMessage: 'Summary'
        });
    });
    // stringLength(4, { errorMessage: 'Error', summaryMessage: 'Summary', minimum: 1 })
    test('stringLength(4, { errorMessage: "Error", summaryMessage: "Summary", minimum: 1 }), creates ValidatorConfig with StringLengthCondition with type=StringLength, maximum assigned and errorMessage + summaryMessage + minimum assigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(4, { errorMessage: 'Error', summaryMessage: 'Summary', minimum: 1 });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength,
                maximum: 4,
                minimum: 1
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // stringLength(null)
    test('stringLength(null), creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum unassigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            }
        });
    });
    // stringLength(null, null)
    test('stringLength(null, null), creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum unassigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            }
        });
    });
    // stringLength(null, null, null)
    test('stringLength(null, null, null), creates ValidatorConfig with StringLengthCondition with type=StringLength and maximum unassigned', () => {

        let testItem = createVMBuilder().field('Field1').stringLength(null, null, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <StringLengthConditionConfig>{
                conditionType: ConditionType.StringLength
            }
        });
    });
});

describe('requireText as a validator of a field()', () => {
    test('requireText(), creates ValidatorConfig with RequireTextCondition with type=RequireText', () => {

        let testItem = createVMBuilder().field('Field1').requireText();
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        });
    });

    test('requireText({ nullValueResult, errorMessage }), creates ValidatorConfig with RequireTextCondition with type=RequireText, nullValueResult=NoMatch', () => {

        let testItem = createVMBuilder().field('Field1').requireText({
            nullValueResult: ConditionEvaluateResult.NoMatch,
            errorMessage: 'Error',
        });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                nullValueResult: ConditionEvaluateResult.NoMatch
            },
            errorMessage: 'Error'
        });
    });

    test('requireText(errorMessage), creates ValidatorConfig with RequireTextCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').requireText('Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error'
        });
    });
    // requireText(errorMessage, summaryMessage)
    test('requireText(errorMessage, summaryMessage), creates ValidatorConfig with RequireTextCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').requireText('Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // requireText(null, summaryMessage )
    test('requireText(null, summaryMessage), creates ValidatorConfig with RequireTextCondition with only type assigned and summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').requireText(null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            },
            summaryMessage: 'Summary'
        });
    });

});
describe('notNull as a validator of a field()', () => {
    test('notNull(), creates ValidatorConfig with NotNullCondition with type=NotNull', () => {

        let testItem = createVMBuilder().field('Field1').notNull();
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            }
        });
    });

    test('notNull(errorMessage), creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').notNull('Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'Error'
        });
    });
    // same also with summary message
    test('notNull(errorMessage, summaryMessage), creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').notNull('Error', 'Summary' );
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotNullConditionConfig>{
                conditionType: ConditionType.NotNull
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });

    test('notNull({ errorMessage, summaryMessage }), creates ValidatorConfig with NotNullCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').notNull({ errorMessage: 'Error', summaryMessage: 'Summary' });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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

        let testItem = createVMBuilder().field('Field1').all(
            (children) => []);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            }
        });
    });
    test('all((2 children), creates ValidatorConfig with AllMatchCondition with type=AllMatch and conditionConfigs populated with both conditions', () => {

        let testItem = createVMBuilder().field('Field1')
            .all(
                (children) => [
                    children.fieldValue('F1').requireText(),
                    children.fieldValue('F2').requireText()
                ]);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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

    test('all((2 children), "Error"), and errorMessage assigned creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1')
            .all(
                 (children) => [
                    children.fieldValue('F1').requireText(),
                    children.fieldValue('F2').requireText()
                ],
                'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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
    test('all((2 children), "Error", "Summary" ), creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1')
            .all(
                (children) => [
                    children.fieldValue('F1').requireText(),
                    children.fieldValue('F2').requireText()
                ],
                'Error',
                'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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
    test('all((2 children), null, summary), creates ValidatorConfig with AllMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').all(
            (children) => [],
            null,
            'Summary' );
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            },
            summaryMessage: 'Summary'
        });
    });
    test('all((0 children), { errorMessage, summaryMessage }), creates ValidatorConfig with AllMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {

        let testItem = createVMBuilder().field('Field1').all(
            (children) => [],
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('Null as the function parameter throws', () => {
        let builder = createVMBuilder();
        expect(()=> builder.field('Field1').all(null!, 'Error')).toThrow(/childrenCallback/);
    });
    test('Non-function as the function parameter throws', () => {
        let builder = createVMBuilder();
        expect(() => builder.field('Field1').all({} as any, 'Error')).toThrow(/Function expected/);
    });    
});
describe('any as a validator of a field()', () => {
    test('With empty conditions, creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs=[]', () => {

        let testItem = createVMBuilder().field('Field1').any(
            (children) => []);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            }
        });
    });
    test('any((2 children)), creates ValidatorConfig with AnyMatchCondition with type=AnyMatch and conditionConfigs populated with both conditions', () => {

        let testItem = createVMBuilder().field('Field1').any(
            (children) => [
                children.fieldValue('F1').requireText(),
                children.fieldValue('F2').requireText()
            ]);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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

    test('any((2 children), errormessage), and errorMessage assigned creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').any(
            (children) => [
                children.fieldValue('F1').requireText(),
                children.fieldValue('F2').requireText()
            ],
            'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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
    test('any((2 children), error message, summary message) creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').any(
            (children) => [
                children.fieldValue('F1').requireText(),
                children.fieldValue('F2').requireText()
            ],
            'Error',
            'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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
    test('any((0 children), null, summary message), parameter.errorMessage and parameter.summaryMessage creates ValidatorConfig with AnyMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').any(
            (children) => [],
            null,
            'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            },
            summaryMessage: 'Summary'
        });
    });
    test('any((0 children), { error message, summary message }), creates ValidatorConfig with AnyMatchCondition with only type assigned.', () => {

        let testItem = createVMBuilder().field('Field1').any(
            (children) => [],
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: []
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('Null as the function parameter throws', () => {
        let builder = createVMBuilder();
        expect(()=> builder.field('Field1').any(null!, 'Error')).toThrow(/childrenCallback/);
    });
    test('Non-function as the function parameter throws', () => {
        let builder = createVMBuilder();
        expect(() => builder.field('Field1').any({} as any, 'Error')).toThrow(/Function expected/);
    });        
});

describe('countMatches as a validator of a field()', () => {
    test('countMatches(1, 2, (0 children)), creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, maximum, and conditionConfigs=[]', () => {

        let testItem = createVMBuilder().field('Field1').countMatches(1, 2,
            (children) => []);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                maximum: 2,
                conditionConfigs: []
            }
        });
    });
    test('countMatches(1, null, (0 children)), creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, minimum, and conditionConfigs=[]', () => {
        let testItem = createVMBuilder().field('Field1').countMatches(1, null,
            (children) => []);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                minimum: 1,
                conditionConfigs: []
            }
        });
    });
    test('countMatches(null, 2, (0 children)), creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch, maximum, and conditionConfigs=[]', () => {

        let testItem = createVMBuilder().field('Field1').countMatches(null, 2,
            (children) => []);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                maximum: 2,
                conditionConfigs: []
            }
        });
    });    
    test('countMatches(0, 2, (2 children)), creates ValidatorConfig with CountMatchesMatchCondition with type=CountMatchesMatch and conditionConfigs populated with both conditions', () => {

        let testItem = createVMBuilder().field('Field1').countMatches(0, 2,
            (children) => [
                children.fieldValue('F1').requireText(),
                children.fieldValue('F2').requireText()
            ]);

        TestValidatorBuilder(testItem, <ValidatorConfig>{
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

    test('countMatches(1, 4, (2 children), error message), creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').countMatches(1, 4,
            (children) => [
                children.fieldValue('F1').requireText(),
                children.fieldValue('F2').requireText()
            ],
            'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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
    test('countMatches(1, 2, (2 children), error message, summary message) creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').countMatches(1, 2,
            (children) => [
                children.fieldValue('F1').requireText(),
                children.fieldValue('F2').requireText()
            ],
            'Error',
            'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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
    test('countMatches(1, 4, (0 children), { error message, summary error }), creates ValidatorConfig with CountMatchesMatchCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').countMatches(1, 2,
            (children) => [],
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                conditionConfigs: [],
                minimum: 1,
                maximum: 2
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('countMatches(1, 2, (0 children), {}), creates ValidatorConfig with CountMatchesMatchCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned', () => {
        let testItem = createVMBuilder().field('Field1').countMatches(1, 2,
            (children) => [], 
            {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <CountMatchesConditionConfig>{
                conditionType: ConditionType.CountMatches,
                conditionConfigs: [],
                minimum: 1,
                maximum: 2
            },
        });
    });
    test('Null as the function parameter throws', () => {
        let builder = createVMBuilder();
        expect(()=> builder.field('Field1').countMatches(0, 1, null!, 'Error')).toThrow(/childrenCallback/);
    });
    test('Non-function as the function parameter throws', () => {
        let builder = createVMBuilder();
        expect(() => builder.field('Field1').countMatches(0, 1, {} as any, 'Error')).toThrow(/Function expected/);
    });        
});

describe('positive as a validator of a field()', () => {
    test('positive(), creates ValidatorConfig with PositiveCondition with type=Positive', () => {

        let testItem = createVMBuilder().field('Field1').positive();
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            }
        });
    });
    // positive(errorMessage)
    test('positive(errorMessage), creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').positive('Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            },
            errorMessage: 'Error'
        });
    });
    // positive(errorMessage, summaryMessage)
    test('positive(errorMessage, summaryMessage), creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1').positive('Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // positive(null, summaryMessage)
    test('positive(null, summaryMessage), creates ValidatorConfig with PositiveCondition with only type assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').positive(null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            },
            summaryMessage: 'Summary'
        });
    });
    // positive({ errorMessage, summaryMessage })
    test('positive({ errorMessage, summaryMessage }), creates ValidatorConfig with PositiveCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').positive(
            {
                errorMessage: 'Error', summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // positive({})
    test('positive({}), creates ValidatorConfig with PositiveCondition with only type assigned', () => {
        let testItem = createVMBuilder().field('Field1').positive({});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            }
        });
    });
    // positive(null)
    test('positive(null), creates ValidatorConfig with PositiveCondition with only type assigned', () => {
        let testItem = createVMBuilder().field('Field1').positive(null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <PositiveConditionConfig>{
                conditionType: ConditionType.Positive
            }
        });
    });

});
describe('integer as a validator of a field()', () => {
    test('integer(), creates ValidatorConfig with IntegerCondition with type=Integer', () => {

        let testItem = createVMBuilder().field('Field1').integer();
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            }
        });
    });
    // integer(errorMessage)
    test('integer(errorMessage), creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').integer('Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            },
            errorMessage: 'Error'
        });
    });
    // integer(errorMessage, summaryMessage)
    test('integer(errorMessage, summaryMessage), creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').integer('Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // integer(null, summaryMessage)
    test('integer(null, summaryMessage), creates ValidatorConfig with IntegerCondition with only type assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').integer(null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            },
            summaryMessage: 'Summary'
        });
    });
    // integer({ errorMessage, summaryMessage })
    test('integer({ errorMessage, summaryMessage }), creates ValidatorConfig with IntegerCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').integer(
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // integer({})
    test('integer({}), creates ValidatorConfig with IntegerCondition with only type assigned', () => {
        let testItem = createVMBuilder().field('Field1').integer({});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            }
        });
    });
    // integer(null)
    test('integer(null), creates ValidatorConfig with IntegerCondition with only type assigned', () => {
        let testItem = createVMBuilder().field('Field1').integer(null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <IntegerConditionConfig>{
                conditionType: ConditionType.Integer
            }
        });
    });

});

describe('maxDecimals as a validator of a field()', () => {
    test('maxDecimals(2), creates ValidatorConfig with MaxDecimalsCondition with type=MaxDecimals', () => {

        let testItem = createVMBuilder().field('Field1').maxDecimals(2);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            }
        });
    });
    // maxDecimals(2, errorMessage)
    test('maxDecimals(2, errorMessage), creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').maxDecimals(2, 'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            },
            errorMessage: 'Error'
        });
    });
    // maxDecimals(2, errorMessage, summaryMessage)
    test('maxDecimals(2, errorMessage, summaryMessage), creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').maxDecimals(2, 'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // maxDecimals(2, null, summaryMessage)
    test('maxDecimals(2, null, summaryMessage), creates ValidatorConfig with MaxDecimalsCondition with only type assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').maxDecimals(2, null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            },
            summaryMessage: 'Summary'
        });
    });
    // maxDecimals(2, { errorMessage, summaryMessage })
    test('maxDecimals(2, { errorMessage, summaryMessage }), creates ValidatorConfig with MaxDecimalsCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1').maxDecimals(2,
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    // maxDecimals(2, {})
    test('maxDecimals(2, {}), creates ValidatorConfig with MaxDecimalsCondition with only type assigned', () => {
        let testItem = createVMBuilder().field('Field1').maxDecimals(2, {});
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            }
        });
    });
    // maxDecimals(2, null)
    test('maxDecimals(2, null), creates ValidatorConfig with MaxDecimalsCondition with only type assigned', () => {
        let testItem = createVMBuilder().field('Field1').maxDecimals(2, null);
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <MaxDecimalsConditionConfig>{
                conditionType: ConditionType.MaxDecimals,
                maxDecimals: 2
            }
        });
    });


});

describe('not as a validator of a field()', () => {

    test('not((1 child)), creates ValidatorConfig with NotCondition with type=Not and conditionConfigs populated', () => {
        let testItem = createVMBuilder().field('Field1')
            .not((children) => children.fieldValue('F1').requireText());
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            }
        });
    });
    test('not((1 child), error message) creates ValidatorConfig with NotCondition with only type assigned and errorMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1')
            .not(
                (children) => children.fieldValue('F1').requireText(),
                'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            },
            errorMessage: 'Error'
        });
    });
    test('not((1 child), error message, summary message) creates ValidatorConfig with NotCondition with only type assigned and errorMessage + summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1')
            .not(
                (children) => children.fieldValue('F1').requireText(),
                'Error',
                'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
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
    test('not((1 child), null, summary message) creates ValidatorConfig with NotCondition with only type assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1')
            .not((children) => children.fieldValue('F1').requireText(),
                null,
                'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <NotConditionConfig>{
                conditionType: ConditionType.Not,
                childConditionConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            },

            summaryMessage: 'Summary'
        });
    });    
    test('not((0 children) throws', () => {
        expect(()=> createVMBuilder()
            .field('Field1').not(
                (children) => null!)).toThrow();
    });

    test('When there are 2 child conditions, throws', () => {
        expect(() => createVMBuilder().field('Field1')
            .not((children) => {
                children.fieldValue('F1').requireText();
                children.fieldValue('F2').requireText();
            })).toThrow();
    });    
    test('Null as the function parameter throws', () => {
        let builder = createVMBuilder();
        expect(()=> builder.field('Field1').not(null!, 'Error')).toThrow(/notCallback/);
    });
    test('Non-function as the function parameter throws', () => {
        let builder = createVMBuilder();
        expect(() => builder.field('Field1').not({} as any, 'Error')).toThrow(/Function expected/);
    });    
});

describe('when as a validator of a field()', () => {
    test('when((cond), (cond)), creates ValidatorConfig with WhenCondition with type=When and both whenToEnableConfig and childConditionConfigs populated', () => {

        let testItem = createVMBuilder().field('Field1')
            .when(
                (whenBuilder) => whenBuilder.parentValue().regExp(/abc/),
                (thenBuilder) => thenBuilder.fieldValue('F1').requireText());
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                whenToEnableConfig: <any>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                },
                thenConfig: <any>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            }
        });
    });
    test('when((cond), (cond), error message) creates ValidatorConfig with WhenCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1')
            .when(
                (whenBuilder)=> whenBuilder.fieldValue('F2').regExp(/abc/),
                (thenBuilder) => thenBuilder.fieldValue('F1').requireText(),
                'Error');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
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
            },
            errorMessage: 'Error'
        });
    });

    // when((cond), (cond), error message, summary message)
    test('when((cond), (cond), error message, summary message) creates ValidatorConfig with WhenCondition with only type assigned and errorMessage + summaryMessage assigned', () => {

        let testItem = createVMBuilder().field('Field1')
            .when(
                (whenBuilder)=> whenBuilder.fieldValue('F2').regExp(/abc/),
                (thenBuilder) => thenBuilder.fieldValue('F1').requireText(),   
                'Error', 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
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
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('when((cond), (cond), null, summary message) creates ValidatorConfig with WhenCondition with only type assigned and summaryMessage assigned', () => {
        let testItem = createVMBuilder().field('Field1')
            .when(
                (whenBuilder)=> whenBuilder.fieldValue('F2').regExp(/abc/),
                (thenBuilder) => thenBuilder.fieldValue('F1').requireText(),   
                null, 'Summary');
        TestValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <WhenConditionConfig>{
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
            },
            summaryMessage: 'Summary'
        });
    });
    test('whenBuilder null throws', () => {
        expect(() => createVMBuilder().field('Field1')
            .when(null!,
                (thenBuilder) => thenBuilder.parentValue().requireText())).toThrow(/whenToEnableCallback/);
    });
    // when((0 children), (0 children), {}) creates ValidatorConfig with WhenCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned
    test('thenBuilder null throws', () => {
        expect(()=> createVMBuilder().field('Field1')
            .when((whenBuilder) => whenBuilder.parentValue().requireText(),
                null!)).toThrow(/thenCallback/);
    });
    test('whenBuilder returns null throws', () => {
        expect(() => createVMBuilder().field('Field1')
            .when((whenBuilder) => null!,
                (thenBuilder) => thenBuilder.parentValue().requireText())).toThrow(/whenToEnableConfig/);
    });
    // when((0 children), (0 children), {}) creates ValidatorConfig with WhenCondition with only type assigned. ErrorMessage is from first parameter, not validatorConfig assigned
    test('thenBuilder returns null throws', () => {
        expect(()=> createVMBuilder().field('Field1')
            .when((whenBuilder) => whenBuilder.parentValue().requireText(),
                (thenBuilder) => null!)).toThrow(/thenConfig/);
    });

    test('When whenBuilder has 2 child conditions, throws', () => {
        expect(() => createVMBuilder().field('Field1')
            .when(
                (whenBuilder) => {
                    whenBuilder.fieldValue('F1').requireText();
                    whenBuilder.fieldValue('F2').requireText();
                },
                (thenBuilder) => thenBuilder.parentValue().requireText(),
            )).toThrow();
    });    

    test('When thenBuilder has 2 child conditions, throws', () => {
        expect(() => createVMBuilder().field('Field1')
            .when((whenBuilder)=> whenBuilder.parentValue().requireText(),
                (thenBuilder) => {
                    thenBuilder.fieldValue('F1').requireText();
                    thenBuilder.fieldValue('F2').requireText();
                }
            )).toThrow();
    });    
      
    test('Non-function as the child function parameter throws', () => {
        let builder = createVMBuilder();
        expect(() => builder.field('Field1').when(
            (whenBuilder) => whenBuilder.parentValue().requireText(),
            {} as any,
            'Error')).toThrow(/Function expected/);
    });    
    test('Non-function as the enabler function parameter throws', () => {
        let builder = createVMBuilder();
        expect(() => builder.field('Field1').when(
            {} as any,  // when
            (thenBuilder) => thenBuilder.parentValue().requireText(),
            'Error')).toThrow(/Function expected/);
    });        
});
