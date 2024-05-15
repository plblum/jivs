import { BooleanDataTypeComparer } from "../../src/DataTypes/DataTypeComparers";
import { CaseInsensitiveStringConverter, DateTimeConverter, UTCDateOnlyConverter } from "../../src/DataTypes/DataTypeConverters";
import { NumberDataTypeIdentifier, StringDataTypeIdentifier, BooleanDataTypeIdentifier, DateDataTypeIdentifier } from "../../src/DataTypes/DataTypeIdentifiers";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ComparersResult } from "../../src/Interfaces/DataTypeComparerService";
import { IDataTypeComparer } from "../../src/Interfaces/DataTypeComparers";
import { IDataTypeConverter } from "../../src/Interfaces/DataTypeConverters";
import { IDataTypeIdentifier } from "../../src/Interfaces/DataTypeIdentifier";
import { LoggingLevel, LoggingCategory } from "../../src/Interfaces/LoggerService";
import { DataTypeComparerService } from "../../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { MockValidationServices } from "../TestSupport/mocks";

describe('DataTypeComparerServices constructor and properties', () => {

    test('Constructor with no parameters', () => {
        let testItem = new DataTypeComparerService();
        expect(() => testItem.services).toThrow(/Assign/);
    });

    test('Attach Services returns the same instance', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new DataTypeComparerService();
        expect(() => testItem.services = services).not.toThrow();
        let x: any;
        expect(() => x = testItem.services).not.toThrow();
        expect(x).toBe(services);
    });
});
const TestLookupKey = 'TEST';
class TestDataType {
    constructor(firstName: string, lastName: string) {
        this.FirstName = firstName;
        this.LastName = lastName;
    }
    FirstName: string;
    LastName: string;
}
class TestIdentifier implements IDataTypeIdentifier {
    dataTypeLookupKey: string = TestLookupKey;
    supportsValue(value: any): boolean {
        return value instanceof TestDataType;
    }
    
}
class TestComparer implements IDataTypeComparer {
    supportsValues(value1: any, value2: any): boolean {
        return value1 instanceof TestDataType ||
            value2 instanceof TestDataType;
    }
    compare(value1: any, value2: any): ComparersResult {
        if (value1 instanceof TestDataType &&
            value2 instanceof TestDataType) {
            let fullName1 = (value1.FirstName + ' ' + value1.LastName).toLowerCase();
            let fullName2 = (value2.FirstName + ' ' + value2.LastName).toLowerCase();
            if (fullName1 === fullName2)
                return ComparersResult.Equals;
            if (fullName1 < fullName2)
                return ComparersResult.LessThan;
            return ComparersResult.GreaterThan;
        }
        return ComparersResult.NotEquals;
    }
}
describe('DataTypeComparerServices.register and find', () => {
    test('confirm BooleanDataTypeComparer is preregistered', () => {
        let testItem = new DataTypeComparerService();
        expect(testItem.find(true, false)).toBeInstanceOf(BooleanDataTypeComparer);
    });    
    test('register and find registered returns the same Comparer class', () => {
        let testItem = new DataTypeComparerService();
        expect(() => testItem.register(new TestComparer())).not.toThrow();
        let item1 = new TestDataType('A', 'B');
        let item2 = new TestDataType('A', 'D');
        expect(testItem.find(item1, item2)).toBeInstanceOf(TestComparer);
    });
    test('find with unexpected values returns null', () => {
        let testItem = new DataTypeComparerService();
        let services = new MockValidationServices(false, true);
        services.dataTypeComparerService = testItem;

        expect(() => testItem.register(new TestComparer())).not.toThrow();

        expect(testItem.find(null, null)).toBeNull();
 // booleancomparer is preregistered:       expect(testItem.find(null, false)).toBeNull();
        expect(testItem.find(new Date(), 20)).toBeNull();
        expect(testItem.find("abc", 20)).toBeNull();        
    });    
    test('find with one expected value and the other not expected returns the comparer', () => {
        let testItem = new DataTypeComparerService();
        let services = new MockValidationServices(false, true);
        services.dataTypeComparerService = testItem;

        expect(() => testItem.register(new TestComparer())).not.toThrow();
        let item1 = new TestDataType('A', 'B');
        expect(testItem.find(item1, null)).toBeInstanceOf(TestComparer);
        expect(testItem.find(null, item1)).toBeInstanceOf(TestComparer);
        expect(testItem.find(item1, 20)).toBeInstanceOf(TestComparer);
      
    });    
    test('register and find', () => {
        let testItem = new DataTypeComparerService();
        let services = new MockValidationServices(false, true);
        services.dataTypeComparerService = testItem;

        let item1 = new TestDataType('A', 'B');
        let item2 = new TestDataType('A', 'D');
        expect(testItem.find(item1, item2)).toBeNull();
        testItem.register(new TestComparer());
        expect(testItem.find(item1, item2)).toBeInstanceOf(TestComparer);
    });

    test('Invalid parameters', () => {
        let testItem = new DataTypeComparerService();
        expect(() => testItem.register(null!)).toThrow(/item/);
    });
});
describe('DataTypeComparerServices compare with custom classes', ()=>{
    test('New comparer that handles numbers with custom type and datatype lookup resolved by IDataTypeIdentifier', () => {
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new TestIdentifier());
        expect(() => testItem.register(new TestComparer())).not.toThrow();

        let test1 = new TestDataType("A", "B");
        let test2 = new TestDataType("A", "C");
        let test3 = new TestDataType("a", "c");        
        let test4 = new TestDataType("z", "y");

        expect(testItem.compare(test1, test1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(test2, test3, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(test3, test2, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(test1, test2, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(test2, test1, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(test1, test4, null, null)).toBe(ComparersResult.LessThan);
    });

    test('New comparer that handles numbers with custom type and datatype lookup resolved by LookupKey', () => {
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new TestIdentifier());
        expect(() => testItem.register(new TestComparer())).not.toThrow();

        let test1 = new TestDataType("A", "B");
        let test2 = new TestDataType("A", "C");
        let test3 = new TestDataType("a", "c");        
        let test4 = new TestDataType("z", "y");

        expect(testItem.compare(test1, test1, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.compare(test2, test3, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.compare(test3, test2, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.compare(test1, test2, "TEST", "TEST")).toBe(ComparersResult.LessThan);
        expect(testItem.compare(test2, test1, "TEST", "TEST")).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(test1, test4, "TEST", "TEST")).toBe(ComparersResult.LessThan);
    });
});
// compare(value1: any, value2: any, lookupKey: string | null): ComparersResult
describe('DataTypeComparerService.compare', () => {
    test('Number value resolves lookupKey and correctly handles comparisons', () => {
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;        
        expect(testItem.compare(0, 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(0, 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(1, 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(0, 1, null, null)).toBe(ComparersResult.LessThan);        
    });
    test('Number value compares to custom class that has a IDataTypeConverter', () => {
        class TestDataType {
            constructor(quantity: number)
            {
                this.Quantity = quantity;
            }
            Quantity: number;
        }
        class SupportTestDataType implements IDataTypeIdentifier
        {
            dataTypeLookupKey: string = "TEST";
            supportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }
        }
        class TestConverter implements IDataTypeConverter
        {
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;
        let dtic = services.dataTypeConverterService as DataTypeConverterService;

        dtis.register(new SupportTestDataType());
        dtic.register(new TestConverter());        

        expect(testItem.compare(new TestDataType(0), 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(new TestDataType(10), 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(new TestDataType(undefined!), 0, null, null)).toBe(ComparersResult.Undetermined);        
    });

    
    test('String value resolves lookupKey and correctly handles comparisons', () => {
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new StringDataTypeIdentifier());
        expect(testItem.compare('A', 'A', null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare('B', 'A', null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare('A', 'B', null, null)).toBe(ComparersResult.LessThan);        
    });    
    test('String value with Lookup Key assigned resolves correctly handles comparisons', () => {
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtcs = services.dataTypeConverterService as DataTypeConverterService;
        dtcs.register(new CaseInsensitiveStringConverter());
        expect(testItem.compare("ABC", "ABC", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.Equals);
        expect(testItem.compare("ABC", "abc", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.Equals);
        expect(testItem.compare("abc", "ABC", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.Equals);
        expect(testItem.compare(" ABC", "ABC ", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.LessThan);
        expect(testItem.compare("abc", "ABC", LookupKey.CaseInsensitive, LookupKey.String)).toBe(ComparersResult.GreaterThan);
    });        
    test('Boolean value resolves lookupKey and correctly handles comparisons', () => {
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new BooleanDataTypeIdentifier());
        testItem.register(new BooleanDataTypeComparer());
        expect(testItem.compare(true, true, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(false, true, null, null)).toBe(ComparersResult.NotEquals);
        expect(testItem.compare(true, false, null, null)).toBe(ComparersResult.NotEquals);        
    });       
     
    test('Date value resolves lookupKey and correctly handles comparisons', () => {
        let date1 = new Date(2000, 5, 31);
        let date2 = new Date(2000, 5, 30);
        let date3 = new Date(Date.UTC(2000, 10, 1));
        let date4 = new Date(Date.UTC(2000, 10, 1, 2, 3, 4));
        
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;
  
        let dtcs = services.dataTypeConverterService as DataTypeConverterService;
        dtcs.register(new DateTimeConverter());

        expect(testItem.compare(date1, date1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(date2, date1, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date1, date2, null, null)).toBe(ComparersResult.GreaterThan);   
        expect(testItem.compare(date4, date4, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(date2, date4, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date4, date2, null, null)).toBe(ComparersResult.GreaterThan);   

        expect(testItem.compare(date1, date1, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equals);
        expect(testItem.compare(date2, date1, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date1, date2, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.GreaterThan);   

        expect(testItem.compare(date4, date4, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equals);
        expect(testItem.compare(date2, date4, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date4, date2, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.GreaterThan);   

        expect(testItem.compare(date3, date3, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Equals);
        expect(testItem.compare(date3, date4, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date4, date3, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.GreaterThan);
        // these are due to the dataTypeComparerService.compare function itself
        expect(testItem.compare(null, null, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equals);
        expect(testItem.compare(date1, null, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Undetermined);
        expect(testItem.compare(null, date2, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Undetermined);
        expect(testItem.compare(null, null, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Equals);
        expect(testItem.compare(date3, null, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Undetermined);
        expect(testItem.compare(null, date4, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Undetermined);
    });         
    
    test('value compares to custom class that has a IDataTypeConverter', () => {
        class TestDataType {
            constructor(dateValue: Date)
            {
                this.DateValue = dateValue;
            }
            DateValue: Date;
        }
        class SupportTestDataType implements IDataTypeIdentifier
        {
            dataTypeLookupKey: string = "TEST";
            supportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }
        }
        class TestConverter implements IDataTypeConverter
        {
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.DateValue;
            }
        }
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;        
        let dtcs = services.dataTypeConverterService as DataTypeConverterService;        

        dtis.register(new SupportTestDataType());
        dtcs.register(new TestConverter()); 
        
        let date1 = new TestDataType(new Date(2000, 5, 31));
        let date2 = new Date(2000, 5, 30);

        expect(testItem.compare(date1, date1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compare(date2, date1, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date1, date2, null, null)).toBe(ComparersResult.GreaterThan);        
    });               
    
    test('Unsupported data type for lookupKey using JavaScript object logs error and throws', () => {
        let testItem = new DataTypeComparerService();
        testItem.services = new MockValidationServices(true, true);
        let result: ComparersResult | null = null;
        expect(() => result = testItem.compare({}, 'A', null, null)).toThrow(/operand/);
        let logger = testItem.services.loggerService as CapturingLogger;
        expect(logger.findMessage('operand', LoggingLevel.Error, LoggingCategory.Compare, 'DataTypeComparerService')).not.toBeNull();        

    });    
    test('Unsupported data type for lookupKey using some class instance logs error and throws', () => {
        let testItem = new DataTypeComparerService();
        testItem.services = new MockValidationServices(true, true);
        let result: ComparersResult | null = null;
        expect(() => result = testItem.compare(testItem /* some class */, 'A', null, null)).toThrow(/operand/);
        let logger = testItem.services.loggerService as CapturingLogger;
        expect(logger.findMessage('operand', LoggingLevel.Error, LoggingCategory.Compare, 'DataTypeComparerService')).not.toBeNull();        

    });    

    test('Fallback to DefaultComparer for unsupported lookupKey', () => {
        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;        

        dtis.register(new StringDataTypeIdentifier());

        expect(testItem.compare('A', 'A', 'Key1', null)).toBe(ComparersResult.Equals);
        expect(testItem.compare('A', 'a', 'Key1', null)).toBe(ComparersResult.LessThan);
    });          
    test('Compare with custom types that have a Comparer for their converted values', () => {
        // HoldsDate -> Date -> Compare to Day Of week
        class HoldsDate
        {
            constructor(year: number, month: number, day: number)
            {
                this._value = new Date(Date.UTC(year, month, day));
            }
            private _value: Date;
            get value(): Date
            {
                return this._value;
            }
        }
        class HoldsDateIdentifier implements IDataTypeIdentifier
        {
            dataTypeLookupKey = "HoldsDate";
            supportsValue(value: any): boolean {
                return value instanceof HoldsDate;
            }
        }

        class HoldsDateDayOfWeekComparer implements IDataTypeComparer
        {
            supportsValues(value1: any, value2: any): boolean {
                return value1 instanceof HoldsDate && value2 instanceof HoldsDate;
            }
            compare(value1: any, value2: any): ComparersResult {
                if (value1 instanceof HoldsDate && value2 instanceof HoldsDate)
                    return value1.value.getUTCDay() === value2.value.getUTCDay() ?
                        ComparersResult.Equals : ComparersResult.NotEquals;
                return ComparersResult.Undetermined;
            }
        }

        let test1 = new HoldsDate(2000, 1, 5);
        let test2 = new HoldsDate(2000, 1, 6);
        let test3 = new HoldsDate(2000, 1, 12);

        let services = new MockValidationServices(false, true);
        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtis = services.dataTypeIdentifierService as DataTypeIdentifierService;             
        let dtcmps = services.dataTypeComparerService as DataTypeComparerService;        

        dtis.register(new HoldsDateIdentifier());
        dtcmps.register(new HoldsDateDayOfWeekComparer());

        expect(testItem.compare(test1, test1, "HoldsDate", "HoldsDate")).toBe(ComparersResult.Equals);
        expect(testItem.compare(test1, test2, "HoldsDate", "HoldsDate")).toBe(ComparersResult.NotEquals);
        expect(testItem.compare(test2, test1, "HoldsDate", "HoldsDate")).toBe(ComparersResult.NotEquals);        
        expect(testItem.compare(test1, test3, "HoldsDate", "HoldsDate")).toBe(ComparersResult.Equals);
    });      
});