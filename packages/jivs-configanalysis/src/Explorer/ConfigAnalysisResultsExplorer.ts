/**
 *
 * @module jivs-configanalysis/Explorer/ConcreteClasses
 */

import { ServiceName, IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { CodingError, assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { NullConfigAnalysisOutputter, ConsoleConfigAnalysisOutputter } from './Outputters/ConfigAnalysisOutputterClasses';
import { JsonConfigAnalysisOutputFormatter, CleanedObjectConfigAnalysisOutputFormatter } from './Formatters/ConfigAnalysisOutputFormatterClasses';
import {
    IConfigAnalysisResultsExplorer, ICAExplorerFactory, IConfigAnalysisOutputter,
    IConfigAnalysisSearchCriteria, IConfigAnalysisOutputFormatter, ConfigAnalysisOutputReportData,
    ICASearcher, ICAExplorerBase, ExplorerCreatorHandler
} from '../Types/Explorer';
import {
    IConfigAnalysisResults, CAIssueSeverity, CAPathedResult, CAResultPath, CAResultBase,
    ValueHostConfigCAResult, CAFeature, ValidatorConfigCAResult, ConditionConfigCAResult,
    LookupKeyCAResult, IdentifierServiceCAResult, ConverterServiceCAResult, ComparerServiceCAResult,
    ParserServiceCAResult, ParsersByCultureCAResult, ParserFoundCAResult, FormatterServiceCAResult,
    FormattersByCultureCAResult, PropertyCAResult, LocalizedPropertyCAResult, ErrorCAResult
} from '../Types/ConfigAnalysisResults';
import { CAExplorerBase } from './CAExplorerBase';
import { CASearcher } from './CASearcher';

/**
 * Tool to explore the results of the configuration analysis.
 * This is the result of the IConfigAnalysis's analyze method.
 * It provides methods to count, collect, and report the results,
 * all based on the criteria supplied.
 * Intended for your testing code and to write the results to something that can store them,
 * even if you don't have a testing situation.
 */
export class ConfigAnalysisResultsExplorer<TServices extends IJivsServices>
    implements IConfigAnalysisResultsExplorer {
    constructor(results: IConfigAnalysisResults,
        factory: ICAExplorerFactory,
        services: TServices) {
        assertNotNull(results, 'results');
        assertNotNull(services, 'services');
        assertNotNull(factory, 'factory');

        this._results = results;
        this._services = new WeakRef(services);
        this._factory = factory;
    }
    /**
     * The complete results of the analysis. This is the data operated upon by the methods of this class.
     */
    public get results(): IConfigAnalysisResults
    {
        return this._results;
    }
    private readonly _results: IConfigAnalysisResults;

    protected get services(): TServices
    {
        return this._services.deref() as TServices;
    }
    private readonly _services: WeakRef<TServices>;

    protected get factory(): ICAExplorerFactory
    {
        return this._factory;
    }
    private readonly _factory: ICAExplorerFactory;

    /**
     * Returns true if any ConfigResult objects with severity of 'error' are found
     * in either the ValueHostResults array or the LookupKeyResults array.
     */
    public hasErrors(): boolean
    {
        if (this.hasMatchInConfigResults({ severities: [CAIssueSeverity.error], skipChildrenIfParentMismatch: false }))
            return true;
        if (this.hasMatchInLookupKeyResults({ severities: [CAIssueSeverity.error], skipChildrenIfParentMismatch: false }))
            return true;
        return false;
    }
    /**
     * Throws an error if any ConfigResult objects with severity of 'error' are found.
     * The error class is CodingError. Its message will be JSON from the results found.
     * If the ouputter is supplied, it will be used to send the results to the outputter
     * in addition to creating the Error.
     * @param includeCompleteResults - When true, include the complete Explorer.results in the error message.
     * @param outputter - The outputter to send the results to.
     */
    public throwOnErrors(includeCompleteResults: boolean = false, outputter?: IConfigAnalysisOutputter): void
    {
        const reportData = this.createReportData(
            { severities: [CAIssueSeverity.error], skipChildrenIfParentMismatch: false },
            { severities: [CAIssueSeverity.error], skipChildrenIfParentMismatch: false },
            includeCompleteResults);
        if ((reportData.valueHostQueryResults && reportData.valueHostQueryResults.length > 0) ||
            (reportData.lookupKeyQueryResults && reportData.lookupKeyQueryResults.length > 0)) {
            let content: any = undefined;
            if (outputter) {
                content = outputter.send(reportData);
            }
            if (typeof content !== 'string')
            {
                const jsonOutputter = new JsonConfigAnalysisOutputFormatter();
                content = jsonOutputter.format(reportData);
            }
            throw new CodingError('Errors found in configuration analysis\n' + content);
        }
    }

    /**
     * Return a count of the number of ConfigResult objects found in the ValueHostResults array
     * matching the criteria.
     * @param criteria When null, return all results.
     */
    public countConfigResults(criteria: IConfigAnalysisSearchCriteria | null): number {
        return this.queryValueHostResults(criteria).length;
    }
    /**
     * Return a count of the number of LookupKeyCAResult objects and all children
     * found in the lookupKeyResults array matching the criteria.
     * @param criteria
     */
    public countLookupKeyResults(criteria: IConfigAnalysisSearchCriteria | null): number {
        return this.queryLookupKeyResults(criteria).length;
    }

    /**
     * Returns true if it finds one ConfigResults object that matches the criteria.
     * This is effectively the same idea as countConfigResults(criteria) but doesn't
     * waste time counting them all.
     * @param criteria
     */
    public hasMatchInConfigResults(criteria: IConfigAnalysisSearchCriteria): boolean
    {
        const preppedCriteria = new CASearcher(criteria);
        return this.results.valueHostResults.some((configResults) => {
            const explorer = this.factory.create(configResults);
            return explorer.hasMatch(preppedCriteria, this.factory);
        });
    }

    /**
     * Returns true if it finds one LookupKeyCAResult object that matches the criteria.
     * This is effectively the same idea as countLookupKeyResults(criteria) but doesn't
     * waste time counting them all.
     * @param criteria
     */
    public hasMatchInLookupKeyResults(criteria: IConfigAnalysisSearchCriteria): boolean
    {
        const preppedCriteria = new CASearcher(criteria);
        return this.results.lookupKeyResults.some((lookupKeyResult) => {
            const explorer = this.factory.create(lookupKeyResult);
            return explorer.hasMatch(preppedCriteria, this.factory);
        });
    }
    /**
     * Return a list of all ConfigResult objects found in the ValueHostResults array,
     * wrapped in a CAPathedResult object.
     * When a CAResultBases object is found, it is added to the list
     * and its children are evaluated.
     * When not found, children are not evaluated.
     * @param criteria
     */
    public queryValueHostResults(criteria: IConfigAnalysisSearchCriteria | null): Array<CAPathedResult<any>> {
        const matches: Array<CAPathedResult<any>> = [];
        const preppedCriteria = new CASearcher(criteria);
        this.results.valueHostResults.forEach((configResults) => {
            const explorer = this.factory.create(configResults);
            explorer.collect(preppedCriteria, matches, {}, this.factory);
        });
        return matches;
    }
    /**
     * Return a list of all LookupKeyCAResult objects found in the lookupKeyResults array,
     * wrapped in a CAPathedResult object.
     * When a CAResultBases object is found, it is added to the list
     * and its children are evaluated.
     * When not found, children are not evaluated.
     */
    public queryLookupKeyResults(criteria: IConfigAnalysisSearchCriteria | null): Array<CAPathedResult<any>> {
        const matches: Array<CAPathedResult<any>> = [];
        const preppedCriteria = new CASearcher(criteria);
        this.results.lookupKeyResults.forEach((lookupKeyResult) => {
            const explorer = this.factory.create(lookupKeyResult);
            explorer.collect(preppedCriteria, matches, {}, this.factory);
        });
        return matches;
    }

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
     * Path strings are matched case insensitively.
     * @param foundResults
     * @returns The first ConfigResult object that matches the path, or null if no match is found.
     * It also is tagged with an 'index' property that is the index of the foundResults array.
     */
    public getByResultPath(path: CAResultPath, foundResults: Array<CAPathedResult<any>>): CAResultBase | null {
        /**
         * Case insensitive matching on both key and value.
         * @param foundResult
         * @returns
         */
        function pathMatches(foundResult: CAPathedResult<any>): boolean {
            if (pathLength !== Object.keys(foundResult.path).length)
                return false;
            let pathValue: string | null | undefined = undefined;   // when undefined by the end, it is not a match
            let foundValue: string | null | undefined = undefined;  // when undefined by the end, it is not a match
            for (const key in path) {
                pathValue = path[key];
                foundValue = foundResult.path[key];
                if (foundValue === undefined)
                { // case insensitive matching to key
                    const keyLC = key.toLowerCase();
                    for (const foundKey in foundResult.path) {
                        const foundKeyLC = foundKey.toLowerCase();
                        if (foundKeyLC === keyLC)
                        {
                            foundValue = foundResult.path[foundKey];
                        }
                    }
                }
                // these values can be null or strings. Ensure strings are lower case.
                if (typeof pathValue === 'string')
                    pathValue = pathValue.toLowerCase();
                if (typeof foundValue === 'string')
                    foundValue = foundValue.toLowerCase();
                if (pathValue !== foundValue)
                    return false;
            }
            return true;
        }
        let foundResult: CAResultBase | null = null;
        // determine that both the path and the foundResult.path have the same length
        const pathLength = Object.keys(path).length;

        // compare each path in the foundResults array to the path object.
        // Stop on the first found
        for (let i = 0; i < foundResults.length; i++) {
            const thisResult = foundResults[i];
            if (pathMatches(thisResult)) {
                foundResult = thisResult.result;
                (foundResult as any).index = i;
                break;
            }
        }
        return foundResult;
    }

    /**
     * @inheritDoc jivs-configanalysis/Explorer/Types!IConfigAnalysisResultsExplorer.reportIntoJson
     */
    public reportIntoJson(valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        includeCompleteResults: boolean = false,
        space?: string | number | null): string
    {
        const formatter = new JsonConfigAnalysisOutputFormatter(space ?? undefined);
        const outputter = new NullConfigAnalysisOutputter(formatter);
        return this.report(valueHostCriteria, lookupKeyCriteria, includeCompleteResults, outputter);
    }

    /**
     * @inheritDoc jivs-configanalysis/Explorer/Types!IConfigAnalysisResultsExplorer.reportToConsole
     */
    public reportToConsole(valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        includeCompleteResults: boolean = false,
        space?: string | number | null): void
    {
        let formatter: IConfigAnalysisOutputFormatter | undefined = undefined;
        if (space == null)  // null or undefined
            formatter = new CleanedObjectConfigAnalysisOutputFormatter();
        else
            formatter = new JsonConfigAnalysisOutputFormatter(space);
        const outputter = new ConsoleConfigAnalysisOutputter(formatter);
        this.report(valueHostCriteria, lookupKeyCriteria, includeCompleteResults, outputter);
    }

    /**
     * Helper to create an object that includes both the valueHostResults and lookupKeyResults,
     * based on the criteria.
     * Expected output this overall shape:
     * ```ts
     * {
     *    valueHostResults: [ ... ], // or null
     *    lookupKeyResults: [ ... ]  // or null
     * }
     * ```
     *
     * @param valueHostCriteria - The criteria to match against the ValueHostResults array. Effectively the same as
     * calling queryValueHostResults(valueHostCriteria). Creates the valueHostQueryResults property.
     * If you want to omit this, pass in false or null.
     * If you want all results, pass in true or an empty object.
     * @param lookupKeyCriteria - The criteria to match against the LookupKeyResults array. Effectively the same as
     * calling queryLookupKeyResults(lookupKeyCriteria). Creates the lookupKeyQueryResults property.
     * If you want to omit this, pass in false or null.
     * If you want all results, pass in true or an empty object.
     * @param includeCompleteResults - When true, include the explorer.results object
     * as the overallResults property.
     * @returns  An object with up to 3 properties: valueHostResults, lookupKeyResults, and overallResults.
     */
    protected createReportData(valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        includeCompleteResults: boolean): ConfigAnalysisOutputReportData
    {
        const reportData: ConfigAnalysisOutputReportData = {};

        if (valueHostCriteria !== false && valueHostCriteria !== null)
            if (valueHostCriteria === true)
            {
                reportData.valueHostQueryResults = this.queryValueHostResults(null);
            }
            else
                reportData.valueHostQueryResults = this.queryValueHostResults(valueHostCriteria as IConfigAnalysisSearchCriteria);
        if (lookupKeyCriteria !== false && lookupKeyCriteria !== null)
            if (lookupKeyCriteria === true)
            {
                reportData.lookupKeyQueryResults = this.queryLookupKeyResults(null);
            }
            else
                reportData.lookupKeyQueryResults = this.queryLookupKeyResults(lookupKeyCriteria as IConfigAnalysisSearchCriteria);
        if (includeCompleteResults)
            reportData.completeResults = this.results;
        return reportData;
    }

    /**
     * @inheritDoc jivs-configanalysis/Explorer/Types!IConfigAnalysisResultsExplorer.report
     */
    public report(valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null,
        includeCompleteResults: boolean,
        outputter: IConfigAnalysisOutputter): any
    {
        assertNotNull(outputter, 'outputter');
        const report = this.createReportData(valueHostCriteria, lookupKeyCriteria, includeCompleteResults);
        return outputter.send(report);
    }
}

//#region top level config explorers
/**
 * For exploring ValueHostConfigCAResult objects. Their identifier is the valueHostName property
 * and their feature is CAFeature.ValueHost.
 * They contain several types of children: from properties, validators, and enablerCondition.
 */
export class ValueHostConfigCAResultExplorer extends CAExplorerBase<ValueHostConfigCAResult>
{
    public feature(): string {
        return CAFeature.valueHost;
    }

    public identifier(): string | null {
        return this.result.valueHostName;
    }
    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchValueHostName(this.result.valueHostName);
    }

    /**
     * Several sources: properties, validatorResults, enablerConditionResult.
     * @returns
     */
    public children(): Array<CAResultBase> {
        let children: Array<CAResultBase> = [];
        if (this.result.properties)
            children = children.concat(this.result.properties);
        if (this.result.validatorResults)
            children = children.concat(this.result.validatorResults);
        if (this.result.enablerConditionResult)
            children.push(this.result.enablerConditionResult);
        return children;
    }
}

/**
 * For exploring ValidatorConfigCAResult objects. Their identifier is the errorCode property
 * and their feature is CAFeature.Validator.
 * They contain several types of children: from properties and condition.
 */
export class ValidatorConfigCAResultExplorer extends CAExplorerBase<ValidatorConfigCAResult>
{
    public feature(): string {
        return CAFeature.validator;
    }

    public identifier(): string | null {
        return this.result.errorCode;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchErrorCode(this.result.errorCode);
    }

    public children(): Array<CAResultBase> {
        let children: Array<CAResultBase> = [];
        if (this.result.properties)
            children = children.concat(this.result.properties);

        if (this.result.conditionResult)
            children.push(this.result.conditionResult);
        return children;

    }
}

/**
 * For exploring ConditionConfigCAResult objects.
 * Their identifier is the conditionType property and their feature is CAFeature.Condition.
 * NOTE: There may be multiple Conditions found in a single CAPathResult, because
 * of result.childrenResults. All have the same feautre name, "feature", here.
 * However, in the CAPathResult, expect to assign the name of duplicate features
 * with "#" + number to differentiate.
 * They contain several types of children: from properties, from childrenResults
 */
export class ConditionConfigCAResultExplorer extends CAExplorerBase<ConditionConfigCAResult>
{
    public feature(): string {
        return CAFeature.condition;
    }

    public identifier(): string | null {
        return this.result.conditionType;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchConditionType(this.result.conditionType);
    }

    /**
     * Children are from properties and childrenResults.
     * @returns
     */
    public children(): Array<CAResultBase> {
        let children: Array<CAResultBase> = [];
        if (this.result.properties)
            children = children.concat(this.result.properties);
        if (this.result.childrenResults)
            children = children.concat(this.result.childrenResults);
        return children;

    }
}

//#endregion

//#region LookupKey and its service explorers
/**
 * For exploring LookupKeyCAResult objects. Their identifier is the lookupKey property
 * and their feature is CAFeature.LookupKey.
 */
export class LookupKeyCAResultExplorer extends CAExplorerBase<LookupKeyCAResult>
{
    public feature(): string {
        return CAFeature.lookupKey;
    }

    public identifier(): string | null {
        return this.result.lookupKey;
    }

    public matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchLookupKey(this.result.lookupKey);
    }

    public children(): Array<CAResultBase> {
        return this.result.serviceResults ?? [];
    }
}

