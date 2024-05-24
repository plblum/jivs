/**
 * The fundamentals of managing ValueHosts involve just the ability
 * to get a ValueHost and provide the Services (for dependency injection).
 * @module Validation/Types/ValueHostResolver
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ICalcValueHost } from './CalcValueHost';
import { IStaticValueHost } from './StaticValueHost';
import { IServicesAccessor } from './Services';
import type { IValueHost } from './ValueHost';
import { IValueHostAccessor } from './ValueHostAccessor';

/**
 * The fundamentals of managing ValueHosts involve just the ability
 * to get a ValueHost and provide the Services (for dependency injection).
 */
export interface IValueHostResolver extends IServicesAccessor {
    /**
     * Retrieves the ValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the ValueHostBaseConfig.name property
     * Returns the instance or null if not found.
     */
    getValueHost(valueHostName: ValueHostName): IValueHost | null;
    /**
     * Retrieves the CalcValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the CalcValueHostConfig.name property
     * Returns the instance or null if not found or found a different type of value host.
     */
    getCalcValueHost(valueHostName: ValueHostName): ICalcValueHost | null;
    
    /**
     * Retrieves the StaticValueHost of the identified by valueHostName
     * @param valueHostName - Matches to the StaticValueHostConfig.name property
     * Returns the instance or null if not found or found a different type of value host.
     */
    getStaticValueHost(valueHostName: ValueHostName): IStaticValueHost | null;    

    //FYI: Any ValueHost that is based on ValidatableValueHostBase has its get function
    // in IValidationManager.


    /**
     * Alternative to getValueHost() and companion functions that returns strongly typed valuehosts 
     * in a shortened syntax. Always throws exceptions if the value host requested
     * is unknown or not the expected type.
     */
    vh: IValueHostAccessor;    

    /**
     * Provides a way to enumerate through existing ValueHosts.
     * @returns A generator that yields ValueHosts
     */
    enumerateValueHosts(filter?: (valueHost: IValueHost) => boolean): Generator<IValueHost>;
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
            test.getCalcValueHost !== undefined &&
            test.getStaticValueHost !== undefined &&
            test.services !== undefined &&
            test.vh !== undefined &&
            test.enumerateValueHosts !== undefined)
            return test;
    }
    return null;
}