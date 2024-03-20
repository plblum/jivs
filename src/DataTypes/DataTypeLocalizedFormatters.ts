/**
 * Provides conversion between a native type and its formatted and localized string 
 * representation. Each is associated with a lookup key.
 * For example, the Date object has several of these implementations.
 * LookupKey="Date" provides a localized short date pattern through DateLocalizedFormatter.
 * LookupKey="AbbrevDate" provides the same but in abbreviated date pattern through AbbrevDateLocalizedFormatter.
 * Create implementations for each dataTypeLookupKey that needs localized formatting.
 * @module DataTypes/ConcreteClasses/DataTypeLocalizedFormatters
 */

import { IDataTypeLocalizedFormatter, DataTypeResolution } from "../Interfaces/DataTypes";
import { IServicesAccessor, IValidationServices } from "../Interfaces/ValidationServices";
import { CodingError } from "../Utilities/ErrorHandling";
import { CultureLanguageCode } from "../Utilities/Utilities";
import { LookupKey } from "./LookupKeys";

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
    protected get HasServices(): boolean
    {
        return this._services !== null;
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
    public abstract Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string>;
    
    protected prepString(value: any): DataTypeResolution<string> {
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
 * For LookupKey.String. Culture neutral.
 */
export class StringLocalizedFormatter extends DataTypeLocalizedFormatterBase {
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return LookupKey.String;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        return this.prepString(value);
    }
}

/**
 * For LookupKey.Capitalize.
 * Changes the first letter to uppercase. Leaves the rest alone.
 * Uses the Javascript toLocaleUpperCase(cultureId) function
 */
export class CapitalizeStringLocalizedFormatter extends DataTypeLocalizedFormatterBase
{
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Capitalize;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        let result = this.prepString(value);
        if (result.Value && result.Value.length > 0)
            result.Value = result.Value[0].toLocaleUpperCase(cultureId) +
                result.Value.substring(1);
        return result;
    }    
}
/**
 * For LookupKey.Uppercase.
 * Converts all characters to uppercase.
 * Uses the Javascript toLocaleUpperCase(cultureId) function
 */
export class UppercaseStringLocalizedFormatter extends DataTypeLocalizedFormatterBase
{
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Uppercase;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        let result = this.prepString(value);
        if (result.Value && result.Value.length > 0)
            result.Value = result.Value.toLocaleUpperCase(cultureId);
        return result;
    }    
}
/**
 * For LookupKey.Lowercase.
 * Converts all characters to lowercase.
 * Uses the Javascript toLocaleLowerCase(cultureId) function
 */
export class LowercaseStringLocalizedFormatter extends DataTypeLocalizedFormatterBase
{
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return LookupKey.Lowercase;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
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

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
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
        options?: Intl.NumberFormatOptions | null | null): DataTypeResolution<string> {
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
 * For LookupKey.Number.
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
        return LookupKey.Number;
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
 * For LookupKey.Integer.
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
        return LookupKey.Integer;
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

    // public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
    //     if (typeof value === 'number')
    //         value = Math.floor(value);
    //     super.Format(value, dataTypeLookupKey, cultureId);
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
        return LookupKey.Currency;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }


    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
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
 * For LookupKey.Percentage.
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
        return LookupKey.Percentage;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}

