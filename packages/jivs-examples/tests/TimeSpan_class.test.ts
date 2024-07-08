import { ComparersResult } from '@plblum/jivs-engine/build/Interfaces/DataTypeComparerService';
import { DataTypeComparerService } from '@plblum/jivs-engine/build/Services/DataTypeComparerService';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import { DataTypeIdentifierService } from '@plblum/jivs-engine/build/Services/DataTypeIdentifierService';
import {
    TimeSpan, TimeSpanIdentifier, TimeSpanConverter,
    timeSpanLookupKey, timeSpanAsSecondsLookupKey, timeSpanAsHoursLookupKey,
} from '../src/TimeSpan_class';
import { createMinimalValidationServices } from '../src/support';

// All test relative to 2001-05-15
function testTimeSpanToHours(timeSpan: TimeSpan, expected: number)
{
    expect(timeSpan.totalHours).toBe(expected);
}
function testTimeSpanToSeconds(timeSpan: TimeSpan, expected: number)
{
    expect(timeSpan.totalSeconds).toBe(expected);
}
test('The TimeSpan class itself', () => {
    testTimeSpanToHours(new TimeSpan(1, 0, 0), 1.0);
    testTimeSpanToHours(new TimeSpan(0, 30, 0), 0.5);
    testTimeSpanToHours(new TimeSpan(0, 0, 0), 0);

    testTimeSpanToSeconds(new TimeSpan(1, 0, 0), 3600);
    testTimeSpanToSeconds(new TimeSpan(0, 30, 0), 1800);
    testTimeSpanToSeconds(new TimeSpan(0, 0, 1), 1);
});

test('Test TimeSpanIdentifier class members for expected results', () => {
    let dti = new TimeSpanIdentifier();
    expect(dti.dataTypeLookupKey).toBe(timeSpanLookupKey);
    expect(dti.supportsValue(new TimeSpan(1, 0))).toBe(true);
    expect(dti.supportsValue(1)).toBe(false);
});
test('Test TimeSpanConverter class members for expected results', () => {
    let dtc = new TimeSpanConverter();
    expect(dtc.canConvert(new TimeSpan(1, 0), null, timeSpanAsHoursLookupKey)).toBe(true);
    expect(dtc.canConvert(new TimeSpan(1, 0), timeSpanLookupKey, timeSpanAsHoursLookupKey)).toBe(true);
    expect(dtc.canConvert(new TimeSpan(1, 0), null, timeSpanAsSecondsLookupKey)).toBe(true);
    expect(dtc.canConvert(new TimeSpan(1, 0), timeSpanLookupKey, timeSpanAsSecondsLookupKey)).toBe(true);
    expect(dtc.canConvert(new TimeSpan(1, 0), 'willnotmatch', timeSpanAsHoursLookupKey)).toBe(false);
    expect(dtc.canConvert(new Date(), null, timeSpanAsHoursLookupKey)).toBe(false);
    expect(dtc.canConvert(new Date(), timeSpanLookupKey, timeSpanAsHoursLookupKey)).toBe(false);
    expect(dtc.canConvert(0, timeSpanLookupKey, timeSpanAsHoursLookupKey)).toBe(false);
    expect(dtc.canConvert(new TimeSpan(1, 0), null, 'willnotmatch')).toBe(false);
    expect(dtc.canConvert(new TimeSpan(1, 0), timeSpanLookupKey, 'willnotmatch')).toBe(false);

});

test('Register and test values against the TimeSpanIdentifier', () => {
    let dtis = new DataTypeIdentifierService();
    dtis.register(new TimeSpanIdentifier());

    expect(dtis.identify(new TimeSpan(0, 1, 0))).toBe(timeSpanLookupKey);
});

test('Register and test values against TimeSpanConverter', () => {
    let vs = createMinimalValidationServices('en');
    let dtcs = vs.dataTypeConverterService as DataTypeConverterService;    
    dtcs.register(new TimeSpanConverter());
    let timeSpan1 = new TimeSpan(1, 0);
    let timeSpan2 = new TimeSpan(2, 0);
    expect(dtcs.find(timeSpan1, null, timeSpanAsHoursLookupKey)).toBeInstanceOf(TimeSpanConverter);
    expect(dtcs.find(timeSpan1, timeSpanLookupKey, timeSpanAsHoursLookupKey)).toBeInstanceOf(TimeSpanConverter);
    expect(dtcs.find(timeSpan1, null, timeSpanAsSecondsLookupKey)).toBeInstanceOf(TimeSpanConverter);
    expect(dtcs.find(timeSpan1, timeSpanLookupKey, timeSpanAsSecondsLookupKey)).toBeInstanceOf(TimeSpanConverter);
    expect(dtcs.find(timeSpan1, 'willnotmatch', timeSpanAsHoursLookupKey)).toBeNull();
    let compareService = vs.dataTypeComparerService as DataTypeComparerService;
    expect(compareService.compare(timeSpan1, timeSpan1, timeSpanLookupKey, timeSpanLookupKey)).toBe(ComparersResult.Equal);
    expect(compareService.compare(timeSpan1, timeSpan2, timeSpanLookupKey, timeSpanLookupKey)).toBe(ComparersResult.LessThan);
});
