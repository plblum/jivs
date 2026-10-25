# ElementRegistry, ElementCollector, and FormInstaller Design

## Overview

The DOM installation architecture separates discovery, retained form data, element installation, ARIA installation, and callback attachment into distinct responsibilities:

- `ElementCollector` discovers participating DOM elements and interprets the application’s markup convention.
- `ElementRegistry` stores the normalized element records associated with one `ValueHostsManager`.
- `FormInstaller` installs editors and presentations from the Registry and coordinates the complete installation sequence.
- `AriaService` enumerates the Registry to install static and validation-state ARIA updaters.
- `DispatcherService` attaches the `ValueHostsManager` callbacks independently of the instance `FormInstaller`.
- A static `FormInstaller.install()` utility combines element installation and dispatcher attachment for normal application setup.

## User-Facing Goal

The normal setup should make connecting Jivs to a form look straightforward:

1. Create the Jivs services.
2. Create the Rules and `ValueHostsManager`.
3. Install the form’s DOM behavior.
4. Load the initial values by running a Reader (`ModelReader`, `DictionaryReader`, `FormReader`, or `EditorReader`).
5. Establish its initial validation state. The Reader does this when it finishes.

The normal client setup is:

```ts
const services = createJivsServices('en-US');
const rules = new PersonFormRules(services);
const valueHostsManager = new ValueHostsManager(rules.configure());

FormInstaller.install(valueHostsManager, new PersonFormElementCollector());

const model = getPerson();
const reader = new ModelReader(valueHostsManager, model, {});
reader.read();  // also establishes initial validation state
```

The named `rules` variable keeps the form’s Rules visible without retaining a separate configuration variable.

The static operation is the recommended convenience API. It installs the elements and attaches the standard dispatchers. Its default behavior attaches validation dispatchers and text-value dispatching. Native-value dispatching remains disabled unless requested.

The same work can be controlled separately when needed:

```ts
const collector = new PersonFormElementCollector();
const installer = new FormInstaller(valueHostsManager, collector);
installer.install();

valueHostsManager.services.domServices.dispatchers.attach(
    valueHostsManager,
    true,
    false
);
```

Using `new FormInstaller()` is therefore fully supported. The static operation simply consolidates the normal sequence so applications do not have to reproduce it.

There is no expectation that the application retain the Collector or `FormInstaller` after installation.

The intended impression is that Jivs DOM installation is an ordinary form setup operation, not a framework-building exercise. `Making_Jivs_DOM_Setup_Approachable.md` develops this user-experience goal in more detail.

---

# ElementRegistry

## Purpose and Ownership

`ElementRegistry` stores the DOM elements collected for one `ValueHostsManager`.

It owns:

- the normalized installation records;
- Element Identifier to `IFieldValueHost | null` resolution;
- the case-insensitive Element Identifier index;
- assignment of an editor’s resolved installation anchor;
- purpose-specific runtime queries;
- insertion-order enumeration;
- releasing retained references during `clear()` and `dispose()`.

It does not:

- query the DOM;
- interpret HTML attributes;
- decide which elements participate;
- install adapters, presentations, or ARIA behavior;
- attach dispatchers;
- perform logging for unmatched Element Identifiers.

One `ElementRegistry` belongs to one `ValueHostsManager`. It is stored in the manager’s metadata and is disposed when the manager is disposed.

## Registry Record Categories

The Registry uses three record interfaces.

### Editor Record

```ts
interface IEditorElementRegistryRecord {
    readonly kind: 'editor';
    readonly role: 'editor';

    readonly elementIdentifier: string;
    readonly fieldValueHost: IFieldValueHost | null;

    readonly element: IJivsElement | null;
    readonly anchorElement: IJivsElement | null;

    readonly editorOptions: EditorInstallOptions | null;
}
```

`element` is the original top-level widget supplied by the Collector.

`anchorElement` is the element selected by `EditorInstaller` as the consistent installation anchor. It is initially `null` and is assigned after editor installation.

The original and anchor elements may be the same element.

### Field Record

```ts
interface IFieldElementRegistryRecord {
    readonly kind: 'field';
    readonly role: ElementRole | string;

    readonly elementIdentifier: string;
    readonly fieldValueHost: IFieldValueHost | null;

    readonly element: IJivsElement | null;

    readonly presentationOptions: FieldPresentationInstallOptions | null;
}
```

Field records represent labels, containers, error displays, required indicators, dedicated `aria-error` elements, and other field-oriented roles.

Several field records may share the same Element Identifier and role.

