// /**
//  * Interfaces for a ManagerConfigBuilders
//  * @module Builder/Types/ManagerConfigBuilder
//  */


// import { ValueHostName } from "../DataTypes/BasicTypes";
// import { CalcValueHostConfig, CalculationHandler } from "./CalcValueHost";
// import { IBuilderConfigHost, IValidatorBuilder, IStartConditionBuilder, IStartConditionWithOneChildBuilder } from "./ChildBuilders";
// import { FieldValueHostConfig } from "./FieldValueHost";
// import { FluentFieldParameters, FluentFieldValueConfig, FluentStaticParameters, FluentValidatorConfig } from "./Fluent";
// import { IDisposable } from "./General_Purpose";
// import { StaticValueHostConfig } from "./StaticValueHost";
// import { IValidationManagerCallbacks, ValidationManagerConfig, ValidationManagerInstanceState } from "./ValidationManager";
// import { ValidatorConfig } from "./Validator";
// import { ValueHostConfig, ValueHostInstanceState } from "./ValueHost";
// import type { IValidationServices } from "./ValidationServices";
// /**
//  * Base interface for a ValidationManagerConfigBuilder.
//  * The ManagerConfigBuilder provides a way to configure ValueHostManagerConfig
//  * and ValidationManagerConfig through meaningful code.
//  */
// export interface IManagerConfigBuilder<T extends ValidationManagerConfig>
//     extends IDisposable, IValueHostsForValidationManagerConfig<T>
// {
//     services: IValidationServices;
//     /**
//      * Delivers a complete ValueHostConfig and shuts down this instance.
//      * You cannot use the instance after this point.
//      * @returns 
//      */
//     complete(): T;
//     /**
//      * Creates the same output as complete() but does not modify the baseConfig
//      * allowing it to be called multiple times.
//      */
//     snapshot(): T;

//     /**
//      * Establishes the condition that must be met for the ValueHost to be enabled. It is a fluent format that returns a ConditionBuilder
//      * that can be used to build the conditionConfig. The resulting conditionConfig is attached to the ValueHost as its enabler.
//      * If called on a ValueHost already with an enabler, it will replace the existing enabler.
//      * ```ts
//      * builder.whenToEnable('Field1', (childBuilder)=>
//      *  childBuilder.fieldName('Field2').equalToValue('YES'));
//      * builder.whenToEnable('Field1', (childBuilder)=>
//      *  childBuilder.conditionConfig(existingConditionConfig));
//      * builder.whenToEnable('Field1', handler).any validator can be chained
//      * ```
//      * Sets this value:
//      * ```ts
//      * valueHostConfig.enablerConfig = conditionConfig;
//      * ```
//      * @param valueHostName - the name of the ValueHost to configure.
//      * @param callback - A function that receives a IStartConditionWithOneChildBuilder and returns a ConditionConfig.
//      */
//     whenToEnable(valueHostName: ValueHostName,
//         callback: (builder: IStartConditionWithOneChildBuilder) => void): IManagerConfigBuilder<T>;

// }

// /**
//  * A builder for preparing ValidationManagerConfig.
//  */
// //export interface IValueHostsManagerConfigBuilder<T extends ValidationManagerConfig = ValidationManagerConfig>
// //     extends IManagerConfigBuilder<T>, IValidationManagerCallbacks
// // {
// //     /**
// //      * @inheritDoc ValueHosts/Types/ValidationManager!ValidationManagerConfig.savedInstanceState
// //      */
// //     savedInstanceState?: ValidationManagerInstanceState | null;

// //     /**
// //      * @inheritDoc ValueHosts/Types/ValidationManager!ValidationManagerConfig.savedValueHostInstanceStates
// //      */
// //     savedValueHostInstanceStates: Array<ValueHostInstanceState> | null;

// // }


// /**
//  * A builder for preparing ValidationManagerConfig.
//  */
// export interface IValidationManagerConfigBuilder<T extends ValidationManagerConfig = ValidationManagerConfig>
//     extends IManagerConfigBuilder<T>, IValueHostsForValidatorManagerConfigBuilder<T>,
//     IValidationManagerCallbacks, IValidationManagerConfigExtensions
// {
//     /**
//      * @inheritDoc ValueHosts/Types/ValidationManager!ValidationManagerConfig.savedInstanceState
//      */
//     savedInstanceState?: ValidationManagerInstanceState | null;

