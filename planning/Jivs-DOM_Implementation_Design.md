# Jivs-DOM Implementation Design

## Purpose and Scope

This document is the implementation blueprint for adding DOM support to the Jivs repository. It defines the architecture, public API, concrete types, and package responsibilities needed to implement:

* `@plblum/jivs-dom`
* `@plblum/jivs-simpledom`
* demonstration websites that exercise and explain those packages

`jivs-dom` provides reusable integration between Jivs and browser DOM elements. It supplies editor adapters, installation services, dispatchers, validation presentations, accessibility support, error-message formatting, and related CSS without imposing a particular HTML markup convention.

`jivs-simpledom` is a concrete implementation built on `jivs-dom`. It uses a defined set of HTML attributes to discover elements, associate them with Jivs objects, select presentations, and install the required DOM behavior.

The document also identifies changes required in `jivs-engine` to support these packages.

This is a coding blueprint rather than a history of the design process or an end-user learning guide. It uses exact API names and signatures where decisions have been completed. Any remaining conceptual APIs are identified as unresolved and must be finalized before their implementation sections are considered complete.

Repository placement, demonstration website organization, and testing responsibilities are included where they affect the implementation design. Detailed development commands, migration sequencing, publishing procedures, and end-user documentation remain outside its scope.

## Architectural Overview

### Relationship with jivs-engine

```mermaid
flowchart TB
    subgraph DOM["jivs-dom"]
        direction TB

        DISPATCHERS["DOM dispatchers"]
        EDITORS["Editor adapter definitions"]
        PRESENTATIONS["Field and form presentations"]

        DISPATCHERS ~~~ EDITORS ~~~ PRESENTATIONS
    end

    subgraph ENGINE["jivs-engine"]
        direction TB

        CONFIG["ValueHostsManagerConfig"]
        FIELD["IFieldValueHost"]
        TYPES["Validation and error types"]

        CONFIG ~~~ FIELD ~~~ TYPES
    end

    DISPATCHERS <-->|"attach and receive callbacks"| CONFIG
    EDITORS -->|"setTextValue, setValue, setValues"| FIELD

    TYPES -.->|"ValidationState and ValueHostValidationState"| DISPATCHERS
    TYPES -.->|"IssueFound"| PRESENTATIONS
    EDITORS -.->|"InjectedError"| TYPES
```

The principal `jivs-engine` integration points are:

| Jivs API                                                    | Use within `jivs-dom`                                                                                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ValueHostsManagerConfig.onTextValueChanged`                | Notifies a Text Value dispatcher. The dispatcher obtains the current Text Value from the supplied `IFieldValueHost` and writes it through installed `IDomTextValueAdapter` objects. |
| `ValueHostsManagerConfig.onValueChanged`                    | Notifies a Native Value dispatcher. The dispatcher obtains the current Native Value from the supplied `IValueHost` and writes it through installed `IDomValueAdapter` objects.      |
| `ValueHostsManagerConfig.onValueHostValidationStateChanged` | Supplies the `ValueHostValidationState` used by installed field presentations and field-level ARIA behavior.                                                                        |
| `ValueHostsManagerConfig.onValidationStateChanged`          | Supplies the `ValidationState` used by installed form presentations.                                                                                                                |
| `IFieldValueHost.setTextValue()`                            | Accepts textual editor input and lets Jivs perform its configured parsing and validation.                                                                                           |
| `IFieldValueHost.setValue()`                                | Accepts a Native Value from an editor that exposes non-textual or structured data.                                                                                                  |
| `IFieldValueHost.setValues()`                               | Accepts related Text and Native Values when parsing is performed outside Jivs. It can also receive an `InjectedError` when that parsing fails.                                      |
| `IFieldValueHost.getElementIdentifier()`                    | Supplies the application-defined identifier used by a DOM convention to associate the field with its elements.                                                                      |
| `ValidationState`                                           | Describes validation across the `ValueHostsManager` and drives form presentation.                                                                                                   |
| `ValueHostValidationState`                                  | Describes validation for one ValueHost and drives field presentation.                                                                                                               |
| `IssueFound`                                                | Supplies the validation messages and metadata consumed by error displays, summaries, and DOM-oriented message formatting.                                                           |
| `InjectedError`                                             | Allows an editor adapter definition that performs external parsing to report a parsing failure through Jivs validation.                                                             |
| `ValueHostsManager.broadcastState()`                        | Republishes current Text Values, field validation state, and form validation state when initialization did not produce the usual change callbacks.                                  |

### Editor Element Installation

```mermaid
flowchart TB
    INSTALLER["IEditorInstaller"]
    DEFINITION["Selected IDomEditorAdapterDefinition"]
    PRESENTATION_INSTALLER["IFieldPresentationInstaller"]

    subgraph FACTORY["IDomEditorAdapterFactory"]
        direction LR

        REGISTERED["Registered definitions: InputAdapterDefinition, CheckboxAdapterDefinition, InputRadioGroupAdapterDefinition, TextAreaAdapterDefinition, SelectAdapterDefinition, FileInputAdapterDefinition"]
        FACTORY_API["Definition registry and selection"]

        REGISTERED -->|"used by"| FACTORY_API
    end

    ELEMENT["IJivsDomElement"]
    TEXT_ADAPTER["IDomTextValueAdapter"]
    VALUE_ADAPTER["IDomValueAdapter"]
    PRESENTATION["IFieldPresentation"]

    INSTALLER -->|"uses"| FACTORY
    FACTORY -->|"returns"| DEFINITION
    INSTALLER -->|"uses"| PRESENTATION_INSTALLER

    DEFINITION -->|"creates"| TEXT_ADAPTER
    DEFINITION -->|"creates"| VALUE_ADAPTER
    DEFINITION -->|"attachToSendValues()"| ELEMENT

    DEFINITION -->|"jivsEditorAdapterDefinition"| ELEMENT
    TEXT_ADAPTER -->|"jivsTextValueAdapter"| ELEMENT
    VALUE_ADAPTER -->|"jivsValueAdapter"| ELEMENT

    PRESENTATION_INSTALLER -->|"creates"| PRESENTATION
    PRESENTATION -->|"jivsFieldPresentation"| ELEMENT
```

### Editor Callback Flows

```mermaid
flowchart LR
    subgraph TEXT["Text Value callback"]
        direction TB

        TEXT_CALLBACK["onTextValueChanged"]
        TEXT_DISPATCHER["TextValueDispatcher"]
        TEXT_ELEMENT["IJivsDomElement"]
        TEXT_ADAPTER["IDomTextValueAdapter"]
        TEXT_EDITOR["Editor Text Value"]

        TEXT_CALLBACK -->|"supplies ValueHost"| TEXT_DISPATCHER
        TEXT_DISPATCHER -->|"getTextValue(); findConsumers()"| TEXT_ELEMENT
        TEXT_ELEMENT -->|"resolve jivsTextValueAdapter"| TEXT_ADAPTER
        TEXT_ADAPTER -->|"writeTextValue()"| TEXT_EDITOR
    end

    subgraph VALUE["Native Value callback"]
        direction TB

        VALUE_CALLBACK["onValueChanged"]
        VALUE_DISPATCHER["ValueDispatcher"]
        VALUE_ELEMENT["IJivsDomElement"]
        VALUE_ADAPTER["IDomValueAdapter"]
        VALUE_EDITOR["Editor Native Value"]

        VALUE_CALLBACK -->|"supplies ValueHost"| VALUE_DISPATCHER
        VALUE_DISPATCHER -->|"getValue(); findConsumers()"| VALUE_ELEMENT
        VALUE_ELEMENT -->|"resolve jivsValueAdapter"| VALUE_ADAPTER
        VALUE_ADAPTER -->|"writeValue()"| VALUE_EDITOR
    end
```

### Presentation Installation

```mermaid
flowchart LR
    subgraph FIELD["Field presentation installation"]
        direction TB

        FIELD_INSTALLER["IFieldPresentationInstaller"]
        FIELD_PRESENTATION["Selected IFieldPresentation"]
        FIELD_ELEMENT["IJivsDomElement.jivsFieldPresentation"]

        FIELD_INSTALLER -->|"selects and creates"| FIELD_PRESENTATION
        FIELD_PRESENTATION -->|"assigned to"| FIELD_ELEMENT
    end

    subgraph FORM["Form presentation installation"]
        direction TB

        FORM_INSTALLER["IFormPresentationInstaller"]
        FORM_PRESENTATION["Selected IFormPresentation"]
        FORM_ELEMENT["IJivsDomElement.jivsFormPresentation"]

        FORM_INSTALLER -->|"selects and creates"| FORM_PRESENTATION
        FORM_PRESENTATION -->|"assigned to"| FORM_ELEMENT
    end
```

### Field Presentation Flow

```mermaid
flowchart TB
    CALLBACK["onValueHostValidationStateChanged"]

    subgraph DISPATCHER["FieldValidationDispatcher"]
        direction TB

        FIND["findConsumers()"]
        APPLY["IJivsDomElement.jivsFieldPresentation.apply"]
        FIELD_UI["Updated field UI"]

        FIND --> |"for each consumer"| APPLY
        APPLY --> FIELD_UI
    end


    CALLBACK -->|"supplies ValueHost and ValueHostValidationState"| DISPATCHER

```

### Form Presentation Flow

```mermaid
flowchart TB
    CALLBACK["onValidationStateChanged"]

    subgraph DISPATCHER["FormValidationDispatcher"]
        direction TB

        FIND["findConsumers()"]
        APPLY["IJivsDomElement.jivsFormPresentation.apply"]
        FORM_UI["Updated form UI"]

        FIND -->|"for each consumer"| APPLY
        APPLY --> FORM_UI
    end

    CALLBACK -->|"supplies ValueHostsManager and ValidationState"| DISPATCHER
