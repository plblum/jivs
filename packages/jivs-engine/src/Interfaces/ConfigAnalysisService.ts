/**
 * Interface for the configuration analysis service
 * @module Services/Types/ConfigAnalysisService
 */

import { ManagerConfigBuilderBase } from "../ValueHosts/ManagerConfigBuilderBase";
import { ConditionConfig } from "./Conditions";
import { ILoggerService } from "./LoggerService";
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
    analyze(config: ValueHostsManagerConfig, options?: ConfigAnalysisServiceOptions): IConfigAnalysisOutput;
    /**
     * Analyze the configuration found in the Builder or Modifier object
     * @param builder 
     * @param options 
     */
    analyze(builder: ManagerConfigBuilderBase<any>, options?: ConfigAnalysisServiceOptions): IConfigAnalysisOutput;    

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
    vhConfigs: Array<ValueHostConfig>;
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

    /**
     * Any other issues found.
     */
    otherIssues: Array<ConfigResultMessage>;
}

/**
 * The output of the configuration analysis.
 */
export interface IConfigAnalysisOutput {
    results: IConfigAnalysisResults;
    /**
     * Send to the console.
     */
    toConsole(): void;
    /**
     * Send to a LoggerService object. 
     * @param logger - When null, use the logger already in the service.
     */
    toLogger(logger?: ILoggerService): void;
}

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
     * Implementation should expect to catch errors and write them to results.lookupKeysIssues
     * or results.otherIssues.
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
 * ConfigAnalysisResults.otherIssues and ConfigAnalysisResults.lookupKeysIssues.
 */
export interface ConfigResultMessage extends ConfigResultMessageBase, ConfigAnalysisResultBase
{

}

export interface LookupKeyIssue extends ConfigResultMessageBase, ConfigAnalysisResultBase {
    lookupKey: string;
}

/**
 * Each Lookup Key found gets one of these objects in the results.
 * It encapsulates all the services that use the lookup key.
 * Invalid lookup keys are reported in ConfigAnalysisResults.lookupKeysIssues
 * and with the PropertyInfo object specifically supplying the invalid key.
 */
export interface LookupKeyInfo extends ConfigAnalysisResultBase {
    feature: 'LookupKey';
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

export interface LookupKeyServiceInfoBase extends ConfigAnalysisResultBase
{
    feature: 'DataType' | ServiceName;
    
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
export interface CultureSpecificClassRetrieval extends OneClassRetrieval   {

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

/**
 * Parsers may have multiple DataTypeParser objects for a single lookup key and cultureID.
 * This reflects the list for a single lookup key and cultureID.
 */
export interface ParserClassRetrieval extends
    ConfigAnalysisResultBase,
    ConfigResultMessage,
    ClassNotFound{
    cultureId: string;
    matches: Array<OneClassRetrieval>;
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

/**
 * Documents the results of the analysis of a specific property of
 * a Config object.
 * Most properties only report warnings and errors. Some, like 
 * localization, may report info messages describing the results of the analysis.
 */
export interface ConfigPropertyResult extends ConfigAnalysisResultBase, ConfigResultMessageBase {
    feature: 'Property' | 'l10nProperties';
    /**
     * May be more than one property as several may be analyzed together.
     */
    propertyName: string; 
}
/**
 * For a pair of properties related to localization, such as "label" and "labell10n".
 */
export interface LocalizedPropertyResult extends ConfigPropertyResult {
    feature: 'l10nProperties';
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
/**
 * Use when an error is throw. It can identify its source and message.
 */
export interface ConfigErrorResult extends ConfigAnalysisResultBase, ConfigResultMessageBase {
    feature: 'Error';
    severity: ConfigIssueSeverity.error;
    analyzerClassName: string;
}

/**
 * Represents the analysis results for a ValueHostConfig object.
 */
export interface ValueHostConfigResults extends ConfigResults<ValueHostConfig> { 
    feature: 'ValueHost';
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

/**
 * Issues found around the validatorConfig, such as invalid error messages and problem
 * with the condition.
 */
export interface ValidatorConfigResults extends ConfigResults<ValidatorConfig> {
    feature: 'Validator';
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

/**
 * Issues found with the condition itself.
 */
export interface ConditionConfigResults extends ConfigResults<ConditionConfig>, ClassRetrievalBase {
    feature: 'Condition';
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

    addOtherIssue(feature: string, severity: ConfigIssueSeverity, message: string): void;

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