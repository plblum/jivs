# Validation-Side Planning Notes Part 1

## Purpose

This document captures the current understanding of the **validation-side** problem space for model rules in Jivs.

It is intentionally **pre-design**.

Its job is to:

* describe the important use cases
* show the workflow phases end to end
* identify where client and server responsibilities differ
* identify where Jivs-specific boundary objects appear
* identify where app-specific code is still required
* help decide later what helper APIs or services belong in Jivs

It does **not** yet define final interfaces, class names, or method signatures.

---

## Working assumptions

### 1. Configuration is already separated

`ModelRules.configure()` creates a configured `ValidationManager`.

This validation-side work starts **after** that configuration story.

### 2. Validation visuals are client-side

Even when the server generates most or all of the HTML, the server does **not** directly render validation issues into the UI.

Instead:

* the server provides HTML and any needed containers
* the client creates/configures `ValidationManager`
* the client wires callbacks/hooks
* the client applies validation visuals and messages

This remains true for server-rendered pages.

### 3. Jivs has two returned-error channels

The normal Jivs returned-error flow has two Jivs-facing channels:

* `IssuesFound`
* `ExternalIssuesFound`

`IssuesFound` comes from Jivs validation.

`ExternalIssuesFound` is the Jivs-facing type for non-Jivs errors that need to participate in the Jivs UI/update flow.

If a non-Jivs server error is going to come back through the normal Jivs returned-error flow, its Jivs-side adaptation target is `ExternalIssuesFound`.

### 4. Business logic owns its own native error forms

Application/server/business code may represent errors in any way it wants.

Examples:

* exceptions
* repository failures
* service result objects
* domain error objects
* save failures
* security failures

Those are **not** assumed to be Jivs objects.

Before Jivs packages a response for the client, app/server code may need to translate its own errors into `ExternalIssuesFound`.

### 5. Browser app models differ

The logical workflow is shared, but implementation may differ based on app model.

Known important models include:

* same-page / SPA update
* full page reload / server-rendered round trip
* framework-managed navigation where the component/page instance is recreated
* plain DOM / progressive-enhancement pages

This document should avoid assuming a SPA-only model.

### 6. Error adaptation into `ExternalIssuesFound` is a cross-workflow concern

Non-Jivs errors may need to be adapted into `ExternalIssuesFound` in more than one place depending on the workflow.

Examples:

* on the server side, when Jivs is used on the server and app-native errors must be reported through the normal Jivs returned-error flow
* on the client side, when the client uses Jivs but the server/API does not, and client-side code must adapt returned server errors into `ExternalIssuesFound`

The adaptation code may differ by environment and error source, so it is not necessarily shared code.

However, the adaptation pattern is shared:

* non-Jivs error source
* conversion/adaptation
* `ExternalIssuesFound`
* Jivs handling/reporting

### 7. Jivs operates beside live data

Jivs operates beside the application's live data rather than owning it directly.

Jivs does not automatically fetch values from inputs, models, HTTP collections, JSON objects, or other data sources.

Instead, user code supplies values into Jivs through its configuration and runtime APIs.

Jivs then validates and reports on the values it has been given.

This separation is intentional. It keeps Jivs independent of UI frameworks, transport mechanisms, persistence models, and data-source ownership.

### 8. Jivs returned content travels inside broader response content

When the server returns Jivs-facing content, that content is often sent together with other application-defined response content, such as model data, page data, operation results, or other fields.

Jivs does not assume ownership of the full server response object or full returned page payload.

Instead, Jivs-facing returned content must fit into a broader response-building process owned by the application/server code.

### 9. Packaging may be selected by identifier with a default

The client may use Jivs or not. These cases may change how errors are returned. For Jivs specific, we need to see IssuesFound. For an API, there can be an object outside of Jivs scope. As a result, the client needs to tell the server code how to package.

When the server prepares returned Jivs-facing content, the packaging approach may vary by response contract or consumer type.

The application may supply an identifier that selects the packaging strategy or packaging helper to use, with a default used when no identifier is supplied.

This selection concern is separate from validation itself.

### 10. Jivs-engine does not own HTTP response semantics

Jivs-engine does not own HTTP-specific response concepts such as status codes, content types, headers, routing, or transport-level response semantics.

Those decisions remain the responsibility of application/server/framework code.

