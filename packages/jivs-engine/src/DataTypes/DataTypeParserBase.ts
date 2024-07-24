/**
 * {@inheritDoc DataTypes/Types/IDataTypeParser!IDataTypeParser:interface }
 * @module DataTypes/AbstractClasses/DataTypeParsers
 */

import { IServicesAccessor } from '../Interfaces/Services';
import { IDataTypeParser } from '../Interfaces/DataTypeParsers';
import { DataTypeResolution } from '../Interfaces/DataTypes';
import { assertNotNull, assertWeakRefExists, CodingError } from '../Utilities/ErrorHandling';
import { escapeRegExp, hasLetters, hasMultipleOccurances, onlyTheseCharacters } from '../Utilities/Utilities';
import { IValidationServices } from '../Interfaces/ValidationServices';


/**
 * Used to configure a parser through the constructor.
 * Note that the constructor will have other values that are either
 * so important and required that explicitly showing them in a parameter
 * makes more sense, or you are creating a base class with options
 * only controlled by the subclasses.
 */
export interface DataTypeParserOptions<TDataType>
{
    /**
     * Value to return if the text was only an empty string (after trimming)
     * Defaults to ''. Can be any string or null
     */
    emptyStringResult?: TDataType | null

    /**
     * Determines if leading and trailing whitespace is discarded.
     * Defaults to true. Can be 'start' to trim only starting whitespace
     * and 'end' to trim only ending whitespace.
     */
    trim?: boolean | 'start' | 'end';
}

/**
 * Abstract base class for creating IDataTypeParser implementations.
 * 
 * Use and extend the DataTypeParserOptions interface to contain the rules
 * users will typically supply to customize the behavior.
 * Options are generally parser guidance alone. Settings that are used by
 * the supports() function should be stand-alone parameters of the constructor.
 * 
 * Base classes will also have constructor parameters separate from options that
 * allow the subclass to dictate behavior.
 */
export abstract class DataTypeParserBase<TDataType, TOptions extends DataTypeParserOptions<TDataType | null>>
    implements IDataTypeParser<TDataType>, IServicesAccessor {
    
    constructor(supportedLookupKey: string, options: TOptions) {
        assertNotNull(supportedLookupKey, 'supportedLookupKey');
        this._supportedLookupKey = supportedLookupKey;
        if (!options)
            options = {} as TOptions;
        this.initUndefinedOptions(options);
        this._options = options;
    }
    protected initUndefinedOptions(options: TOptions): void
    {
        if (options.emptyStringResult === undefined)
            options.emptyStringResult = this.defaultEmptyStringResult();
        if (options.trim === undefined)
            options.trim = true;
    }
    
    protected assertMustHaveCharacter(optionVal: string, optionName: string) : void
    {
        assertNotNull(optionVal, optionName);
        if (optionVal.length === 0)
            throw new CodingError(optionName + ' option required.');  
    }
    
    public get supportedLookupKey(): string {
        return this._supportedLookupKey;
    }
    private _supportedLookupKey: string;

    protected get options(): TOptions
    {
        return this._options;
    }
    private _options: TOptions;

    public dispose(): void
    {
        this._services = undefined!;
    }        
    /**
     * Services accessor.
     * Note: Not passed into the constructor because this object should be created before
     * ValidationServices itself. So it gets assigned when ValidationService.dataTypeFormatterService is assigned a value.
     */
    public get services(): IValidationServices
    {
        assertWeakRefExists(this._services, 'Register with ValidationServices.dataTypeFormatterService first.');
        return this._services!.deref()!;
    }
    public set services(services: IValidationServices)
    {
        assertNotNull(services);
        this._services = new WeakRef<IValidationServices>(services);
    }
    protected get hasServices(): boolean
    {
        return this._services !== null && this._services.deref() !== undefined;
    }
    private _services: WeakRef<IValidationServices> | null = null;    

    /**
     * The default for the options.emptyStringResult when the user doesn't supply it.
     */
    protected abstract defaultEmptyStringResult(): TDataType | null;

    /**
     * Only requirse dataTypeLookupKey to match the supportedLookupKey
     */
    public supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
        return this.isCompatible(dataTypeLookupKey, cultureId);
    }

    /**
     * Since there can be several parsers for a single lookupKey and cultureID
     * that are selected based on the text, this function is used 
     * when you want all possible candidates. It is effectively supports() without the text.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    public isCompatible(dataTypeLookupKey: string, cultureId: string): boolean
    {
        return dataTypeLookupKey === this.supportedLookupKey;
    }
    /**
     * Handles trimming and returning the emptyStringResult if that's what it has.
     * Otherwise, it lets the child class work on the text.
     * @param text 
     * @param dataTypeLookupKey 
     * @param cultureId - Such as 'en-US' and 'en'
     */
    public parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<TDataType | null> {
        text = this.cleanText(text, dataTypeLookupKey, cultureId);

        if (text.length === 0)
            return { value: this.options.emptyStringResult };

        return this.parseCleanedText(text, dataTypeLookupKey, cultureId);
    }

    /**
     * Changes the text if needed before parsing. Usually removes unwanted characters like trimming whitespace,
     * but it could try to fix the data to closely resemble the desired text pattern that will be parsed
     * by parseCleanedText. 
     * When it comes to strings as the native data type, it can rework the text to be the pattern expected for storage.
     * For example, you might store a US phone number in this pattern: [3 digits]-[3 digits]-[4 digits].
     * The user may enter it in another familiar pattern like "(413) 555-0521" or "413 555   0520". 
     * This would clean it up to the desired pattern of "413-555-0521".
     * @param text 
     * @param dataTypeLookupKey 
     * @param cultureId 
     * @returns 
     */
    protected cleanText(text: string, dataTypeLookupKey: string, cultureId: string): string
    {
        return this.applyTrimming(text);
    }

    protected applyTrimming(text: string): string
    {
        switch (this.options.trim) {
            case true:
                text = text.trim();
                break;
            case 'start':
                text = text.trimStart();
                break;
            case 'end':
                text = text.trimEnd();
                break;
        }
        return text;
    }
