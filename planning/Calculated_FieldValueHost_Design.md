# Calculated FieldValueHost Design

## Status and Scope

This is a work-in-progress design for exposing a `CalcValueHost` result through a `FieldValueHost`. It captures the current discussion for review and correction; details of the reactive and initialization mechanisms still need to be designed.

The main direction is to let a normal `FieldValueHost` name an existing `CalcValueHost` as its value source. The field receives the result and supplies formatting, validation, and UI integration. Business logic can continue to use the calculation independently of the form.

The API names and TypeScript snippets in this document are illustrative. They describe proposed behavior, not currently available APIs. Notification ordering, initialization, validation scheduling, and several other details remain open.

For the detailed proposed APIs, implementation work, and unresolved validation and display-state questions, see [Calculated FieldValueHost Implementation Design](./Calculated_FieldValueHost_Implementation_Design.md).

## Use Cases

1. **Display a reusable business calculation.** Business rules define a `CalcValueHost` for the number of days between two dates. A form adds a `FieldValueHost` that displays the result in a span. When the source dates change, the displayed result should update.
2. **Validate the calculated result.** A calculated total or date difference is displayed by a field with its own validators. For example, a date difference greater than 30 days produces a validation issue associated with the displayed field.
3. **Display an undetermined result.** When a required source is missing or cannot be parsed, the calculation returns `undefined`. With formatting enabled, the native value and stored text are `undefined`, and the text adapter displays a field-specific localized message such as "Dates needed", or an empty string by default.
4. **Use a read-only input rather than a span.** An application uses an `input type="text"` to display a formatted result. The input adapter definition reflects the field's `readOnly` state in the HTML input; the field's own read-only rule prevents incoming value writes regardless of the editor used.
5. **Protect the calculated value during initialization and subsequent interaction.** A reader, editor adapter, or application attempts to set the calculated field's value. The field rejects the call without changing its state; the calculation remains its value source.
6. **Control model output.** A form-only calculated field is omitted from model writing using `writerRule: { when: "always", then: "skip" }`, once the proposed `always` rule is available. Another application may instead choose to write its calculated result.
7. **Clear a native value and update its editor display.** With formatting enabled, calling `setValue(undefined)` on an ordinary writable field clears its stored text and notifies `onTextValueChanged` when the text changes or `reset: true` is supplied, unless the callback is skipped.

Reactive updates use manually configured dependencies for the initial design. Automatic discovery is deferred; the detailed initialization and notification ordering remain to be designed.

## Goals

- Reuse a calculation defined by business logic without making it aware of a form or its fields.
- Display a calculated value using the existing field-oriented value and text dispatching mechanisms.
- Allow the calculated result to have field validators and validation presentation.
- Treat the calculation as the owner of the destination field's values.
- Support an output-only `span` and an `input type="text"` as editor elements.
- Display configurable, localized text when the calculation result is `undefined`, without making that text part of the field's data.
- Preserve existing behavior of ordinary fields and existing lazy calculations unless a change is deliberately designed.

## Non-Goals for the Current Design

- Editing the calculated field's value or applying an inverse calculation to its sources.
- Adding a new ValueHost class or making `CalcValueHost` inherit from `FieldValueHost`.
- Making all `CalcValueHost` instances intrinsically displayable or validatable.
- Putting `calcFn` directly on a field as part of the initial direction.
- Global or adapter-definition defaults for the undefined-result display text.
- Requiring adapter definitions to check HTML `readonly` before sending editor changes for correctness.
- Automatic dependency discovery or journaling. Users manually configure the calculation's dependencies.
- Automatically reacting to changes in a `StaticValueHost` during its lifecycle in the initial version.

`StaticValueHost` display was part of the original motivation, but this design does not yet propose a general display solution for static hosts.

## Existing Behavior

- [`CalcValueHost.getValue()`](../packages/jivs-engine/src/ValueHosts/CalcValueHost.ts) calls the configured calculation function on each read. It does not store a calculated result as its value, and `setValue()` does nothing.
- A [`FieldValueHost`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts) retains native and text values, supports validators, and can format a native value through `setValue()`.
- A field's native and text changes can be delivered through `ValueHostsManager` callbacks and DOM dispatchers. Existing DOM dispatching is field-oriented.
- Business logic rules can be adapted by a form with `IAdaptModelRulesToForm`. The form adapter can add a field while retaining the business logic's calculation.
- Current validation dependency notification tracks names referenced by conditions. It is not a general mechanism for discovering arbitrary reads made by a calculation function.

