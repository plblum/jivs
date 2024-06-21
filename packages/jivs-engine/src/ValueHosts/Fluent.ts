/**
 * This is the syntax to build the ValueHostConfig (with all of its children) quickly
 * and succinctly. It is a fluent syntax that allows the developer to chain operations.
 * 
 * These tools are used in the Builder API (ValidationManagerConfigBuilder class), 
 * which is what the developer creates with the ValidatorManagerConfig that they are constructing.
 * Similarly, these tools are used in the Modifier API (ValidationManagerConfigModifier class), 
 * which is what the developer uses to modify the configuration after ValidationManager is created.
 * Effectively ValidationManagerConfigBuilder and ValidationManagerConfigModifier are wrapper classes
 * around ValueHostsManagerStartFluent.
 * 
 * With the following, assume 'let builder = new ValidationManagerConfigBuilder(vmConfig)'.
 * 
 * The user will start the fluent syntax with builder.input(), builder.property(), 
 * builder.static(), or builder.calc().
 * Those will setup the configs for each type of ValueHost
 * taking advantage of intellisense to expose the available properties
 * of the config, which may be a subset of the original.
 * 
 * `builder.input('valueHostName').[chained validators]`
 * 
 * With optional parameters:
 * 
 * `builder.input('valueHostName', 'datatype lookup key', { label: 'label' }).[chained validators];`
 * 
 * `builder.property('valueHostName').[chained validators]`
 * 
 * With optional parameters:
 * 
 * `builder.property('valueHostName', 'datatype lookup key', { label: 'label' }).[chained validators];`
 * 
 * `builder.static('valueHostName').[chained functions]`
 * 
 *  With optional parameters:
 * 
 * `builder.static('valueHostName', 'datatype lookup key', { label: 'label' }).[chained builder functions];`
 * 
 * `builder.calc('valueHostName', 'datatype lookup key', function callback).[chained builder functions];`
 * 
 * For example:
 * ```ts
 * let builder = new ValidationManagerConfigBuilder(services);
 * builder.static('productVisible', LookupKey.Boolean);
 * builder.input('productName', LookupKey.String, { label: 'Name' }).requireText().regExp('^\w[\s\w]*$')`;
 * builder.input('price', LookupKey.Currency, { label: 'Price' }).greaterThanOrEqualValue(0.0)`;
 * builder.calc('maxPrice', LookupKey.Currency, calcMaxPrice); // calcMaxPrice is a function declared elsewhere
 * let vm = new ValidationManager(builder);
 * 
 * let modifier = vm.startModifying();
 * modifier.input('price').requireText();   // add this validator
 * modifier.apply();
 * ```
 * 
 * ## How this system works
 * 
 * Each condition class will define its fluent method based on its ConditionType name ("requireText", "regExp", etc).
 * They will use some TypeScript Declaration Merging magic to make their
 * class appear to be part of FluentValidatorCollector and FluentConditionCollector, classes that connect
 * the conditions to the InputValueHostConfig or EvaluateChildConditionResultsConfig.
 * 
 * - ValidationManagerStartFluent - Class that starts a fluent chain. Its methods start InputValueHost (input()),
 *   PropertyValueHost (property()), StaticValueHost (static()), CalcValueHost (calc()) and a collection of Conditions (conditions()).
 * 
 * - FluentValidatorCollector - Class that supplies Conditions and Validators
 *   to the preceding InputValueHost. It is returned by builder.input() and property() and each chained object that follows.
 * 
 * - FluentConditionCollector - Class that supplies Conditions to Conditions based upon EvaluateChildConditionResultsConfig:
 *   AllMatchCondition, AnyMatchCondition, and CountMatchesCondition. It is created 
 *   by builder.conditions()
 * 
 * ## Extending this system with your own fluent functions
 * Create two functions to support chaining to builder.input/property() and builder.conditions().
 * They are not exported, as they are used to modify the prototypes of other classes.
 * 
 * Fluent functions should look like this: 
 * @example
 * export type FluentRegExpConditionConfig = Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName' | 'expressionAsString' | 'expression' | 'ignoreCase'>;
 * 
 * function _genCDRegExp(
 *     expression: RegExp | string, ignoreCase?: boolean | null,
 *     conditionConfig?: FluentRegExpConditionConfig | null): RegExpConditionConfig {
 *     let condConfig: RegExpConditionConfig = (conditionConfig ? { ...conditionConfig } : {}) as RegExpConditionConfig;
 *     if (expression != null)
 *         if (expression instanceof RegExp)
 *             condConfig.expression = expression;
 *         else 
 *             condConfig.expressionAsString = expression;
 *     if (ignoreCase != null)
 *         condConfig.ignoreCase = ignoreCase;
 *     return condConfig as RegExpConditionConfig;
 * }
 * function regExp_forValidator(
 *     expression: RegExp | string, ignoreCase?: boolean | null,
 *     conditionConfig?: FluentRegExpConditionConfig | null,
 *     errorMessage?: string | null,
 *     validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
 *     return finishFluentValidatorCollector(this,
 *         ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
 *         errorMessage, validatorParameters);
 * }
 * function regExp_forConditions(
 *     valueHostName: ValueHostName | null,
 *     expression: RegExp | string, ignoreCase?: boolean | null,
 *     conditionConfig?: FluentRegExpConditionConfig | null): FluentConditionCollector {
 *     return finishFluentConditionCollector(this,
 *         ConditionType.RegExp, valueHostName, _genCDRegExp(expression, ignoreCase, conditionConfig));
 * }
 * 
 * declare module "@plblum/jivs-engine/build/ValueHosts/fluent"
 * {
 *    export interface FluentValidatorCollector
 *    {
 * // same definition as the actual function, except use the name the user should enter in chaining
 *       regExp(expression: RegExp | string, ignoreCase?: boolean | null,
 *          conditionConfig?: FluentRegExpConditionConfig | null, 
 *          errorMessage?: string | null, 
 *          validatorParameters : FluentRegExpConditionConfig) : FluentValidatorCollector
 *    }
 *    export interface FluentConditionCollector
 *    {
 * // same definition as the actual function, except use the name the user should enter in chaining
 *       regExp(expression: RegExp | string, ignoreCase?: boolean | null,
 *          conditionConfig?: FluentRegExpConditionConfig) : FluentConditionCollector
 *    } 
 * }
 * FluentValidatorCollector.prototype.regExp = regExp_forValidator;
 * FluentConditionCollector.prototype.regExp = regExp_forConditions;
 * 
 * @module ValueHosts/Fluent
 * ## Switching to a different condition library
 *  
 * Jivs is designed to allow a replacement to its own conditions. Thus the fluent system
 * allows replacing the FluentValidatorCollector and FluentConditionCollector classes with your own.
 * Just register it with fluentFactory.singleton.register().
 */

