
import
    {
        AllMatchCondition,
        AllMatchConditionConfig,
        AnyMatchCondition,
        AnyMatchConditionConfig,
        CountMatchesCondition,
        CountMatchesConditionConfig,
        DataTypeCheckCondition,
        DataTypeCheckConditionConfig,
        IntegerCondition,
        IntegerConditionConfig,
        MaxDecimalsCondition,
        MaxDecimalsConditionConfig,
        NotNullCondition, NotNullConditionConfig,
        PositiveCondition,
        PositiveConditionConfig,
        RangeCondition,
        type RangeConditionConfig,
        RegExpCondition,
        RegExpConditionConfig,
        RequireTextCondition,
        type RequireTextConditionConfig,
        StringLengthCondition,
        StringLengthConditionConfig
    } from "../../src/Conditions/ConcreteConditions";
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import
    {
        LogDetails, LoggingCategory, LoggingLevel,
        logGatheringErrorHandler, logGatheringHandler
    } from "../../src/Interfaces/LoggerService";
import { IDataTypeIdentifier } from './../../src/Interfaces/DataTypeIdentifier';

import { ConditionBase, ErrorResponseCondition } from '../../src/Conditions/ConditionBase';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { NumberConditionBase, NumberConditionBaseConfig } from "../../src/Conditions/NumberConditionBase";
import { OneValueConditionBase, OneValueConditionBaseConfig } from '../../src/Conditions/OneValueConditionBase';
import { RegExpConditionBase, RegExpConditionBaseConfig } from "../../src/Conditions/RegExpConditionBase";
import { IntegerConverter, NumericStringToNumberConverter, UTCDateOnlyConverter } from "../../src/DataTypes/DataTypeConverters";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ConditionCategory, ConditionConfig, ConditionEvaluateResult, ICondition } from "../../src/Interfaces/Conditions";
import { IDataTypeConverter } from '../../src/Interfaces/DataTypeConverters';
import { IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { IJivsServices } from "../../src/Interfaces/JivsServices";
import { IValueHost } from "../../src/Interfaces/ValueHost";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { ConsoleLoggerService } from '../../src/Services/ConsoleLoggerService';
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { DataTypeIdentifierService } from '../../src/Services/DataTypeIdentifierService';
import { CapturingLogger } from "../../src/Support/CapturingLogger";
import
    {
        AlwaysMatchesConditionType,
        DisposableConditionType,
        EvaluatesAsPromiseConditionType,
        IsUndeterminedConditionType,
        NeverMatchesConditionType,
        makeDisposable
    } from "../../src/Support/conditionsForTesting";
import { CodingError } from '../../src/Utilities/ErrorHandling';
import
    {
        MockJivsServices, MockValueHostsManager,
    } from "../TestSupport/mocks";

function setupServicesAndVM(): {
    services: IJivsServices,
    vhm: MockValueHostsManager
} {
    let services = new MockJivsServices(false, false);
    let logger = services.loggerService as CapturingLogger;
    logger.minLevel = LoggingLevel.Debug;
    logger.chainedLogger = new ConsoleLoggerService(LoggingLevel.Debug, undefined, true);
    let vhm = new MockValueHostsManager(services);

    return { services, vhm };
}

function setupWithValueHost(): {
    services: IJivsServices,
    vhm: MockValueHostsManager,
    vh: IFieldValueHost
} {
    let setup = setupServicesAndVM();
    let vh = setup.vhm.addMockFieldValueHost(
        'Property1', LookupKey.String, 'Label');
    return { ...setup, vh };
}

describe('ConditionBase class', () => {

    function setupTest(): {
        services: IJivsServices,
        vhm: MockValueHostsManager,
        testItem: Publicify_ConditionBase
    } {
        let setup =  setupServicesAndVM();
        let condition = new Publicify_ConditionBase({ conditionType: baseConditionType });
        return { ...setup, testItem: condition };
    }
    const baseConditionType = 'TEST';
    class Publicify_ConditionBase extends ConditionBase<ConditionConfig> {

        constructor(config: ConditionConfig) {
            super(config);
        }
        public publicify_generateCondition(config: ConditionConfig, services: IJivsServices): ICondition {
            return super.generateCondition(config, services);
        }

        public publicify_convertValueAndLookupKey(value: any, valueLookupKey: string | null | undefined,
            conversionLookupKey: string | null | undefined, services: IJivsServices): {
                value?: any,
                lookupKey?: string | null,
                failed: boolean
            } {
            return super.tryConversion(value, valueLookupKey, conversionLookupKey, services);
        }

        public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
            throw new Error('Method not implemented.');
        }
        protected get defaultCategory(): ConditionCategory {
            return ConditionCategory.Contents;
        }
        public gatherValueHostNames(collection: Set<string>, valueHostsManager: IValueHostsManager): void {
            throw new Error('Method not implemented.');
        }
        public publicify_ensureNoPromise(result: ConditionEvaluateResult | Promise<ConditionEvaluateResult>): ConditionEvaluateResult {
            return super.ensureNoPromise(result);
        }
        public publicify_logInvalidPropertyData(propertyName: string, errorMessage: string, services: IJivsServices, logLevel : LoggingLevel): void {
            super.logInvalidPropertyData(propertyName, errorMessage, services, logLevel);
        }
        public publicify_logTypeMismatch(services: IJivsServices, propertyName: string, propertyName2: string, propertyValue: any, propertyValue2: any): void {
            super.logTypeMismatch(services, propertyName, propertyName2, propertyValue, propertyValue2);
        }

        public publicify_log(services: IJivsServices, level: LoggingLevel, gatherFn: logGatheringHandler): void {
            super.logger(services).log(level, gatherFn);
        }
        public publicify_logQuick(services: IJivsServices, level: LoggingLevel, messageFn: () => string): void {
            super.logger(services).message(level, messageFn);
        }
        public publicify_logError(services: IJivsServices, error: Error, gatherFn?: logGatheringErrorHandler): void {
            super.logger(services).error(error, gatherFn);
        }
    }
    // create all unit tests

    test('generateCondition with known conditionType returns its instance', () => {
        let setup = setupTest();
        setup.services.conditionFactory.register<ConditionConfig>(baseConditionType,
            (config) => new Publicify_ConditionBase(config));

        let config: ConditionConfig = {
            conditionType: baseConditionType
        };

        let result = setup.testItem.publicify_generateCondition(config, setup.services);
        expect(result).toBeInstanceOf(ConditionBase);
    });
    test('generateCondition with unknown conditionType throws and logs', () => {
        let setup = setupTest();

        let config: ConditionConfig = {
            conditionType: 'UNKNOWN'
        };
        expect(() => setup.testItem.publicify_generateCondition(config, setup.services)).toThrow(/ConditionType not registered/);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('ConditionType not registered', LoggingLevel.Error)).toBeTruthy();
    });
    test('generateCondition when known condition throws minor Error during construction returns an ErrorResponseCondition', () => {
        class constructorThrowsMinorErrorCondition extends ConditionBase<ConditionConfig> {
            constructor(config: ConditionConfig) {
                super(config);
                throw new Error('Test Error');
            }
            evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
                throw new Error('Method not implemented.');
            }
            gatherValueHostNames(collection: Set<string>, valueHostsManager: IValueHostsManager): void {
                throw new Error('Method not implemented.');
            }
            protected get defaultCategory(): ConditionCategory {
                throw new Error('Method not implemented.');
            }
        }
        let setup = setupTest();
        setup.services.conditionFactory.register<ConditionConfig>('THROWS',
            (config) => new constructorThrowsMinorErrorCondition(config));

        let config: ConditionConfig = {
            conditionType: 'THROWS'
        };
        let result = setup.testItem.publicify_generateCondition(config, setup.services);
        expect(result).toBeInstanceOf(ErrorResponseCondition);
    
    });
    describe('convertValueAndLookupKey', () => {
        test('With null conversionLookupKey returns text value and valueLookupKey, with false=false', () => {
            let setup = setupTest();
            let result = setup.testItem.publicify_convertValueAndLookupKey(10, 'Number', null, setup.services);
            expect(result.value).toBe(10);
            expect(result.lookupKey).toBe('Number');
            expect(result.failed).toBeFalsy();
            result = setup.testItem.publicify_convertValueAndLookupKey('10', 'String', null, setup.services);
            expect(result.value).toBe('10');
            expect(result.lookupKey).toBe('String');
            expect(result.failed).toBeFalsy();
        });

        test('With undefined conversionLookupKey returns text value and valueLookupKey, with false=false', () => {
            let setup = setupTest();
            let result = setup.testItem.publicify_convertValueAndLookupKey(10, 'Number', undefined, setup.services);
            expect(result.value).toBe(10);
            expect(result.lookupKey).toBe('Number');
            expect(result.failed).toBeFalsy();
            result = setup.testItem.publicify_convertValueAndLookupKey('10', 'String', undefined, setup.services);
            expect(result.value).toBe('10');
            expect(result.lookupKey).toBe('String');
            expect(result.failed).toBeFalsy();
        });
        test('use NumericStringToNumberConverter to change string value and lookupKey=null to number and LookupKey.Number', () => {
            let setup = setupTest();
            setup.services.dataTypeConverterService.register(new NumericStringToNumberConverter());
            let result = setup.testItem.publicify_convertValueAndLookupKey(
                '10', null, LookupKey.Number, setup.services);
            expect(result.value).toBe(10);
            expect(result.lookupKey).toBe(LookupKey.Number);
            expect(result.failed).toBeFalsy();
        });
        // same but pass in lookupKey as string
        test('use NumericStringToNumberConverter to change string value and lookupKey=String to number and LookupKey.Number', () => {
            let setup = setupTest();
            setup.services.dataTypeConverterService.register(new NumericStringToNumberConverter());
            let result = setup.testItem.publicify_convertValueAndLookupKey(
                '10', LookupKey.String, LookupKey.Number, setup.services);
            expect(result.value).toBe(10);
            expect(result.lookupKey).toBe(LookupKey.Number);
            expect(result.failed).toBeFalsy();
        });
        test('with value and lookupKey that fails conversion returns failed as true', () => {
            let setup = setupTest();
            let result = setup.testItem.publicify_convertValueAndLookupKey(10, LookupKey.Number, LookupKey.Date, setup.services);
            expect(result.failed).toBeTruthy();
            expect(result.value).toBeUndefined();
            expect(result.lookupKey).toBeUndefined();
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Value cannot be converted', LoggingLevel.Warn);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.message).toContain(LookupKey.Date);
            expect(logDetails!.data).toEqual({
                value: 10,
                valueLookupKey: LookupKey.Number,
                conversionLookupKey: LookupKey.Date
            });

        });
    });
    describe('ensureNoPromise', () => {
        test('ensureNoPromise with ConditionEvaluateResult returns the same result', () => {
            let setup = setupTest();
            let result = setup.testItem.publicify_ensureNoPromise(ConditionEvaluateResult.Match);
            expect(result).toBe(ConditionEvaluateResult.Match);
        });
        test('ensureNoPromise with Promise<ConditionEvaluateResult> throws CodingError', () => {
            let setup = setupTest();
            let testPromise = new Promise<ConditionEvaluateResult>((resolve, reject) => {
                resolve(ConditionEvaluateResult.Match);
            });
            expect(() => setup.testItem.publicify_ensureNoPromise(testPromise)).toThrow(CodingError);
        });
        
    });
    describe('logInvalidPropertyData', () => {
        test('logInvalidPropertyData logs level=error message', () => {
            let setup = setupTest();
            setup.testItem.publicify_logInvalidPropertyData('Property1', 'Error Message', setup.services, LoggingLevel.Error);
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Property1', LoggingLevel.Error, LoggingCategory.Configuration);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.message).toContain('Error Message');
            expect(logDetails!.data).toEqual({
                propertyName: 'Property1'
            });
        });
        test('logInvalidPropertyData logs level=warn message', () => {
            let setup = setupTest();
            setup.testItem.publicify_logInvalidPropertyData('Property1', 'Warn Message', setup.services, LoggingLevel.Warn);
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Property1', LoggingLevel.Warn, LoggingCategory.Configuration);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.message).toContain('Warn Message');
            expect(logDetails!.data).toEqual({
                propertyName: 'Property1'
            });
        });        
    });
    // logTypeMismatch tests
    describe('logTypeMismatch', () => {
        test('logTypeMismatch logs error message', () => {
            let setup = setupTest();
            setup.testItem.publicify_logTypeMismatch(setup.services, 'Property1', 'Property2', 10, '10');
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Type Mismatch', LoggingLevel.Warn, LoggingCategory.TypeMismatch);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.message).toContain('Property1');
            expect(logDetails!.message).toContain('Property2');
            expect(logDetails!.data).toEqual({
                value: 10,
                secondValue: '10'
            });
        });
    });
    // log tests
    describe('log', () => {
        test('log with logGatheringHandler logs message', () => {
            let setup = setupTest();
            setup.testItem.publicify_log(setup.services, LoggingLevel.Debug, (options) => {
                let logDetails: LogDetails = {
                    message: 'Test Message',
                    category: LoggingCategory.Result,
                    data: {
                        Value1: 'Value1'
                    }
                }
                return logDetails;
            });
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Test Message', LoggingLevel.Debug, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails?.feature).toBe('Condition');
            expect(logDetails?.type).toBe('Publicify_ConditionBase');
            expect(logDetails!.identity).toBe(baseConditionType)
            expect(logDetails!.data).toEqual({
                Value1: 'Value1'
            });
        });
    });
    describe('logQuick', () => {
        test('logQuick logs message', () => {
            let setup = setupTest();
            setup.testItem.publicify_logQuick(setup.services, LoggingLevel.Debug,
                () => 'Quick Message');
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Quick Message', LoggingLevel.Debug);
            expect(logDetails).toBeTruthy();
            expect(logDetails?.feature).toBe('Condition');
            expect(logDetails?.type).toBe('Publicify_ConditionBase');
            expect(logDetails!.identity).toBe(baseConditionType)
            expect(logDetails!.data).toBeUndefined();
        });
    });
    describe('logError', () => {
        test('logError with non-severe error class logs error message but does not throw', () => {
            let setup = setupTest();
            setup.testItem.publicify_logError(setup.services, new Error('Test Error'));
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Test Error', LoggingLevel.Error, LoggingCategory.Exception);
            expect(logDetails).toBeTruthy();
            expect(logDetails?.feature).toBe('Condition');
            expect(logDetails?.type).toBe('Publicify_ConditionBase');
            expect(logDetails!.identity).toBe(baseConditionType)
        });
        test('logError with severe error class logs error message and throws', () => {
            let setup = setupTest();
            expect(() => setup.testItem.publicify_logError(setup.services, new CodingError('Test Error'))).toThrow(CodingError);
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Test Error', LoggingLevel.Error, LoggingCategory.Exception);
            expect(logDetails).toBeTruthy();
            expect(logDetails?.feature).toBe('Condition');
            expect(logDetails?.type).toBe('Publicify_ConditionBase');
            expect(logDetails!.identity).toBe(baseConditionType)
        });
    });
    
    describe('ErrorResponseCondition class mini-tests', () =>{
        test('ErrorResponseCondition has category of Error', () => {
            let testItem = new ErrorResponseCondition();
            expect(testItem.category).toBe(ConditionCategory.Undetermined);
            expect(testItem.conditionType).toBe(ConditionType.Unknown);
            let evaluateResult: ConditionEvaluateResult | null = null;
            expect(() => evaluateResult = testItem.evaluate(null, null!) as ConditionEvaluateResult).not.toThrow();
            expect(evaluateResult).toBe(ConditionEvaluateResult.Undetermined);
        });
    });

});

