# Jivs-DOM Design

This document defines the API to implement for `jivs-dom`. It is derived from [Planning Jivs-DOM](Planning%20Jivs-DOM.md), which retains the exploration, alternatives, and design rationale.

The design is intentionally framework-independent. `jivs-dom` supplies reusable DOM behavior. `jivs-simpledom` supplies attribute scanning and chooses installation anchors from its HTML conventions.

## D01 Design Principles

- Services in `DomServices` are configured during application or JivsServices setup and retain no form or element references.
- Installed adapters are created per element and may own state associated with that element.
- Adapters may use `this` for their bound element.
- Adapters do not retain `IFieldValueHost` or `IValueHostsManager`; those are operation parameters.
- Dispatchers are created per callback attachment/configuration and may own configuration-specific state.
- DOM elements are the stateful installation surface.
- Public adapter properties are visible and replaceable through TypeScript interfaces.
- All services have an interface implementation and can be switched in DomServices.

## D02 DomServices

`DomServices` is the root facade for the module. It is installed onto `JivsServices` through `ModuleServicesInstaller`, using a module-owned `domServices` property.

```ts
interface IDomServices { same members as in DomServices }
class DomServices implements IDomServices {
    public constructor(
        public readonly jivsServices: IJivsServices
    );

    public get elementResolver(): IDomElementResolver;
    public set elementResolver(
        value: IDomElementResolver
    );

    public get dispatchers(): IDomDispatcherService;
    public set dispatchers(
        value: IDomDispatcherService
    );

    public get editorInstaller(): IEditorInstaller;
    public set editorInstaller(
        value: IEditorInstaller
    );

    public get editorAdapterFactory():
        IDomEditorAdapterFactory;
    public set editorAdapterFactory(
        value: IDomEditorAdapterFactory
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

    public get aria(): IDomAriaService;
    public set aria(
        value: IDomAriaService
    );

    public get issuesFoundFormatter():
        IIssuesFoundFormatterService;
    public set issuesFoundFormatter(
        value: IIssuesFoundFormatterService
    );
}
```

Each property has a default implementation and may be replaced after construction. `DomServices` configures its child services and default editor adapter definitions during its creation process. The public `editorAdapterFactory` is the shared editor-definition registry consumed by `editorInstaller`. Other factories are owned by or injected into their installers unless a future shared-capability requirement justifies a public service property.

## D03 Element Resolution

```ts
interface IDomElementResolver {
    getElement(
        valueHost: IFieldValueHost,
        role: ElementRole | string,
        elementIdentifierTemplate?: string
    ): HTMLElement | null;
}
```
The resolver calls `valueHost.getElementIdentifier(elementIdentifierTemplate)` internally. The optional `elementIdentifierTemplate` is the template passed to `getElementIdentifier()`; it is not itself an Element Identifier. The resulting Element Identifier supplies the query syntax used by the resolver to find the appropriate consumer. The resolver returns the actual `HTMLElement`; the caller applies the optional `IJivsDomElement` contract when installing Jivs behavior.

The default resolver uses `querySelector()` and the requested role to find the appropriate field consumer. `jivs-simpledom` supplies the role-specific selector convention. The resolver does not expose a separate `getElementIdentifier()` method because resolving the identifier and using it to find the element are one operation.

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

### SimpleDom implementation

`jivs-simpledom` implements the resolver through its `data-field` and `data-jivs-role` conventions. It resolves the field identifier through `valueHost.getElementIdentifier(elementIdentifierTemplate)`, then finds the first matching consumer:

```ts
const elementIdentifier =
    valueHost.getElementIdentifier(
        elementIdentifierTemplate
    );

return document.querySelector(
    `[data-field="${CSS.escape(elementIdentifier)}"]` +
    `[data-jivs-role="${CSS.escape(role)}"]`
);
```

This is a SimpleDom implementation detail, not a requirement of `IDomElementResolver`. Applications may replace the resolver to use other selector conventions, element relationships, or lookup mechanisms.

## D04 Installed Element Contract

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
}
```

`IJivsDomElement` is an optional-property augmentation of an ordinary `HTMLElement`. Element resolution returns `HTMLElement`, and installers or callers apply this contract when they attach Jivs behavior. The editor installer is responsible for editor elements; it does not require a `data-jivs-role` attribute and should not inspect SimpleDom attributes.

`jivsEditorAdapterDefinition` has two meaningful states:

```text
undefined -> no definition has been selected; editor installation may bind one
instance  -> selected and bound definition; do not search again
```

The adapter properties have three meaningful states:

```text
undefined -> not examined; an installer may attempt resolution
instance  -> installed and available to a dispatcher
null      -> examined but unavailable; do not retry automatically
```

The presentation properties have three meaningful states:

```text
undefined -> not yet examined; a presentation installer may resolve one
instance  -> installed presentation, including a null-object presentation
null      -> explicitly no presentation for this element; do not retry
```

An adapter instance is attached only to the element supplied to its installer. A grouped adapter may operate on companion elements, but the dispatcher always resolves the representative element that owns the adapter.

## D05 Adapter and Editor Factory Contracts

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
> We would expect the writeTextValue function to support the onTextValueChanged callback, but why the readTextValue? Because that allows us to provide boilerplate code in our installer that handles the setTextValue() call by getting the value consistently using readTextValue. We'll see that in use in concrete implementations of `IDomEditorAdapterDefinition`.

The editor adapter factory recognizes an editor element and resolves one adapter definition. A definition owns all editor-specific behavior so that its text-value adapter, native-value adapter, and DOM-to-Jivs connection agree on the widget model:

```ts
interface IDomEditorAdapterDefinition {
    readonly adapterKey: string;
    readonly priority: number;
    readonly defaultFieldPresentationName?: string | null;

