/**
 * {@link DataTypes/ConcreteClasses/DataTypeServices} handles various data types of the values.
 * It works in conjunction with the {@link DataTypes/LookupKeys! | DataType Lookup Keys }.
 * There are 4 features associated with any data type:
 * - Identify - These classes exist for all native datatypes. They handle when the LookupKey is unknown.
 *   They are passed the actual value and if they identify that value's type, they return the LookupKey.
 *   They are built on {@link DataTypes/Interfaces!IDataTypeIdentifier | IDataTypeIdentifier}.
 * - Formatter - These functions change the native value into something you can display to the user.
 *   They are associated with the error message tokens, such as "You entered {Value}." where the value
 *   is a Date object and needs to be shown in a localized format of short, abbreviated, or full.
 *   Uses {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter}
 *   which returns a localized string.
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
 * @module DataTypes/ConcreteClasses/DataTypeServices
 */

import { DefaultComparer } from "./DataTypeComparers";
import { AssertNotNull, CodingError } from "../Utilities/ErrorHandling";
import { DataTypeResolution, IDataTypeServices, IDataTypeIdentifier, IDataTypeConverter, ComparersResult, IDataTypeComparer, IDataTypeFormatter, IDataTypeCheckGenerator } from "../Interfaces/DataTypes";
import { CultureLanguageCode, DeepClone } from '../Utilities/Utilities';
import { IValidationServices, ToIServicesAccessor } from "../Interfaces/ValidationServices";
import { ICondition } from "../Interfaces/Conditions";
import { LookupKey } from "./LookupKeys";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { ConditionType } from '../Conditions/ConditionTypes';
import { DataTypeCheckConditionDescriptor } from "../Conditions/ConcreteConditions";
import { CompareCategory, LoggingLevel, LookupKeyCategory } from "../Interfaces/Logger";


/**
 * A service that knows about data types providing tools for:
 * - Identifying them using {@link DataTypes/Interfaces!IDataTypeIdentifier | IDataTypeIdentifier} 
 * - Converting them into something better suited for comparisons and formatting
 *  using {@link DataTypes/Interfaces!IDataTypeConverter | IDataTypeConverter} 
 * - Formatting them for the tokens of error messages
 *  using {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter} 
 * - Comparing them  using {@link DataTypes/Interfaces!IDataTypeComparer | IDataTypeComparer} 
 * It works in conjunction with the DataType Lookup Keys {@link DataTypes/LookupKeys! | Lookup Keys }.
 * 
 * Formatting uses localization. It uses IDataTypeFormatter classes,
 * which may handle multiple cultures. When searching for a formatter,
 * it tries the ValidationServices.ActiveCultureID first and if no formatter
 * is supplied for that culture, it has a chain of fallback cultures that you supply
 * in the constructor.
 * 
 * This class is available on {@link ValidationServices/ConcreteClass!ValidationServices.DataTypeServices}.
 */
export class DataTypeServices implements IDataTypeServices {
    /**
     * Constructor
     * @param cultureFallbacks - All of the cultures that you intend to support, along with fallback Cultures
     * If null, it will create a single entry from the ValidationServices.ActiveCultureID
     */
    constructor(cultureFallbacks?: Array<CultureIdFallback> | null) {
        if (cultureFallbacks && cultureFallbacks.length > 0)
            this._cultureConfig = DeepClone(cultureFallbacks) as Array<CultureIdFallback>;
    }

    /**
     * Services accessor.
     * Note: Not passed into the constructor because this object should be created before
     * ValidationServices itself. So it gets assigned when ValidationService.DataTypeServices is assigned a value.
     */
    public get Services(): IValidationServices
    {
        if (!this._services)
            throw new CodingError('Assign Services property to ValidationServices.DataTypeServices first.');
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
        this._dataTypeFormatters?.forEach((dtf) => {
            let sa = ToIServicesAccessor(dtf);
            if (sa)
                sa.Services = services;
        });
        if (!this._cultureConfig || this._cultureConfig.length === 0)
            this._cultureConfig = [{ CultureId: services.ActiveCultureId }];        
    }

    protected get CultureIdFallback(): Array<CultureIdFallback> {
        if (!this._cultureConfig || this._cultureConfig.length === 0)
            throw new CodingError('Must establish the CultureIdFallback array in DataTypeServices.')
        return this._cultureConfig;
    }
    private _cultureConfig: Array<CultureIdFallback> | null = null;

