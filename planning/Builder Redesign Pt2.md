# Builder Redesign Pt 2

## Key Design Decisions

### KD-01 Child-condition entry syntax for `any`, `all`, `countMatches`, `when`, and `not` (I-05)

**Problem**

These APIs begin in fluent chaining but switch into callbacks to introduce child-condition builders. This was flagged as a potential breakdown in the fluent syntax.

**Current design**

```ts
builder.field('Field1').any(
  (children) => children
    .requireText(null, 'Field2')
    .requireText(null, 'Field3')
);

builder.field('TextBox1', LookupKey.String)
  .when(
    (enabler) => enabler.requireText(null, 'CheckBox1'),
    (child) => child.requireText()
  );
```

**Proposal A — replace callbacks with nested fluent scopes**

```ts
builder.field('Field1')
  .any()
    .requireText(null, 'Field2')
    .requireText(null, 'Field3');

builder.field('Field1')
  .all()
    .requireText(null, 'Field2')
    .requireText(null, 'Field3')
  .next()
  .stringLength(50);

builder.field('TextBox1')
  .when()
    .enabler()
      .requireText(null, 'CheckBox1')
    .next()
    .then()
      .requireText();
```

**Pros**

* Preserves fluent chaining without callbacks.
* Keeps the builder concept intact.
* Makes nested structure visible in a DSL-like way.

**Cons**

* Introduces heavier syntax and more ceremony.
* Requires remembering control-flow markers such as `next()`.
* Becomes especially heavy for `when()` and other structured cases.
* Weakens discoverability of required parts unless staged typing is added.

**Proposal B — keep callbacks**

```ts
builder.field('Field1').any(
  (children) => children
    .requireText(null, 'Field2')
    .requireText(null, 'Field3')
);
```

**Pros**

* Shorter than the nested fluent alternative.
* Keeps required structure explicit for APIs such as `when(enabler, child)`.
* Avoids additional scope-closing or return-to-parent syntax.
* Keeps the child builder available without introducing a second DSL surface.

**Cons**

* Breaks fluent purity by switching into callback syntax.
* Creates a different visual model than top-level validator chaining.
* Still feels awkward in some APIs, especially where nested parameter shapes are already complex.

**Decision**

* Keep the callback pattern for now.
* The explored alternatives did not clearly improve readability or discoverability overall.
* `when()` in particular benefits from callbacks because its required parts remain explicit and enforceable in the signature.
* Continue to treat callback usage as acceptable for child-condition entry unless stronger evidence emerges.

**Supporting explanation**

* The builder object itself appears acceptable.
* The callback was initially suspected to be the main issue, but the alternatives explored were generally heavier and harder to remember.
* For `any`, `all`, and `countMatches`, the callback still reads as “here is the set of child conditions.”
* For `when`, the callback preserves two required roles clearly: enabler and child.

### KD-02 Child-condition parameter shapes and explicit field targeting (I-06)

**Problem**

At the top-level validator fluent, `valueHostName` is inherited from `field('...')`. In child-condition fluents, explicit field targeting often has to be reintroduced. In several method families, `valueHostName` is pushed late in the signature, often after an optional condition-rules object and sometimes alongside other parameters such as conversion config.

**Current design**

```ts
builder.field('Field1').any(
  (children) => children
    .requireText({ trim: true }, 'Field2')
    .lessThan('EndDate', { conversionLookupKey: LookupKey.Date }, 'StartDate')
);
```

**Proposal A — keep current child-condition signatures**

**Pros**

* Consistent with the existing fluent-extension architecture.
* Minimizes breaking changes to the condition method surface.
* Keeps child-condition calls structurally similar to existing overload patterns.

**Cons**

* Explicit field targeting is visually buried in several important cases.
* Nested calls become harder to scan than top-level validator fluent syntax.
* The problem is especially visible when a condition-rules object appears before `valueHostName`.

**Proposal B — redesign child-condition signatures so explicit field targeting is more direct**

Possible directions discussed:

* Move `valueHostName` earlier in child-condition signatures.
* Split inherited-context vs explicit-target variants more clearly.
* Revisit signatures where config objects and field targeting combine, especially comparison conditions.

**Pros**

* Addresses the strongest remaining readability problem in nested conditions.
* Makes child-condition intent clearer without requiring callback replacement.
* Better aligns nested syntax with how users think about targeting other fields.

