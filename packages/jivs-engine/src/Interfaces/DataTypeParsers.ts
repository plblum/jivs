/**
 * The DataTypeParser is a specialized converter that takes in a string and 
 * converts it into an expected native value.
 * It may return the native value or an error message if conversion fails.
 * The parser is also localizable, as cultures vary in their number, date and time formatting of strings.
 * 
 * DataTypeParsers are associated with Lookup Keys. There will be parsers to cover the basic cases,
 * and the user can create those for their own situations.
 * 
 * There may be multiple DataTypeParsers for a single lookupKey and cultureID. Each can handle
 * one possible way the user input text and allow others to cover additional cases.
 * For example, Date may look for the culture-specific short date pattern in one,
 * a variant that allows 2 digit years in another, and the ISO yyyy-MM-dd pattern in a third.
 * All 3 would be registered in the DataTypeParserService, and the first whose support() function
 * returns true will be expected to fully handle the text.
 * 
 * The parser is associated with FieldValueHost.setTextValue specifically. Its LookupKey is determined 
 * by:
 * - The FieldValueHostConfig.dataType property
 * - The FieldValueHostConfig.parserLookupKey property, which overrides the dataType property if supplied. This allows you to use a different parser than the one
 * that is associated with the dataType. For example, you may have a dataType of "PositiveInteger" but want to use a parser that allows for negative numbers and decimals, so you can have a validator that checks for the edge case of positive integers.
 * 
 * Because it is likely that you have a dataType property, and you may not want to use the parser feature, 
 * here are several ways to disable it:
 * - Set behavior.disableParsingOnValueChange to true. 'behavior' is found on the Builder: `builder.behavior.disableParsingOnValueChange = true;`
 * - Set the FieldValueHostConfig.parserLookupKey property to null.
 * - Use the option disableParser when calling setTextValue: `valueHost.setTextValue("some text", { disableParser: true });`
 * 
 * When used, the DataTypeParserService will be used to find the appropriate parser based on the lookup key established.
 * 
 * A parser is intended to be forgiving of minor flaws in the string, allowing the user
 * flexibility in input. That in itself is the main reason for a different with DataTypeConverter.
 * Additionally, any errors realized by the parser are not thrown, but instead
 * provided back to the caller to be used as an additional validation error message.
 * 
 * While similar to IDataTypeConverter, this is used in a specialized way and is more like
 * the inverse of IDataTypeFormatter, which takes a native value into a string.
 * 
 * Parsers should avoid reporting errors on values that could be successfully converted,
 * but do not fit into an edge case. For example, converting a number should allow for negatives
 * and decimals, even if the data type is "PositiveInteger". That way, the value gets assigned
 * to the ValueHost and you can have specific validators that check for the edge case. 
 * That also means better control over error messages by having validators built for the edge cases.
 * Dates apply to this rule too. If you can get a real date from the data, leave it to another
 * validator to identify if that date is inappropriate for your use case.
 * 
 * Register your implementation with JivsServices.dataTypeParserService.
 * @module jivs-engine/DataTypes/Types/IDataTypeParser
 */

import { DataTypeResolution } from './DataTypes';

/**
 * A specialized converter that takes in a string and converts it into an expected native value.
 * @see {@link jivs-engine/DataTypes/Types/IDataTypeParser} for details.
 * 
 * Register your implementation with JivsServices.dataTypeParserService.
 */
export interface IDataTypeParser<TDataType> {
    /**
     * Evaluates the parameters to determine if its parse() method should handle the value
     * with those same parameters.
     * It should always match the DataTypeLookupKey. 
     * It does not have to evaluate the cultureID, as there are implementations
     * where the parser() function handles every culture or isn't
     * using culture at all.
     * @param dataTypeLookupKey 
     * @param cultureId - Such as 'en-US' and 'en'
     * @param text - If supplied, the text that will be parsed, to allow the parser to 
     * determine if its compatible with the pattern of characters.
     * @returns Use its parser() method when true. Do not use parser() when false.
     */
    supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean;

    /**
     * Since there can be several parsers for a single lookupKey and cultureID
     * that are selected based on the text, this function is used 
     * when you want all possible candidates. It is effectively supports() without the text.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    isCompatible(dataTypeLookupKey: string, cultureId: string): boolean;
    
    /**
     * Parse the text supplied, attempting to create another value from it that will be returned.
     * The new value may be a different data type, 
     * whether primitive or an object that you have registered with DataTypeIdentifier.
     * If parsing fails, return an error message instead of a value.
     * If the text is the empty string, it is up to the parser to determine what to do
     * (return the empty string, null, a default value of the expected type, or an error message.)
     * The implementation should not throw an exception for a parsing error. Exceptions are permitted
     * for configuration errors, such as a missing culture.
     * @param text 
     * @param dataTypeLookupKey 
     * @param cultureId - Such as 'en-US' and 'en'
     */
    parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<TDataType | null>;
}