    matches(
        element: HTMLElement
    ): boolean;

    createTextValueAdapter?(
        element: IJivsDomElement,
        valueHost: IFieldValueHost
    ): IDomTextValueAdapter | null;

    createValueAdapter?(
        element: IJivsDomElement,
        valueHost: IFieldValueHost
    ): IDomValueAdapter | null;

    attachToSendValues(
        element: IJivsDomElement,
        valueHost: IFieldValueHost,
        options: EditorInstallOptions
    ): void;
}

interface IDomEditorAdapterFactory {
    register(
        definition: IDomEditorAdapterDefinition
    ): void;

    getDefinition(
        adapterKey: string
    ): IDomEditorAdapterDefinition | null;

    findDefinition(
        element: HTMLElement
    ): IDomEditorAdapterDefinition | null;
}
```

`matches()` is a read-only predicate. The element's characteristics must be configured before editor installation; a definition must not modify an element while it is being considered for selection. `attachToSendValues()` is required, but may intentionally take no action for a known widget with no DOM-to-Jivs behavior.

`adapterKey` is the identity of a registered definition and the explicit selection mechanism used by the installer. Each concrete adapter-definition class should accept an optional `adapterKey` constructor parameter with a class-appropriate default string, and expose that value through its readonly `adapterKey` property. This lets application code create an instance with an identity appropriate to its widget before registering it. A definition instance may recognize a widget through its element characteristics in `matches()`; applications that need a widget-specific class or attribute can register a definition whose `matches()` implementation recognizes it. Applications can use `bindAdapterKey()` or `EditorInstallOptions.adapterKey` when the widget cannot identify itself through its element characteristics.

> During the design phase, we considered an additional EditorInstallerOption that would let the user specify more info for the matches() function to use. We abandoned that due to immutability. We want users to use EditorInstallerOption.adapterKey or bindAdapterKey() when they want to control which adapterdefinition to use.

The factory stores and returns the registered definition instance. A registered definition is shared by every element that selects it and must be treated as immutable after registration. It must not retain or mutate element-specific, value-host-specific, or installation-specific state. Per-element state belongs in the adapters created by the definition or in private state associated with the installation operation. Because the definition instance is exposed through `IJivsDomElement.jivsEditorAdapterDefinition`, this immutability rule applies equally to library and application-defined definitions.

`findDefinition()` evaluates definitions in descending numeric `priority` order and returns the first match. Priorities from 0 through 100 are the documented normal range, with greater numbers considered first; any numeric value, including negatives and values above 100, is valid. Registration order is retained among definitions with equal priority. Registering a definition with an existing `adapterKey` logs the override and replaces the registered definition for future selection and binding.

For built-in native HTML editors, a definition's default `adapterKey` should be unique to the specific widget case, not just to the general element tag. This means values such as `input:text`, `input:number`, `input:date`, `input:checkbox`, `input:radio`, `textarea`, `select`, and `input:file` are distinct keys. This allows an application to override one specific native control variant without changing the behavior of other native input types that share the same tag.

The `jivs-dom` library is expected to provide the following built-in `IDomEditorAdapterDefinition` implementations for native DOM elements:

- `InputAdapterDefinition` for all ordinary `input` types except `radio` and `file`;
- `RadioAdapterDefinition` for radio groups;
- `TextAreaAdapterDefinition` for `textarea` elements;
- `SelectAdapterDefinition` for `select` elements;
- `FileInputAdapterDefinition` for file uploads.

These are the public built-in definitions expected to ship in the library. Applications may replace them individually by `adapterKey` or register custom adapters with different keys. The implementation may share internal code paths or abstract bases, but each distinct widget behavior is represented as a separate default definition.

Adapters are per-element objects. The current Jivs context is supplied by the dispatcher or installer operation rather than retained as adapter state.

`jivs-dom` supplies three abstract base implementations of `IDomEditorAdapterDefinition`. Each leaves `attachToSendValues()` trigger wiring to its concrete subclass, but provides a protected helper for the usual Jivs submission path:

```text
TextEditorAdapterDefinition
    -> readTextValue()
    -> FieldValueHost.setTextValue(textValue, { validate: true })

ParsedTextEditorAdapterDefinition
    -> readTextValue()
    -> parseTextValue(textValue, valueHost, element)
    -> FieldValueHost.setValues(nativeValue, textValue, {
           validate: true,
           injectedError
       })

NativeValueEditorAdapterDefinition
    -> readValue()
    -> FieldValueHost.setValue(nativeValue, { validate: true })
