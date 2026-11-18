# Async ValueHostsManager Validation Design

## Purpose and status

This document develops a manager-level approach for making
`ValueHostsManager.validate()` await asynchronous validation before it returns
its final `ValidationState`. It builds on the exploration and decisions in
[AsyncValueHostsManagerValidate_Planning.md](./AsyncValueHostsManagerValidate_Planning.md).

This is a working design, not the implementation plan. Once the behavior and
edge cases are decided, a separate implementation design will describe the
code changes and tests.

The scope is manager validation. The existing field-level behavior and
`AsyncValidator` implementation are assumed to remain in place.

## Core approach

The manager retains the current `ValueHost.validate()` contract, which is not async. Each host
returns its immediate `ValueHostValidateResult | null`; when it starts async
validators, the result's `pending` array contains the promises it started.

> The ValueHost's validate() objective is to finish immediately while async processes finish up later, so that the user experiences no delays as they fill in a form.
This differs dramatically from ValueHostsManager validate() which insists on all processes being completed, and is associated with the user saying "submit this" and expecting to wait.

`ValueHostsManager.validate()` captures those promises, waits for them to
settle, then creates and returns the final manager state.

The public manager contract is:

```ts
validate(options?: ValidateOptions): Promise<ValidationState>;
```

The manager returns a Promise for every call, including calls with no async
work. This keeps callers on one API shape:

```ts
const validationState = await valueHostsManager.validate();
if (validationState.doNotSave)
    return;
```

## Validation model

Condition-backed `Validator` evaluation is synchronous: `ICondition.evaluate()`
returns a `ConditionEvaluateResult`. Async validation is provided by
`AsyncValidator`, whose handler will return a Promise. The shared `IValidator`
interface allows either a direct result or a Promise because it covers both
validator classes; that shared type should not be read as support for async
conditions.

At present, a host's `validate()` starts all applicable validators, processes
synchronous results immediately, and registers handlers for promises returned
by async validators. Its `ValueHostValidateResult.pending` array identifies
the validator promises started by that host call. The host also processes
those settlements to update its own validation result and state.

For per-validator cancellation and policy decisions, a bare promise is not
enough information. The pending list is likely to become an array of
operation records associating each promise with the `AsyncValidator` that
owns it. A candidate shape is:

```ts
interface PendingAsyncValidation {
    asyncValidator: AsyncValidator;
    promise: Promise<ValidatorValidateResult>;
}
```

This is an illustrative shape, not a decided public type. If one validator
can have overlapping operation generations, the entry will also need an
operation identity so cancellation and settlement apply to the intended run.
Joining also requires proving that the existing result still belongs to the
current value/configuration; a run or value revision may be needed to reject a
stale result.

## Expected async-validator volume

The expected common form has no `AsyncValidator`, and one in a form is
unusual; multiple `AsyncValidator`s on one field are rarer still. This is
useful context for performance decisions, but not a reason to make the design
correct only for small counts. `Promise.allSettled()` and promise collection
should support any number of validators without introducing a more elaborate
coordination system solely for hypothetical scale.

The expected shape may change when `AsyncValidator`s are used at the model
level. A `ModelValidatorsValueHost` may have several independent wrap-up
validators participating in one `ValueHostsManager.validate()` call. The
manager should therefore be correct for multiple pending promises on a host
and across hosts, while keeping the implementation straightforward for the
common synchronous case.

## Proposed manager flow

The following is the proposed behavior of `ValueHostsManager.validate()`.
Details marked **Open** still need discussion before implementation.

1. Normalize options and determine whether this call should proceed.
2. Check an O(1) manager-level count of active async operations. If it is zero,
   skip the existing-operation preflight. If it is nonzero, enumerate only
   ValueHosts applicable to the requested validation group and ask their
   pending `AsyncValidator`s to apply their configured rule.
3. If a **superseded** operation remains pending after its cancellation
   request, do not start a new validation pass. Fulfill this call promptly
   with a blocking/current `ValidationState`; do not wait and implicitly
   retry. The caller can retry after the remaining work resolves (**Q03**).
   The join and skip paths are described below.
4. Visit the validatable hosts and apply the existing group and
   preliminary-selection rules. A joined operation is reused rather than
   started again; a validator with `SkipOnModelLevelValidation` is skipped
   for this pass.
