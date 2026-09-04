# ICondition Interface
All Condition classes implement the `ICondition interface`.
```ts
interface ICondition {
    conditionType: string;
    evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
    category: ConditionCategory;
}
```
As you can see, all require that you supply a **conditionType** value. That’s a unique name for you to specify.
- `conditionType` contains a name that uniquely identifies your condition class within our `ConditionsFactory` and with error messages in the `TextLocalizerService`.
    - All built in `Conditions` have their names declared in the type `ConditionType`, such as `ConditionType.RequireText` and `ConditionType.EqualTo`.
    - A `Validator` has an errorCode property which formally is used for looking up error messages in `TextLocalizerService`. When you don't assign it, it defaults to the `conditionType` property value.
- `evaluate()` entirely handles the validation rule, and returns one of these:
    - `Match` – Data conformed to the rule
    - `NoMatch` – Data violated the rule
    - `Undetermined` – Data wasn’t appropriate for evaluation. Example: an empty textbox’s value isn’t ready for a “Compare the input’s date value to Today”. There needs to be text representing a date first.
- category provides guidance to some of Jivs validation systems. It has these values:
    - `Require` - Use on any condition representing the requires-a-value rule. When used, Jivs knows to set the `FieldValueHost.isRequired` flag, allowing your UI to activate a Required Indicator.
    - `DataTypeCheck` - Use on any condition that confirms the value is valid for the data type. Jivs runs this validator before all others except Required and will stop further evaluation if the evaluation is `NoMatch`.
        Often a string type requires a strong pattern to match to the data type. For example, an email address. As a result, often RegExpCondition is used as a DataTypeCheck, and we suggest assigning its Category configuration to this when appropriate.
    - `Comparison` - Compares the value to another. Includes:
        - EqualTo, NotEqualTo, GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual
        - Range
        - StringLength
    - `Contents` - For string data that is expected to have specific contents, but isn't required to conform 
    to the data type. For example, a postal code has a general pattern that fits better as a DataTypeCheck. But if you have a specific subset of those postal codes, you might use a regular expression and its category
    would be Contents. By setting up both, you can have different error messages. "That is not a valid postal code" vs "We only ship to [location names]."
    - `Children` - Evaluating results of child Conditions. `AllMatchesCondition`, `AnyMatchesCondition`, and `CountMatchesCondition` all use this category.
    - `Undetermined` - For anything else.
    
API Reference: [ICondition interface](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Conditions_Type.ICondition.html)

---
Go to [Conditions Home](./Home.md)

Go to [API Home](../Home.md)