import { ValidatorConfig } from '../Interfaces/Validator';
import { ConditionConfig, ICondition } from "../Interfaces/Conditions";
import { InputValueHostConfig } from "../Interfaces/InputValueHost";
import { StaticValueHostConfig } from "../Interfaces/StaticValueHost";
import { CodingError, assertNotNull } from "../Utilities/ErrorHandling";
import { EvaluateChildConditionResultsBaseConfig } from '../Conditions/EvaluateChildConditionResultsBase';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { OneValueConditionBaseConfig } from '../Conditions/OneValueConditionBase';
import { enableFluent } from '../Conditions/FluentValidatorCollectorExtensions';
import { CalculationHandler, CalcValueHostConfig } from '../Interfaces/CalcValueHost';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { ValidationManagerConfig } from '../Interfaces/ValidationManager';
import { ValueHostConfig } from '../Interfaces/ValueHost';
import { resolveErrorCode } from '../Utilities/Validation';
import { PropertyValueHostConfig } from '../Interfaces/PropertyValueHost';
import { ValueHostsManagerConfig } from '../Interfaces/ValueHostsManager';
import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
import { isPlainObject, isSupportedAsValue } from '../Utilities/Utilities';


/**
 * Starts a fluent chain for ValueHostsManager. Its methods start CalcValueHost (calc()),
 * and StaticValueHost (static())
 */
export class ValueHostsManagerStartFluent<TConfig extends ValueHostsManagerConfig = ValueHostsManagerConfig>
{
    /**
     * 
     * @param vmConfig When assigned, we can check for naming conflicts.
     */
    constructor(vmConfig: TConfig | null)
    {
        this._vmConfig = vmConfig;
        enableFluent();
    }
    private _vmConfig: TConfig | null;

