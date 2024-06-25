/**
 * Various classes, types and functions to support Validation.
 * @module Utilities
 */

import { WhenConditionConfig } from "../Conditions/WhenCondition";
import { ConditionType } from "../Conditions/ConditionTypes";
import { ValidatorConfig } from "../Interfaces/Validator";

/**
 * When using an ValidatorConfig object, its errorCode property
 * may not be defined, but it still has an errorCode through
 * the Condition's ConditionType.
 * Use this function to get the expected error code.
 * @param ivConfig 
 * @returns 
 */
export function resolveErrorCode(ivConfig: ValidatorConfig): string
{
    if (ivConfig.errorCode)
        return ivConfig.errorCode;
    if (ivConfig.conditionConfig)
    {
        let ct = ivConfig.conditionConfig.conditionType;
        if (ct === ConditionType.When)
        {
            let whenConfig = ivConfig.conditionConfig as WhenConditionConfig;
            ct = whenConfig.childConditionConfig?.conditionType;
        }
        if (ct)
            return ct
    }
    return ConditionType.Unknown;
}