5. Capture both joined existing operation records and new pending operation
   records from the host results:

   ```ts
   const result = valueHost.validate(options);
   if (result?.pending)
       pendingOperations.push(...result.pending);
   ```

   Copy the entries while collecting them. The host mutates its own pending
   array as its promises settle.
6. If there are no captured promises, produce the final state without waiting
   for async work. The method still returns a Promise.
7. If operations were captured, wait for all of their promises with
   `Promise.allSettled()`. This includes joined existing operations and new
   operations started by this call. Do not create the final snapshot after
   only the first promise settles. Supersede cancellation requests that remain
   pending are handled by the blocking rule in step 3, not joined into this
   wait set.
8. After the wait, create the final `ValidationState`, notify according to the
   chosen callback policy, and fulfill the manager Promise with that state.

The manager collects only promises returned by hosts validated during this
call. Existing promises are handled in the preflight, before deciding whether
to start a new manager validation pass.

The manager-level count is only a negative fast path; it does not replace the
group-aware preflight when the count is nonzero. It must increment once when
an async operation is registered and decrement once when that operation's
promise settles, regardless of success, failure, cancellation, or whether its
host run has become stale. A cancellation request alone must not decrement
the count.

## Why collect host results

The current manager discards each host's immediate result. The host's current
validation state exposes an `asyncProcessing` flag, but not the promises
associated with the host validation call. Capturing `pending` during the
existing manager loop avoids adding a separate public completion API or
changing the host return type.

The pending array is a convenient source of promises, but is not itself a
formal host-completion signal. The host registers its promise-processing
handlers before returning the result. Those handlers currently process each
settlement synchronously. This suggests that awaiting the original promises
will normally observe the host's updates first, but the ordering and error
paths must be verified before relying on that as a completion guarantee.

In particular, `Promise.allSettled()` waits for the captured promises to
settle; it does not wait for a separate promise chain created by the host's
settlement handler. If host-side processing throws and is handled on that
chain, the manager could finish waiting before that handling completes. The
design must either establish that this cannot occur, ensure the processing
chain is included in what the manager awaits, or define the resulting failure
behavior.

## Existing async work

This earlier workflow draft describes a configured rule for handling an
already-pending operation when manager validation begins. Its rule names and
default are superseded by the working AsyncValidator design below.

Before deciding whether the manager can begin a new validation pass, the
manager asks each applicable ValueHost to ask its pending `AsyncValidator`s
to try to cancel. The validator's try-cancel operation applies its configured
rule. This preflight must use the requested group rather than the
manager-wide `asyncProcessing` property, which currently has no group filter.

The engine needs a way to signal a pending `AsyncValidator` to cancel. The
signal is a cancellation request, not proof that the handler or underlying
operation stopped. Handlers must be able to observe and honor the signal.
An operation that cannot be stopped remains pending; host generations must
continue to prevent superseded results from updating current host state.

After all applicable ValueHosts have asked their pending `AsyncValidator`s
to apply their rules, the manager checks for remaining promises. Under
**Q03**, if a superseded operation remains pending after a cancellation
request, the manager does not start a new validation pass and promptly
fulfills with a blocking/current `ValidationState`. The caller must retry
after the work resolves; the manager does not wait and silently continue the
same call.

The meanings recorded in this earlier workflow draft are:

| Rule | Intended effect on the existing operation | Design detail to settle |
| --- | --- | --- |
| Join | Reuse the current operation rather than start duplicate work. | Whether this call waits on its promise and includes it in `Promise.allSettled()` or returns a blocking state is **Q04**. |
| Supersede (default) | Request cancellation of the old operation so a fresh validation can replace it. | If cancellation has not settled the old promise at the preflight boundary, this call returns a blocking state (**Q03**); if it has settled, the same call starts the replacement (**Q05 — decided**). |
| SkipOnModelLevelValidation | Ignore the old result and skip rerunning this validator during this manager pass, for example when the server will perform authoritative validation (**Q06 — skip this pass decided**). | Whether to request cancellation and whether an uncancelled operation still blocks the manager pass remain open. |