    /**
     * Utility to check for the presence of a Culture.
     * Will fallback to language only check if language-country
     * cultureID doesn't find a match. In other words, if 'en-US' isn't found,
     * it tries 'en'.
     * @returns the found cultureID, so you know if it exactly matched or just 
     * got the language. If no match, returns null.
     */
    public GetClosestCultureId(cultureId: string): string | null {
        let cc = this.GetClosestCultureIdFallback(cultureId);
        if (cc)
            return cc.CultureId;
        return null;
    }
    protected GetClosestCultureIdFallback(cultureId: string): CultureIdFallback | null {
        let cc = this.GetCultureIdFallback(cultureId);
        if (!cc) {
            let lang = CultureLanguageCode(cultureId);
            if (lang !== cultureId) {
                cc = this.GetCultureIdFallback(lang);
            }
        }
        return cc ?? null;
    }    
    protected GetCultureIdFallback(cultureId: string): CultureIdFallback | null
    {
        return this.CultureIdFallback.find((cc) => cc.CultureId === cultureId) ?? null;
    }


    //#region Format, IDataTypeFormatter and AdditionalFormatters.    
    /**
     * Converts the native value to a string that can be shown to the user.
     * Result includes the successfully converted value
     * or validation error information.
     * 
     * Formatting uses localization. It uses 
     * {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter} classes,
     * which may handle multiple cultures. When searching for a formatter,
     * it tries the ValidationServices.ActiveCultureID first and if no formatter
     * is supplied for that culture, it has a chain of fallback cultures that you supply
     * in the constructor.
     * @param value
     * @param lookupKey - If not supplied, a lookup key is created based on the native value type.
     * 
     * If you need alternative formatting or are supporting a user defined type,
     * always pass in the associated lookup key. They can be found in the LookupKeys module.
     * @returns successfully converted value or validation error information.
    */
    public Format(value: any, lookupKey?: string | null): DataTypeResolution<string> {
        try {
            if (!lookupKey)
                lookupKey = this.IdentifyLookupKey(value);
            if (lookupKey === null)
                throw new Error('Value type requires a LookupKey');
            let cultureId: string | null = this.Services.ActiveCultureId;
            while (cultureId) {
                let cc = this.GetCultureIdFallback(cultureId);
                if (!cc)
                    throw new Error(`Need to support CultureID ${cultureId} in DataTypeServices.`);
                let dtlf = this.GetFormatter(lookupKey, cultureId);
                if (dtlf)
                    try {
                        return dtlf.Format(value, lookupKey, cultureId);
                    }
                    catch (e) {
                        return { ErrorMessage: (e as Error).message };
                    }
                cultureId = cc.FallbackCultureId ?? null;
            }

            throw new Error(`Unsupported LookupKey ${lookupKey}`);
        }
        catch (e)
        {
            if (e instanceof Error) // should always be true. Mostly used for typecast
            {
                this.Services.LoggerService.Log(e.message, LoggingLevel.Error, LookupKeyCategory, 'DataTypeServices');
                return {
                    ErrorMessage: e.message,
                    Value: undefined
                }
            }
            return { ErrorMessage: 'Unspecified'}
        }
    }

