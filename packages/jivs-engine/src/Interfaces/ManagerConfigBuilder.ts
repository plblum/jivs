/**
 * Interfaces for a ManagerConfigBuilders
 * @module Builder/Types/ManagerConfigBuilder
 */


import { ValueHostName } from "../DataTypes/BasicTypes";
import { FluentFieldParameters, FluentFieldValueConfig, FluentStaticParameters } from "../Builder/Fluent";
import { CombineUsingCondition, ManagerConfigBuilderBase } from "../Builder/ManagerConfigBuilderBase";
import { CalculationHandler, CalcValueHostConfig } from "./CalcValueHost";
import { IDisposable } from "./General_Purpose";
import { StaticValueHostConfig } from "./StaticValueHost";
import { ValueHostInstanceState } from "./ValueHost";
import { IValueHostsManagerCallbacks, ValueHostsManagerConfig, ValueHostsManagerInstanceState } from "./ValueHostsManager";
import { IValidationManagerCallbacks, ValidationManagerConfig } from "./ValidationManager";
import { ConditionConfig } from "./Conditions";
import { ValidationManagerConfigBuilder } from "../Builder/ValidationManagerConfigBuilder";
import { IValueHostsServices } from "./ValueHostsServices";
import { FluentValidatorBuilder } from "../Builder/FluentValidatorBuilder"
import { StartConditionBuilder } from './../Builder/ConditionBuilder_classes';


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
        builderFn: (combiningBuilder: StartConditionBuilder, existingConditionConfig: ConditionConfig) => void): ValidationManagerConfigBuilder;
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
        builderFn: (combiningBuilder: StartConditionBuilder) => void): ValidationManagerConfigBuilder

    combineWithRule(valueHostName: ValueHostName, errorCode: string,
        arg3: CombineUsingCondition | ((combiningBuilder: StartConditionBuilder, existingConditionConfig: ConditionConfig) => void),
        arg4?: (combiningBuilder: StartConditionBuilder) => void): ValidationManagerConfigBuilder;

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
        conditionConfig: ConditionConfig): ValidationManagerConfigBuilder
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
        builderFn: (replacementBuilder: StartConditionBuilder) => void): ValidationManagerConfigBuilder
    replaceRule(valueHostName: ValueHostName, errorCode: string,
        sourceOfConditionConfig: ConditionConfig | ((replacementBuilder: StartConditionBuilder) => void)): ValidationManagerConfigBuilder;
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
    static(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentStaticParameters): ManagerConfigBuilderBase<T>;

    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
     * @returns Same instance for chaining.
     */    
    static(valueHostName: ValueHostName, parameters: FluentStaticParameters): ManagerConfigBuilderBase<T>;    

    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire StaticValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    static(config: Omit<StaticValueHostConfig, 'valueHostType'>): ManagerConfigBuilderBase<T>;

    // overload resolution
    static(arg1: ValueHostName | StaticValueHostConfig, arg2?: FluentStaticParameters | string | null, parameters?: FluentStaticParameters): ManagerConfigBuilderBase<T>;

    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - can be null. The value for ValueHost.dataType.
     * @param calcFn - required. Function callback.
     * @returns Same instance for chaining.
     */
    calc(valueHostName: ValueHostName, dataType: string | null | undefined, calcFn: CalculationHandler): ManagerConfigBuilderBase<T>;
    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    calc(config: Omit<CalcValueHostConfig, 'valueHostType'>): ManagerConfigBuilderBase<T>;
    // overload resolution
    calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): ManagerConfigBuilderBase<T>;

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
    field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    field(valueHostName: ValueHostName, parameters: FluentFieldParameters): FluentValidatorBuilder;    
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    field(config: FluentFieldValueConfig): FluentValidatorBuilder;
    // overload resolution
    field(arg1: ValueHostName | FluentFieldValueConfig, arg2?: FluentFieldParameters | string | null, parameters?: FluentFieldParameters): FluentValidatorBuilder;

}