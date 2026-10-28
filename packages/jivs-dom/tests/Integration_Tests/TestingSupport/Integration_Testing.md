# Jivs-DOM Integration Testing

**Developer and AI usage guide — initial draft, 22 October 2026**

> Status: The companion `Integration_Testing.ts` and `Integration_Testing.test.ts` files are an initial implementation. This guide documents their current public API and the agreed testing intent. **See “Known implementation gaps” before adopting this code in the repository.** Do not interpret current unit-test success as proof that FormInstaller scenarios are fully covered.

## Purpose and scope

`Integration_Testing.ts` is test-only infrastructure for Jivs-DOM. It builds realistic HTML test pages, associates expected installation results with elements, and checks the results produced by `FormInstaller` against the corresponding `IJivsElement` properties and `ElementRegistry` records.

The suite focuses on whether generated markup is interpreted and installed correctly. It is **not** intended to retest the internal behavior of editor adapters, presentations, ARIA updaters, or the element registry itself. Later test phases may add validation-state and DOM-replacement scenarios.

The infrastructure is supplied in two TypeScript files:

- `Integration_Testing.ts`: public helpers, descriptors, and runner.
- `Integration_Testing.test.ts`: Jest tests of those helpers.

This Markdown file is the usage documentation for developers and coding assistants.

## Architecture

| Type | Responsibility |
| --- | --- |
| `IntegrationTestContext` | Shared `IValueHostsManager` and its DOM services, unique ID counter, current container identifier, optional runner, shared failure array. |
| `TestHtmlBuilder` | Mutable, fluent HTML composition; creates descriptors for Jivs-role elements and registers them with the runner when present. |
| `RoleTestDescriptorBase` | Stores expectations and implements common result checks and structured failure reporting. |
| Role descriptors | Implement role-specific checks for editor, label, required, error, aria-error, fieldcontainer, summary, and submit. |
| `IntegrationTestRunner` | Collects descriptors, selects the manager's container group, retrieves elements and registry records, and ends with one Jest assertion. |
| `TestFailure` | Structured, machine-readable assertion failure containing identification, property path, message, expected and actual values. |

The concrete descriptor names are `EditorTestDescriptor`, `LabelTestDescriptor`, `RequiredTestDescriptor`, `ErrorTestDescriptor`, `AriaErrorTestDescriptor`, `FieldContainerTestDescriptor`, `SummaryTestDescriptor`, and `SubmitTestDescriptor`. Two additional abstract classes (`FieldRoleTestDescriptor`, `FormRoleTestDescriptor`) share implementation across role groups; they do not change the public role model.

## Setup and normal workflow

1. Create the real Jivs services (`createJivsServicesForTesting`). The `ValueHostsManager` comes later, because its rules depend on the fields the page uses.
2. Create an `IntegrationTestContext(services.domServices)` and an `IntegrationTestRunner(context)` **before creating role elements**. The runner sets `context.runner` and receives newly generated descriptors.
3. Create `TestHtmlBuilder(context)` and compose a form and its children. Use `build()` to obtain the HTML string. Insert it into the JSDOM `document`.
4. Use the jivs SimpleDOM syntax in the HTML for the test. Always omit the id attribute on any tag with data-jivs-role attribute.
5. Use SimpleDomElementCollector as the ElementCollector.
6. Run `FormInstaller` with the prepared manager and an element collector. The collector must populate the registry from the markup; the test descriptors are **not** a substitute for the collector.
7. Call `runner.assertFormInstallation(document, valueHostsManager)` after installation. The runner accesses `domServices.getElementRegistry(valueHostsManager)`.

Illustrative usage (adapt imports and manager creation to the repository):

