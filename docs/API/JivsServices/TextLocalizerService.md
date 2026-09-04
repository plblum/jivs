# TextLocalizerService

`TextLocalizerService` supports the `errorMessage` and `summaryMessage` properties of `Validators` in two ways:

- It provides a reusable library of default strings, avoiding the need to configure the same messages on every `Validator`.
- It provides localized versions of those strings and of text used to replace tokens within them.

For example, the message library allows this:

```ts
builder.field('FirstName', LookupKey.String)
    .requireText();
```

Instead of:

```ts
builder.field('FirstName', LookupKey.String)
    .requireText('This value is required.', '{Label} is required.');
```

The service can also localize text supplied by other parts of Jivs:

- `ValueHostConfig.label`, used by `{Label}` and `{SecondLabel}` tokens
- `ValueHostConfig.dataType`, used to select the text for the `{DataType}` token
- `DataTypeParsers` when they report invalid input

## Working with ValidatorConfig.errorMessage and summaryMessage properties

When a Validator does not supply `errorMessage` or `summaryMessage`, Jivs can retrieve those strings from `TextLocalizerService`.

This allows the application to:

- reuse consistent strings across `Validators`
- localize those strings for the active culture
- provide more specific guidance for individual data types

The supplied `createJivsServices()` function registers strings for `Validators` within `createTextLocalizerService()`. Review and expand these registrations to support the `Validators`, data types, and cultures used by your application.

Use `registerErrorMessage()` and `registerSummaryMessage()` to register the two forms of an error message:

```ts
service.registerErrorMessage(errorCode, dataTypeLookupKey, cultureToText);
service.registerSummaryMessage(errorCode, dataTypeLookupKey, cultureToText);
```

- `errorCode` matches the Validator’s `errorCode`. When one is not supplied, the Validator uses its `ConditionType`.
- `dataTypeLookupKey` optionally provides strings tailored to a particular data type.
- `cultureToText` maps culture codes to localized strings. Its keys can be language-region codes such as en-GB, language codes such as en, or `'*'`. Including `'*'` is strongly recommended because it provides a string when neither the language-region nor language code has been registered.

For example, `DataTypeCheck` can provide region-specific instructions for entering a date:

```ts
service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date, {
    '*': 'Invalid value. Enter a date.',
    'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
    'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
});

service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date, {
    '*': '{Label} has an invalid value. Enter a date.',
    'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
    'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
});
```

Jivs first looks for the complete language-region code, such as `en-GB`. If no string is registered, it falls back to the language code, such as `en`, and then to `'*'`.

### Using Localization Keys with Error Messages

The previous registrations allow Jivs to select strings automatically from a `Validator's` error code and the `ValueHost's` data type. A `Validator` can instead request specific strings through its `errorMessagel10n` and `summaryMessagel10n` properties.

Register each string with a unique Localization Key:

```ts
service.register('AccountNameRequired', {
    '*': 'An account name is required.',
    'es': 'Se requiere un nombre de cuenta.'
});

service.register('AccountNameRequiredSummary', {
    '*': '{Label} requires an account name.',
    'es': '{Label} requiere un nombre de cuenta.'
});
```

Then assign those Localization Keys to the `Validator`:

```ts
builder.field('AccountName', LookupKey.String).requireText({
    errorMessagel10n: 'AccountNameRequired',
    summaryMessagel10n: 'AccountNameRequiredSummary'
});
```

The `errorMessage` and `summaryMessage` properties can still provide fallback strings. Jivs uses them when the requested Localization Key has no string for the active culture or its fallbacks.

Every string registered through `registerErrorMessage()` or `registerSummaryMessage()` can also be requested explicitly through its Localization Key.

The keys use these formats:

- Error message: `EM-{errorCode}-{dataTypeLookupKey}`
- Error message without a data type: `EM-{errorCode}`
- Summary message: `SEM-{errorCode}-{dataTypeLookupKey}`
- Summary message without a data type: `SEM-{errorCode}`

For example, these Localization Keys refer to strings registered for the `RequireText` Condition:

```text
EM-RequireText
SEM-RequireText
```

Assign them to a Validator through `errorMessagel10n` and `summaryMessagel10n`:

```ts
builder.field('FirstName', LookupKey.String).requireText({
    errorMessagel10n: 'EM-RequireText',
    summaryMessagel10n: 'SEM-RequireText'
});
```

This is useful when a `Validator` should explicitly use strings that were previously registered for another error code or data type. Jivs normally selects these registered strings automatically when `errorMessagel10n` and `summaryMessagel10n` are not supplied.

## Working with ValueHostConfig.label

