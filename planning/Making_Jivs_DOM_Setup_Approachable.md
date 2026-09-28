# Working Notes: Making Jivs DOM Setup Approachable

## The Concern

Jivs deliberately keeps value management and validation separate from the user interface. That separation makes Rules reusable on the client, on the server, and in tests. It also means that Jivs cannot automatically know which DOM elements represent its fields or how validation should appear.

The immediate reaction may be:

> This is more work than attaching validators directly to UI controls.

That is true at the point where the UI is connected to Jivs. The integration must identify editors, error displays, summaries, presentations, and accessibility behavior.

The comparison, however, is not “zero wiring versus extra wiring.” Traditional UI validation still requires wiring validators, messages, CSS states, summaries, accessibility, and value synchronization. That work is usually scattered throughout UI code and markup.

Jivs makes the mapping explicit and central.

## The Setup Story Already Used for Jivs

The current introductory material presents creation of a `ValueHostsManager` with four lines:

```ts
const services = createJivsServices("en-US");
const rules = new SearchFormRules(services);
const vhm = new ValueHostsManager(rules.configure());
```

This is a good representation of the engine-side setup:

1. Create the Jivs services.
2. Create the Rules object.
3. Use the Rules to build the configuration.
4. Create the `ValueHostsManager`.

At this point, Jivs knows about the values and validation rules. Nothing has been connected to the UI.

This is already sufficient for server-side use, where there may be no DOM.

## The Full Client-Side Reality

A client application has more responsibilities. Before simplification, the setup might look conceptually like this:

```ts
const services = createJivsServices("en-US");
const rules = new SearchFormRules(services);
const vhm = new ValueHostsManager(rules.configure());

const domServices = services.domServices;

domServices.dispatchers.attach(vhm);

const formInstaller = new FormInstaller(
    vhm,
    domServices,
    new MyElementCollector()
);

formInstaller.install();

const model = getMyModel();

const reader = new ModelReader(
    vhm,
    model,
    {}
);

reader.readFromModel();
```

The exact FormInstaller and ElementCollector APIs remain undecided, but the example exposes the underlying work:

1. Create the Jivs services.
2. Create the `ValueHostsManager`.
3. Attach callbacks that transfer Jivs changes to the DOM.
4. Find the form’s participating elements.
5. Install editor adapters.
6. Install field and form presentations.
7. Establish ARIA behavior.
8. Load the initial values into the `ValueHostsManager`.
9. Allow those values to reach the editors.

This is accurate, but it exposes too much infrastructure to the application developer.

## Two Reusable Blueprints

A client-side form has two complementary definitions.

The `ValueHostRules` class is the model-side blueprint. It describes:

- the values managed by the form;
- their data types;
- validation rules;
- labels and messages;
- relationships between values.

The form’s DOM definition is the UI-side blueprint. It describes:

- which elements are editors;
- which Jivs fields they represent;
- which elements present field or form validation;
- the roles assigned to those elements;
- which presentations and options apply.

The UI definition may come from:

- SimpleDom attributes in the HTML; or
- a form-specific ElementCollector or FormInstaller class.

The final class design remains unsettled, but the developer should need to author only one UI-side definition.

Both blueprints are created once and reused whenever the form is initialized.

## Separating Authoring Work from Runtime Setup

The developer’s authoring work is:

1. Optionally customize `JivsServices`.
2. Create the `ValueHostRules` class for the model or form.
3. Define the UI mapping through SimpleDom or one form-specific TypeScript class.

The runtime setup is different:

1. Create `JivsServices`.
2. Create the `ValueHostsManager`.
3. Install the form’s DOM integration.
4. Establish the form’s initial values.

Keeping these stories separate is important. Creating a Rules class or UI-definition class is not work repeated every time the form loads. Those classes package reusable knowledge.

## One Form-Installation Operation

The DOM setup should appear to the application as one operation:

```ts
const services = createJivsServices("en-US");
const rules = new SearchFormRules(services);
const vhm = new ValueHostsManager(rules.configure());

new SearchFormInstaller(vhm).install();

const model = getMyModel();
const reader = new ModelReader(vhm, model, {});
reader.readFromModel();
```

The form-installation operation can internally coordinate:

- dispatcher attachment;
- element discovery or collection;
- editor-adapter installation;
- field-presentation installation;
- form-presentation installation;
- static ARIA installation;
- initial validation-state presentation.

These remain important architectural responsibilities, but they should not appear as separate routine setup steps.

For SimpleDom, the corresponding line may use its standard installer:

```ts
new SimpleDomFormInstaller(vhm).install();
```

## Initial Value Synchronization

Loading a model is optional. Initial value synchronization is not.

A form may obtain its initial values from:

- a model through `ModelReader`;
- values assigned directly to its `ValueHosts`;
- restored Jivs state;
- initial editor values read from the DOM;
- application-specific initialization code.

Regardless of the source, the editors and their `FieldValueHost` objects must agree before the user begins editing.

When a model supplies the initial data, `ModelReader` provides the standard path:

```ts
const model = getMyModel();
const reader = new ModelReader(vhm, model, {});
reader.readFromModel();
```

Because the DOM integration has already been installed, the resulting Jivs callbacks can update the editors as values enter the `ValueHostsManager`.

An application that does not use `ModelReader` still owns this initialization responsibility. It must ensure that Jivs and the editors begin with matching values.

## Dynamic DOM Changes

Some applications replace or add elements after initial installation. The form-level integration therefore also needs a refresh operation.

The application should not repeat dispatcher, adapter, presentation, and ARIA setup manually. It should ask the installed form integration to refresh itself.

SimpleDom can rediscover elements from current markup. A programmatic UI definition can rerun its centralized element-selection logic.

## Design Goal

DOM integration adds a real UI-side responsibility because Jivs does not embed validation behavior into UI controls. The goal is not to conceal that responsibility.

The goal is to make it:

- understandable;
- centralized;
- reusable;
- testable;
- easy to initialize;
- easy to refresh.

The developer authors two clear blueprints, performs one clear DOM-installation operation, and establishes the form’s initial values before editing begins.
