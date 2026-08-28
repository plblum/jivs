# Validators: Connecting Conditions to Error Messages

Validation is really just a process that evaluates some rule and returns a result. If there was an error, the result includes an error message. The `Validator class` handles this work. Here is pseudo-code representation of its interface (omitting many members).
```ts
interface IValidator {
    condition: ICondition;
    errorCode: string;
    conditionType: string;
    validate(options): ValidatorValidateResult | Promise<ValidatorValidateResult>;
    setEnabled(enabled): void;
}
```

## Configuring Validators
Validators have an underlying object, ValidatorConfig, that hosts the configuration. You generally use the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class) to assist setting it up.
> Configuration must be setup when [configuring the ValueHostsManager](#configuringvaluehostsmanager).
```ts
interface ValidatorConfig {
    errorCode?: string;
    conditionConfig: null | ConditionConfig;
    conditionCreator?: ConditionCreatorHandler;
    
    // note: 'null' is used to remove the value from an earlier version of the config
    errorMessage?: null | string | ((host) => string);
    errorMessagel10n?: null | string;
    summaryMessage?: null | string | ((host) => string);
    summaryMessagel10n?: null | string;
    
    severity?: ValidationSeverity | ((host) => ValidationSeverity);
    
    enabled?: boolean | ((host) => boolean);
}
```

Let’s go through each property.
- `errorCode` – Each validator must have a unique error code within a ValueHost to identify it. By default, it uses the value from `conditionConfig.conditionType` or the condition created by `conditionCreator` (below). 
  + It is used by these features:
    + Lookup the localized error message with the [`TextLocalizerService`](#localizing-strings-textlocalizerservice).
    + It is included in the `IssueFound object` that is passed to the UI along with the error message to allow your UI to recognize it. IssueFound is passed to your UI in these ValueHostsManager callbacks: `onValidationStateChanged` and `onValueHostValidationStateChanged`.
    + When the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class) has to merge validators using the `ValidatorConfigMergeService`.
    + When business logic provides errors, if its own error code matches this property, this validator reports an error, making it easy to ensure error messages are consistent and UI friendly.
  + Set it directly in these cases:
    + The same condition type is used more than once.
    + To clarify the purpose of the error.
    + To associate it with a business logic error code.
    + To provide multiple localized error messages for the same condition type.
  
- `conditionConfig` – Describes the condition itself. When using the Builder API, you don't set this property directly. See ["Configuring Conditions"](#configuring-a-validation-rule-in-jivs). 

  It is not the only way to setup a Condition…
-	[`conditionCreator`](#one-off-conditions) – Create a Condition by returning an implementation of ICondition. This choice gives you a lot of flexibility, especially when you have some complex logic that you feel you can code up in an `evaluate() function` easier than using a bunch of Conditions.
    
    Its function has this format:
    ```ts
    (requester: ValidatorConfig) => ICondition | null;
    ```
    When using the Builder API, use the [`customRule()`](#one-off-conditions) function instead of conditionCreator.
- `errorMessage` – A template for the message reporting an issue. Its intended location is nearby the Input, such that you can omit including the field’s label. “This field requires a value”. As a template, it provides tokens which can be replaced by live data. (Discussed later).
- `errorMessagel10n` – Localization key for the error message, used with the [TextLocalizerService](#localizing-strings-textlocalizerservice).
- `summaryMessage` – Same idea as errorMessage except to be shown in a Validation Summary. It's normal to include the field label in this message, using the {Label} token: “{Label} requires a value”.
- `summaryMessagel10n` – Localization key for the summary message, used with the [TextLocalizerService](#localizing-strings-textlocalizerservice).
- `severity` – Controls some validation behaviors with these three values.
  - `Error` – Error but continue evaluating the remaining validation rules. The default when `severity` is omitted.
  - `Severe` – Error and do not evaluate any more validation rules for this ValueHost until the error is fixed.
  - `Warning` – Want to give the user some direction, but not prevent saving the data.
- `enabled` – A way to quickly disable the Validator. Alternatively use the WhenCondition or `builder.whenToEnable()` function to control the enabled state based on a condition. See [Using the WhenCondition](#using-the-whencondition-to-enable-another-condition).

### Example with inline error messages
Now let’s add validators to our previous example using a Model with FirstName and LastName.
```ts
builder.field('FirstName', LookupKey.String, { label: 'First name'} )
   .requireText('This field requires a value', '{Label} requires a value.')
   .notEqualTo('LastName', {
        errorCode: 'SameNameWarning',
        errorMessage: 'Are you sure that your first and last names are the same?',
        summaryMessage: 'In {Label}, are you sure that your first and last names are the same?',
        severity: 'Warning'   
   });
builder.field('LastName', LookupKey.String, { label: 'Last name' })
   .requireText('This field requires a value', '{Label} requires a value.');
```

### Example with error messages in the TextLocalizerService
Error messages shown here are often delegated to the [TextLocalizerService](#localizing-strings-textlocalizerservice).
TextLocalizerService is setup when creating the JivsServices. Here's a relevant snippet.

```ts
service.registerErrorMessage(ConditionType.RequireText, null, {
    '*': 'This field requires a value.'
});
service.registerSummaryMessage(ConditionType.RequireText, null, {
    '*': '{Label} requires a value.'
});    
service.registerErrorMessage('SameNameWarning', null, {
    '*': 'Are you sure that your first and last names are the same?'
});
service.registerSummaryMessage('SameNameWarning', null, {
    '*': 'In {Label}, are you sure that your first and last names are the same?'
});    
```
Here's the Builder API using those delegated error messages.
```ts
builder.field('FirstName', LookupKey.String, { label: 'First name' } )
    .requireText()
    .notEqualTo('LastName', null, null, {
        errorCode: 'SameNameWarning',
        severity: 'Warning'   
    });
builder.field('LastName', LookupKey.String, { label: 'Last name' }).requireText();
```
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

## What Invokes Validation
Both the `ValueHostsManager` and `FieldValueHost` have a `validate()` function, as described in the next two sections.
### FieldValueHost.validate()
When a `FieldValueHosts`' value changed, call its `validate()` function or pass the `{ validate: true }` option into the `setValue()` (and related) function.

```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=> {
    let textValue = evt.target.value;
    let nativeValue = YourConvertToNativeCode(textValue);  // return undefined if cannot convert
    let valueHost = vhm.vh.field('FirstName');	// or vhm.getTextValueHost('FirstName')
    valueHost.setValues(nativeValue, textValue);
    valueHost.validate();
});	
firstNameFld.attachEventListener('oninput', (evt)=> {
    let valueHost = vhm.vh.field('FirstName');	// or vhm.getTextValueHost('FirstName')
    valueHost.setTextValue(evt.target.value);
    valueHost.validate({ duringEdit: true });
});
```
`validate()` takes an optional parameter called options which is this type:
```ts
interface ValidateOptions {
    group?: string;
    preliminary?: boolean;
    duringEdit?: boolean;
    skipCallback?: boolean;
}
```
These properties are all related to ValueHost value changes:
- `duringEdit` - Set to true when handling oninput events, or any other validation that needs to happen as the user types. Only a few validators will respond, including RequireTextCondition, RegExpCondition, and StringLengthCondition.
- `skipCallback` - Set to true if you have a reason to skip the `onValueHostValidationStateChanged callback` normally invoked by `validate()`.

The `setValue()`, `setValues()`, `setTextValue()`, and `setValueToUndefined()` functions all take an *options* parameter to include validation, saving a step:

```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=> {
    let textValue = evt.target.value;
    let nativeValue = YourConvertToNativeCode(textValue);  // return undefined if cannot convert
    vhm.vh.field('FirstName').setValues(nativeValue, textValue, { validate: true });
});	
firstNameFld.attachEventListener('oninput', (evt)=> {
    vhm.vh.field('FirstName').setTextValue(evt.target.value, { validate: true, duringEdit: true });
});
```
Here is the type for the *options* parameter:
```ts
interface SetValueOptions {
    validate?: boolean;
    duringEdit?: boolean;
    reset?: boolean;
    skipValueChangedCallback?: boolean;
    overrideDisabled?: boolean;
    ensureEnabled?: boolean; 
// FieldValueHosts add the following:
    injectedError?: InjectedError;
    disableParser?: boolean;
    disableFormatter?: boolean;
    skipIfUnchanged?: boolean;
}
```
These properties are all related to validation:
- `validate` - When true, invoke validation but only if the value changed. It defaults to true.
- `reset` - When true, change the state of the ValueHost to unchanged and validation has not been attempted. It defaults to false.
- `injectedError` - When you handle parsing, your parser may report an error that you want to display.
  Use this option to pass along the error. Jivs will display it. See [Injecting errors on demand](#injecting-errors-on-demand).

### ValueHostsManager.validate()
Prior to submitting or any time you want to validate the entire form, use `validate()` on `ValueHostsManager`.
```ts
let status = vhm.validate(); // it will notify elements in your UI of validation changes
if (status.doNotSave)
    // Prevent saving. User has to fix things
else
    // Submit the page's data
```
`validate()` takes an optional parameter called options which is this type:
```ts
interface ValidateOptions {
    group?: string;
    preliminary?: boolean;
    duringEdit?: boolean;
    skipCallback?: boolean;
}
```
These properties are all related to `ValueHostsManager` validation:
- `group` - Group validation is a tool to group validatable `ValueHosts` with a specific submit command when validating. If used, it needs a name assigned here and on `ValueHosts` that it targets. See their `ValueHostConfig.group` property. The name matching is case insensitive.

  Use when there is more than one group of validatable `ValueHosts` to be validated together.
  
  For example, the `ValueHostsManager` handles two forms at once. Give the `ValueHostConfig.group` a name for each form. Then make their submit command
  pass in the same group name.
  
- `preliminary` - Set to true when running a validation prior to a submit activity.
Typically used just after loading the form to report any errors already present.
When set, the RequireTextCondition is not checked as the user doesn't need
the noise complaining about missing input when they haven't had a chance to address it.
- `skipCallback` - Set to true if you have a reason to skip the `onValidationStateChanged callback` normally invoked by `validate()`.

## Current validation state on valuehost
Your user interface depends on knowing the state of validation. Has validation reported an error or not? Each validatable `ValueHost` has is own state that is found amongst several of its properties and functions.
- `isValid`
- `doNotSave`
- `status`
- `getIssuesFound()`
- `asyncProcessing`

*See the details of ValueHostValidationState below for more on these.*

However, its usually better to setup the `onValueHostValidationStateChanged callback` (on `ValueHostsManagerConfig`) and let it pass you this informative object:
```ts
interface ValueHostValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
    status: ValidationStatus;
}
```
Here is an example of using `onValueHostValidationStateChanged callback`.
```ts
let services = createJivsServices('en-US');
let rules = new PersonModelRules();// subclass of ValueHostRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
let vhm = new ValueHostsManager(config);

// Direct validation changes to the HTML elements
// of a specific field, so they can update their appearance
function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
    let fldId = valueHost.getName();
    let editor = document.getElementById(fldId);
    let errorHost = document.querySelector('.errorHost[data-for=' + fldId + ']');
    if (validationState.isValid)
    {
        editor.classList.remove('invalid');
        errorHost.classList.remove('invalid');      
    }
    else
    {
        editor.classList.add('invalid');
        errorHost.classList.add('invalid');      
    }
    // remove the current contents then if there are errors to shown, add them
    errorHost.innerHtml = '';
    if (validationState.issuesFound)
    {
        let ul = document.createElement('ul');
        for (let i = 0; i < validationState.issuesFound.length; i++)
        {
        let li = document.createElement('li');
        li.textContent = validationState.issuesFound[i].errorMessage;
        ul.append(li);
        }
        errorHost.append(ul);
    }
}
```
Let's go through `ValueHostValidationState` properties:
- `status` - Each ValueHost has status codes related to validation. Several reflect the state before validation is even attempted.
    + `NotAttempted` - So far, the value has not been changed and validation has not occurred.
    + `NeedsValidation` - The value has been changed and needs validation.
    + `Undetermined` - Validation occurred but the Condition could not make a determination of Match or NoMatch. 
    
        > Neither `isValid` nor `doNotSave` deal with a status of Undetermined. Undetermined indicates that the validators are incorrectly setup, such as you have a validator that expects a date, but are supplying a number. So this status should be addressed while in development.
    + `Invalid` - Validation occurred and the Condition reported NoMatch. Thus the value is invalid.
    + `Valid` - Validation occurred and the Condition reported Match. Thus the value is valid.
- `isValid` - When true, the data appears to be valid. However, `isValid` is only false when there was an explicit `status` of *Invalid*. Statuses like *Undetermined* and *NotAttempted* are true as far as `isValid` is concerned. As a result, it's better to check `doNotSave` to know if you can submit the data.
- `doNotSave` - Determines if a validator doesn't consider the ValueHost's value ready to save. It is true when `status` is *Invalid* or *NeedsValidation*. It is also true when `asyncProcessing` is true.
- `issuesFound` - An array of all issues found or null when there are no issues found. See below for more on the `IssueFound type`.
- `asyncProcessing` - When evaluating an asynchronous Condition, validation will return before it is done, with the results from the rest of the Conditions. `asyncProcessing` is true at this moment, and until all asynchronous Conditions are finished. Expect `onValueHostValidationStateChange callbacks` after the validation runs, and after each async Condition finishes, giving you the latest validation state.

Here is the `IssueFound type`, which is supplied in the issuesFound array above:
```ts
interface IssueFound {
    errorMessage: string;
    errorCode?: string;
    valueHostName?: string;
    severity?: ValidationSeverity;
    summaryMessage?: string;
}
```
Going through its properties:
- `errorMessage` - The error message, fully localized and prepared to display.
- `errorCode` - The error code from the Validator supplying this IssueFound. Error codes default to the ConditionType value used to select the Condition, but can be supplied as you configure the Validator in ValidatorConfig.errorCode.
- `valueHostName` - The name of the ValueHost supplying this IssueFound.
- `severity` - The severity: Severe, Error, or Warning. When Warning, the value is considered valid, but you wanted to show the user some message anyway.
- `summaryMessage` - The error message that targets the ValidationSummary. 

## Current validation state on ValueHostsManager
The `ValueHostsManager` has similar functions to those on validatable `ValueHosts`, only it is a consolidated represention from the `ValueHosts`. The validation state is used prior to submitting the data and by the ValidationSummary as the state changes.

`ValueHostsManager's` validation state is found amongst several of its properties and functions.
- `isValid`
- `doNotSave`
- `asyncProcessing`
- `getIssuesFound()`

*See the details of ValidationState below for more on these.*

When you need notifications as it changes, its setup the `onValidationStateChanged callback` (on `ValueHostsManagerConfig`) and let it pass you this informative object:
```ts
interface ValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
}
```
Here is an example of using `onValidationStateChanged callback`.
```ts
let services = createJivsServices('en-US');
let rules = new PersonModelRules();// subclass of ValueHostRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
builder.onValidationStateChanged = formValidated;
let vhm = new ValueHostsManager(config);

function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
    ... shown earlier ...
}
function formValidated(valueHostsManager: IValueHostsManager, validationState: ValidationState): void
{
    let valSummary = document.querySelector('.validationsummary');
    if (validationState.isValid)
    {
        valSummary.classList.remove('invalid');      
    }
    else
    {
        valSummary.classList.add('invalid');      
    }
    // remove the current contents then if there are errors to shown, add them
    valSummary.innerHtml = '';
    if (validationState.issuesFound)
    {
        let ul = document.createElement('ul');
        for (let i = 0; i < validationState.issuesFound.length; i++)
        {
            let li = document.createElement('li');
            li.textContent = validationState.issuesFound[i].errorMessage;
            ul.append(li);
        }
        valSummary.append(ul);
    }
}
```

Let's go through `ValidationState` properties:
- `isValid` - When true, the value appears to be valid. However, it's only false when there was an explicit `status` of *Invalid* within at least one ValueHost. It's better to check `doNotSave` to know if you can submit the data.
- `doNotSave` - Determines if any `ValueHost` doesn't consider its value ready to save. It is true when the `ValueHost` validation `status` is *Invalid* or *NeedsValidation*. It is also true when `asyncProcessing` is true.
- `issuesFound` - An array of all issues found or null when there are no issues found. See the previous section for details on the IssueFound type that populates this array.
- `asyncProcessing` - When evaluating an asynchronous Condition, validation will return before it is done, with the results from the rest of the Conditions. `asyncProcessing` is true at this moment, and until all asynchronous Conditions are finished. Expect `onValueHostValidationStateChange callbacks` after the validation runs, and after each async Condition finishes, giving you the latest validation state.

## Actions that change the validation state
All of these actions can change the validation state whether on `ValueHostsManager` or a `ValueHost`. However, you will only be notified through `onValidationStateChanged` and `onValueHostValidationStateChanged` if the state actually changed.
- `validate()`
- `clearValidation()`
- `addExternalIssuesFound()` and `addExternalIssueFound()`
- `clearExternalIssuesFound()`
- using any of these with the { validate: true} option as a parameter: `setValue()`, `setValues()`, `setTextValue()`, `setValueToUndefined()`.
- An asynchronous Condition just finished