```
## Core Design Principles

* DOM elements own element-specific installation state. Installed adapter definitions, adapters, and presentations are exposed through the `IJivsDomElement` contract.

* Registered adapter definitions are shared and immutable. They do not retain element-specific, ValueHost-specific, or installation-specific state.

* Adapters and presentations are created for individual elements. They may retain state belonging to that element but do not retain a `ValueHostsManager`.

* Shared services do not retain forms, elements, element collections, or DOM subtrees.

* Dispatchers are created for a specific callback attachment. They may retain configuration and discovery policy, but they rediscover consumer elements during every dispatch and do not retain the elements they find.

* The four callback capabilities remain independent: Text Value changes, Native Value changes, field validation changes, and form validation changes can be attached and replaced separately.

* Editor installation is idempotent after successful completion. Later calls that resolve to the same installation anchor do not modify the anchor or attach additional event handlers.

* Public behavior is replaceable through interfaces, service properties, factories, and registration methods. Applications can supply custom widgets, presentations, dispatchers, discovery conventions, accessibility behavior, and message formatting without changing `jivs-dom` internals.

* Where reusable behavior requires markup-specific element discovery, `jivs-dom` exposes protected abstract methods for a concrete DOM convention to implement. `jivs-simpledom` supplies the standard implementation delivered with Jivs, while `jivs-dom` remains independent of SimpleDom attributes and selectors.

## Required Jivs Engine Support

### Container Identifier

A page may contain more than one `ValueHostsManager`, each responsible for a different form or region of the DOM. Field identifiers, presentation roles, and other selector characteristics may be repeated between those regions.

Dispatchers rediscover consumer elements whenever a callback occurs. If discovery always begins at the document level, a dispatcher may find and update elements belonging to another `ValueHostsManager`.

The manager therefore needs an optional identifier for its containing DOM region. A dispatcher can resolve that container first and restrict all consumer discovery to the resulting subtree.

`ValueHostsManagerConfig` adds:

```ts
interface ValueHostsManagerConfig {
    containerIdentifier?: string | null;
}
```

`IValueHostsManager` and `ValueHostsManager` expose that identifier through:

```ts
getContainerIdentifier(
    template?: string
): string | null;
```

When `containerIdentifier` contains a nonempty string, `getContainerIdentifier()` returns it. When a template is supplied, the method replaces `{0}` with the configured identifier.

When the configuration value is absent, `null`, or empty, the method returns `null`. Unlike `IFieldValueHost.getElementIdentifier()`, it does not fall back to a ValueHost name.

DOM dispatchers use the result to determine their query root:

* When the result is `null`, discovery begins at `document.body`.
* When an identifier is returned, the concrete DOM convention resolves the corresponding container element and uses it as the discovery root.
* When a configured identifier cannot be resolved, dispatch is abandoned and logged. It must not fall back to `document.body`, where it could affect elements belonging to another `ValueHostsManager`.

The engine stores the identifier but does not interpret it. A concrete DOM convention decides whether it represents selector syntax or another lookup mechanism.

### Current Validation State

Form presentation installation requires access to the manager’s current validation state without running validation or invoking validation callbacks. Validation groups make this state group-specific.

#### Validation-State Group

`ValidationState` gains an optional `group` property:

```ts
interface ValidationState {
    group?: string;
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: IssueFound[] | null;
    asyncProcessing: boolean;
}
```

The property identifies the validation group used to construct the state. When no group was supplied, it remains `undefined`.

`ValueHostValidationState` continues to extend `ValidationState`. It therefore also includes `group`:

```ts
interface ValueHostValidationState
    extends ValidationState {

    status: ValidationStatus;

    // Existing field-specific members.
}
```

A `ValueHostValidationState` retains the group supplied through `ValidateOptions.group` when its field was validated.

The standard explicit wildcard group is `"*"`. Omitting the group remains valid and produces `undefined`. Group comparison uses the existing `groupsMatch()` behavior, under which `null`, `undefined`, `""`, and `"*"` all mean that group matching is unrestricted.

#### Manager Current-State Method

`IValueHostsManager` exposes the current manager state as a method because the requested group affects the result:

```ts
interface IValueHostsManager {
    currentValidationState(
        group?: string
    ): ValidationState;
}
```

`currentValidationState(group)` returns a state calculated for the requested group:

* `isValid`, `doNotSave`, `issuesFound`, and `asyncProcessing` include only the Value Hosts and validation results applicable to that group;
* the returned state carries the requested group in `state.group`;
* omitting the argument returns the unrestricted manager state;
* calling the method does not run validation;
* calling the method does not invoke validation callbacks.

This allows a newly installed Validation Summary or submit-control presentation to receive the correct existing state:

```ts
presentation.apply(
    valueHostsManager,
    valueHostsManager.currentValidationState(
        options.group
    )
);
```

#### Group-Specific Caching

Constructing a manager `ValidationState` requires calculating several aggregate values and collecting the applicable issues. The result is therefore cached.

The cache must associate each state with the group for which it was created. A state created for one specific group must never satisfy a request for another group.

Group keys follow the same case-insensitive semantics used by validation-group matching. Wildcard forms represent the unrestricted state.

Whenever engine activity changes validation information that could affect a manager state, all cached manager states are invalidated. Clearing the complete cache is required because one change may affect:

* a specifically grouped state;
* the unrestricted state;
* another state whose applicable validators overlap that group.

The next call to `currentValidationState(group)` reconstructs and caches the missing state for that group. Repeated calls for the same group return the cached instance until invalidation.

#### State Construction

The existing protected state-construction behavior remains the source of the calculated values:

```ts
protected createValidationState(
    options?: ValidateOptions
): ValidationState {
    return {
        group: options?.group,
        isValid:
            this.calculateIsValid(options),
        doNotSave:
            this.calculateDoNotSave(options),
        issuesFound:
            this.getIssuesFound(options?.group),
        asyncProcessing:
            this.calculateAsyncProcessing(options)
    };
}
```

Normal validation processing continues to create one `ValidationState` instance and deliver that same instance to every validation-state listener.

Cache invalidation and state calculation must be separated sufficiently for `currentValidationState(group)` to populate one missing cache entry without invalidating valid entries for other groups. This may be implemented with a private calculation helper shared by `createValidationState()` and `currentValidationState()`, while normal state-changing engine paths invalidate the cache before creating and notifying their new state.

This support allows `jivs-dom` to initialize and update grouped form presentations without rerunning validation and without independently reconstructing manager validation state.

## The Installed DOM Element

`IJivsDomElement` is the stateful installation surface shared by installers and dispatchers. It augments an ordinary `HTMLElement` with the Jivs behavior installed for that element.

It is a TypeScript contract, not a new runtime element class:

```ts
interface IJivsDomElement extends HTMLElement {
    jivsEditorAdapterDefinition?:
        IDomEditorAdapterDefinition;

    jivsTextValueAdapter?:
        IDomTextValueAdapter | null;

    jivsValueAdapter?:
        IDomValueAdapter | null;

    jivsFieldPresentation?:
        IFieldPresentation | null;

    jivsFormPresentation?:
        IFormPresentation | null;

    jivsFormPresentationGroup?: string;
}
```

### Adapter Definition State

`jivsEditorAdapterDefinition` has two states:

| Value                         | Meaning                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `undefined`                   | Editor installation has not completed on this element.                                                    |
| `IDomEditorAdapterDefinition` | Editor installation completed on this element using this definition. Later installation calls are no-ops. |

`IEditorInstaller` assigns the definition only after installing the anchor’s adapter capabilities, DOM-to-Jivs event handling, and field presentation. The property therefore identifies both the installed definition and successful completion of editor installation.

The installed definition is shared and immutable. It describes the widget behavior but does not contain state belonging to this element.

### Adapter State

`jivsTextValueAdapter` and `jivsValueAdapter` each have three states:

| Value            | Meaning                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `undefined`      | The capability has not been examined. An installer may attempt to create it.                                  |
| Adapter instance | The capability is installed and available to its dispatcher.                                                  |
| `null`           | The capability was examined but is unavailable for this widget. Installation does not retry it automatically. |

Text Value and Native Value capabilities are independent. An element may provide either adapter, both adapters, or neither adapter.

### Presentation State

`jivsFieldPresentation` and `jivsFormPresentation` also have three states:

| Value                 | Meaning                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `undefined`           | Presentation installation has not been attempted.                                                     |
| Presentation instance | The presentation is installed and available to its dispatcher.                                        |
| `null`                | The element has no presentation because it was disabled or no form-role default was configured.       |

A no-op presentation is still a presentation instance. `null` specifically records the decision that the element has no presentation.

For a field presentation, `null` results from explicit disabling. For a form presentation, it can also result when neither an explicit presentation name nor a role default is available.

`jivsFormPresentationGroup` stores the routing group bound to an installed form presentation. It remains `undefined` when form presentation installation has not completed or resolves to `null`.

The presentation installer methods return nullable results consistent with these states:

```ts
interface IFieldPresentationInstaller {
    install(
        valueHost: IFieldValueHost,
        element: IJivsDomElement,
        role: ElementRole | string,
        presentationName: string | null | undefined
    ): IFieldPresentation | null;
}

interface FormPresentationInstallOptions {
    presentationName?: string | null;
    group?: string;
}

interface IFormPresentationInstaller {
    install(
        valueHostsManager: IValueHostsManager,
        element: IJivsDomElement,
        role: ElementRole | string,
        options?: FormPresentationInstallOptions
    ): IFormPresentation | null;
}
```

### Element Lifetime

Adapter and presentation instances belong to the element on which they are installed. For editor installation, that element is the installation anchor resolved by the selected editor adapter definition and may differ from the element originally supplied to `IEditorInstaller.install()`.

Replacing an installation anchor removes its installed Jivs behavior with it. The replacement element must be installed before dispatchers can use it.

Dispatchers read these public properties but never create missing capabilities during dispatch. Both `undefined` and `null` are skipped.

Applications may replace installed adapter and presentation instances through these public properties. The definition recorded by a completed editor installation remains assigned for the lifetime of the anchor.

## Editor Architecture

### Editor Adapter Contracts

An Editor Adapter gives a specific editor widget the value-transfer functions needed by `jivs-dom`. Different widget behaviors require different adapter implementations. Initial implementations will support input, textarea, and select elements, with specialized implementations where their value semantics differ.

Applications do not register adapters directly. They register an `IDomEditorAdapterDefinition` with `IDomEditorAdapterFactory`. The factory maintains and selects from those definitions. After a definition is selected for an element, the definition directly instantiates the appropriate adapters. There is no separate adapter registry or adapter lookup.

Editor adapters support two directions of communication:

* The write methods support Jivs-to-DOM callbacks. `onTextValueChanged` ultimately calls `writeTextValue()`, while `onValueChanged` ultimately calls `writeValue()`.
* The read methods support DOM-to-Jivs event handling. An `IDomEditorAdapterDefinition` attaches the editor’s change events and uses the installed adapter to obtain the current value before sending it to the `IFieldValueHost`.

> Without the DOM-to-Jivs event-handling requirement, the read methods would not be part of these adapter contracts. They exist so adapter definitions can reuse the same widget-specific value access used by callback dispatchers in the opposite direction.

Text Value and Native Value support remain separate capabilities. An adapter definition may create a Text Value adapter, a Native Value adapter, or both:

```ts
interface IDomTextValueAdapter {
    readTextValue(): string | undefined;

    writeTextValue(
        textValue: string | undefined
    ): void;
}

interface IDomValueAdapter {
    readValue(): unknown;

    writeValue(
        value: unknown
    ): void;
}
```

> Text Value adapters preserve the `string | undefined` contract of `IFieldValueHost.getTextValue()` and `IFieldValueHost.setTextValue()`. A concrete adapter is responsible for translating `undefined` when its DOM widget cannot represent it directly.

Each adapter instance belongs to one element. The standard base classes give concrete implementations strongly typed access to that element while preserving normal class behavior:

```ts
abstract class DomTextValueAdapterBase<
    TElement extends HTMLElement = HTMLElement
> implements IDomTextValueAdapter {

    public constructor(
        protected readonly element: TElement
    ) {
    }

    public abstract readTextValue():
        string | undefined;

    public abstract writeTextValue(
        textValue: string | undefined
    ): void;
}

abstract class DomValueAdapterBase<
    TElement extends HTMLElement = HTMLElement
> implements IDomValueAdapter {

    public constructor(
        protected readonly element: TElement
    ) {
    }

    public abstract readValue(): unknown;

    public abstract writeValue(
        value: unknown
    ): void;
}
```

Concrete adapters select the element type appropriate to their widget:

```ts
class InputTextValueAdapter
    extends DomTextValueAdapterBase<HTMLInputElement> {

    public readTextValue(): string {
        return this.element.value;
    }

    public writeTextValue(
        textValue: string | undefined
    ): void {
        this.element.value = textValue ?? "";
    }
}
```

Within adapter methods, `this` is the adapter instance. The associated DOM element is available through `this.element`.

The selected adapter definition constructs each adapter with the installation anchor and returns an instance ready for immediate use. No separate binding operation is required.

Adapters may retain additional element-specific state as class members. They do not retain an `IFieldValueHost` or `IValueHostsManager`.
### Editor Adapter Definitions

An editor adapter definition keeps the behaviors for one widget model together. Without this coordinating type, widget recognition, installation-anchor selection, Jivs-to-DOM value transfer, and DOM-to-Jivs event handling could be implemented independently and disagree about how the editor represents its value.

A definition is responsible for:

* recognizing fields and elements that use its widget model;
* resolving the element that serves as the installation anchor;
* directly constructing the anchor’s Text Value and Native Value adapters;
* attaching DOM event handlers that send edited values to the `IFieldValueHost`;
* identifying the default field presentation associated with the widget, when applicable;
* when also implementing `IDomAriaEditorDefinition`, supplying editor-element information to the ARIA service.

```ts
interface IDomEditorAdapterDefinition {
    readonly adapterKey: string;
    readonly priority: number;

    readonly defaultFieldPresentationName?:
        string | null;

    matches(
        valueHost: IFieldValueHost,
        element: HTMLElement
    ): boolean;

    resolveInstallationAnchor(
        valueHost: IFieldValueHost,
        element: IJivsDomElement
    ): IJivsDomElement;

    createTextValueAdapter?(
        valueHost: IFieldValueHost,
        anchor: IJivsDomElement
    ): IDomTextValueAdapter | null;

    createValueAdapter?(
        valueHost: IFieldValueHost,
        anchor: IJivsDomElement
    ): IDomValueAdapter | null;

    attachToSendValues(
        valueHost: IFieldValueHost,
        anchor: IJivsDomElement,
        options: EditorInstallOptions
    ): void;
}
```

The `IFieldValueHost` provides installation-time context to each operation. Neither the definition nor its returned adapters retain it.

#### Definition Selection

`IDomEditorAdapterFactory` registers and selects editor adapter definitions. It does not register, create, or look up adapter instances. Once the factory selects a definition, the definition resolves the installation anchor and directly instantiates the adapters appropriate to that anchor.

```ts
interface IDomEditorAdapterFactory {
    register(
        definition: IDomEditorAdapterDefinition
    ): void;

    getDefinition(
        adapterKey: string
    ): IDomEditorAdapterDefinition | null;

