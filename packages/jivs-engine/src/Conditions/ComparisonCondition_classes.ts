/**
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
 * Value from ValueHost must be equal to a second value, assigned in its EqualToConditionConfig.secondValue
 * or EqualToConditionConfig.secondValueHostName.
 * 
 * There are two sources for the value within EqualToConditionConfig:
 * - secondValue: The actual value to compare against.
 * - secondValueHostName: The name of the ValueHost that provides the second value.
 * Assign only one.
 * 
 * ## When using the builder
 * The first parameter of each comparison condition takes either the secondValue or the secondValueHostName,
 * however wrap the second value in the valueHost() function first.
 * ```ts
 * builder.field('field1', LookupKey.String).equalTo(10);
 * builder.field('field1', LookupKey.String).equalTo(valueHost('field2'))
 * builder.field('field1', LookupKey.String).eq(10);
 * builder.field('field1', LookupKey.String).eq(valueHost('field2'))
 * ```
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
 * Value from ValueHost must not be equal to a second value, assigned in its NotEqualToConditionConfig.secondValue.
 * or NotEqualToConditionConfig.secondValueHostName.
 * 
 * There are two sources for the value within NotEqualToConditionConfig:
 * - secondValue: The actual value to compare against.
 * - secondValueHostName: The name of the ValueHost that provides the second value.
 * Assign only one.
 * 
 * ## When using the builder
 * The first parameter of each comparison condition takes either the secondValue or the secondValueHostName,
 * however wrap the second value in the valueHost() function first.
 * ```ts
 * builder.field('field1', LookupKey.String).notEqualTo(10);
 * builder.field('field1', LookupKey.String).notEqualTo(valueHost('field2'))
 * builder.field('field1', LookupKey.String).neq(10);
 * builder.field('field1', LookupKey.String).neq(valueHost('field2'))
 * ```
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
 * Value from ValueHost must be greater than a second value, assigned in its GreaterThanConditionConfig.secondValue
 * or GreaterThanConditionConfig.secondValueHostName.
 * 
 * There are two sources for the value within GreaterThanConditionConfig:
 * - secondValue: The actual value to compare against.
 * - secondValueHostName: The name of the ValueHost that provides the second value.
 * Assign only one.
 * 
 * ## When using the builder
 * The first parameter of each comparison condition takes either the secondValue or the secondValueHostName,
 * however wrap the second value in the valueHost() function first.
 * ```ts
 * builder.field('field1', LookupKey.String).greaterThan(10);
 * builder.field('field1', LookupKey.String).greaterThan(valueHost('field2'))
 * builder.field('field1', LookupKey.String).gt(10);
 * builder.field('field1', LookupKey.String).gt(valueHost('field2'))
 * ```
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
 * ConditionConfig for {@link LessThanCondition}
 */
export interface LessThanConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be less than a second value, assigned in its LessThanConditionConfig.secondValue
 * or LessThanConditionConfig.secondValueHostName.
 * 
 * There are two sources for the value within LessThanConditionConfig:
 * - secondValue: The actual value to compare against.
 * - secondValueHostName: The name of the ValueHost that provides the second value.
 * Assign only one.
 * 
 * ## When using the builder
 * The first parameter of each comparison condition takes either the secondValue or the secondValueHostName,
 * however wrap the second value in the valueHost() function first.
 * ```ts
 * builder.field('field1', LookupKey.String).lessThan(10);
 * builder.field('field1', LookupKey.String).lessThan(valueHost('field2'))
 * builder.field('field1', LookupKey.String).lt(10);
 * builder.field('field1', LookupKey.String).lt(valueHost('field2'))
 * ```
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class LessThanCondition extends CompareToValueConditionBase<LessThanConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThan; }
    
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
 * Value from ValueHost must be greater than or equal to a second value, assigned in its GreaterThanOrEqualConditionConfig.secondValue
 * or GreaterThanOrEqualConditionConfig.secondValueHostName.
 * 
 * There are two sources for the value within GreaterThanOrEqualConditionConfig:
 * - secondValue: The actual value to compare against.
 * - secondValueHostName: The name of the ValueHost that provides the second value.
 * Assign only one.
 * 
 * ## When using the builder
 * The first parameter of each comparison condition takes either the secondValue or the secondValueHostName,
 * however wrap the second value in the valueHost() function first.
 * ```ts
 * builder.field('field1', LookupKey.String).greaterThanOrEqual(10);
 * builder.field('field1', LookupKey.String).greaterThanOrEqual(valueHost('field2'))
 * builder.field('field1', LookupKey.String).gte(10);
 * builder.field('field1', LookupKey.String).gte(valueHost('field2'))
 * ```
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
 * ConditionConfig for {@link LessThanOrEqualCondition}
 */
export interface LessThanOrEqualConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be less than or equal to a second value, assigned in its LessThanOrEqualConditionConfig.secondValue
 * or LessThanOrEqualConditionConfig.secondValueHostName.
 * 
 * There are two sources for the value within LessThanOrEqualConditionConfig:
 * - secondValue: The actual value to compare against.
 * - secondValueHostName: The name of the ValueHost that provides the second value.
 * Assign only one.
 * 
 * ## When using the builder
 * The first parameter of each comparison condition takes either the secondValue or the secondValueHostName,
 * however wrap the second value in the valueHost() function first.
 * ```ts
 * builder.field('field1', LookupKey.String).lessThanOrEqual(10);
 * builder.field('field1', LookupKey.String).lessThanOrEqual(valueHost('field2'))
 * builder.field('field1', LookupKey.String).lte(10);
 * builder.field('field1', LookupKey.String).lte(valueHost('field2'))
 * ```
 *  
 * Evaluates data types that do not support GreaterThanOrEqual/LessThanOrEqual as Undetermined
 */
export class LessThanOrEqualCondition extends CompareToValueConditionBase<LessThanOrEqualConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThanOrEqual; }    

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