```

`ParsedTextEditorAdapterDefinition` supports applications that parse editor text outside Jivs. Its subclass implements the following operation; `nativeValue` may be `undefined` when parsing cannot resolve a native value:

```ts
protected abstract parseTextValue(
    textValue: string | undefined,
    valueHost: IFieldValueHost,
    element: IJivsDomElement
): {
    nativeValue: unknown | undefined;
    injectedError?: InjectedError;
};
```

Passing the `IFieldValueHost` and element lets application code select parser behavior from the field's configured data type or element-specific characteristics. `jivs-dom` provides no external-parser registry or data-type-to-parser factory; applications own that policy. A custom widget may extend the appropriate base class or implement `IDomEditorAdapterDefinition` directly when its behavior differs.

The intended extension model is:

- `ParsedTextEditorAdapterDefinition` is the abstract customization point for application-defined text parsing behavior;
- native widget implementations such as `InputAdapterDefinition`, `TextAreaAdapterDefinition`, `SelectAdapterDefinition`, and related built-ins inherit from the concrete text/native base classes in `jivs-dom`;
- applications should subclass `ParsedTextEditorAdapterDefinition` when they need custom parse logic, not subclass a concrete native HTML adapter definition for that purpose.

This guidance belongs in end-user documentation, not in the core API contract itself. The public API contract is simply that `ParsedTextEditorAdapterDefinition` is the parser-aware abstract extension point and concrete HTML adapters remain the native widget definitions.

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

The public installer services are separate and replaceable. There are two types of Installers:
- Editor Installer is associated with editors, which get, set, and validate a value with a FieldValueHost.
- Presentation Installer is associated with everything else. Elements like Field Error Displays, styling of labels and containers may change based on the state of field validation. Editor Installer co-opts the Presentation Installer to give the editor its own presentation.

### Editor Installer
Editor-related setup is coordinated by one editor installer, while field and form presentation remain independent because presentation-only elements use them directly:

```ts
interface IEditorInstaller {
    bindAdapterKey(
        element: IJivsDomElement,
        adapterKey: string
    ): void;

    install(
        element: IJivsDomElement,
        valueHost: IFieldValueHost,
        options?: EditorInstallOptions
    ): void;
}

interface EditorInstallOptions {
    adapterKey?: string | null;
    elementIdentifierTemplate?: string;
    presentationName?: string | null;
    duringEdit?: boolean;
}
```

`duringEdit` determines whether a concrete definition attaches an intermediate-edit trigger, such as a native `input` event. It is not passed through as caller-selected `FieldValueHostSetValueOptions`. The base submission helpers always set `validate: true`; only an invocation caused by an intermediate-edit trigger adds `duringEdit: true`. `EditorInstallOptions` does not expose `validate`, `reset`, `skipIfUnchanged`, `injectedError`, `ensureEnabled`, `overrideDisabled`, `skipValueChangedCallback`, `disableParser`, or `disableFormatter`.

`presentationName` follows the same rule as the installed presentation state: `undefined` means no selection has been attempted yet and a fallback policy may still apply; `null` means this install site explicitly disables a presentation and should not fall back to a default. When the element is already bound, any conflicting explicit `adapterKey` is rejected.

`editorInstaller` is used only for editors. It uses `editorAdapterFactory` to select one `IDomEditorAdapterDefinition`, which coordinates:

- text-value adapter creation;
- native-value adapter creation;
- DOM-to-Jivs wiring that uses the selected definition's text, parsed-text, native-value, or custom submission behavior.

The editor installer selects a definition in this order:

```text
element.jivsEditorAdapterDefinition is assigned
    -> use the bound definition

otherwise, options.adapterKey is supplied
    -> bindAdapterKey() resolves and assigns that definition

otherwise
    -> editorAdapterFactory.findDefinition(element)
       selects and assigns the first matching definition

no definition selected
    -> log and throw
```

`bindAdapterKey()` obtains the definition through `editorAdapterFactory.getDefinition()` and logs and throws when the key is not registered. Binding the same definition again is a no-op; attempting to bind a different definition to an already-bound element logs and throws. This is a one-time binding step for the element's installation lifecycle. When an element is already bound, a conflicting `options.adapterKey` also logs and throws.

The editor installer may attach `jivsTextValueAdapter` and `jivsValueAdapter` independently. It creates each adapter only when the corresponding property is `undefined`, preserving an existing adapter instance or explicit `null`. A definition that omits one creation method sets the corresponding property to `null`. `attachToSendValues()` must be idempotent so repeated installation of the same definition on the same element does not duplicate the widget's connection. The public contract does not require a separate `jivsSendValuesAttached` flag; the selected adapter definition and installed adapter state are sufficient to detect that the element has already been wired. An implementation may hold a private internal marker, but it is not part of the `IJivsDomElement` public contract. An adapter may be installed even when no corresponding dispatcher has been attached; installation describes the element's capability, while callback attachment determines whether a dispatcher consumes it. The send-values capability is not an adapter and does not have a public property on `IJivsDomElement`.

> Design note for later app guidance: when deciding between `TextValueAdapter` and `ValueAdapter`, prefer `ValueAdapter` when the widget's primary data is not a string or when it exposes a structured/native value. Prefer `TextValueAdapter` when the widget's user-facing model is textual and validation depends on text input. When both are supported, choose the text-based path when user input must be validated as text. This is implementation guidance for later package and end-user documentation; it is not a separate normative API rule.

The installer receives the `IFieldValueHost` because event handlers call it directly. `elementIdentifierTemplate` is passed to the element resolver's `getElement()` operation when the installer or its factories need the Element Identifier resolved from that template. The resulting identifier is not part of the public installation context unless a specific factory requires it.

`editorInstaller` also invokes `fieldPresentationInstaller` for the editor. It resolves the requested presentation name in this order:

```text
options.presentationName is supplied
    -> use the explicit name

otherwise, definition.defaultFieldPresentationName is supplied
    -> use the adapter definition's default

otherwise
    -> let fieldPresentationInstaller select its universal editor fallback
