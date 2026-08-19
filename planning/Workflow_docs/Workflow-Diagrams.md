# Workflow Diagrams

## Purpose

Define how diagrams will be used within Validation Workflows documentation.

Diagrams are expected to become a primary communication tool used to explain value management concepts, workflows, responsibilities, and decisions.

---

# Questions and Responses

## Q22

### Question

What workflow should be the very first diagram users see?

### Response

A Value Manager shown in context with its surrounding participants.

The Value Manager should initially be presented as a black box surrounded by the systems that interact with it.

Immediately afterward, a second diagram should drill into the Value Manager itself.

### Notes

The purpose is to reveal responsibilities that developers may not have previously considered part of value management.

The first diagram should remain technology agnostic and avoid Jivs terminology.

The focus is understanding the ecosystem before discussing implementation.

---

## Q23

### Question

Should diagrams be organized as:

- Without Jivs → With Jivs
- Manual approach → Jivs approach
- Multiple approaches side by side

### Response

Undetermined.

The original options may no longer be the correct framing.

### Notes

Current discoveries suggest a progressive approach where diagrams build upon one another.

Possible sequence:

```text
Value Manager in Context

        ↓

Inside the Value Manager

        ↓

Validation Workflow

        ↓

Client and Server Similarities

        ↓

Workflow Decisions

        ↓

Jivs Participation

        ↓

Jivs Implementation
```

The initial diagrams should explain the problem space before comparing implementation choices.

---

## Q24

### Question

Do you want diagrams to emphasize:

- Validation
- Data flow
- Responsibilities
- Architecture
- Decisions

### Response

Responsibilities and interactions.

### Notes

The purpose of the diagrams is to help users understand what participates in value management and how those participants interact.

Examples include:

- Models
- Input Elements
- Parsing
- Formatting
- Validation
- Communication of errors
- Server processing

The emphasis should be on understanding the ecosystem before discussing implementation details.

---

## Q25

### Question

Should diagrams remain framework agnostic?

### Response

Yes.

### Notes

The diagrams should communicate concepts that exist regardless of implementation technology.

They should not assume:

- DOM-based applications
- Angular
- React
- MVC
- Blazor
- Any specific framework

Framework-specific discussions can be introduced later when discussing Jivs integrations and ecosystem modules.

---

## Q26

### Question

Should server-side workflows be shown from the beginning or introduced later?

### Response

From the beginning.

### Notes

Server-side value management is part of the overall value management story.

The server contributes responsibilities such as:

- Security
- Data accuracy
- Business rule enforcement
- API support
- Third-party integration support

Although the participants are different, many of the responsibilities are similar to those found on the client.

Server-side workflows should therefore be included in the earliest ecosystem and workflow diagrams rather than treated as advanced topics.

---

# Emerging Principles

## Principle 1

Diagrams are expected to become a primary communication tool rather than supplemental content.

---

## Principle 2

The first diagrams should focus on exposing the ecosystem surrounding value management rather than explaining Jivs.

---

## Principle 3

Diagrams should progressively move from:

```text
Concepts

    →

Workflows

    →

Decisions

    →

Jivs Participation

    →

Jivs Implementation
```

---

## Principle 4

Users should understand the responsibilities involved in value management before being introduced to implementation choices.