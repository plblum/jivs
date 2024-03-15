import { RegExpCondition } from './../../src/Conditions/ConcreteConditions';
import { ConditionEvaluateResult } from "../../src/Interfaces/Conditions";
import { AssertNotNull } from "../../src/Utilities/ErrorHandling";
import { CultureLanguageCode, DeepClone, DeepEquals, ValidationGroupsMatch } from "../../src/Utilities/Utilities";



// function ShallowEquals(obj1: any, obj2: any): boolean
describe("Utilities.DeepEquals", () => {
    test("Equal primitives", () => {
        expect(DeepEquals(0, 0)).toBe(true);
        expect(DeepEquals(0.1, 0.1)).toBe(true);
        expect(DeepEquals(false, false)).toBe(true);
        expect(DeepEquals('', '')).toBe(true);
        expect(DeepEquals('A', 'A')).toBe(true);
        expect(DeepEquals(ConditionEvaluateResult.Match, ConditionEvaluateResult.Match)).toBe(true);
    });
    test("Not equal primitives of same datatypes", () => {
        expect(DeepEquals(0, 1)).toBe(false);
        expect(DeepEquals(0.1, 0.2)).toBe(false);
        expect(DeepEquals(false, true)).toBe(false);
        expect(DeepEquals('', 'A')).toBe(false);
        expect(DeepEquals('A', 'a')).toBe(false);
        expect(DeepEquals(ConditionEvaluateResult.Match, ConditionEvaluateResult.NoMatch)).toBe(false);
    });
    test("Not equal primitives of different datatypes", () => {
        expect(DeepEquals(0, '0')).toBe(false);
        expect(DeepEquals(false, '0')).toBe(false);        
        expect(DeepEquals('0', 0.0)).toBe(false);
        expect(DeepEquals(0, null)).toBe(false);   
        expect(DeepEquals(0, undefined)).toBe(false);
        expect(DeepEquals(0, {})).toBe(false);
        expect(DeepEquals({}, 0)).toBe(false);
    });    
    test("Equal objects", () => {
        expect(DeepEquals({}, {})).toBe(true);
        expect(DeepEquals({ a: 1 }, { a: 1 })).toBe(true);
        expect(DeepEquals({ a: '1' }, { a: '1' })).toBe(true);
        expect(DeepEquals({ a: false }, { a: false })).toBe(true);
        expect(DeepEquals({ a: null }, { a: null })).toBe(true);
        expect(DeepEquals({ a: 1, b: false }, { a: 1, b: false })).toBe(true);
        let sharedObj1 = {};
        expect(DeepEquals({ a: 1, b: false, c: sharedObj1 }, { a: 1, b: false, c: sharedObj1 })).toBe(true);
        let sharedObj2 = { d: 0 };
        expect(DeepEquals({ a: 1, b: false, c: sharedObj2 }, { a: 1, b: false, c: sharedObj2 })).toBe(true);
    
    });    
    test("Not equal objects with same properties, but different values always fail", () => {
        expect(DeepEquals({ a: 1 }, { a: '1' })).toBe(false);
        expect(DeepEquals({ a: 1 }, { a: 2 })).toBe(false);
        expect(DeepEquals({ a: '2' }, { a: '1' })).toBe(false);
        expect(DeepEquals({ a: false }, { a: true })).toBe(false);
        expect(DeepEquals({ a: null }, { a: undefined })).toBe(false);
        expect(DeepEquals({ a: null }, { a: 0 })).toBe(false);
        expect(DeepEquals({ a: 1, b: false }, { a: 2, b: false })).toBe(false);
        expect(DeepEquals({ a: 1, b: false }, { a: 1, b: true })).toBe(false);
    });     
    test("Not equal objects with different property lists always fail", () => {
        expect(DeepEquals({}, { a: 1 })).toBe(false);
        expect(DeepEquals({ a: 1 }, {})).toBe(false);
        expect(DeepEquals({ a: 1 }, { b: 1 })).toBe(false);
        expect(DeepEquals({ a: 1 }, { b: '1' })).toBe(false);
        expect(DeepEquals({ a: '2' }, { b: '2' })).toBe(false);
        expect(DeepEquals({ a: 1, b: false }, { a: 2, b: false })).toBe(false);
        expect(DeepEquals({ a: 1, b: false }, { a: 1, b: true })).toBe(false);
        expect(DeepEquals({ a: 1, b: false }, { a: 1 })).toBe(false);
        expect(DeepEquals({ a: 1, b: false }, { b: false })).toBe(false);
        expect(DeepEquals({ a: 1 }, { a: 1, b: false })).toBe(false);
        expect(DeepEquals({ b: false }, { a: 1, b: false })).toBe(false);
    });   
    test("Contains child objects that are structurally the same, so they will match", () => {
        expect(DeepEquals({ a: 1, b: {} }, { a: 1, b: {} })).toBe(true);
        expect(DeepEquals({ b: { d: false } }, { b: { d: false } })).toBe(true);
        expect(DeepEquals({ b: [] }, { b: [] })).toBe(true);
        expect(DeepEquals({ b: [1, 2] }, { b: [1, 2] })).toBe(true);
    });      
    test("Contains child objects that are structurally the similar but not the same, so they don't match", () => {
        expect(DeepEquals({ a: 1, b: {} }, { a: 1, b: 0 })).toBe(false);
        expect(DeepEquals({ a: 1, b: {} }, { a: 1, b: { c: 1 } })).toBe(false);
        expect(DeepEquals({ b: { d: false } }, { b: { d: true } })).toBe(false);
        expect(DeepEquals({ b: [] }, { b: [1] })).toBe(false);
        expect(DeepEquals({ b: [1, 2] }, { b: [2, 1] })).toBe(false);
    });          
});

