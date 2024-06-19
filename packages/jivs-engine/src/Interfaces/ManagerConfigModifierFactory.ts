/**
 * Interface for a ManagerConfigModifierFactory
 * @module ValueHost/Types/ManagerConfigModifierFactory
 */

import { IManagerConfigModifier } from "./ManagerConfigModifier";
import { IService, IServicesAccessor } from "./Services";
import { ValueHostConfig } from "./ValueHost";
import { IValueHostsManager, ValueHostsManagerConfig } from "./ValueHostsManager";

/**
 * Interface for a ManagerConfigModifierFactory
 */
export interface IManagerConfigModifierFactory extends IService, IServicesAccessor  {
    create(manager: IValueHostsManager,
        existingValueHostConfigs: Map<string, ValueHostConfig>): IManagerConfigModifier<ValueHostsManagerConfig>;
}