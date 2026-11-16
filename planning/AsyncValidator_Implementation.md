# AsyncValidator Implementation Design

## Status and scope

Coding guide for the decisions in [AsyncValidator_design.md](./AsyncValidator_design.md). Code below is proposed unless labeled current. This project introduces `AsyncValidator`, its factory and builder integration, and removes Promise support from `ICondition.evaluate()`. It also includes host changes needed for async results to behave correctly.

**Not a submission-completion design:** `ValueHostsManager.validate()` is currently synchronous. Manager completion and submission are separate work. Peter has decided that an API failure must make `doNotSave` true and block saving; this guide specifies the field-level state needed to enforce that decision. The manager must eventually wait for the applicable work and read the final blocking state before submission. The former manager/condition exploration is [obsolete](./asyncCondition_design_OBSOLETE.md), not an implementation specification.

The matching-issue ownership decision was confirmed: when an external issue replaces an existing async-validator-owned issue, the replacement remains validator-owned and a later validation can clear it.

## File map

| Area | File or location | Work |
| --- | --- | --- |
| Contracts | [Interfaces/Validator.ts](../packages/jivs-engine/src/Interfaces/Validator.ts) | Add async config, handler and result types; adjust validator capabilities. |
| Type identity | `packages/jivs-engine/src/Interfaces/Validator.ts` or a small adjacent types module | Add a stable `ValidatorType.Async` identifier, distinct from validator identity and issue code. |
| Validator | `packages/jivs-engine/src/Validation/AsyncValidator.ts` | Implement condition-free `IValidator`. |
| Factory | [Validation/Validator.ts](../packages/jivs-engine/src/Validation/Validator.ts) | Register the built-in type and pass the owning host to creators. |
| Field host | [ValidatorsValueHostBase.ts](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts), [FieldValueHost.ts](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts) | Ordering, category consumers, pending-result handling, stale-run protection, issue ownership and swaps. |
| Builder | [ChildBuilders.ts](../packages/jivs-builder/src/Interfaces/ChildBuilders.ts), [ValidatorBuilder.ts](../packages/jivs-builder/src/Builder/ValidatorBuilder.ts) | Add `validatorAsync()` and preserve duplicate checks. |
| Configuration | [Utilities.ts](../packages/jivs-engine/src/Utilities/Utilities.ts), [ValueHostsManager.ts](../packages/jivs-engine/src/Validation/ValueHostsManager.ts), builder/merge clone callers | Preserve the payload reference across configuration clones. |
| Conditions | [Interfaces/Conditions.ts](../packages/jivs-engine/src/Interfaces/Conditions.ts), condition bases and implementations | Make `evaluate()` synchronous and migrate consumers. |
| Analysis and docs | [ValidatorConfigAnalyzer.ts](../packages/jivs-configanalysis/src/Analyzers/ValidatorConfigAnalyzer.ts), engine/builder docs and examples | Recognize the new type and document configuration, errors and migration. |

This repository's package index files are intentionally empty. Public imports normally use compiled subpaths such as `@plblum/jivs-engine/build/Interfaces/Validator`; do not assume adding exports to `src/index.ts` is sufficient.

## 1. Public contracts

### Validator type and config

Introduce an exported, stable string constant such as `ValidatorType.Async = 'Async'`. It is a **factory selector**, not an issue error code. Confirm the final spelling before publishing and use it in the factory, builder, config analysis, examples, and tests.

```ts
// Proposed shape; exact module and property names may be adjusted consistently.
export interface AsyncValidatorConfig extends ValidatorConfig {
    validatorType: typeof ValidatorType.Async;
    handlerIdentity: string; // Required stable validator identity.
    errorCode?: never;
    errorMessage?: never;
    errorMessagel10n?: never;
    summaryMessage?: never;
    summaryMessagel10n?: never;
    conditionConfig: null;
    handler: AsyncValidatorEvaluateHandler;
    payload?: unknown;
    dependencyValueHostNames?: ValueHostName[];
}
```

