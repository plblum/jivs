import type {
    IValidationServices,
} from "@plblum/jivs-engine/build/Interfaces/ValidationServices";

import {
    ModuleServicesInstaller,
} from "@plblum/jivs-engine/build/Services/ModuleServicesInstaller";

import {
    BuildersFactory
} from "./BuildersFactory";

import type {
    IBuildersFactory
} from "../Interfaces/BuildersFactory";


// TypeScript's type augmentation is used to extend the ValidationServices interface and concrete class with the buildersFactory property.
declare module "@plblum/jivs-engine/build/Interfaces/ValidationServices" {
    interface IValidationServices {
        buildersFactory: IBuildersFactory;
    }
}
/**
 * Extends the ValidationServices instance type.
 *
 * This declaration adds no runtime property. BuildersServicesInstaller
 * installs the actual getter and setter on ValidationServices.prototype.
 */
declare module "@plblum/jivs-engine/build/Services/ValidationServices" {
    interface ValidationServices {
        buildersFactory: IBuildersFactory;
    }
}


/**
 * Adds the buildersFactory service property on ValidationServices
 * upon construction of the singleton buildersFactoryInstaller.
 */
export class BuildersFactoryInstaller
    extends ModuleServicesInstaller<IBuildersFactory> {

    public constructor() {
        super("buildersFactory");
    }

    protected override createDefaultService(
        services: IValidationServices,
    ): IBuildersFactory {
        return new BuildersFactory();
    }
}


/**
 * Singleton whose construction installs buildersFactory on
 * ValidationServices.prototype.
 */
export const buildersFactoryInstaller =  new BuildersFactoryInstaller();