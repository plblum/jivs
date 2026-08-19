# User Learning Documentation Handoff

This document is the handoff for continuing work on the Jivs end-user learning documentation in a fresh chat.

The actual learning documents, diagram specifications, existing end-user documentation, and source/context documents will be attached separately. **Do not reproduce or summarize their contents unnecessarily. Read them as the source of truth.**

## Project Goal

Replace the old `Learning.md` with a sequence of short, approachable learning documents.

The system is highly flexible and can become complex quickly. These learning documents should simplify the mental model rather than exhaustively document features.

The intended pattern is generally:

* introduce a concept briefly;
* use a diagram and/or focused code snippet to make it tangible;
* stop before the topic becomes deep;
* link to detailed documentation such as the configuration guide, `Jivs_API.md`, or TypeDoc.

The other existing end-user documents are **knowledge and linking sources only**. Do not rewrite them as part of this project unless explicitly requested.

## Working Style

The user keeps the authoritative Markdown files in their own repo.

Documents developed in ChatGPT are working copies. When the user supplies or attaches a newer repo copy, **that copy supersedes prior chat versions**.

Writing blocks have been used for iterative work. The working-block names used so far include:

* `UVM`
* `IntroJivs`
* `ConfVHM`
* `CreatingPart1`

The user will eventually request current Markdown for repo use.

### Requests for Input

Any request for user input must begin with a unique sequence number:

`S01`, `S02`, etc.

The previous chat reached **S146**. Continue with **S147** for the next request for input.

Do not reuse sequence numbers.

## Writing Style

These are documentation, not author prose.

* No first-person author voice such as “I designed...”.
* Engage the reader when useful, but avoid unnecessary use of “you.”
* Prefer role names when a role matters: architect, client-side developer, server-side developer.
* Personality is welcome when a phrase makes a concept easier to understand.
* Avoid personality for its own sake.
* Assume readers understand normal software-development concepts such as dependency injection, models, parsing, formatting, and client/server architecture.
* Explain Jivs concepts, not general programming fundamentals.
* Deliberately repeat important Jivs terminology rather than constantly finding synonyms.
* Preserve the author's intent when refining existing prose. Wording may be replaced, but understand what the original text was trying to communicate first.
* Prefer concise prose, diagrams, and code examples to lengthy explanations.
* Code examples should teach the minimum complete idea rather than expose every option.
* JavaScript/TypeScript-specific examples are appropriate.
* The author's `*Hint: ...*` and `*Note: ...*` style is intentional and may be used where helpful.

### Jivs Architectural Opinions Worth Reinforcing

Jivs is intentionally opinionated about relatively few things:

* separation of concerns;
* no UI inside the validation engine;
* dependency injection;
* single responsibility;
* configuration through the Builder API;
* business-logic validation rules can be the single source of truth.

Most other implementation choices should be presented as legitimate alternatives.

A developer should feel comfortable keeping existing application infrastructure rather than replacing it merely to use Jivs.

## Generic vs. Jivs-Specific Concepts

A major goal of the learning sequence is to establish generic validation/value-management concepts **before** introducing Jivs classes.

`Understanding_Value_Management.md` is intentionally mostly Jivs-agnostic.

Important generic terminology introduced there includes:

* **Value Manager**
* **Text Value**
* **Native Value**
* **Error Message**

The five generic Value Manager responsibilities settled in the previous chat are:

* Obtaining Values
* Parsing
* Formatting
* Validating
* Communicating Errors

Do not accidentally reshape these generic concepts around Jivs implementation details.

For example:

* model transfer is outside the Value Manager;
* obtaining values does not imply storing them;
* generic diagrams should not introduce Jivs classes;
* `Validation Issue` is Jivs terminology, while **Error Message** is the generic tangible concept used in UVM.

## Client and Server Perspective

Client and server are peers from the beginning.

Do not teach client behavior first and later reveal that the server is similar.

Both use substantially the same value-management capabilities, although their boundaries differ.

Server requests may originate from:

* user-facing web clients, often with text-oriented form data;
* published APIs, often with JSON already deserialized into an object.

The Value Manager does not own those boundary conversions or response mechanisms.

## Diagram Strategy

Mermaid is the primary diagram authoring format.

SVG may be considered later if Mermaid becomes too limiting.

Every important diagram also has an internal semantic specification in:

`Learning-Diagram-Specifications.md`

That file is authoring material, not end-user documentation.

The semantic specification owns:

* purpose;
* participants;
* relationships;
* emphasis;
* reader takeaway;
* current representation.

