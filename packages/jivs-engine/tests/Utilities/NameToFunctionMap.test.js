import { NameToFunctionMapper } from "../../src/Utilities/NameToFunctionMap";
describe('NameToFunctionMapper', () => {
    // register(key: string, fnOrKey: ((...args: TValue[]) => TResult) | string): void
    test('register with function and new key gives no errors', () => {
        let testItem = new NameToFunctionMapper();
        expect(() => testItem.register('A', (val) => 'test1')).not.toThrow();
        expect(() => testItem.register('B', (val) => 'test2')).not.toThrow();
    });
    test('register with function and same key gives no errors', () => {
        let testItem = new NameToFunctionMapper();
        expect(() => testItem.register('A', (val) => 'test1')).not.toThrow();
        expect(() => testItem.register('A', (val) => 'test2')).not.toThrow();
    });
    test('register with alias key gives no errors', () => {
        let testItem = new NameToFunctionMapper();
        expect(() => testItem.register('A', (val) => 'test1')).not.toThrow();
        expect(() => testItem.register('B', 'A')).not.toThrow();
    });
    test('register with alias key to unknown registration throws', () => {
        let testItem = new NameToFunctionMapper();
        expect(() => testItem.register('A', (val) => 'test1')).not.toThrow();
        expect(() => testItem.register('B', 'D')).toThrow();
    });
    test('Get returns correct function for known key', () => {
        let testItem = new NameToFunctionMapper();
        testItem.register('test1', (val) => 'test1');
        testItem.register('test2', (val) => 'test2');
        testItem.register('test3', 'test1');
        testItem.register('test2', (val) => 'test2 was replaced');
        let fn = undefined;
        expect(() => fn = testItem.get('test1')).not.toThrow();
        expect(fn).not.toBeNull();
        expect(fn(1)).toBe('test1');
        fn = undefined;
        expect(() => fn = testItem.get('test2')).not.toThrow();
        expect(fn).not.toBeNull();
        expect(fn(1)).toBe('test2 was replaced');
        fn = undefined;
        expect(() => fn = testItem.get('test3')).not.toThrow();
        expect(fn).not.toBeNull();
        expect(fn(1)).toBe('test1');
    });
    test('Get returns undefined for unknown key', () => {
        let testItem = new NameToFunctionMapper();
        testItem.register('test1', (val) => 'test1');
        testItem.register('test2', (val) => 'test2');
        let fn = 'placeholder';
        expect(() => fn = testItem.get('test3')).not.toThrow();
        expect(fn).toBeUndefined();
    });
    test('Key of null is exception', () => {
        let testItem = new NameToFunctionMapper();
        testItem.register('test1', (val) => 'test1');
        testItem.register('test2', (val) => 'test2');
        let fn = 'placeholder';
        expect(() => fn = testItem.get(null)).toThrow();
        expect(fn).toBe('placeholder');
    });
});
//# sourceMappingURL=NameToFunctionMap.test.js.map