Jivs-engine may help prepare Jivs-facing returned content for integration into a broader response, but it does not determine how HTTP delivery is performed.

### 11. Model creation and onward data transfer remain application-owned

Jivs validates values supplied into `ValueHosts`. It never directly interacts with a Model object. That's entirely the domain of the application. It does not create the application's model object for the developer, and it does not move field data, prepared values, or model data onward to another server, service, database, or other boundary.

The developer remains responsible for deciding if and when to create a model object, and for deciding whether later processing uses a model object, prepared field values, `ValueHost` values, or other prepared source values.

The recommended sequencing is that Jivs/input validation should finish with no blocking errors before the developer creates the model object intended for later business processing, transport, or persistence.

However, model creation is still entirely the developer's choice. It may happen before post-Jivs checks, after post-Jivs checks, or not at all.

---

## Workflow scope: use cases and workflow mapping

This section identifies the use cases currently recognized in the model/input-validation space for Jivs model rules.

Its purpose is to show the use cases themselves, give a short description of each, and identify which reusable workflow pattern each one currently maps to.

The workflows written later in this document are intended to capture reusable patterns. Later documents or later sections may restate those patterns from different client-side or server-side viewpoints.

### 1. Authoritative server validation only after data preparation

Before the server runs authoritative Jivs validation, it must have its ValueHosts populated with the values from the client. To do so, it may parse, convert, normalize, or enrich incoming data so that validation runs against the prepared server-side values rather than the raw submitted representation.

Maps to: primarily Workflows A, B, and C

### 2. Same-instance browser round trip

The client keeps the same page or component instance alive across submit and response handling.

Returned Jivs-facing errors are applied to the existing `ValidationManager`.

Maps to: Workflow A

### 3. Reload or recreated-instance browser round trip

The page, component, or other client instance is recreated after the server returns errors.

Returned Jivs-facing errors must be restored while creating a new `ValidationManager`.

Maps to: Workflow B

### 4. API endpoint with unknown or non-Jivs consumer

A consumer submits model data to a server/API boundary, but no client-side Jivs `ValidationManager` restoration is assumed.

The server may still run Jivs validation, adapt non-Jivs errors into Jivs-facing shapes, and return structured results.

Maps to: Workflow C

### 5. Client-side Jivs with non-Jivs server errors

The client uses Jivs for local validation and UI updates, but the server or API does not use Jivs and returns errors in its own format.

Client-side code converts those returned server/API errors into `ExternalIssuesFound` and applies them to the existing `ValidationManager`.

Maps to: Workflow D

### 6. Server-to-server or internal service validation call

One server or internal service submits model data to another service boundary and needs structured validation results back.

No client-side Jivs restoration step is assumed.

Maps to: Workflow C

### 7. Batch import, queued command processing, or background-job validation

A non-browser process submits model data for validation and possibly save/processing, then gathers structured results for the calling system, job record, log, or other wrapper process.

No client-side Jivs restoration step is assumed.

Maps to: Workflow C

### 8. CLI or admin tooling with structured validation results

A CLI tool, admin tool, or similar operational client submits model data and needs structured validation or save-failure results back.

No client-side Jivs restoration step is assumed.

Maps to: Workflow C

### 9. Shared model rules used by both browser and service consumers

The same model rules defined in a Jivs Validation Manager configuration may be used across browser-based workflows and API/service workflows.

This is not a distinct returned-error pattern by itself, but it is an important use case for the architecture.

Maps to: Workflows A, B, or C depending on the consumer and return path

### 10. Framework-managed navigation with recreated client instances

Some frameworks recreate the page or component instance as part of navigation or data reload behavior, even when the user experiences it as part of one application flow.

When returned errors must be restored into a newly created `ValidationManager`, this follows the recreated-instance pattern.

Maps to: Workflow B

### 11. Server-rendered page with client-side Jivs visuals

The server renders HTML and initial values, but the client still creates/configures `ValidationManager` and still applies validation visuals and messages.

When returned errors are restored after a round trip into a newly created client-side `ValidationManager`, this follows the recreated-instance pattern.

Maps to: Workflow B

### 12. Recreated-instance flow with optional prior-state restoration

A recreated-instance workflow may also want to preserve narrower validation-state niceties, such as showing that a previously invalid field was corrected.

