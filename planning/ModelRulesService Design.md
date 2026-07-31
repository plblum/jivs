# Model Rules Service Design

**Version:** 0.8
**Status:** Working Draft
**Scope:** Jivs-Engine
**Source Context:** Jivs README, especially “Configuring Jivs”, plus the prior Model Rules Service draft.

---

## 1. Purpose

Introduce a Jivs-Engine service abstraction:

```ts
IModelRulesService
```

and its default implementation base:

```ts
ModelRulesServiceBase
```

plus a factory:

```ts
IModelRulesServiceFactory
```

`IModelRulesService` packages validation configuration and model-level validation behavior into a reusable rules service.

The goal is to make this the primary structured Jivs configuration story:

```txt
A validation target has a ModelRulesService.
The ModelRulesService uses Builder.
The Builder creates the configuration object tree.
The ValidationManager consumes that configuration.
The ModelRulesService validates through ValidationManager, then applies business errors through ValidationManager.
```

This gives overview-level documentation one mainstream structured path while preserving lower-level direct Builder usage.

---

## 2. Terminology: “Model”

In this design, “model” should be documented broadly.

A model is the validation target.

It may be:

```txt
A formal domain model
A DTO
An entity
A form shape
A login screen
A search panel
A filter object
Any UI-only data set that needs validation
```

So `ModelRulesService` applies to both business-model-driven validation and UI-only validation.

---

## 3. Primary Developer Story

`IModelRulesService` / `ModelRulesServiceBase` should be the recommended structured way to configure Jivs in overview-level documentation.

Main story:

```txt
Use ModelRulesService first when you want a reusable, testable, UI-independent configuration class.
Use Builder inside ModelRulesService.
Use ValidationManager as the configured execution engine.
Use lower-level Builder / ValidationManager APIs directly for simpler or lower-level scenarios.
```

This does not replace Builder.

It packages Builder usage into a clearer service-based workflow.

---

## 4. Two Usage Modes

### 4.1 Business-Model-Driven Usage

A Business Logic Developer creates a model-specific rules service.

Examples:

```ts
PersonModelRulesService
CustomerModelRulesService
OrderModelRulesService
```

The Business Logic Developer defines:

```txt
Model property ValueHosts
Business-owned validators
Cross-field rules
Model-level validation
Server/database/external validation
ExternalIssueFound generation
```

The UI Developer consumes that service and may refine it.

The UI Developer may add:

```txt
Labels
UI-specific error messages
UI-only ValueHosts
UI-only validators
Enablement rules
UI-specific variants
```

### 4.2 UI-Only Usage

Not every UI screen is built around a formal model.

Examples:

```txt
Login screen
Search form
Filter panel
Wizard step with temporary fields
```

In this mode, `IModelRulesService` is unchanged.

The difference is usage:

```txt
Business configuration methods remain unused.
Business validation methods usually remain unused.
The UI configuration method defines all ValueHosts needed by the screen.
```

Reasons to still use a UI-only rules-service class:

```txt
Keep configuration out of page/component code.
Enable testing without DOM, React, Angular, or other UI framework code.
Allow subclasses to define variants of the form.
Provide a stable integration point for companion libraries such as Jivs-DOM, Jivs-Angular, and Jivs-React.
```

UI-only validation may also use Builder directly without `IModelRulesService` when a lower-level approach is preferred.

---

## 5. Public Contract

`IModelRulesService` has two public entry points:

```ts
interface IModelRulesService {
    configure(
        params?: ModelRulesConfigureParams
    ): ValidationManager;

    validate(
        validationManager: ValidationManager,
        params?: ModelRulesValidateParams
    ): Promise<ValidationState>;
}
```

Important decisions:

```txt
No generics are used in this service area to identify model. Model is identified by an abstract method to supply a string for the model identifier.
configure() params are optional.
validate() requires ValidationManager as an explicit direct parameter.
ValidationManager is not part of options.
ModelRulesService is stateless.
ValidationManager owns validation session state.
```

---

## 6. ModelRulesServiceBase

`ModelRulesServiceBase` owns the shared orchestration behavior.

```ts
abstract class ModelRulesServiceBase implements IModelRulesService {
}
```

Model-specific rules services inherit from `ModelRulesServiceBase`.

