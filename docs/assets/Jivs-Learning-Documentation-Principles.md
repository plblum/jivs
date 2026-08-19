# Jivs Learning Documentation Principles

## Purpose

This document guides ChatGPT when developing the Jivs Learning documentation.

The Learning series is not another API reference. Its job is to help developers understand the value-management and validation workflows that already exist in an application, then show where Jivs participates.

The central principle is:

> **Teach value management and validation workflows first. Then show where Jivs participates.**

Keep the Learning documents short and approachable. Introduce a concept, make it tangible with a diagram and/or focused example, and stop before the topic turns into detailed reference material.

## Teach the System Before the Library

Validation is not an isolated operation. It participates in a larger system that includes values, conversion, validation, error communication, model transfer, submission, and server-side validation.

Help readers recognize that they are already making decisions about these responsibilities, whether or not Jivs is involved.

Start with technology-agnostic concepts where possible. Do not reshape generic concepts around Jivs implementation details merely because Jivs will be introduced later.

The generic **Value Manager** is the foundation for this mental model.

Its five responsibilities are:

- Obtaining Values
- Parsing
- Formatting
- Validating
- Communicating Errors

These are responsibilities, not necessarily separate objects or processing stages. An application may implement them together or separately, and not every environment needs every responsibility.

Important generic boundaries should remain generic. For example:

- obtaining values does not imply storing or owning them
- model transfer is outside the Value Manager
- UI presentation is outside the Value Manager
- HTTP processing and response construction are outside the Value Manager
- **Text Value** and **Native Value** are generic concepts
- **Error Message** is generic terminology; Jivs-specific issue terminology comes later

## Teach Workflows and Decisions

The Learning series should help readers understand how responsibilities participate in real workflows, not merely define vocabulary.

Important workflows include:

- initializing values
- editing values
- parsing Text Values into Native Values
- validating individual and related values
- communicating validation problems
- validating before submission
- building final model data
- sending data to the server
- validating and returning errors from the server

Parsing is especially important because the boundary between a **Text Value** and a **Native Value** is where many validation decisions become visible.

Help readers recognize the choices they are already making about parsing, formatting, model transfer, validation, and error communication.

## Treat Client and Server as Peers

Client-side and server-side value management are peer applications of the same underlying responsibilities.

Do not teach the client as the canonical case and introduce the server later as an advanced variation.

Their surrounding boundaries differ:

- the client emphasizes user interaction and validation feedback
- the server emphasizes security, data accuracy, business rules, APIs, and integrations

But both receive values, convert values when necessary, validate them, communicate problems, and produce usable data.

Show this relationship early enough that the reader develops one value-management mental model rather than separate unrelated client and server models.

## Introduce Jivs After the Generic Mental Model

The progression should generally be:

```text
Value Management
    ↓
Validation Workflows
    ↓
Workflow Decisions
    ↓
How Jivs Participates
    ↓
Jivs Implementation
```

Once the generic concepts are understood, introduce `ValueHost`, `FieldValueHost`, and `ValueHostsManager` together as the foundation of the Jivs mental model.

Introduce secondary concepts such as `JivsServices`, `ModelReader`, and `ModelWriter` when the workflow makes them relevant.

Do not expose deeper Jivs mechanics merely because they exist. Introduce them when the reader has a reason to need them.

## Show Jivs as a Participant, Not a Replacement Project

A developer should not feel required to replace working application infrastructure merely to use Jivs.

Jivs can participate in as little or as much of the value-management workflow as appropriate.

For example, an application may keep:

- an existing parser instead of using a Jivs parser
- an existing formatter instead of using a Jivs formatter
- existing model-transfer code instead of `ModelReader` or `ModelWriter`
- existing UI infrastructure
- existing server-side validation

Show Jivs options without implying that existing infrastructure is inferior simply because it is not implemented by Jivs.

The goal is to help readers understand the available choices and decide where Jivs provides value.

## Focus on Responsibilities, Workflows, and Decisions

Do not make single-source-of-truth architecture the story of the Learning series.

A strong SSOT may naturally emerge when application and business validation rules are organized around Jivs, but that is a consequence of some architectures rather than the learning objective.

Keep the teaching centered on:

- responsibilities
- workflows
- boundaries
- decisions
- how Jivs participates

## Keep Each Document Focused

Each Learning document should have a clear job and stop when that job is complete.

Do not turn an introductory document into a configuration guide or API survey.

Prefer this pattern:

1. introduce the concept briefly
2. show the important relationship or workflow
3. use focused code when it makes the idea concrete
4. stop before advanced variations take over
5. link to detailed documentation when the reader is ready for it

Existing detailed documentation such as configuration guides, `Jivs_API.md`, and TypeDoc should remain the place for exhaustive technical coverage.

## Use Diagrams as Teaching Tools

Diagrams are a primary teaching tool for relationships, boundaries, responsibilities, and workflows.

Prefer diagrams when they can establish the mental model faster than a large block of prose.

Important diagrams also have semantic descriptions in `Learning-Diagram-Specifications.md`. Those descriptions preserve the diagram's purpose, participants, relationships, emphasis, and reader takeaway so diagrams can be regenerated or revised without relying on visual memory alone.

The end-user Learning document owns the actual Mermaid source. The specification file owns the meaning needed to recreate it.

Update the semantic description when an important diagram is added or materially changed.

## Keep the Learning Path Flexible

These principles define the progression of ideas, not a permanently frozen table of contents.

The current document sequence may evolve as the Learning series develops.

When adding or reorganizing material, preserve the underlying progression:

- establish the generic mental model
- expose the relevant workflow
- help the reader recognize the decisions
- introduce Jivs concepts when they become useful
- move detailed configuration and reference material elsewhere

The sequence should serve understanding, not become a constraint for its own sake.
