import { CodingError, InvalidTypeError, assertFunction, assertNotEmptyString, assertNotNull, ensureError } from "../../src/Utilities/ErrorHandling";

// function assertNotNull(valueToCheck: any, memberName: string = 'parameter'): void
describe("Utilities.assertNotNull tests", () => {
    test("null or undefined is exception", () => {
        expect(() => assertNotNull(null, 'parm')).toThrow('parm required');
        expect(() => assertNotNull(undefined, 'parm')).toThrow('parm required');
    });
    test("values that do not throw an exception", () => {
        expect(() => assertNotNull(0, 'parm')).not.toThrow();
        expect(() => assertNotNull(false, 'parm')).not.toThrow();
        expect(() => assertNotNull('', 'parm')).not.toThrow();
        expect(() => assertNotNull({}, 'parm')).not.toThrow();
        expect(() => assertNotNull([], 'parm')).not.toThrow();
   }); 
});
describe("Utilities.assertNotEmptyString tests", () => {
    test("empty string, not a string, null or undefined is exception", () => {
        expect(() => assertNotEmptyString(null, 'parm')).toThrow('parm required');
        expect(() => assertNotEmptyString(undefined, 'parm')).toThrow('parm required');
        expect(() => assertNotEmptyString('', 'parm')).toThrow('parm not empty string');
        expect(() => assertNotEmptyString(0, 'parm')).toThrow('parm must be string');
        
    });
    test("values that do not throw an exception", () => {
        expect(() => assertNotEmptyString('abc', 'parm')).not.toThrow();
        expect(() => assertNotEmptyString('  ', 'parm')).not.toThrow();
   }); 
});
describe('assertFunction', () => {
    test('With function, does not throw', () => {
        function testFunction(): number
        {
            return 0;
        }
       expect(() => assertFunction(()=>0)).not.toThrow();
       expect(() => assertFunction(testFunction)).not.toThrow();
    });
    test('With non-function, throws', () => {
        expect(() => assertFunction(null)).toThrow('Function expected');
        expect(() => assertFunction(undefined)).toThrow('Function expected');
        expect(() => assertFunction(0)).toThrow('Function expected');
        expect(() => assertFunction('')).toThrow('Function expected');
        expect(() => assertFunction({})).toThrow('Function expected');
    });
});
describe('InvalidTypeError', () => {
    test('create', () => {
        let testItem = new InvalidTypeError('Value');
        expect(testItem.message).toBe('Type is not supported for this value: "Value"');
        expect(testItem).toBeInstanceOf(Error);
    });
});

describe('ensureError', () => {
    test('Pass in Error instance returns the same instance', () => {
        let testItem = new Error('message');
        expect(ensureError(testItem)).toBe(testItem);
        
    });
    test('Pass in Error subclass instance returns the same instance', () => {
        let testItem = new CodingError('message');
        expect(ensureError(testItem)).toBe(testItem);
    });
    test('Non-Error class and non-string values all return the expected result of a Error with message created by valueForLog()', () => {
        function runTest(value: any, message: string): void
        {
            let testItem = ensureError(value);
            expect(testItem).toBeInstanceOf(Error);
            expect(testItem.message).toBe(message);
        }
        class X
        {

        }
        runTest(undefined, '[undefined]');
        runTest(null, '[null]');
        runTest(false, 'false');
        runTest(10, '10');
        runTest(new Date(), 'Date');
        runTest({ a: 1 }, 'Plain object');
        runTest(new X(), 'X');     
        runTest(X, 'X');
        runTest([], 'Array');
        runTest(()=>0, 'Function');         
    });    
    test('String values all return the expected result of a CodingError with string itself as the message', () => {
        function runTest(value: any, message: string): void
        {
            let testItem = ensureError(value);
            expect(testItem).toBeInstanceOf(CodingError);
            expect(testItem.message).toBe(message);
        }

        runTest('abc', 'abc');
        runTest('123456789012345678901234567890', '123456789012345678901234567890');            
    });        
});