/**
 * Provides conversion between a native type and its formatted and localized string 
 * representation. Each is associated with a lookup key.
 * For example, the Date object has several of these implementations.
 * LookupKey="Date" provides a localized short date pattern through DateLocalizedFormatter.
 * LookupKey="AbbrevDate" provides the same but in abbreviated date pattern through AbbrevDateLocalizedFormatter.
 * Create implementations for each dataTypeLookupKey that needs localized formatting.
 * @module DataTypes/DataTypeLocalizedFormatters
 */

import { IDataTypeLocalizedFormatter, IDataTypeResolution } from "../Interfaces/DataTypes";
import { IServicesAccessor, IValidationServices } from "../Interfaces/ValidationServices";
import { CodingError } from "../Utilities/ErrorHandling";
import { CultureLanguageCode } from "../Utilities/Utilities";
import { AbbrevDOWDateLookupKey, AbbrevDateLookupKey, BooleanLookupKey, CapitalizeStringLookupKey, CurrencyLookupKey, DateLookupKey, DateTimeLookupKey, IntegerLookupKey, LongDOWDateLookupKey, LongDateLookupKey, LowercaseStringLookupKey, NumberLookupKey, Percentage100LookupKey, PercentageLookupKey, ShortDateLookupKey, StringLookupKey, TimeOfDayHMSLookupKey, TimeOfDayLookupKey, UppercaseStringLookupKey, YesNoBooleanLookupKey } from "./LookupKeys";

/**
 * Abstract implementation of IDataTypeLocalizedFormatter.
 */
export abstract class DataTypeLocalizedFormatterBase implements IDataTypeLocalizedFormatter, IServicesAccessor
{
    /**
     * Services accessor.
     * Note: Not passed into the constructor because this object should be created before
     * ValidationServices itself. So it gets assigned when ValidationService.DataTypeServices is assigned a value.
     */
    public get Services(): IValidationServices
    {
        if (!this._services)
            throw new CodingError('Register with DataTypeServices first.');
        return this._services;
    }
    public set Services(services: IValidationServices)
    {
        this._services = services;
    }
    private _services: IValidationServices | null = null;
    
    /**
     * The DataTypeLookup key(s) that this class supports.
     */
    protected abstract get ExpectedLookupKeys(): string | Array<string> | Array<string>;

    /**
     * Return true so long as the CultureId is supported by this class.
     * @param cultureId 
     */
    protected abstract SupportsCulture(cultureId: string): boolean;
    /**
     * Evaluates the parameters to determine if its Format method should handle the value
     * with those same parameters.
     * It should always match the DataTypeLookupKey. 
     * It does not have to evaluate the cultureID, as there are implementations
     * where the Format function handles eve
     * @param dataTypeLookupKey 
     * @param cultureId - Such as 'en-US' and 'en'
     * @returns Use its Format method when true. Do not use Format when false.
     */
    public Supports(dataTypeLookupKey: string, cultureId: string): boolean {
        return this.MatchingLookupKeys(dataTypeLookupKey, this.ExpectedLookupKeys) &&
            this.SupportsCulture(cultureId);
    }

    /**
     * Creates a formatted string for the value, applying the goals of the DataTypeLookupKey
     * and making it culture specific.
     * @param value 
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    public abstract Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string>;
    
    protected prepString(value: any): IDataTypeResolution<string> {
        if (value == null)    // null/undefined
            return { Value: '' };
        // filter out invalid values
        if (typeof value === 'object')
            return { ErrorMessage: 'Not a string or primitive' }
        return {
            Value: value != null // null/undefined
                ? value.toString() : ''
        };
    }    

    /**
     * LookupKeys must be case insensitive matched.
     * @param luk1 
     * @param luk2 
     * @returns 
     */
    protected MatchingLookupKeys(luk1: string, luk2: string | Array<string>): boolean
    {
        function Try(a: string, b: string): boolean
        {
            if (a.length === b.length)    // to avoid converting two strings when its obvious we don't need to
            {
                return a.toLocaleLowerCase() === b.toLocaleLowerCase();
            }
            return false;            
        }
        if (Array.isArray(luk2))
        {
            for (let i = 0; i < luk2.length; i++)
                if (Try(luk1, luk2[i]))
                    return true;
        }
        else if (Try(luk1, luk2))
            return true;
        return false;
    }
}
/**
 * For StringLookupKey. Culture neutral.
 */
