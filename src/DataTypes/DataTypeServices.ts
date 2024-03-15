/**
 * {@link DataTypes/DataTypeServices} handles various data types of the values.
 * It works in conjunction with the {@link DataTypes/LookupKeys! | DataType Lookup Keys }.
 * There are 4 features associated with any data type:
 * - Identify - These classes exist for all native datatypes. They handle when the LookupKey is unknown.
 *   They are passed the actual value and if they identify that value's type, they return the LookupKey.
 *   They are built on {@link DataTypes/Interfaces!IDataTypeIdentifier | IDataTypeIdentifier}.
 * - Formatter - These functions change the native value into something you can display to the user.
 *   They are associated with the error message tokens, such as "You entered {Value}." where the value
 *   is a Date object and needs to be shown in a localized format of short, abbreviated, or full.
 *   Uses DataTypeLocalizations to localizing the formatted string.
 *   Their function definition is fn(value: any) : IDataTypeResolution<string>.
 * - Converter - Change the native value into somethat used by a Condition.Evaluate function.
 *   This is essential for comparison Conditions. Comparison works automatically
 *   with string, number, and boolean native types. Converters exist to take a Date
 *   or user defined class to a string, number, or boolean.
 *   They are built on {@link DataTypes/Interfaces!IDataTypeConverter | IDataTypeConverter}.
 * - Comparer - Used by Conditions to compare two values when those values don't naturally work
 *   with the JavaScript comparison operators. Due to the Converter's ability to prepare
 *   most values for the default comparison function, these aren't often created.
 *   When they are, they are built on {@link DataTypes/Interfaces!IDataTypeComparer | IDataTypeComparer}.
 * The actual instance of this class is found on ValidationServices.DataTypeServices.
 * @module DataTypes/DataTypeServices
 */

import { DefaultComparer } from "./DataTypeComparers";
import { AssertNotNull, CodingError } from "../Utilities/ErrorHandling";
import { IDataTypeResolution, IDataTypeServices, IDataTypeIdentifier, IDataTypeConverter, ComparersResult, IDataTypeComparer, IDataTypeLocalizedFormatter } from "../Interfaces/DataTypes";
import { CultureLanguageCode, DeepClone } from '../Utilities/Utilities';
import { IServicesAccessor, IValidationServices, ToIServicesAccessor } from "../Interfaces/ValidationServices";


/**
 * A service that knows about data types providing tools for:
 * - Identifying them
 * - Converting them into something better suited for comparisons and formatting
 * - Formatting them for the tokens of error messages
 * - Comparing them
 * It works in conjunction with the DataType Lookup Keys {@link DataTypes/LookupKeys! | Lookup Keys }.
 * 
 * Formatting supports localization, keeping a list of one or more IDataTypeLocalizedFormatters,
 * for all supported cultures.
 * As you set it up, you must supply a list of one or more CultureConfig objects.
 * Each identifies a culture that you support and a fallback culture when the desired culture
 * didn't support the Format.
 */
export class DataTypeServices implements IDataTypeServices {
    /**
     * Constructor
     * @param activeCultureId - Required. Can be just a language code like 'en', or complete like 'en-US'
     * @param cultureConfig - All of the cultures that you intend to support, along with fallback Cultures
     */
    constructor(activeCultureId: string, cultureConfig?: Array<CultureConfig> | null) {
        AssertNotNull(activeCultureId, 'activeCultureId')
        this._activeCultureID = activeCultureId;
        if (!cultureConfig || cultureConfig.length === 0)
            this._cultureConfig = [{ CultureId: this._activeCultureID }];
        else
            this._cultureConfig = DeepClone(cultureConfig) as Array<CultureConfig>;
    }

    /**
     * Services accessor.
     * Note: Not passed into the constructor because this object should be created before
     * ValidationServices itself. So it gets assigned when ValidationService.DataTypeServices is assigned a value.
     */
    public get Services(): IValidationServices
    {
        if (!this._services)
            throw new CodingError('Attach to ValidationServices.DataTypeServices first.');
        return this._services;
    }
    public set Services(services: IValidationServices)
    {
        AssertNotNull(services, 'services');
        this._services = services;
        this.UpdateServices(services);
    }
    private _services: IValidationServices | null = null;

