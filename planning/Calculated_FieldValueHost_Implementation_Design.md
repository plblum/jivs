# Calculated FieldValueHost Implementation Design

## Status

This document translates the discussion in [Calculated FieldValueHost Design](./Calculated_FieldValueHost_Design.md) into a proposed implementation. It is intended for review before coding. Type, member, and parameter names in the proposed APIs are illustrative and can change.

The desired behavior is established in the use cases and contracts below. Implementation choices marked **open** need further discussion; examples showing possible signatures do not claim those APIs already exist.

## Use Cases

1. **Business calculation displayed by a form.** Business rules define a `CalcValueHost` for the difference between two dates. A form adds a field that displays its result. Changing either source field causes the calculated display to refresh.
2. **Calculated result with validation.** The form attaches validators to the calculated field, such as a maximum of 30 days. The result can be displayed along with its validation issue.
3. **Undetermined result.** A missing or unparseable source causes the calculation to return `undefined`. With formatting enabled, the native value and stored text become `undefined`, and the editor displays a localized field-specific message or an empty string.
4. **Read-only editor choices.** The result can be shown in a `span` registered with the existing `editor` role or in a readonly text input. The field rejects external value-setting calls regardless of the editor used.
5. **Initial calculation.** After source values are initialized, a manager operation computes and publishes the calculated field, including an initial `undefined` result.
6. **Model output control.** The developer can use a `writerRule` to omit a calculated field from model output, or allow the result to be written when desired.
7. **Ordinary `setValue(undefined)`.** With formatting enabled, a writable field receiving `setValue(undefined)` clears its stored text and notifies text listeners if the text changed or `reset: true` was supplied, unless the callback is skipped.

## Scope and Design Constraints

- The destination remains a normal `FieldValueHost`; its configuration names an existing `CalcValueHost`.
- The calculation's dependencies are manually configured. Auto-population, journaling, and wrapper lookup functions are deferred.
- Existing calc functions remain lazy when their `getValue()` is called.
- Changes to static values after initialization are not promised to trigger recalculation in the initial version.
- Calculated fields are read-only to ordinary setter calls; no user-editable override or inverse calculation is included.
- Undefined display text is configured on the field only, localized when a compatible adapter is created, and is not stored as field text.
- No global undefined-text defaults or adapter-definition defaults are introduced.
- The owner will address accidental self-calling calculations and stack overflow protection in `CalcValueHost`; see the separate work item below.

## Illustrative Configuration

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

Problem: setValue variations need a way to prevent execution when the ValueHost expects a readonly situation.

Solution: introduce IValueHost.readOnly property and implement it in the various setValue functions as a way to stop without taking any action.

```ts
interface IValueHost {
    readonly readOnly: boolean;
}

interface SetValueOptions {
    /**
     * When true, the setter proceeds even though readOnly is true.
     * It does not bypass the disabled check; overrideDisabled and ensureEnabled still apply.
     * Rarely needed. Documentation must explain its impact.
     */
    overrideReadOnly?: boolean;
}
```

The check belongs beside the existing disabled check in `ValueHostBase.canChangeValueCheck()`, which already handles `overrideDisabled`, so all setters share it. A rejected call logs at Info level and takes no other action. The option is public: users rarely need it, and the documentation explains its effect, including that a reader or editor passing it can replace a calculated field's value.

### `CalcValueHostConfig` and `ICalcValueHost`

Problem: Expose a list of valuehostnames that are consumed by the calculation to the FieldValueHost so its otherValueHostChangedNotification method can listen for changes to values on any of those field names.

Solution: Expose a property on CalcValueHostConfig where the user supplies a dependency list.

Current definitions: [`CalcValueHost.ts` interface](../packages/jivs-engine/src/Interfaces/CalcValueHost.ts).

Add a manually supplied dependency list and expose it on the calc:

```ts
// Proposed members only.
interface CalcValueHostConfig {
    dependencyValueHostNames?: string[];
}

interface ICalcValueHost {
    readonly dependencyValueHostNames: readonly string[] | undefined;
}
```

- List names for every field whose value the calculation depends on, including all conditional branches.
- The field uses the list to decide whether a source-change notification requires recalculation.
- Returns undefined if the config.dependencyValueHostNames is [].
- No validation performed on the names. The consumer will learn of problems by consuming the name.

### `CalcValueHost`

