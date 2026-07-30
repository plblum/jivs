# Jivs React Design - Field Access

## Status

Draft

---

# Purpose

This document defines field-oriented access to validation functionality through the React Adapter.

Field Access is the primary mechanism used by React components that need to display or respond to Validation State associated with a single field.

The React Adapter presents field-oriented concepts because they align closely with how React components are typically organized. Internally, the Jivs Engine operates on ValueHosts.

Field Access bridges these two perspectives.

---

# Relationship to the Overview

The Overview document introduces the Field concept and explains its relationship to Forms, Models, ValueHosts, and Validation State.

This document expands those concepts and defines how field-oriented validation is exposed through the React Adapter.

---

# Field-Oriented Validation

Field-oriented validation focuses on validation concerns associated with a single field.

Typical examples include:

* Displaying validation messages near an input
* Applying CSS classes to indicate validation status
* Showing success indicators
* Showing warning indicators
* Displaying validation icons
* Enabling or disabling field-specific actions

Field-oriented components depend on the Jivs Engine to evaluate validation rules. These components consume and present the resulting Validation State.

Field-oriented validation consumes Validation State produced by the Jivs Engine.

---

# Field Identification

## Overview

Field Access begins with a field name.

The field name is the identifier used by the React Adapter to locate validation information associated with a ValueHost.

Example:

```ts
const [field, validationState] =
   useFieldValidation("FirstName", "");
```

The React Adapter uses the field name to locate the corresponding ValueHost and retrieve its Validation State.

---

## Relationship to ValueHosts

Every field participating in validation is associated with a ValueHost.

The React Adapter uses field-oriented terminology because React developers typically think in terms of fields and components.

A field name used by a React component typically corresponds to the name assigned when the ValueHost is configured.

Example ValueHost configuration:

```ts
builder.input("FirstName")
   .required("First Name is required.");
```

Associated React components:

```tsx
function AnyTextBox(fieldName: string, initialValue: any)
{
   const [field, validationState] =
      useFieldValidation(fieldName, initialValue);

   return (
      <input
         className={
            validationState.isValid
               ? ""
               : "invalid"
         }
      />
   );
}

function ErrorMessages(fieldName: string)
{
   const [field, validationState] =
      useFieldValidation(fieldName);

   if (validationState.isValid)
      return null;

   return (
      <ul>
         {validationState.issuesFound.map(issue =>
            <li key={issue.id}>
               <span dangerouslySetInnerHTML={{ __html: issue.errorMessage }} />
            </li>
         )}
      </ul>
   );
}
```

Internally:

```text
Field Name
        ↓
ValueHost
        ↓
ValueHostValidationState
```

A field therefore represents a React-oriented view of a ValueHost.

---

# useFieldValidation()

## Purpose

useFieldValidation() is the primary React hook for field-oriented validation.

It connects a React component to a field and returns a JivsField instance representing that field and the current Validation State.

---

## Method Definition

```ts
useFieldValidation(
   fieldName: string,
   initialValue: any = undefined
) : [JivsField, ValueHostValidationState]
```

### Parameters

#### fieldName

Identifies the field associated with the component.

The field name is used to locate the corresponding ValueHost and Validation State.

#### initialValue

Provides the initial value for the field when the component is acting as an input component.

Input components should supply an initial value.

Examples include:

```ts
useFieldValidation("FirstName", "");
useFieldValidation("Age", 0);
useFieldValidation("BirthDate", null);
```

Components that only consume Validation State and do not provide user input should omit the initial value.

Example:

```ts
useFieldValidation("FirstName");
```

The exact behavior of initial value registration is defined by the React Adapter Architecture document.

### Returns

The hook returns a tuple containing:

```ts
[JivsField, ValueHostValidationState]
```

#### JivsField

Provides field-oriented access to React Adapter functionality associated with the field.

#### ValueHostValidationState

Provides the current Validation State associated with the field's ValueHost.

When the Validation State changes, the hook causes the component to rerender with the updated state.

---

## Conceptual Behavior

A component supplies a field name and optionally an initial value.

The hook:

1. Locates or creates the field.
2. Retrieves the current Validation State.
3. Returns a JivsField instance.
4. Subscribes to future Validation State changes.
5. Causes rerendering when relevant Validation State changes occur.

Conceptually:

```text
Field Name + Initial Value
              ↓
     useFieldValidation()
              ↓
JivsField + ValueHostValidationState
```

---

## Typical Usage

```ts
const [field, validationState] =
   useFieldValidation("FirstName", "");
```

---

## React Lifecycle Considerations

Components are not responsible for subscribing to validation notifications directly.

The hook manages subscription behavior on behalf of the component.

The component consumes Validation State and renders accordingly.

---

# JivsField (class)

## Purpose

JivsField provides field-oriented access to validation functionality.

JivsField acts as a stable React Adapter abstraction over Jivs Engine concepts.

---

## Conceptual API

JivsField represents a single field participating in validation.

A JivsField instance provides access to operations commonly needed by React components when interacting with field-oriented validation experiences.

Conceptually, JivsField exposes:

