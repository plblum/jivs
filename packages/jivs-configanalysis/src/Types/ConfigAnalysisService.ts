import {  IConditionConfigPropertyAnalyzer, IValidatorConfigPropertyAnalyzer, IValueHostConfigPropertyAnalyzer } from './Analyzers';
import type { ValidationManagerConfig} from "@plblum/jivs-engine/build/Interfaces/ValidationManager";
import type { ValidationManagerConfigBuilder} from "@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder";
import type { ConfigAnalysisOptions} from "./ConfigAnalysis";
import type { IConfigAnalysisResultsExplorer } from "./Explorer";

/**
 * Interface for the ConfigAnalysisService, which provides methods 
 * to analyze configurations and register analyzers.
 */
export interface IConfigAnalysisService {
  analyze(
    target: ValidationManagerConfigBuilder,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  analyze(
    target: ValidationManagerConfig,
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  registerValueHostPropertyAnalyzer(analyzer: IValueHostConfigPropertyAnalyzer): void;
  registerValidatorPropertyAnalyzer(analyzer: IValidatorConfigPropertyAnalyzer): void;
  registerConditionPropertyAnalyzer(analyzer: IConditionConfigPropertyAnalyzer): void;
}