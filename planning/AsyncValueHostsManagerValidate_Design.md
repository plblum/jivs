# Async ValueHostsManager Validation Design

## Purpose and status

This is a working design for async validation, not the implementation plan.
The first implementation is intended to focus on `AsyncValidator` and the
contracts it needs. `ValueHostsManager.validate()` is a separate orchestration
concern, to be implemented after the per-validator behavior is designed.

The [planning document](./AsyncValueHostsManagerValidate_Planning.md) records
earlier exploration. The two original workflow drafts are preserved at the end
of this document; the integrated workflow below is the current baseline.
Later discussion of cancellation, cleanup, and stale-result protection may
refine it. Once the behavior is settled, create a separate implementation
design covering changes and tests.

## Context and scope

- `ICondition.evaluate()` is synchronous. Async validation is performed by
  `AsyncValidator`; the shared `IValidator` return type permits both
  synchronous and asynchronous validators.
- ValueHost `validate()` remains synchronous and returns its immediate
  `ValueHostValidateResult | null`. Its async work completes later, allowing
  field-level validation to avoid delaying the user.
- Manager `validate()` is associated with a submit-style operation. It returns
  `Promise<ValidationState>`, including when there is no async work, and the
  Promise must fulfill with a state even for unexpected engine errors.
- Forms usually have no AsyncValidators; one is unusual and multiple on a
  single ValueHost rarer still. The design must nevertheless support multiple
  operations, including the anticipated model-level validators, without
  adding coordination complexity solely for scale.
- The current `ModelValidatorsValueHost` handles external issues rather than
  configured validators. Model-level AsyncValidators remain anticipated future
  work, not an existing capability.

## AsyncValidator design changes

### Responsibilities and pending operation

An AsyncValidator invokes the handler, translates its result, owns its
`PendingContext`, and manages the operation's pending policy, cancellation,
and timeout. The context includes its Promise and captured input counters.
Expose the current context through `IAsyncValidator` so callers can identify
pending work. The owning ValueHost applies validator results to its own state and
returns the participating contexts to the manager. The manager coordinates
only the work participating in its validation.

Each AsyncValidator has its own pending operation and controller; there is no
single controller for a manager validation. Context creation must occur before
user code can re-enter validation. Cleanup of an older operation must not
clear a replacement context. The exact context fields, public mutability, and
registration mechanics remain to be designed.

The handler retains its existing `valueHost` and `valueHostsManager`
parameters and an `AbortSignal`. It reads values using the existing APIs;
no `AsyncValueStateManager`, automatic read tracker, or manager-wide tracker
is required by this design.

```ts
// Current handler contract.
type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatorsValueHost,
    valueHostsManager: IValueHostsManager,
    cancellation: AbortSignal
) => Promise<AsyncValidatorEvaluationResult>;
```

The host currently processes validator Promises to update its own state.
The proposed `ValueHostValidateResult.pending` is an array of
`PendingContext` objects instead of the bare Promises currently exposed by
`ValueHostValidateResult.pending`. The host return remains immediate.

```ts
// Proposed addition; other existing result properties remain.
interface ValueHostValidateResult {
    pending?: PendingContext[] | null;
}
```

`ValueHostValidateResult` extends `StatefulValueHostValidateResult`, which is
also part of `ValidatableValueHostBaseInstanceState`. Keep `pending` on
`ValueHostValidateResult`, not the stateful base: contexts are live runtime
objects, not persisted state. Do not copy them into instance state or serialize
them in `captureState()`. The existing
`asyncProcessing` state flag can continue to reflect pending work. Restore and
cleanup must not recreate live contexts from serialized data.

The manager must wait for host-side result processing, not just for the
validator Promise. How each context is associated with a particular host
run's processing completion remains open, especially when an operation is
reused in another host generation. Promise-returning custom validators also
need to remain covered.

### Configuration and dependency contract

