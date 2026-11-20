# Async Validators

Some validation needs an answer that is not available immediately. For example, a user name may have to be checked against an application service. An async validator lets your application perform that check and return its result to Jivs.

Unlike the usual validators, an async validator uses a handler function rather than a Condition. The handler supplies the error code and message when it finds an issue. Jivs incorporates the result into the owning ValueHost's validation state.

## Add an async validator

### Quick start

There are two actions:
1. Build a handler function
2. Connect your handler function with the `builder`.

Assume `builder` and `availabilityApi` are supplied by your application. The handler reads the field value, awaits the check, and returns a result:

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
    .asyncValidator('AvailabilityCheck', checkAvailability);
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

The _valueHost_ provides the value being validated. 
```ts
const name = valueHost.getValue();                                           
if (typeof name !== 'string' || name.length === 0)                           
    return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
```
> Always validate retrieved values are legal for your handler's needs. Return ConditionEvaluateResult.Undetermined if not.

Use the _valueHostsManager_ when the check depends on other ValueHosts. 
```ts
const level = valueHostsManager.getValueHost('level').getValue();
if (typeof level !== 'number' || level < 0)
    return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
```

The _abortSignal_ requests cooperative cancellation; pass it to APIs that support cancellation. We already have it setup to abort after a time limit.
```ts
const result = await availabilityApi.isAvailable(name, level, abortSignal);
```
The [AbortSignal class](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) is built into modern browsers.

Cancellation is not itself a validation failure. If a request is ignored or completes after its
result is obsolete, Jivs does not apply that result to current ValueHost
state, but the application's work may continue. When a timeout occurs, Jivs
produces the blocking failure issue first, then aborts the signal to request
that the underlying work stop.

## Building your handler
Let's revisit the example from the earlier Quick Start. This time with two coding patterns: async/await and promise-chain. Use their comments for guidance.

### Async/await pattern
```ts
function createAvailabilityHandler(api: AvailabilityApi): AsyncValidatorEvaluateHandler {
    return async (valueHost, _valueHostsManager, abortSignal) => {
        try {
        // get input values for your API
        // Validate them returning immediately with Undetermined if invalid.
            const name = valueHost.getValue();
            if (typeof name !== 'string' || name.length === 0)
                return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
            const level = valueHostsManager.getValueHost('level').getValue();
            if (typeof level !== 'number' || level < 0)
                return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
        // execute the async api function
            const result = await api.isAvailable(name, level, abortSignal);
        // offload returned errors either by throwing or returning 
        // a result with its failedToResolve property setup
            if (result.error)
                throw new Error(result.error);        
        // Evaluate the result to determine if its valid (Match) or not (NoMatch)
        // Return a result reflecting each.
            return result.available
                ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
                : {
                    conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                // Always supply both errorCode and errorMessage
                    errorCode: 'NameTaken',
                    errorMessage: '{Label} is already in use.'
                };
        }
        catch (error) {
            return {
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                failedToResolve: error instanceof Error ? error : new Error(String(error))
            };
        }
    };
}
```
#### Async/await notes
- Add every valueHost name that you use as inputs into the `dependencyValueHostsName` option when setting up the `AsyncValidator`.
- Always validate your inputs and return `ConditionEvaluateResult.Undetermined` when they fail.
- Use the abortSignal in API calls that support it.
- Use `throw new Error('message')` to report a failure. Our `AsyncValidator` will catch it and prepare the `AsyncValidatorEvaluateHandler` from it.

- Catch thrown errors from API calls if you want to return specific error codes and error messages within `AsyncValidatorEvaluationResult`.

### Promise-chain pattern

This version has the same behavior and results, but handles completion with
`.then()` and `.catch()` instead of `await`:

```ts
function createAvailabilityHandler(api: AvailabilityApi): AsyncValidatorEvaluateHandler {
    return (valueHost, _valueHostsManager, abortSignal) => Promise.resolve()
        .then(() => {
        // get input values for your API
        // Validate them returning immediately with Undetermined if invalid.  
            const name = valueHost.getValue();
            if (typeof name !== 'string' || name.length === 0)
                return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
            const level = valueHostsManager.getValueHost('level').getValue();
            if (typeof level !== 'number' || level < 0)
                return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
        // execute the async api function
            return api.isAvailable(name, level, abortSignal).then(result =>
            // offload returned errors either by throwing or returning 
            // a result with its failedToResolve property setup
                if (result.error)
                    throw new Error(result.error);                   
        // Evaluate the result to determine if its valid (Match) or not (NoMatch)
        // Return a result reflecting each.
                result.available
                    ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
                    : {
                        conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                        errorCode: 'NameTaken',
                        errorMessage: '{Label} is already in use.'
                    });
        })
        .catch(error => ({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: error instanceof Error ? error : new Error(String(error))
        }));
}
```
#### Promise-chain notes
- Add every valueHost name that you use as inputs into the `dependencyValueHostsName` option when setting up the `AsyncValidator`.
- Always validate your inputs and return `ConditionEvaluateResult.Undetermined` when they fail.
- Use the abortSignal in API calls that support it.
- Catch thrown errors from API calls if you want to return specific error codes and error messages within `AsyncValidatorEvaluationResult`.

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

#### Result detail properties
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

