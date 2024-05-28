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
    test('With fallbackService setup, request a value that exists on the top level, and that value is returned.', () => {
        let testItem = new TextLocalizerService();
        testItem.register('hello', {
            'en': 'en-Hello'
        });
        let fallbackService = new TextLocalizerService();
        testItem.fallbackService = fallbackService;
        fallbackService.register('hello', {
            'en': 'en-Hello-fallback'
        });
        expect(testItem.localize('en', 'hello', 'fallback')).toBe('en-Hello');
    });
    test('With fallbackService setup, request a value that is not on the top level but in the fallbackService, and the value from fallbackService is returned.', () => {
        let testItem = new TextLocalizerService();
        testItem.register('yo', {
            'en': 'en-Hello'
        });
        let fallbackService = new TextLocalizerService();
        testItem.fallbackService = fallbackService;
        testItem.register('hello', {
            'en': 'en-Hello-fallbackService'
        });
        expect(testItem.localize('en', 'hello', 'fallback')).toBe('en-Hello-fallbackService');
    });    
    test('With fallbackService setup, request a value that is in neither service, and the value from the fallback parameter is returned.', () => {
        let testItem = new TextLocalizerService();
        testItem.register('yo', {
            'en': 'en-Hello'
        });
        let fallbackService = new TextLocalizerService();
        testItem.fallbackService = fallbackService;
        testItem.register('hello', {
            'en': 'en-Hello-fallback'
        });
        expect(testItem.localize('en', 'X', 'fallback')).toBe('fallback');
        // not matching language
        expect(testItem.localize('sp', 'hello', 'fallback')).toBe('fallback');
        expect(testItem.localize('sp', 'yo', 'fallback')).toBe('fallback');        
    });    
});
describe('getErrorMessage', () => {
    function createTextLocalizerService(): TextLocalizerService
    {
        let tls = new TextLocalizerService();
        tls.registerErrorMessage('Code1', null, {
            '*': 'Code1-errormessage'
        });
        tls.registerErrorMessage('Code2', null, {
            '*': 'Code2-errormessage',
            'en': 'en-Code2-errormessage'
        });        
        return tls;
    }
    test('Requested value exists and is returned', () => {
        let testItem = createTextLocalizerService();
        expect(testItem.getErrorMessage('en', 'Code1', null)).toBe('Code1-errormessage');
        expect(testItem.getErrorMessage('en', 'Code2', null)).toBe('en-Code2-errormessage');
        expect(testItem.getErrorMessage('fr', 'Code2', null)).toBe('Code2-errormessage');        
    });
    test('Requested value does not exist and null is returned', () => {
        let testItem = createTextLocalizerService();
        expect(testItem.getErrorMessage('en', 'X1', null)).toBeNull();
    });    
    test('With fallbackService containing an override to Code1 and a new value, Code3, requested value exists and is returned. Requested value does not exist, returns null.', () => {
        let testItem = new TextLocalizerService();
        let fallbackService = createTextLocalizerService();
        testItem.fallbackService = fallbackService;
        fallbackService.registerErrorMessage('Code1', null, {
            '*': 'Code1-errormessage-topLevel'
        });
        fallbackService.registerErrorMessage('Code3', null, {
            '*': 'Code3-errormessage-topLevel',
            'en': 'en-Code3-errormessage-topLevel'
        });
        expect(testItem.getErrorMessage('en', 'Code1', null)).toBe('Code1-errormessage-topLevel');
        expect(testItem.getErrorMessage('en', 'Code2', null)).toBe('en-Code2-errormessage');
        expect(testItem.getErrorMessage('fr', 'Code2', null)).toBe('Code2-errormessage');        
        expect(testItem.getErrorMessage('en', 'Code3', null)).toBe('en-Code3-errormessage-topLevel');
        expect(testItem.getErrorMessage('fr', 'Code3', null)).toBe('Code3-errormessage-topLevel');       
        expect(testItem.getErrorMessage('fr', 'Code4', null)).toBeNull();     
    });    
});
describe('getSummaryMessage', () => {
    function createTextLocalizerService(): TextLocalizerService
    {
        let tls = new TextLocalizerService();
        tls.registerSummaryMessage('Code1', null, {
            '*': 'Code1-summarymessage'
        });
        tls.registerSummaryMessage('Code2', null, {
            '*': 'Code2-summarymessage',
            'en': 'en-Code2-summarymessage'
        });        
        return tls;
    }
    test('Requested value exists and is returned', () => {
        let testItem = createTextLocalizerService();
        expect(testItem.getSummaryMessage('en', 'Code1', null)).toBe('Code1-summarymessage');
        expect(testItem.getSummaryMessage('en', 'Code2', null)).toBe('en-Code2-summarymessage');
        expect(testItem.getSummaryMessage('fr', 'Code2', null)).toBe('Code2-summarymessage');        
    });
    test('Requested value does not exist and null is returned', () => {
        let testItem = createTextLocalizerService();
        expect(testItem.getSummaryMessage('en', 'X1', null)).toBeNull();
    });    
    test('With fallbackService containing an override to Code1 and a new value, Code3, requested value exists and is returned. Requested value does not exist, returns null.', () => {
        let testItem = new TextLocalizerService();
        let fallbackService = createTextLocalizerService();
        testItem.fallbackService = fallbackService;
        fallbackService.registerSummaryMessage('Code1', null, {
            '*': 'Code1-summarymessage-topLevel'
        });
        fallbackService.registerSummaryMessage('Code3', null, {
            '*': 'Code3-summarymessage-topLevel',
            'en': 'en-Code3-summarymessage-topLevel'
        });
        expect(testItem.getSummaryMessage('en', 'Code1', null)).toBe('Code1-summarymessage-topLevel');
        expect(testItem.getSummaryMessage('en', 'Code2', null)).toBe('en-Code2-summarymessage');
        expect(testItem.getSummaryMessage('fr', 'Code2', null)).toBe('Code2-summarymessage');        
        expect(testItem.getSummaryMessage('en', 'Code3', null)).toBe('en-Code3-summarymessage-topLevel');
        expect(testItem.getSummaryMessage('fr', 'Code3', null)).toBe('Code3-summarymessage-topLevel');       
        expect(testItem.getSummaryMessage('fr', 'Code4', null)).toBeNull();     
    });    
});
describe('dispose', () => {
    test('With fallbackService setup, request a value that exists on the top level, and that value is returned.', () => {
        let testItem = new TextLocalizerService();
        testItem.register('hello', {
            'en': 'en-Hello'
        });
        let fallbackService = new TextLocalizerService();
        testItem.fallbackService = fallbackService;
        fallbackService.register('hello', {
            'en': 'en-Hello-fallback'
        });
        testItem.dispose();
        expect(() => testItem.localize('en', 'hello', 'fallback')).toThrow(TypeError);
        expect(() => fallbackService.localize('en', 'hello', 'fallback')).toThrow(TypeError);
    });    
});