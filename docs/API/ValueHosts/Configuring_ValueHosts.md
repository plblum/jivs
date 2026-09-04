# Configuring ValueHosts
You configure each `ValueHost` as part of configuring the overall `ValueHostsManager`.
It involves subclassing [`ValueHostRulesBase`](../ValueHost_Rules/Home.md) to host the business logic rules
of your model or fields of your form. By having configuration wrapped in a class, it is testable, reusable, subclassable, and portable. In addition, Jivs `ValueHostRulesBase` knows how to cache its work.

## Example
This adds two `FieldValueHosts` to the configuration of a Person model. Every parameter and property contained in the `field()` function is a configuration specific to the `FieldValueHost`. Functions after `field()` are its validators.
```ts
export class PersonModelRules extends ValueHostRulesBase {
    protected configureRules(builder: IValueHostsManagerConfigBuilder, options?: ValueHostRulesOptions): void {
        // create the First Name ValueHost and its validators
        builder.field('FirstName', LookupKey.String, { label: 'First name'} )
            .requireText();
        // create the Last Name ValueHost
        builder.field('LastName', LookupKey.String, { label: 'Last name'} )
            .requireText();
    }
}
```
See [ValueHost Rules](../ValueHost_Rules/Home.md) to learn more. Here we'll focus on specific configuration properties of `ValueHosts`.

For an all-encompassing overview of configuration, use [ValueHostsManager Configuration Guide](../../ValueHostsManager_Configuration_Guide.md).

