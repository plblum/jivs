import { DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { LookupKey } from "../src/DataTypes/LookupKeys";
import { ComparersResult } from "../src/Interfaces/DataTypes";
import { UTCMonthYearConverter, MonthYearLookupKey } from "./MonthYearConverter";

describe('UTCMonthYearConverter', () => {
    test('supportsValue', () => {
        let testItem = new UTCMonthYearConverter();
        expect(testItem.supportsValue(new Date(), MonthYearLookupKey)).toBe(true);
        expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
        expect(testItem.supportsValue(new Date(), null)).toBe(false); // always requires MonthYearLookupKey            
        expect(testItem.supportsValue(0, MonthYearLookupKey)).toBe(false);
        expect(testItem.supportsValue(null, MonthYearLookupKey)).toBe(false);
    })
    test('convert', () => {
        let testItem = new UTCMonthYearConverter();
        // Convert expects to be called after supportsValue is true.
        // So no illegal values as parameters tested
        let test1 = new Date(Date.UTC(2000, 10, 5));
        let test1montyear = new Date(Date.UTC(2000, 10, 1));
        let test2 = new Date(Date.UTC(2023, 0, 2, 4, 30));
        let test2monthyear = new Date(Date.UTC(2023, 0, 1));
        expect(testItem.convert(test1, MonthYearLookupKey)).toBe(test1montyear.getTime());
        expect(testItem.convert(test2, MonthYearLookupKey)).toBe(test2monthyear.getTime());
        // dates with an illegal value will convert to undefined
        let illegalDate = new Date("foo");
        expect(testItem.convert(illegalDate, MonthYearLookupKey)).toBeUndefined();
    });
    test('Within DataTypeServices', () => {
        let date1 = new Date(Date.UTC(2000, 10, 1));
        let date2 = new Date(Date.UTC(2000, 10, 5, 2, 3, 4));
        let date3 = new Date(Date.UTC(2000, 9, 1));
        let date5 = new Date(Date.UTC(2000, 10, 2));
        let date6 = new Date(Date.UTC(2000, 10, 1, 1, 0, 0));
        let date7 = new Date(Date.UTC(2000, 10, 30, 23, 59, 59));
        let date8 = new Date(Date.UTC(2001, 10, 1));
        
        let testItem = new DataTypeServices(); 
        testItem.registerDataTypeConverter(new UTCMonthYearConverter());
        expect(testItem.compareValues(date1, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date1, date2, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date5, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date6, date7, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date3, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.LessThan); 
        expect(testItem.compareValues(date1, date3, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.GreaterThan);            
        expect(testItem.compareValues(date8, date7, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.GreaterThan);            
        // these are due to the DataTypeServices.compareValues function itself
        expect(testItem.compareValues(null, null, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date1, null, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Undetermined);
        expect(testItem.compareValues(null, date2, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Undetermined);
    });
});    