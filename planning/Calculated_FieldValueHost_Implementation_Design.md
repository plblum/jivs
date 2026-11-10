# Calculated FieldValueHost Implementation Design

## Status

This document translates the discussion in [Calculated FieldValueHost Design](./Calculated_FieldValueHost_Design.md) into a proposed implementation. It is intended for review before coding. Type, member, and parameter names in the proposed APIs are illustrative and can change.

The desired behavior is established in the use cases and contracts below. Implementation choices marked **open** need further discussion; examples showing possible signatures do not claim those APIs already exist.

## Use Cases

1. **Business calculation displayed by a form.** Business rules define a `CalcValueHost` for the difference between two dates. A form adds a field that displays its result. Changing either source field causes the calculated display to refresh.
2. **Calculated result with validation.** The form attaches validators to the calculated field, such as a maximum of 30 days. The result can be displayed along with its validation issue.
3. **Undetermined result.** A missing or unparseable source causes the calculation to return `undefined`. The native value becomes `undefined`, stored field text remains unchanged, and the editor displays a localized field-specific message or an empty string.
4. **Read-only editor choices.** The result can be shown in a `span` registered with the existing `editor` role or in a readonly text input. The field rejects external value-setting calls regardless of the editor used.
5. **Initial calculation.** After source values are initialized, a manager operation computes and publishes the calculated field, including an initial `undefined` result.
6. **Model output control.** The developer can use a `writerRule` to omit a calculated field from model output, or allow the result to be written when desired.
7. **Ordinary `setValue(undefined)`.** A writable field receiving `setValue(undefined)` keeps its stored text but explicitly notifies text listeners of an `undefined` display value, unless the callback is skipped.

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
        valueHostName: "DiffDays",
        undefinedText: "Dates needed",
        undefinedTextl10n: "DiffDays.DatesNeeded"
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
    dependencyValueHostNames?: string[] | null;
}

interface ICalcValueHost {
    readonly dependencyValueHostNames: readonly string[] | null | undefined;
}
```

- List names for every field whose value the calculation depends on, including all conditional branches.
- The field uses the list to decide whether a source-change notification requires recalculation.
- **Open:** exact semantics for absent, `null`, and empty lists and whether the public list can be replaced at runtime. Do not assign auto-discovery behavior to `undefined` in this version.
- Decide how unknown dependency names and unsupported reactive sources are diagnosed. A static host can be read but does not promise a change notification.
- Avoid accidental mutation of the manager's cloned configuration; a readonly public view is one option.

### `CalcValueHost`

Work: Implement changes to ICalcValueHost.

Problem: Calculations can invoke themselves when using getValue, including nested calculations. 

Solution: Ensure no re-entrancy happens in any CalcValueHost.getValue call. 

Current implementation: [`CalcValueHost.ts`](../packages/jivs-engine/src/ValueHosts/CalcValueHost.ts).

- Expose the configured list through the public interface.
- Keep `getValue()` calculating on demand and `setValue()` behaving as it does today.
- The calc does not need to publish its own notification for a destination field. The manager notifies the field directly; the field consults the calc's list.
- **Owner work:** address calculations that accidentally call themselves and could cause stack overflow. The current implementation already has a `getValue()` reentrancy guard; assess its coverage, including indirect recursion, as part of that separate work. Propagation cycles among calculated fields also need a defined outcome, without assuming the existing guard covers every notification cycle.

### `FieldValueHostConfig`, `IFieldValueHost`, and `FieldValueHost`

**Problem 1**: User needs a way to express that the `FieldValueHost` gets its value from a `CalcValueHost`.

**Solution 1**: Introduce FieldValueHostConfig.calculation where its valueHostName property indicates the CalcValueHost.

**Problem 2**: Calculations are a readonly situation. Calls to setValue, setValues, and setTextValues break this.

**Solution 2**: When enabled, ensure that setValue, setValues, and setTextValues functions take no action (other that logging) by changing the new IValueHost.readOnly property to true. The calculation itself writes with `SetValueOptions.overrideReadOnly = true`.

**Problem 3**: Calculations need to run when any dependent valuehost has a value changed.

**Solution 3**: We already have a notification system for any valuehost that changes. When in calc mode, FieldValueHost will determine if there is a match between its CalcValueHost's dependency field names and the valuehost that changed. If so, that reruns the calculation and writes its value using setValue.

**Problem 4**: Jivs-dom needs a way to refresh an editor when setValue(undefined) is supplied.

**Solution 4a**: Ensure that calls to FieldValueHost.setValue know to invoke `onTextValueChanged` with a value of undefined.

**Solution 4b**: Supply localized text that can appear instead of leaving the existing value unchanged through properties on the `FieldValueHostConfig`. Its ultimate destination is in `EditorAdapterDefinition.createTextValueAdapter` and individual `TextValueAdapters`.

Current definitions: [`FieldValueHost.ts` interface](../packages/jivs-engine/src/Interfaces/FieldValueHost.ts).

```ts
// Proposed members only.
interface FieldCalculationConfig {
    valueHostName: string;
    undefinedText?: string;
    undefinedTextl10n?: string;
}