```

This lets an editor definition select a presentation appropriate to its widget, such as a radio-group or date-widget presentation, without requiring every definition to repeat the common editor default. `fieldPresentationInstaller` receives `ElementRole.editor` and the resolved name or its absence; it owns the universal fallback policy.

### Presentation Installer

Presentation is using code and CSS to change the appearance of an HTML element. There are several targets for this: editor, label, field error display, validation summary, and submit controls.

Presentation installation uses separate field and form methods because the Jivs context differs:

```ts
interface IFieldPresentationInstaller {
    install(
        element: IJivsDomElement,
        role: ElementRole | string,
        presentationName: string | null | undefined,
        valueHost: IFieldValueHost | null | undefined
    ): IFieldPresentation;
}

interface IFormPresentationInstaller {
    install(
        element: IJivsDomElement,
        role: ElementRole | string,
        presentationName: string | null | undefined,
        valueHostsManager:
            IValueHostsManager | null | undefined
    ): IFormPresentation;
}
```

Presentation names are open-ended strings. While they can match an AdapterKey, that is by no means a requirement. They are often descriptive of the visualizations they achieve while AdapterKey is likely to be closer to the name of the widget.

The role is required and participates in factory resolution; the presentation name may be absent so the role can select a default. Each presentation installer assigns and returns a concrete presentation instance, including a null-object presentation when the selected policy intentionally has no visible behavior. When the installer cannot resolve either the requested presentation or its role-specific fallback, it logs and throws.

The built-in editor role is `ElementRole.editor`. Manual callers choose the editor element directly. `jivs-simpledom` must select only elements matching `data-jivs-role="editor"` before calling `editorInstaller`; `editorInstaller` itself does not inspect `data-jivs-role` and is not coupled to SimpleDom.

When the relevant `ValueHost` or `ValueHostsManager` is supplied, installation applies the initial presentation using a neutral validation state. When it is `null` or `undefined`, installation attaches the presentation without invoking it. Installation does not validate values. `validate({ preliminary: true })` is a later application decision.

## D07 Native Editor Scope

Built-in editor support covers:

- `HTMLInputElement`, including text-like, number, date, time, email, and similar types;
- checkbox inputs through a specialized string/empty-string convention;
- radio groups through a representative-element adapter;
- `HTMLTextAreaElement`;
- `HTMLSelectElement`;
- file inputs through the limited browser-exposed `value` string.

The built-in native editor definitions use unique default `adapterKey` values for each distinct widget case, for example `input:text`, `input:number`, `input:date`, `input:time`, `input:checkbox`, `input:radio`, `textarea`, `select`, and `input:file`. This is a default key pattern for the built-in registry, not a restriction on application-created keys. It allows an application to override one specific native control type without affecting the others that share the same HTML tag.

The built-in `jivs-dom` library is expected to provide separate native definitions for the cases whose behavior differs materially: `InputAdapterDefinition` for ordinary input types, `RadioAdapterDefinition`, `TextAreaAdapterDefinition`, `SelectAdapterDefinition`, and `FileInputAdapterDefinition`. Regular text-like inputs share a common implementation family, but they remain distinct keys in the default registry so an application can override one specific control case without affecting the others.

The DOM adapter passes Text Values to Jivs. Jivs decides parsing and validation. Specialized browser input types do not automatically require separate adapters when their DOM behavior is still text-based.

`contenteditable`, custom widgets, and file contents are outside built-in behavior. Buttons, `output`, `meter`, and `progress` are not editor controls and belong to action or presentation behavior.

`select[multiple]` is intended but deferred until the Jivs engine defines `MultiSelect`, including its Native Value, Text Value, parser, formatter, and collection-aware validation.

## D08 Radio Groups

A radio installer receives one primary radio element from the caller. That element is the owner of the group adapter installation; it is the element passed into `editorInstaller` and the element that receives the `IJivsDomElement` adapter state. The adapter uses the primary element's `name` attribute to find companion radios:

```css
input[type="radio"][name="..."]
```

Group membership is not determined by DOM order. The primary element is the single owner of the adapter installation, and companion radios are found by matching the same `name` and by the presence of compatible element-owned Jivs state on their `IJivsDomElement` contract. In practice, the group can be established when any radio in the set has a bound `jivsEditorAdapterDefinition`, and the implementation queries the matching radios to find the primary or to confirm the group exists. This makes the design independent of whether the selected element is the first, last, or middle radio in the DOM.

Radio support includes three independent capabilities:

- presentation, which may apply state to all group members;
- Jivs-to-DOM Text Value output, which selects the matching radio;
- DOM-to-Jivs input, which listens for changes and sends the selected string or empty string to `FieldValueHost.setTextValue()`.

`jivs-simpledom` is responsible for screen scraping, choosing the primary representative, and enforcing that only one annotated element hosts the group adapters. Manual `jivs-dom` installation receives the representative directly.

## D09 Dispatcher Service and Callback Attachment

`IDomDispatcherService` is configured during application setup. Each category is expected to have at most one registered factory. The service does not retain dispatcher instances as a registry. It creates dispatchers and attaches composed callbacks to the corresponding `ValueHostsManagerConfig` callback hooks.

There are four dispatcher categories:

```text
text-value changed
native value changed
field validation state changed
form validation state changed
```

Each category has zero or one registered factory. A registration method accepts a factory that creates a dispatcher instance. Each attachment method accepts optional caller-supplied options, passes those options unchanged to the corresponding factory, preserves any callback already in the configuration, assigns the composed callback internally, and returns the created dispatcher. The factory is a creation strategy, not a dispatcher instance registry. `jivs-dom` does not prescribe the shape or meaning of these options. `jivs-simpledom` may provide its own fully registered `IDomDispatcherService` instance.

Registration is setup-time configuration. If no factory is registered for a category, its attachment method logs that there is nothing to attach, leaves the existing callback unchanged, and returns `null`. The design does not require a default factory. Registration replacement and registration after attachment are not specified because each category is expected to have at most one setup-time registration. Disabling a category is normally done by not calling its attachment method.

The service creates one dispatcher instance for each attachment call. That instance owns the options and any consumer-discovery state for that configuration. It must not be stored as a global singleton and must not retain a `ValueHostsManager`; the callback supplies the current `ValueHost`, `ValueHostsManager`, or validation state when it runs. A dispatcher may retain stateless services or discovery policy needed by its concrete `findConsumers()` implementation.

Dispatcher instances are configuration-scoped objects. They are not required to be immutable, but their constructor configuration should be treated as fixed after attachment. A custom dispatcher may retain state when that state belongs to the dispatcher or its callback attachment, such as counters, caches, or discovery policy. The default implementations should remain stateless after construction unless a concrete use case justifies such state. In either case, dispatcher state must not include references to individual DOM elements, element collections, or a `ValueHostsManager`.

The composed callback retains the dispatcher instance through its `dispatch` call. Therefore the instance remains alive for as long as the composed callback remains assigned to the `ValueHostsManagerConfig` or otherwise reachable. Returning the dispatcher from `attach...()` is useful for inspection, testing, and custom lifecycle management, but the caller does not need to retain it for normal operation. When the configuration and its callback become unreachable, the dispatcher and its configuration-scoped state can be collected normally.

Conceptual API:

```ts
type DispatcherFactory<TDispatcher> =
    (options?: unknown) => TDispatcher;