Logically skipping or superseding an operation does not cancel its network
request unless the handler responds to the cancellation signal. The active
operation remains in the manager's count until its promise settles, even if
the current pass no longer uses its result.

The O(1) idle fast path and default rule are recorded decisions:

- **Q01 — Decided:** maintain a pending-operation count and scan only when
  the count is nonzero.
- **Q02 — Superseded:** the earlier per-`AsyncValidator` default was
  supersede. The current working design uses `MustFinish` as the default.
- **Q03 — Decided:** if a cancellation request does not settle the operation,
  fulfill promptly with a blocking/current state; the caller retries later.
- **Q05 — Decided:** if a superseded operation settles before the preflight
  gate, start its replacement in the same `validate()` call.
- **Q06 — Decided:** `SkipOnModelLevelValidation` ignores the old result and
  skips rerunning that `AsyncValidator` during the current manager pass.
  Whether to request cancellation and whether an uncancelled operation blocks
  remain open.

## Open design questions

**Q04 — Join semantics:** Should join make this manager call reuse the
existing operation and include its promise in `Promise.allSettled()`, then
return the resulting state? That is the conventional meaning of join and
avoids duplicate work. The alternative is to return a blocking state and
require the caller to retry after settlement. **Q03** applies specifically
when a supersede cancellation request does not settle the old promise.
Whichever meaning is chosen, the joined result must be tied to the current
value/configuration; otherwise the manager could accept a result computed for
stale input.

**Q06 — SkipOnModelLevelValidation cancellation:** The validator is skipped
during this manager pass. Should this also request cancellation? If that
uncancelled operation remains active, should it block this pass, or can the
manager proceed while continuing to track and ignore its result?

**Q07 — Failure representation:** What reporting mechanism (for example,
logging plus a failed model-level result) should represent unexpected
host-processing failures? The manager must not turn such a failure into a
success-shaped fallback or silently discard it.

**Q08 — Cancellation API:** What form should the cancellation signal take,
and how should a handler observe it? A standard `AbortSignal` is one candidate
because many asynchronous APIs already accept it; the signal should remain a
best-effort request, not a promise-settlement guarantee.

**Q09 — Changes while waiting:** Should the manager return the state current
at completion, mark the attempt as superseded/blocking, restart validation,
or use another policy? Whatever the choice, a caller must not be able to save
based on results for values that have since changed.

## Promise and failure semantics

`ValueHostsManager.validate()` returns a Promise on every call, and that
Promise is expected to **fulfill with a `ValidationState`**, including when
unexpected engine errors occur. `Promise.allSettled()` allows the manager to
wait for every captured promise, even if one rejects, but it does not define
how a rejection or an exception thrown while starting host validation is
represented.

Expected `AsyncValidator` operational failures are recorded by the host as
blocking validation failures. They should therefore appear in the final
`ValidationState` and must never result in a save-allowed state. Unexpected
host-processing failures must also be surfaced explicitly and represented as
a blocking state; see **Q07**.

## Notifications

Individual `onValueHostValidationStateChanged` callbacks continue to report
host-level changes as they happen. In addition, whenever an `AsyncValidator`
resolves, it should request `onValidationStateChanged` through the manager's
normal notification path. The manager's debounce should coalesce nearby
resolutions; a final manager notification is still required when the
manager-level validation completes.

Today, a host state change also asks the manager to notify
`onValidationStateChanged`; the manager's debounce can combine calls but does
not guarantee exactly one callback across a full manager invocation,
especially when async completions are spread out over time. The manager must
ensure its final completion notification is delivered after all participating
work, without suppressing field notifications or unrelated edits during the
wait. `skipCallback` currently suppresses both kinds of notification and may
not express the desired behavior by itself.

The Validation Summary currently receives its updates through the
manager-level callback. The `AsyncValidator` notification lets the summary
reflect completed results while other async validations may still be pending.
This means the final completion notification is guaranteed, but it is not
necessarily the only manager notification during that invocation; debouncing
coalesces resolutions that occur close together.

## Changes while waiting

Host validation generations already prevent a superseded host run from
writing stale results into current host state. The manager still needs a
defined behavior when a value changes or another validation starts while this
manager call is waiting; see **Q09**.

## Scenarios to establish

