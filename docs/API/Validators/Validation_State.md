## Validation State and Issues Found
Your user interface will receive a `ValidationState object` through its `onValidationStateChanged` callback. You will use its data to determine if there are any validation issues, and to show its issues. Those issues are within `IssueFound objects`.

It will received `ValueHostValidationState objects` through its `onValueHostValidationStateChanged` callback. Its data is specific to a single `FieldValueHost`, and identifies if there are validation issues. Use those issues, found in `IssueFound objects`, to display error messages.

### ValidationState
The `ValidationState object` is returned by `ValueHostsManager.validate()` and through its `onValidationStateChanged` callback. 

```ts
interface ValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
}
```
- `isValid` - When true, there is nothing known to block validation. However, there are other factors
    to consider: there may be warning issues found or an async validator is still running. 
    So check `doNotSave` as the ultimate guide to saving.
    When false, there is at least one validation error.
- `doNotSave` - When true, do not allow submission or saving, as the data is not in a state to be saved.
    Unlike isValid, this will resolve as true:
    - Validators yet to be validated
    - Validators marked Invalid
    - Validators still running asynchronously
- `issuesFound` - All `IssueFound objects`, each supplying an error message and other supporting data. See it below. They come from several sources:
    - Validators that ran validation and identified an `IssueFound`, which includes when severity=Warning.
    - Added through the `ValueHostsManager.addExternalIssuesFound()` and `addExternalIssueFound()` functions.
- `asyncProcessing` - When true, an asynchronous validation process is still running.

```ts
config.onValidationStateChanged = myValStateChanged;
let vhm = new ValueHostsManager(config); // assume fully setup with validators
...
let valState = vhm.validate();  // Most likely, you'll let valState come through onValidationStateChanged

function myValStateChanged(valueHostsManager: IValueHostsManager, valState: ValidationState)
{
    if (valState.issuesFound?.length > 0)
    {
        // create error message content
        let errors: string = '';
        for (let i = 0, valState.issuesFound.length - 1, i++)
        {
            let issueFound = valState.issuesFound[i];
            errors += '<br >' + issueFound.errorMessage;
        }
        // show that content
    }
    else
    {
        // remove error message content
    }
}
```
### ValueHostValidationState
The `ValueHostValidationState object` is returned through the `ValueHostsManager.onValueHostValidationStateChanged` callback.
```ts
interface ValueHostValidationState extends ValidationState
{
    corrected: boolean;    
    status: ValidationStatus;
}
```
- `isValid`, `doNotSave`, `issuesFound`, and `asyncProcessing` are shown above.
- `corrected` - Set to true when the user has fixed all invalid validators on this `FieldValueHost`.
- `status` - Reports the current `ValidationStatus`.
    - `NotAttempted` - Indicates that `validate()` has yet to be attempted
    - `NeedsValidation` - Indicates that either native value or text value was changed
        but has yet to be validated.
    - `Undetermined` - Validation was not run, including when the Validator.severity is Off.
    - `Valid` - Validation completed with all Conditions evaluating as Match
    - `Invalid` - Validation completed with at least one Condition evaluating as NoMatch
    - `Disabled` - ValueHost is disabled, thus so is validation.

### IssueFound
Each `IssueFound object` is the result of some validator having something to report. Most reports
are for invalid data. Those with severity=Warning are considered valid.
These are the source of error messages.

```ts
interface IssueFound {
    errorMessage: string;
    summaryMessage?: string;
    severity?: ValidationSeverity;
    errorCode?: string;
    valueHostName?: string;
    doNotSave?: boolean;
}
```
- `errorMessage` - The error message, with all tokens and localization already applied.
- `summaryMessage` - A companion error message that is ideal for the Validation Summary element. 
  If null or undefined, use `errorMessage` as no `summaryMessage` was supplied.
- `severity` - Determines how a Validator behaves if there was an issue:
    - `Error` (or null/undefined) - Normal error
    - `Severe` - When there are multiple validators, normally they all get a chance to validate. With Severe,
      validation stops, leaving the remaining validators set to `ValidationStatus.Undetermined`.
    - `Warning` - The issue isn't enough to block saving. Its informative. For example,
      "Person is under age 18. Please confirm with Parent."
- `errorCode` - Identifies the issue type so the consumer can align it with a specific validator or business rule.
    It is essential when using the `TextLocalizerService`.
    Its value is initially the Condition's ConditionType. You can override it using the Validator's `errorCode` configuration property
    If supplied through `ValueHostsManager.addExternalIssueFound()`, it can be null/undefined and the system will generate one. In doing so, the developer opts out of validator alignment.
