# ValueHost rules
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
[Builder](ValueHostsManager_Configuration_Guide.md#the-valuehostsmanagerconfigbuilder-class)

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
[Adapter](ValueHostsManager_Configuration_Guide.md#the-form-configuration-adapter)

## Consuming the ValueHostRules subclass
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

## Short intro to methods on Builder:
The ValueHostsManagerConfigBuilder has these features:
- `builder.field(valueHostName, parameters)` adds n `FieldValueHost` configuration. You can chain validator functions like requireText() and regExp() to it.
For more, see [ValueHost members](#valuehost-members).
- `builder.static(valueHostName, parameters)` adds a `StaticValueHost` configuration.
For more, see [ValueHost members](#valuehost-members).
- `builder.calc(valueHostName, parameters)` adds a `CalcValueHost` configuration. 
For more, see [Using CalcValueHost](#using-calcvaluehost).
    
[Builder](ValueHostsManager_Configuration_Guide.md#the-valuehostsmanagerconfigbuilder-class)

## Short intro to methods on Adapter
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

[Adapter](ValueHostsManager_Configuration_Guide.md#the-form-configuration-adapter)
