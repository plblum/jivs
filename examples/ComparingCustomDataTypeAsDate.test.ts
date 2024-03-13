import { ComparersResult } from "../src/Interfaces/DataTypes";
import { CreateDataTypeServices } from "../starter_code/create_services";
import { RelativeDataLookupKey, RelativeDate, RelativeDateConverter, RelativeDateIdentifier } from "./ComparingCustomDataTypeAsDate";

// All test relative to 2001-05-15
function TestRelativeDate(relativeDate: RelativeDate, expectedYear: number, expectedMonth: number, expectedDay: number)
{
    let today = new Date(Date.UTC(2001, 5, 15));

    relativeDate.UTCToday = today;
    let resultDate = relativeDate.ResolvedDate;
    expect(resultDate.getUTCFullYear()).toBe(expectedYear);
    expect(resultDate.getUTCMonth()).toBe(expectedMonth);
    expect(resultDate.getUTCDate()).toBe(expectedDay);
}
test('The RelativeDate class itself', () => {
    TestRelativeDate(new RelativeDate(1, 0), 2001, 5, 16);
    TestRelativeDate(new RelativeDate(-1, 0), 2001, 5, 14);    
    TestRelativeDate(new RelativeDate(0, 1), 2001, 6, 15); 
    TestRelativeDate(new RelativeDate(0, 2), 2001, 7, 14);  // our code adds 30 days for a month. June was 30 days. 
    TestRelativeDate(new RelativeDate(0, 0, 1), 2002, 5, 15);  // our code adds 365 days for a year 
    TestRelativeDate(new RelativeDate(0, 0, -1), 2000, 5, 15);  // our code adds 365 days for a year     
});

test('Test RelativeDateIdentifier class members for expected results', () => {
    let dti = new RelativeDateIdentifier();
    expect(dti.DataTypeLookupKey).toBe(RelativeDataLookupKey);
    expect(dti.SupportsValue(new RelativeDate(1, 0))).toBe(true);
    expect(dti.SupportsValue(new Date())).toBe(false);
});
test('Test RelativeDateConverter class members for expected results', () => {
    let dtc = new RelativeDateConverter();
    expect(dtc.SupportsValue(new RelativeDate(1, 0), null)).toBe(true);
    expect(dtc.SupportsValue(new RelativeDate(1, 0), RelativeDataLookupKey)).toBe(true);
    expect(dtc.SupportsValue(new RelativeDate(1, 0), "willnotmatch")).toBe(false);
    expect(dtc.SupportsValue(new Date(), null)).toBe(false);
    expect(dtc.SupportsValue(new Date(), RelativeDataLookupKey)).toBe(false);
});
test('Register and test values against the RelativeDateIdentifier', () => {
    let dataTypeServices = CreateDataTypeServices();
    dataTypeServices.RegisterDataTypeIdentifier(new RelativeDateIdentifier());

    expect(dataTypeServices.IdentifyLookupKey(new RelativeDate(0, 1, 0))).toBe(RelativeDataLookupKey);
});

test('Register and test values against RelativeDateConverter', () => {
    let dataTypeServices = CreateDataTypeServices();
    dataTypeServices.RegisterDataTypeIdentifier(new RelativeDateIdentifier());
    dataTypeServices.RegisterDataTypeConverter(new RelativeDateConverter());
    let relativeDate1 = new RelativeDate(1, 0);
    let relativeDate2 = new RelativeDate(2, 0);
    expect(dataTypeServices.GetDataTypeConverter(relativeDate1, null)).toBeInstanceOf(RelativeDateConverter);
    expect(dataTypeServices.GetDataTypeConverter(relativeDate1, RelativeDataLookupKey)).toBeInstanceOf(RelativeDateConverter);
    expect(dataTypeServices.GetDataTypeConverter(relativeDate1, "willnotmatch")).toBeNull();
    expect(dataTypeServices.CompareValues(relativeDate1, relativeDate1, RelativeDataLookupKey, RelativeDataLookupKey)).toBe(ComparersResult.Equals);
    expect(dataTypeServices.CompareValues(relativeDate1, relativeDate2, RelativeDataLookupKey, RelativeDataLookupKey)).toBe(ComparersResult.LessThan);
});