    /**
      * Registers an {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter}
      * for use by the Format function.
      * 
      * If the LookupKey was previously registered, its instance is replaced.
      * @param dtlf
      */
    public RegisterFormatter(dtlf: IDataTypeFormatter): void {
        AssertNotNull(dtlf, 'dtlf');
        if (!this._dataTypeFormatters)
            this._dataTypeFormatters = [];
        this._dataTypeFormatters.push(dtlf);
        if (this._services) {
            let sa = ToIServicesAccessor(dtlf);
            if (sa)
                sa.Services = this._services;
        }
    }
    /**
     * Removes the first {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter}
     * that supports both parameters.
     * @param lookupKey 
     * @param cultureID 
     * @returns 
     */
    public UnregisterFormatter(lookupKey: string, cultureID: string): boolean {
        let index = this.GetFormatters().findIndex((dtlf) => dtlf.Supports(lookupKey, cultureID));
        if (index >= 0) {
            this._dataTypeFormatters!.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Gets the {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter}
     * associated with the lookup key and this class's
     * own CultureID.
     * @param lookupKey
     * @returns A matching IDataTypeFormatter or null if none match.
     */
    public GetFormatter(lookupKey: string, cultureId: string): IDataTypeFormatter | null {
        return this.GetFormatters().find((dtlf) => dtlf.Supports(lookupKey, cultureId)) ?? null;
    }

    /**
     * If the user hasn't registered any, this registers the standard
     * IDataTypeFormatters.
     */
    protected GetFormatters() : Array<IDataTypeFormatter>
    {
        if (!this._dataTypeFormatters) {
            this._dataTypeFormatters = [];
        }
        return this._dataTypeFormatters;
    }

    /**
     * All registered IDataTypeFormatters.
     */
    private _dataTypeFormatters: Array<IDataTypeFormatter>|null = null;

    //#endregion Format, IDataTypeFormatter.

    //#region CompareValues and IDataTypeComparer
    /**
     * Compares two values to see if they are equal or not.
     * 
     * It can return Equals and NotEquals for types that make no sense
     * to support greater than and less than.
     * 
     * Otherwise it returns Equals, LessThan, or GreaterThan.
     * When value types are a mismatch or not supported,
     * it returns Undetermined.
     * 
     * Also expect exceptions in some cases when invalid values are supplied.
     * If either value is null, it will either return Equals (both null)
     * or Undetermined.
     * 
     * Data Types will be convertered to make different types into
     * a common type, objects into numbers (Dates in particular),
     * and allow you to represent the value differently, such as getting
     * just the month from the Date object for comparison.
     * 
     * Conversions use implementations of {@link DataTypes/Interfaces!IDataTypeConverter | IDataTypeConverter}.
     * There is a default comparison function used here, which knows
     * how to compare only numbers and strings. Most values can be converted
     * to numbers or strings and will be supported by a DataTypeConverter.
     * 
     * For example, a Date object.
     * If you need another way to convert - as Booleans do - you
     * can implement {@link DataTypes/Interfaces!IDataTypeComparer | IDataTypeComparer}.
     * @param value1 
     * @param value2 
     * @param lookupKey1 - Identifies the IDataTypeConverter to use
     *   together with value1. 
     *   If null, the native data type of the value will be converted to a lookupKey
     *   when String, Number, Boolean, Date object, or any IDataTypeIdentifier that you have registered
     *   with the DataTypeServices.
     * @param lookupKey2 - Same idea as lookupKey1 but for value2.
     * @returns For incompatible values where they couldn't be converted to
     * something compatible, expect Undetermined.
     * 
     * For booleans and types where greater than and less then don't make sense,
     * expect Equals and Not Equals.
     * 
     * For the rest, expect Equals, GreaterThan and LessThan.
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
        let self = this;
        try {
            let testNullsResult = handleNullsAndUndefined(value1, value2);
            if (testNullsResult != null)
                return testNullsResult;

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
        catch (e)
        {
            if (e instanceof Error)
                this.Services.LoggerService.Log(e.message, LoggingLevel.Error, CompareCategory, 'DataTypeServices');
            return ComparersResult.Undetermined;
        }
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
     * 
     * You can add your own data types by implementing {@link DataTypes/Interfaces!IDataTypeIdentifier | IDataTypeIdentifier}
     * and registered you class with the DataTypeServices.
     * @param value 
     * @returns the found Lookup Key or "Unsupported".
     */
    public IdentifyLookupKey(value: any): string | null {
        let idt = this.GetDataTypeIdentifier(value);
        return idt ? idt.DataTypeLookupKey : null;
    }

    /**
     * Registers an implementation of {@link DataTypes/Interfaces!IDataTypeIdentifier | IDataTypeIdentifier}.
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

    //#region IDataTypeConverter

    /**
     * Registers a {@link DataTypes/Interfaces!IDataTypeConverter | IDataTypeConverter}. 
     * Always adds, never replaces.
     * @param converter 
     */
    public RegisterDataTypeConverter(converter: IDataTypeConverter): void {
        AssertNotNull(converter, 'converter');
        if (!this._converters)
            this._converters = [];
        this._converters.push(converter);
    }

    /**
     * Gets the first {@link DataTypes/Interfaces!IDataTypeConverter | IDataTypeConverter}
     *  that supports the value, or null if none are found.
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

    //#endregion IDataTypeConverter

    //#region IDataTypeCheckGenerator
    /**
     * When true, data type check conditions are auto generated if not 
     * supplied in the ValueHost's list of validators.
     * Defaults to true.
     */
    public get AutoGenerateDataTypeConditionEnabled(): boolean
    {
        return this._autoGenerateDataTypeConditionEnabled;
    }
    public set AutoGenerateDataTypeConditionEnabled(value: boolean)
    {
        this._autoGenerateDataTypeConditionEnabled = value;
    }
    private _autoGenerateDataTypeConditionEnabled: boolean = true;
    /**
     * Works together with IDataTypeCheckGenerator to attempt to supply an ICondition
     * suitable for the given data type lookup key that is used as a Data Type Check
     * against the native value.
     * 
     * By default, automatic generation uses the DataTypeCheckCondition.
     * 
     * That condition determines an error when ValueHost.NativeValue is undefined,
     * which is a result of a conversion of InputValue fails.
     * 
     * There are other ways to check a data type. Strings with a well 
     * defined pattern will often be the same as they were between
     * InputValue and NativeValue, aside from trimming spaces.
     * So the NativeValue is a string that will need to be checked against
     * a regular expression or some other rule that confirms the string matches requirements.
     * 
     * Thats when you create a IDataTypeCheckGenerator class and register it with
     * DataTypeServices.
     * 
     * @param dataTypeLookupKey 
     * @returns The Condition generated by a matching IDataTypeCheckGenerator,
     * or a DataTypeCheckCondition if none was generated. If DataTypeCheckGenerator
     * returns a null, it means do not generate the DataTypeCheckCondition and this function
     * returns null itself.
     */    
    public AutoGenerateDataTypeCondition(valueHost: IInputValueHost, dataTypeLookupKey: LookupKey | string): ICondition | null
    {
        AssertNotNull(valueHost, 'valueHost');
        AssertNotNull(dataTypeLookupKey, 'dataTypeLookupKey');
        let generator = this.GetDataTypeCheckGenerator(dataTypeLookupKey);
        if (generator !== null)
            return generator.CreateCondition(valueHost, dataTypeLookupKey, this.Services.ConditionFactory); // may return null
        let descriptor: DataTypeCheckConditionDescriptor = {
            Type: ConditionType.DataTypeCheck,
            ValueHostId: valueHost.GetId(),
        };
        return this.Services.ConditionFactory.Create(descriptor);
    }

    /**
     * Registers a {@link DataTypes/Interfaces!IDataTypeCheckGenerator | IDataTypeCheckGenerator}. 
     * Always adds, never replaces.
     * @param checkGenerator 
     */
    public RegisterDataTypeCheckGenerator(checkGenerator: IDataTypeCheckGenerator): void {
        AssertNotNull(checkGenerator, 'checkGenerator');
        if (!this._checkGenerators)
            this._checkGenerators = [];
        this._checkGenerators.push(checkGenerator);
    }

    /**
     * Gets the first {@link DataTypes/Interfaces!IDataTypeCheckGenerator | IDataTypeCheckGenerator}
     *  that supports the value, or null if none are found.
     * @param value 
     * @param dataTypeLookupKey 
     * @returns 
     */
    public GetDataTypeCheckGenerator(dataTypeLookupKey: LookupKey | string): IDataTypeCheckGenerator | null {
        return this.GetDataTypeCheckGenerators().find((dtg) => dtg.SupportsValue(dataTypeLookupKey)) ?? null;
    }
    protected GetDataTypeCheckGenerators(): Array<IDataTypeCheckGenerator>
    {
        if (!this._checkGenerators)
            this._checkGenerators = [];
        return this._checkGenerators;
    }
    private _checkGenerators: Array<IDataTypeCheckGenerator> | null = null;    
    //#endregion IDataTypeCheckGenerator
}

/**
 * Identifies a CultureID ('en', 'en-US', 'en-GB', etc) that you are supporting.
 * Supplies a fallback CultureID if the culture requested did not have any support.
 * Used by {@link DataTypeServices}. Pass an array of these into the DataTypeServices constructor.
 */
export interface CultureIdFallback {
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
     */
    FallbackCultureId?: string | null;
}
