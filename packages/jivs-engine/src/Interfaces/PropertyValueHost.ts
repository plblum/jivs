/**
 * Interfaces that extend IValueHost to properties on a model.
 * It supports validation and its value must be compatible
 * with the property on the model.
 * @module ValueHosts/Types/PropertyValueHost
 */

import { IValidatorsValueHostBase, ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState } from './ValidatorsValueHostBase';

/**
 * Interface for ValueHost that handles a single property on a model.
 * It supports validation and its value must be compatible
 * with the property on the model.
 */
export interface IPropertyValueHost extends IValidatorsValueHostBase {
    /**
     * The actual property name on the model. If its the same as Config.name,
     * this can be undefined.
     * Helps mapping between model and valuehost.
     */
    getPropertyName(): string;    
}

/**
 * InstanceState for PropertyValueHost
 */
export interface PropertyValueHostInstanceState extends ValidatorsValueHostBaseInstanceState {
}

/**
 * Config for configuring PropertyValueHost
 */
export interface PropertyValueHostConfig extends ValidatorsValueHostBaseConfig {
    /**
     * The actual property name on the model. If its the same as Config.name,
     * this can be undefined.
     * Helps mapping between model and valuehost.
     */
    propertyName?: string;
}    