`AsyncValidatorConfig` retains `handler`, `handlerIdentity`, and
`dependencyValueHostNames`, and now includes `restartWhenPending`,
`skipOnModelLevelValidation`, and a timeout override. These configuration
properties and the builder options object exist. `AsyncValidator` now applies
the restart, model-level skip, and timeout behaviors; manager orchestration
and the timeout summary issue remain to be implemented.
`WhenInputsChanged` is the specified default.

```ts
// Illustrative additions to AsyncValidatorConfig.
dependencyValueHostNames?: ValueHostName[];
restartWhenPending?: RestartWhenPending; // defaults to WhenInputsChanged
skipOnModelLevelValidation?: boolean; // defaults to false
timeout?: number; // milliseconds; overrides the global default
```

The builder accepts an options object:

```ts
asyncValidator(
    identity: string,
    handler: AsyncValidatorEvaluateHandler,
    options?: FluentAsyncValidatorConfig
): IValidatorBuilder;
```

The options contain async configuration other than `validatorType`,
`handlerIdentity`, and `handler`, which are supplied separately. The former
third-argument dependency array is replaced by this options object.

With `restartWhenPending=WhenInputsChanged`, the active promise is retained only if
the source values it uses have not changed. Before starting a handler, capture
the owning ValueHost's counter and the counters of all explicitly declared
dependency ValueHosts in the pending context.
The operation retains those counters for comparison on a subsequent
validation attempt. A different counter means the inputs may have changed.
No values need to be captured merely to perform this comparison.

Developers must declare every other ValueHost whose value influences the
handler. If it reads a CalcValueHost, declare the underlying ValueHosts used
by the calculation, including inputs of nested calculations, so their
changes are visible both to the counter check and to dependency notifications.
Include the calculation host itself when it is a value used by the handler.
The owner is captured automatically; it need not be repeated in the list.
Incomplete declarations and external inputs cannot be detected automatically.
Missing or unresolvable declared hosts must be treated as an explicit
configuration failure, not silently considered unchanged.

`AsyncValidator.gatherValueHostNames()` continues to contribute the configured
names. The owning validatable host's existing aggregate dependency cache can
remain in use because the configuration is stable. A notification for a
declared name can mark the owner as needing validation or trigger validation
according to the existing notification rules. No special AsyncValidator list
or dynamic-cache invalidation is needed for dependency discovery.

### Pending policies

These policies apply when field-level or manager-level validation encounters
this validator:

1. **`WhenInputsChanged`** (default): reuse the existing promise if the captured
   owner and dependency counters are unchanged. If any input counter differs,
   restart the operation.
2. **`Always`:** request cancellation of the old operation, exclude its
   result from this pass, and start fresh work in the validation pass. A
   cancellation request does not guarantee that the old handler has stopped.

The independent **`skipOnModelLevelValidation`** option can be combined with
either restart policy. When true, manager-level validation requests
cancellation of existing work, does not use its result, and skips starting
the handler for this pass. This takes precedence over the restart policy and
supports a case such as authoritative server-side validation.

The proposed `isPendingResponsible(validatorOptions)` applies the restart
policy to the validator's own context. Its parameter uses the existing
`ValidateOptions` type (the validator options passed to `validate()`):

- **True:** unchanged `WhenInputsChanged` work is responsible for this
  validation; the ValueHost uses the existing context instead of calling
  `validate()` again.
- **False:** there is no eligible retained operation. This includes no pending
  work, `Always`, or changed inputs. Request cancellation when needed, then
  the ValueHost calls `validate()`.

`AsyncValidator.validate()` also defensively stops rather than starting a
second operation if a pending operation remains active. How that defensive
stop is represented must not silently allow saving or lose pending work.

Model-level skip takes precedence over reuse: when it applies, old work is
cancelled and cannot be returned as responsible even when its inputs are
unchanged. A false result still leads to `validate()`, which must skip rather
than start a handler for that model-level call, including when there was no
previous pending operation.

`isPendingResponsible(validatorOptions)` must work for reentrant and
overlapping calls and must not require changing `group`. The old operation
still has a completion process. Exactly how cancelled operations are
settled, retained or removed, and prevented from publishing stale results
remains open. Field-level validation applies the configured restart policy
as well; the model-level skip option does not apply to ordinary field calls.

