import { ILoggerService, LogDetails, LogErrorDetails, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from "../../src/Interfaces/LoggerService";
import { valueForLog } from "../../src/Utilities/Utilities";

// Designed to keep the last call for any ILoggingService calls
// so we can see the inputs.

export class TestLogCallsLoggingService implements ILoggerService {
    constructor (minLevel: LoggingLevel = LoggingLevel.Debug) {
        this.minLevel = minLevel;
    }
    serviceName: string = 'TestLogCallsLoggingService';
    dispose(): void {
    }
    minLevel: LoggingLevel;

    lastLogDetails: LogDetails | LogErrorDetails | null = null;

    log(level: LoggingLevel, gatherFn: logGatheringHandler): void {
        if (level < this.minLevel)
            return;
        this.lastLogDetails = gatherFn();
        if (this.lastLogDetails.type && typeof this.lastLogDetails.type !== 'string')
            this.lastLogDetails.type = valueForLog(this.lastLogDetails.type);
    }

    logError(error: Error, gatherFn: logGatheringErrorHandler): void {
        let logDetails = gatherFn() as LogDetails;
        logDetails.message = error.message;
        logDetails.category = LoggingCategory.Exception;
        this.lastLogDetails = logDetails;
        if (this.lastLogDetails.type && typeof this.lastLogDetails.type !== 'string')
            this.lastLogDetails.type = valueForLog(this.lastLogDetails.type);        
    }

}