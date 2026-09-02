# Configuring Validators
Validators are configured within a `ValueHostRulesBase` subclass using the Builder or Adapter objects. This process is covered in detail in the [ValueHostsManager Configuration Guide](../../ValueHostsManager_Configuration_Guide.md).

Here is a prototype of your `ValueHostRulesBase` subclass. 
```ts
class MyModelRules extends ValueHostRulesBase {
    protected override configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions
    ): void {
        builder.field('fieldname', LookupKey.datatype)
            .validatorname(parameters)
            .validatorname(parameters);
    }
}
```
- _validatorname_ is effectively the condition name in pascalCase and omitting the word "Condition". (RequiredTextCondition → requiredText; RangeCondition → range). Yet there are some variations (AllMatchesCondition → all, LessThanCondition is both lessThan and lt)
- _parameters_ reflects two overloaded forms.
    - required rules and both error message and summary message.
    - required rules and the Validation Parameters object.

Let's look at the `RangeCondition` to see how its setup in Builder:
```ts
range(minimum, maximum, errorMessage?, summaryMessage?);
range(minimum, maximum, 
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
```
## Validation Parameters object
Let’s go through each property of the overloaded range() function below. The following applies to all validators.
- `errorMessage` – The error message intended to be show in an Error Display widget specific to one field. There are many features here, including that you don't need to assign it if you setup defaults. See [Error messages](#error-messages) below.
- `errorMessagel10n` – Localization key for the error message. Most of the time, it is based on the errorCode or ConditionType, and this can be left unassigned.
- `summaryMessage` – Same idea as errorMessage except to be shown in a Validation Summary widget. It's normal to include the field label in this message, using the {Label} token: “{Label} requires a value”. It too can be omitted if you setup defaults.
- `summaryMessagel10n` – Localization key for the summary message. Most of the time, it is based on the errorCode or ConditionType, and this can be left unassigned.
- `severity` – Controls some validation behaviors with these three values.
  - `Error` – Error but continue evaluating the remaining validation rules. This is the default when `severity` is omitted.
  - `Severe` – Error and do not evaluate any more validation rules for this `ValueHost` until the error is fixed.
  - `Warning` – Want to give the user some direction, but not prevent saving the data. This will not block submitting and will not change the `ValidationState.IsValid` property to false.
- `errorCode` – Each validator has an error code that is used to align it with error message lookup and other features. Normally you can leave this unassigned and it will use the ConditionType built into the supplied condition. See [Using the errorCode](#using-the-errorcode).
- `enabled` – A way to quickly disable the Validator. Alternatively use the `WhenCondition` or `builder.whenToEnable()` function to control the enabled state based on a condition. See [WhenCondition](../Conditions/Conditions_Included_with_Jivs.md#when-using-one-condition-to-enable-another).

## Example
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
## Error Messages
Error messages may seem pretty basic. What's so hard about writing one?

`'This field requires a value'`

`'Invalid input'`

However, there are a lot more aspects to them, and that's because we want to make it easy for the user to consume them! _Guideline: make the message clear enough for the user to quickly take the correct action._

Jivs has a lot of depth in its error message support.

- Validators have two error messages. Its `errorMessage` property, designed for proximity to the UI widget, is succinct, focusing on the issue without field context.  

  `Requires a value.`

  Its `summaryMessage` property, intended for a Validation Summary displayed elsewhere on the screen, includes the field name for clarity. 
  
  `First name requires a value.`
  
- Error messages can contain tokens. Let's look at this one which represents a range validation rule evaluating a date input:

    `The {Label} must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}. You entered {Value:AbbrevDate}.`

  - Tokens can show the configuration of the validation rule. Here is gets the field's name in {Label} and being a Range validation rule, its minimum and maximum.
  - The {Value} token will show the current input value.
  - Values may not already be strings. A formatter is used to convert a native value (like a Date object) into a localized string. If written as {Minimum}, it would use a default formatter (short date pattern). But here the user wants the abbreviated date pattern, so the token allows for {tokenName:formatter}.

  The message as its displayed to the user:
  
    `The Event Date must be between Jan 1, 2025 and Mar 30, 2025. You entered Jun 6, 2025.`
  
- You can setup default error message templates also with the [TextLocalizerService](#using-the-textlocalizerservice).
- Error messages are localizable with the [TextLocalizerService](#using-the-textlocalizerservice).

### Using the TextLocalizerService
The `TextLocalizerService` is so useful that you may put all of your error messages in it, until the default you supply fails to meet our guideline: _make the message clear enough for the user to quickly take the correct action_. See [TextLocalizerService](../JivsServices/Localization.md#setup-for-validatorconfigerrormessage-and-summarymessage-properties).

Configure your error messages within your `createJivsServices()` function.

```ts
let tls = vhm.services.textLocalizerService;    
// defaults for RequireTextConditions
tls.registerErrorMessage(ConditionType.RequireText, null, {
    '*': 'This field requires a value.'
});
tls.registerSummaryMessage(ConditionType.RequireText, null, {
    '*': '{Label} requires a value.'
});    

// providing messages influenced by the FieldValueHost's dataType property
service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
    '*': 'Invalid value. Enter a date.',
    'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
    'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
});
service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
    '*': '{Label} has an invalid value. Enter a date.',
    'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
    'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
});        

// When you supply your own errorCode. In this case, errorCode='SameNameWarning'
tls.registerErrorMessage('SameNameWarning', null, {
    '*': 'Are you sure that your first and last names are the same?'
});
tls.registerSummaryMessage('SameNameWarning', null, {
    '*': 'In {Label}, are you sure that your first and last names are the same?'
});    
```
Here's the Builder API using those delegated error messages.
```ts
builder.field('FirstName', LookupKey.String, { label: 'First name' } )
    .requireText() // Looked up in TextLocalizerService using ConditionType.RequireText
    .notEqualTo('LastName', null, null, {
        errorCode: 'SameNameWarning', // Looked up in TextLocalizerService
        severity: 'Warning'   
    });
builder.field('LastName', LookupKey.String, { label: 'Last name' }).requireText();
builder.field('BirthDate', LookupKey.Date); // DataTypeCheckCondition is automatically used
```
## Using the errorCode
Each validator has an error code that is used to align it with the [TextLocalizerService](#using-the-textlocalizerservice) and other features. Its value is setup during configuration, but is usually omitted due to it taking on a default.
```ts
builder.field('FirstName', LookupKey.String, { label: 'First name'} )
   .requiredText()  // errorCode defaults to ConditionType.RequireText
   .notEqualTo('LastName', {
        errorCode: 'SameNameWarning',
   });
```
The error code is used like this:
- To lookup the error message with the [`TextLocalizerService`](#using-the-textlocalizerservice).
- It is included in the `IssueFound object` that is passed to the UI along with the error message to allow your UI to recognize it.
- When business logic provides errors, they can supply their own error code. You have to convert your error info into an `IssueFound object` and call `ValueHostsManager.addExternalIssueFound()` for it to appear in Jivs. At that time, map it to the ConditionType or errorCode found on an individual Jivs validator. Your business logic error now activates the same validator, using the error message supplied for that validator.

Assign the errorCode property in these cases:
- When using any of these conditions if you need to align it with error message lookup:
    - `WhenCondition`
    - `NotCondition`
    - `AllMatchCondition`
    - `AnyMatchCondition`
    - `CountMatchesCondition`
- The same condition type is used more than once.
- To clarify the purpose of the error.
- To conform with a business logic error code.
- To provide multiple localized error messages for the same condition type.

---
Go to [Validators Home](./Home.md)

Go to [API Home](../Home.md)