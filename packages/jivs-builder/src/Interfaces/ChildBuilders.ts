/**
 * Provides types for the builders for validator and condition configuration.
 * 
 * - IBuilderConfigHost: Interface for builders that host child config objects.
 * - IValidatorBuilder: Interface for builders that create validator configs.
 * - IStartConditionBuilder: Interface for the starting point of condition builders.
 * - IStartConditionWithChildrenBuilder: Interface for the starting point of condition builders that can have child conditions.
 * - IStartConditionWithOneChildBuilder: Interface for the starting point of condition builders that can have exactly one child condition.
 * - IConditionBuilder: Interface for builders that create condition configs.
 * 
 *  @module jivs-builder/Builders/Types
 */


import {
    RegExpConditionConfig,
    RequireTextConditionConfig,
    StringLengthConditionConfig
} from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import {
    EqualToValueConditionConfig,
    GreaterThanOrEqualValueConditionConfig,
    GreaterThanValueConditionConfig,
    LessThanValueConditionConfig,
    LessThanOrEqualValueConditionConfig,
    NotEqualToValueConditionConfig
} from '@plblum/jivs-engine/build/Conditions/ComparisonCondition_classes';
import { ValueHostName } from '@plblum/jivs-engine/build/DataTypes/BasicTypes';
import { ConditionConfig, ICondition } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValidatorConfig } from '@plblum/jivs-engine/build/Interfaces/Validator';
import { FluentValidatorConfig } from './ValueHostConfigBuilders';


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


/**
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with BuildersFactory.
 */
export interface IValidatorBuilder extends IBuilderConfigHost<object>
{
    /**
     * The FieldValueHostConfig that is being constructed and will be supplied to ValueHostsManagerConfig.valueHostConfigs.
     */
    parentConfig: FieldValueHostConfig;    
    /**
     * Lets you create the condition instance itself into the Builder instead of
     * using the existing ValidatorBuilder validators.
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
        summaryMessage?: string | null): IValidatorBuilder;
    customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        validatorParameters: FluentValidatorConfig): IValidatorBuilder;

    /**
     * Adds a DataTypeCheck condition to the validator builder.
     * DataTypeCheck ensures that the value being validated matches the expected data type.
     * In many cases, it is automatically added by the ValueHost based on the dataType field value.
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
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
        summaryMessage?: string | null): IValidatorBuilder;
    dataTypeCheck(
        validatorParameters: FluentDataTypeCheckValidatorConfig): IValidatorBuilder;

    /**
      * Adds a RequireText condition to the validator builder.
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
        summaryMessage?: string | null): IValidatorBuilder;
    requireText(
        validatorParameters: FluentRequireTextValidatorConfig): IValidatorBuilder;
    /**
     * Adds a NotNull condition to the validator builder.
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

     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    notNull(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    notNull(
        validatorParameters: FluentNotNullValidatorConfig): IValidatorBuilder;

    /**
     * Adds a RegExp condition to the validator builder.
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
     * Can be a RegExp object or a string. If a string, there is a second parameter, ignoreCase,
     * which is a boolean indicating whether to ignore case when matching.
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.

     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    regExp(
        expression: RegExp,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a RegExp condition to the validator builder.
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
     * @param expression - The regular expression as a RegExp object to match against the value being validated. 
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.

     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */    
    regExp(
        expression: string,
        ignoreCase?: boolean,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    regExp(
        expression: RegExp,
        validatorParameters: FluentRegExpValidatorConfig): IValidatorBuilder;
    regExp(
        expression: string,
        ignoreCase: boolean,
        validatorParameters: FluentRegExpValidatorConfig): IValidatorBuilder;

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

     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    range(
        minimum: any,
        maximum: any,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    range(
        minimum: any,
        maximum: any,
        validatorParameters: FluentRangeValidatorConfig): IValidatorBuilder;

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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    equalToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    equalToValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): IValidatorBuilder;

    /**
     * Alias for equalToValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    eqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    eqValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): IValidatorBuilder;

//     /**
//      * Adds a validator that ensures the value is equal to the second value host.
//      * 
//      * @example
//      * ```ts
//      * equalTo('fieldname2');
//      * equalTo('fieldname2', "Value must be {value}.");
//      * equalTo('fieldname2', "Value must be same as {SecondLabel}.", "Summary message");
//      * equalTo('fieldname2', {
//      *      errorMessage: "Value must be same as {SecondLabel}.", 
//      *      summaryMessage: "Summary message" });
//      * ```
//      *
//      * @param secondValueHostName - The valueHostName containing the value for the right operand.
//      * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
//      * It can use tokens, which are resolved with current data at the time of validation.
//      * If null, it will expect to be setup by one of several other sources including
//      * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
//      * @param summaryMessage - optional summary message.
// - Optional validator configuration parameters.
//      * @returns The current instance of ValidatorBuilder for method chaining.
//      */    
//     equalTo(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
//     equalTo(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentEqualToValidatorConfig): IValidatorBuilder;

//     /**
//      * Alias for equalTo
//      * @param secondValueHostName 
//      * @param errorMessage 
//      * @param summaryMessage 
//      */
//     eq(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
//     eq(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentEqualToValidatorConfig): IValidatorBuilder;

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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    notEqualToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    notEqualToValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): IValidatorBuilder;

