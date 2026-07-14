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
import { ConditionConfig, ICondition } from "./Conditions";
import { ValidationManagerConfigBuilder } from "../Builder/ValidationManagerConfigBuilder";
import { IValueHostsServices } from "./ValueHostsServices";
import { FieldValueHostConfig } from "./FieldValueHost";
import { FluentValidatorConfig } from '../Builder/Fluent';
import {
    EqualToValueConditionConfig, EqualToConditionConfig,
    NotEqualToValueConditionConfig, NotEqualToConditionConfig,
    LessThanValueConditionConfig, LessThanConditionConfig,
    GreaterThanValueConditionConfig, GreaterThanConditionConfig,
    GreaterThanOrEqualValueConditionConfig, GreaterThanOrEqualConditionConfig,
    StringLengthConditionConfig, RegExpConditionConfig,
    RequireTextConditionConfig, DataTypeCheckConditionConfig,
    AllMatchConditionConfig,
    AnyMatchConditionConfig,
    CountMatchesConditionConfig,
    IntegerConditionConfig,
    LessThanOrEqualConditionConfig,
    LessThanOrEqualValueConditionConfig,
    MaxDecimalsConditionConfig,
    NotNullConditionConfig,
    PositiveConditionConfig,
    RangeConditionConfig
} from "../Conditions/ConcreteConditions";
import { NotConditionConfig } from "../Conditions/NotCondition";
import { WhenConditionConfig } from "../Conditions/WhenCondition";
import { ValidatorConfig } from "./Validator";


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
        builderFn: (combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => void): ValidationManagerConfigBuilder;
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
        builderFn: (combiningBuilder: IStartConditionBuilder) => void): ValidationManagerConfigBuilder

    combineWithRule(valueHostName: ValueHostName, errorCode: string,
        arg3: CombineUsingCondition | ((combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => void),
        arg4?: (combiningBuilder: IStartConditionBuilder) => void): ValidationManagerConfigBuilder;

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
        builderFn: (replacementBuilder: IStartConditionBuilder) => void): ValidationManagerConfigBuilder
    replaceRule(valueHostName: ValueHostName, errorCode: string,
        sourceOfConditionConfig: ConditionConfig | ((replacementBuilder: IStartConditionBuilder) => void)): ValidationManagerConfigBuilder;
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
//#region Child Builders
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

export type OptionalEqualToValueConditionParams = Partial<Omit<EqualToValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalEqualToConditionParams = Partial<Omit<EqualToConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalNotEqualToValueConditionParams = Partial<Omit<NotEqualToValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalNotEqualToConditionParams = Partial<Omit<NotEqualToConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalLessThanValueConditionParams = Partial<Omit<LessThanValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalLessThanConditionParams = Partial<Omit<LessThanConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalLessThanOrEqualValueConditionParams = Partial<Omit<LessThanValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalLessThanOrEqualConditionParams = Partial<Omit<LessThanConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalGreaterThanValueConditionParams = Partial<Omit<GreaterThanValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalGreaterThanConditionParams = Partial<Omit<GreaterThanConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalGreaterThanOrEqualValueConditionParams = Partial<Omit<GreaterThanOrEqualValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalGreaterThanOrEqualConditionParams = Partial<Omit<GreaterThanOrEqualConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalStringLengthConditionParams = Partial<Omit<StringLengthConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'maximum'>>;

/**
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with FluentFactory.
 */
