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
 * - Converter - Change the native value into somethat used by a Condition.evaluate() function.
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

import { defaultComparer } from './DataTypeComparers';
import { assertNotNull, CodingError } from '../Utilities/ErrorHandling';
import { DataTypeResolution, IDataTypeServices, IDataTypeIdentifier, IDataTypeConverter, ComparersResult, IDataTypeComparer, IDataTypeFormatter, IDataTypeCheckGenerator } from '../Interfaces/DataTypes';
import { cultureLanguageCode, deepClone } from '../Utilities/Utilities';
import { IValidationServices, toIServicesAccessor } from '../Interfaces/ValidationServices';
import { ICondition } from '../Interfaces/Conditions';
import { LookupKey } from './LookupKeys';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { ConditionType } from '../Conditions/ConditionTypes';
import { DataTypeCheckConditionDescriptor } from '../Conditions/ConcreteConditions';
import { CompareCategory, LoggingLevel, LookupKeyCategory } from '../Interfaces/Logger';


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
 * it tries the ValidationServices.activeCultureID first and if no formatter
 * is supplied for that culture, it has a chain of fallback cultures that you supply
 * in the constructor.
 * 
 * This class is available on {@link ValidationServices/ConcreteClass!ValidationServices.DataTypeServices}.
 */
export class DataTypeServices implements IDataTypeServices {
    /**
     * Constructor
     * @param cultureFallbacks - All of the cultures that you intend to support, along with fallback Cultures
     * If null, it will create a single entry from the ValidationServices.activeCultureID
     */
    constructor(cultureFallbacks?: Array<CultureIdFallback> | null) {
        if (cultureFallbacks && cultureFallbacks.length > 0)
            this._cultureConfig = deepClone(cultureFallbacks) as Array<CultureIdFallback>;
    }

    /**
     * Services accessor.
     * Note: Not passed into the constructor because this object should be created before
     * ValidationServices itself. So it gets assigned when ValidationService.DataTypeServices is assigned a value.
     */
    public get services(): IValidationServices
    {
        if (!this._services)
            throw new CodingError('Assign Services property to ValidationServices.DataTypeServices first.');
        return this._services;
    }
    public set services(services: IValidationServices)
    {
        assertNotNull(services, 'services');
        this._services = services;
        this.updateServices(services);
    }
    private _services: IValidationServices | null = null;

    /**
     * Changes the services on all implementations of IServicesAccessor
     * @param services 
     */
    protected updateServices(services: IValidationServices): void
    {
        this._dataTypeFormatters?.forEach((dtf) => {
            let sa = toIServicesAccessor(dtf);
            if (sa)
                sa.services = services;
        });
        if (!this._cultureConfig || this._cultureConfig.length === 0)
            this._cultureConfig = [{ cultureId: services.activeCultureId }];        
    }

