# DataTypeIdentifiers
You can leave the `ValueHostConfig.dataType` property blank and Jivs will identify its name for you with implementations of `IDataTypeIdentifier`. These come preinstalled: "String", "Number", "Boolean", and "Date" (Date object using only the date part in UTC).

Add your own when you have a class representing some data. Check out an actual example here: [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts). In this example, we have a new class, RelativeDate. We've created a new Lookup Key name called "RelativeDate" and associated it with a new DataTypeIdentifier.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)

## Registering the DataTypeIdentifier with its Service
Like all services, this is part of the `JivsService` and can be configured in your `createJivsServices()` function.

`services.dataTypeIdentifierService`

Register your `IDataTypeIdentifier` class like this:
```ts
services.dataTypeIdentifierService.register(new MyDataTypeIdentifier());
```