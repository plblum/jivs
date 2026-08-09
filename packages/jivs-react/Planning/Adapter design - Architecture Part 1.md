# Jivs React Adapter Design - React Adapter Architecture (Part 1)

## Status

Draft

---

# Purpose

This document defines the core architecture of the Jivs React Adapter, Part 1 of 3.

The React Adapter Architecture document focuses on the infrastructure that connects React components to validation functionality provided by the Jivs Engine.

Companion documents define:

* Field-oriented validation access
* Form-oriented validation access
* React Hook behavior
* Validation State consumption

This document defines the infrastructure that supports those capabilities.

The architecture is intentionally infrastructure-oriented rather than consumer-oriented.

It defines:

* Infrastructure ownership
* Runtime composition
* ValueHostsManager integration
* Context architecture
* Provider responsibilities
* Architectural service boundaries

It does not define:

* Validation rules
* Validation execution
* Validation configuration
* Cache implementation details
* Subscription storage implementation details
* React component behavior

---

# Relationship to Other Documents

The Overview document introduces the major concepts used throughout the React Adapter.

Field Access defines:

* JivsField
* useFieldValidation()
* Field Validation State

Form Access defines:

* JivsForm
* useFormValidation()
* Form Validation State

React Hooks defines:

* Hook responsibilities
* Hook integration with React
* Subscription participation
* React rendering integration

This document defines the infrastructure consumed by those features.

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

The React Adapter Infrastructure layer is the responsibility of this document.

---

# Design Principles

## RA-001

The React Adapter is an adapter, not a replacement abstraction.

The React Adapter exposes Jivs Engine functionality through React-oriented APIs.

The Jivs Engine remains the owner of validation behavior, validation state, validation execution, and validation configuration.

The React Adapter exists to connect React to those capabilities.

---

## RA-002

JivsReactContext is the composition root of the React Adapter.

All React Adapter infrastructure is accessed through a JivsReactContext instance.

React Hooks consume infrastructure through JivsReactContext rather than constructing infrastructure themselves.

---

## RA-003

Validation State remains owned by the Jivs Engine.

The React Adapter does not own Validation State.

The React Adapter exposes Validation State and participates in notification routing.

---

## RA-004

Infrastructure ownership is explicit.

Major infrastructure types are first-class architectural concepts.

The architecture defines:

* JivsProvider
* JivsReactContext
* JivsFieldCache
* JivsFormCache
* ReactFieldSubscriptions
* ReactFormSubscriptions

The ownership relationships between these types are part of the architectural contract.

---

## RA-005

Wrapper identity is an architectural guarantee.

For a given field name:

```text
One field name
        ↓
One logical JivsField
```

For a given validation group:

```text
One validation group
        ↓
One logical JivsForm
```

The mechanisms used to achieve identity stability are implementation details.

Identity stability itself is an architectural requirement.

---

# Types Introduced

The React Adapter introduces several infrastructure types that are documented throughout this architecture series.

| Type                    | Purpose                                                                                                                         | Documented In |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| JivsProvider            | React provider that creates and owns React Adapter infrastructure. Owns the JivsReactContext. Is specific to one form or model. | Part 1        |
| JivsReactContext        | Central infrastructure container exposed through React Context. Hooks use it to perform their operations.                       | Part 1        |
| JivsFieldCache          | Provides stable JivsField wrapper identity for field names.                                                                     | Part 2        |
| JivsFormCache           | Provides stable JivsForm wrapper identity for validation groups.                                                                | Part 2        |
| ReactFieldSubscriptions | Routes field-specific validation notifications to React consumers.                                                              | Part 2        |
| ReactFormSubscriptions  | Routes aggregate validation notifications to React consumers.                                                                   | Part 2        |

Together, these types form the infrastructure layer between React Hooks and the Jivs Engine.

Conceptually:

```text
React Hooks
        ↓
JivsReactContext
        │
        ├── JivsFieldCache
        ├── JivsFormCache
        ├── ReactFieldSubscriptions
        ├── ReactFormSubscriptions
        └── ValueHostsManager
```

Part 1 introduces the provider, context, and ValueHostsManager integration.

Part 2 introduces cache and subscription infrastructure.

Part 3 explains how React Hooks consume that infrastructure and participate in the end-to-end rendering workflow.

---

# Architectural Overview

The React Adapter exists to connect React rendering behavior to Validation State produced by the Jivs Engine.

Conceptually:

```text
React Components
        ↓
useFieldValidation()
useFormValidation()
        ↓
JivsReactContext
        ↓
ValueHostsManager
        ↓
Validation State
```

The adapter does not perform validation.

