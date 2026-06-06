# Jivs React Adapter Design - React Adapter Architecture (Part 2)

## Status

Draft

---

# Purpose

This document defines the core architecture of the Jivs React Adapter, Part 2 of 3.

This document defines the cache and subscription infrastructure owned by JivsReactContext.

This document defines:

* JivsFieldCache
* JivsFormCache
* ReactFieldSubscriptions
* ReactFormSubscriptions

These infrastructure services support:

* Stable wrapper identity
* Validation notification routing
* React Hook integration

This document does not define:

* Hook implementation details
* React rendering behavior
* Validation execution
* Validation rules

Those concerns are defined elsewhere.

---

# Relationship to Part 1

Part 1 established:

```text
JivsProvider
        ↓
JivsReactContext

```

This document defines the infrastructure services owned by JivsReactContext.

Conceptually:

```text
JivsReactContext
        │
        ├── JivsFieldCache
        ├── JivsFormCache
        ├── ReactFieldSubscriptions
        └── ReactFormSubscriptions
```

---

# Cache Architecture

## Purpose

The React Adapter provides stable wrapper identity for the JivsField and JivsForm classes.

Stable identity allows React Hooks and React components to interact with predictable wrapper instances. For example, if two or more components call useFieldValidation("FirstName"), the first will create the JivsField instance for "FirstName" and all calls for "FirstName" will return that instance.

The cache architecture exists to provide identity stability.

The cache architecture does not exist to trigger React rerendering.

Conceptually:

```text
Field Name
        ↓
JivsFieldCache
        ↓
JivsField

Validation Group
        ↓
JivsFormCache
        ↓
JivsForm
```

---

# JivsFieldCache

## Purpose

JivsFieldCache owns JivsField identity.

For a given field name, the cache returns the same logical JivsField instance.

Conceptually:

```text
FirstName
        ↓
JivsFieldCache
        ↓
JivsField
```

Repeated requests for:

```text
FirstName
```

return the same logical wrapper.

JivsReactContext creates and owns one instance of JivsFieldCache. 

PENDING: Need to describe the impact on single page apps vs page reloading situations somewhere in this documentation. Perhaps we need a lifecycle section handling each use case.

---

## Public API

Conceptually:

```ts
class JivsFieldCache
{
    constructor(
        validationManager:
            ValidationManager
    );

    getField(
        fieldName: string,
        initialValue?: any
    ): JivsField;
}
```

The final implementation may evolve.

The identity contract remains architectural.

### ValidationManager Dependency

JivsFieldCache requires access to ValidationManager.

Conceptually:

```text
JivsFieldCache
        ↓
ValidationManager
        ↓
ValueHosts
```

This dependency allows the cache to resolve the underlying ValueHost associated with a field name when creating a JivsField wrapper.

### Field Resolution Behavior

When getField() is called:

1. The cache first checks whether a JivsField already exists for the supplied field name.
2. If a cached wrapper exists, that wrapper is returned.
3. If no cached wrapper exists, the cache queries ValidationManager for a ValueHost whose name exactly matches the supplied field name.
4. If a matching ValueHost is found, a new JivsField is created and associated with that ValueHost.
5. The supplied initialValue is applied only during wrapper creation. (Nothing happens when initialValue = undefined) *ISSUE: what if this is after a callback to the server to process the page, where the previous HTML had a different value? I expect that <input value="current value"> must be used as the value for initialValue. Need to solve this one.*
6. The newly created wrapper is stored in the cache and returned.

Conceptually:

```text
Field Name
        ↓
Cache Lookup
        ↓
Cache Miss
        ↓
ValidationManager
        ↓
Matching ValueHost
        ↓
Create JivsField
        ↓
Store In Cache
        ↓
Return Wrapper
```

Field name matching is case-sensitive.

### Relationship to JivsField

JivsField is expected to maintain an association with its underlying ValueHost.

Conceptually:

```text
JivsField
        ↓
ValueHost
```

This aligns with the existing wrapper model and supports APIs that expose or consume the underlying ValueHost.

### Open Design Question

The behavior when a field name does not resolve to a ValueHost remains undecided.

Potential approaches include:

* Returning a wrapper backed by a newly created ValueHost
* Throwing an error
* Returning a special placeholder wrapper

This decision remains pending and will be defined in a future revision.

---

## Usage Example

Field retrieval:

```ts
const field =
    context
        .fieldCache
        .getField(
            "FirstName", initialValue
        );
```

Input component:

```ts
const field =
    context
        .fieldCache
        .getField(
            "Email",
            ""
        );
```

