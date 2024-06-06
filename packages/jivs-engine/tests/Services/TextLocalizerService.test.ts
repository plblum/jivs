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
describe('getDataTypeName', () => {
    function createTextLocalizerService(): TextLocalizerService
    {
        let tls = new TextLocalizerService();
        tls.registerDataTypeLabel('Code1', {
            '*': 'Code1-datatypename'
        });
        tls.registerDataTypeLabel('Code2', {
            '*': 'Code2-datatypename',
            'en': 'en-Code2-datatypename'
        });        
        return tls;
    }
    test('Requested value exists and is returned', () => {
        let testItem = createTextLocalizerService();
        expect(testItem.getDataTypeLabel('en', 'Code1')).toBe('Code1-datatypename');
        expect(testItem.getDataTypeLabel('en', 'Code2')).toBe('en-Code2-datatypename');
        expect(testItem.getDataTypeLabel('fr', 'Code2')).toBe('Code2-datatypename');        
    });
    test('Requested value does not exist and original data type is returned', () => {
        let testItem = createTextLocalizerService();
        expect(testItem.getDataTypeLabel('en', 'X1')).toBe('X1');
        expect(testItem.getDataTypeLabel('fr', 'X1')).toBe('X1');
    });    
    test('Pass in null returns null', () => {
        let testItem = createTextLocalizerService();
        expect(testItem.getDataTypeLabel('en', null!)).toBeNull();
    });        
    test('With fallbackService containing an override to Code1 and a new value, Code3, requested value exists and is returned. Requested value does not exist, returns null.', () => {
        let testItem = new TextLocalizerService();
        let fallbackService = createTextLocalizerService();
        testItem.fallbackService = fallbackService;
        fallbackService.registerDataTypeLabel('Code1', {
            '*': 'Code1-datatypename-topLevel'
        });
        fallbackService.registerDataTypeLabel('Code3', {
            '*': 'Code3-datatypename-topLevel',
            'en': 'en-Code3-datatypename-topLevel'
        });
        expect(testItem.getDataTypeLabel('en', 'Code1')).toBe('Code1-datatypename-topLevel');
        expect(testItem.getDataTypeLabel('en', 'Code2')).toBe('en-Code2-datatypename');
        expect(testItem.getDataTypeLabel('fr', 'Code2')).toBe('Code2-datatypename');        
        expect(testItem.getDataTypeLabel('en', 'Code3')).toBe('en-Code3-datatypename-topLevel');
        expect(testItem.getDataTypeLabel('fr', 'Code3')).toBe('Code3-datatypename-topLevel');       
        expect(testItem.getDataTypeLabel('fr', 'Code4')).toBe('Code4');     
    });    
});
describe('lazyLoad', () => {
   test('Call to register does not lazy load', () => {
       let testItem = new TextLocalizerService();
       let loaded = false;
       testItem.lazyLoad = (service) => {
           service.register('Code1', {
               '*': 'Code1_Text'
           });
           loaded = true;
       };
       testItem.register('Code2', { '*': 'Code2_Text' });
       expect(loaded).toBe(false);
   }); 
   test('Call to localize for already registered does not lazy load', () => {
    let testItem = new TextLocalizerService();
    let loaded = false;
    testItem.lazyLoad = (service) => {
        service.register('Code1', {
            '*': 'Code1_Text'
        });
        loaded = true;
    };
    testItem.register('Code2', { '*': 'Code2_Text' });
    expect(loaded).toBe(false);
    testItem.localize('en', 'Code2', null);
    expect(loaded).toBe(false);

   });     
    test('Call to localize for unregistered does load but later localize does not load for unregistered', () => {
        let testItem = new TextLocalizerService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register('Code1', {
                '*': 'Code1_Text'
            });
            loaded = true;
        };
        expect(testItem.localize('en', 'Code1', null)).toBe('Code1_Text');
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded
        loaded = false;
        expect(testItem.localize('en', 'Code2', null)).toBeNull();      // code2 is unregistered  
        expect(loaded).toBe(false);
    });     

    test('registerErrorMessage does not lazyload, getErrorMessage to registered does not lazyload, getErrorMessage to unregister does lazyload, getErrorMessage after lazyload does not lazyload', () => {
        let testItem = new TextLocalizerService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.registerErrorMessage('Code1', null, {
                '*': 'Code1_Text'
            });
            loaded = true;
        };
        testItem.registerErrorMessage('Code2', null, { '*': 'Code2_Text' }); 
        expect(loaded).toBe(false);
        expect(testItem.getErrorMessage('en', 'Code2', null)).toBe('Code2_Text');
        expect(loaded).toBe(false);
        expect(testItem.getErrorMessage('en', 'Code1', null)).toBe('Code1_Text');   // this should load Code1
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded
        loaded = false;
        expect(testItem.getErrorMessage('en', 'Code3', null)).toBeNull();      // code3 is unregistered  
        expect(loaded).toBe(false);        
    });     
    test('registerSummaryMessage does not lazyload, getSummaryMessage to registered does not lazyload, getSummaryMessage to unregister does lazyload, getSummaryMessage after lazyload does not lazyload', () => {
        let testItem = new TextLocalizerService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.registerSummaryMessage('Code1', null, {
                '*': 'Code1_Text'
            });
            loaded = true;
        };
        testItem.registerSummaryMessage('Code2', null, { '*': 'Code2_Text' }); 
        expect(loaded).toBe(false);
        expect(testItem.getSummaryMessage('en', 'Code2', null)).toBe('Code2_Text');
        expect(loaded).toBe(false);
        expect(testItem.getSummaryMessage('en', 'Code1', null)).toBe('Code1_Text');   // this should load Code1
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded
        loaded = false;
        expect(testItem.getSummaryMessage('en', 'Code3', null)).toBeNull();      // code3 is unregistered  
        expect(loaded).toBe(false);        
    });     
    test('registerDataTypeLabel does not lazyload, getDataTypeLabel to registered does not lazyload, getDataTypeLabel to unregister does lazyload, getDataTypeLabel after lazyload does not lazyload', () => {
        let testItem = new TextLocalizerService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.registerDataTypeLabel('Code1', {
                '*': 'Code1_Text'
            });
            loaded = true;
        };
        testItem.registerDataTypeLabel('Code2', { '*': 'Code2_Text' }); 
        expect(loaded).toBe(false);
        expect(testItem.getDataTypeLabel('en', 'Code2')).toBe('Code2_Text');
        expect(loaded).toBe(false);
        expect(testItem.getDataTypeLabel('en', 'Code1',)).toBe('Code1_Text');   // this should load Code1
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded
        loaded = false;
        expect(testItem.getDataTypeLabel('en', 'Code3')).toBe('Code3');      // code3 is unregistered, so its lookupKey is used
        expect(loaded).toBe(false);        
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