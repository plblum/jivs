# Jivs Documentation Project

## Purpose

This project is redesigning the onboarding and learning experience for Jivs.

The goal is not to rewrite API documentation.

The goal is not to create another technical reference.

The goal is to help developers understand value management and validation workflows, then understand where Jivs participates in those workflows.

---

# Existing Documentation

The repository already contains:

- README.md
- Learning.md
- ValueHostsManager_Configuration_Guide.md
- Jivs_API.md
- TypeDoc-generated API reference

These documents contain substantial technical information.

The challenge is not missing information.

The challenge is making the information easier to understand and connect to real-world validation workflows.

---

# Core Discovery

The most important discovery of this effort is:

> We are not trying to teach Jivs.
>
> We are trying to teach value management and validation workflows, then show where Jivs participates.

This shifts the focus away from APIs and implementation details and toward the responsibilities every validation system must support.

## Secondary Discovery

Developers often do not realize how much infrastructure surrounds validation.

When building forms and APIs, they frequently implement:

- Parsing
- Formatting
- Validation
- Error communication
- Model transfer
- Form submission logic
- Server-side validation

as separate pieces.

One purpose of the documentation is to reveal this ecosystem and help users recognize that these responsibilities already exist, regardless of whether Jivs is involved.
---

# Validation Is More Than Validation

Developers often think validation looks like:

```text
Input
    ->
Validation
    ->
Error Message
```

In reality, every validation solution must also support:

- Models
- Input elements
- Parsing
- Formatting
- Validation
- Error communication
- Submission workflows
- Server validation
- Error return workflows

Many developers have implemented these pieces without viewing them as parts of a single system.

One purpose of the documentation is to reveal these responsibilities and show how they fit together.

---

# The Value Manager Concept

During workflow discussions, the term **Value Manager** is used as a technology-agnostic concept.

It intentionally avoids Jivs implementation details.

A Value Manager is responsible for activities such as:

- Parsing
- Formatting
- Validating
- Communicating Errors

At this stage:

- ValueHost
- FieldValueHost
- ValueHostsManager

are not yet introduced.

The reader should first understand the role the Value Manager plays within the overall workflow.

---

# Value Manager In Context

A central discovery was that value management is best understood by looking at the participants surrounding it.

```text
                 +--------------------+
                 | Initial Model      |
                 +--------------------+
                           |
                           |
                           v

   +-------------+   +--------------------+     +-------------+
   | Input       |<->|                    |<--->| Field Error |
   | Elements    |   |    Value Manager   |     | Display     |
   +-------------+   |                    |     +-------------+
                     |                    |
                     |                    |----->+----------------------+
                     |                    |      | Validation Summary   |
                     +--------------------+      +----------------------+
                           |
                           |
                           v
                 +--------------------+
                 | Final Model        |
                 +--------------------+
```

The center of the diagram represents the Value Manager.

The surrounding systems either:

- Supply values
- Consume values
- Consume validation information

This diagram should heavily influence future documentation.

---

# Generic Validation Workflow

A generic validation workflow was identified as:

```text
Initialize Form

    ↓

User Edits Data

    ↓

Validate  ↔  Text to Native Value through Parser

    ↓

Update Error Displays

    ↓

Attempt Submit

    ↓

Validate Entire Form

    ↓

Build Final Model

    ↓

Send To Server
```

Important discovery:

> Parsing exists in support of validation.

Parsing is not a separate workflow. It is part of the validation process.

Validation may operate on:

- Raw text
- Native values
- Relationships between values

---

# Client / Server Symmetry

An important discovery was that client-side and server-side validation have surprisingly similar responsibilities.

## Client

The client emphasizes:

- User interaction
- Validation feedback
- Error communication

## Server

The server emphasizes:

- Security
- Data accuracy
- Business rule enforcement
- API support
- Third-party integration support

Although their participants differ, both client and server:

- Receive data
- Convert data
- Validate data
- Produce errors
- Produce models

Server-side validation should therefore be introduced early rather than treated as an advanced topic.

---

# Workflow Decisions

One of the goals of the documentation is helping users recognize the decisions they are already making.

Examples include:

- Parsing
- Formatting
- Model transfer

The most significant boundary identified so far is:

```text
Text Value
    ↔
Native Value
```

which is managed through parsing.

Many validation concerns emerge at this boundary.

---

# Jivs Participation

The documentation should repeatedly communicate:

> Jivs can participate in as little or as much of the value management workflow as desired.

Examples:

```text
Existing Parser
    or
Jivs Parser

Existing Formatter
    or
Jivs Formatter

Existing Model Transfer
    or
ModelReader / ModelWriter
```

The goal is not to encourage replacement of existing infrastructure.

The goal is to help users understand available options and make informed decisions.

---

# SSOT Position

SSOT should not become a major user-facing topic.

SSOT is not the story.

Value management is the story.

SSOT is simply a description of the architecture that may naturally emerge when users adopt more of the Jivs workflow.

The documentation should focus on:

- Responsibilities
- Workflows
- Decisions

Users should discover SSOT naturally rather than being encouraged toward it explicitly.

---

# Introducing Jivs Concepts

Users should first understand:

```text
Value Management
```

then:

```text
Validation Workflows
```

then:

```text
Workflow Decisions
```

then:

```text
How Jivs Participates
```

Only then should the documentation introduce:

- ValueHost
- FieldValueHost
- ValueHostsManager

These should be introduced together as the foundation of the Jivs mental model.

Secondary concepts include:

- JivsServices
- ModelReader
- ModelWriter

These concepts should be introduced when they become relevant to a workflow.

---

# Diagram Philosophy

Diagrams are expected to become a primary communication tool.

The preferred progression is:

```text
Value Manager in Context

    ↓

Inside the Value Manager

    ↓

Validation Workflows

    ↓

Client / Server Similarities

    ↓

Workflow Decisions

    ↓

Jivs Participation

    ↓

Jivs Implementation
```

Future documentation should rely heavily on:

- Workflow diagrams
- Visual explanations
- Real-world examples

and less on large blocks of conceptual prose.

---

# Current Status

The foundational analysis phase is complete.

Major discoveries include:

- Value Manager in Context
- Generic Validation Workflow
- Client / Server Symmetry
- Parsing as a major workflow boundary
- Jivs as a participant in value management
- SSOT as a consequence rather than a goal

The next phase is to use these discoveries to:

1. Identify the most important use cases.
2. Design the first user-facing workflow documentation.
3. Determine where existing documents such as Learning.md should be reorganized, supplemented, replaced, or retitled.