/**
 * Concrete implemenation of ILogger that provides logging to the Console.
 * @module Services/ConcreteClasses/LoggerService
 */
import { LogDetails, LogOptions, LoggingLevel } from '../Interfaces/LoggerService';
import { LoggerServiceBase } from './LoggerServiceBase';


/**
 * Concrete implemenation of ILogger that provides logging to the Console. This is the default logger.
 * If you want to log both to the console and another system, create both loggers,
 * passing the other into this constructor.
 */
export class ConsoleLoggerService extends LoggerServiceBase
{
/**
 * When true, add the additional details that document the results
 * of functions as individual JSON properties.
 * Often the same values are already in the message itself.
 * The values will appear under the 'data' property.
 */
    public get includeData(): boolean
    {
        return this._includeDetails;
    }
    public set includeData(value: boolean)
    {
        this._includeDetails = value;
    }
    private _includeDetails: boolean = false;

    /**
     * Supplies the logOptions used in the callbacks.
     */
    protected getLogOptions(): LogOptions | undefined
    {
        if (this.includeData)
            return { includeData: true };
        return undefined;
    }
    /**
     * Uses the JSON formatting capability of console.log to output the logDetails.
     * Expect to see the logDetails in the console in JSON.
     * @param level 
     * @param logDetails 
     */
    protected writeLog(level: LoggingLevel, logDetails: LogDetails): void {
        // the current formatting is JSON from the logDetails
        switch (level) {
            case LoggingLevel.Debug:
                console.debug(logDetails);
                break;
            case LoggingLevel.Info:
                console.log(logDetails);
                break;
            case LoggingLevel.Warn:
                console.warn(logDetails);
                break;
            case LoggingLevel.Error:
                console.error(logDetails);
                break;
        }
    }

}

