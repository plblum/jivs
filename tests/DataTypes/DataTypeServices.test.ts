
import { UTCDateOnlyConverter } from '../../src/DataTypes/DataTypeConverters';
import { BooleanDataTypeIdentifier, DateDataTypeIdentifier, StringDataTypeIdentifier } from '../../src/DataTypes/DataTypeIdentifiers';
import { NumberDataTypeIdentifier } from "../../src/DataTypes/DataTypeIdentifiers";
import { CultureIdFallback, DataTypeServices } from "../../src/DataTypes/DataTypeServices";
import { ComparersResult, IDataTypeComparer, IDataTypeConverter, IDataTypeIdentifier, IDataTypeFormatter, DataTypeResolution } from "../../src/Interfaces/DataTypes";
import { RegisterDataTypeIdentifiers, RegisterDataTypeFormatters } from "../../starter_code/create_services";
import { BooleanDataTypeComparer } from '../../src/DataTypes/DataTypeComparers';
import { BooleanFormatter, NumberFormatter } from '../../src/DataTypes/DataTypeFormatters';
import { MockValidationManager, MockValidationServices } from '../Mocks';
import { LookupKey } from '../../src/DataTypes/LookupKeys';


describe('DataTypeServices constructor and properties', () => {
    class Publicified_DataTypeServices extends DataTypeServices
    {
        constructor(cultureConfig?: Array<CultureIdFallback> | null) {
            super(cultureConfig);
        }
        public get ExposedCultureIdFallback(): Array<CultureIdFallback>
        {
            return this.CultureIdFallback;
        }
        public ExposedGetCultureIdFallback(cultureId: string): CultureIdFallback | null
        {
            return this.GetCultureIdFallback(cultureId);
        }
        public ExposedGetFormatters(): Array<IDataTypeFormatter>
        {
            return this.GetFormatters();
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
    
    test('Constructor with no parameters', () => {
        let testItem = new Publicified_DataTypeServices();

        expect(()=> testItem.ExposedCultureIdFallback).toThrow(/CultureIdFallback/)
        expect(testItem.ExposedGetDataTypeIdentifiers()).toEqual([]);
        expect(testItem.ExposedGetFormatters()).toEqual([]);
        expect(testItem.ExposedGetDataTypeConverters()).toEqual([]);
        expect(testItem.ExposedGetDataTypeComparers()).toEqual([]);
        expect(() => testItem.Services).toThrow(/Attach/);

    });

    test('Attach Services returns the same instance', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new Publicified_DataTypeServices();
        expect(() => testItem.Services = services).not.toThrow();
        let x: any;
        expect(() => x = testItem.Services).not.toThrow();
        expect(x).toBe(services);
        expect(testItem.ExposedCultureIdFallback).toEqual([{
            CultureId: 'en'
        }]);        
    });
    test('Attach Services supports use of ActiveCultureID', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new Publicified_DataTypeServices();
        services.ActiveCultureId = 'fr';
        testItem.Services = services;

        expect(testItem.ExposedCultureIdFallback).toEqual([{
            CultureId: 'fr'
        }]);        
    });    
    test('Constructor with CultureFallbacks can retrieve the fr CultureFallback', () => {
        let ccs: Array<CultureIdFallback> = [
            {
                CultureId: 'en',
                FallbackCultureId: null
            },
            {
                CultureId: 'fr',
                FallbackCultureId: 'en'
            }
        ];
        let services = new MockValidationServices(false, false);
        let testItem = new Publicified_DataTypeServices(ccs);
        testItem.Services = services;

        expect(testItem.ExposedCultureIdFallback).toEqual(ccs);
        services.ActiveCultureId = 'fr';
        expect(testItem.ExposedGetCultureIdFallback('fr')).toEqual({
            CultureId: 'fr',
            FallbackCultureId: 'en'
        });
    });        
});

function CreateCultureIdFallbacksForEn(): Array<CultureIdFallback>
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
function CreateCultureIdFallbacksForFR(): Array<CultureIdFallback>
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
        let ccs = CreateCultureIdFallbacksForEn();
        let testItem = new DataTypeServices(ccs);
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


