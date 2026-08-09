# Jivs React Design - Form Access

## Status

Draft

---

# Purpose

This document defines form-oriented access to validation functionality through the React Adapter.

Form Access provides access to aggregate Validation State spanning multiple fields and allows React components to participate in workflows involving validation summaries, save operations, submit operations, and other validation decisions.

While Field Access focuses on a single field, Form Access focuses on the validation status of an entire form or a subset of fields participating in a Validation Group.

---

# Relationship to the Overview

The Overview document introduces the Form concept and explains its relationship to Fields, Models, Validation State, and Validation Groups.

This document expands those concepts and defines how form-oriented validation is exposed through the React Adapter.

---

# Form-Oriented Validation

Form-oriented validation focuses on validation concerns involving multiple fields.

Typical examples include:

* Validation summaries
* Save decisions
* Submit decisions
* Wizard navigation
* Workflow progression
* Aggregate validation indicators
* Display of all validation issues

Form-oriented components depend on the Jivs Engine to evaluate validation rules.

These components consume and present aggregate Validation State.

---

# Form Identification

## Overview

A form represents a collection of ValueHosts.

A form may represent:

* All ValueHosts managed by a ValueHostsManager
* A subset of ValueHosts associated with a Validation Group

Examples:

```ts
const [form, validationState] =
   useFormValidation();

const [form, validationState] =
   useFormValidation("Shipping");
```

---

## Relationship to ValueHostsManager

All forms originate from a ValueHostsManager.

When no Validation Group is specified, the form represents all ValueHosts managed by the ValueHostsManager.

Conceptually:

```text
ValueHostsManager
        ↓
All ValueHosts
        ↓
ValidationState
        ↓
JivsForm
```

A JivsForm represents a React-oriented view of aggregate validation information derived from one or more ValueHosts.

---

## Validation Groups

Validation Groups allow a form to represent only a subset of participating ValueHosts.

Typical examples include:

* Wizard pages
* Tab pages
* Expandable sections
* Partial save operations

A Validation Group identifies the ValueHosts that participate in the form.

Conceptually:

```text
ValueHostsManager
        ↓
ValueHosts
        ↓
Filter by Group Name
        ↓
Form
```

A form therefore represents either:

```text
All ValueHosts
```

or

```text
ValueHosts matching a Validation Group
```

depending on application requirements.

### Assigning ValueHosts to Validation Groups

ValueHosts participate in a Validation Group through UI configuration that augments existing business logic configuration.

When using the Builder API, a ValueHost can be assigned a group name during configuration.

Conceptually:

```ts
builder.input("FirstName", { group: "Shipping" });
builder.input("LastName", { group: "Shipping" });
builder.input("CreditCardNumber", { group: "Billing" });
```

The exact Builder API syntax is defined by the Jivs Engine configuration documentation.

The important concept for Form Access is that Validation Groups belong to the UI domain. Business logic does not need to know how a particular form is constructed.

---

# useFormValidation()

## Purpose

useFormValidation() is the primary React hook for form-oriented validation.

It connects a React component to aggregate Validation State.

---

## Method Definition

```ts
useFormValidation(
   groupName?: string
) : [JivsForm, ValidationState]
```

---

## Parameters

### groupName

Optional Validation Group name.

When omitted, the hook operates on all ValueHosts managed by the ValueHostsManager.

When supplied, the hook operates on the subset of ValueHosts associated with the specified Validation Group.

Examples:

```ts
useFormValidation();

useFormValidation("Shipping");

useFormValidation("Step1");
```

---

## Returns

The hook returns:

```ts
[JivsForm, ValidationState]
```

### JivsForm

Provides form-oriented access to React Adapter functionality.

### ValidationState

Provides aggregate Validation State associated with the ValueHosts represented by the form.

When Validation State changes, the component rerenders using the updated state.

---

## Conceptual Behavior

A component supplies an optional Validation Group.

The hook:

1. Identifies the participating ValueHosts.
2. Retrieves the current ValidationState.
3. Returns a JivsForm instance.
4. Subscribes to future ValidationState changes.
5. Causes rerendering when relevant ValidationState changes occur.

Conceptually:

```text
All ValueHosts (All or for a validation group)
        ↓
useFormValidation()
        ↓
JivsForm + ValidationState
```

---

# JivsForm (class)

## Purpose

JivsForm provides form-oriented access to validation functionality.

JivsForm acts as a stable React Adapter abstraction over aggregate validation concepts exposed by the Jivs Engine.

It does not have any stateful information found on ValidationState, especially because
when you retrieve JivsForm, you also get back ValidationState from useFormValidation().

---

## Conceptual API

Conceptually, JivsForm exposes:

| Member                 | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `groupName`            | Validation Group represented by the form.          |
| `validate()`           | Executes validation. Async process.                |
| getValueHostsManager() | Provides access to the ValueHostsManager directly. |
|                        |                                                    |


This document focuses on form-oriented usage patterns.

```ts
interface JivsForm {
    readonly groupName: string | null;
    validate(): Promise<ValidationState>;
    getValueHostsManager(): ValueHostsManager;
}
```

---

## Responsibilities

JivsForm is responsible for:

* Representing a collection of ValueHosts
* Providing form-oriented validation operations
* Providing aggregate validation access
* Providing a stable React abstraction

---

## Non-Responsibilities

JivsForm is not responsible for:

* Storing values
* Defining validation rules
* Running validation logic
* Rendering validation UI
* Managing React component state

These responsibilities belong elsewhere in the architecture.