    findDefinition(
        valueHost: IFieldValueHost,
        element: HTMLElement
    ): IDomEditorAdapterDefinition | null;
}
```

The factory preregisters all adapter definitions supplied with jivs-dom. They are given a low priority to allow easy overrides. It maintains an internal list of registrations ordered by priority in descending order for searching.

`getDefinition()` performs explicit selection by `adapterKey`. It does not use `priority` or call `matches()`.

`findDefinition()` performs automatic selection:

1. It evaluates definitions in descending numeric `priority` order.
2. It preserves registration order among definitions having the same priority.
3. It calls `matches(valueHost, element)` until the first definition returns `true`.
4. It returns `null` when no definition matches.

Priorities from `0` through `100` are the documented normal range, with larger values examined first. Negative values and values greater than `100` remain valid so applications are not prevented from placing definitions before or after the standard range.

`adapterKey` uniquely identifies a registered definition. Registering another definition with an existing key logs the replacement and uses the new definition for future explicit and automatic selection. Anchors already installed with the earlier definition retain it.

`matches()` is a read-only predicate. It must not modify or retain either argument.

#### Resolving the Installation Anchor

The element supplied to `IEditorInstaller.install()` identifies the editor encountered by the caller. The selected definition determines which element stores the completed installation and its installed capabilities.

`resolveInstallationAnchor()` returns that element.

For ordinary editors, the supplied element is also the installation anchor. `DomEditorAdapterDefinitionBase` implements this default behavior.

A composite editor may use several DOM elements for one logical value. Its definition can override `resolveInstallationAnchor()` so calls involving those elements converge on one anchor. The built-in `InputRadioGroupAdapterDefinition` instead requires the enclosing radio-group element to be supplied directly and uses the inherited default resolution.

Anchor resolution occurs before the installer examines `jivsEditorAdapterDefinition` or performs any installation mutations. Once an anchor is resolved, the installer passes that anchor to the adapter creation, event attachment, and presentation installation operations.

`resolveInstallationAnchor()` must not install adapters, attach events, install a presentation, or assign `jivsEditorAdapterDefinition`.

#### Completed Installation State

`IJivsDomElement.jivsEditorAdapterDefinition` records that editor installation completed successfully on the anchor.

The definition does not assign this property. `IEditorInstaller` assigns it after installing the adapters, event handlers, and presentation.

When anchor resolution returns an element whose `jivsEditorAdapterDefinition` is already assigned, the installer returns without calling the definition’s adapter creation or event attachment methods.

The property therefore serves both as the installed definition and as the completed-installation marker. No additional symbol or event-attachment marker is used.

#### Adapter Creation

The adapter creation methods are independent:

* An omitted method indicates that the definition never supports that capability.
* A returned adapter installs that capability on the anchor.
* A returned `null` records that the capability is unavailable for this particular installation.

The definition directly constructs the adapter. There is no adapter-instance registry or secondary factory lookup.

#### Base Implementation

`DomEditorAdapterDefinitionBase` implements shared definition behavior, default anchor resolution, diagnostic logging, and the standard DOM-to-Jivs submission paths.

Its constructor initializes the immutable definition properties:

```ts
abstract class DomEditorAdapterDefinitionBase
    implements IDomEditorAdapterDefinition {

    protected constructor(
        public readonly adapterKey: string,
        public readonly priority: number,
        public readonly defaultFieldPresentationName?:
            string | null
    ) {
    }

    public abstract matches(
        valueHost: IFieldValueHost,
        element: HTMLElement
    ): boolean;

    public resolveInstallationAnchor(
        valueHost: IFieldValueHost,
        element: IJivsDomElement
    ): IJivsDomElement {
        return element;
    }

    public attachToSendValues(
        valueHost: IFieldValueHost,
        anchor: IJivsDomElement,
        options: EditorInstallOptions
    ): void {
        // Log the start of event attachment at Debug level.

        this.attachToSendValuesCore(
            valueHost,
            anchor,
            options
        );

        // Log successful completion at Debug level.
    }

    protected abstract attachToSendValuesCore(
        valueHost: IFieldValueHost,
        anchor: IJivsDomElement,
        options: EditorInstallOptions
    ): void;
}
```

Concrete definitions override `attachToSendValuesCore()`, not `attachToSendValues()`. They choose and attach the DOM events appropriate to their widgets, while the public method provides consistent logging.

Definitions for ordinary editors inherit `resolveInstallationAnchor()`. Definitions for composite editors override it.

#### Diagnostic Logging

`attachToSendValues()` has access to `valueHost.services.loggingService`. It logs at `LoggingLevel.Debug` so normal applications do not receive installation noise unless diagnostic logging is enabled.

Useful entries include:

* attachment started, identifying the ValueHost and `adapterKey`;
* attachment completed successfully;
* a concrete definition intentionally attached no handler;
* a required installed adapter was unavailable when an event fired.

Concrete definitions may add Debug entries describing their selected event strategy, such as attaching `change` alone or attaching both `input` and `change`.

Logs should identify the ValueHost, adapter key, and relevant event names. They should not include the editor’s actual value because it may contain private application data.

#### Protected Submission Helpers

The base class provides protected methods for the standard event-handler paths. Concrete definitions attach events and invoke the appropriate helper.

##### Send a Text Value

```ts
protected sendTextValue(
    valueHost: IFieldValueHost,
    anchor: IJivsDomElement,
    duringEdit: boolean
): void;
```

This helper:

1. obtains `anchor.jivsTextValueAdapter`;
2. returns after a Debug log when the adapter is `undefined` or `null`;
3. calls `readTextValue()`;
4. calls `valueHost.setTextValue()` with the result;
5. sets `validate: true`;
6. includes `duringEdit: true` only for an intermediate-edit event.

Conceptually:

```ts
valueHost.setTextValue(
    adapter.readTextValue(),
    {
        validate: true,
        duringEdit: duringEdit || undefined
    }
);
```

##### Send a Native Value

```ts
protected sendValue(
    valueHost: IFieldValueHost,
    anchor: IJivsDomElement
): void;
```

This helper:

1. obtains `anchor.jivsValueAdapter`;
2. returns after a Debug log when the adapter is `undefined` or `null`;
3. calls `readValue()`;
4. calls `valueHost.setValue()` with the result;
5. sets `validate: true`.

Conceptually:

```ts
valueHost.setValue(
    adapter.readValue(),
    {
        validate: true
    }
);
```

##### Send an Externally Parsed Text Value

Applications may need to parse editor text outside Jivs while still preserving both the Native Value and Text Value in the `IFieldValueHost`. `ParsedTextEditorAdapterDefinition` adds this submission path.

```ts
abstract class ParsedTextEditorAdapterDefinition
    extends DomEditorAdapterDefinitionBase {

    protected abstract parseTextValue(
        textValue: string | undefined,
        valueHost: IFieldValueHost,
        anchor: IJivsDomElement
    ): {
        nativeValue: unknown | undefined;
        injectedError?: InjectedError;
    };

    protected sendParsedTextValue(
        valueHost: IFieldValueHost,
        anchor: IJivsDomElement,
        duringEdit: boolean
    ): void;
}
```

`sendParsedTextValue()`:

1. obtains `anchor.jivsTextValueAdapter`;
2. returns after a Debug log when the adapter is `undefined` or `null`;
3. obtains the current Text Value through `readTextValue()`;
4. passes it to `parseTextValue()`;
5. calls `valueHost.setValues()` with both values;
6. supplies any returned `InjectedError`;
7. sets `validate: true`;
8. includes `duringEdit: true` only for an intermediate-edit event.

Conceptually:

```ts
const textValue = adapter.readTextValue();

const result = this.parseTextValue(
    textValue,
    valueHost,
    anchor
);

valueHost.setValues(
    result.nativeValue,
    textValue,
    {
        validate: true,
        duringEdit: duringEdit || undefined,
        injectedError: result.injectedError
    }
);
```

The helper methods do not catch errors from adapters, parsing, or the `IFieldValueHost`. Logging may record the failure, but the original exception remains observable.

#### Built-in Definitions

`jivs-dom` supplies these concrete descendants of `DomEditorAdapterDefinitionBase`:

* `InputAdapterDefinition` for ordinary input types other than checkbox, radio, and file, with adapter keys in `input:type` format;
* `CheckboxAdapterDefinition` for checkbox inputs with `adapterKey="input:checkbox"`;
* `InputRadioGroupAdapterDefinition` for native input radio groups with `adapterKey="input:radio-group"`;
* `TextAreaAdapterDefinition` for textarea elements with `adapterKey="textarea"`;
* `SelectAdapterDefinition` for select elements with `adapterKey="select"`;
* `FileInputAdapterDefinition` for file inputs with `adapterKey="input:file"`.

Each class supplies its matching rules, directly creates its adapters, and attaches its widget-specific events. The concrete definitions inherit diagnostic logging and the standard ValueHost submission helpers.

`ParsedTextEditorAdapterDefinition` is an abstract extension point for applications that parse editor text outside Jivs. It is not one of the built-in native HTML definitions.

A registered definition instance is shared by every element that selects it. It remains immutable after registration and does not retain element-specific, ValueHost-specific, or installation-specific state.

### Editor Installation

An editor element needs several related behaviors installed consistently:

* one adapter definition must be selected;
* one installation anchor must be resolved;
* the definition’s Text Value and Native Value capabilities must be examined;
* its DOM-to-Jivs event handlers must be attached;
* its field presentation must be selected and installed;
* the completed installation must be recorded on the anchor element.

`IEditorInstaller` coordinates these operations for one supplied element and `IFieldValueHost`. It does not discover editor elements or interpret SimpleDom attributes.

```ts
interface IEditorInstaller {
    install(
        valueHost: IFieldValueHost,
        element: IJivsDomElement,
        options?: EditorInstallOptions
    ): void;
}

