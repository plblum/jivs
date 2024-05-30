/**
 * {@inheritDoc DataTypes/Types/IDataTypeParserService!IDataTypeParserService:interface }
 * @module DataTypes/Types/IDataTypeParserService
 */

import { IDataTypeParser } from './DataTypeParsers';
import { DataTypeResolution, IDataTypeService } from './DataTypes';


/**
 * A service for parsing strings into the native data type
 * using {@link DataTypes/Types/IDataTypeParser!IDataTypeParser | IDataTypeParser} instances.
 */
export interface IDataTypeParserService extends IDataTypeService
{
    /**
     * Parse the text supplied, attempting to create another value from it that will be returned.
     * The new value may be a different data type, 
     * whether primitive or an object that you have registered with DataTypeIdentifier.
     * If parsing fails, return an error message instead of a value.
     * If the text is the empty string, it is up to the parser to determine what to do
     * (return the empty string, null, a default value of the expected type, or an error message.)
     * The implementation should not throw an exception for a parsing error. Exceptions are permitted
     * for configuration errors, such as a missing culture.
     * If no parser was available, it returns an error in DataTypeResolution.
     * @param text 
     * @param lookupKey - A lookup key that identifies the desired parser.
     * This is expected to come from the valueHost.parserLookupKey or if null,
     * valueHost.dataType.
     * If no parser is found for this, the LookupKeyFallbackService is used to find another to try.
     * @param cultureId - Such as 'en-US' and 'en'
     */
    parse(text: string, lookupKey: string, cultureId: string): DataTypeResolution<any>;

/**
 * Return a matching DataTypeParser or null.
 * @param lookupKey 
 * @param cultureId 
 * @param text
 */
    find(lookupKey: string, cultureId: string, text: string): IDataTypeParser<any> | null;
}