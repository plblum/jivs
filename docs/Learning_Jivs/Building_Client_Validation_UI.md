# Building Client Validation UI

Jivs determines validation state. The application decides how that state should appear in the UI.

Validation UI commonly includes:

* Field Error Displays
* Required Indicators
* styling that responds to field validation
* Validation Summaries
* Submit / Save Controls

## Introducing Jivs SimpleDom

This document has two purposes: to explain how client validation UI connects to Jivs and to provide working tooling that implements the approach. That tooling is called **Jivs SimpleDom**.

Jivs SimpleDom combines a small set of conventions with supplied TypeScript and CSS. It provides one architecture for building client validation UI, but Jivs does not require applications to use it. At its core, Jivs remains independent of the UI.

The Jivs SimpleDom source code and examples cover:

* an architectural strategy for delivering Jivs validation state to the UI
* HTML and custom attributes for identifying fields and validation UI elements
* CSS for presenting validation state
* TypeScript for connecting the HTML to Jivs
* Presentation Functions for editors, labels, Field Error Displays, Validation Summaries, and Submit controls, plus initialization for Required Indicators

Readers who want a working validation UI can use Jivs SimpleDom as a starting point. Readers building another integration can use its implementation to understand the responsibilities their own UI must provide.

## How to Use This Guide

This guide develops a working validation UI in stages using **Jivs SimpleDom**.