Identity stability:

```ts
const field1 =
    cache.getField(
        "FirstName", initialValue
    );

const field2 =
    cache.getField(
        "FirstName", initialValue
    );

field1 === field2;
```

Conceptually:

```text
true
```

---

## Responsibilities

JivsFieldCache is responsible for:

* Resolving field wrappers
* Resolving ValueHosts through ValidationManager
* Creating wrappers when necessary
* Applying initial values during wrapper creation
* Maintaining wrapper identity
* Returning stable JivsField instances

---

## Non-Responsibilities

JivsFieldCache is not responsible for:

* Validation execution
* Validation state ownership
* React subscriptions
* React rendering
* Notification routing

These responsibilities belong elsewhere.

---

## Identity Rules

JivsFieldCache guarantees:

```text
One field name
        ↓
One logical JivsField
```

Identity stability is an architectural guarantee within a JivsReactContext.

The underlying storage mechanism is an implementation detail.

---

# JivsFormCache

## Purpose

JivsFormCache owns JivsForm identity.

For a given validation group, the cache returns the same logical JivsForm instance. When not using a validation group, it internally uses the name "*" for the validation group to give a consistent key name.

Conceptually:

```text
Shipping - or null for no validation group
        ↓
JivsFormCache
        ↓
JivsForm
```

---

## Public API

Conceptually:

```ts
class JivsFormCache
{
    constructor( validationManager: ValidationManager );
    getForm(
        groupName?: string
    ): JivsForm;
}
```

---

## Usage Example

All fields:

```ts
const form =
    context
        .formCache
        .getForm(); // or null or '*'
```

Validation group:

```ts
const form =
    context
        .formCache
        .getForm(
            "Shipping"
        );
```

Identity stability:

```ts
const form1 =
    cache.getForm(
        "Shipping"
    );

const form2 =
    cache.getForm(
        "Shipping"
    );

form1 === form2;
```

Conceptually:

```text
true
```

---

## Responsibilities

JivsFormCache is responsible for:

* Resolving form wrappers
* Creating wrappers when necessary
* Maintaining wrapper identity
* Returning stable JivsForm instances

---

## Non-Responsibilities

JivsFormCache is not responsible for:

* Validation execution
* Validation state ownership
* React subscriptions
* React rendering
* Notification routing

These responsibilities belong elsewhere.

---

## Identity Rules

JivsFormCache guarantees:

```text
One validation group
        ↓
One logical JivsForm
```

When no group is supplied:

```text
Default Form
        ↓
One logical JivsForm
```

Identity stability is an architectural guarantee within the scope of one JivsReactContext.

---

# Subscription Architecture

## Purpose

Validation notifications originate from ValidationManager through its onValidationStateChanged and onValueHostValidationStateChanged hooks.

React components must be informed when Validation State changes. To work well with React's own approach, it involves the useSyncExternalStore hook.

The React Adapter provides dedicated subscription infrastructure that routes notifications from ValidationManager to React Hooks.

Conceptually:

```text
ValidationManager
        ↓
Subscription Infrastructure
        ↓
React Hooks
        ↓
React Rendering
```

Subscription infrastructure owns notification routing.

Subscription infrastructure does not own Validation State.

Subscriptions are maintained by ReactFieldSubscriptions and ReactFormSubscriptions classes, both with are established on a JivsReactContext.

---

# ReactFieldSubscriptions

## Purpose

ReactFieldSubscriptions routes field-specific validation notifications.

Only subscribers interested in a specific field receive notifications for that field.

This class exists primarily to support React's external store integration pattern through:

```ts
useSyncExternalStore()
```

The hook layer subscribes to field notifications through ReactFieldSubscriptions. When a field validation state changes, ReactFieldSubscriptions notifies the appropriate subscribers, causing React to request a fresh snapshot from the hook.

Conceptually:

```text
ValidationManager
        ↓
Field Notification from ValidationHost.onValueHostValidationStateChanged
        ↓
ReactFieldSubscriptions
        ↓
Matching Field Subscribers through its onValueHostValidationStateChanged
        ↓
useSyncExternalStore subscriber callback
        ↓
React requests latest snapshot
        ↓
Component rerender if snapshot changed
```

---

## Public API

Conceptually:

```ts
class ReactFieldSubscriptions
{
    subscribe(
        fieldName: string,
        callback: () => void
    ): () => void;

    unsubscribe(
        fieldName: string,
        callback: () => void
    ): void;

    onValueHostValidationStateChanged(
        valueHost:
            IValidatableValueHostBase,

        validationState:
            ValueHostValidationState
    ): void;
}
```

