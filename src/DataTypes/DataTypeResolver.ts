import { BooleanComparer, CaseInsensitiveComparer, ComparersResult, DateAsAnniversaryComparer, DateAsMonthYearComparer, DateOnlyComparer, DateTimeComparer, DefaultComparer } from "../Conditions/Comparers";
import { StringLookupKey, NumberLookupKey, BooleanLookupKey, AnniversaryLookupKey, CaseInsensitiveStringLookupKey, DateLookupKey, DateTimeLookupKey, MonthYearLookupKey } from "./LookupKeys";
import { NameToFunctionMapper } from "../Utilities/NameToFunctionMap";
import { AssertNotNull } from "../Utilities/ErrorHandling";
import { IDataTypeResolution, IDataTypeResolver, ILocalizationAdapter } from "../Interfaces/DataTypes";

/**
 * DataTypeResolver handles various data types of the values.
 * It provides:
 * - Conversion to formatted string for displaying a value to the user.
 *   Uses LocalizationAdapters to localizing the formatted string.
 * - Comparing two same-type values for equals, not equals, less than, greater than.
 * This class is available on ValidationServices.DataTypeResolverService.
 */

/**
 * A service that knows about all datatype lookup keys and how to
 * convert values for them.
 * It handles localization, keeping a list of one or more LocalizationAdapters,
 * for various cultures.
 * Each LocalizationAdapter has its own list of lookup keys registered.
 * If you supply it with a lookup key that it doesn't handle,
 * fallback rules apply:
 * - Thru fallback LocalizationAdapters. So first try "en-FR", then "en-US", then "en"
 * (where each has its own LocalizationAdapter)
 * - Thru any additional lookup keys defined in the service itself.
 * Those additional lookup keys are intended to cover cases that are not localizable.
 * It supports converting a native value into a comparable value, such as a 
 * native Date object is converted into a number via Date.getTime().
 */
export class DataTypeResolver implements IDataTypeResolver
{
    constructor(activeCultureID: string = 'en', ...localizationAdapters: Array<ILocalizationAdapter>)
    {
        this._activeCultureID = activeCultureID;
        this._localizationAdapters = new Map<string, ILocalizationAdapter>();
        if (localizationAdapters)
            localizationAdapters.forEach((la) => {
                this._localizationAdapters.set(la.CultureID, la);
            });
    }
/**
 * The culture shown to the user in the app. Its the ISO language-region format.
   This value is the starting point to search through LocalizationAdapters.
   Those have their own FallbackCultureID to continue the search.
 */    
    public get ActiveCultureID(): string
    {
        return this._activeCultureID;
    }
    public set ActiveCultureID(cultureID: string)
    {
        this._activeCultureID = cultureID;
    }
    private _activeCultureID: string;

    /**
     * All localization adapters, where the key is the CultureID
     */
    private _localizationAdapters: Map<string, ILocalizationAdapter>;

    // these will be created only if needed
    private _additionalToStringFunctions: NameToFunctionMapper<any, IDataTypeResolution<string>> | null = null;
    private _additionalCompareValuesFunctions: NameToFunctionMapper<any, ComparersResult> | null = null;    

    /**
    * Converts the value to a string representation. Use a lookup Key to specify formatting rules.
    * @param value
    * @param lookupKey  - If not supplied, a lookup key is created based on the native value type if possible.
    * @returns successfully converted value
    * or validation error information.
    */    
    public ToString(value: any, lookupKey?: string): IDataTypeResolution<string>
    {
        if (!lookupKey)
            lookupKey = this.MapNativeTypeToLookupKey(value);
        if (lookupKey === this.Unsupported)
            throw new Error('Value type requires a LookupKey');
        let nextCultureID: string | null = this._activeCultureID;
        while (nextCultureID)
        {
            let la = this._localizationAdapters.get(nextCultureID);
            if (!la)
                break;  // hand off to additionalstrings
            try {
                let result = la.ToString(value, lookupKey);
                if (!result.NotFound)   // NotFound indicates no match to the lookupKey. We'll look elsewhere
                    return result;
            }
            catch (e)
            {
                return { ErrorMessage: (e as Error).message };
            }
            nextCultureID = la.FallbackCultureID;
        }
        if (this._additionalToStringFunctions) {
            let addl = this._additionalToStringFunctions.Get(lookupKey);
            if (addl) {
                try {
                    let result = addl(value);
                    if (!result.NotFound)
                        return result;
                }
                catch (e) {
                    return { ErrorMessage: (e as Error).message };
                }

            }
        }
        throw new Error(`Unsupported LookupKey ${lookupKey}`);
    }

/**
 * Compares two same-type values to see if they are equal or not.
 * It can return Equals and NotEquals for types that make no sense
 * to support greater than and less than.
 * Otherwise it returns Equals, LessThan, or GreaterThan.
 * Expect exceptions when invalid values are supplied.
 * It identifies the ComparerHandler function
 * @param value1 
 * @param value2 
 * @param lookupKey - Identifies the ComparerHandler function. If null,
 *   the native data type of the value will be converted to a lookupKey
 *   when String, Number, Boolean, or Date object.
 */    
    public CompareValues(value1: any, value2: any, lookupKey?: string | null): ComparersResult
    {
        if (!lookupKey)
            lookupKey = this.MapNativeTypeToLookupKey(value1);
        if (!lookupKey || lookupKey === this.Unsupported)
            throw new Error(`Unsupported lookupKey`);
        if (this._additionalCompareValuesFunctions) {
            let fn = this._additionalCompareValuesFunctions.Get(lookupKey);
            if (fn) {
                return fn(value1, value2);  // may throw an exception
            }
        }
        return DefaultComparer(value1, value2);
    }
 
