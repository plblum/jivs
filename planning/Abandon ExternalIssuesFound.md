# Plan

## Agreed so far

* `fromValidationPayload()` should be the client-side import pipeline for server-returned issues.
* `toValidationPayload()` should move toward emitting a single flattened `IssueFound[]`.
* All issues imported through `fromValidationPayload()` must end up with `displayOnly = true`.
* `fromValidationPayload()` should be responsible for payload-specific cleanup, including:

  * forcing `displayOnly = true`
  * trying validator-based swap when `errorCode` is present
  * applying encoding
* `setIssuesFound()` should remain focused on storage/distribution into the issue path consumed by `getIssuesFound()`.
* `setExternalIssuesFound()` should not be the place for swap logic.
* Internal separation between validator-managed issues and external/client-local issues is still architecturally useful.
* On the client, `externalIssuesFound` remains for client-created issues, especially client-side model-level errors.
* On the server, flattening external issues into `IssueFound` before transport is acceptable.
* `IssueFound.errorCode` is optional for externally supplied issues and always present for validator-generated issues.

## Open design work

* New public issue injection API: `addIssueFound()` and `addIssuesFound()` replace `setIssuesFound()` and `setExternalIssuesFound()`.
* Define the exact payload shape for `toValidationPayload()` / `fromValidationPayload()`.
* Decide whether `ExternalIssueFound` remains as a public type, becomes server-only, or is deprecated.
* Define what `setIssuesFound()` should do with issues whose `errorCode` does not match a local validator.
* Decide whether `SetIssuesFoundErrorCodeMissingBehavior` stays, changes default behavior, or is removed.
* Define the precise storage path for imported server issues on the client.
* Document the updated server/client workflow and the distinction between client-local external issues vs imported server issues.

## Current architecture

The current design uses two issue shapes.

`IssueFound` is the engine-facing and UI-facing issue type. It is created by validators, collected into `ValidationState.issuesFound`, and contributes to the derived values on `ValidationState`, especially `isValid` and `doNotSave`.

`ExternalIssueFound` is a second issue type used when code outside of normal validator execution wants to add errors into Jivs. Its main purpose is to let non-validator errors participate in the same UI reporting flow as validator-generated issues. Typical examples are business logic failures, save failures, or database errors supplied by server-side code.

The current architecture also separates where issues are stored.

Validator-generated issues are retained through the normal issue path associated with validators and validation state. External issues are retained separately on the `ValueHost` through `externalIssuesFound`. Public retrieval is unified through `getIssuesFound()`, which combines the validator-generated issues and the external issues into one list for the UI.

This means the public read model is already unified, but the write model is split. Some APIs feed validator-managed issue storage, while others feed external issue storage.

## Old design workflows

### 1. Normal validation inside Jivs

```text
ValueHost
  -> Validators run
  -> create IssueFound[]
  -> ValidationState.issuesFound
  -> derive isValid / doNotSave
  -> UI reads getIssuesFound()
```

Notes:

* This is the normal validator path.
* Validator-generated issues use `IssueFound`.
* These issues drive `ValidationState.isValid` and `ValidationState.doNotSave`.

### 2. Adding non-validator errors

```text
App code
  -> create ExternalIssueFound[]
  -> setExternalIssuesFound()
  -> ValueHost.externalIssuesFound
  -> getIssuesFound() merges results
  -> UI displays one combined list
```

Notes:

* This is the external issue path.
* It supports field-level and model-level errors.
* It exists so non-validator errors can still appear through normal Jivs UI retrieval.

### 3. Server-side validation and save decisions

```text
Server request
  -> Jivs validate()
  -> IssueFound[]
  -> server adds ExternalIssueFound[]
  -> save decision uses validation state and/or separate server error list
```

Notes:

* Server-side Jivs issues and server-side non-Jivs issues are both relevant.
* External issues may also affect `isValid` / `doNotSave` unless treated as display-only.
* The developer can also choose to keep save gating outside Jivs by checking a separate error list.

### 4. Server-to-client transport

```text
Server
  -> toValidationPayload()
  -> { issuesFound[], externalIssuesFound[] }
  -> send payload
Client
  -> fromValidationPayload()
  -> setIssuesFound()
  -> setExternalIssuesFound()
```

Notes:

* The old payload preserves two issue collections.
* The transport format keeps the distinction between validator-originated and external issues.
* This duplicates a distinction that the UI does not ultimately care about.

### 5. Client-side cleanup of server-returned issues

```text
Imported external issue
  -> errorCode present?
  -> tryValidatorSwap()
  -> maybe replace server message with client validator message
  -> UI shows result
```

Notes:

* This is the current path for replacing technical server messages with client-facing messages.
* The behavior is tied to the external issue path.
* This mixes payload import concerns with generic external issue handling.

