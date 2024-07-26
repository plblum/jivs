/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import {
    IConfigAnalysisResultsExplorer, IConfigAnalysisResults, IConfigAnalysisSearchCriteria, LookupKeyServiceInfoBase,
    CAPathedResult,
    CAExplorerFactory,
    ConfigAnalysisResultBase,
    ICAExplorerBase,
    LookupKeyInfo,
    ParserForCultureClassRetrieval,
    OneClassRetrieval,
    MultiClassRetrieval,
    ConfigPropertyResult,
    LocalizedPropertyResult,
    ConfigErrorResult,
    ValueHostConfigResults,
    ValidatorConfigResults,
    ConditionConfigResults,
    ExplorerCreatorHandler,
    lookupKeyFeature,
    dataTypeFeature,
    identifierServiceFeature,
    propertyNameFeature,
    l10nPropertiesFeature,
    parserServiceFeature,
    comparerServiceFeature,
    converterServiceFeature,
    formatterServiceFeature,
    errorFeature,
    valueHostFeature,
    conditionFeature,
    validatorFeature,
    IdentifierServiceClassRetrieval,
    ConverterServiceClassRetrieval,
    ComparerServiceClassRetrieval,
    FormatterServiceClassRetrieval
} from "../../Interfaces/ConfigAnalysisService";
import { IValueHostsServices } from "../../Interfaces/ValueHostsServices";
import { CodingError, assertNotNull } from "../../Utilities/ErrorHandling";
import { ServiceName } from '../../Interfaces/ValidationServices';

/**
 * Tool to explore the results of the configuration analysis. 
 * This is the result of the IConfigAnalysisService's analyze method.
 * It provides methods to count, collect, and report the results,
 * all based on the criteria supplied.
 * Intended for your testing code and to write the results to something that can store them,
 * even if you don't have a testing situation.
 */
