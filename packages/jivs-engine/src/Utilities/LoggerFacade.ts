/**
 * LoggerFacade provides a simplified API for logging messages and exceptions.
 * It encapsulates the LoggingService object.
 * @module jivs-engine/Utilities
 */

import {
    ILoggingService, LogDetails, LogOptions, LoggingLevel,
    logGatheringErrorHandler, logGatheringHandler
} from '../Interfaces/LoggingService';
import { SevereErrorBase } from './ErrorHandling';

/**
 * Used by many classes to log different types of messages to the LoggingService.
 * Its API avoids some of the configuration details that are usually parameters
 * passed to the LoggingService.
 * Generally this is a protected property of base classes, where the property name is logger.
 */
export class LoggerFacade
{
    constructor(loggingService: ILoggingService | null, feature: string, type: object | Function | string,
        identity: string | Array<string> | null, rethrowSevereErrors: boolean = true)
    {
        this._loggingService = loggingService;
        this._feature = feature;
        this._type = type;
        this._identity = identity;
        this._rethrowSevereErrors = rethrowSevereErrors;
    }
    private readonly _loggingService: ILoggingService | null;
    protected get loggingService(): ILoggingService | null { return this._loggingService; }
    private readonly _feature: string;
    protected get feature(): string { return this._feature; }
    private readonly _type: object | Function | string;
    protected get type(): object | Function | string { return this._type; }
    private readonly _identity: string | Array<string> | null;
    protected get identity(): string | Array<string> | null { return this._identity; }
    private readonly _rethrowSevereErrors: boolean;
    protected get rethrowSevereErrors(): boolean { return this._rethrowSevereErrors; }
    
    /**
     * Log a message. The message gets assigned the details of feature, type, and identity
     * here.
     */
    public log(level: LoggingLevel, gatherFn: logGatheringHandler): void {
        this.loggingService?.log(level, (options?: LogOptions) => {
            const details = gatherFn(options);
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
        this.loggingService?.logError(error, (options?: LogOptions) => {
            const details = gatherFn ? gatherFn(options) : {} as LogDetails;
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