import {
    DataTypeLocalizationBase
} from "../../src/DataTypes/DataTypeLocalization";

/**
 * To test the base class features alone as our default subclass,
 * IntlDataTypeLocalization depends on working RegisterForFormat
 */
class TestImplementationOfDataTypeLocalizationBase extends DataTypeLocalizationBase
{
    constructor(cultureID: string, fallbackCultureID?: string, currency?: string) {
        super(cultureID, fallbackCultureID);
    }
}
describe('DataTypeLocalization.DataTypeLocalizationBase.RegisterFormatter', () => {
    test('Register with function and new key gives no errors', () => {
        let testItem = new TestImplementationOfDataTypeLocalizationBase('en');
        expect(() => testItem.RegisterFormatter('A', (val: any) => { 
            return {};
        })).not.toThrow();
        expect(() => testItem.RegisterFormatter('B', (val: any) => {
            return {};
        })).not.toThrow();
    });
    test('Register with function and same key gives no errors', () => {
        let testItem = new TestImplementationOfDataTypeLocalizationBase('en');
        expect(() => testItem.RegisterFormatter('A', (val: any) => { 
            return {};
        })).not.toThrow();
        expect(() => testItem.RegisterFormatter('A', (val: any) => {
            return {};
        })).not.toThrow();
    });    
    test('Register with alias key gives no errors', () => {
        let testItem = new TestImplementationOfDataTypeLocalizationBase('en');
        expect(() => testItem.RegisterFormatter('A', (val: any) => { 
            return {};
        })).not.toThrow();
        expect(() => testItem.RegisterFormatter('B', 'A')).not.toThrow();
    
    });    
    test('Register with alias key to unknown registration throws', () => {
        let testItem = new TestImplementationOfDataTypeLocalizationBase('en');
        expect(() => testItem.RegisterFormatter('A', (val: any) => { 
            return {};
        })).not.toThrow();
        expect(() => testItem.RegisterFormatter('B', 'D')).toThrow();        
    });          
});
describe('DataTypeLocalization.DataTypeLocalizationBase.Format', () => {
    test('Valid lookup key and string value returns same string value', () => {
        let testItem = new TestImplementationOfDataTypeLocalizationBase('en');
        testItem.RegisterFormatter('LookupKey', (val: any) => { 
            return { Value: val };
        });
        let dtr = testItem.Format('Text', 'LookupKey');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Text');
    }); 
    test('Invalid lookup key and string value returns empty object.', () => {
        let testItem = new TestImplementationOfDataTypeLocalizationBase('en');
        testItem.RegisterFormatter('LookupKey', (val: any) => { 
            return { Value: val };
        });
        let dtr = testItem.Format('Text', 'NotLookupKey');
        expect(dtr).not.toBeNull();
        expect(dtr.ErrorMessage).toBeUndefined();
        expect(dtr.Value).toBeUndefined();
    });        
    test('Null lookupKey throws', () => {
        let testItem = new TestImplementationOfDataTypeLocalizationBase('en');
        testItem.RegisterFormatter('LookupKey', (val: any) => { 
            return { Value: val };
        });
        expect(() => testItem.Format('Text', null!)).toThrow();
    });        
});
