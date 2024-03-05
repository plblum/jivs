import { InvalidTypeError } from "../Utilities/ErrorHandling";

/**
 * Function that compares two values to determine equality, less than, greater than.
 * Declare actual functions for each datatype that doesn't support the
 * ==, !=, <, > operators the desired way.
 * Conditions that perform comparisons and support multiple data types
 * will use theses functions, retrieved from ValidationServices.DataTypeResolver.
 * For any value type for which this function was not implemented,
 * there is a fallback, DefaultComparer which compares using ==, !=
 */


export type ComparersHandler = (value1: any, value2: any) => ComparersResult;
export enum ComparersResult {
    Equals,
    NotEquals,
    LessThan,
    GreaterThan,
    Undetermined
}

/**
 * For primitives, null, and undefined. 
 * (Exception for objects and arrays.)
 * Supports Equals, LessThan, and Greater using the native Javascript operators
 * of ===, <, >. If the two values are the same type, it can use LessThan/GreaterThan.
 * Otherwise, it returns NotEquals.
 * @param value1 
 * @param value2 
 */
export function DefaultComparer(value1: any, value2: any): ComparersResult {
    AssertPrimitive(value1);
    AssertPrimitive(value2);
    if (value1 === value2)
        return ComparersResult.Equals;
    if (typeof value1 === typeof value2) {
        if (value1 < value2)
            return ComparersResult.LessThan;
        return ComparersResult.GreaterThan;
    }
    return ComparersResult.Undetermined;
}

function AssertPrimitive(value: any): void {
    if ((value != null) &&
        (typeof value === 'object' || Array.isArray(value)))
        throw new InvalidTypeError(value);

}
/**
 * Expects both values to be booleans.
 * Returns either Equals or NotEquals.
 * If one value is null/undefined, returns NotEquals.
 * If both values are null or undefined, returns Equals.
 * @param value1 - Supports boolean, null, and undefined
 * @param value2 - Supports boolean, null, and undefined
 */
export function BooleanComparer(value1: any, value2: any): ComparersResult {
    AssertPrimitive(value1);
    AssertPrimitive(value2);
    // null = null, undefined = undefined
    if (value1 == null && (value1 === value2))
        return ComparersResult.Equals;
    let isBool1 = typeof value1 === 'boolean';
    let isBool2 = typeof value2 === 'boolean';

    if (isBool1 && isBool2)
        return value1 === value2 ? ComparersResult.Equals : ComparersResult.NotEquals;
    // eliminate non-bool primitives
    if ((value1 == null && isBool2) ||
        (value2 == null && isBool1))
        return ComparersResult.NotEquals;

    throw new InvalidTypeError(isBool1 ? value2 : value1);
}

/**
 * Expects both values to be strings.
 * Does a case insensitive comparison before trying the standard operators.
 * If one value is null/undefined, returns NotEquals.
 * If both values are null or undefined, returns Equals.
 * Otherwise, expect Equals, LessThen, GreaterThan.
 * @param value1 - Supports string, null, and undefined
 * @param value2 - Supports string, null, and undefined 
 */
export function CaseInsensitiveComparer(value1: any, value2: any): ComparersResult {
    AssertPrimitive(value1);
    AssertPrimitive(value2);
    // null = null, undefined = undefined
    if (value1 == null && (value1 === value2))
        return ComparersResult.Equals;
    let isStr1 = typeof value1 === 'string';
    let isStr2 = typeof value2 === 'string';
    // eliminate invalid types
    if (!isStr1 && value1 != null)  // null/undefined
        throw new InvalidTypeError(value1);
    if (!isStr2 && value2 != null)  // null/undefined
        throw new InvalidTypeError(value2);
    
    if (isStr1 && isStr2)
        return DefaultComparer(value1.toLowerCase(), value2.toLowerCase());
    return ComparersResult.NotEquals;
}

/**
 * Expects values to be Date objects. Includes both date and time parts.
 * Supports Equals, Less than, and greater than.
 * When null or undefined is supplied, it will return not equals
 * @param value1 - supports Date objects, null, and undefined
 * @param value2 - supports Date objects, null, and undefined
 */
export function DateTimeComparer(value1: any, value2: any): ComparersResult {
    return InternalDateTimeComparer(value1, value2,
        (original: Date) => original);
}
function InternalDateTimeComparer(value1: any, value2: any,
    dateReplacer: (original: Date)=> Date): ComparersResult
{
    AssertDate(value1);
    AssertDate(value2);

    // null = null, undefined = undefined
    if (value1 == null && (value1 === value2))
        return ComparersResult.Equals;

    let date1AsNumber = value1 ?
        dateReplacer(value1).getTime() :
        value1;

    let date2AsNumber = value2 ?
        dateReplacer(value2).getTime() :
        value2;
    return DefaultComparer(date1AsNumber, date2AsNumber);
}

/**
 * Expects values to be Date objects. Includes only the date part.
 * Supports Equals, Less than, and greater than.
 * @param value1 - supports Date objects, null, and undefined
 * @param value2 - supports Date objects, null, and undefined
 */
export function DateOnlyComparer(value1: any, value2: any): ComparersResult {
    return InternalDateTimeComparer(value1, value2,
        (original: Date) => 
            new Date(original.getUTCFullYear(), original.getUTCMonth(), original.getUTCDate()));
}
function AssertDate(value: any): void
{
    if (!(value == null || // null/undefined
        value instanceof Date))
    throw new InvalidTypeError(value);
}
/**
 * Expects values to be Date objects. Includes only the month and year parts.
 * Supports Equals, Less than, and greater than.
 * @param value1 - supports Date objects, null, and undefined
 * @param value2 - supports Date objects, null, and undefined
 */
export function DateAsMonthYearComparer(value1: any, value2: any): ComparersResult {
    return InternalDateTimeComparer(value1, value2,
        (original: Date) => 
            new Date(original.getUTCFullYear(), original.getUTCMonth(), 1));
}
/**
 * Expects values to be Date objects. Includes only the month and day parts.
 * Handles Feb leap years correctly.
 * Supports Equals, Less than, and greater than.
 * @param value1 - supports Date objects, null, and undefined
 * @param value2 - supports Date objects, null, and undefined
 */
export function DateAsAnniversaryComparer(value1: any, value2: any): ComparersResult {
    return InternalDateTimeComparer(value1, value2,
        (original: Date) => 
        new Date(2004, original.getUTCMonth(), original.getUTCDate()));
    
}

