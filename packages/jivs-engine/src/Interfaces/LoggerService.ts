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
     * Create a new log entry.
     * @param message
     * @param level - One of these: 'info', 'warn', 'error'.
     * @param category - optional string used by logger to categorize the data.
     * @param source - A way to identify the source of this message, such as function name or class name + method name.
     */
    log(message: string, level: LoggingLevel, category?: LoggingCategory, source?: string): void;
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

