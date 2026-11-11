# Calculated FieldValueHost Implementation Design

## Status

This document records the implemented calculated-`FieldValueHost` design and its current behavior. API names and implementation choices below are as-built unless marked as a known limitation.

The high-level rationale and use cases are in [Calculated FieldValueHost Design](./Calculated_FieldValueHost_Design.md). User-facing API documentation remains a separate follow-up.

## Use Cases

1. **Business calculation displayed by a form.** Business rules define a `CalcValueHost` for the difference between two dates. A form adds a field that displays its result. Changing either source field causes the calculated display to refresh.
2. **Calculated result with validation.** The form attaches validators to the calculated field, such as a maximum of 30 days. The result can be displayed along with its validation issue.
3. **Undetermined result.** A missing or unparseable source causes the calculation to return `undefined`. With formatting enabled, the native value and stored text become `undefined`, and the editor displays a localized field-specific message or an empty string.
4. **Read-only editor choices.** The result can be shown in a `span` registered with the existing `editor` role or in a text input whose native `readonly` behavior is supported. The field rejects setter calls unless the caller explicitly passes `overrideReadOnly: true`.
5. **Initial calculation.** After source values are initialized, a manager operation computes and publishes the calculated field, including an initial `undefined` result.
6. **Model output control.** The developer can use a `writerRule` to omit a calculated field from model output, or allow the result to be written when desired.
7. **Ordinary `setValue(undefined)`.** With formatting enabled, a writable field receiving `setValue(undefined)` clears its stored text and notifies text listeners if the text changed or `reset: true` was supplied, unless the callback is skipped.

## Scope and Design Constraints

- The destination remains a normal `FieldValueHost`; its configuration names an existing `CalcValueHost`.
- The calculation's dependencies are manually configured. Auto-population, journaling, and wrapper lookup functions are deferred.
- Existing calc functions remain lazy when their `getValue()` is called.
- Changes to static values after initialization are not promised to trigger recalculation in the initial version.
- Calculated fields are read-only to setter calls unless the caller explicitly supplies the public `overrideReadOnly: true` option. No inverse calculation is included.
- Undefined display text is configured on the field only, localized when a compatible adapter is created, and is not stored as field text.
- No global undefined-text defaults or adapter-definition defaults are introduced.
- The owner will address accidental self-calling calculations and stack overflow protection in `CalcValueHost`; see the separate work item below.

## Configuration Example

```ts
// Business rules
builder.field("StartDate", LookupKey.Date);
builder.field("EndDate", LookupKey.Date);
builder.calc({
    name: "DiffDays",
    dataType: LookupKey.Integer,
    calcFn: differenceBetweenDates,
    dependencyValueHostNames: ["StartDate", "EndDate"]
});

// Form adaptation
adapter.field("DiffDaysDisplay", LookupKey.Integer, {
    label: "Days apart",
    calculation: {
        sourceValueHostName: "DiffDays",
        textForUndefined: "Dates needed",
        textForUndefinedl10n: "DiffDays.DatesNeeded"
    },
    writerRule: { when: "always", then: "skip" }
})
.lessThanOrEqual(30);
```

`DiffDays` is available to business logic and conditions. `DiffDaysDisplay` owns the formatted display, field validation, and UI notifications. The field, not the calc, is reported to field callbacks when its value is updated.

## Engine Types

### `ValueHostBase` and `IValueHost`

Calculated `FieldValueHost` instances must reject setter calls unless the caller explicitly opts into overriding read-only state.

`IValueHost.readOnly` and `SetValueOptions.overrideReadOnly` provide this behavior:

```ts
interface IValueHost {
    readonly readOnly: boolean;
}

interface SetValueOptions {
    /**
     * When true, the setter proceeds even though readOnly is true.
     * It does not bypass the disabled check; overrideDisabled and ensureEnabled still apply.
     * Public escape hatch; a caller can replace a calculated result until its next calculation.
     */
    overrideReadOnly?: boolean;
}
```

The check belongs beside the existing disabled check in `ValueHostBase.canChangeValueCheck()`, which already handles `overrideDisabled`, so all setters share it. A rejected call logs at Info level and takes no other action. The option is public: users rarely need it, and the documentation explains its effect, including that a reader or editor passing it can replace a calculated field's value.

### `CalcValueHostConfig` and `ICalcValueHost`

The source `CalcValueHost` exposes configured dependency names so the consuming `FieldValueHost` can respond to relevant value changes.

Current definitions: [`CalcValueHost.ts` interface](../packages/jivs-engine/src/Interfaces/CalcValueHost.ts).

The dependency list is configured through `CalcValueHostConfig`:

```ts
interface CalcValueHostConfig {
    dependencyValueHostNames?: string[];
}

interface ICalcValueHost {
    readonly dependencyValueHostNames: readonly string[] | undefined;
}
```

