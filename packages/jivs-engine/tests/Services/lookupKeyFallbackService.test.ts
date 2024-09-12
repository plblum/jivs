import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { CultureIdFallback } from "../../src/Interfaces/CultureService";
import { LookupKeyFallbackService } from "../../src/Services/LookupKeyFallbackService";
import { CodingError } from "../../src/Utilities/ErrorHandling";

describe('constructor and properties', () => {

    test('Constructor results in a list of preregistered values', () => {
        let testItem = new LookupKeyFallbackService();
        expect(testItem.find(LookupKey.String)).toBeNull();
        expect(testItem.find(LookupKey.Number)).toBeNull();
        expect(testItem.find(LookupKey.Boolean)).toBeNull();
        expect(testItem.find(LookupKey.Date)).toBeNull();
        expect(testItem.find(LookupKey.DateTime)).toBeNull();
        expect(testItem.find(LookupKey.LocalDate)).toBeNull();
        expect(testItem.find(LookupKey.Capitalize)).toBe(LookupKey.String);
        expect(testItem.find(LookupKey.Uppercase)).toBe(LookupKey.String);
        expect(testItem.find(LookupKey.Lowercase)).toBe(LookupKey.String);
        expect(testItem.find(LookupKey.Integer)).toBe(LookupKey.Number);
        expect(testItem.find(LookupKey.Currency)).toBe(LookupKey.Number);
        expect(testItem.find(LookupKey.Percentage)).toBe(LookupKey.Number);
        expect(testItem.find(LookupKey.Percentage100)).toBe(LookupKey.Number);
        expect(testItem.find(LookupKey.ShortDate)).toBe(LookupKey.Date);
        expect(testItem.find(LookupKey.AbbrevDate)).toBe(LookupKey.Date);
        expect(testItem.find(LookupKey.LongDate)).toBe(LookupKey.Date);
        expect(testItem.find(LookupKey.AbbrevDOWDate)).toBe(LookupKey.AbbrevDate);
        expect(testItem.find(LookupKey.LongDOWDate)).toBe(LookupKey.LongDate);
        expect(testItem.find(LookupKey.TimeOfDay)).toBeNull();
        expect(testItem.find(LookupKey.TimeOfDayHMS)).toBe(LookupKey.TimeOfDay);
        expect(testItem.find(LookupKey.YesNoBoolean)).toBe(LookupKey.Boolean);
        expect(testItem.find(LookupKey.TotalDays)).toBeNull();
        expect(testItem.find(LookupKey.CaseInsensitive)).toBe(LookupKey.String);

    });
});
describe('register and find, ', () => {
    test('No custom lookupkeys registered and request value returns null', () => {
        let testItem = new LookupKeyFallbackService();
        expect(testItem.find('custom')).toBeNull();
    });    
    test('Register several custom lookupkeys and all are returned by find', () => {
        let testItem = new LookupKeyFallbackService();

        expect(() => testItem.register('A1', 'A')).not.toThrow();
        expect(() => testItem.register('B1', 'B')).not.toThrow();
        expect(() => testItem.register('B2', 'B1')).not.toThrow();        
        expect(testItem.find('A1')).toBe('A');
        expect(testItem.find('B1')).toBe('B');
        expect(testItem.find('B2')).toBe('B1');
        expect(testItem.find('A')).toBeNull();
        expect(testItem.find('B')).toBeNull();
    });
    test('Invalid parameters', () => {
        let testItem = new LookupKeyFallbackService();
        expect(() => testItem.register(null!, 'A')).toThrow('lookupKey');
        expect(() => testItem.register('B', null!)).toThrow('fallbackLookupKey');
        expect(() => testItem.register('B', 'B')).toThrow(/same value/);        
    });        
});
describe('canFallbackTo', () => {
    test('No custom lookupkeys registered and request value returns false', () => {
        let testItem = new LookupKeyFallbackService();

        expect(testItem.canFallbackTo('custom', 'custom2')).toBe(false);
        expect(testItem.canFallbackTo('custom2', 'custom')).toBe(false);
    });    
    // same input and output always true
    test('Register several custom lookupkeys and all are returned by find', () => {
        let testItem = new LookupKeyFallbackService();
        expect(() => testItem.register('A1', 'A')).not.toThrow();
        expect(() => testItem.register('B1', 'B')).not.toThrow();
        expect(() => testItem.register('B2', 'B1')).not.toThrow();        

        expect(testItem.canFallbackTo('custom', 'custom')).toBe(true);
        expect(testItem.canFallbackTo('A1', 'A1')).toBe(true);
        expect(testItem.canFallbackTo('B1', 'B1')).toBe(true);
        expect(testItem.canFallbackTo('B2', 'B2')).toBe(true);
    });
    test('Register several custom lookupkeys and all are returned by find', () => {
        let testItem = new LookupKeyFallbackService();
        expect(() => testItem.register('A1', 'A')).not.toThrow();
        expect(() => testItem.register('B1', 'B')).not.toThrow();
        expect(() => testItem.register('B2', 'B1')).not.toThrow();        
        expect(testItem.canFallbackTo('A1', 'A')).toBe(true);
        expect(testItem.canFallbackTo('B1', 'B')).toBe(true);
        expect(testItem.canFallbackTo('B2', 'B1')).toBe(true);
        expect(testItem.canFallbackTo('A', 'A1')).toBe(false);
        expect(testItem.canFallbackTo('B', 'B1')).toBe(false);
        expect(testItem.canFallbackTo('B1', 'B2')).toBe(false);
    });
    test('Invalid parameters', () => {
        let testItem = new LookupKeyFallbackService();
        expect(() => testItem.canFallbackTo(null!, 'A')).toThrow('initialLookupKey');
        expect(() => testItem.canFallbackTo('B', null!)).toThrow('targetLookupKey');
    });
    test('Circular reference throws exception', () => {
        let testItem = new LookupKeyFallbackService();
        expect(() => testItem.register('A1', 'A2')).not.toThrow();     
        expect(() => testItem.register('A2', 'A3')).not.toThrow();
        expect(() => testItem.register('A3', 'A1')).not.toThrow();
        expect(() => testItem.canFallbackTo('A1', 'A4')).toThrow(CodingError);
        expect(testItem.canFallbackTo('A1', 'A2')).toBe(true);

    });

});
describe('fallbackToDeepestMatch', () => {
    // Test cases:
    // 1. No custom lookupkeys registered and request value returns null
    // 2. Register several custom lookupkeys but none match the input
    // 3. Register custom lookupkey that has a single fallback, return that fallback.
    // 4. Register custom lookupkey that has multiple fallbacks, return the deepest match.
    test('No custom lookupkeys registered and request value returns null', () => {
        let testItem = new LookupKeyFallbackService();
        expect(testItem.fallbackToDeepestMatch('custom')).toBeNull();
    });
    test('Register several custom lookupkeys but none match the input', () => {
        let testItem = new LookupKeyFallbackService();
        testItem.register('A1', 'A');
        testItem.register('B1', 'B');
        testItem.register('B2', 'B1'); 
        expect(testItem.fallbackToDeepestMatch('custom')).toBeNull();
    });
    test('Register custom lookupkey that has a single fallback, return that fallback.', () => {
        let testItem = new LookupKeyFallbackService();
        testItem.register('A1', 'A');
        testItem.register('B1', 'B');
        testItem.register('C1', 'C'); 
        expect(testItem.fallbackToDeepestMatch('A1')).toBe('A');
        expect(testItem.fallbackToDeepestMatch('B1')).toBe('B');
        expect(testItem.fallbackToDeepestMatch('C1')).toBe('C');
    });
    test('Register custom lookupkey that has multiple fallbacks, return the deepest match.', () => {
        let testItem = new LookupKeyFallbackService();
        testItem.register('B1', 'B2');
        testItem.register('B2', 'B3'); 
        testItem.register('B3', 'B4'); 

        expect(testItem.fallbackToDeepestMatch('B1')).toBe('B4');
        expect(testItem.fallbackToDeepestMatch('B2')).toBe('B4');
        expect(testItem.fallbackToDeepestMatch('B3')).toBe('B4');
        expect(testItem.fallbackToDeepestMatch('B4')).toBeNull();
    });
});