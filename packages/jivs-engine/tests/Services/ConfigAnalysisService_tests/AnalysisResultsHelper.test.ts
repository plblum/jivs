import { DataTypeIdentifierLookupKeyAnalyzer } from '../../../src/Services/ConfigAnalysisService/DataTypeIdentifierLookupKeyAnalyzer';
import { DataTypeConverterLookupKeyAnalyzer } from '../../../src/Services/ConfigAnalysisService/DataTypeConverterLookupKeyAnalyzer';
import {
    AnalysisArgs, ConfigErrorResult, ConfigPropertyResult, FormatterServiceClassRetrieval, MultiClassRetrieval, ValidatorConfigResults,
    converterServiceFeature,
    formatterForCultureFeature,
    formatterServiceFeature,
    identifierServiceFeature,
    lookupKeyFeature,
    parserServiceFeature
} from '../../../src/Interfaces/ConfigAnalysisService';
import { AnalysisResultsHelper } from '../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper';
import { IValueHostsServices } from '../../../src/Interfaces/ValueHostsServices';
import { ConfigIssueSeverity, IConfigAnalysisResults, LookupKeyInfo, LookupKeyServiceInfoBase } from '../../../src/Interfaces/ConfigAnalysisService';
import { createValidationServicesForTesting } from '../../TestSupport/createValidationServices';
import {
    MockAnalyzer, MockAnalyzerWithFallback, checkLocalizedPropertyResultFromArray,
    createAnalysisArgs, checkCultureSpecificClassRetrievalFoundInService,
    checkCultureSpecificClassRetrievalNotFoundInService, checkLookupKeyInfo,
    checkLookupKeyInfoForMultiClassRetrievalService, checkLookupKeyInfoForService, checkSyntaxError,
    createServices,
    checkLookupKeyInfoForNoService,
    checkLookupKeyIssue,
    checkConfigPropertyResultsFromArray,
    checkLookupKeysInfoForService
} from './support';
import { CultureService } from '../../../src/Services/CultureService';
import { IValidationServices, ServiceName } from '../../../src/Interfaces/ValidationServices';
import { ValueHostConfig } from '../../../src/Interfaces/ValueHost';
import { LookupKey } from '../../../src/DataTypes/LookupKeys';
import { ValueHostType } from '../../../src/Interfaces/ValueHostFactory';
import { IValidator, ValidatorConfig } from '../../../src/Interfaces/Validator';
import { DataTypeFormatterLookupKeyAnalyzer } from '../../../src/Services/ConfigAnalysisService/DataTypeFormatterLookupKeyAnalyzer';
import { DataTypeFormatterService } from '../../../src/Services/DataTypeFormatterService';
import { ValidatorsValueHostBaseConfig } from '../../../src/Interfaces/ValidatorsValueHostBase';
import { DataTypeFormatterBase, NumberFormatter } from '../../../src/DataTypes/DataTypeFormatters';
import { DataTypeResolution } from '../../../src/Interfaces/DataTypes';
import { DataTypeIdentifierService } from '../../../src/Services/DataTypeIdentifierService';
import { NumberDataTypeIdentifier, StringDataTypeIdentifier } from '../../../src/DataTypes/DataTypeIdentifiers';
import { DataTypeConverterService } from '../../../src/Services/DataTypeConverterService';
import { NumericStringToNumberConverter } from '../../../src/DataTypes/DataTypeConverters';
import { IDataTypeIdentifier } from '../../../src/Interfaces/DataTypeIdentifier';

interface IAnalysisResultsHelperCommon {
    publicify_results: IConfigAnalysisResults;
}