- List names for every field whose value the calculation depends on, including all conditional branches.
- The field uses the list to decide whether a source-change notification requires recalculation.
- The getter returns `undefined` when the configured list is absent or empty.
- Names are matched case-sensitively. The engine does not validate the dependency names against the calculation function's actual reads.
- Added a new parameter to ValueHostConfigBuilder.calc(name, datatype, fn, dependencyValueHostsName).

### `CalcValueHost`

`CalcValueHost.getValue()` evaluates the configured function on each read and has a re-entrancy guard. The owner has a separate investigation of accidental self-calling calculations and stack overflow; that work is distinct from the FieldValueHost dependency-notification behavior described here.

### `FieldValueHostConfig`, `IFieldValueHost`, and `FieldValueHost`

The `FieldValueHostConfig.calculation` object names the source calc and optionally supplies undefined-result text and a localization key. `calculation: null` disables the feature.

```ts
interface FieldCalculationConfig {
    sourceValueHostName: string;
    textForUndefined?: string;
    textForUndefinedl10n?: string;
}

interface FieldValueHostConfig {
    calculation?: FieldCalculationConfig | null;
}

interface IFieldValueHost {
    readonly readOnly: boolean;
    readonly isCalculated: boolean;
    calculate(options: FieldValueHostSetValueOptions, valueHostIdThatChanged?: ValueHostName): boolean;
}
```

The `calculate()` function attempts to calculate and update the FieldValueHost's value.
1. It is called from:
    a. `otherValueHostChangedNotification()`, before the base validation notification, so the calculated result is current when subsequent validation runs.
    b. `ValueHostsManager.valuesInitialized()`.
2. It is not called from `getValue()` or `getTextValue()`; those return the field's last stored result.
3. Call it manually if needed.
4. It takes no action and returns `false` if the calculation feature is not set up.
5. If `valueHostIdThatChanged` is assigned, the source calc must have a dependency list containing that name; otherwise the field does not recalculate.

`IValueHost.readOnly` normally reports `false`. A field with a configured nonempty `sourceValueHostName` reports `true`. It stays `true` during the calculation's own update, which passes `overrideReadOnly`. The option is public and users may pass it; it does not bypass the disabled check.

The public `isCalculated` property is true when `FieldValueHostConfig.calculation.sourceValueHostName` is a nonempty string.

`calculation` may be `null` to disable the feature. The field's usual `dataType`, formatter, validator, label, element identifier, reader rule, and writer rule remain separate from the calculation child configuration.

### `FieldValueHost`: Read-Only Setters and Calculation Application

Current implementation: [`FieldValueHost.ts`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts); native `setValue()` is currently inherited from [`ValidatableValueHostBase.ts`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts).

Implemented behavior:

- Check `readOnly` at the start of `setValue()`, `setTextValue()`, and `setValues()` unless `options.overrideReadOnly` is true; reject with an Info-level log and no change to values, validation state, change tracking, or callbacks.
- `setValueToUndefined()` delegates to `setValue(undefined)` and is rejected as well, unless it passes `overrideReadOnly`.
- Resolve the named calc, call `getValue()`, and call the existing `setValue()` path with `overrideReadOnly: true`. `readOnly` is never toggled.
- The internal formatting path carries the override through to `setValues()`.
- Callbacks run as part of the existing setter flow. Because `readOnly` stays true, a callback calling a setter without the option is rejected.
- Preserve `isEnabled` as a separate concept: read-only fields can be enabled and validated.
- A missing or non-`CalcValueHost` source is reported at calculation time through an Error-level configuration log. A disabled field does not apply the calculation.

The calculation update uses the existing `setValue()` path with `overrideReadOnly: true`.

Source-change calculations pass the source notification's `revalidate` value as the setter's `validate` option. Initialization uses `validate: false` and `reset: true`, followed by manager preliminary validation. Repeated equal results are still published when `reset: true` is used.

### `FieldValueHost`: Responding to Source Changes

Override `otherValueHostChangedNotification()` in the field:

```ts
public override otherValueHostChangedNotification(
    changedName: ValueHostName,
    revalidate: boolean
): void {
    this.calculate(revalidate, changedName);
    super.otherValueHostChangedNotification(changedName, revalidate);
}
```

The calculation runs before the base method's validation-dependency processing, including when validation has not run yet. This ensures subsequent validation uses the refreshed result and preserves the base method's validation behavior.

```ts
interface FieldValueHostSetValueOptions
{
    suppressNotifications?: boolean;
}
```
When `suppressNotifications` is true, the field does not call `ValueHostsManager.notifyOtherValueHostsOfValueChange()`. Readers use this option while loading values so calculations run at completion rather than on intermediate values. This option is separate from `skipValueChangedCallback`, which controls public value/text callbacks.

