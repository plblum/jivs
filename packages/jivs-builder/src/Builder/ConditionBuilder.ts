/**
 *  @module jivs-builder/Builders/ConcreteClasses
*/

import
    {
        EqualToConditionConfig, EqualToValueConditionConfig,
        GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, GreaterThanOrEqualValueConditionConfig,
        GreaterThanValueConditionConfig, LessThanConditionConfig,
        LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig,
        NotEqualToConditionConfig,
        NotEqualToValueConditionConfig,
    } from '@plblum/jivs-engine/build/Conditions/ComparisonCondition_classes';
import
    {
        DataTypeCheckConditionConfig,
        IntegerConditionConfig,
        MaxDecimalsConditionConfig,
        NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig,
        RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig
    } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { ValueHostName } from '@plblum/jivs-engine/build/DataTypes/BasicTypes';
import { ConditionConfig } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import
    {
        CompleteConfigBuilderHandler,
        IBuilderConfigHost,
        IConditionBuilder, OptionalEqualToConditionParams,
        OptionalEqualToValueConditionParams, OptionalGreaterThanConditionParams,
        OptionalGreaterThanOrEqualConditionParams, OptionalGreaterThanOrEqualValueConditionParams,
        OptionalGreaterThanValueConditionParams, OptionalLessThanConditionParams,
        OptionalLessThanOrEqualConditionParams, OptionalLessThanOrEqualValueConditionParams,
        OptionalLessThanValueConditionParams, OptionalNotEqualToConditionParams,
        OptionalNotEqualToValueConditionParams, OptionalRegExpConditionParams,
        OptionalRequireTextConditionParams, OptionalStringLengthConditionParams,
        SetConfigOptions
    } from '../Interfaces/ChildBuilders';
import { ConditionBuilderBase } from './ConditionBuilderBase';
import { ResolveValueHost } from './ValidatorBuilder';

/**
 * This class is intended to be used by all functions that create a condition config object.
 * It has all Jivs-supplied conditions declared as its methods, each doing its own thing to create
 * its condition object and attach it to the parent builder.
 *
 * When creating conditions without a validator, there are two fluent steps.
 * 1. Use StartConditionBuilder to define the source field for the value
 *      assigned to valueHostName of the condition. It provides parentValue()
 *      and fieldValue(valuehostname), along with several conditions that don't use valueHostNames:
 *      any, all, countMatches, not, and when.
 * 2. Use ConditionBuilder to create the ConditionConfig specific to that condition.
 *      Its job is to let condition specific methods create the ConditionConfig
 *      and pass it back to the parent builder through attachChildConfig().
 *
 * Together they look like this:
 * ```ts
 * let builder = new StartConditionBuilder(parentBuilder);
 * builder.fieldValue('fieldName').requireText();
 * builder.parentValue().regExp('pattern');
 * ```
 *
 * This class is also used with ValidatorBuilder to create condition-specific configurations.
 */