The API defines routing behavior rather than implementation details.

### Member Responsibilities

#### subscribe()

Registers a subscriber for a specific field.

```ts
subscribe(
    fieldName: string,
    callback: () => void
): () => void;
```

Parameters:

* `fieldName` identifies the field of interest.
* `callback` is the notification callback supplied by React's external store integration.

Returns:

* An unsubscribe callback that removes the subscription.

This aligns naturally with the API shape expected by:

```ts
useSyncExternalStore()
```

where React expects a subscription function that returns a cleanup callback.

#### unsubscribe()

Removes a previously registered subscriber.

```ts
unsubscribe(
    fieldName: string,
    callback: () => void
): void;
```

This method represents the underlying removal operation used by the unsubscribe callback returned from `subscribe()`.

Whether consumers call this method directly or only through the returned cleanup callback is an implementation detail.

*subscribe() returns a callback to unsubscribe. Are we going to use it? If so, it needs to be preserved, but not on JivsField because its an instance shared with multiple consumers. I'm wondering if we should return a unique ID from subscribe and only pass that into unsubscribe. That ID is saved by the useFieldValidation system somehow. In fact, it doesn't matter if its an ID or callback, either way we need to store it. If we don't need any form of unsubscribe, maybe we should abandon unsubscribe. In any case, the parameters shown above - fieldname and callback - may be replaced by one parameter with the value returned by subscribe().*

#### onValueHostValidationStateChanged()

Receives validation notifications from the validation infrastructure.

```ts
onValueHostValidationStateChanged(
    valueHost:
        IValidatableValueHostBase,

    validationState:
        ValueHostValidationState
): void;
```

Parameters:

* `valueHost` identifies the field whose validation state changed.
* `validationState` contains the updated validation state.

Responsibilities:

* Determine the affected field name.
* Locate matching subscribers.
* Notify those subscribers.

Pseudocode:

```ts
onValueHostValidationStateChanged(
    valueHost,
    validationState
)
{
    const fieldName =
        valueHost.getName();

    const subscribers =
        subscriptionsByFieldName.get(
            fieldName
        );

    if (!subscribers)
    {
        return;
    }

    for (const callback of subscribers)
    {
        callback();
    }
}
```

---

## Usage Example

Subscription:

```ts
const unsubscribe =
    subscriptions.subscribe(
        "FirstName",
        callback
    );
```

Unsubscription:

```ts
unsubscribe(); // this is NOT subscriptions.unsubscribe. Its the callback from subscribe()
```

Validation notification:

```ts
subscriptions
    .onValueHostValidationStateChanged(
        valueHost,
        validationState
    );
```

---

## useSyncExternalStore Integration

ReactFieldSubscriptions is designed to participate in the external store pattern.

Conceptually:

```ts
useSyncExternalStore(

    (callback) =>
        subscriptions.subscribe(
            fieldName,
            callback
        ),

    getSnapshot
);
```

Flow:

```text
Component Mounts
        ↓
useSyncExternalStore subscribes
        ↓
ReactFieldSubscriptions stores callback
        ↓
Validation State Changes
        ↓
onValueHostValidationStateChanged
        ↓
Matching callbacks invoked
        ↓
React requests snapshot
        ↓
Component rerender if necessary
```

ReactFieldSubscriptions does not provide snapshots.

It only provides notification routing.

Snapshot retrieval remains the responsibility of the hook.

---

## Routing Behavior

Subscriptions are keyed by field name.

Conceptually:

```text
Map<
    string,
    subscribers
>
```

Field name source:

```text
ValueHost.getName()
```

Example:

```text
FirstName changed
        ↓
FirstName subscribers notified
```

Subscribers for:

```text
LastName
```

are unaffected.

---

## Notification Flow

Conceptually:

```text
ValidationManager
        ↓
onValueHostValidationStateChanged
        ↓
ReactFieldSubscriptions
        ↓
Field Subscribers
        ↓
useSyncExternalStore callback invoked
        ↓
React requests snapshot
        ↓
Component rerender
```

---

## Responsibilities

ReactFieldSubscriptions is responsible for:

* Managing field subscribers
* Routing field notifications
* Matching notifications to subscribers
* Providing subscription APIs
* Supporting React external store subscriptions

---

## Non-Responsibilities

ReactFieldSubscriptions is not responsible for:

* Validation State ownership
* Validation execution
* JivsField ownership
* React rendering
* Snapshot generation
* Hook implementation

These responsibilities belong elsewhere.

