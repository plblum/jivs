/**
 * {@inheritDoc DataTypes/Types/IDataTypeIdentifier!IDataTypeIdentifier:interface }
 * @module DataTypes/Types/IDataTypeIdentifier
 */

/**
 * Provides a way to associate any value with a datatype lookupkey based on its actual datatype.
 * This interface is implemented for number as "Number", Date as "Date",
 * Boolean as "Boolean", and String as "String".
 * Register your implementation with ValidationServices.dataTypeIdentifierService.
 */
export interface IDataTypeIdentifier
{
/**
 * The unique lookup key you will use to identify this native data type.
 */    
    dataTypeLookupKey: string;
/**
 * Determines if the value is identified as a match and maps to DataTypeLookupKey.
 * @param value 
 */
    supportsValue(value: any): boolean;

    /**
     * Returns a sample value that is representative of the DataTypeLookupKey.
     * Used by ConfigAnalysis to get a value that can be passed into services
     * that take a live value, such as converters, parsers and formatters.
     */
    sampleValue(): any;
}
