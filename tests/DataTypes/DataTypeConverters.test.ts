import { DataTypeServices } from './../../src/DataTypes/DataTypeServices';
import { CaseInsensitiveStringLookupKey, DateLookupKey, DateTimeLookupKey, LocalDateLookupKey, RoundToWholeLookupKey, StringLookupKey, TotalDaysLookupKey } from '../../src/DataTypes/LookupKeys';
import { UTCDateOnlyConverter, DateTimeConverter, LocalDateOnlyConverter, CaseInsensitiveStringConverter, RoundToWholeConverter, TotalDaysConverter } from './../../src/DataTypes/DataTypeConverters';
import { ComparersResult } from '../../src/Interfaces/DataTypes';
describe('DataTypeConverter concrete classes', () => {
    describe('CaseInsensitiveStringConverter', () => {
        test('SupportsValue', () => {
            let testItem = new CaseInsensitiveStringConverter();
            expect(testItem.SupportsValue("Test", CaseInsensitiveStringLookupKey)).toBe(true);
            expect(testItem.SupportsValue("", CaseInsensitiveStringLookupKey)).toBe(true);
            expect(testItem.SupportsValue("Test", StringLookupKey)).toBe(false);
            expect(testItem.SupportsValue(0, CaseInsensitiveStringLookupKey)).toBe(false);
            expect(testItem.SupportsValue(null, CaseInsensitiveStringLookupKey)).toBe(false);
        })
        test('Convert', () => {
            let testItem = new CaseInsensitiveStringConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            expect(testItem.Convert("Test", CaseInsensitiveStringLookupKey)).toBe("test");
            expect(testItem.Convert("", CaseInsensitiveStringLookupKey)).toBe("");
            expect(testItem.Convert("abc", CaseInsensitiveStringLookupKey)).toBe("abc");
        });
        test('Within DataTypeServices', () => {
            let testItem = new DataTypeServices('en'); 
            testItem.RegisterDataTypeConverter(new CaseInsensitiveStringConverter());
            expect(testItem.CompareValues("ABC", "ABC", CaseInsensitiveStringLookupKey, CaseInsensitiveStringLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues("ABC", "abc", CaseInsensitiveStringLookupKey, CaseInsensitiveStringLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues("abc", "ABC", CaseInsensitiveStringLookupKey, CaseInsensitiveStringLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(" ABC", "ABC ", CaseInsensitiveStringLookupKey, CaseInsensitiveStringLookupKey)).toBe(ComparersResult.LessThan);
        });
    });
    describe('DateTimeConverter', () => {
        test('SupportsValue', () => {
            let testItem = new DateTimeConverter();
            expect(testItem.SupportsValue(new Date(), DateTimeLookupKey)).toBe(true);
            expect(testItem.SupportsValue(new Date(), StringLookupKey)).toBe(false);
            expect(testItem.SupportsValue(new Date(), null)).toBe(false);            
            expect(testItem.SupportsValue(0, DateTimeLookupKey)).toBe(false);
            expect(testItem.SupportsValue(null, DateTimeLookupKey)).toBe(false);
        })
        test('Convert', () => {
            let testItem = new DateTimeConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30));
            expect(testItem.Convert(test1, DateTimeLookupKey)).toBe(test1.getTime());
            expect(testItem.Convert(test2, DateTimeLookupKey)).toBe(test2.getTime());

            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.Convert(illegalDate, DateTimeLookupKey)).toBeUndefined();            
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(Date.UTC(2000, 10, 1));
            let date2 = new Date(Date.UTC(2000, 10, 1, 2, 3, 4));
            
            let testItem = new DataTypeServices('en'); 
            testItem.RegisterDataTypeConverter(new DateTimeConverter());
            expect(testItem.CompareValues(date1, date1, DateTimeLookupKey, DateTimeLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date1, date2, DateTimeLookupKey, DateTimeLookupKey)).toBe(ComparersResult.LessThan);
            expect(testItem.CompareValues(date2, date1, DateTimeLookupKey, DateTimeLookupKey)).toBe(ComparersResult.GreaterThan);
            // these are due to the DataTypeServices.CompareValues function itself
            expect(testItem.CompareValues(null, null, DateTimeLookupKey, DateTimeLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date1, null, DateTimeLookupKey, DateTimeLookupKey)).toBe(ComparersResult.Undetermined);
            expect(testItem.CompareValues(null, date2, DateTimeLookupKey, DateTimeLookupKey)).toBe(ComparersResult.Undetermined);
            
        });
    });    
    describe('UTCDateOnlyConverter', () => {
        test('SupportsValue', () => {
            let testItem = new UTCDateOnlyConverter();
            expect(testItem.SupportsValue(new Date(), DateLookupKey)).toBe(true);
            expect(testItem.SupportsValue(new Date(), StringLookupKey)).toBe(false);
            expect(testItem.SupportsValue(new Date(), null)).toBe(true);            
            expect(testItem.SupportsValue(0, DateLookupKey)).toBe(false);
            expect(testItem.SupportsValue(null, DateLookupKey)).toBe(false);
        })
        test('Convert', () => {
            let testItem = new UTCDateOnlyConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30));
            let test2dateonly = new Date(Date.UTC(2023, 0, 1));
            expect(testItem.Convert(test1, DateLookupKey)).toBe(test1.getTime());
            expect(testItem.Convert(test2, DateLookupKey)).toBe(test2dateonly.getTime());
            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.Convert(illegalDate, DateLookupKey)).toBeUndefined();
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(Date.UTC(2000, 10, 1));
            let date2 = new Date(Date.UTC(2000, 10, 1, 2, 3, 4));
            let date3 = new Date(Date.UTC(2000, 9, 1));
            let date5 = new Date(Date.UTC(2000, 10, 2));
            let date6 = new Date(Date.UTC(2000, 10, 1, 1, 0, 0));
            let date7 = new Date(Date.UTC(2000, 10, 1, 23, 59, 59));
            let date8 = new Date(Date.UTC(2001, 10, 1));
            
            let testItem = new DataTypeServices('en'); 
            testItem.RegisterDataTypeConverter(new UTCDateOnlyConverter());
            expect(testItem.CompareValues(date1, date1, DateLookupKey, DateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date1, date2, DateLookupKey, DateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date2, date1, DateLookupKey, DateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date6, date7, DateLookupKey, DateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date3, date1, DateLookupKey, DateLookupKey)).toBe(ComparersResult.LessThan); 
            expect(testItem.CompareValues(date1, date3, DateLookupKey, DateLookupKey)).toBe(ComparersResult.GreaterThan);            
            expect(testItem.CompareValues(date6, date5, DateLookupKey, DateLookupKey)).toBe(ComparersResult.LessThan); 
            expect(testItem.CompareValues(date8, date7, DateLookupKey, DateLookupKey)).toBe(ComparersResult.GreaterThan);            
            // these are due to the DataTypeServices.CompareValues function itself
            expect(testItem.CompareValues(null, null, DateLookupKey, DateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date1, null, DateLookupKey, DateLookupKey)).toBe(ComparersResult.Undetermined);
            expect(testItem.CompareValues(null, date2, DateLookupKey, DateLookupKey)).toBe(ComparersResult.Undetermined);
        });
    });        
    describe('LocalDateOnlyConverter', () => {
        test('SupportsValue', () => {
            let testItem = new LocalDateOnlyConverter();
            expect(testItem.SupportsValue(new Date(), LocalDateLookupKey)).toBe(true);
            expect(testItem.SupportsValue(new Date(), StringLookupKey)).toBe(false);
            expect(testItem.SupportsValue(new Date(), null)).toBe(false); // always requires LocalDateLookupKey            
            expect(testItem.SupportsValue(0, LocalDateLookupKey)).toBe(false);
            expect(testItem.SupportsValue(null, LocalDateLookupKey)).toBe(false);
        })
        test('Convert', () => {
            let testItem = new LocalDateOnlyConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(2000, 10, 5);
            let test2 = new Date(2023, 0, 1, 4, 30);
            let test2dateonly = new Date(2023, 0, 1);
            expect(testItem.Convert(test1, LocalDateLookupKey)).toBe(test1.getTime());
            expect(testItem.Convert(test2, LocalDateLookupKey)).toBe(test2dateonly.getTime());
            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.Convert(illegalDate, LocalDateLookupKey)).toBeUndefined();
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(2000, 10, 1);
            let date2 = new Date(2000, 10, 1, 2, 3, 4);
            let date3 = new Date(2000, 9, 1);
            let date5 = new Date(2000, 10, 2);
            let date6 = new Date(2000, 10, 1, 1, 0, 0);
            let date7 = new Date(2000, 10, 1, 23, 59, 59);
            let date8 = new Date(2001, 10, 1);
            
            let testItem = new DataTypeServices('en'); 
            testItem.RegisterDataTypeConverter(new LocalDateOnlyConverter());
            expect(testItem.CompareValues(date1, date1, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date1, date2, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date2, date1, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date6, date7, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date3, date1, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.LessThan); 
            expect(testItem.CompareValues(date1, date3, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.GreaterThan);            
            expect(testItem.CompareValues(date6, date5, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.LessThan); 
            expect(testItem.CompareValues(date8, date7, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.GreaterThan);            
            // these are due to the DataTypeServices.CompareValues function itself
            expect(testItem.CompareValues(null, null, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date1, null, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.Undetermined);
            expect(testItem.CompareValues(null, date2, LocalDateLookupKey, LocalDateLookupKey)).toBe(ComparersResult.Undetermined);
        });
    });         
    
    describe('RoundToWholeConverter', () => {
        test('SupportsValue', () => {
            let testItem = new RoundToWholeConverter();
            expect(testItem.SupportsValue(5, RoundToWholeLookupKey)).toBe(true);
            expect(testItem.SupportsValue(-5.3, RoundToWholeLookupKey)).toBe(true);
            expect(testItem.SupportsValue("", RoundToWholeLookupKey)).toBe(false);
            expect(testItem.SupportsValue(5, StringLookupKey)).toBe(false);
            expect(testItem.SupportsValue(null, RoundToWholeLookupKey)).toBe(false);
        })
        test('Convert', () => {
            let testItem = new RoundToWholeConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            expect(testItem.Convert(5, RoundToWholeLookupKey)).toBe(5);
            expect(testItem.Convert(5.3, RoundToWholeLookupKey)).toBe(5);
            expect(testItem.Convert(1.9999, RoundToWholeLookupKey)).toBe(2);
            expect(testItem.Convert(-1.9999, RoundToWholeLookupKey)).toBe(-2);
        });
        test('Within DataTypeServices', () => {
            let testItem = new DataTypeServices('en'); 
            testItem.RegisterDataTypeConverter(new RoundToWholeConverter());
            expect(testItem.CompareValues(10, 10, RoundToWholeLookupKey, RoundToWholeLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(4.2, 4, RoundToWholeLookupKey, RoundToWholeLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(-6.3, -6, RoundToWholeLookupKey, RoundToWholeLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(4, 5, RoundToWholeLookupKey, RoundToWholeLookupKey)).toBe(ComparersResult.LessThan);
        });
    });    
    describe('TotalDaysConverter', () => {
        test('SupportsValue', () => {
            let testItem = new TotalDaysConverter();
            expect(testItem.SupportsValue(new Date(), TotalDaysLookupKey)).toBe(true);
            expect(testItem.SupportsValue("", TotalDaysLookupKey)).toBe(false);
            expect(testItem.SupportsValue("Test", StringLookupKey)).toBe(false);
            expect(testItem.SupportsValue(0, TotalDaysLookupKey)).toBe(false);
            expect(testItem.SupportsValue(null, TotalDaysLookupKey)).toBe(false);
        })
        test('Convert', () => {
            let testItem = new TotalDaysConverter();
            // Convert expects to be called after SupportsValue is true.
            // So no illegal values as parameters tested
            let date1 = new Date(Date.UTC(2000, 10, 2));
            let date2 = new Date(Date.UTC(2000, 10, 2, 5, 4, 3));         
            let expected = Math.floor(date1.getTime() / 86400000);
            expect(testItem.Convert(date1, TotalDaysLookupKey)).toBe(expected);
            expect(testItem.Convert(date2, TotalDaysLookupKey)).toBe(expected);
        });
        test('Within DataTypeServices', () => {
            let date1 = new Date(Date.UTC(2000, 10, 2));
            let date2 = new Date(Date.UTC(2000, 10, 2, 5, 4, 3));         
            let date3 = new Date(Date.UTC(2001, 10, 2));
            let testItem = new DataTypeServices('en'); 
            testItem.RegisterDataTypeConverter(new TotalDaysConverter());
            expect(testItem.CompareValues(date1, date1, TotalDaysLookupKey, TotalDaysLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date1, date2, TotalDaysLookupKey, TotalDaysLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date2, date1, TotalDaysLookupKey, TotalDaysLookupKey)).toBe(ComparersResult.Equals);
            expect(testItem.CompareValues(date2, date3, TotalDaysLookupKey, TotalDaysLookupKey)).toBe(ComparersResult.LessThan);
            expect(testItem.CompareValues(date3, date2, TotalDaysLookupKey, TotalDaysLookupKey)).toBe(ComparersResult.GreaterThan);
        });
    });    
});