### 6. Round-trip state preservation

```text
Page submit / regeneration
  -> issue state retained
  -> page rebuilt
  -> getIssuesFound()
  -> UI restored
```

Notes:

* Preserving issue state remains important.
* This applies to validator-generated issues and externally added issues.
* State retention is part of the reason issue storage behavior matters.

## Why the old design became hard to reason about

The current architecture works, but it asks the developer to think in two parallel issue models.

One model is about validators and `IssueFound`. The second is about externally supplied errors and `ExternalIssueFound`. The UI ultimately wants one list, and Jivs already exposes one list through `getIssuesFound()`, but the API surface and the payload shape continue to preserve the split.

This makes several responsibilities overlap:

* generic issue injection
* external issue storage
* payload transport
* payload hydration
* client-side message replacement

The result is that the old design is functional but harder to explain and harder to simplify while preserving the same workflows.

## New architecture

The new design removes `ExternalIssueFound` as a separate issue type.

Developers add their own non-validator errors by creating `IssueFound` directly.

Jivs still keeps a separation internally between:

* validator-generated `IssueFound`
* externally added `IssueFound`

That separation remains useful inside `ValidatableValueHost`. Externally added issues are retained in `ValidatableValueHost.externalIssuesFound`. Validator-generated issues continue through the normal validator-managed issue path.

Public retrieval remains unified through `getIssuesFound()`, which combines both sources into one list for the UI.

The transport model is also simplified. Server-to-client transfer no longer sends two collections. `toValidationPayload()` sends only the combined `IssueFound[]` list. `fromValidationPayload()` restores from that single list.

On the client side, imported server issues are not treated as client-local `externalIssuesFound`. Instead, `fromValidationPayload()` cleans each imported issue and places it into the normal issue path that feeds `getIssuesFound()`.

The most important protection is that every imported server issue is marked `displayOnly = true`. That allows the client to show server-returned issues without letting those imported issues block the client from running its own validation and attempting another server call through `ValidationState.doNotSave`.

Notes:

* There is now one public issue shape: `IssueFound`.
* Internal storage remains separated where that is architecturally useful.
* Public retrieval remains one combined list.
* Transport also becomes one combined list.
* Imported server issues are display-only on the client.

## New design workflows

### 1. Adding non-validator issues

```text
App code
  -> create IssueFound or IssueFound[]
  -> addIssueFound() / addIssuesFound()
  -> store in ValueHost.externalIssuesFound
  -> getIssuesFound() merges results
  -> UI displays one combined list
```

Notes:

* Developers no longer create `ExternalIssueFound`.
* Externally added issues still remain separate internally from validator-generated issues.
* The UI still reads one combined list.

### 2. Normal validation inside Jivs

```text
ValueHost
  -> Validators run
  -> create IssueFound[]
  -> validator-managed issue storage
  -> ValidationState.issuesFound
  -> derive isValid / doNotSave
  -> getIssuesFound() merges with external issues
```

Notes:

* The validator path remains intact.
* Validator-generated issues continue to drive validation state.
* Internal separation from externally added issues is preserved.

### 3. Server-side validation and save decisions

```text
Server request
  -> Jivs validate()
  -> validator IssueFound[]
  -> server adds IssueFound[] for non-validator errors
  -> save decision uses validation state and/or separate server error list
```

Notes:

* The server also uses only `IssueFound`.
* Internal separation can still be preserved on the server.
* The developer may still choose to gate save with separate server-side error tracking.

### 4. Server-to-client transport

```text
Server
  -> getIssuesFound()
  -> combined IssueFound[]
  -> toValidationPayload()
  -> send payload
Client
  -> fromValidationPayload()
  -> import combined IssueFound[]
```

Notes:

* There is only one transported issue list.
* The transport no longer preserves a second issue type.
* The client only needs the unified UI-facing issue shape.

### 5. Client-side import of server issues

```text
Imported IssueFound
  -> fromValidationPayload()
  -> displayOnly = true
  -> tryValidatorSwap() when applicable
  -> encode when needed
  -> add into issue path consumed by getIssuesFound()
  -> UI shows result
```

Notes:

* Payload cleanup belongs to `fromValidationPayload()`.
* Imported server issues are shown to the user but do not block client-side progression through `doNotSave`.
* The client-side `externalIssuesFound` concept remains for client-created issues, not for imported server payload.

### 6. Client-side local external issues

```text
Client-only failure
  -> create IssueFound
  -> addIssueFound()
  -> store in client external issue path
  -> getIssuesFound()
  -> UI displays result
```

Notes:

* This is for client-originated issues such as model-level or request-level failures.
* These are distinct from imported server payload issues.
* They still participate in the normal Jivs UI retrieval path.

### 7. Round-trip state preservation

