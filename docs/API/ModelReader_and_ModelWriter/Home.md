# ModelReader and ModelWriter
`ModelReader` and `ModelWriter` classes transfer data between an external source and `ValueHostsManager`.
That external source is often your own model object. However, you may have a dictionary or string values from an HTTP Form that are the source. They use `DictionaryReader` and `FormReader` respectively.

When initializing the `ValueHostsManager`, source values are copied to the `ValueHosts`, ready for change and validation. 
```text
source → ValueHost
```
This is the role of `ModelReader`, `DictionaryReader`, and `FormReader`.

When you want to retrieve that data, `ValueHosts` have them already in their native form. You have the option to copy its values to the model's properties.
```text
ValueHost → model property
```
This is the role of `ModelWriter`.

## The work is slightly more complex than it seems
You don't have to use our Readers or Writers. Instead of `ModelReader`, you can do this:
```ts
vhm.vh.field('fieldname').setValue(external value);
vhm.vh.field('fieldname').setTextValue(string from an HTTP form); // parser will convert it to its native value
```
Instead of `ModelWriter`, you can retrieve the values from outside of `ValueHostsManager`, or use:
```ts
let value = vhm.vh.field('fieldname').getValue();
```
_However_, there are cases where you need to adapt the value to work with Jivs. Suppose your model property for 'birthdate' supports null for unknown value. Jivs uses undefined for unknown value. We need to take an additional step here. Same with getting the value (undefined must be null in the destination).

```
model property → adapt the value to any requirements of the ValueHost → ValueHost.setValue
    optionally format into text and assign it to the input field too
```
```
ValueHost.getValue → adapt the value to any requirements of the model property → model property
```
`ModelReader` and `ModelWriter` let you configure these adaptation rules on each `ValueHost's` configuration. This allows business rules to be well defined and nobody can code up data transfer errors.

## Basic setup
The actual transfer process is pretty simple, but requires configuration described below.
```ts
let vhm = new ValueHostsManager(config);
let model = getMyModel(); // your code
let reader = new ModelReader(vhm, model, {});   // various options available in third parameter
reader.readFromModel();  // data is now in the ValueHosts

// ... interact with the data and finish up with validation before trying to save it ...

let model = new MyModel(); // or use an existing one. Doesn't matter. Just know its properties will be overwritten where a FieldValueHost is setup
let writer = new ModelWriter(vhm, model);
writer.writeToModel(); // your model is updated
saveMyModel(model); // your code
```