export function CreateDataTypeServicesWithManyCultures(activeCultureId: string, registerFormatters: boolean = false): DataTypeServices
{
    let services = new MockValidationServices(false, false);
    services.ActiveCultureId = activeCultureId;
    let ccs = CreateCultureIdFallbacksForEn();
    let dts = new DataTypeServices(ccs);
    dts.Services = services;
    RegisterDataTypeIdentifiers(dts);   // always
    if (registerFormatters)
        RegisterDataTypeFormatters(dts);
    return dts;
        
}
// Format(value: any, lookupKey?: string): DataTypeResolution<string>
describe('DataTypeServices.Format', () => {
    test('No lookupKey not resolved by data type error', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en');
        expect(() => testItem.Format({})).toThrow(/LookupKey/);
    });
    test('Unsupported lookupKey error', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en');
        expect(() => testItem.Format(0, 'huh')).toThrow(/LookupKey/);
    });

    class TestFormatter implements IDataTypeFormatter
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
        Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
            return { Value: `${cultureId} TestKey` };
        }
        
    }

    test('Lookup Key in DataTypeFormatter en', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en', true);
        testItem.RegisterFormatter(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.Format(10, 'TestKey')).toEqual({ Value: 'en TestKey' });
    });     
    test('Lookup Key in DataTypeFormatter en using fallback from en-GB', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en-GB', true);
        testItem.RegisterFormatter(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.Format(10, 'TestKey')).toEqual({ Value: 'en TestKey' });
    });        
    test('Lookup Key in DataTypeFormatter en and en-GB gets from en-GB', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en-GB', true);
        testItem.RegisterFormatter(new TestFormatter(['en', 'en-GB'], 'EN TestKey'));
        expect(testItem.Format(10, 'TestKey')).toEqual({ Value: 'en-GB TestKey' });
    }); 
    test('Date to string using built-in Localization', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en', true);
        let date = new Date(2000, 0, 11);
        testItem.Services.ActiveCultureId = 'en-GB';
        expect(testItem.Format(date)).toEqual({ Value: '11/01/2000' });
        testItem.Services.ActiveCultureId = 'en';
        expect(testItem.Format(date)).toEqual({ Value: '1/11/2000' });
        testItem.Services.ActiveCultureId = 'fr';
        expect(testItem.Format(date)).toEqual({ Value: '11/01/2000' });
    });    
    test('Number to string using built-in Localization', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en', true);
        let value = 4000.932;
        testItem.Services.ActiveCultureId = 'en-GB';
        expect(testItem.Format(value)).toEqual({ Value: '4,000.932' });
        testItem.Services.ActiveCultureId = 'en';
        expect(testItem.Format(value)).toEqual({ Value: '4,000.932' });
        testItem.Services.ActiveCultureId = 'fr';
        expect(testItem.Format(value)).toEqual({ Value: '4\u{202F}000,932' });
    });        
    test('String to string using built-in Localization. Expect no changes', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en', true);
        let value = 'abcZYX';
        testItem.Services.ActiveCultureId = 'en-GB';
        expect(testItem.Format(value)).toEqual({ Value: value });
        testItem.Services.ActiveCultureId = 'en';
        expect(testItem.Format(value)).toEqual({ Value: value });
        testItem.Services.ActiveCultureId = 'fr';
        expect(testItem.Format(value)).toEqual({ Value: value });
    });
    test('Lookup Key supplied not compatible with native data type error', () => {
        let testItem = CreateDataTypeServicesWithManyCultures('en', true);
        expect(testItem.Format(10, LookupKey.Date).ErrorMessage).not.toBeUndefined();
        expect(testItem.Format(10, LookupKey.Boolean).ErrorMessage).not.toBeUndefined();
        expect(testItem.Format('10', LookupKey.Number).ErrorMessage).not.toBeUndefined();
    });         
});
// RegisterDataTypeComparer(comparer: IDataTypeComparer): void
describe('DataTypeServices.RegisterDataTypeComparer', () => {
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
        let testItem = new DataTypeServices();
        expect(() => testItem.RegisterDataTypeComparer(null!)).toThrow(/comparer/);
    });
    test('New comparer that handles numbers with custom type and datatype lookup resolved by IDataTypeIdentifier', () => {

        let testItem = new DataTypeServices();
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

        let testItem = new DataTypeServices();
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
describe('DataTypeServices.CompareValues', () => {
    test('Number value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeServices();
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
        let testItem = new DataTypeServices();
        testItem.RegisterDataTypeIdentifier(new NumberDataTypeIdentifier());
        testItem.RegisterDataTypeIdentifier(new SupportTestDataType());
        testItem.RegisterDataTypeConverter(new TestConverter());        

        expect(testItem.CompareValues(new TestDataType(0), 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(new TestDataType(10), 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues(new TestDataType(undefined!), 0, null, null)).toBe(ComparersResult.Undetermined);        
    });

    
    test('String value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeServices();
        testItem.RegisterDataTypeIdentifier(new StringDataTypeIdentifier());
        expect(testItem.CompareValues('A', 'A', null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues('B', 'A', null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.CompareValues('A', 'B', null, null)).toBe(ComparersResult.LessThan);        
    });    
    test('Boolean value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeServices();
        testItem.RegisterDataTypeIdentifier(new BooleanDataTypeIdentifier());
        testItem.RegisterDataTypeComparer(new BooleanDataTypeComparer());
        expect(testItem.CompareValues(true, true, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(false, true, null, null)).toBe(ComparersResult.NotEquals);
        expect(testItem.CompareValues(true, false, null, null)).toBe(ComparersResult.NotEquals);        
    });       
     
    test('Date value resolves lookupKey and correctly handles comparisons', () => {
        let date1 = new Date(2000, 5, 31);
        let date2 = new Date(2000, 5, 30);
        let testItem = new DataTypeServices();
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
        let testItem = new DataTypeServices();
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
        let testItem = new DataTypeServices();
        expect(() => testItem.CompareValues({}, 'A', null, null)).toThrow(/operand/);
        expect(() => testItem.CompareValues(testItem /* some class */, 'A', null, null)).toThrow(/operand/);
    });    
    test('Fallback to DefaultComparer for unsupported lookupKey', () => {
        let testItem = new DataTypeServices();
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
        let testItem = new DataTypeServices();
        testItem.RegisterDataTypeIdentifier(new HoldsDateIdentifier());
        testItem.RegisterDataTypeConverter(new HoldsDateConverter());
        testItem.RegisterDataTypeComparer(new DayOfWeekComparer());
        expect(testItem.CompareValues(test1, test1, "HoldsDate", "HoldsDate")).toBe(ComparersResult.Equals);
        expect(testItem.CompareValues(test1, test2, "HoldsDate", "HoldsDate")).toBe(ComparersResult.NotEquals);
        expect(testItem.CompareValues(test2, test1, "HoldsDate", "HoldsDate")).toBe(ComparersResult.NotEquals);        
        expect(testItem.CompareValues(test1, test3, "HoldsDate", "HoldsDate")).toBe(ComparersResult.Equals);
    });      
});

describe('DataTypeServices utility methods', () => {

    // IdentifyLookupKey(value: any): string
    test('IdentifyLookupKey', () => {
        let testItem = new DataTypeServices();
        RegisterDataTypeIdentifiers(testItem);
        expect(testItem.IdentifyLookupKey(0)).toBe(LookupKey.Number);
        expect(testItem.IdentifyLookupKey('abc')).toBe(LookupKey.String);
        expect(testItem.IdentifyLookupKey(false)).toBe(LookupKey.Boolean);
        expect(testItem.IdentifyLookupKey(new Date())).toBe(LookupKey.Date);
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
        let testItem = new DataTypeServices();
        RegisterDataTypeIdentifiers(testItem);
        testItem.RegisterDataTypeIdentifier(new TestIdentifier());
        expect(testItem.IdentifyLookupKey(new TestDataType())).toBe('TEST');
        // confirm we didn't clobber the built in ones
        expect(testItem.IdentifyLookupKey(0)).toBe(LookupKey.Number);
        expect(testItem.IdentifyLookupKey('abc')).toBe(LookupKey.String);
        expect(testItem.IdentifyLookupKey(false)).toBe(LookupKey.Boolean);
        expect(testItem.IdentifyLookupKey(new Date())).toBe(LookupKey.Date);        
    });
    test('RegisterDataTypeIdentifier replaces existing item', () => {
        class TestDataType {}
        class TestIdentifier implements IDataTypeIdentifier
        {
            DataTypeLookupKey: string = LookupKey.Date;  // will replace Dates...
            SupportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }

        }
        let testItem = new DataTypeServices();
        RegisterDataTypeIdentifiers(testItem);
        testItem.RegisterDataTypeIdentifier(new TestIdentifier());
        expect(testItem.IdentifyLookupKey(new TestDataType())).toBe(LookupKey.Date);
        expect(testItem.IdentifyLookupKey(new Date())).toBeNull();
        // confirm we didn't clobber the built in ones
        expect(testItem.IdentifyLookupKey(0)).toBe(LookupKey.Number);
        expect(testItem.IdentifyLookupKey('abc')).toBe(LookupKey.String);
        expect(testItem.IdentifyLookupKey(false)).toBe(LookupKey.Boolean);

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
        let testItem = new DataTypeServices();
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

        let testItem = new DataTypeServices();

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
        let testItem = new DataTypeServices();
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
        let testItem = new DataTypeServices();
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
describe('Other functions in DataTypeServices', () => {
    test('UnregisterFormatter', () => {
        let testItem = new DataTypeServices();
        testItem.RegisterFormatter(new NumberFormatter());
        testItem.RegisterFormatter(new BooleanFormatter(LookupKey.Boolean));
        expect(testItem.UnregisterFormatter(LookupKey.Number, 'en')).toBe(true);
        expect(testItem.UnregisterFormatter(LookupKey.Number, 'en')).toBe(false);
        expect(testItem.UnregisterFormatter(LookupKey.Boolean, 'en')).toBe(true);
        expect(testItem.UnregisterFormatter(LookupKey.Boolean, 'en')).toBe(false);
    });
});
