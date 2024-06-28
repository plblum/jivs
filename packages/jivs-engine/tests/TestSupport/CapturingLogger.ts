import { ILoggerService, LogDetails, LogErrorDetails, LogOptions, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from "../../src/Interfaces/LoggerService";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";
import { LoggerServiceBase } from "../../src/Services/LoggerServiceBase";
import { ServiceBase } from "../../src/Services/ServiceBase";
import { valueForLog } from "../../src/Utilities/Utilities";

/**
 * Captures all logged info that qualifies with minLevel
 * for unit tests to evaluate through findMessage().
 * Also writes to the console
 */
export class CapturingLogger extends LoggerServiceBase
{
    
    public captured: Array<CapturedLogDetails> = [];

    public clearAll(): void
    {
        this.captured = [];
    }

    protected writeLog(level: LoggingLevel, logDetails: LogDetails): void {
        let capture = { ...logDetails, level: level };
        this.captured.push(capture);
    }

    public get entryCount(): Number
    {
        return this.captured.length;
    }

    protected getLogOptions(): LogOptions | undefined {
        return { includeData: true };
    }
    /**
     * Looks through all captures in order found. If any contain all matching values, it is returned.
     * messageSegment and sourceSegment allow a partial match (case insensitive).
     * Null parameters are not used for searching.
     * @param messageSegment 
     */
    public findMessage(messageSegment: RegExp | string | null, logLevel? : LoggingLevel | null, category?: string | null): CapturedLogDetails | null
    {
        let messageRE: RegExp | null = null;
        if (messageSegment instanceof RegExp)
            messageRE = messageSegment;
        else if (typeof messageSegment === 'string')
            messageRE = new RegExp(messageSegment, 'i');

        for (let capture of this.captured) {
            if ((logLevel != null) && (capture.level !== logLevel))
                continue;
            if ((category != null) && (capture.category !== category))
                continue;
            if (messageRE && !messageRE.test(capture.message))
                continue;
            return capture;
        }
        return null;
    }
}

export interface CapturedLogDetails extends LogDetails
{
    level: LoggingLevel
}