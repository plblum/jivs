import { UTCDateOnlyConverter } from "../../src/DataTypes/DataTypeConverters";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
class TestDataType {
    constructor(quantity) {
        this.Quantity = quantity;
    }
}
class TestConverter {
    supportsValue(value, dataTypeLookupKey) {
        return value instanceof TestDataType;
    }
    convert(value, dataTypeLookupKey) {
        return value.Quantity;
    }
}
class TestDataType2 {
    constructor(message) {
        this.Message = message;
    }
}
class TestConverter2 {
    supportsValue(value, dataTypeLookupKey) {
        return value instanceof TestDataType2;
    }
    convert(value, dataTypeLookupKey) {
        return value.Message;
    }
}
class TestConverterToLowerCase {
    supportsValue(value, dataTypeLookupKey) {
        return dataTypeLookupKey === 'TEST' && typeof value === 'string';
    }
    convert(value, dataTypeLookupKey) {
        return value.toLowerCase();
    }
}
describe('DataTypeComparerService constructor, register, and find', () => {
    test('Confirm UTCDateOnlyConverter is preregistered', () => {
        let testItem = new DataTypeConverterService();
        expect(testItem.find(new Date(), null)).toBeInstanceOf(UTCDateOnlyConverter);
    });
    test('register and find matching only value', () => {
        let testItem = new DataTypeConverterService();
        testItem.register(new TestConverter());
        expect(testItem.find(new TestDataType(10), null)).toBeInstanceOf(TestConverter);
        expect(testItem.find(new TestDataType(10), 'Anything')).toBeInstanceOf(TestConverter);
    });
    test('register and find matching only values that are string and lookupKey = TEST', () => {
        let testItem = new DataTypeConverterService();
        testItem.register(new TestConverterToLowerCase());
        expect(testItem.find("ABC", "TEST")).toBeInstanceOf(TestConverterToLowerCase);
        expect(testItem.find("ABC", 'Anything')).toBeNull();
        expect(testItem.find(100, "TEST")).toBeNull();
    });
    test('find returns null when nothing is registered', () => {
        let testItem = new DataTypeConverterService();
        expect(testItem.find(new TestDataType(10), null)).toBeNull();
    });
    test('find returns null when there is a registration but its the wrong data type', () => {
        let testItem = new DataTypeConverterService();
        testItem.register(new TestConverter());
        expect(testItem.find(new TestDataType2(''), null)).toBeNull();
    });
});
describe('convert', () => {
    test('Convert all 3 registered test converters successfully', () => {
        let testItem = new DataTypeConverterService();
        testItem.register(new TestConverter());
        testItem.register(new TestConverter2());
        testItem.register(new TestConverterToLowerCase());
        expect(testItem.convert(new TestDataType(500), "")).toBe(500);
        expect(testItem.convert(new TestDataType2("ZYX"), "")).toBe("ZYX");
        expect(testItem.convert("ABC", "TEST")).toBe("abc");
    });
    test('With 2 converters registered, convert with data types not registered results in undefined', () => {
        let testItem = new DataTypeConverterService();
        expect(testItem.convert(new TestDataType(500), "")).toBeUndefined();
        expect(testItem.convert(new TestDataType2("ZYX"), "")).toBeUndefined();
        expect(testItem.convert(100, "")).toBeUndefined();
    });
    test('Attempt converting a string when data typelookup is not TEST returns undefined', () => {
        let testItem = new DataTypeConverterService();
        testItem.register(new TestConverterToLowerCase());
        expect(testItem.convert("ABC", "")).toBeUndefined();
        expect(testItem.convert("ABC", null)).toBeUndefined();
        expect(testItem.convert("ABC", "Anything")).toBeUndefined();
        expect(testItem.convert(100, "")).toBeUndefined();
    });
});
//# sourceMappingURL=DataTypeConverterService.test.js.map