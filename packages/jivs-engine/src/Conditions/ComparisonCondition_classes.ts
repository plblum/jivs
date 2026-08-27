/**
 * Group of conditions that compare the ValueHost against another value,
 * either against another ValueHost or against a fixed value.
 * 
 * - equalTo
 * - notEqualTo
 * - greaterThan
 * - lessThan
 * - greaterThanOrEqual
 * - lessThanOrEqual
 * 
 * The second value can come from a ValueHost by supplying
 * the ResolveValueHost class to specify the second ValueHost.
 * All other values are treated as the actual value.
 * 
 * ResolveValueHost has a supporting function, valueHost(valueHostName),
 * that creates it so that its easy to write this syntax in the builder:
 * ```ts
 * builder.field('field1', LookupKey.String).equalTo(valueHost('myValueHostName'))
 * instead of
 * builder.field('field1', LookupKey.String).equalTo(new ResolveValueHost('myValueHostName'))
 * ```
 * This makes the builder syntax cleaner and easier to read.
 * 
 * @module jivs-engine/Conditions/ConcreteConditions
 */

import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { CompareToValueConditionBase, CompareToValueConditionBaseConfig } from './CompareToValueConditionBase';
import { ConditionType } from './ConditionTypes';

/**
 * ConditionConfig for {@link EqualToCondition}
 */
export interface EqualToConditionConfig extends CompareToValueConditionBaseConfig { }
/**
 * Value from ValueHost must be equal to a second value, assigned in its ConditionConfig.secondValue.
 */
export class EqualToCondition extends CompareToValueConditionBase<EqualToConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.EqualTo; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        return comparison === ComparersResult.Equal ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}

/**
 * ConditionConfig for {@link NotEqualToCondition}
 */
export interface NotEqualToConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must not be equal to a second value, assigned in its ConditionConfig.secondValue.
 */
export class NotEqualToCondition extends CompareToValueConditionBase<NotEqualToConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.NotEqualTo; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {

        return comparison !== ComparersResult.Equal ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}


/**
 * ConditionConfig for {@link GreaterThanCondition}
 */
export interface GreaterThanConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be greater than a second value, assigned in its ConditionConfig.secondValue.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class GreaterThanCondition extends CompareToValueConditionBase<GreaterThanConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.GreaterThan; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        switch (comparison) {
            case ComparersResult.GreaterThan:
                return ConditionEvaluateResult.Match;
            case ComparersResult.NotEqual:
                return ConditionEvaluateResult.Undetermined;
            default:
                return ConditionEvaluateResult.NoMatch;
        }
    }
}

/**
 * ConditionConfig for {@link LessThanValueCondition}
 */
export interface LessThanValueConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be less than a second value, assigned in its ConditionConfig.secondValue.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class LessThanValueCondition extends CompareToValueConditionBase<LessThanValueConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThanValue; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        switch (comparison) {
            case ComparersResult.LessThan:
                return ConditionEvaluateResult.Match;
            case ComparersResult.NotEqual:
                return ConditionEvaluateResult.Undetermined;
            default:
                return ConditionEvaluateResult.NoMatch;
        }
    }
}

/**
 * ConditionConfig for {@link GreaterThanOrEqualCondition}
 */
export interface GreaterThanOrEqualConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be greater than or equal to a second value, assigned in its ConditionConfig.secondValue.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class GreaterThanOrEqualCondition extends CompareToValueConditionBase<GreaterThanOrEqualConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.GreaterThanOrEqual; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        switch (comparison) {
            case ComparersResult.GreaterThan:
            case ComparersResult.Equal:
                return ConditionEvaluateResult.Match;
            case ComparersResult.NotEqual:
                return ConditionEvaluateResult.Undetermined;
            default:
                return ConditionEvaluateResult.NoMatch;
        }
    }
}


/**
 * ConditionConfig for {@link LessThanOrEqualValueCondition}
 */
export interface LessThanOrEqualValueConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be less than or equal to a second value, assigned in its ConditionConfig.secondValue.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class LessThanOrEqualValueCondition extends CompareToValueConditionBase<LessThanOrEqualValueConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThanOrEqualValue; }    

    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        switch (comparison) {
            case ComparersResult.LessThan:
            case ComparersResult.Equal:
                return ConditionEvaluateResult.Match;
            case ComparersResult.NotEqual:
                return ConditionEvaluateResult.Undetermined;
            default:
                return ConditionEvaluateResult.NoMatch;
        }
    }
}
