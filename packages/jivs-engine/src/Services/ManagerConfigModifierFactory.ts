/**
 * Factory to create the ManagerConfigModifier.
 * @module ValueHost/Types/ManagerConfigModifierFactory
 */

import { IManagerConfigModifierFactory } from "../Interfaces/ManagerConfigModifierFactory";
import { IManagerConfigModifier } from "../Interfaces/ManagerConfigModifier";
import { IValueHostsManager, ValueHostsManagerConfig } from "../Interfaces/ValueHostsManager";
import { ValidationManagerConfigModifier } from "../Validation/ValidationManagerConfigModifier";
import { ServiceWithAccessorBase } from "./ServiceWithAccessorBase";
import { ValueHostConfig } from "../Interfaces/ValueHost";
import { IValidationManager } from "../Interfaces/ValidationManager";

/**
 * Factory to create the ManagerConfigModifier.
 */
export class ManagerConfigModifierFactory extends ServiceWithAccessorBase
    implements IManagerConfigModifierFactory {

    public create(manager: IValueHostsManager,
        existingValueHostConfigs: Map<string, ValueHostConfig>): IManagerConfigModifier<ValueHostsManagerConfig>
    {
        return new ValidationManagerConfigModifier(manager as IValidationManager, existingValueHostConfigs);
    }
}