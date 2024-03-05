import { NameToFunctionMapper } from "../../src/Utilities/NameToFunctionMap";


describe('NameToFunctionMapper', () => {
    // Register(key: string, fnOrKey: ((...args: TValue[]) => TResult) | string): void
    test('Register with function and new key gives no errors', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        expect(() => testItem.Register('A', (val: any) => 'test1')).not.toThrow();
        expect(() => testItem.Register('B', (val: any) => 'test2')).not.toThrow();
    });
    test('Register with function and same key gives no errors', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        expect(() => testItem.Register('A', (val: any) => 'test1')).not.toThrow();
        expect(() => testItem.Register('A', (val: any) => 'test2')).not.toThrow();
    });    
    test('Register with alias key gives no errors', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        expect(() => testItem.Register('A', (val: any) => 'test1')).not.toThrow();
        expect(() => testItem.Register('B', 'A')).not.toThrow();
    });    
    test('Register with alias key to unknown registration throws', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        expect(() => testItem.Register('A', (val: any) => 'test1')).not.toThrow();
        expect(() => testItem.Register('B', 'D')).toThrow();
    });          
    test('Get returns correct function for known key', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        testItem.Register('test1', (val: any) => 'test1');
        testItem.Register('test2', (val: any) => 'test2');
        testItem.Register('test3', 'test1');
        testItem.Register('test2', (val: any) => 'test2 was replaced');

        let fn: any = undefined;
        expect(() => fn = testItem.Get('test1')).not.toThrow();
        expect(fn).not.toBeNull();
        expect(fn(1)).toBe('test1');
        fn = undefined;
        expect(() => fn = testItem.Get('test2')).not.toThrow();
        expect(fn).not.toBeNull();
        expect(fn(1)).toBe('test2 was replaced');   
        fn = undefined;
        expect(() => fn = testItem.Get('test3')).not.toThrow();
        expect(fn).not.toBeNull();
        expect(fn(1)).toBe('test1');        

    });            
    test('Get returns undefined for unknown key', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        testItem.Register('test1', (val: any) => 'test1');
        testItem.Register('test2', (val: any) => 'test2');

        let fn: any = 'placeholder';
        expect(() => fn = testItem.Get('test3')).not.toThrow();
        expect(fn).toBeUndefined();
    });
    test('Key of null is exception', () => {
        let testItem = new NameToFunctionMapper<any, string>();
        testItem.Register('test1', (val: any) => 'test1');
        testItem.Register('test2', (val: any) => 'test2');

        let fn: any = 'placeholder';
        expect(() => fn = testItem.Get(null!)).toThrow();
        expect(fn).toBe('placeholder');
    });    
});