```ts
const jivsServices = createJivsServicesForTesting(options);
const context = new IntegrationTestContext(jivsServices.domServices);
const runner = new IntegrationTestRunner(context);
const page = new TestHtmlBuilder(context);
const form = page.form('customer-form');
form.label('firstName', 'First name');
form.inputEditor('firstName');
form.errorDisplay('firstName');
form.submit();

page.assign();   // builds and writes to document.body; pass a Document or HTMLElement to target another

// Create the manager after the page, when the field names are known (context.fieldNames
// lists names passed to field()). Hand-built fields like above need their rules written by you.
const rules = new MyModelValueHostsRules(jivsServices);
const vhm = new ValueHostsManager(rules.configure());
const collector = new SimpleDomElementCollector();
new FormInstaller(vhm, collector).install();
runner.assertFormInstallation(document, vhm);
```

The example's `MyModelValueHostsRules` is application-specific. `createJivsServicesForTesting()` configures real engine and DOM services; `SimpleDomElementCollector` reads the rendered markup.

## Typical test file (`createTestForm`)

Most tests should not repeat the steps above. `TestingSupport/CreateTestForm.ts` does them in the right order (page first, then rules and manager), and `TestingSupport/TestFileSupport.ts` handles file setup.

```ts
/** @jest-environment jsdom */
import { createTestForm, createTestPage } from './TestingSupport/CreateTestForm';
import { testEachIdentity, useCleanDocument } from './TestingSupport/TestFileSupport';

// When true, emits HTML and element registry information to the console.
let verbose = false;
useCleanDocument();   // empties document.body after each test

test('Text_Required installs', () =>
{
    const t = createTestForm({ fields: ['Text_Required'], verbose: verbose });
    t.runner.assertFormInstallation(document, t.vhm);
    expect(t.services.loggingService.entryCount).toBe(0);
});
```

Keep `let verbose` in each file and pass it to every `createTestForm`, so one file can be switched on without touching the others.

### `createTestForm(options)`

- **Source (exactly one):** `fields` (Field Identity names, using `fieldTemplate` or per-field `fieldTemplates`), `build(page)` (a `TestHtmlBuilder` callback) or `formTemplate` (a registered form template).
- **Other options:** `repository`, `services` (merged over the defaults, which include real parsers, formatters, conditions, the AriaService and `loggerLevel: Warn`), `formId`, `formAttributes`, `initialValues`, `install` (default `true`), `verbose`, `containerIdentifier` and `configure(config)`.
- `initialValues` is a map keyed by Field Identity name. It places a value into the generated editor before collection: text, number, and date inputs receive a `value`; checkboxes are checked only for `true`; select and radio editors select the matching option. Use strings for text-formatted values and numbers/booleans when those are the field's native type. For example, `createTestForm({ fields: ['Text_Required', 'Checkbox'], initialValues: { Text_Required: 'Ann', Checkbox: true } })`.
- `install: false` builds nothing in the document. Call `t.page.assign()`, then `t.install()` or `t.collect()`. Use it when the test needs the page before installation, or only the collector.
- `containerIdentifier` (an `#id` selector unless `formId` is given) scopes the manager to that container and prefixes generated ids. `configure` receives a copy of the manager config for last-moment changes; replace nested objects rather than editing them.

### `TestForm` members

| Member | Purpose |
|---|---|
| `services`, `config`, `vhm`, `context`, `runner`, `page`, `collector` | The pieces created for the test. |
| `registry` | The manager's `ElementRegistry`. |
| `install()` | Runs `FormInstaller` (clears and rebuilds the registry). |
| `collect()` | Runs only the collector on the manager's container (clears and rebuilds the registry). |
| `element(role, fieldName?)` | First element with that `data-jivs-role` (and `data-field`) inside the container. Throws if none. |
| `recordFor(element)` | Registry record, or `null`. |
| `editorOf(fieldName)` | The installed `IJivsElement` of the field's editor. Throws if missing or not installed. |
| `replace(oldElement, build)` | AJAX-style replacement: removes descriptors in the old subtree, builds with the same context, replaces the children. Follow with `install()` or `collect()`. |

When a test is about how a selector maps to a record, write the `querySelector` in the test; it documents the pattern. Use `element()` for routine lookups.

