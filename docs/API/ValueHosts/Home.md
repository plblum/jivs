# ValueHosts
Every value that you expose to Jivs is kept in a ValueHost. They identify what to validate, and supply values that the user may not be editing, like static or calculated values. There are several types:

- `FieldValueHost` – For any field that may be validated. It actually keeps two values around when working with a UI: 
    - **Native Value** – the value fully compatible with the model's property
    - **Text Value** – the value from within the editor
    > These terms – Native Value and Text Value – will be referenced frequently throughout Jivs documentation.
- `StaticValueHost` – The value that is not validated itself, but its value is needed by validation rules. It can also retain a member of the Model that is not being edited.
- `CalcValueHost` – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days. You supply it a function that returns a value, which can be based on other ValueHosts. 

These objects are created by the `ValueHostsManager` for you, as a result of configuring it. Here is pseudo-code representation of their interfaces (omitting many members).



## Getting a ValueHost
Start with a `ValueHostsManager` instance. It should already be configured with ValueHosts. Supposing *vhm* has that `ValueHostsManager`, do this to get a `ValueHost`:

|Code|Notes|Not found|
|----|-----|---------|
|vhm.getValueHost('name')|Typed as the base class to all ValueHosts|Returns null|
|vhm.getFieldValueHost('name')|FieldValueHost|Returns null|
|vhm.getStaticValueHost('name')|StaticValueHost|Returns null|
|vhm.getCalcValueHost('name')|CalcValueHost|Returns null|
|vhm.vh.field('name')|FieldValueHost|Throws error|
|vhm.vh.static('name')|StaticValueHost|Throws error|
|vhm.vh.calc('name')|CalcValueHost|Throws error|
|vhm.vh.any('name')|Base to all ValueHosts|Throws error|
|vhm.getFieldByElementIdentifier('element identifier')|FieldValueHost by matching its `elementIdentifier` configuration property|Returns null|
|vhm.getFieldByPropertyName('property name')|FieldValueHost by matching its `propertyName` configuration property|Returns null|

## Quick view of the API
```ts
interface IValueHost {
// exposes configuration
    getType(): string;
    getName(): string;
    getDataType(): null | string;
    getLabel(): string;

// Value storage
    getValue(): any;
    setValue(value, options?): void; // value compatible with model's property
    setValueToUndefined(options?): void;
    
// State    
    isChanged: boolean;
    isEnabled(): boolean;
    setEnabled(enabled): void;
}
interface IFieldValueHost extends IValueHost
{
    getTextValue(): any;
    setTextValue(value, options?): void;	// value from the UI's editor
    setValues(nativeValue, textValue, options?): void;	// both values
    
// validation oriented    
    validate(options): ValueHostValidateResult;
    isValid: boolean;
    getIssueFound(errorCode): IssueFound | null;
    getIssuesFound(group?): IssueFound[];	
    required: boolean;

// exposes configuration
    getElementIdentifier(): string;
    getPropertyName(): string;
    getModelReaderRule(): ValueAdapterRule | undefined;
    getModelWriterRule(): ValueAdapterRule | undefined;
}
interface IStaticValueHost extends IValueHost
{
}
interface ICalcValueHost extends IValueHost
{
    convert(source, valueHostsManager): SimpleValueType;
}
```




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
