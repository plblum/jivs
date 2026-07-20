# @plblum/jivs-builder: Build your configurations
> This document targets a developer who is attempting to code with Builder classes,
not a training guide for the Builder API syntax. See the jivs README.md for the syntax.


"Builders" create the configuration objects that are fed into `ValidationManager`:

```ts
let config: ValidationManagerConfig = {
    services: createValidationServices(),
    valueHostConfigs: [
        {
            valueHostType: ValueHostType.Field,
            name: 'LastName',
            dataType: LookupKey.String,
            label: 'Last name',
            validatorConfigs: [
                {
                    conditionType: ConditionType.Required
                }
            ]
        }

    ],
    ... and more! ...
};
let vm = new ValidationManager(config);
```

The `ValidationManagerConfig` object is rather complex and difficult to maintain.

The Builders and its Builder API are a better way.

```ts
let builder = new ValidationManagerConfigBuilder(createValidationServices());
builder.field('LastName', LookupKey.String, { label: 'Last name'})
    .requireText();
let vm = new ValidationManager(builder.complete());
```
It uses a fluent syntax to build the configuration quickly and succinctly.

## Class overview
- `ValidationManagerConfigBuilder` handles the top-level properties of `ValidationManagerConfig`, including the callback properties, like onValueChanged. Its main supporting functions add ValueHosts.
- `ValidatorBuilder` handles attaching validators to the `FieldValueHostConfig`, within its `validatorConfigs` property. `ValidationManagerConfigBuilder.field()` returns a `ValidatorBuilder` to start the fluent syntax, and each validator function on `ValidatorBuilder` returns the same to continue the chain.
If you add a new condition, you'll add it here too.
- `ConditionBuilderBase` is a base class for adding conditions. It hosts several speciality conditions, all, any, countMatches, not, and when. But it lacks the major conditions.
- `ConditionBuilder` is where we add all of the rest of the conditions found in Jivs. If you add a new condition, you'll add it here too.
- `FormConfigAdapter` is our Form Configuration Adapter class, inheriting directly form `ValidationManagerConfigBuilder` to let the form developer add new ValueHosts using the Builder API. It adds functions to help extend existing business logic defined configurations. Its main function, `modify()`, returns a `ModifyFieldBuilder` to work on child conditions of the ValueHost.
- `ModifyFieldBuilder` is returned by `FormConfigAdapter.modify()` and supports these properties of ValueHostConfig: enablerConfig, validatorConfigs, dataType. Its `validator()` property lets you modify the validator-specific properties of the validator, like error message, but not the condition. `validator()` returns the `ModifyValidatorBuilder` to help with the condition part.
- `ModifyValidatorBuilder` lets you wrap the existing condition with one of your own.


## Adding ValueHostConfigs
`ValidationManagerConfigBuilder` class defines top-level properties found on `ValidationManagerConfig`.

The user will start the fluent syntax with:
- `field()` - FieldValueHostConfig
- `static()` - StaticValueHostConfig
- `calc()` - CalcValueHostConfig.

`builder.field('valueHostName').[chained validators]`

With optional parameters:

`builder.field('valueHostName', 'datatype lookup key', { label: 'label' }).[chained validators];`

With optional parameters:

`builder.static('valueHostName').[chained functions]`

 With optional parameters:

`builder.static('valueHostName', 'datatype lookup key', { label: 'label' }).[chained builder functions];`

`builder.calc('valueHostName', 'datatype lookup key', function callback).[chained builder functions];`

For example:
```ts
let builder = new ValidationManagerConfigBuilder(services);
builder.static('productVisible', LookupKey.Boolean);
builder.field('productName', LookupKey.String, { label: 'Name' }).requireText().regExp('^\w[\s\w]*$');
builder.field('price', LookupKey.Currency, { label: 'Price' }).greaterThanOrEqualValue(0.0);
builder.calc('maxPrice', LookupKey.Currency, calcMaxPrice); // calcMaxPrice is a function declared elsewhere
let vm = new ValidationManager(builder);
```

## Adding ValidatorConfigs to FieldValueHostConfigs
`builder.field()` returns the `ValidatorBuilder` class, which contains all of the validators supplied with Jivs.

For example:
```ts
builder.field('valueHostName').requireText();
builder.field('valueHostName', LookupKey.String).requireText().regExp(/^[A-B/]); // chained validators
```
## Adding child Conditions to various containing Configs
Each of these need you to explicitly add just a condition, not a whole validator (which combines a condition with
error messages for example.)
- `all()` validator
- `any()` validator
- `when()` validator
- `not()` validator
- `whenToEnable()` on any ValueHostConfig
- `whenToEnable()` on any Validator

