# Overall Vision

## Purpose

Capture the decisions, goals, assumptions, and insights that guide creation of future Jivs Validation Workflow documentation.

---

## Current Understanding

We are moving away from thinking about this as a traditional "Learning Jivs" effort.

The goal is to document **validation workflows** and the decisions developers make when building forms and models.

Jivs participates in those workflows, but does not require ownership of every step.

The documentation should:

- Help users understand the responsibilities present in any validation workflow.
- Show where Jivs can participate.
- Show where users may keep their existing implementations.
- Gradually reveal the advantages of Jivs' integrated approach.
- Naturally guide users toward the Single Source of Truth (SSOT) workflow without making it feel mandatory.

---

# Questions and Responses

## Q01

### Question

What is the single most important realization you want a new user to have after reading the Learning content?

### Response

Let's not even think of this as learning content.

This effort is about **Validation Workflows**.

### Notes

This shifts the focus from:

```text
Learning Jivs
```

to:

```text
Understanding Validation Workflows
```

The primary goal becomes workflow understanding rather than API understanding.

---

## Q02

### Question

What is the biggest misconception a new user currently has about Jivs?

### Response

Unknown.

My intuition is that users do not realize how much boilerplate work exists around forms that must be supported by any validation system.

Jivs eliminates much of that work by providing a well-tested and flexible engine.

### Notes

Potential future documentation theme:

## Validation Is Never Just Validation

Developers often think they only need:

```text
Input
  ->
Validation
  ->
Error Message
```

But every form also needs:

- Data storage
- Parsing
- Formatting
- State tracking
- Data transfer
- Validation timing
- Client/server coordination

Jivs provides solutions for these problems, but does not require users to adopt all of them.

---

## Q03

### Question

What concepts must a user retain after completing onboarding?

### Response

### Primary Concepts

- ValueHost
- FieldValueHost
- ValueHostsManager

### Secondary Concepts

- JivsServices
- ModelReader
- ModelWriter

Also important:

- Understanding the decisions around parsers, formatters, model transfer, and related responsibilities.

### Notes

Potential concept hierarchy:

#### Core Concepts

- ValueHost
- FieldValueHost
- ValueHostsManager

#### Supporting Concepts

- JivsServices
- ModelReader
- ModelWriter

#### Advanced Concepts

- Conditions
- Validators
- Lookup Keys
- Factories
- Customizations

The workflow documentation should focus heavily on the Core Concepts and Supporting Concepts.

---

## Q04

### Question

What role should SSOT play?

### Response

SSOT is the primary intended workflow.

However, it should be introduced with a very light touch so users do not see Jivs as an opinionated framework that requires adoption of its entire ecosystem.

### Notes

Documentation should avoid:

```text
You should use SSOT.
```

Prefer:

```text
You can:

- Keep your existing transfer code
- Keep your existing parsers
- Keep your existing formatters

Or gradually adopt Jivs features.

Many users eventually find that ValueHostsManager naturally becomes the working representation of the form while editing.
```

Desired outcome:

```text
User discovers SSOT

instead of

User is pushed into SSOT
```

---

## Q05

### Question

Should onboarding be:

- Jivs-first
- Workflow-first
- Validation-first

### Response

Undecided.

Part of this effort is determining the most effective approach.

### Notes

Current candidates:

### Option A - Workflow First

```text
Load data
Edit data
Validate
Submit
Save
```

Then:

```text
Where can Jivs participate?
```

### Option B - Responsibility First

```text
Parsing
Formatting
Transfer
Validation
Server Validation
```

Then:

```text
What choices do you have at each responsibility?
```

### Option C - Decision First

```text
Who owns parsing?
Who owns formatting?
Who owns transfer?
Who owns edit state?
```

Then:

```text
Manual approach
Jivs approach
Hybrid approach
```

No conclusion has been reached yet.

---

## Q41

### Question

What are the responsibilities and workflows that exist in every validation workflow, even when Jivs is not involved?

### Response

#### Workflow 1 - Initialize the Form

The application must establish the value that will be placed into each input element.

This may involve:

```text
Native Value
    ->
Formatter
    ->
Text Value
    ->
Input Element
```

or some equivalent mechanism.

The user sees text while the application frequently stores a different native value.

---

#### Workflow 2 - Handle Editing

The application must establish a hook that is notified when the input element changes.

When a change occurs:

```text
Input Element
    ->
Retrieve Text Value
```

Validation may occur in multiple stages.

##### Raw Text Validation

These validations often work directly against the text entered by the user:

- Required
- String Length
- Regular Expression

Example:

```text
Text Value
    ->
Text Validators
```

##### Parsing

The text must usually be converted into a native value:

```text
Text Value
    ->
Parser
    ->
Native Value
```

##### Native Value Validation

Additional validation may occur against the native value:

```text
Native Value
    ->
Validation Rules
```

Examples:

- Date comparisons
- Numeric ranges
- Cross-field validation
- Business rules

##### Report Results

Validation outcomes must be distributed to the user interface.

Common destinations include:

```text
Field Validation Display

Validation Summary

Other UI Validation Indicators
```

Result:

```text
Success

or

List of Validation Errors
```

##### Optional Reformatting

After parsing:

```text
Text Value
    ->
Parser
    ->
Native Value
    ->
Formatter
    ->
Text Value
```

The reformatted text may be written back to the input element.

Examples:

```text
1/2/25
    ->
01/02/2025

abc123
    ->
ABC123
```

---

#### Workflow 3 - Submit the Form

The application must establish a way to intercept or manage form submission.

Typical flow:

```text
Form Submission
    ->
Validate All Fields
    ->
Validate Model
```

Validation results are distributed back into:

```text
Field Validation Displays

Validation Summary
```

The application then determines:

```text
Can Save?
```

If validation fails:

```text
Display Errors
    ->
Remain On Form
```

If validation succeeds:

```text
Package Data
    ->
Send To Server
```

---

#### Workflow 4 - Server Processing

The server receives the submitted data and performs its own validation responsibilities.

Typical flow:

```text
Receive Data
    ->
Server Validation
    ->
Business Rule Validation
    ->
Attempt Save
```

Result:

```text
Success

or

Errors
```

---

#### Workflow 5 - Return Server Errors

If server-side processing fails:

```text
Server Errors
    ->
Client
```

The client must distribute those errors to the appropriate UI locations:

```text
Field Validation Displays

Validation Summary

Other Error Displays
```

The user can then continue editing and resubmit.

