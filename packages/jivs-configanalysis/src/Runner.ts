/**
 * 
 * @module ConfigAnalysis/Classes
 */

import {
    ConditionTypeConfigPropertyAnalyzer, ConditionWithConversionLookupKeyPropertyAnalyzer,
    ConditionCategoryPropertyAnalyzer, ConditionWithChildrenPropertyAnalyzer, ConditionWithOneChildPropertyAnalyzer,
    ConditionWithValueHostNamePropertyAnalyzer, ConditionWithSecondValueHostNamePropertyAnalyzer,
    ConditionWithSecondValuePropertyAnalyzer
} from "./Analyzers/ConditionConfigPropertyAnalyzerClasses";
import { AllMessagePropertiesConfigPropertyAnalyzer, ConditionCreatorConfigPropertyAnalyzer } from "./Analyzers/ValidatorConfigPropertyAnalyzerClasses";
import {
    ValueHostTypePropertyAnalyzer, ValueHostNamePropertyAnalyzer, DataTypePropertyAnalyzer,
    LabelPropertiesAnalyzer, ParserLookupKeyPropertyAnalyzer, CalcFnPropertyAnalyzer
} from "./Analyzers/ValueHostConfigPropertyAnalyzerClasses";
import { ConfigAnalysisOptions, IConfigAnalysis } from "./Types/ConfigAnalysis";
import { ValidationManagerConfigBuilder } from "@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder";
import { ValidationManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";
import { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ValueHostsManagerConfigBuilder } from '@plblum/jivs-engine/build/ValueHosts/ValueHostsManagerConfigBuilder';
import { IConfigAnalysisResultsExplorer } from "./Types/Explorer";
import { ValidationManagerConfigAnalysis, ValueHostsManagerConfigAnalysis } from "./ConfigAnalysis";


/**
 * Analyze the configuration for a ValidationManager
 * @param config The configuration to analyze
 * @param options Options for the analysis
 */
export function analyze(config: ValidationManagerConfig, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer;
/**
 * Analyze the configuration found in the Builder or Modifier object
 * @param builder 
 * @param options 
 */
export function analyze(builder: ValidationManagerConfigBuilder, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer;
export function analyze(arg1: ValidationManagerConfig | ValidationManagerConfigBuilder, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer {
    let ca = new ValidationManagerConfigAnalysis();
    registerConfigAnalyzers(ca); 
    if (arg1 instanceof ValidationManagerConfigBuilder)
        return ca.analyze(arg1, options);
    if (arg1 instanceof Object)
        return ca.analyze(arg1, options);
    throw new Error('Invalid argument type');
}

//#region using the ValueHostsManager instead of ValidationManager

/**
 * Analyze the configuration for a ValueHostsManager
 * @param config The configuration to analyze
 * @param options Options for the analysis
 */
export function analyzeLite(config: ValueHostsManagerConfig, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer;
/**
 * Analyze the configuration found in the Builder or Modifier object
 * @param builder 
 * @param options 
 */
export function analyzeLite(builder: ValueHostsManagerConfigBuilder, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer;
export function analyzeLite(arg1: ValueHostsManagerConfig | ValueHostsManagerConfigBuilder, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer {
    let ca = new ValueHostsManagerConfigAnalysis();
    registerConfigAnalyzers(ca); 
    if (arg1 instanceof ValueHostsManagerConfigBuilder)
        return ca.analyze(arg1, options);
    if (arg1 instanceof Object)
        return ca.analyze(arg1, options);
    throw new Error('Invalid argument type');
}
//#endregion

export function registerConfigAnalyzers(cas: IConfigAnalysis): void 
{
    cas.registerValueHostConfigPropertyAnalyzers(() => [
        new ValueHostTypePropertyAnalyzer(),
        new ValueHostNamePropertyAnalyzer(),
        new DataTypePropertyAnalyzer(),
        new LabelPropertiesAnalyzer(),
        new ParserLookupKeyPropertyAnalyzer(),
        new CalcFnPropertyAnalyzer()
    ]);
    cas.registerValidatorConfigPropertyAnalyzers(() => [
        new AllMessagePropertiesConfigPropertyAnalyzer(),
        new ConditionCreatorConfigPropertyAnalyzer()
    ]);
    cas.registerConditionConfigPropertyAnalyzers(() => [
        new ConditionTypeConfigPropertyAnalyzer(),
        new ConditionWithConversionLookupKeyPropertyAnalyzer(),
        new ConditionCategoryPropertyAnalyzer(),
        new ConditionWithChildrenPropertyAnalyzer(),
        new ConditionWithOneChildPropertyAnalyzer(),
        new ConditionWithValueHostNamePropertyAnalyzer(),
        new ConditionWithSecondValueHostNamePropertyAnalyzer(),
        new ConditionWithSecondValuePropertyAnalyzer()
    ]);
}