export class StringLocalizedFormatter extends DataTypeLocalizedFormatterBase {
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return StringLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        return this.prepString(value);
    }
}

/**
 * For CapitalizeStringLookupKey.
 * Changes the first letter to uppercase. Leaves the rest alone.
 * Uses the Javascript toLocaleUpperCase(cultureId) function
 */
export class CapitalizeStringLocalizedFormatter extends DataTypeLocalizedFormatterBase
{
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return CapitalizeStringLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        let result = this.prepString(value);
        if (result.Value && result.Value.length > 0)
            result.Value = result.Value[0].toLocaleUpperCase(cultureId) +
                result.Value.substring(1);
        return result;
    }    
}
/**
 * For UppercaseStringLookupKey.
 * Converts all characters to uppercase.
 * Uses the Javascript toLocaleUpperCase(cultureId) function
 */
export class UppercaseStringLocalizedFormatter extends DataTypeLocalizedFormatterBase
{
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return UppercaseStringLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        let result = this.prepString(value);
        if (result.Value && result.Value.length > 0)
            result.Value = result.Value.toLocaleUpperCase(cultureId);
        return result;
    }    
}
/**
 * For LowercaseStringLookupKey.
 * Converts all characters to lowercase.
 * Uses the Javascript toLocaleLowerCase(cultureId) function
 */
export class LowercaseStringLocalizedFormatter extends DataTypeLocalizedFormatterBase
{
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return LowercaseStringLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        let result = this.prepString(value);
        if (result.Value && result.Value.length > 0)
            result.Value = result.Value.toLocaleLowerCase(cultureId);
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
export abstract class NumberLocalizedFormatterBase extends DataTypeLocalizedFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super();
        this._options = options ?? this.GetDefaultOptions();
    }
    protected get Options(): Intl.NumberFormatOptions
    {
        return this._options;
    }
    private _options: Intl.NumberFormatOptions;
    /**
     * Provide the default NumberFormatOptions for use with
     * Intl.NumberFormat.
     */
    protected abstract GetDefaultOptions(): Intl.NumberFormatOptions;

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        return this.FormatNumber(value, cultureId);
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
    protected FormatNumber(value: any, cultureId: string,
        options?: Intl.NumberFormatOptions | null | null): IDataTypeResolution<string> {
        if (typeof value === 'number')
            return {
                Value: Intl.NumberFormat(cultureId, options ?? this.Options).format(value)
            }
        else if (value == null)   // null/undefined
            return { Value: '' }
        else
            return { ErrorMessage: 'Not a number' }
    }
}

/**
 * For NumberLookupKey.
 * Converts any number using the Intl library's NumberFormat feature.
 */
export class NumberLocalizedFormatter extends NumberLocalizedFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super(options);
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return NumberLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    protected GetDefaultOptions(): Intl.NumberFormatOptions {
        return {
            signDisplay: "auto",
        };
    }
}

/**
 * For IntegerLookupKey.
 * Converts any number using the Intl library's NumberFormat feature.
 */
export class IntegerLocalizedFormatter extends NumberLocalizedFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super(options);
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return IntegerLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    protected GetDefaultOptions(): Intl.NumberFormatOptions {
        return {
            signDisplay: "auto",
            maximumFractionDigits: 0
        };
    }

    // public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
    //     if (typeof value === 'number')
    //         value = Math.floor(value);
    //     super.Format(value, dataTypeLookupKey, cultureId);
    // }
}

/**
 * For CurrencyLookupKey.
 * Formats the number as a currency. 
 * Converts any number using the Intl library's NumberFormat feature. 
 * It shows the currency symbol,
 * which is not actually built into the Intl library.
 * Thus we need to support it by letting you supply
 * a CurrencyCode into the constructor, along with a list of
 * cultures that support the code.
 */
export class CurrencyLocalizedFormatter extends NumberLocalizedFormatterBase
{
    constructor(defaultCurrencyCode: string,
        options?: Intl.NumberFormatOptions | null,
        cultureToCurrencyCode?: { [cultureId: string]: string })
    {
        super(options);
        this._cultureToCurrencyCode = cultureToCurrencyCode ?? null;
        this._defaultCurrencyCode = defaultCurrencyCode;
    }
    private _defaultCurrencyCode: string;
    protected GetDefaultOptions(): Intl.NumberFormatOptions {
        return {
            style: "currency",
            currency: "DEFAULT"
        };
    }
    private _cultureToCurrencyCode: { [cultureId: string]: string } | null;

    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return CurrencyLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }


    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        let options = this.Options;
        if (options.currency === "DEFAULT") {
            options = { ...options, currency: this.ResolveCurrencyCode(cultureId) };
        }
        return this.FormatNumber(value, cultureId, options);
    }    
    protected ResolveCurrencyCode(cultureId: string): string
    {
        let currencyCode = this._defaultCurrencyCode;
        if (this._cultureToCurrencyCode)
            currencyCode = this._cultureToCurrencyCode[cultureId] ??
                this._cultureToCurrencyCode[CultureLanguageCode(cultureId)] ??
                this._defaultCurrencyCode;
        return currencyCode;
    }
}

