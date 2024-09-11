/**
 * 
 * @module Analyzers/Classes/Conditions
 */

import { CompareToSecondValueHostConditionBaseConfig } from "@plblum/jivs-engine/build/Conditions/CompareToSecondValueHostConditionBase";
import { ConditionWithChildrenBaseConfig } from "@plblum/jivs-engine/build/Conditions/ConditionWithChildrenBase";
import { ConditionWithOneChildBaseConfig } from "@plblum/jivs-engine/build/Conditions/ConditionWithOneChildBase";
import { ConditionCategory, ConditionConfig, SupportsDataTypeConverter } from "@plblum/jivs-engine/build/Interfaces/Conditions";

import { ServiceName } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { cleanString, findCaseInsensitiveValueInStringEnum, isPlainObject } from "@plblum/jivs-engine/build/Utilities/Utilities";
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { ConfigPropertyAnalyzerBase } from "./ConfigPropertyAnalyzerBase";
import { ConditionConfigCAResult, CAIssueSeverity } from "../Types/Results";
import { IAnalysisResultsHelper } from "../Types/Analyzers";

/**
 * Instances created for each property or group of properties in a ConditionConfig object
 * or subclass. They are registered with ConditionConfigAnalyzer.register(). Built-in
 * classes are registered automatically. Custom classes are defined in the 
 * conditionConfigPropertyAnalyzers property of the ConfigAnalysisOptions object.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ConditionPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 */
export abstract class ConditionConfigPropertyAnalyzerBase extends
    ConfigPropertyAnalyzerBase<ConditionConfig, ConditionConfigCAResult> {

}

/**
 * Handles conversionLookupKey and secondConversionLookupKey properties if present.
 * They are associated with a lookup key into the DataTypeConverter service.
 */
export class ConditionWithConversionLookupKeyPropertyAnalyzer extends ConditionConfigPropertyAnalyzerBase {
    public analyze(config: ConditionConfig, results: ConditionConfigCAResult,
        valueHostConfig: ValueHostConfig, helper: IAnalysisResultsHelper<any>): void {
        // The typecasts here cover all the possible conditions
        // Our goal is to ensure that the compiler is checking the property names
        // instead of using string literals.
        let supportsConversionConfig = config as SupportsDataTypeConverter;
        if (supportsConversionConfig.conversionLookupKey)
            helper.checkLookupKeyProperty('conversionLookupKey',
                supportsConversionConfig.conversionLookupKey, ServiceName.converter, valueHostConfig,
                results.properties, 'DataTypeConverter', 'conversionLookupKey');
        let secondVHConfig = config as CompareToSecondValueHostConditionBaseConfig;
        if (secondVHConfig.secondConversionLookupKey)   // this will also cover CompareToValueConditionBaseConfig
            helper.checkLookupKeyProperty('secondConversionLookupKey',
                secondVHConfig.secondConversionLookupKey, ServiceName.converter, valueHostConfig,
                results.properties, 'DataTypeConverter', 'secondConversionLookupKey'
            );
    }

}

/**
 * Analyzer for the condition type configuration property.
 * It is required.
 * This does not check for the presence in the ConditionFactory.
 * That is left for the ConditionConfigAnalyzer, because its a fundamental check.
 */
export class ConditionTypeConfigPropertyAnalyzer extends ConditionConfigPropertyAnalyzerBase {
    /**
     * Analyzes the condition type configuration property.
     * @param config - The condition configuration.
     * @param results - The analysis results.
     * @param valueHostConfig - The value host configuration.
     * @param helper - The analysis result helper.
     */
    public analyze(config: ConditionConfig, results: ConditionConfigCAResult,
        valueHostConfig: ValueHostConfig, helper: IAnalysisResultsHelper<any>): void {

        let ct = cleanString(config.conditionType);
        if (!ct) {
            helper.addPropertyCAResult(
                'conditionType', CAIssueSeverity.error,
                'conditionType must be assigned.', results.properties);
            return;
        }
        helper.checkNeedsTrimming(config.conditionType, 'conditionType',
            results.properties,
            CAIssueSeverity.error
        );
        let realCT = helper.services.conditionFactory.findRealName(ct);
        if (realCT === null) {
            helper.addPropertyCAResult(
                'conditionType', CAIssueSeverity.error,
                `The condition type is not found in the ConditionFactory.`, results.properties);
        }
        else if (realCT !== ct) {
            helper.addPropertyCAResult(
                // use info because case insensitive match is supported
                'conditionType', CAIssueSeverity.info,
                `Change to ${realCT}.`, results.properties);
        }
    }
}

