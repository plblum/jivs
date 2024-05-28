/**
 * Supplies services and factories to be used as dependency injection
 * into the classes of this system.
 * @module Services/ConcreteClasses/Services
 */

import { IDisposable, toIDisposable } from "../Interfaces/General_Purpose";
import { IServices, toIServicesAccessor } from "../Interfaces/Services";
import { assertNotNull } from "../Utilities/ErrorHandling";

/**
 * Supplies services and factories to be used as dependency injection
 * into the classes of this system. 
 */
export class Services implements IServices, IDisposable {

    //#region IServices
    /**
     * Returns the service by its name identifier.
     * Returns null if the name identifier is unregistered.
     * 
     * @remarks
     * Do not keep a reference to a service elsewhere,
     * unless it is a WeakRef. Expectation is the instance
     * is owned by the Services object, and it will handle disposal.
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
        this._services[serviceName]?.dispose();
        this._services[serviceName] = service;
        let sa = toIServicesAccessor(service);
        if (sa)
            sa.services = this;
    }

    /**
     * This should be the only strong reference to a service instance owned by
     * the IServices object.
     */
    private _services: { [serviceName: string]: any } = {};
    //#endregion IServices

    public dispose(): void {
        for (let name in this._services)
        {
            toIDisposable(this._services[name])?.dispose();
        }
        (this._services as any) = undefined;
    }
}