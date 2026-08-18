# Accessible Client Validation UI

Validation information should be communicated both visually and to assistive technologies.

Jivs supplies the required and validation state used by the UI, but it does not require a particular accessibility implementation. Each application or framework integration is responsible for applying the appropriate HTML semantics, ARIA attributes, announcements, focus behavior, and keyboard interaction.

The examples in this document use the HTML attributes and Presentation Functions introduced in [Jivs Presentation Learning Guide](Client_Presentation_of_Jivs_Validation.md). Those Jivs SimpleDom conventions provide a familiar DOM implementation for the examples, but the accessibility responsibilities apply to any UI built with Jivs.

## Prefer Native HTML Semantics

Use native HTML semantics whenever the element supports them.

For example, native `<input>`, `<select>`, and `<textarea>` elements support the `required` attribute. Custom editors may instead need `aria-required`.

The form's `novalidate` attribute prevents native browser validation from competing with Jivs. It does not require the application to replace useful native accessibility semantics with ARIA.

ARIA supplements native HTML. It should not duplicate or conflict with semantics the element already provides.

## Editor Accessibility State

An editor commonly communicates:

* whether its current value is invalid
* whether it requires a value
* which element contains its Error Messages

These responsibilities use state supplied by the editor's `FieldValueHost`.

### Invalid State

`aria-invalid` follows the field's validation state:

```ts
const invalid =
    validationState.isValid === false;

element.setAttribute(
    'aria-invalid',
    String(invalid)
);
```

This work can be added to the same Presentation Function that applies the editor's invalid styling.

Do not mark an editor invalid before Jivs has determined that its current value is invalid.

### Required State

Required state comes from `FieldValueHost.required`, not from `ValueHostValidationState`.

For a native editor that supports `required`:

```ts
element.toggleAttribute(
    'required',
    valueHost.required
);
```

For a custom editor without equivalent native semantics:

```ts
if (valueHost.required) {
    element.setAttribute(
        'aria-required',
        'true'
    );
}
else {
    element.removeAttribute(
        'aria-required'
    );
}
```

Because required state remains static throughout the `FieldValueHost` lifecycle, establish this state while initializing the editor rather than in response to validation changes.

### Link the Editor to Its Field Error Display

`aria-errormessage` identifies the element that contains the editor's Error Messages.

The Jivs SimpleDom field identifier can be used to establish a predictable relationship:

```html
<input
    id="first-name"
    data-field="first-name"
    data-jivs-role="editor"
    aria-errormessage="first-name_errorMessages">

<div
    id="first-name_errorMessages"
    data-field="first-name"
    data-jivs-role="error">
</div>
```

The Field Error Display ID can also be obtained from the `FieldValueHost`:

```ts
const errorId =
    valueHost.getElementIdentifier(
        '{0}_errorMessages'
    );
```

Use `aria-errormessage` together with `aria-invalid`.

When the editor is invalid, the referenced Field Error Display must be available to assistive technologies:

```ts
if (invalid) {
    element.setAttribute(
        'aria-errormessage',
        errorId
    );
}
else {
    element.removeAttribute(
        'aria-errormessage'
    );
}
```

Removing `aria-errormessage` while the editor is valid avoids referring to Error Messages that are not currently relevant. Another valid approach is to retain the attribute while ensuring that the referenced content is hidden until the editor becomes invalid.

The referenced Field Error Display needs an ID. The editor does not need an ID specifically for `aria-errormessage`, although it may need one for its `<label>` and other relationships.

Dynamic or repeated forms must keep all IDs unique.

## Field Error Display Accessibility

A Field Error Display presents the issues found for one field. Its accessibility behavior depends on whether the messages are inline, announced dynamically, or exposed through another UI component.

### Inline Error Messages

An inline Field Error Display should be available to assistive technologies whenever its messages are visible.

The same `has-issues` state used by the visual presentation can control whether the display is present:

```ts
const issues =
    validationState.issuesFound;

element.classList.toggle(
    'has-issues',
    Boolean(issues?.length)
);

element.innerHTML =
    issues?.length
        ? buildErrorMessagesHtml(issues)
        : '';
```

For example:

```css
[data-jivs-role="error"]:not(.has-issues) {
    display: none;
}
```

When issues are present, the Field Error Display becomes visible and the editor's `aria-errormessage` identifies it.

### Announce Dynamic Error Messages

`aria-errormessage` establishes the relationship between an editor and its Error Messages. A live region can additionally announce messages when they appear after user interaction.

