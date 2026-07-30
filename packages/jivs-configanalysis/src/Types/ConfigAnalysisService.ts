/**
 * @module jivs-configanalysis/ConfigAnalysis/Types
 */

import { IConditionConfigPropertyAnalyzer, IValidatorConfigPropertyAnalyzer, IValueHostConfigPropertyAnalyzer } from './Analyzers';
import type { ValidationManagerConfig} from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import type { ValidationManagerConfigBuilder} from '@plblum/jivs-builder/build/Builder/ValidationManagerConfigBuilder';
import type { ConfigAnalysisOptions} from './ConfigAnalysis';
import type { IConfigAnalysisResultsExplorer } from './Explorer';


/**
 * The name of the service used to analyze the ValidationManagerConfig.
 * IValidationService.setService(CONFIG_ANALYSIS_SERVICE_NAME, ...) is used to set the service.
 */
export const CONFIG_ANALYSIS_SERVICE_NAME = 'ConfigAnalysisService';  // eslint-disable-line @typescript-eslint/naming-convention

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
    target: ValidationManagerConfig,  // eslint-disable-line @typescript-eslint/unified-signatures
    options?: ConfigAnalysisOptions,
  ): IConfigAnalysisResultsExplorer;

  registerValueHostPropertyAnalyzer(analyzer: IValueHostConfigPropertyAnalyzer): void;
  registerValidatorPropertyAnalyzer(analyzer: IValidatorConfigPropertyAnalyzer): void;
  registerConditionPropertyAnalyzer(analyzer: IConditionConfigPropertyAnalyzer): void;
}