describe('AnalysisResultsHelper', () => {

    class Publicify_AnalysisResultsHelper<TServices extends IValueHostsServices>
        extends AnalysisResultsHelper<TServices>
        implements IAnalysisResultsHelperCommon
    {
        constructor(args: AnalysisArgs<TServices>) {
            super(args);
        }
    
        public get publicify_services(): TServices {
            return super.services;
        }
    
        public get publicify_args(): AnalysisArgs<TServices> {
            return super.analysisArgs;
        }
        public get publicify_results(): IConfigAnalysisResults {
            return super.results;
        }   
        public publicify_addlookupKeysIssue(feature: string, lookupKey: string, severity: ConfigIssueSeverity, message: string): void {
            super.addlookupKeysIssue(feature, lookupKey, severity, message);
        }
        public publicify_addOtherIssue(feature: string, severity: ConfigIssueSeverity, message: string): void {
            super.addOtherIssue(feature, severity, message);
        }
        public publicify_checkForRealLookupKeyName(lookupKey: string): string
        {   
            return super.checkForRealLookupKeyName(lookupKey);
        }
        public publicify_checkMessageTokens(message: string | null | undefined | ((validator: IValidator) => string),
            vc: ValidatorConfig, vhc: ValueHostConfig,
            propertyName: string, validatorProperties: Array<ConfigPropertyResult>): void
        {
            super.checkMessageTokens(message, vc, vhc, propertyName, validatorProperties);
        }
        public publicify_validateToken(token: string): boolean
        {
            return super.validateToken(token);
        }        
    }
    function setupForTheseTests() : Publicify_AnalysisResultsHelper<IValidationServices> {
        let services = createServices();
        let mockArgs = createAnalysisArgs(services, [], {});            
        let testItem = new Publicify_AnalysisResultsHelper(mockArgs);
        testItem.registerLookupKeyAnalyzer(ServiceName.formatter,
            new MockAnalyzer(ServiceName.formatter, {} as LookupKeyServiceInfoBase));
        testItem.registerLookupKeyAnalyzer(ServiceName.converter,
            new MockAnalyzer(ServiceName.converter, {} as LookupKeyServiceInfoBase));
        testItem.registerLookupKeyAnalyzer(ServiceName.identifier,
            new MockAnalyzer(ServiceName.identifier, {} as LookupKeyServiceInfoBase));
        return testItem;
    };
    describe('basics', () => {
        test('services getter should return services', () => {
            let services = createServices();
            let mockArgs = createAnalysisArgs(services, [], {});
            let testItem = new Publicify_AnalysisResultsHelper(mockArgs);
            expect(testItem.publicify_services).toBe(services);
        });
    
        test('args getter should return analysisArgs', () => {
            let services = createServices();
            let mockArgs = createAnalysisArgs(services, [], {});
            let testItem = new Publicify_AnalysisResultsHelper(mockArgs);            
            expect(testItem.publicify_args).toBe(mockArgs);
        });
    
        test('results getter should return an empty object initially', () => {
            let services = createServices();
            let mockArgs = createAnalysisArgs(services, [], {});
            let testItem = new Publicify_AnalysisResultsHelper(mockArgs);            
            expect(testItem.publicify_results).toEqual(mockArgs.results);
        });
    
        test('addlookupKeysIssue should add a lookup keys issue', () => {
            let services = createServices();
            let mockArgs = createAnalysisArgs(services, [], {});
            let testItem = new Publicify_AnalysisResultsHelper(mockArgs);            
            testItem.publicify_addlookupKeysIssue('testFeature', 'testLookupKey', ConfigIssueSeverity.warning, 'testMessage');
            expect(testItem.publicify_results.lookupKeysIssues).toEqual([
                { feature: 'testFeature', lookupKey: 'testLookupKey', severity: ConfigIssueSeverity.warning, message: 'testMessage' }
            ]);
        });
    
        test('addOtherIssue should add a generic issue', () => {
            let services = createServices();
            let mockArgs = createAnalysisArgs(services, [], {});
            let testItem = new Publicify_AnalysisResultsHelper(mockArgs);            
            testItem.publicify_addOtherIssue('testFeature', ConfigIssueSeverity.error, 'testMessage');
            expect(testItem.publicify_results.otherIssues).toEqual([
                { feature: 'testFeature', severity: ConfigIssueSeverity.error, message: 'testMessage' }
            ]);
        });        
    });

    describe('registerLookupKey with test Analyzers for formatter and converter', () => {


        describe('Using LookupKey without a service name - useAsDataType is true', () => {
            test('should add a custom lookup key to results.LookupKeysInfo', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: true,
                    services: []
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('testKey', null, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
                expect(testItem.publicify_results.lookupKeysIssues).toHaveLength(1);
                checkLookupKeyIssue(testItem.publicify_results, 0, 'testKey', 'not already known');
            });

            test('should add the LookupKey.Number to results.LookupKeysInfo', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: LookupKey.Number,
                    usedAsDataType: true,
                    services: []
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey(LookupKey.Number, null, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
                expect(testItem.publicify_results.lookupKeysIssues).toHaveLength(0);
            });
            // same but with 'testKey' added to LookupKeyFallbackservice to map to LookupKey.Number 
            test('should add a custom lookup key registered in LookupKeyFallbackService to LookupKey.Number to results.LookupKeysInfo', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: true,
                    services: []
                };
                let testItem = setupForTheseTests();
                testItem.publicify_services.lookupKeyFallbackService.register('testKey', LookupKey.Number);
                testItem.registerLookupKey('testKey', null, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
                expect(testItem.publicify_results.lookupKeysIssues).toHaveLength(0);
            });            
        });

        describe('Using LookupKey with a service name', () => {
// unless the service is identifier, useAsDataType is false
            test('should add an custom lookup key to results.LookupKeysInfo and report \"not already known\" in LookupKeyIssues', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: false,
                    services: [
                        { feature: formatterServiceFeature, message: 'testFormatter', counter: 0 } as any,
                    ]
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('testKey', ServiceName.formatter, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
                expect(testItem.publicify_results.lookupKeysIssues).toHaveLength(1);
                expect(testItem.publicify_results.lookupKeysIssues[0].message).toContain('Lookup key "testKey" not already known.');

            });


            test('should not add a lookup key if the key is null or undefined', () => {
                let testItem = setupForTheseTests();
                testItem.registerLookupKey(null, ServiceName.formatter, { name: 'testValueHost' });
                testItem.registerLookupKey(undefined, ServiceName.formatter, { name: 'testValueHost' });
                expect(testItem.publicify_results.lookupKeysInfo).toHaveLength(0);
            });

            test('should not add a lookup key if the key is an empty string', () => {
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('', ServiceName.formatter, { name: 'testValueHost' });
                testItem.registerLookupKey('  ', ServiceName.formatter, { name: 'testValueHost' });
                expect(testItem.publicify_results.lookupKeysInfo).toHaveLength(0);
            });


            // no matching service name throws CodingError
            test('should throw error when the service name is not registered', () => {
                let testItem = setupForTheseTests();
                expect(() => testItem.registerLookupKey('testKey', ServiceName.logger, { name: 'testValueHost' })).toThrow('No analyzer found');
            });
            // add both formatter and converter with the same lookup key creates two entries
            test('should add two services to the same lookup key into LookupKeyInfo.services array', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: false,
                    services: [
                        { feature: formatterServiceFeature, message: 'testFormatter', counter: 0 } as any,
                        { feature: converterServiceFeature, message: 'testConverter', counter: 0 } as any,
                    ]
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('testKey', ServiceName.formatter, { name: 'testValueHost' });
                testItem.registerLookupKey('testKey', ServiceName.converter, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
            });
            // same as before but with case insensitive differences between lookup keys
            test('should add two services with case insensitive differences between lookup keys', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: false,
                    services: [
                        { feature: formatterServiceFeature, message: 'testFormatter', counter: 0 } as any,
                        { feature: converterServiceFeature, message: 'testConverter', counter: 0 } as any
                    ]
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('testKey', ServiceName.formatter, { name: 'testValueHost' });
                testItem.registerLookupKey('TESTKEY', ServiceName.converter, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
            });
            // same as before but with surrounding whitespace on second lookup key
            test('should add two services with lead/trail whitespace differences between the lookup keys', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: false,
                    services: [
                        { feature: formatterServiceFeature, message: 'testFormatter', counter: 0 } as any,
                        { feature: converterServiceFeature, message: 'testConverter', counter: 0 } as any
                    ]
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('testKey', ServiceName.formatter, { name: 'testValueHost' });
                testItem.registerLookupKey(' testKey ', ServiceName.converter, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
            });
            // add the same service twice, with different messages results in the first message registered. No changes based on the second
            test('should add 1 LookupKeyInfo.service entry with two calls using the same service name', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: false,
                    services: [
                        { feature: formatterServiceFeature, message: 'testFormatter', counter: 0 } as any,
                    ]
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('testKey', ServiceName.formatter, { name: 'testValueHost' });
                testItem.registerLookupKey('testKey', ServiceName.formatter, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
            });
            // the tryFallback feature is used when the lookup key is rejected by the analyzer and LookupKeyFallbackService is used to map the key to LookupKey.Number has its fallback.
            test('should generate two service entries into LookupKeyInfo.services array when adding a custom lookup key registered in LookupKeyFallbackService as the key its mapped to when the analyzer cannot find the custom key', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: false,
                    services: [
                        { feature: parserServiceFeature, tryFallback: true, message: 'testFallback' } as any,
                    ]
                };
                const expectedResult2: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: LookupKey.Number,
                    usedAsDataType: false,
                    services: [
                        { feature: parserServiceFeature, message: 'testFallback', counter: 0 } as any,
                    ]
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKeyAnalyzer(ServiceName.parser,
                    new MockAnalyzerWithFallback(ServiceName.parser, 'testKey', {
                        feature: parserServiceFeature,
                        message: 'testFallback',
                    } as LookupKeyServiceInfoBase));
                testItem.publicify_services.lookupKeyFallbackService.register('testKey', LookupKey.Number);
                testItem.registerLookupKey('testKey', ServiceName.parser, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult, expectedResult2]);
            });

            // add serviceName=identifier sets usedAsDataType=true
            test('should set usedAsDataType=true when the service name is identifier', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: true,
                    services: [
                        { feature: identifierServiceFeature, message: 'testIdentifier', counter: 0 } as any,
                    ]
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('testKey', ServiceName.identifier, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
            });

            // with 2 services, and the second one is identifier, usedAsDataType is true
            test('should set usedAsDataType=true when the service name is identifier and there are multiple services', () => {
                const expectedResult: LookupKeyInfo = {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: true,
                    services: [
                        { feature: formatterServiceFeature, message: 'testFormatter', counter: 0 } as any,
                        { feature: identifierServiceFeature, message: 'testIdentifier', counter: 0 } as any,
                    ]
                };
                let testItem = setupForTheseTests();
                testItem.registerLookupKey('testKey', ServiceName.formatter, { name: 'testValueHost' });
                testItem.registerLookupKey('testKey', ServiceName.identifier, { name: 'testValueHost' });

                expect(testItem.publicify_results.lookupKeysInfo).toEqual([expectedResult]);
            });
        });
    });
    describe('checkForRealLookupKeyName', () => {

        test('should return the same string when the lookup key is already known', () => {
            let testItem = setupForTheseTests();
            expect(testItem.publicify_checkForRealLookupKeyName(LookupKey.Number)).toBe(LookupKey.Number);
            expect(testItem.publicify_results.lookupKeysIssues).toHaveLength(0);
        });
        // same as before but with case insensitive differences between lookup keys
        test('should return the same string when the lookup key is already known with case insensitive and whitespace differences', () => {
            let testItem = setupForTheseTests();
            expect(testItem.publicify_checkForRealLookupKeyName('NUMBER')).toBe(LookupKey.Number);
            expect(testItem.publicify_results.lookupKeysIssues).toHaveLength(1);
            expect(testItem.publicify_results.lookupKeysIssues[0].message).toContain('Lookup key "NUMBER" is a case insensitive match for "Number"');

            expect(testItem.publicify_checkForRealLookupKeyName(' NUMBER ')).toBe(LookupKey.Number);
            expect(testItem.publicify_checkForRealLookupKeyName('number ')).toBe(LookupKey.Number);
        });

        test('should return the same string when the lookup key is unknown', () => {
            let testItem = setupForTheseTests();
            expect(testItem.publicify_checkForRealLookupKeyName('testKey')).toBe('testKey');
            expect(testItem.publicify_results.lookupKeysIssues).toHaveLength(1);
            expect(testItem.publicify_results.lookupKeysIssues[0].message).toContain('Lookup key "testKey" not already known.');    
        });
        // same but lookup key has whitespace that is stripped in the result
        test('should return the same string when the lookup key is unknown with whitespace', () => {
            let testItem = setupForTheseTests();
            expect(testItem.publicify_checkForRealLookupKeyName(' testKey ')).toBe('testKey');
        });

        test('should return the same string when the lookup key is already known through the LookupKeyFallbackService', () => {
            let testItem = setupForTheseTests();
            testItem.publicify_services.lookupKeyFallbackService.register('testKey', LookupKey.Number);
            expect(testItem.publicify_checkForRealLookupKeyName('testKey')).toEqual('testKey');
            expect(testItem.publicify_checkForRealLookupKeyName(' testKey ')).toEqual('testKey');
        });
    });


    describe('checkLookupKeyProperty()', () => {
        // Our tests will all use the Formatter and Converter services, so we can use the same args for all of them.
        function setupForTheseTests() : Publicify_AnalysisResultsHelper<IValidationServices> {
            let services = createServices();
            services.dataTypeFormatterService = new DataTypeFormatterService(); // removes existing registered entries
            let args = createAnalysisArgs(services, [], {
                lookupKeysSampleValues: {
                    'Number': 100,
                    'String': '10',
                },
                valueHostsSampleValues: { 'testValueHost': 1000 }
            });            
            let testItem = new Publicify_AnalysisResultsHelper(args);
            // formatter provides tryFallback case
            testItem.registerLookupKeyAnalyzer(ServiceName.formatter,
                new DataTypeFormatterLookupKeyAnalyzer(args));
            // converter provides notFound case
            testItem.registerLookupKeyAnalyzer(ServiceName.converter,
                new DataTypeConverterLookupKeyAnalyzer(args));  
            testItem.registerLookupKeyAnalyzer(ServiceName.identifier,
                new DataTypeIdentifierLookupKeyAnalyzer(args));

            return testItem;
        };
        // lookupKey is null is no change to properties array nor results.lookupKeysInfo
        test('should not add a ConfigPropertyResult nor results.lookupKeysInfo when lookupKey is null', () => {
            const valueHostConfig: ValueHostConfig = {
                name: 'testValueHost',
                valueHostType: ValueHostType.Static,
            };

            let testItem = setupForTheseTests();

            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.checkLookupKeyProperty('PropertyName', null,
                ServiceName.formatter, valueHostConfig, properties, 'DataTypeFormatter', 'dataTypeFormatterService'
            )
            expect(properties).toHaveLength(0);
            expect(testItem.results.lookupKeysInfo).toHaveLength(0);
            expect(testItem.results.lookupKeysIssues).toHaveLength(0);
        }); 
        // lookupKey is empty string no change to properties array nor results.lookupKeysInfo
        test('should not add a ConfigPropertyResult nor results.lookupKeysInfo when lookupKey is an empty string', () => {
            const valueHostConfig: ValueHostConfig = {
                name: 'testValueHost',
                valueHostType: ValueHostType.Static,
            };

            let testItem = setupForTheseTests();

            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.checkLookupKeyProperty('PropertyName', '',
                ServiceName.formatter, valueHostConfig, properties, 'DataTypeFormatter', 'dataTypeFormatterService'
            );
            expect(properties).toHaveLength(0);
            expect(testItem.results.lookupKeysInfo).toHaveLength(0);
            expect(testItem.results.lookupKeysIssues).toHaveLength(0);
        });
        // same but lookup key is " " so it is trimmed to an empty string
        test('should not add a ConfigPropertyResult nor results.lookupKeysInfo when lookupKey is an empty string with whitespace', () => {
            const valueHostConfig: ValueHostConfig = {
                name: 'testValueHost',
                valueHostType: ValueHostType.Static,
            };

            let testItem = setupForTheseTests();

            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.checkLookupKeyProperty('PropertyName', ' ',
                ServiceName.formatter, valueHostConfig, properties, 'DataTypeFormatter', 'dataTypeFormatterService'
            );
            expect(properties).toHaveLength(0);
            expect(testItem.results.lookupKeysInfo).toHaveLength(0);
            expect(testItem.results.lookupKeysIssues).toHaveLength(0);
        });
        // lookupKey has surrounding whitespace like " Number " so it is otherwise a valid lookup key
        // means it will return a Value is not an exact match message in properties.
        test('should add a ConfigPropertyResult with an error when lookupKey has surrounding whitespace. Should also add lookupKeyIssue with lookupKey trimmed', () => {
            const valueHostConfig: ValueHostConfig = {
                name: 'testValueHost',
                valueHostType: ValueHostType.Static,
            };

            let testItem = setupForTheseTests();

            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.checkLookupKeyProperty('PropertyName', ' Number ',
                ServiceName.formatter, valueHostConfig, properties, 'DataTypeFormatter', 'dataTypeFormatterService'
            )
            checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                'Value is not an exact match to the expected value of "Number". Fix it.', ConfigIssueSeverity.error);

            checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, LookupKey.Number, ServiceName.formatter);
            expect(testItem.results.lookupKeysIssues).toHaveLength(0);
        });
        // same but use lowercase "number"
        test('should add a ConfigPropertyResult when lookupKey is lowercase "number"', () => {
            const valueHostConfig: ValueHostConfig = {
                name: 'testValueHost',
                valueHostType: ValueHostType.Static,
            };

            let testItem = setupForTheseTests();

            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.checkLookupKeyProperty('PropertyName', 'number',
                ServiceName.formatter, valueHostConfig, properties, 'DataTypeFormatter', 'dataTypeFormatterService'
            );
            checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                'Value is not an exact match to the expected value of "Number". Fix it.', ConfigIssueSeverity.error);

            checkLookupKeyIssue(testItem.results, 0, 'number', 'case insensitive match');            
        });
        // lookupKey is custom but it is for a data Type LookupKey, so no service
        // gets a message about the custom lookup key with advice to fix it.
        test('should add a ConfigPropertyResult when lookupKey is custom and ServiceName=null', () => {
            const valueHostConfig: ValueHostConfig = {
                name: 'testValueHost',
                valueHostType: ValueHostType.Static,
            };

            let testItem = setupForTheseTests();

            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.checkLookupKeyProperty('PropertyName', 'custom',
                null, valueHostConfig, properties);
            checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                'Lookup key "custom" is unknown.', ConfigIssueSeverity.info);

            checkLookupKeyInfoForNoService(testItem.results.lookupKeysInfo, 'custom', ServiceName.formatter);
            checkLookupKeyIssue(testItem.results, 0, 'custom', 'not already known');
        });
        // I'll write this one, OK?
        describe('with a DataTypeIdentifier associated with the lookup key', () => {
            const testLookupKey = 'Test';
            class TestClass { }
            class TestClassIdentifier implements IDataTypeIdentifier
            {
                sampleValue(): any {
                    return new TestClass();
                }
                dataTypeLookupKey: string = testLookupKey;
                supportsValue(value: any): boolean {
                    return value instanceof TestClass;
                }
                
            }
            // test cases:
            // 1. lookupKey is the same as the identifier's dataTypeLookupKey does not add a ConfigPropertyResult
            //    but does add a LookupKeyInfo with the identifier service
            // 2. case insensitive match to the identifier's dataTypeLookupKey adds a ConfigPropertyResult
            //   with "Value is not an exact match" error message.
            
            test('should add a LookupKeyInfo with the identifier service when lookupKey matches the identifier dataTypeLookupKey', () => {
                const valueHostConfig: ValueHostConfig = {
                    name: 'testValueHost',
                    valueHostType: ValueHostType.Static,
                };

                let testItem = setupForTheseTests();
                testItem.services.dataTypeIdentifierService.register(new TestClassIdentifier());

                let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

                testItem.checkLookupKeyProperty('PropertyName', testLookupKey,
                    null, valueHostConfig, properties);
                expect(properties).toHaveLength(0);
                checkLookupKeyInfoForNoService(testItem.results.lookupKeysInfo, testLookupKey, ServiceName.identifier);
                expect(testItem.results.lookupKeysIssues).toHaveLength(0);
            });
            
        });
        describe('Not Found cases using formatter', () => {
            // same with serviceName supplied reports error "Not found"
            test('should add a ConfigPropertyResult when lookupKey is custom and ServiceName supplied', () => {
                const valueHostConfig: ValueHostConfig = {
                    name: 'testValueHost',
                    valueHostType: ValueHostType.Static,
                };

                let testItem = setupForTheseTests();

                let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

                testItem.checkLookupKeyProperty('PropertyName', 'custom',
                    ServiceName.formatter, valueHostConfig, properties, 'DataTypeFormatter', 'dataTypeFormatterService'
                );
                checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                    'Not found. Please register a DataTypeFormatter to dataTypeFormatterService.', ConfigIssueSeverity.error);
                checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'custom', ServiceName.formatter);
                checkLookupKeyIssue(testItem.results, 0, 'custom', 'not already known');
            });

            // lookupKey is Number and has been registered through registerLookupKey as just a DataType lookupKey.
            // It has no other services. We call checkLookupKeyProperty with 
            // with the Formatter service and get the same not found error.
            test('should add a ConfigPropertyResult when lookupKey is known but not registered to the service', () => {
                const valueHostConfig: ValueHostConfig = {
                    name: 'testValueHost',
                    valueHostType: ValueHostType.Static,
                };

                let testItem = setupForTheseTests();
                let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

                testItem.checkLookupKeyProperty('PropertyName', LookupKey.Number,
                    ServiceName.formatter, valueHostConfig, properties, 'DataTypeFormatter', 'dataTypeFormatterService'
                );
                checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                    'Not found. Please register a DataTypeFormatter to dataTypeFormatterService.', ConfigIssueSeverity.error);
                checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, LookupKey.Number, ServiceName.formatter);
                expect(testItem.results.lookupKeysIssues).toHaveLength(0);
            });

            // similar with the lookup key is "Custom" and has a LookupKeyFallbackService mapping it to LookupKey.Number
            // will generate a warning with `Lookup key "${lookupKey}" does not have a ${className} registered but it will also try the Lookup Key "${fallbackLookupKey}".`
            test('with a custom lookup key that has a LookupKeyFallbackService to Number and no DataTypeFormatter for the custom look up key, should add a ConfigPropertyResult with a warning', () => {
                const valueHostConfig: ValueHostConfig = {
                    name: 'testValueHost',
                    valueHostType: ValueHostType.Static,
                };

                let testItem = setupForTheseTests();
                testItem.publicify_services.lookupKeyFallbackService.register('Custom', LookupKey.Number);
                let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

                testItem.checkLookupKeyProperty('PropertyName', 'Custom',
                    ServiceName.formatter, valueHostConfig, properties, 'DataTypeFormatter', 'dataTypeFormatterService'
                );
                checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                    'Lookup key "Custom" does not have a DataTypeFormatter registered but it will also try the Lookup Key "Number".', ConfigIssueSeverity.warning);
                checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'Custom', ServiceName.formatter);
                expect(testItem.results.lookupKeysIssues).toHaveLength(0);
            });
        });
        describe('Not Found cases using converter', () => {
            test('should add a ConfigPropertyResult when lookupKey is custom and ServiceName supplied', () => {
                const valueHostConfig: ValueHostConfig = {
                    name: 'testValueHost',
                    valueHostType: ValueHostType.Static,
                    dataType: LookupKey.String
                };

                let testItem = setupForTheseTests();

                let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

                testItem.checkLookupKeyProperty('PropertyName', 'custom',
                    ServiceName.converter, valueHostConfig, properties, 'DataTypeConverter', 'dataTypeConverterService'
                );
                checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                    'Not found. Please register a DataTypeConverter to dataTypeConverterService.', ConfigIssueSeverity.error);
                checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'custom', ServiceName.converter);
                checkLookupKeyIssue(testItem.results, 0, 'custom', 'not already known');
            });

            // lookupKey is Number and has been registered through registerLookupKey as just a DataType lookupKey.
            // It has no other services. We call checkLookupKeyProperty with 
            // with the Converter service and get the same not found error.
            test('should add a ConfigPropertyResult when lookupKey is known but not registered to the service', () => {
                const valueHostConfig: ValueHostConfig = {
                    name: 'testValueHost',
                    valueHostType: ValueHostType.Static,
                    dataType: LookupKey.String                    
                };

                let testItem = setupForTheseTests();
                let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

                testItem.checkLookupKeyProperty('PropertyName', LookupKey.Number,
                    ServiceName.converter, valueHostConfig, properties, 'DataTypeConverter', 'dataTypeConverterService'
                );
                checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                    'Not found. Please register a DataTypeConverter to dataTypeConverterService.', ConfigIssueSeverity.error);
                checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, LookupKey.Number, ServiceName.converter);
                expect(testItem.results.lookupKeysIssues).toHaveLength(0);
            });
            // For Converter, when custom, it does not use the LookupKeyFallbackService.
            // Its up to the user to supply the correct lookup key.
            // So in this test, the lookupKeyFallbackService is setup but effectively ignored.
            test('with a Custom lookup key that has a LookupKeyFallbackService to Number and no DataTypeConverter for the custom look up key, should add a ConfigPropertyResult with a Not Found error', () => {
                const valueHostConfig: ValueHostConfig = {
                    name: 'testValueHost',
                    valueHostType: ValueHostType.Static,
                    dataType: LookupKey.String                    
                };

                let testItem = setupForTheseTests();
                testItem.publicify_services.lookupKeyFallbackService.register('Custom', LookupKey.Number);
                let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

                testItem.checkLookupKeyProperty('PropertyName', 'Custom',
                    ServiceName.converter, valueHostConfig, properties, 'DataTypeConverter', 'dataTypeConverterService'
                );
                checkConfigPropertyResultsFromArray(properties, 0, 'PropertyName',
                    'Not found. Please register', ConfigIssueSeverity.error);
                checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'Custom', ServiceName.converter);
                expect(testItem.results.lookupKeysIssues).toHaveLength(0);
            });
        });

    });
    describe('checkLocalization', () => {
        function setupServices(): IValidationServices {
            let services = createValidationServicesForTesting();
            services.textLocalizerService.register('l10nKeyAllCultures',
                {
                    en: 'This is a test message',
                    fr: 'Ceci est un message de test',
                    es: 'Este es un mensaje de prueba'
                });
            services.textLocalizerService.register('l10nKey_en',
                { en: 'This is a test message' });
            services.textLocalizerService.register('l10nKey_frAndDefault',
                {
                    '*': 'This is the default test message',
                    fr: 'Ceci est un message de test',
                });

            services.textLocalizerService.register('l10nKeyAllCulturesAndDefault',
                {
                    '*': 'This is the default test message',
                    en: 'This is a test message',
                    fr: 'Ceci est un message de test',
                    es: 'Este es un mensaje de prueba'
                });
            services.cultureService = new CultureService();
            services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
            services.cultureService.register({ cultureId: 'fr', fallbackCultureId: null });
            services.cultureService.register({ cultureId: 'es', fallbackCultureId: null });

            return services;
        }

        test('3 cultures, all with messages in TextLocalizerService creates 1 LocalizedPropertyResult with its CultureText property containing an object mapping all 3 cultures to their text', () => {
            let services = setupServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let configPropertyResults: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkLocalization('PropName', 'l10nKeyAllCultures',
                'fallbackText',
                configPropertyResults);

            expect(configPropertyResults).toHaveLength(1);

            let lct = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'en', 'en',
                'This is a test message', undefined);
            lct = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'fr', 'fr',
                'Ceci est un message de test', undefined);
            lct = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'es', 'es',
                'Este es un mensaje de prueba', undefined);

        });        
        // same 3 cultures, but using l10nKey_en. Still get 3 entries 
        // in cultureText but missing cultures get a warning severity with error message containing "localization not declared"
        test('3 cultures, only "en" has text in TextLocalizerService creates 1 LocalizedPropertyResult with its CultureText property containing an object mapping all 3 cultures but the two without entries are warning messages', () => {
            let services = setupServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let configPropertyResults: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkLocalization('PropName', 'l10nKey_en',
                'fallbackText',
                configPropertyResults);

            expect(configPropertyResults).toHaveLength(1);

            let lct1 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'en', 'en',
                'This is a test message', undefined);
            
            let lct2 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'fr', 'fr',
                undefined, true);
            let lct3 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'es', 'es',
                undefined, true);
        });
        // same as above but fallback parameter is null, meaning missing cultures get an error severity with a message containing "Not text will be used"
        test('3 cultures, only "en" has text in TextLocalizerService creates 1 LocalizedPropertyResult with its CultureText property containing an object mapping all 3 cultures but the two without entries are error messages', () => {
            let services = setupServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let configPropertyResults: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkLocalization('PropName', 'l10nKey_en',
                null,
                configPropertyResults);

            expect(configPropertyResults).toHaveLength(1);

            let lct1 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'en', 'en',
                'This is a test message', undefined);
            let lct2 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'fr', 'fr',
                undefined, false);
            let lct3 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'es', 'es',
                undefined, false);
            
        });

        // using l10nKey_frAndDefault, all 3 cultures get a message, but en and es show the '*' culture text
        
        test('3 cultures, only "fr" has text in TextLocalizerService creates 1 LocalizedPropertyResult with its CultureText property containing an object mapping all 3 cultures but the two without entries are warning messages', () => {
            let services = setupServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let configPropertyResults: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkLocalization('PropName', 'l10nKey_frAndDefault',
                'fallbackText',
                configPropertyResults);

            expect(configPropertyResults).toHaveLength(1);

            let lct1 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'en', '*',
                'This is the default test message', undefined);
            let lct2 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'fr', 'fr',
                'Ceci est un message de test', undefined);
            let lct3 = checkLocalizedPropertyResultFromArray(configPropertyResults, 0, 'PropName', 3, 'es', '*',
                'This is the default test message', undefined);
        });
        // null l10nvalue parameter makes no changes
        test('With null passed as the localization Key (l10nKey) parameter, no changes are made to the properties array.', () => {
            let services = setupServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let configPropertyResults: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkLocalization('PropName', null,
                'fallbackText',
                configPropertyResults);

            expect(configPropertyResults).toHaveLength(0);
        });
        // same with empty string l10nvalue parameter
        test('With an empty string passed as the localization Key (l10nKey) parameter, no changes are made to the properties array.', () => {
            let services = setupServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let configPropertyResults: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkLocalization('PropName', '',
                'fallbackText',
                configPropertyResults);

            expect(configPropertyResults).toHaveLength(0);
        });
    });
    describe('validateToken function', () => {
        test('check token validity using validateToken(token: string): boolean', () => {
            function testToken(token: string, expected: boolean) {
                let result = testItem.publicify_validateToken(token);
                expect(result).toBe(expected);
            };
            let services = createValidationServicesForTesting();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));


            // valid tokens
            testToken('{Token:LookupKey}', true);
            testToken('{Token1:LookupKey}', true);
            testToken('{Token:LookupKey1}', true);
            testToken('{Token1:LookupKey1}', true);
            testToken('{Token}', true);
            testToken('{Token1}', true);
            // invalid tokens
            testToken('{Token:}', false);
            testToken('{:LookupKey}', false);
            testToken('{:}', false);
            // invalid tokens are missing ending brace
            testToken('{Token:LookupKey', false);
            testToken('{Token:LookupKey1', false);
            // invalid tokens include spaces
            testToken('{Token :LookupKey}', false);
            testToken('{Token: LookupKey}', false);
            testToken('{Token:LookupKey }', false);
            testToken('{ Token:LookupKey}', false);
            testToken('{ Token}', false);
            testToken('{Token }', false);
            // invalid tokens include non-alpha numeric characters
            testToken('{Token!:LookupKey}', false);
            testToken('{Token:LookupKey!}', false);
            // invalid tokens start each part with a number
            testToken('{1Token:LookupKey}', false);
            testToken('{Token:1LookupKey}', false);
        });

    });

    describe('checkMessageTokens', () => {
        function createServices(): IValidationServices {
            let services = createValidationServicesForTesting();
            let dtfs = new DataTypeFormatterService();
            services.dataTypeFormatterService = dtfs;
            dtfs.services = services;
            let cultureService = new CultureService();
            services.cultureService = cultureService;
    
            return services;
        }
        function setupTestItem(services: IValidationServices, initCulture: boolean): Publicify_AnalysisResultsHelper<IValidationServices>
        {
            if (initCulture) {
                services.cultureService = new CultureService();
                services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
            }
            let mockArgs = createAnalysisArgs(services, [], {});            
            let testItem = new Publicify_AnalysisResultsHelper(mockArgs);
            testItem.registerLookupKeyAnalyzer(ServiceName.formatter,
                new DataTypeFormatterLookupKeyAnalyzer(mockArgs)
            );    
            return testItem;
        }        
        function executeFunction(testItem: Publicify_AnalysisResultsHelper<IValidationServices>,
            message: string | null | undefined | ((validator: IValidator) => string),
            expectedLookupKeyInfoCount: number,
            expectedPropertiesCount: number): Array<ConfigPropertyResult | ConfigErrorResult> {
            let vc: ValidatorConfig = {
                errorMessage: message, 
                conditionConfig: { conditionType: 'Test' }
                };
            let vhc: ValidatorsValueHostBaseConfig = {
                name: 'testValueHost', dataType: LookupKey.Number,
                validatorConfigs: [vc]
             };
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkMessageTokens(message, vc, vhc, 'PropertyName', properties);
            expect(testItem.publicify_results.lookupKeysInfo).toHaveLength(expectedLookupKeyInfoCount);
            expect(properties).toHaveLength(expectedPropertiesCount);
            return properties;
        }        
        // test will a string that has no tokens results in no changes to lookupKeysInfo or lookupKeysIssues
        test('when message is a string with no tokens result does not change lookupKeysInfo or lookupKeysIssues', () => {
            let services = createServices();
            let testItem = setupTestItem(services, true);

            let message = 'This is a test message';
            executeFunction(testItem, message, 0, 0);
        });
        // null message
        test('when message is null result does not change lookupKeysInfo or lookupKeysIssues', () => {
            let services = createServices();
            let testItem = setupTestItem(services, true);
            let message = null;
            executeFunction(testItem, message, 0, 0);
        });
        // when message is a function that returns a string with no tokens result does not change lookupKeysInfo or lookupKeysIssues
        test('when message is a function that returns a string with no tokens result does not change lookupKeysInfo or lookupKeysIssues', () => {
            let services = createServices();
            let testItem = setupTestItem(services, true);
            let message = (validator: IValidator) => 'This is a test message';
            executeFunction(testItem, message, 0, 0);
        });
        // a single valid token of {Token1} lacks the {Token:LookupKey} format to change lookupKeysInfo, so no changes
        test('when message is a string with a single valid token result does not change lookupKeysInfo or lookupKeysIssues', () => {
            let services = createServices();
            let testItem = setupTestItem(services, true);
            let message = 'This is a test message with a token {Token1}';
            executeFunction(testItem, message, 0, 0);
        });
        // three valid tokens of {Token1}, {Token2} and {Token3} lacks the {Token:LookupKey} format to change lookupKeysInfo, so no changes
        test('when message is a string with two valid tokens result does not change lookupKeysInfo or lookupKeysIssues', () => {
            let services = createServices();
            let testItem = setupTestItem(services, true);
            let message = '{Token1} This is a test message with two tokens {Token2} and {Token3}';
            executeFunction(testItem, message, 0, 0);
        });

        // token that is a syntax error adds an error message \"Syntax error\" into lookupKeysIssues
        test('Invalid token results in syntax error example 1', () => {
            // note earlier test on validateToken function covers all these cases
            let services = createServices();
            let testItem = setupTestItem(services, true);
            let message = '{Token:LookupKey';
            let valConfigProps = executeFunction(testItem, message, 0, 1);
            let prop = valConfigProps[0] as ConfigPropertyResult;
            expect(prop).toBeDefined();
            checkSyntaxError(prop, 'PropertyName');
        });
        // token is complete but has spaces in the first part is syntax error
        test('Invalid token results in syntax error example2', () => {
            // note earlier test on validateToken function covers all these cases
            let services = createServices();
            let testItem = setupTestItem(services, true);
            let message = '{ Token:LookupKey}';
            let valConfigProps = executeFunction(testItem, message, 0, 1);
            let prop = valConfigProps[0] as ConfigPropertyResult;
            expect(prop).toBeDefined();
            checkSyntaxError(prop, 'PropertyName');
        });
        // token is valid and has a real second part, the lookup key will get registered with LookupKeyInfo as a formatter service
        test('Valid token with Number as lookupKey results in lookup key info being registered', () => {
            let services = createServices();
            services.dataTypeFormatterService.register(new NumberFormatter(null));
            let testItem = setupTestItem(services, true);
            let message = '{Token:Number}';
            executeFunction(testItem, message, 1, 0);
            // let lkInfo = registerLookupKeyExists(testItem, LookupKey.Number);
            // let serviceInfo = checkServiceInfo(lkInfo, true, 1);
            // checkCultureRequestContainsClassName(serviceInfo,
            //     'NumberFormatter', NumberFormatter, 'en', 'en');
            let lkInfo = checkLookupKeyInfo(testItem.results.lookupKeysInfo, LookupKey.Number);
            let mcr = checkLookupKeyInfoForMultiClassRetrievalService(lkInfo, ServiceName.formatter, 1) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(mcr, formatterForCultureFeature,
                'en', 'en', 'NumberFormatter', NumberFormatter);
        });
        // same as above with 2 cultures, en and en-US that fallsback to en
        test('Valid token with Number as lookupKey and 2 cultures results in lookup key info being registered', () => {
            let services = createServices();
            services.dataTypeFormatterService.register(new NumberFormatter(null));
            services.cultureService = new CultureService();
            services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
            services.cultureService.register({ cultureId: 'en-US', fallbackCultureId: 'en' });
            let testItem = setupTestItem(services, false);
            let message = '{Token:Number}';
            executeFunction(testItem, message, 1, 0);
            // let lkInfo = registerLookupKeyExists(testItem, LookupKey.Number);
            // let serviceInfo = checkServiceInfo(lkInfo, true, 2);
            // checkCultureRequestContainsClassName(serviceInfo,
            //     'NumberFormatter', NumberFormatter, 'en', 'en');
            // checkCultureRequestContainsClassName(serviceInfo,
            //     'NumberFormatter', NumberFormatter, 'en-US', 'en-US');
            let lkInfo = checkLookupKeyInfo(testItem.results.lookupKeysInfo, LookupKey.Number);
            let mcr = checkLookupKeyInfoForMultiClassRetrievalService(lkInfo, ServiceName.formatter, 2) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(mcr, formatterForCultureFeature, 'en', 'en', 'NumberFormatter', NumberFormatter);
            checkCultureSpecificClassRetrievalFoundInService(mcr, formatterForCultureFeature, 'en-US', 'en-US', 'NumberFormatter', NumberFormatter);
        });


        // try a custom lookup key that has a fallback and teh fallback is used. Results in not found error for custom key
        // and uses the fallback to successfully match
        test('Valid token with custom lookupKey that fallsback to Number and the custom key has no formatter results in lookup key info being registered', () => {
            let services = createServices();
            services.dataTypeFormatterService.register(new NumberFormatter(null));
            services.lookupKeyFallbackService.register('Custom', LookupKey.Number);
            let testItem = setupTestItem(services, true);
            let message = '{Token:Custom}';
            executeFunction(testItem, message, 2, 0);
            // let customLKI = registerLookupKeyExists(testItem, 'Custom');
            // let customSI = checkServiceInfo(customLKI, true, 1);
            // checkCultureRequestNotFound(customSI, 'en');

            // let numberLKI = registerLookupKeyExists(testItem, LookupKey.Number);
            // let numberSI = checkServiceInfo(numberLKI, true, 1);
            // checkCultureRequestContainsClassName(numberSI,
            //     'NumberFormatter', NumberFormatter, 'en', 'en');
            let customSI = checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'Custom', ServiceName.formatter) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalNotFoundInService(customSI, formatterForCultureFeature, 'en');
            let numberSI = checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, LookupKey.Number, ServiceName.formatter) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(numberSI, formatterForCultureFeature, 'en', 'en', 'NumberFormatter', NumberFormatter);

        });
        // same but we actually have a Formatter for "custom"
        test('Valid token with custom lookupKey that has its own a formatter results in lookup key info being registered', () => {
            class CustomFormatter extends DataTypeFormatterBase {
                protected get expectedLookupKeys(): string | string[] {
                    return ['Custom'];
                }
                protected supportsCulture(cultureId: string): boolean {
                    return true;
                }
                public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
                    throw new Error('Method not implemented.');
                }
            }
            let services = createServices();
            services.dataTypeFormatterService.register(new NumberFormatter(null));
            services.dataTypeFormatterService.register(new CustomFormatter());  // we expect to find this one only
            services.lookupKeyFallbackService.register('Custom', LookupKey.Number);
            let testItem = setupTestItem(services, true);
            let message = '{Token:Custom}';
            executeFunction(testItem, message, 1, 0);

            let customSI = checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'Custom', ServiceName.formatter) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(customSI, formatterForCultureFeature, 'en', 'en', 'CustomFormatter', CustomFormatter);
        });

        // with 2 cultures, en and en-US with fallback to en, our customFormatter 
        // only supports 'en'.So there is a case for 'en-US' fallback to 'en' 
        // before CustomerFormatter is found
        test('Valid token with custom lookupKey that has its own a formatter and 2 cultures results in lookup key info being registered', () => {
            class CustomFormatter extends DataTypeFormatterBase {
                protected get expectedLookupKeys(): string | string[] {
                    return ['Custom'];
                }
                protected supportsCulture(cultureId: string): boolean {
                    return cultureId === 'en';
                }
                public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
                    throw new Error('Method not implemented.');
                }
                
            }
            let services = createServices();
            services.dataTypeFormatterService.register(new NumberFormatter(null));
            services.dataTypeFormatterService.register(new CustomFormatter());  // we expect to find this one only
            services.lookupKeyFallbackService.register('Custom', LookupKey.Number);
            services.cultureService = new CultureService();
            services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
            services.cultureService.register({ cultureId: 'en-US', fallbackCultureId: 'en' });
            let testItem = setupTestItem(services, false);
            let message = '{Token:Custom}';
            executeFunction(testItem, message, 1, 0);

            let customSI = checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'Custom', ServiceName.formatter) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(customSI, formatterForCultureFeature, 'en', 'en', 'CustomFormatter', CustomFormatter);
            checkCultureSpecificClassRetrievalFoundInService(customSI, formatterForCultureFeature, 'en-US', 'en', 'CustomFormatter', CustomFormatter);   
        });

        // message has two different tokens with different lookupkeys and one token without. It has 1 culture. Results should have two requests found
        test('message has two different tokens with different lookupkeys and one token without. It has 1 culture. Results should have two requests found', () => {
            class CustomFormatter extends DataTypeFormatterBase {
                protected get expectedLookupKeys(): string | string[] {
                    return ['Custom'];
                }
                protected supportsCulture(cultureId: string): boolean {
                    return true;
                }
                public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
                    throw new Error('Method not implemented.');
                }
            }            
            let services = createServices();
            services.dataTypeFormatterService.register(new NumberFormatter(null));
            services.dataTypeFormatterService.register(new CustomFormatter());

            let testItem = setupTestItem(services, true);
            let message = 'A {Token:Custom} B {Token2:Number} C';
            executeFunction(testItem, message, 2, 0);

            let customSI = checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'Custom', ServiceName.formatter) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(customSI, formatterForCultureFeature, 'en', 'en', 'CustomFormatter', CustomFormatter);
            let numberSI = checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, LookupKey.Number, ServiceName.formatter) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(numberSI, formatterForCultureFeature, 'en', 'en', 'NumberFormatter', NumberFormatter);

        });

        // variation where there are two cultures, en and fr, and each token uses one of the two, but not the same one
        test('message has two different tokens with different lookupkeys and one token without. It has 2 cultures. Results should have two requests found', () => {
            class CustomFormatter extends DataTypeFormatterBase {
                protected get expectedLookupKeys(): string | string[] {
                    return ['Custom'];
                }
                protected supportsCulture(cultureId: string): boolean {
                    return cultureId === 'en';
                }
                public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
                    throw new Error('Method not implemented.');
                }
            }            
            let services = createServices();
            services.dataTypeFormatterService.register(new NumberFormatter(null));
            services.dataTypeFormatterService.register(new CustomFormatter());
            services.cultureService = new CultureService();
            services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
            services.cultureService.register({ cultureId: 'fr', fallbackCultureId: null });
            let testItem = setupTestItem(services, false);
            let message = 'A {Token:Custom} B {Token2:Number} C';
            executeFunction(testItem, message, 2, 0);

            let customSI = checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, 'Custom', ServiceName.formatter) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(customSI, formatterForCultureFeature, 'en', 'en', 'CustomFormatter', CustomFormatter);
            checkCultureSpecificClassRetrievalNotFoundInService(customSI, formatterForCultureFeature, 'fr');
            // NumberFormatter supports all cultures so it should be found for both
            let numberSI = checkLookupKeysInfoForService(testItem.results.lookupKeysInfo, LookupKey.Number, ServiceName.formatter) as FormatterServiceClassRetrieval;
            checkCultureSpecificClassRetrievalFoundInService(numberSI, formatterForCultureFeature, 'en', 'en', 'NumberFormatter', NumberFormatter);
            checkCultureSpecificClassRetrievalFoundInService(numberSI, formatterForCultureFeature, 'fr', 'fr', 'NumberFormatter', NumberFormatter);
        });

    });    
    describe('checkValueHostNameExists', () => {
        // test cases:
        // 1. name is undefined is makes no changes to properties
        // 2. name is null is makes no changes to properties
        // 3. name is empty string is makes no changes to properties
        // 4. name that is only whitespace is makes no changes to properties
        // 5. name that is not a string adds error "Must be a string"
        // 6. name that is an exact match to a value host name in the valueHostConfigs array makes no changes to properties
        // 7. With empty valueHostConfigs array, valid name syntax will always report "ValueHostName does not exist"
        // 8. name that is a case insensitive match to a value host name in the valueHostConfigs array makes error "Change to "${name}""
        // 9. name that has surrounding whitespace adds error "Remove whitespace"
        // 10. With non-empty valueHostConfigs array, valid name syntax that is not found in the array will always report "ValueHostName does not exist"

        function setupForTheseTests(): Publicify_AnalysisResultsHelper<IValidationServices> {
            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            return testItem;
        }
        test('name is undefined makes no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValueHostNameExists(undefined, 'PropertyName', properties);
            expect(properties).toHaveLength(0);
        });

        test('name is null makes no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValueHostNameExists(null, 'PropertyName', properties);
            expect(properties).toHaveLength(0);
        });

        test('name is empty string makes no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValueHostNameExists('', 'PropertyName', properties);
            expect(properties).toHaveLength(0);
        });
        test('name that is only whitespace is makes no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValueHostNameExists('   ', 'PropertyName', properties);
            expect(properties).toHaveLength(0);
        });
        test('name that is not a string adds error "Must be a string"', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValueHostNameExists(123, 'PropertyName', properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'Must be a string', ConfigIssueSeverity.error);
        });
        test('name that is an exact match to a value host name in the valueHostConfigs array makes no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.results.valueHostNames = ['testValueHost'];
            testItem.checkValueHostNameExists('testValueHost', 'PropertyName', properties);
            expect(properties).toHaveLength(0);
        });
        test('With empty valueHostConfigs array, valid name syntax will always report "ValueHostName does not exist"', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.checkValueHostNameExists('testValueHost', 'PropertyName', properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'ValueHostName does not exist', ConfigIssueSeverity.error);
        });
        test('name that is a case insensitive match to a value host name in the valueHostConfigs array makes error "Change to "${name}"', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.results.valueHostNames = ['testValueHost'];
            testItem.checkValueHostNameExists('testvaluehost', 'PropertyName', properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'Change to "testValueHost"', ConfigIssueSeverity.error);
        });
        test('name that has surrounding whitespace adds error "Remove whitespace"', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.results.valueHostNames = ['testValueHost'];
            testItem.checkValueHostNameExists('  testValueHost  ', 'PropertyName', properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'Remove whitespace', ConfigIssueSeverity.error);
        });
        test('With non-empty valueHostConfigs array, valid name syntax that is not found in the array will always report "ValueHostName does not exist"', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];

            testItem.results.valueHostNames = ['testValueHost'];
            testItem.checkValueHostNameExists('anotherValueHost', 'PropertyName', properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'ValueHostName does not exist', ConfigIssueSeverity.error);
        });

    });

    describe('checkValuePropertyContents', () => {
        function setupForTheseTests(): Publicify_AnalysisResultsHelper<IValidationServices> {
            let services = createServices();
            let dtis = new DataTypeIdentifierService();
            services.dataTypeIdentifierService = dtis;
            dtis.services = services;
            dtis.register(new NumberDataTypeIdentifier());
            dtis.register(new StringDataTypeIdentifier());
            let dtcs = new DataTypeConverterService();
            services.dataTypeConverterService = dtcs;
            dtcs.services = services;
            dtcs.register(new NumericStringToNumberConverter());
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            return testItem;
        }
        // create test cases:
        // 1. value is undefined and rule is optional, no changes to properties
        // 2. value is undefined and rule is not optional, adds error "Value is required"
        // 3. value is null and rule is required, adds error "Must not be null"
        // 4. value is null and rule is not required, no changes to properties
        // 5. number value is assigned and valueLookupKey=null and conversionLookupKey = null, 
        //  no changes to properties (because Identifierservice found a match)
        // 6. number value is assigned and valueLookupKey=null and conversionLookupKey = LookupKey.String,
        // conversion succeeds using NumericStringToNumberConverter (which must be registered)
        // and no changes to properties
        // 7. number value is assigned and valueLookupKey=null and conversionLookupKey = LookupKey.Boolean,
        // conversion fails due to lack of converter. Properties get a message "Value cannot be converter to LookupKey "${conversionLookupKey}" "
        // 8. number value is assigned and valueLookupKey=LookupKey.Number and conversionLookupKey = null,
        // no changes to properties
        // 9. number value is assigned and valueLookupKey=LookupKey.Number and conversionLookupKey = LookupKey.Number,
        // no changes to properties
        // 10. number value is assigned and valueLookupKey=LookupKey.Number and conversionLookupKey = LookupKey.String,
        // conversion succeeds using NumericStringToNumberConverter (which must be registered)
        // and no changes to properties
        // 11. number value is assigned and valueLookupKey=LookupKey.Number and conversionLookupKey = LookupKey.Boolean,
        // conversion fails due to lack of converter. Properties get a message "Value cannot be converter to LookupKey "${conversionLookupKey}" "
        // 12. string value is assigned and valueLookupKey=null and conversionLookupKey = null,
        //  no changes to properties (because Identifierservice found a match)
        
        test('value is undefined, no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents(undefined, 'PropertyName', null, null, properties);
            expect(properties).toHaveLength(0);
        });

        test('value is null, no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents(null, 'PropertyName', null, null, properties);
            expect(properties).toHaveLength(0);

        });
        // value is empty string, no changes to properties
        test('value is empty string, no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents('', 'PropertyName', null, null, properties);
            expect(properties).toHaveLength(0);
        });
        // value is whitespace string, no changes to properties
        test('value is whitespace string, no changes to properties', () => {
            let testItem = setupForTheseTests();
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents('   ', 'PropertyName', null, null, properties);
            expect(properties).toHaveLength(0);
        });


        test('number value is assigned and valueLookupKey=null and conversionLookupKey = null, no changes to properties', () => {
            let testItem = setupForTheseTests();    // NumberDataTypeIdentifier registered
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents(123, 'PropertyName', null, null, properties);
            expect(properties).toHaveLength(0);
        });

        test('numeric string value is assigned and valueLookupKey=null and conversionLookupKey = LookupKey.Number, conversion succeeds using NumericStringToNumberConverter', () => {
            let testItem = setupForTheseTests();    // NumberDataTypeIdentifier and NumericStringToNumberConverter registered
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents('123', 'PropertyName', null, LookupKey.Number, properties);
            expect(properties).toHaveLength(0);
        });
        test('numeric string value is assigned and valueLookupKey=null and conversionLookupKey = LookupKey.Boolean, conversion fails due to lack of converter', () => {
            let testItem = setupForTheseTests();    // NumberDataTypeIdentifier registered
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents('123', 'PropertyName', null, LookupKey.Boolean, properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'Value cannot be converted to Lookup Key "Boolean"', ConfigIssueSeverity.error);
        });
        test('number value is assigned and valueLookupKey=LookupKey.Number and conversionLookupKey = null, no changes to properties', () => {
            let testItem = setupForTheseTests();    // NumberDataTypeIdentifier registered
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents(123, 'PropertyName', LookupKey.Number, null, properties);
            expect(properties).toHaveLength(0);
        });
        test('number value is assigned and valueLookupKey=LookupKey.Number and conversionLookupKey = LookupKey.Number, no changes to properties', () => {
            let testItem = setupForTheseTests();    // NumberDataTypeIdentifier registered
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents(123, 'PropertyName', LookupKey.Number, LookupKey.Number, properties);
            expect(properties).toHaveLength(0);
        });
        test('numeric string value is assigned and valueLookupKey=LookupKey.String and conversionLookupKey = LookupKey.Number, conversion succeeds using NumericStringToNumberConverter', () => {
            let testItem = setupForTheseTests();    // NumberDataTypeIdentifier and NumericStringToNumberConverter registered
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents('123', 'PropertyName', LookupKey.String, LookupKey.Number, properties);
            expect(properties).toHaveLength(0);
        });
        test('numeric string value is assigned and valueLookupKey=LookupKey.String and conversionLookupKey = LookupKey.Boolean, conversion fails due to lack of converter', () => {
            let testItem = setupForTheseTests();    // NumberDataTypeIdentifier registered
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents('123', 'PropertyName', LookupKey.String, LookupKey.Boolean, properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'Value cannot be converted to Lookup Key "Boolean"', ConfigIssueSeverity.error);
        });
        test('string value is assigned and valueLookupKey=null and conversionLookupKey = null, no changes to properties', () => {
            let testItem = setupForTheseTests();    // StringDataTypeIdentifier registered
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents('123', 'PropertyName', null, null, properties);
            expect(properties).toHaveLength(0);
        });
        // source data type is a custom object without datatype identifier
        // It has no valueLookupKey nor conversionLookupKey supplied, so message "Value could not be validated"
        test('source data type is a custom object without datatype identifier, no changes to properties', () => {
            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents({ value: 123 }, 'PropertyName', null, null, properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'Value could not be validated', ConfigIssueSeverity.info);
        });
        // same but with conversionLookupKey=Number. Since there is no DataTypeConverter,
        // the message is "cannot be converted to Lookup Key "Number"
        test('source data type is a custom object without datatype identifier, conversionLookupKey=Number, no changes to properties', () => {
            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents({ value: 123 }, 'PropertyName', null, LookupKey.Number,properties);
            expect(properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(properties, 0,
                'PropertyName', 'Value cannot be converted to Lookup Key "Number"',
                ConfigIssueSeverity.error);
        });
        // same but valueLookupKey="Custom" and no conversionLookupKey
        // No error added to properties
        test('source data type is a custom object without datatype identifier, valueLookupKey=Custom, no changes to properties', () => {
            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkValuePropertyContents({ value: 123 }, 'PropertyName', 'Custom', null, properties);
            expect(properties).toHaveLength(0);
        });
    });
    describe('checkIsNotUndefined', () => {
        test('should add an error message when the value is undefined and severity=error', () => {
            const propertyName = 'testProperty';
            const value = undefined;

            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkIsNotUndefined(value, propertyName, properties, ConfigIssueSeverity.error);
            checkConfigPropertyResultsFromArray(properties, 0,
                propertyName, 'Value must be defined.', ConfigIssueSeverity.error);
        
        });
        // same but with a severity=warning
        test('should add an error message when the value is undefined and severity=warning', () => {
            const propertyName = 'testProperty';
            const value = undefined;

            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkIsNotUndefined(value, propertyName, properties, ConfigIssueSeverity.warning);
            checkConfigPropertyResultsFromArray(properties, 0,
                propertyName, 'Value must be defined.', ConfigIssueSeverity.warning);
        
        });
        
        test('should not add an error message when the value is not undefined', () => {
            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            const propertyName = 'testProperty';
            const value = 'testValue';
            testItem.checkIsNotUndefined(value, propertyName, properties);
        
            expect(properties).toHaveLength(0);
        });
    });
    describe('checkIsNotNull', () => {
        test('should add an error message when the value is null and severity=error', () => {
            const propertyName = 'testProperty';
            const value = null;

            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkIsNotNull(value, propertyName, properties, ConfigIssueSeverity.error);
            checkConfigPropertyResultsFromArray(properties, 0,
                propertyName, 'Value must not be null.', ConfigIssueSeverity.error);
        
        });
        // same but with a severity=warning
        test('should add an error message when the value is null and severity=warning', () => {
            const propertyName = 'testProperty';
            const value = null;

            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkIsNotNull(value, propertyName, properties, ConfigIssueSeverity.warning);
            checkConfigPropertyResultsFromArray(properties, 0,
                propertyName, 'Value should not be null.', ConfigIssueSeverity.warning);
        
        });
        
        test('should not add an error message when the value is not null', () => {
            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            const propertyName = 'testProperty';
            const value = 'testValue';
            testItem.checkIsNotNull(value, propertyName, properties);
        
            expect(properties).toHaveLength(0);
        });
    });
    describe('checkIsNotEmptyString', () => {
        test('should add an error message when the value is an empty string and severity=error', () => {
            const propertyName = 'testProperty';
            const value = '';

            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkIsNotEmptyString(value, propertyName, properties, ConfigIssueSeverity.error);
            checkConfigPropertyResultsFromArray(properties, 0,
                propertyName, 'Value must not be empty string.', ConfigIssueSeverity.error);
        
        });
        // same but with a severity=warning
        test('should add an error message when the value is an empty string and severity=warning', () => {
            const propertyName = 'testProperty';
            const value = '';

            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            testItem.checkIsNotEmptyString(value, propertyName, properties, ConfigIssueSeverity.warning);
            checkConfigPropertyResultsFromArray(properties, 0,
                propertyName, 'Value should not be empty string.', ConfigIssueSeverity.warning);
        
        });
        
        test('checkIsNotEmptyString should not add an error message when the value is not an empty string', () => {
            let services = createServices();
            let testItem = new Publicify_AnalysisResultsHelper(createAnalysisArgs(services, [], {}));
            let properties: Array<ConfigPropertyResult | ConfigErrorResult> = [];
            const propertyName = 'testProperty';
            const value = 'testValue';

        
            testItem.checkIsNotEmptyString(value, propertyName, properties);
        
            expect(properties).toHaveLength(0);
        });
    });
});