/**
 * Called from parse to handle the text, knowing it is not an empty string
 * and has been trimmed.
 * @param text 
 * @param dataTypeLookupKey 
 * @param cultureId 
 */
    protected abstract parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<TDataType | null>;
}

/**
 * Options to configure CleanUpStringParser
 */
export interface CleanUpStringParserOptions extends DataTypeParserOptions<string>
{
    /**
     * When true, 2 or more back-to-back whitespaces are replaced by a single whitespace character.
     * This is always run before replaceWhitespace and after stripCharacters, so you can turn:
     * "203 - 533 - (3999)" into 203533(3999) when stripping "-" and using this.
     * Defaults to false.
     */
    compressWhitespace?: boolean;

    /**
     * Replaces all whitespace with this string.
     * Does nothing if null.
     * This option is run after compressWhitespace.
     */
    replaceWhitespace?: string | null;

    /**
     * Removes any character found in the string.
     * Does nothing if null.
     * This option runs before compressWhitespace and replaceWhitespace.
     */
    stripTheseCharacters?: string | null;

    /**
     * Convert the case. Supports 'upper' and 'lower'.
     * Does nothing if null.
     */
    convertCase?: 'upper' | 'lower' | null;

}
/**
 * Abstract implementation for
 * Resulting value is a string that has been cleaned up based
 * on the properties. Create unique LookupKeys for each variant
 * and register them in DataTypeParserServer.
 * Culture is not used here.
 * Features found amongst its properties: 
 * replace whitespace with character, convert case, remove extra whitespace (2 or more back-to-back), strip characters regex
 */
