/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { ValueHostConfigResults, IValueHostConfigAnalyzer, IValueHostConfigPropertyAnalyzer, ConfigPropertyResult, ConfigIssueSeverity, propertyNameFeature, valueHostFeature } from "../../Interfaces/ConfigAnalysisService";
import { ValidatorsValueHostBaseConfig } from "../../Interfaces/ValidatorsValueHostBase";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { IValueHostsServices } from "../../Interfaces/ValueHostsServices";
import { cleanString } from "../../Utilities/Utilities";
import { AnalysisResultsHelper } from "./AnalysisResultsHelper";
import { ConfigAnalyzerBase } from "./ConfigAnalyzerBase";

/**
 * Analyzes a ValueHostConfig object, creating a ValueHostResults object.
 * Key tests:
 * - Confirms the condition type is present in the ValueHostFactory or its an error and does not continue.
 * - Confirms properties with lookup keys using gatherer.tryAdd()
 * - Each condition class may have its own tests, although many are generalized in this class.
 */
export class ValueHostConfigAnalyzer<TServices extends IValueHostsServices>
    extends ConfigAnalyzerBase<ValueHostConfig, ValueHostConfigResults, IValueHostsServices>
implements IValueHostConfigAnalyzer<TServices> {

    constructor(helper: AnalysisResultsHelper<TServices>,
        conditionConfigPropertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer>
    ) {
        super(helper, conditionConfigPropertyAnalyzers);
    }
    protected initResults(config: ValueHostConfig): ValueHostConfigResults {
        let result: ValueHostConfigResults = {
            feature: valueHostFeature,
            valueHostName: cleanString(config.name) ?? '',
            properties: [],
            config: config
        };
        if (result.valueHostName.length === 0)
            result.valueHostName = '[Missing]';
        return result;
        
    }    
    protected checkForValiability(config: ValueHostConfig, results: ValueHostConfigResults): boolean {
        if (results.valueHostName === '[Missing]') {
            results.message = 'The ValueHostConfig name is missing. It is required.';
            results.severity = ConfigIssueSeverity.error;
            return false;
        }
        return true
    }
    /**
     * Confirm the name is not a case insensitive matched to existing results.
     * @param config 
     * @param results 
     * @param existingResults 
     */
    protected checkForDuplicates(config: ValueHostConfig, results: ValueHostConfigResults, existingResults: ValueHostConfigResults[]): void {
        // look for duplicate names using case insensitive match
        if (results.valueHostName !== '[Missing]') {
            let lc = results.valueHostName.toLowerCase();
            let duplicate = existingResults.find(vhc => vhc.valueHostName.toLowerCase() === lc);

            if (duplicate) {
                results.properties.push(<ConfigPropertyResult>{
                    feature: propertyNameFeature,
                    propertyName: 'valueHostName',
                    severity: ConfigIssueSeverity.error,
                    message: `The ValueHostConfig name "${config.name}" is a case insensitive match to another. It must be unique.`
                });
            }
        }
    }

    protected checkChildConfigs(config: ValueHostConfig, valueHostConfig: ValueHostConfig | null, results: ValueHostConfigResults): void {
        let valValueHostConfig = config as ValidatorsValueHostBaseConfig;
        if (valValueHostConfig.validatorConfigs) {
            results.validators = [];
            for (let validatorConfig of valValueHostConfig.validatorConfigs) {
                let childResults = this.helper.analysisArgs.validatorConfigAnalyzer!.analyze(
                    validatorConfig, valValueHostConfig, results.validators);
                results.validators.push(childResults);
            }
        }
        if (config.enablerConfig && this.helper.analysisArgs.conditionConfigAnalyzer) {
            results.enablerCondition = this.helper.analysisArgs.conditionConfigAnalyzer.analyze(
                config.enablerConfig, valueHostConfig ?? config, []);
        }        
    }

}