This is not a distinct returned-error workflow by itself, but it is a related use case that may affect recreated-instance restoration design.

Maps to: primarily Workflow B, and potentially other recreated-instance cases later

### 13. Client-side validation with no server round trip

The client uses Jivs for local validation and UI updates, and the workflow stops before the intended action when validation reports errors.

Those validation results must still be reflected in the UI through the existing `ValidationManager`, even though no server submission or returned-error path occurs.

Maps to: Workflow E

### 14. Multi-step or tabbed client-side validation using Validation Groups

A user edits one logical validation target across tabs or steps. Each tab/step has its own Jivs validation group.

Before the user can switch tabs or advance steps, the client calls `ValidationManager.validate(group)` for the current tab/step. If validation reports errors, the current tab/step remains active and the UI reflects those errors.

When the user later invokes the final action, such as submit, the flow uses the normal client-side submit workflow without a validation group.

Maps to: Workflow F for validation-group switch/handoff, then Workflow A, B, or D for final submit depending on the submit/return path

### 15. Hidden or inactive UI regions containing fields with errors

A validation result may target a field that is currently hidden because it is in an inactive tab, collapsed panel, later step, or conditionally hidden region.

When validation blocks the user's action, the UI may need to reveal, activate, expand, or navigate to the region containing the errored field so the user can find and correct it.

Implementation is left to the user. Yet there are a few well known solutions:

* Find the very first field with an error and reveal its tab/panel/step
* Show the ValidationSummary component to at least call out all errors on screen

  * Expand it so that a click on an error message shows the tab/panel/step and brings the field into view.

Maps to: primarily Workflows F, A, B, and D, and sometimes Workflow E depending on the client action

### 16. Validation of initial or externally supplied values before user edit

The client may receive initial or updated values from the server, an API, restored state, or another non-edit source, and those values may need to be validated and reflected in the UI even before the user edits a field.

Jivs supports this through preliminary validation, such as `ValidationManager.validate({ preliminary: true })`, which the user may call whenever that behavior is appropriate.

Maps to: primarily Workflow E, and sometimes Workflow B

### 17. Validation Summary as the UI destination for unattached errors

Some validation results, especially `ExternalIssuesFound`, may not be naturally attached to a specific visible field.

In those cases, the user is expected to provide a ValidationSummary-style UI element. `ValidationManager.onValidationState` should notify that element, and the element can obtain all current validation messages, including `ExternalIssuesFound`, through `ValidationManager.getValidationState()` or from the `onValidationState` notification itself.

Maps to: primarily Workflows A, B, D, E, and F

### 18. Validation that includes asynchronous evaluation and completion waiting

A validation run may start one or more asynchronous validation processes. In that case, the caller may need a helper around `ValidationManager.validate()` that resumes only after all asynchronous work started by that validation run has finished.

This is a narrow validation-run use case rather than a full end-to-end returned-error workflow.

This helper is expected to become a Jivs feature because it is a high-profile need.

Maps to: cross-cutting use case; no separate workflow

### 19. Non-blocking validation results such as warnings or advisory messages

A validation or business-rule result may need to be reported to the user even when it does not block the current action.

In Jivs, `ValidationState.doNotSave` is the ultimate determination of whether save is allowed. That means a warning-level `IssueFound` can make `ValidationState.isValid = false` while still allowing save because `doNotSave` remains false.

The UI may still need to surface that result through field visuals, summary reporting, or both, while allowing the workflow to continue.

Maps to: primarily Workflows A, B, D, E, and F, and potentially C when the consumer distinguishes blocking vs non-blocking results

### 20. Hostile or suspicious input handled outside the normal returned-error flow

The server may detect hostile or suspicious input before normal Jivs validation or later business checks continue.

In that case, the application may stop the workflow, redirect, log, deny, or otherwise handle the event outside the normal Jivs returned-error path rather than reporting it back as ordinary UI-facing validation content.

This step is up to the developer, although Jivs may later provide a module around it to help fill this gap.

Maps to: primarily Workflows A, B, and C

---

## High-level workflow phases

The current understanding is that the validation-side story has multiple phases.

These phases should be made explicit before deciding whether Jivs needs one helper, several helpers, or mostly documentation.

### Client-side "submit" phases

1. Prerequisite: Client creates/configures `ValidationManager` and has provided values to ValueHost prior to submit