/**
 * For PercentageLookupKey.
 * Converts any number using the Intl library's NumberFormat feature.
 * Expects the value 1 to be 100%.
 */
export class PercentageLocalizedFormatter extends NumberLocalizedFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.NumberFormatOptions {
        return {
            style: "percent",
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return PercentageLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}

/**
 * For Percentage100LookupKey.
 * Converts any number using the Intl library's NumberFormat feature.
 * Expects the value 100 to be 100%.
 */
export class Percentage100LocalizedFormatter extends NumberLocalizedFormatterBase
{
    constructor(options?: Intl.NumberFormatOptions | null)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.NumberFormatOptions {
        return {
            style: "percent",
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return Percentage100LookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    // Intl library treats 1.0 as 100. So we adjust the value.
    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        if (typeof value === 'number')
            value = value / 100.0;
        return super.Format(value, dataTypeLookupKey, cultureId);
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
 * ValidationServices.TextLocalizerService with text keys, cultures and
 * translations. Then provide values for TrueLabel and FalseLabel
 * when registering this class in the DataTypeServices.
 */
export abstract class BooleanLocalizedFormatterBase extends DataTypeLocalizedFormatterBase
{
    constructor(cultureToLabels?: Array<CultureToBooleanLabels>| null)
    {
        super();
        this._cultureToLabels = cultureToLabels ?? [];
    }
    private _cultureToLabels: Array<CultureToBooleanLabels>;

    protected abstract DefaultCultureToLabels(): CultureToBooleanLabels;


    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        if (typeof value === 'boolean') {
            return this.FormatBoolean(value, cultureId);
        }
        else if (value == null)   // null/undefined
            return { Value: '' }
        else
            return { ErrorMessage: 'Not a boolean' }
    }
    protected FormatBoolean(value: boolean, cultureId: string): IDataTypeResolution<string>
    {
        let tolabels = this._cultureToLabels.find((cbl) => cbl.CultureId === cultureId) ?? null;
        if (!tolabels) {
            let lang = CultureLanguageCode(cultureId);
            if (lang && lang !== cultureId)
                tolabels = this._cultureToLabels.find((cbl) => cbl.CultureId === lang) ?? null;
        }
        if (!tolabels)
            tolabels = this.DefaultCultureToLabels();
        return { Value: value ? tolabels!.TrueLabel : tolabels!.FalseLabel }
    }
}
/**
 * Supports BooleanLookupKey, and provides 'true' and 'false' labels
 * for all cultures unless you provide alternatives into the constructor.
 */
export class BooleanLocalizedFormatter extends BooleanLocalizedFormatterBase
{
    constructor(cultureToLabels?: Array<CultureToBooleanLabels>| null)
    {
        super(cultureToLabels);
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return BooleanLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    protected DefaultCultureToLabels(): CultureToBooleanLabels {
        return {
            CultureId: '',
            TrueLabel: 'true',
            FalseLabel: 'false'
        };
    }
}

/**
 * Supports YesNoBooleanLookupKey, and provides 'yes' and 'no' labels
 * for all cultures unless you provide alternatives into the constructor.
 */
export class YesNoBooleanLocalizedFormatter extends BooleanLocalizedFormatterBase
{
    constructor(cultureToLabels?: Array<CultureToBooleanLabels>| null)
    {
        super(cultureToLabels);
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return YesNoBooleanLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    protected DefaultCultureToLabels(): CultureToBooleanLabels {
        return {
            CultureId: '',
            TrueLabel: 'yes',
            FalseLabel: 'no'
        };
    }    
}
/**
 * Supports Boolean data types by mapping the labels
 * for "true" and "false" to language specific values.
 */
export interface CultureToBooleanLabels
{
    /**
     * Which culture is associated with these labels.
     * It can be just the country code, like 'en'
     */
    CultureId: string;
    /**
     * Text to show the user when the value is true.
     */
    TrueLabel: string;
    /**
     * Text to show the user when the value is false.
     */
    FalseLabel: string;
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
export abstract class DateTimeLocalizedFormatterBase extends DataTypeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super();
        this._options = options ?? this.GetDefaultOptions();
    }
    protected get Options(): Intl.DateTimeFormatOptions
    {
        return this._options;
    }
    private _options: Intl.DateTimeFormatOptions;
    /**
     * Provide the default DateTimeFormatOptions for use with
     * Intl.DateTimeFormat.
     */
    protected abstract GetDefaultOptions(): Intl.DateTimeFormatOptions;

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
        return this.FormatDateTime(value, cultureId);
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
    protected FormatDateTime(value: any, cultureId: string,
        options?: Intl.DateTimeFormatOptions | null): IDataTypeResolution<string> {
        if (value instanceof Date)
            return {
                Value: Intl.DateTimeFormat(cultureId, this.Options).format(value)
            }
        else if (value == null)   // null/undefined
            return { Value: '' }
        else
            return { ErrorMessage: 'Not a date' }
    }
}
/**
 * For DateTimeLookupKey. 
 * Uses Intl library's DateTimeFormat to Y, M, D, hours, and minutes,
 * but not seconds in digits, unless you provide alternatives
 * in the constructor.
 */
export class DateTimeLocalizedFormatter extends DateTimeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return DateTimeLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For DateLookupKey and ShortDateLookupKey.
 * Uses Intl library's DateTimeFormat to Y, M, D as digits (short date format)
 * unless you provide alternatives in the constructor.
 */
export class DateLocalizedFormatter extends DateTimeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: "numeric",
            month: "numeric",
            day: "numeric"
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return [DateLookupKey, ShortDateLookupKey];
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Supports(dataTypeLookupKey: string, cultureId: string): boolean {
        return (dataTypeLookupKey === ShortDateLookupKey || super.Supports(dataTypeLookupKey, cultureId));
    }

}
/**
 * For AbbrevDateLookupKey. 
 * Uses Intl library's DateTimeFormat to Month as abbreviated name, 
 * Y and D as digits (abbreviated date format)
 * unless you provide alternatives in the constructor.
 */
export class AbbrevDateLocalizedFormatter extends DateTimeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: "numeric",
            month: "short",
            day: "numeric"
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return AbbrevDateLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For AbbrevDOWDateLookupKey. 
 * Uses Intl library's DateTimeFormat to Month as abbreviated name, 
 * Day of week as abbreviated name, Y and D as digits (abbreviated date format)
 * unless you provide alternatives in the constructor.
 */
export class AbbrevDOWDateLocalizedFormatter extends DateTimeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: "numeric",
            month: "short",
            day: "numeric",
            weekday: "short"
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return AbbrevDOWDateLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For LongDateLookupKey. 
 * Uses Intl library's DateTimeFormat to Month as full name, 
 * Y and D as digits (long date format)
 * unless you provide alternatives in the constructor.
 */
export class LongDateLocalizedFormatter extends DateTimeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: "numeric",
            month: "long",
            day: "numeric"
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return LongDateLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For LongDOWDateLookupKey. 
 * Uses Intl library's DateTimeFormat to Month as full name, 
 * Day of week as full name, Y and D as digits (abbreviated date format)
 * unless you provide alternatives in the constructor.
 */
export class LongDOWDateLocalizedFormatter extends DateTimeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long"
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return LongDOWDateLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}

/**
 * For TimeofDayLookupKey. 
 * Uses Intl library's DateTimeFormat to show hours and minutes as digits,
 * omitted seconds, unless you provide alternatives in the constructor.
 */
export class TimeofDayLocalizedFormatter extends DateTimeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            hour: "numeric",
            minute: "numeric",
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return TimeOfDayLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}

/**
 * For TimeofDayHMSLookupKey. 
 * Uses Intl library's DateTimeFormat to show hours, minutes, and seconds as digits,
 * unless you provide alternatives in the constructor.
 */
export class TimeofDayHMSLocalizedFormatter extends DateTimeLocalizedFormatterBase
{
    constructor(options?: Intl.DateTimeFormatOptions)
    {
        super(options);
    }
    protected GetDefaultOptions(): Intl.DateTimeFormatOptions {
        return {
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
        };
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return TimeOfDayHMSLookupKey;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
