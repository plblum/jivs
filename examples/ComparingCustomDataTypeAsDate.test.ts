import { ComparersResult } from "../src/Interfaces/DataTypes";
import { createDataTypeServices } from "../starter_code/create_services";
import { RelativeDataLookupKey, RelativeDate, RelativeDateConverter, RelativeDateIdentifier } from "./ComparingCustomDataTypeAsDate";

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
    expect(dtc.supportsValue(new RelativeDate(1, 0), null)).toBe(true);
    expect(dtc.supportsValue(new RelativeDate(1, 0), RelativeDataLookupKey)).toBe(true);
    expect(dtc.supportsValue(new RelativeDate(1, 0), "willnotmatch")).toBe(false);
    expect(dtc.supportsValue(new Date(), null)).toBe(false);
    expect(dtc.supportsValue(new Date(), RelativeDataLookupKey)).toBe(false);
});
test('Register and test values against the RelativeDateIdentifier', () => {
    let dataTypeServices = createDataTypeServices();
    dataTypeServices.registerDataTypeIdentifier(new RelativeDateIdentifier());

    expect(dataTypeServices.identifyLookupKey(new RelativeDate(0, 1, 0))).toBe(RelativeDataLookupKey);
});

test('Register and test values against RelativeDateConverter', () => {
    let dataTypeServices = createDataTypeServices();
    dataTypeServices.registerDataTypeIdentifier(new RelativeDateIdentifier());
    dataTypeServices.registerDataTypeConverter(new RelativeDateConverter());
    let relativeDate1 = new RelativeDate(1, 0);
    let relativeDate2 = new RelativeDate(2, 0);
    expect(dataTypeServices.getDataTypeConverter(relativeDate1, null)).toBeInstanceOf(RelativeDateConverter);
    expect(dataTypeServices.getDataTypeConverter(relativeDate1, RelativeDataLookupKey)).toBeInstanceOf(RelativeDateConverter);
    expect(dataTypeServices.getDataTypeConverter(relativeDate1, "willnotmatch")).toBeNull();
    expect(dataTypeServices.compareValues(relativeDate1, relativeDate1, RelativeDataLookupKey, RelativeDataLookupKey)).toBe(ComparersResult.Equals);
    expect(dataTypeServices.compareValues(relativeDate1, relativeDate2, RelativeDataLookupKey, RelativeDataLookupKey)).toBe(ComparersResult.LessThan);
});