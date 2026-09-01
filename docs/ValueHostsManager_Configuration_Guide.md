# ValueHostsManager Configuration Guide
The `ValueHostsManager` is the central object you use with a form or model. It contains the list of fields (called `ValueHosts`), their rules, callback hooks, and more.
 Use it to get and set values, validate, retrieve validation results, and report additional errors determined by your business logic.

The `ValueHostsManager` requires a configuration that reflects all of those, which it gets through a `ValueHostsManagerConfig` object tree. 
`ValueHostsManagerConfig` is rather complex, due to describing everything a model or form needs for validation.

<details>
<summary>Take a look</summary>

```ts
let vmConfig = <ValueHostsManagerConfig>{
  services: createJivsServices('en-US'),
  valueHostConfigs: [
    {
        valueHostType: ValueHostType.Field,
        name: 'FirstName',
        dataType: LookupKey.String,
        label: 'First name',
        validatorConfigs: [
            {
                conditionConfig: { conditionType: ConditionType.RequireText },
                errorMessage: 'Requires a value'
            },
            {
                conditionConfig: { conditionType: ConditionType.StringLength },
                maximum: 50,
                errorMessage: 'No more than {maximum} characters'
            }            
        ]
    },
    {
        valueHostType: ValueHostType.Field,
        name: 'LastName',
        dataType: LookupKey.String,
        label: 'Last name',
        validatorConfigs: [
            {
                conditionConfig: { conditionType: ConditionType.RequireText },
                errorMessage: 'Requires a value'
            },
            {
                conditionConfig: { conditionType: ConditionType.StringLength },
                maximum: 50,
                errorMessage: 'No more than {maximum} characters'
            }
        ]
    }    
    ]
};

let vhm = new ValueHostsManager(vmConfig);
```

</details>

