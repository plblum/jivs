import { CompareToValueConditionBase, CompareToValueConditionBaseConfig } from '../../src/Conditions/CompareToValueConditionBase';
import
    {
        EqualToCondition, EqualToConditionConfig, GreaterThanOrEqualCondition,
        GreaterThanOrEqualConditionConfig, GreaterThanCondition, GreaterThanConditionConfig,
        LessThanOrEqualValueCondition, LessThanOrEqualValueConditionConfig, LessThanValueCondition,
        LessThanValueConditionConfig, NotEqualToCondition, NotEqualToConditionConfig
    } from '../../src/Conditions/ComparisonCondition_classes';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { IntegerConverter, NumericStringToNumberConverter } from '../../src/DataTypes/DataTypeConverters';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionCategory, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { ComparersResult } from '../../src/Interfaces/DataTypeComparerService';
import { IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { IJivsServices } from '../../src/Interfaces/JivsServices';
import { LoggingCategory, LoggingLevel } from '../../src/Interfaces/LoggerService';
import { ConsoleLoggerService } from '../../src/Services/ConsoleLoggerService';
import { DataTypeConverterService } from '../../src/Services/DataTypeConverterService';
import { CapturingLogger } from '../../src/Support/CapturingLogger';
import { InvalidTypeError } from '../../src/Utilities/ErrorHandling';
import { MockJivsServices, MockValueHostsManager } from '../TestSupport/mocks';

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

describe('CompareToValueConditionBase class additional cases', () =>
{
    const baseConditionType = 'TEST';
    class Publicify_CompareToValueConditionBase extends CompareToValueConditionBase<CompareToValueConditionBaseConfig>
    {
        protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult
        {
            return ConditionEvaluateResult.Undetermined;
        }
    }
    describe('secondValue', () =>
    {
        test('getValuesForTokens supports {CompareTo} token', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost('Property2', LookupKey.Number, 'Second label');

            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: null,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
    

        test('Config.secondValuewith null logs and returns Undetermined', () =>
        {
            let setup = setupWithValueHost();
            let logger = setup.services.loggerService as CapturingLogger;
            setup.vh.setValue('');
            let config: CompareToValueConditionBaseConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: null,
                secondValue: null
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);
            expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.Undetermined);
            expect(logger.findMessage('secondValue: lacks value to evaluate', LoggingLevel.Warn, LoggingCategory.Configuration)).toBeTruthy();

        });
        test('Using NumericStringToNumberConverter, evaluate to show that config.conversionLookupKey is applied correctly.', () =>
        {
            let setup = setupServicesAndVM();
            setup.services.dataTypeConverterService.register(new NumericStringToNumberConverter());
            // vh1 will have a string that needs converting. vh2 does not need converting
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.String, 'Label1');
            vh1.setValue('100');

            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValue: 5,
                conversionLookupKey: LookupKey.Number
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            testItem.evaluate(null, setup.vhm);  // result does not matter. We are looking at logs for conversion facts
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Converted to type "Number"', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                value: 100,
                resolvedValue: true,
                converter: 'NumericStringToNumberConverter'
            }));
            logDetails = logger.findMessage('Comparison result', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                result: 'GreaterThan',
                comparer: '"DefaultComparer"'

            }));
        });
        // same test but using secondConversionLookupKey and second value
        test('Using NumericStringToNumberConverter, evaluate to show that config.secondConversionLookupKey is applied correctly.', () =>
        {
            let setup = setupServicesAndVM();
            setup.services.dataTypeConverterService.register(new NumericStringToNumberConverter());
            // vh1 will have a string that needs converting. vh2 does not need converting
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.Number, 'Label1');
            vh1.setValue(100);

            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValue: '8',
                secondConversionLookupKey: LookupKey.Number
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            testItem.evaluate(null, setup.vhm);  // result does not matter. We are looking at logs for conversion facts
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Converted to type "Number"', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                value: 8,
                resolvedValue: true,
                converter: 'NumericStringToNumberConverter'
            }));
            logDetails = logger.findMessage('Comparison result', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                result: 'GreaterThan',
                comparer: '"DefaultComparer"'

            }));
        });
        // now both first and second values need to convert string to number
        test('Using NumericStringToNumberConverter, evaluate to show that config.conversionLookupKey and secondConversionLookupKey are applied correctly.', () =>
        {
            let setup = setupServicesAndVM();
            setup.services.dataTypeConverterService.register(new NumericStringToNumberConverter());
            // vh1 will have a string that needs converting. vh2 does not need converting
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.String, 'Label1');
            vh1.setValue('100');

            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValue: '8',
                conversionLookupKey: LookupKey.Number,
                secondConversionLookupKey: LookupKey.Number
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            testItem.evaluate(null, setup.vhm);  // result does not matter. We are looking at logs for conversion facts
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage(null, LoggingLevel.Info, LoggingCategory.Result,
                {
                    data: {
                        value: 100
                    }
                }
            );
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                value: 100,
                resolvedValue: true,
                converter: 'NumericStringToNumberConverter'
            }));
            logDetails = logger.findMessage(null, LoggingLevel.Info, LoggingCategory.Result,
                { data: { value: 8 } }
            );
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                value: 8,
                resolvedValue: true,
                converter: 'NumericStringToNumberConverter'
            }));
            logDetails = logger.findMessage('Comparison result', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                result: 'GreaterThan',
                comparer: '"DefaultComparer"'

            }));
        
        });
        // test where conversionLookupKey is not registered. It should evaluate to Undetermined and log
        test('Using conversionLookupKey assigned to invalid value, evaluate to Undetermined and log.', () =>
        {
            let setup = setupServicesAndVM();
            // NumericStringToNumberConverter is not registered
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.String, 'Label1');
            vh1.setValue('100');

            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValue: 5,
                conversionLookupKey: LookupKey.Number   // no converter registered
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            expect(testItem.evaluate(null, setup.vhm)).toBe(ConditionEvaluateResult.Undetermined);
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Need a DataTypeConverter', LoggingLevel.Warn, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual({
                sourceLookupKey: LookupKey.String,
                resultLookupKey: LookupKey.Number
            });
        });

        // same bug for second value 
        test('Using secondConversionLookupKey assigned to invalid value, evaluate to Undetermined and log.', () =>
        {
            let setup = setupServicesAndVM();
            // NumericStringToNumberConverter is not registered
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.Number, 'Label1');
            vh1.setValue(100);

            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValue: '5',
                secondConversionLookupKey: LookupKey.Number   // no converter registered
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            expect(testItem.evaluate(null, setup.vhm)).toBe(ConditionEvaluateResult.Undetermined);
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Need a DataTypeConverter', LoggingLevel.Warn, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual({
                sourceLookupKey: null,
                resultLookupKey: LookupKey.Number
            });
        });

        test('evaluate throws an error when passed an invalid value type that is not either number or string because it cannot be converted to string or number', () =>
        {
            // compares a number to a boolean, which cannot be converted to number without a converter
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);
            vh.setValue(false);
            expect(() => testItem.evaluate(vh, vhm)).toThrow(InvalidTypeError);
        });
    });
    describe('secondValueHostName', () =>
    {
        test('getValuesForTokens with secondValueHostName assigned supports {SecondLabel} token', () =>
        {
            let setup = setupWithValueHost();

            let vh2 = setup.vhm.addMockFieldValueHost('Property2', LookupKey.Number, 'Second label');

            let config: CompareToValueConditionBaseConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);
            let list = testItem.getValuesForTokens(setup.vh, setup.vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: null,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: 'Second label',
                    purpose: 'label'
                }
            ]);
        });

        test('Config.secondValueHostName with unknown name logs and returns undetermined', () =>
        {
            let setup = setupWithValueHost();
            setup.vh.setValue('');
            let config: CompareToValueConditionBaseConfig = {
                conditionType: ConditionType.EqualTo,
                secondValueHostName: 'PropertyNotRegistered',
                valueHostName: null
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);
            let logger = setup.services.loggerService as CapturingLogger;
            expect(testItem.evaluate(setup.vh, setup.vhm)).toBe(ConditionEvaluateResult.Undetermined);
            expect(logger.findMessage('ValueHost not found', LoggingLevel.Error, LoggingCategory.Configuration)).toBeTruthy();
        });


        test('Using NumericStringToNumberConverter, evaluate to show that config.conversionLookupKey is applied correctly.', () =>
        {
            let setup = setupServicesAndVM();
            setup.services.dataTypeConverterService.register(new NumericStringToNumberConverter());
            // vh1 will have a string that needs converting. vh2 does not need converting
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.String, 'Label1');
            vh1.setValue('100');
            let vh2 = setup.vhm.addMockFieldValueHost('Property2', LookupKey.Number, 'Label2');
            vh2.setValue(5);
            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2',
                conversionLookupKey: LookupKey.Number
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            testItem.evaluate(null, setup.vhm);  // result does not matter. We are looking at logs for conversion facts
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Converted to type "Number"', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                value: 100,
                resolvedValue: true,
                converter: 'NumericStringToNumberConverter'
            }));
            logDetails = logger.findMessage('Comparison result', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                result: 'GreaterThan',
                comparer: '"DefaultComparer"'

            }));
        });
        // same test but using secondConversionLookupKey and second value
        test('Using NumericStringToNumberConverter, evaluate to show that config.secondConversionLookupKey is applied correctly.', () =>
        {
            let setup = setupServicesAndVM();
            setup.services.dataTypeConverterService.register(new NumericStringToNumberConverter());
            // vh1 will have a string that needs converting. vh2 does not need converting
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.Number, 'Label1');
            vh1.setValue(100);
            let vh2 = setup.vhm.addMockFieldValueHost('Property2', LookupKey.String, 'Label2');
            vh2.setValue('8');
            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2',
                secondConversionLookupKey: LookupKey.Number
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            testItem.evaluate(null, setup.vhm);  // result does not matter. We are looking at logs for conversion facts
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Converted to type "Number"', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                value: 8,
                resolvedValue: true,
                converter: 'NumericStringToNumberConverter'
            }));
            logDetails = logger.findMessage('Comparison result', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                result: 'GreaterThan',
                comparer: '"DefaultComparer"'

            }));
        });
        // now both first and second values need to convert string to number
        test('Using NumericStringToNumberConverter, evaluate to show that config.conversionLookupKey and secondConversionLookupKey are applied correctly.', () =>
        {
            let setup = setupServicesAndVM();
            setup.services.dataTypeConverterService.register(new NumericStringToNumberConverter());
            // vh1 will have a string that needs converting. vh2 does not need converting
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.String, 'Label1');
            vh1.setValue('100');
            let vh2 = setup.vhm.addMockFieldValueHost('Property2', LookupKey.String, 'Label2');
            vh2.setValue('8');
            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2',
                conversionLookupKey: LookupKey.Number,
                secondConversionLookupKey: LookupKey.Number
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            testItem.evaluate(null, setup.vhm);  // result does not matter. We are looking at logs for conversion facts
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage(null, LoggingLevel.Info, LoggingCategory.Result,
                {
                    data: {
                        value: 100
                    }
                }
            );
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                value: 100,
                resolvedValue: true,
                converter: 'NumericStringToNumberConverter'
            }));
            logDetails = logger.findMessage(null, LoggingLevel.Info, LoggingCategory.Result,
                { data: { value: 8 } }
            );
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                value: 8,
                resolvedValue: true,
                converter: 'NumericStringToNumberConverter'
            }));
            logDetails = logger.findMessage('Comparison result', LoggingLevel.Info, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual(expect.objectContaining({
                result: 'GreaterThan',
                comparer: '"DefaultComparer"'

            }));

        });
        // test where conversionLookupKey is not registered. It should evaluate to Undetermined and log
        test('Using conversionLookupKey assigned to invalid value, evaluate to  Undetermined and log.', () =>
        {
            let setup = setupServicesAndVM();
            // NumericStringToNumberConverter is not registered
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.String, 'Label1');
            vh1.setValue('100');
            let vh2 = setup.vhm.addMockFieldValueHost('Property2', LookupKey.Number, 'Label2');
            vh2.setValue(5);
            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2',
                conversionLookupKey: LookupKey.Number   // no converter registered
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            expect(testItem.evaluate(null, setup.vhm)).toBe(ConditionEvaluateResult.Undetermined);
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Need a DataTypeConverter', LoggingLevel.Warn, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual({
                sourceLookupKey: LookupKey.String,
                resultLookupKey: LookupKey.Number
            });
        });

        // same bug for second value 
        test('Using secondConversionLookupKey assigned to invalid value, evaluate to  Undetermined and log.', () =>
        {
            let setup = setupServicesAndVM();
            // NumericStringToNumberConverter is not registered
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.Number, 'Label1');
            vh1.setValue(100);
            let vh2 = setup.vhm.addMockFieldValueHost('Property2', LookupKey.String, 'Label2');
            vh2.setValue('5');
            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2',
                secondConversionLookupKey: LookupKey.Number   // no converter registered
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            expect(testItem.evaluate(null, setup.vhm)).toBe(ConditionEvaluateResult.Undetermined);
            let logger = setup.services.loggerService as CapturingLogger;
            let logDetails = logger.findMessage('Need a DataTypeConverter', LoggingLevel.Warn, LoggingCategory.Result);
            expect(logDetails).toBeTruthy();
            expect(logDetails!.data).toEqual({
                sourceLookupKey: LookupKey.String,
                resultLookupKey: LookupKey.Number
            });
        });

        test('evaluate throws an error when passed an invalid value type that is not either number or string because it cannot be converted to string or number', () =>
        {
            let setup = setupServicesAndVM();
            let vh1 = setup.vhm.addMockFieldValueHost('Property1', LookupKey.Boolean, 'Label1');
            vh1.setValue(true);
            let vh2 = setup.vhm.addMockFieldValueHost('Property2', LookupKey.Number, 'Label2');
            vh2.setValue(5);
            let config: CompareToValueConditionBaseConfig = {
                conditionType: baseConditionType,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new Publicify_CompareToValueConditionBase(config);

            expect(() => testItem.evaluate(null, setup.vhm)).toThrow(InvalidTypeError);
        });
    });

});

