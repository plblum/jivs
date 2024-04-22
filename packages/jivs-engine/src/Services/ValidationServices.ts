/**
 * Supplies services and tools to be used as dependency injection
 * into the classes of this system.
 * There are many configuration choices involved. Its best to have
 * a function that creates a ValidationService with its configuration together.
 * Copy the /starter_code/create_services.ts file into your app.
 * It contains such a function, createValidationServices().
 * Edit that file to adjust your configuration.
 * @module Services/ConcreteClasses/ValidationServices
 */

import { assertNotNull, CodingError } from '../Utilities/ErrorHandling';
import type { ILoggerService } from '../Interfaces/LoggerService';
import type { IValidatorFactory } from '../Interfaces/Validator';
import { IServiceWithFallback, ServiceName, toIServicesAccessor, type IValidationServices } from '../Interfaces/ValidationServices';
import type { IConditionFactory } from '../Interfaces/Conditions';
import { IValueHostFactory } from '../Interfaces/ValueHost';
import { ValidatorFactory } from '../Validation/Validator';
import { ValueHostFactory, registerStandardValueHostGenerators } from '../ValueHosts/ValueHostFactory';
import { ConsoleLoggerService } from './ConsoleLoggerService';
import { ITextLocalizerService } from '../Interfaces/TextLocalizerService';
import { TextLocalizerService } from './TextLocalizerService';
import { IAutoGenerateDataTypeCheckService } from '../Interfaces/AutoGenerateDataTypeCheckService';
import { IDataTypeComparerService } from '../Interfaces/DataTypeComparerService';
import { IDataTypeConverterService } from '../Interfaces/DataTypeConverterService';
import { IDataTypeFormatterService } from '../Interfaces/DataTypeFormatterService';
import { IDataTypeIdentifierService } from '../Interfaces/DataTypeIdentifierService';
import { IMessageTokenResolverService } from '../Interfaces/MessageTokenResolverService';

/**
 * Supplies services and tools to be used as dependency injection
 * into the classes of this system. It also supplies factories.
 * There are many configuration choices involved. Its best to have
 * a function that creates a ValidationService with its configuration together.
 * Copy the /starter_code/create_services.ts file into your app.
 * It contains such a function, createValidationServices().
 * Edit that file to adjust your configuration.
 */
export class ValidationServices implements IValidationServices {
    constructor() {

    }
//#region IServices
    /**
     * Returns the service by its name identifier.
     * Returns null if the name identifier is unregistered.
     * @param serviceName - Will be a case insensitive match
     */
    public getService<T>(serviceName: string): T | null
    {
        assertNotNull(serviceName, 'serviceName');
        serviceName = serviceName.toLowerCase();
        return this._services[serviceName] ?? null;
    }

    /**
     * Adds or replaces a service.
     * If the supplied service implements IServicesAccessor, its own
     * services property is assigned to this ValidationServices instance.
     * @param serviceName - name that identifies this service and
     * will be used in getService().
     * @param service - the service. It can be a class, object, or primitive.
     * Will be a case insensitive match
     */    
    public setService(serviceName: string, service: any): void
    {
        assertNotNull(serviceName, 'serviceName');
        assertNotNull(service, 'service');
        serviceName = serviceName.toLowerCase();
        this._services[serviceName] = service;
        let sa = toIServicesAccessor(service);
        if (sa)
            sa.services = this;
    }