interface IDomDispatcherService {
    registerTextValueChangedDispatcher(
        factory: DispatcherFactory<ITextValueDispatcher>
    ): void;

    registerValueChangedDispatcher(
        factory: DispatcherFactory<IValueDispatcher>
    ): void;

    registerValueHostValidationStateChangedDispatcher(
        factory: DispatcherFactory<IFieldValidationDispatcher>
    ): void;

    registerValidationStateChangedDispatcher(
        factory: DispatcherFactory<IFormValidationDispatcher>
    ): void;

    attachTextValueChanged(
        config: ValueHostsManagerConfig,
        options?: unknown
    ): ITextValueDispatcher | null;

    attachValueChanged(
        config: ValueHostsManagerConfig,
        options?: unknown
    ): IValueDispatcher | null;

    attachValueHostValidationStateChanged(
        config: ValueHostsManagerConfig,
        options?: unknown
    ): IFieldValidationDispatcher | null;

    attachValidationStateChanged(
        config: ValueHostsManagerConfig,
        options?: unknown
    ): IFormValidationDispatcher | null;
}
```

The options value is an opaque creation argument. The service passes the same value to the registered factory for that dispatcher category and does not inspect, merge, clone, or retain it independently. An omitted options argument is passed through as `undefined`; the factory decides what `undefined` means. A factory may interpret the value as a category-specific options object, require a particular shape, or ignore it. Applications that want compile-time typing for a particular dispatcher can expose a typed registration or wrapper around this service; the core DOM contract does not need to define separate option interfaces for each dispatcher category.

The library should provide the following dispatcher contracts. The interfaces describe the callback-facing operation; the abstract bases provide the shared iteration and missing-state rules, while concrete implementations provide element discovery:

```ts
interface ITextValueDispatcher {
    dispatch(
        valueHost: IFieldValueHost,
        textValue: string
    ): void;
}

interface IValueDispatcher {
    dispatch(
        valueHost: IFieldValueHost,
        value: unknown
    ): void;
}

interface IFieldValidationDispatcher {
    dispatch(
        valueHost: IFieldValueHost,
        state: ValueHostValidationState
    ): void;
}

interface IFormValidationDispatcher {
    dispatch(
        valueHostsManager: IValueHostsManager,
        state: ValidationState
    ): void;
}

abstract class FieldDispatcherBase {
    protected forEachConsumer(
        valueHost: IFieldValueHost,
        operation: (element: IJivsDomElement) => void
    ): void;

    protected abstract findConsumers(
        valueHost: IFieldValueHost
    ): Iterable<IJivsDomElement>;
}

abstract class FormDispatcherBase {
    protected forEachConsumer(
        valueHostsManager: IValueHostsManager,
        operation: (element: IJivsDomElement) => void
    ): void;

    protected abstract findConsumers(
        valueHostsManager: IValueHostsManager
    ): Iterable<IJivsDomElement>;
}

abstract class TextValueDispatcher
    extends FieldDispatcherBase
    implements ITextValueDispatcher {
    public dispatch(
        valueHost: IFieldValueHost,
        textValue: string
    ): void;
}

abstract class ValueDispatcher
    extends FieldDispatcherBase
    implements IValueDispatcher {
    public dispatch(
        valueHost: IFieldValueHost,
        value: unknown
    ): void;
}

abstract class FieldValidationDispatcher
    extends FieldDispatcherBase
    implements IFieldValidationDispatcher {
    public dispatch(
        valueHost: IFieldValueHost,
        state: ValueHostValidationState
    ): void;
}

