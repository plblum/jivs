
import { UTCDateOnlyConverter } from './../../src/DataTypes/DataTypeConverters';
import { BooleanDataTypeIdentifier, DateDataTypeIdentifier, StringDataTypeIdentifier } from './../../src/DataTypes/DataTypeIdentifiers';
import { NumberDataTypeIdentifier } from "../../src/DataTypes/DataTypeIdentifiers";
import { CultureConfig, DataTypeResolver } from "../../src/DataTypes/DataTypeResolver";
import { StringLookupKey, NumberLookupKey, BooleanLookupKey, allBuiltInFormatLookupKeys, DateLookupKey } from "../../src/DataTypes/LookupKeys";
import { ComparersResult, IDataTypeComparer, IDataTypeConverter, IDataTypeIdentifier, IDataTypeLocalizedFormatter, IDataTypeResolution } from "../../src/Interfaces/DataTypes";
import { RegisterDataTypeIdentifiers, RegisterDataTypeLocalizedFormatters } from "../../starter_code/create_services";
import { BooleanDataTypeComparer, DefaultComparer } from '../../src/DataTypes/DataTypeComparers';
import { BooleanLocalizedFormatter, BooleanLocalizedFormatterBase, NumberLocalizedFormatter } from '../../src/DataTypes/DataTypeLocalizedFormatters';


describe('DataTypeResolver constructor and properties', () => {
    class Publicified_DataTypeResolver extends DataTypeResolver
    {
        constructor(activeCultureID?: string | null, cultureConfig?: Array<CultureConfig> | null) {
            super(activeCultureID, cultureConfig);
        }
        public get ExposedCultureConfig(): Array<CultureConfig>
        {
            return this.CultureConfig;
        }
        public ExposedGetCultureConfig(cultureId: string): CultureConfig | null
        {
            return this.GetCultureConfig(cultureId);
        }
        public ExposedGetLocalizedFormatters(): Array<IDataTypeLocalizedFormatter>
        {
            return this.GetLocalizedFormatters();
        }
        public ExposedCleanupComparableValue(value: any, lookupKey: string | null): any
        {
            return this.CleanupComparableValue(value, lookupKey);
        }
        public ExposedGetDataTypeComparers(): Array<IDataTypeComparer>
        {
            return this.GetDataTypeComparers();
        }
        public ExposedGetDataTypeIdentifiers(): Array<IDataTypeIdentifier>
        {
            return this.GetDataTypeIdentifiers();
        }
        public ExposedGetDataTypeConverters(): Array<IDataTypeConverter>
        {
            return this.GetDataTypeConverters();
        }
    }
    
    test('Constructor with no parameters sets up ActiveCultureID of en, one CultureConfig, and empty registered data lists', () => {
        let testItem = new Publicified_DataTypeResolver();
        expect(testItem.ActiveCultureID).toBe('en');
        expect(testItem.ExposedCultureConfig).toEqual([{
            CultureId: 'en'
        }]);
        expect(testItem.ExposedGetDataTypeIdentifiers()).toEqual([]);
        expect(testItem.ExposedGetLocalizedFormatters()).toEqual([]);
        expect(testItem.ExposedGetDataTypeConverters()).toEqual([]);
        expect(testItem.ExposedGetDataTypeComparers()).toEqual([]);

    });
    test('Constructor with cultureID of fr sets up ActiveCultureID of fr', () => {
        let testItem = new Publicified_DataTypeResolver('fr');
        expect(testItem.ActiveCultureID).toBe('fr');
        expect(testItem.ExposedCultureConfig).toEqual([{
            CultureId: 'fr'
        }]);
    });
    test('Constructor with cultureID of fr and DataTypeLocalization for en and fr', () => {
        let ccs: Array<CultureConfig> = [
            {
                CultureId: 'en',
                FallbackCultureId: null
            },
            {
                CultureId: 'fr',
                FallbackCultureId: 'en'
            }
        ];
        let testItem = new Publicified_DataTypeResolver('fr', ccs);
        expect(testItem.ActiveCultureID).toBe('fr');
        expect(testItem.ExposedCultureConfig).toEqual(ccs);
    });    
});

