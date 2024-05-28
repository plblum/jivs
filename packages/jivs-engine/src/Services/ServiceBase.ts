/**
 * @module Services/AbstractClasses/ServiceBase
 */

import { IService } from "../Interfaces/Services";

export abstract class ServiceBase implements IService
{
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
    }        
    
    public get serviceName(): string
    {
        return this.constructor.name;
    }
}