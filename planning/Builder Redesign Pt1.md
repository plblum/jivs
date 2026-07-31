# Builder Redesign Pt 1

## Issues

### I-01

We will be introducing a new member of builder API: `model().validators`. It is like the `field()` function, except it directs all validators to the model level. `model()` does not have any parameters, just a list of fluent validators. Those validators are much more limited than on `field()` because we need to handle complex and multifield logic, so `customRule`, `any()`, `all()`, etc, but no `requiredText`, `lessThan`, etc.

Right now, design help on `model()` is not needed, but it may influence the discussion.

```ts
builder.model()
  .all((children) => children
    .customRule(createModelRuleA)
    .customRule(createModelRuleB)
  );
```

### I-02
RESOLVED
The parameters supplied are great for initial setup in `ModelRulesBase.configureRules`, because the user is dumping the full definition of a value host and its validators. However, when the UI developer works with Form Adapter and wants to override a value host label, validator error message, or other non-invasive aspect of value hosts and validators, the parameters and syntax are too complex.

```ts
adapter.field('FirstName', null, { label: 'First name' })
  .requireText('{Label} is required.');
```

### I-03

CHANGED: Use Adapter to edit. RESOLVED
Using the same method to add and edit is acceptable. Business rules use `builder.field('field1')` to create `field1`, and the UI developer uses `adapter.field('field1', null, { label: 'label' })`. This is all part of the fluent syntax.

```ts
builder.field('FirstName');
adapter.field('FirstName', null, { label: 'First name' });
```

### I-04

RESOLVED: Adapter + modify().reviseDataType()

`field(valueHostName, dataType, parametersObject)` is an excellent API for the business developer, but a poor one for the UI developer because the second parameter, `dataType`, is not changed often and is strongly directed to be the domain of the business logic. So the UI developer uses `null` frequently. To change the label, they have to write `field('field1', null, { label: 'label' })`.

Data type is replaceable only if its type is compatible with the original, so you can replace `String` with `EmailAddress` and `Number` with `Integer`.

```ts
builder.field('Email', LookupKey.String, { label: 'Email' });
adapter.field('Email', null, { label: 'Email address' });
adapter.field('Email', LookupKey.EmailAddress, { label: 'Email address' });
```

### I-05

RESOLVED: Removed old. Made Adapter use and(), or(), when().

The syntax of Form Adapter's `combineWithRule`, `replaceRule`, and `enabler` needs review.

RESOLVED: The syntax of conditions that have child conditions, such as `any`, `all`, and `countMatches`, needs review. 

The syntax of the `WhenCondition` has similar concerns.

All of these started in a fluent syntax, but to get their child objects, switch to function references.

```ts
builder.field('Field1').any(
  (children) => children
    .requireText(null, 'Field2')
    .requireText(null, 'Field3')
);
```

### I-06

RESOLVED

Child conditions still need a `valueHostName` parameter. Some also need another parameter for `secondValueHostName`, such as `LessThanCondition`.

In the main validation fluent layer (`FluentValidatorBuilderExtensions`), `valueHostName` is omitted because it is passed down from `field('name')`.

In child conditions, `FluentConditionBuilderExtensions` is used instead. Sometimes the user wants `valueHostName` to be passed down, but often they do not. That is where the syntax gets awkward.

`valueHostName` still needs to be offered as a parameter, but it is buried as the last parameter and further obscured because the previous parameter is an entire object.

```ts
builder.field('Field1').any(
  (children) => children
    .requireText({ trim: true }, 'Field2')
);
```

### I-07

The names of the conditions need review. They do not have to exactly match the formal condition class names.

Some names are awkward, such as `requireText` instead of `required`, because an empty string is a different idea than `null`, so `notNull` is used for non-string fields that are required.

```ts
builder.field('FirstName').requireText();
builder.field('BirthDate', LookupKey.Date).notNull();
```

### I-08

Aliases are offered for some conditions, such as `lessThan` -> `lt` and `lessThanValue` -> `ltValue`.

These aliases need review, along with consideration of other likely aliases.