export interface IFluentValidatorBuilder extends IBuilderConfigHost<object>
{
    /**
     * The FieldValueHostConfig that is being constructed and will be supplied to ValidationManagerConfig.valueHostConfigs.
     */
    parentConfig: FieldValueHostConfig;    
    /**
     * Lets you create the condition instance itself into the Builder instead of
     * using the existing FluentValidatorBuilder validators.
     * 
     * It takes a function where you return the condition instance.
     * (requester: ValidatorConfig) => ICondition | null
     * 
     * @example
     * ```ts
     * builder.field('fieldname').customRule((requester)=>{
     *  return new DataTypeCheckCondition();
     * });
     * ```
     * 
     * ```ts
     * customRule(conditionCreatorHandler);
     * customRule(conditionCreatorHandler, 'Error message', 'Summary message');
     * customRule(conditionCreatorHandler, null, 'Summary message');
     * customRule(conditionCreatorHandler, { errorMessage: 'Error message'});
     * ```
    
     */
    customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        validatorParameters: FluentValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a DataTypeCheck condition to the fluent validator builder.
     * DataTypeCheck ensures that the value being validated matches the expected data type.
     * In many cases, it is automatically added by the ValueHost based on the dataType field value.
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters 
     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     * ```ts
     * dataTypeCheck();
     * dataTypeCheck('Error message');
     * dataTypeCheck('Error message', 'Summary message');
     * dataTypeCheck(null, 'Summary message');
     * dataTypeCheck({ errorMessage: 'Error message'});
     * ```
     */
    dataTypeCheck(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    dataTypeCheck(
        validatorParameters: FluentDataTypeCheckValidatorConfig): IFluentValidatorBuilder;

    /**
      * Adds a RequireText condition to the fluent validator builder.
      * RequireText ensures that the value being validated is not empty.
      * The value must be a string or null or it evaluates as Undetermined.
      * When evaluating against null, set its nullValueResult parameter to determine
      * whether the condition should evaluate as NoMatch, Match, or Undetermined.
      * If not supplied, null is treated as NoMatch.
      * @param errorMessage 
      * The error message "template" that will appear on screen when the condition is NoMatch.
      * It can use tokens, which are resolved with current data at the time of validation.
      * If null, it will expect to be setup by one of several other sources including
      * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
      * @param summaryMessage - optional summary message.
      * @param validatorParameters 
      * Additional ways to customize the Validator, including localized error messages,
      * severity, and the enabler.
      * ```ts
      * requireText();
      * requireText('Error message');
      * requireText('Error message', 'Summary message');
      * requireText(null, 'Summary message');
      * requireText({ errorMessage: 'Error message'});
      * ```
      */
    requireText(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    requireText(
        validatorParameters: FluentRequireTextValidatorConfig): IFluentValidatorBuilder;
    /**
     * Adds a NotNull condition to the fluent validator builder.
     * NotNull ensures that the value being validated is not null.
     * The value can be of any type.
     * This condition is useful for ensuring that required fields are not left null.
     * If the value is a string and you want to ensure both not null and a non-empty string,
     * use requireText instead.
     * 
     * Example usage:
     * ```ts
     * notNull();
     * notNull('Error message');
     * notNull('Error message', 'Summary message');
     * notNull({ errorMessage: 'Error message' });
     * ```
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters 
     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    notNull(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    notNull(
        validatorParameters: FluentNotNullValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a RegExp condition to the fluent validator builder.
     * RegExp ensures that the value being validated matches the specified regular expression.
     * The value can be of any type that can be tested against a regular expression.
     * Example usage:
     * ```ts
     * regExp(/^[a-z]+$/);
     * regExp("^[a-z]+$", false);
     * regExp("^[a-z]+$", true, "Error message"); // true = ignore case
     * regExp(/^[a-z]+$/, "Error message");
     * regExp(/^[a-z]+$/, "Error message", "Summary message");
     * regExp(/^[a-z]+$/, { errorMessage: "Error message", summaryMessage: "Summary message" });
     * regExp("^[a-z]+$", false, { errorMessage: "Error message", summaryMessage: "Summary message" });
     * ```
     * @param expression - The regular expression to match against the value being validated. 
     * Can be a RegExp object or a string.
     * @param ignoreCase - optional flag to indicate if the regular expression should ignore case. Only applicable when the expression is a string.
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters 
     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    regExp(
        expression: RegExp,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    regExp(
        expression: string,
        ignoreCase?: boolean,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    regExp(
        expression: RegExp,
        validatorParameters: FluentRegExpValidatorConfig): IFluentValidatorBuilder;
    regExp(
        expression: string,
        ignoreCase: boolean,
        validatorParameters: FluentRegExpValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a range condition to the validator.
     * Range condition ensures that the value falls within the specified minimum and maximum bounds.
     * @example
     * ```ts
     * range(1, 10);
     * range(1, 10, "Value must be between {minimum} and {maximum}")
     * range(1, 10, "Value must be between {minimum} and {maximum}", "Summary message");
     * range(1, 10, { 
     *      errorMessage: "Value must be between {minimum} and {maximum}",
     *      summaryMessage: "Summary message" });
     * ```
     * @param minimum - The minimum value of the range.
     * @param maximum - The maximum value of the range.
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters 
     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    range(
        minimum: any,
        maximum: any,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    range(
        minimum: any,
        maximum: any,
        validatorParameters: FluentRangeValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is equal to the specified second value.
     * 
     * @example
     * ```ts
     * equalToValue(42);
     * equalToValue(42, "Value must be {value}.");
     * equalToValue(42, "Value must be 42.", "Summary message");
     * equalToValue(42, {
     *      errorMessage: "Value must be 42.", 
     *      summaryMessage: "Summary message" });
     * ```
     * 
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */
    equalToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    equalToValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for equalToValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    eqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    eqValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is equal to the second value host.
     * 
     * @example
     * ```ts
     * equalTo('fieldname2');
     * equalTo('fieldname2', "Value must be {value}.");
     * equalTo('fieldname2', "Value must be same as {SecondLabel}.", "Summary message");
     * equalTo('fieldname2', {
     *      errorMessage: "Value must be same as {SecondLabel}.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    equalTo(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    equalTo(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentEqualToValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for equalTo
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    eq(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    eq(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentEqualToValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is not equal to the specified second value.
     * 
     * @example
     * ```ts
     * notEqualToValue(42);
     * notEqualToValue(42, "Value must not be {Value}.");
     * notEqualToValue(42, "Value must not be 42.", "Summary message");
     * notEqualToValue(42, {
     *      errorMessage: "Value must not be 42.", 
     *      summaryMessage: "Summary message" });
     * ```
     * 
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */
    notEqualToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    notEqualToValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for notEqualToValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    neqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    neqValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is not equal to the second value host.
     * 
     * @example
     * ```ts
     * notEqualTo('fieldname2');
     * notEqualTo('fieldname2', "Value must not be equal to {value}.");
     * notEqualTo('fieldname2', "Value must not be same as {SecondLabel}.", "Summary message");
     * notEqualTo('fieldname2', {
     *      errorMessage: "Value must not be same as {SecondLabel}.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */
    notEqualTo(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    notEqualTo(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentNotEqualToValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for notEqualTo
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    neq(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    neq(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentNotEqualToValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is less than the specified second value.
     * 
     * @example
     * ```ts
     * lessThanValue(42);
     * lessThanValue(42, "Value must be less than {value}.");
     * lessThanValue(42, "Value must be less than 42.", "Summary message");
     * lessThanValue(42, {
     *      errorMessage: "Value must be less than 42.", 
     *      summaryMessage: "Summary message" });
     * ```
     * 
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    lessThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    lessThanValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for lessThanValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    ltValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    ltValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is less than the second value host.
     * 
     * @example
     * ```ts
     * lessThan('fieldname2');
     * lessThan('fieldname2', "Value must be less than {value}.");
     * lessThan('fieldname2', "Value must be less than {SecondLabel}.", "Summary message");
     * lessThan('fieldname2', {
     *      errorMessage: "Value must be less than {SecondLabel}.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */        
    lessThan(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    lessThan(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for lessThan
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    lt(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    lt(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanValidatorConfig): IFluentValidatorBuilder;


    /**
     * Adds a validator that ensures the value is less than or equal to the specified second value.
     * 
     * @example
     * ```ts
     * lessThanOrEqualValue(42);
     * lessThanOrEqualValue(42, "Value must be less than or equal to {value}.");
     * lessThanOrEqualValue(42, "Value must be less than or equal to 42.", "Summary message");
     * lessThanOrEqualValue(42, {
     *      errorMessage: "Value must be less than or equal to 42.", 
     *      summaryMessage: "Summary message" });
     * ```
     * 
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    lessThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    lessThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for lessThanOrEqualValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    lteValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    lteValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is less than or equal to the second value host.
     * 
     * @example
     * ```ts
     * lessThanOrEqual('fieldname2');
     * lessThanOrEqual('fieldname2', "Value must be less than or equal to {value}.");
     * lessThanOrEqual('fieldname2', "Value must be less than or equal to {SecondLabel}.", "Summary message");
     * lessThanOrEqual('fieldname2', {
     *      errorMessage: "Value must be less than or equal to {SecondLabel}.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    lessThanOrEqual(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    lessThanOrEqual(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanOrEqualValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for lessThanOrEqual
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    lte(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    lte(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanOrEqualValidatorConfig): IFluentValidatorBuilder;


    /**
     * Adds a validator that ensures the value is greater than the specified second value.
     * 
     * @example
     * ```ts
     * greaterThanValue(42);
     * greaterThanValue(42, "Value must be greater than {value}.");
     * greaterThanValue(42, "Value must be greater than 42.", "Summary message");
     * greaterThanValue(42, {
     *      errorMessage: "Value must be greater than 42.", 
     *      summaryMessage: "Summary message" });
     * ```
     * 
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */
    greaterThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    greaterThanValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for greaterThanValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    gtValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    gtValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is greater than the second value host.
     * 
     * @example
     * ```ts
     * greaterThan('fieldname2');
     * greaterThan('fieldname2', "Value must be greater than {value}.");
     * greaterThan('fieldname2', "Value must be greater than {SecondLabel}.", "Summary message");
     * greaterThan('fieldname2', {
     *      errorMessage: "Value must be greater than {SecondLabel}.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */        
    greaterThan(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    greaterThan(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for greaterThan
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    gt(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    gt(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is greater than or equal to the specified second value.
     * 
     * @example
     * ```ts
     * greaterThanOrEqualValue(42);
     * greaterThanOrEqualValue(42, "Value must be greater than or equal to {value}.");
     * greaterThanOrEqualValue(42, "Value must be greater than or equal to 42.", "Summary message");
     * greaterThanOrEqualValue(42, {
     *      errorMessage: "Value must be greater than or equal to 42.", 
     *      summaryMessage: "Summary message" });
     * ```
     * 
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    greaterThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    greaterThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for greaterThanOrEqualValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    gteValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    gteValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): IFluentValidatorBuilder;


    /**
     * Adds a validator that ensures the value is greater than or equal to the second value host.
     * 
     * @example
     * ```ts
     * greaterThanOrEqual('fieldname2');
     * greaterThanOrEqual('fieldname2', "Value must be greater than or equal to {value}.");
     * greaterThanOrEqual('fieldname2', "Value must be greater than or equal to {SecondLabel}.", "Summary message");
     * greaterThanOrEqual('fieldname2', {
     *      errorMessage: "Value must be greater than or equal to {SecondLabel}.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanOrEqualValidatorConfig): IFluentValidatorBuilder;

    gte(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    gte(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanOrEqualValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the text length is within limits.
     * 
     * @example
     * ```ts
     * stringLength(10);
     * stringLength(10, "Text has exceeded  {maximum} characters.");
     * stringLength(10, "Text has exceeded  {maximum} characters.", "Summary message");
     * stringLength(10, {
     *      errorMessage: "Text has exceeded  {maximum} characters.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param maximum - The maximum length allowed for the string.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    stringLength(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    stringLength(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for stringLength
     * @param maximum 
     * @param errorMessage 
     * @param summaryMessage 
     */
    len(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    len(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is 0 or higher.
     * It returns Undetermined if the value is not a number.
     * 
     * @example
     * ```ts
     * positive();
     * positive("Value must be 0 or higher.");
     * positive("Value must be 0 or higher.", "Summary message");
     * positive({
     *      errorMessage: "Value must be 0 or higher.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    positive(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    positive(
        validatorParameters: FluentPositiveValidatorConfig): IFluentValidatorBuilder;

    /**
     * Alias for positive
     * @param errorMessage 
     * @param summaryMessage 
     */
    pos(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    pos(
        validatorParameters: FluentPositiveValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the value is an integer.
     * It requires a numeric value, or it evaluates as Undetermined.
     * 
     * @example
     * ```ts
     * integer();
     * integer("Value must be an integer.");
     * integer("Value must be an integer.", "Summary message");
     * integer({
     *      errorMessage: "Value must be an integer.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */        
    integer(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    integer(
        validatorParameters: FluentIntegerValidatorConfig): IFluentValidatorBuilder;
    /**
     * Alias for integer
     * @param errorMessage 
     * @param summaryMessage 
     */
    int(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    int(
        validatorParameters: FluentIntegerValidatorConfig): IFluentValidatorBuilder;

    /**
     * Adds a validator that ensures the number of decimal places is limited to the specified maximum.
     * The value must be a number or it will be evaluated as Undetermined.
     * 
     * @example
     * ```ts
     * maxDecimals(2);
     * maxDecimals(2, "Value has too many decimal places.");
     * maxDecimals(2, "Value has too many decimal places.", "Summary message");
     * maxDecimals(2, {
     *      errorMessage: "Value has too many decimal places.", 
     *      summaryMessage: "Summary message" });
     * ```
     *
     * @param maxDecimals - The maximum number of decimal places allowed for the number.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */        
    maxDecimals(
        maxDecimals: number,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    maxDecimals(
        maxDecimals: number,
        validatorParameters: FluentMaxDecimalsValidatorConfig): IFluentValidatorBuilder;

    /**
     * Builds a validator around a condition and negates the validation result
     * of the condition. When the condition result is NoMatch, the overall validation will pass, and vice versa.
     * 
     * @example
     * ```ts
     * builder.field('fieldname').not(
     *     (childBuilder) =>
     *         childBuilder.parentValue().requireText()
     * )
     * ```
     * 
     * ```ts
     * not(childBuilderHandler);
     * not(childBuilderHandler, 
     *      "Error message", "Summary message");
     * not(childBuilderHandler, 
     *      {
     *          errorMessage: "Error message", 
     *          summaryMessage: "Summary message" 
     *      });
     * ```
     *
     * @param childBuilderHandler - The condition builder handler that defines the child condition to be negated.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    not(
        childBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    not(
        childBuilder: ConditionBuilderHandler,
        validatorParameters: FluentNotValidatorConfig): IFluentValidatorBuilder;

    /**
     * Builds a validator that must only be evaluated based on another condition.
     * Consider this a "when" -> "then" process, where the condition to evaluate
     * is the "then" part.
     * 
     * @example
     * ```ts
     * when(
     *      (whenToEnableBuilder) => 
     *          whenToEnableBuilder.fieldValue('checkbox1').equals(true),
     *      (thenBuilder) =>
     *          thenBuilder.parentValue().requireText()
     *  )
     * ```
     * 
     * ```ts
     * when(
     *     (whenToEnableBuilder) => 
     *         whenToEnableBuilder.fieldValue('checkbox1').equals(true),
     *     (thenBuilder) =>
     *         thenBuilder.parentValue().requireText()
     * );
     * when(
     *     (whenToEnableBuilder) => 
     *         whenToEnableBuilder.fieldValue('checkbox1').equals(true),
     *     (thenBuilder) =>
     *         thenBuilder.parentValue().requireText(),
     *     'error message', 'summary message'
     * );
     * when(
     *     (whenToEnableBuilder) => 
     *         whenToEnableBuilder.fieldValue('checkbox1').equals(true),
     *     (thenBuilder) =>
     *         thenBuilder.parentValue().requireText(),
     *     { 
     *         errorMessage: 'error message',
     *         summaryMessage: 'summary message',
     *     });	
     * ```
     *
     * @param WhenToEnableBuilderHandler - The handler function that defines the condition 
     * under which the validator should be evaluated.
     * @param ThenBuilderHandler - The handler function that defines the validation logic 
     * to be executed when the WhenToEnable condition is met.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */        
    when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        validatorParameters: FluentWhenValidatorConfig): IFluentValidatorBuilder;    
    
    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when all child conditions are satisfied.
     * 
     * @example
     * ```ts
     * builder.field('fieldname').all((childBuilder)=>{
     *     childBuilder.parentValue().requireText();
     *     childBuilder.fieldValue('fieldname2').requireText(parameters);
     *     childBuilder.fieldValue('fieldname2').regExp('^[A-D]');
     *     childBuilder.fieldValue('fieldname3').equalTo('fieldname4');
     *     childBuilder.any((grandchildBuilder)=> {
     *         grandchildBuilder.fieldValue('fieldname10').requireText();
     *         grandchildBuilder.fieldValue('fieldname11').requireText();
     *     })
     * });
     * ```
     * 
     * ```ts
     * all(childBuilderHandler);
     * all(childBuilderHandler,
     *     errorMessage?, summaryMessage?);
     * all(childBuilderHandler,
     *     { // these are the validator parameters
     *         errorMessage?: null | string | ((host) => string);
     *         errorMessagel10n?: null | string;
     *         summaryMessage?: null | string | ((host) => string);
     *         summaryMessagel10n?: null | string;
     *         
     *         severity?: ValidationSeverity | ((host) => ValidationSeverity);
     *         errorCode?: string; 
     *         enabled?: boolean | ((host) => boolean);
     *     // condition properties:
     *         treatUndeterminedAs?: ConditionEvaluateResult;
     *     }
     * );
     * ```
     *
     * @param childBuilderHandler - The condition builder handler that defines the child conditions 
     * to be evaluated. Each child condition is defined as a separate call to the child builder handler.
     * They cannot be chained.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */        
    all(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    all(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAllMatchValidatorConfig): IFluentValidatorBuilder;

    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when any of the child conditions are satisfied.
     * 
     * @example
     * ```ts
     * builder.field('fieldname').any((childBuilder)=>{
     *    childBuilder.fieldValue('fieldname3').requireText();
     *    childBuilder.fieldValue('fieldname4').requireText();
     * });
     * ```
     * 
     * ```ts
     * any(childBuilderHandler);
     * any(childBuilderHandler,
     *     errorMessage?, summaryMessage?);
     * any(childBuilderHandler,
     *     { // these are the validator parameters
     *         errorMessage?: null | string | ((host) => string);
     *         errorMessagel10n?: null | string;
     *         summaryMessage?: null | string | ((host) => string);
     *         summaryMessagel10n?: null | string;
     *         
     *         severity?: ValidationSeverity | ((host) => ValidationSeverity);
     *         errorCode?: string; 
     *         enabled?: boolean | ((host) => boolean);
     *     // condition properties:
     *         treatUndeterminedAs?: ConditionEvaluateResult;
     *     }
     * );
     * ```
     *
     * @param childBuilderHandler - The condition builder handler that defines the child conditions 
     * to be evaluated. Each child condition is defined as a separate call to the child builder handler.
     * They cannot be chained.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */
    any(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    any(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAnyMatchValidatorConfig): IFluentValidatorBuilder;

    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when a specified number of child conditions are satisfied. You supply
     * a minimum and maximum number of child conditions that must be satisfied 
     * for the validator to evaluate as a match.
     * 
     * @example
     * ```ts
     * builder.field('fieldname').countMatches(2, 4,
     * (childBuilder)=>{
     *    childBuilder.fieldValue('fieldname1').requireText();
     *    childBuilder.fieldValue('fieldname2').requireText();
     *    childBuilder.fieldValue('fieldname3').requireText();
     *    childBuilder.fieldValue('fieldname4').requireText();
     *    childBuilder.fieldValue('fieldname5').requireText();
     *    childBuilder.fieldValue('fieldname6').requireText();
     * });
     * ```
     * 
     * ```ts
     * countMatches(minimum, maximum, childBuilderHandler);
     * countMatches(minimum, maximum, childBuilderHandler,
     *     errorMessage?, summaryMessage?);
     * countMatches(minimum, maximum, childBuilderHandler,
     *     { // these are the validator parameters
     *         errorMessage?: null | string | ((host) => string);
     *         errorMessagel10n?: null | string;
     *         summaryMessage?: null | string | ((host) => string);
     *         summaryMessagel10n?: null | string;
     *         
     *         severity?: ValidationSeverity | ((host) => ValidationSeverity);
     *         errorCode?: string; 
     *         enabled?: boolean | ((host) => boolean);
     *     // condition properties:
     *         treatUndeterminedAs?: ConditionEvaluateResult;
     *     }
     * );
     * ```
     * @param minimum - The minimum number of matches required. If null, there is no minimum.
     * @param maximum - The maximum number of matches allowed. If null, there is no maximum.
     * @param childBuilderHandler - The condition builder handler that defines the child conditions 
     * to be evaluated. Each child condition is defined as a separate call to the child builder handler.
     * They cannot be chained.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */            
    countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentCountMatchesValidatorConfig): IFluentValidatorBuilder;    
}

export type OptionalRequireTextConditionParams = Partial<Omit<RequireTextConditionConfig,
    'conditionType' | 'valueHostName' | 'category'>>;
export type OptionalRegExpConditionParams = Partial<Omit<RegExpConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'expressionAsString' | 'expression' | 'ignoreCase'>>;

// Note about valueHostName.
// The valuehostname property normally gets automatically populated based on the context in which the condition is used.
// However, the comparison conditions that compare to a second valuehostName may
// require explicit specification of the valuehostName property.
// As a result, you see /*'valueHostName' |*/ in the definitions below.
// ```ts
//  protected configureRules(builder: IValidationManagerConfigBuilder,
//      options?: RulesConfigOptions): void {
//      builder.field('StartDate', LookupKey.Date, { label: 'Start date' })
//          .lessThan('EndDate')
//          .lessThanOrEqual('NumOfDays',   // right operand of the comparison
//              {
//                  valueHostName: 'DiffDays',  // <<< HERE: compare to this valueHost, not StartDate
//                  errorMessage: 'Less than {compareTo} days apart', 
//                  errorCode: 'NumOfDays' 
//               });  
//      builder.field('EndDate', LookupKey.Date, { label: 'End date' });
//      builder.static('NumOfDays', LookupKey.Integer, { initialValue: 10 });
//      builder.calc('DiffDays', LookupKey.Integer, this.differenceBetweenDates);        
//  }
// ```
export type FluentDataTypeCheckValidatorConfig = FluentValidatorConfig;
export type FluentRequireTextValidatorConfig = FluentValidatorConfig & OptionalRequireTextConditionParams;
export type FluentNotNullValidatorConfig = FluentValidatorConfig;
export type FluentRegExpValidatorConfig = FluentValidatorConfig & OptionalRegExpConditionParams;
export type FluentRangeValidatorConfig = FluentValidatorConfig;
export type FluentEqualToValueValidatorConfig = OptionalEqualToValueConditionParams & FluentValidatorConfig;
export type FluentEqualToValidatorConfig = OptionalEqualToConditionParams & FluentValidatorConfig;
export type FluentNotEqualToValueValidatorConfig = OptionalNotEqualToValueConditionParams & FluentValidatorConfig;
export type FluentNotEqualToValidatorConfig = OptionalNotEqualToConditionParams & FluentValidatorConfig;
export type FluentLessThanValueValidatorConfig = OptionalLessThanValueConditionParams & FluentValidatorConfig;
export type FluentLessThanValidatorConfig = OptionalLessThanConditionParams & FluentValidatorConfig;
export type FluentLessThanOrEqualValueValidatorConfig = OptionalLessThanOrEqualValueConditionParams & FluentValidatorConfig;
export type FluentLessThanOrEqualValidatorConfig = OptionalLessThanOrEqualConditionParams & FluentValidatorConfig;
export type FluentGreaterThanValueValidatorConfig = OptionalGreaterThanValueConditionParams & FluentValidatorConfig;
export type FluentGreaterThanValidatorConfig = OptionalGreaterThanConditionParams & FluentValidatorConfig;
export type FluentGreaterThanOrEqualValueValidatorConfig = OptionalGreaterThanOrEqualValueConditionParams & FluentValidatorConfig;
export type FluentGreaterThanOrEqualValidatorConfig = OptionalGreaterThanOrEqualConditionParams & FluentValidatorConfig;
export type FluentStringLengthValidatorConfig = OptionalStringLengthConditionParams & FluentValidatorConfig;
export type FluentPositiveValidatorConfig = FluentValidatorConfig;
export type FluentIntegerValidatorConfig = FluentValidatorConfig;
export type FluentMaxDecimalsValidatorConfig = FluentValidatorConfig;
export type FluentNotValidatorConfig = FluentValidatorConfig;
export type FluentWhenValidatorConfig = FluentValidatorConfig;
export type FluentAllMatchValidatorConfig = FluentValidatorConfig;
export type FluentAnyMatchValidatorConfig = FluentValidatorConfig;
export type FluentCountMatchesValidatorConfig = FluentValidatorConfig;


/**
 * Interface for condition builders.
 */
export interface IConditionBuilderBase<TConfig extends ConditionConfig = ConditionConfig,
    TOptions extends SetConfigOptions = SetConfigOptions>
    extends IBuilderConfigHost<TConfig, TOptions> {
    /**
     * Inverts the match result of the child condition config.
     * When child matches, the parent will not match, and vice versa.
     * When the child is undetermined, the parent will be undetermined.
     * @param notCallback 
     */
    not(notCallback: ConditionBuilderHandler): void;

    /**
     * Executes a condition only when another condition is satisfied.
     * When the "when" condition is satisfied, the "then" condition is evaluated.
     * When the "when" condition is not satisfied, the "then" condition is not evaluated,
     * @param whenToEnable -
     * @param thenCallback 
     */
    when(whenToEnableCallback: ConditionBuilderHandler, thenCallback: ConditionBuilderHandler): void;

    /**
     * Considers a match to be when all child conditions match. If any child does not match, the parent does not match.
     * If any child is undetermined, the parent ignores it.
     * If no child conditions are supplied or all child conditions are undetermined, the parent is undetermined.
     * @param callback 
     */
    all(callback: ConditionWithChildrenBuilderHandler): void;

    /**
     * Considers a match to be when any child condition matches. 
     * If all child conditions do not match, the parent does not match.
     * If any child is undetermined, the parent ignores it.
     * If no child conditions are supplied or all child conditions are undetermined, the parent is undetermined.
     * @param callback 
     */
    any(callback: ConditionWithChildrenBuilderHandler): void;

    /**
     * Considers a match to be when a specified number of child conditions match.
     * If the number of matching child conditions is less than the minimum, the parent does not match.
     * If the number of matching child conditions is more than the maximum, the parent does not match.
     * If any child is undetermined, the parent ignores it.
     * If no child conditions are supplied or all child conditions are undetermined, the parent is undetermined.
     * @param minimum 
     * @param maximum 
     * @param callback 
     */
    countMatches(minimum: number | null, maximum: number | null,
        callback: ConditionWithChildrenBuilderHandler): void;
    
    /**
     * Provides a way to supply a complete condition config object directly to the builder.
     * The supplied object must have its conditionType and all required properties for that condition type.
     * 
     * ```ts
     * builder.conditionConfig(<RangeConditionConfig>{
     *     conditionType: ConditionType.Range,
     *     minimum: 1,
     *     maximum: 5
     * });
     * ```
     * @param config 
     */
    conditionConfig(config: ConditionConfig): void;
    
}

/**
 * The condition builder that supplies all of the condition methods.
 * Each time we add a condition to Jivs, add it here too.
 */
export interface IConditionBuilder<TConfig extends ConditionConfig = ConditionConfig>
    extends IConditionBuilderBase<TConfig> {
    /**
     * Creates a configuration for DataTypeCheckCondition.
     */
    dataTypeCheck(): void;

    /**
     * Creates a configuration for the RequireTextCondition.
     * @param conditionConfig - Optional configuration parameters for the RequireText condition.
     */
    requireText(conditionConfig?: OptionalRequireTextConditionParams): void;

    /**
     * Creates a configuration for the NotNullCondition.
     */
    notNull(): void;

    /**
     * Creates a configuration for the RegExpCondition.
     * @param expression - The regular expression to match against.
     * @param ignoreCase - Whether to ignore case when matching the regular expression.
     * @param conditionConfig - Optional configuration parameters for the RegExp condition.
     */
    regExp(
        expression: RegExp | string, ignoreCase?: boolean | null,
        conditionConfig?: OptionalRegExpConditionParams): void;

    /**
     * Creates a configuration for the RangeCondition.
     * @param minimum - The minimum value for the range.
     * @param maximum - The maximum value for the range.
     */
    range(minimum: any, maximum: any): void;

    /**
     * Creates a configuration for the EqualToValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualToValue condition.
     */
    equalToValue(
        secondValue: any,
        conditionConfig?: OptionalEqualToValueConditionParams): void;

    /**
     * Creates a configuration for the EqualToValueCondition using an alias to equalToValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualToValue condition.
     */
    eqValue(secondValue: any, conditionConfig?: OptionalEqualToValueConditionParams): void;

    /**
     * Creates a configuration for the EqualToCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualTo condition.
     */
    equalTo(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalEqualToConditionParams): void;
    /**
     * Creates a configuration for the EqualToCondition using an alias to equalTo()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualTo condition.
     */
    eq(secondValueHostName: ValueHostName, conditionConfig?: OptionalEqualToConditionParams): void;

    /**
     * Creates a configuration for the NotEqualToValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualToValue condition.
     */
    notEqualToValue(
        secondValue: any,
        conditionConfig?: OptionalNotEqualToValueConditionParams): void;

    /**
     * Creates a configuration for the NotEqualToValueCondition using an alias to notEqualToValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualToValue condition.
     */
    neqValue(secondValue: any, conditionConfig?: OptionalNotEqualToValueConditionParams): void;
    /**
     * Creates a configuration for the NotEqualToCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualTo condition.
     */
    notEqualTo(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalNotEqualToConditionParams): void;

    /**
     * Creates a configuration for the NotEqualToCondition using an alias to notEqualTo()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualTo condition.
     */
    neq(secondValueHostName: ValueHostName, conditionConfig?: OptionalNotEqualToConditionParams): void;
    /**
     * Creates a configuration for the LessThanValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanValue condition.
     */
    lessThanValue(
        secondValue: any,
        conditionConfig?: OptionalLessThanValueConditionParams): void;

    /**
     * Creates a configuration for the LessThanValueCondition using an alias to lessThanValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanValue condition.
     */
    ltValue(secondValue: any, conditionConfig?: OptionalLessThanValueConditionParams): void;

    /**
     * Creates a configuration for the LessThanCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThan condition.
     */
    lessThan(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalLessThanConditionParams): void;

    /**
     * Creates a configuration for the LessThanCondition using an alias to lessThan()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThan condition.
     */
    lt(secondValueHostName: ValueHostName, conditionConfig?: OptionalLessThanConditionParams): void;

    /**
     * Creates a configuration for the LessThanOrEqualValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqualValue condition.
     */
    lessThanOrEqualValue(
        secondValue: any,
        conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void;

    /**
     * Creates a configuration for the LessThanOrEqualValueCondition using an alias to lessThanOrEqualValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqualValue condition.
     */
    lteValue(secondValue: any, conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void;
    /**
     * Creates a configuration for the LessThanOrEqualCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqual condition.
     */
    lessThanOrEqual(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalLessThanOrEqualConditionParams): void;

    /**
     * Creates a configuration for the LessThanOrEqualCondition using an alias to lessThanOrEqual()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqual condition.
     */
    lte(secondValueHostName: ValueHostName, conditionConfig?: OptionalLessThanOrEqualConditionParams): void;

    /**
     * Creates a configuration for the GreaterThanValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanValue condition.
     */
    greaterThanValue(
        secondValue: any,
        conditionConfig?: OptionalGreaterThanValueConditionParams): void;

    /**
     * Creates a configuration for the GreaterThanValueCondition using an alias to greaterThanValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanValue condition.
     */
    gtValue(secondValue: any, conditionConfig?: OptionalGreaterThanValueConditionParams): void;

    /**
     * Creates a configuration for the GreaterThanCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThan condition.
     */
    greaterThan(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalGreaterThanConditionParams): void;

    /**
     * Creates a configuration for the GreaterThanCondition using an alias to greaterThan()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThan condition.
     */
    gt(secondValueHostName: ValueHostName, conditionConfig?: OptionalGreaterThanConditionParams): void;
    /**
     * Creates a configuration for the GreaterThanOrEqualValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqualValue condition.
     */
    greaterThanOrEqualValue(
        secondValue: any,
        conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void;

    /**
     * Creates a configuration for the GreaterThanOrEqualValueCondition using an alias to greaterThanOrEqualValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqualValue condition.
     */
    gteValue(secondValue: any, conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void;
    
    /**
     * Creates configuration for the GreaterThanOrEqualCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqual condition.
     */
    greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void;

    /**
     * Creates a configuration for the GreaterThanOrEqualCondition using an alias to greaterThanOrEqual()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqual condition.
     */
    gte(secondValueHostName: ValueHostName, conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void;

    /**
     * Creates a configuration for the StringLengthCondition.
     * @param maximum - The maximum length of the string.
     * @param conditionConfig - Optional configuration parameters for the StringLength condition.
     */
    stringLength(
        maximum: number | null,
        conditionConfig?: OptionalStringLengthConditionParams): void;

    /**
     * Creates a configuration for the StringLengthCondition using an alias to stringLength()
     * @param maximum - The maximum length of the string.
     * @param conditionConfig - Optional configuration parameters for the StringLength condition.
     */
    len(maximum: number | null, conditionConfig?: OptionalStringLengthConditionParams): void;

    /**
     * Creates a configuration for the PositiveCondition.
     * This condition checks if a value is positive.
     */
    positive(): void;

    /**
     * Creates a configuration for the IntegerCondition.
     * This condition checks if a value is an integer.
     */
    integer(): void;

    /**
     * Creates a configuration for the MaxDecimalsCondition.
     * This condition checks if a value has no more than the specified number of decimal places.
     * @param maxDecimals - The maximum number of decimal places allowed.
     */
    maxDecimals(maxDecimals: number): void;
}

/**
 * The starting point for building a condition, where you identify the valueHostName for the condition
 * prior to selecting the actual condition to apply to it.
 */
export interface IStartConditionBuilder extends IConditionBuilderBase<ConditionConfig> {

    /**
     * When assigned, it is copied to the child condition config's valueHostName property, 
     * which is used by conditions that require a value host name.
     */
    valueHostName?: ValueHostName;
    /**
     * Starts building a condition that uses the parent value host as its source.
     * 
     * Hands off the next part to a new ConditionBuilder, 
     * where the user can select the actual condition to build.
     * setConfig() will not assign a valueHostName property to the child condition config, 
     * which means the parent value host is used.
     * @returns 
     */
    parentValue(): IConditionBuilder;

    /**
     * Starts building a condition that uses the supplied valueHostName as its source.
     * 
     * Hands off the next part to a new ConditionBuilder, 
     * where the user can select the actual condition to build.
     * setConfig() will later bind the valueHostName to the child condition config's valueHostName property.
     * @param valueHostName 
     * @returns 
     */
    fieldValue(valueHostName: string): IConditionBuilder;

}

/**
 * Starter these conditions: AllCondition, AnyCondition, CountMatchesCondition.
 * These conditions have an array of child condition configs that are supplied through an array.
 * Each child in created by its own ConditionBuilder and passed up to this one.
 * 
 * It works a bit differently than the usual, by taking on the task of creating
 * the actual ConditionWithChildrenBaseConfig object, and through setConfig(),
 * adding each child config to the array, 
 * which is the conditionConfigs property of the ConditionWithChildrenBaseConfig.
 * 
 * Each call to setConfig() will add a child config to the array.
 * It fully creates the ConditionWithChildrenBaseConfig object, which is returned by getConfig().
 * 
 * It does not offer a completed callback to the parent builder because each
 * call to its setConfig() handles the addition of a child config,
 * and the parent builder will only receive the fully constructed configuration when appropriate.
 */
export interface IStartConditionWithChildrenBuilder extends IStartConditionBuilder {
}

/**
 * Builder that allows only one child condition.
 * Used by Not and WhenConditions.
 */
export interface IStartConditionWithOneChildBuilder extends IStartConditionBuilder {
}


/**
 * Allows a child to create its own condition, through the supplied StartConditionBuilder.
 * The caller gets the result when the child code calls its builder's setConfig().
 */
export type ConditionBuilderHandler = (conditionsBuilder: IStartConditionBuilder) => void;
export type ConditionWithChildrenBuilderHandler =
    (conditionsBuilder: IStartConditionWithChildrenBuilder) => void;

export interface SetConfigOptions {
    /**
     * When true or undefined, the parent's completed callback will be invoked.
     * When false, the parent's completed callback will not be invoked.
     */
    bubbleUp?: boolean;
    /**
     * When true or undefined, the value host name will be applied to the condition config
     * if not already assigned.
     */
    applyValueHostName?: boolean;
}


//#endregion Child Builders

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
     * @returns The IModifyValidatorBuilder for further modifications.
     */
    modify(valueHostName: ValueHostName, adjustments: AdapterValueHostConfig): IModifyValidatorBuilder;

    /**
     * Modifies the configuration of a specific ValueHost by applying the given adjustments.
     * Applies the specified adjustments to the ValueHostConfig.
     * This does not modify anything that must be retained from business logic itself.
     * It contains the dataType property which is a special case for changes.
     * @param valueHostName - the name of the ValueHost to modify.
     * @param dataType - the data type of the ValueHost to modify. It must support falling back to the 
     * original dataType. (However, if the original is not supplied, it is used without verification.)
     * @param adjustments - the adjustments to apply to the ValueHostConfig.
     * @returns The IModifyValidatorBuilder for further modifications.
     */
    modify(valueHostName: ValueHostName, dataType: string, adjustments?: AdapterValueHostConfig): IModifyValidatorBuilder;    
}

export type AdapterValueHostConfig = Omit<FieldValueHostConfig, 'validatorConfigs' | 'name' | 'dataType'>;

/**
 * Builder that is chained from IConfigFormAdapter to modify individual fields.
 */
export interface IModifyFieldBuilder
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
     * Use this to replace the existing validator with a new condition.
     * Use this very carefully as you are abandoning the official business logic of an existing validator.
     * If your goal is to turn off the existing validator, consider when() for selective enabling
     * or set the validator's enabled property to false.
     * The new condition is defined using a StartConditionBuilder and returns a ConditionConfig.
     * @param builderCallback - A callback function that receives a new StartConditionBuilder and 
     * returns a ConditionConfig representing the new condition that will replace the existing validator.
     */
    replaceWith(builderCallback: (replacementBuilder: IStartConditionBuilder) => ConditionConfig): void;

}
//#endregion ConfigFormAdapter