2. Client runs Jivs validation

   - Assigns supplied values to ValueHosts

   - Invokes ValidationManager.validate()

   - If ValidationState.doNotSave is true, stop.

3. Client runs other non-Jivs checks, if needed

   - Developer decides whether to create a model object or to use other value sources for these checks
   - Client converts non-Jivs errors to `ExternalIssuesFound`
   - ValidationManager.setExternalIssuesFound() to reflect them in the UI
   - If ValidationState.doNotSave is true, stop

4. If a model is needed for save and has not yet been created, create it.

5. Client submits data to the server

6. Client receives server-returned validation/business-error payload

7. Client reapplies returned errors into `ValidationManager`

8. Client hooks update visuals/messages

### Server-side phases

1. Server receives submitted data

2. Server performs early security screening on hostile or suspicious input

3. Server prepares data for later validation/check steps

   - *Too early for creating a model, because its not useful if there are field errors.*

4. Server runs Jivs validation

   - Configure and create ValidationManager
   - Assigns supplied values to ValueHosts
   - Invokes ValidationManager.validate()
   - If ValidationState.doNotSave is true, skip ahead to "Server prepares returned content" which at this point are only IssuesFound.

5.  

   Server runs other non-Jivs checks

   - Developer decides whether to create a model object or to use other value sources for these checks
   - Server converts non-Jivs errors to `ExternalIssuesFound`
   - If ValidationState.doNotSave  is true or externalIssueFounds were found, skip ahead to "Server prepares returned content". *Unlike the client side, we don't use ValidationManager.setExternalIssuesFound here because we need to keep them separate*

6. Server attempts save if allowed

   - Developer creates the Model object from the source data if needed to save and not previously created
   - Save is attempted
   - Server converts save-time native app errors to `ExternalIssuesFound` when needed

7. Server prepares returned content

   - Server selects the packaging/integration approach to address Jivs errors.
   - It runs that
   - It merges the results into the response data however the user wants it.

8. Server integrates that content into the broader response or returned page data

9. Server delivers the broader response content

---

## Core use cases

### UC-001 Shared configuration produces a ValidationManager

Jivs model-rules configuration creates the `ValidationManager` used by the client and/or server workflow.

This is already handled by the configuration-side design and is the starting point for the validation-side story.

### UC-002 Client-side local validation before save

The client runs Jivs validation using `ValidationManager.validate()`.

This supports:

* field validation while editing
* final validation before save
* updating the current UI state

### UC-003 Server-side Jivs setup before validation

When the server uses Jivs, it must prepare the Jivs validation runtime before validation can execute.

This includes:

* selecting the correct model rules
* creating/configuring the `ValidationManager`
* transferring incoming source values into the appropriate `ValueHosts`

Source values may come from:

* HTTP form fields
* typed objects
* untyped objects created from JSON

### UC-004 Server-side authoritative Jivs validation

The server must run Jivs validation too.

The server cannot trust the client.

This produces server-side `IssuesFound`.

### UC-005 Early server-side security screening

Before any Jivs validation runs, the server may perform early security screening on hostile or suspicious input.

Examples:

* SQL injection attempts
* hostile payload patterns
* suspicious input intended to abuse later processing steps

This phase exists to block dangerous input before later validation, business checks, or save logic uses it.

This is separate from later business/pre-save checks.

If this phase blocks processing, what happens next is up to the application developer. The developer may choose to stop the workflow entirely, redirect or otherwise handle the event outside the normal returned-validation-content flow, or convert the outcome into a `ExternalIssueFound` and defer it for later reporting.

### UC-006 Post-Jivs business/pre-save checks

After Jivs validation runs, the server may perform additional non-Jivs checks outside normal Jivs validator execution.

Examples:

* repository/database checks
* duplicate detection
* business policy checks
* external service checks

Whether the workflow continues into this phase after Jivs validation is up to the application developer. The developer may choose to stop immediately when Jivs `IssuesFound` already exist, or continue into this phase anyway.

These checks may run against:

* a model object created by the developer
* prepared field values
* `ValueHost` values
* other prepared source values

Jivs-engine does not deal with the model object itself. That is for the developer. 

If the developer does create a model object, that may happen before this phase or after this phase depending on the application's design.

