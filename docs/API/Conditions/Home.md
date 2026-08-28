# Conditions
The `Condition` is the rule that evaluates the data, providing one of these answers: Match, NoMatch, Undetermined. It is used in several ways:
- Within the `Validator object`. The `Validator object` itself is a single class, and gets wired up to the right `Condition` to make it handle that rule.
- To enable a `ValueHost`. It is assigned to `ValueHostConfig.enablerConfig`.
- As a component of these conditions:
    - `WhenCondition`
    - `NotCondition`
    - `AllMatchCondition`
    - `AnyMatchCondition`
    - `CountMatchesCondition`

Here are the Conditions included with Jivs:
- [RequireText](./Conditions_Included_with_Jivs.md#requiretext)
- [NotNull](./Conditions_Included_with_Jivs.md#notnull)
- [RegExp](./Conditions_Included_with_Jivs.md#regexp)
- [Range](./Conditions_Included_with_Jivs.md#range)
- [EqualTo](./Conditions_Included_with_Jivs.md#comparing-two-values)
- [NotEqualTo](./Conditions_Included_with_Jivs.md#comparing-two-values)
- [LessThan](./Conditions_Included_with_Jivs.md#comparing-two-values)
- [LessThanOrEqualTo](./Conditions_Included_with_Jivs.md#comparing-two-values)
- [GreaterThan](./Conditions_Included_with_Jivs.md#comparing-two-values)
- [GreaterThanOrEqualTo](./Conditions_Included_with_Jivs.md#comparing-two-values)
- [StringLength](./Conditions_Included_with_Jivs.md#stringlength)
- [DataTypeCheck](./Conditions_Included_with_Jivs.md#datatypecheck)
- [Positive](./Conditions_Included_with_Jivs.md#positive)
- [Integer](./Conditions_Included_with_Jivs.md#integer)
- [MaxDecimals](./Conditions_Included_with_Jivs.md#maxdecimals)
- [All](./Conditions_Included_with_Jivs.md#all-any-and-countmatches-conditions)
- [Any](./Conditions_Included_with_Jivs.md#all-any-and-countmatches-conditions)
- [CountMatches](./Conditions_Included_with_Jivs.md#all-any-and-countmatches-conditions)
- [When](./Conditions_Included_with_Jivs.md#when-using-one-condition-to-enable-another)
- [Not](./Conditions_Included_with_Jivs.md#not-negate-the-result)
- [CustomRule](#custom-rule-you-create-the-condition-on-demand)

Additional topics:
- [Creating your own condition](./Creating_Your_Own.md)
- [Creating on-off conditions](./Custom_Rule.md)
- [Understanding Conditions within Validators](./Understanding_Conditions_within_Validators.md)
- [ICondition interface](./ICondition_Interface.md)
