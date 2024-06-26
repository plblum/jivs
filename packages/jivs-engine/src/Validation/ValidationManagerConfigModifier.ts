/**
 * Used by ValidationManager.startModifying() function to modify the ValidationManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * It makes changes through ValidationManager.addOrMergeValueHost().
 * @module ValidationManager/ConcreteClasses/ValidationManagerConfigModifier
 */

import { IValidationManager, ValidationManagerConfig } from "../Interfaces/ValidationManager";
import { ValidatorConfig } from '../Interfaces/Validator';
import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';
import { FluentConditionBuilder, FluentInputParameters, FluentInputValueConfig, FluentPropertyParameters, FluentPropertyValueConfig, FluentValidatorBuilder, ValidationManagerStartFluent } from '../ValueHosts/Fluent';
import { ValueHostsManagerConfigModifier } from "../ValueHosts/ValueHostsManagerConfigModifier";
import { ValueHostConfig } from '../Interfaces/ValueHost';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { resolveErrorCode } from "../Utilities/Validation";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { IValidationManagerConfigModifier } from "../Interfaces/ManagerConfigModifier";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { InputValueHostConfig } from "../Interfaces/InputValueHost";
import { PropertyValueHostConfig } from "../Interfaces/PropertyValueHost";
import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { ConditionConfig } from "../Interfaces/Conditions";
import { CombineUsingCondition } from "../ValueHosts/ManagerConfigBuilderBase";

/**
 * Used by ValidationManager.startModifying() function to modify the ValidationManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * It makes changes through ValidationManager.addOrMergeValueHost().
 */
