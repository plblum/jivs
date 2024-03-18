/**
 * @inheritDoc DataTypes/DataTypeServices!
 * @module DataTypes/Interfaces
 */

import { IServicesAccessor } from "./ValidationServices";

/**
 * DataTypeServices handles various data types of the values.
 * It provides:
 * - Conversion to formatted string for displaying a value to the user.
 *   Uses DataTypeLocalizations to localizing the formatted string.
 * - Comparing two same-type values for equals, not equals, less than, greater than.
 * This class is available on ValidationServices.DataTypeServices.
 */
export interface ICoreDataTypeServices
{

/**
 * Converts the native value to a string that can be shown to the user.
 * Result includes the successfully converted value
 * or validation error information.
 * @param value
 * @param lookupKey - If not supplied, a lookup key is created based on the native value type.
 * If you need alternative formatting or are supporting a user defined type,
 * always pass in the associated lookup key. They can be found in the LookupKeys module.
 * @returns successfully converted value or validation error information.
 */    
    Format(value: any, lookupKey?: string | null): DataTypeResolution<string>;
}

export interface IDataTypeServices extends ICoreDataTypeServices, IServicesAccessor
{
/**
 * Compares two same-type values to see if they are equal or not.
 * It can return Equals and NotEquals for types that make no sense
 * to support greater than and less than.
 * Otherwise it returns Equals, LessThan, or GreaterThan.
 * Expect exceptions when invalid values are supplied.
 * It identifies the ComparerHandler function
 * @param value1 
 * @param value2 
 * @param lookupKey1 - Identifies the IDataTypeConverter and/or ComparerHandler function to use
 *   together with value1. If null, the native data type of the value will be converted to a lookupKey
 *   when String, Number, Boolean, Date object, or any IDataTypeIdentifier that you have registered
 *   with the DataTypeServices.
 * @param lookupKey2 - Same idea as lookupKey1 but for value2.
 */    
    CompareValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult;
    
/**
 * When a value is supplied without a DataType Lookup Key, this resolves the
 * DataType Lookup Key. By default, it supports values of type number, boolean,
 * string and Date object.
 * You can add your own data types by implementing IDataTypeIdentifier
 * and registered you class with the DataTypeServices.
 * @param value 
 */
    IdentifyLookupKey(value: any): string | null;    
}

/**
 * Result from a method that can deliver either a value or an error in
 * attempting to generate that value.
 */
export interface DataTypeResolution<T>
{
    /**
     * If assigned, it is the resolved value.
     * If undefined, the value failed to resolve and the ErrorMessage is setup.
     */
    Value?: T;
    /**
     * If assigned, the value failed to resolve and this is a description of what happened.
     */
    ErrorMessage?: string;
}


/**
 * Provides a way to associate any value with a datatype lookupkey based on its actual datatype.
 * This interface is implemented for number as "Number", Date as "Date",
 * Boolean as "Boolean", and String as "String".
 * Each instance is registered with the DataTypeServices using the 
 * RegisterDataType.
 */
export interface IDataTypeIdentifier
{
/**
 * The unique lookup key you will use to identify this native data type.
 */    
    DataTypeLookupKey: string;
/**
 * Determines if the value is identified as a match and maps to DataTypeLookupKey.
 * @param value 
 */
    SupportsValue(value: any): boolean;
}

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
 */
export interface IDataTypeConverter
{
/**
 * Will be called to see if the value and DataType Lookup Key should be handled
 * by this class.
 * If the dataTypeLookupKey is null or '', evaluate the value itself,
 * such as checking its class (using 'instanceof') or for properties of an interface
 * that you are using.
 * Don't look for valid data within the object. The Convert function is responsible
 * for reporting invalid data in supported values.
 * @param value
 * @param dataTypeLookupKey
 * @returns true when its own Convert method should handle the value.
  */
    SupportsValue(value: any, dataTypeLookupKey: string | null): boolean;
/**
 * Return the value representing the original value, but in the new data type,
 * specified by the generic T.
 * Return null if the value represents null.
 * Return undefined if the value was unconvertable.
 * @param value 
 * @param dataTypeLookupKey 
 */
    Convert(value: any, dataTypeLookupKey: string): number | Date | string | null | undefined;
}

/**
 * Class that compares two values to determine equality, less than, greater than.
 * Create classes for each data type that doesn't support the
 * ==, !=, <, > operators the desired way.
 * However, first consider using an IDataTypeConverter to convert
 * your data type into an integer, string, or date. Those will
 * be supported by the default comparer.
 * 
 * Register your class with the DataTypeServices.
 */
export interface IDataTypeComparer
{
    SupportsValues(value1: any, value2: any): boolean;

    Compare(value1: any, value2: any): ComparersResult;
}

export enum ComparersResult {
    Equals,
    NotEquals,
    LessThan,
    GreaterThan,
    Undetermined
}

/**
 * Provides conversion between a native type and its formatted and localized string 
 * representation. Each is associated with a lookup key.
 * For example, the Date object has several of these implementations.
 * LookupKey="Date" provides a localized short date pattern through DateLocalizedFormatter.
 * LookupKey="AbbrevDate" provides the same but in abbreviated date pattern through AbbrevDateLocalizedFormatter.
 * Create implementations for each dataTypeLookupKey that needs localized formatting.
 * If you need access to ValidationServices, such as for text localization, implement
 * IServicesAccessor on your class.
 */
export interface IDataTypeLocalizedFormatter
{
    /**
     * Evaluates the parameters to determine if its Format method should handle the value
     * with those same parameters.
     * It should always match the DataTypeLookupKey. 
     * It does not have to evaluate the cultureID, as there are implementations
     * where the Format function handles every culture or isn't
     * using culture at all.
     * @param dataTypeLookupKey 
     * @param cultureId - Such as 'en-US' and 'en'
     * @returns Use its Format method when true. Do not use Format when false.
     */
    Supports(dataTypeLookupKey: string, cultureId: string): boolean;

    /**
     * Creates a formatted string for the value, applying the goals of the DataTypeLookupKey
     * and making it culture specific.
     * @param value 
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string>;
}