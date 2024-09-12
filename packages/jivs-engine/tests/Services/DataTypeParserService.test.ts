import { populateServicesWithManyCultures } from "../TestSupport/utilities";
import { CurrencyParser, NumberParser } from "../../src/DataTypes/DataTypeParsers";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { IDataTypeParser } from "../../src/Interfaces/DataTypeParsers";
import { DataTypeResolution } from "../../src/Interfaces/DataTypes";
import { LoggingLevel, LoggingCategory } from "../../src/Interfaces/LoggerService";
import { DataTypeParserService } from "../../src/Services/DataTypeParserService";

import { MockValidationServices } from "../TestSupport/mocks";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { SevereErrorBase } from "../../src/Utilities/ErrorHandling";


class TestParser<TDataType> implements IDataTypeParser<TDataType> {
    constructor(supportedLookupKey: string, supportedCultureIds: Array<string> | null,
        returnThis: DataTypeResolution<TDataType | null>
    ) {
        this._supportedLookupKey = supportedLookupKey;
        this._supportedCultureIds = supportedCultureIds ?? ['en'];
        this._returnThis = returnThis;
    }
    supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
       return this.isCompatible(dataTypeLookupKey, cultureId);
    }
    parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<TDataType | null> {
        return this._returnThis;
    }

    private _supportedLookupKey: string;
    private _supportedCultureIds: Array<string> | null;
    private _returnThis: DataTypeResolution<TDataType | null>;

    isCompatible(dataTypeLookupKey: string, cultureId: string): boolean {
        return dataTypeLookupKey === this._supportedLookupKey &&
            (!this._supportedCultureIds || this._supportedCultureIds.includes(cultureId));
    }    
}

describe('DataTypeParserServices constructor and properties', () => {

    test('Constructor with no parameters', () => {
        let testItem = new DataTypeParserService();
        expect(() => testItem.services).toThrow(/Assign/);
    });

    test('Attach Services returns the same instance', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new DataTypeParserService();
        expect(() => testItem.services = services).not.toThrow();
        let x: any;
        expect(() => x = testItem.services).not.toThrow();
        expect(x).toBe(services);
    });
});