Instead, you derive a class from [`ValueHostRulesBase`](Jivs_API.md#valuehost-rules). 
```ts
class PersonModelRules extends ValueHostRulesBase {
    protected override configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions
    ): void {
        builder.field('FirstName', LookupKey.String)
            .requireText()
            .stringLength(50);

        builder.field('LastName', LookupKey.String)
            .requireText()
            .stringLength(50);
    }
}
```

Then do this to create the ValueHostsManager.

```ts
const services = createJivsServices('en-US'); // see "Installing Jivs"
const rules = new PersonModelRules(services); // documented below
const config = rules.configure();
// attach any callback hooks to config at this point
const vhm = new ValueHostsManager(config);   // 'vhm' will be used to handle validation
```

## ValueHostRulesBase: Defining rules to configure a ValueHost

### Starting with a model from Business Logic
Suppose your app edits this model:

```ts
class Person {
    firstName?: string;
    lastName?: string;
    birthDate?: Date | null;
    prefix?: string;
    suffix?: string;
}
```

Create a [`ValueHostRulesBase`](Jivs_API.md#valuehost-rules) subclass to define the validation rules for that model:

```ts
class PersonModelRules extends ValueHostRulesBase {
    protected override configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions
    ): void {
        builder.field('FirstName', LookupKey.String)
            .requireText()
            .stringLength(50);

        builder.field('LastName', LookupKey.String)
            .requireText()
            .stringLength(50);

        builder.field('BirthDate', LookupKey.Date)
            .notNull();
        builder.field('Prefix', LookupKey.String);
        builder.field('Suffix', LookupKey.String);
    }
}
```

This example introduces the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class), which is used inside `configureRules()` to define `ValueHosts` and their validators. Most developers will use the Builder API this way, inside a rules class, rather than building configuration directly in page or component code.

### Using PersonModelRules class to create the ValueHostsManager
Expect to use model-specific rules classes when writing server-side code for node.js,
but not in the UI. Here's what the code for the server side looks like.

```ts
const services = createJivsServices('en-US'); // see "Installing Jivs"
const rules = new PersonModelRules(services); 
const config = rules.configure();
const vhm = new ValueHostsManager(config);   // 'vhm' will be used to handle validation
```

## IAdaptModelRulesToForm interface: Adapt the model rules for the form

A form can start with the model's rules and adapt them to its own needs. This is a central use case of Jivs and keeping business logic separate from the UI.

The form _should_ subclass from the model's ValueHostRules subclass and implement the `IAdaptModelRulesToForm` interface. Use its `adaptToForm()` method to further extend the configuration to reflect the needs of your form. `adaptToForm()` passes you a [Form Configuration Adapter](#the-form-configuration-adapter). 

> Form Configuration Adapter is designed to _prevent_ you from modifying the validation rules, while _allowing_
changes to whatever impacts the UI.

- Add entirely new `ValueHosts` using the same `field()`, `static()` and `calc()` functions used in the `configureRules()` method. See [Defining the rules](Jivs_API.md#valuehost-rules).
- Modify many aspects of existing ValueHosts through the `modify(valueHostName)` method including:
    + labels
    + parsers and formatters
    + enabling
    + validation groups
    ```ts
    modify(valueHostName, {
        label: 'label',
        initialEnabled: false,
        group: 'group name'
    });
    ```
- Modify the data type name to use more specialized tools. For example, the original data type is "String"
but the UI wants to use tools around "Email". `modify(valueHostName).refineDataType(data type)`
- Modify existing Validators through the `modify(valueHostName).validator(validator name)` method including:
    + error messages
    + severity
    + enabling
    + error code
    ```ts
    modify('Field1').validator(ConditionType.RegExp, {
        errorMessage: 'error message',
        summaryMessage: 'summary',
        severity: ValidationSeverity.Severe,
        errorCode: 'LicenseNumber'
    })
    ```
- Expand the logic for an existing validator. While you cannot edit the conditional rules of the validator, you can combine it with additional Conditions.
    + `modify(valueHostName).validator(validator name).and(your condition)`
    + `modify(valueHostName).validator(validator name).or(your condition)`
    ```ts
    modify('Field1').validator(ConditionType.RegExp).and(
        (childBuilder=> childBuilder.fieldValue('AnotherField').equalTo(true)));
    ```
- Disable an existing validator. While frowned upon, this provides high visibility to the action.
    + `modify(valueHostName).validator(validator name).disable()`
- Add another validator to an existing ValueHost
    + `modify(valueHostName).addValidator().[specify the validator]`.
    ```ts
    modify('Field1').addValidator().equalTo(true, 'error message');
    ```

See [Form Configuration Adapter](#the-form-configuration-adapter) for details.

In this example, the form developer subclasses `PersonModelRules` and adds labels and error messages for the UI.

```ts
class PersonEditFormRules
    extends PersonModelRules
    implements IAdaptModelRulesToForm
{
    public adaptToForm(
        adapter: IFormConfigAdapter,
        options?: ValueHostRulesOptions
    ): void {
        adapter.useOnlyTheseModelFields(['FirstName', 'LastName']); // any other field (birthdate, prefix, suffix) will be disabled
        // let's change some text on the model's FirstName and LastName ValueHosts
        adapter.modify('FirstName', { label: 'First name' })
            .validator(ConditionType.StringLength, 
                'No more than {maximum} characters. You entered {length}.');
        // using the alternative syntax which supports many more properties...
        adapter.modify('LastName', { label: 'Last name' })
            .validator(ConditionType.StringLength, { 
                errorMessage: 'No more than {maximum} characters. You entered {length}.'
            });
    }
}
```
### Using PersonEditFormRules class to create the ValueHostsManager
```ts
const services = createJivsServices('en-US'); // see "Installing Jivs"
const rules = new PersonEditFormRules(services);
const config = rules.configure();

// typical callbacks for browser-based code
config.onValidationStateChanged = myValidationStateChangedFn;
config.onValueHostValidationStateChanged = myValueHostValidationStateChangedFn;

const vhm = new ValueHostsManager(config);   // 'vhm' will be used to handle validation
```
## Define rules for the form when there is no model

Sometimes a form is not backed by a business logic model.  

In that case, create a `ValueHostRulesBase` subclass and define the form's rules directly.

This example is a date range editor form that asks for a start date and end date, then ensures the two dates are no more than a certain number of days apart.

```ts
class DateRangeFormRules extends ValueHostRulesBase {
    protected override configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions
    ): void {
        // create the start date ValueHost and its validators
        builder.field('StartDate', LookupKey.Date, { label: 'Start date' })
            .lessThan('EndDate', { severity: ValidationSeverity.Severe })
            .lessThanOrEqual('NumOfDays', 
            {
                valueHostName: 'DiffDays', // left operand is no longer 'StartDate'
                errorCode: 'NumOfDays',
                errorMessage: 'The two dates must be less than {CompareTo} days apart.',
                summaryMessage: 'The Start and End dates must be less than {CompareTo} days apart.'
            });

        // create the end date ValueHost
        builder.field('EndDate', LookupKey.Date, { label: 'End date' });

        // provide a calculation ValueHost for StartDate <= NumOfDays
        builder.calc('DiffDays', LookupKey.Number, this.differenceBetweenDates);

        // provide a ValueHost to hold a constant which we'll assign after the ValueHostsManager is created
        builder.static('NumOfDays', LookupKey.Number);
    }

    private differenceBetweenDates(
        callingValueHost: ICalcValueHost,
        findValueHosts: IValueHostsManager): SimpleValueType {
        let totalDays1 = callingValueHost.convert(
            findValueHosts.getValueHost('StartDate')?.getValue(), null, LookupKey.TotalDays);
        let totalDays2 = callingValueHost.convert(
            findValueHosts.getValueHost('EndDate')?.getValue(), null, LookupKey.TotalDays);
        if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
            return undefined;   // can log with findValueHosts.services.logger.log();
        return Math.abs(totalDays2 - totalDays1);
    }
}
```
> Notice that we 1) inherit from `ValueHostRulesBase` 2) do not implement `IAdaptModelRulesToForm`, 3) use `builder.field()`.

