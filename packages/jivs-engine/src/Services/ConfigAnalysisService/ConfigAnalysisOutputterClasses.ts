/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { IConfigAnalysisOutputter, IConfigAnalysisOutputFormatter, CAPathedResult, IConfigAnalysisResultsExplorer } from "../../Interfaces/ConfigAnalysisService";
import { ILoggerService, LogDetails, LoggingCategory, LoggingLevel } from "../../Interfaces/LoggerService";
import { assertNotNull, CodingError } from "../../Utilities/ErrorHandling";

/**
 * Base class that converts the results of the configuration analysis into a specific format
 * and output them. Suggested implementations:
 * - To console as the object itself
 * - To console as a JSON string
 * - To LocalStorage as a JSON string
 * - To the ILoggerService as a JSON string
 * These can build a well formatted string, such as a full HTML page to appear as a report.
 */
export abstract class ConfigAnalysisOutputterBase implements IConfigAnalysisOutputter
{
    constructor(formatter: IConfigAnalysisOutputFormatter) {
        assertNotNull(formatter, 'formatter');
        this._formatter = formatter;
    }
    protected get formatter(): IConfigAnalysisOutputFormatter {
        return this._formatter;
    }
    private _formatter: IConfigAnalysisOutputFormatter;
    /**
     * Entry point for the outputter. It builds the output from the results
     * and sends it to the appropriate destination.
     * It has available all the results of the configuration analysis.
     * @param valueHostQueryResults - Results of queries against the ValueHostResults array or null if not used.
     * @param lookupKeyQueryResults - Results of queries against the LookupKeyResults array or null if not used.
     * @param explorer - Its results property has the results of the configuration analysis. 
     * @returns The built output. The caller will return it.
     */
    public send(valueHostQueryResults: Array<CAPathedResult<any>> | null, lookupKeyQueryResults: Array<CAPathedResult<any>> | null,
        explorer: IConfigAnalysisResultsExplorer): any
    {
        let content = this.format(valueHostQueryResults, lookupKeyQueryResults, explorer);
        this.output(content);
        return content;
    }

    /**
     * Applies formatting to the results of the configuration analysis.
     * It often returns a well formatted string.
     * It can actually retain the original objects, or return new objects from the original.
     * Whatever it returns must be compatible with the output() function.
     * This class redirects the work to the IConfigAnalysisOutputFormatter object.
     * @param valueHostQueryResults - Results of queries against the ValueHostResults array or null if not used.
     * @param lookupKeyQueryResults - Results of queries against the LookupKeyResults array or null if not used.
     * @param explorer - Its results property has the results of the configuration analysis. 
     */
    protected format(valueHostQueryResults: Array<CAPathedResult<any>> | null, lookupKeyQueryResults: Array<CAPathedResult<any>> | null, explorer: IConfigAnalysisResultsExplorer): any
    {
        return this.formatter.format(valueHostQueryResults, lookupKeyQueryResults, explorer);
    }

    /**
     * Takes the formatted content and sends it to the appropriate destination.
     * @param content 
     */
    protected abstract output(content: any): void;
}

/**
 * This class works with either a plain object or a string, delivering either to the console.log() function.
 * console.log() already knows how to handle a plain object, providing a UI to drill down into the object.
 * This class expects the formatting to come through the IConfigAnalysisOutputFormatter object.
 */
export class ConsoleConfigAnalysisOutputter extends ConfigAnalysisOutputterBase
{
    /**
     * To console.log()
     * @param content 
     */
    protected output(content: any): void {
        console.log(content);
    }
}

/**
 * This class works with a string, delivering it to LocalStorage.
 * LocalStorage requires a key, which must be provided in the constructor.
 * The key may have a "#" at the end, intended to be replaced by a timestamp in this format: yyyy-MM-dd HH:mm:ss.
 * This class expects the formatting to come through the IConfigAnalysisOutputFormatter object.
 */
export class LocalStorageConfigAnalysisOutputter extends ConfigAnalysisOutputterBase
{
    constructor(formatter: IConfigAnalysisOutputFormatter, key: string) {
        super(formatter);
        assertNotNull(key, 'key');
        if (globalThis.localStorage === undefined)
            throw new CodingError('LocalStorageConfigAnalysisOutputter requires the globalThis.localStorage object to be defined.');
        this._key = key;
    }
    /**
     * The key used to store the content in LocalStorage.
     * It may have a "#" at the end, intended to be replaced by a timestamp in this format: yyyy-MM-dd HH:mm:ss.
     */
    public get key(): string {
        return this._key;
    }
    private _key: string;
    /**
     * Uses localStorage.setItem() to store the content.
     * The key was provided in the constructor.
     * If it has a "#" at the end, it is replaced by a timestamp in this format: yyyy-MM-dd HH:mm:ss.
     * @param content 
     */
    protected output(content: any): void {
        if (typeof content !== 'string')
            throw new CodingError('LocalStorageConfigAnalysisOutputter requires content to be a string.');
        let key = this.key;
        if (key.endsWith('#'))
        {
            let now = new Date();
            key = key.replace('#', now.toISOString());
        }
        localStorage.setItem(key, content);
    }

}

/**
 * This class works with a string, delivering it to the ILoggerService object 
 * supplied in the constructor.
 * It allows for rich delivery of the content through whatever implementation
 * of ILoggerService is provided.
 */
export class LoggerConfigAnalysisOutputter extends ConfigAnalysisOutputterBase
{
    constructor(formatter: IConfigAnalysisOutputFormatter, loggerService: ILoggerService) {
        super(formatter);
        assertNotNull(loggerService, 'loggerService');
        this._loggerService = loggerService;
    }
    protected get loggerService(): ILoggerService {
        return this._loggerService;
    }
    private _loggerService: ILoggerService;

    /**
     * The formatted string is wrapped in the LogDetails object
     * which is supported by the ILoggerService object.
     * @param valueHostQueryResults 
     * @param lookupKeyQueryResults 
     * @param explorer 
     */
    protected format(valueHostQueryResults: Array<CAPathedResult<any>> | null, lookupKeyQueryResults: Array<CAPathedResult<any>> | null, explorer: IConfigAnalysisResultsExplorer) {
        let content = super.format(valueHostQueryResults, lookupKeyQueryResults, explorer);
        if (typeof content !== 'string')
            throw new CodingError('LoggerConfigAnalysisOutputter requires content to be a string.');
        return <LogDetails>{
            feature: 'ConfigAnalysisService',
            category: LoggingCategory.Configuration,
            message: content,
            type: 'ConfigAnalysisService',
            data: { valueHostQueryResults, lookupKeyQueryResults, results: explorer.results }

        }
    }

    /**
     * Logs to the ILoggerService object as an Info level object.
     * It will be logged even if the ILoggerService object has a higher MinLevel set.
     * @param content 
     */
    protected output(content: LogDetails): void {
        let savedLevel = this.loggerService.minLevel;
        try {
            this.loggerService.minLevel = LoggingLevel.Info;
            this.loggerService.log(LoggingLevel.Info, (options) => content);
        }
        finally
        {
            this.loggerService.minLevel = savedLevel;
        }
    }    
}
/**
 * For when you don't want to output the results anywhere.
 * The results will still be returned by the send() function.
 * This is useful when you want to get JSON formatted results returned by send().
 */
export class NullConfigAnalysisOutputter extends ConfigAnalysisOutputterBase
{
    protected output(content: any): void {
        return;
    }
}
