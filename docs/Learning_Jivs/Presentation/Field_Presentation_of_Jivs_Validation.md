# Field Presentation of Jivs Validation

A field may have several UI elements that respond to validation: its editor, label, Field Error Display, and sometimes application-specific widgets. Required Indicators are also part of the Field Validation UI, but they are initialized separately because required status is field configuration rather than changing validation state.

The preparation from [The Jivs SimpleDom Approach](The_Jivs_SimpleDom_Approach.md) and [From Jivs Validation State to Client Presentation](From_Jivs_Validation_State_to_Client_Presentation.md) now pays off:

- We need a **Field Dispatcher Function** that dispatches validation changes to interested UI elements.
- We need **Field Presentation Functions** for each approach to presenting validation in the UI.
- `elementIdentifier` connects the `FieldValueHost` to its field identifier.
- The `data-field` attribute lets us find elements belonging to that field.
- The `data-jivs-role` attribute identifies what each element does.

The work ahead:

- Build your Field Dispatcher Function and wire it to `ValueHostsManager.onValueHostValidationStateChanged`.
- Build Field Presentation Functions for each use case and connect them to the `onFieldValidationStateChanged` callback of the relevant elements.
- Initialize Required Indicators from `FieldValueHost.required`.

## The Field Dispatcher Function

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

You can find this code in [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts).

The Field Dispatcher Function does not change CSS classes, rebuild Error Messages, manage accessibility attributes, or otherwise decide how validation should appear.

Those decisions belong to the individual Field Presentation Functions.

## The Field Presentation Functions

Field Presentation Functions receive validation state from the Field Dispatcher Function and decide how an individual UI element should respond.

Field validation commonly affects three kinds of UI elements:

- **editor** — changes its styling or accessibility state when the field is invalid
- **label** — changes its appearance to draw attention to the invalid field
- **Field Error Display** — presents the issues found for the field

Each is an independent validation consumer. They receive the same `ValueHostValidationState`, but their Presentation Functions use different parts of it and produce different results.

A Presentation Function may change content, expose state through CSS classes, manage visibility, update accessibility attributes, or perform other presentation work appropriate to its element.

### Initialize Field Presentation Functions

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

- `FieldPresentationHandler` defines the common signature used by field Presentation Functions.
- Each participating element declares a Presentation name through `data-jivs-presentation`.
- `getFieldPresentationFunction()` is a small factory that maps each name to its Presentation Function.
- The attachment functions `attachFieldPresentation()` and `attachFieldPresentations()` assign Presentation Functions to one or many elements.

This code is supplied in [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts). It is shown here to explain the implementation and identify the parts you are likely to customize.

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

- Call `attachFieldPresentations()` as part of your page initialization. For example:

  ```ts
  attachFieldPresentations();
  ```

- Call `attachFieldPresentations()` again after replacing part of the form. The attachment functions skip elements already attached, leaving existing elements untouched while initializing replacement elements.

- The named Presentation Functions are provided in this document and [Field Presentation: Field Error Displays](Field_Presentation_Field_Error_Displays.md).

- Expect to rework `getFieldPresentationFunction()` as you adjust your Presentation Functions.

### Presentation for an Editor

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

You can find this code in [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts).

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

### Presentation for a Label

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

You can find this code in [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts).

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

### Presentation for a Field Error Display

Field Error Displays support several common presentation approaches. Their implementations are covered separately in [Field Presentation: Field Error Displays](Field_Presentation_Field_Error_Displays.md).

### Use Other Field Validation State

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

## Initialize Required Indicators

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

You can find this code in [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts).

Call the function after the `ValueHostsManager` has been created and the field HTML is available:

```ts
initializeRequiredIndicators(vhm);
```

Call it again after replacing field HTML generated from a template. Toggling the class makes repeated initialization safe.

---

Continue to the next section of the Jivs Presentation Learning Guide: [Field Presentation: Field Error Displays](Field_Presentation_Field_Error_Displays.md).

Return to [Learning Jivs TOC](../Home.md).