A field record does not imply that the element has a `FieldPresentation`. For example, `role: ElementRole.ariaError` is a field-oriented ARIA element but never has a `FieldPresentation`.

### Form Record

```ts
interface IFormElementRegistryRecord {
    readonly kind: 'form';
    readonly role: ElementRole | string;

    readonly elementIdentifier: null;
    readonly fieldValueHost: null;

    readonly element: IJivsElement | null;

    readonly presentationOptions: FormPresentationInstallOptions | null;
}
```

Form records represent Validation Summaries, submit controls, and other form-level roles.

### Consolidated Record Type

```ts
type ElementRegistryRecord =
    | IEditorElementRegistryRecord
    | IFieldElementRegistryRecord
    | IFormElementRegistryRecord;
```

The static `kind` values form the primary discriminant. Editor records also have the static role `'editor'`.

All public record properties are read-only. The Registry uses private, non-exported mutable implementations so it can assign an editor anchor and release references without allowing consumers to modify Registry state directly.

## Record Cardinality

A collected element has one Jivs role and therefore appears in at most one Registry record.

This does not make Element Identifier and role a unique key. Several different elements may have the same Element Identifier and role.

For example, two containers for `FirstName` may each produce a record with:

```ts
elementIdentifier: 'FirstName'
role: 'container'
```

Multiple field records with the same Element Identifier and role are valid.

One editor is expected for each Element Identifier. Multiple editor records for one Element Identifier are unsupported, but the Registry does not add defensive enforcement.

## Internal Storage

The Registry retains a master insertion-order array:

```ts
private readonly records: ElementRegistryRecord[] = [];
```

It also maintains a case-insensitive Element Identifier index:

```ts
interface ElementIdentifierRegistryEntry {
    readonly fieldValueHost: IFieldValueHost | null;
    readonly records: (IEditorElementRegistryRecord | IFieldElementRegistryRecord)[];
}

private readonly entriesByElementIdentifier =
    new Map<string, ElementIdentifierRegistryEntry>();
```

The entry combines:

- the cached `IFieldValueHost | null` resolution;
- every editor and field record associated with that Element Identifier.

The entry’s `records` array contains references to the same record objects stored in the master array. Records are not copied.

Form records are retained only in the master array because they have no Element Identifier.

The master array preserves Collector insertion order across every record category. The per-Identifier record arrays preserve insertion order among records for that field.

Insertion order determines:

- `FormInstaller` routing order;
- dispatcher query result order;
- ordering among multiple matching field presentations;
- first-match selection for singular ARIA elements.

The index prevents repeated full-array scans for runtime queries that begin with an Element Identifier. Additional indexes may be added later without changing the public contracts.

## Iterable Contract

`IElementRegistry` is directly iterable:

```ts
interface IElementRegistry extends Iterable<ElementRegistryRecord> {
    // Registry commands and queries.
}
```

This permits `FormInstaller` and `AriaService` to enumerate it directly:

```ts
for (const record of elementRegistry) {
    // Process the record.
}
```

Runtime dispatchers use purpose-specific query methods rather than direct enumeration.

## Adding Records

The Collector populates the Registry through three commands:

```ts
addEditor(element: IJivsElement, elementIdentifier: string, options?: EditorInstallOptions): void;

addField(element: IJivsElement, elementIdentifier: string, role: ElementRole | string, options?: FieldPresentationInstallOptions): void;

addForm(element: IJivsElement, role: ElementRole | string, options?: FormPresentationInstallOptions): void;
```

Only an Element Identifier is accepted for editor and field records. The Collector does not supply an `IFieldValueHost`.

`ElementRegistry` resolves the Element Identifier and assigns either the resulting `IFieldValueHost` or `null`.

The Registry retains an unmatched record. This allows later installation to report the specific element that could not be installed.

The Registry does not perform duplicate detection. Multiple records may share an Element Identifier and role.

## Element Identifier Resolution and Indexing

Dictionary keys are normalized case-insensitively:

```ts
private normalizeElementIdentifier(elementIdentifier: string): string {
    return elementIdentifier.toLowerCase();
}
```

The original Collector-supplied Element Identifier remains on each record for logging and debugging. Only index keys and query comparisons are normalized.

When the first editor or field record is added for an Element Identifier, the Registry resolves its FieldValueHost:

```ts
const fieldValueHost = this.valueHostsManager.getFieldByElementIdentifier(elementIdentifier);
```

It then creates the indexed entry:

