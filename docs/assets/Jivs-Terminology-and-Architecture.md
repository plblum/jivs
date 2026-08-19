# Jivs Terminology and Architecture

## Purpose

This document gives ChatGPT durable technical context for working on Jivs documentation.

It is not an API reference. Use current Jivs source code and API documentation for exact signatures, overloads, configuration properties, and behavior details.

Use this file to preserve terminology, conceptual boundaries, and architectural intent across chats.

## Generic Value-Management Terms

Keep generic value-management concepts distinct from Jivs implementation classes.

### Value Manager

A **Value Manager** is the generic concept used to describe the responsibilities surrounding application values and validation.

Its five responsibilities are:

- Obtaining Values
- Parsing
- Formatting
- Validating
- Communicating Errors

These are peer responsibilities, not necessarily a processing sequence or separate objects.

Important boundaries:

- obtaining values does not imply storing or owning them
- model transfer is outside the Value Manager
- UI presentation is outside the Value Manager
- HTTP processing and response construction are outside the Value Manager

### Text Value and Native Value

A **Text Value** is the textual representation of a value, such as the value used by an input element.

A **Native Value** is the application-oriented representation, such as a number, date, boolean, or other typed value.

Parsing commonly performs:

```text
Text Value → Native Value
```

Formatting commonly performs:

```text
Native Value → Text Value
```

Parsing exists in support of validation rather than as an unrelated workflow. Validation may work with Text Values, Native Values, multiple related values, or application-specific conditions.

Do not use Jivs classes when explaining these concepts generically.

### Error Message and Validation Issue

**Error Message** is the generic, tangible concept used when discussing validation without requiring Jivs knowledge.

Jivs represents discovered validation information with `IssueFound`.

Do not casually substitute Jivs-specific issue terminology into generic value-management explanations.

## Core Jivs Concepts

Jivs implements the Value Manager concept.

### ValueHost

A `ValueHost` represents a value participating in the Jivs validation system.

It has a unique name used to identify it and a data type that influences its behavior.

Do not assume every `ValueHost` is an editable field.

### FieldValueHost

A `FieldValueHost` is a kind of `ValueHost` designed for field-oriented values.

It can work with both Text Values and Native Values.

Other kinds of ValueHosts may represent calculated or static values that participate in validation without being editable model fields.

### ValueHostsManager

A `ValueHostsManager` coordinates a collection of ValueHosts and provides the application-level view of their validation state.

It is the concrete Jivs object that most closely corresponds to the generic **Value Manager** concept.

The manager is not UI infrastructure. Application code supplies values to Jivs and receives value/validation changes from Jivs, while UI behavior remains outside the validation engine.

### JivsServices

`JivsServices` is required Jivs infrastructure used for dependency injection and customization.

The manager and its ValueHosts consume services from it.

Do not imply that `JivsServices` owns or creates those objects merely because they depend on it.

### Rules, Builder, and Configuration

Jivs describes ValueHosts, validation rules, and related behavior through configuration.

The recurring conceptual construction path is:

```text
Rules → Builder → Configuration → ValueHostsManager
```

A rules class uses the **Builder API** to describe the configuration.

The Builder API is the preferred configuration surface because it keeps configuration readable and maintainable.

Keep detailed Builder mechanics in the configuration/API documentation rather than turning architectural explanations into property catalogs.

### ModelReader and ModelWriter

`ModelReader` and `ModelWriter` are optional Jivs tools for transferring data between application models and `FieldValueHost` instances.

Conceptually:

```text
Model → ModelReader → FieldValueHosts
FieldValueHosts → ModelWriter → Model
```

They can apply configured mapping and adaptation rules during transfer.

They are conveniences provided by Jivs, not required architectural boundaries. Existing model-transfer code remains legitimate.

## Architectural Principles

Jivs is intentionally opinionated about a relatively small set of architectural concerns.

### Separation of Concerns

Validation rules should be separable from the UI that consumes them.

The validation engine should not render, manipulate, or otherwise own UI presentation.

Application or UI code decides how reported validation information appears to the user.

This separation also supports independent testing of validation rules.

### Dependency Injection

Jivs uses `JivsServices` as dependency-injection and customization infrastructure.

Treat this as a deliberate architectural feature, not incidental setup.

### Single Responsibility

Keep responsibilities separated where Jivs has intentionally separated them.

Examples include:

