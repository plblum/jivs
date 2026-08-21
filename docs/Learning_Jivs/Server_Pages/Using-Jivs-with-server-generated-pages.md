# Using Jivs with Server-Generated Pages

Server-generated applications produce some or all of their form markup on the server. This includes traditional server pages that reload completely and AJAX operations that replace selected elements.

Jivs continues to run on the client. The server generates the HTML, while client code connects its editors and validation presentation to a `ValueHostsManager`.

Keeping these parts synchronized requires some shared preparation:

* the Rules must configure every field that may appear
* the generated HTML must provide elements that client code can locate and connect
* Jivs state must be preserved when the page reconstructs the `ValueHostsManager`
* the `ValueHostsManager` must be reconciled with the editors currently present in the HTML

This document establishes that shared preparation.

## Build the Configuration Rules

Configure the `ValueHostsManager` through Rules with *every field* that may appear in the generated HTML.

For example, `PersonFormRules` always configures `FirstName`, `LastName`, and `BirthDate`:

```ts
export class PersonFormRules extends ValueHostRulesBase {
    protected configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions
    ): void {
        builder.field('FirstName', LookupKey.String, { label: 'First name' })
            .requireText();
        builder.field('LastName', LookupKey.String, { label: 'Last name' })
            .requireText();
        builder.field('BirthDate', LookupKey.Date)
            .notNull();
    }
}
```

The server might show or hide the Birth Date editor based on the current page state. `BirthDate` remains in the Rules either way.

When its editor is present, client code enables the `BirthDate` `FieldValueHost`. When the editor is absent, client code disables it so its validator does not participate.

This lets one configuration support alternate layouts, conditional sections, and AJAX updates without rebuilding the Rules for each variation.

See [Defining ValueHosts with a Rules Class](Intro_to_Creating_a_ValueHostsManager.md#defining-valuehosts-with-a-rules-class) for the complete Rules pattern.

## Prepare the Server-Generated HTML

The server already generates the form's editors. Add attributes or another consistent locator to each editor so client code can find it and connect it to its `FieldValueHost`.

```html
<input type="text" data-field="first-name" data-role="editor">
```

Jivs generates the HTML used to present error messages, but the page must provide an element where that HTML can be inserted. Add a `<div>`, `<span>`, or other suitable element for each Field Error Display and for the Validation Summary. Give each element attributes or another locator that client code can use to find it.

```html
<div data-field="first-name" data-role="errors"></div>
<div data-role="summary"></div>
```

The presentation documents explain how client code uses these elements:

* [Field Presentation of Jivs Validation](Field_Presentation_of_Jivs_Validation.md) covers editors, Field Error Displays, labels, and other field-level presentation.
* [Form Presentation of Jivs Validation](Form_Presentation_of_Jivs_Validation.md) covers the Validation Summary and other form-level presentation.

Applications can choose their own convention for locating and associating these elements. [Jivs SimpleDom](The_Jivs_SimpleDom_Approach.md) provides an attribute-based convention for the same responsibilities:

```html
<form novalidate>
    <div
        data-jivs-role="summary"
        data-jivs-presentation="validationSummary">
    </div>

    <input
        type="text"
        name="firstName"
        data-field="first-name"
        data-jivs-role="editor"
        data-jivs-presentation="invalidEditor">

    <div
        data-field="first-name"
        data-jivs-role="error"
        data-jivs-presentation="inlineError">
    </div>
</form>
```

`data-field` associates the editor and Field Error Display with the same `FieldValueHost`. `data-jivs-role` identifies the editor, Field Error Display, and Validation Summary so client code can locate them. `data-jivs-presentation` selects the Presentation Function that updates each element.

Custom attributes allow client code to find elements by purpose instead of depending on application-specific element IDs. IDs remain available for their normal HTML responsibilities, such as connecting a `<label>` to an editor.

See [Finding the UI Element for a FieldValueHost](Using_the_ValueHostsManager_within_the_client.md#finding-the-ui-element-for-a-fieldvaluehost) for detailed guidance.

## Add Hidden Inputs to Deliver Jivs Data

Add two hidden inputs to the server-generated form:

```html
<input type="hidden" id="_jivsSavedState" name="_jivsSavedState">
<input type="hidden" id="_jivsServerIssues">
```

`_jivsSavedState` carries Jivs state from the client to the server and back. It has a `name` because it must be included in the form submission.

## Add the Editor Reconciliation Helpers

Server-generated pages need a consistent way to align the `FieldValueHosts` with available editors. The Rules configure every possible `FieldValueHost`, but only those with editors on the page should be enabled and supplied with values. The `reconcileValueHostsWithEditors()` function supports that.

Add the following helpers to the application's DOM integration code. They are also provided in `jivs-dom-helpers.ts`.

```ts
export interface ReconcileValueHostsWithEditorsOptions {
    skipIfUnchanged?: boolean;
    valueHostNames?: readonly string[];
}

export function getEditorValue(
    element: HTMLElement
): string | undefined {
    if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
    ) {
        return element.value;
    }

    // Add support for other editor types here and return their Text Value.
    return undefined;
}

export function reconcileValueHostsWithEditors(
    vhm: IValueHostsManager,
    options: ReconcileValueHostsWithEditorsOptions = {}
): void {
    const valueHostNames = options.valueHostNames
        ? new Set(options.valueHostNames)
        : undefined;

    const valueHosts = vhm.enumerateValueHosts(
        (valueHost) =>
            valueHost instanceof FieldValueHost &&
            (
                valueHostNames === undefined ||
                valueHostNames.has(valueHost.getName())
            )
    );

    for (const vh of valueHosts) {
        const valueHost = vh as FieldValueHost;
        const element = getElement(valueHost);

        if (element === null) {
            valueHost.setEnabled(false);
            continue;
        }

        const editorValue = getEditorValue(element);

        if (editorValue === undefined) {
            valueHost.setEnabled(false);
            continue;
        }

        valueHost.setTextValue(editorValue, {
            validate: false,
            reset: true,
            skipIfUnchanged:
                options.skipIfUnchanged ?? false,
            ensureEnabled: true
        });
    }
}
```

`getEditorValue()`:

* obtains the Text Value from standard `input`, `select`, and `textarea` elements
* extend it when the application uses other editor types or specialized value handling

`reconcileValueHostsWithEditors()`:

* processes every configured `FieldValueHost`, or only those identified by its `options.valueHostNames` property
* gets the current Text Value from each editor and assigns it to the associated `FieldValueHost`
* ensures that, among the `FieldValueHosts` it processes, only those with corresponding supported editor elements are enabled; disabled `FieldValueHosts` do not participate in validation

## Server Pages Workflows

The shared preparation above supports four workflows. Each workflow defines the order for synchronizing the generated HTML, the `ValueHostsManager`, its saved state, and the validation presentation during a particular page operation.

Every server-generated form requires the Page Load and Page Save workflows. The Round Trip and Elements Changed workflows cover the common ways the server may update the form after it has loaded.

* [Server Pages Workflow: Page Load](Server_pages_workflow_page_load.md) is used when loading the initial server-generated page.
* [Server Pages Workflow: Page Save](Server_pages_workflow_page_save.md) is used when attempting to submit the form.
* [Server Pages Workflow: Round Trip](Server_pages_workflow_round_trip.md) handles non-save server operations that regenerate the entire page.
* [Server Pages Workflow: Elements Changed](Server_pages_workflow_elements_changed.md) handles AJAX updates to the page structure.

---

Return to [Learning Jivs](Learning_Jivs_Home.md).