| Scenario | Required behavior |
| --- | --- |
| No async validators | Return a Promise containing the completed synchronous state. |
| Async work already in progress | Apply each pending validator's rule and cancellation request; if work remains pending, do not start a new pass. |
| Join, supersede, or `SkipOnModelLevelValidation` | Apply the per-`AsyncValidator` rule recorded in the applicable design section. |
| Cancellation unavailable or unsuccessful | Keep the operation pending and block a new validation pass until the agreed continuation behavior occurs. |
| One pending validator | Resolve the manager Promise only after its result is reflected in the final state. |
| Multiple pending validators on one host | Wait for every promise started by that host call. |
| Pending validators on multiple hosts | Wait for every promise collected from participating hosts. |
| Async match, no-match, warning, undetermined, or failure | Final state reflects host status and blocking behavior. |
| Rejected promise or host processing error | Fulfill with a blocking state and surface the failure explicitly. |
| Grouped or preliminary validation | Preserve host selection and `AsyncValidator` skip behavior. |
| Notifications | Notify on each resolved `AsyncValidator` through the debounced manager path and guarantee a final manager notification at completion; preserve host callbacks and unrelated edits. |
| Edit or new validation while waiting | Do not authorize saving against stale values. |

## Related material

- [AsyncValueHostsManagerValidate_Planning.md](./AsyncValueHostsManagerValidate_Planning.md) — prior exploration, existing host behavior, and recorded decisions.
- [AsyncValidator_Implementation.md](./AsyncValidator_Implementation.md) — async validator behavior and host-level failure semantics.
- [ValueHostsManager.validate()](../packages/jivs-engine/src/Validation/ValueHostsManager.ts) — current manager implementation.
- [ValueHostValidateResult](../packages/jivs-engine/src/Interfaces/Validation.ts) — host result and pending-promise shape.
- [ICondition.evaluate()](../packages/jivs-engine/src/Interfaces/Conditions.ts) — synchronous condition evaluation contract.


### Workflow

1. Attempt to cancel existing processes.
   A. Don't search if none exist
   B. Ask AsyncValidators to try to cancel.
      b1. No action if no pendings
      b2. If RestartWhenPending=MustFinish, return that promise for queuing up to wait on it.
      b3. If RestartWhenPending=Restart, send the cancellation notification and discard the record in the pendings array.
      b4. If RestartWhenPending=SkipOnModelLevelValidation, send the cancellation notification and discard the record in the pendings array.
2. Handle any queued processes based on user option guidance.
   A. option=block. stop.
   B. option=block + message for validation summary. Inject IssueFound into model-level with message. stop
   C. option=wait. Promise.allSettled must finish, but we need a way to abort with user defined time limit that will resolve as block+stop.
3. Loop through all ValueHosts to run validate().
   Pass new ValidateOption indicating model level is running into valuehost.validate(). 
   Let AsyncValidator use its RestartWhenPending=SkipOnModelLevelValidation together with that option to skip itself.
4. After all valuehosts processed.
   A. If no asyncs pending, return promise completed with ValidationState
   B. If asyncs pending, Promise.allSettled to return ValidationState, but also need a time limit to stop and block+stop.


### Workflow based on Q10

1. Attempt to cancel existing processes.
   A. Don't search if none exist
   B. Ask AsyncValidators to try to cancel.
      B1. No action if no pendings
      B2. If RestartWhenPending=MustFinish, 
         B2a. If input values did not change, return that promise for queuing up to wait on it.
         B2b. If input values did change, work like RestartWhenPending=Restart.
      B3. If RestartWhenPending=Restart, send the cancellation notification and discard the record in the pendings array.
      B4. If RestartWhenPending=SkipOnModelLevelValidation, send the cancellation notification and discard the record in the pendings array.
2. Handle any queued processes based on user option guidance.
   A. option=stop. stop and block
   B. option=stop + message for validation summary. Inject IssueFound into model-level with message. stop and block
   C. option=continue. Proceed to #3. Let the AsyncValidators handle their own pending promise in that loop.
3. Loop through all ValueHosts to run validate().
   Pass new ValidateOption indicating model level is running into valuehost.validate(). 
   A. Let AsyncValidator use its RestartWhenPending=SkipOnModelLevelValidation together with that option to skip itself.
   B. Let AsyncValidator notice an existing pending promise, and return it.
   C. Otherwise AsyncValidator starts a new async process.
