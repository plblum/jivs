import { TextLocalizerService } from './../../src/Services/TextLocalizerService';
// Localize(cultureIdToMatch: string, sourceText: string): string
describe('TextLocalizerService.Localize', () => {
    test('No matching registrations, return the fallback text.', () => {
        let testItem = new TextLocalizerService();
        expect(testItem.Localize('en', 'hello', 'fallback')).toBe('fallback');     // only a key
    });
    test('No matching registrations, no key supplied returns fallback text', () => {
        let testItem = new TextLocalizerService();
        expect(testItem.Localize('en', '', 'fallback')).toBe('fallback');
        expect(testItem.Localize('en', null, 'fallback')).toBe('fallback');
    });

    test('en registered only. Stored value on en, fallback on anything else', () => {
        let testItem = new TextLocalizerService();
        testItem.Register('hello', {
            'en': 'en-Hello'
        });
        expect(testItem.Localize('en', 'hello', 'fallback')).toBe('en-Hello');
        expect(testItem.Localize('en-GB', 'hello', 'GB-fallback')).toBe('en-Hello');
        // not supported culture
        expect(testItem.Localize('fr', 'hello', 'frFallback')).toBe('frFallback');
        // valid key, but not registered.
        expect(testItem.Localize('en', 'goodbye', 'fallback')).toBe('fallback');
        expect(testItem.Localize('en-GB', 'goodbye', 'GBfallback')).toBe('GBfallback');
    });
    test('en and es registered only. Stored value on en or es, fallback on anything else', () => {
        let testItem = new TextLocalizerService();
        testItem.Register('hello', {
            'en': 'en-Hello',
            'es': 'es-Hello'
        });
        expect(testItem.Localize('en', 'hello', 'fallback')).toBe('en-Hello');
        expect(testItem.Localize('es', 'hello', 'es-fallback')).toBe('es-Hello');
        expect(testItem.Localize('es-SP', 'hello', 'es-fallback')).toBe('es-Hello');
        // not supported culture
        expect(testItem.Localize('fr', 'hello', 'frFallback')).toBe('frFallback');
        // valid key, but not registered.
        expect(testItem.Localize('en', 'goodbye', 'fallback')).toBe('fallback');
        expect(testItem.Localize('es', 'goodbye', 'esfallback')).toBe('esfallback');

    });    
    test('Fallback uses * culture when supplied', () => {
        let testItem = new TextLocalizerService();
        testItem.Register('hello', {
            'fr': 'fr-Hello',
            '*': '*-Hello'
        });
        expect(testItem.Localize('en', 'hello', 'fallback')).toBe('*-Hello');
        expect(testItem.Localize('es', 'hello', 'fallback')).toBe('*-Hello');
        expect(testItem.Localize('fr', 'hello', 'fallback')).toBe('fr-Hello');
    });        
});