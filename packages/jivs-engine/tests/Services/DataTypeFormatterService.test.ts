import { populateServicesWithManyCultures } from "../TestSupport/utilities";
import { BooleanFormatter, CurrencyFormatter, NumberFormatter } from "../../src/DataTypes/DataTypeFormatters";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { IDataTypeFormatter } from "../../src/Interfaces/DataTypeFormatters";
import { DataTypeResolution } from "../../src/Interfaces/DataTypes";
import { LoggingLevel, LoggingCategory } from "../../src/Interfaces/LoggerService";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";

import { MockJivsServices } from "../TestSupport/mocks";
import { CapturingLogger } from "../../src/Support/CapturingLogger";
import { JivsServices } from "../../src/Services/JivsServices";
import { IJivsServices } from "../../src/Interfaces/JivsServices";
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
        let services = new MockJivsServices(false, false);
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
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services);
        let testItem = services.dataTypeFormatterService;
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.format({}, null, 'en')).toThrow(/LookupKey/);

        expect(logger.findMessage('Identify LookupKey from value', LoggingLevel.Debug)).toBeTruthy();

        expect(logger.findMessage('LookupKey', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });
    test('Unsupported lookupKey error', () => {
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services);
        let testItem = services.dataTypeFormatterService;

        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.format(0, 'huh', 'en')).toThrow(/No DataTypeFormatter/);
        expect(logger.findMessage('Trying cultureId', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('No DataTypeFormatter', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });

    test('Lookup Key in DataTypeFormatter en', () => {
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services, true);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        testItem.register(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey', 'en')).toEqual({ value: 'en TestKey' });
        expect(logger.findMessage('Trying cultureId: en', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Formatter selected: TestFormatter with culture "en"', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Formatted "TestKey" with culture "en"', LoggingLevel.Info)).toBeTruthy();  
    });
    test('Lookup Key in DataTypeFormatter en using fallback from en-GB', () => {
        let services = new MockJivsServices(false, true, 'en-GB');
        populateServicesWithManyCultures(services, true);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        testItem.register(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey', 'en-GB')).toEqual({ value: 'en TestKey' });

        expect(logger.findMessage('Trying cultureId: en-GB', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Trying cultureId: en', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Formatter selected: TestFormatter with culture "en"', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Formatted "TestKey" with culture "en"', LoggingLevel.Info)).toBeTruthy();  
    });
    test('Lookup Key in DataTypeFormatter en and en-GB gets from en-GB', () => {
        let services = new MockJivsServices(false, true, 'en-GB');
        populateServicesWithManyCultures(services, true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        testItem.register(new TestFormatter(['en', 'en-GB'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey', 'en-GB')).toEqual({ value: 'en-GB TestKey' });
    });
    test('Date to string using built-in localization', () => {
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services, true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        let date = new Date(2000, 0, 11);
        expect(testItem.format(date, null, 'en-GB')).toEqual({ value: '11/01/2000' });
        expect(testItem.format(date, null, 'en')).toEqual({ value: '1/11/2000' });
        expect(testItem.format(date, null, 'fr')).toEqual({ value: '11/01/2000' });
    });
    test('Number to string using built-in localization', () => {
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services, true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        let value = 4000.932;
        expect(testItem.format(value, null, 'en-GB')).toEqual({ value: '4,000.932' });
        expect(testItem.format(value, null, 'en')).toEqual({ value: '4,000.932' });
        expect(testItem.format(value, null, 'fr')).toEqual({ value: '4\u{202F}000,932' });
    });
    test('String to string using built-in localization. Expect no changes', () => {
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services, true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        let value = 'abcZYX';
        expect(testItem.format(value, null, 'en-GB')).toEqual({ value: value });
        expect(testItem.format(value, null, 'en')).toEqual({ value: value });
        expect(testItem.format(value, null, 'fr')).toEqual({ value: value });
    });
    test('Lookup Key supplied not compatible with native data type error', () => {
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services, true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        expect(testItem.format(10, LookupKey.Date, 'en').errorDetails).not.toBeUndefined();
        expect(testItem.format(10, LookupKey.Boolean, 'en').errorDetails).not.toBeUndefined();
        expect(testItem.format('10', LookupKey.Number, 'en').errorDetails).not.toBeUndefined();
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
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services, false);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        testItem.register(new FormatterThrowsError());
        expect(testItem.format(10, 'TEST', 'en')).toEqual({
            errorDetails: {
                errorMessage: 'ERROR'
            }
        });
         // LoggingLevel.Error, LoggingCategory.Service, 'DataTypeFormatterService'
        expect(logger.findMessage('Formatter selected: FormatterThrowsError', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('ERROR', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
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
        let services = new MockJivsServices(false, true);
        populateServicesWithManyCultures(services, false);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        testItem.register(new FormatterThrowsString());
        try {
            testItem.format(10, 'TEST', 'en');
            fail();
        }
        catch (e)
        {
            expect(e).toBeInstanceOf(SevereErrorBase);
            expect((e as Error).message).toBe('ERROR');
        }
        // LoggingLevel.Error, LoggingCategory.Service, 'DataTypeFormatterService'
        expect(logger.findMessage('Formatter selected: FormatterThrowsString', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('ERROR', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });
});
describe('format() using lookupKeyFallbackService', () => {
    function createJivsServices(): IJivsServices
    {
        let vs = new JivsServices('en');
        let dtfs = new DataTypeFormatterService();
        vs.dataTypeFormatterService = dtfs;

        dtfs.register(new NumberFormatter());   // lookupKey.Number
        dtfs.register(new CurrencyFormatter('USD')); // lookupKey.Currency

        return vs;
    }

    test('Integer datatype uses NumberFormatter', () => {
        let services = createJivsServices();
        let logger = new CapturingLogger();
        services.loggerService = logger;
        logger.minLevel = LoggingLevel.Debug;

        // default contains Integer->Number
        let dtfs = services.dataTypeFormatterService;
        let result = dtfs.format(1, LookupKey.Integer, 'en');
        expect(result.value).toEqual('1');
        expect(logger.findMessage('Trying fallback', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Formatter selected: NumberFormatter with culture "en"', LoggingLevel.Debug)).toBeTruthy();        
        expect(logger.findMessage('Formatted "Number" with culture "en"', LoggingLevel.Info)).toBeTruthy();  
    });
    test('Custom currency type falls back to Currency', () => {
        let services = createJivsServices();
        let lkfb = services.lookupKeyFallbackService;
        lkfb.register('CUSTOMA', LookupKey.Currency);
        lkfb.register('CUSTOMB', 'CUSTOMA');        
        let logger = new CapturingLogger();
        services.loggerService = logger;
        logger.minLevel = LoggingLevel.Debug;

        // default contains Integer->Number
        let dtfs = services.dataTypeFormatterService;
        let result = dtfs.format(1, 'CUSTOMB', 'en');
        expect(result.value).toEqual('$1.00');
        expect(logger.findMessage('Trying fallback: CUSTOMA', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Trying fallback: Currency', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Formatter selected: CurrencyFormatter with culture "en"', LoggingLevel.Debug)).toBeTruthy();        
        expect(logger.findMessage('Formatted "Currency" with culture "en"', LoggingLevel.Info)).toBeTruthy();        
    });    
    test('Fallback loop stopped with exception', () => {
        let services = createJivsServices();
        let lkfb = services.lookupKeyFallbackService;
        lkfb.register('CUSTOMA', 'CUSTOMB');
        lkfb.register('CUSTOMB', 'CUSTOMA');        
        let logger = new CapturingLogger();
        services.loggerService = logger;
        logger.minLevel = LoggingLevel.Debug;

        // default contains Integer->Number
        let dtfs = services.dataTypeFormatterService;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = dtfs.format(1, 'CUSTOMB', 'en')).toThrow(/loop involving CUSTOMB/);
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
        let services = new MockJivsServices(false, false);
        let testItem = new DataTypeFormatterService();
        let formatter = new NumberFormatter();
        testItem.register(formatter);
        expect(() => formatter.services).toThrow();
        testItem.services = services;
        expect(formatter.services).toBe(services);
    });    
});

describe('lazyLoad', () => {
    class NormalFormatter implements IDataTypeFormatter
    {
        supports(dataTypeLookupKey: string, cultureId: string): boolean {
            return dataTypeLookupKey === 'Normal';
        }
        format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
            throw new Error("Method not implemented.");
        }

        
    }
    class LazyLoadFormatter implements IDataTypeFormatter
    {
        supports(dataTypeLookupKey: string, cultureId: string): boolean {
            return dataTypeLookupKey === 'LazyLoad';
        }
        format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
            throw new Error("Method not implemented.");
        }
    }    
    test('Call to register does not lazy load', () => {
        let testItem = new DataTypeFormatterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadFormatter());
            loaded = true;
        };
        testItem.register(new NormalFormatter());
        expect(loaded).toBe(false);
    });
    test('Call to find for already registered does not lazy load', () => {
        let testItem = new DataTypeFormatterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadFormatter());
            loaded = true;
        };
        testItem.register(new NormalFormatter());
        expect(loaded).toBe(false);
        expect(testItem.find('Normal', 'en')).toBeInstanceOf(NormalFormatter);
        expect(loaded).toBe(false);
 
    });
    test('Call to find for unregistered does load but later find does not load for unregistered', () => {
        let testItem = new DataTypeFormatterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadFormatter());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.find('LazyLoad', 'en')).toBeInstanceOf(LazyLoadFormatter);
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.find('Normal', 'en')).toBeNull();      //  not registered
        expect(loaded).toBe(false);
    });
    test('Call to find for unregistered does load but fails to load what it needs but has loaded one we use later', () => {
        let testItem = new DataTypeFormatterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadFormatter());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.find('Normal', 'en')).toBeNull();      // not registered
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.find('LazyLoad', 'en')).toBeInstanceOf(LazyLoadFormatter);
        expect(loaded).toBe(false);
    });    
});