describe('OneValueConditionBase class', () => {
    const oneValueBaseConditionType = 'TEST';
    class Publicify_OneValueConditionBase extends OneValueConditionBase<OneValueConditionBaseConfig> {
        constructor(config: OneValueConditionBaseConfig) {
            super(config);
        }
        public publicify_ensurePrimaryValueHost(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): IValueHost {
            return super.ensurePrimaryValueHost(valueHost, valueHostsManager);
        }
        public publicify_getValueHost(valueHostName: ValueHostName, valueHostsManager: IValueHostsManager): IValueHost | null {
            return super.getValueHost(valueHostName, valueHostsManager);
        }
        public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
            let vh = this.ensurePrimaryValueHost(valueHost, valueHostsManager);
            return ConditionEvaluateResult.Undetermined;
        }
        protected get defaultCategory(): ConditionCategory {
            throw new Error('Method not implemented.');
        }        
    }

    describe('publicify_ensurePrimaryValueHost', () => {
        test('with ValueHostName = null and vh parameter = assigned works normally', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = {
                conditionType: oneValueBaseConditionType,
                valueHostName: null
            };
            let testItem = new Publicify_OneValueConditionBase(config);
            let resultVH = testItem.publicify_ensurePrimaryValueHost(setup.vh, setup.vhm);
            expect(resultVH).toBeTruthy();
            expect(resultVH.getName()).toBe('Property1');
        });      
        test('with ValueHostName = valid property name and vh parameter = assigned works normally', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = {
                conditionType: oneValueBaseConditionType,
                valueHostName: 'Property1'
            };
            let testItem = new Publicify_OneValueConditionBase(config);
            let resultVH = testItem.publicify_ensurePrimaryValueHost(setup.vh, setup.vhm);
            expect(resultVH).toBeTruthy();
            expect(resultVH.getName()).toBe('Property1');
         });                
        test('Config.valueHostName with unknown name logs and throws', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = {
                conditionType: oneValueBaseConditionType,
                valueHostName: 'PropertyNotRegistered'
            };
            let testItem = new Publicify_OneValueConditionBase(config);
            let logger = setup.services.loggerService as CapturingLogger;
            expect(() => testItem.publicify_ensurePrimaryValueHost(setup.vh, setup.vhm)).toThrow(/valueHostName/);
            expect(logger.findMessage('is unknown', LoggingLevel.Error, LoggingCategory.Configuration)).toBeTruthy();
        });

        test('ensurePrimaryValueHost with ValueHostName = null and parameter = null throws exception', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = {
                conditionType: oneValueBaseConditionType,
                valueHostName: null
            };
            let testItem = new Publicify_OneValueConditionBase(config);
            expect(() => testItem.publicify_ensurePrimaryValueHost(null, setup.vhm)).toThrow(/Missing value/);
            let logger = setup.services.loggerService as CapturingLogger;
            expect(logger.findMessage('Missing value', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();

        });

    });
    describe('publicify_getValueHost', () => {
        test('with ValueHostName = empty string returns null', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = {
                conditionType: oneValueBaseConditionType,
                valueHostName: null
            };
            let testItem = new Publicify_OneValueConditionBase(config);
            let resultVH = testItem.publicify_getValueHost('', setup.vhm);
            expect(resultVH).toBeNull();
        });
        test('with ValueHostName = known property name returns ValueHost', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = {
                conditionType: oneValueBaseConditionType,
                valueHostName: 'Property1'
            };
            let testItem = new Publicify_OneValueConditionBase(config);
            let resultVH = testItem.publicify_getValueHost('Property1', setup.vhm);
            expect(resultVH).toBeTruthy();
            expect(resultVH!.getName()).toBe('Property1');
        });
        test('with ValueHostName = unknown property name returns null', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = {
                conditionType: oneValueBaseConditionType,
                valueHostName: 'Property1'
            };
            let testItem = new Publicify_OneValueConditionBase(config);
            let resultVH = testItem.publicify_getValueHost('PropertyNotRegistered', setup.vhm);
            expect(resultVH).toBeNull();
        });
    });
    describe('dispose', () => {
        test('dispose', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = {
                conditionType: oneValueBaseConditionType,
                valueHostName: null
            };
            let testItem = new Publicify_OneValueConditionBase(config);
            testItem.dispose();
            expect(() => testItem.evaluate(null, setup.vhm)).toThrow(TypeError);
        });
        test('dispose with IDisposable on config ', () => {
            let setup = setupWithValueHost();

            let config: OneValueConditionBaseConfig = makeDisposable({
                conditionType: oneValueBaseConditionType,
                valueHostName: null,
                trim: true
            });
            let testItem = new Publicify_OneValueConditionBase(config);
            testItem.dispose();
            expect(() => testItem.evaluate(null, setup.vhm)).toThrow(TypeError);
        });
    });
});

