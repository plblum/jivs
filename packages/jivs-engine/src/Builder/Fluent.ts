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

import { CalcValueHostConfig } from '../Interfaces/CalcValueHost';
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { StaticValueHostConfig } from "../Interfaces/StaticValueHost";
import { ValidatorConfig } from '../Interfaces/Validator';
import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
import { ValueHostConfig } from '../Interfaces/ValueHost';
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
 * The protocol that connects a child config-building function to its parent.
 * This interface is therefore both a deposit point (for the child function) and a
 * pickup point (for the parent function that created the child builder).
 * 
 * Use case 1: The config object does not contain any child configs. 
 * 1. Parent builder creates a child builder and hands it to a user callback.
 *  (The 'this' property in the callbackis the parent builder)
 * 2. The user callback assembles its config and deposits it here via setConfig().
 * 3. After the callback returns, the parent builder calls getConfig() to retrieve.
 *
 * Use case 2: The config object contains one or more child configs. 
 * 1. Parent builder creates a child builder and hands it to a user callback.
 *  (The 'this' property in the callback is the parent builder)
 * 2. The user callback assembles its config.
 *      a. For each child config, it creates a child builder and hands it to a user callback.
 *      b. Each child callback assembles its config and deposits it here via setConfig().
 *      c. After each child callback returns, the parent callback calls getConfig() to retrieve.
 *      d. The resulting child config is assigned to the appropriate property of the parent config.
 * 3. Finished config is passed to the parent Builder thorugh setConfig().
 * 4. After the parent callback returns, the parent builder calls getConfig() to retrieve.
 * 
 * Example with "Not"
 * 1. A parent builder's not() function is called.
 * 2. not() function creates a ConditionBuilder and hands it to a user callback.
 * 3. The user has selected the lessThan() function, which creates a LessThanConditionConfig and deposits it here via setConfig().
 * 4. After the callback returns, not() calls getConfig() to retrieve the LessThanConditionConfig
 * 5. not() function creates a NotConditionConfig and 
 *      assigns the LessThanConditionConfig to its childConditionConfig property.
 * ```ts
 * let config = <NotConditionConfig>{
 *    conditionType: ConditionType.Not,
 *    childConditionConfig: childBuilder.getConfig() as LessThanConditionConfig
 * };
 * this.setConfig(config);
 * ```
 */
export interface IBuilderConfigHost<TConfig extends object, TOptions extends object = object>
{
    /**
     * Called by a config object-building function after assembling its config, to deposit
     * the result into this builder so the parent function can retrieve it.
     * @param config - The completed config object.
     * @param options - Optional additional options for handling the config.
     */
    setConfig(config: TConfig, options?: TOptions): void;

    /**
     * Called by the parent function after the child callback has run, to retrieve
     * the deposited config and wire it into the appropriate property of the parent's config.
     */
    getConfig(): TConfig | undefined;

    /**
     * Supporting functions finish up by calling the setConfig method.
     * If this callback is assigned to the parent builder, setConfig will be called 
     * automatically when the child is completed
     * allowing it to hook up the child into its own config.
     * 
     * ```ts
     * public not(notBuilder: StartConditionBuilderHandler): void { ... }
     * {
     *      let notConfig: NotConditionConfig = {
     *          conditionType: ConditionType.Not,
     *          childConditionConfig: null! // pending the notBuilder results
     *      };
     *      let startBuilder = new StartConditionBuilder(this,
     *         (childConfig: ConditionConfig, source: IConditionBuilder) => 
     *             notConfig.childConditionConfig = childConfig;
     *         }
     *      );
     *      this.setConfig(notConfig);
     * }
     * public setConfig(config: ConditionConfig): void
     * {
     *      this._config = config;
     * // bubble up
     *      if (this.parentBuilder?.completed) {
     *          this.parentBuilder.completed(config, this);
     *      }
     * }
     * ```
     */
    completed?: CompleteConfigBuilderHandler<TConfig>;    
}

