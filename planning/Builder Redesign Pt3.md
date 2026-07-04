# Builder Redesign Pt 3

## Changes/Work

### CH-01 Prototype direction for I-12: overloads on fluent extension methods may be feasible

A prototype was created using `dataTypeCheck` on `FluentValidatorBuilderExtensions` to test whether overloads can be exposed on `FluentValidatorBuilder` while preserving the current extensibility pattern.

**What was done**

1. Added overload declarations to `FluentValidatorBuilder` through module augmentation in `FluentValidatorBuilderExtensions.ts`.
2. Added matching TypeScript overload signatures for the implementation function.
3. Kept a single runtime JavaScript function assigned to the prototype, using argument inspection inside the implementation.
4. Tested the resulting developer experience in VS Code IntelliSense and with fluent-builder tests.

**Prototype overload declarations**

```ts
declare module "./../Builder/Fluent"
{
    export interface FluentValidatorBuilder {
        /**
         *
         * @param errorMessage
         * The error message "template" that will appear on screen when the condition is NoMatch.
         * It can use tokens, which are resolved with current data at the time of validation.
         * If null, it will expect to be setup by one of several other sources including
         * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
         * @param validatorParameters
         * Additional ways to customize the Validator, including localized error messages,
         * severity, and the enabler.
         */
        dataTypeCheck(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        dataTypeCheck(
            errorMessage: string): FluentValidatorBuilder;
        dataTypeCheck(
            validatorParameters: FluentValidatorConfig): FluentValidatorBuilder;
    }
}
```

**Prototype implementation pattern**

```ts
function dataTypeCheck(errorMessage: string): FluentValidatorBuilder;
function dataTypeCheck(validatorParameters: FluentValidatorConfig): FluentValidatorBuilder;
function dataTypeCheck(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;

function dataTypeCheck(
    arg1?: string | null | FluentValidatorConfig,
    arg2?: FluentValidatorConfig): FluentValidatorBuilder {
    let errorMessage: string | null | undefined;
    let validatorParameters: FluentValidatorConfig | undefined;
    if (typeof arg1 === 'string' || arg1 === null || arg1 === undefined) {
        errorMessage = arg1;
        validatorParameters = arg2;
    }
    else if (typeof arg1 === 'object') {
        errorMessage = undefined;
        validatorParameters = arg1;
    }

    return finishFluentValidatorBuilder(this,
        ConditionType.DataTypeCheck, _genCDDataTypeCheck(),
        errorMessage, validatorParameters);
}
```

**Prototype test cases**

```ts
test('With only errorMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {

    let testItem = createFluent().field('Field1').dataTypeCheck('Error');
    TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
        conditionConfig: <DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck
        },
        errorMessage: 'Error'
    });

    let testItem2 = createFluent().field('Field1').dataTypeCheck({ errorMessage: 'Error' });
    let testItem3 = createFluent().field('Field1').dataTypeCheck(null, { errorMessage: 'Error' });
    let testItem4 = createFluent().field('Field1').dataTypeCheck();
    let testItem5 = createFluent().field('Field1').dataTypeCheck('Error', { summaryMessage: 'Summary' });

    TestFluentValidatorBuilder(testItem2, <ValidatorConfig>{
        conditionConfig: <DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck
        },
        errorMessage: 'Error'
    });
    TestFluentValidatorBuilder(testItem3, <ValidatorConfig>{
        conditionConfig: <DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck
        },
        errorMessage: 'Error'
    });
    TestFluentValidatorBuilder(testItem4, <ValidatorConfig>{
        conditionConfig: <DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck
        }
    });
    TestFluentValidatorBuilder(testItem5, <ValidatorConfig>{
        conditionConfig: <DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck
        },
        errorMessage: 'Error',
        summaryMessage: 'Summary'
    });
});
```

**What this means**

* The fluent extension architecture may still support practical overload-style IntelliSense.
* The prototype keeps the extensibility model intact because runtime still uses a single prototype-assigned function.
* This may remove or reduce one of the strongest constraints described in I-12.
* If this approach generalizes, some fluent methods may be able to express clearer call shapes without abandoning extensibility.

**Status**

* This is a prototype result, not yet a final design decision.
* It should be treated as an enabling technical direction for future API work, especially where overloads may improve IntelliSense and signature readability.

### CH-02 Formal change direction from KD-04 Proposal A: consolidate FluentValidatorBuilder signatures around `ruleConfig`

This change promotes **KD-04 Proposal A** from an exploratory design into a formal change direction for `FluentValidatorBuilder`.

It does **not** remove Proposal A from KD-04. KD-04 remains the design rationale and pattern library. This change section records the decision to begin treating the validator-side portion as the implementation target.

**Scope**

This change applies to `FluentValidatorBuilder` method signatures.

It does **not** yet finalize the `FluentConditionBuilder` changes from KD-04 Proposal B / Proposal C.

**Change summary**

For `FluentValidatorBuilder` methods:

* required condition properties remain positional parameters
* `valueHostName` remains omitted because it is always supplied by `field()`
* non-required condition properties and validator properties are consolidated into a single `ruleConfig` object
* short common-call forms remain available through positional `errorMessage?` and `summaryMessage?`
* advanced customization shifts into the `ruleConfig` overload

**Formal pattern**

1. Required properties as the first parameters. Omitted entirely if there are no required properties.
2. Then either:

   * `errorMessage?`, `summaryMessage?`
   * or `ruleConfig`

**Representative target shapes**

#### Condition has no required or optional condition properties

```ts
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
   errorCode: 'alt code',
});
```

#### Condition has required condition properties, but no optional condition properties

```ts
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
   errorCode: 'alt code',
});
```

#### Condition has required and optional condition properties

```ts
.equalToValue(secondValue, errorMessage?, summaryMessage?)
.equalToValue(secondValue, ruleConfig)

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
   errorCode: 'alt code',
});
```

**Why this is now treated as a change**

* It gives `FluentValidatorBuilder` a more coherent signature family.
* It preserves natural reading for common calls such as `.dataTypeCheck()`, `.range(1, 10)`, and `.equalToValue(10)`.
* It gives IntelliSense a clearer two-lane model: short positional message lane vs advanced `ruleConfig` lane.
* It reduces fragmentation between condition config, error-message convenience parameters, and validator metadata.

**Dependency on CH-01**

This change now depends on **CH-01**.

Reason:

* the proposed dual-call-shape pattern is much stronger if overload-style IntelliSense can be surfaced cleanly
* methods such as `.dataTypeCheck(errorMessage?, summaryMessage?)` and `.dataTypeCheck(ruleConfig)` are best represented through overloads
* CH-01 established a working prototype direction for overload-style IntelliSense on fluent extension methods while preserving the extensibility architecture

Without CH-01, these signatures would likely collapse back into noisier single implementation signatures, weakening the developer experience.

**Likely source files impacted**

Based on the current implementation shape, the main files likely to change are:

* `FluentValidatorBuilderExtensions.ts`
* `Fluent.ts`

`FluentValidatorBuilderExtensions.ts` is the primary implementation point because it currently:

* declares the fluent validator method signatures through module augmentation
* attaches the implementation functions to `FluentValidatorBuilder.prototype`
* contains the implementation signatures that would need overloads and argument resolution logic

`Fluent.ts` is a likely companion update because it defines the fluent-builder types and shared fluent infrastructure that the revised signatures and config typing will need to align with.

**Implementation implications to evaluate later**

* define a formal `ruleConfig` type strategy for each validator family
* decide which properties remain positional and which move into `ruleConfig`
* ensure overload declarations and implementation signatures stay aligned
* ensure existing extension patterns remain usable for built-in and user-added validators
* evaluate documentation impact and IntelliSense presentation

**Status**

* Accepted as a formal change direction for `FluentValidatorBuilder`
* Not yet implemented broadly
* Still subject to refinement before code changes begin

**Coding guidance**

This section presents the work in implementation order, with concrete examples.

### 1. Internal helper impact first

Start with the plumbing that all validator-specific work depends on.

#### 1a. `finishFluentValidatorBuilder2`

Add a side-by-side helper that inserts `summaryMessage` immediately after `errorMessage`.

```ts
export function finishFluentValidatorBuilder2(
    thisFromCaller: any,
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig>,
    errorMessage: string | null | undefined,
    summaryMessage: string | null | undefined,
    validatorParameters: FluentValidatorConfig | undefined | null
): FluentValidatorBuilder
{
    if (thisFromCaller instanceof FluentValidatorBuilder) {
        thisFromCaller.add2(
            conditionType,
            conditionConfig,
            errorMessage,
            summaryMessage,
            validatorParameters
        );
        return thisFromCaller;
    }
    throw new FluentSyntaxRequiredError();
}
```

#### 1b. `FluentValidatorBuilder.add2`

Add a side-by-side `add2` method that treats `summaryMessage` the same way the current `add(...)` treats `errorMessage`.

```ts
public add2(
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig> | null,
    errorMessage: string | null | undefined,
    summaryMessage: string | null | undefined,
    validatorConfig: FluentValidatorConfig | undefined | null
): void
{
    let ivDesc: ValidatorConfig = validatorConfig ?
        { ...validatorConfig as ValidatorConfig } :
        { conditionConfig: null };

    if (errorMessage != null)
        ivDesc.errorMessage = errorMessage;

    if (summaryMessage != null)
        ivDesc.summaryMessage = summaryMessage;

    if (conditionConfig)
        ivDesc.conditionConfig = { ...conditionConfig as ConditionConfig };

    if (conditionType && ivDesc.conditionConfig)
        ivDesc.conditionConfig.conditionType = conditionType;

    let errorCode = resolveErrorCode(ivDesc);
    if (this.parentConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode))
        throw new CodingError(`ValueHost name "${this._parentConfig.name}" with errorCode ${errorCode} already defined.`);

    this.parentConfig.validatorConfigs!.push(ivDesc as ValidatorConfig);
}
```

