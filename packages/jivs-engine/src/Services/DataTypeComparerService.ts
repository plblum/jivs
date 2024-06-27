/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeComparerService!DataTypeComparerService}
 * @module Services/ConcreteClasses/DataTypeComparerService
 */

import { ComparersResult, IDataTypeComparerService } from "../Interfaces/DataTypeComparerService";
import { IDataTypeComparer } from "../Interfaces/DataTypeComparers";
import { LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { BooleanDataTypeComparer, defaultComparer } from "../DataTypes/DataTypeComparers";
import { DataTypeConverterServiceBase } from "./DataTypeConverterServiceBase";
import { SevereErrorBase, ensureError } from "../Utilities/ErrorHandling";
import { valueForLog } from "../Utilities/Utilities";

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
                return v1 === v2 ? ComparersResult.Equals : ComparersResult.Undetermined;
            if (v1 === undefined || v2 === undefined)
                return ComparersResult.Undetermined;
            return null;    // not handled. Continue processing
        }
        let result: ComparersResult | null | undefined = undefined;
        try {
            try {
                result = handleNullsAndUndefined(value1, value2);
                if (result != null) {
                    this.log('Has nulls', LoggingLevel.Debug);
                    return result;
                }

                lookupKey1 = this.resolveLookupKey(value1, lookupKey1, 'Left');
                lookupKey2 = this.resolveLookupKey(value2, lookupKey2, 'Right');

                let comparer = this.find(value1, value2);
                if (comparer) {
                    this.log(()=> `Using ${valueForLog(comparer)} with ${lookupKey1} and ${lookupKey2}`, LoggingLevel.Debug);
                    result = comparer.compare(value1, value2);
                    return result;
                }

                let cleanedUpValue1 = this.cleanupConvertableValue(value1, lookupKey1);
                let cleanedUpValue2 = this.cleanupConvertableValue(value2, lookupKey2);

                result = handleNullsAndUndefined(cleanedUpValue1, cleanedUpValue2);
                if (result != null) {
                    this.log('Has nulls', LoggingLevel.Debug);
                    return result;
                }

                let comparerCU = this.find(cleanedUpValue1, cleanedUpValue2);
                if (comparerCU) {
                    this.log(()=> `Using ${valueForLog(comparerCU)} with ${lookupKey1} and ${lookupKey2}`, LoggingLevel.Debug);
                    result = comparerCU.compare(cleanedUpValue1, cleanedUpValue2);
                    return result;
                }

                this.log(`Using defaultComparer with ${lookupKey1} and ${lookupKey2}`, LoggingLevel.Debug);
                result = defaultComparer(cleanedUpValue1, cleanedUpValue2);
                return result;
            }
            catch (e) {
                let err = ensureError(e);

                this.log(err.message, LoggingLevel.Error, LoggingCategory.Exception);
                if (err instanceof SevereErrorBase)
                    throw e;

                result = ComparersResult.Undetermined;
                return result;
            }
        }
        finally
        {
            if (result !== undefined)
                this.log(`Compare result: ${ComparersResult[result]}`, LoggingLevel.Info, LoggingCategory.Result);
        }
    }
    /**
     * Returns a comparer that supports both values or null if not.
     * Runs the lazyloader if setup and the first search fails.
     * @param value1 
     * @param value2 
     * @returns 
     */
    public find(value1: any, value2: any): IDataTypeComparer | null {
        let result = this.getAll().find((dtc) => dtc.supportsValues(value1, value2)) ?? null;
        if (result === null && this.ensureLazyLoaded())
            result = this.find(value1, value2);
        return result;
    }

}