import { ComparersResult, DateOnlyComparer } from "../../src/DataTypes/Comparers";
import { DataTypeResolver, RegisterComparerHandlerWithDataTypeResolver } from "../../src/DataTypes/DataTypeResolver";
import { IntlLocalizationAdapter } from "../../src/DataTypes/IntlLocalizationAdapter";
import { StringLookupKey, NumberLookupKey, BooleanLookupKey, allBuiltInToStringLookupKeys, DateLookupKey } from "../../src/DataTypes/LookupKeys";
import { IDataTypeConverter, IDataTypeIdentifier } from "../../src/Interfaces/DataTypes";


describe('DataTypeResolver constructor and properties', () => {
    test('Constructor with no parameters sets up ActiveCultureID of en', () => {
        let testItem = new DataTypeResolver();
        expect(testItem.ActiveCultureID).toBe('en');
        expect(testItem.HasLocalizationFor('en')).toBe(false);
    });
    test('Constructor with cultureID of fr sets up ActiveCultureID of fr', () => {
        let testItem = new DataTypeResolver('fr');
        expect(testItem.ActiveCultureID).toBe('fr');
        expect(testItem.HasLocalizationFor('fr')).toBe(false);
    });
    test('Constructor with cultureID of fr and LocalizationAdapter for en and fr', () => {
        let testItem = new DataTypeResolver('fr', new IntlLocalizationAdapter('en'),
            new IntlLocalizationAdapter('fr', 'en', 'EUR'),
            new IntlLocalizationAdapter('fr-FR', 'fr', 'EUR'));
        expect(testItem.ActiveCultureID).toBe('fr');
        expect(testItem.HasLocalizationFor('en')).toBe(true);
        expect(testItem.HasLocalizationFor('fr')).toBe(true);
        expect(testItem.HasLocalizationFor('fr-FR')).toBe(true);
        expect(testItem.HasLocalizationFor('en-US')).toBe(true);  // uses fallback to 'en'
    });    
});

// RegisterAdditionalToString(lookupKey: string, fn: (value: string)=> IDataTypeResolution<string>): void
describe('DataTypeResolver.RegisterAdditionalToString', () => {
    test('Invalid parameters', () => {
        let testItem = new DataTypeResolver();
        expect(() => testItem.RegisterAdditionalToString(null!, (val: any) => { return {} })).toThrow(/lookupKey/);
        expect(() => testItem.RegisterAdditionalToString(undefined!, (val: any) => { return {} })).toThrow(/lookupKey/);
        expect(() => testItem.RegisterAdditionalToString('LookupKey', null!)).toThrow(/fn/);
        expect(() => testItem.RegisterAdditionalToString('LookupKey', undefined!)).toThrow(/fn/);
    });
    test('Add unique keys', () => {
        let testItem = new DataTypeResolver();
        expect(testItem.HasAdditionalToStringLookupKey("Key1")).toBe(false);
        expect(testItem.HasAdditionalToStringLookupKey("Key2")).toBe(false);
        expect(testItem.RegisterAdditionalToString("Key1",
            (val: any) => { return { Value: 'Key1' } }));
        expect(testItem.RegisterAdditionalToString("Key2",
            (val: any) => { return { Value: 'Key2' } }));
        expect(testItem.HasAdditionalToStringLookupKey("Key1")).toBe(true);
        expect(testItem.HasAdditionalToStringLookupKey("Key2")).toBe(true);
    });
    test('Add same keys replaces earlier function', () => {
        let testItem = new DataTypeResolver();
        expect(testItem.HasAdditionalToStringLookupKey("Key1")).toBe(false);
        expect(testItem.RegisterAdditionalToString("Key1",
            (val: any) => { return { Value: 'Key1' } }));
        expect(testItem.RegisterAdditionalToString("Key1",
            (val: any) => { return { Value: 'Key1 replaced' } }));
        expect(testItem.HasAdditionalToStringLookupKey("Key1")).toBe(true);
        expect(testItem.ToString('', 'Key1')).toEqual({ Value: 'Key1 replaced' });
    });    
});

