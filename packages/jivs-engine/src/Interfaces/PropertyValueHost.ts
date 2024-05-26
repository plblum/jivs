/**
 * Interfaces that extend IValueHost to properties on a model.
 * It supports validation and its value must be compatible
 * with the property on the model.
 * @module ValueHosts/Types/PropertyValueHost
 */

import { IValidatorsValueHostBase, ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState } from './ValidatorsValueHostBase';

/**
 * Interface for a ValueHost used to manage and validate properties on a model.
 * 
 * Business logic needs to be able to describe each property and its validators.
 * Its rules are expected to be converted into PropertyValueHosts with Jiv's validators.
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
