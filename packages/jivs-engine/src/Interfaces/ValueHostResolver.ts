/**
 * At its core, the ValidationManager needs to manage ValueHosts.
 * That's the purpose of these interfaces. They avoid the weight of validation features,
 * which are instead left to IValidationManager.
 * @module ValidationManager/Types/ValueHostResolver
 */

import { ValueHostId } from '../DataTypes/BasicTypes';
import { IInputValueHost } from './InputValueHost';
import { IServicesAccessor } from './ValidationServices';
import type { IValueHost } from './ValueHost';

/**
 * The fundamentals of managing ValueHosts involve just the ability
 * to get a ValueHost and provide the Services (for dependency injection).
 */
export interface IValueHostResolver extends IServicesAccessor {
    /**
     * Retrieves the ValueHost of the identified by valueHostId
     * @param valueHostId - Matches to the IValueHost.Id property
     * Returns the instance or null if not found.
     */
    getValueHost(valueHostId: ValueHostId): IValueHost | null;

    /**
     * Retrieves the InputValueHost of the identified by valueHostId
     * @param valueHostId - Matches to the IInputValueHost.Id property
     * Returns the instance or null if not found or found a non-input valuehost.
     */
    getInputValueHost(valueHostId: ValueHostId): IInputValueHost | null;
}

/**
 * Building out key aspects of IValidationManager here
 * by pulling out anything that are consumed within ValueHosts.
 * At this level, there is no validation functionality.
 */
export interface IValueHostsManager extends IValueHostResolver
{
    /**
     * Upon changing the value of a ValueHost, other ValueHosts need to know. 
     * They may have Conditions that take the changed ValueHost into account and
     * will want to revalidate or set up a state to force revalidation.
     * This goes through those ValueHosts and notifies them.
     */
    notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostId, revalidate: boolean): void;
    
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

/**
 * Determines if the object implements IValueHostsManager.
 * @param source 
 * @returns source typecasted to IValueHostsManager if appropriate or null if not.
 */
export function toIValueHostsManager(source: any): IValueHostsManager | null
{
    if (toIValueHostResolver(source)) {
        let test = source as IValueHostsManager;    
        if (test.notifyOtherValueHostsOfValueChange !== undefined)
            return test;
    }
    return null;
}

/**
 * Allows classes to expose their reference to an IValueHostManager
 * (which is usually the ValidationManager).
 */
export interface IValueHostsManagerAccessor
{
    valueHostsManager: IValueHostsManager;
}

/**
 * Determines if the object implements IValueHostsManagerAccessor.
 * @param source 
 * @returns source typecasted to IValueHostsManagerAccessor if appropriate or null if not.
 */
export function toIValueHostsManagerAccessor(source: any): IValueHostsManagerAccessor | null
{
    if (source && typeof source === 'object') {
        let test = source as IValueHostsManagerAccessor;     
        if (test.valueHostsManager !== undefined)
            return test;
    }
    return null;
}