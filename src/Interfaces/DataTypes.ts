import { ComparersResult } from "../DataTypes/Comparers";

/**
 * DataTypeResolver handles various data types of the values.
 * It provides:
 * - Conversion to formatted string for displaying a value to the user.
 *   Uses LocalizationAdapters to localizing the formatted string.
 * - Comparing two same-type values for equals, not equals, less than, greater than.
 * This class is available on ValidationServices.DataTypeResolverService.
 */
export interface ICoreDataTypeResolver
{

/**
 * Converts the value to a string representation.
 * Result includes the successfully converted value
 * or validation error information.
 * @param value
 * @param lookupKey - If not supplied, a lookup key is created based on the native value type if possible.
 * @returns successfully converted value
 * or validation error information.
 */    
    ToString(value: any, lookupKey?: string): IDataTypeResolution<string>;

/**
 * Compares two same-type values to see if they are equal or not.
 * It can return Equals and NotEquals for types that make no sense
 * to support greater than and less than.
 * Otherwise it returns Equals, LessThan, or GreaterThan.
 * Expect exceptions when invalid values are supplied.
 * It identifies the ComparerHandler function
 * @param value1 
 * @param value2 
 * @param lookupKey - Identifies the ComparerHandler function. If null,
 *   the native data type of the value will be converted to a lookupKey
 *   when String, Number, Boolean, or Date object.
 */    
    CompareValues(value1: any, value2: any, lookupKey: string | null): ComparersResult;
}

export interface IDataTypeResolver extends ICoreDataTypeResolver
{
/**
 * The culture shown to the user in the app. Its the ISO language-region format.
   This value is the starting point to search through LocalizationAdapters.
   Those have their own FallbackCultureID to continue the search.
 */    
    ActiveCultureID: string;

}

export interface IDataTypeResolution<T>
{
    /**
     * When true, the lookupKey was not found amongst the supporting functions.
     * The Value and ErrorMessage properties are undefined.
     * When false, Value or ErrorMessage are defined.
     */
    NotFound?: boolean;
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
 * Provides Localization of data types for a specific culture.
 * Its task is to support the lookupKeys of the DataTypeResolver
 * by executing a function that returns a localized result for that lookup Key.
 * For example, with ToString, "Date" will return a string formatted in short date format 
 * specific to the culture. With ToNative, "Date" will tell the string parser
 * to understand the ##/##/## pattern specific to the culture.
 * DataTypeResolver may have many instances of this, for each culture
 * supported by the App. Each LocalizationAdapter may not need to support any particular
 * lookup Key. When not supported, the function lets the caller know and the caller
 * can try another LocalizationAdapter, using FallbackCultureID.
 */
export interface ILocalizationAdapter extends ICoreDataTypeResolver {
    /**
     * The ISO culture name pattern in use:
     * languagecode
     * languagecode-countrycode or regioncode
     * "en", "en-GB", "en-US"
     * If this needs to change, it is OK if you set it and the Adaptor reconfigure,
     * or to create a new instance and use it.
     */
    CultureID: string;

    /**
     * Identifies another culture to check if a lookup key cannot be resolved.
     * Caller should find another LocalizationAdapter for that culture.
     */
    FallbackCultureID: string | null;

    /**
     * Determines the value's type, and builds a localized string representing it.
     * If its already a string, it still may go through a conversion if a formatter
     * is available. For example, a phone number in a string to a formatted phone number.
     * @param value 
     * @param lookupKey - Identifies the specific function that should handle the conversion.
     * LookupKeys are registered with RegisterForToString.
     * If the lookupKey is not found, this function returns false to 
     * let the caller know to search elsewhere.
     * If the value cannot be converted using the function, such as an invalid datatype,
     * return { ErrorMessage: with error message }.
     */
    ToString(value: any, lookupKey: string): IDataTypeResolution<string>;

}
