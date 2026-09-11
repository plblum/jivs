# Jivs-DOM Design

This document defines the API to implement for `jivs-dom`. It is derived from [Planning Jivs-DOM](Planning%20Jivs-DOM.md), which retains the exploration, alternatives, and design rationale.

The design is intentionally framework-independent. `jivs-dom` supplies reusable DOM behavior. `jivs-simpledom` supplies attribute scanning and chooses installation anchors from its HTML conventions.

## D01 Design Principles

- Services in `DomServices` are configured during application setup and retain no form or element references.
- Installed adapters are created per element and may own state associated with that element.
- Adapters may use `this` for their bound element.
- Adapters do not retain `IFieldValueHost` or `IValueHostsManager`; those are operation parameters.
- Dispatchers are created per callback attachment/configuration and may own configuration-specific state.
- DOM elements are the stateful installation surface.
- Public adapter properties are visible and replaceable through TypeScript interfaces.

## D02 DomServices

`DomServices` is the root facade for the module. It is installed onto `JivsServices` through `ModuleServicesInstaller`, using a module-owned `domServices` property.

```ts
class DomServices {
    public constructor(
        public readonly jivsServices: IJivsServices
    );

    public get elementResolver(): IDomElementResolver;
    public set elementResolver(
        value: IDomElementResolver
    );

    public get callbacks(): DomServicesCallbacks;
    public set callbacks(
        value: DomServicesCallbacks
    );

    public get textValueInstaller(): ITextValueInstaller;
    public set textValueInstaller(
        value: ITextValueInstaller
    );

    public get valueInstaller(): IValueInstaller;
    public set valueInstaller(
        value: IValueInstaller
    );

    public get fieldPresentationInstaller():
        IFieldPresentationInstaller;
    public set fieldPresentationInstaller(
        value: IFieldPresentationInstaller
    );

    public get formPresentationInstaller():
        IFormPresentationInstaller;
    public set formPresentationInstaller(
        value: IFormPresentationInstaller
    );
}
```

Each property has a default implementation and may be replaced after construction. Factories are owned by or injected into their installers and are not separate public `DomServices` properties unless a future shared-capability requirement justifies it.

## D03 Element Resolution

```ts
interface IDomElementResolver {
    getElement(
        valueHost: IFieldValueHost,
        role: ElementRole | string,
        pattern?: string
    ): IJivsDomElement | null;
}
```

The Element Identifier supplies the query syntax. The resolver uses `querySelector()` and the requested role to find the appropriate field consumer. `jivs-simpledom` supplies the role-specific selector convention.

```ts
enum ElementRole {
    editor = 'editor',
    label = 'label',
    container = 'container',
    required = 'required',
    error = 'error',
    summary = 'summary',
    submit = 'submit'
}
```

The role vocabulary is standard and string-valued. Custom roles remain possible.

## D04 Installed Element Contract

```ts
interface IJivsDomElement extends HTMLElement {
    jivsTextValueAdapter?:
        IDomTextValueAdapter | null;

    jivsValueAdapter?:
        IDomValueAdapter | null;

    jivsFieldPresentation?:
        IFieldPresentation | null;

    jivsFormPresentation?:
        IFormPresentation | null;
}
```

Each property has three meaningful states:

```text
undefined -> not examined; an installer may attempt resolution
instance  -> installed and available to a dispatcher
null      -> examined but unavailable; do not retry automatically
```

An adapter instance is attached only to the element supplied to its installer. A grouped adapter may operate on companion elements, but the dispatcher always resolves the representative element that owns the adapter.

## D05 Adapter Contracts

```ts
interface IDomTextValueAdapter {
    readTextValue(): string;

    writeTextValue(
        textValue: string
    ): void;
}

interface IDomValueAdapter {
    readValue(): unknown;

    writeValue(
        value: unknown
    ): void;
}
```

Adapters are per-element objects. The current Jivs context is supplied by the dispatcher or installer operation rather than retained as adapter state.

Field and form presentations are separate:

```ts
interface IFieldPresentation {
    apply(
        valueHost: IFieldValueHost,
        state: ValueHostValidationState
    ): void;
}

interface IFormPresentation {
    apply(
        valueHostsManager: IValueHostsManager,
        state: ValidationState
    ): void;
}
```

## D06 Installers

The public installer services are separate and replaceable:

```ts
interface ITextValueInstaller {
    install(
        element: IJivsDomElement,
        valueHost: IFieldValueHost,
        options?: TextValueInstallOptions
    ): IDomTextValueAdapter | null;
}

interface IValueInstaller {
    install(
        element: IJivsDomElement,
        valueHost: IFieldValueHost,
        options?: ValueInstallOptions
    ): IDomValueAdapter | null;
}
```

Presentation installation uses separate field and form methods because the Jivs context differs:

```ts
interface IFieldPresentationInstaller {
    install(
        element: IJivsDomElement,
        role: ElementRole | string,
        presentationName: string | null | undefined,
        valueHost: IFieldValueHost | null | undefined
    ): IFieldPresentation | null;
}

interface IFormPresentationInstaller {
    install(
        element: IJivsDomElement,
        role: ElementRole | string,
        presentationName: string | null | undefined,
        valueHostsManager:
            IValueHostsManager | null | undefined
    ): IFormPresentation | null;
}
```

