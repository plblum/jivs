import { IDataTypeIdentifier } from "../Interfaces/DataTypes";
import { BooleanLookupKey, DateLookupKey, NumberLookupKey, StringLookupKey } from "./LookupKeys";

/**
 * Identifies Strings, and uses the lookup key "String"
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
 * Identifies Numbers, and uses the lookup key "Number"
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
 * Identifies Booleans, and uses the lookup key "Boolean"
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
 * Identifies Strings, and uses the lookup key "Date"
 * not "DateTime" because the time part is less frequently used.
 * Date only uses the Date portion of a Date Time.
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