describe('class EqualToCondition', () => {
    test('DefaultConditionType', () => {
        expect(EqualToCondition.DefaultConditionType).toBe(ConditionType.EqualTo);
    });
    test('category is Comparison', () =>
    {
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValue: 10,
        };
        let testItem = new EqualToCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () =>
    {
        let config: EqualToConditionConfig = {
            conditionType: ConditionType.EqualTo,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new EqualToCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });    
    describe('secondValue', () =>
    {
        test('evaluate using secondValue property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new EqualToCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(0);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('evaluate using secondValue property with boolean for Match or NoMatch', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValue: false,
            };
            let testItem = new EqualToCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });
 
        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValue: 100,
            };
            let testItem = new EqualToCondition(config);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        });
    
        test('Using ConversionLookupKey = Integer, show ValueHost(but not Second) is impacted by conversion', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let dsc = services.dataTypeConverterService as DataTypeConverterService;
            dsc.register(new IntegerConverter());
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                conversionLookupKey: LookupKey.Integer, //uses Math.trunc
                secondValue: 100,
            };
            let testItem = new EqualToCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(99.1);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(99.9);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100.1);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(100.6);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(101.1);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('Using SecondConversionLookupKey = Integer, show secondvalue (but not ValueHost) is impacted by conversion', () =>
        {
            let setup = setupServicesAndVM();
            let dsc = setup.services.dataTypeConverterService as DataTypeConverterService;
            dsc.register(new IntegerConverter());

            let vh1 = setup.vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');

            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                conversionLookupKey: null,
                secondValue: 100.2,
                secondConversionLookupKey: LookupKey.Integer
            };
            let testItem = new EqualToCondition(config);
            vh1.setTextValue('---- does not matter ----');
            vh1.setValue(100);
            expect(testItem.evaluate(vh1, setup.vhm)).toBe(ConditionEvaluateResult.Match);
            vh1.setValue(100.2);
            expect(testItem.evaluate(vh1, setup.vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });

        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValue: 100,
            };
            let testItem = new EqualToCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
        test('getValuesForTokens with null value', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValue: undefined,
            };
            let testItem = new EqualToCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: null,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
    });
    describe('secondValueHostName', () =>
    {
        test('evaluate using boolean for Match or NoMatch', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh1 = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Boolean, 'Label2');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new EqualToCondition(config);
            vh1.setTextValue('---- does not matter ----');
            vh1.setValue(false);
            vh2.setValue(false);
            expect(testItem.evaluate(vh1, vhm)).toBe(ConditionEvaluateResult.Match);
            vh1.setValue(true);
            vh2.setValue(true);
            expect(testItem.evaluate(vh1, vhm)).toBe(ConditionEvaluateResult.Match);
            vh1.setValue(true);
            vh2.setValue(false);
            expect(testItem.evaluate(vh1, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('evaluate using secondValueHostName property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new EqualToCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh2.setTextValue('---- Second does not matter ---');
            vh2.setValue(100);  // property value to match to the rest

            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(0);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });

        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new EqualToCondition(config);
            vh.setValue(null);
            vh2.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);

            // vh is a number, vh2 is not
            vh.setValue(100);
            vh2.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);

        });

        test('Using ConversionLookupKey = Integer, show ValueHost(but not Second) is impacted by conversion', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let dsc = services.dataTypeConverterService as DataTypeConverterService;
            dsc.register(new IntegerConverter());
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                conversionLookupKey: LookupKey.Integer, // uses Math.trunc
                secondValueHostName: 'Property2'
            };
            let testItem = new EqualToCondition(config);
            vh2.setValue(100);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(99.1);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(99.9);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100.1);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(100.6);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(101.1);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('Using SecondConversionLookupKey = Integer, show SecondValueHost(but not ValueHost) is impacted by conversion', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let dsc = services.dataTypeConverterService as DataTypeConverterService;
            dsc.register(new IntegerConverter());

            let vh1 = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                conversionLookupKey: null,
                secondValueHostName: 'Property2',
                secondConversionLookupKey: LookupKey.Integer        // converts with Math.trunc
            };
            let testItem = new EqualToCondition(config);
            vh1.setTextValue('---- does not matter ----');
            vh1.setValue(100);

            vh2.setValue(99.1);
            expect(testItem.evaluate(vh1, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh2.setValue(99.9);
            expect(testItem.evaluate(vh1, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh2.setValue(100.1);
            expect(testItem.evaluate(vh1, vhm)).toBe(ConditionEvaluateResult.Match);
            vh2.setValue(100.6);
            expect(testItem.evaluate(vh1, vhm)).toBe(ConditionEvaluateResult.Match);
            vh2.setValue(101.1);
            expect(testItem.evaluate(vh1, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });

        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: EqualToConditionConfig = {
                conditionType: ConditionType.EqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new EqualToCondition(config);
            vh2.setValue(100);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: 'Label2',
                    purpose: 'label'
                }
            ]);
        });        
    });

});
describe('class NotEqualToCondition', () => {
    test('DefaultConditionType', () => {
        expect(NotEqualToCondition.DefaultConditionType).toBe(ConditionType.NotEqualTo);
    });

    test('category is Comparison', () =>
    {
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new NotEqualToCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () =>
    {
        let config: NotEqualToConditionConfig = {
            conditionType: ConditionType.NotEqualTo,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new NotEqualToCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });

    describe('secondValue', () =>
    {
        test('evaluate using secondValue property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new NotEqualToCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(0);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });
        test('evaluate using secondValue property with boolean for Match or NoMatch', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValue: false
            };
            let testItem = new NotEqualToCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });

        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new NotEqualToCondition(config);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        });
        test('getValuesForTokens using secondValue', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new NotEqualToCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });

        test('getValuesForTokens using null', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValue: null
            };
            let testItem = new NotEqualToCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: null,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
    });
    describe('secondValueHostName', () =>
    {

        test('evaluate with boolean for Match or NoMatch', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Boolean, 'Label2');
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new NotEqualToCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(true);
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(true);
            vh2.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(false);
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('evaluate using secondValueHostName property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new NotEqualToCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh2.setTextValue('---- Second does not matter ---');
            vh2.setValue(100);  // property value to match to the rest

            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(0);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });


        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new NotEqualToCondition(config);
            vh2.setValue(100);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);

            // now swap them
            vh.setValue(100);
            vh2.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);

        });

        test('getValuesForTokens using secondValueHostName', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockValueHost(
                'Property2', LookupKey.Number, 'Label2');
            vh2.setValue(100);
            let config: NotEqualToConditionConfig = {
                conditionType: ConditionType.NotEqualTo,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new NotEqualToCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: 'Label2',
                    purpose: 'label'
                }
            ]);
        });
    });

});
describe('class GreaterThanCondition', () => {
    test('DefaultConditionType', () => {
        expect(GreaterThanCondition.DefaultConditionType).toBe(ConditionType.GreaterThan);
    });
    test('category is Comparison', () =>
    {
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new GreaterThanCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () =>
    {
        let config: GreaterThanConditionConfig = {
            conditionType: ConditionType.GreaterThan,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new GreaterThanCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });    
    describe('secondValue', () =>
    {
        test('evaluate using secondValue property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new GreaterThanCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(0);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('evaluate using boolean results in Undetermined because no support for GT operator', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValue: false
            };
            let testItem = new GreaterThanCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false); // secondValue == this value. So NoMatch because operator is GT
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });

        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new GreaterThanCondition(config);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        });
        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new GreaterThanCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
        test('getValuesForTokens with null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValue: null
            };
            let testItem = new GreaterThanCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: null,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
    });
    describe('secondValueHostName', () =>
    {


        test('evaluate using boolean results in Undetermined because no support for GT operator', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Boolean, 'Label2');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new GreaterThanCondition(config);
            vh.setValue(true);
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false); // secondValue == this value. So NoMatch because operator is GT
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('evaluate using secondValueHostName property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new GreaterThanCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh2.setTextValue('---- Second does not matter ---');
            vh2.setValue(100);  // property value to match to the rest

            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(0);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });


        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            vh2.setValue(100);
            let testItem = new GreaterThanCondition(config);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        });
        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: GreaterThanConditionConfig = {
                conditionType: ConditionType.GreaterThan,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            vh2.setValue(100);
            let testItem = new GreaterThanCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: 'Label2',
                    purpose: 'label'
                }
            ]);
        });
    });    

});
describe('class GreaterThanOrEqualCondition', () => {
    test('DefaultConditionType', () => {
        expect(GreaterThanOrEqualCondition.DefaultConditionType).toBe(ConditionType.GreaterThanOrEqual);
    });
    test('category is Comparison', () =>
    {
        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new GreaterThanOrEqualCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () =>
    {
        let config: GreaterThanOrEqualConditionConfig = {
            conditionType: ConditionType.GreaterThanOrEqual,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new GreaterThanOrEqualCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });    
    describe('secondValue', () =>
    {
        test('evaluate using secondValue property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new GreaterThanOrEqualCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(0);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('evaluate using boolean results in Undetermined because no support for GTE operator', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValue: false
            };
            let testItem = new GreaterThanOrEqualCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false); // secondValue == this value. So Match because operator is GTE
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });

        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new GreaterThanOrEqualCondition(config);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        });
        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new GreaterThanOrEqualCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
        test('getValuesForTokens with null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValue: null
            };
            let testItem = new GreaterThanOrEqualCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: null,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
    });
    describe('secondValueHostName', () =>
    {
        test('evaluate using boolean results in Undetermined because no support for GTE operator', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Boolean, 'Label2');
            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new GreaterThanOrEqualCondition(config);
            vh.setValue(true);
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false); // secondValue == this value. So Match because operator is GTE
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(true); // secondValue == this value. So Match because operator is GTE
            vh2.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });
        test('evaluate using secondValueHostName property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new GreaterThanOrEqualCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh2.setTextValue('---- Second does not matter ---');
            vh2.setValue(100);  // property value to match to the rest

            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(0);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });

        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');

            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValueHostName: ''
            };
            let testItem = new GreaterThanOrEqualCondition(config);
            vh2.setValue(100);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            // now swap them
            vh.setValue(100);
            vh2.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        });
        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: GreaterThanOrEqualConditionConfig = {
                conditionType: ConditionType.GreaterThanOrEqual,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            vh2.setValue(100);
            let testItem = new GreaterThanOrEqualCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: 'Label2',
                    purpose: 'label'
                }
            ]);
        });
    });
});

