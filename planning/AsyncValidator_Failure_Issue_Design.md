# AsyncValidator Failure Issues

## Status and scope

This document records the design and implementation of user-facing issues for
async validation operations that cannot complete. The snippets show the
implemented contracts and the key behavior; see the linked source for the
complete implementation.

The scope is field-level `AsyncValidator` failures reported through
`AsyncValidatorEvaluationResult.failedToResolve`, including handler-reported
errors, handler rejections, and timeouts. Manager-level async completion and
submission gating remain separate work.

## Problem

Before this change, `failedToResolve` meant the validator could not determine a
result. `AsyncValidator` logged the `Error` and returned it in
`ValidatorValidateResult`, but did not create an `IssueFound`. The host recorded
the failed handler identity and blocked saving, so the Validation Summary had
no message explaining the block. The validator and host now create and publish
a validator-owned issue for the failure.

Displaying the exception message is not appropriate: it is diagnostic data and
may include implementation details or sensitive response information. At the
same time, a generic engine message alone may be less helpful than information
the application already has. For example, an availability check can explain
that Jivs could not verify an account right now.

Relevant current behavior is in
[`AsyncValidator.resolveValidationResult()`](../packages/jivs-engine/src/Validation/AsyncValidator.ts),
[`AsyncValidatorEvaluationResult`](../packages/jivs-engine/src/Interfaces/AsyncValidator.ts),
and the async settlement logic in
[`ValidatorsValueHostBase`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts).

## Implemented behavior

1. A failure continues to block saving through the retained failed-handler
   identity.
2. The failure also produces one validator-owned `IssueFound` that can be shown
   in the field and the Validation Summary.
3. The handler may provide a safe `errorCode`, `errorMessage`, and `severity`
   for its failure. The validator config and global settings provide fallbacks.
4. If no application-supplied message is available, use a generic message such
   as "We couldn't complete this check right now. Please try again." The
   message can be localized through the error-code lookup. Do not display the
   underlying `Error`.
5. A timeout uses the same failure-message resolution as any other unresolved
   operation. It has no separate user-facing timeout message.
6. Cancellation and obsolete results do not create or publish a failure issue.

## Handler result

`AsyncValidatorEvaluationResult` already has `errorCode`, `errorMessage`, and
`severity` for ordinary `NoMatch` results. Reuse those fields for an
operational failure when `failedToResolve` is assigned; their current `NoMatch`
meaning remains unchanged otherwise.

```ts
const evaluateAvailability: AsyncValidatorEvaluateHandler =
    async (valueHost, manager, abortSignal) => {
        try {
            const available = await availabilityApi.isAvailable(valueHost.getValue(), abortSignal);

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
                failedToResolve: error instanceof Error
                    ? error
                    : new Error(String(error)),
                errorCode: 'AvailabilityCheckUnavailable',
                errorMessage: "We couldn't verify this account right now.",
                severity: ValidationSeverity.Error
            };
        }
    };
```

The handler-supplied message must be safe for end-user display. The raw
`failedToResolve` value remains internal and is logged as a diagnostic.
Unexpected throws/rejections and timeouts have no handler-supplied display
details, so they use the config/global fallback settings.

## Configuration and fallback values

`AsyncValidatorConfig` has failure-specific properties. Their names keep these
defaults distinct from the ordinary validator message properties, which
`AsyncValidatorConfig` omits.

```ts
export interface AsyncValidatorConfig {
    // Existing members omitted.

    failedToResolveErrorCode?: string;
    failedToResolveErrorMessage?: string;
    failedToResolveSeverity?: ValidationSeverity;
}
```

The global async-validation settings provide corresponding defaults under the
existing
[`AsyncValidationSettings`](../packages/jivs-engine/src/Interfaces/JivsServices.ts)
conventions.

```ts
export interface AsyncValidationSettings {
    timeout: number;

    failedToResolveErrorCode: string;
    failedToResolveErrorMessage: string;
    failedToResolveSeverity: ValidationSeverity;
}
```

Resolve each value in this order:

| Value | Precedence |
| --- | --- |
| Error code | Handler result, validator config, global setting (default `AsyncValidationFailed`) |
| Severity | Handler result, validator config, global setting (default `Error`) |
| Fallback `errorMessage` text | Handler result, validator config, global setting |

`errorMessage` values from the handler, config, and global settings are
unlocalized fallback text; there is no companion l10n property. Use the
resolved `errorCode` as the lookup key in `ErrorMessagesService`, as with other
validator messages. If no localized message is found, use the first available
fallback `errorMessage`. This lets a handler provide a code with
application-specific translations while retaining a readable fallback.
Apply the usual HTML encoding and `{Label}` token resolution before exposing
the message in an `IssueFound`. If no message can be resolved, use the
engine's generic fallback rather than the exception message.

The default severity is `Error`. Normalize a resolved `Warning` severity to
`Error` for unresolved failures, regardless of whether it came from the
handler, validator config, or global settings. This keeps the displayed
severity consistent with the fact that the failure blocks saving.

## Constructing the engine result

`AsyncValidatorEvaluationResult` is application-facing. The engine converts it
into `ValidatorValidateResult`; callers should not construct the latter.
[`AsyncValidator.resolveValidationResult()`](../packages/jivs-engine/src/Validation/AsyncValidator.ts)
routes unresolved operations through `createFailedToResolveResult()`. That
method applies the precedence below and uses the existing message resolver for
localization, HTML encoding, and token resolution:

```ts
const settings = this.services.settings.asyncValidation;
const errorCode = failureDetails?.errorCode ||
    this.config.failedToResolveErrorCode ||
    settings.failedToResolveErrorCode;
const messageResult = {
    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
    errorCode,
    errorMessage: failureDetails?.errorMessage ||
        this.config.failedToResolveErrorMessage ||
        settings.failedToResolveErrorMessage
};
const errorMessage = this.resolveErrorMessage(messageResult);
let severity = this.resolveSeverity(
    failureDetails?.severity ??
        this.config.failedToResolveSeverity ??
        settings.failedToResolveSeverity);
if (severity === ValidationSeverity.Warning)
    severity = ValidationSeverity.Error;

const issueFound = this.createIssueFound();
issueFound.errorCode = errorCode;
issueFound.errorMessage = errorMessage;
issueFound.summaryMessage = errorMessage;
issueFound.severity = severity;
issueFound.doNotSave = true;
return {
    issueFound,
    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
    failedToResolve: error
};
```

`createIssueFound()` supplies the field's `valueHostName` and the
`asyncIdentity`, which is the configured `handlerIdentity`. The identity and
issue code serve different purposes:

- `asyncIdentity` identifies the validator that failed and owns the issue.
- `errorCode` identifies the issue for localization and display.

Do not copy `handlerIdentity` into `errorCode` merely to track the failure.
Multiple validators may use the same generic failure code while retaining
separate ownership through `asyncIdentity`.

## Host state, blocking, and recovery

The host stores failed handler identities separately from `IssueFound`
entries. These retained identities cause `ValidationStatus.Failed` and block
saving; they are not themselves issue error codes or messages. The issue
explains the block and remains separately owned by its async validator.

Async settlement handles a failed result by:

- recording the handler identity as failed;
- adding or replacing that handler's failure issue, keyed by `asyncIdentity`;
- keeping the issue blocking with `doNotSave: true`; and
- notifying validation-state observers when the visible or blocking state
  changes.

A definitive `Match` or `NoMatch` from the same handler means the operational
failure has recovered: remove its failure marker and clear or replace its
failure issue. A `NoMatch` may then leave an ordinary validation issue. A
skipped or ordinary `Undetermined` result does not prove recovery and should
retain the failure marker and issue. Stale or canceled work must not alter
current state. Failures from separate async validators remain independent.
At the start of a new validation, the host carries forward the existing issues
whose `asyncIdentity` is still marked failed. A definitive retry removes that
handler's retained issue before adding any new `NoMatch` issue. Explicit
`clearValidation()` still clears displayed issues while retaining failure
markers.