The code is a candidate for the existing interface layout, which currently requires `conditionConfig`; alternatively make condition-specific config a separate type. Do not require `conditionCreator` for this config. Validate a nonempty identity and handler, reject duplicate validator identities on the **same host**, and retain existing standard-validator behavior. The inherited `ValidatorConfig.errorCode` is not an async-validator configuration option: reject it or otherwise make it unavailable for async config rather than allowing a conflicting second identity. The handler supplies `IssueFound.errorCode`, which can differ from `handlerIdentity`.

The identity is stable before the handler runs and backs `IValidator.errorCode`, enabled overrides, validator lookup and config matching. Applications recreating configuration after a round trip must use the same identity. Allow the same identity on different ValueHosts.

### Handler and result

```ts
// Proposed application-facing types.
export interface AsyncValidatorEvaluationResult {
    conditionEvaluateResult: ConditionEvaluateResult;
    errorCode?: string;
    errorMessage?: string;
    valueHostName?: ValueHostName;
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
// Proposed addition to the existing engine result.
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
| `NoMatch`, nonempty issue code and message | `NoMatch`, one formatted `IssueFound`. |
| `Undetermined`, no failure | `Undetermined`, `issueFound: null`. |
| `Undetermined`, `failedToResolve: Error` | Log the error and return it in `ValidatorValidateResult.failedToResolve`, with `issueFound: null`. The host blocks saving. |

The handler's Promise is **always expected to resolve successfully**, including on operational failures: the handler must catch exceptions and resolve with a result describing what happened. It must not intentionally throw or reject. Jivs inspects the resolved payload. Validate malformed/missing results and inconsistent combinations explicitly; throw a `CodingError` for a missing or empty `NoMatch` message (Q29), not a successful validation. This is thrown by Jivs while processing an already-resolved handler result, so the resulting validator Promise rejects even though the handler complied with its Promise-resolution rule. An unexpected handler rejection or other contract violation is a programming error, not the normal API-failure path; report it as a `CodingError`, log it, and keep saving blocked rather than recasting it as success. The host must handle the validator rejection without losing the error or producing an unhandled rejection.

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

### Condition-free validator capabilities

`IValidator.condition` and `conditionType` are currently required. A dummy condition would be misleading. A practical migration is to expose category and async capability on `IValidator`, and make condition-specific access optional or move it to a condition-backed subinterface. The standard validator derives category from its condition; async validators identify themselves as async and must not be recognized as required or data-type checks.

The exact interface shape is not yet a decision. Whichever shape is selected, migrate every direct condition/category consumer, custom validator and test fake. Do not use an invented `conditionType` for async validators. Preserve `errorCode`, `setEnabled`, `tryValidatorSwap`, `gatherValueHostNames`, `IMessageTokenSource`, and `dispose`.

## 2. Factory registration

Current [`ValidatorFactory.create()`](../packages/jivs-engine/src/Validation/Validator.ts) does this:

```ts
// Current code, excerpted.
if (config.validatorType == null)
    return new Validator(valueHost, config);
const fn = this._map.get(config.validatorType);
if (fn)
    return fn(config) as IValidator;
```

The registered creator currently receives only `config`, while `AsyncValidator` needs its host. Implement the following:

1. Extend registered creators to receive both the config and owning `IValidatorsValueHost`. Preserve config as the first argument so existing one-argument creators can continue to work where TypeScript permits; update typed call sites and tests.
2. Register `ValidatorType.Async` **automatically** when the standard `ValidatorFactory` is created. The normal lazy `JivsServices.validatorFactory` constructs `new ValidatorFactory()`, so requiring application setup would break the normal builder path.
3. Validate that the selected config is an `AsyncValidatorConfig`, then create `new AsyncValidator(valueHost, config)`. Missing handler or identity is a configuration error, not a standard-validator fallback.
4. Ensure `canCreate()` recognizes the new type; retain the null/undefined standard-validator path, custom registrations, case-insensitive lookup and explicit unknown-type error.
5. The existing `NameToFunctionMapper<ValidatorConfig, IValidator>` accepts arguments of one homogeneous type. Change its use to a typed request object or another appropriate typed registry; do not pass a ValueHost as a `ValidatorConfig` or rely on unsafe casts. Avoid a circular import between the factory and async class.
6. Custom `IValidatorFactory` replacements remain responsible for their own supported types. Update config-analysis behavior and document this requirement.

For example, the built-in registration and its call site might look like this **after** introducing a type-safe two-argument registry:

```ts
// Proposed fragments, not a complete factory.
type ValidatorCreator = (
    config: ValidatorConfig,
    valueHost: IValidatorsValueHost
) => IValidator;

