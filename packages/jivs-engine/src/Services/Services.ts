/**
 * Supplies services and factories to be used as dependency injection
 * into the classes of this system.
 * @module Services/ConcreteClasses/Services
 */

import { IServices, toIServicesAccessor } from "../Interfaces/Services";
import { assertNotNull } from "../Utilities/ErrorHandling";

/**
 * Supplies services and factories to be used as dependency injection
 * into the classes of this system. 
 */
export class Services implements IServices {

    //#region IServices
    /**
     * Returns the service by its name identifier.
     * Returns null if the name identifier is unregistered.
     * @param serviceName - Will be a case insensitive match
     */
    public getService<T>(serviceName: string): T | null {
        assertNotNull(serviceName, 'serviceName');
        serviceName = serviceName.toLowerCase();
        return this._services[serviceName] ?? null;
    }

    /**
     * Adds or replaces a service.
     * If the supplied service implements IServicesAccessor, its own
     * services property is assigned to this ValidationServices instance.
     * @param serviceName - name that identifies this service and
     * will be used in getService().
     * @param service - the service. It can be a class, object, or primitive.
     * Will be a case insensitive match
     */
    public setService(serviceName: string, service: any): void {
        assertNotNull(serviceName, 'serviceName');
        assertNotNull(service, 'service');
        serviceName = serviceName.toLowerCase();
        this._services[serviceName] = service;
        let sa = toIServicesAccessor(service);
        if (sa)
            sa.services = this;
    }

    private _services: { [serviceName: string]: any } = {};
    //#endregion IServices
}