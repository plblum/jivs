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
 * The user will start the fluent syntax with builder.field(), 
 * builder.static(), or builder.calc().
 * Those will setup the configs for each type of ValueHost
 * taking advantage of intellisense to expose the available properties
 * of the config, which may be a subset of the original.
 * 
 * `builder.field('valueHostName').[chained validators]`
 * 
 * With optional parameters:
 * 
 * `builder.field('valueHostName', 'datatype lookup key', { label: 'label' }).[chained validators];`
 * 
 * With optional parameters:
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
 * builder.field('productName', LookupKey.String, { label: 'Name' }).requireText().regExp('^\w[\s\w]*$')`;
 * builder.field('price', LookupKey.Currency, { label: 'Price' }).greaterThanOrEqualValue(0.0)`;
 * builder.calc('maxPrice', LookupKey.Currency, calcMaxPrice); // calcMaxPrice is a function declared elsewhere
 * let vm = new ValidationManager(builder);
 * 
 * let modifier = vm.startModifying();
 * modifier.field('price').requireText();   // add this validator
 * modifier.apply();
 * ```
 * 
 * ## How this system works
 * 
 * Each condition class will define its fluent method based on its ConditionType name ("requireText", "regExp", etc).
 * They will use some TypeScript Declaration Merging magic to make their
 * class appear to be part of FluentValidatorBuilder and FluentConditionBuilder, classes that connect
 * the conditions to the FieldValueHostConfig or EvaluateChildConditionResultsConfig.
 * 
 * - ValidationManagerStartFluent - Class that starts a fluent chain. Its methods start FieldValueHost (field()),
 *   StaticValueHost (static()), CalcValueHost (calc()) and a collection of Conditions (conditions()).
 *   ```ts
 *   let fluent = new ValueHostsManagerStartFluent(null);
 *   fluent.field('Field1').requireText().regExp('pattern').greaterThanOrEqualValue(0);
 *   fluent.calc('Field2', LookupKey.Number, calcFn);
 *   fluent.static('Field3');
 *   ```
 * - ValidationManagerConfigBuilder - Wrapper around ValidationManagerStartFluent 
 *   that is used to create a ValidationManagerConfig. 
 *   It is the main entry point for the developer to create a ValidationManagerConfig.
 *   It has wrapper functions around field(), static(), and calc() that call the underlying fluent functions.
 * 
 *   ```ts
 *   let builder = new ValidationManagerConfigBuilder();
 *   builder.field('Field1').requireText().regExp('pattern').greaterThanOrEqualValue(0);
 *   builder.calc('Field2', LookupKey.Number, calcFn);
 *   builder.static('Field3');
 *   ```
 * 
 * - FluentValidatorBuilder - Class that supplies Conditions and Validators
 *   to the preceding FieldValueHost. It is returned by fluent.field() and each chained object that follows.
 *   ```ts
 *   fluent.field(field name) -> FluentValidatorBuilder
 *   ```
 *   It exposes functions specific to each Condition class, like requireText(), regExp(), greaterThanOrEqualValue(), etc.
 *   ```ts
 *   fluent.field('Field1').requireText(), regExp(), etc
 *   ```
 *   Then the individual condition takes over the fluent chain, returning a FluentValidatorBuilder 
 *   for the next condition.
 * 
 * - FluentSingleFieldConditionBuilder and FluentMultiFieldConditionBuilder - 
 *   Starts a fluent sequence to create child conditions for a parent condition or validator. 
 *   At this point, we need to specify the valueHostName used for the upcoming condition,
 *   similar to how we specify it in fluent.field().
 *   ```ts
 *   childbuilder.fieldValue(valueHostName).condition()
 *   childbuilder.parentValue().condition()
 *   ```
 *   Conditions that support child conditions (like when, not, all, any, etc.) will use these builders 
 *   to create their child conditions.
 *   ```ts
 *   childbuilder.field('Field1').all(
 *      childBuilder -> FluentMultiFieldConditionBuilder) -> FluentValidatorBuilder
 *   childbuilder.field('Field1').when(
 *      whenBuilder -> FluentSingleFieldConditionBuilder,
 *      thenBuilder -> FluentSingleFieldConditionBuilder) -> FluentValidatorBuilder
 *   ```
 *   ```ts
 *   builder.field('Field1').all(
 *     (allBuilder : FluentMultiFieldConditionBuilder) => [
 *         allBuilder.fieldValue('Field2').requireText(),
 *         allBuilder.fieldValue('Field3').requireText()
 *      ]);
 *   builder.field('Field1').when(
 *      (whenBuilder : FluentSingleFieldConditionBuilder) => 
 *          whenBuilder.fieldValue('Field2').regExp('pattern'),
 *     (thenBuilder : FluentSingleFieldConditionBuilder) =>
 *        thenBuilder.fieldValue('Field3').requireText());
 *   );
 *   ```
 * 
 * - FluentConditionBuilder - Fluent node that is returned by FluentSingleFieldConditionBuilder and FluentMultiFieldConditionBuilder.
 *   to specify a condition. It has all available conditions as functions, like requireText(), regExp(), greaterThanOrEqualValue(), etc.
 *   It inherits the valueHostName from the preceding fieldValue() function.
 *   The ultimate result is the syntax reading left to right.
 *     ```ts
 *     builder.fieldValue('Field1').requireText()
 *     builder.parentValue().lessThanValue(100)
 *     ```
 * 
 * ## Extending this system with your own fluent functions
 * Create two functions to support chaining to builder.field and builder.conditions().
 * They are not exported, as they are used to modify the prototypes of other classes.
 * 
 * Fluent functions should look like this: 
 * @example
```ts
export type FluentEqualToConditionConfig = Partial<Omit<EqualToConditionConfig, 'conditionType' | 'category' | 'secondValueHostName'>>;
// core function to convert source parameters into the final conditionConfig object
// specific to the condition type.
export function _genDCEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null): EqualToConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as EqualToConditionConfig;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}
// for the FluentConditionBuilder to show its equalTo function.
function equalTo_ForConditions(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig), valueHostName);
}

