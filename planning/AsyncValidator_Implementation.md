# AsyncValidator Implementation Design

## Status and scope

Implementation guide and status record for [AsyncValidator_design.md](./AsyncValidator_design.md). Treat code marked **Current** as implemented behavior; code marked **Proposed** is not a description of the current API.

The engine now has `AsyncValidator`, its config/result contracts, factory registration, handler-based issue ownership, field-host settlement and stale-run handling, failure tracking, and cleanup of restored pending flags. The fluent builder method and payload-reference preservation through config cloning are not implemented. `ICondition.evaluate()` still supports Promises; making conditions synchronous is a separate, unfinished migration and is not required for the current `AsyncValidator` implementation.

**Not a submission-completion design:** `ValueHostsManager.validate()` is currently synchronous. Manager completion and submission are separate work. Peter has decided that an API failure must make `doNotSave` true and block saving; this guide specifies the field-level state needed to enforce that decision. The manager must eventually wait for the applicable work and read the final blocking state before submission. The former manager/condition exploration is [obsolete](./asyncCondition_design_OBSOLETE.md), not an implementation specification.

The matching-issue ownership decision was confirmed: when an external issue replaces an existing async-validator-owned issue, the replacement remains validator-owned and a later validation can clear it.

## File map

| Area | File or location | Status |
| --- | --- | --- |
| Contracts and type identity | [Interfaces/AsyncValidator.ts](../packages/jivs-engine/src/Interfaces/AsyncValidator.ts), [Interfaces/Validator.ts](../packages/jivs-engine/src/Interfaces/Validator.ts) | Implemented as `ValidatorType.AsyncValidator`; `IValidator` still requires a condition. |
| Validator and factory | [Validation/AsyncValidator.ts](../packages/jivs-engine/src/Validation/AsyncValidator.ts), [Validation/ValidatorFactory.ts](../packages/jivs-engine/src/Validation/ValidatorFactory.ts) | Implemented; the async validator uses an internal condition shim for existing consumers. |
| Field host | [ValidatorsValueHostBase.ts](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts), [FieldValueHost.ts](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts) | Async settlement, stale-run protection, issue ownership, failure tracking, and restore cleanup are implemented. |
| Builder | [ChildBuilders.ts](../packages/jivs-builder/src/Interfaces/ChildBuilders.ts), [ValidatorBuilder.ts](../packages/jivs-builder/src/Builder/ValidatorBuilder.ts) | No dedicated async fluent method yet; `ValidatorBuilder.finish()` still requires a condition. |
| Configuration cloning | [Utilities.ts](../packages/jivs-engine/src/Utilities/Utilities.ts), [ValueHostsManager.ts](../packages/jivs-engine/src/Validation/ValueHostsManager.ts), builder/merge clone callers | Payload reference identity is not yet preserved or verified across clone paths. |
| Conditions | [Interfaces/Conditions.ts](../packages/jivs-engine/src/Interfaces/Conditions.ts), condition bases and implementations | Promise support remains; a synchronous-only migration is separate and unfinished. |
| Analysis and docs | [ValueHostConfigAnalyzer.ts](../packages/jivs-configanalysis/src/Analyzers/ValueHostConfigAnalyzer.ts), engine/builder docs and examples | Async configs are recognized by config analysis; confirm existing end-user documentation matches the implemented API. |

This repository's package index files are intentionally empty. Public imports normally use compiled subpaths such as `@plblum/jivs-engine/build/Interfaces/Validator`; do not assume adding exports to `src/index.ts` is sufficient.

## 1. Public contracts

### Validator type and config

The current factory selector is `ValidatorType.AsyncValidator` (string value `'AsyncValidator'`). It is distinct from the stable `handlerIdentity` and from any dynamic issue `errorCode`.

```ts
// Current shape, abbreviated to the async-specific members.
export interface AsyncValidatorConfig extends Omit<ValidatorConfig,
    'errorCode' | 'conditionConfig' | 'conditionCreator' | 'errorMessage' |
    'errorMessagel10n' | 'summaryMessage' | 'summaryMessagel10n'> {
    handler: AsyncValidatorEvaluateHandler;
    handlerIdentity: string;
    payload?: unknown;
    dependencyValueHostNames?: ValueHostName[];
}
```

`AsyncValidatorConfig` omits condition and standard-message properties. The `handlerIdentity` becomes `IValidator.errorCode` and is used for enabled-state keys, lookup and issue ownership; the handler supplies the separate issue error code. The constructor checks for a nonempty identity and a handler. Builder-level duplicate validation is not yet available because there is no async builder method. `isAsyncValidatorConfig()` also recognizes subclasses that have their own validator type but provide both `handlerIdentity` and `handler`.

