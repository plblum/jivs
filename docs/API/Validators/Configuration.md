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
- _validatorname_ is effectively the condition name in pascalCase and omitting the word "Condition". (`RequiredTextCondition` → `requiredText`; `RangeCondition` → `range`). Yet there are some variations (`AllMatchesCondition` → all, `LessThanCondition` is both `lessThan` and `lt`)
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
- `errorMessage` – The error message intended to be show in an Error Display widget specific to one field. There are many features here, including that you don't need to assign it if you setup defaults. See [Error messages](./Error_Messages.md).
- `errorMessagel10n` – Localization key for the error message. Most of the time, it is based on the `errorCode` or `ConditionType`, and this can be left unassigned. See [Localization](../JivsServices/Localization.md#setup-for-validatorconfigerrormessage-and-summarymessage-properties)
- `summaryMessage` – Same idea as errorMessage except to be shown in a Validation Summary widget. It's normal to include the field label in this message, using the {Label} token: “{Label} requires a value”. It too can be omitted if you setup defaults. See [Error messages](./Error_Messages.md).
- `summaryMessagel10n` – Localization key for the summary message. Most of the time, it is based on the `errorCode` or `ConditionType`, and this can be left unassigned. See [Localization](../JivsServices/Localization.md#setup-for-validatorconfigerrormessage-and-summarymessage-properties)
- `severity` – Controls some validation behaviors with these three values.
  - `Error` – Error but continue evaluating the remaining validation rules. This is the default when `severity` is omitted.
  - `Severe` – Error and do not evaluate any more validation rules for this `ValueHost` until the error is fixed.
  - `Warning` – Want to give the user some direction, but not prevent saving the data. This will not block submitting and will not change the `ValidationState.IsValid` property to false.
- `errorCode` – Each `Validator` has an error code that is used to align it with error message lookup and other features. Normally you can leave this unassigned and it will use the `ConditionType` built into the supplied `Condition`. See [Error Codes](./ErrorCodes.md).
- `enabled` – A way to quickly disable the `Validator`. Alternatively use the `WhenCondition` or `builder.whenToEnable()` function to control the enabled state based on a `Condition`. See [WhenCondition](../Conditions/Conditions_Included_with_Jivs.md#when-using-one-condition-to-enable-another).

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
---
Go to [Validators Home](./Home.md)

Go to [API Home](../Home.md)