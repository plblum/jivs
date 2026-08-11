# Target Audience

## Purpose

Identify the audiences for Jivs and understand the environments in which they adopt it.

The goal is not to categorize users by job title alone, but to understand:

- What responsibilities they own.
- What validation infrastructure already exists.
- Which workflow decisions they have already made.
- Which Jivs features they are likely to adopt.

This information influences:

- Documentation structure
- Examples
- Workflow diagrams
- Adoption guidance
- SSOT messaging

---

# Questions and Responses

## Q06

### Question

Who is the primary audience?

- Frontend developer
- Full stack developer
- Backend developer
- Architecture-minded lead developer
- Other

### Response

All of them.

Different roles participate in different parts of the validation workflow.

- Frontend developers own user interaction, field validation display, and Validation Summary presentation.
- Backend developers own server-side validation and often establish business logic rules that the UI follows.
- Full stack developers span both client-side and server-side responsibilities.
- Architects are frequently involved in defining validation strategy, business logic ownership, separation of concerns, and framework selection.

### Notes

Jivs should not be documented as a tool intended for a single development role.

The validation workflow naturally involves multiple roles, each contributing to different responsibilities.

---

## Q07

### Question

How often do you expect users to already have:

- Existing parser code
- Existing formatter code
- Existing model mapping code
- Existing validation code

### Response

This is primarily determined by whether they are working in greenfield or brownfield scenarios.

Jivs should be presented to both audiences without favoritism.

Examples:

- Existing applications often already have parsers, formatters, model mapping, and validation infrastructure.
- New applications may choose to adopt more of the Jivs ecosystem from the beginning.
- Existing applications may still create entirely new forms or features that fully embrace Jivs tooling.

### Notes

Documentation should avoid assumptions such as:

```text
You already have parsers.
Therefore you should continue using them.
```

or

```text
You need parsing.
Therefore you should adopt Jivs parsing.
```

Instead, documentation should present choices.

Example:

```text
Parsing

Current approach:
    Your parser

Alternative:
    Jivs parser

Evaluate which is a better fit.
```

The same philosophy applies to:

- Formatting
- Model transfer
- Validation infrastructure
- State management
- SSOT

---

## Q08

### Question

Are most users adopting Jivs into:

- Existing applications
- New greenfield projects
- Both equally

### Response

Both.

Documentation should support greenfield and brownfield adoption equally.

Examples:

- Existing applications may adopt only Jivs validation.
- Existing applications may gradually adopt additional Jivs features.
- New applications may adopt the complete workflow from the beginning.
- Existing applications may build entirely new forms that fully embrace Jivs.

### Notes

Documentation should avoid implying:

```text
Jivs is primarily for greenfield projects.
```

or

```text
Jivs is primarily for existing projects.
```

Instead, the focus should be:

```text
Adopt the parts you need.

Keep the parts you already trust.
```

---

# Emerging Observation

Users should not primarily be categorized by job title.

Instead, they can be categorized by the validation infrastructure they already possess and the infrastructure they still need.

Examples:

## User Type A

Already has:

- Parsers
- Formatters
- Model transfer

Needs:

- Validation

### Potential Jivs Adoption

- ValueHostsManager
- Validation Rules
- Validation Feedback

---

## User Type B

Already has:

- Validation

Needs:

- Better workflow integration

### Potential Jivs Adoption

- ValueHostsManager
- ModelReader
- ModelWriter

---

## User Type C

Starting a new form or feature

Needs:

- Parsing
- Formatting
- Validation
- Transfer
- State management

### Potential Jivs Adoption

- ValueHostsManager
- Jivs Parsers
- Jivs Formatters
- ModelReader
- ModelWriter

---

## User Type D

Wants a complete integrated workflow

### Potential Jivs Adoption

Required:

- ValueHostsManager

Common additions:

- ModelReader
- ModelWriter
- Jivs Parsers
- Jivs Formatters
- SSOT workflow

---

# Working Assumption

Jivs documentation should not primarily segment users by:

- Frontend
- Backend
- Full stack
- Architecture

Instead it should identify:

1. What responsibilities the user owns.
2. What infrastructure already exists.
3. Which workflow decisions have already been made.
4. Which parts of Jivs may provide value.

The core message remains:

> Jivs can participate in as little or as much of the validation workflow as the application requires.