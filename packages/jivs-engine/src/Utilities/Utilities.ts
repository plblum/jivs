/**
 * Various classes, types and functions to support the overall tool.
 * @module Utilities
 */

/**
 * Escape function for strings to retain their original characters when used
 * inside of a regexp pattern.
 * @param text 
 * @returns 
 */
export function escapeRegExp(text: string): string {
    return text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

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
        /* istanbul ignore next */
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

export function deepClone(value: any, alreadyChecked?: Array<any>,
    filter?: deepCloneFilter): any {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    // Handle circular references
    if (alreadyChecked?.includes(value))
        return undefined;

    if (value instanceof Date)
        return new Date(value.getTime());
    if (value instanceof RegExp)
        return new RegExp(value.source, value.flags);

    let newObject: any;
    if (value.constructor && value.constructor !== Object) {
        // handles classes
        newObject = new value.constructor();
    }
    else {
        // Handle plain objects
        newObject = {};
    }
    if (alreadyChecked === undefined)
        alreadyChecked = [];

    for (let key in value) {
        if (value.hasOwnProperty(key)) {
            let valueToClone = value[key];
            if (filter) {
                valueToClone = filter(key, valueToClone, value);
                if (valueToClone === undefined) // discard this property
                    continue;
            }            
            // clone alreadyChecked and add the current value to it
            let newAlreadyChecked = alreadyChecked.slice();
            newAlreadyChecked.push(value);
                
            newObject[key] = deepClone(valueToClone, newAlreadyChecked, filter);
        }
    }

    return newObject;    
    
}
/**
 * Used by deepClone to modify and remove properties.
 */
export type deepCloneFilter = (key: string, value: any, parent: any) => any;

/**
 * Implementation of deepCloneFilter with these features:
 * Remove undefined properties.
 * Convert functions into a string of "[Function]" with the function name if available.
 * Convert Date objects to their ISO string.
 * Convert RegExp objects to a string that mimics its expression pattern.
 * Discard any circular references.
 * Discard most built-in objects like Map, Set, Error, etc.
 * @param key 
 * @param value 
 * @param parent 
 * @returns 
 */
export function cleanForLogging(key: string, value: any, parent: any): any {

    if (value === undefined) {
        return undefined;   // to be discarded
    }
    if (typeof value === 'function')
        return '[Function' + (value.name ? ' ' + value.name : '') + ']';

    if (typeof value !== 'object' || value == null)   // null or undefined
        return value;
  
    if (value instanceof Date)
        return value.toISOString();
    if (value instanceof RegExp)
        return '/' + value.source + '/' + value.flags;
    if (value instanceof Array) // because isSupportedAsValue rejects arrays
        return value;
    
    if (!isSupportedAsValue(value)) // this is after RegExp because it declares a RegExp as unsupported.
        return undefined;   // discard unsupported objects    
    return value;
}

/**
 * Designed to prepare the value for conversion to JSON.
 * Creates a near-deep clone. All new objects, but some properties have changed.
 * It will remove undefined properties.
 * It will convert functions into a string of "[Function]" with the function name if available.
 * It will convert Date objects to their ISO string.
 * It will convert RegExp objects to a string that mimics its expression pattern.
 * It will discard any circular references.
 * It will discard most built-in objects like Map, Set, Error, etc.
 * It will discard class instances.
 * @param value - Any data that will be turned into JSON after this function completes.
 * @param filter - When supplied, it provides an alternative to the default rules for cleaning (which uses cleanForLogging).
 * @returns When it returns undefined, it means the property containing the value can be removed.
 */
export function deepCleanForJson(value: any, filter?: deepCloneFilter): any {
    return deepClone(value, undefined, filter ?? cleanForLogging);
}

/**
 * Returns the number of keys in the given object.
 * 
 * @param value - The object to count the keys of.
 * @returns The number of keys in the object. If the object is null or undefined, returns 0.
 */
export function objectKeysCount(value: object | null): number
{
    return value ? Object.keys(value).length : 0;
}

/**
 * Look in the members of an enum object whose elements are strings
 * to see if it contains the key.
 * @param value 
 * @param enumType 
 * @returns 
 */
export function isValueOfStringEnum<T extends object>(value: string, enumType: T): boolean {
    return Object.values(enumType).includes(value as unknown as T[keyof T]);
}
/**
 * Finds a case-insensitive value in a string enum.
 * 
 * @template T - The type of the enum.
 * @param {string} value - The value to search for.
 * @param {T} enumType - The enum to search in.
 * @returns {string | undefined} - The matching value, or undefined if not found.
 */
export function findCaseInsensitiveValueInStringEnum<T extends object>(value: string, enumType: T): string | undefined {
    return Object.values(enumType).find((enumValue) => {
        if (typeof enumValue === 'string')
            return (enumValue.toLowerCase() === value.toLowerCase());
        return false;
    });
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

/**
 * Returns a string to be used in a log that communicates
 * the value. It turns null into "[null]", undefined into "[undefined]",
 * an object into its constructor name or "Plain object",
 * and a Date or primitive into a string, truncated to 20 characters.
 * @param value 
 * @returns 
 */
export function valueForLog(value: any): string
{
    if (value === undefined)
        return '[undefined]';
    if (value == null)
        return '[null]';
    switch (typeof value)
    {
        case 'bigint':
        case 'boolean':
        case 'number':
            return value.toString();
        case 'string':
            return value.length > 25 ? '"' + value.substring(0, 20) + '"...' : '"' + value + '"';   // clipped
        case 'function':
            return value.name ? value.name : value.constructor.name;
        // @ts-ignore so we don't worry about the fall-thru        
        case 'object':
            if (isPlainObject(value))
                return `Plain object`;                
            if (value.constructor !== undefined && value.constructor.name !== undefined)
                return value.constructor.name;
            // intentional fall thru: note: missing code coverage on this case due to it being rare if impossible to get here
        default: // function, symbol, or object not covered above.
            return `[${typeof value}]`;
    }

}
export function isPlainObject(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    const proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
}

const notSupportedAsValue = [
    Array, Function, Error, RegExp, Map, Set, WeakMap, WeakSet
    // add more built-in constructors if needed
];

export function isSupportedAsValue(obj: any) {
    if (obj === null || obj === undefined || typeof obj !== 'object')
        return true;

    if (notSupportedAsValue.includes(obj.constructor))
        return false;
    return true;
};

export function hasLetters(source: string): boolean {
    return /\p{L}/u.test(source);
}
export function onlyTheseCharacters(source: string, validChars: string, validRegExpSymbols: string): boolean {
    const escapedValidChars = escapeRegExp(validChars);
    return new RegExp(`^[${escapedValidChars + validRegExpSymbols}]*$`).test(source);
}
export function hasMultipleOccurances(source: string, singleOccuranceChars: string): boolean {
    const escapedChars = escapeRegExp(singleOccuranceChars);
    return new RegExp(`([${escapedChars}]).*\\1`).test(source);
}