```ts
builder.field('StartDate').lessThan('EndDate');
builder.field('StartDate').lt('EndDate');
builder.field('Score').lessThanValue(100);
builder.field('Score').ltValue(100);
```

### I-09

RESOLVED

Some condition fluent methods offer a convenience parameter for `errorMessage`, while closely related message properties remain buried in the trailing validator-properties object.

For example, `errorMessage` is promoted into a positional parameter, but `errorMessagel10n`, `summaryMessage`, and `summaryMessagel10n` remain in the last parameter object.

This creates an uneven API shape around message-related settings.

```ts
adapter.field('FirstName')
  .requireText(null, 'error message', {
    errorMessagel10n: 'em1',
    summaryMessage: 'summary message',
    summaryMessagel10n: 'sm1'
  });
```

### I-10

RESOLVED

For `when(enabler, childCondition)`, review parameter naming.

The term `then` may be a better name for the second parameter than `childCondition`, and the first parameter may also need a better paired name.

This issue is focused on terminology and readability of the `when(...)` API shape, not on changing away from the callback model.

```ts
builder.field('TextBox1', LookupKey.String)
  .when(
    (enabler) => enabler.requireText(null, 'CheckBox1'),
    (child) => child.requireText()
  );
```

### I-11

RESOLVED with new Adapter functions: and(), or(), when().

The two `combineWithRule(...)` overloads are confusing enough that even the API author is not comfortable reading examples of them.

The issue is not just naming, but overall readability and mental model:

* what each overload is doing
* when to choose one over the other
* how the existing rule is involved
* how much of the combination behavior is implicit vs explicit

```ts
adapter.combineWithRule('Field1', 'NotNull',
  (combiningBuilder, existingConditionConfig) => {
    combiningBuilder.when(
      (enablerBuilder) => enablerBuilder.equalToValue('YES', null, 'Field2'),
      (childBuilder) => childBuilder.conditionConfig(existingConditionConfig)
    );
  });

adapter.combineWithRule(
  'Field1',
  'NotNull',
  CombineUsingCondition.When,
  (combiningBuilder) => combiningBuilder.equalToValue('YES', null, 'Field2')
);
```

### I-12

RESOLVED: Replaced prototype with subclassing and Factory to create the user's subclass.

Fluent extension methods are implemented through prototype assignment to support end-user extensibility.

This is not just a JavaScript limitation in the abstract. The fluent API is built by attaching one runtime function per method name onto the fluent builder prototypes. For example:

```ts
FluentValidatorBuilder.prototype.dataTypeCheck = dataTypeCheck;
```

That means there is only one JavaScript function named `dataTypeCheck` on the fluent builder at runtime.

The architectural reason for this design is important: it allows end users to add their own conditions and expose them through the builder in the same extensible pattern. If fluent methods were ordinary built-in TypeScript class methods, overload support and signature help would likely be easier, but end-user extensibility would be much harder or lost.

This originally appeared to create a major technical constraint behind several API-shape problems:

* a single visible fluent method may need to carry multiple intended call shapes
* the API could not safely assume that overload-driven IntelliSense would rescue awkward signatures
* some signatures might be more complex than ideal because they were absorbing cases that overloads might otherwise separate

A prototype result now changes the status of this issue.

Using `dataTypeCheck` on `FluentValidatorBuilderExtensions`, a prototype successfully added overload declarations through module augmentation, matched them with TypeScript overload signatures on the implementation function, and still kept a single runtime JavaScript function assigned to the prototype.

This means practical overload-style IntelliSense may be feasible within the current extensibility model.

The issue is therefore no longer simply “overloads may be unavailable.” It is now a more specific technical and design question:

* how far this overload pattern can scale across fluent methods
* whether user-added fluent extensions can participate in the same pattern
* how much boilerplate or maintenance burden it introduces
* whether the IntelliSense improvement is strong enough to justify broader adoption

This still directly affects user experience in the IDE:

* IntelliSense may improve if overload declarations can be surfaced clearly
* parameter ordering still matters because the visible signature shapes need to teach the user how to call the method
* natural-language reading still matters because later readers may not benefit from IntelliSense at all
* methods such as `requireText(...)`, `equalTo(...)`, and child-condition versions of those methods may therefore still need careful signature design even if overloads become viable

