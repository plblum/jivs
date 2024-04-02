/**
 * Concrete implementations of IDataTypeIdentifiers.
 * Provides a way to associate any value with a datatype lookupkey based on its datatype.
 * This interface is implemented for number as "Number", Date as "Date",
 * Boolean as "Boolean", and String as "String".
 * Each instance is registered with the dataTypeIdentifierService.
 * @module DataTypes/ConcreteClasses/DataTypeIdentifiers
 */
import { IDataTypeIdentifier } from '../Interfaces/DataTypeIdentifier';
import { LookupKey } from './LookupKeys';
/**
 * Identifies a value as a strings (typeof value === 'string'), and associates it
 * with the lookup key "String" (const LookupKey.String)
 */
export class StringDataTypeIdentifier implements IDataTypeIdentifier
{
    public get dataTypeLookupKey(): string
    {
        return LookupKey.String;
    }
    public supportsValue(value: any): boolean {
        return typeof value === 'string';
    }
    
}
/**
 * Identifies a value as a number (typeof value === 'number'), and associates it
 * with the lookup key "Number" (const LookupKey.Number)
 */
export class NumberDataTypeIdentifier implements IDataTypeIdentifier
{
    public get dataTypeLookupKey(): string
    {
        return LookupKey.Number;
    }
    public supportsValue(value: any): boolean {
        return typeof value === 'number';
    }
    
}

/**
 * Identifies a value as a boolean (typeof value === 'boolean'), and associates it
 * with the lookup key "Boolean" (const LookupKey.Boolean)
 */
export class BooleanDataTypeIdentifier implements IDataTypeIdentifier
{
    public get dataTypeLookupKey(): string
    {
        return LookupKey.Boolean;
    }
    public supportsValue(value: any): boolean {
        return typeof value === 'boolean';
    }
    
}

/**
 * Identifies a value as a Date object (value instanceof Date), and associates it
 * with the lookup key "Date" (const LookupKey.Date)
 * It uses the lookup key "Date" which only has the date part of date and time, 
 * not "DateTime" because the time part is less frequently used.
 * Explicitly specify a lookup key of "DateTime" if time is needed.
 */
export class DateDataTypeIdentifier implements IDataTypeIdentifier
{
    public get dataTypeLookupKey(): string
    {
        return LookupKey.Date;
    }
    public supportsValue(value: any): boolean {
        return value instanceof Date;
    }
    
}
