import { BooleanFormatter, NumberFormatter } from "../../src/DataTypes/DataTypeFormatters";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { CultureIdFallback } from "../../src/Interfaces/DataTypeFormatterService";
import { IDataTypeFormatter } from "../../src/Interfaces/DataTypeFormatters";
import { DataTypeResolution } from "../../src/Interfaces/DataTypes";
import { LoggingLevel, LoggingCategory } from "../../src/Interfaces/LoggerService";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { registerDataTypeIdentifiers, registerDataTypeFormatters } from "../../starter_code/create_services";
import { MockCapturingLogger, MockValidationServices } from "../Mocks";

export function populateServicesWithManyCultures(services: MockValidationServices, activeCultureId: string, registerFormatters: boolean = false): void {
    services.activeCultureId = activeCultureId;

    let dtis = new DataTypeIdentifierService();
    services.dataTypeIdentifierService = dtis;

    registerDataTypeIdentifiers(dtis);   // always
    if (registerFormatters) {
        let ccs = createCultureIdFallbacksForEn();
        let dtfs = new DataTypeFormatterService(ccs);
        services.dataTypeFormatterService = dtfs;
        dtfs.services = services;
        registerDataTypeFormatters(dtfs);
    }

}

function createCultureIdFallbacksForEn(): Array<CultureIdFallback> {
    return [
        {
            cultureId: 'en',
            fallbackCultureId: null
        },
        {
            cultureId: 'fr',
            fallbackCultureId: 'en'
        },
        {
            cultureId: 'fr-FR',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'en-US',
            fallbackCultureId: 'en'
        },
        {
            cultureId: 'en-GB',
            fallbackCultureId: 'en-US'
        },
    ];
}
function createCultureIdFallbacksForFR(): Array<CultureIdFallback> {
    return [
        {
            cultureId: 'fr',
            fallbackCultureId: null
        },
        {
            cultureId: 'en',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'fr-FR',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'en-US',
            fallbackCultureId: 'en'
        },

    ];
}
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

    class Publicify_DataTypeFormatterService extends DataTypeFormatterService {
        constructor(cultureConfig?: Array<CultureIdFallback> | null) {
            super(cultureConfig);
        }
        public get exposedCultureIdFallback(): Array<CultureIdFallback> {
            return this.cultureIdFallback;
        }
        public exposedGetCultureIdFallback(cultureId: string): CultureIdFallback | null {
            return this.getCultureIdFallback(cultureId);
        }
    }
    test('Constructor with no parameters', () => {
        let testItem = new Publicify_DataTypeFormatterService();
        expect(() => testItem.services).toThrow(/Assign/);
        expect(() => testItem.exposedCultureIdFallback).toThrow(/CultureIdFallback/);
    });

    test('Attach Services returns the same instance', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new Publicify_DataTypeFormatterService();
        expect(() => testItem.services = services).not.toThrow();
        let x: any;
        expect(() => x = testItem.services).not.toThrow();
        expect(x).toBe(services);
        expect(testItem.exposedCultureIdFallback).toEqual([{
            cultureId: 'en'
        }]);
    });
    test('Change activeCultureID in Services impacts cultureIdFallback', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new Publicify_DataTypeFormatterService();
        services.activeCultureId = 'fr';
        testItem.services = services;

        expect(testItem.exposedCultureIdFallback).toEqual([{
            cultureId: 'fr'
        }]);
    });
    test('Constructor with Culture Fallbacks can retrieve the fr Culture Fallback', () => {
        let ccs: Array<CultureIdFallback> = [
            {
                cultureId: 'en',
                fallbackCultureId: null
            },
            {
                cultureId: 'fr',
                fallbackCultureId: 'en'
            }
        ];
        let services = new MockValidationServices(false, false);
        let testItem = new Publicify_DataTypeFormatterService(ccs);
        testItem.services = services;

        expect(testItem.exposedCultureIdFallback).toEqual(ccs);
        services.activeCultureId = 'fr';
        expect(testItem.exposedGetCultureIdFallback('fr')).toEqual({
            cultureId: 'fr',
            fallbackCultureId: 'en'
        });
    });
});