```ts
const entry: ElementIdentifierRegistryEntry = {
    fieldValueHost,
    records: []
};
```

The new record is added to both:

- the master `records` array;
- the entry’s `records` array.

Later records with the same case-insensitive Element Identifier reuse the existing entry and its cached `fieldValueHost`, including a cached `null`.

This avoids converting the same Element Identifier to a FieldValueHost multiple times.

## ValueHostsManager Change

`ValueHostsManager.getFieldByElementIdentifier()` currently compares Element Identifiers case-sensitively. It must change to case-insensitive comparison.

The change applies whether the Element Identifier comes from:

- `FieldValueHostConfig.elementIdentifier`;
- `setElementIdentifier()`;
- the fallback `FieldValueHostConfig.name`.

Jivs does not support distinct fields whose Element Identifiers differ only by casing.

Conceptually, the existing comparison becomes:

```ts
fieldVh.getElementIdentifier().toLowerCase() === elementIdentifier.toLowerCase()
```

The Registry and `ValueHostsManager` must use the same case-insensitive semantics.

## Delayed Editor Anchor Assignment

`EditorInstaller` determines the installation anchor. `ElementRegistry` owns the resulting record mutation.

`IElementRegistry` exposes:

```ts
setEditorAnchorElement(record: IEditorElementRegistryRecord, anchorElement: IJivsElement): void;
```

`FormInstaller` uses it after editor installation:

```ts
const anchorElement = domServices.editorInstaller.install(
    record.fieldValueHost,
    record.element,
    record.editorOptions ?? undefined
);

elementRegistry.setEditorAnchorElement(record, anchorElement);
```

Passing the record identifies the exact editor row. An Element Identifier is not sufficient because the Registry does not enforce editor uniqueness.

Consumers continue to see `anchorElement` as read-only.

## IEditorInstaller Return-Type Change

`IEditorInstaller.install()` currently returns `void`. It must change to return the selected installation anchor:

```ts
install(
    valueHost: IFieldValueHost,
    element: IJivsElement,
    options?: EditorInstallOptions
): IJivsElement;
```

The concrete `EditorInstaller` must return the anchor on every successful path, including an idempotent path where the anchor was already installed.

This is a public contract change. It affects:

- `IEditorInstaller`;
- the standard `EditorInstaller`;
- custom `IEditorInstaller` implementations;
- mocks and test doubles;
- unit tests;
- API documentation.

## Purpose-Specific Queries

Queries return elements rather than complete Registry records unless a consumer requires additional information.

Multi-result queries return arrays. This matches the existing dispatcher `findElements()` pattern and avoids propagating `Iterable` through unrelated contracts.

```ts
getTextValueAdapterElements(elementIdentifier: string): IJivsElement[];

getValueAdapterElements(elementIdentifier: string): IJivsElement[];

getFieldPresentationElements(elementIdentifier: string): IJivsElement[];

getFormPresentationElements(): IJivsElement[];
```

Results preserve Registry insertion order.

Text-value and native-value queries return installed editor anchors for the requested Element Identifier.

The field-presentation query returns installed elements that may contain a field presentation for the requested Element Identifier. This includes an editor anchor when `EditorInstaller` installed an editor presentation.

Dedicated `aria-error` elements are excluded because they never have a field presentation.

The form-presentation query returns form-role elements in insertion order.

Dispatchers remain responsible for checking the applicable installed `IJivsElement` property before invoking it. A missing, `undefined`, or `null` capability remains a normal skip.

Each query is named for its consumer use case. The Registry does not expose one general filtering API that requires consumers to reproduce its selection rules.

## ARIA Query

The existing ARIA result contract remains in use:

```ts
interface IFieldAriaElementAnchors {
    readonly editorAnchor: IJivsElement | null;
    readonly errorMessageElement: IJivsElement | null;
    readonly errorMessageRole: ElementRole.error | ElementRole.ariaError | null;
}
```

The Registry exposes:

```ts
getFieldAriaElementAnchors(elementIdentifier: string): IFieldAriaElementAnchors;
```

The query:

1. Selects the first matching editor record and returns its installed `anchorElement`.
2. Selects the first matching `aria-error` field record when present.
3. Otherwise selects the first matching `error` field record.
4. Returns the selected error element and its role.
5. Returns null properties when no corresponding installed element is available.

The returned error role tells `AriaService` which registered updater applies.

Additional matching editors remain unsupported behavior and are ignored by the singular ARIA query.

Additional matching `error` elements remain available to presentation dispatchers. ARIA selects only the first applicable error-message element.