    /**
     * Alias for notEqualToValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    neqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    neqValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): IValidatorBuilder;

//     /**
//      * Adds a validator that ensures the value is not equal to the second value host.
//      * 
//      * @example
//      * ```ts
//      * notEqualTo('fieldname2');
//      * notEqualTo('fieldname2', "Value must not be equal to {value}.");
//      * notEqualTo('fieldname2', "Value must not be same as {SecondLabel}.", "Summary message");
//      * notEqualTo('fieldname2', {
//      *      errorMessage: "Value must not be same as {SecondLabel}.", 
//      *      summaryMessage: "Summary message" });
//      * ```
//      *
//      * @param secondValueHostName - The valueHostName containing the value for the right operand.
//      * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
//      * It can use tokens, which are resolved with current data at the time of validation.
//      * If null, it will expect to be setup by one of several other sources including
//      * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
//      * @param summaryMessage - optional summary message.
// - Optional validator configuration parameters.
//      * @returns The current instance of ValidatorBuilder for method chaining.
//      */
//     notEqualTo(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
//     notEqualTo(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentNotEqualToValidatorConfig): IValidatorBuilder;

//     /**
//      * Alias for notEqualTo
//      * @param secondValueHostName 
//      * @param errorMessage 
//      * @param summaryMessage 
//      */
//     neq(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
//     neq(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentNotEqualToValidatorConfig): IValidatorBuilder;

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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    lessThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    lessThanValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): IValidatorBuilder;

    /**
     * Alias for lessThanValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    ltValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    ltValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): IValidatorBuilder;

//     /**
//      * Adds a validator that ensures the value is less than the second value host.
//      * 
//      * @example
//      * ```ts
//      * lessThan('fieldname2');
//      * lessThan('fieldname2', "Value must be less than {value}.");
//      * lessThan('fieldname2', "Value must be less than {SecondLabel}.", "Summary message");
//      * lessThan('fieldname2', {
//      *      errorMessage: "Value must be less than {SecondLabel}.", 
//      *      summaryMessage: "Summary message" });
//      * ```
//      *
//      * @param secondValueHostName - The valueHostName containing the value for the right operand.
//      * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
//      * It can use tokens, which are resolved with current data at the time of validation.
//      * If null, it will expect to be setup by one of several other sources including
//      * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
//      * @param summaryMessage - optional summary message.
// - Optional validator configuration parameters.
//      * @returns The current instance of ValidatorBuilder for method chaining.
//      */        
//     lessThan(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null,
//         summaryMessage?: string | null): IValidatorBuilder;
//     lessThan(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentLessThanValidatorConfig): IValidatorBuilder;

