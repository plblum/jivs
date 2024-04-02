import { BooleanDataTypeComparer, defaultComparer } from "../../src/DataTypes/DataTypeComparers";
import { ComparersResult } from "../../src/Interfaces/DataTypeComparerService";
// function defaultComparer(value1: any, value2: any): ComparersResult
describe('Comparers.defaultComparer', () => {
    test('Equal primitives', () => {
        expect(defaultComparer(0, 0)).toBe(ComparersResult.Equals);
        expect(defaultComparer(10, 10)).toBe(ComparersResult.Equals);
        expect(defaultComparer(true, true)).toBe(ComparersResult.Equals);
        expect(defaultComparer(false, false)).toBe(ComparersResult.Equals);
        expect(defaultComparer('10', '10')).toBe(ComparersResult.Equals);
        expect(defaultComparer(null, null)).toBe(ComparersResult.Equals);
        expect(defaultComparer(undefined, undefined)).toBe(ComparersResult.Equals);
    });
    test('Undetermined with different type primitives', () => {
        expect(defaultComparer(0, '0')).toBe(ComparersResult.Undetermined);
        expect(defaultComparer(0, undefined)).toBe(ComparersResult.Undetermined);
        expect(defaultComparer(0, false)).toBe(ComparersResult.Undetermined);
        expect(defaultComparer('0', 0)).toBe(ComparersResult.Undetermined);
        expect(defaultComparer(undefined, 0)).toBe(ComparersResult.Undetermined);
        expect(defaultComparer(false, 0)).toBe(ComparersResult.Undetermined);
        expect(defaultComparer(null, undefined)).toBe(ComparersResult.Undetermined);
    });
    // there are no cases with same type primitives that support NotEquals
    test('Not Equal with same type primitives', () => {
        // is greater than    expect(DefaultComparer(true, false)).toBe(ComparersResult.NotEquals);  
    });
    test('InvalidTypeErrors', () => {
        expect(() => defaultComparer({}, 0)).toThrow(/^Type is/);
        expect(() => defaultComparer(0, {})).toThrow(/^Type is/);
        expect(() => defaultComparer([], 0)).toThrow(/^Type is/);
        expect(() => defaultComparer(0, [])).toThrow(/^Type is/);
    });
    test('GreaterThan primitives', () => {
        expect(defaultComparer(0, 1)).toBe(ComparersResult.LessThan);
        expect(defaultComparer(0.4, 0.44)).toBe(ComparersResult.LessThan);
        expect(defaultComparer(false, true)).toBe(ComparersResult.LessThan);
        expect(defaultComparer('A', 'B')).toBe(ComparersResult.LessThan);
    });
    test('GreaterThan primitives', () => {
        expect(defaultComparer(1, 0)).toBe(ComparersResult.GreaterThan);
        expect(defaultComparer(0.44, 0.4)).toBe(ComparersResult.GreaterThan);
        expect(defaultComparer(true, false)).toBe(ComparersResult.GreaterThan);
        expect(defaultComparer('B', 'A')).toBe(ComparersResult.GreaterThan);
    });
});
// function BooleanDataTypeComparer(value1: any, value2: any): ComparersResult
describe('Comparers.BooleanDataTypeComparer', () => {
    test('supportsValues', () => {
        let testItem = new BooleanDataTypeComparer();
        // so long as one is boolean, true
        expect(testItem.supportsValues(true, false)).toBe(true);
        expect(testItem.supportsValues(false, true)).toBe(true);
        expect(testItem.supportsValues(null, false)).toBe(true);
        expect(testItem.supportsValues(true, null)).toBe(true);
        expect(testItem.supportsValues("A", "B")).toBe(false);
        expect(testItem.supportsValues("A", null)).toBe(false);
        expect(testItem.supportsValues(0, new Date())).toBe(false);
    });
    test('Equals', () => {
        let testItem = new BooleanDataTypeComparer();
        // only supply values are were approved by supportsValues
        // This class allows just one to be a boolean
        expect(testItem.compare(true, true)).toBe(ComparersResult.Equals);
        expect(testItem.compare(false, false)).toBe(ComparersResult.Equals);
    });
    test('Not Equals', () => {
        let testItem = new BooleanDataTypeComparer();
        // only supply values are were approved by supportsValues
        // This class allows just one to be a boolean, and if so, returns NotEquals
        // when the other is null.
        expect(testItem.compare(true, false)).toBe(ComparersResult.NotEquals);
        expect(testItem.compare(false, true)).toBe(ComparersResult.NotEquals);
        expect(testItem.compare(false, null)).toBe(ComparersResult.NotEquals);
        expect(testItem.compare(null, true)).toBe(ComparersResult.NotEquals);
    });
    test('Undefined', () => {
        let testItem = new BooleanDataTypeComparer();
        // only supply values are were approved by supportsValues
        // This class allows just one to be a boolean, and if so, returns Undetermined
        // unless the other is null
        expect(testItem.compare(false, "A")).toBe(ComparersResult.Undetermined);
        expect(testItem.compare(10, true)).toBe(ComparersResult.Undetermined);
        expect(testItem.compare(new Date(), true)).toBe(ComparersResult.Undetermined);
    });
});
//# sourceMappingURL=DataTypeComparers.test.js.map