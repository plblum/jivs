# Jivs React Adapter Design - React Adapter Architecture (Part 3)

## Status

Draft

---

# Purpose

This document defines the core architecture of the Jivs React Adapter, Part 3 of 3.

Part 1 defined:

* JivsProvider
* JivsReactContext
* ValidationManager integration

Part 2 defined:

* JivsFieldCache
* JivsFormCache
* ReactFieldSubscriptions
* ReactFormSubscriptions

This document defines:

* Hook integration with infrastructure
* React external store integration
* Infrastructure lifecycle
* Provider lifetime considerations
* End-to-end notification flow

This document intentionally avoids redefining:

* Hook APIs
* Hook behavior
* Field access behavior
* Form access behavior
* Validation State contracts

Those topics are defined by the authoritative companion documents.

---

# Relationship To Other Documents

The React Adapter documentation is organized into separate architectural layers.

The Overview document introduces the React Adapter.

Field Access defines field-oriented APIs and behavior.

Form Access defines form-oriented APIs and behavior.

React Hooks defines hook APIs and consumer behavior.

Parts 1 and 2 of this Architecture document define the infrastructure that supports those capabilities.

This document defines how that infrastructure participates in React rendering.

Conceptually:

```text
React Components
        ↓
React Hooks
        ↓
React Adapter Infrastructure
        ↓
Jivs Engine
```

The focus of this document is the integration between React Hooks and React Adapter infrastructure.

---

# Hook Integration

## Purpose

React Hooks are the primary consumers of React Adapter infrastructure.

Hooks obtain infrastructure through JivsReactContext.

Hooks do not create infrastructure.

Hooks do not own infrastructure.

Conceptually:

```text
React Hook
        ↓
JivsReactContext
        ↓
Infrastructure Service
```

Examples of infrastructure services include:

```text
JivsFieldCache

JivsFormCache

ReactFieldSubscriptions

ReactFormSubscriptions
```

Detailed hook behavior is defined in:

```text
Adapter Design - React Hooks
```

This document focuses only on the architectural relationship between hooks and infrastructure.

---

## Infrastructure Access Pattern

All hook infrastructure access follows the same conceptual pattern.

```text
React Component
        ↓
React Hook
        ↓
JivsReactContext
        ↓
Infrastructure Service
```

Examples:

### Field-Oriented Access

```text
useFieldValidation()
        ↓
JivsReactContext
        ↓
JivsFieldCache
```

```text
useFieldValidation()
        ↓
JivsReactContext
        ↓
ReactFieldSubscriptions
```

### Form-Oriented Access

```text
useFormValidation()
        ↓
JivsReactContext
        ↓
JivsFormCache
```

```text
useFormValidation()
        ↓
JivsReactContext
        ↓
ReactFormSubscriptions
```

This architecture ensures that all infrastructure access is centralized through JivsReactContext.

---

# React Integration Model

## Purpose

Validation State changes originate outside React.

React requires a mechanism for integrating external state changes into its rendering model.

The React Adapter adopts React's external store architecture.

Conceptually:

```text
Validation State Change
        ↓
Subscription Infrastructure
        ↓
React External Store Pattern
        ↓
React Rendering
```

---

## External Store Pattern

The React Adapter uses React's external store integration model.

Conceptually:

```text
Subscribe
        ↓
Notification
        ↓
Snapshot Retrieval
        ↓
React Rendering Decision
```

The React Adapter provides:

* Notification subscriptions
* Validation State snapshots

React determines whether rerendering is required.

The React Adapter does not make rendering decisions.

---

## Infrastructure Responsibilities

Within the external store architecture:

### Subscription Infrastructure

Provides:

```text
Notification Routing
```

through:

```text
ReactFieldSubscriptions

ReactFormSubscriptions
```

### Wrapper Infrastructure

Provides:

```text
Validation State Access
```

through:

```text
JivsField

JivsForm
```

### React

Provides:

```text
Rendering
```

The responsibilities remain intentionally separated.

---

# Infrastructure Lifecycle

## Purpose

Infrastructure lifetime is owned by JivsProvider.

Infrastructure exists only within the lifetime of the JivsProvider that created it.

Conceptually:

```text
JivsProvider
        ↓
JivsReactContext
        ↓
Infrastructure Services
```

---

## Infrastructure Creation

Conceptually:

```text
JivsProvider Created
        ↓
JivsReactContext Created
        ↓
ValidationManager Created
        ↓
Caches Created
        ↓
Subscription Services Created
        ↓
ValidationManager Notifications Wired
```

The exact construction sequence remains implementation-defined.

The ownership relationship is architectural.

---

## Infrastructure Disposal

Conceptually:

```text
JivsProvider Removed
        ↓
JivsReactContext Disposed
        ↓
ValidationManager Notifications Unwired
        ↓
Infrastructure Released
```

Disposal mechanics remain implementation-defined.

---

## Subscription Lifetime

Subscriptions participate in React component lifetime.

Conceptually:

```text
Component Mounted
        ↓
Subscription Created
```

and:

```text
Component Unmounted
        ↓
Subscription Removed
```

Subscription cleanup is managed through React integration.

---

# Provider Lifetime Considerations

## Purpose

Wrapper identity guarantees exist within the scope of a single JivsReactContext.

Identity guarantees do not extend beyond the lifetime of the provider that created the infrastructure.

---

## Traditional Page Lifecycle

Conceptually:

```text
Page Loaded
        ↓
JivsProvider Created
        ↓
Infrastructure Created
        ↓
Page Unloaded
        ↓
Infrastructure Released
```

All wrapper identity guarantees exist only within that page lifetime.

---

## Single Page Application Lifecycle

Conceptually:

```text
Route Activated
        ↓
JivsProvider Created
        ↓
Infrastructure Created
        ↓
Route Removed
        ↓
Infrastructure Released
```

Identity guarantees remain valid only while the provider remains active.

---

## Long-Lived Application Shell

Conceptually:

```text
Application Started
        ↓
JivsProvider Created
        ↓
Infrastructure Created
        ↓
Application Shutdown
        ↓
Infrastructure Released
```

In this scenario wrapper identity may persist for the lifetime of the application.

---

## Identity Scope

Wrapper identity guarantees are scoped to:

```text
One JivsReactContext
```

not:

```text
Entire Application
```

This distinction is architecturally significant.

---

# End-To-End Field Notification Flow

Field validation changes follow the architecture established in Parts 1 and 2.

Conceptually:

```text
ValidationManager
        ↓
onValueHostValidationStateChanged
        ↓
ReactFieldSubscriptions
        ↓
Subscriber Callback
        ↓
React Requests Snapshot
        ↓
React Rerender
        ↓
useFieldValidation()
        ↓
Updated Validation State
```

ReactFieldSubscriptions is responsible for notification routing.

Hooks are responsible for consuming updated state.

---

# End-To-End Form Notification Flow

Form validation changes follow the architecture established in Parts 1 and 2.

Conceptually:

```text
ValidationManager
        ↓
onValidationStateChanged
        ↓
ReactFormSubscriptions
        ↓
Validation Group Subscribers
        ↓
React Requests Snapshot
        ↓
React Rerender
        ↓
useFormValidation()
        ↓
Updated Validation State
```

ReactFormSubscriptions is responsible for validation-group routing.

Hooks are responsible for consuming updated state.

---

# Architectural Decisions

## RA-019

React Hooks consume infrastructure.

React Hooks do not create infrastructure.

---

## RA-020

All React Adapter infrastructure is accessed through JivsReactContext.

---

## RA-021

The React Adapter integrates with React through the external store architecture.

---

## RA-022

Subscription infrastructure owns notification routing.

---

## RA-023

Wrapper infrastructure owns Validation State access.

---

## RA-024

Infrastructure lifetime is owned by JivsProvider.

---

## RA-025

Wrapper identity guarantees are scoped to a single JivsReactContext.

---

## RA-026

Field rerendering originates from field notification routing.

---

## RA-027

Form rerendering originates from validation-group notification routing.

---

## RA-028

Validation State remains owned by the Jivs Engine throughout the rendering workflow.

---

# Design Summary

The React Adapter connects Validation State changes to React rendering through a layered infrastructure architecture.

JivsProvider owns infrastructure lifetime.

JivsReactContext serves as the infrastructure composition root.

Cache services provide stable wrapper identity.

Subscription services provide notification routing.

Hooks consume infrastructure through JivsReactContext.

React integrates with the adapter through the external store architecture.

Validation State remains owned by the Jivs Engine.

The React Adapter is responsible for connecting Validation State changes to React rendering while maintaining clear separation between validation behavior, infrastructure services, and UI concerns.