---

# Form Validation State

## Overview

Form Validation State represents aggregate validation information derived from all ValueHosts participating in the form.

It is the primary data consumed by form-oriented React components.

Unlike Field Access, Form Access does not expose a ValueHostValidationState. Instead, it exposes a ValidationState object designed specifically for aggregate validation scenarios.

### ValidationState Members

| Member            | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `isValid`         | Indicates whether the form currently contains any validation issues.                |
| `doNotSave`       | Indicates whether the current validation state prevents save operations.            |
| `issuesFound`     | Collection of validation issues associated with the form or null if there are none. |
| `asyncProcessing` | Indicates whether asynchronous validation processing is currently in progress.      |

---

## Component's Relationship to ValidationState

Form Validation State originates from the Jivs Engine ValidationState.

The React Adapter does not create a separate validation model. Instead, it exposes ValidationState through form-oriented APIs that are easier for React components to consume.

There are two things a Component will need from ValidationState:

* Trigger it to redraw after change
* Content used during redraw

---

## Aggregate Information

ValidationState may expose information that is meaningful only at the form level.

Examples include:

* Aggregate validity
* Aggregate issue collections
* Validation summary information
* Group-level validation status
* Workflow eligibility decisions

These concepts do not naturally belong to a single ValueHost and therefore are represented by ValidationState rather than ValueHostValidationState.

---

## Typical Uses

Typical consumers include:

* ValidationSummary
* Submit buttons
* Save buttons
* Wizard navigation
* Form status indicators

---

## React Rendering Behavior

```
initial useFormValidation()
        ↓ 
        Establish Subscription 

When aggregate Validation State changes:
```

```text
Form Validation triggered
        ↓
Validation State Updated
        ↓
Subscription Notification
        ↓
useFormValidation() gets the latest ValidationState
        ↓
Component Rerender
```

React components rerender using the latest Validation State.

---

# Form Components

## ValidationSummary Components

ValidationSummary is the most common form-oriented component.

Canonical example:

```tsx
function ValidationSummary(group?: string|null)
{
   const [form, validationState] =
      useFormValidation(group);

   return (
      <ul>
         {validationState.issuesFound.map(issue =>
            <li key={issue.id}>
               <span
                  dangerouslySetInnerHTML={{
                     __html: issue.errorMessage
                  }}
               />
            </li>
         )}
      </ul>
   );
}
```

---

## Submit Buttons

Submit buttons frequently consume aggregate Validation State.

Canonical example:

```tsx
function SubmitButton(group?: string|null)
{
   const [form, validationState] =
      useFormValidation(group);

   return (
      <button
         disabled={validationState.doNotSave}
      >
         Save
      </button>
   );
}
```

---

## Wizard Navigation

Wizard workflows often validate a specific group.

Canonical example:

```tsx
function NextButton()
{
   const [form, validationState] =
      useFormValidation("Step1");

   return (
      <button
         disabled={validationState.doNotSave}
      >
         Next
      </button>
   );
}
```

---

# Validation Operations

## Explicit Validation

A component may explicitly request validation.

Example:

```tsx
function ValidateButton()
{
   const [form, validationState] =
      useFormValidation();

   return (
      <button
         onClick={() => form.validate()}
      >
         Validate
      </button>
   );
}
```

JivsForm delegates validation requests to the underlying validation infrastructure.

---

## Group Validation

Validation may be limited to a specific group.

Conceptually:

```tsx
const [shippingForm, validationState] =
   useFormValidation("Shipping");

shippingForm.validate();
```

---

# Validation Workflow

## Validation Triggered

Validation may be initiated from:

* Save operations
* Submit operations
* Wizard navigation
* Custom workflows

---

## Validation State Updated

The Jivs Engine evaluates validation and updates Validation State.

---

## Form Notification

The React Adapter detects the relevant Validation State change.

---

## Component Rerender

Components using useFormValidation() rerender using updated Validation State.

Conceptually:

```text
Validation Trigger
        ↓
Jivs Engine Validation
        ↓
ValidationState Updated
        ↓
Subscription Notification
        ↓
useFormValidation()
        ↓
Component Rerender
```

---

# Error Handling

## Unknown Groups

Behavior for unknown validation groups is defined by the React Adapter Architecture document.

---

## Missing Configuration

Missing configuration behavior is defined elsewhere.

---

## Empty Forms

Forms containing no participating ValueHosts are valid scenarios and may occur intentionally.

Behavior is defined elsewhere.

---

# Relationship to Field Access

Field Access and Form Access are complementary approaches.

Use Field Access when:

* Displaying field validation
* Updating field appearance
* Displaying field messages

Use Form Access when:

* Rendering ValidationSummary
* Determining save eligibility
* Determining submit eligibility
* Working with aggregate validation status
* Working with validation groups

Many applications use both approaches simultaneously.

---

# Design Summary

Form Access provides React-oriented access to aggregate Validation State across a collection of ValueHosts.

A form represents either:

* All ValueHosts managed by a ValueHostsManager
* A subset of ValueHosts associated with a Validation Group

Unlike Field Access, which exposes ValueHostValidationState for individual ValueHosts, Form Access exposes a ValidationState object designed for aggregate validation scenarios.

The architecture is built around:

* ValueHostsManager
* ValueHosts
* Validation Groups
* ValidationState
* JivsForm
* useFormValidation()

Form Access consumes Validation State produced by the Jivs Engine and exposes it through React-oriented abstractions without exposing validation implementation details.
