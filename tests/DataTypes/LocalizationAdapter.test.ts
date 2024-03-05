import {
    LocalizationAdapterBase
} from "../../src/DataTypes/LocalizationAdapter";

/**
 * To test the base class features alone as our default subclass,
 * IntlLocalizationAdapter depends on working RegisterForToString
 */
class TestImplementationOfLocalizationAdapterBase extends LocalizationAdapterBase
{
    constructor(cultureID: string, fallbackCultureID?: string, currency?: string) {
        super(cultureID, fallbackCultureID);
    }
}
describe('LocalizationAdapter.LocalizationAdapterBase.RegisterForToString', () => {
    test('Register with function and new key gives no errors', () => {
        let testItem = new TestImplementationOfLocalizationAdapterBase('en');
        expect(() => testItem.RegisterForToString('A', (val: any) => { 
            return {};
        })).not.toThrow();
        expect(() => testItem.RegisterForToString('B', (val: any) => {
            return {};
        })).not.toThrow();
    });
    test('Register with function and same key gives no errors', () => {
        let testItem = new TestImplementationOfLocalizationAdapterBase('en');
        expect(() => testItem.RegisterForToString('A', (val: any) => { 
            return {};
        })).not.toThrow();
        expect(() => testItem.RegisterForToString('A', (val: any) => {
            return {};
        })).not.toThrow();
    });    
    test('Register with alias key gives no errors', () => {
        let testItem = new TestImplementationOfLocalizationAdapterBase('en');
        expect(() => testItem.RegisterForToString('A', (val: any) => { 
            return {};
        })).not.toThrow();
        expect(() => testItem.RegisterForToString('B', 'A')).not.toThrow();
    
    });    
    test('Register with alias key to unknown registration throws', () => {
        let testItem = new TestImplementationOfLocalizationAdapterBase('en');
        expect(() => testItem.RegisterForToString('A', (val: any) => { 
            return {};
        })).not.toThrow();
        expect(() => testItem.RegisterForToString('B', 'D')).toThrow();        
    });          
});
describe('LocalizationAdapter.LocalizationAdapterBase.ToString', () => {
    test('Valid lookup key and string value returns same string value', () => {
        let testItem = new TestImplementationOfLocalizationAdapterBase('en');
        testItem.RegisterForToString('LookupKey', (val: any) => { 
            return { Value: val };
        });
        let dtr = testItem.ToString('Text', 'LookupKey');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Text');
    }); 
    test('Invalid lookup key and string value returns NotFound', () => {
        let testItem = new TestImplementationOfLocalizationAdapterBase('en');
        testItem.RegisterForToString('LookupKey', (val: any) => { 
            return { Value: val };
        });
        let dtr = testItem.ToString('Text', 'NotLookupKey');
        expect(dtr).not.toBeNull();
        expect(dtr.NotFound).toBe(true);
    });        
    test('Null lookupKey throws', () => {
        let testItem = new TestImplementationOfLocalizationAdapterBase('en');
        testItem.RegisterForToString('LookupKey', (val: any) => { 
            return { Value: val };
        });
        expect(() => testItem.ToString('Text', null!)).toThrow();
    });        
});
