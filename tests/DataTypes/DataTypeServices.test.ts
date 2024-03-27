
import { UTCDateOnlyConverter } from '../../src/DataTypes/DataTypeConverters';
import { BooleanDataTypeIdentifier, DateDataTypeIdentifier, StringDataTypeIdentifier } from '../../src/DataTypes/DataTypeIdentifiers';
import { NumberDataTypeIdentifier } from "../../src/DataTypes/DataTypeIdentifiers";
import { CultureIdFallback, DataTypeServices } from "../../src/DataTypes/DataTypeServices";
import { ComparersResult, IDataTypeComparer, IDataTypeConverter, IDataTypeIdentifier, IDataTypeFormatter, DataTypeResolution, IDataTypeCheckGenerator } from "../../src/Interfaces/DataTypes";
import { registerDataTypeIdentifiers, registerDataTypeFormatters } from "../../starter_code/create_services";
import { BooleanDataTypeComparer } from '../../src/DataTypes/DataTypeComparers';
import { BooleanFormatter, NumberFormatter } from '../../src/DataTypes/DataTypeFormatters';
import { MockCapturingLogger, MockValidationManager, MockValidationServices } from '../Mocks';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ICondition, IConditionFactory } from '../../src/Interfaces/Conditions';
import { IInputValueHost } from '../../src/Interfaces/InputValueHost';
import exp from 'constants';
import { DataTypeCheckCondition, RegExpCondition } from '../../src/Conditions/ConcreteConditions';
import { InputValueHost } from '../../src/ValueHosts/InputValueHost';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { CompareCategory, LoggingLevel, LookupKeyCategory } from '../../src/Interfaces/Logger';


describe('DataTypeServices constructor and properties', () => {
    class Publicified_DataTypeServices extends DataTypeServices
    {
        constructor(cultureConfig?: Array<CultureIdFallback> | null) {
            super(cultureConfig);
        }
        public get exposedCultureIdFallback(): Array<CultureIdFallback>
        {
            return this.cultureIdFallback;
        }
        public exposedGetCultureIdFallback(cultureId: string): CultureIdFallback | null
        {
            return this.getCultureIdFallback(cultureId);
        }
        public exposedGetFormatters(): Array<IDataTypeFormatter>
        {
            return this.getFormatters();
        }
        public exposedCleanupComparableValue(value: any, lookupKey: string | null): any
        {
            return this.cleanupComparableValue(value, lookupKey);
        }
        public exposedGetDataTypeComparers(): Array<IDataTypeComparer>
        {
            return this.getDataTypeComparers();
        }
        public exposedGetDataTypeIdentifiers(): Array<IDataTypeIdentifier>
        {
            return this.getDataTypeIdentifiers();
        }
        public exposedGetDataTypeConverters(): Array<IDataTypeConverter>
        {
            return this.getDataTypeConverters();
        }
    }
    
    test('Constructor with no parameters', () => {
        let testItem = new Publicified_DataTypeServices();

        expect(()=> testItem.exposedCultureIdFallback).toThrow(/CultureIdFallback/);
        expect(testItem.exposedGetDataTypeIdentifiers()).toEqual([]);
        expect(testItem.exposedGetFormatters()).toEqual([]);
        expect(testItem.exposedGetDataTypeConverters()).toEqual([]);
        expect(testItem.exposedGetDataTypeComparers()).toEqual([]);
        expect(() => testItem.services).toThrow(/Assign/);

    });

    test('Attach Services returns the same instance', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new Publicified_DataTypeServices();
        expect(() => testItem.services = services).not.toThrow();
        let x: any;
        expect(() => x = testItem.services).not.toThrow();
        expect(x).toBe(services);
        expect(testItem.exposedCultureIdFallback).toEqual([{
            cultureId: 'en'
        }]);        
    });
    test('Attach Services supports use of ActiveCultureID', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new Publicified_DataTypeServices();
        services.activeCultureId = 'fr';
        testItem.services = services;

        expect(testItem.exposedCultureIdFallback).toEqual([{
            cultureId: 'fr'
        }]);        
    });    
    test('Constructor with CultureFallbacks can retrieve the fr CultureFallback', () => {
        let ccs: Array<CultureIdFallback> = [
            {
                cultureId: 'en',
                fallbackCultureId: null
            },
            {
                cultureId: 'fr',
                fallbackCultureId: 'en'
            }
        ];
        let services = new MockValidationServices(false, false);
        let testItem = new Publicified_DataTypeServices(ccs);
        testItem.services = services;

        expect(testItem.exposedCultureIdFallback).toEqual(ccs);
        services.activeCultureId = 'fr';
        expect(testItem.exposedGetCultureIdFallback('fr')).toEqual({
            cultureId: 'fr',
            fallbackCultureId: 'en'
        });
    });        
});

