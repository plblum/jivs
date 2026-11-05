# Hand-off: jivs-dom popup/target presentations and jivs-ui-demos

Read this first in a new chat. Nothing below is committed; check `git status`.
Before writing or changing any unit test, read `planning/Testing_Approach.md`.

## Working agreements with the owner (plblum)
- Questions use Q01, Q02... numbering when the owner asks for it.
- Don't change code when the owner says "assess" or "don't change yet". Present findings and options first.
- The owner often writes some code himself and asks you to review, add tests, and update docs.
- Only use the edit/create tools to change files. No Playwright test suites; browser tools are fine for ad-hoc checks.
- Deferred by the owner, do not start unless asked: popup disposal rework (removing an element does not call presentation `dispose()`), and a debug-level DOM logging UI via a new `ILoggingService`.
- Update `Implementation_Design` (jivs-dom docs) after the code changes below land. The owner asked for this.

## How to run things
- Root: `npm run compile` (packages import jivs-engine via `@plblum/jivs-engine/build/...`, so compile first).
- jivs-dom / jivs-dom-tippy tests, from the package folder:
  `$env:NODE_OPTIONS='--experimental-vm-modules --no-warnings'; npx jest --silent`
- Type check: `npx tsc -p . --noEmit`
- Demo site: `packages/jivs-ui-demos`, Vite. Use `--port 5199 --strictPort` in an async shell. First browser load sometimes refuses the connection; retry.
- Last known results: jivs-dom 1509/1509 passing, tsc clean. jivs-dom-tippy 12/12 passing.