    protected get vmConfig(): TConfig | null
    {
        return this._vmConfig;
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

    /**
     * Start of a series to collect ConditionConfigs into any condition that
     * implements EvaluateChildConditionResultsConfig.
     * For example:
     * ```ts
     * let fluent = new ValueHostsManagerStartFluent(null);
     * fluent.input('Field1').all(fluent.conditions().required('Field2').required('Field3'));
     * ```
     * The fluent function for allCondition (and others that support EvaluateChildConditionResultsConfig)
     * will get a FluentConditionCollector whose conditionConfigs collection is fully populated.
    * @param config - When null/undefined, the instance is created and the caller is expected
    * to retrieve its conditionConfigs from the config property.
    * When assigned, that instance gets conditionConfigs populated and 
    * there is no need to get a value from configs property.
    */
    public conditions(config?: EvaluateChildConditionResultsBaseConfig): FluentConditionCollector
    {
        let collector = new FluentConditionCollector(config ?? null);
        return collector;
    }   
    
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
            throw new TypeError('Must pass valuehost name or InputValueHostConfig');
    }        

    protected assertNameNotDefined(valueHostName: ValueHostName): void
    {
        if (this.vmConfig && this.vmConfig.valueHostConfigs.find((item) => item.name === valueHostName))
            throw new CodingError(`ValueHostName ${valueHostName} is already defined.`);        
    }

}


/**
 * Starts a fluent chain. Its methods start InputValueHost (input()),
 * StaticValueHost (static()), and a collection of Conditions (conditions()).
 */