These checks do not naturally produce `IssuesFound`.

They may instead produce native app errors that later need translation into `ExternalIssuesFound`.

The check step and the conversion step are distinct in the workflow, even if some implementations combine them internally.

### UC-007 Save attempt and save failure handling

The server attempts save only when no server-side errors remain after the earlier phases that the developer chose to run.

The save itself may still fail.

Those failures are not the same as field validation errors.

They may still need to reach the client through `ExternalIssuesFound`.

When that happens, the save-failure detection step and the conversion-to-`ExternalIssuesFound` step are also distinct in the workflow, even if some implementations combine them internally.

### UC-008 Server normalizes returned errors into Jivs-facing shapes

The server-side workflow may produce two Jivs-facing collections:

* `IssuesFound`, which come from Jivs validation
* `ExternalIssuesFound`, which come from translating non-Jivs security, business, or save errors when the application chooses to report them through the normal Jivs returned-error flow

These become the Jivs-facing returned content later used for packaging and reporting.

### UC-009 Server prepares Jivs-facing returned content for response integration

A Jivs-side sender or helper prepares the returned Jivs-facing content in a form suitable for integration into the server's broader response content.

That Jivs-facing content is limited to:

* `IssuesFound`
* `ExternalIssuesFound`

The prepared Jivs-facing returned content may contain `IssuesFound`, `ExternalIssuesFound`, both, or neither.

The overall server response may also include other application-defined content, such as model data, page data, operation results, or other response fields.

The Jivs-side sender/helper does **not** own the entire response object and does **not** own translation of app-native errors into `ExternalIssuesFound`.

That translation happens earlier in app/server code.

### UC-010 Server integrates Jivs-facing returned content into broader response content

After Jivs-facing returned content has been prepared, app/server code or a selected packaging helper integrates that content into the broader response object, page payload, or service result structure.

This step may depend on a selected packaging contract or packaging identifier.

Any selected server-side packaging approach implies a corresponding retrieval or unpackaging path on the receiving side.

### UC-011 App/server delivers the broader response content

After the broader response content has been prepared, app/server code is responsible for delivering it.

Examples:

* JSON response body
* script-injected page data
* hidden input or hidden DOM content
* server-rendered page payload conventions

This delivery mechanism may vary by app model and framework.

### UC-012 App/client retrieves packaged content

On the client side, app/framework code retrieves the packaged Jivs content from wherever it was delivered.

Examples:

* fetch/XHR response body
* page bootstrapping script data
* hidden input
* hidden DOM element

This retrieval step is separate from Jivs applying the content.

### UC-013 Client reapplies returned errors into ValidationManager

Once the client has the returned Jivs content, the appropriate Jivs-facing path reapplies it into `ValidationManager`.

The two main patterns are:

* same-instance application through the existing `ValidationManager`, using `setIssuesFound()` and `setExternalIssuesFound()`
* reload restoration through `ModelRules.configure()` as part of creating a new `ValidationManager`

This lets Jivs-connected UI update consistently.

### UC-014 SPA / same-instance returned-error application

When the same page/component instance survives, the client can apply returned errors directly to the existing `ValidationManager`.

This is the simplest case.

### UC-015 Reload / recreated-instance returned-error restoration

When the page/component is recreated, the old `ValidationManager` no longer exists.

In that case, returned Jivs content is restored through `ModelRules.configure()` as part of creating a newly configured `ValidationManager`.

### UC-016 Optional preservation of prior validation-state niceties

A narrower UX use case exists when Jivs shows that a previously invalid field was corrected, such as a “fixed it” indicator.

If the page/component is recreated due to errors on the server side, preserving that kind of state may require additional state preservation and restoration.

This appears to be optional and lower priority than restoring returned `IssuesFound` / `ExternalIssuesFound`. It should not be directly connected to IssuesFound / ExternalIssuesFound. ValidationManager already knows how to save state to a hook and take in the last state through a property on the ValidationManagerConfig which is used to create ValidationManager.

### UC-017 Server-rendered initial values with client-side validation visuals

In some apps, the server generates HTML with initial input values already present in the DOM.

The client still creates/configures `ValidationManager` and still applies validation visuals.

This may affect:

* how initial values are synchronized
* when `ValueHosts` receive values
* how restored errors are applied after setup

---

Continued in Part 2
