/**
 * Fluent syntax for ValueHosts and associated validation rules
 * used to build the ValueHostConfig (with all of its children) quickly
 * and succinctly. 
 * These tools are applied to ValueHostBuilder class, which is what the developer
 * creates with the ValidatorManagerConfig that they are constructing.
 * With the following, assume 'let builder = new ValueHostsBuilder(vmConfig)'.
 * The user will start the fluent syntax with builder.input() or builder.nonInput().
 * Those will setup the configs for InputValueHost or NonInputValueHost
 * taking advantage of intellisense to expose the available properties
 * of the config, which may be a subset of the original.
 * 
 * `builder.input('valueHostName').[chained validators]`
 * 
 * With optional parameters
 * 
 * `builder.input('valueHostName', 'datatype lookup key', { label: 'label' }).[chained validators];`
 * 
 * `builder.nonInput('valueHostName').[chained functions]`
 * 
 *  With optional parameters
 * 
 * `builder.nonInput('valueHostName', 'datatype lookup key', { label: 'label' }).[chained builder functions];`
 * 
 *  `builder.calc('valueHostName', 'datatype lookup key', function callback).[chained builder functions];`
 * 
 * For example:
 * ```ts
 * let valueHostConfigs = [
 *   builder.nonInput('productVisible', LookupKey.Boolean),
 *   builder.input('productName', LookupKey.String, { label: 'Name' }).required().regExp('^\w[\s\w]*$')`,
 *   builder.input('price', LookupKey.Currency, { label: 'Price' }).greaterThanOrEqual(0.0)`,
 *   builder.calc('maxPrice', LookupKey.Currency, calcMaxPrice) // calcMaxPrice is a function declared elsewhere
 * ];
 * let vm = new ValidationManager({
 *   services: createValidationServices(),
 *   valueHostConfigs = valueHostConfigs;
 * });
 * ```
 * `builder.input('productName').required().regExp('^\\d$')`
 * 
 * ## How this system works
 * 
 * Each condition class will define its fluent method based on its ConditionType name ("requireText", "regExp", etc).
 * They will use some TypeScript Declaration Merging magic to make their
 * class appear to be part of FluentValidatorCollector and FluentConditionCollector, classes that connect
 * the conditions to the InputValueHostConfig or EvaluateChildConditionResultsConfig.
 * 
 * - StartFluent - Class that starts a fluent chain. Its methods start InputValueHost (input()),
 *   NonInputValueHost (nonInput()), CalcValueHost (calc()) and a collection of Conditions (conditions()).
 * 
 * - FluentValidatorCollector - Class that supplies Conditions and InputValidators
 *   to the preceding InputValueHost. It is returned by builder.input() and each chained object that follows.
 * 
 * - FluentConditionCollector - Class that supplies Conditions to Conditions based upon EvaluateChildConditionResultsConfig:
 *   AllMatchCondition, AnyMatchCondition, and CountMatchesCondition. It is created 
 *   by builder.conditions()
 * 
 * ## Creating your own fluent functions
 * Create two functions to support chaining to builder.input() and builder.conditions().
 * They are not exported, as they are used to modify the prototypes of other classes.
 * 
 * Fluent functions should look like this: 
 * @example
 * export type FluentRegExpConditionConfig = Omit<RegExpConditionConfig, 'type' | 'valueHostName' | 'expressionAsString' | 'expression' | 'ignoreCase'>;
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
 * function regExp_forInput(
 *     expression: RegExp | string, ignoreCase?: boolean | null,
 *     conditionConfig?: FluentRegExpConditionConfig | null,
 *     errorMessage?: string | null,
 *     inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
 *     return finishFluentValidatorCollector(this,
 *         ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
 *         errorMessage, inputValidatorParameters);
 * }
 * function regExp_forConditions(
 *     valueHostName: ValueHostName | null,
 *     expression: RegExp | string, ignoreCase?: boolean | null,
 *     conditionConfig?: FluentRegExpConditionConfig | null): FluentConditionCollector {
 *     return finishFluentConditionCollector(this,
 *         ConditionType.RegExp, valueHostName, _genCDRegExp(expression, ignoreCase, conditionConfig));
 * }
 * 
 * declare module "../../@plblum/jivs-engine/build/src/ValueHosts/fluent"
 * {
 *    export interface FluentValidatorCollector
 *    {
 * // same definition as the actual function, except use the name the user should enter in chaining
 *       regExp(expression: RegExp | string, ignoreCase?: boolean | null,
 *          conditionConfig?: FluentRegExpConditionConfig | null, 
 *          errorMessage?: string | null, 
 *          inputValidatorParameters : FluentInputValidationConfig) : FluentValidatorCollector
 *    }
 *    export interface FluentConditionCollector
 *    {
 * // same definition as the actual function, except use the name the user should enter in chaining
 *       regExp(expression: RegExp | string, ignoreCase?: boolean | null,
 *          conditionConfig?: FluentRegExpConditionConfig) : FluentConditionCollector
 *    } 
 * }
 * FluentValidatorCollector.prototype.regExp = regExp_forInput;
 * FluentConditionCollector.prototype.regExp = regExp_forConditions;
 * 
 * @module ValueHosts/Fluent
 * ## Switching to a different condition library
 *  
 * Jivs is designed to allow a replacement to its own conditions. Thus the fluent system
 * allows replacing the FluentValidatorCollector and FluentConditionCollector classes with your own.
 * Just register it with fluentFactory.singleton.register().
 */