### Assertions

- `runner.assertCollection(document, vhm)` checks the registry only, for tests that stop after the collector (`install: false` plus `collect()`). It does not examine `IJivsElement` properties.
- `runner.assertFormInstallation(document, vhm)` checks the registry and everything installed.
- `runner.describeRegistry(vhm)` returns a text listing of the registry, useful for comparing before and after. `runner.dumpRegistry(vhm)` prints it. With `verbose` on, `assign()` prints the HTML and the assert methods print the registry.

### Several forms on one page

Each `createTestForm` call is one form with its own manager and services. Give each a `containerIdentifier` and `install: false`, then join them:

```ts
const a = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
const b = createTestForm({ fields: ['Checkbox'], containerIdentifier: '#two', install: false, verbose: verbose });
const page = createTestPage(a, b);   // writes both forms to document.body
page.install();                      // or page.collect(); each form uses its own container
```

### Sweeps

`testEachIdentity(title, run)` and `testEachFieldTemplate(title, run)` run the test for every identity or template in the repository (`%s` in the title shows the name), so newly registered ones are covered automatically.

### Logging

The default logger level is Warn, so installer warnings are captured by `t.services.loggingService` (`TestingLoggingService`). Use `entryCount`, `findMessage` and `containsLog` to assert them.

## `IntegrationTestContext`

```ts
new IntegrationTestContext(domServices: IJivsDomServices)
```

Key members:

- `domServices`: used to resolve expected adapter definitions and presentations and to access the registry. The context does not need a manager, so the page can be built first.
- `fieldNames`: names passed to `field()`, once each, in first-use order. Feeds the rules.
- `currentFieldName`: the innermost `field()` being built, or `null`. Role methods (`label`, `inputEditor`, `errorDisplay`, `fieldContainer`, etc.) accept `null` as the field name to use it; they throw if there is no current field. An explicit name always wins. `withField(name, run)` records the name, pushes it on a stack, runs, and pops in a `finally`, so a parent's name is restored after a nested field.
- `runner`: initially `null`; populated by `new IntegrationTestRunner(context)`.
- `containerIdentifier`: mutable `string | null`, initially `null`. The descriptor captures its value when it is constructed.
- `failures`: shared `TestFailure[]`; the runner clears it **in place** (`length = 0`) at the start of each complete assertion operation.
- `nextId(base)`: appends a sequential numeric suffix, starting at 1, shared by all builders with this context.

Use one shared context to compose a test document, including nested or appended builders. Reusing a builder fragment without regenerating it can duplicate HTML IDs; the implementation does not guard against this.

## `TestHtmlBuilder` reference

Every role method writes markup immediately to an internal sequence and returns `this`, except `fieldContainer()` and `form()`, which return **child builders**. `build()` recursively assembles the current sequence and does not generate new descriptors or IDs. `children()` stores a live child-builder reference, so additions to the child appear on subsequent builds.

### General composition

| Method | Result |
| --- | --- |
| `raw(html)` | Append literal HTML; no descriptor. |
| `append(builder)` | Append another builder by reference; no enclosing tag. |
| `children(tagName, attributes = '')` | Add an enclosing tag and return a child builder. |
| `setContainerIdentifier(value)` | Set `context.containerIdentifier` and return `this`. |
| `build()` | Return assembled HTML string. |
| `form(id = 'test-form', additionalAttributes = '')` | Emit `<form id='…' novalidate>` and return child builder; does **not** change container identifier. |

### Editor methods

