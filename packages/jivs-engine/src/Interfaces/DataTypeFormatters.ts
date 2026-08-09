/**
 * A DataTypeFormatter class provides conversion between a native type and its formatted and localized string 
 * representation. There are two use cases:
 * - When using FieldValueHost.setValue, the native value is converted to a string for display in the UI. 
 *   This is the most common use case. If you have also setup ValueHostsConfig.onTextValueChanged callback hook, 
 *   it can refresh the UI with the updated string representation.
 * - Within error messages, where tokens are replaced with the string representation of a value. 
 *   For example, "The value {value} is not valid for this field." where {value} is replaced with 
 *   the formatted string representation of the value.
 * 
 * Each DataTypeFormatter is associated with a lookup key.
 * For example, the Date object has several of these implementations.
 * LookupKey="Date" provides a localized short date pattern through DateFormatter.
 * LookupKey="AbbrevDate" provides the same but in abbreviated date pattern through AbbrevDateFormatter.
 * 
 * The lookup key is determined by:
 * - The FieldValueHostConfig.dataType property
 * - The FieldValueHostConfig.formatterLookupKey property, which overrides the dataType property if supplied. 
 *   This allows you to use a different formatter than the one associated with the dataType.
 * - Within an error message token, use this syntax to override all other formatting rules:
 *   {token:lookup key}. For example, "The value {value:AbbrevDate} is not valid for this field." 
 *   where {value:AbbrevDate} is replaced with the formatted string representation of the value 
 *   using the AbbrevDate formatter.
 * 
 * Because it is likely that you have a dataType property, and you may not want to use the formatter feature, 
 * here are several ways to disable it:
 * - Set behavior.disableFormattingOnValueChange to true. 'behavior' is found on the Builder: `builder.behavior.disableFormattingOnValueChange = true;`
 * - Set the FieldValueHostConfig.formatterLookupKey property to null.
 * - Use the option disableFormatter when calling setValue: `valueHost.setValue("some value", { disableFormatter: true });`
 * 
 * When used, the DataTypeFormatterService will be used to find the appropriate formatter based on the lookup key established.
 * 
 * Create implementations for each dataType LookupKey that needs localized formatting.
 * If you need access to JivsServices, such as for text localization, implement
 * IServicesAccessor on your class.
 * Register your implementation with JivsServices.dataTypeFormatterService.
 * @module jivs-engine/DataTypes/Types/IDataTypeFormatter
 */

import { DataTypeResolution } from './DataTypes';

/**
 * Provides conversion between a native type and its formatted and localized string 
 * representation. 
 * @see {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters} for details.
 * Register your implementation with JivsServices.dataTypeFormatterService.
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
