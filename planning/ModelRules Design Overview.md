# Model Rules Design Overview

**Version:** 0.1
**Status:** Working Draft
**Scope:** Cross-cutting architecture and use cases for model rules in Jivs
**Purpose of this document:** Establish guardrails and shared terminology before detailed configuration and validation-side designs are finalized.

---

## 1. Purpose

This document is about simplifying Jivs-Engine for the people who must actually use it.

The main audience is:

* business logic developers who define shared validation configuration
* UI developers who build forms and need a practical validation and save workflow

The core goal is to establish easy, consistent patterns for two related concerns:

* **configuration**
* **form validation + save workflow**

In this overview, **configuration** means the work of defining the Jivs setup that a `ValidationManager` will use.

That includes ideas such as:

* What ValueHosts exist
* What validators exist
* What cross-field rules exist
* What configuration is shared across client and server
* What configuration is added by the UI for a specific form or presentation

In this overview, **form validation + save workflow** means the larger process that happens after data entry is complete.

That includes ideas such as:

* Running Jivs validation on the client
* Running Jivs validation on the server
* Running additional client-only checks
* Running additional server-only checks
* Deciding whether save is allowed
* Handling save failures
* Returning errors to the client
* Reapplying returned errors into ValidationManager so UI components update correctly

A major design goal is to make these patterns easier to understand and easier to apply, especially for UI developers, while still preserving the needs of business logic developers and server-side validation.

This overview is not the place to finalize detailed implementation shapes.

Its job is to explain:

* what problems we are trying to solve
* what use cases matter most
* what parts belong to shared configuration
* what parts belong to validation and save workflow
* what belongs on the client
* what belongs on the server
* what guardrails later detailed documents should follow

The rest of this document should be read through that lens: simplify the Jivs story, especially for real-world form development, without losing the architectural boundaries that matter.

---

## 2. Problems This Design Must Solve

Before discussing terminology or implementation direction, it helps to state the real problems this design must solve.

* A business logic developer wants one shared source of Jivs configuration that can be used by both client and server.
* A UI developer needs to extend that shared configuration for specific forms without editing the business-owned source directly.
* A UI-only screen may still need reusable, testable configuration even when there is no formal domain model.
* The client needs to run Jivs validation after editing completes and reflect ValidationState in the UI.
* The server must run Jivs validation too, because it cannot trust the client.
* The server may also run hidden security checks and other pre-save checks that must not be exposed to the client.
* The save operation itself may fail and still needs to report errors back into the same overall workflow.
* The client must be able to consume returned server errors so Jivs-connected components update correctly.
* Companion libraries such as Jivs-DOM, Jivs-Angular, and Jivs-React need a stable model-rules concept they can consume.

These problems are related, but they are not all the same problem.

Some are about shared configuration.

Some are about where validation runs.

Some are about how errors move between server and client.

That is why this overview separates configuration concerns from validation lifecycle concerns.

---

## 3. High-Level Workflow Parts

The overall validation and save story has these major workflow parts.

### Client side

1. Run Jivs field validators through `ValidationManager.validate()`.
2. Optionally run client-only augmentation checks.
3. If the user submits and the server responds with errors, feed returned `IssuesFound` and/or `ExternalIssuesFound` into `ValidationManager` so the UI updates.

### Server side

4. Run Jivs field validators through `ValidationManager.validate()` using the applicable model rules.
5. Run server-only security checks.
6. Run server-only pre-save business checks.
7. If any relevant errors exist, return without saving.
8. Attempt save.
9. If save fails, convert failures into returned business errors.
10. Return success or errors.

See also: README’s “Submit data to the server” story: server returns Jivs issues and business logic errors, and the client pushes them back into `ValidationManager` using `setIssuesFound()` and `setExternalIssuesFound()`.

### 3.1 Client-side Jivs validation after editing completes

The client runs `ValidationManager.validate()` against configured ValueHosts and validators.

This produces:

* ValidationState
* IssuesFound

### 3.2 Client-side auxiliary checks

The client may run additional checks not built into the Jivs validator configuration.

Examples:

* Spell checker service
* Other client-side helper checks

These are separate from normal Jivs validator execution.

### 3.3 Server response handling on the client

After an attempted save, the server may return either or both:

* IssuesFound
* ExternalIssuesFound

The client may feed those results back into `ValidationManager` so Jivs-connected UI components update their validation state.

### 3.4 Server-side Jivs validation

The server runs `ValidationManager.validate()` against configuration created from the same model rules.

This is required because the server must not trust the client.

This server-side Jivs validation produces:

* ValidationState
* IssuesFound

Those `IssuesFound` may be included in the server response.