4. After all valuehosts processed.
   A. If no asyncs pending, return promise completed with ValidationState
   B. If asyncs pending, Promise.allSettled to return ValidationState, but also need a time limit to stop and block+stop.   

NOTE: Each AsyncValidator will have a time limit. Global setting plus one set on the AsyncValidator config to allow variation based on expected processing time. That time limit will be part of the ability to cancel. If by step 4 we have cancelled due to timeout, we need to stop and block. May need to inject a different issue found error message for display in ValidationSummary, where the message is global, not specific to the AsyncValidator.

### Integrated workflow based on the discussion

This section synthesizes the current understanding after Q10-Q14. The earlier
workflow sections above are preserved as discussion drafts.

1. **Inspect existing async operations.**
   1. Check an O(1) manager-level count of active operations. If it is zero,
      skip the search.
   2. If the count is nonzero, inspect only ValueHosts applicable to the
      requested validation group, and ask their pending AsyncValidators to
      apply their `RestartWhenPending` rule.
   3. A pending operation record is expected to associate at least its
      AsyncValidator with its promise. It may also retain its cancellation
      object and the input values/version used by the operation.
   4. Apply the rule to each operation:
      1. **MustFinish:** If its inputs are unchanged, queue its existing
         promise. If its inputs changed, treat it as **Restart**.
      2. **Restart:** Signal cancellation and remove the old operation from
         this validation's pending queue. The async function receives the
         cancellation signal and is expected to honor it; the operation still
         has a completion process.
      3. **SkipOnModelLevelValidation:** Signal cancellation for an existing
         operation and do not use its result. The later manager-level
         validation pass skips starting this AsyncValidator.
   5. Details of cancellation settlement, cleanup, and stale-result
      protection remain for a later discussion.

2. **Choose how to handle queued MustFinish operations.**
   1. **Continue** is the default. Proceed to the ValueHosts loop; its
      AsyncValidator call reuses the existing promise, and the manager waits
      for it together with any new async operations.
   2. **Stop** returns a blocking state without starting the ValueHosts loop.
      The existing operation continues and can notify when it resolves.
   3. **Stop with a Validation Summary message** also returns a blocking
      state, adding a model-level IssueFound to explain that validation is
      waiting for existing work.
   4. The summary message is an explanation, not the mechanism that blocks
      saving. The temporary IssueFound needs a defined cleanup point, such as
      resolution of the queued work or the next manager validation.

3. **Run validation at the manager level.**
   1. Call `validate()` on applicable ValueHosts with a ValidateOptions flag
      indicating manager-level validation is occurring.
   2. Each host applies the existing group and preliminary-selection rules
      and returns its immediate result.
   3. AsyncValidator uses the manager-level flag and its pending rule:
      1. **SkipOnModelLevelValidation:** skip starting the handler during
         this pass.
      2. **MustFinish:** return the same pending promise when its inputs are
         unchanged.
      3. Otherwise, start a new async operation.
   4. Collect the pending operation records from each host result. Do not
      start a second handler for a MustFinish operation already in progress.

4. **Wait for the participating operations.**
   1. If no operations are pending, produce the final state and fulfill the
      manager Promise.
   2. Otherwise, use one `Promise.allSettled()` for both reused MustFinish
      promises and newly started operations. This is the manager's completion
      wait; there is no separate preflight `Promise.allSettled()`.
   3. Each AsyncValidator has a timeout. The global timeout is the default;
      an AsyncValidator config may override it. The timer begins when the
      operation starts, and joining it does not reset the timer.
   4. API-specific timeout and cancellation behavior belongs to the async
      handler. The engine timeout requests cancellation through the
      cancellation object passed to the handler.

5. **Report timeout and completion.**
   1. A timeout is logged as an error and must produce a blocking validation
      result. A user-facing message is optional.
   2. When configured, the global timeout message and localization code are
      used to create an IssueFound on the model-level host. The error code is
      a stable timeout identifier, not an AsyncValidator-specific code.
   3. An IssueFound is not required solely to block saving. While work is
      pending, `asyncProcessing` contributes to `doNotSave`; after a timeout,
      the failed validation state must continue to block saving. `doNotSave`
      is the save gate even if `isValid` is true while processing.
   4. Each resolved AsyncValidator requests the manager validation-state
      notification through the debounced path. The manager also sends its
      final notification after its participating work completes.



