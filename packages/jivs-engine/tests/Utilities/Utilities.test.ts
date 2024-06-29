import { ConditionEvaluateResult } from "../../src/Interfaces/Conditions";
import { deepClone, deepEquals, groupsMatch, isValueOfStringEnum, isPlainObject, isSupportedAsValue, valueForLog, findCaseInsensitiveValueInStringEnum } from "../../src/Utilities/Utilities";



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

describe('valueForLog', () => {
    test('Results are as expected', () => {
        class X
        {

        }
        expect(valueForLog(undefined)).toBe('[undefined]');
        expect(valueForLog(null)).toBe('[null]');
        expect(valueForLog(false)).toBe('false');
        expect(valueForLog(10)).toBe('10');
        expect(valueForLog('abc')).toBe('"abc"');
        expect(valueForLog(new Date())).toBe('Date');
        expect(valueForLog({ a: 1 })).toBe('Plain object');
        expect(valueForLog(new X())).toBe('X');   
        expect(valueForLog(X)).toBe('X');   // Class type itself
        expect(valueForLog([])).toBe('Array');
        expect(valueForLog(()=>0)).toBe('Function');        
        expect(valueForLog('123456789012345678901234567890')).toBe('"12345678901234567890"...');        
        expect(valueForLog('1234567890123456789012345')).toBe('"1234567890123456789012345"');        
        expect(valueForLog('12345678901234567890123456')).toBe('"12345678901234567890"...');  
        let testSymbol = Symbol('test');
        expect(valueForLog(testSymbol)).toBe('[symbol]');
    });
});

describe('isSupportedAsValue', () => {
    test('Results as expected', () => {
        class X { }
        expect(isSupportedAsValue(undefined)).toBe(true);
        expect(isSupportedAsValue(null)).toBe(true);
        expect(isSupportedAsValue(false)).toBe(true);
        expect(isSupportedAsValue(10)).toBe(true);
        expect(isSupportedAsValue('abc')).toBe(true);
        expect(isSupportedAsValue(new Date())).toBe(true);
        expect(isSupportedAsValue({ a: 1 })).toBe(true);
        expect(isSupportedAsValue(new X())).toBe(true);     
        expect(isSupportedAsValue([])).toBe(false);
        expect(isSupportedAsValue(new Object())).toBe(true);
        expect(isSupportedAsValue(new Error())).toBe(false);
        expect(isSupportedAsValue(new RegExp(''))).toBe(false);
        expect(isSupportedAsValue(new Map())).toBe(false);
        expect(isSupportedAsValue(new Set())).toBe(false);
        expect(isSupportedAsValue(new WeakMap())).toBe(false);
        expect(isSupportedAsValue(new WeakSet)).toBe(false);


    });
});

describe('isPlainObject', () => {
    test('Results as expected', () => {
        class X { }
        expect(isPlainObject(new Object())).toBe(true); 
        expect(isPlainObject({ a: 1 })).toBe(true);      
        expect(isPlainObject(new Date())).toBe(false);
        expect(isPlainObject(new X())).toBe(false);     
        expect(isPlainObject(new Set())).toBe(false);     
        expect(isPlainObject([])).toBe(false);       
        
        expect(isPlainObject(undefined)).toBe(false);
        expect(isPlainObject(null)).toBe(false);
        expect(isPlainObject(false)).toBe(false);
        expect(isPlainObject(10)).toBe(false);
        expect(isPlainObject('abc')).toBe(false);

    });
});

describe('isValueOfStringEnum', () => {
    enum TestEnum {
        FIRST = "First",
        SECOND = "Second",
        THIRD = "Third"
    }

    test('Key exists in enum', () => {
        expect(isValueOfStringEnum("First", TestEnum)).toBe(true);
        expect(isValueOfStringEnum("Second", TestEnum)).toBe(true);
    });

    test('Key does not exist in enum', () => {
        expect(isValueOfStringEnum("FOURTH", TestEnum)).toBe(false);
        expect(isValueOfStringEnum("Fifth", TestEnum)).toBe(false);
    });

    test('Empty string as key', () => {
        expect(isValueOfStringEnum("", TestEnum)).toBe(false);
    });

    test('Key case sensitivity', () => {
        expect(isValueOfStringEnum("first", TestEnum)).toBe(false); // Assuming isKeyInEnum is case-sensitive
        expect(isValueOfStringEnum("SECOND", TestEnum)).toBe(false);
    });
});

describe('Utilities.findCaseInsensitiveValueInStringEnum', () => {
    enum TestEnum {
        FirstValue = "Value1",
        SecondValue = "Value2",
        ThirdValue = "VALUE3"
    }

    test('Find existing value with exact case', () => {
        expect(findCaseInsensitiveValueInStringEnum("Value1", TestEnum)).toBe("Value1");
    });

    test('Find existing value with different case', () => {
        expect(findCaseInsensitiveValueInStringEnum("value1", TestEnum)).toBe("Value1");
        expect(findCaseInsensitiveValueInStringEnum("VALUE2", TestEnum)).toBe("Value2");
        expect(findCaseInsensitiveValueInStringEnum("value3", TestEnum)).toBe("VALUE3");
    });

    test('Return undefined for non-existing value', () => {
        expect(findCaseInsensitiveValueInStringEnum("NonExistingValue", TestEnum)).toBeUndefined();
    });

    test('Return undefined for empty string', () => {
        expect(findCaseInsensitiveValueInStringEnum("", TestEnum)).toBeUndefined();
    });

    test('Case insensitive match for all enum values', () => {
        expect(findCaseInsensitiveValueInStringEnum("value1", TestEnum)).toBe("Value1");
        expect(findCaseInsensitiveValueInStringEnum("value2", TestEnum)).toBe("Value2");
        expect(findCaseInsensitiveValueInStringEnum("value3", TestEnum)).toBe("VALUE3");
    });
});