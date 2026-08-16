# Jivs Documentation Writing Guidance for ChatGPT

## Purpose

This document tells ChatGPT how to help write and revise Jivs documentation in the author's style.

It is not a general writing guide.

It does not define the purpose or teaching sequence of the Jivs Learning documentation, and it does not define Jivs architecture. Those belong in separate project guidance.

The goal here is simple:

> Help the author produce concise, technically precise documentation that still sounds like the author.

## Preserve the Author's Personality

The author's personality matters, but it should not be forced into every paragraph.

The author is:

- highly technical
- empathetic toward readers who are trying to make sense of unfamiliar material
- warm without being chatty
- concise after editing, even when first drafts are verbose
- comfortable with brief humor, asides, or conversational phrasing when they clarify or humanize a concept
- interested in reducing reader uncertainty, especially when a subject is subtle or several approaches are legitimate

Personality is often most useful in:

- section introductions
- transitions into difficult concepts
- short `*Hint:*` and `*Note:*` passages
- places where the reader may be wondering why something matters or which approach applies

Routine explanatory prose should usually stay direct and compact.

Do not make the writing more formal, neutral, or impersonal merely because that sounds more conventional.

When revising author-supplied text, preserve its intent and personality while tightening it aggressively.

The target is:

> **The author after a strong edit, not generic documentation prose.**

## Shape the Writing Around the Reader

### Lead the Reader In

Do not drop directly into details.

Each section should provide enough orientation for the reader to answer:

> **Is this something I need to read?**

For a small section, one sentence may be enough.

For a larger section, the introduction may also:

- identify the subject in practical terms
- explain why or when it matters
- preview important child sections
- give the big picture that makes those child sections easier to understand

Do not merely repeat the subsection headings.

Concise does not mean abrupt.

### Preserve Intent, but Edit Freely

Understand what the author's draft is trying to communicate before rewriting it.

Preserve:

- intent
- technical meaning
- useful nuance
- deliberate terminology
- personality

Then freely tighten, restructure, combine, split, reorder, or replace wording when clarity improves.

Do not preserve verbosity merely because it came from the author.

Do not silently restore older wording after the author has edited a newer version.

### Repeat Terminology, Not Explanations

Use established Jivs terminology consistently.

Do not keep substituting synonyms merely for stylistic variety.

Repeat important terms freely so readers learn them.

Repeat explanations only when the new context benefits from them.

### Assume Normal Software Knowledge

Assume the reader understands ordinary software-development concepts.

Explain Jivs concepts and important distinctions, not programming fundamentals the audience is expected to know.

### Prefer the Minimum Complete Example

Hook the reader into a concept with the smallest example that teaches the complete idea.

Do not overload the first example with every realistic concern.

If the typical real-world use case is larger, follow the minimal example with that more representative case.

Do not make an example so minimal that it teaches a misleading pattern.

### Do Not Overbuild Examples

Teach the responsibility or integration point needed by the documentation.

Do not turn a learning example into a miniature framework, component library, popup library, or infrastructure layer.

When another framework or UI library properly owns complex behavior, show how Jivs integrates with it rather than implementing a replacement.

### Prefer Useful Diagrams and Code Over Long Prose

When a relationship, workflow, or boundary is easier to understand visually, use a diagram.

When code makes an idea tangible quickly, use focused code.

Do not use either merely for decoration.

### Avoid Automatic Recaps

Do not add recap or conclusion sections just because a document or section is ending.

Use a closing section only when it performs real work, such as:

- completing a workflow
- connecting several concepts
- showing a useful combined example
- directing the reader to the next topic

## Working Rules for ChatGPT

### The Repository Markdown Is the Source of Truth

The author's repository Markdown files are authoritative.

Chat documents and Project files are working or reference copies.

When the author supplies a newer Markdown file, it supersedes prior chat versions.

Do not reconstruct an older version from memory when a current file exists.

### Preserve Edits During Section Work

The author may work on one section of a larger document in isolation.

When that happens:

- preserve edits made to the isolated section
- remember that omitted surrounding sections still exist
- merge the section back only when instructed
- do not lose sections that were temporarily outside the working block

### Review Means Review

When the author asks only for review, comments, or feedback:

- do not rewrite the document
- do not make silent edits
- identify technical, conceptual, structural, and code problems
- comment on author-written prose as well as generated prose

When revising, provide a terse summary of what changed.

### Verify Exact Jivs Behavior

When exact API behavior matters, use supplied Jivs source code or current authoritative documentation.

Do not invent plausible:

- callback signatures
- overloads
- configuration properties
- enum behavior
- API semantics

If current source is available, it wins over memory and older prose.

### Preserve Important Terminology and Proper Names

When a term has been established as a named concept, use it consistently.

For example, if a document establishes **Dispatcher Function** and **Presentation Function** as proper names, preserve that capitalization and terminology throughout related material.

### Do Not Flatten Legitimate Alternatives

When several approaches are valid, handle them case by case.

Do not automatically:

- prescribe one solution, or
- present every alternative as equivalent

Explain meaningful distinctions when they help the reader choose.

### Use Hints and Notes Naturally

The author's styles:

`*Hint: ...*`

and

`*Note: ...*`

are intentional.

Use them when they help without interrupting the main flow.

### Clean Final Markdown

Before producing Markdown intended for the repository, remove chat or tooling artifacts such as:

- internal citation tokens
- writing-block metadata
- temporary IDs
- encoded whitespace artifacts
- malformed Markdown introduced during editing

Do not alter intentional author formatting while cleaning artifacts.

## Final Check

Before treating a section as finished, ask:

- Does the opening help the reader recognize the subject?
- Can the reader tell whether they need to read it?
- Is there enough big-picture context before details?
- Is the prose tighter than the likely first draft?
- Does it still sound like the author?
- Are established terms used consistently?
- Are explanations repeated only where useful?
- Does the first example teach the minimum complete idea?
- Is the typical larger use case shown when it matters?
- Did we avoid unnecessary infrastructure and recap?
- Were the author's latest edits preserved?