export type CompleteConfigBuilderHandler<TConfig extends object> = (config: TConfig, source: IBuilderConfigHost<TConfig>) => void;

// /**
//  * Conditions that use EvaluateChildConditionResultsConfig (All, Any, CountMatches, etc)
//  * use this to collect child conditions. This differs from FluentValidatorBuilder
//  * as it does not deal with ValidatorConfigs.
//  * Yet the same fluent functions are used for both this and FluentValidatorBuilder.
//  * As a result, any parameters associated with ValidatorConfig must be optional.
//  * Use this when using alternative conditions, as you will need to provide substitutes
//  * for each fluent function. Your class should be registered with FluentFactory.
//  */
// export interface IFluentConditionBuilder
// {
//     /**
//      * The config that will collect the conditions.
//      */
//     parentConfig: ConditionWithChildrenBaseConfig;

//     /**
//      * The valueHostName to pass to the child conditions by FluentFieldConditionBuilderBase classes.
//      * If assigned, the add method will assign it to the conditionConfig for you.
//      * It may be null, a valid value to pass along. If undefined, add shouldn't take any action.
//      */
//     valueHostName?: ValueHostName | null;

//     /**
//      * For any implementation of a fluent function that works with FluentConditionBuilder.
//      * It takes the parameters passed into that function
//      * and assemble the final conditionConfig.
//      * @param conditionType - When not null, this will be assigned to conditionConfig for you.
//      * @param conditionConfig - If your fluent function supplies stand-alone parameters that belong
//      * in conditionConfig, assign them to conditionConfig.
//      */
//     add(conditionType: string | null,
//         conditionConfig: Partial<ConditionConfig>): void;
// }

// /**
//  * Supplies Conditions to Conditions that use ConditionWithChildrenBaseConfig:
//  * AllMatchCondition, AnyMatchCondition, and CountMatchesCondition.
//  *
//  * This class will dynamically get fluent functions for each condition
//  * by using TypeScript's Declaration Merging:
//  * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
//  *
//  * See {@link Builder/Fluent | Fluent Overview}
//  */
// export class FluentConditionBuilder extends FluentBuilderBase implements IFluentConditionBuilder
// {
//     /**
//      *
//      * @param parentConfig null, the instance is created and the caller is expected
//      * to retrieve its conditionConfigs from the config property.
//      * When assigned, that instance gets conditionConfigs populated and
//      * there is no need to get a value from configs property.
//      */
//     constructor(parentConfig: ConditionWithChildrenBaseConfig | null, parentValueHostName?: ValueHostName | null)
//     {
//         super();
//         if (!parentConfig)
//             parentConfig = { conditionConfigs: [], conditionType: 'TBD' };
//         if (!parentConfig.conditionConfigs)
//             parentConfig.conditionConfigs = [];
//         this._parentConfig = parentConfig;
//         this._valueHostName = parentValueHostName;
//     }
//     /**
//      * This is the value ultimately passed to the ValidationManager config.ValueHostConfigs.
//      */
//     public get parentConfig(): ConditionWithChildrenBaseConfig
//     {
//         return this._parentConfig;
//     }
//     private readonly _parentConfig: ConditionWithChildrenBaseConfig;

//     /**
//      * The valueHostName to pass to the child conditions by FluentFieldConditionBuilderBase classes.
//      * If assigned, the add method will assign it to the conditionConfig for you.
//      * It may be null, a valid value to pass along. If undefined, add shouldn't take any action.
//      */
//     public get valueHostName(): ValueHostName | null | undefined
//     {
//         return this._valueHostName;
//     }
//     private _valueHostName: ValueHostName | null | undefined;

