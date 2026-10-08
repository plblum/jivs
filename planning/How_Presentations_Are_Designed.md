# How Presentations Are Designed

## Purpose

Jivs DOM Presentations translate Jivs validation information into visible user-interface behavior. They may assign CSS classes, generate Error Message content, control whether content is shown, or update element properties such as a submit control’s disabled state.

The built-in Presentations should provide useful behavior immediately while remaining easy to customize. Applications should be able to derive from supplied classes, override focused configuration properties, and register the resulting class through `FieldPresentationFactory` or `FormPresentationFactory`.

Presentation design follows these principles:

- Begin with user-interface roles and identify zero or more useful presentation cases for each role.
- Do not assume that every role requires a Presentation class.
- Prefer CSS for visual behavior that does not require JavaScript.
- Give each class a focused responsibility.
- Share behavior only after concrete Presentations demonstrate that it is genuinely shared.
- Expose practical configuration properties that let applications customize supplied behavior without reimplementing it.
- Allow applications to subclass and register alternative Presentation configurations.
- Keep ARIA behavior outside this presentation-design work.

## Begin with Element Roles

The standard `ElementRole` values define the starting inventory:

- `editor`
- `label`
- `error`
- `container`
- `required`
- `summary`
- `submit`

A role identifies what an element does. It does not automatically identify the Presentation class that should be installed.

For each role, presentation design should determine:

1. What user-interface behavior is useful for that role?
2. Which Jivs data supports that behavior?
3. Does the behavior require a Presentation class?
4. Can CSS provide the behavior by responding to another element?
5. Is the behavior sufficiently general to include in `jivs-dom`?
6. What should be enabled by default?
7. Which optional behavior should be available through configuration?
8. What should remain application-specific?

For example, a field container may not require its own Presentation. CSS may be able to style it through an invalid editor:

```css
.field-container:has(.jivs-invalid-editor) {
    /* Invalid container treatment. */
}
```

A container Presentation remains possible if later use cases show that JavaScript-applied state classes provide a better result.

## Data Supplied to Presentations

Field Presentations receive:

```ts
apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void;
```

Form Presentations receive:

```ts
apply(valueHostsManager: IValueHostsManager, state: ValidationState): void;
```

`ValueHostValidationState` extends `ValidationState` with field-specific information.

```ts
interface ValidationState {
    group?: string;
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: IssueFound[] | null;
    asyncProcessing: boolean;
}

interface ValueHostValidationState extends ValidationState {
    status: ValidationStatus;
    corrected: boolean;
}
```

Presentation design is largely determined by these properties and by selected properties of `IFieldValueHost`.

## Mapping Validation Data to Presentation Uses

### `group`

Validation groups apply to Form Presentations.

`FormPresentationBase` already owns group routing. A derived Form Presentation implements `applyCore()` and does not repeat group-matching logic.

### `isValid`

`isValid === false` identifies an invalid field or form.

Field roles that may reflect this state include:

- `editor`
- `label`
- `container`

Invalid styling must not be inferred from the presence of `issuesFound`. A Warning produces an issue that should be presented without making the editor, label, or container appear invalid.

### `doNotSave`

`doNotSave` determines whether saving or submission should currently be prevented.

Its principal built-in use is the `submit` role. It should be used instead of recalculating save readiness from `isValid`, validation status, or individual issues.

### `issuesFound`

`issuesFound` supplies the Error Messages presented by:

- the field-level `error` role;
- the form-level `summary` role.

These Presentations determine whether content exists with:

```ts
state.issuesFound?.length > 0
```

They do not use `isValid` to decide whether messages should appear because Warnings remain present while `isValid` is true.

The Presentation passes the issues to `IssuesFoundFormatterService`. The formatter owns the details of interpreting `IssueFound`, including `errorCode`, `severity`, `errorMessage`, and `summaryMessage`. Presentation classes should not duplicate that logic.

### `asyncProcessing`

No initial built-in presentation use case has been identified for `asyncProcessing`.

Applications may still create custom Presentations for progress indicators or asynchronous-validation state.

### `status`

`ValidationStatus.Valid` supports an optional validated-success treatment.

One possible use is displaying a success marker beside an editor after its value has been validated successfully. This is a less common feature and should not be enabled by default.

Candidate roles include:

- `editor`
- `required`

### `corrected`

`corrected` supports a distinct success treatment after a previously invalid field has been corrected.

Candidate roles include:

- `editor`
- `required`

Corrected and ordinary validated-success treatments use different CSS classes.

### `valueHost.required`

Required state comes from `IFieldValueHost.required`, not from `ValueHostValidationState`.

It is independent of validation results and may be presented on:

- an editor;
- a label;
- a dedicated Required Indicator;
- another field-associated element selected by the application.

A required class may coexist with an invalid, validated-success, or corrected class.

## The Non-Error Field Presentation Base

Most field roles need to expose field state through CSS classes without generating Error Message content.

The shared base class for this behavior is:

```ts
IsValidFieldPresentationBase
```

It derives from `FieldPresentationBase`.

Its responsibility is distinct from Error Presentations:

- `IsValidFieldPresentationBase` handles required, invalid, validated-success, and corrected presentation states.
- Error Presentations consume `issuesFound` and generate message content.

Validated-success and corrected are treated as refinements of the valid condition even though they are supplied by `status` and `corrected` rather than directly by `isValid`.

### Configurable Class Properties

`IsValidFieldPresentationBase` exposes nullable string properties:

```ts
public presentationClass: string | null = null;
public requiredClass: string | null = null;
public invalidClass: string | null = null;
public validatedClass: string | null = null;
public correctedClass: string | null = null;
```

A `null` property disables that feature.

The base class does not choose role-specific class names. Concrete role Presentations assign the defaults they want to enable. Applications may change the properties while creating a Presentation or derive a class that supplies another configuration.

### `presentationClass`

`presentationClass` is an optional permanent class associated with the Presentation.

Possible uses include:

- providing a stable selector while no state class is active;
- styling the Presentation’s neutral appearance;
- supporting transitions between states;
- giving an ancestor `:has()` selector a permanent target;
- identifying a role when the element was installed without SimpleDom attributes;
- integrating the Presentation with an application design system.

The property defaults to `null`. Whether a concrete built-in Presentation supplies a default is decided from that Presentation’s actual CSS requirements.

### Required State

When `valueHost.required` is true and `requiredClass` is assigned, the class is added.

Required state is independent and may coexist with one validation-result class.

### Validation-Result State

Invalid, validated-success, and corrected classes are mutually exclusive.

Their precedence is:

1. When `state.isValid === false`, use `invalidClass`.
2. Otherwise, when `state.corrected === true`, use `correctedClass`.
3. Otherwise, when `state.status === ValidationStatus.Valid`, use `validatedClass`.
4. Otherwise, do not apply a validation-result class.

A corrected field does not also receive the validated-success class.

### Reconstruct CSS State on Every Call

The Presentation does not remember which CSS classes it previously applied.

Each `apply()` call:

1. removes every configured state class;
2. reasserts `presentationClass` when assigned;
3. adds `requiredClass` when the field is required;
4. selects and adds at most one validation-result class.

This stateless approach is intentional. Application code, UI frameworks, or other behavior may change the element’s classes between calls. The Presentation reconstructs its complete CSS state from the supplied `IFieldValueHost` and `ValueHostValidationState`.

Presentation instances may retain state when a particular widget genuinely requires it, but CSS synchronization does not depend on retained state.

## Role-Specific Classes

State classes are role-specific.

Examples include:

```text
jivs-invalid-editor
jivs-validated-editor
jivs-corrected-editor

jivs-invalid-label
jivs-validated-label
jivs-corrected-label
```

A role-specific class forms a complete styling contract. It is self-describing, can be targeted directly, and can be replaced independently through the corresponding Presentation property.

This also supports selectors such as:

```css
:has(.jivs-invalid-editor)
```

The exact class inventory will be completed while designing each concrete role Presentation.

## Error Message Services and HTML Safety

Field Error Displays and Validation Summaries use services already supplied by Jivs:

- `jivs-dom` supplies `IssuesFoundFormatterService` for generating issue HTML or text.
- `jivs-engine` supplies `ErrorMessagesService` for localized text.
- `jivs-engine` supplies `encodeHtml(string)` for encoding additional dynamic values introduced by a Presentation.
- Prepared Error Messages may contain intentional HTML created by the message-token pipeline.
- Dangerous dynamic token values have already been sanitized through `HtmlMessageTokenResolverService`.

Presentations must preserve prepared Error Message HTML. They must not encode the complete prepared message again.

Any new dynamic text introduced by the Presentation must be encoded before insertion into HTML. Examples include a field label or another application-supplied token that was not already processed through the message-token pipeline.

## CSS Is a Primary Deliverable

The principal published stylesheet is:

```text
assets/jivs-dom.css
```

It is not an incidental collection of rules. It is a documented consumer-facing part of the presentation API.

The stylesheet should:

- support every built-in Presentation;
- include CSS for standard optional features such as validated-success and corrected states;
- provide useful visual defaults;
- use CSS custom properties for customization;
- use modern CSS when browser coverage is sufficient and the feature provides meaningful value;
- preserve the element’s natural layout behavior;
- use simple selectors with predictable specificity;
- avoid `!important`;
- include comments connecting selectors and variables to the Presentations that use them.

## Relationship to SimpleDom

`jivs-simpledom` primarily discovers elements through custom attributes:

- `data-field`
- `data-jivs-role`
- `data-jivs-presentation`

These attributes do not require a separate SimpleDom stylesheet:

- `data-field` identifies field association and is not widget-specific.
- `data-jivs-role` is already represented by the selected Presentation’s behavior.
- `data-jivs-presentation` selects a Presentation that supplies its own CSS contract.

`jivs-dom.css` is therefore the complete presentation stylesheet for both direct `jivs-dom` use and `jivs-simpledom`.

SimpleDom attributes may still be useful in application CSS, but the supplied Presentation stylesheet should normally use Presentation-owned classes.

## Preserve Natural Display Behavior

