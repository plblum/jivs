# Conditions supplied with Jivs
See [Jivs API](./Jivs_API.md/#Conditions) for an overview.

_Index_
- [RequireText](#requiretext)
- [NotNull](#notnull)
- [RegExp](#regexp)
- [Range](#range)
- [EqualToValue](#comparing-two-values-where-second-value-is-specified)
- [NotEqualToValue](#comparing-two-values-where-second-value-is-specified)
- [LessThanValue](#comparing-two-values-where-second-value-is-specified)
- [LessThanOrEqualToValue](#comparing-two-values-where-second-value-is-specified)
- [GreaterThanValue](#comparing-two-values-where-second-value-is-specified)
- [GreaterThanOrEqualToValue](#comparing-two-values-where-second-value-is-specified)
- [EqualTo](#comparing-two-values-where-the-second-value-comes-from-another-field)
- [NotEqualTo](#comparing-two-values-where-the-second-value-comes-from-another-field)
- [LessThan](#comparing-two-values-where-the-second-value-comes-from-another-field)
- [LessThanOrEqualTo](#comparing-two-values-where-the-second-value-comes-from-another-field)
- [GreaterThan](#comparing-two-values-where-the-second-value-comes-from-another-field)
- [GreaterThanOrEqualTo](#comparing-two-values-where-the-second-value-comes-from-another-field)
- [StringLength](#stringlength)
- [DataTypeCheck](#datatypecheck)
- [Positive](#positive)
- [Integer](#integer)
- [MaxDecimals](#maxdecimals)
- [All](#all-any-countmatches)
- [Any](#all-any-countmatches)
- [CountMatches](#all-any-countmatches)
- [When](#when---using-one-condition-to-enable-another)
- [Not](#not---negate-the-result)

## RequireText
Use when the value is a string. Reports an error when the string is empty or null.
This validator will also run when validating with `validateOptions.duringEdit = true`.
```ts
requireText(errorMessage?, summaryMessage?);
requireText({ // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
        // condition properties:
        trim?: boolean; 
        nullValueResult?: ConditionEvaluateResult; 
    });
```
Error message tokens: `{Label} {Value}`

**Examples**
```ts
builder.field('fieldname').requireText();
builder.field('fieldname').requireText('error message', 'summary message')
builder.field('fieldname').requireText({ 
    errorMessage: 'error message',
    summaryMessage: 'summary message' 
});	
```
Condition class: `RequireTextCondition`

Condition config:
```ts
interface RequireTextConditionConfig = {
    conditionType: ConditionType.RequireText;
    category: ConditionCategory.Require;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
    trim?: boolean; // trims whitespace before validating. Defaults to true
    nullValueResult?: ConditionEvaluateResult;  // Determines how null is evaluated. Defaults to ConditionEvaluateResult.NoMatch
    supportsDuringEdit?: boolean; // When true or undefined, this evaluates when ValidateOption.DuringEdit is true.
}
```
## NotNull
Evaluates the native value to ensure it is not null. This is another type of "required" condition.
The [RequireText](#requiretext) condition also handles null, but targets string native values which also may have
an empty string to report an error.
```ts
notNull(errorMessage?, summaryMessage?);
notNull({ // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
```
Error message tokens: `{Label} {Value}`

**Examples**
```ts
builder.field('fieldname').notNull();
builder.field('fieldname').notNull('error message', 'summary message')
builder.field('fieldname').notNull({ 
    errorMessage: 'error message',
    summaryMessage: 'summary message' 
});	
```
Condition class: `NotNullCondition`

Condition config:
```ts
interface NotNullConditionConfig = {
    conditionType: ConditionType.NotNull;
    category: ConditionCategory.Require;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
}
```
## RegExp
Evaluates the native value, which must be a string, against a regular expression.
This validator will also run when validating with `validateOptions.duringEdit = true`.
```ts
regExp(expression as string, ignoreCase as boolean?, errorMessage?, summaryMessage?);
regExp(expression as RegExp object, errorMessage?, summaryMessage?);
regExp(expression as string, ignoreCase as boolean?, 
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
      // condition properties:
        trim?: boolean; 
        multiline?: boolean; 
        supportsDuringEdit?: boolean;
    });
regExp(expression as RegExp, 
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
      // condition properties:
        trim?: boolean; 
        multiline?: boolean; 
        supportsDuringEdit?: boolean;
    }
);
```
Error message tokens: `{Label} {Value}`

**Examples**
```ts
builder.field('fieldname').regExp('^\\d*$');
builder.field('fieldname').regExp('hello', true);   // ignores case
builder.field('fieldname').regExp('^\\d*$', null, 'error message', 'summary message')
builder.field('fieldname').regExp('^\\d*$', null, 
{ 
    errorMessage: 'error message',
    summaryMessage: 'summary message' 
});	
builder.field('fieldname').regExp(/^\d*$/);
builder.field('fieldname').regExp(/hello/i);   // ignores case
builder.field('fieldname').regExp(/^\d*$/, 'error message', 'summary message')
builder.field('fieldname').regExp(/^\d*$/, 
{ 
    errorMessage: 'error message',
    summaryMessage: 'summary message' 
});	
```
Condition class: `RegExpCondition`

Condition config:
```ts
interface RegExpConditionConfig = {
    conditionType: ConditionType.RegExp;
    category: ConditionCategory.Contents;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
    trim?: boolean; // Removes leading and trailing whitespace before evaluating the string. Defaults to true
    multiline?: boolean;  // Determines how null is evaluated. Defaults to ConditionEvaluateResult.NoMatch
    supportsDuringEdit?: boolean; // When true or undefined, this evaluates when ValidateOption.DuringEdit is true.
}
```
## Range
Compare the native datatype value against two other values to ensure it is with the range established. The minimum and maximum are included in the range.
```ts
range(minimum, maximum, errorMessage?, summaryMessage?);
range(minimum, maximum, 
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
```
Error message tokens: `{Label} {Value} {Minimum} {Maximum}`

**Examples**
```ts
builder.field('fieldname').range(1, 5);
builder.field('fieldname').range(1, 5, 'error message', 'summary message')
builder.field('fieldname').range(1, 5, 
{ 
    errorMessage: 'error message',
    summaryMessage: 'summary message' 
});	
```
Condition class: `RangeCondition`

Condition config:
```ts
interface RangeConditionConfig = {
    conditionType: ConditionType.Comparison;
    category: ConditionCategory.Require;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
    minimum: any,   // greater than or equal to. When undefined/null, no minimum.
    maximum: any    // less than or equal to. When undefined/null, no maximum.
}
```
## Comparing two values where second value is specified
Compare two values. There are many comparison conditions:
- `equalToValue(value)` or `eqValue(value)`
- `notEqualToValue(value)` or `neqValue(value)`
- `lessThanValue(value)` or `ltValue(value)`
- `lessThanOrEqualValue(value)` or `lteValue(value)`
- `greaterThanValue(value)` or `gtValue(value)`
- `greaterThanOrEqualValue(value)` or `gteValue(value)`
```ts
equalToValue(value, errorMessage?, summaryMessage?);
equalToValue(value, 
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
      // condition properties:
        secondConversionLookupKey?: string | null; 
    });
```
Error message tokens: `{Label} {Value} {CompareTo}`

**Examples**
```ts
builder.field('fieldname').equalToValue(1);
builder.field('fieldname').equalToValue(1, 'error message', 'summary message')
builder.field('fieldname').equalToValue(1, 
{ 
    errorMessage: 'error message',
    summaryMessage: 'summary message' 
});	
```
Condition class: `EqualToValueCondition`, `NotEqualToValueCondition`, `LessThanValueCondition`, `LessThanOrEqualValueCondition`, `GreaterThanValueCondition`, `GreaterThanOrEqualValueCondition`.

Condition config:
```ts
interface CompareToValueConditionBaseConfig = {
    conditionType: ConditionType.[EqualToValue, NotEqualToValue, etc];
    category: ConditionCategory.Comparison;
    valueHostName: ValueHostName | null;  // left operand. Use null to inherit the ValueHost.name
    secondValue?: any;  // right operand.
    secondConversionLookupKey?: string | null;   // Data Type Lookup Key that converts secondValue into another type prior to evaluation
}
```
## Comparing two values where the second value comes from another field
Compare two values. There are many comparison conditions:
- `equalTo(valueHostName)` or `eq(valueHostName)`
- `notEqualTo(valueHostName)` or `neq(valueHostName)`
- `lessThan(valueHostName)` or `lt(valueHostName)`
- `lessThanOrEqual(valueHostName)` or `lte(valueHostName)`
- `greaterThan(valueHostName)` or `gt(valueHostName)`
- `greaterThanOrEqual(valueHostName)` or `gte(valueHostName)`
```ts
equalTo(valueHostName, errorMessage?, summaryMessage?);
equalTo(valueHostName, 
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
      // condition properties:
        secondConversionLookupKey?: string | null; 
    });
```
Error message tokens: `{Label} {SecondLabel} {Value} {CompareTo}`

**Examples**
```ts
builder.field('fieldname').equalTo('Fieldname2');
builder.field('fieldname').equalTo('Fieldname2', 'error message', 'summary message')
builder.field('fieldname').equalTo('Fieldname2', 
{ 
    errorMessage: 'error message',
    summaryMessage: 'summary message' 
});	
```
Condition class: `EqualToCondition`, `NotEqualToCondition`, `LessThanCondition`, `LessThanOrEqualCondition`, `GreaterThanCondition`, `GreaterThanOrEqualCondition`.

Condition config:
```ts
interface CompareToSecondValueHostConditionBaseConfig = {
    conditionType: ConditionType.[EqualTo, NotEqualTo, etc];
    category: ConditionCategory.Comparison;
    valueHostName: ValueHostName | null;  // left operand. Use null to inherit the ValueHost.name
    secondValueHostName: string;  // right operand value comes from this valueHost 
    secondConversionLookupKey?: string | null;   // Data Type Lookup Key that converts right operand value into another type prior to evaluation
}
```
## StringLength
Evaluates the length of a string in characters (after trimming if the `trim` property is true).

While its normal to apply a maximum, you can also set a minimum in the validator parameters.

This validator will also run when validating with `validateOptions.duringEdit = true`.
```ts
stringLength(maximum, errorMessage?, summaryMessage?);
stringLength(maximum,
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    // condition properties
        minimum?: number | null;
        trim?: boolean;
    });
len(maximum, errorMessage?, summaryMessage?)
len(maximum, { validator parameters including minimum })
```
Error message tokens: `{Label} {Value} {Maximum} {Minimum} {Length}`

**Examples**
```ts
builder.field('fieldname').stringLength(100);
builder.field('fieldname').len(100);
builder.field('fieldname').stringLength(100, 'error message', 'summary message')
builder.field('fieldname').stringLength(100, 
{ 
    errorMessage: 'error message',
    summaryMessage: 'summary message',
    minimum: 2
});	
```
Condition class: `StringLengthCondition`

Condition config:
```ts
interface StringLengthConditionConfig = {
    conditionType: ConditionType.StringLength;
    category: ConditionCategory.Comparison;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
    minimum?: number | null;   // greater than or equal to. When undefined/null, no minimum.
    maximum?: number | null;   // less than or equal to. When undefined/null, no maximum.
    trim?: boolean; // trims whitespace before validating. Defaults to true
    supportsDuringEdit?: boolean; // When true or undefined, this evaluates when ValidateOption.duringEdit is true.
}
```
## Positive
Evaluates a number to confirm it is 0 or higher.
```ts
positive(errorMessage?, summaryMessage?);
positive({ // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
pos(errorMessage?, summaryMessage?)
pos({ validator parameters })
```
Error message tokens: `{Label} {Value}`

**Examples**
```ts
builder.field('fieldname').positive();
builder.field('fieldname').pos();
builder.field('fieldname').positive('error message', 'summary message')
builder.field('fieldname').positive(
{ 
    errorMessage: 'error message',
    summaryMessage: 'summary message'
});	
```
Condition class: `PositiveCondition`

Condition config:
```ts
interface PositiveConditionConfig = {
    conditionType: ConditionType.Positive;
    category: ConditionCategory.DataTypeCheck;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
}
```
## Integer
Evaluates a number to confirm it is a whole number.
```ts
integer(errorMessage?, summaryMessage?);
integer({ // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
int(errorMessage?, summaryMessage?)
int({ validator parameters })
```
Error message tokens: `{Label} {Value}`

**Examples**
```ts
builder.field('fieldname').integer();
builder.field('fieldname').int();
builder.field('fieldname').integer('error message', 'summary message')
builder.field('fieldname').integer(
{ 
  errorMessage: 'error message',
  summaryMessage: 'summary message'
});	
```
Condition class: `IntegerCondition`

Condition config:
```ts
interface IntegerConditionConfig = {
    conditionType: ConditionType.Integer;
    category: ConditionCategory.DataTypeCheck;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
}
```
## MaxDecimals
Evaluates a number to confirm it does not exceed the specified number of decimal digits.
```ts
maxDecimals(maxDecimals, errorMessage?, summaryMessage?);
maxDecimals(maxDecimals, { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
```
Error message tokens: `{Label} {Value}`

**Examples**
```ts
builder.field('fieldname').maxDecimals(2);
builder.field('fieldname').maxDecimals(2, 'error message', 'summary message')
builder.field('fieldname').maxDecimals(2, 
{ 
    errorMessage: 'error message',
    summaryMessage: 'summary message'
});	
```
Condition class: `MaxDecimalsCondition`

Condition config:
```ts
interface MaxDecimalsConditionConfig = {
    conditionType: ConditionType.MaxDecimals;
    category: ConditionCategory.DataTypeCheck;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
    maxDecimals: number;    // Maximum number of decimal places allowed.
}
```
## DataTypeCheck
Added automatically for most data types that require conversion/parsing from a string
into another data type or a well formatted string.
```ts
dataTypeCheck(errorMessage?, summaryMessage?);
dataTypeCheck({ // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
```
Error message tokens: `{Label} {Value}`

**Examples**
```ts
builder.field('fieldname').dataTypeCheck();
builder.field('fieldname').dataTypeCheck('error message', 'summary message')
builder.field('fieldname').dataTypeCheck({ 
    errorMessage: 'error message',
    summaryMessage: 'summary message' 
});	
```
Condition class: `DataTypeCheckCondition`

Condition config:
```ts
interface DataTypeCheckConditionConfig = {
    conditionType: ConditionType.RequireText;
    category: ConditionCategory.DataTypeCheck;
    valueHostName: ValueHostName | null;  // use null to inherit the ValueHost.name
}
```
### Conditions: Combining others with all, any, and countMatches
Complex logic is often the result of using boolean expressions against existing conditions. These three conditions can evaluate two or more conditions together to determine a single result. 
- `all()` - the `AllMatchesCondition` requires that all child conditions evaluate as a match to be considered valid. Think of this as an "AND" operator.
- `any()` - the `AnyMatchesCondition` requires that at least one child condition evaluates as a match to be considered valid.
- `countMatches()` - the `CountMatchesCondition` sets a minimum and/or maximum number of children that evaluate as a match to be considered valid.

You might also use these to bury several conditions under a single error message.

#### Requirements for children of all, any, and countMatches
Let's focus on the structure of setting up children using all() as an example:
```ts
builder.field('fieldname').all((childBuilder)=>{
    childBuilder.parentValue().requireText();
    childBuilder.fieldValue('fieldname2').requireText(parameters);
    childBuilder.fieldValue('fieldname2').regExp('^[A-D]');
    childBuilder.fieldValue('fieldname3').equalTo('fieldname4');
    childBuilder.any((grandchildBuilder)=> {
        grandchildBuilder.fieldValue('fieldname10').requireText();
        grandchildBuilder.fieldValue('fieldname11').requireText();
    })
});
```
`childBuilder` is a builder designed for children. It has only these functions:
- `parentValue()` - Starts building a condition that will use the same valueHostName as the parent. In the above example, the condition will use `valueHostName='fieldname'`.
- `fieldValue(valueHostName)` - Starts building a condition that uses the `valueHostName` supplied for the condition that follows.
- `all()`, `any()`, `countMatches()` - You can nest these same tools as a child and build a tree of logic.
- `when()` employs the `WhenCondition` to selectively enable a single child condition.
- `not()` employs the `NotCondition` to invert the result of the child's evaluation. Match->NoMatch or NoMatch->Match.

#### Conditions: All, Any, CountMatches
```ts
all(childBuilderHandler);
all(childBuilderHandler,
    errorMessage?, summaryMessage?);
all(childBuilderHandler,
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    // condition properties:
        treatUndeterminedAs?: ConditionEvaluateResult;
    });
```
Error message tokens: `{Label}`

**Examples**
```ts
builder.field('fieldname').all((childBuilder) => {
    childBuilder.parentValue().requireText();
    childBuilder.fieldValue('fieldname2').requireText();
    childBuilder.fieldValue('fieldname3').requireText();
});
builder.field('fieldname').any((childBuilder) => {
        childBuilder.parentValue().requireText();
        childBuilder.fieldValue('fieldname2').requireText();
        childBuilder.fieldValue('fieldname3').requireText();
    },
    'error message', 'summary message')
builder.field('fieldname').countMatches(1, 2, (childBuilder) => {
        childBuilder.parentValue().requireText();
        childBuilder.fieldValue('fieldname2').requireText();
        childBuilder.fieldValue('fieldname3').requireText();
    },
    { 
        errorMessage: 'error message',
        summaryMessage: 'summary message',
        errorCode: 'AllRequired' // user override optional
    });	
```
Condition class: `AllMatchCondition`, `AnyMatchCondition`, `CountMatchesCondition`.

Condition config:
```ts
interface EvaluateChildConditionResultsBaseConfig = {
    conditionType: ConditionType.[All, Any, CountMatches];
    category: ConditionCategory.Children;
    treatUndeterminedAs?: ConditionEvaluateResult; // When a child condition evaluates as Undetermined, this indicates how to handle it.Defaults to Undetermined.
}
```
## When - using one condition to enable another
When you have a condition that shouldn't be evaluated until another condition is met, use the WhenCondition. Think of this as "when"->"then" logic.

Suppose that you have a textbox and a nearby checkbox that is used to enable/disable the textbox. Since a disabled textbox should not be validated, we use the When condition.
```ts
builder.field('fieldname').when(
    (whenToEnableBuilder) => 
        whenToEnableBuilder.fieldValue('checkbox1').equals(true),
    (thenBuilder) =>
        thenBuilder.parentValue().requireText()
)
```
`whenToEnableBuilder` and `thenBuilder` are builders designed to add a single child. They have these functions:
- `parentValue()` - Starts building a condition that will use the same valueHostName as the parent. In the above example, the condition will use `valueHostName='fieldname'`.
- `fieldValue(valueHostName)` - Starts building a condition that uses the `valueHostName` supplied for the condition that follows.
- `all()`, `any()`, `countMatches()` - You can nest these same tools as a child and build a tree of logic.
- `when()` employs the `WhenCondition` to selectively enable a single child condition.
- `not()` employs the `NotCondition` to invert the result of the child's evaluation. Match->NoMatch or NoMatch->Match.
```ts
when(whenToEnableBuilderHandler, thenBuilderHandler);
when(whenToEnableBuilderHandler, thenBuilderHandler,
    errorMessage?, summaryMessage?);
when(whenToEnableBuilderHandler, thenBuilderHandler,
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
```
Error message tokens: `{Label}`

**Examples**
```ts
builder.field('fieldname').when(
    (whenToEnableBuilder) => 
        whenToEnableBuilder.fieldValue('checkbox1').equals(true),
    (thenBuilder) =>
        thenBuilder.parentValue().requireText()
);
builder.field('fieldname').when(
    (whenToEnableBuilder) => 
        whenToEnableBuilder.fieldValue('checkbox1').equals(true),
    (thenBuilder) =>
        thenBuilder.parentValue().requireText(),
    'error message', 'summary message'
);
builder.field('fieldname').when(
    (whenToEnableBuilder) => 
        whenToEnableBuilder.fieldValue('checkbox1').equals(true),
    (thenBuilder) =>
        thenBuilder.parentValue().requireText(),
    { 
        errorMessage: 'error message',
        summaryMessage: 'summary message',
    });	
```
Condition class: `WhenCondition`

Condition config:
```ts
interface WhenConditionConfig = {
    conditionType: ConditionType.When;
    category: ConditionCategory.Children;
    whenToEnableConfig: ConditionConfig; // configures the condition that enables the Then config
    thenConfig: ConditionConfig;    // configures the condition intended to run when enabled
}
```
#### More examples
Regular expression for postal code depends on culture ID
```ts
builder.static('countryCode', LookupKey.String, { initialValue: 'US' });
builder.field('PostalCode')
   .when(
        (whenBuilder)=> whenBuilder.fieldValue('countryCode').equalTo('US'), 
        (thenBuilder)=> thenBuilder.parentValue().regExp(/^\d{5}(\s\d{4})?$/))  // parentValue = uses the value of PostalCode
   .when(
        (whenBuilder)=> whenBuilder.fieldValue('countryCode').equalTo('CA'), 
        (thenBuilder)=> thenBuilder.parentValue().regExp(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/))
   .when(
        (whenBuilder)=> whenBuilder.fieldValue('countryCode').equalTo('MX'), 
        (thenBuilder)=> thenBuilder.parentValue().regExp(/^\d{5}$/));
```

## Not - negate the result
Negates the result of a single child condition. Does nothing if the child condition
results in Undetermined.
```ts
builder.field('fieldname').not(
    (childBuilder) =>
        childBuilder.parentValue().requireText()
)
```
`childBuilder` is a builder designed to add a single child. It has these functions:
- `parentValue()` - Starts building a condition that will use the same valueHostName as the parent. In the above example, the condition will use `valueHostName='fieldname'`.
- `fieldValue(valueHostName)` - Starts building a condition that uses the `valueHostName` supplied for the condition that follows.
- `all()`, `any()`, `countMatches()` - You can nest these same tools as a child and build a tree of logic.
- `not()` employs the `NotCondition` to selectively enable a single child condition.
- `not()` employs the `NotCondition` to invert the result of the child's evaluation. Match->NoMatch or NoMatch->Match.
```ts
not(childBuilderHandler);
not(childBuilderHandler,
    errorMessage?, summaryMessage?);
not(childBuilderHandler,
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
```
Error message tokens: `{Label}`

**Examples**
```ts
builder.field('fieldname').not(
    (childBuilder)=>
        childBuilder.parentValue().requireText()
);
builder.field('fieldname').not(
    (childBuilder)=>
        childBuilder.parentValue().requireText(),
    'error message', 'summary message'
);
builder.field('fieldname').not(
    (childBuilder)=>
        childBuilder.parentValue().requireText(),
    { 
        errorMessage: 'error message',
        summaryMessage: 'summary message',
        errorCode: 'invert'  // optional. Allows multiple not conditions in the same validator
    });	
```
Condition class: `NotCondition`

Condition config:
```ts
interface NotConditionConfig = {
    conditionType: ConditionType.Not;
    category: ConditionCategory.Children;
    childConditionConfig: ConditionConfig; // configures the child condition
```
#### More Examples
Illegal characters in a string using RegExpCondition
```ts
builder.field('password').not(
    (childBuilder)=> childBuilder.parentValue().regExp(/[:|'_]/));  // parentValue uses the value from 'password'
    // use fieldValue(field name) if you want to specify a different field's value
```