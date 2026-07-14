import { ValueHostName } from "../DataTypes/BasicTypes";
import { CalculationHandler, CalcValueHostConfig } from "../Interfaces/CalcValueHost";
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { IDisposable } from "../Interfaces/General_Purpose";
import { IFluentValidatorBuilder } from "../Interfaces/ChildBuilders";
import { IServicesAccessor } from "../Interfaces/Services";
import { StaticValueHostConfig } from "../Interfaces/StaticValueHost";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { ValidatorsValueHostBaseConfig } from "../Interfaces/ValidatorsValueHostBase";
import { ValueHostConfig } from "../Interfaces/ValueHost";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { IValueHostsServices } from "../Interfaces/ValueHostsServices";
import { assertNotNull, CodingError } from "../Utilities/ErrorHandling";
import { isPlainObject } from "../Utilities/Utilities";
import {
    FluentAnyValueHostConfig, FluentAnyValueHostParameters,
    FluentCalcValueConfig,
    FluentFieldParameters,
    FluentFieldValueConfig,
    FluentStaticParameters,
    FluentStaticValueConfig,
    FluentValidatorsValueHostConfig, FluentValidatorsValueHostParameters
} from "./Fluent";

/**
 * Starts a fluent chain for ValueHostsManager. Its methods start CalcValueHost (calc()),
 * and StaticValueHost (static())
 */
export class ValueHostsManagerStartFluent implements IDisposable, IServicesAccessor
{
    /**
     * 
     * @param existingValueHostConfigs When assigned, we can check for naming conflicts.
     * @param services
     */
    constructor(existingValueHostConfigs: Array<ValueHostConfig> | null, services: IValueHostsServices)
    {
        assertNotNull(services, 'services');
        if (existingValueHostConfigs)
            this._existingValueHostConfigs = new WeakRef(existingValueHostConfigs);
        this._services = new WeakRef(services);
    }
    private _existingValueHostConfigs: WeakRef<Array<ValueHostConfig>> | null = null;

    protected get existingValueHostConfigs(): Array<ValueHostConfig> | null
    {
        return this._existingValueHostConfigs ? this._existingValueHostConfigs.deref() ?? null : null;
    }
    public get services(): IValueHostsServices
    {
        return this._services.deref()!;
    }
    private _services: WeakRef<IValueHostsServices>;

    dispose(): void {
        this._services = undefined!;
        this._existingValueHostConfigs = undefined!;
    }
    /**
     * Add Value Host that does not have direct supporting functions here.
     * This targets ValueHosts without validators. Use the withValidators() function for those.
     * @param valueHostType
     * @param arg1 - either the ValueHost name or a ValueHostConfig. When ValueHostConfig, omit the remaining parameters.
     * @param arg2 - optional and can be null. The value for ValueHost.dataType or any additional properties of ValueHostConfig.
     * @param arg3 - optional. Any additional properties of a ValueHostConfig.
     * @returns Completed ValueHostConfig of type T
     */
    public withoutValidators<T extends ValueHostConfig>(valueHostType: ValueHostType | string, arg1: ValueHostName | FluentAnyValueHostConfig<T>,
        arg2?: FluentAnyValueHostParameters<T> | string | null, arg3?: FluentAnyValueHostParameters<T>): T
    {
        assertNotNull(valueHostType, 'valueHostType');
        this.assertFirstParameterValid(arg1);   // includes a check for config.name not already defined
    // just the first parameter is used when its a ValueHostConfig.
        if (this.isConfigObject(arg1)) {
             return { ...arg1 as T, valueHostType: valueHostType };
        }
        // first parameter is expected to be a string with ValueHostName
        // second parameter is ValueHostConfig, which we'll modify to assign ValueHostType and ValueHostName
        // third parameter is ignored
        if (this.isConfigObject(arg2)) {
            return { ...arg2 as T, name: arg1 as string, valueHostType: valueHostType };
        }

        // first parameter is expected to be a string with ValueHostName
        // second parameter is data type (or null/undefined)
        // third parameter is ValueHostConfig, which we'll modify to assign ValueHostType, ValueHostName and DataType
        if (this.isConfigObject(arg3)) {
            let config = { ...arg3 as T, name: arg1 as string, valueHostType: valueHostType };
            if (arg2)
                config.dataType = arg2 as string;
            return config;
        }        
        // no configs supplied.
        // first parameter must be a string with ValueHostName
        // second parameter is data type (or null/undefined)
        // third parameter is ignored
        if (typeof arg1 === 'string' && (typeof arg2 === 'string' || arg2 == null)) {   // null or undefined

            let config = { valueHostType: valueHostType, name: arg1 } as T;
            if (arg2)
                config.dataType = arg2;
        
            return config;
        }
        throw new TypeError('Second parameter invalid type');
    }

