# Server Pages Workflow: Page Load

A server-generated page arrives in the browser with its HTML already created. Jivs runs on the client. Before editing begins, the new `ValueHostsManager` must be initialized with the Text Values already present in the page’s editors.

Use this workflow when JavaScript is setting up Jivs for a newly loaded server-generated page.

Similar workflows have different starting conditions:

- When attempting to submit the form, use [Server Pages Workflow: Page Save](Server_pages_workflow_page_save.md).
- When the page has been regenerated for another server operation and existing Jivs state must be retained, use [Server Pages Workflow: Round Trip](Server_pages_workflow_round_trip.md).

The server places initial Text Values directly into the generated `input`, `select`, and `textarea` elements. Client code reads those values and supplies them to Jivs. See [Getting Values Already Embedded in HTML](../Initializing_the_Client_Form.md#getting-values-already-embedded-in-html).

## Put the Page Load Setup Together

[The Creation Pattern](../Intro_to_Creating_a_ValueHostsManager.md#the-creation-pattern) explains how to create `JivsServices`, configure the Rules, and create the `ValueHostsManager`. [The Interactive Connection](../Using_the_ValueHostsManager_within_the_Client.md#the-interactive-connection) explains the two-way connection between Jivs and the page’s editors.

The following code brings those responsibilities together. It assumes that the generated HTML is available before the code runs.

```ts
const services = createJivsServices('en-US');
const rules = new PersonFormRules(services);
const config = rules.configure();

config.onTextValueChanged = onTextValueChanged; // optional
config.onValueHostValidationStateChanged = fieldValidated;
config.onValidationStateChanged = formValidated;

const vhm = new ValueHostsManager(config);

reconcileValueHostsWithEditors(vhm);
attachEditorEventHandlers(vhm);
attachPresentationHandlers(vhm);
```

`PersonFormRules` represents the application’s Rules implementation. Every form needs an application-owned Rules class to configure its `ValueHostsManager`. See [Build the Configuration Rules](Using_Jivs_with_Server_Generated_Pages.md#build-the-configuration-rules).

`reconcileValueHostsWithEditors()` is supplied in [Add the Editor Reconciliation Helpers](Using_Jivs_with_Server_Generated_Pages.md#add-the-editor-reconciliation-helpers). It transfers the Text Values from the form’s editors to their associated `FieldValueHost` instances.

`onTextValueChanged` allows Jivs to supply Text Values to the editors. Omit it when Jivs does not need to supply values to your editors. See [When a Text Value Changes](../Using_the_ValueHostsManager_within_the_Client.md#when-a-text-value-changes).

`fieldValidated` receives field validation changes. Jivs SimpleDom supplies the [Field Dispatcher Function](../Presentation/Field_Presentation_of_Jivs_Validation.md#the-field-dispatcher-function). Otherwise, you supply it. See [When a Field’s Validation Changes](../Using_the_ValueHostsManager_within_the_Client.md#when-a-fields-validation-changes).

`formValidated` receives changes to the overall validation state. Jivs SimpleDom supplies the [Form Dispatcher Function](../Presentation/Form_Presentation_of_Jivs_Validation.md#the-form-dispatcher-function). Otherwise, you supply it. See [When Overall Validation Changes](../Using_the_ValueHostsManager_within_the_Client.md#when-overall-validation-changes).

`attachEditorEventHandlers()` attaches the event handlers that supply user-entered Text Values to their `FieldValueHost` instances. You create this function. See [Sending User Input to Jivs](../Using_the_ValueHostsManager_within_the_Client.md#sending-user-input-to-jivs).

`attachPresentationHandlers()` represents the application’s presentation setup. Its implementation depends on the UI and presentation approach selected by the application. When using Jivs SimpleDom, it can attach the field and form presentations and initialize required indicators. Otherwise, you supply it. See [Initialize the Presentation](../Presentation/Presentation_Quick_Start.md#11-initialize-the-presentation).

---

Continue to [Server Pages Workflow: Page Save](Server_pages_workflow_page_save.md).

Return to [Learning Jivs](../Learning_Jivs_Home.md).