export class ConfigAnalysisResultsExplorer<TServices extends IValueHostsServices>
    implements IConfigAnalysisResultsExplorer {
    constructor(results: IConfigAnalysisResults,
        factory: CAExplorerFactory,
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
    private readonly _services: WeakRef<TServices>;

    protected get factory(): CAExplorerFactory
    {
        return this._factory;
    }   
    private _factory: CAExplorerFactory;


    /**
     * Return a count of the number of ConfigResult objects found in the ConfigIssues array
     * matching the criteria.
     * @param criteria When null, return all results.
     */
    public countConfigResults(criteria: IConfigAnalysisSearchCriteria | null): number {
        let preppedCriteria = this.prepCriteria(criteria);
        return this.collectWithConfigs(preppedCriteria).length;
    }
    /**
     * Return a count of the number of LookupKeyInfo objects and all children
     * found in the LookupKeysInfo array matching the criteria.
     * @param criteria 
     */
    public countLookupKeyResults(criteria: IConfigAnalysisSearchCriteria | null): number {
        let preppedCriteria = this.prepCriteria(criteria);
        return this.collectWithLookupKeys(preppedCriteria).length;
    }
    /**
     * Return a list of all ConfigResult objects found in the ConfigIssues array,
     * wrapped in a CAPathedResult object.
     * @param criteria 
     */
    public collectWithConfigs(criteria: IConfigAnalysisSearchCriteria | null): Array<CAPathedResult<any>> {
        let matches: Array<CAPathedResult<any>> = [];
        let preppedCriteria = this.prepCriteria(criteria);
        this.results.configIssues.forEach((configResults) => {
            const explorer = this.factory.create(configResults);
            explorer.collect(preppedCriteria, matches, [], this.factory);
        });
        return matches;
    }
    /**
     * Return a list of all LookupKeyInfo objects found in the LookupKeysInfo array,
     * wrapped in a CAPathedResult object.
     */
    public collectWithLookupKeys(criteria: IConfigAnalysisSearchCriteria | null): Array<CAPathedResult<any>> {
        let matches: Array<CAPathedResult<any>> = [];
        let preppedCriteria = this.prepCriteria(criteria);
        this.results.lookupKeysInfo.forEach((lookupKeyInfo) => {
            const explorer = this.factory.create(lookupKeyInfo);
            explorer.collect(preppedCriteria, matches, [], this.factory);
        });
        return matches;
    }

    /**
     * Return a clone of the criteria object with all string values converted to lowercase.
     * This is to prepare for case-insensitive matching without having 
     * each Explorer class do the conversion.
     * @param criteria 
     * @returns 
     */
    protected prepCriteria(criteria: IConfigAnalysisSearchCriteria | null): IConfigAnalysisSearchCriteria | null {
        if (criteria !== null) {
            let newCriteria: any = {};
            for (let key in criteria) {
                let value = (criteria as any)[key];
                if (Array.isArray(value)) {
                    newCriteria[key] = value.map((item) => {
                        if (typeof item === 'string') {
                            return item.toLowerCase();
                        }
                        return item;
                    });
                }
                else {
                    newCriteria[key] = value;
                }
            }
            return newCriteria as IConfigAnalysisSearchCriteria;
        }
        return null;
    }
}

/**
 * For building an object that can handle a specific type of configuration object based 
 * on the feature property. These classes are registered with the ConfigAnalysisResultsExplorer
 * and are created in a factory approach based on the config result object.
 */
export abstract class CAExplorerBase<T extends ConfigAnalysisResultBase> implements ICAExplorerBase<T>
{
    constructor(result: T) {
        assertNotNull(result, 'result');
        this._result = result;
    }
    private _result: T;

    /**
     * Gets the result of the configuration analysis, which is an object structure
     * with data from Configuration objects in configIssues,
     * and data from Lookup Keys and their associated services in lookupKeysInfo.
     * @returns The result of the configuration analysis.
     */
    public get result(): T
    {
        return this._result;
    }
    
    /**
     * A fixed value representing the only feature string that is supported by this class.
     * Each ConfigAnalysisResultBase object has a feature property that is matched to this one.
     */
    public abstract feature(): string;

/**
 * Provides a way to identify the specific instance of this object.
 * Example values are valueHostName, lookupKey, errorCode, conditionType, or the property name of a config object.
 * These are used to build a path to the object in the configuration.
 * It is null when the feature lacks some useful identifer.
 * This value, together with feature(), are used to build a path to the
 * associated ConfigAnalysisResultBase object. It is used in the path even if null.
 */    
    public abstract identifier(): string | null;

    /**
     * Determines if the result matches the criteria.
     * It does not evaluate any children of the result.
     * 
     * To match, all assigned criteria must match SO LONG AS
     * it is applicable to the object being evaluated.
     * For example, when the feature is 'LookupKey', the lookupKeys criteria is used.
     * 
     * @param criteria When null, it means include all and thus return null.
     * NOTE: Expects all strings in the criteria to be lowercase already.
     */
    public match(criteria: IConfigAnalysisSearchCriteria | null): boolean {
        if (!criteria)
            return true;
        if (!this.matchStringCriteria(criteria.features, this.feature()))
            return false;
        // match severities
        let resultSeverity = (this.result as any).severity;
        if (criteria.severities && (resultSeverity !== undefined)) {
            if (!criteria.severities.includes(resultSeverity.severity))
                return false;
        }
        else if (criteria.severities === null)
            // severity must be undefined in result
            if (resultSeverity !== undefined)
                return false;
        return this.matchWorker(criteria);
    }

    /**
     * Provides a way for subclasses to extend the match method to include their own criteria.
     * Note that the match() method has already handled criteria = null
     * and these criteria members: features, severities.
     * @param criteria 
     */
    protected abstract matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean;

    /**
     * 
     * @param valuesToMatch - From a single property of Criteria. Expects all strings to be lowercase.
     * @param valueFromResult - To compare to valuesToMatch case insensitively.
     * @returns When valuesToMatch is null or empty, return true.
     */
    protected matchStringCriteria(valuesToMatch: Array<string> | undefined, valueFromResult: string): boolean {
        if (!valuesToMatch || valuesToMatch.length === 0) {
            return true;
        }
        return valuesToMatch.includes(valueFromResult.toLowerCase());
    }

    /**
     * Using match on itself and its children, collect all results that match the criteria
     * into the matches array.
     * NOTE: Expects all strings in the criteria to be lowercase already.
     * @param criteria - The criteria to match against. When null, include all.
     * @param matches - Where to add any generated CAPathedResult objects.
     * @param path The feature + identifier from each parent object to this object. When this calls a child,
     * it creates a new path from this plus its own identifier. Nothing is added if the identifier is null.
     * @param factory The factory to create entries going into matches.
     */
    public collect(criteria: IConfigAnalysisSearchCriteria | null, matches: Array<CAPathedResult<T>>,
        path: Array<{ feature: string; identifier: string; }>, factory: CAExplorerFactory): void {
        if (this.match(criteria)) {
            let newPath = path.slice();
            newPath.push({ feature: this.feature(), identifier: this.identifier() ?? '' });
            matches.push({ path: newPath, result: this.result });
        }   
        this.children().forEach((child) => {
            let childExplorer = factory.create(child);
            childExplorer.collect(criteria, matches, path, factory);
        });
    }

    /**
     * Return a list of all children of the result that match the criteria
     * or [] if no children are available.
     */
    public abstract children(): Array<ConfigAnalysisResultBase>;

}

/**
 * For exploring LookupKeyInfo objects. Their identifier is the lookupKey property
 * and their feature is 'LookupKey'.
 */
class LookupKeyInfoExplorer extends CAExplorerBase<LookupKeyInfo>
{
    public feature(): string {
        return lookupKeyFeature;
    }

    public identifier(): string | null {
        return this.result.lookupKey;
    }

    public matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return this.matchStringCriteria(criteria.lookupKeys, this.result.lookupKey);
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return this.result.services ?? [];
    }
}