| Method | Significant parameters and defaults |
| --- | --- |
| `editor(tagName, fieldName, adapterKey, presentationName = null, additionalAttributes = '', explicitAdapterKey = false)` | Generic element, opening and closing tag; emits explicit adapter attribute only when requested. |
| `inputEditor(fieldName, type = 'text', presentationName = null, adapterKey = null, additionalAttributes = '')` | Native `<input>`; expected key `input:${type}` unless overridden. |
| `checkboxEditor(fieldName, presentationName = null, adapterKey = null, additionalAttributes = '')` | `<input type='checkbox'>`. |
| `fileInputEditor(fieldName, presentationName = null, adapterKey = null, additionalAttributes = '')` | `<input type='file'>`. |
| `radioEditor(fieldName, groupName, values, presentationName = null, adapterKey = null, additionalAttributes = '', selectedValue?)` | Multiple radio inputs, one carrying Jivs-role attributes. `groupName` is mandatory; an optional `selectedValue` marks the matching input checked. |
| `textAreaEditor(fieldName, presentationName = null, adapterKey = null, additionalAttributes = '')` | `<textarea>`. |
| `selectEditor(fieldName, options, presentationName = null, adapterKey = null, additionalAttributes = '', selectedValue?)` | `<select>` with `{ value, text }[]` options; an optional `selectedValue` marks the matching option selected. |

The default expected adapter key exists for descriptor checks even when `data-jivs-adapterkey` is absent from markup. Specialized methods emit that attribute when the caller explicitly supplies `adapterKey`. Native void elements are rendered as opening tags only; the generic `editor()` emits opening and closing tags.

### Field-role methods

| Method | Result |
| --- | --- |
| `label(fieldName, content, presentationName = null, additionalAttributes = '')` | `<label>`; `content` may contain HTML. Does not generate a `for` attribute. |
| `requiredIndicator(fieldName, content = '', presentationName = null, additionalAttributes = '')` | `<span>` for required indicator content. |
| `errorDisplay(fieldName, presentationName = null, additionalAttributes = '')` | Empty `<div>`; presentation later supplies content. |
| `ariaError(fieldName)` | Empty `<div class='jivs-visually-hidden'>`; no additional attributes parameter. |
| `fieldContainer(fieldName, presentationName = null, additionalAttributes = '', tagName = 'div')` | Enclosing fieldcontainer element; returns a child builder. |

### Form-role methods

| Method | Result |
| --- | --- |
| `validationSummary(presentationName = null, validationGroup = null, additionalAttributes = '', tagName = 'div')` | Empty summary element. |
| `submit(presentationName = null, validationGroup = null, content = 'Submit', additionalAttributes = '', useButton = false)` | By default `<input type='submit' value='Submit'>`; with `useButton = true`, `<button type='submit'>…</button>`. |

For summary and submit, a non-null `validationGroup` is emitted as **provisional** `data-jivs-group`. The exact SimpleDom convention has not yet been finalized. In installation assertions, validation-group values are compared exactly: `undefined`, `''`, and `'*'` are distinct stored values even though each can represent “match all” behavior.

Generated Jivs-role IDs use a role/field/key-style stem plus a unique `-N` suffix from the shared context. Raw markup and ordinary enclosing tags do not consume the ID counter. `form()` uses its supplied/default ID without consuming the counter.

The builder doesn't escape `fieldName`, attributes, content, or option strings: these are trusted test fixtures, not production HTML templating facilities.

## Field Identities and templates (`TestingSupport/`)

Instead of hand-writing rules and HTML in each test, pick **Field Identities** from a repository. Each is a test-only property named for its purpose (`Text_Required`, `Number_Range`, `Date_Required_LessThan`, `Checkbox`, `Select_Required`, `Radio_Required`) and packages two things: `addConfig(builder, name)` (the FieldValueHost and validators) and `addEditor(page, name, options)` (the editor element). Whether a field is "required" is simply what its `addConfig` does; there is no flag.