interface EditorInstallOptions {
    adapterKey?: string | null;
    presentationName?: string | null;
    duringEdit?: boolean;
}
```

SimpleDom discovers editor elements, interprets their attributes, and calls `install()` with the resulting options. Applications may also call `install()` directly.

There is no separate operation that merely binds an adapter key. Supplying an explicit adapter key is part of complete editor installation.

#### Selecting a Definition and Resolving the Anchor

The installer must first obtain the definition because that definition determines how to resolve the installation anchor:

1. If `options.adapterKey` is a string, obtain the definition through `editorAdapterFactory.getDefinition()`.
2. Otherwise, call `editorAdapterFactory.findDefinition(valueHost, element)`.
3. If no definition can be selected, log the failure and throw.
4. Call `definition.resolveInstallationAnchor(valueHost, element)` to obtain the anchor.

An explicit adapter key bypasses priority-based matching. An unregistered explicit key is an installation failure.

For ordinary editors, the supplied element is also the anchor. A definition for a composite editor may return another element. For example, a radio definition may return the radio-group member on which that group was already installed.

After resolving the anchor, every remaining installation decision and mutation uses the anchor rather than the originally supplied element.

#### Completed-Installation Guard

The installer next examines:

```ts
anchor.jivsEditorAdapterDefinition
```

If it is already assigned, `install()` returns immediately. The existing value means that installation for the anchor completed successfully.

The no-op is unconditional. The installer does not compare the current `valueHost`, definition, adapter key, presentation name, `duringEdit` setting, or any other argument with those used by the completed installation.

Consequently, the first successful installation establishes the permanent configuration for that anchor’s DOM lifetime. Replacing the anchor element creates a new installation lifetime.

For a composite editor, resolving several supplied elements to the same installed anchor makes later calls no-ops. This allows a DOM scrape to call `install()` for every discovered element without installing the composite editor more than once.

#### Installing Adapter Capabilities

When the anchor has not completed installation, the installer examines its two adapter properties independently.

For `anchor.jivsTextValueAdapter`:

* `undefined` causes the installer to call `definition.createTextValueAdapter()` when the definition supplies that method;
* an omitted creation method produces `null`;
* the returned adapter or `null` is assigned to the anchor;
* an existing adapter instance or `null` is preserved.

The same rules apply independently to `anchor.jivsValueAdapter` and `definition.createValueAdapter()`.

This preserves the three-state contract:

| State            | Installer behavior                              |
| ---------------- | ----------------------------------------------- |
| `undefined`      | Examine and install the capability.             |
| Adapter instance | Preserve the installed implementation.          |
| `null`           | Preserve the decision that it is not available. |

A definition may install either adapter, both adapters, or neither adapter.

#### Attaching DOM-to-Jivs Behavior

After examining the adapter capabilities, the installer calls:

```ts
definition.attachToSendValues(
    valueHost,
    anchor,
    options
);
```

A completed installation never reaches this call again because the installer has already returned upon finding `anchor.jivsEditorAdapterDefinition`.

`duringEdit` controls intermediate Text Value handling:

* `undefined` or `false` installs only the definition’s completed-edit behavior;
* `true` permits the definition to attach an intermediate-edit event, such as `input`;
* intermediate Text Value and parsed Text Value events pass `duringEdit: true` to Jivs;
* Native Value submission does not support `duringEdit`, so native-only definitions ignore this option.

The option determines which DOM triggers are attached. It is not passed to callers as an unrestricted `FieldValueHostSetValueOptions` object.

The standard submission helpers always request validation. `EditorInstallOptions` does not expose Jivs options such as `validate`, `reset`, `skipIfUnchanged`, `injectedError`, `ensureEnabled`, `overrideDisabled`, `skipValueChangedCallback`, `disableParser`, or `disableFormatter`.

#### Installing the Editor Presentation

The editor installer invokes `IFieldPresentationInstaller` for `ElementRole.editor`.

It resolves the presentation name in this order:

1. If `options.presentationName` is a string or `null`, use it.
2. Otherwise, if `definition.defaultFieldPresentationName` is a string or `null`, use it.
3. Otherwise, pass `undefined` so the presentation installer can apply its universal editor fallback.

The values have distinct meanings:

| Value       | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| String      | Request that named presentation.                         |
| `null`      | Explicitly disable presentation for the editor.          |
| `undefined` | Allow the next fallback policy to select a presentation. |

When `anchor.jivsFieldPresentation` is `undefined`, the editor installer calls:

```ts
fieldPresentationInstaller.install(
    valueHost,
    anchor,
    ElementRole.editor,
    resolvedPresentationName
);
```

An existing presentation instance or explicit `null` is preserved.

A definition can therefore select a widget-specific presentation, such as one for a radio group, without requiring every definition to repeat the universal editor default.

#### Recording Completed Installation

`anchor.jivsEditorAdapterDefinition` is assigned only after the installation operations complete successfully:

```ts
anchor.jivsEditorAdapterDefinition = definition;
```

This assignment records completed installation. Once assigned, a later call resolving to the same anchor is an immediate no-op.

Conceptually:

```ts
public install(
    valueHost: IFieldValueHost,
    element: IJivsDomElement,
    options: EditorInstallOptions = {}
): void {
    const definition = this.selectDefinition(
        valueHost,
        element,
        options.adapterKey
    );

    const anchor = definition.resolveInstallationAnchor(
        valueHost,
        element
    );

    if (anchor.jivsEditorAdapterDefinition !== undefined) {
        return;
    }

    if (anchor.jivsTextValueAdapter === undefined) {
        anchor.jivsTextValueAdapter =
            definition.createTextValueAdapter?.(
                valueHost,
                anchor
            ) ?? null;
    }

    if (anchor.jivsValueAdapter === undefined) {
        anchor.jivsValueAdapter =
            definition.createValueAdapter?.(
                valueHost,
                anchor
            ) ?? null;
    }

    definition.attachToSendValues(
        valueHost,
        anchor,
        options
    );

    if (anchor.jivsFieldPresentation === undefined) {
        const presentationName =
            options.presentationName !== undefined
                ? options.presentationName
                : definition.defaultFieldPresentationName;

        this.fieldPresentationInstaller.install(
            valueHost,
            anchor,
            ElementRole.editor,
            presentationName
        );
    }

    anchor.jivsEditorAdapterDefinition = definition;
}
```

#### Installation Sequence

The complete installation sequence is:

1. Select the adapter definition for the supplied element.
2. Ask that definition to resolve the installation anchor.
3. Return immediately if the anchor already has `jivsEditorAdapterDefinition`.
4. Examine and install the anchor’s Text Value adapter capability.
5. Examine and install the anchor’s Native Value adapter capability.
6. Attach the definition’s DOM-to-Jivs event handling to the anchor.
7. Resolve and install the anchor’s editor presentation.
8. Assign the definition to `anchor.jivsEditorAdapterDefinition`, recording successful completion.

Once installation completes, subsequent calls may repeat definition selection and anchor resolution, but they return without modifying the anchor or attaching additional event handlers.

The installer may write Debug-level entries describing definition selection, anchor resolution, adapter creation, unavailable capabilities, completed-installation no-ops, presentation selection, and installation completion. Installation failures are logged before being thrown.

### Built-in Native Editor Definitions

Native HTML editors expose superficially similar APIs, but several have materially different value and event behavior. The built-in definitions provide those differences without requiring application code to configure common HTML controls individually.

All initial built-in definitions use the Text Value path. They read strings from the DOM and let Jivs perform parsing, formatting, and validation. Native Value adapters remain available for application-defined widgets whose primary value is not textual.

| Editor case              | Registered definition              | Text Value adapter                | Default event behavior                              |
| ------------------------ | ---------------------------------- | --------------------------------- | --------------------------------------------------- |
| Ordinary `input`         | `InputAdapterDefinition`           | `InputTextValueAdapter`           | `change`, plus `input` when `duringEdit` is enabled |
| Checkbox `input`         | `CheckboxAdapterDefinition`        | `CheckboxTextValueAdapter`        | `change`                                            |
| Native input radio group | `InputRadioGroupAdapterDefinition` | `InputRadioGroupTextValueAdapter` | One bubbling `change` handler on the group anchor   |
| `textarea`               | `TextAreaAdapterDefinition`        | `TextAreaTextValueAdapter`        | `change`, plus `input` when `duringEdit` is enabled |
| Single-value `select`    | `SelectAdapterDefinition`          | `SelectTextValueAdapter`          | `change`                                            |
| File `input`             | `FileInputAdapterDefinition`       | `FileInputTextValueAdapter`       | `change`                                            |

None of these definitions creates an `IDomValueAdapter`. During installation, `jivsValueAdapter` is therefore set to `null`.

#### Input Definition Registration

Each supported ordinary input type has its own adapter key and registered definition. This allows an application to override one input case without changing the others.

The factory registers a separate `InputAdapterDefinition` instance for each supported type:

```text
input:text
input:search
input:tel
input:url
input:email
input:password
input:number
input:range
input:date
input:month
input:week
input:time
input:datetime-local
input:color
```

The input type is passed to the definition’s constructor. Unless an adapter key is supplied explicitly, the constructor derives it using the standard `input:type` pattern.

Conceptually, built-in registration is:

```ts
const inputTypes = [
    "text",
    "search",
    "tel",
    "url",
    "email",
    "password",
    "number",
    "range",
    "date",
    "month",
    "week",
    "time",
    "datetime-local",
    "color"
];

for (const inputType of inputTypes) {
    editorAdapterFactory.register(
        new InputAdapterDefinition(inputType)
    );
}
```

`InputAdapterDefinition.matches()` requires an `HTMLInputElement` whose normalized `type` equals the definition’s configured input type. The type distinguishes registered definitions but does not change their adapter or event implementation.

All these definitions create `InputTextValueAdapter`. The adapter is type-agnostic: it reads and writes `HTMLInputElement.value`. Numeric, date, time, color, and other specialized browser input types do not cause `jivs-dom` to parse their values or adopt the browser’s interpretation as a Native Value.

#### Input Adapter Definition

`InputAdapterDefinition` illustrates the expected shape of a concrete definition:

```ts
class InputAdapterDefinition
    extends DomEditorAdapterDefinitionBase {

    private readonly inputType: string;

    public constructor(
        inputType: string,
        adapterKey?: string,
        priority: number = 0,
        defaultFieldPresentationName?:
            string | null
    ) {
        const normalizedInputType =
            inputType.toLowerCase();

        super(
            adapterKey ??
                `input:${normalizedInputType}`,
            priority,
            defaultFieldPresentationName
        );

        this.inputType = normalizedInputType;
    }

    public matches(
        _valueHost: IFieldValueHost,
        element: HTMLElement
    ): boolean {
        return element instanceof HTMLInputElement
            && element.type === this.inputType;
    }

    public createTextValueAdapter(
        _valueHost: IFieldValueHost,
        element: IJivsDomElement
    ): IDomTextValueAdapter {
        return new InputTextValueAdapter(
            this.requireInputElement(element)
        );
    }

    protected attachToSendValuesCore(
        valueHost: IFieldValueHost,
        element: IJivsDomElement,
        options: EditorInstallOptions
    ): void {
        const input =
            this.requireInputElement(element);

        input.addEventListener(
            "change",
            () => this.sendTextValue(
                valueHost,
                element,
                false
            )
        );

        if (options.duringEdit) {
            input.addEventListener(
                "input",
                () => this.sendTextValue(
                    valueHost,
                    element,
                    true
                )
            );
        }
    }

    private requireInputElement(
        element: IJivsDomElement
    ): HTMLInputElement {
        if (
            !(element instanceof HTMLInputElement)
            || element.type !== this.inputType
        ) {
            throw new Error(
                `Adapter definition '${this.adapterKey}' `
                + `requires input type '${this.inputType}'.`
            );
        }

        return element;
    }
}
```

The definition does not implement `createValueAdapter()`. The editor installer therefore records `null` in `jivsValueAdapter`.

`attachToSendValuesCore()` attaches the completed-edit `change` event in every installation. It additionally attaches the intermediate `input` event when `duringEdit` is enabled. The inherited public `attachToSendValues()` method provides diagnostic logging around this implementation.

#### Checkbox Adapter Definition

Checkboxes use a separate `CheckboxAdapterDefinition` registered with `adapterKey="input:checkbox"`. The ordinary `InputAdapterDefinition` does not select or configure checkboxes.

A checkbox remains on the Text Value path because `jivs-dom` cannot assume that the field’s Native Value is Boolean. The Text Value is passed through the field’s configured parser, which determines the appropriate Native Value type.

`CheckboxTextValueAdapter` maps the checked state to the checkbox element’s string value:

```ts
class CheckboxTextValueAdapter
    extends DomTextValueAdapterBase<HTMLInputElement> {

    public readTextValue(): string {
        return this.element.checked
            ? this.element.value
            : "";
    }

    public writeTextValue(
        textValue: string | undefined
    ): void {
        this.element.checked =
            textValue === this.element.value;
    }
}
```

This mapping is reciprocal:

* a checked checkbox reads as `element.value`;
* an unchecked checkbox reads as an empty string;
* writing `element.value` checks the checkbox;
* writing another string or `undefined` clears it.

Applications remain free to use a Native Value for checkboxes. For example, an application can register a higher-priority definition whose `matches()` requires both an `input[type="checkbox"]` and a Boolean field data type. That definition can create an `IDomValueAdapter` backed by `HTMLInputElement.checked` and submit through `setValue()`.

#### Native Input Radio Groups

A native radio group uses several `HTMLInputElement` instances to represent one Text Value. The built-in implementation treats an enclosing element as the logical editor and installation anchor. Value access queries its descendant radio inputs, while event handling, presentation, and ARIA state operate on the anchor.

```html
<div role="radiogroup">
    <label>
        First:
        <input
            type="radio"
            name="groupname"
            value="1"
        >
    </label>

    <label>
        Second:
        <input
            type="radio"
            name="groupname"
            value="2"
        >
    </label>

    <label>
        Third:
        <input
            type="radio"
            name="groupname"
            value="3"
        >
    </label>
</div>
```

The enclosing element, rather than one of its radio inputs, is passed to `IEditorInstaller.install()`.

This container-based approach also illustrates how applications can implement other composite editors, such as a dynamic list of textboxes that produces one delimited Text Value.

> If an application requires radio inputs without an enclosing installation element, it supplies its own Adapter Definition and Text Value adapter. `IDomEditorAdapterDefinition.resolveInstallationAnchor()` supports that use case, but `jivs-dom` does not provide the implementation.

##### Radio-Group Markup

The enclosing element must:

* contain all radio inputs belonging to the logical editor, including radios nested at any descendant level;
* have `role="radiogroup"`;
* when ARIA support is needed, have an accessible name supplied through `aria-label`, `aria-labelledby`, or an equivalent mechanism.

All descendant `input[type="radio"]` elements must belong to this logical editor and must use the same nonempty `name`.

These are markup requirements of the built-in implementation. `jivs-dom` does not query the group during installation to verify that it contains radios, that their names are nonempty, or that their names agree.

A labeled group can use markup such as:

```html
<div
    role="radiogroup"
    aria-labelledby="delivery-method-label"
>
    <span id="delivery-method-label">
        Delivery method
    </span>

    <label>
        <input
            type="radio"
            name="deliveryMethod"
            value="standard"
        >
        Standard
    </label>

    <div>
        <label>
            <input
                type="radio"
                name="deliveryMethod"
                value="express"
            >
            Express
        </label>
    </div>