/**
 * For exploring IdentifierServiceCAResult objects.
 * Their identifier is null and their feature is CAFeature.identifier.
 * Supports criteria.serviceNames = ServiceName.identifier.
 */
export class IdentifierServiceCAResultExplorer extends CAExplorerBase<IdentifierServiceCAResult>
{
    public feature(): string {
        return CAFeature.identifier;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchServiceName(ServiceName.identifier);
    }

    public children(): Array<CAResultBase> {
        return [];
    }
}

/**
 * For exploring ConverterServiceCAResult objects.
 * Their identifier is null and their feature is CAFeature.converter.
 * Supports criteria.serviceNames = ServiceName.converter.
 */
export class ConverterServiceCAResultExplorer extends CAExplorerBase<ConverterServiceCAResult>
{
    public feature(): string {
        return CAFeature.converter;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchServiceName(ServiceName.converter);
    }

    public children(): Array<CAResultBase> {
        return [];
    }
}


/**
 * For exploring ComparerServiceCAResult objects.
 * Their identifier is null and their feature is CAFeature.comparer.
 * Supports criteria.serviceNames = ServiceName.comparer.
 */
export class ComparerServiceCAResultExplorer extends CAExplorerBase<ComparerServiceCAResult>
{
    public feature(): string {
        return CAFeature.comparer;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchServiceName(ServiceName.comparer);
    }

