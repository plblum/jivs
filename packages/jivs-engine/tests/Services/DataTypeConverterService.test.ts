import { CapturingLogger } from './../TestSupport/CapturingLogger';
import { DataTypeIdentifierService } from './../../src/Services/DataTypeIdentifierService';
import { DateTimeConverter, LocalDateOnlyConverter, UTCDateOnlyConverter } from "../../src/DataTypes/DataTypeConverters";
import { IDataTypeConverter } from "../../src/Interfaces/DataTypeConverters";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IDataTypeIdentifier } from '../../src/Interfaces/DataTypeIdentifier';
import { LoggingCategory, LoggingLevel } from '../../src/Interfaces/LoggerService';
import { MockValidationServices } from '../TestSupport/mocks';
import { CodingError } from '../../src/Utilities/ErrorHandling';
import { ConversionResult, SimpleValueType } from '../../src/Interfaces/DataTypeConverterService';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConsoleLoggerService } from '../../src/Services/ConsoleLoggerService';


const testNumberLookupKey = 'TestNumber';
class TestDataTypeAsNumber {
    constructor(numericValue: number) {
        this.numericValue = numericValue;
    }
    numericValue: number;
}
class TestDataTypeAsNumberConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return value instanceof TestDataTypeAsNumber &&
            resultLookupKey === LookupKey.Number &&
            (!sourceLookupKey || sourceLookupKey === testNumberLookupKey);
    }
    convert(value: TestDataTypeAsNumber, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType {
        return value.numericValue;
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.Number];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [null, testNumberLookupKey];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return value instanceof TestDataTypeAsNumber &&
            (!sourceLookupKey || sourceLookupKey === testNumberLookupKey);
    }
}
class TestDataTypeAsNumberIdentifier implements IDataTypeIdentifier {
    dataTypeLookupKey: string = testNumberLookupKey;
    supportsValue(value: any): boolean {
        return value instanceof TestDataTypeAsNumber;
    }
}
const testStringLookupKey = 'TestString';
class TestDataTypeAsString {
    constructor(stringValue: string) {
        this.stringValue = stringValue;
    }
    stringValue: string;
}
class TestDataTypeAsStringConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return value instanceof TestDataTypeAsString &&
            resultLookupKey === LookupKey.String &&
            (!sourceLookupKey || sourceLookupKey === testStringLookupKey);
    }
    convert(value: TestDataTypeAsString, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType {
        return value.stringValue;
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.String];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [null, testStringLookupKey];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return value instanceof TestDataTypeAsString &&
            (!sourceLookupKey || sourceLookupKey === testStringLookupKey);
    }

}
class TestDataTypeAsStringIdentifier implements IDataTypeIdentifier {
    dataTypeLookupKey: string = testStringLookupKey;
    supportsValue(value: any): boolean {
        return value instanceof TestDataTypeAsString;
    }
}
const testDateLookupKey = 'TestDate';
class TestDataTypeAsDate {
    constructor(dateValue: Date) {
        this.dateValue = dateValue;
    }
    dateValue: Date;
}
class TestDataTypeAsDateConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return value instanceof TestDataTypeAsDate && (
            resultLookupKey === LookupKey.Date ||
            resultLookupKey === LookupKey.DateTime ||
            resultLookupKey === LookupKey.LocalDate) &&
            (!sourceLookupKey || sourceLookupKey === testDateLookupKey);
    }
    convert(value: TestDataTypeAsDate, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType {
        return value.dateValue;
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.Date, LookupKey.DateTime, LookupKey.LocalDate];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [null, testDateLookupKey];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return value instanceof TestDataTypeAsDate &&
            (!sourceLookupKey || sourceLookupKey === testDateLookupKey);
    }

}
class TestDataTypeAsDateIdentifier implements IDataTypeIdentifier {
    dataTypeLookupKey: string = testDateLookupKey;
    supportsValue(value: any): boolean {
        return value instanceof TestDataTypeAsDate;
    }
}

const testLowerCaseLookupKey = 'Test';
class TestConverterToLowerCase implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return typeof value === 'string' && sourceLookupKey === testLowerCaseLookupKey && resultLookupKey === LookupKey.String;
    }
    convert(value: string, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType {
        return value.toLowerCase();
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.String];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [testLowerCaseLookupKey];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return typeof value === 'string' && sourceLookupKey === testLowerCaseLookupKey;
    }
}

class TestAnyStringTypeToStringLookupKeyConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return typeof value === 'string' && resultLookupKey === LookupKey.String;
    }
    convert(value: string, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType {
        return value;
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.String];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [null, LookupKey.CaseInsensitive, LookupKey.Lowercase, LookupKey.Uppercase, LookupKey.String];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return typeof value === 'string';
    }

}

class TestConverterThatThrows implements IDataTypeConverter {
    constructor(error: Error) {
        this._error = error;
    }
    private _error: Error;
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return true;
    }
    convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType {
        throw this._error;
    }
    supportedResultLookupKeys(): string[] {
        return [];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return true;
    }
}
class TestAlwaysUndefinedValueConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return true;
    }
    convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType {
        return undefined;
    }
    supportedResultLookupKeys(): string[] {
        return [];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return true;
    }
}

class TestStringToNumberConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return typeof value === 'string' &&
            (!sourceLookupKey ||
                sourceLookupKey === LookupKey.String ||
                sourceLookupKey === LookupKey.Lowercase ||
                sourceLookupKey === LookupKey.Uppercase) &&
            resultLookupKey === LookupKey.Number;
    }
    convert(value: string, sourceLookupKey: string | null, resultLookupKey: string): any {
        let result = parseFloat(value);
        if (isNaN(result))
            return undefined;
        return result;
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.String];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [null, LookupKey.Lowercase, LookupKey.Uppercase, LookupKey.String];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return typeof value === 'string' &&
            (!sourceLookupKey ||
                sourceLookupKey === LookupKey.String ||
                sourceLookupKey === LookupKey.Lowercase ||
                sourceLookupKey === LookupKey.Uppercase);
    }
}

class TestNumberToStringConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return typeof value === 'number' && resultLookupKey === LookupKey.String;
    }
    convert(value: number, sourceLookupKey: string | null, resultLookupKey: string): any {
        return value.toString();
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.String];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [null, LookupKey.Number];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return typeof value === 'number' &&
            (!sourceLookupKey || sourceLookupKey === LookupKey.Number);
    }
}

