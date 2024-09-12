/**
 * Interfaces and types used by ConfigAnalysisResultsExplorer.
 * @module Explorer/Types
 */

import {
    IConfigAnalysisResults, CAPathedResult, CAResultPath,
    CAResultBase, CAFeature, CAIssueSeverity
} from "./Results";

/**
 * Tool to explore the results of the configuration analysis. 
 * This is the result of the IConfigAnalysis's analyze method.
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
    features?: Array<CAFeature | string>;

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
