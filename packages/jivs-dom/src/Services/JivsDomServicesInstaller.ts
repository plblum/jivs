/**
 * @module jivs-dom/Services/ConcreteClasses
 */

import type {
    IJivsServices
} from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type {
    JivsServices
} from '@plblum/jivs-engine/build/Services/JivsServices';

import
    {
        ModuleServicesInstaller
    } from '@plblum/jivs-engine/build/Services/ModuleServicesInstaller';

import
    {
        JivsDomServices
    } from './JivsDomServices';

import type {
    IJivsDomServices
} from '../Interfaces/JivsDomServices';


// TypeScript's type augmentation is used to extend the JivsServices interface and concrete class with the JivsDomServices property.
/**
 * Extends the JivsServices instance type.
 *
 * This declaration adds no runtime property. JivsDomServicesInstaller
 * installs the actual getter and setter on JivsServices.prototype.
 */
declare module '@plblum/jivs-engine/build/Services/JivsServices' {
    interface JivsServices
    {
        domServices: IJivsDomServices;
    }
}


/**
 * Adds the JivsDomServices service property on JivsServices
 * upon construction of the singleton JivsDomServicesInstaller.
 */
export class JivsDomServicesInstaller
    extends ModuleServicesInstaller<IJivsDomServices>
{

    public constructor()
    {
        super('domServices');
    }

    protected override createDefaultService(
        services: IJivsServices
    ): IJivsDomServices
    {
        return new JivsDomServices();
    }
}


/**
 * Singleton whose construction installs JivsDomServices on
 * JivsServices.prototype.
 */
export const jivsDomServicesInstaller = new JivsDomServicesInstaller();    // eslint-disable-line @typescript-eslint/naming-convention