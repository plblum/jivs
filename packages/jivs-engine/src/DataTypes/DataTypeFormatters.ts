/**
 * Implements these DataTypeFormatters:
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!StringFormatter | StringFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!CapitalizeStringFormatter | CapitalizeStringFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!UppercaseStringFormatter | UppercaseStringFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!LowercaseStringFormatter | LowercaseStringFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!NumberFormatter | NumberFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!IntegerFormatter | IntegerFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!CurrencyFormatter | CurrencyFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!PercentageFormatter | PercentageFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!Percentage100Formatter | Percentage100Formatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!BooleanFormatter | BooleanFormatter},
 * {@link jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters!DateTimeFormatterBase | DateTimeFormatterBase}
 * 
 * @module jivs-engine/DataTypes/ConcreteClasses/DataTypeFormatters
 */

import { DataTypeResolution } from '../Interfaces/DataTypes';
import { cultureLanguageCode } from '../Services/CultureService';
import { LookupKey } from './LookupKeys';
import { DataTypeFormatterBase } from './DataTypeFormatterBase';

/**
 * For LookupKey.String. Culture neutral.
 */
export class StringFormatter extends DataTypeFormatterBase {
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.String;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        return this.prepString(value);
    }
}

/**
 * For LookupKey.Capitalize.
 * Changes the first letter to uppercase. Leaves the rest alone.
 * Uses the Javascript toLocaleUpperCase(cultureId) function
 */
export class CapitalizeStringFormatter extends DataTypeFormatterBase
{
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Capitalize;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        const result = this.prepString(value);
        if (result.value && result.value.length > 0)
            result.value = result.value[0].toLocaleUpperCase(cultureId) +
                result.value.substring(1);
        return result;
    }    
}
/**
 * For LookupKey.Uppercase.
 * Converts all characters to uppercase.
 * Uses the Javascript toLocaleUpperCase(cultureId) function
 */
export class UppercaseStringFormatter extends DataTypeFormatterBase
{
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Uppercase;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        const result = this.prepString(value);
        if (result.value && result.value.length > 0)
            result.value = result.value.toLocaleUpperCase(cultureId);
        return result;
    }    
}
/**
 * For LookupKey.Lowercase.
 * Converts all characters to lowercase.
 * Uses the Javascript toLocaleLowerCase(cultureId) function
 */
export class LowercaseStringFormatter extends DataTypeFormatterBase
{
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Lowercase;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        const result = this.prepString(value);
        if (result.value && result.value.length > 0)
            result.value = result.value.toLocaleLowerCase(cultureId);
        return result;
    }    
}

/**
 * Base class for formatting numbers using the Intl library
 * with its NumberFormat feature.
 * Subclasses will generally use its FormatNumber method,
 * which needs to have Intl.NumberFormatOptions to determine
 * how Intl.NumberFormat will work.
 * Pass the options in the constructor or omit the options
 * for default formatting.
 */
export abstract class NumberFormatterBase extends DataTypeFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super();
        this._options = options ?? this.getDefaultOptions();
    }
    protected get options(): Intl.NumberFormatOptions
    {
        return this._options;
    }
    private readonly _options: Intl.NumberFormatOptions;
    /**
     * Provide the default NumberFormatOptions for use with
     * Intl.NumberFormat.
     */
    protected abstract getDefaultOptions(): Intl.NumberFormatOptions;

    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        return this.formatNumber(value, cultureId);
    }    

    /**
     * If the value is a Number, it uses Intl.NumberFormat.
     * If it is null, it returns the empty string.
     * Anything else is an error.
     * @param value 
     * @param cultureId 
     * @param options - if Null, it uses the options supplied in the constructor
     * or DefaultOptions function.
     * @returns 
     */
    protected formatNumber(value: any, cultureId: string,
        options?: Intl.NumberFormatOptions | null): DataTypeResolution<string> {
        if (typeof value === 'number')
            return {
                value: Intl.NumberFormat(cultureId, options ?? this.options).format(value)
            };
        else if (value == null)   // null/undefined
            return { value: '' };
        else
            return this.returnError(
                'Not a number',
                NumberFormatterBase.NotANumberErrorCode
            );
    }

    public static readonly NotANumberErrorCode = 'NotANumber';
}

/**
 * For LookupKey.Number.
 * Converts any number using the Intl library's NumberFormat feature.
 */
export class NumberFormatter extends NumberFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super(options);
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Number;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    protected getDefaultOptions(): Intl.NumberFormatOptions {
        return {
            signDisplay: 'auto'
        };
    }
}