## Done in this chat (all uncommitted)
1. **Tippy popup (jivs-dom-tippy)** `src/TippyPopupMechanism.ts`:
   - Popup `mouseenter` calls `controller.cancelDelayedClose()`.
   - Option `popupMouseLeaveDelay` (default 750 ms; negative = leave closing to the presentation's triggers). Popup `mouseleave` starts a timer that calls `instance.hide()`; Tippy's `onHidden` then calls `notifyClosed()` once.
   - Option `keepOpen` (diagnostic): only suppresses the mouseleave close. Presentation-requested `close()` still works. It is stripped before options reach Tippy.
   - Tippy docs check: with `trigger: 'manual'` Tippy adds no hover handling, so this logic is ours. Tippy has `hideWithInteractivity(event)` (v6.2+, undocumented for manual); the owner said "no change", so the timer stays.
   - Tests added in `tests/TippyPopupMechanism.test.ts`.
2. **CSS** `packages/jivs-dom/assets/jivs-dom.css` (single source of truth): `:where(.jivs-popuperrormessagedisplay)` has `width: fit-content` so the popup arrow anchors to the indicator, not the full-width slot.
3. **`jivs-messagecontent` class on popup content:** the owner fixed `PopupErrorMessageDisplayPresentation.openCore`; tests added (class present; absent when the frame's `needsContainerUpdate()` is false).
4. **Radio adapter:** `RadioButtonsTextValueAdapterBase.readTextValue()` returns `''` for no selection; tests updated.
5. **Tasks 1 and 2 (anchor selector):** in `PopupErrorMessageDisplayPresentation.resolveAnchorElement()`:
   - `{FieldName}` token (every occurrence) replaced with `valueHost.getElementIdentifier()`, escaped via new `escapeCssIdentifier` in `src/Utilities/Helpers.ts` (uses `CSS.escape` when present; jsdom lacks it).
   - Lookup is container first (`domServices.resolveContainerElement(vhm)` descendants), then `document.body`, else falls back to the presentation element.
   - Tests: `tests/Utilities/Helpers.escapeCssIdentifier.test.ts` (new) and additions in `tests/FieldPresentations/PopupErrorMessageDisplayPresentation.test.ts`. The test mock now supplies `resolveContainerElement: () => document.body`.
   - Known, not changed: a malformed selector still throws `SyntaxError`; the container-then-body lookup is inline, to be extracted when the Target class needs it.
6. **`apply()` moved:** `TriggeredErrorMessageDisplayPresentationBase` no longer overrides `apply()` (it still updates `triggerContext.issuesFound` in its `applyIssuesFound`/`removeIssuesFound`). The close-then-reopen-if-was-open logic now lives in `PopupErrorMessageDisplayPresentation.apply()`. Tests updated in both test files.
7. **EditorHoverTrigger** (mouseenter/leave on editor): created by the owner with tests. Existing `EditorFocusTrigger` (focusin/focusout) can be passed in `options.triggers`.

## Next: build `TargetErrorMessageDisplayPresentation` (owner will ask for it)
Subclass `TriggeredErrorMessageDisplayPresentationBase`. Writes the field's error into a shared target element elsewhere on the page (for example a bottom status bar), with no popup mechanism.

Settled decisions:
- Name: `TargetErrorMessageDisplayPresentation`.
- Target found by a selector option with the `{FieldName}` token, using the same container-then-document lookup (extract a shared helper from `resolveAnchorElement`).
- Events only (no restoring of original content). Dispatched on the target element, `bubbles: true`, names as exported constants:
  - `jivs-message-show` with `detail: { fieldName, issuesFound, content }` where `content` is an element carrying class `jivs-messagecontent`, built from the `MessageFrame`.
  - `jivs-message-clear` with `detail: { fieldName }`. The app treats clear as "show the usage message again".
- Clear only if this field is still the last one that showed, so a late close cannot blank another field's message.
- Default triggers via options: `showOnFocus` (default true), `showOnHover` (default false), plus custom triggers. Use `EditorFocusTrigger` / `EditorHoverTrigger`. Default delays 0 (editor triggers default to 500).
- It implements its own `apply()` (the base no longer has one). Focus gap: base `open()` does nothing without issues, so after `super.apply()`, if issues exist and one of the field's editors is `document.activeElement`, call `open(context, 0)`. Hover is not covered (cannot see the pointer); document that limit.
- It inherits `PopupService` registration from the base, so only one triggered display per form is open at a time (good for a shared target). A Popup and a Target on the same field would close each other: document as unsupported for now. The owner asked why PopupService is involved: it is the base class's one-open-at-a-time coordinator, not a choice of the new class.
- ARIA: the required `ariaerror` element already announces the message; the target must not be a live region as well.
- Playground examples to add later: anchor = editor with indicator visible; anchor = editor with indicator hidden plus editor focus/hover triggers (the demo's own CSS hides the indicator and sets triggers; the library has no hide support); anchor = banner elsewhere; status bar via the Target presentation.

## Next after that: `CompositeFieldPresentation` (approach 2, agreed)
An `IFieldPresentation` that holds child presentations resolved by name from the factory, so one element can have Inline plus Target. Interface: `init`, `apply`, `getStaticAriaUpdater`, `getAriaValidationStateUpdater`, `dispose`.
- ARIA updaters come from the first child that provides one (order matters; document it).
- One failing child must not stop the others (log it). A missing child name is an error at `init`.
- `dispose()` disposes every child even if one throws.
- At most one child may write into the shared element.
- To verify first: how `FieldPresentationInstaller` (sets `element.jivsFieldPresentation`) and the factory build presentations, so children are not installed on the element themselves. Also whether the same element can register two controllers with `PopupService` (it can: it is keyed by controller).

## Other open items
- Optional: port the dropped test "reopens after a validation refresh while the popup was in a closing transition" to the popup tests.
- Playground follow-ups the owner may pick from: show the setup source via Vite `?raw`; a live field-state panel; example forms (registration, order/payment) with an inline/popup switch; URL-hash example selection (undecided).
- `packages/jivs-ui-demos/planning.md` has a stale note about empty Validate (resolved by `EditorReader`).
- Later phases: Node server demo (owner will supply docs), hosting/deploy plan, React and Angular pages, retiring `packages/jivs-dom/website/playground-preview/`.
- Update the Implementation_Design doc once Target and Composite land.

## Key technical facts
- Popup flow: `PopupErrorMessageDisplayPresentation.openCore` creates a context via `popupMechanism.createContext(popupOptions)`, sets `controller`, `domServices`, `anchorElement`, `messageFrameContent`, then `open()`. Triggers attach to the presentation element (click, mouseover/out, focus, key); `anchorSelector` only affects popup positioning.
- `TriggeredErrorMessageDisplayPresentationBase`: state machine `TriggerState` closed/opening/open/closing; `open()` returns immediately if `triggerContext.issuesFound` is empty; `close()` from open with delay 0 runs immediately; `cancelDelayedClose()` only acts when state is closing.
- Editor triggers (`EditorTriggerBase`) resolve editors with `domServices.resolveFieldElement(valueHost, ElementRole.editor)` and attach through the editor adapter definition's `attachEventHandler`.
- Playground setup order: create services, `configureJivsDom`, register presentations, build rules and `ValueHostsManager`, `FormInstaller.install`, then `new EditorReader(vhm).read()` (without it untouched fields are `undefined` and `requireText` doesn't fire). `ValueHostRulesBase` caches config; use `disableCache` when rules vary. `regExp` defaults to Severe severity.
- Test style: hand-written fakes and `Publicify_` subclasses, `expect()` only, a comment above each `describe`; see `Testing_Approach.md`.
