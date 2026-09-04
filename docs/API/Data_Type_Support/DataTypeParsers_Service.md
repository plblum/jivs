# DataTypeParsers

A `DataTypeParser` converts a text value into a native value. It is used when `FieldValueHost.setTextValue()` receives text from an editor, HTML form, or another string-based source.

Parsers should be forgiving of minor variations in valid input. When text cannot be converted, the `DataTypeParser` returns an error instead of throwing an exception. Jivs incorporates that error into the `FieldValueHost` validation state so it can appear in Field Error Display and Validation Summary widgets. Its message can also be localized through the `TextLocalizerService` (see below).

## Parser etiquette 
The supplied parsers focus on establishing a valid native value rather than enforcing every restriction associated with a field. Add `Validators` to impose additional limits after parsing. This allows each `Validator` to provide an error message specific to the rule it enforces.

For example, the `NumberParser` can accept negative and decimal values. Separate Validators can then explain that the value must be positive, an integer, or both.
```ts
builder.field('field1', LookupKey.Number).integer().positive();
```
- `NumberParser` reports "Invalid value. Enter a number."
- `IntegerCondition` reports "Must be an integer."
- `PositiveCondition` reports "Negative numbers are not allowed."

## How Jivs Selects a Parser

Each `DataTypeParser` is registered with a [Lookup Key](./Home.md#lookup-keys). When parsing a text value, the `DataTypeParserService` uses the selected Lookup Key to find the appropriate parser.

For a `FieldValueHost`, the Lookup Key comes from:

1. `parserLookupKey`, when configured
2. otherwise, `dataType`

For example:

```ts
builder.field('Amount', LookupKey.Number);  // uses NumberParser
```
Use `parserLookupKey` when the accepted text format differs from the field’s data type:

```ts
builder.field('Amount', LookupKey.Number, {
    parserLookupKey: LookupKey.Currency // uses CurrencyParser
});
```

## Parsing Values Assigned with setTextValue()

A `FieldValueHost` maintains both a native value and a text value. When `setTextValue()` receives a text value, Jivs uses the selected `DataTypeParser` to create its native value.

```ts
const birthDate = vhm.vh.field('BirthDate');
birthDate.setTextValue('05/31/2002'); // parser -> new Date(2002, 4, 31) -> native value
```

When the native value changes, the `onValueChanged` callback can pass the native value to application code:

```ts
config.onValueChanged = (fieldValueHost, oldValue) => {
    let newValue = fieldValueHost.getValue();
    // use newValue
};
```
For more, see [Decisions around Jivs Built-in parsing](../ValueHosts/Getting_and_Setting_Values.md#decisions-around-jivs-built-in-parsing).

### Handling parsing errors
Each `DataTypeParser` can run into parsing errors, where the text is not a match to the required input format. They are coded to return both a resulting native value and error info.

`setTextValue()` knows to convert the error info into a Validator so it will appear in both the Field Error Display and Validation Summary widgets.

The error message itself may need to be replaced by something more suitable to the UI. Their error info includes an error code, which is used to align it with text you have registered in the `TextLocalizerService`. See [Localizing DataTypeParser Error Messages](../JivsServices/TextLocalizerService.md#localizing-datatypeparser-error-messages).


## Supplied DataTypeParsers
The supplied `createJivsServices()` function registers these `DataTypeParsers`. Each is selected through its [Lookup Key](./Home.md#lookup-keys).

|Lookup Key|Class|Result type|Error code|Comments|
|----------|-----|-----------|---------|-------|
|String|`CleanUpStringParser`|String|n/a|See [String clean up](#string-clean-up)|
|Number or Integer|`NumberParser`|Number|'ParserError'|Localized|
|Currency|`CurrencyParser`|Number|'ParserError'|Focalized|
|Percentage|`PercentageParser`|Number|'ParserError'|1 = 100%|
|Percentage100|`Percentage100Parser`|Number|'ParserError'|100 = 100%|
|Boolean|`BooleanParser`|Boolean|'ParserError'|Registration options determine what string mean true and false|
|\<unspecified\>|`EmptyStringIsFalseParser`|Boolean|'ParserError'|empty string = false|
|Date|`ShortDatePatternParser`|Date object|'ParserError', 'InvalidDate'|Short Date pattern. Localized|

Localization is supplied through:
- Due to lack of parsing support in [JavaScript's Intl namespace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl), Jivs has a simplistic system. This particularly limits the Date parsers that are included. Customize its culture specific options in `createJivsServices()`.
- the cultures registered with Jivs’ `CultureService`
- the active culture at the time the value is parsed

Register cultures and configure the supplied parsers within `createJivsServices()`.

There are far better parsers, especially in the date and time space. Wrap your favorite in a class that implements `IDataTypeParser` and register it instead of Jivs' own.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/jivs-engine_DataTypes_Types_LookupKey.LookupKey.html).

## String clean up 
When the native type is a string, the text value may need to be changed if it's what you intend to save. `CleanUpStringParser` provides a way to handle this. 

> Before jumping in, its important to know that `CleanUpStringParser` does not report errors. If you have an expected resulting pattern, add a [RegExp Validator](../Conditions/Conditions_Included_with_Jivs.md#regexp).

Trimming lead and trailing whitespace is almost always used on text values. As a result, our `CleanUpStringParser` is already registered to trim all `ValueHosts` with a data type lookup key of `LookupKey.String`.

For other _use cases_, consider the `CleanUpStringParserOptions` shown here. 
```ts
interface CleanUpStringParserOptions extends DataTypeParserOptions<string>
{
    emptyStringResult?: TDataType | null;   // value when our result is an empty string
    trim?: boolean | 'start' | 'end';       // trim lead and/or trailing spaces 
    compressWhitespace?: boolean;           // compress 2 or more whitespaces into 1
    replaceWhitespace?: string | null;      // replace each whitespace with this string (after compressing)
    stripTheseCharacters?: string | null;   // a string of characters to remove, case sensitive
    convertCase?: 'upper' | 'lower' | null; // transform to uppercase or lowercase.
}
```

If they are a match to your needs, add an entry in `createJivsServices()` to register the `CleanUpStringParser` with options and a custom Lookup Key into the `DataTypeParsersService`.

```ts
export function registerDataTypeParsers(dtps: DataTypeParserService): void {

    // Define a USPhoneNumber Lookup Key to convert various patterns of US 
    // phone numbers into the pattern [3 digit]-[3 digit]-[4 digit]
    dtps.register(new CleanUpStringParser('USPhoneNumber', {
        trim: true,
        compressWhitespace: true,
        replaceWhitespace: '-',
        stripTheseCharacters: '().'
    }));
}
```        
Then use it with the `parserLookupKey` configuration property.
```ts
builder.field('Mobile', LookupKey.String, {
    parserLookupKey: 'USPhoneNumber'
});
```

## Creating your own DataTypeParsers
Use these resources to help when implementing a `DataTypeParser`:
- [EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts) demonstrates formatting an application-specific data type.
- [DataTypeParsers.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeParsers.ts) contains the `DataTypeParsers` supplied by Jivs.

## Registering a DataTypeParser
The `DataTypeParserService` where you register `DataTypeParsers`.
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.
```ts
services.dataTypeParserService.register(new MyDataTypeParser());
```
## API References
- [IDataTypeParser interface](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_DataTypes_Types_IDataTypeParser.IDataTypeParser.html)
- [DataTypeParserBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_DataTypes_AbstractClasses_DataTypeParsers.DataTypeParserBase.html)
- [CleanUpStringParser class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_DataTypes_ConcreteClasses_DataTypeParsers.CleanUpStringParser.html)
- [DataTypeParserService class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_DataTypeParserService.DataTypeParserService.html)
---
Go to [Data Type Support Home](./Home.md)

Go to [API Home](../Home.md)