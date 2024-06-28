/**
 * ConditionBase is the base implementation of {@link Conditions/Types!ICondition | ICondition}, 
 * tying it to {@link Conditions/Types!ConditionConfig | ConditionConfig}
 * @module Conditions/AbstractClasses/ConditionBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { type ConditionConfig, type IConditionCore, ConditionEvaluateResult, ConditionCategory, ICondition } from '../Interfaces/Conditions';
import type { IGatherValueHostNames, IValueHost } from '../Interfaces/ValueHost';
import { LogDetails, LogOptions, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from '../Interfaces/LoggerService';
import { CodingError, assertNotNull, ensureError } from '../Utilities/ErrorHandling';
import type { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { IMessageTokenSource, TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { IDisposable, toIDisposable } from '../Interfaces/General_Purpose';
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';
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
     * @param valueHostsManager 
     */
    public abstract evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;

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
     * * Sets InputValueHostConfig.requiresInput.
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
    public abstract gatherValueHostNames(collection: Set<ValueHostName>, valueHostsManager: IValueHostsManager): void;

    /**
     * Implementation for IMessageTokenSource.
     *  Conditions havea number of values that are appropriate for tokens on the ConditionConfig.
     *  Examples:
     *  - In RangeCondition, Minimum and Maximum properties become {Mininum} and {Maximum} tokens.
     *  - In CompareToValueCondition, secondValueHostName property is the source for the {CompareTo} token.
     *  This implementation feels like it violates Single Responsibility pattern.
     *  But keeping this feature separate from conditions greatly increases complexity.
     * @param valueHostsManager 
     * @returns An array. If an empty array if there are no token to offer.
     * This base class has no tokens to offer.
     */
    public getValuesForTokens(valueHost: IValidatorsValueHostBase, valueHostsManager: IValueHostsManager): Array<TokenLabelAndValue> {
        return [];
    }

    /**
     * Utility to create a condition to use as a child condition.
     * It uses the conditionFactory. If the factory throws an exception, it logs the error
     * and returns a condition that always returns Undetermined to allow execution to continue.
     * @param config 
     * @param services 
     * @returns 
     */
    protected generateCondition(config: ConditionConfig, services: IValueHostsServices): ICondition {

        try
        {
            return services.conditionFactory.create(config);
        }
        catch (e)
        {
            let err = ensureError(e);
            this.logError(services, err);

            return new ErrorResponseCondition();
        }
            // expect exceptions here for invalid Configs
    }

    protected ensureNoPromise(result: ConditionEvaluateResult | Promise<ConditionEvaluateResult>): ConditionEvaluateResult {
        if (result instanceof Promise)
            throw new CodingError('Promises are not supported for child conditions at this time.');
        return result;
    }


    /**
     * Utility to log when a conditionConfig property is incorrectly setup.
     * @param errorMessage 
     * @param valueHostsManager 
     */
    protected logInvalidPropertyData(propertyName: string, errorMessage: string, valueHostsManager: IValueHostsManager): void {
        this.log(valueHostsManager.services, LoggingLevel.Error, (options?: LogOptions) => {
            let details: LogDetails = {
                message: propertyName + ': ' + errorMessage,
                category: LoggingCategory.Configuration
            };
            if (options?.includeData)
                details.data = { propertyName: propertyName };
            return details;
        });
    }
    /**
     * Report a comparison error where the data types of the two values are mismatched.
     * @param services 
     * @param propertyName 
     * @param propertyName2 
     * @param propertyValue 
     * @param propertyValue2 
     */
    protected logTypeMismatch(services: IValueHostsServices, propertyName: string, propertyName2: string, propertyValue: any, propertyValue2: any): void {
        this.log(services, LoggingLevel.Warn, (options?: LogOptions) => {
            let details: LogDetails = {
                message: `Type mismatch. ${propertyName} cannot be compared to ${propertyName2}`,
                category: LoggingCategory.TypeMismatch,
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
     * Log a message. The message gets assigned the details of feature, type, and identity
     * here.
     */
    protected log(services: IValueHostsServices, level: LoggingLevel, gatherFn: logGatheringHandler): void {
        let logger = services.loggerService;
        logger.log(level, (options?: LogOptions) => {
            let details = gatherFn ? gatherFn(options) : <LogDetails>{};
            details.feature = 'Condition';
            details.type = this;
            details.identity = this.conditionType;
            return details;
        });
    }
    /**
     * When the log only needs the message and nothing else.
     * @param level 
     * @param messageFn
     */
    protected logQuick(services: IValueHostsServices, level: LoggingLevel, messageFn: ()=> string): void {
        this.log(services, level, () => {
            return {
                message: messageFn()
            };
        });
    }    
    /**
     * Log an exception. The GatherFn should only be used to gather additional data
     * as the Error object supplies message, category (Exception), and this function
     * resolves feature, type, and identity.
     * @param error 
     * @param gatherFn 
     */
    protected logError(services: IValueHostsServices, error: Error, gatherFn?: logGatheringErrorHandler): void
    {
        let logger = services.loggerService;
        logger.logError(error, (options?: LogOptions) => {
            let details = gatherFn ? gatherFn(options) : <LogDetails>{};
            details.feature = 'Condition';
            details.type = this;
            details.identity = this.conditionType;
            return details;
        });
    
    }
}

/** 
 * Used internally to take the place of a Condition that failed to be created.
 * Always evaluates as Undetermined.
*/
export class ErrorResponseCondition implements ICondition
{
    public readonly conditionType: string = ConditionType.Unknown;
    public readonly category: ConditionCategory = ConditionCategory.Undetermined;
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.Undetermined;
    }

}