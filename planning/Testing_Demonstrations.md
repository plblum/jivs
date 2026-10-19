# Candidate demonstrations for packages/jivs-dom/website

Parking lot of ideas gathered while writing jivs-dom unit tests. Nothing here is built yet. The website will be rebuilt on jivs-dom (the existing `playground-preview` does not use it) once the unit tests are in place, and will serve both user demonstrations and testing demonstrations.

## What belongs here
- Demonstrations are **integration oriented** and **meaningful to a UI observer**: an end user (or tester) exercises the page and sees something happen. Think "type a bad value, tab away, see the error and the invalid styling", not "a method returned X".
- Internals invisible to the user (for example `DomLoggingFacade`, base classes, factories, installers' plumbing) get **no entry**. Unit tests, and the demos that happen to use them, cover them.
- Each entry names the observable behavior and the interaction that triggers it. Group by user-facing feature, not by source class. Optionally note which classes it exercises.

When testing a class, append an idea only if it surfaces a user-visible behavior. Mark `[ ]` until built.

## User-facing features
- [ ] Text editor synchronization: type into an input or enter multiline text in a textarea, then update the field value through Jivs and observe each editor reflect it (InputTextValueAdapter, TextAreaTextValueAdapter).
- [ ] Single-select synchronization: choose an option and observe its configured value flow through Jivs; update the field value and observe the corresponding option become selected (SelectTextValueAdapter).
- [ ] Checkbox text synchronization: check/uncheck a checkbox and observe its configured string value or empty text flow through Jivs; write the configured value through Jivs and observe the checkbox become checked (CheckboxTextValueAdapter).
- [ ] Radio-group text synchronization: select a radio option and observe its value flow through Jivs; update the field value and observe the matching sibling radio become selected, whether the anchor or its container holds Jivs state (RadioButtonsTextValueAdapter).
- [ ] File-name validation: select one or more files and observe their names, joined by `|`, become the field's text value for required or pattern validation; the adapter never writes file selections (FileInputTextValueAdapter).
- [ ] Required editor accessibility: install a required editor and verify assistive technology receives `aria-required="true"`, while authored `aria-required` values remain intact (EditorAriaStaticUpdater).
- [ ] Wrapped radio-group accessibility: install radio buttons inside a wrapper and verify the wrapper is exposed as a radiogroup, while preserving any author-specified role (WrappedRadioButtonsAriaStaticUpdater).
- [ ] Required-indicator accessibility: install a visual required marker and verify assistive technology does not announce it redundantly with the editor’s required state; preserve author-provided `aria-hidden` (RequiredIndicatorAriaStaticUpdater).
- [ ] Popup error accessibility: activate the popup error trigger with keyboard or pointer and verify it has button semantics and a localized accessible name unless the markup supplies its own accessible name (PopupErrorMessageDisplayStaticUpdater).
- [ ] Validation summary announcements: trigger form validation and verify the summary is announced as a polite, atomic status region, while authored live-region attributes remain respected (ValidationSummaryAriaStaticUpdater).
- [ ] Editor validation accessibility: create an invalid field and verify its editor exposes `aria-invalid` and the eligible error-message relationship, then correct it and confirm both attributes clear; warning-only issues do not mark it invalid (EditorAriaValidationStateUpdater).
- [ ] Dedicated ARIA error text: create a visually hidden `aria-error` element, trigger one or more field issues, and verify plain-text messages are available to assistive technology and clear when the issues are removed (HiddenErrorMessagesAriaValidationStateUpdater).
- [ ] (add as behavior surfaces, for example: field validation on blur, form validation summary, inline vs popup error messages, required indicator, ARIA attributes for assistive technology, and the radio/checkbox/select/file editors)
