/**
 * Interfaces for a ManagerConfigBuilders
 * @module Builder/Types/ManagerConfigBuilder
 */


import { ValueHostName } from "../DataTypes/BasicTypes";
import { CalcValueHostConfig, CalculationHandler } from "./CalcValueHost";
import { IStartConditionBuilder, IFluentValidatorBuilder, IBuilderConfigHost } from "./ChildBuilders";
import { ConditionConfig } from "./Conditions";
import { FieldValueHostConfig } from "./FieldValueHost";
import { FluentStaticParameters, FluentFieldParameters, FluentFieldValueConfig, FluentValidatorConfig } from "./Fluent";
import { IDisposable } from "./General_Purpose";
import { StaticValueHostConfig } from "./StaticValueHost";
import { IValidationManagerCallbacks, ValidationManagerConfig } from "./ValidationManager";
import { ValueHostConfig, ValueHostInstanceState } from "./ValueHost";
import { IValueHostsManagerCallbacks, ValueHostsManagerConfig, ValueHostsManagerInstanceState } from "./ValueHostsManager";
import { IValueHostsServices } from "./ValueHostsServices";


/**
 * Base interface for a ValueHostsManagerConfigBuilder and Modifier.
 * The ManagerConfigBuilder provides a way to configure ValueHostManagerConfig
 * and ValidationManagerConfig through meaningful code.
 */
export interface IManagerConfigBuilder<T extends ValueHostsManagerConfig>
    extends IDisposable, IValueHostsForValueHostsManagerConfig<T>
{
    services: IValueHostsServices;
    /**
     * Delivers a complete ValueHostConfig and shuts down this instance.
     * You cannot use the instance after this point.
     * @returns 
     */
    complete(): T;
    /**
     * Creates the same output as complete() but does not modify the baseConfig
     * allowing it to be called multiple times.
     */
    snapshot(): T;
}

/**
 * A builder for preparing ValueHostsManagerConfig.
 */
export interface IValueHostsManagerConfigBuilder<T extends ValueHostsManagerConfig = ValueHostsManagerConfig>
    extends IManagerConfigBuilder<T>, IValueHostsManagerCallbacks
{
    /**
     * @inheritDoc ValueHosts/Types/ValueHostsManager!ValueHostsManagerConfig.savedInstanceState
     */
    savedInstanceState?: ValueHostsManagerInstanceState | null;

    /**
     * @inheritDoc ValueHosts/Types/ValueHostsManager!ValueHostsManagerConfig.savedValueHostInstanceStates
     */
    savedValueHostInstanceStates: Array<ValueHostInstanceState> | null;

}


/**
 * A builder for preparing ValidationManagerConfig.
 */
export interface IValidationManagerConfigBuilder<T extends ValidationManagerConfig = ValidationManagerConfig>
    extends IValueHostsManagerConfigBuilder<T>, IValueHostsForValidatorManagerConfigBuilder<T>,
    IValidationManagerCallbacks, IValidationManagerConfigExtensions
{
}

export interface IValidationManagerConfigExtensions
{

}

/**
 * Parameter for the overrides function to supply its options.
 */
export interface BuilderOverrideOptions
{
    /**
     * When true, use the favorUIMessages() function to delete
     * any error messages supplied by business logic for which
     * you have a replacement in TextLocalizationService.
     * If undefined, it defaults to true.
     */
    favorUIMessages?: boolean
}


/** 
 * OBSOLETE!
 * Variation of ValidationManagerConfigBuilder with extensions designed for the UI layer
 * to override and extend the business layer configuration.
 * It allows us to isolate methods specific to the UI layer, 
 * so that the business layer does not have to know about them.
*/
export interface IValidationManagerConfigFormAdapter extends IValidationManagerConfigBuilder<ValidationManagerConfig>
{
    /**
     * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
     * will disable any ValueHostConfigs that are not in the list of modelFieldNames. 
     * This is useful when the business layer has a model with many fields, 
     * but the UI layer is only going to use a subset of those fields.
     * @param modelFieldNames - names on ValueHosts already declared. 
     * All ValueHosts will have their enabled property set to false, except for those in the list.
     */
    useOnlyTheseModelFields(modelFieldNames: Array<ValueHostName>): void;