// parse(value: any, lookupKey?: string): DataTypeResolution<string>
describe('DataTypeParserService.parse', () => {
    test('Null LookupKey throws', () => {
        let services = new MockValidationServices(false, true);
        let testItem = services.dataTypeParserService;

        expect(() => testItem.parse('abc', null!, 'en')).toThrow(/lookupKey/);
    });
    test('EmptyString LookupKey throws', () => {
        let services = new MockValidationServices(false, true);
        let testItem = services.dataTypeParserService;

        expect(() => testItem.parse('abc', '', 'en')).toThrow(/lookupKey/);
    });    
    test('When no registered parsers, throws No DataTypeParser for lookupKey error and logs', () => {
        let services = new MockValidationServices(false, true);
        let testItem = services.dataTypeParserService;

        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.parse('', 'huh', 'en')).toThrow(/No DataTypeParser/);
        expect(logger.findMessage('No DataTypeParser', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });

    test('Parameters find a parser with same lookup key and culture plus logs', () => {
        let services = new MockValidationServices(false, true);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = services.dataTypeParserService as DataTypeParserService;

        let expectedResult: DataTypeResolution<string> = { value: 'RESULT' };
        testItem.register(new TestParser('TestKey', ['en'], expectedResult));
        expect(testItem.parse('RESULT', 'TestKey', 'en')).toEqual(expectedResult);
        expect(logger.findMessage('Parser selected', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Parsed "TestKey" with culture "en"', LoggingLevel.Info)).toBeTruthy();  
    });

    test('Parser throws Error. results in errorMessage with exception message', () => {
        class ParserThrowsError implements IDataTypeParser<string>
        {
            supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
                return this.isCompatible(dataTypeLookupKey, cultureId);
            }
            isCompatible(dataTypeLookupKey: string, cultureId: string): boolean {
                return dataTypeLookupKey === 'TEST';
            }
            parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string | null> {
                throw new Error('ERROR');
            }
        }
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', false);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = services.dataTypeParserService as DataTypeParserService;
        testItem.register(new ParserThrowsError());
        expect(testItem.parse('anything', 'TEST', 'does not matter').errorMessage).toBe('ERROR');
         // LoggingLevel.Error, LoggingCategory.Service, 'DataTypeParserService'
        expect(logger.findMessage('Parser selected: ParserThrowsError', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('ERROR', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });
    test('Parser throws string. results throwing exception using the string as the error message', () => {
        class ParserThrowsString implements IDataTypeParser<string>
        {
            supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
                return this.isCompatible(dataTypeLookupKey, cultureId);
            }
            isCompatible(dataTypeLookupKey: string, cultureId: string): boolean {
                return dataTypeLookupKey === 'TEST';
            }
            parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string | null> {
                throw 'ERROR';
            }
        }
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', false);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let testItem = services.dataTypeParserService as DataTypeParserService;
        testItem.register(new ParserThrowsString());
        try {
            testItem.parse('anything', 'TEST', 'does not matter');
            fail();
        }
        catch (e)
        {
            expect(e).toBeInstanceOf(SevereErrorBase);
            expect((e as Error).message).toBe('ERROR');
        }
        // LoggingLevel.Error, LoggingCategory.Service, 'DataTypeParserService'
        expect(logger.findMessage('Parser selected: ParserThrowsString', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('ERROR', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });
    test('With registered parsers but a lookup key that does not match, throws Unsupported lookupKey error and logs', () => {
        let services = new MockValidationServices(false, true);
        let testItem = services.dataTypeParserService;
        testItem.register(new TestParser('TEST', ['en'], { value: 'abc'}));

        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.parse('', 'huh', 'en')).toThrow(/No DataTypeParser/);
        expect(logger.findMessage('No DataTypeParser', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });    
    test('With registered parsers and matching lookup key but no match to cultureId, throws Unsupported lookupKey error and logs', () => {
        let services = new MockValidationServices(false, true);
        let testItem = services.dataTypeParserService;
        testItem.register(new TestParser('TEST', ['en'], { value: 'abc'}));

        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.parse('', 'TEST', 'en-GB')).toThrow(/No DataTypeParser/);
        expect(logger.findMessage('No DataTypeParser', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });        
});
describe('parse() using lookupKeyFallbackService', () => {
    function createValidationServices(): IValidationServices
    {
        let vs = new ValidationServices();
        vs.cultureService.activeCultureId = 'en';
        let dtfs = new DataTypeParserService();
        vs.dataTypeParserService = dtfs;

        dtfs.register(new NumberParser(['en'], {decimalSeparator: '.', negativeSymbol: '-'}));   // lookupKey.Number
        dtfs.register(new CurrencyParser(['en'], {decimalSeparator: '.', negativeSymbol: '-', currencySymbol: 'USD'})); // lookupKey.Currency

        return vs;
    }

    test('Integer datatype uses NumberParser', () => {
        let services = createValidationServices();
        let logger = new CapturingLogger();
        services.loggerService = logger;
        logger.minLevel = LoggingLevel.Debug;

        // default contains Integer->Number
        let dtfs = services.dataTypeParserService;
        let result = dtfs.parse('1', LookupKey.Integer, 'en');
        expect(result.value).toEqual(1);
        expect(logger.findMessage('Trying fallback', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Parser selected: NumberParser', LoggingLevel.Debug)).toBeTruthy();        
        expect(logger.findMessage('Parsed "Number" with culture "en"', LoggingLevel.Info)).toBeTruthy();  
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
        let dtfs = services.dataTypeParserService;
        let result = dtfs.parse('1', 'CUSTOMB', 'en');
        expect(result.value).toBeDefined();
        expect(logger.findMessage('Trying fallback: CUSTOMA', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Trying fallback: Currency', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Parser selected: CurrencyParser', LoggingLevel.Debug)).toBeTruthy();        
        expect(logger.findMessage('Parsed "Currency" with culture "en"', LoggingLevel.Info)).toBeTruthy();        
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
        let dtfs = services.dataTypeParserService;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = dtfs.parse('1', 'CUSTOMB', 'en')).toThrow(/loop involving CUSTOMB/);
    });        
    
});
describe('DataTypeParserServices register and find', () => {
    test('register and find registered returns the same Parser class', () => {
        let testItem = new DataTypeParserService();
        expect(() => testItem.register(new NumberParser(['en'], { decimalSeparator: '.', negativeSymbol: '-'}))).not.toThrow();
        expect(testItem.find(LookupKey.Number, 'en', '1')).toBeInstanceOf(NumberParser);
    });
    test('register with multiple cultures and find registered returns the same Parser class', () => {
        let testItem = new DataTypeParserService();
        expect(() => testItem.register(new NumberParser(['en', 'fr', 'en-GB'], { decimalSeparator: '.', negativeSymbol: '-'}))).not.toThrow();
        expect(testItem.find(LookupKey.Number, 'en', '1')).toBeInstanceOf(NumberParser);
        expect(testItem.find(LookupKey.Number, 'fr', '1')).toBeInstanceOf(NumberParser);
        expect(testItem.find(LookupKey.Number, 'en-GB', '1')).toBeInstanceOf(NumberParser);
        expect(testItem.find(LookupKey.Number, 'de', '1')).toBeNull();        
    });    
    test('register NumberParser for individual cultures and find registered returns the same Parser class', () => {
        let testItem = new DataTypeParserService();
        let parserEN = new NumberParser(['en'], { decimalSeparator: '.', negativeSymbol: '-' });
        let parserFR = new NumberParser(['fr'], { decimalSeparator: ',', negativeSymbol: '-' });
        let parserGB = new NumberParser(['en-GB'], { decimalSeparator: '.', negativeSymbol: '-' });

        testItem.register(parserEN);
        testItem.register(parserFR);
        testItem.register(parserGB);
        expect(testItem.find(LookupKey.Number, 'en', '1')).toBe(parserEN);
        expect(testItem.find(LookupKey.Number, 'fr', '1')).toBe(parserFR);
        expect(testItem.find(LookupKey.Number, 'en-GB', '1')).toBe(parserGB);
        expect(testItem.find(LookupKey.Number, 'de', '1')).toBeNull();        
    });        
    test('register and find registered but with culture not setup results in null', () => {
        let testItem = new DataTypeParserService();
        expect(() => testItem.register(new TestParser('TestKey', ['en'], {}))).not.toThrow();
        expect(testItem.find(LookupKey.Number, 'fr', '1')).toBeNull();
    });
    test('find when not registered returns null', () => {
        let testItem = new DataTypeParserService();
        expect(testItem.find('Anything', 'en', 'text')).toBeNull();
        testItem.register(new NumberParser(['en'], { decimalSeparator: '.', negativeSymbol: '-' }));
        expect(testItem.find('Anything', 'en', 'text')).toBeNull();
    });

    test('Invalid parameters', () => {
        let testItem = new DataTypeParserService();
        expect(() => testItem.register(null!)).toThrow(/item/);
    });    
});

describe('lazyLoad', () => {
    class NormalParser implements IDataTypeParser<any>
    {
        supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
            return dataTypeLookupKey === 'Normal';
        }
        parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<any> {
            throw new Error("Method not implemented.");
        }
        isCompatible(dataTypeLookupKey: string, cultureId: string): boolean {
            return dataTypeLookupKey === 'Normal';
        };
    }
    class LazyLoadParser implements IDataTypeParser<any>
    {
        supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
            return dataTypeLookupKey === 'LazyLoad';
        }
        parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<any> {
            throw new Error("Method not implemented.");
        }
        isCompatible(dataTypeLookupKey: string, cultureId: string): boolean {
            return dataTypeLookupKey === 'LazyLoad';
        };
    }    
    test('Call to register does not lazy load', () => {
        let tls = new DataTypeParserService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadParser());
            loaded = true;
        };
        tls.register(new NormalParser());
        expect(loaded).toBe(false);
    });
    test('Call to find for already registered does not lazy load', () => {
        let tls = new DataTypeParserService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadParser());
            loaded = true;
        };
        tls.register(new NormalParser());
        expect(loaded).toBe(false);
        expect(tls.find('Normal', 'en', '')).toBeInstanceOf(NormalParser);
        expect(loaded).toBe(false);
 
    });
    test('Call to find for unregistered does load but later find does not load for unregistered', () => {
        let tls = new DataTypeParserService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadParser());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(tls.find('LazyLoad', 'en', '')).toBeInstanceOf(LazyLoadParser);
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(tls.find('Normal', 'en', '')).toBeNull();      // not registered
        expect(loaded).toBe(false);
    });
    test('Call to find for unregistered does load but fails to load what it needs but has loaded one we use later', () => {
        let tls = new DataTypeParserService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadParser());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(tls.find('Normal', 'en', '')).toBeNull();      // not registered
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(tls.find('LazyLoad', 'en', '')).toBeInstanceOf(LazyLoadParser);
        expect(loaded).toBe(false);
    });    
});