export class ConditionBuilder<TConfig extends ConditionConfig = ConditionConfig,
    TOptions extends SetConfigOptions = SetConfigOptions>
    extends ConditionBuilderBase<TConfig, TOptions>
    implements IConditionBuilder<TConfig> {

    /**
     *
     * @param parentBuilder - The Builder requesting this one.
     * It will consume the config generated either through the completed
     * callback or by calling getConfig().
     * @param completed - Optional callback that occurs when
     * this builder has finished creating the config. It notifies
     * the builder with the config so it can consume it.
     * This is usually consumed by calling parentBuilder to use the child
     * builder's config.
     */
    constructor(services: IJivsServices,
        parentBuilder: IBuilderConfigHost<object>,
        completed?: CompleteConfigBuilderHandler<TConfig>
    ) {
        super(services, parentBuilder, completed);
    }

    /**
     * Creates a configuration for DataTypeCheckCondition.
     */
    public dataTypeCheck(): void {
        const config: Partial<DataTypeCheckConditionConfig> = {
            conditionType: ConditionType.DataTypeCheck
        };
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the RequireTextCondition.
     * @param conditionConfig - Optional configuration parameters for the RequireText condition.
     */
    public requireText(conditionConfig?: OptionalRequireTextConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as RequireTextConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.RequireText;

        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the NotNullCondition.
     */
    public notNull(): void {
        const config: Partial<NotNullConditionConfig> = {
            conditionType: ConditionType.NotNull
        };
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the RegExpCondition.
     * @param expression - The regular expression to match against.
     * @param ignoreCase - Whether to ignore case when matching the regular expression.
     * @param conditionConfig - Optional configuration parameters for the RegExp condition.
     */
    public regExp(
        expression: RegExp | string, ignoreCase?: boolean | null,
        conditionConfig?: OptionalRegExpConditionParams): void {
        const config: RegExpConditionConfig = (conditionConfig ? { ...conditionConfig } : {}) as RegExpConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.RegExp;
        if (expression != null)
            if (expression instanceof RegExp)
                config.expression = expression;

            else
                config.expressionAsString = expression;
        if (ignoreCase != null)
            config.ignoreCase = ignoreCase;

        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the RangeCondition.
     * @param minimum - The minimum value for the range.
     * @param maximum - The maximum value for the range.
     */
    public range(minimum: any, maximum: any): void {
        const config = { conditionType: ConditionType.Range } as RangeConditionConfig;
        if (minimum != null)
            config.minimum = minimum;
        if (maximum != null)
            config.maximum = maximum;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the EqualToValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualToValue condition.
     */
    public equalToValue(
        secondValue: any,
        conditionConfig?: OptionalEqualToValueConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as EqualToValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.EqualToValue;
        if (secondValue != null)
            if (secondValue instanceof ResolveValueHost)
                config.secondValueHostName = secondValue.valueHostName;
            else
                config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the EqualToValueCondition using an alias to equalToValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualToValue condition.
     */
    public eqValue(secondValue: any, conditionConfig?: OptionalEqualToValueConditionParams): void {
        this.equalToValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the EqualToCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualTo condition.
     */
    public equalTo(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalEqualToConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as EqualToConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.EqualTo;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the EqualToCondition using an alias to equalTo()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualTo condition.
     */
    public eq(secondValueHostName: ValueHostName, conditionConfig?: OptionalEqualToConditionParams): void {
        this.equalTo(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the NotEqualToValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualToValue condition.
     */
    public notEqualToValue(
        secondValue: any,
        conditionConfig?: OptionalNotEqualToValueConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.NotEqualToValue;
        if (secondValue != null)
            if (secondValue instanceof ResolveValueHost)
                config.secondValueHostName = secondValue.valueHostName;
            else
                config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the NotEqualToValueCondition using an alias to notEqualToValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualToValue condition.
     */
    public neqValue(secondValue: any, conditionConfig?: OptionalNotEqualToValueConditionParams): void {
        this.notEqualToValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the NotEqualToCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualTo condition.
     */
    public notEqualTo(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalNotEqualToConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.NotEqualTo;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the NotEqualToCondition using an alias to notEqualTo()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualTo condition.
     */
    public neq(secondValueHostName: ValueHostName, conditionConfig?: OptionalNotEqualToConditionParams): void {
        this.notEqualTo(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the LessThanValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanValue condition.
     */
    public lessThanValue(
        secondValue: any,
        conditionConfig?: OptionalLessThanValueConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as LessThanValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.LessThanValue;
        if (secondValue != null)
            if (secondValue instanceof ResolveValueHost)
                config.secondValueHostName = secondValue.valueHostName;
            else
                config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the LessThanValueCondition using an alias to lessThanValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanValue condition.
     */
    public ltValue(secondValue: any, conditionConfig?: OptionalLessThanValueConditionParams): void {
        this.lessThanValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the LessThanCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThan condition.
     */
    public lessThan(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalLessThanConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as LessThanConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.LessThan;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the LessThanCondition using an alias to lessThan()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThan condition.
     */
    public lt(secondValueHostName: ValueHostName, conditionConfig?: OptionalLessThanConditionParams): void {
        this.lessThan(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the LessThanOrEqualValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqualValue condition.
     */
    public lessThanOrEqualValue(
        secondValue: any,
        conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.LessThanOrEqualValue;
        if (secondValue != null)
            if (secondValue instanceof ResolveValueHost)
                config.secondValueHostName = secondValue.valueHostName;
            else
                config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the LessThanOrEqualValueCondition using an alias to lessThanOrEqualValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqualValue condition.
     */
    public lteValue(secondValue: any, conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void {
        this.lessThanOrEqualValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the LessThanOrEqualCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqual condition.
     */
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalLessThanOrEqualConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.LessThanOrEqual;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the LessThanOrEqualCondition using an alias to lessThanOrEqual()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqual condition.
     */
    public lte(secondValueHostName: ValueHostName, conditionConfig?: OptionalLessThanOrEqualConditionParams): void {
        this.lessThanOrEqual(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the GreaterThanValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanValue condition.
     */
    public greaterThanValue(
        secondValue: any,
        conditionConfig?: OptionalGreaterThanValueConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.GreaterThanValue;
        if (secondValue != null)
            if (secondValue instanceof ResolveValueHost)
                config.secondValueHostName = secondValue.valueHostName;
            else
                config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the GreaterThanValueCondition using an alias to greaterThanValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanValue condition.
     */
    public gtValue(secondValue: any, conditionConfig?: OptionalGreaterThanValueConditionParams): void {
        this.greaterThanValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the GreaterThanCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThan condition.
     */
    public greaterThan(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalGreaterThanConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.GreaterThan;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the GreaterThanCondition using an alias to greaterThan()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThan condition.
     */
    public gt(secondValueHostName: ValueHostName, conditionConfig?: OptionalGreaterThanConditionParams): void {
        this.greaterThan(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the GreaterThanOrEqualValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqualValue condition.
     */
    public greaterThanOrEqualValue(
        secondValue: any,
        conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.GreaterThanOrEqualValue;
        if (secondValue != null)
            if (secondValue instanceof ResolveValueHost)
                config.secondValueHostName = secondValue.valueHostName;
            else
                config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the GreaterThanOrEqualValueCondition using an alias to greaterThanOrEqualValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqualValue condition.
     */
    public gteValue(secondValue: any, conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void {
        this.greaterThanOrEqualValue(secondValue, conditionConfig);
    }

    /**
     * Creates configuration for the GreaterThanOrEqualCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqual condition.
     */
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.GreaterThanOrEqual;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the GreaterThanOrEqualCondition using an alias to greaterThanOrEqual()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqual condition.
     */
    public gte(secondValueHostName: ValueHostName, conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void {
        this.greaterThanOrEqual(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the StringLengthCondition.
     * @param maximum - The maximum length of the string.
     * @param conditionConfig - Optional configuration parameters for the StringLength condition.
     */
    public stringLength(
        maximum: number | null,
        conditionConfig?: OptionalStringLengthConditionParams): void {
        const config = (conditionConfig ? { ...conditionConfig } : {}) as StringLengthConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.StringLength;
        if (maximum != null)
            config.maximum = maximum;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the StringLengthCondition using an alias to stringLength()
     * @param maximum - The maximum length of the string.
     * @param conditionConfig - Optional configuration parameters for the StringLength condition.
     */
    public len(maximum: number | null, conditionConfig?: OptionalStringLengthConditionParams): void {
        this.stringLength(maximum, conditionConfig);
    }

    /**
     * Creates a configuration for the PositiveCondition.
     * This condition checks if a value is positive.
     */
    public positive(): void {
        const config = { conditionType: ConditionType.Positive } as PositiveConditionConfig;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the IntegerCondition.
     * This condition checks if a value is an integer.
     */
    public integer(): void {
        const config = { conditionType: ConditionType.Integer } as IntegerConditionConfig;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the MaxDecimalsCondition.
     * This condition checks if a value has no more than the specified number of decimal places.
     * @param maxDecimals - The maximum number of decimal places allowed.
     */
    public maxDecimals(maxDecimals: number): void {
        const config = {
            conditionType: ConditionType.MaxDecimals,
            maxDecimals: maxDecimals
        } as MaxDecimalsConditionConfig;
        this.setConfig(config as any);
    }
}
