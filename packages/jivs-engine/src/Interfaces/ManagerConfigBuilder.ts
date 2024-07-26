/**
 * Interfaces for a ManagerConfigBuilders
 * @module ValueHosts/Types/ManagerConfigBuilder
 */


import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { FluentConditionBuilder, FluentInputParameters, FluentInputValueConfig, FluentPropertyParameters, FluentPropertyValueConfig, FluentStaticParameters, FluentValidatorBuilder } from "../ValueHosts/Fluent";
import { ManagerConfigBuilderBase } from "../ValueHosts/ManagerConfigBuilderBase";
import { CalculationHandler, CalcValueHostConfig } from "./CalcValueHost";
import { IDisposable } from "./General_Purpose";
import { StaticValueHostConfig } from "./StaticValueHost";
import { ValueHostInstanceState } from "./ValueHost";
import { IValueHostsManagerCallbacks, ValueHostsManagerConfig, ValueHostsManagerInstanceState } from "./ValueHostsManager";
import { IValidationManagerCallbacks, ValidationManagerConfig } from "./ValidationManager";
import { ConfigAnalysisServiceOptions, IConfigAnalysisResultsExplorer } from "./ConfigAnalysisService";

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

    /**
     * A key tool to writing tests around Jivs configurations.
     * 
     * Prior to calling complete(), use this to review the current state of the configuration,
     * taking both the services and ValueHost configurations into account.
     * The resulting object provides you with tools for looking for errors and other issues,
     * plus reporting on the configuration.
     * 
     * For example, you can learn about all Lookup Keys in use, with their associated
     * converters, parsers, formatters, etc. You can identify those that are missing a supporting
     * object that you need to add to the services.
     * You can identify all errors and issues amongst the ValueHosts and their validators.
     * This happens prior to even creating a ValidationManager or ValueHostsManager, so you know going in
     * that the configuration is correct.
     * 
     * @remarks
     * The underlying code is actually the ConfigAnalysisService, which is defined in the 
     * ValidationServices or ValueHostsServices. This method is a convenience wrapper around that service.
     * You could also call it directly from the services object like this:
     * ```ts
     * const analysis = services.configAnalysisService.analyze();
     * ```
     * @param options 
     * @returns Tools to look for issues and report on the configuration. Its methods are used
     * with your testing code.
     */
    analyze(options?: ConfigAnalysisServiceOptions): IConfigAnalysisResultsExplorer;

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
    favorUIMessages?: boolean,
    /**
     * When true, use the convertPropertyToInput() function to
     * replace the valueHostType property value, from 'Property'
     * to 'Input' (no changes to any other case).
     * This allows business logic to output in its preferred ValueHostType
     * and UI to upscale it to InputValueHost.
     */
    convertPropertyToInput?: boolean
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
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    input(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    input(valueHostName: ValueHostName, parameters: FluentInputParameters): FluentValidatorBuilder;    
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    input(config: FluentInputValueConfig): FluentValidatorBuilder;
    // overload resolution
    input(arg1: ValueHostName | FluentInputValueConfig, arg2?: FluentInputParameters | string | null, parameters?: FluentInputParameters): FluentValidatorBuilder;

    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    property(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    property(valueHostName: ValueHostName, parameters: FluentPropertyParameters): FluentValidatorBuilder;    
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire PropertyValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    property(config: FluentPropertyValueConfig): FluentValidatorBuilder;
    // overload resolution
    property(arg1: ValueHostName | FluentPropertyValueConfig, arg2?: FluentPropertyParameters | string | null, parameters?: FluentPropertyParameters): FluentValidatorBuilder;

}