#### 1c. Add a narrow helper for the common validator overload pattern

A small shared helper may be introduced to normalize the recurring validator overload pattern.

Its job is intentionally narrow. It only resolves the two validator-side call shapes:

* positional message lane: `errorMessage?`, `summaryMessage?`
* `ruleConfig` lane

It does **not** attempt to solve child-condition overloads or condition-family-specific logic.

```ts
interface FluentValidatorOverloadArgs<TConditionConfig> {
    conditionConfig?: TConditionConfig | null;
    errorMessage?: string | null;
    summaryMessage?: string | null;
    validatorParameters?: FluentValidatorConfig;
}

function resolveValidatorOverloadArgs<TConditionConfig>(
    arg2?: string | null | (FluentValidatorConfig & TConditionConfig),
    arg3?: string | null
): FluentValidatorOverloadArgs<TConditionConfig> {
    let conditionConfig: TConditionConfig | null | undefined;
    let errorMessage: string | null | undefined;
    let summaryMessage: string | null | undefined;
    let validatorParameters: FluentValidatorConfig | undefined;

    if (typeof arg2 === 'string' || arg2 === null || arg2 === undefined) {
        errorMessage = arg2;
        summaryMessage = arg3;
    }
    else if (typeof arg2 === 'object') {
        conditionConfig = arg2 as unknown as TConditionConfig;
        validatorParameters = arg2;
    }

    return {
        conditionConfig,
        errorMessage,
        summaryMessage,
        validatorParameters
    };
}
```

This helper is optional but recommended because the overload-interception block is strongly structured and will likely repeat across validator families.

#### Why side-by-side helpers are expected

The expectation is that existing validator code remains unchanged and continues to compile.

New validator work for CH-02 should use:

* `finishFluentValidatorBuilder2(...)`
* `add2(...)`

This allows validator families to be migrated one at a time.

### 2. Worked validator example: `equalToValue`

 `equalToValue` is the preferred example because it shows:

* overloads
* `summaryMessage`
* `ruleConfig`
* `_genDC...`

#### 2a. Add overloads to the interface

Add overloads to `FluentValidatorBuilder` through module augmentation.

```ts
declare module "./../Builder/Fluent"
{
    export interface FluentValidatorBuilder {
        equalToValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null
        ): FluentValidatorBuilder;

        equalToValue(
            secondValue: any,
            ruleConfig: FluentEqualToValueValidatorConfig
        ): FluentValidatorBuilder;
    }
}
```

#### 2b. Add overloads to the function and intercept overload parameters

Add the matching overloads to the function implementation and intercept the two call shapes.

**Without the helper**

```ts
function equalToValue(
    secondValue: any,
    errorMessage?: string | null,
    summaryMessage?: string | null
): FluentValidatorBuilder;
function equalToValue(
    secondValue: any,
    ruleConfig: FluentEqualToValueValidatorConfig
): FluentValidatorBuilder;
function equalToValue(
    secondValue: any,
    arg2?: string | null | FluentEqualToValueValidatorConfig,
    arg3?: string | null
): FluentValidatorBuilder
{
    let conditionConfig: FluentEqualToValueConditionConfig | null | undefined;
    let errorMessage: string | null | undefined;
    let summaryMessage: string | null | undefined;
    let validatorParameters: FluentValidatorConfig | undefined;

    if (typeof arg2 === 'string' || arg2 === null || arg2 === undefined) {
        errorMessage = arg2;
        summaryMessage = arg3;
    }
    else if (typeof arg2 === 'object') {
        conditionConfig = arg2 as unknown as FluentEqualToValueConditionConfig;
        validatorParameters = arg2;
    }

    return finishFluentValidatorBuilder2(
        this,
        ConditionType.EqualToValue,
        _genDCEqualToValue(secondValue, conditionConfig),
        errorMessage,
        summaryMessage,
        validatorParameters
    );
}
```

**With the helper**

```ts
function equalToValue(
    secondValue: any,
    errorMessage?: string | null,
    summaryMessage?: string | null
): FluentValidatorBuilder;
function equalToValue(
    secondValue: any,
    ruleConfig: FluentEqualToValueValidatorConfig
): FluentValidatorBuilder;
function equalToValue(
    secondValue: any,
    arg2?: string | null | FluentEqualToValueValidatorConfig,
    arg3?: string | null
): FluentValidatorBuilder
{
    const {
        conditionConfig,
        errorMessage,
        summaryMessage,
        validatorParameters
    } = resolveValidatorOverloadArgs<FluentEqualToValueConditionConfig>(arg2, arg3);

    return finishFluentValidatorBuilder2(
        this,
        ConditionType.EqualToValue,
        _genDCEqualToValue(secondValue, conditionConfig),
        errorMessage,
        summaryMessage,
        validatorParameters
    );
}
```

