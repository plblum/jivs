/**
 * Framework for evaluating the results from a list of conditions, where a rule determines what to
 * do with their results. In this case, the value of the current input field/element passed into 
 * Evaluate(vh) is ignored. All child conditions must specify their ValueHost sources explicitly.
 * @module Conditions/EvaluateChildConditionResultsBase
 */

import { ValueHostId } from "../DataTypes/BasicTypes";
import { IConditionDescriptor, ConditionEvaluateResult, ICondition, ConditionCategory } from "../Interfaces/Conditions";
import { IValueHost, ToIGatherValueHostIds } from "../Interfaces/ValueHost";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { ConditionBase } from "./ConditionBase";

/**
 * Descriptor for all implementations of EvaluateChildConditionResultsBase.
 */
export interface IEvaluateChildConditionResultsDescriptor extends IConditionDescriptor {
    /**
     * Conditions for this condition to evaluate and apply its rules based on those results.
     * When left empty, the condition evaluates as Undetermined.
     */
    ConditionDescriptors: Array<IConditionDescriptor>;

    /**
     * When a child condition evaluates as Undetermined, this indicates how to handle it.
     * Defaults to Undetermined.
     */
    TreatUndeterminedAs?: ConditionEvaluateResult;
}

/**
 * Framework for evaluating the results from a list of conditions, where a rule determines what to
 * do with their results. In this case, the value of the current input field/element passed into 
 * Evaluate(vh) is ignored. All child conditions must specify their ValueHost sources explicitly.
 */
export abstract class EvaluateChildConditionResultsBase<TDescriptor extends IEvaluateChildConditionResultsDescriptor>
    extends ConditionBase<TDescriptor>
{
    public Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        let conditions = this.Conditions(valueHostResolver);
        if (conditions.length === 0)
            return ConditionEvaluateResult.Undetermined;
        return this.EvaluateChildren(conditions, valueHostResolver);
    }

    protected Conditions(valueHostResolver: IValueHostResolver): Array<ICondition> {
        if (!this._conditions) {
            this._conditions = this.GenerateConditions(valueHostResolver);
        }
        return this._conditions;
    }
    protected GenerateConditions(valueHostResolver: IValueHostResolver): Array<ICondition> {
        let conditions: Array<ICondition> = [];
        for (let condDescriptor of this.Descriptor.ConditionDescriptors) {
            // expect exceptions here for invalid Descriptors
            let condition = valueHostResolver.Services.ConditionFactory.Create(condDescriptor);
            conditions.push(condition);
        }
        return conditions;
    }
    private _conditions: Array<ICondition> | null = null;

    protected abstract EvaluateChildren(conditions: Array<ICondition>, valueHostResolver: IValueHostResolver): ConditionEvaluateResult;

    /**
     * Utility for EvaluateChildren to apply the Descriptor.TreatUndeterminedAs
     * @param childResult 
     * @returns 
     */
    protected CleanupChildResult(childResult: ConditionEvaluateResult): ConditionEvaluateResult {
        if (childResult === ConditionEvaluateResult.Undetermined)
            return this.Descriptor.TreatUndeterminedAs ?? ConditionEvaluateResult.Undetermined;
        return childResult;
    }

    public GatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        let conditions = this.Conditions(valueHostResolver);
        for (let condition of conditions)
            ToIGatherValueHostIds(condition)?.GatherValueHostIds?.(collection, valueHostResolver);
    }        
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Children;
    }
}
