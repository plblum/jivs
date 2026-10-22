# Jivs Unit Testing Approach

Reference for any chat/agent writing unit tests in this repo. It was derived from the existing suites, mainly `packages/jivs-engine/tests` (58 files), plus jivs-builder and jivs-configanalysis. **Follow the existing conventions below; do not introduce new frameworks or styles.**

## 0. Ground rules (set by the repo owner; they override defaults)

1. **One class at a time.** The owner picks the class and reviews every file. Do not write tests for other classes, and do not change `src` code unless asked. If a test exposes a likely bug in `src`, report it and ask; never "fix" the source or bend the test to match it.
2. **Assertions use `expect()` only**, with Jest 30 APIs (no `assert`, no `should`, no removed aliases such as `toBeCalled`/`toReturnTimes`; use `toHaveBeenCalled`, `toHaveBeenCalledTimes`, etc.).
3. **Near full coverage, with effective tests.** No fixed percentage. Cover every branch and include edge cases (null/undefined/empty, wrong state, repeat calls, ordering, dispose). Omit only rare edge cases. Run `npx jest <file> --coverage --collectCoverageFrom=<src file>` and report what remains uncovered and why.
4. **Logging must be tested.** Whenever the code under test logs (via `logger`, `log`, `logQuick`, `logError`, `DomLoggingFacade`, etc.), assert the logged data (level, category, message, type, data), for each logging path, and the "no logger/services" path. A logging branch without an assertion on the logged content is incomplete.
5. **Tests are end-user facing.** They double as learning material for people new to the code. Be professional: clear names, tidy structure, no debugging leftovers (no `console.log`, no `.only`/`.skip`, no commented-out code).
6. **Commenting (explicit exception to "comment sparingly").** Put a brief comment above each `describe` saying what is verified and why it matters. Comment non-obvious jsdom/event techniques where first used (e.g. why focus needs the element attached, why an event is dispatched with `bubbles: true`).
7. **The owner is new to jsdom testing.** When a DOM/event challenge appears, explain the technique briefly in chat, then show it in the test. See section 10.
8. **Leaf-first order.** Unless told otherwise, suggest classes that depend on few others first (Utilities, Services bases, Adapters, then Dispatchers, Aria, Presentations, Installers), so shared TestSupport grows incrementally.
9. **Test support is shared.** Before creating a helper, check `packages/jivs-dom/tests/TestSupport/` and reuse or extend it. Tell the owner when you add one. Current files include `utilities.ts` (DOM helpers such as `createElement(attributes, tagName)`), `mocks.ts` (fakes such as `RecordingLoggingService`, `createStubFieldValueHost`), `FieldValueHostTestFunctions.ts` (real engine services, manager, and FieldValueHost setup), and presentation fakes such as `RecordingMessageFrame`, `RecordingErrorMessageDisplayTrigger`, and `RecordingPopupService`.
10. **Tests express the intended behavior, not just the current code.** Derive expectations from the source doc comments, interface docs, and `planning/Jivs-DOM_Implementation_Design.md` (and other planning docs). Do not write a test merely because the code does it: that would bless bugs. When the code's behavior contradicts or goes beyond the documented intent, or the intent is unclear (for example, what an empty-string attribute should do), **do not write a test that locks it in**. List it for the owner as a question or suspected bug.
11. **Stay in scope.** Test only the class under test. Behavior owned by a collaborator (a logging service filtering by level, a FieldValueHost computing its identifier) belongs in that collaborator's tests (often in jivs-engine). Isolate with a fake and assert what the class asked the collaborator to do.
12. **Use fakes for isolation and real collaborators for meaningful integration.** Keep focused unit tests with hand-written fakes when they make the class's request or edge case explicit. Prefer real collaborators when their behavior is directly relevant and they are lightweight to construct; add clearly labeled integration tests alongside the isolated tests rather than replacing all fakes. As classes in the checklist get tested, revisit earlier suites where a real collaborator adds useful coverage.
13. **Website demonstrations.** `packages/jivs-dom/website/` (currently only `playground-preview/`, which does not use jivs-dom) will host user demos and testing demos, rebuilt on jivs-dom after the unit tests are in place. These are integration oriented and meaningful to a UI observer (an end user exercising the page). Only note a candidate in `planning/Testing_Demonstrations.md` when a class surfaces user-visible behavior; internals like `DomLoggingFacade` get no entry. Append; do not build them.
14. Run npm run compile in packages/jivs-engine after any engine change. jivs-dom imports from build/.