    public children(): Array<CAResultBase> {
        return [];
    }
}

/**
 * For exploring ParserClassRetrieval objects. Their identifier is null
 * and their feature is CAFeature.parser.
 * Supports criteria.serviceNames = ServiceName.parser.
 */
export class ParserServiceCAResultExplorer extends CAExplorerBase<ParserServiceCAResult>
{
    public feature(): string {
        return CAFeature.parser;
    }

    public identifier(): string | null {
        return null;
    }
    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchServiceName(ServiceName.parser);
    }

    public children(): Array<CAResultBase> {
        return this.result.results ?? [];
    }
}

/**
 * For exploring ParsersByCultureCAResult objects.
 * Their identifier is the cultureId property and their feature is CAFeature.parsersByCulture.
 * Supports criteria.cultureIds and criteria.serviceNames = ServiceName.parser.
 */
export class ParsersByCultureCAResultExplorer extends CAExplorerBase<ParsersByCultureCAResult> {
    public feature(): string {
        return CAFeature.parsersByCulture;
    }

    public identifier(): string | null {
        return this.result.cultureId;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        const cultureIdMatch = searcher.matchCultureId(this.result.cultureId);
        const serviceNameMatch = searcher.matchServiceName(ServiceName.parser);
        if (cultureIdMatch === undefined && serviceNameMatch === undefined)
            return undefined;
        return (cultureIdMatch ?? true) && (serviceNameMatch ?? true);
    }