This preserves the existing extension-author pattern:

1. collect condition-specific inputs
2. call `_genDC...`
3. call `finishFluentValidatorBuilder2(...)`

The helper simply removes repeated overload-interception boilerplate without changing the overall pattern.

#### 2c. Expectations on `_genDCEqualToValue`

`_genDC...` remains the official place to build the final condition config.

The current `equalToValue` version is already close to what is needed:

```ts
export function _genDCEqualToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null
): EqualToValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as EqualToValueConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}
```

Expectations at this stage:

* `_genDC...` stays condition-specific
* no broader redesign of `_genDC...` is required yet
* the validator overload interception may pass the same `ruleConfig` object in two roles:

  * as `validatorParameters: FluentValidatorConfig`
  * as `conditionConfig: FluentEqualToValueConditionConfig` via cast
* this works when the validator-specific config type includes the optional condition properties with matching names

#### 2d. Write Jest tests for each parameter pattern

Write tests that cover the full parameter surface for `equalToValue`.

```ts
test('equalToValue supports positional message lane and ruleConfig lane', () => {
    let testItem1 = createFluent().field('Field1').equalToValue(10);
    let testItem2 = createFluent().field('Field1').equalToValue(10, 'Error');
    let testItem3 = createFluent().field('Field1').equalToValue(10, 'Error', 'Summary');
    let testItem4 = createFluent().field('Field1').equalToValue(10, null, 'Summary');
    let testItem5 = createFluent().field('Field1').equalToValue(10, null, null);
    let testItem6 = createFluent().field('Field1').equalToValue(10, {
        secondConversionLookupKey: LookupKey.Integer,
        errorMessage: 'Error',
        summaryMessage: 'Summary',
        errorMessagel10n: 'Errorl10n',
        summaryMessagel10n: 'Summaryl10n',
        severity: ValidationSeverity.Error,
        errorCode: 'alt code'
    });

    TestFluentValidatorBuilder(testItem1, <ValidatorConfig>{
        conditionConfig: <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 10
        }
    });

    TestFluentValidatorBuilder(testItem2, <ValidatorConfig>{
        conditionConfig: <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 10
        },
        errorMessage: 'Error'
    });

    TestFluentValidatorBuilder(testItem3, <ValidatorConfig>{
        conditionConfig: <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 10
        },
        errorMessage: 'Error',
        summaryMessage: 'Summary'
    });

    TestFluentValidatorBuilder(testItem4, <ValidatorConfig>{
        conditionConfig: <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 10
        },
        summaryMessage: 'Summary'
    });

    TestFluentValidatorBuilder(testItem5, <ValidatorConfig>{
        conditionConfig: <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 10
        }
    });

    TestFluentValidatorBuilder(testItem6, <ValidatorConfig>{
        conditionConfig: <EqualToValueConditionConfig>{
            conditionType: ConditionType.EqualToValue,
            secondValue: 10,
            secondConversionLookupKey: LookupKey.Integer
        },
        errorMessage: 'Error',
        summaryMessage: 'Summary',
        errorMessagel10n: 'Errorl10n',
        summaryMessagel10n: 'Summaryl10n',
        severity: ValidationSeverity.Error,
        errorCode: 'alt code'
    });
});
```

### 3. Short implementation notes

* Existing validator code remains unchanged.
* New validator work can migrate one family at a time.
* This is why side-by-side helper versions exist.
* The current extension-author pattern remains central:

  * `_genDC...` does the condition work
  * `finishFluentValidatorBuilder2(...)` finishes the wiring

### Design constraint

This change depends on **CH-01**.

The overload-based two-lane signature model is only attractive if IntelliSense can surface it clearly while preserving the current extensibility pattern.

Without CH-01, these signatures would likely need to collapse into broader single-signature implementations, reducing much of the usability benefit.

### CH-03 Formal change direction from KD-04 Proposal C: introduce value source selection before child conditions

This change promotes the child-condition source-selection portion of **KD-04 Proposal C** into a formal change direction.

It focuses on introducing a value-source-selection layer before child conditions, using the current preferred naming pair:

* `parentValue()`
* `fieldValue(valueHostName)`

It requires introducing new Builder classes, `SingleFieldConditionBuilder` and `MultiFieldConditionBuilder`, with a shared abstract base class `FieldConditionBuilderBase`, to host those methods. These Builders do not actually supply condition methods. That's still left to the output of `parentValue()` and `fieldValue(...)`, which is the existing `FluentConditionBuilder` and `FluentOneConditionBuilder`.

**Usage examples**

```ts
builder.field('field1').any((subject: MultiFieldConditionBuilder) => {
   subject.parentValue().equalToValue(10);
   subject.fieldValue('field2').equalToValue(20);
});
```