The identity is stable before the handler runs and backs `IValidator.errorCode`, enabled overrides, validator lookup and config matching. Applications recreating configuration after a round trip must use the same identity. Allow the same identity on different ValueHosts.

### Handler and result

```ts
// Current application-facing types, abbreviated.
export interface AsyncValidatorEvaluationResult {
    conditionEvaluateResult: ConditionEvaluateResult;
    errorCode?: string;
    errorMessage?: string;
    severity?: ValidationSeverity;
    failedToResolve?: Error;
}

export type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatorsValueHost,
    valueHostsManager: IValueHostsManager,
    payload: unknown
) => Promise<AsyncValidatorEvaluationResult>;
```

The handler does not populate `skipped`, `doNotSave`, host status or `IssueFound`; the validator creates the engine result. `unknown` is the candidate untyped payload; document narrowing. When `failedToResolve` is assigned, it supplies the diagnostic error for logging, not an issue to display. If a stricter discriminated union is chosen, keep the same observable cases and ease of authoring.

The internal result needs a distinct marker, because `skipped` also describes ordinary exclusions:

```ts
// Current async-failure member on the engine result.
export interface ValidatorValidateResult {
    conditionEvaluateResult: ConditionEvaluateResult;
    issueFound: IssueFound | null;
    skipped?: boolean;
    failedToResolve?: Error;
}
```

This marker is for communication between the validator and its host, not an extra property the application handler must set on `ValidatorValidateResult`.

| Handler result | Validator result |
| --- | --- |
| `Match`, no issue/failure | `Match`, `issueFound: null`. |
| `NoMatch`, with truthy issue code and message | `NoMatch`, one formatted `IssueFound`; missing code or message throws `CodingError`. |
| `Undetermined`, no failure | `Undetermined`, `issueFound: null`. |
| `failedToResolve: Error` | Log the error and return it in `ValidatorValidateResult.failedToResolve`, with `issueFound: null`. The host blocks saving. The current implementation does not require a separate error code or message for this case. |

The handler's Promise is **always expected to resolve successfully**, including on operational failures: the handler must catch exceptions and resolve with a result describing what happened. It must not intentionally throw or reject. At runtime, Jivs checks that a `NoMatch` result has a truthy error code and message and throws a `CodingError` if either is missing or empty. Other result-shape and combination validation is not performed; the implementation relies on the TypeScript interface for `conditionEvaluateResult`, and an absent value falls through as a non-`NoMatch` result. An unexpected handler rejection is a programming error, not the normal API-failure path; it is wrapped in a `CodingError` and the host keeps saving blocked. The host must handle the validator rejection without losing the error or producing an unhandled rejection.

An application handler can distinguish a business rejection from a failed request:

```ts
// Illustrative application code; AvailabilityApi is application-defined.
const evaluateAvailability: AsyncValidatorEvaluateHandler = async (host, manager, payload) => {
    try {
        const api = requireAvailabilityApi(payload);
        const available = await api.isAvailable(host.getValue());
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
            failedToResolve: error as Error
        };
    }
};
```

`requireAvailabilityApi` is an application-defined payload guard. Applications should avoid including secrets in diagnostics. `apierror` here is a diagnostic code, not a displayed issue code.

### Condition compatibility

The current `IValidator` interface still requires `condition` and `conditionType`. `AsyncValidator` satisfies these members with a private internal condition whose category is `ConditionCategory.Async`; it is a compatibility shim for ordering and existing category consumers, not the user's validation logic. Required and data-type-check consumers therefore do not treat it as either category. Replacing this shim by changing the `IValidator` contract is a separate interface migration, not a prerequisite for the current async validator.

## 2. Factory registration

The standard [`ValidatorFactory`](../packages/jivs-engine/src/Validation/ValidatorFactory.ts) currently registers both built-in types. `ValidatorCreatorHandler` receives `(valueHost, config)`, and `create()` passes those arguments in that order. `canCreate()` accepts the built-in type and any registered custom type. Unknown types throw `CodingError`; a null or undefined `validatorType` continues to create the standard `Validator`.

The async registration casts the base config to `AsyncValidatorConfig`; the `AsyncValidator` constructor then checks that `handlerIdentity` is nonempty and `handler` is present. This is the current runtime validation—do not describe it as a separate factory type guard. Custom `IValidatorFactory` replacements remain responsible for their own supported types.

## 3. Builder and configuration

There is currently no dedicated async method in `IValidatorBuilder` or `ValidatorBuilder`. The following signature and call remain a proposal for that unfinished builder integration:

```ts
// Proposed IValidatorBuilder signature.
validatorAsync(
    identity: string,
    handler: AsyncValidatorEvaluateHandler,
    payload?: unknown,
    dependencyValueHostNames?: ValueHostName[]
): IValidatorBuilder;
```

```ts
// Proposed fluent call; the first parameter is named identity.
builder.field('UserName', LookupKey.String)
    .validatorAsync('AvailabilityCheck', evaluateAvailability, availabilityApi, ['AccountType']);
```

An async config has `validatorType: ValidatorType.AsyncValidator`, `handlerIdentity`, `handler`, optional `payload`, and optional dependencies. It does not have `conditionConfig`. A builder method will need a separate path because `ValidatorBuilder.finish()` currently requires a condition. Duplicate checking must compare the async identity with ordinary validators' resolved error codes and with other async identities; the current builder does not provide that validation. Q28 records the chosen duplicate rule, not completed builder support.

The configuration produced by that call is conceptually:

```ts
// Current direct-config shape.
const config: AsyncValidatorConfig = {
    validatorType: ValidatorType.AsyncValidator,
    handlerIdentity: 'AvailabilityCheck',
    handler: evaluateAvailability,
    payload: availabilityApi,
    dependencyValueHostNames: ['AccountType']
};
```

Current [`finish()`](../packages/jivs-builder/src/Builder/ValidatorBuilder.ts) checks duplicates only for the validator forms it can build. Its async-config check currently avoids treating an async identity as an ordinary config error code; it does not perform the cross-type duplicate check described above.

```ts
// Current code, excerpted.
const errorCode = resolveErrorCode(ivDesc);
if (this.parentConfig.validatorConfigs!.find((ivConfig) => {
    if (isAsyncValidatorConfig(ivConfig))
        return false;
    return resolveErrorCode(ivConfig as ValidatorConfig) === errorCode;
}))
    this.reportError(new Error(`ValueHost name "${this._parentConfig.name}" with errorCode ${errorCode} already defined.`));
```

When adding the async builder path, identity resolution should use `handlerIdentity` for async configs and the existing rules for standard validators. The duplicate check must compare the resolved identity/code across both kinds. The runtime config analyzer currently recognizes async configs separately and reports whether the identity and handler are supplied.

```ts
// Proposed fragment at the start of resolveErrorCode().
if (isAsyncValidatorConfig(ivConfig))
    return ivConfig.handlerIdentity;
// Continue with the existing errorCode/conditionType resolution.
```

The eventual builder path must distinguish malformed async configs from standard configs: a config declaring `ValidatorType.AsyncValidator` but lacking `handlerIdentity` should report an error, not fall back to `ConditionType.Unknown`. The current runtime constructor checks the identity and handler, but builder-specific validation is not implemented.

End-user documentation must explain the difference from ordinary validators: neither `AsyncValidatorConfig` nor `validatorAsync()` supplies the validation issue's error code or message; the handler must provide both for `NoMatch`. The configured `handlerIdentity` identifies the validator and is not the issue's localization code. Existing inherited standard-validator message/error-code config properties must not silently override the handler's values.

Audit every `resolveErrorCode()` consumer, including config merging, config analysis, and `FormConfigAdapter`. Returning an async identity is appropriate for validator matching, but it must not be used as if it were the dynamic issue's localization code or as proof that an issue message is configured.

### Payload reference must survive config cloning

This is a necessary integration change, not a documentation-only concern. [`deepClone()`](../packages/jivs-engine/src/Utilities/Utilities.ts) recursively clones objects and calls `new value.constructor()` for class instances. [`ValueHostsManager.safeConfigClone()`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts) and `applyConfig()` clone configs; builder cloning, merge and `onConfigChanged` have additional clone paths. An API wrapper or database reference can therefore be copied, lose required constructor arguments, or throw before the handler runs.

Preserve the exact `payload` reference as opaque application-owned context through **all config cloning paths**, without changing ordinary deep-clone behavior for other config/state fields. A targeted config-aware clone policy is one option: clone the config structure, but treat the payload property of an identified `AsyncValidatorConfig` as an atomic reference before recursive cloning reaches it. Audit all listed clone callers, including direct config and builder paths, merges and config callbacks; do not clone first and restore afterward, because cloning may already have thrown. Do not dispose the shared payload when disposing a validator. Define behavior for cyclic or non-serializable payloads and keep payload contents out of logs.

Configuration with a handler or live payload cannot be reconstructed by JSON alone. Document how the application reattaches them after a round trip; preserve the stable identity.

The invariant is reference identity, not merely equal contents:

