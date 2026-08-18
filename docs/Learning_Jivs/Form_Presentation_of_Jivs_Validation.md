# Form Presentation of Jivs Validation

A form may have several UI elements that respond to validation across the complete `ValueHostsManager`.

The primary Form Validation UI consumers in Jivs SimpleDom are the Validation Summary and Submit / Save Control.

The preparation from [The Jivs SimpleDom Approach](The_Jivs_SimpleDom_Approach.md) and [From Jivs Validation State to Client Presentation](From_Jivs_Validation_State_to_Client_Presentation.md) now pays off:

- We need a **Form Dispatcher Function** that dispatches form validation changes to interested UI elements.
- We need **Form Presentation Functions** for each approach to presenting form validation in the UI.
- The `data-jivs-role` attribute identifies what each element does.
- The `data-jivs-presentation` attribute identifies which Presentation Function each consumer requests.

The work ahead:

- Build your Form Dispatcher Function and wire it to `ValueHostsManager.onValidationStateChanged`.
- Build Form Presentation Functions for each use case and connect them to the `onFormValidationStateChanged` callback of the relevant elements.

## The Form Dispatcher Function

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

You can find this code in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts).

The Form Dispatcher Function does not rebuild the Validation Summary, enable or disable the Submit button, or otherwise decide how form validation should appear.

Those decisions belong to the individual Form Presentation Functions.

## The Form Presentation Functions

Form Presentation Functions receive validation state from the Form Dispatcher Function and decide how an individual UI element should respond.

Form validation commonly affects two kinds of UI elements:

- **Validation Summary** — presents issues from across the complete `ValueHostsManager`
- **Submit / Save Control** — enables or disables the operation based on whether the current state can be saved

Each is an independent validation consumer. They receive the same `ValidationState`, but their Presentation Functions use different parts of it and produce different results.

### Initialize Form Presentation Functions

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

- `FormPresentationHandler` defines the common signature used by form Presentation Functions.
- Each participating element declares a Presentation name through `data-jivs-presentation`.
- `getFormPresentationFunction()` is a small factory that maps each name to its Presentation Function.
- The attachment functions `attachFormPresentation()` and `attachFormPresentations()` assign Presentation Functions to one or many elements.

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

You can find this code in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts).

- Call `attachFormPresentations()` as part of your page initialization. For example:

  ```ts
  attachFormPresentations();
  ```

- Call `attachFormPresentations()` again after replacing part of the form. The attachment functions skip elements already attached, leaving existing elements untouched while initializing replacement elements.

- The named Presentation Functions are provided next.

- Expect to rework `getFormPresentationFunction()` as you adjust your Presentation Functions.

### Presentation for a Validation Summary

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

You can find this code in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts).

Passing `true` to `buildErrorMessagesHtml()` selects each issue's `summaryMessage`. When `summaryMessage` is not supplied, the generator falls back to `errorMessage`.

CSS can hide the Validation Summary when there are no issues:

```css
[data-jivs-presentation="validationSummary"]:not(.has-issues) {
    display: none;
}
```

The Validation Summary tests `issuesFound`, not `isValid`, because it may also present issues such as Warnings that do not make the form invalid.

Applications can have several Validation Summaries with different Presentation Functions. The Form Dispatcher Function does not need to change.

#### Helping Users Reach Validation Problems

A Validation Summary can do more than list messages.

When an `IssueFound` supplies `valueHostName`, application code can resolve the corresponding `FieldValueHost` and use its element identifier to locate the editor.

That can support interactions such as:

- focusing the editor
- scrolling it into view
- opening an accordion
- selecting a tab
- opening a dialog
- revealing a popup Field Error Display

Navigation remains application-owned because it depends on the surrounding UI structure.

### Presentation for a Submit / Save Control

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

You can find this code in [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts).

`doNotSave` is preferred over `isValid` because it represents whether the current validation state is ready to save, including states where validation still needs to complete.

---

Continue with [Accessible Client Validation UI](Accessible_Client_Validation_UI.md) to learn about accessibility in validation UIs.
