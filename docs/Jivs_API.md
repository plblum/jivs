# Jivs Classes: the API

## Quick API overview

You will be working with classes and interfaces. Here are the primary pieces to orient you to its API.

- [ValueHost rules](#valuehost-rules) – Classes used to configure each ValueHost.
    + `ValueHostRulesBase class` – Create a subclass for each configuration representing a model or form.
    + `IAdaptModelRulesToForm interface` – Implement on a form-specific subclass when adapting rules from an existing model's ValueHost rules.
-   [`ValueHost classes`](#valuehosts) – Identifies a single value to be validated
    and/or contributes data used by the validators. You get and set its value both from a Model and the Inputs (your editor widgets) in the UI.

    + `FieldValueHost class` – Use with fields (both Inputs from the UI and properties from a model), to provide validation as the value changes. 
    + `CalcValueHost class` – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days.
    + `StaticValueHost class` – For values that do not need validating, but support validation rules of FieldValueHosts. 
  
    >For example, a postal codes might be validated against a regular expression. But that expression depends on the country of delivery. So you would use a `StaticValueHost` to pass in a country
    code your app is using, and let the validation internally select the right
    expression by retrieving the country code first.
    
    > If you are using a Model, you might also use `StaticValueHost` for all remaining properties on that model. In this scenario, Jivs becomes a *Single Source of Truth* for the model's data while in the UI.

-   [`ValueHostsManager class`](#valuehostsmanager) – The "face" of this API. It represents the fields of your form or model to Jivs through its `ValueHosts`. Your validation-related UI elements will need access to it to do their work. Use it to validate, retrieve validation results, and report additional errors determined by your business logic. It is supported by these types:
    + `ValueHostsManagerConfig object tree` – An object tree that describes all aspects of configuring the ValueHostsManager, including services, ValueHosts, Validators, and callbacks. 
    + [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class) – Provides a fluent syntax to create the `ValueHostsManagerConfig object tree`.
    + [`FormConfigAdapter class`](#the-form-configuration-adapter) – Also known as the **Form Configuration Adapter**, use it to configure the `ValueHostsManager` from within the `IAdaptModelRulesToForm.adaptToForm()` method. Internally, it prepares the `ValueHostsManagerConfig object tree`.

-   [`Condition classes`](#conditions-the-validation-rules) – Classes that evaluate value(s) against a rule
    to see if those values conform. `Condition classes` exist for each
    business rule pattern, such as *required* or *compare two values are
    not identical*. While there are many standard rules for which there
    are `Conditions` included in this library, you are often going to need
    to build your own.

-   [`Validator class`](#validators-connecting-conditions-to-error-messages) – Handle the validation process of a single rule and deliver a list of issues found to the ValueHostsManager, where your UI elements can consume it.

- [`JivsServices class`](#jivsservices) – Provides dependency injection and configuration through a variety of services and factories. This is where much of customization occurs. Here are several interfaces supported by JivsServices which empower Jivs.
    - `IDataTypeFormatter` – Two use cases:
        + `FieldValueHost` can convert the native value into its text value when using `ValueHost.setValue()`.
        + Provides localized strings for the tokens within error messages. For example, if validating a date against a range, your error message may look like this: "The value must be between {Minimum} and {Maximum}." With a Date-oriented DataTypeFormatter (supplied), those tokens will appear as localized date strings.
    - `IDataTypeConverter` – For these use cases:
        + Changing an object value into something as simple as a string or number for Conditions that compare values. The JavaScript `Date object` is a good example, as you should use its `getTime()` function for comparisons.
        + Changing a value to something else. Take the `Date object` again. Instead of working with its complete date and time, you may be interested only in the date, the time, or even parts like Month or Hours.
    - `IDataTypeParser` – For converting the input value into a native value, ready for validation. A parser can detect an error and report it for a validator to show. Parsers are localizable.
    - There are also `IDataTypeCheckGenerator`, `IDataTypeComparer`, and `IDataTypeIdentifier` to cover some special cases.
    - `ConditionFactory` – Creates the Condition objects used by business rules.

<img src="http://jivs.peterblum.com/images/Class_overview.svg"></img>

**Topics**
- [Conditions - the validation rules](#conditions--the-validation-rules)
- [ValueHosts](#valuehosts)
- [Validators](#validators-connecting-conditions-to-error-messages)
- [ValueHostsManager](#valuehostsmanager)
- [Rules](#valuehost-rules)
- [JivsServices](#jivsservices)
- [ModelReader and ModelWriter](#modelreader-and-modelwriter)

**Additional topics**
- [Creating your own Conditions](#creating-your-own-conditions)
- [Lookup Keys: DataTypes and Companion tools](#lookup-keys-data-types-and-companion-tools)
- [Localization](#localization)
- [Validation Deep Dive](#validation-deep-dive)
- [Logging](#logging)
- [Testing your work](#testing-your-work)

## Conditions: The validation rules
A validator is the combination of two classes: 
1. The *Condition* which is the rule that evaluates the data, determining validity.
2. The *Validator* which hosts the error messages and one Condition object. It contains the `validate()` function
that uses the `Condition` to determine validity and interacts with the containing `ValueHost` and `ValueHostsManager`, who deliver the results to the UI.

To emphasize this separation, let's see how our configuration objects look:
```ts
let compareVal: ValidatorConfig = {
    errorMessage: 'Error message',
    summaryMessage: 'Summary message',
    severity: ValidationSeverity.Error,
    conditionConfig: <EqualToValueConditionConfig>{
        conditionType: ConditionType.EqualToValue,
        secondValue: 20
    }
}
```
Use the **Builder API** syntax to better convey what you are trying to do.
```ts
builder.field('FieldName1').equalToValue(2, 'Error message', 'Summary message');
```
The Builder flattens the validator and condition, as the parameters for equalToValue are a combination of condition (_secondValue_) and validator (_errorMessage_ and _summaryMessage_).

### Intro to configuring Validators
Each validator has these two syntaxes within the Builder API.

```ts
builder.field('field').conditionName(required parameters, errorMessage?, summaryMessage? );
builder.field('field').conditionName(required parameters, { validator parameters } );
```
- The *validator parameters* argument depends on the condition. All have these properties:
  ```ts
  {
      // note: 'null' is used to remove the value from an earlier version of the config
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
  }
  ```
  Any condition with optional properties will have those added to its own version of _validator parameters_. For example:
  ```ts
  {
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
        // condition properties for RequireText:
        trim?: boolean; 
        nullValueResult?: ConditionEvaluateResult;         
  }
  ```
  For details, see [Configuring Validators](#configuring-validators).

Here are the Condition-building functions of the Builder API:
- [RequireText](./Conditions.md#requiretext)
- [NotNull](./Conditions.md#notnull)
- [RegExp](./Conditions.md#regexp)
- [Range](./Conditions.md#range)
- [EqualToValue](./Conditions.md#comparing-two-values-where-second-value-is-specified)
- [NotEqualToValue](./Conditions.md#comparing-two-values-where-second-value-is-specified)
- [LessThanValue](./Conditions.md#comparing-two-values-where-second-value-is-specified)
- [LessThanOrEqualToValue](./Conditions.md#comparing-two-values-where-second-value-is-specified)
- [GreaterThanValue](./Conditions.md#comparing-two-values-where-second-value-is-specified)
- [GreaterThanOrEqualToValue](./Conditions.md#comparing-two-values-where-second-value-is-specified)
- [EqualTo](./Conditions.md#comparing-two-values-where-the-second-value-comes-from-another-field)
- [NotEqualTo](./Conditions.md#comparing-two-values-where-the-second-value-comes-from-another-field)
- [LessThan](./Conditions.md#comparing-two-values-where-the-second-value-comes-from-another-field)
- [LessThanOrEqualTo](./Conditions.md#comparing-two-values-where-the-second-value-comes-from-another-field)
- [GreaterThan](./Conditions.md#comparing-two-values-where-the-second-value-comes-from-another-field)
- [GreaterThanOrEqualTo](./Conditions.md#comparing-two-values-where-the-second-value-comes-from-another-field)
- [StringLength](./Conditions.md#stringlength)
- [DataTypeCheck](./Conditions.md#datatypecheck)
- [Positive](./Conditions.md#positive)
- [Integer](./Conditions.md#integer)
- [MaxDecimals](./Conditions.md#maxdecimals)
- [All](./Conditions.md#all-any-and-countmatches-conditions)
- [Any](./Conditions.md#all-any-and-countmatches-conditions)
- [CountMatches](./Conditions.md#all-any-and-countmatches-conditions)
- [When](./Conditions.md#when-using-one-condition-to-enable-another)
- [Not](./Conditions.md#not-negate-the-result)
- [CustomRule](#custom-rule-you-create-the-condition-on-demand)


### Custom Rule: You create the condition on demand
If you want to create the actual condition object and drop it into the Builder, use `customRule()`.
It takes a function where you return the condition instance.
```ts
 (requestor: ValidatorConfig)=> ICondition | null
``` 
For more on customRule, see [Custom conditions](#one-off-conditions).

> Its often better to create a Condition class, so it can be reused, tested, and work itself into the Builder syntax. See [Creating your own Conditions](#creating-your-own-conditions)
```ts
customRule(requestHandler);
customRule(requestHandler,
    errorMessage?, summaryMessage?);
customRule(requestHandler,
    { // these are the validator parameters
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
    });
```
Error message tokens: `{Label}`

**Examples**
```ts
builder.field('fieldname').customRule((requestor)=> {    
    return new RegExpCondition({ expression: /^\d{7}$/ });
});
```
### Deep Dive: The Conditions internal types

You build validation rules using the `Condition` concept. A `Condition` simply packages a function to evaluate data together with a few other properties. Here is its interface:
```ts
interface ICondition {
    evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
    category: ConditionCategory;
    conditionType: string;
}
```
The `evaluate() function` entirely handles the validation rule, and returns a result of `Match`, `NoMatch`, or `Undetermined`.
<details>
<summary>Expand for details on the results.</summary>

- `Match` – Data conformed to the rule
- `NoMatch` – Data violated the rule
- `Undetermined` – Data wasn’t appropriate for evaluation. Example: an empty textbox’s value isn’t ready for a “Compare the input’s date value to Today”. There needs to be text representing a date first.
</details>
You need to build a class that adapts your validation rules to Jivs own types and classes. Jivs uses the classes that implement the `ICondition interface` to package up a validation rule, and `ConditionConfig type` to inform the `Condition` class how to configure itself. The class is a bridge between business logic and your UI. This section provides the details.

### Separation of concerns: Input Validation vs Business Logic validation

<details>
<summary>This topic should orient the developer on keeping validation logic separate from the UI.</summary>
Jivs wants the app to keep its validation rules in Business Logic separate from UI code. Business logic should have no knowledge of the UI. It operates based on an object called Model or Entity. As you know, properties of objects are completely disconnected from the UI input elements.

> Input Validation’s role is to ensure that the values you move into a Model conform to the business logic, without using existing business logic code that depends on the Model.

Business logic validation code still gets used, but only upon attempting to save into the Model. The user clicks a Save button. The button first checks if there are any remaining input validation errors. If none, you have code that populates a model from the Inputs. That’s when business logic does its own validation. It will save if no issues remain. It will report back issues if any are found. You’ll pass them along to `ValueHostsManager` to impact the user interface, like showing them in a ValidationSummary widget.

About all the UI developer should know is:
- The identity of the Model’s field, so it can move values between Model and UI.
- The data type of the field. Specifically the property’s data type, like a number, date, Boolean, or complex object. The developer uses that to determine the widget that will edit the value. They also use that to write the code that converts the value between the Model property’s data type and the widget’s data type.

The UI developer provides these UI-specific elements:
- A widget that shows issues that are found.
- A widget that shows a consolidation of issues found, including those reported by Business Logic. This is referred to as the ValidationSummary.
- Any additional validation rules that support the UI elements. Typical use case: reporting an issue when  converting the value of the widget into the value needed by the Model.
- More appropriate error messages for the UI than business logic supplied.
- Field labels that will appear in error messages, as the property name is often a poor choice for a field label.

Someone will code all of those business logic validation rules in a way that Jivs can consume them. Whether it’s done by the UI developer or not, this new code should be separate from the UI code. (And unit tested.) This will likely be the most code you need to write to work with Jivs (or any validation system).
</details>

You build validation rules using the `Condition` concept. A `Condition` simply packages a function to evaluate data together with a few other properties. Here is its interface:
Jivs provides numerous `Condition classes`. 
<details>
<summary>Expand to see just a few.</summary>

- `RequireTextCondition`, `NotNullCondition` – for required fields
- `DataTypeCheckCondition`, `RegExpCondition` – for checking the data conforms to the data type.
- `RangeCondition`, `EqualToCondition`, `GreaterThanCondition` – Comparing values
- `AllMatchCondition`, `AnyMatchCondition` - For creating complex logic by using multiple `Conditions`.
</details>

To use them, you need to provide a configuration with properties specific to its class. 
> Configuration must be setup when [configuring the ValueHostsManager](#configuring-the-valuehostsmanager).

We'll work with this example: Compare a date from the Input to today's date.

The `EqualToValueCondition` is the right Condition for the job.  Here are the properties available for configuration:
```ts
interface EqualToValueConditionConfig {
    conditionType: string;	// get this value from the ConditionType type: ConditionType.EqualToValue
    valueHostName?: null | string; // leave null/undefined to inherit ValueHost.name.
    secondValue?: any;
    conversionLookupKey?: null | string;
    secondConversionLookupKey?: null | string;
    category?: ConditionCategory; // ConditionCategory.Comparison
}
```
> Where's an error message property? A `Condition` is just part of a Validator. The `Validator class` connects your Condition to its error message.

We'll use the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class) to deliver its properties as it is easier, and allows us to setup the error message too:
```ts
builder.field('SignedOnDate').equalToValue(new Date(), "Enter today's date", { conversionLookupKey: LookupKey.Date });
```
The Builder API assigns conditionType, category, and secondValue (to new Date()). We're using the conversionLookupKey here to ensure that the value of new Date() is just the date part.

<a name="valuehosts"></a>

## ValueHosts

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

### Naming each ValueHost
Each ValueHost must have a unique name. Give names to every UI widget that correlates them to the fields of the Model.

In this example, our Model’s property names are used in the input tag’s name attribute.

| Model fields | HTML tag
| ----  | ----
| FirstName | `<input type="text" name="FirstName" />`
| LastName | `<input type="text" name="LastName" />`

Jivs wants those same names for basically the same purpose of correlating with fields in the Model.

### Configuring ValueHosts
You configure each ValueHost as part of configuring the overall ValueHostsManager.
Typically it involves subclassing [`ValueHostRulesBase`](#valuehost-rules) to host the business logic rules
of your model. The code goes into the `configureRules()` method, which is passed a Builder
object to describe your configuration through the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class).

#### Example
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
#### Configuring ValueHosts with the Builder
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
        modelReaderRule?: DataCleanupRule;
        modelWriterRule?: DataCleanupRule;
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

##### Configuration parameters of ValueHosts
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
- `reformatTextValue` - When calling `setTextValue()`, the original text value can be reformatted, such as '1/2/2025' -> '01/02/2025'. It requires the ValueHost to be setup for both parsing and formatter, including the right `DataTypeParsers` and `DataTypeFormatters` in their respective services. The feature requires opting in, either by setting this to true or using `builder.behaviors.reformatTextValue = true`.
- `propertyName` – The actual property name on the model. If its the same as `ValueHostConfig.name`, this can be undefined. Helps mapping between model and valuehost, especially when using the [ModelReader and ModelWriter](#modelreader-and-modelwriter). `ModelReader` and `ModelWriter` permit dot notation to locate a property of a child, such as "Address.Street1".
- `modelReaderRule` - Assists the `ModelReader` to convert and cleanup data between the model and the ValueHost. See [ModelReader](#modelreader-and-modelwriter).
- `modelWriterRule` - Assists the `ModelWriter` to convert and cleanup data between the ValueHost and model. See [ModelWriter](#modelreader-and-modelwriter).
### Getting a ValueHost
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

### Getting and setting native and text values
Validation rules work against the inputs from the user, the properties from the model, and other sources of data. The ValueHost classes are built for each of those approaches (FieldValueHost, StaticValueHost, etc).

Without the actual values, you cannot validate. This section covers ways to supply values to Jivs and to retrieve them when needed.

As a refresher, each `FieldValueHost` may have two representations of its value:
- Native value - The value that will actually be stored in the model or table.
- Text value - The value as represented by the input. 

#### Setting values
You will set values as you initialize the `ValueHostsManager` and as the values are changed. 

There are 4 functions available.
- `setValue(value: any, options?: SetValueOptions): void` - Set the native value. Optionally let Jivs convert it to the text value.

- `setTextValue(textValue: string, options?: FieldValueHostSetValueOptions): void` - Set the text value. Optionally let Jivs convert it to the native value.
- `setValues(nativeValue: any, textValue: string, options?: SetValueOptions): void` - You have prepared both native and text values. Use this to set both of them together.
- `setValueToUndefined(options?: SetValueOptions): void` - The native value is undetermined, or your own parser could not convert from text to a native value, this will record the native value as undefined. 

#### setValue() function
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
##### Decisions around Jivs built-in formatting
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
        propertyName: 'idForBirthdate'  // use propertyName to hold the id attribute value of the input if different from the ValueHost name
    });
    builder.onTextValueChanged = (fieldValueHost, oldValue)=>{
        let newTextValue = fieldValueHost.getTextValue();
        // assign it to the input's value attribute
        document.getElementById(fieldValueHost.getPropertyName()).value = newTextValue;
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
#### setTextValue() function
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

##### Decisions around Jivs built-in parsing
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
#### setValues() function
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
#### setValueToUndefined() function
The native value is undetermined, or your own parser could not convert from text to a native value, this will record the native value as undefined. Alternatively, use `setValue(undefined)`.   
```ts
class ValueHost {
    setValueToUndefined(options?: SetValueOptions): void {}
}
```
#### Options parameter: SetValueOptions
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

### Getting the value
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
### Getting the text value on FieldValueHosts
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

### Injecting errors on demand
When you handle parsing outside of Jivs, your parser may report an error. You need to supply the original
text and that error message to Jivs. Upon receipt of an error like this, Jivs knows to add it to that ValueHost's list of validation errors.

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

The `InjectedError` object is designed to support localization:
```ts
interface InjectedError
{
    errorMessage: string;   // the only value that is required
    errorMessagel10n?: string;  // a localization key
    summaryMessage?: string;  
    summaryMessagel10n?: string;
    errorCode?: string;     // helps setup discrete localized error messages by using different error codes
}    
```
### Example
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=> {
    let textValue = evt.target.value;
    let [nativeValue, parserError] = YourConvertToNativeCode(textValue);  
    let injectedError: InjectedError | undefined = undefined;
    if (parserError)
    {
        injectedError = { 
            errorMessage : parserError,
            errorCode: 'MyParserErrorCode'  // see below
        };
        nativeValue = undefined;    // indicates native value is not available
    }
    vhm.vh.field('FirstName').setValues(nativeValue, textValue, { 
        injectedError: injectedError
    });
});	
```
### Localizing your injected error
Setup all localization in the `createJivsService()` function, with code associated
with `TextLocalizerService`. See [Localization](#localization) for more.

Like with validator error messages, any value you directly supply can be overridden by 
the `TextLocalizerService`. When you do not supply a value to `injectedError.errorMessagel10n`,
it will internally get setup with the correct l10n key to match `TextLocalizerService.registerErrorMessage()`.
Same for `injectedError.summaryMessagel10n`. Simply by using `registerErrorMessage()`
and `registerSummaryMessage()`, your original text is overridden.

Here is an example to setup the messages when you don't supply the error code.
```ts
import { InjectedErrorValidatorErrorCode } from "@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase";
let tls = vhm.services.textLocalizerService;    
tls.registerErrorMessage(InjectedErrorValidatorErrorCode, null, {
        '*': 'Invalid input' 
    });
tls.registerSummaryMessage(InjectedErrorValidatorErrorCode, null, {
    '*': '{Label} has this invalid input.'
});    
```
Now using your own supplied errorcode (InjectedError.errorCode = 'MyParserErrorCode'):
```ts
let tls = vhm.services.textLocalizerService;    
tls.registerErrorMessage('MyParserErrorCode', null, {
        '*': 'Invalid input' 
    });
tls.registerSummaryMessage('MyParserErrorCode', null, {
    '*': '{Label} has this invalid input.'
});    
```

### Using CalcValueHost
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

### Disabling a ValueHost
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

#### How to disable and enable the ValueHost
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
  builder.enabler('field1', (enablerBuilder)=> enablerBuilder.equalToValue('YES', 'Field2'));
  ```

## Validators: Connecting Conditions to Error Messages

Validation is really just a process that evaluates some rule and returns a result. If there was an error, the result includes an error message. The `Validator class` handles this work. Here is pseudo-code representation of its interface (omitting many members).
```ts
interface IValidator {
    condition: ICondition;
    errorCode: string;
    conditionType: string;
    validate(options): ValidatorValidateResult | Promise<ValidatorValidateResult>;
    setEnabled(enabled): void;
}
```

### Configuring Validators
Validators have an underlying object, ValidatorConfig, that hosts the configuration. You generally use the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class) to assist setting it up.
> Configuration must be setup when [configuring the ValueHostsManager](#configuringvaluehostsmanager).
```ts
interface ValidatorConfig {
    errorCode?: string;
    conditionConfig: null | ConditionConfig;
    conditionCreator?: ConditionCreatorHandler;
    
    // note: 'null' is used to remove the value from an earlier version of the config
    errorMessage?: null | string | ((host) => string);
    errorMessagel10n?: null | string;
    summaryMessage?: null | string | ((host) => string);
    summaryMessagel10n?: null | string;
    
    severity?: ValidationSeverity | ((host) => ValidationSeverity);
    
    enabled?: boolean | ((host) => boolean);
}
```

Let’s go through each property.
- `errorCode` – Each validator must have a unique error code within a ValueHost to identify it. By default, it uses the value from `conditionConfig.conditionType` or the condition created by `conditionCreator` (below). 
  + It is used by these features:
    + Lookup the localized error message with the [`TextLocalizerService`](#localizing-strings-textlocalizerservice).
    + It is included in the `IssueFound object` that is passed to the UI along with the error message to allow your UI to recognize it. IssueFound is passed to your UI in these ValueHostsManager callbacks: `onValidationStateChanged` and `onValueHostValidationStateChanged`.
    + When the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class) has to merge validators using the `ValidatorConfigMergeService`.
    + When business logic provides errors, if its own error code matches this property, this validator reports an error, making it easy to ensure error messages are consistent and UI friendly.
  + Set it directly in these cases:
    + The same condition type is used more than once.
    + To clarify the purpose of the error.
    + To associate it with a business logic error code.
    + To provide multiple localized error messages for the same condition type.
  
- `conditionConfig` – Describes the condition itself. When using the Builder API, you don't set this property directly. See ["Configuring Conditions"](#configuring-a-validation-rule-in-jivs). 

  It is not the only way to setup a Condition…
-	[`conditionCreator`](#one-off-conditions) – Create a Condition by returning an implementation of ICondition. This choice gives you a lot of flexibility, especially when you have some complex logic that you feel you can code up in an `evaluate() function` easier than using a bunch of Conditions.
    
    Its function has this format:
    ```ts
    (requester: ValidatorConfig) => ICondition | null;
    ```
    When using the Builder API, use the [`customRule()`](#one-off-conditions) function instead of conditionCreator.
- `errorMessage` – A template for the message reporting an issue. Its intended location is nearby the Input, such that you can omit including the field’s label. “This field requires a value”. As a template, it provides tokens which can be replaced by live data. (Discussed later).
- `errorMessagel10n` – Localization key for the error message, used with the [TextLocalizerService](#localizing-strings-textlocalizerservice).
- `summaryMessage` – Same idea as errorMessage except to be shown in a Validation Summary. It's normal to include the field label in this message, using the {Label} token: “{Label} requires a value”.
- `summaryMessagel10n` – Localization key for the summary message, used with the [TextLocalizerService](#localizing-strings-textlocalizerservice).
- `severity` – Controls some validation behaviors with these three values.
  - `Error` – Error but continue evaluating the remaining validation rules. The default when `severity` is omitted.
  - `Severe` – Error and do not evaluate any more validation rules for this ValueHost until the error is fixed.
  - `Warning` – Want to give the user some direction, but not prevent saving the data.
- `enabled` – A way to quickly disable the Validator. Alternatively use the WhenCondition or `builder.whenToEnable()` function to control the enabled state based on a condition. See [Using the WhenCondition](#using-the-whencondition-to-enable-another-condition).

#### Example with inline error messages
Now let’s add validators to our previous example using a Model with FirstName and LastName.
```ts
builder.field('FirstName', LookupKey.String, { label: 'First name'} )
   .requireText('This field requires a value', '{Label} requires a value.')
   .notEqualTo('LastName', {
        errorCode: 'SameNameWarning',
        errorMessage: 'Are you sure that your first and last names are the same?',
        summaryMessage: 'In {Label}, are you sure that your first and last names are the same?',
        severity: 'Warning'   
   });
builder.field('LastName', LookupKey.String, { label: 'Last name' })
   .requireText('This field requires a value', '{Label} requires a value.');
```

#### Example with error messages in the TextLocalizerService
Error messages shown here are often delegated to the [TextLocalizerService](#localizing-strings-textlocalizerservice).
TextLocalizerService is setup when creating the JivsServices. Here's a relevant snippet.

```ts
service.registerErrorMessage(ConditionType.RequireText, null, {
    '*': 'This field requires a value.'
});
service.registerSummaryMessage(ConditionType.RequireText, null, {
    '*': '{Label} requires a value.'
});    
service.registerErrorMessage('SameNameWarning', null, {
    '*': 'Are you sure that your first and last names are the same?'
});
service.registerSummaryMessage('SameNameWarning', null, {
    '*': 'In {Label}, are you sure that your first and last names are the same?'
});    
```
Here's the Builder API using those delegated error messages.
```ts
builder.field('FirstName', LookupKey.String, { label: 'First name' } )
    .requireText()
    .notEqualTo('LastName', null, null, {
        errorCode: 'SameNameWarning',
        severity: 'Warning'   
    });
builder.field('LastName', LookupKey.String, { label: 'Last name' }).requireText();
```

## ValueHostsManager
With Jivs, the UI uses the `ValueHostsManager class` to manage the `ValueHosts`, run validation, and get any issues found. All of your UI widgets should have access to the `ValueHostsManager`, so they can take actions resulting from validation.

Here is pseudo-code representation of its interface (omitting some members).
```ts
interface IValueHostsManager {
    services: IJivsServices;
    
    getValueHost(valueHostName): null | IValueHost;
    getValidatorsValueHost(valueHostName): null | IValidatableValueHostBase;
    getTextValueHost(valueHostName): null | IFieldValueHost;
    vh: ValueHostAccessor;

    validate(options?): ValidationState;
    clearValidation(options?): boolean;
    addExternalIssuesFound(issuesFound, developedLocally, options?): boolean;
        
    isValid: boolean;
    doNotSave: boolean;
    asyncProcessing?: boolean;
    getIssuesForInput(valueHostName): null | IssueFound[];
    getIssuesFound(group?): null | IssueFound[];
}
```

### Configuring the ValueHostsManager
> Please visit "[Configuring Jivs](#configuring-jivs)" for an overview of the process.

The `ValueHostsManager` is configured by passing the  `ValueHostsManagerConfig object tree` into its constructor. The object tree is complex and difficult to maintain, so we provide the **Builder API** to greatly simplify it. (See [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class).)

Typically you encapsolate the business rules in a class that inherits from [`ValueHostRulesBase`](#valuehost-rules), overriding the `configureRules()` method where you describe each field and its validators with the Builder API.

#### Example
Each `field()` adds or modifies a `ValueHost` of type _FieldValueHost_. The method's parameters
assign properties to the `ValueHost`. The fluent syntax that follows it are validation rules.

```ts
export class PersonModel {
    firstName: string,
    lastName: string
}
export class PersonModelRules extends ValueHostRulesBase {
    protected configureRules(builder: IValueHostsManagerConfigBuilder, 
        options?: ValueHostRulesOptions): void {

        // create the First Name ValueHost and its validators
        builder.field('FirstName', LookupKey.String, { label: 'First name'} )
            .requireText()
            .notEqualTo('LastName', null, null, 
            { 
                errorMessage: 'You entered the same value in First Name. Double-check your work.',
                severity: ValidationSeverity.Warning
            });
        // create the Last Name ValueHost
        builder.field('LastName', LookupKey.String, { label: 'Last name'} );
    }
}
// consume to build your ValueHostsManager
let services = createJivsServices('en-US'); // see "Installing Jivs"
let rules = new PersonModelRules(services);
let config = rules.configure();
let vhm = new ValueHostsManager(config);   // 'vhm' will be used to handle validation
```

## ValueHost rules
**ValueHost rules** provide a way to define reusable configurations in Jivs.
Create a subclass of `ValueHostRulesBase` to package a full configuration of ValueHosts associated with a model or form.

```ts
// Built around Person model
export class PersonModelRules extends ValueHostRulesBase {
    protected configureRules(builder: IValueHostsManagerConfigBuilder, 
        options?: ValueHostRulesOptions): void {

        // create the First Name ValueHost and its validators
        builder.field('FirstName', LookupKey.String, { label: 'First name'} )
            .requireText()
            .notEqualTo('LastName', null, null, 
            { 
                errorMessage: 'You entered the same value in First Name. Double-check your work.',
                severity: ValidationSeverity.Warning
            });
        // create the Last Name ValueHost
        builder.field('LastName', LookupKey.String, { label: 'Last name'} );
    }
}
// Built around a form that edits FirstName and LastName without using any model
export class PersonFormRules extends ValueHostRulesBase {
    protected configureRules(builder: IValueHostsManagerConfigBuilder, 
        options?: ValueHostRulesOptions): void {

        // create the First Name ValueHost and its validators
        builder.field('FirstName', LookupKey.String, { label: 'First name'} )
            .requireText()
            .notEqualTo('LastName', null, null, 
            { 
                errorMessage: 'You entered the same value in First Name. Double-check your work.',
                severity: ValidationSeverity.Warning
            });
        // create the Last Name ValueHost
        builder.field('LastName', LookupKey.String, { label: 'Last name'} );
    }
}
```
You can see that both Model and Form representations are identical aside from the class name.

The builder's class has a rich API called **Builder API**. Learn about it here:
[Builder](Configuring.md#the-valuehostsmanagerconfigbuilder-class)

When a form uses those model rules, subclass that model's ValueHost rules class and implement `IAdaptModelRulesToForm`.

```ts
class PersonEditFormRules
    extends PersonModelRules
    implements IAdaptModelRulesToForm
{
    public adaptToForm(
        adapter: IFormConfigAdapter,
        options?: ValueHostRulesOptions): void 
    {
        adapter.useOnlyTheseModelFields(['FirstName', 'LastName']);
        adapter.modify('FirstName', { label: 'First name' });
        adapter.modify('LastName', { label: 'Last name' });
    }
}
```

The adapter's class inherits from the builder, and introduces methods to carefully adapt your form's requirements without breaking the business logic rules.
Learn about it here: 
[Adapter](Configuring.md#the-form-configuration-adapter)

### Consuming the ValueHostRules subclass
```ts
const services = createJivsServices('en-US');
const rules = new YourRules(services);
const config = rules.configure();   // takes ValueHostRulesOptions. See below
// assign any callback hooks on config here
const vhm = new ValueHostsManager(config);
```

`configure()` creates the ValueHostsManagerConfig object tree. Use its `options` parameter when you need to influence how the rules are prepared.

```ts
interface ValueHostRulesOptions {
    disableCache?: boolean;
    variantName?: string;
    favorUIMessages?: boolean;    
}
```

- `disableCache` - When `true`, disables cache participation for that `configure()` call.
- `variantName` - Lets the subclass author define named variants of the same rules class, so the class's consumer can request an optional configuration path by name.
- `favorUIMessages` - Used together with the `IAdaptModelRulesToForm.adaptToForm()` function
to determine how to transition from the base rules to the form-specific rules.
When true or undefined, delete any error messages supplied by business logic for which
you have a replacement in `TextLocalizationService`.
If undefined, it defaults to true.

### Short intro to methods on Builder:
The ValueHostsManagerConfigBuilder has these features:
- `builder.field(valueHostName, parameters)` adds n `FieldValueHost` configuration. You can chain validator functions like requireText() and regExp() to it.
For more, see [ValueHost members](#valuehost-members).
- `builder.static(valueHostName, parameters)` adds a `StaticValueHost` configuration.
For more, see [ValueHost members](#valuehost-members).
- `builder.calc(valueHostName, parameters)` adds a `CalcValueHost` configuration. 
For more, see [Using CalcValueHost](#using-calcvaluehost).
    
[Builder](Configuring.md#the-valuehostsmanagerconfigbuilder-class)

### Short intro to methods on Adapter
The `FormConfigAdapter` has these features:
- Declare a subset of model fields you are editing
    + `adapter.useOnlyTheseModelFields([field names])`
    + `adapter.disableTheseModelFields([field names])`
- Replace business logic supplied strings like labels and error messages
    + `adapter.modify(valueHostName, { label: 'text', labell10n: 'localize id' })`
    + `adapter.modify(valueHostName).validator(condition type, { errorMessage: 'text', errorMessagel10n: 'localize id'})`
- Extend validation rules on existing value hosts
    + `adapter.modify(valueHostName).validator(condition type).and(childBuilder => childBuilder.[new condition])`
    + `adapter.modify(valueHostName).validator(condition type).or(childBuilder => childBuilder.[new condition])`
    + `adapter.modify(valueHostName).validator(condition type).whenToEnable(childBuilder => childBuilder.[new condition])`
- Add your own ValueHosts
    + `adapter.field()`
    + `adapter.calc()`
    + `adapter.static()`
- Assign a validation group name if using it.
    + `adapter.assignToGroup('group name', [field names])`

[Adapter](Configuring.md#the-form-configuration-adapter)

---
## ModelReader and ModelWriter
You usually start and end with your own model object. 

At the start, its values are copied to the `ValueHosts`, ready for change and validation. 
```
model property → ValueHost
```

At the end - after validation approves, its values are copied to the model's properties.
```
ValueHost → model property
```

Your initial reaction is that using `FieldValueHost.setValue()` and `FieldValueHost.getValue()` will get the job done. However, there is more to it.
```
model property → clean up the value for use by ValueHost → ValueHost.setValue
    optionally format into text and assign it to the input field too
```
```
ValueHost.getValue → clean up the value for storing into the model property → model property
```

Jivs provides another approach: using the `ModelReader` to copy from model to `ValueHosts` and the `ModelWriter` to copy from the `ValueHosts` to the model. This approach allows business rules to be defined for each field so that nobody can code up transfer errors.

The actual transfer process is pretty simple, but requires configuration described below.
```ts
let vhm = new ValueHostsManager(builder.complete());
let model = getMyModel(); // your code
let reader = new ModelReader(vhm, model);
reader.read();  // data is now in the ValueHosts

// ... interact with the data and finish up with validation before trying to save it ...

let model = new MyModel(); // or use an existing one. Doesn't matter. Just know its properties will be overwritten where a FieldValueHost is setup
let writer = new ModelWriter(vhm, model);
writer.write(); // your model is updated
```

If you want to have it also update the text value of your inputs, wire up the `ValueHostsManager.onTextValueChanged` callback hook to receive that text. As the `ModelReader` works, it will trigger `onTextValueChanged` so long as the `ValueHost` is setup to format the value. See [ValueHost Formatting](#decisions-around-jivs-built-in-formatting).
```ts
builder.onTextValueChanged = myFunctionToUpdateInputs;
let vhm = new ValueHostsManager(builder.complete());
```

### Available operations on ModelReader
- `read()` - Copies values into all `FieldValueHosts`. Will not read properties for which there is no `FieldValueHost`. Will skip when the rule indicates.
- `readOne(destination: IFieldValueHost): boolean` - Handles a single `FieldValueHost`, reading the data from the model property identified in its configuration,
  and applying its rules before setting it in the `ValueHost`. Will skip when the rule indicates.
- `readOne(modelPropertyName: string, destination: IFieldValueHost): boolean` - Supply the property name directly instead of depending on the `ValueHost` configuration.  
    ```ts
    let model = new MyModel(); // or use an existing one. Doesn't matter. Just know its properties will be overwritten where a FieldValueHost is setup
    let writer = new ModelWriter(vhm, model);
    writer.writeOne('property1', vhm.getFieldValueHost('field1'));
    writer.writeOne('property2', vhm.getFieldValueHost('field2'));
    ```
### Available operations on ModelWriter
- `write()` - Copies values into all model properties with a corresponding `FieldValueHost`. Will skip when the rule indicates.
- `writeOne(source: IFieldValueHost, modelPropertyName?: string): boolean` - Handles a single `FieldValueHost`, reading from the ValueHost
  and applying its rules before setting it in the model. Will skip when the rule indicates.
    ```ts
    let model = new MyModel(); // or use an existing one. Doesn't matter. Just know its properties will be overwritten where a FieldValueHost is setup
    let writer = new ModelWriter(vhm, model);
    writer.writeOne(vhm.getFieldValueHost('field1'), 'property1');
    writer.writeOne(vhm.getFieldValueHost('field2'), 'property2');
    ```

### Configuring the ValueHosts
There are two challenges related to transferring data between models and `ValueHosts` that require configuration:
1. The property name on the model may not match the name assigned to `ValueHost`. It could be something as little as property names use _camelCase_ while `ValueHosts` use _PascalCase_.
2. Values may be represented differently and require conversion or cleanup. For example, your model has a numeric property, 'Count', that stores -1 to indicate the field is actually not in use. In that case, we want to setup the `ValueHost` with a value of `undefined` (use `FieldValueHost.setValueToUndefined()`.) This is a data cleanup task.

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

### Data cleanup rules
When a value needs cleanup, setup rules to handle the cleanup again in the `FieldValueHostConfig`, this time within the `modelReaderRules` or `modelWriterRules` properties.
```ts
builder.field('Field1', LookupKey.Number, { 
    modelReaderRules: // if undefined in the model, use 0 in the ValueHost
    {
        when: 'undefined',
        then: '0'
    },
    modelWriterRules: // if 0 in the valuehost, assign undefined in the model
    {
        when: '0',
        then: 'undefined'
    }
});
```
The values for _when_ and _then_ are strings that lookup functions from the `DataCleanupService`. It already has many functions. But you will likely add your own.

#### When Rules
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

##### Creating your own When rule
```ts
 function isNegative(value: any): boolean {
     return typeof value === 'number' && value < 0;
 }
 ```

 Register in the service:
 ```ts
 jivsServices.dataCleanupService.registerWhenFunction('isNegative', isNegative);
 ```
#### Then Rules
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


##### Creating your own Then rule
```ts
function replaceWithYear2000(value: any): DataCleanupResolution {
    return { value: new Date('2000-01-01') };
}
```
Register in the service:
```ts
jivsServices.modelWriterRuleService.registerThenFunction('year2000', replaceWithYear2000);
```

---
## JivsServices
The `JivsServices class` supports the operations of Validation with services and factories, which of course means you can heavily customize Jivs through the power of interfaces and dependency injection.

`JivsServices` is where we register new `Conditions` and classes to help work with all of the data types you might have in your Model. None of those classes are prepopulated (so that you are not stuck with classes that you won't use). So let’s get them setup.

### Configuring JivsServices
Go to [https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts](https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts)

Add the contents of this file to your project. It results in several new functions starting with this one.
```ts
export function createJivsServices(... parameters ...): JivsServices {
…
}
// also many register() functions plus configureCultures() and createTextLocalizerService
```
Once it transpiles, you can edit as needed, although initially leave most of the classes it registers alone, so you can start using the system.

Now that you have the `createJivsServices function`, use it during `ValueHostsManager` configuration.
```ts
let services = createJivsServices('en-US');
let rules = new PersonModelRules(services); // subclass of ValueHostRulesBase for your PersonModel class
let config = rules.configure();
let vhm = new ValueHostsManager(config);
```
### Customizing factories and services
There are many services. Most code that instantiates an object is found in services and factories, not in the ValueHostsManager, ValueHosts, and Validators. That allows for extensive ability to customize.

Here is the JivsServices type:
```ts
interface IJivsServices {
// general API where you can add your own services!
    getService<T>(serviceName): null | T;
    setService(serviceName, service): void;
    
// These services often have settings changes
    cultureService: ICultureService;
    loggerService: ILoggerService;
    textLocalizerService: ITextLocalizerService;

// these are all factories where you may register objects  
    conditionFactory: IConditionFactory;    
    dataTypeConverterService: IDataTypeConverterService;
    dataTypeParserService: IDataTypeParserService;
    dataTypeFormatterService: IDataTypeFormatterService;
    // less frequently modified factories
    dataTypeIdentifierService: IDataTypeIdentifierService;
    dataTypeComparerService: IDataTypeComparerService;
    autoGenerateDataTypeCheckService: IAutoGenerateDataTypeCheckService;
    
// these are customized in special cases
    valueHostFactory: IValueHostFactory;
    validatorFactory: IValidatorFactory;
    valueHostConfigMergeService: IValueHostConfigMergeService;
    validatorConfigMergeService: IValidatorConfigMergeService;    
    buildersFactory: IBuildersFactory;
    lookupKeyFallbackService: ILookupKeyFallbackService;
    messageTokenResolverService: IMessageTokenResolverService;    
    cachingService: ICachingService;
    dataCleanupService: IDataCleanupService;
    objectFinderService: IObjectFinderService;
}
```
Use the source code and TypeDoc output to better understand these services and factories.

See this folder: [https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Services](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Services)

## Lookup Keys: Data Types and Companion Tools
To really do the job well, Jivs wants to know specific data types associated with each Model property. Each ValueHost has a dataType property for this purpose.

```ts
builder.static('name', 'String');
```
You *must* assign dataType to the name of a data type when the data is not a string, boolean, number or Date, and *should* assign it for those types when you need to be more precise, such as an "EmailAddress" instead of just "String".

We use the term "Lookup Key" when specifying the name of a data type. Please [see this page](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html) for a detailed look at all supplied with Jivs and how they are used.

We recommend using the LookupKey enumerated type instead of strings for lookup key parameters.
```ts
builder.static('name', LookupKey.String);
```

A Lookup Key is very powerful! It connects up with these behaviors:
- [DataTypeIdentifiers](#datatypeidentifiers)
- [DataTypeConverters](#datatypeconverters)
- [DataTypeFormatters](#datatypeformatters)
- [DataTypeComparers](#datatypecomparers)
- [DataTypeParsers](#datatypeparsers)
- [DataTypeCheckGenerators](#datatypecheckgenerators)

Let's look at each.

### DataTypeIdentifiers
You can leave the dataType property blank and Jivs will identify its name for you with implementations of `IDataTypeIdentifier`. These come preinstalled: "String", "Number", "Boolean", and "Date" (Date object using only the date part in UTC).

Add your own when you have a class representing some data. Check out an actual example here: [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts). In this example, we have a new class, RelativeDate. We've created a new Lookup Key name called "RelativeDate" and associated it with a new DataTypeIdentifier.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)

### DataTypeConverters
Change the value supplied to Conditions with implementations of `IDataTypeConverter` before comparing the value. The built-in [comparison objects](#datatypecomparers) only work with numbers, strings, and booleans. Everything else either needs conversion to these types or a `IDataTypeComparer` object.

In the case of Date objects, they are easy to convert to numbers. Jivs does that automatically prior to comparison. 

You need to get involved in other cases. This is done by:
1. Ensure that you have an appropriate DataTypeConverter object registered in the DataTypeConverterService.
2. The ValueHost has its dataType property assigned to a value expected by your DataTypeConverter as the source Lookup Key.
3. The validator's ConditionConfig needs a Lookup Key for the resulting data type in the appropriate property: conversionLookupKey or secondConversionLookupKey.

Example: Numeric string to number
The DataTypeConverter is predefined in your `createJivsServices()` function. It is NumericStringToNumberConverter.
```ts
dtcs.register(new NumericStringToNumberConverter());
```
```ts
builder.field('Cycles', LookupKey.String) // dataType's Lookup Key
    .lessThanValue(100, {
        conversionLookupKey: LookupKey.Number // converts 'Cycles' from string to number  
    });
```

Consider these *Use Cases*:
- Change from one data type to another, which is the classic Use Case. We covered string-to-number above. Jivs also provides number-to-integer conversion with IntegerConverter, and several related to dates, described later.

- Provide case insensitive string matching by converting to lowercase. Set the conversionLookupKey properties to "CaseInsensitive" (uses CaseInsensitiveStringConverter).

  Here is the NotEqualToCondition configured with CaseInsensitive:
  ```ts
    builder.field('FirstName', LookupKey.String, { label: 'First name'})
        .notEqual('LastName', {
            conversionLookupKey: LookupKey.CaseInsensitive,
            secondConversionLookupKey: LookupKey.CaseInsensitive	   
        });
  ```
- Using a Date object as something other than Date+Time. You may be interested only in the date, the time, or even parts like Month or Hours. 
  
    Jivs includes these Lookup Keys built around date+time: 
    - "Date" - UTC date only. UTCDateOnlyConverter
    - "LocalDate" - local date only. LocalDateOnlyConverter
    - "TimeOfDay" - time of day only, omitting seconds. TimeOfDayOnlyConverter
    - "TimeOfDayHMS" - time of day including seconds. TimeOfDayHMSOnlyConverter
    - "Minutes" - total minutes into the day
    - "Seconds" - total seconds into the day
    - "Milliseconds" - total milliseconds into the day
  
    You can use their Lookup Key in the ValueHost dataType property instead of the Condition's conversionLookup Key to automatically get their converters.
    ```ts
        builder.field('MomentOfBirth', LookupKey.TimeOfDay, { label: 'Time of birth'});
    ```
    We also have examples that introduce Month/Year [jivs-examples/src/MonthYearConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/MonthYearConverter.ts) and Month/Day [jivs-examples/src/AnniversaryConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/AnniversaryConverter.ts).
    ```ts
        builder.field('Expiry', 'MonthYear', { label: 'Expiration date'});
        builder.field('MarriageDate', 'Anniversary', { label: 'Marriage date'});
    ```
    Jivs also includes the "Minutes" Lookup Key and its time-of-day to total minutes converter, TimeOfDayOnlyConverter. "Seconds" Lookup Key and its time-of-day to total seconds converter, TimeOfDayHMSOnlyConverter.
    
- Perhaps you want to compare the difference in days between two dates. For that you need to convert a Date object into a number – the number of days since some fixed point. 
    
    Jivs includes the "TotalDays" Lookup Key and UTCDateOnlyConverter.

    See an example here: [jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts).
  
- Changing your own class (already setup with an Identifier) into something as simple as a string, number, or Date also requires a Converter. You will see how in the RelativeDate class example [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts) and a TimeSpan class example [jivs-examples/src/TimeSpan_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/TimeSpan_class.ts).
- Additional converters already supplied with these Lookup Keys: "Integer" (uses Math.trunc), "Uppercase", "Lowercase".
- Suppose that you have a class "FullName" with properties of FirstName and LastName. Create a converter to return a string that is both concatenated.
- Suppose that you have a class "StreetAddress" with properties of Street, City, Region, PostalCode. Create a converter to return just the postal code.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html).

### DataTypeFormatters
`DataTypeFormatters` turn a native value into a text value. Some involve localization, like `DateFormatter` will treat new Date(2000, 0, 15) as '15/01/2000' in 'en-GB' and '01/15/2000' in 'en-US'.

`DataTypeFormatters` are used in these cases:
+ Convert the native value into a text value when calling `FieldValueHost.setValue()`.
+ Reformat the text passed into `FieldValueHost.setTextValue()`.
+ Localized tokens in error messages.

#### Convert native to text value
When you call the `FieldValueHost.setValue()` function, it takes only a native value. 
If the `FieldValueHost` has a lookup key to a `DataTypeFormatter` already registered in `DataTypeFormatterServices`,
formatting will happen. If you don't want this behavior, you have to turn it off.

For more, see [Decisions around Jivs Built-in formatting](#decisions-around-jivs-built-in-formatting).

When enabled:
- The native value is formatted with the supplied formatter.
- The text value is set
- The `ValueHostsManager.onTextValueChanged` callback is triggered, allowing you to wire up your data entry field to intake the new string.
```ts
vhm.onTextValueChanged = (fieldValueHost, oldValue)=>{
    let newTextValue = fieldValueHost.getTextValue();
    // assign it to the input's value attribute
    document.getElementById(fieldValueHost.getName()).value = newTextValue;
}
```
When you want to disable it:
```ts
// on a case-by-case basis
builder.field('field1', LookupKey.Date, {
    formatterLookupKey = null
});
// for the entire ValueHostsManager
builder.disableFormattingOnValueChanged = true;
```
#### Localized tokens in error messages
Formatters provide localized strings for the tokens within error messages with implementations of `IDataTypeFormatter`. For example, if validating a date against a range, your error message may look like this: 

`"The value must be between {Minimum} and {Maximum}."`

Formatters initially use the Lookup Key from the ValueHost.dataType. So if you assigned dataType="Date", expect the short date format. 

`"The value must be between 12/31/1999 and 12/31/2005."`

To override it, such as using the abbreviated date format, include the Lookup Key within the token like this:
  
`"The value must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}."`

`"The value must be between Dec 31, 1999 and Dec 31, 2005."`

Jivs provides these formatters: "ShortDate", "AbbrevDate", "AbbrevDOWDate" (adds day of week), "LongDate", "LongDOWDate" (adds day of week), "TimeOfDay" (omits seconds), "TimeOfDayHMS", "Integer", "Currency", "Percentage" (where 1.0 = 100%), "Percentage100" (where 100 = 100%), "Uppercase", "Lowercase", "Boolean" (say "True" and "False" for boolean values) and "YesNoBoolean" (say "Yes" or "No" for boolean values).

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html).

#### Building your own
See [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts).

Also [jivs-engine/src/DataTypes/DataTypeFormatters.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeFormatters.ts).

### DataTypeParsers
Convert from the text value into the native value with implementations of `IDataTypeParser`. They can report problems with the text value, and their error can be shown in a validation error message.

Parsers are used only on `FieldValueHosts`, when calling `FieldValueHost.setTextValue()`. 
    - In the client-side in response to the onchange event of a form \<input>.
    - In the node.js server that uses Jivs to validate. See [Validation in Node.Js](#using-jivs-on-a-nodejs-server).

#### Convert text native to native value
When you call the `FieldValueHost.setTextValue()` function, it takes only a text value. 
If the `FieldValueHost` has a lookup key to a `DataTypeParser` already registered in `DataTypeParserServices`,
parsing will happen. If you don't want this behavior, you have to turn it off.

For more, see [Decisions around Jivs Built-in parsing](#decisions-around-jivs-built-in-parsing).

When enabled:
- The text value is parsed with the supplied parser.
- The native value is set either to the parsed value or undefined if the parser failed.
- The `ValueHostsManager.onValueChanged` callback is triggered.
```ts
vhm.onValueChanged = (fieldValueHost, oldValue)=>{
    let newValue = fieldValueHost.getValue();
    // use newValue
}
```
When you want to disable it:
```ts
// on a case-by-case basis
builder.field('field1', LookupKey.Date, {
    parserLookupKey = null
});
// for the entire ValueHostsManager
builder.disableParsingOnValueChange = true;
```

#### Error reporting
Jivs has been designed so that you have a parser do very limited error reporting, leaving most cases to validators. Suppose that your native value is expected to be a positive integer. Our `NumberParser` will convert the input into a number, including negatives and floating point. You add two Validators with these conditions: `PositiveCondition` and `IntegerCondition`. This lets you supply specific error messages to the user.

`NumberParser` may report "Expecting a number" if it encounters "ABC". It converts "1.0", "-2", "3,201.40" and others that have the culture's currency and percent symbols. So your native value is 1, -2, or 3201.4.
The `PositiveCondition's` error message might say "Negative numbers are not allowed."
The `IntegerCondition's` error message might say "Must be an integer."

#### String clean up 
When the native type is a string, the input value may need to be changed if it's what you intend to save. Trimming lead and trailing whitespace is almost always used on Inputs. As a result, our `CleanUpStringParser` is already registered to trim all `ValueHosts` with a data type lookup key of `LookupKey.String`.

A phone number often has culture specific formatting, but in the end, you intend to store it in a fixed format, such as +\[country code] \[all digits of the phone number without formatting]. Use a Parser to deliver this, only reporting an error when the input is severely inappropriate.

"(800)204-9000" -> "+1 8002049000"

"+44 7911 123456" -> "+44 7911123456"

"ABC" -> error message

The `CleanUpStringParser` has numerous configuration options that together may deliver the desired format. 

#### Building your own
See [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts).

Also [jivs-engine/src/DataTypes/DataTypeParserBase.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeParserBase.ts) and [/jivs-engine/src/DataTypes/DataTypeParsers.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeParsers.ts).

### DataTypeComparers
Staying with the "single responsibility pattern", Jivs recommends that you use its comparison Conditions (Range, Equal, NotEqual, LessThan, etc) for all data types. It already knows how to handle comparing strings, numbers, dates and booleans. It does so with implementations of IDataTypeComparer. It also uses the Converters to get a Date, number or string from the value. So its pretty unusual to need to provide your own Comparer class. But its here if you need it.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)

### DataTypeCheckGenerator
In Jivs, "Data Type Check" means a Condition that can determine if the data supplied is fully compatible with what the model property intended. 

Jivs provides the DataTypeCheckCondition, and it handles many cases simply by checking if the Input value (from the UI editor) was successfully converted to the native value. For example, converting a date string "31-May-2030" into a Date object. As a rule, when that conversion fails, Jivs expects you to call `ValueHost.setValueToUndefined()`. DataTypeCheckCondition reports an error only when Input value is assigned and native value is undefined.
  
DataTypeCheckCondition doesn't apply when no conversion is required. Strings are a great example of a native value that doesn't require conversion. Strings represent all kinds of data. For example, an email address or a phone number. For these cases, create a Lookup Key ("EmailAddress", "PhoneNumber") and implement a `IDataTypeCheckGenerator `that supplies a regular expression to validate the string.
  
Take a look at [this example for Email Address](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts).

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)

### Creating your own Lookup Keys
The LookupKey enumerated type doesn't cover everything.
Here are some use cases for creating your own Lookup Key:
- Enumerated types, where the user sees text but the value is stored as a number. Check out [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts) to get supporting code and see how to use it.
    + Parsing, from string to number
    + Formatting, from number to string in an error message
- String values that have a strong pattern, like a phone number.
    + Parsing, to clean up the user's input into the text that you want to store
    + Formatting, to format the text you have stored
    + Validating, using a Regular Expression. 
    + Auto generating data type check validators
- Extracting some data from the native value, like the day of week from a Date object.
    + Converting, to get the Date.day property.
- A class that you store as a single entity, like class NumberWithUnits { value: number, units: string }
    + Identifing, to recognize your class
    + Converting, to get a value you can use in comparing, such as the NumberWithUnits.value.
    + Comparing, to compare two instances of the same class
    + Formatting, to show the current value in an error message
    + Parsing, to convert user input into your class.

## Creating your own Conditions
Jivs provides many `Condition classes`, covering typical cases. All classes implement the `ICondition interface`.
```ts
interface ICondition {
    evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
    category: ConditionCategory;
    conditionType: string;
}
```
As you can see, all require that you supply a **conditionType** value. That’s a unique name for you to specify.

There are several ways to add your conditions.
### Reusable classes
All Condition classes supplied within jivs-engine are registered with the ConditionFactory, which uses the ConditionConfig (describes rules specific to the condition) to know which class to create.

Once created, go to the `registerConditions() function` that is [part of the startup code](#jivsservices) and add it like this:
```ts
export function registerConditions(cf: ConditionFactory): void
{
    ... existing conditions...
    cf.register<myConditionConfig>(
        'MyConditionType', (config) => new MyCondition(config));
}

```
You can also extend the Builder API to support it.

Here are two ways to start:
- Subclass from an existing `Condition class`. Choose when you want to make a minor modification or want to preconfigure [the existing class](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/Conditions/ConcreteConditions.ts).
    ```ts
    export class MyCondition extends RegExpCondition 
    {
        constructor(config: IRegExpConditionConfig)
        {
        super({ 
            ...config, 
            ...{ expressionAsString: '^\\d\\d\\d\\-\\d\\d\\d\\d$'} 
        });
        }
        public get conditionType(): string { return 'MyConditionType'; }
    }
    ```
    See this sample code for more: [jivs-examples/src/EmailAddressDataType.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts).

- Subclass from an [abstract `Condition class`](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Conditions) designed for the type of `Condition` you need. The abstract classes provide some useful methods to take advantage of. They also require a `ConditionConfig interface`, which means you can get additional values from the user passed in.
    ```ts
    export interface MyConditionConfig extends RegExConditionBaseConfig
    {
        allowTwo?: boolean; // true means pattern is repeated with a comma separator
    }
    
    export class MyCondition extends RegExpConditionBase<MyConditionConfig>
    {
        protected getRegExp(valueHostResolver: IValueHostResolver): RegExp
        {
            const base = @'\d\d\d\-\d\d\d\d';
            if (this.config.allowTwo)
                return new RegExp('^' + base + '(\,\s?' + base + ')?$');
            return new RegExp('^' + base + '$');
        }
        public get conditionType(): string { return 'MyConditionType'; }
    }
    ```
See this sample code for more: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EvenNumberCondition.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EvenNumberCondition.ts).

### One-off conditions
Choose one of the methodologies below. Then attach it using the Builder API with the customRule() function:

```ts
builder.field('fieldname')
    .customRule(
        (requester)=> ...create your object here..., 
        'optional error message', 
        { ...optional additional parameters });
```
- Create a plain JavaScript object that matches the `ICondition interface` contract. This is often used for one-off logic.
    ```ts
    let myCondition = <ICondition>{
        evaluate: (valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> =>
        {
        // evaluate the value(s) and return a ConditionEvaluateResult
        },
        category: 'Content';
        conditionType: 'MyConditionType';
    }
    ```
- Implement directly from `ICondition` as a class
    ```ts
    export class MyCondition implements ICondition 
    {
        public evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>
        {
        // evaluate the value(s) and return a ConditionEvaluateResult
        },
        public get category(): string { return 'Content'; }
        public get conditionType(): string { return 'MyConditionType'; }
    }
    ```	

### Additional considerations
- Look here for source code to the concrete conditions we’ve supplied:
[jivs-engine/src/Conditions/ConcreteConditions.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/Conditions/ConcreteConditions.ts)
- Look here for source code to abstract conditions and the factory:
[jivs-engine/src/Conditions](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Conditions)
- Return `Undetermined` when unsupported data is found. For example, if you are evaluating only against a string, test `typeof value === 'string'` and return `Undetermined` when false.
- Always write unit tests.
- `conditionType` should be meaningful. Try to limit it to characters that work within JSON and code, such as letters, digits, underscore, space, and dash. Also try to keep it short and memorable as users will select your Condition by specifying its value in the Configs passed into the `ValueHostsManager`.
- `conditionType` values are case sensitive.
- You may be building replacements for the Condition classes supplied in Jivs especially if you prefer a third party's validation schema code. In that case, implement the `IConditionFactory interface` to expose your replacements. Always attach your factory to the `JivsServices class` in the `createJivsServices function`.

### Adding your new Condition class to the Builder API
See this example: [jivs-examples/src/EvenNumberCondition.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EvenNumberCondition.ts)

## Localization
Any text displayed to the user and any input supplied from them is subject to localization. Jivs is localization-ready with several tools. There are third party tools that may do the job more to your liking, and they can be swapped in by implementing the correct interfaces.

### Localizing strings: TextLocalizerService
Here are a few places you provide user-facing strings into Jivs:
- ValueHostConfig.label for {Label} and {SecondLabel} tokens
- ValidatorConfig.errorMessage and summaryMessage
- ValueHostConfig.dataType for {DataType} token

Each of those properties have a companion that ends in "l10n" (industry term for localization), such as labell10n. Use the l10n properties to supply a Localization Key that will be sent to Jivs `TextLocalizerService`. If that service has the appropriate data, it will be used instead of the usual property.

`TextLocalizerService` is available on `ValueHostsManager.services.textLocalizerService`. Add localization content within the `createTextLocalizerService() function` [that was added here](#jivsservices).

To replace it with a third party text localization tool, implement `ITextLocalizerService` and assign it in the `createTextLocalizerService() function`.

#### Setup for ValueHostConfig.label
Let's suppose that you have a label "First Name" which you want in several languages.
1. Create a unique Localization Key for it. We'll use "FirstName".
2. Assign both label and labell10n properties during configuration, shown here using the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class):
    ```ts
    builder.field('FirstName', null, { label: 'First Name', 'labell10n': 'FirstName' });
    ```
3. Add an entry to the `createTextLocalizerService() function` like this:
    ```ts
    export function createTextLocalizerService(): ITextLocalizerService
    {
        let service = new TextLocalizerService();
        ...
        service.register('labell10n', {
            '*': 'First Name', // fallback
            'en': 'First Name',
            'es': 'nombre de pila',
            'fr': 'prénom'
        });
    }
    ```

#### Setup for ValidatorConfig.errorMessage and summaryMessage properties
Jivs generates specific Localization Keys based on the ConditionType.
For error message, "EM-*ConditionType*-*DataTypeLookupKey*" and a fallback "EM-*ConditionType*". Example using RangeCondition for an Integer Lookup Key: "EM-Range-Integer" and "EM-Range".
For summary message, "SEM-*ConditionType*-*DataTypeLookupKey*" and a fallback "SEM-*ConditionType*".

When using the supplied TextLocalizerService, you won't need to know those Lookup Keys. Instead, you can call its `registerErrorMessage()` and `registerSummaryMessage()`.

The existing `createTextLocalizerService() function` already has numerous examples. For example:
```ts
service.registerErrorMessage(ConditionType.RequireText, null, {
    '*': 'Requires a value.'
});
service.registerSummaryMessage(ConditionType.RequireText, null, {
    '*': '{Label} requires a value.'
});    
service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
    '*': 'Invalid value. Enter a date.',
    'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
    'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
});
service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
    '*': '{Label} has an invalid value. Enter a date.',
    'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
    'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
});        
```
So review and edit the `createTextLocalizerService() function`.
#### Setup for ValueHostConfig.dataType
The {DataType} token is useful in making the error message for a Data Type Check validator cover multiple data types. Instead of "Enter a date." and "Enter a number.", one error message can say "Enter a {DataType}.".
1. Assign the dataType property during configuration shown here using the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class):
    ```ts
    builder.field('Age', LookupKey.Integer);
    ```
2. Add an entry to the `createTextLocalizerService() function` like this:
    ```ts
    export function createTextLocalizerService(): ITextLocalizerService
    {
        let service = new TextLocalizerService();
        ...
        service.registerDataTypeLabel(LookupKey.Integer, {
            '*': 'an integer number', // fallback
            'en': 'an integer number',
            'es': 'un número entero',
            'fr': 'un nombre entier'
        });
    }
    ```
### Localizing error message "value" tokens
Error messages use tokens to insert values at runtime. {Value}, {SecondValue}, {Minimum}, {Maximum}, and {CompareTo} are all examples.

`Enter a value between {Minimum} and {Maximum}.`

When the value is a number, date or boolean, those must be localized. Jivs already does this within its [DataTypeFormatter classes](#datatypeformatters).

The supplied classes use [JavaScript's own Intl class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) to handle dates, times, and numbers. It uses [toLocaleLowerCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleLowerCase) and [toLocaleUpperCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase) for those situations. These classes are adequate but you may prefer using a richer third party library.

To switch, you need to replace the specific DataTypeFormatter classes that are not ideal and register your replacements using the original Lookup Key. See the existing DataTypeFormatter classes [here](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/DataTypes/DataTypeFormatters.ts).

For example, LongDateFormatter uses Intl to format with full month name. It's Lookup Key is "LongDate". Here is a framework to replace it.
```ts
export class MyLongDateFormatter extends DataTypeFormatterBase
{
    protected get expectedLookupKeys(): string | Array<string>
    {
        return LookupKey.LongDate;
    }
    protected supportsCulture(cultureId: string): boolean
    {
        return true; // only return false if you know the culture does not apply
    }
    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
        if (value instanceof Date)
        {
        // do the work
            let formatted: string = ... code to handle the localized formatted date...
        return { value: formatted };
        }
        return { errorMessage: 'Not a date' };
    }	
}
```
Then register it within registerDataTypeFormatters() where you added the [`createJivsServices() function`](#jivsservices), replacing the existing "LongDateFormatter" Lookup Key.
```ts
export function registerDataTypeFormatters(dtfs: DataTypeFormatterService): void
{
...
    dtfs.register(new MyLongDateFormatter()); 
...
}    
```

### Selecting the culture
There are two places you can select a culture. Each takes a cultureId like 'en' or 'fr-FR'.
- Globally, when creating the `JivsService` object, passing the cultureId into its constructor. Usually you will work with the `createJivsServices()` function and it takes a cultureId: 
    ```ts
    let services = createJivsServices('fr-FR');
    ```
- Each `ValueHostsManager` starts from that global setting, and allows you to change the default. Be sure to have registered all cultures you intend to use within `createJivsServices()`.
    ```ts
    // prior to creating the ValueHostsManager
    builder.behaviors.activeCultureId = 'en';
    // once the ValueHostsManager exists, change it at will
    vhm.behaviors.activeCultureId = 'de';
    ```    

## Validation Deep Dive
### What invokes validation
Both the ValueHostsManager and validatable ValueHosts have a `validate()` function, as described in the next two sections.
#### ValueHost.validate()
When a ValueHosts' value changed, call its `validate()` function or pass the `{ validate: true }` option into the `setValue()` (and related) function.

```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=> {
    let textValue = evt.target.value;
    let nativeValue = YourConvertToNativeCode(textValue);  // return undefined if cannot convert
    let valueHost = vhm.vh.field('FirstName');	// or vhm.getTextValueHost('FirstName')
    valueHost.setValues(nativeValue, textValue);
    valueHost.validate();
});	
firstNameFld.attachEventListener('oninput', (evt)=> {
    let valueHost = vhm.vh.field('FirstName');	// or vhm.getTextValueHost('FirstName')
    valueHost.setTextValue(evt.target.value);
    valueHost.validate({ duringEdit: true });
});
```
`validate()` takes an optional parameter called options which is this type:
```ts
interface ValidateOptions {
    group?: string;
    preliminary?: boolean;
    duringEdit?: boolean;
    skipCallback?: boolean;
}
```
These properties are all related to ValueHost value changes:
- `duringEdit` - Set to true when handling oninput events, or any other validation that needs to happen as the user types. Only a few validators will respond, including RequireTextCondition, RegExpCondition, and StringLengthCondition.
- `skipCallback` - Set to true if you have a reason to skip the `onValueHostValidationStateChanged callback` normally invoked by `validate()`.

The `setValue()`, `setValues()`, `setTextValue()`, and `setValueToUndefined()` functions all take an *options* parameter to include validation, saving a step:

```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=> {
    let textValue = evt.target.value;
    let nativeValue = YourConvertToNativeCode(textValue);  // return undefined if cannot convert
    vhm.vh.field('FirstName').setValues(nativeValue, textValue, { validate: true });
});	
firstNameFld.attachEventListener('oninput', (evt)=> {
    vhm.vh.field('FirstName').setTextValue(evt.target.value, { validate: true, duringEdit: true });
});
```
Here is the type for the *options* parameter:
```ts
interface SetValueOptions {
    validate?: boolean;
    duringEdit?: boolean;
    reset?: boolean;
    skipValueChangedCallback?: boolean;
    overrideDisabled?: boolean;
// FieldValueHosts add the following:
    injectedError?: InjectedError;
    disableParser?: boolean;
    disableFormatter?: boolean;
}
```
These properties are all related to validation:
- `validate` - When true, invoke validation but only if the value changed. It defaults to true.
- `reset` - When true, change the state of the ValueHost to unchanged and validation has not been attempted. It defaults to false.
- `injectedError` - When you handle parsing, your parser may report an error that you want to display.
  Use this option to pass along the error. Jivs will display it. See [Injecting errors on demand](#injecting-errors-on-demand).

#### ValueHostsManager.validate()
Prior to submitting or any time you want to validate the entire form, use `validate()` on `ValueHostsManager`.
```ts
let status = vhm.validate(); // it will notify elements in your UI of validation changes
if (status.doNotSave)
    // Prevent saving. User has to fix things
else
    // Submit the page's data
```
`validate()` takes an optional parameter called options which is this type:
```ts
interface ValidateOptions {
    group?: string;
    preliminary?: boolean;
    duringEdit?: boolean;
    skipCallback?: boolean;
}
```
These properties are all related to `ValueHostsManager` validation:
- `group` - Group validation is a tool to group validatable `ValueHosts` with a specific submit command when validating. If used, it needs a name assigned here and on `ValueHosts` that it targets. See their `ValueHostConfig.group` property. The name matching is case insensitive.

  Use when there is more than one group of validatable `ValueHosts` to be validated together.
  
  For example, the `ValueHostsManager` handles two forms at once. Give the `ValueHostConfig.group` a name for each form. Then make their submit command
  pass in the same group name.
  
- `preliminary` - Set to true when running a validation prior to a submit activity.
Typically used just after loading the form to report any errors already present.
When set, the RequireTextCondition is not checked as the user doesn't need
the noise complaining about missing input when they haven't had a chance to address it.
- `skipCallback` - Set to true if you have a reason to skip the `onValidationStateChanged callback` normally invoked by `validate()`.

### Current validation state on valuehost
Your user interface depends on knowing the state of validation. Has validation reported an error or not? Each validatable `ValueHost` has is own state that is found amongst several of its properties and functions.
- `isValid`
- `doNotSave`
- `status`
- `getIssuesFound()`
- `asyncProcessing`

*See the details of ValueHostValidationState below for more on these.*

However, its usually better to setup the `onValueHostValidationStateChanged callback` (on `ValueHostsManagerConfig`) and let it pass you this informative object:
```ts
interface ValueHostValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
    status: ValidationStatus;
}
```
Here is an example of using `onValueHostValidationStateChanged callback`.
```ts
let services = createJivsServices('en-US');
let rules = new PersonModelRules();// subclass of ValueHostRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
let vhm = new ValueHostsManager(config);

// Direct validation changes to the HTML elements
// of a specific field, so they can update their appearance
function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
    let fldId = valueHost.getName();
    let editor = document.getElementById(fldId);
    let errorHost = document.querySelector('.errorHost[data-for=' + fldId + ']');
    if (validationState.isValid)
    {
        editor.classList.remove('invalid');
        errorHost.classList.remove('invalid');      
    }
    else
    {
        editor.classList.add('invalid');
        errorHost.classList.add('invalid');      
    }
    // remove the current contents then if there are errors to shown, add them
    errorHost.innerHtml = '';
    if (validationState.issuesFound)
    {
        let ul = document.createElement('ul');
        for (let i = 0; i < validationState.issuesFound.length; i++)
        {
        let li = document.createElement('li');
        li.textContent = validationState.issuesFound[i].errorMessage;
        ul.append(li);
        }
        errorHost.append(ul);
    }
}
```
Let's go through `ValueHostValidationState` properties:
- `status` - Each ValueHost has status codes related to validation. Several reflect the state before validation is even attempted.
    + `NotAttempted` - So far, the value has not been changed and validation has not occurred.
    + `NeedsValidation` - The value has been changed and needs validation.
    + `Undetermined` - Validation occurred but the Condition could not make a determination of Match or NoMatch. 
    
        > Neither `isValid` nor `doNotSave` deal with a status of Undetermined. Undetermined indicates that the validators are incorrectly setup, such as you have a validator that expects a date, but are supplying a number. So this status should be addressed while in development.
    + `Invalid` - Validation occurred and the Condition reported NoMatch. Thus the value is invalid.
    + `Valid` - Validation occurred and the Condition reported Match. Thus the value is valid.
- `isValid` - When true, the data appears to be valid. However, `isValid` is only false when there was an explicit `status` of *Invalid*. Statuses like *Undetermined* and *NotAttempted* are true as far as `isValid` is concerned. As a result, it's better to check `doNotSave` to know if you can submit the data.
- `doNotSave` - Determines if a validator doesn't consider the ValueHost's value ready to save. It is true when `status` is *Invalid* or *NeedsValidation*. It is also true when `asyncProcessing` is true.
- `issuesFound` - An array of all issues found or null when there are no issues found. See below for more on the `IssueFound type`.
- `asyncProcessing` - When evaluating an asynchronous Condition, validation will return before it is done, with the results from the rest of the Conditions. `asyncProcessing` is true at this moment, and until all asynchronous Conditions are finished. Expect `onValueHostValidationStateChange callbacks` after the validation runs, and after each async Condition finishes, giving you the latest validation state.

Here is the `IssueFound type`, which is supplied in the issuesFound array above:
```ts
interface IssueFound {
    valueHostName: string;
    errorCode: string;
    severity: ValidationSeverity;
    errorMessage: string;
    summaryMessage?: string;
}
```
Going through its properties:
- `valueHostName` - The name of the ValueHost supplying this IssueFound.
- `errorCode` - The error code from the Validator supplying this IssueFound. Error codes default to the ConditionType value used to select the Condition, but can be supplied as you configure the Validator in ValidatorConfig.errorCode.
- `severity` - The severity: Severe, Error, or Warning. When Warning, the value is considered valid, but you wanted to show the user some message anyway.
- `errorMessage` - The error message, fully localized and prepared to display.
- `summaryMessage` - The error message that targets the ValidationSummary. 

### Current validation state on ValueHostsManager
The `ValueHostsManager` has similar functions to those on validatable `ValueHosts`, only it is a consolidated represention from the `ValueHosts`. The validation state is used prior to submitting the data and by the ValidationSummary as the state changes.

`ValueHostsManager's` validation state is found amongst several of its properties and functions.
- `isValid`
- `doNotSave`
- `asyncProcessing`
- `getIssuesFound()`

*See the details of ValidationState below for more on these.*

When you need notifications as it changes, its setup the `onValidationStateChanged callback` (on `ValueHostsManagerConfig`) and let it pass you this informative object:
```ts
interface ValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
}
```
Here is an example of using `onValidationStateChanged callback`.
```ts
let services = createJivsServices('en-US');
let rules = new PersonModelRules();// subclass of ValueHostRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
builder.onValidationStateChanged = formValidated;
let vhm = new ValueHostsManager(config);

function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
    ... shown earlier ...
}
function formValidated(valueHostsManager: IValueHostsManager, validationState: ValidationState): void
{
    let valSummary = document.querySelector('.validationsummary');
    if (validationState.isValid)
    {
        valSummary.classList.remove('invalid');      
    }
    else
    {
        valSummary.classList.add('invalid');      
    }
    // remove the current contents then if there are errors to shown, add them
    valSummary.innerHtml = '';
    if (validationState.issuesFound)
    {
        let ul = document.createElement('ul');
        for (let i = 0; i < validationState.issuesFound.length; i++)
        {
            let li = document.createElement('li');
            li.textContent = validationState.issuesFound[i].errorMessage;
            ul.append(li);
        }
        valSummary.append(ul);
    }
}
```

Let's go through `ValidationState` properties:
- `isValid` - When true, the value appears to be valid. However, it's only false when there was an explicit `status` of *Invalid* within at least one ValueHost. It's better to check `doNotSave` to know if you can submit the data.
- `doNotSave` - Determines if any `ValueHost` doesn't consider its value ready to save. It is true when the `ValueHost` validation `status` is *Invalid* or *NeedsValidation*. It is also true when `asyncProcessing` is true.
- `issuesFound` - An array of all issues found or null when there are no issues found. See the previous section for details on the IssueFound type that populates this array.
- `asyncProcessing` - When evaluating an asynchronous Condition, validation will return before it is done, with the results from the rest of the Conditions. `asyncProcessing` is true at this moment, and until all asynchronous Conditions are finished. Expect `onValueHostValidationStateChange callbacks` after the validation runs, and after each async Condition finishes, giving you the latest validation state.

### Actions that change the validation state
All of these actions can change the validation state whether on `ValueHostsManager` or a `ValueHost`. However, you will only be notified through `onValidationStateChanged` and `onValueHostValidationStateChanged` if the state actually changed.
- `validate()`
- `clearValidation()`
- `addExternalIssuesFound()` and `addExternalIssueFound()`
- `clearExternalIssuesFound()`
- using any of these with the { validate: true} option as a parameter: `setValue()`, `setValues()`, `setTextValue()`, `setValueToUndefined()`.
- An asynchronous Condition just finished

## Logging
Like a typical service, Jivs has the ability to log what happens while it executes. It has a built-in logger class that writes to the console object.

The logger is configured within the `JivsServices object`, as it is a service.
1. It is setup in the [`createJivsServices() function`](#configuring-jivsservices).
    ```ts
    // --- Logger Service -----------------------------------    
    // If you want both the ConsoleLoggerService and another, create the other
    // and pass it as the second parameter of ConsoleLoggerService.
    vs.loggerService = new ConsoleLoggerService(LoggingLevel.Error);
    ```
2. You can modify it as needed just by getting the services object and using its `loggerService property`.

    ```ts
    services.loggerService.minLevel = LoggingLevel.Debug;
    ```
There are several actions you might want to take when using logging described in upcoming sections.
- Set the minimum logging level
- Varying the minLevel based on what is being logged
- Change to another `LoggerService` object
 
### Set the minimum logging level
Jivs has logging levels of Debug, Info, Warn, and Error. The logging object has a `minLevel property` which defaults to Error, which means omit the rest. You can set and change the minLevel as shown above.

The `LoggingLevel` enum:
```ts
export enum LoggingLevel
{
    Debug = 0,
    Info = 2,
    Warn = 3,
    Error = 4
}
```
#### Logging content example using Debug level
This jest unit test shows the logging for just calling ValueHost.setValues("", "", {validate:true}) with Debug level. 
```ts
test('setValue with validate=true, onValueHostValidationStateChanged called', () => {
    let onValidateResult: ValueHostValidationState | null = null;
    let config: ValueHostsManagerConfig = {
        services: createJivsServices(),
        valueHostConfigs: [],
        onValueHostValidationStateChanged: (vh, vr) => {
            onValidateResult = vr;
        }        
    };
    config.services.loggingService = new ConsoleLoggingService(LoggingLevel.Debug);
    let builder = new ValueHostsManagerConfigBuilder(config);    
    let builder = createBuilder({
        onValueHostValidationStateChanged: (vh, vr) => {
            onValidateResult = vr;
        }
    });
    builder.field('Field1').requireText('error');
    let vhm = new ValueHostsManager(builder);
    let vh = vhm.vh.field('Field1');
    vh.setValues('', '', { validate: true });   // empty is invalid

    expect(onValidateResult).toEqual(<ValueHostValidationState>{
        isValid: false,
        issuesFound: [{
            errorCode: ConditionType.RequireText,
            valueHostName: 'Field1',
            severity: ValidationSeverity.Severe,
            errorMessage: 'error',
            summaryMessage: 'error'
        } ],
        doNotSave: true,
        asyncProcessing: false,
        status: ValidationStatus.Invalid,
        corrected: false
    });
});        
```
You are looking at the output in VSCode's Terminal. Jivs has called the console class's functions with the logged object. Each entry starts with the console's function, which in this case is either debug or log  (which is used for Info level). If there were warnings, you would see them as console.warn and errors as console.error.
```text
console.debug
  {
  message: 'addValueHost(Field1)',
  feature: 'Manager',
  type: 'ValueHostsManager'
  }
console.debug
  {
  message: 'setValues("", "")',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.debug
  {
  message: 'Validating ValueHost "Field1"',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.debug
  {
  message: 'Starting Validation for errorcode "RequireText"',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'Condition RequireText evaluated as NoMatch',
  category: 'Result',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'Validation errorcode "RequireText" found this issue: {"valueHostName":"Field1","errorCode":"RequireText","severity":2,"errorMessage":"error","summaryMessage":"error"}',
  category: 'Result',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'onValueHostValidationStateChanged',
  feature: 'Manager',
  type: 'ValueHostsManager'
  }
console.log
  {
  message: 'onValueHostValidationStateChanged',
  feature: 'Manager',
  type: 'ValueHostsManager'
  }
console.log
  {
  message: 'Validation result: Invalid Issues found:[{"valueHostName":"Field1","errorCode":"RequireText","severity":2,"errorMessage":"error","summaryMessage":"error"}]',
  category: 'Result',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.debug
  {
  message: 'notifyOtherValueHostsOfValueChange on Field1',
  feature: 'Manager',
  type: 'ValueHostsManager'
  }
```

### Varying the minLevel based on what is being logged
If you want to use the Debug or Info levels, expect to get a lot of content (example below). Often you are trying to diagnose a problem through the logs. Jivs lets you selectively log everything that meets a specific criteria, even though its below the minLevel.

> If you use a custom logger, it must have been subclassed from LoggerServiceBase to get this feature.

> If possible, use this technique in tests, not in your regular code, because while active, a logger's "lazy" execution feature is disabled and that impacts performance.

1. Set the initial minLevel to Debug.
2. Run your code.
3. Review the log to identify characteristics you want to keep.
4. Create one or more `OverrideMinLevelWhenRule objects` with those characteristics. [Documentation](http://jivs.peterblum.com/typedoc/interfaces/Services_AbstractClasses_LoggerServiceBase.OverrideMinLevelWhenRule.html)
5. Call the `LoggerService.overrideMinLevelWhen function` with each. [Documentation](http://jivs.peterblum.com/typedoc/classes/Services_AbstractClasses_LoggerServiceBase.LoggerServiceBase.html#overrideMinLevelWhen)
6. Restore the minLevel to your normal setting.

#### Logging content example with overrideMinLevelWhen
This is the same as the previous example, except the default log level is Error. If you look through the other example, there are no entries for 'error', so this would generate no console output.

I want to only log calls with these values lifted from the earlier log.
```ts
feature: 'ValueHost',
identity: 'Field1'
```
Or
```ts
category: 'Result'
```

This jest unit test shows the logging for just calling ValueHost.setValues("", "", {validate:true}) with Debug level. 
```ts
...
    let logger = new ConsoleLoggingService(LoggingLevel.Error);	// was Debug
    config.services.loggingService = logger;
    logger.overrideMinLevelWhen({
        feature: 'ValueHost',
        identity: 'Field1'
    });
    logger.overrideMinLevelWhen({
        category: LoggingCategory.Result,
    });
... 
```
Again, you are looking at the output in VSCode's Terminal. Compare the output to the earlier example:
```text
console.debug
  {
  message: 'setValues("", "")',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.debug
  {
  message: 'Validating ValueHost "Field1"',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.log
  {
  message: 'Condition RequireText evaluated as NoMatch',
  category: 'Result',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'Validation errorcode "RequireText" found this issue: {"valueHostName":"Field1","errorCode":"RequireText","severity":2,"errorMessage":"error","summaryMessage":"error"}',
  category: 'Result',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'Validation result: Invalid Issues found:[{"valueHostName":"Field1","errorCode":"RequireText","severity":2,"errorMessage":"error","summaryMessage":"error"}]',
  category: 'Result',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }

```
### Change to another LoggerService object
You can replace the `ConsoleLoggerService` with your preferred logging library, either by implementing the `ILoggerService` interface or subclassing from the feature-rich `LoggerServiceBase`.

- [ILoggerService documentation](http://jivs.peterblum.com/typedoc/interfaces/Services_Types_ILoggerService.ILoggerService.html)
- [LoggerServiceBase documentation](http://jivs.peterblum.com/typedoc/classes/Services_AbstractClasses_LoggerServiceBase.LoggerServiceBase.html)

You can also chain loggers, so several can receive the log content. Do that in its constructor:
```ts
let chainedLogger = new ConsoleLoggerService(LoggingLevel.Error)
vs.loggerService = new MyLoggerService(LoggingLevel.Error, chainedLogger);
```
> Note that a chained logger will act as if it has LoggingLevel.Debug, knowing that the top-level logging service will only call it if its own minLevel is met.

## Testing your work
Because it is a service separated from your UI code, Jivs is easier to test that your validation is working correctly. Jivs also has its own services contained in the `JivsServices object`, where you might replace one of its services with a mock, as its services all start as interfaces.

There are two possible places to test:
1. Against the fully configured `ValueHostsManager object`, which is what your app will use. Use your testing framework.
2. Against just the configuration that will be used by the ValueHostsManager. Use [Jivs-ConfigAnalysis service](#testing-the-configuration-jivs-configanalysis) to catch configuration errors and get a report that details how Dependency Injection should resolve objects. 

You can use any testing framework you like. Jivs itself uses [Jest](https://www.npmjs.com/package/jest). So examples here will use Jest as well.

### Test validation requests
The basic test will generally do this:
1. Create the `JivsServices object`, which may be identical to what you use in your app.
2. Create a `ValueHostRulesBase` subclass that describes a model for your test.
3. Create the `ValueHostsManager` from the result of the subclass's `configure()` method.
4. Set the values that will impact a validation test.
5. Invoke either form-wide or `ValueHost` specific validation, and capture the results.
6. Evaluate the results against expectations.

We recommend that steps 1 - 3 are encapsulated into a function. In these test examples, we'll have this function available to deliver a fully-built `ValueHostsManager`:
```ts

class DateRangeFormRules extends ValueHostRulesBase {
    protected override configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions): void 
    {
        // create the start date ValueHost and its validators
        builder.field('StartDate', LookupKey.Date, { label: 'Start date' })
        .lessThan('EndDate', null, { label: 'End date' }, { severity: ValidationSeverity.Severe });

        // create the end date ValueHost
        builder.field('EndDate', LookupKey.Date, { label: 'End date' });
    }
}
function createValueHostsManager(): ValueHostsManager
{
    let services = createJivsServices('culture identifier');
    let rules = new DateRangeFormRules(services);
    return new ValueHostsManager(rules);
}
```
#### Form-wide using ValueHostsManager.validate()
```ts
test('Start and End date are supplied empty strings and report isValid=false', ()=>
{
    // Arrange
    let vhm = createValueHostsManager();
    
    vhm.field('StartDate').setValues('', '');	// we'll test the require validator. Empty strings will be invalid
    vhm.field('EndDate').setValues('', '');
    
    // Act
    let validationState = vhm.validate();
    
    // Assert
    expect(validationState.isValid).toBe(false);
    expect(validationState.doNotSave).toBe(true);
    expect(validationState.asyncProcessing).toBe(false);	// only needed if this form has async conditions.
    expect(validationState.issuesFound).toHaveLength(2);
    
    let startDateResult = validationState.issuesFound[0];
    expect(startDateResult.valueHostName).toBe('StartDate');
    expect(startDateResult.errorCode).toBe(ConditionType.RequireText);
    expect(startDateResult.severity).toBe(ValidationSeverity.Severe);	// typical of required
    expect(startDateResult.errorMessage).toBe('the expected error message'); // or .toContain('part of error message')
    expect(startDateResult.summaryMessage).toBe('the expected summary message');
    
    let endDateResult = validationState.issuesFound[1];
    expect(endDateResult.valueHostName).toBe('EndDate');
    expect(endDateResult.errorCode).toBe(ConditionType.RequireText);
    expect(endDateResult.severity).toBe(ValidationSeverity.Severe);
    expect(endDateResult.errorMessage).toBe('the expected error message');
    expect(startDateResult.summaryMessage).toBe('the expected summary message');
});
```
The result of `ValueHostsManager.validate()` is a [ValidationState object](http://jivs.peterblum.com/typedoc/interfaces/Validation_Types.ValidationState.html) which looks like this:
```ts
interface ValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
}
```
Each [IssueFound object](http://jivs.peterblum.com/typedoc/interfaces/Validation_Types.IssueFound.html) is from a specific validator that was not valid. (There may be several for a single `ValueHost`).
```ts
interface IssueFound {
    valueHostName?: string;
    errorCode?: string;
    severity?: ValidationSeverity;
    errorMessage: string;
    summaryMessage?: string;
    doNotSave?: boolean;
}
```
#### Individual ValueHosts using valueHost.validate()
If we want, we can test individual `ValueHosts` for more focused tests. The `ValueHost.validate() function` returns either [ValueHostValidationResult](http://jivs.peterblum.com/typedoc/interfaces/Validation_Types.ValueHostValidateResult.html) or null for no issue.
```ts
interface ValueHostValidateResult {
    status: ValidationStatus;
    issuesFound: null | IssueFound[];
    corrected?: boolean;
    pending?: null | Promise<ValidatorValidateResult>[];
}
```
It too has an `IssueFound object` for each validator. 

Let's redo the previous test to check the StartDate `ValueHost`.
```ts
test('StartDate is supplied empty strings and report status=Invalid', ()=>
{
    // Arrange  
    let vhm = createValueHostsManager();
    
    // even though we are only testing StartDate, it has validators
    // that need data from EndDate. So set both up.
    vhm.field('StartDate').setValues('', '');	
    vhm.field('EndDate').setValues('', '');
    
    // Act
    let validationResult = vhm.field('StartDate').validate();
    
    // Assert
    expect(validationResult.status).toBe(ValidationStatus.Invalid);
    expect(validationResult.doNotSave).toBe(true);
    expect(validationResult.asyncProcessing).toBeNull();	// only needed if this input has async conditions.
    expect(validationResult.issuesFound).toHaveLength(1);
    
    let requiredResult = validationResult.issuesFound[0];
    expect(requiredResult.valueHostName).toBe('StartDate');
    expect(requiredResult.errorCode).toBe(ConditionType.RequireText);
    expect(requiredResult.severity).toBe(ValidationSeverity.Severe);	// typical of required
    expect(requiredResult.errorMessage).toBe('the expected error message'); // or .toContain('part of error message')
    expect(requiredResult.summaryMessage).toBe('the expected summary message');
});
```
### Testing the configuration: Jivs-ConfigAnalysis
**Jivs-ConfigAnalysis** is a tool to ensure that your configuration is as expected,
even before you create a `ValueHostsManager` from it.

ConfigAnalysis does the following:
- Validates the properties throughout your `ValueHostConfig objects`, including:
  - Requested Lookup Keys have an associated class registered with the factories, taking cultures into account. (Lookup Keys are used to identify data types, parsers, formatters, converters, and more.)
	> When using dependency injection, it is not immediately apparent if the object
	that you want is the one you get, especially because Jivs provides fallbacks for cultures and Lookup Keys.
  - Requested Condition Types are registered in the ConditionFactory.
  - Issues with tokens within error messages.
  - Required properties have values.
  
- Identifies each Lookup Key in use, along with the services that are needed by your `ValueHostConfigs`.
- For properties that support localization, it shows all cultural localizations of the text registered with the `TextLocalizerService`.
  > Localization has fallbacks. You may have a rule that lets all text fallback to your default language.

`Jivs-ConfigAnalysis` is a separate library, available within npm.

Go to [Jivs-ConfigAnalysis documentation](../docs/Testing_Configurations.md).

Go to [Jivs-ConfigAnalysis npm page](https://www.npmjs.com/package/@plblum/jivs-configanalysis).