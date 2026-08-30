# ValueHosts

Every value that you expose to Jivs is kept in a ValueHost. There are several types:

- `FieldValueHost` – For any field that may be validated. (Both UI Inputs and model properties.) It actually keeps two values around when working with a UI: the value fully compatible with the model's property ("native value"), and the value from within the editor ("input value").
- `StaticValueHost` – The value that is not validated itself, but its value is used in an FieldValueHost's validation rule or is a member of the Model that is retained when Jivs is the single-source of truth.
- `CalcValueHost` – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days. You supply it a function that returns a value, which can be based on other ValueHosts. 

These objects are created by the ValueHostsManager for you, as a result of configuring it. Here is pseudo-code representation of their interfaces (omitting many members).
```ts
interface IValueHost {
    getName(): string;
    getDataType(): null | string;
    getLabel(): string;
    setLabel(label, labell10n?): void;
    getValue(): any;
    setValue(value, options?): void; // value compatible with model's property
    setValueToUndefined(options?): void;
    
    isChanged: boolean;
    saveIntoInstanceState(key, value): void;
    getFromInstanceState(key): undefined | ValidTypesForInstanceStateStorage;
}
interface IFieldValueHost extends IValueHost
{
    getTextValue(): any;
    setTextValue(value, options?): void;	// value from the UI's editor
    setValues(nativeValue, textValue, options?): void;	// both values
    
    validate(options): ValueHostValidateResult;
    isValid: boolean;
    getIssueFound(errorCode): IssueFound | null;
    getIssuesFound(group?): IssueFound[];	
    required: boolean;
}
interface IStaticValueHost extends IValueHost
{
}
interface ICalcValueHost extends IValueHost
{
    convert(source, valueHostsManager): SimpleValueType;
}
```

## Naming each ValueHost
Each ValueHost must have a unique name. Give names to every UI widget that correlates them to the fields of the Model.

In this example, our Model’s property names are used in the input tag’s name attribute.

| Model fields | HTML tag
| ----  | ----
| FirstName | `<input type="text" name="FirstName" />`
| LastName | `<input type="text" name="LastName" />`

Jivs wants those same names for basically the same purpose of correlating with fields in the Model.

## Configuring ValueHosts
You configure each ValueHost as part of configuring the overall ValueHostsManager.
Typically it involves subclassing [`ValueHostRulesBase`](#valuehost-rules) to host the business logic rules
of your model. The code goes into the `configureRules()` method, which is passed a Builder
object to describe your configuration through the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class).

### Example
Each `field()` adds or modifies a `ValueHost` of type _FieldValueHost_. The method's parameters
assign properties to the ValueHost. The fluent syntax that follows it are validation rules.

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
When consumed by the user interface, we want to leave the business rules untouched,
and provide form-specific modifications such as to text. So the form should subclass
the model's rules class and implement `IAdaptModelRulesToForm` with at minimum an empty
`adaptToForm()` method.