</div>
```

##### Input Radio-Group Adapter Definition

`InputRadioGroupAdapterDefinition` represents radio groups constructed from native `input[type="radio"]` elements.

| Rule                      | Value                               |
| ------------------------- | ----------------------------------- |
| Default `adapterKey`      | `"input:radio-group"`               |
| Default matching selector | `"[role=\"radiogroup\"]"`           |
| Installation anchor       | The element supplied to `install()` |
| Text Value adapter        | `InputRadioGroupTextValueAdapter`   |
| Native Value adapter      | None                                |

The matching selector can be replaced through the constructor.

The relevant definition behavior is:

```ts
class InputRadioGroupAdapterDefinition
    extends DomEditorAdapterDefinitionBase
    implements IDomAriaEditorDefinition {

    private readonly matchingSelector: string;

    public constructor(
        matchingSelector:
            string = '[role="radiogroup"]',
        adapterKey:
            string = "input:radio-group",
        priority: number = 0,
        defaultFieldPresentationName?:
            string | null
    ) {
        super(
            adapterKey,
            priority,
            defaultFieldPresentationName
        );

        this.matchingSelector =
            matchingSelector;
    }

    public matches(
        _valueHost: IFieldValueHost,
        element: HTMLElement
    ): boolean {
        return element.matches(
            this.matchingSelector
        );
    }

    public createTextValueAdapter(
        _valueHost: IFieldValueHost,
        element: IJivsDomElement
    ): IDomTextValueAdapter {
        return new InputRadioGroupTextValueAdapter(
            element
        );
    }

    protected attachToSendValuesCore(
        valueHost: IFieldValueHost,
        element: IJivsDomElement,
        _options: EditorInstallOptions
    ): void {
        element.addEventListener(
            "change",
            () => this.sendTextValue(
                valueHost,
                element,
                false
            )
        );
    }

    public findAriaEditors(
        _root: HTMLElement,
        installationElement: IJivsDomElement
    ): Iterable<HTMLElement> {
        return [installationElement];
    }
}
```

`matches()` tests only the candidate installation element. It does not search beneath every candidate while the adapter factory is selecting a definition.

The inherited `resolveInstallationAnchor()` returns the supplied element. An application supporting radio groups without an enclosing installation element can replace the definition and override that method.

`attachToSendValuesCore()` attaches one `change` handler to the installation anchor. Every `change` event that bubbles to the anchor submits the adapter’s current Text Value. The handler does not inspect or filter the event target.

The `duringEdit` option has no effect. Applications that place other editable controls within the same anchor or require different event filtering can replace the definition.

##### Input Radio-Group Text Value Adapter

`InputRadioGroupTextValueAdapter` retains the installation anchor. It queries the anchor’s current descendants for `input[type="radio"]` whenever it reads or writes the Text Value.

```ts
class InputRadioGroupTextValueAdapter
    implements IDomTextValueAdapter {

    public constructor(
        private readonly anchor: IJivsDomElement
    ) {
    }

    public readTextValue():
        string | undefined {

        for (const radio of this.getRadios()) {
            if (radio.checked) {
                return radio.value;
            }
        }

        return undefined;
    }

    public writeTextValue(
        textValue: string | undefined
    ): void {
        let matched = false;

        for (const radio of this.getRadios()) {
            const shouldCheck =
                !matched &&
                textValue !== undefined &&
                radio.value === textValue;

            radio.checked = shouldCheck;

            if (shouldCheck) {
                matched = true;
            }
        }
    }

    private getRadios():
        HTMLInputElement[] {

        return Array.from(
            this.anchor.querySelectorAll<HTMLInputElement>(
                'input[type="radio"]'
            )
        );
    }
}
```

The implementation establishes these rules:

| Situation                           | Result                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| No radio is checked                 | `readTextValue()` returns `undefined`.                        |
| More than one radio is checked      | The first checked radio in DOM order supplies the Text Value. |
| `writeTextValue(undefined)`         | Every radio is unchecked.                                     |
| The string matches one radio        | That radio is checked and all others are unchecked.           |
| The string matches duplicate values | Only the first matching radio in DOM order is checked.        |
| The string matches no radio         | Every radio is unchecked.                                     |
| The string is `""`                  | The first radio whose value is `""` is checked.               |

The adapter does not retain the discovered radio elements. Radios added or removed after installation therefore participate in the next read or write automatically. The anchor-level event handler also receives changes from newly added radios through event bubbling.

##### Radio-Group Presentation and ARIA

The installation anchor is the editor’s presentation target. Its field presentation can apply validation-related CSS classes to the radio group as a whole instead of modifying each radio input.

The built-in definition does not require a radio-specific presentation. Normal presentation-name resolution remains in effect.

`InputRadioGroupAdapterDefinition.findAriaEditors()` returns only the installation anchor. Because the anchor has `role="radiogroup"`, the ARIA service applies group-level state there, including:

* `aria-required`;
* `aria-invalid`;
* `aria-errormessage`.

The ARIA service does not apply native `required` or duplicate validation-state attributes across the descendant radio inputs.

The definition does not add or validate the anchor’s `role`, accessible name, or other required markup. Applications using a different accessibility model can replace the definition.

#### Other Definition Keys

The other built-in definitions use these keys:

| Definition                         | Default `adapterKey` |
| ---------------------------------- | -------------------- |
| `CheckboxAdapterDefinition`        | `input:checkbox`     |
| `InputRadioGroupAdapterDefinition` | `input:radio-group`  |
| `TextAreaAdapterDefinition`        | `textarea`           |
| `SelectAdapterDefinition`          | `select`             |
| `FileInputAdapterDefinition`       | `input:file`         |

The built-in definitions are registered at a low priority so application definitions can match before them. An application may also replace a built-in registration under the same adapter key when it wants future explicit and automatic selection for that case to use the replacement definition.

#### Excluded and Deferred Elements

The initial built-in definitions do not support:

* `select[multiple]`, pending a Jivs collection-value contract;
* `contenteditable`, which remains an application-defined widget scenario;
* radio inputs without an enclosing radio-group installation anchor;
* custom ARIA radio widgets that do not use native `input[type="radio"]` descendants;
* button, submit, reset, and image inputs, as they are not editors;
* `button`, `output`, `meter`, and `progress` elements, as they are not editors;
* reading file contents.

Action and display elements are not editors. File support is limited to the browser-exposed string available from `HTMLInputElement.value`.

## Field Presentation Architecture

### Field Presentation Contracts

A field presentation translates one field’s current validation state into changes to one widget. Each installed presentation is an element-bound object that may retain presentation-specific state.

Presentation installation occurs after the `ValueHostsManager` and its `IFieldValueHost` instances have been created. This allows installation to apply the field’s current validation state immediately, regardless of whether preliminary validation has already run.

`FieldValidationDispatcher` locates each relevant consumer element, reads its installed `jivsFieldPresentation`, and invokes `apply()`.

Although `ValueHostValidationState` includes the group that caused validation, `FieldValidationDispatcher` does not perform group routing. A field presentation is already scoped to one `IFieldValueHost` and reflects that field's current state regardless of which validation group produced it.

#### Field Presentation Interface and Base Class

```ts
interface IFieldPresentation {
    apply(
        valueHost: IFieldValueHost,
        state: ValueHostValidationState
    ): void;
}

abstract class FieldPresentationBase<
    TElement extends HTMLElement = HTMLElement
> implements IFieldPresentation {

    public constructor(
        protected readonly element: TElement
    ) {
    }

    public abstract apply(
        valueHost: IFieldValueHost,
        state: ValueHostValidationState
    ): void;
}
```

An `IFieldPresentation` instance may retain its own state. Within `apply()`, `this` is the presentation instance; the target DOM element is available through `this.element` when the presentation derives from `FieldPresentationBase`.

The presentation retains its element but does not retain the `IFieldValueHost` or its validation state. Those values are supplied to each `apply()` call.

Applications may implement `IFieldPresentation` directly or derive from `FieldPresentationBase`.

#### Field Presentation Factory

The field presentation factory creates element-bound presentation instances from registered presentation names. It is consumed by the Field Presentation Installer.

```ts
type FieldPresentationCreator = (
    element: IJivsDomElement
) => IFieldPresentation;

interface IFieldPresentationFactory {
    register(
        presentationName: string,
        creator: FieldPresentationCreator
    ): void;

    setDefaultPresentationName(
        role: ElementRole | string,
        presentationName: string
    ): void;

    create(
        element: IJivsDomElement,
        role: ElementRole | string,
        presentationName?: string
    ): IFieldPresentation;
}
```

Presentation names and roles are open-ended strings. The built-in `ElementRole` values provide the standard role vocabulary, while applications may register presentations and defaults for custom roles.

`register()` associates a presentation name with a creator. Registering the same name again replaces its creator for future installations. Presentations already installed on elements are unaffected.

`setDefaultPresentationName()` associates a role with the presentation name used when `create()` receives no explicit name. For editors, `IEditorInstaller` first considers `EditorInstallOptions.presentationName`, then `IDomEditorAdapterDefinition.defaultFieldPresentationName`. Only when neither supplies a value does it pass `undefined`, allowing the factory to use the default registered for `ElementRole.editor`.

Assigning another default for the same role replaces the earlier string. The method does not require the named presentation to be registered at that time, allowing defaults and creators to be configured in either order.

The factory does not provide an operation for removing a role default after it has been assigned.

`create()` resolves the presentation name as follows:

1. When `presentationName` is supplied, use it directly.
2. Otherwise, obtain the default presentation name registered for `role`.
3. Resolve the creator registered under that name.
4. Invoke the creator with `element` and return the resulting IFieldPresentation instance.

If an explicit name is not registered, or an omitted name has no role default, the factory logs the failure and throws. A role default that identifies an unregistered presentation also logs and throws when creation is attempted.

Each successful call creates a new presentation instance for the supplied element. The factory does not retain created presentations or DOM elements.

`DomServices` exposes the replaceable factory used by the installer:

```ts
domServices.fieldPresentationFactory
```

This public access allows applications to register their presentations and replace built-in registrations or role defaults during setup.

Because the factory uses logging, it requires a reference to DomServices which has a reference to JivsServices.loggingService.

#### Field Presentation Installer

```ts
interface IFieldPresentationInstaller {
    install(
        valueHost: IFieldValueHost,
        element: IJivsDomElement,
        role: ElementRole | string,
        presentationName?:
            string | null
    ): IFieldPresentation | null;
}
```

The three possible `presentationName` values have distinct meanings:

| Value       | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| String      | Create the presentation registered under that name.      |
| `undefined` | Use the default presentation name registered for `role`. |
| `null`      | Explicitly disable field presentation for this element.  |

The installer is idempotent through `IJivsDomElement.jivsFieldPresentation`:

| Existing property value | Installer behavior                                             |
| ----------------------- | -------------------------------------------------------------- |
| `undefined`             | Perform presentation installation.                             |
| Presentation instance   | Preserve and return the existing instance without applying it. |
| `null`                  | Preserve and return `null` without attempting resolution.      |

When installation is required and `presentationName` is `null`, the installer assigns `null` to `element.jivsFieldPresentation` and returns `null` without calling the factory.

Otherwise, the installer:

1. Calls `fieldPresentationFactory.create()` with the element, role, and requested presentation name.
2. Applies the current field state:

```ts
presentation.apply(
    valueHost,
    valueHost.currentValidationState
);
```

3. Assigns the successfully initialized presentation to `element.jivsFieldPresentation`.
4. Returns the presentation.

Using `currentValidationState` allows presentation installation to occur before or after an application calls:

```ts
valueHost.validate({
    preliminary: true
});
```

When validation has not run, `currentValidationState` supplies the field’s initial neutral state. When validation has already run, the newly installed presentation immediately reflects the resulting state.

A later validation callback may apply the same state again. Presentation implementations must therefore tolerate repeated `apply()` calls.

If factory resolution, presentation creation, or the initial `apply()` call throws, installation logs and propagates the failure. The presentation property remains `undefined`, identifying that installation did not complete successfully.

Replacing the DOM element creates a new presentation lifetime. The replacement element begins with `jivsFieldPresentation === undefined` and must be installed separately.

### Built-in Field Presentations
> This section is a work in progress. Much of it is based on conversations that are unfinished. We'll be returning to it in a separate chat.

`jivs-dom` supplies field presentations for common validation visualizations. Applications can replace their registrations, select another presentation explicitly, or derive from the exported base classes.

Presentation code owns visual content and CSS state. It does not assign ARIA attributes. Dynamic accessibility state remains the responsibility of `AriaService`.

The initial presentation CSS will be supplied in one file:

```text
jivs-dom.css
```

The initial CSS definitions will be designed separately after the presentation contracts are finalized.

#### Invalid-State Presentations

Editors, labels, and field containers use separate presentations because their visual treatments are substantially different.

| Role      | Presentation name  | State class              |
| --------- | ------------------ | ------------------------ |
| Editor    | `invalidEditor`    | `jivs-invalid-editor`    |
| Label     | `invalidLabel`     | `jivs-invalid-label`     |
| Container | `invalidContainer` | `jivs-invalid-container` |

Each presentation toggles its state class when:

```ts
state.isValid === false
```

They share an exported invalid-state base class that accepts or otherwise defines the class to toggle. The base class is part of the public extensibility API so applications can create equivalent presentations for custom roles.

#### Required Indicator Presentation

A Required Indicator is installed as an `IFieldPresentation`. Its `apply()` implementation toggles the `jivs-required` class according to:

```ts
valueHost.required
```

The presentation assigns the persistent `jivs-required-indicator` class to identify its element without depending on a particular DOM discovery convention. It does not assign a visible `display` value. CSS hides an inactive Required Indicator:

```css
.jivs-required-indicator:not(.jivs-required) {
    display: none;
}
```

Separate CSS applies the desired appearance while the indicator is active:

```css
.jivs-required-indicator.jivs-required {
    /* visual styling */
}
```

This separates two CSS responsibilities:

* visibility when the indicator is inactive;
* appearance when the indicator is active.

The active rule should not assign `display`, because `jivs-dom` cannot predict whether the application expects the element to use inline, inline-block, flex, or another layout mode.

The presentation does not create or replace the indicator’s content. The application may supply `*`, the word “Required,” an icon, or other content in its markup.

#### Error Display Direction

Error displays require a more specialized design and will be completed in a focused presentation-design pass.

The intended developer experience is that the application supplies one installation element, provisionally:

```html
<span
    data-jivs-role="errors"
    data-jivs-presentation="...">