```ts
class PersonRulesService extends ModelRulesServiceBase {
}
```

UI-only rules services also inherit from `ModelRulesServiceBase`.

```ts
class LoginRulesService extends ModelRulesServiceBase {
}
```

Direct interface implementation is reserved for unusual replacement cases.

```ts
class CustomRulesService implements IModelRulesService {
}
```

`ModelRulesServiceBase` provides completed workflow behavior for:

```txt
Builder orchestration
Business/UI configuration sequencing
Configuration caching through JivsServices.cacheService
ValidationManager validation
Async Jivs validation completion
ExternalIssueFound application through ValidationManager.setExternalIssuesFound()
Final ValidationState retrieval through ValidationManager.getValidationState()
Logging through JivsServices.logService
```

`ModelRulesServiceBase` does not own model identity directly.

It requires subclasses to provide a model/service name string through a protected abstract method.

---

## 7. Factory and Model Identity

Model identity belongs to the factory resolution step.

The factory supports both string identifiers and constructor/type identifiers:

```ts
type ModelIdentifier =
    | string
    | ModelConstructor;

type ModelConstructor =
    new (...args: any[]) => any;
```

String identifiers are required for UI-only validation targets that have no formal model class.

Examples:

```ts
const personRules =
    services.modelRulesServiceFactory.create(PersonModel);

const loginRules =
    services.modelRulesServiceFactory.create("Login");
```

The factory returns a **new service instance** each time.

Factory behavior:

```txt
Registered service found
    → return new registered ModelRulesServiceBase subclass

No registered service found
    → report an error
```

The factory is responsible for resolving the incoming model identifier to the appropriate service.

The identity used for cache keys and logging is ultimately a string.

Open direction:

```txt
The exact normalization strategy between constructor identifiers and string identities is not yet finalized.
The factory may be the best place to normalize model identity into a stable string key.
```

Therefore:

```txt
configure() does not take modelIdentifier.
validate() does not take modelIdentifier.
```

---

## 8. Service Identity

For cache keys and logging, a rules service needs a stable identity.

Decision:

```txt
Primary: explicit model/service name string
Source: factory registration/resolution and subclass implementation
Avoid: constructor.name as authoritative identity by itself
```

Reason:

```txt
constructor.name can be unstable under minification.
Cache and logging require a stable string identity.
Model-specific and UI-only services provide it by overriding a protected abstract method.
```

Candidate base method:

```ts
protected abstract getModelName(): string;
```

---

## 9. JivsServices Integration

Jivs works through `JivsServices`.

Add:

```ts
modelRulesServiceFactory: IModelRulesServiceFactory
```

and:

```ts
cacheService: ICacheService
```

to `JivsServices`.

`ModelRulesService` instances receive `JivsServices` in the constructor.

```ts
class ModelRulesServiceBase {
    public constructor(
        protected readonly services: JivsServices
    ) {
    }
}
```

Diagnostics belong to the existing Jivs logging system.

`configure()` should return only `ValidationManager`.

It should not return cache/debug/config-analysis metadata.

Those should be logged through:

```ts
JivsServices.logService
```

---

## 10. Configuration Side

Public entry point:

```ts
configure(params?: ModelRulesConfigureParams): ValidationManager
```

`configure()` params do not include model identity.

Candidate params:

```ts
interface ModelRulesConfigureParams<
    TConfigureOptions extends ModelRulesConfigureOptions =
        ModelRulesConfigureOptions
> {
    options?: TConfigureOptions;
}
```

Candidate options:

```ts
interface ModelRulesConfigureOptions {
    enableConfigAnalysis?: boolean;
    disableCache?: boolean;
    variantName?: string;
}
```

There is no existing base options type for configuration.

The options object should be subclassable.

Example:

```ts
class PersonRulesConfigureOptions
    implements ModelRulesConfigureOptions {
    enableConfigAnalysis?: boolean;
    disableCache?: boolean;
    variantName?: string;

    includeAddressRules?: boolean;
    requireMiddleName?: boolean;
}
```

`variantName` is a lightweight way to select common configuration variants.

Examples:

```txt
Create
Edit
Admin
Checkout
Search
Login
```

---

## 11. Configuration Workflow

