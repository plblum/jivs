/**
 * Used by ValidationManager.startModifying() function to modify the ValidationManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * It makes changes through ValidationManager.addOrMergeValueHost().
 * @module ValidationManager/ConcreteClasses/ValidationManagerConfigModifier
 */

import { IValidationManager, ValidationManagerConfig } from "../Interfaces/ValidationManager";
import { ValidatorConfig } from '../Interfaces/Validator';
import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';
import { FluentInputParameters, FluentInputValueConfig, FluentPropertyParameters, FluentPropertyValueConfig, FluentValidatorCollector, ValidationManagerStartFluent } from '../ValueHosts/Fluent';
import { ValueHostsManagerConfigModifier } from "../ValueHosts/ValueHostsManagerConfigModifier";
import { ValueHostConfig } from '../Interfaces/ValueHost';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { InputValueHostConfig } from '../Interfaces/InputValueHost';
import { PropertyValueHostConfig } from '../Interfaces/PropertyValueHost';
import { resolveErrorCode } from "../Utilities/Validation";
import { IValidationServices } from "../Interfaces/ValidationServices";
/**
 * Used by ValidationManager.startModifying() function to modify the ValidationManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * It makes changes through ValidationManager.addOrMergeValueHost().
 */
export class ValidationManagerConfigModifier extends ValueHostsManagerConfigModifier<ValidationManagerConfig>
{
    /**
     * Expected to be called internally by ValueHostsManager/ValidationManager, which supplies
     * the current ValueHostsConfig object. It will be cloned, and not modified directly.
     * @param manager
     */
    constructor(manager: IValidationManager, existingValueHostConfigs: Map<string, ValueHostConfig>) {
        super(manager, existingValueHostConfigs);
    }
    protected get services(): IValidationServices {
        return this.baseConfig.services;
    }    
    protected createFluent(): ValidationManagerStartFluent
    {
        return new ValidationManagerStartFluent(this.destinationConfig());
    }        
    //#region validation oriented ValueHost support
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorCollector for chaining validators to initial InputValueHost
     */
    public input(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorCollector for chaining validators to initial InputValueHost
     */
    public input(config: FluentInputValueConfig): FluentValidatorCollector;
    // overload resolution
    public input(arg1: ValueHostName | FluentInputValueConfig, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector {
        return this.addInputValueHost(this.createFluent(), arg1, dataType, parameters);
    }

    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     * @returns FluentValidatorCollector for chaining validators to initial PropertyValueHost
     */
    public property(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorCollector;
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire PropertyValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorCollector for chaining validators to initial PropertyValueHost
     */
    public property(config: FluentPropertyValueConfig): FluentValidatorCollector;
    // overload resolution
    public property(arg1: ValueHostName | FluentPropertyValueConfig, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorCollector {
        return this.addPropertyValueHost(this.createFluent(), arg1, dataType, parameters);
    }
    //#endregion validation oriented ValueHost support
    
    /**
     * Update an InputValueHost with the InputValueHostConfig properties supplied.
     * Not supported: 'valueHostType', 'name', 'validatorConfigs'
     * @param valueHostName 
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */
    public updateInput(valueHostName: string, propsToUpdate: Partial<Omit<InputValueHostConfig, 'valueHostType' | 'name' | 'validatorConfigs'>>):
        ValidationManagerConfigModifier
    {
        this.updateValueHost<InputValueHostConfig>(ValueHostType.Input, valueHostName, propsToUpdate);
        return this;
    }

    /**
     * Update an PropertyValueHost with the PropertyValueHostConfig properties supplied.
     * Not supported: 'valueHostType', 'name', 'validatorConfigs'
     * @param valueHostName 
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */
    public updateProperty(valueHostName: string, propsToUpdate: Partial<Omit<PropertyValueHostConfig, 'valueHostType' | 'name' | 'validatorConfigs'>>):
        ValidationManagerConfigModifier
    {
        this.updateValueHost<PropertyValueHostConfig>(ValueHostType.Property, valueHostName, propsToUpdate);
        return this;
    }

    /**
     * Replace any of the ValidatorConfig properties supported by UI (most are).
     * Not supported (in the domain of the business logic): 'errorCode', 'conditionConfig', 'conditionCreator'
     * @param valueHostName 
     * @param errorCode
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */    
    public updateValidator(valueHostName: ValueHostName, errorCode: string, propsToUpdate: Partial<Omit<ValidatorConfig, 'validatorType' | 'conditionConfig' | 'conditionCreator' | 'errorCode'>>):
        ValidationManagerConfigModifier
    {
        assertNotNull(valueHostName, 'valueHostName');  
        assertNotNull(propsToUpdate, 'propsToUpdate');
        let existingVHConfig = this.getExistingValueHostConfig(valueHostName, true)! as ValidatorsValueHostBaseConfig;
        if (existingVHConfig['validatorConfigs'] === undefined)
            throw new CodingError(`ValueHost name "${valueHostName}" does not support validators.`);

        // create config designed to be merged with existing ValidatorConfig
        // on an existing ValueHost.

        let replacementVHConfig: ValidatorsValueHostBaseConfig = {
            // enough for merge to know what to merge with
            valueHostType: existingVHConfig.valueHostType,
            name: existingVHConfig?.name,
            validatorConfigs: []
        };        
        let ivConfig = existingVHConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode) ?? null;
        if (ivConfig === null)
            throw new CodingError(`ValueHost name "${valueHostName}" with errorCode ${errorCode} is not defined.`);
        
        let noChangeNames = this.services.validatorConfigMergeService.getNoChangePropertyNames();   // note: internally caches the result
        noChangeNames.forEach((propName) => delete (propsToUpdate as any)[propName]);
        delete (propsToUpdate as any)['conditionConfig'];   // not handled by updateValidator. Use actual conditions for these adjustments

        let updateValidatorConfig: ValidatorConfig = {
            conditionConfig: ivConfig.conditionConfig,
            ...propsToUpdate
        };
        replacementVHConfig.validatorConfigs!.push(updateValidatorConfig);
        this.applyConfig(replacementVHConfig);

        return this;
    }    

    /**
     * Add one or more validators to valueHostName using fluent syntax.
     * ```ts
     * let modifier = vm.startModifying();
     * modifier.addValidatorsTo('Field1').requireText().regExp('expression');
     * ```
     * @param valueHostName 
     * @returns 
     */
    public addValidatorsTo(valueHostName: ValueHostName): FluentValidatorCollector {
        assertNotNull(valueHostName, 'valueHostName');  
        let existingVHConfig = this.getExistingValueHostConfig(valueHostName, true)! as ValidatorsValueHostBaseConfig;
        if (existingVHConfig['validatorConfigs'] === undefined)
            throw new CodingError(`ValueHost name "${valueHostName}" does not support validators.`);

        // create ValidatorConfig designed to be added into an existing ValueHost
        // so long as the Validator doesn't already exist there

        let replacementVHConfig: ValidatorsValueHostBaseConfig = {
            valueHostType: existingVHConfig.valueHostType,
            name: existingVHConfig?.name,
            validatorConfigs: []
        };
        this.applyConfig(replacementVHConfig);
        return new FluentValidatorCollector(replacementVHConfig);
    }

}