import {
    UTCDateOnlyConverter, DateTimeConverter, LocalDateOnlyConverter, CaseInsensitiveStringConverter,
    IntegerConverter, TimeOfDayOnlyConverter, TimeOfDayHMSOnlyConverter,
    NumericStringToNumberConverter
} from './../../src/DataTypes/DataTypeConverters';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
describe('DataTypeConverter concrete classes', () => {
    describe('CaseInsensitiveStringConverter', () => {
        test('canConvert', () => {
            let testItem = new CaseInsensitiveStringConverter();
            expect(testItem.canConvert("Test", null, LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.canConvert("", null, LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.canConvert("Test", LookupKey.String, LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.canConvert("Test", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.canConvert("Test", null, LookupKey.Lowercase)).toBe(true);
            expect(testItem.canConvert("Test", LookupKey.String, LookupKey.Lowercase)).toBe(true);
            expect(testItem.canConvert("Test", LookupKey.CaseInsensitive, LookupKey.Lowercase)).toBe(true);

            expect(testItem.canConvert("Test", null, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(0, null, LookupKey.CaseInsensitive)).toBe(false);
            expect(testItem.canConvert(null, null, LookupKey.CaseInsensitive)).toBe(false);

            expect(testItem.canConvert("Test", LookupKey.String, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.String, LookupKey.CaseInsensitive)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.String, LookupKey.CaseInsensitive)).toBe(false);

        });
        test('convert', () => {
            let testItem = new CaseInsensitiveStringConverter();
            // convert expects to be called after canConvert is true.
            // So no illegal values as parameters tested
            expect(testItem.convert("Test", null, LookupKey.CaseInsensitive)).toBe("test");
            expect(testItem.convert("", null, LookupKey.CaseInsensitive)).toBe("");
            expect(testItem.convert("abc", null, LookupKey.CaseInsensitive)).toBe("abc");
            expect(testItem.convert("Test", null, LookupKey.Lowercase)).toBe("test");
            
            expect(testItem.convert("Test", LookupKey.String, LookupKey.CaseInsensitive)).toBe("test");
            expect(testItem.convert("Test", LookupKey.String, LookupKey.Lowercase)).toBe("test");
            expect(testItem.convert("Test", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe("test");
            expect(testItem.convert("Test", LookupKey.CaseInsensitive, LookupKey.Lowercase)).toBe("test");

        });
        test('sourceIsCompatible', () => {
            let testItem = new CaseInsensitiveStringConverter();
            expect(testItem.sourceIsCompatible("Test", null)).toBe(true); 
            expect(testItem.sourceIsCompatible("", null)).toBe(true);
            expect(testItem.sourceIsCompatible("Test", LookupKey.String)).toBe(true);
            expect(testItem.sourceIsCompatible("Test", LookupKey.CaseInsensitive)).toBe(true);
            expect(testItem.sourceIsCompatible("Test", LookupKey.Lowercase)).toBe(true);
            expect(testItem.sourceIsCompatible("Test", LookupKey.Uppercase)).toBe(true);
            expect(testItem.sourceIsCompatible(0, null)).toBe(false);
            expect(testItem.sourceIsCompatible(null, null)).toBe(false);
            expect(testItem.sourceIsCompatible(null, LookupKey.String)).toBe(false);

        });


    });
    describe('DateTimeConverter', () => {
        test('canConvert', () => {
            let testItem = new DateTimeConverter();
            expect(testItem.canConvert(new Date(), LookupKey.DateTime, LookupKey.Number)).toBe(true);
            expect(testItem.canConvert(new Date(), LookupKey.DateTime, LookupKey.Milliseconds)).toBe(true);
            expect(testItem.canConvert(new Date(), LookupKey.String, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.DateTime, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(new Date(), null, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.DateTime, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.DateTime, LookupKey.Number)).toBe(false);
            
        });
        test('convert', () => {
            let testItem = new DateTimeConverter();
            // convert expects to be called after canConvert is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30));
            expect(testItem.convert(test1, LookupKey.DateTime, LookupKey.Number)).toBe(test1.getTime());
            expect(testItem.convert(test2, LookupKey.DateTime, LookupKey.Number)).toBe(test2.getTime());
            expect(testItem.convert(test1, LookupKey.DateTime, LookupKey.Milliseconds)).toBe(test1.getTime());
            expect(testItem.convert(test2, LookupKey.DateTime, LookupKey.Milliseconds)).toBe(test2.getTime());


            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.DateTime, LookupKey.Number)).toBeUndefined();   
            expect(testItem.convert(illegalDate, LookupKey.DateTime, LookupKey.Milliseconds)).toBeUndefined();
        });
        test('sourceIsCompatible', () => {
            let testItem = new DateTimeConverter();
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.DateTime)).toBe(true);

            expect(testItem.sourceIsCompatible(new Date(), null)).toBe(false); 
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.LocalDate)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDay)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDayHMS)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Number)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.sourceIsCompatible(0, LookupKey.DateTime)).toBe(false);
            expect(testItem.sourceIsCompatible(null, LookupKey.DateTime)).toBe(false);
        });
    });    
    describe('UTCDateOnlyConverter', () => {
        test('canConvert', () => {
            let testItem = new UTCDateOnlyConverter();
            expect(testItem.canConvert(new Date(), LookupKey.Date, LookupKey.Number)).toBe(true);
            expect(testItem.canConvert(new Date(), LookupKey.Date, LookupKey.TotalDays)).toBe(true);
            expect(testItem.canConvert(new Date(), null, LookupKey.Number)).toBe(true);
            expect(testItem.canConvert(new Date(), null, LookupKey.TotalDays)).toBe(true);
            expect(testItem.canConvert(new Date(), LookupKey.Date, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.String, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.Date, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.Date, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.Date, LookupKey.Number)).toBe(false);
            
        });
        test('convert', () => {
            let testItem = new UTCDateOnlyConverter();
            // convert expects to be called after canConvert is true.
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
            expect(testItem.convert(test1, null, LookupKey.Date)).toBe(0);
            expect(testItem.convert(test2, null, LookupKey.Date)).toBe(1);
            expect(testItem.convert(test3, null, LookupKey.Date)).toBe(1);           
            expect(testItem.convert(test4, null, LookupKey.Date)).toBe(-1);   
            expect(testItem.convert(test5, null, LookupKey.Date)).toBe(-1);           
            expect(testItem.convert(test7, null, LookupKey.Date)).toBe(364);           
            expect(testItem.convert(test6, null, LookupKey.Date)).toBe(365);           
            expect(testItem.convert(test8, null, LookupKey.Date)).toBe(365 + 365 + 31 /* jan */ + 29 /* leap feb */);           
            expect(testItem.convert(test9, null, LookupKey.Date)).toBe(365 + 365 + 31 /* jan */ + 27);           
            expect(testItem.convert(test10, null, LookupKey.Date)).toBe(365 + 365 + 31 /* jan */ + 28);   
            
            expect(testItem.convert(test1, null, LookupKey.Number)).toBe(0);
            expect(testItem.convert(test2, null, LookupKey.Number)).toBe(1);
            expect(testItem.convert(test3, null, LookupKey.Number)).toBe(1);
            expect(testItem.convert(test4, null, LookupKey.Number)).toBe(-1);
            expect(testItem.convert(test5, null, LookupKey.Number)).toBe(-1);
            expect(testItem.convert(test7, null, LookupKey.Number)).toBe(364);
            expect(testItem.convert(test6, null, LookupKey.Number)).toBe(365);
            expect(testItem.convert(test8, null, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 29 /* leap feb */);
            expect(testItem.convert(test9, null, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 27);
            expect(testItem.convert(test10, null, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 28);
            expect(testItem.convert(test1, null, LookupKey.TotalDays)).toBe(0);
            expect(testItem.convert(test2, null, LookupKey.TotalDays)).toBe(1);
            expect(testItem.convert(test1, LookupKey.Date, LookupKey.Number)).toBe(0);
            expect(testItem.convert(test2, LookupKey.Date, LookupKey.Number)).toBe(1);
            expect(testItem.convert(test3, LookupKey.Date, LookupKey.Number)).toBe(1);
            expect(testItem.convert(test4, LookupKey.Date, LookupKey.Number)).toBe(-1);
            expect(testItem.convert(test5, LookupKey.Date, LookupKey.Number)).toBe(-1);
            expect(testItem.convert(test7, LookupKey.Date, LookupKey.Number)).toBe(364);
            expect(testItem.convert(test6, LookupKey.Date, LookupKey.Number)).toBe(365);
            expect(testItem.convert(test8, LookupKey.Date, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 29 /* leap feb */);
            expect(testItem.convert(test9, LookupKey.Date, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 27);
            expect(testItem.convert(test10, LookupKey.Date, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 28);
            expect(testItem.convert(test1, LookupKey.Date, LookupKey.TotalDays)).toBe(0);
            expect(testItem.convert(test2, LookupKey.Date, LookupKey.TotalDays)).toBe(1);

            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, null, LookupKey.Number)).toBeUndefined();
            expect(testItem.convert(illegalDate, LookupKey.Date, LookupKey.Number)).toBeUndefined();
            expect(testItem.convert(illegalDate, LookupKey.Date, LookupKey.TotalDays)).toBeUndefined();
        });
        test('sourceIsCompatible', () => {
            let testItem = new UTCDateOnlyConverter();
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Date)).toBe(true);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.LocalDate)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDay)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDayHMS)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Number)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.sourceIsCompatible(0, LookupKey.Date)).toBe(false);
            expect(testItem.sourceIsCompatible(null, LookupKey.Date)).toBe(false);
        });
    });        
    describe('LocalDateOnlyConverter', () => {
        test('canConvert', () => {
            let testItem = new LocalDateOnlyConverter();
            expect(testItem.canConvert(new Date(), LookupKey.LocalDate, LookupKey.Number)).toBe(true);
            expect(testItem.canConvert(new Date(), LookupKey.LocalDate, LookupKey.TotalDays)).toBe(true);
            expect(testItem.canConvert(new Date(), null, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(new Date(), null, LookupKey.TotalDays)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.LocalDate, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.String, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.LocalDate, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.LocalDate, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.LocalDate, LookupKey.Number)).toBe(false);

        });
        test('convert', () => {
            let testItem = new LocalDateOnlyConverter();
            // convert expects to be called after canConvert is true.
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
            expect(testItem.convert(test1, LookupKey.LocalDate, LookupKey.Number)).toBe(0);
            expect(testItem.convert(test2, LookupKey.LocalDate, LookupKey.Number)).toBe(1);
            expect(testItem.convert(test3, LookupKey.LocalDate, LookupKey.Number)).toBe(1);
            expect(testItem.convert(test4, LookupKey.LocalDate, LookupKey.Number)).toBe(-1);
            expect(testItem.convert(test5, LookupKey.LocalDate, LookupKey.Number)).toBe(-1);
            expect(testItem.convert(test7, LookupKey.LocalDate, LookupKey.Number)).toBe(364);
            expect(testItem.convert(test6, LookupKey.LocalDate, LookupKey.Number)).toBe(365);
            expect(testItem.convert(test8, LookupKey.LocalDate, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 29 /* leap feb */);
            expect(testItem.convert(test9, LookupKey.LocalDate, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 27);
            expect(testItem.convert(test10, LookupKey.LocalDate, LookupKey.Number)).toBe(365 + 365 + 31 /* jan */ + 28);
            expect(testItem.convert(test1, LookupKey.LocalDate, LookupKey.TotalDays)).toBe(0);
            expect(testItem.convert(test2, LookupKey.LocalDate, LookupKey.TotalDays)).toBe(1);

            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, null, LookupKey.Number)).toBeUndefined();
            expect(testItem.convert(illegalDate, LookupKey.LocalDate, LookupKey.Number)).toBeUndefined();
            expect(testItem.convert(illegalDate, LookupKey.LocalDate, LookupKey.TotalDays)).toBeUndefined();
        });
        test('sourceIsCompatible', () => {
            let testItem = new LocalDateOnlyConverter();
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.LocalDate)).toBe(true);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Date)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDay)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDayHMS)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Number)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.sourceIsCompatible(0, LookupKey.LocalDate)).toBe(false);
            expect(testItem.sourceIsCompatible(null, LookupKey.LocalDate)).toBe(false);
        });
    });         
    describe('TimeOfDayOnlyConverter', () => {
        test('canConvert', () => {
            let testItem = new TimeOfDayOnlyConverter();
            expect(testItem.canConvert(new Date(), LookupKey.TimeOfDay, LookupKey.Number)).toBe(true);
            expect(testItem.canConvert(new Date(), LookupKey.TimeOfDay, LookupKey.Minutes)).toBe(true);
            expect(testItem.canConvert(new Date(), null, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(new Date(), null, LookupKey.Minutes)).toBe(false);
            expect(testItem.canConvert(new Date(), null, LookupKey.TotalDays)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.TimeOfDay, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.String, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.String, LookupKey.Minutes)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.TimeOfDay, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.TimeOfDay, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.TimeOfDay, LookupKey.Minutes)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.TimeOfDay, LookupKey.Minutes)).toBe(false);
        });
        test('convert', () => {
            let testItem = new TimeOfDayOnlyConverter();
            // convert expects to be called after canConvert is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let expectedTest1 = 0;
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30, 2));
            let expectedTest2 = 4 * 60 + 30;
            expect(testItem.convert(test1, LookupKey.TimeOfDay, LookupKey.Number)).toBe(expectedTest1);
            expect(testItem.convert(test2, LookupKey.TimeOfDay, LookupKey.Number)).toBe(expectedTest2);
            expect(testItem.convert(test1, LookupKey.TimeOfDay, LookupKey.Minutes)).toBe(expectedTest1);
            expect(testItem.convert(test2, LookupKey.TimeOfDay, LookupKey.Minutes)).toBe(expectedTest2);


            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.TimeOfDay, LookupKey.Number)).toBeUndefined();    
            expect(testItem.convert(illegalDate, LookupKey.TimeOfDay, LookupKey.Minutes)).toBeUndefined();
            
        });
        test('sourceIsCompatible', () => {
            let testItem = new TimeOfDayOnlyConverter();
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDay)).toBe(true);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Date)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.LocalDate)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDayHMS)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Number)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.sourceIsCompatible(0, LookupKey.TimeOfDay)).toBe(false);
            expect(testItem.sourceIsCompatible(null, LookupKey.TimeOfDay)).toBe(false);
        });
    });    
    describe('TimeOfDayHMSOnlyConverter', () => {
        test('canConvert', () => {
            let testItem = new TimeOfDayHMSOnlyConverter();
            expect(testItem.canConvert(new Date(), LookupKey.TimeOfDayHMS, LookupKey.Number)).toBe(true);
            expect(testItem.canConvert(new Date(), LookupKey.TimeOfDayHMS, LookupKey.Seconds)).toBe(true);
            expect(testItem.canConvert(new Date(), null, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(new Date(), null, LookupKey.Seconds)).toBe(false);
            expect(testItem.canConvert(new Date(), null, LookupKey.TotalDays)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.TimeOfDayHMS, LookupKey.String)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.String, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(new Date(), LookupKey.String, LookupKey.Seconds)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.TimeOfDayHMS, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.TimeOfDayHMS, LookupKey.Number)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.TimeOfDayHMS, LookupKey.Seconds)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.TimeOfDayHMS, LookupKey.Seconds)).toBe(false);
        });
        test('convert', () => {
            let testItem = new TimeOfDayHMSOnlyConverter();
            // convert expects to be called after canConvert is true.
            // So no illegal values as parameters tested
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let expectedTest1 = 0;
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30, 2));
            let expectedTest2 = 4 * 60 * 60 + 30 * 60 + 2;    
            expect(testItem.convert(test1, LookupKey.TimeOfDayHMS, LookupKey.Number)).toBe(expectedTest1);
            expect(testItem.convert(test2, LookupKey.TimeOfDayHMS, LookupKey.Number)).toBe(expectedTest2);
            expect(testItem.convert(test1, LookupKey.TimeOfDayHMS, LookupKey.Seconds)).toBe(expectedTest1);
            expect(testItem.convert(test2, LookupKey.TimeOfDayHMS, LookupKey.Seconds)).toBe(expectedTest2);


            // dates with an illegal value will convert to undefined
            let illegalDate = new Date("foo");
            expect(testItem.convert(illegalDate, LookupKey.TimeOfDayHMS, LookupKey.Number)).toBeUndefined();            
            expect(testItem.convert(illegalDate, LookupKey.TimeOfDayHMS, LookupKey.Seconds)).toBeUndefined();
        });
        test('sourceIsCompatible', () => {
            let testItem = new TimeOfDayHMSOnlyConverter();
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDayHMS)).toBe(true);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Date)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.LocalDate)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.TimeOfDay)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.Number)).toBe(false);
            expect(testItem.sourceIsCompatible(new Date(), LookupKey.String)).toBe(false);
            expect(testItem.sourceIsCompatible(0, LookupKey.TimeOfDayHMS)).toBe(false);
            expect(testItem.sourceIsCompatible(null, LookupKey.TimeOfDayHMS)).toBe(false);
        });
    });        
    describe('IntegerConverter', () => {
        test('canConvert', () => {
            let testItem = new IntegerConverter();
            expect(testItem.canConvert(5, LookupKey.Number, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(5.3, LookupKey.Number, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(1.9999, LookupKey.Number, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(-1.9999, LookupKey.Number, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(0, LookupKey.Number, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(null, LookupKey.Number, LookupKey.Integer)).toBe(false);
            expect(testItem.canConvert(5, LookupKey.Currency, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(5, LookupKey.Percentage, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(5, LookupKey.Percentage100, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(5, LookupKey.Integer, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(5, null, LookupKey.Integer)).toBe(true);
            expect(testItem.canConvert(5.3, null, LookupKey.Integer)).toBe(true);


            expect(testItem.canConvert("", LookupKey.String, LookupKey.Integer)).toBe(false);
            expect(testItem.canConvert("Test", LookupKey.String, LookupKey.Integer)).toBe(false);
            expect(testItem.canConvert(0, LookupKey.String, LookupKey.Integer)).toBe(false);
            expect(testItem.canConvert(null, LookupKey.String, LookupKey.Integer)).toBe(false);
            expect(testItem.canConvert(6, LookupKey.Number, LookupKey.LongDate)).toBe(false);
            expect(testItem.canConvert(6, LookupKey.Number, LookupKey.String)).toBe(false);
        });
        test('convert', () => {
            let testItem = new IntegerConverter();
            // convert expects to be called after canConvert is true.
            // So no illegal values as parameters tested
            expect(testItem.convert(5, LookupKey.Number, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(5.3, LookupKey.Number, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(1.9999, LookupKey.Number, LookupKey.Integer)).toBe(1);
            expect(testItem.convert(-1.9999, LookupKey.Number, LookupKey.Integer)).toBe(-1);
            expect(testItem.convert(0, LookupKey.Number, LookupKey.Integer)).toBe(0);
            expect(testItem.convert(5, LookupKey.Integer, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(5.3, LookupKey.Integer, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(1.9999, LookupKey.Integer, LookupKey.Integer)).toBe(1);
            expect(testItem.convert(-1.9999, LookupKey.Integer, LookupKey.Integer)).toBe(-1);

            expect(testItem.convert(5, null, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(5.3, null, LookupKey.Integer)).toBe(5);

            expect(testItem.convert(5, LookupKey.Currency, LookupKey.Integer)).toBe(5);
            expect(testItem.convert(5, LookupKey.Percentage, LookupKey.Integer)).toBe(500);
            expect(testItem.convert(5, LookupKey.Percentage100, LookupKey.Integer)).toBe(5);

            // NaN will convert to undefined
            expect(testItem.convert(NaN, LookupKey.Number, LookupKey.Integer)).toBeUndefined();
            expect(testItem.convert(NaN, LookupKey.Integer, LookupKey.Integer)).toBeUndefined();
            expect(testItem.convert(NaN, LookupKey.Currency, LookupKey.Integer)).toBeUndefined();
            expect(testItem.convert(NaN, LookupKey.Percentage, LookupKey.Integer)).toBeUndefined();
            expect(testItem.convert(NaN, LookupKey.Percentage100, LookupKey.Integer)).toBeUndefined();
        });
        test('sourceIsCompatible', () => {
            let testItem = new IntegerConverter();
            expect(testItem.sourceIsCompatible(5, LookupKey.Number)).toBe(true);
            expect(testItem.sourceIsCompatible(5.3, LookupKey.Number)).toBe(true);
            expect(testItem.sourceIsCompatible(-1.9999, LookupKey.Number)).toBe(true);
            expect(testItem.sourceIsCompatible(0, LookupKey.Number)).toBe(true);
            expect(testItem.sourceIsCompatible(null, LookupKey.Number)).toBe(false);
            expect(testItem.sourceIsCompatible(5, LookupKey.Currency)).toBe(true);
            expect(testItem.sourceIsCompatible(5, LookupKey.Percentage)).toBe(true);
            expect(testItem.sourceIsCompatible(5, LookupKey.Percentage100)).toBe(true);
            expect(testItem.sourceIsCompatible(5, LookupKey.Integer)).toBe(true);
            expect(testItem.sourceIsCompatible(5, null)).toBe(true);

            expect(testItem.sourceIsCompatible("", LookupKey.String)).toBe(false);
            expect(testItem.sourceIsCompatible(0, LookupKey.String)).toBe(false);
            expect(testItem.sourceIsCompatible(null, LookupKey.String)).toBe(false);
            expect(testItem.sourceIsCompatible(6, LookupKey.LongDate)).toBe(false);
            expect(testItem.sourceIsCompatible(6, LookupKey.String)).toBe(false);
        });
    });    
});

// create test cases for NumericStringToNumberConverter
describe('NumericStringToNumberConverter', () => {
    test('canConvert', () => {
        let testItem = new NumericStringToNumberConverter();
        expect(testItem.canConvert("5", LookupKey.String, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("5.3", LookupKey.String, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("1.9999", LookupKey.String, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("-1.9999", LookupKey.String, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("0", LookupKey.String, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("5", LookupKey.String, LookupKey.Integer)).toBe(true);
        expect(testItem.canConvert("5.3", LookupKey.String, LookupKey.Integer)).toBe(true);
        expect(testItem.canConvert("1.9999", LookupKey.String, LookupKey.Integer)).toBe(true);
        expect(testItem.canConvert("-1.9999", LookupKey.String, LookupKey.Integer)).toBe(true);
        expect(testItem.canConvert("0", LookupKey.String, LookupKey.Integer)).toBe(true);
        expect(testItem.canConvert("5", null, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("5.3", null, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("5", null, LookupKey.Integer)).toBe(true);
        expect(testItem.canConvert("5.3", null, LookupKey.Integer)).toBe(true);

        // canConvert permits invalid string values
        expect(testItem.canConvert("", LookupKey.String, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("Test", LookupKey.String, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert("", LookupKey.String, LookupKey.Integer)).toBe(true);
        expect(testItem.canConvert("Test", LookupKey.String, LookupKey.Integer)).toBe(true);        

        // canConvert does not permit non-string values
        expect(testItem.canConvert(0, LookupKey.String, LookupKey.Number)).toBe(false);
        expect(testItem.canConvert(null, LookupKey.String, LookupKey.Number)).toBe(false);
        expect(testItem.canConvert(0, LookupKey.String, LookupKey.Integer)).toBe(false);
        expect(testItem.canConvert(null, LookupKey.String, LookupKey.Integer)).toBe(false);

        // canConvert does not permit non-numeric target values
        expect(testItem.canConvert(6, LookupKey.String, LookupKey.LongDate)).toBe(false);
        expect(testItem.canConvert(6, LookupKey.String, LookupKey.String)).toBe(false);
        expect(testItem.canConvert(6, LookupKey.String, LookupKey.Integer)).toBe(false);
        expect(testItem.canConvert(6, LookupKey.String, LookupKey.String)).toBe(false);
        expect(testItem.canConvert(6, null, LookupKey.Number)).toBe(false);
    });
    test('convert', () => {
        let testItem = new NumericStringToNumberConverter();
        // convert expects to be called after canConvert is true.
        // It rejects bad source and result lookup keys
        // but permits the source value to be any string
        // expecting convert to reject non-numeric strings including empty string.
        expect(testItem.convert("5", LookupKey.String, LookupKey.Number)).toBe(5);
        expect(testItem.convert("5.3", LookupKey.String, LookupKey.Number)).toBe(5.3);
        expect(testItem.convert("1.9999", LookupKey.String, LookupKey.Number)).toBe(1.9999);
        expect(testItem.convert("-1.9999", LookupKey.String, LookupKey.Number)).toBe(-1.9999);
        expect(testItem.convert("0", LookupKey.String, LookupKey.Number)).toBe(0);
        expect(testItem.convert("5", null, LookupKey.Number)).toBe(5);
        expect(testItem.convert("5.3", null, LookupKey.Number)).toBe(5.3);

        expect(testItem.convert("5", LookupKey.String, LookupKey.Integer)).toBe(5);
        expect(testItem.convert("5.3", LookupKey.String, LookupKey.Integer)).toBe(5);
        expect(testItem.convert("1.9999", LookupKey.String, LookupKey.Integer)).toBe(1);
        expect(testItem.convert("-1.9999", LookupKey.String, LookupKey.Integer)).toBe(-1);
        expect(testItem.convert("0", LookupKey.String, LookupKey.Integer)).toBe(0);
        expect(testItem.convert("5", null, LookupKey.Integer)).toBe(5);
        expect(testItem.convert("5.3", null, LookupKey.Integer)).toBe(5);

        // invalid strings will convert to undefined
        expect(testItem.convert("", LookupKey.String, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert("foo", LookupKey.String, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert("bar", LookupKey.String, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert("baz", LookupKey.String, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert("1f", LookupKey.String, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert("1.9.9", LookupKey.String, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert("1-", LookupKey.String, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert(" 1 ", LookupKey.String, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert("", null, LookupKey.Number)).toBeUndefined();
        expect(testItem.convert(".", null, LookupKey.Number)).toBeUndefined();   
        expect(testItem.convert(".0", null, LookupKey.Number)).toBeUndefined();     
    });
    test('sourceIsCompatible', () => {
        let testItem = new NumericStringToNumberConverter();
        expect(testItem.sourceIsCompatible("5", LookupKey.String)).toBe(true);
        expect(testItem.sourceIsCompatible("5.3", LookupKey.String)).toBe(true);
        expect(testItem.sourceIsCompatible("-1.9999", LookupKey.String)).toBe(true);
        expect(testItem.sourceIsCompatible("0", LookupKey.String)).toBe(true);
        expect(testItem.sourceIsCompatible("", LookupKey.String)).toBe(true);
        expect(testItem.sourceIsCompatible("Test", LookupKey.String)).toBe(true);
        expect(testItem.sourceIsCompatible("5", null)).toBe(true);
        expect(testItem.sourceIsCompatible("Test", null)).toBe(true);

        expect(testItem.sourceIsCompatible(0, LookupKey.String)).toBe(false);
        expect(testItem.sourceIsCompatible(null, LookupKey.String)).toBe(false);
        expect(testItem.sourceIsCompatible(6, LookupKey.LongDate)).toBe(false);
        expect(testItem.sourceIsCompatible(6, LookupKey.String)).toBe(false);
    });

});