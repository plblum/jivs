import { CodingError, InvalidTypeError, assertNotNull, ensureError } from "../../src/Utilities/ErrorHandling";

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
describe('InvalidTypeError', () => {
    test('create', () => {
        let testItem = new InvalidTypeError('Value');
        expect(testItem.message).toBe('Type is not supported for this value: Value');
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
        runTest([], 'Array');
        runTest(()=>0, '[function]');         
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