# Configuration

**Version:** 0.3

**Status:** Working Draft

**Scope:** Configuration-side design for model rules in Jivs

---

## 1. Purpose

This document defines the configuration-side design for model rules.

_Premise_: In Jivs, users are expected to place their validation rules in separate areas from their UI code,
and if possible, do it in a reusable and testable way. At this time, we have some great tools to help them
through the Builder object's fluent syntax, but we don't have a nice story to package rules by individual models
and/or forms. A revised approach will involve a class from which each model or form rules are introduced.
Within the class are methods that let the developer add their rules, still using the Builder's fluent syntax.

The goal here is to define a configuration abstraction that is:

* reusable
* testable
* UI-independent
* compatible with both business-logic-owned and UI-authored rules
* suitable for subclass-based UI augmentation

---

## 2. Design Direction

This design defines a configuration abstraction focused entirely on producing a configured `ValueHostsManager`.

The key types are:

* `IRules` - interface
* `RulesBase` - abstract base implementing IRules
* `ModelRulesBase` - abstract base subclassing RulesBase specifically targetting business logic model rules
* `FormRulesBase` - abstract base subclassing RulesBase specifically targetting Forms that do not have an associated Model.
* `IAdaptModelRulesToForm` - Interface used by Form developers who subclass from a ModelRules class to adapt it to their form.

The IRules public entry point is:

* `configure()`

`configure()` returns a `ValueHostsManagerConfig`.

The scope of this abstraction is:

* configuration only
* no validation workflow behavior
* no factory-based creation
* callers create an instance directly and pass in `JivsServices`

Example direction:

```ts
const rules = new PersonEditFormRules(services);
const config = rules.configure();
config.onValidationStateChanged = (parms)=> {}; // various callbacks hooked up
const vhm = new ValueHostsManager(config);
```

---

## 3. API overview

```ts
interface IRules {
  configure(
    options?: RulesConfigOptions
  ): ValueHostsManagerConfig;
}

abstract class RulesBase implements IRules {}

abstract class ModelRulesBase extends RulesBase {}

abstract class FormRulesBase extends RulesBase {}

interface IAdaptModelRulesToForm {
  adaptToForm(
    builder: IValueHostsManagerConfigBuilder,
    options?: RulesConfigureOptions,
  ): void;
}
```

---

## 4. Primary Developer Story

The preferred structured way to configure the ValueHostsManager is through this system (`IRules`, `RulesBase`, etc)
instead of using the Builder directly because it wraps fixed rules in a class with these benefits:

* keeps configuration out of page/component code
* improves testability
* creates a stable reusable configuration unit on both client and server
* supports subclass-based Form customization

This applies to both:

* business-logic-authored reusable model rules
* UI-authored reusable rules classes

`RulesBase` consumes the Builder so that the developer can create fluent syntax for configurations. Thus the Builder
remains an essential tool, but the developer doesn't create it. They just consume it.

Direct Builder without it usage remains available as a lower-level alternative, consistent with existing Jivs documentation.

---

## 5. Supported Usage Patterns

### 5.1 Business-logic model rules

A business logic developer defines a rules class for a model by subclassing `ModelRulesBase`.
The class defines the model's configuration through `configureRules()` which is abstract in `ModelRulesBase`.

Example:

```ts
class PersonModelRules extends ModelRulesBase {
  public configureRules(builder: IValueHostsManagerConfigBuilder, options?: RulesConfigOptions)
  {
    // setup rules for Person model using the builder
  }
}
```



### 5.2 Forms that start with a model

A UI developer subclasses the model rules class for a specific form or presentation
and implements `IAdaptModelRulesToForm`. This is mostly used to override a business logic's model configuration, 
but could be used with a form's configuration to provide variations.

Example:

```ts
class PersonEditFormRules extends PersonModelRules implements IAdaptModelRulesToForm {
  public adaptToForm(builder: IValueHostsManagerConfigBuilder,
    options?: RulesConfigOptions): void {
      // update existing ValueHosts and add any that are Form specific
    }
}
```

This subclass inherits the base model configuration and adds UI modifications through `adaptToForm()`.

### 5.3 Form-only rules

A UI developer may define a rules class without inheriting from a business-model rules class
by subclassing `FormRulesBase`. In this case, they don't have a model. Instead, they override
`configureRules()` to supply all rules needed by the form. No need to implement `IAdaptModelRulesToForm` here.

Example:

```ts
class LoginFormRules extends FormRulesBase {
  public configureRules(builder: IValueHostsManagerConfigBuilder, options?: RulesConfigOptions)
  {
    // setup rules for Login form using the builder
  }  
}
```
---

## 6. Public Contract

### 6.1 Configure options