export function CreateDataTypeResolverWithManyLAs(registerLookupKeys: boolean = false): DataTypeResolver
{
    function RegisterLookupKeys(la: IntlLocalizationAdapter): IntlLocalizationAdapter
    {
        if (registerLookupKeys)
            la.RegisterBuiltInLookupKeyFunctions(allBuiltInToStringLookupKeys);
        return la;
    }
    return new DataTypeResolver('en',
        RegisterLookupKeys(new IntlLocalizationAdapter('en')),
        RegisterLookupKeys(new IntlLocalizationAdapter('fr', 'en', 'EUR')),
        RegisterLookupKeys(new IntlLocalizationAdapter('en-GB', 'en-US', 'GBP')),
        RegisterLookupKeys(new IntlLocalizationAdapter('en-US', 'en', 'USD')),
        RegisterLookupKeys(new IntlLocalizationAdapter('fr-FR', 'fr', 'EUR')),
    );
}
// ToString(value: any, lookupKey?: string): IDataTypeResolution<string>
describe('DataTypeResolver.ToString', () => {
    test('No lookupKey not resolved by data type error', () => {
        let testItem = CreateDataTypeResolverWithManyLAs();
        expect(() => testItem.ToString({})).toThrow(/LookupKey/);
    });
    test('Unsupported lookupKey error', () => {
        let testItem = CreateDataTypeResolverWithManyLAs();
        expect(() => testItem.ToString(0, 'huh')).toThrow(/LookupKey/);
    });
    test('Value of string used for lookup key', () => {
        let testItem = CreateDataTypeResolverWithManyLAs();
        testItem.RegisterAdditionalToString(StringLookupKey, (val: any) => {
            return { Value: 'String value' }
        });
        expect(testItem.ToString('A string')).toEqual({ Value: 'String value' });
    });    
    test('Value of number used for lookup key', () => {
        let testItem = CreateDataTypeResolverWithManyLAs();
        testItem.RegisterAdditionalToString(NumberLookupKey, (val: any) => {
            return { Value: 'number as string' }
        });
        expect(testItem.ToString(999)).toEqual({ Value: 'number as string' });
    });
    test('Value of boolean used for lookup key', () => {
        let testItem = CreateDataTypeResolverWithManyLAs();
        testItem.RegisterAdditionalToString(BooleanLookupKey, (val: any) => {
            return { Value: 'boolean as string' }
        });
        expect(testItem.ToString(false)).toEqual({ Value: 'boolean as string' });
    });        
    test('Value of Date used for lookup key', () => {
        let testItem = CreateDataTypeResolverWithManyLAs();
        testItem.RegisterAdditionalToString(DateLookupKey, (val: any) => {
            return { Value: 'Date as string' }
        });
        expect(testItem.ToString(new Date())).toEqual({ Value: 'Date as string' });
    });       
    test('LookupKey does not support data type error', () => {
        let testItem = CreateDataTypeResolverWithManyLAs();
        testItem.RegisterAdditionalToString(DateLookupKey, (val: any) => {
            throw new Error('Unsupported test');
        });
        expect(testItem.ToString(new Date())).toEqual({ ErrorMessage: 'Unsupported test' });
    });       
    test('Declared lookup key used', () => {
        let testItem = CreateDataTypeResolverWithManyLAs();
        testItem.RegisterAdditionalToString('TestKey', (val: any) => {
            return { Value: 'Value of TestKey' }
        });
        expect(testItem.ToString(10, 'TestKey')).toEqual({ Value: 'Value of TestKey' });
    });         
    test('Lookup Key in Localization Adapter en', () => {
        let testItem = CreateDataTypeResolverWithManyLAs(true);
        let la = testItem.GetLocalizationAdapter('en') as IntlLocalizationAdapter;
        la.RegisterForToString('TestKey', (val: any) => {
            return { Value: 'EN TestKey' }
        });
        testItem.ActiveCultureID = 'en';
        expect(testItem.ToString(10, 'TestKey')).toEqual({ Value: 'EN TestKey' });
    });     
    test('Lookup Key in Localization Adapter en using fallback from en-GB', () => {
        let testItem = CreateDataTypeResolverWithManyLAs(true);
        let la = testItem.GetLocalizationAdapter('en') as IntlLocalizationAdapter;
        la.RegisterForToString('TestKey', (val: any) => {
            return { Value: 'EN TestKey' }
        });
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.ToString(10, 'TestKey')).toEqual({ Value: 'EN TestKey' });
    });        
    test('Lookup Key in Localization Adapter en and en-GB gets from en-GB', () => {
        let testItem = CreateDataTypeResolverWithManyLAs(true);
        let laEN = testItem.GetLocalizationAdapter('en') as IntlLocalizationAdapter;
        laEN.RegisterForToString('TestKey', (val: any) => {
            return { Value: 'EN TestKey' }
        });
        let laENGB = testItem.GetLocalizationAdapter('en') as IntlLocalizationAdapter;
        laENGB.RegisterForToString('TestKey', (val: any) => {
            return { Value: 'EN-GB TestKey' }
        });        
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.ToString(10, 'TestKey')).toEqual({ Value: 'EN-GB TestKey' });
    }); 
    test('Date to string using built-in Localization', () => {
        let testItem = CreateDataTypeResolverWithManyLAs(true);
        let date = new Date(2000, 0, 11);
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.ToString(date)).toEqual({ Value: '11/01/2000' });
        testItem.ActiveCultureID = 'en';
        expect(testItem.ToString(date)).toEqual({ Value: '1/11/2000' });
        testItem.ActiveCultureID = 'fr';
        expect(testItem.ToString(date)).toEqual({ Value: '11/01/2000' });
    });    
    test('Number to string using built-in Localization', () => {
        let testItem = CreateDataTypeResolverWithManyLAs(true);
        let value = 4000.932;
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.ToString(value)).toEqual({ Value: '4,000.932' });
        testItem.ActiveCultureID = 'en';
        expect(testItem.ToString(value)).toEqual({ Value: '4,000.932' });
        testItem.ActiveCultureID = 'fr';
        expect(testItem.ToString(value)).toEqual({ Value: '4\u{202F}000,932' });
    });        
    test('String to string using built-in Localization. Expect no changes', () => {
        let testItem = CreateDataTypeResolverWithManyLAs(true);
        let value = 'abcZYX';
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.ToString(value)).toEqual({ Value: value });
        testItem.ActiveCultureID = 'en';
        expect(testItem.ToString(value)).toEqual({ Value: value });
        testItem.ActiveCultureID = 'fr';
        expect(testItem.ToString(value)).toEqual({ Value: value });
    });
    test('Lookup Key supplied not compatible with native data type error', () => {
        let testItem = CreateDataTypeResolverWithManyLAs(true);
        testItem.ActiveCultureID = 'en';
        expect(testItem.ToString(10, DateLookupKey).ErrorMessage).not.toBeUndefined();
        expect(testItem.ToString(10, BooleanLookupKey).ErrorMessage).not.toBeUndefined();
        expect(testItem.ToString('10', NumberLookupKey).ErrorMessage).not.toBeUndefined();
    });         
});
// RegisterComparerHandler(lookupKey: string, fn: (value1: any, value2: any)=> any): void
describe('DataTypeResolver.RegisterComparerHandler', () => {
    test('Invalid parameters', () => {
        let testItem = new DataTypeResolver();
        expect(() => testItem.RegisterComparerHandler(null!, (val1: any, val2: any) => { return 0 })).toThrow(/lookupKey/);
        expect(() => testItem.RegisterComparerHandler(undefined!, (val1: any, val2: any) => { return 0 })).toThrow(/lookupKey/);
        expect(() => testItem.RegisterComparerHandler('LookupKey', null!)).toThrow(/fn/);
        expect(() => testItem.RegisterComparerHandler('LookupKey', undefined!)).toThrow(/fn/);
    });
    test('Add unique keys', () => {
        let testItem = new DataTypeResolver();
        expect(testItem.HasRegisterComparerHandlerLookupKey("Key1")).toBe(false);
        expect(testItem.HasRegisterComparerHandlerLookupKey("Key2")).toBe(false);
        expect(testItem.RegisterComparerHandler("Key1",
            (val1: any, val2: any) => ComparersResult.Equals));
        expect(testItem.RegisterComparerHandler("Key2",
            (val1: any, val2: any) => ComparersResult.Equals));
        expect(testItem.HasRegisterComparerHandlerLookupKey("Key1")).toBe(true);
        expect(testItem.HasRegisterComparerHandlerLookupKey("Key2")).toBe(true);
    });
    test('Add same keys replaces earlier function', () => {
        let testItem = new DataTypeResolver();
        expect(testItem.HasRegisterComparerHandlerLookupKey("Key1")).toBe(false);
        expect(testItem.RegisterComparerHandler("Key1",
            (val1: any, val2: any) => ComparersResult.Equals));
        expect(testItem.CompareValues('', '', 'Key1')).toBe(ComparersResult.Equals);

        expect(testItem.RegisterComparerHandler("Key1",
            (val1: any, val2: any) => ComparersResult.NotEquals));
        expect(testItem.HasRegisterComparerHandlerLookupKey("Key1")).toBe(true);
        expect(testItem.CompareValues('', '', 'Key1')).toBe(ComparersResult.NotEquals);
    });    
});
// CompareValues(value1: any, value2: any, lookupKey: string | null): ComparersResult
describe('DataTypeResolver.CompareValues', () => {
    test('Number value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeResolver();
        RegisterComparerHandlerWithDataTypeResolver(testItem);
        expect(testItem.CompareValues(0, 0)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(0, 0, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(0, 0, undefined)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(1, 0)).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues(0, 1)).toBe(ComparersResult.LessThan);        
    });
    test('Number value compares to custom class that has a IDataTypeConverter', () => {
        class TestDataType {
            constructor(quantity: number)
            {
                this.Quantity = quantity;
            }
            Quantity: number;
        }
        class SupportTestDataType implements IDataTypeIdentifier
        {
            DataTypeLookupKey: string = "TEST";
            IsMatch(value: any): boolean {
                return value instanceof TestDataType;
            }
        }
        class TestConverter implements IDataTypeConverter
        {
            SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            Convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new SupportTestDataType());
        testItem.RegisterDataTypeConverter(new TestConverter());        

        RegisterComparerHandlerWithDataTypeResolver(testItem);
        expect(testItem.CompareValues(new TestDataType(0), 0)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(new TestDataType(10), 0)).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues(new TestDataType(undefined!), 0)).toBe(ComparersResult.Undetermined);        
    });

    
    test('String value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeResolver();
        RegisterComparerHandlerWithDataTypeResolver(testItem);
        expect(testItem.CompareValues('A', 'A')).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('A', 'A', null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('A', 'A', undefined)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('B', 'A')).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues('A', 'B')).toBe(ComparersResult.LessThan);        
    });    
    test('Boolean value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeResolver();
        RegisterComparerHandlerWithDataTypeResolver(testItem);
        expect(testItem.CompareValues(true, true)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(true, true, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(true, true, undefined)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(false, true)).toBe(ComparersResult.NotEquals);
        expect(testItem.CompareValues(true, false)).toBe(ComparersResult.NotEquals);        
    });       
    test('Date value resolves lookupKey and correctly handles comparisons', () => {
        let date1 = new Date(2000, 5, 31);
        let date2 = new Date(2000, 5, 30);
        let testItem = new DataTypeResolver();
        RegisterComparerHandlerWithDataTypeResolver(testItem);
        expect(testItem.CompareValues(date1, date1)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date1, date1, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date1, date1, undefined)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date2, date1)).toBe(ComparersResult.LessThan);
        expect(testItem.CompareValues(date1, date2)).toBe(ComparersResult.GreaterThan);        
    });           
    test('value compares to custom class that has a IDataTypeConverter', () => {
        class TestDataType {
            constructor(dateValue: Date)
            {
                this.DateValue = dateValue;
            }
            DateValue: Date;
        }
        class SupportTestDataType implements IDataTypeIdentifier
        {
            DataTypeLookupKey: string = "TEST";
            IsMatch(value: any): boolean {
                return value instanceof TestDataType;
            }
        }
        class TestConverter implements IDataTypeConverter
        {
            SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            Convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.DateValue;
            }
        }
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new SupportTestDataType());
        testItem.RegisterDataTypeConverter(new TestConverter());   
        testItem.RegisterComparerHandler("TEST", DateOnlyComparer);
        
        let date1 = new TestDataType(new Date(2000, 5, 31));
        let date2 = new Date(2000, 5, 30);

        RegisterComparerHandlerWithDataTypeResolver(testItem);
        expect(testItem.CompareValues(date1, date1)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date1, date1, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date1, date1, undefined)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date2, date1)).toBe(ComparersResult.LessThan);
        expect(testItem.CompareValues(date1, date2)).toBe(ComparersResult.GreaterThan);        
    });               
    
    test('Custom function to compare two strings case insensitively for Equals, NotEquals', () => {
        let testItem = new DataTypeResolver();
        expect(testItem.RegisterComparerHandler("Key1",
            (val1: any, val2: any) => val1.toString().toLowerCase() ==
                val2.toString().toLowerCase() ? ComparersResult.Equals : ComparersResult.NotEquals));
        expect(testItem.CompareValues('A', 'A', 'Key1')).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('A', 'a', 'Key1')).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('a', 'A', 'Key1')).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('A', 'B', 'Key1')).toBe(ComparersResult.NotEquals);
    });        
    test('Unsupported data type for lookupKey assignment error', () => {
        let testItem = new DataTypeResolver();
        expect(() => testItem.CompareValues({}, 'A')).toThrow(/Unsupported/);
        expect(() => testItem.CompareValues(null, 'A')).toThrow(/Unsupported/);
    });    
    test('Fallback to DefaultComparer for unsupported lookupKey', () => {
        let testItem = new DataTypeResolver();
        expect(testItem.CompareValues('A', 'A', 'Key1')).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('A', 'a', 'Key1')).toBe(ComparersResult.LessThan);
    });                
});

