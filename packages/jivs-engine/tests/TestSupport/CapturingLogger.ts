/**
 * CapturingLogger is part of the testing side of the JIVS engine. 
 * It is used to capture logs and then search through them to verify 
 * that the correct logs were generated.
 * The CapturingLogger class has a findMessage method that takes in a FindMoreCapturedLogDetails 
 * object and returns a CapturedLogDetails object.
 * The FindMoreCapturedLogDetails object has optional properties that can be used to filter 
 * the logs that are returned by the findMessage method.
 * The properties that can be used to filter the logs are type, feature, and identity.
 * The type property can be a regular expression or a string, 
 * the feature property can be a regular expression or a string, and the identity property 
 * can be a regular expression or a string.
 * If a property is not provided, then it is not used to filter the logs.
 * The findMessage method iterates through the captured logs and 
 * returns the first log that matches all of the filter criteria.If no log matches the filter criteria, 
 * then null is returned.
 */


import { LogDetails, LogOptions, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { LoggerServiceBase } from "../../src/Services/LoggerServiceBase";
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
     * @param messageSegment - a string or RegExp to match against the message. When null, it is not used.
     * When string, it is a partial case insensitivie match.
     * @param logLevel - the log level to match. When null, it is not used.
     * @param category - the category to match. When null, it is not used.
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