/**
 * For exploring LookupKeyServiceInfoBase objects that reflect a "DataType" without a service. 
 * Their identifier is the service property is null and their feature is 'DataType'.
 */
class DataTypeLookupKeyServiceInfoExplorer extends CAExplorerBase<LookupKeyServiceInfoBase>
{

    public feature(): string {
        return dataTypeFeature;
    }

    public identifier(): string | null {
        return null;
    }
    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return true;
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return [];
    }
}

/**
 * For exploring ParserClassRetrieval objects. Their identifier is null
 * and their feature is ServiceName.parser.
 */
class ParserLookupKeyServiceInfoExplorer extends CAExplorerBase<ParserForCultureClassRetrieval>
{
    public feature(): string {
        return parserServiceFeature;
    }

    public identifier(): string | null {
        return null;
    }
    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return true;
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return this.result.matches ?? [];
    }
}

/**
 * For exploring ComparerServiceClassRetrieval objects associated with ServiceName.comparer.
 * Their identifier is null and their feature is ServiceName.comparer.
 */
class ComparerLookupKeyServiceInfoExplorer extends CAExplorerBase<ComparerServiceClassRetrieval>
{
    public feature(): string {
        return comparerServiceFeature;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return true;
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return [];
    }
}

/**
 * For exploring ConverterServiceClassRetrieval objects associated with ServiceName.converter.
 * Their identifier is null and their feature is ServiceName.converter.
 */
class ConverterLookupKeyServiceInfoExplorer extends CAExplorerBase<ConverterServiceClassRetrieval>
{
    public feature(): string {
        return converterServiceFeature;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return true;
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return [];
    }
}  

/**
 * For exploring MultiClassRetrieval objects associated with ServiceName.formatter.
 * Their identifier is null and their feature is ServiceName.formatter.
 */