---

# ReactFormSubscriptions

## Purpose

ReactFormSubscriptions routes validation notifications for a specific validation group.

Validation groups serve the same role for forms that field names serve for fields:

```text
Validation Group
        ↓
JivsForm Identity
        ↓
Subscription Routing
```

Each validation group has its own logical subscriber collection.

Conceptually:

```text
ValidationManager
        ↓
Form Notification
        ↓
ReactFormSubscriptions
        ↓
Matching Group Subscribers
```

When no validation group is supplied, the React Adapter internally assigns the validation group:

```text
*
```

This default group participates in identity resolution and subscription routing exactly like any other validation group.

---

## Members

ReactFormSubscriptions maintains subscriber collections keyed by validation group.

Conceptually:

```ts
private subscribers:
    Map<
        string,
        Set<() => void>
    >;
```

The underlying storage mechanism is an implementation detail.

The architectural requirement is that subscribers can be added, removed, and notified by validation group.

---

## Public API

Conceptually:

```ts
class ReactFormSubscriptions
{
    subscribe(
        validationGroup: string,
        callback: () => void
    ): () => void;

    unsubscribe(
        validationGroup: string,
        callback: () => void
    ): void;

    onValidationStateChanged(
        validationGroup: string,
        validationState:
            ValidationState
    ): void;
}
```

---

## Usage Example

Subscription:

```ts
const unsubscribe =
    subscriptions.subscribe(
        "Shipping",
        callback
    );
```

Unsubscription:

```ts
unsubscribe();
```

Equivalent explicit unsubscription:

```ts
subscriptions.unsubscribe(
    "Shipping",
    callback
);
```

Validation notification:

```ts
subscriptions
    .onValidationStateChanged(
        "Shipping",
        validationState
    );
```

Default validation group:

```ts
subscriptions.subscribe(
    "*",
    callback
);
```

---

## Routing Behavior

Subscriptions are keyed by validation group.

Conceptually:

```text
Map<
    string,
    subscribers
>
```

Example:

```text
Shipping changed
        ↓
Shipping subscribers notified
```

Subscribers for:

```text
Billing
```

are unaffected.

When no validation group is supplied, the React Adapter uses:

```text
*
```

This default validation group behaves exactly like any other group for routing purposes.

---

## Notification Processing

Conceptually:

```ts
onValidationStateChanged(
    validationGroup: string,
    validationState:
        ValidationState
): void
{
    const subscribers =
        this.subscribers.get(
            validationGroup
        );

    if (!subscribers)
    {
        return;
    }

    for (
        const subscriber
        of subscribers
    )
    {
        subscriber();
    }
}
```

---

## Notification Flow

Conceptually:

```text
ValidationManager
        ↓
onValidationStateChanged
        ↓
ReactFormSubscriptions
        ↓
Matching Group Subscribers
        ↓
React requests snapshot
        ↓
Component rerender
```

---

## Responsibilities

ReactFormSubscriptions is responsible for:

* Managing subscribers by validation group
* Routing validation group notifications
* Providing subscription APIs

---

## Non-Responsibilities

ReactFormSubscriptions is not responsible for:

* Validation State ownership
* Validation execution
* JivsForm ownership
* React rendering
* Hook implementation

These responsibilities belong elsewhere.

---

# Architectural Decisions

## RA-011

JivsFieldCache owns JivsField identity.

---

## RA-012

JivsFormCache owns JivsForm identity.

---

## RA-013

Caches exist to provide stable wrapper identity.

Caches do not exist to trigger rerendering.

---

## RA-014

ReactFieldSubscriptions owns field notification routing.

---

## RA-015

Field subscription routing is based on:

```text
ValueHost.getName()
```

---

## RA-016

ReactFormSubscriptions owns aggregate notification routing.

---

## RA-017

Validation groups do not participate in subscription routing.

Groups remain a validation concept.

---

## RA-018

Subscription infrastructure owns notification routing.

Subscription infrastructure does not own Validation State.

---

# Design Summary

The React Adapter provides dedicated cache and subscription infrastructure.

Caches provide stable wrapper identity:

* JivsFieldCache
* JivsFormCache

Subscription services provide notification routing:

* ReactFieldSubscriptions
* ReactFormSubscriptions

Caches and subscriptions have distinct responsibilities.

Caches own identity.

Subscriptions own notification routing.

Validation State remains owned by the Jivs Engine.

Part 3 defines hook integration, wrapper identity behavior, infrastructure lifecycle, error handling, and the complete end-to-end rendering workflow.