Experienced web developers who are comfortable adding supplied TypeScript and CSS and making small additions to their HTML can begin with the [Quick Start](#quick-start). It gets the default Jivs SimpleDom validation UI working without first studying its implementation.

The remainder of the guide explains each part, fills in the concepts behind the setup, presents alternatives, and shows where to customize the result.

### Align Your HTML with Jivs SimpleDom

Continue building your form with ordinary HTML. When an element participates in the validation UI, add the Jivs SimpleDom attributes applicable to that element.

For example, identify an editor like this:

```html
<input
    id="first-name"
    data-field="first-name"
    data-jivs-role="editor"
    data-jivs-presentation="invalidEditor">
```

Jivs SimpleDom uses three custom attributes:

* `data-field` connects related elements to the same field.
* `data-jivs-role` identifies what an element does in the validation UI. Roles include `editor`, `label`, `container`, `error`, `required`, `summary`, and `submit`.
* `data-jivs-presentation` selects how an element presents changing validation state. Jivs SimpleDom supplies several Presentation Functions. Later sections of this guide show how to create your own.

As the guide introduces the parts it interacts with, it shows the corresponding attributes to add to your HTML.

[Plan Predictable UI Markup](#plan-predictable-ui-markup) defines the Jivs SimpleDom conventions and provides complete field and form examples. The later [Build the Field Validation UI](#build-the-field-validation-ui) and [Build the Form Validation UI](#build-the-form-validation-ui) sections explain the code that uses them.

### Use the Jivs SimpleDom Files

The reusable TypeScript and CSS developed by this guide are available in these files:

* [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts)
* [`jivs-simpledom.css`](../../starter_code/jivs-simpledom.css)

Add these files to your application as a starting point instead of assembling their contents from the individual snippets. The snippets remain in the guide to explain the code and identify the parts you are likely to customize.

### Choose the Presentations Your UI Needs

The complete Jivs SimpleDom HTML examples select default presentations supplied by the guide. These defaults produce a working validation UI and provide a useful starting point.

Later sections also show alternatives, particularly under [Presentation for a Field Error Display](#presentation-for-a-field-error-display). For example, an application might present Error Messages inline, through an icon, in a tooltip, or with a component supplied by its UI library.

Use the default presentation first or select the alternatives appropriate for your application. You do not need to implement every presentation shown in the guide.

Presentation names and their implementations belong to Jivs SimpleDom. They can be changed or replaced without changing Jivs.

### Work Through the Guide in Order

The remaining sections build upon one another:

1. [Before Building the UI](#before-building-the-ui) establishes the browser and security requirements that apply before validation UI is introduced.
2. [Plan the Jivs SimpleDom UI](#plan-the-jivs-simpledom-ui) establishes the CSS and markup conventions used by the supplied implementation.
3. [Prepare Jivs Validation for Presentation](#prepare-jivs-validation-for-presentation) explains the validation state received from Jivs, generates Error Messages, and delivers validation changes to the UI.
4. [Build the Field Validation UI](#build-the-field-validation-ui) connects field validation to editors, labels, and Field Error Displays and initializes Required Indicators.
5. [Build the Form Validation UI](#build-the-form-validation-ui) connects form validation to Validation Summaries and Submit / Save Controls.

Accessible validation behavior is covered separately in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md).

## Quick Start

This section is for experienced web developers who are comfortable adding supplied TypeScript and CSS, applying a few HTML conventions, and consulting the source when an adjustment is needed.

It shows the basics to apply Jivs SimpleDom to your UI. Continue through the rest of the guide when you need more explanation, an alternative presentation, or a customized implementation.

### Add the Default Validation UI

#### 1. Add the Jivs SimpleDom Files

Add these files to your application:

* [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts)
* [`jivs-simpledom.css`](../../starter_code/jivs-simpledom.css)

> If needed, you can locate them in the Jivs repo here: [starter_code](https://github.com/plblum/jivs/tree/main/starter_code)

Import the TypeScript exports and load the stylesheet using your application's normal mechanisms.

#### 2. Disable Native Browser Validation

Add `novalidate` to the form so native browser validation does not compete with Jivs:

```html
<form id="person-form" novalidate>
    ...
</form>
```

See [Disable Native Browser Validation](#disable-native-browser-validation) for details.

#### 3. Protect Error Messages from XSS

Replace the default `messageTokenResolverService` before creating the `ValueHostsManager`:

```ts
services.messageTokenResolverService =
    new HtmlMessageTokenResolverService();
```

See [Protect Error Messages from XSS](#protect-error-messages-from-xss) for details.

#### 4. Tag Each Editor

Add the field identifier, editor role, and default editor presentation:

```html
<input
    id="first-name"
    data-field="first-name"
    data-jivs-role="editor"
    data-jivs-presentation="invalidEditor">
```

The `data-field` value must match the field's Jivs element identifier. Configure `elementIdentifier` on the `FieldValueHost` when it differs from the ValueHost name.

See [Connect the FieldValueHost to the Field Identifier](#connect-the-fieldvaluehost-to-the-field-identifier) for details.

#### 5. Tag Each Label You Want Styled

Labels are optional validation consumers. To have a label respond when its field is invalid, add:

```html
<label
    for="first-name"
    data-field="first-name"
    data-jivs-role="label"
    data-jivs-presentation="invalidLabel">
    First name
</label>
```

See [Presentation for a Label](#presentation-for-a-label) for details.

#### 6. Add a Field Error Display

Add the default inline Field Error Display for each field:

```html
<div
    data-field="first-name"
    data-jivs-role="error"
    data-jivs-presentation="inlineError">
</div>
```

See [Presentation for a Field Error Display](#presentation-for-a-field-error-display) for details and alternative presentations.

#### 7. Add a Required Indicator If Desired

A Required Indicator does not need a Presentation name:

```html
<span
    data-field="first-name"
    data-jivs-role="required">
    *
</span>
```

The supplied initialization code reads `FieldValueHost.required` to determine whether the indicator should appear.

See [Field Markup](#field-markup) for its place within the complete field and [Initialize Required Indicators](#initialize-required-indicators) for initialization details.

#### 8. Add a Validation Summary If Desired

Place the Validation Summary within the form:

```html
<div
    data-jivs-role="summary"
    data-jivs-presentation="validationSummary">
</div>
```

See [Presentation for a Validation Summary](#presentation-for-a-validation-summary) for details.

#### 9. Tag the Submit Button If Desired

To have form validation control the Submit button, add:

```html
<button
    type="submit"
    data-jivs-role="submit"
    data-jivs-presentation="disableSubmit">
    Save
</button>
```

See [Presentation for a Submit / Save Control](#presentation-for-a-submit-save-control) for details.

#### 10. Wire Field and Form Validation

Use the supplied Dispatcher Functions as the `ValueHostsManager` callbacks:

```ts
config.onValueHostValidationStateChanged =
    fieldValidated;

config.onValidationStateChanged =
    formValidated;
```

See [The Field Dispatcher Function](#the-field-dispatcher-function) and [The Form Dispatcher Function](#the-form-dispatcher-function) for details.

#### 11. Initialize the Validation UI

After the `ValueHostsManager` has been created and the form's HTML is available, attach the selected Presentation Functions and initialize the Required Indicators:

```ts
attachFieldPresentations();
attachFormPresentations();
initializeRequiredIndicators(vhm);
```

The default Field Validation UI and Form Validation UI are now connected to Jivs.

### Continue Through the Guide When Needed

The Quick Start deliberately leaves out most implementation detail. Continue through the rest of the guide when you need to:

* understand the browser and security requirements under [Before Building the UI](#before-building-the-ui)
* understand or change the [HTML conventions](#plan-predictable-ui-markup)
* customize the supplied CSS under [Use CSS to Drive Presentation](#use-css-to-drive-presentation)
* understand [`ValidationState` and `ValueHostValidationState`](#validationstate-and-valuehostvalidationstate) or [`IssueFound`](#understanding-issuefound)
* customize [Error Message generation](#generate-error-messages)
* change how [validation state reaches the UI](#deliver-validation-state-to-the-ui)
* select another [Field Error Display](#presentation-for-a-field-error-display)
* create or register a [Field Presentation Function](#the-field-presentation-functions) or [Form Presentation Function](#the-form-presentation-functions)
* add behavior described in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md)

## Before Building the UI

Before choosing how validation should appear, prepare two behaviors that apply to every client validation UI:

* disable native browser validation so it does not compete with Jivs
* protect Error Messages from XSS attacks

These requirements apply whether the application uses Jivs SimpleDom, a framework-specific Jivs integration, or another UI architecture.

### Disable Native Browser Validation

Browsers provide their own form validation for attributes such as `required`, input types, and other constraints.

When Jivs is responsible for validation, disable native browser form validation so browser-generated validation behavior does not compete with Jivs.

Use `novalidate` on the form:

```html
<form id="person-form" novalidate>
    ...
</form>
```

The examples in this document use `novalidate`.

Also avoid depending on native validation attributes such as `required` to define Jivs validation rules. Jivs validation state should remain the source used by the validation UI.

### Protect Error Messages from XSS

Error messages contain tokens, some of which can echo back user input. For example, "You entered {value}." Because these token values may originate from untrusted user input, they must be HTML-encoded before being inserted into the final message to prevent XSS.

The default `MessageTokenResolverService` does not encode replacement values. The implementation below is available in the companion [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts) file. You can use it from that file instead of copying it from this section.

```ts
export function encodeHtml(
    value: string
): string {
    const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return value.replace(
        /[&<>"']/g,
        character => entities[character]
    );
}

export class HtmlMessageTokenResolverService
    extends MessageTokenResolverService {

    protected override finalizeReplacement(
        replacement: string,
        tav: TokenLabelAndValue
    ): string {
        const encodedValue =
            encodeHtml(replacement);

        const purposeClass =
            tav.purpose
                ? ` ${tav.purpose}`
                : '';

        return (
            `<span class="token${purposeClass}">` +
            encodedValue +
            '</span>'
        );
    }
}
```

The resulting markup identifies the replacement as a token and includes its purpose when supplied:

```html
<span class="token label">First name</span>
```

Install the subclass on the `JivsServices` instance before creating the `ValueHostsManager`:

```ts
const services =
    createJivsServices('en-US');

services.messageTokenResolverService =
    new HtmlMessageTokenResolverService();
```

All user-controlled data included in an Error Message should be supplied through message tokens so this service can encode it.

## Plan the Jivs SimpleDom UI

Jivs SimpleDom needs a predictable way to identify validation UI elements and determine how those elements should respond.

This section establishes the HTML and CSS conventions used throughout the implementation:

* expose changing state through CSS classes
* let containers respond to state exposed by their descendants
* associate the elements belonging to the same field
* identify what each validation UI element does
* let validation consumers select their Presentation Functions
* connect each `FieldValueHost` to the identifier used by its UI

These conventions belong to Jivs SimpleDom. They are not requirements imposed by Jivs, and applications or framework integrations can replace them with another approach.

A useful principle throughout Jivs SimpleDom is:

> **Expose validation state to the appropriate UI element, then let that element decide how to present it.**

### Use CSS to Drive Presentation

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

The Presentation Functions developed later will add and remove state classes such as `invalid`. CSS remains responsible for deciding how those states look.

#### Style Containers Based on Invalid Fields

An invalid state may be exposed on one editor, while the visual response belongs to a larger part of the UI.

For example, an invalid editor may need to change the appearance of:

* its field container
* a surrounding fieldset
* a card or panel
* a larger group of related fields

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

### Plan Predictable UI Markup

Jivs SimpleDom needs a reliable way to connect validation state with the UI elements interested in that state.

The conventions below are used by Jivs SimpleDom. They are **not Jivs requirements**. Applications and framework integrations may use other names or other mechanisms entirely.

#### Field Markup

A field commonly has several related UI elements:

* editor, often an `<input>`, `<select>`, or `<textarea>`
* label
* Field Error Display
* Required Indicator
* an enclosing field container

Start with one identifier for the field:

```text
first-name
```

Related element IDs can use that common value with predictable suffixes:

```text
first-name or first-name_editor
first-name_label
first-name_errorMessages
first-name_required
first-name_container
```

The markup conventions use three custom attributes:

* `data-field` identifies which field an element belongs to.
* `data-jivs-role` identifies what the element does within the validation UI.
* `data-jivs-presentation` names the Presentation Function requested by an element that consumes validation state.

The field-related `data-jivs-role` values used by Jivs SimpleDom are:

* `container` — encloses the UI elements associated with one field
* `label` — identifies the field's label
* `editor` — identifies the element that edits the field's value
* `error` — identifies a Field Error Display
* `required` — identifies a Required Indicator

Because related elements share the same `data-field` value and have distinct roles, application code can construct selectors generically for any field.

For example, this selector locates the Field Error Display belonging to `first-name`:

```css
[data-field="first-name"][data-jivs-role="error"]
```

The complete field markup can look like this:

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

The label, editor, and Field Error Display consume changing validation state, so each requests one of the functions developed under [The Field Presentation Functions](#the-field-presentation-functions):

* The label requests `data-jivs-presentation="invalidLabel"`. This guide's Presentation Function adds or removes the `invalid` class based on `ValueHostValidationState.isValid`.
* The editor requests `data-jivs-presentation="invalidEditor"`. Its Presentation Function also adds or removes the `invalid` class based on `ValueHostValidationState.isValid`.
* The Field Error Display requests `data-jivs-presentation="inlineError"`. Its Presentation Function generates content from `ValueHostValidationState.issuesFound` and exposes whether issues are present.

The enclosing container does not need its own Presentation Function because CSS can react to the invalid editor inside it. For example:

```css
[data-jivs-role="container"]:has(
    [data-jivs-role="editor"].invalid
) {
    outline: 2px solid currentColor;
}
```

The Required Indicator is initialized separately from changing validation state, so it also does not declare `data-jivs-presentation`. Later, you will initialize its visibility from `FieldValueHost.required`.

##### Connect the FieldValueHost to the Field Identifier

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

`getElementIdentifier()` can also generate the predictable element IDs introduced earlier. Pass a template containing `{0}` where the resolved identifier belongs:

```ts
const errorId =
    valueHost.getElementIdentifier(
        '{0}_errorMessages'
    );
// "first-name_errorMessages"
```

This gives application code one consistent connection between the `FieldValueHost` and either the field's shared `data-field` value or the ID of a specific related element.

#### Form Markup

Form-level validation can also have several UI consumers. Common examples include:

* a Validation Summary that presents issues from across the form
* a Submit button whose availability reflects whether the form can be saved

These consumers belong to the form rather than to an individual field, so they do not need a `data-field` attribute.

Jivs SimpleDom uses two additional `data-jivs-role` values for form-level consumers:

* `summary` — identifies the form's Validation Summary
* `submit` — identifies the form's Submit button

For example:

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

The Validation Summary and Submit button consume changing form validation state, so each requests one of the Presentation Functions developed later:

* The Validation Summary requests `data-jivs-presentation="validationSummary"`. This guide's Presentation Function rebuilds its content from `ValidationState.issuesFound`, using each issue's `summaryMessage` when available.
* The Submit button requests `data-jivs-presentation="disableSubmit"`. Its Presentation Function enables or disables the button based on `ValidationState.doNotSave`.

Application code can locate these consumers by role:

```css
[data-jivs-role="summary"]

[data-jivs-role="submit"]
```

As with the field-related role and Presentation names, these are Jivs SimpleDom conventions. Applications can replace them with other names or another discovery mechanism.

The important idea is that form-level validation consumers can be discovered and connected to their Presentation Functions without tying validation-state delivery to one particular UI implementation.

## Prepare Jivs Validation for Presentation

With the Jivs SimpleDom HTML and CSS conventions planned, the next step is to understand the information Jivs supplies and prepare the shared content used by the Presentation Functions.

This section:

* explains the field and form validation-state objects
* identifies the information available through each `IssueFound`
* generates reusable Error Message HTML and plain text
* establishes how Jivs validation state reaches the appropriate UI elements

The state objects and `IssueFound` belong to Jivs. The Error Message generators and callback-and-dispatcher design are the implementation developed by this guide.

### Understand Validation State and Issues

Jivs reports validation results through state objects. These objects give the UI the information it needs without requiring the UI to inspect individual Validators.

The same state model supports both the Field Validation UI and Form Validation UI.

#### ValidationState and ValueHostValidationState

Jivs supplies two related validation-state types:

* `ValueHostValidationState` describes validation for one ValueHost.
* `ValidationState` describes validation across the complete `ValueHostsManager`.

Their complete definitions are:

```ts
interface ValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: IssueFound[] | null;
    asyncProcessing: boolean;
}

interface ValueHostValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: IssueFound[] | null;
    asyncProcessing: boolean;
    status: ValidationStatus;
    corrected: boolean;
}
```

They share four properties:

* `isValid` — whether validation currently considers the ValueHost or complete `ValueHostsManager` valid
* `doNotSave` — whether the current state should prevent saving
* `issuesFound` — the issues currently associated with that scope. This will be your source for Error Messages.
* `asyncProcessing` — whether asynchronous validation is running within that scope. While it is running, `doNotSave` prevents form submission.

The scope depends on which state object was supplied. For example, `ValueHostValidationState.issuesFound` contains issues for one ValueHost, while `ValidationState.issuesFound` contains issues collected across the complete `ValueHostsManager`.

`isValid` and `doNotSave` answer different questions. A severity of *Warning* can produce an `IssueFound` while `isValid` remains `true`. `doNotSave` also accounts for states where validation is not yet ready to permit saving, such as required validation that has not run or asynchronous validation that is still processing.

`ValueHostValidationState` adds two field-specific properties:

* `status` — the ValueHost's current `ValidationStatus`
* `corrected` — whether previously invalid Validators have been corrected

Their field-specific presentation uses are covered later when building the Field Validation UI.

Both state types use the same `IssueFound` type to describe individual validation issues.

#### Understanding IssueFound

Each entry in `issuesFound` is an `IssueFound`. Field Error Displays and Validation Summaries use these objects as the source of their Error Messages.

```ts
interface IssueFound {
    errorMessage: string;
    summaryMessage?: string;
    severity?: ValidationSeverity;
    valueHostName?: ValueHostName;
    errorCode?: string;
    doNotSave?: boolean;
}
```

Its properties are:

* `errorMessage` — the fully prepared Error Message normally presented by a Field Error Display
* `summaryMessage` — an alternative Error Message intended for a Validation Summary
* `severity` — identifies the severity of the issue
* `valueHostName` — identifies the ValueHost associated with the issue
* `errorCode` — identifies the type of issue or Validator that supplied it
* `doNotSave` — indicates whether this issue should prevent saving

A Validation Summary normally uses `summaryMessage` when it is supplied and falls back to `errorMessage` when it is not.

`valueHostName` lets form-level UI connect an issue back to its field. For example, a Validation Summary can use it to locate, focus, or scroll to the corresponding editor. Some issues may not identify a specific ValueHost, so this property is optional.

A validation state can contain more than one `IssueFound`. Each Error Message consumer decides whether to present one issue, every issue, selected severities, or another presentation entirely.

A `Warning` can appear in `issuesFound` while `isValid` remains `true`. Error Message consumers should therefore inspect `issuesFound` rather than relying on `isValid` to decide whether messages should be presented.

The validation state's `doNotSave` property already represents whether the complete state should prevent saving. A Submit Presentation Function can use that property directly rather than recalculating it from individual issues.

### Generate Error Messages

Field Error Displays and Validation Summaries both turn `IssueFound` objects into Error Message content.

Most Error Message consumers have two responsibilities:

1. **Generate the Error Messages** — turn `issuesFound` into HTML or plain text.
2. **Present the Error Messages** — decide where and how that content appears.

Keeping these responsibilities separate lets several Presentation Functions share the same Error Message generation. This section explains those choices and provides code you can use.

#### Generate Error Message HTML

The code in this section generates HTML-formatted Error Messages. They can be used by:

* Field Error Displays, including inline and popup presentations
* Validation Summaries
* UI-library tooltips, popovers, and other HTML-capable hints attached to the editor, label, or container

Native browser tooltips do not accept HTML. The plain-text generator developed next supports those presentations.

The generated HTML uses different elements depending on whether there is one issue or multiple issues.

When there is one issue, it generates a containing `<span>`:

```html
<span data-error-code="RequireText">
    The First name requires a value.
</span>
```

When there are multiple issues, it generates a list:

```html
<ul>
    <li data-error-code="RequireText">
        The First name requires a value.
    </li>
    <li
        data-error-code="UnusualValue"
        data-severity="warning">
        This value is unusual.
    </li>
</ul>
```

Each message is tagged with custom attributes so CSS and other presentation logic can respond to its characteristics:

* `data-error-code` contains `IssueFound.errorCode` when supplied.
* `data-severity` contains the severity name when the severity is not the normal `Error`.

Jivs supplies Error Message strings that may contain internal HTML markup around resolved tokens. For example:

```html
The <span class="token label">First name</span> is invalid.
```

The [Protect Error Messages from XSS](#protect-error-messages-from-xss) setup HTML-encodes the replacement value before adding these tags. The HTML generator is deliberately designed to preserve this prepared markup when building the final Error Message content.

By default, the generator uses `IssueFound.errorMessage`, making it suitable for Field Error Displays. Pass `true` for `useSummaryMessage` to use `summaryMessage` for a Validation Summary. When `summaryMessage` is not supplied, the generator falls back to `errorMessage`.

The following functions are also available in the companion [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts) file:

```ts
export const severityNames: Array<string | null> = [
    'warning',
    null,
    'severe'
];

export function buildErrorMessagesHtml(
    issues: IssueFound[],
    useSummaryMessage = false
): string {
    if (issues.length === 0) {
        return '';
    }

    if (issues.length === 1) {
        return buildErrorMessageHtml(
            'span',
            issues[0],
            useSummaryMessage
        );
    }

    const items =
        issues
            .map(issue =>
                buildErrorMessageHtml(
                    'li',
                    issue,
                    useSummaryMessage
                )
            )
            .join('');

    return `<ul>${items}</ul>`;
}

export function buildErrorMessageHtml(
    tagName: 'span' | 'li',
    issue: IssueFound,
    useSummaryMessage: boolean
): string {
    const attributes: string[] = [];

    if (issue.errorCode) {
        attributes.push(
            `data-error-code="${encodeHtml(issue.errorCode)}"`
        );
    }

    const severity =
        issue.severity === undefined
            ? null
            : severityNames[issue.severity];

    if (severity) {
        attributes.push(
            `data-severity="${severity}"`
        );
    }

    const attributeText =
        attributes.length
            ? ` ${attributes.join(' ')}`
            : '';

    const message =
        useSummaryMessage
            ? issue.summaryMessage ?? issue.errorMessage
            : issue.errorMessage;

    return (
        `<${tagName}${attributeText}>` +
        message +
        `</${tagName}>`
    );
}
```

A Field Error Display uses the default behavior:

```ts
buildErrorMessagesHtml(issues);
```

A Validation Summary requests summary messages:

```ts
buildErrorMessagesHtml(
    issues,
    true
);
```

The normal `Error` severity does not need a `data-severity` attribute.

#### Generate Error Message Text

Native browser tooltips and other text-only consumers cannot use the prepared HTML contained in an Error Message.

The text generator lets the browser parse the prepared markup in a detached element and then extracts its text content. For example:

```html
The <span class="token label">First name</span> is invalid.
```

becomes:

```text
The First name is invalid.
```

The [Protect Error Messages from XSS](#protect-error-messages-from-xss) setup ensures that token replacement values were HTML-encoded before the prepared Error Message reached this function.

The following functions are also available in the companion [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts) file:

```ts
export function buildErrorMessagesText(
    issues: IssueFound[]
): string {
    return issues
        .map(issue =>
            errorMessageToText(
                issue.errorMessage
            )
        )
        .join(' • ');
}

export function errorMessageToText(
    errorMessage: string
): string {
    const container =
        document.createElement('div');

    container.innerHTML =
        errorMessage;

    return container.textContent ?? '';
}
```

When there are several issues, the visible `•` separator keeps the messages distinct without depending on how a browser renders line breaks in its native tooltip.

For example:

```text
The First name requires a value. • This value is unusual.
```

### Deliver Validation State to the UI

Jivs reports validation changes through callbacks supplied in the `ValueHostsManager` configuration. Application code must deliver the supplied state to the UI elements that want to present it.

The Jivs SimpleDom approach has three parts:

1. **ValueHostsManager callback** — reports that validation state changed and supplies the new state.
2. **Dispatcher Function** — locates the UI elements interested in that state and calls each element's Presentation Function.
3. **Presentation Function** — decides how one UI element should respond to the supplied state.

The Dispatcher Function is the bridge between Jivs and the UI:

```text
ValueHostsManager callback
    → Dispatcher Function
        → Presentation Function
            → UI element
```

Jivs provides separate callbacks for field and form validation:

| Scope                      | ValueHostsManager callback          | State supplied             |
| -------------------------- | ----------------------------------- | -------------------------- |
| One ValueHost              | `onValueHostValidationStateChanged` | `ValueHostValidationState` |
| Complete ValueHostsManager | `onValidationStateChanged`          | `ValidationState`          |

A field Dispatcher Function uses the ValueHost's element identifier and the `data-field` convention to locate consumers belonging to that field.

A form Dispatcher Function locates consumers such as the Validation Summary and Submit button by their `data-jivs-role`.

During UI initialization, `data-jivs-presentation` identifies the Presentation Function requested by each consumer. The Dispatcher Function does not need to know how those functions present the state. It only delivers the appropriate state to them.

The later [Build the Field Validation UI](#build-the-field-validation-ui) and [Build the Form Validation UI](#build-the-form-validation-ui) sections implement their callbacks, Dispatcher Functions, and Presentation Functions.

This callback-and-dispatcher design belongs to Jivs SimpleDom. It is not a requirement imposed by Jivs. Applications and framework integrations can deliver validation state to their UI in other ways.


## Build the Field Validation UI

A field may have several UI elements that respond to validation: its editor, label, Field Error Display, and sometimes application-specific widgets. Required Indicators are also part of the Field Validation UI, but they are initialized separately because required status is field configuration rather than changing validation state.

The preparation from **Before Building the UI**, **Plan the Jivs SimpleDom UI**, and **Prepare Jivs Validation for Presentation** now pays off:

* We need a Field Dispatcher Function that dispatches validation changes to interested UI elements.
* We need Field Presentation Functions for each approach to presenting validation in the UI.
* `elementIdentifier` connects the `FieldValueHost` to its field identifier.
* The `data-field` attribute lets us find elements belonging to that field.
* The `data-jivs-role` attribute identifies what each element does.

The work ahead:

* Build your Field Dispatcher Function and wire it to `ValueHostsManager.onValueHostValidationStateChanged`.
* Build Field Presentation Functions for each use case and connect them to the `onFieldValidationStateChanged` callback of the relevant elements.
* Initialize Required Indicators from `FieldValueHost.required`.

### The Field Dispatcher Function

A Field Dispatcher Function has this TypeScript contract:

```ts
export type FieldDispatcher = (
    valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
) => void;
```

It is attached to the `ValueHostsManager` through its `onValueHostValidationStateChanged` callback:

```ts
config.onValueHostValidationStateChanged = yourFieldDispatcher;

const vhm = new ValueHostsManager(config);
```

This Field Dispatcher Function locates every validation consumer associated with that field and calls its `onFieldValidationStateChanged` Presentation Function:

```ts
export function fieldValidated(
    valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void {
    const fieldId =
        valueHost.getElementIdentifier();

    const consumers =
        document.querySelectorAll<IFieldValidationConsumerElement>(
            `[data-field="${CSS.escape(fieldId)}"]` +
            `[data-jivs-role]`
        );

    for (const consumer of consumers) {
        consumer.onFieldValidationStateChanged?.(
            consumer,
            valueHost,
            validationState
        );
    }
}
```

The Field Dispatcher Function does not change CSS classes, rebuild Error Messages, manage accessibility attributes, or otherwise decide how validation should appear.

Those decisions belong to the individual Field Presentation Functions.

### The Field Presentation Functions

Field Presentation Functions receive validation state from the Field Dispatcher Function and decide how an individual UI element should respond.

Field validation commonly affects three kinds of UI elements:

* **editor** — changes its styling or accessibility state when the field is invalid
* **label** — changes its appearance to draw attention to the invalid field
* **Field Error Display** — presents the issues found for the field

Each is an independent validation consumer. They receive the same `ValueHostValidationState`, but their Presentation Functions use different parts of it and produce different results.

A Presentation Function may change content, expose state through CSS classes, manage visibility, update accessibility attributes, or perform other presentation work appropriate to its element.

#### Initialize Field Presentation Functions

Each of these elements needs to identify the Presentation Function it wants to use. Jivs SimpleDom uses the custom `data-jivs-presentation` attribute for that purpose.

`data-jivs-role` identifies what the element does. `data-jivs-presentation` names how that element presents validation.

For example, this Field Error Display requests the `inlineError` presentation:

```html
<div
    data-field="first-name"
    data-jivs-role="error"
    data-jivs-presentation="inlineError">
</div>
```

The setup has four parts:

* `FieldPresentationHandler` defines the common signature used by field Presentation Functions.
* Each participating element declares a Presentation name through `data-jivs-presentation`.
* `getFieldPresentationFunction()` is a small factory that maps each name to its Presentation Function.
* The attachment functions `attachFieldPresentation()` and `attachFieldPresentations()` assign Presentation Functions to one or many elements.

This code is supplied in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts). It is shown here to explain the implementation and identify the parts you are likely to customize.

```ts
export type FieldPresentationHandler = (
    element: HTMLElement,
    valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
) => void;

export interface IFieldValidationConsumerElement extends HTMLElement {
    onFieldValidationStateChanged?: FieldPresentationHandler;
}

// Return the Presentation Function associated with a name.
// Add or replace cases as the application adds Presentation Functions.
export function getFieldPresentationFunction(
    presentationName: string
): FieldPresentationHandler | undefined {
    switch (presentationName) {
        case 'invalidEditor':
            return editorValidationChanged;

        case 'invalidLabel':
            return labelValidationChanged;

        case 'inlineError':
            return inlineErrorDisplayChanged;

        case 'errorIcon':
            return errorIconChanged;

        case 'editorTooltip':
            return editorTooltipChanged;
    }
    return undefined;
}

// Attach one Presentation Function when its name is already known.
export function attachFieldPresentation(
    element: IFieldValidationConsumerElement,
    presentationName: string
): void {
    // Leave an element alone when it has already been attached.
    if (element.onFieldValidationStateChanged) {
        return;
    }

    const presentationFunction =
        getFieldPresentationFunction(
            presentationName
        );

    if (presentationFunction) {
        element.onFieldValidationStateChanged =
            presentationFunction;
    }
}

// Read the Presentation name declared on one element and attach it.
export function attachFieldPresentationFromAttribute(
    element: IFieldValidationConsumerElement
): void {
    const presentationName =
        element.dataset.jivsPresentation;

    if (presentationName) {
        attachFieldPresentation(
            element,
            presentationName
        );
    }
}

// Find matching elements and attach each declared presentation.
export function attachFieldPresentations(
    selector =
        '[data-field][data-jivs-presentation]'
): void {
    const elements =
        document.querySelectorAll<IFieldValidationConsumerElement>(
            selector
        );

    for (const element of elements) {
        attachFieldPresentationFromAttribute(
            element
        );
    }
}
```

* Call `attachFieldPresentations()` as part of your page initialization. For example:

  ```ts
  attachFieldPresentations();
  ```

* Call `attachFieldPresentations()` again after replacing part of the form. The attachment functions skip elements already attached, leaving existing elements untouched while initializing replacement elements.

* We will provide each of the named Presentation Functions in later parts of this document.

* Expect to rework `getFieldPresentationFunction()` as you adjust your Presentation Functions.

#### Presentation for an Editor

The editor commonly changes appearance when the field becomes invalid.

Its Presentation Function can expose that validation state through a CSS class:

```ts
export function editorValidationChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void {
    element.classList.toggle(
        'invalid',
        validationState.isValid === false
    );
}
```

Select this Presentation Function in the editor's markup:

```html
<input
    id="first-name"
    class="validation-editor"
    data-field="first-name"
    data-jivs-role="editor"
    data-jivs-presentation="invalidEditor">
```

CSS determines how that state looks:

```css
[data-jivs-role="editor"].invalid {
    border: 2px solid currentColor;
}
```

The editor can also own its validation-related accessibility attributes. Those are covered in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md).

#### Presentation for a Label

A label may also change appearance when its field is invalid.

Its Presentation Function can expose that validation state through a CSS class:

```ts
export function labelValidationChanged(
    element: HTMLElement,
    _valueHost: IFieldValueHost,
    validationState: ValueHostValidationState
): void {
    element.classList.toggle(
        'invalid',
        validationState.isValid === false
    );
}
```

Select this Presentation Function in the label's markup:

```html
<label
    for="first-name"
    data-field="first-name"
    data-jivs-role="label"
    data-jivs-presentation="invalidLabel">
    First name
</label>
```

Then CSS owns the appearance:

```css
[data-jivs-role="label"].invalid {
    font-weight: 700;
}
```

#### Presentation for a Field Error Display

Field Error Displays vary widely. Some forms show Error Messages directly below the editor, some use a compact icon or native tooltip, and others hand the messages to a popup or alert component supplied by a UI library.

Applications commonly use approaches such as:

* one Error Message at a time
* all Error Messages displayed together
* a native browser tooltip
* a popup, alert, or popover
* an error icon that reveals messages on interaction
* application-specific components or notifications

The shared Error Message HTML and text generators were developed under [Generate Error Messages](#generate-error-messages).

This section separates the common work from the presentation choices. We'll:

* build an inline Error Display
* show an error icon with a native tooltip
* attach a native tooltip to the container around an editor
* show how the same generated HTML can be handed to a UI-library popup, alert, or popover

Most Field Error Displays have two parts:

1. **Generate the Error Messages** — turn `issuesFound` into either HTML or plain text.
2. **Present those Error Messages** — decide where and how they appear.

Keeping those responsibilities separate lets several Field Error Display designs share the same Error Message generation.

##### Inline Error Display

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

CSS can hide the Error Display when there are no issues:

```css
[data-jivs-presentation="inlineError"]:not(.has-issues) {
    display: none;
}
```

The Error Display tests `issuesFound`, not `isValid`, because it should also present issues such as Warnings that do not make the field invalid.

*Accessibility requirements for dynamically presented Error Messages are covered in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md).*

##### Error Icon with a Native Tooltip

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

CSS controls whether the icon is shown:

```css
.field-error-icon:not(.has-issues) {
    display: none;
}
```

This gives pointer users a compact native tooltip presentation.

*The additional accessibility needed beyond a native `title` tooltip is covered in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md).*

##### Put the Editor's Errors in a Native Tooltip

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

Because the container closely surrounds the editor, pointing within that area makes the Error Messages appear as a tooltip associated with the editor.

The Presentation Function does not need to modify the editor itself, and the Dispatcher Function does not need any special knowledge of this presentation.

*The additional accessibility needed beyond a native `title` tooltip is covered in [Accessible Client Validation UI](Accessible_Client_Validation_UI.md).*

##### Use a UI-Library Popup, Alert, or Popover

Applications that need richer popup behavior should usually use the popup, alert, popover, or similar component already provided by their UI library.

The Presentation Function still has the same responsibilities:

* determine whether issues exist
* generate the Error Message content
* provide that content to the UI-library component
* show or hide the component as appropriate

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

#### Use Other Field Validation State

The same Field Dispatcher Function can support optional field presentation without learning about those features itself.

For example, a consumer may use `corrected`:

```ts
element.classList.toggle(
    'corrected',
    validationState.corrected
);
```

A widget may use `asyncProcessing` to show that validation for the field is still running.

A Field Error Display may inspect each `IssueFound.severity` to distinguish Warnings, Errors, and Severe issues.

These are additional uses of the same field validation state, not additional responsibilities for the Dispatcher Function.

### Initialize Required Indicators

When building each field individually, the developer can add a Required Indicator only to fields that require one.

Reusable field templates need a different approach. A template can include the Required Indicator with every field and let Jivs SimpleDom determine whether it should appear:

```html
<span
    data-field="first-name"
    data-jivs-role="required">
    *
</span>
```

The Required Indicator belongs to the field UI, but it does not respond to validation changes. Its visibility is determined by the `FieldValueHost.required` property, which remains static throughout the `FieldValueHost` lifecycle.

For that reason, the Required Indicator does not declare a `data-jivs-presentation` name and does not receive validation state through the Field Dispatcher Function.

CSS hides the indicator unless initialization adds the `active` class:

```css
[data-jivs-role="required"]:not(.active) {
    display: none;
}
```

No visible `display` value needs to be specified. When the `active` class is present, the element uses its normal display behavior.

The initialization function enumerates the `FieldValueHosts`, locates their Required Indicators, and activates those belonging to required fields:

```ts
export function initializeRequiredIndicators(
    valueHostsManager: IValueHostsManager
): void {
    const valueHosts =
        valueHostsManager.enumerateValueHosts(
            (valueHost) =>
                valueHost instanceof FieldValueHost
        );

    for (const valueHost of valueHosts) {
        const fieldValueHost =
            valueHost as IFieldValueHost;

        const fieldId =
            fieldValueHost.getElementIdentifier();

        const indicators =
            document.querySelectorAll<HTMLElement>(
                `[data-field="${CSS.escape(fieldId)}"]` +
                `[data-jivs-role="required"]`
            );

        for (const indicator of indicators) {
            indicator.classList.toggle(
                'active',
                fieldValueHost.required
            );
        }
    }
}
```

Call the function after the `ValueHostsManager` has been created and the field HTML is available:

```ts
initializeRequiredIndicators(vhm);
```

Call it again after replacing field HTML generated from a template. Toggling the class makes repeated initialization safe.

## Build the Form Validation UI

A form may have several UI elements that respond to validation across the complete `ValueHostsManager`.

The primary Form Validation UI consumers in Jivs SimpleDom are the Validation Summary and Submit / Save Control.

The preparation from **Before Building the UI**, **Plan the Jivs SimpleDom UI**, and **Prepare Jivs Validation for Presentation** now pays off:

* We need a Form Dispatcher Function that dispatches form validation changes to interested UI elements.
* We need Form Presentation Functions for each approach to presenting form validation in the UI.
* The `data-jivs-role` attribute identifies what each element does.

The work ahead:

* Build your Form Dispatcher Function and wire it to `ValueHostsManager.onValidationStateChanged`.
* Build Form Presentation Functions for each use case and connect them to the `onFormValidationStateChanged` callback of the relevant elements.

### The Form Dispatcher Function

A Form Dispatcher Function has this TypeScript contract:

```ts
export type FormDispatcher = (
    valueHostsManager: IValueHostsManager,
    validationState: ValidationState
) => void;
```

It is attached to the `ValueHostsManager` through its `onValidationStateChanged` callback:

```ts
config.onValidationStateChanged = yourFormDispatcher;

const vhm = new ValueHostsManager(config);
```

This Form Dispatcher Function locates every Jivs SimpleDom form validation consumer and calls its `onFormValidationStateChanged` Presentation Function:

```ts
export function formValidated(
    vhm: IValueHostsManager,
    validationState: ValidationState
): void {
    const consumers =
        document.querySelectorAll<IFormValidationConsumerElement>(
            '[data-jivs-role="summary"],' +
            '[data-jivs-role="submit"]'
        );

    for (const consumer of consumers) {
        consumer.onFormValidationStateChanged?.(
            consumer,
            vhm,
            validationState
        );
    }
}
```

The Form Dispatcher Function does not rebuild the Validation Summary, enable or disable the Submit button, or otherwise decide how form validation should appear.

Those decisions belong to the individual Form Presentation Functions.

### The Form Presentation Functions

Form Presentation Functions receive validation state from the Form Dispatcher Function and decide how an individual UI element should respond.

Form validation commonly affects two kinds of UI elements:

* **Validation Summary** — presents issues from across the complete `ValueHostsManager`
* **Submit / Save Control** — enables or disables the operation based on whether the current state can be saved

Each is an independent validation consumer. They receive the same `ValidationState`, but their Presentation Functions use different parts of it and produce different results.

#### Initialize Form Presentation Functions

Each of these elements needs to identify the Presentation Function it wants to use. Jivs SimpleDom uses the custom `data-jivs-presentation` attribute for that purpose.

`data-jivs-role` identifies what the element does. `data-jivs-presentation` names how that element presents validation.

For example, this Validation Summary requests the `validationSummary` presentation:

```html
<div
    data-jivs-role="summary"
    data-jivs-presentation="validationSummary">
</div>
```

The setup has four parts:

* `FormPresentationHandler` defines the common signature used by form Presentation Functions.
* Each participating element declares a Presentation name through `data-jivs-presentation`.
* `getFormPresentationFunction()` is a small factory that maps each name to its Presentation Function.
* The attachment functions `attachFormPresentation()` and `attachFormPresentations()` assign Presentation Functions to one or many elements.

This code is supplied in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts). It is shown here to explain the implementation and identify the parts you are likely to customize.

```ts
export type FormPresentationHandler = (
    element: HTMLElement,
    valueHostsManager: IValueHostsManager,
    validationState: ValidationState
) => void;

export interface IFormValidationConsumerElement extends HTMLElement {
    onFormValidationStateChanged?: FormPresentationHandler;
}

// Return the Presentation Function associated with a name.
// Add or replace cases as the application adds Presentation Functions.
export function getFormPresentationFunction(
    presentationName: string
): FormPresentationHandler | undefined {
    switch (presentationName) {
        case 'validationSummary':
            return validationSummaryChanged;

        case 'disableSubmit':
            return submitValidationChanged;
    }
    return undefined;
}

// Attach one Presentation Function when its name is already known.
export function attachFormPresentation(
    element: IFormValidationConsumerElement,
    presentationName: string
): void {
    // Leave an element alone when it has already been attached.
    if (element.onFormValidationStateChanged) {
        return;
    }

    const presentationFunction =
        getFormPresentationFunction(
            presentationName
        );

    if (presentationFunction) {
        element.onFormValidationStateChanged =
            presentationFunction;
    }
}

// Read the Presentation name declared on one element and attach it.
export function attachFormPresentationFromAttribute(
    element: IFormValidationConsumerElement
): void {
    const presentationName =
        element.dataset.jivsPresentation;

    if (presentationName) {
        attachFormPresentation(
            element,
            presentationName
        );
    }
}

// Find matching elements and attach each declared presentation.
export function attachFormPresentations(
    selector =
        '[data-jivs-role="summary"][data-jivs-presentation],' +
        '[data-jivs-role="submit"][data-jivs-presentation]'
): void {
    const elements =
        document.querySelectorAll<IFormValidationConsumerElement>(
            selector
        );

    for (const element of elements) {
        attachFormPresentationFromAttribute(
            element
        );
    }
}
```

* Call `attachFormPresentations()` as part of your page initialization. For example:

  ```ts
  attachFormPresentations();
  ```

* Call `attachFormPresentations()` again after replacing part of the form. The attachment functions skip elements already attached, leaving existing elements untouched while initializing replacement elements.

* We will provide each of the named Presentation Functions next.

* Expect to rework `getFormPresentationFunction()` as you adjust your Presentation Functions.

#### Presentation for a Validation Summary

A Validation Summary presents issues across the complete `ValueHostsManager`.

Select the Presentation Function in the Validation Summary's markup:

```html
<div
    data-jivs-role="summary"
    data-jivs-presentation="validationSummary">
</div>
```

Its Presentation Function generates the Summary Messages and exposes whether there are any issues:

```ts
export function validationSummaryChanged(
    element: HTMLElement,
    _vhm: IValueHostsManager,
    validationState: ValidationState
): void {
    const issues =
        validationState.issuesFound;

    element.classList.toggle(
        'has-issues',
        Boolean(issues?.length)
    );

    element.innerHTML =
        issues?.length
            ? buildErrorMessagesHtml(
                issues,
                true
            )
            : '';
}
```

Passing `true` to `buildErrorMessagesHtml()` selects each issue's `summaryMessage`. When `summaryMessage` is not supplied, the generator falls back to `errorMessage`.

CSS can hide the Validation Summary when there are no issues:

```css
[data-jivs-presentation="validationSummary"]:not(.has-issues) {
    display: none;
}
```

The Validation Summary tests `issuesFound`, not `isValid`, because it may also present issues such as Warnings that do not make the form invalid.

Applications can have several Validation Summaries with different Presentation Functions. The Form Dispatcher Function does not need to change.

##### Helping Users Reach Validation Problems

A Validation Summary can do more than list messages.

When an `IssueFound` supplies `valueHostName`, application code can resolve the corresponding `FieldValueHost` and use its element identifier to locate the editor.

That can support interactions such as:

* focusing the editor
* scrolling it into view
* opening an accordion
* selecting a tab
* opening a dialog
* revealing a popup Field Error Display

Navigation remains application-owned because it depends on the surrounding UI structure.

#### Presentation for a Submit / Save Control

A Submit or Save Control uses `doNotSave` to determine whether the operation should currently be allowed.

Select the Presentation Function in the control's markup:

```html
<button
    type="submit"
    data-jivs-role="submit"
    data-jivs-presentation="disableSubmit">
    Save
</button>
```

Its Presentation Function enables or disables the button:

```ts
export function submitValidationChanged(
    element: HTMLElement,
    _vhm: IValueHostsManager,
    validationState: ValidationState
): void {
    const button =
        element as HTMLButtonElement;

    button.disabled =
        validationState.doNotSave;
}
```

`doNotSave` is preferred over `isValid` because it represents whether the current validation state is ready to save, including states where validation still needs to complete.

---

Continue with [Accessible Client Validation UI](Accessible_Client_Validation_UI.md) to learn about accessibility in validation UIs.
