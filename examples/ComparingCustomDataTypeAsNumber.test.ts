import { ComparersResult } from "../src/Interfaces/DataTypeComparerService";
import { DataTypeComparerService } from "../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../src/Services/DataTypeConverterService";
import { DataTypeIdentifierService } from "../src/Services/DataTypeIdentifierService";
import { ValidationServices } from "../src/Services/ValidationServices";
import {
    TimeSpan, TimeSpanAsSecondsLookupKey, TimeSpanIdentifier, TimeSpanLookupKey,
    TimeSpanToHoursConverter, TimeSpanToSecondsConverter
} from "./ComparingCustomDataTypeAsNumber";
import { createMinimalValidationServices } from "./support";

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
    expect(dti.dataTypeLookupKey).toBe(TimeSpanLookupKey);
    expect(dti.supportsValue(new TimeSpan(1, 0))).toBe(true);
    expect(dti.supportsValue(1)).toBe(false);
});
test('Test TimeSpanToHoursConverter class members for expected results', () => {
    let dtc = new TimeSpanToHoursConverter();
    expect(dtc.supportsValue(new TimeSpan(1, 0), null)).toBe(true);
    expect(dtc.supportsValue(new TimeSpan(1, 0), TimeSpanLookupKey)).toBe(true);
    expect(dtc.supportsValue(new TimeSpan(1, 0), "willnotmatch")).toBe(false);
    expect(dtc.supportsValue(new Date(), null)).toBe(false);
    expect(dtc.supportsValue(new Date(), TimeSpanLookupKey)).toBe(false);
    expect(dtc.supportsValue(0, TimeSpanLookupKey)).toBe(false);
});
test('Test TimeSpanToSecondsConverter class members for expected results', () => {
    let dtc = new TimeSpanToSecondsConverter();
    expect(dtc.supportsValue(new TimeSpan(1, 0), null)).toBe(false);
    expect(dtc.supportsValue(new TimeSpan(1, 0), TimeSpanAsSecondsLookupKey)).toBe(true);
    expect(dtc.supportsValue(new TimeSpan(1, 0), TimeSpanLookupKey)).toBe(false);
    expect(dtc.supportsValue(new TimeSpan(1, 0), "willnotmatch")).toBe(false);
    expect(dtc.supportsValue(new Date(), null)).toBe(false);
    expect(dtc.supportsValue(new Date(), TimeSpanAsSecondsLookupKey)).toBe(false);
    expect(dtc.supportsValue(0, TimeSpanAsSecondsLookupKey)).toBe(false);
});
test('Register and test values against the TimeSpanIdentifier', () => {
    let dtis = new DataTypeIdentifierService();
    dtis.register(new TimeSpanIdentifier());

    expect(dtis.identify(new TimeSpan(0, 1, 0))).toBe(TimeSpanLookupKey);
});

test('Register and test values against TimeSpanToHoursConverter', () => {
    let vs = createMinimalValidationServices();
    let dtcs = vs.dataTypeConverterService as DataTypeConverterService;    
    dtcs.register(new TimeSpanToHoursConverter());
    let timeSpan1 = new TimeSpan(1, 0);
    let timeSpan2 = new TimeSpan(2, 0);
    expect(dtcs.find(timeSpan1, null)).toBeInstanceOf(TimeSpanToHoursConverter);
    expect(dtcs.find(timeSpan1, TimeSpanLookupKey)).toBeInstanceOf(TimeSpanToHoursConverter);
    expect(dtcs.find(timeSpan1, "willnotmatch")).toBeNull();
    let compareService = vs.dataTypeComparerService as DataTypeComparerService;
    expect(compareService.compare(timeSpan1, timeSpan1, TimeSpanLookupKey, TimeSpanLookupKey)).toBe(ComparersResult.Equals);
    expect(compareService.compare(timeSpan1, timeSpan2, TimeSpanLookupKey, TimeSpanLookupKey)).toBe(ComparersResult.LessThan);
});

test('Register and test values against TimeSpanToSecondsConverter', () => {
    let vs = createMinimalValidationServices();
    let dtcs = vs.dataTypeConverterService as DataTypeConverterService;    
    dtcs.register(new TimeSpanToSecondsConverter());
    let timeSpan1 = new TimeSpan(1, 0);
    let timeSpan2 = new TimeSpan(2, 0);
    expect(dtcs.find(timeSpan1, TimeSpanAsSecondsLookupKey)).toBeInstanceOf(TimeSpanToSecondsConverter);
    expect(dtcs.find(timeSpan1, "willnotmatch")).toBeNull();
    let compareService = vs.dataTypeComparerService as DataTypeComparerService;
    expect(compareService.compare(timeSpan1, timeSpan1, TimeSpanAsSecondsLookupKey, TimeSpanAsSecondsLookupKey)).toBe(ComparersResult.Equals);
    expect(compareService.compare(timeSpan1, timeSpan2, TimeSpanAsSecondsLookupKey, TimeSpanAsSecondsLookupKey)).toBe(ComparersResult.LessThan);
});