import { IDataTypeIdentifier } from '../../../src/Interfaces/DataTypeIdentifier';
import { DataTypeConverterLookupKeyAnalyzer } from "../../../src/Services/ConfigAnalysisService/DataTypeConverterLookupKeyAnalyzer";
import { IDataTypeConverter } from "../../../src/Interfaces/DataTypeConverters";
import { ValueHostConfig } from "../../../src/Interfaces/ValueHost";
import { createValidationServicesForTesting } from "../../TestSupport/createValidationServices";
import { IValidationServices } from '../../../src/Interfaces/ValidationServices';
import { CAIssueSeverity, ConverterServiceClassRetrieval } from '../../../src/Interfaces/ConfigAnalysisService';
import { LookupKey } from '../../../src/DataTypes/LookupKeys';
import { sampleValueByLookupKey, createAnalysisArgs } from './support';


describe('DataTypeConverterLookupKeyAnalyzer', () => {
    const toConvertToNumberLookupKey = 'ToConvertToNumber';
    class ToConvertToNumber
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
    class TestToNumberIdentifier implements IDataTypeIdentifier
    {
        dataTypeLookupKey: string = toConvertToNumberLookupKey;
        supportsValue(value: any): boolean {
            return value instanceof ToConvertToNumber;
        }
        sampleValue() {
            return new ToConvertToNumber(15);
        }
    }
    class TestToNumberConverter implements IDataTypeConverter
    {
        canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
            return value instanceof ToConvertToNumber && resultLookupKey === LookupKey.Number;
        }
        convert(value: ToConvertToNumber, sourceLookupKey: string | null, resultLookupKey: string) {
            return value.getValue();
        }
        supportedResultLookupKeys(): string[] {
            return [LookupKey.Number];
        }
        supportedSourceLookupKeys(): (string | null)[] {
            return [null, toConvertToNumberLookupKey];
        }
        sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
            return value instanceof ToConvertToNumber;
        }
    }
    class TestStringToNumberConverter implements IDataTypeConverter
    {
        canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
            return typeof value === 'string' && resultLookupKey === LookupKey.Number;
        }
        convert(value: string, sourceLookupKey: string | null, resultLookupKey: string) {
            let x = parseFloat(value);
            return isNaN(x) ? undefined : x;
        }
        supportedResultLookupKeys(): string[] {
            return [LookupKey.Number];
        }
        supportedSourceLookupKeys(): (string | null)[] {
            return [null, LookupKey.String];
        }
        sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
            return typeof value === 'string';
        }
    }    
    function setupServices() : IValidationServices {
        let services = createValidationServicesForTesting();
        services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
        services.dataTypeIdentifierService.register(new TestToNumberIdentifier());
        services.dataTypeConverterService.register(new TestToNumberConverter());
        services.dataTypeConverterService.register(new TestStringToNumberConverter());
        return services;
    }
    describe('analyze()', () => {
        test('Source is a string, requested result is number. Will identify TestStringToNumberConverter with no errors found ', () => {
            let services = setupServices();

            let resultKey = LookupKey.Number;
            let sourceKey = LookupKey.String;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: sourceKey
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig],
                {
                    lookupKeysSampleValues: { [sourceKey]: '18' }
                }
            );
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBe('TestStringToNumberConverter');
            expect(result!.instance).toBeInstanceOf(TestStringToNumberConverter);
            expect(result!.severity).toBeUndefined();
            expect(result!.dataExamples).toEqual(['18']);
        });

        test('valueHostConfig.dataType is null. Samples cannot be resolved by datatype, but instead by valueHostType ', () => {
            let services = setupServices();

            let resultKey = LookupKey.Number;
            let sourceKey = LookupKey.String;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: null!
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig],
                {
                    lookupKeysSampleValues: { [sourceKey]: '18' },
                    valueHostsSampleValues: { 'ValueHost1': '200' }
                }
            );
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBe('TestStringToNumberConverter');
            expect(result!.instance).toBeInstanceOf(TestStringToNumberConverter);
            expect(result!.severity).toBeUndefined();
            expect(result!.dataExamples).toEqual(['200']);
        });
        // same but no options supplied in mockAnalysisArgs results in a warning
        test('valueHostConfig.dataType is null. Samples cannot be resolved by datatype, but instead by valueHostType. No samples supplied. Will report a warning', () => {
            let services = setupServices();

            let resultKey = LookupKey.Number;

            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: null!
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBeUndefined();
            expect(result!.instance).toBeUndefined();
            expect(result!.severity).toBe(CAIssueSeverity.warning);
            expect(result!.message).toMatch('DataTypeConverter');
            expect(result!.message).toMatch('No sample value');
            expect(result!.dataExamples).toBeUndefined();
        });
        test('Source is a "ToConvertToNumber", requested result is number. Will identify TestNumberConverter with no errors found ', () => {
            let services = setupServices();

            let resultKey = LookupKey.Number;
            let sourceKey = toConvertToNumberLookupKey;  // registered in setupServices
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: sourceKey
            };
            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig], {
                lookupKeysSampleValues: { [sourceKey]: new ToConvertToNumber(88) }  
        
            });
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBe('TestToNumberConverter');
            expect(result!.instance).toBeInstanceOf(TestToNumberConverter);
            expect(result!.severity).toBeUndefined();
            expect(result!.dataExamples).toBeDefined();
            expect(result!.dataExamples![0]).toBeInstanceOf(ToConvertToNumber);
        });
        test('Source is an unknown data type. Result is number. Will report a \"sample value not found\" warning', () => {
            let services = setupServices();

            let resultKey = LookupKey.Number;
            let sourceKey = 'Unknown';
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: sourceKey
            };
            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBeUndefined
            expect(result!.instance).toBeUndefined();
            expect(result!.severity).toBe(CAIssueSeverity.warning);
            expect(result!.message).toMatch('DataTypeConverter');
            expect(result!.message).toMatch('No sample value');        
            expect(result!.dataExamples).toBeUndefined();
        });
        test('Source is a string, requested result is an unknown lookup key. Will report \"lookup key not found\" error. ', () => {
            let services = setupServices();

            let resultKey = 'Unknown';
            let sourceKey = LookupKey.String;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: sourceKey
            };
            let expectedSampleValue = sampleValueByLookupKey(services, sourceKey);

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBeUndefined
            expect(result!.instance).toBeUndefined();
            expect(result!.severity).toBe(CAIssueSeverity.error);
            expect(result!.message).toMatch('No DataTypeConverter for LookupKey');
            expect(result!.dataExamples).toEqual([expectedSampleValue]);
        });
        test('Source is an unknown data type that has been supplied a sample value in options, requested result is number. Will return TestStringToNumberConverter without errors', () => {
            let services = setupServices();

            let resultKey = LookupKey.Number;
            let sourceKey = 'FakeString';
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: sourceKey
            };
            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig], {
                lookupKeysSampleValues: { [sourceKey]: '100' }
            });
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBe('TestStringToNumberConverter');
            expect(result!.instance).toBeInstanceOf(TestStringToNumberConverter);
            expect(result!.severity).toBeUndefined();       
            expect(result!.dataExamples).toEqual(['100']);
        });
        test('Source is an string that has been supplied a sample value with a lookup key in options, requested result is number. Will return TestStringToNumber without errors', () => {
            let services = setupServices();

            let resultKey = LookupKey.Number;
            let sourceKey = LookupKey.String;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: sourceKey
            };
            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig], {
                lookupKeysSampleValues: { [sourceKey]: '2' }
            });
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBe('TestStringToNumberConverter');
            expect(result!.instance).toBeInstanceOf(TestStringToNumberConverter);
            expect(result!.severity).toBeUndefined();       
            expect(result!.dataExamples).toEqual(['2']);
        });
        test('Source is an string that has been supplied a ValueHost sample value in options, requested result is number. Will return TestStringToNumber without errors', () => {
            let services = setupServices();

            let resultKey = LookupKey.Number;
            let sourceKey = LookupKey.String;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: sourceKey
            };
            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig], {
                valueHostsSampleValues: { ValueHost1: '21' }
            });
            let analyzer = new DataTypeConverterLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as ConverterServiceClassRetrieval;
            expect(result).toBeDefined();
            expect(result!.classFound).toBe('TestStringToNumberConverter');
            expect(result!.instance).toBeInstanceOf(TestStringToNumberConverter);
            expect(result!.severity).toBeUndefined();       
            expect(result!.dataExamples).toEqual(['21']);
        });        
    });
});