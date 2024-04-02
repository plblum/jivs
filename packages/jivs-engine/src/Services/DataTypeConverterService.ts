/**
  * {@inheritDoc Services/ConcreteClasses/DataTypeConverterService!DataTypeConverterService:class}
  * @module Services/ConcreteClasses/DataTypeConverterService
 */

import { UTCDateOnlyConverter } from "../DataTypes/DataTypeConverters";
import { IDataTypeConverterService } from "../Interfaces/DataTypeConverterService";
import { IDataTypeConverter } from "../Interfaces/DataTypeConverters";
import { DataTypeServiceBaseWithServices } from "./DataTypeServiceBase";

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
export class DataTypeConverterService extends DataTypeServiceBaseWithServices<IDataTypeConverter>
    implements IDataTypeConverterService
{
    constructor()
    {
        super();
        this.preRegister();
    }
    protected preRegister(): void
    {
        this.register(new UTCDateOnlyConverter());
       // any other predefined are found in create_services so users can opt out
    }

    protected indexOfExisting(item: IDataTypeConverter): number {
        return -1; // does not support replacements
    }

    /**
     * {@inheritDoc Services/Types/IDataTypeConverterService!IDataTypeConverterService#convert }
     */    
    public convert(value: any, dataTypeLookupKey: string | null): number | Date | string | null | undefined
    {
        let dtc = this.find(value, dataTypeLookupKey);
        if (dtc)
            return dtc.convert(value, dataTypeLookupKey!);
        return undefined;
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