### 3.5 Server-side hidden security checks

The server may run additional checks that are intentionally not client-facing.

Examples:

* Injection attack detection
* Suspicious input pattern checks
* Other hidden security rules

These checks may produce generalized responses, `ExternalIssuesFound`, or security-specific handling outside the normal user-facing validation flow.

### 3.6 Server-side pre-save business checks

The server may run additional pre-save checks not already covered by Jivs field/configuration validation.

Examples:

* Database duplicate detection
* Repository lookups
* External service checks
* Business policies not expressed as Jivs field validators

These often produce `ExternalIssuesFound`.

### 3.7 Save decision

If any relevant errors are found before save, the server returns without saving.

If not, the server attempts save.

### 3.8 Post-save failure handling

The save itself may fail.

Examples:

* Database constraint failure
* Optimistic concurrency failure
* External service failure during save
* Unexpected save rejection

These are not pre-save validation failures.

They are a separate phase and often produce `ExternalIssuesFound` for return to the client.

### 3.9 Final server response

The server response may legitimately be:

* Success
* Only IssuesFound
* Only ExternalIssuesFound
* Both IssuesFound and ExternalIssuesFound

This overall workflow is one of the key reasons the detailed design should not assume that all configuration and all validation execution belong in one abstraction.

---

## 4. Terminology

### 4.1 Model

In this design, “model” is documented broadly.

A model is the validation target.

It may be:

* A formal domain model
* A DTO
* An entity
* A form shape
* A login screen
* A search panel
* A filter object
* Any UI-only data set that needs validation

### 4.2 Validation Target

A validation target is the thing whose values are being validated.

A validation target may be:

* A business model
* A UI-only set of fields
* A temporary object used during editing

### 4.3 IssuesFound

`IssuesFound` are produced by Jivs validators.

They come from running `ValidationManager.validate()` against configured ValueHosts and validators.

They are the direct output of Jivs field/configuration validation.

### 4.4 ExternalIssueFound

`ExternalIssueFound` represents issues produced outside the normal Jivs validator pipeline.

Examples:

* Pre-save business checks
* Server-only checks
* Security-related responses mapped to fields or model-level errors
* Save failures
* External system failures discovered during save

A `ExternalIssueFound` may be associated with a ValueHost when possible, but it is not the same thing as an `IssueFound`.

### 4.5 Shared Configuration

Shared configuration means the rules/configuration that can be authored once and used in more than one environment.

Typical examples:

* Business-owned ValueHosts
* Business-owned validators
* Cross-field rules
* Common configuration variants

### 4.6 Environment-Specific Execution

Environment-specific execution means validation-related work that depends on where the code runs.

Examples:

* Client-side helper checks
* Server-side security checks
* Database lookups
* External service checks
* Save-time failure handling

---

## 5. Common Model Rules Patterns

This section describes the common ways model rules may be authored, shared, and extended.

These patterns are not mutually exclusive.

A system may start in one pattern and later adopt another.

### 5.1 Shared business-authored model rules

A business logic developer defines model rules in a shared codebase that can be used by both server and client.

This is the strongest story when it is available because it provides a Single Source of Truth.

Typical characteristics:

* The server contains the official model rules implemented into Jivs where possible.
* The server uses those rules for its own authoritative Jivs validation.
* The client may retrieve and use that same code unchanged.
* The client is therefore able to follow the same core business rules as the server.

This pattern is important when the goal is to keep client and server aligned on the same model rules.

### 5.2 UI extension of shared business-authored model rules

The UI may start from shared business-authored model rules and then extend them for a specific form or presentation.

Typical extension points include:

* Labels
* UI-oriented error message choices
* Enablement rules
* Additional UI-only ValueHosts
* Additional UI-only validators
* Form-specific variants

These UI extensions may be purely presentational, but they may also influence how a form behaves.

Example:

* One field enables another and therefore enables that field’s validators.

The important requirement is that the UI must be able to extend shared rules without editing the original business-owned source directly.

### 5.3 Client-authored model rules

A client application may define model rules entirely within its own codebase when there is no business-owned shared source to depend upon.

This is still a valid model-rules story.

It is not limited to ad hoc page code.

The client-authored rules may still be formal, reusable, and shared across multiple UI consumers.

Examples:

* Login model used by multiple UI implementations
* Search form model
* Filter panel model
* Wizard-step model

This pattern matters because some systems do not begin with shared business-authored model rules, but still need a strong and reusable Jivs configuration story.

---

## 6. Primary Goals

