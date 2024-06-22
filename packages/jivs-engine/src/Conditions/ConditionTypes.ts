/** 
 * @module Conditions/Types
 */

/**
 * Identifies values for the ConditionConfig.conditionType property and anywhere with
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
     * Associated with NotCondition class.
     */
    Not = 'Not',
    /**
     * Associated with the WhenCondition class.
     */
    When = 'When',

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
     * Associated with EqualToValueCondition class.
     */
    EqualToValue = 'EqualToValue',

    /**
     * Associated with NotEqualToValueCondition class.
     */
    NotEqualToValue = 'NotEqualToValue',

    /**
     * Associated with GreaterThanValueCondition class.
     */
    GreaterThanValue = 'GreaterThanValue',

    /**
     * Associated with LessThanValueCondition class.
     */
    LessThanValue = 'LessThanValue',

    /**
     * Associated with GreaterThanOrEqualValueCondition class.
     */
    GreaterThanOrEqualValue = 'GreaterThanOrEqualValue',

    /**
     * Associated with LessThanOrEqualValueCondition class.
     */
    LessThanOrEqualValue = 'LessThanOrEqualValue',

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
     * Associated with NotNullCondition class.
     */
    NotNull = 'NotNull',

    /**
     * Associated with PositiveCondition class.
     */
    Positive = 'Positive',
    /**
     * Associated with IntegerCondition class.
     */
    Integer = 'Integer',
    /**
     * Associated with MaxDecimalsCondition class.
     */
    MaxDecimals = 'MaxDecimals',

    /**
     * Returned when ConditionType is not supplied
     */
    Unknown = 'UNKNOWN'
}