import { BooleanDataTypeComparer, DefaultComparer } from "../../src/DataTypes/DataTypeComparers";
import { ComparersResult } from "../../src/Interfaces/DataTypes";

// function DefaultComparer(value1: any, value2: any): ComparersResult
describe('Comparers.DefaultComparer', () => {
    test('Equal primitives', () => {
        expect(DefaultComparer(0, 0)).toBe(ComparersResult.Equals);
        expect(DefaultComparer(10, 10)).toBe(ComparersResult.Equals);
        expect(DefaultComparer(true, true)).toBe(ComparersResult.Equals);
        expect(DefaultComparer(false, false)).toBe(ComparersResult.Equals);
        expect(DefaultComparer('10', '10')).toBe(ComparersResult.Equals);
        expect(DefaultComparer(null, null)).toBe(ComparersResult.Equals);
        expect(DefaultComparer(undefined, undefined)).toBe(ComparersResult.Equals);
    });
    test('Undetermined with different type primitives', () => {
        expect(DefaultComparer(0, '0')).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(0, undefined)).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(0, false)).toBe(ComparersResult.Undetermined);  
        expect(DefaultComparer('0', 0)).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(undefined, 0)).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(false, 0)).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(null, undefined)).toBe(ComparersResult.Undetermined); 
    });
// there are no cases with same type primitives that support NotEquals
    test('Not Equal with same type primitives', () => {
        // is greater than    expect(DefaultComparer(true, false)).toBe(ComparersResult.NotEquals);  
        
    });
    
    test('InvalidTypeErrors', () => {
        expect(() => DefaultComparer({}, 0)).toThrow(/^Type is/);
        expect(() => DefaultComparer(0, {})).toThrow(/^Type is/);
        expect(() => DefaultComparer([], 0)).toThrow(/^Type is/);
        expect(() => DefaultComparer(0, [])).toThrow(/^Type is/);
    });
    test('GreaterThan primitives', () => {
        expect(DefaultComparer(0, 1)).toBe(ComparersResult.LessThan);
        expect(DefaultComparer(0.4, 0.44)).toBe(ComparersResult.LessThan);
        expect(DefaultComparer(false, true)).toBe(ComparersResult.LessThan);
        expect(DefaultComparer('A', 'B')).toBe(ComparersResult.LessThan);
    });    
    test('GreaterThan primitives', () => {
        expect(DefaultComparer(1, 0)).toBe(ComparersResult.GreaterThan);
        expect(DefaultComparer(0.44, 0.4)).toBe(ComparersResult.GreaterThan);
        expect(DefaultComparer(true, false)).toBe(ComparersResult.GreaterThan);
        expect(DefaultComparer('B', 'A')).toBe(ComparersResult.GreaterThan);
    });        
});

// function BooleanDataTypeComparer(value1: any, value2: any): ComparersResult
describe('Comparers.BooleanDataTypeComparer', () => {
    test('SupportsValues', () => {
        let testItem = new BooleanDataTypeComparer();
        // so long as one is boolean, true
        expect(testItem.SupportsValues(true, false)).toBe(true);
        expect(testItem.SupportsValues(false, true)).toBe(true);
        expect(testItem.SupportsValues(null, false)).toBe(true);
        expect(testItem.SupportsValues(true, null)).toBe(true);
        expect(testItem.SupportsValues("A", "B")).toBe(false);
        expect(testItem.SupportsValues("A", null)).toBe(false);
        expect(testItem.SupportsValues(0, new Date())).toBe(false);

    });
    test('Equals', () => {
        let testItem = new BooleanDataTypeComparer();
        // only supply values are were approved by SupportsValues
        // This class allows just one to be a boolean
        expect(testItem.Compare(true, true)).toBe(ComparersResult.Equals);
        expect(testItem.Compare(false, false)).toBe(ComparersResult.Equals);
     });    
    test('Not Equals', () => {
        let testItem = new BooleanDataTypeComparer();
        // only supply values are were approved by SupportsValues
        // This class allows just one to be a boolean, and if so, returns NotEquals
        // when the other is null.

        expect(testItem.Compare(true, false)).toBe(ComparersResult.NotEquals);
        expect(testItem.Compare(false, true)).toBe(ComparersResult.NotEquals);
        expect(testItem.Compare(false, null)).toBe(ComparersResult.NotEquals);
        expect(testItem.Compare(null, true)).toBe(ComparersResult.NotEquals);        
    });      
    test('Undefined', () => {
        let testItem = new BooleanDataTypeComparer();
        // only supply values are were approved by SupportsValues
        // This class allows just one to be a boolean, and if so, returns Undetermined
        // unless the other is null

        expect(testItem.Compare(false, "A")).toBe(ComparersResult.Undetermined);
        expect(testItem.Compare(10, true)).toBe(ComparersResult.Undetermined);  
        expect(testItem.Compare(new Date(), true)).toBe(ComparersResult.Undetermined);        
    });            
});
