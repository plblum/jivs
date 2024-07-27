/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { ConditionConfig } from "../../Interfaces/Conditions";
import { ConditionConfigCAResult, CAIssueSeverity, IConditionConfigAnalyzer, 
    IConditionConfigPropertyAnalyzer, CAFeature } from "../../Interfaces/ConfigAnalysisService";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { IValueHostsServices } from "../../Interfaces/ValueHostsServices";
import { ensureError } from "../../Utilities/ErrorHandling";
import { cleanString } from "../../Utilities/Utilities";
import { AnalysisResultsHelper } from "./AnalysisResultsHelper";
import { ConfigAnalyzerBase } from "./ConfigAnalyzerBase";

/**
 * Analyzes a ConditionConfig object, creating a ConditionResults object.
 * Key tests:
 * - Confirms the condition type is present in the ConditionFactory or its an error and does not continue.
 * - Confirms properties with lookup keys using gatherer.tryAdd()
 * - Each condition class may have its own tests, although many are generalized in this class.
 * There are no tests for duplicates.
 * There are no child configs to check.
 */
export class ConditionConfigAnalyzer<TServices extends IValueHostsServices>
    extends ConfigAnalyzerBase<ConditionConfig, ConditionConfigCAResult, IValueHostsServices>
implements IConditionConfigAnalyzer<TServices> {

    constructor(helper: AnalysisResultsHelper<TServices>,
        conditionConfigPropertyAnalyzers: Array<IConditionConfigPropertyAnalyzer>
    ) {
        super(helper, conditionConfigPropertyAnalyzers);
    }
    protected initResults(config: ConditionConfig): ConditionConfigCAResult {
        return {
            feature: CAFeature.condition,
            conditionType: cleanString(config.conditionType) ?? '[Missing]',

            config: config,
            properties: []
        };
    }    
    public analyze(config: ConditionConfig, valueHostConfig: ValueHostConfig | null, existingResults: ConditionConfigCAResult[]): ConditionConfigCAResult {
        let result = super.analyze(config, valueHostConfig, existingResults);
        if (valueHostConfig && this.helper.analysisArgs.comparerAnalyzer) {
            let checkResult = this.helper.analysisArgs.comparerAnalyzer.checkConditionConfig(config, valueHostConfig);
            if (checkResult && checkResult.message) {
                result.severity = checkResult.severity;
                result.message = 'Comparison configuration: ' + checkResult.message;
            }
        }
        return result;
    }
    /**
     * Is the configuration viable for use? If not, we won't run the other checks.
     * This should update the results object's own message and severity properties
     * with reasons for not viable.
     * @param config 
     * @param results 
     */
    protected checkForValiability(config: ConditionConfig, results: ConditionConfigCAResult): boolean {
        try {
            results.instance = this.helper.services.conditionFactory.create(config);
        }
        catch (e) {
            let error = ensureError(e);
            results.severity = CAIssueSeverity.error;
            results.message = error.message;
            return false;
        }        
        return true;
    }
    protected checkForDuplicates(config: ConditionConfig, results: ConditionConfigCAResult, existingResults: ConditionConfigCAResult[]): void {
        
    }

    protected checkChildConfigs(config: ConditionConfig, valueHostConfig: ValueHostConfig | null, results: ConditionConfigCAResult): void {
        
    }

}