**Cons**

* Requires broader signature redesign across condition families.
* Risks reducing consistency with existing validator-fluent method shapes.
* Needs careful review because not all condition families have the same problem severity.

**Decision**

* Treat I-06 as the stronger open problem.
* No final signature redesign decision has been made yet.
* Keep the callback model, but focus future design work on improving nested child-condition parameter shapes, especially where `valueHostName` follows a condition-rules object or conversion config.

**Supporting explanation**

* The callback review suggested that callback entry may already be close to the least-bad solution.
* The remaining readability pain is more concentrated inside child-condition method signatures than in the callback mechanism itself.
* Methods such as `range(1, 10, 'Field2')` show that explicit targeting can still read reasonably when it is not buried behind a config object.
* Methods such as `requireText({ trim: true }, 'Field2')` and `.lessThan('EndDate', { conversionLookupKey: LookupKey.Date }, 'StartDate')` highlight the cases that need the most attention.

### KD-03 Overload-style IntelliSense for fluent extension methods (I-12)

**Problem**

Fluent extension methods are implemented through prototype assignment to preserve end-user extensibility, which originally appeared to block or severely limit practical overload-style IntelliSense for those methods.

**Current design**

```ts
FluentValidatorBuilder.prototype.dataTypeCheck = dataTypeCheck;
```

**Proposal A — treat overload support as effectively unavailable**

**Pros**

* Assumes the simplest technical model.
* Avoids extra declaration and implementation boilerplate.
* Keeps focus on designing one primary visible signature per method.

**Cons**

* May force single signatures to absorb too many usage modes.
* Reduces opportunities to improve IntelliSense for common call patterns.
* May overstate the actual technical limitation.

**Proposal B — use overload declarations plus one prototype-assigned implementation function**

**Pros**

* A prototype has shown this may work while preserving extensibility.
* Keeps one runtime JavaScript function per method name.
* May allow clearer IntelliSense and more expressive fluent signatures.
* Reopens overload-based API improvements for the fluent builders.

**Cons**

* Adds declaration and implementation complexity.
* Needs proof that the pattern scales across more methods.
* It is still unclear how well end-user-added extensions can participate.
* Better overload support does not remove the need for good natural-language reading and parameter ordering.

**Decision**

* Overload-style IntelliSense for fluent extension methods appears technically feasible.
* Treat this as an enabling technical direction, not yet a final product-wide commitment.
* Future API design work may assume overloads are possible, but still needs to evaluate scalability, maintenance cost, and support for user-added extensions.

**Supporting explanation**

* A working prototype was created for `dataTypeCheck` using module augmentation, TypeScript overload signatures on the implementation function, and a single prototype-assigned runtime function.
* This changes I-12 from a hard limitation into an open viability and scaling question.
* Even if overloads are adopted, the API should still be judged by how well its visible signature shapes read in code and guide the user in IntelliSense.

### KD-04 Consolidated validator objects and explicit source selectors for child conditions

**Problem**

The parameter shapes of fluent validator methods and fluent child-condition methods need to work well in IntelliSense and read clearly later.

The main concerns are:

* validator methods currently split information across positional parameters, condition config objects, and validator config objects
* child-condition methods need to express `valueHostName` in a way that still reads left-to-right
* `null` as a stand-in for inherited `valueHostName` is technically workable but reads poorly
* natural-language reading matters, especially for expressions that should feel like `fieldName equals 10`

This proposal introduces two connected directions:

1. Consolidate non-required condition properties and validator properties into a single object on `FluentValidatorBuilder` methods.
2. Introduce an explicit source-selector step for `FluentConditionBuilder` so child conditions read left-to-right without relying on `null` for inherited context.

**Proposal A — FluentValidatorBuilder patterns**

These methods would use a single object consolidating the condition's non-required fields together with validator properties. It may omit any condition properties already represented by function parameters to avoid confusion. This is referred to here as **ruleConfig**.

**General pattern**

1. Required properties as the first parameters. All other parameters go into `ruleConfig`. `valueHostName` is omitted because it is always supplied by `field()`. Omitted entirely if there are no required properties.
2. Either of these:

   * `errorMessage`, `summaryMessage` — both optional
   * `ruleConfig` with optional condition properties added

#### Condition has no required or optional condition properties