    /**
     * Returns true if the arg is a plain Javascript Object.
     * Returns false if not any type of object.
     * Throws an error it is an object but not a plain one.
     * @param arg 
     */
    protected isConfigObject(arg: any): boolean
    {
        if (isPlainObject(arg))
            return true;
        if (arg != null)    // null or undefined
            if (typeof arg === 'object') {
                throw new TypeError('argument is not a supported object');
            }
        return false;
    }
    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
     */
    public static(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentStaticParameters): StaticValueHostConfig;
    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire StaticValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     */
    public static(config: FluentStaticValueConfig): StaticValueHostConfig;
    // overload resolution
    public static(arg1: ValueHostName | FluentStaticValueConfig, arg2?: FluentStaticParameters | string | null, parameters?: FluentStaticParameters): StaticValueHostConfig
    {
        return this.withoutValidators<StaticValueHostConfig>(ValueHostType.Static, arg1, arg2, parameters);
    }

    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - can be null. The value for ValueHost.dataType.
     * @param calcFn - required. Function callback.
     */
    public calc(valueHostName: ValueHostName, dataType: string | null, calcFn: CalculationHandler): CalcValueHostConfig;
    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     */
    public calc(config: FluentCalcValueConfig): CalcValueHostConfig;
    // overload resolution
    public calc(arg1: ValueHostName | FluentCalcValueConfig, dataType?: string | null, calcFn?: CalculationHandler): CalcValueHostConfig
    {
        this.assertFirstParameterValid(arg1);
        if (this.isConfigObject(arg1)) {
            return { ...arg1 as CalcValueHostConfig, valueHostType: ValueHostType.Calc };
        }
        if (typeof arg1 === 'string') {
            if (typeof calcFn !== 'function')
                throw new CodingError('Must supply a calculation function');
            let config: CalcValueHostConfig = { valueHostType: ValueHostType.Calc, name: arg1, calcFn: calcFn };
            if (dataType)
                config.dataType = dataType;
        
            return config;
        }
        /* istanbul ignore next */
        throw new Error('Should never get here');   // because assertFirstParameterValid will catch it
    }    

    // /**
    //  * Start of a series to collect ConditionConfigs into any condition that
    //  * implements EvaluateChildConditionResultsConfig.
    //  * For example:
    //  * ```ts
    //  * let fluent = new ValueHostsManagerStartFluent(null);
    //  * fluent.field('Field1').all([
    //  *  fluent.conditions().required('Field2').required('Field3'));
    //  * ```
    //  * The fluent function for allCondition (and others that support EvaluateChildConditionResultsConfig)
    //  * will get a FluentConditionBuilder whose conditionConfigs collection is fully populated.
    // * @param config - When null/undefined, the instance is created and the caller is expected
    // * to retrieve its conditionConfigs from the config property.
    // * When assigned, that instance gets conditionConfigs populated and 
    // * there is no need to get a value from configs property.
    // */
    // public conditions(config?: ConditionWithChildrenBaseConfig): FluentMultiFieldConditionBuilder
    // {
    //     config = config ?? { conditionType: 'TBD', conditionConfigs: [] };
    //     if (config.conditionConfigs == null) // null or undefined
    //         config.conditionConfigs = [];
    //     let builder = new FluentMultiFieldConditionBuilder(config ?? null);
    //     return builder;
    // }   
    
    /**
     * Helper for fluent starting nodes to ensure the first parameter supplies
     * a name and that name is not previously defined.
     * @param arg 
     */
    protected assertFirstParameterValid(arg: ValueHostName | ValueHostConfig): void
    {
        assertNotNull(arg, 'arg1');
        
        if (this.isConfigObject(arg)) {
            assertNotNull((arg as ValueHostConfig).name, 'config.name');
            this.assertNameNotDefined((arg as ValueHostConfig).name);
        }
        else if (typeof arg === 'string') {
            assertNotNull(arg, 'valueHostName');
            this.assertNameNotDefined(arg);
        }
        else
            throw new TypeError('Must pass valuehost name or FieldValueHostConfig');
    }        

    protected assertNameNotDefined(valueHostName: ValueHostName): void
    {
        if (this.existingValueHostConfigs && this.existingValueHostConfigs.find((item) => item.name === valueHostName))
            throw new CodingError(`ValueHostName ${valueHostName} is already defined.`);        
    }

}


/**
 * Starts a fluent chain. Its methods start FieldValueHost (field()),
 * StaticValueHost (static()), and a collection of Conditions (conditions()).
 */
export class ValidationManagerStartFluent extends ValueHostsManagerStartFluent
{
    /**
     * 
     * @param existingValueHostConfigs When assigned, we can check for naming conflicts.
     * @param services
     */
    constructor(existingValueHostConfigs: Array<ValueHostConfig> | null, services: IValueHostsServices)
    {
        super(existingValueHostConfigs, services);
    }

    public get services(): IValidationServices
    {
        return super.services as IValidationServices;
    }    

    /**
     * Use with any ValueHost with Validators that is does not have direct supporting functions here.
     * @param valueHostType 
     * @param arg1 - ValueHostname or a ValueHostConfig. When ValueHostConfig, omit the remaining parameters.
     * @param arg2 - optional and can be null. The value for ValueHost.dataType or any additional properties of ValueHostConfig.
     * @param arg3 - optional. Any additional properties of a ValueHostConfig.
     * @returns 
     */
    public withValidators<T extends ValidatorsValueHostBaseConfig>(valueHostType: ValueHostType | string, 
        arg1: FluentValidatorsValueHostConfig<T> | ValueHostName,
        arg2?: FluentValidatorsValueHostParameters<T> | string | null,
        arg3?: FluentValidatorsValueHostParameters<T>): IFluentValidatorBuilder
    {
        let config = this.withoutValidators<T>(valueHostType, arg1, arg2, arg3);
        if (!config.validatorConfigs)
            config.validatorConfigs = [];
        return this.services.fluentFactory.createFluentValidatorBuilder(config);
    }    


    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "require()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     */
    public field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): IFluentValidatorBuilder;
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     */
    public field(config: FluentFieldValueConfig): IFluentValidatorBuilder;
    // overload resolution
    public field(arg1: ValueHostName | FluentFieldValueConfig, arg2?: string | null, parameters?: FluentFieldParameters): IFluentValidatorBuilder
    {
        return this.withValidators<FieldValueHostConfig>(ValueHostType.Field, arg1, arg2, parameters);
    }    

}