    private _services: { [serviceName: string]: any } = {};
    //#endregion IServices
    
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
        let factory = this.getService<IConditionFactory>(ServiceName.conditionFactory);
        if (!factory)
            throw new CodingError('Must assign ValidationServices.ConditionFactory.');
        return factory;
    }
    public set conditionFactory(factory: IConditionFactory) {
        this.setService(ServiceName.conditionFactory, factory);
    }

    /**
     * Service for formatting data types used within tokens of error messages
    *  using {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter} instances.
     */
    public get dataTypeFormatterService(): IDataTypeFormatterService {
        let service = this.getService<IDataTypeFormatterService>(ServiceName.formatter);
        if (!service)
            throw new CodingError('Must assign ValidationServices.dataTypeFormatterService.');

        return service;
    }
    public set dataTypeFormatterService(service: IDataTypeFormatterService) {
        this.setService(ServiceName.formatter, service);
    }
    
    /**
     * Service for identifing the Data Type Lookup Key associated with a data type
     * using {@link DataTypes/Types/IDataTypeIdentifier!IDataTypeIdentifier | IDataTypeIdentifier} instances.
     */

    public get dataTypeIdentifierService(): IDataTypeIdentifierService {
        let service = this.getService<IDataTypeIdentifierService>(ServiceName.identifier);
        if (!service)
            throw new CodingError('Must assign ValidationServices.dataTypeIdentifierService.');

        return service;
    }
    public set dataTypeIdentifierService(service: IDataTypeIdentifierService) {
        this.setService(ServiceName.identifier, service);
    } 
    
    /**
     * Service for changing the original value into 
     * something that you want a condition to evaluate
     * using {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter} instances.
     */
    public get dataTypeConverterService(): IDataTypeConverterService {
        let service = this.getService<IDataTypeConverterService>(ServiceName.converter);
        if (!service)
            throw new CodingError('Must assign ValidationServices.dataTypeConverterService.');

        return service;
    }
    public set dataTypeConverterService(service: IDataTypeConverterService) {
        this.setService(ServiceName.converter, service);
    }

    /**
     * Service for changing the comparing two values
     * using {@link DataTypes/Types/IDataTypeComparer!IDataTypeComparer | IDataTypeComparer} instances.
     */
    public get dataTypeComparerService(): IDataTypeComparerService {
        let service = this.getService<IDataTypeComparerService>(ServiceName.comparer);
        if (!service)
            throw new CodingError('Must assign ValidationServices.dataTypeComparerService.');

        return service;
    }
    public set dataTypeComparerService(service: IDataTypeComparerService) {
        this.setService(ServiceName.comparer, service);
    }
    /**
     * Service that supports automatic generation of Conditions for the Data Type Check
     * using {@link DataTypes/Types/IDataTypeCheckGenerator!IDataTypeCheckGenerator | IDataTypeCheckGenerator} instances.
     */
    public get autoGenerateDataTypeCheckService(): IAutoGenerateDataTypeCheckService {
        let service = this.getService<IAutoGenerateDataTypeCheckService>(ServiceName.autoGenerator);
        if (!service)
            throw new CodingError('Must assign ValidationServices.autoGenerateDataTypeCheckService.');

        return service;
    }
    public set autoGenerateDataTypeCheckService(service: IAutoGenerateDataTypeCheckService) {
        this.setService(ServiceName.autoGenerator, service);
    }

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
        let service = this.getService<ITextLocalizerService>(ServiceName.textLocalizer);
        if (!service) {
            service = new TextLocalizerService();
            this.setService(ServiceName.textLocalizer, service);
        }
        return service;
    }
    public set textLocalizerService(service: ITextLocalizerService)
    {
        this.setService(ServiceName.textLocalizer, service);
    }

    /**
     * Service to get the IMessageTokenResolver instance that replaces
     * tokens in messages.
     */
    public get messageTokenResolverService(): IMessageTokenResolverService {
        let service = this.getService<IMessageTokenResolverService>(ServiceName.messageTokenResolver);
        if (!service)
            throw new CodingError('Must assign ValidationServices.MessageTokenResolverService.');

        return service;
    }
    public set messageTokenResolverService(service: IMessageTokenResolverService) {
        this.setService(ServiceName.messageTokenResolver, service);
    }

    /**
     * Service to get the ILogger instance that replaces
     * tokens in messages.
     * Defaults to using ConsoleLoggerService.
     */
    public get loggerService(): ILoggerService {
        let service = this.getService<ILoggerService>(ServiceName.logger);
        if (!service) {
            service = new ConsoleLoggerService();
            this.setService(ServiceName.logger, service);
        }
        return service;
    }
    public set loggerService(service: ILoggerService) {
        this.setService(ServiceName.logger, service);
    }

    //#region ValueHostFactory
    /**
     * The ValueHostFactory to use.
     * It supplies a default if not setup by the user.
     */
    public get valueHostFactory(): IValueHostFactory {
        let service = this.getService<IValueHostFactory>(ServiceName.valueHostFactory);
        if (!service) {
            let factory = service = new ValueHostFactory();
            registerStandardValueHostGenerators(factory);
            this.setService(ServiceName.valueHostFactory, factory);
        }
        return service;
    }
    public set valueHostFactory(factory: IValueHostFactory) {
        this.setService(ServiceName.valueHostFactory, factory);
    }

    //#endregion ValueHostFactory

    //#region ValidatorFactory    
    /**
     * The ValidatorFactory to use.
     * It supplies a default if not setup by the user.
     */
    public get validatorFactory(): IValidatorFactory {
        let service = this.getService<IValidatorFactory>(ServiceName.validatorFactory);
        if (!service) {
            service = new ValidatorFactory();
            this.setService(ServiceName.validatorFactory, service);
        }
        return service;
    }
    public set validatorFactory(factory: ValidatorFactory) {
        this.setService(ServiceName.validatorFactory, factory);
    }

    //#endregion ValidatorFactory        
}

/**
 * Call when assigning the IServiceWithFallback.fallbackService property to ensure
 * it does not loop around to the original.
 * @param fallbackService - The service to assign to startingService.fallbackService.
 * @param hostService - the service that is getting is fallbackService property assigned 
 */
export function assertValidFallbacks(fallbackService: IServiceWithFallback<any> | null, hostService: IServiceWithFallback<any>): void
{
    if (fallbackService === null)
        return;
    let service = fallbackService;
    let limit = 10;
    while (service.fallbackService)
    {
        if (service.fallbackService === hostService)
            throw new CodingError('Service fallback loops back to itself.');
        limit--;
        if (limit === 0)
            throw new CodingError('Reached the limit of fallbacks');
        service = service.fallbackService;
    }
}