The existing user-oriented overview is in [ValueHosts documentation](../docs/API/ValueHosts/Home.md), including [Using CalcValueHost](../docs/API/ValueHosts/Using_CalcValueHost.md).

## Proposed User Experience

Business logic defines the calculation once:

```ts
class DateRangeRules extends ValueHostRulesBase {
    protected configureRules(builder: IValueHostsManagerConfigBuilder): void {
        builder.field("StartDate", LookupKey.Date);
        builder.field("EndDate", LookupKey.Date);
        builder.calc({
            name: "DiffDays",
            dataType: LookupKey.Integer,
            calcFn: differenceBetweenDates,
            dependencyValueHostNames: ["StartDate", "EndDate"]
        });
    }
}
```

The form adds a field whose source is the existing calculation:

```ts
class DateRangeFormRules extends DateRangeRules
    implements IAdaptModelRulesToForm {
    public adaptToForm(adapter: IFormConfigAdapter): void {
        adapter.field("DiffDaysDisplay", LookupKey.Integer, {
            label: "Days apart",
            calculation: {
                valueHostName: "DiffDays",
                textForUndefined: "Dates needed",
                textForUndefinedl10n: "DiffDays.DatesNeeded"
            },
            writerRule: { when: "always", then: "skip" }
        })
        .lessThanOrEqual(30);
    }
}
```

`calculation`, the dependency property, their names, and the `always` rule are proposed. The calculation function is the same kind of `CalculationHandler` used by `CalcValueHost` today. The writer rule requires the new built-in `always` WhenFunction described below.

Conceptually:

```text
StartDate ----\
               -> DiffDays CalcValueHost -> DiffDaysDisplay FieldValueHost
EndDate ------/                                  |
                                      formatting, validation, UI
```

The calculation is reusable by business logic and conditions. The form's field supplies presentation and optional field validation. When the destination changes, the field is the ValueHost reported by its normal callbacks; the source calculation is not itself being changed.

An application could use the same general relationship with a read-only text input or an output-only span:

```html
<input type="text" readonly
       data-jivs-role="editor" data-field="DiffDaysDisplay">

<!-- Alternative editor, not a second element for this example -->
<span data-jivs-role="editor" data-field="DiffDaysDisplay"></span>
```

The input adapter definition should set the supported input's `readonly` property from the field's read-only state. This provides browser-level presentation and editing behavior; the field itself remains responsible for protecting its value.

## Field Configuration

The leading proposal is a child object on `FieldValueHostConfig`:

```ts
// Illustrative shape; names and types remain to be finalized.
interface FieldCalculationConfig {
    valueHostName: string;
    textForUndefined?: string;
    textForUndefinedl10n?: string;
}

interface FieldValueHostConfig {
    calculation?: FieldCalculationConfig;
}
```

- `valueHostName` identifies the existing source `CalcValueHost`.
- `textForUndefined` is a fallback string to display for an undefined calculation result.
- `textForUndefinedl10n` is the localization key for that display string.
- If neither provides a string, the displayed fallback is the empty string.

The field should expose the necessary calculation/display configuration through an appropriate public accessor; DOM code should not access its protected configuration directly. The details of the accessor and how it reports missing or wrong-type source hosts remain to be designed.

Normal `formatterLookupKey`, data type, validator, label, and element identifier configuration remain field properties. The calculation-specific child object should not duplicate the field's formatting configuration.

## Calculated Value Ownership

Introduce a public `readOnly` property, normally `false`. A `FieldValueHost` with a calculation source reports `true`. The calculation's own update calls `setValue()` with the new `SetValueOptions.overrideReadOnly` option. The calculation owns the field's native and text values. Public calls to any value-setting function are invalid actions while the field is read-only, whether they originate in an editor adapter, a reader, or application code:

```ts
field.setValue(10);
field.setTextValue("10");
field.setValues(10, "10");
field.setValueToUndefined();
```

`setValue()`, `setValues()`, and `setTextValue()` check `readOnly` and stop early unless `options.overrideReadOnly` is true. `setValueToUndefined()` delegates to `setValue(undefined)` and is also rejected. Each rejected call takes no action and logs at Info level. In particular, it must not change values, validation state, change tracking, or invoke callbacks. Without the option, an editor or application cannot replace the calculated result by using a different setter.

The calculation update calls `setValue()` with `overrideReadOnly: true` so it can reuse the existing formatting, state, validation, and notification behavior. `readOnly` itself is never toggled, so nothing needs restoring after an exception. Internal setter delegation must carry the option; for example, formatting may make `setValue()` call `setValues()` with the same options.

