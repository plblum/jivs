/**
 * Map container that lets you register entries where
 * the key is a lookup string and the value is a function.
 * It has a fallback behavior where the user can register
 * one lookup string to use another's function.
 * @module Utilities/NameToFunctionMapper
 */


import { AssertNotNull } from "../Utilities/ErrorHandling";


/**
 * Map container that lets you register entries where
 * the key is a lookup string and the value is a function.
 * It has a fallback behavior where the user can register
 * one lookup string to use another's function.
 */
export interface INameToFunctionMapper<TValue, TResult>
{
/**
 * Request the function associated with the key.
 * Returns undefined if not found.
 * @param key - will be treated case insensitively
 */    
    Get(key: string): ((...args: TValue[]) => TResult) | undefined
    
/**
 * Adds or replaces an entry in the map
 * @param key  - will be treated case insensitively
 * @param fnOrKey  - as a key, it will be treated case insensitively
 */    
    Register(key: string, fnOrKey: ((...args: TValue[]) => TResult) | string): void;
}

/**
 * Implements a generic INameToFunctionMapper.
 */
export class NameToFunctionMapper<TValue, TResult> implements INameToFunctionMapper<TValue, TResult> {

    /**
     * Map to lookup a function based on a string.
     * String matching is case insensitive. Expect all strings stored in this dictionary
     * to be lowercase.
     */
    private _map = new Map<string, (...args: TValue[]) => TResult>();
    /**
     * Request the function associated with the key.
     * @param key - will be treated case insensitively
     * @returns function or undefined when the key is not found.
     */    
    public Get(key: string): ((...args: TValue[]) => TResult) | undefined
    {
        AssertNotNull(key, 'key');
        return this._map.get(key.toLowerCase());    // expect undefined result when not found
    }

/**
 * Adds or replaces an entry in the map
 * @param key  - will be treated case insensitively
 * @param fnOrKey  - as a key, it will be treated case insensitively
 */    
    public Register(key: string, fnOrKey: ((...args: TValue[]) => TResult) | string): void
    {
        AssertNotNull(key, 'key');
        AssertNotNull(fnOrKey, 'fnOrKey');

        let fn: (value: TValue) => TResult;
        if (typeof fnOrKey === 'string') {
            fnOrKey = fnOrKey.toLowerCase();
            let temp = this._map.get(fnOrKey);
            if (temp === undefined)
                throw new Error(`Use Register(${key}, fn) first.`);
            fn = temp;
        }
        else
            fn = fnOrKey;
        this._map.set(key.toLowerCase(), fn);
    }    

}

