import { DataTypeParserOptions, SpecificCulturesPatternParserBase }
    from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import { escapeRegExp } from '@plblum/jivs-engine/build/Utilities/Utilities';
import { DataTypeResolution } from '@plblum/jivs-engine/build/Interfaces/DataTypes';

/**
 * Provides several ways to parse month-year strings into structured data types.
 * Its source is expected to be a localized string with 2 or 4 digit year and 1 or 2 digit month.
 * Its output is determined by a subclass of MonthYearParserBase.
 * 
 * We supply these parsers to handle common month-year parsing scenarios, but custom subclasses can be created for specialized needs.
 * - MonthYearParser - Native value is a Date object with the day of month set to 1.
 * - StringPatternedMonthYearParser - Native value is a string formatted according to a template.
 */


/**
 * Parser to convert a localized month and year string into a structured data type.
 * User is supplied several subclasses to handle the structured data type,
 * and if none work, please create a custom subclass to handle the structured data type.
 */
export abstract class MonthYearParserBase<TDataType, TOptions extends MonthYearParserOptions<TDataType | null>  = MonthYearParserOptions<TDataType | null>>
    extends SpecificCulturesPatternParserBase<TDataType, TOptions>
{
    constructor(supportedLookupKey: string, supportedCultures: Array<string>, options: TOptions)
    {
        super(supportedLookupKey, supportedCultures, options);
        this.assertMustHaveCharacter(options.separator, 'separator');
        this._escapedShortDateSeparator = escapeRegExp(options.separator);            
    }
    private readonly _escapedShortDateSeparator: string;    

    protected override initUndefinedOptions(options: TOptions): void
    {
        super.initUndefinedOptions(options);
        if (!options.order)
            throw new Error('The "order" option must be specified.');
    }
    protected patternDidNotMatchMessage(): string
    {
        return MonthYearParserBase.badMonthYearMessage;
    }

    public static readonly badMonthYearMessage = 'Expecting a month and year';
    /**
     * Returns an expression with 3 groups of digits where 1 group has 4 digits
     * based on the order. Allows for lead and trailing spaces.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    protected createRegExp(dataTypeLookupKey: string, cultureId: string): RegExp
    {
        let pattern = '^\\s*';
        switch (this.options.order)
        {
            case 'my': // year at the end. Using space delimiters temporarily
                pattern += '(\\d{1,2}) (\\d{4}|\\d{2})';
                break;
            default: // year at the start
                pattern += '(\\d{4}|\\d{2}) (\\d{1,2})';
                break;
        }
        pattern = pattern.replace(/ /g, this._escapedShortDateSeparator);
        pattern += '\\s*$';
        return new RegExp(pattern);
    }    

    protected override processPattern(pattern: RegExpExecArray, text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<TDataType>
    {
        let y: number = 0;
        let m: number = 0;
        let groupLocation = 1;
        for (const char of this.options.order)
        {
            switch (char)
            {
                case 'y':
                    y = parseInt(pattern[groupLocation], 10);
                    break;
                case 'm':
                    m = parseInt(pattern[groupLocation], 10);
                    break;
            }
            groupLocation++;
        }
        if (m <= 0 || m > 12)
            return this.returnError(invalidMonthErrorMessage, invalidMonthErrorCode);
        if (y < 100)
            y += 2000;
        else if (y < 1000)
            return this.returnError(invalidYearErrorMessage, invalidYearErrorCode);

        return this.toNativeType(y, m);
    }    

    /**
     * Provide the native type representation of the month-year combination
     * or report an error.
     * @param y The year component - already adjusted to 4 digits
     * @param m The month component (1-based)
     */
    protected abstract toNativeType(y: number, m: number): DataTypeResolution<TDataType>;
}
export const invalidMonthErrorMessage = 'Invalid month';
export const invalidYearErrorMessage = 'Invalid year';
export const invalidMonthErrorCode = 'Parser_INVALID_MONTH';
export const invalidYearErrorCode = 'Parser_INVALID_YEAR';

export interface MonthYearParserOptions<TDataType> extends DataTypeParserOptions<TDataType>
{
    order: 'my' | 'ym';
    separator: string;
}

/**
 * Parser for month-year strings, converting it to Date objects where the day of month
 * is always 1.
 */
export class MonthYearParser extends MonthYearParserBase<Date>
{
    constructor(supportedLookupKey: string, supportedCultures: Array<string>, options: MonthYearParserOptions<Date>)
    {
        super(supportedLookupKey, supportedCultures, options);

    }
    protected override toNativeType(y: number, m: number): DataTypeResolution<Date>
    {
        const date = new Date(Date.UTC(y, m - 1, 1));
        if (isNaN(date.getTime()))
            return this.returnError();  // uses default message and error code
        return { value: date };
    }

    protected override defaultEmptyStringResult(): Date | null
    {
        return null;
    }
}

/**
 * Parser for month-year strings, converting it to a string representation based on a template.
 * The template string is expected to have a strict pattern, not based on localization,
 * such that it may be passed to another system or stored consistently.
 * 
 * Template pattern will replace the following placeholders:
 * - YYYY
 * - YY
 * - MM - two-digit month with leading zero
 * - M - single-digit month without leading zero
 * 
 * Returns the empty string if the input is empty.
 */
export class StringPatternedMonthYearParser extends MonthYearParserBase<string, StringPatternedMonthYearParserOptions> 
{

    constructor(supportedLookupKey: string, supportedCultures: Array<string>, options: StringPatternedMonthYearParserOptions)
    {
        super(supportedLookupKey, supportedCultures, options);
    }

    protected override initUndefinedOptions(options: StringPatternedMonthYearParserOptions): void
    {
        super.initUndefinedOptions(options);
        if (!options.template)
            throw new Error('Template is required for StringPatternedMonthYearParser');
    }

    protected override toNativeType(y: number, m: number): DataTypeResolution<string>
    {
        if (m <= 0 || m > 12)
            return this.returnError(invalidMonthErrorMessage, invalidMonthErrorCode);
        if (y < 100)
            y += 2000;
        else if (y < 1000)
            return this.returnError(invalidYearErrorMessage, invalidYearErrorCode);
        let template = this.options.template;
        let result = template.replace('YYYY', y.toString())
                             .replace('YY', (y % 100).toString().padStart(2, '0'))
                             .replace('MM', m.toString().padStart(2, '0'))
                             .replace('M', m.toString());

        return { value: result };
    }
    protected override defaultEmptyStringResult(): string | null
    {
        return '';
    }    
}

export interface StringPatternedMonthYearParserOptions extends MonthYearParserOptions<string>
{
    /**
     * The template string used to shape the native value. 
     * The placeholders in the template will be replaced with the corresponding year and month values.
     * Template placeholders will be replaced as follows:
     * - YYYY with the full year
     * - YY with the last two digits of the year
     * - MM with the two-digit month
     * - M with the single-digit month
     * 
     * Requires a value.
     */
    template: string;
}