Work: Implement changes to ICalcValueHost.

Problem: Calculations can invoke themselves when using getValue, including nested calculations. 

Solution: Ensure no re-entrancy happens in any CalcValueHost.getValue call. 

Current implementation: [`CalcValueHost.ts`](../packages/jivs-engine/src/ValueHosts/CalcValueHost.ts).

- Problem was already resolved in existing code with the _reentrantCount private field.

### `FieldValueHostConfig`, `IFieldValueHost`, and `FieldValueHost`

**Problem 1**: User needs a way to express that the `FieldValueHost` gets its value from a `CalcValueHost`.

**Solution 1**: Introduce FieldValueHostConfig.calculation where its sourceValueHostName property indicates the CalcValueHost.

**Problem 2**: Calculations are a readonly situation. Calls to setValue, setValues, and setTextValues break this.

**Solution 2**: When enabled, ensure that setValue, setValues, and setTextValues functions take no action (other that logging) by changing the new IValueHost.readOnly property to true. The calculation itself writes with `SetValueOptions.overrideReadOnly = true`.

**Problem 3**: Calculations need to run when any dependent valuehost has a value changed.

**Solution 3**: We already have a notification system for any valuehost that changes. When in calc mode, FieldValueHost will determine if there is a match between its CalcValueHost's dependency field names and the valuehost that changed. If so, that reruns the calculation and writes its value using setValue.

**Problem 4**: Jivs-dom needs a way to refresh an editor when setValue(undefined) is supplied.

**Solution 4a**: With formatting enabled, have `FieldValueHost.setValue(undefined)` set both values to `undefined`, invoking `onTextValueChanged` when text changes or `reset: true` is supplied.

**Solution 4b**: Supply localized text that can appear instead of leaving the existing value unchanged through properties on the `FieldValueHostConfig`. Its ultimate destination is in `EditorAdapterDefinition.createTextValueAdapter` and individual `TextValueAdapters`.

Current definitions: [`FieldValueHost.ts` interface](../packages/jivs-engine/src/Interfaces/FieldValueHost.ts).

```ts
// Proposed members only.
interface FieldCalculationConfig {
    sourceValueHostName: string;
    textForUndefined?: string;
    textForUndefinedl10n?: string;
}

interface FieldValueHostConfig {
    calculation?: FieldCalculationConfig;
}

interface IFieldValueHost {
    readonly readOnly: boolean;
    readonly isCalculated: boolean;
    calculate(options: FieldValueHostSetValueOptions, valueHostIdThatChanged?: ValueHostName): boolean;
}
```

The calculate() function will attempt to calculate and update the FieldValueHost's value.
1. It is called from:
    a. otherValueHostChangedNotification(), which is triggered by another ValueHost having its value  changed. This ensure that the value is updated after a dependency changed. See below.
    b. ValueHostsManager.valuesInitialized()
2. It is not called from getValue or getTextValue. Those depend on the existing value.
3. Call it manually if needed.
4. **PENDING** Determine if there are any other places we can automatically call it such that getValue and getTextValue provide an up-to-date result. Or determine if we should wire it into getValue/getTextValue.
5. It will take no action and return false if the calculation feature is not setup.
6. When _valueHostIdThatChanged_ parameter is assigned, only calculate if the dependency list is setup and contains a match (case sensitive).

The public `readOnly` property normally reports `false`. A field with a configured calculation reports `true`. It stays `true` during the calculation's own update, which instead passes `overrideReadOnly`. Whether the property belongs on `IFieldValueHost` alone or a broader interface, and whether non-calculated fields can configure it, are open API questions.

The public `isCalculated` property is only true when calculations are setup: FieldValueHostConfig.calculation?.sourceValueHostName is assigned.

The field's usual `dataType`, formatter, validator, label, element identifier, reader rule, and writer rule remain separate from the calculation child configuration.

### `FieldValueHost`: Read-Only Setters and Calculation Application

Current implementation: [`FieldValueHost.ts`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts); native `setValue()` is currently inherited from [`ValidatableValueHostBase.ts`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts).

Required behavior:

