# SSOT Strategy

## Purpose

Define how SSOT should be discussed within Validation Workflows documentation.

SSOT is not a feature to market.

SSOT is a description of the architecture that may naturally emerge when users adopt more of the Jivs value management workflow.

---

# Questions and Responses

## Q13

### Question

What is the strongest statement we can honestly make about SSOT?

### Response

SSOT provides fewer opportunities to make mistakes.

The implementation work is reduced and less likely to be repeated in multiple places using different approaches.

### Notes

The primary value is:

- Less duplicated work
- Fewer synchronization problems
- Fewer opportunities for inconsistency

---

## Q14

### Question

What is the strongest statement we should avoid making about SSOT?

### Response

SSOT is a useful concept, but it should not become the focus of the documentation.

### Notes

Avoid:

```text
You should use SSOT.
```

Avoid:

```text
SSOT is the correct architecture.
```

The discussion should remain centered on workflows and responsibilities.

---

## Q15

### Question

What benefits of SSOT matter most?

### Response

The specific benefits are less important than the overall reduction in duplicated work and opportunities for mistakes.

### Notes

Users should discover value through workflow comparisons rather than through feature marketing.

---

## Q16

### Question

What are the tradeoffs of SSOT that we should acknowledge?

### Response

The primary tradeoff is replacing or refactoring existing code.

### Notes

Organizations may already have:

- Parsing infrastructure
- Formatting infrastructure
- Model transfer code
- Form management code

Adopting more of the Jivs workflow may require replacing portions of that existing investment.

---

# Emerging Principles

## Principle 1

SSOT is documentation vocabulary, not documentation subject matter.

Users are trying to solve validation and value management problems.

SSOT is simply one way to describe the architecture that may emerge from those solutions.

---

## Principle 2

User-facing documentation should focus on:

- Value management
- Validation workflows
- Responsibilities
- Decisions

Not on architectural terminology.

---

## Principle 3

Jivs should be presented as covering as much or as little of the value management workflow as the user desires.

Examples include:

- Parsing
- Formatting
- Validating
- Communicating errors
- Model transfer

Users may adopt individual parts or adopt the complete workflow.

---

## Principle 4

If users adopt Jivs across the entire value management workflow, the resulting architecture naturally resembles a Single Source of Truth.

That outcome should be presented as an observation rather than a goal.