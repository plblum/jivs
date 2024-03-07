import { NameToFunctionMapper } from "../Utilities/NameToFunctionMap";
import { AssertNotNull } from "../Utilities/ErrorHandling";
import { ComparersResult, IDataTypeResolution, ILocalizationAdapter } from "../Interfaces/DataTypes";



/**
 * Abstract implementation of ILocalizationAdapter.
 * Provides maps to find a function based on the lookupKey.
 * Requires user to create the functions and register them with 
 * the supplied Register functions.
 */
export abstract class LocalizationAdapterBase implements ILocalizationAdapter {
    constructor(cultureID: string, fallbackCultureID?: string | null) {
        this._cultureID = cultureID;
        this._fallbackCultureID = fallbackCultureID ?? null;
    }

    // Right now, we don't need localized comparisons...    
    CompareValues(value1: any, value2: any, lookupKey: string): ComparersResult {
        throw new Error("Method not implemented.");
    }
    /**
     * The ISO culture name pattern in use:
     * languagecode
     * languagecode-countrycode or regioncode
     * "en", "en-GB", "en-US"
     * If this needs to change, it is OK if you set it and the Adaptor reconfigure,
     * or to create a new instance and use it.
     */
    public get CultureID(): string {
        return this._cultureID;
    }
    private _cultureID: string;

    /**
     * Identifies another culture to check if a lookup key cannot be resolved.
     * Caller should find another LocalizationAdapter for that culture.
     */
    public get FallbackCultureID(): string | null {
        return this._fallbackCultureID;
    }

    private _fallbackCultureID: string | null;

    // these will be created only if needed
    private _toStringFunctions: NameToFunctionMapper<any, IDataTypeResolution<string>> | null = null;

    /**
     * Determines the value's type, and builds a localized string representing it.
     * If its already a string, it still may go through a conversion if a formatter
     * is available. For example, a phone number in a string to a formatted phone number.
     * @param value 
     * @param lookupKey - Identifies the specific function that should handle the conversion.
     * LookupKeys are registered with RegisterForToString.
     * If the lookupKey is not found, this function returns false to 
     * let the caller know to search elsewhere.
     * If the value cannot be converted using the function, such as an invalid datatype,
     * return { ErrorMessage: with error message }.
     */
    public ToString(value: any, lookupKey: string): IDataTypeResolution<string> {
        AssertNotNull(lookupKey, 'lookupKey');
        let fn = this._toStringFunctions?.Get(lookupKey.toLowerCase());
        if (fn)
            return fn(value, this);
        return { NotFound: true };
    }

    /**
     * Extends the lookupKeys available to ToString.
     * Adds or replaces a LookupKey that is not associated with localization
     * or is used as a fallback when no LocalizationAdapter supported the key.
     * If the LookupKey was previously registered, its function is replaced.
     * @param lookupKey 
     * @param fnOrKey - the function or the lookupKey to an already registered function
     */
    public RegisterForToString(lookupKey: string, fnOrKey: ((value: any, adapter: ILocalizationAdapter) => IDataTypeResolution<string>) | string): void {
        AssertNotNull(lookupKey, 'lookupKey');
        AssertNotNull(fnOrKey, 'fnOrKey');
        if (!this._toStringFunctions)
            this._toStringFunctions = new NameToFunctionMapper<any, IDataTypeResolution<string>>();
        this._toStringFunctions.Register(lookupKey, fnOrKey);
    }
}

