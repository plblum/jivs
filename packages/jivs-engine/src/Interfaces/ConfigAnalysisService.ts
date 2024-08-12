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
     * It sets up LookupKeyCAResult.services for the ServiceName.comparer.
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
    lookupKeyResults: Array<LookupKeyCAResult>;

    /**
     * A list of all issues found in the ValueHostConfig objects, such as missing properties,
     * and their ValidatorConfigs and ConditionConfigs.
     */
    valueHostResults: Array<ValueHostConfigCAResult>;
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
     * Returns true if it finds one ConfigResults object that matches the criteria.
     * This is effectively the same idea as countConfigResults(criteria) but doesn't
     * waste time counting them all.
     * @param criteria 
     */
    hasMatchInConfigResults(criteria: IConfigAnalysisSearchCriteria): boolean;

    /**
     * Returns true if it finds one LookupKeyCAResult object that matches the criteria.
     * This is effectively the same idea as countLookupKeyResults(criteria) but doesn't
     * waste time counting them all.
     * @param criteria 
     */
    hasMatchInLookupKeyResults(criteria: IConfigAnalysisSearchCriteria): boolean;

    /**
     * Return a count of the number of ConfigResult objects found in the ValueHostResults array
     * matching the criteria.
     * @param criteria When null, return all results.
     */
    countConfigResults(criteria: IConfigAnalysisSearchCriteria | null): number;

    /**
     * Return a count of the number of LookupKeyCAResult objects and all children
     * found in the lookupKeyResults array matching the criteria.
     * @param criteria 
     */
    countLookupKeyResults(criteria: IConfigAnalysisSearchCriteria | null): number;

    /**
     * Return a list of all ConfigResult objects found in the ValueHostResults array,
     * wrapped in a CAPathedResult object.
     * Only includes the children if this object matches the criteria.
     * @param criteria 
     */
    queryValueHostResults(criteria: IConfigAnalysisSearchCriteria | null): Array<CAPathedResult<any>>;

    /**
     * Return a list of all LookupKeyCAResult objects found in the lookupKeyResults array,
     * wrapped in a CAPathedResult object.
     * Only includes the children if this object matches the criteria.
     */
    queryLookupKeyResults(criteria: IConfigAnalysisSearchCriteria | null): Array<CAPathedResult<any>>;

    /**
     * With the results of a collect function, return a specific ConfigResult object
     * which is the first one found that matches the supplied path.
     * @remarks
     * This function was designed for testing purposes.
     * It lets your testing code review the results of the collect functions.
     * @param path 
     * The CAResultPath object, where the key is the feature and the value is the identifier,
     * although the feature may have a number appended to it if there are multiple children with the same feature:
     * "Condition", "Condition2", "Condition3", etc.
     * @param foundResults 
     * @returns The first ConfigResult object that matches the path, or null if no match is found.
     */
    getByResultPath(path: CAResultPath, foundResults: Array<CAPathedResult<any>>): CAResultBase | null;

    /**
     * Returns true if any ConfigResult objects with severity of 'error' are found
     * in either the ValueHostResults array or the LookupKeyResults array.
     */
    hasErrors(): boolean;

    /**
     * Throws an error if any ConfigResult objects with severity of 'error' are found.
     * The error class is CodingError. Its message will be JSON from the results found.
     * If the ouputter is supplied, it will be used to send the results to the outputter
     * in addition to creating the Error.
     * @param includeAnalysisResults - When true, include the complete Explorer.results in the error message.
     * @param outputter - The outputter to send the results to.
     */
    throwOnErrors(includeAnalysisResults?: boolean, outputter?: IConfigAnalysisOutputter): void;

    /**
     * Generates a JSON string from the query results built by
     * applying the valueHostCriteria against valueHostResults and 
     * lookupKeyCriteria against lookupKeyResults arrays.
     * Expected output in JSON has this overall shape:
     * ```ts
     * {
     *    "valueHostResults": [ ... ],
     *    "lookupKeyResults": [ ... ]
     * }
     * ```
     * Each element in those arrays is a CAPathedResult object which has this overall shape:
     * ```ts
     * {
     *    "path": { [key: string]: value | null },
     *    "result": { ... } // the actual ConfigCAResult object, such as ValueHostConfigCAResult, LookupKeyCAResult, etc.
     * }
     * ```
     * @param valueHostCriteria - The criteria to match against the ValueHostResults array. Effectively the same as 
     * calling queryValueHostResults(valueHostCriteria).
     * If you want to omit this, pass in false or null.
     * If you want all results, pass in true or {}.
     * @param lookupKeyCriteria - The criteria to match against the LookupKeyResults array. Effectively the same as
     * calling queryLookupKeyResults(lookupKeyCriteria).
     * If you want to omit this, pass in false or null.
     * If you want all results, pass in true or {}.
     * @param includeCompleteResults - When true, include the explorer.results object.
     * @param space - The number of spaces to use for indentation in the JSON string or null to omit whitespace formatting.
     * Used by JSON.stringify() as the third parameter.
     * @example
     * ```ts
     * let json = explorer.reportIntoJson({ features: [CAFeatures.valueHost] }, { features: [CAFeatures.lookupKey] });
     * or
     * let json = explorer.reportIntoJson(true, true);
     * or
     * let json = explorer.reportIntoJson(false, { serviceNames: [CAFeatures.parser, CAFeatures.converter] });
     * ```
     */
    reportIntoJson(valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null, lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        includeCompleteResults: boolean,
        space?: string | number | null): string;

    /**
     * Generates a console output from the query results built by applying the valueHostCriteria against valueHostResults and
     * lookupKeyCriteria against lookupKeyResults arrays.
     * The console will receive the object format, not a string, so you can use the DevTools to drill down into the object.
     * Expected output in JSON has this overall shape:
     * ```ts
     * {
     *    valueHostResults: [ ... ],
     *    lookupKeyResults: [ ... ]
     * }
     * ```
     * Each element in those arrays is a CAPathedResult object which has this overall shape:
     * ```ts
     * {
     *    path: { [key: string]: value | null },
     *    result: { ... } // the actual ConfigCAResult object, such as ValueHostConfigCAResult, LookupKeyCAResult, etc.
     * }
     * ```
     * @param valueHostCriteria - The criteria to match against the ValueHostResults array. Effectively the same as 
     * calling queryValueHostResults(valueHostCriteria).
     * If you want to omit this, pass in false or null.
     * If you want all results, pass in true or {}.
     * @param lookupKeyCriteria - The criteria to match against the LookupKeyResults array. Effectively the same as
     * calling queryLookupKeyResults(lookupKeyCriteria).
     * If you want to omit this, pass in false or null.
     * If you want all results, pass in true or {}.
     * @param includeCompleteResults - When true, include the explorer.results object.
     * @param space - When a number or string, it is passed to JSON.stringify() as the third parameter for indentation.
     * When null or undefined, it is sent to console in object form, allowing the browser to provide a drill down UI.
     * @example
     * ```ts
     * explorer.reportToConsole({ features: [CAFeatures.valueHost] }, { features: [CAFeatures.lookupKey] });
     * // expect a single console log output 
     * or
     * explorer.reportToConsole(true, true);
     * or
     * explorer.reportToConsole(false, { serviceNames: [CAFeatures.parser, CAFeatures.converter] });
     * ```
     */
    reportToConsole(valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null, lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        includeCompleteResults: boolean,
        space?: string | number | null): void;

    // NOTE: Wanted to include LocalStorage as a destination
    // but it is not available in node.js environment, where tests generally run.
    
    /**
     * Generates a report from the analysis results, using the criteria to filter the results into
     * two lists of CAPathedResult objects, one for ValueHostResults and one for LookupKeyResults.
     * It uses both to format and output the report.
     * Returns the formatted results of that report, which may actually be objects or strings
     * depending on the IConfigAnalysisOutputFormatter supplied to the outputter.
     * @param valueHostCriteria - The criteria to match against the ValueHostResults array. Effectively the same as 
     * calling queryValueHostResults(valueHostCriteria).
     * If you want to omit this, pass in false or null.
     * If you want all results, pass in true or {}.
     * @param lookupKeyCriteria - The criteria to match against the LookupKeyResults array. Effectively the same as
     * calling queryLookupKeyResults(lookupKeyCriteria).
     * If you want to omit this, pass in false or null.
     * If you want all results, pass in true or {}.
     * @param includeCompleteResults - When true, include the explorer.results object.
     * @param outputter - The outputter to use to format and output the report. 
     * For JSON, use JsonConfigAnalysisOutputter or call reportIntoJson() instead.
     * For console output, use ConsoleConfigAnalysisOutputter or call reportToConsole() instead.
     * For ILoggerService, use LoggerServiceConfigAnalysisOutputter.
     * @returns The formatted results of the report.
     */
    report(valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null, lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        includeCompleteResults: boolean,
        outputter: IConfigAnalysisOutputter): any;
    
}

