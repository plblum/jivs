import { ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { deepClone, deepEquals, groupsMatch, isValueOfStringEnum, isPlainObject, isSupportedAsValue, valueForLog, findCaseInsensitiveValueInStringEnum, deepCleanForJson, hasLetters, onlyTheseCharacters, hasMultipleOccurances, cleanString, objectKeysCount } from '../../src/Utilities/Utilities';



// function deepEquals(obj1: any, obj2: any): boolean
describe('Utilities.deepEquals', () => {
    test('Equal primitives', () => {
        expect(deepEquals(0, 0)).toBe(true);
        expect(deepEquals(0.1, 0.1)).toBe(true);
        expect(deepEquals(false, false)).toBe(true);
        expect(deepEquals('', '')).toBe(true);
        expect(deepEquals('A', 'A')).toBe(true);
        expect(deepEquals(ConditionEvaluateResult.Match, ConditionEvaluateResult.Match)).toBe(true);
    });
    test('Not equal primitives of same datatypes', () => {
        expect(deepEquals(0, 1)).toBe(false);
        expect(deepEquals(0.1, 0.2)).toBe(false);
        expect(deepEquals(false, true)).toBe(false);
        expect(deepEquals('', 'A')).toBe(false);
        expect(deepEquals('A', 'a')).toBe(false);
        expect(deepEquals(ConditionEvaluateResult.Match, ConditionEvaluateResult.NoMatch)).toBe(false);
    });
    test('Not equal primitives of different datatypes', () => {
        expect(deepEquals(0, '0')).toBe(false);
        expect(deepEquals(false, '0')).toBe(false);        
        expect(deepEquals('0', 0.0)).toBe(false);
        expect(deepEquals(0, null)).toBe(false);   
        expect(deepEquals(0, undefined)).toBe(false);
        expect(deepEquals(0, {})).toBe(false);
        expect(deepEquals({}, 0)).toBe(false);
    });    
    test('Equal objects', () => {
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
    test('Not equal objects with same properties, but different values always fail', () => {
        expect(deepEquals({ a: 1 }, { a: '1' })).toBe(false);
        expect(deepEquals({ a: 1 }, { a: 2 })).toBe(false);
        expect(deepEquals({ a: '2' }, { a: '1' })).toBe(false);
        expect(deepEquals({ a: false }, { a: true })).toBe(false);
        expect(deepEquals({ a: null }, { a: undefined })).toBe(false);
        expect(deepEquals({ a: null }, { a: 0 })).toBe(false);
        expect(deepEquals({ a: 1, b: false }, { a: 2, b: false })).toBe(false);
        expect(deepEquals({ a: 1, b: false }, { a: 1, b: true })).toBe(false);
    });     
    test('Not equal objects with different property lists always fail', () => {
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
    test('Contains child objects that are structurally the same, so they will match', () => {
        expect(deepEquals({ a: 1, b: {} }, { a: 1, b: {} })).toBe(true);
        expect(deepEquals({ b: { d: false } }, { b: { d: false } })).toBe(true);
        expect(deepEquals({ b: [] }, { b: [] })).toBe(true);
        expect(deepEquals({ b: [1, 2] }, { b: [1, 2] })).toBe(true);
    });      
    test('Contains child objects that are structurally the similar but not the same, so they don\'t match', () => {
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
        expect(deepClone('text')).toBe('text');
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
describe('Utilities.deepCleanForJson', () => {
    test('Handles undefined values', () => {
        expect(deepCleanForJson(undefined)).toBeUndefined();
    });

    test('Handles function values', () => {
        function testFunc() { }
        let source = { key: testFunc };
        expect(deepCleanForJson(source)).toEqual({ key: '[Function testFunc]' });
        let sourceAnon = { key: function () { } };
        expect(deepCleanForJson(sourceAnon)).toEqual({ key: '[Function key]' });
        let sourceLambda = { key: () => { } };
        expect(deepCleanForJson(sourceLambda)).toEqual({ key: '[Function key]' });
    });

    test('Handles null values', () => {
        let source = { key: null };
        expect(deepCleanForJson(source)).toEqual({ key: null });
    });

    test('Handles primitive values', () => {
        let sourceNumber = { key: 123 };
        expect(deepCleanForJson(sourceNumber)).toEqual({ key: 123 });
        let sourceString = { key: 'test' };
        expect(deepCleanForJson(sourceString)).toEqual({ key: 'test' });
        let sourceBoolean = { key: true };
        expect(deepCleanForJson(sourceBoolean)).toEqual({ key: true });
    });

    test('Handles Date objects', () => {
        const date = new Date();
        let source = { key: date };
        expect(deepCleanForJson(source)).toEqual({ key: date.toISOString() });
    });

    test('Handles RegExp objects', () => {
        const regex = /test/i;
        let source = { key: regex };
        expect(deepCleanForJson(source)).toEqual({ key: '/test/i' });
    });
    test('Class instances retained as a clone', () => {
        class X { }
        let source = { key: new X() };
        let result = deepCleanForJson(source);
        expect(result).toBeDefined();
        expect(result.key).toBeDefined();
        expect(result.key).not.toBe(source.key);
        expect(result.key).toEqual(source.key);
    });

    test('Handles circular references', () => {
        const obj: any = {};
        obj.self = obj;
        expect(deepCleanForJson(obj)).toEqual({});
    });

    test('Handles unsupported objects', () => {
        let sourceMap = { key: new Map() };
        expect(deepCleanForJson(sourceMap)).toEqual({});        
        let sourceSet = { key: new Set() };
        expect(deepCleanForJson(sourceSet)).toEqual({});
        let sourceWeakMap = { key: new WeakMap() };
        expect(deepCleanForJson(sourceWeakMap)).toEqual({});
        let sourceWeakSet = { key: new WeakSet() };
        expect(deepCleanForJson(sourceWeakSet)).toEqual({});
        let sourceError = { key: new Error() };
        expect(deepCleanForJson(sourceError)).toEqual({});
    });

    test('Cleans nested objects', () => {
        let date = new Date();
        const obj = {
            a: 1,
            b: {
                c: 2,
                d: undefined,
                e: function() {}
            },
            f: date,
            g: /test/i,
            h: [1, { i: true, j: undefined }, function() {}, date, /test/i]
        };
        const cleanedObj = deepCleanForJson(obj);
        expect(cleanedObj).toEqual({
            a: 1,
            b: {
                c: 2,
                e: '[Function e]'
            },
            f: date.toISOString(),
            g: '/test/i',
            h: [1, {i: true}, '[Function]', date.toISOString(), '/test/i']
        });
    });

    test('Cleans arrays', () => {
        let date = new Date();
        const arr = [1, undefined, function() {}, date, /test/i];
        const cleanedArr = deepCleanForJson(arr);
        expect(cleanedArr).toEqual([1, undefined, '[Function]', date.toISOString(), '/test/i']);
    });
    test('Nested arrays', () => {
        let date = new Date();
        let source = { key: [1, undefined, function () { }, date, /test/i] };
        expect(deepCleanForJson(source)).toEqual({ key: [1, undefined, '[Function]', date.toISOString(), '/test/i'] });
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
        FIRST = 'First',
        SECOND = 'Second',
        THIRD = 'Third'
    }

    test('Key exists in enum', () => {
        expect(isValueOfStringEnum('First', TestEnum)).toBe(true);
        expect(isValueOfStringEnum('Second', TestEnum)).toBe(true);
    });

    test('Key does not exist in enum', () => {
        expect(isValueOfStringEnum('FOURTH', TestEnum)).toBe(false);
        expect(isValueOfStringEnum('Fifth', TestEnum)).toBe(false);
    });

    test('Empty string as key', () => {
        expect(isValueOfStringEnum('', TestEnum)).toBe(false);
    });

    test('Key case sensitivity', () => {
        expect(isValueOfStringEnum('first', TestEnum)).toBe(false); // Assuming isKeyInEnum is case-sensitive
        expect(isValueOfStringEnum('SECOND', TestEnum)).toBe(false);
    });
});

describe('Utilities.findCaseInsensitiveValueInStringEnum', () => {
    enum TestEnum {
        FirstValue = 'Value1',
        SecondValue = 'Value2',
        ThirdValue = 'VALUE3'
    }

    test('Find existing value with exact case', () => {
        expect(findCaseInsensitiveValueInStringEnum('Value1', TestEnum)).toBe('Value1');
    });

    test('Find existing value with different case', () => {
        expect(findCaseInsensitiveValueInStringEnum('value1', TestEnum)).toBe('Value1');
        expect(findCaseInsensitiveValueInStringEnum('VALUE2', TestEnum)).toBe('Value2');
        expect(findCaseInsensitiveValueInStringEnum('value3', TestEnum)).toBe('VALUE3');
    });

    test('Return undefined for non-existing value', () => {
        expect(findCaseInsensitiveValueInStringEnum('NonExistingValue', TestEnum)).toBeUndefined();
    });

    test('Return undefined for empty string', () => {
        expect(findCaseInsensitiveValueInStringEnum('', TestEnum)).toBeUndefined();
    });

    test('Case insensitive match for all enum values', () => {
        expect(findCaseInsensitiveValueInStringEnum('value1', TestEnum)).toBe('Value1');
        expect(findCaseInsensitiveValueInStringEnum('value2', TestEnum)).toBe('Value2');
        expect(findCaseInsensitiveValueInStringEnum('value3', TestEnum)).toBe('VALUE3');
    });
    // return undefined if the enum value contains numbers
    type TestEnumWithNumbers ={
        FirstValue: 4,
        SecondValue: 5
    }
    test('Return undefined for enum values containing numbers', () => {
        // NOTE: TypeScript generated enums have a reverse mapping from the string to the number
        // like this: TestEnumWithNumbers['FirstValue'] = 4, TestEnumWithNumbers[4] = 'FirstValue'
        const fakeEnum = {
            FirstValue: 4,
            SecondValue: 5,
            ThirdValue: 'Value3'
        }
        expect(findCaseInsensitiveValueInStringEnum('FirstValue', fakeEnum)).toBeUndefined();
        expect(findCaseInsensitiveValueInStringEnum('SecondValue', fakeEnum)).toBeUndefined();
        expect(findCaseInsensitiveValueInStringEnum('ThirdValue', fakeEnum)).toBeUndefined();
    });


});
describe('hasLetters', () => {
    test('Results as expected', () => {
        expect(hasLetters('')).toBe(false);
        expect(hasLetters('123')).toBe(false);
        expect(hasLetters('abc')).toBe(true);
        expect(hasLetters('1a2b3c')).toBe(true);
        expect(hasLetters('!@#$%^&*()')).toBe(false);
    });
});
describe('onlyTheseCharacters', () => {
    test('Results as expected', () => {
        expect(onlyTheseCharacters('', '', '')).toBe(true);
        expect(onlyTheseCharacters('123', '123', '')).toBe(true);
        expect(onlyTheseCharacters('abc', 'abc', '')).toBe(true);
        expect(onlyTheseCharacters('abc', '123', '')).toBe(false);
        // get non alphanumeric characters involved
        expect(onlyTheseCharacters('!@#$%^&*()', '!@#$%^&*()', '')).toBe(true);
        expect(onlyTheseCharacters('!@#$%^&*()', '!@#$%^&*', '')).toBe(false);
        // get RegExp symbols involved. In particular, \d, \s, \w, etc
        expect(onlyTheseCharacters('123', '', '\\d')).toBe(true);
        expect(onlyTheseCharacters('abc', '', '\\d')).toBe(false);
        expect(onlyTheseCharacters('abc', '', '\\w')).toBe(true);
        expect(onlyTheseCharacters('_', 'abc', '\\w')).toBe(true);
        expect(onlyTheseCharacters(' ', 'abc', '\\w')).toBe(false);
        expect(onlyTheseCharacters('*', 'abc', '\\w')).toBe(false);
        expect(onlyTheseCharacters(' ', '', '\\s')).toBe(true);
        expect(onlyTheseCharacters('a', 'abc', '\\w')).toBe(true);
        expect(onlyTheseCharacters('D', 'abc', '\\w')).toBe(true);  // because D is covered by \w

    });
});
describe('hasMultipleOccurances', () => {
    test('Results as expected', () => {

        expect(hasMultipleOccurances('', '')).toBe(false);
        expect(hasMultipleOccurances('123', '')).toBe(false);
        expect(hasMultipleOccurances('abc', '')).toBe(false);
        expect(hasMultipleOccurances('abc', 'a')).toBe(false);
        expect(hasMultipleOccurances('abc', 'b')).toBe(false);
        expect(hasMultipleOccurances('aabc', 'a')).toBe(true);
        expect(hasMultipleOccurances('abbc', 'b')).toBe(true);
        // strings containing several of the same character, amongst others, not always sequential
        expect(hasMultipleOccurances('aabbccaa', 'a')).toBe(true);
        expect(hasMultipleOccurances('abccaab', 'b')).toBe(true);
        // non-alpha 
        expect(hasMultipleOccurances('!@#$%^&*()', '!')).toBe(false);
        expect(hasMultipleOccurances('!!@#$%^&*()', '!')).toBe(true);
        expect(hasMultipleOccurances('!@#$%^&*()!', '!')).toBe(true);
        // numbers
        expect(hasMultipleOccurances('1234567890', '1')).toBe(false);
        expect(hasMultipleOccurances('11234567890', '1')).toBe(true);
        expect(hasMultipleOccurances('12345678901', '1')).toBe(true);

    });
});
describe('cleanString', () => {
    test('Results as expected', () => {
        expect(cleanString('')).toBe(null);
        expect(cleanString(' ')).toBe(null);
        expect(cleanString('  ')).toBe(null);
        expect(cleanString('abc')).toBe('abc');
        expect(cleanString(' abc')).toBe('abc');
        expect(cleanString('abc ')).toBe('abc');
        expect(cleanString(' abc ')).toBe('abc');
        expect(cleanString('123')).toBe('123');
        expect(cleanString(' 123 ')).toBe('123');

        expect(cleanString('!@#$%^&*()')).toBe('!@#$%^&*()');
        expect(cleanString(' !@#$%^&*() ')).toBe('!@#$%^&*()');

        expect(cleanString(null)).toBe(null);
        expect(cleanString(undefined)).toBe(null);

    });
});
describe('objectKeysCount', () => {
    // function objectKeysCount(value: object | null): number
    test('Results as expected', () => {
        expect(objectKeysCount(null)).toBe(0);
        expect(objectKeysCount({})).toBe(0);
        expect(objectKeysCount({ a: 1 })).toBe(1);
        expect(objectKeysCount({ a: 1, b: 2 })).toBe(2);
        expect(objectKeysCount({ a: 1, b: 2, c: 3 })).toBe(3);
    });
});