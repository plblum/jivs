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
import { ValueHostsManagerConfigModifier } from "../ValueHosts/ValueHostsManagerConfigModifier";

/**
 * Factory to create the ManagerConfigModifier for ValueHostsManager.
 */
export class ValueHostsManagerConfigModifierFactory extends ServiceWithAccessorBase
    implements IManagerConfigModifierFactory {

    public create(manager: IValueHostsManager,
        existingValueHostConfigs: Map<string, ValueHostConfig>): IManagerConfigModifier<ValueHostsManagerConfig>
    {
        return new ValueHostsManagerConfigModifier(manager as IValidationManager, existingValueHostConfigs);
    }
}

/**
 * Factory to create the ManagerConfigModifier for ValidationManager.
 */
export class ValidationManagerConfigModifierFactory extends ServiceWithAccessorBase
    implements IManagerConfigModifierFactory {

    public create(manager: IValueHostsManager,
        existingValueHostConfigs: Map<string, ValueHostConfig>): IManagerConfigModifier<ValueHostsManagerConfig>
    {
        return new ValidationManagerConfigModifier(manager as IValidationManager, existingValueHostConfigs);
    }
}