```ts
builder.field('field1').when(
    (whenSubject: SingleFieldConditionBuilder) => whenSubject.fieldValue('flag').equalToValue(true),
    (thenSubject: SingleFieldConditionBuilder) => thenSubject.parentValue().requireText()
);
```

Readability goals:

* `parent value is equal to 10`
* `field2 value is equal to 20`
* `flag value is equal to true, then parent value is required text`
* In documentation/examples for `when(...)`, prefer role-specific parameter names such as `whenSubject` and `thenSubject` instead of reusing `subject` twice.

**Coding guidance**

This section presents the work in implementation order, with concrete code examples.

### 1. Add `SingleFieldConditionBuilder` and `MultiFieldConditionBuilder` with an abstract base class

Keep these classes narrow. Their purpose is only to choose the source semantics for the next child condition builder.

Introduce an abstract base class with the required `Base` suffix. The public builders are:

* `SingleFieldConditionBuilder`
* `MultiFieldConditionBuilder`

The constructor parameter order is:

1. `parentConfig` — optional and may be `null`

```ts
export abstract class FieldConditionBuilderBase {
    public constructor(
        protected readonly parentConfig?: ConditionWithChildrenBaseConfig | null) {
    }

    public parentValue(): FluentConditionBuilder | FluentOneConditionBuilder {
        return this.createBuilder(null);
    }

    public fieldValue(valueHostName: ValueHostName): FluentConditionBuilder | FluentOneConditionBuilder {
        return this.createBuilder(valueHostName);
    }

    protected abstract createBuilder(valueHostName: ValueHostName | null): FluentConditionBuilder | FluentOneConditionBuilder;
}

export class SingleFieldConditionBuilder extends FieldConditionBuilderBase {
    public constructor(parentConfig?: ConditionWithChildrenBaseConfig | null) {
        super(parentConfig);
    }

    protected createBuilder(valueHostName: ValueHostName | null): FluentOneConditionBuilder {
        const config = this.parentConfig ? { ...this.parentConfig } : null;
        if (config && valueHostName != null)
            (config as any).valueHostName = valueHostName;
        return new FluentOneConditionBuilder(config);
    }
}

export class MultiFieldConditionBuilder extends FieldConditionBuilderBase {
    public constructor(parentConfig?: ConditionWithChildrenBaseConfig | null) {
        super(parentConfig);
    }

    protected createBuilder(valueHostName: ValueHostName | null): FluentConditionBuilder {
        const config = this.parentConfig ? { ...this.parentConfig } : null;
        if (config && valueHostName != null)
            (config as any).valueHostName = valueHostName;
        return new FluentConditionBuilder(config);
    }
}
```

The important design point is that these builders are not condition builders. They only choose whether the returned builder should:

* leave `valueHostName` unset
* or set it explicitly through the config object passed into the created builder

This keeps the hand-off aligned with the current fluent architecture, where builders are connected through config objects rather than by passing `valueHostName` as a separate constructor parameter.

### 2. Keep `FluentConditionBuilder` and `FluentOneConditionBuilder` construction config-based

Much of the work is how a parent validator or condition selects `FluentConditionBuilder` or `FluentOneConditionBuilder`.

To support `MultiFieldConditionBuilder`, do **not** introduce a new standalone constructor parameter for `valueHostName`.

The builders should continue to receive their connection/configuration through the same first parameter path they already use today. `MultiFieldConditionBuilder` should prepare that config object and pass it into the builder.

Representative current construction points that support this direction:

```ts
public conditions(config?: ConditionWithChildrenBaseConfig): FluentConditionBuilder
{
    let Builder = new FluentConditionBuilder(config ?? null);
    return Builder;
}
```

```ts
export class FluentFactory
{
    constructor()
    {
        this._validatorBuilderCreator =
            (vhConfig: FieldValueHostConfig) => new FluentValidatorBuilder(vhConfig);
        this._conditionBuilderCreator =
            (vhConfig: ConditionWithChildrenBaseConfig) => new FluentConditionBuilder(vhConfig);
    }
}
```

This means the design hand-off should stay config-based:

* `parentValue()` creates a builder using config that does **not** set `valueHostName`
* `fieldValue('field2')` creates a builder using config that **does** set `valueHostName = 'field2'`

This keeps source selection with emitted condition config, not with a new public constructor convention.

### 3. Update child-condition generator functions to create `MultiFieldConditionBuilder`

This is where the design really enters the code.

The current pattern creates a condition builder directly inside `_genDCWhen(...)`, `_genDCAny(...)`, and related helpers.
Those are the places that should now create either a `SingleFieldConditionBuilder` or a `MultiFieldConditionBuilder` instead, depending on the surrounding expectations.

#### Current `when` pattern