# AsyncValidator revisited

## Working design: AsyncValidator responsibilities

This section describes one `AsyncValidator` and its operation. The
`ValueHostsManager` remains a separate design concern: it will consume pending
work exposed by value hosts, wait for the applicable work, and produce the
manager-level result. The first implementation is intended to focus on
`AsyncValidator`; its contract should make that later orchestration possible
without putting manager-wide coordination into the validator.

An `AsyncValidator` is responsible for:

1. Invoking its handler and translating the handler's result into the
   validator's validation result.
2. Maintaining the state for its own pending operation, including the
   operation promise, validator identity, cancellation controller, and values
   read by the handler.
3. Applying its pending-operation policy when manager-level validation asks it
   to participate. The working policies are `MustFinish`, `Restart`, and
   `SkipOnModelLevelValidation`. `MustFinish` is the default, superseding the
   earlier Q02 decision recorded above.
4. Tracking dependency valuehosts and their current changeCounter state to compare to a later validation attempt which the current one is still running, to determine if we should keep the earlier promise live or replace it.
5. Applying its timeout, using the global timeout by default and allowing an
   AsyncValidator-specific override.

The value host propagates pending-operation records in
`ValueHostValidateResult.pending`. The manager consumes those records; it does
not own each validator's cancellation or restart policy. A validator's
completion may request the existing debounced validation-state notification,
while the final manager-level notification remains the manager's
responsibility.

### Per-operation ownership

The `AsyncValidator` creates and owns its pending operation, including the
`AbortController`, timeout handle, handler promise, and input snapshot. It
passes the controller's `AbortSignal` to the handler. A `PendingContext` may
expose the signal and completion promise to the value host and manager, but
those callers request cancellation through the owning `AsyncValidator`; they
do not call `abort()` or own the timeout. The `AsyncValidator` clears its
timeout when the operation settles or times out.

The manager remains responsible for deciding which validators participate,
collecting their pending records, and awaiting the applicable promises. It
does not create or directly manage individual validator operations.

### Handler access and input tracking

The working proposal replaces the handler's direct `valueHost` and
`valueHostsManager` parameters with an `AsyncValueStateManager` helper. Its
`getValue(valueHostName)` method reads a value host's value and records the
name/value in the pending operation state. `dependencyValueHostNames` is
removed from `AsyncValidatorConfig`: dependencies are discovered from values
the handler reads, rather than requiring declaration before the handler runs.

Reads intended to participate in input-change detection and dependency
notification must go through this tracked accessor. Other access to a value
host or the value hosts manager may remain available to the handler for
non-value purposes, but value reads through those paths are not automatically
captured.

For each name, the pending operation's `valueState` stores the most recent
value returned by `getValue()`. A later call for the same name replaces that
entry. The current direction for `MustFinish` input-change detection is to
record and compare each ValueHost's `changeCounter` rather than compare
values. The exact record shape and the rules for resets and calculated
values remain open. `DataTypeComparerService.compare()` remains an alternative
if counter-based tracking cannot cover a particular case; it is accessible
through `valueHostsManager.services`.

#### Deferred: native-value change detection

The existing ValueHost change detection uses `deepEquals` to decide whether
to update a value and increment `changeCounter`. Jivs supports native values
including primitives, dates, and user-defined types. `deepEquals` compares
enumerable properties, so it does not reliably represent the semantics of
every native value: for example, different `Date` values can compare equal.
Examples of custom types include
[`TimeSpan`](../packages/jivs-examples/src/TimeSpan_class.ts).

Revisit ValueHost native-value change detection after the current async design
is complete. `DataTypeComparerService` and its conversion support are possible
building blocks, not a chosen solution. Until this issue is addressed,
counter-based tracking inherits any missed changes in the underlying
ValueHost change detection; it must not be described as fully reliable for
all native types.

#### Calculated values: change tracking under consideration

`CalcValueHost.getValue()` computes a value on demand and currently does not
update `changeCounter`. Two approaches to investigate are:

1. Retain the last calculated value in instance state and update the counter
   when a later `getValue()` produces a different value. This detects changes
   when the calculation is read again, including changes unrelated to declared
   dependencies, but it makes reads stateful and inherits the deferred
   equality issue if it uses `deepEquals`.
2. Record the counters or values of the calculation's declared
   `dependencyValueHostNames` alongside the async operation's tracked inputs.
   This relies on complete dependency declarations and also needs a rule for
   nested calculations and calculations with external inputs.

Neither approach has been chosen. Any counter-based solution must also
address a reset that returns a recorded counter to the same value, and must
ensure that changes to calculation inputs can trigger the owning value host's
dependency notifications.

#### Dependency notifications

The `AsyncValidator` retains a cumulative set of names read by its handler,
independent of the lifetime of any one `PendingContext`. It contributes this
set from `gatherValueHostNames()`. Names are not removed when later handler
runs read a different set; retaining them may cause extra revalidation, but
avoids dependency-removal bookkeeping.

When `AsyncValueStateManager.getValue()` adds a name not previously recorded
for that validator, it asks the owning value host to invalidate its cached
aggregate dependency names. The cache is owned by `ValidatableValueHostBase`
in its _associatedValueHostNames field,
so the invalidation operation is generic and does not require that base class
to know about AsyncValidators. The next dependency notification rebuilds the
aggregate through the existing `gatherValueHostNames()` traversal. Re-reading
an already-recorded name updates that operation's value state but does not
invalidate the dependency-name cache again.

### Cancellation and timeout

The engine creates and retains an `AbortController` for each operation and
passes its `signal` to the handler. The engine requests cancellation by
calling `abort()` on the controller, such as for restart,
`SkipOnModelLevelValidation`, or timeout.
The handler is expected to respect the signal. Passing it through to an
application API is recommended when that API supports `AbortSignal`, but is
the developer's choice; the engine does not prescribe an application's API.
Cancellation is cooperative and does not itself guarantee that an arbitrary
handler promise has stopped or settled.

The AsyncValidator timeout defaults to the global setting and may be
overridden per validator. The engine timeout logs an error and must result in
a blocking validation outcome. A user-facing timeout issue is optional and,
when configured, uses the global timeout message and localization code as
described in the manager workflow above. How the timeout outcome interacts
with a handler that does not settle after cancellation remains part of the
cancellation and stale-result discussion.

The code sketches below are advisory illustrations of this direction, not
the formal API or implementation.

## AsyncValidatorConfig
Added restartWhenPending and timeout.
End-user documentation must reflect requirements for dependencyValueHostNames in order to support restartWhenPending = MustFinish: every valuehost name used by the async handler included those from calcValueHosts (even nested ones).

```ts
// Current shape, abbreviated to the async-specific members.
export interface AsyncValidatorConfig extends Omit<ValidatorConfig,
    'errorCode' | 'conditionConfig' | 'conditionCreator' | 'errorMessage' |
    'errorMessagel10n' | 'summaryMessage' | 'summaryMessagel10n'> {
    handler: AsyncValidatorEvaluateHandler;
    handlerIdentity: string;
    dependencyValueHostNames?: ValueHostName[];
    restartWhenPending?: RestartWhenPending; // default to MustFinish
    timeout?: number;   // ms - there is a global default. Used with AbortController
}
export enum RestartWhenPending 
{
   MustFinish, // but only if no value changes. Otherwise restart
   Restart,
   SkipOnModelLevelValidation
}
```

## ValueHostValidateResult
`pending` is an array of `PendingContext` objects.

```ts
export interface PendingContext
{
   promise: Promise<ValidatorValidateResult>;
   validator: AsyncValidator;
   cancellation: AbortSignal;
   valueState: Map<string, number>; // valuehost name and ValueHost.changeCounter at the time captured
}
export interface ValueHostValidateResult extends StatefulValueHostValidateResult {
    pending?: Array<PendingContext> | null;
}
```

## AsyncValidatorEvaluateHandler
Add cancellation support.
```ts
export type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatableValueHost,
    valueHostsManager: IValueHostsManager,
    cancellation: AbortSignal
) => Promise<AsyncValidatorEvaluationResult>;
```

