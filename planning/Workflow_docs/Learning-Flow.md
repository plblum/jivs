# Learning Flow

## Purpose

Determine when Jivs-specific concepts should be introduced relative to the workflow discussion.

The goal is to introduce concepts when they become useful rather than introducing terminology before the reader understands the problem being solved.

---

# Questions and Responses

## Q17

### Question

Should users encounter the term ValueHost early or late?

### Response

Early, once the discussion transitions from generic validation workflows to Jivs-specific implementation.

### Notes

Users should learn:

- ValueHost
- FieldValueHost
- ValueHostsManager

together.

These concepts form the foundation of the Jivs mental model.

---

## Q18

### Question

Should users encounter the term ValueHostsManager early or late?

### Response

Early, alongside ValueHost and FieldValueHost.

### Notes

The ValueHostsManager is a central concept within Jivs.

Once the discussion moves from generic workflows into Jivs participation, these concepts should be introduced together.

---

## Q19

### Question

Should users encounter ModelReader and ModelWriter:

- During onboarding
- Shortly after onboarding
- Only in advanced topics

### Response

When discussing the workflow that moves data between models and the Value Manager.

### Notes

ModelReader and ModelWriter are not major concepts.

They are participants within a workflow, similar to parsers and formatters.

Their importance comes from their role in moving values between:

```text
Model
    ↔
Value Manager
```

rather than from the APIs themselves.

---

## Q20

### Question

What concepts currently appear too early in Learning.md?

### Response

Undetermined.

### Notes

The larger concern is not individual concepts.

The larger concern is presentation.

The existing content contains valuable information, but the overall experience may be too complex and too light on visual communication.

---

## Q21

### Question

What concepts currently appear too late in Learning.md?

### Response

Undetermined.

### Notes

The structure and presentation of the future documentation remain under evaluation.

The solution may involve:

- Significant restructuring
- New workflow-oriented documents
- Additional diagrams
- Replacing portions of Learning.md
- Retitling Learning.md
- Splitting content across multiple documents

No conclusions have been reached yet.

---

# Emerging Principles

## Principle 1

Users should first understand validation workflows.

Only then should Jivs-specific concepts be introduced.

---

## Principle 2

The transition from workflow discussion to Jivs discussion should introduce:

- ValueHost
- FieldValueHost
- ValueHostsManager

as a single conceptual package.

---

## Principle 3

Supporting concepts such as:

- ModelReader
- ModelWriter
- Parsers
- Formatters

should be introduced when discussing the workflows they participate in rather than as standalone topics.

---

## Principle 4

Future documentation should rely far more heavily on:

- Diagrams
- Workflow visualization
- Examples

and less on large blocks of conceptual explanation.

---

## Working Assumption

The primary challenge is not missing information.

The primary challenge is presenting the information in a way that is easier to consume and easier to connect with the workflows developers already understand.