abstract class FormValidationDispatcher
    extends FormDispatcherBase
    implements IFormValidationDispatcher {
    public dispatch(
        valueHostsManager: IValueHostsManager,
        state: ValidationState
    ): void;
}
```

`TextValueDispatcher`, `ValueDispatcher`, and `FieldValidationDispatcher` are field dispatchers. Each resolves the consumer elements associated with the callback's `IFieldValueHost`, then invokes only the corresponding installed capability on each element. The protected `forEachConsumer()` helper supplies the common iteration; the concrete dispatcher performs the capability-specific `undefined`/`null` check.

- `TextValueDispatcher` calls `jivsTextValueAdapter.writeTextValue(textValue)`;
- `ValueDispatcher` calls `jivsValueAdapter.writeValue(value)`;
- `FieldValidationDispatcher` calls `jivsFieldPresentation.apply(valueHost, state)`.

`FormValidationDispatcher` resolves the form-level consumers associated with the `IValueHostsManager` and calls `jivsFormPresentation.apply(valueHostsManager, state)`.

The concrete dispatcher interfaces do not expose the adapter or presentation properties as callback parameters. The dispatcher reads the installed public property from the resolved `IJivsDomElement`, which keeps installation state on the element and permits applications to replace an installed behavior. An `undefined` property means the capability was not installed and is skipped. A `null` property means the capability was examined and is intentionally unavailable and is also skipped. Dispatching never creates or installs an adapter or presentation.

The field and form base classes own the common rules:

- enumerate every consumer returned by `findConsumers()`;
- invoke the supplied operation once per consumer, in discovery order;
- continue dispatching to other consumers when one consumer has no matching capability;
- do not throw merely because no consumer or matching capability exists.

Concrete subclasses own element discovery. The base package does not provide a universal `findConsumers()` implementation. A direct `jivs-dom` user must implement that method according to the application's element-discovery convention. The default DOM package must not inspect `jivs-simpledom` attributes. A SimpleDom dispatcher supplies the SimpleDom-specific discovery implementation. A custom application can provide a dispatcher that resolves elements by any other convention.

`jivs-simpledom` consumes these contracts by supplying concrete subclasses of the field and form dispatcher bases. For example, a SimpleDom text-value dispatcher can extend `TextValueDispatcher`, implement its consumer-discovery method using the SimpleDom field and role attributes, and let the inherited dispatch logic invoke `jivsTextValueAdapter` on each discovered editor. The corresponding SimpleDom validation dispatchers use the same attribute-based discovery for field or form presentation consumers. These subclasses belong to `jivs-simpledom`; the base package does not inspect or depend on those attributes.

For example, a text-value dispatcher can implement the capability check in its public dispatch operation while leaving consumer discovery to its subclass:

```ts
abstract class TextValueDispatcher
    extends FieldDispatcherBase {
    public dispatch(
        valueHost: IFieldValueHost,
        textValue: string
    ): void {
        this.forEachConsumer(valueHost, element => {
            const adapter = element.jivsTextValueAdapter;
            if (adapter !== undefined && adapter !== null) {
                try {
                    adapter.writeTextValue(textValue);
                }
                catch (error) {
                    // Log this consumer failure and continue with the next one.
                }
            }
        });
    }
}
```

The subclass still must implement `findConsumers()`. If it returns no consumers, dispatch is a normal no-op. If `findConsumers()` itself throws, that is a discovery implementation failure rather than an installed-consumer failure; the base contract does not hide it.

Every dispatcher is detached from the elements it discovers. Element discovery occurs during each dispatch operation, and a dispatcher must not retain a discovered element, an element collection, or a DOM subtree between operations. Element-specific state belongs on the element through the installed `IJivsDomElement` properties or another element-owned mechanism. This allows elements to be removed, replaced, or added after attachment without recreating or reconfiguring the dispatcher. A dispatcher may retain only discovery policy and state that is independent of particular element identities.

Text and native value dispatchers are optional integrations: applications may omit their attachment methods when they manage Jivs-to-DOM output themselves. Validation dispatchers are the normal presentation connection and are attached when DOM validation presentation is desired.

Attachment methods configure the `ValueHostsManagerConfig` callback hooks only. They do not screen-scrape, resolve elements, or modify installed element state. Installers must run first. Each method captures the callback already assigned to the corresponding hook, creates the configured dispatcher, and replaces the hook with a composed callback that first invokes the existing callback and then dispatches to DOM behavior. The existing callback receives its original arguments unchanged and, when the engine supplies a meaningful receiver, its original `this` value. The composed callback returns `void`; callback return values are ignored. If the existing callback throws, the error propagates and DOM dispatch is not attempted. When no factory is registered for the requested category, the method logs that there is nothing to attach, leaves the existing callback unchanged, and returns `null`.

The dispatcher instance is called directly by the composed callback, so its class method receives the dispatcher instance as `this`. The wrapper does not use its own dynamic `this` to locate the dispatcher. The callback composition is conceptually:

```ts
const previous = config.onTextValueChanged;
const dispatcher = factory(options);

config.onTextValueChanged = function (...args): void {
    previous?.apply(this, args);
    dispatcher.dispatch(...args);
};
```

Attaching the same dispatcher category more than once to the same configuration is not a supported usage. A second attachment can wrap the first composed callback, causing duplicate dispatches and retaining both dispatcher instances through nested callback closures. An implementation may detect this and log or throw, but the public contract does not require a particular defense. Attaching different categories to the same configuration is valid. A private `WeakMap` is one way to track attachment state without modifying `ValueHostsManagerConfig`:

```ts
const attachedDispatchers = new WeakMap<
    ValueHostsManagerConfig,
    Map<DispatcherCategory, object>
