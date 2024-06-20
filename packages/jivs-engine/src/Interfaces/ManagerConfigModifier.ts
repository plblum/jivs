/**
 * Interfaces for a ManagerConfigModifiers
 * @module ValueHost/Types/ManagerConfigModifier
 */

import {
    IManagerConfigBuilder, IValueHostsForValueHostsManagerConfig,
    IValueHostsForValidatorManagerConfigBuilder
} from "./ManagerConfigBuilder";
import { ValidationManagerConfig } from "./ValidationManager";
import { ValueHostsManagerConfig } from "./ValueHostsManager";

/**
 * Used by ValueHostManager.startModifying() function to modify the ValueHostsManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * apply() makes its updates through ValueHostsManager.addOrMergeValueHost().
 */
export interface IManagerConfigModifier<T extends ValueHostsManagerConfig>
    extends IManagerConfigBuilder<T>, IValueHostsForValueHostsManagerConfig<T>
{
    /**
     * Completes the process by using ValueHostManager.addOrMergeValueHost()
     * on each entry supplied. That function internally uses ValueHostsConfigMergeService 
     * when the ValueHost exists. 
     * After this function completes, this instance has been disposed (via dispose() function)
     * and the instance should not be used further.
     * Any reference to a ValueHost instance that you have must be abandoned and a fresh
     * instance retrieved, as your reference was disposed.
     */
    apply(): void;

}

/**
 * Specific to ValidationManager.
 */
export interface IValidationManagerConfigModifier<T extends ValidationManagerConfig>
    extends IManagerConfigModifier<T>, IValueHostsForValidatorManagerConfigBuilder<T>
{

}