* Respect the needs of both business logic developers and UI developers.
* Keep shared business configuration in one place when possible.
* Allow client and server to follow the same core Jivs validation rules.
* Allow UI-specific form variations without forcing the UI to edit business-owned code directly.
* Preserve a clean boundary between shared configuration and environment-specific execution.
* Allow Jivs companion UI libraries to integrate with a stable model-rules concept.
* Avoid exposing server-only security logic to the client.
* Support both business-model-driven and UI-only validation targets.
* Pursue ease of use for the UI developer both when consuming shared business-authored rules and when building client-authored model rules.

---

## 7. Layer Responsibilities

This section describes responsibilities by layer, while allowing for the different model-rules patterns described earlier.

Not every system will use every layer in the same way.

### 7.1 Business Layer

The business layer is the natural home for shared business-authored configuration when such a shared source exists.

Typical responsibilities:

* Business-owned field definitions
* Business-owned validators
* Cross-field rules
* Shared configuration intended for both client and server
* Business-owned configuration intended to be reused unchanged or extended by the UI

The business layer may also own server-side pre-save logic, but that is not automatically the same thing as shared Jivs configuration.

### 7.2 UI Layer consuming or extending shared model rules

The UI layer may consume shared business-authored model rules and may also extend them for a specific form or presentation.

Typical responsibilities:

* Labels
* UI-oriented error message choices
* UI-only ValueHosts
* UI-only validators
* Enablement rules
* Form-specific variants
* Binding inputs/components to ValidationManager

The UI layer should be able to extend shared business-owned configuration without modifying the original business-owned source directly.

### 7.3 UI Layer authoring its own model rules

A UI application may also define model rules in its own codebase when there is no business-owned shared source to depend upon.

Typical responsibilities:

* Define client-authored configuration for a validation target
* Keep that configuration reusable and testable
* Share that configuration across multiple UI consumers when needed
* Bind inputs/components to ValidationManager
* Optionally layer presentation-specific refinements on top of client-authored shared rules

Examples include login, search, filter, and wizard-step models that are formal enough to deserve reusable model rules even without a business-authored source.

### 7.4 Client Runtime

The client runtime is responsible for interactive validation behavior and for reflecting validation state in the UI.

Typical responsibilities:

* Run Jivs validation through ValidationManager
* Optionally run client-only helper checks
* Receive server errors and push them back into ValidationManager
* Update UI based on ValidationState and ValueHost state changes

### 7.5 Server Runtime

The server runtime is responsible for authoritative validation and save behavior.

Typical responsibilities:

* Run Jivs validation through ValidationManager using the applicable shared configuration
* Collect IssuesFound for any Jivs validation failures
* Run server-only security checks
* Run server-only pre-save business checks
* Attempt save only when appropriate
* Map save failures into ExternalIssuesFound
* Return success and/or error payloads to the client

---

## 8. Where Validation Happens

### 8.1 Client-side Jivs validation

Client-side validation uses `ValidationManager.validate()` against the configured ValueHosts and validators.

This is the normal field/configuration validation path used by the UI.

Output:

* ValidationState
* IssuesFound

### 8.2 Client-side auxiliary checks

The client may run additional checks that are not part of the core Jivs validator configuration.

Examples:

* Spell checker calls
* Client helper services
* Other UI-driven checks

These are not the same thing as shared business configuration.

### 8.3 Server-side Jivs validation

The server may also run `ValidationManager.validate()` against configuration created from the same model rules.

This is important because the server must not trust the client.

Server-side Jivs validation produces:

* ValidationState
* IssuesFound

These `IssuesFound` may be returned to the client.

### 8.4 Server-side security checks

Some server-side checks must not be exposed to the client.

Examples:

* Injection attack detection
* Suspicious input patterns
* Other hidden security rules

These checks may not behave like normal user-facing validation.

Possible outcomes include:

* Generalized field/model error response
* ExternalIssueFound response
* Security-specific handling outside normal validation flow

### 8.5 Server-side pre-save business checks

The server may run additional pre-save checks beyond normal Jivs validation.

Examples:

* Duplicate detection in a database
* Repository lookups
* External service checks
* Business policies not represented as Jivs field validators

These often produce `ExternalIssueFound` results.

### 8.6 Post-save failure handling

Some problems are only discovered during or after save.

Examples:

* Database constraint failure
* Optimistic concurrency failure
* External service failure during save
* Unexpected save rejection

These are not the same thing as pre-save validation.

They should be treated as their own phase and often produce `ExternalIssueFound` results for the client.

---

## 9. Validation Outputs and Error Flow

The overall system may produce either or both of these error outputs:

* IssuesFound
* ExternalIssuesFound

Important distinction:

* IssuesFound come from Jivs validators.
* ExternalIssuesFound come from outside the normal Jivs validator pipeline.

A server response may legitimately contain:

* Only IssuesFound
* Only ExternalIssuesFound
* Both IssuesFound and ExternalIssuesFound
* Success with no errors

On the client, returned errors may be pushed back into `ValidationManager` so components can update their validation state accordingly.

---

## 10. Single Source of Truth Boundaries

A key design goal is a Single Source of Truth for shared configuration.

That goal should be understood carefully.

### What can reasonably be SSOT

* Business-owned Jivs configuration
* Business-owned field definitions
* Business-owned validators
* Cross-field rules
* Portable configuration variants

### What should not be forced into the same SSOT concept

* Server-only hidden security logic
* Database-specific checks
* External service checks
* Client-only helper checks
* Save-time failure handling

So the design should likely aim for:

* Shared configuration SSOT
* Separate execution behavior by environment and phase

---

## 11. UI Variation and Extension

A major requirement is allowing UI-specific variation without forcing the UI to edit the shared business-owned source directly.

Typical examples:

* Person Edit form
* Person Create form
* Person Admin form
* Different component libraries or presentation styles

The design should support:

* Business-owned shared configuration
* UI-owned extension of that configuration
* Multiple UI form variants based on the same business-owned rules

This is especially important for companion libraries such as:

* Jivs-DOM
* Jivs-Angular
* Jivs-React

Those libraries need a stable way to obtain fully configured validation behavior without owning business rules themselves.

---

## 12. Companion Library Perspective

Companion UI libraries need a stable concept they can consume.

At a high level, they need to know:

* How to obtain the configuration for a validation target
* How to create or access a ValidationManager based on that configuration
* How to react to ValidationState and ValueHost validation changes
* How to support model-based and UI-only forms
* How to support form-specific variants

This overview does not finalize the implementation shape for that integration.

It only establishes that this is a first-class requirement.

---

## 13. Guardrails for Detailed Design

The following guardrails should guide later detailed documents.

* Do not assume that shared configuration and all validation execution belong in one class.
* Do not assume that server-only checks should be portable to the client.
* Do not assume that IssuesFound and ExternalIssuesFound are interchangeable.
* Do not assume that UI-specific extension must edit business-owned source directly.
* Do not assume that post-save failures are just another form of pre-save validation.
* Do not assume that one detailed API shape is already settled.
* Do preserve the central role of ValidationManager.validate() for Jivs field/configuration validation.
* Do preserve the server’s role as authoritative validator.
* Do preserve the possibility of returning either or both IssuesFound and ExternalIssuesFound from the server.
* Do preserve support for both business-model-driven and UI-only targets.

---

## 14. Likely Follow-on Design Documents

This overview should be followed by more detailed documents, likely including:

* A configuration-focused design document
* A validation/execution lifecycle design document
* Possibly a factory/resolution design document if needed
* Possibly a companion-library integration design document if needed

Those documents may repeat some terminology and pattern-oriented sections where helpful.

---

## 15. Open Questions Carried Forward

* What final names should be used for the configuration-side abstractions?
* How should shared business configuration be extended by UI-specific variants?
* How should factories resolve business-model-driven vs UI-specific forms?
* How should model identity and form/presentation identity relate?
* How should config analysis integrate without coupling jivs-engine to jivs-configanalysis?
* How should server-side Jivs validation results and server-side business/security/save errors be modeled in the detailed lifecycle design?
* What helper APIs, if any, should exist for pushing returned server errors back into ValidationManager?

---

## 16. Summary

This overview establishes the broad design direction:

* Jivs needs a strong shared-configuration story.
* Client and server both rely on Jivs field/configuration validation through ValidationManager.
* Server-side validation remains authoritative.
* IssuesFound and ExternalIssuesFound are both important but represent different sources of problems.
* UI needs a clean way to extend shared business-owned rules for form-specific variations.
* Detailed implementation should be split into focused design documents rather than forcing every concern into one abstraction too early.

This document is intended to keep the detailed design work aligned with those realities.

---

## 17. Scope and Non-Scope

### In scope

* Use cases for model rules
* Shared terminology
* Client/server responsibilities
* Business-layer vs UI-layer responsibilities
* The overall role of Jivs validation
* The overall role of business errors returned outside Jivs validators
* Single Source of Truth boundaries
* Guardrails for later design documents

### Out of scope

* Final interface names
* Final method signatures
* Final factory registration APIs
* Detailed caching APIs
* Detailed config analysis integration APIs
* Detailed submit/save lifecycle APIs
* Detailed class hierarchies

This document may mention likely directions, but it should avoid locking them in too early.
