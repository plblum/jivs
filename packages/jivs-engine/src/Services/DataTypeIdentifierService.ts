/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeIdentifierService!DataTypeIdentifierService:class }
 * @module Services/ConcreteClasses/DataTypeIdentifierService
 */

import { valueForLog } from "../Utilities/Utilities";
import { NumberDataTypeIdentifier, StringDataTypeIdentifier, BooleanDataTypeIdentifier, DateDataTypeIdentifier } from "../DataTypes/DataTypeIdentifiers";
import { IDataTypeIdentifier } from "../Interfaces/DataTypeIdentifier";
import { IDataTypeIdentifierService } from "../Interfaces/DataTypeIdentifierService";
import { DataTypeServiceBase } from "./DataTypeServiceBase";
import { LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";

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
        let result = idt ? idt.dataTypeLookupKey : null;
        this.log(LoggingLevel.Debug, () => {
            return {
                message: `Identified ${valueForLog(result)}`,
                category: LoggingCategory.Result
            
            }
        });
        return result;
    }


    /**
     * Finds the matching DataType LookupKey for the given value or 
     * null if not supported.
     * Runs the lazyloader if setup and the first search fails.
     * @param value 
     * @returns 
     */
    public find(value: any): IDataTypeIdentifier | null {
        let result = this.getAll().find((idt) => idt.supportsValue(value)) ?? null;
        if (result === null && this.ensureLazyLoaded())
            result = this.find(value);
        return result;        
    }
    /**
     * Determines if the lookup key has an associated DataTypeIdentifier.
     * @param lookupKey 
     * @param caseInsensitive When true, uses a case insensitive comparison.
     */
    public findByLookupKey(lookupKey: string, caseInsensitive?: boolean): IDataTypeIdentifier | null
    {
        if (caseInsensitive)
            lookupKey = lookupKey.toLowerCase();
        let result = this.getAll().find((idt) => {
            if (caseInsensitive)
                return idt.dataTypeLookupKey.toLowerCase() === lookupKey;
            else
                return idt.dataTypeLookupKey === lookupKey;
        }) ?? null;
        return result;
    }

}