This remains a foundational issue behind several other topics, especially:

* **I-06** — child-condition signatures may need to express inherited and explicit-target cases
* **I-09** — message-related settings may be split partly because one visible signature is trying to optimize for common usage
* the broader signature-design discussion around natural-language reading, IntelliSense predictability, and parameter ordering

```ts
FluentValidatorBuilder.prototype.dataTypeCheck = dataTypeCheck;
```

## Current Designs

### UC-01 Define a field from scratch in business rules

**Valid variants**

```ts
builder.field('FirstName');
builder.field('FirstName', null);
builder.field('FirstName', LookupKey.String);
builder.field('FirstName', LookupKey.String, { label: 'First name' });
```

*Fluent validators can follow* field()

```ts
builder.field('FirstName')
  .requireText()
  .stringLength(50);
```

**Representative chained example**

```ts
builder.field('FirstName', LookupKey.String, { label: 'First name' })
  .requireText()
  .stringLength(50);
```

**Notes**

* Strong example of the Builder API in its natural authoring role.
* `field()` supports a range of valid declaration styles, from minimal declaration to fully specified definition.
* `field()` can stand alone to declare or update the field, and it can also continue into fluent validator chaining.
* The one-parameter config-object overload is part of the current Builder API shape. The same pattern also exists on `calc()` and `static()`, though current discussion is focused on `field()`.
* `dataType` feels appropriate here because the business developer is defining the field.
* `requireText()` is also a good example of implicit `valueHostName` pass-through from `field('FirstName')`, which keeps the fluent validator syntax compact and readable.

**Relevant issues**

* **I-02** — full-definition syntax works well during initial setup
* **I-03** — supports the shared add/edit `field()` model
* **I-04** — shows why the authoring-oriented `field()` forms work better for business-rule definition than UI adaptation
* **I-06** — shows the cleaner case where `valueHostName` is inherited implicitly instead of being restated

### UC-02 Override only a field label in the Form Adapter

**Valid variants**

```ts
adapter.field('FirstName', { label: 'First name' });
adapter.field('FirstName', null, { label: 'First name' });
```

**Representative example**

```ts
adapter.field('FirstName', null, { label: 'First name' });
```

**Notes**

* The UI developer is making a light-touch override, not redefining the field.
* The shared `field()` entry point is preserved.
* The overload that accepts the parameters object directly is an important part of the current API shape.
* The placeholder `null` for `dataType` hurts readability and makes the call feel heavier than the change being made.

**Relevant issues**

* **I-02** — simple UI overrides feel too complex
* **I-03** — still demonstrates the desired shared add/edit `field()` model
* **I-04** — shows the `field(..., null, ...)` smell directly while also highlighting that an overload exists that may reduce that pain

### UC-03 Override only a validator message in the Form Adapter

**Valid variants**

```ts
adapter.field('FirstName', null, { label: 'First name' })
  .requireText(null, '{Label} is required.');

adapter.field('FirstName')
  .requireText(null, 'error message', {
    errorMessagel10n: 'em1',
    summaryMessage: 'summary message',
    summaryMessagel10n: 'sm1',
    severity: ValidationSeverity.Severe
  });
```

**Representative example**

```ts
adapter.field('FirstName', null, { label: 'First name' })
  .requireText(null, '{Label} is required.');
```

**Notes**

* The intent is only to override UI-facing text.
* The condition fluent method still exposes its full parameter shape, even though this use case is not redefining the condition.
* On `requireText()`, the first parameter is the optional condition-rules object, so `null` is passed only to reach the error message parameter.
* Some message-related settings are split across the signature: `errorMessage` gets a convenience positional parameter, while related properties such as `errorMessagel10n`, `summaryMessage`, and `summaryMessagel10n` remain in the trailing validator-properties object.
* The syntax therefore reads like validator creation rather than light-touch adaptation.
* The fluent chaining remains consistent with the Builder model, but the cost of reaching a small override is high.

**Relevant issues**

