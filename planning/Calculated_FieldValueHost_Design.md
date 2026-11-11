# Calculated FieldValueHost Design

## Status and Scope

The calculated-field implementation is in place. This document records the selected design and current behavior; known limitations and remaining work are called out explicitly below.

The main direction is to let a normal `FieldValueHost` name an existing `CalcValueHost` as its value source. The field receives the result and supplies formatting, validation, and UI integration. Business logic can continue to use the calculation independently of the form.

The API names and TypeScript snippets below reflect the implemented API unless explicitly marked as a known limitation. For implementation details and test coverage, see [Calculated FieldValueHost Implementation Design](./Calculated_FieldValueHost_Implementation_Design.md).

## Use Cases

1. **Display a reusable business calculation.** Business rules define a `CalcValueHost` for the number of days between two dates. A form adds a `FieldValueHost` that displays the result in a span. When the source dates change, the displayed result should update.
2. **Validate the calculated result.** A calculated total or date difference is displayed by a field with its own validators. For example, a date difference greater than 30 days produces a validation issue associated with the displayed field.
3. **Display an undetermined result.** When a required source is missing or cannot be parsed, the calculation returns `undefined`. With formatting enabled, the native value and stored text are `undefined`, and the text adapter displays a field-specific localized message such as "Dates needed", or an empty string by default.
4. **Use a read-only input rather than a span.** An application uses an `input type="text"` to display a formatted result. The DOM presentation applies the field's read-only state to the HTML input; the field itself prevents incoming value writes regardless of editor type.
5. **Protect the calculated value during initialization and subsequent interaction.** A reader, editor adapter, or application attempts to set the calculated field's value. Without `overrideReadOnly: true`, the field rejects the call without changing its state; the calculation remains its value source.
6. **Control model output.** A form-only calculated field can be omitted from model writing using `writerRule: { when: "always", then: "skip" }`. Another application may instead choose to write its calculated result.
7. **Clear a native value and update its editor display.** With formatting enabled, calling `setValue(undefined)` on an ordinary writable field clears its stored text and notifies `onTextValueChanged` when the text changes or `reset: true` is supplied, unless the callback is skipped.

Reactive updates use the manually configured `dependencyValueHostNames` on the source `CalcValueHost`. Automatic dependency discovery is not part of this design. Initial calculation and notification behavior is implemented; initialization ordering for calculated-field chains remains a known limitation.

## Goals

- Reuse a calculation defined by business logic without making it aware of a form or its fields.
- Display a calculated value using the existing field-oriented value and text dispatching mechanisms.
- Allow the calculated result to have field validators and validation presentation.
- Treat the calculation as the owner of the destination field's values.
- Support an output-only `span` and an `input type="text"` as editor elements.
- Display configurable, localized text when the calculation result is `undefined`, without making that text part of the field's data.
- Preserve existing behavior of ordinary fields and existing lazy calculations unless a change is deliberately designed.

## Non-Goals for the Current Design

- Making a calculated field directly user-editable or applying an inverse calculation to its sources. Programmatic callers may use the explicit `overrideReadOnly` option.
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

## Configuration Example

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
                sourceValueHostName: "DiffDays",
                textForUndefined: "Dates needed",
                textForUndefinedl10n: "DiffDays.DatesNeeded"
            },
            writerRule: { when: "always", then: "skip" }
        })
        .lessThanOrEqual(30);
    }
}
```

`calculation.sourceValueHostName` identifies the existing `CalcValueHost`. The calculation function is the same kind of `CalculationHandler` used by `CalcValueHost`. The built-in `always` WhenFunction is available through `ValueAdapterService`.

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

The DOM presentation layer applies the `readonly` attribute when the field is read-only. This has browser-level effect only for controls that support it; use an output-only `span` or a text-like input for calculated display. The field itself remains responsible for protecting its value.

## Field Configuration

The implemented child object on `FieldValueHostConfig` is:

```ts
interface FieldCalculationConfig {
    sourceValueHostName: string;
    textForUndefined?: string;
    textForUndefinedl10n?: string;
}

