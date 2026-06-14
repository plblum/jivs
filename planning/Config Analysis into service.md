# Revising ConfigAnalysis to become a service

**Version:** 0.2
**Status:** Working Draft
**Scope:** Design changes for `jivs-configanalysis`

---

## 1. Purpose

This document defines the design direction for evolving `jivs-configanalysis`.

It focuses on refactoring the current runner-based entry point into a service-oriented and customizable design.

This document is about `jivs-configanalysis` itself.

It is intended to guide refactoring of that module.

The only external integration concern covered here is registration into `ValidationServices` under a shared service-name constant.

---

## 2. Current Design

Today, `jivs-configanalysis` is centered on the `Runner.ts` entry point.

The README shows the intended usage as a call to `analyze()` on either:

* a `ValidationManagerConfigBuilder`
* a `ValidationManagerConfig`

Example direction today:

```ts
import { analyze } from "@plblum/jivs-configanalysis/build/runner";

let explorer = analyze(builder);
```

or:

```ts
import { analyze } from "@plblum/jivs-configanalysis/build/runner";

let explorer = analyze(config);
```

The current design is useful, but it has limitations:

* the entry point is function-oriented rather than service-oriented
* customization is centered too much in one runner implementation
* users who want to customize analyzer registration have too little structure to override cleanly
* reporting and orchestration are too concentrated in one place

---

## 3. Design Goal

The new goal is to make `jivs-configanalysis` center on a service object rather than a free runner function.

That service should:

* expose an `analyze()` entry point
* own its own reporting behavior
* be customizable by subclassing
* register analyzer sets through overridable child methods
* be easy to register into `ValidationServices`

---

## 4. High-Level Direction

The design direction is:

* replace the central `Runner.ts` function-oriented story with a service object
* register that service into `ValidationServices` through `setService()`
* keep config-analysis-specific types and options owned by `jivs-configanalysis`
* make service behavior and analyzer registration easy to customize by subclassing

This keeps the public design centered on `jivs-configanalysis` itself, rather than on a helper function.

---

## 5. Service Registration Story

`jivs-configanalysis` should be installable into `ValidationServices` using the existing service registry.

That means:

* a shared constant supplies the service name
* `jivs-configanalysis` uses that constant when registering its service
* callers install the service explicitly in non-production or development/testing scenarios

Example direction:

```ts
const CONFIG_ANALYSIS_SERVICE_NAME = "ConfigAnalysisService";
```

Registration conceptually looks like:

```ts
services.setService(CONFIG_ANALYSIS_SERVICE_NAME, new ConfigAnalysisService());
```

This makes config analysis optional and explicitly installed.

Typically the user will go into the createValidationServices() function to add a line like that shown above.

---

## 6. Public Entry Point

The primary entry point should move from a free function in `Runner.ts` to a service object with an `analyze()` method.

Conceptual shape:

```ts
interface IConfigAnalysisService {
  analyze(
    target: ValidationManagerConfigBuilder,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  analyze(
    target: ValidationManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;
}
```

Notes:

* `analyze()` keeps the same essential role it had in `Runner.ts`
* it continues to support the same overloads currently shown there
* it remains valid to analyze either a builder or a finalized config
* returning the explorer remains useful for tests, reports, and advanced callers

### 6.1 Relationship to `analyzeLite`

The current `analyzeLite` concept should be preserved, but the preferred direction is not to keep it as a separate public entry point.

Instead, it should become a variation of `analyze()` that knows to create the `ValueHostsManagerConfigAnalysis` path when the requested analysis mode is the lighter one.

The exact API shape is still open, but the design intent is:

* one main `analyze()` entry point
* internal branching to the appropriate analysis implementation
* no need for callers to learn a second primary method unless compatibility requires it

---

## 7. Replacing `Runner.ts`

`Runner.ts` should be refactored so that its current orchestration becomes the implementation of the service object.

That means the current responsibilities in `Runner.ts` move into the new service class.