    public children(): Array<CAResultBase> {
        return this.result.parserResults ?? [];
    }
}

/**
 * For exploring ParserFoundCAResult objects.
 * Their identifier is the classFound and their feature is CAFeature.parserFound.
 * NOTE: It is unusual to use classFound as the identifier.
 * In this case, we may have several parsers found, only differentiated by the class name.
 * This class is never generated if it class was not found.
 * Supports criteria.serviceNames = ServiceName.parser.
 */
export class ParserFoundCAResultExplorer extends CAExplorerBase<ParserFoundCAResult> {
    public feature(): string {
        return CAFeature.parserFound;
    }

    public identifier(): string | null {
        return this.result.classFound!;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchServiceName(ServiceName.parser);
    }

    public children(): Array<CAResultBase> {
        return [];
    }
}

/**
 * For exploring FormatterServiceCAResult objects.
 * Their identifier is null and their feature is ServiceName.formatter.
 * Supports criteria.serviceNames = ServiceName.formatter.
 */
export class FormatterServiceCAResultExplorer extends CAExplorerBase<FormatterServiceCAResult>
{
    public feature(): string {
        return CAFeature.formatter;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchServiceName(ServiceName.formatter);
    }

    public children(): Array<CAResultBase> {
        return this.result.results ?? [];
    }
}

