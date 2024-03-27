/**
 * Provides a dependency injection approach to this library.
 * @module ValidationServices/Interfaces
 */

import { IConditionFactory } from './Conditions';
import { IDataTypeServices } from './DataTypes';
import { IInputValidatorFactory, IMessageTokenResolver } from './InputValidator';
import { ILogger } from './Logger';
import { ITextLocalizerService } from './TextLocalizerService';
import { IValueHostFactory } from './ValueHost';

/**
 * Interface to have access to services.
 */
export interface IServicesAccessor
{
/**
 * Provides access to services.
 */
    services: IValidationServices;    
}

/**
 * Subset of the IValidationServices interface designed to limit
 * exposure where consumers need only its features.
 * Helps for mocking and testing.
 */
export interface IBasicValidationServices {
    /**
     * Service to get the ILogger instance that replaces
     * tokens in messages.
     * Defaults to using the global defaultLoggerService
     */
    loggerService: ILogger;
}


/**
 * Full interface representation of ValidationServices.
 */
export interface IValidationServices extends IBasicValidationServices {
/**
 * The culture shown to the user in the app. Its the ISO language-region format.
   This value is the starting point to search through localizations.
 */    
    activeCultureId: string;

    /**
     * Factory to create Condition objects.
     */
    conditionFactory: IConditionFactory;

    /**
     * Service to get the IDataTypeServices instance associated with the dataTypeLabel.
     */
    dataTypeServices: IDataTypeServices;
    
    /**
     * Service to text localization specific, effectively mapping
     * a text key to a language specific version of that text.
     * Error messages and IDataTypeFormatters use this.
     */
    textLocalizerService: ITextLocalizerService;

    /**
     * Service to get the IMessageTokenResolver instance that replaces
     * tokens in messages.
     */
    messageTokenResolverService: IMessageTokenResolver;

    /**
     * Factory for generating classes that implement IValueHost that use ValueHostDescriptor.
     */
    valueHostFactory: IValueHostFactory;

    /**
     * Factory for generating InputValidator.
     */
    inputValidatorFactory: IInputValidatorFactory;

}

/**
 * Determines if the source implements IServicesAccessor, and returns it typecasted.
 * If not, it returns null.
 * @param source 
 */
export function toIServicesAccessor(source: any): IServicesAccessor | null {
    if (source && typeof source === 'object') {
        let test = source as IServicesAccessor;       
        if ('Services' in test)
            return test;
    }
    return null;
}