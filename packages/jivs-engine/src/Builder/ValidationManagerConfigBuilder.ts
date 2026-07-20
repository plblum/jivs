// /**
//  * @inheritDoc Builder/ConcreteClasses/ValidationManagerConfigBuilder!ValidationManagerConfigBuilder
//  * @module Builder/ConcreteClasses/ValidationManagerConfigBuilder
//  */

// import { ValueHostName } from "../DataTypes/BasicTypes";
// import { FieldValueHostConfig, TextValueChangedHandler } from "../Interfaces/FieldValueHost";
// import { IValidationManagerConfigBuilder } from "../Interfaces/ManagerConfigBuilder";
// import { IValidatorBuilder } from "../Interfaces/ChildBuilders";
// import { toIServicesAccessor } from "../Interfaces/Services";
// import { ValueHostValidationStateChangedHandler } from "../Interfaces/ValidatableValueHostBase";
// import { ValidationManagerConfig, ValidationManagerConfigChangedHandler, ValidationManagerInstanceState, ValidationManagerInstanceStateChangedHandler, ValidationStateChangedHandler } from "../Interfaces/ValidationManager";
// import { IValidationServices } from "../Interfaces/ValidationServices";
// import { ValueHostType } from "../Interfaces/ValueHostFactory";
// import { FluentFieldParameters, FluentFieldValueConfig, FluentValidatorsValueHostConfig, FluentValidatorsValueHostParameters } from "../Interfaces/Fluent";
// import { BuilderState } from "./ManagerConfigBuilderBase";
// import { ValidatableValueHostConfigBuilder } from "./ValueHostConfigBuilder"
// import { ValidatorsValueHostBaseConfig } from "../Interfaces/ValidatorsValueHostBase";
// import { assertNotNull } from "../Utilities/ErrorHandling";
// import { ManagerConfigBuilderBase } from "./ManagerConfigBuilderBase";
// import { ValueChangedHandler, ValueHostInstanceState, ValueHostInstanceStateChangedHandler } from "../Interfaces/ValueHost";

// /**
//  * Access point for using ValidationManagerConfigBuilder. It wraps an instance of ValueHostsManagerConfigBuilder
//  * and lets you start using its functions, which are often chained.
//  * We recommend that you choose another approach: create your own subclass of ModelRulesBase, 
//  * and use its builder property to configure your ValidationManagerConfig.
//  * @returns 
//  */
// export function createConfigBuilder(arg1: IValidationServices | ValidationManagerConfig): ValidationManagerConfigBuilder {
//     if (toIServicesAccessor(arg1)) {
//         let services = (arg1 as ValidationManagerConfig).services;
//         return services.buildersFactory.createManagerConfigBuilder(arg1 as ValidationManagerConfig) as ValidationManagerConfigBuilder;
//     }
//     let services = arg1 as IValidationServices;
//     return services.buildersFactory.createManagerConfigBuilder(null) as ValidationManagerConfigBuilder;
// }

// /**
//  * For building the ValidationManagerConfig
//  * 
//  * ```ts
//  * let builder = new ValidationManagerConfigBuilder(createValidationServices());
//  * builder.field('Field1').requireText();
//  * let vmConfig = builder.complete();
//  * 
//  * let vm = new ValidationManager(vmConfig);
//  * ```
//  * instead of
//  * ```ts
//  * let vmConfig: ValidationManagerConfig = {
//  *      services: createValidationServices(),
//  *      valueHostConfigs: [
//  *          {
//  *              valueHostType: ValueHostType.Field,
//  *              name: 'Field1',
//  *              validatorConfigs: [
//  *                  {
//  *                      conditionConfig: { conditionType: ConditionType.RequireText }
//  *                  }
//  *              ]
//  *          }
//  *      ]
//  * }
//  * 
//  * let vm = new ValidationManager(vmConfig);
//  * ```
//  */

// export class ValidationManagerConfigBuilder<T extends ValidationManagerConfig = ValidationManagerConfig> extends ManagerConfigBuilderBase<T>
//     implements IValidationManagerConfigBuilder<T> {
    
