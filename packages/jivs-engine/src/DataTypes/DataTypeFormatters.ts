/**
 * Provides conversion between a native type and its formatted and localized string 
 * representation. Each is associated with a lookup key.
 * For example, the Date object has several of these implementations.
 * LookupKey="Date" provides a localized short date pattern through DateFormatter.
 * LookupKey="AbbrevDate" provides the same but in abbreviated date pattern through AbbrevDateFormatter.
 * Create implementations for each dataTypeLookupKey that needs localized formatting.
 * @module DataTypes/ConcreteClasses/DataTypeFormatters
 */

import { cultureLanguageCode } from '../Services/CultureService';
import { IDataTypeFormatter } from '../Interfaces/DataTypeFormatters';
import { DataTypeResolution } from '../Interfaces/DataTypes';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { CodingError, assertNotNull, assertWeakRefExists } from '../Utilities/ErrorHandling';
import { LookupKey } from './LookupKeys';
import { IServicesAccessor } from '../Interfaces/Services';

/**
 * Abstract implementation of IDataTypeFormatter.
 */
export abstract class DataTypeFormatterBase implements IDataTypeFormatter, IServicesAccessor
{
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
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
     * The DataTypeLookup key(s) that this class supports.
     */
    protected abstract get expectedLookupKeys(): string | Array<string>;

    /**
     * Return true so long as the CultureId is supported by this class.
     * @param cultureId 
     */
    protected abstract supportsCulture(cultureId: string): boolean;
    /**
     * Evaluates the parameters to determine if its format() method should handle the value
     * with those same parameters.
     * It should always match the DataTypeLookupKey. 
     * It does not have to evaluate the cultureID, as there are implementations
     * where the format() function handles eve
     * @param dataTypeLookupKey 
     * @param cultureId - Such as 'en-US' and 'en'
     * @returns Use its format() method when true. Do not use format() when false.
     */
    public supports(dataTypeLookupKey: string, cultureId: string): boolean {
        return this.matchingLookupKeys(dataTypeLookupKey, this.expectedLookupKeys) &&
            this.supportsCulture(cultureId);
    }

    /**
     * Creates a formatted string for the value, applying the goals of the DataTypeLookupKey
     * and making it culture specific.
     * @param value 
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    public abstract format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string>;
    
    protected prepString(value: any): DataTypeResolution<string> {
        if (value == null)    // null/undefined
            return { value: '' };
        // filter out invalid values
        if (typeof value === 'object')
            return { errorMessage: 'Not a string or primitive' };
        return {
            value: value.toString()
        };
    }    

    /**
     * LookupKeys must be case insensitive matched.
     * @param luk1 
     * @param luk2 
     * @returns 
     */
    protected matchingLookupKeys(luk1: string, luk2: string | Array<string>): boolean
    {
        function isMatch(a: string, b: string): boolean
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
                if (isMatch(luk1, luk2[i]))
                    return true;
        }
        else if (isMatch(luk1, luk2))
            return true;
        return false;
    }
}
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
        let result = this.prepString(value);
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
        let result = this.prepString(value);
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
        let result = this.prepString(value);
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
            return { errorMessage: 'Not a number' };
    }
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
    //         value = Math.floor(value);
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


    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
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
    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
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
 * ValidationServices.TextLocalizerService with text keys, cultures and
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
        let defaults = this.getDefaultLabels();
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
    * ValidationServices.TextLocalizerService with text keys, cultures and
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
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
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
    * ValidationServices.TextLocalizerService with text keys, cultures and
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
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
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
            return { errorMessage: 'Not a boolean' };
    }
    protected formatBoolean(value: boolean, cultureId: string): DataTypeResolution<string>
    {
        let text = value ? this.trueLabel : this.falseLabel;
        let l10n = value ? this.trueLabell10n : this.falseLabell10n;
        if (this.hasServices) {
            text = this.services.textLocalizerService.localize(
                cultureId, l10n, text)!;
        }
        return { value: text };
    }
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
            return { errorMessage: 'Not a date' };
    }
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

    public supports(dataTypeLookupKey: string, cultureId: string): boolean {
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

}
