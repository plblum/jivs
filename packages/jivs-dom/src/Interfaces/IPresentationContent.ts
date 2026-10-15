import { IJivsDomServices } from './JivsDomServices';

export interface IPresentationContent
{
    setDomServices(domServices: IJivsDomServices): void;
}