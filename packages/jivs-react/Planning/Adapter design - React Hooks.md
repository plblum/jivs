# Jivs React Design - React Hooks

## Status

Draft

---

# Purpose

This document defines the internal architecture of the React Hooks exposed by the Jivs React Adapter.

Previous documents define the user-facing behavior of the hooks and the wrapper objects they return. This document focuses on how those hooks interact with React, how they consume Validation State, and how they participate in the React Adapter subscription architecture.

React Hooks are the primary mechanism through which React components consume Validation State produced by the Jivs Engine.

The hooks connect React rendering behavior to Validation State changes while hiding subscription management and React integration details from application components.

This document defines:

* Hook architecture
* Hook responsibilities
* Validation State retrieval
* Subscription architecture from the hook consumer perspective
* React rendering integration

This document does not define:

* Validation rules
* Validation execution
* Validation configuration
* Provider implementation details
* Context implementation details
* Cache implementation details
* Detailed subscription implementation

These concerns are defined elsewhere.

---

# Relationship to Other Documents

The Overview document introduces the major concepts used throughout the React Adapter.

Field Access defines field-oriented validation behavior.

Form Access defines form-oriented validation behavior.

The React Adapter Architecture document defines:

* `JivsProvider`
* `JivsReactContext`
* Wrapper caches
* Subscription routers
* ValidationManager integration
* Infrastructure lifecycle management

This document focuses on how React Hooks consume that infrastructure and expose Validation State to React components.

Conceptually:

```text
React Component
        ↓
React Hook
        ↓
React Adapter Infrastructure
        ↓
JivsField / JivsForm
        ↓
Validation State
```

---

# Design Goals

The React Hook architecture exists to provide:

* Simple React integration
* Automatic rerendering
* Access to Validation State
* Access to React Adapter wrappers
* Consistent behavior across React components
* Strong separation between React and the Jivs Engine

React components should not manage subscriptions directly.

React components should not interact directly with ValidationManager notification callbacks.

React components should consume Validation State and render UI.

Jivs itself handles all validation rules and validation processes. Components simply consume the resulting Validation State as they generate UI.

This separation of concerns is fundamental to the React Adapter architecture.

Hooks are responsible for connecting Validation State changes to React rendering.

---

# Architectural Overview

The React Hook architecture sits between React components and the underlying React Adapter infrastructure.

Conceptually:

```text
React Component
        ↓
React Hook
        ↓
React Adapter Infrastructure
        ↓
ValidationManager
        ↓
Validation State
```

The hooks do not create validation infrastructure.

Instead, they consume infrastructure supplied by the React Adapter.

The hooks then expose React-friendly access to that infrastructure while participating in subscription and rerendering behavior.

---

# Relationship to JivsProvider

## Purpose

React Hooks depend on infrastructure supplied by `JivsProvider`.

`JivsProvider` establishes the React Adapter environment used by hooks.

Without a provider, hooks have no mechanism for locating the validation infrastructure associated with the current React tree.

Conceptually:

```text
JivsProvider
        ↓
React Adapter Infrastructure
        ↓
React Hook
```

---

## Hook Perspective

From the perspective of React Hooks, `JivsProvider` is simply the mechanism through which React Adapter infrastructure becomes available.

Hooks consume infrastructure exposed by the provider.

Hooks do not create:

* Validation infrastructure
* Wrapper caches
* Subscription routers
* ValidationManager integrations

The architecture and implementation of `JivsProvider` are defined by the React Adapter Architecture document.

---

# Hook Overview

The React Adapter exposes two primary hooks:

| Hook                   | Purpose                          |
| ---------------------- | -------------------------------- |
| `useFieldValidation()` | Field-oriented validation access |
| `useFormValidation()`  | Form-oriented validation access  |

These hooks provide access to Validation State while automatically participating in React's rendering lifecycle.

Internally, both hooks rely on React's external store pattern through `useSyncExternalStore`.

This allows Jivs validation notifications to participate correctly in React rendering behavior.

---

# useFieldValidation()

## Purpose

`useFieldValidation()` connects a React component to a single field.

The hook returns:

```ts
[
   JivsField,
   ValueHostValidationState
]
```

The field provides field-oriented operations.

The Validation State provides the current validation status associated with the field.

Detailed field behavior is defined in the Field Access document.

---

## Method Definition

```ts
useFieldValidation(
   fieldName: string,
   initialValue?: any
) : [
   JivsField,
   ValueHostValidationState
]
```

---

## Internal Responsibilities

`useFieldValidation()` is responsible for:

