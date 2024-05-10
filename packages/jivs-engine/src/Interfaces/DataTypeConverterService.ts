/**
 * {@inheritDoc Services/Types/IDataTypeConverterService!IDataTypeConverterService:interface }
 * @module Services/Types/IDataTypeConverterService
 */

import { IDataTypeConverter } from "./DataTypeConverters";
import { IDataTypeServiceBase } from "./DataTypes";
import { IServicesAccessor } from "./ValidationServices";

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
export interface IDataTypeConverterService extends IDataTypeServiceBase, IServicesAccessor {
    /**
     * Return the value based on the original value. It may be a new data type
     * of number, Date, or string.
     * It may be a reworking of the original value, such as a Date object
     * converted to a number of seconds, or a number rounded to an integer.
     * Return null if the value represents null.
     * Return undefined if the value was unconvertable.
     * @param value 
     * @param dataTypeLookupKey - if not supplied, a converter must determine if it supports
     * the value itself to be used.
     */
    convert(value: any, dataTypeLookupKey: string | null): SimpleValueType;

    /**
     * Converts the value using the DataTypeConverter identified in dataTypeLookupKey.
     * If the new value is not a primitive (number, string, boolean),
     * try to convert the new value using the DataTypeIdentifier to resolve a new Lookup Key.
     * Repeat until number, string, boolean or no further conversion is possible.
     * Return null if the value represents null.
     * Return undefined if the value was unconvertable.
     * @param value 
     * @param dataTypeLookupKey - if not supplied, it will attempt to resolve it with
     * the DataTypeIdentifiers.
     */
    convertToPrimitive(value: any, dataTypeLookupKey: string | null): SimpleValueType;    
 
    /**
     * Finds the first {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter}
     * that supports the value, or null if none are found.
     * @param value 
     * @param dataTypeLookupKey 
     * @returns 
     */
    find(value: any, dataTypeLookupKey: string | null): IDataTypeConverter | null;

}


