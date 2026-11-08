import { DataTypeParserBase, DataTypeParserOptions }
    from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import { DataTypeResolution } from '@plblum/jivs-engine/build/Interfaces/DataTypes';

/**
 * A parser that maps string entries to specific strings based on a predefined mapping.
 * 
 * Example using USA state codes as the mapping keys:
 * - 'Calif', 'California', 'ca', and 'CA' all map to 'CA'
 * - 'Mass', 'Massachusetts', and 'MA' all map to 'MA'
 * 
 * It can report an error if the input is not found in the mapping, effectively 
 * becoming a validator.
 * The structure of the mapping is an array of arrays of string.
 * The first element of each inner array is the key, and the additional elements in the array are the possible mapped values.
 * When there is a case insensitive match, the first element of the array is used as the mapped value.
 * It will fix the casing of the input to match the mapped value.
 * 
 * Example:
 * const mapping = [
 *   ['CA', 'Calif', 'California'],
 *   ['MA', 'Mass', 'Massachusetts']
 * ];
 * 
 * const parser = new StringMappingParser(mapping);
 * parser.parse('CA'); // returns 'CA'
 * parser.parse('Calif'); // returns 'CA'
 * parser.parse('California'); // returns 'CA'
 * parser.parse('MA'); // returns 'MA'
 * parser.parse('Mass'); // returns 'MA'
 * parser.parse('Massachusetts'); // returns 'MA'
 * 
 * Parser options:
 * - mapping: The array of string mappings to use for parsing. Required. It can have just one entry in the main array, allowing you to fix
 *   an entry that has multiple possible input variations but should map to a single canonical value.
 * - caseInsensitive: A boolean indicating whether the matching should be case insensitive. Defaults to true.
 * - reportValidationError: A boolean indicating whether the parser should report a validation error 
 *   if the input is not found in the mapping. Defaults to true.
 *   When false, the parser will return the input as-is when it is not found in the mapping,
 *   leaving it for validators.
 * - errorMessage: A string specifying the error message to use when reporting a validation error. Optional.
 *   The localized error message key is in the shape of 'ParserError_<lookupKey>_l10n'.
 *   The error code is 'ParserError'.
 * 
 * Rules:
 * - If the user supplies an empty string, the parser will return an empty string as the result.
 * - The default error message is 'Invalid input.' and default error code is 'ParserError'.
 */
export class StringMappingParser extends DataTypeParserBase<string, StringMappingParserOptions>
{
    /**
     * Creates an instance of the StringMappingParser.
     * @param lookupKey The key used to look up the data type. Suggest: LookupKey.String.
     * @param options The options for configuring the string mapping parser.
     */
    constructor(lookupKey: string,options: StringMappingParserOptions)
    {
        super(lookupKey, options);
    }

    protected override initUndefinedOptions(options: StringMappingParserOptions): void
    {
        super.initUndefinedOptions(options);
        if (options.caseInsensitive === undefined) {
            options.caseInsensitive = true;
        }
        if (options.reportValidationError === undefined) {
            options.reportValidationError = true;
        }
    }
    // uses defaults from ancestor for error code and error message

    protected override defaultEmptyStringResult(): string | null
    {
        return '';
    }
    protected override parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string | null>
    {
        const mapping = this.options.mapping;
        const caseInsensitive = this.options.caseInsensitive ?? true;

        for (const group of mapping) {
            const canonical = group[0];
            for (const variation of group) {
                if (text === variation ||
                    (caseInsensitive && text.toLowerCase() === variation.toLowerCase()))
                {
                    return { value: canonical };
                }
            }
        }

        if (this.options.reportValidationError) {
            return this.returnError(this.options.errorMessage);
        }

        return { value: text };
    }
}

export interface StringMappingParserOptions extends DataTypeParserOptions<string>
{
    /**
     * The array of string mappings to use for parsing. Required. It can have just one entry in the main array, allowing you to fix
     * an entry that has multiple possible input variations but should map to a single canonical value.
     * Each inner array should have the canonical value as the first element, followed by any possible variations that should map to it.
     * Example:
     * [
     *   ['CA', 'Calif', 'California'],
     *   ['MA', 'Mass', 'Massachusetts'],
     *   ['TX', 'Tex', 'Texas']
     * ]
     * In this example, 'Calif' and 'California' will both be mapped to 'CA', 
     * and 'Mass' and 'Massachusetts' will both be mapped to 'MA'.
     */
    mapping: string[][];
    /**
     * A boolean indicating whether the matching should be case insensitive. Defaults to true.
     */
    caseInsensitive?: boolean;
    /**
     * A boolean indicating whether the parser should report a validation error 
     * if the input is not found in the mapping. Defaults to true.
     * When false, the parser will return the input as-is when it is not found in the mapping,
     * leaving it for validators.
     */
    reportValidationError?: boolean;
    /**
     * A string specifying the error message to use when reporting a validation error. Optional.
     * The error code used will be 'ParserError' unless overridden in the options.
     * The localized error message key will be 'ParserError_<lookupKey>_l10n'.
     */
    errorMessage?: string;
}