describe('class DataTypeCheckCondition', () => {
    test('DefaultConditionType', () => {
        expect(DataTypeCheckCondition.DefaultConditionType).toBe(ConditionType.DataTypeCheck);
    });
    test('evaluate returns Match when text value is not undefined and native Value is not undefined', () => {
        let setup = setupWithValueHost();

        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };

        let testItem = new DataTypeCheckCondition(config);
        setup.vh.setValues('A', 'A');
        expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.Match);
        setup.vh.setValues(10, '10');
        expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.Match);
        setup.vh.setValues(null, '');
        expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.Match);
        setup.vh.setValues(false, 'NO');
        expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate returns NoMatch when text value is not undefined but native Value is undefined', () => {
        let setup = setupWithValueHost();

        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);
        setup.vh.setTextValue('A');    // at this moment, setValue is undefined
        expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.NoMatch);
        setup.vh.setValues(undefined, '10');
        expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate returns Undetermined when text value is undefined', () => {
        let setup = setupWithValueHost();

        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);
        // at this moment, setValue is undefined
        expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.Undetermined);
        setup.vh.setValue(10);    // doesn't change text value...
        expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Using Unknown property', () => {
        let setup = setupWithValueHost();

        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'UnknownProperty',
        };
        let testItem = new DataTypeCheckCondition(config);
        expect(() => testItem.evaluate(setup.vh, setup.vhm)).toThrow(/is unknown/);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('is unknown', LoggingLevel.Error)).toBeTruthy();

    });    

    test('Using StaticValueHost for property throws', () => {
        let setup = setupWithValueHost();
        let vh2 = setup.vhm.addMockValueHost(
            'Property2', LookupKey.String, 'Label');

        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property2',
        };
        let testItem = new DataTypeCheckCondition(config);
        expect(() => testItem.evaluate(vh2, setup.vhm)).toThrow(/Invalid ValueHost used/);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('Invalid ValueHost used', LoggingLevel.Error)).toBeTruthy();

    });        

    test('category is DataTypeCheck', () => {
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let testItem = new DataTypeCheckCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new DataTypeCheckCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: 'Property1',
        };
        let condition = new DataTypeCheckCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let config: DataTypeCheckConditionConfig = {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: null,
        };
        let condition = new DataTypeCheckCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});