import { InputValidatorConfig } from '../Interfaces/Validator';
import { ConditionConfig, ICondition } from "../Interfaces/Conditions";
import { InputValueHostConfig } from "../Interfaces/InputValueHost";
import { NonInputValueHostConfig } from "../Interfaces/NonInputValueHost";
import { CodingError, assertNotNull } from "../Utilities/ErrorHandling";
import { EvaluateChildConditionResultsConfig } from '../Conditions/EvaluateChildConditionResultsBase';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { OneValueConditionConfig } from '../Conditions/OneValueConditionBase';
import { enableFluent } from '../Conditions/FluentValidatorCollectorExtensions';
import { CalculationHandler, CalcValueHostConfig } from '../Interfaces/CalcValueHost';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { ValidationManagerConfig } from '../Interfaces/ValidationManager';
import { ValueHostConfig } from '../Interfaces/ValueHost';
import { ConditionType } from '../Conditions/ConditionTypes';
import { resolveErrorCode } from './Validator';

/**
 * Starts a fluent chain. Its methods start InputValueHost (input()),
 * NonInputValueHost (nonInput()), and a collection of Conditions (conditions()).
 * You access it through the global fluent() function
 */
export class StartFluent
{
    /**
     * 
     * @param vmConfig When assigned, we can check for naming conflicts.
     */
    constructor(vmConfig: ValidationManagerConfig | null)
    {
        this._vmConfig = vmConfig;
        enableFluent();
    }
    private _vmConfig: ValidationManagerConfig | null;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     */
    public input(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the type property.
     */
    public input(config: FluentInputValueConfig): FluentValidatorCollector;
    // overload resolution
    public input(arg1: ValueHostName | FluentInputValueConfig, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector
    {
        this.assertFirstParameterValid(arg1);
        
        if (typeof arg1 === 'object') {
            let config: InputValueHostConfig =
                { ...arg1 as InputValueHostConfig, type: ValueHostType.Input };
            if (!config.validatorConfigs)
                config.validatorConfigs = [];

            return new FluentValidatorCollector(config);
        }
        if (typeof arg1 === 'string') {

            let config: InputValueHostConfig =
                { type: ValueHostType.Input, name: arg1 } as InputValueHostConfig;
            if (dataType)
                config.dataType = dataType;
            if (parameters)
                config = { ...parameters, ...config };
            if (!config.validatorConfigs)
                config.validatorConfigs = [];

            return new FluentValidatorCollector(config);;
        }
        /* istanbul ignore next */
        throw new Error('Should never get here');   // because assertFirstParameterValid will catch it
    }    
    /**
     * Fluent format to create a NonInputValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a NonInputValueHostConfig.
     */
    nonInput(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentNonInputParameters): NonInputValueHostConfig;
    /**
     * Fluent format to create a NonInputValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire NonInputValueHostConfig. This is a special use case.
     * You can omit the type property.
     */
    nonInput(config: Omit<NonInputValueHostConfig, 'type'>): NonInputValueHostConfig;
    // overload resolution
    nonInput(arg1: ValueHostName | NonInputValueHostConfig, dataType?: string | null, parameters?: FluentNonInputParameters): NonInputValueHostConfig
    {
        this.assertFirstParameterValid(arg1);
        if (typeof arg1 === 'object')
            return { ...arg1 as NonInputValueHostConfig, type: ValueHostType.NonInput };
        if (typeof arg1 === 'string') {

            let config: NonInputValueHostConfig = { type: ValueHostType.NonInput, name: arg1 };
            if (dataType)
                config.dataType = dataType;
            if (parameters)
                config = { ...parameters, ...config };
        
            return config;
        }
        /* istanbul ignore next */
        throw new Error('Should never get here');   // because assertFirstParameterValid will catch it
    }
    /**
     * Start of a series to collect ConditionConfigs into any condition that
     * implements EvaluateChildConditionResultsConfig.
     * For example, fluent().input('Field1').all(fluent().conditions().required('Field2').required('Field3'))
     * The fluent function for all (and others that support EvaluateChildConditionResultsConfig)
     * will get a FluentConditionCollector whose conditionConfigs collection is fully populated.
    * @param config - When null/undefined, the instance is created and the caller is expected
    * to retrieve its conditionConfigs from the config property.
    * When assigned, that instance gets conditionConfigs populated and 
    * there is no need to get a value from configs property.
    */
    public conditions(config?: EvaluateChildConditionResultsConfig): FluentConditionCollector
    {
        let collector = new FluentConditionCollector(config ?? null);
        return collector;
    }    

    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - can be null. The value for ValueHost.dataType.
     * @param calcFn - required. Function callback.
     */
    calc(valueHostName: ValueHostName, dataType: string | null, calcFn: CalculationHandler): CalcValueHostConfig;
    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
     * You can omit the type property.
     */
    calc(config: Omit<CalcValueHostConfig, 'type'>): CalcValueHostConfig;
    // overload resolution
    calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): CalcValueHostConfig
    {
        this.assertFirstParameterValid(arg1);
        if (typeof arg1 === 'object')
            return { ...arg1 as CalcValueHostConfig, type: ValueHostType.Calc };
        if (typeof arg1 === 'string') {
            if (typeof calcFn !== 'function')
                throw new CodingError('Must supply a calculation function');
            let config: CalcValueHostConfig = { type: ValueHostType.Calc, name: arg1, calcFn: calcFn };
            if (dataType)
                config.dataType = dataType;
        
            return config;
        }
        /* istanbul ignore next */
        throw new Error('Should never get here');   // because assertFirstParameterValid will catch it
    }    

    /**
     * Helper for fluent starting nodes to ensure the first parameter supplies
     * a name and that name is not previously defined.
     * @param arg 
     */
    protected assertFirstParameterValid(arg: ValueHostName | ValueHostConfig): void
    {
        assertNotNull(arg, 'arg1');
        
        if (typeof arg === 'object') {
            assertNotNull(arg.name, 'config.name');
            this.assertNameNotDefined(arg.name);
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
        if (this._vmConfig && this._vmConfig.valueHostConfigs.find((item) => item.name === valueHostName))
            throw new CodingError(`ValueHostName ${valueHostName} is already defined.`);        
    }

}

/**
 * Access point for starting a fluent syntax chain
 * @returns 
 */
export function fluent(): StartFluent
{
    return new StartFluent(null);
}


/**
 * For fluent configNonInput function.
 */
export type FluentNonInputParameters = Omit<NonInputValueHostConfig, 'type' | 'name' | 'dataType'>;

/**
 * For fluent configInput function.
 */
export type FluentInputValueConfig = Omit<InputValueHostConfig, 'type' | 'validatorConfigs'>;
export type FluentInputParameters = Omit<FluentInputValueConfig, 'name' | 'dataType'>;
/**
 * Targets fluent functions for conditions as their second parameter, hosting most of the 
 * properties needed for InputValidatorConfig
 */
export type FluentInputValidatorConfig = Omit<InputValidatorConfig, 'conditionConfig'>;


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
     * It takes the parameters passed into that function (conditionConfig and inputvalidatorconfig)
     * and assemble the final InputValidatorConfig, which it adds to the InputValueHostConfig.
     * @oaram conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - if null, expects inputValidatorConfig to supply either conditionConfig
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     * @param errorMessage - optional error message. Will overwrite any from inputValidatorConfig if
     * supplied.
     * @param inputValidatorConfig - does not expect conditionConfig to be setup, but if it is, it
     * will be replaced when conditionConfig is not null.
     */
    add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig> | null,
        errorMessage: string | null | undefined,
        inputValidatorConfig: FluentInputValidatorConfig | undefined | null): void;
}

