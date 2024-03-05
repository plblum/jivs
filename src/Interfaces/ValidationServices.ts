import { IConditionFactory } from "../Conditions/ConditionFactory";
import { IDataTypeResolver } from "./DataTypes";
import { IMessageTokenResolver } from "./InputValidator";
import { ILogger } from "./Logger";

/**
 * Provides a dependency injection model to this library.
 */

/**
 * Subset of the IValidationServices interface designed to limit
 * exposure where consumers need only its features.
 * Helps for mocking and testing.
 */
export interface IBasicValidationServices
{
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
export interface IValidationServices extends IBasicValidationServices
{

    /**
     * Factory to create Condition objects.
     * Defaults to using GetDefaultConditionFactory.
     */
    ConditionFactory: IConditionFactory;

    /**
     * Service to get the IDataTypeResolver instance associated with the dataTypeLabel.
     * Defaults to using the global defaultDataTypeResolverService.
     */
    DataTypeResolverService: IDataTypeResolver;
    
    /**
     * Service to get the IMessageTokenResolver instance that replaces
     * tokens in messages.
     * Defaults to using the global defaultMessageTokenResolverService
     */
    MessageTokenResolverService: IMessageTokenResolver;

}