function createCultureIdFallbacksForEn(): Array<CultureIdFallback>
{
    return [
        {
            cultureId: 'en',
            fallbackCultureId: null
        },
        {
            cultureId: 'fr',
            fallbackCultureId: 'en'
        },
        {
            cultureId: 'fr-FR',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'en-US',
            fallbackCultureId: 'en'
        },
        {
            cultureId: 'en-GB',
            fallbackCultureId: 'en-US'
        },        
    ];
}
function createCultureIdFallbacksForFR(): Array<CultureIdFallback>
{
    return [
        {
            cultureId: 'fr',
            fallbackCultureId: null
        },
        {
            cultureId: 'en',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'fr-FR',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'en-US',
            fallbackCultureId: 'en'
        },
        
    ];
}
describe('GetClosestCultureId', () => {
    test('Various', () => {
        let ccs = createCultureIdFallbacksForEn();
        let testItem = new DataTypeServices(ccs);
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


export function createDataTypeServicesWithManyCultures(activeCultureId: string, registerFormatters: boolean = false): DataTypeServices
{
    let services = new MockValidationServices(false, false);
    services.activeCultureId = activeCultureId;
    let ccs = createCultureIdFallbacksForEn();
    let dts = new DataTypeServices(ccs);
    dts.services = services;
    registerDataTypeIdentifiers(dts);   // always
    if (registerFormatters)
        registerDataTypeFormatters(dts);
    return dts;
        
}
// Format(value: any, lookupKey?: string): DataTypeResolution<string>
describe('DataTypeServices.Format', () => {
    test('No lookupKey not resolved. Logs an error and returns an error message', () => {
        let testItem = createDataTypeServicesWithManyCultures('en');
        let logger = testItem.services.loggerService as MockCapturingLogger;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.format({})).not.toThrow();
        expect(result).not.toBeNull();
        expect(result!.value).toBeUndefined();
        expect(result!.errorMessage).toMatch(/LookupKey/);
        expect(logger.findMessage('LookupKey', LoggingLevel.Error, LookupKeyCategory, 'DataTypeServices')).not.toBeNull();
    });
    test('Unsupported lookupKey error', () => {
        let testItem = createDataTypeServicesWithManyCultures('en');

        let logger = testItem.services.loggerService as MockCapturingLogger;
        let result: DataTypeResolution<string> | null = null;
        expect(() => result = testItem.format(0, 'huh')).not.toThrow();
        expect(result).not.toBeNull();
        expect(result!.value).toBeUndefined();
        expect(result!.errorMessage).toMatch(/LookupKey/);
        expect(logger.findMessage('LookupKey', LoggingLevel.Error, LookupKeyCategory, 'DataTypeServices')).not.toBeNull();        
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
        
        supports(dataTypeLookupKey: string, cultureId: string): boolean {
            return this._supportedCultureIds.includes(cultureId);
        }
        format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
            return { value: `${cultureId} TestKey` };
        }
        
    }

    test('Lookup Key in DataTypeFormatter en', () => {
        let testItem = createDataTypeServicesWithManyCultures('en', true);
        testItem.registerFormatter(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey')).toEqual({ value: 'en TestKey' });
    });     
    test('Lookup Key in DataTypeFormatter en using fallback from en-GB', () => {
        let testItem = createDataTypeServicesWithManyCultures('en-GB', true);
        testItem.registerFormatter(new TestFormatter(['en'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey')).toEqual({ value: 'en TestKey' });
    });        
    test('Lookup Key in DataTypeFormatter en and en-GB gets from en-GB', () => {
        let testItem = createDataTypeServicesWithManyCultures('en-GB', true);
        testItem.registerFormatter(new TestFormatter(['en', 'en-GB'], 'EN TestKey'));
        expect(testItem.format(10, 'TestKey')).toEqual({ value: 'en-GB TestKey' });
    }); 
    test('Date to string using built-in Localization', () => {
        let testItem = createDataTypeServicesWithManyCultures('en', true);
        let date = new Date(2000, 0, 11);
        testItem.services.activeCultureId = 'en-GB';
        expect(testItem.format(date)).toEqual({ value: '11/01/2000' });
        testItem.services.activeCultureId = 'en';
        expect(testItem.format(date)).toEqual({ value: '1/11/2000' });
        testItem.services.activeCultureId = 'fr';
        expect(testItem.format(date)).toEqual({ value: '11/01/2000' });
    });    
    test('Number to string using built-in Localization', () => {
        let testItem = createDataTypeServicesWithManyCultures('en', true);
        let value = 4000.932;
        testItem.services.activeCultureId = 'en-GB';
        expect(testItem.format(value)).toEqual({ value: '4,000.932' });
        testItem.services.activeCultureId = 'en';
        expect(testItem.format(value)).toEqual({ value: '4,000.932' });
        testItem.services.activeCultureId = 'fr';
        expect(testItem.format(value)).toEqual({ value: '4\u{202F}000,932' });
    });        
    test('String to string using built-in Localization. Expect no changes', () => {
        let testItem = createDataTypeServicesWithManyCultures('en', true);
        let value = 'abcZYX';
        testItem.services.activeCultureId = 'en-GB';
        expect(testItem.format(value)).toEqual({ value: value });
        testItem.services.activeCultureId = 'en';
        expect(testItem.format(value)).toEqual({ value: value });
        testItem.services.activeCultureId = 'fr';
        expect(testItem.format(value)).toEqual({ value: value });
    });
    test('Lookup Key supplied not compatible with native data type error', () => {
        let testItem = createDataTypeServicesWithManyCultures('en', true);
        expect(testItem.format(10, LookupKey.Date).errorMessage).not.toBeUndefined();
        expect(testItem.format(10, LookupKey.Boolean).errorMessage).not.toBeUndefined();
        expect(testItem.format('10', LookupKey.Number).errorMessage).not.toBeUndefined();
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
        dataTypeLookupKey: string = "TEST";
        supportsValue(value: any): boolean {
            return value instanceof TestDataType;
        }
        
    }
    class TestComparer implements IDataTypeComparer
    {
        supportsValues(value1: any, value2: any): boolean {
            return value1 instanceof TestDataType ||
                value2 instanceof TestDataType;
        }
        compare(value1: any, value2: any): ComparersResult {
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
        expect(() => testItem.registerDataTypeComparer(null!)).toThrow(/comparer/);
    });
    test('New comparer that handles numbers with custom type and datatype lookup resolved by IDataTypeIdentifier', () => {

        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new TestIdentifier());
        expect(() => testItem.registerDataTypeComparer(new TestComparer())).not.toThrow();

        let test1 = new TestDataType("A", "B");
        let test2 = new TestDataType("A", "C");
        let test3 = new TestDataType("a", "c");        
        let test4 = new TestDataType("z", "y");

        expect(testItem.compareValues(test1, test1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(test2, test3, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(test3, test2, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(test1, test2, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compareValues(test2, test1, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compareValues(test1, test4, null, null)).toBe(ComparersResult.LessThan);
    });

    test('New comparer that handles numbers with custom type and datatype lookup resolved by LookupKey', () => {

        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new TestIdentifier());
        expect(() => testItem.registerDataTypeComparer(new TestComparer())).not.toThrow();

        let test1 = new TestDataType("A", "B");
        let test2 = new TestDataType("A", "C");
        let test3 = new TestDataType("a", "c");        
        let test4 = new TestDataType("z", "y");

        expect(testItem.compareValues(test1, test1, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(test2, test3, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(test3, test2, "TEST", "TEST")).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(test1, test2, "TEST", "TEST")).toBe(ComparersResult.LessThan);
        expect(testItem.compareValues(test2, test1, "TEST", "TEST")).toBe(ComparersResult.GreaterThan);
        expect(testItem.compareValues(test1, test4, "TEST", "TEST")).toBe(ComparersResult.LessThan);
    });
});
// CompareValues(value1: any, value2: any, lookupKey: string | null): ComparersResult
describe('DataTypeServices.CompareValues', () => {
    test('Number value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new NumberDataTypeIdentifier());
        expect(testItem.compareValues(0, 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(0, 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(1, 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compareValues(0, 1, null, null)).toBe(ComparersResult.LessThan);        
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
            dataTypeLookupKey: string = "TEST";
            supportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }
        }
        class TestConverter implements IDataTypeConverter
        {
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new NumberDataTypeIdentifier());
        testItem.registerDataTypeIdentifier(new SupportTestDataType());
        testItem.registerDataTypeConverter(new TestConverter());        

        expect(testItem.compareValues(new TestDataType(0), 0, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(new TestDataType(10), 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compareValues(new TestDataType(undefined!), 0, null, null)).toBe(ComparersResult.Undetermined);        
    });

    
    test('String value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new StringDataTypeIdentifier());
        expect(testItem.compareValues('A', 'A', null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues('B', 'A', null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compareValues('A', 'B', null, null)).toBe(ComparersResult.LessThan);        
    });    
    test('Boolean value resolves lookupKey and correctly handles comparisons', () => {
        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new BooleanDataTypeIdentifier());
        testItem.registerDataTypeComparer(new BooleanDataTypeComparer());
        expect(testItem.compareValues(true, true, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(false, true, null, null)).toBe(ComparersResult.NotEquals);
        expect(testItem.compareValues(true, false, null, null)).toBe(ComparersResult.NotEquals);        
    });       
     
    test('Date value resolves lookupKey and correctly handles comparisons', () => {
        let date1 = new Date(2000, 5, 31);
        let date2 = new Date(2000, 5, 30);
        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new DateDataTypeIdentifier());
        testItem.registerDataTypeConverter(new UTCDateOnlyConverter());

        expect(testItem.compareValues(date1, date1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date2, date1, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compareValues(date1, date2, null, null)).toBe(ComparersResult.GreaterThan);        
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
            dataTypeLookupKey: string = "TEST";
            supportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }
        }
        class TestConverter implements IDataTypeConverter
        {
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.DateValue;
            }
        }
        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new DateDataTypeIdentifier());
        testItem.registerDataTypeConverter(new UTCDateOnlyConverter());
        testItem.registerDataTypeIdentifier(new SupportTestDataType());
        testItem.registerDataTypeConverter(new TestConverter()); 
        
        let date1 = new TestDataType(new Date(2000, 5, 31));
        let date2 = new Date(2000, 5, 30);

        expect(testItem.compareValues(date1, date1, null, null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(date2, date1, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compareValues(date1, date2, null, null)).toBe(ComparersResult.GreaterThan);        
    });               
    
    test('Unsupported data type for lookupKey using JavaScript object logs error and reports Undetermined', () => {
        let testItem = new DataTypeServices();
        testItem.services = new MockValidationServices(true, true);
        let result: ComparersResult | null = null;
        expect(() => result = testItem.compareValues({}, 'A', null, null)).not.toThrow();
        expect(result).toBe(ComparersResult.Undetermined);
        let logger = testItem.services.loggerService as MockCapturingLogger;
        expect(logger.findMessage('operand', LoggingLevel.Error, CompareCategory, 'DataTypeServices')).not.toBeNull();        

    });    
    test('Unsupported data type for lookupKey using some class instance logs error and reports Undetermined', () => {
        let testItem = new DataTypeServices();
        testItem.services = new MockValidationServices(true, true);
        let result: ComparersResult | null = null;
        expect(() => result = testItem.compareValues(testItem /* some class */, 'A', null, null)).not.toThrow();
        expect(result).toBe(ComparersResult.Undetermined);
        let logger = testItem.services.loggerService as MockCapturingLogger;
        expect(logger.findMessage('operand', LoggingLevel.Error, CompareCategory, 'DataTypeServices')).not.toBeNull();        

    });    

    test('Fallback to DefaultComparer for unsupported lookupKey', () => {
        let testItem = new DataTypeServices();
        testItem.registerDataTypeIdentifier(new StringDataTypeIdentifier());

        expect(testItem.compareValues('A', 'A', 'Key1', null)).toBe(ComparersResult.Equals);
        expect(testItem.compareValues('A', 'a', 'Key1', null)).toBe(ComparersResult.LessThan);
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
            get value(): Date
            {
                return this._value;
            }
        }
        class HoldsDateIdentifier implements IDataTypeIdentifier
        {
            dataTypeLookupKey = "HoldsDate";
            supportsValue(value: any): boolean {
                return value instanceof HoldsDate;
            }
        }
        class HoldsDateConverter implements IDataTypeConverter
        {
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof HoldsDate && dataTypeLookupKey === "HoldsDate";
            }
            convert(value: HoldsDate, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.value;
            }
        }

        class DayOfWeekComparer implements IDataTypeComparer
        {
            supportsValues(value1: any, value2: any): boolean {
                return value1 instanceof Date && value2 instanceof Date;
            }
            compare(value1: any, value2: any): ComparersResult {
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
        testItem.registerDataTypeIdentifier(new HoldsDateIdentifier());
        testItem.registerDataTypeConverter(new HoldsDateConverter());
        testItem.registerDataTypeComparer(new DayOfWeekComparer());
        expect(testItem.compareValues(test1, test1, "HoldsDate", "HoldsDate")).toBe(ComparersResult.Equals);
        expect(testItem.compareValues(test1, test2, "HoldsDate", "HoldsDate")).toBe(ComparersResult.NotEquals);
        expect(testItem.compareValues(test2, test1, "HoldsDate", "HoldsDate")).toBe(ComparersResult.NotEquals);        
        expect(testItem.compareValues(test1, test3, "HoldsDate", "HoldsDate")).toBe(ComparersResult.Equals);
    });      
});
class TestCheckGenerator implements IDataTypeCheckGenerator {
    constructor(dataTypeLookupKey: string, returns: ICondition | null) {
        this.DataTypeLookupKey = dataTypeLookupKey;
        this.Returns = returns;
    }
    DataTypeLookupKey: string;
    Returns: ICondition | null;
    supportsValue(dataTypeLookupKey: string): boolean {
        return this.DataTypeLookupKey === dataTypeLookupKey;
    }
    createCondition(valueHost: IInputValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): ICondition | null {
        return this.Returns;
    }

}
describe('DataTypeServices.RegisterDataTypeCheckGenerator', () => {


    test('Invalid parameters', () => {
        let testItem = new DataTypeServices();
        expect(() => testItem.registerDataTypeCheckGenerator(null!)).toThrow(/checkGenerator/);
    });
    test('Register successful', () => {

        let testItem = new DataTypeServices();
        expect(() => testItem.registerDataTypeCheckGenerator(new TestCheckGenerator('ABC', null))).not.toThrow();
        expect(testItem.getDataTypeCheckGenerator('ABC')).not.toBeNull();
        expect(testItem.getDataTypeCheckGenerator('DEF')).toBeNull();
    });
});
describe('DataTypeServices.AutoGenerateDataTypeCondition', ()=> {
    test('Unregistered returns DataTypeCheckCondition', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Field1', LookupKey.String, 'label');
        let testItem = services.dataTypeServices;
        let condition: ICondition | null = null;

        expect(() => condition = testItem.autoGenerateDataTypeCondition(vh, 'ANYTHING')).not.toThrow();
        expect(condition).toBeInstanceOf(DataTypeCheckCondition);
        // really should test for the Descriptor.ValueHostId to be 'Field1'
        // and Type to be DataTypeCheck, but Descriptor is protected.
    });
    test('Registered with a class that returns a condition. Returns an instance of that condition for the same ValueHostId', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Field1', LookupKey.String, 'label');
        let testItem = services.dataTypeServices as DataTypeServices;
        let condition: ICondition | null = new RegExpCondition({
            type: ConditionType.RegExp,
            expressionAsString: 'test',
            valueHostId: vh.getId()
        });
        testItem.registerDataTypeCheckGenerator(new TestCheckGenerator('ABC', condition));

        expect(() => condition = testItem.autoGenerateDataTypeCondition(vh, 'ABC')).not.toThrow();
        expect(condition).toBeInstanceOf(RegExpCondition);
    });    
    test('Registered with a class that returns null. Returns null', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Field1', LookupKey.String, 'label');
        let testItem = services.dataTypeServices as DataTypeServices;
        let condition: ICondition | null = null;
        testItem.registerDataTypeCheckGenerator(new TestCheckGenerator('ABC', condition));

        expect(() => condition = testItem.autoGenerateDataTypeCondition(vh, 'ABC')).not.toThrow();
        expect(condition).toBeNull();
    });       
});
describe('DataTypeServices utility methods', () => {

    // IdentifyLookupKey(value: any): string
    test('IdentifyLookupKey', () => {
        let testItem = new DataTypeServices();
        registerDataTypeIdentifiers(testItem);
        expect(testItem.identifyLookupKey(0)).toBe(LookupKey.Number);
        expect(testItem.identifyLookupKey('abc')).toBe(LookupKey.String);
        expect(testItem.identifyLookupKey(false)).toBe(LookupKey.Boolean);
        expect(testItem.identifyLookupKey(new Date())).toBe(LookupKey.Date);
        expect(testItem.identifyLookupKey({})).toBeNull();
        expect(testItem.identifyLookupKey([])).toBeNull();
    });
    test('RegisterDataTypeIdentifier adds new item', () => {
        class TestDataType {}
        class TestIdentifier implements IDataTypeIdentifier
        {
            dataTypeLookupKey: string = 'TEST';
            supportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }

        }
        let testItem = new DataTypeServices();
        registerDataTypeIdentifiers(testItem);
        testItem.registerDataTypeIdentifier(new TestIdentifier());
        expect(testItem.identifyLookupKey(new TestDataType())).toBe('TEST');
        // confirm we didn't clobber the built in ones
        expect(testItem.identifyLookupKey(0)).toBe(LookupKey.Number);
        expect(testItem.identifyLookupKey('abc')).toBe(LookupKey.String);
        expect(testItem.identifyLookupKey(false)).toBe(LookupKey.Boolean);
        expect(testItem.identifyLookupKey(new Date())).toBe(LookupKey.Date);        
    });
    test('RegisterDataTypeIdentifier replaces existing item', () => {
        class TestDataType {}
        class TestIdentifier implements IDataTypeIdentifier
        {
            dataTypeLookupKey: string = LookupKey.Date;  // will replace Dates...
            supportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }

        }
        let testItem = new DataTypeServices();
        registerDataTypeIdentifiers(testItem);
        testItem.registerDataTypeIdentifier(new TestIdentifier());
        expect(testItem.identifyLookupKey(new TestDataType())).toBe(LookupKey.Date);
        expect(testItem.identifyLookupKey(new Date())).toBeNull();
        // confirm we didn't clobber the built in ones
        expect(testItem.identifyLookupKey(0)).toBe(LookupKey.Number);
        expect(testItem.identifyLookupKey('abc')).toBe(LookupKey.String);
        expect(testItem.identifyLookupKey(false)).toBe(LookupKey.Boolean);

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
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        let testItem = new DataTypeServices();
        testItem.registerDataTypeConverter(new TestConverter());
        let result = testItem.getDataTypeConverter(new TestDataType(10), null);
        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(TestConverter);
        expect(result?.convert(new TestDataType(500), "")).toBe(500);
  
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

        let result = testItem.getDataTypeConverter(new TestDataType(10), null);
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
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        let testItem = new DataTypeServices();
        testItem.registerDataTypeConverter(new TestConverter());
        let result = testItem.getDataTypeConverter(new TestDataType2(), null);
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
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
            convert(value: TestDataType, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Quantity;
            }
        }
        class TestConverter2 implements IDataTypeConverter
        {
            supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
                return value instanceof TestDataType2;
            }
            convert(value: TestDataType2, dataTypeLookupKey: string): string | number | Date | null | undefined {
                return value.Message;
            }
        }
        let testItem = new DataTypeServices();
        testItem.registerDataTypeConverter(new TestConverter());
        testItem.registerDataTypeConverter(new TestConverter2());
        let result = testItem.getDataTypeConverter(new TestDataType(10), null);
        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(TestConverter);
        expect(result!.convert(new TestDataType(500), "")).toBe(500);
        let result2 = testItem.getDataTypeConverter(new TestDataType2("ABC"), null);
        expect(result2).not.toBeNull();
        expect(result2).toBeInstanceOf(TestConverter2);
        expect(result2!.convert(new TestDataType2("ZYX"), "")).toBe("ZYX");        
    });        
});
describe('Other functions in DataTypeServices', () => {
    test('UnregisterFormatter', () => {
        let testItem = new DataTypeServices();
        testItem.registerFormatter(new NumberFormatter());
        testItem.registerFormatter(new BooleanFormatter(LookupKey.Boolean));
        expect(testItem.unregisterFormatter(LookupKey.Number, 'en')).toBe(true);
        expect(testItem.unregisterFormatter(LookupKey.Number, 'en')).toBe(false);
        expect(testItem.unregisterFormatter(LookupKey.Boolean, 'en')).toBe(true);
        expect(testItem.unregisterFormatter(LookupKey.Boolean, 'en')).toBe(false);
    });
});