/**
 * Supplies Conditions and InputValidators the preceding InputValueHost in a fluent chain. 
 * It is returned by ValueHostsBuilder.input() and each chained object that follows.
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
     * It takes the parameters passed into that function (conditionConfig and inputValidatorConfig)
     * and assemble the final InputValidatorConfig, which it adds to the InputValueHostConfig.
     * @oaram conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - if null, expects inputValidatorConfig to supply either conditionConfig
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     * @param errorMessage - optional error message. Will overwrite any from inputValidatorConfig if
     * supplied.
     * @param inputValidatorConfig - does not expect conditionConfig to be setup, but if it is, it
     * will be replaced when conditionConfig is not null.
     */
    public add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig> | null,
        errorMessage: string | null | undefined,
        inputValidatorConfig: FluentInputValidatorConfig | undefined | null): void
    {
        let ivDesc: InputValidatorConfig = inputValidatorConfig ?
            { ...inputValidatorConfig as InputValidatorConfig } :
            { conditionConfig: null };
        if (errorMessage != null)   // null or undefined
            ivDesc.errorMessage = errorMessage;

        if (conditionConfig)
            ivDesc.conditionConfig = { ...conditionConfig as ConditionConfig };
        if (conditionType && ivDesc.conditionConfig)
            ivDesc.conditionConfig.type = conditionType;
        // prevent duplicate errorcodes
        let errorCode = resolveErrorCode(ivDesc);
        if (this.parentConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode))
            throw new CodingError(`ValueHost name ${this._parentConfig.name} with errorCode ${errorCode} already defined.`);

        this.parentConfig.validatorConfigs!.push(ivDesc as InputValidatorConfig);
    }
}

