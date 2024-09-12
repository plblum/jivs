/**
 * Interfaces and types for ConfigAnalysis class.
 * @module ConfigAnalysis/Types
 */
import { ValueHostsManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostsServices } from "@plblum/jivs-engine/build/Interfaces/ValueHostsServices";
import { ManagerConfigBuilderBase } from "@plblum/jivs-engine/build/ValueHosts/ManagerConfigBuilderBase";

import {
    IValueHostConfigPropertyAnalyzer, IValidatorConfigPropertyAnalyzer,
    IConditionConfigPropertyAnalyzer, IValueHostConfigAnalyzer, IValidatorConfigAnalyzer,
    IConditionConfigAnalyzer, IDataTypeComparerAnalyzer
} from "./Analyzers";
import { IConfigAnalysisResultsExplorer } from "./Explorer";
import { IConfigAnalysisResults } from "./Results";

/**
 * A tool to ensure that your configuration is as expected,
 * even before you create a ValidationManager object from it.
 * 
 * ConfigAnalysis does the following:
 * - Validates the properties throughout your ValueHostConfig objects, including:
 *   - Requested Lookup Keys have an associated class registered with the factories, taking cultures into account. (Lookup Keys are used to identify	data types, parsers, formatters, converters, and more.)
 * 	> When using dependency injection, it is not immediately apparent if the object
 * 	that you want is the one you get, especially because Jivs provides fallbacks for cultures and Lookup Keys.
 *   - Requested Condition Types are registered in the ConditionFactory.
 *   - Issues with tokens within error messages.
 *   - Required properties have values.
 *   
 * - Identifies each Lookup Key in use, along with the services that are needed by your ValueHostConfigs.
 * - For properties that support localization, it shows all cultural localizations of the text registered with the TextLocalizerService.
 *   > Localization has fallbacks. You may have a rule that lets all text fallback to your default language.
 * 
 * Jivs-ConfigAnalysis is a separate library, available within npm.
 * 
 * Go to [Jivs-ConfigAnalysis documentation](https://github.com/plblum/jivs/main/packages/jivs-configanalysis/).
 * 
 * Go to [Jivs-ConfigAnalysis npm page](https://www.npmjs.com/package/@plblum/jivs-configanalysis).
 */
export interface IConfigAnalysis {

