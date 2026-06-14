# Configuration

**Version:** 0.2

**Status:** Working Draft

**Scope:** Configuration-side design for model rules in Jivs

---

## 1. Purpose

This document defines the configuration-side design for model rules.

It is the first focused document derived from the earlier unified `ModelRulesService` design work.

This document is intentionally limited to **configuration**.

It does **not** define:

* validation orchestration
* save workflow
* business-error application
* server-response handling
* post-save failure handling

Those belong to separate validation-side design work.

The goal here is to define a configuration abstraction that is:

* reusable
* testable
* UI-independent
* compatible with both business-logic-owned and UI-authored rules
* suitable for subclass-based UI augmentation

---

## 2. Design Direction

This design defines a configuration abstraction focused entirely on producing a configured `ValidationManager`.

The key types are:

* `IModelRules`
* `ModelRulesBase`

The public entry point is:

* `configure()`

`configure()` returns a `ValidationManager`.

The scope of this abstraction is:

* configuration only
* no validation workflow behavior
* no factory-based creation
* callers create an instance directly and pass in `ValidationServices`

Example direction:

```ts
const rules = new PersonEditFormRules(services);
const vm = rules.configure();
```

---

## 3. Non-Goals

This document does not define:

* a model-rules factory
* validation-side helper APIs
* business validation execution
* server-only checks
* save-time failure handling
* the internal design of the `jivs-configanalysis` module

This document does define how configuration-side model rules interact with a config-analysis service when that optional module is installed and registered into `ValidationServices`.

---

## 4. Primary Developer Story

The preferred structured way to configure the ValidationManager is through `IModelRules` / `ModelRulesBase`.

This applies to both:

* business-logic-authored reusable model rules
* UI-authored reusable rules classes

Direct Builder usage remains available as a lower-level alternative, consistent with existing Jivs documentation.

However, the preferred path is to wrap reusable configuration in a model-rules class because it:

* keeps configuration out of page/component code
* improves testability
* creates a stable reusable configuration unit
* supports subclass-based UI customization

---

## 5. Supported Usage Patterns

### 5.1 Business-logic model rules

A business logic developer defines a rules class for a model.

Example:

```ts
class PersonModelRules extends ModelRulesBase {
}
```

This class defines the base configuration through `configureRules()`.

### 5.2 Form subclass of model rules

A UI developer subclasses the model rules class for a specific form or presentation.

Example:

```ts
class PersonEditFormRules extends PersonModelRules implements IModifyModelRulesForUI {
}
```

This subclass inherits the base model configuration and adds UI modifications through `modifyForUI()`.

### 5.3 UI-only reusable rules

A UI developer may define a reusable rules class without inheriting from a business-model rules class.

Example:

```ts
class LoginFormRules extends ModelRulesBase {
}
```

In that case, the class defines its configuration through `configureRules()`.

Further discussion of UI-only guidance is deferred, but this usage remains valid and supported.

---

## 6. Public Contract

### 6.1 Configure options

```ts
interface ModelRulesConfigureOptions {
  configAnalysisOptions?: unknown;
  disableCache?: boolean;
  variantName?: string;
}

interface ModelRulesConfigureParams<
  TConfigureOptions extends ModelRulesConfigureOptions = ModelRulesConfigureOptions,
> {
  options?: TConfigureOptions;
}
```

Notes:

* `variantName` remains part of configuration
* `disableCache` keeps caching on by default, unless explicitly disabled
* `configAnalysisOptions` enables config analysis when it is not `null` or `undefined`. It is passed through to the IConfigAnalysisService.analyze() method to dictate how the analysis works. 
* she shape of `configAnalysisOptions` belongs to the installed config-analysis module, not to `jivs-engine`

### 6.2 IModelRules

```ts
interface IModelRules {
  configure(
    params?: ModelRulesConfigureParams,
  ): ValidationManager;
}
```

`configure()` is the single public entry point.

### 6.3 IModifyModelRulesForUI

```ts
interface IModifyModelRulesForUI {
  modifyForUI(
    builder: ValidationManagerConfigBuilder,
    params?: ModelRulesConfigureParams,
  ): void;
}
```

This is a narrow capability interface.

It is not intended to replace `IModelRules`.

Its purpose is to mark subclasses that add UI modification after base configuration has run.

---

## 7. Base Class Shape

```ts
abstract class ModelRulesBase implements IModelRules {
  protected constructor(
    protected readonly services: ValidationServices,
  );

  public configure(
    params?: ModelRulesConfigureParams,
  ): ValidationManager;

  protected abstract configureRules(
    builder: ValidationManagerConfigBuilder,
    params?: ModelRulesConfigureParams,
  ): void;

  protected getModelRulesKey(): string;

  protected createConfigCacheKey(
    params?: ModelRulesConfigureParams,
  ): string;

  protected createBuilder(
    params?: ModelRulesConfigureParams,
  ): ValidationManagerConfigBuilder;

  protected buildConfig(
    builder: ValidationManagerConfigBuilder,
    params?: ModelRulesConfigureParams,
  ): ValidationManagerConfig;

  protected createValidationManager(
    config: ValidationManagerConfig,
    params?: ModelRulesConfigureParams,
  ): ValidationManager;
}
```