- `TestFieldRepository.ts`: `ITestFieldIdentity` and `TestFieldRepository`, which holds identities, **field templates** and **form templates**. `createDefaultTestFieldRepository()` holds the starter set. Add more with `registerIdentity()`, `registerFieldTemplate()` and `registerFormTemplate()`.
  - A field template is a shared recipe `(page, field) => void` that surrounds the editor with other roles. Any identity can use any template. Starters: `default` (label, editor, error), `withRequired` (adds the required indicator), `labelAfter`, `withAriaError`, `inContainer`, `editorOnly`. The label text is the identity name.
  - A form template is a recipe `(page) => void` that builds a whole form with `page.form()`, `field()`, `validationSummary()` and `submit()`. Pass a group to the latter two to write `data-jivs-group`; omit it to write none.
  - Templates are recipes rather than HTML strings so `TestHtmlBuilder` stays the only code that creates elements, ids and descriptors.
  - **Where registrations live.** `createDefaultTestFieldRepository()` holds only the general starter set used by many test files. Identities, field templates and form templates that serve one group of tests are registered in that test file, in a local function that starts from the default repository and returns it, such as `createFieldFeedbackRepository()` in `FieldFeedback.integration.test.ts`. Pass the result as the `repository` option of `createTestForm`. This keeps the registrations beside the tests that need them and keeps the default set small. Promote an identity into the default set only when several test files use it.
- `TestHtmlBuilder.field(name, templateName?, editorOptions?)` adds one identity through a field template (default `default`). `editorOptions` (`presentationName`, `adapterKey`, `additionalAttributes`, `initialValue`) pass through to the editor. `formTemplate(name)` runs a form template. Both require `context.fieldTemplateSource` to be the repository; `createTestForm` assigns it.
- `TestPropertiesRules.ts`: one `ValueHostRulesBase` subclass built from a list of identity names; its cache key includes the names.
- `CreateTestForm.ts`: `createTestForm(options)` creates services (all conditions, parsers, formatters, ARIA), context, runner and form HTML first, then rules from `context.fieldNames`, then the manager; it writes the HTML to `document.body` and runs `FormInstaller`. Supply exactly one source: `fields` (names), `build` (`(page) => void`) or `formTemplate`. Other options: `fieldTemplate`, `fieldTemplates` (per name), `repository`, `services`, `formId`, `formAttributes`, `install`, `verbose`, `containerIdentifier` and `configure`. It returns `services`, `config`, `vhm`, `runner`, `context`, `page`, `collector` and `install()`. `duringEdit` is not an option; set it on `domServices.options.validationBehaviors`.

```ts
const t = createTestForm({ fields: ['Text_Required', 'Date_Required_LessThan'], fieldTemplate: 'withRequired' });
t.runner.assertFormInstallation(document, t.vhm);

// AJAX-style replacement
t.runner.removeDescriptorsIn(oldSubtree);
const replacement = new TestHtmlBuilder(t.context).field('Date_Required_LessThan', 'labelAfter');
// insert replacement.build() into the DOM, then:
t.install();
t.runner.assertFormInstallation(document, t.vhm);
```

Notes:
- `SimpleDomElementCollector` passes `presentationName: null` for editors without `data-jivs-presentation`, because `EditorInstaller` only uses the adapter's recommended presentation when the option is `null` (not `undefined`).
- The runner accepts an unset presentation for roles that have none registered (`aria-error`, and form roles such as `submit`), because the installers leave the property `undefined`.

## Descriptor contracts

Each role descriptor is constructed directly by the corresponding `TestHtmlBuilder` method, not by a descriptor factory. Its constructor takes `(id, fieldName, context)`; the concrete class declares its own `role`. Optional expectations are writable properties populated by the builder.

`RoleTestDescriptorBase` retains `domServices` and **copies** `containerIdentifier` from the context. It does not retain the context itself, but does retain the shared failures array reference. Descriptors store expectations and IDs, **not** the actual `HTMLElement` created later by JSDOM.

The two methods called by the runner are:

```ts
public testElement(element: IJivsElement): void;
public testRegistryRecord(record: ElementRegistryRecord): void;
```

Descriptors append `TestFailure` entries instead of running Jest assertions. Shared helpers include `checkEqual`, `checkDefined`, `checkPresentation`, `checkAriaUpdater`, `checkUndefinedProperties`, and `addFailure`. The implementation also includes helpers for field/form role checks and expected-presentation resolution.