Those responsibilities include:

* creating the analysis object or runner state
* choosing the appropriate analysis implementation
* attaching analyzers
* invoking the analysis process
* returning the explorer
* directing output according to default or customized behavior

The result is that `Runner.ts` is no longer the primary public design story.

It may:

* disappear entirely
* become a thin compatibility wrapper
* or delegate to the new service class

The important point is that the primary design is now service-oriented.

---

## 8. Customization Direction

One long-term goal of Jivs is to expose customization points rather than force users to replace large blocks of code.

The new config-analysis service should support that goal.

### 8.1 Configurable analyzer registrations

The lists of registered analyzers should become actual members of the config-analysis service.

The service should expose registration methods for each analyzer category so users can configure the service during app startup.

That means the service itself owns the configured analyzer lists before `analyze()` runs.

Conceptual direction:

```ts
abstract class ConfigAnalysisServiceBase implements IConfigAnalysisService {
  protected readonly valueHostAnalyzers: unknown[];
  protected readonly lookupKeyAnalyzers: unknown[];
  protected readonly validatorAnalyzers: unknown[];
  protected readonly conditionAnalyzers: unknown[];

  public registerValueHostAnalyzer(analyzer: unknown): void;

  public registerLookupKeyAnalyzer(analyzer: unknown): void;

  public registerValidatorAnalyzer(analyzer: unknown): void;

  public registerConditionAnalyzer(analyzer: unknown): void;
}
```

This lets the service be configured once during application startup and then reused.

### 8.2 Replacing `registerConfigAnalyzers()`

The current `registerConfigAnalyzers()` concept should be renamed to:

* `attachAnalyzers()`

Its role changes slightly.

It no longer primarily decides what analyzers exist.

Instead, it takes the analyzer lists already stored on the service object and attaches them to the newly created analysis object for the current `analyze()` call.

### 8.3 Creating the analysis object

The service should include a protected overridable method whose job is to create the `ConfigAnalysisBase` subclass instance used by `analyze()`.

This gives subclasses a clean way to replace the analysis implementation without rewriting the entire `analyze()` orchestration.

Conceptual direction:

```ts
abstract class ConfigAnalysisServiceBase implements IConfigAnalysisService {
  public analyze(
    target: ValidationManagerConfigBuilder,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  public analyze(
    target: ValidationManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  protected createConfigAnalysis(
    target: ValidationManagerConfigBuilder | ValidationManagerConfig,
    options?: ConfigAnalysisOptions,
  ): ConfigAnalysisBase;

  protected attachAnalyzers(
    analysis: ConfigAnalysisBase,
  ): void;

  protected reportResults(
    explorer: IConfigAnalysisResultsExplorer,
    options?: ConfigAnalysisOptions,
  ): void;
}
```

### 8.4 Child methods for analyzer setup

The design should still support child methods for default analyzer setup.

Those methods are useful when establishing the service’s initial analyzer lists.

Conceptually, that may still look like:

```ts
protected registerDefaultAnalyzers(): void;
protected registerDefaultValueHostAnalyzers(): void;
protected registerDefaultLookupKeyAnalyzers(): void;
protected registerDefaultValidatorAnalyzers(): void;
protected registerDefaultConditionAnalyzers(): void;
```

The exact breakdown is not final.

The important idea is:

* analyzer lists live on the service object
* public register methods let callers customize those lists
* protected default-registration methods let subclasses customize the default startup configuration
* `attachAnalyzers()` copies the currently configured lists into the newly created analysis object

---

## 9. Reporting Behavior

The service should own reporting behavior.

The intended default is:

* generate a report to console

But that behavior must be configurable.

That means the service should be able to:

* use console output by default
* switch to another output strategy
* suppress output when desired
* preserve existing report/explorer concepts where useful

The service should make default behavior easy while keeping reporting customizable.

---

## 10. Service Boundary

The service boundary should stay narrow.

The key external contract is:

* a shared constant supplies the service name used for registration
* callers can register the config-analysis service into `ValidationServices`
* callers can retrieve and invoke the service through the normal service system

The design of `jivs-configanalysis` itself should not be driven by external duck-typing concerns.

Its public API should be designed first as a clean service-oriented API for its own users.

---

## 11. Installation and Setup Story

The expected setup story is:

1. Install `jivs-configanalysis`.
2. Create the config-analysis service object.
3. Register it into `ValidationServices` using `setService()` and the shared service name constant.
4. Configure any desired reporting or analyzer customizations.
5. Invoke the service where analysis is needed.

Conceptual example:

```ts
const analysisService = new ConfigAnalysisService();
services.setService(CONFIG_ANALYSIS_SERVICE_NAME, analysisService);
```

This keeps the feature opt-in.

---

## 12. Compatibility Considerations

The current README and public usage examples are based on `Runner.ts` and `analyze()` returning an explorer.

If backward compatibility matters, there are several possible paths:

* keep `Runner.ts` as a compatibility wrapper around the new service object
* keep `analyze()` as a helper that internally creates and uses the service object
* deprecate the old runner entry point gradually

The exact compatibility strategy is still open.

The important decision here is the new design direction, not the migration plan.

---

## 13. Design Notes

### 13.1 Why service registration was chosen

Using `ValidationServices.setService()` / `getService()` is preferable to adding a dedicated property because it reuses the existing Jivs service-registration system.

It also keeps config analysis optional and installable only where needed.

### 13.2 Why the service returns the explorer

Returning the explorer preserves the strengths of the current design.

It supports testing, reporting, and detailed result inspection without forcing callers to use side effects only.

### 13.3 Why customization moved into child methods and service-owned lists

Users often need to adjust analyzer registration without taking over the entire runner flow.

Keeping analyzer lists on the service object, combined with child methods for default setup, makes that practical and maintainable.

It also supports configuring the service once during application startup and then reusing it across analysis calls.

---

## 14. Deferred Topics

The following topics are intentionally deferred:

* the exact final class name of the service object
* the exact breakdown of analyzer-registration child methods
* the final detailed shape of the service class hierarchy
* compatibility strategy for `Runner.ts`
* the exact breakdown of reporting/output customization hooks
* the final API shape used to express the `analyzeLite` variation through `analyze()`

---

## 15. Fleshed Out Example

The following example reflects the current design direction more concretely.

It is not the final API, but it shows how the service-oriented refactor could look when applied to the current `Runner.ts` responsibilities.