interface FieldValueHostConfig {
    calculation?: FieldCalculationConfig;
}

interface IFieldValueHost {
    readonly readOnly: boolean;
    getCalculationConfig(): Readonly<FieldCalculationConfig> | undefined;
    refreshCalculation(options?: CalculationRefreshOptions): void;
}
```

The accessor exposes the calculation settings required by the DOM adapter definition without exposing mutable internal configuration. `refreshCalculation()` is a possible manager-to-field entry point; determine its final visibility and options during implementation.

The public `readOnly` property normally reports `false`. A field with a configured calculation reports `true`. It stays `true` during the calculation's own update, which instead passes `overrideReadOnly`. Whether the property belongs on `IFieldValueHost` alone or a broader interface, and whether non-calculated fields can configure it, are open API questions.

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
    this.refreshCalculationIfDependencyChanged(changedName, revalidate);
    super.otherValueHostChangedNotification(changedName, revalidate);
}
```

The calculation check must not be bypassed by the early exits in [`ValidatableValueHostBase.otherValueHostChangedNotification()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts), including the case where validation has never run. Preserve the base method's validation-dependency behavior.

Open implementation details include whether the source must have actually changed, how `revalidate` influences the calculated field, and how to avoid duplicate validation. A source field currently performs its own validation before notifying other hosts, so validators that use the calculated destination may otherwise see the previous result. Define ordering before claiming consistent validation.

### `IValueHostsManager` and `ValueHostsManager`

**Problem:** Need to let FieldValueHosts with calculations run upon completing the initial values phase because the results need to be delivered into the DOM editor element.

**Solution:** Provide a new function to be called either manually or within a Reader that handles this.

Current definitions: [`IValueHostsManager`](../packages/jivs-engine/src/Interfaces/ValueHostsManager.ts) and [`ValueHostsManager`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts).

```ts
// Proposed member; name and options are open.
interface IValueHostsManager {
    completeValueInitialization(): void;
}
```

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
Read source values
  -> completeValueInitialization()
  -> preliminary validation, when requested
```

The intent is for preliminary validation to see initialized calculated values. Integration must not assume one reader always represents the end of all initialization; determine how multiple readers and manual setup coordinate.

Skipping calculated destinations in model readers is likely useful but not yet decided. The setter guard still rejects direct writes; reader logging, return values, `alignEnabled`, filters, and validation must not misleadingly report a successful assignment or accidentally change enabled state.

`EditorReader` currently suppresses public value callbacks during reads. Internal field-to-field notification is a separate path, but display delivery still needs its text callback or an explicit synchronization step. Account for the server-page reader's intentional preservation of source editor values. Document any callback restrictions and test built-in reader behavior, rather than relying solely on callers to change options.

### Writers and ValueAdapterService

Problem: Allow the user to skip writing to a destination property on the model during writing no matter the value coming from a calculation.

Solution: Introduce a new WhenFunction, "Always", in the `ValueAdapterService`.

```ts
adapter.field("DiffDaysDisplay", LookupKey.Integer, {
    label: "Days apart",
    calculation: {
        valueHostName: "DiffDays",
        undefinedText: "Dates needed",
        undefinedTextl10n: "DiffDays.DatesNeeded"
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
After:  native = undefined, stored text = "42"
Event:  onTextValueChanged reports explicit display value undefined
Editor: receives undefined and clears or displays its configured fallback
```

The callback is invoked when configured and not suppressed by `skipValueChangedCallback`. It reports an undefined display value without clearing the stored text. The same applies to a calculation-driven `setValue(undefined)` and to `setValueToUndefined()` through delegation. Account for repeated calls where text is already undefined; normal changed-only logic cannot silently prevent the requested notification.

This is not a request to change parsing: `setValues(undefined, enteredText)` can represent an invalid user entry and must retain and display that entry. Formatting-disabled or formatter-error behavior for defined native values should not be changed inadvertently.

### `TextValueChangedHandler` and Notification Payload

Current [`TextValueChangedHandler`](../packages/jivs-engine/src/Interfaces/FieldValueHost.ts) takes the field and the old text only. `getTextValue()` still returns the stored old text, so the existing dispatcher cannot infer the requested display update by reading it.

One possible backward-compatible *source-level* shape:

```ts
// Proposed payload: its presence distinguishes an explicit undefined
// display value from an older callback invocation with no payload.
interface TextDisplayUpdate {
    value: string | undefined;
}

type TextValueChangedHandler = (
    valueHost: IValidatableValueHost,
    oldValue?: string | null,
    displayUpdate?: TextDisplayUpdate
) => void;
```

- For `setValue(undefined)`, send `{ value: undefined }`, retaining the real previous text in `oldValue`.
- Normal callers that do not send a payload can continue to use the current `getTextValue()` behavior.
- Do not use `displayUpdate?.value ?? valueHost.getTextValue()`: it would discard the explicit `undefined`. Test payload presence.
- This is a proposed design, not an agreed final signature. Assess compatibility for existing callbacks, custom managers, implementers, and consumers, as well as documentation. An alternative may be chosen if it preserves the explicit undefined distinction.

### `DispatcherService`, `ITextValueDispatcher`, and `TextValueDispatcher`

Update the callback attachment in [`DispatcherService`](../packages/jivs-dom/src/Dispatchers/DispatcherService.ts) to preserve and forward any explicit display payload to both retained callbacks and the dispatcher. Extend [`ITextValueDispatcher`](../packages/jivs-dom/src/Interfaces/Dispatchers.ts) and [`TextValueDispatcher`](../packages/jivs-dom/src/Dispatchers/TextValueDispatcher.ts) accordingly.

For an explicit payload, call `adapter.writeTextValue(displayUpdate.value)` even when that value is `undefined`. Without a payload, preserve the current `getTextValue()` behavior. Verify callback ordering and compatibility with custom dispatchers.

### Initial Display, `EditorWriter`, and Restored State

An event alone does not solve later synchronization: [`EditorWriter`](../packages/jivs-dom/src/Editors/EditorWriter.ts) and normal broadcast paths currently read stored text, which may be `"42"` after an undefined display event. Reinstalling an editor or restoring captured state could therefore redisplay stale text.

**Open design choice:** establish a reliable way for initial writes, broadcast, and restored state to resolve the current intended display without changing stored text. For example, a separate explicit display-state marker could distinguish `setValue(undefined)` from invalid user text; if persisted, it must survive capture/restore without relying on JSON retaining an `undefined` property. A public display accessor could expose the result to writers. Specify reset rules for later `setTextValue()`, `setValues()`, and successful formatting. Do not infer the display solely from an undefined native value, because invalid user input also has an undefined native value and must remain visible.

This is required integration work, not permission to change the stored text contract.

### Validation of Retained Text

The retained text creates a separate validation issue. [`DataTypeCheckCondition`](../packages/jivs-engine/src/Conditions/ConcreteConditions.ts) treats defined text with an `undefined` native value as a failed conversion. After a successful calculation changes from `42` to `undefined`, the retained `"42"` can therefore be mistaken for invalid input even though the calculation did not parse that text. Other text-based validators may also observe retained text.

**Open design choice:** distinguish a calculation-driven undefined result from a failed user parse and decide which text-based validation behavior is appropriate for each. An explicit origin or display-state marker could supply that distinction; alternatively, validation could be adjusted specifically for calculated fields. Either approach must preserve genuine parse errors, avoid treating the placeholder as input, and account for ordinary `setValue(undefined)` as well. Test the transition with automatic data-type validation and with user-entered invalid text. A required-value validator may still legitimately report a missing value; deciding that outcome must not hide a genuine validation error.

## DOM Types

### `ITextValueAdapter` and Compatible Implementations

Current interface: [`ITextValueAdapter`](../packages/jivs-dom/src/Interfaces/Adapters.ts).

Compatible text adapters receive one **already-localized** undefined-display string at creation and use it when `writeTextValue(undefined)` is called. For example:

```ts
// Proposed constructor; not required for all implementations.
new SpanTextValueAdapter(editor, jivsElement, localizedUndefinedText);
```

The exact optional interface/property or constructor mechanism remains open. Do not require a new constructor argument or behavior for every text adapter. Checkbox, radio, and select adapters use text as selection data and must not interpret a display message as an option or checked value.

### Editor Adapter Definitions and Localization

[`EditorAdapterDefinitionBase.createTextValueAdapter()`](../packages/jivs-dom/src/EditorAdapterDefinitions/EditorAdapterDefinitionBase.ts) is abstract. Each participating concrete definition receives the field and has access to `domServices`; a shared helper can:

1. Obtain the field's calculation display settings through its public accessor.
2. Resolve `undefinedTextl10n` with `services.errorMessagesService`, using `undefinedText` as fallback.
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
- Notifications: explicit undefined display payload, old text preserved, repeated undefined calls, callback skipped/configured, ordinary text edits, parser failure, callback compatibility, and correct dispatcher forwarding.
- Display lifecycle: initial undefined result, editor installation and reinstallation, writer and broadcast synchronization, and captured-state restoration when native value and stored text differ.
- DOM: empty/whitespace span matching, no input handlers or `sendValue`, formatted output and localized undefined text, readonly input, appropriate ARIA and error presentation, and unsupported adapters retaining their existing behavior.
- Readers: manual initialization, model and editor readers, callback suppression, preliminary validation, disabled/enabled state, and server-page restoration.
- Writer: `always` with `skip` and representative values; existing writer behavior remains intact.
- Owner work: verify calculation recursion protections and separately define/test propagation-cycle behavior.

## Open Decisions Before Implementation

1. Final API names (`overrideReadOnly` is chosen) and the placement and mutability of `readOnly`, dependency lists, and the calculation refresh operation.
2. Semantics of absent, `null`, or empty dependencies; diagnostics for unknown sources.
3. Callback payload, synchronization and restoration without changing stored text, and how validation distinguishes retained text from a genuine parse error.
4. Initialization batching, reader completion, multiple calculated fields, and validation/notification ordering.
5. Disabled field behavior, initialization change tracking, calculation failure reporting, and support for calculation chains.
6. Exact span matching/reinstallation and ARIA behavior.
7. Which compatible text adapters accept the localized undefined string and the optional interface shape.

The user owns the separate `CalcValueHost` self-recursion/stack-overflow investigation. Do not treat it as already completed or as equivalent to solving every reactive propagation cycle.
