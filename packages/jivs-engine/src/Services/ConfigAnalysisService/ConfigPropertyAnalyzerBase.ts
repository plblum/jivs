/**
 * 
 * @module Services/AbstractClasses/ConfigAnalysisService
*/
import { ConfigObjectCAResultsBase, IAnalysisResultsHelper, IConfigPropertyAnalyzer } from "../../Interfaces/ConfigAnalysisService";
import { ValueHostConfig } from "../../Interfaces/ValueHost";

/**
 * Create instances for each property or group of properties in a TConfig object.
 * Register those instances when setting up the ConfigAnalysisService.
 * 
 * The task is to update TResults.properties array with the results of the analysis if needed.
 * Create a ConditionPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 */
export abstract class ConfigPropertyAnalyzerBase<TConfig, TResults extends ConfigObjectCAResultsBase<TConfig>>
    implements IConfigPropertyAnalyzer<TConfig, TResults>
{
    /**
     * Analyzes the properties of the given configuration object and returns the analysis results.
     * If there are any issues, add them to results.properties.
     * Optionally if you have an info level message. But don't add if the data is in good shape
     * and the user doesn't need additional instructions.
     * @param config - The configuration object where to find the properties to analyze.
     * @param results - Add the results of the analysis to results.properties.
     * @param valueHostConfig - The value host configuration.
     */    
    public abstract analyze(config: TConfig, results: TResults, valueHostConfig: ValueHostConfig | null,
        helper: IAnalysisResultsHelper<any>): void;

}