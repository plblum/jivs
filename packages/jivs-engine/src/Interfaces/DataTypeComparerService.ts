/**
 * {@inheritDoc Services/Types/IDataTypeComparerService!IDataTypeComparerService:interface }
 * @module Services/Types/IDataTypeComparerService
 */

import { IDataTypeComparer } from "./DataTypeComparers";
import { IDataTypeServiceBase } from "./DataTypes";
import { IServicesAccessor } from "./ValidationServices";

/**
 * A service for changing the comparing two values
 * using {@link DataTypes/Types/IDataTypeComparer!IDataTypeComparer | IDataTypeComparer} instances.
 * 
 * Used by Conditions to compare two values when those values don't naturally work
 * with the JavaScript comparison operators. Due to the Converter's ability to prepare
 * most values for the default comparison function, these aren't often created.
 */
export interface IDataTypeComparerService extends IDataTypeServiceBase, IServicesAccessor {

    /**
     * Compares two values to see if they are equal or not.
     * 
     * It can return Equals and NotEquals for types that make no sense
     * to support greater than and less than.
     * 
     * Otherwise it returns Equals, LessThan, or GreaterThan.
     * When value types are a mismatch or not supported,
     * it returns Undetermined.
     * 
     * Also expect exceptions in some cases when invalid values are supplied.
     * If either value is null, it will either return Equals (both null)
     * or Undetermined.
     * 
     * Data Types will be convertered to make different types into
     * a common type, objects into numbers (Dates in particular),
     * and allow you to represent the value differently, such as getting
     * just the month from the Date object for comparison.
     * 
     * Conversions use implementations of {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter}.
     * There is a default comparison function used here, which knows
     * how to compare only numbers and strings. Most values can be converted
     * to numbers or strings and will be supported by a DataTypeConverter.
     * 
     * For example, a Date object.
     * If you need another way to convert - as Booleans do - you
     * can implement {@link DataTypes/Types/IDataTypeComparer!IDataTypeComparer | IDataTypeComparer}.
     * @param value1 
     * @param value2 
     * @param lookupKey1 - Identifies the IDataTypeConverter to use
     *   together with value1. 
     *   If null, the native data type of the value will be converted to a lookupKey
     *   when String, Number, Boolean, Date object, or any IDataTypeIdentifier that you have registered
     *   with the ValidationService.dataTypeIdentifierService.
     * @param lookupKey2 - Same idea as lookupKey1 but for value2.
     * @returns For incompatible values where they couldn't be converted to
     * something compatible, expect Undetermined.
     * 
     * For booleans and types where greater than and less then don't make sense,
     * expect Equals and Not Equals.
     * 
     * For the rest, expect Equals, GreaterThan and LessThan.
     */
    compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult;

    /**
     * Returns a comparer that supports both values or null if not.
     * @param value1 
     * @param value2 
     * @returns 
     */
    find(value1: any, value2: any): IDataTypeComparer | null;
}

/**
 * Result of the compare() function on both IDataTypeComparerservice and IDataTypeComparer.
 */
export enum ComparersResult {
    Equals,
    NotEquals,
    LessThan,
    GreaterThan,
    Undetermined
}
