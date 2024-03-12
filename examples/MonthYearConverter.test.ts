import { DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { StringLookupKey } from "../src/DataTypes/LookupKeys";
import { ComparersResult } from "../src/Interfaces/DataTypes";
import { UTCMonthYearConverter, MonthYearLookupKey } from "./MonthYearConverter";

describe('UTCMonthYearConverter', () => {
    test('SupportsValue', () => {
        let testItem = new UTCMonthYearConverter();
        expect(testItem.SupportsValue(new Date(), MonthYearLookupKey)).toBe(true);
        expect(testItem.SupportsValue(new Date(), StringLookupKey)).toBe(false);
        expect(testItem.SupportsValue(new Date(), null)).toBe(false); // always requires MonthYearLookupKey            
        expect(testItem.SupportsValue(0, MonthYearLookupKey)).toBe(false);
        expect(testItem.SupportsValue(null, MonthYearLookupKey)).toBe(false);
    })
    test('Convert', () => {
        let testItem = new UTCMonthYearConverter();
        // Convert expects to be called after SupportsValue is true.
        // So no illegal values as parameters tested
        let test1 = new Date(Date.UTC(2000, 10, 5));
        let test1montyear = new Date(Date.UTC(2000, 10, 1));
        let test2 = new Date(Date.UTC(2023, 0, 2, 4, 30));
        let test2monthyear = new Date(Date.UTC(2023, 0, 1));
        expect(testItem.Convert(test1, MonthYearLookupKey)).toBe(test1montyear.getTime());
        expect(testItem.Convert(test2, MonthYearLookupKey)).toBe(test2monthyear.getTime());
        // dates with an illegal value will convert to undefined
        let illegalDate = new Date("foo");
        expect(testItem.Convert(illegalDate, MonthYearLookupKey)).toBeUndefined();
    });
    test('Within DataTypeServices', () => {
        let date1 = new Date(Date.UTC(2000, 10, 1));
        let date2 = new Date(Date.UTC(2000, 10, 5, 2, 3, 4));
        let date3 = new Date(Date.UTC(2000, 9, 1));
        let date5 = new Date(Date.UTC(2000, 10, 2));
        let date6 = new Date(Date.UTC(2000, 10, 1, 1, 0, 0));
        let date7 = new Date(Date.UTC(2000, 10, 30, 23, 59, 59));
        let date8 = new Date(Date.UTC(2001, 10, 1));
        
        let testItem = new DataTypeServices('en'); 
        testItem.RegisterDataTypeConverter(new UTCMonthYearConverter());
        expect(testItem.CompareValues(date1, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date1, date2, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date5, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date6, date7, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date3, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.LessThan); 
        expect(testItem.CompareValues(date1, date3, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.GreaterThan);            
        expect(testItem.CompareValues(date8, date7, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.GreaterThan);            
        // these are due to the DataTypeServices.CompareValues function itself
        expect(testItem.CompareValues(null, null, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date1, null, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Undetermined);
        expect(testItem.CompareValues(null, date2, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Undetermined);
    });
});    