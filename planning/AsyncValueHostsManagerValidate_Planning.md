# Async ValueHostsManager Validation Planning

## Purpose and status

This document explores how a full `ValueHostsManager` validation can complete asynchronous validators before reporting its final result, while preserving the field-level validation experience during editing. It supports the submission work in [Submission_planning.md](./Submission_planning.md), but focuses on the validation engine rather than the rest of the submission workflow.

This is a design document for the unfinished manager-level completion work. The async validator itself is implemented; see [AsyncValidator_Implementation.md](./AsyncValidator_Implementation.md) for its API and field-host behavior. Code excerpts labeled **current** describe the repository; illustrations labeled **candidate** are sketches for discussion, not implementation instructions. Decisions recorded below are settled; unresolved choices are explicitly marked open.

The immediate goal is to make *host completion* concrete, then select and verify a manager design against current behavior and the cases below. This document does not itself specify the already-implemented `AsyncValidator`.

Peter separated the larger effort into three projects:

1. Design and implement the first-class async validator; see [AsyncValidator_Implementation.md](./AsyncValidator_Implementation.md).
2. Make `ValueHostsManager.validate()` asynchronous and have it invoke the completion operation internally, including the agreed final notification behavior.
3. Design the submission workflows.

This document focuses on project 2. Failure behavior and completion handling connect the validator and manager projects and must remain consistent.

## The proposed direction

Peter's initial idea is:

1. A validatable ValueHost's `validate()` can return its usual result or `null` synchronously, or a Promise when validation needs async work:

   ```ts
   validate(options?: ValidateOptions):
       ValueHostValidateResult | null | Promise<ValueHostValidateResult>;
   ```

2. `ValueHostsManager.validate()` collects the host promises and waits for their completion before producing its final result. Peter suggested using `Promise.allSettled()` so the manager can account for every host even if one fails.
3. Field validation during editing can still start async work in the background. The presence of async processing continues to block submission.
4. A manager validation should provide a completion notification when its work completes. Whether that is the only manager notification for the invocation, and how it relates to field notifications, remains to be specified.

**Decision (Q07):** The **manager** method always returns a Promise, including when all participating hosts are synchronous. The host return contract and how the manager observes processed host completion remain open. The design must also address failures, callbacks, and changes made while waiting; returning a Promise alone does not establish those guarantees.

## Current behavior

### One host starts its validators

