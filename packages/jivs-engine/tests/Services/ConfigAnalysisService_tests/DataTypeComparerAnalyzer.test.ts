import { IDataTypeIdentifier } from '../../../src/Interfaces/DataTypeIdentifier';
import { IDataTypeComparer } from "../../../src/Interfaces/DataTypeComparers";
import { createValidationServicesForTesting, registerAllConditions } from "../../TestSupport/createValidationServices";
import { ComparersResult } from "../../../src/Interfaces/DataTypeComparerService";
import { IValidationServices, ServiceName } from '../../../src/Interfaces/ValidationServices';
import { ConditionCategory, ConditionConfig } from '../../../src/Interfaces/Conditions';
import { CAIssueSeverity, ComparerServiceClassRetrieval } from '../../../src/Interfaces/ConfigAnalysisService';
import { ValueHostConfig } from '../../../src/Interfaces/ValueHost';
import { DataTypeComparerAnalyzer } from '../../../src/Services/ConfigAnalysisService/DataTypeComparerAnalyzer';
import { setupHelper } from './support';
import { ConditionType } from '../../../src/Conditions/ConditionTypes';
import { CompareToValueConditionBaseConfig } from '../../../src/Conditions/CompareToValueConditionBase';
import { LookupKey } from '../../../src/DataTypes/LookupKeys';
import { BooleanDataTypeComparer } from '../../../src/DataTypes/DataTypeComparers';