### Cancellation and timeout

Each operation has its own `AbortController`. The engine calls `abort()` to
request cancellation and passes the controller's `AbortSignal` to the
handler. Jivs handles abort notification and errors around the handler, so
developers do not need to register an abort listener or catch every exception.
Passing the signal to an application API is recommended when supported, but
that API's interface is the application's choice. Aborting is cooperative
and does not guarantee that the handler or underlying work stops.

Each operation has an engine timeout: a global default with an optional
per-AsyncValidator override. Its timer starts when the operation starts;
reusing the promise does not restart the timer. Clear the timer on completion
or timeout. API-specific timeout and cancellation behavior belongs to the
handler.

A timeout must be logged as an error and must produce a blocking validation
outcome. A user-facing message is optional. When configured, a global timeout
message and localization message code supply a localized model-level
`IssueFound` for the Validation Summary; the issue has a stable timeout error
code, not an AsyncValidator-specific code. An issue is not required merely to
block saving.

`IJivsServices.settings.asyncValidation` supplies the default timeout
(5000 ms) and timeout message; `AsyncValidation.TimeoutMessage` is the
localization key. AsyncValidator consumes the timeout; the summary message
is not yet implemented. The manager's exact result and cleanup protocol
remains open; waiting on the raw handler Promise alone cannot enforce the
timeout.

### Q20: handler wrapper, cancellation, and timeout

The intent is to use the existing `AsyncValidator.validate()` Promise and
ValueHost result-processing path, not introduce a separate operation API.
The handler may resolve normally, explicitly return `failedToResolve`, throw,
or reject. Jivs catches unexpected failures, logs them, and reports a blocking
result. This changes the current handler contract, which requires the handler
to catch errors and always resolve.

An application handler can be written with `async` or by returning a Promise.
It need not create an abort listener or catch errors solely for Jivs. If the
underlying API accepts an `AbortSignal`, pass the signal to it so the actual
work can stop. A handler with multiple steps or its own side effects must
still avoid continuing those actions after cancellation; Jivs can ignore a
late result, but cannot undo side effects.

```ts
const checkAvailability: AsyncValidatorEvaluateHandler =
    async (valueHost, manager, signal) => {
        const response = await fetch('/availability', { signal });
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

#### Who owns and calls what

The proposed `PendingContext` is owned by `AsyncValidator`. The ValueHost
receives the current context from the validator and includes participating
contexts in the immediate validation result; it does not own a separate map
of contexts.

```ts
// Proposed async-specific contract; null means there is no active context.
interface IAsyncValidator extends IValidator {
    readonly pendingContext: PendingContext | null;
    isPendingResponsible(validatorOptions: ValidateOptions): boolean;
}

// Illustrative shape; not a finalized public interface.
interface PendingContext {
    promise: Promise<ValidatorValidateResult>;
    controller: AbortController;
    valueState: Map<ValueHostName, number>;
}
```

`AsyncValidator` implements this interface. The ValueHost recognizes
`IAsyncValidator` using a suitable type guard, so alternative implementations
can participate without requiring `instanceof AsyncValidator`. The precise
guard and context shape remain to be designed.

```ts
// Inside the ValueHost's existing validator loop; illustrative helper names.
if (isAsyncValidator(validator) &&
    validator.isPendingResponsible(validatorOptions)) {
    const context = validator.pendingContext;
    if (!context)
        throw new CodingError('Responsible validator has no pending context');
    processPendingContext(context, validator);
} else {
    processValidatorResult(validator.validate(validatorOptions), validator);
}
```

The same options must be passed to both calls so that model-level skip and
group selection are consistent. `true` requires a current pending context;
if a context becomes obsolete during reentrant processing, the host must not
silently use it or authorize a save.

When `isPendingResponsible(validatorOptions)` applies a restart policy, the AsyncValidator
requests cancellation of its old operation. Model-level skip also requests
cancellation and excludes the operation. The host's existing generation
checks remain important: an old result must not overwrite the replacement
or clear its pending state.

#### Inside AsyncValidator

The following is conceptual code showing the wrapper around the current
handler invocation. Helper names and the context-registration mechanism are
not final APIs. The Promise returned by this wrapper has the existing
`Promise<ValidatorValidateResult>` shape. The sketch illustrates the wrapper,
not the complete context registration and identity-checked cleanup.

```ts
// Inside AsyncValidator, after capturing inputs and obtaining the controller.
const signal = controller.signal;
const logger = this.logger; // retain for error reporting after disposal

