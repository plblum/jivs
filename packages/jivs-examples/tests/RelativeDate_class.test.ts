import { DataTypeComparerService } from '@plblum/jivs-engine/build/Services/DataTypeComparerService';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import { DataTypeIdentifierService } from '@plblum/jivs-engine/build/Services/DataTypeIdentifierService';
import { RelativeDataLookupKey, RelativeDate, RelativeDateConverter, RelativeDateIdentifier } from '../src/RelativeDate_class';
import { ComparersResult } from '@plblum/jivs-engine/build/Interfaces/DataTypeComparerService';
import { createMinimalValidationServices } from '../src/support';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { UTCDateOnlyConverter } from '@plblum/jivs-engine/build/DataTypes/DataTypeConverters';

// All test relative to 2001-05-15
function testRelativeDate(relativeDate: RelativeDate, expectedYear: number, expectedMonth: number, expectedDay: number)
{
    let today = new Date(Date.UTC(2001, 5, 15));

    relativeDate.utcToday = today;
    let resultDate = relativeDate.resolvedDate;
    expect(resultDate.getUTCFullYear()).toBe(expectedYear);
    expect(resultDate.getUTCMonth()).toBe(expectedMonth);
    expect(resultDate.getUTCDate()).toBe(expectedDay);
}
test('The RelativeDate class itself', () => {
    testRelativeDate(new RelativeDate(1, 0), 2001, 5, 16);
    testRelativeDate(new RelativeDate(-1, 0), 2001, 5, 14);    
    testRelativeDate(new RelativeDate(0, 1), 2001, 6, 15); 
    testRelativeDate(new RelativeDate(0, 2), 2001, 7, 14);  // our code adds 30 days for a month. June was 30 days. 
    testRelativeDate(new RelativeDate(0, 0, 1), 2002, 5, 15);  // our code adds 365 days for a year 
    testRelativeDate(new RelativeDate(0, 0, -1), 2000, 5, 15);  // our code adds 365 days for a year     
});

test('Test RelativeDateIdentifier class members for expected results', () => {
    let dti = new RelativeDateIdentifier();
    expect(dti.dataTypeLookupKey).toBe(RelativeDataLookupKey);
    expect(dti.supportsValue(new RelativeDate(1, 0))).toBe(true);
    expect(dti.supportsValue(new Date())).toBe(false);
});
test('Test RelativeDateConverter class members for expected results', () => {
    let dtc = new RelativeDateConverter();
    expect(dtc.canConvert(new RelativeDate(1, 0), null, LookupKey.Date)).toBe(true);
    expect(dtc.canConvert(new RelativeDate(1, 0), RelativeDataLookupKey, LookupKey.Date)).toBe(true);
    expect(dtc.canConvert(new RelativeDate(1, 0), 'willnotmatch', LookupKey.Date)).toBe(false);
    expect(dtc.canConvert(new Date(), null, LookupKey.Date)).toBe(false);
    expect(dtc.canConvert(new Date(), RelativeDataLookupKey, LookupKey.Date)).toBe(false);
});
test('Register and test values against the RelativeDateIdentifier', () => {
    let dtis = new DataTypeIdentifierService();
    dtis.register(new RelativeDateIdentifier());

    expect(dtis.identify(new RelativeDate(0, 1, 0))).toBe(RelativeDataLookupKey);
});

test('Register and test values against RelativeDateConverter', () => {
    let vs = createMinimalValidationServices('en');

    let dtis = vs.dataTypeIdentifierService as DataTypeIdentifierService;
    dtis.register(new RelativeDateIdentifier());
    let dtcs = vs.dataTypeConverterService as DataTypeConverterService;    
    dtcs.register(new RelativeDateConverter());
    dtcs.register(new UTCDateOnlyConverter());
    let relativeDate1 = new RelativeDate(1, 0);
    let relativeDate2 = new RelativeDate(2, 0);
    expect(dtcs.find(relativeDate1, null, LookupKey.Date)).toBeInstanceOf(RelativeDateConverter);
    expect(dtcs.find(relativeDate1, RelativeDataLookupKey, LookupKey.Date)).toBeInstanceOf(RelativeDateConverter);
    expect(dtcs.find(relativeDate1, 'willnotmatch', LookupKey.Date)).toBeNull();
    let compareService = vs.dataTypeComparerService as DataTypeComparerService;
    expect(compareService.compare(relativeDate1, relativeDate1, RelativeDataLookupKey, RelativeDataLookupKey)).toBe(ComparersResult.Equal);
    expect(compareService.compare(relativeDate1, relativeDate2, RelativeDataLookupKey, RelativeDataLookupKey)).toBe(ComparersResult.LessThan);
});