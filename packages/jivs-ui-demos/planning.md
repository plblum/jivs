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

## Demo page design (in progress)

The demo index and playground already exist. The remaining planned pages are:
1. A simple registration form: one form, one model, one `ValueHostsManager`, and no Validation Groups.
2. One form containing registration and order scenarios, with one `ValueHostsManager` and Validation Groups separating their validation.
3. Two forms, registration and order, each with its own `ValueHostsManager` and no Validation Groups.
4. Server-side validation using a model and business rules shared with client-side code.

**Agreed example scenarios:** a tradeshow attendee event registration and order/payment. Registration is the only scenario in the simple-form and server-side demos. Its model will include first name, last name, job title, home state, home country, company name, company email, business type (`Retail sales`, `Wholesaler`, `Distributor`, `Producer`), and role (`Senior management`, `Sales / business development`, `Marketing`, `Procurement / buying`, `Operations`, `Product / category management`, `Other`). Home state and country represent the attendee's residence, not the business location, to personalize the badge. Both country and state are text inputs. Home state is shown and enabled only for a US home country; an enabler rule will disable its `FieldValueHost` otherwise. State validation accepts case-insensitive two-character codes for the 50 US states, and `reformatTextValue` with a formatter normalizes the state to uppercase. A custom case-insensitive country parser maps supported country forms to full country names for US, CA, MX, and GB. Accepted aliases: `US`, `USA`, `United States`, `United States of America`; `CA`, `Canada`; `MX`, `Mexico`; `GB`, `UK`, `Great Britain`, `United Kingdom`. First name, last name, home country, company name, company email, business type, and role are required; job title is required only when role is `Senior management`, using a `WhenCondition` whose `when` checks the role and whose `then` is `RequireTextCondition`; home state is required only for a US home country. Company email validation checks syntax only.

In the attendee section, place the home country code input after job title, followed by home state; hide and disable state when the country is not US.

The order/payment scenario is a single registration for a two-day event, with simulated—not real—payment. Either day costs US$10; both days together cost US$18 before any discount. The order form will demonstrate reading numeric values from multiple ValueHosts and using a `CalcValueHost` calculation for the total. Display the calculated total as well as a non-editable discount value. The attendee's country supplies the selected culture and a fixed illustrative conversion rate. Country-to-culture mapping: US → `en-US`, CA → `en-CA`, MX → `es-MX`, GB → `en-GB`. Label converted amounts as illustrative rather than live exchange rates. The previous single-price `FieldValueHost` display approach is superseded by the calculated-total design below.

Add a discount-code field with an asynchronous Jivs validator that simulates asking a server whether the code is valid and retrieving its discount value in USD. The field displays its own validation error. Convert the returned USD discount to the selected local currency on the client and write the value to a UI-specific `StaticValueHost`, making it available for display and the total calculation. Do not put this UI-specific host in the shared business model.

**Prerequisite engine design, in a separate chat:** expand `StaticValueHost` and `CalcValueHost` to support formatting their native values and writing formatted text to an editor, so their values can be displayed using currency formatting. Design this feature before implementing the order form; the user will develop it in another chat. The previous proposed `TextValueAdapter` for a `<span>` may be relevant, but how it fits the new host support remains a design decision. `CalcValueHost.getValue()` currently calculates on demand, so the design must also address how dependency changes and currency/culture changes refresh the displayed discount and total.

Open order-design details include day-selection controls and whether selection is required; discount-code examples, timing and behavior for invalid, cleared, pending, or superseded requests; conversion rates and rounding; and how an existing payment approval is handled if the payable total changes. Do not assume answers until these are designed.

**Payment dialog design:** move payment entry into its own modern HTML `<dialog>` modal with Submit and Cancel buttons. It is a separate form with its own `ValueHostsManager`; its model contains only the three card-entry fields (number, expiry, security code). The separate simulated payment service handles the entire transaction. On approval, the dialog closes and returns a transaction ID, which is what the order model stores; card details are not part of the order model. Clearly label the card data as fake/demo-only.

The dialog will explain its Jivs features and provide annotated demo tools, including one sample-card button that fills all three fields with safe fake values and a compact simulated-response selector. The selector can exercise approval, payment decline, or field-specific server errors for card number, expiry, or security code; its default selection is Payment declined. The dialog displays the localized amount passed by the order page, without adding it to the three-field card model. Reuse the `CreditCardNumberParser` and `CreditCardNumberCondition` in `jivs-examples`: the parser removes spaces and hyphens and rejects other non-digits, while the condition checks Luhn and optional configured card-type rules. It does not impose a universal 12–19 digit limit; decide separately whether the demo needs an additional length rule. Security code validation requires 3 or 4 digits. Expiry is a single `MM/YY` text field, using `ExpiryParser` configured for month-first input with `/`. After local validation, Submit invokes the simulated payment service asynchronously, with a 3-second delay and visible processing state; while pending, disable both Submit and Cancel. Map server error codes to the dialog's field names so field issues appear both beside the relevant field and in its Validation Summary; a transaction-level decline appears in the summary only. This demonstrates server-reported errors, distinct from the asynchronous discount-code validator. Keep the dialog open on decline or field error for correction/retry or cancellation. Cancel closes without returning a transaction ID and clears the card-entry values. After approval, return the transaction ID, then clear the dialog's fields and validation state before reuse.

