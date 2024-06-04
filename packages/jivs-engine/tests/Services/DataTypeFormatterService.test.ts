import { populateServicesWithManyCultures } from "../TestSupport/utilities";
import { BooleanFormatter, CurrencyFormatter, NumberFormatter } from "../../src/DataTypes/DataTypeFormatters";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { IDataTypeFormatter } from "../../src/Interfaces/DataTypeFormatters";
import { DataTypeResolution } from "../../src/Interfaces/DataTypes";
import { LoggingLevel, LoggingCategory } from "../../src/Interfaces/LoggerService";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";

import { MockValidationServices } from "../TestSupport/mocks";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { SevereErrorBase } from "../../src/Utilities/ErrorHandling";


class TestFormatter implements IDataTypeFormatter {
    constructor(supportedCultureIds: Array<string>, valueToReturn?: string) {
        this._valueToReturn = valueToReturn ?? 'EN TestKey';
        this._supportedCultureIds = supportedCultureIds ?? ['en'];
    }
    private _valueToReturn: string;
    private _supportedCultureIds: Array<string>;

    supports(dataTypeLookupKey: string, cultureId: string): boolean {
        return this._supportedCultureIds.includes(cultureId);
    }
    format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        return { value: `${cultureId} TestKey` };
    }

}

describe('DataTypeFormatterServices constructor and properties', () => {

    test('Constructor with no parameters', () => {
        let testItem = new DataTypeFormatterService();
        expect(() => testItem.services).toThrow(/Assign/);

    });

    test('Attach Services returns the same instance', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new DataTypeFormatterService();
        expect(() => testItem.services = services).not.toThrow();
        let x: any;
        expect(() => x = testItem.services).not.toThrow();
        expect(x).toBe(services);
    });
});

