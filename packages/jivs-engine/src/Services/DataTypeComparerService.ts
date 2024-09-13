/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeComparerService!DataTypeComparerService}
 * @module Services/ConcreteClasses/DataTypeComparerService
 */

import { ComparersResult, IDataTypeComparerService } from "../Interfaces/DataTypeComparerService";
import { IDataTypeComparer } from "../Interfaces/DataTypeComparers";
import { LogDetails, LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { BooleanDataTypeComparer, defaultComparer } from "../DataTypes/DataTypeComparers";
import { DataTypeConverterServiceBase } from "./DataTypeConverterServiceBase";
import { InvalidTypeError, SevereErrorBase, ensureError } from "../Utilities/ErrorHandling";
import { valueForLog } from "../Utilities/Utilities";
import { LookupKey } from "../DataTypes/LookupKeys";

/**
 * A service for changing the comparing two values
 * using {@link DataTypes/Types/IDataTypeComparer!IDataTypeComparer | IDataTypeComparer} instances.
 * 
 * Used by Conditions to compare two values when those values don't naturally work
 * with the JavaScript comparison operators. Due to the Converter's ability to prepare
 * most values for the default comparison function, these aren't often created.
 *
 * This class is available on {@link Services/ConcreteClasses/ValidationServices!ValidationServices#dataTypeComparerService | ValidationServices.dataTypeComparerService}.
 */
export class DataTypeComparerService extends DataTypeConverterServiceBase<IDataTypeComparer>
    implements IDataTypeComparerService
{
    constructor()
    {
        super();
        this.preRegister();
    }

    protected preRegister(): void
    {
        this.register(new BooleanDataTypeComparer());        
       // any other predefined are found in create_services so users can opt out
    }
    protected indexOfExisting(item: IDataTypeComparer): number {
        return -1;  // register does not replace
    }
    /**
     * {@inheritDoc Services/Types/IDataTypeComparerService!IDataTypeComparerService.compare }
     */    
    public compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult {

        function handleNullsAndUndefined(v1: any, v2: any): ComparersResult | null {
            if (v1 === null || v2 === null)
                return v1 === v2 ? ComparersResult.Equal : ComparersResult.Undetermined;
            if (v1 === undefined || v2 === undefined)
                return ComparersResult.Undetermined;
            return null;    // not handled. Continue processing
        }
        function tryToFindAndCompare(v1: any, v2: any, lk1: string, lk2: string): ComparersResult | null {
            let comparer = self.find(v1, v2, lk1, lk2);
            if (comparer) {
                self.logUsingInstance(comparer);
                let result = comparer.compare(value1, value2, lk1, lk2);
                self.logResult(comparer, result, lk1, lk2);
                return result;
            }
            return null;
        }
        function prepForDefaultComparer(value: any, sourceLookupKey: string): string | number {
            if (typeof value !== 'string' && typeof value !== 'number') {
                let dtcs = self.services.dataTypeConverterService;
                let convResult = dtcs.convertUntilResult(value, sourceLookupKey, LookupKey.Number);
            // if value === undefined but resolvedValue, we keep searching for a string 
                if (!convResult.resolvedValue || convResult.value === undefined) {
                    convResult = dtcs.convertUntilResult(value, sourceLookupKey, LookupKey.String);
                    if (!convResult.resolvedValue)
                        throw new InvalidTypeError(`Compare failed. Could not convert from "${sourceLookupKey}" to a String or Number. Register a DataTypeConverter to cover this case.`);
                    value = convResult.value;
                }
                else
                    value = convResult.value;
            }
            return value;
        }
        let self = this;
        let result: ComparersResult | null | undefined = undefined;

        try {
            result = handleNullsAndUndefined(value1, value2);
            if (result != null) {
                this.logger.message(LoggingLevel.Debug, () => 'Has nulls');
                this.logResult('Nulls', result, lookupKey1!, lookupKey2!);
                return result;
            }

            lookupKey1 = this.resolveLookupKey(value1, lookupKey1, 'Left')!;
            lookupKey2 = this.resolveLookupKey(value2, lookupKey2, 'Right')!;

            let comparersResult = tryToFindAndCompare(value1, value2, lookupKey1, lookupKey2);
            if (comparersResult != null)
                return comparersResult;

            // see if the fallbackservice can supply lookup keys that find
            // the comparer wtih the same values. 
            // For example, BooleanDataTypeComparer with boolean values passed
            // but a data type of "Custom" will not be accepted, but
            // if the LookupKeyFallbackService has "Custom"=>LookupKey.Boolean
            // then the BooleanDataTypeComparer will be found.
            let lkfs = this.services.lookupKeyFallbackService;
            let lookupKey1Fallback = lkfs.fallbackToDeepestMatch(lookupKey1) ?? lookupKey1;
            let lookupKey2Fallback = lkfs.fallbackToDeepestMatch(lookupKey2) ?? lookupKey2;
            if (lookupKey1Fallback !== lookupKey1 ||
                lookupKey2Fallback !== lookupKey2) {
                comparersResult = tryToFindAndCompare(value1, value2, lookupKey1Fallback, lookupKey2Fallback);
                if (comparersResult != null)
                    return comparersResult;
            }
                
            // No converter was found. Use the defaultComparer which takes primitive values.
            // If its a string, we are all set. Treat everything else as a number.
            // convert to primitives for anything other than string or number.
            let cleanedUpValue1 = prepForDefaultComparer(value1, lookupKey1);
            let cleanedUpValue2 = prepForDefaultComparer(value2, lookupKey2);

            lookupKey1 = this.resolveLookupKey(cleanedUpValue1, null, 'Left');
            lookupKey2 = this.resolveLookupKey(cleanedUpValue2, null, 'Right');

            this.logger.message(LoggingLevel.Debug, () => `Using defaultComparer with ${lookupKey1} and ${lookupKey2}`);
            result = defaultComparer(cleanedUpValue1, cleanedUpValue2);
            this.logResult('DefaultComparer', result, lookupKey1, lookupKey2);
            return result;
        }
        catch (e) {
            this.logger.error(ensureError(e)); // will throw if SevereErrorBase
            result = ComparersResult.Undetermined;
            this.logResult(undefined, result, lookupKey1!, lookupKey2!);
            return result;
        }
    }

    protected logResult(comparer: any, result: ComparersResult, lookupKey1: string, lookupKey2: string): void {
        this.logger.log(LoggingLevel.Info, (options) => {
            let logDetails = <LogDetails>{
                message: `Comparison result: ${ComparersResult[result!]}`,
                category: LoggingCategory.Result
            };
            if (options?.includeData)
                logDetails.data = {
                    result: ComparersResult[result!],
                    comparer: valueForLog(comparer),
                    lookupKey1: lookupKey1,
                    lookupKey2: lookupKey2
                };
            
            return logDetails;
        });
    }
    /**
     * Returns a comparer that supports both values or null if not.
     * Runs the lazyloader if setup and the first search fails.
     * @param value1 
     * @param value2 
     * @returns 
     */
    public find(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): IDataTypeComparer | null {
        let result = this.getAll().find((dtc) => dtc.supportsValues(value1, value2, lookupKey1, lookupKey2)) ?? null;
        if (result === null && this.ensureLazyLoaded())
            result = this.find(value1, value2, lookupKey1, lookupKey2);
        return result;
    }

}