/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeIdentifierService!DataTypeIdentifierService:class }
 * @module Services/ConcreteClasses/DataTypeIdentifierService
 */

import { NumberDataTypeIdentifier, StringDataTypeIdentifier, BooleanDataTypeIdentifier, DateDataTypeIdentifier } from "../DataTypes/DataTypeIdentifiers";
import { IDataTypeIdentifier } from "../Interfaces/DataTypeIdentifier";
import { IDataTypeIdentifierService } from "../Interfaces/DataTypeIdentifierService";
import { DataTypeServiceBase } from "./DataTypeServiceBase";

/**
 * A service for identifing the Data Type Lookup Key associated with a data type
 * using {@link DataTypes/Types/IDataTypeIdentifier!IDataTypeIdentifier | IDataTypeIdentifier} instances.
 * 
 * This class is available on {@link Services/ConcreteClasses/ValidationServices!ValidationServices#dataTypeIdentifierService | ValidationServices.dataTypeIdentifierService}.
 */
export class DataTypeIdentifierService extends DataTypeServiceBase<IDataTypeIdentifier>
implements IDataTypeIdentifierService
{
    constructor()
    {
        super();
        this.preRegister();
    }
    protected preRegister(): void
    {
        this.register(new NumberDataTypeIdentifier());
        this.register(new StringDataTypeIdentifier());
        this.register(new BooleanDataTypeIdentifier());
        this.register(new DateDataTypeIdentifier());             
        // any other predefined are found in create_services so users can opt out
    }
    protected indexOfExisting(item: IDataTypeIdentifier): number {
        let itemDTK = item.dataTypeLookupKey.toLowerCase();
        return this.getAll().findIndex((idt) => idt.dataTypeLookupKey.toLowerCase() === itemDTK);
    }

    /**
     * {@inheritDoc Services/Types/IDataTypeIdentifierService!IDataTypeIdentifierService.identify }
     */    
    public identify(value: any): string | null {
        let idt = this.find(value);
        return idt ? idt.dataTypeLookupKey : null;
    }

    /**
     * Finds the matching DataType LookupKey for the given value or 
     * null if not supported.
     * @param value 
     * @returns 
     */
    public find(value: any): IDataTypeIdentifier | null {
        return this.getAll().find((idt) => idt.supportsValue(value)) ?? null;
    }

}