export abstract class CleanUpStringParserBase<TOptions extends CleanUpStringParserOptions>
    extends DataTypeParserBase<string, TOptions> {

    constructor(supportedLookupKey: string, options: TOptions) {
        super(supportedLookupKey, options);
        this._stripTheseCharactersRegExp = options.stripTheseCharacters ?
            new RegExp('[' + escapeRegExp(options.stripTheseCharacters) + ']', 'g') : 
            null;        
    }
    protected initUndefinedOptions(options: TOptions): void
    {
        super.initUndefinedOptions(options);
        if (options.compressWhitespace === undefined)
            options.compressWhitespace = false;
    }
    protected defaultEmptyStringResult(): string {
        return '';
    }    
    
    private _stripTheseCharactersRegExp: RegExp | null = null;

    /**
     * Handles trimming and returning the emptyStringResult if that's what it has.
     * Otherwise, it lets the child class work on the text.
     * @param text 
     * @param dataTypeLookupKey 
     * @param cultureId - Such as 'en-US' and 'en'
     */
    protected cleanText(text: string, dataTypeLookupKey: string, cultureId: string): string {

        text = super.cleanText(text, dataTypeLookupKey, cultureId);
        if (this._stripTheseCharactersRegExp) {
            text = text.replace(this._stripTheseCharactersRegExp, '');
        }

        if (this.options.compressWhitespace) {
            text = text.replace(/\s{2,}/g, ' ');
        }
        if (this.options.replaceWhitespace != null) {   // null or undefined
            text = text.replace(/\s/g, this.options.replaceWhitespace);
        }
        switch (this.options.convertCase) {
            case 'lower':
                text = text.toLowerCase();
                break;
            case 'upper':
                text = text.toUpperCase();
                break;
            default: // null or undefined
                break;
        }
        return text;
    }
    protected parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string>
    {
        return { value: text };
    }
}

/**
 * Abstract base class for checking for patterns in the text using a regular expression.
 * That expression will be used in the supports() function to immediately reject
 * text that it does not support. 
 */
export abstract class StrongPatternParserBase<TDataType, TOptions extends DataTypeParserOptions<TDataType>>
    extends DataTypeParserBase<TDataType, TOptions> {
    constructor(supportedLookupKey: string, options: TOptions) {
        super(supportedLookupKey, options);
    }
    /**
     * Return a RegExp for EvaluateString to use.
     */
    protected getRegExp(dataTypeLookupKey: string, cultureId: string): RegExp {
        if (!this._regexp)
            this._regexp = this.createRegExp(dataTypeLookupKey, cultureId);
        return this._regexp;
    }
    private _regexp: RegExp | null = null;

    protected abstract createRegExp(dataTypeLookupKey: string, cultureId: string): RegExp;

    /**
     * Allows the text to be changed before passing it into the regular expression,
     * with the intent on addressing minor errors that can be ignored.
     * @param text 
     * @param dataTypeLookupKey 
     * @param cultureId 
     * @returns 
     */


    /**
     * In addition to matching by dataTypeLookupKey, it also requires the text
     * to match a regular expression. The expression reflects the one or very few 
     * patterns that parse() expects to work with. By the time parse() is called, it 
     * knows the expression has the pattern and can simply work within the regexp results.
     * @param dataTypeLookupKey 
     * @param cultureId 
     * @param text 
     * @returns 
     */
    public supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
        if (super.supports(dataTypeLookupKey, cultureId, text)) {
            text = this.cleanText(text, dataTypeLookupKey, cultureId);
            if (text.length === 0)
                return true;    // parser will use emptystring 
            // We know there is some kind of number
            if (this.responsibleForThisText(dataTypeLookupKey, cultureId, text))
                return true;
        }
        return false;
    }

    /**
     * Determines if we take ownership of this text. It may ultimately be rejected by the parser.
     * For example, we want to handle all numbers even if the user has entered more than one decimal
     * @param dataTypeLookupKey 
     * @param cultureId 
     * @param text 
     * @returns 
     */
    protected responsibleForThisText(dataTypeLookupKey: string, cultureId: string, text: string): boolean
    {
        return this.getRegExp(dataTypeLookupKey, cultureId).test(text);
    }
    protected parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<TDataType> {
        let re = this.getRegExp(dataTypeLookupKey, cultureId);
        let pattern = re.exec(text);
        if (pattern)
            return this.processPattern(pattern, text, dataTypeLookupKey, cultureId);
        return { errorMessage: this.patternDidNotMatchMessage() };
    }

    protected abstract processPattern(pattern: RegExpExecArray, text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<TDataType>;
    protected abstract patternDidNotMatchMessage(): string;
}

