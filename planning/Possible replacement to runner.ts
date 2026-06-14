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
