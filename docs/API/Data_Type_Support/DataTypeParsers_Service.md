# DataTypeParsers
`DataTypeParsers` convert from the text value into the native value. They are an essential part of `FieldValueHost.setTextValue()` which attempts to create the native value using a parser.

Parsers are expected to detect an unparsable situation. In that case, it reports an error
and Jivs will display it as a validation error.

## Convert text native to native value
When you call the `FieldValueHost.setTextValue()` function, it takes only a text value. 
If the `FieldValueHost` has a lookup key to a `DataTypeParser` already registered in `DataTypeParserServices`,
parsing will happen. If you don't want this behavior, you have to turn it off.

When enabled:
- The text value is parsed with the supplied parser.
- The native value is set either to the parsed value or undefined if the parser failed.
- Parser failure passes the error message along to the FieldValueHost for display.
- The `ValueHostsManager.onValueChanged` callback is triggered.
```ts
vhm.onValueChanged = (fieldValueHost, oldValue)=>{
    let newValue = fieldValueHost.getValue();
    // use newValue
}
```
For more, see [Decisions around Jivs Built-in parsing](../ValueHosts/Home.md#decisions-around-jivs-built-in-parsing).

## Error reporting
Jivs has been designed so that parsers attempt to resolve the basic data type without applying limits. Limits are imposed by validators.

Suppose that your input requires a positive number. It passes the string '-10.5' into setTextValue().
The `NumberParser` will convert it into a number, 10.5. Its up to adding two more validators to impose limits: 
`PositiveCondition` and `IntegerCondition`.
- `NumberParser` reports "Expecting a number"
- `PositiveCondition` reports "Negative numbers are not allowed"
- `IntegerCondition` reports "Must be an integer"

## String clean up 
When the native type is a string, the input value may need to be changed if it's what you intend to save. Trimming lead and trailing whitespace is almost always used on Inputs. As a result, our `CleanUpStringParser` is already registered to trim all `ValueHosts` with a data type lookup key of `LookupKey.String`.

A phone number often has culture specific formatting, but in the end, you intend to store it in a fixed format, such as +\[country code] \[all digits of the phone number without formatting]. Use a Parser to deliver this, only reporting an error when the input is severely inappropriate.

"(800)204-9000" → "+1 8002049000"

"+44 7911 123456" → "+44 7911123456"

"ABC" → error message

The `CleanUpStringParser` has numerous configuration options that together may deliver the desired format. 

## Supplied DataTypeParsers
These are preregistered in the `createJivsServices()` function.

|Lookup Key|Class|Result type|Comments|
|----------|-----|-----------|---------|
|String|CleanUpStringParser|String|Registration options determine its behavior|
|Number or Integer|NumberParser|Number|Localized|
|Currency|CurrencyParser|Number|localized|
|Percentage|PercentageParser|Number|1 = 100%|
|Percentage100|Percentage100Parser|Number|100 = 100%|
|Boolean|BooleanParser|Boolean|Registration options determine what string mean true and false|
|\<unspecified\>|EmptyStringIsFalseParser|Boolean|empty string = false|
|Date|ShortDatePatternParser|Date object|Short Date pattern. Localized|

Localization is supplied through:
- Due to lack of parsing support in [JavaScript's Intl namespace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl), Jivs has a simplistic system. Custom its culture specific options in `createJivsServices()`.
- Cultures setup in Jivs' `CultureService`.
- The active Culture at the time of formatting.
Configuration can be adjusted in the `createJivsServices()` function.

There are far better parsers, especially in the date and time space. Wrap your favorite in a class that implements IDataTypeParser and register it instead of Jivs own.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/jivs-engine_DataTypes_Types_LookupKey.LookupKey.html).

## Create your own DataTypeParsers
Jivs has these examples:
- [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts).
- [jivs-engine/src/DataTypes/DataTypeParserBase.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeParserBase.ts) 
- [/jivs-engine/src/DataTypes/DataTypeParsers.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeParsers.ts).

## Registering a DataTypeParser with its service
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.

`services.dataTypeParserService`

Register your `IDataTypeParser` class like this:
```ts
services.dataTypeParserService.register(new MyDataTypeParser());
```
---
Go to [Data Type Support Home](./Home.md)

Go to [API Home](../Home.md)