/**
 * {@inheritDoc DataTypes/Types/IDataTypeComparer!IDataTypeComparer:interface }
 * @module DataTypes/Types/IDataTypeComparer
 */

import { ComparersResult } from "./DataTypeComparerService";

/**
 * Class that compares two values to determine equality, less than, greater than.
 * Create classes for each data type that doesn't support the
 * ==, !=, <, > operators the desired way.
 * However, first consider using an IDataTypeConverter to convert
 * your data type into an integer, string, or date. Those will
 * be supported by the default comparer.
 * 
 * Register your implementation with ValidationServices.dataTypeComparerService.
 */
export interface IDataTypeComparer
{
/**
 * Determines if this Comparer supports the inputs.
 * Do not call compare() if this returns false.
 * @param value1 The first value to compare.
 * @param value2 The second value to compare.
 * @param lookupKey1  A lookup key indicating how to interpret `value1` or null if no such hint is needed.
 * @param lookupKey2  A lookup key indicating how to interpret `value2` or null if no such hint is needed.
 */    
    supportsValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): boolean;

    /**
     * Performs the comparison. It has 3 possible outcomes:
     * - Using Equal, LessThan and GreaterThan when both values can be compared
     *   relative to the other.
     * - Using Equal and NotEqual when the values don't make sense
     *   as LessThan or GreaterThan, such as with booleans.
     * - Using Undetermined when either of the values are not supported.
     * @param value1 
     * @param value2 
     * @param lookupKey1 
     * @param lookupKey2 
     */
    compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult;
}
