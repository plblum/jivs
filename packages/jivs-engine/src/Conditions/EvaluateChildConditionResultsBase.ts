/**
 * Framework for evaluating the results from a list of conditions, where a rule determines what to
 * do with their results. In this case, the value of the current input field/element passed into 
 * Evaluate(vh) is ignored. All child conditions must specify their ValueHost sources explicitly.
 * @module Conditions/AbstractClasses/EvaluateChildConditionResultsBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig, ConditionEvaluateResult, ICondition, ConditionCategory } from '../Interfaces/Conditions';
import { IValueHost, toIGatherValueHostNames } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { CodingError } from '../Utilities/ErrorHandling';
import { ConditionBase } from './ConditionBase';

/**
 * Config for all implementations of EvaluateChildConditionResultsBase.
 */
export interface EvaluateChildConditionResultsConfig extends ConditionConfig {
    /**
     * Conditions for this condition to evaluate and apply its rules based on those results.
     * When left empty, the condition evaluates as Undetermined.
     */
    conditionConfigs: Array<ConditionConfig>;

    /**
     * When a child condition evaluates as Undetermined, this indicates how to handle it.
     * Defaults to Undetermined.
     */
    treatUndeterminedAs?: ConditionEvaluateResult;
}

/**
 * Framework for evaluating the results from a list of conditions, where a rule determines what to
 * do with their results. In this case, the value of the current input field/element passed into 
 * Evaluate(vh) is ignored. All child conditions must specify their ValueHost sources explicitly.
 */
export abstract class EvaluateChildConditionResultsBase<TConfig extends EvaluateChildConditionResultsConfig>
    extends ConditionBase<TConfig>
{
    /**
     * 
     * @param valueHost - this is passed down to the child ValueHosts
     * @param valueHostResolver 
     * @returns 
     */
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        let conditions = this.conditions(valueHostResolver);
        if (conditions.length === 0)
            return ConditionEvaluateResult.Undetermined;
        return this.evaluateChildren(conditions, valueHost, valueHostResolver);
    }

    protected conditions(valueHostResolver: IValueHostResolver): Array<ICondition> {
        if (!this._conditions) {
            this._conditions = this.generateConditions(valueHostResolver);
        }
        return this._conditions;
    }
    protected generateConditions(valueHostResolver: IValueHostResolver): Array<ICondition> {
        let conditions: Array<ICondition> = [];
        for (let condConfig of this.config.conditionConfigs) {
            // expect exceptions here for invalid Configs
            let condition = valueHostResolver.services.conditionFactory.create(condConfig);
            conditions.push(condition);
        }
        return conditions;
    }
    private _conditions: Array<ICondition> | null = null;

    protected abstract evaluateChildren(conditions: Array<ICondition>, parentValueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult;

    /**
     * Utility for EvaluateChildren to apply the Config.treatUndeterminedAs
     * @param childResult 
     * @returns 
     */
    protected cleanupChildResult(childResult: ConditionEvaluateResult | Promise<ConditionEvaluateResult>): ConditionEvaluateResult {
        if (childResult instanceof Promise)
            throw new CodingError('Promises are not supported for child conditions at this time.');
        if (childResult === ConditionEvaluateResult.Undetermined)
            return this.config.treatUndeterminedAs ?? ConditionEvaluateResult.Undetermined;
        return childResult;
    }

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void
    {
        let conditions = this.conditions(valueHostResolver);
        for (let condition of conditions)
            toIGatherValueHostNames(condition)?.gatherValueHostNames(collection, valueHostResolver);
    }        
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Children;
    }
}
