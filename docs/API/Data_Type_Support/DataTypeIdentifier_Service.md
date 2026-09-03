# DataTypeIdentifiers
You can leave the `ValueHostConfig.dataType` property blank and Jivs will identify its name for you with implementations of `IDataTypeIdentifier`. These come preinstalled: "String", "Number", "Boolean", and "Date" (Date object using only the date part in UTC).

Add your own when you have a class representing some data together with its own [Lookup Key](./Home.md#lookup-keys).

## Creating your own DataTypeIdentifiers
Use these resources to help when implementing a `DataTypeIdentifier`:
- [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts) defines the class RelativeDate and an associated `DataTypeIdentifier`.
- [jivs-examples/src/TimeSpan_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/TimeSpan_class.ts) defines the class TimeSpan and an associated `DataTypeIdentifier`.

## Registering a DataTypeIdentifier
The `DataTypeIdentifierService` where you register `DataTypeIdentifiers`.
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.
```ts
services.dataTypeIdentifierService.register(new MyDataTypeIdentifier());
```
---
Go to [Data Type Support Home](./Home.md)

Go to [API Home](../Home.md)