//     /**
//      * Alias for lessThan
//      * @param secondValueHostName 
//      * @param errorMessage 
//      * @param summaryMessage 
//      */
//     lt(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null,
//         summaryMessage?: string | null): IValidatorBuilder;
//     lt(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentLessThanValidatorConfig): IValidatorBuilder;


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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    lessThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    lessThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): IValidatorBuilder;

    /**
     * Alias for lessThanOrEqualValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    lteValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    lteValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): IValidatorBuilder;

//     /**
//      * Adds a validator that ensures the value is less than or equal to the second value host.
//      * 
//      * @example
//      * ```ts
//      * lessThanOrEqual('fieldname2');
//      * lessThanOrEqual('fieldname2', "Value must be less than or equal to {value}.");
//      * lessThanOrEqual('fieldname2', "Value must be less than or equal to {SecondLabel}.", "Summary message");
//      * lessThanOrEqual('fieldname2', {
//      *      errorMessage: "Value must be less than or equal to {SecondLabel}.", 
//      *      summaryMessage: "Summary message" });
//      * ```
//      *
//      * @param secondValueHostName - The valueHostName containing the value for the right operand.
//      * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
//      * It can use tokens, which are resolved with current data at the time of validation.
//      * If null, it will expect to be setup by one of several other sources including
//      * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
//      * @param summaryMessage - optional summary message.
// - Optional validator configuration parameters.
//      * @returns The current instance of ValidatorBuilder for method chaining.
//      */    
//     lessThanOrEqual(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null,
//         summaryMessage?: string | null): IValidatorBuilder;
//     lessThanOrEqual(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentLessThanOrEqualValidatorConfig): IValidatorBuilder;

//     /**
//      * Alias for lessThanOrEqual
//      * @param secondValueHostName 
//      * @param errorMessage 
//      * @param summaryMessage 
//      */
//     lte(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null,
//         summaryMessage?: string | null): IValidatorBuilder;
//     lte(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentLessThanOrEqualValidatorConfig): IValidatorBuilder;


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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    greaterThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    greaterThanValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): IValidatorBuilder;

    /**
     * Alias for greaterThanValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    gtValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    gtValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): IValidatorBuilder;

//     /**
//      * Adds a validator that ensures the value is greater than the second value host.
//      * 
//      * @example
//      * ```ts
//      * greaterThan('fieldname2');
//      * greaterThan('fieldname2', "Value must be greater than {value}.");
//      * greaterThan('fieldname2', "Value must be greater than {SecondLabel}.", "Summary message");
//      * greaterThan('fieldname2', {
//      *      errorMessage: "Value must be greater than {SecondLabel}.", 
//      *      summaryMessage: "Summary message" });
//      * ```
//      *
//      * @param secondValueHostName - The valueHostName containing the value for the right operand.
//      * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
//      * It can use tokens, which are resolved with current data at the time of validation.
//      * If null, it will expect to be setup by one of several other sources including
//      * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
//      * @param summaryMessage - optional summary message.
// - Optional validator configuration parameters.
//      * @returns The current instance of ValidatorBuilder for method chaining.
//      */        
//     greaterThan(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null,
//         summaryMessage?: string | null): IValidatorBuilder;
//     greaterThan(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentGreaterThanValidatorConfig): IValidatorBuilder;

//     /**
//      * Alias for greaterThan
//      * @param secondValueHostName 
//      * @param errorMessage 
//      * @param summaryMessage 
//      */
//     gt(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null,
//         summaryMessage?: string | null): IValidatorBuilder;
//     gt(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentGreaterThanValidatorConfig): IValidatorBuilder;

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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    greaterThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    greaterThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): IValidatorBuilder;

    /**
     * Alias for greaterThanOrEqualValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    gteValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    gteValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): IValidatorBuilder;


//     /**
//      * Adds a validator that ensures the value is greater than or equal to the second value host.
//      * 
//      * @example
//      * ```ts
//      * greaterThanOrEqual('fieldname2');
//      * greaterThanOrEqual('fieldname2', "Value must be greater than or equal to {value}.");
//      * greaterThanOrEqual('fieldname2', "Value must be greater than or equal to {SecondLabel}.", "Summary message");
//      * greaterThanOrEqual('fieldname2', {
//      *      errorMessage: "Value must be greater than or equal to {SecondLabel}.", 
//      *      summaryMessage: "Summary message" });
//      * ```
//      *
//      * @param secondValueHostName - The valueHostName containing the value for the right operand.
//      * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
//      * It can use tokens, which are resolved with current data at the time of validation.
//      * If null, it will expect to be setup by one of several other sources including
//      * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
//      * @param summaryMessage - optional summary message.
// - Optional validator configuration parameters.
//      * @returns The current instance of ValidatorBuilder for method chaining.
//      */    
//     greaterThanOrEqual(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null,
//         summaryMessage?: string | null): IValidatorBuilder;
//     greaterThanOrEqual(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentGreaterThanOrEqualValidatorConfig): IValidatorBuilder;