const testDateTimeToNumberLookupKey = 'TestDateTimeToNumber';
class TestDateTimeToNumberConverter implements IDataTypeConverter {
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return value instanceof Date && (
            resultLookupKey === LookupKey.Milliseconds ||
            resultLookupKey === LookupKey.Number) &&
            (!sourceLookupKey ||
                sourceLookupKey === testDateTimeToNumberLookupKey ||
                sourceLookupKey === LookupKey.Date ||
                sourceLookupKey === LookupKey.DateTime ||
                sourceLookupKey === LookupKey.LocalDate
            );
    }
    convert(value: Date, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType {
        let result = value.getTime();
        if (isNaN(result))
            return undefined;
        return result;
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.Milliseconds];
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [null, testDateTimeToNumberLookupKey, LookupKey.Date, LookupKey.DateTime, LookupKey.LocalDate];
    }
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
        return value instanceof Date &&
            (!sourceLookupKey || sourceLookupKey === testDateTimeToNumberLookupKey);
    }

}
function resultValueReturned(testItem: DataTypeConverterService,
    result: ConversionResult, sourceLookupKey: string | null, resultLookupKey: string,
    expected: any, converterName: string) {

    expect(result).not.toBeNull();
    expect(result.resolvedValue).toBe(true);
    expect(result.value).toBe(expected);
    expect(result.converter).toBe(converterName);
    expect(result.error).toBeFalsy();
    expect(result.earlierResult).toBeFalsy(); // in convert, it is undefined. in convertUntilResult, it is null

    let logger = testItem.services.loggerService as CapturingLogger;
    expect(logger.findMessage('Using ' + converterName, LoggingLevel.Debug)).toBeTruthy();

    let msg = expected === null ? 'Converted to null' : `Converted to type "${resultLookupKey}"`;
    let logResult = logger.findMessage(msg, LoggingLevel.Info, LoggingCategory.Result);
    expect(logResult).toBeTruthy();
    expect(logResult!.data).toEqual(result);
}
function resultValueReturnedWithEarlierResults(testItem: DataTypeConverterService,
    result: ConversionResult, sourceLookupKey: string | null, resultLookupKey: string,
    expected: any, earlierResults: Array<Partial<ConversionResult>>) {

    expect(result).not.toBeNull();
    expect(result.resolvedValue).toBe(true);
    expect(result.value).toBe(expected);
    expect(result.converter).toBeUndefined();
    expect(result.error).toBeFalsy();
    let earlierResultsActual: Array<ConversionResult> = [];
    let last = result;
    while (last.earlierResult != null) { // null or undefined
        last = last.earlierResult;
        if (last) {
            earlierResultsActual.push(last);
        }
    }
    expect(earlierResultsActual.length).toBe(earlierResults.length);
    for (let i = 0; i < earlierResults.length; i++) {
        expect(earlierResultsActual[i]).toEqual(expect.objectContaining(earlierResults[i]));
    }


    let logger = testItem.services.loggerService as CapturingLogger;
    for (let i = 0; i < earlierResults.length; i++) {
        expect(logger.findMessage('Using ' + earlierResults[i].converter, LoggingLevel.Debug)).toBeTruthy();
    }
    let msg = expected === null ? 'Converted to null' : `Converted to type "${resultLookupKey}"`;
    let logResult = logger.findMessage(msg, LoggingLevel.Info, LoggingCategory.Result);
    expect(logResult).toBeTruthy();
    expect(logResult!.data).toEqual(result);
}
function resultNoConverterFound(testItem: DataTypeConverterService,
    result: ConversionResult, sourceLookupKey: string | null,
    resultLookupKey: string) {

    expect(result).not.toBeNull();
    expect(result.value).toBeUndefined();
    expect(result.converter).toBeUndefined();
    expect(result.error).toBeFalsy();
    expect(result.earlierResult).toBeUndefined();
    expect(result.resolvedValue).toBeFalsy();

    let logger = testItem.services.loggerService as CapturingLogger;
    let logResult = logger.findMessage(`Need a DataTypeConverter to convert`, LoggingLevel.Warn, LoggingCategory.Result);
    expect(logResult).toBeTruthy();
    expect(logResult!.message).toContain(`into "${resultLookupKey}"`);
    if (sourceLookupKey)
        expect(logResult?.message).toContain(`from "${sourceLookupKey}"`);
    expect(logResult!.data).toEqual(result);
}
function resultConverterFailed(testItem: DataTypeConverterService,
    result: ConversionResult, sourceLookupKey: string | null,
    resultLookupKey: string,
    converterName: string) {
    expect(result).not.toBeNull();
    expect(result.resolvedValue).toBe(true);
    expect(result.value).toBeUndefined();
    expect(result.converter).toBe(converterName);
    expect(result.error).toBeFalsy();
    expect(result.earlierResult).toBeFalsy(); // in convert, it is undefined. in convertUntilResult, it is null

    let logger = testItem.services.loggerService as CapturingLogger;
    let logResult = logger.findMessage(`Converter "${converterName}" failed to convert the value to "${resultLookupKey}"`, LoggingLevel.Warn, LoggingCategory.Result);
    expect(logResult).toBeTruthy();
    expect(logResult?.data).toEqual(result);
}
function resultConverterFailedWithEarlierResults(testItem: DataTypeConverterService,
    result: ConversionResult, sourceLookupKey: string | null,
    resultLookupKey: string, earlierResults: Array<Partial<ConversionResult>>) {
    expect(result).not.toBeNull();
    expect(result.resolvedValue).toBe(true);
    expect(result.value).toBeUndefined();
    expect(result.converter).toBeUndefined();
    expect(result.error).toBeFalsy();
    let earlierResultsActual: Array<ConversionResult> = [];
    let last = result;
    while (last.earlierResult != null) { // null or undefined
        last = last.earlierResult;
        if (last) {
            earlierResultsActual.push(last);
        }
    }
    expect(earlierResultsActual.length).toBe(earlierResults.length);
    for (let i = 0; i < earlierResults.length; i++) {
        expect(earlierResultsActual[i]).toEqual(expect.objectContaining(earlierResults[i]));
    }

    let logger = testItem.services.loggerService as CapturingLogger;
    let logResult = logger.findMessage(`Converter "${last.converter}" failed to convert the value to "${resultLookupKey}"`, LoggingLevel.Warn, LoggingCategory.Result);
    expect(logResult).toBeTruthy();
    expect(logResult?.data).toEqual(result);
}
function resultErrorThrown(testItem: DataTypeConverterService,
    result: ConversionResult, sourceLookupKey: string | null,
    resultLookupKey: string,
    converterName: string, error: Error) {
    expect(result).not.toBeNull();
    expect(result.value).toBeUndefined();
    expect(result.converter).toBe(converterName);
    expect(result.error).toBeInstanceOf(error.constructor);
    expect(result.earlierResult).toBeUndefined();
    expect(result.resolvedValue).toBeUndefined();

    let logger = testItem.services.loggerService as CapturingLogger;
    expect(logger.findMessage(`Using ${converterName}`, LoggingLevel.Debug)).toBeTruthy();
    let logResult = logger.findMessage(error.message, LoggingLevel.Error);
    expect(logResult).toBeTruthy();
    expect(logResult?.data).toEqual(result);
}
function resultValueSuppliedWasNullOrUndefined(testItem: DataTypeConverterService,
    result: ConversionResult, sourceLookupKey: string | null,
    resultLookupKey: string) {
    expect(result).not.toBeNull();
    expect(result.value == null).toBeTruthy();  // null or undefined
    expect(result.converter).toBeUndefined();
    expect(result.error).toBeFalsy();
    expect(result.earlierResult).toBeUndefined();
    expect(result.resolvedValue).toBe(true);

    let logger = testItem.services.loggerService as CapturingLogger;
    let logResult = logger.findMessage('Nothing to convert. The value is null or undefined.', LoggingLevel.Info, LoggingCategory.Result);
    expect(logResult).toBeTruthy();
    expect(logResult?.data).toEqual(result);
}

