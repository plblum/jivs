/**
 * {@inheritDoc DataTypes/Types/IDataTypeParser!IDataTypeParser:interface }
 * @module DataTypes/ConcreteClasses/DataTypeParsers
 */

import { DataTypeResolution } from "../Interfaces/DataTypes";
import { escapeRegExp } from '../Utilities/Utilities';
import {
    CleanUpStringParserBase, CleanUpStringParserOptions, DatePatternParserBase, DateTimeCultureInfo,
    NumberParserBase, NumberCultureInfo, PercentageParserBase, BooleanParserBase, BooleanParserOptions,
    DataTypeParserOptions,
    DataTypeParserBase
} from './DataTypeParserBase';
import { LookupKey } from './LookupKeys';

/**
 * Resulting value is a string that has been cleaned up based
 * on the properties. Create unique LookupKeys for each variant
 * and register them in DataTypeParserServer.
 * Culture is not used here.
 * Features found amongst its properties: 
 * replace whitespace with character, convert case, remove extra whitespace (2 or more back-to-back), strip characters regex
 */
export class CleanUpStringParser extends CleanUpStringParserBase<CleanUpStringParserOptions> {

    constructor(supportedLookupKey: string, options: CleanUpStringParserOptions) {
        super(supportedLookupKey, options);
    }
}

/**
 * This is a very simplistic implementation of a parser to convert any single 
 * culture's short date pattern into a Date object (UTC or local).
 * There are much better libraries to provide multi-culture handling of dates
 * to consider implementing IDataTypeParser.
 * Short date pattern has 3 groups of digits, separated by a non-digit delimiter.
 * The culture determines which group is year, month, or day.
 * To setup, you must supply both the order of ymd, and the separator character.
 * Therefore, you must register one of these for EACH culture that uses the pattern.
 */
export class ShortDatePatternParser extends DatePatternParserBase<DateTimeCultureInfo> {
    constructor(supportedLookupKey: string, supportedCultures: Array<string>,
        format: DateTimeCultureInfo, utc: boolean = true) {
        super(supportedLookupKey, supportedCultures, format, utc);
        
        this.assertMustHaveCharacter(format.shortDateSeparator, 'shortDateSeparator');
        this._escapedShortDateSeparator = escapeRegExp(format.shortDateSeparator);
    }

    private _escapedShortDateSeparator: string;

    /**
     * Returns an expression with 3 groups of digits where 1 group has 4 digits
     * based on the order. Allows for lead and trailing spaces.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    protected createRegExp(dataTypeLookupKey: string, cultureId: string): RegExp {
        let pattern = '^\\s*';
        switch (this.order) {
            case 'dmy': // year at the end. Using space delimiters temporarily
            case 'mdy':
                pattern += '(\\d{1,2}) (\\d{1,2}) (\\d{4}|\\d{2})';
                break;
            default: // year at the start
                pattern += '(\\d{4}|\\d{2}) (\\d{1,2}) (\\d{1,2})';
                break;
        }
        pattern = pattern.replace(/ /g, this._escapedShortDateSeparator);
        pattern += '\\s*$';
        return new RegExp(pattern);
    }
    protected processPattern(pattern: RegExpExecArray, text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<Date> {
        let y: number = 0;
        let m: number = 0;
        let d: number = 0;
        let groupLocation = 1;
        for (let char of this.order) {
            switch (char) {
                case 'y':
                    y = parseInt(pattern[groupLocation], 10);
                    break;
                case 'm':
                    m = parseInt(pattern[groupLocation], 10);
                    break;
                case 'd':
                    d = parseInt(pattern[groupLocation], 10);
                    break;
            }
            groupLocation++;
        }

        return this.toDate(y, m - 1, d);
    }
}

/**
 * Parser for LookupKey.Number. It supports decimal and integer values,
 * both positive and negative. Use validators to detect invalid numbers like 
 * having a negative or decimal when not desired.
 */
export class NumberParser extends NumberParserBase<NumberCultureInfo>
{
    /**
     * 
     * @param supportedCultures 
     * @param options - Note omits currencySymbol and percentSymbol for user experience with intellisense
     * Those values can still be passed in and will be ignored.
     */
    constructor(supportedCultures: Array<string>,
        options: Omit<NumberCultureInfo, 'currencySymbol' | 'percentSymbol'>) {
        super(LookupKey.Number, supportedCultures, options as NumberCultureInfo);
    }
}

/**
 * Parser for LookupKey.Currency. It supports decimal and integer values,
 * both positive and negative.
 */
export class CurrencyParser extends NumberParserBase<NumberCultureInfo>
{
    /**
     * 
     * @param supportedCultures 
     * @param options - Note omits percentSymbol for user experience with intellisense
     * It can still be passed in and will be ignored.
     */
    constructor(supportedCultures: Array<string>, options: Omit<NumberCultureInfo, 'percentSymbol'>) {
        super(LookupKey.Currency, supportedCultures, options as NumberCultureInfo);
        this.assertMustHaveCharacter(options.currencySymbol, 'currencySymbol');
        this.stripTheseStrings = [options.currencySymbol];
    }
}

/**
 * Parser for LookupKey.Percentage100, where 100% = 100.0. It supports decimal and integer values,
 * both positive and negative.
 */
export class Percentage100Parser extends PercentageParserBase {
    constructor(supportedCultures: Array<string>, options: Omit<NumberCultureInfo, 'currencySymbol'>) {
        super(LookupKey.Percentage100, supportedCultures, options);
    }

}
/**
 * Parser for LookupKey.Percentage, where 100% = 1.0. It supports decimal and integer values,
 * both positive and negative.
 */
export class PercentageParser extends PercentageParserBase
{
    constructor(supportedCultures: Array<string>, options: Omit<NumberCultureInfo, 'currencySymbol'>) {
        super(LookupKey.Percentage, supportedCultures, options);
    }

    protected parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<number> {
        let result = super.parseCleanedText(text, dataTypeLookupKey, cultureId);
        if (typeof result.value === 'number')
            result.value = result.value / 100.0;
        return result;
    }
}

/**
 * Handles LookupKey.Boolean
 */
export class BooleanParser extends BooleanParserBase<BooleanParserOptions>
{
    constructor(supportedCultures: Array<string>, options: BooleanParserOptions)
    {
        super(LookupKey.Boolean, supportedCultures, options);
    }
}

/**
 * For fields that need a boolean value and the source string is true
 * when it has text other than whitespace and false for empty string or all whitespace.
 */
export class EmptyStringIsFalseParser<TOptions extends DataTypeParserOptions<boolean>> extends DataTypeParserBase<boolean, TOptions> {

    constructor(supportsLookupKey: string) {
        super(supportsLookupKey, {} as TOptions);
    }

    protected defaultEmptyStringResult(): boolean | null {
        return false;
    }
    protected parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<boolean | null> {
        // base class parse() method has handled empty string case.
        return { value: true };
    }    
}