    /**
     * Changes the services on all implementations of IServicesAccessor
     * @param services 
     */
    protected UpdateServices(services: IValidationServices): void
    {
        this._dataTypeLocalizedFormatters?.forEach((dtf) => {
            let sa = ToIServicesAccessor(dtf);
            if (sa)
                sa.Services = services;
        });
    }
    /**
     * The culture shown to the user in the app. Its the ISO language-region format.
       This value is the starting point to search through DataTypeLocalizations.
       Those have their own FallbackCultureID to continue the search.
     */
    public get ActiveCultureId(): string {
        return this._activeCultureID;
    }
    public set ActiveCultureId(cultureID: string) {
        this._activeCultureID = cultureID;
    }
    private _activeCultureID: string;

    protected get CultureConfig(): Array<CultureConfig> {
        return this._cultureConfig;
    }
    private _cultureConfig: Array<CultureConfig>;

    /**
     * Utility to check for the presence of a Culture.
     * Will fallback to language only check if language-country
     * cultureID doesn't find a match. In other words, if 'en-US' isn't found,
     * it tries 'en'.
     * @returns the found cultureID, so you know if it exactly matched or just 
     * got the language. If no match, returns null.
     */
    public GetClosestCultureId(cultureId: string): string | null {
        let cc = this.GetClosestCultureConfig(cultureId);
        if (cc)
            return cc.CultureId;
        return null;
    }
    protected GetClosestCultureConfig(cultureId: string): CultureConfig | null {
        let cc = this.GetCultureConfig(cultureId);
        if (!cc) {
            let lang = CultureLanguageCode(cultureId);
            if (lang !== cultureId) {
                cc = this.GetCultureConfig(lang);
            }
        }
        return cc ?? null;
    }    
    protected GetCultureConfig(cultureId: string): CultureConfig | null
    {
        return this._cultureConfig.find((cc) => cc.CultureId === cultureId) ?? null;
    }


    //#region Format, IDataTypeLocalizedFormatter and AdditionalFormatters.    
    /**
     * Converts the native value to a string that can be shown to the user.
     * Result includes the successfully converted value
     * or validation error information.
     * @param value
     * @param lookupKey - If not supplied, a lookup key is created based on the native value type.
     * If you need alternative formatting or are supporting a user defined type,
     * always pass in the associated lookup key. They can be found in the LookupKeys module.
     * @returns successfully converted value or validation error information.
    */
    public Format(value: any, lookupKey?: string | null): IDataTypeResolution<string> {
        if (!lookupKey)
            lookupKey = this.IdentifyLookupKey(value);
        if (lookupKey === null)
            throw new Error('Value type requires a LookupKey');
        let cultureId: string | null = this._activeCultureID;
        while (cultureId) {
            let cc = this.GetCultureConfig(cultureId);
            if (!cc)
                break;  // hand off to additionalFormatters
            let dtlf = this.GetLocalizedFormatter(lookupKey, cultureId);
            if (dtlf)
                try {
                    return dtlf.Format(value, lookupKey, cultureId);
                }
                catch (e) {
                    return { ErrorMessage: (e as Error).message };
                }
            cultureId = cc.FallbackCultureId ?? null;
        }

        //!!! change this to logging error.
        throw new Error(`Unsupported LookupKey ${lookupKey}`);
    }

