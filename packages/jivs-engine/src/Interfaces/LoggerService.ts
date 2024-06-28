/**
 * Provide a logging service for this library to report into.
 * It provides one such logger class, ConsoleLoggerService, which works with the JavaScript console object.
 * Use your own logger by implementating the ILogger interface.
 * Assign your class to {@link Services/ConcreteClasses/ValidationServices!ValidationServices | ValidationServices }
 * @module Services/Types/ILoggerService
 */

import { IService } from "./Services";

/**
 * Provide a logging service for this system to report into.
 * Attach an instance to ValidationServices.loggerService.
 */
export interface ILoggerService extends IService
{
/**
 * Control which levels are output.
 */        
    minLevel: LoggingLevel;

    /**
     * Create a new log entry if the level is at or above the minimum level.
     * The function is only called if the level is at or above the minimum level,
     * avoiding any processing that would be done to create its data.
     * The intent is to be performant when the log level is set to a higher level.
     * @param level 
     * @param gatherFn 
     */
    log(level: LoggingLevel, gatherFn: logGatheringHandler): void;
/**
 * Create a new log entry for an error object. It is always added, because the Error object
 * is always LoggingLevel.Error.
 * The Error object has most of the info needed
 * @param error 
 * @param gatherFn 
 */
    logError(error: Error, gatherFn: logGatheringErrorHandler): void;
}
/**
 * Used by the log function that all details through the LogDetails object that is supplied
 * by this function. Its options object is only supplied if the LoggerService supports it.
 * 
 */
export type logGatheringHandler = (options?: LogOptions) => LogDetails;

/**
 * Used by the log function that takes an error to gather the value used in the logDetails.data property.
 * Its options object is only supplied if the LoggerService supports it.
 */
export type logGatheringErrorHandler = (options?: LogOptions) => LogErrorDetails;


export interface LogDetailsBase
{
    /**
     * A name for the general feature that uses it:
     * ValueHost, Validator, Condition, Formatter, etc.
     */
    feature?: string;
    /**
     * The object that is the source of the log message. Logging will
     * convert it into source.constructor.name, if available.
     * Alternatively a string as the type of source.
     */
    type?: object | string;
    /**
     * A way to identify the source of this message, such as the ValueHostName or error Code.
     * If there are several sources, create an array. For example, when reporting a 
     * validator's error code, it helps to have the ValueHost too:
     * ['ValueHost', 'ErrorCode']
    */
    identity?: string | Array<string>;
    /**
     * Additional data that the logger can use to take further actions.
     * Only add this if LogOptions.includeData is true and you have data to share.
     * It should be assigned to an object with name/value pairs.
     * Those entries should be published and be consistent throughout the system
     * as other systems are likely to use it.
     */
    data?: object;
}


export interface LogDetails extends LogDetailsBase{
    message: string;
    /**
     * Helps understand the reason for the log message, such as 'Exception', 'Result',
     * 'Configuration', 'TypeMismatch', etc.
     */
    category?: LoggingCategory;

}

/**
 * Used by the log function that takes an Error object. It gets the message from the Error.message
 * and set category to 'Exception'.
 */
export interface LogErrorDetails extends LogDetailsBase {
    stack?: Array<string>;
}


/**
 * The logger service will ask for specific info it supports with this as the argument
 * to the logGatheringHandler. It can be omitted if you don't support any of its options.
 */
export interface LogOptions {
    /**
     * The logger wants to capture names and values of any data that you wish to share.
     * This is used by loggers used for diagnostics, such as the DiagnosticLoggerService.
     * That data will enable the logger to take further actions.
     * When true, the LogDetails.data property should be assigned to an object with name/value pairs.
     * Those entries should be published and be consistent throughout the system.
     */
    includeData: boolean;
}

export enum LoggingLevel
{
    Debug = 0,
    Info = 2,
    Warn = 3,
    Error = 4
}

/**
 * Groups strings recommended for the log function's category property.
 */
export enum LoggingCategory {
    /**
     * No specific category. Generally for debug and info messages.
     */
    None = 'None',
    /**
     * Errors thrown by the system.
     */
    Exception = 'Exception',

    /**
     * Reporting a result. Effectively the same as Info, but contains details on the result.
     */
    Result = 'Result',    
    /**
     * Issue due to a misconfiguration
     */
    Configuration = 'Configuration',
    /**
     * Issue due to supplying the wrong type of data.
     */
    TypeMismatch = 'Type Mismatch'

}