## Configuring FieldValueHost
Use the `field()` method on the [Builder](../../ValueHostsManager_Configuration_Guide.md#the-valuehostsmanagerconfigbuilder-class) to add a `FieldValueHost`.

`field(valueHostName, dataType?, *parameters object*?): IValidatorBuilder`

`field(valueHostName, *parameters object*?): IValidatorBuilder`

_Examples:_
```ts
builder.field('fieldname', LookupKey.Date);
builder.field('fieldname', LookupKey.Integer, { 
    label: 'Field name', 
    labell10n: 'FNKey',
    elementIdentifier: 'field_name',
    propertyName: 'fieldName'
    });
```
> Note: You can append validators after the `field()` function. See [Validators](../Validators/Home.md).
```ts
{  // *parameters object*
    label?: string;
    labell10n?: null | string;
    initialValue?: any;   
    initialEnabled?: boolean;
    enablerConfig?: ConditionConfig;
    parserLookupKey?: null | string;
    formatterLookupKey?: null | string;
    reformatTextValue?: boolean;
    group?: null | string | string[];
    elementIdentifier?: string | null;
    propertyName?: string;
    modelReaderRule?: ValueAdapterRule;
    modelWriterRule?: ValueAdapterRule;
}
```
All parameters and arguments are [discussed below](#configuration-parameters-of-all-valuehosts).

## Configuring StaticValueHost
Use the `static()` method on the [Builder](../../ValueHostsManager_Configuration_Guide.md#the-valuehostsmanagerconfigbuilder-class) to add a `StaticValueHost`.

`static(valueHostName, dataType?, *parameters object*?): ValueHostsManagerConfigBuilder`

`static(valueHostName, *parameters object*?): ValueHostsManagerConfigBuilder`

_Examples:_
```ts
builder.static('fieldname', LookupKey.Date);
builder.static('fieldname', LookupKey.Integer, { 
    label: 'Field name', 
    labell10n: 'FNKey'
    });
builder.static('fieldname');
```
```ts
{  // parameters object
    label?: string;
    labell10n?: null | string;
    initialValue?: any;   
    initialEnabled?: boolean;
    enablerConfig?: ConditionConfig;
}
```
All parameters and arguments are [discussed below](#configuration-parameters-of-all-valuehosts).

## Configuration CalcValueHost
Use the `calc()` method on the [Builder](../../ValueHostsManager_Configuration_Guide.md#the-valuehostsmanagerconfigbuilder-class) to add a `CalcValueHost`.

Most of the work involves your calculation function, which has this declaration:
```ts
type CalculationHandler = (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => SimpleValueType
type SimpleValueType = number | Date | string | null | boolean | undefined;
```
See [Using CalcValueHost](#using-calcvaluehost) for more.

`calc(valueHostName, dataType, calcFn): ValueHostsManagerConfigBuilder`

`calc(valueHostName, dataType, calcFn, *parameters object*): ValueHostsManagerConfigBuilder`

_Examples:_
```ts
builder.calc('fieldname', LookupKey.Date, myCalcFunction);
builder.calc('fieldname', LookupKey.Date, myCalcFunction, { initialEnabled: true });
builder.calc('fieldname', LookupKey.Date, (callingValueHost, findValueHosts) => return new Date());
```
All parameters and arguments are [discussed below](#configuration-parameters-of-all-valuehosts).

### Configuration parameters of all ValueHosts
Here are the arguments and parameters for all `ValueHosts` described above.
- `name` – The `ValueHost` name. Required. See [Naming each ValueHost](./Home.md#naming-each-valuehost).
- `dataType` – The data type. Use either the `LookupKey` enumerated type or a string with your own data type. See [Data Types and Companion Tools](../Data_Type_Support/Home.md).
- `label` – The text to show in the {Label} and {SecondLabel} tokens of an error message.
- `labell10n` – Localization key to get the label from the [TextLocalizerService](../JivsServices/TextLocalizerService.md).
- `initialValue` – An initial native value for the `ValueHost`. If not assigned, it is initially undefined.
- `initialEnabled` – `ValueHosts` have an enabled state. When it is false, validation and setting their value is blocked, plus attempts to get the validation state report no error, except to say the `ValidationStatus` is `Disabled`. Use `initialEnabled=false` to configure the `ValueHost` as disabled. If omitted, the state is initially true. See [Disabling a ValueHost](./Disabling_a_ValueHost.md) for more.
- `enablerConfig` – Use `builder.enabler('valueHostName', (builder)=> builder.condition(parameters))` to set it up. Don't directly modify this property. See [Disabling a ValueHost](./Disabling_a_ValueHost.md) for more.

- `calcFn` – Assign the function used by `CalcValueHost` to determine its value. See [Using CalcValueHost](./Using_CalcValueHost.md).
### Configuration parameters specific to FieldValueHost
- `group` – Group validation is a tool to group `ValueHosts` with a specific submit command when validating. If used, create a name for the group and use it on all `ValueHosts` and calls to `validate()` that share the group. The name matching is case insensitive.
- `parserLookupKey` – When you have [configured parsing](../Data_Type_Support/DataTypeParsers_Service.md) for `FieldValueHosts`, this overrides the default `DataTypeParser` which is determined by the `dataType` property. Specify a Lookup Key to match one that you have registered with the `DataTypeParserService`.

    Set to null to disable the parser. Leave it unassigned if you intend to use the default parser.
- `formatterLookupKey` – When you have [configured formatting](../Data_Type_Support/DataTypeFormatters_Service.md), this overrides the default DataTypeFormatter which is determined by the `dataType` property. Specify a Lookup Key to match one that you have registered with the `DataTypeFormatterService`.

    Set to null to disable the formatter. Leave it unassigned if you intend to use the default formatter.
- `reformatTextValue` - Set to true to activate the reformatting text value feature. 

    When calling `setTextValue()`, the original text value can be reformatted, such as '1/2/2025' → '01/02/2025'. The `ValueHost` must be setup for both parsing and formatting. 
    
    To apply this across all `FieldValueHosts`, use `builder.behaviors.reformatTextValue = true` in your `ValueHost` rules `configureRules()` function.
- `elementIdentifier` - Use to identify the editor element in the UI that is associated with this `FieldValueHost`. Its actual value is up to you. If not supplied, `FieldValueHost.getElementIdentifier()` will use the `ValueHost` name.

    Some usages:
    - Match to the id= attribute of an HTML input element.
    - Match to the name= attribute of an HTML input element.
    - Match to a data-* attribute of an HTML input element. The [Jivs SimpleDom](../../Learning_Jivs/Presentation/The_Jivs_SimpleDom_Approach.md) uses this approach, where you assign this value to all elements associated with the field using `data-field=value`.
    - Selector syntax for `document.querySelector()` or jQuery to find the element.

    ```ts
    let fvh = vhm.getFieldValueHost('fieldName');
    let fldId = fvh.getElementIdentifier();
    let fld = document.getElementById(fldId);
    ```
    `FieldValueHost.getElementIdentifier() `method allows you to supply a template
    for which this value is inserted where the "{0}" is found.

    This value is sometimes resolved after configuration. In that case, you can set it later:
    ```ts
    let fvh = vhm.getFieldValueHost('fieldName');
    if (!fvh.hasElementIdentifier())    // suggested - means the config property was not used
        fvh.setElementIdentifier('resolved ID');
    ```
    Use `ValueHostsManager.getFieldByElementIdentifier(elementIdentifier)` to retrieve a `FieldValueHost` by its Element Identifier.    
- `propertyName` – The actual property name on the model. If not supplied, `FieldValueHost.getPropertyName()` will use the `ValueHost` name. 

    Helps mapping between model and `ValueHost`, especially when using the [ModelReader and ModelWriter](../ModelReader_and_ModelWriter/Home.md). `ModelReader` and `ModelWriter` permit _dot notation_ to locate a property of a child, such as "Address.Street1".

    Use `ValueHostsManager.getFieldByPropertyName(propertyName)` to retrieve a `FieldValueHost` by its property name.
- `modelReaderRule` - Assists the `ModelReader` to adjust values moving from the model to the ValueHost. See [ModelReader](../ModelReader_and_ModelWriter/Home.md).
- `modelWriterRule` - Assists the `ModelWriter` to adjust values moving from the ValueHost to the model. See [ModelWriter](../ModelReader_and_ModelWriter/Home.md).
---

## API References
- [ValueHostBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_AbstractClasses_ValueHostBase.ValueHostBase.html)
- [FieldValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_FieldValueHost.FieldValueHost.html)
- [StaticValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_StaticValueHost.StaticValueHost.html)
- [CalcValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_CalcValueHost.CalcValueHost.html)
- [ValueHostRulesBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_ValueHostRules_ConcreteClasses.ValueHostRulesBase.html)
- [ValueHostsManagerConfigBuilder class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_Builders_ConcreteClasses.ValueHostsManagerConfigBuilder.html)
- [ValueHostsManager class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHostsManager_ConcreteClasses.ValueHostsManager.html)

Go to [ValueHost Home](./Home.md)

Go to [API Home](../Home.md)