    /**
     * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
     * will disable any ValueHostConfigs that are in the list of modelFieldNames.
     * This is useful when the business layer has a model with many fields, 
     * but the UI layer is only going to use a subset of those fields.
     * @param modelFieldNames - names on ValueHosts already declared. 
     * All ValueHosts will have their enabled property set to false, except for those in the list.
     */
    disableTheseModelFields(modelFieldNames: Array<ValueHostName>): void;

    /**
     * If it finds the validator with the errorcode specified, 
     * it will combine the condition with the existing condition
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
     * builder.combineWithRule('Field1', 'NotNull', 
     *   (combiningBuilder, existingConditionConfig)=> {
     *      combiningBuilder.when(
     *                  (enablerBuilder)=> enablerBuilder.equalToValue('YES', 'Field2'),
     *                  (childBuilder)=> childBuilder.conditionConfig(existingConditionConfig));
     * });
     * ```
     * @returns itself for chaining
     */
    combineWithRule(valueHostName: ValueHostName, errorCode: string,
        builderFn: (combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => void): IValidationManagerConfigBuilder;
    /**
     * Uses the combineUsing parameter to determine how to combine the conditions.
     * @param valueHostName 
     * @param errorCode 
     * @param combineUsing 
     * @param builderFn - A function to create the condition that you want 
     * to combine with the existing condition.
     * ```ts
     * builder.combineWithRule('Field1', 'NotNull', CombineUsingCondition.When, 
     *    (combiningBuilder)=> combiningBuilder.equalToValue('YES', 'Field2'));
     * ```
     */
    combineWithRule(valueHostName: ValueHostName, errorCode: string, combineUsing: CombineUsingCondition,
        builderFn: (combiningBuilder: IStartConditionBuilder) => void): IValidationManagerConfigBuilder

    combineWithRule(valueHostName: ValueHostName, errorCode: string,
        arg3: CombineUsingCondition | ((combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => void),
        arg4?: (combiningBuilder: IStartConditionBuilder) => void): IValidationManagerConfigBuilder;

    /**
     * Replace the condition supplying the replacement conditionConfig directly.
     * If it finds the validator with the errorcode specified, 
     * it will replace the condition with the existing condition.
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
    replaceRule(valueHostName: ValueHostName, errorCode: string,
        conditionConfig: ConditionConfig): IValidationManagerConfigBuilder
    /** 
     * Replace supplying the replacement condition through a Builder object.
     * @param valueHostName 
     * @param errorCode 
     * @param builderFn
     * Use a function to create a conditionConfig that will replace the existing. You are
     * passed the builder, where you can build your new conditions.
     * @returns itself for chaining
     */
    replaceRule(valueHostName: ValueHostName, errorCode: string,
        builderFn: (replacementBuilder: IStartConditionBuilder) => void): IValidationManagerConfigBuilder
    replaceRule(valueHostName: ValueHostName, errorCode: string,
        sourceOfConditionConfig: ConditionConfig | ((replacementBuilder: IStartConditionBuilder) => void)): IValidationManagerConfigBuilder;
}


/**
 * Supports combineConditionWith to direct how conditions are combined.
 */
export enum CombineUsingCondition {
    When,
    All,
    Any
}

/**
 * Provides value host creation functions for ValueHostsManagerConfigBuilder.
 */
export interface IValueHostsForValueHostsManagerConfig<T extends ValueHostsManagerConfig>
{
    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
     * @returns Same instance for chaining.
     */
    static(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentStaticParameters): IManagerConfigBuilder<T>;

    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
     * @returns Same instance for chaining.
     */    
    static(valueHostName: ValueHostName, parameters: FluentStaticParameters): IManagerConfigBuilder<T>;    

    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire StaticValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    static(config: Omit<StaticValueHostConfig, 'valueHostType'>): IManagerConfigBuilder<T>;

    // overload resolution
    static(arg1: ValueHostName | StaticValueHostConfig, arg2?: FluentStaticParameters | string | null, parameters?: FluentStaticParameters): IManagerConfigBuilder<T>;

    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - can be null. The value for ValueHost.dataType.
     * @param calcFn - required. Function callback.
     * @returns Same instance for chaining.
     */
    calc(valueHostName: ValueHostName, dataType: string | null | undefined, calcFn: CalculationHandler): IManagerConfigBuilder<T>;
    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    calc(config: Omit<CalcValueHostConfig, 'valueHostType'>): IManagerConfigBuilder<T>;
    // overload resolution
    calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): IManagerConfigBuilder<T>;

}

/**
 * Provides value host creation functions for ValidationManagerConfigBuilder.
 */
export interface IValueHostsForValidatorManagerConfigBuilder<T extends ValidationManagerConfig>
{
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): IFluentValidatorBuilder;
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    field(valueHostName: ValueHostName, parameters: FluentFieldParameters): IFluentValidatorBuilder;    
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    field(config: FluentFieldValueConfig): IFluentValidatorBuilder;
    // overload resolution
    field(arg1: ValueHostName | FluentFieldValueConfig,
        arg2?: FluentFieldParameters | string | null,
        parameters?: FluentFieldParameters): IFluentValidatorBuilder;

}


