import { InvalidTypeError, assertNotNull } from "../../src/Utilities/ErrorHandling";

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