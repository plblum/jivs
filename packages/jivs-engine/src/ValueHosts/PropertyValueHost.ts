/**
 * {@inheritDoc PropertyValueHost}
 * @module ValueHosts/ConcreteClasses/PropertyValueHost
 */
import { IPropertyValueHost, PropertyValueHostConfig, PropertyValueHostInstanceState } from '../Interfaces/PropertyValueHost';
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { ValidatorsValueHostBase, ValidatorsValueHostBaseGenerator } from './ValidatorsValueHostBase';
import { InputValueHost, hasIInputValueHostSpecificMembers } from './InputValueHost';
import { ValueHostConfig } from '../Interfaces/ValueHost';
import { IValidationManager } from '../Interfaces/ValidationManager';


/**
 * ValueHost used to manage and validate properties on a model.
 * Each valuehost's native value is expected to be the same as the actual
 * property on the model. For example, if the model has an integer property,
 * the value must be a number that does not contain any decimal information.
 * This ValueHost is a sibling of InputValueHost, which is used to manage and validate
 * inputs.
 * 
 * Business logic needs to be able to describe each property and its validators.
 * Its rules are expected to be converted into PropertyValueHosts with Jiv's validators.
 * 
 * There is an interesting use case: the UI can ask for business logic to build the 
 * ValueHosts it uses, but the UI really wants InputValueHosts.
 * You can setup the ValidationServices so that each ValueHost created by business
 * logic will be converted into an InputValueHost.
 * Just set the ValidationServices.valueHostFactor = new InputValueHostFactory()
 * or pass 'client' into the createValidationServices() function.
 */
export class PropertyValueHost extends ValidatorsValueHostBase<PropertyValueHostConfig, PropertyValueHostInstanceState>
    implements IPropertyValueHost
{
    constructor(validationManager: IValidationManager, config: PropertyValueHostConfig, state: PropertyValueHostInstanceState)
    {
        super(validationManager, config, state);
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

    public canCreate(config: ValueHostConfig): boolean {
        return config.valueHostType === ValueHostType.Property;
    }
    public create(validationManager: IValidationManager, config: PropertyValueHostConfig, state: PropertyValueHostInstanceState): IPropertyValueHost {
        return new PropertyValueHost(validationManager, config, state);
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