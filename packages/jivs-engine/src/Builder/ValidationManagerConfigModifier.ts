// /**
//  * Used by ValidationManager.startModifying() function to modify the ValidationManagerConfig.valueHostConfigs array.
//  * It does not change the original until you call its apply() function.
//  * It makes changes through ValidationManager.addOrMergeValueHost().
//  * @module ValidationManager/ConcreteClasses/ValidationManagerConfigModifier
//  */

// import { ValueHostName } from '../DataTypes/BasicTypes';
// import { IFluentValidatorBuilder } from "../Interfaces/ChildBuilders";
// import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
// import {
//     FluentFieldParameters, FluentFieldValueConfig
// } from '../Interfaces/Fluent';
// import { IValidationManagerConfigModifier } from "../Interfaces/ManagerConfigModifier";
// import { IValidationManager, ValidationManagerConfig } from "../Interfaces/ValidationManager";
// import { IValidationServices } from "../Interfaces/ValidationServices";
// import { ValidatorConfig } from '../Interfaces/Validator';
// import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
// import { ValueHostConfig } from '../Interfaces/ValueHost';
// import { ValueHostType } from "../Interfaces/ValueHostFactory";
// import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';
// import { resolveErrorCode } from "../Utilities/Validation";
// import { ValidationManagerStartFluent } from "./StartFluent_classes";
// import { ValueHostsManagerConfigModifier } from "./ValueHostsManagerConfigModifier";

// /**
//  * Used by ValidationManager.startModifying() function to modify the ValidationManagerConfig.valueHostConfigs array.
//  * It does not change the original until you call its apply() function.
//  * It makes changes through ValidationManager.addOrMergeValueHost().
//  */
// export class ValidationManagerConfigModifier
//     extends ValueHostsManagerConfigModifier<ValidationManagerConfig>
//     implements IValidationManagerConfigModifier<ValidationManagerConfig>
// {
//     /**
//      * Expected to be called internally by ValueHostsManager/ValidationManager, which supplies
//      * the current ValueHostsConfig object. It will be cloned, and not modified directly.
//      * @param manager
//      */
//     constructor(manager: IValidationManager, existingValueHostConfigs: Map<string, ValueHostConfig>) {
//         super(manager, existingValueHostConfigs);
//     }
//     public get services(): IValidationServices {
//         return this.baseConfig.services;
//     }    
//     protected createFluent(): ValidationManagerStartFluent
//     {
//         return new ValidationManagerStartFluent(this.destinationValueHostConfigs(), this.services);
//     }        
//     //#region validation oriented ValueHost support
//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param valueHostName - the ValueHost name
//      * @param dataType - optional and can be null. The value for ValueHost.dataType.
//      * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
//      * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     public field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): IFluentValidatorBuilder;

//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param valueHostName - the ValueHost name
//      * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
//      * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     public field(valueHostName: ValueHostName, parameters: FluentFieldParameters): IFluentValidatorBuilder;    
//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
//      * You can omit the valueHostType property.
//      * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     public field(config: FluentFieldValueConfig): IFluentValidatorBuilder;
//     // overload resolution
//     public field(arg1: ValueHostName | FluentFieldValueConfig, arg2?: FluentFieldParameters | string | null, arg3?: FluentFieldParameters): IFluentValidatorBuilder {
//         let { valueHostName, dataType, propsToUpdate } = this.prepUpdateValueHostParameters(ValueHostType.Field, arg1, arg2, arg3);        
//         return this.addValidatorsValueHost<FieldValueHostConfig>(ValueHostType.Field, valueHostName, dataType, propsToUpdate);
//     }

//     /**
//      * Replace any of the ValidatorConfig properties supported by UI (most are).
//      * Not supported (in the domain of the business logic): 'errorCode', 'conditionConfig', 'conditionCreator'
//      * @param valueHostName 
//      * @param errorCode
//      * @param propsToUpdate 
//      * @returns Same instance for chaining.
//      */    
//     public updateValidator(valueHostName: ValueHostName, errorCode: string, propsToUpdate: Partial<Omit<ValidatorConfig, 'validatorType' | 'conditionConfig' | 'conditionCreator' | 'errorCode'>>):
//         ValidationManagerConfigModifier
//     {
//         assertNotNull(valueHostName, 'valueHostName');  
//         assertNotNull(propsToUpdate, 'propsToUpdate');
//         let existingVHConfig = this.getExistingValueHostConfig(valueHostName, true)! as ValidatorsValueHostBaseConfig;
//         if (existingVHConfig['validatorConfigs'] === undefined)
//             throw new CodingError(`ValueHost name "${valueHostName}" does not support validators.`);

//         // create config designed to be merged with existing ValidatorConfig
//         // on an existing ValueHost.

//         let replacementVHConfig: ValidatorsValueHostBaseConfig = {
//             // enough for merge to know what to merge with
//             valueHostType: existingVHConfig.valueHostType,
//             name: existingVHConfig.name,
//             validatorConfigs: []
//         };        
//         let ivConfig = existingVHConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode) ?? null;
//         if (ivConfig === null)
//             throw new CodingError(`ValueHost name "${valueHostName}" with errorCode ${errorCode} is not defined.`);
        
//         let noChangeNames = this.services.validatorConfigMergeService.getNoChangePropertyNames();   // note: internally caches the result
//         noChangeNames.forEach((propName) => delete (propsToUpdate as any)[propName]);
//         delete (propsToUpdate as any)['conditionConfig'];   // not handled by updateValidator. Use actual conditions for these adjustments

//         let updateValidatorConfig: ValidatorConfig = {
//             conditionConfig: ivConfig.conditionConfig,
//             ...propsToUpdate
//         };
//         replacementVHConfig.validatorConfigs!.push(updateValidatorConfig);
//         this.applyConfig(replacementVHConfig);

//         return this;
//     }    

//     /**
//      * Add one or more validators to valueHostName using fluent syntax.
//      * ```ts
//      * let modifier = vm.startModifying();
//      * modifier.addValidatorsTo('Field1').requireText().regExp('expression');
//      * ```
//      * @param valueHostName 
//      * @returns 
//      */
//     public addValidatorsTo(valueHostName: ValueHostName): IFluentValidatorBuilder {
//         assertNotNull(valueHostName, 'valueHostName');  
//         let existingVHConfig = this.getExistingValueHostConfig(valueHostName, true)! as ValidatorsValueHostBaseConfig;
//         if (existingVHConfig['validatorConfigs'] === undefined)
//             throw new CodingError(`ValueHost name "${valueHostName}" does not support validators.`);

//         // create ValidatorConfig designed to be added into an existing ValueHost
//         // so long as the Validator doesn't already exist there

//         let replacementVHConfig: ValidatorsValueHostBaseConfig = {
//             valueHostType: existingVHConfig.valueHostType,
//             name: existingVHConfig.name,
//             validatorConfigs: []
//         };
//         this.applyConfig(replacementVHConfig);
//         return this.services.fluentFactory.createFluentValidatorBuilder(replacementVHConfig);
//     }

// }