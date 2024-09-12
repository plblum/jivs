/**
 * 
 * @module ConfigAnalysis/Classes
 */


import { ValueHostsManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { ManagerConfigBuilderBase } from "@plblum/jivs-engine/build/ValueHosts/ManagerConfigBuilderBase";
import { IValidationServices, ServiceName } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { IValueHostsServices } from "@plblum/jivs-engine/build/Interfaces/ValueHostsServices";
import { ValidationManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import {
    IAnalysisResultsHelper, IValueHostConfigPropertyAnalyzer,
    IValidatorConfigPropertyAnalyzer, IConditionConfigPropertyAnalyzer
} from "./Types/Analyzers";
import { IConfigAnalysis, ConfigAnalysisOptions, AnalysisArgs } from "./Types/ConfigAnalysis";
import { IConfigAnalysisResultsExplorer } from "./Types/Explorer";
import { IConfigAnalysisResults } from "./Types/Results";
import { AnalysisResultsHelper } from "./Analyzers/AnalysisResultsHelper";
import { ConditionConfigAnalyzer } from "./Analyzers/ConditionConfigAnalyzer";
import { DataTypeComparerAnalyzer } from "./Analyzers/DataTypeComparerAnalyzer";
import { DataTypeConverterLookupKeyAnalyzer } from "./Analyzers/DataTypeConverterLookupKeyAnalyzer";
import { DataTypeFormatterLookupKeyAnalyzer } from "./Analyzers/DataTypeFormatterLookupKeyAnalyzer";
import { DataTypeIdentifierLookupKeyAnalyzer } from "./Analyzers/DataTypeIdentifierLookupKeyAnalyzer";
import { DataTypeParserLookupKeyAnalyzer } from "./Analyzers/DataTypeParserLookupKeyAnalyzer";
import { ValidatorConfigAnalyzer } from "./Analyzers/ValidatorConfigAnalyzer";
import { ValueHostConfigAnalyzer } from "./Analyzers/ValueHostConfigAnalyzer";
import { ConfigAnalysisResultsExplorer, ConfigAnalysisResultsExplorerFactory } from "./Explorer/ConfigAnalysisResultsExplorer";
import { SampleValues } from "./SampleValues";

/**
 * @inheritdoc Types!IConfigAnalysis:interface
 */
export abstract class ConfigAnalysisBase<TConfig extends ValueHostsManagerConfig, TServices extends IValueHostsServices>
    implements IConfigAnalysis {

    /**
     * Analyze the configuration
     * @param config The configuration to analyze
     * @param options Options for the analysis
     */
    public analyze(config: TConfig, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer;
    /**
     * Analyze the configuration found in the Builder or Modifier object
     * @param builder 
     * @param options 
     */
    public analyze(builder: ManagerConfigBuilderBase<any>, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer;
    public analyze(arg1: TConfig | ManagerConfigBuilderBase<any>, options?: ConfigAnalysisOptions): IConfigAnalysisResultsExplorer {
        let config: TConfig;
        if (arg1 instanceof ManagerConfigBuilderBase)
            config = arg1.snapshot();
        else
            config = arg1 as TConfig;
        if (!options)
            options = {};
        
        let results = this.createConfigAnalysisResults(config);
        let analysisArgs = this.createAnalysisArgs(config, results, options);
        let helper = this.createHelper(analysisArgs);
        this.resolveConfigAnalyzers(analysisArgs, helper);
        
        // Analyze the config and populate the results object
        config.valueHostConfigs.forEach(vhConfig => {
            let dtFixed = this.tryFixDataTypeLookupKey(vhConfig, helper);

            let result = analysisArgs.valueHostConfigAnalyzer!.analyze(vhConfig, null, results.valueHostResults);
            results.valueHostResults.push(result);
            
            if (dtFixed)
                vhConfig.dataType = undefined; 
        });

        this.gatherDataTypeIdentifierLookupKeys(helper);

        return new ConfigAnalysisResultsExplorer<TServices>(results,
            new ConfigAnalysisResultsExplorerFactory(), config.services as TServices);
    }

    /**
     * Creates the configuration analysis results based on the provided config.
     * @param config - The configuration object.
     * @returns The configuration analysis results.
     */
    protected createConfigAnalysisResults(config: TConfig): IConfigAnalysisResults {
        let results: IConfigAnalysisResults = {
            cultureIds: [],
            valueHostNames: [],
            lookupKeyResults: [],
            valueHostResults: []
        };

        results.cultureIds = config.services.cultureService.availableCultures();
        results.valueHostNames = this.getValueHostNames(config);
        return results;
    }
    /**
     * Creates the analysis arguments for the configuration analysis.
     * 
     * @param config - The configuration object.
     * @param results - The analysis results object.
     * @param options - The options for the analysis service.
     * @returns The analysis arguments.
     */
    protected createAnalysisArgs(config: TConfig, results: IConfigAnalysisResults, options: ConfigAnalysisOptions): AnalysisArgs<TServices> {
        let analysisArgs: AnalysisArgs<TServices> = {
            valueHostConfigs: config.valueHostConfigs,
            results,
            services: config.services as TServices,
            options: options,
            sampleValues: new SampleValues<TServices>(config.services as TServices, options),
        };        
        return analysisArgs;
    }

    /**
     * Resolves the config analyzers for the given analysis arguments and helper.
     * Expect analysisArgs to have these properties established:
     * valueHostConfigAnalyzer, validatorConfigAnalyzer, conditionConfigAnalyzer
     * @param analysisArgs - The analysis arguments.
     * @param helper - The analysis results helper.
     */
    protected resolveConfigAnalyzers(analysisArgs: AnalysisArgs<TServices>, helper: AnalysisResultsHelper<TServices>): void {
        analysisArgs.conditionConfigAnalyzer =
            new ConditionConfigAnalyzer<TServices>(helper, this.conditionConfigPropertyAnalyzers);

        analysisArgs.comparerAnalyzer = new DataTypeComparerAnalyzer<TServices>(helper);
        analysisArgs.valueHostConfigAnalyzer = new ValueHostConfigAnalyzer<TServices>(helper, this.valueHostConfigPropertyAnalyzers);
    }

    /**
     * Returns a new instance of AnalysisResultsHelper, already setup with LookupKeyAnalyzers.
     * @param args 
     */
    protected abstract createHelper(args: AnalysisArgs<TServices>): AnalysisResultsHelper<TServices>;

    protected getValueHostNames(config: TConfig): Array<string> {
        return config.valueHostConfigs.map(vh => vh.name);  // keeps duplicates
    }

    /**
     * We allow ValueHostConfig.dataType to be unassigned, and expect
     * a DataTypeIdentifier to identify the Lookup Key based on the actual data.
     * Since services often depend on ValueHostConfig.dataType, we want them to 
     * handle the case where it is not assigned. This function will try to fix
     * the ValueHostConfig.dataType by identifying the data type of the sample value
     * supplied in options.valueHostsSampleValues.
     * If fixed, it returns true.
     */
    protected tryFixDataTypeLookupKey(valueHostConfig: ValueHostConfig,
        helper: IAnalysisResultsHelper<TServices>): boolean {

        if (!valueHostConfig.dataType) {
            let sampleValue = helper.getSampleValue(null, valueHostConfig);
            if (sampleValue) {
                let dtlk = helper.services.dataTypeIdentifierService.identify(sampleValue);
                if (dtlk) {
                    valueHostConfig.dataType = dtlk;
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Handles IDataTypeIdentifier objects through the DataTypeIdentifierService.
     * There are no lookupKeys that select a DataTypeIdentifier. 
     * Instead, the data value supplied to its supportsValue() function 
     * will determine if it can SUPPLY a lookup key.
     * Our task is to take all registered DataTypeIdentifiers and add them
     * to the LookupKeyCAResult.services specific to their data type.
     * This is run after all ValueHostConfigs have been analyzed.
     * We'll only add the lookup key if it is not already in the LookupKeyCAResult.
     * Note that the DataTypeIdentifierLookupKeyAnalyzer is still used to populate
     * the LookupKeyCAResult.services object.
     */
    protected gatherDataTypeIdentifierLookupKeys(helper: IAnalysisResultsHelper<TServices>): void {

        // We don't want to add built-in identifiers unless they are already
        // added into the LookupKeyCAResult.serviceResults. In that case, we are just
        // calling them out.
        // All user defined identifiers will be added because they are 
        // rare, and if supplied, they probably are intended to be used.
        const builtInIdentifiers: Array<string> = [LookupKey.Number, LookupKey.String, LookupKey.Boolean, LookupKey.Date];

        for (let idt of helper.services.dataTypeIdentifierService.getAll()) {
            if (!builtInIdentifiers.includes(idt.dataTypeLookupKey) ||
                helper.results.lookupKeyResults.find(lk => lk.lookupKey === idt.dataTypeLookupKey))
                helper.registerServiceLookupKey(idt.dataTypeLookupKey, ServiceName.identifier, null);   // uses DataTypeIdentifierLookupKeyAnalyzer
        }
    }    
    /**
     * ValueHostConfig properties need to implement IValueHostConfigPropertyAnalyzer
     * to add analysis. All built-in properties already have analyzers.
     * Properties are lazy-loaded from the function supplied to registerValueHostConfigPropertyAnalyzers().
     */
    protected get valueHostConfigPropertyAnalyzers(): Array<IValueHostConfigPropertyAnalyzer>
    {
        if (this._valueHostConfigPropertyAnalyzersLoader)
        {
            let analyzers = this._valueHostConfigPropertyAnalyzersLoader();
            for (let analyzer of analyzers)
                this._valueHostConfigPropertyAnalyzers.push(analyzer);            
            this._valueHostConfigPropertyAnalyzersLoader = undefined;
        }
        return this._valueHostConfigPropertyAnalyzers;
    }
    private _valueHostConfigPropertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];

    /**
     * Lazyloads all ValueHostConfigPropertyAnalyzers.
     * They are loaded only when the service's analyze method is called.
     * The supplied list is not checked for duplicates.
     * The order added is the order they are called.
     * @param lazyLoadAnalyzers - Function to return an array of Analyzers
     */
    public registerValueHostConfigPropertyAnalyzers(lazyLoadAnalyzers: () => Array<IValueHostConfigPropertyAnalyzer>) :  void {
        this._valueHostConfigPropertyAnalyzersLoader = lazyLoadAnalyzers;
    }
    private _valueHostConfigPropertyAnalyzersLoader: (() => Array<IValueHostConfigPropertyAnalyzer>) | undefined = undefined
    

    /**
     * ValidatorConfig properties need to implement IValidatorConfigPropertyAnalyzer
     * to add analysis. All built-in properties already have analyzers.
     * Properties are lazy-loaded from the function supplied to registerValidatorConfigPropertyAnalyzers().
     */
    protected get validatorConfigPropertyAnalyzers(): Array<IValidatorConfigPropertyAnalyzer>
    {
        if (this._validatorConfigPropertyAnalyzersLoader)
        {
            let analyzers = this._validatorConfigPropertyAnalyzersLoader();
            for (let analyzer of analyzers)
                this._validatorConfigPropertyAnalyzers.push(analyzer);            
            this._validatorConfigPropertyAnalyzersLoader = undefined;
        }
        return this._validatorConfigPropertyAnalyzers;
    }
    private _validatorConfigPropertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];

    /**
     * Lazyloads all ValidatorConfigPropertyAnalyzers.
     * They are loaded only when the service's analyze method is called.
     * The supplied list is not checked for duplicates.
     * The order added is the order they are called.
     * @param lazyLoadAnalyzers - Function to return an array of Analyzers
     */
    public registerValidatorConfigPropertyAnalyzers(lazyLoadAnalyzers: () => Array<IValidatorConfigPropertyAnalyzer>) :  void {
        this._validatorConfigPropertyAnalyzersLoader = lazyLoadAnalyzers;
    }
    private _validatorConfigPropertyAnalyzersLoader: (() => Array<IValidatorConfigPropertyAnalyzer>) | undefined = undefined


    /**
     * ConditionConfig properties need to implement IConditionConfigPropertyAnalyzer
     * to add analysis. All built-in properties already have analyzers.
     * Properties are lazy-loaded from the function supplied to registerConditionConfigPropertyAnalyzers().
     */
    protected get conditionConfigPropertyAnalyzers(): Array<IConditionConfigPropertyAnalyzer>
    {
        if (this._conditionConfigPropertyAnalyzersLoader)
        {
            let analyzers = this._conditionConfigPropertyAnalyzersLoader();
            for (let analyzer of analyzers)
                this._conditionConfigPropertyAnalyzers.push(analyzer);            
            this._conditionConfigPropertyAnalyzersLoader = undefined;
        }
        return this._conditionConfigPropertyAnalyzers;
    }
    private _conditionConfigPropertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];

    /**
     * Lazyloads all ConditionConfigPropertyAnalyzers.
     * They are loaded only when the service's analyze method is called.
     * The supplied list is not checked for duplicates.
     * The order added is the order they are called.
     * @param lazyLoadAnalyzers - Function to return an array of Analyzers
     */
    public registerConditionConfigPropertyAnalyzers(lazyLoadAnalyzers: () => Array<IConditionConfigPropertyAnalyzer>) :  void {
        this._conditionConfigPropertyAnalyzersLoader = lazyLoadAnalyzers;
    }
    private _conditionConfigPropertyAnalyzersLoader: (() => Array<IConditionConfigPropertyAnalyzer>) | undefined = undefined
}

/**
 * ValueHostsManagerConfig analysis service.
 */
export class ValueHostsManagerConfigAnalysis extends ConfigAnalysisBase<ValueHostsManagerConfig, IValueHostsServices> {
    protected createHelper(args: AnalysisArgs<IValueHostsServices>): AnalysisResultsHelper<IValueHostsServices> {
        let helper = new AnalysisResultsHelper<IValueHostsServices>(args);

        helper.registerLookupKeyAnalyzer(ServiceName.converter, new DataTypeConverterLookupKeyAnalyzer(args));
        helper.registerLookupKeyAnalyzer(ServiceName.identifier, new DataTypeIdentifierLookupKeyAnalyzer(args));
        return helper;
    }
}

/**
 * ValidationManagerConfig analysis service.
 */
export class ValidationManagerConfigAnalysis extends ConfigAnalysisBase<ValidationManagerConfig, IValidationServices> {
    protected createHelper(args: AnalysisArgs<IValidationServices>): AnalysisResultsHelper<IValidationServices> {
        let helper = new AnalysisResultsHelper<IValidationServices>(args);
        helper.registerLookupKeyAnalyzer(ServiceName.converter, new DataTypeConverterLookupKeyAnalyzer(args));
        helper.registerLookupKeyAnalyzer(ServiceName.parser, new DataTypeParserLookupKeyAnalyzer(args));
        helper.registerLookupKeyAnalyzer(ServiceName.formatter, new DataTypeFormatterLookupKeyAnalyzer(args));
        helper.registerLookupKeyAnalyzer(ServiceName.identifier, new DataTypeIdentifierLookupKeyAnalyzer(args));

        //!!! PENDING: How to handle autoGenerateDataTypeCheckService?
        return helper;
    }
    protected resolveConfigAnalyzers(analysisArgs: AnalysisArgs<IValidationServices>, helper: AnalysisResultsHelper<IValidationServices>): void {
        super.resolveConfigAnalyzers(analysisArgs, helper);
        analysisArgs.validatorConfigAnalyzer = new ValidatorConfigAnalyzer(helper, this.validatorConfigPropertyAnalyzers);
    }

}