//#region ConfigFormAdapter

/** 
 * Variation of ValidationManagerConfigBuilder with extensions designed for the UI layer
 * to override and extend the business layer configuration.
 * It allows us to isolate methods specific to the UI layer, 
 * so that the business layer does not have to know about them.
*/
export interface IConfigFormAdapter extends IValidationManagerConfigBuilder<ValidationManagerConfig> {
    /**
     * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
     * will disable any ValueHostConfigs that are not in the list of modelFieldNames. 
     * This is useful when the business layer has a model with many fields, 
     * but the UI layer is only going to use a subset of those fields.
     * @param modelFieldNames - names on ValueHosts already declared. 
     * All ValueHosts will have their enabled property set to false, except for those in the list.
     */
    useOnlyTheseModelFields(modelFieldNames: Array<ValueHostName>): void;

    /**
     * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
     * will disable any ValueHostConfigs that are in the list of modelFieldNames.
     * This is useful when the business layer has a model with many fields, 
     * but the UI layer is only going to use a subset of those fields.
     * @param modelFieldNames - names on ValueHosts already declared. 
     * All ValueHosts will have their enabled property set to false, except for those in the list.
     */
    disableTheseModelFields(modelFieldNames: Array<ValueHostName>): void;

    /**
     * Modifies the configuration of a specific ValueHost by exposing its IModifyFieldBuilder
     * for extensions that it offers. Makes no direct changes to ValueHostConfig itself.
     * @param valueHostName - the name of the ValueHost to modify.
     * @returns The IModifyFieldBuilder for further modifications.
     */
    modify(valueHostName: ValueHostName): IModifyFieldBuilder;
    /**
     * Modifies the configuration of a specific ValueHost by applying the given adjustments.
     * Applies the specified adjustments to the ValueHostConfig.
     * This does not modify anything that must be retained from business logic itself.
     * It also omits the dataType property which is a special case for changes.
     * @param valueHostName - the name of the ValueHost to modify.
     * @param adjustments - the adjustments to apply to the ValueHostConfig.
     * @returns The IModifyFieldBuilder for further modifications.
     */
    modify(valueHostName: ValueHostName, adjustments: AdapterValueHostConfig): IModifyFieldBuilder;

    /**
     * Modifies the configuration of a specific ValueHost by applying the given adjustments.
     * Applies the specified adjustments to the ValueHostConfig.
     * This does not modify anything that must be retained from business logic itself.
     * It contains the dataType property which is a special case for changes.
     * @param valueHostName - the name of the ValueHost to modify.
     * @param dataType - the data type of the ValueHost to modify. It must support falling back to the 
     * original dataType. (However, if the original is not supplied, it is used without verification.)
     * @param adjustments - the adjustments to apply to the ValueHostConfig.
     * @returns The IModifyFieldBuilder for further modifications.
     */
    modify(valueHostName: ValueHostName, dataType: string, adjustments?: AdapterValueHostConfig): IModifyFieldBuilder;    
}

