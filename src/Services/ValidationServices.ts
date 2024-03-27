/**
 * Supplies services and tools to be used as dependency injection
 * into the classes of this system.
 * There are many configuration choices involved. Its best to have
 * a function that creates a ValidationService with its configuration together.
 * Copy the /starter_code/create_services.ts file into your app.
 * It contains such a function, CreateValidationServices().
 * Edit that file to adjust your configuration.
 * @module ValidationServices/ConcreteClass
 */

import { assertNotNull, CodingError } from '../Utilities/ErrorHandling';
import type { ILogger } from '../Interfaces/Logger';
import type { IInputValidatorFactory, IMessageTokenResolver } from '../Interfaces/InputValidator';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import type { IDataTypeServices } from '../Interfaces/DataTypes';
import type { IConditionFactory } from '../Interfaces/Conditions';
import { IValueHostFactory } from '../Interfaces/ValueHost';
import { InputValidatorFactory } from '../ValueHosts/InputValidator';
import { ValueHostFactory, registerStandardValueHostGenerators } from '../ValueHosts/ValueHostFactory';
import { ConsoleLogger } from './ConsoleLogger';
import { ITextLocalizerService } from '../Interfaces/TextLocalizerService';
import { TextLocalizerService } from './TextLocalizerService';

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
     * The culture shown to the user in the app. Its the ISO language-region format.
       This value is the starting point to search through localizations.
       If not supplied, it defaults to 'en'.
     */
    public get activeCultureId(): string {
        return this._activeCultureID ?? 'en';
    }
    public set activeCultureId(cultureID: string) {
        this._activeCultureID = cultureID;
    }
    private _activeCultureID: string | null = null;

    /**
     * Factory to create Condition objects.
     */
    public get conditionFactory(): IConditionFactory {
        if (!this._conditionFactory)
            throw new CodingError('Must assign ValidationServices.ConditionFactory.');
        return this._conditionFactory;
    }
    public set conditionFactory(factory: IConditionFactory) {
        assertNotNull(factory, 'factory');
        this._conditionFactory = factory;
    }
    private _conditionFactory: IConditionFactory | null = null;

    /**
     * Service to get the IDataTypeServices instance associated with the dataTypeLabel.
     */
    public get dataTypeServices(): IDataTypeServices {
        if (!this._dataTypeServices)
            throw new CodingError('Must assign ValidationServices.DataTypeServices.');

        return this._dataTypeServices;
    }
    public set dataTypeServices(services: IDataTypeServices) {
        assertNotNull(services, 'services');
        this._dataTypeServices = services;
        services.services = this;
    }
    private _dataTypeServices: IDataTypeServices | null = null;

    /**
     * Service to text localization specific, effectively mapping
     * a text key to a language specific version of that text.
     * Error messages and IDataTypeFormatters use this.
     * Defaults to using TextLocalizerServices class.
     * If you use a third party localization system, you may prefer
     * to use that here. Implement ITextLocalizerService around
     * that third party library.
     */
    public get textLocalizerService(): ITextLocalizerService
    {
        if (!this._textLocalizerService)
            this._textLocalizerService = new TextLocalizerService();
        return this._textLocalizerService;
    }
    public set textLocalizerService(service: ITextLocalizerService)
    {
        this._textLocalizerService = service;
    }
    private _textLocalizerService: ITextLocalizerService | null = null; 

    /**
     * Service to get the IMessageTokenResolver instance that replaces
     * tokens in messages.
     */
    public get messageTokenResolverService(): IMessageTokenResolver {
        if (!this._messageTokenResolverService)
            throw new CodingError('Must assign ValidationServices.MessageTokenResolverService.');

        return this._messageTokenResolverService;
    }
    public set messageTokenResolverService(service: IMessageTokenResolver) {
        assertNotNull(service, 'service');
        this._messageTokenResolverService = service;
    }
    private _messageTokenResolverService: IMessageTokenResolver | null = null;

    /**
     * Service to get the ILogger instance that replaces
     * tokens in messages.
     * Defaults to using ConsoleLogger.
     */
    public get loggerService(): ILogger {
        if (!this._loggerService)
            this._loggerService = new ConsoleLogger();
        return this._loggerService;
    }
    public set loggerService(service: ILogger) {
        assertNotNull(service, 'service');
        this._loggerService = service;
    }
    private _loggerService: ILogger | null = null;

    //#region ValueHostFactory
    /**
     * The ValueHostFactory to use.
     * It supplies a default if not setup by the user.
     */
    public get valueHostFactory(): IValueHostFactory {
        if (!this._valueHostFactory) {
            let factory = new ValueHostFactory();
            registerStandardValueHostGenerators(factory);
            this._valueHostFactory = factory;
        }
        return this._valueHostFactory;
    }
    public set valueHostFactory(factory: IValueHostFactory) {
        assertNotNull(factory, 'factory');
        this._valueHostFactory = factory;
    }
    private _valueHostFactory: IValueHostFactory | null = null;

    //#endregion ValueHostFactory

    //#region InputValidatorFactory    
    /**
     * The InputValidatorFactory to use.
     * It supplies a default if not setup by the user.
     */
    public get inputValidatorFactory(): IInputValidatorFactory {
        if (!this._inputValidatorFactory)
            this._inputValidatorFactory = new InputValidatorFactory();
        return this._inputValidatorFactory;
    }
    public set inputValidatorFactory(factory: InputValidatorFactory) {
        assertNotNull(factory, 'factory');
        this._inputValidatorFactory = factory;
    }
    private _inputValidatorFactory: IInputValidatorFactory | null = null;

    //#endregion InputValidatorFactory        
}