- validation versus UI presentation
- validation versus model transfer
- validation data versus HTTP transport
- parsing versus formatting
- producing an issue versus deciding how that issue is displayed

Do not collapse these boundaries merely to simplify an example.

### Builder-Based Configuration

Configuration is expressed through Jivs' Builder API rather than by scattering behavior through UI code.

Rules describe what the `ValueHostsManager` contains and how those ValueHosts should behave.

### Business Rules Can Be the Single Source of Truth

When validation rules belong to the business logic, model-driven rules can become the single source of truth and be reused or adapted by client-side forms.

This is a strong architecture when it fits the application.

Do not present SSOT as a requirement for adopting Jivs or as the main story of the library.

Form-only rules and other architectures remain legitimate.

### Preserve Existing Infrastructure

Jivs can participate in as little or as much of the value-management workflow as appropriate.

Applications may keep existing:

- parsers
- formatters
- model-transfer code
- UI infrastructure
- server-side validation

Do not imply that an application should replace working infrastructure merely to use Jivs.

## Client and Server Architecture

Client and server use substantially the same value-management capabilities, although their surrounding boundaries differ.

Both can:

- receive values
- convert values
- validate values
- produce validation issues
- produce usable model data

The client commonly emphasizes user interaction and validation presentation.

The server commonly emphasizes security, data accuracy, business rules, APIs, and integrations.

The Value Manager does not own transport-boundary conversions. For example:

- browser form input may begin as text
- a JSON API may already have deserialized values
- HTTP response construction remains outside Jivs value management

Do not invent separate conceptual Value Managers for client and server merely because the surrounding environments differ.

## Validation State and Issues

Use source code for exact interface shapes, but preserve these distinctions.

### IssueFound

`IssueFound` represents a validation issue produced by a validator or supplied externally.

Important concepts associated with an issue include:

- `valueHostName` associates the issue with a ValueHost
- `errorCode` identifies the issue type and can align an external/imported issue with validator-owned state
- `severity` describes the issue's severity
- `errorMessage` is prepared for field/local display
- `summaryMessage` is intended for a Validation Summary and falls back conceptually to `errorMessage` when absent
- `doNotSave` can determine whether an issue contributes to blocking save

An `errorCode` by itself should not be assumed to identify a validator across the entire manager. The combination of the relevant `valueHostName` and `errorCode` provides the more specific alignment.

### Severity Belongs to the Issue

Severity is a property of each `IssueFound`, not of the overall validation state.

Jivs severity includes Warning, Error, and Severe.

A Warning may produce an `IssueFound` while the value still remains valid.

Therefore:

- the presence of issues is not identical to invalidity
- UI that displays warnings may inspect `issuesFound`
- UI that styles a field as invalid should use validity state rather than merely counting issues

### isValid and doNotSave Are Different Questions

`isValid` describes whether Jivs currently knows of a validation error.

`doNotSave` answers the stronger practical question of whether the current state is ready to save.

A value can be unsuitable for saving for reasons beyond a simple invalid result, such as needing validation or asynchronous validation still being processed.

When deciding whether submission can proceed, prefer the relevant `doNotSave` state rather than treating `isValid` as equivalent.

### External Validation Issues

Jivs can accept issues discovered outside its own validators, including application business logic and server-side validation.

These issues become part of Jivs validation state so application presentation can consume them through the same validation mechanisms.

Do not assume all validation issues originate from Jivs Conditions or Validators.

## UI Boundary

Jivs reports values, changes, validation state, and issues. It does not prescribe how a UI must present them.

Callbacks and other application glue connect Jivs to UI code.

Keep UI concepts such as these outside the validation engine:

- field styling
- error containers
- Validation Summaries
- popups and tooltips
- focus behavior
- ARIA behavior
- framework component state

When documentation introduces application-side patterns such as **Dispatcher Function** and **Presentation Function**, treat those as documentation/application architecture unless the Jivs source explicitly defines them.

Do not accidentally describe documentation conventions as Jivs API requirements.

## Source-of-Truth Rule

This file intentionally records stable concepts rather than complete API details.

When a documentation task depends on exact behavior:

1. inspect the current supplied Jivs source when available
2. use current API documentation as supporting material
3. prefer source over older learning prose when they conflict
4. do not invent a plausible API from memory

Keep this document stable. Update it when the project's architectural understanding or terminology changes, not for every method or overload change.
