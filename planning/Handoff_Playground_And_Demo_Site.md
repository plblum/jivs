# Hand-off: jivs-ui-demos (playground + demo site)

Read this, then `planning/Testing_Approach.md` (before any test work) and `packages/jivs-ui-demos/planning.md` (site decisions and lessons learned).

## What we are building
**jivs-ui-demos** (`packages/jivs-ui-demos`, private Vite multi-page site) shows jivs-dom driven by the real Jivs engine. It is for exploration, documentation support and promotion. It is not the product documentation (a later phase).

Several goals:
1. **Playground** (`dom/playground/`): a live page where a visitor picks an example, switches state/messages/editor/presentation, and sees the HTML plus `jivs-dom.css` result. It replaces the old emulated page at `packages/jivs-dom/website/playground-preview/` (retire it once the live one is accepted). **Exists, 11 specimens (6 inline, 5 popup), and needs updating for the newly finished presentations.**
2. **Demo site with multiple example forms** (for example registration, order/payment), each able to switch presentation between inline and popup. Later, a Node server demo (stateless validation endpoint sharing the form definition with the client, since jivs-engine running in Node is a main selling point; the user will supply docs), then optional React/Angular pages. **Not started.**
3. Keep `Jivs-dom_Implementation_Design.md` updated.

## Current state
- Playground: `packages/jivs-ui-demos/dom/playground/playground.ts`, `.css`, `index.html`. Popup mechanism options are set near line 146. Setup copies live in `src/jivs-setup/` (`create_JivsServices.ts`, `configureJivsDom.ts`); they are copied, not synced, and edits are marked `DEMO:`.
- CSS comes from the single source of truth, `@plblum/jivs-dom/assets/jivs-dom.css`, through the workspace link. When the user tweaks it while viewing the site, the edit is already in the SSOT.
- jivs-dom-tippy provides the real `IPopupMechanism` (`TippyPopupMechanism`, options `popupMouseLeaveDelay` and diagnostic `keepOpen`).
- Rules from the site work: unique `errorCode` per validator on a field; `regExp` defaults to Severe (the playground sets Error so several messages show); radio buttons need `<input>` + `<label for>` siblings; the validated/corrected visuals live on the Required Indicator element because `::after` does not render on inputs. More in `packages/jivs-ui-demos/planning.md`.

## What the user just finished (not yet shown in the playground)
All coded with tests, and documented in `Jivs-dom_Implementation_Design.md`. **Read the source and the design doc for exact options; do not rely on this summary.**
- **`TargetErrorMessageDisplayPresentation`** (`packages/jivs-dom/src/FieldPresentations/TargetErrorMessageDisplayPresentation.ts`). Shows the current error for the focused (or hovered) editor in a separate target element, for example a status bar. It only dispatches bubbling events on the target: `jivs-message-show` (detail has the field name, issues and content) and `jivs-message-clear`. Constants: `jivsMessageShowEventName`, `jivsMessageClearEventName`, `defaultTargetErrorMessageDisplayPresentationName` (`'targetErrorMessageDisplay'`). Your page code listens and decides what to render (for example restore the "editor usage" text on clear). Triggers: `showOnFocus` (default on), `showOnHover` (default off), plus custom triggers. Options are `TargetErrorMessageDisplayPresentationGlobalOptions` / `...Options`; the target selector supports the `{FieldName}` token.
- **`CompositeFieldPresentation`** (`.../CompositeFieldPresentation.ts`). One presentation that holds child presentations by name and forwards to each, so one error element can be, for example, Inline plus Target.
- **`PopupErrorMessageDisplayPresentation` anchors.** `anchorSelector` supports the `{FieldName}` token and searches the container first, then the document, so a popup can anchor on the editor or on an element elsewhere (banner at top or bottom).
- **Triggers on the presentation element:** `EditorFocusTrigger` and the user's `EditorHoverTrigger` (mouseenter/leave on the editor) via `options.triggers`.
- **Popup `apply()`** now lives in the popup class: validating during edit keeps an open popup in sync.
- **Known limits:** Popup plus Target on the same field is unsupported (use Composite for Inline plus Target); hover cannot be handled by `apply()` (the pointer is not visible). ARIA stays on the `ariaerror` element, so popups and targets need that element for screen readers.

## Likely next playground work (the user will direct)
- Examples: popup anchored on the editor with the indicator visible; the same with the indicator hidden by CSS and triggers set to editor focus/hover; a popup anchored to an element at the top/bottom of the page; a status-bar example using the Target presentation (usage text when no errors, error text on focus, restore on clear); Inline plus Target via Composite.
- Typing validation (`validate({ duringEdit: true })`) to demonstrate the focus-gap handling.
- Playground UI for choosing among these and for toggling `keepOpen` for DevTools work.
- Then the multi-form demo site, per "Next phases" in `packages/jivs-ui-demos/planning.md`.

## Working agreements
- The user decides priorities. "Assess, don't change" means no edits. He sometimes codes it himself and asks for review and tests.
- Question numbering: Q01, Q02, ...
- Tests: follow `planning/Testing_Approach.md` (hand-written fakes and `Publicify_` subclasses, `expect()` only, comments above `describe`).
- Windows, Node v22.1.0. Vite is pinned to 6.3.5 (Vite 8 fails on this Node).

## Commands
- Root `npm run compile` first (the site and other packages import `@plblum/jivs-engine/build/...` and jivs-dom `build/...`). Re-run after jivs-dom changes, since the playground has not been rebuilt against the new presentations.
- jivs-dom and jivs-dom-tippy tests, from the package folder: `$env:NODE_OPTIONS='--experimental-vm-modules --no-warnings'; npx jest --silent`. Type check: `npx tsc -p . --noEmit`.
- Dev server: from `packages/jivs-ui-demos`, run Vite in an async shell with `--port 5199 --strictPort`. The first browser load sometimes refuses the connection; retry.

## Deferred (do not do until asked)
- Popup disposal rework (removing an element does not call presentation `dispose()`; the playground cleans up `[data-tippy-root]` manually).
- Debug-level DOM logging panel.
- Hosting: needs Node; the user rents IIS hosting. Plan is an IIS reverse proxy to a Node process, pending an answer from the host. A static `dist/` deploy works meanwhile.
- Unresolved: whether Validate on an untouched empty Text editor should show "Requires a value." (engine vs rules).

## Not committed
At this time, all changes have been committed in the feature-jivs-ui-demos branch.
