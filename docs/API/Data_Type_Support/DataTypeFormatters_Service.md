# DataTypeFormatters
`DataTypeFormatters` turn a native value into a text value. Some involve localization. For example `DateFormatter` will treat new Date(2000, 0, 15) as '15/01/2000' in 'en-GB' and '01/15/2000' in 'en-US'.

`DataTypeFormatters` are used in these cases:
- Convert the native value into a text value when calling `FieldValueHost.setValue()`. See below.
- Reformat the text passed into `FieldValueHost.setTextValue()`.
- Localized tokens in error messages.

## Convert native to text value
When you call the `FieldValueHost.setValue()` function, it takes only a native value. 
If the `FieldValueHost` has a lookup key to a `DataTypeFormatter` already registered in `DataTypeFormatterServices`,
formatting will happen. If you don't want this behavior, you have to turn it off.

For more, see [Decisions around Jivs Built-in formatting](../ValueHosts/Home.md#decisions-around-jivs-built-in-formatting).

## Reformat the text passed
When calling `setTextValue()`, the original text value can be reformatted, such as '1/2/2025' -> '01/02/2025'. Ensure you use the option reformatTextValue.
```ts
vhm.vh.field('field1').setTextValue('1.00', { reformatTextValue: true });
```
It requires the ValueHost to be setup for both parsing and formatter, including the right `DataTypeParsers` and `DataTypeFormatters` in their respective services. The feature requires opting in, either by setting this to true or using `builder.behaviors.reformatTextValue = true`.

When enabled:
- The native value is formatted with the supplied formatter.
- The text value is set
- The `ValueHostsManager.onTextValueChanged` callback is triggered, allowing you to wire up your data entry field to intake the new string.
```ts
vhm.onTextValueChanged = (fieldValueHost, oldValue)=>{
    let newTextValue = fieldValueHost.getTextValue();
    // assign it to the input's value attribute
    document.getElementById(fieldValueHost.getName()).value = newTextValue;
}
```
For more, see [Decisions around Jivs Built-in formatting](../ValueHosts/Home.md#decisions-around-jivs-built-in-formatting).

### Localized tokens in error messages
`DataTypeFormatters` provide localized strings for the tokens within error messages with implementations of `IDataTypeFormatter`. For example, if validating a date against a range, your error message may look like this: 

`"The value must be between {Minimum} and {Maximum}."`

Formatters initially use the Lookup Key from the ValueHost.dataType. So if you assigned dataType="Date", expect the short date format. 

`"The value must be between 12/31/1999 and 12/31/2005."`

To override it, such as using the abbreviated date format, include the Lookup Key within the token like this:
  
`"The value must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}."`

`"The value must be between Dec 31, 1999 and Dec 31, 2005."`

## Supplied DataTypeFormatters
These are preregistered in the createJivsServices() function.

|Lookup Key|Class|Source type|Comments|
|----------|-----|-----------|---------|
|String|StringFormatter|String|A pass-through|
|Capitalize|CapitalizeStringFormatter|String|First letter capitalized|
|Uppercase|UppercaseStringFormatter|String|All uppercase|
|Lowercase|LowercaseStringFormatter|String|All lowercase|
|Number|NumberFormatter|Number|Localized|
|Integer|IntegerFormatter|Number|Show in integer format, localized|
|Currency|CurrencyFormatter|Number|Show in currency format, localized|
|Percentage|PercentageFormatter|Number|Show in percent format, where 1 = 100%|
|Percentage100|Percentage100Formatter|Number|Show in percent format, where 100 = 100%|
|Boolean|BooleanFormatter|Boolean|'true' and 'false', localized|
|YesNoBoolean|BooleanFormatter|Boolean|'yes' and 'no', localized|
|DateTime|DateTimeFormatter|Date object|Short Date pattern + Short Time of Day pattern. Localized|
|Date|DateFormatter|Date object|Short Date pattern. Localized|
|AbbrevDate|AbbrevDateFormatter|Date object|Abbreviated Date pattern. Localized|
|AbbrevDOWDate|AbbrevDOWDateFormatter|Date object|Abbreviated Date + day of week pattern. Localized|
|LongDate|LongDateFormatter|Date object|Long Date pattern. Localized|
|LongDOWDate|DateFormatter|Date object|Long Date + day of week pattern. Localized|
|TimeOfDay|TimeOfDayFormatter|Date object|Time of Day without seconds pattern. Localized|
|TimeOfDayHMS|TimeOfDayHMSFormatter|Date object|Time of Day with seconds pattern. Localized|

Localization is supplied through:
- [JavaScript's Intl namespace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- Cultures setup in Jivs' `CultureService`.
- The active Culture at the time of formatting.
Configuration can be adjusted in the `createJivsServices()` function.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html).

## Create your own DataTypeFormatters
Jivs has these examples:
- [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts).
- [jivs-engine/src/DataTypes/DataTypeFormatters.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeFormatters.ts).

## Registering a DataTypeFormatter with its service
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.

`services.dataTypeFormatterService`

Register your `IDataTypeFormatter` class like this:
```ts
services.dataTypeFormatterService.register(new MyDataTypeFormatter());
```