/**
 * {@inheritDoc Services/AbstractClasses/ServiceWithAccessorBase!ServiceWithAccessorBase}
 * @module Services/AbstractClasses/ServiceWithAccessorBase
 */

import { CodingError, assertNotNull, assertWeakRefExists } from "../Utilities/ErrorHandling";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { ServiceBase } from "./ServiceBase";
import { IServicesAccessor } from "../Interfaces/Services";

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
    }    
    /**
     * Wrapper around logging that takes no action if logLevel is below min,
     * allowing for some of the work to set up to be skipped, especially
     * by providing a function for message when message requires some work to create.
     * @param message 
     * @param logLevel 
     * @param logCategory
     */
    protected log(message: (()=>string) | string, logLevel: LoggingLevel, logCategory?: LoggingCategory): void
    {
        if (this.hasServices()) {
            let logger = this.services.loggerService;
            if (logger.minLevel <= logLevel) {
                logger.log((typeof message === 'function') ? message() : message,
                    logLevel, logCategory ?? LoggingCategory.None, this.serviceName);
            }
        }
    }

}
