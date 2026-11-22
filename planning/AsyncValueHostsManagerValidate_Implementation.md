# Async ValueHostsManager Validation: Implementation

## Status and scope

Implementation guide for [AsyncValueHostsManagerValidate_Design.md](./AsyncValueHostsManagerValidate_Design.md).
Configuration, `AsyncValidator` pending policies and timeout, and the
ValueHost policy handoff and run-specific host completions are implemented.
The manager's async orchestration remains to be built. AsyncValidator failures,
including timeouts, already produce validator-owned issues.
Snippets below are illustrative and may include **proposed** APIs; named
helper calls in orchestration snippets specify work to implement.
The design still has decisions listed in
[Decisions before implementation](#decisions-before-implementation).

The order below delivers `AsyncValidator` behavior first, then host
coordination, then manager orchestration. Do not change synchronous
`ICondition.evaluate()` or add model-level validators as part of this work.

## Files and ownership

| Object | Work |
| --- | --- |
| [AsyncValidator interfaces](../packages/jivs-engine/src/Interfaces/AsyncValidator.ts) | Handler signal and configuration exist; introduce `IAsyncValidator` and `PendingContext`. |
| [AsyncValidator](../packages/jivs-engine/src/Validation/AsyncValidator.ts) | Own the context, select pending work, and wrap the handler for timeout and cancellation. |
| [ValidatorsValueHostBase](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) | `hasAsyncValidators` exists; collect contexts and process results for the current host run. |
| [Validation interfaces](../packages/jivs-engine/src/Interfaces/Validation.ts) | Model-level option, pending contexts and per-host-run completions; manager still returns `ValidationState`. |
| [ValueHostsManager](../packages/jivs-engine/src/Validation/ValueHostsManager.ts), [manager interface](../packages/jivs-engine/src/Interfaces/ValueHostsManager.ts) | Await host processing, protect against obsolete runs, return and notify the final state. |
| [ValidatorBuilder](../packages/jivs-builder/src/Builder/ValidatorBuilder.ts), [builder interface](../packages/jivs-builder/src/Interfaces/ChildBuilders.ts) | The options-object form exists; it replaces the previous dependency-array argument. |

```text
manager.validate()
  -> host.validate()                         // synchronous return
       -> asyncValidator.isPendingResponsible(options)
       -> reuse validator-owned context OR
       -> asyncValidator.validate(options)   // handler starts, Promise returned
       -> attach result processing for this host generation
  -> await all host-processing completions
  -> create final ValidationState and notify
```

## 1. Contracts and configuration

**Problem:** Configuration must drive pending behavior, cancellation, and
timeout.

**Solution:** Use the existing configuration and handler signal.
`WhenInputsChanged` is the specified default.

```ts
// Current enum.
export enum RestartWhenPending {
    WhenInputsChanged = 0,
    Always = 1
}

// Current handler signature.
export type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatorsValueHost,
    valueHostsManager: IValueHostsManager,
    abortSignal: AbortSignal
) => Promise<AsyncValidatorEvaluationResult>;

// Current async-specific configuration, abbreviated.
export interface AsyncValidatorConfig /* existing members remain */ {
    handlerIdentity: string;
    handler: AsyncValidatorEvaluateHandler;
    dependencyValueHostNames?: ValueHostName[];
    restartWhenPending?: RestartWhenPending;
    skipOnModelLevelValidation?: boolean;
    timeout?: number; // milliseconds
}
```

The actual interface retains its existing `Omit<ValidatorConfig, ...>` base.
Existing two-argument handlers remain assignable to the signal-bearing type.
An explicitly returned `failedToResolve` still works. The proposed wrapper
will convert a thrown error or rejection to a logged, blocking failure.
Until then, handlers must follow the current always-resolve contract.

Keep the current union on `IValidator.validate()`:

```ts
validate(options: ValidateOptions):
    ValidatorValidateResult | Promise<ValidatorValidateResult>;
```

An AsyncValidator can still return synchronously when disabled, during edit,
or during preliminary validation. Other custom `IValidator` implementations
can also return Promises; manager waiting must not silently exclude them.

### Builder compatibility

**Problem:** Introduce additional options into asyncValidator (breaking changes supported).

**Solution:** The builder now accepts `FluentAsyncValidatorConfig`, including
`dependencyValueHostNames`, `restartWhenPending`,
`skipOnModelLevelValidation`, and `timeout`.

```ts
export type FluentAsyncValidatorConfig = Omit<AsyncValidatorConfig,
    'validatorType' | 'handler' | 'handlerIdentity'>;

asyncValidator(
    identity: string,
    handler: AsyncValidatorEvaluateHandler,
    options?: FluentAsyncValidatorConfig
): IValidatorBuilder;
```

```ts
const config: AsyncValidatorConfig = {
    ...options,
    validatorType: ValidatorType.AsyncValidator,
    handlerIdentity: identity,
    handler
};
```

The builder checks the identity and handler and stores the supplied options.
It does not yet validate the new options or implement their behavior. Add
explicit checks for invalid policy or timeout values when implementing them.
The previous third-argument array is a breaking change: use
`{ dependencyValueHostNames: [...] }` instead.

### Timeout settings

The timeout duration precedence is:

```ts
const timeoutMs = asyncConfig.timeout ?? services.settings.asyncValidation.timeout;
```

`initJivsGlobalSettings()` supplies a 5000 ms timeout and the generic
failed-resolution issue defaults. An `AsyncValidator` timeout uses the same
blocking, validator-owned issue as other operational failures; there is no
timeout-specific message or localization key. Each operation gets its own
timer; reuse does not restart it. The duration must be finite and positive
within the supported timer range.

## 2. Validator-owned context and input versions

**Problem:** `WhenInputsChanged` must decide whether pending work still
applies without a separate ValueHost-owned operation registry.

**Solution:** Each AsyncValidator owns its current context and captures the
owner and dependency counters before starting the handler. Its public
interface exposes that context and the policy decision.

```ts
// Proposed types; the exact public context shape is not final.
export interface IAsyncValidator extends IValidator {
    readonly pendingContext: PendingContext | null;
    isPendingResponsible(validatorOptions: ValidateOptions): boolean;
}

interface CapturedValueHostCounter {
    host: IValueHost;
    changeCounter: number;
}

export interface PendingContext {
    inputs: CapturedValueHostCounter[];
    promise: Promise<ValidatorValidateResult>;
    controller: AbortController;
}

// In AsyncValidator; transient, not serialized instance state.
private _pendingContext: PendingContext | null = null;
public get pendingContext(): PendingContext | null {
    return this._pendingContext;
}
```

`AsyncValidator` implements `IAsyncValidator`. Add a suitable type guard for
the host's `IValidator` list so custom implementations can participate without
requiring `instanceof AsyncValidator`. The guard's exact contract remains
open; do not identify an instance solely by its condition category.

Capture the owner and each declared dependency before invoking the handler.
Deduplicate names. Missing dependencies are configuration errors and must be
logged and block the affected manager pass.

```ts
function captureValueHostCounters(
    owner: IValueHost,
    manager: IValueHostsManager,
    dependencyNames: readonly ValueHostName[]
): CapturedValueHostCounter[] {
    const names = new Set([owner.getName(), ...dependencyNames]);
    return [...names].map(name => {
        const host = manager.getValueHost(name);
        if (!host)
            throw new CodingError(`Async validation dependency "${name}" was not found`);
        return { host, changeCounter: host.changeCounter };
    });
}

function countersUnchanged(
    inputs: readonly CapturedValueHostCounter[],
    manager: IValueHostsManager
): boolean {
    return inputs.every(input => {
        const current = manager.getValueHost(input.host.getName());
        return current === input.host &&
            current.changeCounter === input.changeCounter;
    });
}
```

The owner must also resolve to the same instance. Instance identity prevents
equal counters on a replacement host from being mistaken for unchanged input.
In-place restoration must invalidate pending contexts even if the same host
and counter are restored; wire invalidation to that lifecycle path.

`CalcValueHost.getValue()` updates its counter when the calculation changes.
An initial handler read can therefore advance a calculation counter after
the snapshot. Resolve this explicitly: initialize relevant calculated inputs
before capturing, or distinguish that initial calculation from a later input
change. Do not simply recapture all counters after invoking the handler:
reentrant value changes during handler startup must not be hidden. Declared
underlying fields, including nested calculation inputs, remain necessary.
Undeclared inputs and external application state cannot be checked.

### Context creation and cancellation

The validator must make its context visible **before** calling user code,
because a handler can synchronously re-enter validation or change an input.
An internal deferred Promise can be installed in the context before the
handler wrapper starts. Observe both startup errors and the wrapper's
settlement; settle the deferred Promise on every path. The exact registration
mechanics remain open.

```ts
// AsyncValidator: illustrative identity-protected cancellation.
private cancelPending(): void {
    const context = this._pendingContext;
    if (!context)
        return;
    this._pendingContext = null;
    context.controller.abort();
}

private forgetIfCurrent(context: PendingContext): void {
    if (this._pendingContext === context)
        this._pendingContext = null;
}
```

Create a new controller per started operation, not per form or permanently
per validator. Keep existing `enabled`, `preliminary`, and `duringEdit`
checks before starting an operation. On disposal abort current work before
releasing validator resources. A direct `validate()` call with an active
context must defensively stop rather than create a second operation; its
result must not cause pending work to disappear or saving to be authorized.

Clearing the current context before aborting makes reentrant replacement
possible; cleanup of the cancelled operation must use identity checks and
must not clear or abort its replacement.

## 3. AsyncValidator Promise wrapper

**Problem:** An aborted or timed-out handler may never settle. The manager
cannot safely wait on its raw Promise.

**Solution:** Keep `validate()` and its existing result type. Register abort
handling and the timer before invoking the handler. Resolve the engine Promise
once, clean up the timer/listener, and continue observing the handler's
Promise for unexpected late errors.

```ts
const skipped: ValidatorValidateResult = {
    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
    issueFound: null,
    skipped: true
};

function failed(error: Error): ValidatorValidateResult {
    return {
        conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
        issueFound: null,
        failedToResolve: error
    };
}
```

The following is the body of the proposed asynchronous branch. `logger`,
`handler`, `valueHost`, and `manager` are captured before invoking user code so
late failure reporting does not dereference a disposed validator. The
`this.resolveValidationResult()` path is used only while still active.
`reportFailureSafely` and `reportUnexpectedLateFailureSafely` are required
non-throwing diagnostic helpers; their fallback reporting mechanism remains
to be chosen. This is the wrapper invoked **after** the validator has
registered `context` with its deferred Promise as described in section 2;
the wrapper's result settles that registered Promise.

```ts
const logger = this.logger;
const handler = this.config.handler;
const valueHost = this.valueHost;
const manager = this.valueHostsManager;
const controller = context.controller;
const signal = controller.signal;

const wrapperPromise = new Promise<ValidatorValidateResult>(resolve => {
    let finished = false;

    const finish = (result: ValidatorValidateResult): boolean => {
        if (finished)
            return false;
        finished = true;
        this.forgetIfCurrent(context);
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        resolve(result);
        return true;
    };

    const onAbort = (): void => {
        finish(skipped);
    };

    const timer = setTimeout(() => {
        const error = new Error('Async validation timed out');
        if (finish(failed(error))) {
            reportFailureSafely(error, logger);
            controller.abort(error);
        }
    }, timeoutMs);

    signal.addEventListener('abort', onAbort);
    if (signal.aborted)
        onAbort();
    if (finished)
        return;

    const handleFailure = (reason: unknown): void => {
        if (finished) {
            reportUnexpectedLateFailureSafely(reason, signal, logger);
            return;
        }
        const error = ensureError(reason);
        finish(failed(error));
        reportFailureSafely(error, logger);
    };

    // The executor catches a synchronous throw and adopts the returned Promise.
    const handlerPromise = new Promise<AsyncValidatorEvaluationResult>(
        resolveHandler => resolveHandler(handler(valueHost, manager, signal))
    );
    handlerPromise.then(result => {
        try {
            if (!result || ![
                ConditionEvaluateResult.Match,
                ConditionEvaluateResult.NoMatch,
                ConditionEvaluateResult.Undetermined
            ].includes(result.conditionEvaluateResult))
                throw new CodingError('Invalid async validator result');
            if (finished) {
                if (result.failedToResolve)
                    reportUnexpectedLateFailureSafely(result.failedToResolve, signal, logger);
                return;
            }
            finish(this.resolveValidationResult(result));
        }
        catch (error) {
            handleFailure(error);
        }
    }, handleFailure);
});

// Adopt wrapperPromise into the already-registered context.promise.
// Return context.promise from validate(), not a separate operation Promise.
```

`reportUnexpectedLateFailureSafely` must recognize a known abort rejection without
silencing unrelated errors that happen after cancellation. For example, a
rejection equal to `signal.reason` is expected; browser `AbortError` handling
needs a documented, tested rule. The current logger must remain usable after
disposal. The diagnostic helpers must not
throw, including when a logging service throws; do not leave the wrapper
unresolved or produce an unobserved rejection. Preserve the existing
`_disposed` guard for direct validator calls as well as host-driven calls.

On timeout, first settle with `failedToResolve`, then abort. On restart/skip,
abort settles with `skipped`. A late handler result cannot replace either
outcome. Cancellation does not wait for handler cleanup or guarantee that
external work stops. An old operation's cleanup must not clear a newer
context. If startup fails after registering a context, settle its Promise and
clear it only if it is still current.

## 4. Host selection and completion

### Policy selection inside AsyncValidator

**Problem:** A manager pass must reuse only eligible pending work, without
allowing an old operation to clear or overwrite a replacement.

**Solution:** The host calls `isPendingResponsible()` in its existing
validator loop. `AsyncValidator` applies its own policy to its own context.
There is no separate preliminary loop or host-owned context map.

```ts
// Inside AsyncValidator; isModelLevel is an illustrative option name.
public isPendingResponsible(options: ValidateOptions): boolean {
    const context = this._pendingContext;
    if (options.isModelLevel && this.config.skipOnModelLevelValidation) {
        this.cancelPending();
        return false;
    }
    if (!context)
        return false;

    if ((this.config.restartWhenPending ?? RestartWhenPending.WhenInputsChanged) ===
        RestartWhenPending.WhenInputsChanged &&
        countersUnchanged(context.inputs, this.valueHostsManager))
        return true;

    this.cancelPending();
    return false;
}
```

`skipOnModelLevelValidation` takes precedence over either restart policy,
including unchanged pending inputs. When the method returns false, the host
calls `validate()` with the same options. That method must also check skip
before starting work, including when there was no pending operation.

```ts
// Inside AsyncValidator.validate(), before creating a context or handler.
if (options.isModelLevel && this.config.skipOnModelLevelValidation)
    return skipped;
```

Validate unsupported policy values explicitly; the example omits that check.
Field-level validation also applies the configured restart policy; model-level
skip applies only when the model-level flag is set. A preceding severe
validator may stop the loop before an async validator is reached; whether to
cancel that old work is open.

The host can make the synchronous and asynchronous paths easier to read by
extracting `processValidatorResult()` and keeping pending-result processing
in a separate helper:

```ts
// Inside the existing validator loop; helpers are described below.
let validatorResult: ValidatorValidateResult | Promise<ValidatorValidateResult>;
let context: IPendingContext | null = null;

if (isAsyncValidator(validator) && validator.isPendingResponsible(options)) {
    if (runGeneration !== this._validationGeneration)
        break;
    context = validator.pendingContext;
    if (!context)
        throw new CodingError('Responsible validator has no pending context');
    validatorResult = context.promise;
} else {
    if (runGeneration !== this._validationGeneration)
        break;
    validatorResult = validator.validate(options);
    if (validatorResult instanceof Promise && isAsyncValidator(validator)) {
        const current = validator.pendingContext;
        if (current && current.promise === validatorResult)
            context = current;
    }
}

if (validatorResult instanceof Promise) {
    // Observe the returned Promise even if its run became obsolete in validate().
    processPendingResult(validatorResult, validator, context);
    if (runGeneration !== this._validationGeneration)
        break;
    if (isAsyncValidator(validator) && !context)
        recordMissingContextFailure(validator);
} else {
    if (runGeneration !== this._validationGeneration)
        break;
    stop = processValidatorResult(validatorResult, validator);
}
```

`processValidatorResult()` extracts the existing synchronous result handling
and returns whether a severe or preliminary required issue stops the loop.
`processPendingResult()` adapts the existing `processPromise()` processing;
do not duplicate its issue, warning, severity, failure identity, pending-flag
or callback logic. `recordMissingContextFailure()` is an illustrative helper
that logs and blocks the current run without dropping its completion.

The context can be absent after `validate()` returns: the handler may have
synchronously caused cancellation or started a replacement operation. Never
associate the returned Promise with a different context, and do not discard
the returned Promise or its completion merely because the context is gone.
If the run is obsolete, its completion observes the outcome but cannot publish
it. A missing or mismatched context on a still-current run is an integration
error: log it and ensure the run blocks rather than authorizing a save.
On value changes, reset, dependency notifications, clear, disable, replacement
and disposal, invalidate the relevant host run and apply the chosen context
lifecycle rules.

### Completion belongs to each host run

**Problem:** A validator Promise represents the validator's outcome, not the
completion of host processing. The same operation may be reused by multiple
host runs, each of which needs its own processing. Custom `IValidator`
implementations can return a Promise without providing an `IPendingContext`.

**Solution:** Keep validator-owned contexts separate from the host-run
completion Promises. Both are exposed on the synchronously returned host result:

```ts
export interface ValueHostValidateResult extends StatefulValueHostValidateResult {
    pending?: IPendingContext[] | null;
    completions?: Promise<void>[] | null;
}
```

`pending` contains only participating AsyncValidator contexts that could be
matched to their returned Promises. A custom Promise validator, or an obsolete
call whose context is no longer available, has no entry there. It is not a
complete count of the host's pending work.

`completions` contains one Promise per validator Promise for **this host run**,
including reused work and custom validators. Each completion settles only
after the corresponding outcome has been processed or rejected as obsolete,
including handling any processing error. A reused context therefore appears
in both host results, but each result has a different completion. Do not put
a mutable run completion on the context.

Keep both properties off the stateful base and out of instance state and
serialized state. This changes a public result shape; audit custom hosts and
existing callers. The host maintains a separate per-run count of unfinished
processing to drive `asyncProcessing`, corrected state, and removal of pending
contexts; do not infer those from `pending` alone. Retain the completion list
on the returned result after settlement, so a caller can still observe a
processing failure. The manager copies the list before waiting.

```ts
// Sketch inside processPendingResult(), for new, reused and custom work.
// remaining and result belong to this particular host validation run.
remaining++;
if (context)
    (result.pending ??= []).push(context);

const outcome = validatorPromise.then(
    value => ({ fulfilled: true as const, value }),
    error => ({ fulfilled: false as const, error: ensureError(error) })
);
const completion = outcome.then(outcome => {
    try {
        removePendingForThisRun(context); // also decrements remaining
        if (outcome.fulfilled) {
            if (runGeneration === self._validationGeneration)
                applyResolvedValidatorResult(outcome.value, validator);
        } else {
            logValidatorFailure(outcome.error);
            if (runGeneration === self._validationGeneration)
                recordBlockingFailure(validator, outcome.error);
        }
    }
    catch (error) {
        logHostProcessingFailure(error);
        if (runGeneration === self._validationGeneration)
            recordBlockingFailure(validator, error);
        throw error;
    }
    if (!outcome.fulfilled)
        throw outcome.error; // the manager must also see validator rejection
});

(result.completions ??= []).push(completion);
// Direct field calls may not await the returned result. The rejection is
// handled here without changing the original Promise awaited by the manager.
void completion.catch(() => {});
```

The code above is a control-flow sketch, not a drop-in implementation:
`removePendingForThisRun` and the error-reporting helpers are illustrative.
They must use the existing logging and state-update paths and handle failures
in those paths. The implementation must:

- Decrement the run's pending count and remove only its matching context
  before publishing the updated host state, including for obsolete runs.
  Remove `pending` when its last context is removed. Retain `completions`.
- Register a completion for every returned Promise, even if a reentrant change
  has made the run obsolete or no matching context can be collected.
- Handle a rejection from a custom validator as a logged blocking failure,
  even though it has no async identity. Handle exceptions during host
  processing similarly. The completion rejects so manager `allSettled` can
  detect the failure; direct field calls must still observe the rejection.
- If an error occurs before normal removal, remove that run's pending entry
  and clear its pending flag as appropriate. Do not let error handling itself
  silently turn a failed completion into success.
- Return a non-null host result whenever a completion was registered, even if
  there is no context and the synchronous status is Undetermined.

For example, the synchronous publish and the final-return check must use the
complete set of work, not only the AsyncValidator context list:

```ts
if (remaining > 0)
    stateToUpdate.asyncProcessing = true;
else
    delete stateToUpdate.asyncProcessing;

return result.status !== ValidationStatus.Undetermined ||
    result.issuesFound !== null || result.completions?.length
    ? result : null;
```

If a still-current AsyncValidator's context cannot be matched, report a
blocking integration failure while continuing to observe its returned Promise.
An obsolete run must never apply a result or clear a newer run's state.
The manager must also treat an obsolete call as blocking; merely settling the
old completion cannot authorize saving.

After an async result updates the host, request
`valueHostsManager.notifyValidationStateChanged(null, options)` through its
existing debounced path as well as the host callback. Respect `skipCallback`.
The existing host callback helper already makes that manager request; avoid
adding a duplicate. The manager sends its own final notification after its
wait; do not suppress unrelated field notifications. Ensure a host callback
exception is logged without losing the blocking result or leaving a rejected
Promise unobserved.

## 5. Manager orchestration

**Problem:** The existing manager returns a synchronous snapshot even while
host processing is pending. A later change or another validation can make
that snapshot obsolete.

**Solution:** The public manager contract returns a Promise exclusively.
Field-host `validate()` stays synchronous.

```ts
// IValueHostsManager and ValueHostsManager
validate(options?: ValidateOptions): Promise<ValidationState>;

// Proposed public flag on ValidateOptions; final name is open.
interface ValidateOptions {
    isModelLevel?: boolean;
}

// Application submit code
const state = await valueHostsManager.validate();
if (state.doNotSave)
    return;
// Submit the values validated by this call.
```

The following shows the control flow, not a drop-in method. The helper
contracts immediately below are required parts of the implementation.

```ts
async validate(options?: ValidateOptions): Promise<ValidationState> {
    const hostOptions: ValidateOptions = {
        ...options,
        isModelLevel: true
    };
    const completions: Promise<void>[] = [];
    let failure: Error | undefined;
    let run: ManagerValidationRun | undefined;

    try {
        run = this.beginValidationRun(hostOptions);
        for (const vh of this.validatableValueHost()) {
            if (hostOptions.preliminary &&
                vh.validationStatus !== ValidationStatus.NotAttempted &&
                vh.validationStatus !== ValidationStatus.NeedsValidation)
                continue;

            const result = vh.validate(hostOptions);
            if (result?.completions)
                completions.push(...result.completions);
            this.recordHostRun(run, vh);
        }
    }
    catch (error) {
        failure = ensureError(error);
        this.reportValidationFailureSafely(failure);
    }

    // Do not abandon already-started work when a later host fails to start.
    if (completions.length) {
        const settled = await Promise.allSettled(completions);
        for (const item of settled) {
            if (item.status === 'rejected') {
                failure ??= ensureError(item.reason);
                // Host processing logs its own error; avoid logging it twice.
            }
        }
    }

    return this.finishValidationRun(run, options, failure);
}
```

Required behavior of the proposed helpers:

- `beginValidationRun`: retain participating host identities and input
  versions, including declared async dependencies; initialize calculations
  consistently with section 2. Track run/generation identity so a newer
  validation, clear, discard, restore, disposal or reentrant validation can
  invalidate this call. No manager-wide active-operation count is needed.
- `recordHostRun`: capture the *generation actually used by that host run*,
  not merely its generation after a reentrant callback. Verify already-visited
  hosts when later synchronous callbacks can change them.
- Copy `result.completions` from each host immediately after `validate()`
  returns. These belong to that particular host run and include custom
  Promise-returning validators; do not await `context.promise` instead.
- `finishValidationRun`: after all host completions, check identities, counters
  and generations again. If this call was made obsolete, return a **blocking**
  state rather than treating an old skipped Promise as success. Do not
  automatically retry indefinitely. Preserve the caller's group unchanged,
  including undefined, and the existing group filtering.
- Convert unexpected startup, result-processing, snapshot and final-notification
  errors into a logged blocking result. An ordinary exception caught while a
  synchronous condition is evaluated is logged and becomes `Undetermined`;
  it is not an operational failure for the manager to turn into a block.
  The validator intentionally rethrows `SevereErrorBase` exceptions; the
  manager must catch those and return a logged blocking result.
- If a host starts work and then throws before returning its result, it must
  still observe and clean up those started operations. The manager cannot
  collect completion records from a call that did not return.
- Create the final snapshot only after host processing. Respect `skipCallback`;
  otherwise issue the final manager notification with delay disabled, as the
  existing manager does. If the callback throws, log it and return a blocking
  state. Do not let a queued intermediate notification overwrite a newer
  snapshot with stale data.

The manager's error boundary must also cover the helpers, awaited completion,
logging and notification. If normal state creation fails, use a last-resort
state with `isValid: false` and `doNotSave: true`; do not manufacture a
successful result. The exact diagnostic representation is unresolved. The
existing `ValidationState` has no error field; if logging itself can throw,
the implementation needs an explicit fallback reporting mechanism compatible
with the always-fulfill contract.

With no completions, do not insert an unnecessary async wait before creating
the final snapshot. Returning from an `async` method still supplies a
fulfilled Promise. Review `valuesInitialized()`, which currently returns
`void` and calls manager `validate({ preliminary: true })`; preserve its
initialization and callback timing or explicitly migrate its contract.

### Timeout issue for the Validation Summary

Per-validator timeouts are already reported by `AsyncValidator` as
validator-owned blocking issues on the originating ValueHost. They require no
separate model-level timeout issue or timeout-specific message. A distinct
manager-level deadline, if introduced for waiting on a group of validators,
would be a separate feature and is not specified here.

## 6. Migration and end-user documentation

Update [Async Validators](../docs/API/Validators/Async_Validators.md),
[Configuration](../docs/API/Validators/Configuration.md),
[Invoking Validation](../docs/API/Validators/Invoking_Validation.md),
[Validation State](../docs/API/Validators/Validation_State.md), and
[Submitting the Client Form](../docs/Learning_Jivs/Submitting_the_Client_Form.md),
plus API comments and affected examples.

### Handler authors

The following examples show two ways to write the same handler. In an
`async` function, `throw` rejects its returned Promise. Jivs catches that
rejection, logs the error, and blocks saving. A normal validation failure,
such as an unavailable name, returns `NoMatch` instead of throwing.


**Using `async`/`await`:**

```ts
const checkAvailability: AsyncValidatorEvaluateHandler =
    async (valueHost, manager, signal) => {
        const value = valueHost.getValue();
        if (typeof value !== 'string' || !value)
            return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
        const response = await fetch(
            `/availability?name=${encodeURIComponent(value)}`, { signal });
        if (!response.ok)
            throw new Error(`Availability check failed: ${response.status}`);
        const answer = await response.text();
        if (answer !== 'available' && answer !== 'taken')
            throw new Error('Unexpected availability response');
        return answer === 'available'
            ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
            : {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken',
                errorMessage: 'This name is already in use.'
            };
    };
```

**Using an explicit Promise:**

```ts
const checkAvailability: AsyncValidatorEvaluateHandler =
    (valueHost, manager, signal) =>
        new Promise<AsyncValidatorEvaluationResult>((resolve, reject) => {
            const value = valueHost.getValue();
            if (typeof value !== 'string' || !value) {
                resolve({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined });
                return;
            }

            fetch(`/availability?name=${encodeURIComponent(value)}`, { signal })
                .then(response => {
                    if (!response.ok)
                        throw new Error(`Availability check failed: ${response.status}`);
                    return response.text();
                })
                .then(answer => {
                    if (answer !== 'available' && answer !== 'taken')
                        throw new Error('Unexpected availability response');
                    return answer === 'available'
                        ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
                        : {
                            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                            errorCode: 'NameTaken',
                            errorMessage: 'This name is already in use.'
                        };
                })
                .then(resolve, reject);
        });
```

In the Promise example, a `throw` inside a `.then()` rejects that chain;
the final `.then(resolve, reject)` forwards its result or error to the
handler's Promise. An error thrown directly inside the Promise executor also
rejects it. For an API that reports errors through a callback, the handler
can call `reject(error)` directly. Since `fetch` already returns a Promise,
returning its chain without wrapping it in `new Promise` is also valid.

**Cancellation versus errors:** Jivs owns the operation's `AbortController`
and automatically observes its signal. When Jivs cancels, the handler does
not need to check `signal.aborted` or register a listener for Jivs to stop
waiting. Passing the signal to an API such as `fetch` lets that API stop its
own work. The handler may still need to check the signal or use a listener
to stop its own multistep work, side effects, or resources.

The supplied `AbortSignal` cannot initiate cancellation: it has no instance
`abort()` method. Only its controller can abort it, and that controller
belongs to Jivs. The static `AbortSignal.abort()` creates a separate
already-aborted signal; it does not cancel the signal passed to the handler.
The proposed contract does not expose a way for a handler to request Jivs
cancellation.

Use `throw new Error(...)` (or `reject(error)`) for an unexpected failure
that should be logged and block saving, not as a substitute for Jivs
cancellation. An expected rejection caused by Jivs aborting the signal is
treated as cancellation; a handler's own error should not be assumed to be
cancellation merely because it resembles an abort error.

- Jivs catches a handler's thrown error/rejection, logs it and blocks saving.
  The handler may still catch an error, retry, or return `failedToResolve`.
  An expected abort rejection is cancellation, not an ordinary failure.
  No application abort listener is required just to make Jivs stop waiting.
- Passing `{ signal }` allows `fetch` to stop; it does not force arbitrary
  work or side effects to stop. After abort or timeout Jivs may proceed
  without waiting for application cleanup and ignores late validation results.
  Handlers must guard their own multistep work and side effects.
- Explain the two restart policies, default `WhenInputsChanged`, and the
  independent `skipOnModelLevelValidation` option, which takes precedence
  during model-level validation. Explain timeout settings and `doNotSave`
  versus `isValid`. Skip is suitable only when the application has an
  authoritative replacement validation.
- Declare all other ValueHosts read by the handler. Include a calculation
  host and every underlying field, including nested calculation inputs.
  External state and missed declarations are not tracked.
- The manager sets the proposed public model-level option without changing
  `group`. A direct host call uses that option explicitly; a group alone does
  not imply model-level validation. Direct host validation returns immediately.

### Manager callers

Replace synchronous state usage:

```ts
// Before
const state = valueHostsManager.validate();
if (!state.doNotSave)
    submit();

// After
const state = await valueHostsManager.validate();
if (!state.doNotSave)
    submit();
```

Audit TypeScript consumers, tests and examples, including
[DifferenceBetweenDates.ts](../packages/jivs-examples/src/DifferenceBetweenDates.ts)
and [workproduct.ts](../packages/jivs-angular/src/workproduct.ts), if that
Angular work product is maintained. Update wrapper return types, callbacks
and tests; do not change direct ValueHost `validate()` into an async method.
Review initialization callers that intentionally ignore the manager Promise.

## 7. Verification plan

Follow [Testing_Approach.md](../docs/assets/Testing_Approach.md): agree on one
class at a time with the owner, use Jest `expect()`, hand-written fakes and
logging assertions. Compile the repository with `npm run compile` before
cross-package tests. Cover the following without reimplementing the completed
counter work:

| Area | Required behavior |
| --- | --- |
| AsyncValidator | Owned context, both restart policies, skip precedence, defensive pending check, input counters and reentrant startup; normal outcomes, failures, timeout, abort, late errors, cleanup and disposal. |
| Host | Context collection and per-run completions; reused and new work; custom validators without contexts; multiple validators; reentrant replacement; generation protection; rejected and throwing processing, state and notifications. |
| Manager | No async work; multiple hosts and validators; unchanged groups and explicit model-level flag; preliminary; waits for host processing; overlapping runs, edits, reset, clear, replacement and disposal while waiting; failures; always fulfilled and blocked when obsolete. |
| Failure issues | Timeout and other operational failures produce validator-owned issues; cover localization, retry/clear and preservation of external issues. |
| Builder and migration | Options-object form, invalid settings, Promise return types, affected examples and wrapper consumers. |

## Decisions before implementation

1. Timeout and other operational failures use the implemented validator-owned
   issue design; no separate timeout summary issue is required.
2. Field-level validation uses the same restart policy; retain model-level skip
   only for calls with the model-level flag.
3. Audit custom hosts and callers for the separate context and per-run
   completion collections when implementing manager orchestration.
4. Finalize obsolete-manager-call diagnostics and tracking for restoration,
   reentrancy, overlapping calls and calculation initialization. It must block
   rather than authorize saving stale values.
5. Define expected abort errors across supported runtimes and a reporting
   fallback if the logging service throws. The manager Promise must fulfill.
6. Resolve the `isChanged` mismatch: the design specifies
   `changeCounter > baseChangeCounter`, while `ValueHostBase` currently
   compares `changeCounter - baseChangeCounter > baseChangeCounter`.
   Custom-native-value equality remains deferred as in the design.