describe('DataTypeFormatterServices.getClosestCultureId', () => {
    describe('getClosestCultureId with en as final fallback', () => {
        test('Various', () => {
            let ccs = createCultureIdFallbacksForEn();
            let testItem = new DataTypeFormatterService(ccs);
            expect(testItem.getClosestCultureId('en')).toBe('en');
            expect(testItem.getClosestCultureId('fr')).toBe('fr');
            expect(testItem.getClosestCultureId('fr-FR')).toBe('fr-FR');
            expect(testItem.getClosestCultureId('en-US')).toBe('en-US');
            expect(testItem.getClosestCultureId('fr-CA')).toBe('fr');
            expect(testItem.getClosestCultureId('en-MX')).toBe('en');
            expect(testItem.getClosestCultureId('de')).toBeNull();
            expect(testItem.getClosestCultureId('de-DE')).toBeNull();
        });
    });
    describe('getClosestCultureId with fr as final fallback', () => {
        test('Various', () => {
            let ccs = createCultureIdFallbacksForFR();
            let testItem = new DataTypeFormatterService(ccs);
            expect(testItem.getClosestCultureId('fr')).toBe('fr');
            expect(testItem.getClosestCultureId('fr-FR')).toBe('fr-FR');
            expect(testItem.getClosestCultureId('en-US')).toBe('en-US');
            expect(testItem.getClosestCultureId('fr-CA')).toBe('fr');
            expect(testItem.getClosestCultureId('en-MX')).toBe('en');
            expect(testItem.getClosestCultureId('de')).toBeNull();
            expect(testItem.getClosestCultureId('de-DE')).toBeNull();
        });
    });
});

// format(value: any, lookupKey?: string): DataTypeResolution<string>
describe('DataTypeFormatterService.format', () => {
    test('No lookupKey not resolved. Logs an error and returns an error message', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en');
        let testItem = services.dataTypeFormatterService;
        let logger = services.loggerService as MockCapturingLogger;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.format({})).not.toThrow();
        expect(result).not.toBeNull();
        expect(result!.value).toBeUndefined();
        expect(result!.errorMessage).toMatch(/LookupKey/);
        expect(logger.findMessage('LookupKey', LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService')).not.toBeNull();
    });
    test('Unsupported lookupKey error', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en');
        let testItem = services.dataTypeFormatterService;

        let logger = services.loggerService as MockCapturingLogger;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.format(0, 'huh')).not.toThrow();
        expect(result).not.toBeNull();
        expect(result!.value).toBeUndefined();
        expect(result!.errorMessage).toMatch(/LookupKey/);
        expect(logger.findMessage('LookupKey', LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService')).not.toBeNull();
    });

    test('Lookup Key in DataTypeFormatter en', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        testItem.register(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey')).toEqual({ value: 'en TestKey' });
    });
    test('Lookup Key in DataTypeFormatter en using fallback from en-GB', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en-GB', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        testItem.register(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey')).toEqual({ value: 'en TestKey' });
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
        testItem.services.activeCultureId = 'en-GB';
        expect(testItem.format(date)).toEqual({ value: '11/01/2000' });
        testItem.services.activeCultureId = 'en';
        expect(testItem.format(date)).toEqual({ value: '1/11/2000' });
        testItem.services.activeCultureId = 'fr';
        expect(testItem.format(date)).toEqual({ value: '11/01/2000' });
    });
    test('Number to string using built-in localization', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;

        let value = 4000.932;
        testItem.services.activeCultureId = 'en-GB';
        expect(testItem.format(value)).toEqual({ value: '4,000.932' });
        testItem.services.activeCultureId = 'en';
        expect(testItem.format(value)).toEqual({ value: '4,000.932' });
        testItem.services.activeCultureId = 'fr';
        expect(testItem.format(value)).toEqual({ value: '4\u{202F}000,932' });
    });
    test('String to string using built-in localization. Expect no changes', () => {
        let services = new MockValidationServices(false, true);
        populateServicesWithManyCultures(services, 'en', true);
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        let value = 'abcZYX';
        testItem.services.activeCultureId = 'en-GB';
        expect(testItem.format(value)).toEqual({ value: value });
        testItem.services.activeCultureId = 'en';
        expect(testItem.format(value)).toEqual({ value: value });
        testItem.services.activeCultureId = 'fr';
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
        class ErrorFormatter implements IDataTypeFormatter
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
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        testItem.register(new ErrorFormatter());
        expect(testItem.format(10, 'TEST').errorMessage).toBe('ERROR');
        let logger = services.loggerService as MockCapturingLogger;
        // LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService'
        expect(logger.findMessage('ERROR', LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService'));
    });
    test('Formatter throws string. results in errorMessage with "unspecified"', () => {
        class ErrorFormatter implements IDataTypeFormatter
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
        let testItem = services.dataTypeFormatterService as DataTypeFormatterService;
        testItem.register(new ErrorFormatter());
        expect(testItem.format(10, 'TEST').errorMessage).toBe('Unspecified');
        let logger = services.loggerService as MockCapturingLogger;
        // LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService'
        expect(logger.findMessage('Unspecified', LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService'));
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