export class ValidationManagerStartFluent extends ValueHostsManagerStartFluent<ValidationManagerConfig>
{
    /**
     * 
     * @param vmConfig When assigned, we can check for naming conflicts.
     */
    constructor(vmConfig: ValidationManagerConfig | null)
    {
        super(vmConfig);
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
        arg3?: FluentValidatorsValueHostParameters<T>): FluentValidatorCollector
    {
        let config = this.withoutValidators<T>(valueHostType, arg1, arg2, arg3);
        if (!config.validatorConfigs)
            config.validatorConfigs = [];
        return new FluentValidatorCollector(config);
    }    


    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "require()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     */
    public input(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     */
    public input(config: FluentInputValueConfig): FluentValidatorCollector;
    // overload resolution
    public input(arg1: ValueHostName | FluentInputValueConfig, arg2?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector
    {
        return this.withValidators<InputValueHostConfig>(ValueHostType.Input, arg1, arg2, parameters);
    }    

    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "require()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     */
    public property(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorCollector;
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire PropertyValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     */
    public property(config: FluentPropertyValueConfig): FluentValidatorCollector;
    // overload resolution
    public property(arg1: ValueHostName | FluentPropertyValueConfig, arg2?: string | null, arg3?: FluentPropertyParameters): FluentValidatorCollector
    {
        return this.withValidators<PropertyValueHostConfig>(ValueHostType.Property, arg1, arg2, arg3);
    }     

}

/**
 * For fluent configStatic function.
 */
export type FluentStaticValueConfig = Omit<StaticValueHostConfig, 'valueHostType' | 'conditionType' >;
export type FluentStaticParameters = Omit<FluentStaticValueConfig, 'name' | 'dataType'>;

/**
 * For fluent input() function.
 */
export type FluentInputValueConfig = Omit<InputValueHostConfig, 'valueHostType' | 'conditionType' | 'validatorConfigs'>;
export type FluentInputParameters = Omit<FluentInputValueConfig, 'name' | 'dataType'>;


/**
 * For fluent property() function.
 */
export type FluentPropertyValueConfig = Omit<PropertyValueHostConfig, 'valueHostType' | 'conditionType' | 'validatorConfigs'>;
export type FluentPropertyParameters = Omit<FluentPropertyValueConfig, 'name' | 'dataType'>;

/**
 * For fluent calc() function.
 */
export type FluentCalcValueConfig = Omit<CalcValueHostConfig, 'valueHostType' | 'conditionType' | 'initialValue' | 'label' | 'labell10n'>;

/**
 * For fluent withoutValidators() function.
 */
export type FluentAnyValueHostConfig<T extends ValueHostConfig> = Omit<T, 'valueHostType' | 'conditionType' | 'validatorConfigs'>;
export type FluentAnyValueHostParameters<T extends ValueHostConfig> = Omit<FluentAnyValueHostConfig<T>, 'name' | 'dataType' >;

/**
 * for fluent withValidators() function.
 */
export type FluentValidatorsValueHostConfig<T extends ValidatorsValueHostBaseConfig> = Omit<T, 'valueHostType' | 'conditionType' | 'validatorConfigs'>;
export type FluentValidatorsValueHostParameters<T extends ValidatorsValueHostBaseConfig> = Omit<FluentValidatorsValueHostConfig<T>, 'name' | 'dataType'>;

/**
 * Targets fluent functions for conditions as their second parameter, hosting most of the 
 * properties needed for ValidatorConfig
 */
export type FluentValidatorConfig = Omit<ValidatorConfig, 'conditionConfig' | 'conditionCreator'>;


/**
 * Class that will get fluent functions attached
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html.
 * 
 * Those functions will treat their 'this' as FluentCollectorBase
 * and testing this for its subclasses, FluentValidatorCollector and FluentConditionCollector.
 * They will call the subclass's add() method to add to its collection.
 * See @link ValueHosts/Fluent
 */
export abstract class FluentCollectorBase
{
    constructor()
    {

    }
}

/**
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with FluentFactory.
 */
export interface IFluentValidatorCollector
{
    /**
     * The InputValueHostConfig that is being constructed and will be supplied to ValidationManagerConfig.valueHostConfigs.
     */
    parentConfig: InputValueHostConfig;    
    /**
     * For any implementation of a fluent function that works with FluentValidatorCollector.
     * It takes the parameters passed into that function (conditionConfig and validatorconfig)
     * and assemble the final ValidatorConfig, which it adds to the InputValueHostConfig.
     * @param conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - if null, expects validatorConfig to supply either conditionConfig
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     * @param errorMessage - optional error message. Will overwrite any from validatorConfig if
     * supplied.
     * @param validatorConfig - does not expect conditionConfig to be setup, but if it is, it
     * will be replaced when conditionConfig is not null.
     */
    add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig> | null,
        errorMessage: string | null | undefined,
        validatorConfig: FluentValidatorConfig | undefined | null): void;
}

/**
 * Supplies Conditions and Validators the preceding InputValueHost in a fluent chain. 
 * It is returned by ValidationManagerConfigBuilder.input() and each chained object that follows.
 * 
 * This class will dynamically get fluent functions for each condition
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 * 
 * See {@link ValueHosts/Fluent | Fluent Overview}
 */
export class FluentValidatorCollector extends FluentCollectorBase implements IFluentValidatorCollector
{
    constructor(parentConfig: InputValueHostConfig)
    {
        super();
        assertNotNull(parentConfig, 'parentConfig');
        if (!parentConfig.validatorConfigs)
            parentConfig.validatorConfigs = [];
        this._parentConfig = parentConfig;
    }
    /**
     * This is the value ultimately passed to the ValidationManager config.ValueHostConfigs.
     */
    public get parentConfig(): InputValueHostConfig
    {
        return this._parentConfig;
    }
    private readonly _parentConfig: InputValueHostConfig;

    /**
     * For any implementation of a fluent function that works with FluentValidationRule.
     * It takes the parameters passed into that function (conditionConfig and validatorConfig)
     * and assemble the final ValidatorConfig, which it adds to the InputValueHostConfig.
     * @param conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - if null, expects validatorConfig to supply either conditionConfig
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     * @param errorMessage - optional error message. Will overwrite any from validatorConfig if
     * supplied.
     * @param validatorConfig - does not expect conditionConfig to be setup, but if it is, it
     * will be replaced when conditionConfig is not null.
     */
    public add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig> | null,
        errorMessage: string | null | undefined,
        validatorConfig: FluentValidatorConfig | undefined | null): void
    {
        let ivDesc: ValidatorConfig = validatorConfig ?
            { ...validatorConfig as ValidatorConfig } :
            { conditionConfig: null };
        if (errorMessage != null)   // null or undefined
            ivDesc.errorMessage = errorMessage;

        if (conditionConfig)
            ivDesc.conditionConfig = { ...conditionConfig as ConditionConfig };
        if (conditionType && ivDesc.conditionConfig)
            ivDesc.conditionConfig.conditionType = conditionType;
        // prevent duplicate errorcodes
        let errorCode = resolveErrorCode(ivDesc);
        if (this.parentConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode))
            throw new CodingError(`ValueHost name "${this._parentConfig.name}" with errorCode ${errorCode} already defined.`);

        this.parentConfig.validatorConfigs!.push(ivDesc as ValidatorConfig);
    }
}