`AriaService.applyValidationState()` uses this query in place of its former DOM lookup.

## Resolved Fields Query

The Element Identifier index also provides the fields represented by the current Registry:

```ts
getResolvedElementIdentifiers(): IFieldValueHost[];
```

It returns the non-null entry values in first-Identifier insertion order.

Because Element Identifiers are case-insensitive and each field has one logical Element Identifier, the index already provides one entry per represented field. No additional `Set<IFieldValueHost>` is required.

`FormInstaller` uses this query for initial dynamic ARIA processing.

## Clear

`clear()` prepares the Registry for complete repopulation:

1. Null every retained `element`.
2. Null every retained editor `anchorElement`.
3. Null every retained record’s `fieldValueHost`.
4. Null retained options objects.
5. Clear the master record array.
6. Clear the Element Identifier index.

The Registry remains usable and retains its `ValueHostsManager`.

Explicitly nulling record references allows DOM elements, anchors, FieldValueHosts, and option-owned objects to become eligible for garbage collection even if an old record object is temporarily retained elsewhere.

## Dispose

`dispose()` performs the same reference release as `clear()`, then releases the Registry’s `ValueHostsManager` and any other owned references.

The Registry is unusable after disposal.

`ValueHostsManager.dispose()` invokes `dispose()` on metadata values that provide that method. This disposes the stored Registry automatically.

---

# Registry Access Through JivsDomServices

`IJivsDomServices` provides get-or-create access:

```ts
getElementRegistry(valueHostsManager: IValueHostsManager): IElementRegistry;
```

`JivsDomServices` provides a protected creation hook:

```ts
protected createDefaultElementRegistry(valueHostsManager: IValueHostsManager): IElementRegistry;
```

`getElementRegistry()`:

1. Checks the manager’s metadata for its existing Registry.
2. Returns that Registry when present.
3. Otherwise creates the default Registry.
4. Stores it in manager metadata.
5. Returns it.

`IJivsDomServices` remains stateless with respect to individual forms. The manager owns the per-form Registry through metadata.

The protected creation hook permits a `JivsDomServices` subclass to supply another Registry implementation without changing Registry consumers.

---

# ElementCollector

## Purpose

`ElementCollector` discovers and interprets DOM elements for one installation.

It knows the application’s discovery convention, including:

- which elements participate;
- each element’s Element Identifier;
- each element’s role;
- presentation and editor options;
- which error and `aria-error` elements should be registered.

It does not:

- retain form runtime state;
- resolve Element Identifiers to FieldValueHosts;
- install adapters or presentations;
- attach dispatchers;
- install ARIA behavior;
- clear the Registry;
- perform logging.

The Collector supplies discovery results directly to `IElementRegistry`.

For error-message elements, the Collector determines which available elements participate. It may register:

- a visible error display using `role='error'`;
- a dedicated ARIA error-message element using `role='aria-error'`;
- both when both elements exist.

The Registry and `AriaService` later select the appropriate ARIA error-message host.

## Contract

```ts
interface IElementCollector {
    collect(root: HTMLElement, registry: IElementRegistry): void;
}
```

The same Collector instance could technically be reused because it retains no form runtime state.

Normal usage creates the Collector together with the installation operation. There is no expectation that the application retain it.

## Base Class

```ts
abstract class ElementCollectorBase implements IElementCollector {
    public collect(root: HTMLElement, registry: IElementRegistry): void {
        this.collectElements(root, registry);
    }

    protected abstract collectElements(root: HTMLElement, registry: IElementRegistry): void;
}
```

Subclasses use the supplied Registry directly:

```ts
protected collectElements(root: HTMLElement, registry: IElementRegistry): void {
    const editor = root.querySelector('[data-field="FirstName"][data-jivs-role="editor"]');

    if (editor instanceof HTMLElement) {
        registry.addEditor(editor, 'FirstName');
    }
}
```

`ElementCollectorBase` does not wrap `registry.addEditor()`, `registry.addField()`, or `registry.addForm()` with equivalent `this.add...()` methods. The explicit Registry dependency remains visible to the subclass.

## Custom Collectors

An application using `jivs-dom` directly creates a Collector for its form:

```ts
class PersonFormElementCollector extends ElementCollectorBase {
    protected collectElements(root: HTMLElement, registry: IElementRegistry): void {
        // Application-specific discovery and Registry population.
    }
}
```

Constructor dependencies may describe discovery policy, selector conventions, or application services.

A Collector must not retain DOM elements, a `ValueHostsManager`, an `ElementRegistry`, or other form runtime state after collection.

