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
    failedToResolve?: boolean;
}

export type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatorsValueHost,
    valueHostsManager: IValueHostsManager,
    payload: unknown
) => Promise<AsyncValidatorEvaluationResult>;
```

The handler does not populate `skipped`, `doNotSave`, host status or `IssueFound`; the validator creates the engine result. `unknown` is the candidate untyped payload; document narrowing. When `failedToResolve` is true, the same top-level `errorCode` and `errorMessage` contain diagnostic information for logging, not an issue to display. If a stricter discriminated union is chosen, keep the same observable cases and ease of authoring.

The internal result needs a distinct marker, because `skipped` also describes ordinary exclusions:

```ts
// Proposed addition to the existing engine result.
export interface ValidatorValidateResult {
    conditionEvaluateResult: ConditionEvaluateResult;
    issueFound: IssueFound | null;
    skipped?: boolean;
    failedToResolve?: boolean;
}
```

This marker is for communication between the validator and its host, not an extra property the application handler must set on `ValidatorValidateResult`.

| Handler result | Validator result |
| --- | --- |
| `Match`, no issue/failure | `Match`, `issueFound: null`. |
| `NoMatch`, nonempty issue code and message | `NoMatch`, one formatted `IssueFound`. |
| `Undetermined`, no failure | `Undetermined`, `issueFound: null`. |
| `Undetermined`, `failedToResolve: true`, diagnostic code and message | Log once at `LoggingLevel.Error`; return `Undetermined`, `issueFound: null`, `skipped: true`, and a separate failure marker for the host. The host blocks saving. |

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
            failedToResolve: true,
            errorCode: 'apierror',
            errorMessage: error instanceof Error ? error.message : String(error)
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

// Input: { conditionEvaluateResult: Undetermined, failedToResolve: true,
//          errorCode: 'apierror', errorMessage: 'Service unavailable' }
// Log the diagnostic first; then return:
{
    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
    issueFound: null,
    skipped: true,
    failedToResolve: true
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

Update all host consumers of `validator.condition.category`: `ValidatorsValueHostBase.orderValidators()`, the preliminary required check, `FieldValueHost.generateValidators()` and `required`. Sort synchronous validators first by their existing categories, then async validators in their original relative order. Do not alter standard required or auto-generated data-type behavior.

Fix the current `processPromise()` behavior as part of this feature:

- Process all fulfilled outcomes, including `Match`, `NoMatch`, warning, `Undetermined` and `skipped`, using the same issue/severity rules as the synchronous path. A warning must remain non-blocking and must not mark the host invalid by itself.
- Update aggregate status after an async `Match`; do not merely clear the pending flag while leaving a successful-only host `Undetermined`.
- Remove each pending entry and finish processing before signaling completion. When the last pending entry clears, publish the resulting host state and appropriate field/manager notifications, honoring `skipCallback`.
- Do not let an old run overwrite a newer value, dependency change, validation, cleared state, or disposed/recreated host. A run token/generation or equivalent must invalidate old settlements; ensure pending flags belong to the current run. Prevent an obsolete result from clearing a newer run's pending flag.
- Handle unexpected rejection and settlement-processing exceptions as observable programming errors, and leave saving blocked. Do not promise a successful save simply because a Promise settled.

Add dependency names through the existing `gatherValueHostNames()` path. The current dependent-host notification may revalidate the entire host or mark it `NeedsValidation`, depending on the source change options; ensure stale-run protection applies to both.

A generation token illustrates how to reject an obsolete settlement:

```ts
// Proposed fragment: capture when registering a validator Promise.
const runGeneration = this.validationGeneration;
promise.then(
    result => {
        if (runGeneration !== this.validationGeneration)
            return; // A newer validation or invalidation owns the state.
        this.completeCurrentValidatorPromise(promise, identity, result, options);
    },
    error => {
        if (runGeneration !== this.validationGeneration)
            return;
        this.failCurrentValidatorPromise(promise, identity, error, options);
    }
);
```

The generation and completion methods are proposed, not existing APIs. Increment the generation when starting a superseding run **and** when an edit, dependency change, clear or disposal invalidates an existing run, even if no replacement validation starts. Current-run completion must update pending entries, failure/issue state and notifications as described above; a rejected obsolete Promise must still be handled without overwriting current state. Preserve any necessary diagnostic reporting for unexpected stale-run rejections.

### Persisting failed-resolution blocking

The current [`doNotSave`](../packages/jivs-engine/src/ValueHosts/ValidatableValueHostBase.ts) checks pending work, `NeedsValidation`, and blocking issues; after pending clears, an `Undetermined` skipped result without an issue does **not** block. Add an explicit internal failure marker to `ValidatorValidateResult` and process it before the generic `skipped` check. Record the identities of validators whose current resolution failed in serializable host instance state, e.g. `failedAsyncValidatorIdentities?: string[]`, and make the host's `doNotSave` true when this set is nonempty. The name and exact representation are implementation details; a single boolean is insufficient when several async validators fail independently.

The marker is not a displayed `IssueFound`. On a fresh, authoritative `Match` or `NoMatch` for that same validator, remove its failure identity. A skipped preliminary/during-edit/disabled run, an ordinary `Undetermined` outcome, or another validator's success must not erase it. A stale completion cannot add or clear it. Clearing validation or removing a validator must clean up its corresponding state consistently with existing lifecycle semantics; specify disabled-host handling and test it. Notify observers when failure state or `doNotSave` changes, including when the last Promise settles. Keep the block through instance-state capture/restore, config cleanup and manager aggregation. Test two failures, partial recovery, retries, stale results and mixed sync/async results.

An illustrative state transition, with two independently failing validators:

```ts
// Proposed instance-state data; no displayed IssueFound is needed.
failedAsyncValidatorIdentities: ['AvailabilityCheck', 'CreditCheck']

