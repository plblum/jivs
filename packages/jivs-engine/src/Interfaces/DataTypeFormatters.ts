/**
 * {@inheritDoc DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter:interface }
 * @module DataTypes/Types/IDataTypeFormatter
 */

import { DataTypeResolution } from "./DataTypes";

/**
 * Provides conversion between a native type and its formatted and localized string 
 * representation. Each is associated with a lookup key.
 * For example, the Date object has several of these implementations.
 * LookupKey="Date" provides a localized short date pattern through DateFormatter.
 * LookupKey="AbbrevDate" provides the same but in abbreviated date pattern through AbbrevDateFormatter.
 * Create implementations for each dataTypeLookupKey that needs localized formatting.
 * If you need access to ValidationServices, such as for text localization, implement
 * IServicesAccessor on your class.
 * Register your implementation with ValidationServices.dataTypeFormatterService.
 */
export interface IDataTypeFormatter
{
    /**
     * Evaluates the parameters to determine if its format() method should handle the value
     * with those same parameters.
     * It should always match the DataTypeLookupKey. 
     * It does not have to evaluate the cultureID, as there are implementations
     * where the format() function handles every culture or isn't
     * using culture at all.
     * @param dataTypeLookupKey 
     * @param cultureId - Such as 'en-US' and 'en'
     * @returns Use its format() method when true. Do not use format() when false.
     */
    supports(dataTypeLookupKey: string, cultureId: string): boolean;

    /**
     * Creates a formatted string for the value, applying the goals of the DataTypeLookupKey
     * and making it culture specific.
     * @param value 
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string>;
}
