
import { CultureService, cultureLanguageCode } from '../../src/Services/CultureService';

import { registerCultureIdFallbacksForEn, registerCultureIdFallbacksForFR } from "../TestSupport/utilities";
import { CultureIdFallback } from "../../src/Interfaces/CultureService";




describe('constructor and properties', () => {

    test('Constructor', () => {
        let testItem = new CultureService('en');
        expect(testItem.defaultCultureId).toBe('en');
        expect(testItem.find('en')).toBeDefined();
    });

    test('Change defaultCultureId in Services impacts cultureIdFallback', () => {
        let testItem = new CultureService('fr');
        expect(testItem.defaultCultureId).toBe('fr');
        let result: CultureIdFallback | null = null;
        expect(() => result = testItem.find('fr')).not.toThrow();
        expect(result).toBeDefined();
        expect(result).toEqual({
            cultureId: 'fr'
        });
    });
});
describe('register and find, ', () => {
    test('Nothing registered and request non-defaultCultureId returns null', () => {
        let testItem = new CultureService('fr');
        expect(testItem.find('es')).toBeNull();
    });    
    test('Register 1 returns the same instance in find and update defaultCultureId', () => {
        let testItem = new CultureService('fr');
        let cif: CultureIdFallback = {
            cultureId: 'fr'
        }
        expect(() => testItem.register(cif)).not.toThrow();
        expect(testItem.find('fr')).toBe(cif);
        expect(testItem.defaultCultureId).toBe('fr');
    });
    test('Explicitly set defaultCultureId to en and register 1 returns the same instance in find and retains defaultCultureId=en', () => {
        let testItem = new CultureService('en');
        let cif: CultureIdFallback = {
            cultureId: 'fr'
        }
        expect(() => testItem.register(cif)).not.toThrow();
        expect(testItem.find('fr')).toBe(cif);
        expect(testItem.defaultCultureId).toBe('en');
 
    });    
    test('When defaultCultureId is explicitly set to en, while there is a registration for fr and none for en, the defaultCultureId ensures find returns en', () => {
        let testItem = new CultureService('en');
        expect(() => testItem.register(<CultureIdFallback>{ cultureId: 'fr'})).not.toThrow();
        expect(testItem.find('en')).toEqual(<CultureIdFallback>{ cultureId: 'en' });                        
    });        
    test('Register several and all are returned by find', () => {
        let testItem = new CultureService('en');
        let fr: CultureIdFallback = {
            cultureId: 'fr'
        };
        let frFR: CultureIdFallback = {
            cultureId: 'fr-FR',
            fallbackCultureId: 'fr'
        };
        let frDE: CultureIdFallback = {
            cultureId: 'fr-DE',
            fallbackCultureId: 'fr-FR'
        };        
        expect(() => testItem.register(fr)).not.toThrow();
        expect(() => testItem.register(frFR)).not.toThrow();
        expect(() => testItem.register(frDE)).not.toThrow();        
        expect(testItem.find('fr')).toBe(fr);
        expect(testItem.find('fr-FR')).toBe(frFR);
        expect(testItem.find('fr-DE')).toBe(frDE);
    });
    test('Register same cultureID twice replaces', () => {
        let testItem = new CultureService('en');
        let cif: CultureIdFallback = {
            cultureId: 'en-US',
            fallbackCultureId: 'en'
        };
        testItem.register(cif);

        let cif2: CultureIdFallback = {
            cultureId: 'en-US',
            fallbackCultureId: 'en-CA'
        };
        expect(() => testItem.register(cif2)).not.toThrow();
        expect(testItem.find('en-US')).toBe(cif2);
 
    });        
    test('Invalid parameters', () => {
        let testItem = new CultureService('en');
        expect(() => testItem.register(null!)).toThrow(/culture/);
    });        
});

describe('CultureServices.getClosestCultureId', () => {
    describe('getClosestCultureId with en as final fallback', () => {
        test('Various', () => {
            let testItem = new CultureService('en');
            registerCultureIdFallbacksForEn(testItem);
            expect(testItem.getClosestCultureId('en')).toBe('en');
            expect(testItem.getClosestCultureId('fr')).toBe('fr');
            expect(testItem.getClosestCultureId('fr-FR')).toBe('fr-FR');
            expect(testItem.getClosestCultureId('en-US')).toBe('en-US');
            expect(testItem.getClosestCultureId('fr-CA')).toBe('fr');
            expect(testItem.getClosestCultureId('en-MX')).toBe('en');
            expect(testItem.getClosestCultureId('de')).toBeNull();
            expect(testItem.getClosestCultureId('de-DE')).toBeNull();
        });
    });
    describe('getClosestCultureId with fr as final fallback', () => {
        test('Various', () => {
            let testItem = new CultureService('fr');
            registerCultureIdFallbacksForFR(testItem);
            expect(testItem.getClosestCultureId('fr')).toBe('fr');
            expect(testItem.getClosestCultureId('fr-FR')).toBe('fr-FR');
            expect(testItem.getClosestCultureId('en-US')).toBe('en-US');
            expect(testItem.getClosestCultureId('fr-CA')).toBe('fr');
            expect(testItem.getClosestCultureId('en-MX')).toBe('en');
            expect(testItem.getClosestCultureId('de')).toBeNull();
            expect(testItem.getClosestCultureId('de-DE')).toBeNull();
        });
    });
});


