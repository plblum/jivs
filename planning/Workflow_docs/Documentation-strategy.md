# Documentation Structure

## Purpose

Capture the emerging structure of the Jivs documentation based on discoveries made during the Validation Workflows effort.

---

# Questions and Responses

## Q32

### Question

Should "Learning Jivs" remain a single document or become multiple documents?

### Response

Multiple documents.

### Notes

The current Learning.md contains valuable information but attempts to carry too much responsibility.

The emerging structure separates:

- Value management concepts
- Validation workflows
- Workflow decisions
- Jivs participation
- Jivs implementation details
- Reference material

This allows users to enter at the level appropriate to their needs.

---

## Q33

### Question

Should there be a dedicated "Validation Workflows" document?

### Response

Yes.

### Notes

Validation Workflows has become the foundation of the documentation strategy.

Its purpose is to explain:

- The responsibilities involved in value management
- The workflows that exist in every validation system
- The participants that interact with value management

The document should remain largely technology agnostic.

---

## Q34

### Question

Should there be a dedicated "Choosing Your Approach" document?

### Response

Probably not.

### Notes

The decisions should naturally appear within workflow discussions.

For example:

```text
Parsing

    Existing Parser

or

    Jivs Parser
```

The same approach applies to:

- Formatting
- Model transfer
- Error communication

Decision points should be presented in context rather than isolated into a separate document.

---

## Q35

### Question

Should workflow discussions appear before API discussions?

### Response

Absolutely.

### Notes

Users should understand:

- The problem
- The workflow
- The responsibilities
- The decisions

before being introduced to:

- ValueHost
- FieldValueHost
- ValueHostsManager
- ModelReader
- ModelWriter

and other implementation details.

---

# Emerging Documentation Flow

The discoveries made so far suggest a progression similar to:

```text
Value Manager in Context

        ↓

Validation Workflows

        ↓

Workflow Decisions

        ↓

Jivs Participation

        ↓

Jivs Concepts

        ↓

API Reference
```

---

# Candidate Documentation Set

```text
README.md
    Product Introduction

Validation-System-In-Context.md
    Ecosystem
    Participants
    Client/Server Similarities

Validation-Workflows.md
    Initialize
    Edit
    Validate
    Attempt Save
    Server Processing

Learning.md
    ValueHost
    FieldValueHost
    ValueHostsManager
    Jivs Participation

ValueHostsManager_Configuration_Guide.md
    Configuration Guidance

Jivs_API.md
    API Reference

TypeDoc
    Complete Technical Reference
```

---

# Working Assumption

The primary challenge is not missing documentation.

The primary challenge is helping users understand where Jivs fits within the broader value management story.

Future documentation should therefore lead with workflows and responsibilities before introducing implementation details.