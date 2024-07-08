import { AnniversaryLookupKey, UTCAnniversaryConverter } from './../src/AnniversaryConverter';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ComparersResult } from '@plblum/jivs-engine/build/Interfaces/DataTypeComparerService';
import { DataTypeComparerService } from '@plblum/jivs-engine/build/Services/DataTypeComparerService';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import { createMinimalValidationServices } from '../src/support';

describe('UTCAnniversaryConverter', () => {
    test('canConvert', () => {
        let testItem = new UTCAnniversaryConverter();
        expect(testItem.canConvert(new Date(), AnniversaryLookupKey, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert(new Date(), AnniversaryLookupKey, LookupKey.String)).toBe(false);
        expect(testItem.canConvert(new Date(), null, LookupKey.Number)).toBe(false); // always requires AnniversaryLookupKey            
        expect(testItem.canConvert(0, AnniversaryLookupKey, LookupKey.Number)).toBe(false);
        expect(testItem.canConvert(null, AnniversaryLookupKey, LookupKey.Number)).toBe(false);
    })
    test('convert', () => {
        let testItem = new UTCAnniversaryConverter();
        // convert expects to be called after canConvert is true.
        // So no illegal values as parameters tested
        // Reminder that the year used in this Converter is 2004
        let test1 = new Date(Date.UTC(2000, 10, 5));
        let test1Anniversary = new Date(Date.UTC(2004, 10, 5));
        let test2 = new Date(Date.UTC(2023, 0, 2, 4, 30));
        let test2Anniversary = new Date(Date.UTC(2004, 0, 2));
        expect(testItem.convert(test1, AnniversaryLookupKey, LookupKey.Number)).toBe(test1Anniversary.getTime());
        expect(testItem.convert(test2, AnniversaryLookupKey, LookupKey.Number)).toBe(test2Anniversary.getTime());
        // dates with an illegal value will convert to undefined
        let illegalDate = new Date('foo');
        expect(testItem.convert(illegalDate, AnniversaryLookupKey, LookupKey.Number)).toBeUndefined();
    });
    test('Within dataTypeConverterService', () => {
        let date1 = new Date(Date.UTC(2000, 10, 1));
        let date2 = new Date(Date.UTC(2001, 10, 1, 2, 3, 4));
        let date3 = new Date(Date.UTC(2030, 9, 1));
        let date5 = new Date(Date.UTC(1999, 10, 2));
        let date6 = new Date(Date.UTC(2005, 8, 1, 1, 0, 0));
        let date7 = new Date(Date.UTC(1981, 10, 30, 23, 59, 59));
        let date8 = new Date(Date.UTC(1976, 10, 1));

        let vs = createMinimalValidationServices('en');
        let dtcs = vs.dataTypeConverterService as DataTypeConverterService;    
        dtcs.register(new UTCAnniversaryConverter());
        let compareService = vs.dataTypeComparerService as DataTypeComparerService;
        expect(compareService.compare(date1, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date1, date2, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date3, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.LessThan);
        expect(compareService.compare(date8, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date5, date8, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan); 
        expect(compareService.compare(date1, date3, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan);            
        expect(compareService.compare(date7, date8, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan);            
        // these are due to the DataTypeComparerService.compare function itself
        expect(compareService.compare(null, null, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date1, null, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Undetermined);
        expect(compareService.compare(null, date2, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Undetermined);
    });
});               