/**
 * For LookupKey.Integer.
 * Converts any number using the Intl library's NumberFormat feature.
 */
export class IntegerFormatter extends NumberFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super(options);
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Integer;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    protected getDefaultOptions(): Intl.NumberFormatOptions {
        return {
            signDisplay: 'auto',
            maximumFractionDigits: 0
        };
    }

    // public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
    //     if (typeof value === 'number')
    //         value = Math.trunc(value);
    //     super.format(value, dataTypeLookupKey, cultureId);
    // }
}

/**
 * For LookupKey.Currency.
 * Formats the number as a currency. 
 * Converts any number using the Intl library's NumberFormat feature. 
 * It shows the currency symbol,
 * which is not actually built into the Intl library.
 * Thus we need to support it by letting you supply
 * a CurrencyCode into the constructor, along with a list of
 * cultures that support the code.
 */
export class CurrencyFormatter extends NumberFormatterBase
{
    constructor(defaultCurrencyCode: string,
        options?: Intl.NumberFormatOptions | null,
        cultureToCurrencyCode?: { [cultureId: string]: string })
    {
        super(options);
        this._cultureToCurrencyCode = cultureToCurrencyCode ?? null;
        this._defaultCurrencyCode = defaultCurrencyCode;
    }
    private readonly _defaultCurrencyCode: string;
    protected getDefaultOptions(): Intl.NumberFormatOptions {
        return {
            style: 'currency',
            currency: 'DEFAULT'
        };
    }
    private readonly _cultureToCurrencyCode: { [cultureId: string]: string } | null;

    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Currency;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }


    public override format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        let options = this.options;
        if (options.currency === 'DEFAULT') {
            options = { ...options, currency: this.resolveCurrencyCode(cultureId) };
        }
        return this.formatNumber(value, cultureId, options);
    }    
    protected resolveCurrencyCode(cultureId: string): string
    {
        let currencyCode = this._defaultCurrencyCode;
        if (this._cultureToCurrencyCode)
            currencyCode = this._cultureToCurrencyCode[cultureId] ??
                this._cultureToCurrencyCode[cultureLanguageCode(cultureId)] ??
                this._defaultCurrencyCode;
        return currencyCode;
    }
}

/**
 * For LookupKey.Percentage.
 * Converts any number using the Intl library's NumberFormat feature.
 * Expects the value 1 to be 100%.
 */
export class PercentageFormatter extends NumberFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.NumberFormatOptions {
        return {
            style: 'percent'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Percentage;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

}

/**
 * For LookupKey.Percentage100.
 * Converts any number using the Intl library's NumberFormat feature.
 * Expects the value 100 to be 100%.
 */
export class Percentage100Formatter extends NumberFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.NumberFormatOptions {
        return {
            style: 'percent'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Percentage100;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    // Intl library treats 1.0 as 100. So we adjust the value.
    public override format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        if (typeof value === 'number')
            value = value / 100.0;
        return super.format(value, dataTypeLookupKey, cultureId);
    }        
}

/**
 * Base class for boolean localized formatters. Booleans are unusual
 * in that they aren't normally shown, and when they are shown, they
 * need words meaningful to the user, not "true" and "false".
 * "yes" and "no", "on" and "off", "enabled"  and "disabled" are better.
 * This base class lets you supply a list of cultures and the text
 * that you want to use for true and false.
 * If not supplied, it defaults to "true" and "false".
 * To provide localization of "true" and "false", set up
 * JivsServices.TextLocalizerService with text keys, cultures and
 * translations. Then provide values for TrueLabel and FalseLabel
 * when registering this class in the dataTypeFormatterService.
 */
export abstract class BooleanFormatterBase extends DataTypeFormatterBase
{
    /**
     * Constructor
     * @param dataTypeLookupKey - Formatter lookup key must match this value
     * @param trueLabel - text for 'true'
     * @param falseLabel - text for 'false'
     * @param trueLabell10n - localization key for trueLabel
     * @param falseLabell10n - localization key for falseLabel
     */
    constructor(dataTypeLookupKey: string,
        trueLabel?: string, falseLabel?: string,
        trueLabell10n?: string, falseLabell10n?: string)
    {
        super();
        this._dataTypeLookupKey = dataTypeLookupKey ?? LookupKey.Boolean;
        const defaults = this.getDefaultLabels();
        this._trueLabel = trueLabel ?? defaults.trueLabel ?? 'true';
        this._falseLabel = falseLabel ?? defaults.falseLabel ?? 'false';
        this._trueLabell10n = trueLabell10n ?? defaults.trueLabell10n ?? null;
        this._falseLabell10n = falseLabell10n ?? defaults.falseLabell10n ?? null;
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return this._dataTypeLookupKey;
    }
    private readonly _dataTypeLookupKey: string;
    /**
     * Text shown the user for a value of true.
    * To provide localization of "true" and "false", set up
    * JivsServices.TextLocalizerService with text keys, cultures and
    * translations. Then provide values for TrueLabel and FalseLabel
    * when registering this class in the dataTypeFormatterService.
     */
    public get trueLabel(): string
    {
        return this._trueLabel;
    }
    private readonly _trueLabel: string;

