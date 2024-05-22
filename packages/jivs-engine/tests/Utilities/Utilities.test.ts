import { ConditionEvaluateResult } from "../../src/Interfaces/Conditions";
import { deepClone, deepEquals, groupsMatch } from "../../src/Utilities/Utilities";



// function deepEquals(obj1: any, obj2: any): boolean
describe("Utilities.deepEquals", () => {
    test("Equal primitives", () => {
        expect(deepEquals(0, 0)).toBe(true);
        expect(deepEquals(0.1, 0.1)).toBe(true);
        expect(deepEquals(false, false)).toBe(true);
        expect(deepEquals('', '')).toBe(true);
        expect(deepEquals('A', 'A')).toBe(true);
        expect(deepEquals(ConditionEvaluateResult.Match, ConditionEvaluateResult.Match)).toBe(true);
    });
    test("Not equal primitives of same datatypes", () => {
        expect(deepEquals(0, 1)).toBe(false);
        expect(deepEquals(0.1, 0.2)).toBe(false);
        expect(deepEquals(false, true)).toBe(false);
        expect(deepEquals('', 'A')).toBe(false);
        expect(deepEquals('A', 'a')).toBe(false);
        expect(deepEquals(ConditionEvaluateResult.Match, ConditionEvaluateResult.NoMatch)).toBe(false);
    });
    test("Not equal primitives of different datatypes", () => {
        expect(deepEquals(0, '0')).toBe(false);
        expect(deepEquals(false, '0')).toBe(false);        
        expect(deepEquals('0', 0.0)).toBe(false);
        expect(deepEquals(0, null)).toBe(false);   
        expect(deepEquals(0, undefined)).toBe(false);
        expect(deepEquals(0, {})).toBe(false);
        expect(deepEquals({}, 0)).toBe(false);
    });    
    test("Equal objects", () => {
        expect(deepEquals({}, {})).toBe(true);
        expect(deepEquals({ a: 1 }, { a: 1 })).toBe(true);
        expect(deepEquals({ a: '1' }, { a: '1' })).toBe(true);
        expect(deepEquals({ a: false }, { a: false })).toBe(true);
        expect(deepEquals({ a: null }, { a: null })).toBe(true);
        expect(deepEquals({ a: 1, b: false }, { a: 1, b: false })).toBe(true);
        let sharedObj1 = {};
        expect(deepEquals({ a: 1, b: false, c: sharedObj1 }, { a: 1, b: false, c: sharedObj1 })).toBe(true);
        let sharedObj2 = { d: 0 };
        expect(deepEquals({ a: 1, b: false, c: sharedObj2 }, { a: 1, b: false, c: sharedObj2 })).toBe(true);
    
    });    
    test("Not equal objects with same properties, but different values always fail", () => {
        expect(deepEquals({ a: 1 }, { a: '1' })).toBe(false);
        expect(deepEquals({ a: 1 }, { a: 2 })).toBe(false);
        expect(deepEquals({ a: '2' }, { a: '1' })).toBe(false);
        expect(deepEquals({ a: false }, { a: true })).toBe(false);
        expect(deepEquals({ a: null }, { a: undefined })).toBe(false);
        expect(deepEquals({ a: null }, { a: 0 })).toBe(false);
        expect(deepEquals({ a: 1, b: false }, { a: 2, b: false })).toBe(false);
        expect(deepEquals({ a: 1, b: false }, { a: 1, b: true })).toBe(false);
    });     
    test("Not equal objects with different property lists always fail", () => {
        expect(deepEquals({}, { a: 1 })).toBe(false);
        expect(deepEquals({ a: 1 }, {})).toBe(false);
        expect(deepEquals({ a: 1 }, { b: 1 })).toBe(false);
        expect(deepEquals({ a: 1 }, { b: '1' })).toBe(false);
        expect(deepEquals({ a: '2' }, { b: '2' })).toBe(false);
        expect(deepEquals({ a: 1, b: false }, { a: 2, b: false })).toBe(false);
        expect(deepEquals({ a: 1, b: false }, { a: 1, b: true })).toBe(false);
        expect(deepEquals({ a: 1, b: false }, { a: 1 })).toBe(false);
        expect(deepEquals({ a: 1, b: false }, { b: false })).toBe(false);
        expect(deepEquals({ a: 1 }, { a: 1, b: false })).toBe(false);
        expect(deepEquals({ b: false }, { a: 1, b: false })).toBe(false);
    });   
    test("Contains child objects that are structurally the same, so they will match", () => {
        expect(deepEquals({ a: 1, b: {} }, { a: 1, b: {} })).toBe(true);
        expect(deepEquals({ b: { d: false } }, { b: { d: false } })).toBe(true);
        expect(deepEquals({ b: [] }, { b: [] })).toBe(true);
        expect(deepEquals({ b: [1, 2] }, { b: [1, 2] })).toBe(true);
    });      
    test("Contains child objects that are structurally the similar but not the same, so they don't match", () => {
        expect(deepEquals({ a: 1, b: {} }, { a: 1, b: 0 })).toBe(false);
        expect(deepEquals({ a: 1, b: {} }, { a: 1, b: { c: 1 } })).toBe(false);
        expect(deepEquals({ b: { d: false } }, { b: { d: true } })).toBe(false);
        expect(deepEquals({ b: [] }, { b: [1] })).toBe(false);
        expect(deepEquals({ b: [1, 2] }, { b: [2, 1] })).toBe(false);
    });          
});