`ModelRulesService.configure()` always runs both configuration phases.

```ts
protected configureBusinessRules(
    builder: IValidationManagerConfigBuilder,
    params?: ModelRulesConfigureParams
): void {
}

protected configureUIRules(
    builder: IValidationManagerConfigBuilder,
    params?: ModelRulesConfigureParams
): void {
}
```

Ordering:

```txt
1. Create or retrieve configuration from cache.
2. If not cached:
   a. Create ValidationManagerConfigBuilder.
   b. Call configureBusinessRules(builder, params).
   c. Call builder.startUILayerConfig().
   d. Call configureUIRules(builder, params).
   e. Finalize builder into ValidationManagerConfig.
   f. Store config in cache if allowed.
3. Create a new ValidationManager from config.
4. Return ValidationManager.
```

Important rule:

```txt
builder.startUILayerConfig() is called between business configuration and UI configuration.
```

UI-only services leave `configureBusinessRules()` empty and define all ValueHosts in `configureUIRules()`.

---

## 12. Configuration Caching

Caching is included now, but cache storage does not belong to `ModelRulesService`.

Caching is handled by:

```ts
JivsServices.cacheService
```

Candidate generic cache service:

```ts
interface ICacheService {
    get<TValue>(key: string): TValue | null;

    set<TValue>(
        key: string,
        value: TValue
    ): void;

    remove(key: string): boolean;

    clear(): void;
}
```

`ModelRulesService.configure()` orchestrates cache lookup and storage.

The cache stores `ValidationManagerConfig`, not `ValidationManager`.

Important distinction:

```txt
Configuration can be cached.
ValidationManager instances are new per configure() call.
```

---

## 13. Cache Key Strategy

Base cache key should use:

```txt
Rules service identity
Variant name
Subclass-specific configuration features
```

Candidate base method:

```ts
protected createConfigCacheKey(
    params?: ModelRulesConfigureParams
): string
```

Default behavior may use:

```txt
serviceKey + "|" + variantName
```

Subclasses can override to include custom options that affect configuration.

Example:

```ts
protected override createConfigCacheKey(
    params?: ModelRulesConfigureParams<PersonConfigureOptions>
): string {
    return [
        this.getModelRulesServiceKey(),
        params?.options?.variantName ?? "",
        params?.options?.includeAddressRules ? "address" : "no-address",
        params?.options?.requireMiddleName ? "middle-required" : "middle-optional"
    ].join("|");
}
```

This avoids trying to serialize arbitrary options generically.

---

## 14. Cache Safety

Some configuration objects may contain function hooks.

Examples:

```txt
CalcValueHost callbacks
Custom condition callbacks
Custom parser/formatter/converter hooks
Event callbacks
Any supplied function references
```

In-memory caching is acceptable.

Persistent JSON-based caching requires later design because function references cannot survive JSON serialization and revival.

Future design should define how to detect or declare cache safety.

Possible directions:

```txt
Mark configuration as memory-cache-only.
Disable persistent cache when function hooks exist.
Expose cacheability analysis.
Let config nodes report serializability.
Allow developers to explicitly disable cache.
Allow developers to provide serialization/revival hooks.
```

---

## 15. Config Analysis Integration

`jivs-configanalysis` is a separate library.

That separation is intentional so production servers can omit the debugging feature.

Dependency direction:

```txt
jivs-configanalysis references jivs-engine.
jivs-engine must not reference jivs-configanalysis.
```

Therefore `ModelRulesService` in Jivs-Engine cannot directly call concrete ConfigAnalysis classes.

`enableConfigAnalysis` is provisional and should be treated as a request through an integration point.

Future design required:

```txt
How ModelRulesService requests config analysis without referencing jivs-configanalysis.
How callers register/provide a config analysis service.
Whether JivsServices exposes an optional interface implemented by jivs-configanalysis.
Whether config analysis is invoked inside configure(), outside configure(), or through a hook.
How config analysis output is returned, logged, or surfaced.
```

---

## 16. Validation Side

Public entry point:

```ts
validate(
    validationManager: ValidationManager,
    params?: ModelRulesValidateParams
): Promise<ValidationState>
```

Candidate params:

```ts
interface ModelRulesValidateParams {
    model?: unknown;
    options?: ModelRulesValidateOptions;
}
```

Candidate options:

```ts
interface ModelRulesValidateOptions extends ValidateOptions {
    variantName?: string;
    shortCircuitWhenDoNotSave?: boolean;
}
```

`ModelRulesValidateOptions` extends existing Jivs `ValidateOptions`.

`validate()` always begins with Jivs validation and may then run business rules validation.

```txt
Stage 1: Jivs validation
Stage 2: Business rules validation when not short-circuited
```

---

## 17. Validation Workflow

`ModelRulesServiceBase.validate()` runs a staged workflow.

```txt
1. Run validateJivsRules().
2. ValidationManager.validate() creates fresh ValidationState and IssuesFound array.
3. Await async Jivs validation completion.
4. Inspect the returned ValidationState.
5. Determine short-circuit behavior from options.shortCircuitWhenDoNotSave.
   When undefined, it behaves as true.
6. If short-circuiting applies and ValidationState.doNotSave is true:
   a. Call applyExternalIssuesFound(..., null, ...).
   b. If that returns false, return the original ValidationState.
   c. If that returns true, return ValidationManager.getValidationState().
7. Run validateBusinessRules().
8. Call applyExternalIssuesFound(..., businessErrors, ...).
9. If that returns false, return the original ValidationState from step 2.
10. If that returns true, return ValidationManager.getValidationState().
```

Important async behavior:

```txt
validate() awaits completion of async Jivs validators.
ValidationManager hooks still fire as individual validators complete.
UI consumers can receive progressive callbacks while validate() awaits final completion.
The short-circuit decision is made only after the Jivs validation stage completes.
```

Important short-circuit behavior:

```txt
Short-circuiting exists to avoid unnecessary business validation work.
This is especially useful when business validation may involve server, database, or other external calls.
The accepted rule is to short-circuit when ValidationState.doNotSave is true.
When short-circuiting, prior business logic errors are cleared through applyExternalIssuesFound(..., null, ...).
```

Important business-error behavior:

```txt
ModelRulesServiceBase does not manually merge ExternalIssueFound into IssueFound.
ValidationManager.setExternalIssuesFound() performs business-error integration.
Business errors are attached to associated ValueHosts when possible.
Unassociated business errors are represented through the ValidationManager’s business-logic error handling mechanism.
The final combined issue list is exposed by ValidationManager after setExternalIssuesFound().
ModelRulesServiceBase does not call ValidationManager.validate() a second time after applying business errors.
Instead it reads the final combined ValidationState through ValidationManager.getValidationState() only when state changed after the initial Jivs validation result.
```

Important callback behavior:

```txt
Two notification waves are accepted in the normal non-short-circuit flow.
One may come from Jivs/value-host validation.
Another may come from business-error application.
Clearing business logic errors may also trigger callbacks in the short-circuit flow.
Anything found to be a validation error may trigger onValueHostValidationStateChanged.
```

---

## 18. Validation Extension Points

Candidate protected methods:

```ts
protected validateJivsRules(
    validationManager: ValidationManager,
    params?: ModelRulesValidateParams
): Promise<ValidationState>;

protected validateBusinessRules(
    validationManager: ValidationManager,
    params?: ModelRulesValidateParams
): Promise<Array<ExternalIssueFound> | null>;

protected applyExternalIssuesFound(
    validationManager: ValidationManager,
    businessErrors: Array<ExternalIssueFound> | null,
    params?: ModelRulesValidateParams
): boolean;
```

Decisions:

```txt
validateJivsRules() is overridable.
validateBusinessRules() is overridable.
applyExternalIssuesFound() is overridable.
validateBusinessRules() returns null when there are no business errors.
applyExternalIssuesFound() remains a thin wrapper around ValidationManager.setExternalIssuesFound().
applyExternalIssuesFound() returns boolean so validate() can decide whether to reuse the original ValidationState or call getValidationState().
Both short-circuit and non-short-circuit paths use applyExternalIssuesFound().
```

---

---

## 19. Final ValidationState

After applying business errors, `ModelRulesServiceBase.validate()` returns a `ValidationState` from `ValidationManager`.

Accepted direction:

```ts
validationManager.getValidationState(options?: ValidateOptions): ValidationState
```