</span>
```

The selected presentation constructs the complete error-display widget. Depending on the presentation, that may include:

* an inline message container;
* an icon or other popup trigger;
* a popup container;
* a header;
* the generated Issue Found messages;
* a footer;
* other presentation-specific content.

The user should not need to mark up and register each internal part separately. Customization should normally require only presentation properties and CSS.

A presentation may create descendants, siblings, or another presentation-specific structure associated with its installation element. It may retain references to generated elements, retain generated identifiers, or use a known relationship such as a generated next sibling.

Non-popup structure may be created during installation and retained for the presentation’s lifetime. Popup structure may be created lazily. Once created, it also remains presentation-owned state for the rest of that lifetime.

#### Shared Issue-Display Construction

Field Error Displays and the Validation Summary need substantially the same HTML-construction machinery. Shared base behavior should support:

* selecting an HTML template;
* resolving template tokens;
* obtaining localized presentation text;
* generating Issue Found message HTML;
* assigning the resulting HTML;
* exposing issue state through CSS classes.

Field and form presentations then supply their different contexts:

* a Field Error Display can supply `{Label}`;
* a Validation Summary can supply `{Count}`.

The exact inheritance and helper-class structure remains to be designed.

#### Complete HTML Templates

Rather than prescribing separate header, message, and footer markup, the presentation should allow the application to supply the complete HTML within the generated container.

Two templates are anticipated:

* the normal template, including the multiple-issue case;
* an optional single-issue template.

When the single-issue template is blank or absent, the normal template is used.

Templates may establish any required HTML structure, CSS classes, and inline presentation details. Tokens use the existing PascalCase convention. Anticipated tokens include:

```text
{HeaderHtml}
{IssuesFound}
{FooterHtml}
{Label}
{Count}
```

Additional tokens may be introduced when the detailed design identifies a concrete need.

The complete template is structural HTML controlled by the developer. Human-readable static text used by the presentation must be localizable through `ErrorMessagesService`.

#### Token Content and Encoding

`{Label}` is plain dynamic text and must be HTML-encoded before insertion.

`{Count}` is a generated numeric value and can be inserted directly.

`{IssuesFound}` is deliberately inserted as HTML. Its error messages and dynamic token values have already passed through the existing message-generation and encoding pipeline. The resulting HTML may contain intentional markup. For example:

```text
The {Label} is required.
```

may become:

```html
The <span class="labelstyle">Book</span> is required.
```

The detailed design must preserve this distinction between trusted generated HTML and dynamic values that still require encoding.

#### Deferred Error-Display Decisions

The focused presentation-design work still needs to determine:

* the exact base classes and public configuration API;
* the final role name, including reconciliation of `errors` with the earlier singular `error` convention;
* how header and footer text and their Localization Keys are configured;
* whether issue-count selection requires rules beyond normal and single-issue templates;
* which tokens are supported by field and form presentations;
* the trust and encoding contract for localized HTML fragments;
* the initial inline, icon, tooltip, popup, and Validation Summary presentations;
* popup construction and interaction behavior;
* the state classes used by each presentation;
* the initial definitions in `jivs-dom.css`.

## Form Presentation Architecture

### Form Presentation Contracts

A form presentation translates the `ValueHostsManager` validation state into changes to one form-level consumer. Typical consumers include Validation Summaries and submit controls.

Form presentations are separate from field presentations because they receive an `IValueHostsManager` and `ValidationState` rather than an individual `IFieldValueHost` and `ValueHostValidationState`.

`FormValidationDispatcher` locates each relevant consumer element, reads its installed `IJivsDomElement.jivsFormPresentation`, and invokes `apply()` with the callback’s `IValueHostsManager` and complete `ValidationState`.

#### Form Presentation Interface and Base Class

```ts
interface IFormPresentation {
    apply(
        valueHostsManager: IValueHostsManager,
        state: ValidationState
    ): void;
}

abstract class FormPresentationBase<
    TElement extends IJivsDomElement =
        IJivsDomElement
> implements IFormPresentation {

    public respondToWildcardGroup: boolean =
        false;

    public constructor(
        protected readonly element: TElement
    ) {
    }

    public apply(
        valueHostsManager: IValueHostsManager,
        state: ValidationState
    ): void {
        const presentationGroup =
            this.element.jivsFormPresentationGroup;

        const presentationIsWildcard =
            this.isWildcardGroup(
                presentationGroup
            );

        const stateIsWildcard =
            this.isWildcardGroup(
                state.group
            );

        if (
            !presentationIsWildcard
            && stateIsWildcard
        ) {
            if (!this.respondToWildcardGroup) {
                return;
            }

            this.applyCore(
                valueHostsManager,
                valueHostsManager
                    .currentValidationState(
                        presentationGroup
                    )
            );
            return;
        }

        if (
            presentationIsWildcard
            !== stateIsWildcard
        ) {
            return;
        }

        if (
            !groupsMatch(
                presentationGroup,
                state.group
            )
        ) {
            return;
        }

        this.applyCore(
            valueHostsManager,
            state
        );
    }

    protected abstract applyCore(
        valueHostsManager: IValueHostsManager,
        state: ValidationState
    ): void;

    private isWildcardGroup(
        group: string | null | undefined
    ): boolean {
        return group === null
            || group === undefined
            || group === ""
            || group === "*";
    }
}
```

An `IFormPresentation` instance may retain presentation-specific state belonging to its element. The base class retains its element but does not retain the `IValueHostsManager` or a validation state. Those values are supplied to every `apply()` call.

`FormPresentationBase.apply()` owns the standard group-routing behavior. Derived presentations implement `applyCore()` to update their element after the base class has determined that the state applies.

Group routing is intentionally asymmetric:

| Presentation group                                  | Validation-state group | Result                                                                              |
| --------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| Same normalized group                               | Same group             | Call `applyCore()` with the supplied state.                                         |
| Specific group                                      | Wildcard               | Ignore unless `respondToWildcardGroup` is `true`.                                   |
| Specific group with `respondToWildcardGroup = true` | Wildcard               | Obtain the current state for the presentation’s group and pass it to `applyCore()`. |
| Wildcard                                            | Specific group         | Ignore.                                                                             |
| Different specific groups                           | Different groups       | Ignore.                                                                             |

In jivs-engine, the `groupsMatch()` function provides the established case-insensitive comparison. `null`, `undefined`, `""`, and `"*"` are treated as wildcard forms when determining the routing case.

When wildcard response is enabled for a group-specific presentation, the base class obtains:

```ts
valueHostsManager.currentValidationState(
    presentationGroup
);
```

The resulting group-specific state is passed intact to `applyCore()`. The base class does not create a replacement `ValidationState` or copy selected properties from the wildcard state.

`respondToWildcardGroup` defaults to `false`. It is presentation configuration rather than an installation option. A registered presentation creator may set this property, along with any other configurable presentation properties, before returning the instance. An application that needs different configurations registers different presentation names.

Applications may implement `IFormPresentation` directly instead of deriving from `FormPresentationBase`. A direct implementation receives every state supplied by the dispatcher and is responsible for its own group-routing policy.

### Form Presentation Factory

Form presentations use a factory separate from the field presentation factory.

```ts
type FormPresentationCreator = (
    element: IJivsDomElement
) => IFormPresentation;

interface IFormPresentationFactory {
    register(
        presentationName: string,
        creator: FormPresentationCreator
    ): void;

    setDefaultPresentationName(
        role: ElementRole | string,
        presentationName: string
    ): void;

    create(
        element: IJivsDomElement,
        role: ElementRole | string,
        presentationName?: string
    ): IFormPresentation | null;
}
```

Presentation names and roles are open-ended strings. The standard form roles are `ElementRole.summary` and `ElementRole.submit`.

`register()` associates a presentation name with a creator. Registering the same name again replaces its creator for future installations. Presentations already installed on elements are unaffected.

A creator constructs and configures the presentation before returning it. Configuration such as `respondToWildcardGroup` is therefore associated with the registered presentation name rather than supplied through `FormPresentationInstallOptions`.

`setDefaultPresentationName()` associates a role with the presentation name used when `create()` receives no explicit name. Assigning another default for the same role replaces the earlier string. The method does not require the presentation to be registered at that time, allowing defaults and creators to be configured in either order.

The factory does not provide an operation for removing a role default after it has been assigned.

`create()` resolves the presentation as follows:

1. When `presentationName` is supplied, use it directly.
2. Otherwise, obtain the default presentation name registered for `role`.
3. If the role has no default, return `null`.
4. Resolve the creator registered under the selected name.
5. Invoke the creator with `element` and return the resulting `IFormPresentation`.

An explicit name that is not registered logs and throws. A role default that identifies an unregistered presentation also logs and throws. In contrast, omitting the name when the role has no configured default is an expected no-presentation case and returns `null` without error.

Each successful call creates a new presentation instance for the supplied element. The factory does not retain created presentations or DOM elements.

`DomServices` exposes the replaceable form presentation factory:

```ts
domServices.formPresentationFactory
```

This factory has registrations and role defaults independent of `fieldPresentationFactory`.

### Form Presentation Installer

```ts
interface FormPresentationInstallOptions {
    presentationName?: string | null;
    group?: string;
}

interface IFormPresentationInstaller {
    install(
        valueHostsManager: IValueHostsManager,
        element: IJivsDomElement,
        role: ElementRole | string,
        options?: FormPresentationInstallOptions
    ): IFormPresentation | null;
}
```

The possible `options.presentationName` values have these meanings:

| Value       | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| String      | Create the presentation registered under that name.                |
| `undefined` | Use the default presentation registered for `role`, if one exists. |
| `null`      | Explicitly disable form presentation for this element.             |

`options.group` selects the validation group represented by the presentation. The value is preserved exactly as supplied:

| Supplied value | Stored value                 |
| -------------- | ---------------------------- |
| Omitted        | `undefined`                  |
| `"*"`          | `"*"`                        |
| `""`           | `""`                         |
| Named group    | Original spelling and casing |

The installer does not normalize the stored value. Group comparison and current-state caching apply the established group semantics when the value is used.

The installer is idempotent through `IJivsDomElement.jivsFormPresentation`:

| Existing property value | Installer behavior                                                 |
| ----------------------- | ------------------------------------------------------------------ |
| `undefined`             | Perform presentation installation.                                 |
| Presentation instance   | Preserve and return the existing instance and its installed group. |
| `null`                  | Preserve and return `null` without attempting resolution.          |

The first completed installation permanently binds both the presentation and its group to the element. Later installation calls ignore newly supplied options.

When `options.presentationName` is `null`, the installer assigns `null` to `element.jivsFormPresentation` and returns `null` without calling the factory. `jivsFormPresentationGroup` remains `undefined`.

Otherwise, the installer calls `formPresentationFactory.create()`. If the factory returns `null` because neither an explicit name nor a role default exists, the installer assigns `null` to `element.jivsFormPresentation` and returns `null`. The group remains unassigned.

When the factory creates a presentation, the installer performs these steps:

1. Assigns the requested group to `element.jivsFormPresentationGroup`.
2. Obtains the manager’s current validation state for that group.
3. Calls the presentation’s initial `apply()`.
4. Assigns the successfully initialized presentation to `element.jivsFormPresentation`.
5. Returns the presentation.

Conceptually:

```ts
const group = options?.group;