    /**
     * Extends the lookupKeys available to ToString.
     * Adds or replaces a LookupKey that is not associated with localization
     * or is used as a fallback when no LocalizationAdapter supported the key.
     * If the LookupKey was previously registered, its function is replaced.
     * @param lookupKey 
     * @param fn 
     */
    public RegisterAdditionalToString(lookupKey: string, fn: (value: string)=> IDataTypeResolution<string>): void
    {
        AssertNotNull(lookupKey, 'lookupKey');
        AssertNotNull(fn, 'fn');
        if (!this._additionalToStringFunctions)
            this._additionalToStringFunctions = new NameToFunctionMapper<any, IDataTypeResolution<string>>();
        this._additionalToStringFunctions.Register(lookupKey, fn);
    }

    /**
     * Supports CompareValues function.
     * Adds or replaces a LookupKey and associated CompareValues function.
     * @param lookupKey
     * @param fn 
     */
    public RegisterComparerHandler(lookupKey: string, fn: (value1: any, value2: any)=> ComparersResult): void
    {
        AssertNotNull(lookupKey, 'lookupKey');
        AssertNotNull(fn, 'fn');
        if (!this._additionalCompareValuesFunctions)
            this._additionalCompareValuesFunctions = new NameToFunctionMapper<any, ComparersResult>();        
        this._additionalCompareValuesFunctions.Register(lookupKey, fn);
    }
    
//#region utilities    
/**
 * Add or replace a LocalizationAdapter for a specific CultureID.
 * @param la 
 */    
    public RegisterLocalizationAdapter(la: ILocalizationAdapter): void
    {
        this._localizationAdapters.set(la.CultureID, la);
    }

    public readonly Unsupported = 'Unsupported';

    /**
     * So long as the value is a primitive or object, this can return its LookupKey
     * to use with the DataTypeResolverService.
     * Expected results: 'Date', 'String', 'Number', 'Boolean', 'Unknown'
     * @param value 
     */
    public MapNativeTypeToLookupKey(value: any): string
    {
        switch (typeof value)
        {
            case 'string':
                return StringLookupKey;
            case 'number':
                return NumberLookupKey;    // handles both integers and decimals
            case 'boolean':
                return BooleanLookupKey;
            default:
                if (value instanceof Date)
                    return 'Date';  // not "DateTime" because the time part is less frequently used
                return this.Unsupported;
        }
    }


    /**
     * Utility to check for the presence of a localization adapter
     * based on a cultureID.
     * Will fallback to language only check if language-country
     * cultureID doesn't find a match.
     */
    public HasLocalizationFor(cultureID: string): boolean
    {
        return this.GetMatchingLocalizationAdapter(cultureID) !== null;
    }
    /**
     * Gets a localization adapter matching the cultureID.
     * If not found, it tries for an adapter with just 
     * the languageCode. So if 'en-US' is not found, it will try 'en'
     * @param cultureID 
     * @returns adapter found or null
     */
    protected GetMatchingLocalizationAdapter(cultureID: string):
        ILocalizationAdapter | null
    {
        let la = this._localizationAdapters.get(cultureID);
        if (!la) {
            let pos = cultureID.indexOf('-');
            if (pos > 0)
                la = this._localizationAdapters.get(cultureID.substring(0, pos));
        }
        return la ?? null;
    }
    public GetLocalizationAdapter(cultureID: string): ILocalizationAdapter | null
    {
        return this._localizationAdapters.get(cultureID) ?? null;
    }
    public HasAdditionalToStringLookupKey(lookupKey: string): boolean
    {
        return (this._additionalToStringFunctions != null &&
            this._additionalToStringFunctions.Get(lookupKey.toString()) != null);
    }
    public HasRegisterComparerHandlerLookupKey(lookupKey: string): boolean
    {
        return (this._additionalCompareValuesFunctions != null &&
            this._additionalCompareValuesFunctions.Get(lookupKey.toString()) != null);
    }

    //#endregion utilities
}
export function RegisterComparerHandlerWithDataTypeResolver(resolver: DataTypeResolver): void {
    resolver.RegisterComparerHandler(StringLookupKey, DefaultComparer);
    resolver.RegisterComparerHandler(CaseInsensitiveStringLookupKey, CaseInsensitiveComparer);
    resolver.RegisterComparerHandler(NumberLookupKey, DefaultComparer);
    resolver.RegisterComparerHandler(BooleanLookupKey, BooleanComparer);
    resolver.RegisterComparerHandler(DateTimeLookupKey, DateTimeComparer);
    resolver.RegisterComparerHandler(DateLookupKey, DateOnlyComparer);
    resolver.RegisterComparerHandler(MonthYearLookupKey, DateAsMonthYearComparer);
    resolver.RegisterComparerHandler(AnniversaryLookupKey, DateAsAnniversaryComparer);
}