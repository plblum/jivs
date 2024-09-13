/**
 * @inheritdoc {@link Support/CapturingLogger!CapturingLogger }
 * @module Support/CapturingLogger
 */

import { LoggingLevel, LogDetails, LogOptions } from "../Interfaces/LoggerService";
import { LoggerServiceBase } from "../Services/LoggerServiceBase";
import { valueForLog } from "../Utilities/Utilities";


/**
 * CapturingLogger targets testing jivs. 
 * It captures all qualifying logged objects and makes them available for unit tests to evaluate.
 * 
 * Use either its containsLog() or findMessage() methods to search for a log that matches the criteria.
 * 
 * It respects the minLevel set in the constructor and supports
 * the overrideMinLevelWhen() overrides.
 * 
 * It is often used together with ConsoleLoggerService to capture logs.
 * Just pass the ConsoleLoggerService into the constructor.
 */

export class CapturingLogger extends LoggerServiceBase
{
    
    public captured: Array<CapturedLogDetails> = [];

    /**
     * Clears all captured logs.
     * Generally used if several tests are run in the same testing function,
     * so that you don't find information previously checked.
     */
    public clearAll(): void
    {
        this.captured = [];
    }

    protected addCaptured(capture: CapturedLogDetails): void {
        if (capture.type)
            capture.typeAsString = (typeof capture.type === 'string') ?
                capture.type :
                valueForLog(capture.type) as string;
        this.captured.push(capture);
    }

    protected writeLog(level: LoggingLevel, logDetails: LogDetails): void {
        let capture = { ...logDetails, level: level } as CapturedLogDetails;
        this.addCaptured(capture);
    }

    /**
     * Count of log entries captured.
     */
    public get entryCount(): Number
    {
        return this.captured.length;
    }

    protected getLogOptions(): LogOptions | undefined {
        return { includeData: true };
    }

    /**
     * Looks for a log that contains any of the criteria in the parameters.
     * All criteria must match for a log to be found.
     * @param messageSegment - a string or RegExp to match against the message. When null, it is not used.
     * When string, it is a partial case insensitivie match.
     * @param logLevel - the log level to match. When null/undefined, it is not used.
     * @param category - the category to match. When null/undefined, it is not used.
     * @param more - additional filters to apply: type, feature, identity, hasData, data.
     * @returns true when a matching log is found, false otherwise.
     */
    public containsLog(messageSegment: RegExp | string | null, logLevel?: LoggingLevel | null,
        category?: string | null, more?: FindMoreCapturedLogDetails): boolean
    {
        return this.findMessage(messageSegment, logLevel, category, more) != null;
    }

    /**
     * Looks through all captures in order found. If any contain all matching values, it is returned.
     * messageSegment and sourceSegment allow a partial match (case insensitive).
     * Null parameters are not used for searching.
     * @param messageSegment - a string or RegExp to match against the message. When null, it is not used.
     * When string, it is a partial case insensitivie match.
     * @param logLevel - the log level to match. When null/undefined, it is not used.
     * @param category - the category to match. When null/undefined, it is not used.
     * @param more - additional filters to apply: type, feature, identity, hasData, data.
     * @returns the first matching capture or null if none found.
     */
    public findMessage(messageSegment: RegExp | string | null, logLevel?: LoggingLevel | null,
        category?: string | null, more?: FindMoreCapturedLogDetails): CapturedLogDetails | null
    {
        function toRegExp(param: RegExp | string | Function | null | undefined): RegExp | null
        {
            if (typeof param === 'function')
                return new RegExp('^' + (param.name ? param.name : param.constructor.name) + '$');
            if (param instanceof RegExp)
                return param;
            if (typeof param === 'string')
                return new RegExp(param, 'i');

            return null;
        }
        let messageRE = toRegExp(messageSegment);
        let typeRE: RegExp | null = null;
        let featureRE: RegExp | null = null;
        let identityRE: RegExp | null = null;
        let hasData: boolean | undefined = undefined;
        let dataMatchObject: object | undefined = undefined;
        if (more)
        {
            typeRE = toRegExp(more.type);
            featureRE = toRegExp(more.feature);
            identityRE = toRegExp(more.identity);
            hasData = more.hasData;
            dataMatchObject = more.data;
        }

        for (let capture of this.captured) {
            if ((logLevel != null) && (capture.level !== logLevel))
                continue;
            if ((category != null) && (capture.category !== category))
                continue;
            if (messageRE && !messageRE.test(capture.message))
                continue;
            if (typeRE && (!capture.typeAsString || !typeRE.test(capture.typeAsString)))
                continue;
            if (featureRE && (!capture.feature || !featureRE.test(capture.feature)))
                continue;
            if (identityRE)
                if (!capture.identity)
                    continue;
                else if (Array.isArray(capture.identity)) {
                    if (!capture.identity.some((id) => identityRE.test(id)))
                        continue;
                } else if (!identityRE.test(capture.identity))
                    continue;

            if (dataMatchObject) {
                if (!capture.data)
                    continue;
                let match = true;
                for (let key in dataMatchObject) {
                    if (capture.data.hasOwnProperty(key)) {
                        if ((capture.data as any)[key] !== (dataMatchObject as any)[key]) {
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
            else if (hasData !== undefined)
            {
                if (hasData)
                {
                    if (!capture.data)
                        continue;
                }
                else if (capture.data)
                    continue;
            }
            
            return capture;
        }
        return null;
    }
}

export interface CapturedLogDetails extends LogDetails
{
    level: LoggingLevel;
    typeAsString?: string;  // force to a string
}

/**
 * More searching options for CapturingLogger.findMessage
 */
export interface FindMoreCapturedLogDetails
{
    type?: RegExp | string | Function;
    feature?: RegExp | string;
    identity?: RegExp | string;
    // when true, only return those with data property assigned.
    // when false, omit those with data property assigned.
    // undefined means ignore this filter.
    hasData?: boolean;
    /**
     * Assign to an object to match to the data.
     * The object can have a subset of properties to match.
     * The values must be exact matches.
     * When assigned, hasData is ignored as the data property must be assigned.
     */
    data?: object;
}