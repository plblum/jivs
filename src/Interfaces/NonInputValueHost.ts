import { IValueHost, IValueHostDescriptor, IValueHostState } from "./ValueHost";
/**
 * Interfaces that extend IValueHost to support ValueHosts without validation.
 * The NonInputValueHost is used in many situations:
 * - A value from the Model that is needed by validation
 * - A value external from the Model, such as a global, that is needed by validation
 * - When using ValidationManager as a Single Source of Truth, all values from the model
 *   that were not assigned to InputValueHosts
 * @module - NonInputValueHost_Interfaces
 */

export interface INonInputValueHost extends IValueHost {
}

/**
 * Elements of ValueHost that are stateful based on user interaction
 */
export interface INonInputValueHostState extends IValueHostState {
}

export interface INonInputValueHostDescriptor extends IValueHostDescriptor {
}    
