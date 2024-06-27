import { CapturingLogger } from './../TestSupport/CapturingLogger';
import { DataTypeIdentifierService } from './../../src/Services/DataTypeIdentifierService';
import { UTCDateOnlyConverter } from "../../src/DataTypes/DataTypeConverters";
import { IDataTypeConverter } from "../../src/Interfaces/DataTypeConverters";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IDataTypeIdentifier } from '../../src/Interfaces/DataTypeIdentifier';
import { LoggingCategory, LoggingLevel } from '../../src/Interfaces/LoggerService';
import { MockValidationServices } from '../TestSupport/mocks';
import { CodingError } from '../../src/Utilities/ErrorHandling';
import { SimpleValueType } from '../../src/Interfaces/DataTypeConverterService';
import { LookupKey } from '../../src/DataTypes/LookupKeys';


class TestDataTypeAsNumber {
    constructor(numericValue: number)
    {
        this.numericValue = numericValue;
    }
    numericValue: number;
}
class TestDataTypeAsNumberConverter implements IDataTypeConverter
{
    supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof TestDataTypeAsNumber;
    }
    convert(value: TestDataTypeAsNumber, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.numericValue;
    }
}
class TestDataTypeAsNumberIdentifier implements IDataTypeIdentifier
{
    dataTypeLookupKey: string = 'TestNumber';
    supportsValue(value: any): boolean {
        return value instanceof TestDataTypeAsNumber;
    }
}
class TestDataTypeAsString {
    constructor(stringValue: string) {
        this.stringValue = stringValue;
    }
    stringValue: string;
}
class TestDataTypeAsStringConverter implements IDataTypeConverter {
    supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof TestDataTypeAsString;
    }
    convert(value: TestDataTypeAsString, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.stringValue;
    }
}
class TestDataTypeAsStringIdentifier implements IDataTypeIdentifier
{
    dataTypeLookupKey: string = 'TestString';
    supportsValue(value: any): boolean {
        return value instanceof TestDataTypeAsString;
    }
}
class TestDataTypeAsDate {
    constructor(dateValue: Date) {
        this.dateValue = dateValue;
    }
    dateValue: Date;
}
class TestDataTypeAsDateConverter implements IDataTypeConverter {
    supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof TestDataTypeAsDate;
    }
    convert(value: TestDataTypeAsDate, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.dateValue;
    }
}
class TestDataTypeAsDateIdentifier implements IDataTypeIdentifier
{
    dataTypeLookupKey: string = 'TestDate';
    supportsValue(value: any): boolean {
        return value instanceof TestDataTypeAsDate;
    }
}
class TestConverterToLowerCase implements IDataTypeConverter {
    supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return dataTypeLookupKey === 'TEST' && typeof value === 'string';
    }
    convert(value: string, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.toLowerCase();
    }
}
class TestConverterThatThrows implements IDataTypeConverter {
    constructor(error: Error)
    {
        this._error = error;
    }
    private _error: Error;
    supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return true;
    }
    convert(value: TestDataTypeAsDate, dataTypeLookupKey: string): string | number | Date | null | undefined {
        throw this._error;
    }
}
describe('DataTypeComparerService constructor, register, and find', () => {
    test('Confirm UTCDateOnlyConverter is preregistered', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, true);          
        expect(testItem.find(new Date(), null)).toBeInstanceOf(UTCDateOnlyConverter);    
    });    
    test('register and find matching only value', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, true);          
        testItem.register(new TestDataTypeAsNumberConverter());
        expect(testItem.find(new TestDataTypeAsNumber(10), null)).toBeInstanceOf(TestDataTypeAsNumberConverter);
        expect(testItem.find(new TestDataTypeAsNumber(10), 'Anything')).toBeInstanceOf(TestDataTypeAsNumberConverter);        
    });
    test('register and find matching only values that are string and lookupKey = TEST', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, true);          
        testItem.register(new TestConverterToLowerCase());
        expect(testItem.find("ABC", "TEST")).toBeInstanceOf(TestConverterToLowerCase);
        expect(testItem.find("ABC", 'Anything')).toBeNull();
        expect(testItem.find(100, "TEST")).toBeNull();
        
    });    
    test('find returns null when nothing is registered', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, true);          
        expect(testItem.find(new TestDataTypeAsNumber(10), null)).toBeNull();

    });
    test('find returns null when there is a registration but its the wrong data type', () => {

        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, true);          
        testItem.register(new TestDataTypeAsNumberConverter());
        expect(testItem.find(new TestDataTypeAsString(''), null)).toBeNull();

    });
});
describe('convert', ()=> {
    test('Convert all 4 registered test converters successfully', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, true); 
        let logger = testItem.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        
        testItem.register(new TestDataTypeAsNumberConverter());
        testItem.register(new TestDataTypeAsStringConverter());
        testItem.register(new TestDataTypeAsDateConverter());        
        testItem.register(new TestConverterToLowerCase());

        let date1 = new Date(2000, 0, 1);

        expect(testItem.convert(new TestDataTypeAsNumber(500), "")).toBe(500);
        expect(logger.findMessage('Using TestDataTypeAsNumberConverter', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('Converted to', LoggingLevel.Info, null, null)).not.toBeNull();

        expect(testItem.convert(new TestDataTypeAsString("ZYX"), "")).toBe("ZYX");
        let convertDate1 = testItem.convert(new TestDataTypeAsDate(date1), "");
        expect(convertDate1).toBeInstanceOf(Date);
        expect((convertDate1 as Date).getTime()).toBe(date1.getTime());
        expect(testItem.convert("ABC", "TEST")).toBe("abc");
    });
    test('With 2 converters registered, convert with data types not registered results in undefined', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, true);  
        let logger = testItem.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        
        expect(testItem.convert(new TestDataTypeAsNumber(500), "")).toBeUndefined();
        expect(logger.findMessage('No converter found', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(testItem.convert(new TestDataTypeAsString("ZYX"), "")).toBeUndefined();
        expect(testItem.convert(100, "")).toBeUndefined();
        expect(testItem.convert(new TestDataTypeAsDate(new Date()), "")).toBeUndefined();
    });    
    test('Attempt converting a string when data typelookup is not TEST returns undefined', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, true);          
        let logger = testItem.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        testItem.register(new TestConverterToLowerCase());

        expect(testItem.convert("ABC", "")).toBeUndefined();
        expect(logger.findMessage('No converter found', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(testItem.convert("ABC", null)).toBeUndefined();
        expect(testItem.convert("ABC", "Anything")).toBeUndefined();
        expect(testItem.convert(100, "")).toBeUndefined();
    });
    test('Converter that throws non-severe is handled by returning undefined and adding to the log.', () => {
        let services = new ValidationServices();  
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Debug;
        services.loggerService = logger;
        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;
        testItem.register(new TestConverterThatThrows(new Error('test')));

        expect(testItem.convert("ABC", "")).toBeUndefined();
        expect(logger.findMessage('Using TestConverterThatThrows', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('TEST', LoggingLevel.Error, null, null)).not.toBeNull();
    });    

    test('Converter that throws severe is handled by throwing and adding to the log.', () => {
        let services = new ValidationServices();  
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Debug;
        services.loggerService = logger;
        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;
        testItem.register(new TestConverterThatThrows(new CodingError('test')));

        expect(()=> testItem.convert("ABC", "")).toThrow(/test/);
        expect(logger.findMessage('Using TestConverterThatThrows', LoggingLevel.Debug, null, null)).not.toBeNull();
        expect(logger.findMessage('TEST', LoggingLevel.Error, null, null)).not.toBeNull();
    });        
});
describe('convertToPrimitive', ()=> {
    test('convertToPrimitive all 4 registered test converters successfully', () => {
        let services = new ValidationServices();  
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Debug;
        services.loggerService = logger;

        let idService = new DataTypeIdentifierService();  // expected to have preregistered standard DataTypeIdentifiers
        services.dataTypeIdentifierService = idService;
        idService.register(new TestDataTypeAsNumberIdentifier());
        idService.register(new TestDataTypeAsStringIdentifier());
        idService.register(new TestDataTypeAsDateIdentifier());
        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;
        testItem.register(new TestDataTypeAsNumberConverter());
        testItem.register(new TestDataTypeAsStringConverter());
        testItem.register(new TestDataTypeAsDateConverter());        
        testItem.register(new TestConverterToLowerCase());

        let date1 = new Date(2000, 0, 1);

        expect(testItem.convertToPrimitive(new TestDataTypeAsNumber(500), "")).toBe(500);
        expect(logger.findMessage('Converted to', LoggingLevel.Info, null, null)).not.toBeNull();

        expect(testItem.convertToPrimitive(new TestDataTypeAsString("ZYX"), "")).toBe("ZYX");
        expect(testItem.convertToPrimitive("ABC", "TEST")).toBe("abc");

        let convertDate1 = testItem.convertToPrimitive(new TestDataTypeAsDate(date1), "");
        expect(typeof convertDate1).toBe('number');
        expect(convertDate1).toBe(Math.floor(date1.getTime() / 86400000));

    });
    test('With 2 converters registered but no supporting identifiers, convertToPrimitive with data types not identified throws and logs', () => {
        let services = new ValidationServices();  
        let idService = new DataTypeIdentifierService();  // expected to have preregistered standard DataTypeIdentifiers
        services.dataTypeIdentifierService = idService;
        let logger = new CapturingLogger();
        services.loggerService = logger;

        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;

        expect(()=> testItem.convertToPrimitive(new TestDataTypeAsNumber(500), "")).toThrow(/unknown/);
        expect(logger.findMessage('unknown', LoggingLevel.Error, LoggingCategory.Exception, 'DataTypeConverterService')).not.toBeNull();      
        logger.clearAll();
        expect(()=> testItem.convertToPrimitive(new TestDataTypeAsString("ZYX"), "")).toThrow(/unknown/);
        expect(logger.findMessage('unknown', LoggingLevel.Error, LoggingCategory.Exception, 'DataTypeConverterService')).not.toBeNull();      
    });    
    test('convertToPrimitive returns the same value when passed either null or undefined', () => {
        let services = new ValidationServices();  
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Debug;
        let idService = new DataTypeIdentifierService();  // expected to have preregistered standard DataTypeIdentifiers
        services.dataTypeIdentifierService = idService;

        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;

        expect(testItem.convertToPrimitive(null, "")).toBeNull();
        expect(logger.entryCount()).toBe(0);
        expect(testItem.convertToPrimitive(undefined, "")).toBeUndefined();
    });        
    test('Within convertToPrimitive, Converter that throws non-severe is handled by returning undefined and adding to the log.', () => {
        let services = new ValidationServices();  
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Debug;
        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;
        services.loggerService = logger;
        services.dataTypeIdentifierService = new DataTypeIdentifierService();
        testItem.register(new TestConverterThatThrows(new Error('TEST')));

        expect(testItem.convertToPrimitive("ABC", "")).toBeUndefined();
        expect(logger.findMessage('TEST', LoggingLevel.Error, null, null)).not.toBeNull();
    });        
    test('Within convertToPrimitive, Converter that throws severe throws and adding to the log.', () => {
        let services = new ValidationServices();  
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Debug;
        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;
        services.loggerService = logger;
        services.dataTypeIdentifierService = new DataTypeIdentifierService();
        testItem.register(new TestConverterThatThrows(new CodingError('TEST')));

        expect(()=> testItem.convertToPrimitive("ABC", "")).toThrow(/TEST/);
        expect(logger.findMessage('TEST', LoggingLevel.Error, null, null)).not.toBeNull();
    });            
});

