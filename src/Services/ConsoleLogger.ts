/**
 * Concrete implemenation of ILogger that provides logging to the Console.
 * @module Loggers/ConsoleLogger
 */
import { ILogger, LoggingLevel } from "../Interfaces/Logger";


/**
 * Concrete implemenation of ILogger that provides logging to the Console. This is the default logger.
 * If you want to log both to the console and another system, create both loggers,
 * passing the other into this constructor.
 */
export class ConsoleLogger implements ILogger
{
    constructor(minLevel: LoggingLevel = LoggingLevel.Warn, mainLogger?: ILogger)
    {
        this._minLevel = minLevel;
        this._mainLogger = mainLogger ?? null;
    }
/**
 * Control which levels are output.
 */    
    private _minLevel = LoggingLevel.Warn;
    public get MinLevel(): LoggingLevel
    {
        return this._minLevel;
    }
    public set MinLevel(level: LoggingLevel)
    {
        this._minLevel = level;
    }

    /**
     * Reference to another ILogger implementation
     * that gets called after the console's logging.
     * Optional.
     */
    public get MainLogger(): ILogger | null
    {
        return this._mainLogger;
    }
    private _mainLogger: ILogger | null;
    /**
     * Create a new log entry.
     * @param message
     * @param level - One of these: 'info', 'warn', 'error'.
     * @param category - optional string used by logger to categorize the data.
     * @param source - A way to identify the source of this message, such as function name or class name + method name.
     */
    public Log(message: string, level: LoggingLevel, category?: string, source?: string): void {
        if (this.MinLevel > level)
            return;
        let msgTemplate = '%s %s "%s"'; // expects source, category, message
        if (!source)
            source = 'Source unspecified';
        if (!category)
            category = 'Category unspecified';
        switch (level) {
            case LoggingLevel.Debug:
                console.debug(msgTemplate, source, category, message);
                break;
            case LoggingLevel.Info:
                console.log(msgTemplate, source, category, message);
                break;
            case LoggingLevel.Warn:
                console.warn(msgTemplate, source, category, message);
                break;
            case LoggingLevel.Error:
                console.error(msgTemplate, source, category, message);
                break;
        }
        if (this._mainLogger)
            this._mainLogger.Log(message, level, category, source);
    }
}