**Assertions intentionally omitted:** `jivsTextValueAdapter` and `jivsValueAdapter` are not *positively* verified for editor roles because their creation belongs to EditorAdapterDefinition unit tests. Their absence is checked on roles to which they should not apply. Presentation comparisons use `constructor === constructor` rather than reference identity because presentation factories create new instances; installed editor adapter definitions use registered-instance reference equality.

## Runner behavior

```ts
const runner = new IntegrationTestRunner(context);
runner.assertFormInstallation(document, valueHostsManager);
```

The intended sequence is:

1. Clear previous failures in place.
2. Select descriptors whose saved `containerIdentifier === valueHostsManager.getContainerIdentifier()`.
3. Obtain the manager registry through `context.domServices.getElementRegistry(valueHostsManager)`.
4. Retrieve each selected element with `document.getElementById(descriptor.id)`.
5. Retrieve its registry record with **`registry.getRecordForElement(element)`** (reference-based; no manual registry enumeration).
6. On a missing element or record, record one failure for that descriptor and continue with the next descriptor.
7. Execute registry checks and appropriate installed-element checks. For editor roles, use the registry's resolved `jivsElement` (which may differ from `record.element`).
8. End with `expect(context.failures).toEqual([])`, allowing Jest/VS Code to show all structured failure objects.

A call matching no descriptors is a failure. The runner is intended to support multiple `ValueHostsManager` instances in one document using the captured container selectors. The default `null` identifier describes the document-wide case; **`form()` does not automatically assign a container selector**.

`FormInstaller` needs an existing manager. Its collector populates the registry; the registry itself is responsible for matching field identifiers to actual `FieldValueHost` objects. The suite intends to verify whether a field host is assigned when expected, not reference identity of that host. Form records always have no field host. Unmatched field records retain their role, but should not have editor/presentation installation results.

### Testing value flow and replacement

Use the real Jivs components for lifecycle behavior rather than adding it to the installation runner:

- `FormInstaller.install()` discovers elements and installs editors and presentations. It does not initially copy the editor's current HTML value into the manager; a user-like `change` event exercises the editor-to-manager path.
- `valueHostsManager.services.domServices.dispatchers.attachTextValueChanged(valueHostsManager)` connects manager text changes back to installed editors. `FormInstaller.install(valueHostsManager, collector)` is the convenience form that also attaches the dispatcher.
- Engine `ModelReader` writes native values and invokes `onValueChanged`. Engine `FormReader` writes text values and invokes `onTextValueChanged`; use `FormReader` when the test specifically exercises that callback.
- After replacing DOM nodes, call `runner.removeDescriptorsIn(oldSubtree)` before discarding the old subtree, build the replacement with the same context, rerun `FormInstaller.install()` against the manager's full container, then assert the installation again. This refreshes the registry's element references while retaining expectations for untouched nodes.

## Failure reporting

```ts
interface TestFailure {
    id: string;
    role: ElementRole | string;
    fieldName: string | null;
    propertyName: string;
    message: string;
    expected?: unknown;
    actual?: unknown;
    [key: string]: unknown;
}
```

Property names identify the object and property, e.g. `JivsElement.jivsFieldPresentation` and `RegRecord.fieldValueHost`. Failure messages are internal, utility-specific descriptions. Values are converted **only on failure**: `undefined` becomes `'<undefined>'`, `null` remains `null`, object instances display their constructor names, and arrays are converted recursively. Comparing references may be represented by their types, so use `propertyName` and assertion context to interpret failures.

## Unit testing the test infrastructure

`Integration_Testing.test.ts` uses a minimal services/manager/registry stub. Current examples check lazy HTML composition, shared IDs, captured container selectors, core role markup, nested field containers, missing DOM elements, missing registry records, no matching descriptor group, accumulated failure reporting, and descriptor construction.