// function DeepClone<T>(value: any): any
describe('Utilities.DeepClone', () => {
    test('Primitives return the same', () => {
        expect(DeepClone(0)).toBe(0);
        expect(DeepClone(false)).toBe(false);
        expect(DeepClone(null)).toBe(null);
        expect(DeepClone("text")).toBe("text");
    });
    test('Date object', () => {
        let d1 = new Date(Date.UTC(2000, 5, 1));
        expect(DeepClone(d1)).toEqual(d1);
    });
    test('Objects', () => {
        let d1 = new Date(Date.UTC(2000, 5, 1));
        expect(DeepClone({})).toEqual({});
        expect(DeepClone({ a: 'x' })).toEqual({ a: 'x' });
        expect(DeepClone({ a: 'x', b: false })).toEqual({ a: 'x', b: false });
        expect(DeepClone({ a: 'x', b: d1 })).toEqual({ a: 'x', b: d1 });
        expect(DeepClone({ a: 'x', b: null })).toEqual({ a: 'x', b: null });
        expect(DeepClone({ a: {}, b: false })).toEqual({ a: {}, b: false });
        expect(DeepClone({ a: { c: 'see' }, b: false })).toEqual({ a: { c: 'see'}, b: false });
        expect(DeepClone({ a: { c: { d: 'dee' } }, b: false, s: [] })).toEqual({ a: { c: { d: 'dee' } }, b: false, s: [] });

    });
    test('Arrays', () => {
        expect(DeepClone([])).toEqual([]);
        expect(DeepClone([1, 2])).toEqual([1, 2]);        
        expect(DeepClone([{a: 1}])).toEqual([{a: 1}]);        
    });    
});

// function ValidationGroupsMatch(group1: string | Array<string> | undefined | null,
//    group2: string | Array<string>| undefined | null): boolean
describe('Utilities.ValidationGroupsMatch', () => {
    test('Matching validation groups', () => {
        expect(ValidationGroupsMatch(null, null)).toBe(true); 
        expect(ValidationGroupsMatch(undefined, undefined)).toBe(true); 
        expect(ValidationGroupsMatch('', '')).toBe(true);
        expect(ValidationGroupsMatch(null, undefined)).toBe(true); 
        expect(ValidationGroupsMatch(undefined, '')).toBe(true); 
        expect(ValidationGroupsMatch([], '')).toBe(true);
        expect(ValidationGroupsMatch('A', 'A')).toBe(true);
        expect(ValidationGroupsMatch([], [])).toBe(true);
        expect(ValidationGroupsMatch(['A'], ['A'])).toBe(true);
        expect(ValidationGroupsMatch(['A'], ['a'])).toBe(true);
        expect(ValidationGroupsMatch(['a'], ['A'])).toBe(true);
        expect(ValidationGroupsMatch(['A', 'B'], ['A', 'B'])).toBe(true);
        expect(ValidationGroupsMatch(['A', 'B'], ['a', 'b'])).toBe(true);
        expect(ValidationGroupsMatch(['A', 'B'], ['B', 'A'])).toBe(true);        
        expect(ValidationGroupsMatch(['A', 'B'], ['b', 'a'])).toBe(true);
        expect(ValidationGroupsMatch(['A', 'B'], ['B',])).toBe(true);        
        expect(ValidationGroupsMatch(['A', 'B'], ['a'])).toBe(true);
        expect(ValidationGroupsMatch(['A'], ['B', 'A'])).toBe(true);        
        expect(ValidationGroupsMatch(['B'], ['b', 'a'])).toBe(true);
    });
    test('Non-matching validation groups', () => {

        expect(ValidationGroupsMatch('A', 'B')).toBe(false);
        expect(ValidationGroupsMatch(['A'], ['B'])).toBe(false);
        expect(ValidationGroupsMatch(['A'], ['B', 'C'])).toBe(false);
        expect(ValidationGroupsMatch(['A', 'C'], ['B'])).toBe(false);
    });    
});

describe('CultureLanguageCode', () => {
    test('Returns the country code as text before a dash', () => {
        expect(CultureLanguageCode('en-US')).toBe('en');
        expect(CultureLanguageCode('Abcdef-FR')).toBe('Abcdef');    // because we return everything verbatim if it lacks a dash
        expect(CultureLanguageCode('-FR')).toBe('-FR'); // dash at the start is a meaningless value
    });    
    test('Returns the same when it lacks the country code', () => {
        expect(CultureLanguageCode('en')).toBe('en');
        expect(CultureLanguageCode('Abcdef')).toBe('Abcdef');    // because we return everything verbatim if it lacks a dash
    });
});