describe('DataTypeResolver utility methods', () => {
    // RegisterLocalizationAdapter(la: ILocalizationAdapter): void
    test('RegisterLocalizationAdapter added', () => {
        let testItem = new DataTypeResolver();
        let la = new IntlLocalizationAdapter('sp-SP');
        expect(() => testItem.RegisterLocalizationAdapter(la)).not.toThrow();
        expect(testItem.HasLocalizationFor('sp-SP')).toBe(true);
        expect(testItem.HasLocalizationFor('sp')).toBe(false);
    });
    // MapNativeTypeToLookupKey(value: any): string
    test('MapNativeTypeToLookupKey', () => {
        let testItem = new DataTypeResolver();
        expect(testItem.MapNativeTypeToLookupKey(0)).toBe(NumberLookupKey);
        expect(testItem.MapNativeTypeToLookupKey('abc')).toBe(StringLookupKey);
        expect(testItem.MapNativeTypeToLookupKey(false)).toBe(BooleanLookupKey);
        expect(testItem.MapNativeTypeToLookupKey(new Date())).toBe(DateLookupKey);
        expect(testItem.MapNativeTypeToLookupKey({})).toBeNull();
        expect(testItem.MapNativeTypeToLookupKey([])).toBeNull();
    });
    test('RegisterDataTypeIdentifier adds new item', () => {
        class TestDataType {}
        class TestIdentifier implements IDataTypeIdentifier
        {
            DataTypeLookupKey: string = 'TEST';
            IsMatch(value: any): boolean {
                return value instanceof TestDataType;
            }

        }
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new TestIdentifier());
        expect(testItem.MapNativeTypeToLookupKey(new TestDataType())).toBe('TEST');
        // confirm we didn't clobber the built in ones
        expect(testItem.MapNativeTypeToLookupKey(0)).toBe(NumberLookupKey);
        expect(testItem.MapNativeTypeToLookupKey('abc')).toBe(StringLookupKey);
        expect(testItem.MapNativeTypeToLookupKey(false)).toBe(BooleanLookupKey);
        expect(testItem.MapNativeTypeToLookupKey(new Date())).toBe(DateLookupKey);        
    });
    test('RegisterDataTypeIdentifier replaces existing item', () => {
        class TestDataType {}
        class TestIdentifier implements IDataTypeIdentifier
        {
            DataTypeLookupKey: string = DateLookupKey;  // will replace Dates...
            IsMatch(value: any): boolean {
                return value instanceof TestDataType;
            }

        }
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new TestIdentifier());
        expect(testItem.MapNativeTypeToLookupKey(new TestDataType())).toBe(DateLookupKey);
        expect(testItem.MapNativeTypeToLookupKey(new Date())).toBeNull();
        // confirm we didn't clobber the built in ones
        expect(testItem.MapNativeTypeToLookupKey(0)).toBe(NumberLookupKey);
        expect(testItem.MapNativeTypeToLookupKey('abc')).toBe(StringLookupKey);
        expect(testItem.MapNativeTypeToLookupKey(false)).toBe(BooleanLookupKey);

    });
    test('RegisterDataTypeIdentifier adds new item', () => {
        class TestDataType {
            constructor(quantity: number)
            {
                this.Quantity = quantity;
            }
            Quantity: number;
        }
        class TestConverter implements IDataTypeConverter
        {
            SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            Convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeConverter(new TestConverter());
        let result = testItem.GetDataTypeConverter(new TestDataType(10), null);
        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(TestConverter);
        expect(result?.Convert(new TestDataType(500), "")).toBe(500);
  
    });
    test('GetDataTypeConverter returns null when nothing is registered', () => {
        class TestDataType {
            constructor(quantity: number)
            {
                this.Quantity = quantity;
            }
            Quantity: number;
        }

        let testItem = new DataTypeResolver();

        let result = testItem.GetDataTypeConverter(new TestDataType(10), null);
        expect(result).toBeNull();
  
    });    
    test('GetDataTypeConverter returns null when there is a registration', () => {
        class TestDataType {
            constructor(quantity: number)
            {
                this.Quantity = quantity;
            }
            Quantity: number;
        }
        class TestDataType2 { }
        class TestConverter implements IDataTypeConverter
        {
            SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            Convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeConverter(new TestConverter());
        let result = testItem.GetDataTypeConverter(new TestDataType2(), null);
        expect(result).toBeNull();
    });    
    test('GetDataTypeConverter returns correct Converter with two registered and both are tried', () => {
        class TestDataType {
            constructor(quantity: number)
            {
                this.Quantity = quantity;
            }
            Quantity: number;
        }
        class TestDataType2 {
            constructor(message: string)
            {
                this.Message = message;
            }
            Message: string;
        }
        class TestConverter implements IDataTypeConverter
        {
            SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            Convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        class TestConverter2 implements IDataTypeConverter
        {
            SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType2;
            }
            Convert(value: TestDataType2, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Message;
            }
        }
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeConverter(new TestConverter());
        testItem.RegisterDataTypeConverter(new TestConverter2());
        let result = testItem.GetDataTypeConverter(new TestDataType(10), null);
        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(TestConverter);
        expect(result!.Convert(new TestDataType(500), "")).toBe(500);
        let result2 = testItem.GetDataTypeConverter(new TestDataType2("ABC"), null);
        expect(result2).not.toBeNull();
        expect(result2).toBeInstanceOf(TestConverter2);
        expect(result2!.Convert(new TestDataType2("ZYX"), "")).toBe("ZYX");        
    });        
});