### `IValueHostsManager` and `ValueHostsManager`

Current definitions: [`IValueHostsManager`](../packages/jivs-engine/src/Interfaces/ValueHostsManager.ts) and [`ValueHostsManager`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts).

```ts
interface IValueHostsManager {
    valuesInitialized(): void;
}
```
`valuesInitialized()` calculates every calculated field in manager enumeration/configuration order, using `validate: false`, `suppressNotifications: true`, and `reset: true`, then calls `validate({ preliminary: true })`. Reset causes configured value/text callbacks to publish each calculated result, including an already-undefined or unchanged result.

Readers suppress notifications while loading values and call `valuesInitialized()` at completion by default. `ReaderOptions.initializingValues: false` skips this completion step. Manual initialization should call it after supplying values.

**Known limitation:** calculated fields are evaluated in manager enumeration/configuration order, not topologically sorted. A consumer configured before a calculated provider can therefore retain a stale initial value. This is acknowledged and will be revisited; the current behavior is covered by a test.

Partial DOM replacement is safe with this behavior. Recalculating all calculated fields republishes their current values to existing editors as well as replaced editors; no suppression or per-editor scoping is required.

### `ReaderBase`, Model Readers, and `EditorReader`

Relevant implementations: [`ReaderBase`](../packages/jivs-engine/src/ReaderWriter/ReaderBase.ts), [`EditorReader`](../packages/jivs-dom/src/Editors/EditorReader.ts), and [`ServerPageValuesReader`](../packages/jivs-dom/src/Editors/ServerPageValuesReader.ts).

Reader initialization:

```text
Read source value -> setValue(value, { suppressNotifications: true})
Completed  -> ValueHostsManager.valuesInitialized()
```

`ReaderBase.read()` suppresses notifications while setting values and calls `valuesInitialized()` after reading by default. Preliminary validation and initial calculated-field publication are part of that completion step. Set `initializingValues: false` to skip it.

Models may contain a property matching the calculated FieldValueHost, and readers may attempt to write it. The read-only setter guard rejects such a write and logs it. Readers do not have to skip calculated fields; this preserves their existing enumeration and filtering behavior.

`EditorReader` may suppress public value callbacks while reading editor values. At completion, `valuesInitialized()` calculates and publishes calculated-field results according to its reset semantics. `ServerPageValuesReader` retains its existing captured-state behavior.

### Writers and ValueAdapterService

The built-in `always` WhenFunction in `ValueAdapterService` returns true for every value. It allows users to omit a calculated field from model output:

```ts
adapter.field("DiffDaysDisplay", LookupKey.Integer, {
    label: "Days apart",
    calculation: {
        sourceValueHostName: "DiffDays",
        textForUndefined: "Dates needed",
        textForUndefinedl10n: "DiffDays.DatesNeeded"
    },
    writerRule: { when: "always", then: "skip" }
})
.lessThanOrEqual(30);
```

Current implementation: [`ValueAdapterService`](../packages/jivs-engine/src/Services/ValueAdapterService.ts); rule definitions: [`ValueAdapterService` interfaces](../packages/jivs-engine/src/Interfaces/ValueAdapterService.ts).

Existing `skip` and `omit` ThenFunctions can be used:

```ts
writerRule: { when: "always", then: "skip" }
```

The `always` rule is not calculated-field-specific. No additional writer policy is required for calculated fields.

## Undefined Native Value and Text Notifications

### Implemented Contract

For a writable field:

```text
Before: native = 42, stored text = "42", editor displays "42"
Call:   setValue(undefined)
After:  native = undefined, stored text = undefined
Event:  onTextValueChanged reports the text change
Editor: receives undefined and clears or displays its configured fallback
```

When formatting is enabled, `setValue(undefined)` delegates to `setValues(undefined, undefined)` without invoking a formatter. The callback receives the previous text and is invoked when the text changes or `reset: true` is supplied, if configured and not suppressed by `skipValueChangedCallback`. Without reset, repeated calls and initial calls with already-undefined text do not trigger it. The same applies to calculation-driven updates and `setValueToUndefined()`.

The formatting opt-outs (`disableFormatter`, `formatterLookupKey: null`, and `disableFormattingOnValueChange`) retain their existing behavior: only the native value changes, stored text remains unchanged, and no text callback is sent. An inactive formatter service is not an opt-out for undefined: no formatter is needed to clear the text.

This is not a change to parsing: `setValues(undefined, enteredText)` can represent an invalid user entry and must retain and display that entry. Formatter-error behavior for defined native values should not be changed inadvertently.

### Text Callback and Dispatcher