//     /**
//      * For any implementation of a fluent function that works with FluentConditionBuilder.
//      * It takes the parameters passed into that function
//      * and assemble the final conditionConfig.
//      * @param conditionType - When not null, this will be assigned to conditionConfig for you.
//      * @param conditionConfig - If your fluent function supplies stand-alone parameters that belong
//      * in conditionConfig, assign them to conditionConfig.
//      */
//     public add(conditionType: string | null,
//         conditionConfig: Partial<ConditionConfig>): void
//     {
//         assertNotNull(conditionConfig, 'conditionConfig');
//         if (conditionType)
//             conditionConfig.conditionType = conditionType;
//         if (this.valueHostName != null) {   // null or undefined
//             // We don't really know if the conditionConfig instance supports valueHostName,
//             // but we can assign it anyway. If it doesn't, it will be ignored.
//             // Alt technique not used: Require conditionConfig creators to supply the property explicitly
//             // leaving it null they didn't assign it. That would be a lot of work for the user, and we want to make it easy.
//             if ((<any>conditionConfig)['valueHostName'] == null) // null or undefined
//                 (<any>conditionConfig)['valueHostName'] = this.valueHostName;
//         }
//         this.parentConfig.conditionConfigs!.push(conditionConfig as ConditionConfig);
//     }
// }

// /**
//  * Supports the fluent syntax on conditions that have a single child condition.
//  * It isn't an ideal implementation. It is based on using FluentConditionBuilder,
//  * which allows a list of conditions. It simply throws an exception if the user
//  * atttempts to add more than one condition.
//  *
//  * The reason for this implementation is to avoid having the user to register
//  * new fluent condition functions in 3 places: FluentValidatorBuilder, FluentConditionBuilder,
//  * and FluentOneConditionBuilder. Additionally, they would have to setup their function
//  * to return void instead of a FluentConditionBuilder. That is deemed too much work.
//  */
// export class FluentOneConditionBuilder extends FluentConditionBuilder
// {
//     public add(conditionType: string | null, conditionConfig: Partial<ConditionConfig>): void {
//         if (this.parentConfig.conditionConfigs!.length > 0)
//             throw new CodingError('Only one condition allowed');
//         super.add(conditionType, conditionConfig);
//     }
// }

// /**
//  * Callback used by conditions that take an array of child conditions (subclasses of ConditionWithChildrenBase).
//  * Expected to be used like this:
//  * ```ts
//  * builder.all((conditions)=>conditions.required('Field1').required('Field2'), 'error message', { validator parameters });
//  * ```
//  * Designed to get intellisense assistance as the user sets up the child conditions.
//  */
// export type FluentConditionBuilderHandler = (conditionsBuilder: FluentConditionBuilder) => FluentConditionBuilder;

// /**
//  * Callback used by conditions that take an array of child conditions (subclasses of ConditionWithChildrenBase).
//  * Expected to be used like this:
//  * ```ts
//  * builder.all((conditions)=>conditions.required('Field1').required('Field2'), 'error message', { validator parameters });
//  * ```
//  * Designed to get intellisense assistance as the user sets up the child conditions.
//  */
// export type FluentOneConditionBuilderHandler = (conditionsBuilder: FluentOneConditionBuilder) => FluentOneConditionBuilder;

// /**
//  * Callback used by conditions that establish child conditions for a single field (subclasses of FluentSingleFieldConditionBuilder).
//  * Expected to be used like this:
//  * ```ts
//  * builder.when(
//  *   (whenBuilder)=>whenBuilder.fieldValue('name').required(),
//  *   (thenBuilder)=>thenBuilder.parentValue().greaterThan(18));
//  * ```
//  * Designed to get intellisense assistance as the user sets up the child conditions.
//  */
// export type FluentSingleFieldConditionBuilderHandler = (conditionBuilder: FluentSingleFieldConditionBuilder) => FluentOneConditionBuilder;

// /**
//  * Callback used by conditions that establish child conditions for multiple fields (subclasses of FluentMultiFieldConditionBuilder).
//  * Expected to be used like this:
//  * ```ts
//  * builder.all(
//  *   (childBuilder)=> [
//  *      childBuilder.fieldValue('field1').requireText(),
//  *      childBuilder.fieldValue('field2').requireText(),
//  *      childBuilder.fieldValue('field3').requireText()
//  *  ]
//  * );
//  * ```
//  * Designed to get intellisense assistance as the user sets up the child conditions.
//  */
// export type FluentMultiFieldConditionBuilderHandler = (conditionBuilder: FluentMultiFieldConditionBuilder) =>
//     Array<FluentConditionBuilder>;

