import { CachingService } from "../../src/Services/CachingService";

describe('CachingServices', () => {
    test('constructor', () => {
        expect(() => new CachingService()).not.toThrow();
    });

    test('get and set', () => {
        const cache = new CachingService();
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
    });

    test('remove', () => {
        const cache = new CachingService();
        cache.set('key1', 'value1');
        expect(cache.remove('key1')).toBe(true);
        expect(cache.get('key1')).toBeUndefined();
    });

    test('clear', () => {
        const cache = new CachingService();
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.clear();
        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBeUndefined();
    });
    // get without being set should return null
    test('get without being set', () => {
        const cache = new CachingService();
        expect(cache.get('key1')).toBeUndefined();
    });
    // remove without set
    test('remove without set', () => {
        const cache = new CachingService();
        expect(cache.remove('key1')).toBe(false);
    });

    // Set with same key should overwrite previous value
    test('set with same key should overwrite previous value', () => {
        const cache = new CachingService();
        cache.set('key1', 'value1');
        cache.set('key1', 'value2');
        expect(cache.get('key1')).toBe('value2');
    });

    // set null should remove the key
    test('set null should remove the key', () => {
        const cache = new CachingService();
        cache.set('key1', 'value1');
        cache.set('key1', null);
        expect(cache.get('key1')).toBeNull();
    });
    // set undefined should remove the key
    test('set undefined should remove the key', () => {
        const cache = new CachingService();
        cache.set('key1', 'value1');
        cache.set('key1', undefined);
        expect(cache.get('key1')).toBeUndefined();
    });
    // set null without an existing key should not throw an error
    test('set null without an existing key should not throw an error', () => {
        const cache = new CachingService();
        expect(() => cache.set('key1', null)).not.toThrow();
    });
    // set undefined without an existing key should not throw an error
    test('set undefined without an existing key should not throw an error', () => {
        const cache = new CachingService();
        expect(() => cache.set('key1', undefined)).not.toThrow();
    });
});