import { StringLookupKey } from './LookupKeys';
import { BooleanComparer, DefaultComparer } from "./DataTypeComparers";
import { NameToFunctionMapper } from "../Utilities/NameToFunctionMap";
import { AssertNotNull, CodingError } from "../Utilities/ErrorHandling";
import { IDataTypeResolution, IDataTypeResolver, IDataTypeIdentifier, ILocalizationAdapter, IDataTypeConverter, ComparersResult, IDataTypeComparer } from "../Interfaces/DataTypes";
import { BooleanDataTypeIdentifier, DateDataTypeIdentifier, NumberDataTypeIdentifier, StringDataTypeIdentifier } from "./DataTypeIdentifiers";
import { UTCDateOnlyConverter, DateTimeConverter, LowercaseStringConverter, LocalDateOnlyConverter } from "./DataTypeConverters";

/**
 * {@Link DataTypeResolver} handles various data types of the values.
 * It works in conjunction with the DataType Lookup Keys @see {@link StringLookupKey }.
 * There are 4 features associated with any data type:
 * - Identify - These classes exist for all native datatypes. They handle when the LookupKey is unknown.
 *   They are passed the actual value and if they identify that value's type, they return the LookupKey.
 *   They are built on {@Link IDataTypeIdentifier}.
 * - Formatter - These functions change the native value into something you can display to the user.
 *   They are associated with the error message tokens, such as "You entered {Value}." where the value
 *   is a Date object and needs to be shown in a localized format of short, abbreviated, or full.
 *   Uses LocalizationAdapters to localizing the formatted string.
 *   Their function definition is fn(value: any) : IDataTypeResolution<string>.
 * - Converter - Change the native value into somethat used by a Condition.Evaluate function.
 *   This is essential for comparison Conditions. Comparison works automatically
 *   with string, number, and boolean native types. Converters exist to take a Date
 *   or user defined class to a string, number, or boolean.
 *   They are built on {@Link IDataTypeConverter }.
 * - Comparer - Used by Conditions to compare two values when those values don't naturally work
 *   with the JavaScript comparison operators. Due to the Converter's ability to prepare
 *   most values for the default comparison function, these aren't often created.
 *   When they are, they are built on {@Link IDataTypeComparer }.
 * The actual instance of this class is found on ValidationServices.DataTypeResolverService.
 * @module DataTypeResolver
 */

/**
 * A service that knows about data types providing tools for:
 * - Identifying them
 * - Converting them into something better suited for comparisons and formatting
 * - Formatting them for the tokens of error messages
 * - Comparing them
 * It works in conjunction with the DataType Lookup Keys @see {@link StringLookupKey }.
 * 
 * Formatting supports localization, keeping a list of one or more LocalizationAdapters,
 * for various cultures.
 * Each LocalizationAdapter has its own list of lookup keys registered.
 * If you supply it with a lookup key that it doesn't handle,
 * fallback rules apply:
 * - Thru fallback LocalizationAdapters. So first try "en-FR", then "en-US", then "en"
 * (where each has its own LocalizationAdapter)
 * - Thru any additional lookup keys defined in the service itself.
 * Those additional lookup keys are intended to cover cases that are not localizable.
 */
export class DataTypeResolver implements IDataTypeResolver {
    constructor(activeCultureID: string = 'en', ...localizationAdapters: Array<ILocalizationAdapter>) {
        this._activeCultureID = activeCultureID;
        this._localizationAdapters = new Map<string, ILocalizationAdapter>();
        if (localizationAdapters)
            localizationAdapters.forEach((la) => {
                this._localizationAdapters.set(la.CultureID, la);
            });
        this.RegisterStandardDataTypeIdentifiers();
        this.RegisterStandardDataTypeConverters();
        this.RegisterStandardDataTypeComparers();
    }
    /**
     * The culture shown to the user in the app. Its the ISO language-region format.
       This value is the starting point to search through LocalizationAdapters.
       Those have their own FallbackCultureID to continue the search.
     */
    public get ActiveCultureID(): string {
        return this._activeCultureID;
    }
    public set ActiveCultureID(cultureID: string) {
        this._activeCultureID = cultureID;
    }
    private _activeCultureID: string;

    /**
     * All localization adapters, where the key is the CultureID
     */
    private _localizationAdapters: Map<string, ILocalizationAdapter>;

