
/**
 * @inheritDoc Conditions/ConcreteConditions/NotCondition!NotCondition:class
 * @module Conditions/ConcreteConditions/NotCondition
 */

import { ConditionEvaluateResult } from "../Interfaces/Conditions";
import { IValueHost } from "../Interfaces/ValueHost";
import { IValueHostsManager } from "../Interfaces/ValueHostsManager";
import { ConditionType } from "./ConditionTypes";
import { ConditionWithOneChildBaseConfig, ConditionWithOneChildBase } from "./ConditionWithOneChildBase";

/**
 * ConditionConfig for {@link NotCondition}
 */
export interface NotConditionConfig extends ConditionWithOneChildBaseConfig
{
}

/**
 * Negates the result of a single child condition. Does nothing if the child condition
 * results in Undetermined. Does not support Promises at this time.
 */
export class NotCondition extends ConditionWithOneChildBase<NotConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.Not; }

    /**
     * Evaluates the child condition and returns the opposite result, unless the child condition returns Undetermined.
     * @param valueHost 
     * @param valueHostsManager 
     * @returns 
     */
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        let condition = this.condition(valueHostsManager);
        let result = condition.evaluate(valueHost, valueHostsManager);
        this.ensureNoPromise(result);
        switch (result) {
            case ConditionEvaluateResult.Match:
                return ConditionEvaluateResult.NoMatch;
            case ConditionEvaluateResult.NoMatch:
                return ConditionEvaluateResult.Match;
            default:
                return ConditionEvaluateResult.Undetermined;
        }
    }

}