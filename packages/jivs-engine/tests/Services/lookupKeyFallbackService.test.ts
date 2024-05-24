import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { CultureIdFallback } from "../../src/Interfaces/CultureService";
import { LookupKeyFallbackService } from "../../src/Services/LookupKeyFallbackService";

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
    });        
});
