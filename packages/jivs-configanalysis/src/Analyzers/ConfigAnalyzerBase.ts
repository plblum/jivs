/**
 * 
 * @module Analyzers/Classes
 */

import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostsServices } from "@plblum/jivs-engine/build/Interfaces/ValueHostsServices";
import { ensureError } from "@plblum/jivs-engine/build/Utilities/ErrorHandling";
import { valueForLog } from "@plblum/jivs-engine/build/Utilities/Utilities";
import { AnalysisResultsHelper } from "./AnalysisResultsHelper";
import { IConfigAnalyzer, IConfigPropertyAnalyzer } from "../Types/Analyzers";
import { ConfigObjectCAResultsBase, ErrorCAResult, CAFeature, CAIssueSeverity } from "../Types/Results";

/**
 * Base class for analyzing a Config object, creating a ConfigResults object.
 */
export abstract class ConfigAnalyzerBase<TConfig, TResults extends ConfigObjectCAResultsBase<TConfig>,
    TServices extends IValueHostsServices>
    implements IConfigAnalyzer<TConfig, TResults, TServices> {
    constructor(helper: AnalysisResultsHelper<TServices>,
        propertyAnalyzers: Array<IConfigPropertyAnalyzer<TConfig, TResults>>
    ) {
        this._helper = helper;
        this._propertyAnalyzers = propertyAnalyzers;
    }

    /**
     * Config properties need to implement IConfigPropertyAnalyzer
     * to add analysis. Supplied by the same-named property in ConfigAnalysis.
     */
    protected get propertyAnalyzers(): Array<IConfigPropertyAnalyzer<TConfig, TResults>> {
        return this._propertyAnalyzers;
    }
    private _propertyAnalyzers: Array<IConfigPropertyAnalyzer<TConfig, TResults>>;

    /**
     * Supplies helper methods
     */
    protected get helper(): AnalysisResultsHelper<TServices> {
        return this._helper;
    }
    private _helper: AnalysisResultsHelper<TServices>;

    /**
     * Analyzes the given Config object to produce the ConfigResults object describing it.
     * @param config The configuration to analyze.
     * @param valueHostConfig The value host configuration associated with the configuration
     * or null if config is already that object.
     * @param existingResults The existing results to check for duplicates if needed.
     * @returns The ConfigResults for the caller to add to existingResults.
     */
    public analyze(config: TConfig, valueHostConfig: ValueHostConfig | null, existingResults: Array<TResults>): TResults {
        let results = this.initResults(config);
        if (this.checkForValiability(config, results)) {
            this.checkForDuplicates(config, results, existingResults);
            this.analyzeProperties(config, results, valueHostConfig ?? (config as ValueHostConfig));
            this.checkChildConfigs(config, valueHostConfig, results);
        }
        return results;
    }
    protected abstract initResults(config: TConfig): TResults;

    /**
     * Is the configuration viable for use? If not, we won't run the other checks.
     * This should update the results object's own message and severity properties
     * with reasons for not viable.
     * @param config 
     * @param results 
     */
    protected abstract checkForValiability(config: TConfig, results: TResults): boolean;

    protected abstract checkForDuplicates(config: TConfig, results: TResults, existingResults: Array<TResults>): void;

    protected abstract checkChildConfigs(config: TConfig, valueHostConfig: ValueHostConfig | null, results: TResults): void;

    /**
     * Analyzes the properties of a given Config (in results.conditionConfig) and populates the results.
     * @param results - The ConditionResults object to populate with analysis results.
     * Its conditionConfig property hosts the source Config object.
     * @param valueHostConfig - The ValueHostConfig associated with the Config.
     */
    protected analyzeProperties(config: TConfig, results: TResults, valueHostConfig: ValueHostConfig): void {
        this.propertyAnalyzers.forEach((analyzer) => {
            try {
                analyzer.analyze(config, results, valueHostConfig, this.helper);
            }
            catch (e) {
                let error = ensureError(e);
                results.properties.push(<ErrorCAResult>{
                    feature: CAFeature.error,
                    severity: CAIssueSeverity.error,
                    message: error.message,
                    analyzerClassName: valueForLog(analyzer)
                });
            }
        });
    }

}
