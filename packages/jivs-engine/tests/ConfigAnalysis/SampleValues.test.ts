import { SampleValues } from '../../src/ConfigAnalysis/SampleValues';
import { ConfigAnalysisServiceOptions } from '../../src/Interfaces/ConfigAnalysisService';
import { IValueHostsServices } from '../../src/Interfaces/ValueHostsServices';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { createValidationServicesForTesting } from '../TestSupport/createValidationServices';
import { LookupKey } from '../../src/DataTypes/LookupKeys';

describe('SampleValues', () => {
    class Publicify_SampleValues extends SampleValues<IValueHostsServices> {
        public get Publicify_sampleValuesCache(): Map<string, any>
        {
            return super.sampleValuesCache;
        }
        public get Publicify_options(): ConfigAnalysisServiceOptions {
            return super.options;
        }

        public get Publicify_services(): IValueHostsServices {
            return super.services;
        }

        public get Publicify_lookupKeysSampleValues(): { [key: string]: any } {
            return super.lookupKeysSampleValues ?? {}
        }
        public get Publicify_valueHostsSampleValues(): { [key: string]: any } {
            return super.valueHostsSampleValues ?? {}
        }
        public tryToIdentifyLookupKey(lookupKey: string, services: IValueHostsServices)
        {
            return super.tryToIdentifyLookupKey(lookupKey, services);
        }
    
    }

    test('constructor with no options creates its own objects and inits all other properties', () => {
        const services = createValidationServicesForTesting();
        const sampleValues = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
        expect(sampleValues.Publicify_sampleValuesCache).toBeInstanceOf(Map);
        expect(sampleValues.Publicify_sampleValuesCache.size).toBe(0);        
        expect(sampleValues.Publicify_options).toEqual({});
        expect(sampleValues.Publicify_services).toBe(services);
        expect(sampleValues.Publicify_lookupKeysSampleValues).toEqual({});
        expect(sampleValues.Publicify_valueHostsSampleValues).toEqual({});
    });
    test('constructor with options creates its own objects and inits all other properties', () => {
        const services = createValidationServicesForTesting();
        const lookupKeySampleValues = { 'lookupKey1': 'sampleValue1' };
        const valueHostsSampleValues = { 'valueHost1': 'Test' };

        const sampleValues = new Publicify_SampleValues(services,
            { lookupKeysSampleValues: lookupKeySampleValues, valueHostsSampleValues: valueHostsSampleValues } as ConfigAnalysisServiceOptions);
        expect(sampleValues.Publicify_sampleValuesCache).toBeInstanceOf(Map);
        expect(sampleValues.Publicify_sampleValuesCache.size).toBe(0);
        expect(sampleValues.Publicify_options).toEqual({ lookupKeysSampleValues: lookupKeySampleValues, valueHostsSampleValues: valueHostsSampleValues });
        expect(sampleValues.Publicify_services).toBe(services);
        expect(sampleValues.Publicify_lookupKeysSampleValues).toBe(lookupKeySampleValues);
            
        expect(sampleValues.Publicify_valueHostsSampleValues).toBe(valueHostsSampleValues);
        
    });

    test('tryToIdentifyLookupKey should return a sample value when the lookupKey is in DataTypeIdentifierService', () => {
        const services = createValidationServicesForTesting();
        let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Number);
        expect(dti).toBeDefined();
        const expectedSampleValue = dti!.sampleValue();

        const testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
        const lookupKey = LookupKey.Number;
        const sampleValue = testItem.tryToIdentifyLookupKey(lookupKey, services);
        expect(sampleValue).toBe(expectedSampleValue);
    });
    test('tryToIdentifyLookupKey should return undefined when the lookupKey is not in DataTypeIdentifierService', () => {
        const services = createValidationServicesForTesting();
        const testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
        const lookupKey = 'Unknown';
        const sampleValue = testItem.tryToIdentifyLookupKey(lookupKey, services);
        expect(sampleValue).toBeUndefined();
    });
    test('tryToIdentifyLookupKey should return a sample value when lookupKey has a fallback in the LookupKeyFallbackService that is in the DataTypeIdentifierService', () => { 
        const services = createValidationServicesForTesting();
        let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Number);
        expect(dti).toBeDefined();
        const expectedSampleValue = dti!.sampleValue();
        services.lookupKeyFallbackService.register('X', LookupKey.Number);

        const testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
        const lookupKey = 'X';
        const sampleValue = testItem.tryToIdentifyLookupKey(lookupKey, services);
        expect(sampleValue).toBe(expectedSampleValue);
    });
    test('tryToIdentifyLookupKey should return undefined when lookupKey has a fallback in the LookupKeyFallbackService that is not in the DataTypeIdentifierService', () => {
        const services = createValidationServicesForTesting();
        services.lookupKeyFallbackService.register('X', 'Unknown');

        const testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
        const lookupKey = 'X';
        const sampleValue = testItem.tryToIdentifyLookupKey(lookupKey, services);
        expect(sampleValue).toBeUndefined();
    });

    test('registerSampleValue should register a sample value for a lookup key', () => {
        const services = createValidationServicesForTesting();
        const testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
        const lookupKey = 'lookupKey1';
        const sampleValue = 'sampleValue1';
        testItem.registerSampleValue(lookupKey, sampleValue);
        expect(testItem.Publicify_sampleValuesCache.size).toBe(1);
        expect(testItem.Publicify_sampleValuesCache.get(lookupKey)).toBe(sampleValue);
    });
    
    describe('getSampleValue', () => {
        it('should return sample value when unknown lookupKey and known dataType on ValueHostConfig, using dataType to select DataTypeIdentifier.', () => {
            const services = createValidationServicesForTesting();
            let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Number);
            expect(dti).toBeDefined();
            const expectedSampleValue = dti!.sampleValue();

            // no lookupKeyFallbacks
            // one ValueHost with dataType LookupKey.Number, which has a matching DataTypeIdentifier
            // no options
            // expect the DataType and value to become registered
            let testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1', dataType: LookupKey.Number };

            const sampleValue = testItem.getSampleValue('Unknown', valueHostConfig);
            expect(sampleValue).toBe(expectedSampleValue);
            expect(testItem.Publicify_sampleValuesCache.size).toBe(1);
            expect(testItem.Publicify_sampleValuesCache.get(LookupKey.Number)).toBe(expectedSampleValue);
        });
        it('should return sample value when known lookupKey and undefined dataType on ValueHostConfig.', () => {
            const services = createValidationServicesForTesting();
            let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Number);
            expect(dti).toBeDefined();
            const expectedSampleValue = dti!.sampleValue();
            let testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1' };

            const sampleValue = testItem.getSampleValue(LookupKey.Number, valueHostConfig);
            expect(sampleValue).toBe(expectedSampleValue);
            expect(testItem.Publicify_sampleValuesCache.size).toBe(1);
            expect(testItem.Publicify_sampleValuesCache.get(LookupKey.Number)).toBe(expectedSampleValue);
        });
        it('should return undefined when unknown lookupKey and unknown but assigned dataType on ValueHostConfig.', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1', dataType: 'Unknown1' };

            const sampleValue = testItem.getSampleValue('Unknown2', valueHostConfig);
            expect(sampleValue).toBeUndefined();
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);
        });

        it('should return sample value when unknown lookupKey is in LookupKeyFallbackService which matches a DataTypeIdentifier. The initial LookupKey is mapped to the sample value', () => {
            const services = createValidationServicesForTesting();
            let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Number);
            expect(dti).toBeDefined();
            const expectedSampleValue = dti!.sampleValue();
            services.lookupKeyFallbackService.register('X', LookupKey.Number);

            let testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1' };

            const sampleValue = testItem.getSampleValue('X', valueHostConfig);
            expect(sampleValue).toBe(expectedSampleValue);
            expect(testItem.Publicify_sampleValuesCache.size).toBe(1);
            expect(testItem.Publicify_sampleValuesCache.get('X')).toBe(expectedSampleValue);
        });

        it('With option.valueHostsSampleValues matching to the ValueHost name, should return sample value from the option when the LookupKey would also work', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, { valueHostsSampleValues: { 'valueHost1': 'sampleValue1' } } as ConfigAnalysisServiceOptions);  
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1' };
            const sampleValue = testItem.getSampleValue(LookupKey.Number, valueHostConfig);
            expect(sampleValue).toBe('sampleValue1');
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);
        });
        it('With option.valueHostsSampleValues matching to the ValueHost name, should return sample value from the option when the LookupKey would not work', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, { valueHostsSampleValues: { 'valueHost1': 'sampleValue1' } } as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1' };
            const sampleValue = testItem.getSampleValue('Unknown', valueHostConfig);
            expect(sampleValue).toBe('sampleValue1');
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);
        });
        it('With 2 option.valueHostsSampleValues matching 2 ValueHost names, each should return sample value from the option', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, { valueHostsSampleValues: { 'valueHost1': 'sampleValue1', 'valueHost2': 'sampleValue2' } } as ConfigAnalysisServiceOptions);    
            let valueHostConfig1: ValueHostConfig = { name: 'valueHost1' };
            let valueHostConfig2: ValueHostConfig = { name: 'valueHost2' };
            const sampleValue1 = testItem.getSampleValue('Unknown', valueHostConfig1);
            const sampleValue2 = testItem.getSampleValue('Unknown', valueHostConfig2);
            expect(sampleValue1).toBe('sampleValue1');
            expect(sampleValue2).toBe('sampleValue2');
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);

        });

        it('With option.lookupKeysSampleValues matching to the lookupKey, should return sample value from the option but nothing added to the cache', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, { lookupKeysSampleValues: { 'lookupKey1': 'sampleValue1' } } as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1' };
            const sampleValue = testItem.getSampleValue('lookupKey1', valueHostConfig);
            expect(sampleValue).toBe('sampleValue1');
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);
        });
        it('With option.lookupKeysSampleValues setup but not matching the lookupKey which is already known, return sample value for the lookup Key itself', () => {
            const services = createValidationServicesForTesting();
            let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Number);
            expect(dti).toBeDefined();
            const expectedSampleValue = dti!.sampleValue();

            let testItem = new Publicify_SampleValues(services, { lookupKeysSampleValues: { 'lookupKey1': 'sampleValue1' } } as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1' };
            const sampleValue = testItem.getSampleValue(LookupKey.Number, valueHostConfig);
            expect(sampleValue).toBe(expectedSampleValue);
            expect(testItem.Publicify_sampleValuesCache.size).toBe(1);
            expect(testItem.Publicify_sampleValuesCache.get(LookupKey.Number)).toBe(expectedSampleValue);
        });
        it('With option.lookupKeysSampleValues setup but not matching the lookupKey which is unknown, return undefined', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, { lookupKeysSampleValues: { 'lookupKey1': 'sampleValue1' } } as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1' };
            const sampleValue = testItem.getSampleValue('Unknown', valueHostConfig);
            expect(sampleValue).toBeUndefined();
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);
        });
        // tests with both options setup, valueHostsSampleValues will take precedence when there isa  matching ValueHost name
        it('With both options setup, valueHostsSampleValues will take precedence when there is a matching ValueHost name', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, { lookupKeysSampleValues: { 'lookupKey1': 'sampleValue1' }, valueHostsSampleValues: { 'valueHost1': 'sampleValue2' } } as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost1' };
            const sampleValue = testItem.getSampleValue('lookupKey1', valueHostConfig);
            expect(sampleValue).toBe('sampleValue2');
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);
        });
        test('With both options setup, no matching ValueHost name uses the lookup key sample value. Nothing added to cache', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, { lookupKeysSampleValues: { 'lookupKey1': 'sampleValue1' }, valueHostsSampleValues: { 'valueHost1': 'sampleValue2' } } as ConfigAnalysisServiceOptions);
            let valueHostConfig: ValueHostConfig = { name: 'valueHost2' };
            const sampleValue = testItem.getSampleValue('lookupKey1', valueHostConfig);
            expect(sampleValue).toBe('sampleValue1');
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);
        });

        // several tests with multiple options where we can find one success for each option
        test('With multiple options setup, use getSampleValue for each option to confirm everything works with a complex option configuration', () => {
            const services = createValidationServicesForTesting();
            let testItem = new Publicify_SampleValues(services, {
                lookupKeysSampleValues:
                {
                    'lookupKey1': 'sampleValue1A',
                    'lookupKey2': 'sampleValue1B',
                    'lookupKey3': 'sampleValue1C'
                },
                valueHostsSampleValues: {
                    'valueHost2A': 'sampleValue2A',
                    'valueHost2B': 'sampleValue2B',
                    'valueHost2C': 'sampleValue2C'
                    
                }
            } as ConfigAnalysisServiceOptions);
            let valueHostConfig1A: ValueHostConfig = { name: 'valueHost1A' };
            let valueHostConfig1B: ValueHostConfig = { name: 'valueHost1B' };
            let valueHostConfig1C: ValueHostConfig = { name: 'valueHost1C' };
            let valueHostConfig2A: ValueHostConfig = { name: 'valueHost2A' };
            let valueHostConfig2B: ValueHostConfig = { name: 'valueHost2B' };
            let valueHostConfig2C: ValueHostConfig = { name: 'valueHost2C' };            
            const sampleValue1A = testItem.getSampleValue('lookupKey1', valueHostConfig1A);
            const sampleValue1B = testItem.getSampleValue('lookupKey2', valueHostConfig1B);
            const sampleValue1C = testItem.getSampleValue('lookupKey3', valueHostConfig1C);
            const sampleValue2A = testItem.getSampleValue('Unknown1', valueHostConfig2A);
            const sampleValue2B = testItem.getSampleValue('Unknown2', valueHostConfig2B);
            const sampleValue2C = testItem.getSampleValue('Unknown3', valueHostConfig2C);
            expect(sampleValue1A).toBe('sampleValue1A');
            expect(sampleValue1B).toBe('sampleValue1B');
            expect(sampleValue1C).toBe('sampleValue1C');
            expect(sampleValue2A).toBe('sampleValue2A');
            expect(sampleValue2B).toBe('sampleValue2B');
            expect(sampleValue2C).toBe('sampleValue2C');
            expect(testItem.Publicify_sampleValuesCache.size).toBe(0);
            
        });
        // test multiple calls to getSampleValue without any options all contribute to the cached values
        test('Multiple calls to getSampleValue each using a known LookupKey in DataTypeIdentifier, and without any options all contribute to the cached values', () => {
            const services = createValidationServicesForTesting();
            let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Number);
            expect(dti).toBeDefined();
            const expectedNumberValue = dti!.sampleValue();
            dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.String);
            expect(dti).toBeDefined();
            const expectedStringValue = dti!.sampleValue();
            dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Boolean);
            expect(dti).toBeDefined();
            const expectedBooleanValue = dti!.sampleValue();
            dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === LookupKey.Date);
            expect(dti).toBeDefined();
            const expectedDateValue = dti!.sampleValue();

            let testItem = new Publicify_SampleValues(services, {} as ConfigAnalysisServiceOptions);
            let valueHostConfig1: ValueHostConfig = { name: 'valueHost1', dataType: LookupKey.Number };
            let valueHostConfig2: ValueHostConfig = { name: 'valueHost2', dataType: LookupKey.String };
            let valueHostConfig3: ValueHostConfig = { name: 'valueHost3', dataType: LookupKey.Boolean };
            let valueHostConfig4: ValueHostConfig = { name: 'valueHost4', dataType: LookupKey.Date };
            const sampleValue1 = testItem.getSampleValue(LookupKey.Number, valueHostConfig1);
            const sampleValue2 = testItem.getSampleValue(LookupKey.String, valueHostConfig2);
            const sampleValue3 = testItem.getSampleValue(LookupKey.Boolean, valueHostConfig3);
            const sampleValue4 = testItem.getSampleValue(LookupKey.Date, valueHostConfig4);
            expect(sampleValue1).toBe(expectedNumberValue);
            expect(sampleValue2).toBe(expectedStringValue);
            expect(sampleValue3).toBe(expectedBooleanValue);
            expect(sampleValue4).toEqual(expectedDateValue);
            expect(testItem.Publicify_sampleValuesCache.size).toBe(4);
            expect(testItem.Publicify_sampleValuesCache.get(LookupKey.Number)).toBe(expectedNumberValue);
            expect(testItem.Publicify_sampleValuesCache.get(LookupKey.String)).toBe(expectedStringValue);
            expect(testItem.Publicify_sampleValuesCache.get(LookupKey.Boolean)).toBe(expectedBooleanValue);
            expect(testItem.Publicify_sampleValuesCache.get(LookupKey.Date)).toEqual(expectedDateValue);

        });

    });
});