| Member            | Description                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `fieldName`       | The field identifier.                                                                                                                  |
| `setTextValue()` | Updates the current input value associated with the field.                                                                             |
| `setValue()`      | Updates the field using a native value. Use this when working with non-string values or values already converted to their native type. |
| `validate()`      | Invokes validation of the field.                                                                                                       |
| `getValueHost()`  | Returns the underlying ValueHost associated with the field.                                                                            |

The exact API surface is defined elsewhere. This document focuses on how React components interact with a JivsField.

### setTextValue()

```ts
setTextValue(
   value: any,
   options?: SetTextValueOptions
): void
```

`setTextValue()` is intended for values received directly from UI components. It is typically wired to DOM `onChange` or `onInput` events.

Conceptually:

```ts
field.setTextValue(textValue);
```

The first parameter contains the value supplied by the component.

If conversion from a string or other input representation to the field's native type is required, one of the following approaches must be used:

* Configure a parser as part of Jivs validation configuration.
* Perform the conversion before calling JivsField and use `setValue()` instead.

By default, calling `setTextValue()` triggers validation.

An optional second parameter may be supplied to control behavior:

```ts
field.setTextValue(textValue, {
   validate: false
});
```

When `validate: false` is specified, validation is not automatically performed.

When using `onInput`, specify `duringEdit: true`.

### setValue()

```ts
setValue(
   value: any,
   options?: SetValueOptions
): void
```

`setValue()` is intended for values that have already been converted to the field's native type.

Conceptually:

```ts
field.setValue(nativeValue);
```

This method is commonly used when a component or application performs its own parsing or conversion before updating the field.

By default, calling `setValue()` triggers validation.

An optional second parameter may be supplied:

```ts
field.setValue(nativeValue, {
   validate: false
});
```

When `validate: false` is specified, validation is not automatically performed.

When using `onInput`, specify `duringEdit: true`.

---

## Component Usage

The most common way to obtain a JivsField is through useFieldValidation().

Example:

```ts
const [field, validationState] =
   useFieldValidation("FirstName", "");
```

The returned field object may then be used by the component when rendering UI.

Example:

```tsx
function FirstNameField(initialValue: string)
{
   const [field, validationState] =
      useFieldValidation("FirstName", initialValue);

   return (
      <>
         <label htmlFor={field.fieldName}>
            First Name
         </label>

         <input
            id={field.fieldName}
            onChange={e =>
               field.setTextValue(
                  e.target.value
               )
            }
            onInput={e =>
               field.setTextValue(
                  e.target.value,
                  { duringEdit: true }
               )
            }
         />

         {!validationState.isValid &&
            <span>
               Invalid value
            </span>
         }
      </>
   );
}
```

---

## Accessing Validation State

Validation State is provided separately by useFieldValidation().

Conceptually:

```ts
const [field, validationState] =
   useFieldValidation("FirstName", "");

validationState.isValid;
```

JivsField provides field-oriented operations and identification, while Validation State is consumed through the hook result.

### ValueHostValidationState Type Members

| Member            | Description                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `isValid`         | When true, there is nothing currently known to block validation.                                                       |
| `doNotSave`       | When true, saving should not be allowed until this value becomes false.                                                |
| `issuesFound`     | An array of IssueFound objects representing validation issues, or `null` when no issues exist.                         |
| `asyncProcessing` | When true, an asynchronous validation process is still running and a definitive validation state is not yet available. |
| `status`          | One of the following values: `NotAttempted`, `NeedsValidation`, `Undetermined`, `Valid`, `Invalid`, or `Disabled`.     |
| `corrected`       | True when the user has resolved all previously invalid validation issues.                                              |

---

## Validation Operations

A component may initiate validation through operations exposed by JivsField.

Conceptual example:

```tsx
function FirstNameField(initialValue: string)
{
   const [field] =
      useFieldValidation("FirstName", initialValue);

   return (
      <button
         onClick={() => field.validate()}
      >
         Validate
      </button>
   );
}
```

JivsField does not perform validation itself.

Validation requests are delegated to the underlying validation infrastructure.

---

## Input Value Operations

A component may update the current input value through JivsField.

Conceptual example:

```tsx
function FirstNameField(initialValue: string)
{
   const [field] =
      useFieldValidation("FirstName", initialValue);

   return (
      <input
         onChange={e =>
            field.setTextValue(
               e.target.value
            )
         }
         onInput={e =>
            field.setTextValue(
               e.target.value,
               { duringEdit: true }
            )
         }
      />
   );
}
```

JivsField delegates value updates to the underlying ValueHost infrastructure.

---

## Responsibilities

JivsField is responsible for:

* Identifying a field
* Locating field validation information
* Providing field-oriented access to validation functionality
* Providing access to the underlying ValueHost
* Providing a stable React abstraction

---

## Non-Responsibilities

JivsField is not responsible for:

* Storing values
* Running validation
* Defining validation rules
* Rendering validation UI
* Managing React component state

These responsibilities belong elsewhere in the architecture.

---

## Relationship to Jivs Engine Concepts

