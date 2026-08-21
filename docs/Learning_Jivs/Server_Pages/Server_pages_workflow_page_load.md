# Server Pages Workflow: Page Load

A server-generated page arrives in the browser with its HTML already created. Jivs does its work on the client. Before editing begins, the new `ValueHostsManager` and the page's editors need to be initialized with the same values.

Use this workflow when JavaScript is setting up Jivs for a *newly loaded* server-generated page.

Similar workflows have different starting conditions:

* When the page has returned from an attempted save with server validation errors, use [Server Pages Workflow: Page Save](Server_pages_workflow_page_save.md).
* When the page has been regenerated for another server operation and existing Jivs state must be retained, use [Server Pages Workflow: Round Trip](Server_pages_workflow_round_trip.md).

The initial values usually reach the page through one of these paths:

* **Values rendered into HTML controls.** The server has placed Text Values directly into `input`, `select`, and `textarea` elements. Client-side code reads those values and supplies them to Jivs. See [Getting Values Already Embedded in HTML](Initializing_the_Client_Form.md#getting-values-already-embedded-in-html).

  ```mermaid
  flowchart LR
      SERVER["Server-Generated Page"] --> ELEMENTS["Get Text Values from Elements"]
      ELEMENTS --> VHM["ValueHostsManager"]
  ```

* **A Model embedded in the generated page.** The server includes Model data in the page. Client-side code retrieves that data and supplies the Model values to Jivs. Jivs can then format Text Values for the editors. See [Getting Values from a Model](Initializing_the_Client_Form.md#getting-values-from-a-model).

  ```mermaid
  flowchart LR
      SERVER["Server-Generated Page"] --> MODEL["Get Model"]
      MODEL --> VHM["ValueHostsManager"]
      VHM --> EDITORS["Update Values in Editors"]
  ```

* **A Model retrieved from an API.** After the page loads, client-side code requests the Model from an API and supplies its values to Jivs. Jivs can then format Text Values for the editors. See [Getting Values from a Model](Initializing_the_Client_Form.md#getting-values-from-a-model).

  ```mermaid
  flowchart LR
      PAGE["Server-Generated Page"] --> MODEL["Request Model from API"]
      MODEL --> VHM["ValueHostsManager"]
      VHM --> EDITORS["Update Values in Editors"]
  ```

In each approach, the `ValueHostsManager` should receive the values from the place where the application already makes them available.

After the values are established in the `ValueHostsManager`, the remaining client setup connects editors to their `FieldValueHost` instances and connects field and form elements to validation state. The following section puts the complete Page Load setup together.

## Put the Page Load Setup Together

[The Creation Pattern](Intro_to_Creating_a_ValueHostsManager.md#the-creation-pattern) explains how to create `JivsServices`, configure the Rules, and create the `ValueHostsManager`. [The Interactive Connection](Using_the_ValueHostsManager_within_the_Client.md#the-interactive-connection) explains the two-way connection between Jivs and the page's editors.

The following code brings those responsibilities together. It assumes that the generated HTML is available before this function runs.

```ts
function initializePage(): IValueHostsManager {
    const services = createJivsServices('en-US');
    const rules = new PersonFormRules(services);
    const config = rules.configure();

    config.onTextValueChanged = onTextValueChanged; // optional
    config.onValueHostValidationStateChanged = fieldValidated;
    config.onValidationStateChanged = formValidated;

    const vhm = new ValueHostsManager(config);

    initializeValues(vhm);
    attachEditorEventHandlers(vhm);
    attachPresentationHandlers(vhm);

    return vhm;
}

const vhm = initializePage();
```

`PersonFormRules` represents the application's Rules implementation. Every form needs an application-owned Rules class to configure its `ValueHostsManager`. See [Defining ValueHosts with a Rules Class](Intro_to_Creating_a_ValueHostsManager.md#defining-valuehosts-with-a-rules-class).

`initializeValues()` represents the value path selected by the application. The snippets below show the distinguishing operation for each path. The linked sections provide the complete implementations.

* For values rendered into the page's elements, read each element's Text Value and supply it to its `FieldValueHost`:

  ```ts
  vhm.vh('FirstName').setTextValue(firstNameInput.value, {
      validate: false,
      reset: true
  });
  ```

  See [Getting Values Already Embedded in HTML](Initializing_the_Client_Form.md#getting-values-already-embedded-in-html).

* For a Model embedded in the page or retrieved from an API, transfer its Native Values using `ModelReader`:

  ```ts
  const reader = new ModelReader(vhm, person);
  reader.readFromModel();
  ```

  See [Use ModelReader to Transfer Values](Initializing_the_Client_Form.md#use-modelreader-to-transfer-values).

`onTextValueChanged` allows Jivs to supply Text Values to the editors. Omit it when Jivs does not need to supply values to your editors. See [When a Text Value Changes](Using_the_ValueHostsManager_within_the_Client.md#when-a-text-value-changes).

`fieldValidated` receives field validation changes. Jivs SimpleDom supplies the [Field Dispatcher Function](Field_Presentation_of_Jivs_Validation.md#the-field-dispatcher-function). Otherwise you supply it. See [When a Field's Validation Changes](Using_the_ValueHostsManager_within_the_Client.md#when-a-fields-validation-changes).

`formValidated` receives changes to the overall validation state. Jivs SimpleDom supplies the [Form Dispatcher Function](Form_Presentation_of_Jivs_Validation.md#the-form-dispatcher-function). Otherwise you supply it. See [When Overall Validation Changes](Using_the_ValueHostsManager_within_the_Client.md#when-overall-validation-changes).

`attachEditorEventHandlers()` attaches the event handlers that supply user-entered Text Values to their `FieldValueHost` instances. You create this function. See [Sending User Input to Jivs](Using_the_ValueHostsManager_within_the_Client.md#sending-user-input-to-jivs).

`attachPresentationHandlers()` represents the application's presentation setup. Its implementation depends on the UI and presentation approach selected by the application. When using Jivs SimpleDom, it can attach the field and form presentations and initialize required indicators. Otherwise you supply it. See [Initialize the Presentation](Presentation_Quick_Start.md#11-initialize-the-presentation).
