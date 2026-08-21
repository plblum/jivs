# The Jivs SimpleDom Approach

This guide uses **Jivs SimpleDom**, a lightweight approach for connecting Jivs validation state to HTML elements.

Jivs SimpleDom needs a predictable way to identify validation UI elements and determine how those elements should respond.

This section establishes the HTML and CSS conventions used throughout the implementation:

- expose changing state through CSS classes
- let containers respond to state exposed by their descendants
- associate the elements belonging to the same field
- identify what each validation UI element does
- let validation consumers select their Presentation Functions
- connect each `FieldValueHost` to the identifier used by its UI

These conventions belong to Jivs SimpleDom. They are not requirements imposed by Jivs, and applications or framework integrations can replace them with another approach.

A useful principle throughout Jivs SimpleDom is:

> **Expose validation state to the appropriate UI element, then let that element decide how to present it.**

## Use CSS to Drive Presentation

JavaScript does not need to control every visual detail of validation UI.

A useful pattern is:

> **Use JavaScript to expose changing validation state on the elements that own that state. Use CSS to decide how that state should look.**

For example, this markup has two field containers inside a larger field group. The First name editor currently exposes an invalid state:

```html
<div class="field-group">
    <div
        data-field="first-name"
        data-jivs-role="container">

        <label
            for="first-name"
            data-field="first-name"
            data-jivs-role="label">
            First name
        </label>

        <input
            id="first-name"
            class="invalid"
            data-field="first-name"
            data-jivs-role="editor">
    </div>

    <div
        data-field="last-name"
        data-jivs-role="container">

        <label
            for="last-name"
            data-field="last-name"
            data-jivs-role="label">
            Last name
        </label>

        <input
            id="last-name"
            data-field="last-name"
            data-jivs-role="editor">
    </div>
</div>
```

Under the conventions used by this guide, `data-jivs-role` identifies what each element does. The `invalid` class exposes the editor's current state for CSS:

```css
[data-jivs-role="editor"].invalid {
    border: 2px solid currentColor;
}
```

The Presentation Functions described in [Field Presentation of Jivs Validation](Field_Presentation_of_Jivs_Validation.md) will add and remove state classes such as `invalid`. CSS remains responsible for deciding how those states look.

### Style Containers Based on Invalid Fields

An invalid state may be exposed on one editor, while the visual response belongs to a larger part of the UI.

For example, an invalid editor may need to change the appearance of:

- its field container
- a surrounding fieldset
- a card or panel
- a larger group of related fields

JavaScript could locate and update each enclosing element, but that couples validation code to the page layout.

Using the markup above, CSS `:has()` lets the First name field container respond to its invalid editor:

```css
[data-jivs-role="container"]:has(
    [data-jivs-role="editor"].invalid
) {
    outline: 2px solid currentColor;
}
```

The larger `.field-group` can respond to the same editor:

```css
.field-group:has(
    [data-jivs-role="editor"].invalid
) {
    outline: 2px solid currentColor;
}
```

JavaScript only needs to expose the state on the editor:

```ts
editor.classList.toggle(
    'invalid',
    isInvalid
);
```

CSS determines which surrounding elements should react.

## Plan Predictable UI Markup

Jivs SimpleDom wires HTML elements to Jivs validation state by reading custom attributes during initialization.

### Field Markup

A field commonly has several related UI elements:

- editor, often an `<input>`, `<select>`, or `<textarea>`
- label
- Field Error Display
- Required Indicator
- an enclosing field container

Here is some typical markup, already updated with Jivs SimpleDom custom attributes.

```html
<div
    id="first-name_container"
    class="field-container"
    data-field="first-name"
    data-jivs-role="container">

    <label
        id="first-name_label"
        for="first-name"
        data-field="first-name"
        data-jivs-role="label"
        data-jivs-presentation="invalidLabel">
        First name

        <span
            id="first-name_required"
            data-field="first-name"
            data-jivs-role="required">
            *
        </span>
    </label>

    <input
        id="first-name"
        class="validation-editor"
        data-field="first-name"
        data-jivs-role="editor"
        data-jivs-presentation="invalidEditor">

    <div
        id="first-name_errorMessages"
        data-field="first-name"
        data-jivs-role="error"
        data-jivs-presentation="inlineError">
    </div>
</div>
```

The markup conventions use three custom attributes:

- `data-field` identifies which field an element belongs to.
- `data-jivs-role` identifies what the element does within the validation UI.
- `data-jivs-presentation` names the Presentation Function requested by an element that consumes validation state.

The `data-field` value appears on each element associated with the field. Start with one identifier for the field:

```text
first-name
```

The field-related `data-jivs-role` values used by Jivs SimpleDom are:

- `container` — encloses the UI elements associated with one field
- `label` — identifies the field's label
- `editor` — identifies the element that edits the field's value
- `error` — identifies a Field Error Display
- `required` — identifies a Required Indicator

Because related elements share the same `data-field` value and have distinct roles, application code can construct selectors generically for any field.

For example, this selector locates the Field Error Display belonging to `first-name`:

```css
[data-field="first-name"][data-jivs-role="error"]
```

The `data-jivs-presentation` attribute names the requested presentation. Each Presentation name maps to a Presentation Function.