    /**
      * Registers an IDataTypeLocalizedFormatter for use by the Format function.
      * If the LookupKey was previously registered, its instance is replaced.
      * @param dtlf
      */
    public RegisterLocalizedFormatter(dtlf: IDataTypeLocalizedFormatter): void {
        AssertNotNull(dtlf, 'dtlf');
        if (!this._dataTypeLocalizedFormatters)
            this._dataTypeLocalizedFormatters = [];
        this._dataTypeLocalizedFormatters.push(dtlf);
        if (this._services) {
            let sa = ToIServicesAccessor(dtlf);
            if (sa)
                sa.Services = this._services;
        }
    }
    /**
     * Removes the first IDataTypeLocalizedFormatter that supports both parameters.
     * @param lookupKey 
     * @param cultureID 
     * @returns 
     */
    public UnregisterLocalizedFormatter(lookupKey: string, cultureID: string): boolean {
        let index = this.GetLocalizedFormatters().findIndex((dtlf) => dtlf.Supports(lookupKey, cultureID));
        if (index >= 0) {
            this._dataTypeLocalizedFormatters!.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Gets the IDataTypeLocalizedFormatter associated with the lookup key and this class's
     * own CultureID.
     * @param lookupKey
     * @returns A matching IDataTypeLocalizedFormatter or null if none match.
     */
    public GetLocalizedFormatter(lookupKey: string, cultureId: string): IDataTypeLocalizedFormatter | null {
        return this.GetLocalizedFormatters().find((dtlf) => dtlf.Supports(lookupKey, cultureId)) ?? null;
    }

    /**
     * If the user hasn't registered any, this registers the standard
     * IDataTypeLocalizedFormatters.
     */
    protected GetLocalizedFormatters() : Array<IDataTypeLocalizedFormatter>
    {
        if (!this._dataTypeLocalizedFormatters) {
            this._dataTypeLocalizedFormatters = [];
        }
        return this._dataTypeLocalizedFormatters;
    }

    /**
     * All registered IDataTypeLocalizedFormatters.
     */
    private _dataTypeLocalizedFormatters: Array<IDataTypeLocalizedFormatter>|null = null;

    //#endregion Format, IDataTypeLocalizedFormatter.

    //#region CompareValues and IDataTypeComparer
    /**
     * Compares two same-type values to see if they are equal or not.
     * It can return Equals and NotEquals for types that make no sense
     * to support greater than and less than.
     * Otherwise it returns Equals, LessThan, or GreaterThan.
     * Expect exceptions when invalid values are supplied.
     * It identifies the ComparerHandler function.
     * If either value is null, it will either return Equals (both null)
     * or Undetermined.
     * @param value1 
     * @param value2 
     * @param lookupKey1 - Identifies the IDataTypeConverter and/or ComparerHandler function to use
     *   together with value1. If null, the native data type of the value will be converted to a lookupKey
     *   when String, Number, Boolean, Date object, or any IDataTypeIdentifier that you have registered
     *   with the DataTypeServices.
     * @param lookupKey2 - Same idea as lookupKey1 but for value2. This value will not be used
     * to find a ComparerHandler.
     */
    public CompareValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult {
        function resolveLookupKey(v: any, key: string | null, part: string): string | null {
            if (v != null) // null/undefined
            {
                if (!key)
                    key = self.IdentifyLookupKey(v);
                if (!key)
                    throw new Error(`${part} operand value has an unknown datatype. Supply the appropriate DataTypeLookupKey and/or register an IDataTypeConverter`);
            }
            return key;
        }
        function handleNullsAndUndefined(v1: any, v2: any): ComparersResult | null {
            if (v1 === null || v2 === null)
                return v1 === v2 ? ComparersResult.Equals : ComparersResult.Undetermined;
            if (v1 === undefined || v2 === undefined)
                return ComparersResult.Undetermined;
            return null;    // not handled. Continue processing
        }

        let testNullsResult = handleNullsAndUndefined(value1, value2);
        if (testNullsResult != null)
            return testNullsResult;

        let self = this;
        lookupKey1 = resolveLookupKey(value1, lookupKey1, 'Left');
        lookupKey2 = resolveLookupKey(value2, lookupKey2, 'Right');

        let comparer = this.GetDataTypeComparer(value1, value2);
        if (comparer)
            return comparer.Compare(value1, value2);

        let cleanedUpValue1 = this.CleanupComparableValue(value1, lookupKey1);
        let cleanedUpValue2 = this.CleanupComparableValue(value2, lookupKey2);

        let testNullsResultCU = handleNullsAndUndefined(cleanedUpValue1, cleanedUpValue2);
        if (testNullsResultCU != null)
            return testNullsResultCU;

        let comparerCU = this.GetDataTypeComparer(cleanedUpValue1, cleanedUpValue2);
        if (comparerCU)
            return comparerCU.Compare(cleanedUpValue1, cleanedUpValue2);

        return DefaultComparer(cleanedUpValue1, cleanedUpValue2);
    }

    protected CleanupComparableValue(value: any, lookupKey: string | null): any {
        let dtc = this.GetDataTypeConverter(value, lookupKey);
        if (dtc) {
            value = dtc.Convert(value, lookupKey!);
            switch (typeof value) {
                case 'number':
                case 'string':
                case 'boolean':
                case 'bigint':
                case 'undefined':
                    break;
                case 'object':  // try again. For example, we got a date. Need it to be a number
                    if (value === null)
                        return value;
                    value = this.CleanupComparableValue(value, null);
                    break;
                default:
                    throw new CodingError('Type converted to unsupported value.');
            }
        }
        return value;
    }

    /**
     * Registers an IDataTypeComparer implementation.
     * @param comparer
     */
    public RegisterDataTypeComparer(comparer: IDataTypeComparer): void {
        AssertNotNull(comparer, 'comparer');

        if (!this._comparers)
            this._comparers = [];
        this._comparers.push(comparer);
    }

    /**
     * Returns a comparer that supports both values or null if not.
     * @param value1 
     * @param value2 
     * @returns 
     */
    protected GetDataTypeComparer(value1: any, value2: any): IDataTypeComparer | null {
        return this.GetDataTypeComparers().find((dtc) => dtc.SupportsValues(value1, value2)) ?? null;
    }

    protected GetDataTypeComparers(): Array<IDataTypeComparer>
    {
        if (!this._comparers)
            this._comparers = [];
        return this._comparers;
    }

    private _comparers: Array<IDataTypeComparer> | null = null;
    //#endregion IDataTypeComparer

    //#region DataTypeIdentifiers

    /**
     * When a value is supplied without a DataType Lookup Key, this resolves the
     * DataType Lookup Key. By default, it supports values of type number, boolean,
     * string and Date object.
     * You can add your own data types by implementing IDataTypeIdentifier
     * and registered you class with the DataTypeServices.
     * @param value 
     * @returns the found Lookup Key or "Unsupported".
     */
    public IdentifyLookupKey(value: any): string | null {
        let idt = this.GetDataTypeIdentifier(value);
        return idt ? idt.DataTypeLookupKey : null;
    }

    /**
     * Registers an implementation of IDataTypeIdentifier.
     * The built-in implementations are preregistered.
     * @param identifier - If its DataTypeLookupKey matches an existing one (case insensitive),
     * the existing one is replaced.
     */
    public RegisterDataTypeIdentifier(identifier: IDataTypeIdentifier): void {
        AssertNotNull(identifier, 'identifier');
        let existingPos = this.GetDataTypeIdentifiers().findIndex((idt) => idt.DataTypeLookupKey.toLowerCase() === identifier.DataTypeLookupKey.toLowerCase());
        if (existingPos < 0)
            this._dataTypeIdentifiers!.push(identifier);
        else
            this._dataTypeIdentifiers![existingPos] = identifier;
    }
    private _dataTypeIdentifiers: Array<IDataTypeIdentifier> | null = null;

    /**
     * Returns the matching DataType LookupKey for the given value or null if not supported.
     * @param value 
     * @returns 
     */
    protected GetDataTypeIdentifier(value: any): IDataTypeIdentifier | null {
        return this.GetDataTypeIdentifiers().find((idt) => idt.SupportsValue(value)) ?? null;
    }
    protected GetDataTypeIdentifiers(): Array<IDataTypeIdentifier>
    {
        if (!this._dataTypeIdentifiers)
            this._dataTypeIdentifiers = [];

        return this._dataTypeIdentifiers;
    }

    //#endregion IDataTypeIdentifiers

    //#region IConvertTo

    /**
     * Registers a IDataTypeConverter. Always adds, never replaces.
     * @param converter 
     */
    public RegisterDataTypeConverter(converter: IDataTypeConverter): void {
        AssertNotNull(converter, 'converter');
        if (!this._converters)
            this._converters = [];
        this._converters.push(converter);
    }

    /**
     * Gets the first IDataTypeConverter that supports the value, or null if none are found.
     * @param value 
     * @param dataTypeLookupKey 
     * @returns 
     */
    public GetDataTypeConverter(value: any, dataTypeLookupKey: string | null): IDataTypeConverter | null {
        return this.GetDataTypeConverters().find((dtc) => dtc.SupportsValue(value, dataTypeLookupKey)) ?? null;
    }
    protected GetDataTypeConverters(): Array<IDataTypeConverter>
    {
        if (!this._converters)
            this._converters = [];
        return this._converters;
    }
    private _converters: Array<IDataTypeConverter> | null = null;

    //#endregion IConvertTo
}

/**
 * Identifies a CultureID ('en', 'en-US', 'en-GB', etc) that you are supporting.
 * Supplies a fallback CultureID if the culture requested did not have any support.
 * Used by DataTypeServices. Pass an array of these into the DataTypeServices constructor.
 */
export interface CultureConfig {
    /**
     * The ISO culture name pattern in use:
     * languagecode
     * languagecode-countrycode or regioncode
     * "en", "en-GB", "en-US"
     * If this needs to change, it is OK if you set it and the Adaptor reconfigure,
     * or to create a new instance and use it.
     */
    CultureId: string;

    /**
     * Identifies another culture to check if a lookup key cannot be resolved.
     * Caller should find another DataTypeLocalization for that culture.
     */
    FallbackCultureId?: string | null;
}
