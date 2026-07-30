/**
 * ConditionBase is the base implementation of {@link jivs-engine/Conditions/Types!ICondition | ICondition}, 
 * tying it to {@link jivs-engine/Conditions/Types!ConditionConfig | ConditionConfig}
 * @module jivs-engine/Conditions/AbstractClasses/ConditionBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionCategory, ConditionEvaluateResult, ICondition, type ConditionConfig, type IConditionCore } from '../Interfaces/Conditions';
import { IDisposable, toIDisposable } from '../Interfaces/General_Purpose';
import { LogDetails, LogOptions, LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { IMessageTokenSource, TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import type { IValidationManager } from '../Interfaces/ValidationManager';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import type { IGatherValueHostNames, IValueHost } from '../Interfaces/ValueHost';
import { CodingError, assertNotNull, ensureError } from '../Utilities/ErrorHandling';
import { LoggerFacade } from '../Utilities/LoggerFacade';
import { ConditionType } from './ConditionTypes';

/**
 * Base implementation of ICondition.
 * Subclass to build a business rule that will evaluate value(s).
 * Conditions exist for each business rule pattern, such as 
 * required, string matches the data type, compare value to another.
 * Instances should be registered in the ConditionFactory.
 */
export abstract class ConditionBase<TConditionConfig extends ConditionConfig>
    implements IDisposable, IConditionCore<TConditionConfig>, IMessageTokenSource, IGatherValueHostNames {
    constructor(config: TConditionConfig) {
        assertNotNull(config, 'config');
        this._config = config;
    }

    /**
     * Provides an API for logging, sending entries to the loggerService.
     * @param services 
     * @returns 
     */
    protected logger(services: IValidationServices): LoggerFacade
    {
        if (!this._logger)
            this._logger = new LoggerFacade(services.loggerService, 'Condition', this, this.conditionType);
        return this._logger;
    }
    private _logger: LoggerFacade | null = null;
    
    /**
     * A unique identifier for the specific implementation, like "RequireText" or "Range".
     * Its value appears in the IssueFound that comes from Validation, and in 
     * IssueFound that comes from retrieving a list of errors to display.
     * It allows the consumer of both to correlate those instances with the specific condition.
     * When defining conditions through a ConditionConfig, the Type property must 
     * be assigned with a valid ConditionType.
     * This property always returns what the user supplied in the Config.conditionType, not
     * the default conditiontype. That allows multiple instances of the same condition Class
     * to participate in one validator's list of conditions, because each has a unique ConditionType.
     */
    public get conditionType(): string
    {
        return this.config.conditionType;
    }
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        toIDisposable(this._config)?.dispose();
        (this._config as any) = undefined;
        (this._logger as any) = undefined!;        
    }
    
    /**
     * Evaluate a value using its business rule and configuration in the Config.
     * @param valueHost - contains both the raw value from input field/element and the value resolved by data type.
     * The evaluate function can use either. It should always return Undetermined if the value it gets
     * is 'undefined' or no compatible with its requirements (like wrong data type).
     * If the ConditionConfig.valueHostName is assigned, it will be used to retrieve
     * the ValueHost from the Model, and this parameter is ignored.
     * This parameter can be null, but the ConditionConfig will need to supply a ValueHostName
     * to a value host instead.
     * @param validationManager 
     */
    public abstract evaluate(valueHost: IValueHost | null, validationManager: IValidationManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;

    /**
     * Data that supports the business rule defined in evaluate().
     * Consider this immutable.
     * Expect to create a new Condition instance if its data needs to be changed.
     */
    public get config(): TConditionConfig {
        return this._config;
    }
    private readonly _config: TConditionConfig;

    /**
     * Helps identify the purpose of the Condition. Impacts:
     * * Sort order of the list of Conditions evaluated by an Validator,
     *   placing Require first and DataTypeCheck second.
     * * Sets FieldValueHostConfig.required.
     * * Sets ValidatorConfig.severity when undefined, where Require
     *   and DataTypeCheck will use Severe. Others will use Error.
     * Many Conditions have this value predefined. However, all will let the user
     * override it with ConditionConfig.category.
     */
    public get category(): ConditionCategory {
        return this.config.category ?? this.defaultCategory;
    }
    /**
     * Supplies the Condition's default Category
     */
    protected abstract get defaultCategory(): ConditionCategory;

    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public abstract gatherValueHostNames(collection: Set<ValueHostName>, validationManager: IValidationManager): void;

    /**
     * Implementation for IMessageTokenSource.
     *  Conditions havea number of values that are appropriate for tokens on the ConditionConfig.
     *  Examples:
     *  - In RangeCondition, Minimum and Maximum properties become {Mininum} and {Maximum} tokens.
     *  - In CompareToValueCondition, secondValueHostName property is the source for the {CompareTo} token.
     *  This implementation feels like it violates Single Responsibility pattern.
     *  But keeping this feature separate from conditions greatly increases complexity.
     * @param validationManager 
     * @returns An array. If an empty array if there are no token to offer.
     * This base class has no tokens to offer.
     */
    public getValuesForTokens(valueHost: IValidatorsValueHostBase, validationManager: IValidationManager): Array<TokenLabelAndValue> {
        return [];
    }

    /**
     * Utility to create a condition to use as a child condition.
     * It uses the conditionFactory. If the factory throws an exception, it logs the error
     * and returns ErrorResponseCondition that always returns Undetermined to allow execution to continue.
     * Always check for ErrorResponseCondition and assign it to the instance field anyway, 
     * but then call throwInvalidPropertyData() to log and throw an exception.
     * @param config 
     * @param services 
     * @returns Condition created including ErrorResponseCondition if it could not be created.
     */
    protected generateCondition(config: ConditionConfig, services: IValidationServices): ICondition {

        if (!config)
            return new ErrorResponseCondition(new CodingError('ConditionConfig is unassigned.'));
        try
        {
            return services.conditionFactory.create(config);
        }
        catch (e)
        {
            const err = ensureError(e);
            this.logger(services).error(err);

            return new ErrorResponseCondition(e as Error);
        }
            // expect exceptions here for invalid Configs
    }

    /**
     * Converts the given value and lookup key using the provided conversion lookup key.
     * If the conversion fails, a warning log is generated.
     * Takes no action if the conversionLookupKey is null.
     *
     * @param value - The value to be converted.
     * @param valueLookupKey - The lookup key associated with the value. Often this should
     * be assigned to valueHost.getDataType().
     * @param conversionLookupKey - The conversion lookup key to be used for conversion.
     * Often this comes from conversionLookupKey or secondConversionLookupKey
     * found on the Config object.
     * @param services - The services
     * @returns An object containing the converted value, lookup key, and a flag indicating if the conversion failed.
     */
    protected tryConversion(value: any, valueLookupKey: string | null | undefined,
        conversionLookupKey: string | null | undefined, services: IValidationServices): {
        value?: any;
        lookupKey?: string | null;
        failed: boolean;
    }
    {
        if (conversionLookupKey) {
            const result = services.dataTypeConverterService.convertUntilResult(
                value, valueLookupKey ?? null, conversionLookupKey);
            if (!result.resolvedValue) {

                this.logger(services).log(LoggingLevel.Warn, (options?: LogOptions) => {
                    const details: LogDetails = {
                        message: `Value cannot be converted to "${conversionLookupKey}".`,
                        category: LoggingCategory.TypeMismatch
                    };
                    if (options?.includeData)
                        details.data = {
                            value: value,
                            valueLookupKey: valueLookupKey,
                            conversionLookupKey: conversionLookupKey
                        };
                    return details;                    
                });
                return { failed: true };
            }
            value = result.value;
            valueLookupKey = conversionLookupKey;
        }
        return { value: value, lookupKey: valueLookupKey, failed: false };
    }
    
    protected ensureNoPromise(result: ConditionEvaluateResult | Promise<ConditionEvaluateResult>): ConditionEvaluateResult {
        if (result instanceof Promise)
            throw new CodingError('Promises are not supported for child conditions at this time.');
        return result;
    }


    /**
     * Utility to log when a conditionConfig property is incorrectly setup.
     * @param propertyName
     * @param errorMessage 
     * @param services 
     */
    protected logInvalidPropertyData(propertyName: string, errorMessage: string, services: IValidationServices, logLevel: LoggingLevel = LoggingLevel.Warn): void {
        
        this.logger(services).log(logLevel,
            (options?: LogOptions) => {
            const details: LogDetails = {
                message: propertyName + ': ' + errorMessage,
                category: LoggingCategory.Configuration
            };
            if (options?.includeData)
                details.data = { propertyName: propertyName };
            return details;
            });
    }

    /**
     * Logs the invalid property data and throws a CodingError.
     * @param propertyName - The name of the invalid property.
     * @param errorMessage - The error message describing the invalid property data.
     * @param services - The value host services.
     * @throws {CodingError} - Throws a CodingError with the specified error message.
     */
    protected throwInvalidPropertyData(propertyName: string, errorMessage: string, services: IValidationServices): void {
        this.logInvalidPropertyData(propertyName, errorMessage, services, LoggingLevel.Error);
        throw new CodingError(propertyName + ': ' + errorMessage);
    }
    /**
     * Report a comparison error where the data types of the two values are mismatched.
     * @param services 
     * @param propertyName 
     * @param propertyName2 
     * @param propertyValue 
     * @param propertyValue2 
     */
    protected logTypeMismatch(services: IValidationServices, propertyName: string, propertyName2: string, propertyValue: any, propertyValue2: any): void {
        this.logger(services).log(LoggingLevel.Warn, (options?: LogOptions) => {
            const details: LogDetails = {
                message: `Type mismatch. ${propertyName} cannot be compared to ${propertyName2}`,
                category: LoggingCategory.TypeMismatch
            };
            if (options?.includeData)
                details.data = {
                    value: propertyValue,
                    secondValue: propertyValue2
                };
            return details;
        });        
    }
    /**
     * Logs a message indicating that the specified property lacks a value to evaluate.
     * @param propertyName - The name of the property.
     * @param services - The value host services.
     */
    protected logNothingToEvaluate(propertyName: string, services: IValidationServices): void {
        const msg = 'lacks value to evaluate';
        this.logInvalidPropertyData(propertyName, msg, services);
    }
}

/** 
 * Used internally to take the place of a Condition that failed to be created.
 * Always evaluates as Undetermined.
*/
export class ErrorResponseCondition implements ICondition
{
    constructor(error?: Error) {
        this.error = error;
    }
    public readonly conditionType: string = ConditionType.Unknown;
    public readonly category: ConditionCategory = ConditionCategory.Undetermined;
    /**
     * Exposes the exception that caused this condition to be created.
     */
    public readonly error?: Error;
    public evaluate(valueHost: IValueHost | null, validationManager: IValidationManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.Undetermined;
    }

}