// AvailabilityCheck later returns Match or NoMatch in a current run:
failedAsyncValidatorIdentities: ['CreditCheck'] // doNotSave remains true

// CreditCheck later returns Match or NoMatch in a current run:
failedAsyncValidatorIdentities: [] // failure no longer blocks; other rules still may
```

Inside the host's settlement processing, inspect the failure **before** treating the result as an ordinary skipped validator. `identity` below comes from the validator whose Promise was started, not from `IssueFound.errorCode`:

```ts
// Proposed logic within a current-run instance-state update.
if (validatorResult.failedToResolve) {
    addFailedIdentity(stateToUpdate, identity);
}
else if (!validatorResult.skipped &&
    (validatorResult.conditionEvaluateResult === ConditionEvaluateResult.Match ||
     validatorResult.conditionEvaluateResult === ConditionEvaluateResult.NoMatch)) {
    removeFailedIdentity(stateToUpdate, identity);
}
// Continue applying the result and publishing pending/status changes.
```

The helper names are illustrative. They must update a serializable array without duplicates and must not mutate a previous immutable snapshot. The rejection path records the same blocking identity before clearing the pending flag and reporting the coding error. Add the failure-state check to `doNotSave` without bypassing existing pending, status, and issue checks; how a disabled host interacts with the retained failure is still to be specified.

The failure marker and final state are prerequisites for future manager completion and submission. A manager that reads state before awaiting the relevant run still cannot conclude that submission is safe.

## 7. Issue ownership, cleanup and external replacement

The host currently stores validator issues in `instanceState.issuesFound` and external issues separately. `cleanupInstanceState()` matches stored issue codes to validator config codes. That is insufficient when `AsyncValidatorConfig.handlerIdentity` is `AvailabilityCheck` and the handler returns `NameTaken`.

This guide does **not** propose adding an identity property to public `IssueFound`. Instead, the candidate is a separate, serializable companion field on the host's instance state, aligned with `issuesFound` by array index. For example:

```ts
// Illustrative host instance state, not public IssueFound properties.
issuesFound: [{ errorCode: 'NameTaken', errorMessage: 'Already taken' }],
validatorIssueOwners: ['AvailabilityCheck']
```

The entry says which validator produced the issue; `IssueFound.errorCode` remains `NameTaken` for localization and external matching. Capture/restore carries the companion field. Cleanup uses the owner to retain or remove the issue when config changes; replacing a matching issue retains the owner; validation and other changes update or remove the issue and corresponding owner together. External issues in the separate external list do not need this ownership entry. Legacy captured state has no companion field: apply existing standard-validator matching where possible, rather than inventing an owner or silently discarding an async issue. The implementation must account for arrays being reordered or edited and handle missing legacy entries safely. An equivalent representation is acceptable if it preserves these invariants and the public issue shape.

For example, before and after the first-match replacement:

```ts
// Before: two different validators supplied the same issue code.
issuesFound = [
    { errorCode: 'NameTaken', errorMessage: 'First message' },
    { errorCode: 'NameTaken', errorMessage: 'Second message' }
];
validatorIssueOwners = ['AvailabilityCheck', 'AlternateCheck'];

