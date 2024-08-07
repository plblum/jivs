import { CleanedObjectConfigAnalysisOutputFormatter, JsonConfigAnalysisOutputFormatter } from './ConfigAnalysisOutputFormatterClasses';
/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { IConfigAnalysisOutputter, IConfigAnalysisOutputFormatter, CAPathedResult, IConfigAnalysisResultsExplorer, ConfigAnalysisOutputReportData } from "../Interfaces/ConfigAnalysisService";
import { ILoggerService, LogDetails, LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { assertNotNull, CodingError } from "../Utilities/ErrorHandling";

/**
 * Base class that converts the results of the configuration analysis into a specific format
 * and output them. Suggested implementations:
 * - To console as the object itself
 * - To console as a JSON string
 * - To the ILoggerService as a JSON string
 * These can build a well formatted string, such as a full HTML page to appear as a report.
 */
export abstract class ConfigAnalysisOutputterBase implements IConfigAnalysisOutputter
{
    /**
     * 
     * @param formatter - The formatter that will be used to format the results.
     * When you don't provide a formatter, it will default to JsonConfigAnalysisOutputFormatter.
     */
    constructor(formatter?: IConfigAnalysisOutputFormatter | null) {
        this._formatter = formatter ?? new JsonConfigAnalysisOutputFormatter();
    }
    /**
     * The formatter that will be used to format the results of the 
     * configuration analysis. Set through the constructor.
     * NOTE: This is not in the IConfigAnalysisOutputter interface
     * because we don't want to require the use of a formatter
     * in any custom implementations of IConfigAnalysisOutputter.
     */
    public get formatter(): IConfigAnalysisOutputFormatter {
        return this._formatter;
    }
    private _formatter: IConfigAnalysisOutputFormatter;
    /**
     * Entry point for the outputter. It builds the output from the results
     * and sends it to the appropriate destination.
     * It has available all the results of the configuration analysis.
     * @param reportData - The data to be output.
     * @returns The built output. The caller will return it.
     */
    public send(reportData: ConfigAnalysisOutputReportData): any
    {
        let content = this.format(reportData);
        this.output(content);
        return content;
    }

    /**
     * Applies formatting to the results of the configuration analysis.
     * It often returns a well formatted string.
     * It can actually retain the original objects, or return new objects from the original.
     * Whatever it returns must be compatible with the output() function.
     * This class redirects the work to the IConfigAnalysisOutputFormatter object.
     * @param reportData - The data to be formatted.
     */
    protected format(reportData: ConfigAnalysisOutputReportData): any
    {
        return this.formatter.format(reportData);
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
     * 
     * @param formatter - The formatter that will be used to format the results.
     * We recommend either JsonConfigAnalysisOutputFormatter or 
     * CleanedObjectConfigAnalysisOutputFormatter. JSON to console is nice
     * but when you pass an object to console.log(), it provides a UI to drill down into the object.
     * CleanedObjectConfigAnalysisOutputFormatter is a good choice for that.
     * If you don't provide a formatter, it will default to CleanedObjectConfigAnalysisOutputFormatter.
     */
    constructor(formatter?: IConfigAnalysisOutputFormatter | null) {
        super(formatter ?? new CleanedObjectConfigAnalysisOutputFormatter());
    }
    /**
     * To console.log()
     * @param content 
     */
    protected output(content: any): void {
        console.log(content);
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
    constructor(formatter: IConfigAnalysisOutputFormatter | null, loggerService: ILoggerService) {
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
     * @param reportData - The data to be formatted.
     */
    protected format(reportData: ConfigAnalysisOutputReportData) {
        let content = super.format(reportData);
        if (typeof content !== 'string')
            throw new CodingError('LoggerConfigAnalysisOutputter requires content to be a string.');
        return <LogDetails>{
            feature: 'ConfigAnalysisService',
            category: LoggingCategory.Configuration,
            message: content,
            type: 'ConfigAnalysisService',
            data: reportData

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
