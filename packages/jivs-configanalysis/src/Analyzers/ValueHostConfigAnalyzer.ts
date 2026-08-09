/**
 * 
 * @module jivs-configanalysis/Analyzers/ConcreteClasses/ValueHostConfig
 */

import { ValidatorsValueHostBaseConfig } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
import { ValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { cleanString } from '@plblum/jivs-engine/build/Utilities/Utilities';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { AnalysisResultsHelper } from './AnalysisResultsHelper';
import { ConfigAnalyzerBase } from './ConfigAnalyzerBase';
import { IValueHostConfigAnalyzer, IValueHostConfigPropertyAnalyzer } from '../Types/Analyzers';
import { ValueHostConfigCAResult, CAFeature, CAIssueSeverity, PropertyCAResult } from '../Types/ConfigAnalysisResults';

/**
 * Analyzes a ValueHostConfig object, creating a ValueHostResults object.
 * Key tests:
 * - Confirms the condition type is present in the ValueHostFactory or its an error and does not continue.
 * - Confirms properties with lookup keys using gatherer.tryAdd()
 * - Each condition class may have its own tests, although many are generalized in this class.
 */
export class ValueHostConfigAnalyzer<TServices extends IJivsServices>
    extends ConfigAnalyzerBase<ValueHostConfig, ValueHostConfigCAResult>
implements IValueHostConfigAnalyzer {

    constructor(helper: AnalysisResultsHelper<TServices>,
        conditionConfigPropertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer>
    ) {
        super(helper, conditionConfigPropertyAnalyzers);
    }
    protected initResults(config: ValueHostConfig): ValueHostConfigCAResult {
        const result: ValueHostConfigCAResult = {
            feature: CAFeature.valueHost,
            valueHostName: cleanString(config.name) ?? '',
            properties: [],
            config: config
        };
        if (result.valueHostName.length === 0)
            result.valueHostName = '[Missing]';
        return result;
        
    }    
    protected checkForValiability(config: ValueHostConfig, results: ValueHostConfigCAResult): boolean {
        if (results.valueHostName === '[Missing]') {
            results.message = 'The ValueHostConfig name is missing. It is required.';
            results.severity = CAIssueSeverity.error;
            return false;
        }
        return true;
    }
    /**
     * Confirm the name is not a case insensitive matched to existing results.
     * @param config 
     * @param results 
     * @param existingResults 
     */
    protected checkForDuplicates(config: ValueHostConfig, results: ValueHostConfigCAResult, existingResults: ValueHostConfigCAResult[]): void {
        // look for duplicate names using case insensitive match
        if (results.valueHostName !== '[Missing]') {
            const lc = results.valueHostName.toLowerCase();
            const duplicate = existingResults.find(vhc => vhc.valueHostName.toLowerCase() === lc);

            if (duplicate) {
                results.properties.push(({
                    feature: CAFeature.property,
                    propertyName: 'valueHostName',
                    severity: CAIssueSeverity.error,
                    message: `The ValueHostConfig name "${config.name}" is a case insensitive match to another. It must be unique.`
                } as PropertyCAResult));
            }
        }
    }

    protected checkChildConfigs(config: ValueHostConfig, valueHostConfig: ValueHostConfig | null, results: ValueHostConfigCAResult): void {
        const valValueHostConfig = config as ValidatorsValueHostBaseConfig;
        if (valValueHostConfig.validatorConfigs) {
            results.validatorResults = [];
            for (const validatorConfig of valValueHostConfig.validatorConfigs) {
                const childResults = this.helper.analysisArgs.validatorConfigAnalyzer!.analyze(
                    validatorConfig, valValueHostConfig, results.validatorResults);
                results.validatorResults.push(childResults);
            }
        }
        if (config.enablerConfig && this.helper.analysisArgs.conditionConfigAnalyzer) {
            results.enablerConditionResult = this.helper.analysisArgs.conditionConfigAnalyzer.analyze(
                config.enablerConfig, valueHostConfig ?? config, []);
        }        
    }

}