//     /**
//      * @inheritDoc ValueHosts/Types/ValidationManager!ValidationManagerConfig.savedValueHostInstanceStates
//      */
//     savedValueHostInstanceStates: Array<ValueHostInstanceState> | null;    
// }

// export interface IValidationManagerConfigExtensions
// {

// }

// /**
//  * Parameter for the overrides function to supply its options.
//  */
// export interface BuilderOverrideOptions
// {
//     /**
//      * When true, use the favorUIMessages() function to delete
//      * any error messages supplied by business logic for which
//      * you have a replacement in TextLocalizationService.
//      * If undefined, it defaults to true.
//      */
//     favorUIMessages?: boolean
// }

// /**
//  * Provides value host creation functions for ValidationManagerConfigBuilder.
//  */
// export interface IValueHostsForValidationManagerConfig<T extends ValidationManagerConfig>
// {
//     /**
//      * Fluent format to create a StaticValueHostConfig.
//      * This is the start of a fluent series. However, at this time, there are no further items in the series.
//      * @param valueHostName - the ValueHost name
//      * @param dataType - optional and can be null. The value for ValueHost.dataType.
//      * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
//      * @returns Same instance for chaining.
//      */
//     static(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentStaticParameters): IManagerConfigBuilder<T>;

//     /**
//      * Fluent format to create a StaticValueHostConfig.
//      * This is the start of a fluent series. However, at this time, there are no further items in the series.
//      * @param valueHostName - the ValueHost name
//      * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
//      * @returns Same instance for chaining.
//      */    
//     static(valueHostName: ValueHostName, parameters: FluentStaticParameters): IManagerConfigBuilder<T>;    

//     /**
//      * Fluent format to create a StaticValueHostConfig.
//      * This is the start of a fluent series. However, at this time, there are no further items in the series.
//      * @param config - Supply the entire StaticValueHostConfig. This is a special use case.
//      * You can omit the valueHostType property.
//      * @returns Same instance for chaining.
//      */
//     static(config: Omit<StaticValueHostConfig, 'valueHostType'>): IManagerConfigBuilder<T>;

//     // overload resolution
//     static(arg1: ValueHostName | StaticValueHostConfig, arg2?: FluentStaticParameters | string | null, parameters?: FluentStaticParameters): IManagerConfigBuilder<T>;

//     /**
//      * Fluent format to create a CalcValueHostConfig.
//      * This is the start of a fluent series. However, at this time, there are no further items in the series.
//      * @param valueHostName - the ValueHost name
//      * @param dataType - can be null. The value for ValueHost.dataType.
//      * @param calcFn - required. Function callback.
//      * @returns Same instance for chaining.
//      */
//     calc(valueHostName: ValueHostName, dataType: string | null | undefined, calcFn: CalculationHandler): IManagerConfigBuilder<T>;
//     /**
//      * Fluent format to create a CalcValueHostConfig.
//      * This is the start of a fluent series. However, at this time, there are no further items in the series.
//      * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
//      * You can omit the valueHostType property.
//      * @returns Same instance for chaining.
//      */
//     calc(config: Omit<CalcValueHostConfig, 'valueHostType'>): IManagerConfigBuilder<T>;
//     // overload resolution
//     calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): IManagerConfigBuilder<T>;

// }

// /**
//  * Provides value host creation functions for ValidationManagerConfigBuilder.
//  */
// export interface IValueHostsForValidatorManagerConfigBuilder<T extends ValidationManagerConfig>
// {
//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param valueHostName - the ValueHost name
//      * @param dataType - optional and can be null. The value for ValueHost.dataType.
//      * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
//      * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): IValidatorBuilder;
//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param valueHostName - the ValueHost name
//      * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
//      * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     field(valueHostName: ValueHostName, parameters: FluentFieldParameters): IValidatorBuilder;    
//     /**
//      * Fluent format to create a FieldValueHostConfig.
//      * This is the start of a fluent series. Extend series with validation rules like "required()".
//      * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
//      * You can omit the valueHostType property.
//      * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
//      */
//     field(config: FluentFieldValueConfig): IValidatorBuilder;
//     // overload resolution
//     field(arg1: ValueHostName | FluentFieldValueConfig,
//         arg2?: FluentFieldParameters | string | null,
//         parameters?: FluentFieldParameters): IValidatorBuilder;

// }


// //#region FormConfigAdapter

