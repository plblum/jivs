import { IDataTypeIdentifier } from '../../../src/Interfaces/DataTypeIdentifier';
import { DataTypeFormatterLookupKeyAnalyzer } from "../../../src/Services/ConfigAnalysisService/DataTypeFormatterLookupKeyAnalyzer";
import { IDataTypeFormatter } from "../../../src/Interfaces/DataTypeFormatters";
import { ValueHostConfig } from "../../../src/Interfaces/ValueHost";
import { createValidationServicesForTesting } from "../../TestSupport/createValidationServices";
import { IValidationServices, ServiceName } from '../../../src/Interfaces/ValidationServices';
import { CAIssueSeverity, FormatterServiceClassRetrieval, OneClassRetrieval, formatterForCultureFeature, formatterServiceFeature } from '../../../src/Interfaces/ConfigAnalysisService';
import { LookupKey } from '../../../src/DataTypes/LookupKeys';
import { sampleValueByLookupKey, createAnalysisArgs, checkCultureSpecificClassRetrievalFoundInService, checkCultureSpecificClassRetrievalNotFoundInService, createServices } from './support';
import { DataTypeResolution } from '../../../src/Interfaces/DataTypes';
import { NumberFormatter } from '../../../src/DataTypes/DataTypeFormatters';
describe('DataTypeFormatterLookupKeyAnalyzer', () => {
    const toConvertToNumberLookupKey = 'ToConvertToNumber';
    class ToConvertToNumber {
        constructor(value: number) {
            this._value = value;
        }
        private _value: number;
        getValue(): number {
            return this._value;
        }
    }
    class TestToNumberIdentifier implements IDataTypeIdentifier {
        dataTypeLookupKey: string = toConvertToNumberLookupKey;
        supportsValue(value: any): boolean {
            return value instanceof ToConvertToNumber;
        }
        sampleValue() {
            return new ToConvertToNumber(15);
        }
    }
    class TestToNumberFormatter implements IDataTypeFormatter {
        supports(dataTypeLookupKey: string, cultureId: string): boolean {
            return dataTypeLookupKey === toConvertToNumberLookupKey;
        }
        format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
            if (dataTypeLookupKey === toConvertToNumberLookupKey && value instanceof ToConvertToNumber) {
                return {
                    value: value.getValue().toString()
                };
            }
            return {
                errorMessage: 'TEST ERROR'
            };
        }
    }


    function setupServices() : IValidationServices {
        let services = createServices(['en']);
        services.dataTypeIdentifierService.register(new TestToNumberIdentifier());
        services.dataTypeFormatterService.register(new TestToNumberFormatter());
        return services;
    }
    describe('analyze()', () => {
        test('Requested result is "Number". Will identify NumberFormatter with no errors found ', () => {
            let services = setupServices();
            services.dataTypeFormatterService.register(new NumberFormatter());

            let resultKey = LookupKey.Number;

            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',

            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig],
                {
            //        lookupKeysSampleValues: { [sourceKey]: '18' }
                }
            );
            let analyzer = new DataTypeFormatterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as FormatterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.feature).toBe(formatterServiceFeature);
            expect(result!.notFound).toBeUndefined();
            checkCultureSpecificClassRetrievalFoundInService(result, formatterForCultureFeature, 'en', 'en',
                'NumberFormatter', NumberFormatter);

        });
        // same but lookupkey = null and valueHostConfig.dataType = 'Number'
        test('Requested result is null and ValueHostConfig.dataType = "Number". Will identify NumberFormatter with no errors found ', () => {
            let services = setupServices();
            services.dataTypeFormatterService.register(new NumberFormatter());

            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: LookupKey.Number
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig],
                {
                }
            );
            let analyzer = new DataTypeFormatterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(null!, valueHostConfig) as FormatterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.feature).toBe(formatterServiceFeature);
            expect(result!.notFound).toBeUndefined();
            checkCultureSpecificClassRetrievalFoundInService(result, formatterForCultureFeature, 'en', 'en',
                'NumberFormatter', NumberFormatter);

        });
        test('Source is a "ToConvertToNumber". Will identify TestNumberFormatter with no errors found ', () => {
            let services = setupServices();

            let resultKey = toConvertToNumberLookupKey;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
            };
            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig], {
     //           lookupKeysSampleValues: { [sourceKey]: new ToConvertToNumber(88) }  
        
            });
            let analyzer = new DataTypeFormatterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as FormatterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.feature).toBe(formatterServiceFeature);
            expect(result!.notFound).toBeUndefined();
            checkCultureSpecificClassRetrievalFoundInService(result, formatterForCultureFeature, 'en', 'en',
                'TestToNumberFormatter', TestToNumberFormatter);

        });
        test('Requested result is an unknown lookup key. Will report \"lookup key not found\" error. ', () => {
            let services = setupServices();

            let resultKey = 'Unknown';
            let sourceKey = LookupKey.String;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
           //     dataType: sourceKey
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let analyzer = new DataTypeFormatterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as FormatterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.feature).toBe(formatterServiceFeature);
            expect(result!.notFound).toBe(true);
            checkCultureSpecificClassRetrievalNotFoundInService(result, formatterForCultureFeature, 'en');
        });

        // cultures with fallback: 'en-US' -> 'en'. Test Formatter only handles 'en'
        // expect to have two requests, for 'en-US' and 'en', with the first one not found
        test('Requested result is "Number". Will identify NumberFormatter with no errors found ', () => {
            const testLookupKey = 'ENONLY';
            class ENOnlyNumberFormatter implements IDataTypeFormatter {
                supports(dataTypeLookupKey: string, cultureId: string): boolean {
                    return dataTypeLookupKey === testLookupKey &&
                    cultureId === 'en';
                }
                format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
                    if (typeof value === 'number') {
                        return {
                            value: value.toString()
                        };
                    }
                    return {
                        errorMessage: 'TEST ERROR'
                    };
                }
            }            
            let services = setupServices(); // already has 'en'
            services.cultureService.register({ cultureId: 'en-US', fallbackCultureId: 'en' });
            services.dataTypeFormatterService.register(new ENOnlyNumberFormatter());

            let resultKey = testLookupKey;

            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',

            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig],
                {
                }
            );
            let analyzer = new DataTypeFormatterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as FormatterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.feature).toBe(formatterServiceFeature);
            expect(result!.notFound).toBeUndefined();
 //           checkCultureSpecificClassRetrievalNotFoundInService(result, 'en-US');
            checkCultureSpecificClassRetrievalFoundInService(result, formatterForCultureFeature, 'en-US', 'en',
                'ENOnlyNumberFormatter', ENOnlyNumberFormatter);
            checkCultureSpecificClassRetrievalFoundInService(result, formatterForCultureFeature, 'en', 'en',
                'ENOnlyNumberFormatter', ENOnlyNumberFormatter);
            
        });
    });
});