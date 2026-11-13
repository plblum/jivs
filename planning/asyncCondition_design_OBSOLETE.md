# Async Validation Design

## Purpose and status

This document explores how a full `ValueHostsManager` validation can complete asynchronous validators before reporting its final result, while preserving the field-level validation experience during editing. It supports the submission work in [Submission_planning.md](./Submission_planning.md), but focuses on the validation engine rather than the rest of the submission workflow.

This is a brainstorming document. Neither Peter's proposal nor the alternatives below are decisions yet. Code excerpts labeled **current** are from the repository; illustrations labeled **candidate** are sketches for discussion, not implementation instructions.

The immediate goal is to make *host completion* concrete, then verify candidate designs against the current behavior and the cases below. We are not yet implementing changes.

Peter separated the larger effort into three projects:

1. Design a first-class async validator and builder support; see [AsyncValidator_design.md](./AsyncValidator_design.md).
2. Make `ValueHostsManager.validate()` asynchronous and have it invoke the completion operation internally, including the agreed final notification behavior.
3. Design the submission workflows.

The current discussion focuses on project 1 before returning to project 2. Failure behavior and completion handling connect the first two projects and must be designed consistently.

## The proposed direction

Peter's initial idea is:

1. A validatable ValueHost's `validate()` can return its usual result or `null` synchronously, or a Promise when validation needs async work:

   ```ts
   validate(options?: ValidateOptions):
       ValueHostValidateResult | null | Promise<ValueHostValidateResult>;
   ```

2. `ValueHostsManager.validate()` collects the host promises and waits for their completion before producing its final result. Peter suggested using `Promise.allSettled()` so the manager can account for every host even if one fails.
3. Field validation during editing can still start async work in the background. The presence of async processing continues to block submission.
4. A manager validation should provide a single completion notification when its work completes. The exact relationship between that notification and other field or manager notifications remains to be specified.

