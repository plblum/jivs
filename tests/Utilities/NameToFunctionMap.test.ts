import { NameToFunctionMapper } from "../../src/Utilities/NameToFunctionMap";


describe('NameToFunctionMapper', () => {
    // register(key: string, fnOrKey: ((...args: TValue[]) => TResult) | string): void
    test('register with function and new key gives no errors', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        expect(() => testItem.register('A', (val: any) => 'test1')).not.toThrow();
        expect(() => testItem.register('B', (val: any) => 'test2')).not.toThrow();
    });
    test('register with function and same key gives no errors', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        expect(() => testItem.register('A', (val: any) => 'test1')).not.toThrow();
        expect(() => testItem.register('A', (val: any) => 'test2')).not.toThrow();
    });    
    test('register with alias key gives no errors', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        expect(() => testItem.register('A', (val: any) => 'test1')).not.toThrow();
        expect(() => testItem.register('B', 'A')).not.toThrow();
    });    
    test('register with alias key to unknown registration throws', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        expect(() => testItem.register('A', (val: any) => 'test1')).not.toThrow();
        expect(() => testItem.register('B', 'D')).toThrow();
    });          
    test('Get returns correct function for known key', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        testItem.register('test1', (val: any) => 'test1');
        testItem.register('test2', (val: any) => 'test2');
        testItem.register('test3', 'test1');
        testItem.register('test2', (val: any) => 'test2 was replaced');

        let fn: any = undefined;
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
        let testItem = new NameToFunctionMapper<any, string>();
        testItem.register('test1', (val: any) => 'test1');
        testItem.register('test2', (val: any) => 'test2');

        let fn: any = 'placeholder';
        expect(() => fn = testItem.get('test3')).not.toThrow();
        expect(fn).toBeUndefined();
    });
    test('Key of null is exception', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        testItem.register('test1', (val: any) => 'test1');
        testItem.register('test2', (val: any) => 'test2');

        let fn: any = 'placeholder';
        expect(() => fn = testItem.get(null!)).toThrow();
        expect(fn).toBe('placeholder');
    });    
});