```ts
interface RulesConfigOptions {
  configAnalysisOptions?: unknown;
  disableCache?: boolean;
  variantName?: string;
}
```

Notes:

* `variantName` Developer can use this to allow the caller to execute a named variant.
Its used at the developer's discretion.
* `disableCache` keeps caching on by default, unless explicitly disabled
* `configAnalysisOptions` enables config analysis when it is not `null` or `undefined`. It is passed through to the IConfigAnalysisService.analyze() method to dictate how the analysis works. 
* The shape of `configAnalysisOptions` belongs to the installed config-analysis module, not to `jivs-engine`

### 6.2 IRules

```ts
interface IRules {
  configure(
    options?: RulesConfigOptions,
  ): ValueHostsManagerConfig;
}
```

`configure()` is the single public entry point. It returns a new ValueHostsManager.

### 6.3 IAdaptModelRulesToForm

```ts
interface IAdaptModelRulesToForm {
  adaptToForm(
    builder: IValueHostsManagerConfigBuilder,
    options?: RulesConfigOptions
  ): void;
}
```

This is a narrow capability interface.

It is not intended to replace `IRules`.

Its purpose is to mark subclasses that add Form modification after Model configuration has run.
It targets the UI developer who is working on a form against a business logic model so they
can focus on the changes needed to achieve the correct user experience.

---

## 7. Base Class Shape

```ts
abstract class RulesBase implements IRules {
  protected constructor(
    protected readonly services: JivsServices,
  );

  public configure(
    options?: RulesConfigOptions,
  ): ValueHostsManagerConfig;

  protected abstract configureRules(
    builder: IValueHostsManagerConfigBuilder,
    options?: RulesConfigOptions,
  ): void;

  protected getModelRulesKey(): string;

  protected createConfigCacheKey(
    options?: RulesConfigOptions,
  ): string;

  protected createBuilder(
    options?: RulesConfigOptions,
  ): ValueHostsManagerConfigBuilder;

  protected buildConfig(
    builder: IValueHostsManagerConfigBuilder,
    options?: RulesConfigOptions,
  ): ValueHostsManagerConfig;

  protected configAnalysis(builder: IValueHostsManagerConfigBuilder, options?: RulesConfigOptions): void;

}

abstract class ModelRulesBase extends RulesBase {}
abstract class FormRulesBase extends RulesBase {}
```

### Method purposes

#### `constructor(services)`

Stores the `JivsServices` instance used by the rules object.

Subclasses call this through `super(services)`.

It is not intended to be overridden.

#### `configure(options)`

The single public entry point.

It orchestrates the full configuration process:

* cache lookup
* builder creation
* base rules configuration
* optional UI modification
* run optional ConfigAnalysis
* config finalization
* cache storage

It is not intended to be overridden under normal use.

#### `configureRules(builder, options)`

Defines the main configuration for the rules class.

This is the required subclass hook (an abstract method).

Override to define the model-oriented rules for a business model, or the full rules for a standalone UI-only rules class.

#### `getModelRulesKey()`

Part of caching the configuration.

Supplies the base identity string used as the first component of the cache key.

The default implementation should return `this.constructor.name`.

Override this only when the default identity is not suitable.

#### `createConfigCacheKey(options)`

Part of caching the configuration.

Builds the full cache key used for configuration caching.

Its default implementation should use `getModelRulesKey()` together with `variantName` and may be extended by subclasses when additional options affect the produced configuration.

It is intended to be overridable when a subclass needs extra cache-key components.

#### `createBuilder(options)`

Creates the `ValueHostsManagerConfigBuilder` used during configuration.

Most subclasses should not need to override this.

Keep this protected support method available for framework extensibility.

#### `buildConfig(builder, options)`

Finalizes the builder into `ValueHostsManagerConfig`.

Most subclasses should not need to override this.

It remains protected for now to keep the framework shape explicit and extensible.

#### `configAnalysis(builder, options)`

When options.configAnalysisOptions is assigned and the configAnalysis service is present,
it performs the analysis. It outputs results usually to the console. Use during non-production situations.
---

## 8. Configuration Flow

`RulesBase.configure()` owns the overall configuration process.

The high-level behavior is:

1. Determine cache key.
2. Determine whether cache is enabled.
3. Attempt to load cached config.
4. If not cached:

   1. Create the builder.
   2. Run `configureRules()`.
   3. If the instance has `adaptToForm()`, call `builder.startUILayerConfig()`. Then call `adaptToForm()`.
   4. If `configAnalysisOptions` is not `null` or `undefined`, look up the config-analysis service from `JivsServices` and, 
      if it exposes `analyze()`, call it with the builder and `configAnalysisOptions`.
   5. Finalize the builder into config.
   6. Store config in cache if enabled.