/**
 * For exploring FormattersByCultureCAResult objects.
 * Their identifier is the requestedCultureId property and their feature is CAFeature.formattersByCulture.
 * Supports criteria.cultureIds and criteria.serviceNames = ServiceName.formatter.
 */
export class FormattersByCultureCAResultExplorer extends CAExplorerBase<FormattersByCultureCAResult> {
    public feature(): string {
        return CAFeature.formattersByCulture;
    }

    public identifier(): string | null {
        return this.result.requestedCultureId;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        const cultureIdMatch = searcher.matchCultureId(this.result.requestedCultureId);
        const serviceNameMatch = searcher.matchServiceName(ServiceName.formatter);
        if (cultureIdMatch === undefined && serviceNameMatch === undefined)
            return undefined;
        return (cultureIdMatch ?? true) && (serviceNameMatch ?? true);
    }

    public children(): Array<CAResultBase> {
        return [];
    }
}
//#endregion


/**
 * For exploring PropertyCAResult objects. Their identifier is the propertyName property
 * and their feature is CAFeature.Property.
 */
export class PropertyCAResultExplorer extends CAExplorerBase<PropertyCAResult>
{
    public feature(): string {
        return CAFeature.property;
    }

    public identifier(): string | null {
        return this.result.propertyName;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return searcher.matchPropertyName(this.result.propertyName);
    }