    // these will be created only if needed
    private _additionalFormatFunctions: NameToFunctionMapper<any, IDataTypeResolution<string>> | null = null;
    private _comparers: Array<IDataTypeComparer> | null = null;

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
        let nextCultureID: string | null = this._activeCultureID;
        while (nextCultureID) {
            let la = this._localizationAdapters.get(nextCultureID);
            if (!la)
                break;  // hand off to additionalstrings
            if (la.CanFormat(lookupKey))
                try {
                    return la.Format(value, lookupKey);
                }
                catch (e) {
                    return { ErrorMessage: (e as Error).message };
                }
            nextCultureID = la.FallbackCultureID;
        }
        if (this._additionalFormatFunctions) {
            let addl = this._additionalFormatFunctions.Get(lookupKey);
            if (addl) {
                try {
                    return addl(value);
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
     * It identifies the ComparerHandler function.
     * If either value is null, it will either return Equals (both null)
     * or Undetermined.
     * @param value1 
     * @param value2 
     * @param lookupKey1 - Identifies the IDataTypeConverter and/or ComparerHandler function to use
     *   together with value1. If null, the native data type of the value will be converted to a lookupKey
     *   when String, Number, Boolean, Date object, or any IDataTypeIdentifier that you have registered
     *   with the DataTypeResolver.
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
        function handleNullsAndUndefined(v1: any, v2: any): ComparersResult | null
        {
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
            switch (typeof value)
            {
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
     * Extends the lookupKeys available to Format.
     * Adds or replaces a LookupKey that is not associated with localization
     * or is used as a fallback when no LocalizationAdapter supported the key.
     * If the LookupKey was previously registered, its function is replaced.
     * @param lookupKey 
     * @param fn 
     */
    public RegisterAdditionalFormatters(lookupKey: string, fn: (value: string) => IDataTypeResolution<string>): void {
        AssertNotNull(lookupKey, 'lookupKey');
        AssertNotNull(fn, 'fn');
        if (!this._additionalFormatFunctions)
            this._additionalFormatFunctions = new NameToFunctionMapper<any, IDataTypeResolution<string>>();
        this._additionalFormatFunctions.Register(lookupKey, fn);
    }

    /**
     * Supports CompareValues function.
     * Adds or replaces a LookupKey and associated CompareValues function.
     * @param comparer
     */
    public RegisterDataTypeComparer(comparer: IDataTypeComparer): void {
        AssertNotNull(comparer, 'comparer');

        if (!this._comparers)
            this._comparers = [];
        this._comparers.push(comparer);
    }
    protected RegisterStandardDataTypeComparers(): void {
        this.RegisterDataTypeComparer(new BooleanComparer());
    }

    /**
     * Returns a comparer that supports both values or null if not.
     * @param value1 
     * @param value2 
     * @returns 
     */
    protected GetDataTypeComparer(value1: any, value2: any): IDataTypeComparer | null
    {
        if (!this._comparers)
            return null;
        return this._comparers.find((dtc) => dtc.SupportsValues(value1, value2)) ?? null;
    }

    //#region DataTypeIdentifiers

    /**
     * When a value is supplied without a DataType Lookup Key, this resolves the
     * DataType Lookup Key. By default, it supports values of type number, boolean,
     * string and Date object.
     * You can add your own data types by implementing IDataTypeIdentifier
     * and registered you class with the DataTypeResolver.
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
        let existingPos = this._dataTypeIdentifiers.findIndex((idt) => idt.DataTypeLookupKey.toLowerCase() === identifier.DataTypeLookupKey.toLowerCase());
        if (existingPos < 0)
            this._dataTypeIdentifiers.push(identifier);
        else
            this._dataTypeIdentifiers[existingPos] = identifier;
    }
    private _dataTypeIdentifiers: Array<IDataTypeIdentifier> = [];

    /**
     * Returns the matching DataType LookupKey for the given value or null if not supported.
     * @param value 
     * @returns 
     */
    protected GetDataTypeIdentifier(value: any): IDataTypeIdentifier | null {
        return this._dataTypeIdentifiers.find((idt) => idt.IsMatch(value)) ?? null;
    }
    protected RegisterStandardDataTypeIdentifiers(): void {
        this.RegisterDataTypeIdentifier(new NumberDataTypeIdentifier());
        this.RegisterDataTypeIdentifier(new StringDataTypeIdentifier());
        this.RegisterDataTypeIdentifier(new BooleanDataTypeIdentifier());
        this.RegisterDataTypeIdentifier(new DateDataTypeIdentifier());
    }
    //#endregion IDataTypeIdentifiers

    //#region IConvertTo

    /**
     * Registers a IDataTypeConverter. Always adds, never replaces.
     * @param converter 
     */
    public RegisterDataTypeConverter(converter: IDataTypeConverter): void {
        AssertNotNull(converter, 'converter');
        this._converters.push(converter);
    }
    private _converters: Array<IDataTypeConverter> = [];

    /**
     * Gets the first IDataTypeConverter that supports the value, or null if none are found.
     * @param value 
     * @param dataTypeLookupKey 
     * @returns 
     */
    public GetDataTypeConverter(value: any, dataTypeLookupKey: string | null): IDataTypeConverter | null {
        return this._converters.find((dtc) => dtc.SupportsValue(value, dataTypeLookupKey)) ?? null;
    }

    protected RegisterStandardDataTypeConverters(): void {
        this.RegisterDataTypeConverter(new LowercaseStringConverter());
        this.RegisterDataTypeConverter(new UTCDateOnlyConverter());
        this.RegisterDataTypeConverter(new DateTimeConverter());
        this.RegisterDataTypeConverter(new LocalDateOnlyConverter());
    }
    //#endregion IConvertTo

    //#region utilities    
    /**
     * Add or replace a LocalizationAdapter for a specific CultureID.
     * @param la 
     */
    public RegisterLocalizationAdapter(la: ILocalizationAdapter): void {
        this._localizationAdapters.set(la.CultureID, la);
    }

    /**
     * Utility to check for the presence of a localization adapter
     * based on a cultureID.
     * Will fallback to language only check if language-country
     * cultureID doesn't find a match.
     */
    public HasLocalizationFor(cultureID: string): boolean {
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
        ILocalizationAdapter | null {
        let la = this._localizationAdapters.get(cultureID);
        if (!la) {
            let pos = cultureID.indexOf('-');
            if (pos > 0)
                la = this._localizationAdapters.get(cultureID.substring(0, pos));
        }
        return la ?? null;
    }
    public GetLocalizationAdapter(cultureID: string): ILocalizationAdapter | null {
        return this._localizationAdapters.get(cultureID) ?? null;
    }
    public HasAdditionalFormatLookupKey(lookupKey: string): boolean {
        return (this._additionalFormatFunctions != null &&
            this._additionalFormatFunctions.Get(lookupKey) != null);
    }

    //#endregion utilities
}