constructor() {
    this.register(ValidatorType.Async, (config, valueHost) => {
        assertAsyncValidatorConfig(config);
        return new AsyncValidator(valueHost, config);
    });
}

public create(valueHost: IValidatorsValueHost, config: ValidatorConfig): IValidator {
    if (config.validatorType == null)
        return new Validator(valueHost, config);
    const creator = this.getRegisteredCreator(config.validatorType);
    if (!creator)
        throw new CodingError(`ValidationType not supported: ${config.validatorType}`);
    return creator(config, valueHost);
}
```

`assertAsyncValidatorConfig` is a new runtime assertion/type guard, and `getRegisteredCreator` represents the new typed lookup; neither is an existing API. Keep the existing register-by-name alias behavior when adapting the mapper. Existing custom creators that accept only config should continue to work, but custom implementations and registration signatures need migration and verification.

## 3. Builder and configuration

Add the signature to `IValidatorBuilder` and implement it in `ValidatorBuilder`:

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

Construct a config with `validatorType`, `handlerIdentity`, `conditionConfig: null`, handler, payload and optional dependencies. Preserve fluent chaining. `finish()` currently rejects a missing condition; either provide a validator-specific finish path or revise it narrowly. Update `resolveErrorCode()` or its replacement so the existing duplicate-code check compares an async config's `handlerIdentity` with other validator identities, including ordinary validators' resolved error codes (Q28). Directly supplied configs must receive equivalent validation at construction. This checks identities known at configuration time, not dynamic issue codes returned later.

The configuration produced by that call is conceptually:

```ts
// Proposed config, before the builder appends it to the field.
const config: AsyncValidatorConfig = {
    validatorType: ValidatorType.Async,
    handlerIdentity: 'AvailabilityCheck',
    conditionConfig: null,
    handler: evaluateAvailability,
    payload: availabilityApi,
    dependencyValueHostNames: ['AccountType']
};
```

Current [`finish()`](../packages/jivs-builder/src/Builder/ValidatorBuilder.ts) checks duplicates using:

```ts
// Current code, excerpted.
const errorCode = resolveErrorCode(ivDesc);
if (this.parentConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode))
    this.reportError(new Error(`ValueHost name "${this._parentConfig.name}" with errorCode ${errorCode} already defined.`));
```

After adding a type-safe async-config guard, identity resolution could check `handlerIdentity` before the existing standard-validator rules. The duplicate check must still use the same resolver for **both** the new config and existing configs:

```ts
// Proposed fragment at the start of resolveErrorCode().
if (isAsyncValidatorConfig(ivConfig))
    return ivConfig.handlerIdentity;
// Continue with the existing errorCode/conditionType resolution.
```

The guard must distinguish malformed async configs from standard configs: a config declaring `ValidatorType.Async` but lacking `handlerIdentity` should report an error, not fall back to `ConditionType.Unknown`. The runtime guard and validation are new; they must not treat a mere property name on an unrelated custom config as proof of this type.

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
    validatorType: ValidatorType.Async,
    handlerIdentity: 'AvailabilityCheck',
    conditionConfig: null,
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

Construct with the owning host and config, following the existing validator's service/manager access and lifecycle patterns. Use the config identity for per-validator enabled-state keys. Expose only `{Label}` via `getValuesForTokens`; do not include `{Value}`, `{DataType}` or condition-specific sources. `gatherValueHostNames()` adds the configured dependency names to the set; do not require the owning field as a dependency.

`validate(options)`:

1. Check `preliminary`, `duringEdit` and enabled state **before** invoking the handler. Return an immediate skipped result when excluded.
2. For an active call, invoke the handler once and immediately return the Promise of the converted `ValidatorValidateResult` so the host can track pending work. The handler captures any values needed before awaiting.
3. Validate the returned shape. For a `NoMatch`, construct one issue with the returned issue code, message, optional destination and severity. Do not reject a destination merely because it differs from the owning field; this does not implement cross-field routing.
4. Default issue severity consistently with the standard validator, then set `doNotSave` false for `Warning` and true for blocking severities. A `Severe` async outcome does not stop validators already started.
5. Log a reported operational failure at Error level and return the agreed skipped result **with a failure marker**. Do not convert an operational failure into a normal validation issue. The host uses the marker to block saving.
6. Dispose validator-owned resources using existing lifecycle conventions; the application owns the payload. Enabler behavior needs an explicit design before introducing it.

The Promise boundary and result conversion can be structured as follows. The helper name is proposed; this is a fragment rather than a complete class:

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

`Promise.resolve().then(...)` also captures a synchronous throw from a handler that violates its contract. `describeHandlerRejection` represents a new diagnostic formatter that preserves useful failure information while redacting sensitive data; it is not an existing API. Do not silently drop the underlying exception or include the payload in diagnostics. A `CodingError` thrown by `convertHandlerResult()` rejects the **validator** Promise and is handled by the host; it is not a request failure returned by the handler.

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
// The handler's message is formatted before it is put in this result.
{
    conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
    issueFound: {
        errorCode: 'NameTaken',
        errorMessage: formattedErrorMessage,
        summaryMessage: formattedSummaryMessage,
        severity: ValidationSeverity.Error,
        doNotSave: true
    }
}
```