/**
 * For Explorer's count and collect methods, this is the criteria to match against.
 * To match, all assigned criteria must match SO LONG AS
 * it is applicable to the object being evaluated.
 * For example, when the feature is 'LookupKey', the lookupKeys criteria is used.
 */
export interface IConfigAnalysisSearchCriteria {
    /**
     * When true, a parent object must match the criteria in order to evaluate its children.
     * When false or undefined, the children are evaluated regardless of the parent.
     */
    skipChildrenIfParentMismatch?: boolean;
    /**
     * Match to any feature listed or all features if undefined.
     * Case insensitive match.
     */
    features?: Array<string>;

    /**
     * Match to any severity listed or all severities if undefined.
     * Use null for no severity assigned, which means there is no issue on the record.
     */
    severities?: Array<CAIssueSeverity | null>;

//#region identities for specific ConfigAnalysisResult objects based on their feature property.    
    /**
     * Match to any lookupKey listed or all lookupKeys if undefined.
     * Only applies to LookupKeyCAResult objects.
     * Case insensitive match.
     */
    lookupKeys?: Array<string>;
    /**
     * Match to any serviceName listed or all serviceNames if undefined.
     * Only applies to ServiceWithLookupKeyCAResultBase objects
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
     * Only applies to ValidatorConfigCAResult objects.
     * Case insensitive match.
     */
    errorCodes?: Array<string>;

