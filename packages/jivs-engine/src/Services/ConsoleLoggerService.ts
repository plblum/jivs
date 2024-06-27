/**
 * Concrete implemenation of ILogger that provides logging to the Console.
 * @module Services/ConcreteClasses/LoggerService
 */
import { ILoggerService, LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { ServiceBase } from './ServiceBase';


/**
 * Concrete implemenation of ILogger that provides logging to the Console. This is the default logger.
 * If you want to log both to the console and another system, create both loggers,
 * passing the other into this constructor.
 */
export class ConsoleLoggerService extends ServiceBase implements ILoggerService
{
/**
 * Constructor
 * @param minLevel - defaults to Warn
 * @param mainLogger - Reference to another ILogger implementation
   that gets called after the console's logging.
 */    
    constructor(minLevel: LoggingLevel = LoggingLevel.Warn, mainLogger?: ILoggerService)
    {
        super();
        this._minLevel = minLevel;
        this._mainLogger = mainLogger ?? null;
    }
/**
 * Control which levels are output.
 */    
    private _minLevel = LoggingLevel.Warn;
    public get minLevel(): LoggingLevel
    {
        return this._minLevel;
    }
    public set minLevel(level: LoggingLevel)
    {
        this._minLevel = level;
    }

    /**
     * Reference to another ILogger implementation
     * that gets called after the console's logging.
     * Optional.
     */
    public get mainLogger(): ILoggerService | null
    {
        return this._mainLogger;
    }
    private readonly _mainLogger: ILoggerService | null;
    /**
     * Create a new log entry.
     * @param message
     * @param level - One of these: 'info', 'warn', 'error'.
     * @param category - optional string used by logger to categorize the data.
     * @param source - A way to identify the source of this message, such as function name or class name + method name.
     */
    public log(message: string, level: LoggingLevel, category?: LoggingCategory, source?: string): void {
        if (this.minLevel > level)
            return;
        let msgTemplate = '%s %s "%s"'; // expects source, category, message
        if (!source)
            source = 'Source unspecified';
        if (!category)
            category = LoggingCategory.None;
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
            this._mainLogger.log(message, level, category, source);
    }
}

