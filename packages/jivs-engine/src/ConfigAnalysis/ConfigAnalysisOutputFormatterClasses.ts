/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { IConfigAnalysisOutputFormatter, ConfigAnalysisOutputReportData } from "../Interfaces/ConfigAnalysisService";
import { deepCleanForJson, deepClone } from "../Utilities/Utilities";

/**
 * Builds an object that contains up to all 3 result objects, each a property declared
 * if the object is not null. The object is then converted to a JSON string.
 * The user can supply formatting rules to the JSON.stringify() function in the constructor.
 */
export abstract class ConfigAnalysisOutputFormatterBase implements IConfigAnalysisOutputFormatter {

    constructor() {
    }

    /**
     * Returns a formatted version of the results of the configuration analysis
     * based on which properties are present in the report.
     * @param reportData - The results of the configuration analysis.
     */
    public abstract format(reportData: ConfigAnalysisOutputReportData): any;
}


/**
 * Builds an object that contains up to all 3 result objects, each a property declared
 * if the object is not null. The object is then converted to a JSON string.
 * The user can supply formatting rules to the JSON.stringify() function in the constructor.
 */
export class JsonConfigAnalysisOutputFormatter extends ConfigAnalysisOutputFormatterBase {
    constructor(space: string | number = 4) {
        super();
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
     * Uses JSON.stringify() to convert the reportData into a JSON string.
     * @param reportData - The data to be formatted.
     * @returns JSON.
     */
    public format(reportData: ConfigAnalysisOutputReportData): any
    {
        let cleaned = deepCleanForJson(deepClone(reportData));
        return JSON.stringify(cleaned, null, this.space);
    }
}
/**
 * Builds an object that contains up to all 3 result objects.
 * It targets delivery systems that work from the objects.
 * The results are run through a deepCleanForJson() function to replace functions,
 * dates, and regexp with string notes and deletes other properties that contain non-JSON-serializable objects.
 */
export class CleanedObjectConfigAnalysisOutputFormatter extends ConfigAnalysisOutputFormatterBase {
    /**
     * Returns the object based on reportData.
     * @returns an object with dates, regexp, and functions replaced with string notes
     * and other non-JSON-serializable objects removed.
     */
    public format(reportData: ConfigAnalysisOutputReportData): any
    {
        return deepCleanForJson(deepClone(reportData)); 
    }
}