## 1. Tooling and layout

- **Jest + ts-jest (ESM)**. No snapshot testing, no `@jest-environment` docblocks in engine tests.
- Tests live in `packages/<pkg>/tests/**/*.test.ts` (`testRegex: /tests/.*\.(test)\.ts$`).
- The test folder mirrors the `src` folder structure: `src/Services/CultureService.ts` -> `tests/Services/CultureService.test.ts`. One test file per source file (occasionally one per group of related classes, e.g. `ComparisonCondition_classes.test.ts`).
- Shared helpers go in `tests/TestSupport/` (ignored by test discovery and coverage). Engine has: `mocks.ts`, `utilities.ts`, `Publicify_classes.ts`, `TestLogCallsLoggingService.ts`, `FieldValueHostTestFunctions.ts`, `TestValidatableValueHost.ts`.
- Configs: root `jest.config.json` (runs all packages, coverage on) and per-package `jest.config.json` (jivs-dom's uses `tsconfig_with_tests.json`, coverage off, verbose).
- Commands: package dir `npm test` (`jest --silent`), `npm run consoletest` (shows console, no stack traces); root `npm test`.
- **Cross-package imports**: tests/src in other packages import the engine through its compiled output: `@plblum/jivs-engine/build/...`. The engine must be compiled (`npm run compile` / `lerna run compile`) before jivs-dom tests can run. Within the package under test, import from `../../src/...` (relative).
- jivs-dom needs a DOM. `jest-environment-jsdom` is installed at the root and `packages/jivs-dom/jest.config.json` sets `"testEnvironment": "jsdom"`. 
- Each jivs-dom test file must declare `/** @jest-environment jsdom */` so DOM tests receive the correct environment when discovered by root-level Jest commands that load the shared config.
- The root `jest.config.json` intentionally keeps its default environment for non-DOM packages. Its `"build"` ignore pattern also matches the folder name `jivs-builder`. Running jivs-dom tests from `packages/jivs-dom` still uses the package config; the per-file environment directive keeps root-level test runs consistent.
- **ESM requirement (jivs-dom and any package importing `@plblum/jivs-engine/build/...`)**: the engine build is ESM, so Jest must run with Node's VM modules flag or it fails with `Unexpected token 'export'`. `Jivs.code-workspace` already sets `NODE_OPTIONS=--experimental-vm-modules ...` for the VS Code integrated terminal and the Jest extension, so no package script change is wanted. An agent shell does not inherit it, so run: `$env:NODE_OPTIONS='--experimental-vm-modules --no-warnings'; npx jest <file> --silent` from `packages/jivs-dom`.
- The workspace's `jestrunner.configPath` points at the **root** `jest.config.json`. The per-file environment directive ensures jivs-dom tests also run with jsdom through the VS Code runner.
- Under ESM mode the **`jest` global does not exist** (`jest.fn`, `jest.useFakeTimers` throw `ReferenceError`). If it is ever needed, `import { jest } from '@jest/globals'`. The house style avoids `jest.fn` anyway: use small counters or fake classes.
- `createJivsServicesForTesting()` chains a `ConsoleLoggingService` behind the `TestingLoggingService`, so a `gatherFn` is invoked once per logger in the chain, and entries are echoed to the console (hidden by `--silent`). To count `gatherFn` calls, assign an unchained `new TestingLoggingService(level)` to `services.loggingService`.

## 2. Test file structure and naming

- Plain top-level `describe('<Subject>.<member or scenario>', () => {...})`, with nested `describe` only when it clearly groups (e.g. `describe('register and find, ')`). Use `test(...)` (very rarely `it`).
- Test names are long, plain-English sentences describing the setup and the expected outcome, e.g. `'Register same cultureID twice replaces'`, `'With fallbackService setup, request a value that is in neither service, and the value from the fallback parameter is returned.'`. Include the condition, not just the method name.
- Variable naming: the object under test is `testItem`; a setup result is `setup`; use `let` (house style) rather than `const`.
- File order: imports -> local helper/subclass/setup functions (with doc comments) -> describes in the same order as the members in the source class (constructor first, then properties/methods, then `dispose`).
- Comments: JSDoc on setup helpers explaining parameters and defaults; otherwise sparse.

## 3. What gets tested (the rigor level)

The suites are exhaustive and white-box-ish, aiming for full coverage of branches:

- **Constructor**: null/undefined required parameters throw with a message regex (`expect(() => new X(null!, cfg)).toThrow(/valueHost/)`); valid params set up properties and defaults.
- **Every public method and property**, each branch: happy path, null/undefined/empty inputs, replace-vs-add, ordering, fallbacks.
- **Errors**: `expect(() => ...).toThrow()` / `.toThrow(/regex/)` / `.toThrow(TypeError)`. Use `.not.toThrow()` to assert safe no-op behavior (e.g. no services attached).
- **Logging**: verify what was logged (level, category, message, `type`, `data`) not just that nothing broke (see section 5).
- **Dispose**: after `dispose()`, members throw `TypeError` or services are released; check `.not.toThrow()` on dispose itself.
- **State/serialization**: capture and restore state through `JSON.parse`d `StateContainer`; round-trip tests (`Round_trip.test.ts`).
- **Async**: promises / timers use real `globalThis.setTimeout` with small delays (see `ConditionWithPromiseTester` in Validator.test.ts) or `async/await` with `await expect(...).resolves/rejects`. `jest.useFakeTimers` is used only in `Debounce.test.ts`.
- **Assertions** are concrete: `toBe` for identity (same instance), `toEqual` for structure, `toBeNull`, `toBeInstanceOf`, `toBeDefined`, `toContain`, `toHaveLength`. Prefer identity checks (`toBe`) when verifying a registered object is returned unchanged.

## 4. Mocking philosophy: hand-written fakes, not jest mocks

`jest.fn`/`jest.spyOn`/`jest.mock` are **almost never used** (only Debounce, ConsoleLoggingService, and 2 hits in ValueHostsManager). Instead:

1. **Real objects first.** Prefer instantiating the real class, wired to real (lightweight) services created by `createJivsServicesForTesting()` (from `@plblum/jivs-engine/build/Support/createJivsServicesForTesting`). It registers cultures, conditions, formatters, parsers, and a `TestingLoggingService`.
2. **Hand-written Mock classes** in `TestSupport/mocks.ts` implementing the interfaces (`MockJivsServices`, `MockValueHostsManager`, `MockValueHost`, `MockFieldValueHost`, ...). They implement the whole interface, store inputs in public underscore fields, and offer helpers like `vhm.addMockFieldValueHost('Field1', LookupKey.String, 'Label1')`. `new MockJivsServices(registerStandardConditions, registerStandardServices, defaultCultureId)`.
3. **Inline test-double classes** declared at the top of the test file when only that file needs them (e.g. `SubstituteValidatorBuilder`, `ConditionWithPromiseTester`, `TestParentBuilder`).
4. **Engine "testing" conditions** shipped in `src/Support/conditionsForTesting.ts`: `AlwaysMatchesCondition`, `NeverMatchesCondition`, `IsUndeterminedCondition`, `ThrowsExceptionCondition`, `UserSuppliedResultCondition`, `EvaluatesAsPromiseCondition`, `DisposableCondition`, etc.

### Publicify pattern (accessing protected members)

To test `protected` members, subclass the class under test in the test file (or in `TestSupport/Publicify_classes.ts` if shared) and expose members with a `publicify_`/`expose` prefix:

```ts
class Publicify_ServiceWithAccessorBase extends ServiceWithAccessorBase {
    public publicify_hasServices(): boolean { return super.hasServices(); }
}
```

Class name = `Publicify_<ClassName>` (older code also uses `Publicified<Name>`/`expose<Member>()`; prefer `publicify_`). Do not use `as any` to reach protected members.

## 5. Logging in tests

- Default: `createJivsServicesForTesting()` yields `services.loggingService` as `TestingLoggingService` (captures entries). Check with `logger.containsLog('text')`, `findMessage(...)`, `entryCount`, `captured`, `clearAll()` between phases of the same test. Chain `ConsoleLoggingService` into `chainedLogger` temporarily to debug.
- For exact-detail assertions use `TestLogCallsLoggingService` (TestSupport): it keeps `lastLogDetails` only, so assert with `expect(logger.lastLogDetails).toEqual({ message, category, level, type: 'ClassName', ... })`.
- Test both "no services attached => silently does nothing" and "services attached => logged".

## 6. Setup helpers (the central idiom)

Each test file defines one or two `setup...()` functions returning an object bundling everything created, so tests destructure what they need:

```ts
interface ITestSetupConfig { services; valueHostsManager; config; state; valueHost; logger }
function setupFieldValueHost(partialConfig?: Partial<Config> | null, partialState?: Partial<State> | null): ITestSetupConfig
```

Rules: accept `Partial<>` of config/state and fill in defaults (`finishPartial...` helpers), document the defaults in JSDoc, and return every object created (services, manager, config, state, logger, subject). Specialized variants (`setupFieldValueHostForValidate`) layer on top. Repeating small inline setup in a test is also acceptable for trivial cases.

## 7. Style details

- 4-space indentation, `let`, semicolons, double or single quotes (both occur; match the file).
- Test data is small and literal; no external fixtures or snapshots.
- Each test is self-contained (no shared mutable state across tests); no `beforeEach` use is typical, setup functions are called per test.
- Tests may include several related `expect`s and several sequential actions in one test when verifying a flow (e.g. register -> find -> replace), while the name states the whole scenario.
- Prefer testing observable behavior through the public interface; use Publicify only where protected hooks matter.

## 8. Applying this to jivs-dom (plan guidance)

Source: `packages/jivs-dom/src/{Adapters, Aria, Dispatchers, EditorAdapterDefinitions, Editors, FieldPresentations, FormInstaller, FormPresentations, Interfaces, Presentations_common, Services, Utilities}`. Mirror those under `packages/jivs-dom/tests/`.

- Create `packages/jivs-dom/tests/TestSupport/` with: DOM-building helpers (create inputs/selects/checkboxes/radio groups/form containers in jsdom), a mock/real `IJivsDomServices` factory (extend `createJivsServicesForTesting()` with `JivsDomServices` plus the engine services), and `Publicify_*` subclasses for protected members.
- Use jsdom `document.createElement`/`document.body.innerHTML` and dispatch real events (`element.dispatchEvent(new Event('input'))`, `FocusEvent`, `MouseEvent`, `KeyboardEvent`) for adapters, triggers, and dispatchers. Clean up with `document.body.innerHTML = ''` at the end of tests that attach elements.
- Prefer real engine objects (ValueHostsManager via `createJivsServicesForTesting`, real FieldValueHosts) over fakes where practical; write hand-made fakes for jivs-dom interfaces when isolating (e.g. mock `IElementRegistry`, `IPopupMechanism`, `IDispatcherService`).
- Keep the same naming/structure/rigor rules: constructor null checks, each method's branches, dispose behavior, logging, and error cases.
- Before running tests: compile jivs-engine so `@plblum/jivs-engine/build/*` exists, then run `npm test` in `packages/jivs-dom` (or `npx jest <file>`).
- Work file-by-file, run each new test file, and check coverage (`jest --coverage`) for untested branches.

## 9. Agreed class order for jivs-dom (leaf-first, from the import graph)

Owner-approved. Work strictly one class at a time, in this order; within a phase, bases come before subclasses. Exception chosen by the owner: `DomLoggingFacade` was first. When a class is finished and reviewed, tick its box and add its test file path. Paths are relative to `packages/jivs-dom/src/` (tests mirror them under `tests/`). Interfaces and `index.ts` are type-only/exports and have no tests of their own.

### Phase 1: Adapters (no dependencies)
- [x] Adapters/AdapterBase (`tests/Adapters/AdapterBase.test.ts`)
- [x] Adapters/ValueAdapterBase (`tests/Adapters/ValueAdapterBase.test.ts`)
- [x] Adapters/TextValueAdapterBase (`tests/Adapters/TextValueAdapterBase.test.ts`)
- [x] Adapters/InputTextValueAdapter (`tests/Adapters/InputTextValueAdapter.test.ts`)
- [x] Adapters/TextAreaTextValueAdapter (`tests/Adapters/TextAreaTextValueAdapter.test.ts`)
- [x] Adapters/SelectTextValueAdapter (`tests/Adapters/SelectTextValueAdapter.test.ts`)
- [x] Adapters/CheckboxTextValueAdapter (`tests/Adapters/CheckboxTextValueAdapter.test.ts`)
- [x] Adapters/FileInputTextValueAdapter (`tests/Adapters/FileInputTextValueAdapter.test.ts`)
- [x] Adapters/RadioButtonsTextValueAdapterBase (`tests/Adapters/RadioButtonsTextValueAdapterBase.test.ts`)
- [x] Adapters/RadioButtonsTextValueAdapter (`tests/Adapters/RadioButtonsTextValueAdapter.test.ts`)

### Phase 2: Aria updaters
- [x] Aria/AriaStaticUpdaterBase (`tests/Aria/AriaStaticUpdaterBase.test.ts`)
- [x] Aria/AriaValidationStateUpdaterBase (`tests/Aria/AriaValidationStateUpdaterBase.test.ts`)
- [x] Aria/EditorAriaStaticUpdater (`tests/Aria/EditorAriaStaticUpdater.test.ts`)
- [x] Aria/WrappedRadioButtonsAriaStaticUpdater (`tests/Aria/WrappedRadioButtonsAriaStaticUpdater.test.ts`)
- [x] Aria/RequiredIndicatorAriaStaticUpdater (`tests/Aria/RequiredIndicatorAriaStaticUpdater.test.ts`)
- [x] Aria/PopupErrorMessageDisplayStaticUpdater (`tests/Aria/PopupErrorMessageDisplayStaticUpdater.test.ts`)
- [x] Aria/ValidationSummaryAriaStaticUpdater (`tests/Aria/ValidationSummaryAriaStaticUpdater.test.ts`)
- [x] Aria/EditorAriaValidationStateUpdater (`tests/Aria/EditorAriaValidationStateUpdater.test.ts`)
- [x] Aria/HiddenErrorMessagesAriaValidationStateUpdater (`tests/Aria/HiddenErrorMessagesAriaValidationStateUpdater.test.ts`)

### Phase 3: Logging and dispatch (needs a small `IJivsDomServices` fake in TestSupport)
- [x] Utilities/DomLoggingFacade (`tests/Utilities/DomLoggingFacade.test.ts`; revised after owner review: scoped to the facade with fakes, plus an integration describe; awaiting final review)
- [x] Dispatchers/DispatcherBase (`tests/Dispatchers/DispatcherBase.test.ts`)
- [x] Dispatchers/FieldDispatcherBase (`tests/Dispatchers/FieldDispatcherBase.test.ts`)
- [x] Dispatchers/FormDispatcherBase (`tests/Dispatchers/FormDispatcherBase.test.ts`)
- [x] Dispatchers/FieldValidationDispatcher (`tests/Dispatchers/FieldValidationDispatcher.test.ts`)
- [x] Dispatchers/FormValidationDispatcher (`tests/Dispatchers/FormValidationDispatcher.test.ts`)
- [x] Dispatchers/TextValueDispatcher (`tests/Dispatchers/TextValueDispatcher.test.ts`; the defensive adapter-absent branch is excluded by ElementRegistry's adapter-only query)
- [x] Dispatchers/ValueDispatcher (`tests/Dispatchers/ValueDispatcher.test.ts`; the defensive adapter-absent branch is excluded by ElementRegistry's adapter-only query)

### Phase 4: Services
- [x] Services/DomServiceBase (`tests/Services/DomServiceBase.test.ts`)
- [x] Aria/AriaService (`tests/Aria/AriaService.test.ts`)
- [x] Services/PopupService (`tests/Services/PopupService.test.ts`)
- [x] Services/IssuesFoundFormatterServiceBase (`tests/Services/IssuesFoundFormatterServiceBase.test.ts`)
- [x] Services/IssuesFoundFormatterService (`tests/Services/IssuesFoundFormatterService.test.ts`)
- [x] Dispatchers/DispatcherService (`tests/Dispatchers/DispatcherService.test.ts`)
- [x] Services/JivsDomServices (`tests/Services/JivsDomServices.test.ts`; concrete default factory constructors are isolated behind fakes because their collaborators have separate checklist tests)
- [x] Services/JivsDomServicesInstaller (`tests/Services/JivsDomServicesInstaller.test.ts`)

### Phase 5a: Presentations_common
- [x] Presentations_common/PresentationContentBase (`tests/Presentations_common/PresentationContentBase.test.ts`)
- [x] Presentations_common/PresentationBase (`tests/Presentations_common/PresentationBase.test.ts`)
- [x] Presentations_common/PresentationFactoryBase (`tests/Presentations_common/PresentationFactoryBase.test.ts`)
- [x] Presentations_common/MessageFrameBase (`tests/Presentations_common/MessageFrameBase.test.ts`)
- [x] Presentations_common/MessageFrame (`tests/Presentations_common/MessageFrame.test.ts`)
- [x] Presentations_common/TemplatedMessageFrame (`tests/Presentations_common/TemplatedMessageFrame.test.ts`)
- [x] Presentations_common/LayoutMessageFrameBase (`tests/Presentations_common/LayoutMessageFrameBase.test.ts`)
- [x] Presentations_common/HeaderFooterMessageFrame (`tests/Presentations_common/HeaderFooterMessageFrame.test.ts`)
- [x] Presentations_common/IconMessageFrame (`tests/Presentations_common/IconMessageFrame.test.ts`)
- [x] Presentations_common/EditorTriggerBase (`tests/Presentations_common/EditorTriggerBase.test.ts`)
- [x] Presentations_common/EditorFocusTrigger (`tests/Presentations_common/EditorFocusTrigger.test.ts`)
- [x] Presentations_common/ErrorMessageDisplayTriggerBase (`tests/Presentations_common/ErrorMessageDisplayTriggerBase.test.ts`)
- [x] Presentations_common/ErrorMessageDisplayClickTrigger (`tests/Presentations_common/ErrorMessageDisplayClickTrigger.test.ts`)
- [x] Presentations_common/ErrorMessageDisplayFocusInTrigger (`tests/Presentations_common/ErrorMessageDisplayFocusInTrigger.test.ts`)
- [x] Presentations_common/ErrorMessageDisplayFocusOutTrigger (`tests/Presentations_common/ErrorMessageDisplayFocusOutTrigger.test.ts`)
- [x] Presentations_common/ErrorMessageDisplayKeyAsClickTrigger (`tests/Presentations_common/ErrorMessageDisplayKeyAsClickTrigger.test.ts`)
- [x] Presentations_common/ErrorMessageDisplayMouseOutTrigger (`tests/Presentations_common/ErrorMessageDisplayMouseOutTrigger.test.ts`)
- [x] Presentations_common/ErrorMessageDisplayMouseOverTrigger (`tests/Presentations_common/ErrorMessageDisplayMouseOverTrigger.test.ts`)

### Phase 5b: FieldPresentations
- [x] FieldPresentations/PopupContext (`tests/FieldPresentations/PopupContext.test.ts`)
- [x] FieldPresentations/ErrorMessageDisplayTriggerContext (`tests/FieldPresentations/ErrorMessageDisplayTriggerContext.test.ts`)
- [x] FieldPresentations/ErrorIndicatorContent/ErrorIndicatorContentBase (`tests/FieldPresentations/ErrorIndicatorContent/ErrorIndicatorContentBase.test.ts`)
- [x] FieldPresentations/ErrorIndicatorContent/ColumnarErrorIndicatorContent (`tests/FieldPresentations/ErrorIndicatorContent/ColumnarErrorIndicatorContent.test.ts`)
- [x] FieldPresentations/FieldPresentationBase (`tests/FieldPresentations/FieldPresentationBase.test.ts`)
- [x] FieldPresentations/IsValidFieldPresentationBase (`tests/FieldPresentations/IsValidFieldPresentationBase.test.ts`)
- [x] FieldPresentations/EditorFieldPresentationBase (`tests/FieldPresentations/EditorFieldPresentationBase.test.ts`)
- [x] FieldPresentations/WrappedEditorFieldPresentationBase (`tests/FieldPresentations/WrappedEditorFieldPresentationBase.test.ts`)
- [x] FieldPresentations/FieldContainerPresentation (`tests/FieldPresentations/FieldContainerPresentation.test.ts`)
- [x] FieldPresentations/LabelPresentation (`tests/FieldPresentations/LabelPresentation.test.ts`)
- [x] FieldPresentations/RequiredIndicatorPresentation (`tests/FieldPresentations/RequiredIndicatorPresentation.test.ts`; persistent classes follow confirmed intent: no `jivs-editor`)
- [x] FieldPresentations/TextInputPresentation (`tests/FieldPresentations/TextInputPresentation.test.ts`)
- [x] FieldPresentations/TextAreaPresentation (`tests/FieldPresentations/TextAreaPresentation.test.ts`)
- [x] FieldPresentations/SelectPresentation (`tests/FieldPresentations/SelectPresentation.test.ts`)
- [x] FieldPresentations/CheckboxPresentation (`tests/FieldPresentations/CheckboxPresentation.test.ts`)
- [x] FieldPresentations/FileInputPresentation (`tests/FieldPresentations/FileInputPresentation.test.ts`)
- [x] FieldPresentations/RadioButtonsPresentation (`tests/FieldPresentations/RadioButtonsPresentation.test.ts`)
- [x] FieldPresentations/WrappedTextInputPresentation (`tests/FieldPresentations/WrappedTextInputPresentation.test.ts`)
- [x] FieldPresentations/WrappedTextAreaPresentation (`tests/FieldPresentations/WrappedTextAreaPresentation.test.ts`)
- [x] FieldPresentations/WrappedSelectPresentation (`tests/FieldPresentations/WrappedSelectPresentation.test.ts`)
- [x] FieldPresentations/WrappedCheckboxPresentation (`tests/FieldPresentations/WrappedCheckboxPresentation.test.ts`)
- [x] FieldPresentations/WrappedFileInputPresentation (`tests/FieldPresentations/WrappedFileInputPresentation.test.ts`)
- [x] FieldPresentations/WrappedRadioButtonsPresentation (`tests/FieldPresentations/WrappedRadioButtonsPresentation.test.ts`)
- [x] FieldPresentations/ErrorMessageDisplayPresentationBase (`tests/FieldPresentations/ErrorMessageDisplayPresentationBase.test.ts`)
- [x] FieldPresentations/TriggeredErrorMessageDisplayPresentationBase (`tests/FieldPresentations/TriggeredErrorMessageDisplayPresentationBase.test.ts`)
- [x] FieldPresentations/InlineErrorMessageDisplayPresentation (`tests/FieldPresentations/InlineErrorMessageDisplayPresentation.test.ts`)
- [x] FieldPresentations/PopupErrorMessageDisplayPresentation (`tests/FieldPresentations/PopupErrorMessageDisplayPresentation.test.ts`)
- [x] FieldPresentations/FieldPresentationFactory (`tests/FieldPresentations/FieldPresentationFactory.test.ts`)
- [x] FieldPresentations/FieldPresentationInstaller (`tests/FieldPresentations/FieldPresentationInstaller.test.ts`)

### Phase 5c: FormPresentations
- [x] FormPresentations/FormPresentationBase (`tests/FormPresentations/FormPresentationBase.test.ts`)
- [x] FormPresentations/ValidationSummaryPresentation (`tests/FormPresentations/ValidationSummaryPresentation.test.ts`)
- [x] FormPresentations/FormPresentationFactory (`tests/FormPresentations/FormPresentationFactory.test.ts`)
- [x] FormPresentations/FormPresentationInstaller (`tests/FormPresentations/FormPresentationInstaller.test.ts`)

### Phase 6: Editor adapter definitions, installers, registry
- [x] EditorAdapterDefinitions/EditorAdapterDefinitionBase (`tests/EditorAdapterDefinitions/EditorAdapterDefinitionBase.test.ts`)
- [x] EditorAdapterDefinitions/ParsedTextEditorAdapterDefinitionBase (`tests/EditorAdapterDefinitions/ParsedTextEditorAdapterDefinitionBase.test.ts`)
- [x] EditorAdapterDefinitions/InputAdapterDefinition (`tests/EditorAdapterDefinitions/InputAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/TextAreaAdapterDefinition (`tests/EditorAdapterDefinitions/TextAreaAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/SelectAdapterDefinition (`tests/EditorAdapterDefinitions/SelectAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/CheckboxAdapterDefinition (`tests/EditorAdapterDefinitions/CheckboxAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/FileInputAdapterDefinition (`tests/EditorAdapterDefinitions/FileInputAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/RadioButtonsAdapterDefinition (`tests/EditorAdapterDefinitions/RadioButtonsAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/WrappedEditorAdapterDefinitionBase (`tests/EditorAdapterDefinitions/WrappedEditorAdapterDefinitionBase.test.ts`)
- [x] EditorAdapterDefinitions/WrappedInputAdapterDefinition (`tests/EditorAdapterDefinitions/WrappedInputAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/WrappedTextAreaAdapterDefinition (`tests/EditorAdapterDefinitions/WrappedTextAreaAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/WrappedSelectAdapterDefinition (`tests/EditorAdapterDefinitions/WrappedSelectAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/WrappedCheckboxAdapterDefinition (`tests/EditorAdapterDefinitions/WrappedCheckboxAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/WrappedFileInputAdapterDefinition (`tests/EditorAdapterDefinitions/WrappedFileInputAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/WrappedRadioButtonsAdapterDefinition (`tests/EditorAdapterDefinitions/WrappedRadioButtonsAdapterDefinition.test.ts`)
- [x] EditorAdapterDefinitions/EditorAdapterDefinitionFactory (`tests/EditorAdapterDefinitions/EditorAdapterDefinitionFactory.test.ts`)
- [x] Editors/EditorInstaller (`tests/Editors/EditorInstaller.test.ts`)
- [x] FormInstaller/ElementRegistry (`tests/FormInstaller/ElementRegistry.test.ts`)
- [x] FormInstaller/ElementCollectorBase (`no code generated due to no code in the class`)
- [ ] FormInstaller/FormInstaller

## 10. jsdom and event-testing primer (grows as we learn)

- jsdom is a simulated DOM in Node: real `document`, elements, events, and `getAttribute`/`classList`/ARIA attributes work. **No layout**: `getBoundingClientRect()` returns zeros, `offsetWidth` is 0, and CSS is not applied (except inline style / `getComputedStyle` basics). Mock those if code depends on them.
- **Build DOM per test**, attach to `document.body` when focus, `document.activeElement`, or bubbling-to-document matters, and remove it afterward (`document.body.innerHTML = ''`) so tests stay independent.
- **Dispatch real events**: `el.dispatchEvent(new Event('input', { bubbles: true }))`; use `MouseEvent`, `KeyboardEvent` (`{ key: 'Enter' }`), `FocusEvent`. Events that should reach delegated/parent listeners need `bubbles: true`. `focusin`/`focusout` bubble; `focus`/`blur` do not. Calling `el.focus()` only works on attached, focusable elements.
- **Set values like a user**: set `input.value`, then dispatch `input`/`change`. For checkboxes use `checked` then dispatch `change`/`click`. `el.click()` fires a click event with proper default behavior.
- **Verify listeners** by observing outcomes (value changes, class/ARIA attributes, calls on a fake) rather than inspecting internals. Verify cleanup by dispatching after `dispose()` and asserting nothing happened.
- **Timers** (debounce, popup delays): use `jest.useFakeTimers()` with `jest.advanceTimersByTime(ms)` and restore with `jest.useRealTimers()` in the same test. Under ESM mode import `jest` from `@jest/globals` first.
- **Types**: jsdom elements are real `HTMLElement` subclasses, so `instanceof HTMLInputElement` etc. work; cast with `as HTMLInputElement` in tests after creation.
- Use `element.outerHTML` or targeted attribute assertions to check generated markup; avoid snapshots.
