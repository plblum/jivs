/**
 * Interface for a ManagerConfigBuilderFactory
 * @module ValueHost/Types/ManagerConfigBuilderFactory
 */

import { IManagerConfigBuilder } from "./ManagerConfigBuilder";
import { IService, IServicesAccessor } from "./Services";
import { ValueHostsManagerConfig } from "./ValueHostsManager";

/**
 * Interface for a ManagerConfigBuilderFactory
 */
export interface IManagerConfigBuilderFactory extends IService, IServicesAccessor {
/**
 * 
 * @param configToExtend When undefined, it will create a ManagerConfig object with the services
 * object that owns this factory. Otherwise, it uses this verbatim.
 */    
    create(configToExtend?: ValueHostsManagerConfig): IManagerConfigBuilder<ValueHostsManagerConfig>;
}