/**
 * For strong patterns that are based on one or a few specific cultures, such as 'en-US' or 'fr-CA'.
 * The pattern is expected to be the same for all cultures.
 */
export abstract class SpecificCulturesPatternParserBase<TDataType, TOptions extends DataTypeParserOptions<TDataType>>
    extends StrongPatternParserBase<TDataType, TOptions> {

    constructor(supportedLookupKey: string, supportedCultures: Array<string>, options: TOptions) {
        super(supportedLookupKey, options);
        assertNotNull(supportedCultures, 'supportedCultures');
        if (supportedCultures.length < 1)
            throw new CodingError('Missing supportedCultures');
        this._supportedCultures = supportedCultures;
    }

    /**
     * All cultureIds that support the order and separator.
     * Note that if there is language-specific culture and
     * one that is not language specific but has the same local,
     * you can define just the one for the local because
     * the DataTypeParser service will search both language specific
     * and language agnostic when the CultureService is setup with fallbacks.
     */
    public get supportedCultures(): Array<string> {
        return this._supportedCultures;
    }
    private _supportedCultures: Array<string>;

     /**
     * Since there can be several parsers for a single lookupKey and cultureID
     * that are selected based on the text, this function is used 
     * when you want all possible candidates. It is effectively supports() without the text.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    public isCompatible(dataTypeLookupKey: string, cultureId: string): boolean
    {
        if (!super.isCompatible(dataTypeLookupKey, cultureId))
            return false;
        return this.supportedCultures.includes(cultureId);
    }
}

/**
 * Options for DatePatternParsers.
 */
export interface DateTimeCultureInfo extends Omit<DataTypeParserOptions<Date>, 'trim'>
{
    /**
     * Determines the culture specific order for year, month and day parts.
     * Always define a 3 character string with these characters: 'y', 'm', 'd'.
     * Always requires a value.
     */
    order: DatePatternOrder;

    /**
     * String separating each of the date groups in the short date pattern.
     * The "/" in mm/dd/yyyy.
     * Requires a value.
     */
    shortDateSeparator: string;    

    /**
     * Gets or sets the last year of a 100-year range that can be represented by a 2-digit year.
     * If the year is less than or equal to this number, it adds 2000.
     * If the year is greater to this number, it adds 1900.
     * For example, a value of 29 means 0..29-> 2000 - 2029; 30..99 -> 1930 - 1999
     * If not assigned, it uses 29.
     */
    twoDigitYearBreak?: number;
}
export type DatePatternOrder = 'dmy' | 'mdy' | 'ymd' | 'ydm';   // note combinations with year as the second item are N/A

export abstract class DatePatternParserBase<TOptions extends DateTimeCultureInfo>
    extends SpecificCulturesPatternParserBase<Date, TOptions> {

    constructor(supportedLookupKey: string, supportedCultures: Array<string>, format: TOptions,
        utc: boolean = true
    ) {
        super(supportedLookupKey, supportedCultures, format);
        assertNotNull(format.order, 'order');
        this._utc = utc;
    }
    protected initUndefinedOptions(options: TOptions): void
    {
        super.initUndefinedOptions(options);
        if (typeof options.twoDigitYearBreak !== 'number')
            options.twoDigitYearBreak = 29;
    }
    protected defaultEmptyStringResult(): Date | null {
        return null;
    }

    /**
     * When true, the Date object is UTC. When false, it is local.
     * Assigned through the constructor.
     * Defaults to true (UTC on).
     * This is not part of the options object because its independent of 
     * cultureinfo rules. Its a usage decision by the user.
     */
    public get utc(): boolean {
        return this._utc;
    }
    private _utc: boolean;

     /**
     * Determines the culture specific order for year, month and day parts.
     * Always define a 3 character string with these characters: 'y', 'm', 'd'.
     */
    protected get order(): DatePatternOrder {
        return this.options.order;
    }


    /**
     * Creates the Date object or if unable, returns an error message in the result.
     * @param year - Expects 4 digit year
     * @param month - 0 to 11
     * @param day - 1 to 31
     */
    protected toDate(year: number, month: number, day: number): DataTypeResolution<Date>
    {
        if (year < 100)
            year = year <= this.options.twoDigitYearBreak! ?
                year + 2000 :
                year + 1900;        
        let attempt: Date;
        if (this.utc)
            attempt = new Date(Date.UTC(year, month, day));
        else
            attempt = new Date(year, month, day);
        if (isNaN(attempt.getTime()))
            return { errorMessage: this.patternDidNotMatchMessage() };
        // double-check for overflows
        if (this.utc && attempt.getUTCFullYear() === year &&
            attempt.getUTCMonth() === month &&
            attempt.getUTCDate() === day)
            return { value: attempt };
        if (!this.utc && attempt.getFullYear() === year &&
            attempt.getMonth() === month &&
            attempt.getDate() === day)
            return { value: attempt };
        return { errorMessage: DatePatternParserBase.invalidDateMessage };
    }
    protected patternDidNotMatchMessage(): string
    {
        return DatePatternParserBase.badDataMessage;
    }

    public static readonly badDataMessage = 'Expecting a date';
    /**
     * For when you have all numbers for y/m/d, but put together to form
     * a date and its not a legal date. For example, m=13, d=0, or the 
     * day is after the last day of the month.
     */
    public static readonly invalidDateMessage = 'Not a valid date';
}

/**
 * Effectively a template for the culture's rules of parsing numbers.
 * The template includes more options than needed by some of the subclasses,
 * such as currencySymbol and percentSymbol. This allows for a single
 * definition per culture to be used in all parsers that inherit NumberParserBase.
 * This template should not have options that are expected to be set by 
 * an inherited class. For example, stripTheseStrings property is a
 * parameter of the constructor, not an option.
 */
export interface NumberCultureInfo extends Omit<DataTypeParserOptions<number>, 'trim'>
{
    /**
     * The character for the decimal point.
     * If you don't support decimal values in the desired data type
     * (like LookupKey.Integer), let the parser still recognize the decimal separator
     * and create a number with it. Then use a validator to reject it.
     * Requires a value
     */
    decimalSeparator: string;

    /**
     * The character for the thousands separator or null if the culture 
     * lacks a thousands separator.
     */
    thousandsSeparator?: string | null;

    /**
     * The character for the culture's negative symbol.
     * Note that some number formats allow two symbols: minus
     * and parenthesis. Parenthesis are automatically recognized
     * as negative for all cultures and do not need to be here.
     * If you have a ValueHost with data type=LookupKey.Integer,
     * still set this up and leg
     * If you don't support negative values in the desired data type
     * (like LookupKey.PositiveNumber), let the parser still recognize the negative separator
     * and create a number with it. Then use a validator to reject it.
     */
    negativeSymbol: string;    

    /**
     * The currency symbol for the culture.
     * It will only be used on specific subclasses that 
     * transfer its value into the NumberParserBase.stripTheseStrings.
     */
    currencySymbol: string;   
    
    /**
     * The percent symbol for the culture.
     * It will only be used on specific subclasses that 
     * transfer its value into the NumberParserBase.stripTheseStrings.
     */
    percentSymbol: string;        

    /**
     * When true, the user can input parenthesis to indicate a negative value.
     * Typically true for currency.
     */
    parenthesisAsNegative?: boolean;
}

/**
 * Abstract class for creating parsers that intake strings containing a number
 * and return that number, after stripping out esthetics like thousands separators,
 * formatting characters, etc. 
 * 
 * It always accepts decimal numbers and negative numbers. If you don't want those,
 * use a validator to reject the number formed by this parser.
 * 
 * Expect to register multiple instances of its subclasses with DataTypeParsersServer,
 * to cover each configuration for the cultures you support.
 * new NumberParser('Number', ['en-US', 'en-CA']...);
 * new NumberParser('Number', ['en-GB']...);
 */
export abstract class NumberParserBase<TOptions extends NumberCultureInfo>
    extends SpecificCulturesPatternParserBase<number, TOptions>
{
    constructor(supportedLookupKey: string, supportedCultures: Array<string>, options: TOptions,
        stripTheseStrings?: string | Array<string>)
    {
        super(supportedLookupKey, supportedCultures, options);
        this.assertMustHaveCharacter(options.decimalSeparator, 'decimalSeparator'); 
        this.assertMustHaveCharacter(options.negativeSymbol, 'negativeSymbol');
        // leave currencySymbol and percentSymbol for subclasses to assert

        this._stripTheseStrings = stripTheseStrings ?? [];
        this._stripTheseStringsRegExp = undefined;       
    }

    protected initUndefinedOptions(options: TOptions): void
    {
        super.initUndefinedOptions(options);
    }
    protected defaultEmptyStringResult(): number | null {
        return 0;
    }

    /**
     * Any special formatting strings that are meaningful to the user
     * but can be discarded during parsing. Consider the currency symbol
     * and percent symbol. Don't use this for negative character as once
     * identified as negative, the all negative symbols are stripped prior to parsing
     * and the resolved number is still negated.
     */
    protected get stripTheseStrings(): string | Array<string> {
        return this._stripTheseStrings;
    }
    protected set stripTheseStrings(value: string | Array<string>) {
        this._stripTheseStrings = value;
    }
    private _stripTheseStrings: string | Array<string>;    

    /**
     * In addition to those provided by the user, this will include the thousands separator,
     * negative symbol, and parenthesis (alternative negative) as all of these are not used 
     * by the parser. Negative state will have been identified prior using this expression,
     * and applied to the final number later.
     */
    private _stripTheseStringsRegExp: RegExp | null | undefined = undefined;   
    
    public createSTSRegExp(): RegExp | null
    {
        let sts = this.stripTheseStrings;
       /* istanbul ignore next */ // this error is defensive, but stripTheseStrings is initialized
        if (!sts)
            sts = [];

        if (!Array.isArray(sts))
            sts = [sts];

        sts.push(this.options.negativeSymbol);
        if (this.options.parenthesisAsNegative) {
            sts.push('(');
            sts.push(')');
        }
        
        if (this.options.thousandsSeparator != null)    // null or undefined
            sts.push(this.options.thousandsSeparator);

        let pattern = '';
        sts.forEach((s) => {
            if (pattern.length > 0)
                pattern += '|';
            pattern += '(' + escapeRegExp(s) + ')';
        });

        return new RegExp(pattern, 'g');
    }

    public parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<number | null> {
        text = super.applyTrimming(text);
        if (text.length === 0)
            return { value: this.options.emptyStringResult };        

        if (this.cannotBeNumber(text))
            return { errorMessage: this.patternDidNotMatchMessage() };
        return super.parse(text, dataTypeLookupKey, cultureId);
    }

    /**
     * Expect the output to be setup for a regular expression that looks for either:
     * digits + period + digits
     * minus + digits + period + digits
     * digits
     * minus + digits
     * Anything else will be rejected by the regular expression as invalid.
     * @param text 
     * @param dataTypeLookupKey 
     * @param cultureId 
     * @returns 
     */
    protected cleanText(text: string, dataTypeLookupKey: string, cultureId: string): string {
        text = super.cleanText(text, dataTypeLookupKey, cultureId);

        let isNegative = this.isNegative(text);

        if (this._stripTheseStringsRegExp === undefined)
            this._stripTheseStringsRegExp = this.createSTSRegExp();
        if (this._stripTheseStringsRegExp) {
            text = text.replace(this._stripTheseStringsRegExp, '');
            text = text.trim(); // does not matter what the trim option has. We want to account for spaces left as formatting around the stripped out characters like "1 %" and "$ 1.00"
        }
        if (this.options.decimalSeparator !== '.')
            text = text.replace(this.options.decimalSeparator, '.');
        if (text[0] === '.')    // starts with a decimal. Need a lead zero
            text = '0' + text;
        // at this point, there should be no thousands separators, negative symbols, special characters.
        // Ideally it has only digits and period as decimal separator. It is possible there
        // are several periods, and those will be identified by the regexp later.

        if (isNegative)
            text = '-' + text.trimStart();
        return text; // does not matter what the trim option has. We want to account for spaces left by 
    }
    protected isNegative(text: string): boolean
    {
        return text.includes(this.options.negativeSymbol) || (this.options.parenthesisAsNegative ? /\(.+\)/.test(text) : false);
    }

    /**
     * Responsible for anything that cannot be a number and 
     * number patterns that conform to the current options, like have
     * a currencysymbol only when its setup. When its a number that 
     * cannot work with the options, reject it so another registered number parser
     * can deal with it. That way, the NumberParser doesn't try to handle
     * what was intended for CurrencyParser or PercentageParser.
     * @param dataTypeLookupKey 
     * @param cultureId 
     * @param text 
     * @returns 
     */
    protected responsibleForThisText(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
       
        // we'll always handle anything that cannot be converted to a number.
        // The user requested the NumberParser. Therefore it should return an error message
        // during parse().
        // At this point, supports() has called cleanText which NumberParserBase 
        // makes it as close to a number as possible.
        // NOTE: parseFloat seems like a good idea but considers digits followed by non-digits as valid by only keeping the digits
        if (this.cannotBeNumber(text))
            return true;
        return super.responsibleForThisText(dataTypeLookupKey, cultureId, text);
    }

    /**
     * Determine if the text will never be considered a number during parsing.
     * We want to give that to the parser and let it report an error.
     * @param text 
     * @returns 
     */
    protected cannotBeNumber(text: string): boolean
    {
        // must have at least one digit
        if (!/\d/.test(text))
            return true;
        if (hasLetters(text))   // its possible to have currency in letters like $1.00USD. This isn't supported
            return true;
        const negativeSymbols = this.options.negativeSymbol + (this.options.parenthesisAsNegative ? '()' : '');
        const onlyOnceChars = this.options.decimalSeparator +
            negativeSymbols;
        const alwaysLegalChars = onlyOnceChars +
            (this.options.thousandsSeparator ?? '') +
            ' ';    // spaces are always legal at this point
        const allowedChars = alwaysLegalChars +
            (this.options.currencySymbol ?? '') +
            (this.options.percentSymbol ?? '');
        if (!onlyTheseCharacters(text, allowedChars, '\\d'))
            return true;
        if (hasMultipleOccurances(text, onlyOnceChars))
            return true;
        const notBetweenDigits = negativeSymbols;
        if (new RegExp('\\d[' + escapeRegExp(notBetweenDigits) + ']+\\d').test(text))
            return true;
        if (this.options.parenthesisAsNegative)
        {
            let leftPos = text.indexOf('(');
            let rightPos = text.indexOf(')');
            if (leftPos !== rightPos)   // we have at least one. If none, -1 === -1
                if (leftPos === -1 ||
                    rightPos === -1 || // only 1 
                    leftPos > rightPos) // left after right
                    return true;
        }
        return false;
    }
    /**
     * Expects the string to be:
     * optional minus (in group named "neg")
     * 1 or more digits, allowing for lead zeros (in group named "whole")
     * optional period
     * if period, optional 1 or more digits allowing for trailing zeros (in group named "decimal").
     * This resulting pattern should completely cover the text except for lead and trailing whitespace.
     * After whitespace trimming, we should be able to use parseFloat or parseInt on the text.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    protected createRegExp(dataTypeLookupKey: string, cultureId: string): RegExp {
        return /^\s*(?<neg>\-?)(?<whole>\d{1,})?(\.(?<decimal>\d{1,})?)?\s*$/;
    }
    protected processPattern(pattern: RegExpExecArray, text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<number> {
        return { value: parseFloat(text) };
    }

    protected patternDidNotMatchMessage(): string
    {
        return NumberParserBase.badNumberMessage;
    }

    public static readonly badNumberMessage = 'Expecting a number';
}

export abstract class PercentageParserBase extends NumberParserBase<NumberCultureInfo>
{
    /**
     * 
     * @param supportedCultures 
     * @param options - Note omits currencySymbol for user experience with intellisense
     * It can still be passed in and will be ignored.
     */
    constructor(supportsLookupKey: string, supportedCultures: Array<string>, options: Omit<NumberCultureInfo, 'currencySymbol'>) {
        super(supportsLookupKey, supportedCultures, options as NumberCultureInfo);
        this.assertMustHaveCharacter(options.percentSymbol, 'percentSymbol');
        this.stripTheseStrings = [options.percentSymbol];
    }
}

/**
 * Options for BooleanParserBase
 */
export interface BooleanParserOptions extends Omit<DataTypeParserOptions<boolean>, 'trim'>
{
    /**
     * One or more strings that must match (case insensitive) to identify the value 
     * as true. Required
     */
    trueValues: Array<string>

    /**
     * One or more strings that must match (case insensitive) to identify the value 
     * as false. The empty string is a valid value for false, if you supply it.
     * Required.
     */
    falseValues: Array<string>;
}

/**
 * For LookupKey.Boolean. It handles a variety of strings for true and false
 * determined by the parameters.
 * Since strings are language specific, register instances of BooleanParser
 * for each language that your app supports.
 */
export abstract class BooleanParserBase<TOptions extends BooleanParserOptions> extends DataTypeParserBase<boolean, TOptions>
{
    constructor(supportsLookupKey: string, supportedCultures: Array<string>,
        options: TOptions)
    {
        super(supportsLookupKey, options);
        assertNotNull(options.trueValues, 'trueValues');
        assertNotNull(options.falseValues, 'falseValues');
        assertNotNull(supportedCultures, 'supportedCultures');
        if (supportedCultures.length < 1)
            throw new CodingError('Missing supportedCultures');
        this._supportedCultures = supportedCultures;

        if (options.trueValues.length === 0)
            throw new CodingError('Must have at least one trueValue');
        if (options.falseValues.length === 0)
            throw new CodingError('Must have at least one falseValue');

        this._trueValuesLC = options.trueValues.map((val)=> val.toLowerCase());
        this._falseValuesLC = options.falseValues.map((val) => val.toLowerCase());

    }

    protected initUndefinedOptions(options: TOptions): void
    {
        super.initUndefinedOptions(options);
    }
    /**
     * All cultureIds that support the order and separator.
     * Note that if there is language-specific culture and
     * one that is not language specific but has the same local,
     * you can define just the one for the local because
     * the DataTypeParser service will search both language specific
     * and language agnostic when the CultureService is setup with fallbacks.
     */
    public get supportedCultures(): Array<string> {
        return this._supportedCultures;
    }
    private _supportedCultures: Array<string>;
    /**
     * Since there can be several parsers for a single lookupKey and cultureID
     * that are selected based on the text, this function is used 
     * when you want all possible candidates. It is effectively supports() without the text.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    public isCompatible(dataTypeLookupKey: string, cultureId: string): boolean
    {
        if (!super.isCompatible(dataTypeLookupKey, cultureId))
            return false;
        return this.supportedCultures.includes(cultureId);
    }
    
    private _trueValuesLC: Array<string>;
    private _falseValuesLC: Array<string>;

    protected defaultEmptyStringResult(): boolean {
        return false;
    }
    protected parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<boolean> {
        // at this point, the text should have been trimmed unless the user explicitly changed the trim property
        text = text.toLowerCase();
        if (this._trueValuesLC.includes(text))
            return { value: true };
        if (this._falseValuesLC.includes(text))
            return { value: false };

        return { errorMessage: this.patternDidNotMatchMessage() };

    }    
    protected patternDidNotMatchMessage(): string
    {
        return BooleanParserBase.badTextMessage;
    }

    public static readonly badTextMessage = 'Invalid value';  
}
