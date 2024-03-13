/**
 * Provides a dependency injection approach to this library.
 * @module ValidationServices/Interfaces
 */

import { IConditionFactory } from "./Conditions";
import { IDataTypeServices } from "./DataTypes";
import { IInputValidatorFactory, IMessageTokenResolver } from "./InputValidator";
import { ILogger } from "./Logger";
import { IValueHostFactory } from "./ValueHost";


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
    LoggerService: ILogger;
}


/**
 * Full interface representation of ValidationServices.
 */
export interface IValidationServices extends IBasicValidationServices {

    /**
     * Factory to create Condition objects.
     * Defaults to using GetDefaultConditionFactory.
     */
    ConditionFactory: IConditionFactory;

    /**
     * Service to get the IDataTypeServices instance associated with the dataTypeLabel.
     * Defaults to using the global defaultDataTypeServices.
     */
    DataTypeServices: IDataTypeServices;

    /**
     * Service to get the IMessageTokenResolver instance that replaces
     * tokens in messages.
     * Defaults to using the global defaultMessageTokenResolverService
     */
    MessageTokenResolverService: IMessageTokenResolver;

    /**
     * Factory for generating classes that implement IValueHost that use IValueHostDescriptor.
     */
    ValueHostFactory: IValueHostFactory;

    /**
     * Factory for generating InputValidator.
     */
    InputValidatorFactory: IInputValidatorFactory;

}
