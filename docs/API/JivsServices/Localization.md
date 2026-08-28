# Localization
Any text displayed to the user and any input supplied from them is subject to localization. Jivs is localization-ready with several tools. There are third party tools that may do the job more to your liking, and they can be swapped in by implementing the correct interfaces.

## Localizing strings: TextLocalizerService
Here are a few places you provide user-facing strings into Jivs:
- ValueHostConfig.label for {Label} and {SecondLabel} tokens
- ValidatorConfig.errorMessage and summaryMessage
- ValueHostConfig.dataType for {DataType} token

Each of those properties have a companion that ends in "l10n" (industry term for localization), such as labell10n. Use the l10n properties to supply a Localization Key that will be sent to Jivs `TextLocalizerService`. If that service has the appropriate data, it will be used instead of the usual property.

`TextLocalizerService` is available on `ValueHostsManager.services.textLocalizerService`. Add localization content within the `createTextLocalizerService() function` [that was added here](#jivsservices).

To replace it with a third party text localization tool, implement `ITextLocalizerService` and assign it in the `createTextLocalizerService() function`.

### Setup for ValueHostConfig.label
Let's suppose that you have a label "First Name" which you want in several languages.
1. Create a unique Localization Key for it. We'll use "FirstName".
2. Assign both label and labell10n properties during configuration, shown here using the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class):
    ```ts
    builder.field('FirstName', null, { label: 'First Name', 'labell10n': 'FirstName' });
    ```
3. Add an entry to the `createTextLocalizerService() function` like this:
    ```ts
    export function createTextLocalizerService(): ITextLocalizerService
    {
        let service = new TextLocalizerService();
        ...
        service.register('labell10n', {
            '*': 'First Name', // fallback
            'en': 'First Name',
            'es': 'nombre de pila',
            'fr': 'prénom'
        });
    }
    ```

### Setup for ValidatorConfig.errorMessage and summaryMessage properties
Jivs generates specific Localization Keys based on the ConditionType.
For error message, "EM-*ConditionType*-*DataTypeLookupKey*" and a fallback "EM-*ConditionType*". Example using RangeCondition for an Integer Lookup Key: "EM-Range-Integer" and "EM-Range".
For summary message, "SEM-*ConditionType*-*DataTypeLookupKey*" and a fallback "SEM-*ConditionType*".

When using the supplied TextLocalizerService, you won't need to know those Lookup Keys. Instead, you can call its `registerErrorMessage()` and `registerSummaryMessage()`.

The existing `createTextLocalizerService() function` already has numerous examples. For example:
```ts
service.registerErrorMessage(ConditionType.RequireText, null, {
    '*': 'Requires a value.'
});
service.registerSummaryMessage(ConditionType.RequireText, null, {
    '*': '{Label} requires a value.'
});    
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
```
So review and edit the `createTextLocalizerService() function`.
### Setup for ValueHostConfig.dataType
The {DataType} token is useful in making the error message for a Data Type Check validator cover multiple data types. Instead of "Enter a date." and "Enter a number.", one error message can say "Enter a {DataType}.".
1. Assign the dataType property during configuration shown here using the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class):
    ```ts
    builder.field('Age', LookupKey.Integer);
    ```
2. Add an entry to the `createTextLocalizerService() function` like this:
    ```ts
    export function createTextLocalizerService(): ITextLocalizerService
    {
        let service = new TextLocalizerService();
        ...
        service.registerDataTypeLabel(LookupKey.Integer, {
            '*': 'an integer number', // fallback
            'en': 'an integer number',
            'es': 'un número entero',
            'fr': 'un nombre entier'
        });
    }
    ```
## Localizing error message "value" tokens
Error messages use tokens to insert values at runtime. {Value}, {SecondValue}, {Minimum}, {Maximum}, and {CompareTo} are all examples.

`Enter a value between {Minimum} and {Maximum}.`

When the value is a number, date or boolean, those must be localized. Jivs already does this within its [DataTypeFormatter classes](#datatypeformatters).

The supplied classes use [JavaScript's own Intl class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) to handle dates, times, and numbers. It uses [toLocaleLowerCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleLowerCase) and [toLocaleUpperCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase) for those situations. These classes are adequate but you may prefer using a richer third party library.

To switch, you need to replace the specific DataTypeFormatter classes that are not ideal and register your replacements using the original Lookup Key. See the existing DataTypeFormatter classes [here](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/DataTypes/DataTypeFormatters.ts).

For example, LongDateFormatter uses Intl to format with full month name. It's Lookup Key is "LongDate". Here is a framework to replace it.
```ts
export class MyLongDateFormatter extends DataTypeFormatterBase
{
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.LongDate;
    }
    protected supportsCulture(cultureId: string): boolean
    {
        return true; // only return false if you know the culture does not apply
    }
    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        if (value instanceof Date)
        {
        // do the work
            let formatted: string = ... code to handle the localized formatted date...
        return { value: formatted };
        }
        return { errorMessage: 'Not a date' };
    }	
}
```
Then register it within registerDataTypeFormatters() where you added the [`createJivsServices() function`](#jivsservices), replacing the existing "LongDateFormatter" Lookup Key.
```ts
export function registerDataTypeFormatters(dtfs: DataTypeFormatterService): void
{
...
    dtfs.register(new MyLongDateFormatter()); 
...
}    
```

## Selecting the culture
There are two places you can select a culture. Each takes a cultureId like 'en' or 'fr-FR'.
- Globally, when creating the `JivsService` object, passing the cultureId into its constructor. Usually you will work with the `createJivsServices()` function and it takes a cultureId: 
    ```ts
    let services = createJivsServices('fr-FR');
    ```
- Each `ValueHostsManager` starts from that global setting, and allows you to change the default. Be sure to have registered all cultures you intend to use within `createJivsServices()`.
    ```ts
    // prior to creating the ValueHostsManager
    builder.behaviors.activeCultureId = 'en';
    // once the ValueHostsManager exists, change it at will
    vhm.behaviors.activeCultureId = 'de';
    ```    
