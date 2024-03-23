import { AssertNotNull } from "../../src/Utilities/ErrorHandling";

// function AssertNotNull(valueToCheck: any, memberName: string = 'parameter'): void
describe("Utilities.AssertNotNull tests", () => {
    test("null or undefined is exception", () => {
        expect(() => AssertNotNull(null, 'parm')).toThrow('parm required');
        expect(() => AssertNotNull(undefined, 'parm')).toThrow('parm required');
    });
    test("values that do not throw an exception", () => {
        expect(() => AssertNotNull(0, 'parm')).not.toThrow();
        expect(() => AssertNotNull(false, 'parm')).not.toThrow();
        expect(() => AssertNotNull('', 'parm')).not.toThrow();
        expect(() => AssertNotNull({}, 'parm')).not.toThrow();
        expect(() => AssertNotNull([], 'parm')).not.toThrow();
   }); 
});