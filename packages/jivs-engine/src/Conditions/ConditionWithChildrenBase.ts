/**
 * Base Condition for evaluating the results from a list of Conditions, where a rule determines what to
 * do with their results. 
 * 
 * In this Condition, the value of the current input field/element passed into 
 * evaluate(vh) is passed along to child Conditions that do not specify a ValueHost.
 * @module Conditions/AbstractClasses/EvaluateChildConditionResultsBase
 */

import { toIDisposable } from '../Interfaces/General_Purpose';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig, ICondition, ConditionCategory } from '../Interfaces/Conditions';
import { toIGatherValueHostNames } from '../Interfaces/ValueHost';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ConditionBase } from './ConditionBase';

/**
 * ConditionConfig for EvaluateChildConditionResultsBase and anything else that needs children.
 */
export interface ConditionWithChildrenBaseConfig extends ConditionConfig {
    /**
     * Conditions for this condition to evaluate and apply its rules based on those results.
     */
    conditionConfigs: Array<ConditionConfig>;
}


/**
 * Base Condition for any condition that has child conditions
 */
export abstract class ConditionWithChildrenBase<TConfig extends ConditionWithChildrenBaseConfig>
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
        this._conditions?.forEach((cond)=> toIDisposable(cond)?.dispose());
        this._conditions = undefined!;
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
            let condition = this.generateCondition(condConfig, valueHostsManager.services);
            conditions.push(condition);
        }
        return conditions;
    }
    private _conditions: Array<ICondition> | null = null;

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