```ts
// Illustrative invariant for every relevant configuration-clone path.
const original: AsyncValidatorConfig = {
    validatorType: ValidatorType.AsyncValidator,
    handlerIdentity: 'AvailabilityCheck',
    handler: evaluateAvailability,
    payload: availabilityApi,
    dependencyValueHostNames: ['AccountType']
};
const cloned = cloneConfig(original); // Represents the selected config-aware clone.
cloned !== original;                                      // true
cloned.payload === availabilityApi;                       // true
cloned.dependencyValueHostNames !== original.dependencyValueHostNames; // true
```

`cloneConfig` above is an illustrative name, not an existing function. Preserving the payload after `deepClone()` is too late: the existing clone can call its constructor before the reference is restored. The existing clone filter also recurses into values it returns, so simply returning the payload from that filter does not preserve its identity.

## 4. AsyncValidator lifecycle

The current [`AsyncValidator`](../packages/jivs-engine/src/Validation/AsyncValidator.ts) is constructed with the owning host and config. It uses `handlerIdentity` as its effective validator error code, exposes the host label as its token source, and adds `dependencyValueHostNames` to dependency discovery. The application owns the payload; disposing the validator does not dispose it.

`validate(options)` currently:

1. Returns an immediate skipped `Undetermined` result when disabled, preliminary, or during edit; otherwise invokes the handler and returns a Promise.
2. Converts `NoMatch` into one issue owned by the configured host, with the handler's required `errorCode` and `errorMessage`, and resolved severity. There is no handler-supplied destination or cross-field routing.
3. Defaults severity to `Error` (the internal condition is `Async`) and sets `doNotSave` false only for `Warning`. A settled `Severe` issue cannot stop validators already started.
4. Logs `failedToResolve` at Error level and returns that error in the engine result with no displayed issue. The host records the async identity and blocks saving.
5. Wraps a handler rejection in `CodingError`. Missing NoMatch fields also throw `CodingError`; any other unexpected result-conversion exception rejects the Promise and the host logs it and keeps saving blocked.

The current implementation does not evaluate `enablerConfig`, although that property is inherited from `ValidatorConfigBase`. Decide whether async configs should support enablers or reject/omit that property before presenting enabler behavior as supported.

The actual implementation uses a Promise constructor and then-conversion; this pseudocode only illustrates the control flow and is **not** the current implementation:

```ts
// Proposed AsyncValidator fragment.
public validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult> {
    if (options.preliminary || options.duringEdit || !this.enabled) {
        return {
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            skipped: true
        };
    }

    return Promise.resolve()
        .then(() => this.config.handler(this.valueHost, this.valueHostsManager, this.config.payload))
        .then(
            result => this.convertHandlerResult(result),
            error => {
                const detail = describeHandlerRejection(error);
                throw new CodingError(`Async validator handler rejected its Promise: ${detail}`);
            }
        );
}
```

The handler should resolve with `failedToResolve` for operational failures. An unexpected handler rejection is wrapped in a `CodingError` that preserves its cause and is handled by the host as a blocking validator failure. Payload contents are not included in that diagnostic.

The important conversions are:

```ts
// Proposed examples after validating the handler-result shape.
// Input: { conditionEvaluateResult: Match }
{ conditionEvaluateResult: ConditionEvaluateResult.Match, issueFound: null }

// Input: { conditionEvaluateResult: Undetermined,
//          failedToResolve: new Error('Service unavailable') }
// Log the diagnostic first; then return:
{
    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
    issueFound: null,
    failedToResolve: new Error('Service unavailable')
}

// Input: NoMatch with errorCode 'NameTaken' and a validated message.
// The current implementation uses the resolved error message for the summary too.
{
    conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
    issueFound: {
        errorCode: 'NameTaken',
        errorMessage: formattedErrorMessage,
        summaryMessage: formattedErrorMessage,
        severity: ValidationSeverity.Error,
        doNotSave: true
    }
}
```

For `NoMatch`, the current implementation checks that the code and message are truthy; an absent or empty value throws `CodingError`. It does not currently reject whitespace-only values. The evaluation-result interface has no `valueHostName` or separate summary-message property.

## 5. Localization and encoding

The current [`AsyncValidator.resolveErrorMessage()`](../packages/jivs-engine/src/Validation/AsyncValidator.ts) uses the **issue** error code, not the handler identity. It looks up an error message for the active culture and data type, falls back to the handler's `errorMessage`, HTML-encodes the selected message once, then resolves tokens. Thus both localized messages and handler fallbacks are encoded. Peter accepts that this encoding also affects non-HTML consumers.

The current result uses the resolved error message for both `IssueFound.errorMessage` and `summaryMessage`; it does not look up a separate summary template. External issue replacements preserve their already display-ready message rather than encoding or resolving it again. The plain message-token resolver does not itself HTML-encode token replacements, so this behavior should not be described as a general guarantee of HTML safety.