The failure marker remains authoritative for blocking. The issue explains the
block and makes it visible; it must not become an external issue with the
external-issue lifecycle or save semantics.

## Issue propagation and manager consumers

The `ValidatorValidateResult` contract does not inherently require
`issueFound` to be null when `conditionEvaluateResult` is `Undetermined`.
Synchronous host validation already processes an `issueFound` independently
of the condition result. Previously the async settlement path handled
`failedToResolve` first but ignored `ivr.issueFound`; merely creating an issue
in the validator therefore did not make it visible.

The async failure branch in
[`ValidatorsValueHostBase.validate()`](../packages/jivs-engine/src/ValueHosts/ValidatorsValueHostBase.ts)
now adds or replaces `ivr.issueFound` in the current run's `issuesFound`
before updating instance state. It reconciles by `asyncIdentity`, records the
failed identity, and preserves `Failed` status independently of the issue's
condition result and severity.

The nested `applyResolvedValidatorResult()` function publishes the issue in
the existing `if (ivr.failedToResolve)` branch before
`updateInstanceStateWithResult()`:

```ts
if (ivr.failedToResolve) {
    if (asyncIdentity !== null)
        failedIdentities.add(asyncIdentity);
    else
        requestedStatus = ValidationStatus.Failed;

    const issue = ivr.issueFound;
    if (issue) {
        issue.doNotSave = true;
        const issues = [...(result.issuesFound ?? [])];
        const existingIndex = asyncIdentity === null ? -1 :
            issues.findIndex(
                existing => existing.asyncIdentity === asyncIdentity);
        if (existingIndex < 0)
            issues.push(issue);
        else
            issues[existingIndex] = issue;
        result.issuesFound = issues;
    }

    reviseStatusIfFailed();
    if (updateInstanceStateWithResult(result))
        notifyAsyncStateChanged();
}
```

The key behavior is to publish the issue before saving the run's state; it is
not routed through the `NoMatch` branch because operational failure remains
`Undetermined`. A new array avoids mutating published instance state before
change detection and notification.

The manager consumers are compatible with the host storing the issue:

- `ValidatableValueHostBase.doNotSave` returns true for
  `ValidationStatus.Failed` and also considers stored issues with
  `doNotSave: true`. `ValueHostsManager.calculateDoNotSave()` delegates to
  each applicable ValueHost's `doNotSave`.
- `ValidatableValueHostBase.getIssuesFound()` returns stored validator issues
  without checking the condition result. `ValueHostsManager.getIssuesFound()`
  aggregates those host issues; it does not filter on `NoMatch`.
- Manager validation-state snapshots gather both `doNotSave` and
  `getIssuesFound()`. The host's normal state-change notification must still
  run so the manager invalidates its cached snapshot.

Consequently, no special `ValueHostsManager.getIssuesFound()` or
`calculateDoNotSave()` condition-result handling was necessary. Focused
manager-snapshot coverage verifies that the issue is included and saving
remains blocked.

These manager paths should remain structurally unchanged:

```ts
// ValueHostsManager.calculateDoNotSave()
if (vh.groupCheck(options) && vh.doNotSave)
    return true;

// ValueHostsManager.getIssuesFound()
const vhIssues = vh.getIssuesFound(group);
if (vhIssues)
    list = list.concat(vhIssues);
```

## Timeout settings

Timeouts should flow through the same operational-failure result path, using
the configured or global fallback message. Keep the timeout duration setting,
but remove the timeout-specific user-facing message and localization key.
Continue logging timeout diagnostics internally.

## Implementation and verification

The config/result contracts, global defaults, validator failure issue
construction, host issue settlement, and timeout-message removal are
implemented. Handler identity remains the failure/recovery key and
`IssueFound.asyncIdentity`; `errorCode` is reserved for issue localization.
`Warning` is normalized to `Error` for unresolved failures.

Focused tests cover handler/config/global message resolution, localization,
Warning normalization, timeout and rejection fallbacks, diagnostic logging,
issue visibility in manager snapshots, save blocking, and issue recovery.