* **I-02** — a light-touch override still requires heavy syntax
* **I-03** — remains within the shared `field()` fluent model
* **I-04** — includes the repeated `null` placeholder pattern
* **I-09** — message-related settings are split between a convenience positional parameter and the trailing validator-properties object

### UC-04 Override validator metadata in the Form Adapter

**Valid variants**

```ts
adapter.field('FirstName')
  .requireText(null, 'error message', { severity: ValidationSeverity.Warning });

adapter.field('BirthDate')
  .notNull(null, { severity: ValidationSeverity.Warning });

adapter.field('Amount')
  .positive(null, { severity: ValidationSeverity.Warning });

adapter.field('Amount')
  .positive('error message', { severity: ValidationSeverity.Warning });  
```

**Representative example**

```ts
adapter.field('FirstName', null)
  .requireText(null, null, { severity: ValidationSeverity.Warning });
```

**Notes**

* The real change is the validator metadata object.
* Different condition fluent methods expose different levels of friction here.
* On `requireText()`, the first `null` skips the optional condition-rules object and the second `null` skips the error message.
* By contrast, methods such as `notNull()` and `positive()` do not have that same condition-rules slot, so reaching validator metadata is less awkward.
* The important change is still visually buried at the end of the call.
* This highlights the difference between full validator authoring and light-touch validator adaptation.

**Relevant issues**

* **I-02** — too much ceremony for a non-invasive override
* **I-04** — illustrates placeholder-argument friction
* **I-09** — method families differ in how message and metadata parameters are surfaced

### UC-05 Build rules that use child conditions

**Valid variants**

```ts
builder.field('Field1').any(
  (children) => children
    .requireText()
    .requireText(null, 'Field2')
    .requireText({ trim: true }, 'Field3')
    .requireText({ trim: true })
);

builder.field('Field1').all(
  (children) => children
    .requireText(null, 'Field2')
    .requireText(null, 'Field3')
);

builder.field('Field1').countMatches(
  1, 2,
  (children) => children
    .requireText(null, 'Field2')
    .requireText(null, 'Field3')
    .requireText(null, 'Field4')
);

builder.field('Field1').all(
  (children) => children
    .range(1, 10, 'Field2')
);

builder.field('Field1').any(
  (children) => children
    .lessThan('EndDate', { conversionLookupKey: LookupKey.Date }, 'StartDate')
);
```

**Representative example**

```ts
builder.field('Field1').any(
  (children) => children
    .requireText(null, 'Field2')
    .requireText(null, 'Field3')
);
```

**Notes**

* This use case covers the family of condition methods that accept child conditions, including `any()`, `all()`, and `countMatches()`.
* The fluent chain switches into a callback that receives a child-condition builder.
* Child-condition calls can either inherit the current `valueHostName` or target another field explicitly.
* Different child-condition methods expose different levels of friction.
* On child-condition calls like `requireText(null, 'Field2')`, the first parameter is the optional condition-rules object, so the explicit `valueHostName` is pushed later in the signature.
* This becomes even more visible in variants like `requireText({ trim: true }, 'Field3')`, where field targeting follows an entire object.
* By contrast, variants such as `range(1, 10, 'Field2')` show a cleaner nested case where explicit field targeting is still needed, but is not buried after a config object.
* Comparison variants such as `.lessThan('EndDate', { conversionLookupKey: LookupKey.Date }, 'StartDate')` show the more complex nested case where conversion config and field targeting combine.
* The child-condition builder may be acceptable; the callback transition from direct fluent chaining is the part under review.
* The child-condition syntax is harder to scan than top-level validator chaining.
* This is a contrast case to UC-01, where `valueHostName` is passed down naturally from `field()`.

**Relevant issues**

* **I-05** — review whether the callback used to supply the child-condition builder is the right syntax shape across `any`, `all`, `countMatches`, and related APIs
* **I-06** — child conditions expose awkward `valueHostName` placement, especially when the first parameter is a condition-rules object or when conversion config is also involved

### UC-06 Build a single-child conditional rule with `when` or `not`

**Valid variants**

```ts
builder.field('Password').not(
  (child) => child.regExp(/[:|'_]/)
);

builder.field('TextBox1', LookupKey.String)
  .when(
    (enabler) => enabler.requireText(null, 'CheckBox1'),
    (child) => child.requireText()
  );
```

