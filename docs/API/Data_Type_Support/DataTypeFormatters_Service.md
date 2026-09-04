# DataTypeFormatters

A `DataTypeFormatter` converts a native value into its formatted text value. The result may also be localized for the active culture.

For example, a `Date` representing January 15, 2000 might be formatted as:

- `1/15/2000` for `en-US`
- `15/01/2000` for `en-GB`

Jivs uses `DataTypeFormatters` in three places:

- to create the text value when `FieldValueHost.setValue()` receives a native value
- to reformat text processed by `FieldValueHost.setTextValue()`
- to format values that replace tokens in validation messages

## How Jivs Selects a Formatter

Each `DataTypeFormatter` is registered with a [Lookup Key](./Home.md#lookup-keys). When formatting a value, the `DataTypeFormatterService` uses the selected Lookup Key to find the appropriate formatter.

For a `FieldValueHost`, the Lookup Key comes from:

1. `formatterLookupKey`, when configured
2. otherwise, `dataType`

For example:

```ts
builder.field('BirthDate', LookupKey.Date);
```

This uses the `DataTypeFormatter` registered for `LookupKey.Date`.

Use `formatterLookupKey` when the text value needs a different format:

```ts
builder.field('BirthDate', LookupKey.Date, {
    formatterLookupKey: LookupKey.AbbrevDate
});
```

When formatting a token in a validation message, the token can specify its own Lookup Key:

```text
The value must be after {Minimum:LongDate}.
```

The Lookup Key in the token takes precedence over `formatterLookupKey` and `dataType`.

## Formatting Values Assigned with setValue()

A `FieldValueHost` maintains both a native value and a text value. When `setValue()` receives a native value, Jivs uses the selected `DataTypeFormatter` to create its text value.

```ts
const birthDate = vhm.vh.field('BirthDate');
birthDate.setValue(new Date(2000, 0, 15));  // formatter -> '01/15/2000'
```

When the text value changes, the `onTextValueChanged` callback can pass the formatted value to application code:

```ts
config.onTextValueChanged = (fieldValueHost, oldValue) => {
    let newTextValue = fieldValueHost.getTextValue();
    // assign it to the input's value attribute
    document.getElementById(fieldValueHost.getElementIdentifier()).value = newTextValue;
};
```

This allows Jivs to handle formatting while the application remains responsible for updating the UI.

For more, see [Decisions around Jivs Built-in Formatting](../ValueHosts/Getting_and_Setting_Values.md#decisions-around-jivs-built-in-formatting).

## Reformatting Values Assigned with setTextValue()
A `FieldValueHost` can reformat text after parsing it. This is useful when user-entered text is valid but does not use the preferred display format.

For example, a date entered as `1/2/2025` might be reformatted as `01/02/2025`.

```ts
vhm.vh.field('BirthDate').setTextValue('1/2/2025', {
    reformatTextValue: true
});
```

Reformatting uses both services:

1. A `DataTypeParser` converts the original text value into a native value.
2. A `DataTypeFormatter` converts the native value into the new text value.

The required `DataTypeParser` and `DataTypeFormatter` must both be registered and available through the `FieldValueHost` configuration.

When reformatting changes the text value, Jivs invokes the same `onTextValueChanged` callback used when formatting a native value. This allows the application to update the editor with the reformatted text.

For more, see [Decisions around Jivs Built-in Formatting](../ValueHosts/Getting_and_Setting_Values.md#decisions-around-jivs-built-in-formatting).

## Formatting Tokens in Validation Messages

[Validation error messages](../Validators/Error_Messages.md) can contain tokens whose values are supplied by a `Condition`. Before inserting a token’s value into the message, Jivs uses a `DataTypeFormatter` to create its string representation.

For example, a `RangeCondition's` error message can provide `Minimum` and `Maximum` tokens:

```text
The value must be between {Minimum} and {Maximum}.
```

For date values, the resulting message could be:

```text
The value must be between 12/31/1999 and 12/31/2005.
```

By default, token values use the `DataTypeFormatter` selected for the associated `FieldValueHost`.

A token can request a different `DataTypeFormatter` by including its Lookup Key after the token name:

```text
The value must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}.
```

The resulting message might be:

```text
The value must be between Dec 31, 1999 and Dec 31, 2005.
```

The Lookup Key specified by the token overrides the formatter normally selected for the `FieldValueHost`.

For more, see [Error messages](../Validators/Error_Messages.md).

## Supplied DataTypeFormatters

The supplied `createJivsServices()` function registers these `DataTypeFormatters`. Each is selected through its [Lookup Key](./Home.md#lookup-keys).

| Lookup Key | Class | Native type | text value |
|---|---|---|---|
| String | `StringFormatter` | String | Original string |
| Capitalize | `CapitalizeStringFormatter` | String | String with its first letter capitalized |
| Uppercase | `UppercaseStringFormatter` | String | Uppercase string |
| Lowercase | `LowercaseStringFormatter` | String | Lowercase string |
| Number | `NumberFormatter` | Number | Localized number |
| Integer | `IntegerFormatter` | Number | Localized integer |
| Currency | `CurrencyFormatter` | Number | Localized currency |
| Percentage | `PercentageFormatter` | Number | Localized percentage where `1` is `100%` |
| Percentage100 | `Percentage100Formatter` | Number | Localized percentage where `100` is `100%` |
| Boolean | `BooleanFormatter` | Boolean | Localized `true` or `false` |
| YesNoBoolean | `BooleanFormatter` | Boolean | Localized `yes` or `no` |
| DateTime | `DateTimeFormatter` | Date | Localized short date and short time |
| Date | `DateFormatter` | Date | Localized short date |
| AbbrevDate | `AbbrevDateFormatter` | Date | Localized abbreviated date |
| AbbrevDOWDate | `AbbrevDOWDateFormatter` | Date | Localized abbreviated date with day of week |
| LongDate | `LongDateFormatter` | Date | Localized long date |
| LongDOWDate | `LongDOWDateFormatter` | Date | Localized long date with day of week |
| TimeOfDay | `TimeOfDayFormatter` | Date | Localized time without seconds |
| TimeOfDayHMS | `TimeOfDayHMSFormatter` | Date | Localized time with seconds |

Localized output is determined by:

- JavaScript’s [`Intl` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- the cultures registered with Jivs’ `CultureService`
- the active culture at the time the value is formatted

Register cultures and configure the supplied formatters within `createJivsServices()`.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/jivs-engine_DataTypes_Types_LookupKey.LookupKey.html).

## Creating your own DataTypeFormatters
Use these resources to help when implementing a `DataTypeFormatter`:

- [EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts) demonstrates formatting an application-specific data type.
- [DataTypeFormatters.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeFormatters.ts) contains the `DataTypeFormatter` supplied by Jivs.

## Registering a DataTypeFormatter
The `DataTypeFormatterService` where you register `DataTypeFormatters`.
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.
```ts
services.dataTypeFormatterService.register(new MyDataTypeFormatter());
```

## API References
- [IDataTypeFormatter interface](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_DataTypes_Types_IDataTypeFormatter.IDataTypeFormatter.html)
- [DataTypeFormatterBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_DataTypes_AbstractClasses_DataTypeFormatterBase.DataTypeFormatterBase.html)
- [DataTypeFormatterService class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_DataTypeFormatterService.DataTypeFormatterService.html)

```
---
Go to [Data Type Support Home](./Home.md)

Go to [API Home](../Home.md)