describe('class RequireTextCondition', () => {
    test('DefaultConditionType', () => {
        expect(RequireTextCondition.DefaultConditionType).toBe(ConditionType.RequireText);
    });
    test('evaluate returns Match', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1'
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' ');   // no trimming built in for evaluate
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });

    test('evaluate returns NoMatch', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1'
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue('');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate with value of null and config.nullValueResult is undefined, returns NoMatch', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1'
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate not influenced by Config.trim=true because trim is for evaluateDuringEdit', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            trim: true,
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);

    });
    function testNullValueResult(nullValueResult: ConditionEvaluateResult) : void
    {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            nullValueResult: nullValueResult
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(nullValueResult);

    }
    test('evaluate returns Match for null when Config.nullValueResult = Match', () => {
        testNullValueResult(ConditionEvaluateResult.Match);
    });
    test('evaluate returns NoMatch for null when Config.nullValueResult = NoMatch', () => {
        testNullValueResult(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate returns Undetermined for null when Config.nullValueResult = Undefined', () => {
        testNullValueResult(ConditionEvaluateResult.Undetermined);
    });    
    test('evaluate returns Undetermined for undefined, and non-string types', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(10);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });

    test('evaluateDuringEdits returns Match', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.evaluateDuringEdits('A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' A', vh, services)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluateDuringEdits returns NoMatch', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            trim: true
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('Config.trim undefined works like Trim=true', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.evaluateDuringEdits('A', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' A', vh, services)).toBe(ConditionEvaluateResult.Match);
    });

    test('category is Require', () => {
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Require);
    });
    test('category is overridden', () => {
        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new RequireTextCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: 'Property1',
        };
        let condition = new RequireTextCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null,
        };
        let condition = new RequireTextCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});

describe('class RegExpConditionBase', () => {
    class TestRegExpConditionBase extends RegExpConditionBase<RegExpConditionBaseConfig> 
    {
        protected getRegExp(services: IJivsServices): RegExp {
            return /^\d*$/;
        }
        
    }
    test('Text contains "ABC" somewhere (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1'
        };
        let testItem = new TestRegExpConditionBase(config);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
});

