# DataTypeCheckGeneratorService
**Data Type Check Validator** is a `Validator` that can determine if the value supplied is fully compatible with the expected data type [Lookup Key](../Data_Type_Support/Home.md#lookup-keys). For details, see [DataTypeCheck Validators](../Validators/DataTypeCheck_validators.md).

Jivs uses the `DataTypeCheckGeneratorService` to automatically supply Data Type Check Validators so you don't have to include them while configuring.

Consider this `FieldValueHost` configuration:
```ts
builder.field('Quantity', LookupKey.Integer);
```
Without the service, your configuration requires `dataTypeCheck()` and `integer()`:
```ts
builder.field('Quantity', LookupKey.Integer)
    .dataTypeCheck().integer();
```
With the service, those are generated for you.

Since [DataTypeCheck Validators](../Validators/DataTypeCheck_validators.md) describes how to configure and declare your Data Type Check Validators, this section will focus on the `DataTypeCheckGeneratorService` itself.


## DataTypeCheckGeneratorService class
The `DataTypeCheckGeneratorService` already handles the built-in [Lookup Keys](./Home.md#lookup-keys) by applying a `Validator` that uses `DataTypeCheckCondition`. It also maps `LookupKey.Integer` to the `IntegerCondition`. 

For your own Lookup Keys, you automatically get the `DataTypeCheckCondition` too, but you have to ensure that the native value is set to `undefined` to trigger it. Something like an integer, is processed in two steps:
1. Parser converts string to a number (without stripping off decimals). If the parser has failed, it assigns the native value to undefined and the `DataTypeCheckCondition` handles it.
2. `IntegerCondition` confirms the native value is actually an integer but only works against a number. For anything else, it expects the `DataTypeCheckCondition` to invalidate the data.

```ts
builder.field('Quantity', LookupKey.Integer)
    .dataTypeCheck()    // checks the results of parsing
    .integer();         // checks the number is an integer
```
Our preconfigured `IntegerDataTypeCheckGenerator` ensures that `LookupKey.Integer` results in both `dataTypeCheck()` and `integer()`.

### registerLookupKey
```ts
registerLookupKey(lookupKey: string, data: RegExp | Array<string>,
    addDataTypeCheckCondition: boolean = true
): void;
```
Use `registerLookupKey()` for these _use cases_:
- The native value is a string with a strong pattern. Supply a regular expression for that pattern in the _data_ parameter.
    ```ts
    services.dataTypeCheckGeneratorService.registerLookupKey('Email', 
        /^([\w\.!#\$%\-+.'_]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]{2,})+)/i);
    ```
- The native value is a string that has a fixed list of possible values, such as an Enumerated Type. Supply an array of those strings to the _data_ parameter. This will use a case sensitive match.
    ```ts
    services.dataTypeCheckGeneratorService.registerLookupKey('PhoneType', 
        ['Landline', 'Mobile', 'Satellite']);
    ```
- The native value needs additional validators to validate its the Lookup Key. We supply each of those Conditions using their ConditionConfig objects as an array to the _data_ p    
    ```ts
    let intConfig = <IntegerConditionConfig>{
        conditionType: ConditionType.Integer
        // don't need valueHostName because that is assigned at runtime
    };
    let posConfig = <PositiveConditionConfig>{
        conditionType: ConditionType.Positive
    };
    services.dataTypeCheckGeneratorService.registerLookupKey('PosInteger',
        [intConfig, posConfig]);
    ```
### Add your own DataTypeCheckGenerator
For cases not covered by `registerLookupKey()`, you will implement a class that extends `IDataTypeCheckGenerator` and call `register()`.

```ts
export const ShortStringLookupKey = 'ShortString';
export class ShortStringDataTypeCheckGenerator extends DataTypeCheckGeneratorBase
{

    public addConditions(conditions: Array<ConditionConfig>,
        valueHost: IFieldValueHost, dataTypeLookupKey: string, conditionFactory: IConditionFactory): Array<ICondition> {
        let config: StringLengthConditionConfig = {
            conditionType: ConditionType.StringLength,    // the ConditionFactory depends on this
            valueHostName: valueHost.getName(),
            category: ConditionCategory.DataTypeCheck,  // intentionally using DataTypeCheck
            maximum: 255
        };
        return [
            conditionFactory.create(config)
        ];
    }
}
```
```ts
services.dataTypeCheckGeneratorService.register(new ShortStringDataTypeCheckGenerator());
```    

## API References
- [IDataTypeCheckGenerator interface](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_DataTypes_Types_IDataTypeCheckGenerator.IDataTypeCheckGenerator.html)
- [IntegerDataTypeCheckGenerator class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_DataTypes_ConcreteClasses_DataTypeCheckGenerators.IntegerDataTypeCheckGenerator.html)
- [DataTypeCheckGeneratorService class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_DataTypeCheckGeneratorService.DataTypeCheckGeneratorService.html)
- [ConditionConfig interface](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Conditions_Types.ConditionConfig.html)


---
Go to [Data Type Support Home](./Home.md)

Go to [API Home](../Home.md)