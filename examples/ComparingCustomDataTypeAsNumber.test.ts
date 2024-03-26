import { ComparersResult } from "../src/Interfaces/DataTypes";
import { createDataTypeServices } from "../starter_code/create_services";
import {
    TimeSpan, TimeSpanAsSecondsLookupKey, TimeSpanIdentifier, TimeSpanLookupKey,
    TimeSpanToHoursConverter, TimeSpanToSecondsConverter
} from "./ComparingCustomDataTypeAsNumber";

// All test relative to 2001-05-15
function testTimeSpanToHours(timeSpan: TimeSpan, expected: number)
{
    expect(timeSpan.TotalHours).toBe(expected);
}
function testTimeSpanToSeconds(timeSpan: TimeSpan, expected: number)
{
    expect(timeSpan.TotalSeconds).toBe(expected);
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
    expect(dti.DataTypeLookupKey).toBe(TimeSpanLookupKey);
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
    let dataTypeServices = createDataTypeServices();
    dataTypeServices.registerDataTypeIdentifier(new TimeSpanIdentifier());

    expect(dataTypeServices.identifyLookupKey(new TimeSpan(0, 1, 0))).toBe(TimeSpanLookupKey);
});

test('Register and test values against TimeSpanToHoursConverter', () => {
    let dataTypeServices = createDataTypeServices();
    dataTypeServices.registerDataTypeConverter(new TimeSpanToHoursConverter());
    let TimeSpan1 = new TimeSpan(1, 0);
    let TimeSpan2 = new TimeSpan(2, 0);
    expect(dataTypeServices.getDataTypeConverter(TimeSpan1, null)).toBeInstanceOf(TimeSpanToHoursConverter);
    expect(dataTypeServices.getDataTypeConverter(TimeSpan1, TimeSpanLookupKey)).toBeInstanceOf(TimeSpanToHoursConverter);
    expect(dataTypeServices.getDataTypeConverter(TimeSpan1, "willnotmatch")).toBeNull();
    expect(dataTypeServices.compareValues(TimeSpan1, TimeSpan1, TimeSpanLookupKey, TimeSpanLookupKey)).toBe(ComparersResult.Equals);
    expect(dataTypeServices.compareValues(TimeSpan1, TimeSpan2, TimeSpanLookupKey, TimeSpanLookupKey)).toBe(ComparersResult.LessThan);
});

test('Register and test values against TimeSpanToSecondsConverter', () => {
    let dataTypeServices = createDataTypeServices();
    dataTypeServices.registerDataTypeConverter(new TimeSpanToSecondsConverter());
    let TimeSpan1 = new TimeSpan(1, 0);
    let TimeSpan2 = new TimeSpan(2, 0);
    expect(dataTypeServices.getDataTypeConverter(TimeSpan1, TimeSpanAsSecondsLookupKey)).toBeInstanceOf(TimeSpanToSecondsConverter);
    expect(dataTypeServices.getDataTypeConverter(TimeSpan1, "willnotmatch")).toBeNull();
    expect(dataTypeServices.compareValues(TimeSpan1, TimeSpan1, TimeSpanAsSecondsLookupKey, TimeSpanAsSecondsLookupKey)).toBe(ComparersResult.Equals);
    expect(dataTypeServices.compareValues(TimeSpan1, TimeSpan2, TimeSpanAsSecondsLookupKey, TimeSpanAsSecondsLookupKey)).toBe(ComparersResult.LessThan);
});