    /**
     * Analyze the configuration
     * @param config The configuration to analyze
     * @param options Options for the analysis
     */
    analyze(config: ValueHostsManagerConfig, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer;
    /**
     * Analyze the configuration found in the Builder or Modifier object
     * @param builder 
     * @param options 
     */
    analyze(builder: ManagerConfigBuilderBase<any>, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer;    

    /**
     * Lazyloads all ValueHostConfigPropertyAnalyzers.
     * They are loaded only when the service's analyze method is called.
     * The supplied list is not checked for duplicates.
     * The order added is the order they are called.
     * @param lazyLoadAnalyzers - Function to return an array of Analyzers
     */
    registerValueHostConfigPropertyAnalyzers(lazyLoadAnalyzers: () => Array<IValueHostConfigPropertyAnalyzer>) :  void;

    /**
     * Lazyloads all ValidatorConfigPropertyAnalyzers.
     * They are loaded only when the service's analyze method is called.
     * The supplied list is not checked for duplicates.
     * The order added is the order they are called.
     * @param lazyLoadAnalyzers - Function to return an array of Analyzers
     */
    registerValidatorConfigPropertyAnalyzers(lazyLoadAnalyzers: () => Array<IValidatorConfigPropertyAnalyzer>) :  void;

     /**
     * Lazyloads all ConditionConfigPropertyAnalyzers.
     * They are loaded only when the service's analyze method is called.
     * The supplied list is not checked for duplicates.
     * The order added is the order they are called.
     * @param lazyLoadAnalyzers  - Function to return an array of Analyzers
     */
    registerConditionConfigPropertyAnalyzers(lazyLoadAnalyzers: () => Array<IConditionConfigPropertyAnalyzer>): void;

}


/**
 * Each call to analysis packages up data for the other classes to use in this.
 */
/**
 * Represents the arguments for analysis in the ConfigAnalysis.
 * @template TServices - The type of services provided by IValueHostsServices.
 */
export interface AnalysisArgs<TServices extends IValueHostsServices> {
    valueHostConfigs: Array<ValueHostConfig>;
    results: IConfigAnalysisResults;
    services: TServices;
    options: ConfigAnalysisOptions;
    sampleValues: ISampleValues;

    /**
     * Analyzer for any ValueHostConfig object. In addition to checking
     * that the valueHostType is in the ValueHostFactory, it
     * uses the valueHostConfigPropertyAnalyzers to check the properties.
     */
    valueHostConfigAnalyzer?: IValueHostConfigAnalyzer<TServices>;
    /**
     * Analyzer for any ValidatorConfig object. In addition to checking
     * that the validatorType is in the ValidatorFactory, it
     * uses the validatorConfigPropertyAnalyzers to check the properties.
     */
    validatorConfigAnalyzer?: IValidatorConfigAnalyzer;

    /**
     * Analyzer for any ConditionConfig object. In addition to checking
     * that the conditionType is in the ConditionFactory, it
     * uses the conditionConfigPropertyAnalyzers to check the properties.
     */
    conditionConfigAnalyzer?: IConditionConfigAnalyzer<TServices>;

    /**
     * Analyzer for identifying if a ConditionConfig needs a comparer.
     * It sets up LookupKeyCAResult.services for the ServiceName.comparer.
     */
    comparerAnalyzer?: IDataTypeComparerAnalyzer;
}


/**
 * Options for the configuration analysis service.
 */
export interface ConfigAnalysisOptions {
    /**
     * Allows the user to help the service find the data values
     * it uses in analysis of a data type by associating a data value
     * with a LookupKey.
     * Normally, the service will use the data values found
     * in IDataTypeIdentifiers.
     * This is a way to override or supplement that.
     * 
     * A data value is used to identify DataTypeConverters,
     * and DataTypeComparers. It is also used to as the data to format
     * in a DataTypeFormatter.
     * 
     * You don't need to supply all lookup keys. If the results of
     * running the analysis has a missing lookup key, it will be reported
     * and you can then supply the data value for it.
     */
    lookupKeysSampleValues?: { [lookupKey: string]: unknown };

    /**
     * Allows the user to help the service find the data values
     * it uses in analysis of a data type by associating a data value
     * with a ValueHostName.
     * 
     * You don't need to supply all value hosts. If the ValueHost.dataType
     * is assigned, its value can come from a DataTypeIdentifier
     * or lookupKeysSampleValues. If the ValueHost.dataType is not assigned,
     * this can supply a value.
     */
    valueHostsSampleValues?: { [valueHostName: string]: unknown };

    /**
     * Allows the user to help the service find the Input values
     * to use when testing the parsers.
     * 
     * If there is no Input Value for a ValueHost, the analysis will
     * not check its parser for errors.
     */
    inputValueHostSampleValues?: { [valueHostName: string]: unknown };
}

/**
 * Supplies a sample value for any lookup key supplied,
 * so long as it can be identified as a DataType with a value.
 * For example, make the "Integer" lookup key return "100" as a sample value.
 * This class works together with properties found in ConfigAnalysisOptions.
 * The user sets the sample values in the options, and SampleValues implementation consumes them.
 */
export interface ISampleValues {
    /**
      * Tries to get a sample value for the lookup key or valueHost.
      * If it is not found, returns undefined.
      * ValueHost data is supplied by the user through options.valueHostsSampleValues.
      * LookupKey data can be supplied by the user through options.lookupKeysSampleValues.
      * If not found, it will try to identify the lookup key through DataTypeIdentifiers.
      * @param lookupKey 
      * @param valueHostConfig
      * @returns if undefined, there was no sample value found.
      * Otherwise the value (including null) is a sample value.
      */
   
     getSampleValue(lookupKey: string | null, valueHostConfig: ValueHostConfig | null): any;
     /**
      * Registers a sample value for the lookup key.
      * If the lookup key is already registered, it will replace the sample value.
      * @param lookupKey 
      * @param sampleValue 
      */    
     registerSampleValue(lookupKey: string, sampleValue: any): void;
}