    /**
     * Match to any conditionType listed or all conditionTypes if undefined.
     * Only applies to ConditionConfigCAResult objects.
     * Case insensitive match.
     */
    conditionTypes?: Array<string>;

    /**
     * Match to any propertyName listed or all propertyNames if undefined.
     * Only applies to PropertyCAResult objects.
     * Case insensitive match.
     */
    propertyNames?: Array<string>;

    /**
     * Match to any cultureId listed or all cultures if undefined.
     * Only applies to CAResult objects that use a culture ID as its identity string.
     * Case insensitive match.
     */
    cultureIds?: Array<string>;
//#endregion identities for specific ConfigAnalysisResult objects based on their feature property.    
}

/**
 * Represents a searcher for configuration analysis criteria.
 */
export interface ICASearcher {
    /**
     * When true, a parent object must match the criteria in order to evaluate its children.
     * When false or undefined, the children are evaluated regardless of the parent.
     */
    skipChildrenIfParentMismatch?: boolean;
    
    /**
     * When true, there are no criteria setup. All results are considered a match.
     */
    allMatch: boolean;
    /**
     * Determines if the given feature matches the search criteria.
     * @param feature The feature to match.
     * @returns True if the feature matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchFeature(feature: string | null | undefined): boolean | undefined;

    /**
     * Determines if the given severity matches the search criteria.
     * @param severity The severity to match. When supplied with null,
     * it means that the severity property is undefined in the Result.
     * @returns True if the severity matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchSeverity(severity: CAIssueSeverity | null | undefined): boolean | undefined;

    /**
     * Determines if the given lookup key matches the search criteria.
     * @param lookupKey The lookup key to match.
     * @returns True if the lookup key matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchLookupKey(lookupKey: string | null | undefined): boolean | undefined;

    /**
     * Determines if the given service name matches the search criteria.
     * @param serviceName The service name to match.
     * @returns True if the service name matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchServiceName(serviceName: string | null | undefined): boolean | undefined;

    /**
     * Determines if the given value host name matches the search criteria.
     * @param valueHostName The value host name to match.
     * @returns True if the value host name matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchValueHostName(valueHostName: string | null | undefined): boolean | undefined;

    /**
     * Determines if the given error code matches the search criteria.
     * @param errorCode The error code to match.
     * @returns True if the error code matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchErrorCode(errorCode: string | null | undefined): boolean | undefined;

    /**
     * Determines if the given condition type matches the search criteria.
     * @param conditionType The condition type to match.
     * @returns True if the condition type matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchConditionType(conditionType: string | null | undefined): boolean | undefined;

    /**
     * Determines if the given property name matches the search criteria.
     * @param propertyName The property name to match.
     * @returns True if the property name matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchPropertyName(propertyName: string | null | undefined): boolean | undefined;

    /**
     * Determines if the given culture ID matches the search criteria.
     * @param cultureId The culture ID to match.
     * @returns True if the culture ID matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchCultureId(cultureId: string | null | undefined): boolean | undefined;
}


/**
 * Represents a result of evaluating a single ConfigAnalysisResult object.
 * It basically holds the ConfigAnalysisResult and the path to it.
 * The idea is to flatten the results which are a tree into a single array.
 */
export interface CAPathedResult<T extends CAResultBase> {
    /**
     * Each CAResultExplorer supplies its feature() and identifer() values
     * to create one entry here. The object key is the feature and the value is the identifier.
     * However, it is possible to have duplicate feature entries, especially
     * when conditions have their own child conditions. In that case, the feature
     * is repeated with a number appended to it after the first. For example, "Condition2", "Condition3".
     */
    path: CAResultPath;
    result: T;
}

export type CAResultPath = {[feature: string]: string | null};

/**
 * Classes that convert the results of the configuration analysis into a specific format
 * and output them. Suggested implementations:
 * - To console as the object itself
 * - To console as a JSON string
 * - To the ILoggerService as a JSON string
 * These can build a well formatted string, such as a full HTML page to appear as a report.
 */
export interface IConfigAnalysisOutputter {
    /**
     * Entry point for the outputter. It builds the output from the results
     * and sends it to the appropriate destination.
     * It has available all the results of the configuration analysis.
     * @param report - The results of the configuration analysis.
     * The outputter should determine which of its properties to output
     * based on their presence.
     * @returns The built output. The caller will return it.
     */
    send(report: ConfigAnalysisOutputReportData): any;
}

/**
 * Consumed by the implementation of IConfigAnalysisOutputter, ConfigAnalysisOutputterBase,
 * to format the output of the configuration analysis.
 * Allows a dependency injection approach to the output format.
 */
export interface IConfigAnalysisOutputFormatter {
    /**
     * 
     * @param report - The results of the configuration analysis.
     * The formatter should determine which of its properties to output
     * based on their presence.
     */
    format(report: ConfigAnalysisOutputReportData): any;
}

/**
 * Packages the various results that will be output by the ConfigAnalysisOutputter.
 */
export interface ConfigAnalysisOutputReportData
{
    /**
     * If supplied, the outputter will include the results of the ValueHostConfig analysis
     * structured as CAPathedResult objects so that you can see a list instead of a tree.
     * This data has already been filtered by the criteria supplied to the outputter.
     * It came from completeResults.valueHostResults which has the data in a tree format.
     */
    valueHostQueryResults?: Array<CAPathedResult<any>>;
    /**
     * If supplied, the outputter will include the results of the LookupKey analysis
     * structured as CAPathedResult objects so that you can see a list instead of a tree.
     * This data has already been filtered by the criteria supplied to the outputter.
     * It came from completeResults.lookupKeyResults which has the data in a tree format.
     */
    lookupKeyQueryResults?: Array<CAPathedResult<any>>;
    /**
     * If supplied, the results of the configuration analysis.
     */
    completeResults?: IConfigAnalysisResults;
}

/**
 * For building an object that can handle a specific type of configuration object based 
 * on the feature property. These classes are registered with the ConfigAnalysisResultsExplorer
 * and are created in a factory approach based on the config result object.
 */
export interface ICAExplorerBase<T extends CAResultBase> {
    /**
     * Gets the result of the configuration analysis, which is an object structure
     * with data from Configuration objects in valueHostResults,
     * and data from Lookup Keys and their associated services in lookupKeyResults.
     * @returns The result of the configuration analysis.
     */
    result: T;