```ts
// Illustrative application code; availabilityApi is an application-owned service.
const evaluateAvailability: AsyncValidatorEvaluateHandler = async (valueHost, valueHostsManager, abortSignal) => {
    try {
        const available = await availabilityApi.isAvailable(valueHostsManager.getValueHost('fieldname').getValue(), abortSignal); // abortSignal is a suggestion for API implementers to support
        return available
            ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
            : {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken',
                errorMessage: 'This name is already in use.'
            };
    }
    catch (error) {
        return {
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: error instanceof Error ? error : new Error(String(error))
        };
    }
};
```

## AsyncValidator
Add requestCancel.

```ts
export class AsyncValidator extends ValidatorBase
{
   protected get restartWhenPending(): RestartWhenPending
   {
      return this.config.restartWhenPending;
   }
   protected get timeout(): number
   {
      // The global default and timeout messages are proposed as ValueHostsManager.behaviors settings.
      return this.config.timeout ?? global value;
   }

   protected get abortController(): AbortController
   {
      // previously defined, maybe in the constructor
   }

   public validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult>
   {
      // expands to hookup timeout to abortController. Do we need to cancel the timeout later?
      // check if already promise pending, then use restartWhenPending to determine next action.
      // - MustFinish checks if pendingContext.valueStates has any changeCounters that changes
      //   Returns the promise if not. Acts like restart if so.
      // - Restart discards entry in pending/cancels/expects no further impact from finished promise.
      //
      // pass new parameters for handler function
      // Anything else I missed
   }

   public requestCancel(pendingContext: PendingContext): Promise<ValueHostValidateResult> | null
   {
      // follows restartWhenPending
   }
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void
    {
      // no change here, but vital to this design change
        // config.dependencyValueHostNames contains the names of value hosts this validator depends on
        for (const name of this.config.dependencyValueHostNames ?? [])
            collection.add(name);
    }   
}
```
## Builder changes
The IValidatorBuilder.asyncValidator function has changed its parameters to support an object of optional parameters.
```ts
public asyncValidator(identity: string, handler: AsyncValidatorEvaluateHandler,
        options?: FluentAsyncValidatorConfig) : IValidatorBuilder
{
   // apply options to actual AsyncValidatorConfig
}

export interface FluentAsyncValidatorConfig extends AsyncValidatorConfig<Omit<'handler' | 'handlerIdentity'>>
{

}
```

## Changes to ValueHosts
AsyncValidators need to detect changes to dependency valuehost values. We'll do this through retaining the existing ValueHostBase.instanceState.changeCounter at the time we last ran the asyncvalidator,
and using dependencyValueHostNames to find valuehosts and their counters.

Here are ideas of what needs to change to support this:
1. We will retain valuehost.instanceState.changeCounter in pendingContext.valueState. 
2. Provide a public method (not property) to expose instanceState.changeCounter on ValueHostBase.
3. Add new instance state property, baseChangeCounter to ValueHostInstanceState. It is optional, when not there, its value is 0. That way we don't retain it without going through a reset.
4. ValueHost.isChanged will compare changeCounter to baseChangeCounter.
5. Code that handles reset option will be revised to update instanceState.baseChangeCounter with changeCounter + 1 and changeCounter is assigned baseChangeCounter.
6. CalcValueHost.getValue() must support the changeCounter by retaining the last value in its instanceState and using a deepEquals comparer to know if the value has changed, which bumps changeCounter and updates the last value.
   ```ts
   try                                                         
   {                                                           
      let newValue = this.config.calcFn(this, this.valueHostsManager);
      let valueChanged = deepEquals(newValue, this.instanceState.lastValue);
      this.updateInstanceState((stateToUpdate) => {
          if (valueChanged) {
              stateToUpdate.lastValue = newValue;
          }
          this.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, changed, options!);   // bumps changeCounter
          return stateToUpdate;
      }, this);
   }                                                           
   ```
7. Expand deepEquals to detect Date object and compare date.getTime(). THIS WORK IS FINISHED.
8. ValidatableValueHostBase.otherValueHostChangedNotication() has a cached field, _associatedValueHostNames, that is impacted by AsyncValidator.gatherValueHostName. We have a fixed value it supplies through dependencyValueHostNames, so the cached value still works here. No change.