// /** 
//  * Variation of ValidationManagerConfigBuilder with extensions designed for the UI layer
//  * to override and extend the business layer configuration.
//  * It allows us to isolate methods specific to the UI layer, 
//  * so that the business layer does not have to know about them.
// */
// export interface IFormConfigAdapter extends IValidationManagerConfigBuilder<ValidationManagerConfig> {
//     /**
//      * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
//      * will disable any ValueHostConfigs that are not in the list of modelFieldNames. 
//      * This is useful when the business layer has a model with many fields, 
//      * but the UI layer is only going to use a subset of those fields.
//      * @param modelFieldNames - names on ValueHosts already declared. 
//      * All ValueHosts will have their enabled property set to false, except for those in the list.
//      */
//     useOnlyTheseModelFields(modelFieldNames: Array<ValueHostName>): void;

//     /**
//      * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
//      * will disable any ValueHostConfigs that are in the list of modelFieldNames.
//      * This is useful when the business layer has a model with many fields, 
//      * but the UI layer is only going to use a subset of those fields.
//      * @param modelFieldNames - names on ValueHosts already declared. 
//      * All ValueHosts will have their enabled property set to false, except for those in the list.
//      */
//     disableTheseModelFields(modelFieldNames: Array<ValueHostName>): void;

//     /**
//      * Applies the group name to all valuehosts identified. 
//      * This is useful alternative to assigning each valuehost individually to a group. 
//      * @param groupName 
//      * @param valueHostNames 
//      */
//     assignToGroup(groupName: string, valueHostNames: Array<ValueHostName>): void;

//     /**
//      * Modifies the configuration of a specific ValueHost by exposing its IModifyFieldBuilder
//      * for extensions that it offers. Makes no direct changes to ValueHostConfig itself.
//      * @param valueHostName - the name of the ValueHost to modify.
//      * @returns The IModifyFieldBuilder for further modifications.
//      */
//     modify(valueHostName: ValueHostName): IModifyFieldBuilder;
//     /**
//      * Modifies the configuration of a specific ValueHost by applying the given adjustments.
//      * Applies the specified adjustments to the ValueHostConfig.
//      * This does not modify anything that must be retained from business logic itself.
//      * It also omits the dataType property which is a special case for changes.
//      * @param valueHostName - the name of the ValueHost to modify.
//      * @param adjustments - the adjustments to apply to the ValueHostConfig.
//      * @returns The IModifyFieldBuilder for further modifications.
//      */
//     modify(valueHostName: ValueHostName, adjustments: AdapterValueHostConfig): IModifyFieldBuilder;

//     /**
//      * Updates just the ValueHostConfig.label property.
//      * It is a shorthand for `modify(valueHostName, { label: label })` but is more convenient 
//      * for the common case of just changing the label.
//      * @param valueHostName - the name of the ValueHost to modify.
//      * @param label - the new label to apply to the ValueHostConfig.
//      * @returns The IModifyFieldBuilder for further modifications.
//      */
//     modify(valueHostName: ValueHostName, label: string): IModifyFieldBuilder;    
// }

// export type AdapterValueHostConfig = Omit<FieldValueHostConfig, 'validatorConfigs' | 'name' | 'dataType'>;

// /**
//  * Builder that is chained from IFormConfigAdapter to modify individual fields.
//  */
// export interface IModifyFieldBuilder extends IBuilderConfigHost<ValueHostConfig>
// {
//     /**
//      * Identifies an existing validator to modify. Returns the IModifyValidatorBuilder for further modifications.
//      * It does not change the ValidatorConfig directly.
//      * @param conditionType - the type of the validator condition to modify. Same as 'errorCode'
//      * and if using an error code on the validator, you must specify it explicitly
//      * as errorcode overrides conditionType.
//      * @returns The IModifyValidatorBuilder for further modifications.
//      */
//     validator(conditionType: string): IModifyValidatorBuilder;
//     validator(conditionType: string, adjustments: FluentValidatorConfig): IModifyValidatorBuilder;

//     /**
//      * Adds a new validator to the current ValueHost.
//      * Returns the IValidatorBuilder for further configuration of the new validator.
//      * If the user adds any validators that share an error code/condition type of an existing validator,
//      * it is an error.
//      * @returns The IValidatorBuilder for further modifications.
//      */
//     addValidator(): IValidatorBuilder;

