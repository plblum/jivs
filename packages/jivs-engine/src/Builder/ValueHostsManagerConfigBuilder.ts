// /**
//  * @inheritDoc ValueHosts/ConcreteClasses/ValueHostsManagerConfigBuilder!ValueHostsManagerConfigBuilder:class
//  * @module ValueHosts/ConcreteClasses/ValueHostsManagerConfigBuilder
//  */

// import { ValueHostConfigBuilder } from "./ValueHostConfigBuilder";
// import { TextValueChangedHandler } from "../Interfaces/FieldValueHost";
// import { BuilderState, ManagerConfigBuilderBase } from "./ManagerConfigBuilderBase";
// import { ValueChangedHandler, ValueHostInstanceState, ValueHostInstanceStateChangedHandler } from "../Interfaces/ValueHost";
// import { IValueHostsManagerConfigBuilder } from "../Interfaces/ManagerConfigBuilder";
// import { IValidationServices } from "../Interfaces/ValidationServices";
// import { ValidationManagerConfig, ValidationManagerConfigChangedHandler, ValidationManagerInstanceState, ValidationManagerInstanceStateChangedHandler } from "../Interfaces/ValidationManager";

// /**
//  * For populating the ValueHostsManagerConfig and ValidationManagerConfig's ValueHostsConfig
//  * property using the guidance of functions. Otherwise you would have to define Config objects
//  * carefully following their syntax.
//  * 
//  * ```ts
//  * let builder = new ValueHostsManagerConfigBuilder(createValidationServices());
//  * builder.field('Field1').requireText();
//  * 
//  * let vm = new ValidationManager(builder);
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
// export class ValueHostsManagerConfigBuilder<T extends ValidationManagerConfig = ValidationManagerConfig> extends ManagerConfigBuilderBase<T>
//     implements IValueHostsManagerConfigBuilder<T>
// {
// /**
//  * If the business logic provides ValueHostConfigs, they should already
//  * be assigned to vmConfig.valueHostsConfig, and the developer
//  * will be modifying those configs and adding their own.
//  * If the UI is going to create all ValueHostConfigs, vmConfig.valueHostsConfig
//  * can be null or []. The user will use the field(), static(), and calc() functions
//  * to populate it.
//  */
//     constructor(services: IValidationServices)
//     constructor(config: T)
//     constructor(state: BuilderState<T>)
//     constructor(arg1: IValidationServices | T | BuilderState<T>)
//     {
//         super(arg1 as any);
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
  
// //#endregion    

// /**
//  * Supplies the ValidationManagerStartFluent object, already setup
//  */
//     protected createValueHostBuilder(): ValueHostConfigBuilder
//     {
//         return new ValueHostConfigBuilder(this.destinationValueHostConfigs(), this.services);
//     }

//     //#endregion fluent for creating ValueHosts

// }
