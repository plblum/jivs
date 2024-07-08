/**
 * {@inheritDoc DataTypes/Types/IDataTypeConverter!IDataTypeConverter:interface }
 * @module DataTypes/Types/IDataTypeConverter
 */

import { SimpleValueType } from "./DataTypeConverterService";

/**
 * Provides conversion between a specific data type and another.
 * Each will support a value that is requested to be converted
 * and the dataType lookupKey that will be the resulting value.
 * 
 * Provides a way to include non-standard types in comparison Conditions
 * by taking the value in its non-standard type form and returning
 * another value that is either a primitive type or Date that already
 * has support by Conditions.
 * 
 * Consider these cases:
 * - A TimeSpan class represents a duration in days, hours, minutes and seconds.
 *   Use a Converter to return the total number of seconds.
 * - A RelativeDate class represents a Date calculated offset from Today
 *   by a number of days, weeks, months, and years. 
 *   Use a Converter to return a Date object with the realized date.
 * 
 * You can have several converters for the same non-standard type.
 * The Data Type Lookup key supplied on the ValueHost can be used to pick a specific one.
 * Register your implementation with ValidationServices.dataTypeConverterService.
 */
export interface IDataTypeConverter {
    /**
     * Determines if the value and lookupKey for the result should be handled by this class.
     * When true, convert() supports these parameters.
     * 
     * Let's suppose you want to convert a Date object into a number of days, without taking the time into account.
     * `supportsValue(value, LookupKey.Date, LookupKey.Number)` may be appropriate. However, LookupKey.Number
     * may be too broad, since you might want a converter that handles the number of hours or weeks.
     * In that case, create a LookupKey for those new cases, and expect the user to supply it
     * in conditionConfig.conversionLookupKey.
     * `supportsValue(value, LookupKey.Date, "Weeks");`
     * If you don't supply the second parameter, the value will be evaluated through a DataTypeIdentifier.
     * In the case of a Date object, it will be evaluated as a LookupKey.Date because that's what 
     * DateDataTypeIdentifier returns for a Date object.
     * 
     * ```ts
     * // supports a date object using LookupKey.Date or LocalDate
     * // and converts it to a number of days using resultLookupKey of LookupKey.Number 
     * // or to a number of weeks using resultLookupKey of "Weeks".
     * class DateToNumberConverter implements IDataTypeConverter {
     *   supportsValue(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean {
     *      if (value instanceof Date)
     *      {
     *        if (resultLookupKey !== LookupKey.Number && resultLookupKey !== "Weeks")
     *          return false;
     *        if (!sourceLookupKey)
     *          return true;
     *        if (sourceLookupKey === LookupKey.Date || sourceLookupKey === LookupKey.LocalDate)
     *          return true;
     *      }
     *      return false;  
     * }
     *  
     * let dateValue = new Date();
     * let converter = new DateToNumberConverter();
     * converter.supportsValue(dateValue, null, LookupKey.Number); // = true
     * converter.supportsValue(dateValue, LookupKey.Date, LookupKey.Number); // = true
     * converter.supportsValue(dateValue, LookupKey.LocalDate, LookupKey.Number); // = true
     * converter.supportsValue(dateValue, LookupKey.Date, "Weeks"); // = true
     * converter.supportsValue(dateValue, LookupKey.LocalDate, "Weeks"); // = true
     * converter.supportsValue(dateValue, LookupKey.TimeOfDay, LookupKey.Number); // = false
     * ```
     * 
     * Don't look for valid data within the object. The convert() function is responsible
     * for reporting invalid data in supported values.
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be. When handling conditions,
     * this is usually from conditionConfig.conversionLookupKey or secondConversionLookupKey.
     * @returns true when its own convert() method should handle the value.
      */
    canConvert(value: any, sourceLookupKey: string | null, resultLookupKey: string): boolean;
    /**
     * Perform the conversion of the value to the resultLookupKey.
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be. When handling conditions,
     * this is usually from conditionConfig.conversionLookupKey or secondConversionLookupKey.
     * @returns The converted value. If the value is not convertable, return undefined.
     */
    convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): any;

    /**
     * Identifies lookup keys that are the resulting value of the conversion supported.
     * supportsValue() will only return true with one of these keys in its resultLookupKey parameter.
     * While the actual data type output may be a number, string, boolean, or Date, do not use
     * those as lookup keys unless that is the preferred lookup key. 
     * Instead, use the LookupKey for the data type that the value represents.
     * For example, a Date object converted to a number of seconds should use LookupKey.TimeOfDay,
     * not LookupKey.Number. If you made it return LookupKey.Number, it would be ambiguous
     * with another converter that generically converts a Date to a number.
     */
    supportedResultLookupKeys(): Array<string>;

    /**
     * Identifies lookup keys that can be passed into the sourceLookupKey parameter 
     * of canConvert() to identify the value.
     * 
     * SourceLookupKey is used to distinguish between different types
     *  of values that can be derived from the same object.
     * If this class allows sourceLookupKey to be null, include
     * null in the array. When null, we are saying that this converter
     * is the default for the data type of the expected value.
     */
    supportedSourceLookupKeys(): Array<string | null>;

    /**
     * Determines if the value and sourceLookupKey for the result are supported by this class.
     * This is not enough to convert, because it doesn't specify the resultLookupKey.
     * Use canConvert() for that.
     * Instead, this is used to export the supportedResultLookupKeys as you work through a list of 
     * close matches.
     * @param value 
     * @param sourceLookupKey 
     */
    sourceIsCompatible(value: any, sourceLookupKey: string | null): boolean;
}
