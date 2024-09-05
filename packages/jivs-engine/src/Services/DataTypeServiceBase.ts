/**
 * Base classes for developing Services around data types.
 * @module Services/AbstractClasses/DataTypeServiceBase
 */

import { toIServicesAccessor } from '../Interfaces/Services';
import { IDataTypeService } from '../Interfaces/DataTypes';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { ServiceWithAccessorBase } from './ServiceWithAccessorBase';
import { toIDisposable } from '../Interfaces/General_Purpose';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { valueForLog } from '../Utilities/Utilities';


/**
 * Abstract base class for Services that maintain a registered list of classes
 * that all implement T.
 */
export abstract class DataTypeServiceBase<T> extends ServiceWithAccessorBase implements IDataTypeService<T>
{
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        super.dispose();
        this._registeredClasses.forEach((item) => {
            toIDisposable(item)?.dispose(); 
        });
        (this._registeredClasses as any) = undefined;
    }    
    
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
    public getAll() : Array<T>
    {
        return this._registeredClasses;
    }

    /**
     * All registered T.
     */
    private readonly _registeredClasses: Array<T> = [];


    /**
     * Sets up a function to lazy load the configuration when any of the other
     * functions are called.
     */
    public set lazyLoad(fn: (service: IDataTypeService<T>) => void)
    {
        this._lazyLoader = fn;
    }
    private _lazyLoader: null | ((service: IDataTypeService<T>) => void) = null;

    /**
     * Runs the lazyload function if setup and returns true if run.
     * This has a side effect of disabling the lazyload function
     * to avoid additional recursion of the calling function by
     * always returning false while the lazyloader function is running.
     * @returns 
     */
    protected ensureLazyLoaded(): boolean
    {
        if (this._lazyLoader) {
            // prevent recursion by disabling the feature right away
            let fn = this._lazyLoader;
            this._lazyLoader = null;
            fn(this);
            return true;
        }
        return false;
    }        

    /**
     * Call once the object T was found and we want to call a function on it.
     * It logs "Using [name]"
     * @param instance 
     * @param purpose
     */
    protected logUsingInstance(instance: any, purpose?: string | null): void
    {
        this.logger.message(LoggingLevel.Debug, () => `Using ${valueForLog(instance)} ${purpose ?? '.'}`);
    }
}
