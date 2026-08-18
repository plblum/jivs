# Field Presentation: Field Error Displays

This document continues [Field Presentation of Jivs Validation](Field_Presentation_of_Jivs_Validation.md) by focusing on the presentation choices available for Field Error Displays.

Field Error Displays vary widely. Some forms show Error Messages directly below the editor, some use a compact icon or native tooltip, and others hand the messages to a popup or alert component supplied by a UI library.

Applications commonly use approaches such as:

- one Error Message at a time
- all Error Messages displayed together
- a native browser tooltip
- a popup, alert, or popover
- an error icon that reveals messages on interaction
- application-specific components or notifications

The shared Error Message HTML and text generators were developed under [Generating Error Messages from `IssueFound` Objects](From_Jivs_Validation_State_to_Client_Presentation.md#generating-error-messages-from-issuefound-objects).

This section separates the common work from the presentation choices. We'll:

- build an inline Error Display
- show an error icon with a native tooltip
- attach a native tooltip to the container around an editor
- show how the same generated HTML can be handed to a UI-library popup, alert, or popover

Most Field Error Displays have two parts:

1. **Generate the Error Messages** — turn `issuesFound` into either HTML or plain text.
2. **Present those Error Messages** — decide where and how they appear.

Keeping those responsibilities separate lets several Field Error Display designs share the same Error Message generation.

## Inline Error Display

The simplest Field Error Display places the generated HTML directly in the page.

```html
<div
    data-field="first-name"
    data-jivs-role="error"
    data-jivs-presentation="inlineError">
</div>
```

Its Presentation Function generates the messages and exposes whether there are any issues:

```ts
export function inlineErrorDisplayChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void {
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
}
```

You can find this code in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts).

CSS can hide the Error Display when there are no issues:

```css
[data-jivs-presentation="inlineError"]:not(.has-issues) {
    display: none;
}
```

The Error Display tests `issuesFound`, not `isValid`, because it should also present issues such as Warnings that do not make the field invalid.

*Accessibility requirements for dynamically presented Error Messages are covered in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md).*

## Error Icon with a Native Tooltip

A compact Field Error Display can show an error icon only while issues are present. Pointing to the icon displays the Error Messages through the browser's native tooltip.

This example uses the ❗ symbol:

```html
<span
    class="field-error-icon"
    data-field="first-name"
    data-jivs-role="error"
    data-jivs-presentation="errorIcon">
    &#x2757;
</span>
```

The Presentation Function adds or removes the tooltip text and exposes whether the icon should be visible:

```ts
export function errorIconChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void {
    const issues =
        validationState.issuesFound;

    const hasIssues =
        Boolean(issues?.length);

    element.classList.toggle(
        'has-issues',
        hasIssues
    );

    if (!issues?.length) {
        element.removeAttribute('title');
        return;
    }

    element.title =
        buildErrorMessagesText(issues);
}
```

You can find this code in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts).

CSS controls whether the icon is shown:

```css
.field-error-icon:not(.has-issues) {
    display: none;
}
```

This gives pointer users a compact native tooltip presentation.

*The additional accessibility needed beyond a native `title` tooltip is covered in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md).*

## Put the Editor's Errors in a Native Tooltip

Another compact approach makes the tooltip appear to belong directly to the editor.

Wrap the editor in a container with no additional spacing:

```html
<span
    class="editor-error-container"
    data-field="first-name"
    data-jivs-role="error"
    data-jivs-presentation="editorTooltip">

    <input
        id="first-name"
        data-field="first-name"
        data-jivs-role="editor"
        data-jivs-presentation="invalidEditor">
</span>
```

The container is the Field Error Display, and in this case it is always visible. Its Presentation Function adds or removes the native tooltip:

```ts
export function editorTooltipChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void {
    const issues =
        validationState.issuesFound;

    if (!issues?.length) {
        element.removeAttribute('title');
        return;
    }

    element.title =
        buildErrorMessagesText(issues);
}
```

You can find this code in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts).

Because the container closely surrounds the editor, pointing within that area makes the Error Messages appear as a tooltip associated with the editor.

The Presentation Function does not need to modify the editor itself, and the Dispatcher Function does not need any special knowledge of this presentation.

*The additional accessibility needed beyond a native `title` tooltip is covered in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md).*

## Use a UI-Library Popup, Alert, or Popover

Applications that need richer popup behavior should usually use the popup, alert, popover, or similar component already provided by their UI library.

The Presentation Function still has the same responsibilities:

- determine whether issues exist
- generate the Error Message content
- provide that content to the UI-library component
- show or hide the component as appropriate

For example, conceptually:

```ts
export function popupErrorDisplayChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void {
    const issues =
        validationState.issuesFound;

    if (!issues?.length) {
        hideErrorPopup(element);
        return;
    }

    showErrorPopup(
        element,
        buildErrorMessagesHtml(issues)
    );
}
```

You will write `showErrorPopup()` and `hideErrorPopup()` to work with the application's UI-library integration.

Add a corresponding name to `getFieldPresentationFunction()` when using this Presentation Function:

```ts
case 'popupError':
    return popupErrorDisplayChanged;
```

The UI library remains responsible for popup behavior such as positioning, dismissal, focus handling, keyboard interaction, and accessibility. Jivs supplies the validation state, while the Presentation Function supplies the Error Message content and decides when the popup is needed.

---

Continue to the next section of the Jivs Presentation Learning Guide: [Form Presentation of Jivs Validation](Form_Presentation_of_Jivs_Validation.md).
