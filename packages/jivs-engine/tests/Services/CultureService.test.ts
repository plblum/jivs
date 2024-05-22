
import { CultureService, cultureLanguageCode } from '../../src/Services/CultureService';

import { registerCultureIdFallbacksForEn, registerCultureIdFallbacksForFR } from "../TestSupport/utilities";
import { CultureIdFallback } from "../../src/Interfaces/CultureService";




describe('constructor and properties', () => {

    test('Constructor with no parameters', () => {
        let testItem = new CultureService();
        expect(testItem.activeCultureId).toBe('en');
        expect(testItem.find('en')).toBeDefined();
    });

    test('Change activeCultureID in Services impacts cultureIdFallback', () => {
        let testItem = new CultureService();
        testItem.activeCultureId = 'fr';
        expect(testItem.activeCultureId).toBe('fr');
        let result: CultureIdFallback | null = null;
        expect(() => result = testItem.find('fr')).not.toThrow();
        expect(result).toBeDefined();
        expect(result).toEqual({
            cultureId: 'fr'
        });
    });
});
describe('register and find, ', () => {
    test('Nothing registered and request non-activeCultureID returns null', () => {
        let testItem = new CultureService();
        expect(testItem.find('es')).toBeNull();
    });    
    test('Register 1 returns the same instance in find and update activeCultureId', () => {
        let testItem = new CultureService();
        let cif: CultureIdFallback = {
            cultureId: 'fr'
        }
        expect(() => testItem.register(cif)).not.toThrow();
        expect(testItem.find('fr')).toBe(cif);
        expect(testItem.activeCultureId).toBe('fr');
    });
    test('Explicitly set activeCultureID to en and register 1 returns the same instance in find and retains activeCultureId=en', () => {
        let testItem = new CultureService();
        testItem.activeCultureId = 'en';
        let cif: CultureIdFallback = {
            cultureId: 'fr'
        }
        expect(() => testItem.register(cif)).not.toThrow();
        expect(testItem.find('fr')).toBe(cif);
        expect(testItem.activeCultureId).toBe('en');
 
    });    
    test('When activeCultureId is explicitly set to en, while there is a registration for fr and none for en, the activeCultureId ensures find returns en', () => {
        let testItem = new CultureService();
        testItem.activeCultureId = 'en';
        expect(() => testItem.register(<CultureIdFallback>{ cultureId: 'fr'})).not.toThrow();
        expect(testItem.find('en')).toEqual(<CultureIdFallback>{ cultureId: 'en' });                        
    });        
    test('Register several and all are returned by find', () => {
        let testItem = new CultureService();
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
    test('Invalid parameters', () => {
        let testItem = new CultureService();
        expect(() => testItem.register(null!)).toThrow(/culture/);
    });        
});

describe('CultureServices.getClosestCultureId', () => {
    describe('getClosestCultureId with en as final fallback', () => {
        test('Various', () => {
            let testItem = new CultureService();
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
            let testItem = new CultureService();
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