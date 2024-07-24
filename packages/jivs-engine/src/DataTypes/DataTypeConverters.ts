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

export abstract class DataTypeConverterBase implements IDataTypeConverter
{
    /**
     * Determines if the lookupKey is supported for the resultLookupKey.
     * @param lookupKey 
     * @returns 
     */
    protected validResultDataTypeLookupKey(lookupKey: string): boolean {
        return this.supportedResultLookupKeys().includes(lookupKey);
    }

    /**
     * Determines if the lookupKey is supported for the sourceLookupKey.
     * @param lookupKey 
     * @returns 
     */
    protected validSourceLookupKey(lookupKey: string | null): boolean {
        return this.supportedSourceLookupKeys().includes(lookupKey);
    }
    /**
     * Determines if the value is supported for the conversion.
     * @param value 
     */
    protected abstract validValue(value: any): boolean;
//#region IDataTypeConverter
    public canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean
    {
        return this.validValue(value) &&
            this.validSourceLookupKey(sourceLookupKey) &&
            this.validResultDataTypeLookupKey(resultLookupKey);
    }
    public abstract convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): any;
    public abstract supportedResultLookupKeys(): Array<string>;
    public abstract supportedSourceLookupKeys(): Array<string | null>;
    public sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean
    {
        return this.validValue(value) && this.validSourceLookupKey(sourceLookupKey);
    }
//#endregion IDataTypeConverter   
}
/**
 * For string values to convert them into lowercase for case insensitive comparisons.
 * value - expected to be a string
 * resultLookupKey = "CaseInsensitive" or "Lowercase"
 * sourceLookupKey = null or "String"
 * 
 * Use in Conditions that offer the ConversionLookupKey property, assigned
 * to ConversionLookupKey and/or SecondValueConversionLookupKey.
 */
export class CaseInsensitiveStringConverter extends DataTypeConverterBase
{
    public convert(value: string, sourceLookupKey: string | null, resultLookupKey: string): any {
        return value.toLowerCase();
    }
    protected validValue(value: any): boolean {
        return typeof value === 'string';
    }
    public supportedSourceLookupKeys(): Array<string | null> {
        return [null, LookupKey.String, LookupKey.Lowercase, LookupKey.CaseInsensitive, LookupKey.Uppercase];
    }
    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Lowercase, LookupKey.CaseInsensitive];
    }

}

/**
 * For JavaScript Date objects to convert them into a number of milliseconds
 * using Date.getTime().
 * Date comparison doesn't work by using == and != in JavaScript.
 * Officially, you compare with getTime() results.
 * 
 * When this library compares Date objects, it expects this converter
 * to get involved so its DefaultComparer function has two numbers 
 * from which to work.
 * 
 * value - expected to be a Date object
 * sourceLookupKey = LookupKey.DateTime
 * resultLookupKey = "Number" or "Milliseconds"
 */
export class DateTimeConverter extends DataTypeConverterBase
{

    public convert(value: Date, sourceLookupKey: string | null, resultLookupKey: string): any {
        if (isNaN(value.getTime()))
            return undefined;
        return value.getTime();
    }
    protected validValue(value: any): boolean {
        return value instanceof Date;
    }
    public supportedSourceLookupKeys(): Array<string | null> {
        return [LookupKey.DateTime];
    }
    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.Milliseconds];
    }

}

/**
 * Converts a Date object into a total number of days since Jan 1, 1970 using UTC values.
 * It ignores the time of day part of the Date object.
 * This is used instead of Date.getTime which is a number of milliseconds
 * because total days is useful in other situations like difference between
 * two Date objects by date.
 * 
 * value - expected to be a Date object in UTC time
 * sourceLookupKey = either null or LookupKey.Date.
 * resultLookupKey = "Number" or "TotalDays"

 * It assumes the Date object is setup in UTC time.
 * This is automatically used when there is no dataTypeLookup key specified
 * and the value is a date.
 */
export class UTCDateOnlyConverter extends DataTypeConverterBase
{
    public convert(value: Date, sourceLookupKey: string | null, resultLookupKey: string): any {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
        return Math.floor(dateOnly.getTime() / 86400000);
    }
    public validValue(value: any): boolean {
        return value instanceof Date;
    }
    public supportedSourceLookupKeys(): (string | null)[] {
        return [null, LookupKey.Date];  
    }
    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.TotalDays];
    }

}
/**
 * Converts a Date object into a total number of days since Jan 1, 1970 using local date values.
 * It ignores the time of day part of the Date object.
 * This is used instead of Date.getTime which is a number of milliseconds
 * because total days is useful in other situations like difference between
 * two Date objects by date.
 * It assumes the Date object is setup in local time.
 * 
 * value - expected to be a Date object in local time
 * sourceLookupKey = LookupKey.LocalDate.
 * resultLookupKey = "Number" or "TotalDays"
 */
export class LocalDateOnlyConverter extends DataTypeConverterBase
{
    public convert(value: Date, sourceLookupKey: string | null, resultLookupKey: string): any {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(value.getFullYear(), value.getMonth(), value.getDate());
        return Math.floor(dateOnly.getTime() / 86400000);
    }
    public validValue(value: any): boolean {
        return value instanceof Date;
    }

    public supportedSourceLookupKeys(): (string | null)[] {
        return [LookupKey.LocalDate];
    }

    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.TotalDays];
    }
}

