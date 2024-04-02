import { BooleanDataTypeIdentifier, DateDataTypeIdentifier, NumberDataTypeIdentifier, StringDataTypeIdentifier } from "../../src/DataTypes/DataTypeIdentifiers";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
class TestDataType {
}
class TestIdentifier {
    constructor() {
        this.dataTypeLookupKey = 'TEST';
    }
    supportsValue(value) {
        return value instanceof TestDataType;
    }
}
describe('DataTypeIdentifierService register and find', () => {
    test('Confirms Number, Boolean, String, and Date are preinstalled', () => {
        let testItem = new DataTypeIdentifierService();
        expect(testItem.find(0)).toBeInstanceOf(NumberDataTypeIdentifier);
        expect(testItem.find(false)).toBeInstanceOf(BooleanDataTypeIdentifier);
        expect(testItem.find('abc')).toBeInstanceOf(StringDataTypeIdentifier);
        expect(testItem.find(new Date())).toBeInstanceOf(DateDataTypeIdentifier);
        expect(testItem.find({})).toBeNull();
        expect(testItem.find([])).toBeNull();
    });
    test('register adds new item', () => {
        let testItem = new DataTypeIdentifierService();
        testItem.register(new TestIdentifier());
        expect(testItem.identify(new TestDataType())).toBe('TEST');
        // confirm we didn't clobber the built in ones
        expect(testItem.identify(0)).toBe(LookupKey.Number);
        expect(testItem.identify(false)).toBe(LookupKey.Boolean);
    });
    test('register replaces existing item', () => {
        class TestDataType {
        }
        class TestIdentifier {
            constructor() {
                this.dataTypeLookupKey = LookupKey.Date; // will replace Dates...
            }
            supportsValue(value) {
                return value instanceof TestDataType;
            }
        }
        let testItem = new DataTypeIdentifierService();
        testItem.register(new TestIdentifier());
        expect(testItem.identify(new TestDataType())).toBe(LookupKey.Date);
        expect(testItem.identify(new Date())).toBeNull();
        // confirm we didn't clobber the built in ones
        expect(testItem.identify(0)).toBe(LookupKey.Number);
        expect(testItem.identify(false)).toBe(LookupKey.Boolean);
    });
});
describe('DataTypeIdentifierService.identify', () => {
    // IdentifyLookupKey(value: any): string
    test('identify', () => {
        let testItem = new DataTypeIdentifierService();
        testItem.register(new TestIdentifier());
        expect(testItem.identify(0)).toBe(LookupKey.Number);
        expect(testItem.identify('abc')).toBe(LookupKey.String);
        expect(testItem.identify(false)).toBe(LookupKey.Boolean);
        expect(testItem.identify(new Date())).toBe(LookupKey.Date);
        expect(testItem.identify(new TestDataType())).toBe('TEST');
        expect(testItem.identify({})).toBeNull();
        expect(testItem.identify([])).toBeNull();
    });
});
//# sourceMappingURL=DataTypeIdentifierService.test.js.map