Establish the live region in the original HTML before inserting messages:

```html
<div aria-live="polite">
    <div
        id="first-name_errorMessages"
        data-field="first-name"
        data-jivs-role="error">
    </div>
</div>
```

Keep the `aria-live` setting stable while updating the Error Message content. Do not switch it between `polite` and `off` each time validation changes.

Use `aria-live="polite"` for messages that should be announced after the current speech finishes. Reserve `aria-live="assertive"` for issues that genuinely require immediate interruption.

Severity-aware announcement behavior should inspect the individual `IssueFound` objects. Do not assume every Severe issue should interrupt the user; the appropriate behavior also depends on when and how the issue appeared.

A live region is not required for every Field Error Display. Avoid creating repeated or competing announcements when focus movement, `aria-errormessage`, a Validation Summary, or a UI-library component already communicates the same information.

## Required Indicator Accessibility

A visible Required Indicator must not be the only way the UI communicates that a field is required.

When the editor already exposes required state through native HTML or `aria-required`, the visual indicator can be hidden from assistive technologies to avoid redundant announcements:

```html
<span
    data-field="first-name"
    data-jivs-role="required"
    aria-hidden="true">
    *
</span>
```

Jivs supplies the required state through `FieldValueHost.required`. The UI remains responsible for applying that state to the editor and presenting any accompanying visual indicator.

## Validation Summary Accessibility

A Validation Summary presents issues from across the complete `ValueHostsManager`.

Give the summary a clear visible heading so users understand its purpose. If the summary changes dynamically, it may use an established polite live region to announce the updated content.

After an unsuccessful submission, application code may move focus to the Validation Summary so keyboard and assistive-technology users encounter it immediately. A non-interactive summary can receive programmatic focus through `tabindex="-1"`:

```html
<div
    tabindex="-1"
    data-jivs-role="summary"
    data-jivs-presentation="validationSummary">
</div>
```

Move focus deliberately after the submission attempt. Do not move focus whenever routine validation state changes.

When a Summary Message represents a field, the application can use `IssueFound.valueHostName` and the corresponding field element identifier to help the user reach the editor. Depending on the application's structure, this may involve:

* focusing the editor
* scrolling it into view
* opening an accordion
* selecting a tab
* opening a dialog
* revealing the corresponding Field Error Display

Focus and navigation behavior remain application-owned because they depend on the surrounding UI structure.

## Hidden, Tooltip, and Popup Error Displays

Some UIs reveal validation messages through a tooltip, icon, popup, notification, or editor focus instead of displaying them inline.

In those designs, visual visibility and accessibility visibility must remain coordinated.

Do not rely on a native `title` tooltip as the only way to communicate Error Messages. Its content may be unavailable to keyboard, touch, or assistive-technology users.

An interactive error icon must be keyboard reachable and must expose the relationship between the control and its Error Messages.

If error content is unavailable while hidden, do not assume `aria-errormessage` alone makes it available to assistive technologies. Expose the content when it becomes relevant or use the accessible behavior supplied by the popup, alert, popover, or notification component.

A UI-library component remains responsible for:

* keyboard interaction
* focus management
* accessible naming and description
* dismissal
* positioning
* communicating its expanded or hidden state

Jivs supplies validation state and Error Messages. The UI component supplies accessible interaction.

## Submit / Save Control Accessibility

A disabled native Submit or Save button is removed from the keyboard focus order. Users may therefore be unable to reach the control or discover why it is unavailable.

Applications that disable submission based on `ValidationState.doNotSave` should provide another visible and accessible explanation of what must be corrected or completed.

Another approach is to leave the control enabled, run validation when it is activated, and then focus the Validation Summary or first invalid editor. The appropriate choice depends on the application's submission workflow.

Do not rely on the disabled control itself to communicate the validation problems preventing submission.

## Test the Completed UI

Accessibility behavior varies across browsers, assistive technologies, and UI-component libraries.

Test each completed validation presentation with:

* keyboard-only navigation
* representative desktop and mobile screen readers
* browser zoom and text resizing
* high-contrast or forced-color modes
* dynamic content replacement
* validation triggered during editing and during submission

Pay particular attention to duplicate announcements, missing Error Messages, unexpected focus movement, and validation content that is visually available but absent from the accessibility tree.

## Further Reading

* [WAI-ARIA 1.2: `aria-errormessage`](https://www.w3.org/TR/wai-aria-1.2/#aria-errormessage)
* [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
