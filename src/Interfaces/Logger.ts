/**
 * Provide a logging service for this library to report into.
 * It provides one such logger class, ConsoleLogger, which works with the JavaScript console object.
 * Use your own logger by implementating the ILogger interface.
 * Assign your class to {@link ValidationServices/Interfaces!IValidationServices | IValidationServices }
 * @module Logger/Interfaces
 */

/**
 * Provide a logging service for this system to report into.
 * Attach an instance to ValidationServices.LoggerService.
 */
export interface ILogger
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
    log(message: string, level: LoggingLevel, category?: string, source?: string): void;
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
    Debug = 'Debug',
    Info = 'Info',
    Configuration = 'Configuration',
    TypeMismatch = 'Type Mismatch',
    Formatting = 'Formatting',
    Validation = 'Validation',
    LookupKey = 'LookupKey',
    Compare = 'Compare'
}