Presentation names are open-ended strings. The role is required and participates in factory resolution; the presentation name may be absent so the role can select a default.

When the relevant `ValueHost` or `ValueHostsManager` is supplied, installation applies the initial presentation using a neutral validation state. When it is `null` or `undefined`, installation attaches the presentation without invoking it. Installation does not validate values. `validate({ preliminary: true })` is a later application decision.

## D07 Native Editor Scope

Built-in editor support covers:

- `HTMLInputElement`, including text-like, number, date, time, email, and similar types;
- checkbox inputs through a specialized string/empty-string convention;
- radio groups through a representative-element adapter;
- `HTMLTextAreaElement`;
- `HTMLSelectElement`;
- file inputs through the limited browser-exposed `value` string.

The DOM adapter passes Text Values to Jivs. Jivs decides parsing and validation. Specialized browser input types do not automatically require separate adapters when their DOM behavior is still text-based.

`contenteditable`, custom widgets, and file contents are outside built-in behavior. Buttons, `output`, `meter`, and `progress` are not editor controls and belong to action or presentation behavior.

`select[multiple]` is intended but deferred until the Jivs engine defines `MultiSelect`, including its Native Value, Text Value, parser, formatter, and collection-aware validation.

## D08 Radio Groups

A radio installer receives one representative radio element. It assigns adapters only to that element. The adapter uses the representative's `name` attribute to find companion radios:

```css
input[type="radio"][name="..."]
```

Radio support includes three independent capabilities:

- presentation, which may apply state to all group members;
- Jivs-to-DOM Text Value output, which selects the matching radio;
- DOM-to-Jivs input, which listens for changes and sends the selected string or empty string to `FieldValueHost.setTextValue()`.

`jivs-simpledom` is responsible for screen scraping, choosing the representative, and enforcing that only one annotated element hosts the group adapters. Manual `jivs-dom` installation receives the representative directly.

## D09 Dispatchers and Callback Attachment

`DomServicesCallbacks` is configured during global setup. Its registered factory functions are fixed after application initialization. It does not retain dispatcher instances as a registry.

There are four dispatcher categories:

```text
text-value changed
native value changed
field validation state changed
form validation state changed
```

Each category has a registration method accepting a zero-argument factory that creates a dispatcher instance. Each attachment method creates one dispatcher, preserves any callback already in the configuration, assigns the composed callback internally, and returns the created dispatcher.

Conceptual API:

```ts
class DomServicesCallbacks {
    registerTextValueChangedDispatcher(
        factory: () => ITextValueDispatcher
    ): void;

    registerValueChangedDispatcher(
        factory: () => IValueDispatcher
    ): void;

    registerValueHostValidationStateChangedDispatcher(
        factory: () => IFieldValidationDispatcher
    ): void;

    registerValidationStateChangedDispatcher(
        factory: () => IFormValidationDispatcher
    ): void;

    attachTextValueChanged(
        config: ValueHostsManagerConfig,
        options?: TextValueDispatcherOptions
    ): ITextValueDispatcher;

    attachValueChanged(
        config: ValueHostsManagerConfig,
        options?: ValueDispatcherOptions
    ): IValueDispatcher;

    attachValueHostValidationStateChanged(
        config: ValueHostsManagerConfig,
        options?: FieldDispatcherOptions
    ): IFieldValidationDispatcher;

    attachValidationStateChanged(
        config: ValueHostsManagerConfig,
        options?: FormDispatcherOptions
    ): IFormValidationDispatcher;
}
```

Attachment methods configure callbacks only. They do not screen-scrape or modify elements. Installers must run first. Dispatchers resolve elements, check for an existing matching adapter, and invoke it. The dispatcher is the object attached to the callback's runtime behavior; callback binding is handled inside the attachment method.

## D10 Error Message Tools

`jivs-dom` provides reusable presentation tooling:

```ts
interface IDomErrorMessageService {
    buildErrorMessagesHtml(
        issues: IssueFound[],
        useSummaryMessage?: boolean
    ): string;

    buildErrorMessagesText(
        issues: IssueFound[],
        useSummaryMessage?: boolean
    ): string;

    errorMessageToText(
        errorMessage: string
    ): string;
}
```

Generated issue elements always provide `data-error-code` and `data-severity` metadata, using defined empty or fallback values when source data is absent. The generated content may be used by inline displays, summaries, tooltips, and popup presentations.

## D11 Deferred Design

The following are intentionally deferred from this API pass:

- detailed ARIA service contracts and default behavior;
- the constructor-versus-bind mechanism used to bind an adapter to its element;
- the optional composite editor installer;
- the Jivs `MultiSelect` engine design and the resulting multi-select adapter;
- client submission base classes.

## D12 Relationship to SimpleDom

`jivs-simpledom` owns the attribute convention and screen-scraping workflow:

```text
HTML attributes
    -> identify field, role, and presentation
    -> choose one installation anchor
    -> call jivs-dom installers
    -> assign adapter instance or null
```

`jivs-dom` owns the reusable installers, adapters, factories, dispatchers, callback attachment, presentation utilities, and CSS that does not depend on SimpleDom selectors.
