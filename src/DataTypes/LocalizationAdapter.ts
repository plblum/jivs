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
    private _formatFunctions: NameToFunctionMapper<any, IDataTypeResolution<string>> | null = null;


    /**
     * Determines if the lookup has a supporting formatting registered.
     * Always call prior to Format, and only use Format when it returns true.
     * @param lookupKey 
     */
    public CanFormat(lookupKey: string): boolean
    {
        AssertNotNull(lookupKey, 'lookupKey');
        return this._formatFunctions?.Get(lookupKey.toLowerCase()) !== undefined;
    }
    
    /**
     * While this function formats a native value into a string, the LocalizationAdapter's culture
     * may defer the work to a less-specific culture to handle it.
     * As a result, this function may return a value of NotFound.
     * The caller continues requesting formatting from less-specific culture LocalizationAdapters
     * until either one supports it or none support it. 
     * @param value 
     * @param lookupKey - Identifies the specific function that should handle the conversion.
     * LookupKeys are registered with RegisterFormatter.
     * If the lookupKey is not found, this function returns NotFound=true to 
     * let the caller know to search elsewhere.
     * If the value cannot be converted using the function, such as an invalid datatype,
     * return { ErrorMessage: with error message }.
     */
    public Format(value: any, lookupKey: string): IDataTypeResolution<string> {
        AssertNotNull(lookupKey, 'lookupKey');
        let fn = this._formatFunctions?.Get(lookupKey.toLowerCase());
        if (fn)
            return fn(value, this);
        return {  };
    }

    /**
     * Extends the lookupKeys available to Format.
     * Adds or replaces a LookupKey that is not associated with localization
     * or is used as a fallback when no LocalizationAdapter supported the key.
     * If the LookupKey was previously registered, its function is replaced.
     * @param lookupKey 
     * @param fnOrKey - the function or the lookupKey to an already registered function
     */
    public RegisterFormatter(lookupKey: string, fnOrKey: ((value: any, adapter: ILocalizationAdapter) => IDataTypeResolution<string>) | string): void {
        AssertNotNull(lookupKey, 'lookupKey');
        AssertNotNull(fnOrKey, 'fnOrKey');
        if (!this._formatFunctions)
            this._formatFunctions = new NameToFunctionMapper<any, IDataTypeResolution<string>>();
        this._formatFunctions.Register(lookupKey, fnOrKey);
    }
}

