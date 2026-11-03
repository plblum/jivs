# jivs-ui-demos planning

Working notes so the project can continue without the original chat.

## Goals
- Show jivs-dom HTML and CSS driven by the real Jivs engine.
- Let visitors change configuration (state, messages, editor, presentation) and see the result.
- Show popup error presentations (`PopupErrorMessageDisplayPresentation`) with a real `IPopupMechanism` (Tippy).
- Later: server-side validation in Node, a main selling point of jivs-engine.
- Positioning of popups is the job of Tippy/Popper. We only verify it happens.

## Decisions
1. **Separate workspace** (`packages/jivs-ui-demos`, private), not inside jivs-dom, so jivs-dom has no reference to Tippy.
2. **CSS SSOT**: import `@plblum/jivs-dom/assets/jivs-dom.css` through the workspace symlink. No duplicate to sync.
3. **Starter code is copied, not synced**: `src/jivs-setup/create_JivsServices.ts` and `configureJivsDom.ts`. The files have a header saying they diverge; edits are marked `DEMO:`. Changes to the originals in `starter_code/` are applied manually. (The user has already cleaned up eslint issues in both the originals and these copies.)
4. **Multi-page Vite site**: one HTML entry per area so React and Angular pages can be added.
5. **SimpleDom** is used for jivs-dom (`SimpleDomElementCollector`, `FormInstaller`).
6. **Vite 6.3.5 pinned**: Vite 8 (rolldown) fails on Node v22.1.0.
7. **jivs-dom publishing**: `files` whitelist (`build`, `assets`, `Implementing_IPopupMechanism.md`) added to jivs-dom's package.json. No `exports` map, since other packages deep-import `build/...`.
8. **No automated browser tests** (Playwright declined). Unit tests skipped for now.

## Hosting plan
- Needs Node for the server demo. The user rents shared IIS hosting. Suggested approach: IIS reverse proxy (URL Rewrite + ARR) to a Node process run as a Windows service (NSSM, WinSW or pm2); serve the site and API from one origin; add rate and body-size limits.
- **Open**: shared hosting may not allow Node or services. Ask tech support. A static-only deploy of `dist/` works meanwhile.
- Dev: `vite.config.ts` proxies `/api` to `http://localhost:3000`.

## Engine notes found while building
- `DataTypeParserService.isActive()` (and the formatter's) did not run the lazy loader, so the first `setTextValue` skipped parsing and the native value was unset. The playground works around it with one throwaway `parse('', LookupKey.String, 'en-US')` after creating services. The owner is fixing this in jivs-engine for all lazy-loaded services; remove the workaround in `ensureServices()` once that lands.
- Each validator on a field needs a unique `errorCode`; error messages are cached by errorCode.
- All Error-severity validators run. Only Severe stops the chain.
- Editor presentation names are the library defaults (`inputEditor`, `checkboxEditor`, `radiobuttonsEditor`, `selectEditor`, `textareaEditor`, `fileInputEditor`, `wrapped*Editor`).
- `FormInstaller.install(vhm, collector, useTextValue = true, useNativeValue = false)`. Roles via `data-jivs-role`: editor, error, label, required, container, summary, submit, aria-error. `data-jivs-presentation` names a registered presentation.

## Status
- Done: scaffold, setup copies with Tippy, playground with 11 specimens (6 inline, 5 popup).
- Playground editor issues are fixed and verified in a browser for all 5 editors x invalid/validated/corrected. Lessons:
  - Stale messages: the cause was `ValueHostRulesBase` caching, which retained the previous builder config. It is fixed in `PlaygroundRules`. Per-rebuild fresh services were only a workaround that masked it and have been removed. JivsServices and JivsDomServices are stateless.
  - Radio buttons of a group must share one parent (siblings with the same name). Use `<input>` + `<label for>` pairs, never inputs nested in labels.
  - The checkbox text value is the input's `value` attribute, so the playground sets `value="true"` for a Boolean field.
  - `corrected` is set only by the validation that moves Invalid to Valid. Do not call `validate()` again after the valid entry, because it clears the flag. The editor's change event already validates.
  - `regExp` defaults to Severe (Category DataTypeCheck), which stops later validators. The playground sets `severity: ValidationSeverity.Error` so multiple messages show.
  - `::after` indicators (jivs-validated, jivs-corrected, jivs-required) do not render on input/select/textarea. The playground puts validated/corrected on the Required Indicator (empty span, content from `::after` only), placed between editor and error. Wrapped editor presentations are the alternative.
- Open: the top controls (state/messages/editor) may become a presentation-name or description picker.
- Old emulated playground at `packages/jivs-dom/website/playground-preview/` is still present. Retire once the live playground is accepted.

## Playground rework (done, items 5 and 6 deferred)
1. Done: control panel starts with an example dropdown (grouped Inline / Popup). One example at a time. URL-hash selection is undecided.
2. Done: action buttons Reset (rebuilds the form, clearing editors and validation), Enter invalid value, Enter valid value (both go through the editor change event, so invalid then valid gives Corrected), Validate (`ValueHostsManager.validate()`), Preliminary validate (`validate({ preliminary: true })`, which skips the Require validator).
3. Done: "Allow multiple messages" checkbox.
4. Done: Side by side / Stacked radios, default side by side. Switching only swaps the CSS class.
5. Deferred: popup cleanup still removes `[data-tippy-root]` nodes. It should use presentation `dispose()`. Problem: removing an element does not invoke `dispose()` on the presentation owned through `IJivsElement`, and no suitable DOM event exists. Needs brainstorming.
6. Deferred: debug-level logging option with a new `ILoggingService` that writes to the DOM (a log panel).
7. The parser lazy-load workaround was removed after the engine fix.

Open question: Validate on an untouched empty Text editor shows no "Requires a value." message. Check whether that is engine behavior (field never edited) or a rules issue.

## Next phases
1. Fix playground editor issues; apply user's notes.
2. Example forms with inline/popup switch: registration and order/payment (fields to be designed with the user), sharing a form definition between client and server.
3. Node server demo: stateless validation endpoint, no database (user will supply docs).
4. Deployment per hosting answer.
5. Possible React and Angular pages.
