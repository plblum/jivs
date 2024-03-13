/**
 * Concrete implementations of IDataTypeIdentifiers.
 * Provides a way to associate any value with a datatype lookupkey based on its datatype.
 * This interface is implemented for number as "Number", Date as "Date",
 * Boolean as "Boolean", and String as "String".
 * Each instance is registered with the DataTypeServices using the 
 * RegisterDataType.
 * @module DataTypes/DataTypeIdentifiers
 */
import { IDataTypeIdentifier } from "../Interfaces/DataTypes";
import { BooleanLookupKey, DateLookupKey, NumberLookupKey, StringLookupKey } from "./LookupKeys";

/**
 * Identifies a value as a strings (typeof value === 'string'), and associates it
 * with the lookup key "String" (const StringLookupKey)
 */
export class StringDataTypeIdentifier implements IDataTypeIdentifier
{
    public get DataTypeLookupKey(): string
    {
        return StringLookupKey;
    }
    public SupportsValue(value: any): boolean {
        return typeof value === 'string';
    }
    
}
/**
 * Identifies a value as a number (typeof value === 'number'), and associates it
 * with the lookup key "Number" (const NumberLookupKey)
 */
export class NumberDataTypeIdentifier implements IDataTypeIdentifier
{
    public get DataTypeLookupKey(): string
    {
        return NumberLookupKey;
    }
    public SupportsValue(value: any): boolean {
        return typeof value === 'number';
    }
    
}

/**
 * Identifies a value as a boolean (typeof value === 'boolean'), and associates it
 * with the lookup key "Boolean" (const BooleanLookupKey)
 */
export class BooleanDataTypeIdentifier implements IDataTypeIdentifier
{
    public get DataTypeLookupKey(): string
    {
        return BooleanLookupKey;
    }
    public SupportsValue(value: any): boolean {
        return typeof value === 'boolean';
    }
    
}

/**
 * Identifies a value as a Date object (value instanceof Date), and associates it
 * with the lookup key "Date" (const DateLookupKey)
 * It uses the lookup key "Date" which only has the date part of date and time, 
 * not "DateTime" because the time part is less frequently used.
 * Explicitly specify a lookup key of "DateTime" if time is needed.
 */
export class DateDataTypeIdentifier implements IDataTypeIdentifier
{
    public get DataTypeLookupKey(): string
    {
        return DateLookupKey;
    }
    public SupportsValue(value: any): boolean {
        return value instanceof Date;
    }
    
}