`overrideReadOnly` is deliberately public. Users rarely need it, and the documentation explains its impact: a caller that passes it can replace a calculated field's value until the next calculation. It does not bypass the disabled check.

The input adapter definition should reflect `readOnly` on input types that support HTML `readonly`, while preserving an application-supplied readonly attribute on an ordinary field. Adapter authors are not required to check readonly in every event handler: the field's setter checks are the backstop. Read-only is distinct from disabled; a calculated field can remain enabled and participate in validation.

This ownership rule is an API behavior, not a security boundary. Server-side code must independently calculate and validate values as needed.

### Initialization and Readers

The span editor definition's `sendValue()` is a no-op: the span is output-only and must not send its current text or placeholder back to the field.

The field guard remains the backstop for other editor definitions and callers. Skipping calculated fields in model readers is a likely improvement so that normal initialization does not attempt rejected writes, but its exact behavior is not yet decided. Existing readers also have enablement and validation behavior that must be considered when designing that change.

## Calculation Result and Field Values

For a successful result, the field holds the native result and, when configured and available, uses its formatter to produce field text. Existing formatting settings and behavior still apply. The field can validate the result and report changes through the normal field callbacks.

For an `undefined` result:

```text
Field native value:       undefined
Field text value:         undefined, when formatting is enabled
Displayed editor text:    localized undefined text, fallback, or ""
```

The undefined display string is presentation content. It must not be placed in the field's text value or be parsed as input. In particular, an undefined native value paired with a defined placeholder in field text could cause [`DataTypeCheckCondition`](../packages/jivs-engine/src/Conditions/ConcreteConditions.ts) to report an input error, and other text-based validators could also evaluate the placeholder.

`null` and `undefined` are distinct values. The special undefined display behavior applies to `undefined`; handling of `null` continues to follow the applicable field and formatting semantics.

When the result changes from a value to `undefined` with formatting enabled, both stored values change. The normal text callback allows the dispatcher to read the new text value. Initial display synchronization still needs to handle an undefined result even when no stored value has changed.

### `setValue(undefined)` and Text Notifications

The original concern applies to an ordinary `FieldValueHost` when its **native value** is changed through `setValue(undefined)`. It also applies to `setValueToUndefined()`, which delegates to `setValue(undefined)`. It is not a request to erase text whenever any setter produces an undefined native value.

For example, assume formatting is active and the field already contains native `42` and text `"42"`:

```ts
field.setValue(undefined);
```

With formatting enabled, `setValue(undefined)` delegates to `setValues(undefined, undefined)` without calling a formatter. If the stored text changes or `reset: true` is supplied, the normal `onTextValueChanged` callback receives the previous text, and the dispatcher reads the new `undefined` from `getTextValue()`. Without reset, repeated calls and initial calls with already-undefined text do not notify. `skipValueChangedCallback` still suppresses the callback.

The formatting opt-outs (`disableFormatter`, `formatterLookupKey: null`, and `disableFormattingOnValueChange`) retain the prior native-only behavior and leave the text unchanged. An inactive formatter service does not prevent clearing undefined text, since no formatter is needed. The same rules apply to `setValueToUndefined()`.

Do not confuse this with an unsuccessful text parse. If a user enters invalid text, a parser can set the native value to `undefined` while retaining the entered text via `setValues(undefined, enteredText)`. Retaining that text lets the user see and correct it and must not be erased by the proposed calculation-display behavior.

This is an intentional behavior change for ordinary writable fields as well as the calculated update path. Initialization can use `reset: true` to publish an already-undefined text value, provided the callback and dispatcher are attached and not suppressed. Editor installation and replacement still need coordinated synchronization.

## Undefined Display Text and Localization

The field's calculation configuration is the sole configured source for this feature. Do not introduce global `JivsDomServices` defaults or adapter-definition defaults, since shared settings could unexpectedly affect other fields.

During creation of a compatible text adapter:

1. The concrete editor adapter definition receives the `FieldValueHost`.
2. It obtains the calculation's undefined display settings through a public field accessor.
3. Using its existing access to DOM services and Jivs services, it resolves the localization key and fallback.
4. It passes one already-localized string to the text adapter.
5. When asked to write `undefined`, the adapter writes that string as display content.

For example:

```ts
// Illustrative only.
const textForUndefined = resolveUndefinedText(valueHost, this.domServices);
return new PlaceholderTextValueAdapter(editor, jivsElement, textForUndefined);
```