**Representative example**

```ts
builder.field('TextBox1', LookupKey.String)
  .when(
    (enabler) => enabler.requireText(null, 'CheckBox1'),
    (child) => child.requireText()
  );
```

**Notes**

* This use case covers the single-child callback-builder family, including `when()` and `not()`.
* These have the same shift from direct fluent chaining into a callback that receives a builder as other child-condition designs.
* They differ from `any()`, `all()`, and `countMatches()` because the callback is for a single child-condition path rather than a multi-condition chain.
* `when()` also mixes inherited context with explicit alternate field targeting.
* In the enabler callback, the condition fluent method again puts the optional condition-rules object before the explicit `valueHostName`, which makes the targeting syntax less direct.
* The builder objects may be acceptable; the callback shape used to introduce them is the part under review.
* The split between the enabler builder and child builder adds more syntax shape changes inside one rule.

**Relevant issues**

* **I-05** — `when` and `not` share the same concern about using callbacks to introduce child-condition builders
* **I-06** — field targeting inside nested conditions becomes awkward

### UC-07 Use comparison aliases

**Valid variants**

```ts
builder.field('StartDate').lessThan('EndDate');
builder.field('StartDate').lt('EndDate');
builder.field('StartDate').lessThanOrEqual('EndDate');
builder.field('StartDate').lte('EndDate');
builder.field('Score').greaterThanValue(0);
builder.field('Score').gtValue(0);
builder.field('Score').greaterThanOrEqualValue(100);
builder.field('Score').gteValue(100);
```

**Representative examples**

```ts
builder.field('StartDate').lt('EndDate');
builder.field('Score').gtValue(0);
```

**Notes**

* Aliases improve brevity.
* The current API shape includes both longer descriptive names and shorter aliases.
* The alias family is broader than a single `lt` example and includes `lt/lte/gt/gte` and their `Value` forms.
* This raises consistency questions about which short forms should exist and whether the naming system stays coherent.
* Interesting that it is missing equalTo and not equal to with 'eq' and 'neq' aliases.

**Relevant issues**

* **I-07** — method names themselves need review for clarity and ergonomics
* **I-08** — alias coverage and policy need review

### UC-08 Combine an existing rule with a new condition using `combineWithRule(valueHostName, errorCode, builderFn)`

**Definition**

Find the existing validator on the named field by `errorCode`, then build a new condition that combines with the existing condition. In this overload, the callback receives both a combining builder and the existing condition config, so the existing rule can be explicitly reused inside a larger condition.

**Representative examples**

```ts
adapter.combineWithRule('Field1', 'NotNull',
  (combiningBuilder, existingConditionConfig) => {
    combiningBuilder.when(
      (enablerBuilder) => enablerBuilder.equalToValue('YES', null, 'Field2'),
      (childBuilder) => childBuilder.conditionConfig(existingConditionConfig)
    );
  });
```

```ts
const modifier = vhm.startModifying();

modifier.combineWithRule('Field1', 'NotNull',
  (combiningBuilder, existingConditionConfig) => {
    combiningBuilder.when(
      (enablerBuilder) => enablerBuilder.equalToValue('YES', null, 'Field2'),
      (childBuilder) => childBuilder.conditionConfig(existingConditionConfig)
    );
  });

modifier.apply();
```

**Notes**

* This overload is for the case where the existing condition must be explicitly placed inside a new condition tree.
* It is powerful, but introduces a callback that itself usually leads into more callbacks.
* It is an important example of the more advanced child-condition syntax outside normal `field(...).validator(...)` chaining.

**Relevant issues**

* **I-05** — switches from fluent chaining into callback-driven nested condition building
* **I-06** — nested child-condition signatures can still become awkward inside the callback

### UC-09 Combine an existing rule with a new condition using `combineWithRule(valueHostName, errorCode, combineUsing, builderFn)`

**Definition**

Find the existing validator on the named field by `errorCode`, then combine the existing condition with a new condition using the specified `CombineUsingCondition`, such as `When`, `All`, or `Any`. In this overload, the framework handles the combination pattern, and the callback only supplies the new condition.

