import { DataTypeServices } from './../../src/DataTypes/DataTypeServices';
import { UTCDateOnlyConverter, DateTimeConverter, LocalDateOnlyConverter, CaseInsensitiveStringConverter, TotalDaysConverter, IntegerConverter, TimeOfDayOnlyConverter, TimeOfDayHMSOnlyConverter } from './../../src/DataTypes/DataTypeConverters';
import { ComparersResult } from '../../src/Interfaces/DataTypes';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
describe('DataTypeConverter concrete classes', () => {
    describe('CaseInsensitiveStringConverter', () => {
        test('SupportsValue', () => {
            let testItem = new CaseInsensitiveStringConverter();
            expect(testItem.supportsValue("Test", LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.supportsValue("", LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.supportsValue("Test", LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(0, LookupKey.CaseInsensitive)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.CaseInsensitive)).toBe(false);
        });
        test('Convert', () => {
            let testItem = new CaseInsensitiveStringConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            expect(testItem.convert("Test", LookupKey.CaseInsensitive)).toBe("test");
            expect(testItem.convert("", LookupKey.CaseInsensitive)).toBe("");
            expect(testItem.convert("abc", LookupKey.CaseInsensitive)).toBe("abc");
        });
        test('Within DataTypeServices', () => {
            let testItem = new DataTypeServices(); 
            testItem.registerDataTypeConverter(new CaseInsensitiveStringConverter());
            expect(testItem.compareValues("ABC", "ABC", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues("ABC", "abc", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues("abc", "ABC", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(" ABC", "ABC ", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.LessThan);
        });
    });
    describe('DateTimeConverter', () => {
        test('SupportsValue', () => {
            let testItem = new DateTimeConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.DateTime)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(false);            
            expect(testItem.supportsValue(0, LookupKey.DateTime)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.DateTime)).toBe(false);
        });
        test('Convert', () => {
            let testItem = new DateTimeConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30));
            expect(testItem.convert(test1, LookupKey.DateTime)).toBe(test1.getTime());
            expect(testItem.convert(test2, LookupKey.DateTime)).toBe(test2.getTime());

            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.DateTime)).toBeUndefined();            
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(Date.UTC(2000, 10, 1));
            let date2 = new Date(Date.UTC(2000, 10, 1, 2, 3, 4));
            
            let testItem = new DataTypeServices(); 
            testItem.registerDataTypeConverter(new DateTimeConverter());
            expect(testItem.compareValues(date1, date1, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, date2, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.LessThan);
            expect(testItem.compareValues(date2, date1, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.GreaterThan);
            // these are due to the DataTypeServices.CompareValues function itself
            expect(testItem.compareValues(null, null, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, null, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Undetermined);
            expect(testItem.compareValues(null, date2, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Undetermined);
            
        });
    });    
    describe('UTCDateOnlyConverter', () => {
        test('SupportsValue', () => {
            let testItem = new UTCDateOnlyConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.Date)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(true);            
            expect(testItem.supportsValue(0, LookupKey.Date)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.Date)).toBe(false);
        });
        test('Convert', () => {
            let testItem = new UTCDateOnlyConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30));
            let test2dateonly = new Date(Date.UTC(2023, 0, 1));
            expect(testItem.convert(test1, LookupKey.Date)).toBe(test1.getTime());
            expect(testItem.convert(test2, LookupKey.Date)).toBe(test2dateonly.getTime());
            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.Date)).toBeUndefined();
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(Date.UTC(2000, 10, 1));
            let date2 = new Date(Date.UTC(2000, 10, 1, 2, 3, 4));
            let date3 = new Date(Date.UTC(2000, 9, 1));
            let date5 = new Date(Date.UTC(2000, 10, 2));
            let date6 = new Date(Date.UTC(2000, 10, 1, 1, 0, 0));
            let date7 = new Date(Date.UTC(2000, 10, 1, 23, 59, 59));
            let date8 = new Date(Date.UTC(2001, 10, 1));
            
            let testItem = new DataTypeServices(); 
            testItem.registerDataTypeConverter(new UTCDateOnlyConverter());
            expect(testItem.compareValues(date1, date1, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, date2, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date2, date1, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date6, date7, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date3, date1, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.LessThan); 
            expect(testItem.compareValues(date1, date3, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.GreaterThan);            
            expect(testItem.compareValues(date6, date5, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.LessThan); 
            expect(testItem.compareValues(date8, date7, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.GreaterThan);            
            // these are due to the DataTypeServices.CompareValues function itself
            expect(testItem.compareValues(null, null, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, null, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Undetermined);
            expect(testItem.compareValues(null, date2, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Undetermined);
        });
    });        
    describe('LocalDateOnlyConverter', () => {
        test('SupportsValue', () => {
            let testItem = new LocalDateOnlyConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.LocalDate)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(false); // always requires LookupKey.LocalDate            
            expect(testItem.supportsValue(0, LookupKey.LocalDate)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.LocalDate)).toBe(false);
        });
        test('Convert', () => {
            let testItem = new LocalDateOnlyConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(2000, 10, 5);
            let test2 = new Date(2023, 0, 1, 4, 30);
            let test2dateonly = new Date(2023, 0, 1);
            expect(testItem.convert(test1, LookupKey.LocalDate)).toBe(test1.getTime());
            expect(testItem.convert(test2, LookupKey.LocalDate)).toBe(test2dateonly.getTime());
            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.LocalDate)).toBeUndefined();
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(2000, 10, 1);
            let date2 = new Date(2000, 10, 1, 2, 3, 4);
            let date3 = new Date(2000, 9, 1);
            let date5 = new Date(2000, 10, 2);
            let date6 = new Date(2000, 10, 1, 1, 0, 0);
            let date7 = new Date(2000, 10, 1, 23, 59, 59);
            let date8 = new Date(2001, 10, 1);
            
            let testItem = new DataTypeServices(); 
            testItem.registerDataTypeConverter(new LocalDateOnlyConverter());
            expect(testItem.compareValues(date1, date1, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, date2, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date2, date1, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date6, date7, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date3, date1, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.LessThan); 
            expect(testItem.compareValues(date1, date3, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.GreaterThan);            
            expect(testItem.compareValues(date6, date5, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.LessThan); 
            expect(testItem.compareValues(date8, date7, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.GreaterThan);            
            // these are due to the DataTypeServices.CompareValues function itself
            expect(testItem.compareValues(null, null, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, null, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.Undetermined);
            expect(testItem.compareValues(null, date2, LookupKey.LocalDate, LookupKey.LocalDate)).toBe(ComparersResult.Undetermined);
        });
    });         
    describe('TimeOfDayOnlyConverter', () => {
        test('SupportsValue', () => {
            let testItem = new TimeOfDayOnlyConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.TimeOfDay)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(false);            
            expect(testItem.supportsValue(0, LookupKey.TimeOfDay)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.TimeOfDay)).toBe(false);
        });
        test('Convert', () => {
            let testItem = new TimeOfDayOnlyConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let expectedTest1 = 0;
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30, 2));
            let expectedTest2 = 4 * 60 + 30;
            expect(testItem.convert(test1, LookupKey.TimeOfDay)).toBe(expectedTest1);
            expect(testItem.convert(test2, LookupKey.TimeOfDay)).toBe(expectedTest2);

            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.TimeOfDay)).toBeUndefined();            
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(Date.UTC(2000, 10, 1));
            let date2 = new Date(Date.UTC(2000, 10, 1, 2, 3, 4));
            
            let testItem = new DataTypeServices(); 
            testItem.registerDataTypeConverter(new TimeOfDayOnlyConverter());
            expect(testItem.compareValues(date1, date1, LookupKey.TimeOfDay, LookupKey.TimeOfDay)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, date2, LookupKey.TimeOfDay, LookupKey.TimeOfDay)).toBe(ComparersResult.LessThan);
            expect(testItem.compareValues(date2, date1, LookupKey.TimeOfDay, LookupKey.TimeOfDay)).toBe(ComparersResult.GreaterThan);
            // these are due to the DataTypeServices.CompareValues function itself
            expect(testItem.compareValues(null, null, LookupKey.TimeOfDay, LookupKey.TimeOfDay)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, null, LookupKey.TimeOfDay, LookupKey.TimeOfDay)).toBe(ComparersResult.Undetermined);
            expect(testItem.compareValues(null, date2, LookupKey.TimeOfDay, LookupKey.TimeOfDay)).toBe(ComparersResult.Undetermined);
            
        });
    });    
    describe('TimeOfDayHMSOnlyConverter', () => {
        test('SupportsValue', () => {
            let testItem = new TimeOfDayHMSOnlyConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.TimeOfDayHMS)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(false);            
            expect(testItem.supportsValue(0, LookupKey.TimeOfDayHMS)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.TimeOfDayHMS)).toBe(false);
        });
        test('Convert', () => {
            let testItem = new TimeOfDayHMSOnlyConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let expectedTest1 = 0;
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30, 2));
            let expectedTest2 = 4 * 60 * 60 + 30 * 60 + 2;    
            expect(testItem.convert(test1, LookupKey.TimeOfDayHMS)).toBe(expectedTest1);
            expect(testItem.convert(test2, LookupKey.TimeOfDayHMS)).toBe(expectedTest2);

            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.TimeOfDayHMS)).toBeUndefined();            
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(Date.UTC(2000, 10, 1));
            let date2 = new Date(Date.UTC(2000, 10, 1, 2, 3, 4));
            let date3 = new Date(Date.UTC(2023, 0, 1, 4, 30, 5));      

            let testItem = new DataTypeServices(); 
            testItem.registerDataTypeConverter(new TimeOfDayHMSOnlyConverter());
            expect(testItem.compareValues(date1, date1, LookupKey.TimeOfDayHMS, LookupKey.TimeOfDayHMS)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, date2, LookupKey.TimeOfDayHMS, LookupKey.TimeOfDayHMS)).toBe(ComparersResult.LessThan);
            expect(testItem.compareValues(date2, date1, LookupKey.TimeOfDayHMS, LookupKey.TimeOfDayHMS)).toBe(ComparersResult.GreaterThan);
            expect(testItem.compareValues(date2, date3, LookupKey.TimeOfDayHMS, LookupKey.TimeOfDayHMS)).toBe(ComparersResult.LessThan);
            expect(testItem.compareValues(date3, date2, LookupKey.TimeOfDayHMS, LookupKey.TimeOfDayHMS)).toBe(ComparersResult.GreaterThan);
           // these are due to the DataTypeServices.CompareValues function itself
            expect(testItem.compareValues(null, null, LookupKey.TimeOfDayHMS, LookupKey.TimeOfDayHMS)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, null, LookupKey.TimeOfDayHMS, LookupKey.TimeOfDayHMS)).toBe(ComparersResult.Undetermined);
            expect(testItem.compareValues(null, date2, LookupKey.TimeOfDayHMS, LookupKey.TimeOfDayHMS)).toBe(ComparersResult.Undetermined);
            
        });
    });        
    describe('IntegerConverter', () => {
        test('SupportsValue', () => {
            let testItem = new IntegerConverter();
            expect(testItem.supportsValue(5, LookupKey.Integer)).toBe(true);
            expect(testItem.supportsValue(-5.3, LookupKey.Integer)).toBe(true);
            expect(testItem.supportsValue("", LookupKey.Integer)).toBe(false);
            expect(testItem.supportsValue(5, LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.Integer)).toBe(false);
        });
        test('Convert', () => {
            let testItem = new IntegerConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            expect(testItem.convert(5, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(5.3, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(1.9999, LookupKey.Integer)).toBe(2);
            expect(testItem.convert(-1.9999, LookupKey.Integer)).toBe(-2);
        });
        test('Within DataTypeServices', () => {
            let testItem = new DataTypeServices(); 
            testItem.registerDataTypeConverter(new IntegerConverter());
            expect(testItem.compareValues(10, 10, LookupKey.Integer, LookupKey.Integer)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(4.2, 4, LookupKey.Integer, LookupKey.Integer)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(-6.3, -6, LookupKey.Integer, LookupKey.Integer)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(4, 5, LookupKey.Integer, LookupKey.Integer)).toBe(ComparersResult.LessThan);
        });
    });    
    describe('TotalDaysConverter', () => {
        test('SupportsValue', () => {
            let testItem = new TotalDaysConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.TotalDays)).toBe(true);
            expect(testItem.supportsValue("", LookupKey.TotalDays)).toBe(false);
            expect(testItem.supportsValue("Test", LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(0, LookupKey.TotalDays)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.TotalDays)).toBe(false);
        });
        test('Convert', () => {
            let testItem = new TotalDaysConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let date1 = new Date(Date.UTC(2000, 10, 2));
            let date2 = new Date(Date.UTC(2000, 10, 2, 5, 4, 3));         
            let expected = Math.floor(date1.getTime() / 86400000);
            expect(testItem.convert(date1, LookupKey.TotalDays)).toBe(expected);
            expect(testItem.convert(date2, LookupKey.TotalDays)).toBe(expected);
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(Date.UTC(2000, 10, 2));
            let date2 = new Date(Date.UTC(2000, 10, 2, 5, 4, 3));         
            let date3 = new Date(Date.UTC(2001, 10, 2));
            let testItem = new DataTypeServices(); 
            testItem.registerDataTypeConverter(new TotalDaysConverter());
            expect(testItem.compareValues(date1, date1, LookupKey.TotalDays, LookupKey.TotalDays)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date1, date2, LookupKey.TotalDays, LookupKey.TotalDays)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date2, date1, LookupKey.TotalDays, LookupKey.TotalDays)).toBe(ComparersResult.Equals);
            expect(testItem.compareValues(date2, date3, LookupKey.TotalDays, LookupKey.TotalDays)).toBe(ComparersResult.LessThan);
            expect(testItem.compareValues(date3, date2, LookupKey.TotalDays, LookupKey.TotalDays)).toBe(ComparersResult.GreaterThan);
        });
    });    
});
