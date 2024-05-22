/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeFormatterService!DataTypeFormatterService:class}
 * @module Services/ConcreteClasses/DataTypeFormatterService
 */

import { IDataTypeFormatterService } from "../Interfaces/DataTypeFormatterService";
import { IDataTypeFormatter } from "../Interfaces/DataTypeFormatters";
import { DataTypeResolution } from "../Interfaces/DataTypes";
import { LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { CodingError, SevereErrorBase } from "../Utilities/ErrorHandling";
import { DataTypeServiceBaseWithServices } from "./DataTypeServiceBase";

/**
 * A service for formatting data types used within tokens of error messages
 * using {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter} instances.
 * 
 * Formatting uses localization. It uses IDataTypeFormatter classes,
 * which may handle multiple cultures. When searching for a formatter,
 * it tries the CultureService.activeCultureID first and if no formatter
 * is supplied for that culture, it has a chain of fallback cultures that you supply
 * in the constructor.
 * 
 * This class is available on {@link Services/ConcreteClasses/ValidationServices!ValidationServices.dataTypeFormatterService | ValidationServices.dataTypeFormatterService}.
 */
export class DataTypeFormatterService extends DataTypeServiceBaseWithServices<IDataTypeFormatter>
    implements IDataTypeFormatterService {

    /**
     * Constructor
     */
    constructor() {
        super();
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
                throw new CodingError('Value type requires a LookupKey');
            let cultureId: string | null = this.services.cultureService.activeCultureId;
            while (cultureId) {
                let cc = this.services.cultureService.find(cultureId);
                if (!cc)
                    throw new CodingError(`Need to support CultureID ${cultureId} in DataTypeServices.`);
                let dtlf = this.find(lookupKey, cultureId);
                if (dtlf)
                    return dtlf.format(value, lookupKey, cultureId);

                cultureId = cc.fallbackCultureId ?? null;
            }

            throw new CodingError(`Unsupported LookupKey ${lookupKey}`);
        }
        catch (e) {
            if (e instanceof Error) // should always be true. Mostly used for typecast
            {
                this.services.loggerService.log(e.message, LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService');
                if (e instanceof SevereErrorBase)
                    throw e;
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