const presentation =
    formPresentationFactory.create(
        element,
        role,
        options?.presentationName
    );

if (presentation === null) {
    element.jivsFormPresentation = null;
    return null;
}

element.jivsFormPresentationGroup =
    group;

try {
    presentation.apply(
        valueHostsManager,
        valueHostsManager
            .currentValidationState(
                group
            )
    );

    element.jivsFormPresentation =
        presentation;

    return presentation;
}
catch (error) {
    delete element
        .jivsFormPresentationGroup;

    throw error;
}
```

Assigning the group before the initial `apply()` allows `FormPresentationBase` to read it from the element while performing routing.

The initial call does not invoke validation or notify validation callbacks. `currentValidationState(group)` returns the ValueHostsManager’s cached current state for that group or creates it when no cached state exists.

A later validation callback may apply the same effective state again. Form presentations must therefore tolerate repeated `apply()` calls.

If factory resolution, presentation creation, or the initial `apply()` call throws, installation logs and propagates the failure. Both `jivsFormPresentation` and `jivsFormPresentationGroup` remain `undefined`, identifying that installation did not complete successfully.

Replacing the DOM element creates a new presentation lifetime. The replacement element begins with both form-presentation properties `undefined` and must be installed separately.

### Form Validation Dispatcher

`FormValidationDispatcher` does not evaluate validation groups. Group-routing policy belongs to each form presentation.

For every discovered form-level consumer, the dispatcher:

1. Reads `element.jivsFormPresentation`.
2. Skips the element when the property is `undefined` or `null`.
3. Calls the installed presentation with the callback’s `IValueHostsManager` and complete `ValidationState`.

Conceptually:

```ts
const presentation =
    element.jivsFormPresentation;

if (presentation) {
    presentation.apply(
        valueHostsManager,
        state
    );
}
```

The dispatcher does not compare group names, call `groupsMatch()`, filter `state.issuesFound`, replace the state, or obtain another state from the manager.

Presentations derived from `FormPresentationBase` receive the standard routing behavior described earlier. Direct `IFormPresentation` implementations determine for themselves whether and how to respond.

The dispatcher does not call `IDomAriaService`. The shared ARIA service remains limited to dynamic field state through `applyFieldState()`. Form-level accessibility that is static or specific to one presentation remains the responsibility of the markup and concrete presentation.

### SimpleDom Form Presentation Selection

`jivs-simpledom` discovers both `data-jivs-role="summary"` and `data-jivs-role="submit"` elements whether or not they declare `data-jivs-presentation`.

When `data-jivs-presentation` is present, its value supplies `FormPresentationInstallOptions.presentationName`. When it is absent, SimpleDom leaves that option `undefined` so the form presentation factory can use the role-specific default.

The `data-jivs-group` attribute supplies `FormPresentationInstallOptions.group`. When the attribute is absent, the group is `undefined`. SimpleDom preserves the supplied attribute value without normalizing its casing or wildcard form.

Both Validation Summaries and submit-role elements use the same selection rules:

* an explicit presentation name takes precedence;
* otherwise, the form presentation factory consults the default for that role;
* when the role has no default, installation records `jivsFormPresentation = null` and leaves the element untouched.

### Built-in Form Presentations

The built-in configuration:

* registers `validationSummary` and assigns it as the default presentation for `ElementRole.summary`;
* registers `disableSubmit` as an available presentation;
* does not assign a default presentation for `ElementRole.submit`.

Consequently, a Validation Summary receives the standard summary presentation unless it requests another one. A submit-role element without an explicit or application-configured default presentation remains untouched. Submit-role elements are not limited to buttons, and additional submit presentations may implement other approaches.

The built-in `validationSummary` registration leaves `respondToWildcardGroup` at its default value of `false`. Applications that want a group-specific summary to respond when wildcard validation occurs can register another presentation name whose creator enables the property.

Applications may register additional form presentations and may assign their own default for either role. The detailed HTML, interaction, group-display policy, and CSS design of the initial Validation Summary and submit presentations remain part of the focused presentation-design work.

## Built-in Form Presentations

> PENDING: Detailed implementation design for the built-in Validation Summary and submit presentations is deferred.

## Issues Found Formatter Service

`jivs-dom` provides reusable formatting of `IssueFound` objects through `IIssuesFoundFormatterService`. The service produces either prepared HTML for DOM presentations or plain text for consumers such as native browser tooltips and ARIA-only content.

This service is distinct from the jivs-engine `ErrorMessagesService`. The engine service prepares an issue’s message, including message-token resolution. The DOM service formats already-prepared messages for presentation.

### Service Contract

```ts
interface IIssuesFoundFormatterService {
    buildAsHtml(
        issues: IssueFound[],
        useSummaryMessage?: boolean
    ): string;

    buildAsText(
        issues: IssueFound[],
        useSummaryMessage?: boolean,
        separator?: string
    ): string;
}
```

When `useSummaryMessage` is `false` or omitted, the formatter uses `IssueFound.errorMessage`. When it is `true`, the formatter uses `IssueFound.summaryMessage` when supplied and otherwise falls back to `IssueFound.errorMessage`.

The interface does not prescribe an HTML structure, issue ordering, filtering policy, metadata attributes, text separator, or internal conversion technique. Applications may replace the service with an implementation that constructs its content differently.

`DomServices` exposes the replaceable service:

```ts
domServices.issuesFoundFormatter
```

### Abstract Base Class

`IssuesFoundFormatterServiceBase` provides reusable utilities without prescribing how a subclass implements the two public build operations.

```ts
abstract class IssuesFoundFormatterServiceBase
    implements IIssuesFoundFormatterService {

    public abstract buildAsHtml(
        issues: IssueFound[],
        useSummaryMessage?: boolean
    ): string;

    public abstract buildAsText(
        issues: IssueFound[],
        useSummaryMessage?: boolean,
        separator?: string
    ): string;

    public static htmlToText(
        html: string
    ): string;

    protected orderIssuesFound(
        issues: IssueFound[]
    ): IssueFound[];

    protected buildIssueAsHtml(
        tagName: keyof HTMLElementTagNameMap,
        issue: IssueFound,
        useSummaryMessage: boolean
    ): string;

    protected buildErrorCodeAttribute(
        issue: IssueFound,
        attributeName?: string
    ): string;

    protected buildSeverityAttribute(
        issue: IssueFound,
        attributeName?: string
    ): string;

    protected retrieveMessage(
        issue: IssueFound,
        useSummaryMessage: boolean
    ): string;

    protected retrieveSeverityName(
        severity:
            ValidationSeverity | undefined
    ): string;
}
```

Applications may derive from this class and use any combination of its utilities. They may instead implement `IIssuesFoundFormatterService` directly when the base behavior is not useful.

The base class retains no formatting state and does not modify supplied `IssueFound` objects or arrays.

#### Issue Ordering

`orderIssuesFound()` provides an override point for subclasses that need a particular issue order. The base implementation returns the supplied array unchanged.

An override must not reorder or otherwise modify the supplied array. When changing the order, it returns a separate array:

```ts
protected orderIssuesFound(
    issues: IssueFound[]
): IssueFound[] {
    return [...issues].sort(
        this.compareIssues
    );
}
```

The standard formatter calls `orderIssuesFound()` before generating either HTML or text. A subclass can therefore retain the standard output behavior while replacing only its ordering policy.

#### Message Retrieval

`retrieveMessage()` implements the established `useSummaryMessage` behavior:

* `false` selects `errorMessage`;
* `true` selects `summaryMessage` and falls back to `errorMessage`.

#### Metadata Attributes

`buildErrorCodeAttribute()` returns a complete HTML attribute without leading whitespace. Its default attribute name is `data-error-code`.

```html
data-error-code="RequireText"
```

The method uses the `encodeHtml()` function supplied by jivs-engine to encode the attribute value. `jivs-dom` does not duplicate or re-export that function.

When `IssueFound.errorCode` is missing, the attribute value is an empty string:

```html
data-error-code=""
```

A caller may supply another attribute name while retaining the prescribed value handling.

`buildSeverityAttribute()` follows the same convention. Its default name is `data-severity`, and it delegates value selection to `retrieveSeverityName()`.

```html
data-severity="warning"
```

`retrieveSeverityName()` returns:

| Source severity              | Result      |
| ---------------------------- | ----------- |
| Missing                      | `"error"`   |
| `ValidationSeverity.Error`   | `"error"`   |
| `ValidationSeverity.Warning` | `"warning"` |
| `ValidationSeverity.Severe`  | `"severe"`  |

The lookup used by `retrieveSeverityName()` is a module-private readonly `severityNames` array. Subclasses can override the method without receiving a mutable lookup array.

#### One-Issue HTML

`buildIssueAsHtml()` combines the two metadata attributes with the selected message. The attribute builders return complete attribute strings without leading whitespace; `buildIssueAsHtml()` joins them using single spaces.

For example:

```html
<span data-error-code="RequireText" data-severity="error">The First name requires a value.</span>
```

The selected message is inserted as prepared HTML rather than encoded as plain text. This preserves markup produced during message-token resolution, such as:

```html
The <span class="token label">First name</span> is invalid.
```

The established message-token resolver is responsible for HTML-encoding replacement values before adding token markup. The formatter separately passes `errorCode` through the engine’s `encodeHtml()` function because the value is inserted into an HTML attribute.

#### HTML-to-Text Conversion

`htmlToText()` is a public static utility that converts arbitrary prepared HTML into plain text. It assigns the HTML to a detached DOM element and returns the element’s `textContent`, or an empty string when `textContent` is `null`.

For example:

```html
The <span class="token label">First name</span> is invalid.
```

becomes:

```text
The First name is invalid.
```

The utility can be used without creating a formatter instance:

```ts
IssuesFoundFormatterServiceBase.htmlToText(
    html
);
```

### Standard Implementation

`IssuesFoundFormatterService` is the default implementation:

```ts
class IssuesFoundFormatterService
    extends IssuesFoundFormatterServiceBase
```

It calls `orderIssuesFound()` and then formats every returned issue without additional filtering or deduplication. Because the base ordering implementation returns the supplied array unchanged, the standard formatter preserves the original issue order.

The standard implementation leaves the supplied array and `IssueFound` objects unchanged.

#### Standard HTML Output

`buildAsHtml()` uses these structures:

| Issue count | Result                                       |
| ----------- | -------------------------------------------- |
| Zero        | An empty string                              |
| One         | One `<span>` containing the selected message |
| Multiple    | A `<ul>` containing one `<li>` per issue     |

Every generated `<span>` or `<li>` includes both standard metadata attributes.

One issue produces:

```html
<span
    data-error-code="RequireText"
    data-severity="error">
    The First name requires a value.
</span>
```

Multiple issues produce:

```html
<ul>
    <li
        data-error-code="RequireText"
        data-severity="error">
        The First name requires a value.
    </li>
    <li
        data-error-code="UnusualValue"
        data-severity="warning">
        This value is unusual.
    </li>
</ul>
```

The metadata belongs to each issue element rather than the enclosing `<ul>`.

#### Standard Text Output

`buildAsText()` calls `orderIssuesFound()`, retrieves each returned issue’s selected message, converts it through `htmlToText()`, and joins the resulting strings.

The default separator is:

```text
 • 
