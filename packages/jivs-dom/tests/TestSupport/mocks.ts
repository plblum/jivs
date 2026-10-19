/**
 * Hand-written fakes for jivs-dom tests.
 * Use them to test a class in isolation. Once the real class behind a fake has its own
 * tests, add an integration test that uses the real one (see Testing_Approach.md).
 */
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ILoggingService, LogDetails, LogErrorDetails, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from '@plblum/jivs-engine/build/Interfaces/LoggingService';

/**
 * Creates an IFieldValueHost stand-in that supports only getName() and getElementIdentifier().
 * Like the real FieldValueHost, getElementIdentifier() returns the name when no elementIdentifier is assigned.
 * Calling any other member throws, which exposes a class using more than you expected.
 */
export function createStubFieldValueHost(name: string, elementIdentifier?: string): IFieldValueHost
{
    return {
        getName: () => name,
        getElementIdentifier: () => elementIdentifier ?? name
    } as unknown as IFieldValueHost;
}

/**
 * One call to ILoggingService.log().
 */
export interface IRecordedLogCall
{
    level: LoggingLevel;
    /**
     * The details returned by gatherFn. Undefined when the service was told not to call gatherFn.
     */
    details?: LogDetails;
}

/**
 * ILoggingService fake that records each log() call.
 * It does no filtering by level, so a test can see exactly what the class under test requested.
 */
export class RecordingLoggingService implements ILoggingService
{
    /**
     * @param callGatherFn - When true (default), gatherFn is invoked and its result recorded.
     * When false, gatherFn is never invoked, simulating a logger that rejects the level.
     */
    constructor(callGatherFn: boolean = true)
    {
        this.callGatherFn = callGatherFn;
    }
    serviceName: string = 'RecordingLoggingService';
    minLevel: LoggingLevel = LoggingLevel.Debug;
    chainedLogger: ILoggingService | null = null;
    callGatherFn: boolean;
    calls: Array<IRecordedLogCall> = [];

    log(level: LoggingLevel, gatherFn: logGatheringHandler): void
    {
        this.calls.push({
            level: level,
            details: this.callGatherFn ? gatherFn() as LogDetails : undefined
        });
    }
    logError(error: Error, gatherFn: logGatheringErrorHandler): void
    {
        // Not used by the classes under test.
    }
    dispose(): void
    {
    }
}
