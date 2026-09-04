# ValueHost rules
**ValueHost rules** are used to configure a `ValueHostsManager`. They define all `ValueHosts` used by the Form or Model.

You work with these types as you build `ValueHost` rules.
- `ValueHostRulesBase` is the base class from which you work.
- `IAdaptModelRulesToForm` interface is implemented when your form inherits from an existing model's `ValueHost` rules.
- `Builder` provides an API for configuration. It is passed to your `ValueHostRulesBase.configureRules()` method.
- `Adapter` provides an API for adapting business logic configuration to your form. It is passed to your `IAdaptModelRulesToForm.adaptToForm()` method.

All of these are described in detail in [ValueHostsManager Configuration Guide](../../ValueHostsManager_Configuration_Guide.md).

## Using ValueHostRulesBase
Create a subclass of `ValueHostRulesBase` to package a full configuration of `ValueHosts` associated with a model or form.

A `ValueHostRulesBase` subclass has only one public method, `configure()`, and numerous protected methods. Typically you only override one, `configureRules()`.

Its constructor requires the `JivsService` object as its parameter.

```ts
// Built around Person model
export class PersonModelRules extends ValueHostRulesBase {
    protected constructor(services: IJivsServices)
    {
        super(services);
    }    
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
    protected constructor(services: IJivsServices)
    {
        super(services);
    }    
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
### Short intro to methods on Builder
The builder's class has a rich API called **Builder API**. Learn about it here:
[Builder](../../ValueHostsManager_Configuration_Guide.md#the-valuehostsmanagerconfigbuilder-class)

The `ValueHostsManagerConfigBuilder` has these features:
- `builder.field(valueHostName, parameters)` adds n `FieldValueHost` configuration. You can chain validator functions like requireText() and regExp() to it.
For more, see [ValueHost members](#valuehost-members).
- `builder.static(valueHostName, parameters)` adds a `StaticValueHost` configuration.
For more, see [ValueHost members](#valuehost-members).
- `builder.calc(valueHostName, parameters)` adds a `CalcValueHost` configuration. 
For more, see [Using CalcValueHost](#using-calcvaluehost).

## Using IAdaptModelRulesToForm
When a form uses model rules, subclass that model's `ValueHost` rules class and implement `IAdaptModelRulesToForm`.

```ts
class PersonEditFormRules
    extends PersonModelRules
    implements IAdaptModelRulesToForm
{
    protected constructor(services: IJivsServices)
    {
        super(services);
    }    
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

## Short intro to methods on Adapter
The adapter's class, `FormConfigAdapter`, inherits from the `Builder`, and introduces methods to carefully adapt your form's requirements without breaking the business logic rules.
Learn about it here: 
[Adapter](../../ValueHostsManager_Configuration_Guide.md#the-form-configuration-adapter)

The `Adapter` has these features:
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

## Consuming your ValueHostRules subclass
```ts
const services = createJivsServices('en-US');
const rules = new YourValueHostRules(services);
const config = rules.configure();   // takes ValueHostRulesOptions. See below
// assign any callback hooks on config here
const vhm = new ValueHostsManager(config);
```
`configure()` converts your rules into the `ValueHostsManagerConfig object` tree. Use its `options` parameter when you need to influence how the rules are prepared.

```ts
interface ValueHostRulesOptions {
    disableCache?: boolean;
    variantName?: string;
    favorUIMessages?: boolean;    
}
```

- `disableCache` - When `true`, disables cache participation for that `configure()` call. By default, Jivs caches the generated ValueHostConfig objects, to avoid running the configureRules() process every time.
- `variantName` - Lets the subclass author define named variants of the same rules class, so the class's consumer can request an optional configuration path by name.
- `favorUIMessages` - Used together with the `IAdaptModelRulesToForm.adaptToForm()` function
to determine how to transition from the base rules to the form-specific rules.
When true or undefined, delete any error messages supplied by business logic for which
you have a replacement in `TextLocalizationService`.

## API Reference
- [ValueHostsManager class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHostsManager_ConcreteClasses.ValueHostsManager.html)
- [ValueHostRulesBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_ValueHostRules_ConcreteClasses.ValueHostRulesBase.html)
- [IAdaptModelRulesToForm interface](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-builder_ValueHostRules_Types.IAdaptModelRulesToForm.html)
- [ValueHostsManagerConfigBuilder class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_Builders_ConcreteClasses.ValueHostsManagerConfigBuilder.html)
- [FormConfigAdapter class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_Builders_ConcreteClasses.FormConfigAdapter.html)


---
Go to [API Home](../Home.md)