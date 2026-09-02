# DataTypeConverters
A `DataTypeConverter` transforms a value into another representation.

For example, a JavaScript Date can be converted into:

- milliseconds representing its complete date and time
- days representing only its date
- minutes representing its time of day

`DataTypeConverters` are associated with two [Lookup Keys](./Home.md#lookup-keys). One for the source value and the other for the result. For example:
- `LookupKey.DateTime` → `LookupKey.Milliseconds` is handled by `DateTimeConverter`
- `LookupKey.Date` → `LookupKey.TotalDays` is handled by `UTCDateOnlyConverter`
- `LookupKey.TimeOfDay` → `LookupKey.Minutes` is handled by `TimeOfDayOnlyConverter`

Jivs uses converters in two situations:

- Preparing values for comparison within `Conditions`. The default `DataTypeComparer` only compares numbers and strings. Other values can be converted into one of those types before comparison. For example, a Date can be converted into milliseconds.
- Selecting a particular representation of a value. For example, `LookupKey.DateTime`, `LookupKey.Date`, and `LookupKey.TimeOfDay` all represent different aspects of a JavaScript Date.

Jivs automatically selects a `DataTypeConverter` when needed. Just be sure the `DataTypeConverters` are registered with the `DataTypeConverterService`.

## Common Usages
- **Select a representation through the dataType property** Many Lookup Keys are specialized representations of ordinary data types. 
    By assigning the specialized Lookup Key to the ValueHost's `dataType` configuration property, you will employ a DataTypeConverter:
    ```ts
    // Date object has Date + Time. This uses only the Date part
    builder.field('BirthDate', LookupKey.Date).greaterThan(new Date(1900, 0, 1));
    // Number type can be decimal. This uses only integer part
    builder.field('Counter', LookupKey.Integer).greaterThan(5);
    ```

- **Apply conversion specifically to the Condition** Comparison Conditions provide `conversionLookupKey` and `secondConversionLookupKey` configuration properties.
    Assign them to a specialized Lookup Key to apply conversion you need for the comparison.

    For example, case-insensitive string comparison is handled this way: 
    ```ts
    builder.field('FirstName', LookupKey.String)
        .notEqual(valueHost('LastName'), {
            conversionLookupKey: LookupKey.CaseInsensitive,
            secondConversionLookupKey: LookupKey.CaseInsensitive	   
        });
    ```

- **Use application-specific classes with standard Conditions.** Once Jivs can identify the class, a converter can expose a representation that existing Conditions know how to use.
    - A `FullName` class might be converted into a string containing the first and last names.
    - An `Address` class might be converted into only its postal code.

  See the examples below for more.

## Supplied DataTypeConverters
|Source Lookup Key|Result Lookup Key|Converter Class|Comments|
|----------|-----|-----------|---------|
|Date|Number or Days|UTCDateOnlyConverter|Just the date part in UTC as a number of days|
|LocalDate|Number or Days|LocalDateOnlyConverter|Just the date part in local time as a number of days|
|TimeOfDay|Number or Minutes|TimeOfDayOnlyConverter|Time of day only as total minutes|
|TimeOfDayHMS|Number or Seconds|TimeOfDayHMSOnlyConverter|Time of day only as total seconds|
|String|CaseInsensitive|CaseInsensitiveStringConverter|Match strings case insensitively|
|Number|Integer|IntegerConverter|Converts decimal number to whole number|
|String|Number or Integer|NumericStringToNumberConverter|String to number|

> These are preregistered in the `createJivsServices()` function.
[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/jivs-engine_DataTypes_Types_LookupKey.LookupKey.html).

## Creating your own DataTypeConverters
Jivs has these examples:
- Date object to Month/Year as a number: [jivs-examples/src/MonthYearConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/MonthYearConverter.ts). It defines the MonthYear Lookup Key.
- Date object to Month/Day as a number: [jivs-examples/src/AnniversaryConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/AnniversaryConverter.ts). It defines the Anniversary Lookup Key.
```ts
    builder.field('Expiry', 'MonthYear', { label: 'Expiration date'});
    builder.field('MarriageDate', 'Anniversary', { label: 'Marriage date'});
```
- Defines a RelativeDate class that gets converted to a date value: [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts)
- Defines a TimeSpan class that gets converted to a number of seconds: [jivs-examples/src/TimeSpan_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/TimeSpan_class.ts).


## Registering a DataTypeConverter
The `DataTypeConverterService` where you register `DataTypeConverters`.
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.

`services.dataTypeConverterService`

Register your `IDataTypeConverter` class like this:
```ts
services.dataTypeConverterService.register(new MyDataTypeConverter());
```

API References:
- [IDataTypeConverter interface](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_DataTypes_Types_IDataTypeConverter.IDataTypeConverter.html)
- [DataTypeConverterBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_DataTypes_ConcreteClasses_DataTypeConverters.DataTypeConverterBase.html)
- [DataTypeConverterService class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_DataTypeConverterService.DataTypeConverterService.html)
---
Go to [Data Type Support Home](./Home.md)

Go to [API Home](../Home.md)