The label, editor, and Field Error Display consume changing validation state, so each requests one of the functions developed under [The Field Presentation Functions](Field_Presentation_of_Jivs_Validation.md#the-field-presentation-functions):

- The label requests `data-jivs-presentation="invalidLabel"`. This guide's Presentation Function adds or removes the `invalid` class based on `ValueHostValidationState.isValid`.
- The editor requests `data-jivs-presentation="invalidEditor"`. Its Presentation Function also adds or removes the `invalid` class based on `ValueHostValidationState.isValid`.
- The Field Error Display requests `data-jivs-presentation="inlineError"`. Its Presentation Function generates content from `ValueHostValidationState.issuesFound` and exposes whether issues are present.

The enclosing container does not need its own Presentation Function because CSS can react to the invalid editor inside it. For example:

```css
[data-jivs-role="container"]:has(
    [data-jivs-role="editor"].invalid
) {
    outline: 2px solid currentColor;
}
```

The Required Indicator is initialized separately from changing validation state, so it also does not declare `data-jivs-presentation`. [Initialize Required Indicators](Field_Presentation_of_Jivs_Validation.md#initialize-required-indicators) explains how to initialize its visibility from `FieldValueHost.required`.

During initialization, call `attachFieldPresentations()`. It finds elements that declare both `data-field` and `data-jivs-presentation`. It reads each Presentation name and attaches the corresponding field Presentation Function.

```ts
attachFieldPresentations();
```

[Initialize Field Presentation Functions](Field_Presentation_of_Jivs_Validation.md#initialize-field-presentation-functions) explains the attachment process.

#### Connect the FieldValueHost to the Field Identifier

The markup conventions above prepare the UI elements for validation. We now need to connect their shared field identifier to the `FieldValueHost` representing that field in Jivs.

When a field's validation state changes, the callback supplies the `FieldValueHost` that changed. Application code then needs to locate the UI elements associated with that ValueHost.

The markup developed above uses a shared field identifier:

```text
first-name
```

That identifier may differ from the ValueHost name:

```text
FirstName
```

The ValueHost therefore needs to know the identifier used by its UI. When configuring the field, assign that identifier to `elementIdentifier`:

```ts
builder.field('FirstName', LookupKey.String, {
    elementIdentifier: 'first-name'
});
```

`getElementIdentifier()` returns the configured `elementIdentifier`:

```ts
const fieldId =
    valueHost.getElementIdentifier();
// "first-name"
```

When `elementIdentifier` has not been configured, it falls back to `valueHost.getName()`.

The resolved identifier can be used with the markup conventions introduced above:

```ts
const fieldElements =
    document.querySelectorAll(
        `[data-field=${CSS.escape(fieldId)}]`
    );
```

Related element IDs can use that common value with predictable suffixes:

```text
first-name or first-name_editor
first-name_label
first-name_errorMessages
first-name_required
first-name_container
```

`getElementIdentifier()` can generate these predictable element IDs. Pass a template containing `{0}` where the resolved identifier belongs:

```ts
const errorId =
    valueHost.getElementIdentifier(
        '{0}_errorMessages'
    );
// "first-name_errorMessages"
```

This gives application code one consistent connection between the `FieldValueHost` and either the field's shared `data-field` value or the ID of a specific related element.

### Form Markup

Form-level validation can also have several UI consumers. Common examples include:

- a Validation Summary that presents issues from across the form
- a Submit button whose availability reflects whether the form can be saved

Here is some typical markup, already updated with Jivs SimpleDom custom attributes.

```html
<form
    id="person-form"
    novalidate>

    <div
        data-jivs-role="summary"
        data-jivs-presentation="validationSummary">
    </div>

    <!-- Field markup appears here. -->

    <button
        type="submit"
        data-jivs-role="submit"
        data-jivs-presentation="disableSubmit">
        Save
    </button>
</form>
```

These consumers belong to the form rather than to an individual field, so they do not need a `data-field` attribute.

Jivs SimpleDom uses two additional `data-jivs-role` values for form-level consumers:

- `summary` — identifies the form's Validation Summary
- `submit` — identifies the form's Submit button

The Validation Summary and Submit button consume changing form validation state, so each requests one of the Presentation Functions developed under [The Form Presentation Functions](Form_Presentation_of_Jivs_Validation.md#the-form-presentation-functions):

- The Validation Summary requests `data-jivs-presentation="validationSummary"`. This guide's Presentation Function rebuilds its content from `ValidationState.issuesFound`, using each issue's `summaryMessage` when available.
- The Submit button requests `data-jivs-presentation="disableSubmit"`. Its Presentation Function enables or disables the button based on `ValidationState.doNotSave`.

Application code can locate these consumers by role:

```css
[data-jivs-role="summary"]

[data-jivs-role="submit"]
```

During initialization, call `attachFormPresentations()`. It finds the `summary` and `submit` roles that declare `data-jivs-presentation`. It reads each Presentation name and attaches the corresponding form Presentation Function.

```ts
attachFormPresentations();
```

[Initialize Form Presentation Functions](Form_Presentation_of_Jivs_Validation.md#initialize-form-presentation-functions) explains the attachment process.

---

Continue to the next section of the Jivs Presentation Learning Guide: [From Jivs Validation State to Client Presentation](From_Jivs_Validation_State_to_Client_Presentation.md).

Return to [Learning Jivs TOC](./Learning_Jivs_Home.md).