```text
Page submit / regeneration
  -> issue state retained
  -> page rebuilt
  -> getIssuesFound()
  -> UI restored
```

Notes:

* State retention still matters.
* This applies to validator-generated issues and externally added issues.
* The new design keeps the unified UI retrieval model while preserving internal separation where needed.

## Types and classes to change

### `IssueFound`

* Keep as the single public issue shape.
* Allow developer-created issues to omit `errorCode`.
* Keep validator-created issues supplying `errorCode`.
* Ensure it can represent transported server issues and client-local external issues.

### `ExternalIssueFound`

* Remove from the main architecture.
* Replace public usage with `IssueFound`.
* Decide later whether to fully delete it or keep a temporary compatibility layer.

### `ValidationManager`

#### `addIssueFound(issueFound)`

* Public API for adding one developer-supplied issue into Jivs.
* Accepts `IssueFound`, not `ExternalIssueFound`.
* Does not run validator execution.
* Does not perform payload import cleanup.
* Does not perform `tryValidatorSwap()`.
* Routes the issue by `valueHostName`.
* When `valueHostName` matches a `ValueHost`, assign it there.
* Special case: when `valueHostName` is missing, route to `ModelValidatorsValueHost`.
* If `ModelValidatorsValueHost` does not exist, create it first.
* Before assigning to `ModelValidatorsValueHost`, update `issueFound.valueHostName` to `"*"`.
* Stores the issue in the external issue path for that target `ValueHost`.
* Ensures the added issue becomes visible through `getIssuesFound()`.
* Preserves issue state for page regeneration and round-trip UI restoration.

#### `addIssuesFound(issuesFound)`

* Public API for adding a list of developer-supplied issues into Jivs.
* Convenience method only.
* Loops through the list and calls `addIssueFound()` for each item.
* Does not add extra behavior beyond repeated `addIssueFound()` calls.

#### `toValidationPayload()`

* Creates the server-to-client payload.
* Uses the already combined issue list, not separate validator and external collections.
* Produces a single transported `IssueFound[]` shape.
* Includes all issues that the client UI should show.
* Does not preserve the old type distinction between validator-originated and externally added issues.
* Does not need to prepare issues for client validation status, because `fromValidationPayload()` handles import cleanup.

#### `fromValidationPayload(payload)`

* Client-side import pipeline for server-returned issues.
* Accepts the single transported `IssueFound[]` payload.
* Parses and validates payload shape.
* For each imported issue:

  * force `displayOnly = true`
  * apply encoding rules when needed
  * if `errorCode` can be used for swap, attempt `tryValidatorSwap()`
  * if swap does not happen, keep the imported issue
  * route by `valueHostName`
  * when `valueHostName` is missing, route to `ModelValidatorsValueHost`
  * if `ModelValidatorsValueHost` does not exist, create it first
  * before assigning to `ModelValidatorsValueHost`, update `issueFound.valueHostName` to `"*"`
* Adds the final issue into the issue path used by `getIssuesFound()`.
* Does not place imported server issues into the client-local `externalIssuesFound` bucket.
* Ensures imported issues are visible in the UI.
* Ensures imported issues do not block client-side progression through `ValidationState.doNotSave`.

#### Protected helper methods on `ValidationManager`

* Add a protected method whose job is to create `ModelValidatorsValueHost` if it does not already exist.
* Add a protected method whose job is to assign `"*"` as the `valueHostName` for issues routed to `ModelValidatorsValueHost`.
* These helpers are shared infrastructure for routing.
* They are intended for use by more than one method, not only `addIssueFound()`.

### `ValidatableValueHost`

* Keep separate internal storage for validator-generated issues and externally added issues.
* Continue exposing one combined list through `getIssuesFound()`.
* Support storing developer-added `IssueFound` in `externalIssuesFound`.

### `ModelValidatorsValueHost`

* Keep support for model-level externally added issues.
* Continue contributing those issues through the combined `getIssuesFound()` flow.
* Align with the new `IssueFound`-only design.

### `Validator`

* Keep current behavior where validator-generated issues always have an `errorCode`.
* Keep validator-based swap support for imported server issues.
* No change to the normal validator issue-generation path.

### `ValidationState`

* No structural redesign.
* Continue exposing the combined `issuesFound` list.
* Continue deriving `isValid` and `doNotSave` from validator-managed issues, with `displayOnly` protecting imported server issues from blocking client validation.

### Payload types

* Replace the old wrapper with a single transported `IssueFound[]` shape.
* Remove the dual-array payload concept.
* Keep payload import rules in `fromValidationPayload()`.

### State retention / instance state

* Preserve issue storage needed for page regeneration and round-trip UI restoration.
* Ensure the new issue flow still restores the same visible UI state.
* Keep this true for validator-generated issues and developer-added issues.

