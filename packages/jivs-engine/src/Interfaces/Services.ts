/**
 * Provides a dependency injection approach to this library.
 * @module Services/Types/IServices
 */

import { CodingError } from "../Utilities/ErrorHandling";
import { IDisposable } from "./General_Purpose";

/**
 * Base interface for all services including factories
 */
export interface IService extends IDisposable
{
    serviceName: string;
}

/**
 * Interface to have access to services.
 */
export interface IServicesAccessor extends IDisposable
{
/**
 * Provides access to services.
 */
    services: IServices;    
}

/**
 * A service that has a reference back to the IServices object.
 */
export interface IServiceWithAccessor extends IService, IServicesAccessor
{
    
}

/**
 * Basic host for services
 */
export interface IServices
{
    /**
     * Returns the service by its name identifier.
     * Returns null if the name identifier is unregistered.
     * @param serviceName - Will be a case insensitive match
     */
    getService<T>(serviceName: string): T | null;

    /**
     * Adds or replaces a service.
     * @param serviceName - name that identifies this service and
     * will be used in getService().
     * @param service - the service. It can be a class, object, or primitive.
     * Will be a case insensitive match
     */
    setService(serviceName: string, service: any): void;
}

/**
 * Determines if the source implements IServicesAccessor, and returns it typecasted.
 * If not, it returns null.
 * @param source 
 */
export function toIServicesAccessor(source: any): IServicesAccessor | null {
    if (source && typeof source === 'object') {
        let test = source as IServicesAccessor;       
        if ('services' in test)
            return test;
    }
    return null;
}

/**
 * Assign to services that support a fallback version of itself,
 * so the user can override the service with a special case,
 * and the fallback handles the rest.
 */
export interface IServiceWithFallback<T> extends IService
{
    /**
     * Reference to a fallback of the same service or null if no fallback.
     */
    fallbackService: T | null;
}
/**
 * Determines if the source implements IServiceWithFallback, and returns it typecasted.
 * If not, it returns null.
 * @param source 
 */
export function toIServiceWithFallback(source: any): IServiceWithFallback<any> | null {
    if (source && typeof source === 'object') {
        let test = source as IServiceWithFallback<any>;       
        if ('fallbackService' in test)
            return test;
    }
    return null;
}

/**
 * Call when assigning the IServiceWithFallback.fallbackService property to ensure
 * it does not loop around to the original.
 * @param fallbackService - The service to assign to startingService.fallbackService.
 * @param hostService - the service that is getting is fallbackService property assigned 
 */
export function assertValidFallbacks(fallbackService: IServiceWithFallback<any> | null, hostService: IServiceWithFallback<any>): void
{
    if (fallbackService === null)
        return;
    let service = fallbackService;
    let limit = 10;
    while (service.fallbackService)
    {
        if (service.fallbackService === hostService)
            throw new CodingError('Service fallback loops back to itself.');
        limit--;
        if (limit === 0)
            throw new CodingError('Reached the limit of fallbacks');
        service = service.fallbackService;
    }
}