#### Create an issue shown to the user
Always assign `errorCode` and `errorMessage` when `conditionEvaluateResult=NoMatch`. They become an `IssueFound` to appear in the Error Display and Validation Summary widgets.
When failedToResolve is setup, it too will create an `IssueFound`. If you don't supply them here, Jivs will locate them either from the options you used to setup the AsyncValidator or from global settings.
- **`errorCode`** — Provides an identity for the error, and is used to localize with the [ErrorMessagesService](../JivsServices/ErrorMessagesService.md).
- **`errorMessage`** — Provides the error message. It may include `{Label}`.
- **`severity`** — Optional; defaults to `Error`. For ordinary `NoMatch`, a
  `Warning` is displayed without blocking by itself, while `Severe` blocks
  saving but cannot stop validators already started. For `failedToResolve`,
  `Warning` is normalized to `Error` because the operation blocks saving.

##### NoMatch error info

The handler can report different error codes for different outcomes. Jivs uses the returned `errorCode`, not the validator's identity, to look up a localized message through [ErrorMessagesService](../JivsServices/ErrorMessagesService.md). If there is no matching localized message, an ordinary `NoMatch` uses the handler's `errorMessage`.

For example, the `NameTaken` result above can use this registration:

```ts
errorMessagesService.registerErrorMessage('NameTaken', LookupKey.String, {
    'en': '{Label} is already in use.',
    'es': '{Label} ya está en uso.'
});
```

##### failedToResolve error info on AsyncValidator
```ts
builder.field('UserName', LookupKey.String, { label: 'User name' })
    .asyncValidator('AvailabilityCheck', createAvailabilityHandler(availabilityApi), {
        failedToResolveErrorCode: 'AvailabilityCheckUnavailable',
        failedToResolveErrorMessage: 'We could not verify {Label} right now. Please try again.',
        failedToResolveSeverity: ValidationSeverity.Error
    });
```

##### failedToResolve error info in global settings
Global settings are part of the JivsServices object which you setup in the `createJivsServices()` function.
```ts
// within createJivsServices
services.globalSettings.asyncValidator.failedToResolveErrorMessage = 'message';
services.globalSettings.asyncValidator.failedToResolveErrorCode = 'code';
services.globalSettings.asyncValidator.failedToResolveSeverity = ValidationSeverity.Severe;
```

## Connect your handle within the Builder

The builder offers this function on its field() member:
```ts
builder.field(parameters).asyncValidator(identity: string, handler: AsyncValidatorEvaluateHandler, options);
```

Use the handler in a field configuration just like the quick-start example:

```ts
builder.field('UserName', LookupKey.String, { label: 'User name' })
    .requireText('Enter a user name.')
    .asyncValidator('AvailabilityCheck', createAvailabilityHandler(availabilityApi),
    {
        // options
    });
```
- _identity_ - 
- _handler_ -
- _options_ - 

### Your handler depends on another ValueHost

If a handler reads another ValueHost, list that ValueHost's name in
`dependencyValueHostNames` in the optional third builder argument. This lets
Jivs recognize that a change to the other value affects the owning field's
validation.

```ts
interface AccountAvailabilityApi {
    isAvailableForAccountType(name: string, accountType: string, signal: AbortSignal): Promise<boolean>;
}

// accountAvailabilityApi is an application-provided AccountAvailabilityApi.
const evaluateAccountName: AsyncValidatorEvaluateHandler = async (valueHost, manager, abortSignal) => {
    const name = valueHost.getValue();
    const accountType = manager.getValueHost('AccountType')?.getValue();
    if (typeof name !== 'string' || typeof accountType !== 'string')
        return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };

    try {
        const available = await accountAvailabilityApi.isAvailableForAccountType(name, accountType, abortSignal);
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


## When async validators run

Async validators run after the standard validators on the same ValueHost, regardless of their order in the builder chain. 

Several async validators can be pending at once and may finish in a different order than they started. When a newer validation or a value change makes a previous result obsolete, Jivs does not apply the old result to the current ValueHost state. Jivs can request cancellation by aborting the signal passed as the handler's third argument. Pass it to APIs that support cancellation, for example `fetch(url, { signal })`. Cancellation is cooperative: the handler must stop its own side effects when necessary.

## When async validators do not run

- A preceding validator that reports an issue with `ValidationSeverity=Severe` issue will stop validation before an async handler starts. Expect both RequiredText and any DataTypeCheck validation to use `Severe` and block the async handler.
- ValueHost or Validator is disabled
- `ValidateOptions.duringEdit` = true
- `ValidateOptions.preliminary` = true

## Waiting for validation

`ValueHostsManager.validate()` starts applicable validators and returns a snapshot, not a Promise for their completion. While work is pending, `asyncProcessing` is true and `doNotSave` is true. `isValid` alone is not a submission gate.

Use `onValueHostValidationStateChanged` or `onValidationStateChanged` to observe state changes and update the UI. Once applicable work has settled, `currentValidationState()` provides the current manager snapshot. Callbacks can be suppressed with `skipCallback`; the manager-level callback can also be delayed by its configured debounce.

*Important: The current API does not provide a manager-level operation that waits for all applicable async validation as a submission gate. An application must coordinate completion and changes to values itself before relying on a final state; do not submit using the immediate snapshot from `validate()`.*

---
Go to [Validators Home](./Home.md)

Go to [API Home](../Home.md)