describe('class RegExpCondition', () => {
    test('DefaultConditionType', () => {
        expect(RegExpCondition.DefaultConditionType).toBe(ConditionType.RegExp);
    });    
    test('Text contains "ABC" somewhere (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' ABC ');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('abc'); // case sensitive failure
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('AB\nC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" somewhere (case insensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: 'ABC',
            ignoreCase: true
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('abc');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('zabc');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' AbC ');   
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ab');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('AB\nC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" as the complete text (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            multiline: false
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC ');  // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('Text contains "ABC" somewhere in multiline text (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            multiline: true
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC ');  // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Uses RegExp instance with case insensitive. Text contains "ABC" somewhere in multiline text (case sensitive). evaluate returns Match if it is present and NoMatch if not', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expression: /^ABC$/im
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('ABCDEF');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('zABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' ABC ');   // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('FirstLine\nABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('FirstLine\nABC\nLastLine');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate not influenced by Config.trim=true', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            trim: true
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' ABC ');  // trim is not used unless duringEdit=true
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('Config lacks both expression and expressionAsString. Throws', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        expect(() => testItem.evaluate(vh, vhm)).toThrow(/regular expression/);
    });

    test('With duringEdit = true and supportsDuringEdit=true, text must exactly match ABC case insensitively for match', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: true
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.evaluateDuringEdits('ABC', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('ABCDEF', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('zABC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
         // trimming defaults to true
        expect(testItem.evaluateDuringEdits(' ABC ', vh, services)).toBe(ConditionEvaluateResult.Match);
        // case sensitive 
        expect(testItem.evaluateDuringEdits('abc', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('AB\nC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With duringEdit = true and supportsDuringEdit=false, always return Undetermined', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: false
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.evaluateDuringEdits('ABC', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('ABCDEF', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('zABC', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
         // trimming defaults to true
        expect(testItem.evaluateDuringEdits(' ABC ', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        // case sensitive 
        expect(testItem.evaluateDuringEdits('abc', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('AB\nC', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With duringEdit = true and supportsDuringEdit=true and trim=false, text must exactly match trimmed ABC case insensitively for match', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: '^ABC$',
            ignoreCase: true,
            supportsDuringEdit: true,
            trim: false
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.evaluateDuringEdits('ABC', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('ABCDEF', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('zABC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' ABC ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        // case sensitive 
        expect(testItem.evaluateDuringEdits('abc', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('AB\nC', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('category is DataTypeCheck', () => {
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new RegExpCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
        };
        let condition = new RegExpCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: null,
        };
        let condition = new RegExpCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('dispose', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Property1',
            expressionAsString: 'ABC'
        };
        let testItem = new RegExpCondition(config);
        vh.setValue('ABC');
        testItem.evaluate(vh, vhm);  // creates the regex
        testItem.dispose();
        expect(()=> testItem.evaluate(vh, vhm)).toThrow(TypeError);
    });
});

describe('class RangeCondition', () => {
    test('DefaultConditionType', () => {
        expect(RangeCondition.DefaultConditionType).toBe(ConditionType.Range);
    });    
    test('evaluate when Min/Max assigned to string returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let testItem = new RangeCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('B');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('C');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('D');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('F');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('G');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('H');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('c');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('g');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate when Min/Max assigned to number returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: -8,
            maximum: 25
        };
        let testItem = new RangeCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(0);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-9);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(-8);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-7);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(24);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(25);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(26);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate when Min/Max assigned to date returns Match inside of range; NoMatch outside of range', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.Date, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: new Date(Date.UTC(2000, 5, 1)),
            maximum: new Date(Date.UTC(2000, 5, 30))
        };
        let testItem = new RangeCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(new Date(Date.UTC(2000, 4, 31)));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(new Date(Date.UTC(2000, 5, 1)));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new Date(Date.UTC(2000, 5, 2)));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new Date(Date.UTC(2000, 5, 29)));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new Date(Date.UTC(2000, 5, 30)));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new Date(Date.UTC(2000, 6, 1)));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate when Min is unassigned and Max assigned to string returns Match less than or equal to Max; NoMatch otherwise', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: undefined,
            maximum: 'G'
        };
        let testItem = new RangeCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('.');   // some ascii before A
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('B');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('F');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('G');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('H');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('c');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('g');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate when Min is assigned and Max unassigned to string returns Match greater than or equal to Min; NoMatch otherwise', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'C',
            maximum: null   // should work like undefined
        };
        let testItem = new RangeCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('.');   // some ascii before A
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('B');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('C');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('D');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('F');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('G');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('H');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('c');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });


    test('evaluate returns Undetermined for null or undetermined', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let logger = services.loggerService as CapturingLogger;
        let testItem = new RangeCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        let logDetails = logger.findMessage('lacks value to evaluate', LoggingLevel.Warn, LoggingCategory.Configuration);
        expect(logDetails).toBeTruthy();
        expect(logDetails!.message).toContain('value:');
        logger.clearAll();
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        logDetails = logger.findMessage('lacks value to evaluate', LoggingLevel.Warn, LoggingCategory.Configuration);
        expect(logDetails).toBeTruthy();
        expect(logDetails!.message).toContain('value:');
    });
    test('evaluate when Minimum is different data type from Value', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'G',    // this is a mismatch
            maximum: 10  // this is OK
        };
        let testItem = new RangeCondition(config);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService as CapturingLogger;
        let logDetails = logger.findMessage('Type mismatch. Value cannot be compared to Minimum', LoggingLevel.Warn, LoggingCategory.TypeMismatch);
        expect(logDetails).toBeTruthy();
        expect(logDetails!.data).toEqual({
            secondValue: 'G',
            value: 100
        });
     
    });
    test('evaluate when Maximum is different data type from Value', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 10, // this is OK
            maximum: 'H'    // this is a mismatch
        };
        let testItem = new RangeCondition(config);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService as CapturingLogger;
        let logDetails = logger.findMessage('Type mismatch. Value cannot be compared to Maximum', LoggingLevel.Warn, LoggingCategory.TypeMismatch);
        expect(logDetails).toBeTruthy();
        expect(logDetails!.data).toEqual({
            secondValue: 'H',
            value: 100
        });
    });
    test('Using IntegerConverter, evaluate to show that ConversionLookupKey is applied correctly.', () => {
        let services = new MockJivsServices(false, true);
        (services.dataTypeConverterService as DataTypeConverterService).register(new IntegerConverter());
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.Number, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 1.6,
            maximum: 6.1,
            conversionLookupKey: LookupKey.Integer
        };
        let testItem = new RangeCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(1.99);  // will round down to 1, below the minimum
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(6.1);   // will round down to 6, below the maximum
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(6.99);   // will round down to 6, below the maximum
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);

    });    
    test('getValuesForTokens with non-null values for parameters', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 'C',
            maximum: 'G'
        };
        let testItem = new RangeCondition(config);
        let list = testItem.getValuesForTokens(vh, vhm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Minimum',
                associatedValue: 'C',
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: 'G',
                purpose: 'parameter'
            }
        ]);
    });
    test('getValuesForTokens with null values for parameters', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: undefined,
            maximum: null
        };
        let testItem = new RangeCondition(config);
        let list = testItem.getValuesForTokens(vh, vhm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Minimum',
                associatedValue: null,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: null,
                purpose: 'parameter'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: null
        };
        let testItem = new RangeCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents,
            minimum: 2,
            maximum: null
        };
        let testItem = new RangeCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            minimum: 2,
            maximum: undefined,
            valueHostName: 'Property1',
        };
        let condition = new RangeCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            minimum: 2,
            maximum: undefined,
            valueHostName: null,
        };
        let condition = new RangeCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});



