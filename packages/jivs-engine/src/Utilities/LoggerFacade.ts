/**
 * LoggerFacade provides a simplified API for logging messages and exceptions.
 * It encapsulates the LoggerService object.
 * @module Utilities
 */

import {
    ILoggerService, LogDetails, LogOptions, LoggingLevel,
    logGatheringErrorHandler, logGatheringHandler
} from "../Interfaces/LoggerService";
import { SevereErrorBase } from "./ErrorHandling";

/**
 * Used by many classes to log different types of messages to the LoggerService.
 * Its API avoids some of the configuration details that are usually parameters
 * passed to the LoggerService.
 * Generally this is a protected property of base classes, where the property name is logger.
 */
export class LoggerFacade
{
    constructor(loggerService: ILoggerService | null, feature: string, type: object | Function | string,
        identity: string | Array<string> | null, rethrowSevereErrors: boolean = true)
    {
        this._loggerService = loggerService;
        this._feature = feature;
        this._type = type;
        this._identity = identity;
        this._rethrowSevereErrors = rethrowSevereErrors;
    }
    private _loggerService: ILoggerService | null;
    protected get loggerService(): ILoggerService | null { return this._loggerService; }
    private _feature: string;
    protected get feature(): string { return this._feature; }
    private _type: object | Function | string;
    protected get type(): object | Function | string { return this._type; }
    private _identity: string | Array<string> | null;
    protected get identity(): string | Array<string> | null { return this._identity; }
    private _rethrowSevereErrors: boolean;
    protected get rethrowSevereErrors(): boolean { return this._rethrowSevereErrors; }
    
    /**
     * Log a message. The message gets assigned the details of feature, type, and identity
     * here.
     */
    public log(level: LoggingLevel, gatherFn: logGatheringHandler): void {
        this.loggerService?.log(level, (options?: LogOptions) => {
            let details = gatherFn(options);
            details.feature = this.feature;
            details.type = this.type;
            if (this.identity)
                details.identity = this.identity;
            return details;
        });
    }

    /**
     * When the log only needs the message and nothing else.
     * @param level 
     * @param messageFn
     */
    public message(level: LoggingLevel, messageFn: ()=> string): void {
        this.log(level, () => {
            return {
                message: messageFn()
            };
        });
    }    
    /**
     * Log an exception. The GatherFn should only be used to gather additional data
     * as the Error object supplies message, category (Exception), and this function
     * resolves feature, type, and identity.
     * @param error 
     * @param gatherFn 
     */
    public error(error: Error, gatherFn?: logGatheringErrorHandler): void
    {
        this.loggerService?.logError(error, (options?: LogOptions) => {
            let details = gatherFn ? gatherFn(options) : <LogDetails>{};
            details.feature = this.feature;
            details.type = this.type;
            if (this.identity)
                details.identity = this.identity;
            return details;
        });
        if (this.rethrowSevereErrors && error instanceof SevereErrorBase)
             throw error;        
    }
}