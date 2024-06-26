/**
 * Various classes, types and functions to support the overall tool.
 * @module Utilities
 */

import { valueForLog } from "./Utilities";

/**
 * Classes based on this should throw their error all the way to the top.
 */
export abstract class SevereErrorBase extends Error
{

}

/**
 * Exception for reporting bad coding.
 */
export class CodingError extends SevereErrorBase
{

}

export class InvalidTypeError extends SevereErrorBase
{
    constructor(valueSupplied: any)
    {
        super(`Type is not supported for this value: ${valueForLog(valueSupplied)}`);
    }
}

export function ensureError(value: any): Error
{
    if (value instanceof Error)
        return value;
    if (typeof value === 'string')
        return new CodingError(value);  // must be a SevereError.
    return new Error(valueForLog(value));
}

/**
 * Throw a CodingError when valueToCheck is null or undefined.
 * @param valueToCheck 
 * @param memberName - Used in the error message. Defaults to 'parameter'.
 */
export function assertNotNull(valueToCheck: any, memberName: string = 'parameter'): void
{
    if (valueToCheck == null)   // includes undefined
        throw new CodingError(`${memberName} required`);
}

/**
 * Throw a CodingError when valueToCheck is null, not a string or an empty string.
 * @param valueToCheck 
 * @param memberName 
 * @returns 
 */
export function assertNotEmptyString(valueToCheck: any, memberName: string = 'parameter'): void
{
    assertNotNull(valueToCheck, memberName);

    if (typeof valueToCheck === 'string')   // includes undefined
        if (valueToCheck.length === 0)    // ignore trimming
            throw new CodingError(`${memberName} not empty string`);          
        else
            return;
        
    
    throw new CodingError(`${memberName} must be string`);
}

/**
 * Check a field that is supposed to contain an active reference within a WeakRef object.
 * If the field is unassigned, null, or the reference was discarded, throw a TypeError.
 * @param ref 
 * @param message 
 */
export function assertWeakRefExists(ref: WeakRef<any> | null | undefined, message: string): void
{
    if (!ref || ref.deref() === undefined)
        throw new TypeError(message);
}

/**
 * Ensures the value is a function.
 * @param value 
 */
export function assertFunction(value: any): void
{
    if (typeof value !== 'function')
        throw new CodingError(`Function expected, but received ${valueForLog(value)}`);
}