```ts
export function _genDCWhen(
    enablerBuilder: FluentOneConditionBuilderHandler,
    childBuilder: FluentOneConditionBuilderHandler): WhenConditionConfig {
    assertNotNull(enablerBuilder, 'enablerBuilder');
    assertFunction(enablerBuilder);
    assertNotNull(childBuilder, 'childBuilder');
    assertFunction(childBuilder);

    let fluentEnabler = new FluentOneConditionBuilder(null);
    enablerBuilder(fluentEnabler);
    let enablerConditionConfig = fluentEnabler.parentConfig.conditionConfigs[0] ?? {};

    let fluent = new FluentOneConditionBuilder(null);
    childBuilder(fluent);
    let conditionConfig = fluent.parentConfig.conditionConfigs[0] ?? {};
    return { enablerConfig: enablerConditionConfig, childConditionConfig: conditionConfig } as WhenConditionConfig;
}

function when(
    enablerBuilder: FluentOneConditionBuilderHandler,
    childBuilder: FluentOneConditionBuilderHandler): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.When, _genDCWhen(enablerBuilder, childBuilder));
}

function when(
    enablerBuilder: FluentOneConditionBuilderHandler,
    childBuilder: FluentOneConditionBuilderHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.When, _genDCWhen(enablerBuilder, childBuilder),
        errorMessage, validatorParameters);
}
```

#### Target `when` pattern

```ts
export function _genDCWhen(
    enablerBuilder: SingleFieldConditionBuilderHandler,
    childBuilder: SingleFieldConditionBuilderHandler): WhenConditionConfig {
    assertNotNull(enablerBuilder, 'enablerBuilder');
    assertFunction(enablerBuilder);
    assertNotNull(childBuilder, 'childBuilder');
    assertFunction(childBuilder);

    let enablerSubject = new SingleFieldConditionBuilder(null);
    let fluentEnabler = enablerBuilder(enablerSubject);
    let enablerConditionConfig = fluentEnabler.parentConfig.conditionConfigs[0] ?? {};

    let childSubject = new SingleFieldConditionBuilder(null);
    let fluent = childBuilder(childSubject);
    let conditionConfig = fluent.parentConfig.conditionConfigs[0] ?? {};
    return { enablerConfig: enablerConditionConfig, childConditionConfig: conditionConfig } as WhenConditionConfig;
}
```

The `when(...)` methods themselves stay light. The main change is in the generator helper.

### 4. Update `any`, `all`, and `countMatches` in the same way

The same pattern applies to the multi-child builders.

#### Current `any` pattern

```ts
export function _genDCAny(
    conditionsBuilder: FluentConditionBuilderHandler): AnyMatchConditionConfig {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);
    
    let fluent = new FluentConditionBuilder(null);
    conditionsBuilder(fluent);
    let conditionConfigs = fluent.parentConfig.conditionConfigs;
    return { conditionConfigs: conditionConfigs } as AnyMatchConditionConfig;
}

function any(
    conditionsBuilder: FluentConditionBuilderHandler): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.Any,  _genDCAny(conditionsBuilder));
}

function any(
    conditionsBuilder: FluentConditionBuilderHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.Any, _genDCAny(conditionsBuilder),
        errorMessage, validatorParameters);
}
```

#### Target `any` pattern

```ts
export function _genDCAny(
    conditionsBuilder: MultiFieldConditionBuilderHandler): AnyMatchConditionConfig {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);

    let subject = new MultiFieldConditionBuilder(null);
    let fluent = conditionsBuilder(subject);
    let conditionConfigs = fluent.parentConfig.conditionConfigs;
    return { conditionConfigs: conditionConfigs } as AnyMatchConditionConfig;
}
```

This same conversion pattern should be applied to:

* `_genDCAll(...)`
* `_genDCCountMatches(...)`
* `_genDCNot(...)`
* `_genDCWhen(...)`

### 5. Add new handler types

The callback types should reflect that callbacks now receive either a `SingleFieldConditionBuilder` or a `MultiFieldConditionBuilder`, not a condition builder directly.

Representative target shape:

```ts
type SingleFieldConditionBuilderHandler =
    (builder: SingleFieldConditionBuilder) => FluentOneConditionBuilder;

type MultiFieldConditionBuilderHandler =
    (builder: MultiFieldConditionBuilder) => FluentConditionBuilder;
```

Depending on how strictly you want typing to follow the one-condition vs many-condition split, this may later become two handler types. For now, the main design point is simply that the callback input changes.

### 6. Preserve current runtime semantics

The implementation should align with the current runtime behavior of conditions:

* when `valueHostName` is not set in the generated condition config, runtime evaluation uses the `ValueHost` passed into `evaluate(...)`
* when `valueHostName` is set, runtime evaluation uses the named `ValueHost`

So the first implementation goal is not to redesign runtime evaluation.

The first implementation goal is simply to make the builder emit child conditions that either:

* omit `valueHostName`
* or set `valueHostName`

### 7. Condition methods are not the first migration target

At this stage, do **not** start by redesigning all condition methods.

The first migration target is:

* introduce `MultiFieldConditionBuilder`
* route child-condition callbacks through it
* prove that generated condition configs correctly preserve inherited vs explicit source selection