    /**
     * A fixed value representing the only feature string that is supported by this class.
     * Each CAResultBase object has a feature property that is matched to this one.
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

     * @param searcher - A search tool with the criteria to match against.
     * @returns True if the result matches the all applicable criteria, 
     * false if it does not match at least one of the applicible criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    matchThis(searcher: ICASearcher): boolean | undefined;

    /**
     * Returns true if it finds one ConfigResults object that matches the criteria
     * amongst itself and all of its children.
     * It differs from collect() in that it evaluates all children,
     * and stops upon finding the first match.
     */
    hasMatch(searcher: ICASearcher, factory: ICAExplorerFactory): boolean;

    /**
     * Returns the first ConfigResults object that matches the criteria
     * amongst itself and all of its children.
     * @param searcher 
     * @param factory 
     * @path Collects feature/identifier pairs to form the path to this object.
     * 
     * @returns The first ConfigResults object that matches the criteria,
     * or null if no match is found.
     */
    findOne(searcher: ICASearcher, factory: ICAExplorerFactory,
        path?: CAResultPath): CAPathedResult<CAResultBase> | null;

    /**
     * Using match on itself and its children, collect all results that match the criteria
     * into the matches array.
     * @param searcher - A search tool with the criteria to match against.
     * @param matches - Where to add any generated CAPathedResult objects.
     * @param path The feature + identifier from each parent object to this object. When this calls a child,
     * it creates a new object from this plus its own feature + identifier.
     * @param factory The factory to create entries going into matches.
     */
    collect(searcher: ICASearcher, matches: Array<CAPathedResult<T>>,
        path: CAResultPath, factory: ICAExplorerFactory): void;
    
    /**
     * Return a list of all children of the result that match the criteria
     * or [] if no children are available.
     */
    children(): Array<CAResultBase>;

}

/**
 * Factory to create the appropriate ConfigResultsExplorer object for the ConfigResults object based on the feature.
 */
export interface ICAExplorerFactory {
    /**
     * Create the appropriate ConfigResultsExplorer object for the ConfigResults object based on the feature.
     * It is a factory method that creates the object from the functions registered with 
     * registerConfigResultsExplorer().
     * @param configResult 
     * @returns A new ConfigResultsExplorer object assigned to the configResult object.
     */
    create(configResult: CAResultBase): ICAExplorerBase<CAResultBase>;

