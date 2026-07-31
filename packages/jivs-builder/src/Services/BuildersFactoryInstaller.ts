/**
 * @module jivs-builder/Services/ConcreteClasses
 */

import type {
    IJivsServices
} from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type {
    JivsServices
} from '@plblum/jivs-engine/build/Services/JivsServices';

import {
    ModuleServicesInstaller
} from '@plblum/jivs-engine/build/Services/ModuleServicesInstaller';

import {
    BuildersFactory
} from './BuildersFactory';

import type {
    IBuildersFactory
} from '../Interfaces/BuildersFactory';


// TypeScript's type augmentation is used to extend the JivsServices interface and concrete class with the buildersFactory property.
declare module '@plblum/jivs-engine/build/Interfaces/JivsServices' {
    interface IJivsServices {
        buildersFactory: IBuildersFactory;
    }
}
/**
 * Extends the JivsServices instance type.
 *
 * This declaration adds no runtime property. BuildersServicesInstaller
 * installs the actual getter and setter on JivsServices.prototype.
 */
declare module '@plblum/jivs-engine/build/Services/JivsServices' {
    interface JivsServices {
        buildersFactory: IBuildersFactory;
    }
}


/**
 * Adds the buildersFactory service property on JivsServices
 * upon construction of the singleton buildersFactoryInstaller.
 */
export class BuildersFactoryInstaller
    extends ModuleServicesInstaller<IBuildersFactory> {

    public constructor() {
        super('buildersFactory');
    }

    protected override createDefaultService(
        services: IJivsServices
    ): IBuildersFactory {
        return new BuildersFactory();
    }
}


/**
 * Singleton whose construction installs buildersFactory on
 * JivsServices.prototype.
 */
export const buildersFactoryInstaller =  new BuildersFactoryInstaller();    // eslint-disable-line @typescript-eslint/naming-convention