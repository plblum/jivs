/**
 * Various utilities
 * @module Utilities
 */

/**
 * Determines if the supplied group or group(s) are found in both parameters.
 * When either parameter is '', '*', empty array, null or undefined, it means to match
 * everything and this function returns true.
 * Otherwise, it returns true only when a group name is found amongst both group parameters.
 * @param group1 - group name(s) to compare against group2
 * @param group2
 */
export function groupsMatch(group1: string | Array<string> | undefined | null,
    group2: string | Array<string>| undefined | null): boolean
{
    function alwaysMatch(source: any): boolean
    {
        return (source == null) // supports both null and undefined
            || (source === '') || (source === '*') ||
            (Array.isArray(source) && source.length === 0);
    }
    function asArray(source: any): Array<string>
    {
        if (typeof source === 'string')
            return [source.toLowerCase()];
        if (Array.isArray(source))
            return source.map((value) => value.toLowerCase());
        return [];  // should not get here
    }

    if (alwaysMatch(group1) || alwaysMatch(group2))
        return true;
    let requestedGroups = asArray(group1);
    let hasGroups = asArray(group2);
    // just need to find one match between the two arrays, case insensitive
    for (let i = 0; i < requestedGroups.length; i++)
        if (hasGroups.includes(requestedGroups[i]) ||
            alwaysMatch(requestedGroups[i]))    // [''], [null], etc
            return true;

    return false;
}

export function deepEquals(obj1: any, obj2: any): boolean
{
    if (obj1 === null || obj2 === null)
        return Object.is(obj1, obj2);
    if (obj1 === undefined || obj2 === undefined)
        return Object.is(obj1, obj2);
    // primitives, null, undefined...
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object')
        return Object.is(obj1, obj2);
    // adapted from https://stackoverflow.com/questions/22266826/how-can-i-do-a-shallow-comparison-of-the-properties-of-two-objects-with-javascri
    let keys1 = Object.keys(obj1);
    if (keys1.length !== Object.keys(obj2).length)
        return false;
    /* eslint-disable no-prototype-builtins */
    return keys1.every(key => 
        obj2.hasOwnProperty(key) && deepEquals(obj1[key], obj2[key])
    );  
    /* eslint-ensable no-prototype-builtins */
    
}

export function deepClone(value: any): any {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    if (value instanceof Date)
        return new Date(value.getTime());
    let clone = new value.constructor();

    for (const key in value) {
        clone[key] = deepClone(value[key]);
    }

    return clone;
    
  }

export function objectKeysCount(obj: object | null): number
{
    return obj ? Object.keys(obj).length : 0;
}

/**
 * Returns the language code part of the cultureId.
 * If cultureId is only that already, it gets returned.
 * @param cultureId 
 * @returns 
 */
export function cultureLanguageCode(cultureId: string): string
{
    let pos = cultureId.indexOf('-');
    if (pos > 0)
        return cultureId.substring(0, pos);
    return cultureId;
}

/**
 * Ensures that if the value is actually assigned a string, that string is
 * trimmed and not empty. If null, undefined or empty (after trimming),
 * it returns null.
 * @param value 
 * @returns trimmed string or null.
 */
export function cleanString(value: string | null | undefined): string | null
{
    if (typeof value === 'string')
    {
        let text = value.trim();
        return text.length > 0 ? text : null;
    }
    return null;
}