// /**
//  * Call from within a fluent function once you have all parameters fully setup.
//  * It will complete the setup.
//  * @param thisFromCaller
//  * Should be a FluentValidatorBuilder. Fluent function expects to pass its value
//  * of 'this' here. However, its possible self is not FluentValidatorBuilder.
//  * We'll throw an exception here in that case.
//  * @param conditionType
//  * @param conditionConfig
//  * @param errorMessage
//  * @param validatorParameters
//  * @returns The same instance passed into the first parameter to allow for chaining.
//  */
// export function finishFluentValidatorBuilder(thisFromCaller: any,
//     conditionType: string | null,
//     conditionConfig: Partial<ConditionConfig>,
//     errorMessage: string | null | undefined,
//     summaryMessage: string | null | undefined,
//     validatorParameters: FluentValidatorConfig | undefined | null): FluentValidatorBuilder
// {
//     if (thisFromCaller instanceof FluentValidatorBuilder) {
//         thisFromCaller.add(conditionType, conditionConfig, errorMessage, summaryMessage, validatorParameters);
//         return thisFromCaller;
//     }
//     throw new FluentSyntaxRequiredError();
// }


// /**
//  * Call from within a fluent function once you have all parameters fully setup.
//  * It will complete the setup.
//  * @param thisFromCaller
//  * Should be a FluentConditionBuilder. Fluent function expects to pass its value
//  * of 'this' here. However, its possible self is not FluentConditionBuilder.
//  * We'll throw an exception here in that case.
//  * @param conditionType
//  * @param valueHostName
//  * Overrides the default valueHostName, which comes from the ValidationManagerConfigBuilder.field().
//  * Fluent function should supply this as a parameter
//  * so long as its ConditionConfig implements OneValueConditionConfig.
//  * Since these conditions are children of another, they are more likely to
//  * need the valueHostName than those in FluentValidatorBuilders.
//  * @param conditionConfig
//  * @returns The same instance passed into the first parameter to allow for chaining.
//  */
// export function finishFluentConditionBuilder(thisFromCaller: any,
//     conditionType: string | null,
//     conditionConfig: Partial<ConditionConfig>,
//     valueHostName?: ValueHostName): FluentConditionBuilder
// {
//     if (thisFromCaller instanceof FluentConditionBuilder) {
//         if (valueHostName)
//             (conditionConfig as OneValueConditionBaseConfig).valueHostName = valueHostName;

//         thisFromCaller.add(conditionType, conditionConfig);
//         return thisFromCaller;
//     }
//     throw new FluentSyntaxRequiredError();
// }



// /**
//  * Factory that returns a new instance of IFluentValidatorBuilder and IFluentConditionBuilder.
//  * By default, it supplies FluentValidatorBuilder and FluentConditionBuilder.
//  * When you create alternative conditions, you will also reimplemnt 
//  * IFluentValidatorBuilder and IFluentConditionBuilder and register them here.
//  */
// export class FluentFactory
// {
//     constructor()
//     {
//         this._validatorBuilderCreator =
//             (vhConfig: FieldValueHostConfig) => new FluentValidatorBuilder(vhConfig);
//         this._conditionBuilderCreator =
//             (vhConfig: ConditionWithChildrenBaseConfig) => new FluentConditionBuilder(vhConfig);
//     }
//     public createValidatorBuilder(vhConfig: FieldValueHostConfig): IFluentValidatorBuilder
//     {
//         return this._validatorBuilderCreator(vhConfig);
//     }

