import { TextLocalizerService } from './../../src/Services/TextLocalizerService';
// Localize(cultureIdToMatch: string, sourceText: string): string
describe('TextLocalizerService.Localize', () => {
    test('No matching registrations, legal keys return the fallback text.', () => {
        let testItem = new TextLocalizerService();
        expect(testItem.Localize('en', '!hello')).toBe('');     // only a key
        expect(testItem.Localize('en', '!hello|')).toBe('');    // only a key
        expect(testItem.Localize('en', '!hello| ')).toBe(' ');  // value of ' '
        expect(testItem.Localize('en', '!1')).toBe(''); // key is 1
        expect(testItem.Localize('en', '!_')).toBe('');  // key is _
        expect(testItem.Localize('en', '!1|a')).toBe('a');
        expect(testItem.Localize('en', '!_|!')).toBe('!');
    });
    test('No matching registrations, no valid key supplied returns entire string', () => {
        let testItem = new TextLocalizerService();
        expect(testItem.Localize('en', '')).toBe('');
        expect(testItem.Localize('en', 'hello')).toBe('hello');
        expect(testItem.Localize('fr', 'hello')).toBe('hello');
        expect(testItem.Localize('fr', 'hello there, {token}!')).toBe('hello there, {token}!');        
        expect(testItem.Localize('en', '!')).toBe('!');
        expect(testItem.Localize('en', '!:')).toBe('!:');       // no valid key   
        expect(testItem.Localize('en', '!a:')).toBe('!a:');     // no valid key 
        expect(testItem.Localize('en', '! hello')).toBe('! hello'); // no valid key
        expect(testItem.Localize('en', '!!hello')).toBe('!!hello'); // no valid key
        expect(testItem.Localize('en', ' !hello')).toBe(' !hello'); // no lead !
    });

    test('Expected behavior with en registration only, legal keys.', () => {
        let testItem = new TextLocalizerService();
        testItem.Register('hello', {
            'en': 'en-Hello'
        });
        expect(testItem.Localize('en', '!hello')).toBe('en-Hello');
        expect(testItem.Localize('en', '!hello|')).toBe('en-Hello');
        expect(testItem.Localize('en', '!hello|alt')).toBe('en-Hello');
        // falls back to language only
        expect(testItem.Localize('en-GB', '!hello')).toBe('en-Hello');
        expect(testItem.Localize('en-GB', '!hello|')).toBe('en-Hello');
        expect(testItem.Localize('en-GB', '!hello|alt')).toBe('en-Hello');
        // not supported culture
        expect(testItem.Localize('fr', '!hello|alt')).toBe('alt');
        // valid key, but not registered.
        expect(testItem.Localize('en', '!goodbye')).toBe('');
        expect(testItem.Localize('en', '!goodbye|Yo')).toBe('Yo');
    });
    test('Expected behavior with en and sp registrations, legal keys.', () => {
        let testItem = new TextLocalizerService();
        testItem.Register('hello', {
            'en': 'en-Hello',
            'es': 'es-Hello'
        });
        expect(testItem.Localize('en', '!hello')).toBe('en-Hello');
        expect(testItem.Localize('es', '!hello')).toBe('es-Hello');
        expect(testItem.Localize('es', '!hello|')).toBe('es-Hello');
        expect(testItem.Localize('es', '!hello|alt')).toBe('es-Hello');        // falls back to language only
        expect(testItem.Localize('es-SP', '!hello')).toBe('es-Hello');
        // not supported culture
        expect(testItem.Localize('fr', '!hello|alt')).toBe('alt');
        // valid key, but not registered.
        expect(testItem.Localize('en', '!goodbye')).toBe('');
        expect(testItem.Localize('en', '!goodbye|Yo')).toBe('Yo');
    });    
    test('Expected behavior with the fallback token * and  legal keys.', () => {
        let testItem = new TextLocalizerService();
        testItem.Register('hello', {
            'fr': 'fr-Hello',
            '*': '*-Hello'
        });
        expect(testItem.Localize('en', '!hello')).toBe('*-Hello');
        expect(testItem.Localize('es', '!hello')).toBe('*-Hello');
        expect(testItem.Localize('fr', '!hello')).toBe('fr-Hello');
    });        
});