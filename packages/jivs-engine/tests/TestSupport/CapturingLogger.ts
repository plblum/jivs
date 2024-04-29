import { ILoggerService, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";

/**
 * Captures all logged info that qualifies with minLevel
 * for unit tests to evaluate through findMessage().
 * Also writes to the console
 */
export class CapturingLogger implements ILoggerService
{
    public get minLevel(): LoggingLevel
    {
        return this._minLevel;
    }
    public set minLevel(level: LoggingLevel)
    {
        this._minLevel = level;
        this._extraLogger.minLevel = level;
    }
    private _minLevel: LoggingLevel = LoggingLevel.Warn;
    
    public captured: Array<MockCapturedLog> = [];

    public get extraLogger(): ILoggerService
    {
        return this._extraLogger;
    }
    public set extraLogger(service: ILoggerService)
    {
        this._extraLogger = service;
    }
    private _extraLogger: ILoggerService = new ConsoleLoggerService();

    public log(message: string, level: LoggingLevel, category?: string | undefined, source?: string | undefined): void {
        if (level >= this.minLevel)
            this.captured.push({
                message: message,
                level: level,
                category: category,
                source : source
            });
        this.extraLogger.log(message, level, category, source);
    }
    public entryCount(): Number
    {
        return this.captured.length;
    }
    public getLatest(): MockCapturedLog | null
    {
        if (this.captured.length)
            return this.captured[this.captured.length - 1];
        return null;
    }

    /**
     * Looks through all captures in order found. If any contain all matching values, it is returned.
     * messageSegment and sourceSegment allow a partial match (case insensitive).
     * Null parameters are not used for searching.
     * @param messageSegment 
     */
    public findMessage(messageSegment: string | null, logLevel : LoggingLevel | null, category: string | null, sourceSegment: string | null): MockCapturedLog | null
    {
        let messageRE: RegExp | null = messageSegment ? new RegExp(messageSegment, 'i') : null;
        let sourceRE : RegExp | null = sourceSegment ? new RegExp(sourceSegment, 'i') : null;        
        for (let capture of this.captured) {
            if ((logLevel !== null) && (capture.level !== logLevel))
                continue;
            if ((category !== null) && (capture.category !== category))
                continue;
            if (messageRE && !messageRE.test(capture.message))
                continue;
            if (sourceRE && capture.source && !sourceRE.test(capture.source))
                continue;
            return capture;
        }
        return null;
    }
}
export interface MockCapturedLog
{
    message: string,
    level: LoggingLevel,
    category: string | undefined,
    source: string | undefined
}