The `label` property supplies the text used by the `{Label}` and `{SecondLabel}` tokens in error messages. Use its companion `labell10n` property when that text needs to be localized.

For example, configure a `ValueHost` with both a fallback label and a Localization Key:

```ts
builder.field('FirstName', LookupKey.String, {
    label: 'First Name',
    labell10n: 'FirstName'
});
```

Register the localized strings for that key within `createTextLocalizerService()`:

```ts
service.register('FirstName', {
    '*': 'First Name',
    'es': 'Nombre',
    'fr': 'Prénom'
});
```

When resolving `{Label}` or `{SecondLabel}`, Jivs uses `labell10n` to request the localized label. If no matching string is found, it uses `label` as the fallback.

Register application-defined Localization Keys with:

```ts
textLocalizerService.register(localizationKey, cultureToText);
```

- `localizationKey` matches the value assigned to `labell10n`.
- `cultureToText` maps culture codes to localized strings. Its keys can be language-region codes such as `en-GB`, language codes such as `en`, or `'*'`. Including `'*'` is strongly recommended because it provides a string when neither the language-region nor language code has been registered.

Jivs searches `cultureToText` in this order:

1. language and region, such as `en-GB`
2. language, such as `en`
3. `'*'`
4. the fallback supplied by `label`

### Working with ValueHostConfig.dataType

The `{DataType}` token is primarily used by the `Validator` for `DataTypeCheckCondition`. It allows one error message to describe invalid input for every data type:

```text
Invalid value. Expects {DataType}.
```

The ValueHost’s `dataType` determines the text that replaces the token. For a `ValueHost` using `LookupKey.Integer`, the resulting error message might be:

```text
Invalid value. Expects an integer number.
```

Configure the `ValueHost's` data type as usual:

```ts
builder.field('Age', LookupKey.Integer);
```

Then register the localized text for that Lookup Key within `createTextLocalizerService()`:

```ts
service.registerDataTypeLabel(LookupKey.Integer, {
    '*': 'an integer number',
    'es': 'un número entero',
    'fr': 'un nombre entier'
});
```

The supplied `create_services.ts` file registers labels for several standard Lookup Keys. Add registrations for other Lookup Keys used by your application.

```ts
textLocalizerService.registerDataTypeLabel(dataTypeLookupKey, cultureToText);
```

- `dataTypeLookupKey` identifies the data type associated with the text.
- `cultureToText` maps language-region codes, language codes, and `'*'` to localized strings.

Write each label to fit naturally within the complete error message. For example, the supplied labels include articles such as “a” or “an” because the default message uses `Expects {DataType}`.

If no registered text matches the active culture or its fallbacks, Jivs uses the Lookup Key itself as the `{DataType}` text.

## Localizing DataTypeParser Error Messages

When a `DataTypeParser` cannot convert a text value, it returns error information that includes an error code and a Lookup Key. Jivs uses those values to request an `errorMessage` and `summaryMessage` from `TextLocalizerService`.

Most supplied parsers report `DataTypeParserBase.ParserErrorCode`. Registering strings for individual data types allows the same parser error code to provide more useful guidance:

```ts
service.registerErrorMessage(DataTypeParserBase.ParserErrorCode, LookupKey.Date, {
    '*': 'Invalid value. Enter a date.'
});

service.registerSummaryMessage(DataTypeParserBase.ParserErrorCode, LookupKey.Date, {
    '*': '{Label} has an invalid value. Enter a date.'
});

service.registerErrorMessage(DataTypeParserBase.ParserErrorCode, LookupKey.Number, {
    '*': 'Invalid value. Enter a number.'
});

service.registerSummaryMessage(DataTypeParserBase.ParserErrorCode, LookupKey.Number, {
    '*': '{Label} has an invalid value. Enter a number.'
});
```

A parser can use a more specific error code when it needs to distinguish one parsing failure from another. For example, the supplied date parser can report `DatePatternParserBase.invalidDateErrorCode` when the text matches a date pattern but does not represent a real date:

```ts
service.registerErrorMessage(DatePatternParserBase.invalidDateErrorCode, LookupKey.Date, {
    '*': 'Invalid date.'
});

service.registerSummaryMessage(DatePatternParserBase.invalidDateErrorCode, LookupKey.Date, {
    '*': '{Label} has an invalid date.'
});
```

The supplied `create_services.ts` file includes registrations for the standard parser error codes. Add registrations when introducing custom parsers, error codes, or Lookup Keys.

## API References
- [TextLocalizerService class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_TextLocalizerService.TextLocalizerService.html)

---
Go to [JivsServices Home](./Home.md)

Go to [API Home](../Home.md)