For `NoMatch`, `convertHandlerResult()` must validate the code and message before formatting an issue. The example uses default `Error` severity; a warning must instead have `doNotSave: false`. The existing `assertNotEmptyString()` throws `CodingError` for a missing, non-string, empty or whitespace-only string. A type guard or a helper returning a string is also needed to narrow the optional properties for TypeScript; do not rely on a cast to hide a missing value.

## 5. Localization and encoding

Use the **issue** error code, not validator identity, for localization. Adapt the intent of [`updateIssueFoundWhenNoMatch()`](../packages/jivs-engine/src/Validation/Validator.ts); the current implementation reads templates from config and cannot simply consume the handler result unchanged.

1. HTML-encode the raw handler `errorMessage` once using existing [`encodeHtml()`](../packages/jivs-engine/src/Services/HtmlMessageTokenResolverService.ts).
2. Resolve a localized error template by issue code using `IErrorMessagesService.getErrorMessage(culture, issueCode, dataType)`, with the encoded handler text as fallback. Resolve the summary template by issue code; if unavailable, fall back to the formatted error message.
3. Resolve `{Label}` with the configured message-token resolver. The HTML resolver encodes token replacements separately. Do not HTML-encode the final resolved string again or apply the token resolver twice to the fallback.
4. Preserve trusted/localized-template policy explicitly; the handler fallback's encoding does not automatically encode a selected localized template. For an incoming external `IssueFound`, preserve its already display-ready message instead of encoding or resolving it again.

Peter accepts that the engine's handler-message encoding also affects non-HTML consumers. The plain token resolver does not encode label replacements: document the output context and do not claim it produces safe HTML.

For a validated `NoMatch`, the following fragment illustrates the source and fallback order. It uses the actual service method names; the surrounding method and result types are proposed:

```ts
const culture = this.services.cultureService.defaultCultureId;
const dataType = this.valueHost.getDataType();
const encodedFallback = encodeHtml(handlerMessage);
const errorTemplate = this.services.errorMessagesService.getErrorMessage(
    culture, issueCode, dataType
) ?? encodedFallback;
const summaryTemplate = this.services.errorMessagesService.getSummaryMessage(
    culture, issueCode, dataType
);
const resolver = this.services.messageTokenResolverService;
const errorMessage = resolver.resolveTokens(
    errorTemplate, this.valueHost, this.valueHostsManager, this
);
const summaryMessage = summaryTemplate == null
    ? errorMessage
    : resolver.resolveTokens(summaryTemplate, this.valueHost, this.valueHostsManager, this);
```

Here `handlerMessage` and `issueCode` are already-validated strings and `this` is the async validator's `{Label}`-only token source. For example, the fallback `Invalid <name> for {Label}` becomes `Invalid &lt;name&gt; for {Label}` **before** token resolution. Localization precedence and the policy for trusted localized templates still require the review identified below.

## 6. Host validation, ordering and concurrency