```ts
// File: packages/jivs-configanalysis/src/ConfigAnalysisService.ts

import type {
  ValidationManagerConfig,
  ValidationManagerConfigBuilder,
  ValidationServices,
} from "@plblum/jivs-engine";

import {
  MODEL_RULES_CONFIG_ANALYSIS_SERVICE_NAME,
} from "@plblum/jivs-engine";

import type {
  ConfigAnalysisOptions,
  IConfigAnalysisResultsExplorer,
} from "./types";

import { ConfigAnalysisResultsExplorer } from "./ConfigAnalysisResultsExplorer";
import { ValidationManagerConfigAnalysis } from "./ValidationManagerConfigAnalysis";
import { ValueHostsManagerConfigAnalysis } from "./ValueHostsManagerConfigAnalysis";
import { ConsoleConfigAnalysisOutputter } from "./output/ConsoleConfigAnalysisOutputter";
import { CAIssueSeverity } from "./results/CAIssueSeverity";
import { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ValueHostsManagerConfigBuilder } from '@plblum/jivs-engine/build/ValueHosts/ValueHostsManagerConfigBuilder';

/*
Why:
- Keep runner orchestration in a reusable service object.
- Keep analyzer lists on the service so callers can configure once at startup.
*/

export interface IConfigAnalysisService {
  analyze(
    target: ValidationManagerConfigBuilder | ValueHostsManagerConfigBuilder,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  analyze(
    target: ValidationManagerConfig | ValueHostsManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  registerValueHostAnalyzer(analyzer: IValueHostConfigAnalyzer<TServices>): void;
  registerLookupKeyAnalyzer(analyzer: ILookupKeyAnalyzer): void;
  registerValidatorAnalyzer(analyzer: IValidatorConfigAnalyzer): void;
  registerConditionAnalyzer(analyzer: IConditionConfigAnalyzer<TServices>): void;
}


export abstract class ConfigAnalysisServiceBase implements IConfigAnalysisService {
  protected readonly valueHostAnalyzers: IValueHostConfigAnalyzer<TServices>[] = [];
  protected readonly lookupKeyAnalyzers: ILookupKeyAnalyzer[] = [];
  protected readonly validatorAnalyzers: IValidatorConfigAnalyzer[] = [];
  protected readonly conditionAnalyzers: IConditionConfigAnalyzer<TServices>[] = [];

  protected constructor() {
    this.registerDefaultAnalyzers();
  }

  public analyze(
    target: ValidationManagerConfigBuilder | ValueHostsManagerConfigBuilder,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  public analyze(
    target: ValidationManagerConfig | ValueHostsManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  public analyze(
    target: ValidationManagerConfigBuilder | ValidationManagerConfig | ValueHostsManagerConfigBuilder | ValueHostsManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer {
    const analysis = this.createConfigAnalysis(target, options);

    this.attachAnalyzers(analysis);

    analysis.analyze();

    const explorer = analysis.getResultsExplorer();

    this.reportResults(explorer, options);

    return explorer;
  }
/// NOTE <TServices> may need to be removed from IConfigAnalyzer<TConfig, TResults extends ConfigObjectCAResultsBase<TConfig>,
    // TServices extends IValueHostsServices>
  public registerValueHostAnalyzer(analyzer: IValueHostConfigAnalyzer<TServices>): void {
    this.valueHostAnalyzers.push(analyzer);
  }

  public registerLookupKeyAnalyzer(analyzer: ILookupKeyAnalyzer): void {
    this.lookupKeyAnalyzers.push(analyzer);
  }

  public registerValidatorAnalyzer(analyzer: IValidatorConfigAnalyzer): void {
    this.validatorAnalyzers.push(analyzer);
  }

  public registerConditionAnalyzer(analyzer: IConditionConfigAnalyzer<TServices>): void {
    this.conditionAnalyzers.push(analyzer);
  }

  protected attachAnalyzers(analysis: IConfigAnalysisBase): void {
    for (const analyzer of this.valueHostAnalyzers) {
      analysis.addValueHostAnalyzer(analyzer);
    }

    for (const analyzer of this.lookupKeyAnalyzers) {
      analysis.addLookupKeyAnalyzer(analyzer);
    }

    for (const analyzer of this.validatorAnalyzers) {
      analysis.addValidatorAnalyzer(analyzer);
    }

    for (const analyzer of this.conditionAnalyzers) {
      analysis.addConditionAnalyzer(analyzer);
    }
  }
// overriddable
  protected createConfigAnalysis(
    target: ValidationManagerConfigBuilder | ValidationManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisBase {
    if (target instanceof ValidationManagerConfigBuilder || target instanceof ValidationManagerConfig) {
      return new ValidationManagerConfigAnalysis(target);;
    }
    if (target instanceof ValueHostsManagerConfigBuilder || target instanceof ValueHostsManagerConfig) {
      return new ValueHostsManagerConfigAnalysis(target);
    }
    throw new Error('Invalid target type for analysis');
  }

  protected reportResults(
    explorer: IConfigAnalysisResultsExplorer,
    options?: ConfigAnalysisOptions,
  ): void {
    const reportToConsole = this.shouldReportToConsole(options);
    if (!reportToConsole) {
      return;
    }

    const includeCompleteResults = Boolean(
      (options as { includeCompleteResults?: boolean } | undefined)?.includeCompleteResults,
    );

    const errorCriteria = {
      severities: [CAIssueSeverity.error],
      skipChildrenIfParentMismatch: false,
    };

    explorer.report(
      errorCriteria,
      errorCriteria,
      includeCompleteResults,
      new ConsoleConfigAnalysisOutputter(),
    );
  }

  protected shouldReportToConsole(options?: ConfigAnalysisOptions): boolean {
    const normalized = options as { reportToConsole?: boolean } | undefined;
    return normalized?.reportToConsole ?? true;
  }

  protected registerDefaultAnalyzers(): void {
    this.registerDefaultValueHostAnalyzers();
    this.registerDefaultLookupKeyAnalyzers();
    this.registerDefaultValidatorAnalyzers();
    this.registerDefaultConditionAnalyzers();
  }

  protected registerDefaultValueHostAnalyzers(): void {}

  protected registerDefaultLookupKeyAnalyzers(): void {}

  protected registerDefaultValidatorAnalyzers(): void {}

  protected registerDefaultConditionAnalyzers(): void {}
}

export class ConfigAnalysisService extends ConfigAnalysisServiceBase {
  protected override registerDefaultValueHostAnalyzers(): void {
    // this.registerValueHostAnalyzer(new ValueHostRequiredPropertiesAnalyzer());
    // this.registerValueHostAnalyzer(new ValueHostLocalizationAnalyzer());
  }

  protected override registerDefaultLookupKeyAnalyzers(): void {
    // this.registerLookupKeyAnalyzer(new LookupKeyParserAnalyzer());
    // this.registerLookupKeyAnalyzer(new LookupKeyFormatterAnalyzer());
    // this.registerLookupKeyAnalyzer(new LookupKeyComparerAnalyzer());
  }

  protected override registerDefaultValidatorAnalyzers(): void {
    // this.registerValidatorAnalyzer(new ValidatorErrorMessageAnalyzer());
  }

  protected override registerDefaultConditionAnalyzers(): void {
    // this.registerConditionAnalyzer(new ConditionFactoryRegistrationAnalyzer());
  }
}

export function installConfigAnalysisService(
  services: ValidationServices,
  service?: IConfigAnalysisService,
): IConfigAnalysisService {
  const instance = service ?? new ConfigAnalysisService();
  services.setService(CONFIG_ANALYSIS_SERVICE_NAME, instance);
  return instance;
}
```

