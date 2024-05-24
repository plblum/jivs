/**
 * Base classes for developing Services around data types.
 * @module Services/AbstractClasses/DataTypeServiceBase
 */

import { toIServicesAccessor } from "../Interfaces/Services";
import { IDataTypeService } from "../Interfaces/DataTypes";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { assertNotNull } from "../Utilities/ErrorHandling";
import { ServiceWithAccessorBase } from "./ServiceWithAccessorBase";


/**
 * Abstract base class for Services that maintain a registered list of classes
 * that all implement T.
 */
export abstract class DataTypeServiceBase<T> extends ServiceWithAccessorBase implements IDataTypeService
{

    /**
     * Changes the services on all implementations of IServicesAccessor
     * @param services 
     */
    protected updateServices(services: IValidationServices): void
    {
        this.getAll().forEach((registered) => {
            let sa = toIServicesAccessor(registered);
            if (sa)
                sa.services = services;
        });
    }
    /**
      * Registers an instance of the interface supported by this service.
      * It may replace an existing one, as determined by the subclass.
      * Replace supported on: IDataTypeIdentifier
      * @param item
      */
    public register(item: T): void {
        assertNotNull(item, 'item');
        let existingPos = this.indexOfExisting(item);
        if (existingPos < 0)
            this._registeredClasses.push(item);
        else
            this._registeredClasses[existingPos] = item;    // replace

        if (this.hasServices()) {
            let sa = toIServicesAccessor(item);
            if (sa)
                sa.services = this.services;
        }        
    }

    /**
     * Utility for register() to identify an already registered item
     * that can be replaced by the supplied item.
     * @param item 
     * @returns an index into the getAll collection of a match or -1 if no match.
     */
    protected abstract indexOfExisting(item: T): number;

    /**
     * Supports implementations of unregister().
     * @param index 
     * @returns 
     */
    protected unregisterByIndex(index: number): boolean
    {
        if (index >= 0) {
            this._registeredClasses!.splice(index, 1);
            return true;
        }
        return false;        
    }

    /**
     * Returns the full collection.
     */
    protected getAll() : Array<T>
    {
        return this._registeredClasses;
    }

    /**
     * All registered T.
     */
    private readonly _registeredClasses: Array<T> = [];
}
