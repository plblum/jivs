/** 
 * Identifies values for the ConditionConfig.type property and anywhere with
 * the name "ConditionType".
 * @module Conditions/Types/ConditionType
 */

/**
 * Identifies values for the ConditionConfig.type property and anywhere with
 * the name "ConditionType".
 * These identify the Concrete Condition classes supplied within Jivs.
 * The enum type ConditionType will host all of these values. So the user can
 * always type "ConditionType." and get intellisense with known ConditionTypes.
 * In addition, TypeScript's type merging feature lets an app declare its own
 * enum ConditionType with other entries and they will be consolidated into one enum.
 */
export enum ConditionType
{
    /**
     * Associated with DataTypeCheckCondition class.
     */
    DataTypeCheck = 'DataTypeCheck',

    /**
     * Associated with RequireTextCondition class.
     */
    RequireText = 'RequireText',

    /**
     * Associated with RegExpCondition class.
     */
    RegExp = 'RegExp',

    /**
     * Associated with RangeCondition class.
     */
    Range = 'Range',

    /**
     * Associated with EqualToCondition class.
     */
    EqualTo = 'EqualTo',

    /**
     * Associated with NotEqualToCondition class.
     */
    NotEqualTo = 'NotEqualTo',

    /**
     * Associated with GreaterThanCondition class.
     */
    GreaterThan = 'GreaterThan',

    /**
     * Associated with LessThanCondition class.
     */
    LessThan = 'LessThan',

    /**
     * Associated with GreaterThanOrEqualCondition class.
     */
    GreaterThanOrEqual = 'GreaterThanOrEqual',

    /**
     * Associated with LessThanOrEqualCondition class.
     */
    LessThanOrEqual = 'LessThanOrEqual',

    /**
     * Associated with StringLengthCondition class.
     */
    StringLength = 'StringLength',


    /**
     * Associated with AllMatchCondition class.
     */
    All = 'All',

    /**
     * Associated with AllMatchCondition class. Alias to 'All'
     */
    And = 'And',

    /**
     * Associated with AnyMatchCondition class.
     */
    Any = 'Any', 

    /**
     * Associated with AnyMatchCondition class. Always to 'Any'
     */
    Or = 'Or',
    
    /**
     * Associated with CountMatchesCondition class.
     */
    CountMatches = 'CountMatches',

    /**
     * Associated with StringNotEmptyCondition class.
     */
    StringNotEmpty = 'StringNotEmpty',

    /**
     * Associated with NotNullCondition class.
     */
    NotNull = 'NotNull'
}