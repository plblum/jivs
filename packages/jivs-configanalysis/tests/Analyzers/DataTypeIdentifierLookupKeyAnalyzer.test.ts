import { IDataTypeIdentifier } from '@plblum/jivs-engine/build/Interfaces/DataTypeIdentifier';
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { NumberDataTypeIdentifier } from '@plblum/jivs-engine/build/DataTypes/DataTypeIdentifiers';
import { DataTypeIdentifierLookupKeyAnalyzer } from '../../src/Analyzers/DataTypeIdentifierLookupKeyAnalyzer';
import { IdentifierServiceCAResult } from '../../src/Types/Results';
import { createValidationServicesForTesting } from "@plblum/jivs-engine/build/Support/createValidationServicesForTesting";

import { createAnalysisArgs } from '../TestSupport/support';

describe('DataTypeIdentifierLookupKeyAnalyzer', () => {
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
        services.dataTypeIdentifierService.register(new NumberHosterIdentifier());
        services.dataTypeIdentifierService.register(new NumberHosterIdentifier());
        return services;
    }
    describe('analyze()', () => {
        test('Requested result is number. Will identify TestStringToNumberConverter with no errors found ', () => {
            let services = setupServices();
            let dtfi = services.dataTypeIdentifierService;
            dtfi.register(new NumberHosterIdentifier());

            let resultKey = numberHosterLookupKey;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',

            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig],
                {

                }
            );
            let analyzer = new DataTypeIdentifierLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as IdentifierServiceCAResult;
            expect(result).toBeDefined();
            expect(result!.classFound).toBe('NumberHosterIdentifier');
            expect(result!.instance).toBeInstanceOf(NumberHosterIdentifier);
            expect(result!.severity).toBeUndefined();

        });
        // same but for Number, which has a predefined NumberIdentifier class
        test('Request result is number. Will identify NumberDataTypeIdentifier with no errors found ', () => {
            let services = setupServices();
            let dtfi = services.dataTypeIdentifierService;
            dtfi.register(new NumberHosterIdentifier());

            let resultKey = LookupKey.Number;

            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',

            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig],
                {
                }
            );
            let analyzer = new DataTypeIdentifierLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as IdentifierServiceCAResult;
            expect(result).toBeDefined();
            expect(result!.classFound).toBe('NumberDataTypeIdentifier');
            expect(result!.instance).toBeInstanceOf(NumberDataTypeIdentifier);
            expect(result!.severity).toBeUndefined();

        });

        // "custom" for Lookup Key has no matching identifier
        // will report a "not found" error
        test('Requested result is custom. Will not find a matching identifier and report an error.', () => {
            let services = setupServices();
            let dtfi = services.dataTypeIdentifierService;
            dtfi.register(new NumberHosterIdentifier());

            let resultKey = 'Custom';

            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',

            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig],
                {
                }
            );
            let analyzer = new DataTypeIdentifierLookupKeyAnalyzer(mockAnalysisArgs);

            let result = analyzer.analyze(resultKey, valueHostConfig) as IdentifierServiceCAResult;
            expect(result).toBeDefined();
            expect(result!.classFound).toBeUndefined();
            expect(result!.instance).toBeUndefined();
            expect(result!.severity).toBe('error');
            expect(result!.message).toContain('No DataTypeIdentifier for LookupKey')
        });

    });

});