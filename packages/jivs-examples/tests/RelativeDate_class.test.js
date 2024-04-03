import { DataTypeIdentifierService } from "../src/Services/DataTypeIdentifierService";
import { RelativeDataLookupKey, RelativeDate, RelativeDateConverter, RelativeDateIdentifier } from "../src/RelativeDate_class";
import { ComparersResult } from '../src/Interfaces/DataTypeComparerService';
import { createMinimalValidationServices } from '../src/support';
// All test relative to 2001-05-15
function testRelativeDate(relativeDate, expectedYear, expectedMonth, expectedDay) {
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
    testRelativeDate(new RelativeDate(0, 2), 2001, 7, 14); // our code adds 30 days for a month. June was 30 days. 
    testRelativeDate(new RelativeDate(0, 0, 1), 2002, 5, 15); // our code adds 365 days for a year 
    testRelativeDate(new RelativeDate(0, 0, -1), 2000, 5, 15); // our code adds 365 days for a year     
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
    let dtis = new DataTypeIdentifierService();
    dtis.register(new RelativeDateIdentifier());
    expect(dtis.identify(new RelativeDate(0, 1, 0))).toBe(RelativeDataLookupKey);
});
test('Register and test values against RelativeDateConverter', () => {
    let vs = createMinimalValidationServices();
    let dtis = vs.dataTypeIdentifierService;
    dtis.register(new RelativeDateIdentifier());
    let dtcs = vs.dataTypeConverterService;
    dtcs.register(new RelativeDateConverter());
    let relativeDate1 = new RelativeDate(1, 0);
    let relativeDate2 = new RelativeDate(2, 0);
    expect(dtcs.find(relativeDate1, null)).toBeInstanceOf(RelativeDateConverter);
    expect(dtcs.find(relativeDate1, RelativeDataLookupKey)).toBeInstanceOf(RelativeDateConverter);
    expect(dtcs.find(relativeDate1, "willnotmatch")).toBeNull();
    let compareService = vs.dataTypeComparerService;
    expect(compareService.compare(relativeDate1, relativeDate1, RelativeDataLookupKey, RelativeDataLookupKey)).toBe(ComparersResult.Equals);
    expect(compareService.compare(relativeDate1, relativeDate2, RelativeDataLookupKey, RelativeDataLookupKey)).toBe(ComparersResult.LessThan);
});
//# sourceMappingURL=RelativeDate_class.test.js.map