Conceptually:

```text
JivsField
        ↓
ValueHost
        ↓
ValueHostValidationState
```

JivsField adapts Jivs Engine concepts for React consumption.

---

# Field Validation State

## Overview

Field Validation State represents the validation status of a single ValueHost.

Field Validation State is the primary data consumed by field-oriented React components.

### ValueHostValidationState Type Members

| Member            | Description                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `isValid`         | When true, there is nothing currently known to block validation.                                                       |
| `doNotSave`       | When true, saving should not be allowed until this value becomes false.                                                |
| `issuesFound`     | An array of IssueFound objects representing validation issues, or `null` when no issues exist.                         |
| `asyncProcessing` | When true, an asynchronous validation process is still running and a definitive validation state is not yet available. |
| `status`          | One of the following values: `NotAttempted`, `NeedsValidation`, `Undetermined`, `Valid`, `Invalid`, or `Disabled`.     |
| `corrected`       | True when the user has resolved all previously invalid validation issues.                                              |

---

## Relationship to ValueHostValidationState

Field Validation State originates from the Jivs Engine's ValueHostValidationState.

The React Adapter exposes this information through field-oriented APIs.

Conceptually:

```text
ValueHostValidationState
        ↓
React Adapter
        ↓
Field Validation State
```

---

## Consuming Validation State

Typical field-oriented UI behavior includes:

* Showing validation messages
* Applying error styling
* Applying warning styling
* Showing success indicators
* Displaying field status

Components consume Validation State but do not determine Validation State.

---

## React Rendering Behavior

When Field Validation State changes:

```text
Validation State Updated
        ↓
Subscription Notification
        ↓
Hook Update
        ↓
Component Rerender
```

React components rerender using the latest Validation State.

---

# Field Components

## Input Components

The most common field-oriented component is an input component.

Canonical example:

```tsx
function AnyTextBox(fieldName: string, initialValue: any)
{
   const [field, validationState] =
      useFieldValidation(fieldName, initialValue);

   return (
      <input
         className={
            validationState.isValid
               ? ""
               : "invalid"
         }
         onChange={e =>
            field.setTextValue(
               e.target.value
            )
         }
         onInput={e =>
            field.setTextValue(
               e.target.value,
               { duringEdit: true }
            )
         }
      />
   );
}
```

The component consumes Validation State.

The component does not evaluate validation rules.

---

## Validation Message Components

A dedicated component may render field-specific validation messages.

Canonical example:

```tsx
function ErrorMessages(fieldName: string)
{
   const [field, validationState] =
      useFieldValidation(fieldName);

   if (validationState.isValid)
      return null;

   return (
      <ul>
         {validationState.issuesFound.map(issue =>
            <li key={issue.id}>
               <span dangerouslySetInnerHTML={{ __html: issue.errorMessage }} />
            </li>
         )}
      </ul>
   );
}
```

---

## Custom Components

Any component may participate in Field Access.

Examples:

* Text inputs
* Select components
* Date pickers
* Status indicators
* Validation icons
* Accessibility helpers

The component only needs a field identifier and access to Validation State.

---

# Validation Workflow

## Validation Triggered Elsewhere

Validation may be triggered from:

* User interaction

  * `onChange` event
  * `onInput` event (each keystroke fires; typically invokes validators designed for immediate feedback such as `required`)
  * Another event that declares the input has resulted in a change
* Form submission

  * Validation of all fields
  * Validation limited to a specific group
* Custom workflows

Field components are not required to initiate validation.

---

## Validation State Updated

The Jivs Engine evaluates validation and updates Validation State.

---

## Field Notification

The React Adapter detects the relevant Validation State change.

---

## Component Rerender

Components using useFieldValidation() rerender using the updated Validation State.

Conceptually:

```text
Validation Trigger
        ↓
Jivs Engine Validation
        ↓
Field Validation State Updated
        ↓
Subscription Notification
        ↓
useFieldValidation()
        ↓
Component Rerender
```

---

# Error Handling

## Unknown Field Names

Behavior for unknown field names is defined by the React Adapter Architecture document.

Components should not assume every requested field exists.

---

## Disabled Fields

Disabled behavior is defined by the React Adapter Architecture document.

Field Access remains responsible for exposing the resulting Validation State.

---

## Missing Configuration

Missing configuration behavior is defined elsewhere.

Field components should not contain special handling for configuration concerns.

---

# Relationship to Form Access

Field Access and Form Access are complementary approaches.

Use Field Access when:

* Rendering field-specific validation
* Updating field appearance
* Displaying field messages
* Rendering field status indicators

Use Form Access when:

* Rendering ValidationSummary
* Determining save eligibility
* Determining submit eligibility
* Displaying aggregate validation status

Many applications use both approaches simultaneously.

---

# Design Summary

Field Access provides React-oriented access to Validation State associated with a single field.

The architecture is built around:

* Field names
* ValueHosts
* Field Validation State
* JivsField
* useFieldValidation()

Field Access consumes Validation State produced by the Jivs Engine and exposes it through React-oriented abstractions without exposing validation implementation details.
