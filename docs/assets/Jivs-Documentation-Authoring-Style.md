# Jivs Documentation Authoring Style

This document defines the writing style used for Jivs documentation.

It describes **how the documentation should be written**, not what the Learning series should teach or what Jivs architecture requires. Those subjects belong in separate project guidance.

## Write for the Reader

Technical accuracy is necessary, but the documentation should also help the reader make sense of the subject.

Write with awareness of what the reader is likely trying to understand:

- What is this?
- Why does it matter?
- Is this something I need to read?
- What should I know before continuing?
- Which details matter now, and which can wait?
- Are there several legitimate ways to approach this?

The writing should reduce unnecessary uncertainty without overexplaining ordinary software-development concepts.

Assume readers understand normal concepts such as models, dependency injection, parsing, formatting, callbacks, HTML, CSS, TypeScript, and client/server architecture.

Explain Jivs concepts and distinctions, not general programming fundamentals.

## Use the Author's Voice Selectively

The documentation should sound like a technically experienced person who cares whether the reader understands the material.

The voice should be:

- technically precise
- concise
- warm when warmth helps
- empathetic toward likely reader confusion
- comfortable acknowledging when something is subtle or has several legitimate approaches
- occasionally conversational when that makes an idea easier to understand

Do not force personality into every paragraph.

Section introductions, transitions into difficult concepts, `*Hint:*` and `*Note:*` passages, and places where readers may feel uncertain are often good places for a little more voice.

Brief humor or an aside is welcome when it helps the reader connect with the subject. Avoid humor, cleverness, or personality that competes with the technical point.

A good revision should sound like the author **after editing**, not like generic documentation prose and not like an unedited first draft.

## Lead the Reader Into Every Section

Do not begin a section by dropping directly into implementation details.

Each section should provide enough orientation for the reader to answer:

> **Is this something I need to read?**

For a small section, one sentence may be enough.

For a larger section, the introduction may also:

- identify the subject in practical terms
- explain when or why it matters
- preview important child sections
- show how those child topics fit together
- give the reader a useful big picture before details begin

An introduction should make the material that follows easier to understand. It should not merely restate the headings below it.

Keep introductions concise. Their job is orientation, not duplication.

When reviewing a section, check the introduction as carefully as the body. A technically correct section can still be difficult to follow if it starts too abruptly.

## Be Concise, but Do Not Remove Needed Orientation

Prefer concise prose, diagrams, and focused code over long conceptual explanations. fileciteturn26file0

Remove:

- unnecessary setup
- repeated explanations
- filler
- obvious conclusions
- long descriptions of concepts the reader already knows
- implementation detail that belongs in deeper documentation

Do not remove:

- the sentence that tells the reader why a section matters
- the distinction that prevents a common misunderstanding
- the transition that connects one concept to another
- a short example that makes an abstraction tangible

Concise does not mean abrupt.

## Preserve Author Intent, but Edit Aggressively

When the author provides prose, first understand what it is trying to communicate.

Preserve:

- intent
- technical meaning
- useful nuance
- author voice
- deliberate terminology
- meaningful emphasis

Then freely:

- tighten
- restructure
- combine
- split
- reorder
- replace wording

when that improves clarity.

Author-written text is not assumed to be final wording. It may be intentionally rough or verbose.

Do not preserve verbosity merely because the author wrote it.

Do not replace distinctive, useful author voice with generic documentation language merely because the generic version sounds more formal.

When the author has edited a working document, those edits supersede earlier generated versions. Never silently restore older wording during a later merge or refresh.

## Write Documentation, Not Author Commentary

These are documentation documents, not commentary about how the documentation was designed.

Avoid first-person author language such as:

- "I designed..."
- "I decided..."
- "I wanted..."
- "We chose this because..."

unless the document genuinely requires that perspective.

Describe the concept, responsibility, workflow, or decision directly.

## Engage the Reader Without Overusing "You"

Use reader-directed language when it helps.

Avoid repeatedly framing every sentence around "you."

When a role or system participant is more precise, use it:

- application
- client
- server
- client-side developer
- server-side developer
- architect
- Dispatcher Function
- Presentation Function

Use roles when the role matters.

## Repeat Terminology, Not Explanations

Deliberately repeat important Jivs terminology rather than constantly substituting synonyms. fileciteturn26file0

Terminology repetition helps the reader learn the vocabulary.

For example, once a concept has an established name, continue using that name rather than cycling through several approximate alternatives for stylistic variety.

At the same time, avoid repeatedly explaining the same concept unless the new context benefits from the explanation.

A useful rule is:

> **Repeat the term freely. Repeat the explanation only when it helps.**

## Prefer the Minimum Complete Example

Code examples should teach the minimum complete idea rather than expose every option. fileciteturn26file0

The first example should hook the reader into the concept with as little unrelated machinery as possible.

If the typical real-world use case is larger, follow the minimal example with that more realistic case.

Do not make the first example artificially complex merely because production code would contain more infrastructure.

Do not make examples so minimal that they teach a misleading or unusable pattern.

JavaScript and TypeScript examples are appropriate throughout the documentation. fileciteturn26file0

Use HTML and CSS examples when browser structure or presentation is part of the concept.

## Keep Examples Focused

An example should primarily teach the concept named by its section.

Avoid introducing unrelated:

- framework infrastructure
- configuration options
- error handling
- abstraction layers
- utility classes
- advanced APIs

unless they are necessary to make the example complete or correct.

When complex behavior properly belongs to an application framework or UI library, show the integration boundary instead of implementing a miniature replacement library.

Conceptual placeholders are appropriate when the documentation is deliberately delegating a responsibility elsewhere.

## Prefer Full, Understandable Code

When teaching an implementation, show enough code for the reader to understand the complete idea.

Avoid unexplained ellipses inside the core logic being taught.

Break long or difficult examples into small functions when that makes the responsibilities clearer.

Documentation examples should favor readability over cleverness.

## Use Comments Sparingly

Do not narrate obvious code with comments.

Use comments when they explain:

- why something is done
- an important constraint
- a non-obvious choice
- where application-specific behavior belongs

Prefer nearby prose when the explanation applies to the concept rather than one line of code.

## Use Diagrams to Carry Conceptual Weight

Prefer diagrams when relationships, flows, boundaries, or responsibilities are easier to understand visually.

Do not use diagrams merely as decoration.

A useful diagram should have a recognizable takeaway and reduce the amount of prose required around it.

The detailed rules governing the Learning-series diagrams belong in `Learning-Diagram-Specifications.md`, not in this style guide.

## Use Lists When They Improve Scanning

Bulleted lists are useful for:

- choices
- participants
- responsibilities
- conditions
- short property descriptions
- previews of upcoming subsections

Do not convert ordinary prose into lists merely to make the page appear shorter.

Keep list items grammatically consistent.

When list items are fragments, they generally do not need semicolons or a final period.

## Use Notes and Hints Intentionally

The author's styles:

```text
*Hint: ...*
```

and:

```text
*Note: ...*
```

are intentional and may be used when helpful. fileciteturn26file0

Use them for information that supports the main flow without deserving its own section.

Do not turn every qualification into a note.

## Avoid Unnecessary Recaps

Do not add a recap, summary, or conclusion simply because a document has reached the end.

If the reader has just learned the material, repeating it usually adds length without adding understanding.

A closing section is useful when it performs real work, such as:

- completing a workflow
- connecting several previously separate concepts
- showing a final combined example
- directing the reader to the appropriate next topic

## Use Brief Transitions Between Documents

Learning-oriented documents may end with a short transition to the next relevant document.

Keep the transition brief.

The footer should help the reader continue, not summarize the entire document again.

## Treat Headings as Navigation

Headings should help readers recognize what they will get from the section.

They may be:

- action-oriented
- concept-oriented
- task-oriented

depending on the material.

Do not force one heading style everywhere.

Avoid vague headings when a more concrete one would help the reader decide whether the section is relevant.

## Handle Multiple Approaches Case by Case

Do not force every topic into:

- one prescribed solution, or
- a neutral list of supposedly equivalent alternatives.

When one approach has a meaningful advantage, say so.

When several approaches are legitimately useful in different situations, explain the distinction briefly.

The appropriate level of opinion depends on the subject.

## Do Not Create Complexity Merely to Be Complete

The documentation should not attempt to anticipate every variation.

Show enough variation for the reader to recognize the concept and apply it.

Stop when additional detail belongs more naturally in:

- API documentation
- TypeDoc
- a configuration guide
- framework-specific documentation
- specialized UI-library documentation
- another focused learning document

## Keep Working Copies and Authoritative Copies Distinct

The author's repository Markdown files are authoritative.

Chat-generated documents are working copies.

When a newer repository copy is supplied, it supersedes earlier working versions. fileciteturn26file0

When working on one section of a larger document:

- isolate it when requested
- preserve edits made to that isolated section
- remember omitted surrounding sections still exist
- merge it back only when instructed
- do not accidentally delete material that was outside the temporary working block

## Make Changes Traceable

When revising a working document, provide a terse change summary describing what was intentionally changed.

Do not imply that untouched sections were rewritten.

When asked only for review or comments, do not edit the document.

## Verify Technical Details Rather Than Guessing

When exact API behavior matters, use supplied source code or current authoritative documentation.

Do not invent plausible:

- callback signatures
- overloads
- configuration properties
- enum behavior
- API semantics

The Jivs source code is heavily documented and should be consulted when precision matters. fileciteturn26file0

This is primarily a documentation-workflow rule rather than a writing-style preference, but it protects the accuracy of examples.

## Clean the Final Markdown

Before producing Markdown intended for the repository, remove authoring artifacts such as:

- internal citation tokens
- writing-block metadata
- encoded whitespace artifacts
- malformed Markdown emphasis
- temporary identifiers
- accidental chat/tool output

Do not "clean up" intentional authored Markdown while removing these artifacts.

## Final Editing Test

Before treating a section as finished, ask:

- Does the opening tell the reader what this section is about?
- Can the reader tell whether they need to read it?
- Does the section provide enough big-picture context before details?
- Is the prose tighter than the likely first draft?
- Did the revision preserve the author's intent and useful voice?
- Are established terms used consistently?
- Is explanation repeated only where it helps?
- Does the first example teach the minimum complete idea?
- If the typical use case is larger, is that case represented?
- Are ordinary programming concepts assumed rather than retaught?
- Has unnecessary recap or implementation detail been removed?
- Does the result sound like the author after editing?