/**
 * {@inheritDoc Services/Types/IDataTypeComparerService!IDataTypeComparerService:interface }
 * @module Services/Types/IDataTypeComparerService
 */

import { IDataTypeComparer } from "./DataTypeComparers";
import { IDataTypeService } from "./DataTypes";
import { IServicesAccessor } from "./Services";

/**
 * A service for changing the comparing two values
 * using {@link DataTypes/Types/IDataTypeComparer!IDataTypeComparer | IDataTypeComparer} instances.
 * 
 * Used by Conditions to compare two values when those values don't naturally work
 * with the JavaScript comparison operators. Due to the Converter's ability to prepare
 * most values for the default comparison function, these aren't often created.
 */
export interface IDataTypeComparerService extends IDataTypeService<IDataTypeComparer>, IServicesAccessor {

    /**
    * Compares two values, determining if they are equal, less than, or greater than each other.
    * 
    * This function is designed to handle a wide range of data types, offering flexibility in comparison
    * strategies based on the type and content of the values provided. It supports basic types directly
    * and offers a mechanism for comparing custom data types through converters and comparers.
    * 
    * - For boolean values and other types where comparison beyond equality doesn't apply, 
    *   it returns Equal or NotEqual.
    * - For numeric and string values, it returns Equals, LessThan, or GreaterThan.
    * - When types are mismatched or unsupported, it returns Undetermined.
    *   Exceptions may be thrown for invalid values or when necessary conversions fail.    
    * - Null values are treated specially, returning Equals if both are null, or Undetermined otherwise.
    * 
    * 
    * When using data types that you know don't naturally work with the above, we recommend
    * running them through the DataTypeConversionService first to change their data type and lookup key
    * to something that does.
    * ```ts
    * let convertedResult = services.dataTypeConverterService.convert(value, LookupKey.Integer);
    * if (convertedResult.failed)
    *    return ComparisonResult.Undetermined;
    * let comparisonResult = services.dataTypeComparerService.compare(convertedResult.value, 5, LookupKey.Integer, null);
    * ```
    * ## Condition objects
    * Many Condition objects use this compare() function, such as RangeCondition, EqualToValueCondition, etc.
    * They have these properties on their Config objects to provide conversion prior to comparision:
    * - conversionLookupKey
    * - secondConversionLookupKey
    * 
    * Some good examples of using conversionLookupKey and secondConversionLookupKey are:
    * - case insensitive matching (LookupKey.CaseInsensitive)
    * - rounding a number to an integer (LookupKey.Integer)
    * - just the Day or Month or any other number in a Date object (LookupKey.Day, LookupKey.Month)
    * - a calculated value derived from the value, like the total days represented by a Date object (LookupKey.TotalDays)
    * 
    * ## Comparison process
    * Comparison is performed as follows:
    * 1. Checks for a custom DataTypeComparer for the given values. This is rare but allows for specialized comparison logic.
    * 2. Utilizes a default comparer for strings and numbers, converting values as needed. Throws an exception if conversion fails.
    * 3. When provided, lookup keys influence comparison by specifying how to interpret the values 
    *    (e.g., comparing only the month of a date).
    *    If keys differ, attempts are made to align them through conversion before comparing.
    * 
    * ## Configuring with DataTypeComparers are DataTypeConverters
    * - The system is preconfigured to handle numbers and strings using a default comparer and
    *   booleans with the BooleanComparer. Create your own {@link DataTypes/Types/IDataTypeComparer!IDataTypeComparer | IDataTypeComparer} 
    *   for custom data types if the conversion solution below is not sufficient.
    * - Register {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter} instances 
    *   with the DataTypeConverterService to handle conversions between
    *   custom data types and base types, and between lookup keys, such as LookupKey.Date to LookupKey.Month
    *   with a custom DataTypeConverter.
    * - When you introduce a LookupKey that you know is compatible with another, register it with the LookupKeyFallbackService.
    *   We've preregistered all numeric lookup keys to fall back to LookupKey.Number
    *   and all string lookup keys to fall back to LookupKey.String.
    *   The compare() function will use this service to align lookup keys before comparing.
    * 
    * 
    * @param value1 The first value to compare.
    * @param value2 The second value to compare.
    * @param lookupKey1  A lookup key indicating how to interpret `value1` or null if no such hint is needed.
    * @param lookupKey2  A lookup key indicating how to interpret `value2` or null if no such hint is needed.
    * @returns The result of the comparison. The ComparersResult enum has these values:
    * Equal, NotEqual, LessThan, GreaterThan, Undetermined.
    * Expect booleans to report Equal or NotEqual, and other types to report Equals, LessThan, or GreaterThan.
    * Expect Undetermined when types are mismatched or unsupported.
     */
    compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult;

    /**
     * Returns a comparer that supports both values or null if not.
    * @param value1 The first value to compare.
    * @param value2 The second value to compare.
    * @param lookupKey1  A lookup key indicating how to interpret `value1` or null if no such hint is needed.
    * @param lookupKey2  A lookup key indicating how to interpret `value2` or null if no such hint is needed.
     * @returns 
     */
    find(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): IDataTypeComparer | null;
}

/**
 * Result of the compare() function on both IDataTypeComparerservice and IDataTypeComparer.
 */
export enum ComparersResult {
    Equal,
    NotEqual,
    LessThan,
    GreaterThan,
    Undetermined
}
