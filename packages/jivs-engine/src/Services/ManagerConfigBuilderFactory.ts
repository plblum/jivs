/**
 * Factory to create the ManagerConfigBuilder.
 * @module ValueHost/Types/ManagerConfigBuilderFactory
 */

import { IManagerConfigBuilderFactory } from "../Interfaces/ManagerConfigBuilderFactory";
import { IManagerConfigBuilder } from "../Interfaces/ManagerConfigBuilder";
import { ValueHostsManagerConfig } from "../Interfaces/ValueHostsManager";
import { ValidationManagerConfigBuilder } from "../Validation/ValidationManagerConfigBuilder";
import { ServiceWithAccessorBase } from "./ServiceWithAccessorBase";
import { ValidationManagerConfig } from "../Interfaces/ValidationManager";
import { ValueHostsManagerConfigBuilder } from "../ValueHosts/ValueHostsManagerConfigBuilder";

/**
 * Factory to create the ManagerConfigBuilder for ValueHostsManager.
 */
export class ValueHostsManagerConfigBuilderFactory extends ServiceWithAccessorBase
    implements IManagerConfigBuilderFactory {

/**
 * 
 * @param configToExtend When undefined, it will create a ManagerConfig object with the services
 * object that owns this factory. Otherwise, it uses this verbatim.
 */    
    public create(configToExtend?: ValueHostsManagerConfig): IManagerConfigBuilder<ValueHostsManagerConfig>
    {
        return new ValueHostsManagerConfigBuilder(configToExtend as ValidationManagerConfig ?? this.services);
    }
}

/**
 * Factory to create the ManagerConfigBuilder for ValidationManager.
 */
export class ValidationManagerConfigBuilderFactory extends ServiceWithAccessorBase
    implements IManagerConfigBuilderFactory {

/**
 * 
 * @param configToExtend When undefined, it will create a ManagerConfig object with the services
 * object that owns this factory. Otherwise, it uses this verbatim.
 */    
    public create(configToExtend?: ValueHostsManagerConfig): IManagerConfigBuilder<ValueHostsManagerConfig>
    {
        return new ValidationManagerConfigBuilder(configToExtend as ValidationManagerConfig ?? this.services);
    }
}