### Using DateRangeFormRules to create the ValueHostsManager
```ts
const services = createJivsServices('en-US'); // see "Installing Jivs"
const rules = new DateRangeFormRules(services);
const config = rules.configure();

// typical callbacks for browser-based code
config.onValidationStateChanged = myValidationStateChangedFn;
config.onValueHostValidationStateChanged = myValueHostValidationStateChangedFn;

const vhm = new ValueHostsManager(config);   // 'vhm' will be used to handle validation
```
## The ValueHostsManagerConfigBuilder class
Use the `ValueHostsManagerConfigBuilder class` to create the `ValueHostsManagerConfig object tree` using a fluent syntax. Create the `ValueHosts` for fields, calculations, and static values along with  validators on fields.
```ts
class ValueHostsManagerConfigBuilder {
    constructor (services: IJivsServices) {} // there are other constructors too
    complete(): ValueHostsManagerConfig;

    // some of the functions to configure ValueHosts
    field(valueHostName, dataType?, partial config?): IValidatorBuilder;
    field(valueHostName, partial config?): IValidatorBuilder;
    field(partial config?): IValidatorBuilder;
    static(valueHostName, dataType?, partial config?): IValueHostsManagerConfigBuilder;
    static(valueHostName, partial config?): IValueHostsManagerConfigBuilder;
    static(partial config?): IValueHostsManagerConfigBuilder;
    calc(valueHostName, dataType, calcFn): IValueHostsManagerConfigBuilder;     
    whenToEnable(valueHostName: ValueHostName,
        callback: (builder: IStartConditionWithOneChildBuilder) => void): IManagerConfigBuilder; 

    // callbacks for various events
    onValidationStateChanged?: null | ValidationStateChangedHandler;
    onValueChanged?: null | ValueChangedHandler;
    onTextValueChanged?: null | TextValueChangedHandler;
    onConfigChanged?: null: ValueHostsManagerConfigChangedHandler;
    notifyValidationStateChangedDelay?: number;
    
    behaviors: Behaviors;   // adjust the behaviors of this instance
    capturedState?: string; // preserve stateful data during a round trip to the server
}
```
- `complete()` - Call upon completion of your work to retrieve the `ValueHostsManagerConfig object tree`. Then pass it to the constructor of `ValueHostsManager`.
### ValueHosts
- `field()` – Adds or modifies an [FieldValueHost](Jivs_API.md#valuehosts) configuration. You can chain validator functions like requireText() and regExp() to it. See [Configuring ValueHosts](Jivs_API.md#configuring-valuehosts).
    ```ts
    builder.field('Field1', LookupKey.Number, { label: 'Label'});
    builder.field('Field2', LookupKey.Date).requireText();  // attaches a validator
    ```
- `static()` – Adds or modifies a [StaticValueHost](Jivs_API.md#valuehosts) configuration. See [Configuring ValueHosts](Jivs_API.md#configuring-valuehosts).
    ```ts
    builder.static('Field1', 10);   // Field1 = 10
    ```
- `calc()` – Adds or modifies a [CalcValueHost](Jivs_API.md#valuehosts) configuration. See [Configuring ValueHosts](#configuring-valuehosts).
    ```ts
    builder.calc('Field1', LookupKey.Integer, (callingValueHost)=> calculation code);
    ```
- `whenToEnable` - Establishes the condition that must be met for the ValueHost to be enabled. When disabled, its validators do nothing.
    ```ts
    builder.whenToEnable('Field1', (whenBuilder)=>
        whenBuilder.fieldName('Field2').equalTo('YES'));
    builder.whenToEnable('Field1', (whenBuilder)=>
        whenBuilder.conditionConfig(existingConditionConfig));
    builder.whenToEnable('Field1', handler).any validator can be chained
    ```
### Callbacks    
- `onValueChanged` notifies you when a `ValueHost` had its value changed. On a FieldValueHost, this is the native value, not the text value.
- `onTextValueChanged` notifies you when an `FieldValueHost` had its text value changed.
- `onValidationStateChanged` and `onValueHostValidationStateChanged` notifies you after a `validate function` completes, providing the results.
- `onConfigChanged` lets you capture the configuration for caching it to use in a later creation of ValueHostsManager.
### State
- `capturedState` - The string returned by `ValueHostsManager.captureState()`. Use this when the page is regenerated by the server or the `ValueHostsManager` instance is replaced. See [Server generated pages](./Learning_Jivs/Server_Pages/Home.md).


### Chaining Validators using the Builder API
The `builder.field()` function allows appending validators. Just use the name of the validator without the "Condition" suffix, and in camelCase.
```ts
builder.field('StartDate').requireText().regExp(/expression/);
```
> The same chaining applies to the `Form Configuration Adapter`.

With the Builder API, validators have two patterns, one that accepts only error message and summary message, or one with the _validator parameters_ object, containing messages and much more.
```ts
builder.field('StartDate').requireText(errorMessage, summaryMessage);
// or
builder.field('StartDate').requireText({validator parameters});

builder.field('StartDate').regExp(expression, ignoreCase, errorMessage, summaryMessage);
// or
builder.field('StartDate').regExp(expression, ignoreCase, {validator parameters});
```
Error messages can be kept separately in the global configuration by using [TextLocalizerService](Jivs_API.md#localizing-strings-textlocalizerservice). When done this way, omit the errorMessage and summaryMessage, or use them to override the global configuration.
```ts
builder.field('StartDate').requireText();
```
For details on all validators using the Builder API, see [All condition configurations](Conditions.md).

## The Form Configuration Adapter
The **Form Configuration Adapter** (`FormConfigAdapter class`) is used within `IAdaptModelRulesToForm.adaptToForm()`. It targets adapting
the business rules to the form, and adding your own `ValueHosts`. Form Configuration Adapter inherits from the [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class), sharing its API.

```ts
class FormConfigAdapter extends ValueHostsManagerConfigBuilder
{
  // see ValueHostsManagerConfigBuilder class for field(), static(), calc(), whenToEnable(), state and callbacks
    useOnlyTheseModelFields(modelFieldNames: Array<string>): void;
    disableTheseModelFields(modelFieldNames: Array<string>): void;
    assignToGroup(groupName: string, valueHostNames: Array<ValueHostName>): void;

    modify(valueHostName: ValueHostName): IModifyFieldBuilder;
    modify(valueHostName: ValueHostName, adjustments: AdapterValueHostConfig): IModifyFieldBuilder;
    modify(valueHostName: ValueHostName, label: string): IModifyFieldBuilder;    
   
    whenToEnable(valueHostName, builderFn): IValueHostsManagerConfigBuilder;
}
```
Let’s go through these types.
- `field()`, `static()`, `calc()`, `whenToEnable()`, state and callback are inherited from the Builder. See [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class).
- `useOnlyTheseModelFields()` - Declares the only inherited model fields this form uses. Any other inherited model fields already configured on the builder are disabled.

    This is useful when the business layer has a model with many fields, 
    but the UI layer is only going to use a subset of those fields.
    ```ts
    protected configureRules(builder, options): void
    {
        builder.field('FirstName');
        builder.field('LastName');
        builder.field('BirthDate');
        builder.field('Suffix');
    }
    protected adaptToForm(adapter: IFormConfigAdapter, options?: ValueHostRulesOptions): void
    {
        adapter.useOnlyTheseModelFields(['FirstName', 'LastName']); // all others are disabled
    }
    ```
- `disableTheseModelFields()` - Declares inherited model fields this form does not use. Those inherited model fields already configured on the builder are disabled.

    This is useful when the business layer has a model with many fields, 
    but the UI layer is only going to use a subset of those fields.
    ```ts
    protected configureRules(builder, options): void
    {
        builder.field('FirstName');
        builder.field('LastName');
        builder.field('BirthDate');
        builder.field('Suffix');
    }
    protected adaptToForm(adapter: IFormConfigAdapter, options?: ValueHostRulesOptions): void
    {
        adapter.disableTheseModelFields(['BirthDate', 'Suffix']); // all others remain enabled
    }
    ```  
    
- `modify()` provides access to an existing ValueHost. Specify the value host name and optionally an object
that includes label, group, enabling tools, parsers, formatters, and more. 
    ```ts
    adapter.modify('Field1');
    adapter.modify('Field1', 'New Label');  // update the label
    adapter.modify('Field1', {
        label: 'New Label',
        group: 'group name',
        parserLookupKey: 'MyParser',
        formatterLookupKey: LookupKey.Currency
    });
    ```

    It chains to supply these methods:

    + `validator()` - Identifies an existing validator to modify. Returns functions to combine existing conditional rules with your own.
        ```ts
        validator(conditionType: string): IModifyValidatorBuilder;
        validator(conditionType: string, adjustments: FluentValidatorConfig): IModifyValidatorBuilder;
        ```
        > The _conditionType_ parameter takes either a standard conditionType identifier (`ConditionType.RequireText`, for example) or an error code. Use the error code when the existing validator uses the error code.
        ```ts
        // from the business rules
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        // adapt
        adapter.modify('Field1').validator(ConditionType.RequireText, 'error message', 'summary message');
        adapter.modify('Field2').validator(ConditionType.RequireText, {
            errorMessage: 'error message',
            summaryMessage: 'summary message',
            severity: ValidationSeverity.Severe
        });
        ```
        `validator()` returns another object with these methods to further modify the validator:

        + `and()` - combine a condition with an existing validator's condition using an AND operator.
            ```ts
            // from the business rules
            builder.field('Field1').requireText();
            // adapt
            adapter.modify('Field1').validator(ConditionType.RequireText).and(
                (childBuilder)=> childBuilder.fieldValue('Field2').equalTo(true));
            ```
        + `or()` - combine a condition with an existing validator's condition using an OR operator.
            ```ts
            // from the business rules
            builder.field('Field1').requireText();
            // adapt
            adapter.modify('Field1').validator(ConditionType.RequireText).or(
                (childBuilder)=> childBuilder.fieldValue('Field2').equalTo(true));
            ```
        + `whenToEnable() `- provide a condition that determines when the validator is enabled.
            ```ts
            // from the business rules
            builder.field('Field1').requireText();
            // adapt
            adapter.modify('Field1').validator(ConditionType.RequireText).whenToEnable(
                (childBuilder)=> childBuilder.fieldValue('Field2').equalTo(true));
            ```
        > While `and()` and `whenToEnable()` logically appear the same, `and()` evaluates as NoMatch
        and `whenToEnable()` evaluates as Undetermined if your condition evaluates as NoMatch.
    + `addValidator()` - starts adding new validators to the ValueHost. This uses the Builder's chaining syntax.
        ```ts
        // from the business rules
        builder.field('Field1');
        // adapt
        adapter.modify('Field1').addValidator().requireText();
        ```
    + `whenToEnable()` - Establishes the condition that must be met for the ValueHost to be enabled. When disabled, its validators do nothing.
        ```ts
        adapter.modify('Field1').whenToEnable(
            (childBuilder)=> childBuilder.fieldValue('Field2').equalTo(true));
    + `refineDataType()` - Updates the data type. The new data type must be able to fallback to 
        the original data type as specified in the `LookupFallbackService` of `JivsServices`.
        ```ts
        // from the business rules
        builder.field('Field1', LookupKey.String);  // original
        // adapt
        adapter.modify('Field1').refineDataType('Email');   // assuming Email is setup in LookupFallbackService
        adapter.modify('Field1').refineDataType(LookupKey.Number); // !!ERROR No fallback from number to string
        ```
---
