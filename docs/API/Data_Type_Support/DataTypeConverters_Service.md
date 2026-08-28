# DataTypeConverters
Change the value supplied to Conditions with implementations of `IDataTypeConverter` before comparing the value.
Jivs consumes them in two ways:
- Supports on-demand conversion where you want a validator+condition to have a reworked version of the incoming value. This is particularly useful with dates and times, as the Date object contains many values (year, day, hour, etc).
    
    Assign the destination type's lookup key to the condition's `conversionLookupKey` or `secondConversionLookupKey` property.

    In this example, source = `LookupKey.TimeOfDay` and result = `LookupKey.Minutes`. TimeOfDayOnlyConverter will be used. 
    ```ts
    builder.field('Time', LookupKey.TimeOfDay) // source: dataType's Lookup Key
        .lessThan(60 * 60 * 12, { // only before noon
            conversionLookupKey: LookupKey.Minutes // result: converts Date object's time of day to number of minutes
        });
    ```
    In this example, the `NotEqualToCondition` configured to be CaseInsensitive:
    ```ts
        builder.field('FirstName', LookupKey.String, { label: 'First name'})
            .notEqual('LastName', {
                conversionLookupKey: LookupKey.CaseInsensitive,
                secondConversionLookupKey: LookupKey.CaseInsensitive	   
            });
    ```    
- Supports the comparison conditions through their [comparison objects](#datatypecomparers). The built-in comparer only works with numbers, strings, and booleans. For dates and other types, you need DataTypeConverters. Jivs supplies and preregisters those for dates and times. 

In both cases, the `DataTypeConverterService` identifies the source and result lookup keys to search for a registered `DataTypeConverter`. 

The `DataTypeComparerService` calls upon the `DataTypeConverterService` to convert the source value to either a string or number.

## Some Use Cases
Consider these *Use Cases*:
- Change from one data type to another, which is the classic Use Case. We covered string-to-number above. Jivs also provides number-to-integer conversion with IntegerConverter, and several related to dates, described later.

- Provide case insensitive string matching by converting to lowercase. Set the conversionLookupKey properties to "CaseInsensitive" (uses CaseInsensitiveStringConverter). See example above.

- Using a Date object as something other than Date+Time. You may be interested only in the date, the time, or even parts like Month or Hours. Jivs supplies several converters for these. See below.
    
- Perhaps you want to compare the difference in days between two dates. For that you need to convert a Date object into a number – the number of days since some fixed point. 
    
    Jivs includes the "TotalDays" Lookup Key and UTCDateOnlyConverter.

    See an example here: [jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts).
  
- Changing your own class (already setup with an Converter) into something as simple as a string, number, or Date also requires a Converter. You will see how in the RelativeDate class example [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts) and a TimeSpan class example [jivs-examples/src/TimeSpan_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/TimeSpan_class.ts).
- Suppose that you have a class "FullName" with properties of FirstName and LastName. Create a converter to return a string that is both concatenated.
- Suppose that you have a class "StreetAddress" with properties of Street, City, Region, PostalCode. Create a converter to return just the postal code.

## Supplied DataTypeConverters
These are preregistered in the createJivsServices() function.

|Lookup Key|Class|Source type|Result type|Comments|
|----------|-----|-----------|---------|---------|
|DateTime|DateTimeConverter|Date object|Number|Full date and time in milliseconds|
|LocalDate|LocalDateOnlyConverter|Date object|Number|Just the date part in local time as a number of days|
|TimeOfDay|TimeOfDayOnlyConverter|Date object|Number|Time of day only as total minutes|
|TimeOfDayHMS|TimeofDayHMSOnlyConverter|Date object|Number|Time of day only as total seconds|
|Date|UTCDateOnlyConverter|Date object|Number|Just the date part in UTC as a number of days|
|CaseInsensitive|CaseInsensitiveStringConverter|String|String|Match strings case insensitively|
|Integer|IntegerConverter|Number|Number|Converts decimal number to whole number|
|Number and Integer|NumericStringToNumberConverter|String|Number|String to number|

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html).
## Create your own DataTypeConverters
Jivs has these examples:
- Date object to Month/Year as a number: [jivs-examples/src/MonthYearConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/MonthYearConverter.ts). It defines the MonthYear Lookup Key.
- Date object to Month/Day as a number: [jivs-examples/src/AnniversaryConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/AnniversaryConverter.ts). It defines the Anniversary Lookup Key.
```ts
    builder.field('Expiry', 'MonthYear', { label: 'Expiration date'});
    builder.field('MarriageDate', 'Anniversary', { label: 'Marriage date'});
```

## Registering a DataTypeConverter with its service
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.

`services.dataTypeConverterService`

Register your `IDataTypeConverter` class like this:
```ts
services.dataTypeConverterService.register(new MyDataTypeConverter());
```

## Accessing the DataTypeConverterService
Like all services, this is part of the JivsService and can be configured in your createJivsServices() function.

`services.dataTypeConverterService`

Register your `IDataTypeConverter` class like this:
```ts
services.dataTypeConverterService.register(new MyDataTypeConverter());
```