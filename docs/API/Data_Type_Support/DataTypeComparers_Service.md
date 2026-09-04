# DataTypeComparers
Staying with the "single responsibility pattern", Jivs recommends that you use its comparison Conditions (Range, Equal, NotEqual, LessThan, etc) for all data types. It already knows how to handle comparing strings, numbers, dates and booleans. 

If you have another data type and want to take advantage of the comparison Conditions, there are two choices:
- Create a `DataTypeConverter` (note: not `DataTypeComparer`!) to convert your type down to a string or number, allowing our default `DataTypeComparer` to compare strings to strings or numbers to numbers.
- Create a `DataTypeComparer` specific to your data type that will compare both values.

It is pretty unusual to need to provide your own Comparer class. But it's here if you need it.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/jivs-engine_DataTypes_Types_LookupKey.LookupKey.html)

Internally Jivs is using `BooleanDataTypeComparer` to compare booleans.

## Creating your own DataTypeComparers
Use these resources to help when implementing a `DataTypeComparer`:
- [/jivs-engine/src/DataTypes/DataTypeComparers.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeComparers.ts) contains the `DataTypeComparers` supplied by Jivs.

## Registering a DataTypeComparer with its service
The `DataTypeComparerService` where you register `DataTypeComparers`.
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.
```ts
services.dataTypeComparerService.register(new MyDataTypeComparer());
```
## API References
- [IDataTypeComparer interface](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_DataTypes_Types_IDataTypeComparer.IDataTypeComparer.html)
- [BooleanDataTypeComparer class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_DataTypes_ConcreteClasses_DataTypeComparers.BooleanDataTypeComparer.html)
- [DataTypeComparerService class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_DataTypeComparerService.DataTypeComparerService.html)
---
Go to [Data Type Support Home](./Home.md)

Go to [API Home](../Home.md)