    /**
     * Localization key for TrueLabel. Its value will be matched to an entry
     * made to JivsServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the TrueLabel property is used.
     */

    public get trueLabell10n(): string | null
    {
        return this._trueLabell10n;
    }
    private readonly _trueLabell10n: string | null;
    /**
    * Text shown the user for a value of false
    * To provide localization of "true" and "false", set up
    * JivsServices.TextLocalizerService with text keys, cultures and
    * translations. Then provide values for TrueLabel and FalseLabel
    * when registering this class in the dataTypeFormatterService.
      */
    public get falseLabel(): string
    {
        return this._falseLabel;
    }
    private readonly _falseLabel: string;

    /**
     * Localization key for FalseLabel. Its value will be matched to an entry
     * made to JivsServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the FalseLabel property is used.
     */

    public get falseLabell10n(): string | null
    {
        return this._falseLabell10n;
    }
    private readonly _falseLabell10n: string | null;

    protected abstract getDefaultLabels(): DefaultLabelsForBoolean;    

    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        if (typeof value === 'boolean') {
            return this.formatBoolean(value, cultureId);
        }
        else if (value == null)   // null/undefined
            return { value: '' };
        else
            return this.returnError('Not a boolean', BooleanFormatterBase.NotABooleanErrorCode);
    }
    protected formatBoolean(value: boolean, cultureId: string): DataTypeResolution<string>
    {
        let text = value ? this.trueLabel : this.falseLabel;
        const l10n = value ? this.trueLabell10n : this.falseLabell10n;
        if (this.hasServices) {
            text = this.services.textLocalizerService.localize(
                cultureId, l10n, text)!;
        }
        return { value: text };
    }

    public static readonly NotABooleanErrorCode = 'NotABoolean';
}
export interface DefaultLabelsForBoolean
{
    trueLabel: string;
    falseLabel: string;
    trueLabell10n: string;
    falseLabell10n: string;
}

/**
 * Supports LookupKey.Boolean, and provides 'true' and 'false' labels
 * for all cultures unless you provide alternatives into the constructor
 * or setup localization with the TextLocalizerService.
 * It defaults to 'TRUE' as the localization key for true
 * and 'FALSE' as the localization key for false.
 * LookupKey: "Boolean" or whatever the user supplies.
 */
