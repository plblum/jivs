/**
 * {@inheritDoc Services/Types/IDataTypeConverterService!IDataTypeConverterService:interface }
 * @module Services/Types/IDataTypeConverterService
 */

import { LookupKey } from "../DataTypes/LookupKeys";
import { IDataTypeConverter } from "./DataTypeConverters";
import { IDataTypeService } from "./DataTypes";
import { IServicesAccessor } from "./Services";

/**
 * Identifies types that are simple values. Most objects are not, but Date object really
 * represents a simple value. Includes number, string, boolean, Date, null and undefined.
 */
export type SimpleValueType = number | Date | string | null | boolean | undefined;

/**
 * Service for changing the original value into 
 * something that you want a condition to evaluate
 * using {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter} instances.
 */
export interface IDataTypeConverterService extends IDataTypeService<IDataTypeConverter>, IServicesAccessor {
    /**
     * Return the value converted from the original value to the desired resultLookupKey.
     * It may be a reworking of the original value, such as a Date object
     * converted to a number of seconds, or a number rounded to an integer.
     * Return null if the value represents null.
     * Return undefined if the value was unconvertable.
     * See also convertUntilResult() for a more complex conversion.
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be. When handling conditions,
     * this is usually from conditionConfig.conversionLookupKey or secondConversionLookupKey.
     * @returns An object identifying the converter used and the converted value. Its 
     * value parameter is undefined when the value was not converted.
     * Its converterUsed parameter is undefined when no DataTypeConverter could be found 
     * to try the conversion. Note that DataTypeConverter.convert() can return undefined,
     * allowing for value=undefined and converterUsed=assigned.
    */
    convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): ConversionResult;

    /**
     * Applies a converter specific to the value based on the desired result lookup key.
     * If the result is an object (like Date or custom),
     * it repeats with the new value, hopefully resulting in a primitive value for use by the 
     * DefaultComparer.
     * Date -> number using UTCDateConverter
     * RelativeDate class with getDate(): Date property -> Date -> number using RelativeDateConverter and UTCDateConverter.
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be. When handling conditions,
     * this is usually from conditionConfig.conversionLookupKey or secondConversionLookupKey.
     * @returns An object identifying the converter used and the converted value. Its 
     * value parameter is undefined when the value was not converted.
     * Its converterUsed parameter is undefined when no DataTypeConverter could be found 
     * to try the conversion. Note that DataTypeConverter.convert() can return undefined,
     * allowing for value=undefined and converterUsed=assigned.
     */
    convertUntilResult(value: any, sourceLookupKey: string | null, resultLookupKey: string): ConversionResult;

    /**
     * Finds the first {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter}
     * that supports the value, or null if none are found.
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be. When handling conditions,
     * this is usually from conditionConfig.conversionLookupKey or secondConversionLookupKey.
     * @returns 
     */
    find(value: any, sourceLookupKey: string | null, resultLookupKey: string): IDataTypeConverter | null;

    /**
     * Finds all that support both the value and the sourceLookupKey parameter.
     * The caller can then use the supportedResultLookupKeys to build an exact match
     * test for the find() function.
     * @param value 
     * @param sourceLookupKey 
     */
    compatibleSources(value: any, sourceLookupKey: string | null): Array<IDataTypeConverter>;

}


/**
 * The result for the conversion functions of DataTypeConverterService.
 */
export interface ConversionResult {
    /**
     * The converted value. If conversion failed, return undefined.
     * If the property is omitted, there was no conversion done.
     */
    value?: any;

    /**
     * Because undefined is a valid value to supply in value property,
     * this property is used to indicate that the value was resolved.
     * It is only true when a value has been determined, including undefined.
     * NOTE: converter is similar, but does not get assigned in 
     * the case where the input value is null or undefined.
     */
    resolvedValue?: boolean;

    /**
     * Name of the converter used. If no conversion was done, return undefined.
     * There can be a converter when value = undefined.
     */
    converter?: string;

    /**
     * An exception that was captured
     */
    error?: Error;

    sourceLookupKey?: string | null;
    resultLookupKey?: string;

    /**
     * When conversion requires multiple steps and each with its own converter,
     * this is a linked list of earlier results from the steps.
     * The end node is the earliest result and has earlierResult = null.
     * This value is always undefined when it ran out of converters before completing the request.
     * This value is assigned when there is a value, or the last converter returned undefined.
     */
    earlierResult?: ConversionResult | null;
}

