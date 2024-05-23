/**
 * @module Services/ConcreteClasses/ServiceBase
 */

import { CodingError, assertNotNull } from "../Utilities/ErrorHandling";
import { IService, IServicesAccessor, IValidationServices } from "../Interfaces/ValidationServices";
import { LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";

export abstract class ServiceBase implements IService
{
    public get serviceName(): string
    {
        return this.constructor.name;
    }
}


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
     * Wrapper around logging that takes no action if logLevel is below min,
     * allowing for some of the work to set up to be skipped, especially
     * by providing a function for message when message requires some work to create.
     * @param message 
     * @param logLevel 
     * @param logCategory
     */
    protected log(message: (()=>string) | string, logLevel: LoggingLevel, logCategory?: LoggingCategory): void
    {
        let logger = this.services.loggerService;
        if (logger.minLevel <= logLevel) {
            logger.log((typeof message === 'function') ? message() : message,
                logLevel, logCategory ?? this.logCategory(), this.serviceName);
        }
    }

    protected logCategory(): LoggingCategory
    {
        return LoggingCategory.Service;
    }
}