- Check `readOnly` at the start of `setValue()`, `setTextValue()`, and `setValues()` unless `options.overrideReadOnly` is true; reject with an Info-level log and no change to values, validation state, change tracking, or callbacks.
- `setValueToUndefined()` delegates to `setValue(undefined)` and is rejected as well, unless it passes `overrideReadOnly`.
- Resolve the named calc, call `getValue()`, and call the existing `setValue()` path with `overrideReadOnly: true`. `readOnly` is never toggled, so no restoration is needed after an exception.
- The internal formatting path calls `setValues()` with the same options object, so the override carries through. Verify with a test.
- Callbacks run as part of the existing setter flow. Because `readOnly` stays true, a callback calling a setter without the option is rejected.
- Preserve `isEnabled` as a separate concept: read-only fields can be enabled and validated.
- Log or report missing or wrong-type calculation sources explicitly; exact error timing and policy are open.

Illustrative update, omitting unresolved options:

```ts
protected applyCalculationValue(value: unknown): void {
    this.setValue(value, { overrideReadOnly: true });
}
```

Determine how the calculation update handles a disabled field, validation options, initialization/reset state, exceptions, and the same result being produced repeatedly.

### `FieldValueHost`: Responding to Source Changes

Override `otherValueHostChangedNotification()` in the field:

```ts
// Illustrative shape; ordering and options are not final.
public override otherValueHostChangedNotification(
    changedName: ValueHostName,
    revalidate: boolean
): void {
    this.calculate(revalidate, changedName);
    super.otherValueHostChangedNotification(changedName, revalidate);
}
```

