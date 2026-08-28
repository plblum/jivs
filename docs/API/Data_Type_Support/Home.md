# Data Types and Companion Services
To really do the job well, Jivs wants to know specific data types associated with each Model property. Each `ValueHost` has a `dataType` property for this purpose.

```ts
builder.field(valueHostName, dataTypeName);
builder.field('name', 'String');
```
You *must* assign `dataType` to the name of a data type when the data is not a string, boolean, number or Date, and *should* assign it for those types when you need to be more precise, such as an "EmailAddress" instead of just "String".

## Data Types are connected to many things
By knowing the data type, Jivs can lookup a specific object to handle these cases:
- Parsing from text value to native value, using [DataTypeParser](./DataTypeParsers_Service.md).
- Formatting from native value to text value, using [DataTypeFormatter](./DataTypeFormatters_Service.md).
- Converting between data types, using [DataTypeConverter](./DataTypeConverters_Service.md).
- Attaching a validator to perform a Data Type Check automatically, using [DataTypeCheckGenerator](./DataTypeCheckGenerator_Service.md).
- Giving an identity to an object you use as a datatype, using [DataTypeIdentifier](./DataTypeIdentifier_Service.md).
- Comparing two values, using [DataTypeComparer](./DataTypeComparers_Service.md).

## Lookup Keys
We use the term **Lookup Key** when specifying the name in the `ValueHostConfig.dataType` property. Please [see this page](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html) for a detailed look at all Lookup Keys supplied with Jivs and how they are used.

We recommend using the `LookupKey` enumerated type instead of strings for lookup key parameters.
```ts
builder.field('name', LookupKey.String);
```
### Where are Lookup Keys assigned
You will use it in several places while configuring `ValueHostsManager`:
- `ValueHostConfig.dataType` - What the native value is expected to contain
- `ValueHostConfig.parserLookupKey` - Overrides the dataType's Lookup Key to refine your parser. For example, text can be a currency:
    ```ts
    builder.field('name', LookupKey.Number, { parserLookupKey: LookupKey.Currency});
    ```
- `ValueHostConfig.formatterLookupKey` - Overrides the dataType's Lookup Key to refine your formatter. This inverts the previous example:
    ```ts
    builder.field('name', LookupKey.Number, { formatterLookupKey: LookupKey.Currency});
    ```
- `ConditionConfig.conversionLookupKey` and `ConditionConfig.secondConversionLookupKey` - Convert the value before it gets validated. In this example, we perform a case insensitive comparison:
    ```ts
    builder.field('name', LookupKey.String).equalTo(valueHost('name2'), { 
        conversionLookupKey: LookupKey.CaseInsensitive,
        secondConversionLookupKey: LookupKey.CaseInsensitive
    })
    ```

### Use Cases
- An actual data type associated with native data structures, like 'DateTime', 'String', and 'Number'.
- A variant of a data type making it more specialized, like "Date", "Email", and "Integer". The supporting services (parsers, formatters, etc) all configured to the supplied Lookup Key.
- A name used for a specific `DataTypeParser`, `DataTypeFormatter`, or `DataTypeConverter` that is better than the one assigned to `ValueHostConfig.dataType`. Some examples that we already supply: "AbbrevDOW", "LongDate", "Minutes", "Seconds". They are used in these configuration properties to supercede the `ValueHostConfig.dataType`: `parserLookupKey`, `formatterLookupKey`, `conversionLookupKey`, and `secondConversionLookupKey`. [See this page for a full list](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
- [Tokens in error messages.](./DataTypeFormatters_Service.md#localized-tokens-in-error-messages) For example: "{label} must be between {Minimum:Currency} and {Maximum:Currency}". 

## Creating your own Lookup Keys
The `LookupKey` enumerated type supplied in Jivs doesn't cover everything.
Here are some use cases for creating your own Lookup Key:
- Enumerated types, where the user sees text but the value is stored as a number. Check out [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts).
    + Parsing, from string to number
    + Formatting, from number to string in an error message
- String values that have a strong pattern, like a phone number. Check out [jivs-examples/src/EmailAddressDataType.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts).
    + Parsing, to clean up the user's input into the text that you want to store
    + Formatting, to format the text you have stored
    + Validating, using a Regular Expression. 
    + Auto generating data type check validators
- Extracting some data from the native value, like the day of week from a Date object. Check out [jivs-examples/src/MonthYearConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/MonthYearConverter.ts).
    + Converting, to get the Date.day property.
- A class that you store as a single entity, like class NumberWithUnits { value: number, units: string }. Check out [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts) and [jivs-examples/src/TimeSpan_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/TimeSpan_class.ts)
    + Identifing, to recognize your class
    + Converting, to get a value you can use in comparing, such as the NumberWithUnits.value.
    + Comparing, to compare two instances of the same class
    + Formatting, to show the current value in an error message
    + Parsing, to convert user input into your class.