class FormatterLookupKeyServiceInfoExplorer extends CAExplorerBase<FormatterServiceClassRetrieval>
{
    public feature(): string {
        return formatterServiceFeature;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return true;
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return (this.result.requests as Array<ConfigAnalysisResultBase>) ?? [];
    }
}   

/**
 * For exploring IdentifierServiceClassRetrieval objects associated with ServiceName.identifier.
 * Their identifier is null and their feature is ServiceName.identifier.
 */
class IdentifierLookupKeyServiceInfoExplorer extends CAExplorerBase<IdentifierServiceClassRetrieval>
{
    public feature(): string {
        return identifierServiceFeature;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return true;
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return [];
    }
}

/**
 * For exploring ConfigPropertyResult objects. Their identifier is the propertyName property
 * and their feature is 'Property'.
 */
class PropertyResultExplorer extends CAExplorerBase<ConfigPropertyResult>
{
    public feature(): string {
        return propertyNameFeature;
    }

    public identifier(): string | null {
        return this.result.propertyName;
    }

    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return this.matchStringCriteria(criteria.propertyNames, this.result.propertyName);
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return [];
    }
}

/**
 * For exploring LocalizedPropertyResult objects. Their identifier is the l10nPropertyName property
 * and their feature is 'l10nProperties'.
 */
class LocalizedPropertyResultExplorer extends CAExplorerBase<LocalizedPropertyResult>
{
    public feature(): string {
        return l10nPropertiesFeature;
    }

    public identifier(): string | null {
        return this.result.l10nPropertyName;
    }

    /**
     * Matches both the propertyName and l10nPropertyName properties against criteria.propertyNames.
     * @param criteria 
     * @returns 
     */
    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        if (!this.matchStringCriteria(criteria.propertyNames, this.result.propertyName))
            return false;

        return this.matchStringCriteria(criteria.propertyNames, this.result.l10nPropertyName);
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return [];
    }
}

/**
 * For exploring ConfigErrorResult objects. Their identifier is null
 * and their feature is 'Error'.
 */
class ErrorResultExplorer extends CAExplorerBase<ConfigErrorResult>
{
    public feature(): string {
        return errorFeature;
    }

    public identifier(): string | null {
        return null;
    }

    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return true;
    }

    public children(): Array<ConfigAnalysisResultBase> {
        return [];
    }
}

/**
 * For exploring ValueHostConfigResults objects. Their identifier is the valueHostName property
 * and their feature is 'ValueHost'.
 * They contain several types of children: from properties, validators, and enablerCondition.
 */
class ValueHostConfigResultsExplorer extends CAExplorerBase<ValueHostConfigResults>
{
    public feature(): string {
        return valueHostFeature;
    }

    public identifier(): string | null {
        return this.result.valueHostName;
    }
    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return this.matchStringCriteria(criteria.valueHostNames, this.result.valueHostName);
    }

    public children(): Array<ConfigAnalysisResultBase> {
        let children: Array<ConfigAnalysisResultBase> = [];
        if (this.result.properties)
            children = children.concat(this.result.properties);
        if (this.result.validators)
            children = children.concat(this.result.validators);
        if (this.result.enablerCondition)
            children.push(this.result.enablerCondition);
        return children;
    }
}

/**
 * For exploring ValidatorConfigResults objects. Their identifier is the errorCode property
 * and their feature is 'Validator'.
 * They contain several types of children: from properties and condition.
 */
class ValidatorConfigResultsExplorer extends CAExplorerBase<ValidatorConfigResults>
{
    public feature(): string {
        return validatorFeature;
    }

    public identifier(): string | null {
        return this.result.errorCode;
    }

    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return this.matchStringCriteria(criteria.errorCodes, this.result.errorCode);
    }

    public children(): Array<ConfigAnalysisResultBase> {
        let children: Array<ConfigAnalysisResultBase> = [];
        if (this.result.properties)
            children = children.concat(this.result.properties);

        if (this.result.condition)
            children.push(this.result.condition);
        return children;

    }
}