Peter has since decided that the **manager** method should always return a Promise, including when all hosts are synchronous. The host return contract remains under discussion. We need to demonstrate that the overall design handles completion, failures, callbacks, and changes made while waiting; returning a Promise alone does not establish those guarantees.

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
    // remove the promise from result.Pending.
    // We use result.Pending == null to mean no async processes remain.
    // If Pending is null already, an external action has abandoned the current validation run
    if (result.pending && result.pending.includes(promise)) {
        const index = result.pending.indexOf(promise);

        result.pending.splice(index, 1);
        if (result.pending.length === 0)
            delete result.pending;

        finish();
    }
}
```

The handler then calls `finish()` to apply the particular result or handle its failure. For example, the current `NoMatch` path adds an issue, updates host state, and may notify listeners. Other outcomes use `deleteAsyncProcessFlag()`, which clears the state flag only after no promises remain.

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

This describes one host run. It does not yet resolve what happens if another validation or an edit supersedes that run.

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

The manager could copy these promises while running the loop, await `Promise.allSettled(pendingValidators)`, inspect failures, and then create its final state. A separate internal helper could perform the wait; the public manager `validate()` would remain the single entry point that starts validation and returns `Promise<ValidationState>`. No separate public method is required unless another use case needs one.

This approach is worth testing against the actual code rather than rejecting it because the promises are “raw”:

1. `processPromise()` attaches a host processing handler to each validator promise before the host returns that promise in `result.pending`.
2. The manager would attach its `allSettled` handlers afterward. For the current handlers' synchronous `finish()` processing, Promise reaction ordering means the host handler runs first for that settlement.
3. This suggests the manager's wait can observe the state **after ordinary host processing**, without changing the host return type. We should prove this for both successful and rejected validators with targeted tests during implementation.
4. There is a limitation: `processPromise()` does not retain or return the Promise produced by its own `.then(...)`. If the host's settlement handler itself throws—for example, during a callback—the original validator Promise can still be fulfilled while the handler's separate Promise rejects. `allSettled()` on the original promises would not report that processing failure. Capturing the processing promises or otherwise propagating those failures would require an internal change, even if the public host `validate()` signature stays unchanged.

Capturing the promises returned by **this manager validation run** is also different from finding all work already pending from earlier edits. The earlier edit's returned result may no longer be available to the manager. Peter's current Q10 direction is that submission stops when async processing was already present and the user submits again later; if we keep that policy, a manager-run collector need not join those earlier promises for submission. Handling an existing pending run for other uses of a standalone `allCompleted()` would still need a separately exposed run registry or completion signal.

Other unresolved concerns remain: a `NoMatch` warning and a `Match` must update the host correctly before the final snapshot; async rejection must not become a successful save; concurrent edits must not authorize stale values; and the manager and field notification policies must be defined. None of these is solved merely by collecting promises. They also do not establish that the overall approach cannot work.

### Manager aggregation common to both candidates

`Promise.allSettled()` can wait until all collected host-completion promises settle, including if some reject. It does **not** make a rejected host successful: the manager must inspect the settled results, report failures according to the agreed policy, and avoid returning a save-allowed result for incomplete validation.

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
| Async `Match`, `NoMatch`, warning, or `Undetermined` | Final result, blocking behavior, and field presentation are correct for each outcome. |
| Validator rejects or processing throws | Failure is visible; it must not become a successful save by default. Other started work must be accounted for. |
| Disabled, skipped, preliminary, and grouped validation | Only intended hosts and validators participate; existing option behavior remains explicit. |
| `skipCallback` and notification timing | Respect the option and define field versus manager callbacks, including a single manager completion notification if that is the chosen guarantee. |
| Background field validation | Calling from an edit still updates state and UI without requiring the event handler to wait; any rejection is handled. |
| Value changes or a new run starts while waiting | Old results must not authorize saving unvalidated or different values. Decide how the original completion reports a superseded run. |
| Existing consumers | Public types, synchronous result consumers, wrappers, examples, documentation, and tests are migrated or compatibility is otherwise addressed. |

`Promise.allSettled()` addresses the earlier concern that `Promise.all()` reports a rejection before the remaining work has settled. Failure reporting and cleanup still need an explicit policy.

## Current behavior requiring closer review

- In the current async `NoMatch` branch, the host sets `result.status = ValidationStatus.Invalid` directly. The synchronous path distinguishes warning severity and makes warnings non-blocking. Async warnings need to be evaluated against the intended behavior.
    PETER HERE: Are we talking about this code not supporting Warning?:
    ```ts
    completeThePromise(() => {
        // the only way we modify the issues, validation result, or ValueHostInstanceState
        if (ivr.conditionEvaluateResult === ConditionEvaluateResult.NoMatch) {
            result.status = ValidationStatus.Invalid;
            if (!result.issuesFound)
                result.issuesFound = [];
            result.issuesFound.push(ivr.issueFound!);
            if (updateInstanceStateWithResult(result))
                self.invokeOnValueHostValidationStateChanged(options);
        }
        else
            deleteAsyncProcessFlag();
    });

    ```

- When async work finishes without `NoMatch`, the current path clears `asyncProcessing` but does not invoke `invokeOnValueHostValidationStateChanged()` there. We need to determine how listeners learn that pending work has ended and how the final host status is established.

    PETER HERE: In the above snippet for completeThePromise, it is invoked. What am I missing?

- The pending list belongs to the local `result` for a run. The current source comment says clearing validation state abandons pending work, but the visible list is in that local result. We should trace and verify the actual invalidation behavior before relying on that comment for overlapping edits or runs.

    PETER HERE: Point out the code.

- The manager's current host notifications and its own explicit final notification can both reach `onValidationStateChanged`. Debouncing reduces calls, but it is not an explicit once-per-run completion guarantee. Also, independent edits while a manager run is pending may legitimately produce their own notifications; the scope of any single-callback promise must be precise.

    PETER HERE: Unclear. Restate the technical problem.

- `ValueHostsManager.valuesInitialized()` calls manager validation without awaiting it. Other consumers use its immediate return value, including examples and the Angular wrapper. A changed return type has consequences beyond tests, even if an all-synchronous run still returns immediately.

    PETER HERE: This inspired my chat comment about skipping async validation during preliminary: true.

### Responses to Peter's code questions

**Async warnings.** Yes, the `NoMatch` code Peter quoted is the branch in question. It unconditionally assigns `ValidationStatus.Invalid` for any async `NoMatch`; unlike the synchronous path, it does not branch on `ivr.issueFound.severity`. The issue itself is created by `Validator` with its warning severity and `doNotSave = false`, so it is important to distinguish the host's `Invalid` status from whether that issue actually blocks saving. The mismatch is not a claim that the warning disappears or necessarily sets `doNotSave = true`; its resulting state and UI behavior need to be verified.

Peter here: this is a formal bug and should be filed in this file written up that way.

**The callback in the quoted branch.** Peter is right that the `NoMatch` path calls `invokeOnValueHostValidationStateChanged(options)` when the state changes. The concern applies to the **other** branch:

```ts
// Current code, excerpted from processPromise().
if (ivr.conditionEvaluateResult === ConditionEvaluateResult.NoMatch) {
    // ... update result ...
    if (updateInstanceStateWithResult(result))
        self.invokeOnValueHostValidationStateChanged(options);
}
else
    deleteAsyncProcessFlag();
```

In the `else` path, including an async `Match`, `deleteAsyncProcessFlag()` clears the flag when the last promise finishes but does not itself call that notification method. Likewise, the rejection path clears the flag and logs without calling that method. Other notifications might have occurred for other reasons; the narrower point is that these paths do not directly notify through this method when the flag is cleared.

Peter here: this is a formal bug and should be filed in this file written up that way.

**The pending-list comment.** [`clearValidationDataFromInstanceState()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) contains:

```ts
// Current code, excerpted from clearValidationDataFromInstanceState().
delete stateToUpdate.asyncProcessing;   // any active promises here will finish except will not update state due to Pending = null or at least lacking the same promise instance in this array
```

But `completeThePromise()` checks `result.pending` on the **local result object**, not `stateToUpdate.asyncProcessing`. Deleting the state flag does not, by itself, delete that local array. We should trace all relevant clear/change paths and reproduce the behavior before concluding whether an old run can update state after a newer action.

