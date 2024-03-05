import { ValueHostId } from "../DataTypes/BasicTypes";
import { type IValidationServices } from "./ValidationServices";
import { type IValueHost } from "./ValueHost";

/**
 * At its core, the ValidationManager needs to manage ValueHosts.
 * That's the purpose of these classes. They avoid the weight of validation features,
 * which are instead left to IValidationManager.
 */

/**
 * The fundamentals of managing ValueHosts involve just the ability
 * to get a ValueHost and provide the Services (for dependeny injection).
 */
export interface IValueHostResolver {
    /**
     * Retrieves the ValueHost of the identified by valueHostId
     * @param valueHostId - Matches to the IValueHost.Id property
     * Returns the instance or null if not found.
     */
    GetValueHost(valueHostId: ValueHostId): IValueHost | null;

    /**
     * Provides access to services.
     */
    Services: IValidationServices;    
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
    NotifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostId, revalidate: boolean): void;
    
}

/**
 * Determines if the object implements IValueHostsManager.
 * @param source 
 * @returns source typecasted to IValueHostsManager if appropriate or null if not.
 */
export function ToIValueHostsManager(source: any): IValueHostsManager | null
{
    if (source && typeof source === 'object') {
        let test = source as IValueHostsManager;    
        if (test.NotifyOtherValueHostsOfValueChange !== undefined)
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
    ValueHostsManager: IValueHostsManager;
}

/**
 * Determines if the object implements IValueHostsManagerAccessor.
 * @param source 
 * @returns source typecasted to IValueHostsManagerAccessor if appropriate or null if not.
 */
export function ToIValueHostsManagerAccessor(source: any): IValueHostsManagerAccessor | null
{
    if (source && typeof source === 'object') {
        let test = source as IValueHostsManagerAccessor;     
        if (test.ValueHostsManager !== undefined)
            return test;
    }
    return null;
}