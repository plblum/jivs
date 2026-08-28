# DataTypeComparers
Staying with the "single responsibility pattern", Jivs recommends that you use its comparison Conditions (Range, Equal, NotEqual, LessThan, etc) for all data types. It already knows how to handle comparing strings, numbers, dates and booleans. 

If you have another data type and want to take advantage of the comparison Conditions, there are two choices:
- Create a DataTypeConverter (note: not DataTypeComparer!) to convert your type down to a string or number, allowing our default DataTypeComparer to compare strings to strings or numbers to numbers.
- Create a DataTypeComparer specific to your data type that will compare both values.

Its pretty unusual to need to provide your own Comparer class. But its here if you need it.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)

Internally Jivs is using `BooleanDataTypeComparer` to compare booleans.

## Create your own DataTypeComparers
See these sources:
- [/jivs-engine/src/DataTypes/DataTypeComparers.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeComparers.ts).

## Registering a DataTypeComparer with its service
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.

`services.dataTypeComparerService`

Register your `IDataTypeComparer` class like this:
```ts
services.dataTypeComparerService.register(new MyDataTypeComparer());
```