1. Accessing React Adapter infrastructure.
2. Resolving the requested field wrapper.
3. Retrieving current Validation State.
4. Participating in field subscription behavior.
5. Detecting Validation State changes.
6. Triggering rerendering when appropriate.

The component consumes the returned values and renders UI.

---

# useFormValidation()

## Purpose

`useFormValidation()` connects a React component to aggregate Validation State.

The hook returns:

```ts
[
   JivsForm,
   ValidationState
]
```

The form provides form-oriented operations.

The Validation State provides aggregate validation information.

Detailed form behavior is defined in the Form Access document.

---

## Method Definition

```ts
useFormValidation(
   groupName?: string
) : [
   JivsForm,
   ValidationState
]
```

---

## Internal Responsibilities

`useFormValidation()` is responsible for:

1. Accessing React Adapter infrastructure.
2. Resolving the form wrapper.
3. Retrieving current Validation State.
4. Participating in form subscription behavior.
5. Detecting Validation State changes.
6. Triggering rerendering when appropriate.

The component consumes the returned values and renders UI.

---

# Validation State and React

## Validation State Ownership

Validation State is owned by the Jivs Engine.

The React Adapter does not own Validation State.

The hooks do not own Validation State.

The hooks retrieve Validation State and expose it to React components.

Conceptually:

```text
Jivs Engine
        ↓
Validation State
        ↓
React Hook
        ↓
React Component
```

---

## Validation State Retrieval

Hooks do not maintain their own copy of Validation State.

When React requires the current state, the hook retrieves the latest Validation State from the underlying validation infrastructure.

Conceptually:

```text
React
        ↓
Hook
        ↓
Validation Infrastructure
        ↓
Current Validation State
```

This ensures React components always render using the latest available Validation State.

---

# Subscription Architecture

## Purpose

Validation State changes originate within the Jivs Engine.

React components must be notified when those changes occur.

The React Adapter provides a subscription architecture that bridges ValidationManager notifications and React rendering.

Conceptually:

```text
Validation State Changed
        ↓
ValidationManager Notification
        ↓
Subscription Routing
        ↓
React Hook
        ↓
React Requests Current State
        ↓
Component Rerender
```

The hooks participate in this architecture but do not implement the routing infrastructure themselves.

---

# Subscription Ownership

Subscriptions are owned by the React Adapter.

Subscriptions are not owned by:

* React components
* JivsField
* JivsForm

React components consume Validation State.

Hooks participate in subscription behavior.

The underlying subscription infrastructure remains separate from wrapper objects.

This separation allows wrapper classes to remain independent of React.

---

# Field Subscription Model

## Overview

Field subscriptions are field-specific.

Components subscribe to a particular field through `useFieldValidation()`.

Conceptually:

```text
ValidationManager
        ↓
Field Subscription Routing
        ↓
Field Subscribers
```

Only components interested in a particular field receive notifications for that field.

---

## Routing Behavior

Example:

```ts
useFieldValidation("FirstName");
```

subscribes to:

```text
FirstName
```

When validation state changes for:

```text
FirstName
```

components subscribed to:

```ts
useFieldValidation("FirstName")
```

are notified.

Components subscribed to:

```ts
useFieldValidation("LastName")
```

are unaffected.

Conceptually:

```text
FirstName Validation State Changed
                ↓
ValidationManager Notification
                ↓
Field Subscription Routing
                ↓
FirstName Subscribers Notified
                ↓
React Requests Current State
                ↓
Affected Components Rerender
```

This behavior prevents unrelated field components from rerendering.

---

## Hook Participation

From the hook perspective, field subscription behavior consists of:

```text
useFieldValidation()
        ↓
Subscribe To Field Notifications
        ↓
Receive Notification
        ↓
React Requests Current Snapshot
        ↓
Component Rerender
```

The implementation of field subscription routing is defined by the React Adapter Architecture document.

---

# Form Subscription Model

## Overview

Form subscriptions operate on aggregate Validation State.

Components subscribe through:

```ts
useFormValidation();
```

or:

```ts
useFormValidation(groupName);
```

---

## Routing Behavior

Form subscriptions are aggregate.

Conceptually:

```text
ValidationManager
        ↓
Form Subscription Routing
        ↓
Form Subscribers
```

Any component using Form Access may receive notification when aggregate Validation State changes.

Validation Groups affect validation scope.

Validation Groups do not determine subscription routing behavior.

---

## Hook Participation

From the hook perspective, form subscription behavior consists of:

```text
useFormValidation()
        ↓
Subscribe To Form Notifications
        ↓
Receive Notification
        ↓
React Requests Current Snapshot
        ↓
Component Rerender
```

