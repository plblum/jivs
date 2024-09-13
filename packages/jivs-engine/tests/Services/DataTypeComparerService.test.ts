import { BooleanDataTypeComparer } from "../../src/DataTypes/DataTypeComparers";
import { CaseInsensitiveStringConverter, DateTimeConverter, IntegerConverter, UTCDateOnlyConverter } from "../../src/DataTypes/DataTypeConverters";
import { StringDataTypeIdentifier, BooleanDataTypeIdentifier } from "../../src/DataTypes/DataTypeIdentifiers";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ComparersResult } from "../../src/Interfaces/DataTypeComparerService";
import { IDataTypeComparer } from "../../src/Interfaces/DataTypeComparers";
import { SimpleValueType } from "../../src/Interfaces/DataTypeConverterService";
import { IDataTypeConverter } from "../../src/Interfaces/DataTypeConverters";
import { IDataTypeIdentifier } from "../../src/Interfaces/DataTypeIdentifier";
import { LoggingLevel, LoggingCategory } from "../../src/Interfaces/LoggerService";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";
import { DataTypeComparerService } from "../../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { InvalidTypeError } from "../../src/Utilities/ErrorHandling";
import { CapturingLogger } from "../../src/Support/CapturingLogger";
import { MockValidationServices } from "../TestSupport/mocks";

