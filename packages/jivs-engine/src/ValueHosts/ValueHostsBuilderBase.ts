/**
 * @link ValueHostsBuilder:class
 * @module ValidationManager/ConcreteClasses/ValueHostsBuilderBase
 */

import { ValueHostName } from "../DataTypes/BasicTypes";
import { ValueHostConfig } from "../Interfaces/ValueHost";
import { FluentInputParameters, FluentInputValueConfig, FluentStaticParameters, FluentValidatorCollector, StartFluent } from "./Fluent";
import { StaticValueHostConfig } from "../Interfaces/StaticValueHost";
import { CalcValueHostConfig, CalculationHandler } from "../Interfaces/CalcValueHost";


/**
 * Assist the UI developer as they prepare ValidationManagerConfig.
 * 
 * It handles several use cases:
 * 1. Override the ValueHostConfigs already setup by Business logic,
 *    but only impacting the UI oriented values, like error message and label.
 * 
 * 2. When the UI wants to fully construct the ValueHostConfigs, it provides
 *    a fluent syntax to create each type of ValueHostConfig including any child Configs.
 * 
 * 3. When the business logic has provided its content, often the UI
 *    still has its own ValueHosts and validators to add. The developer
 *    can use the fluent syntax to add those ValueHosts and supporting
 *    functions to add the validators.
 * 
 * When starting with Business Logic:
 * 
 *      [UI creates the vmConfig including the services] ->
 * 
 *      [Business logic populates vmConfig.valueHostConfig] ->
 * 
 *      [With the Builder, UI replaces error messages and labels] ->
 * 
 *      [With the Builder, UI adds additional ValueHosts and validators]
 * 
 *      let vm = new ValidationManager(vmConfig);
 * 
 * When UI creates everything:
 * 
 *      [UI creates the vmConfig including the services] ->
 * 
 *      [With the Builder, UI creates all ValueHosts and validators, including the desired error messages and lables ] ->
 * 
 *      let vm = new ValidationManager(vmConfig);
 */
export abstract class ValueHostsBuilderBase
{

    constructor()
    {
    }

/**
 * The config is a complete representation of the ValueHost.
 * Now just need to put it somewhere...
 * @param config 
 */    
    protected abstract applyConfig(config: ValueHostConfig): void;

/**
 * Supplies the StartFluent object, already setup
 */
    protected abstract createFluent(): StartFluent;

    //#region fluent for creating ValueHosts
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
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorCollector for chaining validators to initial InputValueHost
     */
    public input(config: FluentInputValueConfig): FluentValidatorCollector;
    // overload resolution
    public input(arg1: ValueHostName | FluentInputValueConfig, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector
    {
        let fluent = this.createFluent();
        let collector: FluentValidatorCollector;
        if (typeof arg1 === 'object') {
            collector = fluent.input(arg1);
        }
        else if (typeof arg1 === 'string') {
            collector = fluent.input(arg1, dataType, parameters);
        }
        else
            throw new TypeError('Must pass valuehost name or InputValueHostConfig');
        this.applyConfig(collector.parentConfig);
        return collector;        
    }    
    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
     * @returns Same instance for chaining.
     */
    static(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentStaticParameters): ValueHostsBuilderBase;
    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire StaticValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    static(config: Omit<StaticValueHostConfig, 'valueHostType'>): ValueHostsBuilderBase;
    // overload resolution
    static(arg1: ValueHostName | StaticValueHostConfig, dataType?: string | null, parameters?: FluentStaticParameters): ValueHostsBuilderBase
    {
        let fluent = this.createFluent();
        let vhConfig: StaticValueHostConfig;
        if (typeof arg1 === 'object') {
            vhConfig = fluent.static(arg1);
        }
        else if (typeof arg1 === 'string') {
            vhConfig = fluent.static(arg1, dataType, parameters);
        }
        else
            throw new TypeError('Must pass valuehost name or StaticValueHostConfig');        
        this.applyConfig(vhConfig);
        return this;
    }

    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - can be null. The value for ValueHost.dataType.
     * @param calcFn - required. Function callback.
     * @returns Same instance for chaining.
     */
    calc(valueHostName: ValueHostName, dataType: string | null, calcFn: CalculationHandler): ValueHostsBuilderBase;
    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    calc(config: Omit<CalcValueHostConfig, 'valueHostType'>): ValueHostsBuilderBase;
    // overload resolution
    calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): ValueHostsBuilderBase
    {
        let fluent = this.createFluent();
        let vhConfig: CalcValueHostConfig;
      
        if (typeof arg1 === 'object') {
            vhConfig = fluent.calc(arg1);
        }
        else if (typeof arg1 === 'string') {
            vhConfig = fluent.calc(arg1, dataType ?? null, calcFn!);
        }
        else
            throw new TypeError('Must pass valuehost name or CalcValueHostConfig'); 
        this.applyConfig(vhConfig);
        return this;
    }    

    //#endregion fluent for creating ValueHosts

}
