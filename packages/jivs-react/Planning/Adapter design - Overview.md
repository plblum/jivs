# Jivs React Adapter Design - Overview

## Status

Draft

---

# Purpose

This document provides a high-level overview of the Jivs React Adapter architecture.

It introduces the major concepts used throughout the React integration without attempting to fully define them. Detailed specifications are provided in the companion design documents.

This document serves as the architectural map for the React Adapter. Readers are expected to use this document alongside the more focused design documents covering Field Access, Form Access, React Hooks, Validation Presentation, Model Rules Services, and React Adapter Architecture.

---

# Audience

The React Adapter is intended for:

* React developers integrating Jivs validation into user interfaces.
* Full-stack developers sharing validation rules between client and server.
* Component library authors.
* Advanced developers requiring direct access to Jivs Engine concepts.

Advanced programmers are first-class citizens.

The React Adapter provides convenience APIs without restricting access to underlying Jivs Engine capabilities.

---

# Relationship Between Jivs Engine and the React Adapter

The React Adapter is built on top of the Jivs Engine.

The Jivs Engine contains the validation architecture, validation rules, validation state management, and business validation infrastructure.

These capabilities exist independently of React and may be used in:

* Browser applications
* Node.js applications
* Server-side processing
* Background services
* Future UI adapters

The React Adapter consumes and exposes Jivs Engine functionality through React-oriented APIs.

The React Adapter is an adapter layer rather than a replacement abstraction.

```text
Business Rules
        ↓
Jivs Engine
        ↓
React Adapter
        ↓
React Components
```

---

# Separation of Responsibilities

Jivs separates validation logic from presentation logic.

Business validation rules are defined by the business domain and implemented through the Jivs Engine. React components consume and present the resulting validation state rather than redefining business rules.

User interfaces may introduce additional rules to support user interaction or prevent invalid operations before they reach business validation. These UI-specific rules complement business validation but do not replace it.

Validation logic belongs within the Jivs Engine.

Presentation logic belongs within React.

Jivs performs validation and produces validation state. React components consume that validation state and render the results.

This separation keeps validation behavior centralized and reusable while allowing components to focus on rendering and user interaction.

A React developer may still interact with Jivs Engine concepts.

Examples include:

* Configuring ValueHosts during validation configuration
* Integrating model-specific validation during validation configuration
* Triggering validation workflows
* Rendering validation state

However, validation behavior remains defined through Jivs Engine abstractions rather than React components.

The architecture separates validation logic from presentation logic rather than separating developers into rigid roles.

---

# Design Principles

This section currently serves as a holding area for architectural principles that must eventually be documented in a more specific location. As companion design documents are completed, each principle should either be moved to its permanent home or replaced with a reference to the document that owns it.

## DP-001

React owns field values.

Jivs owns validation state.

Current home: Overview

This principle is already covered in the current document under:

* Separation of Responsibilities
* Design Principles
* Validation State

Potential future home:

* Field Access
* React Hooks

## DP-002

Validation presentation is independent from input presentation.

This principle is already partially covered in the current document under:

* Separation of Responsibilities

Potential future home:

* Validation Presentation

## DP-003

Advanced programmers are first-class citizens.

Current home: Overview

This principle is already covered in the current document under:

* Audience

Potential future home:

* React Adapter Architecture

## DP-004

The React Adapter is an adapter, not a sandbox.

Current home: Overview

This principle is already covered in the current document under:

* Relationship Between Jivs Engine and the React Adapter
* Architectural Overview

Potential future home:

* React Adapter Architecture

## DP-005

Jivs-specific controls are optional.

Not yet covered in detail elsewhere in the current document.

Potential future home:

* Validation Presentation
* Code Examples

## DP-006

The Jivs Engine remains framework independent.

Current home: Jivs Engine architecture documentation

Referenced here because it strongly influences React Adapter design.

This principle is already covered in the current document under:

* Relationship Between Jivs Engine and the React Adapter

## DP-007

Business rules are reusable across client-side and server-side execution.

Current home: Jivs Engine architecture documentation

This principle is already covered in the current document under:

* Relationship Between Jivs Engine and the React Adapter

Potential future home:

* Model Rules Services and Model Identity

## DP-008

Multiple validation sources are unified through a common validation state model.

Examples include:

