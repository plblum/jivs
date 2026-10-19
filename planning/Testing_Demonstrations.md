# Candidate demonstrations for packages/jivs-dom/website

Parking lot of ideas gathered while writing jivs-dom unit tests. Nothing here is built yet. The website will be rebuilt on jivs-dom (the existing `playground-preview` does not use it) once the unit tests are in place, and will serve both user demonstrations and testing demonstrations.

## What belongs here
- Demonstrations are **integration oriented** and **meaningful to a UI observer**: an end user (or tester) exercises the page and sees something happen. Think "type a bad value, tab away, see the error and the invalid styling", not "a method returned X".
- Internals invisible to the user (for example `DomLoggingFacade`, base classes, factories, installers' plumbing) get **no entry**. Unit tests, and the demos that happen to use them, cover them.
- Each entry names the observable behavior and the interaction that triggers it. Group by user-facing feature, not by source class. Optionally note which classes it exercises.

When testing a class, append an idea only if it surfaces a user-visible behavior. Mark `[ ]` until built.

## User-facing features
- [ ] (add as behavior surfaces, for example: field validation on blur, form validation summary, inline vs popup error messages, required indicator, ARIA attributes for assistive technology, and the radio/checkbox/select/file editors)
