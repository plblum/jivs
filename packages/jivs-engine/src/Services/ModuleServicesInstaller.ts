/**
 * Allows external modules to install module-owned service properties on ValidationServices.
 * For example, jivs-builder adds its buildersFactory property to ValidationServices through this mechanism.
 * 
 * Each module subclasses ModuleServicesInstaller to install their own service property. 
 * 
 * To ensure it gets installed:
 * 1. The module should export a singleton instance of the installer class from its package entry point.
 * 2. The module should augment IValidationServices to declare the property.
 * 3. The code that creates your service -- usually createValidationServices() -- should import the module to ensure the installer is loaded.
 * 
 * ```ts
 * // example subclass
 * export class BuildersFactoryInstaller extends ModuleServicesInstaller<BuildersFactory> {
 *    constructor() {
 *       super("buildersFactory");
 *    }
 *   protected createDefaultService(services: IValidationServices): BuildersFactory {
 *       return new BuildersFactory();
 *   }
 * }
 * // create the singleton installer instance in the same file so it gets loaded when the module is imported
 * export const buildersFactoryInstaller = new BuildersFactoryInstaller();
 * 
 * // apply module augmentation to IValidationServices in the same module
 * declare module "@plblum/jivs-engine/build/Interfaces/ValidationServices" {
 *   interface IValidationServices {
 *     buildersFactory?: BuildersFactory;
 *   }
 * }
 * ```
 * Now code for your createValidationServices()...
 * ```ts
 * import { buildersFactoryInstaller } from "@plblum/jivs-builder";
 * export function createValidationServices(): IValidationServices {
 *     const services = new ValidationServices();
 *     // Access the buildersFactory property to trigger lazy installation
 *     const buildersFactory = services.buildersFactory;
 *     return services;
 * }
 * ```
 * 
 * @module Services/ConcreteClasses/ExtendingServices
 */


import type { IValidationServices } from '../Interfaces/ValidationServices';
import { ValidationServices } from './ValidationServices';

/**
 * Base class for Jivs modules that add module-owned service properties to
 * ValidationServices.
 *
 * Module implementations extend this class to install a property on
 * ValidationServices.prototype while continuing to use the existing
 * IValidationServices.getService() and setService() service container.
 *
 * The property name is also used as the service registration name. Property
 * names must therefore be unique across all installed Jivs modules.
 *
 * Installation occurs when the subclass constructor calls super(). A module
 * will typically export a singleton installer instance from its package entry
 * point so loading the module installs its services.
 *
 * Before implementing an installer:
 *
 * 1. Remove the module-owned property from jivs-engine's original
 *    IValidationServices declaration.
 * 2. Remove any existing implementation of the property from
 *    ValidationServices.
 * 3. Augment IValidationServices from the module that owns the service.
 * 4. Extend ModuleServicesInstaller using the property's service type.
 * 5. Pass the augmented property name to super().
 * 6. Implement createDefaultService().
 * 7. Construct and export one installer instance.
 *
 * The installed getter lazily creates the default service. If a service has
 * already been registered through setService(), that service is returned
 * instead.
 *
 * The installed setter delegates directly to setService(), preserving the
 * existing service replacement and lifecycle behavior.
 *
 * Installation fails when ValidationServices.prototype already owns a
 * property with the requested name. This prevents one module from silently
 * replacing another module's property and detects properties that were not
 * removed from jivs-engine before being moved into a separate module.
 *
 * @typeParam TService
 * The service type exposed by the installed property.
 */
export abstract class ModuleServicesInstaller<TService> {
    private readonly _propertyName: keyof IValidationServices;

    /**
     * Installs a module-owned service property.
     *
     * @param propertyName
     * The property added to IValidationServices through module augmentation.
     * The same value is used as the getService() and setService() key.
     *
     * @throws Error
     * Thrown when ValidationServices.prototype already defines the property.
     */
    protected constructor(
        propertyName: keyof IValidationServices
    ) {
        this._propertyName = propertyName;
        this.install();
    }

    /**
     * Creates the default service when the property is read before a service
     * has been explicitly registered.
     *
     * The returned service is automatically registered through setService()
     * before being returned.
     *
     * @param services
     * The ValidationServices instance for which the service is being created.
     */
    protected abstract createDefaultService(
        services: IValidationServices,
    ): TService;

    private getModuleService(
        services: IValidationServices
    ): TService {
        const serviceName = String(this._propertyName);

        const existingService =
            services.getService<TService>(serviceName);

        if (existingService !== null) {
            return existingService;
        }

        const service = this.createDefaultService(services);

        services.setService(
            serviceName,
            service
        );

        return service;
    }

    private setModuleService(
        services: IValidationServices,
        service: TService
    ): void {
        services.setService(
            String(this._propertyName),
            service
        );
    }

    /**
     * Creating the instance may be blocked due to existing property on ValidationServices.prototype. 
     * Check this property to see if the installation was successful.
     */
    public get installed(): boolean {
        return this._installed;
    }
    private _installed: boolean = false;

    private install(): void {
        const propertyName = this._propertyName;

        const existingDescriptor =
            Object.getOwnPropertyDescriptor(
                ValidationServices.prototype,
                propertyName
            );

        if (existingDescriptor !== undefined) {
            this._installed = false;
            return;
        }

        const installer = this;

        Object.defineProperty(
            ValidationServices.prototype,
            propertyName,
            {
                configurable: true, // allows for unit tests to remove this property
                enumerable: false,

                get(this: IValidationServices): TService {
                    return installer.getModuleService(this);
                },

                set(
                    this: IValidationServices,
                    service: TService
                ): void {
                    installer.setModuleService(
                        this,
                        service
                    );
                }
            }
        );
        this._installed = true;
    }
    /**
    * Targets unit tests that need to remove the property from ValidationServices.prototype to avoid side effects between tests.
    */
    public uninstall(): boolean {
        const descriptor = Object.getOwnPropertyDescriptor(
            ValidationServices.prototype,
            this._propertyName
        );

        if (descriptor === undefined) {
            return false;
        }

        return !!delete ValidationServices.prototype[this._propertyName];
    }
}