/**
 * Check for a valid property. No issues if null, undefined, or empty string.
 * When present, provide an info message about it overridding the default.
 */
export class ConditionCategoryPropertyAnalyzer extends ConditionConfigPropertyAnalyzerBase {
    public analyze(config: ConditionConfig, results: ConditionConfigCAResult,
        valueHostConfig: ValueHostConfig, helper: IAnalysisResultsHelper<any>): void {
        if (config.category) {
            // category is an enum, but when getting a value from JSON, it could be a string with a typo
            let category: string = typeof config.category === 'number' ?
                ConditionCategory[config.category] :
                (config.category as any).toString().trim();
            
            if (category) {
                let ciCategory = findCaseInsensitiveValueInStringEnum(category, ConditionCategory);
                if (ciCategory === undefined) {
                    helper.addPropertyCAResult(
                        'category', CAIssueSeverity.error,
                        'The category property is not recognized.', results.properties);
                }
                else if (category !== ciCategory) {
                    helper.addPropertyCAResult(
                        'category', CAIssueSeverity.info,
                        `Change to ${ciCategory}.`, results.properties);
                }
                else {
                    helper.addPropertyCAResult(
                        'category', CAIssueSeverity.info,
                        'The category property is present. It will override the default category.', results.properties);
                }
            }
        }
    }
}

/**
 * conditionConfigs - if assigned, error if not an array. Go through all child Configs. 
 * Ensure child has been analyzed by ConditionConfigAnalyzer with their results
 * added to results.childrenResults.
 * Warning if the property is present but has no children.
 */
export class ConditionWithChildrenPropertyAnalyzer extends ConditionConfigPropertyAnalyzerBase {
    public analyze(config: ConditionConfig, results: ConditionConfigCAResult,
        valueHostConfig: ValueHostConfig, helper: IAnalysisResultsHelper<any>): void {
        let container = config as ConditionWithChildrenBaseConfig;
        if (container.conditionConfigs === undefined)
            return; // we don't know if the actual config is really a ConditionWithChildrenBaseConfig.

        if (container.conditionConfigs === null ||
            !Array.isArray(container.conditionConfigs) ||
            container.conditionConfigs.length === 0)
            helper.addPropertyCAResult(
                'conditionConfigs', CAIssueSeverity.error,
                'Must be an array with at least one condition', results.properties);
        else {
            if (!results.childrenResults)
                results.childrenResults = [];
            if (helper.analysisArgs.conditionConfigAnalyzer)
                for (let childConfig of container.conditionConfigs) {
                    let childResults = helper.analysisArgs.conditionConfigAnalyzer.analyze(childConfig, valueHostConfig, []);
                    if (childResults)
                        results.childrenResults.push(childResults);
                }
        }

    }
}

/**
 * For childConditionConfig property on a ConditionWithOneChildBaseConfig object.
 * If undefined, no issue.
 * If null, error.
 * If a ConditionConfig object, analyze it with ConditionConfigAnalyzer.
 */
export class ConditionWithOneChildPropertyAnalyzer extends ConditionConfigPropertyAnalyzerBase {
    public analyze(config: ConditionConfig, results: ConditionConfigCAResult,
        valueHostConfig: ValueHostConfig, helper: IAnalysisResultsHelper<any>): void {
        let container = config as ConditionWithOneChildBaseConfig;
        if (container.childConditionConfig === undefined)
            return; // we don't know if the actual config is really a ConditionWithChildrenBaseConfig.

        if (!isPlainObject(container.childConditionConfig)) // including null
            helper.addPropertyCAResult('childConditionConfig', CAIssueSeverity.error, 
                'Must be a condition object', results.properties)
        
        else {
            if (!results.childrenResults)
                results.childrenResults = [];
            if (helper.analysisArgs.conditionConfigAnalyzer) {
                let childResults = helper.analysisArgs.conditionConfigAnalyzer.analyze(container.childConditionConfig, valueHostConfig, []);
                if (childResults)
                    results.childrenResults.push(childResults);
            }
        }

    }
}

/**
 * For valueHostName property on a ConditionConfig object.
 * If undefined, null or empty string, no issue.
 * Otherwise, it must be found in analysisArgs.valueHostNames
 * with an exact match. Report error if whitespace or case insensitive match.
 */
