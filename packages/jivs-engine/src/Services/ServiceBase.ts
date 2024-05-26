/**
 * @module Services/AbstractClasses/ServiceBase
 */

import { IService } from "../Interfaces/Services";

export abstract class ServiceBase implements IService
{
    public get serviceName(): string
    {
        return this.constructor.name;
    }
}