5. Return the `ValueHostsManagerConfig`.

Important rule:

* `builder.startUILayerConfig()` is called **only** between `configureRules()` and `adaptToForm()` . It is only used with `IAdaptModelRulesToForm` is implemented.

It is not called before `configureRules()`.

### Pseudocode for `configure()`

```ts
public configure(
  options?: RulesConfigOptions,
): ValueHostsManager {
  let config: ValueHostsManagerConfig | null = null;
  const cacheKey = this.createConfigCacheKey(options);
  const useCache = !options?.options?.disableCache;


  if (useCache)
    config = this.tryLoadCachedConfig(cacheKey, options);

  if (!config) {
    const builder = this.createBuilder(options);

    this.configureRules(builder, options);

    const uiRules = this as Partial<IAdaptModelRulesToForm>;
    if (typeof uiRules.adaptToForm === "function") {
      builder.startUILayerConfig();
      uiRules.adaptToForm(builder, options);
    }
    this.configAnalysis(builder, options);

    config = this.buildConfig(builder, options);

    if (useCache)
      this.saveCachedConfig(cacheKey, config, options);
  }

  return config;
}
```

This uses duck-typing for both:

* UI modification
* config-analysis service discovery

Only the method name is checked at runtime.

---

## 9. Subclass Patterns

### 9.1 Model alone

```ts
class PersonModelRules extends ModelRulesBase {
  public constructor(
    services: JivsServices,
  );

  protected override configureRules(
    builder: IValueHostsManagerConfigBuilder,
    options?: RulesConfigOptions,
  ): void;
}
```

This class defines base model/business configuration only.

It does not implement `IAdaptModelRulesToForm`.

### 9.2 Form subclass of model

```ts
class PersonEditFormRules
  extends PersonModelRules
  implements IAdaptModelRulesToForm
{
  public constructor(
    services: JivsServices,
  );

  public adaptToForm(
    builder: IValueHostsManagerConfigBuilder,
    options?: RulesConfigOptions,
  ): void;
}
```

This class inherits base model rules and adds UI-layer modifications.

### 9.3 Form only

```ts
class LoginFormRules extends FormRulesBase {
  public constructor(
    services: JivsServices,
  );

  protected override configureRules(
    builder: IValueHostsManagerConfigBuilder,
    options?: RulesConfigOptions,
  ): void;
}
```

This class is valid without a separate model rules base class.

---

## 10. Caching

Caching remains a first-class part of this design.

The cached artifact is:

* `ValueHostsManagerConfig`

The following is **not** cached:

* `ValueHostsManager`

Reason:

* configuration is static and reusable
* `ValueHostsManager` is stateful and must be created anew for each `configure()` call

#### Caching Configuration Notes
A configuration may contain callbacks and function pointers. These are not intended to survive
a page regeneration. 

* Callbacks are found on the top level ValueHostsManagerConfig, like onValidationStateChanged. They are expected to be reassigned 
as part of the Rules configuration like this:
  ```ts
  let config = rules.configure(options);
  config.onValidationStateChanged = (params)=> {};  // and others
  let vhm = new ValueHostsManager(config);
  ```
* Functions are buried inside of conditions and cannot be restored. In this case, do not use caching.



### 10.1 ICachingService

`ICachingService` is a general Jivs infrastructure service, not a model-rules-specific one.

It should be exposed on `JivsServices`.

```ts
interface ICachingService {
  get<TValue>(key: string): TValue | null;

  set<TValue>(
    key: string,
    value: TValue,
  ): void;

  remove(key: string): boolean;

  clear(): void;
}
```

### 10.2 JivsServices

`JivsServices` should expose caching directly.

```ts
class JivsServices {
  public cachingService: ICachingService;
}
```

### 10.3 Cache behavior

Cache use remains on by default.

`disableCache` disables cache participation for that `configure()` call.

### 10.4 Cache key strategy

The cache key should be built from:

* the model-rules key
* `variantName`
* subclass-specific configuration values that materially affect the produced config

The first component comes from:

```ts
protected getModelRulesKey(): string {
  return this.constructor.name;
}
```

Subclasses may override either:

* `getModelRulesKey()`
* `createConfigCacheKey()`

The expected pattern is that `createConfigCacheKey()` uses `getModelRulesKey()` as its first component and may append subclass-specific values.

---

## 12. Design Notes

### 11.1 Why subclassing was chosen

Two design shapes were considered for UI extension of model rules.

In the subclassing shape:

* a model rules class defines base configuration through `configureRules()`
* a form-specific subclass inherits that configuration
* the form subclass optionally adds `adaptToForm()`

In the factory/composition shape:

* one object would represent the model-specific rules. These would be registered in a factory.
* a second object would represent the form-specific UI augmentation
* the form-specific object would need to invoke the model-specific configuration before applying its own UI changes (using the factory to get the model-specific ModelRules class)
* that approach would require an additional public method whose job was to populate a builder without going through `configure()`

Subclassing was chosen because it keeps the configuration story simpler.

The UI subclass can inherit model configuration directly and then optionally provide UI modification, without requiring that extra public builder-population method.

### 11.2 Why `adaptToForm()` is not on `RulesBase`

`adaptToForm()` is intentionally not part of the base class contract.

If it were on the base class, runtime detection would always succeed and there would need to be a second opt-in mechanism.

Instead, UI modification is treated as an added capability through `IAdaptModelRulesToForm`.

### 11.3 Runtime detection approach

At runtime, `configure()` checks only whether `adaptToForm` exists as a function.

For config analysis, `configure()` also checks whether a registered service exposes an `analyze()` function.

This is sufficient for the intended pattern.

---

## 12. Config Analysis Integration

Config analysis is optional and requires the jivs-configanalysis module to be installed and its IConfigAnalysisService to be registered in services via setService().

When the user installs and registers the config-analysis module into `JivsServices`, `RulesBase.configure()` may invoke it before building the final config.

### 12.1 Service lookup

`jivs-engine` should define a constant service name used to retrieve the config-analysis service from `JivsServices`.

That same constant should be used by the config-analysis module when registering its service.

Example direction:

```ts
const CONFIG_ANALYSIS_SERVICE_NAME = "ConfigAnalysisService";
```

### 12.2 When analysis runs

Config analysis runs only when:

* options?.configAnalysisOptions` is not `null` or `undefined`
* a service is registered under the config-analysis service name
* that service exposes an `analyze()` function

```ts
protected configAnalysis(builder: ValueHostsManager, options?: RulesConfigOptions): void
{
    if (!options?.configAnalysisOptions)
      return;
    const configAnalysisService = this.services.getService(
      CONFIG_ANALYSIS_SERVICE_NAME,
    ) as { analyze?: (target: unknown, options?: unknown) => void } | null;

    if (typeof configAnalysisService?.analyze === "function"
    ) {
      configAnalysisService.analyze(
        builder,
        options.configAnalysisOptions,
      );
    }
}
```

### 12.3 What `jivs-engine` knows

`jivs-engine` does not depend on the config-analysis service type.

It does not know the concrete service class.

It does not know the options type.

It only:

* retrieves the registered service by name through JivsServices.getService()
* checks whether `analyze` exists as a function
* calls `analyze(builder, params.options.configAnalysisOptions)`
* Provides the services object to allow analyze to access many other services,
including the loggerService through which it may generate a report.

### 12.4 What the config-analysis module owns

The config-analysis module owns:

* the config-analysis service type
* the shape of the options parameter
* the internal analysis process
* output behavior such as default console reporting
* customization of analyzer registration

### 12.5 Why this approach was chosen

This keeps `jivs-engine` decoupled from the config-analysis module while still allowing optional integration through `JivsServices`.

It also lets the config-analysis module remain independently customizable.

---

## 14. Page regeneration

*This is not really a configuration issue as much as its a workflow that happens side-by-side with configuration.*

The ValueHostsManager gets discarded when a page posts back and gets a fresh copy.
This process happens in many situations like MVC and ASP.NET webforms.

A round-trip may be the result of errors on the server, and the server will
supply those errors in some way to the client. The configuration process is followed by
applying those errors to the new ValueHostsManager instance.

### Jivs on the server-side
The server side code must pass along the string from its ValueHostsManager.toValidationPayload().

The client adds this call to the ValueHostsManager: `vhm.fromValidationPayload(payload)`.

```ts
let payload = getJivsPayload(); // user's code
const rules = new PersonEditFormRules(services);
const config = rules.configure();
config.onValidationStateChanged = (parms)=> {}; // various callbacks hooked up
const vhm = new ValueHostsManager(config);
if (payload)
  vhm.fromValidationPayload(payload);
```

### Other server side code
The server sends errors to the client in its own format. On the client,
retrieve them and convert them into an array of `IssueFound`. Then pass the 
IssuesFound to ValueHostsManager: `vhm.addExternalIssuesFound(issuesFound, false)`.

```ts
let issuesFound = getIssuesFound(); // user's code to retrieve errors and return an array of IssueFound objects.
const rules = new PersonEditFormRules(services);
const config = rules.configure();
config.onValidationStateChanged = (parms)=> {}; // various callbacks hooked up
const vhm = new ValueHostsManager(config);
if (issuesFound?.length > 0)
  vhm.addExternalIssuesFound(issuesFound, false);
```
