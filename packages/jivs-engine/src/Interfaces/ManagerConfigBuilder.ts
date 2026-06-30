/**
 * Interfaces for a ManagerConfigBuilders
 * @module ValueHosts/Types/ManagerConfigBuilder
 */


import { ValueHostName } from "../DataTypes/BasicTypes";
import { FluentFieldParameters, FluentFieldValueConfig, FluentStaticParameters, FluentValidatorBuilder } from "../ValueHosts/Fluent";
import { ManagerConfigBuilderBase } from "../ValueHosts/ManagerConfigBuilderBase";
import { CalculationHandler, CalcValueHostConfig } from "./CalcValueHost";
import { IDisposable } from "./General_Purpose";
import { StaticValueHostConfig } from "./StaticValueHost";
import { ValueHostInstanceState } from "./ValueHost";
import { IValueHostsManagerCallbacks, ValueHostsManagerConfig, ValueHostsManagerInstanceState } from "./ValueHostsManager";
import { IValidationManagerCallbacks, ValidationManagerConfig } from "./ValidationManager";


/**
 * Base interface for a ValueHostsManagerConfigBuilder and Modifier.
 * The ManagerConfigBuilder provides a way to configure ValueHostManagerConfig
 * and ValidationManagerConfig through meaningful code.
 */
export interface IManagerConfigBuilder<T extends ValueHostsManagerConfig>
    extends IDisposable, IValueHostsForValueHostsManagerConfig<T>
{
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
export interface IValidationManagerConfigBuilder<T extends ValidationManagerConfig>
    extends IValueHostsManagerConfigBuilder<T>, IValueHostsForValidatorManagerConfigBuilder<T>,
    IValidationManagerCallbacks, IValidationManagerConfigExtensions
{

    /**
     * When working with both business layer and UI layer configurations,
     * call before starting the UI layer configuration.
     * It will prepare for merging overlapping configurations and optionally
     * change some of the configuration already prepared by the business layer.
     * @param options 
     */
    startUILayerConfig(options?: BuilderOverrideOptions): void;

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