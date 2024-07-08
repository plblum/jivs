import { BooleanDataTypeIdentifier, DateDataTypeIdentifier, NumberDataTypeIdentifier, StringDataTypeIdentifier } from "../../src/DataTypes/DataTypeIdentifiers";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { IDataTypeIdentifier } from "../../src/Interfaces/DataTypeIdentifier";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { MockValidationServices } from "../TestSupport/mocks";

class TestDataType { }
class TestIdentifier implements IDataTypeIdentifier {
    dataTypeLookupKey: string = 'TEST';
    supportsValue(value: any): boolean {
        return value instanceof TestDataType;
    }
}

describe('DataTypeIdentifierService register and find', () => {

    test('Confirms Number, Boolean, String, and Date are preinstalled', () => {
        let testItem = new DataTypeIdentifierService();
        expect(testItem.find(0)).toBeInstanceOf(NumberDataTypeIdentifier);
        expect(testItem.find(false)).toBeInstanceOf(BooleanDataTypeIdentifier);
        expect(testItem.find('abc')).toBeInstanceOf(StringDataTypeIdentifier);
        expect(testItem.find(new Date())).toBeInstanceOf(DateDataTypeIdentifier);
        expect(testItem.find({})).toBeNull();
        expect(testItem.find([])).toBeNull();
    });
    test('register adds new item', () => {
        let testItem = new DataTypeIdentifierService();
        let services = new MockValidationServices(false, false);
        testItem.services = services;
        testItem.register(new TestIdentifier());
        expect(testItem.identify(new TestDataType())).toBe('TEST');
        // confirm we didn't clobber the built in ones
        expect(testItem.identify(0)).toBe(LookupKey.Number);
        expect(testItem.identify(false)).toBe(LookupKey.Boolean);
    });
    test('register replaces existing item', () => {
        class TestDataType { }
        class TestIdentifier implements IDataTypeIdentifier {
            dataTypeLookupKey: string = LookupKey.Date;  // will replace Dates...
            supportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }

        }
        let testItem = new DataTypeIdentifierService();
        let services = new MockValidationServices(false, false);
        testItem.services = services;
        testItem.register(new TestIdentifier());
        expect(testItem.identify(new TestDataType())).toBe(LookupKey.Date);
        expect(testItem.identify(new Date())).toBeNull();
        // confirm we didn't clobber the built in ones
        expect(testItem.identify(0)).toBe(LookupKey.Number);
        expect(testItem.identify(false)).toBe(LookupKey.Boolean);

    });
});

describe('DataTypeIdentifierService.identify', () => {

    // IdentifyLookupKey(value: any): string
    test('identify', () => {
        let testItem = new DataTypeIdentifierService();
        let services = new MockValidationServices(false, false);
        testItem.services = services;
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        testItem.register(new TestIdentifier());
        expect(testItem.identify(0)).toBe(LookupKey.Number);
        expect(logger.findMessage('Identified "Number"', LoggingLevel.Debug)).toBeTruthy();


        expect(testItem.identify('abc')).toBe(LookupKey.String);
        expect(testItem.identify(false)).toBe(LookupKey.Boolean);
        expect(testItem.identify(new Date())).toBe(LookupKey.Date);
        expect(testItem.identify(new TestDataType())).toBe('TEST');        
        expect(testItem.identify({})).toBeNull();
        expect(testItem.identify([])).toBeNull();
    });
});

describe('lazyLoad', () => {
    class NormalDataType { }
    class NormalIdentifier implements IDataTypeIdentifier
    {
        dataTypeLookupKey: string = 'Normal';
        supportsValue(value: any): boolean {
            return value instanceof NormalDataType;
        }     
    }
    class LazyDataType { }
    class LazyLoadIdentifier implements IDataTypeIdentifier
    {
        dataTypeLookupKey: string = 'LazyLoad';
        supportsValue(value: any): boolean {
            return value instanceof LazyDataType;
        }
    }    
    test('Call to register does not lazy load', () => {
        let tls = new DataTypeIdentifierService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadIdentifier());
            loaded = true;
        };
        tls.register(new NormalIdentifier());
        expect(loaded).toBe(false);
    });
    test('Call to find for already registered does not lazy load', () => {
        let tls = new DataTypeIdentifierService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadIdentifier());
            loaded = true;
        };
        tls.register(new NormalIdentifier());
        expect(loaded).toBe(false);
        expect(tls.find(new NormalDataType())).toBeInstanceOf(NormalIdentifier);  // looks for NumberIdentifier
        expect(loaded).toBe(false);
 
    });
    test('Call to find for unregistered does load but later find does not load for unregistered', () => {
        let tls = new DataTypeIdentifierService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadIdentifier());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(tls.find(new LazyDataType())).toBeInstanceOf(LazyLoadIdentifier);
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(tls.find(new NormalDataType())).toBeNull();      // Number support not registered
        expect(loaded).toBe(false);
    });
    test('Call to find for unregistered does load but fails to load what it needs but has loaded one we use later', () => {
        let tls = new DataTypeIdentifierService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadIdentifier());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(tls.find(new NormalDataType())).toBeNull();      // not registered
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(tls.find(new LazyDataType())).toBeInstanceOf(LazyLoadIdentifier);
        expect(loaded).toBe(false);
    });    
});