/**
 * For LookupKey.Percentage100.
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
        return LookupKey.Percentage100;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    // Intl library treats 1.0 as 100. So we adjust the value.
    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
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
        let defaults = this.GetDefaultLabels();
        this._trueLabel = trueLabel ?? defaults.TrueLabel ?? 'true';
        this._falseLabel = falseLabel ?? defaults.FalseLabel ?? 'false';
        this._trueLabell10n = trueLabell10n ?? defaults.TrueLabell10n ?? null;
        this._falseLabell10n = falseLabell10n ?? defaults.FalseLabell10n ?? null;
    }
    protected get ExpectedLookupKeys(): string | Array<string>
    {
        return this._dataTypeLookupKey;
    }
    private _dataTypeLookupKey: string;
    /**
     * Text shown the user for a value of true.
    * To provide localization of "true" and "false", set up
    * ValidationServices.TextLocalizerService with text keys, cultures and
    * translations. Then provide values for TrueLabel and FalseLabel
    * when registering this class in the DataTypeServices.
     */
    public get TrueLabel(): string
    {
        return this._trueLabel;
    }
    private _trueLabel: string;

    /**
     * Localization key for TrueLabel. Its value will be matched to an entry
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the TrueLabel property is used.
     */

    public get TrueLabell10n(): string | null
    {
        return this._trueLabell10n;
    }
    private _trueLabell10n: string | null;
    /**
     * Text shown the user for a value of false
    * To provide localization of "true" and "false", set up
    * ValidationServices.TextLocalizerService with text keys, cultures and
    * translations. Then provide values for TrueLabel and FalseLabel
    * when registering this class in the DataTypeServices.
      */
    public get FalseLabel(): string
    {
        return this._falseLabel;
    }
    private _falseLabel: string;

    /**
     * Localization key for FalseLabel. Its value will be matched to an entry
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the FalseLabel property is used.
     */

    public get FalseLabell10n(): string | null
    {
        return this._falseLabell10n;
    }
    private _falseLabell10n: string | null;

    protected abstract GetDefaultLabels(): DefaultLabelsForBoolean;    

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        if (typeof value === 'boolean') {
            return this.FormatBoolean(value, cultureId);
        }
        else if (value == null)   // null/undefined
            return { Value: '' }
        else
            return { ErrorMessage: 'Not a boolean' }
    }
    protected FormatBoolean(value: boolean, cultureId: string): DataTypeResolution<string>
    {
        let text = value ? this.TrueLabel : this.FalseLabel;
        let l10n = value ? this.TrueLabell10n : this.FalseLabell10n;
        if (this.HasServices) {
            text = this.Services.TextLocalizerService.Localize(
                cultureId, l10n, text)!;
        }
        return { Value: text };
    }
}
export interface DefaultLabelsForBoolean
{
    TrueLabel: string,
    FalseLabel: string,
    TrueLabell10n: string,
    FalseLabell10n: string
}

/**
 * Supports LookupKey.Boolean, and provides 'true' and 'false' labels
 * for all cultures unless you provide alternatives into the constructor
 * or setup localization with the TextLocalizerService.
 * It defaults to 'TRUE' as the localization key for true
 * and 'FALSE' as the localization key for false.
 * LookupKey: "Boolean" or whatever the user supplies.
 */
export class BooleanLocalizedFormatter extends BooleanLocalizedFormatterBase
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

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    protected GetDefaultLabels(): DefaultLabelsForBoolean {
        return {
            TrueLabel: 'true',
            FalseLabel: 'false',
            TrueLabell10n: 'TRUE',
            FalseLabell10n: 'FALSE'
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

    public Format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
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
        options?: Intl.DateTimeFormatOptions | null): DataTypeResolution<string> {
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
 * For LookupKey.DateTime. 
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
        return LookupKey.DateTime;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
/**
 * For LookupKey.Date and LookupKey.ShortDate.
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
        return [LookupKey.Date, LookupKey.ShortDate];
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

    public Supports(dataTypeLookupKey: string, cultureId: string): boolean {
        return (dataTypeLookupKey === LookupKey.ShortDate || super.Supports(dataTypeLookupKey, cultureId));
    }

}
/**
 * For LookupKey.AbbrevDate. 
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
        return LookupKey.AbbrevDate;
    }

    protected SupportsCulture(cultureId: string): boolean
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
        return LookupKey.AbbrevDOWDate;
    }

    protected SupportsCulture(cultureId: string): boolean
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
        return LookupKey.LongDate;
    }

    protected SupportsCulture(cultureId: string): boolean
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
        return LookupKey.LongDOWDate;
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
        return LookupKey.TimeOfDay;
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
        return LookupKey.TimeOfDayHMS;
    }

    protected SupportsCulture(cultureId: string): boolean
    {
        return true;
    }

}