/**
 * For exploring ConditionConfigResults objects. Their identifier is the conditionType property
 * and their feature is 'Condition'.
 */
class ConditionConfigResultsExplorer extends CAExplorerBase<ConditionConfigResults>
{
    public feature(): string {
        return conditionFeature;
    }

    public identifier(): string | null {
        return this.result.conditionType;
    }

    protected matchWorker(criteria: IConfigAnalysisSearchCriteria): boolean {
        return this.matchStringCriteria(criteria.conditionTypes, this.result.conditionType);
    }

    public children(): Array<ConfigAnalysisResultBase> {
        let children: Array<ConfigAnalysisResultBase> = [];
        if (this.result.properties)
            children = children.concat(this.result.properties);
        let conditionChildren = (this.result as any).children as Array<ConfigAnalysisResultBase>;
        if (conditionChildren)
            children = children.concat(conditionChildren);
        return children;

    }
}

/**
 * A factory for creating the appropriate ConfigResultsExplorer object 
 * for the ConfigResults object based its the feature property.
 */
export class ConfigAnalysisResultsExplorerFactory implements CAExplorerFactory
{
    constructor()
    {
        this._explorers = new Map<string, ExplorerCreatorHandler>();
        this.populate();
    }
    protected populate(): void {
        this.register(lookupKeyFeature, (result) => new LookupKeyInfoExplorer(result as LookupKeyInfo));
        this.register(dataTypeFeature, (result) => new DataTypeLookupKeyServiceInfoExplorer(result as LookupKeyServiceInfoBase));
        this.register(parserServiceFeature, (result) => new ParserLookupKeyServiceInfoExplorer(result as ParserForCultureClassRetrieval));
        this.register(comparerServiceFeature, (result) => new ComparerLookupKeyServiceInfoExplorer(result as ComparerServiceClassRetrieval));
        this.register(converterServiceFeature, (result) => new ConverterLookupKeyServiceInfoExplorer(result as ConverterServiceClassRetrieval));
        this.register(formatterServiceFeature, (result) => new FormatterLookupKeyServiceInfoExplorer(result as FormatterServiceClassRetrieval));
        this.register(identifierServiceFeature, (result) => new IdentifierLookupKeyServiceInfoExplorer(result as IdentifierServiceClassRetrieval));
        this.register(propertyNameFeature, (result) => new PropertyResultExplorer(result as ConfigPropertyResult));
        this.register(l10nPropertiesFeature, (result) => new LocalizedPropertyResultExplorer(result as LocalizedPropertyResult));
        this.register(errorFeature, (result) => new ErrorResultExplorer(result as ConfigErrorResult));
        this.register(valueHostFeature, (result) => new ValueHostConfigResultsExplorer(result as ValueHostConfigResults));
        this.register(validatorFeature, (result) => new ValidatorConfigResultsExplorer(result as ValidatorConfigResults));
        this.register(conditionFeature, (result) => new ConditionConfigResultsExplorer(result as ConditionConfigResults));
    }
    /**
     * Create the appropriate ConfigResultsExplorer object for the ConfigResults object based on the feature.
     * It is a factory method that creates the object from the functions registered with 
     * registerConfigResultsExplorer().
     * @param configResult 
     * @returns A new ConfigResultsExplorer object assigned to the configResult object.
     */
    public create(configResult: ConfigAnalysisResultBase): ICAExplorerBase<ConfigAnalysisResultBase> {
        let fn = this._explorers.get(configResult.feature);
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
    public register(feature: string, explorerCreator: ExplorerCreatorHandler): void {
        this._explorers.set(feature, explorerCreator);
    }
    private _explorers: Map<string, ExplorerCreatorHandler>;
}