describe('DataTypeComparerLookupKeyAnalyzer', () => {
    const numberHosterLookupKey = 'NumberHoster';    
    class NumberHoster
    {
        constructor(value: number) {
            this._value = value;
        }
        private _value: number;
        getValue(): number
        {
            return this._value;
        }   
    }
    class NumberHosterComparer implements IDataTypeComparer {
        supportsValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): boolean {
            return value1 instanceof NumberHoster && value2 instanceof NumberHoster &&
                (!lookupKey1 || lookupKey1 === numberHosterLookupKey) &&
                (!lookupKey2 || lookupKey2 === numberHosterLookupKey);
        }
        compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult {
            throw new Error('Method not implemented.');
        }

    }

    class NumberHosterIdentifier implements IDataTypeIdentifier
    {
        dataTypeLookupKey: string = numberHosterLookupKey;
        supportsValue(value: any): boolean {
            return value instanceof NumberHoster;
        }
        sampleValue() {
            return new NumberHoster(100);
        }
    }

    function setupServices() : IValidationServices {
        let services = createValidationServicesForTesting();
        services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
        services.dataTypeComparerService.register(new NumberHosterComparer());
        services.dataTypeIdentifierService.register(new NumberHosterIdentifier());
        return services;
    }
    describe('checkConditionConfig()', () => {
        // Here are several conditionTypes that support comparison to be used in these tests:
        // EqualTo, EqualToValue, Range,
        // Here are several conditionTypes that do not support comparison to be used in these tests:
        // RequireText, RegExp.

        // Need a function used for many of these tests.
        // The function:
        // - Takes a ConditionConfig object and ValueHostConfig object.
        // - It sets up services and DataTypeComparerAnalyzer
        // - It calls DataTypeComparerAnalyzer.checkConditionConfig() with the ConditionConfig object and ValueHostConfig object.
        // - Analyzes the results on the Helper object for new properties.
        //   User passes the expected partial message, severity, result expected from checkConditionConfig
        // - It returns the Helper object.
        // - Setup to fully support the NumberHosterComparer and NumberHosterIdentifier.
        // - A LookupKeyCAResult alreaedy exists for expectedLookupKey. It may have the service for
        //  comparer already defined based on existingService flag.
        function checkConditionConfig(conditionConfig: ConditionConfig,
            valueHostConfig: ValueHostConfig,
            expectedLookupKey: string,
            expectedResult: boolean,
            existingServiceInfo?: ComparerServiceClassRetrieval | null,
            supportCustomComparer: boolean = true,
            supportCustomIdentifier: boolean = true): ComparerServiceClassRetrieval | null {
            let services = setupServices();
            registerAllConditions(services.conditionFactory);
            if (supportCustomComparer)
                services.dataTypeComparerService.register(new NumberHosterComparer());
            if (supportCustomIdentifier)
                services.dataTypeIdentifierService.register(new NumberHosterIdentifier());
            services.dataTypeComparerService.register(new NumberHosterComparer());
            let helper = setupHelper(services);
            let actualLookupKey = helper.registerLookupKey(expectedLookupKey, null, valueHostConfig);
            if (existingServiceInfo)// prior line created LKI without the service
            { // now we'll emulate the ServiceWithLookupKeyCAResultBase having the comparer service
                let lkResult = helper.results.lookupKeyResults.find(lk => lk.lookupKey === actualLookupKey);
                lkResult!.serviceResults.push(existingServiceInfo);
            }
            let analyzer = new DataTypeComparerAnalyzer(helper);
            return analyzer.checkConditionConfig(conditionConfig, valueHostConfig);

        }


        // test cases:
        // 1. Using checkConditionConfig(), try all variations that disqualifies the inputs.
        //    They should all return true and have no message/severity.        
        // 2. Same, but all cases are not disqualified. Instead, they all 
        //    setup the ServiceWithLookupKeyCAResultBase for comparer with either the 
        //    BooleanDataTypeComparer (for LookupKey=Number) or "defaultComparer"
        //    for LookupKey=Number or String.
        // 3. Same, but use NumberHosterComparer, which is a custom comparer that uses
        //    NumberHoster as values. It will need its NumberHosterIdentifier
        //    on the DataTypeIdentifierService to supply a sample value.
        // 4. Same, where we want to find errors when no sample values are returned.
        //    We must use a custom LookupKey that does not have a LookupKeyFallbackService mapping
        //    nor a DataTypeIdentifier that supports the LookupKey, as both can 
        //    lead to a sample value.
        //    There are several cases: 
        //    - the SampleValue object has been configured with a sample value 
        //      specific to the lookup key
        //    - the SampleValue object has been configured with a sample value
        //      but its the wrong data type for any comparer including default.
        //    - the SampleValue object has not been configured with a sample value 
        //      specific to the lookup key.

        describe('try all variations that disqualifies the inputs.', () => {
            describe('ConditionType is null, empty string, or whitespace', () => {
                function executeTest(conditionType: any): void {
                    let conditionConfig: ConditionConfig = {
                        conditionType: conditionType
                    };
                    let valueHostConfig: ValueHostConfig = {
                        name: 'TestValueHost'
                    };
                    let result = checkConditionConfig(conditionConfig,
                        valueHostConfig, 'Number', true);
                    expect(result).toBeNull();
                }
                // ConditionType is null
                test('ConditionType cases', () => {
                    executeTest(null);
                    executeTest('');
                    executeTest(' ');
                });
            });
            describe('Resolving the lookup keys from dataType and conversionLookupKey properties', () => {
                // ValueHostConfig.dataType and conditionConfig does not have any values for
                //  lookup keys on properties named "conversionLookupKey" or "secondConversionLookupKey"

                function executeTest(dataType: any, conversionLookupKey: any, secondConversionLookupKey: any): void {
                    let conditionConfig: CompareToValueConditionBaseConfig = {
                        conditionType: ConditionType.EqualTo,
                        conversionLookupKey: conversionLookupKey,
                        secondConversionLookupKey: secondConversionLookupKey,
                        valueHostName: 'TestValueHost'
                    };
                    let valueHostConfig: ValueHostConfig = {
                        name: 'TestValueHost',
                        dataType: dataType
                    };
                    let result = checkConditionConfig(conditionConfig,
                        valueHostConfig, 'Number', true);
                    expect(result).toBeNull();
                    
                }
                test('All combinations on dataType with undefined, null, empty string and whitespace while conversionLookupKey and secondConversionLookupKey are undefined', () => {
                    executeTest(undefined, undefined, undefined);
                    executeTest(null, undefined, undefined);
                    executeTest('', undefined, undefined);
                    executeTest(' ', undefined, undefined);
                });
                // same but conversionLookupKey is not undefined the others are
                test('All combinations on conversionLookupKey with undefined, null, empty string and whitespace while dataType and secondConversionLookupKey are undefined', () => {
                    executeTest(undefined, undefined, undefined);
                    executeTest(undefined, null, undefined);
                    executeTest(undefined, '', undefined);
                    executeTest(undefined, ' ', undefined);
                });

                // same but secondConversionLookupKey is not undefined the others are
                test('All combinations on secondConversionLookupKey with undefined, null, empty string and whitespace while dataType and conversionLookupKey are undefined', () => {
                    executeTest(undefined, undefined, undefined);
                    executeTest(undefined, undefined, null);
                    executeTest(undefined, undefined, '');
                    executeTest(undefined, undefined, ' ');
                });
            });
            describe('All cases where ConditionType is not supported for comparison', () => {
                function executeTest(conditionType: ConditionType): void {
                    let conditionConfig: CompareToValueConditionBaseConfig = {
                        conditionType: conditionType,
                        valueHostName: 'TestValueHost'
                    };
                    let valueHostConfig: ValueHostConfig = {
                        name: 'TestValueHost',
                        dataType: 'Number'
                    };
                    let result = checkConditionConfig(conditionConfig,
                        valueHostConfig, 'Number', true);
                    expect(result).toBeNull();
                }
                test('All ConditionType cases', () => {
                    executeTest(ConditionType.RequireText);
                    executeTest(ConditionType.RegExp);
                });
            });
        });
        describe('All cases where conditionType is supported for comparison and results show it finds either the default Comparer (Number & String) or BooleanDataTypeComparer class (Boolean)', () => {
            function executeTest(conditionType: ConditionType,
                expectedLookupKey: string,
                expectedLookupKeyLocation: 'dataType' | 'conversionLookupKey' | 'secondConversionLookupKey',
                expectedComparerClassName: string): void {
                let conditionConfig: CompareToValueConditionBaseConfig = {
                    conditionType: conditionType,
                    valueHostName: 'TestValueHost',
                    conversionLookupKey: expectedLookupKeyLocation === 'conversionLookupKey' ? expectedLookupKey : undefined,
                    secondConversionLookupKey: expectedLookupKeyLocation === 'secondConversionLookupKey' ? expectedLookupKey : undefined

                };
                let valueHostConfig: ValueHostConfig = {
                    name: 'TestValueHost',
                    dataType: expectedLookupKeyLocation === 'dataType' ? expectedLookupKey : 'Number',
                };
                let lkService = checkConditionConfig(conditionConfig, valueHostConfig,
                    expectedLookupKey, true)!;
                expect(lkService).toBeDefined();
                expect(lkService.classFound).toBe(expectedComparerClassName);
                // instance is undefined for defaultComparer
                if (expectedComparerClassName === 'defaultComparer')
                    expect(lkService.instance).toBeUndefined();
                else
                    expect(lkService.instance).toBeDefined();

                expect(lkService.notFound).toBeUndefined();
                expect(lkService.severity).toBeUndefined();
                expect(lkService.message).toBeUndefined();
                expect(lkService.dataExamples).toBeDefined();
            }
            test('All ConditionType cases, all using dataType=Number which results in defaultComparer', () => {
                executeTest(ConditionType.EqualTo, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.EqualToValue, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.Range, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.GreaterThan, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.LessThan, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.GreaterThanOrEqual, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.LessThanOrEqual, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.GreaterThanValue, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.LessThanValue, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.GreaterThanOrEqualValue, LookupKey.Number, 'dataType', 'defaultComparer');
                executeTest(ConditionType.LessThanOrEqualValue, LookupKey.Number, 'dataType', 'defaultComparer');
            });
            // same with LookupKey.String
            test('All ConditionType cases, all using dataType=String which results in defaultComparer', () => {
                executeTest(ConditionType.EqualTo, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.EqualToValue, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.Range, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.GreaterThan, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.LessThan, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.GreaterThanOrEqual, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.LessThanOrEqual, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.GreaterThanValue, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.LessThanValue, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.GreaterThanOrEqualValue, LookupKey.String, 'dataType', 'defaultComparer');
                executeTest(ConditionType.LessThanOrEqualValue, LookupKey.String, 'dataType', 'defaultComparer');
            });
            // same with LookupKey.Boolean, but this uses BooleanDataTypeComparer
            test('All ConditionType cases, all using dataType=Boolean which results in BooleanDataTypeComparer', () => {
                executeTest(ConditionType.EqualTo, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.EqualToValue, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.Range, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.GreaterThan, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.LessThan, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.GreaterThanOrEqual, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.LessThanOrEqual, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.GreaterThanValue, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.LessThanValue, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.GreaterThanOrEqualValue, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
                executeTest(ConditionType.LessThanOrEqualValue, LookupKey.Boolean, 'dataType', 'BooleanDataTypeComparer');
            });
            // using only EqualTo, we'll try with conversionLookupKey=Number
            test('ConditionType.EqualTo, using conversionLookupKey=Number', () => {
                executeTest(ConditionType.EqualTo, LookupKey.Number, 'conversionLookupKey', 'defaultComparer');
            });
            // same with secondConversionLookupKey=Number
            test('ConditionType.EqualTo, using secondConversionLookupKey=Number', () => {
                executeTest(ConditionType.EqualTo, LookupKey.Number, 'secondConversionLookupKey', 'defaultComparer');
            });
            // same with both and DataType is Boolean and String in separate tests
            test('ConditionType.EqualTo, using conversionLookupKey and secondConversionLookupKey using Boolean and String', () => {
                executeTest(ConditionType.EqualTo, LookupKey.String, 'conversionLookupKey', 'defaultComparer');
                executeTest(ConditionType.EqualTo, LookupKey.String, 'secondConversionLookupKey', 'defaultComparer');
                executeTest(ConditionType.EqualTo, LookupKey.Boolean, 'conversionLookupKey', 'BooleanDataTypeComparer');
                executeTest(ConditionType.EqualTo, LookupKey.Boolean, 'secondConversionLookupKey', 'BooleanDataTypeComparer');
            });
            describe('Multiple calls for the same LookupKey only updates LookupKeyCAResult on the first call. Second call always returns true with no further changes', () => {

                test('A prior call for LookupKey + comparer is setup and has classFound="evidence". This call should make no further changes and return true', () => {
                    const expectedLookupKey = LookupKey.Number;
                    let conditionConfig: CompareToValueConditionBaseConfig = {
                        conditionType: ConditionType.EqualTo,
                        valueHostName: 'TestValueHost'
                    };
                    let valueHostConfig: ValueHostConfig = {
                        name: 'TestValueHost',
                        dataType: expectedLookupKey
                    };
                    let lkService = checkConditionConfig(conditionConfig,
                        valueHostConfig, expectedLookupKey, true,
                        {
                            feature: ServiceName.comparer,
                            classFound: 'evidence',
                        })!;  // existing service
                    expect(lkService).toBeDefined();
                    expect(lkService.classFound).toBe('evidence');

                });

                test('A prior call for LookupKey + comparer is setup and has an error. This call should make no further changes and return true', () => {
                    const expectedLookupKey = LookupKey.Number;
                    let conditionConfig: CompareToValueConditionBaseConfig = {
                        conditionType: ConditionType.EqualTo,
                        valueHostName: 'TestValueHost'
                    };
                    let valueHostConfig: ValueHostConfig = {
                        name: 'TestValueHost',
                        dataType: expectedLookupKey
                    };
                    let lkService = checkConditionConfig(conditionConfig,
                        valueHostConfig, expectedLookupKey, true,
                        {
                            feature: ServiceName.comparer,
                            notFound: true,
                            message: 'evidence of prior call'
                        })!;  // existing service
                    expect(lkService).toBeDefined();
                    expect(lkService.notFound).toBe(true);
                    expect(lkService.message).toContain('evidence of prior call');
                });
            });
        });
        describe('Using SampleValue object to supply valid and invalid data', () => {

            function checkConditionConfigWithSampleValue(conditionConfig: ConditionConfig,
                valueHostConfig: ValueHostConfig,
                expectedLookupKey: string,
                sampleValue: any,   // including undefined.
                existingService: boolean,
                supportCustomComparer: boolean = true,
                supportCustomIdentifier: boolean = true,
                fallbackLookupKey?: string
            ): ComparerServiceClassRetrieval | null {
                let services = setupServices();
                registerAllConditions(services.conditionFactory);
                if (supportCustomComparer)
                    services.dataTypeComparerService.register(new NumberHosterComparer());
                if (supportCustomIdentifier)
                    services.dataTypeIdentifierService.register(new NumberHosterIdentifier());
                services.dataTypeComparerService.register(new NumberHosterComparer());
                if (fallbackLookupKey)
                    services.lookupKeyFallbackService.register(expectedLookupKey, fallbackLookupKey);
                let helper = setupHelper(services);
                if (sampleValue !== undefined)
                    helper.analysisArgs.sampleValues.registerSampleValue(expectedLookupKey, sampleValue);
                let actualLookupKey = helper.registerLookupKey(expectedLookupKey, null, valueHostConfig);
                if (existingService)// prior line created LKI without the service
                { // now we'll emulate the ServiceWithLookupKeyCAResultBase having the comparer service
                    let lkResult = helper.results.lookupKeyResults.find(lk => lk.lookupKey === actualLookupKey);
                    let serviceInfo: ComparerServiceClassRetrieval = {
                        feature: ServiceName.comparer,
                    };
                    lkResult!.serviceResults.push(serviceInfo);
                }
                let analyzer = new DataTypeComparerAnalyzer(helper);
                return analyzer.checkConditionConfig(conditionConfig, valueHostConfig);
            }

            // test cases:
            // 1. With LookupKey.Number, we'll use a sample value of 1000, which is valid.
            //   Result is defaultComparer
            // 2. With LookupKey.Number, we'll use a sample value of new Date(), which 
            //    has no associated comparer.
            //    Result is warning with "Cannot check the comparer"
            // 3. With LookupKey = "Custom", we'll use a sample value of 1000.
            //    Because the value is a number, it will use the defaultComparer.
            // 4. With LookupKey = "Custom" and lookupKeyfallback mapped to Boolean, we'll use a sample value of true.
            //    Because the value is a boolean, it will use the BooleanDataTypeComparer.
            // 5. With LookupKey = "Custom", we'll use a sample value of new Date().
            //    A Date is not supported by any comparer, so it will be a warning.
            // 6. With LookupKey = "Custom", there will be no sampleValue.
            //    This unknown Custom lookup key has no other way to get a sample value,
            //    so it will be a warning "No sample value found".
            // 7. With LookupKey.Number, we'll use a sample value of 'abc', which is invalid
            //   for Number, but actually is valid for using the defaultComparer.
            //   Result is defaultComparer because the function depends on the sample value
            //   to determine the comparer.
            test('With LookupKey.Number and sampleValue=1000, expect defaultComparer', () => {
                const expectedLookupKey = LookupKey.Number;
                let conditionConfig: CompareToValueConditionBaseConfig = {
                    conditionType: ConditionType.EqualTo,
                    valueHostName: 'TestValueHost'
                };
                let valueHostConfig: ValueHostConfig = {
                    name: 'TestValueHost',
                    dataType: expectedLookupKey
                };
                let lkService = checkConditionConfigWithSampleValue(conditionConfig,
                    valueHostConfig, expectedLookupKey, 1000, false)!;
                expect(lkService).toBeDefined();
                expect(lkService.classFound).toBe('defaultComparer');
                expect(lkService.instance).toBeUndefined();
                expect(lkService.notFound).toBeUndefined();
                expect(lkService.severity).toBeUndefined();
                expect(lkService.message).toBeUndefined();
                expect(lkService.dataExamples).toBeDefined();
            });
            test('With LookupKey.Number and sampleValue=new Date(), no comparer is found. Expect warning', () => {
                const expectedLookupKey = LookupKey.Number;
                let conditionConfig: CompareToValueConditionBaseConfig = {
                    conditionType: ConditionType.EqualTo,
                    valueHostName: 'TestValueHost'
                };
                let valueHostConfig: ValueHostConfig = {
                    name: 'TestValueHost',
                    dataType: expectedLookupKey
                };
                let lkService = checkConditionConfigWithSampleValue(conditionConfig,
                    valueHostConfig, expectedLookupKey, new Date(), false, false)!;
                
                expect(lkService).toBeDefined();
                expect(lkService.classFound).toBeUndefined();
                expect(lkService.instance).toBeUndefined();
                expect(lkService.notFound).toBe(true);
                expect(lkService.severity).toBe(CAIssueSeverity.warning);
                expect(lkService.message).toContain('Cannot check the comparer');
                expect(lkService.dataExamples).toBeUndefined();
            });

            test('With LookupKey.Custom and sampleValue=1000, expect defaultComparer', () => {
                const expectedLookupKey = 'Custom';
                let conditionConfig: CompareToValueConditionBaseConfig = {
                    conditionType: ConditionType.EqualTo,
                    valueHostName: 'TestValueHost'
                };
                let valueHostConfig: ValueHostConfig = {
                    name: 'TestValueHost',
                    dataType: expectedLookupKey
                };
                let lkService = checkConditionConfigWithSampleValue(conditionConfig,
                    valueHostConfig, expectedLookupKey, 1000, false)!;
                expect(lkService).toBeDefined();
                expect(lkService.classFound).toBe('defaultComparer');
                expect(lkService.instance).toBeUndefined();
                expect(lkService.notFound).toBeUndefined();
                expect(lkService.severity).toBeUndefined();
                expect(lkService.message).toBeUndefined();
                expect(lkService.dataExamples).toBeDefined();
            });
            test('With LookupKey.Custom and its fallback as Boolean and sampleValue=true, expect BooleanDataTypeComparer', () => {
                const expectedLookupKey = 'Custom';
                let conditionConfig: CompareToValueConditionBaseConfig = {
                    conditionType: ConditionType.EqualTo,
                    valueHostName: 'TestValueHost'
                };
                let valueHostConfig: ValueHostConfig = {
                    name: 'TestValueHost',
                    dataType: expectedLookupKey
                };
                let lkService = checkConditionConfigWithSampleValue(conditionConfig,
                    valueHostConfig, expectedLookupKey, true, 
                    false, false, false, LookupKey.Boolean)!;
                expect(lkService).toBeDefined();
                expect(lkService.classFound).toBe('BooleanDataTypeComparer');
                expect(lkService.instance).toBeInstanceOf(BooleanDataTypeComparer);
                expect(lkService.notFound).toBeUndefined();
                expect(lkService.severity).toBeUndefined();
                expect(lkService.message).toBeUndefined();
                expect(lkService.dataExamples).toBeDefined();
            });
            test('With LookupKey.Custom and sampleValue=new Date(), no comparer is found. Expect warning', () => {
                const expectedLookupKey = 'Custom';
                let conditionConfig: CompareToValueConditionBaseConfig = {
                    conditionType: ConditionType.EqualTo,
                    valueHostName: 'TestValueHost'
                };
                let valueHostConfig: ValueHostConfig = {
                    name: 'TestValueHost',
                    dataType: expectedLookupKey
                };
                let lkService = checkConditionConfigWithSampleValue(conditionConfig,
                    valueHostConfig, expectedLookupKey, new Date(), false)!;
                
                expect(lkService).toBeDefined();
                expect(lkService.classFound).toBeUndefined();
                expect(lkService.instance).toBeUndefined();
                expect(lkService.notFound).toBe(true);
                expect(lkService.severity).toBe(CAIssueSeverity.warning);
                expect(lkService.message).toContain('Cannot check the comparer');
                expect(lkService.dataExamples).toBeUndefined();
            });
            test('With LookupKey.Custom and no sampleValue, expect warning', () => {
                const expectedLookupKey = 'Custom';
                let conditionConfig: CompareToValueConditionBaseConfig = {
                    conditionType: ConditionType.EqualTo,
                    valueHostName: 'TestValueHost'
                };
                let valueHostConfig: ValueHostConfig = {
                    name: 'TestValueHost',
                    dataType: expectedLookupKey
                };
                let lkService = checkConditionConfigWithSampleValue(conditionConfig,
                    valueHostConfig, expectedLookupKey, undefined, false)!;
                expect(lkService).toBeDefined();
                expect(lkService.classFound).toBeUndefined();
                expect(lkService.instance).toBeUndefined();
                expect(lkService.notFound).toBeUndefined();
                expect(lkService.severity).toBe(CAIssueSeverity.warning);
                expect(lkService.message).toContain('No sample value found');
                expect(lkService.dataExamples).toBeUndefined();
            });
            test('With LookupKey.Number and sampleValue="abc", expect defaultComparer', () => {
                const expectedLookupKey = LookupKey.Number;
                let conditionConfig: CompareToValueConditionBaseConfig = {
                    conditionType: ConditionType.EqualTo,
                    valueHostName: 'TestValueHost'
                };
                let valueHostConfig: ValueHostConfig = {
                    name: 'TestValueHost',
                    dataType: expectedLookupKey
                };
                let lkService = checkConditionConfigWithSampleValue(conditionConfig,
                    valueHostConfig, expectedLookupKey, 'abc', false)!;
                expect(lkService).toBeDefined();
                expect(lkService.classFound).toBe('defaultComparer');
                expect(lkService.instance).toBeUndefined();
                expect(lkService.notFound).toBeUndefined();
                expect(lkService.severity).toBeUndefined();
                expect(lkService.message).toBeUndefined();
                expect(lkService.dataExamples).toBeDefined();
            });
        });

    });
    describe('conditionUsesComparer()', () => {
        function executeFunction(conditionConfig: ConditionConfig): boolean {
            let services = setupServices();
            registerAllConditions(services.conditionFactory);
            let helper = setupHelper(services);
            let analyzer = new DataTypeComparerAnalyzer(helper);
            let result = analyzer.conditionUsesComparer(conditionConfig);
            return result;
        }

        // test cases:
        // 1. ConditionType is null, empty string, or whitespace returns false
        // 2. conditionConfig.category is assigned to Comparison returns true
        // 3. Successful factory lookup and Condition.category = Comparison returns true
        // 4. Successful factory lookup and Condition.category is not Comparison returns false
        // 5. ConditionFactory throws an error returns false (unknown ConditionType)

        describe('ConditionType is null, empty string, or whitespace', () => {
            function executeTest(conditionType: any): void {
                let conditionConfig: ConditionConfig = {
                    conditionType: conditionType
                };
                let result = executeFunction(conditionConfig);
                expect(result).toBe(false);
            }
            // ConditionType is null
            test('ConditionType cases', () => {
                executeTest(null);
                executeTest('');
                executeTest(' ');
            });
        });
        describe('conditionConfig.category is assigned to Comparison', () => {
            function executeTest(conditionType: ConditionType): void {
                let conditionConfig: ConditionConfig = {
                    conditionType: conditionType,
                    category: ConditionCategory.Comparison
                };
                let result = executeFunction(conditionConfig);
                expect(result).toBe(true);
            }
            test('ConditionType cases', () => {
                // all conditionTypes will return true because the category is Comparison
                executeTest(ConditionType.EqualTo); // normally has Comparison
                executeTest(ConditionType.RegExp);  // normally does not have Comparison
            });
        });
        describe('Successful factory lookup and Condition.category = Comparison', () => {
            function executeTest(conditionType: ConditionType): void {
                let conditionConfig: ConditionConfig = {
                    conditionType: conditionType
                };
                let result = executeFunction(conditionConfig);
                expect(result).toBe(true);
            }
            test('ConditionType cases', () => {
                executeTest(ConditionType.EqualTo);
                executeTest(ConditionType.EqualToValue);
                executeTest(ConditionType.Range);
                executeTest(ConditionType.GreaterThan);
                executeTest(ConditionType.LessThan);
                executeTest(ConditionType.GreaterThanOrEqual);
                executeTest(ConditionType.LessThanOrEqual);
                executeTest(ConditionType.GreaterThanValue);
                executeTest(ConditionType.LessThanValue);
                executeTest(ConditionType.GreaterThanOrEqualValue);
                executeTest(ConditionType.LessThanOrEqualValue);
            });
        });
        describe('Successful factory lookup and Condition.category is not Comparison', () => {
            function executeTest(conditionType: ConditionType): void {
                let conditionConfig: ConditionConfig = {
                    conditionType: conditionType
                };
                let result = executeFunction(conditionConfig);
                expect(result).toBe(false);
            }
            test('ConditionType cases', () => {
                executeTest(ConditionType.RequireText);
                executeTest(ConditionType.RegExp);
            });
        });
        describe('ConditionFactory throws an error', () => {
            function executeTest(conditionType: string): void {
                let conditionConfig: ConditionConfig = {
                    conditionType: conditionType
                };
                let result = executeFunction(conditionConfig);
                expect(result).toBe(false);
            }
            test('ConditionType cases', () => {
                executeTest('Unknown');
            });
        });
    });

});