# Async Validators

Some validation needs an answer that is not available immediately. For example, a user name may have to be checked against an application service. An async validator lets your application perform that check and return its result to Jivs.

Unlike the usual validators, an async validator uses a handler function rather than a Condition. The handler supplies the error code and message when it finds an issue. Jivs incorporates the result into the owning ValueHost's validation state.

## Add an async validator

### Quick start

There are two actions:
1. Build a handler function
2. Connect your handler function with the `builder`.

Assume `builder` and `availabilityApi` are supplied by your application. The handler reads the field value, awaits the check, and returns a result:

For these examples, `availabilityApi.isAvailable(name, level, abortSignal)`
returns a Promise for `{ available: boolean; error?: string }`; a nonempty
`error` indicates an operational failure.

```ts
const checkAvailability = async (valueHost, valueHostsManager, abortSignal) => {
    const name = valueHost.getValue();
    if (typeof name !== 'string' || name.length === 0)
        return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
    const level = valueHostsManager.getValueHost('level').getValue();
    if (typeof level !== 'number' || level < 0)
        return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };

    const result = await availabilityApi.isAvailable(name, level, abortSignal);
    if (result.error)
        throw new Error(result.error);
    return result.available
        ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
        : {
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: '{Label} is already in use.'
        };
};

builder.field('UserName', LookupKey.String, { label: 'User name' })
    .asyncValidator('AvailabilityCheck', checkAvailability, {
        dependencyValueHostNames: ['level']
    });
```
## The handler function

`AsyncValidatorEvaluateHandler` is the function type accepted by
`asyncValidator()`. It receives the owning `ValueHost`, the `ValueHostsManager`,
and an `AbortSignal`, and returns a `Promise` that resolves to an
`AsyncValidatorEvaluationResult`:

```ts
export type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatorsValueHost,
    valueHostsManager: IValueHostsManager,
    abortSignal: AbortSignal
) => Promise<AsyncValidatorEvaluationResult>;
```

- _valueHost_ provides the value being validated. 
    ```ts
    const name = valueHost.getValue();                                           
    if (typeof name !== 'string' || name.length === 0)                           
        return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
    ```
    > Always validate retrieved values are legal for your handler's needs. Return ConditionEvaluateResult.Undetermined if not.

- _valueHostsManager_ used when the check depends on other ValueHosts. 
    ```ts
    const level = valueHostsManager.getValueHost('level').getValue();
    if (typeof level !== 'number' || level < 0)
        return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
    ```

- _abortSignal_ - pass to APIs that support cancellation. We already have it setup to abort after a time limit.
    ```ts
    const result = await availabilityApi.isAvailable(name, level, abortSignal);
    ```
    The [AbortSignal class](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) is built into modern browsers.


## Building your handler
Let's revisit the example from the earlier Quick Start. This time with two coding patterns: async/await and promise-chain. Use their comments for guidance.

Assume the application API has this shape:

```ts
interface AvailabilityApi {
    isAvailable(
        name: string,
        level: number,
        abortSignal: AbortSignal
    ): Promise<{ available: boolean; error?: string }>;
}
```