    /**
     * Register a new ConfigResultsExplorer with this object.
     * @param feature - The feature that will be used to identify the object by the factory.
     * @param explorerCreator - Once identified, this function will create the object. It is passed the ConfigResults object
     * which is expected to be assigned to the result property of the object.
     */
    register<T extends CAResultBase>(feature: string, explorerCreator: ExplorerCreatorHandler<T>): void;

}

export type ExplorerCreatorHandler<T extends CAResultBase> = (configResult: T) => ICAExplorerBase<T>;


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
}

/**
 * Supplies a sample value for any lookup key supplied,
 * so long as it can be identified as a DataType with a value.
 * For example, make the "Integer" lookup key return "100" as a sample value.
 * This class works together with properties found in ConfigAnalysisServiceOptions.
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
     * Implementation should expect to catch errors and write them to the appropriate
     * result object's severity and message properties.
     * @param key 
     * @param valueHostConfig
     * @returns A new LookupKeyServiceInfo object with the results of the analysis.
     * Add it to the LookupKeyCAResult.services array.
     */
    analyze(key: string, valueHostConfig: ValueHostConfig | null): ServiceWithLookupKeyCAResultBase;
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
     * sample values to try to find a comparer. Whatever teh results, they'll be added to the lookupKeyResults.services
     * as a ServiceName.comparer. Future calls with the same lookup key will not need to re-analyze.
     * 
     * When there is an issue, its typically a warning or info, not an error. 'error' is reserved for 
     * telling the user that something must be fixed. With comparers, that's rare.
     * 
     * @param conditionConfig 
     * @returns When null, no reason to evaluate for the comparer. Otherwise, the same
     * OneClassRetrieval object that was added to the lookupKeyResults.services array.
     */
    checkConditionConfig(conditionConfig: ConditionConfig, valueHostConfig: ValueHostConfig): OneClassRetrieval | null;
}

//#region description of results

export enum CAFeature{
    valueHost = 'ValueHost',
    validator = 'Validator',
    condition = 'Condition',
    lookupKey = 'LookupKey',
    identifier = ServiceName.identifier,
    converter = ServiceName.converter,
    comparer = ServiceName.comparer,
    parser = ServiceName.parser,
    parsersByCulture = 'ParsersByCulture',
    parserFound = 'ParserFound',
    formatter = ServiceName.formatter,
    formattersByCulture = 'FormattersByCulture',
    property = 'Property',
    l10nProperty = 'l10nProperty',
    error = 'Error',
}

/**
 * Represents the base structure for a configuration analysis result.
 */
export interface CAResultBase {
    feature: string;
}



/**
 * To extend CAResultBase to support an issue.
 * Issues include a message and severity (CAIssueSeverity).
 * Its severity determines how to handle the message.
 * Intended to be added to other interfaces, not used on its own.
 */
export interface IssueForCAResultBase {
    severity?: CAIssueSeverity;
    message?: string;    
}

/**
 * Represents the severity level of a configuration issue that implements IssueForCAResultBase.
 */
export enum CAIssueSeverity {
    info = 'info',
    warning = 'warning',
    error = 'error'
}
/**
 * For interfaces that are the top level of results for a single config object.
 * It includes the results of the analysis of the properties of the config object.
 * It also includes the config object itself.
 * If there are valiability errors, they are reported in its own message and severity properties.
 * @typedef TConfig - The type of the configuration object:
 */
export interface ConfigObjectCAResultsBase<TConfig> extends CAResultBase, IssueForCAResultBase
{
    /**
     * errors or warnings found amongst the properties of the TConfig object
     * expect properties that hold Config objects themselves.
     */    
    properties: Array<PropertyCAResult|ErrorCAResult>;
    /**
     * The configuration object analyzed.
     */
    config: TConfig;
}

/**
 * Represents the analysis results for a ValueHostConfig object.
 * If it has validators, their results are in the validatorResults array.
 * If it has an enablerCondition, its results are in the enablerConditionResult.
 */
export interface ValueHostConfigCAResult extends ConfigObjectCAResultsBase<ValueHostConfig> { 
    feature: CAFeature.valueHost;
    /**
     * From valueHostConfig.name.
     * If config.name is unassigned, empty string or whitespace, expect a string like "[Missing]"
     */
    valueHostName: string;
    /**
     * If the valueHostType supports validatorConfigs, any 
     * ValidatorsValueHostConfig has will generate its own results
     * using the ValidatorConfigAnalyzer for each.
     */
    validatorResults?: Array<ValidatorConfigCAResult>;
    /**
     * If the condition.enablerConfig is setup, this is its analysis.
     */
    enablerConditionResult?: ConditionConfigCAResult;
}

/**
 * Issues found around the validatorConfig, such as invalid error messages and problem
 * with the condition.
 */
export interface ValidatorConfigCAResult extends ConfigObjectCAResultsBase<ValidatorConfig> {
    feature: CAFeature.validator;
    /**
     * The errorCode of the validator, which is from either ValidatorConfig.errorCode
     * or ValidatorConfig.conditionConfig.conditionType.
     * If the errorCode could not be resolved, expect a string like "[Missing]".
     */
    errorCode: string;

