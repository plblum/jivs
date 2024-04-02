import { TextLocalizerService } from './../../src/Services/TextLocalizerService';
// localize(cultureIdToMatch: string, sourceText: string): string
describe('TextLocalizerService.localize', () => {
    test('No matching registrations, return the fallback text.', () => {
        let testItem = new TextLocalizerService();
        expect(testItem.localize('en', 'hello', 'fallback')).toBe('fallback');     // only a key
    });
    test('No matching registrations, no key supplied returns fallback text', () => {
        let testItem = new TextLocalizerService();
        expect(testItem.localize('en', '', 'fallback')).toBe('fallback');
        expect(testItem.localize('en', null, 'fallback')).toBe('fallback');
    });

    test('en registered only. Stored value on en, fallback on anything else', () => {
        let testItem = new TextLocalizerService();
        testItem.register('hello', {
            'en': 'en-Hello'
        });
        expect(testItem.localize('en', 'hello', 'fallback')).toBe('en-Hello');
        expect(testItem.localize('en-GB', 'hello', 'GB-fallback')).toBe('en-Hello');
        // not supported culture
        expect(testItem.localize('fr', 'hello', 'frFallback')).toBe('frFallback');
        // valid key, but not registered.
        expect(testItem.localize('en', 'goodbye', 'fallback')).toBe('fallback');
        expect(testItem.localize('en-GB', 'goodbye', 'GBfallback')).toBe('GBfallback');
    });
    test('en and es registered only. Stored value on en or es, fallback on anything else', () => {
        let testItem = new TextLocalizerService();
        testItem.register('hello', {
            'en': 'en-Hello',
            'es': 'es-Hello'
        });
        expect(testItem.localize('en', 'hello', 'fallback')).toBe('en-Hello');
        expect(testItem.localize('es', 'hello', 'es-fallback')).toBe('es-Hello');
        expect(testItem.localize('es-SP', 'hello', 'es-fallback')).toBe('es-Hello');
        // not supported culture
        expect(testItem.localize('fr', 'hello', 'frFallback')).toBe('frFallback');
        // valid key, but not registered.
        expect(testItem.localize('en', 'goodbye', 'fallback')).toBe('fallback');
        expect(testItem.localize('es', 'goodbye', 'esfallback')).toBe('esfallback');

    });    
    test('Fallback uses * culture when supplied', () => {
        let testItem = new TextLocalizerService();
        testItem.register('hello', {
            'fr': 'fr-Hello',
            '*': '*-Hello'
        });
        expect(testItem.localize('en', 'hello', 'fallback')).toBe('*-Hello');
        expect(testItem.localize('es', 'hello', 'fallback')).toBe('*-Hello');
        expect(testItem.localize('fr', 'hello', 'fallback')).toBe('fr-Hello');
    });        
});