### Notes on this example

This example makes several design choices concrete:

* `analyze()` supports overloaded targets, including the lighter `ValueHostsManager` path
* the service owns the analyzer lists
* callers can configure those lists during application startup
* `attachAnalyzers()` applies the currently configured lists to each new analysis object
* `createConfigAnalysis()` is the main protected hook for selecting or replacing the analysis implementation
* reporting remains part of the service behavior
* installation into `ValidationServices` is explicit and opt-in

A few details in the example are still intentionally unresolved, such as the generic use of `TServices` and the exact shared constant name used in `installConfigAnalysisService()`.

---

## 16. Current Summary

The current design direction for `jivs-configanalysis` is:

* replace the primary `Runner.ts` story with a service-oriented design
* register the config-analysis service into `ValidationServices`
* use a shared service-name constant for registration
* expose overloaded `analyze(...)` as the main entry point
* continue returning the explorer from `analyze()`
* preserve the lighter analysis path through `analyze()` rather than a separate primary entry point
* let reporting/output behavior belong to the config-analysis service
* keep analyzer lists as configurable service members
* expose register methods so the service can be configured during application startup
* rename `registerConfigAnalyzers()` to `attachAnalyzers()` and use it to attach the current analyzer lists to each new analysis object
* support a protected overridable method that creates the `ConfigAnalysisBase` subclass used by `analyze()`
* refactor default analyzer setup into overridable child methods
* keep customization as a first-class design goal
* treat backward-compatibility details as a separate follow-up decision
