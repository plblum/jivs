/**
 * Various classes, types and functions to support the overall tool.
 * @module Utilities
 */

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
        super(`Type is not supported for this value: ${valueSupplied?.toString()}`);
    }
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