function setupDTCS(): DataTypeConverterService {
    let testItem = new DataTypeConverterService();
    testItem.services = new MockValidationServices(false, false);
    let logger = testItem.services.loggerService as CapturingLogger;
    logger.minLevel = LoggingLevel.Debug;
    logger.chainedLogger = new ConsoleLoggerService(logger.minLevel, undefined, true);
    return testItem;
}

describe('DataTypeComparerService constructor, register, and find', () => {

    test('register and find matching only value', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, false);
        testItem.register(new TestDataTypeAsNumberConverter());
        expect(testItem.find(new TestDataTypeAsNumber(10), null, LookupKey.Number)).toBeInstanceOf(TestDataTypeAsNumberConverter);
        expect(testItem.find(new TestDataTypeAsNumber(10), testNumberLookupKey, LookupKey.Number)).toBeInstanceOf(TestDataTypeAsNumberConverter);
        let result = testItem.compatibleSources(new TestDataTypeAsNumber(10), testNumberLookupKey);
        expect(result.length).toBe(1);
        expect(result[0]).toBeInstanceOf(TestDataTypeAsNumberConverter);
    });
    test('register and find matching only values that are string and lookupKey = TEST', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, false);
        testItem.register(new TestConverterToLowerCase());
        expect(testItem.find("ABC", testLowerCaseLookupKey, LookupKey.String)).toBeInstanceOf(TestConverterToLowerCase);
        expect(testItem.find("ABC", testLowerCaseLookupKey, LookupKey.Boolean)).toBeNull();
        expect(testItem.find(100, testLowerCaseLookupKey, LookupKey.String)).toBeNull();
        let result = testItem.compatibleSources("ABC", testLowerCaseLookupKey);
        expect(result.length).toBe(1);
        expect(result[0]).toBeInstanceOf(TestConverterToLowerCase);

    });
    test('find returns null when nothing is registered', () => {
        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, false);
        expect(testItem.find(new TestDataTypeAsNumber(10), null, LookupKey.Number)).toBeNull();
        let result = testItem.compatibleSources(new TestDataTypeAsNumber(10), null);
        expect(result.length).toBe(0);

    });
    test('find returns null when there is a registration but its the wrong data type', () => {

        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, false);
        testItem.register(new TestDataTypeAsNumberConverter());
        expect(testItem.find(new TestDataTypeAsString(''), null, LookupKey.Number)).toBeNull();
        let result = testItem.compatibleSources(new TestDataTypeAsString(''), null);
        expect(result.length).toBe(0);
    });
    test('compatibleSources returns a list of matches', () => {
        abstract class Base implements IDataTypeConverter {
            canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
                return true;
            }
            convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): any {
                return value;
            }
            supportedResultLookupKeys(): string[] {
                return [];
            }
            abstract supportedSourceLookupKeys(): (string | null)[];
            abstract sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean;
        }
        class Test1 extends Base {
            sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                return typeof value === 'boolean' &&
                    sourceLookupKey === 'Test1' || !sourceLookupKey;
            }
            supportedSourceLookupKeys(): (string | null)[] {
                return [null, 'Test1'];
            }
        }
        // This does not support null sourceLookupKey
        class Test2 extends Base {
            sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                return typeof value === 'boolean' && sourceLookupKey === 'Test1';
            }
            supportedSourceLookupKeys(): (string | null)[] {
                return ['Test1'];
            }
        }


        let testItem = new DataTypeConverterService();
        testItem.services = new MockValidationServices(false, false);
        testItem.register(new Test1());
        testItem.register(new Test2());
        testItem.register(new TestConverterToLowerCase());  // something unrelated
        let result = testItem.compatibleSources(true, null);
        expect(result.length).toBe(1);
        expect(result[0]).toBeInstanceOf(Test1);
        result = testItem.compatibleSources(true, 'Test1');
        expect(result.length).toBe(2);
        expect(result[0]).toBeInstanceOf(Test1);
        expect(result[1]).toBeInstanceOf(Test2);
    });
});
describe('convert() function', () => {
    function testValueReturned(testItem: DataTypeConverterService,
        value: any, sourceLookupKey: string | null, resultLookupKey: string,
        expected: any, converterName: string) {
        let logger = testItem.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        logger.clearAll();
        let result = testItem.convert(value, sourceLookupKey, resultLookupKey);
        resultValueReturned(testItem, result, sourceLookupKey, resultLookupKey, expected, converterName);
    }
    function testConverterNotFound(testItem: DataTypeConverterService,
        value: any, sourceLookupKey: string | null, resultLookupKey: string,) {
        let logger = testItem.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        logger.clearAll();
        let result = testItem.convert(value, sourceLookupKey, resultLookupKey);
        resultNoConverterFound(testItem, result, sourceLookupKey, resultLookupKey);
    }
    test('Simple test with 1 registered converter that converts string to number', () => {
        let testItem = setupDTCS();

        testItem.register(new TestStringToNumberConverter());
        testValueReturned(testItem, "100", "", LookupKey.Number, 100, 'TestStringToNumberConverter');
        testValueReturned(testItem, "100", LookupKey.String, LookupKey.Number, 100, 'TestStringToNumberConverter');
        testValueReturned(testItem, "100", LookupKey.Lowercase, LookupKey.Number, 100, 'TestStringToNumberConverter');
        testValueReturned(testItem, "100", LookupKey.Uppercase, LookupKey.Number, 100, 'TestStringToNumberConverter');
        testConverterNotFound(testItem, "ABC", "", LookupKey.Integer);
        testConverterNotFound(testItem, "ABC", LookupKey.String, LookupKey.Date);

    });
    test('Supply 4 converters and try various cases', () => {

        let testItem = setupDTCS();

        let dtis = testItem.services.dataTypeIdentifierService;
        dtis.register(new TestDataTypeAsNumberIdentifier());
        dtis.register(new TestDataTypeAsStringIdentifier());
        dtis.register(new TestDataTypeAsDateIdentifier());

        testItem.register(new TestDataTypeAsNumberConverter());
        testItem.register(new TestDataTypeAsStringConverter());
        testItem.register(new TestDataTypeAsDateConverter());
        testItem.register(new TestConverterToLowerCase());

        testValueReturned(testItem, new TestDataTypeAsNumber(500), "", LookupKey.Number, 500, 'TestDataTypeAsNumberConverter');
        testValueReturned(testItem, new TestDataTypeAsNumber(500), null, LookupKey.Number, 500, 'TestDataTypeAsNumberConverter');
        testValueReturned(testItem, new TestDataTypeAsNumber(500), testNumberLookupKey, LookupKey.Number, 500, 'TestDataTypeAsNumberConverter');
        testValueReturned(testItem, new TestDataTypeAsString("ZYX"), "", LookupKey.String, "ZYX", 'TestDataTypeAsStringConverter');
        testValueReturned(testItem, new TestDataTypeAsString("ZYX"), null, LookupKey.String, "ZYX", 'TestDataTypeAsStringConverter');
        testValueReturned(testItem, new TestDataTypeAsString("ZYX"), testStringLookupKey, LookupKey.String, "ZYX", 'TestDataTypeAsStringConverter');

        let date1 = new Date(2000, 0, 1);
        testValueReturned(testItem, new TestDataTypeAsDate(date1), "", LookupKey.Date, date1, 'TestDataTypeAsDateConverter');
        testValueReturned(testItem, new TestDataTypeAsDate(date1), null, LookupKey.Date, date1, 'TestDataTypeAsDateConverter');
        testValueReturned(testItem, new TestDataTypeAsDate(date1), testDateLookupKey, LookupKey.Date, date1, 'TestDataTypeAsDateConverter');
        testValueReturned(testItem, "ABC", testLowerCaseLookupKey, LookupKey.String, "abc", 'TestConverterToLowerCase');

        testConverterNotFound(testItem, new TestDataTypeAsNumber(500), "", LookupKey.Date);
        testConverterNotFound(testItem, new TestDataTypeAsNumber(500), null, LookupKey.Date);
        testConverterNotFound(testItem, new TestDataTypeAsNumber(500), LookupKey.Integer, LookupKey.Number);

        testConverterNotFound(testItem, new TestDataTypeAsString("ZYX"), "", LookupKey.Number);
        testConverterNotFound(testItem, new TestDataTypeAsString("ZYX"), null, LookupKey.Number);
        testConverterNotFound(testItem, new TestDataTypeAsString("ZYX"), LookupKey.Boolean, LookupKey.String);

        // no converters provided for these data types
        testConverterNotFound(testItem, 100, "", LookupKey.Number);
        testConverterNotFound(testItem, 100, null, LookupKey.Number);
        testConverterNotFound(testItem, 100, LookupKey.String, LookupKey.Number);

    });
    test('With none of the desired converters registered, reports converter not found', () => {

        let testItem = setupDTCS();
        let dtis = testItem.services.dataTypeIdentifierService;
        dtis.register(new TestDataTypeAsNumberIdentifier());
        dtis.register(new TestDataTypeAsStringIdentifier());
        dtis.register(new TestDataTypeAsDateIdentifier());

        testConverterNotFound(testItem, new TestDataTypeAsNumber(500), "", LookupKey.Number);
        testConverterNotFound(testItem, new TestDataTypeAsString("ZYX"), "", LookupKey.String);
        testConverterNotFound(testItem, 100, "", LookupKey.Number);
        testConverterNotFound(testItem, new TestDataTypeAsDate(new Date()), "", LookupKey.Date);

    });

    test('Converter that throws non-severe is handled by returning undefined and adding to the log.', () => {
        let services = new ValidationServices();
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Debug;
        services.loggerService = logger;
        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;
        testItem.register(new TestConverterThatThrows(new Error('test')));

        let result = testItem.convert("ABC", "", LookupKey.String);
        resultErrorThrown(testItem, result, "", LookupKey.String,
            'TestConverterThatThrows', new Error('test'));
    });

    test('Converter that throws severe is handled by throwing and adding to the log.', () => {
        let services = new ValidationServices();
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Debug;
        services.loggerService = logger;
        let testItem = new DataTypeConverterService();
        services.dataTypeConverterService = testItem;
        testItem.register(new TestConverterThatThrows(new CodingError('test')));

        expect(() => testItem.convert("ABC", "", LookupKey.String)).toThrow(/test/);

        expect(logger.findMessage('Using TestConverterThatThrows', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('test', LoggingLevel.Error)).toBeTruthy();
    });

    test('Converter returns a value of undefined. Reports convertername failed to convert', () => {
        let testItem = setupDTCS();

        testItem.register(new TestAlwaysUndefinedValueConverter());

        let result = testItem.convert("ABC", "", LookupKey.String);
        resultConverterFailed(testItem, result, "", LookupKey.String, 'TestAlwaysUndefinedValueConverter');
    });
    test('Converter passed null or undefined as a value reports Nothing to convert.', () => {
        let testItem = setupDTCS();

        testItem.register(new TestAnyStringTypeToStringLookupKeyConverter());

        let result = testItem.convert(null, "", LookupKey.String);
        resultValueSuppliedWasNullOrUndefined(testItem, result, "", LookupKey.String);

        let logger = testItem.services.loggerService as CapturingLogger;
        logger.clearAll();
        result = testItem.convert(undefined, "", LookupKey.String);
        resultValueSuppliedWasNullOrUndefined(testItem, result, "", LookupKey.String);
    });
});

describe('convertUntilResult', () => {
    function testValueReturned(testItem: DataTypeConverterService,
        value: any, sourceLookupKey: string | null, resultLookupKey: string,
        expected: any, converterName: string) {
        let logger = testItem.services.loggerService as CapturingLogger;

        logger.clearAll();
        let result = testItem.convertUntilResult(value, sourceLookupKey, resultLookupKey);
        resultValueReturned(testItem, result, sourceLookupKey, resultLookupKey, expected, converterName);
    }
    function testValueReturnedWithEarlierResults(testItem: DataTypeConverterService,
        value: any, sourceLookupKey: string | null, resultLookupKey: string,
        expected: any, earlierResults: Array<Partial<ConversionResult>>) {
        let logger = testItem.services.loggerService as CapturingLogger;

        logger.clearAll();
        let result = testItem.convertUntilResult(value, sourceLookupKey, resultLookupKey);
        resultValueReturnedWithEarlierResults(testItem, result, sourceLookupKey, resultLookupKey, expected, earlierResults);
    }
    function testConverterNotFound(testItem: DataTypeConverterService,
        value: any, sourceLookupKey: string | null, resultLookupKey: string,) {
        let logger = testItem.services.loggerService as CapturingLogger;

        logger.clearAll();
        let result = testItem.convertUntilResult(value, sourceLookupKey, resultLookupKey);
        resultNoConverterFound(testItem, result, sourceLookupKey, resultLookupKey);
    }
    function testConversionFailed(testItem: DataTypeConverterService,
        value: any, sourceLookupKey: string | null,
        resultLookupKey: string,
        converterName: string) {
        let logger = testItem.services.loggerService as CapturingLogger;

        logger.clearAll();
        let result = testItem.convertUntilResult(value, sourceLookupKey, resultLookupKey);
        resultConverterFailed(testItem, result, sourceLookupKey, resultLookupKey, converterName);
    }
    function testConversionFailedWithEarlierResults(testItem: DataTypeConverterService,
        value: any, sourceLookupKey: string | null,
        resultLookupKey: string,
        earlierResults: Array<Partial<ConversionResult>>) {
        let logger = testItem.services.loggerService as CapturingLogger;

        logger.clearAll();
        let result = testItem.convertUntilResult(value, sourceLookupKey, resultLookupKey);
        resultConverterFailedWithEarlierResults(testItem, result, sourceLookupKey, resultLookupKey, earlierResults);
    }
    class TestLookupKeyConverter implements IDataTypeConverter {
        canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
            return sourceLookupKey != null;
        }
        convert(value: any, sourceLookupKey: string | null, resultLookupKey: string) {
            return value;
        }

        supportedResultLookupKeys(): string[] {
            return [];
        }
        supportedSourceLookupKeys(): (string | null)[] {
            return [null];
        }
        sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
            return true;
        }

    }
    describe('One step conversion tries', () => {
        test('One conversion step with a converter that can convert', () => {
            let testItem = setupDTCS();

            testItem.register(new TestDateTimeToNumberConverter());   // this is to be an intermediate between Date and Number

            let dateTime1 = new Date(2000, 0, 1);
            let expectedDate1Conversion = dateTime1.getTime();
            testValueReturned(testItem, dateTime1, testDateTimeToNumberLookupKey, LookupKey.Number, expectedDate1Conversion, 'TestDateTimeToNumberConverter');
            testValueReturned(testItem, dateTime1, testDateTimeToNumberLookupKey, LookupKey.Milliseconds, expectedDate1Conversion, 'TestDateTimeToNumberConverter');
            testValueReturned(testItem, dateTime1, null, LookupKey.Number, expectedDate1Conversion, 'TestDateTimeToNumberConverter');
        });

        test('One conversion step with a converter that cannot convert', () => {
            let testItem = setupDTCS();

            testItem.register(new TestDateTimeToNumberConverter());   // this is to be an intermediate between Date and Number

            let date1 = new Date(2000, 0, 1);
            testConverterNotFound(testItem, date1, testDateTimeToNumberLookupKey, 'Unknown');
            testConverterNotFound(testItem, date1, 'Unknown', testDateTimeToNumberLookupKey);
            testConverterNotFound(testItem, 100, testDateTimeToNumberLookupKey, LookupKey.Number);

        });
        test('One conversion step with a converter that is found but returns undefined (because date is invalid)', () => {
            let testItem = setupDTCS();

            testItem.register(new TestDateTimeToNumberConverter());   // this is to be an intermediate between Date and Number

            let date1 = new Date('invalid');    // effectively date1.getTime() = NaN
            testConversionFailed(testItem, date1, testDateTimeToNumberLookupKey, LookupKey.Number, 'TestDateTimeToNumberConverter');
        });
        test('Supply conversion cases that do not require intermediate converters and try various cases', () => {

            let testItem = setupDTCS();

            let dtis = testItem.services.dataTypeIdentifierService;
            dtis.register(new TestDataTypeAsNumberIdentifier());
            dtis.register(new TestDataTypeAsStringIdentifier());
            testConverterNotFound(testItem, new TestDataTypeAsNumber(500), 'Unknown', LookupKey.String);

            testItem.register(new TestDataTypeAsNumberConverter());
            testItem.register(new TestDataTypeAsStringConverter());

            testValueReturned(testItem, new TestDataTypeAsNumber(500), "", LookupKey.Number, 500, 'TestDataTypeAsNumberConverter');
            testValueReturned(testItem, new TestDataTypeAsNumber(500), null, LookupKey.Number, 500, 'TestDataTypeAsNumberConverter');
            testValueReturned(testItem, new TestDataTypeAsNumber(500), testNumberLookupKey, LookupKey.Number, 500, 'TestDataTypeAsNumberConverter');
            testValueReturned(testItem, new TestDataTypeAsString("ZYX"), "", LookupKey.String, "ZYX", 'TestDataTypeAsStringConverter');
            testValueReturned(testItem, new TestDataTypeAsString("ZYX"), null, LookupKey.String, "ZYX", 'TestDataTypeAsStringConverter');
            testValueReturned(testItem, new TestDataTypeAsString("ZYX"), testStringLookupKey, LookupKey.String, "ZYX", 'TestDataTypeAsStringConverter');

            testConverterNotFound(testItem, new TestDataTypeAsNumber(500), 'Unknown', LookupKey.String);
            testConverterNotFound(testItem, new TestDataTypeAsNumber(500), null, LookupKey.Boolean);
            testConverterNotFound(testItem, new TestDataTypeAsNumber(500), LookupKey.Integer, LookupKey.Number);

            testConverterNotFound(testItem, new TestDataTypeAsString("ZYX"), "", LookupKey.Number);
            testConverterNotFound(testItem, new TestDataTypeAsString("ZYX"), null, LookupKey.Number);
            testConverterNotFound(testItem, new TestDataTypeAsString("ZYX"), LookupKey.Boolean, LookupKey.String);

        });
        test('With none of the desired converters registered, convert results in undefined', () => {

            let testItem = setupDTCS();
            let dtis = testItem.services.dataTypeIdentifierService;
            dtis.register(new TestDataTypeAsNumberIdentifier());
            dtis.register(new TestDataTypeAsStringIdentifier());

            testConverterNotFound(testItem, new TestDataTypeAsNumber(500), "", LookupKey.Number);
            testConverterNotFound(testItem, new TestDataTypeAsString("ZYX"), "", LookupKey.String);
            testConverterNotFound(testItem, 100, "", LookupKey.Number);
        });
        test('Check values to primitive types, undefined, and null return the expected value', () => {
            let testItem = setupDTCS();
            testItem.register(new TestLookupKeyConverter());

            testValueReturned(testItem, 0, LookupKey.Number, LookupKey.Number, 0, 'TestLookupKeyConverter');
            testValueReturned(testItem, true, LookupKey.Boolean, LookupKey.Boolean, true, 'TestLookupKeyConverter');
            testValueReturned(testItem, 'text', LookupKey.String, LookupKey.String, 'text', 'TestLookupKeyConverter');
        });
    });

    describe('Error handling cases', () => {
        test('Converter that throws non-severe is handled by returning undefined and adding to the log.', () => {
            let services = new ValidationServices();
            services.dataTypeIdentifierService = new DataTypeIdentifierService();
            let logger = new CapturingLogger();
            logger.minLevel = LoggingLevel.Debug;
            services.loggerService = logger;
            let testItem = new DataTypeConverterService();
            services.dataTypeConverterService = testItem;
            testItem.register(new TestConverterThatThrows(new Error('test')));

            let result = testItem.convertUntilResult("ABC", "", LookupKey.String);
            resultErrorThrown(testItem, result, "", LookupKey.String,
                'TestConverterThatThrows', new Error('test'));
        });

        test('Converter that throws severe is handled by throwing and adding to the log.', () => {
            let services = new ValidationServices();
            services.dataTypeIdentifierService = new DataTypeIdentifierService();
            let logger = new CapturingLogger();
            logger.minLevel = LoggingLevel.Debug;
            services.loggerService = logger;
            let testItem = new DataTypeConverterService();
            services.dataTypeConverterService = testItem;
            testItem.register(new TestConverterThatThrows(new CodingError('test')));

            expect(() => testItem.convertUntilResult("ABC", "", LookupKey.String)).toThrow(/test/);

            expect(logger.findMessage('Using TestConverterThatThrows', LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage('test', LoggingLevel.Error)).toBeTruthy();
        });

        test('Pass in null returns value=null without any conversion', () => {
            let testItem = setupDTCS();
            testItem.register(new TestLookupKeyConverter());
            let result = testItem.convertUntilResult(null, LookupKey.Number, LookupKey.Number);
            resultValueSuppliedWasNullOrUndefined(testItem, result, LookupKey.Number, LookupKey.Number);
            let logger = testItem.services.loggerService as CapturingLogger;
            logger.clearAll();
            result = testItem.convertUntilResult(null, null, LookupKey.Number);
            resultValueSuppliedWasNullOrUndefined(testItem, result, null, LookupKey.Number);
        });
        test('Pass in undefined returns value=undefined without any conversion', () => {
            let testItem = setupDTCS();
            testItem.register(new TestLookupKeyConverter());
            let result = testItem.convertUntilResult(undefined, LookupKey.Number, LookupKey.Number);
            resultValueSuppliedWasNullOrUndefined(testItem, result, LookupKey.Number, LookupKey.Number);
            let logger = testItem.services.loggerService as CapturingLogger;
            logger.clearAll();
            result = testItem.convertUntilResult(undefined, null, LookupKey.Number);
            resultValueSuppliedWasNullOrUndefined(testItem, result, null, LookupKey.Number);
        });
    });

    describe('Intermediates', () => {
        test('Convert from TestDataTypeToDate to Number with intermediate', () => {

            let testItem = setupDTCS();
            let dtis = testItem.services.dataTypeIdentifierService;
            dtis.register(new TestDataTypeAsDateIdentifier());

            testItem.register(new TestDataTypeAsDateConverter());
            testItem.register(new TestDateTimeToNumberConverter());   // this is to be an intermediate between Date and Number

            let date1 = new Date(2000, 0, 1);
            let expectedDate1Conversion = date1.getTime();
            const expectedEarlierResults: Array<Partial<ConversionResult>> = [
                { value: date1, converter: 'TestDataTypeAsDateConverter', sourceLookupKey: null, resultLookupKey: LookupKey.Date },
                { value: expectedDate1Conversion, converter: 'TestDateTimeToNumberConverter', sourceLookupKey: LookupKey.Date, resultLookupKey: LookupKey.Number }
            ];

            testValueReturnedWithEarlierResults(testItem, new TestDataTypeAsDate(date1), null, LookupKey.Number, expectedDate1Conversion, expectedEarlierResults);
        });

        describe('Level2 to Level1 to Number with intermediates', () => {
            interface ILevel {
                getLowerLevel(): ILevel | null;
                getNumber(): number;
            }
            const level2LookupKey = 'Level2';
            class Level2 implements ILevel {
                getLowerLevel(): ILevel | null {
                    return new Level1();
                }
                getNumber(): number {
                    return 2;
                }

            }
            const level1LookupKey = 'Level1';
            class Level1 implements ILevel {
                getLowerLevel(): ILevel | null {
                    return null;
                }
                getNumber(): number {
                    return 1;
                }

            }
            class Level2Converter implements IDataTypeConverter {
                canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
                    return value instanceof Level2 && resultLookupKey === level1LookupKey;
                }
                convert(value: Level2, sourceLookupKey: string | null, resultLookupKey: string): any {
                    return value.getLowerLevel();
                }

                supportedResultLookupKeys(): string[] {
                    return [level1LookupKey];
                }
                supportedSourceLookupKeys(): (string | null)[] {
                    return [null];
                }
                sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                    return value instanceof Level2;
                }

            }
            class Level1Converter implements IDataTypeConverter {
                canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
                    return value instanceof Level1 && resultLookupKey === LookupKey.Number;
                }
                convert(value: Level1, sourceLookupKey: string | null, resultLookupKey: string): any {
                    return value.getNumber();
                }

                supportedResultLookupKeys(): string[] {
                    return [LookupKey.Number];
                }
                supportedSourceLookupKeys(): (string | null)[] {
                    return [null];
                }
                sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                    return value instanceof Level1;
                }

            }
            class Level2Identifier implements IDataTypeIdentifier {
                dataTypeLookupKey: string = level2LookupKey;
                supportsValue(value: any): boolean {
                    return value instanceof Level2;
                }
            }
            class Level1Identifier implements IDataTypeIdentifier {
                dataTypeLookupKey: string = level1LookupKey;
                supportsValue(value: any): boolean {
                    return value instanceof Level1;
                }
            }

            let testItem: DataTypeConverterService;
            beforeEach(() => {
                testItem = setupDTCS();
                let dtis = testItem.services.dataTypeIdentifierService;
                dtis.register(new Level2Identifier());
                dtis.register(new Level1Identifier());

                testItem.register(new Level2Converter());
                testItem.register(new Level1Converter());
            });
            test('Successful path Level2->Level1->number', () => {

                let level2 = new Level2();
                testValueReturnedWithEarlierResults(testItem, level2, null, LookupKey.Number, 1, [
                    {
                        value: level2,
                        converter: 'Level2Converter',
                        sourceLookupKey: null,
                        resultLookupKey: level1LookupKey
                    },
                    {
                        value: 1,
                        converter: 'Level1Converter',
                        sourceLookupKey: level1LookupKey,
                        resultLookupKey: LookupKey.Number
                    }]
                );
            });
            test('Level2->Level1->date fails because Level1 converts to a number', () => {
                let level2 = new Level2();
                testConverterNotFound(testItem, level2, null, LookupKey.Date);
            });
            test('With number to string converter available, Level2->Level1->number->string', () => {
                testItem.register(new TestNumberToStringConverter());
                let level2 = new Level2();
                let expectedEarlierResults: Array<Partial<ConversionResult>> = [
                    {
                        value: level2,
                        converter: 'Level2Converter',
                        sourceLookupKey: null,
                        resultLookupKey: level1LookupKey
                    },
                    {
                        value: 1,
                        converter: 'Level1Converter',
                        sourceLookupKey: level1LookupKey,
                        resultLookupKey: LookupKey.Number
                    },
                    {
                        value: '1',
                        converter: 'TestNumberToStringConverter',
                        sourceLookupKey: LookupKey.Number,
                        resultLookupKey: LookupKey.String
                    }
                ];
                testValueReturnedWithEarlierResults(testItem, level2, null, LookupKey.String, '1', expectedEarlierResults);
            });
            test('With number to string converter available, Level2->Level1->number->string fails because string is not supported', () => {
                let level2 = new Level2();
                testConverterNotFound(testItem, level2, null, LookupKey.String);
            });

        });

    });

    describe('Tree search of intermediates using the same converters and changing the resultLookupKey', () => {
        // need to have a tree of converters, where a converter has the child nodes in its supportsResultLookupKeys

        // our data will be a single character string that converts to another 
        // single character string.
        // Its constructor takes a map<string, Array<string>> to show the valid
        // inputs (keys of the map) and the valid result lookup keys (values of the map)

        class TestCharacterConverterOld implements IDataTypeConverter {

            constructor(keyToValueMap: Map<string, Array<string>>,
                alternateReturnValues?: Map<string, string | null | undefined> | null
            ) {
                this._map = keyToValueMap;
                this._alternateReturnValues = alternateReturnValues ?? null;
            }
            _map: Map<string, Array<string>>;
            _alternateReturnValues: Map<string, string | null | undefined> | null;

            canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
                return this.sourceIsCompatible(value, sourceLookupKey) &&
                    this._map.has(value!) &&
                    this._map.get(value!)!.includes(resultLookupKey);
            }
            convert(value: string, sourceLookupKey: string | null, resultLookupKey: string): any {
                if (this._alternateReturnValues?.has(value)) {
                    return this._alternateReturnValues!.get(value);
                }
                let resultValues = this._map.get(value);
                if (resultValues) {
                    return resultValues.find((v) => v === resultLookupKey);
                }
                return undefined;
            }

            supportedResultLookupKeys(): string[] {
                if (this._srlk === undefined) {
                    // create an array of non-duplicate values from the map
                    let result = new Array<string>();
                    this._map.forEach((values) => {
                        values.forEach((value) => {
                            if (!result.includes(value)) {
                                result.push(value);
                            }
                        });
                    });
                    this._srlk = result;
                }
                return this._srlk;
            }
            private _srlk: string[] | undefined = undefined;
            supportedSourceLookupKeys(): (string | null)[] {
                if (this._sslk === undefined) {
                    let list = Array.from(this._map.keys()) as Array<string | null>;
                    list.push(null);
                    this._sslk = list;
                }
                return this._sslk;
            }
            private _sslk: (string | null)[] | undefined = undefined;

            sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                return value.length === 1 && this.supportedSourceLookupKeys().includes(sourceLookupKey);
            }

        }

        /**
         * Converter designed to handle many cases by creating various instances.
         * Supply a single source value and a list of result lookup keys.
         * Source value also must be a legal lookup key.
         * Each conversion's value is either the same as the result lookup key
         * or a value supplied in the alternateReturnValues parameter
         * that is associated with the result lookup key.
         * In this converter, you must supply a source lookup key to the canConvert
         * function to match.
         */
        class TestCharacterConverter implements IDataTypeConverter {

            constructor(sourceValue: string,
                resultLookupKeys: Array<string>,
                alternateReturnValues?: Map<string, string | null | undefined> | null
            ) {
                this._sourceValue = sourceValue;
                this._sslk = [sourceValue];
                this._srlk = resultLookupKeys;
                this._alternateReturnValues = alternateReturnValues ?? null;
            }
            _sourceValue: string;
            _alternateReturnValues: Map<string, string | null | undefined> | null;

            canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
                return this.sourceIsCompatible(value, sourceLookupKey) &&
                    this.supportedResultLookupKeys().includes(resultLookupKey);
            }
            convert(value: string, sourceLookupKey: string | null, resultLookupKey: string): any {
                if (this._alternateReturnValues?.has(value)) {
                    return this._alternateReturnValues!.get(value);
                }
                return this.supportedResultLookupKeys().find((v) => v === resultLookupKey);
            }

            supportedResultLookupKeys(): string[] {
                return this._srlk;
            }
            private _srlk: string[];
            supportedSourceLookupKeys(): (string | null)[] {
                return this._sslk;
            }
            private _sslk: (string | null)[];

            sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
                return value.length === 1 && this.supportedSourceLookupKeys().includes(sourceLookupKey);
            }

        }
        class StringToSingleCharLookupKeyIdentifier implements IDataTypeIdentifier {
            constructor(lookupKey: string) {
                this.dataTypeLookupKey = lookupKey;
            }
            dataTypeLookupKey: string = '';
            supportsValue(value: any): boolean {
                return typeof value === 'string' && value === this.dataTypeLookupKey;
            }
        }

        // a->b->c
        test('Complex case of one converter that converts a->b->c', () => {
            let testItem = setupDTCS();

            testItem.register(new TestCharacterConverter('a', ['b']));
            testItem.register(new TestCharacterConverter('b', ['c']));

            testValueReturnedWithEarlierResults(testItem, 'a', 'a', 'c', 'c', [
                { value: 'b', converter: 'TestCharacterConverter', sourceLookupKey: 'a', resultLookupKey: 'b' },
                { value: 'c', converter: 'TestCharacterConverter', sourceLookupKey: 'b', resultLookupKey: 'c' }
            ]);

        });
        test('Complex case of one converter that converts a->c but no path from a to intermediate to c', () => {
            let testItem = setupDTCS();

            testItem.register(new TestCharacterConverter('a', ['d']));
            testItem.register(new TestCharacterConverter('b', ['c']));

            testConverterNotFound(testItem, 'a', 'a', 'c');
        });

        describe('Using a tree with many paths', () => {
            // a-> x, y, z
            // b-> o
            // x-> m, n, a  (there is an intentional loop with a here)
            // y-> n, o, q 
            // z-> o, p
            // m-> n
            // n-> o, p, x
            // o-> a, z, x
            // q-> r
            // r-> s (s has no further paths)
            function setupTree(alternativeValues?: Map<string, string | null | undefined>): DataTypeConverterService {
                let testItem = setupDTCS();

                testItem.register(new TestCharacterConverter('a', ['x', 'y', 'z'], alternativeValues));
                testItem.register(new TestCharacterConverter('b', ['o'], alternativeValues));
                testItem.register(new TestCharacterConverter('x', ['m', 'n', 'a'], alternativeValues));
                testItem.register(new TestCharacterConverter('y', ['n', 'o', 'q', 'j'], alternativeValues));
                testItem.register(new TestCharacterConverter('z', ['o', 'p'], alternativeValues));
                testItem.register(new TestCharacterConverter('m', ['n'], alternativeValues));
                testItem.register(new TestCharacterConverter('n', ['o', 'p', 'x'], alternativeValues));
                testItem.register(new TestCharacterConverter('q', ['r'], alternativeValues));
                testItem.register(new TestCharacterConverter('r', ['s'], alternativeValues));                // q will return null, j will return undefined. Both are dead-ends
                // s has no further paths
                // q will return null, j will return undefined. Both are dead-ends
                // s has no further paths

                let dtis = testItem.services.dataTypeIdentifierService;
                dtis.register(new StringToSingleCharLookupKeyIdentifier('a'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('x'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('y'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('z'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('m'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('n'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('o'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('p'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('q'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('r'));
                dtis.register(new StringToSingleCharLookupKeyIdentifier('s'));

                // consolelogger limited to type=DataTypeConverterService
                let logger = testItem.services.loggerService.chainedLogger as ConsoleLoggerService;
                logger.minLevel = LoggingLevel.Warn;
                logger.overrideMinLevelWhen({
                    type: 'DataTypeConverterService'
                });
                return testItem;
            }


            // Test a -> y
            test('Convert a->y will use a->y', () => {
                let testItem = setupTree();
                testValueReturned(testItem, 'a', 'a', 'y', 'y', 'TestCharacterConverter');
            });
            // Test a -> o
            // While the best path is a->y->o, it is not the first path used to solve this.
            // The first path will be returned: a->x->m->n->o
            test('Convert a->o will use a->x->m->n->o', () => {
                let testItem = setupTree();
                testValueReturnedWithEarlierResults(testItem, 'a', 'a', 'o', 'o', [
                    { value: 'x', converter: 'TestCharacterConverter', sourceLookupKey: 'a', resultLookupKey: 'x' },
                    { value: 'm', converter: 'TestCharacterConverter', sourceLookupKey: 'x', resultLookupKey: 'm' },
                    { value: 'n', converter: 'TestCharacterConverter', sourceLookupKey: 'm', resultLookupKey: 'n' },
                    { value: 'o', converter: 'TestCharacterConverter', sourceLookupKey: 'n', resultLookupKey: 'o' }
                ]);
            });
            // Test y->r
            // y -> n -> x -> a -> y -> q -> r
            test('Convert y->r will use many converters', () => {
                let testItem = setupTree();
                testValueReturnedWithEarlierResults(testItem, 'y', 'y', 'r', 'r', [
                    { value: 'n', converter: 'TestCharacterConverter', sourceLookupKey: 'y', resultLookupKey: 'n' },
                    { value: 'x', converter: 'TestCharacterConverter', sourceLookupKey: 'n', resultLookupKey: 'x' },
                    { value: 'a', converter: 'TestCharacterConverter', sourceLookupKey: 'x', resultLookupKey: 'a' },
                    { value: 'y', converter: 'TestCharacterConverter', sourceLookupKey: 'a', resultLookupKey: 'y' },
                    { value: 'q', converter: 'TestCharacterConverter', sourceLookupKey: 'y', resultLookupKey: 'q' },
                    { value: 'r', converter: 'TestCharacterConverter', sourceLookupKey: 'q', resultLookupKey: 'r' }

                ]);
            });

            // Test a->l, where l does not exist
            test('Convert a->l will return null', () => {
                let testItem = setupTree();
                testConverterNotFound(testItem, 'a', 'a', 'l');
            });

            // y->x returns null and is successful
            test('Convert y->x will use y -> n -> x with n returning null on the final step, which finishes with a result of null', () => {
                let testItem = setupTree(new Map([['n', null]]));
                testValueReturnedWithEarlierResults(testItem, 'y', 'y', 'x', null, [
                    { value: 'n', converter: 'TestCharacterConverter', sourceLookupKey: 'y', resultLookupKey: 'n' },
                    { value: null, converter: 'TestCharacterConverter', sourceLookupKey: 'n', resultLookupKey: 'x' }
                ]);

            });
            // y->x returns undefined and reports invalid value
            test('Convert y->x will use y -> n -> x with n returning undefined on the final step, which finishes with a result of undefined', () => {
                let testItem = setupTree(new Map([['n', undefined]]));
                testConversionFailedWithEarlierResults(
                    testItem, 'y', 'y', 'x', [
                    { value: 'n', converter: 'TestCharacterConverter', sourceLookupKey: 'y', resultLookupKey: 'n' },
                    { value: undefined, converter: 'TestCharacterConverter', sourceLookupKey: 'n', resultLookupKey: 'x' }
                ]);

            });
            // y->x where y returns null on the first step, preventing further conversion. 
            // The value is null and even though n returns x.
            test('Convert y->x will use y -> n -> x with y returning null on the first step. No converter is found. Result is without earlierResults', () => {
                let testItem = setupTree(new Map([['y', null]]));
                testValueReturned(testItem, 'y', 'y', 'x', null, 'TestCharacterConverter');

            });
            // a->o where a returns null on an intermediate step, stopping conversion with result of null
            test('Convert a->o will use a -> x -> m -> n with x returning null on the second step. No converter is found. Result is without earlierResults', () => {
                let testItem = setupTree(new Map([['x', null], ['m', null], ['n', null]]));
                testValueReturnedWithEarlierResults(testItem, 'a', 'a', 'o', null, [
                    { value: 'x', converter: 'TestCharacterConverter', sourceLookupKey: 'a', resultLookupKey: 'x' },
                    { value: null, converter: 'TestCharacterConverter', sourceLookupKey: 'x', resultLookupKey: 'm' }
                ]);

            });
            // b->z will use b->o->z and use the earlier resultLookupKey check to find z in the result lookup keys from o[x, y, z]
            test('Convert b->z will use b -> o -> z', () => {
                let testItem = setupDTCS();

                testItem.register(new TestCharacterConverter('b', ['o']));
                testItem.register(new TestCharacterConverter('o', ['x', 'y', 'z']));


                testValueReturnedWithEarlierResults(testItem, 'b', 'b', 'z', 'z', [
                    { value: 'o', converter: 'TestCharacterConverter', sourceLookupKey: 'b', resultLookupKey: 'o' },
                    { value: 'z', converter: 'TestCharacterConverter', sourceLookupKey: 'o', resultLookupKey: 'z' }
                ]);

            });
        });

    });

});
describe('lazyLoad', () => {
    class NormalConverter implements IDataTypeConverter {

        convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): any {
            throw new Error('Method not implemented.');
        }
        canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
            return sourceLookupKey === 'Normal';
        }
        supportedResultLookupKeys(): string[] {
            return [];
        }
        supportedSourceLookupKeys(): (string | null)[] {
            return ['Normal'];
        }
        sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
            return sourceLookupKey === 'Normal';
        }

    }
    class LazyLoadConverter implements IDataTypeConverter {
        canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
            return sourceLookupKey === 'LazyLoad';
        }
        convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): any {
            throw new Error('Method not implemented.');
        }

        supportedResultLookupKeys(): string[] {
            return [];
        }
        supportedSourceLookupKeys(): (string | null)[] {
            return ['LazyLoad'];
        }
        sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean {
            return sourceLookupKey === 'LazyLoad';

        }

    }
    test('Call to register does not lazy load', () => {
        let testItem = new DataTypeConverterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadConverter());
            loaded = true;
        };
        testItem.register(new NormalConverter());
        expect(loaded).toBe(false);
    });
    test('Call to find for already registered does not lazy load', () => {
        let testItem = new DataTypeConverterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadConverter());
            loaded = true;
        };
        testItem.register(new NormalConverter());
        expect(loaded).toBe(false);
        expect(testItem.find(0, 'Normal', LookupKey.Number)).toBeInstanceOf(NormalConverter);
        expect(loaded).toBe(false);

    });
    test('Call to find for unregistered does load but later find does not load for unregistered', () => {
        let testItem = new DataTypeConverterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadConverter());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.find(0, 'LazyLoad', LookupKey.Number)).toBeInstanceOf(LazyLoadConverter);
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.find(0, 'Normal', LookupKey.Number)).toBeNull();      // not registered
        expect(loaded).toBe(false);
    });
    test('Call to find for unregistered does load but fails to load what it needs but has loaded one we use later', () => {
        let testItem = new DataTypeConverterService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadConverter());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.find(0, 'Normal', LookupKey.Number)).toBeNull();      // not registered
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.find(0, 'LazyLoad', LookupKey.Number)).toBeInstanceOf(LazyLoadConverter);
        expect(loaded).toBe(false);
    });
});