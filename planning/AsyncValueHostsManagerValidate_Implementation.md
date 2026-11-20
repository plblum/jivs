# Async ValueHostsManager Validation: Implementation

## Status and scope

Implementation guide for [AsyncValueHostsManagerValidate_Design.md](./AsyncValueHostsManagerValidate_Design.md).
Configuration, `AsyncValidator` pending policies and timeout, and the
ValueHost policy handoff are implemented. The manager's async orchestration,
run-specific host completion, and timeout summary issue remain to be built.
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
| [Validation interfaces](../packages/jivs-engine/src/Interfaces/Validation.ts) | Model-level option and `PendingContext` results; manager still returns `ValidationState`. |
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

```ts
// Inside ValidatorsValueHostBase's existing validator loop.
if (isAsyncValidator(validator) &&
    validator.isPendingResponsible(options)) {
    const context = validator.pendingContext;
    if (!context)
        throw new CodingError('Responsible validator has no pending context');
    processPendingContext(context, validator);
} else {
    const validatorResult = validator.validate(options);
    if (isAsyncValidator(validator) && validatorResult instanceof Promise) {
        const context = validator.pendingContext;
        if (!context)
            throw new CodingError('Async validator returned a Promise without a pending context');
        processPendingContext(context, validator);
    } else {
        processValidatorResult(validatorResult, validator);
    }
}
```

Helper names are illustrative: integrate with the existing synchronous
result handling and `processPromise()` rather than duplicating them. The
returned Promise and context must belong to the same operation. Resolve
reentrant cancellation/replacement between `validate()` and context
collection without attaching a different operation or treating the old
call as save-allowed. On value changes, reset, dependency notifications,
clear, disable, replacement and disposal, invalidate the relevant host run
and apply the chosen context lifecycle rules.

### Completion belongs to each host run

**Problem:** `ValueHostValidateResult.pending` currently contains raw
validator Promises. Waiting for one does not wait for
`processPromise()` to update the host. A reused validator Promise also needs
to be applied to the new `_validationGeneration`.

**Solution:** A validator-owned context retains the validator Promise; each
host run attaches its own processing Promise. The result returned
synchronously exposes the participating contexts:

```ts
export interface ValueHostValidateResult extends StatefulValueHostValidateResult {
    pending?: PendingContext[] | null;
}
```

Keep `pending` off the stateful base and out of instance state and serialized
state. This changes a public result shape; audit custom hosts and existing
callers. Copy pending entries before awaiting because the host may remove them
during settlement.

```ts
// Inside the host's validate() closure, for BOTH new and reused work.
const runGeneration = this._validationGeneration;
const completion = context.promise.then(
    validatorResult => {
        if (runGeneration !== this._validationGeneration)
            return;
        applyResolvedValidatorResult(validatorResult);
    },
    error => {
        logValidatorFailure(error);
        if (runGeneration === this._validationGeneration)
            recordBlockingFailure(validator, error);
    }
).catch(error => {
    // Includes exceptions in host result processing, not just the handler.
    logHostProcessingFailure(error);
    if (runGeneration === this._validationGeneration)
        recordBlockingFailure(validator, error);
    throw error; // manager's allSettled also sees the processing failure
});

result.pending ??= [];
result.pending.push(context);
registerHostCompletionForThisRun(context, completion);
```

This is an integration sketch: adapt the existing `processPromise()` closure
rather than duplicating its issue, warning, severity, `failedAsyncIdentities`,
pending-flag and callback logic. Remove each run's pending entry before
publishing state, including obsolete runs. Check both generation and context
identity before mutating retained contexts or pending state. Always observe
the completion rejection, including for direct field-level validation.
Custom Promise-returning validators need equivalent host-processing
completions and blocking failure behavior. `registerHostCompletionForThisRun`
is not an existing API: the mechanism for associating completions with a
specific host run and exposing them to the manager remains open. Do not put
a single mutable run completion on a reused context where overlapping runs
could overwrite one another.

After an async result updates the host, request
`valueHostsManager.notifyValidationStateChanged(null, options)` through its
existing debounced path as well as the host callback. Respect `skipCallback`.
The manager sends its own final notification after its wait; do not suppress
unrelated field notifications. Ensure a host callback exception is logged
without losing the blocking result or leaving a rejected Promise unobserved.

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
            if (result)
                completions.push(...this.collectHostCompletions(vh, result));
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
- `collectHostCompletions`: obtain the completions for this specific host
  run's participating contexts, including retained and newly started work.
  The mechanism is not yet designed; awaiting `context.promise` alone is
  insufficient. Cover Promise-returning custom validators too.
- `finishValidationRun`: after all host completions, check identities, counters
  and generations again. If this call was made obsolete, return a **blocking**
  state rather than treating an old skipped Promise as success. Do not
  automatically retry indefinitely. Preserve the caller's group unchanged,
  including undefined, and the existing group filtering.
- Convert startup, result-processing, snapshot and final-notification errors
  into a logged blocking result. Existing host `validate()` catches some
  non-severe synchronous errors and returns `Undetermined`; change that path
  or add an explicit failure signal for manager calls so such errors cannot
  become save-allowed.
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
| Host | `IAsyncValidator` type guard and context collection; retained and new work; custom validators; multiple validators; generation and identity protection; host-processing failure, state and notifications. |
| Manager | No async work; multiple hosts and validators; unchanged groups and explicit model-level flag; preliminary; waits for host processing; overlapping runs, edits, reset, clear, replacement and disposal while waiting; failures; always fulfilled and blocked when obsolete. |
| Timeout summary | With and without a message, localization, group visibility, multiple timeouts, retry/clear cleanup, and preservation of external/server issues. |
| Builder and migration | Options-object form, invalid settings, Promise return types, affected examples and wrapper consumers. |

## Decisions before implementation

1. Implement the existing global timeout and message settings; choose
   localization and issue ownership. Timeout itself and blocking are required.
2. Field-level validation uses the same restart policy; retain model-level skip
   only for calls with the model-level flag.
3. Finalize validator context registration, the `IAsyncValidator` type
   guard, and run-specific host completion, including custom validators and
   custom hosts.
4. Finalize obsolete-manager-call diagnostics and tracking for restoration,
   reentrancy, overlapping calls and calculation initialization. It must block
   rather than authorize saving stale values.
5. Define expected abort errors across supported runtimes and a reporting
   fallback if the logging service throws. The manager Promise must fulfill.
6. Resolve the `isChanged` mismatch: the design specifies
   `changeCounter > baseChangeCounter`, while `ValueHostBase` currently
   compares `changeCounter - baseChangeCounter > baseChangeCounter`.
   Custom-native-value equality remains deferred as in the design.