// for the FluentValidatorBuilder to show its equalTo function.
export type FluentEqualToValidatorConfig = FluentEqualToConditionConfig & FluentValidatorConfig;

function equalTo(
    secondValueHostName: ValueHostName,
    errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
function equalTo(
    secondValueHostName: ValueHostName,
    validatorParameters: FluentEqualToValidatorConfig): FluentValidatorBuilder;
function equalTo(
    secondValueHostName: ValueHostName,
    args2?: FluentEqualToConditionConfig | string | null,
    args3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<EqualToConditionConfig>(args2, args3);
    
    return finishFluentValidatorBuilder(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

 declare module "@plblum/jivs-engine/build/Builder/Fluent"
 {
    export interface FluentValidatorBuilder
    {
 // overloads for the equalTo function in two formats:
 // 1. supplies error message + summary message (optionally)
 // 2. supplies validatorParameters, which can include error message + summary message and more
        equalTo(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        equalTo(
            secondValueHostName: ValueHostName,
            validatorParameters: FluentEqualToValidatorConfig): FluentValidatorBuilder;
    }
    export interface FluentConditionBuilder
    {
        equalTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentEqualToConditionConfig | null): FluentConditionBuilder;
    } 
 }
 FluentValidatorBuilder.prototype.equalTo = equalTo;
 FluentConditionBuilder.prototype.equalTo = equalTo_ForConditions;
 ```
 * 
 * @module Builder/Fluent
 * ## Switching to a different condition library
 *  
 * Jivs is designed to allow a replacement to its own conditions. Thus the fluent system
 * allows replacing the FluentValidatorBuilder and FluentConditionBuilder classes with your own.
 * Just register it with fluentFactory.singleton.register().
 */

import { IDisposable } from '../Interfaces/General_Purpose';
import { ValidatorConfig } from '../Interfaces/Validator';
import { ConditionConfig, ICondition } from "../Interfaces/Conditions";
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { StaticValueHostConfig } from "../Interfaces/StaticValueHost";
import { CodingError, assertNotNull } from "../Utilities/ErrorHandling";
import { ConditionWithChildrenBaseConfig } from '../Conditions/ConditionWithChildrenBase';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { OneValueConditionBaseConfig } from '../Conditions/OneValueConditionBase';
import { enableFluent } from './FluentValidatorBuilderExtensions';
import { CalculationHandler, CalcValueHostConfig } from '../Interfaces/CalcValueHost';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { ValueHostConfig } from '../Interfaces/ValueHost';
import { resolveErrorCode } from '../Utilities/Validation';
import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
import { isPlainObject } from '../Utilities/Utilities';
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';
import { IServicesAccessor } from '../Interfaces/Services';
import { FluentSingleFieldConditionBuilder, FluentMultiFieldConditionBuilder } from './FluentFieldConditionBuilder';


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
        enableFluent();
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

    /**
     * Start of a series to collect ConditionConfigs into any condition that
     * implements EvaluateChildConditionResultsConfig.
     * For example:
     * ```ts
     * let fluent = new ValueHostsManagerStartFluent(null);
     * fluent.field('Field1').all([
     *  fluent.conditions().required('Field2').required('Field3'));
     * ```
     * The fluent function for allCondition (and others that support EvaluateChildConditionResultsConfig)
     * will get a FluentConditionBuilder whose conditionConfigs collection is fully populated.
    * @param config - When null/undefined, the instance is created and the caller is expected
    * to retrieve its conditionConfigs from the config property.
    * When assigned, that instance gets conditionConfigs populated and 
    * there is no need to get a value from configs property.
    */
    public conditions(config?: ConditionWithChildrenBaseConfig): FluentMultiFieldConditionBuilder
    {
        config = config ?? { conditionType: 'TBD', conditionConfigs: [] };
        if (config.conditionConfigs == null) // null or undefined
            config.conditionConfigs = [];
        let builder = new FluentMultiFieldConditionBuilder(config ?? null);
        return builder;
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
        arg3?: FluentValidatorsValueHostParameters<T>): FluentValidatorBuilder
    {
        let config = this.withoutValidators<T>(valueHostType, arg1, arg2, arg3);
        if (!config.validatorConfigs)
            config.validatorConfigs = [];
        return new FluentValidatorBuilder(config);
    }    


    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "require()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     */
    public field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     */
    public field(config: FluentFieldValueConfig): FluentValidatorBuilder;
    // overload resolution
    public field(arg1: ValueHostName | FluentFieldValueConfig, arg2?: string | null, parameters?: FluentFieldParameters): FluentValidatorBuilder
    {
        return this.withValidators<FieldValueHostConfig>(ValueHostType.Field, arg1, arg2, parameters);
    }    

}

/**
 * For fluent configStatic function.
 */
export type FluentStaticValueConfig = Omit<StaticValueHostConfig, 'valueHostType' | 'conditionType' | 'enablerConfig' >;
export type FluentStaticParameters = Omit<FluentStaticValueConfig, 'name' | 'dataType'>;

/**
 * For fluent field() function.
 */
export type FluentFieldValueConfig = Omit<FieldValueHostConfig, 'valueHostType' | 'conditionType' | 'validatorConfigs' | 'enablerConfig'>;
export type FluentFieldParameters = Omit<FluentFieldValueConfig, 'name' | 'dataType'>;

/**
 * For fluent calc() function.
 */
export type FluentCalcValueConfig = Omit<CalcValueHostConfig, 'valueHostType' | 'conditionType' | 'initialValue' | 'label' | 'labell10n' | 'enablerConfig'>;

/**
 * For fluent withoutValidators() function.
 */
export type FluentAnyValueHostConfig<T extends ValueHostConfig> = Omit<T, 'valueHostType' | 'conditionType' | 'validatorConfigs' | 'enablerConfig'>;
export type FluentAnyValueHostParameters<T extends ValueHostConfig> = Omit<FluentAnyValueHostConfig<T>, 'name' | 'dataType' >;

/**
 * for fluent withValidators() function.
 */
export type FluentValidatorsValueHostConfig<T extends ValidatorsValueHostBaseConfig> = Omit<T, 'valueHostType' | 'conditionType' | 'validatorConfigs' | 'enablerConfig'>;
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
 * Those functions will treat their 'this' as FluentBuilderBase
 * and testing this for its subclasses, FluentValidatorBuilder and FluentConditionBuilder.
 * They will call the subclass's add() method to add to its collection.
 * See @link Builder/Fluent
 */
export abstract class FluentBuilderBase
{
    constructor()
    {

    }
}

/**
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with FluentFactory.
 */
export interface IFluentValidatorBuilder
{
    /**
     * The FieldValueHostConfig that is being constructed and will be supplied to ValidationManagerConfig.valueHostConfigs.
     */
    parentConfig: FieldValueHostConfig;    
    /**
     * For any implementation of a fluent function that works with FluentValidatorBuilder.
     * It takes the parameters passed into that function (conditionConfig and validatorconfig)
     * and assemble the final ValidatorConfig, which it adds to the FieldValueHostConfig.
     * @param conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - if null, expects validatorConfig to supply either conditionConfig
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     * @param errorMessage - optional error message. Will overwrite any from validatorConfig if
     * supplied.
     * @param summaryMessage - optional summary message. Will overwrite any from validatorConfig if
     * supplied.
     * @param validatorConfig - does not expect conditionConfig to be setup, but if it is, it
     * will be replaced when conditionConfig is not null.
     */
    add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig> | null,
        errorMessage: string | null | undefined,
        summaryMessage: string | null | undefined,
        validatorConfig: FluentValidatorConfig | undefined | null): void;
}

/**
 * Supplies Conditions and Validators the preceding FieldValueHost in a fluent chain. 
 * It is returned by ValidationManagerConfigBuilder.field() and each chained object that follows.
 * 
 * This class will dynamically get fluent functions for each condition
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 * 
 * See {@link Builder/Fluent | Fluent Overview}
 */
export class FluentValidatorBuilder extends FluentBuilderBase implements IFluentValidatorBuilder
{
    constructor(parentConfig: FieldValueHostConfig)
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
    public get parentConfig(): FieldValueHostConfig
    {
        return this._parentConfig;
    }
    private readonly _parentConfig: FieldValueHostConfig;

    /**
     * For any implementation of a fluent function that works with FluentValidationRule.
     * It takes the parameters passed into that function (conditionConfig and validatorConfig)
     * and assemble the final ValidatorConfig, which it adds to the FieldValueHostConfig.
     * @param conditionType - When not null, this will be assigned to conditionConfig for you.
     * @param conditionConfig - if null, expects validatorConfig to supply either conditionConfig
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     * @param errorMessage - optional error message. Will overwrite any from validatorConfig if
     * supplied.
     * @param summaryMessage - optional summary message. Will overwrite any from validatorConfig if
     * supplied.
     * @param validatorConfig - does not expect conditionConfig to be setup, but if it is, it
     * will be replaced when conditionConfig is not null.
     */
    public add(conditionType: string | null,
        conditionConfig: Partial<ConditionConfig> | null,
        errorMessage: string | null | undefined,
        summaryMessage: string | null | undefined,
        validatorConfig: FluentValidatorConfig | undefined | null): void
    {
        let ivDesc: ValidatorConfig = validatorConfig ?
            { ...validatorConfig as ValidatorConfig } :
            { conditionConfig: null };
        if (errorMessage != null)   // null or undefined
            ivDesc.errorMessage = errorMessage;
        if (summaryMessage != null)   // null or undefined
            ivDesc.summaryMessage = summaryMessage;

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
 * use this to collect child conditions. This differs from FluentValidatorBuilder
 * as it does not deal with ValidatorConfigs.
 * Yet the same fluent functions are used for both this and FluentValidatorBuilder.
 * As a result, any parameters associated with ValidatorConfig must be optional.
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with FluentFactory.
 */
export interface IFluentConditionBuilder
{
    /**
     * The config that will collect the conditions.
     */
    parentConfig: ConditionWithChildrenBaseConfig;

    /**
     * The valueHostName to pass to the child conditions by FluentFieldConditionBuilderBase classes.
     * If assigned, the add method will assign it to the conditionConfig for you.
     * It may be null, a valid value to pass along. If undefined, add shouldn't take any action.
     */
    valueHostName?: ValueHostName | null;

    /**
     * For any implementation of a fluent function that works with FluentConditionBuilder.
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
 * Supplies Conditions to Conditions that use ConditionWithChildrenBaseConfig:
 * AllMatchCondition, AnyMatchCondition, and CountMatchesCondition. 
 * 
 * This class will dynamically get fluent functions for each condition
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 * 
 * See {@link Builder/Fluent | Fluent Overview}
 */
export class FluentConditionBuilder extends FluentBuilderBase implements IFluentConditionBuilder
{
    /**
     * 
     * @param parentConfig null, the instance is created and the caller is expected
     * to retrieve its conditionConfigs from the config property.
     * When assigned, that instance gets conditionConfigs populated and 
     * there is no need to get a value from configs property.
     */
    constructor(parentConfig: ConditionWithChildrenBaseConfig | null, parentValueHostName?: ValueHostName | null)
    {
        super();
        if (!parentConfig)
            parentConfig = { conditionConfigs: [], conditionType: 'TBD' };
        if (!parentConfig.conditionConfigs)
            parentConfig.conditionConfigs = [];
        this._parentConfig = parentConfig;
        this._valueHostName = parentValueHostName;
    }
    /**
     * This is the value ultimately passed to the ValidationManager config.ValueHostConfigs.
     */
    public get parentConfig(): ConditionWithChildrenBaseConfig
    {
        return this._parentConfig;
    }
    private readonly _parentConfig: ConditionWithChildrenBaseConfig;

    /**
     * The valueHostName to pass to the child conditions by FluentFieldConditionBuilderBase classes.
     * If assigned, the add method will assign it to the conditionConfig for you.
     * It may be null, a valid value to pass along. If undefined, add shouldn't take any action.
     */
    public get valueHostName(): ValueHostName | null | undefined
    {
        return this._valueHostName;
    }
    private _valueHostName: ValueHostName | null | undefined;

    /**
     * For any implementation of a fluent function that works with FluentConditionBuilder.
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
        if (this.valueHostName != null) {   // null or undefined
            // We don't really know if the conditionConfig instance supports valueHostName,
            // but we can assign it anyway. If it doesn't, it will be ignored.
            // Alt technique not used: Require conditionConfig creators to supply the property explicitly
            // leaving it null they didn't assign it. That would be a lot of work for the user, and we want to make it easy.
            if ((<any>conditionConfig)['valueHostName'] == null) // null or undefined
                (<any>conditionConfig)['valueHostName'] = this.valueHostName;
        }
        this.parentConfig.conditionConfigs!.push(conditionConfig as ConditionConfig);
    }
}

/**
 * Supports the fluent syntax on conditions that have a single child condition.
 * It isn't an ideal implementation. It is based on using FluentConditionBuilder,
 * which allows a list of conditions. It simply throws an exception if the user
 * atttempts to add more than one condition.
 * 
 * The reason for this implementation is to avoid having the user to register
 * new fluent condition functions in 3 places: FluentValidatorBuilder, FluentConditionBuilder,
 * and FluentOneConditionBuilder. Additionally, they would have to setup their function 
 * to return void instead of a FluentConditionBuilder. That is deemed too much work.
 */
export class FluentOneConditionBuilder extends FluentConditionBuilder
{
    public add(conditionType: string | null, conditionConfig: Partial<ConditionConfig>): void {
        if (this.parentConfig.conditionConfigs!.length > 0)
            throw new CodingError('Only one condition allowed');
        super.add(conditionType, conditionConfig);
    }
}

/**
 * Callback used by conditions that take an array of child conditions (subclasses of ConditionWithChildrenBase).
 * Expected to be used like this:
 * ```ts
 * builder.all((conditions)=>conditions.required('Field1').required('Field2'), 'error message', { validator parameters });
 * ```
 * Designed to get intellisense assistance as the user sets up the child conditions.
 */
export type FluentConditionBuilderHandler = (conditionsBuilder: FluentConditionBuilder) => FluentConditionBuilder;

/**
 * Callback used by conditions that take an array of child conditions (subclasses of ConditionWithChildrenBase).
 * Expected to be used like this:
 * ```ts
 * builder.all((conditions)=>conditions.required('Field1').required('Field2'), 'error message', { validator parameters });
 * ```
 * Designed to get intellisense assistance as the user sets up the child conditions.
 */
export type FluentOneConditionBuilderHandler = (conditionsBuilder: FluentOneConditionBuilder) => FluentOneConditionBuilder;

/**
 * Callback used by conditions that establish child conditions for a single field (subclasses of FluentSingleFieldConditionBuilder).
 * Expected to be used like this:
 * ```ts
 * builder.when(
 *   (whenBuilder)=>whenBuilder.fieldValue('name').required(),
 *   (thenBuilder)=>thenBuilder.parentValue().greaterThan(18));
 * ```
 * Designed to get intellisense assistance as the user sets up the child conditions.
 */
export type FluentSingleFieldConditionBuilderHandler = (conditionBuilder: FluentSingleFieldConditionBuilder) => FluentOneConditionBuilder;

/**
 * Callback used by conditions that establish child conditions for multiple fields (subclasses of FluentMultiFieldConditionBuilder).
 * Expected to be used like this:
 * ```ts
 * builder.all(
 *   (childBuilder)=> [
 *      childBuilder.fieldValue('field1').requireText(),
 *      childBuilder.fieldValue('field2').requireText(),
 *      childBuilder.fieldValue('field3').requireText()
 *  ]
 * );
 * ```
 * Designed to get intellisense assistance as the user sets up the child conditions.
 */
export type FluentMultiFieldConditionBuilderHandler = (conditionBuilder: FluentMultiFieldConditionBuilder) =>
    Array<FluentConditionBuilder>; 

/**
 * Call from within a fluent function once you have all parameters fully setup.
 * It will complete the setup.
 * @param thisFromCaller 
 * Should be a FluentValidatorBuilder. Fluent function expects to pass its value
 * of 'this' here. However, its possible self is not FluentValidatorBuilder.
 * We'll throw an exception here in that case.
 * @param conditionType 
 * @param conditionConfig 
 * @param errorMessage 
 * @param validatorParameters 
 * @returns The same instance passed into the first parameter to allow for chaining.
 */
export function finishFluentValidatorBuilder(thisFromCaller: any, 
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig>,
    errorMessage: string | null | undefined,
    summaryMessage: string | null | undefined,
    validatorParameters: FluentValidatorConfig | undefined | null): FluentValidatorBuilder
{
    if (thisFromCaller instanceof FluentValidatorBuilder) {
        thisFromCaller.add(conditionType, conditionConfig, errorMessage, summaryMessage, validatorParameters);
        return thisFromCaller;
    }
    throw new FluentSyntaxRequiredError();
}


/**
 * Return result from resolveValidatorOverloadArgs() to allow for optional parameters in fluent functions.
 */
export interface FluentValidatorOverloadArgs<TConditionConfig> {
    conditionConfig?: TConditionConfig | null;
    errorMessage?: string | null;
    summaryMessage?: string | null;
    validatorParameters?: FluentValidatorConfig;
}

/**
 * Overloading validator fluent functions is a bit tricky. This function will resolve the parameters
 * and return a single object with the results.
 * It can be used in most functions because the parameters are similar. The only difference is the type of conditionConfig.
 * @param arg2 
 * @param arg3 
 * @returns 
 */
export function resolveValidatorOverloadArgs<TConditionConfig extends ConditionConfig>(
    arg2?: string | null | object,
    arg3?: string | null
): FluentValidatorOverloadArgs<TConditionConfig> {
    let conditionConfig: TConditionConfig | null | undefined;
    let errorMessage: string | null | undefined;
    let summaryMessage: string | null | undefined;
    let validatorParameters: FluentValidatorConfig | undefined;

    if (typeof arg2 === 'string' || arg2 === null || arg2 === undefined) {
        errorMessage = arg2 ?? null;
        summaryMessage = arg3 ?? null;
    }
    else if (typeof arg2 === 'object') {
        // arg3 is ignored here
        conditionConfig = { ...arg2 } as TConditionConfig;
        for (const prop of Object.keys(conditionConfig as object)) {
            if (fluentValidatorConfigPropertyNames.includes(prop)) {
                delete (conditionConfig as any)[prop];
            }
        }

        validatorParameters = { ...arg2 };
        for (const prop of Object.keys(validatorParameters as object)) {
            if (!fluentValidatorConfigPropertyNames.includes(prop)) {
                delete (validatorParameters as any)[prop];
            }
        }
     
    }
    // any other form will return undefined values, which is acceptable.

    return {
        conditionConfig,
        errorMessage,
        summaryMessage,
        validatorParameters
    };
}

/**
 * The actual property names on the FluentValidatorConfig interface.
 */
const fluentValidatorConfigPropertyNames: Array<string> = [
    'validatorType',
    'errorCode',
    'enabled',
    'conditionConfig', // not in the official FluentValidatorConfig, but its a typical property of ValidatorConfig
    'conditionCreator', // ditto
    'severity',
    'errorMessage',
    'summaryMessage',
    'errorMessagel10n',
    'summaryMessagel10n',    
];

/**
 * Call from within a fluent function once you have all parameters fully setup.
 * It will complete the setup.
 * @param thisFromCaller 
 * Should be a FluentConditionBuilder. Fluent function expects to pass its value
 * of 'this' here. However, its possible self is not FluentConditionBuilder.
 * We'll throw an exception here in that case.
 * @param conditionType 
 * @param valueHostName 
 * Overrides the default valueHostName, which comes from the ValidationManagerConfigBuilder.field().
 * Fluent function should supply this as a parameter
 * so long as its ConditionConfig implements OneValueConditionConfig.
 * Since these conditions are children of another, they are more likely to
 * need the valueHostName than those in FluentValidatorBuilders.
 * @param conditionConfig 
 * @returns The same instance passed into the first parameter to allow for chaining.
 */
export function finishFluentConditionBuilder(thisFromCaller: any, 
    conditionType: string | null,
    conditionConfig: Partial<ConditionConfig>,
    valueHostName?: ValueHostName): FluentConditionBuilder
{
    if (thisFromCaller instanceof FluentConditionBuilder) {
        if (valueHostName)
            (conditionConfig as OneValueConditionBaseConfig).valueHostName = valueHostName;

        thisFromCaller.add(conditionType, conditionConfig);
        return thisFromCaller;
    }    
    throw new FluentSyntaxRequiredError();
}
/**
 * Factory that returns a new instance of IFluentValidatorBuilder and IFluentConditionBuilder.
 * By default, it supplies FluentValidatorBuilder and FluentConditionBuilder.
 * When you create alternative conditions, you will also reimplemnt 
 * IFluentValidatorBuilder and IFluentConditionBuilder and register them here.
 */
export class FluentFactory
{
    constructor()
    {
        this._validatorBuilderCreator =
            (vhConfig: FieldValueHostConfig) => new FluentValidatorBuilder(vhConfig);
        this._conditionBuilderCreator =
            (vhConfig: ConditionWithChildrenBaseConfig) => new FluentConditionBuilder(vhConfig);
    }
    public createValidatorBuilder(vhConfig: FieldValueHostConfig): IFluentValidatorBuilder
    {
        return this._validatorBuilderCreator(vhConfig);
    }

    public registerValidatorBuilder(creator: (vhConfig: FieldValueHostConfig) => IFluentValidatorBuilder): void
    {
        assertNotNull(creator, 'creator');
        this._validatorBuilderCreator = creator;
    }
    private _validatorBuilderCreator: (vhConfig: FieldValueHostConfig) => IFluentValidatorBuilder;

    public createConditionBuilder(vhConfig: ConditionWithChildrenBaseConfig): IFluentConditionBuilder
    {
        return this._conditionBuilderCreator(vhConfig);
    }

    public registerConditionBuilder(creator: (vhConfig: ConditionWithChildrenBaseConfig) => IFluentConditionBuilder): void
    {
        assertNotNull(creator, 'creator');
        this._conditionBuilderCreator = creator;
    }
    private _conditionBuilderCreator: (vhConfig: ConditionWithChildrenBaseConfig) => IFluentConditionBuilder;    

    /**
     * Unlike other factories, which are on ValidationServices. We wanted to avoid
     * passing the ValidationServices class into the entry point functions as our
     * intention is to keep the syntax small and simple.
     */
    public static singleton: FluentFactory = new FluentFactory();
}


//#region custom validation rule
//!!!NOTE: Currently customRule does not support FluentConditionBuilder.

/**
 * The fluent function that allows the user to supply a conditionCreator function
 * instead of setting up a condition through a config.
 * The actual code for our extension method. It will be associated with an interface declaration,
 * and assigned to the prototype of the FluentValidatorBuilder class.
 * As an EXTENSION FUNCTION, it extends FluentValidatorBuilder, and 
 * REQUIRES 'this' to be an instance of FluentValidatorBuilder.
 * For more on setting up your own fluent function, see @link Builder/Fluent|Fluent.
 */

export function customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
export function customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
    validatorParameters: FluentValidatorConfig): FluentValidatorBuilder;
export function customRule(conditionCreator: (requester: ValidatorConfig) => ICondition | null,
    arg1?: FluentValidatorConfig | string | null,
    arg2?: string | null): FluentValidatorBuilder
{
    if (this instanceof FluentValidatorBuilder) {
        let { conditionConfig, errorMessage, summaryMessage, validatorParameters } =
            resolveValidatorOverloadArgs<ConditionConfig>(arg1, arg2);
        let ivConfig: ValidatorConfig = validatorParameters ?
            { ...validatorParameters as ValidatorConfig, conditionConfig: null } :
            { conditionConfig: null}; 
        ivConfig.conditionCreator = conditionCreator;
        let self = this as FluentValidatorBuilder;
        self.add(null, null, errorMessage, summaryMessage, ivConfig);
        return self;
    }
    throw new FluentSyntaxRequiredError();
}
export class FluentSyntaxRequiredError extends Error
{
    constructor(errorMessage: string = 'Call only when chaining with ValidationManagerConfigBuilder.field().')
    {
        super(errorMessage);
    }
}

/**
 * Make TypeScript associate the function with the class
 */

// interface that extends the class FluentValidationRule
export declare interface FluentValidatorBuilder
{
    customRule(conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder | ValidatorConfig;
    customRule(conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        validatorParameters: FluentValidatorConfig): FluentValidatorBuilder | ValidatorConfig;
}


/**
 * Make JavaScript associate the function with the class.
 */
FluentValidatorBuilder.prototype.customRule = customRule;
//#endregion custom validation rule