### Method purposes

#### `constructor(services)`

Stores the `ValidationServices` instance used by the rules object.

Subclasses call this through `super(services)`.

It is not intended to be overridden.

#### `configure(params)`

The single public entry point.

It orchestrates the full configuration process:

* cache lookup
* builder creation
* base rules configuration
* optional UI modification
* config finalization
* `ValidationManager` creation

It is not intended to be overridden under normal use.

#### `configureRules(builder, params)`

Defines the main configuration for the rules class.

This is the required subclass hook.

Use it to define the model-oriented rules for a business model, or the full rules for a standalone UI-only rules class.

It is intended to be overridden.

#### `getModelRulesKey()`

Supplies the base identity string used as the first component of the cache key.

The default implementation should return `this.constructor.name`.

Override this only when the default identity is not suitable.

#### `createConfigCacheKey(params)`

Builds the full cache key used for configuration caching.

Its default implementation should use `getModelRulesKey()` together with `variantName` and may be extended by subclasses when additional options affect the produced configuration.

It is intended to be overridable when a subclass needs extra cache-key components.

#### `createBuilder(params)`

Creates the `ValidationManagerConfigBuilder` used during configuration.

Most subclasses should not need to override this.

Keep this protected support method available for framework extensibility.

#### `buildConfig(builder, params)`

Finalizes the builder into `ValidationManagerConfig`.

Most subclasses should not need to override this.

It remains protected for now to keep the framework shape explicit and extensible.

#### `createValidationManager(config, params)`

Creates the `ValidationManager` returned by `configure()`.

Most subclasses should not need to override this.

Keep this protected support method available for framework extensibility.

---

## 8. Configuration Flow

`ModelRulesBase.configure()` owns the overall configuration process.

The high-level behavior is:

1. Determine cache key.
2. Determine whether cache is enabled.
3. Attempt to load cached config.
4. If not cached:

   1. Create the builder.
   2. Run `configureRules()`.
   3. If the instance has `modifyForUI()`, call `builder.startUILayerConfig()`.
   4. Then call `modifyForUI()`.
   5. If `configAnalysisOptions` is not `null` or `undefined`, look up the config-analysis service from `ValidationServices` and, if it exposes `analyze()`, call it with the builder and `configAnalysisOptions`.
   6. Finalize the builder into config.
   7. Store config in cache if enabled.
5. Create a new `ValidationManager` from the config.
6. Return the `ValidationManager`.

Important rule:

* `builder.startUILayerConfig()` is called **only** between `configureRules()` and `modifyForUI()` . It is only used with IModifyModelRulesForUI is implemented.

It is not called before `configureRules()`.

### Pseudocode for `configure()`

```ts
public configure(
  params?: ModelRulesConfigureParams,
): ValidationManager {
  const cacheKey = this.createConfigCacheKey(params);
  const useCache = !params?.options?.disableCache;

  let config: ValidationManagerConfig | null = null;

  if (useCache)
    config = this.tryLoadCachedConfig(cacheKey, params);

  if (!config) {
    const builder = this.createBuilder(params);

    this.configureRules(builder, params);

    const uiRules = this as Partial<IModifyModelRulesForUI>;
    if (typeof uiRules.modifyForUI === "function") {
      builder.startUILayerConfig();
      uiRules.modifyForUI(builder, params);
    }

    const configAnalysisService = this.services.getService(
      MODEL_RULES_CONFIG_ANALYSIS_SERVICE_NAME,
    ) as { analyze?: (target: unknown, options?: unknown) => void } | null;

    if (
      params?.options?.configAnalysisOptions != null &&
      typeof configAnalysisService?.analyze === "function"
    ) {
      configAnalysisService.analyze(
        builder,
        params.options.configAnalysisOptions,
      );
    }

    config = this.buildConfig(builder, params);

    if (useCache)
      this.saveCachedConfig(cacheKey, config, params);
  }

  return this.createValidationManager(config, params);
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
    services: ValidationServices,
  );

  protected override configureRules(
    builder: ValidationManagerConfigBuilder,
    params?: ModelRulesConfigureParams,
  ): void;
}
```

This class defines base model/business configuration only.

It does not implement `IModifyModelRulesForUI`.

### 9.2 Form subclass of model

```ts
class PersonEditFormRules
  extends PersonModelRules
  implements IModifyModelRulesForUI
{
  public constructor(
    services: ValidationServices,
  );

  public modifyForUI(
    builder: ValidationManagerConfigBuilder,
    params?: ModelRulesConfigureParams,
  ): void;
}
```

This class inherits base model rules and adds UI-layer modifications.

### 9.3 Form only

```ts
class LoginFormRules extends ModelRulesBase {
  public constructor(
    services: ValidationServices,
  );

  protected override configureRules(
    builder: ValidationManagerConfigBuilder,
    params?: ModelRulesConfigureParams,
  ): void;
}
```