```ts
// dataTypeCheck has no required or optional condition properties
.dataTypeCheck(errorMessage?, summaryMessage?)
.dataTypeCheck(ruleConfig)

.dataTypeCheck();
.dataTypeCheck('Error');
.dataTypeCheck('Error', 'Summary');
.dataTypeCheck(null, 'Summary');
.dataTypeCheck(null, null);
.dataTypeCheck({
   errorMessage: 'Error',
   summaryMessage: 'Summary',
   errorMessagel10n: 'Errorl10n',
   summaryMessagel10n: 'Summaryl10n',
   severity: ValidationSeverity.Error,
   errorCode: 'alt code', // defaults to 'range' 
});
```

#### Condition has required condition properties, but no optional condition properties

```ts
// range has two required parameters, min and max, but no additional condition properties
.range(min, max, errorMessage?, summaryMessage?)
.range(min, max, ruleConfig)

.range(1, 10);
.range(1, 10, 'Error');
.range(1, 10, 'Error', 'Summary');
.range(1, 10, null, 'Summary');
.range(1, 10, null, null);
.range(1, 10, {
   errorMessage: 'Error',
   summaryMessage: 'Summary',
   errorMessagel10n: 'Errorl10n',
   summaryMessagel10n: 'Summaryl10n',
   severity: ValidationSeverity.Error,
   errorCode: 'alt code', // defaults to 'range' 
});
```

#### Condition has required and optional condition properties

```ts
// equalToValue has one required condition property, secondValue, and its `ruleConfig` has one condition property, secondConversionLookupKey
.equalToValue(secondValue, errorMessage?, summaryMessage?)
.equalToValue(secondValue, ruleConfig);

.equalToValue(10);
.equalToValue(10, 'Error');
.equalToValue(10, 'Error', 'Summary');
.equalToValue(10, null, 'Summary');
.equalToValue(10, null, null);
.equalToValue(10, {
   secondConversionLookupKey: LookupKey.Integer,
   errorMessage: 'Error',
   summaryMessage: 'Summary',
   errorMessagel10n: 'Errorl10n',
   summaryMessagel10n: 'Summaryl10n',
   severity: ValidationSeverity.Error,
   errorCode: 'alt code', // defaults to 'equalToValue' 
});
```

**Proposal B — FluentConditionBuilder patterns**

The trick here is to include the `valueHostName` that is the source value in a way that makes the code read like `field name [condition]`, such as `field name1 range 1, 10`. That works in validators because they inherit the field name. In conditions, they are able to specify their own `valueHostName`, or inherit the field name by leaving `valueHostName` null.

Conditions would optionally offer a **condition's object**, which is effectively the non-required properties of the actual condition object. It is omitted if there are no non-required properties. Unlike validators, there are no validator-specific properties here.

**General pattern**

1. `valueHostName` parameter. Its value can be null to use the inherited one. This may later be removed if there is a better way to handle it.
2. Required properties as the first parameters. All other parameters go into the condition's object. `valueHostName` is not part of that object.
3. Condition's object if available.

#### Condition has no required or optional condition properties

```ts
// dataTypeCheck has no required or optional condition properties
.dataTypeCheck(valueHostName?)

.dataTypeCheck(); // inherits valueHostName
.dataTypeCheck('field1');
.dataTypeCheck(null); // inherits valueHostName
```

#### Condition has required condition properties, but no optional condition properties

```ts
// range has two required parameters, min and max, but no additional condition properties
.range(valueHostName, min, max)

.range('field1', 1, 10);
```

#### Condition has required and optional condition properties

```ts
// equalToValue has one required condition property, secondValue, and its validator's object has one condition property, secondConversionLookupKey
.equalToValue(valueHostName, secondValue, condition's object?);

.equalToValue('field1', 10);
.equalToValue(null, 10); // inherits valueHostName

.equalToValue('field1', 10, {
   secondConversionLookupKey: LookupKey.Integer,
});
```

**Proposal for FluentConditionBuilder's assignment of valueHostName**

We are trying to make our syntax read left-to-right with the leftmost element being the source of the value in `valueHostName`.
That is fine in `FluentValidatorBuilder`, but not in `FluentConditionBuilder`.

Look at this proposal from above:

```ts
builder.field('field1').any((childBuilder)=>{
   childBuilder.equalToValue(null, 10); // inherits field1
   childBuilder.equalToValue('field2', 20); // explicit field2
});
```