**The manager callback issue.** A host invokes [`invokeOnValueHostValidationStateChanged()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) on state changes. That method calls both the manager's `notifyValidationStateChanged()` and the field-level callback. Meanwhile, [`ValueHostsManager.validate()`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts) explicitly calls `notifyValidationStateChanged()` after its host loop. A host whose async result changes state can call it again later. Thus a single manager validation invocation can cause multiple calls to the manager notification mechanism: host start, manager's own snapshot, and host async completion. The existing debouncer can merge some calls, but timing and its configuration affect that; it is not the same as a guaranteed single final notification.

For discussion, a **completion notification** means the final call to `onValidationStateChanged` attributable to the manager validation invocation, after its participating hosts have completed. It is separate from the Promise resolving with the final snapshot. We still need to decide whether there should be intermediate form-level notifications for that same invocation, and how to keep unrelated edit notifications working while the manager is waiting. The existing `skipCallback` option suppresses both field and manager notifications when used by a host, so it cannot by itself preserve field callbacks while suppressing only manager callbacks.

### Preliminary validation and async work

Peter has decided that `preliminary: true` will skip async validators before their handlers are invoked, particularly when `valuesInitialized()` performs preliminary validation. The current [`ValidateOptions.preliminary`](../packages/jivs-engine/src/Interfaces/Validation.ts) describes initial validation and avoiding premature required-field messages; it does not currently specify this behavior.

With the current implementation, [`Validator.validate()`](../packages/jivs-engine/src/Validation/Validator.ts) calls `condition.evaluate()` and then checks whether the returned value is a Promise. At that point any request may already be underway. Ignoring the Promise afterward would not prevent that work. The [async validator design](./AsyncValidator_design.md) provides an identifiable validator that can be skipped before invocation.

A final submission must run applicable validators even if they were skipped during preliminary validation. Initialization and other fire-and-forget call sites still need to handle the manager's Promise and any failures appropriately.

### Bugs identified for this work

Peter has identified the following as formal bugs to address and test while designing this work:

1. **Async warning is treated as invalid.** In `ValidatorsValueHostBase.processPromise()`, an async `NoMatch` sets `result.status` to `Invalid` without the synchronous path's warning-severity handling. The warning's own `doNotSave` may still be false; the bug is the inconsistent host status and its effects on consumers.
2. **Async completion can clear pending status without notification.** When the final async validator completes through the non-`NoMatch` path, `deleteAsyncProcessFlag()` clears `asyncProcessing` without invoking the normal ValueHost validation-state callback. The rejection path does the same. Consumers may not receive a notification that pending processing ended. The fix must specify field and form notification behavior and respect `skipCallback`.

The stale-run concern described above remains a separate investigation, not yet a confirmed bug in this list.

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
    vhm.validate().resolve((validationState)=>{
        if (!validationState.doNotSave)
        {
            // continue saving.
        }
    })
```

**Decision recorded:** Manager `validate()` returns a Promise in every case. The Promise method is `.then(...)`, rather than `.resolve(...)`; `await vhm.validate()` is an equivalent caller style.

### Q08 — Meaning of completion notification

For a manager validation run, should the single completion notification be one `onValidationStateChanged` callback after all participating hosts have finished? Field callbacks may still be needed to update individual displays, and independent edits during the wait may generate separate notifications.

Define "completion notification".

### Q09 — Failure of async validation

When an async validator rejects, what should callers and the UI observe? In particular, how should submission be prevented, how should the failure be reported, and should the manager wait for other started validators before reporting it?

Exceptions bubble up to ValidatorsValueHostBase.validate, line 234 where they are logged and return Undetermined.

**Clarification:** The host's catch handles synchronous exceptions that reach it. Async Promise rejections follow a separate handler in `processPromise()`. Peter's handler contract now handles operational failures without rejection, as described in [AsyncValidator_design.md](./AsyncValidator_design.md#failure-and-completion). How those logged, skipped failures affect submission remains open.

### Q10 — Changes while waiting

If a value or a relevant validation configuration changes while manager validation is waiting, should that run stop as superseded, automatically validate again, or use another explicitly defined behavior? In every case, the workflow must not save based on stale validation.

These questions are starting points, not assumptions that the listed choices are exhaustive. We can work through the actual host implementation and alternatives before deciding.

The question is if this can happen inside of ValueHostsManager.validate(), where it does both the first and second attempt. If outside, a call to ValueHostsManager.validate() is planned to stop immediately upon asyncProcessing = true. The user will need to submit a second time. If this is only during user interactivity, both attempts will run and it may be returned in an odd order, assigning the results incorrectly. So we may have to deal with that separately.

### Q11 — Async validators during preliminary validation

Should preliminary validation skip selected async validators, and if so, how does the system know which validators to skip **before** invoking them? This is separate from ensuring final submission runs the required validators.

**Decision recorded:** Skip async validators during preliminary validation before invoking their handlers. Normal submission validation still runs applicable validators.