function setupServicesWithExtraLogging(): {
    services: MockValidationServices,
    testItem: DataTypeComparerService
} {
    let services = new MockValidationServices(false, true);
    let comparerService = new DataTypeComparerService();
    services.dataTypeComparerService = comparerService;
    comparerService.services = services;
    let logger = services.loggerService as CapturingLogger;
    logger.minLevel = LoggingLevel.Warn;
    logger.overrideMinLevelWhen({
        type: 'DataTypeComparerService', // basically silence Identityservice
    });
    logger.chainedLogger = new ConsoleLoggerService(LoggingLevel.Debug, null, true);

    return { services, testItem: comparerService };

}
describe('DataTypeComparerServices constructor and properties', () => {

    test('Constructor with no parameters', () => {
        let testItem = new DataTypeComparerService();
        expect(() => testItem.services).toThrow(/Assign/);
    });

    test('Attach Services returns the same instance', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new DataTypeComparerService();
        expect(() => testItem.services = services).not.toThrow();
        let x: any;
        expect(() => x = testItem.services).not.toThrow();
        expect(x).toBe(services);
    });
});
const TestLookupKey = 'TEST';
class TestDataType {
    constructor(firstName: string, lastName: string) {
        this.FirstName = firstName;
        this.LastName = lastName;
    }
    FirstName: string;
    LastName: string;
}
class TestIdentifier implements IDataTypeIdentifier {
    dataTypeLookupKey: string = TestLookupKey;
    supportsValue(value: any): boolean {
        return value instanceof TestDataType;
    }
    sampleValue(): any {
        return new TestDataType('A', 'B');
    }
    
}
class TestComparer implements IDataTypeComparer {
    supportsValues(value1: any, value2: any): boolean {
        return value1 instanceof TestDataType &&
            value2 instanceof TestDataType;
    }
    compare(value1: any, value2: any): ComparersResult {
        if (value1 instanceof TestDataType &&
            value2 instanceof TestDataType) {
            let fullName1 = (value1.FirstName + ' ' + value1.LastName).toLowerCase();
            let fullName2 = (value2.FirstName + ' ' + value2.LastName).toLowerCase();
            if (fullName1 === fullName2)
                return ComparersResult.Equal;
            if (fullName1 < fullName2)
                return ComparersResult.LessThan;
            return ComparersResult.GreaterThan;
        }
        return ComparersResult.NotEqual;
    }
}
class TestTypeToStringConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return value instanceof TestDataType && resultLookupKey === LookupKey.String;
    }
    convert(value: TestDataType, sourceLookupKey: string | null, resultLookupKey: string): any {
        return value.FirstName + ' ' + value.LastName;
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.String];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [null, TestLookupKey];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return value instanceof TestDataType;
    }
}
describe('DataTypeComparerServices.register and find', () => {
    test('confirm BooleanDataTypeComparer is preregistered', () => {
        let testItem = new DataTypeComparerService();
        expect(testItem.find(true, false, null, null)).toBeInstanceOf(BooleanDataTypeComparer);
        expect(testItem.find(true, false, LookupKey.Boolean, null)).toBeInstanceOf(BooleanDataTypeComparer);
        expect(testItem.find(true, false, null, LookupKey.Boolean)).toBeInstanceOf(BooleanDataTypeComparer);
    });    
    test('register and find registered returns the same Comparer class', () => {
        let testItem = new DataTypeComparerService();
        expect(() => testItem.register(new TestComparer())).not.toThrow();
        let item1 = new TestDataType('A', 'B');
        let item2 = new TestDataType('A', 'D');
        expect(testItem.find(item1, item2, null, null)).toBeInstanceOf(TestComparer);
    });
    test('find with unexpected values returns null', () => {
        let testItem = new DataTypeComparerService();
        let services = new MockValidationServices(false, true);
        services.dataTypeComparerService = testItem;

        expect(() => testItem.register(new TestComparer())).not.toThrow();

        expect(testItem.find(null, null, null, null)).toBeNull();
 // booleancomparer is preregistered:       expect(testItem.find(null, false)).toBeNull();
        expect(testItem.find(new Date(), 20, null, null)).toBeNull();
        expect(testItem.find("abc", 20, null, null)).toBeNull();        
    });    
    test('find with one expected value and the other not expected returns null', () => {
        let testItem = new DataTypeComparerService();
        let services = new MockValidationServices(false, true);
        services.dataTypeComparerService = testItem;

        expect(() => testItem.register(new TestComparer())).not.toThrow();
        let item1 = new TestDataType('A', 'B');
        expect(testItem.find(item1, null, null, null)).toBeNull(); 
        expect(testItem.find(null, item1, null, null)).toBeNull(); 
        expect(testItem.find(item1, 20, null, null)).toBeNull(); 
      
    });    
    test('register and find', () => {
        let testItem = new DataTypeComparerService();
        let services = new MockValidationServices(false, true);
        services.dataTypeComparerService = testItem;

        let item1 = new TestDataType('A', 'B');
        let item2 = new TestDataType('A', 'D');
        expect(testItem.find(item1, item2, null, null)).toBeNull();
        testItem.register(new TestComparer());
        expect(testItem.find(item1, item2, null, null)).toBeInstanceOf(TestComparer);
    });

    test('Invalid parameters', () => {
        let testItem = new DataTypeComparerService();
        expect(() => testItem.register(null!)).toThrow(/item/);
    });
});
describe('DataTypeComparerServices compare with custom classes', ()=>{
    test('Custom comparer with datatype lookup resolved by IDataTypeIdentifier', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;


        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new TestIdentifier());
        expect(() => testItem.register(new TestComparer())).not.toThrow();

        let test1 = new TestDataType("A", "B");
        let test2 = new TestDataType("A", "C");
        let test3 = new TestDataType("a", "c");        
        let test4 = new TestDataType("z", "y");

        expect(testItem.compare(test1, test1, null, null)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using TestComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info, LoggingCategory.Result)).toBeTruthy();


        expect(testItem.compare(test2, test3, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(test3, test2, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(test1, test2, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(test2, test1, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(test1, test4, null, null)).toBe(ComparersResult.LessThan);

        // same but using LookupKeys
        logger.clearAll();
        expect(testItem.compare(test1, test1, "TEST", "TEST")).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using TestComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info, LoggingCategory.Result)).toBeTruthy();

        expect(testItem.compare(test2, test3, "TEST", "TEST")).toBe(ComparersResult.Equal);
        expect(testItem.compare(test3, test2, "TEST", "TEST")).toBe(ComparersResult.Equal);
        expect(testItem.compare(test1, test2, "TEST", "TEST")).toBe(ComparersResult.LessThan);
        expect(testItem.compare(test2, test1, "TEST", "TEST")).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(test1, test4, "TEST", "TEST")).toBe(ComparersResult.LessThan);    
        
        expect(testItem.compare(test1, test1, null, "TEST")).toBe(ComparersResult.Equal);
        expect(testItem.compare(test1, test1, "TEST", null)).toBe(ComparersResult.Equal);

    });


    test('Custom comparer for a custom type throws an error when one of the values is not that type', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;


        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new TestIdentifier());
        expect(() => testItem.register(new TestComparer())).not.toThrow();

        let test1 = new TestDataType("A", "B");

        expect(() => testItem.compare(test1, new Date(), null, null)).toThrow(InvalidTypeError);
        expect(logger.findMessage('"TEST" into "Number"', LoggingLevel.Warn, LoggingCategory.Result)).toBeTruthy();
        expect(logger.findMessage('"TEST" into "String"', LoggingLevel.Warn, LoggingCategory.Result)).toBeTruthy();
        expect(logger.findMessage('Compare failed', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();

        expect(() => testItem.compare(new Date(), test1, null, null)).toThrow(InvalidTypeError);
    });
    
    test('Custom comparer for custom type that works with another of type LookupKey.String when a converter is present', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new TestIdentifier());
        expect(() => testItem.register(new TestComparer())).not.toThrow();
        let dtcs = setup.services.dataTypeConverterService as DataTypeConverterService;
        dtcs.register(new TestTypeToStringConverter());

        let test1 = new TestDataType("A", "B"); // forms full name of "A B" which can be compared to a string
        
        expect(testItem.compare(test1, "A B", null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare("A B", test1, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(test1, "A B", null, LookupKey.String)).toBe(ComparersResult.Equal);
        expect(testItem.compare("A B", test1, LookupKey.String, null)).toBe(ComparersResult.Equal);

    });
    // same as previous except we need to use LookupKeyfallbackservice to get from LookupKey.Uppercase to LookupKey.string
    test('Custom comparer for custom type that works with another of type LookupKey.Uppercase when a converter is present', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new TestIdentifier());
        expect(() => testItem.register(new TestComparer())).not.toThrow();
        let dtcs = setup.services.dataTypeConverterService as DataTypeConverterService;
        dtcs.register(new TestTypeToStringConverter());

        let test1 = new TestDataType("A", "B"); // forms full name of "A B" which can be compared to a string
        
        expect(testItem.compare(test1, "A B", null, LookupKey.Uppercase)).toBe(ComparersResult.Equal);
        expect(testItem.compare("A B", test1, LookupKey.Uppercase, null)).toBe(ComparersResult.Equal);

    });

});
// compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult
describe('DataTypeComparerService.compare', () => {
    test('Either value has nulls returns Equal for both having or Undetermined otherwise', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

      
        expect(testItem.compare(null, null, null, null)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Has nulls', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();
        logger.clearAll();
        expect(testItem.compare(null, 10, null, null)).toBe(ComparersResult.Undetermined);
        expect(logger.findMessage('Has nulls', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Undetermined', LoggingLevel.Info)).toBeTruthy();        
        logger.clearAll();
        expect(testItem.compare(10, null, null, null)).toBe(ComparersResult.Undetermined);
        expect(logger.findMessage('Has nulls', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Undetermined', LoggingLevel.Info)).toBeTruthy();        

    });
    test('Either value has undefined returns Undetermined', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;
      
        expect(testItem.compare(undefined, undefined, null, null)).toBe(ComparersResult.Undetermined);
        expect(logger.findMessage('Has nulls', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Undetermined', LoggingLevel.Info)).toBeTruthy();
        logger.clearAll();
        expect(testItem.compare(undefined, 10, null, null)).toBe(ComparersResult.Undetermined);
        expect(logger.findMessage('Has nulls', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Undetermined', LoggingLevel.Info)).toBeTruthy();        
        logger.clearAll();
        expect(testItem.compare(10, undefined, null, null)).toBe(ComparersResult.Undetermined);
        expect(logger.findMessage('Has nulls', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Undetermined', LoggingLevel.Info)).toBeTruthy();        

    });    
    test('Number value resolves lookupKey and correctly handles comparisons', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

      
        expect(testItem.compare(0, 0, null, null)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using TestComparer', LoggingLevel.Debug, null)).toBeNull();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();

        expect(testItem.compare(0, 0, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(1, 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(0, 1, null, null)).toBe(ComparersResult.LessThan);        
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
            sampleValue() {
                return new TestDataType(0);
            }
        }
        class TestConverter implements IDataTypeConverter
        {
            canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
                return value instanceof TestDataType;
            }
            convert(value: TestDataType, sourceLookupKey: string | null, resultLookupKey: string): any {
                return value.Quantity;
            }
            supportedResultLookupKeys(): string[] {
                throw new Error("Method not implemented.");
            }
            supportedSourceLookupKeys(): (string | null)[] {
                throw new Error("Method not implemented.");
            }
            sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
           
        }
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;


        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;
        let dtic = setup.services.dataTypeConverterService as DataTypeConverterService;

        dtis.register(new SupportTestDataType());
        dtic.register(new TestConverter());        

        expect(testItem.compare(new TestDataType(0), 0, null, null)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using defaultComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();

        expect(testItem.compare(new TestDataType(10), 0, null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(new TestDataType(undefined!), 0, null, null)).toBe(ComparersResult.Undetermined);        
    });
    // lookup keys of integer and number are the same when it comes to value comparison
    // so the comparison should work with each supplied
    test('Number value resolves lookupKey and correctly handles comparisons', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;


        expect(testItem.compare(0, 0, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.Equal);
        expect(testItem.compare(1, 0, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(0, 1, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(0, 0.5, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(1, 0.5, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(1, 1.5, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.LessThan);

        expect(testItem.compare(0, 0, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.Equal);
        expect(testItem.compare(1, 0, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(0, 1, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(0.5, 0, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(0.5, 1, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(1.5, 1, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.GreaterThan);

    });
    // do the same but have the IntegerConverter registered to show it does not get involved
    test('With the IntegerConverter present, ensure it does not modify the values', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;


        let dtcs = setup.services.dataTypeConverterService as DataTypeConverterService;
        dtcs.register(new IntegerConverter());  // integer uses Math.trunc

        // despite the integer case having a decimal value, it should not be converted here
        expect(testItem.compare(0.5, 0.5, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.Equal);

        expect(testItem.compare(0, 0, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.Equal);
        expect(testItem.compare(1, 0, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(0, 1, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(0, 0.5, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(1, 0.5, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(1, 1.5, LookupKey.Integer, LookupKey.Number)).toBe(ComparersResult.LessThan);

        expect(testItem.compare(0, 0, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.Equal);
        expect(testItem.compare(1, 0, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(0, 1, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(0.5, 0, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare(0.5, 1, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(1.5, 1, LookupKey.Number, LookupKey.Integer)).toBe(ComparersResult.GreaterThan);
    });

    
    test('String value resolves lookupKey and correctly handles comparisons', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;

        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new StringDataTypeIdentifier());
        expect(testItem.compare('B', 'A', null, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare('A', 'A', null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare('A', 'B', null, null)).toBe(ComparersResult.LessThan);    

        expect(testItem.compare('B', 'A', LookupKey.String, null)).toBe(ComparersResult.GreaterThan);
        expect(testItem.compare('A', 'A', LookupKey.String, LookupKey.String)).toBe(ComparersResult.Equal);
        expect(testItem.compare('A', 'B', null, LookupKey.String)).toBe(ComparersResult.LessThan);
    });    
    test('String values with various non-string lookup keys show lookup keys have no meaning as they are only used to pick a comparer', () => {
        let services = new MockValidationServices(false, true);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = new DataTypeComparerService();
        services.dataTypeComparerService = testItem;
        testItem.services = services;

        let dtcs = services.dataTypeConverterService as DataTypeConverterService;
        dtcs.register(new CaseInsensitiveStringConverter());
        expect(testItem.compare("ABC", "abc", LookupKey.CaseInsensitive, LookupKey.CaseInsensitive)).toBe(ComparersResult.LessThan);
        expect(logger.findMessage('Using defaultComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: LessThan', LoggingLevel.Info)).toBeTruthy();

        expect(testItem.compare("ABC", "abc", LookupKey.String, LookupKey.CaseInsensitive)).toBe(ComparersResult.LessThan);
        expect(testItem.compare("abc", "ABC", null, LookupKey.CaseInsensitive)).toBe(ComparersResult.GreaterThan);
    });        
    test('Boolean value resolves lookupKey and correctly handles comparisons', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;

        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new BooleanDataTypeIdentifier());
        testItem.register(new BooleanDataTypeComparer());
        let logger = setup.services.loggerService as CapturingLogger;
        expect(testItem.compare(true, true, null, null)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using BooleanDataTypeComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();

        expect(testItem.compare(false, true, null, null)).toBe(ComparersResult.NotEqual);
        expect(testItem.compare(true, false, null, null)).toBe(ComparersResult.NotEqual);  

        logger.clearAll();  
        expect(testItem.compare(true, true, LookupKey.Boolean, LookupKey.Boolean)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using BooleanDataTypeComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();

        expect(testItem.compare(false, true, null, LookupKey.Boolean)).toBe(ComparersResult.NotEqual);
        expect(testItem.compare(true, false, LookupKey.Boolean, null)).toBe(ComparersResult.NotEqual);
    });       
    // boolean value with "Custom" as Lookup Key will only use the BooleanDataTypeComparer
    // if there is a LookupKeyFallbackService entry from Custom to Boolean.
    test('Boolean value with custom Lookup Keys will only use the BooleanDataTypeComparer if there is a LookupKeyFallbackService entry from Custom to Boolean', () => {
        // we'll use Custom1 and Custom2, where Custom1 has a fallback to boolean
        let setup = setupServicesWithExtraLogging();
        setup.services.lookupKeyFallbackService.register('Custom1', LookupKey.Boolean);
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;
        dtis.register(new BooleanDataTypeIdentifier());
        testItem.register(new BooleanDataTypeComparer());

        expect(testItem.compare(true, true, 'Custom1', 'Custom1')).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using BooleanDataTypeComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();

        logger.clearAll();
        expect(testItem.compare(true, true, LookupKey.Boolean, 'Custom1')).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using BooleanDataTypeComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();

        logger.clearAll();
        expect(testItem.compare(true, true, 'Custom1', LookupKey.Boolean)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using BooleanDataTypeComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();
        // now using Custom2, get not found errors
        logger.clearAll();
        expect(()=> testItem.compare(true, true, 'Custom2', 'Custom2')).toThrow(InvalidTypeError)
        expect(logger.findMessage('Compare failed.', LoggingLevel.Error)).toBeTruthy();

    });

    test('Passing booleans uses BooleanDataTypeComparer', () => {

        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

        testItem.register(new BooleanDataTypeComparer());

        expect(testItem.compare(true, true, LookupKey.Boolean, LookupKey.Boolean)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using BooleanDataTypeComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();

        expect(testItem.compare(true, true, null, null)).toBe(ComparersResult.Equal);       
        expect(testItem.compare(false, true, LookupKey.Boolean, LookupKey.Boolean)).toBe(ComparersResult.NotEqual);
        expect(testItem.compare(false, true, null, null)).toBe(ComparersResult.NotEqual);     
    });  
    test('Passing strings of "true" or "false" uses the defaultComparer because they are strings', () => {

        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

        testItem.register(new BooleanDataTypeComparer());

        expect(testItem.compare("true", "true", LookupKey.Boolean, LookupKey.Boolean)).toBe(ComparersResult.Equal);        
        expect(logger.findMessage('Using defaultComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info)).toBeTruthy();
     
    });      
    
    test('Date value resolves lookupKey and correctly handles comparisons', () => {
        let date1 = new Date(2000, 5, 31);
        let date2 = new Date(2000, 5, 30);
        let date3 = new Date(Date.UTC(2000, 10, 1));
        let date4 = new Date(Date.UTC(2000, 10, 1, 2, 3, 4));
        
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;

        let dtcs = setup.services.dataTypeConverterService as DataTypeConverterService;
        dtcs.register(new DateTimeConverter());
        dtcs.register(new UTCDateOnlyConverter());  // must be after other date converters as it handles any lookupKey=null on date objects

        expect(testItem.compare(date1, date1, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(date2, date1, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date1, date2, null, null)).toBe(ComparersResult.GreaterThan);   
        expect(testItem.compare(date4, date4, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(date2, date4, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date4, date2, null, null)).toBe(ComparersResult.GreaterThan);   

        expect(testItem.compare(date1, date1, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equal);
        expect(testItem.compare(date2, date1, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date1, date2, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.GreaterThan);   

        expect(testItem.compare(date4, date4, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equal);
        expect(testItem.compare(date2, date4, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date4, date2, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.GreaterThan);   

        expect(testItem.compare(date3, date3, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Equal);
        expect(testItem.compare(date3, date4, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date4, date3, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.GreaterThan);
        // these are due to the dataTypeComparerService.compare function itself
        expect(testItem.compare(null, null, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Equal);
        expect(testItem.compare(date1, null, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Undetermined);
        expect(testItem.compare(null, date2, LookupKey.Date, LookupKey.Date)).toBe(ComparersResult.Undetermined);
        expect(testItem.compare(null, null, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Equal);
        expect(testItem.compare(date3, null, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Undetermined);
        expect(testItem.compare(null, date4, LookupKey.DateTime, LookupKey.DateTime)).toBe(ComparersResult.Undetermined);
    });         
    
    test('value compares to custom class that has a IDataTypeConverter', () => {
        const testLookupKey = 'TEST';
        class TestDataType {
            constructor(dateValue: Date)
            {
                this.DateValue = dateValue;
            }
            DateValue: Date;
        }
        class SupportTestDataType implements IDataTypeIdentifier
        {
            dataTypeLookupKey: string = testLookupKey;
            supportsValue(value: any): boolean {
                return value instanceof TestDataType;
            }
            sampleValue() {
                return new TestDataType(new Date(2000, 1, 1));
            
            }
        }
        class TestConverter implements IDataTypeConverter
        {
            canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
                return this.sourceIsCompatible(value, sourceLookupKey) &&
                    this.supportedResultLookupKeys().includes(resultLookupKey);
            }
            convert(value: TestDataType, sourceLookupKey: string | null, resultLookupKey: string): any {
                return value.DateValue;
            }
            supportedResultLookupKeys(): string[] {
                return [LookupKey.Date, LookupKey.DateTime, LookupKey.LocalDate];
            }
            supportedSourceLookupKeys(): (string | null)[] {
                return [null, testLookupKey];
            }
            sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                return value instanceof TestDataType;
            }
        }
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;

        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;        
        let dtcs = setup.services.dataTypeConverterService as DataTypeConverterService;        

        dtis.register(new SupportTestDataType());
        dtcs.register(new TestConverter()); 
        dtcs.register(new UTCDateOnlyConverter());
        
        let date1 = new TestDataType(new Date(2000, 5, 31));
        let date2 = new Date(2000, 5, 30);

        expect(testItem.compare(date1, date1, null, null)).toBe(ComparersResult.Equal);
        expect(testItem.compare(date2, date1, null, null)).toBe(ComparersResult.LessThan);
        expect(testItem.compare(date1, date2, null, null)).toBe(ComparersResult.GreaterThan);        
    });               
    test('Logging tracked for valid value that results in successful request', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

        expect(testItem.compare(0, 0, null, null)).toBe(ComparersResult.Equal);
        expect(logger.findMessage('Using defaultComparer', LoggingLevel.Debug, null)).toBeTruthy();        
        expect(logger.findMessage('Comparison result: Equal', LoggingLevel.Info, LoggingCategory.Result)).toBeTruthy();        

    });

    test('Comparer throws a non-severe Error returns a value of Undetermined and logs', () => {
        class NonSevereErrorComparer implements IDataTypeComparer
        {
            supportsValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): boolean {
                return true;
            }
            compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult {
                throw new Error("Non-severe");
            }
        }
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

        testItem.register(new NonSevereErrorComparer());    

        expect(testItem.compare(1, 1, LookupKey.Number, LookupKey.Number)).toBe(ComparersResult.Undetermined);
        expect(logger.findMessage('Using NonSevereErrorComparer', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Non-severe', LoggingLevel.Error)).toBeTruthy();        

    });    
    test('Unsupported data type for lookupKey using JavaScript object logs error and throws', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

        let result: ComparersResult | null = null;
        expect(() => result = testItem.compare({}, 'A', null, null)).toThrow(/operand/);
        expect(logger.findMessage('operand', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy()      
        expect(logger.findMessage('Comparison result:', LoggingLevel.Info, null)).toBeNull();        

    });    
    test('Unsupported data type for lookupKey using some class instance logs error and throws', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let logger = setup.services.loggerService as CapturingLogger;

        let result: ComparersResult | null = null;
        expect(() => result = testItem.compare(testItem /* some class */, 'A', null, null)).toThrow(/operand/);
        expect(logger.findMessage('operand', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();    

    });    

    test('Fallback to DefaultComparer for unsupported lookupKey', () => {
        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;

        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;        

        dtis.register(new StringDataTypeIdentifier());

        expect(testItem.compare('A', 'A', 'Key1', null)).toBe(ComparersResult.Equal);
        expect(testItem.compare('A', 'a', 'Key1', null)).toBe(ComparersResult.LessThan);
    });          
    test('Compare with custom types that have a Comparer for their converted values', () => {
        const holdsDateLookupKey = 'HoldsDate';
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
            dataTypeLookupKey = holdsDateLookupKey;
            supportsValue(value: any): boolean {
                return value instanceof HoldsDate;
            }
            sampleValue() {
                return new HoldsDate(2000, 1, 1);
            }
        }

        class HoldsDateDayOfWeekComparer implements IDataTypeComparer
        {
            supportsValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): boolean {
                return value1 instanceof HoldsDate && value2 instanceof HoldsDate;
            }
            compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult {
                if (value1 instanceof HoldsDate && value2 instanceof HoldsDate)
                    return value1.value.getUTCDay() === value2.value.getUTCDay() ?
                        ComparersResult.Equal : ComparersResult.NotEqual;
                return ComparersResult.Undetermined;
            }
        }

        let test1 = new HoldsDate(2000, 1, 5);
        let test2 = new HoldsDate(2000, 1, 6);
        let test3 = new HoldsDate(2000, 1, 12);

        let setup = setupServicesWithExtraLogging();
        let testItem = setup.testItem;
        let dtis = setup.services.dataTypeIdentifierService as DataTypeIdentifierService;             
        let dtcmps = setup.services.dataTypeComparerService as DataTypeComparerService;        

        dtis.register(new HoldsDateIdentifier());
        dtcmps.register(new HoldsDateDayOfWeekComparer());

        expect(testItem.compare(test1, test1, holdsDateLookupKey, holdsDateLookupKey)).toBe(ComparersResult.Equal);
        expect(testItem.compare(test1, test2, holdsDateLookupKey, holdsDateLookupKey)).toBe(ComparersResult.NotEqual);
        expect(testItem.compare(test2, test1, holdsDateLookupKey, holdsDateLookupKey)).toBe(ComparersResult.NotEqual);        
        expect(testItem.compare(test1, test3, holdsDateLookupKey, holdsDateLookupKey)).toBe(ComparersResult.Equal);
    });      
});

describe('lazyLoad', () => {
    class NormalComparer implements IDataTypeComparer
    {
        supportsValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): boolean {
            return typeof value1 === 'number' && typeof value2 === 'number';
        }
        compare(value1: number, value2: number, lookupKey1: string | null, lookupKey2: string | null): ComparersResult {
            if (value1 === value2)
                return ComparersResult.Equal;
            else if (value1 < value2)
                return ComparersResult.LessThan;
            return ComparersResult.GreaterThan
        }
        
    }
    class LazyLoadComparer extends TestComparer { }
    test('Call to register does not lazy load', () => {
        let tls = new DataTypeComparerService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadComparer());
            loaded = true;
        };
        tls.register(new NormalComparer());
        expect(loaded).toBe(false);
    });
    test('Call to find for already registered does not lazy load', () => {
        let tls = new DataTypeComparerService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadComparer());
            loaded = true;
        };
        tls.register(new NormalComparer());
        expect(loaded).toBe(false);
        expect(tls.find(1, 2, null, null)).toBeInstanceOf(NormalComparer);  // looks for NumberComparer
        expect(loaded).toBe(false);
 
    });
    test('Call to find for unregistered does load but later find does not load for unregistered', () => {
        let tls = new DataTypeComparerService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadComparer());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(tls.find(new TestDataType('p', 'b'), new TestDataType('p', 'b'), null, null)).toBeInstanceOf(LazyLoadComparer);
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(tls.find(2, 3, null, null)).toBeNull();      // Number support not registered
        expect(loaded).toBe(false);
    });
    test('Call to find for unregistered does load but fails to load what it needs but has loaded one we use later', () => {
        let tls = new DataTypeComparerService();
        let loaded = false;
        tls.lazyLoad = (service) => {
            service.register(new LazyLoadComparer());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(tls.find(2, 3, null, null)).toBeNull();      // Number support not registered
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(tls.find(new TestDataType('p', 'b'), new TestDataType('p', 'b'), null, null)).toBeInstanceOf(LazyLoadComparer);
        expect(loaded).toBe(false);
    });    
});