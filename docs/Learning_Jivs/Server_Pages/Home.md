# Using Jivs with Server-Generated Pages

Server-generated applications produce some or all of their form markup on the server. This includes traditional server pages that reload completely and AJAX operations that replace selected elements.

Jivs continues to run on the client. The server generates the HTML, while client code connects its editors and validation presentation to a `ValueHostsManager`.

This guide expects values to pass between the server and client through normal HTTP form behavior. The server renders Text Values into the form editors, and the browser submits their name/Text Value pairs. Jivs state travels as additional form data.

Keeping these parts synchronized requires some shared preparation:

* the generated HTML must provide elements that client code can locate and connect
* the Rules must configure every field that may appear
* Jivs state must be preserved when the page reconstructs the `ValueHostsManager`
* the `ValueHostsManager` must be reconciled with the editors currently present in the HTML

This document establishes that shared preparation.

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

* [Field Presentation of Jivs Validation](../Presentation/Field_Presentation_of_Jivs_Validation.md) covers editors, Field Error Displays, labels, and other field-level presentation.
* [Form Presentation of Jivs Validation](../Presentation/Form_Presentation_of_Jivs_Validation.md) covers the Validation Summary and other form-level presentation.

Applications can choose their own convention for locating and associating these elements. [Jivs SimpleDom](../Presentation/The_Jivs_SimpleDom_Approach.md) provides an attribute-based convention for the same responsibilities:

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

