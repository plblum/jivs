/**
 * Base class for Logger services. This class is abstract and should be extended to provide a concrete implementation.
 * @module Services/AbstractClasses/LoggerServiceBase
 */
import { deepEquals, valueForLog } from '../Utilities/Utilities';
import { ILoggerService, LogDetails, LogErrorDetails, LogOptions, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from '../Interfaces/LoggerService';
import { ServiceBase } from './ServiceBase';


/**
 * Base class for Logger services. This class is abstract and should be extended to provide a concrete implementation.
 */
export abstract class LoggerServiceBase extends ServiceBase implements ILoggerService {
    /**
     * Constructor
     * @param minLevel - defaults to Warn
     * @param chainedLogger - Reference to another ILoggerService implementation
       that gets called after the console's logging.
     */
    constructor(minLevel: LoggingLevel = LoggingLevel.Warn, chainedLogger?: ILoggerService | null) {
        super();
        this._minLevel = minLevel;
        this._chainedLogger = chainedLogger ?? null;
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
     * Will only be called if this logger instance has level >= minLevel
     * or an override. Its own MinLevel will be changed to Debug
     * because this logger expects chainedLogger to output all log entries.
     * However, you can set the minLevel on chainedLogger after this
     * assignment to control what it outputs.
     */
    public get chainedLogger(): ILoggerService | null {
        return this._chainedLogger;
    }
    public set chainedLogger(logger: ILoggerService | null) {
        this._chainedLogger = logger;
        // set the minLevel to Debug because the current
        // instance determines if log requests are run
        // and expects all log entries to be output in chainedLogger.
        if (logger)
            logger.minLevel = LoggingLevel.Debug;
    }
    private _chainedLogger: ILoggerService | null;

    /**
     * User supplied overrides for the minLevel rule.
     */
    protected get overrides(): Array<OverrideMinLevelWhenRule> | null {
        return this._overrides;
    }

    private _overrides: Array<OverrideMinLevelWhenRule> | null = null;

    /**
     * If the log entry matches the criteria, the minimum level is overridden.
     * Note that by adding an entry here, you are turning off lazying loading
     * on error messages, as the lazy load function must be called to 
     * check the criteria.
     * @param overrideWhen 
     */
    public overrideMinLevelWhen(overrideWhen: OverrideMinLevelWhenRule): void {
        if (!this._overrides)
            this._overrides = [];
        this._overrides.push(overrideWhen);
    }

    /**
     * Create a new log entry if the level is at or above the minimum level.
     * The function is only called if the level is at or above the minimum level,
     * avoiding any processing that would be done to create its data.
     * The intent is to be performant when the log level is set to a higher level.
     * @param level 
     * @param gatherFn 
     */
    public log(level: LoggingLevel, gatherFn: logGatheringHandler): void {
        if (this.overrides === null && this.minLevel > level)
            return;
        let logDetails = gatherFn(this.getLogOptions()) as LogDetails;    // this logger does not use the data option
        if (logDetails.type && typeof logDetails.type !== 'string')
            logDetails.type = valueForLog(logDetails.type); // convert to string

        if (this.minLevel > level && !this.matchToOverrides(level, logDetails))
            return;

        this.writeLog(level, logDetails);
        if (this._chainedLogger)
            this._chainedLogger.log(level, gatherFn);
    }

    /**
      * Looks through all overrideMinLevelWhens in order found. 
      * If overrideMinLevelWhen contain all matching values, it is a match and
      * true is returned.
      * @param logLevel - the log level to match.
      * @param logDetails - the log details to match.
      * @returns true if a match is found, false if no match is found.
      */
    protected matchToOverrides(logLevel: LoggingLevel, logDetails: LogDetails): boolean {
        function toRegExp(param: RegExp | string | Function | object | null | undefined): RegExp | null {
            if (param == null)  // supports both null and undefined
                return null;
            if (param instanceof RegExp)
                return param;
            if (typeof param === 'string')
                return new RegExp(param, 'i');

            if (typeof param === 'function')
                return new RegExp('^' + (param.name ? param.name : param.constructor.name) + '$');

            if (param.constructor !== undefined && param.constructor.name !== undefined)
                return new RegExp('^' + param.constructor.name + '$');

            return null;
        }
        function check(overrideWhenValue: any, logDetailsValue: any): boolean {
            if (overrideWhenValue != null) { // null or undefined
                if (logDetailsValue == null) // null or undefined
                    return false;

                let re = toRegExp(overrideWhenValue);
                if (!re!.test(logDetailsValue))
                    return false;
            }
            return true;
        }
        if (this.overrides === null)
            return true;

        for (let test of this.overrides) {
            if ((test.level != null) && (test.level !== logLevel))
                continue;
            if ((test.category != null) && (test.category !== logDetails.category))
                continue;
            if (!check(test.message, logDetails.message))
                continue;
            if (!check(test.type, logDetails.type))
                continue;
            if (!check(test.feature, logDetails.feature))
                continue;
            if (!check(test.identity, logDetails.identity))
                continue;

            if (test.data) {
                if (!logDetails.data)
                    continue;
                let match = true;
                for (let key in test.data) {
                    if (logDetails.data.hasOwnProperty(key)) {
                        if (!deepEquals((test.data as any)[key], (logDetails.data as any)[key])) {
                            match = false;
                            break;
                        }
                    }
                    else    // captured did not contain the property requested
                        match = false;
                }
                if (!match)
                    continue;
            }
            else if (test.hasData !== undefined) {
                if (test.hasData) {
                    if (!logDetails.data)
                        continue;
                }
                else if (logDetails.data)
                    continue;
            }

            return true;    // this is a match
        }
        return false;
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
    if(logDetails.type && typeof logDetails.type !== 'string')
    logDetails.type = valueForLog(logDetails.type); // convert to string

    logDetails.message = error.message;
    logDetails.category = LoggingCategory.Exception;
    if(this.showStack && error.stack)
            (logDetails as LogErrorDetails).stack = error.stack.split('\n');

this.writeLog(LoggingLevel.Error, logDetails);

if (this._chainedLogger)
    this._chainedLogger.logError(error, gatherFn);
    }
}

/**
* Add these to LoggerServiceBase with overrideMinLevelWhen() 
* to override the minLevel rule, and include
* a log entry based on a variety of characteristics.
* Each instance must match all properties that are assigned.
* There are helpful tools, like regexp matching on strings
* and where you enter a string, not a regexp, it is a case insensitive match.
*/
export interface OverrideMinLevelWhenRule {
    /**
     * If assigned, look at the message.
     * As a string, it will be a case insensitive contained in the string.
     * Using a regexp, you can match the entire string or use case sensitivity.
     */
    message?: RegExp | string;
    /**
     * If assigned, look at the level. It must be an exact match, not
     * this level and all higher levels.
     */
    level?: LoggingLevel;
    /**
     * If assigned, look at the category. It must be an exact match.
     */
    category?: LoggingCategory;

    /**
     * If assigned, look at the type.
     * As a string, it will be a case insensitive contained in the string.
     * Using a regexp, you can match the entire string or use case sensitivity.
     * It can also be the class Type, such as InputValueHost (the class itself, not a string).
     */
    type?: RegExp | string | Function;
    /**
     * If assigned, look at the feature field.
     * As a string, it will be a case insensitive contained in the string.
     * Using a regexp, you can match the entire string or use case sensitivity.
     */
    feature?: RegExp | string;
    /**
     * If assigned, look at the identity field.
     * As a string, it will be a case insensitive contained in the string.
     * Using a regexp, you can match the entire string or use case sensitivity.
     */
    identity?: RegExp | string;
    /**
     * If assigned, look at the data field.
     * When true, only return those with data property assigned.
     * When false, omit those with data property assigned.
     * undefined means ignore this filter.
     */
    hasData?: boolean;
    /**
     * Assign to an object to match to the data.
     * The object can have a subset of properties to match.
     * The values must be exact matches.
     * When assigned, hasData is ignored as the data property must be assigned.
     */
    data?: { [key: string]: any};
}