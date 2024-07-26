/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { CalcValueHostConfig } from "../../Interfaces/CalcValueHost";
import { CAIssueSeverity, IAnalysisResultsHelper, ValueHostConfigResults, propertyNameFeature } from "../../Interfaces/ConfigAnalysisService";
import { InputValueHostConfig } from "../../Interfaces/InputValueHost";
import { ServiceName } from "../../Interfaces/ValidationServices";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { ValueHostType } from "../../Interfaces/ValueHostFactory";
import { ensureError } from "../../Utilities/ErrorHandling";
import { ConfigPropertyAnalyzerBase } from "./ConfigPropertyAnalyzerBase";


/**
 * Instances created for each property or group of properties in a ValueHostConfig object
 * or subclass. They are registered with ValueHostConfigAnalyzer.register(). Built-in
 * classes are registered automatically. Custom classes are defined in the 
 * conditionConfigPropertyAnalyzers property of the ConfigAnalysisServiceOptions object.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ConditionPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 */
export abstract class ValueHostConfigPropertyAnalyzerBase extends
    ConfigPropertyAnalyzerBase<ValueHostConfig, ValueHostConfigResults> {

}

/**
 * Represents a property analyzer for the valueHostType property in the ValueHostConfig.
 * It checks if the valueHostType is recognized by the ValueHostFactory.
 */
export class ValueHostTypePropertyAnalyzer extends ValueHostConfigPropertyAnalyzerBase {
    /**
     * Analyzes the valueHostType property in the ValueHostConfig.
     * @param config - The ValueHostConfig object.
     * @param results - The ValueHostConfigResults object.
     * @param valueHostConfig - The ValueHostConfig object or null.
     * @param helper - The IAnalysisResultsHelper object.
     */
    public analyze(config: ValueHostConfig, results: ValueHostConfigResults, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
        try {
            helper.services.valueHostFactory.ensureRegistered(config);  // this will throw if there is an error in the config
        } catch (e) {
            let error = ensureError(e);
            results.properties.push({
                feature: propertyNameFeature,
                propertyName: 'valueHostType',
                severity: CAIssueSeverity.error,
                message: `The ValueHostConfig is not recognized by the ValueHostFactory. ${error.message}}`
            });
        }
    }
}

/**
 * Analyzer for the valueHostName property of a ValueHostConfig.
 * It checks for a valid name.
 */
export class ValueHostNamePropertyAnalyzer extends ValueHostConfigPropertyAnalyzerBase {
    /**
     * Analyzes the valueHostName property of a ValueHostConfig.
     * @param config - The ValueHostConfig object to analyze.
     * @param results - The ValueHostConfigResults object to store the analysis results.
     * @param valueHostConfig - The ValueHostConfig object being analyzed, or null if not available.
     * @param helper - The IAnalysisResultsHelper object to assist with analysis results.
     */
    public analyze(config: ValueHostConfig, results: ValueHostConfigResults,
        valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
        function addIssue(message: string): void {
            results.properties.push({
                feature: propertyNameFeature,
                propertyName: 'valueHostName',
                severity: CAIssueSeverity.error,
                message: message
            });
        }
        let name = config.name;
        if (name)
            name = name.trim();
        if (!name)
            addIssue('The ValueHostConfig has no name assigned.');
        if (name !== config.name)
            addIssue(`The ValueHostConfig name "${name}" has leading or trailing whitespace.`);    
    }
}

/**
 * Analyzer for the dataType property of a ValueHostConfig.
 * It provides an info message if unassigned because that is legal.
 * It checks for a valid LookupKey.
 */
export class DataTypePropertyAnalyzer extends ValueHostConfigPropertyAnalyzerBase {
    public analyze(config: ValueHostConfig, results: ValueHostConfigResults, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {

        if (config.dataType)
            helper.checkLookupKeyProperty('dataType', config.dataType, null,
                valueHostConfig ?? config, results.properties, 'DataType', 'dataType');
        else {
            results.properties.push({
                feature: propertyNameFeature,
                propertyName: 'dataType',
                severity: CAIssueSeverity.info,
                message: `No dataType assigned. LookupKeys that depend on dataType will not be checked. Otherwise this is a valid configuration, where the actual runtime value will be used to determine the lookup key.`
            });
        }
    }
}

/**
 * Analyzer for the label and labell10n properties of a ValueHostConfig.
 * Both can be unassigned (null, undefined, empty string).
 * label can contain any text.
 * labell10n must be a valid lookup key into TextLocalizerService or an error is reported.
 * Results include a list of all cultures and the results of TextLocalizerService.
 */
export class LabelPropertiesAnalyzer extends ValueHostConfigPropertyAnalyzerBase {
    public analyze(config: ValueHostConfig, results: ValueHostConfigResults, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
        helper.checkLocalization('label', config.labell10n, config.label, results.properties);
    }
}

/**
 * Analyzer for the parserLookupKey property in the value host configuration.
 * parserLookupKey can be unassigned (null, undefined, empty string).
 * If assigned, it must be a valid lookup key into the DataTypeParser service.
 */
export class ParserLookupKeyPropertyAnalyzer extends ValueHostConfigPropertyAnalyzerBase {
    /**
     * Analyzes the parserLookupKey property in the value host configuration.
     * 
     * @param config - The input value host configuration.
     * @param results - The value host configuration results.
     * @param valueHostConfig - The value host configuration object.
     * @param helper - The analysis result helper.
     */
    public analyze(config: InputValueHostConfig, results: ValueHostConfigResults, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
        if (config.parserLookupKey !== undefined)
            helper.checkLookupKeyProperty('parserLookupKey', config.parserLookupKey,
                ServiceName.parser, config, results.properties,
                'DataTypeParser', 'dataTypeParserService');        
    }
}

/**
 * Analyzer for the calcFn property in the ValueHostConfig object.
 */
export class CalcFnPropertyAnalyzer extends ValueHostConfigPropertyAnalyzerBase {
    /**
     * Analyzes the calcFn property in the ValueHostConfig object.
     * @param config - The CalcValueHostConfig object to analyze.
     * @param results - The ValueHostConfigResults object to store the analysis results.
     * @param valueHostConfig - The ValueHostConfig object being analyzed.
     * @param helper - The IAnalysisResultsHelper object to assist with analysis results.
     */
    public analyze(config: CalcValueHostConfig, results: ValueHostConfigResults, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {

        if (config.calcFn) {
            if (typeof config.calcFn !== 'function') {
                results.properties.push({
                    feature: propertyNameFeature,
                    propertyName: 'calcFn',
                    severity: CAIssueSeverity.error,
                    message: 'Value must be a function'
                });
            }
        }
        else {
            // since this analyzer is called for any ValueHostConfig,
            // we cannot expect this code to execute without being
            // certain this is a Calc ValueHostconfig.
            // Yet this design limits itself to the one class assigned to
            // ValueHostType.Calc. :(
            // The workaround is to subclass for each new ValueHostConfig
            // meant to require a calcFn field and override the calcValueHostType property.
            if (config.valueHostType === this.calcValueHostType)
                results.properties.push({
                    feature: propertyNameFeature,
                    propertyName: 'calcFn',
                    severity: CAIssueSeverity.error,
                    message: 'Function required'
                });
        }
    }
    protected get calcValueHostType(): string {
        return ValueHostType.Calc;
    }
}