`ValidationManager.getValidationState()` is a public wrapper around the existing internal state-building behavior.

Known facts:

```txt
ValidationManager.validate() creates a fresh ValidationState when Jivs validation runs.
ValidationManager.setExternalIssuesFound() applies business errors but does not itself return ValidationState.
The final state should come from ValidationManager, not from manual merging inside ModelRulesServiceBase.
ModelRulesServiceBase should not call ValidationManager.validate() a second time after applying business errors.
ValidationManager.getValidationState() is a pure read operation.
It does not re-run validators and does not trigger callbacks.
It accepts the full ValidateOptions type.
```

Decision rule:

```txt
If nothing changed manager state after the initial Jivs validation, ModelRulesServiceBase.validate() may return the original ValidationState.
If business logic errors were applied or cleared and state changed, ModelRulesServiceBase.validate() returns ValidationManager.getValidationState().
```

---

## 20. Model-Based and ValueHost-Based Business Validation

`ModelRulesValidateParams` may include:

```ts
model?: any
```

This supports business validation code that prefers to inspect a populated model instance.

Example:

```ts
await personRulesService.validate(
    validationManager,
    {
        model: person
    }
);
```

However, `model` is optional.

`validateBusinessRules()` can also inspect current data through:

```ts
validationManager.vh
```

Two valid validation styles:

```txt
Model-based validation:
Business rules inspect params.model.

ValueHost-based validation:
Business rules inspect validationManager.vh.
```

This supports both business-model-driven and UI-only validation targets.

---

## 21. ExternalIssueFound

`ExternalIssueFound` already exists in Jivs.

`validateBusinessRules()` should return:

```ts
Promise<Array<ExternalIssueFound> | null>
```

`null` means no business errors.

`ModelRulesService.validate()` applies results through:

```ts
validationManager.setExternalIssuesFound(
    businessErrors,
    params?.options
);
```

Because `ModelRulesValidateOptions` extends `ValidateOptions`, the same options can be passed through.

---

## 22. Post-Save / Server Failure Issues

Some business errors are discovered after validation.

Examples:

```txt
Save failed
Server rejected update
Optimistic concurrency failure
Database constraint violation
External service failure
```

These errors are not produced from inside `IModelRulesService.validate()`.

Recommended path:

```txt
1. Validate through IModelRulesService.validate().
2. If valid, attempt save.
3. If save fails, convert server/save failures into ExternalIssueFound objects.
4. Apply those ExternalIssueFound objects to ValidationManager using the same business-error mechanism.
5. Read the updated ValidationState from ValidationManager.
```

Current direction:

```txt
Post-save issue handling should probably use ValidationManager.setExternalIssuesFound().
A separate public helper may still be useful, but it should likely accept ValidationManager, not only a detached ValidationState.
```

Exact helper remains open.

---

## 23. Revised Documentation Direction

Future Jivs documentation should be refactored around these paths.

Structured path:

```txt
1. Create JivsServices.
2. Resolve or instantiate a ModelRulesService.
3. Configure a ValidationManager through the service.
4. Set values into ValueHosts.
5. Validate through the service.
6. Read ValidationState and IssuesFound.
```

Lower-level path:

```txt
1. Create JivsServices.
2. Use Builder directly.
3. Create ValidationManager.
4. Set values into ValueHosts.
5. Validate through ValidationManager.
6. Read ValidationState and IssuesFound.
```

Detailed child documents can cover:

```txt
Builder API
ValidationManager
ValueHosts
Conditions
Validators
JivsServices
Factories
Config analysis integration
Advanced UI-layer configuration
Async validation
Post-save/server error application
Testing
```

---

## 24. Decisions Captured