    /**
     * If the conditionConfig property is specified, it will be analyzed
     * and its results are here.
     */
    conditionResult?: ConditionConfigCAResult;
}

/**
 * Issues found with the condition itself.
 */
export interface ConditionConfigCAResult extends ConfigObjectCAResultsBase<ConditionConfig>, ClassRetrieval {
    feature: CAFeature.condition;
    /**
     * From conditionConfig.conditionType. If unassigned, empty string or whitespace, expect a string like "[Missing]".
     */
    conditionType: string;

    /**
     * For ConditionWithChildrenBase and ConditionWithOneChildBase
     * to gather their child ConditionConfig results.
     */
    childrenResults?: Array<ConditionConfigCAResult>;
}

/**
 * Each Lookup Key found gets one of these objects in the results.
 * It encapsulates all the services that use the lookup key.
 * Invalid lookup keys are reported here with severity of 'error' and 
 * an appropriate message.
 */
export interface LookupKeyCAResult extends CAResultBase, IssueForCAResultBase {
    feature: CAFeature.lookupKey
    lookupKey: string;
    /**
     * When true, the lookup key is used as a DataType.
     */
    usedAsDataType: boolean;
    /**
     * Services in use associated with the lookup key like parser, formatter, etc.
     */
    serviceResults: Array<ServiceWithLookupKeyCAResultBase>;
}

/**
 * For all services that use a lookup key, this is the base class for the LookupKeyCAResult.services array.
 * Features are 'DataType' or any ServiceName that supports a lookup key.
 * 'DataType' is used when the lookup key is just a data type (ValueHostConfig.dataType property).
 */
export interface ServiceWithLookupKeyCAResultBase extends CAResultBase
{
    /**
     * Tell caller to use the LookupKeyFallbackService to find a fallback lookup key.
     * This is true when there is no match for the lookup key.
     */
    tryFallback?: boolean;
}

/**
 * For services that retrieve a class, so they can report that class and any issues.
 */
export interface ClassRetrieval // extends IssueForCAResultBase
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
 * For CAResultBase objects where the class may not be found.
 * Use this to extend CAResult interfaces that may fail to find a class.
 */
export interface ClassNotFound extends IssueForCAResultBase { 
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
    ServiceWithLookupKeyCAResultBase,
    ClassRetrieval,
    ClassNotFound { 
} 

/**
 * For services that have child result classes, this is a base class
 * that offers ClassRetrieval and IssueForCAResultBase for building those child result classes.
 */
export interface ServiceChildResultBase extends
    ClassRetrieval,
    CAResultBase,
    IssueForCAResultBase {
}

/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeIdenfierService.
 */
export interface IdentifierServiceCAResult extends OneClassRetrieval {
    feature: CAFeature.identifier;
}


/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeConverterService.
 */
export interface ConverterServiceCAResult extends OneClassRetrieval {
    feature: CAFeature.converter;
}


/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeComparerService.
 */
export interface ComparerServiceCAResult extends OneClassRetrieval {
    feature: CAFeature.comparer; 
}


/**
 * For services that may return multiple classes to handle the request.
 * Parser and Formatter both do, where each culture may have its own Parser or Formatter class.
 * This class does not implement ClassRetrieval. A deeper class does that.
 * This class can handle issues and the "not found" state.
 */
export interface MultiClassRetrieval extends ServiceWithLookupKeyCAResultBase, ClassNotFound {
    results: Array<CAResultBase>;
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

/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeParserService.
 * It's results array holds the results of the analysis for each cultureId,
 * using the ParsersByCultureCAResult object. Deeper down in 
 * ParsersByCultureCAResult.parserResults is the actual class retrieval.
 */
export interface ParserServiceCAResult extends MultiClassRetrieval {
    feature: CAFeature.parser;

