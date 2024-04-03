/**
 * Interfaces that extend IValueHost to support ValueHosts without validation.
 * The NonInputValueHost is used in many situations:
 * - A value from the Model that is needed by validation
 * - A value external from the Model, such as a global, that is needed by validation
 * - When using ValidationManager as a Single Source of Truth, all values from the model
 *   that were not assigned to InputValueHosts
 * @module ValueHosts/Types/NonInputValueHost
 */

import { IValueHost, ValueHostDescriptor, ValueHostState } from './ValueHost';

export interface INonInputValueHost extends IValueHost {
}

/**
 * State for NonInputValueHost
 */
export interface NonInputValueHostState extends ValueHostState {
}

/**
 * Descriptor for configuring NonInputValueHost
 */
export interface NonInputValueHostDescriptor extends ValueHostDescriptor {
}    