The existing [`TextValueChangedHandler`](../packages/jivs-engine/src/Interfaces/FieldValueHost.ts) receives the field and old text. The existing text dispatcher reads the new value with `getTextValue()`, so clearing stored text avoids needing an additional display payload or dispatcher API change.

### Initial Display, `EditorWriter`, and Restored State

When formatting is enabled, writers and broadcast paths can read the stored `undefined` text; no separate display-state marker is needed for this transition. `reset: true` publishes an already-undefined result if callbacks are attached and not suppressed. The text value for a genuine parse error remains the user's entered text even when the native value is `undefined`.

Formatting opt-outs deliberately retain the previous text, including for calculated fields, and therefore may display that text or expose it to text-based validation. Placeholder text is supplied by the text adapter and is never stored as field data.

## DOM Display Integration

### `ITextValueAdapter` and Compatible Implementations

Current interface: [`ITextValueAdapter`](../packages/jivs-dom/src/Interfaces/Adapters.ts).

The optional undefined-display behavior is implemented by `PlaceholderTextValueAdapter`. Its constructor calls `FieldValueHost.textForUndefinedCalculationValue()` once and caches the result; `writeTextValue(undefined)` writes that text, while other adapters are unchanged. Localization occurs using the manager's active culture and the field's fallback text. For example, the configured field values are:

```ts
calculation: {
    sourceValueHostName: "DiffDays",
    textForUndefined: "Dates needed",
    textForUndefinedl10n: "DiffDays.DatesNeeded"
}
```

`FieldValueHost.textForUndefinedCalculationValue()` returns the localized value, falls back to `textForUndefined`, and returns `""` when neither is available. The localized result is resolved when the adapter is created; live culture changes do not update an already-created adapter. Checkbox, radio, and select adapters are not changed to interpret placeholder text as a selection value.

### Editor Adapter Definitions and Localization

[`PlaceholderAdapterDefinition`](../packages/jivs-dom/src/EditorAdapterDefinitions/PlaceholderAdapterDefinition.ts) creates the `PlaceholderTextValueAdapter`, which receives the field and resolves its display text through the field accessor. Other adapter definitions are not required to participate.

The placeholder adapter definition is registered in the starter DOM configuration and the UI demos. It is not a generic default for all editor configurations; applications must register it in their DOM setup when using span editors.

### Span Editor Adapter Definition

The implemented placeholder adapter definition and text adapter support:

```html
<span data-jivs-role="editor" data-field="DiffDaysDisplay"></span>
```

- `matches()` recognizes a supported tag (by default, `span`) whose text content is empty or whitespace when initially identifying the editor.
- The text adapter writes using `textContent` and supports the localized undefined string.
- Attach no input/change handlers; `sendValue()` is a no-op, including when `EditorReader` calls it.
- Use the `PlaceholderPresentation` field presentation and participate in the ordinary field validation presentation path.
- Register the definition in application DOM configuration; the starter setup and UI demos do this.

The match rule is for initial editor identification. Once installed, the element's adapter association is retained; its populated text does not need to satisfy the initial match again. The adapter writes with `textContent`, replacing child nodes.

### `InputAdapterDefinition`

`HtmlFormControlFieldPresentationBase` adds the `readonly` attribute when the field is read-only, unless presentation options disable this behavior. This is meaningful for controls such as text inputs and textareas; other subclasses, including select and checkbox presentations, do not become non-editable merely because the attribute is present. Document and use a `span` or a control that actually supports native `readonly` for calculated display.

This is UI behavior, not the enforcement mechanism. Custom adapter definitions are not required to check readonly in event handlers; the field's setters reject their writes.

## Tests and Documentation

Focused engine tests cover dependency handling, calculated-field updates and notifications, formatting and validation, read-only setters and `overrideReadOnly`, undefined results, `valuesInitialized()`, and Reader integration. DOM tests cover the placeholder adapter, presentation, and its non-editable behavior. The `always` WhenFunction has ValueAdapterService tests. Consult [Testing Approach](./Testing_Approach.md) before changing tests.

User-facing documentation remains a separate follow-up. Update [ValueHosts Home](../docs/API/ValueHosts/Home.md), [Using CalcValueHost](../docs/API/ValueHosts/Using_CalcValueHost.md), [Getting and Setting Values](../docs/API/ValueHosts/Getting_and_Setting_Values.md), and DOM setup/examples to document the implemented API and behavior.

## Known Limitations and Follow-Up

1. Revisit initial ordering for calculated-field chains. The current manager evaluates in configuration order; it does not topologically sort providers and consumers.
2. Static-value changes after initialization are not guaranteed to trigger recalculation.
3. The placeholder adapter caches localized undefined text when it is created; live culture changes do not refresh it.
4. The owner separately investigates accidental self-calling calculations and stack overflow in `CalcValueHost`. This is distinct from reactive propagation cycles.