Each of those functions take parameters with a function hook that is passed one of these:

- `StartConditionWithChildrenBuilder`
    ```ts
    builder.field('valueHostName').all(
        (childBuilder)=> {
            childBuilder.fieldValue('valueHostName2').requireText();
            childBuilder.fieldValue('valueHostName3').requireText();
        });
    ```
- `StartConditionWithOneChildBuilder`
    ```ts
    builder.field('valueHostName').when(
        (whenToEnableBuilder)=> whenToEnableBuilder.fieldValue('valueHostName').equalToValue(true),
        (thenBuilder)=> thenBuilder.parentValue().requireText()
    );
    ```
Check these out in the source: [ConditionBuilderBase.ts](.\src\Builder\ConditionBuilderBase.ts).

All `StartConditionBuilder` classes provide a short fluent syntax, where the next item in the chain
is either `parentValue()` or `fieldValue('valueHostName')`. Those functions move us to the final
step of the child, the `ConditionBuilder`.

### Using ConditionBuilder to create the condition-specific ConditionConfig
`ValidatorConfigs` look like this:
```ts
let valConfig: ValidatorConfig = {
    errorMessage: 'error message',
    summaryMessage: 'summaryMessage',
    ... errorCode, severity, and enable too ...
    conditionConfig: {
        conditionType: ConditionType.TypeName like RequireText
        ... condition specific properties ...
    }
}
```
By the time we reach `ConditionBuilder`, we are populating only the object inside of `conditionConfig`.

`ConditionBuilder` class contains all Jivs-supplied conditions as its functions.

# Extending the Builders to support your own conditions
1. Subclass `ConditionBuilder` and add your condition functions.
    ```ts
    // Suppose that you created EmailAddressCondition with its companion configuration
    // object, YourEmailConditionConfig.
    export class YourConditionBuilder extends ConditionBuilder {

         public emailAddress(allowMultiple: boolean): void {
             let config: Partial<YourEmailConditionConfig> =
             {
                 conditionType: 'EmailAddress',
                 allowMultiple: allowMultiple
             };
             this.setConfig(config as any);
         }
    }
    ```
2. Subclass `ValidatorBuilder` and add your validator functions. This requires 2 overloads
   as shown here:
    ```ts
     // again wiring up your custom condition, EmailAddressCondition.

    export class YourValidatorBuilder extends ValidatorBuilder {
         public emailAddress(
             allowMultiple: boolean,
             errorMessage?: string | null, 
             summaryMessage?: string | null): IValidatorBuilder;
         public emailAddress(
             allowMultiple: boolean,
             validatorParameters: FluentValidatorConfig): IValidatorBuilder;
         public emailAddress(
             allowMultiple: boolean,
             arg2?: FluentValidatorConfig | string | null,
             arg3?: string | null): IValidatorBuilder {
             let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                 this.resolveOverloadArgs<EmailAddressConditionConfig>(arg2, arg3);
             let conditionBuilder = new YourConditionBuilder(this);
             conditionBuilder.emailAddress(allowMultiple);
             return this.finish(conditionBuilder,
                 errorMessage, summaryMessage, validatorParameters);
         }
    }
    ```
3. Register your custom builders with the `BuildersFactory` which is in `ValidationServices`.
     ```ts
     // within the createValidationServices function, this code already exists, 
     // only needing removing comments:
     // --- BuildersFactory -------------------------------------------
     let bf = vs.builderFactory;
     // Adding custom conditions to ValidatorBuilder and ConditionBuilder
     bf.setValidatorBuilderCreator((parentConfig: FieldValueHostConfig) => {
         return new YourValidatorBuilder(parentConfig);
     });
     bf.setConditionBuilderCreator((parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => {
         return new YourConditionBuilder(parentBuilder, completed);
     });
     ```
4. Use TypeScript's Type Augmentation feature to make your validator available to intellisense and the TypeScript compiler (because TypeScript compiler will still think its using the original classes):
    ```ts
    declare module "@plblum/jivs-builder/build/Interfaces/ChildBuilders"
    {
        export interface IValidatorBuilder {
            emailAddress(
                errorMessage?: string | null,
                summaryMessage?: string | null): IValidatorBuilder;
            emailAddress(
                validatorParameters: FluentValidatorConfig): IValidatorBuilder;
        }
    }
    declare module "@plblum/jivs-builder/build/Interfaces/ChildBuilders"
    {
        export interface IConditionBuilder {
            emailAddress(): void;
        }
    }
    ```