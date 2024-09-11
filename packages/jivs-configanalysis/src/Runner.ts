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
import { ConfigAnalysisServiceOptions, IConfigAnalysisService } from "./Types/ConfigAnalysis";
import { ValidationManagerConfigBuilder } from "@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder";
import { ValidationManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";
import { IConfigAnalysisResultsExplorer } from "./Types/Explorer";
import { ValidationManagerConfigAnalysisService } from "./ConfigAnalysis";


/**
 * Analyze the configuration
 * @param config The configuration to analyze
 * @param options Options for the analysis
 */
export function analyze(config: ValidationManagerConfig, options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer;
/**
 * Analyze the configuration found in the Builder or Modifier object
 * @param builder 
 * @param options 
 */
export function analyze(builder: ValidationManagerConfigBuilder, options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer;
export function analyze(arg1: ValidationManagerConfig | ValidationManagerConfigBuilder, options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer {
    let ca = new ValidationManagerConfigAnalysisService();
    registerConfigAnalyzers(ca); 
    if (arg1 instanceof ValidationManagerConfigBuilder)
        return ca.analyze(arg1, options);
    if (arg1 instanceof Object)
        return ca.analyze(arg1, options);
    throw new Error('Invalid argument type');
}


export function registerConfigAnalyzers(cas: IConfigAnalysisService): void 
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