// format(value: any, lookupKey?: string): DataTypeResolution<string>
describe('DataTypeFormatterService.format', () => {
    test('No lookupKey not resolved. Logs an error and returns an error message', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en');
        let testItem = services.dataTypeFormatterService;
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.format({})).toThrow(/LookupKey/);

        expect(logger.findMessage('Identify LookupKey from value', LoggingLevel.Debug, LoggingCategory.Service, 'DataTypeFormatterService')).not.toBeNull();

        expect(logger.findMessage('LookupKey', LoggingLevel.Error, LoggingCategory.Service, 'DataTypeFormatterService')).not.toBeNull();
    });
    test('Unsupported lookupKey error', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en');
        let testItem = services.dataTypeFormatterService;

        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.format(0, 'huh')).toThrow(/No DataTypeFormatter/);
        expect(logger.findMessage('Trying cultureId', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('No DataTypeFormatter', LoggingLevel.Error, LoggingCategory.Service, 'DataTypeFormatterService')).not.toBeNull();
    });

    test('Lookup Key in DataTypeFormatter en', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', true);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        testItem.register(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey')).toEqual({ value: 'en TestKey' });
        expect(logger.findMessage('Trying cultureId: en', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Formatter selected: TestFormatter with culture "en"', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Formatted "TestKey" with culture "en"', LoggingLevel.Info, null, null)).not.toBeNull();  
    });
    test('Lookup Key in DataTypeFormatter en using fallback from en-GB', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en-GB', true);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        testItem.register(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey')).toEqual({ value: 'en TestKey' });

        expect(logger.findMessage('Trying cultureId: en-GB', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Trying cultureId: en', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Formatter selected: TestFormatter with culture "en"', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Formatted "TestKey" with culture "en"', LoggingLevel.Info, null, null)).not.toBeNull();  
    });
    test('Lookup Key in DataTypeFormatter en and en-GB gets from en-GB', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en-GB', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        testItem.register(new TestFormatter(['en', 'en-GB'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey')).toEqual({ value: 'en-GB TestKey' });
    });
    test('Date to string using built-in localization', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        let date = new Date(2000, 0, 11);
        testItem.services.cultureService.activeCultureId = 'en-GB';
        expect(testItem.format(date)).toEqual({ value: '11/01/2000' });
        testItem.services.cultureService.activeCultureId = 'en';
        expect(testItem.format(date)).toEqual({ value: '1/11/2000' });
        testItem.services.cultureService.activeCultureId = 'fr';
        expect(testItem.format(date)).toEqual({ value: '11/01/2000' });
    });
    test('Number to string using built-in localization', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        let value = 4000.932;
        testItem.services.cultureService.activeCultureId = 'en-GB';
        expect(testItem.format(value)).toEqual({ value: '4,000.932' });
        testItem.services.cultureService.activeCultureId = 'en';
        expect(testItem.format(value)).toEqual({ value: '4,000.932' });
        testItem.services.cultureService.activeCultureId = 'fr';
        expect(testItem.format(value)).toEqual({ value: '4\u{202F}000,932' });
    });
    test('String to string using built-in localization. Expect no changes', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        let value = 'abcZYX';
        testItem.services.cultureService.activeCultureId = 'en-GB';
        expect(testItem.format(value)).toEqual({ value: value });
        testItem.services.cultureService.activeCultureId = 'en';
        expect(testItem.format(value)).toEqual({ value: value });
        testItem.services.cultureService.activeCultureId = 'fr';
        expect(testItem.format(value)).toEqual({ value: value });
    });
    test('Lookup Key supplied not compatible with native data type error', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        expect(testItem.format(10, LookupKey.Date).errorMessage).not.toBeUndefined();
        expect(testItem.format(10, LookupKey.Boolean).errorMessage).not.toBeUndefined();
        expect(testItem.format('10', LookupKey.Number).errorMessage).not.toBeUndefined();
    });
    test('Formatter throws Error. results in errorMessage with exception message', () => {
        class FormatterThrowsError implements IDataTypeFormatter
        {
            supports(dataTypeLookupKey: string, cultureId: string): boolean {
                return dataTypeLookupKey === 'TEST';
            }
            format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
                throw new Error("ERROR");
            }
        }
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', false);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        testItem.register(new FormatterThrowsError());
        expect(testItem.format(10, 'TEST').errorMessage).toBe('ERROR');
         // LoggingLevel.Error, LoggingCategory.Service, 'DataTypeFormatterService'
        expect(logger.findMessage('Formatter selected: FormatterThrowsError', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('ERROR', LoggingLevel.Error, LoggingCategory.Service, 'DataTypeFormatterService')).not.toBeNull();
    });
    test('Formatter throws string. results throwing exception using the string as the error message', () => {
        class FormatterThrowsString implements IDataTypeFormatter
        {
            supports(dataTypeLookupKey: string, cultureId: string): boolean {
                return dataTypeLookupKey === 'TEST';
            }
            format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
                throw "ERROR";
            }
        }
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', false);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        testItem.register(new FormatterThrowsString());
        try {
            testItem.format(10, 'TEST');
            fail();
        }
        catch (e)
        {
            expect(e).toBeInstanceOf(SevereErrorBase);
            expect((e as Error).message).toBe('ERROR');
        }
        // LoggingLevel.Error, LoggingCategory.Service, 'DataTypeFormatterService'
        expect(logger.findMessage('Formatter selected: FormatterThrowsString', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('ERROR', LoggingLevel.Error, LoggingCategory.Service, 'DataTypeFormatterService')).not.toBeNull();
    });
});
describe('format() using lookupKeyFallbackService', () => {
    function createValidationServices(): IValidationServices
    {
        let vs = new ValidationServices();
        vs.cultureService.activeCultureId = 'en';
        let dtfs = new DataTypeFormatterService();
        vs.dataTypeFormatterService = dtfs;

        dtfs.register(new NumberFormatter());   // lookupKey.Number
        dtfs.register(new CurrencyFormatter('USD')); // lookupKey.Currency

        return vs;
    }

    test('Integer datatype uses NumberFormatter', () => {
        let services = createValidationServices();
        let logger = new CapturingLogger();
        services.loggerService = logger;
        logger.minLevel = LoggingLevel.Debug;

        // default contains Integer->Number
        let dtfs = services.dataTypeFormatterService;
        let result = dtfs.format(1, LookupKey.Integer);
        expect(result.value).toEqual('1');
        expect(logger.findMessage('Trying fallback', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Formatter selected: NumberFormatter with culture "en"', LoggingLevel.Debug, null, null)).not.toBeNull();        
        expect(logger.findMessage('Formatted "Number" with culture "en"', LoggingLevel.Info, null, null)).not.toBeNull();  
    });
    test('Custom currency type falls back to Currency', () => {
        let services = createValidationServices();
        let lkfb = services.lookupKeyFallbackService;
        lkfb.register('CUSTOMA', LookupKey.Currency);
        lkfb.register('CUSTOMB', 'CUSTOMA');        
        let logger = new CapturingLogger();
        services.loggerService = logger;
        logger.minLevel = LoggingLevel.Debug;

        // default contains Integer->Number
        let dtfs = services.dataTypeFormatterService;
        let result = dtfs.format(1, 'CUSTOMB');
        expect(result.value).toEqual('$1.00');
        expect(logger.findMessage('Trying fallback: CUSTOMA', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Trying fallback: Currency', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Formatter selected: CurrencyFormatter with culture "en"', LoggingLevel.Debug, null, null)).not.toBeNull();        
        expect(logger.findMessage('Formatted "Currency" with culture "en"', LoggingLevel.Info, null, null)).not.toBeNull();        
    });    
    test('Fallback loop stopped with exception', () => {
        let services = createValidationServices();
        let lkfb = services.lookupKeyFallbackService;
        lkfb.register('CUSTOMA', 'CUSTOMB');
        lkfb.register('CUSTOMB', 'CUSTOMA');        
        let logger = new CapturingLogger();
        services.loggerService = logger;
        logger.minLevel = LoggingLevel.Debug;

        // default contains Integer->Number
        let dtfs = services.dataTypeFormatterService;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = dtfs.format(1, 'CUSTOMB')).toThrow(/loop involving CUSTOMB/);
    });        
    
});
describe('DataTypeFormatterServices register, unregister, and find', () => {
    test('register and find registered returns the same Formatter class', () => {
        let testItem = new DataTypeFormatterService();
        expect(() => testItem.register(new NumberFormatter())).not.toThrow();
        expect(testItem.find(LookupKey.Number, 'en')).toBeInstanceOf(NumberFormatter);
    });
    test('register and find registered but with culture not setup results in null', () => {
        let testItem = new DataTypeFormatterService();
        expect(() => testItem.register(new TestFormatter(['en']))).not.toThrow();
        expect(testItem.find(LookupKey.Number, 'fr')).toBeNull();
    });
    test('register with multiple cultures and find registered returns the same Formatter class', () => {
        let testItem = new DataTypeFormatterService();
        let formatter = new TestFormatter(['en', 'fr', 'en-GB']);
        testItem.register(formatter);
        expect(testItem.find(LookupKey.Number, 'en')).toBe(formatter);
        expect(testItem.find(LookupKey.Number, 'fr')).toBe(formatter);
        expect(testItem.find(LookupKey.Number, 'en-GB')).toBe(formatter);
        expect(testItem.find(LookupKey.Number, 'de')).toBeNull();
    });    
    test('register formatter for individual cultures and find registered returns the same Formatter class', () => {
        let testItem = new DataTypeFormatterService();
        let formatterEN = new TestFormatter(['en']);
        let formatterFR = new TestFormatter(['fr']);
        let formatterGB = new TestFormatter(['en-GB']);
        testItem.register(formatterEN);
        testItem.register(formatterFR);
        testItem.register(formatterGB);        
        expect(testItem.find(LookupKey.Number, 'en')).toBe(formatterEN);
        expect(testItem.find(LookupKey.Number, 'fr')).toBe(formatterFR);
        expect(testItem.find(LookupKey.Number, 'en-GB')).toBe(formatterGB);
        expect(testItem.find(LookupKey.Number, 'de')).toBeNull();
    });        
    test('find when not registered returns null', () => {
        let testItem = new DataTypeFormatterService();
        expect(testItem.find('Anything', 'en')).toBeNull();
        testItem.register(new NumberFormatter());
        expect(testItem.find('Anything', 'en')).toBeNull();
    });

    test('unregister', () => {
        let testItem = new DataTypeFormatterService();
        testItem.register(new NumberFormatter());
        testItem.register(new BooleanFormatter(LookupKey.Boolean));
        expect(testItem.unregister(LookupKey.Number, 'en')).toBe(true);
        expect(testItem.unregister(LookupKey.Number, 'en')).toBe(false);
        expect(testItem.unregister(LookupKey.Boolean, 'en')).toBe(true);
        expect(testItem.unregister(LookupKey.Boolean, 'en')).toBe(false);
    });
    test('Invalid parameters', () => {
        let testItem = new DataTypeFormatterService();
        expect(() => testItem.register(null!)).toThrow(/item/);
    });    
    test('Attach Services after register assigns service to existing registered formatters', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new DataTypeFormatterService();
        let formatter = new NumberFormatter();
        testItem.register(formatter);
        expect(() => formatter.services).toThrow();
        testItem.services = services;
        expect(formatter.services).toBe(services);
    });    
});