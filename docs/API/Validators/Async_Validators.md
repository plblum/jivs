# Async Validators

Some validation needs an answer that is not available immediately. For example, a user name may have to be checked against an application service. An async validator lets your application perform that check and return its result to Jivs.

Unlike the usual validators, an async validator uses a handler function rather than a Condition. The handler supplies the error code and message when it finds an issue. Jivs incorporates the result into the owning ValueHost's validation state.

## Add an async validator

### Quick start

This template creates a Promise and resolves it when the operation finishes. Replace `callMyAPI` with your own service call and adapt its result to your application's response.

1. Create a handler that evaluates the value and returns a Promise with a result:
    ```ts
    import { AsyncValidatorEvaluationResult } from '@plblum/jivs-engine/build/Interfaces/AsyncValidator';
    import { ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';
    import { IValidatorsValueHost } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
    import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';

    // Replace this declaration with your application's API function.
    declare function callMyAPI(value: number): Promise<{
        isValid: boolean;
        errorCode: string;
        errorMessage: string;
    }>;

    function myAsyncFn(
        valueHost: IValidatorsValueHost,
        valueHostsManager: IValueHostsManager,
        abortSignal: AbortSignal
    ): Promise<AsyncValidatorEvaluationResult> {
        return new Promise<AsyncValidatorEvaluationResult>((resolve) => {
            const reportFailure = (error: unknown) => {
                resolve({
                    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                    failedToResolve: error instanceof Error ? error : new Error(String(error)),
                    // the next two can be omitted and they will use global settings
                    errorCode: 'AvailabilityCheckUnavailable',
                    errorMessage: 'We could not verify availability right now. Please try again.'
                });
            };

            try {
                const value = valueHost.getValue();
            // if we don't have a useful value, return Undetermined.
                if (typeof value !== 'number') {
                    resolve({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined });
                    return;
                }

            // Async process: here is emulates an API call
                callMyAPI(value).then((result) => {
                    if (result.isValid)
                        resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
                    else
                        resolve({
                            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                            errorCode: result.errorCode,
                            errorMessage: result.errorMessage
                        });
                }).catch(reportFailure);
            }
            catch (error) {
                reportFailure(error);
            }
        });
    }
    ```

    A `NoMatch` must include a nonempty error code and message. The `try/catch` handles synchronous exceptions, while the API Promise's `.catch()` handles rejections and exceptions in its `.then()` callback. Both resolve the handler's Promise with `failedToResolve`. The API function must report request failures as rejections; for example, `fetch()` does not reject merely because the server returns an HTTP error status.

2. Attach the handler to a field using the builder:
    ```ts
    builder.field('fieldname', LookupKey.Integer)
        .asyncValidator('My_Async_Function', myAsyncFn);
    ```

    Import `LookupKey` from `@plblum/jivs-engine/build/DataTypes/LookupKeys`. Choose a stable identity that is unique among validators and their error codes on this ValueHost.

### Using async/await

Use `asyncValidator()` in the same fluent chain as other field validators. The following example captures an application-owned API in a handler. The API's `isAvailable()` method returns a Promise for a boolean and rejects when the request cannot be completed.

```ts
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { AsyncValidatorEvaluateHandler } from '@plblum/jivs-engine/build/Interfaces/AsyncValidator';
import { ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';

interface AvailabilityApi {
    isAvailable(name: string): Promise<boolean>;
}

function createAvailabilityHandler(api: AvailabilityApi): AsyncValidatorEvaluateHandler {
    return async (valueHost, valueHostsManager) => {
        try {
            const name = valueHost.getValue();
            if (typeof name !== 'string' || name.length === 0)
                return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };

            const available = await api.isAvailable(name);
            return available
                ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
                : {
                    conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                    errorCode: 'NameTaken',
                    errorMessage: '{Label} is already in use.'
                };
        }
        catch (error) {
            return {
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                failedToResolve: error instanceof Error ? error : new Error(String(error)),
                // the next two can be omitted and they will use global settings
                errorCode: 'AvailabilityCheckUnavailable',
                errorMessage: 'We could not verify availability right now. Please try again.'
            };
        }
    };
}
```

In your ValueHost configuration, pass the handler and a stable identity to the builder:

```ts
builder.field('UserName', LookupKey.String, { label: 'User name' })
    .requireText('Enter a user name.')
    .asyncValidator('AvailabilityCheck', createAvailabilityHandler(availabilityApi));
```

Here `builder` is the configuration builder and `availabilityApi` is your application's implementation of `AvailabilityApi`. The identity `AvailabilityCheck` identifies the validator; `NameTaken` identifies a particular issue it reports. Keep the identity stable when recreating the configuration, and choose a name unique among validators and their error codes on the same ValueHost.