function CreateCultureConfigsForEn(): Array<CultureConfig>
{
    return [
        {
            CultureId: 'en',
            FallbackCultureId: null
        },
        {
            CultureId: 'fr',
            FallbackCultureId: 'en'
        },
        {
            CultureId: 'fr-FR',
            FallbackCultureId: 'fr'
        },
        {
            CultureId: 'en-US',
            FallbackCultureId: 'en'
        },
        {
            CultureId: 'en-GB',
            FallbackCultureId: 'en-US'
        },        
    ];
}
function CreateCultureConfigsForFR(): Array<CultureConfig>
{
    return [
        {
            CultureId: 'fr',
            FallbackCultureId: null
        },
        {
            CultureId: 'en',
            FallbackCultureId: 'fr'
        },
        {
            CultureId: 'fr-FR',
            FallbackCultureId: 'fr'
        },
        {
            CultureId: 'en-US',
            FallbackCultureId: 'en'
        },
        
    ];
}
describe('GetClosestCultureId', () => {
    test('Various', () => {
        let ccs = CreateCultureConfigsForEn();
        let testItem = new DataTypeResolver(null, ccs);
        expect(testItem.GetClosestCultureId('en')).toBe('en');
        expect(testItem.GetClosestCultureId('fr')).toBe('fr');
        expect(testItem.GetClosestCultureId('fr-FR')).toBe('fr-FR');
        expect(testItem.GetClosestCultureId('en-US')).toBe('en-US');        
        expect(testItem.GetClosestCultureId('fr-CA')).toBe('fr');
        expect(testItem.GetClosestCultureId('en-MX')).toBe('en');       
        expect(testItem.GetClosestCultureId('de')).toBeNull();
        expect(testItem.GetClosestCultureId('de-DE')).toBeNull();                
    });
})


