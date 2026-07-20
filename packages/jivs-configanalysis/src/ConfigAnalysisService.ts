import { ManagerConfigBuilderBase } from "@plblum/jivs-builder/build/Builder/ManagerConfigBuilderBase";
import type { ValidationManagerConfigBuilder } from "@plblum/jivs-builder/build/Builder/ValidationManagerConfigBuilder";
import type { ValidationManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";
import type { IValidationServices } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { CodingError } from "@plblum/jivs-engine/build/Utilities/ErrorHandling";
import {
  ConditionCategoryPropertyAnalyzer, ConditionTypeConfigPropertyAnalyzer,
  ConditionWithChildrenPropertyAnalyzer, ConditionWithConversionLookupKeyPropertyAnalyzer,
  ConditionWithOneChildPropertyAnalyzer, ConditionWithSecondValueHostNamePropertyAnalyzer,
  ConditionWithSecondValuePropertyAnalyzer, ConditionWithValueHostNamePropertyAnalyzer
} from "./Analyzers/ConditionConfigPropertyAnalyzerClasses";
import { AllMessagePropertiesConfigPropertyAnalyzer, ConditionCreatorConfigPropertyAnalyzer } from "./Analyzers/ValidatorConfigPropertyAnalyzerClasses";
import {
  CalcFnPropertyAnalyzer, DataTypePropertyAnalyzer, LabelPropertiesAnalyzer, ParserLookupKeyPropertyAnalyzer,
  ValueHostNamePropertyAnalyzer, ValueHostTypePropertyAnalyzer
} from "./Analyzers/ValueHostConfigPropertyAnalyzerClasses";
import { ValidationManagerConfigAnalysis } from "./ConfigAnalysis";
import { ConsoleConfigAnalysisOutputter } from "./Explorer/Outputters/ConfigAnalysisOutputterClasses";
import { IConditionConfigPropertyAnalyzer, IValidatorConfigPropertyAnalyzer, IValueHostConfigPropertyAnalyzer } from "./Types/Analyzers";
import { ConfigAnalysisOptions, IConfigAnalysis } from "./Types/ConfigAnalysis";
import { CONFIG_ANALYSIS_SERVICE_NAME, IConfigAnalysisService } from "./Types/ConfigAnalysisService";
import { IConfigAnalysisResultsExplorer } from "./Types/Explorer";
import { CAIssueSeverity } from "./Types/Results";

/**
 * ConfigAnalysisService supplies the ConfigAnalysis object.
 * It is expected to be registered within IValidationServices using 
 * ```ts
 * installConfigAnalysisService(services);
 * // effectively does this:
 * services.setService(CONFIG_ANALYSIS_SERVICE_NAME, new ConfigAnalysisService(services));
 * ```
 * It is consumed from services like this:
 * ```ts
 * const configAnalysisService =  services.getService(CONFIG_ANALYSIS_SERVICE_NAME) as IConfigAnalysisService;
 * configAnalysisService.analyze(config or builder, options);
 * ```
 */
export abstract class ConfigAnalysisServiceBase implements IConfigAnalysisService {
  protected readonly valueHostAnalyzers: IValueHostConfigPropertyAnalyzer[] = [];
  protected readonly validatorAnalyzers: IValidatorConfigPropertyAnalyzer[] = [];
  protected readonly conditionAnalyzers: IConditionConfigPropertyAnalyzer[] = [];
  protected readonly services: IValidationServices;
  protected constructor(services: IValidationServices) {
    this.services = services;
  }
    
  /**
   * Execute the analysis on the provided builder.
   * @param target 
   * @param options 
   * @returns The results of the analysis, which can be explored and reported.
   */
  public analyze(
    target: ValidationManagerConfigBuilder,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;
  /**
   * Execute the analysis on the provided configuration.
   * @param target 
   * @param options 
   * @returns The results of the analysis, which can be explored and reported.
   */
  public analyze(
    target: ValidationManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;
  /**
   * Overload support for analyze method.
   * @param arg1 
   * @param options 
   * @returns The results of the analysis, which can be explored and reported.
   */
  public analyze(
    arg1: ValidationManagerConfigBuilder | ValidationManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer {

    let config: ValidationManagerConfig;
    if (arg1 instanceof ManagerConfigBuilderBase)
      config = arg1.snapshot();
    else
      config = arg1 as ValidationManagerConfig;

    const analysis = this.createConfigAnalysis(config, options);

    this.attachAnalyzers(analysis);

    const explorer = analysis.analyze(config, options);

    this.reportResults(explorer, options);

    return explorer;
  }

  public registerValueHostPropertyAnalyzer(analyzer: IValueHostConfigPropertyAnalyzer): void {
    this.valueHostAnalyzers.push(analyzer);
  }

  public registerValidatorPropertyAnalyzer(analyzer: IValidatorConfigPropertyAnalyzer): void {
    this.validatorAnalyzers.push(analyzer);
  }

  public registerConditionPropertyAnalyzer(analyzer: IConditionConfigPropertyAnalyzer): void {
    this.conditionAnalyzers.push(analyzer);
  }

  protected attachAnalyzers(cas: IConfigAnalysis): void {
    cas.registerValueHostConfigPropertyAnalyzers(() => {
      if (this.valueHostAnalyzers.length === 0) {
        this.registerDefaultValueHostPropertyAnalyzers();
      }
      return this.valueHostAnalyzers;
    });
    cas.registerValidatorConfigPropertyAnalyzers(() => {
      if (this.validatorAnalyzers.length === 0) {
        this.registerDefaultValidatorPropertyAnalyzers();
      }
      return this.validatorAnalyzers;
    });
    cas.registerConditionConfigPropertyAnalyzers(() => {
      if (this.conditionAnalyzers.length === 0) {
        this.registerDefaultConditionPropertyAnalyzers();
      }
      return this.conditionAnalyzers;
    });
  }
  // overriddable
  protected createConfigAnalysis(
    target: ValidationManagerConfigBuilder | ValidationManagerConfig,
    options?: ConfigAnalysisOptions,
  ): ValidationManagerConfigAnalysis {
    return new ValidationManagerConfigAnalysis();
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
  // Public to allow subclasses to add these then register their own analyzers.
  public abstract registerDefaultValueHostPropertyAnalyzers(): void;
  public abstract registerDefaultValidatorPropertyAnalyzers(): void;
  public abstract registerDefaultConditionPropertyAnalyzers(): void;

}

/**
 * Standard implementation of the ConfigAnalysisServiceBase, which adds
 * the standard analyzers for ValueHost, Validator, and Condition configurations.
 */
export class ConfigAnalysisService extends ConfigAnalysisServiceBase {
  constructor(services: IValidationServices) {
    super(services);
  }
  public override registerDefaultValueHostPropertyAnalyzers(): void {
      this.registerValueHostPropertyAnalyzer(new ValueHostTypePropertyAnalyzer()),
      this.registerValueHostPropertyAnalyzer(new ValueHostNamePropertyAnalyzer()),
      this.registerValueHostPropertyAnalyzer(new DataTypePropertyAnalyzer()),
      this.registerValueHostPropertyAnalyzer(new LabelPropertiesAnalyzer()),
      this.registerValueHostPropertyAnalyzer(new ParserLookupKeyPropertyAnalyzer()),
      this.registerValueHostPropertyAnalyzer(new CalcFnPropertyAnalyzer())
  }

  public override registerDefaultValidatorPropertyAnalyzers(): void {
      this.registerValidatorPropertyAnalyzer(new AllMessagePropertiesConfigPropertyAnalyzer()),
      this.registerValidatorPropertyAnalyzer(new ConditionCreatorConfigPropertyAnalyzer())
  }

  public override registerDefaultConditionPropertyAnalyzers(): void {
      this.registerConditionPropertyAnalyzer(new ConditionTypeConfigPropertyAnalyzer()),
      this.registerConditionPropertyAnalyzer(new ConditionWithConversionLookupKeyPropertyAnalyzer()),
      this.registerConditionPropertyAnalyzer(new ConditionCategoryPropertyAnalyzer()),
      this.registerConditionPropertyAnalyzer(new ConditionWithChildrenPropertyAnalyzer()),
      this.registerConditionPropertyAnalyzer(new ConditionWithOneChildPropertyAnalyzer()),
      this.registerConditionPropertyAnalyzer(new ConditionWithValueHostNamePropertyAnalyzer()),
      this.registerConditionPropertyAnalyzer(new ConditionWithSecondValueHostNamePropertyAnalyzer()),
      this.registerConditionPropertyAnalyzer(new ConditionWithSecondValuePropertyAnalyzer())
  }
}

/**
 * Add this to createValidationServices method like this:
 * ```ts
 *  installConfigAnalysisService(services);
 * ```
 * @param services The validation services instance.
 * @param service Optional ConfigAnalysisService instance to install.
 * @returns The installed ConfigAnalysisService.
 */
export function installConfigAnalysisService(
  services: IValidationServices,
  service?: IConfigAnalysisService,
): IConfigAnalysisService {
  let existingService = services.getService(CONFIG_ANALYSIS_SERVICE_NAME) as IConfigAnalysisService | null;
  if (existingService) {
    return existingService;
  }
  const instance = service ?? new ConfigAnalysisService(services);
  services.setService(CONFIG_ANALYSIS_SERVICE_NAME, instance);
  return instance;
}

/**
 * Retrieves the installed ConfigAnalysisService from the given ValidationServices object.
 * @param services The validation services instance.
 * @returns The installed ConfigAnalysisService.
 * @throws CodingError if the ConfigAnalysisService is not installed.
 */
export function getConfigAnalysisService(services: IValidationServices): IConfigAnalysisService {
  const service = services.getService(CONFIG_ANALYSIS_SERVICE_NAME) as IConfigAnalysisService | null;
  if (!service) {
    throw new CodingError("ConfigAnalysisService is not installed.");
  }
  return service;
}