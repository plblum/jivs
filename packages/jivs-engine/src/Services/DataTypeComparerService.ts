/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeComparerService!DataTypeComparerService}
 * @module Services/ConcreteClasses/DataTypeComparerService
 */

import { ComparersResult, IDataTypeComparerService } from "../Interfaces/DataTypeComparerService";
import { IDataTypeComparer } from "../Interfaces/DataTypeComparers";
import { LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { CodingError } from "../Utilities/ErrorHandling";
import { BooleanDataTypeComparer, defaultComparer } from "../DataTypes/DataTypeComparers";
import { DataTypeServiceBase, DataTypeServiceBaseWithServices } from "./DataTypeServiceBase";

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
export class DataTypeComparerService extends DataTypeServiceBaseWithServices<IDataTypeComparer>
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
        function resolveLookupKey(v: any, key: string | null, part: string): string | null {
            if (v != null) // null/undefined
            {
                if (!key)
                    key = self.services.dataTypeIdentifierService.identify(v);
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

            let comparer = this.find(value1, value2);
            if (comparer)
                return comparer.compare(value1, value2);

            let cleanedUpValue1 = this.cleanupComparableValue(value1, lookupKey1);
            let cleanedUpValue2 = this.cleanupComparableValue(value2, lookupKey2);

            let testNullsResultCU = handleNullsAndUndefined(cleanedUpValue1, cleanedUpValue2);
            if (testNullsResultCU != null)
                return testNullsResultCU;

            let comparerCU = this.find(cleanedUpValue1, cleanedUpValue2);
            if (comparerCU)
                return comparerCU.compare(cleanedUpValue1, cleanedUpValue2);

            return defaultComparer(cleanedUpValue1, cleanedUpValue2);
        }
        catch (e) {
            if (e instanceof Error)
                this.services.loggerService.log(e.message, LoggingLevel.Error, LoggingCategory.Compare, 'DataTypeComparerService');
            return ComparersResult.Undetermined;
        }
    }
/**
 * Applies a converter specific to the value. If the result is an object (like Date or custom),
 * it repeats with the new value, hopefully resulting in a primitive value for use by the 
 * DefaultComparer.
 * Date -> number using UTCDateConverter
 * RelativeDate class with getDate(): Date property -> Date -> number using RelativeDateConverter and UTCDateConverter.
 * @param value 
 * @param lookupKey 
 * @returns 
 */
    protected cleanupComparableValue(value: any, lookupKey: string | null): any {
        // NOTE: Did not use dataTypeConverterService.convert() directly
        // because we want to return the original value if no converter was found.
        // dataTypeconverterService.convert will return undefined in that case,
        // but also may return undefined from the DataTypeConverter.convert() function itself.
        let dtc = this.services.dataTypeConverterService.find(value, lookupKey);
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
     * Returns a comparer that supports both values or null if not.
     * @param value1 
     * @param value2 
     * @returns 
     */
    public find(value1: any, value2: any): IDataTypeComparer | null {
        return this.getAll().find((dtc) => dtc.supportsValues(value1, value2)) ?? null;
    }

}