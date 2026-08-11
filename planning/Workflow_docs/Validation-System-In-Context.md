# Value Manager in Context

## Purpose

Capture the emerging understanding that validation is only one part of a larger workflow.

Most applications already contain models, inputs, error displays, submission logic, and server-side processing. A Value Manager exists within that larger environment and must communicate with those surrounding parts.

The purpose of this document is to define that environment before introducing Jivs-specific concepts.

---

# The Value Manager in Context

A Value Manager does not exist in isolation.

It interacts with several external consumers and producers of information.

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
                     |                    |        +----------------------+
                     |                    |------> | Validation Summary   |
                     +--------------------+        +----------------------+
                           |                       
                           |
                           v

                 +--------------------+
                 | Final Model        |
                 +--------------------+
```

The center of the diagram represents the Value Manager.

Everything surrounding it represents systems that either:

- Supply data to validation.
- Consume information produced by validation.

---

# The External Participants

## Initial Model

The initial model provides values used to initialize the form.

Typical workflow:

```text
Model Property
    ->
Formatting (optional)
    ->
Input Element
```

Examples:

- Existing customer record
- Product record
- User profile
- Server response data

---

## Input Elements

Input elements are the primary source of user edits.

Examples:

- HTML input
- Select element
- Checkbox
- Date picker
- Framework-specific controls

Input elements provide text or editor-specific values that ultimately participate in validation.

---

## Field Error Display

A field-level error display presents validation issues associated with a single input.

Examples:

```text
First Name
[____________]

Requires a value.
```

A Value Manager must provide enough information for these displays to be updated as validation occurs.

---

## Validation Summary

The Validation Summary presents the combined validation issues for the entire form.

Unlike field-level error displays, the Validation Summary is updated whenever validation results change anywhere within the form.

Typical example:

```text
Please correct the following:

• First Name requires a value.
• Birth Date is invalid.
• End Date must be after Start Date.
```

---

## Final Model

When submission succeeds, validation-related values must eventually become part of a model that is ready for saving or transmission.

Typical workflow:

```text
Validated Values
    ->
Model
    ->
Save
```

The final model may or may not be the same object that originally populated the form.

---

# Inside the Value Manager

The Value Manager itself is responsible for managing operations such as:

```text
Parsing

Formatting

Validating

Communicating errors
```

The implementation differs from platform to platform and framework to framework.

The surrounding application should primarily care about the inputs and outputs of the Value Manager rather than its internal mechanics.

---

# A Generic Validation Workflow

The following workflow applies to almost every validation solution.

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

At this level, parsing is considered part of the validation process rather than a separate workflow step.

Validation may evaluate:

- Raw text values
- Native values resulting from parsing
- Relationships between multiple values

The exact implementation varies, but these responsibilities are common to most validation workflows.

---

# Client and Server Similarities

One important observation is that client-side and server-side validation have surprisingly similar responsibilities.

The client side emphasizes interaction and communication of validation outcomes. The server side emphasizes validation and production of either a model or errors.

## Client Side

```text
                 +--------------------+
                 |       Model        |
                 +--------------------+
                           |
                           |
                           v
                 +--------------------+
                 |   Input Elements   |
                 +--------------------+
                           ^
                           |
                   User makes changes
                           |
                           |
                 +--------------------+
                 |    Value Manager   |
                 |  validates field   |
                 +--------------------+
                  |                |
                  |                |
                  v                v
      +----------------+   +----------------------+
      | Field Error    |   | Validation Summary   |
      | Displays       |   +----------------------+
      +----------------+

                           |
                           |
                    Attempt Save
                           |
                           v

                 +--------------------+
                 |    Value Manager   |
                 |  Validates form    |
                 +--------------------+
                           |
                           |
                           v
                 +--------------------+
                 |   Safe To Save?    |
                 +--------------------+
                           |
                           |
                           v
                 +--------------------+
                 |    Final Model     |
                 +--------------------+
```

## Server Side

```text
                 +--------------------+
                 | Request Data       |
                 +--------------------+
                           |
                           |
                           v
                 +--------------------+
                 |    Value Manager   |
                 |  Validates Data    |
                 +--------------------+
                           |
                           |
                           v
                 +--------------------+
                 |   Safe To Save?    |
                 +--------------------+
                     |          |
                     |          |
                     |          v
                     |   +--------------------+
                     |   | List of Errors     |
                     |   +--------------------+
                     |              |
                     v              |
          +--------------------+    |
          |    Final Model     |    |
          +--------------------+    |
                    |               |
                    |               |
                    v               v
                 +--------------------+
                 |     Response       |
                 +--------------------+

```

The server has no input elements and no visual error displays.

However, the server still:

- Receives data.
- Converts data.
- Validates data.
- Produces a collection of validation issues.

Those issues are eventually returned to the client, where they become part of the client-side validation experience.

---