const promise = new Promise<ValidatorValidateResult>(resolve => {
    let finished = false;

    function finish(result: ValidatorValidateResult): boolean {
        if (finished)
            return false;
        finished = true;
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        resolve(result);
        return true;
    }

    function onAbort(): void {
        finish({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            skipped: true
        });
    }

    const timer = setTimeout(() => {
        const error = new Error('Async validation timed out');
        if (finish({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            failedToResolve: error
        })) {
            logger.error(error);
            controller.abort(error);
        }
    }, timeoutMs);

    signal.addEventListener('abort', onAbort);
    if (signal.aborted)
        onAbort();

    if (!finished) {
        // Adopts the handler Promise and also catches a synchronous throw.
        const handlerPromise = new Promise<AsyncValidatorEvaluationResult>(
            resolveHandler => resolveHandler(
                this.config.handler(this.valueHost, this.valueHostsManager, signal)
            )
        );
        handlerPromise.then(
            result => {
                if (finished) {
                    reportUnexpectedLateFailure(result.failedToResolve, signal, logger);
                    return;
                }
                try {
                    finish(this.resolveValidationResult(result));
                }
                catch (error) {
                    handleFailure(error);
                }
            },
            handleFailure
        );
    }

    function handleFailure(error: unknown): void {
        if (finished) {
            reportUnexpectedLateFailure(error, signal, logger);
            return;
        }
        const failure = ensureError(error);
        logger.error(failure);
        finish({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            failedToResolve: failure
        });
    }
});
```

`resolveValidationResult()` is the existing conversion path, including
logging a handler-supplied `failedToResolve`. The proposed
`reportUnexpectedLateFailure()` observes late failures without treating an
expected abort as an API failure; unexpected errors must still be logged.
It does nothing when no late failure was supplied. Logging must remain
available after disposal. The sketch is advisory: implementation must also
ensure its own error and notification paths cannot silently lose failures.

On timeout, the wrapper settles with the blocking failure **before** calling
`abort()`, so the abort listener cannot turn the timeout into a skipped
result. On restart or skip, abort settles the wrapper as skipped and signals
the handler. Either way, a handler that completes later cannot replace the
wrapper's result; its Promise remains observed for late failures. Finishing
clears the timer and removes the listener.

`AbortSignal.timeout()` and `AbortSignal.any()` are alternatives for
producing a timeout signal and combining it with manual cancellation. Their
runtime support and timer/listener cleanup need evaluation before choosing
them; neither automatically settles an uncooperative handler Promise.

#### Host and manager integration still to design

- The host must associate a reused `WhenInputsChanged` Promise with its current
  validation generation and ignore obsolete generations without dropping the
  current result.
- Cancelling an old operation must not clear a replacement's state. A skipped
  cancellation result alone must not make an already-waiting manager call
  save-allowed against stale work.
- The manager must wait until the host has processed each participating
  result, not just until the validator Promise settles. Host-processing
  exceptions must be logged and represented as blocking failures.
- Timeout issue injection and cleanup, overlapping manager calls, context
  registration, and disposal still require detailed design.


## ValueHost changes for input counters
_This work has been completed._

To support AsyncValidator's ability to detect changed dependency values, we'll leverage the existing changeCounter feature of ValueHost. But it needs extensive improvements.

Expose a public method on `IValueHost` and its implementations to obtain the
current `changeCounter`; its exact name is not yet fixed. Treat an absent
counter as zero. Each pending operation captures the owner and declared
dependency counters described above.

To preserve `isChanged` while avoiding counter reuse after a reset:

1. Add optional `baseChangeCounter` to `ValueHostInstanceState`, defaulting
   to zero when absent. Existing state without it retains its current meaning.
2. For a known change, increment `changeCounter`.
3. On reset, advance `changeCounter` by one and set `baseChangeCounter` to
   that same value. A reset counts as a new version even when the previous
   counter was zero.
4. Compute `isChanged` as `changeCounter > baseChangeCounter`. Compare
   captured and current counters by inequality, not by whether one is larger.

Counter comparisons must account for host replacement or restored state, which
may reuse a counter value; operation invalidation or host identity handling
is still to be designed. Counter tracking is only as reliable as the
underlying value-change detection.

### CalcValueHost
_This work has been completed._

CalcValueHost must also participate with the changeCounter feature.

`CalcValueHost.getValue()` currently calculates on demand and does not update
its counter. The proposed change retains its last calculated result in
instance state and increments `changeCounter` when a subsequent calculation
returns a different result. `deepEquals` can compare
`SimpleValueType` calculation results.

This makes calculation reads stateful, so initialization, `undefined` values,
state notifications, and reentrancy need careful treatment. A CalcValueHost's
counter reflects a changed calculation only after it has been recalculated.
Declared underlying field counters provide the trigger and input-change
signal without relying on a calculation being read first. Existing consumers
remain responsible for reacting to their dependencies; a new manager-wide
calculation notification mechanism is not assumed.

Calculation dependencies are currently optional in `CalcValueHostConfig`.
The AsyncValidator contract requires the developer to supply complete
dependencies to the AsyncValidator, including nested calculation inputs; this
design does not assume that Jivs automatically traverses or enforces the
CalcValueHost configuration.

### Deferred: general native-value change detection

`ValueHostBase` and FieldValueHost change detection currently use `deepEquals`
to decide whether a value has changed. Date comparison has been added, but
Jivs also supports user-defined native types such as
[`TimeSpan`](../packages/jivs-examples/src/TimeSpan_class.ts).
Comparing enumerable properties cannot guarantee the intended semantics of
every custom type, including computed values.

Revisit general native-value change detection after the async design.
`DataTypeComparerService` and conversion support are possible building blocks,
not a chosen solution. Until addressed, a missed native-value change can
prevent a counter from advancing and therefore affect `WhenInputsChanged`.

## Additional ValueHost changes

`ValidatorsValueHostBase` now has a read-only `hasAsyncValidators` property,
resolved from validator configurations on first request without constructing
validator instances. It identifies hosts that can have async work, not whether
any work is currently pending. Actual pending contexts belong to their
AsyncValidators. The host collects participating contexts for each validation
result; it does not retain a separate operation registry.

## ValueHostsManager design

### ValueHostsManager.validate change
Make validate() return Promise<ValidationState> exclusively.

```ts
validate(options?: ValidateOptions): Promise<ValidationState>;
```
```ts
// Candidate A: conceptual submission caller.
const validationState = await vhm.validate();
if (validationState.doNotSave)
    return;