The end-user Markdown file owns the actual Mermaid source.

Do not duplicate Mermaid source into the specification file.

Try to give each diagram one main takeaway, but be flexible when a diagram is the center of a broader discussion.

When a diagram is added or materially changed, update `Learning-Diagram-Specifications.md`.

## Current Learning-Document Sequence

The sequence established so far is:

1. `Understanding_Value_Management.md`
2. `Understanding_Jivs.md`
3. `Intro_to_Creating_a_ValueHostsManager.md`
4. `Using_the_ValueHostsManager_within_the_Client.md`
5. `Managing_the_Client_Form_Lifecycle.md` — next document to develop

Additional documents, especially server-side learning material, will be decided later.

### Existing Detailed Configuration Document

The old `Configuring.md` is being renamed in the user's repo to:

`ValueHostsManager_Configuration_Guide.md`

with title:

`# ValueHostsManager Configuration Guide`

Its role is detailed configuration guidance.

This is deliberately distinct from:

`Intro_to_Creating_a_ValueHostsManager.md`

which is introductory learning material.

## Completed / Settled Document Roles

### Understanding_Value_Management.md

Purpose:

> Teach the generic validation/value-management mental model without requiring Jivs knowledge.

It ends with a very lightweight link to `Understanding_Jivs.md`.

`Validation-System-In-Context.md` was source material for this document, not a separate end-user document.

The user has additional thoughts about that source material and may revisit details later.

### Understanding_Jivs.md

Purpose:

> Teach the Jivs mental model, then stop.

It introduces only enough Jivs-specific terminology to recognize:

* `ValueHost`
* `FieldValueHost`
* `ValueHostsManager`
* `JivsServices`

Important positioning:

* Jivs implements the Value Manager introduced previously.
* `ValueHostsManager` is the concrete Jivs object corresponding to that conceptual Value Manager.
* `JivsServices` is required and is introduced early as the dependency-injection/customization infrastructure.
* Do not expand into Validator/Condition mechanics here.
* Do not teach configuration here.

### Intro_to_Creating_a_ValueHostsManager.md

Purpose:

> Explain how a configured `ValueHostsManager` is created.

Important ideas:

* rules class;
* Builder API;
* configuration;
* recurring construction pattern;
* model-driven rules as the preferred strong architecture when a business Model exists;
* form-only rules remain a fully legitimate scenario.

The document uses two examples:

1. Person/model-driven rules first.
2. Search form without a business Model second.

The model-driven example promotes business-logic validation rules as the **single source of truth** and demonstrates reuse/adaptation in the UI.

The rules class is important for:

* separation of concerns;
* independent testability.

Detailed Builder/API mechanics belong in `ValueHostsManager_Configuration_Guide.md`.

TypeScript imports were intentionally deferred because the current import list is visually heavy. Revisit import strategy only after more learning documents exist.

The user has added `export` to class definitions in their repo copy. Preserve that.

### Using_the_ValueHostsManager_within_the_Client.md

Purpose:

> Explain the interactive connection between an already-created `ValueHostsManager` and client UI code.

This document intentionally stops **before form initialization and submission**.

It is UI-framework agnostic.

The user wants readers reassured that framework/component-specific modules will eventually cover actual UI components. This learning document teaches the underlying Jivs interaction pattern.

Jivs currently has no UI module, so avoid language implying Jivs itself has opinions about UI presentation.

Use **interactive**, not “runtime,” when describing this client phase.

Important established concepts in this document include:

#### ElementIdentifier

`ElementIdentifier` is optional.

Its purpose is to make generic callback/helper code easier by giving an incoming `FieldValueHost` a way to resolve its related UI element.

The teaching progression is:

1. show the callback problem;
2. show application-defined lookup;
3. show `getElementIdentifier()`;
4. show the two ways to establish ElementIdentifier;
5. qualify that it is optional;
6. show common interpretations:

   * `document.getElementById()`;
   * `document.getElementsByName()`;
   * `document.querySelector()`.

The reusable helper has evolved to accept an optional pattern and uses:

`valueHost.getElementIdentifier(pattern)`

This supports uses such as:

`getElement(valueHost, '{0}-error')`

Do not separately document the helper's pattern parameter; the code reveals it.

#### Sending User Input

`change` sends the committed Text Value using:

`setTextValue(value)`

Optional `input` handling uses:

`setTextValue(value, { duringEdit: true })`

`duringEdit` determines whether the `input` event is wired.