export class ConditionWithValueHostNamePropertyAnalyzer extends ConditionConfigPropertyAnalyzerBase {
    public analyze(config: ConditionConfig, results: ConditionConfigCAResult,
        valueHostConfig: ValueHostConfig, helper: IAnalysisResultsHelper<any>): void {
        let valueHostName = (config as any).valueHostName;
        helper.checkValueHostNameExists(valueHostName, 'valueHostName', results.properties);
    }
}

/**
 * For secondValueHostName property on a ConditionConfig object,
 * typically found on CompareToValueConditionBaseConfig but if you create
 * your own, you can identify its ConditionType in the ensurePropertyIsDefinedConditionTypes.
 * If undefined, null or empty string, no issue.
 * Otherwise, it must be found in analysisArgs.valueHostNames
 * with an exact match. Report error if whitespace or case insensitive match.
 */
export class ConditionWithSecondValueHostNamePropertyAnalyzer extends ConditionConfigPropertyAnalyzerBase {
    public analyze(config: ConditionConfig, results: ConditionConfigCAResult,
        valueHostConfig: ValueHostConfig, helper: IAnalysisResultsHelper<any>): void {
        let secondValueHostName = (config as any).secondValueHostName;
        if (secondValueHostName === undefined &&
            this.ensurePropertyIsDefinedConditionTypes.has(config.conditionType))
        {
            helper.checkIsNotUndefined(secondValueHostName, 'secondValueHostName', results.properties, CAIssueSeverity.error);
            return;
        }

        helper.checkValueHostNameExists(secondValueHostName, 'secondValueHostName', results.properties);
    }
    /**
     * Identifies a group of condition types that all use the secondValue
     * property typically found in CompareToValueConditionBaseConfig.
     * These ConditionTypes require the secondValueHostName property to be defined, even if null.
     * This design allows the user to create new classes that use the secondValueHostName
     * and ensure this analyzer reports an error if the secondValueHostName property is undefined
     */
    public get ensurePropertyIsDefinedConditionTypes(): Set<string>
    {
        return this._ensurePropertyIsDefinedConditionTypes;
    }
    private _ensurePropertyIsDefinedConditionTypes = new Set<string>([
        ConditionType.EqualTo,
        ConditionType.NotEqualTo,
        ConditionType.GreaterThan,
        ConditionType.LessThan,
        ConditionType.GreaterThanOrEqual,
        ConditionType.LessThanOrEqual
    ]);
    
}
/**
 * For the secondValue property, found on CompareToValueConditionBaseConfig.
 * If undefined, no issue unless its conditionType predefined to need it.
 * If null, warning because conditions comparing with null should be using 
 * the NotNullCondition or RequireTextCondition.
 * If not null, check the value property. Use DataTypeConverter to get
 * it to the valueHostConfig.dataType. If it fails, report an error.
 * If ValueHostConfig.dataType is unassigned, no conversion is possible
 * and an info message that the value could not be verified is added.
 */
export class ConditionWithSecondValuePropertyAnalyzer extends ConditionConfigPropertyAnalyzerBase {
    public analyze(config: ConditionConfig, results: ConditionConfigCAResult,
        valueHostConfig: ValueHostConfig, helper: IAnalysisResultsHelper<any>): void {
        let secondValue = (config as any).secondValue;
        let secondConversionLookupKey = (config as any).secondConversionLookupKey;
        if (secondValue === undefined &&
            this.ensurePropertyIsDefinedConditionTypes.has(config.conditionType))
        {
            helper.checkIsNotUndefined(secondValue, 'secondValue', results.properties, CAIssueSeverity.error);
            return;
        }
        if (helper.checkIsNotNull(secondValue, 'secondValue', results.properties, CAIssueSeverity.warning))
            helper.checkValuePropertyContents(secondValue, 'secondValue', valueHostConfig.dataType,  secondConversionLookupKey, results.properties);
    }
/**
 * Identifies a group of condition types that all use the secondValue
 * property typically found in CompareToValueConditionBaseConfig.
* These ConditionTypes require the secondValue property to be defined, even if null.
* This design allows the user to create new classes that use the secondValue
* and ensure this analyzer reports an error if the secondValue property is undefined
 */
    public get ensurePropertyIsDefinedConditionTypes(): Set<string>
    {
        return this._ensurePropertyIsDefinedConditionTypes;
    }
    private _ensurePropertyIsDefinedConditionTypes = new Set<string>([
        ConditionType.EqualToValue,
        ConditionType.NotEqualToValue,
        ConditionType.GreaterThanValue,
        ConditionType.LessThanValue,
        ConditionType.GreaterThanOrEqualValue,
        ConditionType.LessThanOrEqualValue
    ]);
    
}