export function CreateDataTypeResolverWithManyCultures(registerFormatters: boolean = false): DataTypeResolver
{
    let ccs = CreateCultureConfigsForEn();
    let dtr = new DataTypeResolver('en', ccs);
    RegisterDataTypeIdentifiers(dtr);   // always
    if (registerFormatters)
        RegisterDataTypeLocalizedFormatters(dtr);
    return dtr;
        
}
// Format(value: any, lookupKey?: string): IDataTypeResolution<string>
describe('DataTypeResolver.Format', () => {
    test('No lookupKey not resolved by data type error', () => {
        let testItem = CreateDataTypeResolverWithManyCultures();
        expect(() => testItem.Format({})).toThrow(/LookupKey/);
    });
    test('Unsupported lookupKey error', () => {
        let testItem = CreateDataTypeResolverWithManyCultures();
        expect(() => testItem.Format(0, 'huh')).toThrow(/LookupKey/);
    });

    class TestLocalizedFormatter implements IDataTypeLocalizedFormatter
    {
        constructor(supportedCultureIds: Array<string>, valueToReturn?: string)
        {
            this._valueToReturn = valueToReturn ?? 'EN TestKey';
            this._supportedCultureIds = supportedCultureIds ?? ['en'];
        }
        private _valueToReturn: string;
        private _supportedCultureIds: Array<string>;
        
        Supports(dataTypeLookupKey: string, cultureId: string): boolean {
            return this._supportedCultureIds.includes(cultureId);
        }
        Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
            return { Value: `${cultureId} TestKey` };
        }
        
    }

    test('Lookup Key in DataTypeLocalization en', () => {
        let testItem = CreateDataTypeResolverWithManyCultures(true);
        testItem.RegisterLocalizedFormatter(new TestLocalizedFormatter(['en'], 'EN TestKey'));
        testItem.ActiveCultureID = 'en';
        expect(testItem.Format(10, 'TestKey')).toEqual({ Value: 'en TestKey' });
    });     
    test('Lookup Key in DataTypeLocalization en using fallback from en-GB', () => {
        let testItem = CreateDataTypeResolverWithManyCultures(true);
        testItem.RegisterLocalizedFormatter(new TestLocalizedFormatter(['en'], 'EN TestKey'));
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.Format(10, 'TestKey')).toEqual({ Value: 'en TestKey' });
    });        
    test('Lookup Key in DataTypeLocalization en and en-GB gets from en-GB', () => {
        let testItem = CreateDataTypeResolverWithManyCultures(true);
        testItem.RegisterLocalizedFormatter(new TestLocalizedFormatter(['en', 'en-GB'], 'EN TestKey'));
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.Format(10, 'TestKey')).toEqual({ Value: 'en-GB TestKey' });
    }); 
    test('Date to string using built-in Localization', () => {
        let testItem = CreateDataTypeResolverWithManyCultures(true);
        let date = new Date(2000, 0, 11);
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.Format(date)).toEqual({ Value: '11/01/2000' });
        testItem.ActiveCultureID = 'en';
        expect(testItem.Format(date)).toEqual({ Value: '1/11/2000' });
        testItem.ActiveCultureID = 'fr';
        expect(testItem.Format(date)).toEqual({ Value: '11/01/2000' });
    });    
    test('Number to string using built-in Localization', () => {
        let testItem = CreateDataTypeResolverWithManyCultures(true);
        let value = 4000.932;
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.Format(value)).toEqual({ Value: '4,000.932' });
        testItem.ActiveCultureID = 'en';
        expect(testItem.Format(value)).toEqual({ Value: '4,000.932' });
        testItem.ActiveCultureID = 'fr';
        expect(testItem.Format(value)).toEqual({ Value: '4\u{202F}000,932' });
    });        
    test('String to string using built-in Localization. Expect no changes', () => {
        let testItem = CreateDataTypeResolverWithManyCultures(true);
        let value = 'abcZYX';
        testItem.ActiveCultureID = 'en-GB';
        expect(testItem.Format(value)).toEqual({ Value: value });
        testItem.ActiveCultureID = 'en';
        expect(testItem.Format(value)).toEqual({ Value: value });
        testItem.ActiveCultureID = 'fr';
        expect(testItem.Format(value)).toEqual({ Value: value });
    });
    test('Lookup Key supplied not compatible with native data type error', () => {
        let testItem = CreateDataTypeResolverWithManyCultures(true);
        testItem.ActiveCultureID = 'en';
        expect(testItem.Format(10, DateLookupKey).ErrorMessage).not.toBeUndefined();
        expect(testItem.Format(10, BooleanLookupKey).ErrorMessage).not.toBeUndefined();
        expect(testItem.Format('10', NumberLookupKey).ErrorMessage).not.toBeUndefined();
    });         
});
// RegisterDataTypeComparer(comparer: IDataTypeComparer): void
describe('DataTypeResolver.RegisterDataTypeComparer', () => {
    class TestDataType
    {
        constructor(firstName: string, lastName: string)
        {
            this.FirstName = firstName;
            this.LastName = lastName;
        }
        FirstName: string;
        LastName: string;
    }
    class TestIdentifier implements IDataTypeIdentifier
    {
        DataTypeLookupKey: string = "TEST";
        SupportsValue(value: any): boolean {
            return value instanceof TestDataType;
        }
        
    }
    class TestComparer implements IDataTypeComparer
    {
        SupportsValues(value1: any, value2: any): boolean {
            return value1 instanceof TestDataType ||
                value2 instanceof TestDataType;
        }
        Compare(value1: any, value2: any): ComparersResult {
            if (value1 instanceof TestDataType &&
                value2 instanceof TestDataType)
            {
                let fullName1 = (value1.FirstName + ' ' + value1.LastName).toLowerCase();
                let fullName2 = (value2.FirstName + ' ' + value2.LastName).toLowerCase();
                if (fullName1 === fullName2)
                    return ComparersResult.Equals;
                if (fullName1 < fullName2)
                    return ComparersResult.LessThan;
                return ComparersResult.GreaterThan;
            }
            return ComparersResult.NotEquals;
        }
    }    
    test('Invalid parameters', () => {
        let testItem = new DataTypeResolver();
        expect(() => testItem.RegisterDataTypeComparer(null!)).toThrow(/comparer/);
    });
    test('New comparer that handles numbers with custom type and datatype lookup resolved by IDataTypeIdentifier', () => {

        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new TestIdentifier());
        expect(() => testItem.RegisterDataTypeComparer(new TestComparer())).not.toThrow();

        let test1 = new TestDataType("A", "B");
        let test2 = new TestDataType("A", "C");
        let test3 = new TestDataType("a", "c");        
        let test4 = new TestDataType("z", "y");

        expect(testItem.CompareValues(test1, test1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(test2, test3, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(test3, test2, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(test1, test2, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.CompareValues(test2, test1, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues(test1, test4, null, null)).toBe(ComparersResult.LessThan);
    });

    test('New comparer that handles numbers with custom type and datatype lookup resolved by LookupKey', () => {

        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new TestIdentifier());
        expect(() => testItem.RegisterDataTypeComparer(new TestComparer())).not.toThrow();

        let test1 = new TestDataType("A", "B");
        let test2 = new TestDataType("A", "C");
        let test3 = new TestDataType("a", "c");        
        let test4 = new TestDataType("z", "y");

        expect(testItem.CompareValues(test1, test1, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(test2, test3, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(test3, test2, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(test1, test2, "TEST", "TEST")).toBe(ComparersResult.LessThan);
        expect(testItem.CompareValues(test2, test1, "TEST", "TEST")).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues(test1, test4, "TEST", "TEST")).toBe(ComparersResult.LessThan);
    });
});
// CompareValues(value1: any, value2: any, lookupKey: string | null): ComparersResult
describe('DataTypeResolver.CompareValues', () => {
    test('Number value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new NumberDataTypeIdentifier());
        expect(testItem.CompareValues(0, 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(0, 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(1, 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues(0, 1, null, null)).toBe(ComparersResult.LessThan);        
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
            SupportsValue(value: any): boolean {
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
        testItem.RegisterDataTypeIdentifier(new NumberDataTypeIdentifier());
        testItem.RegisterDataTypeIdentifier(new SupportTestDataType());
        testItem.RegisterDataTypeConverter(new TestConverter());        

        expect(testItem.CompareValues(new TestDataType(0), 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(new TestDataType(10), 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues(new TestDataType(undefined!), 0, null, null)).toBe(ComparersResult.Undetermined);        
    });

    
    test('String value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new StringDataTypeIdentifier());
        expect(testItem.CompareValues('A', 'A', null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('B', 'A', null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues('A', 'B', null, null)).toBe(ComparersResult.LessThan);        
    });    
    test('Boolean value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new BooleanDataTypeIdentifier());
        testItem.RegisterDataTypeComparer(new BooleanDataTypeComparer());
        expect(testItem.CompareValues(true, true, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(false, true, null, null)).toBe(ComparersResult.NotEquals);
        expect(testItem.CompareValues(true, false, null, null)).toBe(ComparersResult.NotEquals);        
    });       
     
    test('Date value resolves lookupKey and correctly handles comparisons', () => {
        let date1 = new Date(2000, 5, 31);
        let date2 = new Date(2000, 5, 30);
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new DateDataTypeIdentifier());
        testItem.RegisterDataTypeConverter(new UTCDateOnlyConverter());

        expect(testItem.CompareValues(date1, date1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date2, date1, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.CompareValues(date1, date2, null, null)).toBe(ComparersResult.GreaterThan);        
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
            SupportsValue(value: any): boolean {
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
        testItem.RegisterDataTypeIdentifier(new DateDataTypeIdentifier());
        testItem.RegisterDataTypeConverter(new UTCDateOnlyConverter());
        testItem.RegisterDataTypeIdentifier(new SupportTestDataType());
        testItem.RegisterDataTypeConverter(new TestConverter()); 
        
        let date1 = new TestDataType(new Date(2000, 5, 31));
        let date2 = new Date(2000, 5, 30);

        expect(testItem.CompareValues(date1, date1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(date2, date1, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.CompareValues(date1, date2, null, null)).toBe(ComparersResult.GreaterThan);        
    });               
    
    test('Unsupported data type for lookupKey assignment error', () => {
        let testItem = new DataTypeResolver();
        expect(() => testItem.CompareValues({}, 'A', null, null)).toThrow(/operand/);
        expect(() => testItem.CompareValues(testItem /* some class */, 'A', null, null)).toThrow(/operand/);
    });    
    test('Fallback to DefaultComparer for unsupported lookupKey', () => {
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new StringDataTypeIdentifier());

        expect(testItem.CompareValues('A', 'A', 'Key1', null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('A', 'a', 'Key1', null)).toBe(ComparersResult.LessThan);
    });          
    test('Compare with custom types that have a Comparer for their converted values', () => {
        // HoldsDate -> Date -> Compare to Day Of week
        class HoldsDate
        {
            constructor(year: number, month: number, day: number)
            {
                this._value = new Date(Date.UTC(year, month, day));
            }
            private _value: Date;
            get Value(): Date
            {
                return this._value;
            }
        }
        class HoldsDateIdentifier implements IDataTypeIdentifier
        {
            DataTypeLookupKey = "HoldsDate";
            SupportsValue(value: any): boolean {
                return value instanceof HoldsDate;
            }
        }
        class HoldsDateConverter implements IDataTypeConverter
        {
            SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof HoldsDate && dataTypeLookupKey === "HoldsDate";
            }
            Convert(value: HoldsDate, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Value;
            }
        }

        class DayOfWeekComparer implements IDataTypeComparer
        {
            SupportsValues(value1: any, value2: any): boolean {
                return value1 instanceof Date && value2 instanceof Date;
            }
            Compare(value1: any, value2: any): ComparersResult {
                if (value1 instanceof Date && value2 instanceof Date)
                    return value1.getUTCDay() === value2.getUTCDay() ?
                        ComparersResult.Equals : ComparersResult.NotEquals;
                return ComparersResult.Undetermined;
            }
        }

        let test1 = new HoldsDate(2000, 1, 5);
        let test2 = new HoldsDate(2000, 1, 6);
        let test3 = new HoldsDate(2000, 1, 12);
        let testItem = new DataTypeResolver();
        testItem.RegisterDataTypeIdentifier(new HoldsDateIdentifier());
        testItem.RegisterDataTypeConverter(new HoldsDateConverter());
        testItem.RegisterDataTypeComparer(new DayOfWeekComparer());
        expect(testItem.CompareValues(test1, test1, "HoldsDate", "HoldsDate")).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(test1, test2, "HoldsDate", "HoldsDate")).toBe(ComparersResult.NotEquals);
        expect(testItem.CompareValues(test2, test1, "HoldsDate", "HoldsDate")).toBe(ComparersResult.NotEquals);        
        expect(testItem.CompareValues(test1, test3, "HoldsDate", "HoldsDate")).toBe(ComparersResult.Equals);
    });      
});

describe('DataTypeResolver utility methods', () => {

    // IdentifyLookupKey(value: any): string
    test('IdentifyLookupKey', () => {
        let testItem = new DataTypeResolver();
        RegisterDataTypeIdentifiers(testItem);
        expect(testItem.IdentifyLookupKey(0)).toBe(NumberLookupKey);
        expect(testItem.IdentifyLookupKey('abc')).toBe(StringLookupKey);
        expect(testItem.IdentifyLookupKey(false)).toBe(BooleanLookupKey);
        expect(testItem.IdentifyLookupKey(new Date())).toBe(DateLookupKey);
        expect(testItem.IdentifyLookupKey({})).toBeNull();
        expect(testItem.IdentifyLookupKey([])).toBeNull();
    });
    test('RegisterDataTypeIdentifier adds new item', () => {
        class TestDataType {}
        class TestIdentifier implements IDataTypeIdentifier
        {
            DataTypeLookupKey: string = 'TEST';
            SupportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }

        }
        let testItem = new DataTypeResolver();
        RegisterDataTypeIdentifiers(testItem);
        testItem.RegisterDataTypeIdentifier(new TestIdentifier());
        expect(testItem.IdentifyLookupKey(new TestDataType())).toBe('TEST');
        // confirm we didn't clobber the built in ones
        expect(testItem.IdentifyLookupKey(0)).toBe(NumberLookupKey);
        expect(testItem.IdentifyLookupKey('abc')).toBe(StringLookupKey);
        expect(testItem.IdentifyLookupKey(false)).toBe(BooleanLookupKey);
        expect(testItem.IdentifyLookupKey(new Date())).toBe(DateLookupKey);        
    });
    test('RegisterDataTypeIdentifier replaces existing item', () => {
        class TestDataType {}
        class TestIdentifier implements IDataTypeIdentifier
        {
            DataTypeLookupKey: string = DateLookupKey;  // will replace Dates...
            SupportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }

        }
        let testItem = new DataTypeResolver();
        RegisterDataTypeIdentifiers(testItem);
        testItem.RegisterDataTypeIdentifier(new TestIdentifier());
        expect(testItem.IdentifyLookupKey(new TestDataType())).toBe(DateLookupKey);
        expect(testItem.IdentifyLookupKey(new Date())).toBeNull();
        // confirm we didn't clobber the built in ones
        expect(testItem.IdentifyLookupKey(0)).toBe(NumberLookupKey);
        expect(testItem.IdentifyLookupKey('abc')).toBe(StringLookupKey);
        expect(testItem.IdentifyLookupKey(false)).toBe(BooleanLookupKey);

    });
    test('RegisterDataTypeConverter adds new item', () => {
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
describe('Other functions in DataTypeResolver', () => {
    test('UnregisterLocalizedFormatter', () => {
        let testItem = new DataTypeResolver();
        testItem.RegisterLocalizedFormatter(new NumberLocalizedFormatter());
        testItem.RegisterLocalizedFormatter(new BooleanLocalizedFormatter());
        expect(testItem.UnregisterLocalizedFormatter(NumberLookupKey, 'en')).toBe(true);
        expect(testItem.UnregisterLocalizedFormatter(NumberLookupKey, 'en')).toBe(false);
        expect(testItem.UnregisterLocalizedFormatter(BooleanLookupKey, 'en')).toBe(true);
        expect(testItem.UnregisterLocalizedFormatter(BooleanLookupKey, 'en')).toBe(false);
    });
});
