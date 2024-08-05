/**
 * Provides data type and valueHost specific values for the ConfigAnalysisService 
 * to use in its analysis.
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */


import { ConfigAnalysisServiceOptions, ISampleValues } from "../../Interfaces/ConfigAnalysisService";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { IValueHostsServices } from "../../Interfaces/ValueHostsServices";

/**
 * Supplies a sample value for any lookup key supplied,
 * so long as it can be identified as a DataType with a value.
 * For example, make the "Integer" lookup key return "100" as a sample value.
 * 
 * Also allows the user to supply valueHost specific values through the options parameter
 * of ConfigAnalysisService.analyze(). See {@link Services/Types/ConfigAnalysisService!ConfigAnalysisServiceOptions}.

 * For example, make the "Last Name" ValueHost return "Smith" as a sample value.
 * 
 * It uses the DataTypeIdentifier services to get a default sample value
 * for each lookup key that has registered DataTypeIdentifiers.
 * Otherwise, you should add values into the options parameter of ConfigAnalysisService.constructor.
 * Use options.lookupKeysSampleValues for data type lookup keys
 * and options.valueHostsSampleValues for valueHost specific values.
 */
export class SampleValues<TServices extends IValueHostsServices> implements ISampleValues {
    constructor(services: TServices,
        options: ConfigAnalysisServiceOptions) {
        this._sampleValuesCache = new Map();
        this._services = services;
        this._options = options;
    }

    protected get options(): ConfigAnalysisServiceOptions {
        return this._options;
    }
    private _options: ConfigAnalysisServiceOptions;

    protected get services(): TServices {
        return this._services;
    }
    private _services: TServices;

    protected get lookupKeysSampleValues(): { [key: string]: any } {
        return this.options.lookupKeysSampleValues ?? {}
    }
    protected get valueHostsSampleValues(): { [key: string]: any } {
        return this.options.valueHostsSampleValues ?? {}
    }

    protected get sampleValuesCache(): Map<string, any> {
        return this._sampleValuesCache;
    }
    private _sampleValuesCache: Map<string, any>;

    /**
     * Tries to get a sample value for the lookup key or valueHost.
     * If it is not found, returns undefined.
     * ValueHost data is supplied by the user through options.valueHostsSampleValues.
     * LookupKey data can be supplied by the user through options.lookupKeysSampleValues.
     * If not found, it will try to identify the lookup key through DataTypeIdentifiers.
     * @param lookupKey 
     * @param valueHostConfig
     * @returns if undefined, there was no sample value found.
     * Otherwise the value (including null) is a sample value.
     */
    public getSampleValue(lookupKey: string , valueHostConfig: ValueHostConfig): any {
        // value host overrides everything
        let value = this.valueHostsSampleValues[valueHostConfig.name];
        if (value !== undefined)
            return value;
        return this.getSampleValueFromLookupKey(lookupKey, valueHostConfig);
    }
    /**
     * Looks for the Lookup Key sample value in options.lookupKeysSampleValues
     * then its cache. If not found, it will try to identify the lookup key
     * through DataTypeIdentifiers. If not found, it will try to use the valueHostConfig's
     * data type as a sample value, using this function recursively.
     * @param lookupKey 
     * @param valueHostConfig - pass null if trying the datatype of ValueHostConfig.
     * @returns 
     */
    protected getSampleValueFromLookupKey(lookupKey: string, valueHostConfig: ValueHostConfig | null): any {
        let value = this.lookupKeysSampleValues[lookupKey!];
        if (value !== undefined)
            return value;
        value = this.sampleValuesCache.get(lookupKey!);
        if (value !== undefined)
            return value;
        value = this.tryToIdentifyLookupKey(lookupKey!, this.services);
        if (value !== undefined)
            this.registerSampleValue(lookupKey!, value);
        else if (valueHostConfig) {
            // fallback to using valueHostConfig's data type 
            if (valueHostConfig.dataType && valueHostConfig.dataType !== lookupKey) {
                value = this.getSampleValueFromLookupKey(valueHostConfig.dataType, null);
            }
        }
        return value;
    }


    /**
     * Registers a sample value for the lookup key.
     * If the lookup key is already registered, it will replace the sample value.
     * @param lookupKey 
     * @param sampleValue 
     */
    public registerSampleValue(lookupKey: string, sampleValue: any): void {
        this.sampleValuesCache.set(lookupKey, sampleValue);
    }

    /**
     * Tries to determine the lookup key's sample value.
     * It must be one of the types in the identifier services,
     * which is resolved through IDataTypeIdentifier.sampleValue.
     * If the lookup key is not found, it will use the LookupKeyFallbackService
     * to try another. It will return undefined only if it runs out of fallbacks.
     * @param lookupKey 
     */
    protected tryToIdentifyLookupKey(lookupKey: string, services: IValueHostsServices): any {
        // implement this
        let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === lookupKey);
        if (dti)
            return dti.sampleValue();
        // try the LookupKeyFallbackService
        let fallback = services.lookupKeyFallbackService.find(lookupKey);
        if (fallback)
            return this.tryToIdentifyLookupKey(fallback, services); // RECURSION
        return undefined;
    }

}
