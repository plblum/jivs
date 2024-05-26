/**
 * ConditionBase is the base implementation of {@link Conditions/Types!ICondition | ICondition}, 
 * tying it to {@link Conditions/Types!ConditionConfig | ConditionConfig}
 * @module Conditions/AbstractClasses/ConditionBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { type ConditionConfig, type IConditionCore, ConditionEvaluateResult, ConditionCategory } from '../Interfaces/Conditions';
import type { IGatherValueHostNames, IValueHost } from '../Interfaces/ValueHost';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { assertNotNull } from '../Utilities/ErrorHandling';
import type { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { IMessageTokenSource, TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';

/**
 * Base implementation of ICondition.
 * Subclass to build a business rule that will evaluate value(s).
 * Conditions exist for each business rule pattern, such as 
 * required, string matches the data type, compare value to another.
 * Instances should be registered in the ConditionFactory.
 */
export abstract class ConditionBase<TConditionConfig extends ConditionConfig>
    implements IConditionCore<TConditionConfig>, IMessageTokenSource, IGatherValueHostNames {
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
     * Utility to log when a conditionConfig property is incorrectly setup.
     * @param errorMessage 
     * @param valueHostsManager 
     */
    protected logInvalidPropertyData(propertyName: string, errorMessage: string, valueHostsManager: IValueHostsManager): void {
        let fnName = this.constructor.name;
        valueHostsManager.services.loggerService.log(propertyName + ': ' + errorMessage, LoggingLevel.Error, LoggingCategory.Configuration, fnName);
    }
}