//     /**
//      * Establishes the condition that must be met for the ValueHost to be enabled. It is a fluent format that returns a ConditionBuilder
//      * that can be used to build the conditionConfig. The resulting conditionConfig is attached to the ValueHost as its enabler.
//      * If called on a ValueHost already with an enabler, it will replace the existing enabler.
//      * ```ts
//      * builder.whenToEnable((childBuilder)=>
//      *  childBuilder.fieldName('Field2').equalToValue('YES'));
//      * builder.whenToEnable((childBuilder)=>
//      *  childBuilder.conditionConfig(existingConditionConfig));
//      * builder.whenToEnable(handler).any validator can be chained
//      * ```
//      * Sets this value:
//      * ```ts
//      * valueHostConfig.enablerConfig = conditionConfig;
//      * ```
//      * @param callback - A function that receives a IStartConditionWithOneChildBuilder and returns a ConditionConfig.
//      * @returns The IModifyFieldBuilder for further modifications.
//      */
//     whenToEnable(callback: (builder: IStartConditionWithOneChildBuilder) => void): IModifyFieldBuilder;

//     /**
//      * Specifies the data type for this ValueHost. 
//      * Use case 1: The business layer did not specify a data type, but the UI layer needs to specify one
//      * for clarity.
//      * Use case 2: The business layer specified a data type, but the UI layer needs to change it to a different one.
//      * In this case, the new data type must be compatible with the original data type. If it is not, it is an error.
//      * By "compatible", there must be a fallback defined between the new data type and existing one
//      * in the LookupKeyFallbackService within the ValidationServices. If there is no fallback, it is an error.
//      * @param newDataType - the new data type to apply to this ValueHost. It must be compatible with the existing data type.
//      * @returns The IModifyFieldBuilder for further modifications.
//      */
//     refineDataType(newDataType: string): IModifyFieldBuilder;

// }

// /**
//  * Builder that is chained from IModifyFieldBuilder to modify individual validators.
//  * It is chained from IModifyFieldBuilder.validator() to allow changes specific to the selected validator.
//  */
// export interface IModifyValidatorBuilder extends IBuilderConfigHost<ValidatorConfig>
// {
//     /**
//      * Use this method when you want to combine the existing validator condition 
//      * with a new condition using an AND logic.
//      * Reworks an existing validator placing its condition as a child of AllMatchesCondition
//      * together with one you supply.
//      * While it uses the AllMatchesconditon, its syntax uses 'and' to be more intuitive.
//      * ```ts
//      * builder.validator(ConditionType.RequireText).and('customErrorCode', 
//      *  (newCondBuilder)=>
//      *      newCondBuilder.fieldName('Field2').equalToValue('YES'));
//      * ```
//      * NOTE: If an AllMatchesCondition is created, it inherits the error code from the existing validator. 
//      * @param builderCallback - A callback function that receives a new StartConditionBuilder.
//      * Use fluent syntax to build the desired condition to be combined with the existing one. 
//      */
//     and(builderCallback: (newCondBuilder: IStartConditionBuilder) => void): void;

//     /**
//      * Use this method when you want to combine the existing validator condition 
//      * with a new condition using an OR logic.
//      * Reworks an existing validator placing its condition as a child of AnyMatchesCondition
//      * together with one you supply.
//      * While it uses the AnyMatchesconditon, its syntax uses 'or' to be more intuitive.
//      * ```ts
//      * builder.validator(ConditionType.RequireText).or('customErrorCode', 
//      *  (newCondBuilder)=>
//      *      newCondBuilder.fieldName('Field2').equalToValue('YES'));
//      * ```
//      * NOTE: If an AllMatchesCondition is created, it inherits the error code from the existing validator. 

//      * @param builderCallback - A callback function that receives a new StartConditionBuilder.
//      * Use fluent syntax to build the desired condition to be combined with the existing one. 
//      */
//     or(builderCallback: (newCondBuilder: IStartConditionBuilder) => void): void;

//     /**
//      * Use this method to specify a condition that must be met for the existing validator to be evaluated.
//      * It replaces the existing validator with a WhenCondition where your new condition is
//      * the whenToEnableCondition and the existing condition is the thenCondition.
//      * The whenToEnableCondition is defined using a StartConditionBuilder and returns a ConditionConfig.
//      * @param builderCallback - A callback function that receives a new StartConditionBuilder.
//      * Use fluent syntax to build the desired condition to be combined with the existing one. 
//      */
//     whenToEnable(builderCallback: (whenToEnableBuilder: IStartConditionWithOneChildBuilder) => void): void;

//     /**
//      * If the validator must not run, it can be disabled. It is preferred
//      * that you combine another condition with this one instead of simply disabling it.
//      * Use all(), any(), or whenToEnable() to combine conditions instead of simply disabling the validator.
//      */
//     disable(): void;

// }
// //#endregion FormConfigAdapter