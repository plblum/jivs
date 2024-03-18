/** 
 * Identifies values for the ConditionDescriptor.Type property and anywhere with
 * the name "ConditionType".
 * @module Conditions/ConditionTypes
 */

/**
 * Identifies values for the ConditionDescriptor.Type property and anywhere with
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
     * Associated with RequiredTextCondition class.
     */
    RequiredText = 'RequiredText',

    /**
     * Associated with RequiredIndexCondition class.
     */
    RequiredIndex = 'RequiredIndex',

    /**
     * Associated with RegExpCondition class.
     */
    RegExp = 'RegExp',

    /**
     * Associated with RangeCondition class.
     */
    Range = 'Range',

    /**
     * Associated with ValuesEqualCondition class.
     */
    ValuesEqual = 'ValuesEqual',

    /**
     * Associated with ValuesNotEqualCondition class.
     */
    ValuesNotEqual = 'ValuesNotEqual',

    /**
     * Associated with ValueGTSecondValueCondition class.
     */
    ValueGTSecondValue = 'ValueGreaterThanSecondValue',

    /**
     * Associated with ValueLTSecondValueCondition class.
     */
    ValueLTSecondValue = 'ValueLessThanSecondValue',

    /**
     * Associated with ValueGTESecondValueCondition class.
     */
    ValueGTESecondValue = 'ValueGreaterThanOrEqualSecondValue',

    /**
     * Associated with ValueLTESecondValueCondition class.
     */
    ValueLTESecondValue = 'ValueLessThanOrEqualSecondValue',

    /**
     * Associated with StringLengthCondition class.
     */
    StringLength = 'StringLength',

    /**
     * Associated with AndConditions class.
     */
    And = 'And',

    /**
     * Associated with AndConditions class. Just a synonym to 'and'
     */
    Every = 'All',

    /**
     * Associated with OrConditions class.
     */
    Or = 'Or',

    /**
     * Associated with OrConditions class. Just a synonym to 'or'
     */
    Any = 'Any', 
    
    /**
     * Associated with CountMatchingConditions class.
     */
    CountMatches = "CountMatches",
}