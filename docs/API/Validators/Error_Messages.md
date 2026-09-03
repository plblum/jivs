# Error Messages
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

## Using the TextLocalizerService
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