The adapter does not own Validation State.

The adapter supplies infrastructure that allows React Hooks to:

* Access wrapper objects
* Access Validation State
* Participate in notification routing
* Trigger React rerendering when Validation State changes

---

# Runtime Ownership Model

The React Adapter is organized around a single infrastructure root.

Conceptually:

```text
JivsProvider
        owns
            ↓
JivsReactContext

JivsReactContext
        owns
            ↓
ValueHostsManager Integration
            &
JivsFieldCache
            &
JivsFormCache
            &
ReactFieldSubscriptions
            &
ReactFormSubscriptions
```

The architecture intentionally avoids introducing an additional runtime container between JivsProvider and JivsReactContext.

JivsReactContext is the primary infrastructure object used throughout the React Adapter.

---

# JivsProvider

## Purpose

JivsProvider establishes a React Adapter environment for a React component tree.

The provider makes React Adapter infrastructure available to React Hooks.

Without a provider, hooks have no mechanism for locating the infrastructure associated with the current validation workflow.

From the React user's perspective, this is a component that supplies a React Context (in the form of JivsReactContext). It must be present in the UI and contain the entire form.

It sets up and owns a ValueHostsManager instance, which is responsible for only one form, typically associated with a model.

Conceptually:

```text
JivsProvider
        ↓
JivsReactContext
        ↓
React Hooks

```

---

## Public API

Conceptually:

```ts
function JivsProvider(
{
    valueHostsManager,
    children
})
```

The final component signature may evolve.

The architectural responsibility remains the same.

The provider receives a ValueHostsManager and exposes React Adapter infrastructure to descendant components.

## Pending

PENDING: We will be replacing valueHostsManager parameter. JivsProvider must be supplied a string name or constructor of a class that identifies the model. JivsProvider passes this along to JivsReactContext which uses ModelRulesServiceFactory to build the configuration and then create a ValueHostsManager from it. The React UI developer will never directly see the ValueHostsManager. It still needs access to the JivsServices object which should be created as a singleton when the app starts up or its first needed.

PENDING: There will be an additional parameter to let the user forward anything they want to the ModelRulesService object that is used for configuration. For example, they may pass an object with a property of "variant" and the ModelRulesService may configure differently when that property is "XYZ".

PENDING: Another required parameter takes the global JivsServices instance (a Jivs Engine object)

PENDING: We will be renaming this class. The name "Jivs" is less meaningful than "Validation". It may be ValidationProvider or similar.

---

## Usage Example

```tsx
<JivsProvider
    valueHostsManager={vhm}
>
    <CustomerEditor />
</JivsProvider>
```

Field-oriented components:

```tsx
<JivsProvider
    valueHostsManager={vhm}
>
    <FirstNameField />
    <LastNameField />
</JivsProvider>
```

Form-oriented components:

```tsx
<JivsProvider
    valueHostsManager={vhm}
>
    <ValidationSummary />
    <SaveButton />
</JivsProvider>
```

---

## Responsibilities

JivsProvider is responsible for:

* Creating JivsReactContext
* Exposing JivsReactContext to descendant components
* Managing infrastructure lifetime
* Connecting React to React Adapter infrastructure

---

## Non-Responsibilities

JivsProvider is not responsible for:

* Running validation
* Defining validation rules
* Owning Validation State
* Implementing React Hooks
* Rendering validation UI

These responsibilities belong elsewhere.

---

# JivsReactContext

## Purpose

JivsReactContext is the composition root of the React Adapter.

It is the central infrastructure object used by React Hooks.

JivsReactContext owns the infrastructure required to connect React rendering behavior to Validation State notifications originating from the Jivs Engine.

The React Adapter hooks—useFieldValidation() and useFormValidation()—use it for much of their work.

Conceptually:

```text
JivsProvider
        ↓
JivsReactContext
        ↓
React Adapter Infrastructure
```

All React Adapter infrastructure is accessed through JivsReactContext.

## Pending

PENDING: This class requires a model identifier (string or type) to work, getting it from JivsProvider. It also needs access to the Jivs Engine's JivsServices object, so it can get to the ModelRulesServicesFactory to create the IModelRulesServices object associated with the model identifier. From there, it creates a configuration and then creates the ValueHostsManager itself from that configuration. It defines the Builder object that will collect the configuration, and passes it to IModelRulesServices.configure(builder)

PENDING: So expect the constructor to have these parameters:

* modelIdentifier: string|constructor
* services: JivsServices
* payload: any -- optional. Allows the caller to pass along information to the IModelRulesService.configure() method.

---

## Architectural Position

Conceptually:

```text
JivsProvider
        ↓
JivsReactContext
        │
        ├── ValueHostsManager
        ├── JivsFieldCache
        ├── JivsFormCache
        ├── ReactFieldSubscriptions
        └── ReactFormSubscriptions
```

---

## Public API

Conceptually:

```ts
class JivsReactContext
{
    readonly valueHostsManager:
        ValueHostsManager;

    readonly fieldCache:
        JivsFieldCache;

    readonly formCache:
        JivsFormCache;

    readonly fieldSubscriptions:
        ReactFieldSubscriptions;

    readonly formSubscriptions:
        ReactFormSubscriptions;

    dispose(): void;
}
```

The API represents an architectural contract.

It does not prescribe implementation details.

---

## Usage Example

Field-oriented infrastructure access:

```ts
const context =
    useContext(
        JivsReactContext
    );

const field =
    context
        .fieldCache
        .getField(
            "FirstName", initialValue
        );
```

Form-oriented infrastructure access:

```ts
const context =
    useContext(
        JivsReactContext
    );

const form =
    context
        .formCache
        .getForm(
            "Shipping" // optional validation group name shown here
        );
```

Subscription access:

```ts
context
    .fieldSubscriptions
    .subscribe(
        "FirstName",
        callback
    );
```

---

## Responsibilities

JivsReactContext is responsible for:

* Owning ValueHostsManager integration
* PENDING: Creating ValueHostsManager for a given model identifier
* Owning wrapper caches
* Owning subscription infrastructure
* Wiring ValueHostsManager notifications
* Supplying infrastructure to React Hooks
* Managing infrastructure lifetime

---

## Non-Responsibilities

JivsReactContext is not responsible for:

* Executing validation
* Owning Validation State
* Rendering React components
* Implementing React Hooks
* Defining validation rules

These responsibilities belong elsewhere.

---

# ValueHostsManager Integration

## Purpose

ValueHostsManager is the source of Validation State and validation notifications.

The React Adapter integrates with ValueHostsManager through JivsReactContext.

ValueHostsManager remains part of the Jivs Engine.

The React Adapter consumes its notifications.

---

## Integration Ownership

ValueHostsManager integration is owned by JivsReactContext.

Neither React Hooks nor wrapper objects interact directly with ValueHostsManager notification callbacks.

Conceptually:

```text
ValueHostsManager
        ↓
JivsReactContext
        ↓
Subscription Infrastructure
        ↓
React Hooks
```

---

## Notification Categories

The React Adapter consumes two categories of notifications.

### Field Notifications

Field notifications originate from:

```text
ValueHostsManager
    .onValueHostValidationStateChanged
```

These notifications represent validation changes associated with a specific ValueHost.

### Form Notifications

Form notifications originate from:

```text
ValueHostsManager
    .onValidationStateChanged
```

These notifications represent aggregate Validation State changes.

---

## Field Notification Flow

Conceptually:

```text
ValueHostsManager
        ↓
onValueHostValidationStateChanged
        ↓
ReactFieldSubscriptions
        ↓
Subscriber Callback
        ↓
useSyncExternalStore
        ↓
React Requests Snapshot
        ↓
React rerender
        ↓
useFieldValidation() to get ValidationState
```

Field notification routing is defined in Part 2.

---

## Form Notification Flow

Conceptually:

```text
ValueHostsManager
        ↓
onValidationStateChanged
        ↓
ReactFormSubscriptions
        ↓
Subscriber Callback 
        ↓ 
useSyncExternalStore 
        ↓ 
React Requests Snapshot 
        ↓ 
React rerender 
        ↓ 
useFormValidation() to get ValidationState

```

Form notification routing is defined in Part 2.

---

# Architectural Decisions

## RA-006

JivsProvider owns a single JivsReactContext instance.

---

## RA-007

JivsReactContext is the composition root of the React Adapter.

---

## RA-008

ValueHostsManager integration is owned by JivsReactContext.

---

## RA-009

ValueHostsManager notifications are routed through dedicated subscription infrastructure.

---

## RA-010

React Hooks consume infrastructure.

React Hooks do not construct infrastructure.

---

# Design Summary

The React Adapter is organized around a single infrastructure root.

JivsProvider creates and exposes JivsReactContext.

JivsReactContext owns:

* ValueHostsManager integration
* Wrapper caches
* Subscription infrastructure

ValueHostsManager remains the owner of Validation State.

The React Adapter consumes ValueHostsManager notifications and exposes infrastructure that allows React Hooks to participate in React rendering behavior.

Part 2 defines the cache and subscription infrastructure owned by JivsReactContext.