    public children(): Array<CAResultBase> {
        return [];
    }
}

/**
 * For exploring LocalizedPropertyCAResult objects. Their identifier is the l10nPropertyName property
 * and their feature is CAFeature.l10nProperty.
 */
export class LocalizedPropertyCAResultExplorer extends CAExplorerBase<LocalizedPropertyCAResult>
{
    public feature(): string {
        return CAFeature.l10nProperty;
    }

    public identifier(): string | null {
        return this.result.l10nPropertyName;
    }
    protected matchSeverity(searcher: ICASearcher): boolean | undefined
    {
        // if there a cultureText severity matches
        // the criteria's severity, return true.
        // This is a special case because cultureText.severity
        // is always set, and we just want to know if one of them matches.
        const ct = this.result.cultureText;
        if (ct)
            for (const key in ct)
            {
                const info = ct[key];
                if (info)
                    if (searcher.matchSeverity(info.severity) === true)
                        return true;
            }

        return searcher.matchSeverity((this.result as any).severity);
    }
    /**
     * Matches both the propertyName and l10nPropertyName properties against criteria.propertyNames.
     * In this case, either match is sufficient to return true, unless there is
     * cultureText with an error, which will cause a false return.
     * @returns
     */
    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        // if either is true, return true
        const pResult = searcher.matchPropertyName(this.result.propertyName);
        const lpResult = searcher.matchPropertyName(this.result.l10nPropertyName);

        if (pResult || lpResult)
            return true;
        // we are left with only false and undefined
        return (pResult === false || lpResult === false) ? false : undefined;
    }

    public children(): Array<CAResultBase> {
        return [];
    }
}

