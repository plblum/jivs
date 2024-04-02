/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeFormatterService!DataTypeFormatterService:class}
 * @module Services/ConcreteClasses/DataTypeFormatterService
 */

import { CultureIdFallback, IDataTypeFormatterService } from "../Interfaces/DataTypeFormatterService";
import { IDataTypeFormatter } from "../Interfaces/DataTypeFormatters";
import { DataTypeResolution } from "../Interfaces/DataTypes";
import { LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { CodingError } from "../Utilities/ErrorHandling";
import { cultureLanguageCode, deepClone } from "../Utilities/Utilities";
import { DataTypeServiceBaseWithServices } from "./DataTypeServiceBase";

/**
 * A service for formatting data types used within tokens of error messages
 * using {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter} instances.
 * 
 * Formatting uses localization. It uses IDataTypeFormatter classes,
 * which may handle multiple cultures. When searching for a formatter,
 * it tries the ValidationServices.activeCultureID first and if no formatter
 * is supplied for that culture, it has a chain of fallback cultures that you supply
 * in the constructor.
 * 
 * This class is available on {@link Services/ConcreteClasses/ValidationServices!ValidationServices.dataTypeFormatterService | ValidationServices.dataTypeFormatterService}.
 */
export class DataTypeFormatterService extends DataTypeServiceBaseWithServices<IDataTypeFormatter>
    implements IDataTypeFormatterService {

    /**
     * Constructor
     * @param cultureFallbacks - All of the cultures that you intend to support, along with fallback Cultures
     * If null, it will create a single entry from the ValidationServices.activeCultureID
     */
    constructor(cultureFallbacks?: Array<CultureIdFallback> | null) {
        super();
        if (cultureFallbacks && cultureFallbacks.length > 0)
            this._cultureConfig = deepClone(cultureFallbacks) as Array<CultureIdFallback>;
    }

    /**
     * Changes the services on all implementations of IServicesAccessor
     * @param services 
     */
    protected updateServices(services: IValidationServices): void {
        super.updateServices(services);
        if (!this._cultureConfig || this._cultureConfig.length === 0)
            this._cultureConfig = [{ cultureId: services.activeCultureId }];
    }

    protected get cultureIdFallback(): Array<CultureIdFallback> {
        if (!this._cultureConfig || this._cultureConfig.length === 0)
            throw new CodingError('Must establish the CultureIdFallback array in DataTypeFormatterService.');
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
    protected getCultureIdFallback(cultureId: string): CultureIdFallback | null {
        return this.cultureIdFallback.find((cc) => cc.cultureId === cultureId) ?? null;
    }
    
    protected indexOfExisting(item: IDataTypeFormatter): number {
        return -1;  // register does not replace existing
    }
    
    /**
     * {@inheritDoc Services/Types/IDataTypeFormatterService!IDataTypeFormatterService#format }
     */    
    public format(value: any, lookupKey?: string | null): DataTypeResolution<string> {
        try {
            if (!lookupKey)
                lookupKey = this.services.dataTypeIdentifierService.identify(value);
            if (lookupKey === null)
                throw new Error('Value type requires a LookupKey');
            let cultureId: string | null = this.services.activeCultureId;
            while (cultureId) {
                let cc = this.getCultureIdFallback(cultureId);
                if (!cc)
                    throw new Error(`Need to support CultureID ${cultureId} in DataTypeServices.`);
                let dtlf = this.find(lookupKey, cultureId);
                if (dtlf)
                    return dtlf.format(value, lookupKey, cultureId);

                cultureId = cc.fallbackCultureId ?? null;
            }

            throw new Error(`Unsupported LookupKey ${lookupKey}`);
        }
        catch (e) {
            if (e instanceof Error) // should always be true. Mostly used for typecast
            {
                this.services.loggerService.log(e.message, LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService');
                return {
                    errorMessage: e.message,
                    value: undefined
                };
            }
            return { errorMessage: 'Unspecified' }; // only gets here if IDataTypeFormatter.format itself throws without Error class
        }
    }

    /**
     * Removes the first {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter}
     * that supports both parameters.
     * @param lookupKey 
     * @param cultureID 
     * @returns 
     */
    public unregister(lookupKey: string, cultureID: string): boolean {
        let index = this.getAll().findIndex((dtlf) => dtlf.supports(lookupKey, cultureID));
        return this.unregisterByIndex(index);
    }

    /**
     * Finds the {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter}
     * associated with the lookup key and this class's own CultureID.
     * @param lookupKey
     * @returns A matching IDataTypeFormatter or null if none match.
     */
    public find(lookupKey: string, cultureId: string): IDataTypeFormatter | null {
        return this.getAll().find((dtlf) => dtlf.supports(lookupKey, cultureId)) ?? null;
    }
}