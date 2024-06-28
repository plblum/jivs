/**
 * {@inheritDoc Services/AbstractClasses/ServiceWithAccessorBase!ServiceWithAccessorBase}
 * @module Services/AbstractClasses/ServiceWithAccessorBase
 */

import { CodingError, assertNotNull, assertWeakRefExists } from "../Utilities/ErrorHandling";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { LogDetails, LogOptions, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from "../Interfaces/LoggerService";
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
     * Log a message. The message gets assigned the details of feature, type, and identity
     * here.
     */
    protected log(level: LoggingLevel, gatherFn: logGatheringHandler): void {
        if (this.hasServices()) {
            let logger = this.services.loggerService;
            logger.log(level, (options?: LogOptions) => {
                let details = gatherFn ? gatherFn(options) : <LogDetails>{};
                details.feature = 'service';
                details.type = this;
                details.identity = this.serviceName;
                return details;
            });
        }
    }
    /**
     * When the log only needs the message and nothing else.
     * @param level 
     * @param messageFn
     */
    protected logQuick(level: LoggingLevel, messageFn: ()=> string): void {
        this.log(level, () => {
            return {
                message: messageFn()
            };
        });
        
    }
    /**
     * Log an exception. The GatherFn should only be used to gather additional data
     * as the Error object supplies message, category (Exception), and this function
     * resolves feature, type, and identity.
     * @param error 
     * @param gatherFn 
     */
    protected logError(error: Error, gatherFn?: logGatheringErrorHandler): void
    {
        if (this.hasServices()) {
            let logger = this.services.loggerService;
            logger.logError(error, (options?: LogOptions) => {
                let details = gatherFn ? gatherFn(options) : <LogDetails>{};
                details.feature = 'service';
                details.type = this;
                details.identity = this.serviceName;
                return details;
            });
        }
    }
}
