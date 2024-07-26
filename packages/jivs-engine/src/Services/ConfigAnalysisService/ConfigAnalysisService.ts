/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import {
    AnalysisArgs,
    ConfigAnalysisServiceOptions, IConditionConfigPropertyAnalyzer, IConfigAnalysisResultsExplorer, IConfigAnalysisResults,
    IConfigAnalysisService,
    IValidatorConfigPropertyAnalyzer,
    IValueHostConfigPropertyAnalyzer
} from "../../Interfaces/ConfigAnalysisService";
import { ServiceWithAccessorBase } from "../ServiceWithAccessorBase";
import { ValueHostsManagerConfig } from "../../Interfaces/ValueHostsManager";
import { ManagerConfigBuilderBase } from "../../ValueHosts/ManagerConfigBuilderBase";
import { IValidationServices, ServiceName } from "../../Interfaces/ValidationServices";
import { IValueHostsServices } from "../../Interfaces/ValueHostsServices";
import { ValidationManagerConfig } from '../../Interfaces/ValidationManager';
import { SampleValues } from "./SampleValues";
import { DataTypeConverterLookupKeyAnalyzer } from "./DataTypeConverterLookupKeyAnalyzer";
import {
    AnalysisResultsHelper
} from "./AnalysisResultsHelper";
import { DataTypeIdentifierLookupKeyAnalyzer } from "./DataTypeIdentifierLookupKeyAnalyzer";
import { DataTypeFormatterLookupKeyAnalyzer } from "./DataTypeFormatterLookupKeyAnalyzer";
import { DataTypeParserLookupKeyAnalyzer } from "./DataTypeParserLookupKeyAnalyzer";
import { ConditionConfigAnalyzer } from "./ConditionConfigAnalyzer";
import { LookupKey } from '../../DataTypes/LookupKeys';
import { ValidatorConfigAnalyzer } from './ValidatorConfigAnalyzer';
import { ValueHostConfigAnalyzer } from './ValueHostConfigAnalyzer';
import { DataTypeComparerAnalyzer } from './DataTypeComparerAnalyzer';
import { IAnalysisResultsHelper } from './../../Interfaces/ConfigAnalysisService';
import { ConfigAnalysisResultsExplorer, ConfigAnalysisResultsExplorerFactory } from "./ConfigAnalysisResultsExplorer";

/**
 * @inheritdoc Services/Types/ConfigAnalysisService!IConfigAnalysisService:interface
 */
export abstract class ConfigAnalysisServiceBase<TConfig extends ValueHostsManagerConfig, TServices extends IValueHostsServices>
    extends ServiceWithAccessorBase implements IConfigAnalysisService {

    constructor() {
        super();
    }


    protected getServices(): TServices {
        return this.services as unknown as TServices;
    }
    /**
     * Analyze the configuration
     * @param config The configuration to analyze
     * @param options Options for the analysis
     */
    public analyze(config: TConfig, options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer;
    /**
     * Analyze the configuration found in the Builder or Modifier object
     * @param builder 
     * @param options 
     */
    public analyze(builder: ManagerConfigBuilderBase<any>, options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer;
    public analyze(arg1: TConfig | ManagerConfigBuilderBase<any>, options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer {
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
            let result = analysisArgs.valueHostConfigAnalyzer!.analyze(vhConfig, null, results.valueHostResults);
            results.valueHostResults.push(result);
        });

        this.gatherDataTypeIdentifierLookupKeys(helper);

        return new ConfigAnalysisResultsExplorer<TServices>(results,
            new ConfigAnalysisResultsExplorerFactory(), this.getServices());
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
            lookupKeysIssues: [],
            valueHostResults: []
        };

        results.cultureIds = this.services.cultureService.availableCultures();
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
    protected createAnalysisArgs(config: TConfig, results: IConfigAnalysisResults, options: ConfigAnalysisServiceOptions): AnalysisArgs<TServices> {
        let analysisArgs: AnalysisArgs<TServices> = {
            valueHostConfigs: config.valueHostConfigs,
            results,
            services: this.getServices(),
            options: options,
            sampleValues: new SampleValues<TServices>(this.getServices(), options),
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
        // added into the LookupKeyCAResult.services. In that case, we are just
        // calling them out.
        // All user defined identifiers will be added because they are 
        // rare, and if supplied, they probably are intended to be used.
        const builtInIdentifiers: Array<string> = [LookupKey.Number, LookupKey.String, LookupKey.Boolean, LookupKey.Date];

        for (let idt of this.services.dataTypeIdentifierService.getAll()) {
            if (!builtInIdentifiers.includes(idt.dataTypeLookupKey) ||
                helper.results.lookupKeyResults.find(lk => lk.lookupKey === idt.dataTypeLookupKey))
                helper.registerLookupKey(idt.dataTypeLookupKey, ServiceName.identifier, null);   // uses DataTypeIdentifierLookupKeyAnalyzer
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
export class ValueHostsManagerConfigAnalysisService extends ConfigAnalysisServiceBase<ValueHostsManagerConfig, IValueHostsServices> {
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
export class ValidationManagerConfigAnalysisService extends ConfigAnalysisServiceBase<ValidationManagerConfig, IValidationServices> {
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