## SimpleDom Collector

`jivs-simpledom` supplies its own Collector implementation.

It screen-scrapes the complete resolved form container and interprets the SimpleDom attributes. Every installation starts from an empty Registry and completely repopulates it.

The SimpleDom Collector may register both:

- the visible field error element with role `error`;
- the dedicated ARIA error-message element with role `aria-error`.

## Collector Failures

The Collector has no logging dependency.

A Collector implementation may throw when discovery or interpretation fails. `FormInstaller` catches the failure, logs it through Jivs services, and rethrows it.

An unmatched Element Identifier is not a Collector failure. The Registry stores the record with `fieldValueHost: null`, and `FormInstaller` handles it during installation.

---

# FormInstaller

## Responsibilities

The instance `FormInstaller` coordinates one complete element installation.

It owns:

- obtaining the Registry;
- clearing the Registry;
- resolving the form container;
- invoking the Collector;
- enumerating Registry records for editor and presentation installation;
- routing each applicable record to the appropriate specialized installer;
- recording editor anchors;
- warning about unmatched field records;
- asking `AriaService` to install ARIA behavior from the completed Registry;
- performing initial dynamic ARIA processing;
- logging and rethrowing installation failures.

It does not:

- attach dispatchers;
- select or execute ARIA updaters itself;
- route `aria-error` elements through `FieldPresentationInstaller`.

## Constructor and Instance Operation

```ts
class FormInstaller {
    public constructor(
        private readonly valueHostsManager: IValueHostsManager,
        private readonly collector: IElementCollector
    );

    public install(): void;
}
```

`FormInstaller` obtains `IJivsDomServices` from:

```ts
valueHostsManager.services.domServices
```

It does not receive a separate `IJivsDomServices` constructor parameter.

## Container Resolution

`FormInstaller` does not accept a root override.

It resolves the installation root through:

```ts
domServices.resolveContainerElement(valueHostsManager)
```

The existing `JivsDomServices.resolveContainerElement()` behavior remains authoritative:

- return the configured container when found;
- log a warning when a configured identifier does not resolve to an `HTMLElement`;
- fall back to `document.body`.

`FormInstaller` requires no separate container-resolution failure branch.

## Instance Installation Workflow

`install()` performs these steps:

1. Obtain or create the manager’s `ElementRegistry`.
2. Clear the Registry.
3. Resolve the container element.
4. Invoke the supplied Collector.
5. Enumerate the Registry once for editor and presentation installation.
6. Record each editor’s returned anchor.
7. Ask `AriaService` to enumerate the completed Registry and install ARIA behavior.
8. Obtain the distinct resolved FieldValueHosts from the Registry.
9. Apply initial dynamic ARIA state once per resolved field.
10. Return successfully.

The editor and presentation routing is a single pass. ARIA installation is a separate responsibility and independently enumerates the Registry after editor anchors and presentations are ready.

## Single-Pass Editor and Presentation Routing

`FormInstaller` performs one routing pass:

```ts
for (const record of elementRegistry) {
    switch (record.kind) {
        case 'editor':
            // Invoke EditorInstaller and record its anchor.
            break;

        case 'field':
            // Invoke FieldPresentationInstaller when the role supports presentation.
            break;

        case 'form':
            // Invoke FormPresentationInstaller.
            break;
    }
}
```

No separate editor, field-presentation, and form-presentation passes are required.

ARIA installation does not occur through these presentation installer calls.

## Editor Records

When `fieldValueHost` and `element` are non-null, `FormInstaller` calls `EditorInstaller`.

`EditorInstaller` receives the original top-level widget. It selects and returns the installation anchor.

```ts
const anchorElement = domServices.editorInstaller.install(
    record.fieldValueHost,
    record.element,
    record.editorOptions ?? undefined
);

elementRegistry.setEditorAnchorElement(record, anchorElement);
```

One editor is expected for each Element Identifier. If the Collector supplies multiple editor records, installation and dispatcher queries may process them, but the behavior is unsupported and the Registry does not defend against it.

## Field Records

When `fieldValueHost` and `element` are non-null, `FormInstaller` routes presentation-capable field roles through `FieldPresentationInstaller`.

```ts
domServices.fieldPresentationInstaller.install(
    record.fieldValueHost,
    record.element,
    record.role,
    record.presentationOptions ?? undefined
);
```

`role: ElementRole.ariaError` is excluded from this call.

A dedicated `aria-error` element:

- has no `FieldPresentation`;
- is not processed by `FieldPresentationInstaller`;
- participates only in ARIA installation and later ARIA validation-state processing.

Other field records remain eligible for `FieldPresentationInstaller` according to their role and options.

## Form Records

When `element` is non-null, `FormInstaller` calls `FormPresentationInstaller`.

```ts
domServices.formPresentationInstaller.install(
    valueHostsManager,
    record.element,
    record.role,
    record.presentationOptions ?? undefined
);
```

Form records do not require a FieldValueHost.

ARIA installation remains separate from form presentation installation.

## ARIA Installation

After editor and presentation installation completes, `FormInstaller` asks `AriaService` to install ARIA behavior from the completed Registry.

The service contract includes an installation operation conceptually equivalent to:

```ts
install(elementRegistry: IElementRegistry): void;
```

`AriaService` enumerates the Registry and applies the established ARIA selection rules.

For each applicable element, ARIA installation:

1. Selects the applicable `IAriaStaticUpdater`.
2. Immediately executes that static updater.
3. Selects the applicable `IAriaValidationStateUpdater`.
4. Assigns the selected updater, or `null`, to `IJivsElement.jivsAriaValidationStateUpdater`.

ARIA installation uses an editor’s resolved `anchorElement`, not necessarily its original element.

`FieldPresentationInstaller` and `FormPresentationInstaller` do not execute static ARIA updaters and do not assign `jivsAriaValidationStateUpdater`.

A dedicated `aria-error` element is installed entirely through this ARIA path.

## Unmatched Field Records

When an editor or field record has `fieldValueHost === null`, `FormInstaller`:

1. Skips editor or presentation installation for that record.
2. Logs a warning containing the Element Identifier, kind, role, and element.
3. Continues with later records.

Warnings occur per skipped record. Several elements using the same unmatched Element Identifier therefore produce several warnings because each represents a separate installation that could not occur.

`AriaService` cannot install field-specific ARIA behavior for an unmatched record.

Form records are unaffected because their null `fieldValueHost` is expected.

## Initial Dynamic ARIA

After ARIA installation completes, `FormInstaller` obtains:

```ts
elementRegistry.getResolvedElementIdentifiers()
```

It then requests initial validation-state synchronization:

```ts
for (const fieldValueHost of elementRegistry.getResolvedElementIdentifiers()) {
    domServices.ariaService?.applyValidationState(
        fieldValueHost,
        fieldValueHost.currentValidationState
    );
}
```

This runs once per represented field after:

- editors have been installed;
- presentations have been installed;
- editor anchors have been recorded;
- static ARIA updaters have run;
- validation-state ARIA updaters have been attached to the applicable `IJivsElement` instances.

It also runs during repeated `install()` calls even when individual installers determine that their work was previously completed.

## Later Dynamic ARIA

Later validation-state changes are initiated by `FieldValidationStateDispatcher`.

For a field validation-state callback, the dispatcher:

1. Applies the installed `FieldPresentation` objects for the field.
2. Calls `AriaService.applyValidationState()`.
3. `AriaService` obtains the selected editor and error-message elements from `ElementRegistry`.
4. `AriaService` executes the installed `IAriaValidationStateUpdater` behavior.

`FieldPresentation` does not invoke ARIA updaters.

The dispatcher initiates ARIA validation-state processing, while `AriaService` selects and executes the updater attached to each applicable `IJivsElement`.

## Failure Behavior

If the Collector, an element installer, or ARIA installation throws:

1. `FormInstaller` logs the failure.
2. `FormInstaller` rethrows it.
3. Installation stops immediately.
4. No guarantee is made about the partially installed DOM or partially populated Registry.
5. The application is expected to stop rather than permit interaction with an indeterminate form.

The Registry is not cleared a second time after failure.

---

# Consolidated Static Installation

## Purpose

The instance `FormInstaller` remains concerned with collection and DOM installation.

A static utility provides the normal one-call application setup:

```ts
public static install(
    valueHostsManager: IValueHostsManager,
    collector: IElementCollector,
    useTextValue = true,
    useValue = false
): void;
```

Normal usage is:

```ts
FormInstaller.install(valueHostsManager, new PersonFormElementCollector());
```

To enable native-value dispatching as well:

```ts
FormInstaller.install(valueHostsManager, new PersonFormElementCollector(), true, true);
```

The standalone Boolean parameters are intentional. Their declared defaults make the standard behavior visible without requiring the developer to inspect an options interface.

## Static Workflow

The static operation:

1. Constructs an instance `FormInstaller`.
2. Calls the instance `install()`.
3. Calls `DispatcherService.attach()` after successful DOM installation.

Conceptually:

```ts
public static install(
    valueHostsManager: IValueHostsManager,
    collector: IElementCollector,
    useTextValue = true,
    useValue = false
): void {
    const installer = new FormInstaller(valueHostsManager, collector);
    installer.install();

    valueHostsManager.services.domServices.dispatchers.attach(
        valueHostsManager,
        useTextValue,
        useValue
    );
}
```

Element and ARIA installation occur before dispatcher attachment. No dispatcher callback can therefore encounter an element before its adapters, presentations, and ARIA updaters have been installed.

Dispatcher attachment occurs before `ModelReader.read()`, allowing initial formatted Text Values to reach the installed editors.

If instance installation throws, the static operation never reaches dispatcher attachment.

## Advanced Setup

Applications requiring separate control may use the two operations independently:

```ts
const collector = new PersonFormElementCollector();
const installer = new FormInstaller(valueHostsManager, collector);
installer.install();

valueHostsManager.services.domServices.dispatchers.attach(
    valueHostsManager,
    true,
    false
);
```

This preserves the independent `DispatcherService` controls while giving normal applications a concise setup operation.

## Repeated Installation

Calling `install()` again:

1. Clears the existing Registry and releases its retained references.
2. Recollects the complete form.
3. Reprocesses every Registry record.
4. Relies on the specialized installers’ existing idempotence checks.
5. Reinstalls any incomplete ARIA behavior.
6. Reapplies initial dynamic ARIA state.

No separate `refresh()` operation is included in this phase.

`DispatcherService` owns a single `dispatchersAttached` state value in `ValueHostsManager` metadata. The static utility always calls `attach()`, but later calls become no-ops after the standard dispatcher set has already been attached.

The options supplied on the first standard `attach()` call determine which optional value-change dispatchers are attached.

---

# Dispatcher Responsibilities

`DispatcherService.attach()` always attaches:

- field validation-state dispatching;
- form validation-state dispatching.

Its optional parameters control:

- text-value dispatching;
- native-value dispatching.

```ts
dispatchers.attach(valueHostsManager, useTextValue, useValue);
```

`DispatcherService`, not `FormInstaller`, owns the attachment-state flag.

It does not inspect callback chains to determine whether a previous callback belongs to Jivs DOM. Existing application callbacks remain composed before the DOM dispatcher callback.

The individual dispatcher attachment methods remain public for advanced use. Mixing those methods with the standard `attach()` operation may create duplicate category attachment and remains the caller’s responsibility.

---

# Complete Setup Example

The resulting client-side setup is:

```ts
const services = createJivsServices('en-US');

const rules = new PersonFormRules(services);
const valueHostsManager = new ValueHostsManager(rules.configure());

FormInstaller.install(
    valueHostsManager,
    new PersonFormElementCollector(),
    true,
    false
);

const model = getPerson();
const reader = new ModelReader(valueHostsManager, model, {});
reader.read();  // also establishes the initial validation state
```

The sequence is:

1. Create `JivsServices`.
2. Create the form’s Rules.
3. Configure and create the `ValueHostsManager`.
4. Collect the form’s DOM elements.
5. Install editors and presentations.
6. Install static and validation-state ARIA updaters.
7. Apply initial dynamic ARIA state.
8. Attach validation and selected value-change dispatchers.
9. Load the initial values by running a Reader. Which Reader depends on where the values are (see the next section).
10. Allow the attached text-value dispatcher to synchronize formatted values into the installed editors. Applies when the Reader writes to the ValueHosts from outside the form (`ModelReader`, `DictionaryReader`, `FormReader`).
11. The Reader establishes the initial validation state by calling `valueHostsManager.validate({ preliminary: true })` after it finishes, unless `options.preliminaryValidation` is `false`.

---

# Loading Initial Values: Choosing a Reader

Every value lives in two places: the form's editors and the `FieldValueHost`s. Before the user is involved, one side has to be loaded from the other. Each Reader below does that for one source. All of them derive from `ReaderBase`, so setup follows the same three steps:

1. Create the Reader.
2. Call `read()`.
3. Preliminary validation runs inside `read()`.

`ReaderOptions.preliminaryValidation` defaults to `true`. Set it to `false` only when you will call `valueHostsManager.validate({ preliminary: true })` yourself, such as after running several Readers in a row.

## Where Do the Initial Values Come From?