```ts
class PersonEditFormRules
  extends PersonModelRules
  implements IAdaptModelRulesToForm
{
    public adaptToForm(
        adapter: IFormConfigAdapter,
        options?: ValueHostRulesOptions): void {
    // PENDING WORK...
    // make changes to labels, error messages, severity, parsers, formatters and more
    // add new validation rules or combine UI logic with business logic rules
    // add new ValueHosts
    }
}
```
From there, you can use the _form adapter_ to further customize. The [Form Configuration Adapter](#the-form-configuration-adapter) is actually 
a builder, with a few new methods designed around the adaption process.
```ts
public adaptToForm(
    adapter: IFormConfigAdapter,
    options?: ValueHostRulesOptions): void {
    adapter.useOnlyTheseModelFields('FirstName', 'LastName'); // your form will not be editing any other fields on the model
    adapter.modify('FirstName', { label: 'First name' });
    adapter.modify('LastName', { label: 'Last name' })
    // adding the notEqualTo validator to LastName...
        .addValidator().notEqualTo('FirstName',
        { 
            errorMessage: 'You entered the same value in First Name. Double-check your work.',
            severity: ValidationSeverity.Warning
        });
}
```
### Configuring ValueHosts with the Builder
The [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class) has these functions to add ValueHosts by their type.
> The Form Configuration Adapter is actually a subclass of `ValueHostsManagerConfigBuilder`, supporting the same functions.
- `field()` adds or modifies an `FieldValueHost` configuration. You can chain validator functions like requireText() and regExp() to it.
   
    `field(valueHostName, dataType?, *parameters object*?): IValidatorBuilder`
    
    `field(valueHostName, *parameters object*?): IValidatorBuilder`
    ```ts
    builder.field('fieldname', LookupKey.Date);
    builder.field('fieldname', LookupKey.Integer, { label: 'Field name', labell10n: 'FNKey'});
    builder.field('fieldname').requireText();
    ```
    ```ts
    {  // *parameters object*
        label?: string;
        labell10n?: null | string;
        initialValue?: any;   
        initialEnabled?: boolean;
        parserLookupKey?: null | string;
        formatterLookupKey?: null | string;
        reformatTextValue?: boolean;
        group?: null | string | string[];
        propertyName?: string;
        modelReaderRule?: ValueAdapterRule;
        modelWriterRule?: ValueAdapterRule;
        elementIdentifier:? string | null;
    }
    ```
    This variant takes one parameter, an object with all properties on the `FieldValueHostConfig`.

    `field(*config*): IValidatorBuilder`
    ```ts
    builder.field({ name: 'fieldname', dataType: LookupKey.Date,
        label: 'Field name', labell10n: 'FNKey' }).requireText();
    ```
    ```ts
    {  // config: this plus the above parameters
        name: string;
        dataType?: string;
    }
    ```
 > All members of parameters, config, and arguments are [discussed below](#valuehost-members).

- `static()` adds or modifies a `StaticValueHost` configuration. It does not support validators, but it can be chained with other ValueHosts.
   
    `static(valueHostName, dataType?, *parameters*?): ValueHostsManagerConfigBuilder`
    
    `static(valueHostName, *parameters*?): ValueHostsManagerConfigBuilder`
    ```ts
    builder.static('fieldname', LookupKey.Date);
    builder.static('fieldname', LookupKey.Integer, { label: 'Field name', labell10n: 'FNKey'});
    builder.static('fieldname');
    ```
    ```ts
    {  // parameters
        label?: string;
        labell10n?: null | string;
        initialValue?: any;   
        initialEnabled?: boolean;
    }
    ```
    This variant takes one parameter, an object with all properties on the `StaticValueHostConfig`.

    `static(*config*): ValueHostsManagerConfigBuilder`
    ```ts
    builder.static({ name: 'fieldname', dataType: LookupKey.Date,
        label: 'Field name', labell10n: 'FNKey' });
    ```
    ```ts
    {  // config: this plus the above parameters
        name: string;
        dataType?: string;
    }
    ```
 > All members of parameters, config, and arguments are [discussed below](#valuehost-members).

- `calc()` adds or modifies a `CalcValueHost` configuration. It does not support validators, but it can be chained with other ValueHosts. See [Using CalcValueHost](#using-calcvaluehost) for more.
    
    `calc(valueHostName, dataType, calcFn): ValueHostsManagerConfigBuilder`

    ```ts
    builder.calc('fieldname', LookupKey.Date, myCalcFunction);
    ```
    This variant takes one parameter, an object with all properties on the `CalcValueHostConfig`.

    `calc(*config*): ValueHostsManagerConfigBuilder`
    ```ts
    builder.calc({ name: 'fieldname', dataType: LookupKey.Date,
        calcFn: myCalcFunction });
    ```
    ```ts
    {  // config
        name: string;
        dataType?: string;
        calcFn: CalculationHandler;
        initialEnabled?: boolean;
    }
    ```
 > All members of parameters, config, and arguments are [discussed below](#valuehost-members).

#### Configuration parameters of ValueHosts
Here are the arguments, parameters, and config members for all ValueHost functions described above.
- `name` – The `ValueHost` name. Required. See [Naming each ValueHost](#naming-each-valuehost). If you repeat the same name after calling `builder.startUILayerConfig()`, you want to modify that ValueHost configuration.
- `dataType` – The data type. Generally recommended to be setup, although the actual value provided by `ValueHost.setValue()` can be used to infer the data type. See [Lookup Keys: Data Types and Companion Tools](#lookup-keys-data-types-and-companion-tools).
- `label` – The text to show in the {Label} and {SecondLabel} tokens of an error message.
- `labell10n` – Localization key to get the label from the [TextLocalizerService](#localizing-strings-textlocalizerservice).
- `initialValue` – An initial native value for the `ValueHost`. If not assigned, it is initially undefined.
- `initialEnabled` – `ValueHosts` have an enabled state. When it is false, validation and setting their value is blocked, plus attempts to get the validation state report no error, except to say the `ValidationStatus` is Disabled. Use initialEnabled=false to configure the `ValueHost` as disabled. If omitted, the state is initially true. See [Disabling a ValueHost](#disabling-a-valuehost) for more.
- `calcFn` – Assign the function used by `CalcValueHost` to determine its value. See [Using CalcValueHost](#using-calcvaluehost).
- `group` – Group validation is a tool to group `ValueHosts` with a specific submit command when validating. If used, create a name for the group and use it on all `ValueHosts` and calls to validate() that share the group. The name matching is case insensitive.
- `parserLookupKey` – When you have [configured parsing](#datatypeparsers) for `FieldValueHosts`, this overrides the default parser. Specify a lookupKey to match one that you have registered with the `DataTypeParserService`.
- `formatterLookupKey` – When calling `setValue()`, it takes a native value. By assigning this, it also formats it into the text value. Specify a lookupKey to match one that you have registered with the `DataTypeFormatterService`.
It has no impact on `setValues()` or `setTextValue()`.
- `reformatTextValue` - When calling `setTextValue()`, the original text value can be reformatted, such as '1/2/2025' → '01/02/2025'. It requires the ValueHost to be setup for both parsing and formatter, including the right `DataTypeParsers` and `DataTypeFormatters` in their respective services. The feature requires opting in, either by setting this to true or using `builder.behaviors.reformatTextValue = true`.
- `propertyName` – The actual property name on the model. If its the same as `ValueHostConfig.name`, this can be undefined. Helps mapping between model and valuehost, especially when using the [ModelReader and ModelWriter](#modelreader-and-modelwriter). `ModelReader` and `ModelWriter` permit dot notation to locate a property of a child, such as "Address.Street1".
- `modelReaderRule` - Assists the `ModelReader` to adjust values moving from the model to the ValueHost. See [ModelReader](#modelreader-and-modelwriter).
- `modelWriterRule` - Assists the `ModelWriter` to adjust values moving from the ValueHost to the model. See [ModelWriter](#modelreader-and-modelwriter).
- `elementIdentifier` - 
    When provided, this is used to identify the input element in the UI that is associated with this `FieldValueHost`.

    Some usages:
    - Match to the id= attribute of an HTML input element.
    - Match to the name= attribute of an HTML input element.
    - Match to a data-* attribute of an HTML input element.
    - Selector syntax for document.querySelector() or jQuery to find the element.

    ```ts
    let fvh = vhm.getFieldValueHost('fieldName');
    let fldId = fvh.getElementIdentifier();
    let fld = document.getElementById(fldId);
    ```
    FieldValueHost.getElementIdentifier() method allows you to supply a template
    for which this value is inserted where the "{0}" is found.

    This value is sometimes resolved after configuration. In that case, you can set it later:
    ```ts
    let fvh = vhm.getFieldValueHost('fieldName');
    if (!fvh.hasElementIdentifier())    // suggested - means the config property was not used
        fvh.setElementIdentifier('resolved ID');
    ```

## Getting a ValueHost
Start with a `ValueHostsManager` instance. It should already be configured with ValueHosts. Supposing *vhm* has that `ValueHostsManager`, do this to get a `ValueHost`:

|Code|Notes|Not found|
|----|-----|---------|
|vhm.getValueHost('name')|Base to all ValueHosts|Returns null|
|vhm.getValidatorsValueHost('name')|Base to Validatable ValueHosts|Returns null|
|vhm.getTextValueHost('name')|FieldValueHost|Returns null|
|vhm.getStaticValueHost('name')|StaticValueHost|Returns null|
|vhm.getCalcValueHost('name')|CalcValueHost|Returns null|
|vhm.vh.field('name')|FieldValueHost|Throws error|
|vhm.vh.static('name')|StaticValueHost|Throws error|
|vhm.vh.calc('name')|CalcValueHost|Throws error|
|vhm.vh.any('name')|Base to all ValueHosts|Throws error|

## Getting and setting native and text values
Validation rules work against the inputs from the user, the properties from the model, and other sources of data. The ValueHost classes are built for each of those approaches (FieldValueHost, StaticValueHost, etc).

Without the actual values, you cannot validate. This section covers ways to supply values to Jivs and to retrieve them when needed.

As a refresher, each `FieldValueHost` may have two representations of its value:
- Native value - The value that will actually be stored in the model or table.
- Text value - The value as represented by the input. 

### Setting values
You will set values as you initialize the `ValueHostsManager` and as the values are changed. 

There are 4 functions available.
- `setValue(value: any, options?: SetValueOptions): void` - Set the native value. Optionally let Jivs convert it to the text value.

- `setTextValue(textValue: string, options?: FieldValueHostSetValueOptions): void` - Set the text value. Optionally let Jivs convert it to the native value.
- `setValues(nativeValue: any, textValue: string, options?: SetValueOptions): void` - You have prepared both native and text values. Use this to set both of them together.
- `setValueToUndefined(options?: SetValueOptions): void` - The native value is undetermined, or your own parser could not convert from text to a native value, this will record the native value as undefined. 

### setValue() function
Set the native value. Optionally let Jivs convert it to the text value.
```ts
class ValueHost
{
    setValue(value: any, options?: SetValueOptions): void {}
}
```
- Use when initializing the `ValueHost` from the native value on your model.
- `FieldValueHosts` can also change the text value, so long its `DataTypeFormatters` feature is setup in the `ValueHostConfig`. More details below.
- `FieldValueHosts` and `StaticValueHosts` support this. `CalcValueHosts` are effectively read-only, and calling this does nothing.
- Your own formatter: If you handle converting native to text value outside of Jivs, use `setValues()` instead.
- Using our formatter, you can wire up your UI element to take the resulting string by setting up the `ValueHostsManager.onTextValueChanged` callback handler.

In this example, *vhm* is the ValueHostsManager.
```ts
vhm.getValueHost("LastName").setValue("MyValue");
// or
vhm.vh.any("LastName").setValue("MyValue");
```
When initializing the value, the options parameter offers several properties that are used:
In this example, *vhm* is the `ValueHostsManager`.
```ts
vhm.getValueHost("LastName").setValue("MyValue",
    {
        validate: false,    // don't need to validate just yet
        reset: true         // don't track a state change as if the user has edited the value
    }
);
```
See [Options parameter](#options-parameter-setvalueoptions) for all options.

See ["Getting a ValueHost"](#getting-a-valuehost) for using `getValueHost()` and `vhm.vh`.
#### Decisions around Jivs built-in formatting
Your `ValueHost` configuration determines if formatting will happen.

- LookupKey used to select the `DataTypeFormatter` comes from the `dataType` or `formatterLookupKey`.
    ```ts
    builder.field('BirthDate', LookupKey.Date); // will use DateFormatter
    builder.field('BirthDate', LookupKey.Date,
        {
            formatterLookupKey: LookupKey.LongDate  // will use LongDateFormatter, overriding the data type
        }
    )
    ```
- Prevent conversion to text value by assigning behaviors.disableFormattingOnValueChange to true.
    ```ts
    builder.behaviors.disableFormattingOnValueChange = true;
    ```    
- Prevent conversion to text value by assigning formatterLookupKey to null for case-by-case basis.
    ```ts
    builder.field('BirthDate', LookupKey.Date,
        {
            formatterLookupKey: null  // no conversion
        }
    )
    ```
- When the formatter has been setup, it can be disabled on calls to any of the setValue functions.
    ```ts
    vhm.getValueHost('BirthDate').setValue(birthDate, { disableFormatter: true });
    ```
- Using the resulting text value in your user interface element
    ```ts
    builder.field('BirthDate', LookupKey.Date, { // will use DateFormatter
        elementIdentifier: 'idForBirthdate'  // hold the id attribute value of the input if different from the ValueHost name
    });
    builder.onTextValueChanged = (fieldValueHost, oldValue)=>{
        let newTextValue = fieldValueHost.getTextValue();
        // assign it to the input's value attribute
        document.getElementById(fieldValueHost.getElementIdentifier()).value = newTextValue;
    };
    let vhm = new ValueHostsManager(builder.completed());
    // suppose your have a model object with a 'BirthDate' property
    vhm.getValueHost('BirthDate').setValue(model.BirthDate);  // triggers onTextValueChanged
    ```
- Localize formatting with the behaviors.activeCultureId property.
    ```ts
    builder.behaviors.activeCultureId = 'fr-FR';
    ```          
    See also [Localization](#localization).
### setTextValue() function
Set the text value. Optionally let Jivs convert it to the native value using its built-in parsers.
Optionally let it also reformat the native value to text value and call onTextValueChanged callback hook
so you can get reformatting too.
```ts
class FieldValueHost {
    setTextValue(textValue: string, options?: FieldValueHostSetValueOptions): void {}
}
```
- Use when an input or string from an API call needs validation. For example, use this with the HTML Input element's onchange event handler.
- Only exists on `FieldValueHosts`.
- `FieldValueHosts` can also change the native value, so long as its `DataTypeParsers` feature is setup in the `ValueHostConfig`. More details below.
- Your own parser: If you handle converting the text to native value outside of Jivs, use `setValues()` instead.

```ts
document.getElementById('birthDate').attachEventListener('onchange', (event)=> {
    vhm.getFieldValueHost('BirthDate').setTextValue(event.target.value);
});
```
See [Options parameter](#options-parameter-setvalueoptions) for all options.

See ["Getting a ValueHost"](#getting-a-valuehost) for using `getFieldValueHost()` and `vhm.vh`.

#### Decisions around Jivs built-in parsing
Your `ValueHost` configuration determines if parsing will happen.

- LookupKey used to select the `DataTypeParser` comes from the `dataType` or `parserLookupKey`.
    ```ts
    builder.field('BirthDate', LookupKey.Date); // will use DateParser
    builder.field('BirthDate', LookupKey.Date,
        {
            parserLookupKey: LookupKey.LongDate  // will use LongDateParser, overriding the data type
        }
    )
    ```
- Prevent conversion to text value by assigning behaviors.disableParsingOnValueChange to true.
    ```ts
    builder.behaviors.disableParsingOnValueChange = true;
    ```    
- Prevent conversion to native value by assigning parserLookupKey to null on a case-by-case basis.
    ```ts
    builder.field('BirthDate', LookupKey.Date,
        {
            parserLookupKey: null  // no conversion
        }
    )
    ```
- When the parser has been setup, it can be disabled on calls to any of the setValue functions.
    ```ts
    vhm.getValueHost('BirthDate').setValue(birthDate, { disableParser: true });
    ```
- Reformatting the original text based the presence of both parser and formatter is handled through configuration's `reformatTextValue` property.
You must have configured services and the valueHostConfig with the necessary `DataTypeFormatters`, `DataTypeParsers`, and their lookup keys.
    ```ts
    builder.field('BirthDate', LookupKey.Date,
        {
            reformatTextValue: true // if DateFormatter and DateParser are setup, expect '1/2/2000' to reformat into '01/02/2000'
        }
    )
    ```
    Or using the `behavior.reformatTextValue` property to address all that don't explicity use `ValueHostConfig.reformatTextValue`.

    ```ts
    builder.behaviors.reformatTextValue = true;
    builder.field('BirthDate', LookupKey.Date,
        {
            // if DateFormatter and DateParser are setup, expect '1/2/2000' to reformat into '01/02/2000'
        }
    )
    ```
    If neither `reformatTextValue` properties are set, the feature is disabled.
- Localize parsing with the `behaviors.activeCultureId` property.
    ```ts
    builder.behaviors.activeCultureId = 'fr-FR';
    ```        
    See also [Localization](#localization).
### setValues() function
Set both native and text values together.
```ts
class FieldValueHost
{
    setValues(nativeValue: any, textValue: string, options?: SetValueOptions): void {}
}
```
- Use when you handle either parsing (convert text to native) or formatting (convert native to text) instead of `setValue()` and `setTextValue()`.
- If conversion failed or the value is undetermined, pass the value `undefined` as the value. Alternatively, use `setValueToUndefined()`.
- Even if configured, Jivs own parsers and formatters will not be used by `setValues()`.

```ts
// to initialize, convert the model's native value to text and assign to the HTML element
let textValue = myFormatter(model.birthDate);   // you write this
document.getElementById('birthDate').value = textValue ?? '';   // in case undefined, use ?? ''
vhm.getFieldValueHost('BirthDate').setValues(model.birthDate, textValue, {
    skipValueChangedCallback: true,  // in case you wire up the onTextValueChanged callback hook
    validate: false,    // don't need to validate just yet
    reset: true         // don't track a state change as if the user has edited the value    
});

// to handle the onchanged event, parse the text to make it the native value
document.getElementById('birthDate').attachEventListener('onchange', (event)=> {
    let textValue = event.target.value;
    let nativeValue = myParser(textValue); // return undefined if could not convert
    vhm.getFieldValueHost('BirthDate').setValues(nativeValue, textValue);
});
```
See [Options parameter](#options-parameter-setvalueoptions) for all options.

See ["Getting a ValueHost"](#getting-a-valuehost) for using `getFieldValueHost()` and `vhm.vh`.
### setValueToUndefined() function
The native value is undetermined, or your own parser could not convert from text to a native value, this will record the native value as undefined. Alternatively, use `setValue(undefined)`.   
```ts
class ValueHost {
    setValueToUndefined(options?: SetValueOptions): void {}
}
```
### Options parameter: SetValueOptions
Each of the `setValue()` functions offer the options parameter. Here is its type:
```ts
interface SetValueOptions {
    validate?: boolean;
    reset?: boolean;
    overrideDisabled?: boolean;    
    skipValueChangedCallback?: boolean;
    duringEdit?: boolean;
// FieldValueHosts add the following:
    injectedError? : InjectedError;
    disableParser?: boolean;
    disableFormatter?: boolean;
}
```
These properties are all related to validation:
- `validate` - When true, invoke validation but only if the value changed. Only supported by validatable ValueHosts.
- `reset` - When true, change the state of the ValueHost to unchanged and validation has not been attempted. Consider setting this to true when using `setValue()` to initialize.
- `skipValueChangedCallback` - When true, the onValueChanged and onTextValueChanged callbacks will not be invoked.
- `overrideDisabled` - When true, it forces the change to the value even when the ValueHost is disabled.
ValueHost is disabled when `isEnabled()` returns false.
**Use case**: You may want to initialize a ValueHost with a value that is disabled. See [Disabling a ValueHost](#disabling-a-valuehost).
- `duringEdit` - Set to true for an intermediate edit activity rather than a completed change.
     For example, on the client side this may be used for an HTMLInputElement.oninput event,
     where the user is still editing. In this mode, only validators intended for in-progress
     edits are used like requireText, notNull, stringLength and regExp.
- `injectedError` - When you handle parsing, your parser may report an error that you want to display.
  Use this option to pass along the error. Jivs will display it. See [Injecting errors on demand](#injecting-errors-on-demand).
- `disableParser` - When true, do not allow the parser to run on this ValueHost.
- `disableFormatter` - When true, do not allow the parser to run on this ValueHost.

## Getting the value
Use `getValue()` to get the value from any ValueHost. For an FieldValueHost, it returns the native value. The `evaluate()` function of Conditions use this to gather data. If you are reassembling a Model from the ValueHostsManager, use it there too.
```ts
getValue(): any;
```
When it returns undefined, it indicates the value is undetermined.
```ts
let nativeValue = vhm.getValueHost("LastName").getValue();
// or
let nativeValue = vhm.vh.any("LastName").getValue();
```
## Getting the text value on FieldValueHosts
FieldValueHosts have two values, native and text. The `getValue()` function gets its native value. The `getTextValue()` function gets its text value.
```ts
getTextValue(): string;
```
```ts
let textValue = vhm.getFieldValueHost("LastName").getTextValue();
// or
let  textValue = vhm.vh.any("LastName").getTextValue();
```
See ["Getting a ValueHost"](#getting-a-valuehost) for using `getFieldValueHost()` and `vhm.vh`.

## Injecting errors on demand
When you handle parsing outside of Jivs, your parser may report an error. You need to supply the original
text and that error message to Jivs. Upon receipt of an error like this, Jivs knows to create a validator for it.

The `FieldValueHost` functions `setValue()`, `setValues()`, `setTextValue()`, and `setValueToUndefined()` can take in your error message like this:

```ts
vhm.getFieldValueHost('field1').setTextValue(
    undefined, // indicates the native value was unresolved
    text, // value prior to parsing
    { injectedError: { errorMessage: 'message'}});  // error resulting from the parser
```
You can also supply it separately:
```ts
vhm.getFieldValueHost('field1').setInjectedError({ errorMessage: 'message'});
```
Its state remains until the next call to `setValue()` and its peers, `clearValidation()`, and ondemand with this:
```ts
vhm.getFieldValueHost('field1').clearInjectedError();
```

See [Injecting errors on demand](../Validators/Injecting_errors_on_demand.md) for more.

## Using CalcValueHost
The CalcValueHost takes a function used to calculate its value. The function has this format.
```ts
(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => number | Date | string | null | boolean | undefined
```
Take advantage of the findValueHosts parameter to request values from other ValueHosts: `findValueHosts.getValueHost('name').getValue()`. It also provides access to the JivsServices on `findValueHosts.services`.

In this example, the function multiplies the value from the FieldValueHost 'Count' by 10.
```ts
builder.field('Count', LookupKey.Integer);
builder.calc('TimesTen', LookupKey.Integer, 
   (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => {
      let count = findValueHosts.getValueHost('Count') as number;
      if (!isNaN(count))
          return count * 10;
      return undefined;
   });
```

See a practical example here: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts)

## Disabling a ValueHost
ValueHosts can be disabled. Here are their behavior changes when disabled:
- Validation will not run
- Validation State is similar to having no error. You will still get some messages through the onValueHostValidationStateChanged callback. Expect the ValidationState object to look like this:
    ```ts
    {
        isValid: true,
        status: ValidationStatus.Disabled,
        doNotSave: false,
        issuesFound: null,
    }
    ```
- Calls to `setValue()`, `setTextValue()`, and `setValues()` will not make any changes to the values. Use the overrideDisabled option to override this behavior: 
    ```ts
    vh.setValue(value, { overrideDisable: true });
    ```

- Explicitly setting it to false using the setEnabled() function clears the validation state.

### How to disable and enable the ValueHost
There are two ways to set and change it: using the 'enabled' state, which is a boolean that you change on demand, and using the **Enabler Condition**, where the Condition determines whether it is true or false.

- If you want to disable it as part of initial configuration, set the initialEnabled property to false in the ValueHostConfig object or as shown here using Builder API.
    ```ts
    builder.field('name', LookupKey.String, { initialEnabled: false });
    ```
- To change it on demand, call the setEnabled() function on the ValueHost object.
    ```ts
    vhm.getValueHost('name').setEnabled(false);
    ```
  >When setting it to true, also be sure to call validate() if you want to restore the validation state. 
  
- To use the Enabler Condition, select the appropriate Condition class and use the Builder API like this:
  ```ts
  builder.field('field1').validators go here
  builder.enabler('field1', (enablerBuilder)=> enablerBuilder.condition(parameters));
  
  // example
  builder.field('field1').requireText();
  builder.enabler('field1', (enablerBuilder)=> enablerBuilder.equalTo('YES', 'Field2'));
  ```