The calculation check must not be bypassed by the early exits in [`ValidatableValueHostBase.otherValueHostChangedNotification()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts), including the case where validation has never run. Preserve the base method's validation-dependency behavior.

```ts
interface FieldValueHostSetValueOptions
{
    suppressNotifications?: boolean;
}
```
FieldValueHost will not call ValueHostsManager.notifyOtherValueHostsOfValueChange when this is true.
This lets value initialization code defer any side effects (validation and calculations) until ValueHostsManager.valuesInitialized(). As a result, ReaderBase uses suppressNotifications=true.

Open implementation details include whether the source must have actually changed, how `revalidate` influences the calculated field, and how to avoid duplicate validation. A source field currently performs its own validation before notifying other hosts, so validators that use the calculated destination may otherwise see the previous result. Define ordering before claiming consistent validation.

### `IValueHostsManager` and `ValueHostsManager`

**Problem:** Need to let FieldValueHosts with calculations run upon completing the initial values phase because the results need to be delivered into the DOM editor element.

**Solution:** Provide a new function to be called either manually or within a Reader that handles this.

Current definitions: [`IValueHostsManager`](../packages/jivs-engine/src/Interfaces/ValueHostsManager.ts) and [`ValueHostsManager`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts).

```ts
// Proposed member; name and options are open.
interface IValueHostsManager {
    valuesInitialized(): void;
}
```
**ALERT**: We are revising our approach to preliminary validation.
Instead of calling validate({preliminary: true}), call valuesInitialized()
and it will include both preliminary validation and addressing calculated fields.
We also expect calls to setValue(value, { suppressNotifications: true}) during initialization.


- Add a post-value-initialization operation that finds calculated fields, computes their results, and applies them.
- Ensure that initial display synchronization handles `undefined`, even if the native value or stored text was already `undefined`.
- Use `notifyOtherValueHostsOfValueChange()` as the starting point for later source changes. The existing loop already visits the destination field; do not add a calc notification loop or calc cache for this flow.
- Potentially prevent the notifyOtherValueHostsOfValueChange() mechanism from executing during initial values phase, because it is there for field level validation and calculations, not the batch process associated with this phase.
- Configurations and hosts can be added, replaced, or discarded. Avoid retaining stale calc instances if field-side caching is later introduced.
- **Open:** batching. Source setters currently notify while readers load values, so calculations may run on intermediate values and again at completion.
- **Open:** order for multiple calculated fields, multiple readers, calculation chains, errors, captured-state restoration, and explicit refresh for external inputs.

### `ReaderBase`, Model Readers, and `EditorReader`

Relevant implementations: [`ReaderBase`](../packages/jivs-engine/src/ReaderWriter/ReaderBase.ts), [`EditorReader`](../packages/jivs-dom/src/Editors/EditorReader.ts), and [`ServerPageValuesReader`](../packages/jivs-dom/src/Editors/ServerPageValuesReader.ts).

Potential integration sequence:

```text
Read source value -> setValue(value, { suppressNotifications: true})
Completed  -> ValueHostsManager.valuesInitialized()
```

The intent is to defer validation and calculations until valuesInitialized(). By suppressing Notifications, we prevent individual field value changes from during their normal interactive updating
of related valuehosts.

1. Ensure ReaderBase uses the suppressNotifications = true option on setValue.
2. Switch ReaderBase from calling valueHostsManager.validate({preliminary}) to valueHostsManager.valuesInitialized() which has preliminary validation and calculations built in.

Models may contain a property matching the calculated FieldValueHost, and will attempt to write their value to it. The setter guard still rejects direct writes; reader logging, return values, `alignEnabled`, filters, and validation must not misleadingly report a successful assignment or accidentally change enabled state. We don't require a Reader to explicitly skip calculated FieldValueHosts just to avoid extra logging noise when setValue identifies its in a read-only state.

`EditorReader` currently suppresses public value callbacks during reads. Internal field-to-field notification is a separate path, but display delivery still needs its text callback or an explicit synchronization step. Account for the server-page reader's intentional preservation of source editor values. Document any callback restrictions and test built-in reader behavior, rather than relying solely on callers to change options.

### Writers and ValueAdapterService

Problem: Allow the user to skip writing to a destination property on the model during writing no matter the value coming from a calculation.

Solution: Introduce a new WhenFunction, "Always", in the `ValueAdapterService`.

```ts
adapter.field("DiffDaysDisplay", LookupKey.Integer, {
    label: "Days apart",
    calculation: {
        sourceValueHostName: "DiffDays",
        textForUndefined: "Dates needed",
        textForUndefinedl10n: "DiffDays.DatesNeeded"
    },
    writerRule: { when: "always", then: "skip" }  <<<<
})
.lessThanOrEqual(30);
```

Current implementation: [`ValueAdapterService`](../packages/jivs-engine/src/Services/ValueAdapterService.ts); rule definitions: [`ValueAdapterService` interfaces](../packages/jivs-engine/src/Interfaces/ValueAdapterService.ts).

Add and register a built-in `always` WhenFunction that returns `true` for every value. Existing `skip`/`omit` ThenFunctions can then be used:

```ts
writerRule: { when: "always", then: "skip" }
```

Document the function and cover values including `undefined`, `null`, and defined values. No additional calculated-field-only writer policy is required by this design.

## Undefined Native Value and Text Notifications

### Required Contract

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

When formatting is enabled, writers and broadcast paths can read the stored `undefined` text; no separate display-state marker is needed for this transition. `reset: true` can publish an already-undefined result if callbacks are attached and not suppressed. Verify initial writes, editor reinstallation, broadcast, and restored state, including invalid user input whose native value is undefined but whose stored text is defined.

Formatting opt-outs deliberately retain the previous text, including for calculated fields, and therefore may display that text or expose it to text-based validation. Test validation of an undefined calculated result and of genuine parse errors separately; placeholder text must never become field data.

## DOM Types

### `ITextValueAdapter` and Compatible Implementations

Current interface: [`ITextValueAdapter`](../packages/jivs-dom/src/Interfaces/Adapters.ts).

Compatible text adapters receive one **already-localized** undefined-display string at creation and use it when `writeTextValue(undefined)` is called. For example:

```ts
// Proposed constructor; not required for all implementations.
new PlaceholderTextValueAdapter(editor, jivsElement, localizedUndefinedText);
```

The exact optional interface/property or constructor mechanism remains open. Do not require a new constructor argument or behavior for every text adapter. Checkbox, radio, and select adapters use text as selection data and must not interpret a display message as an option or checked value.

### Editor Adapter Definitions and Localization

[`EditorAdapterDefinitionBase.createTextValueAdapter()`](../packages/jivs-dom/src/EditorAdapterDefinitions/EditorAdapterDefinitionBase.ts) is abstract. Each participating concrete definition receives the field and has access to `domServices`; a shared helper can:

1. Obtain the field's calculation display settings through its public accessor.
2. Resolve `textForUndefinedl10n` with `services.errorMessagesService`, using `textForUndefined` as fallback.
3. Use `""` when neither is available.
4. Supply the resulting string to the compatible adapter.

Define the culture consistently with field formatting. Do not pass DOM services into the adapter merely for localization, and do not introduce global settings. Resolution occurs when the adapter is created; live language switching is not promised in this phase.

### Span Editor Adapter Definition

Add an editor adapter definition and text adapter for:

```html
<span data-jivs-role="editor" data-field="DiffDaysDisplay"></span>
```

- `matches()` recognizes a span whose text content is empty or whitespace at installation.
- The text adapter writes using `textContent` and supports the localized undefined string.
- Attach no input/change handlers; `sendValue()` is a no-op, including when `EditorReader` calls it.
- Supply appropriate field presentation and validation ARIA behavior. Assess `aria-invalid`, `aria-errormessage`, role, accessible naming, and assistive-technology behavior rather than assuming attributes alone are sufficient.
- Register the definition in the relevant default and consumer/starter configuration paths.

[`EditorInstaller`](../packages/jivs-dom/src/Editors/EditorInstaller.ts) currently resolves the definition before checking whether an element is already installed. An installed span may already contain output and fail an empty-only match. Resolve that installation/reinstallation behavior, including child nodes and replacing content via `textContent`.

### `InputAdapterDefinition`

For supported text-like inputs, reflect the field's `readOnly` state in the input's HTML `readOnly` property during installation. Preserve an application-supplied readonly state on ordinary fields and do not assume every input type supports HTML readonly.

This is UI behavior, not the enforcement mechanism. Custom adapter definitions are not required to check readonly in event handlers; the field's setters reject their writes.

## Builder, Configuration, and Documentation Work

- Ensure the builder's existing `calc(config)` and `field(..., parameters)` paths carry the new properties. Review fluent config types and form adaptation/merge behavior, including whether the nested calculation configuration is replaced or merged.
- Update user-facing ValueHost documentation, especially [ValueHosts Home](../docs/API/ValueHosts/Home.md), [Using CalcValueHost](../docs/API/ValueHosts/Using_CalcValueHost.md), and [Getting and Setting Values](../docs/API/ValueHosts/Getting_and_Setting_Values.md).
- Document manual dependency lists, unsupported static change triggers, read-only setters, initialization, callback suppression, undefined display semantics, span markup, localization, and `writerRule`.
- Update DOM setup and examples to register the span adapter and show both span and input use cases. Keep business calculation examples reusable.

## Validation and Test Work

Before writing or changing tests, follow [Testing Approach](./Testing_Approach.md), including the repository's logging assertions and test setup requirements.

- Calc configuration: dependency list supplied, absent, empty, conditional sources, and configuration replacement.
- Calculated field: initialization, source update before validation, irrelevant source, defined/undefined transitions, formatting, validation, read-only setter rejection and Info logging, `overrideReadOnly` accepted by each setter (including through the formatter path) while the disabled check still applies, and `readOnly` remaining true after the calculation update, including after an exception.
- Notifications: cleared text and previous text in the callback, repeated undefined calls, formatting opt-outs, callback skipped/configured, ordinary text edits, parser failure, and correct dispatcher behavior.
- Display lifecycle: initial undefined result, editor installation and reinstallation, writer and broadcast synchronization, and captured-state restoration when native value and stored text differ.
- DOM: empty/whitespace span matching, no input handlers or `sendValue`, formatted output and localized undefined text, readonly input, appropriate ARIA and error presentation, and unsupported adapters retaining their existing behavior.
- Readers: manual initialization, model and editor readers, callback suppression, preliminary validation, disabled/enabled state, and server-page restoration.
- Writer: `always` with `skip` and representative values; existing writer behavior remains intact.
- Owner work: verify calculation recursion protections and separately define/test propagation-cycle behavior.

## Open Decisions Before Implementation

1. Final API names (`overrideReadOnly` is chosen) and the placement and mutability of `readOnly`, dependency lists, and the calculation refresh operation.
2. Semantics of absent, `null`, or empty dependencies; diagnostics for unknown sources.
3. Initial synchronization when the stored text is already undefined, restoration, and validation behavior including formatting opt-outs and genuine parse errors.
4. Initialization batching, reader completion, multiple calculated fields, and validation/notification ordering.
5. Disabled field behavior, initialization change tracking, calculation failure reporting, and support for calculation chains.
6. Exact span matching/reinstallation and ARIA behavior.
7. Which compatible text adapters accept the localized undefined string and the optional interface shape.

The user owns the separate `CalcValueHost` self-recursion/stack-overflow investigation. Do not treat it as already completed or as equivalent to solving every reactive propagation cycle.
