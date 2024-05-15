/**
 * {@inheritDoc DataTypes/Types/IDataTypeConverter!IDataTypeConverter:interface }
 * @module DataTypes/Types/IDataTypeConverter
 */

import { SimpleValueType } from "./DataTypeConverterService";

/**
 * Provides a way to include non-standard types in comparison Conditions
 * by taking the value in its non-standard type form and returning
 * another value that is either a primitive type or Date that already
 * has support by Conditions.
 * Consider these cases:
 * - A TimeSpan class represents a duration in days, hours, minutes and seconds.
 *   Use a Converter to return the total number of seconds.
 * - A RelativeDate class represents a Date calculated offset from Today
 *   by a number of days, weeks, months, and years. 
 *   Use a Converter to return a Date object with the realized date.
 * You can have several converters for the same non-standard type.
 * The Data Type Lookup key supplied on the ValueHost can be used to pick a specific one.
 * Register your implementation with ValidationServices.dataTypeConverterService.
 */
export interface IDataTypeConverter
{
/**
 * Will be called to see if the value and DataType Lookup Key should be handled
 * by this class.
 * If the dataTypeLookupKey is null or '', evaluate the value itself,
 * such as checking its class (using 'instanceof') or for properties of an interface
 * that you are using.
 * Don't look for valid data within the object. The convert() function is responsible
 * for reporting invalid data in supported values.
 * @param value
 * @param dataTypeLookupKey
 * @returns true when its own convert() method should handle the value.
  */
    supportsValue(value: any, dataTypeLookupKey: string | null): boolean;
/**
 * Return the value based on the original value. It may be a new data type
 * of number, Date, or string.
 * It may be a reworking of the original value, such as a Date object
 * converted to a number of seconds, or a number rounded to an integer.
 * Return null if the value represents null.
 * Return undefined if the value was unconvertable.
 * @param value 
 * @param dataTypeLookupKey 
 */
    convert(value: any, dataTypeLookupKey: string): SimpleValueType;
}