## Return a result

The handler must return a Promise that resolves to an `AsyncValidatorEvaluationResult`. An `async` function does this when it returns a result object.

```ts
export interface AsyncValidatorEvaluationResult
{
    /**
     * The result of the condition evaluation.
     */
    conditionEvaluateResult: ConditionEvaluateResult;
    /**
     * The error code associated with the validation result, if any.
     * Required when ConditionEvaluateResult is NoMatch. When failedToResolve is assigned, it
     * optionally identifies the operational-failure issue and its localization lookup.
     */
    errorCode?: string;
    /**
     * The error message associated with the validation result, if any.
     * Required when ConditionEvaluateResult is NoMatch. When failedToResolve is assigned, it
     * optionally provides unlocalized fallback text for the operational-failure issue.
     * It can contain the "{Label}" token which will be replaced with the appropriate ValueHost.label during evaluation.
     * The caller will:
     * - Apply HTML encoding.
     * - Localize or otherwise process the error message through the ErrorMessagesService based on the errorCode.
     * - Replace the "{Label}" token with the appropriate ValueHost.label.
     */
    errorMessage?: string;
    /**
     * The severity level of the validation result, if any.
     * If not supplied, it uses ValidationSeverity = Error.
     * For failedToResolve, Warning is normalized to Error because the operation blocks saving.
     * While you can supply ValidationSeverity = Severe, its feature is limited as it cannot stop processing
     * later validators in the ValueHost. Its use is to land in the IssueFound object for its consumers.
     */
    severity?: ValidationSeverity;
    /**
     * Indicates whether the validation could not be completed due to an error or failed API call.
     * Always assign when an exception occurs or an external API call fails during validation.
     * The Error is logged and never displayed. To customize the user-facing issue, also provide
     * errorCode, errorMessage, and/or severity. Missing values use AsyncValidatorConfig and global
     * async-validation fallbacks.
     */
    failedToResolve?: Error;
}
```

| Result | Meaning |
| --- | --- |
| `conditionEvaluateResult: ConditionEvaluateResult.Match` | The check passed; no issue is created. |
| `conditionEvaluateResult: ConditionEvaluateResult.NoMatch` | The check found an issue. Supply a nonempty `errorCode` and `errorMessage`. |
| `conditionEvaluateResult: ConditionEvaluateResult.Undetermined` | The check could not determine a result, for example because an input is missing. No issue is created. |
| `conditionEvaluateResult: ConditionEvaluateResult.Undetermined` and `failedToResolve: Error` | The operation failed. Jivs logs the `Error` internally, creates a blocking field issue, and keeps the host in `ValidationStatus.Failed`. |

Use `failedToResolve` for an operational failure, not for an ordinary validation rejection. The handler may also supply `errorCode`, `errorMessage`, and `severity` for the displayed failure issue. These values take precedence over `failedToResolveErrorCode`, `failedToResolveErrorMessage`, and `failedToResolveSeverity` in `AsyncValidatorConfig`, which in turn take precedence over the global async-validation settings. If the handler throws, its Promise rejects, or it times out, Jivs uses those config/global fallbacks. The underlying `Error` is never shown to the user; avoid including secrets in diagnostic errors.

The default global message is "We couldn't complete this check right now. Please try again." Its error code is `AsyncValidationFailed`; register localized text for that code through `ErrorMessagesService`. `errorMessage` values are unlocalized fallback text, with no separate l10n property. A failure's effective severity defaults to `Error`; a resolved `Warning` is normalized to `Error` because a failed operation blocks saving.

For `NoMatch`, an optional `severity` can be `ValidationSeverity.Error`, `Warning`, or `Severe`. It defaults to `Error`. A warning is displayed but does not itself block saving. `Severe` blocks saving, but an async result arrives too late to stop validators that have already started.

After an operational failure, the ValueHost reports `ValidationStatus.Failed`. The failure issue is associated with the handler through `asyncIdentity`; its `errorCode` remains the issue/localization code. A later `Match` or `NoMatch` from the same handler clears the failure issue and marker; a skipped or ordinary `Undetermined` result does not. Other validation issues or failures can still block saving.

## Error messages and identity

The handler can report different error codes for different outcomes. Jivs uses the returned `errorCode`, not the validator's identity, to look up a localized message through [ErrorMessagesService](../JivsServices/ErrorMessagesService.md). If there is no matching localized message, Jivs uses the handler's `errorMessage`. Supply a nonempty fallback even when a localized message is registered.

For example, the `NameTaken` result above can use this registration:

```ts
errorMessagesService.registerErrorMessage('NameTaken', LookupKey.String, {
    'en': '{Label} is already in use.',
    'es': '{Label} ya está en uso.'
});
```