//     constructor(services: IValidationServices)
//     constructor(config: T)
//     constructor(state: BuilderState<T>)
//     constructor(arg1: IValidationServices | T | BuilderState<T>) {
//         super(arg1 as any);
//     }
//     public get services(): IValidationServices {
//         return this.baseConfig.services;
//     }
//     //#region InstanceState
//     /**
//      * @inheritDoc ValueHosts/Types/ValidationManager!ValidationManagerConfig.savedInstanceState
//      */
//     public get savedInstanceState(): ValidationManagerInstanceState | null {
//         return this.baseConfig.savedInstanceState ?? null;
//     }
//     public set savedInstanceState(value: ValidationManagerInstanceState | null) {
//         this.baseConfig.savedInstanceState = value;
//     }
//     /**
//      * @inheritDoc ValueHosts/Types/ValidationManager!ValidationManagerConfig.savedValueHostInstanceStates
//      */
//     public get savedValueHostInstanceStates(): Array<ValueHostInstanceState> | null {
//         return this.baseConfig.savedValueHostInstanceStates ?? null;
//     }
//     public set savedValueHostInstanceStates(value: Array<ValueHostInstanceState> | null) {
//         this.baseConfig.savedValueHostInstanceStates = value;
//     }
    
//     //#endregion InstanceState
//     protected createValueHostBuilder(): ValidatableValueHostConfigBuilder {
//         return new ValidatableValueHostConfigBuilder(this.destinationValueHostConfigs(), this.services);
//     }
//     //#region validation oriented ValueHost support
//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param valueHostName - the ValueHost name
//      * @param dataType - optional and can be null. The value for ValueHost.dataType.
//      * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
//      * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     public field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): IValidatorBuilder;
//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param valueHostName - the ValueHost name
//      * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
//      * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     public field(valueHostName: ValueHostName, parameters: FluentFieldParameters): IValidatorBuilder;
//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
//      * You can omit the valueHostType property.
//      * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     public field(config: FluentFieldValueConfig): IValidatorBuilder;
//     // overload resolution
//     public field(arg1: ValueHostName | FluentFieldValueConfig,
//         arg2?: FluentFieldParameters | string | null,
//         arg3?: FluentFieldParameters): IValidatorBuilder {
//         return this.addValidatorsValueHost<FieldValueHostConfig>(ValueHostType.Field, arg1, arg2, arg3);
//     }

//     //#region utilities for ValidationManager-based subclasses
//     // These utilities should all be protected. The ValidationManager subclass will create a public version of it.
//     /**
//      * Fluent format to create any ValueHostConfig based upon ValidatorsValueHostBaseConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * Protected because ValueHostManager does not support FieldValueHost. 
//      * ValidationManager offers a public interface.
//      * @param valueHostType - the ValueHostType to configure
//      * @param arg1 - either the ValueHost name for a multiparameter use or ValidatorsValueHostBaseConfig for a single parameter use.
//      * @param arg2 - optional and can be null. The value for ValueHost.dataType or FieldValueHostConfig.
//      * @param arg3 - optional. Any additional properties of a FieldValueHostConfig.
//      * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     protected addValidatorsValueHost<TVHConfig extends ValidatorsValueHostBaseConfig>(
//         valueHostType: ValueHostType | string,
//         arg1: Partial<TVHConfig> | ValueHostName,
//         arg2?: Partial<TVHConfig> | string | null,
//         arg3?: Partial<TVHConfig>): IValidatorBuilder {
//         this.assertNotDisposed();
//         assertNotNull(arg1, 'arg1');
//         let builder = this.createValueHostBuilder() as ValidatableValueHostConfigBuilder;
//         let config = builder.withValidators(valueHostType,
//             arg1 as FluentValidatorsValueHostConfig<TVHConfig> | ValueHostName,
//             arg2 as FluentValidatorsValueHostParameters<TVHConfig> | string | null,
//             arg3 as FluentValidatorsValueHostParameters<TVHConfig>);

