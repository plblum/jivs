/**
 * {@inheritDoc Services/AbstractClasses/ServiceWithAccessorBase!ServiceWithAccessorBase}
 * @module Services/AbstractClasses/ServiceWithAccessorBase
 */

import { CodingError, SevereErrorBase, assertNotNull, assertWeakRefExists } from "../Utilities/ErrorHandling";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { LogDetails, LogOptions, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from "../Interfaces/LoggerService";
import { ServiceBase } from "./ServiceBase";
import { IServicesAccessor } from "../Interfaces/Services";
import { LoggerFacade } from "../Utilities/LoggerFacade";

/**
 * Abstract base class for building a service with a reference back to the IServices object.
 */
export abstract class ServiceWithAccessorBase extends ServiceBase implements IServicesAccessor
{
    /**
     * Services accessor.
     * Note: Not passed into the constructor because this object should be created before
     * ValidationServices itself. So it gets assigned when the associated service
     * property on ValidationService is assigned the service instance.
     */
    public get services(): IValidationServices
    {
        assertWeakRefExists(this._services,
            'Assign services property first.');
        return this._services!.deref()!;
    }
    public set services(services: IValidationServices)
    {
        assertNotNull(services, 'services');
        this._services = new WeakRef<IValidationServices>(services);
        this.updateServices(services);
    }
    private _services: WeakRef<IValidationServices> | null = null;

    protected hasServices(): boolean
    {
        return this._services != null;  // null or undefined
    }


    /**
     * Changes the services on all implementations of IServicesAccessor
     * @param services 
     */
    protected updateServices(services: IValidationServices): void
    {
    }
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        this._services = undefined!;
        (this._logger as any) = undefined!;        
    }    
 
    /**
     * Provides an API for logging, sending entries to the loggerService.
     */
    protected get logger(): LoggerFacade
    {
        if (!this._logger)
            this._logger = new LoggerFacade(this.hasServices() ? this.services.loggerService : null,
                'service', this, null, true);
        return this._logger;
    }
    private _logger: LoggerFacade | null = null;    
}