//     gte(
//         secondValueHostName: ValueHostName,
//         errorMessage?: string | null,
//         summaryMessage?: string | null): IValidatorBuilder;
//     gte(
//         secondValueHostName: ValueHostName,
//         validatorParameters: FluentGreaterThanOrEqualValidatorConfig): IValidatorBuilder;

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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    stringLength(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    stringLength(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): IValidatorBuilder;

    /**
     * Alias for stringLength
     * @param maximum 
     * @param errorMessage 
     * @param summaryMessage 
     */
    len(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    len(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): IValidatorBuilder;

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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    positive(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    positive(
        validatorParameters: FluentPositiveValidatorConfig): IValidatorBuilder;

    /**
     * Alias for positive
     * @param errorMessage 
     * @param summaryMessage 
     */
    pos(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    pos(
        validatorParameters: FluentPositiveValidatorConfig): IValidatorBuilder;

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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    integer(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    integer(
        validatorParameters: FluentIntegerValidatorConfig): IValidatorBuilder;
    /**
     * Alias for integer
     * @param errorMessage 
     * @param summaryMessage 
     */
    int(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    int(
        validatorParameters: FluentIntegerValidatorConfig): IValidatorBuilder;

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
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    maxDecimals(
        maxDecimals: number,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    maxDecimals(
        maxDecimals: number,
        validatorParameters: FluentMaxDecimalsValidatorConfig): IValidatorBuilder;

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
     * @param childBuilder - The condition builder handler that defines the child condition to be negated.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    not(
        childBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    not(
        childBuilder: ConditionBuilderHandler,
        validatorParameters: FluentNotValidatorConfig): IValidatorBuilder;

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
     * @param whenBuilder - The handler function that defines the condition 
     * under which the validator should be evaluated.
     * @param thenBuilder - The handler function that defines the validation logic 
     * to be executed when the WhenToEnable condition is met.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        validatorParameters: FluentWhenValidatorConfig): IValidatorBuilder;    
    
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
     * @param childrenBuilder - The condition builder handler that defines the child conditions 
     * to be evaluated. Each child condition is defined as a separate call to the child builder handler.
     * They cannot be chained.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    all(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    all(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAllMatchValidatorConfig): IValidatorBuilder;

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
     * @param childrenBuilder - The condition builder handler that defines the child conditions 
     * to be evaluated. Each child condition is defined as a separate call to the child builder handler.
     * They cannot be chained.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    any(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    any(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAnyMatchValidatorConfig): IValidatorBuilder;

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
     * @param childrenBuilder - The condition builder handler that defines the child conditions 
     * to be evaluated. Each child condition is defined as a separate call to the child builder handler.
     * They cannot be chained.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
- Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */            
    countMatches(
        minimum: number | null,
        maximum: number | null,
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    countMatches(
        minimum: number | null,
        maximum: number | null,
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentCountMatchesValidatorConfig): IValidatorBuilder;    
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
//  protected configureRules(builder: IValueHostsManagerConfigBuilder,
//      options?: ValueHostRulesOptions): void {
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
export type OptionalEqualToValueConditionParams = Partial<Omit<EqualToValueConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValue' | 'secondValueHostName'>>;
// export type OptionalEqualToConditionParams = Partial<Omit<EqualToConditionConfig,
//     'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalNotEqualToValueConditionParams = Partial<Omit<NotEqualToValueConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValue' | 'secondValueHostName'>>;
// export type OptionalNotEqualToConditionParams = Partial<Omit<NotEqualToConditionConfig,
//     'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalLessThanValueConditionParams = Partial<Omit<LessThanValueConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValue' | 'secondValueHostName'>>;
    // export type OptionalLessThanConditionParams = Partial<Omit<LessThanConditionConfig,
    //     'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalLessThanOrEqualValueConditionParams = Partial<Omit<LessThanOrEqualValueConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValue' | 'secondValueHostName'>>;
// export type OptionalLessThanOrEqualConditionParams = Partial<Omit<LessThanConditionConfig,
//     'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalGreaterThanValueConditionParams = Partial<Omit<GreaterThanValueConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValue' | 'secondValueHostName'>>;
// export type OptionalGreaterThanConditionParams = Partial<Omit<GreaterThanConditionConfig,
//     'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalGreaterThanOrEqualValueConditionParams = Partial<Omit<GreaterThanOrEqualValueConditionConfig,
    'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValue' | 'secondValueHostName'>>;
// export type OptionalGreaterThanOrEqualConditionParams = Partial<Omit<GreaterThanOrEqualConditionConfig,
//     'conditionType' | /*'valueHostName' |*/ 'category' | 'secondValueHostName'>>;
export type OptionalStringLengthConditionParams = Partial<Omit<StringLengthConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'maximum'>>;

export type FluentDataTypeCheckValidatorConfig = FluentValidatorConfig;
export type FluentRequireTextValidatorConfig = FluentValidatorConfig & OptionalRequireTextConditionParams;
export type FluentNotNullValidatorConfig = FluentValidatorConfig;
export type FluentRegExpValidatorConfig = FluentValidatorConfig & OptionalRegExpConditionParams;
export type FluentRangeValidatorConfig = FluentValidatorConfig;
export type FluentEqualToValueValidatorConfig = OptionalEqualToValueConditionParams & FluentValidatorConfig;
//export type FluentEqualToValidatorConfig = OptionalEqualToConditionParams & FluentValidatorConfig;
export type FluentNotEqualToValueValidatorConfig = OptionalNotEqualToValueConditionParams & FluentValidatorConfig;
//export type FluentNotEqualToValidatorConfig = OptionalNotEqualToConditionParams & FluentValidatorConfig;
export type FluentLessThanValueValidatorConfig = OptionalLessThanValueConditionParams & FluentValidatorConfig;
//export type FluentLessThanValidatorConfig = OptionalLessThanConditionParams & FluentValidatorConfig;
export type FluentLessThanOrEqualValueValidatorConfig = OptionalLessThanOrEqualValueConditionParams & FluentValidatorConfig;
//export type FluentLessThanOrEqualValidatorConfig = OptionalLessThanOrEqualConditionParams & FluentValidatorConfig;
export type FluentGreaterThanValueValidatorConfig = OptionalGreaterThanValueConditionParams & FluentValidatorConfig;
//export type FluentGreaterThanValidatorConfig = OptionalGreaterThanConditionParams & FluentValidatorConfig;
export type FluentGreaterThanOrEqualValueValidatorConfig = OptionalGreaterThanOrEqualValueConditionParams & FluentValidatorConfig;
//export type FluentGreaterThanOrEqualValidatorConfig = OptionalGreaterThanOrEqualConditionParams & FluentValidatorConfig;
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
     * @param whenToEnableCallback - The callback that defines the "when" condition.
     * @param thenCallback - The callback that defines the "then" condition.
     */
    when(whenToEnableCallback: ConditionBuilderHandler, thenCallback: ConditionBuilderHandler): void;

    /**
     * Considers a match to be when all child conditions match. If any child does not match, the parent does not match.
     * If any child is undetermined, the parent ignores it.
     * If no child conditions are supplied or all child conditions are undetermined, the parent is undetermined.
     * @param callback - The callback that defines the child conditions to be evaluated. Each child condition is defined as a separate call to the callback.
     */
    all(callback: ConditionWithChildrenBuilderHandler): void;

    /**
     * Considers a match to be when any child condition matches. 
     * If all child conditions do not match, the parent does not match.
     * If any child is undetermined, the parent ignores it.
     * If no child conditions are supplied or all child conditions are undetermined, the parent is undetermined.
     * @param callback - The callback that defines the child conditions to be evaluated. Each child condition is defined as a separate call to the callback.
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
     * @param callback - The callback that defines the child conditions to be evaluated. Each child condition is defined as a separate call to the callback.
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

    // /**
    //  * Creates a configuration for the EqualToCondition.
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the EqualTo condition.
    //  */
    // equalTo(
    //     secondValueHostName: ValueHostName,
    //     conditionConfig?: OptionalEqualToConditionParams): void;
    // /**
    //  * Creates a configuration for the EqualToCondition using an alias to equalTo()
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the EqualTo condition.
    //  */
    // eq(secondValueHostName: ValueHostName, conditionConfig?: OptionalEqualToConditionParams): void;

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
    // /**
    //  * Creates a configuration for the NotEqualToCondition.
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the NotEqualTo condition.
    //  */
    // notEqualTo(
    //     secondValueHostName: ValueHostName,
    //     conditionConfig?: OptionalNotEqualToConditionParams): void;

    // /**
    //  * Creates a configuration for the NotEqualToCondition using an alias to notEqualTo()
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the NotEqualTo condition.
    //  */
    // neq(secondValueHostName: ValueHostName, conditionConfig?: OptionalNotEqualToConditionParams): void;
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

    // /**
    //  * Creates a configuration for the LessThanCondition.
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the LessThan condition.
    //  */
    // lessThan(
    //     secondValueHostName: ValueHostName,
    //     conditionConfig?: OptionalLessThanConditionParams): void;

    // /**
    //  * Creates a configuration for the LessThanCondition using an alias to lessThan()
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the LessThan condition.
    //  */
    // lt(secondValueHostName: ValueHostName, conditionConfig?: OptionalLessThanConditionParams): void;

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
    // /**
    //  * Creates a configuration for the LessThanOrEqualCondition.
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the LessThanOrEqual condition.
    //  */
    // lessThanOrEqual(
    //     secondValueHostName: ValueHostName,
    //     conditionConfig?: OptionalLessThanOrEqualConditionParams): void;

    // /**
    //  * Creates a configuration for the LessThanOrEqualCondition using an alias to lessThanOrEqual()
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the LessThanOrEqual condition.
    //  */
    // lte(secondValueHostName: ValueHostName, conditionConfig?: OptionalLessThanOrEqualConditionParams): void;

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

    // /**
    //  * Creates a configuration for the GreaterThanCondition.
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the GreaterThan condition.
    //  */
    // greaterThan(
    //     secondValueHostName: ValueHostName,
    //     conditionConfig?: OptionalGreaterThanConditionParams): void;

    // /**
    //  * Creates a configuration for the GreaterThanCondition using an alias to greaterThan()
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the GreaterThan condition.
    //  */
    // gt(secondValueHostName: ValueHostName, conditionConfig?: OptionalGreaterThanConditionParams): void;
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
    
    // /**
    //  * Creates configuration for the GreaterThanOrEqualCondition.
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqual condition.
    //  */
    // greaterThanOrEqual(
    //     secondValueHostName: ValueHostName,
    //     conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void;

    // /**
    //  * Creates a configuration for the GreaterThanOrEqualCondition using an alias to greaterThanOrEqual()
    //  * @param secondValueHostName - The host name of the second value to compare against.
    //  * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqual condition.
    //  */
    // gte(secondValueHostName: ValueHostName, conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void;

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
export type ConditionBuilderHandler = (childrenBuilder: IStartConditionBuilder) => void;
export type ConditionWithChildrenBuilderHandler =
    (childrenBuilder: IStartConditionWithChildrenBuilder) => void;

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