Do not spell that out redundantly when the code already shows it.

When `duringEdit: true`, only validators intended for during-edit validation run, avoiding premature errors while a value is still being formed.

`setTextValue()` automatically triggers validation for that `FieldValueHost`.

#### Receiving Changes

Callbacks are attached to the config object returned by:

`rules.configure()`

before:

`new ValueHostsManager(config)`

The three callbacks currently being taught are:

* `onTextValueChanged`
* `onValueHostValidationStateChanged`
* `onValidationStateChanged`

The callback examples are deliberately lightweight glue.

They are **not** intended to prescribe polished UI presentation.

Framework-specific or fuller UI examples may appear later as suggestions.

`onTextValueChanged` must be presented cautiously because updating an input replaces its current text. It is particularly relevant when Jivs formatting is being used. Applications using their own parsing/formatting should normally keep their existing UI-update responsibility.

The user's current repo/working copy contains an edit to the text-value callback signature and obtains the current value with `valueHost.getTextValue()`. Treat the attached document as authoritative.

For field-level validation examples, show simple HTML containing an input and companion Field Error holder such as:

`FirstName`
`FirstName-error`

and use the helper pattern:

`getElement(valueHost, '{0}-error')`

The `Interactive Connection` closing section is considered satisfactory.

## Next Document: Managing_the_Client_Form_Lifecycle.md

This is the next major work item.

It begins where `Using_the_ValueHostsManager_within_the_Client.md` ends.

Its expected scope is:

* initializing the form / ValueHosts;
* form lifecycle concerns after interactive wiring;
* validation before submission;
* submission;
* producing/gathering final data or a Model;
* possibly a fuller combined example.

Do **not** automatically lock the TOC before discussion.

### Initialization Thoughts to Preserve

Initialization has multiple legitimate approaches, which can be unsettling if presented poorly.

The preferred direction when a Model exists is:

* send Native Values directly from the Model to ValueHosts;
* either one-by-one or through `ModelReader`.

Other legitimate cases:

* a widget/component knows how to initialize both the HTML and the corresponding ValueHost;
* the page arrives with pregenerated HTML values, making those elements the source:

  * read the element value;
  * use `valueHost.setTextValue()`.

The learning material should make these feel like clear starting conditions, not uncertainty.

### Submission Thoughts to Preserve

The old `Learning.md` contains submission examples that may be useful.

The lifecycle should eventually communicate roughly:

* validate;
* inspect overall Validation State;
* if invalid, callbacks already provide error information to the UI;
* if valid, obtain Native Values / build the final Model;
* submit or save.

Do not assume all of that belongs in one section until reviewed.

### Full Example

A “Putting It Together” example has been considered but is not guaranteed.

Decide whether it is useful only after the individual lifecycle sections are developed.

## Parsers and Formatters Later

The standard learning path has so far avoided separate/custom parsers and formatters.

Later, show variants for applications that already have those tools.

The user wants existing application code treated as an equally legitimate approach even though using the Jivs-provided toolset end-to-end is often simplest for new forms.

Do not interrupt the normal client learning flow with custom parser/formatter details too early.

## Source-Code Availability

The user can provide actual Jivs source code at any time.

The source is heavily documented and is the basis for TypeDoc.

When exact API signatures, callback contracts, overloads, configuration fields, or behavior matter, ask for or use supplied source rather than guessing.

In particular, do not invent callback signatures or API details merely because they are plausible.

## Files Expected in the Fresh Chat

The user intends to attach the same original knowledge/reference files, except this handoff replaces the old planning handoff.

Expected source/reference material includes:

* `Validation-System-In-Context.md`
* `README.md`
* renamed `ValueHostsManager_Configuration_Guide.md`
* `Jivs_API.md`
* `Terminology.md`
* old `Learning.md` for source/examples

The user will also attach every learning/documentation artifact generated during this project, including:

* `Understanding_Value_Management.md`
* `Understanding_Jivs.md`
* `Intro_to_Creating_a_ValueHostsManager.md`
* `Using_the_ValueHostsManager_within_the_Client.md`
* `Learning-Diagram-Specifications.md`

Read the attached versions before continuing. They may contain edits made by the user after the prior chat generated them.

## Immediate Resume Point

Resume with:

`Managing_the_Client_Form_Lifecycle.md`

Before drafting deeply, review the attached learning sequence and the relevant initialization/submission portions of the old `Learning.md`.

Continue to keep the new document shallow and workflow-oriented.

The next request for user input must begin with **S147**.
