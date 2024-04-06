import {
    UTCDateOnlyConverter, DateTimeConverter, LocalDateOnlyConverter, CaseInsensitiveStringConverter,
    TotalDaysConverter, IntegerConverter, TimeOfDayOnlyConverter, TimeOfDayHMSOnlyConverter
} from './../../src/DataTypes/DataTypeConverters';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { MockValidationServices } from '../TestSupport/mocks';
import { DataTypeComparerService } from '../../src/Services/DataTypeComparerService';
describe('DataTypeConverter concrete classes', () => {
    describe('CaseInsensitiveStringConverter', () => {
        test('supportsValue', () => {
            let testItem = new CaseInsensitiveStringConverter();
            expect(testItem.supportsValue("Test", LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.supportsValue("", LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.supportsValue("Test", LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(0, LookupKey.CaseInsensitive)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.CaseInsensitive)).toBe(false);
        });
        test('convert', () => {
            let testItem = new CaseInsensitiveStringConverter();
            // convert expects to be called after supportsValue is true.
            // So no illegal values as parameters tested
            expect(testItem.convert("Test", LookupKey.CaseInsensitive)).toBe("test");
            expect(testItem.convert("", LookupKey.CaseInsensitive)).toBe("");
            expect(testItem.convert("abc", LookupKey.CaseInsensitive)).toBe("abc");
        });
        test('Within DataTypeComparerService', () => {
            let vs = new MockValidationServices(false, false);
            let testItem = new DataTypeComparerService(); 
        
         });
    });
    describe('DateTimeConverter', () => {
        test('supportsValue', () => {
            let testItem = new DateTimeConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.DateTime)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(false);            
            expect(testItem.supportsValue(0, LookupKey.DateTime)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.DateTime)).toBe(false);
        });
        test('convert', () => {
            let testItem = new DateTimeConverter();
            // convert expects to be called after supportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30));
            expect(testItem.convert(test1, LookupKey.DateTime)).toBe(test1.getTime());
            expect(testItem.convert(test2, LookupKey.DateTime)).toBe(test2.getTime());

            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.DateTime)).toBeUndefined();            
        });
    });    
    describe('UTCDateOnlyConverter', () => {
        test('supportsValue', () => {
            let testItem = new UTCDateOnlyConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.Date)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(true);            
            expect(testItem.supportsValue(0, LookupKey.Date)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.Date)).toBe(false);
        });
        test('convert', () => {
            let testItem = new UTCDateOnlyConverter();
            // convert expects to be called after supportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(1970, 0, 1));
            let test2 = new Date(Date.UTC(1970, 0, 2, 4, 30));
            let test3 = new Date(Date.UTC(1970, 0, 2));
            let test4 = new Date(Date.UTC(1969, 11, 31));
            let test5 = new Date(Date.UTC(1969, 11, 31, 23, 59, 59));
            let test6 = new Date(Date.UTC(1971, 0, 1));            
            let test7 = new Date(Date.UTC(1970, 11, 31));
            let test8 = new Date(Date.UTC(1972, 2, 1)); // leap year, one day after leap day
            let test9 = new Date(Date.UTC(1972, 1, 28)); // leap year, one day before leap day
            let test10 = new Date(Date.UTC(1972, 1, 29)); // leap year, leap day
            expect(testItem.convert(test1, LookupKey.Date)).toBe(0);
            expect(testItem.convert(test2, LookupKey.Date)).toBe(1);
            expect(testItem.convert(test3, LookupKey.Date)).toBe(1);           
            expect(testItem.convert(test4, LookupKey.Date)).toBe(-1);   
            expect(testItem.convert(test5, LookupKey.Date)).toBe(-1);           
            expect(testItem.convert(test7, LookupKey.Date)).toBe(364);           
            expect(testItem.convert(test6, LookupKey.Date)).toBe(365);           
            expect(testItem.convert(test8, LookupKey.Date)).toBe(365 + 365 + 31 /* jan */ + 29 /* leap feb */);           
            expect(testItem.convert(test9, LookupKey.Date)).toBe(365 + 365 + 31 /* jan */ + 27);           
            expect(testItem.convert(test10, LookupKey.Date)).toBe(365 + 365 + 31 /* jan */ + 28);           
            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.Date)).toBeUndefined();
        });
    });        
    describe('LocalDateOnlyConverter', () => {
        test('supportsValue', () => {
            let testItem = new LocalDateOnlyConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.LocalDate)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(false); // always requires LookupKey.LocalDate            
            expect(testItem.supportsValue(0, LookupKey.LocalDate)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.LocalDate)).toBe(false);
        });
        test('convert', () => {
            let testItem = new LocalDateOnlyConverter();
            // convert expects to be called after supportsValue is true.
            // So no illegal values as parameters tested
            // Convert returns a total number of days since Jan 1, 1970, which equals 0.
            // Thus the test data.
            let test1 = new Date(1970, 0, 1);
            let test2 = new Date(1970, 0, 2, 4, 30);
            let test3 = new Date(1970, 0, 2);
            let test4 = new Date(1969, 11, 31);
            let test5 = new Date(1969, 11, 31, 23, 59, 59);
            let test6 = new Date(1971, 0, 1);            
            let test7 = new Date(1970, 11, 31);            
            let test8 = new Date(1972, 2, 1); // leap year, one day after leap day
            let test9 = new Date(1972, 1, 28); // leap year, one day before leap day
            let test10 = new Date(1972, 1, 29); // leap year, leap day            
            expect(testItem.convert(test1, LookupKey.LocalDate)).toBe(0);
            expect(testItem.convert(test2, LookupKey.LocalDate)).toBe(1);
            expect(testItem.convert(test3, LookupKey.LocalDate)).toBe(1);           
            expect(testItem.convert(test4, LookupKey.LocalDate)).toBe(-1);   
            expect(testItem.convert(test5, LookupKey.LocalDate)).toBe(-1);     
            expect(testItem.convert(test7, LookupKey.LocalDate)).toBe(364);           
            expect(testItem.convert(test6, LookupKey.LocalDate)).toBe(365);        
            expect(testItem.convert(test8, LookupKey.LocalDate)).toBe(365 + 365 + 31 /* jan */ + 29 /* leap feb */);           
            expect(testItem.convert(test9, LookupKey.LocalDate)).toBe(365 + 365 + 31 /* jan */ + 27);           
            expect(testItem.convert(test10, LookupKey.LocalDate)).toBe(365 + 365 + 31 /* jan */ + 28);                 
            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.LocalDate)).toBeUndefined();
        });
    });         
    describe('TimeOfDayOnlyConverter', () => {
        test('supportsValue', () => {
            let testItem = new TimeOfDayOnlyConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.TimeOfDay)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(false);            
            expect(testItem.supportsValue(0, LookupKey.TimeOfDay)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.TimeOfDay)).toBe(false);
        });
        test('convert', () => {
            let testItem = new TimeOfDayOnlyConverter();
            // convert expects to be called after supportsValue is true.
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
    });    
    describe('TimeOfDayHMSOnlyConverter', () => {
        test('supportsValue', () => {
            let testItem = new TimeOfDayHMSOnlyConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.TimeOfDayHMS)).toBe(true);
            expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(new Date(), null)).toBe(false);            
            expect(testItem.supportsValue(0, LookupKey.TimeOfDayHMS)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.TimeOfDayHMS)).toBe(false);
        });
        test('convert', () => {
            let testItem = new TimeOfDayHMSOnlyConverter();
            // convert expects to be called after supportsValue is true.
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
    });        
    describe('IntegerConverter', () => {
        test('supportsValue', () => {
            let testItem = new IntegerConverter();
            expect(testItem.supportsValue(5, LookupKey.Integer)).toBe(true);
            expect(testItem.supportsValue(-5.3, LookupKey.Integer)).toBe(true);
            expect(testItem.supportsValue("", LookupKey.Integer)).toBe(false);
            expect(testItem.supportsValue(5, LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.Integer)).toBe(false);
        });
        test('convert', () => {
            let testItem = new IntegerConverter();
            // convert expects to be called after supportsValue is true.
            // So no illegal values as parameters tested
            expect(testItem.convert(5, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(5.3, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(1.9999, LookupKey.Integer)).toBe(2);
            expect(testItem.convert(-1.9999, LookupKey.Integer)).toBe(-2);
        });
    });    
    describe('TotalDaysConverter', () => {
        test('supportsValue', () => {
            let testItem = new TotalDaysConverter();
            expect(testItem.supportsValue(new Date(), LookupKey.TotalDays)).toBe(true);
            expect(testItem.supportsValue("", LookupKey.TotalDays)).toBe(false);
            expect(testItem.supportsValue("Test", LookupKey.String)).toBe(false);
            expect(testItem.supportsValue(0, LookupKey.TotalDays)).toBe(false);
            expect(testItem.supportsValue(null, LookupKey.TotalDays)).toBe(false);
        });
        test('convert', () => {
            let testItem = new TotalDaysConverter();
            // convert expects to be called after supportsValue is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(1970, 0, 1));
            let test2 = new Date(Date.UTC(1970, 0, 2, 4, 30));
            let test3 = new Date(Date.UTC(1970, 0, 2));
            let test4 = new Date(Date.UTC(1969, 11, 31));
            let test5 = new Date(Date.UTC(1969, 11, 31, 23, 59, 59));
            let test6 = new Date(Date.UTC(1971, 0, 1));            
            let test7 = new Date(Date.UTC(1970, 11, 31));         
            let test8 = new Date(Date.UTC(1972, 2, 1)); // leap year, one day after leap day
            let test9 = new Date(Date.UTC(1972, 1, 28)); // leap year, one day before leap day
            let test10 = new Date(Date.UTC(1972, 1, 29)); // leap year, leap day
            expect(testItem.convert(test1, LookupKey.TotalDays)).toBe(0);
            expect(testItem.convert(test2, LookupKey.TotalDays)).toBe(1);
            expect(testItem.convert(test3, LookupKey.TotalDays)).toBe(1);           
            expect(testItem.convert(test4, LookupKey.TotalDays)).toBe(-1);   
            expect(testItem.convert(test5, LookupKey.TotalDays)).toBe(-1);      
            expect(testItem.convert(test7, LookupKey.TotalDays)).toBe(364);           
            expect(testItem.convert(test6, LookupKey.TotalDays)).toBe(365);    
            expect(testItem.convert(test8, LookupKey.TotalDays)).toBe(365 + 365 + 31 /* jan */ + 29 /* leap feb */);           
            expect(testItem.convert(test9, LookupKey.TotalDays)).toBe(365 + 365 + 31 /* jan */ + 27);           
            expect(testItem.convert(test10, LookupKey.TotalDays)).toBe(365 + 365 + 31 /* jan */ + 28);                       
        });
    });    
});