| Source of values | Reader | Package | Direction | Needs dispatchers attached? |
|---|---|---|---|---|
| A model object | `ModelReader` | jivs-engine | model → ValueHosts → editors | Yes, the text-value dispatcher fills the editors. Formatters are required. |
| A dictionary | `DictionaryReader` | jivs-engine | dictionary → ValueHosts → editors | Same as `ModelReader` |
| Text values (an HTTP form post) | `FormReader` | jivs-engine | text → ValueHosts (parsed) → editors | Same as `ModelReader`. Parsers are required. |
| Values already in the HTML (`value`, `checked`, `selected`) | `EditorReader` | jivs-dom | editors → ValueHosts | No. It does not need them to move values into the ValueHosts. |

`EditorReader` is the only Reader that moves values from the form to the ValueHosts. It asks each field's installed `IEditorAdapterDefinition` to do the transfer, so each editor type keeps ownership of how its value is read, parsed, and reported (including an `InjectedError` for text that fails to parse). It is a model-free case: there is no model to combine with the HTML values.

`EditorReader` calls `sendValue(valueHost, editor, jivsElement, false, false)`. This is the same method the editors' event handlers use, except that `validate` is `false`, so every field is transferred first and `read()` validates once at the end. That means fewer updates to the shared Validation Summary.

`EditorReader` does not require dispatchers to read editor values. It sends values with `skipValueChangedCallback: true`, so an attached text-value dispatcher does not write the text back to the editor the value came from. Reformatting on read (`reformatTextValue`) is not supported by `EditorReader`.

## Startup Code Compared

Each example assumes the services, rules and `ValueHostsManager` have been created as shown above.

### Model

```ts
FormInstaller.install(valueHostsManager, new PersonFormElementCollector());

const reader = new ModelReader(valueHostsManager, getPerson());
reader.read();
```

### Dictionary

```ts
FormInstaller.install(valueHostsManager, new PersonFormElementCollector());

const reader = new DictionaryReader(valueHostsManager, { firstName: 'Ann', age: 42 });
reader.read();
```

### Form post (text values)

```ts
FormInstaller.install(valueHostsManager, new PersonFormElementCollector());

const reader = new FormReader(valueHostsManager, formData, { reformatTextValue: true });
reader.read();
```

### Values already in the HTML

```ts
FormInstaller.install(valueHostsManager, new PersonFormElementCollector());

const reader = new EditorReader(valueHostsManager);
reader.read();
```

### Several Readers, validating once

```ts
FormInstaller.install(valueHostsManager, new PersonFormElementCollector());

new ModelReader(valueHostsManager, getPerson(), { preliminaryValidation: false }).read();
new EditorReader(valueHostsManager, { preliminaryValidation: false }).read();
valueHostsManager.validate({ preliminary: true });
```

Use this only when each field has one source. If two Readers supply the same field, the last one wins.

### Setting values by hand

When the application calls `FieldValueHost.setValue()`, `setTextValue()` or `setValues()` directly, it controls the options. Pass `validate: false` for each call, then finish with:

```ts
valueHostsManager.validate({ preliminary: true });
```

## What `validate({ preliminary: true })` Does

- Fields whose `ValidationStatus` is `NotAttempted` or `NeedsValidation` are validated. Fields that were already validated are skipped.
- Within a `FieldValueHost`, validators with `Category=Require` are skipped. The user has not had a chance to supply input yet.

Because already-validated fields are skipped, the same call also works after replacing part of the form. Install the new HTML, run a Reader for it, and only the replaced editors are affected. Fields outside the replaced part keep their state.

## Required Order

1. `FormInstaller.install()` installs the editors, presentations, and ARIA, and attaches the dispatchers.
2. Run the Reader.

`EditorReader` logs a Warn for each field with no editor element, or with an element that `EditorInstaller` has not finished, and continues with the remaining fields. If the Reader runs before installation, expect one Warn per field.

## Configuration Errors to Expect

- Moving values from a ValueHost to an editor needs a `DataTypeFormatter` registered in the services for the field's data type. A missing one is a configuration error and is logged.
- `FormReader` and any editor that parses text need a `DataTypeParser` for the data type.

## Notes

- `reset` is not part of `EditorReader`. Resetting a field's `ValidationStatus` to `NotAttempted` is for a complete first load. A partial replacement of the form must not reset other fields.
- Only the first editor element registered for a field is read. A radio group counts as one element.
- Reformatting text after the user types (`reformatTextValue`, `disableFormattingOnValueChange`) belongs to the user-driven part of the lifecycle and is not part of loading initial values.