export type AdapterValueHostConfig = Omit<FieldValueHostConfig, 'validatorConfigs' | 'name' | 'dataType'>;

/**
 * Builder that is chained from IConfigFormAdapter to modify individual fields.
 */
export interface IModifyFieldBuilder extends IBuilderConfigHost<ValueHostConfig>
{
    /**
     * Identifies an existing validator to modify. Returns the IModifyValidatorBuilder for further modifications.
     * It does not change the ValidatorConfig directly.
     * @param conditionType - the type of the validator condition to modify. Same as 'errorCode'
     * and if using an error code on the validator, you must specify it explicitly
     * as errorcode overrides conditionType.
     * @returns The IModifyValidatorBuilder for further modifications.
     */
    validator(conditionType: string): IModifyValidatorBuilder;
    validator(conditionType: string, adjustments: FluentValidatorConfig): IModifyValidatorBuilder;

    /**
     * Adds a new validator to the current ValueHost.
     * Returns the IFluentValidatorBuilder for further configuration of the new validator.
     * If the user adds any validators that share an error code/condition type of an existing validator,
     * it is an error.
     * @returns The IFluentValidatorBuilder for further modifications.
     */
    addValidator(): IFluentValidatorBuilder;
}

/**
 * Builder that is chained from IModifyFieldBuilder to modify individual validators.
 * It is chained from IModifyFieldBuilder.validator() to allow changes specific to the selected validator.
 */
export interface IModifyValidatorBuilder
{
    /**
     * Use this method when you want to combine the existing validator condition 
     * with a new condition using an AND logic.
     * Reworks an existing validator placing its condition as a child of AllMatchesCondition
     * together with one you supply.
     * @param errorCode - The error code associated with the new condition. While it can be the same
     * as the ConditionType that you are combining with, it is primarily used to identify the 
     * new condition in the context of the existing validator.
     * @param builderCallback - A callback function that receives a new StartConditionBuilder and 
     * returns a ConditionConfig representing the new condition to be combined with the existing one.
     */
    all(errorCode: string, builderCallback: (newCondBuilder: IStartConditionBuilder) => ConditionConfig): void;
    /**
     * Use this method when you want to combine the existing validator condition 
     * with a new condition using an OR logic.
     * Reworks an existing validator placing its condition as a child of AnyMatchesCondition
     * together with one you supply.
     * @param errorCode - The error code associated with the new condition. While it can be the same
     * as the ConditionType that you are combining with, it is primarily used to identify the 
     * new condition in the context of the existing validator.
     * @param builderCallback - A callback function that receives a new StartConditionBuilder and 
     * returns a ConditionConfig representing the new condition to be combined with the existing one.
     */
    any(errorCode: string, builderCallback: (newCondBuilder: IStartConditionBuilder) => ConditionConfig): void;

    /**
     * Use this method to specify a condition that must be met for the existing validator to be applied.
     * It replaces the existing validator with a WhenCondition where your new condition is
     * the whenToEnableCondition and the existing condition is the thenCondition.
     * The whenToEnableCondition is defined using a StartConditionBuilder and returns a ConditionConfig.
     * @param builderCallback - A callback function that receives a new StartConditionBuilder and 
     * returns a ConditionConfig representing the condition to be checked before applying the existing validator.
     */
    when(builderCallback: (whenToEnableBuilder: IStartConditionBuilder) => ConditionConfig): void;

    /**
     * If the validator must not run, it can be disabled. It is preferred
     * that you combine another condition with this one instead of simply disabling it.
     * Use all(), any(), or when() to combine conditions instead of simply disabling the validator.
     */
    disable(): void;

}
//#endregion ConfigFormAdapter