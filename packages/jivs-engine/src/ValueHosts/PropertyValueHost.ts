/**
 * {@inheritDoc PropertyValueHost}
 * @module ValueHosts/ConcreteClasses/PropertyValueHost
 */
import { IPropertyValueHost, PropertyValueHostConfig, PropertyValueHostInstanceState } from '../Interfaces/PropertyValueHost';
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ValidatorsValueHostBase, ValidatorsValueHostBaseGenerator } from './ValidatorsValueHostBase';
import { InputValueHost, hasIInputValueHostSpecificMembers } from './InputValueHost';


/**
 * ValueHost implementation that does not handle validation. (See InputValueHost for validation)
 * Use ValueHostConfig.valueHostType = "Property" for the ValidationManager to use this class.
 * 
 * Generally create these when:
 * - Expose a value from the UI that doesn't need validation, but its value is used by 
 *   other validators.
 * - Expose a global value - something not part of the form - that can be used by your
 *   Conditions, such as the current Country code used to select the right regular expression
 *   for postal codes, phone numbers, etc.
 * - Store all of the remaining members of your Model. Makes ValidationManager's ValueHosts
 *   your ---Single Source of Truth (SSOT)--- for that Model.
 *   When working with a Model, you will need to write code that transfers the Model's property values
 *   into the UI elements. Since ValidationManager needs those same values, you can build
 *   your input fields/elements to get their value from ValidationManager and upon change, provide
 *   the new values back.
 */
export class PropertyValueHost extends ValidatorsValueHostBase<PropertyValueHostConfig, PropertyValueHostInstanceState>
    implements IPropertyValueHost
{
    constructor(valueHostsManager: IValueHostsManager, config: PropertyValueHostConfig, state: PropertyValueHostInstanceState)
    {
        super(valueHostsManager, config, state);
    }

    /**
     * The actual property name on the model. If its the same as Config.name,
     * this can be undefined.
     * Helps mapping between model and valuehost.
     */
    public getPropertyName(): string
    {
        return this.config.propertyName ?? this.getName();
    }
  
}

/**
 * Supports PropertyValueHost class. Used when the Config.valueHostType = ValueHostType.Property
 */
export class PropertyValueHostGenerator extends ValidatorsValueHostBaseGenerator {

    public canCreate(config: PropertyValueHostConfig): boolean {
        return config.valueHostType === ValueHostType.Property;
    }
    public create(valueHostsManager: IValueHostsManager, config: PropertyValueHostConfig, state: PropertyValueHostInstanceState): IPropertyValueHost {
        return new PropertyValueHost(valueHostsManager, config, state);
    }
}

/**
 * Determines if the object implements IPropertyValueHost.
 * @param source 
 * @returns source typecasted to IPropertyValueHost if appropriate or null if not.
 */
export function toIPropertyValueHost(source: any): IPropertyValueHost | null {
    if (source instanceof PropertyValueHost)
        return source as IPropertyValueHost;
    if (source instanceof InputValueHost)
        return null;    
    // defenses for class types that are compatible but offer no different members
    if (toIValidatorsValueHostBase(source) &&
        !hasIInputValueHostSpecificMembers(source) &&
        hasIPropertyValueHostSpecificMembers(source))
            return source as IPropertyValueHost;
    return null;
}
/**
 * Returns true when it finds members introduced on IPropertyValueHost.
 * @param source 
 * @returns 
 */
export function hasIPropertyValueHostSpecificMembers(source: IValidatorsValueHostBase): boolean
{
    let test = source as IPropertyValueHost;
    return (test.getPropertyName !== undefined);
}