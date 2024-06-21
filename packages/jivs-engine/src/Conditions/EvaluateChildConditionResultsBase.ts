/**
 * Base Condition for evaluating the results from a list of Conditions, where a rule determines what to
 * do with their results. 
 * 
 * In this Condition, the value of the current input field/element passed into 
 * evaluate(vh) is passed along to child Conditions that do not specify a ValueHost.
 * @module Conditions/AbstractClasses/EvaluateChildConditionResultsBase
 */

import { ConditionEvaluateResult, ICondition } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { CodingError } from '../Utilities/ErrorHandling';
import { ConditionWithChildrenBase, ConditionWithChildrenBaseConfig } from './ConditionWithChildrenBase';

/**
 * ConditionConfig for EvaluateChildConditionResultsBase.
 */
export interface EvaluateChildConditionResultsBaseConfig extends ConditionWithChildrenBaseConfig {

    /**
     * When a child condition evaluates as Undetermined, this indicates how to handle it.
     * Defaults to Undetermined.
     */
    treatUndeterminedAs?: ConditionEvaluateResult;
}

/**
 * Base Condition for evaluating the results from a list of Conditions, where a rule determines what to
 * do with their results. 
 * 
 * In this Condition, the value of the current input passed into 
 * evaluate(vh) is passed along to child Conditions that do not specify a ValueHost.
 */
export abstract class EvaluateChildConditionResultsBase<TConfig extends EvaluateChildConditionResultsBaseConfig>
    extends ConditionWithChildrenBase<TConfig>
{
    /**
     * 
     * @param valueHost - this is passed down to the child ValueHosts
     * @param valueHostsManager 
     * @returns 
     */
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        let conditions = this.conditions(valueHostsManager);
        if (conditions.length === 0)
            return ConditionEvaluateResult.Undetermined;
        return this.evaluateChildren(conditions, valueHost, valueHostsManager);
    }

    protected abstract evaluateChildren(conditions: Array<ICondition>, parentValueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult;

    /**
     * Utility for EvaluateChildren to apply the Config.treatUndeterminedAs
     * @param childResult 
     * @returns 
     */
    protected cleanupChildResult(childResult: ConditionEvaluateResult | Promise<ConditionEvaluateResult>): ConditionEvaluateResult {
        if (childResult instanceof Promise)
            /* istanbul ignore next */
            throw new CodingError('Promises are not supported for child conditions at this time.');
        if (childResult === ConditionEvaluateResult.Undetermined)
            return this.config.treatUndeterminedAs ?? ConditionEvaluateResult.Undetermined;
        return childResult;
    }
}
