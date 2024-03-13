import { DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { ComparersResult } from "../src/Interfaces/DataTypes";
import { CreateDataTypeServices } from "../starter_code/create_services";
import {
    TimeSpan, TimeSpanAsSecondsLookupKey, TimeSpanIdentifier, TimeSpanLookupKey,
    TimeSpanToHoursConverter, TimeSpanToSecondsConverter
} from "./ComparingCustomDataTypeAsNumber";

// All test relative to 2001-05-15
function TestTimeSpanToHours(timeSpan: TimeSpan, expected: number)
{
    expect(timeSpan.TotalHours).toBe(expected);
}
function TestTimeSpanToSeconds(timeSpan: TimeSpan, expected: number)
{
    expect(timeSpan.TotalSeconds).toBe(expected);
}
test('The TimeSpan class itself', () => {
    TestTimeSpanToHours(new TimeSpan(1, 0, 0), 1.0);
    TestTimeSpanToHours(new TimeSpan(0, 30, 0), 0.5);
    TestTimeSpanToHours(new TimeSpan(0, 0, 0), 0);

    TestTimeSpanToSeconds(new TimeSpan(1, 0, 0), 3600);
    TestTimeSpanToSeconds(new TimeSpan(0, 30, 0), 1800);
    TestTimeSpanToSeconds(new TimeSpan(0, 0, 1), 1);
});

test('Test TimeSpanIdentifier class members for expected results', () => {
    let dti = new TimeSpanIdentifier();
    expect(dti.DataTypeLookupKey).toBe(TimeSpanLookupKey);
    expect(dti.SupportsValue(new TimeSpan(1, 0))).toBe(true);
    expect(dti.SupportsValue(1)).toBe(false);
});
test('Test TimeSpanToHoursConverter class members for expected results', () => {
    let dtc = new TimeSpanToHoursConverter();
    expect(dtc.SupportsValue(new TimeSpan(1, 0), null)).toBe(true);
    expect(dtc.SupportsValue(new TimeSpan(1, 0), TimeSpanLookupKey)).toBe(true);
    expect(dtc.SupportsValue(new TimeSpan(1, 0), "willnotmatch")).toBe(false);
    expect(dtc.SupportsValue(new Date(), null)).toBe(false);
    expect(dtc.SupportsValue(new Date(), TimeSpanLookupKey)).toBe(false);
    expect(dtc.SupportsValue(0, TimeSpanLookupKey)).toBe(false);
});
test('Test TimeSpanToSecondsConverter class members for expected results', () => {
    let dtc = new TimeSpanToSecondsConverter();
    expect(dtc.SupportsValue(new TimeSpan(1, 0), null)).toBe(false);
    expect(dtc.SupportsValue(new TimeSpan(1, 0), TimeSpanAsSecondsLookupKey)).toBe(true);
    expect(dtc.SupportsValue(new TimeSpan(1, 0), TimeSpanLookupKey)).toBe(false);
    expect(dtc.SupportsValue(new TimeSpan(1, 0), "willnotmatch")).toBe(false);
    expect(dtc.SupportsValue(new Date(), null)).toBe(false);
    expect(dtc.SupportsValue(new Date(), TimeSpanAsSecondsLookupKey)).toBe(false);
    expect(dtc.SupportsValue(0, TimeSpanAsSecondsLookupKey)).toBe(false);
});
test('Register and test values against the TimeSpanIdentifier', () => {
    let dataTypeServices = CreateDataTypeServices();
    dataTypeServices.RegisterDataTypeIdentifier(new TimeSpanIdentifier());

    expect(dataTypeServices.IdentifyLookupKey(new TimeSpan(0, 1, 0))).toBe(TimeSpanLookupKey);
});

test('Register and test values against TimeSpanToHoursConverter', () => {
    let dataTypeServices = CreateDataTypeServices();
    dataTypeServices.RegisterDataTypeConverter(new TimeSpanToHoursConverter());
    let TimeSpan1 = new TimeSpan(1, 0);
    let TimeSpan2 = new TimeSpan(2, 0);
    expect(dataTypeServices.GetDataTypeConverter(TimeSpan1, null)).toBeInstanceOf(TimeSpanToHoursConverter);
    expect(dataTypeServices.GetDataTypeConverter(TimeSpan1, TimeSpanLookupKey)).toBeInstanceOf(TimeSpanToHoursConverter);
    expect(dataTypeServices.GetDataTypeConverter(TimeSpan1, "willnotmatch")).toBeNull();
    expect(dataTypeServices.CompareValues(TimeSpan1, TimeSpan1, TimeSpanLookupKey, TimeSpanLookupKey)).toBe(ComparersResult.Equals);
    expect(dataTypeServices.CompareValues(TimeSpan1, TimeSpan2, TimeSpanLookupKey, TimeSpanLookupKey)).toBe(ComparersResult.LessThan);
});

test('Register and test values against TimeSpanToSecondsConverter', () => {
    let dataTypeServices = CreateDataTypeServices();
    dataTypeServices.RegisterDataTypeConverter(new TimeSpanToSecondsConverter());
    let TimeSpan1 = new TimeSpan(1, 0);
    let TimeSpan2 = new TimeSpan(2, 0);
    expect(dataTypeServices.GetDataTypeConverter(TimeSpan1, TimeSpanAsSecondsLookupKey)).toBeInstanceOf(TimeSpanToSecondsConverter);
    expect(dataTypeServices.GetDataTypeConverter(TimeSpan1, "willnotmatch")).toBeNull();
    expect(dataTypeServices.CompareValues(TimeSpan1, TimeSpan1, TimeSpanAsSecondsLookupKey, TimeSpanAsSecondsLookupKey)).toBe(ComparersResult.Equals);
    expect(dataTypeServices.CompareValues(TimeSpan1, TimeSpan2, TimeSpanAsSecondsLookupKey, TimeSpanAsSecondsLookupKey)).toBe(ComparersResult.LessThan);
});