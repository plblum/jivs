/**
 * The fundamentals of managing ValueHosts involve just the ability
 * to get a ValueHost and provide the Services (for dependency injection).
 * @module Validation/Types/ValueHostResolver
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { IInputValueHost } from './InputValueHost';
import { IServicesAccessor } from './ValidationServices';
import type { IValueHost } from './ValueHost';

/**
 * The fundamentals of managing ValueHosts involve just the ability
 * to get a ValueHost and provide the Services (for dependency injection).
 */
export interface IValueHostResolver extends IServicesAccessor {
    /**
     * Retrieves the ValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the IValueHost.name property
     * Returns the instance or null if not found.
     */
    getValueHost(valueHostName: ValueHostName): IValueHost | null;

    /**
     * Retrieves the InputValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the IInputValueHost.name property
     * Returns the instance or null if not found or found a non-input valuehost.
     */
    getInputValueHost(valueHostName: ValueHostName): IInputValueHost | null;
}

/**
 * Determines if the object implements IValueHostResolver.
 * @param source 
 * @returns source typecasted to IValueHostResolver if appropriate or null if not.
 */
export function toIValueHostResolver(source: any): IValueHostResolver | null
{
    if (source && typeof source === 'object') {
        let test = source as IValueHostResolver;    
        if (test.getValueHost !== undefined &&
            test.getInputValueHost !== undefined &&
            test.services !== undefined)
            return test;
    }
    return null;
}