**Expiry parsing:** `jivs-examples/src/ExpiryDataType.ts` now provides an `ExpiryParser` that returns a UTC `Date` on the first of the month and a `StringPatternedExpiryParser` for a templated string. The implementation uses subclasses rather than the earlier proposed injected conversion interface. Interpret a two-digit input year as `20YY`; trim surrounding whitespace and accept both zero-padded `MM/YY` and non-padded `M/YY` input. Configure the parser for that input order and separator rather than assuming the example's default registration does so. A separate expiry validation rule must allow the current month through its end.

**Supporting data-type tooling precedes the forms.** Reuse/copy the existing `EmailAddressDataType`, `CreditCardNumberDataType`, and `ExpiryDataType` examples from `packages/jivs-examples/src`. Use `CleanUpStringParser` with `convertCase` for state-code normalization, alongside the uppercase formatter and validation against the 50 state codes. Reuse `StringMappingParser` from `jivs-examples` for state codes and country aliases. Each mapping group is an array of strings: the first is the canonical value, and the rest are accepted input aliases. Matching is case-insensitive; a match returns the exact first string, preserving its canonical casing. Unmatched nonempty input is rejected with configured error-message/localization information through the parser's data-type resolution error. Register all required custom data-type support before building the forms.

The attendee experience will use the fictional event name **MarketingLife Expo** and a playful, colorful logo/wordmark on the demo screens. Avoid `MarketBridge`, which the user notes is a real company name.

The simple registration page's control panel will only switch the error-message presentation between inline and popup. Visitors will interact with the form itself rather than use playground-style sample-value controls.

The registration form will be presented in two clear sections: attendee information and company information. The detailed semantic markup and responsive CSS are delegated to implementation design.

The Validation Summary will remain inline near the top of the form in both display modes; the inline/popup switch changes field-level error presentation only.

The registration submit button will call `valueHostsManager.validate()` and show a simulated confirmation only when validation succeeds; it will not persist or send data.

The registration form will not add a UI-only confirmation field; it will use the shared registration model shape directly.

All registration data rules (requiredness, conditional title/state requirements, email syntax, and country/state normalization) belong to the shared model rules so the server can reuse them. The form-specific rules subclass will adapt labels/messages or add genuinely form-specific configuration, not UI-only model properties.

The Validation Groups example will be a two-view wizard in one form: registration first, order/payment second, with one `ValueHostsManager` and a group for each view. Next is enabled on the registration view and validates its group before advancing; Previous is disabled there and enabled on the order view; Submit is always visible but enabled only when both groups are valid, including an approved payment transaction. Previous validates the second view's group, then always navigates back even if invalid; Submit validates all groups. One shared Validation Summary will be visible across both views; a `ValidationSummaryPresentation` `IssueClicked` handler will switch to the view containing the clicked issue's field and focus the associated editor. The localized order price uses the current country value from the registration view and updates if that value changes.

The wizard will have one shared inline/popup field-error presentation switch for both views. The Validation Summary remains inline, and the payment dialog's field errors remain inline.

On the wizard's order view, a separate payment action opens the payment dialog. Approval sets the transaction ID in the parent order model and closes the dialog; the wizard's own Submit remains a separate action that validates all groups. The order group is invalid until a transaction ID has been returned. Cancel closes without a transaction ID and clears the dialog's card-entry values.

Each approved simulated payment generates a new fake transaction ID, shown when payment is approved and again in the final order confirmation.

The same payment dialog implementation and its dedicated `ValueHostsManager` will be reused from both the wizard and the separate-manager page; each parent order model receives only its own transaction ID.

The two-form/two-manager comparison page will use one shared page-level inline/popup error-presentation switch for both forms. The payment dialog's field-level errors remain inline regardless of the host page's switch.

Each form on that page will have its own Validation Summary and submit button. Submitting validates only that form's `ValueHostsManager` and shows a simulated confirmation on success, demonstrating independent state and validation. The order form's submit remains enabled before payment; validation reports the missing transaction ID until the payment dialog succeeds. The order manager validates only its own order/payment data, independently of registration validity. The order price's selected culture and display update immediately as the registration form's country changes, coordinated outside the independent managers. Until a supported country is recognized, show a prompt rather than assuming a default currency.

The two forms appear side by side on wide screens and stack on narrow screens.

Because the demos contain valuable custom behavior, pages should identify and explain those features and link to the relevant source files on GitHub's main branch (without line anchors). Distinct custom logic, such as the issue-click handler, rules subclasses, parser, and formatter, may live in separate code files so each feature is easy to find.

Each form page is expected to consider a control panel, readable HTML form, Validation Summary, submit behavior, a UI-independent model, model-level rules in a `ValueHostRulesBase` subclass, and form-specific rules that adapt or extend those model rules. Any UI-only model extensions belong to the form layer, not the shared model. Submit may validate locally and show a fake success response; it does not need to save or send real data.

## Next phases
1. Finish designing the registration tooling and presentation, including the event identity.
2. Implement and register supporting data types, parsers, and formatters before implementing the registration form.
3. Design and develop `StaticValueHost` and `CalcValueHost` formatting/editor support in a separate chat before implementing the order form; resolve order and discount behavior.
4. Implement the agreed form examples and client-side behaviors.
5. Design and implement the Node server demo after its shared model and rules are defined.
6. Revisit deployment after the hosting question is resolved.
7. Consider React and Angular pages.
