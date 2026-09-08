# Data Type Check Validators
Simply by specifying a data type [Lookup Key](../Data_Type_Support/Home.md#lookup-keys) on your `FieldValueHost`, you may need a `Validator` installed.
```ts
builder.field('Quantity', LookupKey.Integer);
```
The data type describes a specification of a value. If that specification is not met, it is an invalid value.

Jivs provides a category of `Validators` called **Data Type Check Validators** that focuses on this problem.

There are several `Conditions` already built to detect invalid values:
- [`DataTypeCheckCondition`](../Conditions/Conditions_Included_with_Jivs.md#datatypecheck) - When the native value is a value of undefined, which is Jivs own indicator that the value is invalid. That value is determined in several ways:
    - You set it directly as part of initializing a value
        ```ts
        vhm.vh.field('name').setValue(undefined);
        // or 
        vhm.vh.field('name').setValueToUndefined();
        ```
    - Your editor passes a text value to Jivs, and the parser cannot convert it to a native value. Jivs assigns it to undefined.
        ```ts
        vhm.vh.field('name').setTextValue(text value);
        ```

    - Your own parser determines its invalid, then provides the text and undefined value to the `FieldValueHost` 
        ```ts
        vhm.vh.field('name').setValues(undefined, text value, { 
            injectedError: { errorMessage: 'invalid value'}})
        ```
- [`RegExpCondition`](../Conditions/Conditions_Included_with_Jivs.md#regexp) - When your value is a string and must follow a strong pattern, you will use a regular expression to validate it.
- Special requirements applied to the native value
    - An integer is a special form of a number. The `LookupKey.Integer` is supported by the [`IntegerCondition`](../Conditions/Conditions_Included_with_Jivs.md#integer). 
    - A positive number uses [`PositiveCondition`](../Conditions/Conditions_Included_with_Jivs.md#positive). 
    - A decimal number with a limit of decimal characters uses [`MaxDecimalCondition`](../Conditions/Conditions_Included_with_Jivs.md#maxdecimals).

You can declare them as part of configuring your `FieldValueHost`:
```ts
builder.field('Quantity', LookupKey.Integer)
    .dataTypeCheck().integer();
builder.field('Email', 'Email')
    .dataTypeCheck().regExp(/^([\w\.!#\$%\-+.'_]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]{2,})+)/i);
```
Jivs will automatically add them if missing and it's configured to do so. We want you to take advantage of this feature, which involves the `DataTypeCheckGeneratorService`, so your configuration looks like this:
```ts
builder.field('Quantity', LookupKey.Integer);
builder.field('Email', 'Email');
```
## Automatic Data Type Check Validation
The [`DataTypeCheckGeneratorService`](../Data_Type_Support/DataTypeCheckGenerator_Service.md) already handles most built-in [Lookup Keys](../Data_Type_Support/Home.md#lookup-keys) by applying a `Validator` that uses `DataTypeCheckCondition`. It also maps `LookupKey.Integer` to the `IntegerCondition`. For anything else, you will have to configure `DataTypeCheckGeneratorService`.

### About error messages
Automatically generated `Validators` get their error messages from the [`ErrorMessagesService`](../JivsServices/ErrorMessagesService.md).

To provide the best error messages for the situation:
1. Usually you can review and customize the error messages used by the `ErrorMessagesService`. See [ErrorMessagesService](../JivsServices/ErrorMessagesService.md).
    ```ts
    service.registerErrorMessage(ConditionType.DataTypeCheck, null, {
        '*': 'Invalid value. Enter {DataType}.'
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date, {
        '*': 'Invalid value. Enter a date.'
    });
    ```
2. Add the `Validator` directly during configuration with its desired messages. When present, the `DataTypeCheckGeneratorService` is not used. Just make sure the `category` property is set to `ConditionCategory.DataTypeCheck`.
    ```ts
    builder.field('Quantity', LookupKey.Integer)
        .dataTypeCheck('Invalid value') // replaces the auto generated DataTypeCheckCondition
        .integer('Must be an integer'); // replaces the auto generated IntegerCondition
    builder.field('Email', 'Email')
        .regExp(/^([\w\.!#\$%\-+.'_]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]{2,})+)/i, 
            { 
                errorMessage: 'Expecting an email address',
                category: CondtionCategory.DataTypeCheck    // tells Jivs you handled DataTypeChecks
            });    
    ```

### Adding your own Lookup Keys
When you have a new [Lookup Key](../Data_Type_Support/Home.md#lookup-keys), you have several options:

1. Take no action. You will still benefit from a `DataTypeCheckCondition`. Make sure that your native value is always assigned to undefined when its invalid.
2. For a string with a strong pattern, use the `registerLookupKey()` function together with your Lookup Key and regular expression.
    ```ts
    services.dataTypeCheckGeneratorService.registerLookupKey('Email', /^([\w\.!#\$%\-+.'_]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]{2,})+)/i);
    ```
    This results in your Lookup Key auto generating two validators based on `DataTypeCheckCondition` and `RegExpCondition`.
3. With an enumerated type (or list) of string values, use the `registerLookupKey()` function together with your Lookup Key and an array of strings. Those strings will require a case sensitive match.
    ```ts
    services.dataTypeCheckGeneratorService.registerLookupKey('PhoneType', ['Landline', 'Mobile', 'Satellite']);
    ```
    This results in your Lookup Key auto generating two `Validators` based on `DataTypeCheckCondition` and `RegExpCondition` using an expression built from your array.
4. Implement a class that extends `IDataTypeCheckGenerator` and use the `register()` function.
    ```ts
    export const EmailAddressLookupKey = 'EmailAddress';
    export class EmailAddressDataTypeCheckGenerator implements IDataTypeCheckGenerator
    {
        public supportsValue(dataTypeLookupKey: string): boolean {
            return dataTypeLookupKey.toLowerCase() === EmailAddressLookupKey.toLowerCase();
        }
        public createConditions(valueHost: IFieldValueHost, dataTypeLookupKey: string, conditionFactory: IConditionFactory): Array<ICondition> {
            let config: RegExpConditionConfig = {
                conditionType: ConditionType.RegExp,    // the ConditionFactory depends on this
                valueHostName: valueHost.getName(),
                category: ConditionCategory.DataTypeCheck,  // intentionally using DataTypeCheck
                expression: /^([\w\.!#\$%\-+.'_]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]{2,})+)/i
            };
            return [
                conditionFactory.create(config)
            ];
        }
    }
    ```
    ```ts
    services.dataTypeCheckGeneratorService.register(new EmailAddressDataTypeCheckGenerator());
    ```    

## API References
- [DataTypeCheckGeneratorService class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_DataTypeCheckGeneratorService.DataTypeCheckGeneratorService.html)
- [IDataTypeCheckGenerator interface](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_DataTypes_Types_IDataTypeCheckGenerator.IDataTypeCheckGenerator.html)
- [FieldValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_FieldValueHost.FieldValueHost.html)

---
Go to [Validators Home](./Home.md)

Go to [API Home](../Home.md)