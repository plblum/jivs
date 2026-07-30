/**
 * @module jivs-configanalysis/Explorer/AbstractClasses
 */

import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { deepClone } from '@plblum/jivs-engine/build/Utilities/Utilities';
import { ICAExplorerBase, ICAExplorerFactory, ICASearcher } from '../Types/Explorer';
import { CAPathedResult, CAResultBase, CAResultPath } from '../Types/ConfigAnalysisResults';


/**
 * For building an object that can handle a specific type of configuration object based
 * on the feature property. These classes are registered with the ConfigAnalysisResultsExplorer
 * and are created in a factory approach based on the config result object.
 */

export abstract class CAExplorerBase<T extends CAResultBase> implements ICAExplorerBase<T>
{
    constructor(result: T)
    {
        assertNotNull(result, 'result');
        this._result = result;
    }
    private readonly _result: T;

    /**
     * Gets the result of the configuration analysis, which is an object structure
     * with data from Configuration objects in valueHostResults,
     * and data from Lookup Keys and their associated services in lookupKeyResults.
     * @returns The result of the configuration analysis.
     */
    public get result(): T
    {
        return this._result;
    }

    /**
     * A fixed value representing the only feature string that is supported by this class.
     * Each CAResultBase object has a feature property that is matched to this one.
     */
    public abstract feature(): string;

    /**
     * Provides a way to identify the specific instance of this object.
     * Example values are valueHostName, lookupKey, errorCode, conditionType, or the property name of a config object.
     * These are used to build a path to the object in the configuration.
     * It is null when the feature lacks some useful identifer.
     * This value, together with feature(), are used to build a path to the
     * associated CAResultBase object. It is used in the path even if null.
     */
    public abstract identifier(): string | null;

    /**
     * Creates this element's entry into the CAPathedResult.path.
     * The path is built from feature() and identifier().
     * Note that Identifier can be null.
     * Tt is possible to have duplicate feature entries, especially
     * when conditions have their own child conditions. In that case, the feature
     * is repeated with a number appended to it after the first.
     * For example, "Condition#2", "Condition#3".
     * @returns
     */
    protected addPathElement(path: CAResultPath): void
    {
        const baseFeature = this.feature();
        let feature = baseFeature;
        const identifier = this.identifier();
        let count = 1;
        while (path[feature] !== undefined)
        {
            count++;
            feature = `${ baseFeature }#${ count }`;
        }
        path[feature] = identifier;
    }

    /**
     * Determines if the result matches the criteria.
     * It does not evaluate any children of the result.
     *
     * To match, all assigned criteria must match SO LONG AS
     * it is applicable to the object being evaluated.
     * For example, when the feature is 'LookupKey', the lookupKeys criteria is used.
     *
     * @param searcher - A search tool with criteria to match against.
     * @returns True if the result matches the all applicable criteria,
     * false if it does not match at least one of the applicible criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchThis(searcher: ICASearcher): boolean | undefined
    {
        if (!searcher || searcher.allMatch)
            return true;
        const fResult = this.matchFeature(searcher);
        if (fResult === false)
            return false;
        const sResult = this.matchSeverity(searcher);
        if (sResult === false)
            return false;
        const wResult = this.matchThisWorker(searcher);
        if (wResult === false)
            return false;
        if (fResult === undefined && sResult === undefined && wResult === undefined)
            return undefined;
        // Because we return when false is found above,
        // we only have true and undefined left. That means the result is true.
        return true;
    }

    protected matchFeature(searcher: ICASearcher): boolean | undefined
    {
        return searcher.matchFeature(this.feature());
    }
    protected matchSeverity(searcher: ICASearcher): boolean | undefined
    {
        return searcher.matchSeverity((this.result as any).severity);
    }


    /**
     * Provides a way for subclasses to extend the match method to include their own criteria.
     * Note that the matchThis() method has already handled criteria = null
     * and these criteria members: features, severities.
     * @param searcher - A search tool with criteria to match against.
     * @returns True if the result matches the all applicable criteria,
     * false if it does not match at least one of the applicible criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    protected abstract matchThisWorker(searcher: ICASearcher): boolean | undefined;


    /**
     * Returns true if it finds one ConfigResults object that matches the criteria
     * amongst itself and all of its children.
     * It differs from collect() in that it evaluates all children,
     * and stops upon finding the first match.
     * NOTE: Expects all strings in the criteria to be lowercase already.
     * @param searcher - A search tool with criteria to match against.
     * @param factory - The factory to create entries going into matches.
     */
    public hasMatch(searcher: ICASearcher, factory: ICAExplorerFactory): boolean
    {
        return this.findOne(searcher, factory) !== null;
    }

    /**
     * Returns the first ConfigResults object that matches the criteria
     * amongst itself and all of its children.
     * @param searcher
     * @param factory
     * @param path Collects feature/identifier pairs to form the path to this object.
     * @returns The first ConfigResults object that matches the criteria,
     * or null if no match is found.
     */
    public findOne(searcher: ICASearcher, factory: ICAExplorerFactory,
        path: CAResultPath = {}): CAPathedResult<CAResultBase> | null
    {
        const newPath = deepClone(path);
        this.addPathElement(newPath);

        const match = this.matchThis(searcher);
        if (match)
            return { path: newPath, result: this.result };

        if (match !== false || !searcher.skipChildrenIfParentMismatch)
            for (const child of this.children())
            {
                const childExplorer = factory.create(child);
                const result = childExplorer.findOne(searcher, factory, newPath);
                if (result !== null)
                    return result;
            }
        return null;
    }


    /**
     * Using match on itself and its children, collect all results that match the criteria
     * into the matches array.
     * Only includes the children if this object matches the criteria or the criteria
     * was not applicable to this object.
     * @param searcher - a search tool with criteria to match against.
     * @param matches - Where to add any generated CAPathedResult objects.
     * @param path The feature + identifier from each parent object to this object. When this calls a child,
     * it creates a new path from this plus its own identifier. Nothing is added if the identifier is null.
     * @param factory The factory to create entries going into matches.
     */
    public collect(searcher: ICASearcher, matches: Array<CAPathedResult<T>>,
        path: CAResultPath,
        factory: ICAExplorerFactory): void
    {
        const newPath = deepClone(path);
        this.addPathElement(newPath);

        const match = this.matchThis(searcher);
        if (match === true)
        {
            matches.push({ path: newPath, result: this.result });
        }
        if (match !== false || !searcher.skipChildrenIfParentMismatch)
            this.children().forEach((child) =>
            {
                const childExplorer = factory.create(child);
                childExplorer.collect(searcher, matches, newPath, factory);
            });
    }

    /**
     * Return a list of all children of the result that match the criteria
     * or [] if no children are available.
     */
    public abstract children(): Array<CAResultBase>;

}
