/**
 * Interface for the configuration analysis service
 * @module Services/Types/ConfigAnalysisService
 */

import { ManagerConfigBuilderBase } from "../ValueHosts/ManagerConfigBuilderBase";
import { ConditionConfig } from "./Conditions";
import { IService, IServicesAccessor } from "./Services";
import { IValidationServices, ServiceName } from "./ValidationServices";
import { IValidator, ValidatorConfig } from "./Validator";
import { ValueHostConfig } from "./ValueHost";
import { ValueHostsManagerConfig } from "./ValueHostsManager";
import { IValueHostsServices } from "./ValueHostsServices";

//#region Service interfaces

/**
 * A service to analyze a complete ValueHostsManagerConfig and ValidationManagerConfig
 * to locate any issues that may cause the configuration to fail.
 * Also to provide a report of the configuration against the services, where many
 * optional features must be installed. For example, if you use the AllMatchCondition object,
 * it must be registered in services.conditionFactory first.
 * 
 * Generally call its analyze() function using the Builder object, Modifier object,
 * or the Config object itself, but prior to applying them to the ValueHostsManager or ValidationManager.
 * 
 * ```ts
 * let services = createValidationServices();
 * services.conditionFactory.register<AllMatchConditionConfig>((config) => new AllMatchCondition(config));
 * 
 * let builder = build(services);
 * builder.input('FieldName').all((childrenBuilder) => ... add conditions to childrenBuilder ...);
 * services.configAnalysisService.analyze(builder, { options }).toLogger(); // toConsole() etc.
 * let vm = new ValidationManager(builder);
 * ```
 */
export interface IConfigAnalysisService extends IService, IServicesAccessor {