/**
 * For exploring ErrorCAResult objects. Their identifier is null
 * and their feature is CAFeature.Error.
 */
export class ErrorCAResultExplorer extends CAExplorerBase<ErrorCAResult>
{
    public feature(): string {
        return CAFeature.error;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
        return undefined;
    }

    public children(): Array<CAResultBase> {
        return [];
    }
}

/**
 * A factory for creating the appropriate ConfigResultsExplorer object
 * for the ConfigResults object based its the feature property.
 */
export class ConfigAnalysisResultsExplorerFactory implements ICAExplorerFactory
{
    constructor()
    {
        this._explorers = new Map<string, ExplorerCreatorHandler<CAResultBase>>();
        this.populate();
    }
    protected populate(): void {
        this.register(CAFeature.valueHost, (result) => new ValueHostConfigCAResultExplorer(result as ValueHostConfigCAResult));
        this.register(CAFeature.validator, (result) => new ValidatorConfigCAResultExplorer(result as ValidatorConfigCAResult));
        this.register(CAFeature.condition, (result) => new ConditionConfigCAResultExplorer(result as ConditionConfigCAResult));
        this.register(CAFeature.lookupKey, (result) => new LookupKeyCAResultExplorer(result as LookupKeyCAResult));
        this.register(CAFeature.identifier, (result) => new IdentifierServiceCAResultExplorer(result as IdentifierServiceCAResult));
        this.register(CAFeature.converter, (result) => new ConverterServiceCAResultExplorer(result as ConverterServiceCAResult));
        this.register(CAFeature.comparer, (result) => new ComparerServiceCAResultExplorer(result as ComparerServiceCAResult));
        this.register(CAFeature.parser, (result) => new ParserServiceCAResultExplorer(result as ParserServiceCAResult));
        this.register(CAFeature.parsersByCulture, (result) => new ParsersByCultureCAResultExplorer(result as ParsersByCultureCAResult));
        this.register(CAFeature.parserFound, (result) => new ParserFoundCAResultExplorer(result as ParserFoundCAResult));
        this.register(CAFeature.formatter, (result) => new FormatterServiceCAResultExplorer(result as FormatterServiceCAResult));
        this.register(CAFeature.formattersByCulture, (result) => new FormattersByCultureCAResultExplorer(result as FormattersByCultureCAResult));
        this.register(CAFeature.property, (result) => new PropertyCAResultExplorer(result as PropertyCAResult));
        this.register(CAFeature.l10nProperty, (result) => new LocalizedPropertyCAResultExplorer(result as LocalizedPropertyCAResult));
        this.register(CAFeature.error, (result) => new ErrorCAResultExplorer(result as ErrorCAResult));
    }
    /**
     * Create the appropriate ConfigResultsExplorer object for the ConfigResults object based on the feature.
     * It is a factory method that creates the object from the functions registered with
     * registerConfigResultsExplorer().
     * @param configResult
     * @returns A new ConfigResultsExplorer object assigned to the configResult object.
     */
    public create(configResult: CAResultBase): ICAExplorerBase<CAResultBase> {
        // feature may contain extra text after the feature name, such as "Condition#2".
        // use the feature name only.
        const feature = configResult.feature.split('#')[0];
        const fn = this._explorers.get(feature);
        if (fn) {
            return fn(configResult);
        }
        throw new CodingError(`Explorer not registered for feature: ${configResult.feature}`);
    }

    /**
     * Register a new ConfigResultsExplorer with this object.
     * @param feature - The feature that will be used to identify the object by the factory.
     * @param explorerCreator - Once identified, this function will create the object. It is passed the ConfigResults object
     * which is expected to be assigned to the result property of the object.
     */
    public register<T extends CAResultBase>(feature: string, explorerCreator: ExplorerCreatorHandler<T>): void {
        this._explorers.set(feature, explorerCreator);
    }
    private readonly _explorers: Map<string, ExplorerCreatorHandler<any>>;   // 'any' is used because CAResultBase resulted in TS2352 error due to TypeScript limitations.
}