A Presentation that hides inactive content must not guess which visible `display` value the application requires.

For example:

```css
.jivs-inline-error:not(.jivs-has-issues) {
    display: none;
}

.jivs-inline-error {
    color: var(--jivs-error-message-color);
}
```

When `jivs-has-issues` is added, the hiding selector no longer matches. The browser and application CSS restore the element’s normal display behavior.

The active rule should not assign `display: block`, `display: inline`, `display: flex`, or another guessed value.

This pattern applies to Error Displays, Validation Summaries, Required Indicators, and other conditionally visible widgets.

## CSS Compatibility Policy

Modern CSS is evaluated feature by feature.

A feature should be used when:

- it has sufficient practical browser coverage;
- it materially improves the implementation or consumer experience;
- its use does not impose an unnecessary compatibility requirement.

`:has()` is expected to support useful presentation relationships, such as styling a container based on an invalid editor.

`@layer` is not used. Cascade layers are not necessary to accomplish the library’s goals, and their benefit does not justify expanding the minimum browser baseline.

Customization instead relies upon:

- simple selectors;
- low specificity;
- predictable source order;
- CSS custom properties;
- documented override points.

## CSS Custom Properties

The top of `jivs-dom.css` declares the complete supported variable catalog with default values and comments.

Applications should override these variables in their own stylesheet after importing `jivs-dom.css`. They should not edit the installed package file.

Jivs variables may be connected to application design tokens:

```css
:root {
    --jivs-invalid-color: var(--app-danger-color);
    --jivs-valid-color: var(--app-success-color);
    --jivs-corrected-color: var(--app-success-color);
}
```

Variables may also be overridden on a form or another container to theme one region independently.

### Two-Level Variable Design

The variable system has two levels:

1. Shared semantic variables provide coherent theming.
2. Presentation-specific variables provide focused customization.

For example:

```css
:root {
    --jivs-invalid-color: #b42318;

    --jivs-invalid-editor-border-color: var(--jivs-invalid-color);
    --jivs-invalid-label-color: var(--jivs-invalid-color);
    --jivs-error-message-color: var(--jivs-invalid-color);
}
```

Changing `--jivs-invalid-color` updates the overall invalid-state theme. A user can still override the editor border, label, or Error Message independently.

Presentation-specific variables should be introduced only for meaningful customization cases. The stylesheet should not create a custom property for every literal value merely because it can.

## Scope of Supplied CSS

`jivs-dom.css` should cover:

- classes enabled by built-in Presentations;
- standard optional classes exposed by built-in configuration;
- essential visibility behavior;
- presentation-local spacing;
- default colors, borders, typography, icons, and other visible treatments;
- reusable utility classes required by the Presentation system;
- comments explaining dependencies and customization.

It should not attempt to provide:

- a general form layout system;
- grid or flex structure for the application;
- spacing between unrelated widgets;
- integration-specific assumptions for Bootstrap or another design system;
- rules for arbitrary class names supplied by an application.

Supporting images or other assets may be added under `assets` when a concrete Presentation demonstrates the need. CSS or application-supplied content is preferred when it provides a more flexible result.

## Customization Through Subclassing and Registration

Built-in classes should be useful starting points rather than closed implementations.

Applications may:

1. derive from a supplied Presentation;
2. change public or protected configuration;
3. add focused behavior;
4. register the derived class through `FieldPresentationFactory` or `FormPresentationFactory`;
5. select it by its registered Presentation name.

A factory creator may also configure an instance before returning it.

This approach supports application-specific choices without requiring developers to rediscover the entire validation-presentation design.

## Presentation Design Workflow

Each role is designed separately.

For each role:

1. Identify the role’s user-interface purpose.
2. Gather real-world presentation use cases.
3. Determine which Jivs properties support those cases.
4. Decide which cases require JavaScript and which can be implemented entirely with CSS.
5. Identify the built-in Presentation classes worth supplying.
6. Define each class’s default behavior.
7. Define optional behavior exposed through configuration.
8. Define subclassing and protected extension points.
9. Define generated or expected HTML.
10. Define role-specific state classes.
11. Define CSS variables and default styling.
12. Capture the approved design.
13. Implement and test the class before proceeding to the next completed design.

The intended role order is:

1. `editor`
2. `label`
3. `error`
4. `container`
5. `required`
6. `summary`
7. `submit`

The order may change when a shared abstraction is easier to understand through another role.

## Deferred Decisions

The following questions remain intentionally deferred until their concrete roles are designed:

- Whether the Required Indicator assigns a default `presentationClass`, such as `jivs-required`.
- Whether the container role needs a Presentation or is handled entirely with `:has()`.
- The concrete editor, label, required, and possible container class names.
- The default visual treatment for each role and state.
- The built-in Field Error Display catalog.
- Shared template behavior for Field Error Displays and Validation Summaries.
- Validation Summary structure and interaction.
- Submit-control behavior beyond the basic `doNotSave` use case.
- Whether supporting images or other assets are needed.
- The final NPM asset-copy and export configuration.

These decisions should be made from real presentation use cases rather than filled in speculatively.