>();

// During attach(category, config, options):
const existing = attachedDispatchers
    .get(config)
    ?.get(category);

if (existing !== undefined) {
    // Duplicate attachment may be logged, rejected, or handled by policy.
}

// After creating and attaching the dispatcher:
let dispatchers = attachedDispatchers.get(config);
if (dispatchers === undefined) {
    dispatchers = new Map();
    attachedDispatchers.set(config, dispatchers);
}
dispatchers.set(category, dispatcher);
```

An alternative is a module-owned `Symbol` property on the configuration, but that exposes implementation metadata on a public engine object. The design does not require either technique; it records them as implementation guidance. The `WeakMap` approach is preferred when attachment state should remain private and should disappear when the configuration becomes unreachable.

The callback signatures used by the attachment methods must match the engine's `ValueHostsManagerConfig` declarations. The conceptual `dispatch()` signatures above show the values required by the DOM behavior; the implementation adapts the engine callback parameter object to those arguments rather than exposing engine callback details as a second public DOM contract. If an engine callback does not provide a required context, the corresponding dispatcher attachment is invalid and must log and throw during attachment, not fail later during callback execution.

Exceptions thrown by an installed adapter or presentation are logged and do not stop dispatch to later consumers. A concrete `findConsumers()` implementation is responsible for its own discovery errors; those errors are not treated as individual consumer failures.

The dispatcher instance is retained by the composed callback and requires no separate owner or disposal contract. The `WeakMap` shown above is optional implementation metadata for duplicate-attachment detection, not a required ownership mechanism. A dispatcher must not retain discovered elements, element collections, DOM subtrees, or a `ValueHostsManager`; element-specific state remains element-owned.

## D10 Error Message Tools

`jivs-dom` provides reusable presentation tooling through its `issuesFoundFormatter` service. This is distinct from the engine's `ErrorMessagesService`: the DOM service formats `IssueFound` objects for DOM-oriented consumers.

```ts
interface IIssuesFoundFormatterService {
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

The existing jivs-DOM_helpers.ts file provides the source implementation for the initial default behavior. The implementation may be moved or reorganized when jivs-dom is created, but its initial behavior is not expected to change as part of this API design. IIssuesFoundFormatterService remains replaceable, so users may provide their own formatter through DomServices.issuesFoundFormatter.

## D11 Deferred Design

The following are intentionally deferred from this API pass:

- the constructor-versus-bind mechanism used to bind an adapter to its element;
- the Jivs `MultiSelect` engine design and the resulting multi-select adapter;
- client submission base classes.

## D12 Relationship to SimpleDom

`jivs-simpledom` owns the attribute convention and screen-scraping workflow:

```text
HTML attributes
    -> identify field, role, and presentation
    -> choose one installation anchor
    -> call the appropriate jivs-dom installer
    -> assign the selected adapter or presentation instance, or null
```

`jivs-simpledom` owns consumer discovery for its attribute convention. It supplies concrete subclasses of the `jivs-dom` dispatcher classes and implements their `findConsumers()` methods using `data-field`, `data-jivs-role`, and any other SimpleDom attributes needed to identify the current consumers. The dispatchers rediscover those consumers during each callback; they do not retain the elements found by an earlier dispatch.

The SimpleDom workflow is:

```text
identify field, role, and presentation attributes
    -> choose one installation anchor
    -> install the selected editor adapter or presentation
    -> attach the registered SimpleDom dispatchers to the ValueHostsManagerConfig
    -> construct or use the ValueHostsManager
    -> callbacks rediscover current consumers and invoke installed behavior
```

Installers must run before callback notifications are expected. Attaching dispatcher callbacks does not screen-scrape, install adapters, or install presentations. A later DOM replacement can be handled by running the SimpleDom discovery and installation workflow for the replacement elements; the existing dispatchers remain usable because they discover consumers on each dispatch.

For editors, the screen-scraping workflow selects only elements with `data-jivs-role="editor"` and calls `editorInstaller`. Labels, error displays, and other field consumers call `fieldPresentationInstaller`; summaries, submit controls, and other form consumers call `formPresentationInstaller`. SimpleDom does not cause `editorInstaller` to run for a non-editor role.

Applications using `jivs-dom` without `jivs-simpledom` must provide their own element-discovery and installation workflow. They must implement concrete dispatcher subclasses whose `findConsumers()` methods locate the appropriate elements according to the application's markup convention. `jivs-dom` supplies the reusable dispatch mechanics and contracts, but it cannot infer an application's element relationships or selector rules.

`jivs-dom` owns the reusable installers, adapters, factories, dispatchers, callback attachment, presentation utilities, and CSS that does not depend on SimpleDom selectors.

## D13 Testing Requirements

Thorough unit testing is a foundational requirement of the module. The API should remain strongly testable through interfaces, replaceable services, factories, and explicit element-owned state.

The implementation must provide focused tests for:

- `DomServices` default creation, replacement, and module installation;
- element resolution by role and Element Identifier;
- the `undefined`, adapter-instance, and `null` installation states;
- editor adapter-definition registration, priority matching, explicit binding, and duplicate-key replacement;
- editor installation, including factory-selected text/native adapters, idempotent send-values behavior, optional field presentation, and Element Identifier resolution from `elementIdentifierTemplate`;
- each adapter and installer independently;
- field and form presentation installation with and without Jivs context;
- neutral initial presentation state;
- dispatcher matching, missing adapters, and explicitly unavailable adapters;
- dispatcher attachment with no registered factory, including logging, unchanged callbacks, and a `null` return;
- dispatcher factory registration, exact pass-through of options including omitted `undefined`, dispatcher creation, and preservation of existing callbacks;
- callback composition order, original arguments and `this`, `void` return behavior, and propagation of an existing callback exception without dispatch;
- duplicate attachment behavior and valid attachment of different callback categories;
- consumer discovery on every dispatch, including replaced, removed, and newly added elements;
- logging and continuation after an installed adapter or presentation throws;
- the requirement that dispatchers do not retain discovered elements or a `ValueHostsManager`;
- native input, textarea, select, checkbox, radio-group, and limited file-input behavior;
- radio representative-element lookup and companion-element behavior;
- error-message HTML and text generation, including metadata and fallback values.

Tests that exercise DOM behavior should use Jest with a DOM test environment such as `jest-environment-jsdom`. Jest supplies the test runner and test APIs; the environment package supplies JSDOM's simulated browser objects such as `document`, `HTMLElement`, native element types, selectors, and DOM events. The package should not assume that Node's default test environment provides DOM objects.

DOM tests should construct actual simulated DOM elements as fixtures and dispatch actual simulated DOM events rather than replacing `HTMLElement`, native element classes, selectors, or event behavior with hand-written mocks:

```ts
const input = document.createElement('input');
input.type = 'text';
input.value = 'hello';
document.body.append(input);

input.dispatchEvent(new Event('input', { bubbles: true }));
```

Tests should verify observable element state, installed public properties, dispatched calls, event handling, and generated content without requiring a full browser or demonstration website. JSDOM is a browser API simulation, not a rendering engine; tests involving layout, visual rendering, browser security restrictions, or browser-specific native behavior may require later browser integration tests.

The design does not prescribe the test runner, DOM environment package, test file layout, coverage thresholds, or CI commands. Those belong in the future implementation guide. The design requirement is that every public service and connection boundary can be tested independently and that DOM-dependent behavior has a reliable simulated DOM environment.

## D14 Package Responsibilities

The planned repository products have these architectural responsibilities:

```text
@plblum/jivs-dom
    reusable DOM services, adapters, installers, dispatchers,
    presentation tools, error-message tools, and CSS

@plblum/jivs-simpledom
    attribute conventions, screen scraping, installation anchors,
    SimpleDom selectors, concrete dispatcher subclasses,
    findConsumers() implementations, SimpleDom-specific initialization,
    and a fully registered IDomDispatcherService

jivs-dom website
    end-user demonstration, learning examples, and integration coverage
```

The dependency direction is one-way:

```text
jivs-simpledom -> jivs-dom
jivs-dom       -X-> jivs-simpledom
```

`jivs-dom` must be usable without `jivs-simpledom`. `jivs-simpledom` consumes `jivs-dom`; it does not define the reusable DOM contracts. It supplies the concrete dispatcher subclasses, `findConsumers()` implementations, and fully registered dispatcher service needed for its attribute convention. `jivs-dom` must not depend on SimpleDom attributes, selectors, or dispatcher implementations.

The website consumes the public packages to demonstrate and exercise them. It is not the source of undocumented library behavior.

Package names, NPM metadata, workspace registration, build commands, publishing, and migration order are implementation-guide concerns. This section defines only ownership and dependency direction.

## D15 Extension and Replacement

The public design must support replacement and extension through interfaces, factories, registration methods, and getter/setter service properties.

Supported extension points include:

- replacing any `DomServices` child service;
- replacing the complete `IDomDispatcherService`, including with a fully registered service such as the one supplied by `jivs-simpledom`;
- registering alternate dispatcher factories;
- implementing concrete dispatcher subclasses and `findConsumers()` methods for applications that do not use `jivs-simpledom`;
- supplying dispatcher-specific options through typed application wrappers while the core API keeps factory options opaque;
- replacing installer-owned factories;
- defining custom roles and presentation names;
- defining adapter-definition subclasses with constructor-supplied `adapterKey` values;
- creating custom adapters for widgets outside built-in HTML support;
- creating custom field and form presentations;
- replacing accessibility and error-message behavior.

The base package should avoid requiring applications to use SimpleDom attributes or a particular HTML layout. Changes to internal classes should not be required when an application only needs to replace an implementation behind a public interface. Registered adapter definitions must remain immutable after registration, while adapter, presentation, and other element-specific state belongs on the element or in the per-installation object that owns it. Dispatchers may retain configuration-specific state but must not retain discovered elements or element collections.

## D16 Non-Goals

The initial `jivs-dom` design does not include:

- client submission and server communication base classes;
- screen scraping or attribute discovery;
- a framework-specific integration such as Angular, React, or Vue;
- `contenteditable` as a built-in editor;
- arbitrary custom widgets as built-in support;
- multi-select support before the Jivs `MultiSelect` data type is defined;
- detailed ARIA policy before the broader presentation architecture is reviewed;
- NPM publishing workflow, CI commands, or repository migration steps.

These exclusions do not prevent future packages or integrations from building on the public interfaces defined here.

## D17 ARIA Service

ARIA support is a replaceable `DomServices` child service. Its detailed field/form methods and default policy remain to be designed after the broader architecture review, but the service has a formal place in the API:

```ts
interface IDomAriaService {
    // Field and form operations to be defined.
}
```

The service may eventually provide separate field and form operations. It must remain replaceable so applications can adapt ARIA behavior to their accessibility policy and widget semantics.