/**
 * Conditions that use EvaluateChildConditionResultsConfig (All, Any, CountMatches, etc)
 * use this to collect child conditions. This differs from FluentValidatorCollector
 * as it does not deal with InputValidatorConfigs.
 * Yet the same fluent functions are used for both this and FluentValidatorCollector.
 * As a result, any parameters associated with InputValidatorConfig must be optional.
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with FluentFactory.
 */
export interface IFluentConditionCollector
{
    /**
     * The config that will collect the conditions.
     */
    parentConfig: EvaluateChildConditionResultsConfig;

    /**
     * For any implementation of a fluent function that works with FluentConditionCollector.
     * It takes the parameters passed into that function
     * and assemble the final conditionConfig.
     * @oaram conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     */
    add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig>): void;
}

/**
 * Supplies Conditions to Conditions that use EvaluateChildConditionResultsConfig:
 * AllMatchCondition, AnyMatchCondition, and CountMatchesCondition. It is created 
 * by ValueHostsBuilder.conditions()
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
    constructor(parentConfig: EvaluateChildConditionResultsConfig | null)
    {
        super();
        if (!parentConfig)
            parentConfig = { conditionConfigs: [], type: 'TBD' };
        if (!parentConfig.conditionConfigs)
            parentConfig.conditionConfigs = [];
        this._parentConfig = parentConfig;
    }
    /**
     * This is the value ultimately passed to the ValidationManager config.ValueHostConfigs.
     */
    public get parentConfig(): EvaluateChildConditionResultsConfig
    {
        return this._parentConfig;
    }
    private readonly _parentConfig: EvaluateChildConditionResultsConfig;

    /**
     * For any implementation of a fluent function that works with FluentConditionCollector.
     * It takes the parameters passed into that function
     * and assemble the final conditionConfig.
     * @oaram conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     */
    public add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig>): void
    {
        assertNotNull(conditionConfig, 'conditionConfig');
        if (conditionType)
            conditionConfig.type = conditionType;
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
 * @param inputValidatorParameters 
 * @returns The same instance passed into the first parameter to allow for chaining.
 */
export function finishFluentValidatorCollector(thisFromCaller: any, 
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig>,
    errorMessage: string | null | undefined,
    inputValidatorParameters: FluentInputValidatorConfig | undefined | null): FluentValidatorCollector
{
    if (thisFromCaller instanceof FluentValidatorCollector) {
        thisFromCaller.add(conditionType, conditionConfig, errorMessage, inputValidatorParameters);
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
 * Overrides the default valueHostName, which comes from the ValueHostsBuilder.input().
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
            (conditionConfig as OneValueConditionConfig).valueHostName = valueHostName;

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
            (vhConfig: EvaluateChildConditionResultsConfig) => new FluentConditionCollector(vhConfig);
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

    public createConditionCollector(vhConfig: EvaluateChildConditionResultsConfig): IFluentConditionCollector
    {
        return this._conditionCollectorCreator(vhConfig);
    }

    public registerConditionCollector(creator: (vhConfig: EvaluateChildConditionResultsConfig) => IFluentConditionCollector): void
    {
        assertNotNull(creator, 'creator');
        this._conditionCollectorCreator = creator;
    }
    private _conditionCollectorCreator: (vhConfig: EvaluateChildConditionResultsConfig) => IFluentConditionCollector;    

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

export function customRule(conditionCreator: (requester: InputValidatorConfig) => ICondition | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector
{
    if (this instanceof FluentValidatorCollector) {
        let ivConfig: InputValidatorConfig = inputValidatorParameters ?
            { ...inputValidatorParameters as InputValidatorConfig, conditionConfig: null } :
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
    constructor(errorMessage: string = 'Call only when chaining with ValueHostBuilder.input().')
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
    customRule(conditionCreator: (requester: InputValidatorConfig) => ICondition | null,
        errorMessage?: string | null,
        inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector | InputValidatorConfig;
}


/**
 * Make JavaScript associate the function with the class.
 */
FluentValidatorCollector.prototype.customRule = customRule;
//#endregion custom validation rule