The revised tests additionally exercise successful editor, field presentation, and form presentation installation; group propagation; incorrect assignment detection; missing FieldValueHosts; and ARIA-disabled behavior. Further worthwhile coverage in the repository includes enabled ARIA updater resolution, separate manager/container groups, third-party adapter targets, and explicit adapter-key selection.

## Corrections applied to this revision

The implementation now handles form-role records independently of `fieldValueHost`, so summary and submit presentations and group assignments are asserted. A missing editor `jivsElement` produces one failure rather than duplicate reports. Editor descriptors resolve the expected adapter through `getDefinition()` for an explicitly selected key or `findDefinition(valueHost, element)` for automatic matching. The adapter's `recommendedFieldPresentationName` is considered when an editor presentation name is not provided. Presentations are compared by constructor, not reference identity.

ARIA checks distinguish participating field anchors from non-participating elements and from installations with `ariaService === null`. The expected updater is queried through `resolveValidationStateUpdater()` and compared by reference, allowing a `null` result. Form options use `presentationOptions.group`; the source design defines this property and the mapping from `data-jivs-group`, though SimpleDom's actual implementation still needs verification. The source-only Jest environment directive was removed. Tests now include positive installed editor, field presentation, and form presentation scenarios, plus deliberately incorrect results, missing hosts, and disabled ARIA.

### Remaining validation and scope limitations

- Repository compilation succeeded, the jivs-dom source-and-test TypeScript project type-checked, and both integration-tool suites passed (49 tests total).
- The current collector's actual interpretation of provisional SimpleDom attributes such as `data-jivs-group` and the planned `duringEdit` remains to be verified against that implementation.
- The runner intentionally does not test for extra registry entries without descriptors; those belong to collector/registry tests.
- HTML builder attribute strings and select-option values are **not escaped**. Use controlled test fixtures and supply authored markup through `raw()` when necessary.
- ARIA installation participation follows the registry's field anchors; this test suite does not retest the inner behavior of ARIA updaters.

# Element collector for integration tests

Tests shall use the `SimpleDomElementCollector` class and follow the jivs-simpledom syntax described in
the ElementCollectorForTests source file.

```ts
const collector = new SimpleDomElementCollector();
const formInstaller = new FormInstaller(valueHostsManager, collector);
formInstaller.install();
runner.assertFormInstallation(document, valueHostsManager);
```

Do not assign IDs to any element that has a data-jivs-role attribute because
our test framework uses and assigns the ID attribute.

```html
<form>
    <div data-field='field1' data-jivs-role='container'>
        <label data-field='field1' data-jivs-role='label'>Field 1</label>
        <input type='text' data-field='field1' data-jivs-role='editor' >
        <span data-field='field1' data-jivs-role='error' data-jivs-presentation='fancy'></span>
        <span data-field='field1' data-jivs-role='aria-error'></span>
        <span data-field='field1' data-jivs-role='required'></span>
    </div>
    <div data-jivs-role='summary' data-jivs-presentation='Nifty'></div>
</form>
```

## Deferred design

- Complete tests of validation-state changes, popup/error message content, and ongoing presentation behavior.
- Final SimpleDom syntax for `duringEdit` and validation groups.
- Any test-only overrides for third-party editor widgets not yet implemented.

## Notes for AI contributors

Preserve the approved lightweight, test-only design. Keep the two TypeScript files together unless explicitly requested otherwise. Do not introduce descriptor factories, elaborate registry indexes, per-assertion Jest calls, production dependencies, or alternate container-scoping systems. Preserve single-quoted TypeScript, role-first descriptor naming, shared-context ID generation, writable optional expectations, and structured failure aggregation. Before changing public signatures, consult the existing builder method contract and maintain compatibility with the caller's form markup. Distinguish flaws in FormInstaller installation wiring from behavior already covered by ElementRegistry, EditorAdapterDefinition, presentation, or ARIA unit tests.