### Async/await pattern
```ts
function createAvailabilityHandler(api: AvailabilityApi): AsyncValidatorEvaluateHandler {
    return async (valueHost, valueHostsManager, abortSignal) => {
        // Get the inputs needed for the API request.
        const name = valueHost.getValue();
        const level = valueHostsManager.getValueHost('level').getValue();

        // Return Undetermined when the inputs are not usable.
        if (typeof name !== 'string' || name.length === 0)
            return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
        if (typeof level !== 'number' || level < 0)
            return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };

        // Call the API with the cancellation signal.
        const result = await api.isAvailable(name, level, abortSignal);

        // Throw API-reported failures; AsyncValidator handles them.
        if (result.error)
            throw new Error(result.error);

        // Map the successful response to Match or NoMatch.
        return result.available
            ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
            : {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                // Both fields are required for a NoMatch result.
                errorCode: 'NameTaken',
                errorMessage: '{Label} is already in use.'
            };
    };
}
```
#### Async/await notes
- Add every ValueHost name that you use as input to the `dependencyValueHostNames` option when setting up the `AsyncValidator`. See [Your handler depends on another ValueHost](#your-handler-depends-on-another-valuehost).
- Always validate your inputs and return `ConditionEvaluateResult.Undetermined` when they fail.
- A synchronous throw or rejected Promise is caught by `AsyncValidator` and converted to a blocking failure result. You do not need to add a `try/catch`; see [failedToResolve error info](#failedtoresolve-error-info-on-asyncvalidator) only when you want handler-specific failure details.

### Promise-chain pattern

This version has the same behavior and results, but composes the work with
`.then()` instead of `await`. It leaves rejected-Promise handling to
`AsyncValidator`, as in the async/await version.

```ts
function createAvailabilityHandler(api: AvailabilityApi): AsyncValidatorEvaluateHandler {
    return (valueHost, valueHostsManager, abortSignal) => Promise.resolve()
        .then(() => {
            // Get the inputs needed for the API request.
            const name = valueHost.getValue();
            const level = valueHostsManager.getValueHost('level').getValue();

            // Return Undetermined when the inputs are not usable.
            if (typeof name !== 'string' || name.length === 0)
                return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
            if (typeof level !== 'number' || level < 0)
                return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };

            // Call the API with the cancellation signal.
            return api.isAvailable(name, level, abortSignal).then(result => {
                // Throw API-reported failures; AsyncValidator handles them.
                if (result.error)
                    throw new Error(result.error);

                // Map the successful response to Match or NoMatch.
                return result.available
                    ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
                    : {
                        conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                        // Both fields are required for a NoMatch result.
                        errorCode: 'NameTaken',
                        errorMessage: '{Label} is already in use.'
                    };
            });
        });
}
```
#### Promise-chain notes
- Add every ValueHost name that you use as input to the `dependencyValueHostNames` option when setting up the `AsyncValidator`. See [Your handler depends on another ValueHost](#your-handler-depends-on-another-valuehost).
- Always validate your inputs and return `ConditionEvaluateResult.Undetermined` when they fail.
- A rejected Promise is caught by `AsyncValidator` and converted to a blocking failure result. You do not need to add `.catch()`; see [failedToResolve error info](#failedtoresolve-error-info-on-asyncvalidator) only when you want handler-specific failure details.

### Return AsyncValidatorEvaluationResult

The handler returns an `AsyncValidatorEvaluationResult`. Its members are:

```ts
export interface AsyncValidatorEvaluationResult {
    conditionEvaluateResult: ConditionEvaluateResult;
    failedToResolve?: Error;
    errorCode?: string;
    errorMessage?: string;
    severity?: ValidationSeverity;
}
```

#### AsyncValidatorEvaluationResult: State properties
- **`conditionEvaluateResult`** — Required. Use `Match` when the check passes,
  `NoMatch` when it finds a validation issue, or `Undetermined` when it cannot
  evaluate the input.
- **`failedToResolve`** — Assign a diagnostic `Error` indicating the operation
  could not complete. Jivs logs it internally and does not display its message.

| conditionEvaluateResult | failedToResolve | Meaning |
| --- | --- | --- |
| `Match` | No | The check passed; no issue is created. |
| `NoMatch` | No | The check found an issue. Supply a nonempty `errorCode` and `errorMessage`. |
| `Undetermined` | No | The check could not determine a result, for example because an input is missing. No issue is created. |
| `Undetermined` | Yes | The operation failed. Jivs logs the `Error`, creates a blocking field issue, and keeps the host in `ValidationStatus.Failed`. |

#### AsyncValidatorEvaluationResult: Issue creation properties

- **`errorCode`** — Provides an identity for the error, and is used to localize with the [ErrorMessagesService](../JivsServices/ErrorMessagesService.md).
- **`errorMessage`** — Provides the error message. It may include `{Label}`.
- **`severity`** — Optional; defaults to `Error`. For ordinary `NoMatch`, a
  `Warning` is displayed without blocking by itself, while `Severe` blocks
  saving but cannot stop validators already started. For `failedToResolve`,
  `Warning` is normalized to `Error` because the operation blocks saving.

Always assign `errorCode` and `errorMessage` when `conditionEvaluateResult=NoMatch`. They become an `IssueFound` to appear in the Error Display and Validation Summary widgets.
When `failedToResolve` is assigned, Jivs also creates a blocking `IssueFound`.
If the handler omits failure-specific details, Jivs uses the options supplied
to `asyncValidator()` and then the global async-validation settings.
##### NoMatch can report different errors

The handler can report different error codes for different outcomes. Jivs uses the returned `errorCode`, not the validator's identity, to look up a localized message through [ErrorMessagesService](../JivsServices/ErrorMessagesService.md). If there is no matching localized message, an ordinary `NoMatch` uses the handler's `errorMessage`.

For example, the `NameTaken` result above can use this registration:

```ts
errorMessagesService.registerErrorMessage('NameTaken', LookupKey.String, {
    'en': '{Label} is already in use.',
    'es': '{Label} ya está en uso.'
});
```

##### failedToResolve error info on AsyncValidator

`AsyncValidator` catches synchronous exceptions and rejected handler
Promises. You can let an error throw or reject to use the config/global
fallbacks; a `try/catch` is not required for a blocking failure issue.

Catch the error only when you want to supply handler-specific issue details:

```ts
try {
    const result = await api.isAvailable(name, level, abortSignal);
    if (result.error)
        throw new Error(result.error);
    return result.available
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
        errorCode: 'AvailabilityCheckUnavailable',
        errorMessage: 'We could not verify availability right now. Please try again.'
    };
}
```

Handler-provided `errorCode`, `errorMessage`, and `severity` take precedence
over the corresponding config and global values. Config fallbacks are supplied
as the third builder argument:

```ts
builder.field('UserName', LookupKey.String, { label: 'User name' })
    .asyncValidator('AvailabilityCheck', createAvailabilityHandler(availabilityApi), {
        failedToResolveErrorCode: 'AvailabilityCheckUnavailable',
        failedToResolveErrorMessage: 'We could not verify {Label} right now. Please try again.',
        failedToResolveSeverity: ValidationSeverity.Error
    });
```

##### Global async-validation settings
Global async-validation settings are in `IJivsServices.settings.asyncValidation`.
Set them when configuring the services returned by your application's
`createJivsServices()` function:

```ts
// within createJivsServices
services.settings.asyncValidation.timeout = 5000;
services.settings.asyncValidation.failedToResolveErrorMessage = 'We couldn\'t complete this check right now. Please try again.';
services.settings.asyncValidation.failedToResolveErrorCode = 'AsyncValidationFailed';
services.settings.asyncValidation.failedToResolveSeverity = ValidationSeverity.Error;
```

The global timeout defaults to 5000 ms and can be overridden by the
per-validator `timeout` option. The other default values are shown. The error
code is used for localization through `ErrorMessagesService`; the configured
messages are unlocalized fallback text.
For unresolved failures, `Warning` severity is normalized to `Error` because
the operation blocks saving.

## Connect your handler with the builder

The field builder provides this method:

```ts
asyncValidator(
    identity: string,
    handler: AsyncValidatorEvaluateHandler,
    options?: FluentAsyncValidatorConfig
): IValidatorBuilder;
```

- **`identity`** — Required, stable identity for this async validator. Keep it
  unique among validators and other validator error codes on the same
  ValueHost. It identifies the validator; the handler's `errorCode` identifies
  an issue.
- **`handler`** — Required `AsyncValidatorEvaluateHandler`. See [Building your handler](#building-your-handler).
- **`options`** — Optional configuration object. Common options include:
  - `dependencyValueHostNames` for other ValueHosts read by the handler. See [below](#your-handler-depends-on-another-valuehost).
  - `failedToResolveErrorCode`, `failedToResolveErrorMessage`, and
    `failedToResolveSeverity` for fallback issue details.
  - `restartWhenPending` — Controls what happens when an attempt to validate occurs while the same validator is already waiting for another response.
    - `WhenInputsChanged` retains the existing process. However, it will restart
    if any of the inputs changed. Inputs include the validator's own ValueHost and those in `dependencyValueHostNames`. This is the default.
    - `Always` cancels the existing process and starts it fresh.
  - `skipOnModelLevelValidation` — Async validation handlers often have an equivalent on the server side. If you are trying to submit a page with that equivalent, set this to true. It skips this validator during model-level validation.
  - `timeout` — Maximum time in milliseconds for this check. If omitted,
    `AsyncValidator` uses `IJivsServices.settings.asyncValidation.timeout`,
    which defaults to 5000 ms.

For example:

```ts
builder.field('UserName', LookupKey.String, { label: 'User name' })
    .requireText('Enter a user name.')
    .asyncValidator('AvailabilityCheck', createAvailabilityHandler(availabilityApi), {
        dependencyValueHostNames: ['level'],
        failedToResolveErrorCode: 'AvailabilityCheckUnavailable',
        failedToResolveErrorMessage: 'We could not verify {Label} right now. Please try again.',
        timeout: 1000
    });
```

### Your handler depends on another ValueHost

If a handler reads another ValueHost, list that ValueHost's name in the
`dependencyValueHostNames` option. This lets
Jivs recognize that a change to the other value affects the owning field's
validation.

```ts
builder.field('UserName', LookupKey.String, { label: 'User name' })
    .asyncValidator('AvailabilityCheck', createAvailabilityHandler(availabilityApi), {
        dependencyValueHostNames: ['level']
    });
```

When a listed dependency changes after the owning ValueHost has been validated, Jivs can revalidate it if the change requests validation; otherwise it marks the owning ValueHost as needing validation.

## When async validators run

Async validators run after the standard validators on the same ValueHost, regardless of their order in the builder chain. 

Several async validators can be pending at once and may finish in a different order than they started. When a newer validation or a value change makes a previous result obsolete, Jivs does not apply the old result to the current ValueHost state. See the following subsection for how to stop underlying requests when that happens.

### Use `AbortSignal` to cancel underlying work

The handler receives an `AbortSignal` as its third argument. Pass it to APIs
that support cancellation, for example `fetch(url, { signal: abortSignal })`.
Jivs aborts the signal when it cancels or supersedes pending work. When a
timeout occurs, Jivs creates the blocking failure issue first, then aborts
the signal to request that the underlying request stop.

Cancellation is cooperative: an API may ignore the signal, in which case its
work continues, but Jivs will not apply an obsolete result to current
ValueHost state. Cancellation by itself is not a validation failure. See the
[AbortSignal reference on MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal).

## When async validators do not run

- A preceding validator that reports an issue with `ValidationSeverity=Severe` issue will stop validation before an async handler starts. Expect both RequiredText and any DataTypeCheck validation to use `Severe` and block the async handler.
- ValueHost or Validator is disabled
- `ValidateOptions.duringEdit` = true
- `ValidateOptions.preliminary` = true

## Waiting for completion
- Field-level validation starts the async process and returns immediately, allowing the user to continue editing.
- Model-level validation starts and waits for the process to finish.

Use `onValueHostValidationStateChanged` or `onValidationStateChanged` to observe state changes and update the UI. While work is pending, `asyncProcessing` is true and `doNotSave` is true on the state supplied to you. `isValid` alone is not a submission gate.

---
Go to [Validators Home](./Home.md)

Go to [API Home](../Home.md)