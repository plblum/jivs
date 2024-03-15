/**
 * Supplies services and tools to be used as dependency injection
 * into the classes of this system.
 * There are many configuration choices involved. Its best to have
 * a function that creates a ValidationService with its configuration together.
 * Copy the /starter_code/create_services.ts file into your app.
 * It contains such a function, CreateValidationServices().
 * Edit that file to adjust your configuration.
 * @module ValidationServices
 */

import { AssertNotNull, CodingError } from "../Utilities/ErrorHandling";
import type { ILogger } from "../Interfaces/Logger";
import type { IInputValidatorFactory, IMessageTokenResolver } from "../Interfaces/InputValidator";
import type { IValidationServices } from "../Interfaces/ValidationServices";
import type { IDataTypeServices } from "../Interfaces/DataTypes";
import type { IConditionFactory } from "../Interfaces/Conditions";
import { IValueHostFactory } from "../Interfaces/ValueHost";
import { InputValidatorFactory } from "../ValueHosts/InputValidator";
import { ValueHostFactory, RegisterStandardValueHostGenerators } from "../ValueHosts/ValueHostFactory";
import { ConsoleLogger } from "./ConsoleLogger";
import { ITextLocalizerService } from "../Interfaces/TextLocalizerService";
import { TextLocalizerService } from "./TextLocalizerService";

/**
 * Supplies services and tools to be used as dependency injection
 * into the classes of this system. It also supplies factories.
 * There are many configuration choices involved. Its best to have
 * a function that creates a ValidationService with its configuration together.
 * Copy the /starter_code/create_services.ts file into your app.
 * It contains such a function, CreateValidationServices().
 * Edit that file to adjust your configuration.
 */
export class ValidationServices implements IValidationServices {
    constructor() {

    }

    /**
     * Factory to create Condition objects.
     */
    public get ConditionFactory(): IConditionFactory {
        if (!this._conditionFactory)
            throw new CodingError('Must assign ValidationServices.ConditionFactory.')
        return this._conditionFactory;
    }
    public set ConditionFactory(factory: IConditionFactory) {
        AssertNotNull(factory, 'factory');
        this._conditionFactory = factory;
    }
    private _conditionFactory!: IConditionFactory;

    /**
     * Service to get the IDataTypeServices instance associated with the dataTypeLabel.
     */
    public get DataTypeServices(): IDataTypeServices {
        if (!this._dataTypeServices)
            throw new CodingError('Must assign ValidationServices.DataTypeServices.')

        return this._dataTypeServices;
    }
    public set DataTypeServices(services: IDataTypeServices) {
        AssertNotNull(services, 'services');
        this._dataTypeServices = services;
        services.Services = this;
    }
    private _dataTypeServices!: IDataTypeServices;

    /**
     * Service to text localization specific, effectively mapping
     * a text key to a language specific version of that text.
     * Error messages and IDataTypeLocalizedFormatters use this.
     * Defaults to using TextLocalizerServices class.
     * If you use a third party localization system, you may prefer
     * to use that here. Implement ITextLocalizerService around
     * that third party library.
     */
    public get TextLocalizerService(): ITextLocalizerService
    {
        if (!this._textLocalizerService)
            this._textLocalizerService = new TextLocalizerService();
        return this._textLocalizerService;
    }
    public set TextLocalizerService(service: ITextLocalizerService)
    {
        this._textLocalizerService = service;
    }
    private _textLocalizerService: ITextLocalizerService | null = null; 

    /**
     * Service to get the IMessageTokenResolver instance that replaces
     * tokens in messages.
     */
    public get MessageTokenResolverService(): IMessageTokenResolver {
        if (!this._messageTokenResolverService)
            throw new CodingError('Must assign ValidationServices.MessageTokenResolverService.')

        return this._messageTokenResolverService;
    }
    public set MessageTokenResolverService(service: IMessageTokenResolver) {
        AssertNotNull(service, 'service');
        this._messageTokenResolverService = service;
    }
    private _messageTokenResolverService!: IMessageTokenResolver;

    /**
     * Service to get the ILogger instance that replaces
     * tokens in messages.
     * Defaults to using ConsoleLogger.
     */
    public get LoggerService(): ILogger {
        if (!this._loggerService)
            this._loggerService = new ConsoleLogger();
        return this._loggerService;
    }
    public set LoggerService(service: ILogger) {
        AssertNotNull(service, 'service');
        this._loggerService = service;
    }
    private _loggerService!: ILogger;

    //#region ValueHostFactory
    /**
     * The ValueHostFactory to use.
     * It supplies a default if not setup by the user.
     */
    public get ValueHostFactory(): IValueHostFactory {
        if (!this._valueHostFactory) {
            let factory = new ValueHostFactory();
            RegisterStandardValueHostGenerators(factory);
            this._valueHostFactory = factory;
        }
        return this._valueHostFactory;
    }
    public set ValueHostFactory(factory: IValueHostFactory) {
        AssertNotNull(factory, 'factory');
        this._valueHostFactory = factory;
    }
    private _valueHostFactory: IValueHostFactory | null = null;

    //#endregion ValueHostFactory

    //#region InputValidatorFactory    
    /**
     * The InputValidatorFactory to use.
     * It supplies a default if not setup by the user.
     */
    public get InputValidatorFactory(): IInputValidatorFactory {
        if (!this._inputValidatorFactory)
            this._inputValidatorFactory = new InputValidatorFactory();
        return this._inputValidatorFactory;
    }
    public set InputValidatorFactory(factory: InputValidatorFactory) {
        AssertNotNull(factory, 'factory');
        this._inputValidatorFactory = factory;
    }
    private _inputValidatorFactory: IInputValidatorFactory | null = null;

    //#endregion InputValidatorFactory        
}