/**
 * For JavaScript Date objects to convert just the time of day into a number of minutes.
 * See also TimeOfDayHMSOnlyConverter.
 * It assumes the Date object is in UTC and returns a UTC date.
 * 
 * value - expected to be a Date object in UTC
 * sourceLookupKey = LookupKey.TimeOfDay
 * resultLookupKey = "Number" or "Minutes"
 */
export class TimeOfDayOnlyConverter extends DataTypeConverterBase
{
    public convert(value: Date, sourceLookupKey: string | null, resultLookupKey: string): any {
        if (isNaN(value.getTime()))
            return undefined;      
        return value.getUTCHours() * 60 + value.getUTCMinutes();
    }
    public validValue(value: any): boolean {
        return value instanceof Date;
    }
    public supportedSourceLookupKeys(): (string | null)[] {
        return [LookupKey.TimeOfDay];
    }
    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.Minutes];
    }
}
/**
 * For JavaScript Date objects to convert just the time of day into a number of seconds.
 * See also TimeOfDayOnlyConverter.
 * It assumes the Date object is in UTC and returns a UTC date.
 * 
 * value - expected to be a Date object in UTC
 * sourceLookupKey = LookupKey.TimeOfDayHMS
 * resultLookupKey = "Number" or "Seconds"
 */
export class TimeOfDayHMSOnlyConverter extends DataTypeConverterBase
{
    public convert(value: Date, sourceLookupKey: string | null, resultLookupKey: string): any {
        if (isNaN(value.getTime()))
            return undefined;      
        return value.getUTCHours() * 60 * 60 + value.getUTCMinutes() * 60 + value.getUTCSeconds();
    }

    public validValue(value: any): boolean {
        return value instanceof Date;
    }

    public supportedSourceLookupKeys(): (string | null)[] {
        return [LookupKey.TimeOfDayHMS];
    }

    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.Seconds];
    }
}
/**
 * For number values to be compared as a whole number, using Math.trunc.
 * DataTypeLookupKey = "Integer"
 * Use in Conditions that offer the ConversionLookupKey property, assigned
 * to ConversionLookupKey and/or SecondValueConversionLookupKey.
 * 
 * value - expected to be a number
 * resultLookupKey = "Integer"
 * sourceLookupKey = null, "Number", "Currency", "Percentage", "Percentage100" or  "Integer"
 */
export class IntegerConverter extends DataTypeConverterBase
{
    public convert(value: number, sourceLookupKey: string | null, resultLookupKey: string): any {
        if (isNaN(value))
            return undefined;
        if (sourceLookupKey === LookupKey.Percentage)
            value = value * 100;
        return Math.trunc(value);
    }
    public validValue(value: any): boolean {
        return typeof value === 'number';
    }   
    public supportedSourceLookupKeys(): (string | null)[] {
        return [null, LookupKey.Number, LookupKey.Currency, LookupKey.Percentage, LookupKey.Percentage100, LookupKey.Integer];
    }
    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Integer];
    }
}


/**
 * Converts a numeric string to a number.
 * 
 * Expects the string to be a culture neutral string that can 
 * be converted to a number. Only lead negative, digits and period allowed.
 * While parseFloat will be used, it may accept non-numeric strings
 * like "100abc"-> 100. We are more strict here.
 * 
 * An empty string will return undefined.
 * 
 * value - expected to be a string with any text including empty string.
 * However, only numeric strings will be converted.
 * Integers will have Math.trunc applied.
 * resultLookupKey = "Integer", "Number"
 * sourceLookupKey = null or "String"
 */
export class NumericStringToNumberConverter extends DataTypeConverterBase {

    /**
     * NOTE: We allow any string here, even empty strings.
     * Its up to the convert() function to reject non-numeric strings.
     * @param value 
     * @param sourceLookupKey 
     * @param resultLookupKey 
     * @returns 
     */
    public canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
        return super.canConvert(value, sourceLookupKey, resultLookupKey);
    }
    /**
     * Converts valid numeric strings and rejects non-valid ones.
     * @param value - The string value to convert.
     * @param sourceLookupKey - The source lookup key.
     * @param resultLookupKey - The result lookup key.
     * @returns The converted number value or undefined when it is not 
     * a valid numeric string. Empty string returns undefined.
     */
    public convert(value: string, sourceLookupKey: string | null, resultLookupKey: string): any {
        if (!this._regexp.test(value))
            return undefined;
        let num = parseFloat(value);
        if (isNaN(num))
            // istanbul ignore next // This is a safety check. regexp should have caught this. 
            return undefined;
        if (resultLookupKey === LookupKey.Integer)
            num = Math.trunc(num);
        return num;
    }
    private _regexp = /^-?\d+(\.\d+)?$/;

    /**
     * Checks if the given value is a valid string.
     * 
     * @param value - The value to check.
     * @returns A boolean indicating whether the value is a valid string.
     */
    public validValue(value: any): boolean {
        return typeof value === 'string';
    }

    /**
     * Returns the supported source lookup keys.
     * 
     * @returns An array of supported source lookup keys.
     */
    public supportedSourceLookupKeys(): (string | null)[] {
        return [null, LookupKey.String];
    }

    /**
     * Returns the supported result lookup keys.
     * 
     * @returns An array of supported result lookup keys.
     */
    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.Integer];
    }
}