describe('class StringLengthCondition', () => {
    test('DefaultConditionType', () => {
        expect(StringLengthCondition.DefaultConditionType).toBe(ConditionType.StringLength);
    });
    test('evaluate when both Min/Max are assigned returns Match inside of stringlength; NoMatch outside of stringlength', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5
        };
        let testItem = new StringLengthCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' 1');  // trim option does not matter
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('12');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1234');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' 1234 ');  // trim option does not mattern
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('12345');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('123456');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('12345 ');  // trim option doesn't matter
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('evaluate when Min is assigned, Max is null. Match when >= Min', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: null
        };
        let testItem = new StringLengthCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('12');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('123');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1234567890');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate when Max is assigned, Min is null. Match when <= Max', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: null,
            maximum: 5
        };
        let testItem = new StringLengthCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('12');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('1234');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('12345');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('123456');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('1234567890');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('evaluate returns Undetermined for null, undefined, and non-number types', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: undefined,
            maximum: undefined
        };
        let testItem = new StringLengthCondition(config);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(100);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('evaluate when Trim is false', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5,
            trim: false
        };
        let testItem = new StringLengthCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(' ');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(' 1');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' 12 ');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(' 1234 ');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With duringEdit = true and supportsDuringEdit=true and trim undefined (means true) match according to the rules, ', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: true
            // trim: undefined means enabled
        };
        let testItem = new StringLengthCondition(config);
        vh.setTextValue('---- does not matter ----');
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('1', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' 1', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('12', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('1234', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' 1234 ', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('12345', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('123456', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('12345 ', vh, services)).toBe(ConditionEvaluateResult.Match);                
    });

    test('With duringEdit = true and supportsDuringEdit=true and trim = false, match according to the rules, ', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: true,
            trim: false
        };
        let testItem = new StringLengthCondition(config);
        vh.setTextValue('---- does not matter ----');
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('1', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits(' 1', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('12', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('1234', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits(' 1234 ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('12345', vh, services)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluateDuringEdits('123456', vh, services)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluateDuringEdits('12345 ', vh, services)).toBe(ConditionEvaluateResult.NoMatch);                
    });

    test('With duringEdit = true and supportsDuringEdit=false, always return Undetermined, ', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5,
            supportsDuringEdit: false
        };
        let testItem = new StringLengthCondition(config);
        vh.setTextValue('---- does not matter ----');
        expect(testItem.evaluateDuringEdits('', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('12', vh, services)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluateDuringEdits('123456', vh, services)).toBe(ConditionEvaluateResult.Undetermined);              
    });

    test('getValuesForTokens without calling evaluate and establishing length', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5
        };
        let testItem = new StringLengthCondition(config);
        let list = testItem.getValuesForTokens(vh, vhm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Length',
                associatedValue: 0,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Minimum',
                associatedValue: 2,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: 5,
                purpose: 'parameter'
            }
        ]);
    });
    test('getValuesForTokens with evaluating a string length of 5', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: 2,
            maximum: 5
        };
        vh.setValue("ABCDE");
        let testItem = new StringLengthCondition(config);
        testItem.evaluate(vh, vhm);
        let list = testItem.getValuesForTokens(vh, vhm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Length',
                associatedValue: 5,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Minimum',
                associatedValue: 2,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: 5,
                purpose: 'parameter'
            }
        ]);
    });
    test('getValuesForTokens with null values', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            minimum: null,
            maximum: null
        };
        vh.setValue("ABCDE");
        let testItem = new StringLengthCondition(config);
        testItem.evaluate(vh, vhm);
        let list = testItem.getValuesForTokens(vh, vhm);
        expect(list).not.toBeNull();
        expect(list).toEqual([
            {
                tokenLabel: 'Length',
                associatedValue: 5,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Minimum',
                associatedValue: null,
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: null,
                purpose: 'parameter'
            }
        ]);
    });    
    test('category is Comparison', () => {
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
        };
        let testItem = new StringLengthCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () => {
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new StringLengthCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: 'Property1'
        };
        let condition = new StringLengthCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,
            valueHostName: null
        };
        let condition = new StringLengthCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });            
});

describe('class AllMatchCondition', () => {
    test('DefaultConditionType', () => {
        expect(AllMatchCondition.DefaultConditionType).toBe(ConditionType.All);
    });
    test('With 0 child conditions, evaluates as Undetermined', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the last evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the first evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs not supplied, evaluates as Undetermined', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,

            }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,

            }],
            treatUndeterminedAs: ConditionEvaluateResult.NoMatch
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,
            }],
            treatUndeterminedAs: ConditionEvaluateResult.Undetermined
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions where the first evaluates as Undetermined but treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Parent ValueHost used by child RequireTextCondition', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: ConditionType.RequireText,
                // valueHostName omitted meaning it must use parent ValueHost
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                // valueHostName omitted meaning it must use parent ValueHost
                expressionAsString: 'ABC'
            }            ],
        };
        vh.setValue('ABC');    // for RequireTextCondition and RegExpCondition to match
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });    
    test('With 1 child that has invalid conditionConfig that evaluates as Undetermined and logs an error', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: 'Unknown'
            }]
        };
        let testItem = new AllMatchCondition(config);

        expect(()=> testItem.evaluate(vh, vhm)).toThrow(CodingError);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('ConditionType not registered', LoggingLevel.Error, null)).toBeTruthy();
    });
    test('With 1 child whose evaluate() function returns a Promise throws', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: EvaluatesAsPromiseConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);

        expect(() => testItem.evaluate(vh, vhm)).toThrow();
    });
    test('category is Children', () => {
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [],
            category: ConditionCategory.Contents
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames with no children has none', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostNames where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('gatherValueHostNames where two child have the same ValueHostName, while another is different. Expect 2 ValueHostNames', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },                
            ]
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('gatherValueHostNames where each child two have different ValueHosts, another is Null. Expect two ValueHostNames', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: null
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });        
    test('gatherValueHostNames where each child does not support gatherValueHostNames. No names returned', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                { conditionType: AlwaysMatchesConditionType },
                { conditionType: NeverMatchesConditionType }
            ]
        };
        let condition = new AllMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });        
    test('dispose followed by calls throws TypeErrors', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        testItem.dispose();
        expect(() => testItem.evaluate(vh, vhm)).toThrow(TypeError);
    });    
    test('dispose with IDisposable on childConfigs', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AllMatchConditionConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [{
                conditionType: DisposableConditionType
            }]
        };
        let testItem = new AllMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        testItem.dispose();
        expect(() => testItem.evaluate(vh, vhm)).toThrow(TypeError);
    });

});
describe('class AnyMatchCondition', () => {
    test('DefaultConditionType', () => {
        expect(AnyMatchCondition.DefaultConditionType).toBe(ConditionType.Any);
    });
    test('With 0 child conditions, evaluates as Undetermined', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: []
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as NoMatch, evaluates as NoMatch', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the last evaluates as NoMatch, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where the first evaluates as Match and the rest NoMatch, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });

    test('With 4 child conditions where all evaluate as NoMatch, evaluates as NoMatch', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            },
            {
                conditionType: NeverMatchesConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs not supplied, evaluates as Undetermined', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType
            }]
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,

            }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,

            }],
            treatUndeterminedAs: ConditionEvaluateResult.NoMatch
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined Or treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType,
            }],
            treatUndeterminedAs: ConditionEvaluateResult.Undetermined
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions where the first evaluates as Undetermined but treatUndeterminedAs=Match, evaluates as Match', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: IsUndeterminedConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            },
            {
                conditionType: AlwaysMatchesConditionType
            }],
            treatUndeterminedAs: ConditionEvaluateResult.Match
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
    });
    test('With 1 child that has invalid conditionConfig that evaluates as Undetermined and logs an error', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [{
                conditionType: 'Unknown'
            }]
        };
        let testItem = new AnyMatchCondition(config);

        expect(()=> testItem.evaluate(vh, vhm)).toThrow(CodingError);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('ConditionType not registered', LoggingLevel.Error, null)).toBeTruthy();
    });
    test('category is Children', () => {
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: []
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [],
            category: ConditionCategory.Contents
        };
        let testItem = new AnyMatchCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames with no children has none', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: []
        };
        let condition = new AnyMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostNames where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new AnyMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('gatherValueHostNames where two child have the same ValueHostName, while another is different. Expect 2 ValueHostNames', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },                
            ]
        };
        let condition = new AnyMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('gatherValueHostNames where each child two have different ValueHosts, another is Null. Expect two ValueHostNames', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: AnyMatchConditionConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: null
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new AnyMatchCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });            
});