```txt
J-001: ExternalIssueFound already exists and should be used.
J-002: validateBusinessRules() returns null when there are no business errors.
J-003: setExternalIssuesFound() replace/clear behavior is used.
J-004: ModelRulesValidateOptions extends ValidateOptions.
J-005: No existing base options type for configuration.
J-006: configure() returns ValidationManager only; diagnostics use logService.
J-007: configure() params are optional.
J-008: validate() takes ValidationManager as direct explicit parameter.
J-009: Factory returns new service instances.
J-010: Caching is through JivsServices.cacheService.
J-011: Service identity uses a stable string name.
J-012: Protected config methods receive params, not just options.
J-013: Protected config method order is builder first, params second.
J-014: ModelRulesService is the overview-level recommended structured configuration path.
J-015: “Model” is documented broadly as validation target.
J-016: ModelRulesServiceBase is the normal base path; direct interface implementation is for unusual cases.
J-017: Separate business and UI protected methods are kept.
J-018: Factory does not fall back to a default concrete rules service.
J-019: Unknown identifiers reported to the factory are errors.
J-020: Factory supports both string and constructor identifiers.
J-021: configure() always calls both phases; base methods are empty.
J-022: ModelRulesValidationMode was considered but abandoned.
J-023: validate() always begins with Jivs validation and may then run business validation.
J-024: validate() starts fresh through ValidationManager.validate().
J-025: validate() awaits completion of async Jivs validation.
J-026: Business errors are integrated through ValidationManager.setExternalIssuesFound().
J-027: No generics are used in this service area.
J-028: ModelRulesServiceBase is non-generic.
J-029: UI-only rules-service subclasses are valid and may leave business methods empty.
J-030: Model-specific and UI-only services must provide identity by overriding a protected abstract method.
J-031: shortCircuitWhenDoNotSave is an explicit option.
J-032: If shortCircuitWhenDoNotSave is undefined, it behaves as true.
J-033: When short-circuiting on doNotSave, prior business errors are cleared.
J-034: In the short-circuit path, if clearing business errors does not change state, validate() may return the original ValidationState.
J-035: In the normal path, applyExternalIssuesFound() determines whether validate() reuses the original ValidationState or calls getValidationState().
J-036: ValidationManager exposes getValidationState() as a public wrapper over internal state creation.
J-037: validateJivsRules(), validateBusinessRules(), and applyExternalIssuesFound() are all overridable.
J-038: applyExternalIssuesFound() remains a thin wrapper with overridability.
J-039: Both short-circuit and non-short-circuit paths use applyExternalIssuesFound().
J-040: Two notification waves are accepted in the normal two-stage flow.
J-041: ValidationManager is a reusable stateful session object.
J-042: ModelRulesServiceBase is stateless.
J-043: ValidationManager.getValidationState() is core to the architecture.
J-044: Just use ExternalIssueFound.
```

## 25. Open Issues

```txt
J-045: Define how config analysis integrates without jivs-engine referencing jivs-configanalysis.
J-046: Finalize the exact normalization strategy from ModelIdentifier into stable string identity inside factory resolution.
J-047: Define exact registration/resolution mechanics in IModelRulesServiceFactory for constructor and string identifiers.
J-048: Determine whether a public helper for post-save/server errors is needed.
J-050: How to handle hooking up with jivs-configanalysis
J-051: Capturing IssuesFound generated by a call to the server, such as the result of saving. As you know, saving must also run all validation to avoid attacks. It must provide that info to the client for display of validators.
J-052: Restoring ValidationManager state after a page posts back and redraws
```

---

## 26. Recommended Example Shape

### Business-model-driven example

```ts
const rulesService =
    services.modelRulesServiceFactory.create(PersonModel);

const validationManager = rulesService.configure({
    options: {
        variantName: "Edit"
    }
});

const validationState = await rulesService.validate(
    validationManager,
    {
        model: person,
        options: {
            shortCircuitWhenDoNotSave: true
        }
    }
);
```

### UI-only direct Builder example

```ts
const services = createJivsServices("en-US");
const builder = build(services);

builder
    .input("StartDate", LookupKey.Date, { label: "Start date" })
    .lessThan("EndDate")
    .lessThanOrEqual(
        "NumOfDays",
        { valueHostName: "DiffDays" }
    );

builder.input("EndDate", LookupKey.Date, { label: "End date" });
builder.calc("DiffDays", LookupKey.Number, calculateDiffDays);
builder.static("NumOfDays", LookupKey.Number, { initialValue: 30 });

const validationManager = new ValidationManager(builder);

startDateInput.addEventListener("change", () => {
    validationManager.vh.input("StartDate").setTextValue(
        startDateInput.value,
        { validate: true }
    );
});

endDateInput.addEventListener("change", () => {
    validationManager.vh.input("EndDate").setTextValue(
        endDateInput.value,
        { validate: true }
    );
});

const validationState = validationManager.validate();
```

