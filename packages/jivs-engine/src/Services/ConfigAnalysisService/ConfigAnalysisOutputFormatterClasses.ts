/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { IConfigAnalysisOutputFormatter, CAPathedResult, IConfigAnalysisResultsExplorer, IConfigAnalysisResults } from "../../Interfaces/ConfigAnalysisService";
import { deepClone, deepCleanForJson } from "../../Utilities/Utilities";

/**
 * Builds an object that contains up to all 3 result objects, each a property declared
 * if the object is not null. The object is then converted to a JSON string.
 * The user can supply formatting rules to the JSON.stringify() function in the constructor.
 */
export abstract class ConfigAnalysisOutputFormatterBase implements IConfigAnalysisOutputFormatter {

    constructor(includeAnalysisResults: boolean) {
        this._includeAnalysisResults = includeAnalysisResults;

    }

    /**
     * If true, the IConfigAnalysisResultsExplorer.results property is included in the output.
     */
    public get includeAnalysisResults(): boolean {
        return this._includeAnalysisResults;
    }
    private _includeAnalysisResults: boolean;

    public abstract format(valueHostQueryResults: Array<CAPathedResult<any>> | null,
        lookupKeyQueryResults: Array<CAPathedResult<any>> | null,
        explorer: IConfigAnalysisResultsExplorer): any;
    
    /**
     * Creates an object with clones of the results, if they are not null.
     * Includes the raw results, IConfigAnalysisResults, in the results property.
     * It may clean up those objects to remove any functions or other non-JSON-serializable objects.
     * @param valueHostQueryResults 
     * @param lookupKeyQueryResults 
     * @param explorer 
     * @returns 
     */
    protected intoObject(valueHostQueryResults: Array<CAPathedResult<any>> | null,
        lookupKeyQueryResults: Array<CAPathedResult<any>> | null,
        explorer: IConfigAnalysisResultsExplorer): {
            valueHostQueryResults?: Array<CAPathedResult<any>>,
            lookupKeyQueryResults?: Array<CAPathedResult<any>>,
            results?: IConfigAnalysisResults
        }
    {
        let obj: any = {};
        if (valueHostQueryResults)
            obj.valueHostQueryResults = deepClone(valueHostQueryResults);
        if (lookupKeyQueryResults)
            obj.lookupKeyQueryResults = deepClone(lookupKeyQueryResults);
        if (this.includeAnalysisResults)
            obj.results = deepClone(explorer.results);
        return obj;
    }
}


/**
 * Builds an object that contains up to all 3 result objects, each a property declared
 * if the object is not null. The object is then converted to a JSON string.
 * The user can supply formatting rules to the JSON.stringify() function in the constructor.
 */
export class JsonConfigAnalysisOutputFormatter extends ConfigAnalysisOutputFormatterBase {
    constructor(includeAnalysisResults: boolean, space: string | number = 4) {
        super(includeAnalysisResults);
        this._space = space;
    }
    /**
     * The number of spaces to use for indentation in the JSON string.
     * Used by JSON.stringify() in its third parameter.
     * Defaults to 4.
     */
    public get space(): string | number {
        return this._space;
    }
    private _space: string | number = 4;

    /**
     * Uses JSON.stringify() to convert the object into a JSON string.
     * @param valueHostQueryResults 
     * @param lookupKeyQueryResults 
     * @param explorer 
     * @returns JSON.
     */
    public format(valueHostQueryResults: Array<CAPathedResult<any>> | null,
        lookupKeyQueryResults: Array<CAPathedResult<any>> | null,
        explorer: IConfigAnalysisResultsExplorer): any
    {
        let obj = this.intoObject(valueHostQueryResults, lookupKeyQueryResults, explorer);
    // expects obj to be a clone of originals so we can modify them with a deep clean
        obj = deepCleanForJson(obj);
        return JSON.stringify(obj, null, this.space);
    }
}
/**
 * Builds an object that contains up to all 3 result objects.
 * It targets delivery systems that work from the objects.
 * The results are run through a deepCleanForJson() function to replace functions,
 * dates, and regexp with string notes and deletes other properties that contain non-JSON-serializable objects.
 */
export class CleanedObjectConfigAnalysisOutputFormatter extends ConfigAnalysisOutputFormatterBase {
    constructor(includeAnalysisResults: boolean) {
        super(includeAnalysisResults);
    }   
    /**
     * Returns the object with all functions removed.
     * @param valueHostQueryResults 
     * @param lookupKeyQueryResults 
     * @param explorer 
     * @returns 
     */
    public format(valueHostQueryResults: Array<CAPathedResult<any>> | null,
        lookupKeyQueryResults: Array<CAPathedResult<any>> | null,
        explorer: IConfigAnalysisResultsExplorer): any
    {
        let obj = this.intoObject(valueHostQueryResults, lookupKeyQueryResults, explorer);
        return deepCleanForJson(obj);
    }
}