describe('class LessThanValueCondition', () => {
    test('DefaultConditionType', () => {
        expect(LessThanValueCondition.DefaultConditionType).toBe(ConditionType.LessThanValue);
    });
    test('category is Comparison', () =>
    {
        let config: LessThanOrEqualValueConditionConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });

    test('category is overridden', () =>
    {
        let config: LessThanValueConditionConfig = {
            conditionType: ConditionType.LessThanValue,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new LessThanValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });    
    describe('sourceValue', () =>
    {
        test('evaluate using secondValue property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: LessThanValueConditionConfig = {
                conditionType: ConditionType.LessThanValue,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new LessThanValueCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(99);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });
        test('evaluate using boolean results in Undetermined because no support for LT operator', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let config: LessThanValueConditionConfig = {
                conditionType: ConditionType.LessThanValue,
                valueHostName: 'Property1',
                secondValue: false
            };
            let testItem = new LessThanValueCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false); // secondValue == this value. So NoMatch because operator is LT
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        });
        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: LessThanValueConditionConfig = {
                conditionType: ConditionType.LessThanValue,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new LessThanValueCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
    });
    describe('secondValueHostName', () =>
    {
        test('evaluate using secondValue property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: LessThanValueConditionConfig = {
                conditionType: ConditionType.LessThanValue,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new LessThanValueCondition(config);
            vh2.setValue(100);
            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(99);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });
        test('evaluate using boolean results in Undetermined because no support for LT operator', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThanValue
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Boolean, 'Label2');

            let config: LessThanValueConditionConfig = {
                conditionType: ConditionType.LessThanValue,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new LessThanValueCondition(config);
            vh.setValue(true);
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(true); // secondValue == this value. So NoMatch because operator is LT
            vh2.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(false); // secondValue == this value. So NoMatch because operator is LT
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);

        });
        test('evaluate using secondValueHostName property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: LessThanValueConditionConfig = {
                conditionType: ConditionType.LessThanValue,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new LessThanValueCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh2.setTextValue('---- Second does not matter ---');
            vh2.setValue(100);  // property value to match to the rest

            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(99);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });

        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: LessThanValueConditionConfig = {
                conditionType: ConditionType.LessThanValue,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new LessThanValueCondition(config);
            vh2.setValue(100);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);

            // swap them
            vh.setValue(100);
            vh2.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        });
        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: LessThanValueConditionConfig = {
                conditionType: ConditionType.LessThanValue,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new LessThanValueCondition(config);
            vh2.setValue(100);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: 'Label2',
                    purpose: 'label'
                }
            ]);
        });
    });    

});
describe('class LessThanOrEqualValueCondition', () => {
    test('DefaultConditionType', () => {
        expect(LessThanOrEqualValueCondition.DefaultConditionType).toBe(ConditionType.LessThanOrEqualValue);
    });
    test('category is Comparison', () =>
    {
        let config: LessThanOrEqualValueConditionConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 10
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Comparison);
    });
    test('category is overridden', () =>
    {
        let config: LessThanOrEqualValueConditionConfig = {
            conditionType: ConditionType.LessThanOrEqualValue,
            valueHostName: 'Property1',
            secondValue: 10,
            category: ConditionCategory.Contents
        };
        let testItem = new LessThanOrEqualValueCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });    
    describe('secondValue', () =>
    {
        test('evaluate using secondValue property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(99);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });
        test('evaluate using boolean results in Undetermined because no support for LTE operator', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValue: false
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false); // secondValue == this value. So Match because operator is LTE
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });
        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
        });
        test('evaluate throws an error when passed an invalid value type that is not either number or string because it cannot be converted to string or number', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            vh.setValue(false);
            expect(() => testItem.evaluate(vh, vhm)).toThrow(InvalidTypeError);
        });
        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValue: 100
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
        test('getValuesForTokens with null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValue: null
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: null,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: '',
                    purpose: 'label'
                }
            ]);
        });
    });
    describe('secondValueHostName', () =>
    {

        test('evaluate using boolean results in Undetermined because no support for LTE operator', () =>
        {
            // boolean chosen because Comparers don't support GreaterThan/LessThan
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Boolean, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Boolean, 'Label2');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh.setValue(true);
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false); // secondValue == this value. So Match because operator is LTE
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(true); // secondValue == this value. So Match because operator is LTE
            vh2.setValue(true);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });
        test('evaluate using secondValueHostName property with number for Match or NoMatch', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            vh.setTextValue('---- does not matter ----');
            vh2.setTextValue('---- Second does not matter ---');
            vh2.setValue(100);  // property value to match to the rest

            vh.setValue(101);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
            vh.setValue(100);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
            vh.setValue(99);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);
        });

        test('evaluate returns Undetermined for null, undefined, and non-number types', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValueHostName: ''
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            vh2.setValue(100);
            vh.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            // swap them
            vh.setValue(100);
            vh2.setValue(null);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue(undefined);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue('string');
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
            vh2.setValue(false);
            expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);

        });
        test('getValuesForTokens with non-null values', () =>
        {
            let services = new MockJivsServices(false, true);
            let vhm = new MockValueHostsManager(services);
            let vh = vhm.addMockFieldValueHost(
                'Property1', LookupKey.Number, 'Label');
            let vh2 = vhm.addMockFieldValueHost(
                'Property2', LookupKey.Number, 'Label2');
            let config: LessThanOrEqualValueConditionConfig = {
                conditionType: ConditionType.LessThanOrEqualValue,
                valueHostName: 'Property1',
                secondValueHostName: 'Property2'
            };
            let testItem = new LessThanOrEqualValueCondition(config);
            vh2.setValue(100);
            let list = testItem.getValuesForTokens(vh, vhm);
            expect(list).not.toBeNull();
            expect(list).toEqual([
                {
                    tokenLabel: 'CompareTo',
                    associatedValue: 100,
                    purpose: 'value'
                },
                {
                    tokenLabel: 'SecondLabel',
                    associatedValue: 'Label2',
                    purpose: 'label'
                }
            ]);
        });

    });    

});

