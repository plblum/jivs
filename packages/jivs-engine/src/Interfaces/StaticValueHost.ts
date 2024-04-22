/**
 * Interfaces that extend IValueHost to support ValueHosts without validation.
 * The StaticValueHost is used in many situations:
 * - A value from the Model that is needed by validation
 * - A value external from the Model, such as a global, that is needed by validation
 * - When using ValidationManager as a Single Source of Truth, all values from the model
 *   that were not assigned to InputValueHosts
 * @module ValueHosts/Types/StaticValueHost
 */

import { IValueHost, ValueHostConfig, ValueHostState } from './ValueHost';

export interface IStaticValueHost extends IValueHost {
}

/**
 * State for StaticValueHost
 */
export interface StaticValueHostState extends ValueHostState {
}

/**
 * Config for configuring StaticValueHost
 */
export interface StaticValueHostConfig extends ValueHostConfig {
}    