* Validation rules
* Business validation
* Server-side validation

This principle is already partially covered in the current document under:

* Design Principles
* Validation State

Potential future home:

* Validation Presentation
* Form Access
* Model Rules Services and Model Identity

Goal: As the React design documentation matures, this section should shrink until each principle is fully documented in its owning document and only cross-references remain.

---

# Architectural Overview

The React Adapter exists to connect React components to validation functionality provided by the Jivs Engine.

The React Adapter does not implement validation logic.

The React Adapter provides:

* React-oriented APIs
* React subscriptions
* Wrapper abstractions
* Validation state consumption

Conceptually:

```text
React Components
        ↓
React Hooks
        ↓
React Adapter
        ↓
Jivs Engine
```

Most React developers interact primarily with:

* JivsField
* JivsForm
* useFieldValidation()
* useFormValidation()

The underlying adapter architecture remains available but is not required for ordinary usage.

---

# Core Concepts

## Field

A Field represents field-oriented validation concerns.

Every field that participates in validation is associated with a Jivs ValueHost.

The connection between a field and its ValueHost is established through a field name string. This field name serves as the identifier used by the React Adapter to locate validation state, validation messages, and other field-specific validation information.

Typical examples include:

* Validation messages near an input
* Field validity indicators
* Field-specific styling

Although React developers typically work with fields, the underlying Jivs Engine operates on ValueHosts. A field-oriented API ultimately resolves validation information through the ValueHost associated with the field name.

Field-oriented access is exposed through:

* JivsField
* useFieldValidation()

Detailed discussion is provided in:

```text
Jivs React Design - Field Access
```

---

## Form

A Form represents form-oriented validation concerns.

Typical examples include:

* Validation summaries
* Save decisions
* Submit decisions
* Aggregate validation status

Form-oriented access is exposed through:

* JivsForm
* useFormValidation()

Forms are typically backed by a ValidationManager (from Jivs), which coordinates validation activity and exposes aggregate validation state for participating ValueHosts.

### Validation Groups

Validation Groups allow validation to be organized into logical subsets of fields.

Groups are useful when validation should be performed against only part of a form, such as:

* Wizard steps
* Expandable sections
* Partial save workflows

A form may contain one or more validation groups depending on the validation workflow requirements.

Detailed discussion is provided in:

```text
Jivs React Design - Form Access
```

---

## Model

A Model represents model-oriented validation concerns.

Typical examples include:

* Model identity
* Model-specific configuration
* Model Rules Service resolution
* Business validation

Model concepts originate within the Jivs Engine and are consumed by the React Adapter.

Neither the Jivs Engine nor the React Adapter transfers values between UI components and model properties. React components remain responsible for managing their own values, and application code remains responsible for updating model properties when values are saved or synchronized.

Although models are commonly used with forms, a model is not required. Validation may be performed against values originating from many sources, including values that do not belong to a traditional business object.

Models are encouraged because they provide a consistent way to represent data and associate validation behavior. Even forms that do not naturally correspond to a business object, such as a "Save to File" dialog, may benefit from introducing a model for consistency.

Although forms and models are often related, they are not equivalent concepts.

A single model may participate in multiple forms.

A form may contain values that are not model properties.

A form may also operate without a model.

Detailed discussion is provided in:

```text
Jivs React Design - Model Rules Services and Model Identity
```

---

## Validation State

Validation State is the primary mechanism through which validation information is exposed to React components.

The React Adapter does not expose validation rules.

The React Adapter exposes validation state produced by the Jivs Engine.

Validation State exists at multiple scopes.

### Field Validation State

Field Validation State describes the validation status of a single ValueHost.

Field Validation State is typically consumed through:

* JivsField
* useFieldValidation()

Typical uses include:

* Validation messages
* Field styling
* Field status indicators

### Form Validation State

Form Validation State describes aggregate validation status.

Form Validation State is typically consumed through:

* JivsForm
* useFormValidation()

Typical uses include:

* ValidationSummary
* Submit buttons
* Save workflows
* Form status indicators

Validation State is a first-class concept throughout the React Adapter architecture.

---

## ValueHosts and Fields

The Jivs Engine operates on ValueHosts.

A ValueHost represents a value participating in the Jivs Engine.

Some ValueHosts represent values that are validated directly, such as TextValueHosts and PropertyValueHosts.