## Unit test cases

### `ValidationManager.addIssueFound()`

* Adds a field-level `IssueFound` to the matching `ValueHost.externalIssuesFound`.
* Adds a model-level `IssueFound` with no `valueHostName` by creating `ModelValidatorsValueHost` when missing.
* Adds a model-level `IssueFound` with no `valueHostName` by assigning `valueHostName = "*"` before storage.
* Reuses an existing `ModelValidatorsValueHost` instead of creating a second one.
* Preserves an explicitly assigned `valueHostName` when it already targets `"*"`.
* Keeps the added issue visible through `getIssuesFound()`.
* Keeps the added issue out of validator-managed issue storage.
* Preserves issue state for round-trip regeneration.

### `ValidationManager.addIssuesFound()`

* Adds each item by delegating to `addIssueFound()`.
* Supports a mixed list of field-level and model-level issues.
* Preserves list order in the resulting visible issue list when order matters.

### `ValidationManager.toValidationPayload()`

* Returns one combined transported `IssueFound[]` list.
* Includes validator-generated issues.
* Includes externally added issues.
* Does not emit separate validator and external collections.
* Includes model-level issues.
* Produces the same visible issue set as `getIssuesFound()`.

### `ValidationManager.fromValidationPayload()`

* Imports a payload containing one `IssueFound[]` list.
* Marks every imported issue `displayOnly = true`.
* Imports field-level issues into the issue path visible through `getIssuesFound()`.
* Imports model-level issues with no `valueHostName` by creating `ModelValidatorsValueHost` when missing.
* Imports model-level issues with no `valueHostName` by assigning `valueHostName = "*"` before storage.
* Reuses an existing `ModelValidatorsValueHost` instead of creating a second one.
* Applies encoding when required.
* Attempts swap when `errorCode` is present.
* Keeps the original imported issue when swap does not occur.
* Does not place imported server issues into the client-local external issue bucket.
* Ensures imported issues are visible through `getIssuesFound()`.
* Ensures imported issues do not cause `ValidationState.doNotSave` to block client-side progression.

### Swap behavior during `fromValidationPayload()`

* Swaps an imported issue when `errorCode` matches a local validator.
* Keeps `displayOnly = true` on the swapped issue.
* Keeps the original imported issue when `errorCode` has no validator match.
* Keeps the original imported issue when `errorCode` is missing.
* Preserves routing after swap so the final issue is assigned to the correct target.

### `ValidatableValueHost`

* Keeps validator-generated issues and externally added issues in separate internal storage.
* `getIssuesFound()` returns validator-generated issues only when no external issues exist.
* `getIssuesFound()` returns externally added issues only when no validator issues exist.
* `getIssuesFound()` returns a combined list when both sources exist.
* Externally added issues remain visible without becoming validator-managed issues.

### `ModelValidatorsValueHost`

* Contributes model-level externally added issues through the combined `getIssuesFound()` flow.
* Supports multiple model-level issues.
* Continues to work when created lazily by `ValidationManager`.

### `ValidationState`

* Validator-generated issues still affect `isValid`.
* Validator-generated issues still affect `doNotSave`.
* Imported server issues with `displayOnly = true` remain visible but do not force invalid client-side save state.
* Client-local externally added issues follow the intended status behavior for their storage path.

### Round-trip state retention

* Developer-added field-level issues survive state save and restore.
* Developer-added model-level issues survive state save and restore.
* Imported server issues survive state save and restore in the same visible form.
* Combined visible issue list after restore matches the list before restore.

## End-user documentation notes

### Add your own errors

* Create `IssueFound` and add it through `addIssueFound()` or `addIssuesFound()`.
* Use `valueHostName` to attach the issue to a specific field.
* Omit `valueHostName` to create a model-level issue. Jivs will route it to the model validators host.
* Your added issues will appear through `getIssuesFound()` along with validator-generated issues.
* Use this for errors outside normal validation, such as save failures, service failures, or business logic errors.

### Use Jivs on both server and client

* Let Jivs validate on the client before submission.
* Let Jivs validate again on the server before saving.
* If the server needs to return issues to the client, send them using `toValidationPayload()`.
* On the client, import them using `fromValidationPayload()`.
* The client will show those imported issues through the normal Jivs UI flow.

### What `fromValidationPayload()` does for you

* Imports the server-returned `IssueFound[]` payload.
* Marks every imported issue as `displayOnly = true`.
* Tries client-side issue replacement when `errorCode` supports it.
* Keeps imported issues visible without letting them block new client-side validation attempts.

### Recommended mental model

* Use `addIssueFound()` for your own local issues.
* Use `toValidationPayload()` and `fromValidationPayload()` to move Jivs issues from server to client.
* Use `getIssuesFound()` to retrieve the combined list for display.