interface FieldValueHostConfig {
    calculation?: FieldCalculationConfig | null;
}
```

- `sourceValueHostName` identifies the existing source `CalcValueHost`.
- `textForUndefined` is a fallback string to display for an undefined calculation result.
- `textForUndefinedl10n` is the localization key for that display string.
- If neither provides a string, the displayed fallback is the empty string.

The field exposes undefined-result display text through `textForUndefinedCalculationValue()`. DOM code should not access protected configuration directly. A configured source that cannot be found is reported through the logging service.

Normal `formatterLookupKey`, data type, validator, label, and element identifier configuration remain field properties. The calculation-specific child object should not duplicate the field's formatting configuration.

## Calculated Value Ownership

`IValueHost.readOnly` is normally `false`; a `FieldValueHost` with a configured calculation source reports `true`. The calculation's own update calls `setValue()` with `SetValueOptions.overrideReadOnly`. The calculation owns the field's native and text values. Setter calls without the override are rejected while the field is read-only, whether they originate in an editor adapter, reader, or application code:

```ts
field.setValue(10);
field.setTextValue("10");
field.setValues(10, "10");
field.setValueToUndefined();
```

`setValue()`, `setValues()`, and `setTextValue()` check `readOnly` and stop early unless `options.overrideReadOnly` is true. `setValueToUndefined()` delegates to `setValue(undefined)` and is also rejected. Each rejected call takes no action and logs at Info level. In particular, it must not change values, validation state, change tracking, or invoke callbacks. Without the option, an editor or application cannot replace the calculated result by using a different setter.

The calculation update calls `setValue()` with `overrideReadOnly: true` so it can reuse the existing formatting, state, validation, and notification behavior. `readOnly` itself is never toggled, so nothing needs restoring after an exception. Internal setter delegation must carry the option; for example, formatting may make `setValue()` call `setValues()` with the same options.

`overrideReadOnly` is public and users may use it. A caller that passes it can replace a calculated field's value until the next calculation. It does not bypass the disabled check.

The DOM presentation layer adds `readonly` for a read-only field; some controls that inherit this presentation do not support the attribute, so the attribute alone does not make every control non-editable. Adapter authors are not required to check readonly in every event handler: the field's setter checks are the backstop. Read-only is distinct from disabled; a calculated field can remain enabled and participate in validation.

This ownership rule is an API behavior, not a security boundary. Server-side code must independently calculate and validate values as needed.

### Initialization and Readers

`ValueHostsManager.valuesInitialized()` calculates every configured calculated field with `reset: true`, then performs preliminary validation. `ReaderBase` calls it after reading values by default; pass `initializingValues: false` to skip this completion step. Readers suppress intermediate notifications while loading values so calculations run after the source values have been loaded.

The span editor definition's `sendValue()` is a no-op: the span is output-only and must not send its current text or placeholder back to the field. Other readers may attempt to assign a model value to a calculated field; the read-only setter guard rejects that write and logs it. `overrideReadOnly: true` is the explicit public way to override that guard.

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

When the result changes from a value to `undefined` with formatting enabled, both stored values change. The normal text callback allows the dispatcher to read the new text value. `valuesInitialized()` also publishes an initial `undefined` result because it applies the calculated value with `reset: true`.

### `setValue(undefined)` and Text Notifications

The original concern applies to an ordinary `FieldValueHost` when its **native value** is changed through `setValue(undefined)`. It also applies to `setValueToUndefined()`, which delegates to `setValue(undefined)`. It is not a request to erase text whenever any setter produces an undefined native value.

For example, assume formatting is active and the field already contains native `42` and text `"42"`:

```ts
field.setValue(undefined);
```

With formatting enabled, `setValue(undefined)` delegates to `setValues(undefined, undefined)` without calling a formatter. If the stored text changes or `reset: true` is supplied, the normal `onTextValueChanged` callback receives the previous text, and the dispatcher reads the new `undefined` from `getTextValue()`. Without reset, repeated calls and initial calls with already-undefined text do not notify. `skipValueChangedCallback` still suppresses the callback.

The formatting opt-outs (`disableFormatter`, `formatterLookupKey: null`, and `disableFormattingOnValueChange`) retain the prior native-only behavior and leave the text unchanged. An inactive formatter service does not prevent clearing undefined text, since no formatter is needed. The same rules apply to `setValueToUndefined()`.

Do not confuse this with an unsuccessful text parse. If a user enters invalid text, a parser can set the native value to `undefined` while retaining the entered text via `setValues(undefined, enteredText)`. Retaining that text lets the user see and correct it; the undefined calculation display behavior does not erase it.

This is an intentional behavior change for ordinary writable fields as well as the calculated update path. Initialization can use `reset: true` to publish an already-undefined text value, provided the callback and dispatcher are attached and not suppressed.

## Undefined Display Text and Localization

The field's calculation configuration is the sole configured source for this feature. Do not introduce global `JivsDomServices` defaults or adapter-definition defaults, since shared settings could unexpectedly affect other fields.

`FieldValueHost.textForUndefinedCalculationValue()` resolves the field's localization key and fallback through the existing localization service. `PlaceholderTextValueAdapter` calls this accessor at creation and caches the result for `writeTextValue(undefined)`. Other adapters are unchanged. The text is resolved using the manager's active culture; live language changes do not update an existing adapter.

## Span Editor

The `PlaceholderAdapterDefinition` matches a `span` used as an editor. The intended markup is a span with no content:

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

The empty-or-whitespace match is used when initially identifying a placeholder editor. It is not intended to be reapplied as a requirement after the element has been installed and populated. The adapter writes with `textContent`, which replaces child nodes; placeholder markup should therefore not rely on child content.

During partial DOM replacement, `valuesInitialized()` recalculates all calculated fields, including those whose editors were not replaced. This is safe: the normal callbacks republish the current calculated values to existing editors as well as newly installed ones.

### ARIA and Validation

The span participates in the ordinary editor validation presentation path. When ARIA support is configured, the standard editor validation updater applies the associated validation state, including `aria-invalid` and the error-message association. Because a `span` is not inherently an interactive control, the application's markup remains responsible for appropriate accessible semantics and naming.

## Model Writing

The field's existing `writerRule` is the intended way to control whether its native calculated result is written to a model. This is separate from the field's value ownership and UI behavior.

The built-in `ValueAdapterService` WhenFunction named `always` returns `true` for every value. It enables:

```ts
writerRule: { when: "always", then: "skip" }
```

`skip` and `omit` already exist as ThenFunctions. Existing writer filters remain another bulk-writing option.

## Reactivity: Manual Dependencies and Field Notifications

A `CalcValueHost` exposes a public list of names identifying the ValueHosts that supply values to its calculation. The user can set the list through `CalcValueHostConfig`, as in the example above. For the initial feature, the list is manually populated: automatic discovery and journaling are deferred.

The list must include every reactive source, including names used only in conditional branches or after early returns. The implemented property is `dependencyValueHostNames`; an absent or empty list is exposed as `undefined`. When a source name is supplied to `FieldValueHost.calculate()`, the field only recalculates if that name is in the source calc's dependency list.

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

The calc does not need to publish its own notification for this flow. The field handles the calculation part before calling the base validation notification method, so validation that follows sees the refreshed value. It preserves the existing validation-dependency behavior.

Existing field setters invoke internal manager notifications separately from their public value-change callbacks. Suppressing a public callback does not automatically suppress that internal notification, but suppressing the calculated field's output callback can prevent the UI from receiving its result. `valuesInitialized()` calculates with notifications suppressed for propagation, but uses `reset: true` so configured public value/text callbacks can publish the calculated result.

For the first version, static values may be consumed by a calculation but are treated as fixed during the relevant lifecycle. Changing a `StaticValueHost` after initialization is not promised to trigger recalculation. Supporting that trigger later is a separate decision.

## Post-Value Initialization

`ValueHostsManager.valuesInitialized()` establishes calculated results after source values have been loaded:

```ts
vhm.getValueHost("StartDate")?.setValue(startDate, { reset: true });
vhm.getValueHost("EndDate")?.setValue(endDate, { reset: true });
vhm.valuesInitialized();
```

The completion step finds calculated fields, evaluates their configured calculations, applies their results, and then performs preliminary validation. `reset: true` ensures callbacks can publish a result even when the previous stored value was already equal. Readers call this step after loading values by default.

Readers use `suppressNotifications: true` while setting values so calculations do not run against intermediate reader values; the completion step calculates after the read.

**Known limitation:** the manager does not topologically sort calculated fields. A consumer listed before a calculated provider can initially remain stale; this is acknowledged and will be revisited.

Recalculating every calculated field during partial DOM replacement is safe: the callback path republishes current values to both new and existing editors. No per-replacement suppression is needed.

Static value changes after initialization are not guaranteed to trigger recalculation. Automatic dependency discovery and live localization changes are also outside the current behavior. The owner separately investigates accidental self-calling calculations and stack overflow in `CalcValueHost`.

## Implemented Behavior and Remaining Work

Implemented behavior is described in the sections above. Engine and DOM unit tests cover calculation application, dependency notifications, initialization, reader integration, formatting, validation, undefined display text, the placeholder adapter, and `always` writer rules. Review the current tests before extending them; consult [Testing Approach](./Testing_Approach.md) before changing tests.

Remaining design/maintenance items:

1. Revisit the known configuration-order limitation for calculated-field chains.
2. The owner separately investigates calculations that accidentally call themselves and could cause stack overflow. The existing re-entrancy guard in `CalcValueHost` does not replace that investigation or define propagation-cycle behavior.
3. Live culture changes after a text adapter is created are not supported; its undefined display text is resolved when the adapter is created.
4. User-facing ValueHost documentation and examples have not yet been updated. They should describe the implemented API, manual dependencies, initialization, `overrideReadOnly`, undefined display behavior, and DOM adapter setup.