describe('class CountMatchesCondition', () => {
    test('DefaultConditionType', () => {
        expect(CountMatchesCondition.DefaultConditionType).toBe(ConditionType.CountMatches);
    });
    function testCount(conditionTypes: Array<string>, minimum: number | undefined,
        maximum: number | undefined, expectedResult: ConditionEvaluateResult,
        treatUndeterminedAs?: ConditionEvaluateResult): void {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: minimum,
            maximum: maximum,
            conditionConfigs: []
        };
        if (treatUndeterminedAs != null)
            config.treatUndeterminedAs = treatUndeterminedAs;
        for (let conType of conditionTypes)
            config.conditionConfigs.push({
                conditionType: conType
            });
        let testItem = new CountMatchesCondition(config);
        expect(testItem.evaluate(vh, vhm)).toBe(expectedResult);
    }
    test('With 0 child conditions, evaluates as Undetermined', () => {
        testCount([], undefined, undefined, ConditionEvaluateResult.Undetermined);
    });
    test('With 1 child condition that evaluates as Match, Minimum=0, Maximum=1, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType], 0, 1, ConditionEvaluateResult.Match);

    });
    test('With 1 child condition that evaluates as Match, Minimum=2, Maximum=undefined, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType], 2, undefined, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Match, Minimum=undefined, Maximum=1, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType], undefined, 1, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions that evaluate as Match and Maximum=3, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            undefined, 3, ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as NoMatch and minimum=1, evaluates as NoMatch', () => {
        testCount([NeverMatchesConditionType], 1, undefined, ConditionEvaluateResult.NoMatch);

    });
    test('With 4 child conditions where one evaluates as NoMatch and Minimum=2, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType, NeverMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            2, undefined, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where one evaluates as NoMatch and Minimum=2 and Maximum=2, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType, NeverMatchesConditionType, AlwaysMatchesConditionType, AlwaysMatchesConditionType],
            2, 2, ConditionEvaluateResult.NoMatch);
    });
    test('With 4 child conditions where the first evaluates as NoMatch and Minimum=0, evaluates as Match', () => {
        testCount([NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            0, undefined, ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions where the first evaluates as NoMatch and Minimum=1, evaluates as NoMatch', () => {
        testCount([NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            1, undefined, ConditionEvaluateResult.NoMatch);
    });

    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Match, evaluates as Match', () => {
        testCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.Match,
            ConditionEvaluateResult.Match);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=NoMatch, evaluates as NoMatch', () => {
        testCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.NoMatch,
            ConditionEvaluateResult.NoMatch);
    });
    test('With 1 child condition that evaluates as Undetermined and treatUndeterminedAs=Undetermined, evaluates as Undetermined', () => {
        testCount([IsUndeterminedConditionType],
            undefined, undefined, ConditionEvaluateResult.Undetermined,
            ConditionEvaluateResult.Undetermined);
    });
    test('With 4 child conditions with Match, Undetermined, NoMatch, NoMatch and treatUndeterminedAs=Match and Minimum=2, evaluates as Match', () => {
        testCount([AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            2, undefined, ConditionEvaluateResult.Match,
            ConditionEvaluateResult.Match);
    });
    test('With 4 child conditions with Match, Undetermined, NoMatch, NoMatch and treatUndeterminedAs=NoMatch and Minimum=2, evaluates as NoMatch', () => {
        testCount([AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, NeverMatchesConditionType],
            2, undefined, ConditionEvaluateResult.NoMatch,
            ConditionEvaluateResult.NoMatch);
    });
    test('category is Children', () => {
        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: []
        };
        let testItem = new CountMatchesCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: [],
            category: ConditionCategory.Contents
        };
        let testItem = new CountMatchesCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames with no children has none', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: []
        };
        let condition = new CountMatchesCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
    test('gatherValueHostNames where each child has a different ValueHost. All are found in the results', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
  
        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new CountMatchesCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(3);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });    
    test('gatherValueHostNames where two child have the same ValueHostName, while another is different. Expect 2 ValueHostNames', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },                
            ]
        };
        let condition = new CountMatchesCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });    
    test('gatherValueHostNames where each child two have different ValueHosts, another is Null. Expect two ValueHostNames', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);

        let config: CountMatchesConditionConfig = {
            conditionType: ConditionType.CountMatches,
            conditionConfigs: [
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                },
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: null
                },             
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field3'
                },                
            ]
        };
        let condition = new CountMatchesCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field3')).toBe(true);
    });            
});

describe('class NotNullCondition', () => {
    test('DefaultConditionType', () => {
        expect(NotNullCondition.DefaultConditionType).toBe(ConditionType.NotNull);
    });
    function testValue(valueToTest: any, expectedConditionEvaluateResult: ConditionEvaluateResult)
    {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Property1',
        };

        let testItem = new NotNullCondition(config);
        vh.setValue(valueToTest);
        expect(testItem.evaluate(vh, vhm)).toBe(expectedConditionEvaluateResult);
    }

    test('evaluate with null results in NoMatch', () => {
        testValue(null,  ConditionEvaluateResult.NoMatch);    
    });    
    test('evaluate with undefined results in Undetermined', () => {
        testValue(undefined,  ConditionEvaluateResult.Undetermined);    
    });        
    test('evaluate without null or undefined results in Match', () => {
        testValue(0, ConditionEvaluateResult.Match);    
        testValue({}, ConditionEvaluateResult.Match);    
        testValue([],  ConditionEvaluateResult.Match);    
        testValue(false, ConditionEvaluateResult.Match);    
        testValue('', ConditionEvaluateResult.Match);
        testValue('', ConditionEvaluateResult.Match);            
        testValue(new Date(), ConditionEvaluateResult.Match);    
    });    

    test('evaluate with wrong ValueHost logs and throws', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'UnknownProperty'
        };
        let testItem = new NotNullCondition(config);
        vh.setValue('');
        expect(() => testItem.evaluate(null, vhm)).toThrow(/is unknown/);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('is unknown', LoggingLevel.Error, LoggingCategory.Configuration)).toBeTruthy(); 
    });
    test('category is Require', () => {
        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Property1',
        };
        let testItem = new NotNullCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Require);
    });
    test('category is overridden', () => {
        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new NotNullCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: 'Property1',
        };
        let condition = new NotNullCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);

        let config: NotNullConditionConfig = {
            conditionType: ConditionType.NotNull,
            valueHostName: null,
        };
        let condition = new NotNullCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });
});

