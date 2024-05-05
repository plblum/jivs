/**
 * Various classes, types and functions to support Validation.
 * @module Utilities
 */

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
    return ivConfig.errorCode ?? ivConfig.conditionConfig?.conditionType ?? ConditionType.Unknown;
}