/**
 * Conditions that use EvaluateChildConditionResultsConfig (All, Any, CountMatches, etc)
 * use this to collect child conditions. This differs from FluentValidatorCollector
 * as it does not deal with ValidatorConfigs.
 * Yet the same fluent functions are used for both this and FluentValidatorCollector.
 * As a result, any parameters associated with ValidatorConfig must be optional.
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with FluentFactory.
 */
export interface IFluentConditionCollector
{
    /**
     * The config that will collect the conditions.
     */
    parentConfig: EvaluateChildConditionResultsBaseConfig;

    /**
     * For any implementation of a fluent function that works with FluentConditionCollector.
     * It takes the parameters passed into that function
     * and assemble the final conditionConfig.
     * @param conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     */
    add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig>): void;
}

/**
 * Supplies Conditions to Conditions that use EvaluateChildConditionResultsConfig:
 * AllMatchCondition, AnyMatchCondition, and CountMatchesCondition. It is created 
 * by ValidationManagerConfigBuilder.conditions()
 * 
 * This class will dynamically get fluent functions for each condition
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 * 
 * See {@link ValueHosts/Fluent | Fluent Overview}
 */
export class FluentConditionCollector extends FluentCollectorBase implements IFluentConditionCollector
{
    /**
     * 
     * @param parentConfig null, the instance is created and the caller is expected
     * to retrieve its conditionConfigs from the config property.
     * When assigned, that instance gets conditionConfigs populated and 
     * there is no need to get a value from configs property.
     */
    constructor(parentConfig: EvaluateChildConditionResultsBaseConfig | null)
    {
        super();
        if (!parentConfig)
            parentConfig = { conditionConfigs: [], conditionType: 'TBD' };
        if (!parentConfig.conditionConfigs)
            parentConfig.conditionConfigs = [];
        this._parentConfig = parentConfig;
    }
    /**
     * This is the value ultimately passed to the ValidationManager config.ValueHostConfigs.
     */
    public get parentConfig(): EvaluateChildConditionResultsBaseConfig
    {
        return this._parentConfig;
    }
    private readonly _parentConfig: EvaluateChildConditionResultsBaseConfig;

    /**
     * For any implementation of a fluent function that works with FluentConditionCollector.
     * It takes the parameters passed into that function
     * and assemble the final conditionConfig.
     * @param conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     */
    public add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig>): void
    {
        assertNotNull(conditionConfig, 'conditionConfig');
        if (conditionType)
            conditionConfig.conditionType = conditionType;
        this.parentConfig.conditionConfigs!.push(conditionConfig as ConditionConfig);
    }
}

/**
 * Call from within a fluent function once you have all parameters fully setup.
 * It will complete the setup.
 * @param thisFromCaller 
 * Should be a FluentValidatorCollector. Fluent function expects to pass its value
 * of 'this' here. However, its possible self is not FluentValidatorCollector.
 * We'll throw an exception here in that case.
 * @param conditionType 
 * @param conditionConfig 
 * @param errorMessage 
 * @param validatorParameters 
 * @returns The same instance passed into the first parameter to allow for chaining.
 */
export function finishFluentValidatorCollector(thisFromCaller: any, 
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig>,
    errorMessage: string | null | undefined,
    validatorParameters: FluentValidatorConfig | undefined | null): FluentValidatorCollector
{
    if (thisFromCaller instanceof FluentValidatorCollector) {
        thisFromCaller.add(conditionType, conditionConfig, errorMessage, validatorParameters);
        return thisFromCaller;
    }
    throw new FluentSyntaxRequiredError();
}
/**
 * Call from within a fluent function once you have all parameters fully setup.
 * It will complete the setup.
 * @param thisFromCaller 
 * Should be a FluentConditionCollector. Fluent function expects to pass its value
 * of 'this' here. However, its possible self is not FluentConditionCollector.
 * We'll throw an exception here in that case.
 * @param conditionType 
 * @param valueHostName 
 * Overrides the default valueHostName, which comes from the ValidationManagerConfigBuilder.input().
 * Fluent function should supply this as a parameter
 * so long as its ConditionConfig implements OneValueConditionConfig.
 * Since these conditions are children of another, they are more likely to
 * need the valueHostName than those in FluentValidatorCollectors.
 * @param conditionConfig 
 * @returns The same instance passed into the first parameter to allow for chaining.
 */
