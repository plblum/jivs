/**
 * Various classes that support error handling.
 * @module Utilities/ErrorHandling
 */


/**
 * Exception for reporting bad coding.
 */
export class CodingError extends Error
{

}

export class InvalidTypeError extends Error
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