describe('cultureLanguageCode', () => {
    test('Returns the country code as text before a dash', () => {
        expect(cultureLanguageCode('en-US')).toBe('en');
        expect(cultureLanguageCode('Abcdef-FR')).toBe('Abcdef');    // because we return everything verbatim if it lacks a dash
        expect(cultureLanguageCode('-FR')).toBe('-FR'); // dash at the start is a meaningless value
    });    
    test('Returns the same when it lacks the country code', () => {
        expect(cultureLanguageCode('en')).toBe('en');
        expect(cultureLanguageCode('Abcdef')).toBe('Abcdef');    // because we return everything verbatim if it lacks a dash
    });
});
describe('dispose()', () => {

    test('Nothing defined demonstrates exceptions are thrown after dispose', () => {
        let testItem = new CultureService('en');
        testItem.dispose();

        expect(()=> testItem.find('en')).toThrow(TypeError);
    });

    test('Change defaultCultureId in Services impacts cultureIdFallback', () => {
        let testItem = new CultureService('fr');
        testItem.dispose();

        expect(() => testItem.find('fr')).toThrow(TypeError);
    });
});

describe('availableCultures', () => {
    let testItem: CultureService;

    beforeEach(() => {
        testItem = new CultureService('en');
    });

    test('Initially the defaultCultureId alone when no cultures are registered', () => {
        expect(testItem.availableCultures()).toEqual(['en']);
    });

    test('Register new culture returns default and new culture', () => {
        let culture: CultureIdFallback = { cultureId: 'en-US' };
        testItem.register(culture);
        expect(testItem.availableCultures()).toEqual(['en', 'en-US']);
    });

    test('Returns multiple registered cultures', () => {
        let cultures: CultureIdFallback[] = [
            { cultureId: 'en-US', fallbackCultureId: 'en' },
            { cultureId: 'fr-FR' },
            { cultureId: 'es-ES' }
        ];
        cultures.forEach(culture => testItem.register(culture));
        expect(testItem.availableCultures()).toEqual(['en', 'en-US','fr-FR', 'es-ES']);
    });

    test('Does not return duplicates if the same culture is registered multiple times', () => {
        let cultures: CultureIdFallback[] = [
            { cultureId: 'en-US', fallbackCultureId: 'en' },
            { cultureId: 'en-US' }, // duplicate - however, this will REPLACE the previous registration, so duplicates are never a problem
            { cultureId: 'en' }
        ];
        cultures.forEach(culture => testItem.register(culture));
        expect(testItem.find('en-US')).toEqual({ cultureId: 'en-US' });
        expect(testItem.availableCultures()).toEqual(['en', 'en-US']);
    });

});

describe('availableLanguages', () => {
    let testItem: CultureService;

    beforeEach(() => {
        testItem = new CultureService('en');
    });

    test('Initially the default CultureId when no cultures are registered', () => {
        expect(testItem.availableLanguages()).toEqual(['en']);
    });

    test('Returns a single language code when one culture is registered', () => {
        let culture: CultureIdFallback = { cultureId: 'en-US' };
        testItem.register(culture);
        expect(testItem.availableLanguages()).toEqual(['en']);
    });

    test('Returns multiple language codes for registered cultures', () => {
        let cultures: CultureIdFallback[] = [
            { cultureId: 'en-US', fallbackCultureId: 'en' },
            { cultureId: 'fr-FR' },
            { cultureId: 'es-ES' }
        ];
        cultures.forEach(culture => testItem.register(culture));
        expect(testItem.availableLanguages()).toEqual(['en', 'fr', 'es']);
    });

    test('Does not return duplicate language codes if the same language is registered multiple times', () => {
        let cultures: CultureIdFallback[] = [
            { cultureId: 'en-US', fallbackCultureId: 'en' },
            { cultureId: 'en-GB' },
            { cultureId: 'fr-FR' }
        ];
        cultures.forEach(culture => testItem.register(culture));
        expect(testItem.availableLanguages()).toEqual(['en', 'fr']);
    });

    test('Correctly extracts language codes from culture IDs with region codes', () => {
        let cultures: CultureIdFallback[] = [
            { cultureId: 'en-US' },
            { cultureId: 'fr-CA' },
            { cultureId: 'es-MX' }
        ];
        cultures.forEach(culture => testItem.register(culture));
        expect(testItem.availableLanguages()).toEqual(['en', 'fr', 'es']);
    });

    test('Handles cultures without region codes', () => {
        let cultures: CultureIdFallback[] = [
            { cultureId: 'en' },
            { cultureId: 'fr' },
            { cultureId: 'es' }
        ];
        cultures.forEach(culture => testItem.register(culture));
        expect(testItem.availableLanguages()).toEqual(['en', 'fr', 'es']);
    });
});