The implementation of form subscription routing is defined by the React Adapter Architecture document.

---

# Relationship to React

## React External Store Integration

The React Adapter integrates Validation State with React using React's external store pattern.

Internally, both hooks rely on:

```ts
useSyncExternalStore()
```

Conceptually:

```text
Subscribe
        ↓
Validation State Changes
        ↓
Notification
        ↓
React Requests Current Snapshot
        ↓
React Determines Whether To Rerender
```

The React Adapter supplies:

* Subscription behavior
* Validation State retrieval

React remains responsible for rendering decisions.

---

## React Lifecycle Management

Components are not responsible for:

* Subscribing
* Unsubscribing
* Tracking validation notifications

The hooks manage lifecycle behavior on behalf of the component.

Conceptually:

```text
Component Mounted
        ↓
Hook Establishes Subscription

Component Unmounted
        ↓
Hook Removes Subscription
```

---

# Wrapper Objects

Hooks return React Adapter wrapper objects.

Field-oriented hooks return:

```ts
JivsField
```

Form-oriented hooks return:

```ts
JivsForm
```

These wrappers provide React-oriented access to validation functionality while remaining independent of React rendering infrastructure.

Wrapper objects do not manage subscriptions.

Wrapper objects do not contain React-specific rendering logic.

Detailed wrapper behavior is defined elsewhere.

---

# Wrapper Identity

Hooks return stable wrapper objects.

For a given field name, `useFieldValidation()` returns the same logical `JivsField` wrapper throughout the component lifecycle.

For a given validation group name or no group name, `useFormValidation()` returns the same logical `JivsForm` wrapper throughout the component lifecycle.

Wrapper identity is associated with the field name or validation group name used to resolve the wrapper. It does not refer to a separate identifier value exposed to application code.

Components may safely use the returned wrapper throughout their lifecycle.

Wrapper identity behavior is defined by the React Adapter Architecture document.

The important behavior for hook consumers is that wrapper identity remains stable and predictable for a given field or validation group.

---

# Responsibilities

React Hooks are responsible for:

* Accessing React Adapter infrastructure
* Accessing wrapper objects
* Accessing Validation State
* Participating in subscription behavior
* Integrating with React rendering
* Triggering rerendering when Validation State changes

---

# Non-Responsibilities

React Hooks are not responsible for:

* Executing validation logic
* Defining validation rules
* Owning Validation State
* Storing values
* Rendering UI
* Managing validation configuration
* Creating validation infrastructure
* Implementing subscription routing
* Managing ValidationManager integrations

These responsibilities belong elsewhere in the architecture.

---

# Architectural Decisions

## RH-001

`useFieldValidation()` is the primary React hook for field-oriented validation.

---

## RH-002

`useFormValidation()` is the primary React hook for form-oriented validation.

---

## RH-003

Validation State remains owned by the Jivs Engine.

Hooks consume Validation State but do not own it.

---

## RH-004

React Hooks consume React Adapter infrastructure supplied through `JivsProvider`.

The structure and responsibilities of that infrastructure are defined by the React Adapter Architecture document.

---

## RH-005

React Hooks own React integration behavior.

Subscription management is not exposed to application components.

---

## RH-006

Field subscriptions are field-specific.

Validation changes affecting one field should not require unrelated field components to rerender.

---

## RH-007

Form subscriptions are aggregate.

Form-oriented components consume aggregate Validation State.

---

## RH-008

`JivsField` contains no React-specific subscription logic.

React-specific subscription behavior is implemented by the React Adapter infrastructure and hooks.

---

## RH-009

`JivsForm` contains no React-specific subscription logic.

React-specific subscription behavior is implemented by the React Adapter infrastructure and hooks.

---

## RH-010

React components consume Validation State.

React components do not interact directly with ValidationManager notification callbacks.

---

## RH-011

Hooks integrate Validation State with React through React's external store model.

The specific subscription routers and context infrastructure used to support this integration are defined by the React Adapter Architecture document.

---

# Design Summary

React Hooks provide the primary integration point between React and the Jivs Engine.

Internally, they act as the bridge between:

* React components
* React Adapter infrastructure
* Validation State
* Subscription notifications
* React rendering

The architecture is built around:

* `useFieldValidation()`
* `useFormValidation()`
* Validation State retrieval
* Subscription-based notifications
* React lifecycle integration
* React rerendering

Hooks consume Validation State produced by the Jivs Engine and expose it through React-oriented APIs while keeping subscription management and React integration hidden from application components.

The implementation details of `JivsProvider`, `JivsReactContext`, subscription routers, caches, and ValidationManager integration are defined by the React Adapter Architecture document.
