/**
 * ConditionBase is the base implementation of {@link Conditions/Types!ICondition | ICondition}, 
 * tying it to {@link Conditions/Types!ConditionDescriptor | ConditionDescriptor}
 * @module Conditions/AbstractClasses/ConditionBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { type ConditionDescriptor, type IConditionCore, ConditionEvaluateResult, ConditionCategory } from '../Interfaces/Conditions';
import type { IGatherValueHostNames, IValueHost } from '../Interfaces/ValueHost';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { assertNotNull } from '../Utilities/ErrorHandling';
import type { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { IMessageTokenSource, TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IInputValueHost } from '../Interfaces/InputValueHost';

/**
 * Base implementation of ICondition.
 * Subclass to build a business rule that will evaluate value(s).
 * Conditions exist for each business rule pattern, such as 
 * required, string matches the data type, compare value to another.
 * Instances should be registered in the ConditionFactory.
 */
export abstract class ConditionBase<TConditionDescriptor extends ConditionDescriptor>
    implements IConditionCore<TConditionDescriptor>, IMessageTokenSource, IGatherValueHostNames {
    constructor(descriptor: TConditionDescriptor) {
        assertNotNull(descriptor, 'descriptor');
        this._descriptor = descriptor;
    }
    /**
     * A unique identifier for the specific implementation, like "Required" or "Range".
     * Its value appears in the IssueFound that comes from Validation, and in 
     * IssueFound that comes from retrieving a list of errors to display.
     * It allows the consumer of both to correlate those instances with the specific condition.
     * When defining conditions through a ConditionDescriptor, the Type property must 
     * be assigned with a valid ConditionType.
     * This property always returns what the user supplied in the Descriptor.Type, not
     * the default conditiontype. That allows multiple instances of the same condition Class
     * to participate in one validator's list of conditions, because each has a unique ConditionType.
     */
    public get conditionType(): string
    {
        return this.descriptor.type;
    }

    /**
     * Evaluate a value using its business rule and configuration in the Descriptor.
     * @param valueHost - contains both the raw value from input field/element and the value resolved by data type.
     * The evaluate function can use either. It should always return Undetermined if the value it gets
     * is 'undefined' or no compatible with its requirements (like wrong data type).
     * If the ConditionDescriptor.valueHostName is assigned, it will be used to retrieve
     * the ValueHost from the Model, and this parameter is ignored.
     * This parameter can be null, but the ConditionDescriptor will need to supply a ValueHostName
     * to a value host instead.
     * @param valueHostResolver 
     */
    public abstract evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;

    /**
     * Data that supports the business rule defined in evaluate().
     * Consider this immutable.
     * Expect to create a new Condition instance if its data needs to be changed.
     */
    public get descriptor(): TConditionDescriptor {
        return this._descriptor;
    }
    private readonly _descriptor: TConditionDescriptor;

    /**
     * Helps identify the purpose of the Condition. Impacts:
     * * Sort order of the list of Conditions evaluated by an InputValidator,
     *   placing Required first and DataTypeCheck second.
     * * Sets InputValueHostDescriptor.Required.
     * * Sets InputValidatorDescriptor.Severity when undefined, where Required
     *   and DataTypeCheck will use Severe. Others will use Error.
     * Many Conditions have this value predefined. However, all will let the user
     * override it with ConditionDescriptor.category.
     */
    public get category(): ConditionCategory {
        return this.descriptor.category ?? this.defaultCategory;
    }
    /**
     * Supplies the Condition's default Category
     */
    protected abstract get defaultCategory(): ConditionCategory;

    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Descriptor.
     */
    public abstract gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void;

    /**
     * Implementation for IMessageTokenSource.
     *  Conditions havea number of values that are appropriate for tokens on the ConditionDescriptor.
     *  Examples:
     *  - In RangeCondition, Minimum and Maximum properties become {Mininum} and {Maximum} tokens.
     *  - In CompareToValueCondition, secondValueHostName property is the source for the {CompareTo} token.
     *  This implementation feels like it violates Single Responsibility pattern.
     *  But keeping this feature separate from conditions greatly increases complexity.
     * @param valueHostResolver 
     * @returns An array. If an empty array if there are no token to offer.
     * This base class has no tokens to offer.
     */
    public getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        return [];
    }

    /**
     * Utility to log when a conditionDescriptor property is incorrectly setup.
     * @param errorMessage 
     * @param valueHostResolver 
     */
    protected logInvalidPropertyData(propertyName: string, errorMessage: string, valueHostResolver: IValueHostResolver): void {
        let fnName = this.constructor.name;
        valueHostResolver.services.loggerService.log(propertyName + ': ' + errorMessage, LoggingLevel.Error, LoggingCategory.Configuration, fnName);
    }
}