export class ValidationManagerConfigModifier extends ValueHostsManagerConfigModifier<ValidationManagerConfig>
    implements IValidationManagerConfigModifier<ValidationManagerConfig>
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
        return new ValidationManagerStartFluent(this.destinationValueHostConfigs(), this.services);
    }        
    //#region validation oriented ValueHost support
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    public input(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorBuilder;

    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    public input(valueHostName: ValueHostName, parameters: FluentInputParameters): FluentValidatorBuilder;    
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    public input(config: FluentInputValueConfig): FluentValidatorBuilder;
    // overload resolution
    public input(arg1: ValueHostName | FluentInputValueConfig, arg2?: FluentInputParameters | string | null, arg3?: FluentInputParameters): FluentValidatorBuilder {
        let { valueHostName, dataType, propsToUpdate } = this.prepUpdateValueHostParameters(ValueHostType.Input, arg1, arg2, arg3);        
        return this.addValidatorsValueHost<InputValueHostConfig>(ValueHostType.Input, valueHostName, dataType, propsToUpdate);
    }

    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    public property(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    public property(valueHostName: ValueHostName, parameters: FluentPropertyParameters): FluentValidatorBuilder;    
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire PropertyValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    public property(config: FluentPropertyValueConfig): FluentValidatorBuilder;
    // overload resolution
    public property(arg1: ValueHostName | FluentPropertyValueConfig, arg2?: FluentPropertyParameters | string | null, parameters?: FluentPropertyParameters): FluentValidatorBuilder {
        let { valueHostName, dataType, propsToUpdate } = this.prepUpdateValueHostParameters(ValueHostType.Property, arg1, arg2, parameters);        
        return this.addValidatorsValueHost<PropertyValueHostConfig>(ValueHostType.Property, valueHostName, dataType, propsToUpdate);
    }
    //#endregion validation oriented ValueHost support

    /**
     * If it finds the validator with the errorcode specified, it will combine the condition with the existing condition
     * using a rule supplied or callback to let you create a conditionConfig.
     * If it the validator is not found, it will throw an error and log.
     * If the ValueHost is on an earlier override or baseConfig, a new entry is made in the current override,
     * reflecting the same data as earlier, but now with a modified validator.
     * If the ValueHost is on the current override, the existing entry is modified.
     *
     * The resulting ValidatorConfig's errorCode will not have changed from the original 
     * to ensure it aligns with everything depending on the original error code.
     * @param valueHostName 
     * @param errorCode 
     * @param builderFn - A function to create a conditionConfig that will replace the existing. 
     * You are passed a Builder object, where you can build your new conditions, 
     * and the existing conditionConfig,
     * which can be added to a Builder object with the conditionConfig() function.
     * ```ts
     * modifier.combineWithRule('Field1', 'NotNull', 
     *   (combiningBuilder, existingConditionConfig)=> {
     *      combiningBuilder.when(
     *                  (enablerBuilder)=> enablerBuilder.equalToValue('YES', 'Field2'),
     *                  (childBuilder)=> childBuilder.conditionConfig(existingConditionConfig));
     * });
     * ```
     */
    public combineWithRule(valueHostName: ValueHostName, errorCode: string,
        builderFn: (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => void): ValidationManagerConfigModifier;
    /**
     * Uses the combineUsing parameter to determine how to combine the conditions.
     * @param valueHostName 
     * @param errorCode 
     * @param combineUsing 
     * @param builderFn - A function to create the condition that you want 
     * to combine with the existing condition.
     * ```ts
     * modifier.combineWithRule('Field1', 'NotNull', CombineUsingCondition.When, 
     *    (combiningBuilder)=> combiningBuilder.equalToValue('YES', 'Field2'));
     * ```
     */
    public combineWithRule(valueHostName: ValueHostName, errorCode: string, combineUsing: CombineUsingCondition,
        builderFn: (combiningBuilder: FluentConditionBuilder) => void): ValidationManagerConfigModifier

    public combineWithRule(valueHostName: ValueHostName, errorCode: string,
        arg3: CombineUsingCondition | ((combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => void),
        arg4?: (combiningBuilder: FluentConditionBuilder) => void): ValidationManagerConfigModifier {
        let { vhc, vc } = this.setupValueHostToCombine(valueHostName, errorCode);   // throws if not found
        this.combineWithValidatorConfig(vc, arg3, arg4);
        return this;
    }

    /**
     * Replace the condition supplying the replacement conditionConfig directly.
     * If it finds the validator with the errorcode specified, it will replace the condition with the existing condition.
     * If not, it logs and throws an error.
     * If the ValueHost is on an earlier override or baseConfig, a new entry is made in the current override,
     * reflecting the same data as earlier, but now with a modified validator.
     * If the ValueHost is on the current override, the existing entry is modified.
     *
     * The resulting ValidatorConfig's errorCode will not have changed from the original 
     * to ensure it aligns with everything depending on the original error code.
     * @param valueHostName 
     * @param errorCode 
     * @param conditionConfig - provide a complete ConditionConfig as the replacement
     */
    public replaceRule(valueHostName: ValueHostName, errorCode: string, conditionConfig: ConditionConfig): ValidationManagerConfigModifier
    /** 
     * Replace supplying the replacement condition through a Builder object.
     * @param valueHostName 
     * @param errorCode 
     * @param builderFn
     * Use a function to create a conditionConfig that will replace the existing. You are
     * passed the builder, where you can build your new conditions.
     */    
    public replaceRule(valueHostName: ValueHostName, errorCode: string, builderFn: (replacementBuilder: FluentConditionBuilder) => void): ValidationManagerConfigModifier
    public replaceRule(valueHostName: ValueHostName, errorCode: string,
        sourceOfConditionConfig: ConditionConfig | ((replacementBuilder: FluentConditionBuilder) => void)): ValidationManagerConfigModifier {
        let { vhc, vc } = this.setupValueHostToCombine(valueHostName, errorCode);   // throws if not found
        this.replaceConditionWith(vc, sourceOfConditionConfig);
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
            name: existingVHConfig.name,
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
    public addValidatorsTo(valueHostName: ValueHostName): FluentValidatorBuilder {
        assertNotNull(valueHostName, 'valueHostName');  
        let existingVHConfig = this.getExistingValueHostConfig(valueHostName, true)! as ValidatorsValueHostBaseConfig;
        if (existingVHConfig['validatorConfigs'] === undefined)
            throw new CodingError(`ValueHost name "${valueHostName}" does not support validators.`);

        // create ValidatorConfig designed to be added into an existing ValueHost
        // so long as the Validator doesn't already exist there

        let replacementVHConfig: ValidatorsValueHostBaseConfig = {
            valueHostType: existingVHConfig.valueHostType,
            name: existingVHConfig.name,
            validatorConfigs: []
        };
        this.applyConfig(replacementVHConfig);
        return new FluentValidatorBuilder(replacementVHConfig);
    }

}