    results: Array<ParsersByCultureCAResult>;
}

/**
 * Parsers may have multiple DataTypeParser objects for a single lookup key and cultureId.
 * This reflects the list for a single lookup key and cultureId.
 * It is retained by ParserServiceCAResult.results.
 * It holds a list of found parsers in its parserResults array.
 */
export interface ParsersByCultureCAResult extends
    CAResultBase,
    IssueForCAResultBase,
    ClassNotFound {
    feature: CAFeature.parsersByCulture;
    cultureId: string;
    parserResults: Array<ParserFoundCAResult>;
}

/**
 * For the individual parser classes found for a single lookup key.
 * These are retained by ParsersByCultureCAResult.parsers.
 * Therefore they are not descendants of ServiceWithLookupKeyCAResultBase.
 * They are not used to report an error or "not found".
 * That's reserved for the ParsersByCultureCAResult object.
 */
export interface ParserFoundCAResult
    extends ServiceChildResultBase {
    feature: CAFeature.parserFound;
}


/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeFormatterService.
 * Its requestResults array holds the results of the analysis for each cultureId,
 * using the FormattersByCultureCAResult object.
 */
export interface FormatterServiceCAResult extends MultiClassRetrieval {
    feature: CAFeature.formatter;
    results: Array<FormattersByCultureCAResult>;
}

/**
 * Formatters may have multiple DataTypeFormatter objects for a single lookup key and cultureID.
 * These are retained by FormatterServiceCAResult.requestResults.
 * They can hold a class retrieval, message/severity, or not found.
 */
export interface FormattersByCultureCAResult
    extends CultureSpecificClassRetrieval, ClassNotFound {
    feature: CAFeature.formattersByCulture;
}


/**
 * Documents the results of the analysis of a specific property of
 * a Config object.
 * Most properties only report warnings and errors. Some, like 
 * localization, may report info messages describing the results of the analysis.
 */
export interface PropertyCAResult extends CAResultBase, IssueForCAResultBase {
    feature: CAFeature.property | CAFeature.l10nProperty; 
    /**
     * May be more than one property as several may be analyzed together.
     */
    propertyName: string; 
}
/**
 * For a pair of properties related to localization, such as "label" and "labell10n".
 */
export interface LocalizedPropertyCAResult extends PropertyCAResult {
    feature: CAFeature.l10nProperty;
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
export interface LocalizedTextResult extends IssueForCAResultBase
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
export interface ErrorCAResult extends CAResultBase, IssueForCAResultBase {
    feature: CAFeature.error;
    severity: CAIssueSeverity.error;
    analyzerClassName: string;
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

    // addlookupKeysIssue(feature: string, lookupKey: string, severity: CAIssueSeverity, message: string): void;

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
    getSampleValue(lookupKey: string | null, valueHostConfig: ValueHostConfig | null): any;

    /**
     * Tries to add a lookup key and adds the associated service as a LookupKeyCAResult object
     * into results.lookupKeyResults.
     * Validates the lookup key string.
     * Uses LookupKeyAnalyzers to analyze service specific lookup keys against
     * their factories, services, and business rules.
     * 
     * @param lookupKey - The lookup key to add.
     * @param serviceName - The name of the service associated with the lookup key.
     * @param valueHostConfig - The configuration for the value host.
     * @returns The lookup key added to the LookupKeyCAResult object.
     * This value may have been updated from the original lookupKey, if the original
     * needed trimming or a case sensitive match.
     * If there was no lookup key, returns null.
     */
    registerServiceLookupKey(lookupKey: string | null | undefined, serviceName: ServiceName | null, valueHostConfig: ValueHostConfig | null): string | null;

/**
 * For any property that can hold a lookup key, check if the lookup key is valid.
 * It also uses registerServiceLookupKey to add the lookup key to the LookupKeyCAResult object if needed.
 * Cases:
 * - LookupKey is untrimmed empty string, null or undefined. Ignore. No results.
 * - LookupKey syntax is problematic like whitespace. Report an error and continue checking
 *   using the result from checkForRealLookupKeyName. Report the correct lookup key name
 *   if it was fixed.
 * - LookupKey is found in LookupKeyCAResult. Continue checking.
 * - LookupKey is not found in LookupKeyCAResult. Error. "Not found. Please add to [servicename]."
 * - With a service name, Error. "Not found. Please add to [servicename]."
 * 
 * All errors are added into the PropertyCAResult object that is added to the properties parameter.
 * 
 * @param propertyName - The name of the property being checked.
 * @param lookupKey - The lookup key to be checked.
 * @param serviceName - The service name to be checked. Use nullfor a dataType LookupKey.
 * @param properties - Add the PropertyCAResult object to this array.
 * @param containingValueHostConfig - The ValueHostConfig that contains the property being checked.
 * The property may be found on a child config object like ValidatorConfig or ConditionConfig.
 * @param className - The name of the class that is registered with the service to handle the lookup key,
 * such as "DataTypeFormatter" or "DataTypeConverter".
 * @param servicePropertyName - The name of the property in the service that the class is registered with.
 */
    checkLookupKeyProperty(propertyName: string, lookupKey: string | null | undefined,
        serviceName: ServiceName | null, containingValueHostConfig: ValueHostConfig,
        properties: Array<PropertyCAResult | ErrorCAResult>,
        className?: string, servicePropertyName?: string): void;
    
    
    /**
     * We want to discover the actual lookup key name, even if it is a case insensitive match.
     * There are several places to look for a case insensitive match:
     * - LookupKey enum itself
     * - LookupKeyFallbackService
     * - IdentifierService
     * @param lookupKey - whitespace will be trimmed before testing
     * @returns The correct lookup key name, if found. Otherwise, the original lookup key.
     * It can report an error for the caller to assign to its Result.severity and Result.message properties.
     */
    checkForRealLookupKeyName(lookupKey: string): {
        resolvedLookupKey: string,
        severity?: CAIssueSeverity,
        errorMessage?: string
    };
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
        properties: Array<PropertyCAResult | ErrorCAResult>): void;
    
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
        properties: Array<PropertyCAResult | ErrorCAResult>): void;

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
    checkValueHostNameExists(valueHostName: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>): void;
    
