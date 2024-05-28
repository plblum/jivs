/**
 * Base Condition for evaluating the results from a list of Conditions, where a rule determines what to
 * do with their results. 
 * 
 * In this Condition, the value of the current input field/element passed into 
 * evaluate(vh) is passed along to child Conditions that do not specify a ValueHost.
 * @module Conditions/AbstractClasses/EvaluateChildConditionResultsBase
 */

import { IDisposable, toIDisposable } from '../Interfaces/General_Purpose';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig, ConditionEvaluateResult, ICondition, ConditionCategory } from '../Interfaces/Conditions';
import { IValueHost, toIGatherValueHostNames } from '../Interfaces/ValueHost';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { CodingError } from '../Utilities/ErrorHandling';
import { ConditionBase } from './ConditionBase';

/**
 * ConditionConfig for EvaluateChildConditionResultsBase.
 */
export interface EvaluateChildConditionResultsBaseConfig extends ConditionConfig {
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
 * Base Condition for evaluating the results from a list of Conditions, where a rule determines what to
 * do with their results. 
 * 
 * In this Condition, the value of the current input passed into 
 * evaluate(vh) is passed along to child Conditions that do not specify a ValueHost.
 */
export abstract class EvaluateChildConditionResultsBase<TConfig extends EvaluateChildConditionResultsBaseConfig>
    extends ConditionBase<TConfig>
{
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        super.dispose();
        this._conditions?.forEach((cond)=>  toIDisposable(cond)?.dispose());
        (this._conditions as any) = undefined;
    }    
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

    protected conditions(valueHostsManager: IValueHostsManager): Array<ICondition> {
        if (!this._conditions) {
            this._conditions = this.generateConditions(valueHostsManager);
        }
        return this._conditions;
    }
    protected generateConditions(valueHostsManager: IValueHostsManager): Array<ICondition> {
        let conditions: Array<ICondition> = [];
        for (let condConfig of this.config.conditionConfigs) {
            // expect exceptions here for invalid Configs
            let condition = valueHostsManager.services.conditionFactory.create(condConfig);
            conditions.push(condition);
        }
        return conditions;
    }
    private _conditions: Array<ICondition> | null = null;

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

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostsManager: IValueHostsManager): void
    {
        let conditions = this.conditions(valueHostsManager);
        for (let condition of conditions)
            toIGatherValueHostNames(condition)?.gatherValueHostNames(collection, valueHostsManager);
    }        
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Children;
    }
}
