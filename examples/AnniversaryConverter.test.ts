import { DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { LookupKey } from "../src/DataTypes/LookupKeys";
import { ComparersResult } from "../src/Interfaces/DataTypes";
import { UTCAnniversaryConverter, AnniversaryLookupKey } from "./AnniversaryConverter";

describe('UTCAnniversaryConverter', () => {
    test('supportsValue', () => {
        let testItem = new UTCAnniversaryConverter();
        expect(testItem.supportsValue(new Date(), AnniversaryLookupKey)).toBe(true);
        expect(testItem.supportsValue(new Date(), LookupKey.String)).toBe(false);
        expect(testItem.supportsValue(new Date(), null)).toBe(false); // always requires AnniversaryLookupKey            
        expect(testItem.supportsValue(0, AnniversaryLookupKey)).toBe(false);
        expect(testItem.supportsValue(null, AnniversaryLookupKey)).toBe(false);
    })
    test('convert', () => {
        let testItem = new UTCAnniversaryConverter();
        // convert expects to be called after supportsValue is true.
        // So no illegal values as parameters tested
        // Reminder that the year used in this Converter is 2004
        let test1 = new Date(Date.UTC(2000, 10, 5));
        let test1Anniversary = new Date(Date.UTC(2004, 10, 5));
        let test2 = new Date(Date.UTC(2023, 0, 2, 4, 30));
        let test2Anniversary = new Date(Date.UTC(2004, 0, 2));
        expect(testItem.convert(test1, AnniversaryLookupKey)).toBe(test1Anniversary.getTime());
        expect(testItem.convert(test2, AnniversaryLookupKey)).toBe(test2Anniversary.getTime());
        // dates with an illegal value will convert to undefined
        let illegalDate = new Date("foo");
        expect(testItem.convert(illegalDate, AnniversaryLookupKey)).toBeUndefined();
    });
    test('Within DataTypeServices', () => {
        let date1 = new Date(Date.UTC(2000, 10, 1));
        let date2 = new Date(Date.UTC(2001, 10, 1, 2, 3, 4));
        let date3 = new Date(Date.UTC(2030, 9, 1));
        let date5 = new Date(Date.UTC(1999, 10, 2));
        let date6 = new Date(Date.UTC(2005, 8, 1, 1, 0, 0));
        let date7 = new Date(Date.UTC(1981, 10, 30, 23, 59, 59));
        let date8 = new Date(Date.UTC(1976, 10, 1));
        
        let testItem = new DataTypeServices(); 
        testItem.registerDataTypeConverter(new UTCAnniversaryConverter());
        expect(testItem.compareValues(date1, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date1, date2, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date3, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.LessThan);
        expect(testItem.compareValues(date8, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date5, date8, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan); 
        expect(testItem.compareValues(date1, date3, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan);            
        expect(testItem.compareValues(date7, date8, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan);            
        // these are due to the DataTypeServices.compareValues function itself
        expect(testItem.compareValues(null, null, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date1, null, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Undetermined);
        expect(testItem.compareValues(null, date2, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Undetermined);
    });
});               