**Representative examples**

```ts
adapter.combineWithRule(
  'Field1',
  'NotNull',
  CombineUsingCondition.When,
  (combiningBuilder) => combiningBuilder.equalToValue('YES', null, 'Field2')
);
```

```ts
const modifier = vhm.startModifying();

modifier.combineWithRule(
  'Field1',
  'NotNull',
  CombineUsingCondition.All,
  (combiningBuilder) => combiningBuilder.stringLength(10)
);

modifier.apply();
```

**Notes**

* This overload is lighter than the other `combineWithRule(...)` because the existing condition does not need to be manually reinserted.
* It is still callback-based, but the callback shape is narrower.
* It is a good example of how the Form Adapter and Modifier expose powerful rule manipulation beyond normal field fluent syntax.

**Relevant issues**

* **I-05** — uses callbacks to introduce condition-building outside standard validator chaining
* **I-06** — the combining builder still uses child-condition signatures when explicit targeting is needed

### UC-10 Replace an existing rule using `replaceRule(valueHostName, errorCode, ...)`

**Definition**

Find the existing validator on the named field by `errorCode` and replace its condition with a new one. The validator slot remains identified by the same `errorCode`, but the underlying rule changes.

**Representative examples**

```ts
adapter.replaceRule('Field1', 'NotNull',
  (replacementBuilder) => replacementBuilder.requireText()
);
```

```ts
const modifier = vhm.startModifying();

modifier.replaceRule('Field1', 'NotNull',
  (replacementBuilder) => replacementBuilder.requireText()
);

modifier.apply();
```

**Notes**

* This is a stronger customization than `combineWithRule(...)` because it discards the original condition instead of wrapping or combining it.
* It keeps the validator identity stable through the same `errorCode`.
* It is conceptually simple, but still introduces callback-based condition construction.

**Relevant issues**

* **I-05** — uses a callback to build the replacement condition
* **I-06** — replacement conditions still inherit the nested child-condition signature concerns

### UC-11 Add a field-level enabler using `enabler(valueHostName, conditionConfig)`

**Definition**

Attach an enabler condition directly to the ValueHost. This is field-level enable/disable behavior, not validator-level condition combination. If an enabler already exists on the field, it is replaced.

**Representative examples**

```ts
adapter.enabler('Field1', {
  conditionType: ConditionType.EqualToValue,
  valueHostName: 'Field2',
  secondValue: 'YES'
});
```

```ts
const modifier = vhm.startModifying();

modifier.enabler('Field1', {
  conditionType: ConditionType.EqualToValue,
  valueHostName: 'Field2',
  secondValue: 'YES'
});

modifier.apply();
```

**Notes**

* This does not target one validator; it targets the field as a whole.
* It uses raw condition config rather than the child-condition fluent builder.
* It is a distinct API shape from `combineWithRule(...)` and `replaceRule(...)`.

**Relevant issues**

* **I-05** — part of the advanced Form Adapter / Modifier syntax under review
* **I-06** — uses explicit field targeting directly in raw config form

### UC-12 Add a field-level enabler using `enabler(valueHostName, builderFn)`

**Definition**

Attach an enabler condition directly to the ValueHost, but build the condition through the child-condition fluent builder instead of supplying raw `ConditionConfig`.

**Representative examples**

```ts
adapter.enabler('Field1',
  (enablerBuilder) => enablerBuilder.equalToValue('YES', null, 'Field2')
);
```

```ts
const modifier = vhm.startModifying();

modifier.enabler('Field1',
  (enablerBuilder) => enablerBuilder.equalToValue('YES', null, 'Field2')
);

modifier.apply();
```

**Notes**

* This is the fluent-builder counterpart to the raw-config `enabler(...)` overload.
* It reads more consistently with other callback-based condition APIs, but still brings the same nested-signature concerns.
* It helps show that `enabler(...)` exists in both raw-config and fluent-builder forms.

**Relevant issues**

* **I-05** — uses a callback to introduce the enabler condition builder
* **I-06** — enabler builder calls can still expose awkward field-targeting parameter placement

