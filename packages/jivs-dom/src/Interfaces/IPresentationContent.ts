/**
 * @module jivs-dom/Types/IPresentationContent
 */

import { IJivsDomServices } from './JivsDomServices';

/**
 * IPresentationContent defines the contract for presentation content components that require access to DOM services.
 */
export interface IPresentationContent
{
    setDomServices(domServices: IJivsDomServices): void;
}