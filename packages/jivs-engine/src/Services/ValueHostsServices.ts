/**
 * Supplies services and factories to be used as dependency injection
 * into the classes of this system.
 * Extends the Services class to provide properties for several common
 * services.
 * @module Services/ConcreteClasses/ValueHostsServices
 */

import type { ILoggerService } from '../Interfaces/LoggerService';
import { ServiceName } from '../Interfaces/ValidationServices';
import { IValueHostFactory } from '../Interfaces/ValueHost';
import { ValueHostFactory, registerStandardValueHostGenerators } from '../ValueHosts/ValueHostFactory';
import { ConsoleLoggerService } from './ConsoleLoggerService';
import { IValueHostsServices } from '../Interfaces/ValueHostsManager';
import { Services } from './Services';
import { ICultureService } from '../Interfaces/CultureService';
import { CultureService } from './CultureService';
import { ITextLocalizerService } from '../Interfaces/TextLocalizerService';
import { TextLocalizerService } from './TextLocalizerService';
import { ILookupKeyFallbackService } from '../Interfaces/LookupKeyFallbackService';
import { LookupKeyFallbackService } from './LookupKeyFallbackService';
import { IDataTypeConverterService } from '../Interfaces/DataTypeConverterService';
import { IDataTypeIdentifierService } from '../Interfaces/DataTypeIdentifierService';
import { CodingError } from '../Utilities/ErrorHandling';
import { IDataTypeComparerService } from '../Interfaces/DataTypeComparerService';
import { IConditionFactory } from '../Interfaces/Conditions';

/**
 * Supplies services and factories to be used as dependency injection
 * into the classes of this system.
 * Extends the Services class to provide properties for several common
 * services.
 */
export class ValueHostsServices extends Services implements IValueHostsServices {
   
    /**
     * Service to create Culture objects.
     */
    public get cultureService(): ICultureService {
        let service = this.getService<ICultureService>(ServiceName.culture);
        if (!service) {
            service = new CultureService();
            this.setService(ServiceName.culture, service);
        }
        return service;
    }
    public set cultureService(service: ICultureService) {
        this.setService(ServiceName.culture, service);
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
     * Service for creating a relationship between a lookup key and another
     * that is the base data type it is built around.
     * For example, LookupKey.Integer uses a number as the base data type.
     * So it has a relationship with LookupKey.Number.
     * This service keeps these relationships. The DataTypeFormatterService and DataTypeParserService
     * consume this as they try to find the best fitting Formatter or Parser.
     * So go ahead and assign your ValueHost.datatype to LookupKey.Integer.
     * If there is no IntegerParser (there isn't), expect to be using the NumberParser.
     */
    public get lookupKeyFallbackService(): ILookupKeyFallbackService {
        let service = this.getService<ILookupKeyFallbackService>(ServiceName.lookupKeyFallback);
        if (!service)
        {
            service = new LookupKeyFallbackService();
            this.setService(ServiceName.lookupKeyFallback, service);
        }

        return service;
    }
    public set lookupKeyFallbackService(service: ILookupKeyFallbackService) {
        this.setService(ServiceName.lookupKeyFallback, service);
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

}