Other ValueHosts exist to supply values consumed by validation rules, such as CalcValueHosts and StaticValueHosts.

Many ValueHosts correspond directly to user-editable fields.

However, a ValueHost is a broader concept than a field and may represent values that do not correspond directly to visible form controls.

When using Jivs ValueHosts as the Single Source of Truth (SSOT), all model properties are expected to have a corresponding ValueHost. User interface fields interact with those ValueHosts rather than storing independent copies of the values.

When not using SSOT, validation configuration may define only the ValueHosts required for validation. In this mode, ValueHosts act primarily as validation participants rather than as the application's primary value storage mechanism.

The React Adapter frequently uses the term:

```text
Field
```

when presenting field-oriented validation concepts to React developers.

The Jivs Engine uses the more general term:

```text
ValueHost
```

because ValueHosts represent a wider range of value sources and consumers than visible fields alone.

---

# Major React Adapter Concepts

## JivsField (class)

*PENDING: We may rename to ValField, FieldValidation or FieldVal as using Jivs in the name does not call out meaning.*

JivsField provides field-oriented access to validation functionality.

JivsField acts as a React Adapter wrapper over Jivs Engine concepts.

Detailed discussion is provided in:

```text
Jivs React Design - Field Access
```

---

## JivsForm (class)

*PENDING: We may rename to ValForm, FormValidation or FormVal as using Jivs in the name does not call out meaning.*

JivsForm provides form-oriented access to validation functionality.

JivsForm acts as a React Adapter wrapper over Jivs Engine concepts.

Detailed discussion is provided in:

```text
Jivs React Design - Form Access
```

---

## useFieldValidation() (function/React hook)

Primary React hook for field-oriented validation. It handles a single field name. Components around a single field use it, including inputs and display of field validation state (error messages, css class changes).

Provides access to:

* JivsField
* Field Validation State

Detailed discussion is provided in:

```text
Jivs React Design - React Hooks
```

---

## useFormValidation() (function/React hook)

Primary React hook for form-oriented validation. It handles all fields configured in the ValidationManager, or a subset if supplied a group name.

Provides access to:

* JivsForm
* Form Validation State

Detailed discussion is provided in:

```text
Jivs React Design - React Hooks
```

---

## JivsProvider - (Context Component)

*PENDING: May rename to ValidationProvider because "Jivs" isn't as meaningful.*

JivsProvider establishes access to React Adapter functionality by supplying a React Context that exposes the ValidationManager and the mechanisms required to subscribe to validation state changes.

Most applications use a single provider for a validation workflow.

Detailed discussion is provided in:

```text
Jivs React Design - React Adapter Architecture
```

---

# Validation Workflow Overview

Validation may be triggered from many sources.

Examples include:

* Button clicks
* Form submission
* Enter key handling
* Wizard navigation
* Tabs when active tab is changed
* Toolbar actions
* Custom workflows

The important abstraction is:

```text
Trigger
        ↓
Validation
```

rather than any specific UI element.

Conceptually:

```text
User Action
        ↓
Validation Trigger
        ↓
Jivs Engine Validation
        ↓
Validation State Updated
        ↓
React Hooks observe Validation State changes
        ↓
Subscription notification
        ↓
Component retrieves Validation State
        ↓
React Rendering
```

React components render based on Validation State exposed through the React Adapter.

The React Adapter consumes validation results and exposes Validation State to React components.

The Jivs Engine owns validation behavior.

---

# Document Guide

This document provides the architectural overview.

Detailed specifications are provided in the companion documents.

* Jivs React Design - Field Access
* Jivs React Design - Form Access
* Jivs React Design - React Hooks
* Jivs React Design - Validation Presentation
* Jivs React Design - React Adapter Architecture
* Jivs React Design - Model Rules Services and Model Identity
* Jivs React Design - Testing
* Jivs React Design - Code Examples

---

# Design Summary

The Jivs React Adapter provides React-oriented access to validation functionality implemented by the Jivs Engine.

The architecture is built around:

* Field-oriented access
* Form-oriented access
* Model-oriented validation
* Validation State consumption
* Shared business rules
* Strong separation between validation logic and presentation logic

The React Adapter remains an adapter over Jivs Engine functionality rather than a replacement abstraction.
