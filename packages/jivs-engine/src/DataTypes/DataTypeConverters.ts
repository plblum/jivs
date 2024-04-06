/**
 * Concrete implementations of IDataTypeConverter, which assists comparisons to 
 * convert the native value into a number, date or string that is better
 * suited for comparison.
 * See IDataTypeConverter for an overview.
 * In these cases, we are handling standard data types of Date, string, and number
 * to reshape them. For example, there is a string conversion to a lowercase string
 * that is for case insensitive comparisons.
 * @module DataTypes/ConcreteClasses/DataTypeConverters
 */

import { IDataTypeConverter } from '../Interfaces/DataTypeConverters';
import { LookupKey } from './LookupKeys';
/**
 * For string values to convert them into lowercase for case insensitive comparisons.
 * DataTypeLookupKey = "CaseInsensitive" or "Lowercase"
 * Use in Conditions that offer the ConversionLookupKey property, assigned
 * to ConversionLookupKey and/or SecondValueConversionLookupKey.
 */
export class CaseInsensitiveStringConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === LookupKey.CaseInsensitive ||
            dataTypeLookupKey === LookupKey.Lowercase) &&
            typeof value === 'string';
    }
    public convert(value: string, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.toLowerCase();
    }
}

/**
 * For JavaScript Date objects to convert them into a number of milliseconds
 * using Date.getTime().
 * Date comparison doesn't work by using == and != in JavaScript.
 * Officially, you compare with getTime() results.
 * When this library compares Date objects, it expects this converter
 * to get involved so its DefaultComparer function has two numbers 
 * from which to work.
 * DataType LookupKey: "DateTime"
 */
export class DateTimeConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === LookupKey.DateTime) &&
            value instanceof Date;
    }
    public convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;
        return value.getTime();
    }
}

/**
 * Converts a Date object into a total number of days since Jan 1, 1970 using UTC values.
 * It ignores the time of day part of the Date object.
 * This is used instead of Date.getTime which is a number of milliseconds
 * because total days is useful in other situations like difference between
 * two Date objects by date.
 * DataType LookupKey: "Date".
 * It assumes the Date object is setup in UTC time.
 * This is automatically used when there is no dataTypeLookup key specified
 * and the value is a date.
 */
export class UTCDateOnlyConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (!dataTypeLookupKey || (dataTypeLookupKey === LookupKey.Date)) &&
            value instanceof Date;
    }
    public convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
        return Math.floor(dateOnly.getTime() / 86400000);
    }
}
/**
 * Converts a Date object into a total number of days since Jan 1, 1970 using local date values.
 * It ignores the time of day part of the Date object.
 * This is used instead of Date.getTime which is a number of milliseconds
 * because total days is useful in other situations like difference between
 * two Date objects by date.
 * It assumes the Date object is setup in local time.
 * DataType Lookup Key: "LocalDate"
 */
export class LocalDateOnlyConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === LookupKey.LocalDate) &&
            value instanceof Date;
    }
    public convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(value.getFullYear(), value.getMonth(), value.getDate());
        return Math.floor(dateOnly.getTime() / 86400000);
    }
}

/**
 * For JavaScript Date objects to convert just the time of day into a number of minutes.
 * See also TimeOfDayHMSOnlyConverter.
 * It assumes the Date object is in UTC and returns a UTC date.
 * DataType LookupKey: "TimeOfDay".
 */
export class TimeOfDayOnlyConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === LookupKey.TimeOfDay) &&
            value instanceof Date;
    }
    public convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;      
        return value.getUTCHours() * 60 + value.getUTCMinutes();
    }
}
/**
 * For JavaScript Date objects to convert just the time of day into a number of seconds.
 * See also TimeOfDayOnlyConverter.
 * It assumes the Date object is in UTC and returns a UTC date.
 * DataType LookupKey: "TimeOfDay".
 */
export class TimeOfDayHMSOnlyConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === LookupKey.TimeOfDayHMS) &&
            value instanceof Date;
    }
    public convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;      
        return value.getUTCHours() * 60 * 60 + value.getUTCMinutes() * 60 + value.getUTCSeconds();
    }
}
/**
 * For number values to be compared as a whole number, using Math.round.
 * DataTypeLookupKey = "Integer"
 * Use in Conditions that offer the ConversionLookupKey property, assigned
 * to ConversionLookupKey and/or SecondValueConversionLookupKey.
 */
export class IntegerConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === LookupKey.Integer) &&
            typeof value === 'number';
    }
    public convert(value: number, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return Math.round(value);
    }
}

/**
 * For Dates values to be compared by their total years since Jan 1, 1970
 * Its actually the same conversion as UTCDateOnlyConverter, just established
 * with another lookup key that is easier to understand for this purpose,
 * and UTCDateOnlyConverter is selected when there is no lookup key.
 * DataTypeLookupKey = "TotalDays"
 * Use in Conditions that offer the ConversionLookupKey property, assigned
 * to ConversionLookupKey and/or SecondValueConversionLookupKey.
 */
export class TotalDaysConverter extends UTCDateOnlyConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === LookupKey.TotalDays) &&
            value instanceof Date;
    }
}