```

A caller may supply another plain-text separator, including an empty string:

```ts
issuesFoundFormatter.buildAsText(
    issues,
    false,
    "\n"
);
```

The separator is already plain text and is not passed through `htmlToText()`. An empty issue array produces an empty string.

## ARIA Service

ARIA support is an optional, replaceable `DomServices` child service. Setting `DomServices.ariaService` to `null` disables all Jivs-managed ARIA work. The module does not attempt to detect whether assistive technology is active.

The ARIA service owns the accessibility attributes managed by Jivs. Its responsibilities include:

- fixed accessibility semantics established during installation;
- required state obtained from the `IFieldValueHost`;
- validation state applied after field presentations have run;
- the relationship between an editor and its separate error-message element.

The standard service manages an editor or another element representing it, a separate error-message element, a Validation Summary, a Required Indicator, and editor-specific structures such as a radio-group container.

Labels, general field containers, and buttons do not have standard Jivs-managed ARIA behavior. The developer remains responsible for their accessibility, including accessible names and relationships Jivs cannot infer.

An Editor Adapter Definition provides editor-specific ARIA support by implementing `IDomAriaEditorDefinition`. The definition identifies the element or elements representing its editor to assistive technology and can supply fixed accessibility requirements for its editor model.

ARIA processing remains independent of visual presentation. Presentations own visual content and styling. The ARIA service discovers its own targets and owns the accessibility attributes described here.

### Managed Accessibility Attributes

This table defines the attributes written by the standard ARIA service. Later sections explain target discovery and special cases without repeating these assignment rules.

| Attribute | Applied during | Target element | Purpose | Presence and value | Comments |
| --- | --- | --- | --- | --- | --- |
| `role="status"` | Installation — fixed | Validation Summary | Makes summary updates advisory live-region content. | Assigned when `role` is absent. | Implies `aria-live="polite"` and `aria-atomic="true"`. An existing role is preserved. |
| `aria-atomic="true"` | Installation — fixed | Validation Summary | Requests announcement of the complete summary when its content changes. | Assigned when `aria-atomic` is absent. | Assigned explicitly even though `role="status"` implies it. An existing value is preserved. |
| `aria-hidden="true"` | Installation — fixed | Required Indicator | Prevents the visual indicator from duplicating the required state communicated by the editor. | Assigned when `aria-hidden` is absent. | The Required Indicator presentation controls visual state but does not assign this attribute. |
| `role="radiogroup"` | Installation — fixed | Radio-group editor anchor | Identifies the container as representing one radio-group value and makes it the target for group-level ARIA state. | Requested by `InputRadioGroupAdapterDefinition` and assigned when `role` is absent. | An existing role is preserved. The developer remains responsible for the group’s accessible name. |
| `required` | Field-state synchronization — dynamic | Native `input`, `select`, or `textarea` supporting required semantics | Uses the control’s native required behavior and accessibility semantics. | Present when `valueHost.required` is `true`; removed otherwise. | Determined by field configuration rather than `ValueHostValidationState`. `aria-required` is not also assigned. |
| `aria-required="true"` | Field-state synchronization — dynamic | ARIA editor target without equivalent native required semantics | Communicates that the represented value is required. | Assigned when `valueHost.required` is `true`; removed otherwise. | Used on the standard radio-group anchor. A custom definition returning individual native radios may use native `required` instead. |
| `aria-invalid="true"` | Field-state synchronization — dynamic | Each resolved ARIA editor target | Communicates that the editor’s current value is invalid. | Assigned when `state.isValid === false`; removed when valid. | Applied even when no eligible error-message element exists. |
| `aria-errormessage="{id}"` | Field-state synchronization — dynamic | Each resolved ARIA editor target | Associates an invalid editor with its separate error-message element. | Assigned while invalid when an eligible error-message element is available; removed otherwise and whenever valid. | A radio group uses its group anchor rather than duplicating the attribute on descendant radio inputs. |
| `id="{generatedId}"` | Field-state synchronization — fixed once assigned | Selected error-message element | Supplies the target required by `aria-errormessage` when the developer did not provide an ID. | Assigned when the selected element lacks a nonempty ID and the relationship is needed. | The fallback follows `{containerIdentifier}_{elementIdentifier}_ariaerror`. A developer-supplied ID is preserved. |

### Error-Message Containment and Selection

`aria-errormessage` always references an element separate from the editor. That element must have a unique ID, contain the error-message text, and remain available to assistive technology.

Jivs supports two alternatives:

| Error-message element | When to use it | Content owner |
| --- | --- | --- |
| Accessible Field Error Display | The visible display remains in the accessibility tree whenever it contains an error. | Field Error Display presentation |
| Dedicated ARIA error-message element | The visible display may be hidden by a popup, tooltip, `display: none`, `visibility: hidden`, or `aria-hidden="true"`. | ARIA service |

#### Selection Method

`AriaServiceBase.applyFieldState()` calls the subclass implementation of:

```ts
protected abstract findFieldElements(
    root: HTMLElement,
    valueHost: IFieldValueHost
): IFieldAriaElementAnchors;
```

The returned object identifies the selected error-message element and its content owner:

```ts
interface IFieldAriaElementAnchors {
    readonly editorAnchor:
        IJivsDomElement | null;

    readonly errorMessageElement:
        HTMLElement | null;

    readonly errorMessageContentOwner:
        'presentation' | 'ariaService' | null;
}
```

The concrete implementation supplied by `jivs-simpledom` is `SimpleDomAriaService`. Its `findFieldElements()` method performs fresh queries below `root` using the field’s element identifier.

For the error-message element, `SimpleDomAriaService.findFieldElements()` applies this precedence:

1. Select the field’s `data-jivs-role="error"` element when it declares `data-aria-errormessage="true"`. Return `"presentation"` as its content owner.
2. Otherwise, select the field’s `data-jivs-role="aria-error"` element. Return `"ariaService"` as its content owner.
3. When neither exists, return `null` for both error-message properties.

Selection occurs during every `applyFieldState()` operation. The service does not retain the selected element between calls.

#### Accessible Field Error Display

A Field Error Display signals that it is eligible to serve as the error-message element according to the DOM implementation’s discovery convention.

In SimpleDom:

```html
<div
    id="first-name-errors"
    data-field="FirstName"
    data-jivs-role="error"
    data-aria-errormessage="true">
</div>
```

The Field Error Display presentation owns this element’s content. The ARIA service may assign its missing ID and reference it from the editor, but it never writes or clears its content.

#### Dedicated ARIA Error-Message Element

When the visible Field Error Display is not eligible, the developer supplies a dedicated element:

```html
<span
    id="first-name-aria-errors"
    data-field="FirstName"
    data-jivs-role="aria-error"
    class="jivs-visually-hidden">
</span>
```

The dedicated element:

- has no field presentation;
- remains in the accessibility tree;
- is visually hidden by the published `jivs-visually-hidden` class;
- receives plain-text error content from the ARIA service;
- is cleared by the ARIA service when the field becomes valid.

The published class hides the element visually without removing it from the accessibility tree:

```css
.jivs-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

SimpleDom presentation installation and presentation dispatch exclude the `aria-error` role.

When the dedicated element is selected, `AriaServiceBase` builds its plain-text content with:

```ts
domServices
    .issuesFoundFormatter
    .buildAsText(
        state.issuesFound ?? []
    );
```

The developer should supply the selected element’s ID. When it is absent, `AriaServiceBase` assigns:

```text
{containerIdentifier}_{elementIdentifier}_ariaerror
```

The service obtains the container identifier through the `ValueHostsManager` publicly referenced by the `IFieldValueHost`. It converts identifier text as necessary to produce a valid DOM ID.

### Public Service Contract

The service retains the field-state operation:

```ts
interface IDomAriaService {
    applyFieldState(
        root: HTMLElement,
        valueHost: IFieldValueHost,
        state: ValueHostValidationState
    ): void;
}
```

An installation-time operation will be added for the fixed attributes identified in the table. Its API and the corresponding `IDomAriaEditorDefinition` additions remain intentionally deferred.

The field validation dispatcher resolves `root` before calling `applyFieldState()`. When `ValueHostsManager.getContainerIdentifier()` supplies an identifier, the dispatcher resolves it to an `HTMLElement`. Otherwise, `root` is `document.body`.

When a configured container identifier cannot be resolved, the dispatcher logs the failure and performs no presentation or ARIA work. It does not fall back to `document.body`, where it could affect a matching field belonging to another form.

The dispatcher first invokes all installed field presentations and then calls:

```ts
domServices.ariaService?.applyFieldState(
    root,
    valueHost,
    state
);
```

This order ensures that presentation-owned error content is current before the ARIA service establishes a relationship to it.

The service receives `IDomServices` when it is created, giving it access to required sibling services.

The service does not retain `root`, the `IFieldValueHost`, a `ValueHostsManager`, a discovered DOM element, or an element collection after an operation returns.

### AriaServiceBase

`jivs-dom` exports `AriaServiceBase` as the standard reusable implementation and extension point. It implements `IDomAriaService`, the standard attribute policy, error handling, and use of sibling `DomServices` services.

Subclasses supply field discovery for their markup convention:

```ts
abstract class AriaServiceBase
    implements IDomAriaService {

    public applyFieldState(
        root: HTMLElement,
        valueHost: IFieldValueHost,
        state: ValueHostValidationState
    ): void;

    protected abstract findFieldElements(
        root: HTMLElement,
        valueHost: IFieldValueHost
    ): IFieldAriaElementAnchors;
}
```

`findFieldElements()` receives the query root and the `IFieldValueHost`, including access to `getElementIdentifier()`. It returns semantic results rather than prescribing selectors, attributes, or element relationships.

`editorAnchor` identifies the installed editor element discovered for the field. It owns the selected `jivsEditorAdapterDefinition` and provides the starting point for editor-specific ARIA target resolution. It may also be the final ARIA target.

When `editorAnchor` is not `null`, `AriaServiceBase` reads its `jivsEditorAdapterDefinition`. When the definition also implements `IDomAriaEditorDefinition`, the base class calls:

```ts
definition.findAriaEditors(
    root,
    editorAnchor
);
```

The returned elements are the targets for the dynamic editor attributes identified in the table.

When the definition does not implement `IDomAriaEditorDefinition`, the editor anchor is the single ARIA target.

This delegation permits a widget to select a native input, a role-bearing custom control, a containing element, or multiple controls without requiring presentation and ARIA discovery to use the same elements.

The built-in input, textarea, select, and file definitions return their editor anchor. `InputRadioGroupAdapterDefinition` returns its radio-group installation anchor.

### Field-State Synchronization

`AriaServiceBase.applyFieldState()` performs these operations:

1. Calls `findFieldElements()` to locate the editor anchor and select an error-message element.
2. Uses the editor’s `IDomAriaEditorDefinition`, when available, to resolve the actual ARIA editor targets.
3. Prepares the selected error-message element when the field is invalid.
4. Synchronizes the dynamic attributes defined in the managed-attributes table.
5. Clears ARIA-service-owned error content when the field becomes valid.

The editor cannot serve as its own error-message element. The absence of an eligible error-message element does not prevent the service from applying `aria-invalid`, `required`, or `aria-required`.

Required state comes from `IFieldValueHost.required`, not from `ValueHostValidationState`.

Native controls use `required` when they support it. ARIA controls without an equivalent native semantic use `aria-required`.

The built-in radio-group definition returns the containing editor anchor as its ARIA target. The service therefore applies `aria-required`, `aria-invalid`, and `aria-errormessage` to that anchor rather than duplicating the state across descendant radio inputs.

A custom radio definition without a containing ARIA target may return the individual native radio inputs. In that model, applying native `required` to each returned input preserves native radio-group required behavior.

### Installation-Time Responsibilities

The fixed rows in the managed-attributes table are established during element installation.

The ARIA service assigns a fixed attribute only when the element does not already have that attribute. It preserves explicit developer-supplied values.

The Validation Summary presentation continues to own the summary’s content. `role="status"` provides polite live-region behavior, while `aria-atomic="true"` requests announcement of the complete updated summary. Application code owns any deliberate focus movement after a failed submission.

The Required Indicator presentation controls the indicator’s visual state. The ARIA service supplies `aria-hidden="true"` because the editor already communicates whether the value is required.

`InputRadioGroupAdapterDefinition` requests `role="radiogroup"` for its installation anchor. The ARIA service applies the role, while the developer remains responsible for the group’s accessible name.

An Editor Adapter Definition may request other fixed accessibility attributes required by its editor model. The definition describes those requirements but does not assign the attributes itself.

The API used to perform these installation-time responsibilities will be defined separately.

### Failure Handling and Custom Implementations

`AriaServiceBase` catches and logs failures in field discovery, editor-target resolution, message formatting, or individual element updates. It continues with later targets when possible and does not allow an ARIA failure to interrupt validation or presentation.

`jivs-simpledom` supplies `SimpleDomAriaService` because it owns the `data-field`, `data-jivs-role`, and ARIA marker conventions.

An application using `jivs-dom` directly can subclass `AriaServiceBase` and implement `findFieldElements()` for its own markup while retaining the standard attribute policy. It may instead replace the complete `IDomAriaService` when it requires a different policy.

All discovery occurs below the operation’s supplied root. Implementations must not retain discovered elements, collections, or DOM subtrees between calls.