describe('NumberConditionBase', () => {
    class TestNumberConditionBase extends NumberConditionBase<NumberConditionBaseConfig>
    {
        protected evaluateNumber(value: number, valueHost: IValueHost, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
            return value >= 0 ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
        }
        protected get defaultCategory(): ConditionCategory {
            return ConditionCategory.Undetermined
        }
        
    }
    test('Evaluate numbers that are positive are a match and less than 0 are not a match', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: null,
        };
        let testItem = new TestNumberConditionBase(config);
        vh.setValue(1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);   
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('evaluate non-numbers with converters. They result in a number to evaluate.', () => {
        let services = new MockJivsServices(false, true);
        
        services.dataTypeConverterService.register(new UTCDateOnlyConverter());
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());

        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1'
        };
        let testItem = new TestNumberConditionBase(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(new Date(2000, 0, 1));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('10');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue('0');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);      
        vh.setValue('-1');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);             
    });        
    test('Evaluate non-number types are undetermined', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: null,
        };
        let testItem = new TestNumberConditionBase(config);
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);      
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);                
    });    
    test('Evaluate objects that can be converted to a number use that number to evaluate. Positive are a match and less than 0 are not a match', () => {
        class NumberHolder
        {
            constructor(value: number)
            {
                this.value = value;
            }   
            public value: number;
        }
        class NumberHolderIdentifier implements IDataTypeIdentifier
        {
            dataTypeLookupKey: string = 'test';
            supportsValue(value: any): boolean {
                return value instanceof NumberHolder;
            }
            sampleValue() {
                return new NumberHolder(0);
            
            }
        }
        class NumberHolderConverter implements IDataTypeConverter
        {
            canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
                return value instanceof NumberHolder && resultLookupKey === LookupKey.Number;
            }
            convert(value: NumberHolder, sourceLookupKey: string | null, resultLookupKey: string) {
                return value.value;
            }
            supportedResultLookupKeys(): string[] {
                return [LookupKey.Number];
            }
            supportedSourceLookupKeys(): (string | null)[] {
                return [null];
            }
            sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                return value instanceof NumberHolder;
            }
            
        }
        let services = new MockJivsServices(false, true);
        (services.dataTypeIdentifierService as DataTypeIdentifierService).register(new NumberHolderIdentifier());
        (services.dataTypeConverterService as DataTypeConverterService).register(new NumberHolderConverter());        
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: null,
        };
        let testItem = new TestNumberConditionBase(config);
        vh.setValue(new NumberHolder(1));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(new NumberHolder(0));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);   
        vh.setValue(new NumberHolder(-1));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
    });    
    test('gatherValueHostNames when all are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: 'Property1',
        };
        let condition = new TestNumberConditionBase(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Property1')).toBe(true);
    });
    test('gatherValueHostNames when none are assigned', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let config: NumberConditionBaseConfig = {
            conditionType: 'TEST',
            valueHostName: null,
        };
        let condition = new TestNumberConditionBase(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vhm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });    
});

describe('PositiveCondition', () => {
    test('DefaultConditionType', () => {
        expect(PositiveCondition.DefaultConditionType).toBe(ConditionType.Positive);
    });    
    test('evaluate numbers; when 0 or higher, Match. When negative, NoMatch', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1'
        };
        let testItem = new PositiveCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0.1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue(0);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-0.1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
    });
    test('evaluate non-numbers with converters. They result in a number to evaluate.', () => {
        let services = new MockJivsServices(false, true);
        
        services.dataTypeConverterService.register(new UTCDateOnlyConverter());
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());

        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1'
        };
        let testItem = new PositiveCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(new Date(2000, 0, 1));
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('10');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue('0');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);      
        vh.setValue('-1');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);             
    });    
    test('evaluate non-numbers; all return Undetermined', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1'
        };
        let testItem = new PositiveCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);                
    });
    test('category is DataTypeCheck', () => {
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1'
        };
        let testItem = new PositiveCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: PositiveConditionConfig = {
            conditionType: ConditionType.Positive,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new PositiveCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});


describe('IntegerCondition', () => {
    test('DefaultConditionType', () => {
        expect(IntegerCondition.DefaultConditionType).toBe(ConditionType.Integer);
    });    
    test('evaluate numbers; when an integer, Match. When with decimals, noMatch', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1'
        };
        let testItem = new IntegerCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(1.1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(0.5);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(-1.9);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('evaluate non-numbers that have converters available results in numbers that can be evaluated', () => {
        let services = new MockJivsServices(false, true, 'en', true);

        services.dataTypeConverterService.register(new UTCDateOnlyConverter());
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1'
        };
        let testItem = new IntegerCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(new Date(2000, 0, 1));    // UTCDateConverter will convert this to an integer which is a match
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('10');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue('1.5');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
        vh.setValue('A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        
    });

    test('evaluate non-numbers; all return Undetermined', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1'
        };
        let testItem = new IntegerCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);                
    });
    test('category is DataTypeCheck', () => {
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1'
        };
        let testItem = new IntegerCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: IntegerConditionConfig = {
            conditionType: ConditionType.Integer,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents
        };
        let testItem = new IntegerCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });

});

describe('MaxDecimalsCondition', () => {
    test('DefaultConditionType', () => {
        expect(MaxDecimalsCondition.DefaultConditionType).toBe(ConditionType.MaxDecimals);
    });    
    test('constructor with maxDecimals null throws', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: null!
        };
        expect(() => new MaxDecimalsCondition(config)).toThrow(/maxDecimals/);
    });
    test('constructor with maxDecimals undefined throws', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: undefined!
        };
        expect(() => new MaxDecimalsCondition(config)).toThrow(/maxDecimals/);
    });    
    test('constructor with maxDecimals 0 throws', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 0
        };
        expect(() => new MaxDecimalsCondition(config)).toThrow(/must be 1/);
    });    
    test('evaluate numbers using maxDecimals=1; when integer or 1 decimal, match. All others NoMatch', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 1
        };
        let testItem = new MaxDecimalsCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(1.5);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(0.1);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue(-1.6);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue(1.51);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(0.66);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(-1.63);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
    });
    test('evaluate non-numbers that can be converted to numbers through a converter; they work like numbers', () => {
        let services = new MockJivsServices(false, true);

        services.dataTypeConverterService.register(new UTCDateOnlyConverter());
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());

        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 1
        };
        let testItem = new MaxDecimalsCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue(new Date(2000, 0, 1));    // UTCDateConverter will convert this to an integer which is a match
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);         
        vh.setValue('10');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        vh.setValue('10.35');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);

    });    
    test('evaluate non-numbers; all return Undetermined', () => {
        let services = new MockJivsServices(false, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 1
        };
        let testItem = new MaxDecimalsCondition(config);
        vh.setTextValue('---- does not matter ----');
        vh.setValue('A');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(false);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(undefined);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);                
    });
    test('category is DataTypeCheck', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            maxDecimals: 1
        };
        let testItem = new MaxDecimalsCondition(config);
        expect(testItem.category).toBe(ConditionCategory.DataTypeCheck);
    });
    test('category is overridden', () => {
        let config: MaxDecimalsConditionConfig = {
            conditionType: ConditionType.MaxDecimals,
            valueHostName: 'Property1',
            category: ConditionCategory.Contents,
            maxDecimals : 1
        };
        let testItem = new MaxDecimalsCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
});