// After addExternalIssueFound({ errorCode: 'NameTaken', errorMessage: 'Server message' }, ...):
issuesFound = [
    { errorCode: 'NameTaken', errorMessage: 'Server message' },
    { errorCode: 'NameTaken', errorMessage: 'Second message' }
];
validatorIssueOwners = ['AvailabilityCheck', 'AlternateCheck']; // unchanged
```

These are illustrative state excerpts; actual issue construction must also apply the agreed severity, blocking and notification semantics. They do not imply that all duplicates across both local and external lists are already resolved.

For `addExternalIssueFound()`:

1. For the new async-validator case, look for an existing issue with the same nonempty **issue** code on the destination host, including validator-owned issues whose validator identity differs.
2. Replace that async-validator-owned issue with the supplied display-ready issue and retain its validator ownership; subsequent validation can clear it. If multiple issues match, replace the **first** matching issue in the stored `issuesFound` order and retain that issue's owner (Q31); leave other matching issues unchanged. Preserve validator-swap blocking/severity behavior, including non-blocking warnings. Avoid double HTML encoding.
3. A different code may leave both issues visible. With no matching local issue, retain the established external-issue path and its `determinedLocally` behavior; an absent code is not an implicit match.
4. Preserve the existing standard-validator swap contract, which can generate the local validator's message instead of using the incoming message. Define how preexisting duplicates across the local and external lists are handled and how severity and `doNotSave` overrides work; do not introduce a success-shaped fallback.

The current host first asks `tryValidatorSwap()` to match validator identity, and only then searches the validator-owned list. Changing the async validator alone cannot implement same-issue-code replacement when that code differs from the identity. Update the host path and test local/external storage, messages, state callbacks and subsequent clearing.

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
5. Ownership and external replacement; verify captured-state reconstruction, issue codes different from identities, first-match replacement among duplicate issue codes, replacement ownership and validator-versus-external clearing.
6. Condition contract migration; compile all affected packages and migrate existing condition consumers and tests. Verify sync condition behavior and validation ordering.
7. Documentation, examples and config analysis; then integrate manager completion and submission in their separate projects.

Compile the repository from its root with `npm run compile` before cross-package tests: other packages import engine build output. Run the smallest relevant Jest file from its package and the corresponding class coverage command described in the testing approach; escalate to broader tests when migration impacts require it.

## Remaining decisions and release gate

- **Q20 — Resolved:** An API failure blocks saving. A separate failure marker is necessary because `skipped` and `Undetermined` alone do not block.
- **Q28 — Resolved:** Reuse the builder duplicate check for validator identities. That does not prevent distinct handlers returning the same issue code; see Q31.
- **Q29 — Resolved:** An empty handler message for `NoMatch` is a `CodingError`. Localization precedence and localized-template trust policy still need to be specified during implementation.
- **Q30 — Clarified:** Yes, rejection and malformed results differ from Q20. Q20 concerns an operational failure that the handler catches and reports in a successfully resolved Promise; Q30 concerns a handler violating its contract. The proposed defensive behavior is to log a `CodingError` and keep saving blocked.
- **Q31 — Resolved:** When two distinct validators return the same issue code, replace the first matching issue in stored order and retain that issue's validator owner.
- Finish stale-run and final-notification behavior before claiming manager-level completion or submission safety. A field-level validator feature may be built first, but it must not be advertised as a submission-ready gate.