If you want to have it also update the text value of your inputs, wire up the `ValueHostsManager.onTextValueChanged` callback hook to receive that text. As the `ModelReader` works, it will trigger `onTextValueChanged` so long as the `ValueHost` is setup to format the value. See [Decisions around Formatting](../ValueHosts/Getting_and_Setting_Values.md#decisions-around-jivs-built-in-formatting).
```ts
config.onTextValueChanged = myFunctionToUpdateInputs;
let vhm = new ValueHostsManager(config);
```

## Available operations on ModelReader, DictionaryReader, and FormReader
- `readFromModel()` - Copies values into all `FieldValueHosts`. Will not read properties for which there is no `FieldValueHost`. Will skip when the [Value Adapter Rule](#value-adapter-rules) indicates.
- `readFromProperty(destination: IFieldValueHost): boolean` - Handles a single `FieldValueHost`, reading the data from the model property identified in its configuration,
  and applying its [Value Adapter Rules](#value-adapter-rules) before setting it in the `ValueHost`. Will skip when the rule indicates.
- `readFromProperty(modelPropertyName: string, destination: IFieldValueHost): boolean` - Supply the property name directly instead of depending on the `ValueHost` configuration.  
    ```ts
    let model = new MyModel(); // or use an existing one. Doesn't matter. Just know its properties will be overwritten where a FieldValueHost is setup
    let writer = new ModelWriter(vhm, model);
    writer.writeToProperty('property1', vhm.vh.field('field1'));
    writer.writeToProperty('property2', vhm.vh.field('field2'));
    ```
## Available operations on ModelWriter
- `writeToModel()` - Copies values into all model properties with a corresponding `FieldValueHost`. Will skip when the [Value Adapter Rule](#value-adapter-rules) indicates.
- `writeToProperty(source: IFieldValueHost, modelPropertyName?: string): boolean` - Handles a single `FieldValueHost`, reading from the ValueHost
  and applying its [Value Adapter Rules](#value-adapter-rules) before setting it in the model. Will skip when the rule indicates.
    ```ts
    let model = new MyModel(); // or use an existing one. Doesn't matter. Just know its properties will be overwritten where a FieldValueHost is setup
    let writer = new ModelWriter(vhm, model);
    writer.writeToProperty(vhm.vh.field('field1'), 'property1');
    writer.writeToProperty(vhm.vh.field('field2'), 'property2');
    ```
## Getting the form data into FormReader
`FormReader` is a variation of `ModelReader` that expects its data to be a dictionary of strings taken from an HTTP form. It delivers those string values through each `FieldValueHost.setTextValue()`, instead of `setValue`. It uses a parser to convert the text value into the native value.

This shows how to use the express module in node.js to retrieve the posted form values:
```ts
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.post("/submit", (req, res) => {
    const formData = req.body;
    const formReader = new FormReader(valueHostsManager, formData, {});
    formReader.readFromModel();
});
```

## Reader constructor options
```ts
const reader = new ModelReader(vhm, model, options);
const reader = new FormReader(valueHostsManager, formData, options);
const reader = new DictionaryReader(vhm, dictionaryData, options);
```
The `ModelReader`, `DictionaryReader`, and `FormReader` take an options object that supports these values:
- `disableFormatter` - (Not on `FormReader`) When true, do not convert the value to text. Just set the native value.
    When false, these settings still disable the formatter:
    - `valueHostsManager.behaviors.disableFormatterOnValueChange`
    - `FieldValueHostConfig.formatterLookupKey = null`
- `skipValueChangedCallback` - Use when you have setup `ValueHostsManager.onValueChanged` or `onTextValueChanged` callbacks to avoid them from being called. Set to true when you have them setup and expect them to be called while the user is editing the form, but not while initializing its values.
- `alignEnabled` - When true, it updates the enabled setting on each `ValueHost`, allowing them to be determined by whether the source (model, form, dictionary) had a matching property. So long as the `ValueHost` cannot find a source, it is disabled. Otherwise, it is enabled.
- `reformatTextValue` - (Only on `FormReader`) When true, allow the text value to be reformatted before assigning it to the `FieldValueHost's` text value or calling `onTextValueChanged`. Reformatting requires that both parser and formatter are setup. Even if enabled, individual `FieldValueHostConfig.reformatTextValue` can block this when false.

## Configuring the ValueHosts
There are two challenges related to transferring data between models and `ValueHosts` that require configuration:
1. The property name on the model may not match the name assigned to `ValueHost`. It could be something as little as property names use _camelCase_ while `ValueHosts` use _PascalCase_.
2. Values may be represented differently and require adjustment. They need a "value adapter". For example, your model has a numeric property, 'Count', that stores -1 to indicate the field is actually not in use. In that case, we want to setup the `ValueHost` with a value of `undefined` (use `FieldValueHost.setValueToUndefined()`.) 

### Handling a different property name
When configuring the `FieldValueHost`, you can supply the name of the property explicitly like this:
```ts
builder.field('Field1', LookupKey.Number, { 
    propertyName: 'myField' // the name on the model
});
```
If your model contains child objects, that is supported too.
```ts
class MyModel{
    firstName: string,
    lastName: string,
    child: MyChildModel
}
class MyChildModel
{
    favoriteColor?: string
}
```
Set the favoriteColor like this:
```ts
builder.field('Field1', LookupKey.Number, { 
    propertyName: 'child.favoriteColor' // path syntax
});
```
> When using the `ModelWriter`, you are expected to pass in a model with child objects already created. Otherwise, `ModelWriter` will not transfer the value. 

### Value Adapter rules
We are moving data between two different systems, your model and the `ValueHost`. We can insert a **Value Adapter** into this process to catch values that cannot be transferred
without some adjustment, or may need to be skipped. The `ValueAdapterService` handles this.

Frequently the value representing "unassigned" differs. Jivs uses the JavaScript value `undefined` to mean unassigned. You might use undefined, null, 0, etc. This is a typical case for adapting values.

When a value needs adjustment, setup rules within the `modelReaderRule` or `modelWriterRule` properties of `FieldValueHostConfig`.
```ts
builder.field('Field1', LookupKey.Number, { 
    modelReaderRule: // if undefined in the model, use 0 in the ValueHost
    {
        when: 'undefined',
        then: '0'
    },
    modelWriterRule: // if 0 in the valuehost, assign undefined in the model
    {
        when: '0',
        then: 'undefined'
    }
});
```
The values for _when_ and _then_ are strings that lookup functions from the `ValueAdapterService`. It already has many functions. But you will likely add your own.

### When Rules
|Rule name|Values that trigger the Then function
|---------|--------------------------
|undefined| undefined
|nullorundefined| undefined, null
|null| null
|0| 0
|zero| alias of '0'
|zeroornull| 0, null
|0ornull| alias of 'zeroornull'
|zeronullorundefined| 0, null, undefined
|0nullorundefined| alias of 'zeronullorundefined'
|emptystring| '' (the empty string)
|\<emptystring>| Type in ''. its the alias of 'emptystring'
|emptystringornull| '', null
|emptystringnullorundefined| '', null, undefined

#### Creating your own When rule
```ts
 function isNegative(value: any): boolean {
     return typeof value === 'number' && value < 0;
 }
 ```

 Register in the service:
 ```ts
 jivsServices.valueAdapterService.registerWhenFunction('isNegative', isNegative);
 ```
### Then Rules
|Rule name|Value that will be transferred
|---------|--------------------------
|skip| Will not transfer
|omit| alias for 'skip'
|keep| Transfer as is. Typically used when the source value is undefined and you want to preserve that
|nochange| alias for 'keep'
|undefined| undefined
|unassigned| alias for 'undefined'
|null|null
|0|0
|zero|alias for 0
|emptystring| '' (the empty string)
|\<emptystring>| Type in ''. its the alias of 'emptystring'
|false| false
|true| true
|emptyarray| assign an empty array
|[]|alias for 'emptyarray'
|emptyobject| assign an empty object
|{}|alias for 'emptyobject'

#### Creating your own Then rule
```ts
function replaceWithYear2000(value: any): ValueAdapterResolution {
    return { value: new Date('2000-01-01') };
}
```
Register in the service:
```ts
jivsServices.valueAdapterService.registerThenFunction('year2000', replaceWithYear2000);
```
## API References
- [ModelReaderWriterBase](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ModelReaderWriter_AbstractClasses.ModelReaderWriterBase.html)
- [ModelReader](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ModelReaderWriter_ConcreteClasses.ModelReader.html)
- [DictionaryReader](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ModelReaderWriter_ConcreteClasses.DictionaryReader.html)
- [FormReader](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ModelReaderWriter_ConcreteClasses.FormReader.html)
- [ModelWriter](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ModelReaderWriter_ConcreteClasses.ModelWriter.html)
- [ValueAdapterRulesService](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_ValueAdapterService.ValueAdapterService.html)
---
Go to [API Home](../Home.md)