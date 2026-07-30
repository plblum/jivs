/**
 * Base Condition for evaluating the results from a list of Conditions, where a rule determines what to
 * do with their results. 
 * 
 * @module jivs-engine/Conditions/AbstractClasses/ConditionWithChildrenBase
 */

import { toIDisposable } from '../Interfaces/General_Purpose';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig, ICondition, ConditionCategory } from '../Interfaces/Conditions';
import { toIGatherValueHostNames } from '../Interfaces/ValueHost';
import { IValidationManager } from '../Interfaces/ValidationManager';
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

    protected conditions(validationManager: IValidationManager): Array<ICondition> {
        if (!this._conditions) {
            this._conditions = this.generateConditions(validationManager);
        }
        return this._conditions;
    }
    protected generateConditions(validationManager: IValidationManager): Array<ICondition> {
        const conditions: Array<ICondition> = [];
        for (const condConfig of this.config.conditionConfigs) {
            const condition = this.generateCondition(condConfig, validationManager.services);
            conditions.push(condition);
        }
        return conditions;
    }
    private _conditions: Array<ICondition> | null = null;

    public gatherValueHostNames(collection: Set<ValueHostName>, validationManager: IValidationManager): void
    {
        const conditions = this.conditions(validationManager);
        for (const condition of conditions)
            toIGatherValueHostNames(condition)?.gatherValueHostNames(collection, validationManager);
    }        
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Children;
    }
}