    protected get cultureIdFallback(): Array<CultureIdFallback> {
        if (!this._cultureConfig || this._cultureConfig.length === 0)
            throw new CodingError('Must establish the CultureIdFallback array in DataTypeServices.');
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
    public getClosestCultureId(cultureId: string): string | null {
        let cc = this.getClosestCultureIdFallback(cultureId);
        if (cc)
            return cc.cultureId;
        return null;
    }
    protected getClosestCultureIdFallback(cultureId: string): CultureIdFallback | null {
        let cc = this.getCultureIdFallback(cultureId);
        if (!cc) {
            let lang = cultureLanguageCode(cultureId);
            if (lang !== cultureId) {
                cc = this.getCultureIdFallback(lang);
            }
        }
        return cc ?? null;
    }    
    protected getCultureIdFallback(cultureId: string): CultureIdFallback | null
    {
        return this.cultureIdFallback.find((cc) => cc.cultureId === cultureId) ?? null;
    }


    //#region format, IDataTypeFormatter and AdditionalFormatters.    
    /**
     * Converts the native value to a string that can be shown to the user.
     * Result includes the successfully converted value
     * or validation error information.
     * 
     * Formatting uses localization. It uses 
     * {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter} classes,
     * which may handle multiple cultures. When searching for a formatter,
     * it tries the ValidationServices.activeCultureID first and if no formatter
     * is supplied for that culture, it has a chain of fallback cultures that you supply
     * in the constructor.
     * @param value
     * @param lookupKey - If not supplied, a lookup key is created based on the native value type.
     * 
     * If you need alternative formatting or are supporting a user defined type,
     * always pass in the associated lookup key. They can be found in the LookupKeys module.
     * @returns successfully converted value or validation error information.
    */
    public format(value: any, lookupKey?: string | null): DataTypeResolution<string> {
        try {
            if (!lookupKey)
                lookupKey = this.identifyLookupKey(value);
            if (lookupKey === null)
                throw new Error('Value type requires a LookupKey');
            let cultureId: string | null = this.services.activeCultureId;
            while (cultureId) {
                let cc = this.getCultureIdFallback(cultureId);
                if (!cc)
                    throw new Error(`Need to support CultureID ${cultureId} in DataTypeServices.`);
                let dtlf = this.getFormatter(lookupKey, cultureId);
                if (dtlf)
                    try {
                        return dtlf.format(value, lookupKey, cultureId);
                    }
                    catch (e) {
                        return { errorMessage: (e as Error).message };
                    }
                cultureId = cc.fallbackCultureId ?? null;
            }

            throw new Error(`Unsupported LookupKey ${lookupKey}`);
        }
        catch (e)
        {
            if (e instanceof Error) // should always be true. Mostly used for typecast
            {
                this.services.loggerService.log(e.message, LoggingLevel.Error, LookupKeyCategory, 'DataTypeServices');
                return {
                    errorMessage: e.message,
                    value: undefined
                };
            }
            return { errorMessage: 'Unspecified'};
        }
    }

    /**
      * Registers an {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter}
      * for use by the format() function.
      * 
      * If the LookupKey was previously registered, its instance is replaced.
      * @param dtlf
      */
    public registerFormatter(dtlf: IDataTypeFormatter): void {
        assertNotNull(dtlf, 'dtlf');
        if (!this._dataTypeFormatters)
            this._dataTypeFormatters = [];
        this._dataTypeFormatters.push(dtlf);
        if (this._services) {
            let sa = toIServicesAccessor(dtlf);
            if (sa)
                sa.services = this._services;
        }
    }
    /**
     * Removes the first {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter}
     * that supports both parameters.
     * @param lookupKey 
     * @param cultureID 
     * @returns 
     */
    public unregisterFormatter(lookupKey: string, cultureID: string): boolean {
        let index = this.getFormatters().findIndex((dtlf) => dtlf.supports(lookupKey, cultureID));
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
    public getFormatter(lookupKey: string, cultureId: string): IDataTypeFormatter | null {
        return this.getFormatters().find((dtlf) => dtlf.supports(lookupKey, cultureId)) ?? null;
    }

    /**
     * If the user hasn't registered any, this registers the standard
     * IDataTypeFormatters.
     */
    protected getFormatters() : Array<IDataTypeFormatter>
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

    //#endregion format, IDataTypeFormatter.

    //#region compareValues() and IDataTypeComparer
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
    public compareValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult {
        function resolveLookupKey(v: any, key: string | null, part: string): string | null {
            if (v != null) // null/undefined
            {
                if (!key)
                    key = self.identifyLookupKey(v);
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

            let comparer = this.getDataTypeComparer(value1, value2);
            if (comparer)
                return comparer.compare(value1, value2);

            let cleanedUpValue1 = this.cleanupComparableValue(value1, lookupKey1);
            let cleanedUpValue2 = this.cleanupComparableValue(value2, lookupKey2);

            let testNullsResultCU = handleNullsAndUndefined(cleanedUpValue1, cleanedUpValue2);
            if (testNullsResultCU != null)
                return testNullsResultCU;

            let comparerCU = this.getDataTypeComparer(cleanedUpValue1, cleanedUpValue2);
            if (comparerCU)
                return comparerCU.compare(cleanedUpValue1, cleanedUpValue2);

            return defaultComparer(cleanedUpValue1, cleanedUpValue2);
        }
        catch (e)
        {
            if (e instanceof Error)
                this.services.loggerService.log(e.message, LoggingLevel.Error, CompareCategory, 'DataTypeServices');
            return ComparersResult.Undetermined;
        }
    }

    protected cleanupComparableValue(value: any, lookupKey: string | null): any {
        let dtc = this.getDataTypeConverter(value, lookupKey);
        if (dtc) {
            value = dtc.convert(value, lookupKey!);
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
                    value = this.cleanupComparableValue(value, null);
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
    public registerDataTypeComparer(comparer: IDataTypeComparer): void {
        assertNotNull(comparer, 'comparer');

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
    protected getDataTypeComparer(value1: any, value2: any): IDataTypeComparer | null {
        return this.getDataTypeComparers().find((dtc) => dtc.supportsValues(value1, value2)) ?? null;
    }

    protected getDataTypeComparers(): Array<IDataTypeComparer>
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
    public identifyLookupKey(value: any): string | null {
        let idt = this.getDataTypeIdentifier(value);
        return idt ? idt.dataTypeLookupKey : null;
    }

    /**
     * Registers an implementation of {@link DataTypes/Interfaces!IDataTypeIdentifier | IDataTypeIdentifier}.
     * The built-in implementations are preregistered.
     * @param identifier - If its DataTypeLookupKey matches an existing one (case insensitive),
     * the existing one is replaced.
     */
    public registerDataTypeIdentifier(identifier: IDataTypeIdentifier): void {
        assertNotNull(identifier, 'identifier');
        let existingPos = this.getDataTypeIdentifiers().findIndex((idt) => idt.dataTypeLookupKey.toLowerCase() === identifier.dataTypeLookupKey.toLowerCase());
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
    protected getDataTypeIdentifier(value: any): IDataTypeIdentifier | null {
        return this.getDataTypeIdentifiers().find((idt) => idt.supportsValue(value)) ?? null;
    }
    protected getDataTypeIdentifiers(): Array<IDataTypeIdentifier>
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
    public registerDataTypeConverter(converter: IDataTypeConverter): void {
        assertNotNull(converter, 'converter');
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
    public getDataTypeConverter(value: any, dataTypeLookupKey: string | null): IDataTypeConverter | null {
        return this.getDataTypeConverters().find((dtc) => dtc.supportsValue(value, dataTypeLookupKey)) ?? null;
    }
    protected getDataTypeConverters(): Array<IDataTypeConverter>
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
    public get autoGenerateDataTypeConditionEnabled(): boolean
    {
        return this._autoGenerateDataTypeConditionEnabled;
    }
    public set autoGenerateDataTypeConditionEnabled(value: boolean)
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
    public autoGenerateDataTypeCondition(valueHost: IInputValueHost, dataTypeLookupKey: LookupKey | string): ICondition | null
    {
        assertNotNull(valueHost, 'valueHost');
        assertNotNull(dataTypeLookupKey, 'dataTypeLookupKey');
        let generator = this.getDataTypeCheckGenerator(dataTypeLookupKey);
        if (generator !== null)
            return generator.createCondition(valueHost, dataTypeLookupKey, this.services.conditionFactory); // may return null
        let descriptor: DataTypeCheckConditionDescriptor = {
            type: ConditionType.DataTypeCheck,
            valueHostId: valueHost.getId()
        };
        return this.services.conditionFactory.create(descriptor);
    }

    /**
     * Registers a {@link DataTypes/Interfaces!IDataTypeCheckGenerator | IDataTypeCheckGenerator}. 
     * Always adds, never replaces.
     * @param checkGenerator 
     */
    public registerDataTypeCheckGenerator(checkGenerator: IDataTypeCheckGenerator): void {
        assertNotNull(checkGenerator, 'checkGenerator');
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
    public getDataTypeCheckGenerator(dataTypeLookupKey: LookupKey | string): IDataTypeCheckGenerator | null {
        return this.getDataTypeCheckGenerators().find((dtg) => dtg.supportsValue(dataTypeLookupKey)) ?? null;
    }
    protected getDataTypeCheckGenerators(): Array<IDataTypeCheckGenerator>
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
    cultureId: string;

    /**
     * Identifies another culture to check if a lookup key cannot be resolved.
     */
    fallbackCultureId?: string | null;
}