In [`ValidatorsValueHostBase.validate()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts), the host creates one result object for this validation call and invokes the validators:

```ts
// Current code, excerpted from ValidatorsValueHostBase.validate().
const result: ValueHostValidateResult = {
    status: ValidationStatus.Undetermined,
    issuesFound: null
};
```

```ts
// Current code, excerpted from the validator loop.
for (let i = 0; !stop && i < validators.length; i++) {
    const iv = validators[i];
    const potentialIVR = iv.validate(options);
    // promises will update the results later
    // All other validators in this loop will still finish
    // by updating the state. The state is just missing the results
    // from this validator. When this completes, it updates the state again.
    if (potentialIVR instanceof Promise) {
        processPromise(potentialIVR);
        continue;
    }
    // synchronous (normal) processing
    const fieldValResult = potentialIVR as ValidatorValidateResult;
    if (fieldValResult.skipped)
        continue;
```

Synchronous validators contribute to `result` during the loop. Each asynchronous validator is registered with `processPromise()`; the loop continues without waiting for it.

### The host returns before async work finishes

The relevant current return is:

```ts
// Current code, after the validator loop.
adjustCorrectedFlag();
if (updateInstanceStateWithResult(result))
    self.invokeOnValueHostValidationStateChanged(options);
// when the result hasn't changed from the start, report null as there were no issues found
return result.status !== ValidationStatus.Undetermined || result.issuesFound !== null || result.pending ?
    result : null;
```

**Correction to our earlier assumption:** when async work is pending, `result.pending` is present, so this code returns the result object, not `null`, even if the status is still `Undetermined`. A `null` result is possible when there is no reportable result and no pending work.

The returned object is not yet a completed result. Its [`pending`](../packages/jivs-engine/src/Interfaces/Validation.ts) array contains the promises returned by the host's validators. The same `result` object is held by the closures that process those promises later.

### The pending list is drawn down

The core of the current completion logic is:

```ts
// Current code, excerpted from processPromise().
function completeThePromise(finish: () => void): void {
    if (result.pending && result.pending.includes(promise)) {
        const index = result.pending.indexOf(promise);

        // Always settle this run's local pending list, but only apply a result
        // when this is still the host's current validation generation.
        result.pending.splice(index, 1);
        if (result.pending.length === 0)
            delete result.pending;

        if (runGeneration === self._validationGeneration)
            finish();
    }
}
```

The handler then calls `finish()` to apply the particular result or handle its failure. For example, the current `NoMatch` path adds an issue, updates host state, and notifies listeners when state changes. Other outcomes use `deleteAsyncProcessFlag()`, which clears the state flag only after no promises remain; current async completion paths notify when that state update changes the host.

Separately, while the host's `asyncProcessing` state is true, its [`doNotSave`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) is true. That is how background field validation can prevent saving while it runs.

### The manager takes an immediate snapshot

The current [`ValueHostsManager.validate()`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts) discards each host return value:

```ts
// Current code, excerpted from ValueHostsManager.validate().
for (const vh of this.validatableValueHost())
{
    // preliminary is looking for value hosts that have yet to be validated
    // Within FieldValueHost, it will also ignore the required validators.
    if (options.preliminary &&
        vh.validationStatus !== ValidationStatus.NotAttempted && vh.validationStatus !== ValidationStatus.NeedsValidation)
        continue;
    vh.validate(options);   // the result is also registered in the vh and retrieved when building ValidationState
}
const snapshot = this.createValidationState(options);
options = { ...options, disableValidationStateChangedDelay: true };
this.notifyValidationStateChanged(snapshot, options);
return snapshot;
```

Therefore the snapshot is immediate. It can say `asyncProcessing` and `doNotSave` are true; it is not the eventual result of the pending validators.

## What “host completion” means

Consider a host with one synchronous validator and two asynchronous validators, A and B:

1. `host.validate()` evaluates the synchronous validator and starts A and B.
2. It creates a partial result with both promises in `result.pending`, updates host state to show async processing, and currently returns that result.
3. A finishes. Its promise is removed, and A's result is processed. B is still pending.
4. B finishes. Its promise is removed, `result.pending` is deleted, and B's result is processed.
5. **Only after step 4's processing finishes** can a completion for this host run report the finished result to the manager.

The distinction is between:

- **A validator promise settling:** one validator has an answer or failure.
- **The host processing that settlement:** updating its aggregate result and state, and making the appropriate notifications.
- **The host run completing:** all validators started by that host call have settled *and their settlements have been processed*. This is what the manager needs to wait for.

Removing the last item from `pending` is a useful signal, but the current function removes it **before** calling `finish()`. Signaling the manager immediately when the array becomes empty would therefore be too early unless completion is signaled after `finish()` returns. Completion also has to account for exceptions or failures while processing.

An illustrative timeline:

```mermaid
sequenceDiagram
    participant M as ValueHostsManager
    participant H as One ValueHost
    participant A as Async validator A
    participant B as Async validator B
    M->>H: validate()
    H->>A: Start validation
    H->>B: Start validation
    Note over H: Partial result; A and B pending
    H-->>M: Candidate: Promise for host completion
    A-->>H: Settles
    Note over H: Remove A; process its outcome
    B-->>H: Settles
    Note over H: Remove B; process its outcome
    H-->>M: Resolve only after processing B
    Note over M: Wait for other hosts, then make final snapshot
```

This describes one host run. If another validation or relevant edit supersedes it, the old run's Promise still settles, but its result is not applied to current host state.

## Candidates to evaluate

PETER's NOTE: Our API can involve breaking changes because this code is not in use elsewhere.

The manager API is now the same for both candidates: `validate(options?): Promise<ValidationState>`. The candidates differ in **how the manager finds out that each host run is complete**. Candidate C was previously described as if it were a competing solution; it was actually a choice about the manager return type and is now incorporated into both candidates.

### Candidate A: host `validate()` returns its completion Promise

This follows Peter's proposal end-to-end:

1. A host returns `ValueHostValidateResult | null` immediately if its validators complete synchronously. When it starts async validators, it returns a Promise representing the completed **host run**.
2. The manager's `validate()` always returns `Promise<ValidationState>`. It calls each applicable host, collects the returned host promises, waits for all of them to settle, handles any failures, and then creates and returns the final manager snapshot.
3. During editing, field-level code still calls host `validate()` without needing to wait before returning control to the UI. The host updates its state and notifies listeners as async work progresses. An ignored rejecting Promise must not become an unhandled rejection.
4. Submission awaits the manager Promise before using `doNotSave`.

The proposed APIs, subject to defining null and failure semantics, would look like:

```ts
// Candidate A: proposed public signatures, not current code.
// On a host:
validate(options?: ValidateOptions):
    ValueHostValidateResult | null | Promise<ValueHostValidateResult>;

// On the manager:
validate(options?: ValidateOptions): Promise<ValidationState>;
```

```ts
// Candidate A: conceptual submission caller.
const validationState = await vhm.validate();
if (validationState.doNotSave)
    return;
// Continue the submission.
```

The host-completion Promise should represent **processed** outcomes, not simply the raw validator promises. The code must also define what the Promise resolves to if the completed run has no reportable result, is superseded, or fails. The proposed host type allows synchronous `null` but not `Promise<null>`; we should verify that distinction before adopting it.

Benefits to investigate: an explicit completion contract and direct manager aggregation. Costs: the changed host return type, handling a Promise that field-level callers may ignore, and coordinating callbacks. Breaking API changes are acceptable per Peter's note; existing in-repository callers still need to be updated consistently.

### Candidate B: host returns an immediate result and exposes completion separately

1. A host continues returning its immediate `ValueHostValidateResult | null`, including a partial result when async work starts.
2. A separate host-run completion mechanism—for example, a completion Promise associated with that result—tells the manager when the host has processed all of the run's outcomes. The mechanism and API shape are not yet designed.
3. The manager still exposes `validate(options?): Promise<ValidationState>`. It collects the separate host-completion signals, waits for them to settle, handles failures, and returns the final snapshot.
4. Editing code can continue using the immediate host result, while submission awaits manager validation.

This preserves a synchronous host return but introduces a second completion contract. The existing `result.pending` array alone is not yet that contract: it contains validator promises, is modified as work finishes, and the host separately processes their settlements. A candidate using it must show exactly when processing completes and how failures and superseded runs are represented.

#### Peter's new variation: manager collects existing pending promises

Peter suggests retaining the current host `validate()` and its return type, and adding a manager-level async operation that gathers current pending work. His intuition is that this completion operation should live within `ValueHostsManager.validate()`, which would still return a Promise.

The current data has an important distinction:

- The **return value** of `ValueHost.validate()` can contain `ValueHostValidateResult.pending`, an array of validator promises.
- A host's **`currentValidationState`** exposes the boolean `asyncProcessing`, but not those promises. The persisted instance state likewise stores the flag, not the pending array.

Consequently, a manager cannot currently call a separate `allCompleted()` later and scrape promises from `ValueHostValidationState`. But the manager **can capture the pending array directly from each host result as it calls `validate()`**, because the current manager already makes those calls. This would require changing the manager's `validate()`, but not necessarily the host's signature or the field-editing call sites.

```ts
// Candidate sketch, not implementation code:
// Inside the manager's existing host loop, preserving its selection logic.
const result = vh.validate(options);
if (result?.pending)
    pendingValidators.push(...result.pending);
```

The manager could copy these promises while running the loop, await `Promise.allSettled(pendingValidators)`, inspect failures, and then create its final state. A separate internal helper could perform the wait; the public manager `validate()` would remain the single entry point that starts validation and returns `Promise<ValidationState>`. No separate public method is required unless another use case needs one. `AsyncValidator` skips its handler before invocation when `preliminary` or `duringEdit` is true; standard `Validator` conditions can still return Promises and remain supported by the host.

This approach is worth testing against the actual code rather than rejecting it because the promises are “raw”:

1. `processPromise()` attaches a host processing handler to each validator promise before the host returns that promise in `result.pending`.
2. The manager would attach its `allSettled` handlers afterward. For the current handlers' synchronous `finish()` processing, Promise reaction ordering means the host handler runs first for that settlement.
3. This suggests the manager's wait can observe the state **after ordinary host processing**, without changing the host return type. It still needs targeted tests for successful and rejected validators.
4. There is a limitation: `processPromise()` does not retain or return the Promise produced by its own `.then(...).catch(...)`. If host settlement processing itself throws, the original validator Promise's settlement does not guarantee that the host's subsequent catch has finished. `allSettled()` on the original promises may therefore run before that processing-error path completes. Capturing the processing promises or otherwise propagating them would require an internal change, even if the public host `validate()` signature stays unchanged. Async observer exceptions are now caught and logged by `notifyAsyncStateChanged()`, so they no longer cause this particular processing failure; other state/result-processing failures still need a defined path.

Capturing the promises returned by **this manager validation run** is also different from finding all work already pending from earlier edits. The earlier edit's returned result may no longer be available to the manager. Peter suggested that submission should stop when async processing was already present, and the user should submit again after it completes; this is a candidate policy, not yet a recorded Q10 decision. If adopted, a manager-run collector need not join those earlier promises for submission. Handling an existing pending run for other uses of a standalone `allCompleted()` would still need a separately exposed run registry or completion signal.

Other unresolved concerns remain: manager completion must await host result processing, manager-level failure/throw policy needs definition, concurrent changes during the manager's own wait need a safe completion result, and the manager versus field notification policy must be defined. None of these is solved merely by collecting promises.

### Manager aggregation common to both candidates

`Promise.allSettled()` can wait until all collected promises settle, including if some reject. It does **not** by itself guarantee that the host's follow-up processing chain has completed. It also does not determine the manager's policy for thrown/processing errors. A failure reported through `failedToResolve` or an `AsyncValidator` rejection is recorded by the host and makes its final state block saving; the manager must not turn that state into save-allowed. See [AsyncValidator_Implementation.md](./AsyncValidator_Implementation.md) for field-level failure semantics.

The following is intentionally pseudocode; `reportValidationFailure` is not an existing API and its behavior has not been decided:

```ts
// Candidate illustration only; host collection and callback coordination omitted.
const outcomes = await Promise.allSettled(hostCompletionPromises);
if (outcomes.some(outcome => outcome.status === 'rejected')) {
    return reportValidationFailure(outcomes); // policy and return/throw contract TBD
}
const snapshot = this.createValidationState(options);
this.notifyValidationStateChanged(snapshot, options);
return snapshot;
```

This sketch shows the API relationship, not a proven implementation. In particular, callback timing, host-level failure handling, and edits during the wait still need design.

## Cases a candidate must satisfy

| Case | What needs to be established |
| --- | --- |
| No async validators | Preserve the intended synchronous field behavior; define manager return and callback timing. |
| One pending validator | Manager completion occurs after its host has processed the outcome. |
| Multiple pending validators on one host | Host completion waits for all of that run's validators, regardless of completion order. |
| Pending validators on multiple hosts | Manager completion waits for every participating host, not just the first one. |
| Async `Match`, `NoMatch`, warning, or `Undetermined` | Confirm the manager's final result reflects the host's implemented status and blocking behavior for each outcome. |
| Validator rejects or processing throws | `AsyncValidator` operational failures and rejected handler Promises are recorded as blocking host failures. Define how the manager waits for all started work and how it reports other host-processing failures. |
| Disabled, skipped, preliminary, and grouped validation | Only intended hosts and validators participate; existing option behavior remains explicit. |
| `skipCallback` and notification timing | Respect the option and define field versus manager callbacks, including a single manager completion notification if that is the chosen guarantee. |
| Background field validation | Calling from an edit still updates state and UI without requiring the event handler to wait; any rejection is handled. |
| Value changes or a new run starts while waiting | Old results must not authorize saving unvalidated or different values. Decide how the original completion reports a superseded run. |
| Existing consumers | Public types, synchronous result consumers, wrappers, examples, documentation, and tests are migrated or compatibility is otherwise addressed. |

`Promise.allSettled()` addresses the earlier concern that `Promise.all()` reports a rejection before the remaining work has settled. Failure reporting and cleanup still need an explicit policy.

## Field-level concerns: current status

The following items were raised during the initial host review. They are no longer open host bugs; their fixes are in [`ValidatorsValueHostBase`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) and covered by its tests. The manager design must build on these semantics rather than restating the old behavior.

1. **Async warning status — fixed.** An async `NoMatch` warning is added as an issue with `doNotSave: false`. If no other validator has made the result invalid, the host status is `Valid`; a warning does not overwrite an existing invalid result.
2. **Completion notification — fixed at host level.** When settlement changes host state, including clearing `asyncProcessing` after `Match`, `Undetermined`, skipped completion, or failure, the host invokes its async-safe notification helper. Synchronous observer exceptions during an async notification are logged and do not become validator failures or trigger a second notification. A callback deferred by the manager's debouncer runs later and is not caught by this host helper.
3. **Stale run — fixed at host level.** A host validation generation is incremented by a new validation, relevant value change, validation clear, and disposal. A settled run always drains its own local pending list, but only the current generation may update host state. This prevents an old run from overwriting current validation state. It does not by itself define what a manager Promise should report if an edit supersedes a participating host while the manager is waiting.
4. **Preliminary validation — implemented for `AsyncValidator`.** It returns a skipped result before invoking its handler. Standard `Validator` can still wrap a Promise-returning condition, so preliminary mode does not imply that every legacy standard-validator Promise is avoided.

## Manager notification question

One manager validation can currently trigger the manager callback at host-start/state changes, at the manager's existing post-loop notification, and again as host Promises complete. Debouncing may combine calls but does not guarantee exactly one callback after all work. Here, a **completion notification** means an `onValidationStateChanged` callback attributable to a manager validation invocation, after all participating host work has been processed; the Promise resolving with the final snapshot is separate.

Still to decide: should that invocation produce only one manager-level callback, or may it produce intermediate manager notifications plus a final completion callback? Field-level notifications should continue to update individual displays, and unrelated edit notifications during the wait should not be suppressed. `skipCallback` is not sufficient by itself because it suppresses both field and manager notifications.

### Preliminary validation and async work

`preliminary: true` skips the implemented [`AsyncValidator`](../packages/jivs-engine/src/Validation/AsyncValidator.ts) before its handler is invoked. Since this behavior is an accepted decision, the [`ValidateOptions.preliminary`](../packages/jivs-engine/src/Interfaces/Validation.ts) documentation should describe it. The `duringEdit` documentation should also note that `AsyncValidator` is skipped in that mode.

The standard [`Validator.validate()`](../packages/jivs-engine/src/Validation/Validator.ts) evaluates its condition, which can still return a Promise. Thus a Promise-returning standard condition may already have started work during preliminary validation; the skip-before-handler guarantee applies to `AsyncValidator`, not to those legacy conditions.

A final submission must run applicable `AsyncValidator`s even if they were skipped during preliminary validation. Initialization and other fire-and-forget call sites still need to handle the manager's Promise and any failures appropriately.

### Previously reported field-level bugs — resolved

The async warning status, missing completion notifications, and stale-run concerns are resolved in the current host implementation as summarized under [Field-level concerns](#field-level-concerns-current-status). They should not be carried forward as bugs for the manager implementation. New manager-level tests should still verify that its final snapshot reflects those host outcomes.

## Questions for discussion

### Q07 — Manager return contract

Should full-manager validation return a Promise in every case, or return an immediate `ValidationState` when all participating hosts finish synchronously and a Promise only when needed?

Promise in every case. Let's not make this more complex:
```ts
    const validationState = vhm.validate();
    if (validationState.doNotSave) {
        return;
    }
```
It should just be:
```ts
    vhm.validate().then((validationState)=>{
        if (!validationState.doNotSave)
        {
            // continue saving.
        }
    })
```

**Decision recorded:** Manager `validate()` returns a Promise in every case. The Promise method is `.then(...)`, rather than `.resolve(...)`; `await vhm.validate()` is an equivalent caller style.

### Q08 — Meaning of completion notification

For a manager validation run, should there be exactly one `onValidationStateChanged` callback after all participating hosts have finished, or may there also be intermediate callbacks during that invocation? Field callbacks should still be able to update individual displays, and independent edits during the wait may generate their own notifications.

Here, "completion notification" means a manager callback attributable to that validation invocation, after participating host outcomes have been processed. It is separate from the manager Promise resolving with the final snapshot. The desired number of callbacks and how to distinguish unrelated edit notifications remain open.

### Q09 — Failure of async validation

When an async validator rejects, what should callers and the UI observe? In particular, how should submission be prevented, how should the failure be reported, and should the manager wait for other started validators before reporting it?

**Field-level behavior resolved:** `AsyncValidator` handlers should report operational failures by resolving with `failedToResolve`. The validator logs the error; the host records the handler identity as failed, and `doNotSave` remains true without displaying a validation issue. A rejected handler Promise is treated as a contract failure: `AsyncValidator` wraps it in `CodingError`, and the host logs it and records the same blocking failure identity. These outcomes do not escape the host's async settlement path as a successful validation. See [AsyncValidator_Implementation.md](./AsyncValidator_Implementation.md#4-keep-a-failed-request-from-allowing-save).

**Manager-level policy still open:** The manager must wait for all started work and return a final blocking snapshot for failures recorded by the host. It remains to decide whether unrelated failures in host result-processing should reject `ValueHostsManager.validate()` or be represented in a `ValidationState`, and how those failures are surfaced to the caller.

### Q10 — Changes while waiting

If a value or a relevant validation configuration changes while manager validation is waiting, should that run stop as superseded, automatically validate again, or use another explicitly defined behavior? In every case, the workflow must not save based on stale validation.

These questions are starting points, not assumptions that the listed choices are exhaustive. We can work through the actual host implementation and alternatives before deciding.

Peter's earlier note raises two cases to distinguish: a manager-owned validation attempt might retry internally after a value change, while a submission attempted during async work from user interactivity might stop immediately and require the user to submit again after completion. The latter is a candidate policy, not a recorded Q10 decision. Interactive overlapping runs still need a defined outcome so old results cannot be assigned to new values.

### Q11 — Async validators during preliminary validation

The implemented behavior skips all `AsyncValidator`s before their handlers are invoked when `preliminary` or `duringEdit` is true; there is no per-validator selection option. This is separate from ensuring final submission runs applicable async validators.

**Decision recorded and implemented:** Skip `AsyncValidator` during preliminary and during-edit validation. Normal submission validation still runs applicable async validators. Promise-returning legacy standard conditions are not covered by this skip.