// function deepClone<T>(value: any): any
describe('Utilities.deepClone', () => {
    test('Primitives return the same', () => {
        expect(deepClone(0)).toBe(0);
        expect(deepClone(false)).toBe(false);
        expect(deepClone(null)).toBe(null);
        expect(deepClone("text")).toBe("text");
    });
    test('Date object', () => {
        let d1 = new Date(Date.UTC(2000, 5, 1));
        expect(deepClone(d1)).toEqual(d1);
    });
    test('RegExp object', () => {
        let d1 = /\d/;
        expect(deepClone(d1)).toEqual(d1);
    });    
    test('Objects', () => {
        let d1 = new Date(Date.UTC(2000, 5, 1));
        expect(deepClone({})).toEqual({});
        expect(deepClone({ a: 'x' })).toEqual({ a: 'x' });
        expect(deepClone({ a: 'x', b: false })).toEqual({ a: 'x', b: false });
        expect(deepClone({ a: 'x', b: d1 })).toEqual({ a: 'x', b: d1 });
        expect(deepClone({ a: 'x', b: null })).toEqual({ a: 'x', b: null });
        expect(deepClone({ a: {}, b: false })).toEqual({ a: {}, b: false });
        expect(deepClone({ a: { c: 'see' }, b: false })).toEqual({ a: { c: 'see'}, b: false });
        expect(deepClone({ a: { c: { d: 'dee' } }, b: false, s: [] })).toEqual({ a: { c: { d: 'dee' } }, b: false, s: [] });

    });
    test('Arrays', () => {
        expect(deepClone([])).toEqual([]);
        expect(deepClone([1, 2])).toEqual([1, 2]);        
        expect(deepClone([{a: 1}])).toEqual([{a: 1}]);        
    });    
    test('Stops at circular references, leaving the field with the circular reference = undefined', () => {
        let testItem = { a: 1, b: { c: 2, d: null as any } };
        let expected = { a: 1, b: { c: 2, d: undefined } }
        testItem.b.d = testItem;
        expect(deepClone(testItem)).toEqual(expected);
    });
});

// function GroupsMatch(group1: string | Array<string> | undefined | null,
//    group2: string | Array<string>| undefined | null): boolean
describe('Utilities.groupsMatch', () => {
    test('Matching validation groups', () => {
        expect(groupsMatch(null, null)).toBe(true); 
        expect(groupsMatch(undefined, undefined)).toBe(true); 
        expect(groupsMatch('', '')).toBe(true);
        expect(groupsMatch(null, undefined)).toBe(true); 
        expect(groupsMatch(undefined, '')).toBe(true); 
        expect(groupsMatch([], '')).toBe(true);
        expect(groupsMatch('A', 'A')).toBe(true);
        expect(groupsMatch([], [])).toBe(true);
        expect(groupsMatch(['A'], ['A'])).toBe(true);
        expect(groupsMatch(['A'], ['a'])).toBe(true);
        expect(groupsMatch(['a'], ['A'])).toBe(true);
        expect(groupsMatch(['A', 'B'], ['A', 'B'])).toBe(true);
        expect(groupsMatch(['A', 'B'], ['a', 'b'])).toBe(true);
        expect(groupsMatch(['A', 'B'], ['B', 'A'])).toBe(true);        
        expect(groupsMatch(['A', 'B'], ['b', 'a'])).toBe(true);
        expect(groupsMatch(['A', 'B'], ['B',])).toBe(true);        
        expect(groupsMatch(['A', 'B'], ['a'])).toBe(true);
        expect(groupsMatch(['A'], ['B', 'A'])).toBe(true);        
        expect(groupsMatch(['B'], ['b', 'a'])).toBe(true);
    });
    test('Non-matching validation groups', () => {

        expect(groupsMatch('A', 'B')).toBe(false);
        expect(groupsMatch(['A'], ['B'])).toBe(false);
        expect(groupsMatch(['A'], ['B', 'C'])).toBe(false);
        expect(groupsMatch(['A', 'C'], ['B'])).toBe(false);
    });    
});
