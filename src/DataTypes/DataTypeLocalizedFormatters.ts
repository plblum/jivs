import { ILocalizationAdapter, IDataTypeResolution } from "../Interfaces/DataTypes";
import {
    LocalizationAdapterBase
} from "./DataTypeLocalization";
import {
    StringLookupKey, CapitalizeStringLookupKey, UppercaseStringLookupKey, LowercaseStringLookupKey,
    NumberLookupKey, IntegerLookupKey, CurrencyLookupKey, PercentageLookupKey, BooleanLookupKey, YesNoBooleanLookupKey, DateTimeLookupKey,
    DateLookupKey, AbbrevDateLookupKey, AbbrevDOWDateLookupKey, LongDateLookupKey, LongDOWDateLookupKey, TimeOfDayLookupKey,
    TimeOfDayHMSLookupKey, allBuiltInFormatLookupKeys
} from "./LookupKeys";

/**
 * Localization built around the Intl class found in modern javascript.
 * Upon instantiation, call RegisterBuiltInLookupKeyFunctions to 
 * register the built in functions for most lookupKeys.
 */
export class IntlLocalizationAdapter extends LocalizationAdapterBase {
    constructor(cultureID: string, fallbackCultureID?: string | null, currency?: string | null) {
        super(cultureID, fallbackCultureID);
        this._currency = currency ?? 'USD';
    }

    /**
     * If using currency, ensure this is set to the correct
     * ISO-4217 currency code for the culture as Intl library
     * doesn't supply it.
     * https://en.wikipedia.org/wiki/ISO_4217#List_of_ISO_4217_currency_codes
     * If not supplied, it uses 'USD'.
     */
    public get Currency(): string {
        return this._currency;
    }
    private _currency: string;
    /**
     * Registers any of the built in lookupKeys and their functions
     * for the Format method to use.
     * @param lookupKeys - Pass null to register all built ins.
     */
    public RegisterBuiltInLookupKeyFunctions(lookupKeys?: Array<string>): void {
        if (!lookupKeys)
            lookupKeys = allBuiltInFormatLookupKeys;
        lookupKeys.forEach((lookupKey) => {
            let fn = this.GetBuiltInLookupFunction(lookupKey);
            if (fn)
                this.RegisterFormatter(lookupKey, fn);
        });
    }
    
    protected GetBuiltInLookupFunction(lookupKey: string): ((val: any, adapter: ILocalizationAdapter) =>
        IDataTypeResolution<string>) | string | null {
        switch (lookupKey) {
            case StringLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.prepString(val);

            case CapitalizeStringLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => {
                    let result = this.prepString(val);
                    if (result.Value && result.Value.length > 0)
                        // Intl lacks helpers for this.
                        result.Value = result.Value[0].toLocaleUpperCase(this.CultureID) +
                            result.Value.substring(1);
                    return result;
                };
            case UppercaseStringLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => {
                    let result = this.prepString(val);
                    if (result.Value && result.Value.length > 0)
                        // Intl lacks helpers for this.
                        result.Value = result.Value.toLocaleUpperCase(this.CultureID);
                    return result;
                };
            case LowercaseStringLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => {
                    let result = this.prepString(val);
                    if (result.Value && result.Value.length > 0)
                        // Intl lacks helpers for this.
                        result.Value = result.Value.toLocaleLowerCase(this.CultureID);
                    return result;
                };
            case NumberLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatNumber(val, {
                    signDisplay: "auto",
                });
            case IntegerLookupKey:
                return NumberLookupKey;   //!!! Needs improvement, like stripping decimal
            case CurrencyLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatNumber(val, {
                    style: "currency",
                    currency: this.Currency
                });
            // treats 1 as 100%
            case PercentageLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatNumber(val, {
                    style: "percent"
                });
            case BooleanLookupKey:
                //!!! needs localized strings
                return (val: any, adapter: ILocalizationAdapter) => this.formatBoolean(val, 'true', 'false');
            case YesNoBooleanLookupKey:
                //!!! needs localized strings
                return (val: any, adapter: ILocalizationAdapter) => this.formatBoolean(val, 'yes', 'no');
            case DateTimeLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatDate(val, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                });
            case DateLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatDate(val, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric"
                });
            case AbbrevDateLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatDate(val, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                });
            case AbbrevDOWDateLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatDate(val, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    weekday: "short"
                });
            case LongDateLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatDate(val, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            case LongDOWDateLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatDate(val, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long"
                });
            case TimeOfDayLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatDate(val, {
                    hour: "numeric",
                    minute: "numeric",
                });
            case TimeOfDayHMSLookupKey:
                return (val: any, adapter: ILocalizationAdapter) => this.formatDate(val, {
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric"
                });            
            default:
                return null;
        }
    }
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
    protected formatDate(value: any, options: Intl.DateTimeFormatOptions): IDataTypeResolution<string> {
        if (value instanceof Date)
            return {
                Value: Intl.DateTimeFormat(this.CultureID, options).format(value)
            }
        else if (value == null)   // null/undefined
            return { Value: '' }
        else
            return { ErrorMessage: 'Not a date' }

    }

    protected formatNumber(value: any, options?: Intl.NumberFormatOptions): IDataTypeResolution<string> {
        if (typeof value === 'number')
            return {
                Value: Intl.NumberFormat(this.CultureID, options).format(value)
            }
        else if (value == null)   // null/undefined
            return { Value: '' }
        else
            return { ErrorMessage: 'Not a number' }
    }
    protected formatBoolean(value: any, trueLabel: string, falseLabel: string): IDataTypeResolution<string> {
        if (typeof value === 'boolean') {
            if (!trueLabel)
                trueLabel = 'true';
            if (!falseLabel)
                falseLabel = 'false';
            return { Value: value ? trueLabel : falseLabel }
        }
        else if (value == null)   // null/undefined
            return { Value: '' }
        else
            return { ErrorMessage: 'Not a boolean' }
    }

}    
