import { AssertNotNull } from "../Utilities/ErrorHandling";
import { valGlobals } from "./ValidationGlobals";
import type { ILogger } from "../Interfaces/Logger";
import type { IMessageTokenResolver } from "../Interfaces/InputValidator";
import type { IValidationServices } from "../Interfaces/ValidationServices";
import type { IDataTypeServices } from "../Interfaces/DataTypes";
import type { IConditionFactory } from "../Interfaces/Conditions";



/**
 * Supplies services and tools to be used as dependency injection
 * into the classes of this system.
 * The same instance should be used by all features of that ValueHostsManager
 * and your UI elements associated with validation.
 */
export class ValidationServices implements IValidationServices
{
    constructor()
    {

    }

    /**
     * Factory to create Condition objects.
     * Defaults to using ValidationGlobals.GetDefaultConditionFactory.
     */
    public get ConditionFactory(): IConditionFactory
    {
        if (!this._conditionFactory)
            this._conditionFactory = valGlobals.GetDefaultConditionFactory();
        return this._conditionFactory;
    }
    public set ConditionFactory(factory: IConditionFactory)
    {
        AssertNotNull(factory, 'factory');
        this._conditionFactory = factory;
    }
    private _conditionFactory!: IConditionFactory;

    /**
     * Service to get the IDataTypeServices instance associated with the dataTypeLabel.
     * Defaults to using the global defaultDataTypeServices.
     */
    public get DataTypeServices(): IDataTypeServices {
        if (!this._dataTypeServices)
            this._dataTypeServices = valGlobals.GetDefaultDataTypeServices();
        return this._dataTypeServices;
    }
    public set DataTypeServices(service: IDataTypeServices)
    {
        AssertNotNull(service, 'service');
        this._dataTypeServices = service;
    }
    private _dataTypeServices!: IDataTypeServices;

    /**
     * Service to get the IMessageTokenResolver instance that replaces
     * tokens in messages.
     * Defaults to using the global defaultMessageTokenResolverService
     */
    public get MessageTokenResolverService(): IMessageTokenResolver {
        if (!this._messageTokenResolverService)
            this._messageTokenResolverService = valGlobals.GetDefaultMessageTokenResolver();
        return this._messageTokenResolverService;
    }
    public set MessageTokenResolverService(service: IMessageTokenResolver)
    {
        AssertNotNull(service, 'service');
        this._messageTokenResolverService = service;
    }
    private _messageTokenResolverService!: IMessageTokenResolver;

    /**
     * Service to get the ILogger instance that replaces
     * tokens in messages.
     * Defaults to using the global defaultLoggerService
     */
    public get LoggerService(): ILogger {
        if (!this._loggerService)
            this._loggerService = valGlobals.GetDefaultLogger();
        return this._loggerService;
    }
    public set LoggerService(service: ILogger)
    {
        AssertNotNull(service, 'service');
        this._loggerService = service;
    }
    private _loggerService!: ILogger;

}