### UI-only `ModelRulesService` example

```ts
class DateRangeRulesService extends ModelRulesServiceBase {
    protected override getModelName(): string {
        return "DateRange";
    }

    protected override configureUIRules(
        builder: IValidationManagerConfigBuilder
    ): void {
        builder
            .input("StartDate", LookupKey.Date, { label: "Start date" })
            .lessThan("EndDate")
            .lessThanOrEqual(
                "NumOfDays",
                { valueHostName: "DiffDays" }
            );

        builder.input("EndDate", LookupKey.Date, { label: "End date" });
        builder.calc("DiffDays", LookupKey.Number, calculateDiffDays);
        builder.static("NumOfDays", LookupKey.Number, { initialValue: 30 });
    }
}

const rulesService = new DateRangeRulesService(services);
const validationManager = rulesService.configure();

startDateInput.addEventListener("change", () => {
    validationManager.vh.input("StartDate").setTextValue(
        startDateInput.value,
        { validate: true }
    );
});

endDateInput.addEventListener("change", () => {
    validationManager.vh.input("EndDate").setTextValue(
        endDateInput.value,
        { validate: true }
    );
});

const validationState = await rulesService.validate(
    validationManager
);
```

---

## 27. Summary

`IModelRulesService` and `ModelRulesServiceBase` give Jivs a clearer structured story.

They keep Builder and ValidationManager as the underlying engine, but package them into a service-oriented workflow that supports:

```txt
Business-model-driven validation
UI-only validation through explicit concrete rules services
Configuration caching
Async validator completion
Short-circuiting before business validation when doNotSave is already true
ExternalIssueFound integration
Final ValidationState retrieval through ValidationManager.getValidationState()
Stable string-based service identity
Factory-based service resolution for string and constructor identifiers
```

That gives overview documentation one clean structured path while preserving the lower-level extensibility that already exists in Jivs.

# Pseudocode considering many parts as of v0.7

