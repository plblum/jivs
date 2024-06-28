/**
 * Base class for Logger services. This class is abstract and should be extended to provide a concrete implementation.
 * @module Services/AbstractClasses/LoggerServiceBase
 */
import { valueForLog } from '../Utilities/Utilities';
import { ILoggerService, LogDetails, LogErrorDetails, LogOptions, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from '../Interfaces/LoggerService';
import { ServiceBase } from './ServiceBase';


/**
 * Base class for Logger services. This class is abstract and should be extended to provide a concrete implementation.
 */
export abstract class LoggerServiceBase extends ServiceBase implements ILoggerService {
    /**
     * Constructor
     * @param minLevel - defaults to Warn
     * @param mainLogger - Reference to another ILoggerService implementation
       that gets called after the console's logging.
     */
    constructor(minLevel: LoggingLevel = LoggingLevel.Warn, mainLogger?: ILoggerService) {
        super();
        this._minLevel = minLevel;
        this._mainLogger = mainLogger ?? null;
    }
    /**
     * Control which levels are output.
     */
    public get minLevel(): LoggingLevel {
        return this._minLevel;
    }
    public set minLevel(level: LoggingLevel) {
        this._minLevel = level;
    }
    private _minLevel = LoggingLevel.Warn;

    /**
     * When true, logError() adds the call stack taken from the Error object.
     * Defaults to false.
     */
    public get showStack(): boolean {
        return this._showStack;
    }
    public set showStack(value: boolean) {
        this._showStack = value;
    }
    private _showStack: boolean = false;

    /**
     * Reference to another ILogger implementation
     * that gets called after the console's logging.
     * Optional.
     * Will only be called if this logger instance has level >= minLevel.
     */
    public get mainLogger(): ILoggerService | null {
        return this._mainLogger;
    }
    public set mainLogger(logger: ILoggerService | null) {
        this._mainLogger = logger;
    } 
    private _mainLogger: ILoggerService | null;

    /**
     * Create a new log entry if the level is at or above the minimum level.
     * The function is only called if the level is at or above the minimum level,
     * avoiding any processing that would be done to create its data.
     * The intent is to be performant when the log level is set to a higher level.
     * @param level 
     * @param gatherFn 
     */
    public log(level: LoggingLevel, gatherFn: logGatheringHandler): void {
        if (this.minLevel > level)
            return;
        let logDetails = gatherFn(this.getLogOptions()) as LogDetails;    // this logger does not use the data option
        if (logDetails.type && typeof logDetails.type !== 'string')
            logDetails.type = valueForLog(logDetails.type); // convert to string

        this.writeLog(level, logDetails);
        if (this._mainLogger)
            this._mainLogger.log(level, gatherFn);
    }

    /**
     * Supplies the logOptions used in the callbacks.
     */
    protected abstract getLogOptions(): LogOptions | undefined;

    /**
     * Directs the data in logDetails to the actual logging destination.
     * @param level 
     * @param logDetails 
     */
    protected abstract writeLog(level: LoggingLevel, logDetails: LogDetails): void;
    /**
     * Create a new log entry for an error object. It is always added, because the Error object
     * is always LoggingLevel.Error.
     * The Error object has most of the info needed
     * @param error 
     * @param gatherFn 
     */
    public logError(error: Error, gatherFn: logGatheringErrorHandler): void {
        let logDetails = gatherFn(this.getLogOptions()) as LogDetails;    // this logger does not use the data option
        if (logDetails.type && typeof logDetails.type !== 'string')
            logDetails.type = valueForLog(logDetails.type); // convert to string

        logDetails.message = error.message;
        logDetails.category = LoggingCategory.Exception;
        if (this.showStack && error.stack)
            (logDetails as LogErrorDetails).stack = error.stack.split('\n');

        this.writeLog(LoggingLevel.Error, logDetails);

        if (this._mainLogger)
            this._mainLogger.logError(error, gatherFn);
    }
}

