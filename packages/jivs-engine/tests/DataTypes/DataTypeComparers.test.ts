import { BooleanDataTypeComparer, defaultComparer } from "../../src/DataTypes/DataTypeComparers";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ComparersResult } from "../../src/Interfaces/DataTypeComparerService";

// function defaultComparer(value1: any, value2: any): ComparersResult
describe('Comparers.defaultComparer', () => {
    test('Equal primitives', () => {
        expect(defaultComparer(0, 0)).toBe(ComparersResult.Equal);
        expect(defaultComparer(10, 10)).toBe(ComparersResult.Equal);
        expect(defaultComparer(true, true)).toBe(ComparersResult.Equal);
        expect(defaultComparer(false, false)).toBe(ComparersResult.Equal);
        expect(defaultComparer('10', '10')).toBe(ComparersResult.Equal);
        expect(defaultComparer(null, null)).toBe(ComparersResult.Equal);
        expect(defaultComparer(undefined, undefined)).toBe(ComparersResult.Equal);
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
// there are no cases with same type primitives that support NotEqual
    test('Not Equal with same type primitives', () => {
        // is greater than    expect(DefaultComparer(true, false)).toBe(ComparersResult.NotEqual);  
        
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
        expect(testItem.supportsValues(true, false, null, null)).toBe(true);
        expect(testItem.supportsValues(false, true, null, null)).toBe(true);
        expect(testItem.supportsValues(true, false, LookupKey.Boolean, null)).toBe(true);
        expect(testItem.supportsValues(true, false, null, LookupKey.Boolean)).toBe(true);

        expect(testItem.supportsValues(null, false, null, null)).toBe(false);
        expect(testItem.supportsValues(true, null, null, null)).toBe(false);
        expect(testItem.supportsValues("A", "B", null, null)).toBe(false);
        expect(testItem.supportsValues("A", null, null, null)).toBe(false);
        expect(testItem.supportsValues(0, new Date(), null, null)).toBe(false);
        expect(testItem.supportsValues(true, true, LookupKey.String, null)).toBe(false);
        expect(testItem.supportsValues(true, true, null, LookupKey.String)).toBe(false);

    });
    test('Equals', () => {
        let testItem = new BooleanDataTypeComparer();
        // only supply values are were approved by supportsValues
        expect(testItem.compare(true, true, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(false, false, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(true, true, LookupKey.Boolean, LookupKey.Boolean)).toBe(ComparersResult.Equal);
        expect(testItem.compare(false, false, LookupKey.Boolean, LookupKey.Boolean)).toBe(ComparersResult.Equal);        
        expect(testItem.compare(true, true, null, LookupKey.Boolean)).toBe(ComparersResult.Equal);
        expect(testItem.compare(false, false, LookupKey.Boolean, null)).toBe(ComparersResult.Equal);        
     });    
    test('Not Equals', () => {
        let testItem = new BooleanDataTypeComparer();
        // only supply values are were approved by supportsValues
        // This class allows just one to be a boolean, and if so, returns NotEquals
        // when the other is null.

        expect(testItem.compare(true, false, null, null)).toBe(ComparersResult.NotEqual);
        expect(testItem.compare(false, true, null, null)).toBe(ComparersResult.NotEqual);
        expect(testItem.compare(true, false, LookupKey.Boolean, LookupKey.Boolean)).toBe(ComparersResult.NotEqual);
        expect(testItem.compare(false, true, null, LookupKey.Boolean)).toBe(ComparersResult.NotEqual);
    });      

});
