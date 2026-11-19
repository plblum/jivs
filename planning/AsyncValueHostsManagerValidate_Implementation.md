# Async ValueHostsManager Validation: Implementation

## Status and scope

Implementation guide for [AsyncValueHostsManagerValidate_Design.md](./AsyncValueHostsManagerValidate_Design.md).
The snippets below are **proposed**, not current APIs. They show changes to
existing objects; named helper calls in orchestration snippets specify work
to implement, not methods that already exist. The design still has decisions
listed in [Decisions before implementation](#decisions-before-implementation).

The order below delivers `AsyncValidator` behavior first, then host
coordination, then manager orchestration. Do not change synchronous
`ICondition.evaluate()` or add model-level validators as part of this work.

## Files and ownership

| Object | Work |
| --- | --- |
| [AsyncValidator interfaces](../packages/jivs-engine/src/Interfaces/AsyncValidator.ts) | Handler signal, policy and timeout configuration. |
| [AsyncValidator](../packages/jivs-engine/src/Validation/AsyncValidator.ts) | Invoke and wrap the handler; timeout, abort and error conversion. |
| [ValidatorsValueHostBase](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) | Own contexts, select reuse/restart/skip, apply async results and protect current state. |
| [Validation interfaces](../packages/jivs-engine/src/Interfaces/Validation.ts) | Host completion records; manager still returns `ValidationState`. |
| [ValueHostsManager](../packages/jivs-engine/src/Validation/ValueHostsManager.ts), [manager interface](../packages/jivs-engine/src/Interfaces/ValueHostsManager.ts) | Await host processing, protect against obsolete runs, return and notify the final state. |
| [ValidatorBuilder](../packages/jivs-builder/src/Builder/ValidatorBuilder.ts), [builder interface](../packages/jivs-builder/src/Interfaces/ChildBuilders.ts) | Expose options while retaining existing dependency-array calls. |

```text
manager.validate()
  -> host.validate()                         // synchronous return
       -> reuse host-owned PendingContext OR
       -> AsyncValidator.validate()          // handler starts, Promise returned
       -> attach result processing for this host generation
  -> await all host-processing completions
  -> create final ValidationState and notify
```

## 1. Contracts and configuration

**Problem:** A handler cannot receive cancellation, and a manager pass cannot
choose what to do with existing work.

**Solution:** Extend the async-specific configuration. The enum and settings
names below are proposed; `MustFinish` is the agreed default.

```ts
export enum RestartWhenPending {
    MustFinish = 'MustFinish',
    Restart = 'Restart',
    SkipOnModelLevelValidation = 'SkipOnModelLevelValidation'
}

export type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatorsValueHost,
    valueHostsManager: IValueHostsManager,
    signal: AbortSignal
) => Promise<AsyncValidatorEvaluationResult>;

export interface AsyncValidatorConfig /* existing members remain */ {
    handlerIdentity: string;
    handler: AsyncValidatorEvaluateHandler;
    dependencyValueHostNames?: ValueHostName[];
    restartWhenPending?: RestartWhenPending;
    timeout?: number; // milliseconds
}
```

The actual interface must retain its existing `Omit<ValidatorConfig, ...>`
base. Existing two-argument handlers remain assignable to the new handler
type. An explicitly returned `failedToResolve` still works. A thrown error or
rejection becomes a logged, blocking failure instead of requiring a handler
to catch it.

Keep the current union on `IValidator.validate()`:

```ts
validate(options: ValidateOptions):
    ValidatorValidateResult | Promise<ValidatorValidateResult>;
```

An AsyncValidator can still return synchronously when disabled, during edit,
or during preliminary validation. Other custom `IValidator` implementations
can also return Promises; manager waiting must not silently exclude them.

### Builder compatibility

**Problem:** Introduce additional options into asyncValidator (breaking changes supported)

**Solution:** Introduce FluentAsyncValidatorConfig with dependencyValueHostNames, restartWhenPending, and timeout from AsyncValidatorConfig, and replace parameters on asyncValidator.

```ts
export type FluentAsyncValidatorConfig = Pick<AsyncValidatorConfig,
    'dependencyValueHostNames' | 'restartWhenPending' | 'timeout'>;

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

Retain the existing identity and handler checks. Reject invalid policy or
timeout values explicitly; do not silently turn an invalid timeout into a
default. The concrete timeout default and settings location remain open.

### Timeout settings

The intended precedence is:

```ts
const timeoutMs = asyncConfig.timeout ?? globalAsyncValidationTimeout;
```

Each operation gets its own timer; reuse does not restart it. Require a
finite positive duration within the supported timer range. Choose and document
the global default and settings location before implementing this expression;
`ValueHostsManager.behaviors` is a candidate, not an agreed API.

## 2. Host-owned context and input versions

**Problem:** When using restartWhenPending=MustFinish, must determine if any of the inputs used since the last validation have changed so that we can know if we can retain the existing promise or effectively restart.

**Solution:** Each validation attempt captures all change counters from the dependencyValueHostNames and compares them to the prior run to detect changes. Each ValidatorsValueHostBase maintains a map of all AsyncValidators that have running promises.

```ts
interface CapturedValueHostCounter {
    host: IValueHost;
    changeCounter: number;
}

interface PendingContext {
    validator: AsyncValidator;
    inputs: CapturedValueHostCounter[];
    promise: Promise<ValidatorValidateResult>;
}

// In ValidatorsValueHostBase; transient, not serialized instance state.
private readonly _pendingAsyncValidators = new Map<AsyncValidator, PendingContext>();
```

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
        const current = manager.getValueHost(input.name);
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

### Registration and cancellation handoff

The host must register the context **before** calling user code, because a
handler can synchronously re-enter validation or change an input. An
internal deferred Promise can be created and stored before calling
`validator.validate()`, then adopt the returned Promise. Attach rejection
handling before calling the handler. Remove the provisional context when the
validator returns a synchronous skipped result or startup fails.

The AsyncValidator owns its current controller. The ValueHost asks the
validator to cancel; no controller is passed in `ValidateOptions` or stored
in the host's context.

```ts
// AsyncValidator
private _activeController?: AbortController;

public cancelPending(): void {
    this._activeController?.abort();
}

// Host, when starting or cancelling:
const result = validator.validate(options);
// Later, when the current context must be cancelled:
validator.cancelPending();
```

Create a new controller for each started operation, not for the entire form
or permanently for the validator. A controller already aborted cannot be
reused. The host retains the Promise and input counters; the validator retains
only the current controller. Direct `AsyncValidator.validate()` calls use the
same controller and timeout mechanism.

Keep the existing `enabled`, `preliminary`, and `duringEdit` checks ahead of
starting a controller, timer or handler. Provide AsyncValidator accessors for
its configured policy and dependency names rather than accessing its
protected `config` from the host. Decide how custom async-validator
implementations expose these capabilities; do not assume that
`condition.category === Async` proves an instance is the concrete
`AsyncValidator`.

The provisional host context still requires a solution for synchronous
reentrancy; moving the controller does not solve registration. Also define
how direct or reentrant calls that start another operation on the same
validator coordinate with the host's context. Cancelling an old context must
never abort a newer operation.

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
to be chosen.

```ts
const logger = this.logger;
const handler = this.config.handler;
const valueHost = this.valueHost;
const manager = this.valueHostsManager;
const controller = new AbortController();
this._activeController = controller;
const signal = controller.signal;

return new Promise<ValidatorValidateResult>(resolve => {
    let finished = false;

    const finish = (result: ValidatorValidateResult): boolean => {
        if (finished)
            return false;
        finished = true;
        if (this._activeController === controller)
            this._activeController = undefined;
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
```

`reportUnexpectedLateFailureSafely` must recognize a known abort rejection without
silencing unrelated errors that happen after cancellation. For example, a
rejection equal to `signal.reason` is expected; browser `AbortError` handling
needs a documented, tested rule. The current logger must remain usable after
disposal. The diagnostic helpers must not
throw, including when a logging service throws; do not leave the wrapper
unresolved or produce an unobserved rejection. Preserve the existing
`_disposed` guard for direct validator calls as well as host-owned calls.

On timeout, first settle with `failedToResolve`, then abort. On restart/skip,
abort settles with `skipped`. A late handler result cannot replace either
outcome. Cancellation does not wait for handler cleanup or guarantee that
external work stops. An old operation's cleanup must not clear a newer
operation's controller. If startup fails after assigning the controller,
clear it only if it is still the active controller.

## 4. Host selection and completion

### Policy selection

**Problem:** A manager pass must reuse only eligible pending work, without
allowing an old operation to clear or overwrite a replacement.

**Solution:** Select the operation in the host's validator loop, immediately
before that validator would run. This closes the gap between a separate
preflight and actual invocation. The host can still expose
`hasAsyncValidators`, derived from `config.validatorConfigs` using
`isAsyncValidatorConfig()`, without constructing validators.

```ts
// Decision made by ValidatorsValueHostBase for a model-level validation.
const context = this._pendingAsyncValidators.get(validator);
switch (validator.restartWhenPending) {
    case RestartWhenPending.SkipOnModelLevelValidation:
        if (context)
            this.cancelContext(context);
        // Do not invoke or reuse this validator in this pass.
        break;

    case RestartWhenPending.MustFinish:
        if (context && inputsUnchanged(context.inputs, this.valueHostsManager)) {
            // Attach context.promise to THIS run's host result processing.
            reuse(context);
            break;
        }
        if (context)
            this.cancelContext(context);
        startNew();
        break;

    case RestartWhenPending.Restart:
        if (context)
            this.cancelContext(context);
        startNew();
        break;
}
```

For this design, `options.group !== undefined` identifies a model-level call,
including direct host calls with `group: ''` or `'*'`. For a manager call,
pass `group: options?.group ?? '*'` to hosts. Apply selection only to
validators the existing group/preliminary/enabled rules would actually run.
Define the separate field-level policy before implementing; do not silently
change its existing UX.

Remove the old context from eligibility **before** aborting it. Cleanup is
identity-based:

```ts
private cancelContext(context: PendingContext): void {
    if (this._pendingAsyncValidators.get(context.validator) === context) {
        this._pendingAsyncValidators.delete(context.validator);
        context.validator.cancelPending();
    }
}

private forgetIfCurrent(context: PendingContext): void {
    if (this._pendingAsyncValidators.get(context.validator) === context)
        this._pendingAsyncValidators.delete(context.validator);
}
```

On value changes, reset, dependency notifications, clear, disable, replacement
and disposal, invalidate the relevant run and contexts. Abort on disposal
before disposing validators and their logger/config references. A replacement
context must survive completion of its predecessor.

### Completion belongs to each host run

**Problem:** `ValueHostValidateResult.pending` currently contains raw
validator Promises. Waiting for one does not wait for
`processPromise()` to update the host. A reused validator Promise also needs
to be applied to the new `_validationGeneration`.

**Solution:** A context retains the validator Promise; each host run attaches
its own processing Promise. The result returned synchronously contains
records for that run:

```ts
export interface PendingValidation {
    // Settles after this run has applied or rejected the result.
    completion: Promise<void>;
}

export interface ValueHostValidateResult extends StatefulValueHostValidateResult {
    pending?: PendingValidation[] | null;
}
```

This changes a public result shape. Audit custom `IValidatableValueHost`
implementations and existing callers before adopting it; preserving the old
property and adding a separate completion property is an alternative requiring
an explicit decision. Copy pending records before awaiting, because the host
may remove them during settlement.

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
            recordBlockingFailure(context.validator, error);
    }
).catch(error => {
    // Includes exceptions in host result processing, not just the handler.
    logHostProcessingFailure(error);
    if (runGeneration === this._validationGeneration)
        recordBlockingFailure(context.validator, error);
    throw error; // manager's allSettled also sees the processing failure
});

result.pending ??= [];
result.pending.push({ completion });
```

This is an integration sketch: adapt the existing `processPromise()` closure
rather than duplicating its issue, warning, severity, `failedAsyncIdentities`,
pending-flag and callback logic. Remove each run's pending entry before
publishing state, including obsolete runs. Check both generation and context
identity before mutating retained contexts or pending state. Always observe
the completion rejection, including for direct field-level validation.
Custom Promise-returning validators need equivalent host-processing
completions and blocking failure behavior.

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
        group: options?.group ?? '*'
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
            if (result?.pending)
                completions.push(...result.pending.map(item => item.completion));
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
- `finishValidationRun`: after all host completions, check identities, counters
  and generations again. If this call was made obsolete, return a **blocking**
  state rather than treating an old skipped Promise as success. Do not
  automatically retry indefinitely. Preserve current group filtering; the
  internal `'*'` need not change the externally reported group when the
  caller omitted it.
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

**Problem:** Timeout must block even without a displayed issue. When a global
message is configured, a model-level timeout issue must also be displayed and
later removed without clearing application or server issues.

**Solution:** Keep timeout failure on the originating host via
`failedAsyncIdentities`; maintain a separate engine-owned timeout issue per
operation or equivalent keyed ownership. Aggregate it into model-level
`getIssuesFound` / `ValidationState` for the relevant group:

```ts
const timeoutIssue: IssueFound = {
    valueHostName: ModelValidatorsValueHostName,
    errorCode: ASYNC_VALIDATION_TIMEOUT_ERROR_CODE,
    errorMessage: localizedTimeoutMessage,
    severity: ValidationSeverity.Error,
    doNotSave: true
};
```

The constant, message settings, localization path, group association and
specific storage API remain to be selected. Clear only the engine-owned issue
for the retried/cleared operation; support simultaneous timeouts. Do **not**
use manager `addExternalIssuesFound()` as a shortcut: it clears all previous
external issues. Ensure summary queries and notifications see the issue even
when no `ModelValidatorsValueHost` existed before the timeout.

## 6. Migration and end-user documentation

Update [Async Validators](../docs/API/Validators/Async_Validators.md),
[Configuration](../docs/API/Validators/Configuration.md),
[Invoking Validation](../docs/API/Validators/Invoking_Validation.md),
[Validation State](../docs/API/Validators/Validation_State.md), and
[Submitting the Client Form](../docs/Learning_Jivs/Submitting_the_Client_Form.md),
plus API comments and affected examples.

### Handler authors

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

- Jivs catches a handler's thrown error/rejection, logs it and blocks saving.
  The handler may still catch an error, retry, or return `failedToResolve`.
  No application abort listener is required just to make Jivs stop waiting.
- Passing `{ signal }` allows `fetch` to stop; it does not force arbitrary
  work or side effects to stop. After abort or timeout Jivs may proceed
  without waiting for application cleanup and ignores late validation results.
  Handlers must guard their own multistep work and side effects.
- Explain the three policies, default `MustFinish`, timeout settings, and
  `doNotSave` versus `isValid`. `SkipOnModelLevelValidation` is suitable only
  when the application has an authoritative replacement validation.
- Declare all other ValueHosts read by the handler. Include a calculation
  host and every underlying field, including nested calculation inputs.
  External state and missed declarations are not tracked.
- A defined group on a direct host call is treated as model-level, including
  `''` and `'*'`. Direct host validation still returns immediately.

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
| AsyncValidator | Normal outcomes, explicit failure, sync throw, rejection, malformed result, logger behavior, timeout, abort before/during handler, late expected and unexpected failures, timer/listener cleanup, disposal, handler that never settles. |
| Host | `MustFinish` reuse and changed inputs; `Restart`; skip; owner/dependency replacement; missing dependency; reentrant startup; field-level behavior; multiple validators; generation and identity protection; rejected host processing; state and notification updates. |
| Manager | No async work; multiple hosts and validators; groups and preliminary; waits for host processing; overlapping runs, edits, reset, clear, replacement and disposal while waiting; rejected startup/processing and notification; always fulfilled and blocked when obsolete. |
| Timeout summary | With and without a message, localization, group visibility, multiple timeouts, retry/clear cleanup, and preservation of external/server issues. |
| Builder and migration | Array and options forms, invalid settings, Promise return types, affected examples and wrapper consumers. |

## Decisions before implementation

1. Choose global timeout default, location, timeout-message settings and
   localization/issue ownership. Timeout itself and blocking are required.
2. Choose field-level pending policy; manager-level policies above are agreed.
3. Finalize internal context registration and public pending-result
   compatibility, including custom validators and custom hosts.
4. Finalize obsolete-manager-call diagnostics and tracking for restoration,
   reentrancy, overlapping calls and calculation initialization. It must block
   rather than authorize saving stale values.
5. Define expected abort errors across supported runtimes and a reporting
   fallback if the logging service throws. The manager Promise must fulfill.
6. Resolve the `isChanged` mismatch noted above; custom-native-value equality
   remains deferred as in the design.