## 6. Host validation, ordering and concurrency

This section records the current **host** behavior, principally in [`ValidatorsValueHostBase.validate()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts#L148). The validator produces a result; the host combines results, keeps state and notifies observers.

### What is already in place

- **Ordering:** [`AsyncValidator.condition`](../packages/jivs-engine/src/Validation/AsyncValidator.ts#L51) returns an internal condition with `ConditionCategory.Async`. That category follows all existing categories in [`Conditions.ts`](../packages/jivs-engine/src/Interfaces/Conditions.ts#L171). [`orderValidators()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) sorts by category, so async validators are placed after standard categories, retaining the relative order of equal categories.
- **Required and data type:** [`FieldValueHost.generateValidators()`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts#L505) and [`required`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts#L551) still inspect the condition category. The internal async condition is neither `Require` nor `DataTypeCheck`, so these consumers do not need to be rewritten merely to accommodate `AsyncValidator`. Preserve the existing required, preliminary and auto-generated data-type behavior.
- **Dependencies:** [`AsyncValidator.gatherValueHostNames()`](../packages/jivs-engine/src/Validation/AsyncValidator.ts#L168) adds `dependencyValueHostNames`; [`ValidatorsValueHostBase.gatherValueHostNames()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) collects them.
- **Failure result:** [`ValidatorValidateResult.failedToResolve`](../packages/jivs-engine/src/Interfaces/Validator.ts#L265) is an optional `Error`. [`AsyncValidator.resolveValidationResult()`](../packages/jivs-engine/src/Validation/AsyncValidator.ts#L90) logs and returns it. The host records the handler identity and blocks saving, as described below.
- **Async observer errors:** Synchronous exceptions thrown during an async completion notification are caught and logged by `notifyAsyncStateChanged()`. They do not become an async-validator failure or cause a second notification. A debounced callback that runs later is outside this guard.
- **Restored pending state:** When captured state has `asyncProcessing` set, `ValidatorsValueHostBaseGenerator.cleanupInstanceState()` removes it and `corrected`. It changes status to `NeedsValidation`, except when status is already `Failed`; configured failure identities remain. Generator cleanup and manager recreation now have focused tests.

The current [`Validator.validate()`](../packages/jivs-engine/src/Validation/Validator.ts#L237) can also return a Promise from a condition. Host Promise handling therefore continues to support legacy standard-validator Promises; section 8 describes a separate, unfinished migration.

### 1. Follow the current validation run

Start at [`ValidatorsValueHostBase.validate()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts#L148):

1. `validators()` supplies the ordered validators. The `for` loop calls each `iv.validate(options)`.
2. A synchronous result is applied immediately to the local `result`: issues are added, errors make it `Invalid`, warnings do not block, and a `Match` can make it `Valid`. A synchronous `Severe` issue stops the loop.
3. A Promise is passed to the **local** `processPromise()` function. The loop continues; it does not wait for that Promise before starting later validators.
4. `updateInstanceStateWithResult()` copies the current result into host state, including `asyncProcessing` when `result.pending` exists. `validate()` then returns; the returned result's pending array is updated later as Promises settle.
5. `processPromise()` now applies async matches, warnings and errors, and records async handler failures. It clears the pending flag and notifies when state changes.

For example, with only `AvailabilityCheck` on a host, `validate()` initially returns with pending work and `Undetermined`. If the handler later returns `Match`, the host becomes `Valid` and no longer pending.

### 2. Apply each result and publish completion

**Code:** the [result-handling part of the `for` loop](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) and local `processPromise()` inside `ValidatorsValueHostBase.validate()`.

The synchronous and Promise paths apply the following rules. A Promise that resolves to `Severe` cannot stop validators that have already started. The Promise path checks `failedToResolve` before `skipped`.

| Result from a current Promise | Host outcome |
| --- | --- |
| `Match` | Contribute a successful result; a host with no other determining result becomes `Valid`. |
| `NoMatch` with warning | Add the warning with `doNotSave: false`. A warning alone makes the host `Valid`, not `Invalid`. |
| `NoMatch` with error or severe | Add the issue and make the host `Invalid`; it blocks saving. A settled severe issue cannot stop work already started. |
| `Undetermined` or ordinary `skipped` | Do not create an issue or turn an existing error into success. |
| `failedToResolve` | Record the failure separately and block saving, as in step 4. |

Results from several validators must combine: a later `Match` or warning must not erase another validator's error. Preserve each async issue's `asyncIdentity`; use that identity, not its display error code, for the one-issue-per-handler rule in section 7. Async completion writes the run's validator-owned `issuesFound` back to host state; it does not merge validator-owned issues added or replaced while the run was pending. This rare race is an accepted limitation for now. Do not add run-time issue reconciliation unless a concrete use case justifies the added complexity. Unmatched issues in `externalIssuesFound` remain separate and are not overwritten by that assignment.

The last Promise clears `asyncProcessing`. A validation run with pending Promises does not report `corrected`, even if it eventually becomes `Valid`. Synchronous-only runs retain their existing `Invalid`-to-`Valid` behavior; an async validator skipped without producing a Promise does not suppress it.

After a state change, [`invokeOnValueHostValidationStateChanged()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) notifies observers unless `skipCallback` is set. [`ValueHostsManager.notifyValueHostInstanceStateChanged()`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts) invalidates the manager's cached state even when callbacks are skipped.

### 3. Prevent an old run from changing current state

**Problem addressed:** checking only a Promise's local `result.pending` could not stop an older run from updating newer host state.

Example:

1. Validate `alice`; `AvailabilityCheck` starts request A.
2. Change the field to `alicia` and validate again; request B starts.
3. B finishes first with `Match`. A then finishes with `NameTaken`.
4. **Wanted:** A must not add its old issue or clear B's pending flag. This must also hold if the edit did not start B.

**Code:** [`ValidatorsValueHostBase`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) increments `validationGeneration` when a new applicable validation starts, the value changes, validation is cleared, or the host is disposed. `completeThePromise()` checks the captured generation before changing host state. Rejections are logged even for stale runs.

Trace these entry points when reviewing the behavior:

- [`ValidatableValueHostBase.setValue()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts#L75), [`FieldValueHost.setTextValue()`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts#L223) and [`setValues()`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts#L451): invalidate when the relevant value changes or is reset. Account for formatting and parsing paths that delegate between setters.
- [`otherValueHostChangedNotification()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts#L150): a listed dependency can cause either `validate()` or a clear-and-`NeedsValidation` update. Protect both paths, including early-return cases where the host is already `NeedsValidation`.
- [`clearValidation()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts#L286) and [`setEnabled(false)`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts#L206): invalidate only when the operation applies, respecting group filtering. Disabling uses `clearValidation()`.
- [`ValidatorsValueHostBase.dispose()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts#L56): invalidate before an old Promise can use the disposed host. A replacement host must not receive results from its predecessor.

Value changes and clearing remove the old `asyncProcessing` flag; an obsolete settlement cannot clear a newer one. A group-mismatched validation bails out before changing the generation.

After host disposal, an in-flight `AsyncValidator` treats a subsequently resolved result as skipped rather than converting it through its cleared config or disposed host. A resolved `failedToResolve` is still logged, and rejected handler Promises continue to be logged even when stale.

### 4. Keep a failed request from allowing save

**Problem addressed:** after pending work finishes, an API failure must still block saving (Q20), without adding a displayed `IssueFound`.

**Code:** [`ValidatorsValueHostBaseInstanceState.failedAsyncIdentities`](../packages/jivs-engine/src/Interfaces/ValidatorsValueHostBase.ts) stores the failed handler identities. The host exposes `ValidationStatus.Failed` while the list is nonempty and the host is enabled; [`doNotSave`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) blocks `Failed`, and `isValid` is false. No `IssueFound` is created for the failure.

In the host's Promise handling, `processPromise()` receives the validator as well as its Promise. For an `AsyncValidator`, its `errorCode` is the handler identity, not the issue's error code:

| Event for the current run | Failure identities afterward |
| --- | --- |
| `AvailabilityCheck` and `CreditCheck` both report `failedToResolve` | Both identities are recorded. |
| `AvailabilityCheck` later returns `Match` or `NoMatch` | Remove only `AvailabilityCheck`; `CreditCheck` still blocks saving. |
| `CreditCheck` later returns `Match` or `NoMatch` | Remove `CreditCheck`; the failure itself no longer blocks, although another rule may. |
| A handler is skipped, returns ordinary `Undetermined`, or an old run settles | Do not remove its previously recorded failure. |

The host updates the array through the immutable state-update path. An unexpected async rejection or an exception while applying a settlement is logged and records the same blocking identity. The legacy standard-Validator Promise path retains its separate behavior.

`Failed` takes precedence over an invalid issue, which remains available for display (Q34). Clearing validation retains the identities. Disabling the host temporarily suspends the block; enabling it restores `Failed` (Q35). Capture/restore retains the list, and [`cleanupInstanceState()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) removes identities for handlers no longer configured.

The stored `state.status` keeps the ordinary validation outcome, such as `Invalid`; the public `validationStatus` derives `Failed` from the retained identities. This preserves the ordinary outcome when the last failed handler recovers.

### 5. Verify the workflow

In the existing host tests, exercise the examples above: async-only `Match`; warning, error and mixed results in both completion orders; final pending state and callbacks including `skipCallback`; stale results after each invalidating action; dependency changes with and without revalidation; two independent failures, partial recovery, retries, rejection and state restoration. Include a standard validator whose condition returns a Promise until section 8 removes that capability. Use the existing test guidance and work one class at a time.

[`ValueHostsManager.validate()`](../packages/jivs-engine/src/Validation/ValueHostsManager.ts#L703) still returns a synchronous snapshot. These host changes are prerequisites, not a manager-level completion or submission API: submission must eventually wait for the applicable work and then read the final blocking state.

## 7. Issue ownership, cleanup and external replacement

### The idea: one issue per async handler

The **owner** is the async validator that produced an issue, identified by its `handlerIdentity`. The ValueHost stores the issue; `ValidatorsValueHostBaseInstanceState` is not the owner.

An async handler has at most one current issue. Its next issue replaces its previous one, even if the issue's error code changes.

### Identity on the issue

`IssueFound.asyncIdentity` is implemented as an optional property:

```ts
// Current IssueFound member.
asyncIdentity?: string;
```

For a `UserName` field, an issue might look like this:

```ts
{
    asyncIdentity: 'AvailabilityCheck', // who produced it
    errorCode: 'NameTaken',             // what went wrong
    errorMessage: 'This name is already in use.'
}
```

The host sets the identity when it stores an async result. The handler still supplies the issue code and message. `errorCode` remains the code used for localization; it does not have to equal the identity. Ordinary issues do not need the new property. Since the property is part of the issue, it travels with the issue in captured state and needs no separate, synchronized owner array.

### Example 1: restoring or changing configuration

`AvailabilityCheck` produced the `NameTaken` issue above. Later, the ValueHost is recreated using its saved state:

| New configuration | Cleanup result |
| --- | --- |
| Still contains `AvailabilityCheck` | Keep `NameTaken`. |
| No longer contains `AvailabilityCheck` | Remove `NameTaken`. |

[`cleanupInstanceState()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) checks the issue's `asyncIdentity` against configured async handler identities. An async handler without a saved issue does not by itself trigger a status change. Standard validators match ordinary issues by error code, but cannot claim an issue with an `asyncIdentity`. When cleanup changes the retained issues, it recalculates the status using the existing rules.

Captured state contains issues, not handler functions; the application must recreate the config and handler. An older issue without `asyncIdentity` is treated as an ordinary issue and retained only if a configured standard validator matches its error code. It cannot be attributed to an async handler from its code alone.

### Example 2: a new issue from the same handler

`AvailabilityCheck` previously produced `NameTaken`. The next applicable result from that handler produces `NameReserved` instead.

**Result:** replace `NameTaken` with `NameReserved`. There is still only one issue for `AvailabilityCheck`. A later successful validation can clear the handler's issue.

### Example 3: an external issue

Suppose `issuesFound` contains `NameTaken` for `AvailabilityCheck`, and the server supplies an issue through `addExternalIssueFound()` or `fromValidationPayload()`.

| Incoming issue | Result |
| --- | --- |
| `NameReserved`, identity `AvailabilityCheck` | Replace `NameTaken` with `NameReserved`: they belong to the same handler. |
| `NameTaken`, no identity | Keep it as an external issue; the matching code alone does not establish ownership (Q33). |
| `NameReserved`, no identity | There is no match. Keep it as an external issue; both messages may be displayed (Q32). |

When an identity is supplied, use it to identify the handler rather than replacing an issue belonging to a different handler just because its error code matches. If there is no matching existing async issue, follow the existing external-issue path; do not guess an owner. Preserve standard-validator swaps by error code without replacing an async-owned issue.

For a replacement, the current code uses the incoming display-ready error and summary messages and retains the handler identity; it does not encode or resolve them again. If the incoming severity is explicit, it replaces the configured severity; an explicit Warning is made nonblocking. Otherwise severity is resolved from the validator config/default. The `doNotSave` calculation depends on the incoming issue's explicit severity and flag, so configured-Warning behavior when the incoming issue omits severity remains an edge case to confirm. Preserve the existing standard-validator swap behavior.

If an issue is added or replaced through this path while a validation run is pending, that run may later overwrite the validator-owned issue with its own result. This narrow race is accepted for now; do not add special merge or reconciliation behavior without a concrete use case. External issues that remain in `externalIssuesFound` are not affected.

### Where the issues live

Validator-owned issues are in `issuesFound`; unmatched external issues are in `externalIssuesFound`. [`getIssuesFound()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) combines them for display. `clearExternalIssuesFound()` clears only the external list; the current `clearValidation()` clears both.

### Implementation checks

- Carry the handler identity from the async validator into its issue, including when Promises finish out of order. Capture and restore it with state.
- Keep at most one current issue per handler; retain it or remove it during cleanup as shown above.
- Support async external replacement by identity only. Keep unmatched external issues separate.
- Test the examples, multiple handlers with the same issue code, later validation, status, warnings, blocking, and notifications. For legacy state without `asyncIdentity`, verify the current standard-validator-by-code fallback. Handling preexisting duplicates across the validator-owned and external lists remains unspecified.

## 8. Separate unfinished proposal: make conditions synchronous

This migration is **not implemented** and is not required for the current `AsyncValidator`, which uses an internal condition shim. If the owner chooses to make conditions synchronous, change `ICondition.evaluate()` and all corresponding overrides, bases and helpers to return only `ConditionEvaluateResult`. Remove Promise dispatch from the standard `Validator` without removing the Promise return from `IValidator.validate()`; that remains necessary for `AsyncValidator`.

```ts
// Current ICondition signature.
evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager):
    ConditionEvaluateResult | Promise<ConditionEvaluateResult>;

// Possible signature only if this separate migration is approved.
evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager):
    ConditionEvaluateResult;

// IValidator continues to support async implementations.
validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult>;
```

The standard validator could then pass the synchronous result to its existing conversion logic directly instead of branching on `instanceof Promise`. Until then, host code must continue handling Promises from both standard conditions and async validators.

Inventory both production and test support: `ConditionBase`, composite/child evaluation, `WhenCondition`, numeric/string/text bases, concrete conditions, `Support/conditionsForTesting.ts`, and `jivs-examples` condition implementations currently declare Promise unions. Migrate Promise-based test support and examples to async-validator fakes rather than retaining async conditions. Update condition factories, enablers, public documentation and affected callers; keep synchronous condition and severe-error behavior unchanged.

## 9. Verification and sequencing

Follow [Testing Approach](../docs/assets/Testing_Approach.md): the owner selects one class at a time; use Jest `expect()`, hand-written fakes/`Publicify_` subclasses, detailed logging assertions and focused edge cases. No implementation or unit tests are created by this document.

Implementation status and remaining work:

- **Implemented:** async contracts and factory; `AsyncValidator`; async issue identity and replacement; host settlement, failure and stale-run handling; corrected-flag policy; async observer-error handling; restored pending-state cleanup. Targeted engine tests cover these behaviors.
- **Not implemented:** a dedicated builder method and async identity duplicate checks in builder flows; preserving payload reference identity through configuration cloning; broader end-user examples and documentation.
- **Separate decision:** whether to migrate `ICondition` to synchronous-only behavior. Do not treat that migration as a prerequisite unless explicitly approved.
- **Separate project:** manager-level asynchronous completion and submission gating. `ValueHostsManager.validate()` remains synchronous and does not by itself guarantee that async validation has finished.

Compile the repository from its root with `npm run compile` before cross-package tests: other packages import engine build output. Run the smallest relevant Jest file from its package and the corresponding class coverage command described in the testing approach; escalate to broader tests when migration impacts require it.

## Remaining decisions and release gate

- **Q20 — Resolved:** An API failure blocks saving. A separate failure marker is necessary because `skipped` and `Undetermined` alone do not block.
- **Q28 — Decision resolved; builder work pending:** Async handler identities must not duplicate another validator's identity/error code on the same host. The current builder has no async fluent method and does not enforce this cross-type rule for directly supplied async configs.
- **Q29 — Resolved:** Missing or empty `NoMatch` code/message throws `CodingError`. Current localization selects the active-culture error message or handler fallback, encodes the selected message, resolves tokens, and uses that resolved text for both error and summary. Whitespace-only values are not currently rejected.
- **Q30 — Implemented:** Operational failures reported through `failedToResolve` are logged and block saving. Handler rejections are wrapped in `CodingError`; missing NoMatch fields throw `CodingError`. The host logs settlement errors and keeps saving blocked.
- **Q31 — Superseded by Q33:** Async issues are no longer matched by issue code alone.
- **Q32 — Resolved:** An external issue with no identity and no matching issue code remains external; it can be displayed alongside the async issue.
- **Q33 — Resolved:** An external issue requires a matching `asyncIdentity` to replace an async-owned issue; an error-code match alone is insufficient.
- **Q34 — Resolved:** `Failed` takes precedence over `Invalid`; retain invalid issues.
- **Q35 — Resolved:** Retain failed identities through clearing and disabling. A disabled host does not block saving; re-enabling restores the failure.
- A field-level validator feature is not a submission-ready gate. Manager-level completion and submission safety remain separate work.
