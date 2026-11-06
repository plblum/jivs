# Hand-off: jivs-ui-demos (playground + demo site)

Read this, then `Jivs-dom_Implementation_Design.md`, then `planning/Testing_Approach.md` (before any test work) and `packages/jivs-ui-demos/planning.md` (site decisions and lessons learned).

## What we are building
**jivs-ui-demos** (`packages/jivs-ui-demos`, private Vite multi-page site) shows jivs-dom driven by the real Jivs engine. It is for exploration, documentation support and promotion. It is not the product documentation (a later phase).

Several goals:
1. **Playground** (`dom/playground/`): a live page where a visitor picks an example, switches state/messages/editor/presentation, and sees the HTML plus `jivs-dom.css` result. It replaces the old emulated page at `packages/jivs-dom/website/playground-preview/` (retire it once the live one is accepted). **Completed**
2. **Demo site with multiple example forms** (for example registration, order/payment), each able to switch presentation between inline and popup. Later, a Node server demo (stateless validation endpoint sharing the form definition with the client, since jivs-engine running in Node is a main selling point; the user will supply docs), then optional React/Angular pages. **Not started.**
3. Keep `Jivs-dom_Implementation_Design.md` updated.

## Current state
- Playground: `packages/jivs-ui-demos/dom/playground/playground.ts`, `.css`, `index.html`. Setup copies live in `src/jivs-setup/` (`create_JivsServices.ts`, `configureJivsDom.ts`); they are copied, not synced, and edits are marked `DEMO:`.
- CSS comes from the single source of truth, `@plblum/jivs-dom/assets/jivs-dom.css`, through the workspace link. When the user tweaks it while viewing the site, the edit is already in the SSOT.
- jivs-dom-tippy provides the real `IPopupMechanism` (`TippyPopupMechanism`, options `popupMouseLeaveDelay` and diagnostic `keepOpen`).
- Rules from the site work: unique `errorCode` per validator on a field; `regExp` defaults to Severe (the playground sets Error so several messages show); radio buttons need `<input>` + `<label for>` siblings; the validated/corrected visuals live on the Required Indicator element because `::after` does not render on inputs. More in `packages/jivs-ui-demos/planning.md`.

### Demo site with multiple example forms
Just a list of ideas:
- One or more pages to show different aspects of a full form UI.
- Includes form fields, submit button, and validation summary.
- Another page shows two forms, each using different Validation Groups, each with its own submit button and Validation Summary.
- A third page that uses two different ValueHostsManagers, each to handle its own form with submit and validation summary. Otherwise the same as the previous.
- Control panel like in playground that adjusts the error message display throughout the page
- Need to come up with two real-world forms that can be side-by-side.
- Page content is not generated like it was in playground. User is expected to be able to read the page source to learn about jivs-dom.
- Submit button will have a presentation that disables it when ValidationState.doNotSave=true. We may have to add a FormPresentation for submit role.
- We are using this for two goals: testing in the browser and assisting the developer who uses jivs.
- Async validation in one form that employs a 1 second delay, allowing the submit button to disable and re-enable, and update validation summary. May need it to return invalid and valid states.
- Need to define a model, a companion ValueHostRulesBase subclass, and a form-specific subclass of that for each scenario. We can reuse them if we like.
- Forms should add their own ValueHosts beyond the needs of the model, such as calcValueHost, staticValueHost, and FieldValueHosts associated with UI manipulation elements (checkbox toggles visibility of another element for example). Any FieldValueHost used to enable others will use the enabler feature on ValueHosts.

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