```ts

interface JivsServices {
    modelRulesServiceFactory?: IModelRulesServiceFactory;
    cacheService?: unknown;
    logService?: {
        debug?(messageFactory: () => string): void;
    };
}


class ValidationManager {

    public getValidationState(_options?: ValidateOptions): ValidationState {
        return this.createValidationState(_options);
    }
}

interface ModelRulesConfigureParams {
    options?: {
        variantName?: string;
        disableCache?: boolean;
    };
}

interface ModelRulesValidateOptions extends ValidateOptions {
    variantName?: string;
    shortCircuitWhenDoNotSave?: boolean;
}

interface ModelRulesValidateParams {
    model?: any;
    options?: ModelRulesValidateOptions;
}

interface IModelRulesService {
    configure(params?: ModelRulesConfigureParams): ValidationManager;

    validate(
        validationManager: ValidationManager,
        params?: ModelRulesValidateParams
    ): Promise<ValidationState>;
}

abstract class ModelRulesServiceBase {
    public constructor(
        protected readonly services: JivsServices
    ) {}

    protected abstract getModelName(): string;

    protected createConfigCacheKey(
        params?: ModelRulesConfigureParams
    ): string {
        return [
            this.getModelName(),
            params?.options?.variantName ?? ""
        ].join("|");
    }

    public configure(_params?: ModelRulesConfigureParams): ValidationManager {
        // ... not fully shown here ...
        return new ValidationManager();
    }

    public async validate(
        validationManager: ValidationManager,
        params?: ModelRulesValidateParams
    ): Promise<ValidationState> {
        const jivsState = await this.validateJivsRules(
            validationManager,
            params
        );

        const shortCircuit =
            params?.options?.shortCircuitWhenDoNotSave ?? true;

        if (shortCircuit && jivsState.doNotSave) {
            const changed = this.applyExternalIssuesFound(
                validationManager,
                null,
                params
            );
            return changed
                ? validationManager.getValidationState(params?.options)
                : jivsState;
        }

        const businessErrors = await this.validateBusinessRules(
            validationManager,
            params
        );

        const changed = this.applyExternalIssuesFound(
            validationManager,
            businessErrors,
            params
        );

        return changed
            ? validationManager.getValidationState(params?.options)
            : jivsState;
    }

    protected async validateJivsRules(
        validationManager: ValidationManager,
        params?: ModelRulesValidateParams
    ): Promise<ValidationState> {
        return validationManager.validate(params?.options);
    }

    protected async validateBusinessRules(
        _validationManager: ValidationManager,
        _params?: ModelRulesValidateParams
    ): Promise<Array<ExternalIssueFound> | null> {
        return null;
    }

    protected applyExternalIssuesFound(
        validationManager: ValidationManager,
        businessErrors: Array<ExternalIssueFound> | null,
        params?: ModelRulesValidateParams
    ): boolean {
        return validationManager.setExternalIssuesFound(
            businessErrors,
            params?.options
        );
    }
}

class PersonModel {}

class PersonModelRulesService
    extends ModelRulesServiceBase
    implements IModelRulesService
{
    protected override getModelName(): string {
        return "PersonModel";
    }

    protected override async validateBusinessRules(
        _validationManager: ValidationManager,
        params?: ModelRulesValidateParams
    ): Promise<Array<ExternalIssueFound> | null> {
        if (!params?.model) {
            return null;
        }

        if ((params.model as any).lastName === "Blocked") {
            return [
                {
                    errorMessage: "Blocked person.",
                    associatedValueHostName: "LastName"
                }
            ];
        }

        return null;
    }
}

class LoginRulesService
    extends ModelRulesServiceBase
    implements IModelRulesService
{
    protected override getModelName(): string {
        return "Login";
    }

    protected override configureUIRules(
        builder: IValidationManagerConfigBuilder
    ): void {
        builder.input("UserName", LookupKey.String).requireText();
        builder.input("Password", LookupKey.String).requireText();
    }
}

type ModelRulesServiceCtor =
    new (services: JivsServices) => IModelRulesService;

interface IModelRulesServiceFactory {
    register(
        modelIdentifier: ModelIdentifier,
        serviceCtor: ModelRulesServiceCtor
    ): void;

    create(
        modelIdentifier: ModelIdentifier
    ): IModelRulesService;
}

class ModelRulesServiceFactory implements IModelRulesServiceFactory {
    private readonly registry = new Map<string, ModelRulesServiceCtor>();

    public constructor(
        private readonly services: JivsServices
    ) {}

    public register(
        modelIdentifier: ModelIdentifier,
        serviceCtor: ModelRulesServiceCtor
    ): void {
        const key = this.normalizeModelIdentifier(modelIdentifier);
        this.registry.set(key, serviceCtor);
    }

    public create(
        modelIdentifier: ModelIdentifier
    ): IModelRulesService {
        const key = this.normalizeModelIdentifier(modelIdentifier);
        const serviceCtor = this.registry.get(key);

        if (!serviceCtor) {
            throw new Error(
                `No ModelRulesService registered for '${key}'.`
            );
        }

        return new serviceCtor(this.services);
    }

    protected normalizeModelIdentifier(
        modelIdentifier: ModelIdentifier
    ): string {
        if (typeof modelIdentifier === "string") {
            return modelIdentifier;
        }

        const ctorName = modelIdentifier.name?.trim();
        if (!ctorName) {
            throw new Error(
                "Model constructor must have a stable name or use a string model identifier."
            );
        }

        return ctorName;
    }
}

// Example usage

const services: JivsServices = {};
const factory = new ModelRulesServiceFactory(services);

// Register with constructor
factory.register(PersonModel, PersonModelRulesService);

// Register with string
factory.register("Login", LoginRulesService);

// Resolve by constructor -> gets registered model-specific service
const personRules = factory.create(PersonModel);

// Resolve by string -> gets registered UI-only service
const loginRules = factory.create("Login");

// Resolve an unregistered identifier -> error
factory.create("Checkout");

/*
Current direction:

- Normalize inside the factory.
- Store registrations by normalized string key.
- Require explicit registration.
- Require concrete rules-service classes for both model-specific and UI-only cases.

That produces one consistent identity story:
ModelIdentifier -> normalized string key -> explicit service resolution -> cache/logging identity
*/
```
