# From Jivs Validation State to Client Presentation

With the [Jivs SimpleDom HTML and CSS conventions](The_Jivs_SimpleDom_Approach.md) planned, the next step is to understand the information Jivs supplies and prepare the shared content used by the Presentation Functions.

This section:

- explains the field and form validation-state objects
- identifies the information available through each `IssueFound`
- generates reusable Error Message HTML and plain text
- establishes how Jivs validation state reaches the appropriate UI elements

The state objects and `IssueFound` belong to Jivs. The Error Message generators and callback-and-dispatcher design are the implementation developed by this guide.

## Understanding Validation State and IssueFound

Jivs reports validation results through state objects. These objects give the UI the information it needs without requiring the UI to inspect individual Validators.

The same state model supports both the Field Validation UI and Form Validation UI.

### ValidationState and ValueHostValidationState

Jivs supplies two related validation-state types:

- `ValueHostValidationState` describes validation for one ValueHost.
- `ValidationState` describes validation across the complete `ValueHostsManager`.

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

- `isValid` — whether validation currently considers the ValueHost or complete `ValueHostsManager` valid
- `doNotSave` — whether the current state should prevent saving
- `issuesFound` — the issues currently associated with that scope. This will be your source for Error Messages.
- `asyncProcessing` — whether asynchronous validation is running within that scope. While it is running, `doNotSave` prevents form submission.

The scope depends on which state object was supplied. For example, `ValueHostValidationState.issuesFound` contains issues for one ValueHost, while `ValidationState.issuesFound` contains issues collected across the complete `ValueHostsManager`.

`isValid` and `doNotSave` answer different questions. A severity of *Warning* can produce an `IssueFound` while `isValid` remains `true`. `doNotSave` also accounts for states where validation is not yet ready to permit saving, such as required validation that has not run or asynchronous validation that is still processing.

`ValueHostValidationState` adds two field-specific properties:

- `status` — the ValueHost's current `ValidationStatus`
- `corrected` — whether previously invalid Validators have been corrected

Their field-specific presentation uses are covered later when building the Field Validation UI.

Both state types use the same `IssueFound` type to describe individual validation issues.

### Understanding IssueFound

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

- `errorMessage` — the fully prepared Error Message normally presented by a Field Error Display
- `summaryMessage` — an alternative Error Message intended for a Validation Summary
- `severity` — identifies the severity of the issue
- `valueHostName` — identifies the ValueHost associated with the issue
- `errorCode` — identifies the type of issue or Validator that supplied it
- `doNotSave` — indicates whether this issue should prevent saving

A Validation Summary normally uses `summaryMessage` when it is supplied and falls back to `errorMessage` when it is not.

`valueHostName` lets form-level UI connect an issue back to its field. For example, a Validation Summary can use it to locate, focus, or scroll to the corresponding editor. Some issues may not identify a specific ValueHost, so this property is optional.

A validation state can contain more than one `IssueFound`. Each Error Message consumer decides whether to present one issue, every issue, selected severities, or another presentation entirely.

A `Warning` can appear in `issuesFound` while `isValid` remains `true`. Error Message consumers should therefore inspect `issuesFound` rather than relying on `isValid` to decide whether messages should be presented.

The validation state's `doNotSave` property already represents whether the complete state should prevent saving. A Submit Presentation Function can use that property directly rather than recalculating it from individual issues.

## Generating Error Messages from `IssueFound` Objects

Field Error Displays and Validation Summaries both turn `IssueFound` objects into Error Message content.

Most Error Message consumers have two responsibilities:

1. **Generate the Error Messages** — turn `issuesFound` into HTML or plain text.
2. **Present the Error Messages** — decide where and how that content appears.

Keeping these responsibilities separate lets several Presentation Functions share the same Error Message generation. This section explains those choices and provides code you can use.

### Generating Error Messages as HTML

The code in this section generates HTML-formatted Error Messages. They can be used by:

- Field Error Displays, including inline and popup presentations
- Validation Summaries
- UI-library tooltips, popovers, and other HTML-capable hints attached to the editor, label, or container

Native browser tooltips do not accept HTML. The [plain-text generator](#generating-error-messages-as-text) supports those presentations.

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

- `data-error-code` contains `IssueFound.errorCode` when supplied.
- `data-severity` contains the severity name when the severity is not the normal `Error`.

Jivs supplies Error Message strings that may contain internal HTML markup around resolved tokens. For example:

```html
The <span class="token label">First name</span> is invalid.
```

The [Protect Error Messages from XSS](Jivs_Presentation_Prerequisites.md#protect-error-messages-from-xss) setup HTML-encodes the replacement value before adding these tags. The HTML generator is deliberately designed to preserve this prepared markup when building the final Error Message content.

By default, the generator uses `IssueFound.errorMessage`, making it suitable for Field Error Displays. Pass `true` for `useSummaryMessage` to use `summaryMessage` for a Validation Summary. When `summaryMessage` is not supplied, the generator falls back to `errorMessage`.

The following functions are also available in the companion [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts) file:

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

The normal `Error` severity does not produce a `data-severity` attribute.

### Generating Error Messages as Text

Native browser tooltips and other text-only consumers cannot use the prepared HTML contained in an Error Message.

The text generator lets the browser parse the prepared markup in a detached element and then extracts its text content. For example:

```html
The <span class="token label">First name</span> is invalid.
```

becomes:

```text
The First name is invalid.
```

The [Protect Error Messages from XSS](Jivs_Presentation_Prerequisites.md#protect-error-messages-from-xss) setup ensures that token replacement values were HTML-encoded before the prepared Error Message reached this function.

The following functions are also available in the companion [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts) file:

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

## Delivering Validation State to the UI

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

```ts
const elementId = valueHost.getElementIdentifier();

const fieldElements =
    document.querySelectorAll(
        `[data-field=${CSS.escape(elementId)}]`
    );
```

A form Dispatcher Function locates consumers such as the Validation Summary and Submit button by their `data-jivs-role`.

For example:

```ts
const formElements =
    document.querySelectorAll(
        '[data-jivs-role="summary"], ' +
        '[data-jivs-role="submit"]'
    );
```

During UI initialization, `data-jivs-presentation` identifies the Presentation Function requested by each consumer. The Dispatcher Function does not need to know how those functions present the state. It only delivers the appropriate state to them.

The later [Field Presentation of Jivs Validation](Field_Presentation_of_Jivs_Validation.md) and [Form Presentation of Jivs Validation](Form_Presentation_of_Jivs_Validation.md) sections implement their callbacks, Dispatcher Functions, and Presentation Functions.

---

Continue to the next section of the Jivs Presentation Learning Guide: [Field Presentation of Jivs Validation](Field_Presentation_of_Jivs_Validation.md).

Return to [Learning Jivs TOC](../Learning_Jivs_Home.md).