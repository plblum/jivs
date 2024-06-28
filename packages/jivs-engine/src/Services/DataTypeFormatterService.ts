/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeFormatterService!DataTypeFormatterService:class}
 * @module Services/ConcreteClasses/DataTypeFormatterService
 */

import { IDataTypeFormatterService } from '../Interfaces/DataTypeFormatterService';
import { IDataTypeFormatter } from '../Interfaces/DataTypeFormatters';
import { DataTypeResolution } from '../Interfaces/DataTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { CodingError, SevereErrorBase, ensureError } from '../Utilities/ErrorHandling';
import { DataTypeServiceBase } from './DataTypeServiceBase';
import { LookupKeyFallbackService } from './LookupKeyFallbackService';

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
export class DataTypeFormatterService extends DataTypeServiceBase<IDataTypeFormatter>
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
        return this.formatRecursive(value, lookupKey, new Set<string>());
    }
    protected formatRecursive(value: any, lookupKey: string | null | undefined, alreadyChecked: Set<string>): DataTypeResolution<string> {
        try {
            if (!lookupKey) {
                this.logQuick(LoggingLevel.Debug, ()=> 'Identify LookupKey from value');
                lookupKey = this.services.dataTypeIdentifierService.identify(value);
            }
            if (lookupKey === null)
                throw new CodingError('Value type requires a LookupKey');

            // recursion defense
            LookupKeyFallbackService.ensureRecursionSafe(lookupKey, alreadyChecked);

            let cultureId: string | null = this.services.cultureService.activeCultureId;
            while (cultureId) {
                let cc = this.services.cultureService.find(cultureId);
                /* istanbul ignore next */ // this error is defensive, but currently find will never return null for an activeCultureID
                if (!cc)
                    throw new CodingError(`Need to support CultureID ${cultureId} in DataTypeServices.`);
                this.logQuick(LoggingLevel.Debug, () => `Trying cultureId: ${cultureId}`);
                let dtlf = this.find(lookupKey, cultureId);
                if (dtlf) {
                    this.logQuick(LoggingLevel.Debug, ()=> `Formatter selected: ${dtlf.constructor.name} with culture "${cultureId}"`);
                    let result = dtlf.format(value, lookupKey, cultureId);
                    if (result.value)
                        this.log(LoggingLevel.Info, () => {
                            return {
                                message: `Formatted "${lookupKey}" with culture "${cultureId}": "${result.value}`,
                                category: LoggingCategory.Result
                            }
                        });                    
                    return result;
                }

                cultureId = cc.fallbackCultureId ?? null;
            }
            let fallbackLookupKey = this.services.lookupKeyFallbackService.find(lookupKey);
            if (fallbackLookupKey) {
                this.logQuick(LoggingLevel.Debug, () => `Trying fallback: ${fallbackLookupKey}`);
                return this.formatRecursive(value, fallbackLookupKey, alreadyChecked);
            }
            
            throw new CodingError(`No DataTypeFormatter for LookupKey "${lookupKey}" with culture "${this.services.cultureService.activeCultureId}"`);
        }
        catch (e) {
            let err = ensureError(e);
            this.logError(err);
            if (err instanceof SevereErrorBase)
                throw err;
            return {
                errorMessage: err.message,
                value: undefined
            };
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
     * Runs the lazyloader if setup and the first search fails.
     * @param lookupKey
     * @returns A matching IDataTypeFormatter or null if none match.
     */
    public find(lookupKey: string, cultureId: string): IDataTypeFormatter | null {
        let result = this.getAll().find((dtlf) => dtlf.supports(lookupKey, cultureId)) ?? null;
        if (result === null && this.ensureLazyLoaded())
            result = this.find(lookupKey, cultureId);
        return result;        
    }

}