    /**
     * Analyze the configuration
     * @param config The configuration to analyze
     * @param options Options for the analysis
     */
    analyze(config: ValueHostsManagerConfig, options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer;
    /**
     * Analyze the configuration found in the Builder or Modifier object
     * @param builder 
     * @param options 
     */
    analyze(builder: ManagerConfigBuilderBase<any>, options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer;    

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
 * Represents the arguments for analysis in the ConfigAnalysisService.
 * @template TServices - The type of services provided by IValueHostsServices.
 */
export interface AnalysisArgs<TServices extends IValueHostsServices> {
    valueHostConfigs: Array<ValueHostConfig>;
    results: IConfigAnalysisResults;
    services: TServices;
    options: ConfigAnalysisServiceOptions;
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
     * It sets up LookupKeyInfo.services for the ServiceName.comparer.
     */
    comparerAnalyzer?: IDataTypeComparerAnalyzer;
}

/**
 * Represents the analysis results of a configuration.
 */
export interface IConfigAnalysisResults {

    /**
     * The list of all cultureIds found in the configuration.
     * All of these will be used in tests to ensure the services are installed.
     */
    cultureIds: Array<string>;

    /**
     * A list of all valid ValueHostNames found.
     */
    valueHostNames: Array<string>; 

    /**
     * A list of all lookup keys used, including how they are used,
     * such as as a DataType, for a parser, for a converter, etc.
     * Identifies the Class that was successfully identified in a service's registry
     * or reports an error if not found.
     */
    lookupKeysInfo: Array<LookupKeyInfo>;

    /**
     * A list of all lookup keys used that were not found in the services,
     * often due to case insensitive match or having whitespace.
     */
    lookupKeysIssues: Array<LookupKeyIssue>;

    /**
     * A list of all issues found in the ValueHostConfig objects, such as missing properties,
     * and their ValidatorConfigs and ConditionConfigs.
     */
    configIssues: Array<ValueHostConfigResults>;
}

/**
 * Tool to explore the results of the configuration analysis. 
 * This is the result of the IConfigAnalysisService's analyze method.
 * It provides methods to count, collect, and report the results,
 * all based on the criteria supplied.
 * Intended for your testing code and to write the results to something that can store them,
 * even if you don't have a testing situation.
 */
export interface IConfigAnalysisResultsExplorer {
    results: IConfigAnalysisResults;

    /**
     * Return a count of the number of ConfigResult objects found in the ConfigIssues array
     * matching the criteria.
     * @param criteria When null, return all results.
     */
    countConfigResults(criteria: IConfigAnalysisSearchCriteria | null): number;

    /**
     * Return a count of the number of LookupKeyInfo objects and all children
     * found in the LookupKeysInfo array matching the criteria.
     * @param criteria 
     */
    countLookupKeyResults(criteria: IConfigAnalysisSearchCriteria | null): number;

    /**
     * Return a list of all ConfigResult objects found in the ConfigIssues array,
     * wrapped in a CAPathedResult object.
     * @param criteria 
     */
    collectWithConfigs(criteria: IConfigAnalysisSearchCriteria | null, factory: CAExplorerFactory): Array<CAPathedResult<any>>;

    /**
     * Return a list of all LookupKeyInfo objects found in the LookupKeysInfo array,
     * wrapped in a CAPathedResult object.
     */
    collectWithLookupKeys(criteria: IConfigAnalysisSearchCriteria | null, factory: CAExplorerFactory): Array<CAPathedResult<any>>;

    // which data type service did you expect on a ConfigResult object when there was one found?

    // which ConfigResults objects indicate a missing data type service?

    // reportWithConfigs takes results from Array<PathedConfigResults>, runs them
    // through a formatter, and passes the result into an output service like the logger,
    // localizationService, etc.
    // reportWithConfigs(criteria: IConfigAnalysisSearchCriteria, formatter: IConfigAnalysisOutputFormatter, outputService: IConfigAnalysisOutputService): void;

    // reportWithLookupKeys(criteria: IConfigAnalysisSearchCriteria, formatter: IConfigAnalysisOutputFormatter, outputService: IConfigAnalysisOutputService): void;

}

/**
 * For Explorer's count and collect methods, this is the criteria to match against.
 * To match, all assigned criteria must match SO LONG AS
 * it is applicable to the object being evaluated.
 * For example, when the feature is 'LookupKey', the lookupKeys criteria is used.
 */
export interface IConfigAnalysisSearchCriteria {
    /**
     * Match to any feature listed or all features if undefined.
     * Case insensitive match.
     */
    features?: Array<string>;

    /**
     * Match to any severity listed or all severities if undefined.
     * Use null for no severity assigned, which means there is no issue on the record.
     */
    severities?: Array<ConfigIssueSeverity | null>;

//#region identities for specific ConfigAnalysisResult objects based on their feature property.    
    /**
     * Match to any lookupKey listed or all lookupKeys if undefined.
     * Only applies to LookupKeyInfo objects.
     * Case insensitive match.
     */
    lookupKeys?: Array<string>;
    /**
     * Match to any serviceName listed or all serviceNames if undefined.
     * Only applies to LookupKeyServiceInfoBase objects
     * Case insensitive match.
     */
    serviceNames?: Array<string>;

    /**
     * Match to any valueHostName listed or all valueHostNames if undefined.
     * Case insensitive match.
     */
    valueHostNames?: Array<string>;

    /**
     * Match to any errorCode listed or all errorCodes if undefined.
     * Only applies to ValidatorConfigResults objects.
     * Case insensitive match.
     */
    errorCodes?: Array<string>;

    /**
     * Match to any conditionType listed or all conditionTypes if undefined.
     * Only applies to ConditionConfigResults objects.
     * Case insensitive match.
     */
    conditionTypes?: Array<string>;

    /**
     * Match to any propertyName listed or all propertyNames if undefined.
     * Only applies to ConfigPropertyResult objects.
     * Case insensitive match.
     */
    propertyNames?: Array<string>;
//#endregion identities for specific ConfigAnalysisResult objects based on their feature property.    
}
/**
 * Represents a result of evaluating a single ConfigAnalysisResult object.
 * It basically holds the ConfigAnalysisResult and the path to it.
 * The idea is to flatten the results which are a tree into a single array.
 */
export interface CAPathedResult<T extends ConfigAnalysisResultBase> {
    path: Array<{ feature: string, identifier: string }>;
    result: T;
}

export interface IConfigAnalysisOutputFormatter {
}
export interface IConfigAnalysisOutputService {
}

/**
 * For building an object that can handle a specific type of configuration object based 
 * on the feature property. These classes are registered with the ConfigAnalysisResultsExplorer
 * and are created in a factory approach based on the config result object.
 */
export interface ICAExplorerBase<T extends ConfigAnalysisResultBase> {
    /**
     * Gets the result of the configuration analysis, which is an object structure
     * with data from Configuration objects in configIssues,
     * and data from Lookup Keys and their associated services in lookupKeysInfo.
     * @returns The result of the configuration analysis.
     */
    result: T;

    /**
     * A fixed value representing the only feature string that is supported by this class.
     * Each ConfigAnalysisResultBase object has a feature property that is matched to this one.
     */
    feature(): string;

/**
 * Provides a way to identify the specific instance of this object.
 * Example values are valueHostName, lookupKey, errorCode, conditionType, or the property name of a config object.
 * These are used to build a path to the object in the configuration.
 */
    identifier(): string | null;

    /**
     * Determines if the result matches the criteria.
     * It does not evaluate any children of the result.
     * 
     * To match, all assigned criteria must match SO LONG AS
     * it is applicable to the object being evaluated.
     * For example, when the feature is 'LookupKey', the lookupKeys criteria is used.

     * @param criteria When null, it means include all and thus return null.
     */
    match(criteria: IConfigAnalysisSearchCriteria | null): boolean;

    /**
     * Using match on itself and its children, collect all results that match the criteria
     * into the matches array.
     * @param criteria - The criteria to match against. When null, include all.
     * @param matches - Where to add any generated CAPathedResult objects.
     * @param path The feature + identifier from each parent object to this object. When this calls a child,
     * it creates a new path from this plus its own identifier. Nothing is added if the identifier is null.
     * @param factory The factory to create entries going into matches.
     */
    collect(criteria: IConfigAnalysisSearchCriteria | null, matches: Array<CAPathedResult<T>>,
        path: Array<{ feature: string, identifier: string }>, factory: CAExplorerFactory): void;
    
    /**
     * Return a list of all children of the result that match the criteria
     * or [] if no children are available.
     */
    children(): Array<ConfigAnalysisResultBase>;

}

// /**
//  * Classes that implement will be created for each object found in IConfigAnalysisResults.configIssues.,
//  * based on the feature property. The ConfigAnalysisResultsExplorer is a factory of these.
//  */
// export interface ICAConfigResultsExplorer<T extends ConfigResults<TConfig>, TConfig>  extends ICAExplorerBase<T>
// {

// }
// // same for IConfigAnalysisResults.lookupKeysInfo
// /**
//  * Classes that implement will be created for each object found in IConfigAnalysisResults.lookupKeysInfo,
//  * based on the feature property. The ConfigAnalysisResultsExplorer is a factory of these.
//  */
// export interface ICALookupKeysInfoExplorer<T extends LookupKeyServiceInfoBase> extends ICAExplorerBase<T>
// {
    
// }

/**
 * Factory to create the appropriate ConfigResultsExplorer object for the ConfigResults object based on the feature.
 */
export interface CAExplorerFactory {
    /**
     * Create the appropriate ConfigResultsExplorer object for the ConfigResults object based on the feature.
     * It is a factory method that creates the object from the functions registered with 
     * registerConfigResultsExplorer().
     * @param configResult 
     * @returns A new ConfigResultsExplorer object assigned to the configResult object.
     */
    create(configResult: ConfigAnalysisResultBase): ICAExplorerBase<ConfigAnalysisResultBase>;

    /**
     * Register a new ConfigResultsExplorer with this object.
     * @param feature - The feature that will be used to identify the object by the factory.
     * @param explorerCreator - Once identified, this function will create the object. It is passed the ConfigResults object
     * which is expected to be assigned to the result property of the object.
     */
    register(feature: string, explorerCreator: ExplorerCreatorHandler): void;

}

export type ExplorerCreatorHandler = (configResult: ConfigAnalysisResultBase) => ICAExplorerBase<ConfigAnalysisResultBase>;


/**
 * Options for the configuration analysis service.
 */
export interface ConfigAnalysisServiceOptions {
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

    
// options for Output    
    /**
     * When true or undefined, output each object registered in these services
     * that was used in the configuration. Default is true.
     */
    registeredServicesUsed?: boolean;

    // warning vs error

    // how to report TextLocalizerService issues: only when missing any support, when wrong language is selected, when supported but falls back to "default text" passed in.
}

/**
 * Supplies a sample value for any lookup key supplied,
 * so long as it can be identified as a DataType with a value.
 * For example, make the "Integer" lookup key return "100" as a sample value.
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
   
     getSampleValue(lookupKey: string, valueHostConfig: ValueHostConfig): any;
     /**
      * Registers a sample value for the lookup key.
      * If the lookup key is already registered, it will replace the sample value.
      * @param lookupKey 
      * @param sampleValue 
      */    
     registerSampleValue(lookupKey: string, sampleValue: any): void;
}

//#endregion Service interfaces
 
//#region LookupKeyAnalyzer interfaces
/**
 * Each service that has registered data associated with a key --- lookup key, condition type, etc ---
 * has a child of this class registered with the CodeAnalysisService.
 * Each provides a way to take that key and retrieve the matching object, or report an error when not found.
 */
export interface ILookupKeyAnalyzer {
    /**
     * Analyzes the key, creating an entry in the results describing it and reports any issues found.
     * If the object depends on cultures too, internally should use results.cultureIds.
     * Implementation should expect to catch errors and write them to results.lookupKeysIssues.
     * @param key 
     * @param valueHostConfig
     * @returns A new LookupKeyServiceInfo object with the results of the analysis.
     * Add it to the LookupKeyInfo.services array.
     */
    analyze(key: string, valueHostConfig: ValueHostConfig | null): LookupKeyServiceInfoBase;
}

/**
 * Represents an interface for a data type comparer analyzer.
 * This interface provides methods to check condition configurations for the need of a comparer
 * and to register additional condition types that require a comparer.
 * 
 * @typeparam TServices - The type of value host services.
 */
export interface IDataTypeComparerAnalyzer {
     /**
     * All ConditionConfigs are passed to this method. They will be evaluated
     * for the need of a comparer. If so, try to determine the data type lookup key 
     * from ValueHostConfig.dataType and ConditionConfig.conversionLookupKey/secondConversionLookupKey.
     * We'll work with those that have such a lookup key. Using the SampleValue class, we'll get
     * sample values to try to find a comparer. Whatever teh results, they'll be added to the LookupKeysInfo.services
     * as a ServiceName.comparer. Future calls with the same lookup key will not need to re-analyze.
     * 
     * When there is an issue, its typically a warning or info, not an error. 'error' is reserved for 
     * telling the user that something must be fixed. With comparers, that's rare.
     * 
     * @param conditionConfig 
     * @returns When null, no reason to evaluate for the comparer. Otherwise, the same
     * OneClassRetrieval object that was added to the LookupKeysInfo.services array.
     */
    checkConditionConfig(conditionConfig: ConditionConfig, valueHostConfig: ValueHostConfig): OneClassRetrieval | null;
}

//#region description of results

/**
 * Represents the base structure for a configuration analysis result.
 */
export interface ConfigAnalysisResultBase {
    feature: string;
}



/**
 * Represents a configuration result message.
 * Its severity determines how to handle the message.
 * Intended to be added to other interfaces, not used on its own.
 */
export interface ConfigResultMessageBase {
    severity?: ConfigIssueSeverity;
    message?: string;    
}

/**
 * Represents the severity level of a configuration issue.
 * These can be filtered by the user to only show certain levels of issues
 * in the ConfigAnalysisOutput.
 */
export enum ConfigIssueSeverity {
    info = 'info',
    warning = 'warning',
    error = 'error'
}


/**
 * Represents a message containing the result of a configuration analysis.
 * This is a complete object, for lists of general messages like in 
 * ConfigAnalysisResults.lookupKeysIssues.
 */
export interface ConfigResultMessage extends ConfigResultMessageBase, ConfigAnalysisResultBase
{

}

export interface LookupKeyIssue extends ConfigResultMessageBase, ConfigAnalysisResultBase {
    lookupKey: string;
}

export const lookupKeyFeature = 'LookupKey';
/**
 * Each Lookup Key found gets one of these objects in the results.
 * It encapsulates all the services that use the lookup key.
 * Invalid lookup keys are reported in ConfigAnalysisResults.lookupKeysIssues
 * and with the PropertyInfo object specifically supplying the invalid key.
 */
export interface LookupKeyInfo extends ConfigAnalysisResultBase {
    feature: 'LookupKey';   // use lookupKeyFeature const
    lookupKey: string;
    /**
     * When true, the lookup key is used as a DataType.
     */
    usedAsDataType: boolean;
    /**
     * Services in use associated with the lookup key like parser, formatter, etc.
     */
    services: Array<LookupKeyServiceInfoBase>;
}

export const dataTypeFeature = 'DataType';

export interface LookupKeyServiceInfoBase extends ConfigAnalysisResultBase
{
    feature: 'DataType' | ServiceName;  // use consts dataTypeFeature, parserServiceFeature, etc.
    
    /**
     * Tell caller to use the LookupKeyFallbackService to find a fallback lookup key.
     * This is true when there is no match for the lookup key.
     */
    tryFallback?: boolean;
}

/**
 * A class requested from the services/factories or 
 * error details when the class was not found.
 */
export interface ClassRetrievalBase extends ConfigResultMessageBase
{ 
    /**
     * The class Type found to handle the request, such as "BooleanParser", 
     * "IntegerFormatter", etc.
     */
    classFound?: string;
    /**
     * A live instance of the class found. Not sure if we want to use this
     * as the class may need to be setup with a specific configuration each time.
     */
    instance?: any;    

    /**
     * Examples of the data associated with the class, such as the formatter's
     * string output or the parser's string input.
     */
    dataExamples?: Array<string>;
}

/**
 * For Retrieval objects where the class may not be found.
 */
export interface ClassNotFound extends ConfigResultMessageBase { 
    /**
     * When true, the class was not found.
     */
    notFound?: boolean;
}
/**
 * For services that return a single class to handle the request.
 * It describes the class found or the error when not found.
 */
export interface OneClassRetrieval extends
    LookupKeyServiceInfoBase,
    ClassRetrievalBase,
    ClassNotFound{ 
} 

/**
 * For services that have child result classes, this is a base class
 * that offers classRetrieval and error messages.
 */
export interface ServiceChildResultBase extends ClassRetrievalBase, ConfigAnalysisResultBase,
    ConfigResultMessageBase {
}

export const identifierServiceFeature = ServiceName.identifier;

/**
 * The LookupKeyServiceInfoBase object for the DataTypeIdenfierService.
 */
export interface IdentifierServiceClassRetrieval extends OneClassRetrieval {
    feature: ServiceName.identifier;    // use identifierServiceFeature const
}

export const converterServiceFeature = ServiceName.converter;

/**
 * The LookupKeyServiceInfoBase object for the DataTypeConverterService.
 */
export interface ConverterServiceClassRetrieval extends OneClassRetrieval {
    feature: ServiceName.converter; // use converterServiceFeature const
}

export const comparerServiceFeature = ServiceName.comparer;

/**
 * The LookupKeyServiceInfoBase object for the DataTypeComparerService.
 */
export interface ComparerServiceClassRetrieval extends OneClassRetrieval {
    feature: ServiceName.comparer;  // use comparerServiceFeature const
}


/**
 * For services that return multiple classes to handle the request.
 * The list of requests is for each case attempted, such as each cultureId.
 * If the case has a result, it includes the class name. Otherwise it 
 * reports an error.
 */
export interface MultiClassRetrieval extends LookupKeyServiceInfoBase, ClassNotFound {
    requests: Array<ClassRetrievalBase>;
}
/**
 * For services that return a class to handle the request, but have to support cultures.
 * Allows for each culture to identify its own class, albeit the same class may be 
 * used by multiple cultures.
 */
export interface CultureSpecificClassRetrieval extends ServiceChildResultBase   {

    /**
     * When cultureId is used to find the service, this is the requested cultureId.
     * This is assigned even when there is an error.
     */
    requestedCultureId: string;
    /**
     * When cultureId is used to find the service, this is the actual cultureId found.
     * Unassigned when there was an error.
     */
    actualCultureId?: string;

}

export const parserServiceFeature = ServiceName.parser;

/**
 * The LookupKeyServiceInfoBase object for the DataTypeParserService.
 * It's requests array holds the results of the analysis for each cultureId,
 * using the ParserForCultureClassRetrieval object. Deeper down in 
 * ParserForCultureClassRetrieval.matches is the actual class retrieval.
 */
export interface ParserServiceByLookupKey extends MultiClassRetrieval {
    feature: ServiceName.parser; // use parserServiceFeature const
}


export const parserForCultureFeature = 'CultureSpecificParser';    // parsers for a specific culture
/**
 * Parsers may have multiple DataTypeParser objects for a single lookup key and cultureID.
 * This reflects the list for a single lookup key and cultureID.
 */
export interface ParserForCultureClassRetrieval extends
    ConfigAnalysisResultBase,
    ConfigResultMessage,
    ClassNotFound {
    feature : 'CultureSpecificParser'; // use parserForCultureFeature
    cultureId: string;
    matches: Array<ServiceChildResultBase>;
}

export const parserServiceClassRetrievalFeature = 'ParserClass';
/**
 * For the individual parser classes found for a single lookup key.
 * These are retained by ParserForCultureClassRetrieval.parsers.
 * Therefore they are not descendants of LookupKeyServiceInfoBase.
 * They are not used to report an error or "not found".
 * That's reserved for the ParserForCultureClassRetrieval object.
 */
export interface ParserServiceClassRetrieval
    extends ServiceChildResultBase {
    feature: 'ParserClass'; // use parserServiceClassRetrievalFeature const
}


export const formatterServiceFeature = ServiceName.formatter;

/**
 * The LookupKeyServiceInfoBase object for the DataTypeFormatterService.
 */
export interface FormatterServiceClassRetrieval extends MultiClassRetrieval {
    feature: ServiceName.formatter; // use formatterServiceFeature const
}

export const formatterForCultureFeature = 'FormatterForCulture';    // formatters for a specific culture

/**
 * Formatters may have multiple DataTypeFormatter objects for a single lookup key and cultureID.
 * These are retained by FormatterServiceClassRetrieval.requests.
 * They can hold a class retrieval, message/severity, or not found.
 */
export interface FormatterForCultureClassRetrieval
    extends CultureSpecificClassRetrieval, ClassNotFound {
    feature: 'FormatterForCulture'; // use formatterForCultureFeature const
}

/**
 * For interfaces that are the top level of results for a single config object.
 * It includes the results of the analysis of the properties of the config object.
 * It also includes the config object itself.
 * If there are valiability errors, they are reported in its own message and severity properties.
 * @typedef TConfig - The type of the configuration object:
 */
export interface ConfigResults<TConfig> extends ConfigAnalysisResultBase, ConfigResultMessageBase
{
    /**
     * errors or warnings found amongst the properties of the TConfig object
     * expect properties that hold Config objects themselves.
     */    
    properties: Array<ConfigPropertyResult|ConfigErrorResult>;
    /**
     * The configuration object analyzed.
     */
    config: TConfig;
}

export const propertyNameFeature = 'Property';
export const l10nPropertiesFeature = 'l10nProperties';

/**
 * Documents the results of the analysis of a specific property of
 * a Config object.
 * Most properties only report warnings and errors. Some, like 
 * localization, may report info messages describing the results of the analysis.
 */
export interface ConfigPropertyResult extends ConfigAnalysisResultBase, ConfigResultMessageBase {
    feature: 'Property' | 'l10nProperties'; // use propertyNameFeature, l10nPropertiesFeature
    /**
     * May be more than one property as several may be analyzed together.
     */
    propertyName: string; 
}
/**
 * For a pair of properties related to localization, such as "label" and "labell10n".
 */
export interface LocalizedPropertyResult extends ConfigPropertyResult {
    feature: 'l10nProperties';  // use l10nPropertiesFeature
    /**
     * The localization key passed to TextLocalizerService.
     */
    l10nKey: string;
    /**
     * The localization property name, such as "labell10n".
     */
    l10nPropertyName: string;
    /**
     * The results of localization for each culture including
     * the actual text found or an error message.
     */
    cultureText: { [cultureId: string]: LocalizedTextResult };
}
export interface LocalizedTextResult extends ConfigResultMessageBase
{
    /**
     * The result of the localization when successful.
     * If omitted, expect an error message.
     */
    text?: string;
}

export const errorFeature = 'Error';
/**
 * Use when an error is throw. It can identify its source and message.
 */
export interface ConfigErrorResult extends ConfigAnalysisResultBase, ConfigResultMessageBase {
    feature: 'Error';   // use errorFeature const
    severity: ConfigIssueSeverity.error;
    analyzerClassName: string;
}

export const valueHostFeature = 'ValueHost';

/**
 * Represents the analysis results for a ValueHostConfig object.
 */
export interface ValueHostConfigResults extends ConfigResults<ValueHostConfig> { 
    feature: 'ValueHost';   // use valueHostFeature const
    valueHostName: string;
    /**
     * If the valueHostType supports validatorConfigs, any 
     * ValidatorsValueHostConfig has will generate its own results
     * using the ValidatorConfigAnalyzer for each.
     */
    validators?: Array<ValidatorConfigResults>;
    /**
     * If the condition.enablerConfig is setup, this is its analysis.
     */
    enablerCondition?: ConditionConfigResults;
}

export const validatorFeature = 'Validator';
/**
 * Issues found around the validatorConfig, such as invalid error messages and problem
 * with the condition.
 */
export interface ValidatorConfigResults extends ConfigResults<ValidatorConfig> {
    feature: 'Validator';   // use validatorFeature const
    /**
     * The errorCode of the validator.
     */
    errorCode: string;

    /**
     * If the conditionConfig property is specified, it will be analyzed
     * and its results are here.
     */
    condition?: ConditionConfigResults;
}

export const conditionFeature = 'Condition';
/**
 * Issues found with the condition itself.
 */
export interface ConditionConfigResults extends ConfigResults<ConditionConfig>, ClassRetrievalBase {
    feature: 'Condition';   // use conditionFeature const
    conditionType: string;
}

/**
 * For ConditionWithChildrenBase and ConditionWithOneChildBase
 * to gather their child ConditionConfig results.
 */
export interface ConditionConfigWithChildrenResults extends ConditionConfigResults {
    children: Array<ConditionConfigResults>;
}

//#endregion description of results

//#endregion LookupKeyAnalyzer interfaces

/**
 * Provides helper methods that collect the results data.
 * It has specialized functions to handle lookup keys and localization.
 * The implementation is supplied to the IConfigAnalyzer and IConfigPropertyAnalyzer
 * instances, as they will utilitize its methods.
 */
export interface IAnalysisResultsHelper<TServices extends IValueHostsServices> {

    analysisArgs: AnalysisArgs<TServices>;

    services: TServices;

    results: IConfigAnalysisResults; 

    addlookupKeysIssue(feature: string, lookupKey: string, severity: ConfigIssueSeverity, message: string): void;

    /**
     * Add support for a specific service to analyze lookup keys.
     * @param serviceName 
     * @param analyzer 
     */
    registerLookupKeyAnalyzer(serviceName: ServiceName, analyzer: ILookupKeyAnalyzer): void;

    hasLookupKeyAnalyzer(serviceName: ServiceName): boolean;

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
    getSampleValue(lookupKey: string, valueHostConfig: ValueHostConfig): any;

    /**
     * Tries to add a lookup key and adds the associated service as a LookupKeyInfo object
     * into results.lookupKeysInfo.
     * Validates the lookup key string.
     * Uses LookupKeyAnalyzers to analyze service specific lookup keys against
     * their factories, services, and business rules.
     * 
     * @param lookupKey - The lookup key to add.
     * @param serviceName - The name of the service associated with the lookup key.
     * @param valueHostConfig - The configuration for the value host.
     * @returns The lookup key added to the LookupKeyInfo object.
     * This value may have been updated from the original lookupKey, if the original
     * needed trimming or a case sensitive match.
     * If there was no lookup key, returns null.
     */
    registerLookupKey(lookupKey: string | null | undefined, serviceName: ServiceName | null, valueHostConfig: ValueHostConfig | null): string | null;

/**
 * For any property that can hold a lookup key, check if the lookup key is valid.
 * It also uses registerLookupKey to add the lookup key to the LookupKeyInfo object if needed.
 * Cases:
 * - LookupKey is untrimmed empty string, null or undefined. Ignore. No results.
 * - LookupKey syntax is problematic like whitespace. Report an error and continue checking
 *   using the result from checkForRealLookupKeyName. Report the correct lookup key name
 *   if it was fixed.
 * - LookupKey is found in LookupKeyInfo. Continue checking.
 * - LookupKey is not found in LookupKeyInfo. Error. "Not found. Please add to [servicename]."
 * - With a service name, Error. "Not found. Please add to [servicename]."
 * 
 * All errors are added into the ConfigPropertyResult object that is added to the properties parameter.
 * 
 * @param propertyName - The name of the property being checked.
 * @param lookupKey - The lookup key to be checked.
 * @param serviceName - The service name to be checked. Use nullfor a dataType LookupKey.
 * @param properties - Add the ConfigPropertyResult object to this array.
 * @param containingValueHostConfig - The ValueHostConfig that contains the property being checked.
 * The property may be found on a child config object like ValidatorConfig or ConditionConfig.
 * @param className - The name of the class that is registered with the service to handle the lookup key,
 * such as "DataTypeFormatter" or "DataTypeConverter".
 * @param servicePropertyName - The name of the property in the service that the class is registered with.
 */
    checkLookupKeyProperty(propertyName: string, lookupKey: string | null | undefined,
        serviceName: ServiceName | null, containingValueHostConfig: ValueHostConfig,
        properties: Array<ConfigPropertyResult | ConfigErrorResult>,
        className?: string, servicePropertyName?: string): void;
    
    
    /**
     * We want to discover the actual lookup key name, even if it is a case insensitive match.
     * There are several places to look for a case insensitive match:
     * - LookupKey enum itself
     * - LookupKeyFallbackService
     * - IdentifierService
     * @param lookupKey - whitespace will be trimmed before testing
     * @param silent - If true, do not report issues. Default is false.
     * @returns The correct lookup key name, if found. Otherwise, the original lookup key.
     */
    checkForRealLookupKeyName(lookupKey: string, silent: boolean): string;
    /**
     * Using the two properties for localization, check if the localization property (l10n) 
     * is declared in the TextLocalizerService for all cultures. 
     * If so, show the localized text specific to each culture. 
     * If not, show a warning when the fallback text is used and an error when there is nothing to use.
     * @param propertyNamePrefix - The prefix of the property name. This is the property
     * that does not end in "l10n".
     * @param l10nKey - The value from the l10n property used in the TextLocalizerService to lookup the localized text.
     * @param fallbackText - The value from the property that does not end in "l10n".
     * @param properties - Adds a LocalizedPropertyIssue to this array so long as 
     * l10nKey is supplied.
     */
    checkLocalization(propertyNamePrefix: string, l10nKey: string | null | undefined,
        fallbackText: string | null | undefined,
        properties: Array<ConfigPropertyResult | ConfigErrorResult>): void;
    
    /**
     * Uses similar parser to MessageTokenResolverService to find tokens in the message.
     * However, it cannot use MessageTokenResolverService because it only works
     * with live instances of ValidatorValueHostBase and Validator.
     * Here we only look for syntax errors and validate the formatterKeys
     * in tokens like "text {token:formatterKey} more text".
     * 
     * @param properties if there are errors, they are added to this array.
     */
    checkMessageTokens(message: string | null | undefined | ((validator: IValidator) => string),
        vc: ValidatorConfig, vhc: ValueHostConfig,
        propertyName: string,
        properties: Array<ConfigPropertyResult | ConfigErrorResult>): void;

    /**
     * Check that the value in valueHostName is an exact match to one
     * in the results.valueHostNames array, or its an error.
     * No error if null, empty string, or undefined.
     * Report issues with not a string, case insensitive match and whitespace.
     * @param valueHostName 
     * @param propertyName 
     * @param properties 
     * @returns 
     */
    checkValueHostNameExists(valueHostName: any, propertyName: string, properties: Array<ConfigPropertyResult | ConfigErrorResult>): void;
    
    /**
     * Evaluates the value and adds any issues to the properties array
     * as a ConfigPropertyResult object.
     * Takes no action when undefined, null, or a trimmed empty string.
     * Call other helper functions to check for these conditions.
     * 
     * Otherwise, the value should be validated. It should either be
     * compatible with valueLookupKey or convertable using conversionLookupKey.
     * This is similar to ConditionBase.tryConversion.
     * 1. If valueLookupKey is null/undefined, try DataTypeIdentifiers 
     * against the value to get a valueLookupKey. If that does not work,
     * no further validation is possible and an info message is added.
     * If there is an identifier match, use its dataTypeLookupKey
     * for valueLookupKey.
     * 2. If conversionLookupKey is assigned, use it to find a DataTypeConverter
     * and try to convert the value. If it fails, add an error message.

     * @param value 
     * @param propertyName 
     * @param valueLookupKey - Provide ValueHostConfig.dataType
     * @param conversionLookupKey - provide conversionLookupKey, secondConversionLookupKey
     * @param properties 
     */
    checkValuePropertyContents(value: any, propertyName: string,
        valueLookupKey: string | null | undefined,
        conversionLookupKey: string | null | undefined,
        properties: Array<ConfigPropertyResult | ConfigErrorResult>): void;
    
    /**
     * Creates a prepared ConfigPropertyResult object with the given parameters.
     * @param propertyName 
     * @param severity 
     * @param errorMessage 
     */
    createConfigPropertyResult(propertyName: string, severity: ConfigIssueSeverity,
        errorMessage: string): ConfigPropertyResult;
    
    /**
     * Creates a prepared ConfigErrorResult object with the given parameters
     * and adds it to properties.
     * @param propertyName 
     * @param severity 
     * @param errorMessage 
     * @param properties 
     */
    addConfigPropertyResult(propertyName: string, severity: ConfigIssueSeverity,
        errorMessage: string, properties: Array<ConfigPropertyResult | ConfigErrorResult>): void;

    /**
     * Reports an error when the value is undefined.
     * Helper to use within PropertyAnalyzers. Call before using the value 
     * in a function that fails if value is undefined.
     * Will add a ConfigPropertyResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was undefined.
     */
    checkIsNotUndefined(value: any, propertyName: string,
        properties: Array<ConfigPropertyResult | ConfigErrorResult>,
        severity: ConfigIssueSeverity): boolean;

    /**
     * Reports an error when the value is null.
     * Helper to use within PropertyAnalyzers. Call before using the value 
     * in a function that fails if value is null.
     * Will add a ConfigPropertyResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was null.
     */
    checkIsNotNull(value: any, propertyName: string, properties: Array<ConfigPropertyResult | ConfigErrorResult>,
        severity: ConfigIssueSeverity): boolean;
    
    /**
     * Reports an error when the value is not a string.
     * Helper to use within PropertyAnalyzers. Call before using the value
     * in a function that fails if value is not a string.
     * Will add a ConfigPropertyResult object to the properties array
     * if an issue is found.
     * @param value
     * @param propertyName
     * @param properties
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was not a string.
     */
    checkIsString(value: any, propertyName: string, properties: Array<ConfigPropertyResult | ConfigErrorResult>,
        severity: ConfigIssueSeverity): boolean;
    
    /**
    * Reports an error when the value is an empty string, after trimming.
    * Helper to use within PropertyAnalyzers. Call before using the value
    * in a function that fails if value is an empty string.
    * Will add a ConfigPropertyResult object to the properties array
    * if an issue is found.
    * @param value
    * @param propertyName
    * @param properties
    * @param severity
    * @returns when true, continue execution. The value can be further analyzed.
    * When false, stop execution. The value was an empty string.
    */
    checkIsNotEmptyString(value: string, propertyName: string, properties: Array<ConfigPropertyResult | ConfigErrorResult>,
        severity: ConfigIssueSeverity): boolean;
    
    /**
     * Reports an error when the value is a string that has enclosing whitespace.
     * Helper to use within PropertyAnalyzers. Call before using the value
     * in a function that fails if value has enclosing whitespace.
     * Will add a ConfigPropertyResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity 
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was a string with enclosing whitespace.
     */
    checkNeedsTrimming(value: string, propertyName: string, properties: Array<ConfigPropertyResult | ConfigErrorResult>,
        severity: ConfigIssueSeverity): boolean;
    

}

// /**
//  * Supports functions on AnalysisResultsHelper that take a single property value
//  * and must determine if the value is valid or not. These rules
//  * involve whether the property can be null or undefined, or if it is required.
//  * The available rules are:
//  * 'required' - value must be assigned, not null or undefined
//  * 'notnullable' - value can be anything except null
//  * 'nullable' - value can be anything except undefined
//  * 'anything' - value can be anything including null and undefined
//  */
// export type BasicValueContentRules = 'required' | 'notnullable' | 'nullable' | 'anything';


/**
 * Represents the base interface for a configuration analyzer.
 *
 * @template TConfig - The type of the configuration object: 
 * ValueHostConfig, ValidatorConfig, ConditionConfig.
 * @template TResults - The type of the analysis results.
 */
export interface IConfigAnalyzer<TConfig, TResults extends ConfigResults<TConfig>,
    TServices extends IValueHostsServices> {
    /**
     * Analyzes the given configuration object and returns the analysis results.
     *
     * @param config - The configuration object to analyze.
     * @param valueHostConfig - The value host configuration.
     * @param existingResults The existing results to check for duplicates if needed.
     * @returns The analysis results. The caller should add this object 
     * into its own results array.
     */
    analyze(config: TConfig, valueHostConfig: ValueHostConfig | null, existingResults: Array<TResults>): TResults;
}

/**
 * Represents an interface for analyzing ValueHostConfig objects,
 * creating a ValueHostConfigResults object for each VHC.
 */
export interface IValueHostConfigAnalyzer<TServices extends IValueHostsServices>
    extends IConfigAnalyzer<ValueHostConfig, ValueHostConfigResults, TServices> {
}

/**
 * Represents an interface for analyzing ValidatorConfig objects,
 * creating a ValidatorConfigResults object for each VC.
 */
export interface IValidatorConfigAnalyzer
    extends IConfigAnalyzer<ValidatorConfig, ValidatorConfigResults, IValidationServices> {
}


/**
 * Analyzes a ConditionConfig object, creating a ConditionResults object.
 */
export interface IConditionConfigAnalyzer<TServices extends IValueHostsServices> extends
    IConfigAnalyzer<ConditionConfig, ConditionConfigResults, TServices> {
}

/**
 * Create instances for each property or group of properties in a TConfig object.
 * Register those instances when setting up the ConfigAnalysisService.
 * 
 * The task is to update TResults.properties array with the results of the analysis if needed.
 * Create a ConditionPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 */
export interface IConfigPropertyAnalyzer<TConfig, TResults extends ConfigResults<TConfig>> {
    /**
     * Analyzes the properties of the given configuration object and returns the analysis results.
     * If there are any issues, add them to results.properties.
     * Optionally if you have an info level message. But don't add if the data is in good shape
     * and the user doesn't need additional instructions.
     * @param config - The configuration object where to find the properties to analyze.
     * @param results - Add the results of the analysis to results.properties.
     * @param valueHostConfig - The value host configuration.
     */
    analyze(config: TConfig, results: TResults, valueHostConfig: ValueHostConfig | null,
        helper: IAnalysisResultsHelper<any>): void;

}

/**
 * Instances created for each property or group of properties in a ValueHostConfig object
 * or subclass. They are registered with ConfigAnalysisService.registerValueHostConfigPropertyAnalyzer()
 * from where you create the service itself.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ValueHostPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 * 
 * Expected Result class to add to results.properties: ValueHostPropertyResult
 * or LocalizedPropertyResult.
 */
export interface IValueHostConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ValueHostConfig, ValueHostConfigResults> {

}

/**
 * Instances created for each property or group of properties in a ValidatorConfig object
 * or subclass. They are registered with ConfigAnalysisService.registerValidatorConfigPropertyAnalyzer()
 * from where you create the service itself.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ValidatorPropertyResults object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 * 
 * Expected Result class to add to results.properties: ValidatorPropertyResults
 * or LocalizedPropertyResult.
 */
export interface IValidatorConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ValidatorConfig, ValidatorConfigResults> {

}

/**
 * Instances created for each property or group of properties in a ConditionConfig object
 * or subclass. They are registered with ConfigAnalysisService.registerConditionConfigPropertyAnalyzer()
 * from where you create the service itself.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ConditionPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 * 
 * Expected Result class to add to results.properties: ConditionPropertyResult
 * or LocalizedPropertyResult.
 */
export interface IConditionConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ConditionConfig, ConditionConfigResults> {

}