See [Finding the UI Element for a FieldValueHost](../Using_the_ValueHostsManager_within_the_Client.md#finding-the-ui-element-for-a-fieldvaluehost) for detailed guidance.

## Build the Configuration Rules

Create a Rules class derived from `ValueHostRulesBase` to configure a `ValueHostsManager`. See [Defining ValueHosts with a Rules Class](../Intro_to_Creating_a_ValueHostsManager.md#defining-valuehosts-with-a-rules-class).

Two details are especially important for server-generated pages:

* Use the Element Identifier to associate each `FieldValueHost` with its related DOM elements.
* Ensure every field that could appear in the generated HTML is included, not just those you intend to show initially.

### Using the Element Identifier

Client code can use the Element Identifier when querying the DOM. See [Finding the UI Element for a FieldValueHost](../Using_the_ValueHostsManager_within_the_Client.md#finding-the-ui-element-for-a-fieldvaluehost) to learn more.

The markup introduced in [Prepare the Server-Generated HTML](#prepare-the-server-generated-html) uses `data-field` to identify a field and `data-jivs-role` to identify the purpose of an element.

For example, the First Name editor uses `first-name` as its `data-field` value:

```html
<input type="text" data-field="first-name" data-jivs-role="editor">
```

Configure the `FirstName` `FieldValueHost` with the same value:

```ts
builder.field('FirstName', LookupKey.String, {
    elementIdentifier: 'first-name'
});
```

Client code can retrieve that element identifier and use it to locate the editor:

```ts
const firstNameId =
    vhm.vh.field('FirstName').getElementIdentifier();

const firstNameElement = document.querySelector(
    `[data-field="${CSS.escape(firstNameId)}"]` +
    '[data-jivs-role="editor"]'
);
```

### Ensure Every Field Is Configured

Always configure every field that could appear in the form, not just those initially present.

In this example, `PersonFormRules` always configures `FirstName`, `LastName`, and `BirthDate` along with their element identifiers:

```ts
export class PersonFormRules extends ValueHostRulesBase {
    protected configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions
    ): void {
        builder.field('FirstName', LookupKey.String, {
            label: 'First name',
            elementIdentifier: 'first-name'
        }).requireText();

        builder.field('LastName', LookupKey.String, {
            label: 'Last name',
            elementIdentifier: 'last-name'
        }).requireText();

        builder.field('BirthDate', LookupKey.Date, {
            elementIdentifier: 'birth-date'
        }).notNull();
    }
}
```

The server might show or hide the Birth Date editor based on the current page state. `BirthDate` remains in the Rules either way.

When its editor is present, client code enables the `BirthDate` `FieldValueHost`. When the editor is absent, client code disables it so its validator does not participate.

This lets one configuration support alternate layouts, conditional sections, and AJAX updates without rebuilding the Rules for each variation.

## Add Hidden Inputs to Deliver Jivs Data

Add two hidden inputs to the server-generated form:

```html
<input type="hidden" id="_jivsCapturedState" name="_jivsCapturedState">
<input type="hidden" id="_jivsServerIssues">
```

`_jivsCapturedState` carries Jivs state from the client to the server and back. It has a `name` because it must be included in the form submission. `_jivsServerIssues` carries the validation issues from server to client.

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


## Add the Client Setup Code

Your application must deliver and run the client setup code. It can be compiled into a script file, included in a client bundle, or injected into the generated page. The server technology and application architecture determine how the code is delivered.

Ensure the setup code runs after the generated HTML and required Jivs libraries are available.

Page Load and the pages returned by Page Save and Round Trip create a new `ValueHostsManager`. They share this creation pattern:

```ts
// Some workflows retrieve values from hidden fields first

const services = createJivsServices('en-US');
const rules = new PersonFormRules(services);
const config = rules.configure();

// A restoring workflow assigns config.capturedState here.

config.onTextValueChanged = onTextValueChanged; // optional
config.onValueHostValidationStateChanged = fieldValidated;
config.onValidationStateChanged = formValidated;

const vhm = new ValueHostsManager(config);

// Some workflows call reconcileValueHostsWithEditors(vhm, options) here

attachEditorEventHandlers(vhm);
attachPresentationHandlers(vhm);

// Some workflows call vhm.broadcastState() here
// A Page Save return calls handleServerIssues() here
```

`PersonFormRules` represents the application’s Rules implementation described in [Build the Configuration Rules](#build-the-configuration-rules).

A restoring workflow assigns the transported saved state to `config.capturedState` before creating the `ValueHostsManager`. A new Page Load omits this assignment.

`onTextValueChanged` allows Jivs to supply Text Values to the editors. Omit it when Jivs does not need to supply values to the editors. See [When a Text Value Changes](../Using_the_ValueHostsManager_within_the_Client.md#when-a-text-value-changes).

`fieldValidated` receives field validation changes. Jivs SimpleDom supplies the [Field Dispatcher Function](../Presentation/Field_Presentation_of_Jivs_Validation.md#the-field-dispatcher-function). Otherwise, the application supplies it. See [When a Field’s Validation Changes](../Using_the_ValueHostsManager_within_the_Client.md#when-a-fields-validation-changes).

`formValidated` receives changes to the overall validation state. Jivs SimpleDom supplies the [Form Dispatcher Function](../Presentation/Form_Presentation_of_Jivs_Validation.md#the-form-dispatcher-function). Otherwise, the application supplies it. See [When Overall Validation Changes](../Using_the_ValueHostsManager_within_the_Client.md#when-overall-validation-changes).

`reconcileValueHostsWithEditors()` compares the generated editors with their `FieldValueHost` instances. It transfers editor Text Values when required and enables or disables each `FieldValueHost` based on whether its editor is present. Provided in `jivs-dom-helpers.ts` and documented in [Add the Editor Reconciliation Helpers](#add-the-editor-reconciliation-helpers).

`attachEditorEventHandlers()` represents the application code that attaches event handlers to the editors and supplies user-entered Text Values to their `FieldValueHost` instances. Provided in `jivs-dom-helpers.ts` and documented in [Sending User Input to Jivs](../Using_the_ValueHostsManager_within_the_Client.md#sending-user-input-to-jivs).

`attachPresentationHandlers()` represents the application’s presentation setup. When using Jivs SimpleDom, it can attach the field and form presentations and initialize required indicators. Otherwise, the application supplies its own presentation setup. Provided in `jivs-SimpleDom.ts` and documented in  [Initialize the Presentation](../Presentation/Presentation_Quick_Start.md#11-initialize-the-presentation).

`broadcastState()` sends the current restored state through the configured callbacks after the handlers have been attached. This allows the regenerated page to present that state without changing it.

`handleServerIssues()` interprets the validation information returned by the server and supplies it to Jivs. Its implementation depends on whether the server uses Jivs or another validation system. See [Handle Server Validation Results](../Submitting_the_Client_Form.md#handle-server-validation-results).

The workflow determines the remaining statements and their order:

* **Page Load** creates a new `ValueHostsManager`, transfers the Text Values from the generated editors to it, and attaches the handlers.
* **Page Save return** restores the submitted saved state, attaches the handlers, and then applies the server validation errors.
* **Round Trip** restores the saved state, reconciles it with the regenerated editors, attaches the handlers, and then broadcasts the restored state.
* **Elements Changed** retains an existing `ValueHostsManager` and therefore performs its own reconciliation and setup without using this creation pattern.

See [Server Pages Workflows](#server-pages-workflows) for the complete code and ordering required by each workflow.

## Server Pages Workflows

The shared preparation above supports four workflows. Each workflow defines the order for synchronizing the generated HTML, the `ValueHostsManager`, its saved state, and the validation presentation during a particular page operation.

Every server-generated form requires the Page Load and Page Save workflows. The Round Trip and Elements Changed workflows cover the common ways the server may update the form after it has loaded.

* [Server Pages Workflow: Page Load](Server_pages_workflow_page_load.md) is used when loading the initial server-generated page.
* [Server Pages Workflow: Page Save](Server_pages_workflow_page_save.md) is used when attempting to submit the form.
* [Server Pages Workflow: Round Trip](Server_pages_workflow_round_trip.md) handles non-save server operations that regenerate the entire page.
* [Server Pages Workflow: Elements Changed](Server_pages_workflow_elements_changed.md) handles AJAX updates to the page structure.

---

Return to [Learning Jivs](../Home.md).