describe('cleanupConvertableValue', () => { 
    class TestLookupKeyConverter implements IDataTypeConverter
    {
        supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
            return dataTypeLookupKey !== null;
        }
        convert(value: any, dataTypeLookupKey: string): SimpleValueType {
            return value;
        }
        
    }
    test('Check values to primitive types, undefined, and null return the expected value', () => {
        let testItem = new DataTypeConverterService();
        let services = new MockValidationServices(false, true);
        services.dataTypeConverterService = testItem;
        testItem.services = services;
        testItem.register(new TestLookupKeyConverter());
        let logger = testItem.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        expect(testItem.cleanupConvertableValue(0, LookupKey.Number)).toBe(0);
        expect(logger.findMessage('Using TestLookupKeyConverter', LoggingLevel.Debug, null, null)).not.toBeNull();
     
        expect(testItem.cleanupConvertableValue(true, LookupKey.Boolean)).toBe(true);
        expect(testItem.cleanupConvertableValue('text', LookupKey.String)).toBe('text');
/* TS2737: BigInt literals are not available when targeting lower than ES2020.        
        expect(testItem.cleanupConvertableValue(0n, LookupKey.Number)).toBe(0n);
*/        
        expect(testItem.cleanupConvertableValue(undefined, LookupKey.Number)).toBeUndefined();
        expect(testItem.cleanupConvertableValue(null, LookupKey.Number)).toBe(null);

    });
    test('Array is unsupported and will throw', () => {
        let testItem = new DataTypeConverterService();
        let services = new MockValidationServices(false, true);
        services.dataTypeConverterService = testItem;
        testItem.services = services;
        testItem.register(new TestLookupKeyConverter());
        let logger = testItem.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        expect(() => testItem.cleanupConvertableValue([], 'SOMETHING')).toThrow(/unsupported/);
        expect(logger.findMessage('Using TestLookupKeyConverter', LoggingLevel.Debug, null, null)).not.toBeNull();
     
    });

});
describe('lazyLoad', () => {
    class NormalConverter implements IDataTypeConverter
    {
        supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
            return dataTypeLookupKey === 'Normal';
        }
        convert(value: any, dataTypeLookupKey: string): SimpleValueType {
            throw new Error('Method not implemented.');
        }
        
    }
    class LazyLoadConverter implements IDataTypeConverter
    {
        supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
            return dataTypeLookupKey === 'LazyLoad';
        }
        convert(value: any, dataTypeLookupKey: string): SimpleValueType {
            throw new Error('Method not implemented.');
        }
        
    }    
    test('Call to register does not lazy load', () => {
        let testItem = new DataTypeConverterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadConverter());
            loaded = true;
        };
        testItem.register(new NormalConverter());
        expect(loaded).toBe(false);
    });
    test('Call to find for already registered does not lazy load', () => {
        let testItem = new DataTypeConverterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadConverter());
            loaded = true;
        };
        testItem.register(new NormalConverter());
        expect(loaded).toBe(false);
        expect(testItem.find(0, 'Normal')).toBeInstanceOf(NormalConverter);
        expect(loaded).toBe(false);
 
    });
    test('Call to find for unregistered does load but later find does not load for unregistered', () => {
        let testItem = new DataTypeConverterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadConverter());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.find(0, 'LazyLoad')).toBeInstanceOf(LazyLoadConverter);
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.find(0, 'Normal')).toBeNull();      // not registered
        expect(loaded).toBe(false);
    });
    test('Call to find for unregistered does load but fails to load what it needs but has loaded one we use later', () => {
        let testItem = new DataTypeConverterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadConverter());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.find(0, 'Normal')).toBeNull();      // not registered
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.find(0, 'LazyLoad')).toBeInstanceOf(LazyLoadConverter);
        expect(loaded).toBe(false);
    });    
});