Jivs HTML-encodes the selected message, then resolves tokens such as `{Label}`. The resulting text is used for both the field error and summary message; an async handler does not supply a separate summary. Token replacement safety depends on the configured message-token resolver, so follow the [presentation prerequisites](../../Learning_Jivs/Presentation/Jivs_Presentation_Prerequisites.md) for HTML.

## Requirements when writing a function
- Return a Promise resolving to a result. For operational errors, throw or
  reject, or explicitly return a failure like this:
    ```ts
    resolve({
        failedToResolve: error,
        conditionEvaluateResult: ConditionEvaluateResult.Undetermined
    });
    ```
- When the data is valid, return:
    ```ts
    resolve({
        conditionEvaluateResult: ConditionEvaluateResult.Match
    });
    ```
- When the data is invalid, return:
    ```ts
    resolve({
        conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
        errorCode: 'an error code',
        errorMessage: 'an error message'
    });
    ```    
- When the values used to call your API are not acceptable, such as they require a value but are empty, return:
    ```ts
    resolve({
        conditionEvaluateResult: ConditionEvaluateResult.Undetermined
    });
    ```    

## When async validators run

Async validators run after the standard validators on the same ValueHost, regardless of their order in the builder chain. 

Several async validators can be pending at once and may finish in a different order than they started. When a newer validation or a value change makes a previous result obsolete, Jivs does not apply the old result to the current ValueHost state. Jivs can request cancellation by aborting the signal passed as the handler's third argument. Pass it to APIs that support cancellation, for example `fetch(url, { signal })`. Cancellation is cooperative: the handler must stop its own side effects when necessary.

## When async validators do not run

- A preceding validator that reports an issue with `ValidationSeverity=Severe` issue will stop validation before an async handler starts. Expect both RequiredText and any DataTypeCheck validation to use `Severe` and block the async handler.
- ValueHost or Validator is disabled
- `ValidateOptions.duringEdit` = true
- `ValidateOptions.preliminary` = true

## Depend on another ValueHost

If a handler reads another ValueHost, list that ValueHost's name in
`dependencyValueHostNames` in the optional third builder argument. This lets
Jivs recognize that a change to the other value affects the owning field's
validation.

```ts
interface AccountAvailabilityApi {
    isAvailableForAccountType(name: string, accountType: string): Promise<boolean>;
}

// accountAvailabilityApi is an application-provided AccountAvailabilityApi.
const evaluateAccountName: AsyncValidatorEvaluateHandler = async (valueHost, manager) => {
    const name = valueHost.getValue();
    const accountType = manager.getValueHost('AccountType')?.getValue();
    if (typeof name !== 'string' || typeof accountType !== 'string')
        return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };

    try {
        const available = await accountAvailabilityApi.isAvailableForAccountType(name, accountType);
        return available
            ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
            : {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTakenForAccount',
                errorMessage: '{Label} is already in use for this account type.'
            };
    }
    catch (error) {
        return {
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: error instanceof Error ? error : new Error(String(error))
        };
    }
};

builder.field('UserName', LookupKey.String, { label: 'User name' })
    .asyncValidator('AccountNameCheck', evaluateAccountName, {
        dependencyValueHostNames: ['AccountType']
    });
```

When a listed dependency changes after the owning ValueHost has been validated, Jivs can revalidate it if the change requests validation; otherwise it marks the owning ValueHost as needing validation.

The builder also accepts `restartWhenPending`, `skipOnModelLevelValidation`,
`timeout`, and the `failedToResolve*` fallback options in this options object.
A pending validator is reused by default when its owner and declared
dependencies are unchanged; `Always` restarts it. Model-level skip cancels
pending work and skips this validator. The timeout defaults to 5000 ms and
produces the same logged, blocking failure issue as other operational errors;
there is no timeout-specific message.

## Waiting for validation

`ValueHostsManager.validate()` starts applicable validators and returns a snapshot, not a Promise for their completion. While work is pending, `asyncProcessing` is true and `doNotSave` is true. `isValid` alone is not a submission gate.

Use `onValueHostValidationStateChanged` or `onValidationStateChanged` to observe state changes and update the UI. Once applicable work has settled, `currentValidationState()` provides the current manager snapshot. Callbacks can be suppressed with `skipCallback`; the manager-level callback can also be delayed by its configured debounce.

*Important: The current API does not provide a manager-level operation that waits for all applicable async validation as a submission gate. An application must coordinate completion and changes to values itself before relying on a final state; do not submit using the immediate snapshot from `validate()`.*

---
Go to [Validators Home](./Home.md)

Go to [API Home](../Home.md)