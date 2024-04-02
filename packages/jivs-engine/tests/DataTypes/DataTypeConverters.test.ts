import {
    UTCDateOnlyConverter, DateTimeConverter, LocalDateOnlyConverter, CaseInsensitiveStringConverter,
    TotalDaysConverter, IntegerConverter, TimeOfDayOnlyConverter, TimeOfDayHMSOnlyConverter
} from './../../src/DataTypes/DataTypeConverters';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ComparersResult } from '../../src/Interfaces/DataTypeComparerService';
import { DataTypeConverterService } from '../../src/Services/DataTypeConverterService';
import { MockValidationServices } from '../Mocks';
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
            let test1 = new Date(Date.UTC(2000, 10, 5));
            let test2 = new Date(Date.UTC(2023, 0, 1, 4, 30));
            let test2dateonly = new Date(Date.UTC(2023, 0, 1));
            expect(testItem.convert(test1, LookupKey.Date)).toBe(test1.getTime());
            expect(testItem.convert(test2, LookupKey.Date)).toBe(test2dateonly.getTime());
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
            let test1 = new Date(2000, 10, 5);
            let test2 = new Date(2023, 0, 1, 4, 30);
            let test2dateonly = new Date(2023, 0, 1);
            expect(testItem.convert(test1, LookupKey.LocalDate)).toBe(test1.getTime());
            expect(testItem.convert(test2, LookupKey.LocalDate)).toBe(test2dateonly.getTime());
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
            let date1 = new Date(Date.UTC(2000, 10, 2));
            let date2 = new Date(Date.UTC(2000, 10, 2, 5, 4, 3));         
            let expected = Math.floor(date1.getTime() / 86400000);
            expect(testItem.convert(date1, LookupKey.TotalDays)).toBe(expected);
            expect(testItem.convert(date2, LookupKey.TotalDays)).toBe(expected);
        });
    });    
});