export function finishFluentConditionCollector(thisFromCaller: any, 
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig>,
    valueHostName?: ValueHostName): FluentConditionCollector
{
    if (thisFromCaller instanceof FluentConditionCollector) {
        if (valueHostName)
            (conditionConfig as OneValueConditionBaseConfig).valueHostName = valueHostName;

        thisFromCaller.add(conditionType, conditionConfig);
        return thisFromCaller;
    }    
    throw new FluentSyntaxRequiredError();
}
/**
 * Factory that returns a new instance of IFluentValidatorCollector and IFluentConditionCollector.
 * By default, it supplies FluentValidatorCollector and FluentConditionCollector.
 * When you create alternative conditions, you will also reimplemnt 
 * IFluentValidatorCollector and IFluentConditionCollector and register them here.
 */
export class FluentFactory
{
    constructor()
    {
        this._validatorCollectorCreator =
            (vhConfig: InputValueHostConfig) => new FluentValidatorCollector(vhConfig);
        this._conditionCollectorCreator =
            (vhConfig: EvaluateChildConditionResultsBaseConfig) => new FluentConditionCollector(vhConfig);
    }
    public createValidatorCollector(vhConfig: InputValueHostConfig): IFluentValidatorCollector
    {
        return this._validatorCollectorCreator(vhConfig);
    }

    public registerValidatorCollector(creator: (vhConfig: InputValueHostConfig) => IFluentValidatorCollector): void
    {
        assertNotNull(creator, 'creator');
        this._validatorCollectorCreator = creator;
    }
    private _validatorCollectorCreator: (vhConfig: InputValueHostConfig) => IFluentValidatorCollector;

    public createConditionCollector(vhConfig: EvaluateChildConditionResultsBaseConfig): IFluentConditionCollector
    {
        return this._conditionCollectorCreator(vhConfig);
    }

    public registerConditionCollector(creator: (vhConfig: EvaluateChildConditionResultsBaseConfig) => IFluentConditionCollector): void
    {
        assertNotNull(creator, 'creator');
        this._conditionCollectorCreator = creator;
    }
    private _conditionCollectorCreator: (vhConfig: EvaluateChildConditionResultsBaseConfig) => IFluentConditionCollector;    

    /**
     * Unlike other factories, which are on ValidationServices. We wanted to avoid
     * passing the ValidationServices class into the entry point functions as our
     * intention is to keep the syntax small and simple.
     */
    public static singleton: FluentFactory = new FluentFactory();
}


//#region custom validation rule
//!!!NOTE: Currently customRule does not support FluentConditionCollector.

/**
 * The fluent function that allows the user to supply a conditionCreator function
 * instead of setting up a condition through a config.
 * The actual code for our extension method. It will be associated with an interface declaration,
 * and assigned to the prototype of the FluentValidatorCollector class.
 * As an EXTENSION FUNCTION, it extends FluentValidatorCollector, and 
 * REQUIRES 'this' to be an instance of FluentValidatorCollector.
 * For more on setting up your own fluent function, see @link ValueHosts/Fluent|Fluent.
 */

export function customRule(conditionCreator: (requester: ValidatorConfig) => ICondition | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector
{
    if (this instanceof FluentValidatorCollector) {
        let ivConfig: ValidatorConfig = validatorParameters ?
            { ...validatorParameters as ValidatorConfig, conditionConfig: null } :
            { conditionConfig: null}; 
        ivConfig.conditionCreator = conditionCreator;
        let self = this as FluentValidatorCollector;
        self.add(null, null, errorMessage, ivConfig);
        return self;
    }
    throw new FluentSyntaxRequiredError();
}
export class FluentSyntaxRequiredError extends Error
{
    constructor(errorMessage: string = 'Call only when chaining with ValidationManagerConfigBuilder.input().')
    {
        super(errorMessage);
    }
}

/**
 * Make TypeScript associate the function with the class
 */

// interface that extends the class FluentValidationRule
export declare interface FluentValidatorCollector
{
    customRule(conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        errorMessage?: string | null,
        validatorParameters?: FluentValidatorConfig): FluentValidatorCollector | ValidatorConfig;
}


/**
 * Make JavaScript associate the function with the class.
 */
FluentValidatorCollector.prototype.customRule = customRule;
//#endregion custom validation rule