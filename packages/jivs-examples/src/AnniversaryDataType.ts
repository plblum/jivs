/**
 * Introduces a data type for month and day values, such as an anniversary.
 * Includes:
 * - 'Anniversary' data type lookup key.
 * - 'AnniversaryConverter' for comparing two anniversary values.
 * - 'AnniversaryParser' for parsing anniversary strings into a Date object.
 * - Registration of the new classes with JivsServices.
 */


import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { DataTypeConverterBase } from '@plblum/jivs-engine/build/DataTypes/DataTypeConverters';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import { DataTypeParserOptions, SpecificCulturesPatternParserBase }
    from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import { escapeRegExp } from '@plblum/jivs-engine/build/Utilities/Utilities';
import { DataTypeResolution } from '@plblum/jivs-engine/build/Interfaces/DataTypes';

export const AnniversaryLookupKey = 'Anniversary';

/**
 * An implementation of IDataTypeConverter or JavaScript Date objects that represent just the month and day,
 * which is a birthday or anniversary.
 * Effectively, the Date.getUTCFullYear() is treated as 2004 here (a leap year) 
 * even if that's not what was supplied.
 * DataType LookupKey: "Anniversary".
 */
export class AnniversaryConverter extends DataTypeConverterBase
{
    public convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): number | undefined {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(Date.UTC(2004, value.getUTCMonth(), value.getUTCDate()));
        return dateOnly.getTime();
    }
    protected validValue(value: any): boolean {
        return value instanceof Date;
    }
    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.Milliseconds];
    }
    public supportedSourceLookupKeys(): (string | null)[] {
        return [AnniversaryLookupKey];
    }
}

/* PARSERS ------------------------------------------------------
 * There are several ways to parse month-day strings into native values.
 * Its source is expected to be a localized string with 1 or 2 digit month and 1 or 2 digit day.
 * Its output is may be one of several structured data types.
 * 
 * Classes:
 * - AnniversaryParserBase - Base class for parsing month-day strings into structured data types.
 * - AnniversaryParser - Native value is a Date object with the year set to 2004
 *   (because it supports a leap year day)
 */


/**
 * Base class for a parser to convert a localized month and day string into a native value.
 */
export abstract class AnniversaryParserBase<TDataType, TOptions extends AnniversaryParserOptions<TDataType | null> = AnniversaryParserOptions<TDataType | null>>
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
        return AnniversaryParserBase.badAnniversaryMessage;
    }

    public static readonly badAnniversaryMessage = 'Expecting a month and day';
    /**
     * Returns an expression with 2 groups of digits for month and day
     * based on the order. Allows for lead and trailing spaces.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    protected createRegExp(dataTypeLookupKey: string, cultureId: string): RegExp
    {
        let pattern = '^\\s*';
        switch (this.options.order)
        {
            case 'md': // day at the end. Using space delimiters temporarily
                pattern += '(\\d{1,2}) (\\d{1,2})';
                break;
            default: // day at the start
                pattern += '(\\d{1,2}) (\\d{1,2})';
                break;
        }
        pattern = pattern.replace(/ /g, this._escapedShortDateSeparator);
        pattern += '\\s*$';
        return new RegExp(pattern);
    }

    protected override processPattern(pattern: RegExpExecArray, text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<TDataType>
    {
        let d: number = 0;
        let m: number = 0;
        let groupLocation = 1;
        for (const char of this.options.order)
        {
            switch (char)
            {
                case 'd':
                    d = parseInt(pattern[groupLocation], 10);
                    break;
                case 'm':
                    m = parseInt(pattern[groupLocation], 10);
                    break;
            }
            groupLocation++;
        }
        if (m <= 0 || m > 12)
            return this.returnError(invalidMonthErrorMessage, invalidMonthErrorCode);
        if (d <= 0 || d > 31)
            return this.returnError(invalidDayErrorMessage, invalidDayErrorCode);

        return this.toNativeType(m, d);
    }

    /**
     * Provide the native type representation of the month-day combination
     * or report an error.
     * @param m The month component (1-based)
     * @param d The day component (1-based)
     */
    protected abstract toNativeType(m: number, d: number): DataTypeResolution<TDataType>;
}
export const invalidMonthErrorMessage = 'Invalid month';
export const invalidDayErrorMessage = 'Invalid day';
export const invalidMonthErrorCode = 'Parser_INVALID_MONTH';
export const invalidDayErrorCode = 'Parser_INVALID_DAY';

export interface AnniversaryParserOptions<TDataType> extends DataTypeParserOptions<TDataType>
{
    order: 'md' | 'dm';
    separator: string;
    year?: number;
}

/**
 * Parser for month-day strings, converting it to Date objects where the year defaults to 2004.
 * The year was chosen to ensure its a leap year.
 */
export class AnniversaryParser extends AnniversaryParserBase<Date>
{
    constructor(supportedLookupKey: string, supportedCultures: Array<string>, options: AnniversaryParserOptions<Date>)
    {
        super(supportedLookupKey, supportedCultures, options);
    }
    protected override toNativeType(m: number, d: number): DataTypeResolution<Date>
    {
        const year = this.options.year ?? 2004;
        const date = new Date(Date.UTC(year, m - 1, d));
        if (isNaN(date.getTime()))
            return this.returnError();  // uses default message and error code
        return { value: date };
    }

    protected override defaultEmptyStringResult(): Date | null
    {
        return null;
    }
}

// Register after you have JivsServices instance. Setup only on the JivsServices
export function registerAnniversary(services: IJivsServices,
    supportedCultures: string[]): void
{
    let dtcs = services.dataTypeConverterService as DataTypeConverterService;
    // or move just this line into registerDataTypeConverters() function         
    dtcs.register(new AnniversaryConverter());

    // This gets used ONLY when the ValueHostConfig.dataType with "MonthDay".
    // When its time to compare, the AnniversaryConverter is asked if it supports the value.
    // If so, the comparision immediately calls convert and now has a Date value.
    // The dataTypeConverterService knows to convert Date to a number, so it can be used by the 
    // default converter (DefaultConverter function supports comparing numbers)

    let dtps = services.dataTypeParserService;
    dtps.register(new AnniversaryParser(AnniversaryLookupKey, supportedCultures, {
        order: 'md',
        separator: '-',
        year: 2004  // a leap year
    }));

}
