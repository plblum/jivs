/**
  * {@inheritDoc Services/ConcreteClasses/DataTypeConverterService!DataTypeConverterService:class}
  * @module Services/ConcreteClasses/DataTypeConverterService
 */

import { LoggingLevel, LoggingCategory } from "../Interfaces/LoggerService";
import { UTCDateOnlyConverter } from "../DataTypes/DataTypeConverters";
import { IDataTypeConverterService, SimpleValueType } from "../Interfaces/DataTypeConverterService";
import { IDataTypeConverter } from "../Interfaces/DataTypeConverters";
import { DataTypeConverterServiceBase } from "./DataTypeServiceBase";
import { CodingError, SevereErrorBase } from "../Utilities/ErrorHandling";

/**
 * A service for changing the original value into 
 * something that you want a condition to evaluate
 * using {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter} instances.
 * 
 * This is essential for comparison Conditions. Comparison works automatically
 * with string, number, and boolean native types. Converters exist to take a Date
 * or user defined class to a string, number, or boolean.
 * They are built on {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter}.
 */
export class DataTypeConverterService extends DataTypeConverterServiceBase<IDataTypeConverter>
    implements IDataTypeConverterService {
    constructor() {
        super();
        this.preRegister();
    }
    protected preRegister(): void {
        this.register(new UTCDateOnlyConverter());
        // any other predefined are found in create_services so users can opt out
    }

    protected indexOfExisting(item: IDataTypeConverter): number {
        return -1; // does not support replacements
    }

    /**
     * {@inheritDoc Services/Types/IDataTypeConverterService!IDataTypeConverterService#convert }
     */
    public convert(value: any, dataTypeLookupKey: string | null): SimpleValueType {
        try {
            let dtc = this.find(value, dataTypeLookupKey);

            if (dtc)
                return dtc.convert(value, dataTypeLookupKey!);
            return undefined;
        }
        catch (e) {
            if (e instanceof Error) {
                this.services.loggerService.log(e.message, LoggingLevel.Error, LoggingCategory.Convert, 'DataTypeComparerService');
                if (e instanceof SevereErrorBase)
                    throw e;

            }
            return undefined;
        }

    }
    /**
     * Converts the value using the DataTypeConverter identified in dataTypeLookupKey.
     * If the new value is not a primitive (number, string, boolean),
     * try to convert the new value using the DataTypeIdentifier to resolve a new Lookup Key.
     * Repeat until number, string, boolean or no further conversion is possible.
     * Return null if the value represents null.
     * Return undefined if the value was unconvertable.
     * @param value 
     * @param dataTypeLookupKey - if not supplied, it will attempt to resolve it with
     * the DataTypeIdentifiers.
     */
    public convertToPrimitive(value: any, dataTypeLookupKey: string | null): SimpleValueType
    {
        try {
            if (value == null) // null or undefined
                return value;

            dataTypeLookupKey = this.resolveLookupKey(value, dataTypeLookupKey, 'CalcValueHost function');

            return this.cleanupConvertableValue(value, dataTypeLookupKey);
        }
        catch (e) {
            if (e instanceof Error) {
                this.services.loggerService.log(e.message, LoggingLevel.Error, LoggingCategory.Compare, 'DataTypeConverterService');
                if (e instanceof SevereErrorBase)
                    throw e;
            }
            return undefined;
        }
    }

    /**
     * Gets the first {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter}
     *  that supports the value, or null if none are found.
     * @param value 
     * @param dataTypeLookupKey 
     * @returns 
     */
    public find(value: any, dataTypeLookupKey: string | null): IDataTypeConverter | null {
        return this.getAll().find((dtc) => dtc.supportsValue(value, dataTypeLookupKey)) ?? null;
    }

}