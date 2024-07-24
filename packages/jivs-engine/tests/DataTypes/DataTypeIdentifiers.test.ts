import {
    StringDataTypeIdentifier, NumberDataTypeIdentifier, BooleanDataTypeIdentifier,
    DateDataTypeIdentifier
} from '../../src/DataTypes/DataTypeIdentifiers';
import { LookupKey } from '../../src/DataTypes/LookupKeys';

describe('DataTypeIdentifiers', () => {
    describe('StringDataTypeIdentifier', () => {
        const stringIdentifier = new StringDataTypeIdentifier();

        it('should return the correct dataTypeLookupKey', () => {
            expect(stringIdentifier.dataTypeLookupKey).toEqual(LookupKey.String);
        });

        it('should support string values', () => {
            expect(stringIdentifier.supportsValue('test')).toBe(true);
        });

        it('should not support non-string values', () => {
            expect(stringIdentifier.supportsValue(123)).toBe(false);
            expect(stringIdentifier.supportsValue(true)).toBe(false);
            expect(stringIdentifier.supportsValue(new Date())).toBe(false);
        });

        it('should provide a sample value', () => {
            expect(typeof stringIdentifier.sampleValue()).toBe('string');
        });
    });

    describe('NumberDataTypeIdentifier', () => {
        const numberIdentifier = new NumberDataTypeIdentifier();

        it('should return the correct dataTypeLookupKey', () => {
            expect(numberIdentifier.dataTypeLookupKey).toEqual(LookupKey.Number);
        });

        it('should support number values', () => {
            expect(numberIdentifier.supportsValue(123)).toBe(true);
        });

        it('should not support non-number values', () => {
            expect(numberIdentifier.supportsValue('test')).toBe(false);
            expect(numberIdentifier.supportsValue(true)).toBe(false);
            expect(numberIdentifier.supportsValue(new Date())).toBe(false);
        });

        it('should provide a sample value', () => {
            expect(typeof numberIdentifier.sampleValue()).toBe('number');
        });
    });

    describe('BooleanDataTypeIdentifier', () => {
        const booleanIdentifier = new BooleanDataTypeIdentifier();

        it('should return the correct dataTypeLookupKey', () => {
            expect(booleanIdentifier.dataTypeLookupKey).toEqual(LookupKey.Boolean);
        });

        it('should support boolean values', () => {
            expect(booleanIdentifier.supportsValue(true)).toBe(true);
            expect(booleanIdentifier.supportsValue(false)).toBe(true);
        });

        it('should not support non-boolean values', () => {
            expect(booleanIdentifier.supportsValue('test')).toBe(false);
            expect(booleanIdentifier.supportsValue(123)).toBe(false);
            expect(booleanIdentifier.supportsValue(new Date())).toBe(false);
        });

        it('should provide a sample value', () => {
            expect(typeof booleanIdentifier.sampleValue()).toBe('boolean');
        });
    });

    describe('DateDataTypeIdentifier', () => {
        const dateIdentifier = new DateDataTypeIdentifier();

        it('should return the correct dataTypeLookupKey', () => {
            expect(dateIdentifier.dataTypeLookupKey).toEqual(LookupKey.Date);
        });

        it('should support Date object values', () => {
            expect(dateIdentifier.supportsValue(new Date())).toBe(true);
        });

        it('should not support non-Date object values', () => {
            expect(dateIdentifier.supportsValue('test')).toBe(false);
            expect(dateIdentifier.supportsValue(123)).toBe(false);
            expect(dateIdentifier.supportsValue(true)).toBe(false);
        });

        it('should provide a sample value', () => {
            expect(dateIdentifier.sampleValue() instanceof Date).toBe(true);
        });
    });
});