    /**
     * Evaluates the value and adds any issues to the properties array
     * as a PropertyCAResult object.
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
        properties: Array<PropertyCAResult | ErrorCAResult>): void;
    
    /**
     * Creates a prepared PropertyCAResult object with the given parameters.
     * @param propertyName 
     * @param severity 
     * @param errorMessage 
     */
    createPropertyCAResult(propertyName: string, severity: CAIssueSeverity,
        errorMessage: string): PropertyCAResult;
    
    /**
     * Creates a prepared ErrorCAResult object with the given parameters
     * and adds it to properties.
     * @param propertyName 
     * @param severity 
     * @param errorMessage 
     * @param properties 
     */
    addPropertyCAResult(propertyName: string, severity: CAIssueSeverity,
        errorMessage: string, properties: Array<PropertyCAResult | ErrorCAResult>): void;

    /**
     * Reports an error when the value is undefined.
     * Helper to use within PropertyAnalyzers. Call before using the value 
     * in a function that fails if value is undefined.
     * Will add a PropertyCAResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was undefined.
     */
    checkIsNotUndefined(value: any, propertyName: string,
        properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;

    /**
     * Reports an error when the value is null.
     * Helper to use within PropertyAnalyzers. Call before using the value 
     * in a function that fails if value is null.
     * Will add a PropertyCAResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was null.
     */
    checkIsNotNull(value: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;
    
    /**
     * Reports an error when the value is not a string.
     * Helper to use within PropertyAnalyzers. Call before using the value
     * in a function that fails if value is not a string.
     * Will add a PropertyCAResult object to the properties array
     * if an issue is found.
     * @param value
     * @param propertyName
     * @param properties
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was not a string.
     */
    checkIsString(value: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;
    
    /**
    * Reports an error when the value is an empty string, after trimming.
    * Helper to use within PropertyAnalyzers. Call before using the value
    * in a function that fails if value is an empty string.
    * Will add a PropertyCAResult object to the properties array
    * if an issue is found.
    * @param value
    * @param propertyName
    * @param properties
    * @param severity
    * @returns when true, continue execution. The value can be further analyzed.
    * When false, stop execution. The value was an empty string.
    */
    checkIsNotEmptyString(value: string, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;
    
    /**
     * Reports an error when the value is a string that has enclosing whitespace.
     * Helper to use within PropertyAnalyzers. Call before using the value
     * in a function that fails if value has enclosing whitespace.
     * Will add a PropertyCAResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity 
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was a string with enclosing whitespace.
     */
    checkNeedsTrimming(value: string, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;
}

/**
 * Represents the base interface for a configuration analyzer.
 *
 * @template TConfig - The type of the configuration object: 
 * ValueHostConfig, ValidatorConfig, ConditionConfig.
 * @template TResults - The type of the analysis results.
 */
export interface IConfigAnalyzer<TConfig, TResults extends ConfigObjectCAResultsBase<TConfig>,
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
 * creating a ValueHostConfigCAResult object for each VHC.
 */
export interface IValueHostConfigAnalyzer<TServices extends IValueHostsServices>
    extends IConfigAnalyzer<ValueHostConfig, ValueHostConfigCAResult, TServices> {
}

/**
 * Represents an interface for analyzing ValidatorConfig objects,
 * creating a ValidatorConfigCAResult object for each VC.
 */
export interface IValidatorConfigAnalyzer
    extends IConfigAnalyzer<ValidatorConfig, ValidatorConfigCAResult, IValidationServices> {
}


/**
 * Analyzes a ConditionConfig object, creating a ConditionResults object.
 */
export interface IConditionConfigAnalyzer<TServices extends IValueHostsServices> extends
    IConfigAnalyzer<ConditionConfig, ConditionConfigCAResult, TServices> {
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
export interface IConfigPropertyAnalyzer<TConfig, TResults extends ConfigObjectCAResultsBase<TConfig>> {
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
 * or LocalizedPropertyCAResult.
 */
export interface IValueHostConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ValueHostConfig, ValueHostConfigCAResult> {

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
 * or LocalizedPropertyCAResult.
 */
export interface IValidatorConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ValidatorConfig, ValidatorConfigCAResult> {

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
 * or LocalizedPropertyCAResult.
 */
export interface IConditionConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ConditionConfig, ConditionConfigCAResult> {

}