//     public registerValidatorBuilder(creator: (vhConfig: FieldValueHostConfig) => IFluentValidatorBuilder): void
//     {
//         assertNotNull(creator, 'creator');
//         this._validatorBuilderCreator = creator;
//     }
//     private _validatorBuilderCreator: (vhConfig: FieldValueHostConfig) => IFluentValidatorBuilder;

//     public createConditionBuilder(vhConfig: ConditionWithChildrenBaseConfig): IFluentConditionBuilder
//     {
//         return this._conditionBuilderCreator(vhConfig);
//     }

//     public registerConditionBuilder(creator: (vhConfig: ConditionWithChildrenBaseConfig) => IFluentConditionBuilder): void
//     {
//         assertNotNull(creator, 'creator');
//         this._conditionBuilderCreator = creator;
//     }
//     private _conditionBuilderCreator: (vhConfig: ConditionWithChildrenBaseConfig) => IFluentConditionBuilder;    

//     /**
//      * Unlike other factories, which are on ValidationServices. We wanted to avoid
//      * passing the ValidationServices class into the entry point functions as our
//      * intention is to keep the syntax small and simple.
//      */
//     public static singleton: FluentFactory = new FluentFactory();
// }


// export class FluentSyntaxRequiredError extends Error
// {
//     constructor(errorMessage: string = 'Call only when chaining with ValidationManagerConfigBuilder.field().')
//     {
//         super(errorMessage);
//     }
// }

// // OBSOLETE

// /**
//  * Overloading validator fluent functions is a bit tricky. This function will resolve the parameters
//  * and return a single object with the results.
//  * It can be used in most functions because the parameters are similar. The only difference is the type of conditionConfig.
//  * @param arg2 
//  * @param arg3 
//  * @returns 
//  */
// export function resolveValidatorOverloadArgs<TConditionConfig extends ConditionConfig>(
//     arg2?: string | null | object,
//     arg3?: string | null
// ): FluentValidatorOverloadArgs<TConditionConfig> {
//     let conditionConfig: TConditionConfig | null | undefined;
//     let errorMessage: string | null | undefined;
//     let summaryMessage: string | null | undefined;
//     let validatorParameters: FluentValidatorConfig | undefined;

//     if (typeof arg2 === 'string' || arg2 === null || arg2 === undefined) {
//         errorMessage = arg2 ?? null;
//         summaryMessage = arg3 ?? null;
//     }
//     else if (typeof arg2 === 'object') {
//         // arg3 is ignored here
//         conditionConfig = { ...arg2 } as TConditionConfig;
//         for (const prop of Object.keys(conditionConfig as object)) {
//             if (fluentValidatorConfigPropertyNames.includes(prop)) {
//                 delete (conditionConfig as any)[prop];
//             }
//         }

//         validatorParameters = { ...arg2 };
//         for (const prop of Object.keys(validatorParameters as object)) {
//             if (!fluentValidatorConfigPropertyNames.includes(prop)) {
//                 delete (validatorParameters as any)[prop];
//             }
//         }
     
//     }
//     // any other form will return undefined values, which is acceptable.

//     return {
//         conditionConfig,
//         errorMessage,
//         summaryMessage,
//         validatorParameters
//     };
// }

// /**
//  * Return result from resolveValidatorOverloadArgs() to allow for optional parameters in fluent functions.
//  */
// export interface FluentValidatorOverloadArgs<TConditionConfig> {
//     conditionConfig?: TConditionConfig | null;
//     errorMessage?: string | null;
//     summaryMessage?: string | null;
//     validatorParameters?: FluentValidatorConfig;
// }

// /**
//  * The actual property names on the FluentValidatorConfig interface.
//  */
// const fluentValidatorConfigPropertyNames: Array<string> = [
//     'validatorType',
//     'errorCode',
//     'enabled',
//     'conditionConfig', // not in the official FluentValidatorConfig, but its a typical property of ValidatorConfig
//     'conditionCreator', // ditto
//     'severity',
//     'errorMessage',
//     'summaryMessage',
//     'errorMessagel10n',
//     'summaryMessagel10n',    
// ];