In a validator, you would read it as:

```ts
builder.field('field1').equalToValue(10) // 'field1 is equal to value 10'
```

In the proposal above:

```ts
childBuilder.equalToValue(null, 10); // 'is equal to value [null which does not mean much but stands in for field1] 10'
childBuilder.equalToValue('field2', 20); // 'is equal to value field2 20. Huh???'
```

**Proposal C — explicit source selector before the condition**

Introduce a required element between the builder and the condition that stands in for the `valueHostName` source.

```ts
builder.field('field1').any((childBuilder)=>{
   childBuilder.parentValue().equalToValue(10); // 'parent value is equal to 10'
   childBuilder.valueFrom('field2').equalToValue(20); // 'field2 is equal to 20'
});
```

**Pros**

* Consolidates advanced validator options into one clearer object lane.
* Preserves short, natural common calls such as `.dataTypeCheck()`, `.range(1, 10)`, and `.equalToValue(10)`.
* Makes child-condition source selection more explicit and more readable.
* Avoids using `null` as a semantic stand-in for inherited context.
* Better supports left-to-right reading for child conditions.
* May work well with overload-style IntelliSense if the overload approach from I-12 scales.

**Cons**

* Introduces a major conceptual shift for `FluentConditionBuilder` if source selectors such as `parentValue()` and `valueFrom()` are adopted.
* Requires broad signature redesign across validator and child-condition families.
* May create some divergence between validator syntax and child-condition syntax.
* Needs review for discoverability, naming, and how it interacts with existing extensibility patterns.

**Decision**

* No final decision yet.
* This is a leading proposal for the broader signature redesign discussion.
* It is especially promising for child-condition readability because it attacks the natural-language reading problem directly instead of only shuffling parameters.
* It should be evaluated further before anything is promoted into the Changes section.

**Supporting explanation**

* This proposal reflects the current design goal that IntelliSense should guide the user toward likely/common call shapes.
* It also reflects the confirmed importance of natural-language reading, especially for methods like `equalToValue`, which currently read well in validators but poorly in child conditions once explicit source selection is needed.
* The validator-side `ruleConfig` consolidation is intended to reduce fragmentation between condition config, error-message convenience parameters, and validator metadata.
* The child-condition source-selector idea is intended to restore the left operand to the left side of the call.

## Tracking

### Design axes

* Authoring API vs adaptation API
* Fluent consistency vs callback-introduced child-condition builders
* Context inheritance vs explicit field targeting in child conditions
* Naming policy for fluent condition methods
* Alias policy for fluent condition methods
* Positional overloads vs config-object overloads for value-host creation methods
* Builder API cohesion as `model()` joins `field()`

### Primary users

* Business logic / server-side developer
* UI developer

### Constraints to preserve

* TypeScript-first API design
* Breaking changes are acceptable
* The same method can add and edit
* `field()` remains a first-class entry point
* `model()` will become another first-class Builder API entry point
* End-user extensibility of fluent methods is a first-class requirement

### Open review buckets

* Form Adapter ergonomics for light-touch overrides
* `field(..., null, ...)` and other placeholder-argument smells
* Child-condition syntax for `any`, `all`, `countMatches`, and `when`
* Form Adapter syntax for `combineWithRule`, `replaceRule`, and `enabler`
* Child-condition parameter placement for `valueHostName` and `secondValueHostName`
* Condition method names
* Condition aliases
* Validator message parameter shape and consistency
* `when(enabler, childCondition)` parameter naming
* `combineWithRule(...)` overload readability and mental model
* How far overload-style IntelliSense can scale in extensible fluent methods
* Whether user-added fluent extensions can participate in overload-style signatures

### Current tensions to watch

* Full-definition power vs low-friction adaptation
* Precision of semantics vs brevity of method names
* Shared fluent surface vs role-specific ergonomics
* Context passed down implicitly vs parameters supplied explicitly
* Builder objects may be acceptable while callback syntax used to introduce them may still be awkward
* API consistency across Builder, Form Adapter, Modifier, and future `model()`
* Extensibility-friendly fluent implementation vs overload-friendly TypeScript method design

### Deferred but influential topics

* Final design of `model().validators`
* Specific real-world complaints and missing capabilities not yet entered
* Whether naming and alias policy should differ between field-rooted and child-condition fluents
