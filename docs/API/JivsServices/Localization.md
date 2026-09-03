# Localization
Any text displayed to the user and any input supplied from them is subject to localization. Jivs is localization-ready with several tools. There are third party tools that may do the job more to your liking, and they can be swapped in by implementing the correct interfaces.

- TextLocalizerService

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
---
Go to [JivsServices Home](./Home.md)

Go to [API Home](../Home.md)
