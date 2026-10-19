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
- [ ] (add as behavior surfaces, for example: field validation on blur, form validation summary, inline vs popup error messages, required indicator, ARIA attributes for assistive technology, and the radio/checkbox/select/file editors)