export class BooleanFormatter extends BooleanFormatterBase
{
    /**
     * Constructor
     * @param dataTypeLookupKey - Formatter lookup key must match this value
     * @param trueLabel - text for 'true'
     * @param falseLabel - text for 'false'
     * @param trueLabell10n - localization key for trueLabel
     * @param falseLabell10n - localization key for falseLabel
     */
    constructor(dataTypeLookupKey: string,
        trueLabel?: string, falseLabel?: string,
        trueLabell10n?: string, falseLabell10n?: string)
    {
        super(dataTypeLookupKey ?? LookupKey.Boolean, trueLabel, falseLabel,
            trueLabell10n, falseLabell10n);
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    protected getDefaultLabels(): DefaultLabelsForBoolean {
        return {
            trueLabel: 'true',
            falseLabel: 'false',
            trueLabell10n: 'TRUE',
            falseLabell10n: 'FALSE'
        };
    }
}

/**
 * Base class for formatting Date objects using the Intl library
 * with its DateTimeFormat feature.
 * Subclasses will generally use its FormatDateTime method,
 * which needs to have Intl.DateTimeFormatOptions to determine
 * how Intl.DateTimeFormat will work.
 * Pass the options in the constructor or omit the options
 * for default formatting.
 */
export abstract class DateTimeFormatterBase extends DataTypeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super();
        this._options = options ?? this.getDefaultOptions();
    }
    protected get options(): Intl.DateTimeFormatOptions
    {
        return this._options;
    }
    private readonly _options: Intl.DateTimeFormatOptions;
    /**
     * Provide the default DateTimeFormatOptions for use with
     * Intl.DateTimeFormat.
     */
    protected abstract getDefaultOptions(): Intl.DateTimeFormatOptions;

    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        return this.formatDateTime(value, cultureId);
    }    

    /**
     * If the value is a Date object, it uses Intl.DateTimeFormat.
     * If it is null, it returns the empty string.
     * Anything else is an error.
     * @param value 
     * @param cultureId 
     * @param options - if Null, it uses the options supplied in the constructor
     * or DefaultOptions function.
     * @returns 
     */
    protected formatDateTime(value: any, cultureId: string,
        options?: Intl.DateTimeFormatOptions | null): DataTypeResolution<string> {
        if (value instanceof Date)
            return {
                value: Intl.DateTimeFormat(cultureId, this.options).format(value)
            };
        else if (value == null)   // null/undefined
            return { value: '' };
        else
            return this.returnFormatDateTimeError();
    }
    protected returnFormatDateTimeError(): DataTypeResolution<string> {
        return this.returnError('Not a date', DateTimeFormatterBase.NotADateErrorCode);
    }

    public static readonly NotADateErrorCode = 'NotADate';
}
/**
 * For LookupKey.DateTime. 
 * Uses Intl library's DateTimeFormat to Y, M, D, hours, and minutes,
 * but not seconds in digits, unless you provide alternatives
 * in the constructor.
 */
export class DateTimeFormatter extends DateTimeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.DateTime;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For LookupKey.Date and LookupKey.ShortDate.
 * Uses Intl library's DateTimeFormat to Y, M, D as digits (short date format)
 * unless you provide alternatives in the constructor.
 */
export class DateFormatter extends DateTimeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return [LookupKey.Date, LookupKey.ShortDate];
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public override supports(dataTypeLookupKey: string, cultureId: string): boolean {
        return (dataTypeLookupKey === LookupKey.ShortDate || super.supports(dataTypeLookupKey, cultureId));
    }

}
/**
 * For LookupKey.AbbrevDate. 
 * Uses Intl library's DateTimeFormat to Month as abbreviated name, 
 * Y and D as digits (abbreviated date format)
 * unless you provide alternatives in the constructor.
 */
export class AbbrevDateFormatter extends DateTimeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.AbbrevDate;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For LookupKey.AbbrevDOWDate. 
 * Uses Intl library's DateTimeFormat to Month as abbreviated name, 
 * Day of week as abbreviated name, Y and D as digits (abbreviated date format)
 * unless you provide alternatives in the constructor.
 */
export class AbbrevDOWDateFormatter extends DateTimeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.AbbrevDOWDate;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For LookupKey.LongDate. 
 * Uses Intl library's DateTimeFormat to Month as full name, 
 * Y and D as digits (long date format)
 * unless you provide alternatives in the constructor.
 */
export class LongDateFormatter extends DateTimeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.LongDate;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For LookupKey.LongDOWDate. 
 * Uses Intl library's DateTimeFormat to Month as full name, 
 * Day of week as full name, Y and D as digits (abbreviated date format)
 * unless you provide alternatives in the constructor.
 */
export class LongDOWDateFormatter extends DateTimeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.LongDOWDate;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }

}

/**
 * For TimeofDayLookupKey. 
 * Uses Intl library's DateTimeFormat to show hours and minutes as digits,
 * omitted seconds, unless you provide alternatives in the constructor.
 */
export class TimeofDayFormatter extends DateTimeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            hour: 'numeric',
            minute: 'numeric'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.TimeOfDay;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }
    protected override returnFormatDateTimeError(): DataTypeResolution<string>
    {
        return this.returnError('Not a time', TimeofDayFormatter.NotATimeErrorCode);
    }
    public static readonly NotATimeErrorCode = 'NotATime';
}

/**
 * For TimeofDayHMSLookupKey. 
 * Uses Intl library's DateTimeFormat to show hours, minutes, and seconds as digits,
 * unless you provide alternatives in the constructor.
 */
export class TimeofDayHMSFormatter extends DateTimeFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected getDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };
    }
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.TimeOfDayHMS;
    }

    protected supportsCulture(cultureId: string): boolean
    {
        return true;
    }
    protected override returnFormatDateTimeError(): DataTypeResolution<string>
    {
        return this.returnError('Not a time', TimeofDayFormatter.NotATimeErrorCode);
    }
}