//         this.applyConfig(config);
//         return this.services.buildersFactory.createValidatorBuilder(config);        
//   //    return builder;
//     }

//     //#endregion validation oriented ValueHost support


//     //#region IValidationManagerCallbacks
//     /**
//      * @inheritDoc ValueHosts/Types/ValueHost!IValueHostCallbacks.onValueHostInstanceStateChanged
//      */
//     public get onValueHostInstanceStateChanged(): ValueHostInstanceStateChangedHandler | null | undefined {
//         return this.baseConfig.onValueHostInstanceStateChanged;
//     }
//     public set onValueHostInstanceStateChanged(value: ValueHostInstanceStateChangedHandler | null) {
//         this.baseConfig.onValueHostInstanceStateChanged = value;
//     }
//     /**
//      * @inheritDoc ValueHosts/Types/ValueHost!IValueHostCallbacks.onValueChanged
//      */
//     public get onValueChanged(): ValueChangedHandler | null {
//         return this.baseConfig.onValueChanged ?? null;
//     }
//     public set onValueChanged(value: ValueChangedHandler | null) {
//         this.baseConfig.onValueChanged = value;
//     }

//     /**
//      * @inheritDoc ValueHosts/Types/ValidatableValueHostBase!IValidatableValueHostBaseCallbacks.onValueHostValidationStateChanged
//      */
//     public get onValueHostValidationStateChanged(): ValueHostValidationStateChangedHandler | null {
//         return this.baseConfig.onValueHostValidationStateChanged ?? null;
//     }
//     public set onValueHostValidationStateChanged(value: ValueHostValidationStateChangedHandler | null) {
//         this.baseConfig.onValueHostValidationStateChanged = value;
//     }

//     /**
//      * @inheritDoc ValidationManager/Types!IValidationManagerCallbacks.onValidationStateChanged
//      */
//     public get onValidationStateChanged(): ValidationStateChangedHandler | null {
//         return this.baseConfig.onValidationStateChanged ?? null;
//     }
//     public set onValidationStateChanged(value: ValidationStateChangedHandler | null) {
//         this.baseConfig.onValidationStateChanged = value;
//     }
//     /**
//      * @inheritDoc ValueHosts/Types/FieldValueHost!IFieldValueHostChangedCallback.onTextValueChanged
//      */
//     public get onTextValueChanged(): TextValueChangedHandler | null {
//         return this.baseConfig.onTextValueChanged ?? null;
//     }
//     public set onTextValueChanged(value: TextValueChangedHandler | null) {
//         this.baseConfig.onTextValueChanged = value;
//     }

//     /**
//      * @inheritDoc ValueHosts/Types/ValidationManager!IValidationManagerCallbacks.onInstanceStateChanged
//      */

//     public get onInstanceStateChanged(): ValidationManagerInstanceStateChangedHandler | null {
//         return this.baseConfig.onInstanceStateChanged ?? null;
//     }
//     public set onInstanceStateChanged(value: ValidationManagerInstanceStateChangedHandler | null) {
//         this.baseConfig.onInstanceStateChanged = value;
//     }

//     /**
//      * @inheritDoc ValueHosts/Types/ValidationManager!IValidationManagerCallbacks.onConfigChanged
//      */
//     public get onConfigChanged(): ValidationManagerConfigChangedHandler | null {
//         return this.baseConfig.onConfigChanged ?? null;
//     }
//     public set onConfigChanged(value: ValidationManagerConfigChangedHandler | null) {
//         this.baseConfig.onConfigChanged = value;
//     }
  
//     /**
//      * @inheritDoc ValidationManager/Types!IValidationManagerCallbacks.notifyValidationStateChangedDelay
//      */
//     public get notifyValidationStateChangedDelay(): number {
//         return this.baseConfig.notifyValidationStateChangedDelay ?? 0;
//     }
//     public set notifyValidationStateChangedDelay(value: number) {
//         this.baseConfig.notifyValidationStateChangedDelay = value;
//     }
//     //#endregion IValidationManagerCallbacks
// }