This class is valid without a separate model rules base class.

---

## 10. Caching

Caching remains a first-class part of this design.

The cached artifact is:

* `ValidationManagerConfig`

The following is **not** cached:

* `ValidationManager`

Reason:

* configuration is static and reusable
* `ValidationManager` is stateful and must be created anew for each `configure()` call

### 10.1 ICachingService

`ICachingService` is a general Jivs infrastructure service, not a model-rules-specific one.

It should be exposed on `ValidationServices`.

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

### 10.2 ValidationServices

`ValidationServices` should expose caching directly.

```ts
class ValidationServices {
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

## 11. Design Notes

### 11.1 Why subclassing was chosen

Two design shapes were considered for UI extension of model rules.

In the subclassing shape:

* a model rules class defines base configuration through `configureRules()`
* a form-specific subclass inherits that configuration
* the form subclass optionally adds `modifyForUI()`

In the factory/composition shape:

* one object would represent the model-specific rules. These would be registered in a factory.
* a second object would represent the form-specific UI augmentation
* the form-specific object would need to invoke the model-specific configuration before applying its own UI changes (using the factory to get the model-specific ModelRules class)
* that approach would require an additional public method whose job was to populate a builder without going through `configure()`

Subclassing was chosen because it keeps the configuration story simpler.

The UI subclass can inherit model configuration directly and then optionally provide UI modification, without requiring that extra public builder-population method.

### 11.2 Why `modifyForUI()` is not on `ModelRulesBase`

`modifyForUI()` is intentionally not part of the base class contract.

If it were on the base class, runtime detection would always succeed and there would need to be a second opt-in mechanism.

Instead, UI modification is treated as an added capability through `IModifyModelRulesForUI`.

### 11.3 Runtime detection approach

At runtime, `configure()` checks only whether `modifyForUI` exists as a function.

For config analysis, `configure()` also checks whether a registered service exposes an `analyze()` function.

This is sufficient for the intended pattern.

---

## 12. Config Analysis Integration

Config analysis is optional and requires the jivs-configanalysis module to be installed and its IConfigAnalysisService to be registered in validationServices via setService().

When the user installs and registers the config-analysis module into `ValidationServices`, `ModelRulesBase.configure()` may invoke it before building the final config.

### 12.1 Service lookup

`jivs-engine` should define a constant service name used to retrieve the config-analysis service from `ValidationServices`.

That same constant should be used by the config-analysis module when registering its service.

Example direction:

```ts
const CONFIG_ANALYSIS_SERVICE_NAME = "ConfigAnalysisService";
```

### 12.2 When analysis runs

Config analysis runs only when:

* `params?.options?.configAnalysisOptions` is not `null` or `undefined`
* a service is registered under the config-analysis service name
* that service exposes an `analyze()` function

### 12.3 What `jivs-engine` knows

`jivs-engine` does not depend on the config-analysis service type.

It does not know the concrete service class.

It does not know the options type.

It only:

* retrieves the registered service by name through ValidationServices.getService()
* checks whether `analyze` exists as a function
* calls `analyze(builder, params.options.configAnalysisOptions)`

### 12.4 What the config-analysis module owns

The config-analysis module owns:

* the config-analysis service type
* the shape of the options parameter
* the internal analysis process
* output behavior such as default console reporting
* customization of analyzer registration

### 12.5 Why this approach was chosen

This keeps `jivs-engine` decoupled from the config-analysis module while still allowing optional integration through `ValidationServices`.

It also lets the config-analysis module remain independently customizable.

---

## 13. Deferred Topics

The following topics are intentionally deferred:

* the internal design of the config-analysis module
* deeper UI-only guidance
* validation-side design
* save workflow design
* server/client validation lifecycle design

---

## 14. New ideas to work through this design

### 14.1 New options for supporting post-save errors

```ts
interface ModelRulesConfigureOptions {
  configAnalysisOptions?: unknown;
  disableCache?: boolean;
  variantName?: string;
  issuesFound?: Array<IssueFound>;
  ExternalIssueFounds?: Array<ExternalIssueFound>;
}
```

* issuesFound - when the call to the server has found Jivs issuesFound, supply it and configure() will call ValidationManager.setIssuesFound()
* ExternalIssueFounds - when the call to the server has found non-Jivs ExternalIssueFounds, supply it and configure() will call ValidationManager.setExternalIssuesFound()


## 15. Current Summary

The current configuration-side design is:

* `IModelRules` is the public contract
* `ModelRulesBase` is the default base implementation
* callers create rules instances directly
* `configure()` is the single public entry point
* `configureRules()` is the required configuration hook
* `IModifyModelRulesForUI` adds optional UI modification through `modifyForUI()`
* `builder.startUILayerConfig()` is called only between base configuration and UI modification
* caching remains first-class
* `ICachingService` is exposed through `ValidationServices`
* config analysis is optional and is invoked through a named service registered in `ValidationServices`
* `configAnalysisOptions` belongs to the config-analysis module, not to `jivs-engine`