The shared resolution logic should use the existing localization service and define a culture consistent with field formatting. `createTextValueAdapter()` is abstract on the current base class, so applicable concrete definitions must participate. A shared helper can avoid repeating resolution logic.

This is an optional adapter capability: compatible adapters accept or expose the already-localized string; implementations that cannot use display text do not need a new constructor argument or behavior. For example, checkbox, radio, and select text adapters use strings as selection values rather than general text content. They must not be changed to treat an arbitrary placeholder as an option or checked value.

The exact interface design is open: for example, an optional property on `ITextValueAdapter`, an optional capability interface, or constructor parameters for participating implementations. Preserve compatibility for custom implementations where possible.

The initial contract resolves the string when the adapter is created. Live language changes while the page is already displayed are not promised. A future design could reconfigure or recreate the adapter and explicitly rewrite the current display. Similarly, when a DOM element is replaced or installed after the field has already been populated, its current display must be synchronized even if the field value does not change.

## Span Editor

Provide an `EditorAdapterDefinition` that matches a `span` used as an editor. The intended markup is a span with no content:

```html
<span data-jivs-role="editor" data-field="DiffDaysDisplay"></span>
```

Its responsibilities:

- Match the supported span in `EditorAdapterDefinition.matches()` during installation. It must have empty or all whitespace textcontent.
- Create a compatible text adapter that writes display text using `textContent`.
- Attach no input or change event handlers.
- Make `sendValue()` a no-op.
- Participate in field validation presentation and appropriate ARIA behavior.
- Be registered in the relevant DOM configuration and made available to consumers.

This uses the existing `editor` role, not a new output-specific role. It lets the existing editor installation and field-oriented dispatch architecture identify the field as having an editor.

The exact meaning of “no content” in the match rule needs to be specified, including whitespace, text, child elements, and already-installed spans. [`EditorInstaller`](../packages/jivs-dom/src/Editors/EditorInstaller.ts) currently resolves the definition before checking whether an element is already installed. An empty-only match may therefore fail after a previous write has populated the span; repeated installation and replacement need an explicit solution. Writing `textContent` also replaces child nodes, so matching and supported markup should make that consequence clear.

### ARIA and Validation

The span may have validation errors. The association between the editor and its error message, including `aria-errormessage` where appropriate, should therefore be considered rather than suppressing all ARIA behavior.

The existing editor validation updater supplies `aria-invalid` and `aria-errormessage`. Determine whether that behavior and any required role or accessible naming are appropriate for the span, and validate the resulting accessibility behavior. Do not assume that adding an attribute alone ensures the intended assistive-technology experience.

## Model Writing

The field's existing `writerRule` is the intended way to control whether its native calculated result is written to a model. This is separate from the field's value ownership and UI behavior.

Add a built-in `ValueAdapterService` WhenFunction named `always`, which returns `true` for every value. It enables:

```ts
writerRule: { when: "always", then: "skip" }
```

`skip` and `omit` already exist as ThenFunctions. The new WhenFunction should be registered, documented, and tested, including defined values, `null`, and `undefined`. Existing writer filters remain another bulk-writing option; their behavior for individual writes should remain as documented.

## Reactivity: Manual Dependencies and Field Notifications

A `CalcValueHost` exposes a public list of names identifying the ValueHosts that supply values to its calculation. The user can set the list through `CalcValueHostConfig`, as in the example above. For the initial feature, the list is manually populated: automatic discovery and journaling are deferred.

The list must include every reactive source, including names used only in conditional branches or after early returns. The exact property name, mutability, and behavior of an absent, `null`, or empty list remain to be finalized; the deferred auto-population design must not be assumed to run.

The existing [`notifyOtherValueHostsOfValueChange()`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts) loop over validatable ValueHosts is the starting point. The destination `FieldValueHost` already receives that notification, so the manager does not need a separate loop or cache of `CalcValueHost` instances.

```text
EndDate changes
  -> manager notifies validatable ValueHosts about EndDate
  -> DiffDaysDisplay receives the notification
  -> field resolves its configured DiffDays CalcValueHost
  -> field checks the calc's dependency list for EndDate
  -> if listed, field calls DiffDays.getValue()
  -> field applies the result through its calculation update and setValue()
```

The calc does not need to publish its own notification for this flow. The field handles the calculation part independently of the early returns in the base validation notification method, so it can update even before validation has run. It must also preserve the existing validation-dependency behavior; exact ordering and avoidance of duplicate validation are open.