// Continue the submission.
```

### ValidateOptions changes
The host and validator need to recognize a call made by
`ValueHostsManager.validate()`. Add a public boolean to the existing
`ValidateOptions`; the name below is illustrative:

```ts
interface ValidateOptions {
    isModelLevel?: boolean;
}

// Inside ValueHostsManager.validate():
const hostOptions: ValidateOptions = { ...options, isModelLevel: true };
```

### Integrated workflow

This is the current manager-level baseline, separate from the individual
AsyncValidator design. The two earlier drafts below are historical.

1. **Run manager-level validation.**
   1. The manager passes the model-level flag and unchanged group to each
      applicable ValueHost, preserving group and preliminary-selection rules.
      No manager-wide active-operation count or separate async-validator
      preflight loop is required.
   2. In the existing validator loop, an `IAsyncValidator` applies
      `isPendingResponsible(validatorOptions)`. If true, the host uses its existing context;
      if false, the host calls `validate()`. Model-level skip takes
      precedence, cancels existing work and does not start the handler.
   3. The host attaches result processing for its current generation and
      returns participating `PendingContext` objects for both retained and
      newly started work. Other validators continue through the existing
      synchronous or Promise-returning paths.
   4. The manager collects those contexts and the host-processing completion
      associated with this run, copying entries if the host can mutate its
      pending array during settlement.
   5. A reused Promise must be processed for the current host generation. An
      obsolete generation must not publish over the current state or clear
      a replacement context. Cancellation does not prove the handler stopped.
2. **Wait and report.**
   1. With no participating async operations, fulfill with the final state
      without an async wait. Otherwise perform one `Promise.allSettled()`
      over reused and new work; there is no separate pending-work preflight
      wait.
   2. Ensure each awaited completion includes the host processing needed to
      produce the final state, including failures in that processing.
   3. Fulfill with a `ValidationState` even for unexpected errors. Surface
      failures explicitly and return a blocking state; the exact error
      representation remains open.
   4. Each async completion requests a manager validation-state notification
      through the debounced path so the Validation Summary can update while
      other work is pending. The manager also guarantees a final notification
      after participating work completes. Host callbacks and unrelated edits
      must not be suppressed. Intermediate debounced manager notifications
      may occur; the final notification is not necessarily the only one.

`doNotSave` is the save gate: pending processing can block saving even when
`isValid` is true, and a timed-out or failed operation must continue to block
after it stops being pending. An `IssueFound` is for optional display, not a
prerequisite for blocking.

### Remaining decisions

- How cancellation, timeout, disposal, and late settlement interact; which
  promise represents engine/host completion; and how pending contexts are
  registered and cleaned up. In particular, a non-cooperative handler must
  not leave the manager waiting indefinitely past the engine timeout.
- Whether and how pending AsyncValidators not reached because a preceding
  synchronous validator stops the host loop should be cancelled.
- How a manager call handles a value change or another validation while it is
  waiting, without authorizing a save against stale inputs.****
- How unexpected startup and host-processing failures are logged **and**
  represented in a fulfilled, blocking state.
- How to consume the global timeout and localized timeout-message settings,
  and clean up any timeout summary issues.
- How counter checks handle replaced/restored hosts and calculated values
  that can change due to inputs outside declared ValueHosts.
- Exact context and pending-result contracts, including custom validators
  that return Promises, the `IAsyncValidator` type guard, and run-specific
  host completion.

### Scenarios to establish

- No async validators; one validator; several on one host or different hosts;
  group and preliminary filtering.
- Unchanged `WhenInputsChanged` reuses one promise and publishes its result for the
  current host generation; changed owner or declared dependency restarts it.
- Reset advances the counter but clears `isChanged`; declared fields used
  through nested calculations cause notifications and counter changes.
- `Always` and `skipOnModelLevelValidation` do not allow late results to
  overwrite current state, even when cancellation is ignored.
- `skipOnModelLevelValidation` takes precedence over both restart policies,
  including unchanged pending inputs and a call with no pending work.
- Manager and direct-host model-level flags are independent of group names;
  pending contexts never appear in serialized instance state.
- Match, no-match, warning, undetermined, failure, rejection, timeout, and
  host-processing errors all produce the intended state and notifications.
- Changes or a new validation during a manager wait cannot authorize a save
  based on stale results. A timeout blocks saving with or without a message.

## Related material

- [AsyncValueHostsManagerValidate_Planning.md](./AsyncValueHostsManagerValidate_Planning.md)
- [AsyncValidator_Implementation.md](./AsyncValidator_Implementation.md)
- [AsyncValidator](../packages/jivs-engine/src/Validation/AsyncValidator.ts)
- [ValueHostsManager](../packages/jivs-engine/src/Validation/ValueHostsManager.ts)
- [ValueHostValidateResult](../packages/jivs-engine/src/Interfaces/Validation.ts)

## Historical workflow drafts

The following user-authored drafts are preserved for context. Their wait,
timeout, and cancellation details are superseded by the integrated workflow
and open decisions above.

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
