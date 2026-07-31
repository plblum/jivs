# Understanding jivs-builder

> This document is for developers who want to understand or extend the Builder and Model Rules classes. It is not a Builder API syntax guide; see the jivs README.md for syntax and usage examples. 
> If you want to consume the builder, start with [Configuring ValidationManager](Configuring.md). 

`@plblum/jivs-builder` is the package that creates the configuration objects used by `ValidationManager`. It should have already been installed, but if needed, get it from [https://www.npmjs.com/package/@plblum/jivs-builder](https://www.npmjs.com/package/@plblum/jivs-builder).

You are likely here for one of these reasons:

* You want to understand how jivs-builder improves the configuration developer experience.
* You want to extend the fluent syntax to support your own Condition or Validator.
* You want to generate configuration separately from jivs-engine, such as JSON created by Node.js or a build step.
* You want to better understand the architecture and codebase surrounding builders and model rules.

This README introduces those areas. The source code comments go deeper into implementation details.

"Builders" create the configuration objects that are fed into `ValidationManager`:

```ts
let config: ValidationManagerConfig = {
    services: createJivsServices(),
    valueHostConfigs: [
        {
            valueHostType: ValueHostType.Field,
            name: 'LastName',
            dataType: LookupKey.String,
            label: 'Last name',
            validatorConfigs: [
                {
                    conditionType: ConditionType.RequireText
                }
            ]
        }

    ],
    ... and more! ...
};
let vm = new ValidationManager(config);
```

The `ValidationManagerConfig` object is rather complex and difficult to maintain.

The **Builders** and the **Builder API** are a better way.

```ts
let builder = new ValidationManagerConfigBuilder(createJivsServices());
builder.field('LastName', LookupKey.String, { label: 'Last name'})
    .requireText();
let vm = new ValidationManager(builder.complete());
```

It uses fluent syntax to build the configuration quickly and succinctly. The syntax follows the shape of the configuration it creates: `field()` starts a ValueHost, and each validator function adds a validator with a condition inside it.

The **Model Rules** encapsulate Builder code for a single model or form. Each rules class is subclassed from `ModelRulesBase` or `FormRulesBase`.

When a form starts with model or business logic rules, the form-specific rules class can implement `IAdaptModelRulesToForm`. That exposes the **Form Configuration Adapter** (FormConfigAdapter class) so the form can prepare the model rules for its own needs.

Let's see all of these working together:

```ts
export class PersonModelRules extends ModelRulesBase {
  constructor(services: IJivsServices) {
    super(services);
  }
  protected override configureRules(
    builder: IValidationManagerConfigBuilder,
    options?: RulesConfigOptions
  ): void {
// these are your business logic rules
    builder.field('FirstName', LookupKey.String)
      .requireText()
      .stringLength(50);

    builder.field('LastName', LookupKey.String)
      .requireText()
      .stringLength(50);

    builder.field('BirthDate', LookupKey.Date)
      .notNull();
  }
}
export class PersonEditFormRules
  extends PersonModelRules
  implements IAdaptModelRulesToForm
{
  constructor(services: IJivsServices) {
    super(services);
  }
  public adaptToForm(
    adapter: IFormConfigAdapter,
    options?: RulesConfigOptions
  ): void {
    adapter.modify('FirstName', 'First name' )
      .validator(ConditionType.StringLength, 'No more than {maximum} characters. You entered {length}.');
      // same idea but using an object to supply numerous parameters
    adapter.modify('LastName', { label: 'Last name' })
      .validator(ConditionType.StringLength, 
        { 
            errorMessage: 'No more than {maximum} characters. You entered {length}.',
            errorCode: 'MaxLen'
        });
    adapter.modify('BirthDate', { label: 'Birth date' });
  }
}
```

## Class overview

The Builders and Model Rules work together to prepare the complete object tree of `ValidationManagerConfig`.

### Configuration builders

* `ValidationManagerConfigBuilder` is the starting point of the **Builder API**. It handles the top-level properties of `ValidationManagerConfig`, including callback properties like `onValueChanged`. Its main functions add ValueHosts.
* `ValueHostConfigBuilder` is used internally by `ValidationManagerConfigBuilder` when adding `ValueHosts`. It creates and configures `ValueHostConfig` subclasses, including `FieldValueHostConfig`, `StaticValueHostConfig`, and `CalcValueHostConfig`.
* `ValidatorBuilder` attaches validators to a `FieldValueHostConfig` through its `validatorConfigs` property. `ValidationManagerConfigBuilder.field()` returns a `ValidatorBuilder` to start the fluent syntax, and each validator function on `ValidatorBuilder` returns the same builder to continue the chain. If you add a new validator function for a condition, you'll add it here too.

### Condition builders

* `ConditionBuilderBase` supports conditions that contain other conditions. It hosts special condition patterns: `all`, `any`, `countMatches`, `not`, and `when`.
* `ConditionBuilder` adds the standard Jivs conditions used when creating condition-only configuration, including child conditions and enabler conditions. If you add a condition that should be available outside validator functions, you'll add it here too.
* `StartConditionBuilder` classes provide the short fluent syntax used when a child condition must be created. They move the fluent chain from `parentValue()` or `fieldValue('valueHostName')` into `ConditionBuilder`.
    + `StartConditionWithChildrenBuilder` is used when a condition accepts multiple child conditions, such as `all`, `any`, and `countMatches`.
    + `StartConditionWithOneChildBuilder` is used when a condition accepts one child condition, such as `not`.

### Rules classes

* `RulesBase` is the base class for `ModelRulesBase` and `FormRulesBase`, and contains most of their shared functionality.
* `ModelRulesBase` is intended to be subclassed for model or business logic rules.
* `FormRulesBase` is intended to be subclassed for form rules that do not start from model or business logic rules.
* `IAdaptModelRulesToForm` is an interface for a `ModelRulesBase` subclass that adapts inherited model or business logic rules for a form. It exposes the `FormConfigAdapter` to the form developer so they can safely update the configuration.

### Form configuration adapter

* `FormConfigAdapter` is the class for the **Form Configuration Adapter**. It inherits from `ValidationManagerConfigBuilder` so the form developer can add new ValueHosts using the Builder API. It also adds functions to safely adapt existing business logic configurations. Its main function, `modify()`, returns a `ModifyFieldBuilder`.
* `ModifyFieldBuilder` is returned by `FormConfigAdapter.modify()` and supports selected properties of an existing `ValueHostConfig`, including `enablerConfig`, `validatorConfigs`, and `dataType`. Its `validator()` function lets you modify validator-specific properties, like error messages, but not condition-specific properties. `validator()` returns `ModifyValidatorBuilder`.
* `ModifyValidatorBuilder` lets you wrap an existing validator condition with another condition.


## How the Builder API creates configuration

The **Builder API** is a fluent way to create the object tree inside `ValidationManagerConfig`.

This section connects the fluent syntax to the classes that build each part of that object tree.

The top-level object looks like this:

```ts id="bsxub1"
let config: ValidationManagerConfig = {
    services: services,

    // ValueHostConfigBuilder helps create the objects inside this array.
    valueHostConfigs: [
        // FieldValueHostConfig, StaticValueHostConfig, CalcValueHostConfig
    ],

    // ValidationManagerConfigBuilder also handles callback properties.
    onValueChanged: (valueHost, oldValue) => {
        // your callback here
    }
};
```

`ValidationManagerConfigBuilder` works at this top level. Its `ValueHost` functions delegate to `ValueHostConfigBuilder`, while other functions and properties configure `ValidationManagerConfig` itself.

## Adding ValueHostConfigs to ValidationManagerConfig

`ValidationManagerConfigBuilder` class defines top-level properties found on `ValidationManagerConfig`.

Its `ValueHost` functions are supported internally by `ValueHostConfigBuilder`. Each function creates a `ValueHostConfig` subclass and adds it to `ValidationManagerConfig.valueHostConfigs`.

Fluent syntax starts with:

* `field()` - creates a `FieldValueHostConfig` and returns `ValidatorBuilder` to build validators for this `FieldValueHost`.
* `static()` - creates a `StaticValueHostConfig` and returns `ValidationManagerConfigBuilder`, allowing for chaining.
* `calc()` - creates a `CalcValueHostConfig` and returns `ValidationManagerConfigBuilder`, allowing for chaining.

Those functions create configs shaped like these:

```ts id="yvyx0g"
let fieldConfig: FieldValueHostConfig = {
    valueHostType: ValueHostType.Field,
    name: 'productName',
    dataType: LookupKey.String,
    label: 'Name',
    validatorConfigs: [
        // ValidatorBuilder creates these.
    ]
};

let staticConfig: StaticValueHostConfig = {
    valueHostType: ValueHostType.Static,
    name: 'productVisible',
    dataType: LookupKey.Boolean
};

let calcConfig: CalcValueHostConfig = {
    valueHostType: ValueHostType.Calc,
    name: 'maxPrice',
    dataType: LookupKey.Currency,
    calcFn: calcMaxPrice
};
```

`ValueHostConfigBuilder` creates these `ValueHostConfig` subclasses. When the config is for a field, `field()` returns `ValidatorBuilder` so the same fluent chain can add validators to that `FieldValueHostConfig`.

Some usage patterns:

`builder.field('valueHostName').[chained validators]`

`builder.field('valueHostName', 'datatype lookup key', { label: 'label' }).[chained validators];`

`builder.static('valueHostName').[chained builder functions]`

`builder.static('valueHostName', 'datatype lookup key', { label: 'label' }).[chained builder functions];`

`builder.calc('valueHostName', 'datatype lookup key', function callback).[chained builder functions];`

For example:

```ts id="pfo2my"
let builder = new ValidationManagerConfigBuilder(services);
builder.static('productVisible', LookupKey.Boolean);
builder.field('productName', LookupKey.String, { label: 'Name' }).requireText().regExp('^\w[\s\w]*$');
builder.field('price', LookupKey.Currency, { label: 'Price' }).greaterThanOrEqualValue(0.0);
builder.calc('maxPrice', LookupKey.Currency, calcMaxPrice); // calcMaxPrice is a function declared elsewhere
let vm = new ValidationManager(builder.complete());
```

## Adding ValidatorConfigs to FieldValueHostConfigs

`ValidationManagerConfigBuilder.field()` returns the `ValidatorBuilder` class, which contains all of the validators supplied with Jivs.

`ValidatorBuilder` adds each validator to the current `FieldValueHostConfig.validatorConfigs` array. Each validator function creates a `ValidatorConfig`.

A `ValidatorConfig` contains validator-specific properties, such as error messages, summary messages, severity, error code, and enabling. It also contains a `conditionConfig` object that describes the condition to evaluate.

```ts id="izw5h6"
let valConfig: ValidatorConfig = {
    errorMessage: 'error message',
    summaryMessage: 'summaryMessage',
    // errorCode, severity, enabled, and more...
    conditionConfig: {
        // StartConditionBuilder and ConditionBuilder create this object.
    }
};
```

## Adding child Conditions to containing Configs

Some **Builder API** functions need you to add a `ConditionConfig`, not a whole `ValidatorConfig`. These are condition-only builder hooks.

Each of these needs a `ConditionConfig` without creating a whole `ValidatorConfig`:

* `all()` validator
* `any()` validator
* `when()` validator
* `not()` validator
* `whenToEnable()` on any ValueHostConfig
* `whenToEnable()` on any Validator

These functions take callback parameters that receive one of these child condition builders:

* `StartConditionWithChildrenBuilder`

  ```ts
  builder.field('valueHostName').all(
      (childBuilder)=> {
          childBuilder.fieldValue('valueHostName2').requireText();
          childBuilder.fieldValue('valueHostName3').requireText();
      });
  ```
* `StartConditionWithOneChildBuilder`

  ```ts
  builder.field('valueHostName').when(
      (whenToEnableBuilder)=> whenToEnableBuilder.fieldValue('valueHostName').equalToValue(true),
      (thenBuilder)=> thenBuilder.parentValue().requireText()
  );
  ```

Check these out in the source: [ConditionBuilderBase.ts](../packages/jivs-builder/src/Builder/ConditionBuilderBase.ts).

All `StartConditionBuilder` classes provide a short fluent syntax where the next item in the chain is either `parentValue()` or `fieldValue('valueHostName')`. Those functions move the fluent chain to `ConditionBuilder`.

## Using ConditionBuilder to create the condition-specific ConditionConfig

`ConditionBuilder` creates the condition-specific object used by `ValidatorConfig.conditionConfig`, enabler configs, and child condition configs.

For example, a `requireText()` validator creates a condition config shaped like this:

```ts id="aq2kg3"
let conditionConfig: RequireTextConditionConfig = {
    conditionType: ConditionType.RequireText
    // condition-specific properties...
};
```

If `StartConditionBuilder` uses `fieldValue('valueHostName')`, the config also includes the `valueHostName` property:

```ts id="6nxe5q"
let conditionConfig: RequireTextConditionConfig = {
    conditionType: ConditionType.RequireText,
    valueHostName: 'valueHostName'
    // condition-specific properties...
};
```

By the time the fluent chain reaches `ConditionBuilder`, the builder is populating only the `ConditionConfig` object, not a whole `ValidatorConfig`.

`ConditionBuilder` contains the Jivs-supplied conditions used in those condition-only places.

# Extending the Builders to support your own conditions

The earlier sections showed that validators and conditions are built in two places.

`ValidatorBuilder` is used when a condition becomes a validator on a `FieldValueHostConfig`.

`ConditionBuilder` is used when a condition is needed by `when`, `all`, `not`, enablers, or other condition-only hooks.

To make your own condition feel native to the Builder API, expose it through both `ConditionBuilder` and `ValidatorBuilder`.

1. Create your condition and its configuration.

   ```ts
   export const emailAddressLookupKey = 'EmailAddress';
   export const emailAddressConditionType = 'EmailAddressRegExp';  // this can be anything so long as it's different from other ConditionTypes

   export interface EmailAddressConditionConfig extends RegExpConditionConfig { }

   // The Condition that will be used by the DataTypeCheckValidator
   // when its dataType property is 'EmailAddress'
   // It must still be registered in the JivsServices.conditionFactory.
   export class EmailAddressCondition extends RegExpCondition
   {
       constructor(config: EmailAddressConditionConfig)
       {
           super({
               ...config,
               expression: /^([\w.!#$%\-+.'_]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]{2,})+)/i
           });
       }
       public get conditionType(): string {
           return emailAddressConditionType; 
       }
       public get category(): ConditionCategory {
           return ConditionCategory.DataTypeCheck;
       }
   }
   ```

2. Register the condition with `JivsServices.conditionFactory` in the `createJivsServices()` function.

   ```ts
   let cf = vs.conditionFactory as ConditionFactory;
   // or move just this line into registerDataTypeCheckGenerators() function
   cf.register<EmailAddressConditionConfig>(
       emailAddressConditionType,
       (config) => new EmailAddressCondition(config)
   );
   ```

3. Subclass `ConditionBuilder` and add your condition function.

   ```ts
   export class YourConditionBuilder extends ConditionBuilder {

        public emailAddress(): void {
            let config: Partial<EmailAddressConditionConfig> =
            {
                conditionType: emailAddressConditionType
            };
            this.setConfig(config as any);
        }
   }
   ```

4. Subclass `ValidatorBuilder` and add your validator function. This requires overloads as shown here:

   ```ts
   export class YourValidatorBuilder extends ValidatorBuilder {
        public emailAddress(
            errorMessage?: string | null,
            summaryMessage?: string | null): IValidatorBuilder;
        public emailAddress(
            validatorParameters: FluentValidatorConfig): IValidatorBuilder;
        public emailAddress(
            arg1?: FluentValidatorConfig | string | null,
            arg2?: string | null): IValidatorBuilder {
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<EmailAddressConditionConfig>(arg1, arg2);
            let conditionBuilder = new YourConditionBuilder(this);
            conditionBuilder.emailAddress();
            return this.finish(conditionBuilder,
                errorMessage, summaryMessage, validatorParameters);
        }
   }
   ```

5. Register your custom builders with the `BuildersFactory`, which is in `JivsServices`.

   ```ts
   // within the createJivsServices function, this code already exists,
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

6. Use TypeScript's module augmentation feature to make your validator available to IntelliSense and the TypeScript compiler. Without it, TypeScript still sees only the original interfaces.

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

After these steps, your custom condition can be used as a validator:

```ts
builder.field('EmailAddress', emailAddressLookupKey)
    .emailAddress('Enter a valid email address.');
```

It can also be used in condition-only hooks:

```ts
builder.field('EmailAddress', emailAddressLookupKey)
    .when(
        (whenBuilder) => whenBuilder.fieldValue('SubscribeToNewsletter').equalToValue(true),
        (thenBuilder) => thenBuilder.parentValue().emailAddress()
    );
```
# Builders are separate from the jivs-engine itself

Builders and Model Rules are used to create configuration. They are not needed to run validation once that configuration exists.

Since Builders and Model Rules are part of the general setup for `ValidationManager`, you might expect all of the code from the jivs-builder module to be part of jivs-engine. It has been separated out because:

1. It is a fairly large codebase.
2. It is not needed once configuration is done.
3. It creates an object tree that can be retained in a file as JSON.

Let's suppose that you like to work with a light footprint. You can create code like this:

```ts id="ej8d12"
let builder = new ValidationManagerConfigBuilder(services);
let rules = new myRules();
rules.configure(builder);
let config = builder.complete();
let json = JSON.stringify(config.valueHostConfigs); // just the valueHosts.
// do something with json
```

## Let the server generate the json and expose an API to return it

Using Node.js, you could have an API call that executes the above code, returning the JSON to the client.

On the client side, suppose you call your API with something like this.

```ts id="y3kook"
let valueHostConfigs = await OurApi.getMyRules();
let config: ValidationManagerConfig = {
    services: services,
    valueHostConfigs: valueHostConfigs,
    ... attach any callbacks here ...
}
let vm = new ValidationManager(config);
```

## Let Node.js generate a configuration file that the client can retrieve

Instead of generating the configuration each time an API call is made, you can generate it ahead of time and save the relevant configuration data as JSON.

For example, suppose you have a `PersonModelRules` class:

```ts id="8mi8qf"
import { mkdir, writeFile } from "node:fs/promises";

let builder = new ValidationManagerConfigBuilder(services);

let rules = new PersonModelRules(services);
rules.configure(builder);

let config = builder.complete();
let json = JSON.stringify(config.valueHostConfigs, null, 2);

await mkdir("./generated-rules", { recursive: true });
await writeFile(
    "./generated-rules/Person.json",
    json,
    "utf8"
);
```

This creates a file containing the generated `valueHostConfigs`:

```text id="eb18s1"
generated-rules/
    Person.json
```

The Builder and Model Rules code only needs to run when this configuration data is generated. The resulting JSON file can then be deployed with the application and retrieved by the browser when needed.

You might run code like this yourself:

* manually when rules change,
* from a unit test,
* from an npm script,
* or as part of your build or publishing process.

An application with many models could generate one file for each model or rules variation. How you organize and automate that process is up to your application.

## Load the configuration in the browser

Once the JSON file is available to the client, for example served from `/generated-rules/Person.json`, the browser can retrieve and use it to configure validation.

```ts id="i3ktsd"
let response = await fetch("/generated-rules/Person.json");
let valueHostConfigs = await response.json();

let config: ValidationManagerConfig = {
   services: services,
   valueHostConfigs: valueHostConfigs,
   // wire up any callbacks
};
let vm = new ValidationManager(config);
```

Depending on your application, you might:

* load the configuration when the page initializes,
* load it on demand when a form is displayed,
* cache it for reuse across multiple forms,
* or bundle it with other static assets.

The key idea is that the browser only needs the generated configuration data, not the Builder or Model Rules code that produced it.