Existing field setters invoke internal manager notifications separately from their public value-change callbacks. Suppressing a public callback does not automatically suppress that internal notification, but suppressing the calculated field's output callback can prevent the UI from receiving its result. Document the relevant callback configuration and verify the behavior of existing readers, including `EditorReader`, which intentionally suppresses callbacks during its reads.

For the first version, static values may be consumed by a calculation but are treated as fixed during the relevant lifecycle. Changing a `StaticValueHost` after initialization is not promised to trigger recalculation. Supporting that trigger later is a separate decision.

## Post-Value Initialization

Add a public post-value-initialization function on `ValueHostsManager` to establish calculated results after source values have been loaded. The name is not finalized:

```ts
// Illustrative API.
vhm.getValueHost("StartDate")?.setValue(startDate, { reset: true });
vhm.getValueHost("EndDate")?.setValue(endDate, { reset: true });
vhm.completeValueInitialization();
```

The intended completion step finds calculated fields, evaluates their configured calculations, applies their results, and ensures the initial display can be synchronized even when both the old and new text are `undefined`. Readers are candidates to invoke the same step after loading values and before preliminary validation; exact reader integration and coordination of multiple readers remain to be designed.

Existing setters can notify fields while initial values are being loaded. Decide whether those intermediate notifications should cause calculations immediately or whether an initialization/batching mechanism should defer them until completion. The completion function is needed to establish an initial result either way.

The design must consider:

- Initial values, manual initialization, multiple or nested readers, and state restoration.
- Editor and model reader behavior; public callbacks may be suppressed while values are read.
- Initial UI publication when the result and previous text are both `undefined`.
- Chained calculations, conditional dependencies, cycles, and configuration replacement or disposal.
- External dependencies and whether an explicit refresh path is needed.
- Native versus text changes, including editor paths that do not parse native values during an edit.
- Updating calculated fields before affected validations use their values; validation and callback ordering.
- What to do when a calculation throws versus normally returning `undefined`.
- The owner will address calculations that accidentally call themselves and could cause stack overflow in `CalcValueHost`; record that work separately from field notification design.
- Disabled fields, data type compatibility, formatting failures, and explicit error reporting.
- Avoiding changes to existing lazy `CalcValueHost.getValue()` semantics without an intentional compatibility decision.

## Working List

The list records areas of work rather than a completed implementation plan. Order and scope depend on the unresolved reactive design.

- Design the calculation child configuration, field accessor, source resolution, and configuration validation.
- Add the public `readOnly` behavior, guard all value setters, and add `SetValueOptions.overrideReadOnly` so calculation updates can reuse `setValue()`.
- Add the manually configured `CalcValueHost` dependency list and have calculated fields handle relevant manager notifications.
- Define and implement the manager's post-value-initialization function, reader integration, propagation, and validation ordering.
- Add the span editor definition, its text adapter, registration, and appropriate validation/ARIA support.
- Add field-specific localized undefined display support to compatible text adapters, without global defaults.
- With formatting enabled, clear stored text for `setValue(undefined)` and publish text changes or reset values; test ordinary and calculated fields and formatting opt-outs.
- Owner: address calculations that accidentally call themselves and could cause stack overflow in `CalcValueHost`.
- Ensure output synchronization for initial undefined values and newly installed or replaced editors.
- Decide how readers treat calculated fields and preserve their existing lifecycle behavior.
- Add the `always` WhenFunction to `ValueAdapterService`, with documentation and tests.
- Update relevant ValueHost, reader/writer, and DOM documentation and examples after the design is settled.
- Add focused coverage for ownership, formatting, validation, callbacks, localization, DOM synchronization, and the eventual reactive behavior, following [Testing Approach](./Testing_Approach.md).

## Questions for Further Design

1. What are the exact APIs and lifecycle for manually configured dependencies, propagation, and post-value initialization? Is batching needed?
2. What is the detailed validation policy when a calculated field updates, including during editing and preliminary validation?
3. How should source calculation configuration errors and runtime calculation failures be reported?
4. How should calculated fields interact with disabled state, model readers, captured state, and direct initialization?
5. What exact span content and accessibility semantics should the adapter support?
6. Which compatible text adapters should initially support undefined display text, and what optional interface or construction pattern should they use?
7. Should live culture changes eventually trigger adapter reconfiguration and a display refresh?
8. Should one calculation feeding multiple fields be explicitly supported in the initial reactive design?
