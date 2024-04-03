/**
 * Base classes for developing Services around data types.
 * @module Services/AbstractClasses/DataTypeServiceBase
 */

import { IDataTypeServiceBase } from "../Interfaces/DataTypes";
import { IServicesAccessor, IValidationServices, toIServicesAccessor } from "../Interfaces/ValidationServices";
import { assertNotNull, CodingError } from "../Utilities/ErrorHandling";


/**
 * Abstract base class for Services that maintain a registered list of classes
 * that all implement T.
 */
export abstract class DataTypeServiceBase<T> implements IDataTypeServiceBase
{
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
    private _registeredClasses: Array<T> = [];
}

/**
 * Abstract base class that extends DataTypeServiceBase with access to the ValidationServices
 * object.
 */
export abstract class DataTypeServiceBaseWithServices<T> extends DataTypeServiceBase<T> implements IServicesAccessor
{
    /**
     * Services accessor.
     * Note: Not passed into the constructor because this object should be created before
     * ValidationServices itself. So it gets assigned when the associated service
     * property on ValidationService is assigned the service instance.
     */
    public get services(): IValidationServices
    {
        if (!this._services)
            throw new CodingError('Assign services property first.');
        return this._services;
    }
    public set services(services: IValidationServices)
    {
        assertNotNull(services, 'services');
        this._services = services;
        this.updateServices(services);
    }
    private _services: IValidationServices | null = null;

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
      * @param item
      */
    public override register(item: T): void {
        super.register(item);
        if (this._services) {
            let sa = toIServicesAccessor(item);
            if (sa)
                sa.services = this._services;
        }
    }
}