This section is a guide to the **host** work, principally in [`ValidatorsValueHostBase.validate()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts#L148). The validator produces a result; the host combines results, keeps state and notifies observers. Work through the examples below one at a time.

### What is already in place

- **Ordering:** [`AsyncValidator.condition`](../packages/jivs-engine/src/Validation/AsyncValidator.ts#L51) returns an internal condition with `ConditionCategory.Async`. That category follows all existing categories in [`Conditions.ts`](../packages/jivs-engine/src/Interfaces/Conditions.ts#L171). [`orderValidators()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) sorts by category, so async validators are placed after standard categories, retaining the relative order of equal categories.
- **Required and data type:** [`FieldValueHost.generateValidators()`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts#L505) and [`required`](../packages/jivs-engine/src/ValueHosts/FieldValueHost.ts#L551) still inspect the condition category. The internal async condition is neither `Require` nor `DataTypeCheck`, so these consumers do not need to be rewritten merely to accommodate `AsyncValidator`. Preserve the existing required, preliminary and auto-generated data-type behavior.
- **Dependencies:** [`AsyncValidator.gatherValueHostNames()`](../packages/jivs-engine/src/Validation/AsyncValidator.ts#L168) adds `dependencyValueHostNames`; [`ValidatorsValueHostBase.gatherValueHostNames()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts) collects them.
- **Failure result:** [`ValidatorValidateResult.failedToResolve`](../packages/jivs-engine/src/Interfaces/Validator.ts#L265) is an optional `Error`. [`AsyncValidator.resolveValidationResult()`](../packages/jivs-engine/src/Validation/AsyncValidator.ts#L90) logs and returns it. The host records the handler identity and blocks saving, as described below.

The current [`Validator.validate()`](../packages/jivs-engine/src/Validation/Validator.ts#L237) can also return a Promise from a condition. Until the separate migration in section 8 is complete, host Promise changes must continue to support that path, not assume every Promise came from `AsyncValidator`.

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

Results from several validators must combine: a later `Match` or warning must not erase another validator's error. Preserve each async issue's `asyncIdentity`; use that identity, not its display error code, for the one-issue-per-handler rule in section 7. Do not overwrite changes made to host state while a Promise was pending without considering whether those changes invalidate the run or must be preserved.

The last Promise clears `asyncProcessing`. **Still to do:** async transitions to `Valid` need their own `corrected` handling; do not change the existing synchronous `adjustCorrectedFlag()` to solve that case.

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

### 4. Keep a failed request from allowing save

**Problem addressed:** after pending work finishes, an API failure must still block saving (Q20), without adding a displayed `IssueFound`.

**Code:** [`ValidatorsValueHostBaseInstanceState.failedAsyncValidatorIdentities`](../packages/jivs-engine/src/Interfaces/ValidatorsValueHostBase.ts) stores the failed handler identities. The host exposes `ValidationStatus.Failed` while the list is nonempty and the host is enabled; [`doNotSave`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) blocks `Failed`, and `isValid` is false. No `IssueFound` is created for the failure.

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

### Put the identity on the issue

Add an optional property to `IssueFound`; for example:

```ts
// Proposed addition to IssueFound.
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

Captured state contains issues, not handler functions; the application must recreate the config and handler. Older or supplied state without an identity cannot reliably identify an async owner from the issue code alone. Do not invent one; the fallback for such state still needs a decision.

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

For a replacement, use the incoming display-ready message and retain the handler identity, so later validation and cleanup treat it as that handler's issue. Do not encode or resolve the message again. The exact severity and `doNotSave` override policy still needs to be settled. Preserve the existing standard-validator swap behavior.

### Where the issues live

Validator-owned issues are in `issuesFound`; unmatched external issues are in `externalIssuesFound`. [`getIssuesFound()`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) combines them for display. `clearExternalIssuesFound()` clears only the external list; the current `clearValidation()` clears both.

### Implementation checks

- Carry the handler identity from the async validator into its issue, including when Promises finish out of order. Capture and restore it with state.
- Keep at most one current issue per handler; retain it or remove it during cleanup as shown above.
- Support async external replacement by identity only. Keep unmatched external issues separate.
- Test the examples, multiple handlers with the same issue code, later validation, status, warnings, blocking, and notifications. Decide how to handle state without reliable ownership and preexisting duplicates across the two lists.

## 8. Make conditions synchronous

Change `ICondition.evaluate()` and all corresponding overrides, bases and helpers to return only `ConditionEvaluateResult`. Remove Promise dispatch from the standard `Validator` without removing the Promise return from `IValidator.validate()`; that remains necessary for `AsyncValidator`.

```ts
// Current ICondition signature.
evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager):
    ConditionEvaluateResult | Promise<ConditionEvaluateResult>;

// Proposed ICondition signature.
evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager):
    ConditionEvaluateResult;

// IValidator continues to support async implementations.
validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult>;
```

The standard validator can consequently pass the synchronous result to its existing conversion logic directly instead of branching on `instanceof Promise`. The host must still handle a Promise returned by an async **validator**.

Inventory both production and test support: `ConditionBase`, composite/child evaluation, `WhenCondition`, numeric/string/text bases, concrete conditions, `Support/conditionsForTesting.ts`, and `jivs-examples` condition implementations currently declare Promise unions. Migrate Promise-based test support and examples to async-validator fakes rather than retaining async conditions. Update condition factories, enablers, public documentation and affected callers; keep synchronous condition and severe-error behavior unchanged.

## 9. Verification and sequencing

Follow [Testing Approach](../docs/assets/Testing_Approach.md): the owner selects one class at a time; use Jest `expect()`, hand-written fakes/`Publicify_` subclasses, detailed logging assertions and focused edge cases. No implementation or unit tests are created by this document.

Suggested implementation order, with review and tests at each step:

1. Contracts and factory registration; verify default services, custom registrations, invalid types, and real host/config delivery.
2. Config cloning and builder; verify identity, duplicates and a class payload with required constructor arguments remains the same instance through manager construction, update, merge and callback cloning.
3. AsyncValidator; verify skip options, enabled state, result combinations, diagnostics and Error logging, issue code/identity distinction, localization, `{Label}`, encoding and disposal.
4. Host and field integration; verify synchronous priority, warnings/errors/severe, match status, pending notifications, stale runs and dependencies.
5. Ownership and external replacement; verify captured-state reconstruction, issue codes different from identities, identity-based replacement when issue codes collide, replacement ownership and validator-versus-external clearing.
6. Condition contract migration; compile all affected packages and migrate existing condition consumers and tests. Verify sync condition behavior and validation ordering.
7. Documentation, examples and config analysis; then integrate manager completion and submission in their separate projects.

Compile the repository from its root with `npm run compile` before cross-package tests: other packages import engine build output. Run the smallest relevant Jest file from its package and the corresponding class coverage command described in the testing approach; escalate to broader tests when migration impacts require it.

## Remaining decisions and release gate

- **Q20 — Resolved:** An API failure blocks saving. A separate failure marker is necessary because `skipped` and `Undetermined` alone do not block.
- **Q28 — Resolved:** Reuse the builder duplicate check for validator identities. That does not prevent distinct handlers returning the same issue code.
- **Q29 — Resolved:** An empty handler message for `NoMatch` is a `CodingError`. Localization precedence and localized-template trust policy still need to be specified during implementation.
- **Q30 — Clarified:** Yes, rejection and malformed results differ from Q20. Q20 concerns an operational failure that the handler catches and reports in a successfully resolved Promise; Q30 concerns a handler violating its contract. The proposed defensive behavior is to log a `CodingError` and keep saving blocked.
- **Q31 — Superseded by Q33:** Async issues are no longer matched by issue code alone.
- **Q32 — Resolved:** An external issue with no identity and no matching issue code remains external; it can be displayed alongside the async issue.
- **Q33 — Resolved:** An external issue requires a matching `asyncIdentity` to replace an async-owned issue; an error-code match alone is insufficient.
- **Q34 — Resolved:** `Failed` takes precedence over `Invalid`; retain invalid issues.
- **Q35 — Resolved:** Retain failed identities through clearing and disabling. A disabled host does not block saving; re-enabling restores the failure.
- Finish stale-run and final-notification behavior before claiming manager-level completion or submission safety. A field-level validator feature may be built first, but it must not be advertised as a submission-ready gate.