Only after that should condition-method signatures be simplified by removing `valueHostName`.

### 8. Short implementation notes

* The names `parentValue()` and `fieldValue(...)` are chosen for readability, not because the builder literally carries runtime values.
* The preferred public builder names are `SingleFieldConditionBuilder` and `MultiFieldConditionBuilder`.
* They share an abstract base class `FieldConditionBuilderBase`.
* The preferred callback parameter name in docs and examples is `subject`.
* The core implementation concern is whether generated child condition configs omit or populate `valueHostName`.
* This change should preserve the existing callback model from KD-01.
* This change should make later condition-method cleanup much easier.

### CH-04 Formal change direction from KD-04 Proposal B/C: simplify `FluentConditionBuilder` signatures after source selection

This change promotes the child-condition signature portion of **KD-04 Proposal B/C** into a formal change direction.

It does **not** remove Proposal B/C from KD-04. KD-04 remains the design rationale and pattern library. This change section records the decision to begin treating condition-method signature cleanup as the next implementation target **after CH-03**.

**Scope**

This change applies to child-condition methods in:

* `FluentConditionBuilderExtensions.ts`
* the condition-side helper pipeline in `Fluent.ts`

It is focused on methods such as:

* `requireText(...)`
* `equalTo(...)`
* `equalToValue(...)`
* `range(...)`
* related condition methods on `FluentConditionBuilder` / `FluentOneConditionBuilder`

**Change summary**

For `FluentConditionBuilder` and `FluentOneConditionBuilder` methods:

* `valueHostName` is removed from condition method signatures
* source selection now comes from the parent-created condition builder/config path introduced by **CH-03**
* required condition properties remain positional parameters
* optional condition properties remain in condition-specific config objects
* `_genDC...` functions remain the condition-specific config generators

**Important clarification**

`valueHostName` is no longer passed in these method signatures because it now comes from the parent-created condition builder.

That means:

* the parent creates a condition builder whose emitted condition config already carries the intended `valueHostName`, or omits it
* the condition method itself no longer needs to accept `valueHostName`

This is a direct consequence of **CH-03**.

**Representative target shapes**

#### Condition has no required or optional condition properties

```ts
.requireText()
.requireText(conditionConfig)
```

#### Condition has required condition properties, but no optional condition properties

```ts
.range(min, max)
```

#### Condition has required and optional condition properties

```ts
.equalToValue(secondValue)
.equalToValue(secondValue, conditionConfig)
```

```ts
.equalTo(secondValueHostName)
.equalTo(secondValueHostName, conditionConfig)
```

These examples assume the field/value source was already chosen through CH-03, for example:

```ts
subject.parentValue().equalToValue(10);
subject.fieldValue('field2').equalToValue(20);
```

**Why this is now treated as a change**

* It removes the most awkward part of current child-condition signatures: trailing `valueHostName`
* It allows condition methods to focus on condition-specific inputs only
* It improves natural reading because the field/value source is chosen before the condition method
* It aligns the condition-side fluent API with the source-selection model introduced in CH-03

**Dependencies**

This change depends on:

* **CH-03** — source selection must already be handled by `SingleFieldConditionBuilder` / `MultiFieldConditionBuilder`

Without CH-03, `valueHostName` would still need to be expressed in condition method signatures.

**Likely source files impacted**

Based on the current implementation shape, the main files likely to change are:

* `FluentConditionBuilderExtensions.ts`
* `Fluent.ts`

`FluentConditionBuilderExtensions.ts` is the primary implementation point because it currently:

* declares the child-condition method signatures through module augmentation
* attaches the implementation functions to `FluentConditionBuilder.prototype`
* contains the implementation signatures that currently accept `valueHostName`

`Fluent.ts` is likely to change because it currently defines:

* `finishFluentConditionBuilder(...)`
* `FluentConditionBuilder`
* `FluentOneConditionBuilder`
* callback handler types and builder plumbing used by child-condition flows

**Status**

* Accepted as a formal change direction for child-condition method signatures
* Not yet implemented broadly
* Still subject to refinement before code changes begin

**Coding guidance**

This section presents the work in implementation order, with concrete examples.

### 1. Update `finishFluentConditionBuilder(...)`

Current code:

```ts
export function finishFluentConditionBuilder(thisFromCaller: any, 
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig>,
    valueHostName?: ValueHostName): FluentConditionBuilder
{
    if (thisFromCaller instanceof FluentConditionBuilder) {
        if (valueHostName)
            (conditionConfig as OneValueConditionBaseConfig).valueHostName = valueHostName;

        thisFromCaller.add(conditionType, conditionConfig);
        return thisFromCaller;
    }    
    throw new FluentSyntaxRequiredError();
}
```

Under CH-04, this helper should no longer expect `valueHostName` as a method parameter.

Instead, it should rely on the parent-created builder/config path established by CH-03.

Representative target direction:

```ts
export function finishFluentConditionBuilder2(
    thisFromCaller: any,
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig>): FluentConditionBuilder
{
    if (thisFromCaller instanceof FluentConditionBuilder) {
        thisFromCaller.add(conditionType, conditionConfig);
        return thisFromCaller;
    }
    throw new FluentSyntaxRequiredError();
}
```

The key point is:

* the condition method no longer passes `valueHostName`
* the builder/config produced earlier already determines whether `valueHostName` is present in the emitted config

### 2. Update condition method signatures and implementations

Unlike CH-02, condition methods do not need overload pairs here.

The condition-side pattern has one strict lane:

* required condition parameters first
* optional `conditionConfig` second

So the implementation should prefer a single signature with optional-parameter syntax.

#### 2a. `requireText(...)`

Current shape:

```ts
function requireText(
    conditionConfig?: FluentRequireTextConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.RequireText, _genDCRequireText(conditionConfig), valueHostName);
}
```

Target direction:

```ts
declare module "./../Builder/Fluent"
{
    export interface FluentConditionBuilder {
        requireText(
            conditionConfig?: FluentRequireTextConditionConfig | null): FluentConditionBuilder;
    }
}
```

```ts
function requireText(
    conditionConfig?: FluentRequireTextConditionConfig | null): FluentConditionBuilder {
    return finishFluentConditionBuilder2(
        this,
        ConditionType.RequireText,
        _genDCRequireText(conditionConfig)
    );
}
```

#### 2b. `equalToValue(...)`

Current shape:

```ts
function equalToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.EqualToValue, _genDCEqualToValue(secondValue, conditionConfig), valueHostName);
}
```

Target direction:

```ts
declare module "./../Builder/Fluent"
{
    export interface FluentConditionBuilder {
        equalToValue(
            secondValue: any,
            conditionConfig?: FluentEqualToValueConditionConfig | null): FluentConditionBuilder;
    }
}
```

```ts
function equalToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null): FluentConditionBuilder {
    return finishFluentConditionBuilder2(
        this,
        ConditionType.EqualToValue,
        _genDCEqualToValue(secondValue, conditionConfig)
    );
}
```

#### 2c. `equalTo(...)`

Current shape:

```ts
function equalTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig), valueHostName);
}
```

Target direction:

```ts
declare module "./../Builder/Fluent"
{
    export interface FluentConditionBuilder {
        equalTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentEqualToConditionConfig | null): FluentConditionBuilder;
    }
}
```

```ts
function equalTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null): FluentConditionBuilder {
    return finishFluentConditionBuilder2(
        this,
        ConditionType.EqualTo,
        _genDCEqualTo(secondValueHostName, conditionConfig)
    );
}
```

### 3. `_genDC...` functions remain central

As on the validator side, `_genDC...` functions remain the official place to build the final condition config.

That means CH-04 does **not** redesign `_genDC...` broadly.

Instead:

* the method overloads normalize parameters
* `_genDC...` builds the condition config
* `finishFluentConditionBuilder2(...)` finishes the wiring

### 4. Write Jest tests for each parameter pattern

Tests should now verify both:

* the simplified parameter patterns
* the inherited-vs-explicit source behavior established by CH-03

Representative examples:

```ts
test('parentValue equalToValue uses inherited runtime source', () => {
    let testItem = createFluent().field('Field1').any(
        (subject: MultiFieldConditionBuilder) => subject.parentValue().equalToValue(10)
    );

    // expectation:
    // conditionConfig.secondValue = 10
    // conditionConfig.valueHostName is omitted
});
```

```ts
test('fieldValue equalToValue writes explicit valueHostName', () => {
    let testItem = createFluent().field('Field1').any(
        (subject: MultiFieldConditionBuilder) => subject.fieldValue('Field2').equalToValue(20)
    );

    // expectation:
    // conditionConfig.secondValue = 20
    // conditionConfig.valueHostName = 'Field2'
});
```

```ts
test('requireText supports no-arg and config parameter forms', () => {
    let testItem1 = createFluent().field('Field1').any(
        (subject: MultiFieldConditionBuilder) => subject.parentValue().requireText()
    );

    let testItem2 = createFluent().field('Field1').any(
        (subject: MultiFieldConditionBuilder) => subject.parentValue().requireText({ trim: true })
    );

    // expectations:
    // requireText no-arg works
    // requireText config parameter works
});
```

### 5. Migration order

Do the condition-side migration in this order:

1. introduce CH-03 source-selection builders
2. update `finishFluentConditionBuilder(...)`
3. migrate representative condition methods:

   * `requireText`
   * `equalToValue`
   * `equalTo`
4. expand to the rest of `FluentConditionBuilderExtensions.ts`
5. add tests for overloads and source semantics

### 6. Short implementation notes

* `valueHostName` is no longer a condition-method parameter concern
* it now comes from the parent-created builder/config path
* the condition-side fluent methods should become noticeably cleaner after this change
* this is the main payoff of CH-03 for `FluentConditionBuilderExtensions`
